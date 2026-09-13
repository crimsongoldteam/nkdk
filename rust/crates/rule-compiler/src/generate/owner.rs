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
    generate_at(entry, program, None)
}
pub(super) fn generate_at(
    entry: &LinkedEntry,
    program: &Program,
    boundary: Option<&[ExpandedName]>,
) -> Result<String, Diagnostic> {
    let original = entry;
    let prepared = program.composition(entry)?;
    let entry = prepared.entry();
    let mut shape = entry.clone();
    shape.presence.clear();
    plain_shape(&shape)?;
    let parts = &prepared.parts;
    let input_scope =
        super::value::InputScope::prepare(original, parts, &prepared.captures, program)?;
    let scope_full = input_scope.bind(entry.id, "value.", None);
    let scope_finish = input_scope.finish(entry.id, parts.len());
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
    let mut out = String::new();
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
    let mut stateful = files.iter().all(Option::is_none);
    let mut yaml_stateful = stateful;
    for (slot, child) in parts.iter().enumerate() {
        let (LinkedXml::Record(xml), YamlRepresentation::Mapping(yaml)) = (&child.xml, &child.yaml)
        else {
            unreachable!()
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
                shared_container: crate::plan::records::shares_container(parts, slot, &xml[0].path),
            },
            &names,
        )?;
        stateful &= emitted.xml_stateful;
        yaml_stateful &= emitted.yaml_stateful;
        out.push_str(&emitted.source);
        let mapping = &xml[0];
        paths.push(
            xml.iter()
                .find(|mapping| mapping.attribute.is_some())
                .unwrap_or(mapping)
                .path
                .as_slice(),
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
    writeln!(out, "fn infer_xml_owner_{id}(mut value:V{id},source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{").unwrap();
    for slot in 0..parts.len() {
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
        writeln!(out,"fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{{scope_finish}infer_xml_owner_{id}(V{id}{{root:None,containers:self.containers,").unwrap();
        for slot in 0..parts.len() {
            writeln!(out, "p{slot},").unwrap();
        }
        out.push_str("},source,inputs)}}\n");
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
        writeln!(out,"fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{self.routing.finish()?;{scope_finish}Ok(V{id}{{root:None,containers:[1;{count}],").unwrap();
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
    writeln!(out, "out.ensure_container({root_code});Ok(())}}").unwrap();
    writeln!(out,"fn write_yaml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{{scope_full}let mut out=String::new();").unwrap();
    for slot in 0..parts.len() {
        writeln!(
            out,
            "part_{id}_{slot}::write_yaml(&value.p{slot},inputs,&mut out)?;"
        )
        .unwrap();
    }
    out.push_str("let bytes=out.into_bytes();if let Some(patch)=&value.root {core::raw::Document::encode(&bytes,patch.to_yaml().as_bytes())}else{Ok(bytes)}}\n");
    if yaml_stateful {
        writeln!(out,"#[allow(dead_code)] fn write_yaml_indented_{id}(value:&V{id},inputs:&InputView<'_>,out:&mut String,indent:&str,_lift:bool)->core::Result<()>{{{scope_full}if value.root.is_some(){{let bytes=write_yaml_{id}(value,inputs)?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));return Ok(());}}").unwrap();
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
        let mut ready = vec![false; parts.len()];
        for &slot in input_scope.order() {
            let binding = input_scope.bind(id, "", Some(&ready));
            if side == "xml" {
                let source = source_for(slot, "source");
                writeln!(out,"let p{slot}={{{binding}let piece=part_{id}_{slot}::project({source})?;part_{id}_{slot}::read_xml_document(&piece,inputs)?}};").unwrap();
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
    writeln!(out,"fn write_xml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{let ordinary=write_xml_plain_{id}(value,inputs)?;let Some(patch)=&value.root else {{return Ok(ordinary);}};let qnames=xml_qnames_{id}();let base=core::xml::Tree::capture_with_qnames(&ordinary,{root_code},xml_qname_text_{id})?;let tree=patch.apply(base,core::xml::Name{{namespace:{:?}.into(),local:{:?}.into()}},&[],&qnames)?;let mut names=Vec::new();tree.collect_namespaces(&mut names);let mut writer=core::xml::Writer::new(&names);tree.write_at(&mut writer,{root_parent},&qnames)?;let restored=writer.finish();",root_name.namespace,root_name.local).unwrap();
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
        writeln!(out,"fn write_xml_documents_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<(core::resources::RelativePath,Vec<u8>)>> {{{scope_full}let mut result=Vec::new();").unwrap();
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
    writeln!(out,"fn verify_{id}(original:&[u8],candidate:&[u8],inputs:&InputView<'_>)->core::Result<()> {{let value=read_yaml_{id}(candidate,inputs)?;if let Some(error)=check_yaml_{id}(&value,candidate,inputs).into_iter().find(|error|error.severity==Severity::Error) {{return Err(error);}}{verify_documents}prove_xml_{id}(&value,original,&write_xml_{id}(&value,inputs)?)}}\nfn finalize_yaml_{id}(original:&[u8],candidate:Vec<u8>,value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{{scope_full}match verify_{id}(original,&candidate,inputs) {{Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some(\"xml.round-trip-mismatch\")=>{{}},Err(error)=>return Err(error)}}let mut out=String::new();").unwrap();
    for slot in 0..parts.len() {
        let source = source_for(slot, "original");
        writeln!(out,"let source=part_{id}_{slot}::project({source})?;let yaml=match part_{id}_{slot}::finalize(&source,&value.p{slot},inputs) {{Ok(yaml)=>yaml,Err(error) if error.code.as_deref()==Some(\"xml.round-trip-mismatch\")=>{{let mut yaml=String::new();part_{id}_{slot}::write_yaml(&value.p{slot},inputs,&mut yaml)?;yaml.into_bytes()}},Err(error)=>return Err(error)}};core::yaml::append_encoded_properties(&mut out,&yaml)?;").unwrap();
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
            return Ok(false);
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
