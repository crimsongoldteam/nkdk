use super::*;

/// A new spelling of an existing text value keeps the original semantic contract.
pub(super) fn apply(entry: &mut LinkedEntry, source: &LinkedEntry) -> Result<(), Diagnostic> {
    let mut xml = &entry.xml;
    while let LinkedXml::WithAttributes { content, .. } = xml {
        xml = content;
    }
    let compatible = match &source.value {
        LinkedType::Scalar(ScalarType::Text) => {
            source.xml == LinkedXml::Text
                && matches!(
                    source.yaml,
                    YamlRepresentation::Text
                        | YamlRepresentation::TextTable(_)
                        | YamlRepresentation::InputTextTable(_)
                )
                && *xml == LinkedXml::Text
                && matches!(
                    entry.yaml,
                    YamlRepresentation::Text
                        | YamlRepresentation::TextTable(_)
                        | YamlRepresentation::InputTextTable(_)
                )
        }
        LinkedType::Choice(_) => {
            matches!(source.xml, LinkedXml::Choice { .. })
                && matches!(source.yaml, YamlRepresentation::Choice { .. })
                && matches!(*xml, LinkedXml::Choice { .. })
                && matches!(entry.yaml, YamlRepresentation::Choice { .. })
        }
        _ => false,
    };
    if !matches!(
        entry.value,
        LinkedType::Reference(_) | LinkedType::BoundReference { .. }
    ) || !compatible
        || !source.parameters.is_empty()
        || !source.presence.is_empty()
        || !source.shorthands.is_empty()
        || !source.contributions.is_empty()
        || source.normalization.is_some()
        || !source.text_transforms.is_empty()
    {
        return Err(diagnostic(
            "text_projection_source",
            &entry.source,
            "Text projection requires text or a textual choice without parameters, presence, normalization or contributions",
        ));
    }
    let mut constraints = source.constraints.clone();
    for constraint in &mut constraints {
        constraint.id = format!("{}::{}", source.name, constraint.id);
        if entry.constraints.iter().any(|own| own.id == constraint.id) {
            let mut issue = diagnostic(
                "duplicate_constraint",
                &entry.source,
                "Projected constraint conflicts with a local constraint",
            );
            issue.related.push(constraint.source.clone());
            return Err(issue);
        }
    }
    constraints.append(&mut entry.constraints);
    entry.constraints = constraints;
    entry.value = source.value.clone();
    Ok(())
}
