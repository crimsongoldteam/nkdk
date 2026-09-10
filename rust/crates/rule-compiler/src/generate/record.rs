use super::*;
use std::fmt::Write;

struct Field<'a> {
    path: &'a [ExpandedName],
    key: &'a str,
    boolean: Option<(&'a [BooleanLexeme], &'a [BooleanLexeme])>,
}
fn path_code(path: &[ExpandedName]) -> String {
    format!(
        "&[{}]",
        path.iter()
            .map(|name| format!("({:?}, {:?})", name.namespace, name.local))
            .collect::<Vec<_>>()
            .join(",")
    )
}

pub(super) fn generate(entry: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
    plain(entry)?;
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
        let boolean = match &field.value {
            LinkedType::Scalar(ScalarType::Text) => None,
            LinkedType::Reference(id) => {
                let target = program
                    .entries
                    .iter()
                    .find(|entry| entry.id == *id)
                    .expect("linked reference");
                plain(target)?;
                match (&target.value, &target.xml, &target.yaml) {
                    (
                        LinkedType::Scalar(ScalarType::Text),
                        LinkedXml::Text,
                        YamlRepresentation::Text,
                    ) => None,
                    (
                        LinkedType::Scalar(ScalarType::Boolean),
                        LinkedXml::BooleanTable(xml),
                        YamlRepresentation::BooleanTable(yaml),
                    ) => Some((xml.as_slice(), yaml.as_slice())),
                    _ => {
                        return Err(unsupported(
                            target,
                            "Referenced value is not a supported scalar codec",
                        ));
                    }
                }
            }
            _ => {
                return Err(unsupported(
                    entry,
                    "Only text and referenced scalar codecs are generated at this stage",
                ));
            }
        };
        fields.push(Field {
            path: &mapping.path,
            key: &yaml.key,
            boolean,
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
    let mut out = format!("struct V{id} {{\n");
    for (i, field) in fields.iter().enumerate() {
        writeln!(
            out,
            "f{i}: {},",
            if field.boolean.is_some() {
                "bool"
            } else {
                "String"
            }
        )
        .unwrap();
    }
    out.push_str("}\n");
    for xml_side in [true, false] {
        let side = if xml_side { "xml" } else { "yaml" };
        writeln!(
            out,
            "fn read_{side}_{id}(source: &[u8]) -> core::Result<V{id}> {{"
        )
        .unwrap();
        for i in 0..fields.len() {
            writeln!(out, "let mut r{i}: Option<String> = None;").unwrap();
        }
        if xml_side {
            out.push_str("core::xml::visit(source, |path, token| { match token { core::xml::Token::Start => {\n");
            for (i, field) in fields.iter().enumerate() {
                writeln!(out, "if core::xml::matches(path, {}) {{ if r{i}.is_some() {{ return Err(RuntimeDiagnostic::new(\"xml.duplicate-field\", {:?})); }} r{i} = Some(String::new()); return Ok(()); }}", path_code(field.path), field.key).unwrap();
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
            out.push_str("core::yaml::visit(source, |key, value| { match key.as_str() {\n");
            for (i, field) in fields.iter().enumerate() {
                writeln!(out, "{:?} => {{ r{i} = Some(value); Ok(()) }},", field.key).unwrap();
            }
            out.push_str("_ => Err(RuntimeDiagnostic::new(\"yaml.unknown-field\", format!(\"Unknown YAML key: {key}\")).field(key)) } })?;\n");
        }
        for (i, field) in fields.iter().enumerate() {
            writeln!(
                out,
                "let r{i} = r{i}.ok_or_else(|| RuntimeDiagnostic::new(\"value.missing\", {:?}).field({:?}))?;",
                field.key, field.key
            )
            .unwrap();
            if let Some((xml, yaml)) = field.boolean {
                writeln!(out, "let f{i} = match r{i}.as_str() {{").unwrap();
                for item in if xml_side { xml } else { yaml } {
                    writeln!(out, "{:?} => {},", item.text, item.value).unwrap();
                }
                writeln!(out, "_ => return Err(RuntimeDiagnostic::new(\"value.boolean\", \"Unknown boolean literal\").field({:?})), }};", field.key).unwrap();
            } else {
                writeln!(out, "core::xml::validate_text(&r{i}).map_err(|error| error.field({:?}))?; let f{i} = r{i};", field.key).unwrap();
            }
        }
        writeln!(
            out,
            "Ok(V{id} {{ {} }}) }}",
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
    writeln!(out, "fn write_xml_{id}(value: &V{id}) -> Vec<u8> {{ let mut out = core::xml::Writer::new(&{:?});", namespaces.into_iter().collect::<Vec<_>>()).unwrap();
    for (i, field) in fields.iter().enumerate() {
        let text = match field.boolean {
            Some((table, _)) => boolean_output(table, i),
            None => format!("&value.f{i}"),
        };
        writeln!(out, "out.field({}, {text});", path_code(field.path)).unwrap();
    }
    out.push_str("out.finish() }\n");
    writeln!(
        out,
        "fn write_yaml_{id}(value: &V{id}) -> Vec<u8> {{ let mut out = String::new();"
    )
    .unwrap();
    for (i, field) in fields.iter().enumerate() {
        let text = match field.boolean {
            Some((_, table)) => boolean_output(table, i),
            None => format!("&value.f{i}"),
        };
        writeln!(out, "out.push_str(&core::yaml::scalar({:?})); out.push_str(\": \"); out.push_str(&core::yaml::scalar({text})); out.push('\\n');", field.key).unwrap();
    }
    out.push_str("if !out.is_empty() { out.pop(); } out.into_bytes() }\n");
    writeln!(out, "fn verify_{id}(original: &[u8], candidate: &[u8]) -> core::Result<()> {{ let restored = write_xml_{id}(&read_yaml_{id}(candidate)?); core::proof::verify(original, &restored, |path| {{").unwrap();
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
    Ok(out)
}
fn boolean_output(table: &[BooleanLexeme], index: usize) -> String {
    let yes = &table
        .iter()
        .find(|item| item.value)
        .expect("complete boolean table")
        .text;
    let no = &table
        .iter()
        .find(|item| !item.value)
        .expect("complete boolean table")
        .text;
    format!("if value.f{index} {{ {yes:?} }} else {{ {no:?} }}")
}
