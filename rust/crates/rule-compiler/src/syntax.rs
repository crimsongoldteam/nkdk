use nkdk_rule_model::Normalization;
use nkdk_rule_model::{
    BooleanLexeme, Diagnostic, Module, ModuleKind, NamedBinding, NamedType, Representations,
    ScalarType, SourceLocation, TypeDefinition, TypeField, XmlRepresentation, YamlRepresentation,
};
use nkdk_rule_model::{CanonicalForm, Presence, PresenceTarget, XmlForm};
use nkdk_rule_model::{EmptyForm, EmptyKind};
use nkdk_rule_model::{
    Expression, ExpressionField, ExpressionKind, Parameter, ScalarLiteral, Shorthand,
};
use nkdk_rule_model::{StaticArgument, TypeUse};
use nkdk_rule_model::{XmlField, YamlField};
use yaml_rust2::{
    parser::Event,
    scanner::{Marker, TScalarStyle},
};

enum Shape {
    Scalar(String, bool),
    Mapping(Vec<(Node, Node)>),
    Sequence(Vec<Node>),
}
struct Node {
    shape: Shape,
    mark: Marker,
}

fn error(path: &str, mark: Marker, code: &str, message: impl Into<String>) -> Diagnostic {
    Diagnostic {
        code: code.into(),
        file: path.into(),
        line: mark.line(),
        column: mark.col() + 1,
        message: message.into(),
        related: vec![],
    }
}

fn node(
    path: &str,
    events: &mut std::iter::Peekable<std::vec::IntoIter<(Event, Marker)>>,
) -> Result<Node, Diagnostic> {
    // The event stream has already passed the syntax and key audit.
    let (event, mark) = events.next().expect("audited node event");
    let shape = match event {
        Event::Scalar(value, style, ..) => {
            let is_string = style != TScalarStyle::Plain
                || (!matches!(value.as_str(), "Null" | "NULL")
                    && matches!(
                        yaml_rust2::Yaml::from_str(&value),
                        yaml_rust2::Yaml::String(_)
                    ));
            Shape::Scalar(value, is_string)
        }
        Event::MappingStart(..) => {
            let mut entries = vec![];
            while !matches!(events.peek(), Some((Event::MappingEnd, _))) {
                let key = node(path, events)?;
                let value = node(path, events)?;
                entries.push((key, value));
            }
            events.next();
            Shape::Mapping(entries)
        }
        Event::SequenceStart(..) => {
            let mut items = vec![];
            while !matches!(events.peek(), Some((Event::SequenceEnd, _))) {
                items.push(node(path, events)?);
            }
            events.next();
            Shape::Sequence(items)
        }
        _ => {
            return Err(error(
                path,
                mark,
                "expected_node",
                "Expected a declaration node",
            ));
        }
    };
    Ok(Node { shape, mark })
}

impl Node {
    fn mapping<'a>(
        &'a self,
        path: &str,
        allowed: &[&str],
    ) -> Result<&'a [(Node, Node)], Diagnostic> {
        let Shape::Mapping(entries) = &self.shape else {
            return Err(error(
                path,
                self.mark,
                "expected_mapping",
                "Expected a mapping",
            ));
        };
        for (key, _) in entries {
            let name = key.text(path)?;
            if !allowed.contains(&name) {
                return Err(error(
                    path,
                    key.mark,
                    "unknown_key",
                    format!("Unknown key: {name}"),
                ));
            }
        }
        Ok(entries)
    }
    fn text<'a>(&'a self, path: &str) -> Result<&'a str, Diagnostic> {
        match &self.shape {
            Shape::Scalar(value, true) => Ok(value),
            Shape::Scalar(_, false) => Err(error(
                path,
                self.mark,
                "expected_string",
                "Expected a string without implicit coercion",
            )),
            _ => Err(error(
                path,
                self.mark,
                "expected_scalar",
                "Expected a scalar",
            )),
        }
    }
    fn field<'a>(
        &self,
        path: &str,
        entries: &'a [(Node, Node)],
        name: &str,
    ) -> Result<&'a Node, Diagnostic> {
        entries
            .iter()
            .find_map(|(key, value)| match &key.shape {
                Shape::Scalar(text, _) if text == name => Some(value),
                _ => None,
            })
            .ok_or_else(|| {
                error(
                    path,
                    self.mark,
                    "missing_key",
                    format!("Missing key: {name}"),
                )
            })
    }
    fn literal(&self, path: &str, expected: &str, code: &str) -> Result<(), Diagnostic> {
        if self.text(path)? != expected {
            return Err(error(path, self.mark, code, format!("Expected {expected}")));
        }
        Ok(())
    }
}

