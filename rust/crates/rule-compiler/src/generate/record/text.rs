//! Text spelling uses the same typed field storage as XML record routes.
use super::*;
mod envelope;
mod optional;
pub(super) use envelope::generate as envelope;

pub(super) fn definition(
    entry: &LinkedEntry,
    parts: &[TextPatternPart],
    fields: &[Field<'_>],
) -> Result<String, Diagnostic> {
    let LinkedType::Record(names) = &entry.value else {
        unreachable!()
    };
    if optional::applies(entry) {
        return optional::definition(entry, fields);
    }
    let selected = selected(entry);
    if entry.presence.iter().any(|rule| matches!(rule.target, LinkedPresenceTarget::Field(index) if selected.contains(&(index as usize))) && rule.yaml_omit_when.is_some()) {
        return Err(unsupported(entry, "Conditional text slots require an explicit optional group"));
    }
    let parts = parts
        .iter()
        .map(|part| match &part.value {
            TextPatternValue::Optional { .. } => unreachable!("fixed pattern"),
            TextPatternValue::Literal(text) => {
                format!("core::text_pattern::Part::Literal({text:?})")
            }
            TextPatternValue::Field(name) => {
                let field = names
                    .iter()
                    .position(|field| field.name == *name)
                    .expect("linked field");
                let index = selected
                    .iter()
                    .position(|index| *index == field)
                    .expect("selected field");
                match &part.separator {
                    Some(separator) => {
                        format!("core::text_pattern::Part::Cell({index},{separator:?})")
                    }
                    None => format!("core::text_pattern::Part::Slot({index})"),
                }
            }
        })
        .collect::<Vec<_>>()
        .join(",");
    Ok(format!(
        "fn yaml_pattern_{}()-> &'static core::text_pattern::Pattern<'static,{}>{{static PLAN:std::sync::LazyLock<core::text_pattern::Pattern<'static,{}>>=std::sync::LazyLock::new(||core::text_pattern::Pattern::new(&[{parts}]).expect(\"linked text record\"));&PLAN}}\n",
        entry.id,
        selected.len(),
        selected.len()
    ))
}

pub(super) fn reader(entry: &LinkedEntry) -> String {
    if optional::applies(entry) {
        return optional::reader(entry);
    }
    let id = entry.id;
    let mut consume = String::new();
    for (slot, index) in selected(entry).into_iter().enumerate() {
        write!(
            consume,
            "state.r{index}=Some(slots[{slot}].to_owned());state.positions[{index}]=position;"
        )
        .unwrap();
    }
    consume_function(
        entry,
        &format!("yaml_pattern_{id}().parse(&text)"),
        &consume,
    )
}
fn consume_function(entry: &LinkedEntry, parse: &str, assignments: &str) -> String {
    let id = entry.id;
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!()
    };
    let slot = fields.len();
    format!(
        "fn consume_yaml_text_{id}(state:&mut YamlFields{id},seen:&mut bool,node:core::yaml::Node,position:core::Position)->core::Result<()>{{let core::yaml::Node::Scalar(value,tag)=node else{{return Err(RuntimeDiagnostic::new(\"yaml.expected-text\",\"Expected an untagged text record\"))}};if *seen{{return Err(RuntimeDiagnostic::new(\"yaml.document\",\"Expected one text record\"))}}*seen=true;state.raw.read_mark({slot},tag.as_deref().or(value.annotation()),position)?;let text=value.into_text()?;let slots={parse}.map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Text does not match record pattern\"))?;{assignments}Ok(())}}"
    )
}

pub(super) fn read(id: u32) -> String {
    format!(
        "let mut seen=false;events.visit(|node,position|consume_yaml_text_{id}(&mut state,&mut seen,node,position))?;if !seen{{return Err(RuntimeDiagnostic::new(\"yaml.expected-text\",\"Missing text record\"))}}finish_yaml_{id}(state,source,_inputs)"
    )
}

pub(super) fn write(entry: &LinkedEntry, fields: &[Field<'_>]) -> String {
    if optional::applies(entry) {
        return optional::write(entry, fields);
    }
    let id = entry.id;
    let mut out = String::new();
    let mut pieces = Vec::new();
    let selected = selected(entry);
    for &index in &selected {
        let field = &fields[index];
        write!(out,"let piece_value{index}=value.f{index}.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"value.text-pattern\",\"Text record field is absent\"))?;").unwrap();
        pieces.push(field.codec.write_reference(
            &format!("E{id}F{index}"),
            &format!("piece_value{index}"),
            false,
        ));
    }
    write!(out,"let pieces:[&str;{count}]=[{}];let mut text=String::new();yaml_pattern_{id}().write(&pieces,&mut text,usize::MAX).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Record field conflicts with delimiter\"))?;out.push_str(indent);out.push_str(&core::yaml::scalar(&text));out.push('\\n');",pieces.join(","),count=selected.len()).unwrap();
    out
}

fn selected(entry: &LinkedEntry) -> Vec<usize> {
    let (LinkedType::Record(fields), YamlRepresentation::TextPattern(parts)) =
        (&entry.value, &entry.yaml)
    else {
        unreachable!("text record")
    };
    fields
        .iter()
        .enumerate()
        .filter_map(|(index, field)| {
            nkdk_rule_model::text_pattern_fields(parts)
                .contains(&field.name.as_str())
                .then_some(index)
        })
        .collect()
}
