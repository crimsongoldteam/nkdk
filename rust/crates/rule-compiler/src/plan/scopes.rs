use super::*;

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