pub fn decode(path: &str, events: Vec<(Event, Marker)>) -> Result<Module, Diagnostic> {
    let mut events = events.into_iter().peekable();
    while matches!(
        events.peek(),
        Some((Event::StreamStart | Event::DocumentStart, _))
    ) {
        events.next();
    }
    let Some((at_end, mark)) = events
        .peek()
        .map(|(event, mark)| (matches!(event, Event::StreamEnd), *mark))
    else {
        return Err(Diagnostic {
            code: "empty_document".into(),
            file: path.into(),
            line: 1,
            column: 1,
            message: "Expected a declaration".into(),
            related: vec![],
        });
    };
    if at_end {
        return Err(error(
            path,
            mark,
            "empty_document",
            "Expected a declaration",
        ));
    }
    let root = node(path, &mut events)?;
    let fields = root.mapping(
        path,
        &[
            "format",
            "kind",
            "id",
            "description",
            "imports",
            "namespaces",
            "types",
            "inputs",
            "parameters",
            "presence",
            "normalization",
            "value",
            "representations",
        ],
    )?;
    root.field(path, fields, "format")?.literal(
        path,
        "nkdk-declarations/1",
        "unsupported_format",
    )?;
    let kind_node = root.field(path, fields, "kind")?;
    let kind = match kind_node.text(path)? {
        "value" => ModuleKind::Value,
        "fragment" => ModuleKind::Fragment,
        "object" => ModuleKind::Object,
        _ => {
            return Err(error(
                path,
                kind_node.mark,
                "unsupported_kind",
                "Expected value, fragment or object",
            ));
        }
    };
    let id_node = root.field(path, fields, "id")?;
    let id = id_node.text(path)?;
    if id.is_empty() {
        return Err(error(
            path,
            id_node.mark,
            "empty_id",
            "Declaration id must not be empty",
        ));
    }
    let value = root.field(path, fields, "value")?;
    let definition = type_definition(path, value)?;
    if kind != ModuleKind::Value && !matches!(definition, TypeDefinition::Record(_)) {
        return Err(error(
            path,
            value.mark,
            "expected_record",
            "Object and fragment require a record value",
        ));
    }
    let representations = root.field(path, fields, "representations")?;
    let rep_fields = representations.mapping(path, &["xml", "yaml"])?;
    let xml = representations.field(path, rep_fields, "xml")?;
    let yaml = representations.field(path, rep_fields, "yaml")?;
    let (xml_rep, yaml_rep) = match &definition {
        TypeDefinition::Scalar(ScalarType::Text) => {
            let xml_fields = xml.mapping(path, &["kind"])?;
            xml.field(path, xml_fields, "kind")?.literal(
                path,
                "text",
                "unsupported_representation",
            )?;
            let yaml_fields = yaml.mapping(path, &["kind", "scalar"])?;
            yaml.field(path, yaml_fields, "kind")?.literal(
                path,
                "scalar",
                "unsupported_representation",
            )?;
            yaml.field(path, yaml_fields, "scalar")?
                .literal(path, "text", "unsupported_scalar")?;
            (XmlRepresentation::Text, YamlRepresentation::Text)
        }
        TypeDefinition::Scalar(ScalarType::Boolean) => (
            XmlRepresentation::BooleanTable(boolean_table(path, xml, "text", "text")?),
            YamlRepresentation::BooleanTable(boolean_table(path, yaml, "scalar", "literal")?),
        ),
        TypeDefinition::Record(_) => (
            XmlRepresentation::Record(xml_fields(path, xml)?),
            YamlRepresentation::Mapping(yaml_fields(path, yaml)?),
        ),
        TypeDefinition::Sequence(_) => {
            (xml_collection(path, xml)?, yaml_keyed_mapping(path, yaml)?)
        }
        _ => {
            return Err(error(
                path,
                value.mark,
                "unsupported_type",
                "Main type representation is not implemented yet",
            ));
        }
    };
    let description = fields
        .iter()
        .find_map(|(key, value)| match &key.shape {
            Shape::Scalar(name, _) if name == "description" => Some(value),
            _ => None,
        })
        .map(|value| value.text(path).map(str::to_owned))
        .transpose()?;
    Ok(Module {
        kind,
        id: id.into(),
        description,
        imports: named_bindings(path, fields, "imports")?,
        namespaces: named_bindings(path, fields, "namespaces")?,
        types: named_types(path, fields)?,
        inputs: named_inputs(path, fields)?,
        parameters: parameters(path, fields)?,
        presence: presence(path, fields)?,
        normalization: normalization(path, fields)?,
        value: definition,
        representations: Representations {
            xml: xml_rep,
            yaml: yaml_rep,
        },
    })
}

