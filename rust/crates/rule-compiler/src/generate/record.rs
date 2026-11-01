mod container;
pub(super) mod shorthand;
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
    semantic_name: ExpandedName,
    semantic_projection: bool,
}
impl Field<'_> {
    fn physical_name(&self) -> &ExpandedName {
        self.attribute
            .unwrap_or_else(|| self.path.last().unwrap_or(&self.semantic_name))
    }
}
fn yaml_preservation_fields<'a, 'b>(
    fields: &'a [Field<'b>],
) -> impl Iterator<Item = (usize, &'a Field<'b>)> {
    fields.iter().enumerate().filter(|(_, field)| {
        field.xml.is_some() || (field.yaml_visible && field.semantic_projection)
    })
}

fn canonical_attribute(field: &Field<'_>) -> bool {
    field.attribute.is_some()
        && field
            .presence
            .is_some_and(|rule| !rule.canonical.is_empty())
}

fn tracks_null(field: &Field<'_>) -> bool {
    super::scalar_presence::yaml_empty(field.presence, EmptyKind::Null)
}
fn paired_null(field: &Field<'_>) -> bool {
    field.xml.is_some()
        && field.attribute.is_none()
        && super::scalar_presence::empty(field.presence, EmptyKind::Nil)
        && tracks_null(field)
}
// Shared emission condition: the writer and emptiness proof must agree.
fn yaml_field_guard(id: u32, index: usize, field: &Field<'_>, preserve: bool) -> String {
    let mut guard = format!("excluded != Some({index})");
    if field.optional || preserve {
        write!(guard, " && let Some(field_value) = &value.f{index}").unwrap();
        if field
            .presence
            .is_some_and(|presence| presence.yaml_null_when.is_some())
        {
            write!(guard, " && !null_form_{index}").unwrap();
        }
        if field
            .presence
            .is_some_and(|presence| presence.yaml_omit_when.is_some())
        {
            let lift = if field.attribute.is_some() {
                "!lift_attributes && "
            } else {
                ""
            };
            write!(guard, " && (!omit_{id}_{index}(value,_inputs)? || ({lift}value.raw.get({index}).is_some() && {}))",
                field.codec.yaml_representable(&format!("E{id}F{index}"), "field_value")).unwrap();
        }
    }
    guard
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
    super::paths::code(path)
}

