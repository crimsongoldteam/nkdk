//! Direct construction from borrowed semantic fields, independent of spelling.
use super::*;

pub(super) fn supported(codec: &scalar::Codec<'_>) -> bool {
    codec.input_method().is_some()
        || match codec {
            scalar::Codec::Pattern(pattern) => pattern.constructible(),
            scalar::Codec::Forms(choice) => choice.constructible(),
            scalar::Codec::Sequence(sequence) => sequence.constructible(),
            _ => false,
        }
}

/// A complete semantic record has known absence, not unfinished input slots.
/// Keep readiness checks on the original context unchanged.
pub(super) fn bind_record_slots(count: usize) -> String {
    format!(
        "let slots=std::array::from_fn::<_,{count},_>(|index|Some(slots.get(index).copied().flatten().unwrap_or(core::inputs::InputRef::MissingValue)));let inputs=inputs.rebind(&slots);"
    )
}

pub(super) fn enumeration(variants: &[EnumVariant], name: &str, read: &str) -> String {
    let mut result = format!("match {read}{{");
    for (index, item) in variants.iter().enumerate() {
        write!(result, "{:?}=>{name}::V{index},", item.value).unwrap();
    }
    result.push_str("_=>return Err(RuntimeDiagnostic::new(\"value.invalid\",\"Unknown semantic enumeration value\"))}");
    result
}

pub(super) fn value(
    codec: &scalar::Codec<'_>,
    name: &str,
    inputs: &str,
    index: usize,
    context: &str,
) -> String {
    use scalar::Codec;
    match codec {
        Codec::Pattern(pattern) => format!(
            "{{let _inputs={context};{}{name}::from_record({inputs}.record({index})?,_inputs)?}}",
            pattern.bound_scope()
        ),
        Codec::Forms(_) => format!("{name}::from_input(&{inputs},{index},{context})?"),
        Codec::Sequence(sequence) if sequence.framed_value() => {
            format!("{name}::from_record({inputs}.record({index})?,{context})?")
        }
        Codec::Sequence(_) => format!("{name}::from_rows({inputs}.records({index})?,{context})?"),
        Codec::Text | Codec::TextTable(_) | Codec::InputTextTable { .. } | Codec::QNameText(_) => {
            format!("{inputs}.text({index})?.to_owned()")
        }
        Codec::Boolean(..) => format!("{inputs}.boolean({index})?"),
        Codec::Calendar { .. } => format!("*{inputs}.calendar({index})?"),
        Codec::Decimal | Codec::FormattedDecimal(_) => {
            format!("{inputs}.decimal({index})?.clone()")
        }
        Codec::Enumeration(variants, ..)
        | Codec::QNameEnumeration(variants, ..)
        | Codec::States(variants, ..) => {
            enumeration(variants, name, &format!("{inputs}.text({index})?"))
        }
        _ => unreachable!("validated semantic constructor"),
    }
}
