use super::*;

pub(super) fn field_dependencies(value: &LinkedType) -> Result<Vec<Vec<u32>>, Diagnostic> {
    let LinkedType::Record(fields) = value else {
        return Ok(vec![]);
    };
    let dependencies: Vec<Vec<u32>> = fields
        .iter()
        .map(|field| {
            let mut result = BTreeSet::new();
            collect(&field.value, &mut result);
            result.into_iter().collect()
        })
        .collect();
    let mut states = vec![0; fields.len()];
    for index in 0..fields.len() {
        visit(index, &dependencies, fields, &mut states)?;
    }
    Ok(dependencies)
}

fn collect(value: &LinkedType, result: &mut BTreeSet<u32>) {
    match value {
        LinkedType::BoundReference { bindings, .. } => {
            for binding in bindings {
                if let LinkedExpressionKind::Field(index) = binding.value.kind {
                    result.insert(index);
                }
            }
        }
        LinkedType::Sequence(item) => collect(item, result),
        LinkedType::Record(fields) => {
            for field in fields {
                collect(&field.value, result);
            }
        }
        _ => {}
    }
}

fn visit(
    index: usize,
    dependencies: &[Vec<u32>],
    fields: &[LinkedField],
    states: &mut [u8],
) -> Result<(), Diagnostic> {
    if states[index] == 2 {
        return Ok(());
    }
    states[index] = 1;
    for &dependency in &dependencies[index] {
        let target = dependency as usize;
        if states[target] == 1 {
            let mut error = diagnostic(
                "field_dependency_cycle",
                &fields[index].source,
                "Field bindings contain a cycle",
            );
            error.related.push(fields[target].source.clone());
            return Err(error);
        }
        visit(target, dependencies, fields, states)?;
    }
    states[index] = 2;
    Ok(())
}

pub(super) fn shift_fields(value: &mut LinkedType, offset: u32) {
    match value {
        LinkedType::BoundReference { bindings, .. } => {
            for binding in bindings {
                if let LinkedExpressionKind::Field(index) = &mut binding.value.kind {
                    *index += offset;
                }
            }
        }
        LinkedType::Sequence(item) => shift_fields(item, offset),
        LinkedType::Record(fields) => {
            for field in fields {
                shift_fields(&mut field.value, offset);
            }
        }
        _ => {}
    }
}
