use super::*;
use std::fmt::Write;

pub(super) fn applies(owner: &LinkedEntry, program: &Program) -> bool {
    composite::record(owner, program)
        .is_some_and(|(common, _, _)| matches!(common.xml, LinkedXml::QName { .. }))
}

pub(super) fn generate(
    owner: &LinkedEntry,
    program: &Program,
) -> Result<Option<String>, Diagnostic> {
    let Some((common, bindings, arguments)) = composite::record(owner, program) else {
        return Ok(None);
    };
    let LinkedXml::QName { namespace, local } = &common.xml else {
        return Ok(None);
    };
    plain_shape(owner)?;
    if !bindings.is_empty()
        || !arguments.is_empty()
        || !common.inputs.is_empty()
        || !common.parameters.is_empty()
        || !common.constraints.is_empty()
        || !owner.constraints.is_empty()
        || !common.shorthands.is_empty()
        || common.normalization.is_some()
        || common.presence.len() != 1
    {
        return Err(unsupported(
            common,
            "QName record currently requires an optional static pair",
        ));
    }
    let presence = &common.presence[0];
    let absent = |value: &LinkedExpression| matches!(value.kind, LinkedExpressionKind::Absent);
    if presence.target != LinkedPresenceTarget::SelfValue
        || !presence.xml_missing.as_ref().is_some_and(absent)
        || !presence.yaml_missing.as_ref().is_some_and(absent)
        || !presence.yaml_empty.is_empty()
        || !presence.canonical.is_empty()
        || presence.yaml_omit_when.is_some()
        || presence
            .xml_empty
            .iter()
            .any(|empty| empty.form != EmptyKind::Element || !absent(&empty.denotes))
    {
        return Err(unsupported(
            common,
            "QName presence supports absence and an optional empty element",
        ));
    }
    let empty_absent = !presence.xml_empty.is_empty();
    let (
        LinkedXml::Record(xml),
        YamlRepresentation::Mapping(yaml),
        YamlRepresentation::Mapping(fields),
    ) = (&owner.xml, &owner.yaml, &common.yaml)
    else {
        return Err(unsupported(owner, "QName owner requires record mappings"));
    };
    let path = &xml[0].path;
    if path.len() < 2 || xml[0].attribute.is_some() {
        return Err(unsupported(owner, "QName needs a property element"));
    }
    let key = &yaml[0].key;
    let target = path.last().expect("property route");
    let root_namespace = &target.namespace;
    let root_local = &target.local;
    let namespace_key = &fields
        .iter()
        .find(|field| &field.field == namespace)
        .expect("linked QName field")
        .key;
    let local_key = &fields
        .iter()
        .find(|field| &field.field == local)
        .expect("linked QName field")
        .key;
    let id = owner.id;
    let route = record::path_code(path);
    let parent = record::path_code(&path[..path.len() - 1]);
    let prefixes = (1..path.len())
        .map(|length| {
            format!(
                "core::xml::matches(path,{})",
                record::path_code(&path[..length])
            )
        })
        .collect::<Vec<_>>()
        .join(" || ");
    let namespaces = path
        .iter()
        .map(|name| name.namespace.as_str())
        .filter(|uri| !uri.is_empty())
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect::<Vec<_>>();
    let mut source = format!(
        r#"
struct V{id} {{value:Option<core::xml::Name>,raw:core::raw::Fields}}
const Q{id}:&[(&str,&str)]=&[];
fn read_xml_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{read_xml_events_{id}(source,inputs,core::xml::DocumentSource(source))}}
fn read_xml_events_{id}(_source:&[u8],_inputs:&InputView<'_>,events:impl core::xml::ScopedSource)->core::Result<V{id}> {{
let mut seen=false;let mut text=String::new();let mut value=None;
events.visit_scoped(|path,token,scope|{{
if core::xml::matches(path,{route}) {{match token {{
core::xml::Token::Start(_)=>{{if seen {{return Err(RuntimeDiagnostic::new("xml.duplicate-field","Repeated QName property"));}}seen=true;}},
core::xml::Token::Text(part)=>text.push_str(part),
core::xml::Token::End=>{{if !({empty_absent} && text.is_empty()) {{let (namespace,local)=scope.resolve_qname(&text)?;value=Some(core::xml::Name{{namespace:namespace.into(),local:local.into()}});}}}},
core::xml::Token::Attribute(_)=>{{}},
}}return Ok(());}}
if {prefixes} {{return match token {{core::xml::Token::Start(_)|core::xml::Token::End=>Ok(()),core::xml::Token::Text(text) if core::xml::is_whitespace(text)=>Ok(()),_=>Err(RuntimeDiagnostic::new("xml.unknown-field","Content outside QName property"))}};}}
Err(RuntimeDiagnostic::new("xml.unknown-field","Unexpected QName child"))
}})?;Ok(V{id}{{value,raw:core::raw::Fields::default()}})
}}
fn read_yaml_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{read_yaml_events_{id}(inputs,core::yaml::DocumentSource(if source.is_empty() {{b"{{}}"}} else {{source}}))}}
fn read_yaml_events_{id}(_inputs:&InputView<'_>,events:impl core::yaml::Source)->core::Result<V{id}> {{
let mut namespace=None;let mut local=None;
let present=core::yaml::visit_record_scalar_events(events,{key:?},|key,value,tag|{{
if tag.is_some() {{return Err(RuntimeDiagnostic::new("yaml.qname","Unexpected QName field annotation"));}}
match key.as_str() {{{namespace_key:?}=>namespace=Some(value.into_text()?),{local_key:?}=>local=Some(value.into_text()?),_=>return Err(RuntimeDiagnostic::new("yaml.qname","Unknown QName field"))}}Ok(())
}})?;
let value=if present {{let namespace=namespace.ok_or_else(||RuntimeDiagnostic::new("value.missing","Missing QName namespace"))?;let local=local.ok_or_else(||RuntimeDiagnostic::new("value.missing","Missing QName local name"))?;
core::xml::validate_qname((&namespace,&local)).map_err(|error|error.field({key:?}))?;
Some(core::xml::Name{{namespace,local}})}} else {{None}};
Ok(V{id}{{value,raw:core::raw::Fields::default()}})
}}
struct XmlPreparedPlain{id};
fn prepare_xml_plain_{id}(_value:&V{id},_inputs:&InputView<'_>)->core::Result<XmlPreparedPlain{id}> {{Ok(XmlPreparedPlain{id})}}
fn namespaces_xml_plain_{id}<'a>(value:&'a V{id},_prepared:&'a XmlPreparedPlain{id},namespaces:&mut Vec<&'a str>) {{
for namespace in &{namespaces:?} {{if !namespaces.contains(namespace) {{namespaces.push(namespace);}}}}
if let Some(name)=&value.value && !name.namespace.is_empty() && !namespaces.contains(&name.namespace.as_str()) {{namespaces.push(&name.namespace);}}
}}
fn write_xml_into_plain_{id}(value:&V{id},_prepared:&XmlPreparedPlain{id},_inputs:&InputView<'_>,writer:&mut core::xml::Writer<'_>)->core::Result<()> {{
if let Some(name)=&value.value {{writer.qname_field({route},(&name.namespace,&name.local))?;}} else {{writer.ensure_container({parent});}}
Ok(())
}}
fn write_xml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{
let prepared=prepare_xml_plain_{id}(value,inputs)?;
let mut namespaces=Vec::new();namespaces_xml_plain_{id}(value,&prepared,&mut namespaces);
let mut writer=core::xml::Writer::new(&namespaces);
write_xml_into_plain_{id}(value,&prepared,inputs,&mut writer)?;
Ok(writer.finish())
}}
fn write_yaml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{let mut out=String::new();write_yaml_into_{id}(value,inputs,&mut out)?;Ok(out.into_bytes())}}
fn write_yaml_into_{id}(value:&V{id},_inputs:&InputView<'_>,out:&mut String)->core::Result<()> {{core::yaml::append_properties(out,|out| {{
let Some(value)=&value.value else {{return Ok(());}};
out.push_str(&core::yaml::scalar({key:?}));out.push(':');
"#
    );
    for field in fields {
        let member = if &field.field == namespace {
            "namespace"
        } else {
            "local"
        };
        writeln!(source,"out.push_str(\"\\n  \");out.push_str(&core::yaml::mapping_key({:?}));out.push_str(\": \");out.push_str(&core::yaml::scalar(&value.{member}));",field.key).unwrap();
    }
    writeln!(source,r#"Ok(())}})}}
fn check_xml_{id}(value:&V{id},_source:&[u8],_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{value.raw.diagnostics()}}
fn check_yaml_{id}(value:&V{id},_source:&[u8],_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{
let mut issues=value.raw.diagnostics();
if let Some(patch)=value.raw.get(usize::MAX) {{
let name=||core::xml::Name{{namespace:{root_namespace:?}.into(),local:{root_local:?}.into()}};
let validate=||->core::Result<()>{{let base=value.value.clone().map(|value|core::xml::Tree::qname_scalar(name(),value)).transpose()?;patch.apply(base,name(),&[],Q{id})?;Ok(())}};
if let Err(error)=validate(){{issues.push(error.field({key:?}));}}
}}issues}}
fn verify_{id}(original:&[u8],candidate:&[u8],inputs:&InputView<'_>)->core::Result<()>{{
let value=read_yaml_{id}(candidate,inputs)?;
prove_xml_{id}(&value,original,&write_xml_{id}(&value,inputs)?)
}}
fn finalize_yaml_{id}(original:&[u8],candidate:Vec<u8>,_value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>>{{
match verify_{id}(original,&candidate,inputs){{Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>{{}},Err(error)=>return Err(error)}}
let mut candidate=candidate;verify_{id}(original,&candidate,inputs)?;Ok(candidate)
}}
"#).unwrap();
    source.push_str(&super::proof::qnames(id, &format!("Q{id}.to_vec()")));
    source.push_str(&super::proof::generate(
        id,
        &format!("core::xml::matches(path,{route})"),
        "false",
        &format!("core::xml::matches(path,{route})"),
    ));
    let layout = nested_record::Layout {
        entry: owner.clone(),
        key: key.clone(),
        path: path.clone(),
        attributes: Vec::new(),
        qname_text: true,
    };
    Ok(Some(nested_record::wrap(source, &layout)))
}
