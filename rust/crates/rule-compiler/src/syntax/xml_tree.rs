use super::*;
use nkdk_rule_model::{XmlAttribute, XmlTreeContent, XmlTreeNode};

pub(super) fn children(
    path: &str,
    value: &Node,
) -> Result<Vec<XmlTreeNode<String, XmlAttribute>>, Diagnostic> {
    let Shape::Sequence(nodes) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_sequence",
            "Expected XML children",
        ));
    };
    nodes
        .iter()
        .map(|node| {
            let fields = node.mapping(
                path,
                &["name", "attributes", "text", "field", "self", "children"],
            )?;
            let name = node.field(path, fields, "name")?;
            let sources = ["text", "field", "self", "children"]
                .into_iter()
                .filter_map(|key| optional_field(fields, key).map(|value| (key, value)))
                .collect::<Vec<_>>();
            if sources.len() > 1 {
                return Err(error(
                    path,
                    node.mark,
                    "ambiguous_xml_content",
                    "An element has one content source",
                ));
            }
            let content = match sources.first().copied() {
                None => XmlTreeContent::Constant(String::new()),
                Some(("text", value)) => XmlTreeContent::Constant(value.text(path)?.into()),
                Some(("field", value)) => XmlTreeContent::Field(value.text(path)?.into()),
                Some(("self", value)) => {
                    if scalar_literal(path, value)? != nkdk_rule_model::ScalarLiteral::Boolean(true)
                    {
                        return Err(error(
                            path,
                            value.mark,
                            "invalid_self",
                            "Expected self: true",
                        ));
                    }
                    XmlTreeContent::SelfValue
                }
                Some(("children", value)) => XmlTreeContent::Children(children(path, value)?),
                _ => unreachable!("known content source"),
            };
            Ok(XmlTreeNode {
                name: name.text(path)?.into(),
                attributes: optional_field(fields, "attributes")
                    .map(|node| xml::parse_attributes(path, node))
                    .transpose()?
                    .unwrap_or_default(),
                content,
                source: location(path, node),
            })
        })
        .collect()
}
