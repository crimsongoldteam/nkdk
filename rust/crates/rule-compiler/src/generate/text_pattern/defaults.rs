//! A shorter spelling restores omitted slots from the declared prepared inputs.
use super::*;

fn prepared(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::SelfValue | LinkedExpressionKind::Field(_) => false,
        LinkedExpressionKind::Operation { arguments, .. } => arguments.iter().all(prepared),
        _ => true,
    }
}

pub(super) fn definition(codec: &Codec<'_>, name: &str) -> Result<String, Diagnostic> {
    let indices: Vec<_> = codec
        .names
        .iter()
        .enumerate()
        .filter_map(|(index, field)| {
            codec
                .yaml
                .iter()
                .any(|part| matches!(&part.value,TextPatternValue::Field(name) if name==field))
                .then_some(index)
        })
        .collect();
    let mut defaults = String::new();
    let mut slots = Vec::new();
    let mut checks = Vec::new();
    for (index, _) in codec.names.iter().enumerate() {
        if let Some(slot) = indices.iter().position(|value| *value == index) {
            slots.push(format!("parsed[{slot}]"));
        } else {
            let value = codec
                .common
                .presence
                .iter()
                .find(|rule| rule.target == LinkedPresenceTarget::Field(index as u32))
                .and_then(|rule| rule.yaml_missing.as_ref())
                .ok_or_else(|| {
                    unsupported(codec.common, "Omitted text slot requires a YAML default")
                })?;
            if !prepared(value) || value.value_type != LinkedType::Scalar(ScalarType::Text) {
                return Err(unsupported(
                    codec.common,
                    "Text slot defaults require prepared text expressions",
                ));
            }
            let (definitions, expression) =
                expressions::expression(codec.common, codec.program, value)?;
            writeln!(
                defaults,
                "let default_{index}={{ {definitions} {expression} }};"
            )
            .unwrap();
            slots.push(expressions::Expressions::text_reference(
                value,
                format!("default_{index}"),
            ));
            checks.push(format!(
                "std::cmp::PartialEq::<str>::eq({}, {})",
                codec.field_meaning(name, index, "self"),
                slots.last().unwrap()
            ));
        }
    }
    let yaml_parts = codec
        .yaml
        .iter()
        .map(|part| match &part.value {
            TextPatternValue::Literal(value) => {
                format!("core::text_pattern::Part::Literal({value:?})")
            }
            TextPatternValue::Field(field) => super::runtime_slot(
                indices
                    .iter()
                    .position(|index| codec.names[*index] == field)
                    .expect("linked slot"),
                part.separator.as_deref(),
            ),
        })
        .collect::<Vec<_>>()
        .join(",");
    let count = codec.fields.len();
    let yaml_count = indices.len();
    let parsed_name = if yaml_count == 0 { "_parsed" } else { "parsed" };
    let mut out = codec.definition_mode(name, DefinitionMode::Projected)?;
    writeln!(out, "impl {name} {{").unwrap();
    for (side, count, parts) in [
        ("xml", count, codec.parts(codec.xml)),
        ("yaml", yaml_count, yaml_parts),
    ] {
        writeln!(out,"fn {side}_pattern()-> &'static core::text_pattern::Pattern<'static,{count}> {{static PLAN:std::sync::LazyLock<core::text_pattern::Pattern<'static,{count}>>=std::sync::LazyLock::new(||core::text_pattern::Pattern::new(&[{parts}]).expect(\"checked text pattern\"));&PLAN}}").unwrap();
    }
    writeln!(out,"fn read(text:&str,xml:bool,_inputs:&InputView<'_>)->core::Result<Self>{{core::xml::validate_text(text)?;let value=if xml{{let slots=Self::xml_pattern().parse(text).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Text does not match the declared pattern\"))?;Self::read_slots(slots,true)?}}else{{let {parsed_name}=Self::yaml_pattern().parse(text).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Text does not match the declared pattern\"))?;{defaults}Self::read_slots([{}],false)?}};value.check(true)?;value.check(false)?;if xml && !value.matches_defaults(_inputs)? {{return Err(RuntimeDiagnostic::new(\"value.text-pattern\",\"Text differs from its restored YAML fields\"));}}Ok(value)}}",slots.join(",")).unwrap();
    writeln!(
        out,
        "fn matches_defaults(&self,_inputs:&InputView<'_>)->core::Result<bool>{{{defaults}Ok({})}}",
        checks.join(" && ")
    )
    .unwrap();
    let selected = indices
        .iter()
        .map(|index| format!("pieces[{index}]"))
        .collect::<Vec<_>>()
        .join(",");
    writeln!(out,"fn check(&self,xml:bool)->core::Result<()>{{let pieces=self.pieces(xml)?;if xml{{Self::xml_pattern().check_values(&pieces)}}else{{Self::yaml_pattern().check_values(&[{selected}])}}.map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Slot conflicts with the declared delimiter\"))}}").unwrap();
    writeln!(out,"fn write(&self,xml:bool)->core::Result<String>{{let pieces=self.pieces(xml)?;let mut out=String::new();if xml{{Self::xml_pattern().write(&pieces,&mut out,usize::MAX)}}else{{Self::yaml_pattern().write(&[{selected}],&mut out,usize::MAX)}}.map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Text pattern cannot be printed\"))?;Ok(out)}}}}").unwrap();
    Ok(out)
}

pub(super) fn presence_supported(codec: &Codec<'_>) -> bool {
    codec.common.presence.iter().all(|rule| {
        let LinkedPresenceTarget::Field(index) = rule.target else {
            return false;
        };
        let Some(name) = codec.names.get(index as usize) else {
            return false;
        };
        let Some(default) = &rule.yaml_missing else {
            return false;
        };
        let omit = rule.yaml_omit_when.as_ref().is_none_or(|expression| {
            matches!(&expression.kind, LinkedExpressionKind::Operation {
                operator: LinkedOperator::Equal, arguments,
            } if matches!(arguments[0].kind, LinkedExpressionKind::Field(field) if field == index)
                && arguments[1].kind == default.kind)
        });
        !codec
            .yaml
            .iter()
            .any(|part| matches!(&part.value, TextPatternValue::Field(field) if field == name))
            && rule.xml_missing.is_none()
            && rule.xml_empty.is_empty()
            && rule.yaml_empty.is_empty()
            && rule.canonical.is_empty()
            && omit
    })
}
