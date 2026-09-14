//! Text spelling uses the same typed field storage as XML record routes.
use super::*;
mod envelope;
pub(super) use envelope::generate as envelope;

pub(super) fn definition(
    entry: &LinkedEntry,
    parts: &[TextPatternPart],
    fields: &[Field<'_>],
) -> Result<String, Diagnostic> {
    let LinkedType::Record(names) = &entry.value else {
        unreachable!()
    };
    if parts
        .iter()
        .filter(|part| matches!(part.value, TextPatternValue::Field(_)))
        .count()
        != fields.len()
    {
        return Err(unsupported(
            entry,
            "Text record defaults require omitted-slot restoration",
        ));
    }
    let parts = parts
        .iter()
        .map(|part| match &part.value {
            TextPatternValue::Literal(text) => {
                format!("core::text_pattern::Part::Literal({text:?})")
            }
            TextPatternValue::Field(name) => {
                let index = names
                    .iter()
                    .position(|field| field.name == *name)
                    .expect("linked field");
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
        fields.len(),
        fields.len()
    ))
}

pub(super) fn reader(id: u32, fields: &[Field<'_>]) -> String {
    let mut consume = String::new();
    for index in 0..fields.len() {
        write!(
            consume,
            "state.r{index}=Some(slots[{index}].to_owned());state.positions[{index}]=position;"
        )
        .unwrap();
    }
    format!(
        "fn consume_yaml_text_{id}(state:&mut YamlFields{id},seen:&mut bool,node:core::yaml::Node,position:core::Position)->core::Result<()>{{let core::yaml::Node::Scalar(value,None)=node else{{return Err(RuntimeDiagnostic::new(\"yaml.expected-text\",\"Expected an untagged text record\"))}};if *seen{{return Err(RuntimeDiagnostic::new(\"yaml.document\",\"Expected one text record\"))}}*seen=true;let text=value.into_text()?;let slots=yaml_pattern_{id}().parse(&text).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Text does not match record pattern\"))?;{consume}Ok(())}}"
    )
}

pub(super) fn read(id: u32) -> String {
    format!(
        "let mut seen=false;events.visit(|node,position|consume_yaml_text_{id}(&mut state,&mut seen,node,position))?;if !seen{{return Err(RuntimeDiagnostic::new(\"yaml.expected-text\",\"Missing text record\"))}}finish_yaml_{id}(state,source,_inputs)"
    )
}

pub(super) fn write(id: u32, fields: &[Field<'_>]) -> String {
    let mut out = String::new();
    let mut pieces = Vec::new();
    for (index, field) in fields.iter().enumerate() {
        write!(out,"let piece_value{index}=value.f{index}.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"value.text-pattern\",\"Text record field is absent\"))?;").unwrap();
        pieces.push(field.codec.write_reference(
            &format!("E{id}F{index}"),
            &format!("piece_value{index}"),
            false,
        ));
    }
    write!(out,"let pieces:[&str;{count}]=[{}];let mut text=String::new();yaml_pattern_{id}().write(&pieces,&mut text,usize::MAX).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Record field conflicts with delimiter\"))?;out.push_str(indent);out.push_str(&core::yaml::scalar(&text));out.push('\\n');",pieces.join(","),count=fields.len()).unwrap();
    out
}