fn boolean_table(
    path: &str,
    representation: &Node,
    kind: &str,
    spelling: &str,
) -> Result<Vec<BooleanLexeme>, Diagnostic> {
    let fields = representation.mapping(path, &["kind", "values"])?;
    representation.field(path, fields, "kind")?.literal(
        path,
        kind,
        "unsupported_representation",
    )?;
    let values = representation.field(path, fields, "values")?;
    let Shape::Sequence(items) = &values.shape else {
        return Err(error(
            path,
            values.mark,
            "expected_sequence",
            "Expected a values sequence",
        ));
    };
    items
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["value", spelling])?;
            let semantic = item.field(path, fields, "value")?;
            let value = match &semantic.shape {
                Shape::Scalar(text, false) => match yaml_rust2::Yaml::from_str(text) {
                    yaml_rust2::Yaml::Boolean(value) => value,
                    _ => {
                        return Err(error(
                            path,
                            semantic.mark,
                            "expected_boolean",
                            "Expected a boolean literal",
                        ));
                    }
                },
                _ => {
                    return Err(error(
                        path,
                        semantic.mark,
                        "expected_boolean",
                        "Expected a boolean literal",
                    ));
                }
            };
            let text = item.field(path, fields, spelling)?.text(path)?.to_owned();
            Ok(BooleanLexeme { value, text })
        })
        .collect()
}

fn named_bindings(
    path: &str,
    fields: &[(Node, Node)],
    section: &str,
) -> Result<Vec<NamedBinding>, Diagnostic> {
    let Some(value) = fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(name, _) if name == section => Some(value),
        _ => None,
    }) else {
        return Ok(vec![]);
    };
    let Shape::Mapping(entries) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_mapping",
            "Expected named bindings",
        ));
    };
    entries
        .iter()
        .map(|(key, value)| {
            Ok(NamedBinding {
                name: key.text(path)?.into(),
                value: value.text(path)?.into(),
                source: SourceLocation {
                    file: path.into(),
                    line: key.mark.line(),
                    column: key.mark.col() + 1,
                },
            })
        })
        .collect()
}

fn location(path: &str, node: &Node) -> SourceLocation {
    SourceLocation {
        file: path.into(),
        line: node.mark.line(),
        column: node.mark.col() + 1,
    }
}

fn named_types(path: &str, fields: &[(Node, Node)]) -> Result<Vec<NamedType>, Diagnostic> {
    let Some(value) = fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(name, _) if name == "types" => Some(value),
        _ => None,
    }) else {
        return Ok(vec![]);
    };
    let Shape::Mapping(entries) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_mapping",
            "Expected local types",
        ));
    };
    entries
        .iter()
        .map(|(key, value)| {
            Ok(NamedType {
                name: key.text(path)?.into(),
                definition: type_definition(path, value)?,
                source: location(path, key),
            })
        })
        .collect()
}

