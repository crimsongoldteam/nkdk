use super::*;
pub(super) fn attributes(choice: &ScalarChoiceXml<ExpandedName>) -> String {
    let Some(value) = &choice.cases[0].emit else {
        return "&[]".into();
    };
    format!(
        "if field_value.is_number() {{ &[core::xml::WriteAttribute{{name:({:?},{:?}),value:core::xml::AttributeValue::QName(({:?},{:?}))}}] }} else {{ &[] }}",
        choice.attribute.namespace, choice.attribute.local, value.namespace, value.local
    )
}
pub(super) fn read_attribute(
    choice: &ScalarChoiceXml<ExpandedName>,
    path: &[ExpandedName],
    index: usize,
) -> String {
    let patterns = choice.cases[0]
        .values
        .iter()
        .map(|n| {
            format!(
                "(name.namespace=={:?} && name.local=={:?})",
                n.namespace, n.local
            )
        })
        .collect::<Vec<_>>()
        .join(" || ");
    let canonical=choice.cases[0].emit.as_ref().map(|n|format!("_attribute.qname.as_ref().is_some_and(|name|name.namespace=={:?} && name.local=={:?})",n.namespace,n.local)).unwrap_or("false".into());
    format!(
        "if core::xml::matches(path,{}) && _attribute.name.namespace=={:?} && _attribute.name.local=={:?} {{number{index}=_attribute.qname.as_ref().is_some_and(|name|{patterns}); if !({canonical}) {{shape{index}=true;}} return Ok(());}}\n",
        super::record::path_code(path),
        choice.attribute.namespace,
        choice.attribute.local
    )
}
