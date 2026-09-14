//! Optional groups use ordinary field defaults and omission expressions.
use super::*;
pub(super) fn applies(entry: &LinkedEntry) -> bool {
    matches!(&entry.yaml,YamlRepresentation::TextPattern(parts) if parts.iter().any(|part|matches!(part.value,TextPatternValue::Optional{..})))
}
fn groups(parts: &[TextPatternPart]) -> Vec<(&str, &[TextPatternPart])> {
    let mut result = Vec::new();
    for part in parts {
        if let TextPatternValue::Optional { field, parts } = &part.value {
            result.push((field.as_str(), parts.as_slice()));
            result.extend(groups(parts));
        }
    }
    result
}
pub(super) fn definition(entry: &LinkedEntry, fields: &[Field<'_>]) -> Result<String, Diagnostic> {
    let (LinkedType::Record(names), YamlRepresentation::TextPattern(parts)) =
        (&entry.value, &entry.yaml)
    else {
        unreachable!()
    };
    let index = |name: &str| {
        names
            .iter()
            .position(|field| field.name == name)
            .expect("linked slot")
    };
    let mut controllers = std::collections::BTreeSet::new();
    for (controller, body) in groups(parts) {
        if !controllers.insert(controller) {
            return Err(unsupported(
                entry,
                "Optional group controllers must be unique",
            ));
        }
        if fields[index(controller)]
            .presence
            .and_then(|rule| rule.yaml_omit_when.as_ref())
            .is_none()
        {
            return Err(unsupported(
                entry,
                "Optional group requires its controlling field's YAML omitWhen",
            ));
        }
        for name in nkdk_rule_model::text_pattern_fields(body) {
            if fields[index(name)]
                .presence
                .and_then(|rule| rule.yaml_missing.as_ref())
                .is_none()
            {
                return Err(unsupported(
                    entry,
                    "Every optional text slot requires a YAML missing value",
                ));
            }
        }
    }
    for index in super::selected(entry) {
        if fields[index]
            .presence
            .and_then(|rule| rule.yaml_omit_when.as_ref())
            .is_some()
            && !controllers.contains(names[index].name.as_str())
        {
            return Err(unsupported(
                entry,
                "Conditional text slots require an explicit optional group",
            ));
        }
    }
    fn compile(
        parts: &[TextPatternPart],
        names: &[LinkedField],
        entry: &LinkedEntry,
    ) -> Result<String, Diagnostic> {
        parts
            .iter()
            .map(|part| {
                if part.separator.is_some() {
                    return Err(unsupported(
                        entry,
                        "Optional text groups use explicit delimiters",
                    ));
                }
                let index = |name: &str| {
                    names
                        .iter()
                        .position(|field| field.name == name)
                        .expect("linked slot")
                };
                Ok(match &part.value {
                    TextPatternValue::Literal(text) => {
                        format!("core::text_pattern::OptionalPart::Literal({text:?})")
                    }
                    TextPatternValue::Field(name) => {
                        format!("core::text_pattern::OptionalPart::Slot({})", index(name))
                    }
                    TextPatternValue::Optional { field, parts } => format!(
                        "core::text_pattern::OptionalPart::Optional({},&[{}])",
                        index(field),
                        compile(parts, names, entry)?
                    ),
                })
            })
            .collect::<Result<Vec<_>, Diagnostic>>()
            .map(|parts| parts.join(","))
    }
    let parts = compile(parts, names, entry)?;
    Ok(format!(
        "thread_local!{{static YAML_OPTIONAL_{}:std::cell::RefCell<core::text_pattern::OptionalPattern<'static,{}>>=std::cell::RefCell::new(core::text_pattern::OptionalPattern::new(&[{parts}]).expect(\"linked optional text pattern\"));}}",
        entry.id,
        names.len()
    ))
}
pub(super) fn reader(entry: &LinkedEntry) -> String {
    let id = entry.id;
    let mut assignments = String::new();
    for index in super::selected(entry) {
        write!(
            assignments,
            "state.r{index}=slots[{index}].map(str::to_owned);state.positions[{index}]=position;"
        )
        .unwrap();
    }
    super::consume_function(
        entry,
        &format!("YAML_OPTIONAL_{id}.with(|plan|plan.borrow_mut().parse(&text))"),
        &assignments,
    )
}
pub(super) fn write(entry: &LinkedEntry, fields: &[Field<'_>]) -> String {
    let id = entry.id;
    let mut out = String::new();
    let mut pieces = vec!["None".to_owned(); fields.len()];
    for index in super::selected(entry) {
        write!(out,"let piece_value{index}=value.f{index}.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"value.text-pattern\",\"Text record field is absent\"))?;").unwrap();
        pieces[index] = format!(
            "Some({})",
            fields[index].codec.write_reference(
                &format!("E{id}F{index}"),
                &format!("piece_value{index}"),
                false
            )
        );
    }
    let (LinkedType::Record(names), YamlRepresentation::TextPattern(parts)) =
        (&entry.value, &entry.yaml)
    else {
        unreachable!()
    };
    let mut active = vec!["false".to_owned(); fields.len()];
    for (name, _) in groups(parts) {
        let index = names
            .iter()
            .position(|field| field.name == name)
            .expect("linked controller");
        active[index] = format!("!omit_{id}_{index}(value,_inputs)?");
    }
    write!(out,"let pieces:[Option<&str>;{count}]=[{}];let active=[{}];let mut text=String::new();YAML_OPTIONAL_{id}.with(|plan|plan.borrow_mut().write(&pieces,&active,&mut text,usize::MAX)).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Optional text cannot preserve its slots\"))?;out.push_str(indent);out.push_str(&core::yaml::scalar(&text));out.push('\\n');",pieces.join(","),active.join(","),count=fields.len()).unwrap();
    out
}
