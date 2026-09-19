//! Adapt each value backend to the same parent-facing operation contract.
use super::*;
use std::fmt::Write;

pub(super) struct ValueEmission {
    pub source: String,
    pub xml_stateful: bool,
    pub yaml_stateful: bool,
}

pub(super) struct Placement {
    pub external: bool,
    pub shared_container: bool,
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
    let Placement {
        external,
        shared_container,
    } = placement;
    let (LinkedType::Record(fields), LinkedXml::Record(xml)) = (&child.value, &child.xml) else {
        unreachable!()
    };
    let mut out = String::new();
    let mapping = xml.first();
    let field = &fields[0];
    let sequence = composite::reference(&field.value)
        .and_then(|(target, _, _)| program.entries.iter().find(|entry| entry.id == target))
        .filter(|entry| matches!(entry.value, LinkedType::Sequence(_)));
    let mut local = child.clone();
    if let LinkedXml::Record(fields) = &mut local.xml {
        for field in fields {
            field.file = None;
        }
    }
    if mapping.is_none()
        && sequence.is_some()
        && super::declared_items::applies(&local, program)
        && let LinkedXml::Record(xml) = &mut local.xml
    {
        xml.push(LinkedXmlField {
            file: None,
            field: field.name.clone(),
            path: vec![ExpandedName {
                namespace: String::new(),
                local: "__declarative_virtual__".into(),
            }],
            attribute: None,
            source: field.source.clone(),
        });
    }
    let record_value = crate::plan::routes::record_usage(&local, program)?.is_some();
    let checks = constraints::generate(&local, program)?;
    let qname = super::qname::applies(child, program);
    let nested_layout = if record_value {
        None
    } else {
        super::nested_record::lower(child, program)?
    };
    let nested = nested_layout.is_some();
    let composite =
        !record_value && !qname && !nested && super::composite::record(child, program).is_some();
    let deferred = !record_value && !nested && !qname && !composite && sequence.is_none();
    let declared_items = super::declared_items::applies(&local, program);
    let code = if shared_container && declared_items {
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
    let yaml_extra = match sequence {
        Some(entry) if matches!(entry.yaml, YamlRepresentation::KeyedMapping { .. }) => "true,",
        Some(_) => "",
        None if record_value || qname || composite => "",
        None => "core::raw::Fields::default(),",
    };
    let xml_events = if qname || record_value || declared_items {
        "events"
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
            format!("core::xml::project_attributes(source,{route},&{names:?})")
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
    let verify_boundary = if external {
        format!("prove_xml_{id}(&value.0,before,after)")
    } else {
        format!("prove_xml_{id}(&value.0,&project(before)?,&project(after)?)")
    };
    let indented_adapter = if yaml_stateful_part {
        let raw = if record_value || sequence.is_some() {
            "value.0.raw.is_some()"
        } else {
            "!value.0.raw.is_empty()"
        };
        let plain = if sequence.is_some() && !declared_items {
            format!("prepare_yaml_into_{id}(&value.0,inputs,true,out,indent)")
        } else {
            format!(
                "core::yaml::append_properties(out,|out|write_yaml_indented_{id}(&value.0,inputs,out,indent,false))"
            )
        };
        format!(
            "pub(super) fn write_yaml_indented(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{{if {raw}{{let bytes=write_yaml_{id}(&value.0,inputs)?;core::yaml::append_properties(out,|out|{{core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));Ok(())}})}}else{{{plain}}}}}"
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
    let input_accessor = if declared_items {
        "if field==0 && value.0.present { Some(core::inputs::InputRef::Records(core::inputs::Records::new(&value.0.rows))) } else { None }".into()
    } else if !record_value && !nested && !qname && !composite && sequence.is_none() {
        format!("input_field_{id}(&value.0,field)")
    } else {
        "let _=(value,field);None".into()
    };
    let annotation_accessor =
        if !record_value && !nested && !qname && !composite && sequence.is_none() {
            "value.0.raw.has_annotation(field)"
        } else {
            "let _=(value,field);false"
        };
    let xml_write = if !names.is_empty() && xml.iter().any(|mapping| mapping.attribute.is_none()) {
        format!("write_xml_fields_into_{id}")
    } else {
        format!("write_xml_into_{id}")
    };
    let scoped_scalar = if record_value || declared_items {
        format!("xml_scalar_at_{id}(&value.0,path,occurrences)")
    } else {
        format!("let _=occurrences;xml_scalar_{id}(&value.0,path)")
    };
    let fact_accessors = super::facts::owner_accessors(entry, child, program)?;
    let header_slot = xml
        .iter()
        .position(|mapping| mapping.attribute.is_some())
        .unwrap_or(0);
    let header_adapter = if names.is_empty() {
        String::new()
    } else {
        format!(
            "pub(super) fn header(value:&Stored,out:&mut core::xml::Writer<'_>,declared:&[core::xml::WriteAttribute<'_>])->core::Result<()> {{header_xml_{id}_{header_slot}(&value.0,out,declared)}}\n"
        )
    };
    writeln!(out,r#"#[allow(dead_code)] mod part_{id}_{slot} {{ use super::*;
{code}
{checks}
{exclude_writer}
pub(super) struct Stored(V{id},bool);
pub(super) fn input_field(value:&Stored,field:usize)->Option<core::inputs::InputRef<'_>>{{{input_accessor}}}
pub(super) fn text_field(value:&Stored,field:usize)->core::Result<&str>{{{text_accessor}}}
pub(super) fn field_has_annotation(value:&Stored,field:usize)->bool{{{annotation_accessor}}}
pub(super) struct Prepared({prepared});
pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>,events:impl core::xml::ScopedSource)->core::Result<Stored> {{read_xml_events_{id}(source,inputs,{xml_events}{xml_extra}).map(|value|Stored(value,true))}}
pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>,events:impl core::yaml::Source)->core::Result<Stored> {{let _=source;read_yaml_events_{id}({yaml_source}inputs,{yaml_extra}events).map(|value|Stored(value,true))}}
pub(super) fn read_xml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored> {{{fallback_xml}}}
pub(super) fn read_yaml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored> {{read_yaml_{id}(source,inputs).map(|value|Stored(value,true))}}
pub(super) fn project(source:&[u8])->core::Result<Vec<u8>> {{{project}}}
pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>> {{finalize_yaml_{id}(source,write_yaml_{id}(&value.0,inputs)?,&value.0,inputs)}}
pub(super) fn document(value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>> {{write_xml_{id}(&value.0,inputs)}}
pub(super) fn prepare(value:&Stored,inputs:&InputView<'_>)->core::Result<Prepared> {{prepare_xml_{id}(&value.0,inputs).map(Prepared)}}
pub(super) fn namespaces<'a>(value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>) {{namespaces_xml_{id}(&value.0,&prepared.0,names)}}
pub(super) fn write_xml<'a>(value:&Stored,prepared:&'a Prepared,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()> {{{xml_write}(&value.0,&prepared.0,inputs,out)}}
pub(super) fn write_yaml(value:&Stored,inputs:&InputView<'_>,out:&mut String)->core::Result<()> {{write_yaml_into_{id}(&value.0,inputs,out)}}
pub(super) fn scalar_at(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool {{{scoped_scalar}}}
pub(super) fn scalar(value:&Stored,path:&[core::xml::Name])->bool {{xml_scalar_{id}(&value.0,path)}}
pub(super) fn qname_attribute(path:&[core::xml::Name],name:&core::xml::Name)->bool {{xml_qname_attribute_{id}(path,name)}}
pub(super) fn qname_text(path:&[core::xml::Name])->bool {{xml_qname_text_{id}(path)}}
pub(super) fn qnames()->Vec<(&'static str,&'static str)> {{xml_qnames_{id}()}}
pub(super) fn verify_boundary(value:&Stored,before:&[u8],after:&[u8])->core::Result<()> {{{verify_boundary}}}
{header_adapter}
{indented_adapter}
{state_adapter}
{yaml_adapter}
{fact_accessors}
pub(super) fn infer_xml(value:&mut Stored,source:&[u8],inputs:&InputView<'_>)->core::Result<()> {{{infer}}}
pub(super) fn check_xml(value:&Stored,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic> {{check_xml_{id}(&value.0,source,inputs)}}
pub(super) fn check_yaml(value:&Stored,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic> {{check_yaml_{id}(&value.0,source,inputs)}}
}}
"#).unwrap();
    Ok(ValueEmission {
        source: out,
        xml_stateful: stateful_part,
        yaml_stateful: yaml_stateful_part,
    })
}
