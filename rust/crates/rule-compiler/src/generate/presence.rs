use super::*;
use std::fmt::Write;
#[derive(Default)]
pub(super) struct Presence {
    pub definitions: String,
    pub xml_missing: bool,
    pub yaml_missing: bool,
    pub xml_value: String,
    pub xml_local: String,
    pub xml_attributes: String,
    pub namespaces: BTreeSet<String>,
    pub yaml_value: String,
    pub yaml_write: String,
    pub xml_write: String,
    pub yaml_empty_read: String,
}
fn uses_self(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::SelfValue => true,
        LinkedExpressionKind::Operation { arguments, .. } => arguments.iter().any(uses_self),
        _ => false,
    }
}
fn code(
    value: &LinkedExpression,
    common: &LinkedEntry,
    owner: &LinkedEntry,
    program: &Program,
    bindings: &[LinkedBinding],
    arguments: &[ScalarLiteral],
    index: usize,
) -> Result<(String, String), Diagnostic> {
    let value = super::shorthand::specialize(value, bindings, arguments, owner)?;
    let with_self = uses_self(&value);
    let mut context = common.clone();
    context.id = owner.id;
    let (definitions, mut expression) = expressions::expression(&context, program, &value)?;
    let return_type = match &value.value_type {
        LinkedType::Sequence(_) | LinkedType::Absent => format!("core::Sequence<R{}>", owner.id),
        LinkedType::Optional(inner) if matches!(inner.as_ref(), LinkedType::Sequence(_)) => {
            format!("core::Sequence<R{}>", owner.id)
        }
        LinkedType::Scalar(ScalarType::Boolean) => "bool".into(),
        LinkedType::Scalar(ScalarType::Text) => {
            expression = format!("({expression}).to_owned()");
            "String".into()
        }
        _ => {
            return Err(unsupported(
                owner,
                "Presence expression type is not generated",
            ));
        }
    };
    let name = format!("presence_{}_{index}", owner.id);
    let (value_parameter, value_argument) = if with_self {
        (format!("_value: &V{}, ", owner.id), "_value, ")
    } else {
        (String::new(), "")
    };
    Ok((
        format!(
            "fn {name}({value_parameter}_inputs: &PreparedInputs) -> core::Result<{return_type}> {{ {definitions} Ok({expression}) }}\n"
        ),
        format!("{name}({value_argument}_inputs)?"),
    ))
}
pub(super) fn generate(
    common: &LinkedEntry,
    owner: &LinkedEntry,
    program: &Program,
    bindings: &[LinkedBinding],
    arguments: &[ScalarLiteral],
    key: &str,
    parent: &[ExpandedName],
) -> Result<Presence, Diagnostic> {
    let mut definitions = String::new();
    let mut next_function = 0;
    let mut expression = |value: &LinkedExpression| {
        let (function, expression) = code(
            value,
            common,
            owner,
            program,
            bindings,
            arguments,
            next_function,
        )?;
        next_function += 1;
        definitions.push_str(&function);
        Ok::<_, Diagnostic>(expression)
    };
    let mut result = Presence::default();
    let mut xml_missing = "core::Sequence::Absent".to_owned();
    let mut yaml_missing = xml_missing.clone();
    let mut nil_value = None;
    let mut xml_empty = "core::Sequence::Present(rows)".to_owned();
    let mut yaml_empty = xml_empty.clone();
    let mut yaml_string = xml_empty.clone();
    let mut has_string = false;
    let mut candidates = Vec::new();
    let keep_self = common
        .constraints
        .iter()
        .any(|rule| matches!(rule.diagnostic.at, LinkedDiagnosticTarget::SelfValue));
    let keep_form = common.constraints.iter().any(|rule| {
        rule.applies_to.contains(&ValidationPhase::YamlValidation) && !rule.forms.is_empty()
    });
    let root = super::record::path_code(&parent[..parent.len() - 1]);
    let property = super::record::path_code(parent);
    for rule in &common.presence {
        if rule.target != LinkedPresenceTarget::SelfValue {
            return Err(unsupported(
                owner,
                "Nested field presence requires nested storage",
            ));
        }
        if let Some(value) = &rule.xml_missing {
            result.xml_missing = true;
            xml_missing = expression(value)?;
        }
        if let Some(value) = &rule.yaml_missing {
            result.yaml_missing = true;
            yaml_missing = expression(value)?;
        }
        for form in &rule.xml_empty {
            match form.form {
                EmptyKind::Element => xml_empty = expression(&form.denotes)?,
                EmptyKind::Nil => {
                    nil_value = Some(expression(&form.denotes)?);
                    result
                        .namespaces
                        .insert("http://www.w3.org/2001/XMLSchema-instance".into());
                }
                _ => return Err(unsupported(owner, "Unsupported XML empty form")),
            }
        }
        for form in &rule.yaml_empty {
            let value = expression(&form.denotes)?;
            let literal = match form.form {
                EmptyKind::Mapping => {
                    yaml_empty = value.clone();
                    "{}"
                }
                EmptyKind::String => {
                    yaml_string = value.clone();
                    has_string = true;
                    "\"\""
                }
                _ => return Err(unsupported(owner, "YAML empty form is not generated")),
            };
            candidates.push((value, format!(": {literal}")));
        }
        if let Some(omit) = &rule.yaml_omit_when {
            let condition = expression(omit)?;
            writeln!(
                result.yaml_write,
                "if {condition} {{ return Ok(Vec::new()); }}"
            )
            .unwrap();
        }
        // Canonical conditions are ordered; ordinary terminates selection as well.
        if !rule.canonical.is_empty() {
            let mut select = String::from("let canonical = || -> core::Result<u8> {\n");
            for form in &rule.canonical {
                let mode = match form.form {
                    XmlForm::Ordinary => 0,
                    XmlForm::Missing => 1,
                    XmlForm::EmptyElement => 2,
                    XmlForm::Nil => {
                        result
                            .namespaces
                            .insert("http://www.w3.org/2001/XMLSchema-instance".into());
                        3
                    }
                };
                if let Some(when) = &form.when {
                    writeln!(select, "if {} {{ return Ok({mode}); }}", expression(when)?).unwrap();
                } else {
                    writeln!(select, "Ok({mode})").unwrap();
                    break;
                }
            }
            // A final unconditional arm is handled without emitting unreachable code.
            if rule.canonical.last().is_none_or(|form| form.when.is_some()) {
                select.push_str("Ok(0)\n");
            }
            select.push_str("};\n");
            writeln!(select, "match canonical()? {{ 1 => {{ out.container({root}); return Ok(out.finish()); }}, 2 => {{ out.container_with_attributes({property}, &attributes); return Ok(out.finish()); }}, 3 => {{ let mut attributes=attributes; attributes.push(core::xml::WriteAttribute {{name:(\"http://www.w3.org/2001/XMLSchema-instance\", \"nil\"), value:core::xml::AttributeValue::Text(\"true\")}}); out.container_with_attributes({property}, &attributes); return Ok(out.finish()); }}, _ => {{}} }}").unwrap();
            result.xml_write.push_str(&select);
        }
    }
    let id = owner.id;
    if result.yaml_missing {
        writeln!(result.yaml_write, "if !value.rows.is_present() && std::cmp::PartialEq::eq(&value.rows, &({yaml_missing})) {{ return Ok(Vec::new()); }}").unwrap();
    }
    for (value, output) in candidates {
        writeln!(result.yaml_write, "if std::cmp::PartialEq::eq(&value.rows, &({value})) {{ let mut output=core::yaml::scalar({key:?}); output.push_str({output:?}); return Ok(output.into_bytes()); }}").unwrap();
    }
    if has_string {
        let position = if keep_self { "position=_position;" } else { "" };
        let form = if keep_form {
            "form=core::yaml::Form::Scalar;"
        } else {
            ""
        };
        result.yaml_empty_read = format!(
            "core::yaml::Node::Scalar(value, None) if depth==1 && key && !seen && value.is_empty() => {{ value.into_text()?; seen=true; empty_scalar=true; {position} {form} Ok(()) }},\n"
        );
    }
    let ordinary = format!(
        "if rows.is_empty() {{ {xml_empty} }} else {{ core::Sequence::<R{id}>::Present(rows) }}"
    );
    if let Some(nil) = nil_value {
        result.xml_local = "let mut nil=false;".into();
        result.xml_attributes = format!(
            "if core::xml::matches(path, {property}) && _attribute.name.namespace==\"http://www.w3.org/2001/XMLSchema-instance\" && _attribute.name.local==\"nil\" {{ nil=match _attribute.text.as_str() {{ \"true\" | \"1\" => true, \"false\" | \"0\" => false, _=>return Err(RuntimeDiagnostic::new(\"xml.nil-value\", \"Invalid nil value\")) }}; return Ok(()); }}"
        );
        result.xml_value = format!(
            "if !seen {{ {xml_missing} }} else if nil {{ if !rows.is_empty() {{ return Err(RuntimeDiagnostic::new(\"xml.nil-content\", \"Nil collection cannot contain items\")); }} {nil} }} else {{ {ordinary} }}"
        );
    } else {
        result.xml_value = format!("if !seen {{ {xml_missing} }} else {{ {ordinary} }}");
    }
    result.yaml_value = if has_string {
        format!(
            "if !seen {{ {yaml_missing} }} else if empty_scalar {{ {yaml_string} }} else if rows.is_empty() {{ {yaml_empty} }} else {{ core::Sequence::<R{id}>::Present(rows) }}"
        )
    } else {
        format!(
            "if !seen {{ {yaml_missing} }} else if rows.is_empty() {{ {yaml_empty} }} else {{ core::Sequence::<R{id}>::Present(rows) }}"
        )
    };
    if let Some(normalization) = &common.normalization {
        let condition = expression(&normalization.when)?;
        let normalized = expression(&normalization.denotes)?;
        result.xml_value = format!(
            "{{ let rows={}; if rows.is_present() && rows.is_empty() && {condition} {{ {normalized} }} else {{ rows }} }}",
            result.xml_value
        );
    }
    result.definitions = definitions;
    Ok(result)
}
