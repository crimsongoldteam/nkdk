use super::*;

type Member = (String, String, String);
fn members(
    fields: &[Field<'_>],
    layout: Option<&super::super::nested_record::Layout>,
    headers: &[(usize, &Field<'_>)],
) -> Vec<Member> {
    let mut result = vec![(
        "positions".into(),
        format!("[core::Position;{}]", fields.len()),
        format!("[core::Position::default();{}]", fields.len()),
    )];
    if layout.is_some() {
        result.push(("present".into(), "bool".into(), "false".into()));
    }
    for (i, field) in physical_fields(fields) {
        result.push((format!("r{i}"), "Option<String>".into(), "None".into()));
        if let Codec::Forms(choice) = &field.codec
            && choice.discriminated()
        {
            result.push((
                format!("variant{i}"),
                "Option<usize>".into(),
                format!("{:?}", choice.fallback_variant()),
            ));
        }
        let mut flags = Vec::new();
        if matches!(field.codec, Codec::Choice(_)) {
            flags.push(format!("number{i}"));
        }
        if field.attribute.is_some() {
            if headers
                .iter()
                .find(|(_, header)| header.path == field.path)
                .is_some_and(|(first, _)| *first == i)
            {
                flags.push(format!("header{i}"));
            }
        } else {
            flags.extend([format!("shape{i}"), format!("nested{i}")]);
            if super::super::scalar_presence::empty(field.presence, EmptyKind::Nil) {
                flags.push(format!("nil{i}"));
            }
        }
        result.extend(
            flags
                .into_iter()
                .map(|name| (name, "bool".into(), "false".into())),
        );
    }
    result
}
pub(super) fn bindings(
    id: u32,
    fields: &[Field<'_>],
    layout: Option<&super::super::nested_record::Layout>,
    headers: &[(usize, &Field<'_>)],
) -> String {
    let names = members(fields, layout, headers)
        .into_iter()
        .map(|(name, _, _)| {
            let unused_nil = fields.iter().enumerate().any(|(i, field)| {
                name == format!("nil{i}")
                    && super::super::scalar_presence::empty(field.presence, EmptyKind::Element)
                    && !super::paired_null(field)
            });
            if name.starts_with("header") || unused_nil {
                format!("{name}:_")
            } else {
                name
            }
        })
        .collect::<Vec<_>>()
        .join(",");
    format!("let XmlRead{id}{{{names}}}=state;let _=&positions;\n")
}
pub(super) fn generate(
    id: u32,
    fields: &[Field<'_>],
    layout: Option<&super::super::nested_record::Layout>,
    headers: &[(usize, &Field<'_>)],
    container_attributes: &str,
) -> String {
    let mut out = String::new();
    let members = members(fields, layout, headers);
    writeln!(out, "struct XmlRead{id}{{").unwrap();
    for (name, kind, _) in &members {
        writeln!(out, "{name}:{kind},").unwrap();
    }
    writeln!(out, "}}\nimpl XmlRead{id}{{fn new()->Self{{Self{{").unwrap();
    for (name, _, initial) in &members {
        writeln!(out, "{name}:{initial},").unwrap();
    }
    writeln!(out,"}}}}\nfn consume(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>)->core::Result<()>{{").unwrap();
    out.push_str("let _=path;\n");
    for (i, field) in physical_fields(fields) {
        if field.attribute.is_some() {
            continue;
        }
        writeln!(out, "if path.len()>{len} && core::xml::matches(&path[..{len}],{path}) {{self.nested{i}=true;self.shape{i}=true;return Ok(());}}",len=field.path.len(),path=path_code(field.path)).unwrap();
    }
    out.push_str("match token {core::xml::Token::Attribute(_attribute) => {\n");
    out.push_str(container_attributes);
    for (i, field) in physical_fields(fields) {
        if let Some(attribute) = field.attribute {
            writeln!(out, "if core::xml::matches(path,{}) && {} {{if self.r{i}.replace(_attribute.text.clone()).is_some() {{return Err(RuntimeDiagnostic::repeated_xml_attribute());}} return Ok(());}}", path_code(field.path), super::super::attributes::name_matches(attribute,"_attribute.name")).unwrap();
        }
    }
    // Declared attributes belong to their slots even when the same element
    // also carries a scalar text field. Only unmatched attributes affect shape.
    for (i, field) in physical_fields(fields) {
        if field.attribute.is_some() {
            continue;
        }
        if let Codec::Choice(choice) = &field.codec {
            out.push_str(&super::super::scalar_choice::read_attribute(
                choice, field.path, i, "self.",
            ));
        }
        if let Codec::Forms(choice) = &field.codec {
            out.push_str(&choice.read_attribute(field.path, i, "self."));
        }
        if super::super::scalar_presence::empty(field.presence, EmptyKind::Nil) {
            writeln!(out,"if core::xml::matches(path,{}) && _attribute.name.namespace==\"http://www.w3.org/2001/XMLSchema-instance\" && _attribute.name.local==\"nil\" && _attribute.text==\"true\" {{self.nil{i}=true;return Ok(());}}",path_code(field.path)).unwrap();
        }
        if let Some(presence) = field.presence {
            for canonical in &presence.canonical {
                if let Some(name) = &canonical.xml_type {
                    writeln!(out,"if core::xml::matches(path,{}) && _attribute.name.namespace==\"http://www.w3.org/2001/XMLSchema-instance\" && _attribute.name.local==\"type\" && _attribute.qname.as_ref().is_some_and(|name|name.namespace=={:?} && name.local=={:?}) {{return Ok(());}}",path_code(field.path),name.namespace,name.local).unwrap();
                }
            }
        }
        for expected in &field.attributes {
            let valid = match &expected.value {
                LinkedXmlAttributeValue::Text(text) => {
                    format!("_attribute.text=={text:?}")
                }
                LinkedXmlAttributeValue::QName(name) => format!(
                    "_attribute.qname.as_ref().is_some_and(|name|name.namespace=={:?} && name.local=={:?})",
                    name.namespace, name.local
                ),
            };
            writeln!(
                out,
                "if core::xml::matches(path,{}) && {} && {valid} {{return Ok(());}}",
                path_code(field.path),
                super::super::attributes::name_matches(&expected.name, "_attribute.name")
            )
            .unwrap();
        }
        writeln!(
            out,
            "if core::xml::matches(path,{}) {{self.shape{i}=true;return Ok(());}}",
            path_code(field.path)
        )
        .unwrap();
    }
    if let Some(layout) = layout {
        writeln!(
            out,
            "if core::xml::matches(path,{}) {{return Ok(());}}",
            path_code(&layout.path)
        )
        .unwrap();
    }
    out.push_str("Err(RuntimeDiagnostic::unknown_xml_attribute())},core::xml::Token::Start(offset)=>{let _=offset;\n");

    if let Some(layout) = layout {
        writeln!(
            out,
            "if core::xml::matches(path,{}) {{self.present=true;}}",
            path_code(&layout.path)
        )
        .unwrap();
    }
    for group in headers.chunk_by(|left, right| left.1.path == right.1.path) {
        let (i, field) = group[0];
        writeln!(out, "if core::xml::matches(path,{}) {{if self.header{i} {{return Err(RuntimeDiagnostic::repeated_xml_container());}} self.header{i}=true;",path_code(field.path)).unwrap();
        for (index, _) in group {
            writeln!(out, "self.positions[{index}]=core::Position::xml(*offset);").unwrap();
        }
        for (index, scalar) in physical_fields(fields) {
            if scalar.attribute.is_none() && scalar.path == field.path {
                writeln!(out,"self.positions[{index}]=core::Position::xml(*offset);self.r{index}=Some(String::new());").unwrap();
            }
        }
        out.push_str("return Ok(()); }\n");
    }
    for (i, field) in physical_fields(fields) {
        if field.attribute.is_some() {
            continue;
        }
        writeln!(out, "if core::xml::matches(path, {}) {{ if self.r{i}.is_some() {{self.nested{i}=true;}} self.positions[{i}] = core::Position::xml(*offset); self.r{i} = Some(String::new()); return Ok(()); }}", path_code(field.path)).unwrap();
    }
    if let Some(layout) = layout {
        writeln!(
            out,
            "if core::xml::matches(path,{}) {{self.present=true;return Ok(());}}",
            path_code(&layout.path)
        )
        .unwrap();
    }
    let mut prefixes = BTreeSet::new();
    for field in fields {
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
    out.push_str(
        "Err(RuntimeDiagnostic::unknown_xml_field()) }, core::xml::Token::Text(text) => {\n",
    );
    for (i, field) in physical_fields(fields) {
        if field.attribute.is_some() {
            continue;
        }
        writeln!(out, "if core::xml::matches(path, {}) {{ self.r{i}.as_mut().expect(\"started field\").push_str(text); return Ok(()); }}", path_code(field.path)).unwrap();
    }
    out.push_str("if core::xml::is_whitespace(text) { Ok(()) } else { Err(RuntimeDiagnostic::unexpected_xml_text()) } }, core::xml::Token::End => Ok(()) } }\n");
    out.push_str("#[allow(dead_code,unused_variables)] fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:Option<core::xml::NamespaceScope<'_>>)->core::Result<()>{self.consume(path,token)?;");
    for (i, field) in physical_fields(fields) {
        if field.codec.is_qname() {
            if let Some(attribute) = field.attribute {
                writeln!(out,"if let core::xml::Token::Attribute(attribute)=token && core::xml::matches(path,{}) && {} && let Some(raw)=&mut self.r{i} && let Some((namespace,local))=attribute.qname.as_ref().map(|name|(name.namespace.as_str(),name.local.as_str())).or_else(||scope.and_then(|scope|scope.resolve_qname(raw).ok())){{*raw=format!(\"{{namespace}}\\0{{local}}\");}}",path_code(field.path),super::super::attributes::name_matches(attribute,"attribute.name")).unwrap();
                continue;
            }
            writeln!(out,"if matches!(token,core::xml::Token::End) && core::xml::matches(path,{}) && let Some(raw)=&mut self.r{i} && let Some((namespace,local))=scope.and_then(|scope|scope.resolve_qname(raw).ok()){{*raw=format!(\"{{namespace}}\\0{{local}}\");}}",path_code(field.path)).unwrap();
        }
    }
    out.push_str("Ok(())}\n");

    out.push_str("}\n");
    out
}
