//! Source-only conveniences normalize into ordinary modules before linking.
use super::*;

fn text(value: &str, mark: Marker) -> Node {
    Node {
        shape: Shape::Scalar(value.into(), true),
        mark,
    }
}
fn mapping(values: Vec<(&str, Node)>, mark: Marker) -> Node {
    Node {
        shape: Shape::Mapping(
            values
                .into_iter()
                .map(|(key, value)| (text(key, mark), value))
                .collect(),
        ),
        mark,
    }
}
fn sequence(values: Vec<Node>, mark: Marker) -> Node {
    Node {
        shape: Shape::Sequence(values),
        mark,
    }
}

pub(super) fn decode(path: &str, root: Node) -> Result<Vec<Module>, Diagnostic> {
    let catalog = matches!(&root.shape, Shape::Mapping(fields) if optional_field(fields,"kind").is_some_and(|node| node.text(path).is_ok_and(|kind| kind == "catalog")));
    if !catalog {
        return modules(path, root);
    }
    let fields = root.mapping(path, &["format", "kind", "declarations"])?;
    let format = root.field(path, fields, "format")?;
    format.literal(path, "nkdk-declarations/1", "unsupported_format")?;
    let declarations = root.field(path, fields, "declarations")?;
    let Shape::Sequence(entries) = &declarations.shape else {
        return Err(error(
            path,
            declarations.mark,
            "expected_sequence",
            "Catalog declarations must be a list",
        ));
    };
    if entries.is_empty() {
        return Err(error(
            path,
            declarations.mark,
            "empty_catalog",
            "A catalog must contain declarations",
        ));
    }
    entries
        .iter()
        .map(|entry| {
            let mut entry = entry.clone();
            let Shape::Mapping(fields) = &mut entry.shape else {
                return Err(error(
                    path,
                    entry.mark,
                    "expected_mapping",
                    "Expected a declaration",
                ));
            };
            if optional_field(fields, "format").is_none() {
                fields.push((text("format", entry.mark), format.clone()));
            }
            modules(path, entry)
        })
        .collect::<Result<Vec<_>, _>>()
        .map(|modules| modules.into_iter().flatten().collect())
}

pub(super) fn expand_enum(path: &str, root: &mut Node) -> Result<(), Diagnostic> {
    let Shape::Mapping(fields) = &mut root.shape else {
        return Ok(());
    };
    let Some(table) = optional_field(fields, "enum").cloned() else {
        return Ok(());
    };
    if optional_field(fields, "value").is_some()
        || optional_field(fields, "representations").is_some()
    {
        return Err(error(
            path,
            table.mark,
            "ambiguous_enum_declaration",
            "Use either enum shorthand or explicit value and representations",
        ));
    }
    let Shape::Mapping(items) = &table.shape else {
        return Err(error(
            path,
            table.mark,
            "expected_mapping",
            "Expected an enum map",
        ));
    };
    let mut variants = vec![];
    let mut xml = vec![];
    let mut yaml = vec![];
    for (value, declaration) in items {
        value.text(path)?;
        let (yaml_name, xml_name, accepted) = if matches!(declaration.shape, Shape::Mapping(_)) {
            let members = declaration.mapping(path, &["yaml", "xml", "accept"])?;
            let yaml = declaration.field(path, members, "yaml")?;
            let xml = optional_field(members, "xml").unwrap_or(value);
            (
                yaml.clone(),
                xml.clone(),
                optional_field(members, "accept").cloned(),
            )
        } else {
            (declaration.clone(), value.clone(), None)
        };
        yaml_name.text(path)?;
        xml_name.text(path)?;
        variants.push(mapping(
            vec![("name", value.clone()), ("value", value.clone())],
            value.mark,
        ));
        let mut spelling = vec![("value", value.clone()), ("text", xml_name)];
        if let Some(accepted) = accepted {
            spelling.push(("accept", accepted));
        }
        xml.push(mapping(spelling, value.mark));
        yaml.push(mapping(
            vec![("value", value.clone()), ("literal", yaml_name)],
            value.mark,
        ));
    }
    fields.retain(|(key, _)| key.text(path).is_ok_and(|key| key != "enum"));
    fields.push((
        text("value", table.mark),
        mapping(
            vec![
                ("kind", text("enum", table.mark)),
                ("variants", sequence(variants, table.mark)),
            ],
            table.mark,
        ),
    ));
    fields.push((
        text("representations", table.mark),
        mapping(
            vec![
                (
                    "xml",
                    mapping(
                        vec![
                            ("kind", text("text", table.mark)),
                            ("values", sequence(xml, table.mark)),
                        ],
                        table.mark,
                    ),
                ),
                (
                    "yaml",
                    mapping(
                        vec![
                            ("kind", text("scalar", table.mark)),
                            ("values", sequence(yaml, table.mark)),
                        ],
                        table.mark,
                    ),
                ),
            ],
            table.mark,
        ),
    ));
    Ok(())
}

