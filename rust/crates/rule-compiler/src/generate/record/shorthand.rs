use super::*;

pub(super) struct Plan {
    pub read_events: String,
    pub definitions: String,
}

pub(crate) fn nested_reader(entry: &LinkedEntry) -> Result<String, Diagnostic> {
    if entry.shorthands.is_empty() {
        return Err(unsupported(entry, "Missing record shorthand"));
    }
    let id = entry.id;
    Ok(format!(
        "match self.mapping.consume(node,position)?{{Some(core::yaml::ScalarOrMappingEntry::Scalar(value,tag))=>read_yaml_shorthand_{id}(&mut self.fields,value,tag),Some(core::yaml::ScalarOrMappingEntry::Field(entry))=>self.fields.consume(entry.key,entry.value,entry.tag),None=>Ok(())}}"
    ))
}

pub(super) fn prepare(
    entry: &LinkedEntry,
    fields: &[Field<'_>],
    program: &Program,
) -> Result<Option<Plan>, Diagnostic> {
    if entry.shorthands.is_empty() {
        return Ok(None);
    }
    if !matches!(entry.yaml, YamlRepresentation::Mapping(_)) {
        return Err(unsupported(entry, "Record shorthand requires YAML mapping"));
    }
    let id = entry.id;
    let mut canonical = None;
    let mut framed = String::new();
    let mut frame = None;
    for short in &entry.shorthands {
        if !short.canonical {
            return Err(unsupported(
                entry,
                "Noncanonical shorthand requires structural record generation",
            ));
        }
        let LinkedShorthandRepresentation::ScalarText { prefix, suffix } = &short.representation
        else {
            return Err(unsupported(
                entry,
                "Record shorthand requires a text scalar",
            ));
        };
        if short.when.is_some() {
            return Err(unsupported(
                entry,
                "Conditional record shorthand is not generated",
            ));
        }
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Record(names),
            arguments,
        } = &short.denotes.kind
        else {
            return Err(unsupported(
                entry,
                "Record shorthand needs a record constructor",
            ));
        };
        let mut capture = None;
        let mut fixed_assignments = String::new();
        let mut exact_checks = String::new();
        for (name, value) in names.iter().zip(arguments) {
            let index = match &entry.value {
                LinkedType::Record(record) => record.iter().position(|field| &field.name == name),
                _ => None,
            }
            .ok_or_else(|| unsupported(entry, "Shorthand names an unknown field"))?;
            if matches!(value.kind, LinkedExpressionKind::Capture(0)) {
                if capture.replace(index).is_some() || !matches!(fields[index].codec, Codec::Text) {
                    return Err(unsupported(
                        entry,
                        "Record shorthand needs one text capture",
                    ));
                }
                continue;
            }
            let Some(presence) = fields[index].presence else {
                return Err(unsupported(
                    entry,
                    "Fixed shorthand fields need YAML defaults",
                ));
            };
            if presence
                .yaml_missing
                .as_ref()
                .is_some_and(|missing| missing.equivalent_to(value))
            {
                if prefix.is_empty() && suffix.is_empty() {
                    let fixed = super::super::scalar_presence::missing(
                        Some(value),
                        &fields[index].codec,
                        &format!("E{id}F{index}"),
                        entry,
                        program,
                    )?;
                    exact_checks.push_str(&format!(
                        "if value.f{index}.as_ref()!=({fixed}).as_ref(){{return Ok(false)}}"
                    ));
                }
                continue;
            }
            if prefix.is_empty() || suffix.is_empty() {
                return Err(unsupported(
                    entry,
                    "A fixed value different from the YAML default needs a framed shorthand",
                ));
            }
            let fixed = super::super::scalar_presence::missing(
                Some(value),
                &fields[index].codec,
                &format!("E{id}F{index}"),
                entry,
                program,
            )?;
            let written = fields[index].codec.write_reference(
                &format!("E{id}F{index}"),
                "&fixed_value",
                false,
            );
            fixed_assignments.push_str(&format!("let fixed_value={fixed}.ok_or_else(||RuntimeDiagnostic::new(\"yaml.shorthand\",\"Unrepresentable shorthand value\"))?;state.r{index}=Some(({written}).to_owned());"));
        }
        let capture =
            capture.ok_or_else(|| unsupported(entry, "Record shorthand needs a capture"))?;
        let assign = format!(
            "state.positions[{capture}]=position;state.raw.read_mark({capture},annotation.as_deref(),position)?;state.r{capture}=Some(captured.to_owned());{fixed_assignments}"
        );
        if prefix.is_empty() && suffix.is_empty() {
            if canonical
                .replace((capture, format!("{assign}Ok(())"), exact_checks))
                .is_some()
            {
                return Err(unsupported(
                    entry,
                    "Record shorthand needs one plain fallback",
                ));
            }
        } else {
            if prefix.is_empty() || suffix.is_empty() || !framed.is_empty() {
                return Err(unsupported(
                    entry,
                    "Record shorthand supports one nonempty frame",
                ));
            }
            frame = Some((prefix.clone(), suffix.clone()));
            framed = format!(
                "if text.starts_with({prefix:?}) && text.ends_with({suffix:?}) && text.len()>={min}{{let captured=&text[{left}..text.len()-{right}];{assign}return Ok(());}}",
                min = prefix.len() + suffix.len(),
                left = prefix.len(),
                right = suffix.len()
            );
        }
    }
    let (capture, fallback, checks) =
        canonical.ok_or_else(|| unsupported(entry, "Record shorthand needs a plain fallback"))?;
    if fields.iter().enumerate().any(|(index, field)| {
        index != capture
            && field
                .presence
                .and_then(|p| p.yaml_omit_when.as_ref())
                .is_none()
    }) {
        return Err(unsupported(
            entry,
            "Every noncaptured field needs an omission rule",
        ));
    }
    let read = format!(
        "fn read_yaml_shorthand_{id}(state:&mut YamlFields{id},value:core::yaml::Scalar,tag:Option<String>)->core::Result<()>{{let position=value.position();let annotation=tag.as_deref().or(value.annotation()).map(str::to_owned);let text=value.into_text()?;{framed}let captured=text.as_str();{fallback}}}\n"
    );
    let excluded_frame = frame.map_or_else(String::new, |(prefix, suffix)| {
        format!("if captured.starts_with({prefix:?}) && captured.ends_with({suffix:?}){{return Ok(false)}}")
    });
    let write = format!(
        "fn write_yaml_shorthand_{id}(value:&V{id},inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<bool>{{let _=inputs;if !value.raw.is_empty(){{return Ok(false)}}let Some(captured)=value.f{capture}.as_ref()else{{return Ok(false)}};{excluded_frame}{checks}out.push_str(indent);out.push_str(&core::yaml::scalar(captured));Ok(true)}}\n"
    );
    let read_events = format!(
        "core::yaml::visit_scalar_or_mapping_events(events,|event|match event{{core::yaml::ScalarOrMappingEntry::Scalar(value,tag)=>read_yaml_shorthand_{id}(&mut state,value,tag),core::yaml::ScalarOrMappingEntry::Field(entry)=>state.consume(entry.key,entry.value,entry.tag) }})?;finish_yaml_{id}(state,source,_inputs)"
    );
    Ok(Some(Plan {
        read_events,
        definitions: read + &write,
    }))
}
