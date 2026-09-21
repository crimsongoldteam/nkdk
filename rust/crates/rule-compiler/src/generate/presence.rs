use super::*;
use std::fmt::Write;
#[derive(Default)]
pub(super) struct Presence {
    pub definitions: String,
    pub xml_missing: bool,
    pub yaml_missing: bool,
    pub yaml_empty_mapping: bool,
    pub xml_value: String,
    pub xml_nil: bool,
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
    arguments: &[LinkedExpression],
    index: usize,
) -> Result<(String, String), Diagnostic> {
    let value = super::shorthand::specialize(value, bindings, arguments, owner)?;
    let with_self = uses_self(&value);
    let mut context = common.clone();
    context.id = owner.id;
    let (definitions, mut expression) = expressions::expression(&context, program, &value)?;
    if matches!(value.kind, LinkedExpressionKind::Input(_))
        && matches!(&value.value_type, LinkedType::Sequence(item) if **item == LinkedType::Scalar(ScalarType::Text))
    {
        expression = format!(
            "core::Sequence::Present(({expression}).iter().map(|item| match item {{ InputValue::Text(text)=>Ok(R{}{{fields:[text.clone()]}}), _=>Err(RuntimeDiagnostic::new(\"input.type\",\"Unexpected sequence item type\")) }}).collect::<core::Result<Vec<_>>>()?)",
            owner.id
        );
    }
    let return_type = match &value.value_type {
        LinkedType::Sequence(_) | LinkedType::Absent => format!("core::Sequence<R{}>", owner.id),
        LinkedType::Optional(inner) if matches!(inner.as_ref(), LinkedType::Sequence(_)) => {
            format!("core::Sequence<R{}>", owner.id)
        }
        LinkedType::Scalar(ScalarType::Boolean) => "bool".into(),
        LinkedType::Scalar(ScalarType::Text) => {
            expression = expressions::Expressions::text_owned(&value, expression);
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
            "fn {name}({value_parameter}_inputs: &InputView<'_>) -> core::Result<{return_type}> {{ {definitions} Ok({expression}) }}\n"
        ),
        format!("{name}({value_argument}_inputs)?"),
    ))
}
pub(super) fn generate(
    common: &LinkedEntry,
    owner: &LinkedEntry,
    program: &Program,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
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
    let mut empty_item = None;
    let mut xml_empty = "core::Sequence::Present(rows)".to_owned();
    let mut yaml_empty = xml_empty.clone();
    let mut yaml_sequence = xml_empty.clone();
    let mut has_empty_sequence = false;
    let ordinary_sequence = matches!(common.yaml, YamlRepresentation::Sequence { .. });
    let yaml_guard = if ordinary_sequence
        && (!common.constraints.is_empty()
            || super::collection_values::codec(common, program)?.is_some())
    {
        "value.annotations.is_empty() && "
    } else {
        ""
    };

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
                EmptyKind::Item => {
                    let (xml, _) = super::attributes::content(&common.xml);
                    if !matches!(&common.value, LinkedType::Sequence(item) if **item == LinkedType::Scalar(ScalarType::Text))
                        || !matches!(xml, LinkedXml::ElementSequence {item, ..} if matches!(item.as_ref(), LinkedXml::Text))
                    {
                        return Err(unsupported(
                            owner,
                            "Empty item requires a direct text sequence",
                        ));
                    }
                    empty_item = Some(expression(&form.denotes)?);
                }
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
                    result.yaml_empty_mapping = true;
                    yaml_empty = value.clone();
                    "{}"
                }
                EmptyKind::Sequence if ordinary_sequence => {
                    has_empty_sequence = true;
                    yaml_sequence = value.clone();
                    "[]"
                }
                EmptyKind::String if !ordinary_sequence => {
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
            let condition = if yaml_guard.is_empty() {
                condition
            } else {
                format!("{yaml_guard}({condition})")
            };
            writeln!(result.yaml_write, "if {condition} {{ return Ok(()); }}").unwrap();
        }
        // Canonical conditions are ordered; ordinary terminates selection as well.
        if !rule.canonical.is_empty() {
            let mut select = String::from("let canonical = || -> core::Result<usize> {\n");
            if rule.canonical.iter().any(|form| form.form == XmlForm::Nil) {
                result
                    .namespaces
                    .insert("http://www.w3.org/2001/XMLSchema-instance".into());
            }
            select.push_str(&super::canonical::selection(
                &rule.canonical,
                &mut expression,
            )?);
            select.push_str("};\n");
            let mut typed = String::new();
            for (index, form) in rule.canonical.iter().enumerate() {
                if let Some(name) = &form.xml_type {
                    result.namespaces.insert(name.namespace.clone());
                    result
                        .namespaces
                        .insert("http://www.w3.org/2001/XMLSchema-instance".into());
                    let mode = super::canonical::mode(form, index);
                    let attribute = super::canonical::type_attribute(name);
                    writeln!(typed, "{mode}=>{{let mut attributes=attributes;attributes.push({attribute});out.container_with_attributes({property},&attributes);return Ok(());}},").unwrap();
                }
            }
            writeln!(select, "match canonical()? {{ 1 => {{ if _retain_wrapper {{out.container_with_attributes({property}, &attributes);}} else {{out.ensure_container({root});}} return Ok(()); }}, 2 => {{ out.container_with_attributes({property}, &attributes); return Ok(()); }}, 3 => {{ let mut attributes=attributes; attributes.push(core::xml::WriteAttribute {{name:(\"http://www.w3.org/2001/XMLSchema-instance\", \"nil\"), value:core::xml::AttributeValue::Text(\"true\")}}); out.container_with_attributes({property}, &attributes); return Ok(()); }}, {typed} _ => {{}} }}").unwrap();
            result.xml_write.push_str(&select);
        }
    }
    let id = owner.id;
    if result.yaml_missing {
        writeln!(result.yaml_write, "if {yaml_guard}!value.rows.is_present() && std::cmp::PartialEq::eq(&value.rows, &({yaml_missing})) {{ return Ok(()); }}").unwrap();
    }
    for (value, output) in candidates {
        writeln!(result.yaml_write, "if {yaml_guard}std::cmp::PartialEq::eq(&value.rows, &({value})) {{ out.push_str(&core::yaml::scalar({key:?})); out.push_str({output:?}); return Ok(()); }}").unwrap();
    }
    if has_string {
        let position = if keep_self {
            "self.position=_position;"
        } else {
            ""
        };
        let form = if keep_form {
            "self.form=core::yaml::Form::Scalar;"
        } else {
            ""
        };
        result.yaml_empty_read = format!(
            "core::yaml::Node::Scalar(value, None) if self.depth==1 && self.key && !self.seen && value.is_empty() => {{ value.into_text()?; self.seen=true; self.empty_scalar=true; {position} {form} Ok(()) }},\n"
        );
    }
    let mut ordinary = format!(
        "if rows.is_empty() {{ {xml_empty} }} else {{ core::Sequence::<R{id}>::Present(rows) }}"
    );
    if let Some(empty) = empty_item {
        ordinary = format!(
            "if rows.len()==1 && rows[0].fields[0].is_empty() {{ {empty} }} else {{ {ordinary} }}"
        );
    }
    if let Some(nil) = nil_value {
        result.xml_nil = true;
        result.xml_attributes = format!(
            "if core::xml::matches(path, {property}) && _attribute.name.namespace==\"http://www.w3.org/2001/XMLSchema-instance\" && _attribute.name.local==\"nil\" {{ *nil=match _attribute.text.as_str() {{ \"true\" | \"1\" => true, \"false\" | \"0\" => false, _=>return Err(RuntimeDiagnostic::new(\"xml.nil-value\", \"Invalid nil value\")) }}; return Ok(()); }}"
        );
        result.xml_value = format!(
            "if !seen {{ {xml_missing} }} else if nil {{ if !rows.is_empty() {{ return Err(RuntimeDiagnostic::new(\"xml.nil-content\", \"Nil collection cannot contain items\")); }} {nil} }} else {{ {ordinary} }}"
        );
    } else {
        result.xml_value = format!("if !seen {{ {xml_missing} }} else {{ {ordinary} }}");
    }
    result.yaml_value = if ordinary_sequence {
        let mut cases = String::new();
        if result.yaml_empty_mapping {
            write!(
                cases,
                " else if _form==core::yaml::SequenceForm::EmptyMapping {{ {yaml_empty} }}"
            )
            .unwrap();
        }
        if has_empty_sequence {
            write!(cases, " else if _form==core::yaml::SequenceForm::Sequence && rows.is_empty() {{ {yaml_sequence} }}").unwrap();
        }
        format!(
            "if !seen {{ {yaml_missing} }}{cases} else {{ core::Sequence::<R{id}>::Present(rows) }}"
        )
    } else if has_string {
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
