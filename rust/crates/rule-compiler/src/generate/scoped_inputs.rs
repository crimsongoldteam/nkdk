//! Rebind profiles captured in a record's lexical input scope at placement.
use super::*;

pub(super) fn rebind(
    row: &LinkedEntry,
    bindings: &[LinkedBinding],
    program: &Program,
) -> Result<Option<nkdk_rule_model::Program>, Diagnostic> {
    let shifted = bindings.iter().any(|binding| {
        !matches!(binding.value.kind, LinkedExpressionKind::Input(slot) if slot == binding.slot)
    });
    let (LinkedType::Record(fields) | LinkedType::Choice(fields)) = &row.value else {
        return Ok(None);
    };
    let captured: BTreeSet<_> = fields
        .iter()
        .filter_map(|field| {
            let LinkedType::Reference(id) = field.value else {
                return None;
            };
            program
                .entries
                .iter()
                .any(|target| target.id == id && target.input_scope == Some(row.id))
                .then_some(id)
        })
        .collect();
    if !shifted || captured.is_empty() {
        return Ok(None);
    }
    let mut linked = nkdk_rule_model::Program {
        entries: program.entries.clone(),
    };
    for target in &mut linked.entries {
        if !captured.contains(&target.id) {
            continue;
        }
        let mut candidate = target.clone();
        match crate::link::sequence_item::rebind_input_expressions(&mut candidate, bindings) {
            Ok(()) => *target = candidate,
            // A captured contract can already address an enclosing scope.
            Err(error) if error.code == "missing_input_binding" => {}
            Err(error) => return Err(error),
        }
    }
    Ok(Some(linked))
}

pub(super) fn plan(
    program: Option<&nkdk_rule_model::Program>,
) -> Result<Option<Program<'_>>, Diagnostic> {
    program
        .map(crate::plan::build)
        .transpose()
        .map_err(|errors| errors.into_iter().next().expect("plan diagnostic"))
}
