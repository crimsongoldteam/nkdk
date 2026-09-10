use super::*;
use std::fmt::Write;

pub(crate) fn reference(
    value: &LinkedType,
) -> Option<(u32, &[LinkedBinding], &[LinkedExpression])> {
    match value {
        LinkedType::Reference(id) => Some((*id, &[], &[])),
        LinkedType::BoundReference {
            entry,
            bindings,
            arguments,
        } => Some((*entry, bindings, arguments)),
        _ => None,
    }
}
pub(crate) fn record<'a>(
    entry: &LinkedEntry,
    program: &'a Program,
) -> Option<(&'a LinkedEntry, Vec<LinkedBinding>, Vec<LinkedExpression>)> {
    let LinkedType::Record(fields) = &entry.value else {
        return None;
    };
    if fields.len() != 1 {
        return None;
    }
    let (id, bindings, args) = reference(&fields[0].value)?;
    let common = program.entries.iter().find(|e| e.id == id)?;
    matches!(common.value, LinkedType::Record(_))
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
    if fields.len() != 2 {
        return Err(unsupported(
            common,
            "Composite requires a collection and scalar attribute",
        ));
    }
    let mut collection = None;
    let mut flag = None;
    for field in fields {
        let (id, bind, arguments) = reference(&field.value)
            .ok_or_else(|| unsupported(common, "Composite field requires a declared value"))?;
        let value = program
            .entries
            .iter()
            .find(|e| e.id == id)
            .expect("linked field");
        match &value.value {
            LinkedType::Sequence(_) => collection = Some((field, value, bind, arguments)),
            LinkedType::Scalar(ScalarType::Boolean) => flag = Some((field, value)),
            _ => {
                return Err(unsupported(
                    common,
                    "Composite field shape is not generated",
                ));
            }
        }
    }
    let (child, text, _, _) =
        collection.ok_or_else(|| unsupported(common, "Composite collection missing"))?;
    let (flag, boolean) = flag.ok_or_else(|| unsupported(common, "Composite attribute missing"))?;
    let child_xml = xml
        .iter()
        .find(|f| f.field == child.name)
        .expect("linked child");
    let flag_xml = xml
        .iter()
        .find(|f| f.field == flag.name)
        .expect("linked flag");
    let attribute = flag_xml
        .attribute
        .as_ref()
        .ok_or_else(|| unsupported(common, "Boolean needs an attribute"))?;
    if !child_xml.path.is_empty()
        || !flag_xml.path.is_empty()
        || child_xml.attribute.is_some()
        || !attribute.namespace.is_empty()
    {
        return Err(unsupported(
            common,
            "Composite requires a shared wrapper and unqualified attribute",
        ));
    }
    let child_key = &yaml
        .iter()
        .find(|f| f.field == child.name)
        .expect("linked child key")
        .key;
    let flag_key = &yaml
        .iter()
        .find(|f| f.field == flag.name)
        .expect("linked flag key")
        .key;
    let (LinkedXml::BooleanTable(xml_values), YamlRepresentation::BooleanTable(yaml_values)) =
        (&boolean.xml, &boolean.yaml)
    else {
        return Err(unsupported(boolean, "Boolean flag requires finite tables"));
    };
    let xml_true = &xml_values
        .iter()
        .find(|v| v.value)
        .ok_or_else(|| unsupported(boolean, "True XML spelling missing"))?
        .text;
    let xml_false = &xml_values
        .iter()
        .find(|v| !v.value)
        .ok_or_else(|| unsupported(boolean, "False XML spelling missing"))?
        .text;
    if yaml_values.len() != 1 || !yaml_values[0].value {
        return Err(unsupported(
            boolean,
            "Flag requires a true-only YAML spelling",
        ));
    }
    let yaml_true = &yaml_values[0].text;
    for xml in [false, true] {
        if !boolean.presence.iter().any(|p| {
            p.target == LinkedPresenceTarget::SelfValue
                && (if xml { &p.xml_missing } else { &p.yaml_missing })
                    .as_ref()
                    .is_some_and(|e| {
                        matches!(
                            e.kind,
                            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(false))
                        )
                    })
        }) {
            return Err(unsupported(
                boolean,
                "Flag must declare XML and YAML missing as false",
            ));
        }
    }
    let nested = nested_owner(entry, common, child, program)?;
    let mut source = collections::generate_embedded(&nested, program, "pub(super) ")?
        .ok_or_else(|| unsupported(common, "Nested collection is not generated"))?;
    source.push_str(&constraints::generate(&nested, program)?);
    // Internal entry points reuse the complete collection generator. Only the
    // event reader and writer are used by this parent specialization.
    let id = entry.id;
    let n = nested.id;
    let child_index = fields.iter().position(|f| f.name == child.name).unwrap();
    let storage = fields
        .iter()
        .map(|f| {
            if f.name == child.name {
                (
                    String::from("_value.child.rows"),
                    String::from("_value.child_present"),
                )
            } else {
                (String::from("_value.flag"), String::from("true"))
            }
        })
        .collect::<Vec<_>>();
    let lower = |expr: &LinkedExpression| -> Result<String, Diagnostic> {
        let expr = shorthand::specialize(expr, &bindings, &args, entry)?;
        let mut expressions = expressions::Expressions {
            entry: common,
            program,
            fields,
            field_storage: Some(&storage),
            constants: String::new(),
            next_constant: 0,
            transforms: BTreeSet::new(),
            fallible: false,
        };
        let code = expressions.lower(&expr)?;
        if expressions.constants.is_empty() {
            Ok(code)
        } else {
            Ok(format!("{{ {} {code} }}", expressions.constants))
        }
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
                        write!(canonical,"if {condition} {{let mut out=core::xml::Writer::new(&[]);out.container({parent_path});return Ok(out.finish());}}").unwrap();
                    }
                    XmlForm::Ordinary if form.when.is_none() => (),
                    _ => return Err(unsupported(common, "Composite XML form is not generated")),
                }
            }
            continue;
        }
        if presence.target != LinkedPresenceTarget::Field(child_index as u32)
            || presence.xml_missing.is_some()
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
        write!(checks,"if value.yaml_present && !({assertion}) {{ issues.push(value.position.apply(source,RuntimeDiagnostic::declared({code:?},{source:?},Severity::{severity},{message:?}){address})); }}").unwrap();
    }

    let key = &owner_yaml[0].key;
    let path = record::path_code(&owner_xml[0].path);
    let attr = &attribute.local;
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
    let qnames = declared_attributes
        .iter()
        .filter(|a| matches!(a.value, LinkedXmlAttributeValue::QName(_)))
        .map(|a| (a.name.namespace.as_str(), a.name.local.as_str()))
        .collect::<Vec<_>>();
    let mut out = format!(
        "#[allow(dead_code)] mod nested_{id} {{ use super::*; {source} }}\nstruct V{id} {{ flag: bool, child: nested_{id}::V{n}, present: bool, child_present: bool, yaml_present: bool, position:core::Position, raw: Option<core::xml::Patch> }}\n"
    );
    writeln!(out,r#"fn read_xml_{id}(source:&[u8],inputs:&PreparedInputs)->core::Result<V{id}> {{
let mut flag=false;let mut attribute_seen=false;
let child=nested_{id}::read_xml_with_{n}(source,inputs,|path,token| {{
if core::xml::matches(path,{path}) && let core::xml::Token::Attribute(a)=token && a.name.namespace.is_empty() && a.name.local=={attr:?} {{
attribute_seen=true;flag=match a.text.as_str() {{{xml_true:?}=>true,{xml_false:?}=>false,_=>return Err(RuntimeDiagnostic::new("xml.attribute-value","Invalid boolean attribute"))}};return Ok(true); }} Ok(false) }})?;
let child_present=child.rows.is_present();let present=attribute_seen || child_present;
Ok(V{id}{{flag,child,present,child_present,yaml_present:false,position:core::Position::default(),raw:None}}) }}
fn read_plain_yaml_{id}(source:&[u8],inputs:&PreparedInputs)->core::Result<V{id}> {{
let mut flag=false;let mut seen=core::yaml::RecordState::default();
let mut child=nested_{id}::read_yaml_events_{n}(source,inputs,true,core::yaml::RecordSource {{source,property:{key:?},child:{child_key:?},seen:&mut seen,sibling:|key:&str,node:core::yaml::Node,_position:core::Position| {{
if key!={flag_key:?} {{return Err(RuntimeDiagnostic::new("yaml.unknown-field","Unknown record field"));}}
let core::yaml::Node::Scalar(value,None)=node else {{return Err(RuntimeDiagnostic::new("yaml.expected-text","Expected flag spelling"));}};
if value.into_text()? != {yaml_true:?} {{return Err(RuntimeDiagnostic::new("yaml.literal","Unexpected flag spelling"));}} flag=true; Ok(()) }} }})?;
let present=seen.present;let child_present=seen.child_present;
{missing}
let yaml_present=present;let present=flag || child.rows.is_present();
Ok(V{id}{{flag,child,present,child_present,yaml_present,position:seen.position,raw:None}}) }}
fn check_xml_{id}(value:&V{id},source:&[u8],inputs:&PreparedInputs)->Vec<RuntimeDiagnostic> {{nested_{id}::check_xml_{n}(&value.child,source,inputs).into_iter().map(prefix_{id}).collect()}}
fn check_yaml_{id}(value:&V{id},source:&[u8],inputs:&PreparedInputs)->Vec<RuntimeDiagnostic> {{ let _value=value; let mut issues=nested_{id}::check_yaml_{n}(&value.child,source,inputs); {checks} issues.into_iter().map(prefix_{id}).collect() }}
fn write_plain_xml_{id}(value:&V{id},inputs:&PreparedInputs)->core::Result<Vec<u8>> {{
let _value=value;{canonical}
let attributes=[core::xml::WriteAttribute{{name:("",{attr:?}),value:core::xml::AttributeValue::Text(if value.flag {{{xml_true:?}}} else {{{xml_false:?}}})}}];
if value.present && !value.child.rows.is_present() {{let mut out=core::xml::Writer::new(&[]);out.container_with_attributes({path},&attributes);return Ok(out.finish());}}
nested_{id}::write_xml_attributes_{n}(&value.child,inputs,&attributes,value.present) }}
fn write_yaml_{id}(value:&V{id},inputs:&PreparedInputs)->core::Result<Vec<u8>> {{ prepare_yaml_{id}(value,inputs,true) }}
fn prepare_yaml_{id}(value:&V{id},inputs:&PreparedInputs,shorten:bool)->core::Result<Vec<u8>> {{
let _value=value;let child=if {omit} {{Vec::new()}} else {{nested_{id}::prepare_yaml_{n}(&value.child,inputs,shorten)?}};
if child.is_empty() && !value.flag {{return Ok(Vec::new());}}
let mut out=core::yaml::scalar({key:?});out.push(':');
if value.flag {{out.push_str("\n  ");out.push_str(&core::yaml::scalar({flag_key:?}));out.push_str(": ");out.push_str(&core::yaml::scalar({yaml_true:?}));}}
for line in std::str::from_utf8(&child).map_err(|e|RuntimeDiagnostic::new("yaml.encoding",e.to_string()))?.lines() {{out.push_str("\n  ");out.push_str(line);}} Ok(out.into_bytes()) }}
fn verify_{id}(original:&[u8],candidate:&[u8],inputs:&PreparedInputs)->core::Result<()> {{let value=read_yaml_{id}(candidate,inputs)?;if let Some(error)=check_yaml_{id}(&value,candidate,inputs).into_iter().find(|e|e.severity==Severity::Error) {{return Err(error);}} core::proof::verify_with_attributes(original,&write_xml_{id}(&value,inputs)?,|path|{scalar},|_path,name|{qnames:?}.contains(&(name.namespace.as_str(),name.local.as_str())))}}
fn prefix_{id}(mut error:RuntimeDiagnostic)->RuntimeDiagnostic {{error.path.insert(0,{key:?}.into());error}}
fn read_yaml_{id}(source:&[u8],inputs:&PreparedInputs)->core::Result<V{id}> {{
match read_plain_yaml_{id}(source,inputs) {{Ok(value)=>Ok(value),Err(error)=>{{
if !matches!(error.code.as_deref(),Some("yaml.record-form"|"yaml.annotation")) {{return Err(error);}}
let Some(envelope)=core::raw::Property::decode(source,{key:?},{physical_key:?})? else {{return Err(error);}};
let mut value=read_plain_yaml_{id}(&envelope.meaning,inputs)?;
if !envelope.has_semantic && !envelope.uses_semantic_name {{value.present=false;value.child.rows=core::Sequence::Absent;}}
value.raw=Some(core::xml::Patch::read(&envelope.payload,&{namespaces:?},&{qnames:?})?);Ok(value)
}}}} }}
fn write_xml_{id}(value:&V{id},inputs:&PreparedInputs)->core::Result<Vec<u8>> {{
let ordinary=write_plain_xml_{id}(value,inputs)?;
let Some(patch)=&value.raw else {{return Ok(ordinary);}};
let tree=core::xml::Tree::capture(&ordinary,{path})?;
let restored=patch.apply(tree,core::xml::Name{{namespace:{physical_ns:?}.into(),local:{physical_key:?}.into()}},&{namespaces:?},&{qnames:?})?;
let mut out=core::xml::Writer::new(&{writer_namespaces:?});restored.write_at(&mut out,{parent_path},&{qnames:?})?;Ok(out.finish()) }}
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
