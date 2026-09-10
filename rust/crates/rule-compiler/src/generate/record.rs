use super::scalar::Codec;
use super::*;
use std::fmt::Write;

struct Field<'a> {
    path: &'a [ExpandedName],
    key: &'a str,
    codec: Codec<'a>,
    optional: bool,
    attributes: Vec<&'a LinkedXmlAttribute>,
    presence: Option<&'a LinkedPresence>,
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
    super::scalar_presence::validate_owner(entry)?;
    let mut shape = entry.clone();
    shape.presence.clear();
    plain_shape(&shape)?;
    let (LinkedType::Record(types), LinkedXml::Record(xml), YamlRepresentation::Mapping(yaml)) =
        (&entry.value, &entry.xml, &entry.yaml)
    else {
        return Err(unsupported(
            entry,
            "Scalar operation requires record XML and YAML representations",
        ));
    };
    let mut fields = vec![];
    for (index, field) in types.iter().enumerate() {
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
        let presence = super::scalar_presence::rule(entry, index, &field.value, program);
        let optional = presence.is_some_and(|presence| presence.yaml_missing.is_some())
            || super::scalar::field_optional(&field.value, program)?;
        let attributes = if let LinkedType::Reference(id) = &field.value {
            let common = program
                .entries
                .iter()
                .find(|entry| entry.id == *id)
                .expect("linked common");
            super::attributes::content(&common.xml).1
        } else {
            Vec::new()
        };
        if matches!(codec, Codec::Choice(_)) && !attributes.is_empty() {
            return Err(unsupported(
                entry,
                "Scalar choice owns its selector; outer attribute composition is not yet supported",
            ));
        }
        fields.push(Field {
            path: &mapping.path,
            key: &yaml.key,
            codec,
            optional,
            attributes,
            presence,
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
    let preserve = true;
    let attribute_code = |field: &Field<'_>, i: usize| {
        if let Codec::Choice(choice) = &field.codec {
            return super::scalar_choice::attributes(choice);
        }

        let dynamic = field
            .attributes
            .iter()
            .any(|attribute| attribute.when.is_some());
        let mut code = String::from(if dynamic { "[" } else { "&[" });
        for (j, attribute) in field.attributes.iter().enumerate() {
            if dynamic {
                if attribute.when.is_some() {
                    write!(code, "(attr_{id}_{i}_{j}(value,_inputs)?).then_some(").unwrap();
                } else {
                    code.push_str("Some(");
                }
            }
            let value = match &attribute.value {
                LinkedXmlAttributeValue::Text(text) => {
                    format!("core::xml::AttributeValue::Text({text:?})")
                }
                LinkedXmlAttributeValue::QName(name) => format!(
                    "core::xml::AttributeValue::QName(({:?},{:?}))",
                    name.namespace, name.local
                ),
            };
            write!(
                code,
                "core::xml::WriteAttribute{{name:({:?},{:?}),value:{value}}}",
                attribute.name.namespace, attribute.name.local
            )
            .unwrap();
            if dynamic {
                code.push(')');
            }
            code.push(',');
        }
        code.push(']');
        if dynamic {
            code.push_str(".iter().flatten()");
        }
        code
    };
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
    if preserve {
        writeln!(out,"const Q{id}: &[(&str,&str)] = &[(\"http://www.w3.org/2001/XMLSchema-instance\",\"type\")];").unwrap();
    }
    for (i, field) in fields.iter().enumerate() {
        if let Some(expression) = field
            .presence
            .and_then(|presence| presence.yaml_omit_when.as_ref())
        {
            out.push_str(&super::scalar_presence::omit(
                expression, i, entry, program,
            )?);
        }
        for (j, attribute) in field.attributes.iter().enumerate() {
            if let Some(expression) = &attribute.when {
                out.push_str(&super::scalar_presence::predicate(
                    expression,
                    i,
                    entry,
                    program,
                    &format!("attr_{id}_{i}_{j}"),
                )?);
            }
        }
        out.push_str(&field.codec.definition(&format!("E{id}F{i}")));
    }
    writeln!(out, "struct V{id} {{").unwrap();
    for (i, field) in fields.iter().enumerate() {
        writeln!(
            out,
            "f{i}: {},",
            if field.optional || preserve {
                format!("Option<{}>", field.codec.rust_type(&format!("E{id}F{i}")))
            } else {
                field.codec.rust_type(&format!("E{id}F{i}"))
            }
        )
        .unwrap();
    }
    if preserve {
        out.push_str("raw: core::raw::Fields,\n");
    }
    if keep_positions {
        writeln!(out, "positions: [core::Position; {}],", fields.len()).unwrap();
    }
    out.push_str("}\n");
    for xml_side in [true, false] {
        let side = if xml_side { "xml" } else { "yaml" };
        if preserve && !xml_side {
            writeln!(out,"fn read_yaml_{id}(source:&[u8],inputs:&PreparedInputs)->core::Result<V{id}> {{ match read_yaml_body_{id}(source,inputs,core::raw::Fields::default()) {{Ok(value)=>Ok(value),Err(error)=>{{let mut raw=core::raw::Fields::default();let mut decoded=source.to_vec();let mut found=false;").unwrap();
            for (i, field) in fields.iter().enumerate() {
                writeln!(out,"if let Some(envelope)=core::raw::Property::decode(&decoded,{:?},{:?})? {{found=true;raw.insert({i},core::xml::Patch::read(&envelope.payload,&[],Q{id})?);decoded=envelope.meaning;}}",field.key,field.path.last().unwrap().local).unwrap();
            }
            writeln!(
                out,
                "if !found {{return Err(error);}}read_yaml_body_{id}(&decoded,inputs,raw)}}}} }}"
            )
            .unwrap();
            writeln!(out,"fn read_yaml_body_{id}(source:&[u8],_inputs:&PreparedInputs,mut raw:core::raw::Fields)->core::Result<V{id}> {{").unwrap();
        } else {
            writeln!(
                out,
                "fn read_{side}_{id}(source:&[u8],_inputs:&PreparedInputs)->core::Result<V{id}> {{"
            )
            .unwrap();
            if preserve {
                out.push_str("let mut raw=core::raw::Fields::default();\n");
            }
        }
        writeln!(
            out,
            "let mut positions = [core::Position::default(); {}];",
            fields.len()
        )
        .unwrap();
        for i in 0..fields.len() {
            writeln!(out, "let mut r{i}: Option<String> = None;").unwrap();
        }
        for (i, field) in fields.iter().enumerate() {
            if matches!(field.codec, Codec::Choice(_)) {
                writeln!(out, "let mut number{i}=false;").unwrap();
            }
        }
        if xml_side && preserve {
            for (i, field) in fields.iter().enumerate() {
                if super::scalar_presence::empty(field.presence, EmptyKind::Nil) {
                    writeln!(out, "let mut nil{i}=false;").unwrap();
                }
                writeln!(out, "let mut shape{i}=false;let mut nested{i}=false;").unwrap();
            }
        }
        if xml_side {
            if preserve {
                out.push_str("core::xml::visit(source, |path,token| {\n");
                for (i, field) in fields.iter().enumerate() {
                    writeln!(out, "if path.len()>{len} && core::xml::matches(&path[..{len}],{path}) {{nested{i}=true;shape{i}=true;return Ok(());}}",len=field.path.len(),path=path_code(field.path)).unwrap();
                }
                out.push_str("match token {core::xml::Token::Attribute(_attribute) => {\n");
                for (i, field) in fields.iter().enumerate() {
                    if let Codec::Choice(choice) = &field.codec {
                        out.push_str(&super::scalar_choice::read_attribute(choice, field.path, i));
                    }
                    if super::scalar_presence::empty(field.presence, EmptyKind::Nil) {
                        writeln!(out,"if core::xml::matches(path,{}) && _attribute.name.namespace==\"http://www.w3.org/2001/XMLSchema-instance\" && _attribute.name.local==\"nil\" && _attribute.text==\"true\" {{nil{i}=true;return Ok(());}}",path_code(field.path)).unwrap();
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
                        writeln!(out,"if core::xml::matches(path,{}) && _attribute.name.namespace=={:?} && _attribute.name.local=={:?} && {valid} {{return Ok(());}}",path_code(field.path),expected.name.namespace,expected.name.local).unwrap();
                    }
                    writeln!(
                        out,
                        "if core::xml::matches(path,{}) {{shape{i}=true;return Ok(());}}",
                        path_code(field.path)
                    )
                    .unwrap();
                }
                out.push_str("Err(RuntimeDiagnostic::new(\"xml.unknown-attribute\",\"Undeclared container attribute\"))},core::xml::Token::Start(offset)=>{\n");
            } else {
                out.push_str("core::xml::visit(source, |path, token| { match token { core::xml::Token::Attribute(_) => Err(RuntimeDiagnostic::new(\"xml.unknown-attribute\", \"Undeclared XML attribute\")), core::xml::Token::Start(offset) => {\n");
            }
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
            out.push_str("core::yaml::visit_tagged_scalars(if source.is_empty() { b\"{}\" } else { source }, |key, value, tag| { match key.as_str() {\n");
            for (i, field) in fields.iter().enumerate() {
                let read = if matches!(field.codec, Codec::Choice(_)) {
                    format!(
                        "let (text,number)=value.into_choice_text().map_err(|error|error.field({:?}))?;number{i}=number;r{i}=Some(text);",
                        field.key
                    )
                } else {
                    format!(
                        "r{i}=Some(value.{}().map_err(|error|error.field({:?}))?);",
                        field.codec.yaml_input(),
                        field.key
                    )
                };
                writeln!(out,"{:?} => {{ positions[{i}]=value.position();raw.read_mark({i},tag.as_deref(),positions[{i}])?;{read}Ok(()) }},",field.key).unwrap();
            }
            out.push_str("_ => Err(RuntimeDiagnostic::new(\"yaml.unknown-field\", format!(\"Unknown YAML key: {key}\")).field(key)) } })?;\n");
        }
        for (i, field) in fields.iter().enumerate() {
            if !xml_side
                && field
                    .presence
                    .is_some_and(|presence| presence.yaml_omit_when.is_some())
            {
                writeln!(out, "let explicit{i}=r{i}.is_some();").unwrap();
            }
            if field.optional || preserve {
                writeln!(out, "let f{i} = if let Some(r{i}) = r{i} {{").unwrap();
                if xml_side {
                    let condition =
                        if super::scalar_presence::empty(field.presence, EmptyKind::Element) {
                            format!("!nested{i} && r{i}.is_empty()")
                        } else if super::scalar_presence::empty(field.presence, EmptyKind::Nil) {
                            format!("!nested{i} && r{i}.is_empty() && nil{i}")
                        } else {
                            "false".into()
                        };
                    writeln!(out, "let empty_absence={condition};").unwrap();
                }
                if preserve {
                    if xml_side {
                        out.push_str("let decoded=if empty_absence {None} else {\n");
                    }
                    writeln!(
                        out,
                        "let decoded=(|| -> core::Result<{}> {{",
                        field.codec.rust_type(&format!("E{id}F{i}"))
                    )
                    .unwrap();
                }
                out.push_str(
                    &field
                        .codec
                        .read(&format!("E{id}F{i}"), i, field.key, xml_side),
                );
                if preserve {
                    writeln!(out, "Ok(f{i}) }})();").unwrap();
                    if xml_side {
                        out.push_str("decoded.ok()};\n");
                        writeln!(out,"let decoded=if nested{i} {{None}} else {{decoded}};if (shape{i} || (decoded.is_none() && !empty_absence)) && !(decoded.is_none() && {canonical_empty}) {{let tree=core::xml::Tree::capture(source,{})?.expect(\"present scalar\");let payload=tree.payload_yaml(&[],Q{id})?;raw.insert({i},core::xml::Patch::read(if payload.is_empty() {{b\"{{}}\"}} else {{payload.as_bytes()}},&[],Q{id})?);}} decoded",path_code(field.path),canonical_empty=matches!(super::scalar_presence::absent_form(field.presence),XmlForm::Nil | XmlForm::EmptyElement)).unwrap();
                    } else {
                        out.push_str("Some(decoded?)");
                    }
                } else {
                    writeln!(out, "Some(f{i})").unwrap();
                }
                out.push_str("} else { ");
                if !field.optional {
                    writeln!(out,"if raw.get({i}).is_none() {{return Err(RuntimeDiagnostic::new(\"value.missing\",\"Missing scalar\").field({:?}));}}",field.key).unwrap();
                }
                let missing = field.presence.and_then(|presence| {
                    if xml_side {
                        presence.xml_missing.as_ref()
                    } else {
                        presence.yaml_missing.as_ref()
                    }
                });
                let missing = super::scalar_presence::missing(
                    missing,
                    &field.codec,
                    &format!("E{id}F{i}"),
                    entry,
                )?;
                if missing == "None" {
                    out.push_str("None };\n");
                } else {
                    writeln!(
                        out,
                        "if raw.get({i}).is_some() {{None}} else {{{missing}}} }};"
                    )
                    .unwrap();
                }
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
            "let {}value=V{id} {{ {} {} }};",
            if xml_side { "mut " } else { "" },
            format_args!(
                "{}{}",
                if keep_positions { "positions," } else { "" },
                if preserve {
                    String::from("raw,")
                } else {
                    String::new()
                }
            ),
            (0..fields.len())
                .map(|i| format!("f{i}"))
                .collect::<Vec<_>>()
                .join(",")
        )
        .unwrap();
        if !xml_side {
            for (i, field) in fields.iter().enumerate() {
                if field
                    .presence
                    .is_some_and(|presence| presence.yaml_omit_when.is_some())
                {
                    writeln!(out,"if explicit{i} && value.f{i}.is_some() && value.raw.get({i}).is_none() && omit_{id}_{i}(&value,_inputs)? {{return Err(RuntimeDiagnostic::new(\"yaml.implicit-value\",\"This value is represented by an omitted property\").field({:?}));}}",field.key).unwrap();
                }
            }
        }
        if xml_side {
            writeln!(
                out,
                "let issues=issues_xml_{id}(&value,source,_inputs);value.raw.infer(&{:?},issues)?;",
                fields.iter().map(|field| field.key).collect::<Vec<_>>()
            )
            .unwrap();
        }
        out.push_str("Ok(value) }\n");
    }
    let mut namespaces: BTreeSet<_> = fields
        .iter()
        .flat_map(|field| field.path)
        .map(|name| name.namespace.as_str())
        .filter(|ns| !ns.is_empty())
        .collect();
    for field in &fields {
        if let Codec::Choice(choice) = &field.codec
            && let Some(value) = &choice.cases[0].emit
        {
            namespaces.insert(choice.attribute.namespace.as_str());
            namespaces.insert(value.namespace.as_str());
        }
        for attribute in &field.attributes {
            namespaces.insert(attribute.name.namespace.as_str());
            if let LinkedXmlAttributeValue::QName(name) = &attribute.value {
                namespaces.insert(name.namespace.as_str());
            }
        }
    }
    if fields
        .iter()
        .any(|field| super::scalar_presence::absent_form(field.presence) == XmlForm::Nil)
    {
        namespaces.insert("http://www.w3.org/2001/XMLSchema-instance");
    }
    namespaces.remove("");
    writeln!(
        out,
        "fn write_xml_{id}(value: &V{id}, _inputs: &PreparedInputs) -> core::Result<Vec<u8>> {{"
    )
    .unwrap();
    for (i, field) in fields.iter().enumerate() {
        if preserve {
            let physical = field.path.last().unwrap();
            writeln!(out, "let tree{i}=if let Some(patch)=value.raw.get({i}) {{ if {null_is_absence} {{None}} else {{",null_is_absence=if super::scalar_presence::absent_form(field.presence) != XmlForm::Missing || field.presence.and_then(|presence|presence.yaml_missing.as_ref()).is_some_and(|value|matches!(value.kind,LinkedExpressionKind::Literal(_))) {"patch.is_null()"} else {"false"}).unwrap();
            let text = field
                .codec
                .write_reference(&format!("E{id}F{i}"), "field_value", true);
            let tree = format!(
                "core::xml::Tree::scalar(name.clone(),{text},{})",
                attribute_code(field, i)
            );
            let base = if field
                .attributes
                .iter()
                .any(|attribute| attribute.when.is_some())
            {
                format!(
                    "value.f{i}.as_ref().map(|field_value| -> core::Result<_> {{Ok({tree})}}).transpose()?"
                )
            } else {
                format!("value.f{i}.as_ref().map(|field_value|{tree})")
            };
            let base = match super::scalar_presence::absent_form(field.presence) {
                XmlForm::Nil | XmlForm::EmptyElement => format!(
                    "({base}).or_else(||Some(core::xml::Tree::scalar(name.clone(),\"\",{})))",
                    super::scalar_presence::absent_attributes(
                        &super::scalar_presence::absent_form(field.presence)
                    )
                ),
                _ => base,
            };
            writeln!(out,"let name=core::xml::Name{{namespace:{:?}.into(),local:{:?}.into()}}; let base={base}; Some(patch.apply(base,name,&[],Q{id})?) }} }} else {{ None }};",physical.namespace,physical.local).unwrap();
        }
    }
    if preserve {
        writeln!(out,"let mut extra_namespaces=Vec::new();if !value.raw.is_empty() {{extra_namespaces.extend_from_slice(&{:?});",namespaces.iter().copied().collect::<Vec<_>>()).unwrap();
        for i in 0..fields.len() {
            writeln!(
                out,
                "if let Some(tree)=&tree{i} {{tree.collect_namespaces(&mut extra_namespaces);}}"
            )
            .unwrap();
        }
        writeln!(out,"}} let mut out=core::xml::Writer::new(if extra_namespaces.is_empty() {{&{:?}}} else {{&extra_namespaces}});",namespaces.into_iter().collect::<Vec<_>>()).unwrap();
    } else {
        writeln!(
            out,
            "let mut out=core::xml::Writer::new(&{:?});",
            namespaces.into_iter().collect::<Vec<_>>()
        )
        .unwrap();
    }
    writeln!(out, "out.container({});", path_code(&first.path[..1])).unwrap();
    for (i, field) in fields.iter().enumerate() {
        let text = if field.optional || preserve {
            writeln!(
                out,
                "if let Some(field_value) = &value.f{i} {} {{",
                if preserve {
                    format!("&& value.raw.get({i}).is_none()")
                } else {
                    String::new()
                }
            )
            .unwrap();
            field
                .codec
                .write_reference(&format!("E{id}F{i}"), "field_value", true)
        } else {
            field.codec.write(&format!("E{id}F{i}"), i, true)
        };
        writeln!(
            out,
            "out.field_with_attributes({}, {text}, {});",
            path_code(field.path),
            attribute_code(field, i)
        )
        .unwrap();
        if field.optional || preserve {
            out.push_str("}\n");
        }
        let form = super::scalar_presence::absent_form(field.presence);
        if matches!(form, XmlForm::Nil | XmlForm::EmptyElement) {
            writeln!(out,"if value.f{i}.is_none() && value.raw.get({i}).is_none() {{out.field_with_attributes({},\"\",{});}}",path_code(field.path),super::scalar_presence::absent_attributes(&form)).unwrap();
        }
        if preserve {
            writeln!(
                out,
                "if let Some(tree)=&tree{i} {{tree.write_at(&mut out,{},Q{id})?;}}",
                path_code(&field.path[..field.path.len() - 1])
            )
            .unwrap();
        }
    }
    out.push_str("Ok(out.finish()) }\n");
    writeln!(
        out,
        "fn write_yaml_{id}(value: &V{id}, _inputs: &PreparedInputs) -> core::Result<Vec<u8>> {{ let mut out = String::new();"
    )
    .unwrap();
    for (i, field) in fields.iter().enumerate() {
        let text = if field.optional || preserve {
            write!(out, "if let Some(field_value) = &value.f{i}").unwrap();
            if field
                .presence
                .is_some_and(|presence| presence.yaml_omit_when.is_some())
            {
                write!(
                    out,
                    " && (!omit_{id}_{i}(value,_inputs)? || (value.raw.get({i}).is_some() && {}))",
                    field
                        .codec
                        .yaml_representable(&format!("E{id}F{i}"), "field_value")
                )
                .unwrap();
            }
            out.push_str(" {\n");
            field
                .codec
                .write_reference(&format!("E{id}F{i}"), "field_value", false)
        } else {
            field.codec.write(&format!("E{id}F{i}"), i, false)
        };
        let yaml = if field.codec.plain_yaml() {
            text
        } else {
            format!("&core::yaml::scalar({text})")
        };
        writeln!(out, "out.push_str(&core::yaml::scalar({:?})); out.push_str(\": \"); if let Some(label)=value.raw.label({i}) {{out.push_str(&label);out.push(' ');}} out.push_str({yaml}); out.push('\\n');", field.key).unwrap();
        if field.optional || preserve {
            out.push_str("}\n");
        }
    }
    out.push_str("if !out.is_empty() { out.pop(); } let bytes=out.into_bytes();\n");
    if preserve {
        out.push_str("let mut bytes=bytes;\n");
        for (i, field) in fields.iter().enumerate() {
            writeln!(out,"if let Some(patch)=value.raw.get({i}) {{ if patch.is_null() {{bytes=core::raw::Property::encode({key:?},{physical:?},&bytes,b\"null\")?;}} else {{let tree=patch.apply(None,core::xml::Name{{namespace:{:?}.into(),local:{:?}.into()}},&[],Q{id})?;let payload=tree.payload_yaml(&[],Q{id})?;bytes=core::raw::Property::encode({:?},{:?},&bytes,if payload.is_empty() {{b\"{{}}\"}} else {{payload.as_bytes()}})?; }} }}",field.path.last().unwrap().namespace,field.path.last().unwrap().local,field.key,field.path.last().unwrap().local,key=field.key,physical=field.path.last().unwrap().local).unwrap();
        }
    }
    out.push_str("Ok(bytes) }\n");
    writeln!(out, "fn verify_{id}(original: &[u8], candidate: &[u8], _inputs: &PreparedInputs) -> core::Result<()> {{ let value = read_yaml_{id}(candidate, _inputs)?; if let Some(error) = check_yaml_{id}(&value, candidate, _inputs).into_iter().find(|error| error.severity == core::Severity::Error) {{ return Err(error); }} let restored = write_xml_{id}(&value, _inputs)?; core::proof::verify_with_attributes(original, &restored, |path| {{").unwrap();
    out.push_str(
        &fields
            .iter()
            .enumerate()
            .map(|(i, field)| {
                format!(
                    "value.f{i}.is_some() && core::xml::matches(path, {})",
                    path_code(field.path)
                )
            })
            .collect::<Vec<_>>()
            .join(" || "),
    );
    if fields.is_empty() {
        out.push_str("false");
    }
    out.push_str("},|_,name| name.namespace==\"http://www.w3.org/2001/XMLSchema-instance\" && name.local==\"type\") }\n");
    if preserve {
        writeln!(out,"fn finalize_yaml_{id}(original:&[u8],candidate:Vec<u8>,_value:&V{id},inputs:&PreparedInputs)->core::Result<Vec<u8>> {{ match verify_{id}(original,&candidate,inputs) {{Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some(\"xml.round-trip-mismatch\")=>{{}},Err(error)=>return Err(error)}} let ordinary=write_xml_{id}(&read_yaml_{id}(&candidate,inputs)?,inputs)?; let mut candidate=candidate;").unwrap();
        for (i, field) in fields.iter().enumerate() {
            let mut restore_meaning = String::new();
            if field
                .presence
                .is_some_and(|presence| presence.yaml_omit_when.is_some())
            {
                let name = format!("E{id}F{i}");
                let text = field.codec.write_reference(&name, "field_value", false);
                let yaml = if field.codec.plain_yaml() {
                    text.trim_start_matches('&').to_owned()
                } else {
                    format!("core::yaml::scalar({text})")
                };
                write!(restore_meaning, "if _value.raw.get({i}).is_none() && omit_{id}_{i}(_value,inputs)? && let Some(field_value)=&_value.f{i} && {} {{if !candidate.is_empty() {{candidate.push(b'\\n');}} candidate.extend_from_slice(core::yaml::scalar({:?}).as_bytes());candidate.extend_from_slice(b\": \");candidate.extend_from_slice(({yaml}).as_bytes());}}", field.codec.yaml_representable(&name, "field_value"), field.key).unwrap();
            }
            writeln!(out,"if let Some(tree)=core::xml::Tree::capture(original,{path})? {{let base=core::xml::Tree::capture(&ordinary,{path})?;let patch=tree.patch_yaml(base.as_ref(),&[],Q{id})?;if patch!=\"{{}}\" {{{restore_meaning}candidate=core::raw::Property::encode({key:?},{physical:?},&candidate,if patch.is_empty() {{b\"\\\"\\\"\"}} else {{patch.as_bytes()}})?;}}}} else if core::xml::Tree::capture(&ordinary,{path})?.is_some() {{candidate=core::raw::Property::encode({key:?},{physical:?},&candidate,b\"null\")?;}}",path=path_code(field.path),key=field.key,physical=field.path.last().unwrap().local).unwrap();
        }
        writeln!(
            out,
            "verify_{id}(original,&candidate,inputs)?;Ok(candidate) }}"
        )
        .unwrap();
    } else {
        writeln!(out, "fn finalize_yaml_{id}(original: &[u8], candidate: Vec<u8>, _value: &V{id}, inputs: &PreparedInputs) -> core::Result<Vec<u8>> {{ verify_{id}(original, &candidate, inputs)?; Ok(candidate) }}").unwrap();
    }
    Ok(out)
}