fn modules(path: &str, mut root: Node) -> Result<Vec<Module>, Diagnostic> {
    let profiles = if let Shape::Mapping(fields) = &mut root.shape {
        let profiles = optional_field(fields, "projections").cloned();
        fields.retain(|(key, _)| key.text(path).is_ok_and(|key| key != "projections"));
        profiles
    } else {
        None
    };
    expand_enum(path, &mut root)?;
    let base = super::module(path, root.clone())?;
    let mut result = vec![base];
    let Some(profiles) = profiles else {
        return Ok(result);
    };
    if !matches!(result[0].value, TypeDefinition::Enum(_)) || result[0].kind != ModuleKind::Value {
        return Err(error(
            path,
            profiles.mark,
            "unsupported_projections",
            "Static projections require an enum common",
        ));
    }
    let Shape::Sequence(profiles) = profiles.shape else {
        return Err(error(
            path,
            profiles.mark,
            "expected_sequence",
            "Expected projections",
        ));
    };
    let Shape::Mapping(base_fields) = &root.shape else {
        unreachable!()
    };
    let value = root.field(path, base_fields, "value")?;
    let Shape::Mapping(value_fields) = &value.shape else {
        unreachable!()
    };
    let variants = value.field(path, value_fields, "variants")?;
    let Shape::Sequence(variants) = &variants.shape else {
        unreachable!()
    };
    let identity = variants
        .iter()
        .map(|variant| {
            let fields = variant.mapping(path, &["name", "value"])?;
            let value = variant.field(path, fields, "value")?;
            let meaning = value.text(path)?;
            let lexical = enum_table(&result[0].representations.xml)
                .iter()
                .find(|lexical| lexical.value == meaning)
                .ok_or_else(|| {
                    error(
                        path,
                        value.mark,
                        "incomplete_enum_projection",
                        "The base XML table must cover every semantic variant",
                    )
                })?;
            let accepted = std::iter::once(&lexical.text)
                .chain(&lexical.accepted)
                .filter(|spelling| spelling.as_str() != meaning)
                .map(|spelling| text(spelling, value.mark))
                .collect::<Vec<_>>();
            let mut fields = vec![("value", value.clone()), ("text", value.clone())];
            if !accepted.is_empty() {
                fields.push(("accept", sequence(accepted, value.mark)));
            }
            Ok(mapping(fields, value.mark))
        })
        .collect::<Result<Vec<_>, Diagnostic>>()?;
    for profile in profiles {
        let fields = profile.mapping(path, &["id", "xml", "yaml"])?;
        let id = profile.field(path, fields, "id")?.clone();
        let yaml = optional_field(fields, "yaml");
        let xml = optional_field(fields, "xml")
            .map(|xml| {
                let mut xml = xml.clone();
                if xml_kind(path, &xml)? == Some("yaml-text") {
                    let Shape::Mapping(root_fields) = &root.shape else {
                        unreachable!()
                    };
                    let representations = root.field(path, root_fields, "representations")?;
                    let representations = representations.mapping(path, &["xml", "yaml"])?;
                    let mut yaml_values = representations
                        .iter()
                        .find(|(key, _)| key.text(path).is_ok_and(|key| key == "yaml"))
                        .expect("expanded enum has YAML representation")
                        .1
                        .clone();
                    if let Some(projection) = yaml {
                        override_yaml_spellings(path, &mut yaml_values, projection)?;
                    }
                    xml = xml_from_yaml_spellings(path, &xml, &yaml_values)?;
                } else {
                    identity_spelling(path, &mut xml, &identity)?;
                }
                Ok::<_, Diagnostic>(xml)
            })
            .transpose()?;
        if xml.is_none() && yaml.is_none() {
            return Err(error(
                path,
                profile.mark,
                "missing_key",
                "Projection needs xml or yaml",
            ));
        }
        let mut view = root.clone();
        let Shape::Mapping(fields) = &mut view.shape else {
            unreachable!()
        };
        for (key, value) in fields {
            match key.text(path)? {
                "id" => *value = id.clone(),
                "representations" => {
                    let Shape::Mapping(fields) = &mut value.shape else {
                        unreachable!()
                    };
                    for (key, value) in fields {
                        match key.text(path)? {
                            "xml" => {
                                if let Some(xml) = &xml {
                                    *value = xml.clone();
                                }
                            }
                            "yaml" => {
                                if let Some(yaml) = yaml {
                                    override_yaml_spellings(path, value, yaml)?;
                                }
                            }
                            _ => (),
                        }
                    }
                }
                _ => (),
            }
        }
        result.push(super::module(path, view)?);
    }
    Ok(result)
}