fn preserved_cell(
    expression: Option<&LinkedExpression>,
    codec: &Codec<'_>,
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Option<(String, Option<usize>)>, Diagnostic> {
    let Some(expression) = expression else {
        return Ok(None);
    };
    if let Some((constants, cell)) = expressions::semantic_cell(entry, program, expression)? {
        let cell = format!("({cell}).and_then(core::inputs::InputRef::preserved_xml).cloned()");
        return Ok(Some((
            if constants.is_empty() {
                cell
            } else {
                format!("{{{constants}{cell}}}")
            },
            None,
        )));
    }
    if matches!(codec, Codec::Forms(choice) if choice.constructible())
        && let Some(source) =
            super::scalar_presence::choice_projection_source(expression, entry, program)
    {
        return Ok(Some((format!("raw.get({source}).cloned()"), Some(source))));
    }
    Ok(None)
}

fn preserved_missing(
    expression: Option<&LinkedExpression>,
    codec: &Codec<'_>,
    missing: String,
    index: usize,
    entry: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    Ok(match preserved_cell(expression, codec, entry, program)? {
        Some((cell, Some(source))) => format!(
            "{{let opaque=if let Some(patch)={cell}{{raw.insert({index},patch);f{source}.is_none()}}else{{false}};if opaque{{None}}else{{{missing}}}}}"
        ),
        Some((cell, None)) => {
            let (_, meaning) = expressions::semantic_cell(
                entry,
                program,
                expression.expect("preserved expression"),
            )?
            .expect("borrowed preservation");
            format!(
                "if let Some(patch)={cell}{{raw.insert({index},patch);if matches!({meaning},Some(core::inputs::InputRef::PreservedXml(_))){{None}}else{{{missing}}}}}else{{{missing}}}"
            )
        }
        None => missing,
    })
}

pub(super) fn generate(entry: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
    generate_profiled(entry, program).map(|(source, _)| source)
}

pub(super) fn generate_profiled(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<(String, &'static str), Diagnostic> {
    if let Some(code) = super::record_reference::generate(entry, program)? {
        return Ok((code, "record-reference"));
    }
    if let Some(code) = super::declared_items::generate(entry, program)? {
        return Ok((code, "declared-items"));
    }
    if super::owner::applies(entry, program) {
        return super::owner::generate(entry, program).map(|code| (code, "owner"));
    }
    if let Some(source) = super::qname::generate(entry, program)? {
        return Ok((source, "qname"));
    }
    if let Some(layout) = super::nested_record::lower(entry, program)? {
        return generate_at(&layout.entry, program, Some(&layout), false, None)
            .map(|code| (code, "nested-record"));
    }
    if let Some(source) = super::composite::generate(entry, program)? {
        return Ok((source, "composite"));
    }
    if let Some(source) = super::collections::generate(entry, program)? {
        return Ok((source, "collection"));
    }
    generate_at(entry, program, None, false, None).map(|code| (code, "scalar-record"))
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
    shape.shorthands.clear();
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
                    | Codec::TextTable(_)
                    | Codec::QNameText(_)
                    | Codec::QNameEnumeration(..)
                    | Codec::Boolean(..)
                    | Codec::Decimal
                    | Codec::Enumeration(..)
                    | Codec::States(..)
                    | Codec::Pattern(_)
                    | Codec::Forms(_)
            ) || presence.is_some_and(|rule| {
                !rule.xml_empty.is_empty()
                    || rule.canonical.iter().any(|form| {
                        form.xml_type.is_some()
                            || !matches!(form.form, XmlForm::Missing | XmlForm::Ordinary)
                    })
            }) || !attributes.is_empty())
        {
            return Err(unsupported(
                entry,
                "Attribute fields require a scalar codec and missing-value presence without element-only forms or attached attributes",
            ));
        }
        let semantic_projection = mapping.is_none()
            && preserved_cell(
                presence.and_then(|rule| rule.xml_missing.as_ref()),
                &codec,
                entry,
                program,
            )?
            .is_some();
        fields.push(Field {
            xml: mapping,
            path: mapping.map_or(&[], |mapping| mapping.path.as_slice()),
            attribute: mapping.and_then(|mapping| mapping.attribute.as_ref()),
            key: planned.diagnostic_key(),
            semantic_projection,
            semantic_name: ExpandedName {namespace:String::new(),local:planned.diagnostic_key().into()},
            yaml_visible: planned.yaml.is_some_and(|mapping| mapping.file.is_none())
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
    let LinkedXml::Record(xml_fields) = super::attributes::content(&entry.xml).0 else {
        unreachable!("record writer has record XML")
    };
    headers.sort_by_key(|(_, field)| {
        let position = xml_fields
            .iter()
            .position(|mapping| field.xml.is_some_and(|own| mapping.field == own.field))
            .unwrap_or(usize::MAX);
        (field.path.len(), position)
    });
    let sibling_headers = headers.windows(2).any(|pair| {
        !pair[1].1.path.starts_with(pair[0].1.path) && !pair[0].1.path.starts_with(pair[1].1.path)
    });
    if layout.is_some() && fields.iter().all(|field| field.attribute.is_some()) {
        return Err(unsupported(
            entry,
            "Nested records currently require an element field",
        ));
    }
    if !sibling_headers
        && (headers
            .windows(2)
            .any(|pair| !pair[1].1.path.starts_with(pair[0].1.path))
            || headers.last().is_some_and(|(_, header)| {
                let inline_fields = fields
                    .iter()
                    .filter(|field| {
                        field.xml.is_some()
                            && field.attribute.is_none()
                            && field.path == header.path
                    })
                    .count();
                if inline_fields > 1 {
                    return true;
                }
                fields
                    .iter()
                    .filter(|field| field.xml.is_some() && field.attribute.is_none())
                    .any(|field| {
                        !field.path.starts_with(header.path)
                            || (field.path.len() == header.path.len()
                                && (!field.attributes.is_empty()
                                    || !matches!(
                                        field.codec,
                                        Codec::Text
                                            | Codec::TextTable(_)
                                            | Codec::Boolean(..)
                                            | Codec::Decimal
                                            | Codec::Enumeration(..)
                                            | Codec::States(..)
                                    )))
                    })
            }))
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
    let shorthand = shorthand::prepare(entry, &fields, program)?;
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
    // Only placed object records own a document delta. The reserved raw slot
    // allocates nothing on the ordinary path and cannot collide with field slots.
    let owner_patch = entry.kind == ModuleKind::Object
        && !matches!(
            entry.yaml,
            YamlRepresentation::Projection(_) | YamlRepresentation::TextPattern(_)
        )
        && first.is_some();
    let owner_decode = if owner_patch {
        format!(
            "if let Some(envelope)=core::raw::Document::decode(source)? {{let mut value={read_yaml_name}(&envelope.meaning,inputs)?;value.raw.insert(usize::MAX,core::xml::Patch::read(&envelope.payload,&[],Q{id})?);return Ok(value);}}"
        )
    } else {
        String::new()
    };

    let has_preservation_fields = yaml_preservation_fields(&fields).next().is_some();
    let has_physical_fields = physical_fields(&fields).next().is_some();
    let has_xml_preservation =
        has_physical_fields || fields.iter().any(|field| field.semantic_projection);
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
                    (
                        ValidationPhase::YamlValidation,
                        constraints::yaml_form(entry),
                    ),
                ]
                .iter()
                .any(|(phase, form)| {
                    constraint.applies_to.contains(phase)
                        && (constraint.forms.is_empty() || constraint.forms.contains(form))
                })
        });
    let mut out = String::new();
    if let Some(shorthand) = &shorthand {
        out.push_str(&shorthand.definitions);
    }
    if preserve {
        let mut qnames = vec![("http://www.w3.org/2001/XMLSchema-instance", "type")];
        if let Some(container) = &container {
            qnames.extend(&container.qnames);
        }
        qnames.extend(fields.iter().filter_map(|field| {
            field
                .codec
                .is_qname()
                .then_some(field.attribute)
                .flatten()
                .map(|name| (name.namespace.as_str(), name.local.as_str()))
        }));
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
            .and_then(|presence| presence.yaml_null_when.as_ref())
        {
            out.push_str(&super::scalar_presence::predicate(
                expression,
                i,
                entry,
                program,
                &format!("null_{id}_{i}"),
            )?);
        }
        if let Some(expression) = field
            .presence
            .and_then(|presence| presence.yaml_omit_when.as_ref())
        {
            out.push_str(&super::scalar_presence::omit(
                expression, i, entry, program,
            )?);
        }
        if let Some(presence) = field.presence
            && !presence.canonical.is_empty()
        {
            out.push_str(&super::scalar_presence::canonical(
                presence, i, entry, program,
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
        if tracks_null(field) {
            writeln!(out, "null{i}: bool,").unwrap();
        }
        if canonical_attribute(field) {
            writeln!(out, "attribute_present{i}: bool,").unwrap();
        }
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
        .all(|field| super::scalar_construction::supported(&field.codec))
    {
        writeln!(out,"#[allow(dead_code)] fn construct_{id}(slots:&[Option<core::inputs::InputRef<'_>>],inputs:&InputView<'_>)->core::Result<V{id}>{{let _source_inputs=inputs;{}", super::scalar_construction::bind_record_slots(fields.len())).unwrap();
        for (index, field) in fields.iter().enumerate() {
            let value = super::scalar_construction::value(
                &field.codec,
                &format!("E{id}F{index}"),
                "inputs",
                index,
                "_source_inputs",
            );
            writeln!(
                out,
                "let f{index}=if inputs.is_present({index})?{{Some({value})}}else{{None}};"
            )
            .unwrap();
        }
        if preserve {
            writeln!(out,"let mut raw=core::raw::Fields::default();for index in 0..{}{{if let Some(patch)=inputs.slot(index).and_then(core::inputs::InputRef::preserved_xml){{raw.insert(index,patch.clone());}}}}",fields.len()).unwrap();
        }
        write!(out, "Ok(V{id}{{").unwrap();
        for (index, field) in fields.iter().enumerate() {
            write!(out, "f{index},").unwrap();
            if canonical_attribute(field) {
                write!(out, "attribute_present{index}:false,").unwrap();
            }
            if tracks_null(field) {
                write!(out, "null{index}:inputs.is_null({index})?,").unwrap();
            }
        }
        if preserve {
            out.push_str("raw,");
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
    let mut yaml_preserves_missing = false;
    for field in &fields {
        yaml_preserves_missing |= preserved_cell(
            field.presence.and_then(|rule| rule.yaml_missing.as_ref()),
            &field.codec,
            entry,
            program,
        )?
        .is_some();
    }
    let yaml_bindings = yaml_read::bindings(id, &fields, yaml_preserves_missing);
    out.push_str(&super::external_text::record_writer(entry, program)?);
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
        out.push_str(&yaml_read::projection_reader(
            id,
            index,
            &fields[index],
            &entry.name,
        ));
        yaml_read::projection_read(id)
    } else if let Some(shorthand) = &shorthand {
        shorthand.read_events.clone()
    } else {
        yaml_events
    };
    let fact_projection = super::facts::scalar_xml_projection(entry, program);
    let fact_argument = if fact_projection { ",fact" } else { "" };
    let fact_parameter = if fact_projection { ",fact:bool" } else { "" };
    let yaml_reader = if fact_projection {
        format!("read_yaml_mode_{id}")
    } else {
        read_yaml_name.clone()
    };
    if fact_projection {
        writeln!(out,"fn {read_yaml_name}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{read_yaml_mode_{id}(source,inputs,false)}}\nfn read_yaml_fact_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{read_yaml_mode_{id}(source,inputs,true)}}").unwrap();
    }
    for xml_side in [true, false] {
        let side = if xml_side { "xml" } else { "yaml" };
        if preserve && !xml_side {
            if has_preservation_fields {
                writeln!(out,"fn {yaml_reader}(source:&[u8],inputs:&InputView<'_>{fact_parameter})->core::Result<V{id}> {{ match read_yaml_body_{id}(source,inputs,core::raw::Fields::default(){fact_argument}) {{Ok(value)=>Ok(value),Err(error)=>{{{owner_decode}let mut raw=core::raw::Fields::default();let mut decoded=source.to_vec();let mut found=false;").unwrap();
                for (i, field) in yaml_preservation_fields(&fields) {
                    if matches!(entry.yaml, YamlRepresentation::Projection(_)) {
                        writeln!(out,"if let Some(envelope)=core::raw::Document::decode(&decoded)? {{found=true;raw.insert({i},core::xml::Patch::read(&envelope.payload,&[],Q{id})?);if envelope.meaning_is_empty()?{{return finish_yaml_{id}(YamlFields{id}::new(raw)?,source,inputs);}}decoded=envelope.meaning;}}").unwrap();
                    } else {
                        writeln!(out,"if let Some(envelope)=core::raw::Property::decode_in(&decoded,{parent},{:?},{:?})? {{found=true;raw.insert({i},core::xml::Patch::read(&envelope.payload,&[],Q{id})?);decoded=if raw.get({i}).is_some_and(core::xml::Patch::is_replacement){{envelope.without_empty_scalar({parent},{:?})?}}else{{envelope.meaning}};}}",field.key,field.physical_name().local,field.key).unwrap();
                    }
                }
                writeln!(
                out,
                "if !found {{return Err(error);}}read_yaml_body_{id}(&decoded,inputs,raw{fact_argument})}}}} }}"
            )
            .unwrap();
            } else {
                writeln!(out,"fn {yaml_reader}(source:&[u8],inputs:&InputView<'_>{fact_parameter})->core::Result<V{id}> {{read_yaml_body_{id}(source,inputs,core::raw::Fields::default(){fact_argument}).or_else(|error|{{{owner_decode}Err(error)}})}} ").unwrap();
            }
            let projected = if fact_projection {
                let keys = fields
                    .iter()
                    .filter(|field| field.yaml_visible)
                    .map(|field| format!("{:?}", field.key))
                    .collect::<Vec<_>>()
                    .join("|");
                let select_key = if keys.is_empty() { "_key" } else { "key" };
                let selected = if keys.is_empty() {
                    "false".to_owned()
                } else {
                    format!("matches!(key,{keys})")
                };
                format!(
                    "if fact {{return read_yaml_events_{id}(source,inputs,raw,core::yaml::PartitionSource{{source:core::yaml::DocumentSource(if source.is_empty() {{b\"{{}}\"}} else {{source}}),select:|{select_key}:&str|{selected},sibling:|_,_|Ok(())}});}}"
                )
            } else {
                String::new()
            };
            writeln!(out,"fn read_yaml_body_{id}(source:&[u8],inputs:&InputView<'_>,raw:core::raw::Fields{fact_parameter})->core::Result<V{id}> {{{projected}read_yaml_events_{id}(source,inputs,raw,core::yaml::DocumentSource(if source.is_empty() {{b\"{{}}\"}} else {{source}}))}}\nfn read_yaml_events_{id}(source:&[u8],_inputs:&InputView<'_>,raw:core::raw::Fields,events:impl core::yaml::Source)->core::Result<V{id}> {{let mut state=YamlFields{id}::new(raw)?;{yaml_events}}}\nfn finish_yaml_{id}(state:YamlFields{id},{yaml_present}source:&[u8],_inputs:&InputView<'_>)->core::Result<V{id}> {{let _=source;{yaml_bindings}").unwrap();
        } else {
            if xml_side {
                let scoped = physical_fields(&fields).any(|(_, field)| field.codec.is_qname());
                let source_trait = if scoped { "ScopedSource" } else { "Source" };
                let consume = if scoped {
                    "events.visit_scoped(|path,token,scope|state.consume_scoped(path,token,Some(scope)))?"
                } else {
                    "events.visit(|path,token|state.consume(path,token))?"
                };
                writeln!(out, "fn {read_xml_name}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{read_xml_events_{id}(source,inputs,core::xml::DocumentSource(source))}}\nfn read_xml_events_{id}(source:&[u8],_inputs:&InputView<'_>,events:impl core::xml::{source_trait})->core::Result<V{id}> {{let mut state=XmlRead{id}::new();{consume};finish_xml_{id}(state,source,_inputs)}}").unwrap();
                // Constant representation attributes carry XML shape, not facts.
                // The conversion reader remains strict so preservation can capture them.
                if super::facts::scalar_xml_projection(entry, program) {
                    let visit = if scoped {
                        "core::xml::visit_scoped(source,|path,token,scope|match state.consume_scoped(path,&token,Some(scope))"
                    } else {
                        "core::xml::visit(source,|path,token|match state.consume(path,&token)"
                    };
                    writeln!(out, "fn read_xml_fact_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{let mut state=XmlRead{id}::new();{visit}{{Err(error) if matches!(error.code.as_deref(),Some(\"xml.unknown-field\"|\"xml.unknown-attribute\"|\"xml.unexpected-text\"|\"xml.attribute-value\"))=>Ok(()),other=>other}})?;finish_xml_{id}(state,source,inputs)}}").unwrap();
                }
                writeln!(out,"fn finish_xml_{id}(state:XmlRead{id},source:&[u8],_inputs:&InputView<'_>)->core::Result<V{id}> {{let _=source;{xml_bindings}").unwrap();
            } else {
                writeln!(out, "fn read_{side}_{id}(source:&[u8],_inputs:&InputView<'_>)->core::Result<V{id}> {{").unwrap();
            }
            if preserve {
                out.push_str(if has_xml_preservation {
                    "let mut raw=core::raw::Fields::default();\n"
                } else {
                    "let raw=core::raw::Fields::default();\n"
                });
            }
        }
        for &i in record.schedule(if xml_side {
            crate::plan::RepresentationSide::Xml
        } else {
            crate::plan::RepresentationSide::Yaml
        }) {
            let field = &fields[i];
            if !xml_side
                && let Some(file) = entry
                    .yaml_files
                    .iter()
                    .find(|file| file.field as usize == i)
            {
                let path = super::resources::path(&file.path, entry)?;
                let reader = if field.xml.is_some() {
                    "document_xml_text_at"
                } else {
                    "document_text_at"
                };
                writeln!(out,"let _=r{i};let r{i}={{let inputs=_inputs;let (limits,_)=inputs.document_limits();inputs.{reader}(&{path})?.map(str::to_owned)}};").unwrap();
            }
            if canonical_attribute(field) {
                writeln!(
                    out,
                    "let attribute_present{i}={};",
                    if xml_side {
                        format!("r{i}.is_some()")
                    } else {
                        "false".to_owned()
                    }
                )
                .unwrap();
            }
            if xml_side && tracks_null(field) {
                if !paired_null(field) {
                    writeln!(out, "let null{i}=false;").unwrap();
                } else {
                    writeln!(
                        out,
                        "let null{i}=nil{i} && !nested{i} && r{i}.as_deref()==Some(\"\");"
                    )
                    .unwrap();
                }
            }
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
                let missing = preserved_missing(
                    field.presence.and_then(|rule| rule.xml_missing.as_ref()),
                    &field.codec,
                    missing,
                    i,
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
                if (!field.optional || missing_restores_value)
                    && field.presence.is_none_or(|rule| rule.canonical.is_empty())
                {
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
                let original = if matches!(field.codec, Codec::Decimal | Codec::TextTable(_)) {
                    format!("r{i}.clone()")
                } else {
                    format!("r{i}.as_str()")
                };
                let original_ref = if matches!(field.codec, Codec::Decimal | Codec::TextTable(_)) {
                    "&original"
                } else {
                    "original"
                };
                writeln!(out,"let f{i}=if let Some(r{i})=r{i} {{let original={original};let decoded=(||->core::Result<{}>{{",field.codec.rust_type(&format!("E{id}F{i}"))).unwrap();
                out.push_str(&field.codec.read(&format!("E{id}F{i}"), i, field.key, true));
                let qname = field
                    .codec
                    .qname_owned_reference(&format!("E{id}F{i}"), "field_value");
                let canonical = if let Some(qname) = &qname {
                    format!("&{{let (uri,local)={qname};format!(\"{{uri}}\\0{{local}}\")}}")
                } else {
                    field
                        .codec
                        .write_reference(&format!("E{id}F{i}"), "field_value", true)
                };
                let preserved = if qname.is_some() {
                    r#"&{match original.split_once('\0'){Some((uri,local))=>format!("{{{uri}}}{local}"),None=>original.to_owned()}}"#.to_owned()
                } else {
                    original_ref.to_owned()
                };
                writeln!(out,"Ok(f{i})}})();match decoded {{Ok(value)=>{{let field_value=&value;let canonical:&str={};if canonical!=original {{raw.insert({i},core::xml::Patch::read(core::yaml::scalar({preserved}).as_bytes(),&[],Q{id})?);}}Some(value)}},Err(_)=>{{raw.insert({i},core::xml::Patch::read(core::yaml::scalar({preserved}).as_bytes(),&[],Q{id})?);None}}}}}} else {{{missing}}};",canonical).unwrap();
                continue;
            }
            if !xml_side
                && !text_record
                && field
                    .presence
                    .is_some_and(|presence| presence.yaml_omit_when.is_some())
            {
                writeln!(out, "let explicit{i}=r{i}.is_some();").unwrap();
            }
            let null_value = if xml_side {
                None
            } else {
                super::scalar_presence::yaml_null_value(field.presence)
            };
            if let Some(expression) = null_value {
                let value = super::scalar_presence::missing(
                    Some(expression),
                    &field.codec,
                    &format!("E{id}F{i}"),
                    entry,
                    program,
                )?;
                writeln!(out, "let f{i}=if empty{i} {{{value}}} else {{").unwrap();
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
                        let sibling_attributes = fields
                            .iter()
                            .enumerate()
                            .filter(|(other_index, other)| {
                                *other_index != i && other.path == field.path
                            })
                            .filter_map(|(_, other)| other.attribute)
                            .map(|name| format!("({:?},{:?}),", name.namespace, name.local))
                            .collect::<String>();
                        let canonical = field.codec.write_text_reference(
                            &format!("E{id}F{i}"),
                            "field_value",
                            true,
                        );
                        let scalar_patch = if field.codec.is_qname() {
                            "tree.full_patch_yaml(&[],Q{id})?".replace("{id}", &id.to_string())
                        } else {
                            format!(
                                "if let Some(field_value)=decoded.as_ref() {{tree.text_patch_yaml({canonical},&[],Q{id})?}}else{{tree.full_patch_yaml(&[],Q{id})?}}"
                            )
                        };
                        writeln!(out,"let decoded=if nested{i} {{None}} else {{decoded}};if (shape{i} || (decoded.is_none() && !empty_absence)) && !(decoded.is_none() && {canonical_empty}) {{let mut tree=core::xml::Tree::capture_at(source,{},positions[{i}].xml_offset().expect(\"XML field position\"))?.expect(\"present scalar\");tree.omit_attributes(&[{sibling_attributes}]);let payload={scalar_patch};raw.insert({i},core::xml::Patch::read(payload.as_bytes(),&[],Q{id})?);}} decoded",path_code(field.path),canonical_empty=super::scalar_presence::can_emit_empty(field.presence)).unwrap();
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
                        writeln!(out,"if raw.get({i}).is_none() {{return Err(RuntimeDiagnostic::missing_scalar({:?}));}}",field.key).unwrap();
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
                let missing = preserved_missing(
                    field.presence.and_then(|presence| {
                        if xml_side {
                            presence.xml_missing.as_ref()
                        } else {
                            presence.yaml_missing.as_ref()
                        }
                    }),
                    &field.codec,
                    missing,
                    i,
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
                if null_value.is_some() {
                    writeln!(out, "f{i}}};").unwrap();
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
                .map(|i| {
                    if tracks_null(&fields[i]) {
                        format!("f{i},null{i}")
                    } else if canonical_attribute(&fields[i]) {
                        format!("f{i},attribute_present{i}")
                    } else {
                        format!("f{i}")
                    }
                })
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
    let mut canonical_attributes = String::new();
    for (i, field) in fields
        .iter()
        .enumerate()
        .filter(|(_, field)| canonical_attribute(field))
    {
        // Original presence is captured by the existing attribute reader. Do
        // not rescan the XML document to infer a canonical omission.
        let text = field
            .codec
            .qname_owned_reference(&format!("E{id}F{i}"), "field_value")
            .map(|qname| {
                format!("&{{let (uri,local)={qname};format!(\"{{{{{{uri}}}}}}{{local}}\")}}")
            })
            .unwrap_or_else(|| {
                field
                    .codec
                    .write_reference(&format!("E{id}F{i}"), "field_value", true)
            });
        writeln!(canonical_attributes,"if value.raw.get({i}).is_none() {{let _inputs=inputs;let omitted=xml_form_{id}_{i}(value,inputs)?;if value.attribute_present{i} && omitted==1 {{if let Some(field_value)=&value.f{i} {{value.raw.insert({i},core::xml::Patch::read(core::yaml::scalar({text}).as_bytes(),&[],Q{id})?);}}}}else if !value.attribute_present{i} && omitted!=1 && value.f{i}.is_some() {{value.raw.insert({i},core::xml::Patch::read(b\"null\",&[],Q{id})?);}}}}").unwrap();
    }
    if matches!(entry.yaml, YamlRepresentation::TextPattern(_)) {
        writeln!(out, "fn infer_xml_{id}(value:&mut V{id},source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{{canonical_attributes}let issues=issues_xml_{id}(value,source,inputs);value.raw.infer_value({},issues)}}",fields.len()).unwrap();
    } else {
        writeln!(out, "fn infer_xml_{id}(value:&mut V{id},source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{{canonical_attributes}let issues=issues_xml_{id}(value,source,inputs);value.raw.infer(&{:?},issues)}}",fields.iter().map(|field| field.key).collect::<Vec<_>>()).unwrap();
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
        if let Some(presence) = field.presence {
            for canonical in &presence.canonical {
                if let Some(name) = &canonical.xml_type {
                    namespaces.insert("http://www.w3.org/2001/XMLSchema-instance");
                    namespaces.insert(name.namespace.as_str());
                }
            }
        }
    }
    if fields.iter().any(|field| paired_null(field))
        || fields.iter().any(|field| {
            field.xml.is_some()
                && field.presence.is_some_and(|presence| {
                    presence
                        .canonical
                        .iter()
                        .any(|form| form.form == XmlForm::Nil)
                })
        })
    {
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
    out.push_str("let _=value;\n");
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
            let conditional = field
                .presence
                .is_some_and(|presence| !presence.canonical.is_empty());
            let base = if conditional {
                let typed = field.presence.into_iter().flat_map(|presence| presence.canonical.iter().enumerate())
                    .filter_map(|(index, form)| form.xml_type.as_ref().map(|name| {
                        let mode = super::canonical::mode(form, index);
                        let attribute = super::canonical::type_attribute(name);
                        format!("{mode}=>Some(core::xml::Tree::scalar(name.clone(),\"\",&[{attribute}])),")
                    })).collect::<String>();
                format!(
                    "({base}).or_else(||match xml_form {{2=>Some(core::xml::Tree::scalar(name.clone(),\"\",&[])),3=>Some(core::xml::Tree::scalar(name.clone(),\"\",{})),{typed}_=>None}})",
                    super::scalar_presence::absent_attributes(&XmlForm::Nil)
                )
            } else {
                base
            };
            writeln!(out,"let name=core::xml::Name{{namespace:{:?}.into(),local:{:?}.into()}}; {} let base={base}; Some(patch.apply(base,name,&[],Q{id})?) }} }} else {{ None }};",physical.namespace,physical.local,if conditional {format!("let xml_form=xml_form_{id}_{i}(value,_inputs)?;")} else {String::new()}).unwrap();
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
    writeln!(out, "const XML_NAMESPACES_{id}: &[&str]=&{:?}; fn {namespaces_xml}<'a>(_value: &'a V{id}, prepared: &'a {prepared_type}, namespaces: &mut Vec<&'a str>) {{ let _=prepared;for namespace in XML_NAMESPACES_{id} {{if !namespaces.contains(namespace) {{namespaces.push(namespace);}}}}", namespaces.into_iter().collect::<Vec<_>>()).unwrap();
    for (i, _) in physical_fields(&fields) {
        writeln!(
            out,
            "if let Some(tree)=&prepared.tree{i} {{tree.collect_namespaces(namespaces);}}"
        )
        .unwrap();
    }
    let mut dynamic_namespaces = false;
    for (i, field) in physical_fields(&fields) {
        if let Some(namespace) = field
            .codec
            .qname_namespace_reference(&format!("E{id}F{i}"), "field_value")
        {
            dynamic_namespaces = true;
            writeln!(out,"if let Some(field_value)=&_value.f{i} && let Some(namespace)={namespace} && !namespaces.contains(&namespace) {{namespaces.push(namespace);}}").unwrap();
            if field.attribute.is_some() {
                writeln!(out,"if let Some(patch)=_value.raw.get({i}) && let Ok(Some((namespace,_)))=patch.attribute_qname() && !namespaces.contains(&namespace) {{namespaces.push(namespace);}}").unwrap();
            }
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
    let owner_restore = if owner_patch {
        let root = &first.unwrap().path[..1];
        let name = &root[0];
        format!(
            "let ordinary={finish_xml};if let Some(patch)=value.raw.get(usize::MAX) {{let base=core::xml::Tree::capture(&ordinary,{root})?;let tree=patch.apply(base,core::xml::Name{{namespace:{namespace:?}.into(),local:{local:?}.into()}},&[],Q{id})?;tree.document(Q{id})}}else{{Ok(ordinary)}}",
            root = path_code(root),
            namespace = name.namespace,
            local = name.local
        )
    } else {
        format!("Ok({finish_xml})")
    };
    writeln!(out, "}} fn {write_xml_name}(value: &V{id}, inputs: &InputView<'_>) -> core::Result<Vec<u8>> {{ let prepared={prepare_xml}(value,inputs)?; let mut namespaces=Vec::new(); if {dynamic_namespaces} || !value.raw.is_empty() {{{namespaces_xml}(value,&prepared,&mut namespaces);}} let mut out=core::xml::Writer::new(if namespaces.is_empty() {{XML_NAMESPACES_{id}}} else {{&namespaces}}); {write_xml_into}(value,&prepared,inputs,&mut out)?; {owner_restore} }}").unwrap();
    // The field decoder owns storage and lexical representation; parent
    // composition consumes this adapter without reading fN/raw directly.
    for group in headers.chunk_by(|left, right| left.1.path == right.1.path) {
        let first = group[0].0;
        writeln!(out,"fn header_xml_{id}_{first}(value:&V{id},inputs:&InputView<'_>,out:&mut core::xml::Writer<'_>,declared:&[core::xml::WriteAttribute<'_>])->core::Result<()> {{with_header_xml_{id}_{first}(value,inputs,|fields|{{out.container_with_attributes({},declared.iter().chain(fields.iter().flatten()));Ok(())}})}}\nfn with_header_xml_{id}_{first}(value:&V{id},inputs:&InputView<'_>,consume:impl FnOnce(&[Option<core::xml::WriteAttribute<'_>>])->core::Result<()>)->core::Result<()> {{",path_code(group[0].1.path)).unwrap();
        let mut bound = Vec::new();
        for (i, field) in group {
            let attribute = field.attribute.unwrap();
            let omitted = if field
                .presence
                .is_some_and(|rule| !rule.canonical.is_empty())
            {
                format!("xml_form_{id}_{i}(value,inputs)?==1")
            } else {
                "false".to_owned()
            };
            if let Some(qname) = field
                .codec
                .qname_owned_reference(&format!("E{id}F{i}"), "field_value")
            {
                writeln!(out, "let qname{i}=if let Some(patch)=value.raw.get({i}) {{patch.attribute_qname()?.map(|(uri,local)|(uri,std::borrow::Cow::Borrowed(local)))}}else if {omitted} {{None}}else{{value.f{i}.as_ref().map(|field_value|->core::Result<(&str,std::borrow::Cow<'_,str>)>{{Ok({qname})}}).transpose()?}};").unwrap();
                bound.push(format!("if let Some(text)=value.raw.get({i}).map(|patch|patch.attribute_text()).transpose()?.flatten().filter(|text|!text.starts_with('{{')) {{Some(core::xml::WriteAttribute{{name:({:?},{:?}),value:core::xml::AttributeValue::Text(text)}})}}else{{qname{i}.as_ref().map(|(uri,local)|core::xml::WriteAttribute{{name:({:?},{:?}),value:core::xml::AttributeValue::QName((uri,local.as_ref()))}})}}",attribute.namespace,attribute.local,attribute.namespace,attribute.local));
                continue;
            }
            let lexical = match &field.codec {
                Codec::Decimal => {
                    "std::borrow::Cow::<str>::Owned(field_value.to_string())".to_owned()
                }
                Codec::Pattern(pattern) => format!(
                    "std::borrow::Cow::<str>::Owned(field_value.write(true{})?)",
                    if pattern.needs_inputs() {
                        ",inputs"
                    } else {
                        ""
                    }
                ),
                Codec::Forms(choice) => format!(
                    "std::borrow::Cow::<str>::Owned(field_value.write(true{})?)",
                    if choice.needs_inputs() { ",inputs" } else { "" }
                ),
                _ => format!(
                    "std::borrow::Cow::<str>::Borrowed({})",
                    field
                        .codec
                        .write_reference(&format!("E{id}F{i}"), "field_value", true)
                ),
            };
            let ordinary = if field.codec.write_is_fallible(true) {
                format!(
                    "if let Some(field_value)=value.f{i}.as_ref() {{{lexical}.into()}} else {{None}}"
                )
            } else {
                format!("value.f{i}.as_ref().map(|field_value|{lexical})")
            };
            writeln!(out,"let text{i}:Option<std::borrow::Cow<'_,str>>=if let Some(patch)=value.raw.get({i}) {{patch.attribute_text()?.map(std::borrow::Cow::Borrowed)}} else if {omitted} {{None}} else {{{ordinary}}};").unwrap();
            bound.push(format!("text{i}.as_deref().map(|text|core::xml::WriteAttribute{{name:({:?},{:?}),value:core::xml::AttributeValue::Text(text)}})",attribute.namespace,attribute.local));
        }
        writeln!(out, "let _=inputs;consume(&[{}])}}", bound.join(",")).unwrap();
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
    for group in headers
        .chunk_by(|left, right| left.1.path == right.1.path)
        .filter(|_| !sibling_headers)
    {
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
        writeln!(out, "{{let declared:&[core::xml::WriteAttribute<'_>]={declared};header_xml_{id}_{first}(value,_inputs,out,declared)?;}}").unwrap();
    }
    writeln!(out,"write_xml_fields_into_{id}(value,prepared,_inputs,out)}}\nfn write_xml_fields_into_{id}<'a>(value:&V{id},prepared:&'a {prepared_type},_inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{{let _=(&value,&prepared,&out);").unwrap();
    // Keep semantic field slots stable; only the XML writer follows XML mapping order.
    let xml_write_order: Vec<_> = if entry.xml_order_declared {
        xml_fields
            .iter()
            .filter_map(|mapping| {
                fields.iter().enumerate().find_map(|(index, field)| {
                    field
                        .xml
                        .is_some_and(|own| own.field == mapping.field)
                        .then_some(index)
                })
            })
            .collect()
    } else {
        (0..fields.len()).collect()
    };
    for i in xml_write_order {
        let field = &fields[i];
        if field.xml.is_none() {
            continue;
        }
        if field.attribute.is_some() {
            if sibling_headers
                && let Some(group) = headers.iter().find(|(_, header)| header.path == field.path)
                && group.0 == i
            {
                writeln!(out, "header_xml_{id}_{i}(value,_inputs,out,&[])?;").unwrap();
            }
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
        if field
            .presence
            .is_some_and(|presence| !presence.canonical.is_empty())
        {
            writeln!(
                out,
                "if {}xml_form_{id}_{i}(value,_inputs)? == 1 {{return Ok(());}}",
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
        } else {
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
        }
        // QName and text payloads share absence, canonical forms and patches.
        if field
            .presence
            .is_some_and(|presence| !presence.canonical.is_empty())
        {
            let typed = field
                .presence
                .into_iter()
                .flat_map(|presence| presence.canonical.iter().enumerate())
                .filter_map(|(index, form)| {
                    form.xml_type.as_ref().map(|name| {
                        let mode = super::canonical::mode(form, index);
                        let attribute = super::canonical::type_attribute(name);
                        format!(
                            "{mode}=>out.field_with_attributes({},\"\",&[{attribute}]),",
                            path_code(field.path)
                        )
                    })
                })
                .collect::<String>();
            writeln!(out,"if value.f{i}.is_none() && value.raw.get({i}).is_none() {} {{match xml_form_{id}_{i}(value,_inputs)? {{2=>out.field_with_attributes({},\"\",&[]),3=>out.field_with_attributes({},\"\",{}),{typed}_=>{{}}}}}}",if paired_null(field){format!("&& !value.null{i}")}else{String::new()},path_code(field.path),path_code(field.path),super::scalar_presence::absent_attributes(&XmlForm::Nil)).unwrap();
        }
        if paired_null(field) {
            writeln!(out,"if value.f{i}.is_none() && value.null{i} && value.raw.get({i}).is_none() {{out.field_with_attributes({},\"\",{});}}",path_code(field.path),super::scalar_presence::absent_attributes(&XmlForm::Nil)).unwrap();
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
    let null_guards = fields
        .iter()
        .enumerate()
        .filter(|(_, field)| paired_null(field))
        .map(|(index, _)| format!("!value.null{index}"))
        .collect::<Vec<_>>();
    let shorthand_null_guard = if null_guards.is_empty() {
        String::new()
    } else {
        format!("({}) && ", null_guards.join(" && "))
    };
    writeln!(
        out,
        "fn {write_yaml_name}(value: &V{id}, inputs: &InputView<'_>) -> core::Result<Vec<u8>> {{let mut out=String::new();write_yaml_into_{id}(value,inputs,&mut out)?;Ok(out.into_bytes())}}\nfn write_yaml_into_{id}(value: &V{id}, inputs: &InputView<'_>, out: &mut String) -> core::Result<()> {{if value.raw.is_empty() {{{plain_write}}} else {{core::yaml::append_encoded_properties(out,&write_yaml_preserved_{id}(value,inputs)?)}} }}\nfn write_yaml_fields_{id}(value: &V{id}, inputs: &InputView<'_>, out: &mut String) -> core::Result<()> {{write_yaml_indented_{id}(value,inputs,out,\"\",false)}}\nfn write_yaml_indented_{id}(value: &V{id}, inputs: &InputView<'_>, out: &mut String, indent:&str, lift_attributes:bool) -> core::Result<()> {{write_yaml_except_{id}(value,inputs,out,indent,lift_attributes,None)}}\nfn write_yaml_except_{id}(value: &V{id}, _inputs: &InputView<'_>, out: &mut String, indent:&str, lift_attributes:bool, excluded:Option<usize>) -> core::Result<()> {{ let _=(value,indent,excluded,lift_attributes);let start=out.len();",
        plain_write = if projected {
            format!("write_yaml_fields_{id}(value,inputs,out)")
        } else if shorthand.is_some() {
            format!("if {shorthand_null_guard}write_yaml_shorthand_{id}(value,inputs,out,\"\")? {{Ok(())}} else {{core::yaml::append_properties(out,|out|write_yaml_fields_{id}(value,inputs,out))}}")
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
        if field
            .presence
            .is_some_and(|presence| presence.yaml_null_when.is_some())
        {
            let condition = if preserve {
                format!("value.raw.get({i}).is_none() && null_{id}_{i}(value,_inputs)?")
            } else {
                format!("null_{id}_{i}(value,_inputs)?")
            };
            let null_output = if field.yaml_projected {
                String::from("out.push_str(\"null\\n\");")
            } else {
                format!(
                    "out.push_str(&core::yaml::scalar({:?}));out.push_str(\": null\\n\");",
                    field.key
                )
            };
            writeln!(out, "let null_form_{i} = excluded != Some({i}) && {condition};if null_form_{i} {{out.push_str(indent);{null_output}}}").unwrap();
        }
        if tracks_null(field) && !field.yaml_projected {
            writeln!(out,"if excluded != Some({i}) && value.f{i}.is_none() && value.null{i} {{out.push_str(indent);out.push_str(&core::yaml::scalar({:?}));out.push_str(\": null\\n\");}}",field.key).unwrap();
        }
        writeln!(out, "if {} {{", yaml_field_guard(id, i, field, preserve)).unwrap();
        let text = if field.optional || preserve {
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
    if let Some((index, field)) = fields.iter().enumerate().find(|(_, field)| {
        field.yaml_projected
            && (super::scalar_presence::yaml_empty(field.presence, EmptyKind::Null)
                || super::scalar_presence::yaml_empty(field.presence, EmptyKind::Mapping))
    }) {
        let marker = if super::scalar_presence::yaml_empty(field.presence, EmptyKind::Mapping) {
            "{}\n"
        } else {
            "null\n"
        };
        writeln!(
            out,
            "if excluded != Some({index}) && out.len()==start {{out.push_str(indent);out.push_str({marker:?});}}"
        )
        .unwrap();
    }
    if layout.is_some() {
        out.push_str("if out.ends_with(\":\\n\") {out.push_str(\"  {}\\n\");}\n");
    }
    out.push_str("if out.len()>start { out.pop(); } Ok(()) }\n");
    writeln!(out,"fn write_yaml_preserved_{id}(value: &V{id}, inputs: &InputView<'_>) -> core::Result<Vec<u8>> {{write_yaml_preserved_fields_{id}(value,inputs,false)}}\nfn write_yaml_preserved_fields_{id}(value:&V{id},inputs:&InputView<'_>,lift_attributes:bool)->core::Result<Vec<u8>> {{write_yaml_preserved_except_{id}(value,inputs,lift_attributes,None)}}\nfn write_yaml_preserved_except_{id}(value:&V{id},inputs:&InputView<'_>,lift_attributes:bool,excluded:Option<usize>)->core::Result<Vec<u8>> {{let mut out=String::new();write_yaml_except_{id}(value,inputs,&mut out,\"\",lift_attributes,excluded)?;let bytes=out.into_bytes();").unwrap();
    if preserve {
        out.push_str(if has_preservation_fields {
            "let mut bytes=bytes;\n"
        } else {
            ""
        });
        for (i, field) in yaml_preservation_fields(&fields) {
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
    if owner_patch {
        writeln!(out,"if let Some(patch)=value.raw.get(usize::MAX) {{bytes=core::raw::Document::encode(&bytes,patch.to_yaml().as_bytes())?;}}").unwrap();
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
        .filter(|field| field.xml.is_some() && field.attribute.is_none() && field.codec.is_qname())
        .map(|field| format!("core::xml::matches(path,{})", path_code(field.path)))
        .collect::<Vec<_>>()
        .join(" || ");
    let qname_attributes = fields
        .iter()
        .filter_map(|field| {
            let name = field.attribute?;
            field.codec.is_qname().then(|| {
                format!(
                    "core::xml::matches(path,{}) && {}",
                    path_code(field.path),
                    attributes::name_matches(name, "name")
                )
            })
        })
        .collect::<Vec<_>>()
        .join(" || ");
    out.push_str(&super::proof::qnames(id, &format!("Q{id}.to_vec()")));
    out.push_str(&super::proof::generate(
        id,
        if scalar.is_empty() { "false" } else { &scalar },
        &format!("(name.namespace==\"http://www.w3.org/2001/XMLSchema-instance\" && name.local==\"type\") || ({}) || ({})", container.as_ref().map_or_else(|| "false".to_owned(), |container| container.code.qnames.replace("_path", "path").replace("_name", "name")), if qname_attributes.is_empty() { "false" } else { &qname_attributes }),
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
    // A scalar projection has no property keys on which to attach XML deltas.
    // Its enclosing property owns preservation after this proof reports a mismatch.
    if preserve
        && !projected
        && fields
            .iter()
            .any(|field| field.attribute.is_none() || !field.yaml_visible)
    {
        writeln!(out,"fn {finalize_name}(original:&[u8],candidate:Vec<u8>,_value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{ if !({required_missing}) {{match verify_{id}(original,&candidate,inputs) {{Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some(core::proof::MISMATCH)=>{{}},Err(error)=>return Err(error)}}}} ").unwrap();
        // A canonical omission defines export from ordinary YAML. It cannot
        // prove restoration of an explicitly present XML field: absence and
        // presence need the same generic delta as any other physical change.
        if has_physical_fields {
            writeln!(out,"let ordinary=write_xml_{id}(&read_yaml_{id}(&candidate,inputs)?,inputs)?; let mut candidate=candidate;").unwrap();
        }
        if owner_patch {
            let root = &first.unwrap().path[..1];
            writeln!(
                out,
                "let owner_tree=core::xml::Tree::capture_required(original,{root})?;",
                root = path_code(root)
            )
            .unwrap();
            writeln!(
                out,
                "let ordinary_tree=core::xml::Tree::capture(&ordinary,{})?;",
                path_code(root)
            )
            .unwrap();
        }
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
                write!(restore_meaning, "if _value.raw.get({i}).is_none() && omit_{id}_{i}(_value,inputs)? && let Some(field_value)=&_value.f{i} && {} {{let _inputs=inputs;if !candidate.is_empty() {{candidate.push(b'\\n');}} candidate.extend_from_slice(core::yaml::scalar({:?}).as_bytes());candidate.extend_from_slice(b\": \");candidate.extend_from_slice(({yaml}).as_bytes());}}", field.codec.yaml_representable(&name, "field_value"), field.key).unwrap();
            }
            if owner_patch {
                let encode = if projected {
                    "core::raw::Document::encode(&candidate,patch.as_bytes())?".to_owned()
                } else {
                    format!(
                        "core::raw::Property::encode_in({parent},{:?},{:?},&candidate,patch.as_bytes())?",
                        field.key,
                        field.physical_name().local
                    )
                };
                writeln!(out,"if let Some(patch)=owner_tree.patch_at(ordinary_tree.as_ref(),{path},{required},&[],Q{id})? && patch!=\"{{}}\" {{if patch!=\"null\" {{{restore_meaning}}}candidate={encode};}}",path=path_code(&field.path[1..]),required=required_fields.contains(&i)).unwrap();
            } else if projected {
                writeln!(out,"if let Some(tree)=core::xml::Tree::capture(original,{path})? {{let base=core::xml::Tree::capture(&ordinary,{path})?;let patch=tree.patch_yaml(base.as_ref(),&[],Q{id})?;if patch!=\"{{}}\" {{{restore_meaning}candidate=core::raw::Document::encode(&candidate,if patch.is_empty() {{b\"\\\"\\\"\"}} else {{patch.as_bytes()}})?;}}}} else if core::xml::Tree::capture(&ordinary,{path})?.is_some() || {required} {{candidate=core::raw::Document::encode(&candidate,b\"null\")?;}}",path=path_code(field.path),required=required_fields.contains(&i)).unwrap();
            } else {
                writeln!(out,"if let Some(tree)=core::xml::Tree::capture(original,{path})? {{let base=core::xml::Tree::capture(&ordinary,{path})?;let patch=tree.patch_yaml(base.as_ref(),&[],Q{id})?;if patch!=\"{{}}\" {{{restore_meaning}candidate=core::raw::Property::encode_in({parent},{key:?},{physical:?},&candidate,if patch.is_empty() {{b\"\\\"\\\"\"}} else {{patch.as_bytes()}})?;}}}} else if core::xml::Tree::capture(&ordinary,{path})?.is_some() || {required} {{candidate=core::raw::Property::encode_in({parent},{key:?},{physical:?},&candidate,b\"null\")?;}}",path=path_code(field.path),key=field.key,physical=field.physical_name().local,required=required_fields.contains(&i)).unwrap();
            }
        }
        if owner_patch {
            let root = &first.unwrap().path[..1];
            writeln!(out,"match verify_{id}(original,&candidate,inputs) {{Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some(core::proof::MISMATCH)=>{{}},Err(error)=>return Err(error)}}let ordinary=write_xml_{id}(&read_yaml_{id}(&candidate,inputs)?,inputs)?;let base=core::xml::Tree::capture(&ordinary,{root})?;let patch=owner_tree.patch_yaml(base.as_ref(),&[],Q{id})?;candidate=core::raw::Document::encode(&candidate,patch.as_bytes())?;",root=path_code(root)).unwrap();
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
    let text_field = |field: &Field<'_>| {
        matches!(
            field.codec,
            Codec::Text
                | Codec::TextTable(_)
                | Codec::QNameText(_)
                | Codec::Enumeration(..)
                | Codec::QNameEnumeration(..)
                | Codec::States(..)
        )
    };
    let has_text = fields.iter().any(text_field);
    if has_text {
        out.push_str("match field{");
    }
    for (index, field) in fields.iter().enumerate() {
        if text_field(field) {
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
    let has_calendar = fields
        .iter()
        .any(|field| matches!(field.codec, Codec::Calendar { .. }));
    writeln!(out,"#[allow(dead_code)] fn calendar_field_{id}(value:&V{id},field:usize)->core::Result<&core::calendar::Value>{{let _=(value,field);").unwrap();
    if has_calendar {
        out.push_str("match field{");
    }
    for (index, field) in fields.iter().enumerate() {
        if matches!(field.codec, Codec::Calendar { .. }) {
            writeln!(out,"{index}=>value.f{index}.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"fact.unready\",\"Calendar field is unavailable\")),").unwrap();
        }
    }
    if has_calendar {
        out.push_str("_=>");
    }
    out.push_str("Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Expected a calendar field\"))}");
    if has_calendar {
        out.push('}');
    }
    out.push('\n');
    let mut input_arms = String::new();
    for (index, field) in fields.iter().enumerate() {
        if matches!(field.codec, Codec::Pattern(_)) {
            writeln!(input_arms, "{index}=>value.f{index}.as_ref().map(|stored|core::inputs::InputRef::Record(stored)),").unwrap();
            continue;
        }
        if matches!(&field.codec, Codec::Forms(choice) if choice.constructible()) {
            writeln!(
                input_arms,
                "{index}=>value.f{index}.as_ref().map(|stored|match (stored.as_input(),value.raw.get({index})){{(core::inputs::InputRef::Choice{{variant,fields}},Some(xml))=>core::inputs::InputRef::PreservedChoice{{variant,fields,xml}},(cell,_)=>cell}}),"
            )
            .unwrap();
            continue;
        }
        let variant = match &field.codec {
            Codec::Text
            | Codec::TextTable(_)
            | Codec::QNameText(_)
            | Codec::Enumeration(..)
            | Codec::QNameEnumeration(..)
            | Codec::States(..) => "Text",
            Codec::Boolean(..) => "Boolean",
            Codec::Decimal | Codec::FormattedDecimal(_) => "Decimal",
            Codec::Calendar { .. } => "Calendar",
            _ => continue,
        };
        let meaning = field
            .codec
            .input_reference(&format!("E{id}F{index}"), "stored");
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
    let preserved_fields = if preserve {
        fields.iter().enumerate().map(|(index,_)|format!("if field=={index} && value.f{index}.is_none() && let Some(patch)=value.raw.get({index}){{return Some(core::inputs::InputRef::PreservedXml(patch));}}\n")).collect::<String>()
    } else {
        String::new()
    };
    let null_fields = fields.iter().enumerate().filter(|(_,field)| tracks_null(field))
        .map(|(index,_)| format!("if field=={index} && value.null{index} && value.f{index}.is_none(){{return Some(core::inputs::InputRef::NullValue)}}"))
        .collect::<String>();
    let input_body = if input_arms.is_empty() {
        "None".into()
    } else {
        format!("match field{{{input_arms}_=>None}}")
    };
    writeln!(out,"#[allow(dead_code)] fn input_field_{id}(value:&V{id},field:usize)->Option<core::inputs::InputRef<'_>> {{let _=(value,field);{preserved_fields}{null_fields}\n{input_body}}}").unwrap();
    if text_record {
        out.push_str(&text::envelope(entry, &fields, keep_positions, boundary));
    }
    Ok(if let Some(layout) = layout {
        super::nested_record::wrap(out, layout)
    } else {
        out
    })
}
