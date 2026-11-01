//! Adapt each value backend to the same parent-facing operation contract.
use super::*;

fn add_virtual_route(entry: &mut LinkedEntry, field: &LinkedField, rooted: bool) {
    let LinkedXml::Record(xml) = &mut entry.xml else {
        unreachable!()
    };
    let mut path = Vec::new();
    if rooted {
        path.push(ExpandedName {
            namespace: String::new(),
            local: "__declarative_virtual_root__".into(),
        });
    }
    path.push(ExpandedName {
        namespace: String::new(),
        local: "__declarative_virtual__".into(),
    });
    if let Some(existing) = xml
        .iter_mut()
        .find(|mapping| mapping.field == field.name && mapping.path.is_empty())
    {
        existing.path = path;
        return;
    }
    xml.push(LinkedXmlField {
        file: None,
        field: field.name.clone(),
        path,
        attribute: None,
        source: field.source.clone(),
    });
}

use std::fmt::Write;

pub(super) struct ValueEmission {
    pub source: String,
    pub xml_stateful: bool,
    pub yaml_stateful: bool,
    pub mechanism: &'static str,
    pub choice_variants: Vec<(String, usize)>,
}

#[derive(Clone, Copy)]
pub(super) struct Placement {
    pub external: bool,
    pub shared_container: bool,
}
pub(super) struct UsageRequest<'a> {
    pub entry: &'a LinkedEntry,
    pub child: &'a LinkedEntry,
    pub program: &'a Program<'a>,
    pub id: u32,
    pub slot: usize,
    pub placement: Placement,
    pub names: &'a [(&'a str, &'a str)],
    pub variant_text_fields: bool,
    pub lifted_key: Option<&'a str>,
}
pub(super) fn nullable_first_field(entry: &LinkedEntry) -> bool {
    entry.presence.iter().any(|presence| {
        presence.target == LinkedPresenceTarget::Field(0)
            && presence
                .xml_empty
                .iter()
                .any(|form| form.form == EmptyKind::Nil)
            && presence
                .yaml_empty
                .iter()
                .any(|form| matches!(form.form, EmptyKind::Null | EmptyKind::Mapping))
    })
}
pub(super) fn emit_usage(
    entry: &LinkedEntry,
    child: &LinkedEntry,
    program: &Program,
    id: u32,
    slot: usize,
    placement: Placement,
    names: &[(&str, &str)],
) -> Result<ValueEmission, Diagnostic> {
    if super::choice_value::applies(child, program) {
        return super::choice_value::emit(entry, child, program, id, slot, placement, names);
    }
    emit_standard_usage(UsageRequest {
        entry,
        child,
        program,
        id,
        slot,
        placement,
        names,
        variant_text_fields: false,
        lifted_key: None,
    })
}

// File placement belongs to the application adapter, not the value backend.
// Use the same local shape for emission and for borrowed input captures.
pub(super) fn local_usage(
    child: &LinkedEntry,
    program: &Program,
) -> Result<LinkedEntry, Diagnostic> {
    let (LinkedType::Record(fields), LinkedXml::Record(xml)) = (&child.value, &child.xml) else {
        return Err(unsupported(child, "Local usage requires a record"));
    };
    let field = &fields[0];
    let mapping = xml.first();
    let referenced = field
        .value
        .as_reference()
        .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id));
    let sequence = referenced.is_some_and(|entry| matches!(entry.value, LinkedType::Sequence(_)));
    let record = referenced.is_some_and(|entry| matches!(entry.value, LinkedType::Record(_)));
    let mut local = child.clone();
    if let LinkedXml::Record(fields) = &mut local.xml {
        for field in fields {
            field.file = None;
        }
    }
    if mapping.is_none() && sequence && super::declared_items::applies(&local, program) {
        add_virtual_route(&mut local, field, false);
    }
    if mapping.is_none_or(|mapping| mapping.path.is_empty()) && record {
        add_virtual_route(&mut local, field, true);
    }
    Ok(local)
}