fn type_definition(path: &str, value: &Node) -> Result<TypeDefinition, Diagnostic> {
    let fields = value.mapping(
        path,
        &[
            "kind", "scalar", "fields", "item", "local", "use", "with", "bind",
        ],
    )?;
    for (key, _) in fields {
        let name = key.text(path)?;
        if name == "local" || name == "use" {
            if name == "local" {
                value.mapping(path, &["local"])?;
                return Ok(TypeDefinition::Local(
                    value.field(path, fields, "local")?.text(path)?.into(),
                ));
            }
            value.mapping(path, &["use", "with", "bind"])?;
            let target = value.field(path, fields, "use")?;
            let arguments = named_nodes(path, optional_field(fields, "with"))?
                .iter()
                .map(|(key, value)| {
                    Ok(StaticArgument {
                        name: key.text(path)?.into(),
                        value: scalar_literal(path, value)?,
                        source: location(path, key),
                    })
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            let bindings = named_nodes(path, optional_field(fields, "bind"))?
                .iter()
                .map(|(key, value)| {
                    Ok(ExpressionField {
                        name: key.text(path)?.into(),
                        value: expression(path, value)?,
                    })
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            return Ok(TypeDefinition::Use(TypeUse {
                name: target.text(path)?.into(),
                arguments,
                bindings,
                source: location(path, target),
            }));
        }
    }
    let kind = value.field(path, fields, "kind")?;
    match kind.text(path)? {
        "scalar" => {
            value.mapping(path, &["kind", "scalar"])?;
            let scalar = value.field(path, fields, "scalar")?;
            let scalar = match scalar.text(path)? {
                "text" => ScalarType::Text,
                "boolean" => ScalarType::Boolean,
                _ => {
                    return Err(error(
                        path,
                        scalar.mark,
                        "unsupported_scalar",
                        "Unsupported scalar type",
                    ));
                }
            };
            Ok(TypeDefinition::Scalar(scalar))
        }
        "sequence" => {
            value.mapping(path, &["kind", "item"])?;
            Ok(TypeDefinition::Sequence(Box::new(type_definition(
                path,
                value.field(path, fields, "item")?,
            )?)))
        }
        "record" => {
            value.mapping(path, &["kind", "fields"])?;
            let members = value.field(path, fields, "fields")?;
            let Shape::Sequence(members_list) = &members.shape else {
                return Err(error(
                    path,
                    members.mark,
                    "expected_sequence",
                    "Expected record fields",
                ));
            };
            let members = members_list
                .iter()
                .map(|member| {
                    let fields = member.mapping(path, &["name", "type"])?;
                    let name = member.field(path, fields, "name")?;
                    Ok(TypeField {
                        name: name.text(path)?.into(),
                        definition: type_definition(path, member.field(path, fields, "type")?)?,
                        source: location(path, name),
                    })
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            Ok(TypeDefinition::Record(members))
        }
        _ => Err(error(
            path,
            kind.mark,
            "unsupported_type",
            "Unsupported type kind",
        )),
    }
}

fn representation_fields<'a>(
    path: &str,
    representation: &'a Node,
    kind: &str,
) -> Result<&'a [Node], Diagnostic> {
    let fields = representation.mapping(path, &["kind", "fields"])?;
    representation.field(path, fields, "kind")?.literal(
        path,
        kind,
        "unsupported_representation",
    )?;
    let members = representation.field(path, fields, "fields")?;
    match &members.shape {
        Shape::Sequence(items) => Ok(items),
        _ => Err(error(
            path,
            members.mark,
            "expected_sequence",
            "Expected representation fields",
        )),
    }
}

fn xml_fields(path: &str, representation: &Node) -> Result<Vec<XmlField>, Diagnostic> {
    representation_fields(path, representation, "record")?
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["field", "path"])?;
            let name = item.field(path, fields, "field")?;
            let route = item.field(path, fields, "path")?;
            let Shape::Sequence(segments) = &route.shape else {
                return Err(error(
                    path,
                    route.mark,
                    "expected_sequence",
                    "Expected XML path",
                ));
            };
            let segments = segments
                .iter()
                .map(|segment| segment.text(path).map(str::to_owned))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(XmlField {
                field: name.text(path)?.into(),
                path: segments,
                source: location(path, name),
            })
        })
        .collect()
}

fn yaml_fields(path: &str, representation: &Node) -> Result<Vec<YamlField>, Diagnostic> {
    representation_fields(path, representation, "mapping")?
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["field", "key"])?;
            let name = item.field(path, fields, "field")?;
            Ok(YamlField {
                field: name.text(path)?.into(),
                key: item.field(path, fields, "key")?.text(path)?.into(),
                source: location(path, name),
            })
        })
        .collect()
}

