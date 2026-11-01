//! Compose independently generated property decoders from their declared routes.
use super::*;
use std::fmt::Write;

pub(super) fn container_slots(entry: &LinkedEntry, parts: usize) -> usize {
    if entry
        .contributions
        .iter()
        .any(|value| value.for_each.is_some())
    {
        parts
    } else {
        0
    }
}

fn anomalous_property_key<'a>(part: &'a LinkedEntry, program: &Program) -> Option<&'a str> {
    let (YamlRepresentation::Mapping(yaml), LinkedXml::Record(xml)) = (&part.yaml, &part.xml)
    else {
        return None;
    };
    let repeated = matches!(part.value, LinkedType::Sequence(_))
        || matches!(&part.value, LinkedType::Record(fields) if fields.len() == 1
            && composite::reference(&fields[0].value)
                .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
                .is_some_and(|entry| matches!(entry.value, LinkedType::Sequence(_))));
    (yaml.len() == 1
        && yaml[0].file.is_none()
        && xml.len() == 1
        && xml[0].attribute.is_none()
        && !repeated)
        .then(|| yaml[0].key.as_str())
}

pub(super) fn applies(entry: &LinkedEntry, program: &Program) -> bool {
    matches!(super::attributes::content(&entry.xml).0, LinkedXml::Record(fields) if fields.iter().any(|field|field.file.is_some()))
        || matches!(&entry.value, LinkedType::Record(fields) if fields.iter().any(|field| {
            composite::reference(&field.value).and_then(|(id,_,_)|program.entries.iter().find(|entry|entry.id==id)).is_some_and(|common| {
                let (xml,_)=attributes::content(&common.xml);
                match common.value {
                    LinkedType::Record(_)=>fields.len()>1 && !matches!(xml,LinkedXml::TextPattern(_)),
                    LinkedType::Sequence(_)=>fields.len()>1 && !matches!(xml,LinkedXml::TextSequence{..}),
                    LinkedType::Choice(_)=>matches!(common.yaml,YamlRepresentation::Choice { variants: ref selectors, .. } if !selectors.is_empty() || (!common.inputs.is_empty() && matches!(xml,LinkedXml::Choice { fallback: Some(_) }))),
                    _=>false,
                }
            })
        }))
}

pub(super) fn generate(entry: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
    generate_at_profiled(entry, program, None).map(|result| result.source)
}

