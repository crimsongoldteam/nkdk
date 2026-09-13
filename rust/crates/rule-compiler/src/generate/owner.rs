//! Compose independently generated property decoders from their declared routes.
use super::*;
use std::fmt::Write;

pub(super) fn applies(entry: &LinkedEntry, program: &Program) -> bool {
    matches!(super::attributes::content(&entry.xml).0, LinkedXml::Record(fields) if fields.iter().any(|field|field.file.is_some()))
        || matches!(&entry.value, LinkedType::Record(fields) if fields.len()>1 && fields.iter().any(|field| {
            composite::reference(&field.value).and_then(|(id,_,_)|program.entries.iter().find(|entry|entry.id==id)).is_some_and(|common| {
                let (xml,_)=attributes::content(&common.xml);
                match common.value {
                    LinkedType::Record(_)=>!matches!(xml,LinkedXml::TextPattern(_)),
                    LinkedType::Sequence(_)=>!matches!(xml,LinkedXml::TextSequence{..}),
                    _=>false,
                }
            })
        }))
}

pub(super) fn generate(entry: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
    let mut shape = entry.clone();
    shape.presence.clear();
    plain_shape(&shape)?;
    let parts = super::owner_layout::parts(entry, program)?;
    let files: Vec<_> = parts
        .iter()
        .map(|part| {
            let LinkedXml::Record(fields) = &part.xml else {
                unreachable!()
            };
            fields[0].file.clone()
        })
        .collect();
    let primary = files
        .iter()
        .position(Option::is_none)
        .ok_or_else(|| unsupported(entry, "An owner requires a primary XML document"))?;
    let mut document_paths = BTreeSet::new();
    if files
        .iter()
        .flatten()
        .any(|path| !document_paths.insert(path))
    {
        return Err(unsupported(
            entry,
            "External XML document paths must be unique",
        ));
    }
    let source_for = |slot: usize, primary: &str| {
        files[slot].as_ref().map_or_else(
            || primary.to_owned(),
            |path| format!("inputs.document(&{path:?})"),
        )
    };
    let root_attributes: Vec<_> = super::attributes::content(&entry.xml)
        .1
        .into_iter()
        .cloned()
        .collect();
    if root_attributes
        .iter()
        .any(|attribute| attribute.when.is_some())
    {
        return Err(unsupported(
            entry,
            "Conditional owner attributes require combined owner storage",
        ));
    }
    let root_attributes_code = super::attributes::static_attributes(&root_attributes);
    let LinkedXml::Record(first_xml) = &parts[primary].xml else {
        unreachable!()
    };
    let root = &first_xml[0].path[..1];
    let root_code = record::path_code(root);

    let id = entry.id;
    let mut out = String::new();
    let mut paths = Vec::new();
    let mut routes: Vec<Vec<&[ExpandedName]>> = Vec::new();
    let mut element_routes: Vec<Vec<&[ExpandedName]>> = Vec::new();
    let mut keys = Vec::new();
    let mut aliases = Vec::new();
    let mut attributes = Vec::new();
    let mut stateful = files.iter().all(Option::is_none);
    let mut yaml_stateful = stateful;
    for (slot, child) in parts.iter().enumerate() {
        let (LinkedType::Record(fields), LinkedXml::Record(xml), YamlRepresentation::Mapping(yaml)) =
            (&child.value, &child.xml, &child.yaml)
        else {
            unreachable!()
        };
        let mapping = &xml[0];
        let field = &fields[0];
        let sequence = composite::reference(&field.value)
            .and_then(|(target, _, _)| program.entries.iter().find(|entry| entry.id == target))
            .filter(|entry| matches!(entry.value, LinkedType::Sequence(_)));
        let names: Vec<_> = xml
            .iter()
            .filter_map(|mapping| mapping.attribute.as_ref())
            .map(|name| (name.namespace.as_str(), name.local.as_str()))
            .collect();
        let mut local = child.clone();
        if let LinkedXml::Record(fields) = &mut local.xml {
            for field in fields {
                field.file = None;
            }
        }
        let code = record::generate(&local, program)?;
        let checks = constraints::generate(&local, program)?;
        let qname = super::qname::applies(child, program);
        let nested_layout = super::nested_record::lower(child, program)?;
        let nested = nested_layout.is_some();
        let composite = !qname && !nested && super::composite::record(child, program).is_some();
        let stateful_part = !qname
            && !composite
            && sequence
                .is_none_or(|entry| !matches!(entry.yaml, YamlRepresentation::TextSequence { .. }));
        stateful &= stateful_part;
        let yaml_stateful_part = stateful_part;
        yaml_stateful &= yaml_stateful_part;
        let state_adapter = if stateful_part {
            let state = if sequence.is_some() {
                format!("XmlCollection{id}")
            } else {
                format!("XmlRead{id}")
            };
            let consume = if sequence.is_some() {
                "self.0.consume(path,token,_source,_inputs)"
            } else {
                "self.0.consume(path,token)"
            };
            let finish = if sequence.is_some() {
                format!("finish_xml_{id}(self.0,_inputs)")
            } else {
                format!("finish_xml_{id}(self.0,_source,_inputs)")
            };
            format!(
                "pub(super) struct XmlReader({state});impl XmlReader{{pub(super) fn new()->Self{{Self({state}::new())}}pub(super) fn consume(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{{{consume}}}pub(super) fn finish(self,_source:&[u8],_inputs:&InputView<'_>)->core::Result<Stored>{{{finish}.map(|value|Stored(value,true))}}}}"
            )
        } else {
            String::new()
        };
        let yaml_adapter = if !yaml_stateful_part {
            String::new()
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
        let declared_items = super::declared_items::applies(&local, program);
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
            None if qname || composite => "",
            None => "core::raw::Fields::default(),",
        };
        let xml_events = if qname {
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
        let route = record::path_code(&mapping.path);
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
        let project = if !names.is_empty() && xml.iter().any(|mapping| mapping.attribute.is_none())
        {
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
        };
        let project = if files[slot].is_some() {
            "Ok(source.to_vec())".to_owned()
        } else {
            project
        };
        let verify_boundary = if files[slot].is_some() {
            format!("prove_xml_{id}(&value.0,before,after)")
        } else {
            format!("prove_xml_{id}(&value.0,&project(before)?,&project(after)?)")
        };
        let indented_adapter = if yaml_stateful_part {
            let raw = if sequence.is_some() {
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
        let exclude_writer = if !nested && !qname && !composite && sequence.is_none() {
            format!(
                "pub(super) fn write_yaml_except(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str,excluded:usize)->core::Result<()>{{if value.0.raw.is_empty(){{core::yaml::append_properties(out,|out|write_yaml_except_{id}(&value.0,inputs,out,indent,false,Some(excluded)))}}else{{let bytes=write_yaml_preserved_except_{id}(&value.0,inputs,false,Some(excluded))?;core::yaml::append_properties(out,|out|{{core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));Ok(())}})}}}}"
            )
        } else {
            String::new()
        };
        let text_accessor = if !nested && !qname && !composite && sequence.is_none() {
            format!("text_field_{id}(&value.0,field)")
        } else {
            "let _=(value,field);Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Expected a scalar field\"))".into()
        };
        let annotation_accessor = if !nested && !qname && !composite && sequence.is_none() {
            "value.0.raw.has_annotation(field)"
        } else {
            "let _=(value,field);false"
        };
        let xml_write =
            if !names.is_empty() && xml.iter().any(|mapping| mapping.attribute.is_none()) {
                format!("write_xml_fields_into_{id}")
            } else {
                format!("write_xml_into_{id}")
            };
        let scoped_scalar = if declared_items {
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
pub(super) fn check_xml(value:&Stored,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic> {{check_xml_{id}(&value.0,source,inputs)}}
pub(super) fn check_yaml(value:&Stored,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic> {{check_yaml_{id}(&value.0,source,inputs)}}
}}
"#).unwrap();
        paths.push(
            xml.iter()
                .find(|mapping| mapping.attribute.is_some())
                .unwrap_or(mapping)
                .path
                .as_slice(),
        );
        routes.push(xml.iter().map(|mapping| mapping.path.as_slice()).collect());
        element_routes.push(
            xml.iter()
                .filter(|mapping| mapping.attribute.is_none())
                .map(|mapping| mapping.path.as_slice())
                .collect(),
        );
        keys.push(
            yaml.iter()
                .map(|property| property.key.as_str())
                .collect::<Vec<_>>(),
        );
        aliases.push(
            yaml.iter()
                .map(|property| property.key.as_str())
                .chain(xml.iter().map(|mapping| {
                    mapping
                        .attribute
                        .as_ref()
                        .unwrap_or_else(|| mapping.path.last().unwrap())
                        .local
                        .as_str()
                }))
                .collect::<Vec<_>>(),
        );
        attributes.push(names);
    }
    for left in 0..paths.len() {
        for right in left + 1..paths.len() {
            if files[left].is_some() || files[right].is_some() {
                continue;
            }
            if (attributes[left].is_empty()
                && attributes[right].is_empty()
                && routes[left].iter().any(|left| {
                    routes[right]
                        .iter()
                        .any(|right| left.starts_with(right) || right.starts_with(left))
                }))
                || paths[left][0] != paths[right][0]
            {
                return Err(unsupported(
                    entry,
                    "Composed property boundaries must be disjoint within one XML root",
                ));
            }
        }
    }
    let count = if entry
        .contributions
        .iter()
        .any(|value| value.for_each.is_some())
    {
        parts.len()
    } else {
        0
    };
    let mut count_events = String::new();
    let LinkedType::Record(owner_fields) = &entry.value else {
        unreachable!()
    };
    let mut counted = BTreeSet::new();
    for contribution in &entry.contributions {
        let Some(iteration) = &contribution.for_each else {
            continue;
        };
        let LinkedExpressionKind::Field(field) = iteration.input.kind else {
            return Err(unsupported(
                entry,
                "Owner contribution must iterate a field",
            ));
        };
        let slot=parts.iter().position(|part|matches!(&part.value,LinkedType::Record(fields) if fields.iter().any(|candidate|candidate.name==owner_fields[field as usize].name))).unwrap();
        if counted.insert(slot) {
            let parent = &paths[slot][..paths[slot].len().saturating_sub(1).max(1)];
            writeln!(count_events,"if matches!(token,core::xml::Token::Start(_)) && core::xml::matches(path,{}) {{containers[{slot}]=containers[{slot}].saturating_add(1);}}",record::path_code(parent)).unwrap();
        }
    }
    writeln!(out,"fn owner_containers_{id}(source:&[u8])->core::Result<[u8;{count}]> {{#[allow(unused_mut)] let mut containers=[0u8;{count}];core::xml::visit(source,|path,token|{{let _=(path,&token);{count_events}Ok(())}})?;Ok(containers)}}").unwrap();
    writeln!(
        out,
        "struct V{id} {{ root:Option<core::xml::Patch>,#[allow(dead_code)] containers:[u8;{count}],"
    )
    .unwrap();
    for slot in 0..parts.len() {
        writeln!(out, "p{slot}:part_{id}_{slot}::Stored,").unwrap();
    }
    out.push_str("}\n");
    let mut xml_routing = String::new();
    writeln!(xml_routing,"#[derive(Default)] struct OwnerRouting{id}{{active:Option<usize>,active_depth:usize}} impl OwnerRouting{id}{{fn consume<S:Copy>(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:S,containers:&mut [u8;{count}],mut consume:impl FnMut(usize,&[core::xml::Name],&core::xml::Token<'_>,S)->core::Result<()>)->core::Result<()>{{let _=&containers;{count_events}if let Some(slot)=self.active {{let result=match slot{{").unwrap();
    for slot in
        (0..parts.len()).filter(|slot| files[*slot].is_none() && !element_routes[*slot].is_empty())
    {
        writeln!(xml_routing, "{slot}=>consume({slot},path,token,scope),").unwrap();
    }
    xml_routing.push_str("_=>unreachable!(\"declared XML route\")};if matches!(token,core::xml::Token::End)&&path.len()==self.active_depth{self.active=None;}return result;}\n");
    for slot in
        (0..parts.len()).filter(|slot| files[*slot].is_none() && !element_routes[*slot].is_empty())
    {
        let selected = element_routes[slot]
            .iter()
            .map(|path| format!("core::xml::matches(path,{})", record::path_code(path)))
            .collect::<Vec<_>>()
            .join(" || ");
        writeln!(xml_routing,"if matches!(token,core::xml::Token::Start(_)) && ({selected}) {{self.active=Some({slot});self.active_depth=path.len();return consume({slot},path,token,scope);}}").unwrap();
    }
    xml_routing.push_str("let mut routed=false;\n");
    for attribute in &root_attributes {
        writeln!(xml_routing,"if core::xml::matches(path,{root_code}) && let core::xml::Token::Attribute(attribute)=token && {} {{return Ok(());}}",super::attributes::name_matches(&attribute.name,"attribute.name")).unwrap();
    }
    for (slot, route) in routes.iter().enumerate() {
        if files[slot].is_some() {
            continue;
        }
        let _ = route;
        let LinkedXml::Record(mappings) = &parts[slot].xml else {
            unreachable!()
        };
        let selected=mappings.iter().map(|mapping|{
            let route=record::path_code(&mapping.path);
            let filter=if let Some(name)=&mapping.attribute {format!("path.len()<=declared.len() && match token{{core::xml::Token::Attribute(attribute)=>path.len()==declared.len() && {},_=>true}}",attributes::name_matches(name,"attribute.name"))}
                else{"!matches!(token,core::xml::Token::Attribute(_)) || path.len()>=declared.len()".into()};
            format!("{{let declared={route};let length=path.len().min(declared.len());core::xml::matches(&path[..length],&declared[..length]) && ({filter})}}")
        }).collect::<Vec<_>>().join(" || ");
        writeln!(
            xml_routing,
            "let selected={selected};if selected {{consume({slot},path,token,scope)?;routed=true;}}"
        )
        .unwrap();
    }
    xml_routing.push_str("if routed {Ok(())} else {Err(RuntimeDiagnostic::new(\"xml.unknown-field\",\"Undeclared owner property\"))}}}\n");
    out.push_str(&xml_routing);
    for side in ["xml", "yaml"] {
        let (event_trait, document) = if side == "xml" {
            ("ScopedSource", "source")
        } else {
            ("Source", "if source.is_empty(){b\"{}\"}else{source}")
        };
        writeln!(out,"fn read_{side}_shared_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{read_{side}_shared_events_{id}(source,inputs,core::{side}::DocumentSource({document}))}}\nfn read_{side}_shared_events_{id}(source:&[u8],inputs:&InputView<'_>,events:impl core::{side}::{event_trait})->core::Result<V{id}> {{").unwrap();
        if side == "xml" && stateful {
            writeln!(out,"let mut state=OwnerXmlRead{id}::new();events.visit_scoped(|path,token,scope|state.consume(path,token,scope,source,inputs))?;state.finish(source,inputs)}}").unwrap();
        } else if side == "yaml" && yaml_stateful {
            writeln!(out,"let mut state=OwnerYamlRead{id}::new()?;events.visit(|node,position|state.consume(node,position,source,inputs))?;state.finish(source,inputs)}}").unwrap();
        } else {
            let initial = if side == "xml" { 0 } else { 1 };
            writeln!(
                out,
                "#[allow(unused_mut)] let mut containers=[{initial}u8;{count}];"
            )
            .unwrap();
            let first = if side == "xml" { primary } else { 0 };
            for (slot, file) in files.iter().enumerate().filter(|(slot, _)| *slot != first) {
                if side == "xml" && file.is_some() {
                    writeln!(
                        out,
                        "let p{slot}=part_{id}_{slot}::read_xml_document({},inputs)?;",
                        source_for(slot, "source")
                    )
                    .unwrap();
                } else {
                    writeln!(out, "let mut p{slot}=None;").unwrap();
                }
            }
            let active: Vec<_> = (0..parts.len())
                .filter(|slot| side == "yaml" || files[*slot].is_none())
                .collect();
            for &slot in &active {
                let assign = if slot == first {
                    format!("let p{slot}=")
                } else {
                    format!("p{slot}=Some(")
                };
                let (events, consumer) = if side == "xml" {
                    ("ScopedEvents", "ScopedConsumer")
                } else {
                    ("Events", "Consumer")
                };
                writeln!(out,"{assign}part_{id}_{slot}::read_{side}(source,inputs,core::{side}::{events}(|c{slot}:&mut core::{side}::{consumer}<'_>| {{").unwrap();
            }
            if side == "xml" {
                out.push_str(&format!("let mut routing=OwnerRouting{id}::default();events.visit_scoped(|path,token,scope|routing.consume(path,token,scope,&mut containers,|slot,path,token,scope|match slot{{\n"));
                for slot in (0..parts.len()).filter(|slot| files[*slot].is_none()) {
                    writeln!(out, "{slot}=>c{slot}(path,token,scope),").unwrap();
                }
                out.push_str("_=>unreachable!(\"declared XML route\")}))\n");
            } else {
                out.push_str("core::yaml::visit_partitions(events,|key|match key {\n");
                for (slot, keys) in keys.iter().enumerate() {
                    for key in keys {
                        writeln!(out, "{key:?}=>Some({slot}),").unwrap();
                    }
                }
                out.push_str("_=>None},|slot,node,position|{match slot{\n");
                for slot in 0..parts.len() {
                    writeln!(out, "Some({slot})=>c{slot}(node,position),").unwrap();
                }
                out.push_str("None=>{match node{core::yaml::Node::MappingStart(None)=>{\n");
                for slot in 0..parts.len() {
                    writeln!(
                        out,
                        "c{slot}(core::yaml::Node::MappingStart(None),position)?;"
                    )
                    .unwrap();
                }
                out.push_str("},core::yaml::Node::MappingEnd=>{\n");
                for slot in 0..parts.len() {
                    writeln!(out, "c{slot}(core::yaml::Node::MappingEnd,position)?;").unwrap();
                }
                out.push_str("},_=>unreachable!(\"mapping boundary\")}Ok(())},_=>unreachable!(\"declared partition\")}})\n");
            }
            for &slot in active.iter().rev() {
                if slot == first {
                    out.push_str("}))?;\n");
                } else {
                    out.push_str("}))?);Ok(())\n");
                }
            }
            out.push_str("Ok(V");
            write!(out, "{id}{{root:None,containers,").unwrap();
            for (slot, file) in files.iter().enumerate() {
                if slot == first || (side == "xml" && file.is_some()) {
                    write!(out, "p{slot},").unwrap();
                    continue;
                }
                write!(
                    out,
                    "p{slot}:p{slot}.expect(\"composed reader completed\"),"
                )
                .unwrap();
            }
            out.push_str("})}\n");
        }
        writeln!(out,"fn check_{side}_{id}(value:&V{id},source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{let mut result=Vec::new();").unwrap();
        for slot in 0..parts.len() {
            let source = if side == "xml" {
                source_for(slot, "source")
            } else {
                "source".into()
            };
            writeln!(
                out,
                "result.extend(part_{id}_{slot}::check_{side}(&value.p{slot},{source},inputs));"
            )
            .unwrap();
        }
        if side == "yaml" {
            writeln!(out,"if value.root.is_some() && let Err(error)=write_xml_{id}(value,inputs) {{result.push(error);}}").unwrap();
        }
        out.push_str("result}\n");
    }
    if stateful {
        writeln!(
            out,
            "struct OwnerXmlRead{id}{{routing:OwnerRouting{id},containers:[u8;{count}],"
        )
        .unwrap();
        for slot in 0..parts.len() {
            writeln!(out, "p{slot}:part_{id}_{slot}::XmlReader,").unwrap();
        }
        writeln!(out,"}}impl OwnerXmlRead{id}{{fn new()->Self{{Self{{routing:OwnerRouting{id}::default(),containers:[0;{count}],").unwrap();
        for slot in 0..parts.len() {
            writeln!(out, "p{slot}:part_{id}_{slot}::XmlReader::new(),").unwrap();
        }
        out.push_str("}}\n");
        writeln!(out,"fn consume<S:Copy>(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:S,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{let Self{{routing,containers,").unwrap();
        for slot in 0..parts.len() {
            write!(out, "p{slot},").unwrap();
        }
        out.push_str("}=self;routing.consume(path,token,scope,containers,|slot,path,token,_scope|match slot{\n");
        for slot in 0..parts.len() {
            writeln!(out, "{slot}=>p{slot}.consume(path,token,source,inputs),").unwrap();
        }
        out.push_str("_=>unreachable!(\"declared XML route\")})}\n");
        writeln!(out,"fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{Ok(V{id}{{root:None,containers:self.containers,").unwrap();
        for slot in 0..parts.len() {
            writeln!(out, "p{slot}:self.p{slot}.finish(source,inputs)?,").unwrap();
        }
        out.push_str("})}}\n");
    }
    if yaml_stateful {
        writeln!(
            out,
            "struct OwnerYamlRead{id}{{routing:core::yaml::PartitionRouter,"
        )
        .unwrap();
        for slot in 0..parts.len() {
            writeln!(out, "p{slot}:part_{id}_{slot}::YamlReader,").unwrap();
        }
        writeln!(out,"}}impl OwnerYamlRead{id}{{fn new()->core::Result<Self>{{Ok(Self{{routing:core::yaml::PartitionRouter::default(),").unwrap();
        for slot in 0..parts.len() {
            writeln!(out, "p{slot}:part_{id}_{slot}::YamlReader::new()?,").unwrap();
        }
        out.push_str("})}\n");
        writeln!(out,"fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{let slot=self.routing.route(&node,|key|match key{{").unwrap();
        for (slot, keys) in keys.iter().enumerate() {
            for key in keys {
                writeln!(out, "{key:?}=>Some({slot}),").unwrap();
            }
        }
        out.push_str("_=>None})?;match slot{\n");
        for slot in 0..parts.len() {
            writeln!(
                out,
                "Some({slot})=>self.p{slot}.consume(node,position,source,inputs),"
            )
            .unwrap();
        }
        out.push_str("None=>{match node{core::yaml::Node::MappingStart(None)=>{\n");
        for slot in 0..parts.len() {
            writeln!(out,"self.p{slot}.consume(core::yaml::Node::MappingStart(None),position,source,inputs)?;").unwrap();
        }
        out.push_str("},core::yaml::Node::MappingEnd=>{\n");
        for slot in 0..parts.len() {
            writeln!(
                out,
                "self.p{slot}.consume(core::yaml::Node::MappingEnd,position,source,inputs)?;"
            )
            .unwrap();
        }
        out.push_str("},_=>unreachable!(\"mapping boundary\")}Ok(())},_=>unreachable!(\"declared YAML route\")}}\n");
        writeln!(out,"fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{self.routing.finish()?;Ok(V{id}{{root:None,containers:[1;{count}],").unwrap();
        for slot in 0..parts.len() {
            writeln!(out, "p{slot}:self.p{slot}.finish(source,inputs)?,").unwrap();
        }
        out.push_str("})}}\n");
    }
    writeln!(out, "struct OwnerPrepared{id} {{").unwrap();
    for slot in (0..parts.len()).filter(|slot| files[*slot].is_none()) {
        writeln!(out, "p{slot}:part_{id}_{slot}::Prepared,").unwrap();
    }
    writeln!(out, "}}\nfn prepare_xml_plain_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<OwnerPrepared{id}> {{Ok(OwnerPrepared{id} {{").unwrap();
    for slot in (0..parts.len()).filter(|slot| files[*slot].is_none()) {
        writeln!(
            out,
            "p{slot}:part_{id}_{slot}::prepare(&value.p{slot},inputs)?,"
        )
        .unwrap();
    }
    writeln!(out,"}})}}\nfn namespaces_xml_plain_{id}<'a>(value:&'a V{id},prepared:&'a OwnerPrepared{id},names:&mut Vec<&'a str>) {{").unwrap();
    for slot in (0..parts.len()).filter(|slot| files[*slot].is_none()) {
        writeln!(
            out,
            "part_{id}_{slot}::namespaces(&value.p{slot},&prepared.p{slot},names);"
        )
        .unwrap();
    }
    for attribute in &root_attributes {
        let mut names = vec![attribute.name.namespace.as_str()];
        if let LinkedXmlAttributeValue::QName(value) = &attribute.value {
            names.push(&value.namespace);
        }
        for name in names.into_iter().filter(|name| !name.is_empty()) {
            writeln!(
                out,
                "if !names.contains(&{name:?}) {{names.push({name:?});}}"
            )
            .unwrap();
        }
    }
    writeln!(out,"}}\nfn write_xml_plain_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{let prepared=prepare_xml_plain_{id}(value,inputs)?;let mut names=Vec::new();namespaces_xml_plain_{id}(value,&prepared,&mut names);let mut out=core::xml::Writer::new(&names);write_xml_plain_into_{id}(value,&prepared,inputs,&mut out)?;Ok(out.finish())}}\nfn write_xml_plain_into_{id}<'a>(value:&V{id},prepared:&'a OwnerPrepared{id},inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()> {{").unwrap();
    let mut headers: Vec<_> = (0..parts.len())
        .filter(|slot| files[*slot].is_none() && !attributes[*slot].is_empty())
        .collect();
    headers.sort_by_key(|slot| paths[*slot].len());
    if headers
        .windows(2)
        .any(|pair| !paths[pair[1]].starts_with(paths[pair[0]]))
        || headers.last().is_some_and(|header| {
            (0..parts.len())
                .filter(|slot| files[*slot].is_none() && !element_routes[*slot].is_empty())
                .any(|slot| {
                    element_routes[slot].iter().any(|path| {
                        !path.starts_with(paths[*header]) || path.len() <= paths[*header].len()
                    })
                })
        })
    {
        return Err(unsupported(
            entry,
            "Owner attribute containers require one ancestor chain above its properties",
        ));
    }

    if !root_attributes.is_empty() && !headers.iter().any(|slot| paths[*slot] == root) {
        writeln!(
            out,
            "out.container_with_attributes({root_code},{root_attributes_code});"
        )
        .unwrap();
    }
    for slot in headers {
        let declared = if paths[slot] == root {
            root_attributes_code.as_str()
        } else {
            "&[]"
        };
        writeln!(out,"{{let declared:&[core::xml::WriteAttribute<'_>]={declared};part_{id}_{slot}::header(&value.p{slot},out,declared)?;}}").unwrap();
    }
    for slot in
        (0..parts.len()).filter(|slot| files[*slot].is_none() && !element_routes[*slot].is_empty())
    {
        writeln!(
            out,
            "part_{id}_{slot}::write_xml(&value.p{slot},&prepared.p{slot},inputs,out)?;"
        )
        .unwrap();
    }
    out.push_str("Ok(())}\n");
    writeln!(out,"fn write_yaml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{let mut out=String::new();").unwrap();
    for slot in 0..parts.len() {
        writeln!(
            out,
            "part_{id}_{slot}::write_yaml(&value.p{slot},inputs,&mut out)?;"
        )
        .unwrap();
    }
    out.push_str("let bytes=out.into_bytes();if let Some(patch)=&value.root {core::raw::Document::encode(&bytes,patch.to_yaml().as_bytes())}else{Ok(bytes)}}\n");
    if yaml_stateful {
        writeln!(out,"#[allow(dead_code)] fn write_yaml_indented_{id}(value:&V{id},inputs:&InputView<'_>,out:&mut String,indent:&str,_lift:bool)->core::Result<()>{{if value.root.is_some(){{let bytes=write_yaml_{id}(value,inputs)?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));return Ok(());}}").unwrap();
        for slot in 0..parts.len() {
            writeln!(
                out,
                "part_{id}_{slot}::write_yaml_indented(&value.p{slot},inputs,out,indent)?;"
            )
            .unwrap();
        }
        out.push_str("Ok(())}\n");
    }
    let scalar = (0..parts.len())
        .filter(|slot| files[*slot].is_none())
        .map(|slot| format!("part_{id}_{slot}::scalar(&value.p{slot},path)"))
        .collect::<Vec<_>>()
        .join(" || ");
    let mut attribute = (0..parts.len())
        .filter(|slot| files[*slot].is_none())
        .map(|slot| format!("part_{id}_{slot}::qname_attribute(path,name)"))
        .collect::<Vec<_>>()
        .join(" || ");
    for attr in &root_attributes {
        if matches!(attr.value, LinkedXmlAttributeValue::QName(_)) {
            write!(attribute," || (core::xml::matches(path,{root_code}) && name.namespace=={:?} && name.local=={:?})",attr.name.namespace,attr.name.local).unwrap();
        }
    }
    let qname = (0..parts.len())
        .filter(|slot| files[*slot].is_none())
        .map(|slot| format!("part_{id}_{slot}::qname_text(path)"))
        .collect::<Vec<_>>()
        .join(" || ");
    let scoped_scalar = (0..parts.len())
        .filter(|slot| files[*slot].is_none())
        .map(|slot| format!("part_{id}_{slot}::scalar_at(&value.p{slot},path,occurrences)"))
        .collect::<Vec<_>>()
        .join(" || ");
    writeln!(out,"#[allow(dead_code)] fn xml_scalar_at_{id}(value:&V{id},path:&[core::xml::Name],occurrences:&[usize])->bool {{{scoped_scalar}}}").unwrap();
    out.push_str(&super::proof::generate_scoped(
        id,
        &scalar,
        &attribute,
        &qname,
        parts
            .iter()
            .any(|part| super::declared_items::applies(part, program)),
    ));
    let mut qname_names = String::from("let mut names=Vec::new();");
    for slot in (0..parts.len()).filter(|slot| files[*slot].is_none()) {
        write!(qname_names, "names.extend(part_{id}_{slot}::qnames());").unwrap();
    }
    for attribute in &root_attributes {
        if matches!(attribute.value, LinkedXmlAttributeValue::QName(_)) {
            write!(
                qname_names,
                "names.push(({:?},{:?}));",
                attribute.name.namespace, attribute.name.local
            )
            .unwrap();
        }
    }
    qname_names.push_str("names.sort_unstable();names.dedup();names");
    out.push_str(&super::proof::qnames(id, &qname_names));
    let groups = aliases
        .iter()
        .map(|keys| format!("&{keys:?}"))
        .collect::<Vec<_>>()
        .join(",");
    for side in ["xml", "yaml"] {
        writeln!(out,"fn read_{side}_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{match read_{side}_shared_{id}(source,inputs) {{Ok(value)=>Ok(value),Err(error)=>{{if !error.code.as_deref().is_some_and(|code|code.starts_with(\"xml.\")||code.starts_with(\"yaml.\")||code.starts_with(\"value.\")) {{return Err(error);}}").unwrap();
        if side == "yaml" {
            writeln!(out,"if let Some(envelope)=core::raw::Document::decode(source)? {{let mut value=read_yaml_{id}(&envelope.meaning,inputs)?;let patch=core::xml::Patch::read(&envelope.payload,&[],&xml_qnames_{id}())?;if patch.is_null() {{return Err(RuntimeDiagnostic::new(\"xml.owner-root\",\"The document root cannot be removed\"));}}value.root=Some(patch);return Ok(value);}}").unwrap();
        }
        if side == "yaml" {
            writeln!(
                out,
                "let pieces=core::yaml::split_properties(source,&[{groups}])?;"
            )
            .unwrap();
        }
        for slot in 0..parts.len() {
            if side == "xml" {
                let source = source_for(slot, "source");
                writeln!(out,"let piece=part_{id}_{slot}::project({source})?;let p{slot}=part_{id}_{slot}::read_xml_document(&piece,inputs)?;").unwrap();
            } else {
                writeln!(
                    out,
                    "let p{slot}=part_{id}_{slot}::read_yaml_document(&pieces[{slot}],inputs)?;"
                )
                .unwrap();
            }
        }
        if side == "xml" {
            writeln!(out, "let containers=owner_containers_{id}(source)?;").unwrap();
        } else {
            writeln!(out, "let containers=[1u8;{count}];").unwrap();
        }
        write!(out, "Ok(V{id}{{root:None,containers,").unwrap();
        for slot in 0..parts.len() {
            write!(out, "p{slot},").unwrap();
        }
        out.push_str("})}}}\n");
    }
    writeln!(out,"fn write_xml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{let ordinary=write_xml_plain_{id}(value,inputs)?;let Some(patch)=&value.root else {{return Ok(ordinary);}};let qnames=xml_qnames_{id}();let base=core::xml::Tree::capture_with_qnames(&ordinary,{root_code},xml_qname_text_{id})?;let tree=patch.apply(base,core::xml::Name{{namespace:{:?}.into(),local:{:?}.into()}},&[],&qnames)?;let mut names=Vec::new();tree.collect_namespaces(&mut names);let mut writer=core::xml::Writer::new(&names);tree.write_at(&mut writer,&[],&qnames)?;let restored=writer.finish();",root[0].namespace,root[0].local).unwrap();
    for slot in (0..parts.len()).filter(|slot| files[*slot].is_none()) {
        writeln!(
            out,
            "part_{id}_{slot}::verify_boundary(&value.p{slot},&ordinary,&restored)?;"
        )
        .unwrap();
    }
    out.push_str("Ok(restored)}\n");
    let mut verify_documents = String::new();
    if files.iter().any(Option::is_some) {
        writeln!(out,"fn write_xml_documents_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<(core::resources::RelativePath,Vec<u8>)>> {{let mut result=Vec::new();").unwrap();
        for (slot, path) in files
            .iter()
            .enumerate()
            .filter_map(|(slot, path)| path.as_ref().map(|path| (slot, path)))
        {
            writeln!(out,"let bytes=part_{id}_{slot}::document(&value.p{slot},inputs)?;if !bytes.is_empty() {{result.push((core::resources::RelativePath::new({path:?},65536)?,bytes));}}").unwrap();
            writeln!(verify_documents,"part_{id}_{slot}::verify_boundary(&value.p{slot},inputs.document(&{path:?}),&part_{id}_{slot}::document(&value.p{slot},inputs)?)?;").unwrap();
        }
        out.push_str("Ok(result)}\n");
    }
    writeln!(out,"fn verify_{id}(original:&[u8],candidate:&[u8],inputs:&InputView<'_>)->core::Result<()> {{let value=read_yaml_{id}(candidate,inputs)?;if let Some(error)=check_yaml_{id}(&value,candidate,inputs).into_iter().find(|error|error.severity==Severity::Error) {{return Err(error);}}{verify_documents}prove_xml_{id}(&value,original,&write_xml_{id}(&value,inputs)?)}}\nfn finalize_yaml_{id}(original:&[u8],candidate:Vec<u8>,value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{match verify_{id}(original,&candidate,inputs) {{Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some(\"xml.round-trip-mismatch\")=>{{}},Err(error)=>return Err(error)}}let mut out=String::new();").unwrap();
    for slot in 0..parts.len() {
        let source = source_for(slot, "original");
        writeln!(out,"let source=part_{id}_{slot}::project({source})?;let yaml=part_{id}_{slot}::finalize(&source,&value.p{slot},inputs)?;core::yaml::append_encoded_properties(&mut out,&yaml)?;").unwrap();
    }
    writeln!(
        out,
        "let candidate=out.into_bytes();match verify_{id}(original,&candidate,inputs) {{Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some(\"xml.round-trip-mismatch\")=>{{}},Err(error)=>return Err(error)}}let ordinary=write_xml_{id}(&read_yaml_{id}(&candidate,inputs)?,inputs)?;let expected=core::xml::Tree::capture_with_qnames(original,{root_code},xml_qname_text_{id})?.ok_or_else(||RuntimeDiagnostic::new(\"xml.owner-root\",\"Expected the declared document root\"))?;let base=core::xml::Tree::capture_with_qnames(&ordinary,{root_code},xml_qname_text_{id})?;let patch=expected.patch_yaml(base.as_ref(),&[],&xml_qnames_{id}())?;let candidate=core::raw::Document::encode(&candidate,patch.as_bytes())?;verify_{id}(original,&candidate,inputs)?;Ok(candidate)}}"
    )
    .unwrap();
    writeln!(out,"#[allow(dead_code)] fn text_field_{id}(value:&V{id},field:usize)->core::Result<&str>{{match field{{").unwrap();
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!()
    };
    for (index, field) in fields.iter().enumerate() {
        for (slot, part) in parts.iter().enumerate() {
            let LinkedType::Record(local) = &part.value else {
                unreachable!()
            };
            if let Some(local) = local.iter().position(|item| item.name == field.name) {
                writeln!(
                    out,
                    "{index}=>part_{id}_{slot}::text_field(&value.p{slot},{local}),"
                )
                .unwrap();
            }
        }
    }
    out.push_str("_=>Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Unknown field\"))}}\n");
    Ok(out)
}

/// Validate event-state capability before referring to generated state types.
pub(super) fn state_supported(entry: &LinkedEntry, program: &Program) -> Result<bool, Diagnostic> {
    for child in super::owner_layout::parts(entry, program)? {
        if matches!(&child.xml, LinkedXml::Record(fields) if fields.iter().any(|field| field.file.is_some()))
        {
            return Ok(false);
        }
        if super::qname::applies(&child, program) {
            return Ok(false);
        }
        if super::nested_record::lower(&child, program)?.is_none()
            && super::composite::record(&child, program).is_some()
        {
            return Ok(false);
        }
        if let LinkedType::Record(fields) = &child.value {
            for field in fields {
                if field
                    .value
                    .as_reference()
                    .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
                    .is_some_and(|common| {
                        matches!(common.yaml, YamlRepresentation::TextSequence { .. })
                    })
                {
                    return Ok(false);
                }
            }
        }
    }
    Ok(true)
}