fn xml_collection(path: &str, representation: &Node) -> Result<XmlRepresentation, Diagnostic> {
    let fields = representation.mapping(path, &["kind", "path", "item", "fields"])?;
    let kind = representation.field(path, fields, "kind")?;
    if kind.text(path)? == "record" {
        return Ok(XmlRepresentation::Record(xml_fields(path, representation)?));
    }
    representation.mapping(path, &["kind", "path", "item"])?;
    kind.literal(path, "element-sequence", "unsupported_representation")?;
    let route = representation.field(path, fields, "path")?;
    let Shape::Sequence(segments) = &route.shape else {
        return Err(error(
            path,
            route.mark,
            "expected_sequence",
            "Expected XML path",
        ));
    };
    let segments = segments
        .iter()
        .map(|node| node.text(path).map(str::to_owned))
        .collect::<Result<Vec<_>, _>>()?;
    let item = xml_collection(path, representation.field(path, fields, "item")?)?;
    Ok(XmlRepresentation::ElementSequence {
        path: segments,
        item: Box::new(item),
    })
}

fn yaml_keyed_mapping(path: &str, representation: &Node) -> Result<YamlRepresentation, Diagnostic> {
    let fields = representation.mapping(path, &["kind", "key", "value", "shorthand"])?;
    representation.field(path, fields, "kind")?.literal(
        path,
        "keyed-mapping",
        "unsupported_representation",
    )?;
    let shorthand = fields
        .iter()
        .find_map(|(key, value)| match &key.shape {
            Shape::Scalar(name, _) if name == "shorthand" => Some(value),
            _ => None,
        })
        .map(|value| shorthands(path, value))
        .transpose()?
        .unwrap_or_default();
    Ok(YamlRepresentation::KeyedMapping {
        shorthand,
        key: representation
            .field(path, fields, "key")?
            .text(path)?
            .into(),
        value: representation
            .field(path, fields, "value")?
            .text(path)?
            .into(),
    })
}

fn named_inputs(path: &str, fields: &[(Node, Node)]) -> Result<Vec<NamedType>, Diagnostic> {
    let Some(value) = fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(name, _) if name == "inputs" => Some(value),
        _ => None,
    }) else {
        return Ok(vec![]);
    };
    let Shape::Mapping(entries) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_mapping",
            "Expected input declarations",
        ));
    };
    entries
        .iter()
        .map(|(key, value)| {
            let fields = value.mapping(path, &["type"])?;
            Ok(NamedType {
                name: key.text(path)?.into(),
                definition: type_definition(path, value.field(path, fields, "type")?)?,
                source: location(path, key),
            })
        })
        .collect()
}

