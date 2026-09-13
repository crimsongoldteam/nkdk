use super::*;
use std::fmt::Write;

pub(crate) fn reference(
    value: &LinkedType,
) -> Option<(u32, &[LinkedBinding], &[LinkedExpression])> {
    value.as_reference()
}

pub(crate) fn record<'a>(
    entry: &LinkedEntry,
    program: &'a Program<'a>,
) -> Option<(&'a LinkedEntry, Vec<LinkedBinding>, Vec<LinkedExpression>)> {
    let LinkedType::Record(fields) = &entry.value else {
        return None;
    };
    if fields.len() != 1 {
        return None;
    }
    let (id, bindings, args) = reference(&fields[0].value)?;
    let common = program.entries.iter().find(|e| e.id == id)?;
    (matches!(common.value, LinkedType::Record(_))
        && !matches!(
            super::attributes::content(&common.xml).0,
            LinkedXml::TextPattern(_)
        ))
    .then(|| (common, bindings.to_vec(), args.to_vec()))
}
pub(super) fn generate(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Option<String>, Diagnostic> {
    let Some((common, bindings, args)) = record(entry, program) else {
        return Ok(None);
    };
    plain_shape(entry)?;
    if !common.shorthands.is_empty() || common.normalization.is_some() {
        return Err(unsupported(
            common,
            "Composite shorthand and normalization are not generated",
        ));
    }

    if !entry.constraints.is_empty() {
        return Err(unsupported(
            common,
            "Composite constraints are not generated yet",
        ));
    }
    let (
        LinkedType::Record(fields),
        LinkedXml::Record(xml),
        YamlRepresentation::Mapping(yaml),
        LinkedXml::Record(owner_xml),
        YamlRepresentation::Mapping(owner_yaml),
    ) = (
        &common.value,
        &common.xml,
        &common.yaml,
        &entry.xml,
        &entry.yaml,
    )
    else {
        return Err(unsupported(
            common,
            "Composite requires record representations",
        ));
    };
    let mut collections = fields.iter().filter_map(|field| {
        let (id, _, _) = reference(&field.value)?;
        let value = program.entries.iter().find(|entry| entry.id == id)?;
        matches!(value.value, LinkedType::Sequence(_)).then_some((field, value))
    });
    let (child, text) = collections
        .next()
        .ok_or_else(|| unsupported(common, "Composite requires a collection"))?;
    if collections.next().is_some() {
        return Err(unsupported(
            common,
            "Several shared-wrapper collections require disjoint event routes",
        ));
    }
    let child_xml = xml.iter().find(|field| field.field == child.name).unwrap();
    if !child_xml.path.is_empty() || child_xml.attribute.is_some() {
        return Err(unsupported(
            common,
            "Shared-wrapper collection requires an empty relative route",
        ));
    }
    let (collection_xml, collection_attributes) = attributes::content(&text.xml);
    let LinkedXml::ElementSequence {
        path: collection_path,
        ..
    } = collection_xml
    else {
        return Err(unsupported(
            text,
            "Composite collection requires element routes",
        ));
    };
    if xml
        .iter()
        .filter(|field| field.field != child.name)
        .any(|field| {
            if let Some(attribute) = &field.attribute {
                collection_attributes
                    .iter()
                    .any(|declared| declared.name == *attribute)
            } else {
                field.path.starts_with(collection_path) || collection_path.starts_with(&field.path)
            }
        })
    {
        return Err(unsupported(
            common,
            "Scalar and collection XML routes must not overlap",
        ));
    }
    let child_key = &yaml
        .iter()
        .find(|field| field.field == child.name)
        .unwrap()
        .key;
    let flat = super::composite_scalars::lower(entry, common, child, &bindings, &args)?;
    let scalar_source = super::composite_scalars::generate(&flat, program, &owner_xml[0].path)?;
    let scalar_conditions = std::cell::RefCell::new(String::new());
    let condition_count = std::cell::Cell::new(0usize);
    let nested = nested_owner(entry, common, child, program)?;
    let mut source = collections::generate_embedded(&nested, program, "pub(super) ")?
        .ok_or_else(|| unsupported(common, "Nested collection is not generated"))?;
    source.push_str(&constraints::generate(&nested, program)?);
    // Internal entry points reuse the complete collection generator. Only the
    // event reader and writer are used by this parent specialization.
    let id = entry.id;
    let n = nested.id;
    let child_index = fields.iter().position(|f| f.name == child.name).unwrap();
    let LinkedType::Record(scalar_fields) = &flat.value else {
        unreachable!()
    };
    let mut defaults = String::new();
    let storage=fields.iter().map(|field| {
        if field.name==child.name {Ok(("*rows".to_owned(),"child_present".to_owned()))}
        else {
            let index=scalar_fields.iter().position(|candidate|candidate.name==field.name).unwrap();
            let codec=scalar::Codec::resolve(&field.value,&flat,program)?;
            let presence=scalar_presence::rule(&flat,index,&field.value,program);
            let default=scalar_presence::missing(presence.and_then(|rule|rule.xml_missing.as_ref()),&codec,&format!("E{id}F{index}"),&flat,program)?;
            writeln!(defaults,"let default_{index}:Option<{}>={default};let _=&default_{index};",codec.rust_type(&format!("E{id}F{index}"))).unwrap();
            let reference=format!("_value.f{index}.as_ref().or(default_{index}.as_ref()).ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"A condition requires a scalar meaning\"))?");
            Ok((codec.meaning_reference(&format!("E{id}F{index}"),&reference),format!("_value.f{index}.is_some()")))
        }
    }).collect::<Result<Vec<_>,Diagnostic>>()?;
    let lower = |expr: &LinkedExpression| -> Result<String, Diagnostic> {
        let expr = shorthand::specialize(expr, &bindings, &args, entry)?;
        let mut expressions =
            expressions::Expressions::new(common, program, fields, Some(&storage));
        let code = expressions.lower(&expr)?;
        let slot = condition_count.get();
        condition_count.set(slot + 1);
        writeln!(scalar_conditions.borrow_mut(),"pub(super) fn condition_{slot}(value:&Stored,rows:&core::Sequence<super::nested_{id}::R{n}>,child_present:bool,_inputs:&PreparedInputs)->core::Result<bool> {{let _value=&value.0;let _=(rows,child_present);{defaults}{} Ok({code})}}",expressions.constants).unwrap();
        Ok(format!(
            "scalars_{id}::condition_{slot}(&_value.scalars,&_value.child.rows,_value.child_present,inputs)?"
        ))
    };
    let parent_path = record::path_code(&owner_xml[0].path[..owner_xml[0].path.len() - 1]);
    let mut canonical = String::new();
    let mut omit = String::from("false");
    let mut missing = String::new();
    for presence in &common.presence {
        if presence.target == LinkedPresenceTarget::SelfValue {
            if presence.xml_missing.is_some()
                || presence.yaml_missing.is_some()
                || !presence.xml_empty.is_empty()
                || !presence.yaml_empty.is_empty()
                || presence.yaml_omit_when.is_some()
            {
                return Err(unsupported(
                    common,
                    "Composite self presence is not generated",
                ));
            }
            for form in &presence.canonical {
                match form.form {
                    XmlForm::Missing => {
                        let condition = form
                            .when
                            .as_ref()
                            .map(&lower)
                            .transpose()?
                            .unwrap_or_else(|| "true".into());
                        write!(
                            canonical,
                            "if {condition} {{out.ensure_container({parent_path});return Ok(());}}"
                        )
                        .unwrap();
                    }
                    XmlForm::Ordinary if form.when.is_none() => (),
                    _ => return Err(unsupported(common, "Composite XML form is not generated")),
                }
            }
            continue;
        }
        if presence.target != LinkedPresenceTarget::Field(child_index as u32) {
            continue;
        }
        if presence.xml_missing.is_some()
            || !presence.xml_empty.is_empty()
            || !presence.yaml_empty.is_empty()
            || !presence.canonical.is_empty()
        {
            return Err(unsupported(
                common,
                "Composite presence form is not generated",
            ));
        }
        if let Some(expr) = &presence.yaml_missing {
            if !matches!(&expr.kind,LinkedExpressionKind::Operation {operator:LinkedOperator::Sequence,arguments} if arguments.is_empty())
            {
                return Err(unsupported(
                    common,
                    "Composite missing field currently requires an empty sequence",
                ));
            }
            missing = String::from(
                "if present && !child_present { child.rows=core::Sequence::Present(Vec::new()); }",
            );
        }
        if let Some(expr) = &presence.yaml_omit_when {
            omit = lower(expr)?;
        }
    }
    let child_mut = if missing.is_empty() { "" } else { "mut " };
    let mut checks = String::new();
    for constraint in &common.constraints {
        if constraint.applies_to != [ValidationPhase::YamlValidation]
            || constraint.for_each.is_some()
            || constraint.when.is_some()
            || !constraint.forms.is_empty()
        {
            return Err(unsupported(
                common,
                "Composite constraint applicability is not generated",
            ));
        }
        let assertion = lower(&constraint.assertion)?;
        let assertion = assertion.strip_suffix('?').unwrap_or(&assertion);
        let message = constraint
            .diagnostic
            .message
            .iter()
            .map(|p| match p {
                LinkedMessagePart::Text(t) => Ok(t.clone()),
                _ => Err(unsupported(
                    common,
                    "Composite diagnostic interpolation is not generated",
                )),
            })
            .collect::<Result<Vec<_>, _>>()?
            .concat();
        let code = constraint.diagnostic.code.as_deref();
        let source = constraint.diagnostic.source.as_deref();
        let severity = match constraint.diagnostic.severity {
            Severity::Error => "Error",
            Severity::Warning => "Warning",
            Severity::Info => "Info",
        };
        let address = match constraint.diagnostic.at {
            LinkedDiagnosticTarget::SelfValue => String::new(),
            LinkedDiagnosticTarget::Field(index) => format!(
                ".field({:?})",
                yaml.iter()
                    .find(|m| m.field == fields[index as usize].name)
                    .expect("linked field")
                    .key
            ),
            _ => {
                return Err(unsupported(
                    common,
                    "Composite occurrence diagnostic requires iteration",
                ));
            }
        };
        write!(checks,"if value.yaml_present {{ match {assertion} {{Ok(false)=>issues.push(value.position.apply(source,RuntimeDiagnostic::declared({code:?},{source:?},Severity::{severity},{message:?}){address})),Err(error)=>issues.push(error),_=>{{}}}} }}").unwrap();
    }

    let key = &owner_yaml[0].key;
    let path = record::path_code(&owner_xml[0].path);
    let (
        LinkedXml::ElementSequence {
            path: relative,
            item,
        },
        _,
    ) = attributes::content(&text.xml)
    else {
        return Err(unsupported(text, "Expected XML collection"));
    };
    let LinkedXml::Record(leaves) = item.as_ref() else {
        return Err(unsupported(text, "Expected XML item record"));
    };
    let scalar = leaves
        .iter()
        .map(|leaf| {
            let path = owner_xml[0]
                .path
                .iter()
                .chain(relative)
                .chain(&leaf.path)
                .cloned()
                .collect::<Vec<_>>();
            format!("core::xml::matches(path,{})", record::path_code(&path))
        })
        .collect::<Vec<_>>()
        .join(" || ");
    let scalar = format!("({scalar}) || scalars_{id}::scalar(&value.scalars,path)");
    let scalar_conditions = scalar_conditions.into_inner();
    let physical = owner_xml[0]
        .path
        .last()
        .ok_or_else(|| unsupported(entry, "Missing property path"))?;
    let physical_key = &physical.local;
    let physical_ns = &physical.namespace;
    let raw_key = if key == physical_key {
        format!("{key:?}")
    } else {
        format!("if value.present {{{key:?}}} else {{{physical_key:?}}}")
    };
    let parent_path = record::path_code(&owner_xml[0].path[..owner_xml[0].path.len() - 1]);
    let namespaces = text
        .namespaces
        .iter()
        .chain(&common.namespaces)
        .chain(&entry.namespaces)
        .map(|n| (n.name.as_str(), n.value.as_str()))
        .collect::<Vec<_>>();
    let writer_namespaces = namespaces
        .iter()
        .map(|(_, uri)| *uri)
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect::<Vec<_>>();
    let (_, declared_attributes) = attributes::content(&text.xml);
    let known_attributes = declared_attributes
        .iter()
        .map(|attribute| {
            (
                attribute.name.namespace.as_str(),
                attribute.name.local.as_str(),
            )
        })
        .collect::<Vec<_>>();
    let qnames = declared_attributes
        .iter()
        .filter(|a| matches!(a.value, LinkedXmlAttributeValue::QName(_)))
        .map(|a| (a.name.namespace.as_str(), a.name.local.as_str()))
        .collect::<Vec<_>>();
    let mut out = format!(
        "#[allow(dead_code)] mod nested_{id} {{ use super::*; {source} pub(super) fn read_document(source:&[u8],inputs:&PreparedInputs)->core::Result<V{n}>{{read_yaml_{n}(source,inputs)}} }}\n#[allow(dead_code)] mod scalars_{id} {{use super::*;{scalar_source}{scalar_conditions}}}\nstruct V{id} {{ scalars:scalars_{id}::Stored, child: nested_{id}::V{n}, present: bool, #[allow(dead_code)] child_present: bool, yaml_present: bool, #[allow(dead_code)] position:core::Position, raw: Option<core::xml::Patch> }}\n"
    );
    writeln!(out,r#"fn read_xml_{id}(source:&[u8],inputs:&PreparedInputs)->core::Result<V{id}> {{read_xml_events_{id}(source,inputs,core::xml::DocumentSource(source))}}
fn read_xml_events_{id}(source:&[u8],inputs:&PreparedInputs,events:impl core::xml::Source)->core::Result<V{id}> {{
let mut child=None;let mut scalar_seen=false;
let scalars=scalars_{id}::read_xml(source,inputs,core::xml::Events(|consume:&mut core::xml::Consumer<'_>|{{
child=Some(nested_{id}::read_xml_events_{n}(source,inputs,events,|path,token|{{
if scalars_{id}::route(path,token) {{scalar_seen=true;consume(path,token)?;return Ok(true);}}
if scalars_{id}::boundary(path,token) {{consume(path,token)?;}}
if core::xml::matches(path,{path}) && let core::xml::Token::Attribute(a)=token && !{known_attributes:?}.contains(&(a.name.namespace.as_str(),a.name.local.as_str())) {{return Ok(true);}}
Ok(false)}})?);Ok(())}}))?;
let child=child.expect("collection reader completed");let child_present=child.rows.is_present();let present=scalar_seen || child_present;
Ok(V{id}{{scalars,child,present,child_present,yaml_present:false,position:core::Position::default(),raw:None}}) }}
fn read_plain_yaml_{id}(source:&[u8],inputs:&PreparedInputs)->core::Result<V{id}> {{
match read_yaml_events_{id}(source,inputs,core::yaml::DocumentSource(if source.is_empty() {{b"{{}}"}} else {{source}})) {{Ok(value)=>Ok(value),Err(error)=>{{
let pieces=match core::yaml::split_record_properties(source,{key:?},&[scalars_{id}::KEYS,&[{child_key:?}]]) {{Ok(pieces)=>pieces,Err(_)=>return Err(error)}};
let child_present=pieces.present[1];let pieces=pieces.parts;
let scalars=scalars_{id}::read_document(&pieces[0],inputs)?;let {child_mut}child=nested_{id}::read_document(&pieces[1],inputs)?;
let present=true;{missing}
Ok(V{id}{{scalars,child,present,child_present,yaml_present:present,position:core::Position::default(),raw:None}})
}}}} }}
fn read_yaml_events_{id}(source:&[u8],inputs:&PreparedInputs,events:impl core::yaml::Source)->core::Result<V{id}> {{
let mut seen=core::yaml::RecordState::default();let mut child=None;let mut child_present=false;let mut scalar_seen=false;
let scalars=scalars_{id}::read_yaml(source,inputs,core::yaml::Events(|scalar_consume:&mut core::yaml::Consumer<'_>|{{
child=Some(nested_{id}::read_yaml_events_{n}(source,inputs,true,core::yaml::Events(|child_consume:&mut core::yaml::Consumer<'_>|{{
core::yaml::visit_partitions(core::yaml::MappingPropertySource{{source:events,property:{key:?},seen:&mut seen}},|key|{{if key=={child_key:?} {{child_present=true;Some(1)}} else if scalars_{id}::KEYS.contains(&key) {{scalar_seen=true;Some(0)}} else {{None}}}},|slot,node,position|{{match slot {{Some(0)=>scalar_consume(node,position),Some(1)=>child_consume(node,position),None=>{{match node {{core::yaml::Node::MappingStart(None)=>{{scalar_consume(core::yaml::Node::MappingStart(None),position)?;child_consume(core::yaml::Node::MappingStart(None),position)}},core::yaml::Node::MappingEnd=>{{scalar_consume(core::yaml::Node::MappingEnd,position)?;child_consume(core::yaml::Node::MappingEnd,position)}},_=>unreachable!("mapping boundary")}}}},_=>unreachable!("record partition")}}}})
}}))?);Ok(())}}));
let scalars=match scalars {{Ok(value)=>value,Err(error) if !seen.present && child.is_some()=>{{let _=error;scalars_{id}::empty(inputs)?}},Err(error)=>return Err(error)}};
let {child_mut}child=child.expect("collection reader completed");let present=seen.present;
{missing}
let yaml_present=present;let present=scalar_seen || child.rows.is_present();
Ok(V{id}{{scalars,child,present,child_present,yaml_present,position:seen.position,raw:None}}) }}
fn check_xml_{id}(value:&V{id},source:&[u8],inputs:&PreparedInputs)->Vec<RuntimeDiagnostic> {{nested_{id}::check_xml_{n}(&value.child,source,inputs).into_iter().chain(scalars_{id}::check_xml(&value.scalars,source,inputs)).map(prefix_{id}).collect()}}
fn check_yaml_{id}(value:&V{id},source:&[u8],inputs:&PreparedInputs)->Vec<RuntimeDiagnostic> {{ let _value=value; let mut issues=nested_{id}::check_yaml_{n}(&value.child,source,inputs); if value.yaml_present {{issues.extend(scalars_{id}::check_yaml(&value.scalars,source,inputs));}}
{checks} issues.into_iter().map(prefix_{id}).collect() }}
struct XmlPrepared{id} {{scalars:scalars_{id}::Prepared,tree:Option<core::xml::Tree>}}
fn write_plain_xml_{id}(value:&V{id},inputs:&PreparedInputs)->core::Result<Vec<u8>> {{let prepared=XmlPrepared{id}{{scalars:scalars_{id}::prepare(&value.scalars,inputs)?,tree:None}};let mut namespaces=Vec::new();namespaces_xml_{id}(value,&prepared,&mut namespaces);let mut out=core::xml::Writer::new(&namespaces);write_xml_fields_{id}(value,&prepared,inputs,&mut out)?;Ok(out.finish())}}
fn write_xml_fields_{id}<'a>(value:&V{id},prepared:&'a XmlPrepared{id},inputs:&PreparedInputs,out:&mut core::xml::Writer<'a>)->core::Result<()> {{
let _value=value;{canonical}
scalars_{id}::with_attributes(&value.scalars,|fields|{{
nested_{id}::write_xml_fields_{n}(&value.child,inputs,fields.iter().flatten(),value.present,out)
}})?;
if value.present {{scalars_{id}::write_elements(&value.scalars,&prepared.scalars,inputs,out)?;}}Ok(()) }}
fn write_yaml_{id}(value:&V{id},inputs:&PreparedInputs)->core::Result<Vec<u8>> {{let mut out=String::new();write_yaml_into_{id}(value,inputs,&mut out)?;Ok(out.into_bytes())}}
fn write_yaml_into_{id}(value:&V{id},inputs:&PreparedInputs,out:&mut String)->core::Result<()> {{
if let Some(patch)=&value.raw {{
let meaning=prepare_yaml_{id}(value,inputs,true)?;
let payload=patch.to_yaml();
let encoded=core::raw::Property::encode({key:?},{physical_key:?},&meaning,payload.as_bytes())?;
core::yaml::append_encoded_properties(out,&encoded)
}} else {{prepare_yaml_into_{id}(value,inputs,true,out)}} }}
fn prepare_yaml_{id}(value:&V{id},inputs:&PreparedInputs,shorten:bool)->core::Result<Vec<u8>> {{let mut out=String::new();prepare_yaml_into_{id}(value,inputs,shorten,&mut out)?;Ok(out.into_bytes())}}
fn prepare_yaml_into_{id}(value:&V{id},inputs:&PreparedInputs,shorten:bool,out:&mut String)->core::Result<()> {{
core::yaml::append_properties(out,|out| {{
let _value=value;let start=out.len();out.push_str(&core::yaml::scalar({key:?}));out.push(':');
if value.present {{scalars_{id}::write_yaml(&value.scalars,inputs,out,"  ")?;}}
let scalar_end=out.len();
if !({omit}) {{nested_{id}::prepare_yaml_into_{n}(&value.child,inputs,shorten,out,"  ")?;}}
if out.len()==scalar_end && !scalars_{id}::has_meaning(&value.scalars,inputs)? {{out.truncate(start);}} Ok(()) }}) }}
fn verify_{id}(original:&[u8],candidate:&[u8],inputs:&PreparedInputs)->core::Result<()> {{let value=read_yaml_{id}(candidate,inputs)?;if let Some(error)=check_yaml_{id}(&value,candidate,inputs).into_iter().find(|e|e.severity==Severity::Error) {{return Err(error);}} prove_xml_{id}(&value,original,&write_xml_{id}(&value,inputs)?)}}
fn prefix_{id}(mut error:RuntimeDiagnostic)->RuntimeDiagnostic {{error.path.insert(0,{key:?}.into());error}}
fn read_yaml_{id}(source:&[u8],inputs:&PreparedInputs)->core::Result<V{id}> {{
match read_plain_yaml_{id}(source,inputs) {{Ok(value)=>Ok(value),Err(error)=>{{
if !matches!(error.code.as_deref(),Some("yaml.record-form"|"yaml.annotation")) {{return Err(error);}}
let Some(envelope)=core::raw::Property::decode(source,{key:?},{physical_key:?})? else {{return Err(error);}};
let mut value=read_plain_yaml_{id}(&envelope.meaning,inputs)?;
if !envelope.has_semantic && !envelope.uses_semantic_name {{value.present=false;value.child.rows=core::Sequence::Absent;}}
value.raw=Some(core::xml::Patch::read(&envelope.payload,&{namespaces:?},&{qnames:?})?);Ok(value)
}}}} }}
fn prepare_xml_{id}(value:&V{id},inputs:&PreparedInputs)->core::Result<XmlPrepared{id}> {{
let scalars=scalars_{id}::prepare(&value.scalars,inputs)?;let Some(patch)=&value.raw else {{return Ok(XmlPrepared{id}{{scalars,tree:None}});}};
let ordinary=write_plain_xml_{id}(value,inputs)?;
let tree=core::xml::Tree::capture(&ordinary,{path})?;
Ok(XmlPrepared{id}{{scalars,tree:Some(patch.apply(tree,core::xml::Name{{namespace:{physical_ns:?}.into(),local:{physical_key:?}.into()}},&{namespaces:?},&{qnames:?})?)}})
}}
fn namespaces_xml_{id}<'a>(_value:&'a V{id},prepared:&'a XmlPrepared{id},namespaces:&mut Vec<&'a str>) {{
for namespace in &{writer_namespaces:?} {{if !namespaces.contains(namespace) {{namespaces.push(namespace);}}}}
for namespace in nested_{id}::XML_NAMESPACES_{n} {{if !namespaces.contains(namespace) {{namespaces.push(namespace);}}}}
scalars_{id}::namespaces(&_value.scalars,&prepared.scalars,namespaces);
if let Some(tree)=&prepared.tree {{tree.collect_namespaces(namespaces);}}
}}
fn write_xml_into_{id}<'a>(value:&V{id},prepared:&'a XmlPrepared{id},inputs:&PreparedInputs,out:&mut core::xml::Writer<'a>)->core::Result<()> {{
if let Some(tree)=&prepared.tree {{tree.write_at(out,{parent_path},&{qnames:?})}} else {{write_xml_fields_{id}(value,prepared,inputs,out)}}
}}
fn write_xml_{id}(value:&V{id},inputs:&PreparedInputs)->core::Result<Vec<u8>> {{
let prepared=prepare_xml_{id}(value,inputs)?;let mut namespaces=Vec::new();namespaces_xml_{id}(value,&prepared,&mut namespaces);let mut out=core::xml::Writer::new(&namespaces);write_xml_into_{id}(value,&prepared,inputs,&mut out)?;Ok(out.finish())
}}
fn finalize_yaml_{id}(original:&[u8],candidate:Vec<u8>,value:&V{id},inputs:&PreparedInputs)->core::Result<Vec<u8>> {{
match verify_{id}(original,&candidate,inputs) {{Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>{{}},Err(error)=>return Err(error)}}
let full=prepare_yaml_{id}(value,inputs,false)?;
if full!=candidate {{match verify_{id}(original,&full,inputs) {{Ok(())=>return Ok(full),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>{{}},Err(error)=>return Err(error)}}}}
let tree=core::xml::Tree::capture(original,{path})?.ok_or_else(||RuntimeDiagnostic::new("xml.preservation-shape","Cannot preserve absent property"))?;
let ordinary=write_plain_xml_{id}(&read_plain_yaml_{id}(&candidate,inputs)?,inputs)?;
let ordinary=core::xml::Tree::capture(&ordinary,{path})?;
let payload=tree.patch_yaml(ordinary.as_ref(),&{namespaces:?},&{qnames:?})?;
let raw_key={raw_key};
let annotated=core::raw::Property::encode({key:?},raw_key,&candidate,payload.as_bytes())?;
verify_{id}(original,&annotated,inputs)?;Ok(annotated) }}
"#).unwrap();
    out.push_str(&super::proof::qnames(id, &format!("vec!{qnames:?}")));
    out.push_str(&super::proof::generate(
        id,
        &scalar,
        &format!("{qnames:?}.contains(&(name.namespace.as_str(),name.local.as_str()))"),
        "false",
    ));
    Ok(Some(out))
}