pub(super) struct GeneratedOwner {
    pub source: String,
    pub parts: Vec<(String, &'static str, usize)>,
}

pub(super) fn generate_profiled(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<GeneratedOwner, Diagnostic> {
    generate_at_profiled(entry, program, None)
}
pub(super) fn generate_at(
    entry: &LinkedEntry,
    program: &Program,
    boundary: Option<&[ExpandedName]>,
) -> Result<String, Diagnostic> {
    generate_at_profiled(entry, program, boundary).map(|result| result.source)
}
fn generate_at_profiled(
    entry: &LinkedEntry,
    program: &Program,
    boundary: Option<&[ExpandedName]>,
) -> Result<GeneratedOwner, Diagnostic> {
    let original = entry;
    let prepared = program.composition(entry)?;
    let entry = prepared.entry();
    let mut shape = entry.clone();
    shape.presence.clear();
    shape.shorthands.clear();
    plain_shape(&shape)?;
    let parts = &prepared.parts;
    let grouped = grouped::prepare(entry, parts, program)?;
    let group_field = if grouped.is_some() {
        "group_order:Vec<usize>,"
    } else {
        ""
    };
    let yaml_slots = crate::plan::records::yaml_slots(entry, parts);
    let anomalous_keys = yaml_slots
        .iter()
        .filter_map(|slot| anomalous_property_key(&parts[*slot], program))
        .collect::<Vec<_>>();
    let input_scope =
        super::value::InputScope::prepare(original, parts, &prepared.captures, program)?;
    let scope_full = input_scope.bind(entry.id, "value.", None);
    let mut scope_finish_xml =
        input_scope.finish(entry.id, parts.len(), crate::plan::RepresentationSide::Xml);
    let scope_finish_yaml =
        input_scope.finish(entry.id, parts.len(), crate::plan::RepresentationSide::Yaml);
    let files: Vec<_> = parts
        .iter()
        .map(|part| {
            let LinkedXml::Record(fields) = &part.xml else {
                unreachable!()
            };
            fields.first().and_then(|field| field.file.clone())
        })
        .collect();
    // External partitions are decoded after their primary-field dependencies.
    // They have no events in the primary stream, but share its lexical frame.
    for (slot, file) in files.iter().enumerate() {
        if let Some(path) = file {
            scope_finish_xml = scope_finish_xml.replace(
                &format!("self.p{slot}.finish(source,inputs)?"),
                &format!(
                    "part_{}_{slot}::read_xml_document(inputs.document(&{path:?}),inputs)?",
                    entry.id
                ),
            );
        }
    }
    let primary = files
        .iter()
        .enumerate()
        .find_map(|(slot, file)| {
            (file.is_none()
                && matches!(&parts[slot].xml, LinkedXml::Record(fields) if !fields.is_empty()))
            .then_some(slot)
        })
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
    let LinkedXml::Record(first_xml) = &parts[primary].xml else {
        unreachable!()
    };
    let root = boundary.unwrap_or(&first_xml[0].path[..1]);
    let root_parent = record::path_code(&root[..root.len() - 1]);
    let root_name = root.last().expect("placed root");
    let root_code = record::path_code(root);
    let conditional_attributes = root_attributes
        .iter()
        .any(|attribute| attribute.when.is_some());
    let generated_attributes = if conditional_attributes {
        Some(super::attributes::generate_prepared(
            entry,
            program,
            &root_attributes.iter().collect::<Vec<_>>(),
            root,
        )?)
    } else {
        None
    };
    let root_attributes_code = if conditional_attributes {
        "&declared_attributes".to_owned()
    } else {
        super::attributes::static_attributes(&root_attributes)
    };

    let id = entry.id;
    let native_short = !entry.shorthands.is_empty();
    let mapping_alias = entry.shorthands.iter().any(|short| {
        matches!(
            short.representation,
            LinkedShorthandRepresentation::MappingField(_)
        )
    });
    let mut out = String::new();
    let mut profile_parts = Vec::new();
    if let Some(attributes) = &generated_attributes {
        out.push_str(&attributes.definitions);
    }
    let lookup = |id| {
        program
            .entries
            .iter()
            .find(|entry| entry.id == id)
            .expect("linked XML route")
    };
    let owned_routes = parts
        .iter()
        .map(|part| {
            crate::plan::xml_ownership::routes(&part.value, &part.xml, &part.source, &lookup)
        })
        .collect::<Result<Vec<_>, _>>()?;
    let mut paths = Vec::new();
    let mut routes: Vec<Vec<&[ExpandedName]>> = Vec::new();
    let mut element_routes: Vec<Vec<&[ExpandedName]>> = Vec::new();
    let mut keys = Vec::new();
    let mut aliases = Vec::new();
    let mut attributes = Vec::new();
    let projected_slot = crate::plan::records::yaml_projection_slot(entry, parts);
    let mut stateful = true;
    // YAML contains both primary and external fields in one stream.
    // Its finish schedule, unlike XML routing, does not depend on file placement.
    let mut yaml_stateful = true;
    for (slot, child) in parts.iter().enumerate() {
        let LinkedXml::Record(xml) = &child.xml else {
            unreachable!()
        };
        let yaml: &[_] = match &child.yaml {
            YamlRepresentation::Mapping(yaml) => yaml,
            YamlRepresentation::Projection(_) => &[],
            _ => unreachable!("partitioned owner YAML"),
        };
        let names: Vec<_> = xml
            .iter()
            .filter_map(|mapping| mapping.attribute.as_ref())
            .map(|name| (name.namespace.as_str(), name.local.as_str()))
            .collect();
        let emitted = super::value_adapters::emit_usage(
            entry,
            child,
            program,
            id,
            slot,
            super::value_adapters::Placement {
                external: files[slot].is_some(),
                shared_container: xml.first().is_some_and(|mapping| {
                    crate::plan::records::shares_container(parts, slot, &mapping.path)
                }),
            },
            &names,
        )?;
        stateful &= files[slot].is_some() || emitted.xml_stateful;
        yaml_stateful &= emitted.yaml_stateful;
        let variant_bytes: usize = emitted.choice_variants.iter().map(|(_, bytes)| bytes).sum();
        for (name, bytes) in emitted.choice_variants {
            profile_parts.push((name, "owner-choice-variant", bytes));
        }
        profile_parts.push((
            String::new(),
            emitted.mechanism,
            emitted.source.len() - variant_bytes,
        ));
        out.push_str(&emitted.source);
        let mapping = xml.first();
        paths.push(
            xml.iter()
                .find(|mapping| mapping.attribute.is_some())
                .or(mapping)
                .map_or(&[][..], |mapping| mapping.path.as_slice()),
        );
        routes.push(
            owned_routes[slot]
                .iter()
                .map(|route| route.path.as_slice())
                .collect(),
        );
        element_routes.push(
            owned_routes[slot]
                .iter()
                .filter(|route| route.attribute.is_none())
                .map(|route| route.path.as_slice())
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
    // Several fields may share an XML container. Its physical name is only a
    // recovery alias, so route it once; semantic YAML property names retain
    // their own unambiguous slots.
    let declared_keys = keys
        .iter()
        .flatten()
        .copied()
        .collect::<std::collections::HashSet<_>>();
    let mut seen_aliases = std::collections::HashSet::new();
    for (slot, group) in aliases.iter_mut().enumerate() {
        group.retain(|name| {
            if keys[slot].contains(name) {
                true
            } else {
                !declared_keys.contains(name) && seen_aliases.insert(*name)
            }
        });
    }
    writeln!(out, "fn infer_xml_owner_{id}(mut value:V{id},source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{").unwrap();
    for &slot in input_scope.order(crate::plan::RepresentationSide::Xml) {
        let mut ready = vec![true; parts.len()];
        ready[slot] = false;
        let binding = input_scope.bind(id, "value.", Some(&ready));
        let source = source_for(slot, "source");
        writeln!(
            out,
            "{{{binding}part_{id}_{slot}::infer_xml(&mut value.p{slot},{source},inputs)?;}}"
        )
        .unwrap();
    }
    out.push_str("Ok(value)}\n");
    for left in 0..paths.len() {
        for right in left + 1..paths.len() {
            if files[left].is_some()
                || files[right].is_some()
                || paths[left].is_empty()
                || paths[right].is_empty()
            {
                continue;
            }
            if owned_routes[left].iter().any(|left| {
                owned_routes[right]
                    .iter()
                    .any(|right| crate::plan::xml_ownership::overlaps(left, right))
            }) || paths[left][0] != paths[right][0]
            {
                return Err(unsupported(
                    entry,
                    "Composed property boundaries must not overlap and must share one XML root",
                ));
            }
        }
    }
    let count = container_slots(entry, parts.len());
    let mut count_events = String::new();
    let LinkedType::Record(owner_fields) = &entry.value else {
        unreachable!()
    };
    let mut counted = BTreeSet::new();
    for contribution in &entry.contributions {
        let Some(iteration) = &contribution.for_each else {
            continue;
        };
        let Some((field, _)) = super::facts::collection_path(&iteration.input) else {
            return Err(unsupported(
                entry,
                "Owner contribution must iterate a declared field path",
            ));
        };
        let slot=parts.iter().position(|part|matches!(&part.value,LinkedType::Record(fields) if fields.iter().any(|candidate|candidate.name==owner_fields[field as usize].name))).unwrap();
        if counted.insert(slot) {
            let LinkedXml::Record(xml) = attributes::content(&entry.xml).0 else {
                unreachable!()
            };
            let mapping = xml
                .iter()
                .find(|mapping| mapping.field == owner_fields[field as usize].name)
                .expect("declared collection owner field");
            // Decoder routes may point at an item or at an already placed
            // wrapper. The declaration supplies the actual container boundary.
            let parent = if mapping.path.is_empty() {
                root
            } else {
                mapping.path.as_slice()
            };
            writeln!(count_events,"if matches!(token,core::xml::Token::Start(_)) && core::xml::matches(path,{}) {{containers[{slot}]=containers[{slot}].saturating_add(1);}}",record::path_code(parent)).unwrap();
        }
    }
    if grouped.is_none() {
        writeln!(out,"fn owner_containers_{id}(source:&[u8])->core::Result<[u8;{count}]> {{#[allow(unused_mut)] let mut containers=[0u8;{count}];core::xml::visit(source,|path,token|{{let _=(path,&token);{count_events}Ok(())}})?;Ok(containers)}}").unwrap();
    }
    writeln!(
        out,
        "struct V{id} {{ root:Option<core::xml::Patch>,#[allow(dead_code)] containers:[u8;{count}],{group_field}"
    )
    .unwrap();
    for slot in 0..parts.len() {
        writeln!(out, "p{slot}:part_{id}_{slot}::Stored,").unwrap();
    }
    out.push_str("}\n");
    let mut xml_routing = String::new();
    let routed_slots = (0..parts.len())
        .filter(|slot| files[*slot].is_none() && !element_routes[*slot].is_empty())
        .collect::<Vec<_>>();
    let routing_state = if routed_slots.is_empty() {
        ";".to_owned()
    } else {
        "{active:Option<usize>,active_depth:usize}".to_owned()
    };
    let routing_init = if routed_slots.is_empty() {
        format!("OwnerRouting{id}")
    } else {
        format!("OwnerRouting{id}::default()")
    };
    writeln!(xml_routing,"#[derive(Default)] struct OwnerRouting{id}{routing_state} impl OwnerRouting{id}{{fn consume<S:Copy>(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:S,containers:&mut [u8;{count}],mut consume:impl FnMut(usize,&[core::xml::Name],&core::xml::Token<'_>,S)->core::Result<()>)->core::Result<()>{{let _=&containers;{count_events}").unwrap();
    if !routed_slots.is_empty() {
        xml_routing.push_str("if let Some(slot)=self.active {let result=match slot{");
        for slot in &routed_slots {
            writeln!(xml_routing, "{slot}=>consume({slot},path,token,scope),").unwrap();
        }
        xml_routing.push_str("_=>unreachable!(\"declared XML route\")};if matches!(token,core::xml::Token::End)&&path.len()==self.active_depth{self.active=None;}return result;}\n");
    }
    for slot in routed_slots {
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
        if files[slot].is_some() || route.is_empty() {
            continue;
        }
        let selected=owned_routes[slot].iter().map(|mapping|{
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
            writeln!(out,"let mut state=OwnerXmlRead{id}::new();events.visit_scoped(|path,token,scope|state.consume(path,token,Some(scope),source,inputs))?;state.finish(source,inputs)}}").unwrap();
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
                    // External readers may need fields from the primary document.
                    // Decode them after the primary stream has completed below.
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
                out.push_str(&format!("let mut routing={routing_init};events.visit_scoped(|path,token,scope|routing.consume(path,token,scope,&mut containers,|slot,path,token,scope|match slot{{\n"));
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
            if side == "xml" {
                let mut ready = files.iter().map(Option::is_none).collect::<Vec<_>>();
                for &slot in &active {
                    if slot != first {
                        writeln!(
                            out,
                            "let p{slot}=p{slot}.expect(\"composed reader completed\");"
                        )
                        .unwrap();
                    }
                }
                for &slot in input_scope.order(crate::plan::RepresentationSide::Xml) {
                    if files[slot].is_none() {
                        continue;
                    }
                    let binding = input_scope.bind(id, "", Some(&ready));
                    let source = source_for(slot, "source");
                    writeln!(out,"let p{slot}={{{binding}part_{id}_{slot}::read_xml_document({source},inputs)?}};").unwrap();
                    ready[slot] = true;
                }
            }
            write!(
                out,
                "{}(V",
                if side == "xml" {
                    format!("infer_xml_owner_{id}")
                } else {
                    "Ok".into()
                }
            )
            .unwrap();
            write!(out, "{id}{{root:None,containers,").unwrap();
            for (slot, _) in files.iter().enumerate() {
                if slot == first || side == "xml" {
                    write!(out, "p{slot},").unwrap();
                    continue;
                }
                write!(
                    out,
                    "p{slot}:p{slot}.expect(\"composed reader completed\"),"
                )
                .unwrap();
            }
            out.push_str(if side == "xml" {
                "},source,inputs)}\n"
            } else {
                "})}\n"
            });
        }
        writeln!(out,"fn check_{side}_{id}(value:&V{id},source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{{scope_full}let mut result=Vec::new();").unwrap();
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
            // A restored document may carry marks produced before its external
            // facts became available. Retain all value errors, but do not make
            // an obsolete internal mark prevent restoring the preserved XML.
            writeln!(out,"if value.root.is_some() {{result.retain(|issue|issue.code.as_deref()!=Some(\"xml/anomaly-tag-unnecessary\"));}}").unwrap();
            writeln!(out,"if value.root.is_some() && let Err(error)=write_xml_{id}(value,inputs) {{result.push(error);}}").unwrap();
        } else if !anomalous_keys.is_empty() {
            writeln!(out,"result.retain(|issue| issue.kind!=core::annotations::IssueKind::Semantic || issue.severity!=Severity::Error || !{:?}.contains(&issue.path.first().map(String::as_str).unwrap_or(\"\")));",anomalous_keys).unwrap();
        }
        out.push_str("result}\n");
    }
    if stateful {
        writeln!(
            out,
            "struct OwnerXmlRead{id}{{routing:OwnerRouting{id},containers:[u8;{count}],{group_field}"
        )
        .unwrap();
        for slot in 0..parts.len() {
            writeln!(out, "p{slot}:part_{id}_{slot}::XmlReader,").unwrap();
        }
        writeln!(out,"}}impl OwnerXmlRead{id}{{fn new()->Self{{Self{{routing:{routing_init},containers:[0;{count}],").unwrap();
        if grouped.is_some() {
            out.push_str("group_order:Vec::new(),");
        }
        for slot in 0..parts.len() {
            writeln!(out, "p{slot}:part_{id}_{slot}::XmlReader::new(),").unwrap();
        }
        out.push_str("}}\n");
        writeln!(out,"fn consume(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:Option<core::xml::NamespaceScope<'_>>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{let Self{{routing,containers,").unwrap();
        if grouped.is_some() {
            out.push_str("group_order,");
        }
        for slot in 0..parts.len() {
            write!(out, "p{slot},").unwrap();
        }
        out.push_str("}=self;routing.consume(path,token,scope,containers,|slot,path,token,scope|match slot{\n");
        for (slot, path) in paths.iter().enumerate().take(parts.len()) {
            let track = if grouped.is_some() {
                format!(
                    "if matches!(token,core::xml::Token::Start(_))&&core::xml::matches(path,{})&&!group_order.contains(&{slot}){{group_order.push({slot});}}",
                    record::path_code(path)
                )
            } else {
                String::new()
            };
            writeln!(
                out,
                "{slot}=>{{{track}p{slot}.consume_scoped(path,token,scope,source,inputs)}},"
            )
            .unwrap();
        }
        out.push_str("_=>unreachable!(\"declared XML route\")})}\n");
        writeln!(out,"fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{{scope_finish_xml}{}infer_xml_owner_{id}(V{id}{{root:None,containers:self.containers,{}",if grouped.is_some(){"let value="}else{""},if grouped.is_some(){"group_order:self.group_order,"}else{""}).unwrap();
        for slot in 0..parts.len() {
            writeln!(out, "p{slot},").unwrap();
        }
        if grouped.is_some() {
            writeln!(
                out,
                "}},source,inputs)?;preserve_group_anomalies_{id}(value,source,inputs)}}}}\n"
            )
            .unwrap();
        } else {
            out.push_str("},source,inputs)}}\n");
        }
    }
    if let Some(groups) = &grouped {
        out.push_str(&grouped::reader(
            id,
            groups,
            parts.len(),
            count,
            &scope_finish_yaml,
        ));
    } else if yaml_stateful {
        // Sibling-derived inputs become ready in dependency order, after the
        // mapping key and identity have been read. Defer only those partitions;
        // independent fields retain the direct streaming reader.
        let deferred: Vec<_> = parts
            .iter()
            .map(|part| {
                crate::plan::input_dependencies::read(
                    part,
                    program,
                    ValidationPhase::YamlValidation,
                )
                .iter()
                .any(|slot| *slot as usize >= original.inputs.len())
            })
            .collect();
        let consume = |slot: usize, node: &str| {
            if deferred[slot] {
                format!("{{self.p{slot}.push(({node},position));Ok::<(),RuntimeDiagnostic>(())}}")
            } else {
                format!("self.p{slot}.consume({node},position,source,inputs)")
            }
        };
        let mut scope_finish_yaml = scope_finish_yaml.clone();
        for (slot, defer) in deferred.iter().enumerate() {
            if *defer {
                scope_finish_yaml=scope_finish_yaml.replace(
                    &format!("self.p{slot}.finish(source,inputs)?"),
                    &format!("{{let mut reader=part_{id}_{slot}::YamlReader::new()?;for (node,position) in self.p{slot}{{reader.consume(node,position,source,inputs)?;}}reader.finish(source,inputs)?}}"));
            }
        }
        writeln!(
            out,
            "struct OwnerYamlRead{id}{{routing:core::yaml::PartitionRouter,"
        )
        .unwrap();
        if native_short {
            out.push_str(
                "short_first:bool,short_text:Option<(core::yaml::Scalar,core::Position)>,",
            );
        }
        if mapping_alias {
            out.push_str("projection_scanned:bool,projection_pending:bool,projection_active:bool,projection_index:usize,projection_events:Vec<(core::yaml::Node,core::Position)>,");
        }
        for (slot, defer) in deferred.iter().enumerate() {
            if *defer {
                writeln!(out, "p{slot}:Vec<(core::yaml::Node,core::Position)>,").unwrap();
            } else {
                writeln!(out, "p{slot}:part_{id}_{slot}::YamlReader,").unwrap();
            }
        }
        writeln!(out,"}}impl OwnerYamlRead{id}{{fn new()->core::Result<Self>{{Ok(Self{{routing:core::yaml::PartitionRouter::default(),").unwrap();
        if native_short {
            out.push_str("short_first:true,short_text:None,");
        }
        if mapping_alias {
            out.push_str("projection_scanned:false,projection_pending:false,projection_active:false,projection_index:0,projection_events:Vec::new(),");
        }
        for (slot, defer) in deferred.iter().enumerate() {
            if *defer {
                writeln!(out, "p{slot}:Vec::new(),").unwrap();
            } else {
                writeln!(out, "p{slot}:part_{id}_{slot}::YamlReader::new()?,").unwrap();
            }
        }
        let unused = if projected_slot.map_or_else(
            || deferred.iter().all(|value| *value),
            |slot| deferred[slot],
        ) {
            "_"
        } else {
            ""
        };
        out.push_str("})}\n");
        if let Some(slot) = projected_slot {
            writeln!(out,"fn consume(&mut self,node:core::yaml::Node,position:core::Position,{unused}source:&[u8],{unused}inputs:&InputView<'_>)->core::Result<()>{{{}}}\n",consume(slot,"node")).unwrap();
        } else {
            let short_read = if native_short {
                "if self.short_first{self.short_first=false;if let core::yaml::Node::Scalar(value,None)=node{self.short_text=Some((value,position));return Ok(())}}if self.short_text.is_some(){return Err(RuntimeDiagnostic::new(\"yaml.shorthand\",\"A shorthand must be one scalar\"))}"
            } else {
                ""
            };
            let projection_read = if mapping_alias {
                let owned = keys
                    .iter()
                    .flatten()
                    .map(|key| format!("{key:?}=>true,"))
                    .collect::<String>();
                format!(
                    "if self.projection_active{{self.projection_events.push((node,position));return Ok(())}}if self.projection_pending{{self.projection_pending=false;let owned=match &node{{core::yaml::Node::Scalar(value,None)=>match value.lexical_text(){{{owned}_=>false}},_=>false}};if owned{{let (start,start_position)=self.projection_events.pop().expect(\"pending mapping start\");self.consume(start,start_position,source,inputs)?;}}else{{self.projection_active=true;self.projection_events.push((node,position));return Ok(())}}}}if !self.projection_scanned{{self.projection_scanned=true;if matches!(&node,core::yaml::Node::MappingStart(None)){{if let Some(index)=mapping_projection_{id}(inputs)?{{self.projection_index=index;self.projection_pending=true;self.projection_events.push((node,position));return Ok(())}}}}}}"
                )
            } else {
                String::new()
            };
            writeln!(out,"fn consume(&mut self,node:core::yaml::Node,position:core::Position,{unused}source:&[u8],{unused}inputs:&InputView<'_>)->core::Result<()>{{{projection_read}{short_read}let slot=self.routing.route(&node,|key|match key{{").unwrap();
            for (slot, keys) in keys.iter().enumerate() {
                for key in keys {
                    writeln!(out, "{key:?}=>Some({slot}),").unwrap();
                }
            }
            out.push_str("_=>None})?;match slot{\n");
            for slot in 0..parts.len() {
                writeln!(out, "Some({slot})=>{},", consume(slot, "node")).unwrap();
            }
            out.push_str("None=>{match node{core::yaml::Node::MappingStart(None)=>{\n");
            for slot in 0..parts.len() {
                writeln!(
                    out,
                    "{}?;",
                    consume(slot, "core::yaml::Node::MappingStart(None)")
                )
                .unwrap();
            }
            out.push_str("},core::yaml::Node::MappingEnd=>{\n");
            for slot in 0..parts.len() {
                writeln!(out, "{}?;", consume(slot, "core::yaml::Node::MappingEnd")).unwrap();
            }
            out.push_str("},_=>unreachable!(\"mapping boundary\")}Ok(())},_=>unreachable!(\"declared YAML route\")}}\n");
        }
        let hidden_boundaries = projected_slot.map_or_else(String::new, |projected| {
            (0..parts.len())
                .filter(|slot| *slot != projected)
                .map(|slot| {
                    format!(
                        "let position=core::Position::default();{}?;{}?;",
                        consume(slot, "core::yaml::Node::MappingStart(None)"),
                        consume(slot, "core::yaml::Node::MappingEnd")
                    )
                })
                .collect::<String>()
        });
        let receiver = if hidden_boundaries.is_empty() {
            "self"
        } else {
            "mut self"
        };
        let projection_finish = if mapping_alias {
            format!(
                "if self.projection_active{{return read_yaml_projection_{id}(self.projection_index,self.projection_events,source,inputs);}}"
            )
        } else {
            String::new()
        };
        let short_finish = if native_short {
            format!(
                "if let Some((text,position))=self.short_text{{return read_yaml_shorthand_{id}(&text,position,inputs);}}"
            )
        } else {
            String::new()
        };
        writeln!(out,"fn finish({receiver},source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{{projection_finish}{short_finish}{hidden_boundaries}{} {scope_finish_yaml}Ok(V{id}{{root:None,containers:[1;{count}],",if projected_slot.is_some(){""}else{"self.routing.finish()?;"}).unwrap();
        for slot in 0..parts.len() {
            writeln!(out, "p{slot},").unwrap();
        }
        out.push_str("})}}\n");
    }
    writeln!(out, "struct OwnerPrepared{id} {{").unwrap();
    for slot in (0..parts.len()).filter(|slot| files[*slot].is_none()) {
        writeln!(out, "p{slot}:part_{id}_{slot}::Prepared,").unwrap();
    }
    writeln!(out, "}}\nfn prepare_xml_plain_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<OwnerPrepared{id}> {{{scope_full}Ok(OwnerPrepared{id} {{").unwrap();
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
    writeln!(out,"}}\nfn write_xml_plain_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{let prepared=prepare_xml_plain_{id}(value,inputs)?;let mut names=Vec::new();namespaces_xml_plain_{id}(value,&prepared,&mut names);let mut out=core::xml::Writer::new(&names);write_xml_plain_into_{id}(value,&prepared,inputs,&mut out)?;Ok(out.finish())}}\nfn write_xml_plain_into_{id}<'a>(value:&V{id},prepared:&'a OwnerPrepared{id},inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()> {{{scope_full}").unwrap();
    if let Some(attributes) = &generated_attributes {
        writeln!(
            out,
            "let declared_attributes={{let _value=value;let _inputs=inputs;{}attributes}};",
            attributes.write
        )
        .unwrap();
    }
    let headers: Vec<_> = (0..parts.len())
        .filter(|slot| {
            files[*slot].is_none()
                && !attributes[*slot].is_empty()
                && !super::choice_value::applies(&parts[*slot], program)
        })
        .collect();
    let mut ordered_headers = headers.clone();
    ordered_headers.sort_by_key(|slot| paths[*slot].len());
    let mut written_headers = BTreeSet::new();
    if !root_attributes.is_empty() && !headers.iter().any(|slot| paths[*slot] == root) {
        writeln!(
            out,
            "out.container_with_attributes({root_code},{root_attributes_code});"
        )
        .unwrap();
    }
    if grouped.is_some() {
        out.push_str("for &slot in &value.group_order{match slot{");
        for slot in 0..parts.len() {
            writeln!(
                out,
                "{slot}=>part_{id}_{slot}::write_xml(&value.p{slot},&prepared.p{slot},inputs,out)?,"
            )
            .unwrap();
        }
        out.push_str("_=>unreachable!(\"compiled group slot\")}}\n");
    } else {
        for slot in crate::plan::records::xml_slots(entry, parts)
            .into_iter()
            .filter(|slot| {
                files[*slot].is_none()
                    && (headers.contains(slot)
                        || super::choice_value::applies(&parts[*slot], program)
                        || !element_routes[*slot].is_empty()
                        || (!routes[*slot].is_empty() && attributes[*slot].is_empty()))
            })
        {
            for &header in &ordered_headers {
                if !written_headers.contains(&header)
                    && (header == slot
                        || element_routes[slot]
                            .iter()
                            .any(|path| path.starts_with(paths[header])))
                {
                    let declared = if paths[header] == root {
                        root_attributes_code.as_str()
                    } else {
                        "&[]"
                    };
                    writeln!(out,"{{let declared:&[core::xml::WriteAttribute<'_>]={declared};part_{id}_{header}::header(&value.p{header},inputs,out,declared)?;}}").unwrap();
                    written_headers.insert(header);
                }
            }
            if element_routes[slot].is_empty()
                && (routes[slot].is_empty() || !attributes[slot].is_empty())
                && !super::choice_value::applies(&parts[slot], program)
            {
                continue;
            }
            writeln!(
                out,
                "part_{id}_{slot}::write_xml(&value.p{slot},&prepared.p{slot},inputs,out)?;"
            )
            .unwrap();
        }
    }
    writeln!(out, "out.ensure_container_written({root_code});Ok(())}}").unwrap();
    writeln!(out,"fn write_yaml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{{scope_full}let mut out=String::new();").unwrap();
    if native_short {
        writeln!(out,"if write_yaml_shorthand_{id}(value,inputs,&mut out,\"\")?{{return Ok(out.into_bytes());}}").unwrap();
    }
    if let Some(groups) = &grouped {
        out.push_str(&grouped::write_items(id, groups));
    } else {
        for &slot in &yaml_slots {
            writeln!(
                out,
                "part_{id}_{slot}::write_yaml(&value.p{slot},inputs,&mut out)?;"
            )
            .unwrap();
        }
    }
    out.push_str("let bytes=out.into_bytes();");
    out.push_str("if let Some(patch)=&value.root {core::raw::Document::encode(&bytes,patch.to_yaml().as_bytes())}else{Ok(bytes)}}\n");
    if grouped.is_some() {
        writeln!(out,"#[allow(dead_code)] fn write_yaml_indented_{id}(value:&V{id},inputs:&InputView<'_>,out:&mut String,indent:&str,_lift:bool)->core::Result<()>{{let bytes=write_yaml_{id}(value,inputs)?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));Ok(())}}").unwrap();
    } else if yaml_stateful {
        let short_write = if native_short {
            format!("if write_yaml_shorthand_{id}(value,inputs,out,indent)?{{return Ok(());}}")
        } else {
            String::new()
        };
        writeln!(out,"#[allow(dead_code)] fn write_yaml_indented_{id}(value:&V{id},inputs:&InputView<'_>,out:&mut String,indent:&str,_lift:bool)->core::Result<()>{{{scope_full}{short_write}if value.root.is_some(){{let bytes=write_yaml_{id}(value,inputs)?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));return Ok(());}}").unwrap();
        for &slot in &yaml_slots {
            writeln!(
                out,
                "part_{id}_{slot}::write_yaml_indented(&value.p{slot},inputs,out,indent)?;"
            )
            .unwrap();
        }
        out.push_str("Ok(())}\n");
    }
    if let Some(slot) = projected_slot
        && crate::yaml_shape::declared_sequence_projection(
            entry,
            program,
            &mut std::collections::BTreeSet::new(),
        )
    {
        writeln!(out,"#[allow(dead_code)] fn write_yaml_sequence_items_{id}<const ROOT:bool,const MARKED:bool>(value:&V{id},inputs:&InputView<'_>,out:&mut String,indent:&str,mark:&str)->core::Result<()>{{if value.root.is_some(){{return Err(RuntimeDiagnostic::new(\"yaml.group-envelope\",\"Preserved projection requires its XML envelope\"));}}{scope_full}part_{id}_{slot}::write_yaml_sequence_items::<ROOT,MARKED>(&value.p{slot},inputs,out,indent,mark)}}").unwrap();
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
    let selected_qname = (0..parts.len())
        .filter(|slot| files[*slot].is_none())
        .map(|slot| format!("part_{id}_{slot}::qname_text_at(&value.p{slot},path,occurrences)"))
        .collect::<Vec<_>>()
        .join(" || ");
    let selected_qname = format!(
        "{}{}",
        super::proof::preserved_qname("&value.root", &root_code),
        if selected_qname.is_empty() {
            "false"
        } else {
            &selected_qname
        }
    );
    out.push_str(&super::proof::generate_scoped(
        id,
        &scalar,
        &attribute,
        &qname,
        parts
            .iter()
            .any(|part| super::declared_items::applies(part, program)),
        Some(if selected_qname.is_empty() {
            "false"
        } else {
            &selected_qname
        }),
    ));
    // Canonical omission is an optional proof after the strict comparison.
    // A nested source may still contain attributes owned by its caller;
    // failed replay must retain the mismatch, not replace it with a read error.
    writeln!(out,"fn prove_xml_canonical_{id}(value:&V{id},original:&[u8],restored:&[u8],inputs:&InputView<'_>)->core::Result<()>{{match prove_xml_{id}(value,original,restored){{Err(error) if error.code.as_deref()==Some(core::proof::MISMATCH)=>{{let Ok(original_value)=read_xml_{id}(original,inputs) else{{return Err(error);}};let mut omitted=Vec::new();").unwrap();
    for slot in (0..parts.len()).filter(|slot| files[*slot].is_none()) {
        writeln!(
            out,
            "part_{id}_{slot}::canonical_omissions(&original_value.p{slot},inputs,&mut omitted)?;"
        )
        .unwrap();
    }
    writeln!(out,"if omitted.is_empty(){{return Err(error);}}core::proof::verify_with_value_qnames(original,restored,&omitted,|path,occurrences|xml_scalar_at_{id}(&original_value,path,occurrences),xml_qname_attribute_{id},|path,occurrences|xml_qname_text_at_{id}(&original_value,path,occurrences))}},result=>result}}}}\n").unwrap();
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
    if grouped.is_some() {
        writeln!(out,"fn preserved_group_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{let tree=core::xml::Tree::capture_with_qnames(source,{root_code},xml_qname_text_{id})?.ok_or_else(||RuntimeDiagnostic::new(\"xml.owner-root\",\"Expected the group root\"))?;let payload=tree.full_patch_yaml(&[],&xml_qnames_{id}())?;let mut value=read_yaml_shared_{id}(b\"[]\",inputs)?;value.root=Some(core::xml::Patch::read(payload.as_bytes(),&[],&xml_qnames_{id}())?);Ok(value)}}").unwrap();
        let raw = (0..parts.len())
            .map(|slot| format!("part_{id}_{slot}::has_raw(&value.p{slot})"))
            .collect::<Vec<_>>()
            .join("||");
        writeln!(out,"fn preserve_group_anomalies_{id}(value:V{id},source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{if value.root.is_none() && (({raw}) || check_xml_{id}(&value,source,inputs).iter().any(|issue|issue.kind==core::annotations::IssueKind::Semantic && issue.severity==Severity::Error)){{preserved_group_{id}(source,inputs)}}else{{Ok(value)}}}}").unwrap();
        writeln!(out,"fn read_xml_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{match read_xml_shared_{id}(source,inputs){{Ok(value)=>preserve_group_anomalies_{id}(value,source,inputs),Err(error) if error.code.as_deref().is_some_and(|code|code.starts_with(\"xml.\")||code.starts_with(\"value.\"))=>preserved_group_{id}(source,inputs),Err(error)=>Err(error)}}}}").unwrap();
        writeln!(out,"fn read_yaml_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{match read_yaml_shared_{id}(source,inputs){{Ok(value)=>Ok(value),Err(error)=>{{let Some(envelope)=core::raw::Document::decode(source)? else{{return Err(error)}};let mut value=read_yaml_shared_{id}(&envelope.meaning,inputs)?;let patch=core::xml::Patch::read(&envelope.payload,&[],&xml_qnames_{id}())?;if patch.is_null(){{return Err(RuntimeDiagnostic::new(\"xml.owner-root\",\"The document root cannot be removed\"));}}value.root=Some(patch);Ok(value)}}}}}}").unwrap();
    } else {
        for side in ["xml", "yaml"] {
            writeln!(out,"fn read_{side}_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{match read_{side}_shared_{id}(source,inputs) {{Ok(value)=>Ok(value),Err(error)=>{{if !error.code.as_deref().is_some_and(|code|code.starts_with(\"xml.\")||code.starts_with(\"yaml.\")||code.starts_with(\"value.\")) {{return Err(error);}}").unwrap();
            if side == "yaml" {
                writeln!(out,"if let Some(envelope)=core::raw::Document::decode(source)? {{let mut value=read_yaml_{id}(&envelope.meaning,inputs)?;let patch=core::xml::Patch::read(&envelope.payload,&[],&xml_qnames_{id}())?;if patch.is_null() {{return Err(RuntimeDiagnostic::new(\"xml.owner-root\",\"The document root cannot be removed\"));}}value.root=Some(patch);return Ok(value);}}").unwrap();
            }
            if side == "yaml" {
                if let Some(slot) = projected_slot {
                    writeln!(
                        out,
                        "let mut pieces=vec![Vec::new();{}];pieces[{slot}]=source.to_vec();",
                        parts.len()
                    )
                    .unwrap();
                } else {
                    writeln!(
                        out,
                        "let pieces=core::yaml::split_properties(source,&[{groups}])?;"
                    )
                    .unwrap();
                }
            }
            let mut ready = vec![false; parts.len()];
            for &slot in input_scope.order(if side == "xml" {
                crate::plan::RepresentationSide::Xml
            } else {
                crate::plan::RepresentationSide::Yaml
            }) {
                let binding = input_scope.bind(id, "", Some(&ready));
                if side == "xml" {
                    let source = source_for(slot, "source");
                    writeln!(out,"let p{slot}={{{binding}let piece=core::xml::borrow_or_project({source},part_{id}_{slot}::project)?;part_{id}_{slot}::read_xml_document(&piece,inputs)?}};").unwrap();
                } else {
                    writeln!(out,"let p{slot}={{{binding}part_{id}_{slot}::read_yaml_document(&pieces[{slot}],inputs)?}};").unwrap();
                }
                ready[slot] = true;
            }
            if side == "xml" {
                writeln!(out, "let containers=owner_containers_{id}(source)?;").unwrap();
            } else {
                writeln!(out, "let containers=[1u8;{count}];").unwrap();
            }
            write!(
                out,
                "{}(V{id}{{root:None,containers,",
                if side == "xml" {
                    format!("infer_xml_owner_{id}")
                } else {
                    "Ok".into()
                }
            )
            .unwrap();
            for slot in 0..parts.len() {
                write!(out, "p{slot},").unwrap();
            }
            out.push_str(if side == "xml" {
                "},source,inputs)}}}\n"
            } else {
                "})}}}\n"
            });
        }
    }
    writeln!(out,"fn write_xml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{let ordinary=write_xml_plain_{id}(value,inputs)?;let Some(patch)=&value.root else {{return Ok(ordinary);}};let qnames=xml_qnames_{id}();let base=core::xml::Tree::capture_with_value_qnames(&ordinary,{root_code},|path,occurrences|xml_qname_text_at_{id}(value,path,occurrences))?;let tree=patch.apply(base,core::xml::Name{{namespace:{:?}.into(),local:{:?}.into()}},&[],&qnames)?;let restored=tree.document_at({root_parent},&qnames)?;",root_name.namespace,root_name.local).unwrap();
    if grouped.is_none() {
        for slot in (0..parts.len()).filter(|slot| files[*slot].is_none()) {
            writeln!(
                out,
                "part_{id}_{slot}::verify_boundary(&value.p{slot},&ordinary,&restored,inputs)?;"
            )
            .unwrap();
        }
    }
    out.push_str("Ok(restored)}\n");
    if super::external_text::has_documents(entry, program) {
        writeln!(out,"fn write_yaml_documents_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<(core::resources::RelativePath,Vec<u8>)>> {{{scope_full}let mut documents=Vec::new();").unwrap();
        for (slot, _part) in parts
            .iter()
            .enumerate()
            .filter(|(_, part)| super::external_text::has_documents(part, program))
        {
            writeln!(
                out,
                "documents.extend(part_{id}_{slot}::yaml_documents(&value.p{slot},inputs)?);"
            )
            .unwrap();
        }
        out.push_str("Ok(documents)}\n");
    }
    let mut verify_documents = String::new();
    if files.iter().any(Option::is_some) {
        writeln!(out,"fn write_xml_documents_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<(core::resources::RelativePath,Vec<u8>)>> {{{scope_full}let mut result=Vec::new();").unwrap();
        for (slot, path) in files
            .iter()
            .enumerate()
            .filter_map(|(slot, path)| path.as_ref().map(|path| (slot, path)))
        {
            writeln!(out,"let bytes=part_{id}_{slot}::document(&value.p{slot},inputs)?;if !bytes.is_empty() {{result.push((core::resources::RelativePath::new({path:?},65536)?,bytes));}}").unwrap();
            writeln!(verify_documents,"part_{id}_{slot}::verify_boundary(&value.p{slot},inputs.document(&{path:?}),&part_{id}_{slot}::document(&value.p{slot},inputs)?,inputs)?;").unwrap();
        }
        out.push_str("Ok(result)}\n");
    }
    // An inner raw envelope can still violate an outer semantic constraint.
    // The owner must then preserve its own property boundary once more.
    let semantic_anomaly = if anomalous_keys.is_empty() {
        String::new()
    } else {
        let keys = anomalous_keys
            .iter()
            .map(|key| format!("{key:?}"))
            .collect::<Vec<_>>()
            .join(",");
        format!(
            "Err(error) if error.kind==core::annotations::IssueKind::Semantic && [{keys}].contains(&error.path.first().map(String::as_str).unwrap_or(\"\"))=>error.path.first().cloned(),"
        )
    };
    let nested_anomaly = if yaml_slots.len() == 1
        && let Some(key) = anomalous_keys.first()
    {
        format!(
            "Err(error) if error.code.as_deref()==Some(\"yaml.document\") || error.code.as_deref()==Some(\"yaml.unsupported-form\") && candidate.windows(b\"!xml/\".len()).any(|bytes|bytes==b\"!xml/\")=>Some({key:?}.to_owned()),"
        )
    } else {
        String::new()
    };
    if grouped.is_some() {
        writeln!(out,"fn verify_{id}(original:&[u8],candidate:&[u8],inputs:&InputView<'_>)->core::Result<()>{{let value=read_yaml_{id}(candidate,inputs)?;if let Some(error)=check_yaml_{id}(&value,candidate,inputs).into_iter().find(|error|error.severity==Severity::Error) {{return Err(error);}}prove_xml_canonical_{id}(&value,original,&write_xml_{id}(&value,inputs)?,inputs)}} fn finalize_yaml_{id}(original:&[u8],candidate:Vec<u8>,_value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>>{{match verify_{id}(original,&candidate,inputs){{Ok(())=>Ok(candidate),Err(error) if error.code.as_deref()==Some(core::proof::MISMATCH)=>{{let preserved=preserved_group_{id}(original,inputs)?;let candidate=write_yaml_{id}(&preserved,inputs)?;verify_{id}(original,&candidate,inputs)?;Ok(candidate)}},Err(error)=>Err(error)}}}}").unwrap();
    } else {
        writeln!(out,"fn verify_{id}(original:&[u8],candidate:&[u8],inputs:&InputView<'_>)->core::Result<()> {{let value=read_yaml_{id}(candidate,inputs)?;if let Some(error)=check_yaml_{id}(&value,candidate,inputs).into_iter().find(|error|error.severity==Severity::Error) {{return Err(error);}}{scope_full}{verify_documents}prove_xml_canonical_{id}(&value,original,&write_xml_{id}(&value,inputs)?,inputs)}}\nfn finalize_yaml_{id}(original:&[u8],candidate:Vec<u8>,value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{{scope_full}let verified=verify_{id}(original,&candidate,inputs);let _spelling_mismatch=matches!(&verified,Err(error) if error.code.as_deref()==Some(core::proof::MISMATCH));let _invalid_property=match verified {{Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some(core::proof::MISMATCH)=>None,Err(error) if matches!(error.code.as_deref(),Some(\"value.missing\"|\"yaml.choice-form\"|\"yaml.expected-scalar\"|\"yaml.raw-envelope\"|\"yaml.owner-property\"|\"yaml.unknown-field\")) && candidate.windows(b\"!xml/\".len()).any(|bytes|bytes==b\"!xml/\")=>None,Err(error) if error.code.as_deref()==Some(\"xml/anomaly-tag-unnecessary\")=>error.path.first().cloned(),{semantic_anomaly}{nested_anomaly}Err(error)=>return Err(error)}};let owner_tree=core::xml::Tree::capture_with_value_qnames(original,{root_code},|path,occurrences|xml_qname_text_at_{id}(value,path,occurrences))?.ok_or_else(||RuntimeDiagnostic::expected_xml_root())?;let mut out=String::new();").unwrap();
        // A valid semantic value can have an exceptional XML spelling. Try
        // preserving only that property's original form before the whole owner.
        for &slot in &yaml_slots {
            if let (Some(key), LinkedXml::Record(xml)) = (
                anomalous_property_key(&parts[slot], program),
                &parts[slot].xml,
            ) {
                let path = record::path_code(&xml[0].path);
                let source = source_for(slot, "original");
                let repeated_guard = if files[slot].is_none() && xml[0].path.starts_with(root) {
                    format!(
                        "owner_tree.count_at({})<=1",
                        record::path_code(&xml[0].path[root.len()..])
                    )
                } else {
                    "true".into()
                };
                writeln!(out,"if {repeated_guard} && _spelling_mismatch && !candidate.is_empty() {{let source={source};if let Some(tree)=core::xml::Tree::capture_with_qnames(source,{path},xml_qname_text_{id})? {{let payload=tree.full_patch_yaml(&[],&xml_qnames_{id}())?;if let Ok(marked)=core::raw::Property::encode({key:?},{key:?},&candidate,payload.as_bytes()) && verify_{id}(original,&marked,inputs).is_ok() {{return Ok(marked);}}}}}}").unwrap();
                writeln!(out,"if {repeated_guard} && _invalid_property.as_deref()==Some({key:?}) {{let source={source};let tree=core::xml::Tree::capture_with_qnames(source,{path},xml_qname_text_{id})?.ok_or_else(||RuntimeDiagnostic::expected_xml_property())?;let payload=tree.patch_yaml(None,&[],&xml_qnames_{id}())?;let plain=core::yaml::without_property(&candidate,{key:?})?;let marked=core::raw::Property::encode({key:?},{key:?},&plain,payload.as_bytes())?;if verify_{id}(original,&marked,inputs).is_ok() {{return Ok(marked);}}}}").unwrap();
            }
        }
        for &slot in &yaml_slots {
            let source = source_for(slot, "original");
            let (raw_condition, raw_fallback) = match (
                anomalous_property_key(&parts[slot], program),
                &parts[slot].xml,
            ) {
                (Some(key), LinkedXml::Record(xml)) => {
                    let path = record::path_code(&xml[0].path);
                    (
                        format!("_invalid_property.as_deref()==Some({key:?})"),
                        format!(
                            "let tree=core::xml::Tree::capture_with_qnames(&source,{path},xml_qname_text_{id})?.ok_or_else(||RuntimeDiagnostic::expected_xml_property())?;let payload=tree.patch_yaml(None,&[],&xml_qnames_{id}())?;core::raw::Property::encode({key:?},{key:?},b\"\",payload.as_bytes())?"
                        ),
                    )
                }
                _ => ("false".into(), "Vec::new()".into()),
            };
            let can_preserve = anomalous_property_key(&parts[slot], program).is_some();
            let repeated_scalar = match (&parts[slot].value, &parts[slot].xml) {
                (LinkedType::Record(fields), LinkedXml::Record(xml))
                    if fields.len() == 1
                        && xml.len() == 1
                        && xml[0].attribute.is_none()
                        && files[slot].is_none()
                        && xml[0].path.starts_with(root)
                        && scalar::Codec::resolve(&fields[0].value, &parts[slot], program)
                            .is_ok() =>
                {
                    format!(
                        "owner_tree.count_at({})>1",
                        record::path_code(&xml[0].path[root.len()..])
                    )
                }
                _ => "false".into(),
            };
            // Rebase local document envelopes through the complete owner proof.
            // External XML documents keep their independent preservation boundary.
            let nested_document = if files[slot].is_none() {
                r#"let yaml=if yaml.starts_with(b"!xml/raw\n"){match core::raw::Document::decode(&yaml)?{Some(envelope)=>envelope.meaning,None=>yaml}}else{yaml};"#
            } else {
                ""
            };
            writeln!(out,"let yaml=if {repeated_scalar} {{let mut yaml=String::new();part_{id}_{slot}::write_yaml(&value.p{slot},inputs,&mut yaml)?;yaml.into_bytes()}}else{{let source=part_{id}_{slot}::project({source})?;if {raw_condition} {{{raw_fallback}}}else{{match part_{id}_{slot}::finalize(&source,&value.p{slot},inputs) {{Ok(yaml)=>yaml,Err(error) if error.code.as_deref()==Some(core::proof::MISMATCH)=>{{let mut yaml=String::new();part_{id}_{slot}::write_yaml(&value.p{slot},inputs,&mut yaml)?;yaml.into_bytes()}},Err(error) if {can_preserve} && (error.code.as_deref()==Some(\"yaml.raw-envelope\") || (matches!(error.code.as_deref(),Some(\"yaml.choice-form\"|\"yaml.expected-scalar\"|\"value.missing\"|\"yaml.owner-property\")) && candidate.windows(b\"!xml/\".len()).any(|bytes|bytes==b\"!xml/\")))=>{{{raw_fallback}}},Err(error)=>return Err(error)}}}}}};{nested_document}core::yaml::append_encoded_properties(&mut out,&yaml)?;").unwrap();
        }
        // A projected child and its owner share the YAML document boundary.
        // Rebase a child preservation patch to the complete XML owner below;
        // never nest two document envelopes or interpret a child patch as root.
        let projected_meaning = if matches!(entry.yaml, YamlRepresentation::Projection(_)) {
            "let refined=match core::raw::Document::decode(&refined)?{Some(envelope)=>envelope.meaning,None=>refined};"
        } else {
            ""
        };
        writeln!(
        out,
        "let refined=out.into_bytes();{projected_meaning}match verify_{id}(original,&refined,inputs) {{Ok(())=>return Ok(refined),Err(error) if error.code.as_deref()==Some(core::proof::MISMATCH)=>{{}},Err(error)=>return Err(error)}}let restored_value=read_yaml_{id}(&refined,inputs)?;let ordinary=write_xml_{id}(&restored_value,inputs)?;let base=core::xml::Tree::capture_with_value_qnames(&ordinary,{root_code},|path,occurrences|xml_qname_text_at_{id}(&restored_value,path,occurrences))?;let patch=owner_tree.patch_yaml(base.as_ref(),&[],&xml_qnames_{id}())?;let candidate=core::raw::Document::encode(&refined,patch.as_bytes())?;verify_{id}(original,&candidate,inputs)?;Ok(candidate)}}"
    )
    .unwrap();
    }
    for (accessor, result, fallback) in [
        (
            "text_field",
            "core::Result<&str>",
            "Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Unknown field\"))",
        ),
        ("input_field", "Option<core::inputs::InputRef<'_>>", "None"),
    ] {
        writeln!(out,"#[allow(dead_code)] fn {accessor}_{id}(value:&V{id},field:usize)->{result}{{match field{{").unwrap();
        let LinkedType::Record(fields) = &entry.value else {
            unreachable!()
        };
        for (index, field) in fields.iter().enumerate() {
            for (slot, part) in parts.iter().enumerate() {
                let LinkedType::Record(local) = &part.value else {
                    unreachable!()
                };
                if let Some(local) = local.iter().position(|item| item.name == field.name) {
                    if accessor == "input_field" && super::choice_value::applies(part, program) {
                        let input = super::choice_value::borrowed_input(
                            &format!("part_{id}_{slot}"),
                            &format!("value.p{slot}"),
                        );
                        writeln!(out, "{index}=>{input},").unwrap();
                        continue;
                    }
                    writeln!(
                        out,
                        "{index}=>part_{id}_{slot}::{accessor}(&value.p{slot},{local}),"
                    )
                    .unwrap();
                }
            }
        }
        writeln!(out, "_=>{fallback}}}}}").unwrap();
    }
    if native_short {
        if !yaml_stateful || projected_slot.is_some() {
            return Err(unsupported(
                entry,
                "Structural shorthand requires a stateful mapping reader",
            ));
        }
        let raw = std::iter::once("value.root.is_some()".to_owned())
            .chain(
                (0..parts.len()).map(|slot| format!("part_{id}_{slot}::has_raw(&value.p{slot})")),
            )
            .collect::<Vec<_>>()
            .join("||");
        if super::native_shorthand::needs_construction(entry) {
            out.push_str(
                &super::record_construction::composed(entry, program)?
                    .replace("@id@", &id.to_string()),
            );
        }
        out.push_str(&super::native_shorthand::definitions(entry, program, &raw)?);
    }
    Ok(GeneratedOwner {
        source: out,
        parts: profile_parts,
    })
}

/// Validate event-state capability before referring to generated state types.
pub(super) fn state_supported(entry: &LinkedEntry, program: &Program) -> Result<bool, Diagnostic> {
    let prepared = program.composition(entry)?;
    for child in &prepared.parts {
        if crate::plan::routes::record_usage(child, program)?.is_some() {
            continue;
        }
        if matches!(&child.xml, LinkedXml::Record(fields) if fields.iter().any(|field| field.file.is_some()))
        {
            return Ok(false);
        }
        if super::qname::applies(child, program) {
            continue;
        }
        if super::nested_record::lower(child, program)?.is_none()
            && super::composite::record(child, program).is_some()
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
