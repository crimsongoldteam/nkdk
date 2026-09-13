use super::*;
use nkdk_rule_model::{YamlState, YamlStateForm};

pub(super) fn parse(path: &str, node: &Node) -> Result<YamlRepresentation, Diagnostic> {
    let fields = node.mapping(path, &["kind", "values"])?;
    if node.field(path, fields, "kind")?.text(path)? != "states" {
        return enumeration::table(path, node, "scalar", "literal")
            .map(YamlRepresentation::EnumTable);
    }
    let values = node.field(path, fields, "values")?;
    let Shape::Sequence(items) = &values.shape else {
        return Err(error(
            path,
            values.mark,
            "expected_sequence",
            "Expected state table",
        ));
    };
    let mut rows = Vec::new();
    for item in items {
        let fields = item.mapping(path, &["value", "form", "literal", "tag"])?;
        let form = match (
            optional_field(fields, "form"),
            optional_field(fields, "literal"),
        ) {
            (Some(form), None) => match form.text(path)? {
                "absent" => YamlStateForm::Absent,
                "empty" => YamlStateForm::Empty,
                _ => {
                    return Err(error(
                        path,
                        form.mark,
                        "invalid_state_form",
                        "Expected absent or empty",
                    ));
                }
            },
            (None, Some(text)) => YamlStateForm::Text(text.text(path)?.into()),
            _ => {
                return Err(error(
                    path,
                    item.mark,
                    "invalid_state_form",
                    "A state requires exactly one form or literal",
                ));
            }
        };
        let tag = optional_field(fields, "tag")
            .map(|tag| tag.text(path).map(str::to_owned))
            .transpose()?;
        if tag.as_ref().is_some_and(|tag| {
            matches!(form, YamlStateForm::Absent)
                || tag.is_empty()
                || tag.chars().any(|character| {
                    character.is_whitespace()
                        || matches!(character, '!' | '[' | ']' | '{' | '}' | ',')
                })
                || tag
                    .split('/')
                    .next()
                    .is_some_and(|prefix| matches!(prefix, "xml" | "invalid"))
        }) {
            return Err(error(
                path,
                item.mark,
                "invalid_state_tag",
                "Expected a semantic local tag on a present value",
            ));
        }
        if let Some(tag) = &tag {
            let expected = format!("!{tag}");
            let mut seen = 0;
            let source = format!("value: {expected} text");
            let parsed = nkdk_conversion_core::yaml::visit_tagged_scalars(
                source.as_bytes(),
                |key, value, actual| {
                    if key == "value"
                        && value.into_text()? == "text"
                        && actual.as_deref() == Some(expected.as_str())
                    {
                        seen += 1;
                    }
                    Ok(())
                },
            );
            if parsed.is_err() || seen != 1 {
                return Err(error(
                    path,
                    item.mark,
                    "invalid_state_tag",
                    "Semantic tag must have an unambiguous local YAML spelling",
                ));
            }
        }
        let value = item.field(path, fields, "value")?;
        rows.push(YamlState {
            value: value.text(path)?.into(),
            form,
            tag,
            source: location(path, value),
        });
    }
    Ok(YamlRepresentation::States(rows))
}

pub(super) fn presence(
    mut rules: Vec<Presence>,
    yaml: &YamlRepresentation,
) -> Result<Vec<Presence>, Diagnostic> {
    let YamlRepresentation::States(rows) = yaml else {
        return Ok(rules);
    };
    let Some(row) = rows.iter().find(|row| row.form == YamlStateForm::Absent) else {
        return Ok(rules);
    };
    let source = row.source.clone();
    let expression = |kind| Expression {
        kind,
        source: source.clone(),
    };
    let meaning = expression(ExpressionKind::Literal(ScalarLiteral::Text(
        row.value.clone(),
    )));
    let omit = expression(ExpressionKind::Compare {
        operator: ComparisonOperator::Equal,
        left: Box::new(expression(ExpressionKind::SelfValue)),
        right: Box::new(meaning.clone()),
    });
    if let Some(rule) = rules
        .iter_mut()
        .find(|rule| rule.target == PresenceTarget::SelfValue)
    {
        if rule.yaml_missing.is_some()
            || rule.yaml_omit_when.is_some()
            || !rule.yaml_empty.is_empty()
        {
            return Err(Diagnostic {
                code: "conflicting_state_presence".into(),
                file: source.file.clone(),
                line: source.line,
                column: source.column,
                message: "YAML state table already defines presence".into(),
                related: vec![rule.source.clone()],
            });
        }
        rule.yaml_missing = Some(meaning);
        rule.yaml_omit_when = Some(omit);
        rule.xml_missing
            .get_or_insert_with(|| expression(ExpressionKind::Absent));
    } else {
        rules.push(Presence {
            target: PresenceTarget::SelfValue,
            xml_missing: Some(expression(ExpressionKind::Absent)),
            xml_empty: vec![],
            yaml_missing: Some(meaning),
            yaml_empty: vec![],
            yaml_omit_when: Some(omit),
            xml_canonical: vec![],
            source,
        });
    }
    Ok(rules)
}