pub(crate) fn nested_owner(
    entry: &LinkedEntry,
    common: &LinkedEntry,
    child: &LinkedField,
    program: &Program,
) -> Result<LinkedEntry, Diagnostic> {
    let (_, bindings, args) =
        record(entry, program).ok_or_else(|| unsupported(entry, "Expected a record reference"))?;
    let (text_id, child_bind, child_args) =
        reference(&child.value).ok_or_else(|| unsupported(common, "Expected a child reference"))?;
    let (
        LinkedXml::Record(owner_xml),
        YamlRepresentation::Mapping(owner_yaml),
        YamlRepresentation::Mapping(yaml),
    ) = (&entry.xml, &entry.yaml, &common.yaml)
    else {
        return Err(unsupported(entry, "Expected record routes"));
    };
    let child_key = &yaml
        .iter()
        .find(|f| f.field == child.name)
        .ok_or_else(|| unsupported(common, "Child YAML route missing"))?
        .key;
    let mut nested = entry.clone();
    nested.id = u32::MAX - entry.id;
    nested.value = LinkedType::Record(vec![LinkedField {
        name: child.name.clone(),
        value: LinkedType::BoundReference {
            entry: text_id,
            bindings: child_bind
                .iter()
                .map(|b| {
                    Ok(LinkedBinding {
                        slot: b.slot,
                        value: shorthand::specialize(&b.value, &bindings, &args, entry)?,
                    })
                })
                .collect::<Result<_, Diagnostic>>()?,
            arguments: child_args
                .iter()
                .map(|a| shorthand::specialize(a, &bindings, &args, entry))
                .collect::<Result<_, _>>()?,
        },
        source: child.source.clone(),
    }]);
    let mut route = owner_xml[0].clone();
    route.field = child.name.clone();
    nested.xml = LinkedXml::Record(vec![route]);
    let mut mapping = owner_yaml[0].clone();
    mapping.field = child.name.clone();
    mapping.key = child_key.clone();
    nested.yaml = YamlRepresentation::Mapping(vec![mapping]);
    Ok(nested)
}
