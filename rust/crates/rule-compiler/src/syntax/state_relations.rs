//! Expand one finite table into the existing, direction-specific presence language.
use super::*;
use nkdk_rule_model::{StatePredicate, StateRelation};
use std::collections::BTreeSet;

struct Source {
    field: String,
    test: Expression,
    denotes: Expression,
    from: Option<Expression>,
}
struct Row {
    value: String,
    active: Vec<bool>,
}
fn expression(source: &SourceLocation, kind: ExpressionKind) -> Expression {
    Expression {
        kind,
        source: source.clone(),
    }
}
fn literal(source: &SourceLocation, value: &str) -> Expression {
    expression(
        source,
        ExpressionKind::Literal(ScalarLiteral::Text(value.into())),
    )
}
fn equal(source: &SourceLocation, left: Expression, right: Expression) -> Expression {
    expression(
        source,
        ExpressionKind::Compare {
            operator: ComparisonOperator::Equal,
            left: Box::new(left),
            right: Box::new(right),
        },
    )
}
fn conditional(
    source: &SourceLocation,
    test: Expression,
    yes: Expression,
    no: Expression,
) -> Expression {
    expression(
        source,
        ExpressionKind::Conditional {
            condition: Box::new(test),
            then_value: Box::new(yes),
            else_value: Box::new(no),
        },
    )
}
fn decision(
    source: &SourceLocation,
    sources: &[Source],
    rows: &[&Row],
    depth: usize,
) -> Expression {
    if depth == sources.len() {
        return literal(source, &rows[0].value);
    }
    let (yes, no): (Vec<_>, Vec<_>) = rows.iter().copied().partition(|row| row.active[depth]);
    conditional(
        source,
        sources[depth].test.clone(),
        decision(source, sources, &yes, depth + 1),
        decision(source, sources, &no, depth + 1),
    )
}
fn rule(
    source: &SourceLocation,
    field: &str,
    xml: Expression,
    yaml: Option<Expression>,
) -> Presence {
    Presence {
        target: PresenceTarget::Field(field.into()),
        xml_missing: Some(xml),
        yaml_missing: yaml,
        xml_empty: vec![],
        yaml_empty: vec![],
        yaml_omit_when: None,
        xml_canonical: vec![],
        source: source.clone(),
    }
}

