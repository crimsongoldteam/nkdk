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
    let preserve = true;
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
        if xml_side && preserve {
            for i in 0..fields.len() {
                writeln!(out, "let mut shape{i}=false;").unwrap();
            }
        }
        if xml_side {
            if preserve {
                out.push_str("core::xml::visit(source, |path,token| {match token {core::xml::Token::Attribute(_) => {\n");
                for (i, field) in fields.iter().enumerate() {
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
                writeln!(out, "{:?} => {{ positions[{i}] = value.position(); raw.read_mark({i},tag.as_deref(),positions[{i}])?; r{i} = Some(value.{}().map_err(|error| error.field({:?}))?); Ok(()) }},", field.key, field.codec.yaml_input(), field.key).unwrap();
            }
            out.push_str("_ => Err(RuntimeDiagnostic::new(\"yaml.unknown-field\", format!(\"Unknown YAML key: {key}\")).field(key)) } })?;\n");
        }
        for (i, field) in fields.iter().enumerate() {
            if field.optional || preserve {
                writeln!(out, "let f{i} = if let Some(r{i}) = r{i} {{").unwrap();
                if preserve {
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
                        writeln!(out, "match decoded {{ Ok(value) if !shape{i}=>Some(value), Ok(value)=>{{let tree=core::xml::Tree::capture(source,{})?.expect(\"present scalar\");raw.insert({i},core::xml::Patch::read(tree.payload_yaml(&[],Q{id})?.as_bytes(),&[],Q{id})?);Some(value)}}, Err(_)=>{{ let tree=core::xml::Tree::capture(source,{})?.expect(\"present scalar\");raw.insert({i},core::xml::Patch::read(tree.payload_yaml(&[],Q{id})?.as_bytes(),&[],Q{id})?);None }} }}",path_code(field.path),path_code(field.path)).unwrap();
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
                out.push_str("None };\n");
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
    let namespaces: BTreeSet<_> = fields
        .iter()
        .flat_map(|field| field.path)
        .map(|name| name.namespace.as_str())
        .filter(|ns| !ns.is_empty())
        .collect();
    writeln!(
        out,
        "fn write_xml_{id}(value: &V{id}, _inputs: &PreparedInputs) -> core::Result<Vec<u8>> {{"
    )
    .unwrap();
    for (i, field) in fields.iter().enumerate() {
        if preserve {
            let physical = field.path.last().unwrap();
            writeln!(out, "let tree{i}=if let Some(patch)=value.raw.get({i}) {{").unwrap();
            let text = field
                .codec
                .write_reference(&format!("E{id}F{i}"), "field_value", true);
            writeln!(out,"let name=core::xml::Name{{namespace:{:?}.into(),local:{:?}.into()}}; let base=if let Some(field_value)=&value.f{i} {{Some(core::xml::Tree::from_payload_yaml(core::yaml::scalar({text}).as_bytes(),name.clone(),&[],Q{id})?)}} else {{None}}; Some(patch.apply(base,name,&[],Q{id})?) }} else {{ None }};",physical.namespace,physical.local).unwrap();
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
        writeln!(out, "out.field({}, {text});", path_code(field.path)).unwrap();
        if field.optional || preserve {
            out.push_str("}\n");
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
        writeln!(out, "out.push_str(&core::yaml::scalar({:?})); out.push_str(\": \"); if let Some(label)=value.raw.label({i}) {{out.push_str(&label);out.push(' ');}} out.push_str({yaml}); out.push('\\n');", field.key).unwrap();
        if field.optional || preserve {
            out.push_str("}\n");
        }
    }
    out.push_str("if !out.is_empty() { out.pop(); } let bytes=out.into_bytes();\n");
    if preserve {
        out.push_str("let mut bytes=bytes;\n");
        for (i, field) in fields.iter().enumerate() {
            writeln!(out,"if let Some(patch)=value.raw.get({i}) {{ let tree=patch.apply(None,core::xml::Name{{namespace:{:?}.into(),local:{:?}.into()}},&[],Q{id})?;bytes=core::raw::Property::encode({:?},{:?},&bytes,tree.payload_yaml(&[],Q{id})?.as_bytes())?; }}",field.path.last().unwrap().namespace,field.path.last().unwrap().local,field.key,field.path.last().unwrap().local).unwrap();
        }
    }
    out.push_str("Ok(bytes) }\n");
    writeln!(out, "fn verify_{id}(original: &[u8], candidate: &[u8], _inputs: &PreparedInputs) -> core::Result<()> {{ let value = read_yaml_{id}(candidate, _inputs)?; if let Some(error) = check_yaml_{id}(&value, candidate, _inputs).into_iter().find(|error| error.severity == core::Severity::Error) {{ return Err(error); }} let restored = write_xml_{id}(&value, _inputs)?; core::proof::verify_with_attributes(original, &restored, |path| {{").unwrap();
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
    out.push_str("},|_,name| name.namespace==\"http://www.w3.org/2001/XMLSchema-instance\" && name.local==\"type\") }\n");
    if preserve {
        writeln!(out,"fn finalize_yaml_{id}(original:&[u8],candidate:Vec<u8>,_value:&V{id},inputs:&PreparedInputs)->core::Result<Vec<u8>> {{ match verify_{id}(original,&candidate,inputs) {{Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some(\"xml.round-trip-mismatch\")=>{{}},Err(error)=>return Err(error)}} let ordinary=write_xml_{id}(&read_yaml_{id}(&candidate,inputs)?,inputs)?; let mut candidate=candidate;").unwrap();
        for field in &fields {
            writeln!(out,"if let Some(tree)=core::xml::Tree::capture(original,{path})? {{let base=core::xml::Tree::capture(&ordinary,{path})?;let patch=tree.patch_yaml(base.as_ref(),&[],Q{id})?;if patch!=\"{{}}\" {{candidate=core::raw::Property::encode({key:?},{physical:?},&candidate,patch.as_bytes())?;}}}}",path=path_code(field.path),key=field.key,physical=field.path.last().unwrap().local).unwrap();
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
