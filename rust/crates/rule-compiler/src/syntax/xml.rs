use super::*;
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
        let Shape::Sequence(items) = &attributes.shape else {
            return Err(error(
                path,
                attributes.mark,
                "expected_sequence",
                "Expected canonical attribute list",
            ));
        };
        wrappers.push(
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
                .collect::<Result<_, Diagnostic>>()?,
        );
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
