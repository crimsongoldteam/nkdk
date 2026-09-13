use super::*;

pub(super) fn presence(path: &str, fields: &[(Node, Node)]) -> Result<Vec<Presence>, Diagnostic> {
    let Some(value) = fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(name, _) if name == "presence" => Some(value),
        _ => None,
    }) else {
        return Ok(vec![]);
    };
    let Shape::Sequence(entries) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_sequence",
            "Expected presence entries",
        ));
    };
    let mut targets = std::collections::HashMap::new();
    entries
        .iter()
        .map(|entry| {
            let fields = entry.mapping(path, &["target", "xml", "yaml"])?;
            let target = entry.field(path, fields, "target")?;
            let target_kind = if let Shape::Mapping(_) = &target.shape {
                let fields = target.mapping(path, &["field"])?;
                PresenceTarget::Field(target.field(path, fields, "field")?.text(path)?.into())
            } else {
                target.literal(path, "self", "invalid_target")?;
                PresenceTarget::SelfValue
            };
            let target_key = match &target_kind {
                PresenceTarget::SelfValue => (true, String::new()),
                PresenceTarget::Field(name) => (false, name.clone()),
            };
            if let Some(first) = targets.insert(target_key, target.mark) {
                return Err(repeated(
                    path,
                    target.mark,
                    first,
                    "duplicate_presence_target",
                ));
            }
            let xml = optional_field(fields, "xml")
                .map(|node| node.mapping(path, &["missing", "empty", "canonical"]))
                .transpose()?;
            let yaml = optional_field(fields, "yaml")
                .map(|node| node.mapping(path, &["missing", "empty", "omitWhen", "default"]))
                .transpose()?;
            let xml_fields = xml.unwrap_or(&[]);
            let yaml_fields = yaml.unwrap_or(&[]);
            let forms = if let Some(canonical) = optional_field(xml_fields, "canonical") {
                let Shape::Sequence(forms) = &canonical.shape else {
                    return Err(error(
                        path,
                        canonical.mark,
                        "expected_sequence",
                        "Expected canonical forms",
                    ));
                };
                forms.as_slice()
            } else {
                &[]
            };
            let xml_canonical = forms
                .iter()
                .enumerate()
                .map(|(index, form)| {
                    let fields = form.mapping(path, &["when", "form"])?;
                    let when = fields
                        .iter()
                        .find_map(|(key, value)| match &key.shape {
                            Shape::Scalar(name, _) if name == "when" => Some(value),
                            _ => None,
                        })
                        .map(|value| expression(path, value))
                        .transpose()?;
                    if when.is_none() && index + 1 != forms.len() {
                        return Err(error(
                            path,
                            form.mark,
                            "early_canonical_fallback",
                            "Unconditional form must be last",
                        ));
                    }
                    let name = form.field(path, fields, "form")?;
                    let kind = match name.text(path)? {
                        "ordinary" => XmlForm::Ordinary,
                        "empty-element" => XmlForm::EmptyElement,
                        "nil" => XmlForm::Nil,
                        "missing" => XmlForm::Missing,
                        _ => {
                            return Err(error(
                                path,
                                name.mark,
                                "invalid_xml_form",
                                "Unknown canonical XML form",
                            ));
                        }
                    };
                    Ok(CanonicalForm {
                        when,
                        form: kind,
                        source: location(path, name),
                    })
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            let default = optional_field(yaml_fields, "default");
            if let Some(default) = default
                && (optional_field(yaml_fields, "missing").is_some()
                    || optional_field(yaml_fields, "omitWhen").is_some())
            {
                return Err(error(
                    path,
                    default.mark,
                    "conflicting_yaml_default",
                    "YAML default already defines missing and omitWhen",
                ));
            }
            let (yaml_missing, yaml_omit_when) = if let Some(default) = default {
                let value = expression(path, default)?;
                let source = location(path, default);
                let target = Expression {
                    kind: match &target_kind {
                        PresenceTarget::SelfValue => ExpressionKind::SelfValue,
                        PresenceTarget::Field(name) => ExpressionKind::Field(name.clone()),
                    },
                    source: source.clone(),
                };
                (
                    Some(value.clone()),
                    Some(Expression {
                        kind: ExpressionKind::Compare {
                            operator: ComparisonOperator::Equal,
                            left: Box::new(target),
                            right: Box::new(value),
                        },
                        source,
                    }),
                )
            } else {
                (
                    missing_value(path, yaml_fields)?,
                    optional_field(yaml_fields, "omitWhen")
                        .map(|node| expression(path, node))
                        .transpose()?,
                )
            };
            Ok(Presence {
                target: target_kind,
                xml_missing: missing_value(path, xml_fields)?,
                xml_empty: empty_forms(path, xml_fields, true)?,
                yaml_missing,
                yaml_empty: empty_forms(path, yaml_fields, false)?,
                yaml_omit_when,
                xml_canonical,
                source: location(path, target),
            })
        })
        .collect()
}

pub(super) fn missing_value(
    path: &str,
    fields: &[(Node, Node)],
) -> Result<Option<Expression>, Diagnostic> {
    optional_field(fields, "missing")
        .map(|node| {
            let fields = node.mapping(path, &["denotes"])?;
            expression(path, node.field(path, fields, "denotes")?)
        })
        .transpose()
}

pub(super) fn empty_forms(
    path: &str,
    fields: &[(Node, Node)],
    xml: bool,
) -> Result<Vec<EmptyForm>, Diagnostic> {
    let Some(node) = optional_field(fields, "empty") else {
        return Ok(vec![]);
    };
    let Shape::Sequence(items) = &node.shape else {
        return Err(error(
            path,
            node.mark,
            "expected_sequence",
            "Expected empty forms",
        ));
    };
    let mut seen = std::collections::HashMap::new();
    items
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["form", "denotes"])?;
            let name = item.field(path, fields, "form")?;
            let Shape::Scalar(spelling, _) = &name.shape else {
                return Err(error(
                    path,
                    name.mark,
                    "expected_scalar",
                    "Expected form name",
                ));
            };
            let form = match (xml, spelling.as_str()) {
                (true, "empty-element") => EmptyKind::Element,
                (true, "empty-item") => EmptyKind::Item,
                (true, "empty-text") => EmptyKind::Text,
                (true, "nil") => EmptyKind::Nil,
                (false, "empty-string") => EmptyKind::String,
                (false, "empty-mapping") => EmptyKind::Mapping,
                (false, "empty-sequence") => EmptyKind::Sequence,
                (false, "null") => EmptyKind::Null,
                _ => {
                    return Err(error(
                        path,
                        name.mark,
                        "invalid_empty_form",
                        "Unknown empty form for this format",
                    ));
                }
            };
            if let Some(first) = seen.insert(spelling.clone(), name.mark) {
                return Err(repeated(path, name.mark, first, "duplicate_empty_form"));
            }
            Ok(EmptyForm {
                form,
                denotes: expression(path, item.field(path, fields, "denotes")?)?,
                source: location(path, name),
            })
        })
        .collect()
}

pub(super) fn normalization(
    path: &str,
    fields: &[(Node, Node)],
) -> Result<Option<Normalization>, Diagnostic> {
    optional_field(fields, "normalization")
        .map(|node| {
            let fields = node.mapping(path, &["when", "from", "denotes"])?;
            node.field(path, fields, "from")?.literal(
                path,
                "empty-sequence",
                "invalid_normalization",
            )?;
            Ok(Normalization {
                when: expression(path, node.field(path, fields, "when")?)?,
                denotes: expression(path, node.field(path, fields, "denotes")?)?,
                source: location(path, node),
            })
        })
        .transpose()
}

fn repeated(path: &str, mark: Marker, first: Marker, code: &str) -> Diagnostic {
    let mut diagnostic = error(path, mark, code, "Repeated presence declaration");
    diagnostic.related.push(SourceLocation {
        file: path.into(),
        line: first.line(),
        column: first.col() + 1,
    });
    diagnostic
}
