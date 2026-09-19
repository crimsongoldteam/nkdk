mod container;
mod text;
mod xml_read;
mod yaml_read;
use super::scalar::Codec;
use super::*;
use std::fmt::Write;

struct Field<'a> {
    xml: Option<&'a LinkedXmlField>,
    path: &'a [ExpandedName],
    attribute: Option<&'a ExpandedName>,
    key: &'a str,
    yaml_visible: bool,
    yaml_projected: bool,
    codec: Codec<'a>,
    optional: bool,
    attributes: Vec<&'a LinkedXmlAttribute>,
    presence: Option<&'a LinkedPresence>,
}
impl Field<'_> {
    fn physical_name(&self) -> &ExpandedName {
        self.attribute.unwrap_or_else(|| self.path.last().unwrap())
    }
}
fn physical_fields<'s, 'a>(
    fields: &'s [Field<'a>],
) -> impl Iterator<Item = (usize, &'s Field<'a>)> {
    fields
        .iter()
        .enumerate()
        .filter(|(_, field)| field.xml.is_some())
}
// Diagnostic and exceptional XML names do not make a field a normal YAML key.
pub(super) fn diagnostic_key<'a>(entry: &'a LinkedEntry, name: &'a str) -> &'a str {
    crate::plan::diagnostic_key(entry, name)
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
    if let Some(code) = super::record_reference::generate(entry, program)? {
        return Ok(code);
    }
    if let Some(code) = super::declared_items::generate(entry, program)? {
        return Ok(code);
    }
    if super::owner::applies(entry, program) {
        return super::owner::generate(entry, program);
    }
    if let Some(source) = super::qname::generate(entry, program)? {
        return Ok(source);
    }
    if let Some(layout) = super::nested_record::lower(entry, program)? {
        return generate_at(&layout.entry, program, Some(&layout), false, None);
    }
    if let Some(source) = super::composite::generate(entry, program)? {
        return Ok(source);
    }
    if let Some(source) = super::collections::generate(entry, program)? {
        return Ok(source);
    }
    generate_at(entry, program, None, false, None)
}
pub(super) fn generate_deferred(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    generate_at(entry, program, None, true, None)
}
pub(super) fn generate_value_at(
    entry: &LinkedEntry,
    program: &Program,
    boundary: &[ExpandedName],
) -> Result<String, Diagnostic> {
    generate_at(entry, program, None, false, Some(boundary))
}
fn generate_at(
    entry: &LinkedEntry,
    program: &Program,
    layout: Option<&super::nested_record::Layout>,
    defer_inference: bool,
    boundary: Option<&[ExpandedName]>,
) -> Result<String, Diagnostic> {
    super::scalar_presence::validate_owner(entry)?;
    let mut shape = entry.clone();
    shape.presence.clear();
    plain_shape(&shape)?;
    let record = program.record(entry)?;
    let mut fields = vec![];
    for planned in &record.fields {
        let index = planned.id.0;
        let field = planned.field;
        let mapping = planned.xml;
        if mapping.is_some_and(|mapping| mapping.path.is_empty()) {
            return Err(unsupported(
                entry,
                "Empty-route generation is not available at this stage",
            ));
        }
        let codec = Codec::resolve(&field.value, entry, program)?;
        let presence = super::scalar_presence::rule(entry, index, &field.value, program);
        let optional = match presence {
            Some(rule) => rule.yaml_missing.is_some(),
            None => super::scalar::field_optional(&field.value, program)?,
        };
        let attributes = if let LinkedType::Reference(id) = &field.value
            && mapping.is_some()
        {
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
        if mapping.is_some_and(|mapping| mapping.attribute.is_some())
            && (!matches!(
                codec,
                Codec::Text
                    | Codec::Boolean(..)
                    | Codec::Decimal
                    | Codec::Enumeration(..)
                    | Codec::States(..)
            ) || presence
                .is_some_and(|rule| !rule.xml_empty.is_empty() || !rule.canonical.is_empty())
                || !attributes.is_empty())
        {
            return Err(unsupported(
                entry,
                "Attribute fields require a scalar codec and missing-value presence without element-only forms or attached attributes",
            ));
        }
        fields.push(Field {
            xml: mapping,
            path: mapping.map_or(&[], |mapping| mapping.path.as_slice()),
            attribute: mapping.and_then(|mapping| mapping.attribute.as_ref()),
            key: planned.diagnostic_key(),
            yaml_visible: planned.yaml.is_some()
                || matches!(&entry.yaml, YamlRepresentation::Projection(name) if name == &field.name),
            yaml_projected: matches!(&entry.yaml, YamlRepresentation::Projection(name) if name == &field.name),
            codec,
            optional,
            attributes,
            presence,
        });
    }
    let first = fields.iter().find(|field| field.xml.is_some());
    if first.is_none() && !defer_inference {
        return Err(unsupported(
            entry,
            "An empty record has no XML document root",
        ));
    };
    if first.is_some_and(|first| {
        physical_fields(&fields).any(|(_, field)| field.path[0] != first.path[0])
    }) {
        return Err(unsupported(
            entry,
            "All fields must belong to a single XML document root",
        ));
    }
    // Header attributes must be written before any descendant value. A single
    // ancestor chain gives a streaming order without buffering child documents.
    let mut headers: Vec<_> = fields
        .iter()
        .enumerate()
        .filter(|(_, field)| field.attribute.is_some())
        .collect();
    headers.sort_by_key(|(_, field)| field.path.len());
    if layout.is_some() && fields.iter().all(|field| field.attribute.is_some()) {
        return Err(unsupported(
            entry,
            "Nested records currently require an element field",
        ));
    }
    if headers
        .windows(2)
        .any(|pair| !pair[1].1.path.starts_with(pair[0].1.path))
        || headers.last().is_some_and(|(_, header)| {
            fields
                .iter()
                .filter(|field| field.xml.is_some() && field.attribute.is_none())
                .any(|field| {
                    field.path.len() <= header.path.len() || !field.path.starts_with(header.path)
                })
        })
    {
        return Err(unsupported(
            entry,
            "Attribute headers require an ancestor container chain and all element fields below that chain",
        ));
    }
    let container = container::prepare(
        entry,
        program,
        boundary.or_else(|| first.map(|field| &field.path[..1])),
    )?;
    let id = entry.id;
    let text_record = matches!(entry.yaml, YamlRepresentation::TextPattern(_));
    let read_yaml_name = format!("read_yaml_{}{id}", if text_record { "plain_" } else { "" });
    let read_xml_name = format!("read_xml_{}{id}", if text_record { "plain_" } else { "" });
    let write_yaml_name = format!("write_yaml_{}{id}", if text_record { "plain_" } else { "" });
    let write_xml_name = format!("write_xml_{}{id}", if text_record { "plain_" } else { "" });
    let finalize_name = format!(
        "finalize_yaml_{}{id}",
        if text_record { "plain_" } else { "" }
    );

    let parent = layout.map_or("None".to_owned(), |layout| {
        format!("Some({:?})", layout.key)
    });
    let preserve = true;
    let attribute_code = |field: &Field<'_>, i: usize| {
        if let Codec::Choice(choice) = &field.codec {
            return super::scalar_choice::attributes(choice);
        }
        if let Codec::Forms(choice) = &field.codec
            && choice.discriminated()
        {
            return choice.attributes(&format!("E{id}F{i}"));
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
    let keep_positions = fields
        .iter()
        .any(|field| field.codec.child_check_method().is_some())
        || entry.constraints.iter().any(|constraint| {
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
        let mut qnames = vec![("http://www.w3.org/2001/XMLSchema-instance", "type")];
        if let Some(container) = &container {
            qnames.extend(&container.qnames);
        }
        qnames.sort_unstable();
        qnames.dedup();
        writeln!(out, "const Q{id}: &[(&str,&str)] = &{qnames:?};").unwrap();
    }
    if let Some(container) = &container {
        out.push_str(&container.code.definitions);
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
        if let Some(canonical) = field
            .presence
            .and_then(|presence| presence.canonical.first())
            && canonical.form == XmlForm::Missing
            && let Some(expression) = &canonical.when
        {
            if field.attribute.is_some() {
                return Err(unsupported(
                    entry,
                    "Conditional scalar omission requires an XML element",
                ));
            }
            out.push_str(&super::scalar_presence::predicate(
                expression,
                i,
                entry,
                program,
                &format!("xml_omit_{id}_{i}"),
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
        out.push_str(&field.codec.definition(&format!("E{id}F{i}"))?);
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
    if layout.is_some() {
        out.push_str("present: bool,\n");
    }
    if keep_positions {
        writeln!(out, "positions: [core::Position; {}],", fields.len()).unwrap();
    }
    out.push_str("}\n");
    if fields
        .iter()
        .all(|field| field.codec.input_method().is_some())
    {
        writeln!(out,"#[allow(dead_code)] fn construct_{id}(slots:&[Option<core::inputs::InputRef<'_>>],inputs:&InputView<'_>)->core::Result<V{id}>{{let inputs=inputs.rebind(slots);").unwrap();
        for (index, field) in fields.iter().enumerate() {
            let method = field.codec.input_method().unwrap();
            let read = format!("inputs.{method}({index})?");
            let value = match &field.codec {
                Codec::Text | Codec::TextTable(_) | Codec::QNameText(_) => {
                    format!("{read}.to_owned()")
                }
                Codec::Boolean(..) => read,
                Codec::Decimal | Codec::FormattedDecimal(_) => format!("{read}.clone()"),
                Codec::Enumeration(variants, ..)
                | Codec::QNameEnumeration(variants, ..)
                | Codec::States(variants, ..) => {
                    let mut result = format!("match {read}{{");
                    for (variant, item) in variants.iter().enumerate() {
                        write!(result, "{:?}=>E{id}F{index}::V{variant},", item.value).unwrap();
                    }
                    result.push_str("_=>return Err(RuntimeDiagnostic::new(\"value.invalid\",\"Unknown semantic enumeration value\"))}");
                    result
                }
                _ => unreachable!("borrowable scalar constructor"),
            };
            writeln!(
                out,
                "let f{index}=if inputs.is_present({index})?{{Some({value})}}else{{None}};"
            )
            .unwrap();
        }
        write!(out, "Ok(V{id}{{").unwrap();
        for index in 0..fields.len() {
            write!(out, "f{index},").unwrap();
        }
        if preserve {
            out.push_str("raw:core::raw::Fields::default(),");
        }
        if layout.is_some() {
            out.push_str("present:true,");
        }
        if keep_positions {
            write!(
                out,
                "positions:[core::Position::default();{}],",
                fields.len()
            )
            .unwrap();
        }
        out.push_str("})}\n");
    }
    out.push_str(&xml_read::generate(
        id,
        &fields,
        layout,
        &headers,
        container
            .as_ref()
            .map_or("", |container| container.code.read.as_str()),
    ));
    let xml_bindings = xml_read::bindings(id, &fields, layout, &headers);
    out.push_str(&yaml_read::generate(id, &fields));
    let yaml_bindings = yaml_read::bindings(id, &fields);
    let yaml_present = if layout.is_some() {
        "present:bool,"
    } else {
        ""
    };
    let yaml_events=layout.map_or_else(
        ||format!("core::yaml::visit_scalar_events(events,|key,value,tag|state.consume(key,value,tag))?;finish_yaml_{id}(state,source,_inputs)"),
        |layout|format!("let present=core::yaml::visit_record_scalar_events(events,{:?},|key,value,tag|state.consume(key,value,tag))?;finish_yaml_{id}(state,present,source,_inputs)",layout.key),
    );
    let yaml_events = if let YamlRepresentation::TextPattern(parts) = &entry.yaml {
        if layout.is_some() {
            return Err(unsupported(
                entry,
                "Nested text record placement is not supported yet",
            ));
        }
        out.push_str(&text::definition(entry, parts, &fields)?);
        out.push_str(&text::reader(entry));
        text::read(id)
    } else if let YamlRepresentation::Projection(_) = &entry.yaml {
        if layout.is_some() {
            return Err(unsupported(
                entry,
                "Nested whole-field projection is not supported yet",
            ));
        }
        let index = fields
            .iter()
            .position(|field| field.yaml_projected)
            .expect("linked YAML projection");
        out.push_str(&yaml_read::projection_reader(id, index, &fields[index]));
        yaml_read::projection_read(id)
    } else {
        yaml_events
    };
    for xml_side in [true, false] {
        let side = if xml_side { "xml" } else { "yaml" };
        if preserve && !xml_side {
            writeln!(out,"fn {read_yaml_name}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{ match read_yaml_body_{id}(source,inputs,core::raw::Fields::default()) {{Ok(value)=>Ok(value),Err(error)=>{{let mut raw=core::raw::Fields::default();let mut decoded=source.to_vec();let mut found=false;").unwrap();
            for (i, field) in physical_fields(&fields) {
                if matches!(entry.yaml, YamlRepresentation::Projection(_)) {
                    writeln!(out,"if let Some(envelope)=core::raw::Document::decode(&decoded)? {{found=true;raw.insert({i},core::xml::Patch::read(&envelope.payload,&[],Q{id})?);decoded=envelope.meaning;}}").unwrap();
                } else {
                    writeln!(out,"if let Some(envelope)=core::raw::Property::decode_in(&decoded,{parent},{:?},{:?})? {{found=true;raw.insert({i},core::xml::Patch::read(&envelope.payload,&[],Q{id})?);decoded=envelope.meaning;}}",field.key,field.physical_name().local).unwrap();
                }
            }
            writeln!(
                out,
                "if !found {{return Err(error);}}read_yaml_body_{id}(&decoded,inputs,raw)}}}} }}"
            )
            .unwrap();
            writeln!(out,"fn read_yaml_body_{id}(source:&[u8],inputs:&InputView<'_>,raw:core::raw::Fields)->core::Result<V{id}> {{read_yaml_events_{id}(source,inputs,raw,core::yaml::DocumentSource(if source.is_empty() {{b\"{{}}\"}} else {{source}}))}}\nfn read_yaml_events_{id}(source:&[u8],_inputs:&InputView<'_>,raw:core::raw::Fields,events:impl core::yaml::Source)->core::Result<V{id}> {{let mut state=YamlFields{id}::new(raw)?;{yaml_events}}}\nfn finish_yaml_{id}(state:YamlFields{id},{yaml_present}source:&[u8],_inputs:&InputView<'_>)->core::Result<V{id}> {{let _=source;{yaml_bindings}").unwrap();
        } else {
            if xml_side {
                writeln!(out, "fn {read_xml_name}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{read_xml_events_{id}(source,inputs,core::xml::DocumentSource(source))}}\nfn read_xml_events_{id}(source:&[u8],_inputs:&InputView<'_>,events:impl core::xml::Source)->core::Result<V{id}> {{let mut state=XmlRead{id}::new();events.visit(|path,token|state.consume(path,token))?;finish_xml_{id}(state,source,_inputs)}}\nfn finish_xml_{id}(state:XmlRead{id},source:&[u8],_inputs:&InputView<'_>)->core::Result<V{id}> {{let _=source;{xml_bindings}").unwrap();
            } else {
                writeln!(out, "fn read_{side}_{id}(source:&[u8],_inputs:&InputView<'_>)->core::Result<V{id}> {{").unwrap();
            }
            if preserve {
                out.push_str("let mut raw=core::raw::Fields::default();\n");
            }
        }
        for &i in record.schedule(if xml_side {
            crate::plan::RepresentationSide::Xml
        } else {
            crate::plan::RepresentationSide::Yaml
        }) {
            let field = &fields[i];
            if xml_side && field.xml.is_none() {
                let missing = super::scalar_presence::missing(
                    field
                        .presence
                        .and_then(|presence| presence.xml_missing.as_ref()),
                    &field.codec,
                    &format!("E{id}F{i}"),
                    entry,
                    program,
                )?;
                if layout.is_some() {
                    writeln!(out, "let f{i} = if present {{{missing}}} else {{None}};").unwrap();
                } else {
                    writeln!(out, "let f{i} = {missing};").unwrap();
                }
                continue;
            }
            if xml_side && field.attribute.is_some() {
                let missing_restores_value = field.presence.is_some_and(|rule| {
                    [&rule.xml_missing, &rule.yaml_missing].iter().any(|value| {
                        value.as_ref().is_some_and(|value| {
                            !matches!(value.kind, LinkedExpressionKind::Absent)
                        })
                    })
                });
                if !field.optional || missing_restores_value {
                    writeln!(out, "if {}r{i}.is_none() {{raw.insert({i},core::xml::Patch::read(b\"null\",&[],Q{id})?);}}",if layout.is_some(){"present && "}else{""}).unwrap();
                }
                let missing = super::scalar_presence::missing(
                    field.presence.and_then(|rule| rule.xml_missing.as_ref()),
                    &field.codec,
                    &format!("E{id}F{i}"),
                    entry,
                    program,
                )?;
                if matches!(field.codec, Codec::Text) {
                    writeln!(
                        out,
                        "let f{i}=if r{i}.is_some() {{r{i}}} else {{{missing}}};"
                    )
                    .unwrap();
                    continue;
                }
                let original = if matches!(field.codec, Codec::Decimal) {
                    format!("r{i}.clone()")
                } else {
                    format!("r{i}.as_str()")
                };
                let original_ref = if matches!(field.codec, Codec::Decimal) {
                    "&original"
                } else {
                    "original"
                };
                writeln!(out,"let f{i}=if let Some(r{i})=r{i} {{let original={original};let decoded=(||->core::Result<{}>{{",field.codec.rust_type(&format!("E{id}F{i}"))).unwrap();
                out.push_str(&field.codec.read(&format!("E{id}F{i}"), i, field.key, true));
                writeln!(out,"Ok(f{i})}})();match decoded {{Ok(value)=>{{let field_value=&value;let canonical:&str={};if canonical!=original {{raw.insert({i},core::xml::Patch::read(core::yaml::scalar({original_ref}).as_bytes(),&[],Q{id})?);}}Some(value)}},Err(_)=>{{raw.insert({i},core::xml::Patch::read(core::yaml::scalar({original_ref}).as_bytes(),&[],Q{id})?);None}}}}}} else {{{missing}}};",field.codec.write_reference(&format!("E{id}F{i}"),"field_value",true)).unwrap();
                continue;
            }
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
                        writeln!(out,"let decoded=if nested{i} {{None}} else {{decoded}};if (shape{i} || (decoded.is_none() && !empty_absence)) && !(decoded.is_none() && {canonical_empty}) {{let tree=core::xml::Tree::capture_at(source,{},positions[{i}].xml_offset().expect(\"XML field position\"))?.expect(\"present scalar\");let payload=tree.patch_yaml(None,&[],Q{id})?;raw.insert({i},core::xml::Patch::read(if payload.is_empty() {{b\"{{}}\"}} else {{payload.as_bytes()}},&[],Q{id})?);}} decoded",path_code(field.path),canonical_empty=matches!(super::scalar_presence::absent_form(field.presence),XmlForm::Nil | XmlForm::EmptyElement)).unwrap();
                    } else {
                        out.push_str("Some(decoded?)");
                    }
                } else {
                    writeln!(out, "Some(f{i})").unwrap();
                }
                out.push_str("} else { ");
                let guard_absent_record = layout.is_some()
                    && (!field.optional
                        || field
                            .presence
                            .and_then(|presence| {
                                if xml_side {
                                    presence.xml_missing.as_ref()
                                } else {
                                    presence.yaml_missing.as_ref()
                                }
                            })
                            .is_some_and(|value| {
                                !matches!(value.kind, LinkedExpressionKind::Absent)
                            }));
                if guard_absent_record {
                    out.push_str("if !present {None} else { ");
                }
                if !field.optional {
                    if xml_side {
                        if field
                            .presence
                            .and_then(|presence| presence.xml_missing.as_ref())
                            .is_none()
                        {
                            writeln!(
                                out,
                                "raw.insert({i},core::xml::Patch::read(b\"null\",&[],Q{id})?);"
                            )
                            .unwrap();
                        }
                    } else {
                        writeln!(out,"if raw.get({i}).is_none() {{return Err(RuntimeDiagnostic::new(\"value.missing\",\"Missing scalar\").field({:?}));}}",field.key).unwrap();
                    }
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
                    program,
                )?;
                if missing == "None" {
                    out.push_str(if guard_absent_record {
                        "None }};\n"
                    } else {
                        "None };\n"
                    });
                } else {
                    writeln!(
                        out,
                        "if raw.get({i}).is_some() {{None}} else {{{missing}}} }}{nested_close};",
                        nested_close = if guard_absent_record { "}" } else { "" }
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
            if xml_side && !defer_inference {
                "mut "
            } else {
                ""
            },
            format_args!(
                "{}{}",
                if keep_positions { "positions," } else { "" },
                if preserve {
                    String::from(if layout.is_some() {
                        "raw,present,"
                    } else {
                        "raw,"
                    })
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
        if !xml_side && !text_record {
            for (i, field) in fields.iter().enumerate() {
                if field
                    .presence
                    .is_some_and(|presence| presence.yaml_omit_when.is_some())
                {
                    writeln!(out,"if explicit{i} && value.f{i}.is_some() && value.raw.get({i}).is_none() && omit_{id}_{i}(&value,_inputs)? {{return Err(RuntimeDiagnostic::new(\"yaml.implicit-value\",\"This value is represented by an omitted property\").field({:?}));}}",field.key).unwrap();
                }
            }
        }
        if xml_side && !defer_inference {
            writeln!(out, "infer_xml_{id}(&mut value,source,_inputs)?;").unwrap();
        }
        out.push_str("Ok(value) }\n");
    }
    if matches!(entry.yaml, YamlRepresentation::TextPattern(_)) {
        writeln!(out, "fn infer_xml_{id}(value:&mut V{id},source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{let issues=issues_xml_{id}(value,source,inputs);value.raw.infer_value({},issues)}}",fields.len()).unwrap();
    } else {
        writeln!(out, "fn infer_xml_{id}(value:&mut V{id},source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{let issues=issues_xml_{id}(value,source,inputs);value.raw.infer(&{:?},issues)}}",fields.iter().map(|field| field.key).collect::<Vec<_>>()).unwrap();
    }
    let mut namespaces: BTreeSet<_> = fields
        .iter()
        .flat_map(|field| field.path)
        .map(|name| name.namespace.as_str())
        .filter(|ns| !ns.is_empty())
        .collect();
    for field in fields.iter().filter(|field| field.xml.is_some()) {
        if let Some(attribute) = field.attribute {
            namespaces.insert(attribute.namespace.as_str());
        }
        if let Codec::Choice(choice) = &field.codec
            && let Some(value) = &choice.cases[0].emit
        {
            namespaces.insert(choice.attribute.namespace.as_str());
            namespaces.insert(value.namespace.as_str());
        }
        if let Codec::Forms(choice) = &field.codec {
            namespaces.extend(choice.xml_namespaces());
        }
        for attribute in &field.attributes {
            namespaces.insert(attribute.name.namespace.as_str());
            if let LinkedXmlAttributeValue::QName(name) = &attribute.value {
                namespaces.insert(name.namespace.as_str());
            }
        }
    }
    if fields.iter().any(|field| {
        field.xml.is_some() && super::scalar_presence::absent_form(field.presence) == XmlForm::Nil
    }) {
        namespaces.insert("http://www.w3.org/2001/XMLSchema-instance");
    }
    if let Some(container) = &container {
        namespaces.extend(container.code.namespaces.iter().map(String::as_str));
    }
    namespaces.remove("");
    if let Some(layout) = layout {
        for attr in &layout.attributes {
            namespaces.insert(&attr.name.namespace);
            if let LinkedXmlAttributeValue::QName(value) = &attr.value {
                namespaces.insert(&value.namespace);
            }
        }
        namespaces.remove("");
    }
    let suffix = if layout.is_some() { "_plain" } else { "" };
    let prepared_type = format!(
        "XmlPrepared{}{id}",
        if layout.is_some() { "Plain" } else { "" }
    );
    let prepare_xml = format!("prepare_xml{suffix}_{id}");
    let namespaces_xml = format!("namespaces_xml{suffix}_{id}");
    let write_xml_into = format!("write_xml_into{suffix}_{id}");
    let required_fields = entry
        .constraints
        .iter()
        .filter(|constraint| constraint.applies_to.contains(&ValidationPhase::XmlImport))
        .filter_map(crate::plan::routes::required_constraint_field)
        .collect::<BTreeSet<_>>();
    writeln!(out, "struct {prepared_type} {{").unwrap();
    for (i, _) in physical_fields(&fields) {
        writeln!(out, "tree{i}: Option<core::xml::Tree>,").unwrap();
    }
    writeln!(out, "}} fn {prepare_xml}(value: &V{id}, _inputs: &InputView<'_>) -> core::Result<{prepared_type}> {{").unwrap();
    for (i, field) in physical_fields(&fields) {
        if field.attribute.is_some() {
            writeln!(out, "if value.raw.get({i}).is_some_and(|patch| patch.attribute_text().is_err()) {{return Err(RuntimeDiagnostic::new(\"xml.attribute-patch\",\"An attribute patch requires text or absence\").field({:?}));}} let tree{i}=None;",field.key).unwrap();
            continue;
        }
        if preserve {
            let physical = field.physical_name();
            writeln!(out, "let tree{i}=if let Some(patch)=value.raw.get({i}) {{ if {null_is_absence} {{None}} else {{",null_is_absence=if required_fields.contains(&i) || !field.optional || super::scalar_presence::absent_form(field.presence) != XmlForm::Missing || field.presence.and_then(|presence|presence.yaml_missing.as_ref()).is_some_and(|value|matches!(value.kind,LinkedExpressionKind::Literal(_))) {"patch.is_null()".to_owned()} else {format!("patch.is_null() && value.f{i}.is_some()") }).unwrap();
            let text = field
                .codec
                .write_reference(&format!("E{id}F{i}"), "field_value", true);
            let tree = format!(
                "core::xml::Tree::scalar(name.clone(),{text},{})",
                attribute_code(field, i)
            );
            let base = if field.codec.write_is_fallible(true)
                || field
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
    writeln!(
        out,
        "Ok({prepared_type} {{ {} }}) }}",
        physical_fields(&fields)
            .map(|(i, _)| format!("tree{i}"))
            .collect::<Vec<_>>()
            .join(",")
    )
    .unwrap();
    writeln!(out, "const XML_NAMESPACES_{id}: &[&str]=&{:?}; fn {namespaces_xml}<'a>(_value: &'a V{id}, prepared: &'a {prepared_type}, namespaces: &mut Vec<&'a str>) {{ for namespace in XML_NAMESPACES_{id} {{if !namespaces.contains(namespace) {{namespaces.push(namespace);}}}}", namespaces.into_iter().collect::<Vec<_>>()).unwrap();
    for (i, _) in physical_fields(&fields) {
        writeln!(
            out,
            "if let Some(tree)=&prepared.tree{i} {{tree.collect_namespaces(namespaces);}}"
        )
        .unwrap();
    }
    for (i, field) in physical_fields(&fields) {
        if let Some(namespace) = field
            .codec
            .qname_namespace_reference(&format!("E{id}F{i}"), "field_value")
        {
            writeln!(out,"if let Some(field_value)=&_value.f{i} && let Some(namespace)={namespace} {{if !namespaces.contains(&namespace) {{namespaces.push(namespace);}}}}").unwrap();
        }
    }
    let finish_xml = first.map_or_else(
        || "out.finish()".to_owned(),
        |first| {
            format!(
                "out.finish_with_root(({:?},{:?}))",
                first.path[0].namespace, first.path[0].local
            )
        },
    );
    writeln!(out, "}} fn {write_xml_name}(value: &V{id}, inputs: &InputView<'_>) -> core::Result<Vec<u8>> {{ let prepared={prepare_xml}(value,inputs)?; let mut namespaces=Vec::new(); if !value.raw.is_empty() {{{namespaces_xml}(value,&prepared,&mut namespaces);}} let mut out=core::xml::Writer::new(if namespaces.is_empty() {{XML_NAMESPACES_{id}}} else {{&namespaces}}); {write_xml_into}(value,&prepared,inputs,&mut out)?; Ok({finish_xml}) }}").unwrap();
    // The field decoder owns storage and lexical representation; parent
    // composition consumes this adapter without reading fN/raw directly.
    for group in headers.chunk_by(|left, right| left.1.path == right.1.path) {
        let first = group[0].0;
        writeln!(out,"fn header_xml_{id}_{first}(value:&V{id},out:&mut core::xml::Writer<'_>,declared:&[core::xml::WriteAttribute<'_>])->core::Result<()> {{with_header_xml_{id}_{first}(value,|fields|{{out.container_with_attributes({},declared.iter().chain(fields.iter().flatten()));Ok(())}})}}\nfn with_header_xml_{id}_{first}(value:&V{id},consume:impl FnOnce(&[Option<core::xml::WriteAttribute<'_>>])->core::Result<()>)->core::Result<()> {{",path_code(group[0].1.path)).unwrap();
        let mut bound = Vec::new();
        for (i, field) in group {
            let attribute = field.attribute.unwrap();
            let lexical = if matches!(field.codec, Codec::Decimal) {
                "std::borrow::Cow::Owned(field_value.to_string())".to_owned()
            } else {
                format!(
                    "std::borrow::Cow::<str>::Borrowed({})",
                    field
                        .codec
                        .write_reference(&format!("E{id}F{i}"), "field_value", true)
                )
            };
            let ordinary = if field.codec.write_is_fallible(true) {
                format!(
                    "if let Some(field_value)=value.f{i}.as_ref() {{{lexical}.into()}} else {{None}}"
                )
            } else {
                format!("value.f{i}.as_ref().map(|field_value|{lexical})")
            };
            writeln!(out,"let text{i}:Option<std::borrow::Cow<'_,str>>=if let Some(patch)=value.raw.get({i}) {{patch.attribute_text()?.map(std::borrow::Cow::Borrowed)}} else {{{ordinary}}};").unwrap();
            bound.push(format!("text{i}.as_deref().map(|text|core::xml::WriteAttribute{{name:({:?},{:?}),value:core::xml::AttributeValue::Text(text)}})",attribute.namespace,attribute.local));
        }
        writeln!(out, "consume(&[{}])}}", bound.join(",")).unwrap();
    }
    writeln!(out, "fn {write_xml_into}<'a>(value: &V{id}, prepared: &'a {prepared_type}, _inputs: &InputView<'_>, out: &mut core::xml::Writer<'a>) -> core::Result<()> {{").unwrap();
    out.push_str("let _=prepared;\n");
    if let Some(first) = first
        && (headers.is_empty() || layout.is_some())
        && first.path.len() > 1
    {
        writeln!(
            out,
            "out.ensure_container({});",
            path_code(&first.path[..1])
        )
        .unwrap();
    }
    if let Some(container) = &container {
        out.push_str(&container.write);
        if !headers
            .iter()
            .any(|(_, field)| field.path == container.path)
        {
            writeln!(
                out,
                "out.container_with_attributes({},attributes.iter());",
                path_code(container.path)
            )
            .unwrap();
        }
    }
    if let Some(layout) = layout {
        out.push_str("if !value.present {return Ok(()); }\n");
        if !headers.iter().any(|(_, field)| field.path == layout.path) {
            writeln!(
                out,
                "out.container_with_attributes({},{});",
                path_code(&layout.path),
                super::nested_record::attributes(layout)
            )
            .unwrap();
        }
    }
    for group in headers.chunk_by(|left, right| left.1.path == right.1.path) {
        let (_, field) = group[0];
        let declared = if container
            .as_ref()
            .is_some_and(|container| field.path == container.path)
        {
            "attributes.as_slice()".into()
        } else {
            layout
                .filter(|layout| field.path == layout.path)
                .map_or_else(|| "&[]".to_owned(), super::nested_record::attributes)
        };
        let first = group[0].0;
        writeln!(out, "{{let declared:&[core::xml::WriteAttribute<'_>]={declared};header_xml_{id}_{first}(value,out,declared)?;}}").unwrap();
    }
    writeln!(out,"write_xml_fields_into_{id}(value,prepared,_inputs,out)}}\nfn write_xml_fields_into_{id}<'a>(value:&V{id},prepared:&'a {prepared_type},_inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{{let _=(&value,&prepared,&out);").unwrap();
    for (i, field) in fields.iter().enumerate() {
        if field.xml.is_none() || field.attribute.is_some() {
            continue;
        }
        writeln!(
            out,
            "write_xml_field_{id}_{i}(value,prepared,_inputs,out)?;"
        )
        .unwrap();
    }
    out.push_str("Ok(()) }\n");
    for (i, field) in fields.iter().enumerate() {
        if field.xml.is_none() || field.attribute.is_some() {
            continue;
        }
        writeln!(out,"fn write_xml_field_{id}_{i}<'a>(value:&V{id},prepared:&'a {prepared_type},_inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()> {{").unwrap();
        if field.presence.is_some_and(|presence| {
            presence.canonical.first().is_some_and(|canonical| {
                canonical.form == XmlForm::Missing && canonical.when.is_some()
            })
        }) {
            writeln!(
                out,
                "if {}xml_omit_{id}_{i}(value,_inputs)? {{return Ok(());}}",
                if preserve {
                    format!("value.raw.get({i}).is_none() && ")
                } else {
                    String::new()
                }
            )
            .unwrap();
        }
        if let Some(qname) = field
            .codec
            .qname_owned_reference(&format!("E{id}F{i}"), "field_value")
        {
            let guarded = field.optional || preserve;
            if guarded {
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
            } else {
                writeln!(out, "let field_value=&value.f{i};").unwrap();
            }
            writeln!(out,"let qname:(&str,std::borrow::Cow<'_,str>)={qname};out.qname_field({},(qname.0,qname.1.as_ref()))?;",path_code(field.path)).unwrap();
            if guarded {
                out.push_str("}\n");
            }
            if preserve {
                writeln!(
                    out,
                    "if let Some(tree)=&prepared.tree{i} {{tree.write_at(out,{},Q{id})?;}}",
                    path_code(&field.path[..field.path.len() - 1])
                )
                .unwrap();
            }
            out.push_str("Ok(()) }\n");
            continue;
        }
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
                "if let Some(tree)=&prepared.tree{i} {{tree.write_at(out,{},Q{id})?;}}",
                path_code(&field.path[..field.path.len() - 1])
            )
            .unwrap();
        }
        out.push_str("Ok(()) }\n");
    }
    let projected = matches!(entry.yaml, YamlRepresentation::Projection(_));
    writeln!(
        out,
        "fn {write_yaml_name}(value: &V{id}, inputs: &InputView<'_>) -> core::Result<Vec<u8>> {{let mut out=String::new();write_yaml_into_{id}(value,inputs,&mut out)?;Ok(out.into_bytes())}}\nfn write_yaml_into_{id}(value: &V{id}, inputs: &InputView<'_>, out: &mut String) -> core::Result<()> {{if value.raw.is_empty() {{{plain_write}}} else {{core::yaml::append_encoded_properties(out,&write_yaml_preserved_{id}(value,inputs)?)}} }}\nfn write_yaml_fields_{id}(value: &V{id}, inputs: &InputView<'_>, out: &mut String) -> core::Result<()> {{write_yaml_indented_{id}(value,inputs,out,\"\",false)}}\nfn write_yaml_indented_{id}(value: &V{id}, inputs: &InputView<'_>, out: &mut String, indent:&str, lift_attributes:bool) -> core::Result<()> {{write_yaml_except_{id}(value,inputs,out,indent,lift_attributes,None)}}\nfn write_yaml_except_{id}(value: &V{id}, _inputs: &InputView<'_>, out: &mut String, indent:&str, lift_attributes:bool, excluded:Option<usize>) -> core::Result<()> {{ let _=(value,indent,excluded,lift_attributes);let start=out.len();",
        plain_write = if projected {
            format!("write_yaml_fields_{id}(value,inputs,out)")
        } else {
            format!("core::yaml::append_properties(out,|out|write_yaml_fields_{id}(value,inputs,out))")
        }
    )
    .unwrap();
    if let Some(layout) = layout {
        writeln!(out,"if !value.present {{return Ok(());}}out.push_str(indent);out.push_str(&core::yaml::scalar({:?}));out.push_str(\":\\n\");",layout.key).unwrap();
    }
    if matches!(entry.yaml, YamlRepresentation::TextPattern(_)) {
        out.push_str(&text::write(entry, &fields));
        writeln!(out, "if let Some(label)=value.raw.label({}) {{out.insert_str(start+indent.len(), &format!(\"{{label}} \"));}}", fields.len()).unwrap();
    }
    let mut yaml_fields: Vec<_> = fields
        .iter()
        .enumerate()
        .filter(|(_, field)| field.yaml_visible)
        .collect();
    if let YamlRepresentation::Mapping(mapping) = &entry.yaml {
        yaml_fields.sort_by_key(|(_, field)| mapping.iter().position(|item| item.key == field.key));
    }
    for (i, field) in yaml_fields {
        write!(out, "if excluded != Some({i})").unwrap();
        let text = if field.optional || preserve {
            write!(out, " && let Some(field_value) = &value.f{i}").unwrap();
            if field
                .presence
                .is_some_and(|presence| presence.yaml_omit_when.is_some())
            {
                let lift_guard = if field.attribute.is_some() {
                    "!lift_attributes && "
                } else {
                    ""
                };
                write!(
                    out,
                    " && (!omit_{id}_{i}(value,_inputs)? || ({lift_guard}value.raw.get({i}).is_some() && {}))",
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
            out.push_str(" {\n");
            field.codec.write(&format!("E{id}F{i}"), i, false)
        };
        let yaml = if field.codec.plain_yaml() {
            text
        } else {
            format!("&core::yaml::scalar({text})")
        };
        if field.yaml_projected {
            writeln!(out, "out.push_str(indent); core::yaml::append_marked_scalar(out,{yaml},value.raw.label({i}).as_deref(),indent,false); out.push('\\n');").unwrap();
        } else {
            out.push_str("out.push_str(indent);");
            if layout.is_some() {
                out.push_str("out.push_str(\"  \");");
            }
            writeln!(out, "out.push_str(&core::yaml::scalar({:?})); out.push_str(\": \"); core::yaml::append_marked_scalar(out,{yaml},value.raw.label({i}).as_deref(),indent,{nested}); out.push('\\n');", field.key,nested=layout.is_some()).unwrap();
        }
        out.push_str("}\n");
    }
    if layout.is_some() {
        out.push_str("if out.ends_with(\":\\n\") {out.push_str(\"  {}\\n\");}\n");
    }
    out.push_str("if out.len()>start { out.pop(); } Ok(()) }\n");
    writeln!(out,"fn write_yaml_preserved_{id}(value: &V{id}, inputs: &InputView<'_>) -> core::Result<Vec<u8>> {{write_yaml_preserved_fields_{id}(value,inputs,false)}}\nfn write_yaml_preserved_fields_{id}(value:&V{id},inputs:&InputView<'_>,lift_attributes:bool)->core::Result<Vec<u8>> {{write_yaml_preserved_except_{id}(value,inputs,lift_attributes,None)}}\nfn write_yaml_preserved_except_{id}(value:&V{id},inputs:&InputView<'_>,lift_attributes:bool,excluded:Option<usize>)->core::Result<Vec<u8>> {{let mut out=String::new();write_yaml_except_{id}(value,inputs,&mut out,\"\",lift_attributes,excluded)?;let bytes=out.into_bytes();").unwrap();
    if preserve {
        out.push_str("let mut bytes=bytes;\n");
        for (i, field) in physical_fields(&fields) {
            let guard = if field.attribute.is_none() {
                String::new()
            } else if field.optional {
                " && !lift_attributes".to_owned()
            } else {
                format!(" && (!lift_attributes || value.f{i}.is_none())")
            };
            if projected {
                writeln!(out,"if excluded!=Some({i}) && let Some(patch)=value.raw.get({i}){guard} {{let payload=patch.to_yaml();bytes=core::raw::Document::encode(&bytes,payload.as_bytes())?;}}").unwrap();
            } else {
                writeln!(out,"if excluded!=Some({i}) && let Some(patch)=value.raw.get({i}){guard} {{let payload=patch.to_yaml();bytes=core::raw::Property::encode_in({parent},{key:?},{physical:?},&bytes,payload.as_bytes())?;}}",key=field.key,physical=field.physical_name().local).unwrap();
            }
        }
    }
    out.push_str("Ok(bytes) }\n");
    let scalar = fields
        .iter()
        .enumerate()
        .filter(|(_, field)| field.xml.is_some() && field.attribute.is_none())
        .map(|(i, field)| {
            format!(
                "value.f{i}.is_some() && core::xml::matches(path,{})",
                path_code(field.path)
            )
        })
        .collect::<Vec<_>>()
        .join(" || ");
    let qname_text = fields
        .iter()
        .filter(|field| {
            field.xml.is_some()
                && field.attribute.is_none()
                && matches!(
                    field.codec,
                    Codec::QNameText(_) | Codec::QNameEnumeration(..)
                )
        })
        .map(|field| format!("core::xml::matches(path,{})", path_code(field.path)))
        .collect::<Vec<_>>()
        .join(" || ");
    out.push_str(&super::proof::qnames(id, &format!("Q{id}.to_vec()")));
    out.push_str(&super::proof::generate(
        id,
        if scalar.is_empty() { "false" } else { &scalar },
        &format!("(name.namespace==\"http://www.w3.org/2001/XMLSchema-instance\" && name.local==\"type\") || ({})", container.as_ref().map_or_else(|| "false".to_owned(), |container| container.code.qnames.replace("_path", "path").replace("_name", "name"))),
        if qname_text.is_empty() {
            "false"
        } else {
            &qname_text
        },
    ));
    writeln!(out, "fn verify_{id}(original: &[u8], candidate: &[u8], inputs: &InputView<'_>) -> core::Result<()> {{ let value = read_yaml_{id}(candidate, inputs)?; if let Some(error) = check_yaml_{id}(&value, candidate, inputs).into_iter().find(|error| error.severity == core::Severity::Error) {{ return Err(error); }} prove_xml_{id}(&value,original,&write_xml_{id}(&value,inputs)?) }}").unwrap();
    let required_missing = required_fields
        .iter()
        .map(|field| format!("_value.f{field}.is_none()"))
        .collect::<Vec<_>>()
        .join(" || ");
    let required_missing = if required_missing.is_empty() {
        "false".to_owned()
    } else {
        required_missing
    };
    if preserve
        && fields
            .iter()
            .any(|field| field.attribute.is_none() || !field.yaml_visible)
    {
        writeln!(out,"fn {finalize_name}(original:&[u8],candidate:Vec<u8>,_value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{ if !({required_missing}) {{match verify_{id}(original,&candidate,inputs) {{Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some(\"xml.round-trip-mismatch\")=>{{}},Err(error)=>return Err(error)}}}} let ordinary=write_xml_{id}(&read_yaml_{id}(&candidate,inputs)?,inputs)?; let mut candidate=candidate;").unwrap();
        for (i, field) in physical_fields(&fields) {
            if let Some(attribute) = field.attribute {
                if !field.yaml_visible {
                    writeln!(out,"{{let expected=core::xml::attribute_value(original,{path},({ns:?},{name:?}))?;let restored=core::xml::attribute_value(&ordinary,{path},({ns:?},{name:?}))?;if expected!=restored {{let payload=expected.as_deref().map(core::yaml::scalar).unwrap_or_else(||\"null\".into());candidate=core::raw::Property::encode_in({parent},{key:?},{physical:?},&candidate,payload.as_bytes())?;}}}}",path=path_code(field.path),ns=attribute.namespace,name=attribute.local,key=field.key,physical=field.physical_name().local).unwrap();
                }
                continue;
            }
            let mut restore_meaning = String::new();
            if field.yaml_visible
                && field
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
            if projected {
                writeln!(out,"if let Some(tree)=core::xml::Tree::capture(original,{path})? {{let base=core::xml::Tree::capture(&ordinary,{path})?;let patch=tree.patch_yaml(base.as_ref(),&[],Q{id})?;if patch!=\"{{}}\" {{{restore_meaning}candidate=core::raw::Document::encode(&candidate,if patch.is_empty() {{b\"\\\"\\\"\"}} else {{patch.as_bytes()}})?;}}}} else if core::xml::Tree::capture(&ordinary,{path})?.is_some() || {required} {{candidate=core::raw::Document::encode(&candidate,b\"null\")?;}}",path=path_code(field.path),required=required_fields.contains(&i)).unwrap();
            } else {
                writeln!(out,"if let Some(tree)=core::xml::Tree::capture(original,{path})? {{let base=core::xml::Tree::capture(&ordinary,{path})?;let patch=tree.patch_yaml(base.as_ref(),&[],Q{id})?;if patch!=\"{{}}\" {{{restore_meaning}candidate=core::raw::Property::encode_in({parent},{key:?},{physical:?},&candidate,if patch.is_empty() {{b\"\\\"\\\"\"}} else {{patch.as_bytes()}})?;}}}} else if core::xml::Tree::capture(&ordinary,{path})?.is_some() || {required} {{candidate=core::raw::Property::encode_in({parent},{key:?},{physical:?},&candidate,b\"null\")?;}}",path=path_code(field.path),key=field.key,physical=field.physical_name().local,required=required_fields.contains(&i)).unwrap();
            }
        }
        writeln!(
            out,
            "verify_{id}(original,&candidate,inputs)?;Ok(candidate) }}"
        )
        .unwrap();
    } else {
        writeln!(out, "fn {finalize_name}(original: &[u8], candidate: Vec<u8>, _value: &V{id}, inputs: &InputView<'_>) -> core::Result<Vec<u8>> {{ verify_{id}(original, &candidate, inputs)?; Ok(candidate) }}").unwrap();
    }
    writeln!(out,"#[allow(dead_code)] fn text_field_{id}(value:&V{id},field:usize)->core::Result<&str>{{let _=(value,field);").unwrap();
    let has_text = fields.iter().any(|field| {
        matches!(
            field.codec,
            Codec::Text
                | Codec::QNameText(_)
                | Codec::Enumeration(..)
                | Codec::QNameEnumeration(..)
                | Codec::States(..)
        )
    });
    if has_text {
        out.push_str("match field{");
    }
    for (index, field) in fields.iter().enumerate() {
        if matches!(
            field.codec,
            Codec::Text
                | Codec::QNameText(_)
                | Codec::Enumeration(..)
                | Codec::QNameEnumeration(..)
                | Codec::States(..)
        ) {
            let reference = format!(
                "value.f{index}.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"fact.unready\",\"Text field is unavailable\"))?"
            );
            let value = field
                .codec
                .meaning_reference(&format!("E{id}F{index}"), &reference);
            writeln!(out, "{index}=>Ok({value}),").unwrap();
        }
    }
    if has_text {
        out.push_str("_=>");
    }
    out.push_str("Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Expected a text field\"))}");
    if has_text {
        out.push('}');
    }
    out.push('\n');
    let mut input_arms = String::new();
    for (index, field) in fields.iter().enumerate() {
        let variant = match &field.codec {
            Codec::Text
            | Codec::TextTable(_)
            | Codec::QNameText(_)
            | Codec::Enumeration(..)
            | Codec::QNameEnumeration(..)
            | Codec::States(..) => "Text",
            Codec::Boolean(..) => "Boolean",
            Codec::Decimal | Codec::FormattedDecimal(_) => "Decimal",
            _ => continue,
        };
        let meaning = field
            .codec
            .meaning_reference(&format!("E{id}F{index}"), "stored");
        let mapper = if meaning == "stored" {
            format!("core::inputs::InputRef::{variant}")
        } else {
            format!("|stored|core::inputs::InputRef::{variant}({meaning})")
        };
        writeln!(
            input_arms,
            "{index}=>value.f{index}.as_ref().map({mapper}),"
        )
        .unwrap();
    }
    let input_body = if input_arms.is_empty() {
        "None".into()
    } else {
        format!("match field{{{input_arms}_=>None}}")
    };
    writeln!(out,"#[allow(dead_code)] fn input_field_{id}(value:&V{id},field:usize)->Option<core::inputs::InputRef<'_>> {{let _=(value,field);{input_body}}}").unwrap();
    if text_record {
        out.push_str(&text::envelope(entry, &fields, keep_positions, boundary));
    }
    Ok(if let Some(layout) = layout {
        super::nested_record::wrap(out, layout)
    } else {
        out
    })
}
