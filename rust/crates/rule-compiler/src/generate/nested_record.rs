use super::*;

pub(crate) struct Layout {
    pub entry: LinkedEntry,
    pub key: String,
    pub path: Vec<ExpandedName>,
    pub attributes: Vec<LinkedXmlAttribute>,
    pub qname_text: bool,
}
pub(crate) fn lower(owner: &LinkedEntry, program: &Program) -> Result<Option<Layout>, Diagnostic> {
    if super::qname::applies(owner, program) {
        return Ok(None);
    }
    let Some((common, bindings, arguments)) = composite::record(owner, program) else {
        return Ok(None);
    };
    let owner_field = match &owner.value {
        LinkedType::Record(fields) => fields.first().map(|field| field.name.as_str()),
        _ => None,
    };
    let LinkedType::Record(fields) = &common.value else {
        unreachable!()
    };
    if fields
        .iter()
        .any(|field| scalar::Codec::resolve(&field.value, common, program).is_err())
    {
        return Ok(None);
    }
    if !bindings.is_empty()
        || !arguments.is_empty()
        || !owner.constraints.is_empty()
        || !owner.presence.is_empty()
        || !common.parameters.is_empty()
        || !common.inputs.is_empty()
        || !common.shorthands.is_empty()
        || common.normalization.is_some()
        || common
            .presence
            .iter()
            .filter(|rule| rule.target == LinkedPresenceTarget::SelfValue)
            .count()
            > 1
    {
        // Flattening is an optimization for static records. Context-dependent
        // records retain their ordinary value adapter and input bindings.
        return Ok(None);
    }
    for rule in common
        .presence
        .iter()
        .filter(|rule| rule.target == LinkedPresenceTarget::SelfValue)
    {
        if !rule
            .xml_missing
            .as_ref()
            .is_some_and(|value| matches!(value.kind, LinkedExpressionKind::Absent))
            || !rule
                .yaml_missing
                .as_ref()
                .is_some_and(|value| matches!(value.kind, LinkedExpressionKind::Absent))
            || !rule.xml_empty.is_empty()
            || !rule.yaml_empty.is_empty()
            || !rule.canonical.is_empty()
            || rule.yaml_omit_when.is_some()
        {
            return Err(unsupported(
                common,
                "Nested record presence requires ordinary optional absence",
            ));
        }
    }
    let LinkedXml::Record(owner_xml) = &owner.xml else {
        return Err(unsupported(owner, "Nested owner requires record XML"));
    };
    let key = match &owner.yaml {
        YamlRepresentation::Mapping(owner_yaml) => owner_yaml
            .first()
            .ok_or_else(|| unsupported(owner, "Nested owner mapping requires a field"))?
            .key
            .clone(),
        YamlRepresentation::Projection(field) if owner_field == Some(field.as_str()) => {
            String::new()
        }
        _ => {
            return Err(unsupported(
                owner,
                "Nested owner requires a record mapping or projection",
            ));
        }
    };
    let (xml, attrs) = attributes::content(&common.xml);
    let LinkedXml::Record(xml) = xml else {
        return Err(unsupported(common, "Nested common requires XML fields"));
    };
    if attrs.iter().any(|attr| attr.when.is_some()) {
        return Err(unsupported(
            common,
            "Nested wrapper attributes must be static",
        ));
    }
    let path = owner_xml[0].path.clone();
    if path.is_empty() || owner_xml[0].attribute.is_some() {
        return Err(unsupported(
            owner,
            "Nested record requires a property element",
        ));
    }
    let mut flat = common.clone();
    flat.id = owner.id;
    flat.name = owner.name.clone();
    flat.kind = ModuleKind::Object;
    flat.presence
        .retain(|rule| rule.target != LinkedPresenceTarget::SelfValue);
    flat.xml = LinkedXml::Record(
        xml.iter()
            .map(|field| {
                let mut field = field.clone();
                field.path = path.iter().chain(&field.path).cloned().collect();
                field
            })
            .collect(),
    );
    Ok(Some(Layout {
        entry: flat,
        key,
        path,
        attributes: attrs.into_iter().cloned().collect(),
        qname_text: false,
    }))
}
pub(super) fn attributes(layout: &Layout) -> String {
    super::attributes::static_attributes(&layout.attributes)
}

