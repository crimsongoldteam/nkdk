use super::*;
use nkdk_rule_model::{DataPathDefinition, DataPathMember, DataPathView};

fn names(path: &str, node: &Node) -> Result<Vec<String>, Diagnostic> {
    let Shape::Sequence(items) = &node.shape else {
        return Err(error(
            path,
            node.mark,
            "expected_sequence",
            "Expected a list of names",
        ));
    };
    items
        .iter()
        .map(|item| {
            let value = item.text(path)?;
            if value.is_empty() {
                return Err(error(path, item.mark, "empty_name", "Name cannot be empty"));
            }
            Ok(value.to_owned())
        })
        .collect()
}

pub(super) fn parse(
    path: &str,
    fields: &[(Node, Node)],
) -> Result<Option<DataPathDefinition>, Diagnostic> {
    let Some(node) = optional_field(fields, "dataPath") else {
        return Ok(None);
    };
    let fields = node.mapping(path, &["type", "aliases", "members", "views"])?;
    let type_name = node.field(path, fields, "type")?.text(path)?.to_owned();
    let aliases = optional_field(fields, "aliases")
        .map(|node| names(path, node))
        .transpose()?
        .unwrap_or_default();
    let members_node = node.field(path, fields, "members")?;
    let Shape::Sequence(items) = &members_node.shape else {
        return Err(error(
            path,
            members_node.mark,
            "expected_sequence",
            "Expected data path members",
        ));
    };
    let members = items
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["field", "internal", "terminalTypes"])?;
            Ok(DataPathMember {
                field: item.field(path, fields, "field")?.text(path)?.to_owned(),
                internal: item.field(path, fields, "internal")?.text(path)?.to_owned(),
                terminal_types: names(path, item.field(path, fields, "terminalTypes")?)?,
                source: location(path, item),
            })
        })
        .collect::<Result<Vec<_>, Diagnostic>>()?;
    let views = optional_field(fields, "views")
        .map(|node| {
            let Shape::Mapping(items) = &node.shape else {
                return Err(error(
                    path,
                    node.mark,
                    "expected_mapping",
                    "Expected data path views",
                ));
            };
            items
                .iter()
                .map(|(purpose, fields)| {
                    Ok(DataPathView {
                        purpose: purpose.text(path)?.to_owned(),
                        fields: names(path, fields)?,
                        source: location(path, purpose),
                    })
                })
                .collect::<Result<Vec<_>, Diagnostic>>()
        })
        .transpose()?
        .unwrap_or_default();
    Ok(Some(DataPathDefinition {
        type_name,
        aliases,
        members,
        views,
        source: location(path, node),
    }))
}
