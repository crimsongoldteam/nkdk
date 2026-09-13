use super::*;

pub(super) fn record(path: &str, value: &Node) -> Result<XmlRepresentation, Diagnostic> {
    let Shape::Mapping(fields) = &value.shape else {
        return Ok(XmlRepresentation::Record(xml_fields(path, value)?));
    };
    if text_pattern::applies(path, value) {
        return Ok(XmlRepresentation::TextPattern(text_pattern::parse(
            path, value,
        )?));
    }
    if optional_field(fields, "kind")
        .is_some_and(|kind| kind.text(path).is_ok_and(|kind| kind == "qname"))
    {
        let fields = value.mapping(path, &["kind", "namespace", "local"])?;
        Ok(XmlRepresentation::QName {
            namespace: value.field(path, fields, "namespace")?.text(path)?.into(),
            local: value.field(path, fields, "local")?.text(path)?.into(),
        })
    } else {
        Ok(XmlRepresentation::Record(xml_fields(path, value)?))
    }
}
use nkdk_rule_model::{XmlAttribute, XmlAttributeValue};

pub(super) fn unwrap<'a>(
    path: &str,
    mut node: &'a Node,
) -> Result<(&'a Node, Vec<Vec<XmlAttribute>>), Diagnostic> {
    let mut wrappers = vec![];
    while let Shape::Mapping(fields) = &node.shape {
        let Some(kind) = optional_field(fields, "kind") else {
            break;
        };
        if kind.text(path)? != "with-attributes" {
            break;
        }
        node.mapping(path, &["kind", "attributes", "content"])?;
        let attributes = node.field(path, fields, "attributes")?;
        wrappers.push(parse_attributes(path, attributes)?);
        node = node.field(path, fields, "content")?;
    }
    Ok((node, wrappers))
}

pub(super) fn wrap(
    mut content: XmlRepresentation,
    wrappers: Vec<Vec<XmlAttribute>>,
) -> XmlRepresentation {
    for attributes in wrappers.into_iter().rev() {
        content = XmlRepresentation::WithAttributes {
            attributes,
            content: Box::new(content),
        };
    }
    content
}

pub(super) fn parse_attributes(
    path: &str,
    attributes: &Node,
) -> Result<Vec<XmlAttribute>, Diagnostic> {
    let Shape::Sequence(items) = &attributes.shape else {
        return Err(error(
            path,
            attributes.mark,
            "expected_sequence",
            "Expected canonical attribute list",
        ));
    };

    items
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["name", "value", "when"])?;
            let name = item.field(path, fields, "name")?;
            let value = item.field(path, fields, "value")?;
            let parts = value.mapping(path, &["text", "qname"])?;
            if parts.len() != 1 {
                return Err(error(
                    path,
                    value.mark,
                    "invalid_attribute_value",
                    "Expected exactly one text or QName value",
                ));
            }
            let text = parts[0].1.text(path)?.to_owned();
            let value = if parts[0].0.text(path)? == "text" {
                XmlAttributeValue::Text(text)
            } else {
                XmlAttributeValue::QName(text)
            };
            Ok(XmlAttribute {
                name: name.text(path)?.into(),
                value,
                when: optional_field(fields, "when")
                    .map(|value| expression(path, value))
                    .transpose()?,
                source: location(path, name),
            })
        })
        .collect::<Result<_, Diagnostic>>()
}
