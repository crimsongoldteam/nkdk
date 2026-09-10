use super::*;
use std::fmt::Write;

pub(super) struct ScalarShorthand {
    pub definitions: String,
    pub read: String,
    pub read_keyed: String,
    pub write: String,
}
pub(super) fn specialize(
    value: &LinkedExpression,
    bindings: &[LinkedBinding],
    arguments: &[ScalarLiteral],
    owner: &LinkedEntry,
) -> Result<LinkedExpression, Diagnostic> {
    let mut value = value.clone();
    match &mut value.kind {
        LinkedExpressionKind::Input(slot) => {
            return bindings
                .iter()
                .find(|binding| binding.slot == *slot)
                .map(|binding| binding.value.clone())
                .ok_or_else(|| unsupported(owner, "Missing common input binding"));
        }
        LinkedExpressionKind::Parameter(slot) => {
            value.kind = LinkedExpressionKind::Literal(
                arguments
                    .get(*slot as usize)
                    .ok_or_else(|| unsupported(owner, "Missing static argument"))?
                    .clone(),
            )
        }
        LinkedExpressionKind::Operation {
            arguments: children,
            ..
        } => {
            for child in children {
                *child = specialize(child, bindings, arguments, owner)?;
            }
        }
        _ => {}
    }
    Ok(value)
}
pub(super) fn scalar(
    owner: &LinkedEntry,
    common: &LinkedEntry,
    program: &Program,
    bindings: &[LinkedBinding],
    arguments: &[ScalarLiteral],
    fields: &[LinkedField],
) -> Result<ScalarShorthand, Diagnostic> {
    let mut result = ScalarShorthand {
        definitions: String::new(),
        read: String::new(),
        read_keyed: String::new(),
        write: String::new(),
    };
    for (index, shorthand) in common.shorthands.iter().enumerate() {
        if matches!(
            shorthand.representation,
            LinkedShorthandRepresentation::KeyedMapping { .. }
        ) {
            let pattern = super::patterns::generate(
                owner, common, program, bindings, arguments, fields, index,
            )?;
            result.definitions.push_str(&pattern.definitions);
            result.read_keyed.push_str(&pattern.read);
            result.write.push_str(&pattern.write);
            continue;
        }
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Sequence,
            arguments: rows,
        } = &shorthand.denotes.kind
        else {
            return Err(unsupported(
                owner,
                "Scalar shorthand requires a sequence constructor",
            ));
        };
        if rows.len() != 1 {
            return Err(unsupported(owner, "Scalar shorthand needs one record"));
        }
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Record(names),
            arguments: values,
        } = &rows[0].kind
        else {
            return Err(unsupported(owner, "Scalar shorthand requires a record"));
        };
        let capture = values
            .iter()
            .position(|value| matches!(value.kind, LinkedExpressionKind::Capture(_)))
            .ok_or_else(|| unsupported(owner, "Scalar shorthand needs a direct capture"))?;
        if values.len() != 2 {
            return Err(unsupported(
                owner,
                "Scalar shorthand record must have two fields",
            ));
        }
        let fixed = 1 - capture;
        let capture_field = fields
            .iter()
            .position(|field| field.name == names[capture])
            .expect("linked field");
        let fixed_field = fields
            .iter()
            .position(|field| field.name == names[fixed])
            .expect("linked field");
        let expression = specialize(&values[fixed], bindings, arguments, owner)?;
        let (definitions, expression) = expressions::expression(owner, program, &expression)?;
        let function = format!("scalar_short_{}_{index}", owner.id);
        let when = if let Some(when) = &shorthand.when {
            let when = specialize(when, bindings, arguments, owner)?;
            let (defs, code) = expressions::expression(owner, program, &when)?;
            if defs.is_empty() {
                code
            } else {
                format!("(|| {{ {defs} Ok::<_, RuntimeDiagnostic>({code}) }})()?")
            }
        } else {
            "true".into()
        };
        writeln!(result.definitions, "fn {function}(_inputs: &PreparedInputs) -> core::Result<Option<String>> {{ {definitions} if {when} {{ Ok(Some(({expression}).to_owned())) }} else {{ Ok(None) }} }}").unwrap();
        let row_position = if common.constraints.iter().any(|rule| {
            matches!(
                rule.diagnostic.at,
                LinkedDiagnosticTarget::Occurrence { .. }
            )
        }) {
            ", positions: [_position; 2]"
        } else {
            ""
        };
        let form_scalar = if common.constraints.iter().any(|rule| {
            rule.applies_to.contains(&ValidationPhase::YamlValidation) && !rule.forms.is_empty()
        }) {
            "form=core::yaml::Form::Scalar;"
        } else {
            ""
        };
        let parent_position = if common
            .constraints
            .iter()
            .any(|rule| matches!(rule.diagnostic.at, LinkedDiagnosticTarget::SelfValue))
        {
            "position=_position;"
        } else {
            ""
        };
        writeln!(result.read, "core::yaml::Node::Scalar(value, None) if depth==1 && key && !seen => {{ let text=value.into_text()?; let fixed={function}(_inputs)?.ok_or_else(|| RuntimeDiagnostic::new(\"yaml.shorthand\", \"Scalar shorthand is not applicable\"))?; let mut fields=[String::new(), String::new()]; fields[{capture_field}]=text; fields[{fixed_field}]=fixed; rows.push(R{} {{ fields{row_position} }}); seen=true; {parent_position} {form_scalar} Ok(()) }},", owner.id).unwrap();
        writeln!(result.write, "if shorten && value.rows.len()==1 && {function}(_inputs)?.is_some_and(|fixed| value.rows[0].fields[{fixed_field}]==fixed) {{ out.push(' '); out.push_str(&core::yaml::scalar(&value.rows[0].fields[{capture_field}])); return Ok(out.into_bytes()); }}").unwrap();
    }
    if !result.read_keyed.is_empty() {
        writeln!(result.definitions, "fn expand_keys_{}(rows: Vec<R{}>, _inputs: &PreparedInputs) -> core::Result<Vec<R{}>> {{ {} Ok(rows) }}", owner.id, owner.id, owner.id, result.read_keyed).unwrap();
        result.read_keyed = format!(
            "if keyed_input && !rows.is_empty() {{ rows=expand_keys_{}(rows, _inputs)?; }}",
            owner.id
        );
    }
    Ok(result)
}

pub(super) fn specialize_constraint(
    constraint: &mut LinkedConstraint,
    bindings: &[LinkedBinding],
    arguments: &[ScalarLiteral],
    owner: &LinkedEntry,
) -> Result<(), Diagnostic> {
    constraint.assertion = specialize(&constraint.assertion, bindings, arguments, owner)?;
    if let Some(when) = &mut constraint.when {
        *when = specialize(when, bindings, arguments, owner)?;
    }
    if let Some(iteration) = &mut constraint.for_each {
        iteration.input = specialize(&iteration.input, bindings, arguments, owner)?;
    }
    for part in &mut constraint.diagnostic.message {
        if let LinkedMessagePart::Expression(value) = part {
            *value = specialize(value, bindings, arguments, owner)?;
        }
    }
    Ok(())
}
