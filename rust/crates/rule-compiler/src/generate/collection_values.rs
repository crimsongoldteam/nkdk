use super::*;

/// Physical text may carry a typed value; collection framing stays shared.
pub(super) fn codec<'a>(
    common: &'a LinkedEntry,
    program: &'a Program<'a>,
) -> Result<Option<scalar::Codec<'a>>, Diagnostic> {
    let LinkedType::Sequence(item) = &common.value else {
        return Ok(None);
    };
    let LinkedType::Reference(_) = item.as_ref() else {
        return Ok(None);
    };
    let value = scalar::Codec::resolve(item, common, program)?;
    if !matches!(
        value,
        scalar::Codec::Sequence(_)
            | scalar::Codec::Pattern(_)
            | scalar::Codec::Forms(_)
            | scalar::Codec::QNameEnumeration(..)
    ) {
        return Err(unsupported(
            common,
            "Typed collection text requires a supported scalar codec",
        ));
    }
    Ok(Some(value))
}

pub(super) fn name(id: u32) -> String {
    format!("C{id}")
}

pub(super) fn read_definition(id: u32, codec: &scalar::Codec<'_>) -> Result<String, Diagnostic> {
    let name = name(id);
    let mut out = match codec {
        scalar::Codec::Pattern(pattern) => pattern.collection_definition(&name)?,
        scalar::Codec::Forms(choice) => choice.collection_definition(&name)?,
        _ => codec.definition(&name)?,
    };
    let inputs = codec.read_input_argument();
    if matches!(
        codec,
        scalar::Codec::Pattern(_) | scalar::Codec::Forms(_) | scalar::Codec::Sequence(_)
    ) {
        out.push_str(&format!("fn read_row_{id}(fields:[String;1],source:&[u8],position:core::Position,xml:bool,_inputs:&InputView<'_>)->core::Result<R{id}>{{let [text]=fields;let value={name}::read(&text,xml{inputs}).map_err(|error|position.apply(source,error))?;Ok(R{id}{{fields:[value]}})}}\n"));
    } else {
        let xml_read = codec.read(&name, 0, "value", true);
        let yaml_read = codec.read(&name, 0, "value", false);
        out.push_str(&format!("fn read_row_{id}(fields:[String;1],source:&[u8],position:core::Position,xml:bool,_inputs:&InputView<'_>)->core::Result<R{id}>{{let [r0]=fields;let positions=[position];if xml {{{xml_read}Ok(R{id}{{fields:[f0]}})}}else{{{yaml_read}Ok(R{id}{{fields:[f0]}})}}}}\n"));
    }
    Ok(out)
}
