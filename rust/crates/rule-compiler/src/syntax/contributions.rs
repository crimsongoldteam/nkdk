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
            let fields = item.mapping(
                path,
                &[
                    "index",
                    "key",
                    "value",
                    "forEach",
                    "when",
                    "union",
                    "duplicates",
                    "allocate",
                    "reserve",
                ],
            )?;
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
            let coalesce_equal = match optional_field(fields, "duplicates") {
                None => false,
                Some(node) => match node.text(path)? {
                    "reject" => false,
                    "coalesce-equal" => true,
                    _ => {
                        return Err(error(
                            path,
                            node.mark,
                            "invalid_duplicates",
                            "Expected reject or coalesce-equal",
                        ));
                    }
                },
            };
            let value = optional_field(fields, "value")
                .map(|node| expression(path, node))
                .transpose()?;
            let reservation = optional_field(fields, "reserve")
                .map(|node| expression(path, node))
                .transpose()?;
            let allocation = optional_field(fields, "allocate")
                .map(|node| {
                    let fields = node.mapping(path, &["scope", "first", "phase"])?;
                    let scope = node.field(path, fields, "scope")?;
                    let Shape::Sequence(parts) = &scope.shape else {
                        return Err(error(
                            path,
                            scope.mark,
                            "allocation_scope",
                            "Expected key column names",
                        ));
                    };
                    let scope = parts
                        .iter()
                        .map(|part| part.text(path).map(str::to_owned))
                        .collect::<Result<Vec<_>, _>>()?;
                    let first = node.field(path, fields, "first")?;
                    let ScalarLiteral::Number(number) = scalar_literal(path, first)? else {
                        return Err(error(
                            path,
                            first.mark,
                            "allocation_first",
                            "Expected a positive integer",
                        ));
                    };
                    let number = number
                        .parse::<u64>()
                        .ok()
                        .filter(|number| *number > 0)
                        .ok_or_else(|| {
                            error(
                                path,
                                first.mark,
                                "allocation_first",
                                "Expected a positive u64 integer",
                            )
                        })?;
                    let phase = optional_field(fields, "phase")
                        .map(|phase| {
                            let ScalarLiteral::Number(number) = scalar_literal(path, phase)? else {
                                return Err(error(path, phase.mark, "allocation_phase", "Expected a nonnegative u32 integer"));
                            };
                            number.parse::<u32>().map_err(|_| error(path, phase.mark, "allocation_phase", "Expected a nonnegative u32 integer"))
                        })
                        .transpose()?
                        .unwrap_or(0);
                    Ok(nkdk_rule_model::NumberAllocation {
                        scope,
                        first: number,
                        phase,
                    })
                })
                .transpose()?;
            if [value.is_some(), allocation.is_some(), reservation.is_some()].into_iter().filter(|present| *present).count() != 1
                || ((allocation.is_some() || reservation.is_some()) && optional_field(fields, "union").is_some())
                || (reservation.is_some() && optional_field(fields, "duplicates").is_some())
            {
                return Err(error(
                    path,
                    item.mark,
                    "allocation_value",
                    "Specify one value, allocate or reserve; number operations cannot be unions and reserve has no duplicate policy",
                ));
            }
            Ok(Contribution {
                coalesce_equal,
                for_each: optional_field(fields, "forEach")
                    .map(|node| iteration(path, node))
                    .transpose()?,
                when: optional_field(fields, "when")
                    .map(|node| expression(path, node))
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
                write: match (value, allocation, reservation) {
                    (Some(value), _, _) => nkdk_rule_model::IndexWrite::Value(value),
                    (_, Some(allocation), _) => nkdk_rule_model::IndexWrite::Allocate(allocation),
                    (_, _, Some(value)) => nkdk_rule_model::IndexWrite::Reserve(value),
                    _ => unreachable!("checked one write action"),
                },
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
