use super::scalar::Codec;
use super::*;
use std::fmt::Write;

struct Field<'a> {
    path: &'a [ExpandedName],
    key: &'a str,
    codec: Codec<'a>,
    optional: bool,
}
pub(super) fn path_code(path: &[ExpandedName]) -> String {
    format!(
        "&[{}]",
        path.iter()
            .map(|name| format!("({:?}, {:?})", name.namespace, name.local))
            .collect::<Vec<_>>()
            .join(",")
    )
}

pub(super) fn generate(entry: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
    if let Some(source) = super::composite::generate(entry, program)? {
        return Ok(source);
    }
    if let Some(source) = super::collections::generate(entry, program)? {
        return Ok(source);
    }
    plain_shape(entry)?;
    let (LinkedType::Record(types), LinkedXml::Record(xml), YamlRepresentation::Mapping(yaml)) =
        (&entry.value, &entry.xml, &entry.yaml)
    else {
        return Err(unsupported(
            entry,
            "Scalar operation requires record XML and YAML representations",
        ));
    };
    let mut fields = vec![];
    for field in types {
        let mapping = xml
            .iter()
            .find(|mapping| mapping.field == field.name)
            .ok_or_else(|| unsupported(entry, "XML field missing"))?;
        if mapping.attribute.is_some() || mapping.path.is_empty() {
            return Err(unsupported(
                entry,
                "Attribute and empty-route generation is not available at this stage",
            ));
        }
        let yaml = yaml
            .iter()
            .find(|mapping| mapping.field == field.name)
            .ok_or_else(|| unsupported(entry, "YAML field missing"))?;
        let codec = Codec::resolve(&field.value, entry, program)?;
        let optional = super::scalar::field_optional(&field.value, program)?;
        if optional && !entry.constraints.is_empty() {
            return Err(unsupported(
                entry,
                "Constraints on optional scalar records are not generated",
            ));
        }
        fields.push(Field {
            path: &mapping.path,
            key: &yaml.key,
            codec,
            optional,
        });
    }
    let Some(first) = fields.first() else {
        return Err(unsupported(
            entry,
            "An empty record has no XML document root",
        ));
    };
    if fields.iter().any(|field| field.path[0] != first.path[0]) {
        return Err(unsupported(
            entry,
            "All fields must belong to a single XML document root",
        ));
    }
    let id = entry.id;
    let keep_positions = entry.constraints.iter().any(|constraint| {
        matches!(constraint.diagnostic.at, LinkedDiagnosticTarget::Field(_))
            && [
                (ValidationPhase::XmlImport, LinkedForm::XmlRecord),
                (ValidationPhase::YamlValidation, LinkedForm::YamlMapping),
            ]
            .iter()
            .any(|(phase, form)| {
                constraint.applies_to.contains(phase)
                    && (constraint.forms.is_empty() || constraint.forms.contains(form))
            })
    });
    let mut out = String::new();
    for (i, field) in fields.iter().enumerate() {
        out.push_str(&field.codec.definition(&format!("E{id}F{i}")));
    }
    writeln!(out, "struct V{id} {{").unwrap();
    for (i, field) in fields.iter().enumerate() {
        writeln!(
            out,
            "f{i}: {},",
            if field.optional {
                format!("Option<{}>", field.codec.rust_type(&format!("E{id}F{i}")))
            } else {
                field.codec.rust_type(&format!("E{id}F{i}"))
            }
        )
        .unwrap();
    }
    if keep_positions {
        writeln!(out, "positions: [core::Position; {}],", fields.len()).unwrap();
    }
    out.push_str("}\n");
    for xml_side in [true, false] {
        let side = if xml_side { "xml" } else { "yaml" };
        writeln!(
            out,
            "fn read_{side}_{id}(source: &[u8], _inputs: &PreparedInputs) -> core::Result<V{id}> {{"
        )
        .unwrap();
        writeln!(
            out,
            "let mut positions = [core::Position::default(); {}];",
            fields.len()
        )
        .unwrap();
        for i in 0..fields.len() {
            writeln!(out, "let mut r{i}: Option<String> = None;").unwrap();
        }
        if xml_side {
            out.push_str("core::xml::visit(source, |path, token| { match token { core::xml::Token::Attribute(_) => Err(RuntimeDiagnostic::new(\"xml.unknown-attribute\", \"Undeclared XML attribute\")), core::xml::Token::Start(offset) => {\n");
            for (i, field) in fields.iter().enumerate() {
                writeln!(out, "if core::xml::matches(path, {}) {{ if r{i}.is_some() {{ return Err(RuntimeDiagnostic::new(\"xml.duplicate-field\", {:?})); }} positions[{i}] = core::Position::xml(offset); r{i} = Some(String::new()); return Ok(()); }}", path_code(field.path), field.key).unwrap();
            }
            let mut prefixes = BTreeSet::new();
            for field in &fields {
                for len in 1..field.path.len() {
                    prefixes.insert(path_code(&field.path[..len]));
                }
            }
            for prefix in prefixes {
                writeln!(
                    out,
                    "if core::xml::matches(path, {prefix}) {{ return Ok(()); }}"
                )
                .unwrap();
            }
            out.push_str("Err(RuntimeDiagnostic::new(\"xml.unknown-field\", \"Unknown XML path\")) }, core::xml::Token::Text(text) => {\n");
            for (i, field) in fields.iter().enumerate() {
                writeln!(out, "if core::xml::matches(path, {}) {{ r{i}.as_mut().expect(\"started field\").push_str(text); return Ok(()); }}", path_code(field.path)).unwrap();
            }
            out.push_str("if core::xml::is_whitespace(text) { Ok(()) } else { Err(RuntimeDiagnostic::new(\"xml.unexpected-text\", \"Text outside a declared scalar\")) } }, core::xml::Token::End => Ok(()) } })?;\n");
        } else {
            out.push_str("core::yaml::visit_scalars(if source.is_empty() { b\"{}\" } else { source }, |key, value| { match key.as_str() {\n");
            for (i, field) in fields.iter().enumerate() {
                writeln!(out, "{:?} => {{ positions[{i}] = value.position(); r{i} = Some(value.{}().map_err(|error| error.field({:?}))?); Ok(()) }},", field.key, field.codec.yaml_input(), field.key).unwrap();
            }
            out.push_str("_ => Err(RuntimeDiagnostic::new(\"yaml.unknown-field\", format!(\"Unknown YAML key: {key}\")).field(key)) } })?;\n");
        }
        for (i, field) in fields.iter().enumerate() {
            if field.optional {
                writeln!(out, "let f{i} = if let Some(r{i}) = r{i} {{").unwrap();
                out.push_str(
                    &field
                        .codec
                        .read(&format!("E{id}F{i}"), i, field.key, xml_side),
                );
                writeln!(out, "Some(f{i}) }} else {{ None }};").unwrap();
                continue;
            }
            writeln!(
                out,
                "let r{i} = r{i}.ok_or_else(|| positions[{i}].apply(source, RuntimeDiagnostic::new(\"value.missing\", {:?}).field({:?})))?;",
                field.key, field.key
            )
            .unwrap();
            out.push_str(
                &field
                    .codec
                    .read(&format!("E{id}F{i}"), i, field.key, xml_side),
            );
        }
        writeln!(
            out,
            "Ok(V{id} {{ {} {} }}) }}",
            if keep_positions { "positions," } else { "" },
            (0..fields.len())
                .map(|i| format!("f{i}"))
                .collect::<Vec<_>>()
                .join(",")
        )
        .unwrap();
    }
    let namespaces: BTreeSet<_> = fields
        .iter()
        .flat_map(|field| field.path)
        .map(|name| name.namespace.as_str())
        .filter(|ns| !ns.is_empty())
        .collect();
    writeln!(out, "fn write_xml_{id}(value: &V{id}, _inputs: &PreparedInputs) -> core::Result<Vec<u8>> {{ let mut out = core::xml::Writer::new(&{:?});", namespaces.into_iter().collect::<Vec<_>>()).unwrap();
    writeln!(out, "out.container({});", path_code(&first.path[..1])).unwrap();
    for (i, field) in fields.iter().enumerate() {
        let text = if field.optional {
            writeln!(out, "if let Some(field_value) = &value.f{i} {{").unwrap();
            field
                .codec
                .write_reference(&format!("E{id}F{i}"), "field_value", true)
        } else {
            field.codec.write(&format!("E{id}F{i}"), i, true)
        };
        writeln!(out, "out.field({}, {text});", path_code(field.path)).unwrap();
        if field.optional {
            out.push_str("}\n");
        }
    }
    out.push_str("Ok(out.finish()) }\n");
    writeln!(
        out,
        "fn write_yaml_{id}(value: &V{id}, _inputs: &PreparedInputs) -> core::Result<Vec<u8>> {{ let mut out = String::new();"
    )
    .unwrap();
    for (i, field) in fields.iter().enumerate() {
        let text = if field.optional {
            writeln!(out, "if let Some(field_value) = &value.f{i} {{").unwrap();
            field
                .codec
                .write_reference(&format!("E{id}F{i}"), "field_value", false)
        } else {
            field.codec.write(&format!("E{id}F{i}"), i, false)
        };
        let yaml = if field.codec.numeric() {
            text
        } else {
            format!("&core::yaml::scalar({text})")
        };
        writeln!(out, "out.push_str(&core::yaml::scalar({:?})); out.push_str(\": \"); out.push_str({yaml}); out.push('\\n');", field.key).unwrap();
        if field.optional {
            out.push_str("}\n");
        }
    }
    out.push_str("if !out.is_empty() { out.pop(); } Ok(out.into_bytes()) }\n");
    writeln!(out, "fn verify_{id}(original: &[u8], candidate: &[u8], _inputs: &PreparedInputs) -> core::Result<()> {{ let value = read_yaml_{id}(candidate, _inputs)?; if let Some(error) = check_yaml_{id}(&value, candidate, _inputs).into_iter().find(|error| error.severity == core::Severity::Error) {{ return Err(error); }} let restored = write_xml_{id}(&value, _inputs)?; core::proof::verify(original, &restored, |path| {{").unwrap();
    out.push_str(
        &fields
            .iter()
            .map(|field| format!("core::xml::matches(path, {})", path_code(field.path)))
            .collect::<Vec<_>>()
            .join(" || "),
    );
    if fields.is_empty() {
        out.push_str("false");
    }
    out.push_str("}) }\n");
    writeln!(out, "fn finalize_yaml_{id}(original: &[u8], candidate: Vec<u8>, _value: &V{id}, inputs: &PreparedInputs) -> core::Result<Vec<u8>> {{ verify_{id}(original, &candidate, inputs)?; Ok(candidate) }}").unwrap();
    Ok(out)
}