fn presence(path: &str, fields: &[(Node, Node)]) -> Result<Vec<Presence>, Diagnostic> {
    let Some(value) = fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(name, _) if name == "presence" => Some(value),
        _ => None,
    }) else {
        return Ok(vec![]);
    };
    let Shape::Sequence(entries) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_sequence",
            "Expected presence entries",
        ));
    };
    entries
        .iter()
        .map(|entry| {
            let fields = entry.mapping(path, &["target", "xml", "yaml"])?;
            let target = entry.field(path, fields, "target")?;
            let target_kind = if let Shape::Mapping(_) = &target.shape {
                let fields = target.mapping(path, &["field"])?;
                PresenceTarget::Field(target.field(path, fields, "field")?.text(path)?.into())
            } else {
                target.literal(path, "self", "invalid_target")?;
                PresenceTarget::SelfValue
            };
            let xml = optional_field(fields, "xml")
                .map(|node| node.mapping(path, &["missing", "empty", "canonical"]))
                .transpose()?;
            let yaml = optional_field(fields, "yaml")
                .map(|node| node.mapping(path, &["missing", "empty", "omitWhen"]))
                .transpose()?;
            let xml_fields = xml.unwrap_or(&[]);
            let yaml_fields = yaml.unwrap_or(&[]);
            let forms = if let Some(canonical) = optional_field(xml_fields, "canonical") {
                let Shape::Sequence(forms) = &canonical.shape else {
                    return Err(error(
                        path,
                        canonical.mark,
                        "expected_sequence",
                        "Expected canonical forms",
                    ));
                };
                forms.as_slice()
            } else {
                &[]
            };
            let xml_canonical = forms
                .iter()
                .map(|form| {
                    let fields = form.mapping(path, &["when", "form"])?;
                    let when = fields
                        .iter()
                        .find_map(|(key, value)| match &key.shape {
                            Shape::Scalar(name, _) if name == "when" => Some(value),
                            _ => None,
                        })
                        .map(|value| expression(path, value))
                        .transpose()?;
                    let name = form.field(path, fields, "form")?;
                    let kind = match name.text(path)? {
                        "ordinary" => XmlForm::Ordinary,
                        "empty-element" => XmlForm::EmptyElement,
                        "nil" => XmlForm::Nil,
                        "missing" => XmlForm::Missing,
                        _ => {
                            return Err(error(
                                path,
                                name.mark,
                                "invalid_xml_form",
                                "Unknown canonical XML form",
                            ));
                        }
                    };
                    Ok(CanonicalForm {
                        when,
                        form: kind,
                        source: location(path, name),
                    })
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            Ok(Presence {
                target: target_kind,
                xml_missing: missing_value(path, xml_fields)?,
                xml_empty: empty_forms(path, xml_fields, true)?,
                yaml_missing: missing_value(path, yaml_fields)?,
                yaml_empty: empty_forms(path, yaml_fields, false)?,
                yaml_omit_when: optional_field(yaml_fields, "omitWhen")
                    .map(|node| expression(path, node))
                    .transpose()?,
                xml_canonical,
                source: location(path, target),
            })
        })
        .collect()
}

fn parameters(path: &str, fields: &[(Node, Node)]) -> Result<Vec<Parameter>, Diagnostic> {
    let Some(value) = fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(name, _) if name == "parameters" => Some(value),
        _ => None,
    }) else {
        return Ok(vec![]);
    };
    let Shape::Mapping(entries) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_mapping",
            "Expected parameter declarations",
        ));
    };
    entries
        .iter()
        .map(|(key, value)| {
            let fields = value.mapping(path, &["type", "default"])?;
            let default = fields
                .iter()
                .find_map(|(key, value)| match &key.shape {
                    Shape::Scalar(name, _) if name == "default" => Some(value),
                    _ => None,
                })
                .map(|value| scalar_literal(path, value))
                .transpose()?;
            Ok(Parameter {
                name: key.text(path)?.into(),
                definition: type_definition(path, value.field(path, fields, "type")?)?,
                default,
                source: location(path, key),
            })
        })
        .collect()
}

fn shorthands(path: &str, value: &Node) -> Result<Vec<Shorthand>, Diagnostic> {
    let Shape::Sequence(items) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_sequence",
            "Expected shorthand list",
        ));
    };
    items
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["id", "representation", "denotes"])?;
            let representation = item.field(path, fields, "representation")?;
            let rep_fields = representation.mapping(path, &["kind", "scalar", "capture"])?;
            representation.field(path, rep_fields, "kind")?.literal(
                path,
                "scalar",
                "unsupported_representation",
            )?;
            representation.field(path, rep_fields, "scalar")?.literal(
                path,
                "text",
                "unsupported_scalar",
            )?;
            let id = item.field(path, fields, "id")?;
            Ok(Shorthand {
                id: id.text(path)?.into(),
                capture: representation
                    .field(path, rep_fields, "capture")?
                    .text(path)?
                    .into(),
                denotes: expression(path, item.field(path, fields, "denotes")?)?,
                source: location(path, id),
            })
        })
        .collect()
}