fn xml_kind<'a>(path: &str, xml: &'a Node) -> Result<Option<&'a str>, Diagnostic> {
    let Shape::Mapping(fields) = &xml.shape else {
        return Err(error(
            path,
            xml.mark,
            "expected_mapping",
            "Expected XML projection",
        ));
    };
    optional_field(fields, "kind")
        .map(|value| value.text(path))
        .transpose()
}

fn xml_from_yaml_spellings(path: &str, xml: &Node, yaml: &Node) -> Result<Node, Diagnostic> {
    xml.mapping(path, &["kind"])?;
    let fields = yaml.mapping(path, &["kind", "values"])?;
    let values = yaml.field(path, fields, "values")?;
    let Shape::Sequence(rows) = &values.shape else {
        return Err(error(
            path,
            values.mark,
            "expected_sequence",
            "Expected YAML enum values",
        ));
    };
    let values = rows
        .iter()
        .map(|row| {
            let fields = row.mapping(path, &["value", "literal"])?;
            Ok(mapping(
                vec![
                    ("value", row.field(path, fields, "value")?.clone()),
                    ("text", row.field(path, fields, "literal")?.clone()),
                ],
                row.mark,
            ))
        })
        .collect::<Result<Vec<_>, Diagnostic>>()?;
    Ok(mapping(
        vec![
            ("kind", text("text", xml.mark)),
            ("values", sequence(values, xml.mark)),
        ],
        xml.mark,
    ))
}

fn override_yaml_spellings(
    path: &str,
    yaml: &mut Node,
    projection: &Node,
) -> Result<(), Diagnostic> {
    let settings = projection.mapping(path, &["overrides"])?;
    let overrides = projection.field(path, settings, "overrides")?;
    let Shape::Mapping(changes) = &overrides.shape else {
        return Err(error(
            path,
            overrides.mark,
            "expected_mapping",
            "YAML overrides must be a map",
        ));
    };
    let yaml_fields = yaml.mapping(path, &["kind", "values"])?;
    let values = yaml.field(path, yaml_fields, "values")?;
    let Shape::Sequence(base_values) = &values.shape else {
        return Err(error(
            path,
            values.mark,
            "expected_sequence",
            "YAML enum values must be a list",
        ));
    };
    let mut rows = base_values.clone();
    for (variant, spelling) in changes {
        let variant_name = variant.text(path)?;
        spelling.text(path)?;
        let mut found = false;
        for row in &mut rows {
            let Shape::Mapping(fields) = &mut row.shape else {
                unreachable!()
            };
            let selected = fields.iter().any(|(key, value)| {
                key.text(path).is_ok_and(|key| key == "value")
                    && value.text(path).is_ok_and(|value| value == variant_name)
            });
            if selected {
                for (key, value) in fields {
                    if key.text(path)? == "literal" {
                        *value = spelling.clone();
                        found = true;
                        break;
                    }
                }
                break;
            }
        }
        if !found {
            return Err(error(
                path,
                variant.mark,
                "enum_projection_unknown_variant",
                "YAML override names an unknown enum variant",
            ));
        }
    }
    let mut seen = std::collections::BTreeSet::new();
    for row in &rows {
        let fields = row.mapping(path, &["value", "literal"])?;
        let literal = row.field(path, fields, "literal")?;
        if !seen.insert(literal.text(path)?) {
            return Err(error(
                path,
                literal.mark,
                "enum_projection_collision",
                "YAML projection spellings must be unique",
            ));
        }
    }
    let Shape::Mapping(yaml_fields) = &mut yaml.shape else {
        unreachable!()
    };
    for (key, value) in yaml_fields {
        if key.text(path)? == "values" {
            *value = sequence(rows, value.mark);
            break;
        }
    }
    Ok(())
}

fn identity_spelling(path: &str, xml: &mut Node, identity: &[Node]) -> Result<(), Diagnostic> {
    let Shape::Mapping(fields) = &mut xml.shape else {
        return Err(error(
            path,
            xml.mark,
            "expected_mapping",
            "Expected XML projection",
        ));
    };
    match optional_field(fields, "kind")
        .map(|node| node.text(path))
        .transpose()?
    {
        Some("text") if optional_field(fields, "values").is_none() => {
            fields.push((
                text("values", xml.mark),
                sequence(identity.to_vec(), xml.mark),
            ));
        }
        Some("with-attributes") => {
            let Some((_, content)) = fields
                .iter_mut()
                .find(|(key, _)| key.text(path).is_ok_and(|key| key == "content"))
            else {
                return Err(error(path, xml.mark, "missing_key", "Missing content"));
            };
            identity_spelling(path, content, identity)?;
        }
        _ => (),
    }
    Ok(())
}

fn enum_table(xml: &XmlRepresentation) -> &[nkdk_rule_model::EnumLexeme] {
    match xml {
        XmlRepresentation::EnumTable(values) => values,
        XmlRepresentation::WithAttributes { content, .. } => enum_table(content),
        _ => &[],
    }
}