pub(super) fn expand(
    path: &str,
    fields: &[(Node, Node)],
    mut rules: Vec<Presence>,
) -> Result<(Vec<Presence>, Vec<StateRelation>), Diagnostic> {
    let Some(node) = optional_field(fields, "state-relations") else {
        return Ok((rules, vec![]));
    };
    let mut relations = Vec::new();
    for node in sequence(path, node)? {
        let fields = node.mapping(path, &["field", "sources", "states"])?;
        let target = node.field(path, fields, "field")?.text(path)?;
        let source = location(path, node);
        let source_node = node.field(path, fields, "sources")?;
        let Shape::Mapping(entries) = &source_node.shape else {
            return Err(error(
                path,
                source_node.mark,
                "expected_mapping",
                "Expected relation sources",
            ));
        };
        if entries.is_empty() {
            return Err(error(
                path,
                source_node.mark,
                "empty_state_sources",
                "A relation requires sources",
            ));
        }
        let mut sources = Vec::new();
        for (key, value) in entries {
            let field = key.text(path)?;
            if field == target {
                return Err(error(
                    path,
                    key.mark,
                    "state_relation_cycle",
                    "A state cannot be its own source",
                ));
            }
            let parts = value.mapping(path, &["present", "equals", "from"])?;
            let modes: Vec<_> = parts
                .iter()
                .filter(|(key, _)| key.text(path).is_ok_and(|key| key != "from"))
                .collect();
            if modes.len() != 1 {
                return Err(error(
                    path,
                    value.mark,
                    "invalid_state_source",
                    "Choose exactly one present or equals source",
                ));
            }
            let (mode, denotes) = modes[0];
            let denotes = super::expression(path, denotes)?;
            let field_expression = expression(&source, ExpressionKind::Field(field.into()));
            let present = expression(
                &source,
                ExpressionKind::StateTest {
                    predicate: StatePredicate::Present,
                    value: Box::new(field_expression.clone()),
                },
            );
            let test = if mode.text(path)? == "present" {
                present
            } else {
                expression(
                    &source,
                    ExpressionKind::And(vec![
                        present,
                        equal(&source, field_expression, denotes.clone()),
                    ]),
                )
            };
            sources.push(Source {
                field: field.into(),
                test,
                denotes,
                from: optional_field(parts, "from")
                    .map(|node| super::expression(path, node))
                    .transpose()?,
            });
        }
        let states_node = node.field(path, fields, "states")?;
        let Shape::Mapping(entries) = &states_node.shape else {
            return Err(error(
                path,
                states_node.mark,
                "expected_mapping",
                "Expected state table",
            ));
        };
        let mut rows = Vec::new();
        let mut combinations = BTreeSet::new();
        for (key, value) in entries {
            let mut active = vec![false; sources.len()];
            for name in sequence(path, value)? {
                let name_text = name.text(path)?;
                let Some(index) = sources.iter().position(|source| source.field == name_text)
                else {
                    return Err(error(
                        path,
                        name.mark,
                        "unknown_state_source",
                        format!("Unknown relation source: {name_text}"),
                    ));
                };
                if active[index] {
                    return Err(error(
                        path,
                        name.mark,
                        "duplicate_state_source",
                        "A source occurs twice in a state",
                    ));
                }
                active[index] = true;
            }
            if !combinations.insert(active.clone()) {
                return Err(error(
                    path,
                    value.mark,
                    "ambiguous_state_relation",
                    "Two states describe the same source combination",
                ));
            }
            rows.push(Row {
                value: key.text(path)?.into(),
                active,
            });
        }
        let complete = u32::try_from(sources.len())
            .ok()
            .and_then(|shift| 1usize.checked_shl(shift));
        if complete != Some(rows.len()) {
            return Err(error(
                path,
                states_node.mark,
                "incomplete_state_relation",
                "The table must cover every source combination",
            ));
        }
        let omission = rules
            .iter()
            .position(|rule| {
                rule.target == PresenceTarget::Field(target.into())
                    && rule.xml_missing.is_none()
                    && rule.yaml_missing.is_none()
                    && rule.xml_empty.is_empty()
                    && rule.yaml_empty.is_empty()
                    && rule.xml_canonical.is_empty()
                    && rule.yaml_omit_when.is_some()
            })
            .and_then(|position| rules.remove(position).yaml_omit_when);
        for field in
            std::iter::once(target).chain(sources.iter().map(|source| source.field.as_str()))
        {
            if let Some(previous) = rules
                .iter()
                .find(|rule| rule.target == PresenceTarget::Field(field.into()))
            {
                let mut issue = error(
                    path,
                    node.mark,
                    "conflicting_state_presence",
                    format!("Relation already owns presence of {field}"),
                );
                issue.related.push(previous.source.clone());
                return Err(issue);
            }
        }
        let decision = decision(&source, &sources, &rows.iter().collect::<Vec<_>>(), 0);
        let mut state_rule = rule(&source, target, decision, None);
        state_rule.yaml_omit_when = omission;
        rules.push(state_rule);
        for (index, input) in sources.iter().enumerate() {
            let selected = rows
                .iter()
                .filter(|row| row.active[index])
                .map(|row| {
                    equal(
                        &source,
                        expression(&source, ExpressionKind::Field(target.into())),
                        literal(&source, &row.value),
                    )
                })
                .collect();
            let absent = expression(&source, ExpressionKind::Absent);
            let restored = conditional(
                &source,
                expression(&source, ExpressionKind::Or(selected)),
                input.denotes.clone(),
                absent.clone(),
            );
            rules.push(rule(
                &source,
                &input.field,
                input.from.clone().unwrap_or(absent),
                Some(restored),
            ));
        }
        relations.push(StateRelation {
            field: target.into(),
            computed_sources: sources
                .iter()
                .filter(|source| source.from.is_some())
                .map(|source| source.field.clone())
                .collect(),
            sources: sources.into_iter().map(|source| source.field).collect(),
            values: rows.into_iter().map(|row| row.value).collect(),
            source,
        });
    }
    Ok((rules, relations))
}