fn expression(path: &str, value: &Node) -> Result<Expression, Diagnostic> {
    if let Shape::Mapping(entries) = &value.shape
        && entries
            .iter()
            .any(|(key, _)| matches!(&key.shape, Shape::Scalar(name, _) if name == "if"))
    {
        let fields = value.mapping(path, &["if", "then", "else"])?;
        return Ok(Expression {
            kind: ExpressionKind::Conditional {
                condition: Box::new(expression(path, value.field(path, fields, "if")?)?),
                then_value: Box::new(expression(path, value.field(path, fields, "then")?)?),
                else_value: Box::new(expression(path, value.field(path, fields, "else")?)?),
            },
            source: location(path, value),
        });
    }
    let fields = value.mapping(
        path,
        &[
            "input",
            "parameter",
            "capture",
            "sequence",
            "record",
            "literal",
            "not",
            "absent",
            "self",
            "var",
            "get",
            "each",
            "and",
            "eq",
        ],
    )?;
    if fields.len() != 1 {
        return Err(error(
            path,
            value.mark,
            "invalid_expression",
            "Expected one expression operator",
        ));
    }
    let (operator, operand) = &fields[0];
    let kind = match operator.text(path)? {
        "not" => ExpressionKind::Not(Box::new(expression(path, operand)?)),
        "absent" => {
            if scalar_literal(path, operand)? != ScalarLiteral::Boolean(true) {
                return Err(error(
                    path,
                    operand.mark,
                    "invalid_absent",
                    "Expected absent: true",
                ));
            }
            ExpressionKind::Absent
        }
        "self" => {
            if scalar_literal(path, operand)? != ScalarLiteral::Boolean(true) {
                return Err(error(
                    path,
                    operand.mark,
                    "invalid_self",
                    "Expected self: true",
                ));
            }
            ExpressionKind::SelfValue
        }
        "var" => ExpressionKind::Variable(operand.text(path)?.into()),
        "get" => {
            let fields = operand.mapping(path, &["of", "field"])?;
            ExpressionKind::Get {
                value: Box::new(expression(path, operand.field(path, fields, "of")?)?),
                field: operand.field(path, fields, "field")?.text(path)?.into(),
            }
        }
        "each" => {
            let fields = operand.mapping(path, &["in", "as", "where"])?;
            ExpressionKind::Each {
                input: Box::new(expression(path, operand.field(path, fields, "in")?)?),
                binding: operand.field(path, fields, "as")?.text(path)?.into(),
                predicate: Box::new(expression(path, operand.field(path, fields, "where")?)?),
            }
        }
        "and" | "eq" => {
            let Shape::Sequence(items) = &operand.shape else {
                return Err(error(
                    path,
                    operand.mark,
                    "expected_sequence",
                    "Expected operands",
                ));
            };
            let equal = operator.text(path)? == "eq";
            if (equal && items.len() != 2) || (!equal && items.is_empty()) {
                return Err(error(
                    path,
                    operand.mark,
                    "invalid_arity",
                    "eq requires two operands; and requires at least one",
                ));
            }
            let mut expressions = items
                .iter()
                .map(|item| expression(path, item))
                .collect::<Result<Vec<_>, _>>()?;
            if equal {
                let right = expressions.pop().expect("two operands checked");
                let left = expressions.pop().expect("two operands checked");
                ExpressionKind::Equal {
                    left: Box::new(left),
                    right: Box::new(right),
                }
            } else {
                ExpressionKind::And(expressions)
            }
        }
        "literal" => ExpressionKind::Literal(scalar_literal(path, operand)?),
        "input" => ExpressionKind::Input(operand.text(path)?.into()),
        "parameter" => ExpressionKind::Parameter(operand.text(path)?.into()),
        "capture" => ExpressionKind::Capture(operand.text(path)?.into()),
        "sequence" => {
            let Shape::Sequence(items) = &operand.shape else {
                return Err(error(
                    path,
                    operand.mark,
                    "expected_sequence",
                    "Expected sequence constructor",
                ));
            };
            ExpressionKind::Sequence(
                items
                    .iter()
                    .map(|item| expression(path, item))
                    .collect::<Result<Vec<_>, _>>()?,
            )
        }
        "record" => {
            let Shape::Mapping(items) = &operand.shape else {
                return Err(error(
                    path,
                    operand.mark,
                    "expected_mapping",
                    "Expected record constructor",
                ));
            };
            ExpressionKind::Record(
                items
                    .iter()
                    .map(|(key, item)| {
                        Ok(ExpressionField {
                            name: key.text(path)?.into(),
                            value: expression(path, item)?,
                        })
                    })
                    .collect::<Result<Vec<_>, Diagnostic>>()?,
            )
        }
        _ => unreachable!("closed expression operators"),
    };
    Ok(Expression {
        kind,
        source: location(path, value),
    })
}

fn scalar_literal(path: &str, value: &Node) -> Result<ScalarLiteral, Diagnostic> {
    let Shape::Scalar(text, is_string) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_scalar",
            "Expected scalar literal",
        ));
    };
    if *is_string {
        return Ok(ScalarLiteral::Text(text.clone()));
    }
    match text.as_str() {
        "true" | "True" | "TRUE" => Ok(ScalarLiteral::Boolean(true)),
        "false" | "False" | "FALSE" => Ok(ScalarLiteral::Boolean(false)),
        "" | "~" | "null" | "Null" | "NULL" => Ok(ScalarLiteral::Null),
        _ if decimal_literal(text) => Ok(ScalarLiteral::Number(text.clone())),
        _ => Err(error(
            path,
            value.mark,
            "invalid_number",
            "Expected finite decimal literal",
        )),
    }
}

