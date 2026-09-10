use super::*;

pub(crate) struct Layout {
    pub entry: LinkedEntry,
    pub key: String,
    pub path: Vec<ExpandedName>,
    pub attributes: Vec<LinkedXmlAttribute>,
}
pub(crate) fn lower(owner: &LinkedEntry, program: &Program) -> Result<Option<Layout>, Diagnostic> {
    let Some((common, bindings, arguments)) = composite::record(owner, program) else {
        return Ok(None);
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
        || !common.constraints.is_empty()
        || !common.parameters.is_empty()
        || !common.inputs.is_empty()
        || !common.shorthands.is_empty()
        || common.normalization.is_some()
        || common.presence.len() != 1
    {
        return Err(unsupported(
            common,
            "Nested scalar records currently require static, unconstrained composition",
        ));
    }
    for rule in &common.presence {
        if rule.target != LinkedPresenceTarget::SelfValue
            || !rule
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
    let (LinkedXml::Record(owner_xml), YamlRepresentation::Mapping(owner_yaml)) =
        (&owner.xml, &owner.yaml)
    else {
        return Err(unsupported(owner, "Nested owner requires record mappings"));
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
    if path.len() < 2 || owner_xml[0].attribute.is_some() {
        return Err(unsupported(
            owner,
            "Nested record requires a property element",
        ));
    }
    let mut flat = common.clone();
    flat.id = owner.id;
    flat.name = owner.name.clone();
    flat.kind = ModuleKind::Object;
    flat.presence.clear();
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
        key: owner_yaml[0].key.clone(),
        path,
        attributes: attrs.into_iter().cloned().collect(),
    }))
}
pub(super) fn attributes(layout: &Layout) -> String {
    format!(
        "&[{}]",
        layout
            .attributes
            .iter()
            .map(|attr| {
                let value = match &attr.value {
                    LinkedXmlAttributeValue::Text(value) => {
                        format!("core::xml::AttributeValue::Text({value:?})")
                    }
                    LinkedXmlAttributeValue::QName(value) => format!(
                        "core::xml::AttributeValue::QName(({:?},{:?}))",
                        value.namespace, value.local
                    ),
                };
                format!(
                    "core::xml::WriteAttribute{{name:({:?},{:?}),value:{value}}}",
                    attr.name.namespace, attr.name.local
                )
            })
            .collect::<Vec<_>>()
            .join(",")
    )
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
    writeln!(source,"fn read_yaml_{id}(source:&[u8],inputs:&PreparedInputs)->core::Result<V{id}> {{match read_yaml_plain_{id}(source,inputs) {{Ok(value)=>Ok(value),Err(error)=>{{let Some(envelope)=core::raw::Property::decode(source,{key:?},{physical:?})? else {{return Err(error);}};let mut value=read_yaml_plain_{id}(&envelope.meaning,inputs)?;value.raw.insert(usize::MAX,core::xml::Patch::read(&envelope.payload,&[],Q{id})?);Ok(value)}}}}}}").unwrap();
    writeln!(source,"fn read_xml_{id}(source:&[u8],inputs:&PreparedInputs)->core::Result<V{id}> {{match read_xml_plain_{id}(source,inputs) {{Ok(value)=>Ok(value),Err(error) if matches!(error.code.as_deref(),Some(\"xml.unknown-field\"|\"xml.unknown-attribute\"|\"xml.duplicate-field\"|\"xml.unexpected-text\"))=>{{let Some(tree)=core::xml::Tree::capture(source,{path})? else {{return Err(error);}};let mut value=read_yaml_plain_{id}(b\"\",inputs)?;let payload=tree.payload_yaml(&[],Q{id})?;value.raw.insert(usize::MAX,core::xml::Patch::read(if payload.is_empty() {{b\"{{}}\"}} else {{payload.as_bytes()}},&[],Q{id})?);Ok(value)}},Err(error)=>Err(error)}}}}").unwrap();
    writeln!(source,"fn write_yaml_{id}(value:&V{id},inputs:&PreparedInputs)->core::Result<Vec<u8>> {{let bytes=write_yaml_plain_{id}(value,inputs)?;let Some(patch)=value.raw.get(usize::MAX) else {{return Ok(bytes);}};let tree=patch.apply(None,core::xml::Name{{namespace:{:?}.into(),local:{physical:?}.into()}},&[],Q{id})?;let payload=tree.payload_yaml(&[],Q{id})?;core::raw::Property::encode({key:?},{physical:?},&bytes,if payload.is_empty() {{b\"{{}}\"}} else {{payload.as_bytes()}})}}",name.namespace).unwrap();
    writeln!(source,"fn write_xml_{id}(value:&V{id},inputs:&PreparedInputs)->core::Result<Vec<u8>> {{let bytes=write_xml_plain_{id}(value,inputs)?;let Some(patch)=value.raw.get(usize::MAX) else {{return Ok(bytes);}};let base=core::xml::Tree::capture(&bytes,{path})?;let tree=patch.apply(base,core::xml::Name{{namespace:{:?}.into(),local:{physical:?}.into()}},&[],Q{id})?;let mut namespaces=Vec::new();tree.collect_namespaces(&mut namespaces);let mut writer=core::xml::Writer::new(&namespaces);tree.write_at(&mut writer,{parent},Q{id})?;Ok(writer.finish())}}",name.namespace).unwrap();
    let end = format!("verify_{id}(original,&candidate,inputs)?;Ok(candidate)");
    let replacement = format!(
        "let restored=write_xml_{id}(&read_yaml_{id}(&candidate,inputs)?,inputs)?;if let Some(original_tree)=core::xml::Tree::capture(original,{path})? {{let restored_tree=core::xml::Tree::capture(&restored,{path})?;let patch=original_tree.patch_yaml(restored_tree.as_ref(),&[],Q{id})?;if patch!=\"{{}}\" {{candidate=core::raw::Property::encode({key:?},{physical:?},&candidate,patch.as_bytes())?;}}}}{end}"
    );
    source.replace(&end, &replacement)
}
