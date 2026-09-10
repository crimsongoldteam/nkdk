use super::*;
use std::fmt::Write;
pub(super) struct Attributes {
    pub definitions: String,
    pub read: String,
    pub write: String,
    pub namespaces: BTreeSet<String>,
    pub qnames: String,
}
pub(super) fn content(xml: &LinkedXml) -> (&LinkedXml, Vec<&LinkedXmlAttribute>) {
    let mut content = xml;
    let mut attributes = Vec::new();
    while let LinkedXml::WithAttributes {
        attributes: own,
        content: inner,
    } = content
    {
        attributes.extend(own);
        content = inner;
    }
    (content, attributes)
}
pub(super) fn generate(
    owner: &LinkedEntry,
    common: &LinkedEntry,
    program: &Program,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
    attributes: &[&LinkedXmlAttribute],
    parent: &[ExpandedName],
) -> Result<Attributes, Diagnostic> {
    let path = super::record::path_code(parent);
    let mut result = Attributes {
        definitions: String::new(),
        read: String::new(),
        write: String::new(),
        namespaces: BTreeSet::new(),
        qnames: String::new(),
    };
    let mutable = "mut ";
    writeln!(
        result.write,
        "let {mutable}attributes: Vec<core::xml::WriteAttribute<'_>>=Vec::new();"
    )
    .unwrap();
    let mut qnames = Vec::new();
    for (index, attribute) in attributes.iter().enumerate() {
        result.namespaces.insert(attribute.name.namespace.clone());
        let name = format!(
            "({:?}, {:?})",
            attribute.name.namespace, attribute.name.local
        );
        let named = format!(
            "_attribute.name.namespace=={:?} && _attribute.name.local=={:?}",
            attribute.name.namespace, attribute.name.local
        );
        let (valid, output) = match &attribute.value {
            LinkedXmlAttributeValue::Text(text) => (
                format!("_attribute.text=={text:?}"),
                format!("core::xml::AttributeValue::Text({text:?})"),
            ),
            LinkedXmlAttributeValue::QName(value) => {
                result.namespaces.insert(value.namespace.clone());
                qnames.push(format!("core::xml::matches(_path, {path}) && _name.namespace=={:?} && _name.local=={:?}", attribute.name.namespace, attribute.name.local));
                (
                    format!(
                        "_attribute.qname.as_ref().is_some_and(|name| name.namespace=={:?} && name.local=={:?})",
                        value.namespace, value.local
                    ),
                    format!(
                        "core::xml::AttributeValue::QName(({:?}, {:?}))",
                        value.namespace, value.local
                    ),
                )
            }
        };
        writeln!(result.read, "if core::xml::matches(path, {path}) && {named} {{ if !({valid}) {{ return Err(RuntimeDiagnostic::new(\"xml.attribute-value\", \"Unexpected declared attribute value\")); }} return Ok(()); }}").unwrap();
        let condition = if let Some(when) = &attribute.when {
            let when = super::shorthand::specialize(when, bindings, arguments, owner)?;
            let mut context = common.clone();
            context.id = owner.id;
            let (defs, condition) = expressions::expression(&context, program, &when)?;
            writeln!(result.definitions, "fn attribute_{}_{}(_value: &V{}, _inputs: &PreparedInputs) -> core::Result<bool> {{ {defs} Ok({condition}) }}", owner.id,index,owner.id).unwrap();
            format!("attribute_{}_{index}(_value, _inputs)?", owner.id)
        } else {
            "true".into()
        };
        writeln!(result.write, "if {condition} {{ attributes.push(core::xml::WriteAttribute {{ name:{name}, value:{output} }}); }}").unwrap();
    }
    result.namespaces.remove("");
    result.qnames = if qnames.is_empty() {
        "false".into()
    } else {
        qnames.join(" || ")
    };
    Ok(result)
}