fn decimal_literal(text: &str) -> bool {
    let mut bytes = text.bytes().peekable();
    if matches!(bytes.peek(), Some(b'+' | b'-')) {
        bytes.next();
    }
    let mut digits = 0;
    while bytes.peek().is_some_and(u8::is_ascii_digit) {
        bytes.next();
        digits += 1;
    }
    if bytes.peek() == Some(&b'.') {
        bytes.next();
        while bytes.peek().is_some_and(u8::is_ascii_digit) {
            bytes.next();
            digits += 1;
        }
    }
    if digits == 0 {
        return false;
    }
    if matches!(bytes.peek(), Some(b'e' | b'E')) {
        bytes.next();
        if matches!(bytes.peek(), Some(b'+' | b'-')) {
            bytes.next();
        }
        let mut exponent_digits = 0;
        while bytes.peek().is_some_and(u8::is_ascii_digit) {
            bytes.next();
            exponent_digits += 1;
        }
        if exponent_digits == 0 {
            return false;
        }
    }
    bytes.next().is_none()
}

fn optional_field<'a>(fields: &'a [(Node, Node)], name: &str) -> Option<&'a Node> {
    fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(key, _) if key == name => Some(value),
        _ => None,
    })
}

fn missing_value(path: &str, fields: &[(Node, Node)]) -> Result<Option<Expression>, Diagnostic> {
    optional_field(fields, "missing")
        .map(|node| {
            let fields = node.mapping(path, &["denotes"])?;
            expression(path, node.field(path, fields, "denotes")?)
        })
        .transpose()
}

fn empty_forms(
    path: &str,
    fields: &[(Node, Node)],
    xml: bool,
) -> Result<Vec<EmptyForm>, Diagnostic> {
    let Some(node) = optional_field(fields, "empty") else {
        return Ok(vec![]);
    };
    let Shape::Sequence(items) = &node.shape else {
        return Err(error(
            path,
            node.mark,
            "expected_sequence",
            "Expected empty forms",
        ));
    };
    items
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["form", "denotes"])?;
            let name = item.field(path, fields, "form")?;
            let Shape::Scalar(spelling, _) = &name.shape else {
                return Err(error(
                    path,
                    name.mark,
                    "expected_scalar",
                    "Expected form name",
                ));
            };
            let form = match (xml, spelling.as_str()) {
                (true, "empty-element") => EmptyKind::Element,
                (true, "empty-text") => EmptyKind::Text,
                (true, "nil") => EmptyKind::Nil,
                (false, "empty-string") => EmptyKind::String,
                (false, "empty-mapping") => EmptyKind::Mapping,
                (false, "empty-sequence") => EmptyKind::Sequence,
                (false, "null") => EmptyKind::Null,
                _ => {
                    return Err(error(
                        path,
                        name.mark,
                        "invalid_empty_form",
                        "Unknown empty form for this format",
                    ));
                }
            };
            Ok(EmptyForm {
                form,
                denotes: expression(path, item.field(path, fields, "denotes")?)?,
                source: location(path, name),
            })
        })
        .collect()
}

fn normalization(path: &str, fields: &[(Node, Node)]) -> Result<Option<Normalization>, Diagnostic> {
    optional_field(fields, "normalization")
        .map(|node| {
            let fields = node.mapping(path, &["when", "from", "denotes"])?;
            node.field(path, fields, "from")?.literal(
                path,
                "empty-sequence",
                "invalid_normalization",
            )?;
            Ok(Normalization {
                when: expression(path, node.field(path, fields, "when")?)?,
                denotes: expression(path, node.field(path, fields, "denotes")?)?,
                source: location(path, node),
            })
        })
        .transpose()
}

fn named_nodes<'a>(path: &str, node: Option<&'a Node>) -> Result<&'a [(Node, Node)], Diagnostic> {
    match node {
        None => Ok(&[]),
        Some(Node {
            shape: Shape::Mapping(entries),
            ..
        }) => Ok(entries),
        Some(node) => Err(error(
            path,
            node.mark,
            "expected_mapping",
            "Expected named bindings",
        )),
    }
}