pub(super) fn emit_standard_usage(request: UsageRequest<'_>) -> Result<ValueEmission, Diagnostic> {
    let UsageRequest {
        entry,
        child,
        program,
        id,
        slot,
        placement,
        names,
        variant_text_fields,
        lifted_key,
    } = request;
    let Placement {
        external,
        shared_container,
    } = placement;
    let (LinkedType::Record(fields), LinkedXml::Record(xml)) = (&child.value, &child.xml) else {
        unreachable!()
    };
    let mut out = String::new();
    let yaml_documents_adapter = if !super::external_text::has_documents(child, program) {
        String::new()
    } else {
        format!(
            "pub(super) fn yaml_documents(value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<(core::resources::RelativePath,Vec<u8>)>>{{write_yaml_documents_{id}(&value.0,inputs)}}"
        )
    };
    let mapping = xml.first();
    let field = &fields[0];
    let sequence = composite::reference(&field.value)
        .and_then(|(target, _, _)| program.entries.iter().find(|entry| entry.id == target))
        .filter(|entry| matches!(entry.value, LinkedType::Sequence(_)));
    let record = composite::reference(&field.value)
        .and_then(|(target, _, _)| program.entries.iter().find(|entry| entry.id == target))
        .filter(|entry| matches!(entry.value, LinkedType::Record(_)));
    let local = local_usage(child, program)?;
    let record_value = crate::plan::routes::record_usage(&local, program)?.is_some();
    let qname = super::qname::applies(child, program);
    let scoped_scalar_fields = match &local.value {
        LinkedType::Record(fields) => fields.iter().any(|field| {
            scalar::Codec::resolve(&field.value, &local, program)
                .is_ok_and(|codec| codec.is_qname())
        }),
        _ => false,
    };
    let nested_layout = if record_value {
        None
    } else {
        super::nested_record::lower(&local, program)?
    };
    let nested = nested_layout.is_some();
    let composite =
        !record_value && !qname && !nested && super::composite::record(child, program).is_some();
    let deferred = !record_value && !nested && !qname && !composite && sequence.is_none();
    let checks = if deferred {
        constraints::scalar_record(&local, program)?
    } else {
        constraints::generate(&local, program)?
    };
    let declared_items = super::declared_items::applies(&local, program);
    let code = if record_value && lifted_key.is_some() {
        super::record_reference::generate_lifted(&local, program, lifted_key)?.expect("record item")
    } else if shared_container && declared_items {
        super::declared_items::generate_at(&local, program, true)?.expect("declared collection")
    } else if deferred {
        record::generate_deferred(&local, program)?
    } else {
        record::generate(&local, program)?
    };
    let infer = if deferred {
        format!("infer_xml_{id}(&mut value.0,source,inputs)")
    } else {
        "let _=(value,source,inputs);Ok(())".to_owned()
    };
    let stateful_part = !composite
        && sequence
            .is_none_or(|entry| !matches!(entry.yaml, YamlRepresentation::TextSequence { .. }));
    let yaml_stateful_part = stateful_part;
    let state_adapter = if stateful_part {
        let state = if qname {
            format!("QNameXmlRead{id}")
        } else if record_value {
            format!("RecordXmlRead{id}")
        } else if sequence.is_some() {
            format!("XmlCollection{id}")
        } else {
            format!("XmlRead{id}")
        };
        let consume = if qname {
            "self.0.consume(path,token,scope)"
        } else if record_value || declared_items {
            "self.0.consume_scoped(path,token,scope,_source,_inputs)"
        } else if scoped_scalar_fields {
            "self.0.consume_scoped(path,token,scope)"
        } else if sequence.is_some() {
            "self.0.consume(path,token,_source,_inputs)"
        } else {
            "self.0.consume(path,token)"
        };
        let finish = if qname {
            "Ok(self.0.finish())".to_owned()
        } else if record_value {
            "self.0.finish(_source,_inputs)".to_owned()
        } else if sequence.is_some() && !declared_items {
            format!("finish_xml_{id}(self.0,_inputs)")
        } else {
            format!("finish_xml_{id}(self.0,_source,_inputs)")
        };
        format!(
            "pub(super) struct XmlReader({state});impl XmlReader{{pub(super) fn new()->Self{{Self({state}::new())}}pub(super) fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:Option<core::xml::NamespaceScope<'_>>,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{{let _=scope;{consume}}}pub(super) fn finish(self,_source:&[u8],_inputs:&InputView<'_>)->core::Result<Stored>{{{finish}.map(|value|Stored(value,true))}}}}"
        )
    } else {
        String::new()
    };
    let yaml_adapter = if !yaml_stateful_part {
        String::new()
    } else if qname {
        format!(
            "pub(super) struct YamlReader(QNameYamlRead{id});impl YamlReader{{pub(super) fn new()->core::Result<Self>{{Ok(Self(QNameYamlRead{id}::new()))}}pub(super) fn consume(&mut self,node:core::yaml::Node,_position:core::Position,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{{self.0.consume(node)}}pub(super) fn finish(self,_source:&[u8],_inputs:&InputView<'_>)->core::Result<Stored>{{self.0.finish().map(|value|Stored(value,true))}}}}"
        )
    } else if record_value {
        format!(
            "pub(super) struct YamlReader(RecordYamlRead{id});impl YamlReader{{pub(super) fn new()->core::Result<Self>{{RecordYamlRead{id}::new().map(Self)}}pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{self.0.consume(node,position,source,inputs)}}pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{self.0.finish(source,inputs).map(|value|Stored(value,true))}}}}"
        )
    } else if let Some(sequence) = sequence {
        let (state, consume, finish) =
            if matches!(sequence.yaml, YamlRepresentation::KeyedMapping { .. }) {
                (
                    format!("YamlDictionary{id}"),
                    "self.0.consume(node,position,_inputs)".to_owned(),
                    format!("finish_yaml_dictionary_{id}(self.0,_source,_inputs,true)"),
                )
            } else {
                (
                    format!("YamlSequence{id}"),
                    "self.0.consume(node,position,_source,_inputs)".to_owned(),
                    "self.0.finish(_source,_inputs)".to_owned(),
                )
            };
        format!(
            "pub(super) struct YamlReader({state});impl YamlReader{{pub(super) fn new()->core::Result<Self>{{Ok(Self({state}::new()))}}pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{{{consume}}}pub(super) fn finish(self,_source:&[u8],_inputs:&InputView<'_>)->core::Result<Stored>{{{finish}.map(|value|Stored(value,true))}}}}"
        )
    } else if deferred && matches!(local.yaml, YamlRepresentation::Projection(_)) {
        format!(
            "pub(super) struct YamlReader{{seen:u8,fields:YamlFields{id}}}impl YamlReader{{pub(super) fn new()->core::Result<Self>{{Ok(Self{{seen:0,fields:YamlFields{id}::new(core::raw::Fields::default())?}})}}pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{{consume_yaml_projection_{id}(&mut self.fields,&mut self.seen,node,position)}}pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{if self.seen!=1{{return Err(RuntimeDiagnostic::new(\"yaml.expected-scalar\",\"Missing or incomplete projected value\"))}}finish_yaml_{id}(self.fields,source,inputs).map(|value|Stored(value,true))}}}}"
        )
    } else {
        let (mapping, consume, finish) = nested_layout.as_ref().map_or_else(
            || ("ScalarMapping", "self.mapping.consume(node,position)".to_owned(), format!("self.mapping.finish()?;finish_yaml_{id}(self.fields,source,inputs)")),
            |layout| ("ScalarRecordReader", format!("self.mapping.consume(node,{:?})",layout.key), format!("let present=self.mapping.finish()?;finish_yaml_{id}(self.fields,present,source,inputs)")),
        );
        format!(
            "pub(super) struct YamlReader{{mapping:core::yaml::{mapping},fields:YamlFields{id}}}impl YamlReader{{pub(super) fn new()->core::Result<Self>{{Ok(Self{{mapping:core::yaml::{mapping}::default(),fields:YamlFields{id}::new(core::raw::Fields::default())?}})}}pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{{let _=position;if let Some(entry)={consume}?{{self.fields.consume(entry.key,entry.value,entry.tag)?;}}Ok(())}}pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{{finish}.map(|value|Stored(value,true))}}}}"
        )
    };
    let prepared = if declared_items {
        format!("PreparedRows{id}")
    } else if sequence.is_some() {
        "Option<core::xml::Tree>".to_owned()
    } else {
        format!("XmlPrepared{id}")
    };
    let xml_extra = if sequence.is_some() {
        ",|_,_|Ok(false)"
    } else {
        ""
    };
    let xml_reader = if sequence.is_some() {
        format!("read_xml_events_scoped_{id}")
    } else {
        format!("read_xml_events_{id}")
    };
    let yaml_extra = match sequence {
        Some(entry) if matches!(entry.yaml, YamlRepresentation::KeyedMapping { .. }) => "true,",
        Some(_) => "",
        None if record_value || qname || composite => "",
        None => "core::raw::Fields::default(),",
    };
    let xml_events = if qname || record_value || declared_items || scoped_scalar_fields {
        "events"
    } else if sequence.is_some() {
        "core::xml::ScopedEvents(|consume:&mut core::xml::ScopedConsumer<'_>|events.visit_scoped(|path,token,scope|consume(path,token,scope)))"
    } else {
        "core::xml::Events(|consume:&mut core::xml::Consumer<'_>|events.visit_scoped(|path,token,_scope|consume(path,token)))"
    };
    let yaml_source = if qname { "" } else { "source," };
    let fallback_xml = if sequence.is_some() {
        format!(
            "match read_xml_events_{id}(source,inputs,core::xml::DocumentSource(source),|_,_|Ok(false)) {{Ok(value)=>Ok(Stored(value,true)),Err(_)=>read_xml_{id}(source,inputs).map(|value|Stored(value,false))}}"
        )
    } else {
        format!("read_xml_{id}(source,inputs).map(|value|Stored(value,true))")
    };
    let route = record::path_code(mapping.map_or(&[], |mapping| &mapping.path));
    let unwrapped = sequence.is_some_and(|entry| matches!(super::attributes::content(&entry.xml).0, LinkedXml::ElementSequence {path,..} if path.is_empty()));
    let projection = if unwrapped { "Members" } else { "Element" };
    let children: Vec<_> = xml
        .iter()
        .filter(|mapping| mapping.attribute.is_none())
        .map(|mapping| {
            let name = mapping.path.last().unwrap();
            (name.namespace.as_str(), name.local.as_str())
        })
        .collect();
    let project = if let Some(mapping) = mapping {
        if !names.is_empty() && xml.iter().any(|mapping| mapping.attribute.is_none()) {
            let boundary = xml
                .iter()
                .find(|mapping| mapping.attribute.is_some())
                .unwrap();
            let parent = record::path_code(&boundary.path);
            format!(
                "core::xml::project_property(source,{parent},core::xml::PropertyProjection::Record{{fields:&{children:?},attributes:&{names:?}}},xml_qname_attribute_{id},xml_qname_text_{id})"
            )
        } else if names.is_empty() && xml.len() > 1 {
            let parent = record::path_code(&mapping.path[..mapping.path.len() - 1]);
            format!(
                "core::xml::project_property(source,{parent},core::xml::PropertyProjection::Fields(&{children:?}),xml_qname_attribute_{id},xml_qname_text_{id})"
            )
        } else if names.is_empty() {
            format!(
                "core::xml::project_property(source,{route},core::xml::PropertyProjection::{projection},xml_qname_attribute_{id},xml_qname_text_{id})"
            )
        } else {
            // Attribute values can themselves be QNames. Keep their namespace
            // bindings while excluding child members from this boundary.
            format!(
                "core::xml::project_property(source,{route},core::xml::PropertyProjection::Record{{fields:&[],attributes:&{names:?}}},xml_qname_attribute_{id},xml_qname_text_{id})"
            )
        }
    } else {
        "Ok(Vec::<u8>::new())".to_owned()
    };
    let project = if shared_container && let Some(sequence) = sequence {
        let LinkedXml::ElementSequence { path, .. } = attributes::content(&sequence.xml).0 else {
            return Err(unsupported(
                entry,
                "Shared collections require declared element routes",
            ));
        };
        format!(
            "core::xml::project_property(source,{route},core::xml::PropertyProjection::Path({}),xml_qname_attribute_{id},xml_qname_text_{id})",
            record::path_code(path)
        )
    } else {
        project
    };
    let project = if external {
        "Ok(source.to_vec())".to_owned()
    } else {
        project
    };
    let lift_attributes = deferred
        && shared_container
        && !xml.is_empty()
        && xml.iter().all(|mapping| mapping.attribute.is_some());
    let boundary_meaning = if lift_attributes {
        // Absence of an implied attribute is lifted to its owner patch. Compare
        // through that same adapter, without treating the spelling as meaning.
        "let mut old_yaml=String::new();let mut new_yaml=String::new();write_yaml_indented(&Stored(old,true),inputs,&mut old_yaml,\"\")?;write_yaml_indented(&Stored(new,true),inputs,&mut new_yaml,\"\")?;Ok(old_yaml==new_yaml)".to_owned()
    } else {
        format!("Ok(write_yaml_{id}(&old,inputs)?==write_yaml_{id}(&new,inputs)?)")
    };
    let repeated_boundary = if !record_value
        && !qname
        && !composite
        && sequence.is_none()
        && super::facts::scalar_xml_projection(&local, program)
    {
        format!(
            "if matches!(after,std::borrow::Cow::Borrowed(_)) && has_raw(value) {{let decoded=read_xml_fact_{id}(&after,inputs)?;return prove_xml_{id}(&value.0,&before,&write_xml_{id}(&decoded,inputs)?);}}"
        )
    } else {
        String::new()
    };
    let verify_boundary = if external {
        format!("let _=inputs;prove_xml_{id}(&value.0,before,after)")
    } else {
        format!(
            "let (before,after)=(core::xml::borrow_or_project(before,project)?,core::xml::borrow_or_project(after,project)?);{repeated_boundary}match prove_xml_{id}(&value.0,&before,&after){{Ok(())=>Ok(()),Err(error) if error.code.as_deref()==Some(core::proof::MISMATCH)=>{{let same=(||->core::Result<bool>{{let old=read_xml_{id}(&before,inputs)?;let new=read_xml_{id}(&after,inputs)?;{boundary_meaning}}})().unwrap_or(false);if same{{Ok(())}}else{{Err(error)}}}},Err(error)=>Err(error)}}"
        )
    };
    let raw_test = if record_value && record.is_some() {
        format!("value.0.raw.is_some() || value.0.body.as_ref().is_some_and(item_{id}::has_raw)")
    } else if record_value || sequence.is_some() || declared_items || composite {
        "value.0.raw.is_some()".into()
    } else {
        "!value.0.raw.is_empty()".into()
    };
    // A missing shared attribute with an implied semantic value belongs to
    // its container boundary. Explicit values and semantic annotations retain
    // their existing field boundaries; only pure absence patches are lifted.
    let indented_adapter = if lift_attributes {
        let checks = (0..fields.len())
            .map(|index| format!("value.0.raw.label({index}).is_none() && value.0.raw.get({index}).is_none_or(|patch|patch.is_null() && value.0.f{index}.is_some())"))
            .collect::<Vec<_>>()
            .join(" && ");
        format!(
            "fn lift_absence(value:&Stored)->bool{{value.0.raw.has_patches() && {checks}}} pub(super) fn write_yaml_indented(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{{core::yaml::append_properties(out,|out|{{if value.0.raw.is_empty(){{write_yaml_indented_{id}(&value.0,inputs,out,indent,false)}}else{{let bytes=write_yaml_preserved_fields_{id}(&value.0,inputs,lift_absence(value))?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));Ok(())}}}})}}"
        )
    } else if yaml_stateful_part {
        let plain = if sequence.is_some() && !declared_items {
            format!("prepare_yaml_into_{id}(&value.0,inputs,true,out,indent)")
        } else {
            format!(
                "core::yaml::append_properties(out,|out|write_yaml_indented_{id}(&value.0,inputs,out,indent,false))"
            )
        };
        format!(
            "pub(super) fn write_yaml_indented(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{{if {raw_test}{{let bytes=write_yaml_{id}(&value.0,inputs)?;core::yaml::append_properties(out,|out|{{core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));Ok(())}})}}else{{{plain}}}}}"
        )
    } else {
        String::new()
    };
    let exclude_writer = if !record_value && !nested && !qname && !composite && sequence.is_none() {
        format!(
            "pub(super) fn write_yaml_except(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str,excluded:usize)->core::Result<()>{{if value.0.raw.is_empty(){{core::yaml::append_properties(out,|out|write_yaml_except_{id}(&value.0,inputs,out,indent,false,Some(excluded)))}}else{{let bytes=write_yaml_preserved_except_{id}(&value.0,inputs,false,Some(excluded))?;core::yaml::append_properties(out,|out|{{core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));Ok(())}})}}}}"
        )
    } else {
        String::new()
    };
    let text_accessor = if !record_value && !nested && !qname && !composite && sequence.is_none() {
        format!("text_field_{id}(&value.0,field)")
    } else {
        "let _=(value,field);Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Expected a scalar field\"))".into()
    };
    let variant_text_accessor = if variant_text_fields
        && let Ok(scalar::Codec::Pattern(pattern)) =
            scalar::Codec::resolve(&field.value, child, program)
    {
        let (target, _, _) = composite::reference(&field.value)
            .ok_or_else(|| unsupported(child, "Text pattern variant needs a declaration"))?;
        let parts = program
            .entries
            .iter()
            .find(|entry| entry.id == target)
            .and_then(|entry| match &entry.value {
                LinkedType::Record(parts) => Some(parts),
                _ => None,
            })
            .ok_or_else(|| unsupported(child, "Text pattern variant needs record fields"))?;
        let cases = (0..parts.len())
            .map(|index| {
                if !scalar::Codec::resolve(&parts[index].value, child, program)
                    .is_ok_and(|codec| codec.input_method() == Some("text")) {
                    return format!("{index}=>Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Expected a text field\")),");
                }
                format!(
                    "{index}=>Ok({}),",
                    pattern.field_meaning(&format!("E{id}F0"), index, "selected")
                )
            })
            .collect::<String>();
        format!(
            "let selected=value.0.f0.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"Variant value is absent\"))?;match field{{{cases}_=>Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Unknown variant field\"))}}"
        )
    } else {
        "let _=(value,field);Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Expected a text pattern variant\"))".into()
    };
    let text_renderer = if deferred {
        match scalar::Codec::resolve(&field.value, child, program)? {
        scalar::Codec::Forms(choice) => {
            let inputs = if choice.needs_inputs() { ",inputs" } else { "" };
            format!("value.0.f0.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"fact.unready\",\"Text value is unavailable\"))?.write_text(false{inputs})")
        }
        _ => "let _=(value,inputs);Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Expected a text choice\"))".into(),
        }
    } else {
        "let _=(value,inputs);Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Expected a text choice\"))".into()
    };
    let calendar_accessor = if !record_value
        && !nested
        && !qname
        && !composite
        && sequence.is_none()
    {
        format!("calendar_field_{id}(&value.0,field)")
    } else {
        "let _=(value,field);Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Expected a calendar field\"))".into()
    };
    let input_accessor = if declared_items {
        "if field==0 && value.0.present { Some(core::inputs::InputRef::Records(core::inputs::Records::new(&value.0.rows))) } else { None }".into()
    } else if sequence.is_some_and(super::collections::borrowed_records) {
        "if field==0 { Some(match &value.0.rows {core::Sequence::Present(rows)=>core::inputs::InputRef::Records(core::inputs::Records::new(rows)),core::Sequence::Absent=>core::inputs::InputRef::MissingValue}) } else { None }".into()
    } else if record_value && record.is_some() {
        "if field==0 { if let Some(body)=value.0.body.as_ref(){Some(if let Some(xml)=value.0.raw.as_ref(){core::inputs::InputRef::PreservedRecord{fields:body,xml}}else{core::inputs::InputRef::Record(body)})}else{value.0.raw.as_ref().map(core::inputs::InputRef::PreservedXml)} } else { None }".into()
    } else if !record_value && !nested && !qname && !composite && sequence.is_none() {
        format!("input_field_{id}(&value.0,field)")
    } else {
        "let _=(value,field);None".into()
    };
    let null_accessor = if record_value && record.is_some() {
        "field==0 && value.0.nil".to_owned()
    } else if deferred {
        format!("input_field_{id}(&value.0,field).is_some_and(core::inputs::InputRef::is_null)")
    } else {
        "let _=(value,field);false".to_owned()
    };
    let annotation_accessor = if record_value && record.is_some() {
        format!(
            "value.0.body.as_ref().is_some_and(|body|item_{id}::field_has_annotation(body,field))"
        )
    } else if !record_value && !nested && !qname && !composite && sequence.is_none() {
        "value.0.raw.has_annotation(field)".into()
    } else {
        "let _=(value,field);false".into()
    };
    let field_presence = if record_value && record.is_some() {
        format!("value.0.body.as_ref().is_some_and(|body|item_{id}::field_present(body,field))")
    } else {
        "let _=(value,field);false".into()
    };
    let semantic_present = if record_value && let Some(target) = record {
        if let (YamlRepresentation::Projection(selected), LinkedType::Record(fields)) =
            (&target.yaml, &target.value)
        {
            let index = fields
                .iter()
                .position(|field| &field.name == selected)
                .expect("linked projection");
            format!(
                "value.0.body.as_ref().is_some_and(|body|core::inputs::RecordInput::field(body,{index}).is_some_and(|value|value.is_present()))"
            )
        } else {
            "value.0.body.is_some()".into()
        }
    } else if deferred && matches!(&local.value, LinkedType::Record(fields) if fields.len() == 1) {
        "value.0.f0.is_some()".into()
    } else {
        "true".into()
    };
    let xml_write = if mapping.is_none() {
        "let _=(value,prepared,inputs,out);Ok(())".to_owned()
    } else if !names.is_empty() && xml.iter().any(|mapping| mapping.attribute.is_none()) {
        format!("write_xml_fields_into_{id}(&value.0,&prepared.0,inputs,out)")
    } else {
        format!("write_xml_into_{id}(&value.0,&prepared.0,inputs,out)")
    };
    let scoped_scalar = if record_value || declared_items {
        format!("xml_scalar_at_{id}(&value.0,path,occurrences)")
    } else {
        format!("let _=occurrences;xml_scalar_{id}(&value.0,path)")
    };
    let fact_accessors = super::facts::owner_accessors(entry, child, program)?;
    let header_slot = xml
        .iter()
        .find(|mapping| mapping.attribute.is_some())
        .and_then(|mapping| match &local.value {
            LinkedType::Record(fields) => {
                fields.iter().position(|field| field.name == mapping.field)
            }
            _ => None,
        })
        .unwrap_or(0);
    let header_adapter = if names.is_empty() {
        String::new()
    } else {
        format!(
            "pub(super) fn header(value:&Stored,inputs:&InputView<'_>,out:&mut core::xml::Writer<'_>,declared:&[core::xml::WriteAttribute<'_>])->core::Result<()> {{header_xml_{id}_{header_slot}(&value.0,inputs,out,declared)}}\n"
        )
    };
    let variant_input_accessor = if record_value && record.is_some() {
        "value.0.body.as_ref().and_then(|body|core::inputs::RecordInput::field(body,field)).ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"Variant field has no semantic value\"))".to_owned()
    } else if variant_text_fields
        && matches!(
            scalar::Codec::resolve(&field.value, child, program),
            Ok(scalar::Codec::Pattern(_))
        )
    {
        "let selected=value.0.f0.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"Variant value is absent\"))?;core::inputs::RecordInput::field(selected,field).ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"Variant field has no semantic value\"))".to_owned()
    } else {
        "input_field(value,field).ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"Variant field has no semantic value\"))".to_owned()
    };
    let variant_text_adapter = if variant_text_fields {
        format!(
            "pub(super) fn variant_text_field(value:&Stored,field:usize)->core::Result<&str>{{{variant_text_accessor}}}"
        )
    } else {
        String::new()
    };
    let contribute = if record_value
        && record.is_some_and(|record| super::facts::has_contributions(record, program))
    {
        let absent = |xml: bool| {
            child.presence.iter().any(|rule| {
                rule.target == LinkedPresenceTarget::Field(0)
                    && (if xml {
                        &rule.xml_missing
                    } else {
                        &rule.yaml_missing
                    })
                    .as_ref()
                    .is_some_and(|value| matches!(value.kind, LinkedExpressionKind::Absent))
            })
        };
        let xml_absent = absent(true);
        let yaml_absent = absent(false);
        format!(
            "pub(super) fn contribute(value:&Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>>{{if value.0.raw.is_some(){{return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Preserved record has no complete semantic facts\")]);}}let normal_missing=match direction{{Direction::XmlToYaml=>{xml_absent},Direction::YamlToXml=>{yaml_absent}}};if value.0.body.is_none() && normal_missing{{return Ok(());}}let body=value.0.body.as_ref().ok_or_else(||vec![RuntimeDiagnostic::new(\"fact.unready\",\"Missing record has no semantic facts\")])?;item_{id}::contribute(body,direction,source,inputs,builder)}}"
        )
    } else {
        String::new()
    };
    let lifted_helpers = if lifted_key.is_some() && record_value {
        format!(
            "pub(super) fn key_can_be_lifted(value:&Stored)->bool{{value.0.raw.is_none()&&value.0.body.as_ref().is_some_and(item_{id}::key_can_be_lifted)}}\npub(super) fn write_mapping_value(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{{item_{id}::write_mapping_value(value.0.body.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"Missing record item\"))?,inputs,out,indent)}}"
        )
    } else {
        String::new()
    };
    let mut canonical_omissions = String::new();
    if deferred {
        for rule in &local.presence {
            let LinkedPresenceTarget::Field(index) = rule.target else {
                continue;
            };
            let cases = rule
                .canonical
                .iter()
                .enumerate()
                .filter_map(|(case, form)| (form.form == XmlForm::Missing).then_some(case + 1))
                .collect::<Vec<_>>();
            let Some(mapping) = xml.iter().find(|mapping| {
                mapping.field == fields[index as usize].name && mapping.attribute.is_none()
            }) else {
                continue;
            };
            if !cases.is_empty() && rule.yaml_omit_when.is_some() {
                writeln!(canonical_omissions,"if value.0.raw.is_empty()&&value.0.f{index}.is_some()&&omit_{id}_{index}(&value.0,inputs)?&&{cases:?}.contains(&xml_form_{id}_{index}(&value.0,inputs)?){{out.push({});}}",record::path_code(&mapping.path)).unwrap();
            }
        }
    }
    let sequence_items = if declared_items {
        format!(
            "pub(super) fn write_yaml_sequence_items<const ROOT:bool,const MARKED:bool>(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str,mark:&str)->core::Result<()>{{write_yaml_sequence_items_{id}::<ROOT,MARKED>(&value.0,inputs,out,indent,mark)}}"
        )
    } else if record_value
        && record.is_some_and(|record| {
            crate::yaml_shape::declared_sequence_projection(
                record,
                program,
                &mut std::collections::BTreeSet::new(),
            )
        })
    {
        format!(
            "pub(super) fn sequence_group_present(value:&Stored)->bool{{value.0.body.is_some()||value.0.raw.is_some()}} pub(super) fn write_yaml_sequence_items<const ROOT:bool,const MARKED:bool>(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str,mark:&str)->core::Result<()>{{if value.0.raw.is_some(){{return Err(RuntimeDiagnostic::new(\"yaml.group-envelope\",\"Preserved record requires its XML envelope\"));}}let body=value.0.body.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"yaml.group-envelope\",\"Missing projected record\"))?;item_{id}::write_yaml_sequence_items::<ROOT,MARKED>(body,inputs,out,indent,mark)}}"
        )
    } else {
        String::new()
    };
    let record_input_adapter = if matches!(child.value, LinkedType::Record(_)) {
        "impl core::inputs::RecordInput for Stored{fn field(&self,index:usize)->Option<core::inputs::InputRef<'_>>{variant_input_field(self,index).ok()}}"
    } else {
        ""
    };
    let yaml_write = if lift_attributes {
        "write_yaml_indented(value,inputs,out,\"\")".to_owned()
    } else {
        format!("write_yaml_into_{id}(&value.0,inputs,out)")
    };
    let finalize = if shared_container
        && declared_items
        && sequence.is_some_and(|entry| attributes::content(&entry.xml).1.is_empty())
    {
        // An unwrapped collection does not own its parent's empty XML node.
        // With no occurrences it has nothing to preserve; parent ordering and
        // neighbouring fields belong to the enclosing record's finalizer.
        format!(
            "if value.0.rows.is_empty() && !value.0.nil && value.0.raw.is_none(){{Ok(write_yaml_{id}(&value.0,inputs)?)}}else{{finalize_yaml_{id}(source,write_yaml_{id}(&value.0,inputs)?,&value.0,inputs)}}"
        )
    } else if lift_attributes {
        format!(
            "if lift_absence(value){{let mut out=String::new();write_yaml(value,inputs,&mut out)?;Ok(out.into_bytes())}}else{{finalize_yaml_{id}(source,write_yaml_{id}(&value.0,inputs)?,&value.0,inputs)}}"
        )
    } else {
        format!("finalize_yaml_{id}(source,write_yaml_{id}(&value.0,inputs)?,&value.0,inputs)")
    };
    let expanded_yaml = if sequence.is_some_and(super::collections::borrowed_records) {
        format!(
            "pub(super) fn finalize_expanded(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{{let mut yaml=String::new();write_yaml_shortened_{id}(&value.0,inputs,false,&mut yaml)?;finalize_yaml_{id}(source,yaml.into_bytes(),&value.0,inputs)}} pub(super) fn write_yaml_expanded(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{{if value.0.raw.is_some(){{let mut encoded=String::new();write_yaml_shortened_{id}(&value.0,inputs,false,&mut encoded)?;core::yaml::append_properties(out,|out|{{core::yaml::Indented::new(out,indent).push_str(&encoded);Ok(())}})}}else{{prepare_yaml_into_{id}(&value.0,inputs,false,out,indent)}}}}"
        )
    } else {
        String::new()
    };
    let constructor = if sequence.is_some_and(super::collections::borrowed_records)
        || (deferred && super::record_construction::supported(&local, program))
        || (declared_items
            && sequence
                .is_some_and(|target| super::record_construction::supported(target, program)))
    {
        format!(
            "pub(super) fn construct(slots:&[Option<core::inputs::InputRef<'_>>],inputs:&InputView<'_>)->core::Result<Stored>{{construct_{id}(slots,inputs).map(|value|Stored(value,true))}}"
        )
    } else if record_value
        && record.is_some_and(|target| super::record_construction::supported(target, program))
    {
        let LinkedType::Record(fields) = &record.unwrap().value else {
            unreachable!()
        };
        let opaque_field = if fields.len() == 1
            && matches!(record.unwrap().yaml, YamlRepresentation::Projection { .. })
        {
            "Some(core::inputs::InputRef::Record(source))=>match source.field(0){Some(core::inputs::InputRef::PreservedXml(patch))=>Some((None,patch)),Some(core::inputs::InputRef::PreservedRecord{fields,xml})=>Some((Some(fields),xml)),_=>None},"
        } else {
            ""
        };
        let slots = (0..fields.len())
            .map(|index| format!("source.field({index})"))
            .collect::<Vec<_>>()
            .join(",");
        format!(
            "pub(super) fn construct(slots:&[Option<core::inputs::InputRef<'_>>],inputs:&InputView<'_>)->core::Result<Stored>{{let opaque=match slots.first().copied().flatten(){{Some(core::inputs::InputRef::PreservedXml(patch))=>Some((None,patch)),Some(core::inputs::InputRef::PreservedRecord{{fields,xml}})=>Some((Some(fields),xml)),{opaque_field}_=>None}};if let Some((fields,patch))=opaque{{let body=if let Some(source)=fields{{Some(item_{id}::construct(&[{slots}],inputs)?)}}else{{None}};return Ok(Stored(V{id}{{body,raw:Some(patch.clone()),nil:false}},true))}}let body=match slots.first().copied().flatten(){{None|Some(core::inputs::InputRef::MissingValue)=>None,Some(core::inputs::InputRef::Record(source))=>Some(item_{id}::construct(&[{slots}],inputs)?),_=>return Err(RuntimeDiagnostic::new(\"input.type\",\"Record construction requires a record input\"))}};Ok(Stored(V{id}{{body,raw:None,nil:false}},true))}}"
        )
    } else {
        String::new()
    };
    let empty_yaml = if deferred && matches!(local.yaml, YamlRepresentation::Projection(_)) {
        format!(
            "finish_yaml_{id}(YamlFields{id}::new(core::raw::Fields::default())?,b\"\",inputs).map(|value|Stored(value,true))"
        )
    } else if record_value
        && matches!(local.yaml, YamlRepresentation::Projection(_))
        && crate::plan::routes::record_usage(&local, program)?
            .is_some_and(|usage| usage.yaml_missing)
    {
        format!("RecordYamlRead{id}::new()?.finish(b\"\",inputs).map(|value|Stored(value,true))")
    } else {
        "read_yaml(b\"\",inputs,core::yaml::EmptyMappingSource)".into()
    };
    writeln!(out,r#"#[allow(dead_code)] mod part_{id}_{slot} {{ use super::*;
{code}
{checks}
{constructor}
{expanded_yaml}
{exclude_writer}
{lifted_helpers}
{sequence_items}
{contribute}
pub(super) struct Stored(V{id},bool);
{record_input_adapter}
pub(super) fn has_raw(value:&Stored)->bool{{{raw_test}}}
pub(super) fn semantic_present(value:&Stored)->bool{{let _=value;{semantic_present}}}
pub(super) fn input_field(value:&Stored,field:usize)->Option<core::inputs::InputRef<'_>>{{{input_accessor}}}
pub(super) fn choice_input(value:&Stored)->Option<core::inputs::InputRef<'_>>{{input_field(value,0)}}
pub(super) fn variant_input_field(value:&Stored,field:usize)->core::Result<core::inputs::InputRef<'_>>{{{variant_input_accessor}}}
pub(super) fn text_field(value:&Stored,field:usize)->core::Result<&str>{{{text_accessor}}}
{variant_text_adapter}
pub(super) fn render_text(value:&Stored,inputs:&InputView<'_>)->core::Result<String>{{{text_renderer}}}
pub(super) fn calendar_field(value:&Stored,field:usize)->core::Result<&core::calendar::Value>{{{calendar_accessor}}}
pub(super) fn field_is_null(value:&Stored,field:usize)->bool{{{null_accessor}}}
pub(super) fn field_has_annotation(value:&Stored,field:usize)->bool{{{annotation_accessor}}}
pub(super) fn field_present(value:&Stored,field:usize)->bool{{{field_presence}}}
pub(super) struct Prepared({prepared});
pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>,events:impl core::xml::ScopedSource)->core::Result<Stored> {{{xml_reader}(source,inputs,{xml_events}{xml_extra}).map(|value|Stored(value,true))}}
pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>,events:impl core::yaml::Source)->core::Result<Stored> {{let _=source;read_yaml_events_{id}({yaml_source}inputs,{yaml_extra}events).map(|value|Stored(value,true))}}
pub(super) fn read_xml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored> {{{fallback_xml}}}
pub(super) fn read_yaml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored> {{read_yaml_{id}(source,inputs).map(|value|Stored(value,true))}}
pub(super) fn read_yaml_empty_mapping(inputs:&InputView<'_>)->core::Result<Stored> {{{empty_yaml}}}
pub(super) fn project(source:&[u8])->core::Result<Vec<u8>> {{let _=source;{project}}}
pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>> {{{finalize}}}
pub(super) fn document(value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>> {{write_xml_{id}(&value.0,inputs)}}
pub(super) fn prepare(value:&Stored,inputs:&InputView<'_>)->core::Result<Prepared> {{prepare_xml_{id}(&value.0,inputs).map(Prepared)}}
pub(super) fn namespaces<'a>(value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>) {{namespaces_xml_{id}(&value.0,&prepared.0,names)}}
pub(super) fn write_xml<'a>(value:&Stored,prepared:&'a Prepared,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()> {{{xml_write}}}
pub(super) fn write_yaml(value:&Stored,inputs:&InputView<'_>,out:&mut String)->core::Result<()> {{{yaml_write}}}
pub(super) fn scalar_at(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool {{{scoped_scalar}}}
pub(super) fn scalar(value:&Stored,path:&[core::xml::Name])->bool {{xml_scalar_{id}(&value.0,path)}}
pub(super) fn qname_attribute(path:&[core::xml::Name],name:&core::xml::Name)->bool {{xml_qname_attribute_{id}(path,name)}}
pub(super) fn qname_text(path:&[core::xml::Name])->bool {{xml_qname_text_{id}(path)}}
pub(super) fn qname_text_at(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool {{xml_qname_text_at_{id}(&value.0,path,occurrences)}}
pub(super) fn qnames()->Vec<(&'static str,&'static str)> {{xml_qnames_{id}()}}
pub(super) fn verify_boundary(value:&Stored,before:&[u8],after:&[u8],inputs:&InputView<'_>)->core::Result<()> {{{verify_boundary}}}
pub(super) fn canonical_omissions(value:&Stored,inputs:&InputView<'_>,out:&mut Vec<&'static [(&'static str,&'static str)]>)->core::Result<()> {{let _=(value,inputs,&out);{canonical_omissions}Ok(())}}
{header_adapter}
{indented_adapter}
{state_adapter}
{yaml_adapter}
{fact_accessors}
{yaml_documents_adapter}
pub(super) fn infer_xml(value:&mut Stored,source:&[u8],inputs:&InputView<'_>)->core::Result<()> {{{infer}}}
pub(super) fn check_xml(value:&Stored,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic> {{check_xml_{id}(&value.0,source,inputs)}}
pub(super) fn check_yaml(value:&Stored,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic> {{check_yaml_{id}(&value.0,source,inputs)}}
}}
"#).unwrap();
    Ok(ValueEmission {
        source: out,
        xml_stateful: stateful_part,
        yaml_stateful: yaml_stateful_part,
        mechanism: if sequence.is_some() || declared_items {
            "owner-collection-part"
        } else if record_value || nested || composite {
            "owner-record-part"
        } else {
            "owner-scalar-part"
        },
        choice_variants: Vec::new(),
    })
}
