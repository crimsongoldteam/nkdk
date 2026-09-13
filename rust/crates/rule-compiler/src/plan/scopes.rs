use super::*;
mod captures;
pub(crate) use captures::capture_inputs;

/// Dependencies order evaluation, never physical XML or YAML fields.
pub(crate) fn schedule(
    dependencies: &[Vec<u32>],
    fields: &[LinkedField],
) -> Result<Vec<usize>, Diagnostic> {
    fn visit(
        index: usize,
        dependencies: &[Vec<u32>],
        fields: &[LinkedField],
        states: &mut [u8],
        path: &mut Vec<usize>,
        result: &mut Vec<usize>,
    ) -> Result<(), Diagnostic> {
        if states[index] == 2 {
            return Ok(());
        }
        if states[index] == 1 {
            let mut error = diagnostic(
                "field_dependency_cycle",
                &fields[index].source,
                "Field bindings contain a cycle",
            );
            error.related.extend(
                path.iter()
                    .skip_while(|&&field| field != index)
                    .skip(1)
                    .map(|&field| fields[field].source.clone()),
            );
            return Err(error);
        }
        states[index] = 1;
        path.push(index);
        for &dependency in &dependencies[index] {
            visit(
                dependency as usize,
                dependencies,
                fields,
                states,
                path,
                result,
            )?;
        }
        path.pop();
        states[index] = 2;
        result.push(index);
        Ok(())
    }
    let mut result = Vec::with_capacity(fields.len());
    let mut states = vec![0; dependencies.len()];
    let mut path = Vec::new();
    for index in 0..dependencies.len() {
        visit(
            index,
            dependencies,
            fields,
            &mut states,
            &mut path,
            &mut result,
        )?;
    }
    Ok(result)
}

pub(crate) fn dependencies(
    value: &LinkedType,
    presence: &[LinkedPresence],
) -> Result<Vec<Vec<u32>>, Diagnostic> {
    let LinkedType::Record(fields) = value else {
        return Ok(vec![]);
    };
    let mut sets: Vec<BTreeSet<u32>> = fields
        .iter()
        .map(|field| {
            let mut result = BTreeSet::new();
            collect(&field.value, &mut result);
            result
        })
        .collect();
    for rule in presence {
        if let LinkedPresenceTarget::Field(index) = rule.target {
            let target = &mut sets[index as usize];
            for value in rule.xml_missing.iter().chain(&rule.yaml_missing).chain(
                rule.xml_empty
                    .iter()
                    .chain(&rule.yaml_empty)
                    .map(|form| &form.denotes),
            ) {
                collect_expression(value, target);
            }
        }
    }
    let dependencies: Vec<Vec<u32>> = sets
        .into_iter()
        .map(|set| set.into_iter().collect())
        .collect();
    Ok(dependencies)
}

fn collect(value: &LinkedType, result: &mut BTreeSet<u32>) {
    match value {
        LinkedType::BoundReference { bindings, .. } => {
            for binding in bindings {
                collect_expression(&binding.value, result);
            }
        }
        LinkedType::Sequence(item) => collect(item, result),
        // A nested record declares its own field slots, not owner dependencies.
        LinkedType::Record(_) => {}
        _ => {}
    }
}

fn collect_expression(value: &LinkedExpression, result: &mut BTreeSet<u32>) {
    match &value.kind {
        LinkedExpressionKind::SelfValue => {
            if let LinkedType::Record(fields) = &value.value_type {
                result.extend(0..fields.len() as u32);
            }
        }
        LinkedExpressionKind::Field(index) => {
            result.insert(*index);
        }
        LinkedExpressionKind::Operation { arguments, .. } => {
            for argument in arguments {
                collect_expression(argument, result);
            }
        }
        _ => {}
    }
}
