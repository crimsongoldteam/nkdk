use super::*;
use nkdk_rule_model::Contribution;

pub(super) fn parse(path: &str, fields: &[(Node, Node)]) -> Result<Vec<Contribution>, Diagnostic> {
    let Some(node) = optional_field(fields, "contributions") else {
        return Ok(vec![]);
    };
    let Shape::Sequence(items) = &node.shape else {
        return Err(error(
            path,
            node.mark,
            "expected_sequence",
            "Expected index contributions",
        ));
    };
    items
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["index", "key", "value", "forEach", "union"])?;
            let index = item.field(path, fields, "index")?;
            let name = index.text(path)?;
            if name.is_empty() {
                return Err(error(
                    path,
                    index.mark,
                    "invalid_index",
                    "Index name cannot be empty",
                ));
            }
            Ok(Contribution {
                for_each: optional_field(fields, "forEach")
                    .map(|node| iteration(path, node))
                    .transpose()?,
                index: name.into(),
                union_reference_prefix: optional_field(fields, "union")
                    .map(|union| {
                        let members = union.mapping(path, &["referencePrefix"])?;
                        let prefix = union.field(path, members, "referencePrefix")?.text(path)?;
                        if prefix.is_empty() {
                            return Err(error(
                                path,
                                union.mark,
                                "invalid_union",
                                "Reference prefix cannot be empty",
                            ));
                        }
                        Ok(prefix.to_owned())
                    })
                    .transpose()?,
                key: expression(path, item.field(path, fields, "key")?)?,
                value: expression(path, item.field(path, fields, "value")?)?,
                source: location(path, item),
            })
        })
        .collect()
}

pub(super) fn inputs(path: &str, fields: &[(Node, Node)]) -> Result<Vec<NamedBinding>, Diagnostic> {
    let Some(node) = optional_field(fields, "inputs") else {
        return Ok(vec![]);
    };
    let Shape::Mapping(inputs) = &node.shape else {
        return Ok(vec![]);
    };
    let mut bindings = Vec::new();
    for (name, input) in inputs {
        let fields = input.mapping(path, &["type", "index"])?;
        if let Some(index) = optional_field(fields, "index") {
            bindings.push(NamedBinding {
                name: name.text(path)?.into(),
                value: index.text(path)?.into(),
                source: location(path, index),
            });
        }
    }
    Ok(bindings)
}
