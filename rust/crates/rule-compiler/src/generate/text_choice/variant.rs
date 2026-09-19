use super::*;

pub(super) enum Variant<'a> {
    Pattern(text_pattern::Codec<'a>),
    Sequence(Box<text_sequence::Codec<'a>>),
    Choice(Box<super::Codec<'a>>),
    Text(&'a LinkedEntry),
}

impl<'a> Variant<'a> {
    pub(super) fn resolve(
        entry: &'a LinkedEntry,
        program: &'a Program<'a>,
    ) -> Result<Self, Diagnostic> {
        if matches!(entry.value, LinkedType::Scalar(ScalarType::Text))
            && matches!(entry.xml, LinkedXml::Text)
            && matches!(entry.yaml, YamlRepresentation::Text)
        {
            plain(entry)?;
            if !entry.presence.is_empty() {
                return Err(unsupported(
                    entry,
                    "Unstructured choice text requires no presence",
                ));
            }
            return Ok(Self::Text(entry));
        }
        if matches!(entry.value, LinkedType::Choice(_))
            && matches!(entry.xml, LinkedXml::Choice)
            && matches!(entry.yaml, YamlRepresentation::Choice)
        {
            return Ok(Self::Choice(Box::new(super::Codec::resolve(
                entry, program,
            )?)));
        }
        if let Some(sequence) = text_sequence::Codec::framed(entry, program)? {
            return Ok(Self::Sequence(Box::new(sequence)));
        }
        let pattern = text_pattern::Codec::resolve(entry, program)?;
        if !pattern.has_only_slot_defaults() {
            return Err(unsupported(
                entry,
                "Text choice patterns require restored-slot defaults",
            ));
        }
        Ok(Self::Pattern(pattern))
    }

    pub(super) fn projected(&self) -> bool {
        matches!(self, Self::Pattern(pattern) if pattern.projected())
            || matches!(self, Self::Choice(choice) if choice.needs_inputs())
    }

    pub(super) fn selection_parts(
        &self,
        xml: bool,
        entry: &LinkedEntry,
    ) -> Result<Vec<Vec<crate::automata::Part>>, Diagnostic> {
        match self {
            Self::Pattern(pattern) => Ok(vec![pattern.selection_parts(xml)]),
            Self::Sequence(sequence) => sequence.selection_parts(xml, entry),
            Self::Choice(choice) => choice.selection_parts(xml),
            Self::Text(_) => Ok(Vec::new()),
        }
    }

    pub(super) fn definition(
        &self,
        name: &str,
        collection: bool,
        compact: bool,
        entry: &LinkedEntry,
    ) -> Result<String, Diagnostic> {
        match self {
            Self::Pattern(pattern) if compact => pattern.element_definition(name),
            Self::Pattern(pattern) if collection => pattern.collection_definition(name),
            Self::Pattern(pattern) => pattern.definition(name),
            Self::Sequence(sequence) if !compact => sequence.definition(name),
            Self::Choice(choice) if !compact => choice.definition(name),
            Self::Text(common) if !compact && (!collection || common.constraints.is_empty()) => {
                Ok(format!("type {name}=String;\n"))
            }
            _ => Err(unsupported(
                entry,
                "Compact choice rows require fixed-width text patterns",
            )),
        }
    }

    pub(super) fn field_meaning(
        &self,
        name: &str,
        index: usize,
        receiver: &str,
        entry: &LinkedEntry,
    ) -> Result<String, Diagnostic> {
        match self {
            Self::Pattern(pattern) => Ok(pattern.field_meaning(name, index, receiver)),
            Self::Sequence(sequence) => sequence
                .head_meaning(name, index, receiver)
                .ok_or_else(|| unsupported(entry, "Unknown choice sequence field")),
            Self::Choice(_) => Err(unsupported(
                entry,
                "Nested choice has no direct record fields",
            )),
            Self::Text(_) => Err(unsupported(entry, "Unstructured text has no record fields")),
        }
    }
}
