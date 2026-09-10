use super::*;

pub(super) fn constraints(
    path: &str,
    fields: &[(Node, Node)],
) -> Result<Vec<Constraint>, Diagnostic> {
    let Some(node) = optional_field(fields, "constraints") else {
        return Ok(vec![]);
    };
    let Shape::Sequence(items) = &node.shape else {
        return Err(error(
            path,
            node.mark,
            "expected_sequence",
            "Expected constraints",
        ));
    };
    items
        .iter()
        .map(|item| {
            let fields = item.mapping(
                path,
                &[
                    "id",
                    "appliesTo",
                    "when",
                    "assert",
                    "diagnostic",
                    "forms",
                    "forEach",
                ],
            )?;
            let id = item.field(path, fields, "id")?;
            let phases = item.field(path, fields, "appliesTo")?;
            let Shape::Sequence(phases) = &phases.shape else {
                return Err(error(
                    path,
                    phases.mark,
                    "expected_sequence",
                    "Expected validation phases",
                ));
            };
            let applies_to = phases
                .iter()
                .map(|phase| match phase.text(path)? {
                    "xml-import" => Ok(ValidationPhase::XmlImport),
                    "yaml-validation" => Ok(ValidationPhase::YamlValidation),
                    _ => Err(error(
                        path,
                        phase.mark,
                        "invalid_validation_phase",
                        "Unknown validation phase",
                    )),
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            let diagnostic = item.field(path, fields, "diagnostic")?;
            Ok(Constraint {
                id: id.text(path)?.into(),
                applies_to,
                for_each: optional_field(fields, "forEach")
                    .map(|node| {
                        let fields = node.mapping(path, &["in", "as"])?;
                        Ok(Iteration {
                            input: expression(path, node.field(path, fields, "in")?)?,
                            binding: node.field(path, fields, "as")?.text(path)?.into(),
                            source: location(path, node),
                        })
                    })
                    .transpose()?,
                forms: string_list(path, optional_field(fields, "forms"))?,
                when: optional_field(fields, "when")
                    .map(|node| expression(path, node))
                    .transpose()?,
                assertion: expression(path, item.field(path, fields, "assert")?)?,
                diagnostic: diagnostic_definition(path, diagnostic)?,
                source: location(path, id),
            })
        })
        .collect()
}

pub(super) fn diagnostic_definition(
    path: &str,
    node: &Node,
) -> Result<DiagnosticDefinition, Diagnostic> {
    let fields = node.mapping(path, &["code", "source", "severity", "at", "message"])?;
    let severity = node.field(path, fields, "severity")?;
    let severity = match severity.text(path)? {
        "error" => Severity::Error,
        "warning" => Severity::Warning,
        "info" => Severity::Info,
        _ => {
            return Err(error(
                path,
                severity.mark,
                "invalid_severity",
                "Unknown severity",
            ));
        }
    };
    let at = node.field(path, fields, "at")?;
    let address = at.mapping(path, &["self", "field", "occurrence"])?;
    let target = if let Some(value) = optional_field(address, "self") {
        at.mapping(path, &["self"])?;
        if scalar_literal(path, value)? != ScalarLiteral::Boolean(true) {
            return Err(error(
                path,
                value.mark,
                "invalid_target",
                "Expected self: true",
            ));
        }
        DiagnosticTarget::SelfValue
    } else if let Some(name) = optional_field(address, "occurrence") {
        DiagnosticTarget::Occurrence {
            name: name.text(path)?.into(),
            field: at.field(path, address, "field")?.text(path)?.into(),
        }
    } else {
        DiagnosticTarget::Field(at.field(path, address, "field")?.text(path)?.into())
    };
    Ok(DiagnosticDefinition {
        code: optional_field(fields, "code")
            .map(|node| node.text(path).map(str::to_owned))
            .transpose()?,
        source: optional_field(fields, "source")
            .map(|node| node.text(path).map(str::to_owned))
            .transpose()?,
        severity,
        at: target,
        message: message_definition(path, node.field(path, fields, "message")?)?,
    })
}

pub(super) fn message_definition(path: &str, node: &Node) -> Result<MessageDefinition, Diagnostic> {
    if let Shape::Scalar(_, _) = node.shape {
        return Ok(MessageDefinition::Text(node.text(path)?.into()));
    }
    let fields = node.mapping(path, &["parts"])?;
    let parts = node.field(path, fields, "parts")?;
    let Shape::Sequence(items) = &parts.shape else {
        return Err(error(
            path,
            parts.mark,
            "expected_sequence",
            "Expected message parts",
        ));
    };
    let parts = items
        .iter()
        .map(|item| {
            if let Shape::Scalar(_, _) = item.shape {
                Ok(MessagePart::Text(item.text(path)?.into()))
            } else {
                Ok(MessagePart::Expression(expression(path, item)?))
            }
        })
        .collect::<Result<Vec<_>, Diagnostic>>()?;
    Ok(MessageDefinition::Parts(parts))
}

pub(super) fn string_list(path: &str, node: Option<&Node>) -> Result<Vec<String>, Diagnostic> {
    let Some(node) = node else {
        return Ok(vec![]);
    };
    let Shape::Sequence(items) = &node.shape else {
        return Err(error(
            path,
            node.mark,
            "expected_sequence",
            "Expected string list",
        ));
    };
    items
        .iter()
        .map(|item| item.text(path).map(str::to_owned))
        .collect()
}
