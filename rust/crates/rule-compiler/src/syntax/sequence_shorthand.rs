use super::*;
use nkdk_rule_model::LiteralSequenceShorthand;

pub(super) fn parse(
    path: &str,
    node: Option<&Node>,
) -> Result<Vec<LiteralSequenceShorthand>, Diagnostic> {
    let Some(node) = node else {
        return Ok(vec![]);
    };
    let mut result: Vec<LiteralSequenceShorthand> = vec![];
    for item in sequence(path, node)? {
        let fields = item.mapping(path, &["id", "representation", "denotes"])?;
        let id = item.field(path, fields, "id")?.text(path)?.to_owned();
        let representation = item.field(path, fields, "representation")?;
        let parts = representation.mapping(path, &["kind", "value"])?;
        representation.field(path, parts, "kind")?.literal(
            path,
            "literal",
            "unsupported_representation",
        )?;
        let text = representation
            .field(path, parts, "value")?
            .text(path)?
            .to_owned();
        let denotes = item.field(path, fields, "denotes")?;
        let parts = denotes.mapping(path, &["sequence"])?;
        let values = sequence(path, denotes.field(path, parts, "sequence")?)?
            .iter()
            .map(|value| {
                let parts = value.mapping(path, &["literal"])?;
                Ok(value.field(path, parts, "literal")?.text(path)?.to_owned())
            })
            .collect::<Result<Vec<_>, Diagnostic>>()?;
        if result
            .iter()
            .any(|previous| previous.id == id || previous.text == text || previous.values == values)
        {
            return Err(error(
                path,
                item.mark,
                "ambiguous_shorthand",
                "Literal sequence shorthands must have unique ids, spellings and meanings",
            ));
        }
        result.push(LiteralSequenceShorthand {
            id,
            text,
            values,
            source: location(path, item),
        });
    }
    Ok(result)
}