/// Keep wrapper differences on the declared record boundary. The ordinary path
/// calls the scalar event reader directly; tree storage is exceptional only.
pub(super) fn wrap(mut source: String, layout: &Layout) -> String {
    use std::fmt::Write;
    let id = layout.entry.id;
    let key = &layout.key;
    let name = layout.path.last().unwrap();
    let physical = &name.local;
    let path = record::path_code(&layout.path);
    let parent = record::path_code(&layout.path[..layout.path.len() - 1]);
    for function in ["read_xml", "read_yaml", "write_xml", "write_yaml"] {
        source = source.replace(
            &format!("fn {function}_{id}("),
            &format!("fn {function}_plain_{id}("),
        );
    }
    source = source.replace(
        &format!("write_yaml_into_{id}("),
        &format!("write_yaml_into_plain_{id}("),
    );
    writeln!(source,"fn write_yaml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{let mut out=String::new();write_yaml_into_{id}(value,inputs,&mut out)?;Ok(out.into_bytes())}}\nfn write_yaml_into_{id}(value:&V{id},inputs:&InputView<'_>,out:&mut String)->core::Result<()> {{if value.raw.get(usize::MAX).is_some() {{core::yaml::append_encoded_properties(out,&write_yaml_wrapped_{id}(value,inputs)?)}} else {{write_yaml_into_plain_{id}(value,inputs,out)}}}}").unwrap();
    writeln!(source,"fn read_yaml_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{match read_yaml_plain_{id}(source,inputs) {{Ok(value)=>Ok(value),Err(error)=>{{let Some(envelope)=core::raw::Property::decode(source,{key:?},{physical:?})? else {{return Err(error);}};let mut value=read_yaml_plain_{id}(&envelope.meaning,inputs)?;value.raw.insert(usize::MAX,core::xml::Patch::read(&envelope.payload,&[],Q{id})?);Ok(value)}}}}}}").unwrap();
    writeln!(source,"fn read_xml_{id}(source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}> {{match read_xml_plain_{id}(source,inputs) {{Ok(value)=>Ok(value),Err(error) if matches!(error.code.as_deref(),Some(\"xml.unknown-field\"|\"xml.unknown-attribute\"|\"xml.duplicate-field\"|\"xml.unexpected-text\"))=>{{let Some(tree)=core::xml::Tree::capture(source,{path})? else {{return Err(error);}};let mut value=read_yaml_plain_{id}(b\"\",inputs)?;let payload=tree.patch_yaml(None,&[],Q{id})?;value.raw.insert(usize::MAX,core::xml::Patch::read(if payload.is_empty() {{b\"{{}}\"}} else {{payload.as_bytes()}},&[],Q{id})?);Ok(value)}},Err(error)=>Err(error)}}}}").unwrap();
    writeln!(source,"fn write_yaml_wrapped_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{let bytes=write_yaml_plain_{id}(value,inputs)?;let Some(patch)=value.raw.get(usize::MAX) else {{return Ok(bytes);}};let payload=patch.to_yaml();core::raw::Property::encode({key:?},{physical:?},&bytes,payload.as_bytes())}}\n").unwrap();
    writeln!(source,r#"struct XmlPrepared{id} {{plain:XmlPreparedPlain{id},tree:Option<core::xml::Tree>}}
fn prepare_xml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<XmlPrepared{id}> {{
let tree=if let Some(patch)=value.raw.get(usize::MAX) {{let bytes=write_xml_plain_{id}(value,inputs)?;let base=core::xml::Tree::capture(&bytes,{path})?;Some(patch.apply(base,core::xml::Name{{namespace:{namespace:?}.into(),local:{physical:?}.into()}},&[],Q{id})?)}} else {{None}};
Ok(XmlPrepared{id}{{plain:prepare_xml_plain_{id}(value,inputs)?,tree}})
}}
fn namespaces_xml_{id}<'a>(value:&'a V{id},prepared:&'a XmlPrepared{id},namespaces:&mut Vec<&'a str>) {{namespaces_xml_plain_{id}(value,&prepared.plain,namespaces);if let Some(tree)=&prepared.tree {{tree.collect_namespaces(namespaces);}}}}
fn write_xml_into_{id}<'a>(value:&V{id},prepared:&'a XmlPrepared{id},inputs:&InputView<'_>,writer:&mut core::xml::Writer<'a>)->core::Result<()> {{if let Some(tree)=&prepared.tree {{tree.write_at(writer,{parent},Q{id})}} else {{write_xml_into_plain_{id}(value,&prepared.plain,inputs,writer)}}}}
fn write_xml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{
if value.raw.get(usize::MAX).is_none() {{return write_xml_plain_{id}(value,inputs);}}
let prepared=prepare_xml_{id}(value,inputs)?;let mut namespaces=Vec::new();namespaces_xml_{id}(value,&prepared,&mut namespaces);let mut writer=core::xml::Writer::new(&namespaces);write_xml_into_{id}(value,&prepared,inputs,&mut writer)?;Ok(writer.finish())
}}
"#,namespace=name.namespace).unwrap();
    let end = format!("verify_{id}(original,&candidate,inputs)?;Ok(candidate)");
    let replacement = format!(
        "let restored=write_xml_{id}(&read_yaml_{id}(&candidate,inputs)?,inputs)?;if let Some(original_tree)=core::xml::Tree::capture(original,{path})? {{let restored_tree=core::xml::Tree::capture(&restored,{path})?;let patch=original_tree.patch_yaml(restored_tree.as_ref(),&[],Q{id})?;if patch!=\"{{}}\" {{candidate=core::raw::Property::encode({key:?},{physical:?},&candidate,patch.as_bytes())?;}}}}{end}"
    );
    source = source.replace(&end, &replacement);
    if layout.qname_text {
        for input in ["source", "&bytes", "original", "&restored"] {
            source = source.replace(
                &format!("core::xml::Tree::capture({input},{path})"),
                &format!("core::xml::Tree::capture_with_qnames({input},{path},|node|core::xml::matches(node,{path}))"),
            );
        }
        source = source.replace(
            "\"xml.unexpected-text\"",
            "\"xml.unexpected-text\"|\"xml.qname\"|\"xml.qname-prefix\"",
        );
        source = source.replace(
            "&candidate,patch.as_bytes())?",
            "&candidate,if patch.is_empty() {b\"\\\"\\\"\"} else {patch.as_bytes()})?",
        );
    }
    source
}
