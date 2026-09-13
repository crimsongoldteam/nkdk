use super::*;
use nkdk_rule_model::{ResourceGroup, ResourceRoute};

pub(super) fn parse(
    path: &str,
    fields: &[(Node, Node)],
) -> Result<Vec<ResourceGroup<Expression>>, Diagnostic> {
    let Some(node) = optional_field(fields, "resources") else {
        return Ok(vec![]);
    };
    sequence(path, node)?
        .iter()
        .map(|group| {
            let fields = group.mapping(path, &["oneOf", "forEach", "remainder"])?;
            let (remainder, items): (bool, Vec<&Node>) = match (
                optional_field(fields, "oneOf"),
                optional_field(fields, "remainder"),
            ) {
                (Some(node), None) => (false, sequence(path, node)?.iter().collect()),
                (None, Some(node)) => (true, vec![node]),
                _ => {
                    return Err(error(
                        path,
                        group.mark,
                        "resource_group",
                        "Resource group requires exactly one of oneOf or remainder",
                    ));
                }
            };
            if items.is_empty() {
                return Err(error(
                    path,
                    group.mark,
                    "resource_group",
                    "Resource alternatives must not be empty",
                ));
            }
            let alternatives = items
                .iter()
                .map(|route| {
                    let fields = route.mapping(path, &["xml", "yaml"])?;
                    Ok(ResourceRoute {
                        xml: expression(path, route.field(path, fields, "xml")?)?,
                        yaml: expression(path, route.field(path, fields, "yaml")?)?,
                    })
                })
                .collect::<Result<_, Diagnostic>>()?;
            Ok(ResourceGroup {
                remainder,
                for_each: optional_field(fields, "forEach")
                    .map(|node| iteration(path, node))
                    .transpose()?,
                alternatives,
                source: location(path, group),
            })
        })
        .collect()
}
