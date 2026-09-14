use super::*;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) struct ValueId(pub u32);
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) struct FieldId(pub usize);
#[derive(Debug)]
pub(crate) struct ValuePlan<'a> {
    pub entry: &'a LinkedEntry,
    pub(super) record: Option<RecordPlan<'a>>,
}

#[derive(Clone, Debug)]
pub(crate) struct FieldPlan<'a> {
    pub id: FieldId,
    pub field: &'a LinkedField,
    pub xml: Option<&'a LinkedXmlField>,
    pub yaml: Option<&'a YamlField>,
}
impl<'a> FieldPlan<'a> {
    fn new(entry: &'a LinkedEntry, id: FieldId, field: &'a LinkedField) -> Self {
        let yaml = match &entry.yaml {
            YamlRepresentation::Mapping(fields) => {
                fields.iter().find(|mapping| mapping.field == field.name)
            }
            _ => None,
        };
        let xml = xml_fields(&entry.xml)
            .and_then(|fields| fields.iter().find(|mapping| mapping.field == field.name));
        Self {
            id,
            field,
            xml,
            yaml,
        }
    }
    pub(crate) fn diagnostic_key(&self) -> &'a str {
        self.yaml
            .map(|mapping| mapping.key.as_str())
            .or_else(|| {
                self.xml
                    .and_then(|mapping| mapping.attribute.as_ref().or_else(|| mapping.path.last()))
                    .map(|name| name.local.as_str())
            })
            .unwrap_or(&self.field.name)
    }
}
pub(crate) fn diagnostic_key<'a>(entry: &'a LinkedEntry, name: &'a str) -> &'a str {
    if let LinkedType::Record(fields) = &entry.value
        && let Some((index, field)) = fields
            .iter()
            .enumerate()
            .find(|(_, field)| field.name == name)
    {
        return FieldPlan::new(entry, FieldId(index), field).diagnostic_key();
    }
    name
}
#[derive(Clone, Debug)]
pub(crate) struct RecordPlan<'a> {
    pub entry: &'a LinkedEntry,
    pub fields: Vec<FieldPlan<'a>>,
    schedules: [Vec<usize>; 2],
}
pub(super) fn xml_fields(xml: &LinkedXml) -> Option<&[LinkedXmlField]> {
    match xml {
        LinkedXml::Record(fields) => Some(fields),
        LinkedXml::WithAttributes { content, .. } => xml_fields(content),
        _ => None,
    }
}
impl<'a> RecordPlan<'a> {
    pub(crate) fn schedule(&self, side: RepresentationSide) -> &[usize] {
        &self.schedules[match side {
            RepresentationSide::Xml => 0,
            RepresentationSide::Yaml => 1,
        }]
    }
    pub(crate) fn requires_runtime(
        &self,
        expression: &LinkedExpression,
        program: &ConversionPlan<'_>,
    ) -> bool {
        match &expression.kind {
            LinkedExpressionKind::Field(index) => {
                let field = &self.fields[*index as usize];
                if field.yaml.is_none() {
                    return true;
                }
                field.field.value.as_reference().is_some_and(|(id, _, _)| {
                    program.value(ValueId(id)).is_some_and(|value| {
                        matches!(
                            value.entry.yaml,
                            YamlRepresentation::Choice
                                | YamlRepresentation::States(_)
                                | YamlRepresentation::TextPattern(_)
                                | YamlRepresentation::TextSequence { .. }
                                | YamlRepresentation::TextTable(_)
                        )
                    })
                })
            }
            LinkedExpressionKind::Operation { arguments, .. } => arguments
                .iter()
                .any(|argument| self.requires_runtime(argument, program)),
            LinkedExpressionKind::Input(_)
            | LinkedExpressionKind::Parameter(_)
            | LinkedExpressionKind::Variable(_)
            | LinkedExpressionKind::Capture(_)
            | LinkedExpressionKind::SelfValue => true,
            _ => false,
        }
    }
    pub(crate) fn applies(entry: &LinkedEntry) -> bool {
        matches!(entry.value, LinkedType::Record(_))
            && (matches!(entry.yaml, YamlRepresentation::Mapping(_))
                || (xml_fields(&entry.xml).is_some()
                    && matches!(entry.yaml, YamlRepresentation::TextPattern(_))))
    }
    pub(crate) fn prepare(entry: &'a LinkedEntry, program: &Program) -> Result<Self, Diagnostic> {
        let (
            LinkedType::Record(fields),
            YamlRepresentation::Mapping(_) | YamlRepresentation::TextPattern(_),
        ) = (&entry.value, &entry.yaml)
        else {
            return Err(diagnostic(
                "expected_record_plan",
                &entry.source,
                "Record plan requires a record with a YAML mapping or text pattern",
            ));
        };
        let planned: Vec<_> = fields
            .iter()
            .enumerate()
            .map(|(index, field)| FieldPlan::new(entry, FieldId(index), field))
            .collect();
        for side in [RepresentationSide::Xml, RepresentationSide::Yaml] {
            // Non-record XML representations own the entire value boundary.
            // Their linked projection validates field references, not routes.
            if matches!(side, RepresentationSide::Xml) && xml_fields(&entry.xml).is_none() {
                continue;
            }
            if let (RepresentationSide::Yaml, YamlRepresentation::TextPattern(parts)) =
                (side, &entry.yaml)
            {
                let covered = parts
                    .iter()
                    .filter_map(|part| match &part.value {
                        TextPatternValue::Field(name) => Some(name.as_str()),
                        TextPatternValue::Literal(_) => None,
                    })
                    .collect();
                check_coverage(fields, &covered, &entry.presence, side, &entry.source)?;
                continue;
            }
            let covered = planned
                .iter()
                .filter(|field| match side {
                    RepresentationSide::Xml => field.xml.is_some(),
                    RepresentationSide::Yaml => field.yaml.is_some(),
                })
                .map(|field| field.field.name.as_str())
                .collect();
            check_coverage(fields, &covered, &entry.presence, side, &entry.source)?;
        }
        Ok(Self {
            entry,
            fields: planned,
            schedules: [
                super::scopes::read_schedule(
                    &entry.value,
                    &entry.presence,
                    RepresentationSide::Xml,
                    program,
                )?,
                super::scopes::read_schedule(
                    &entry.value,
                    &entry.presence,
                    RepresentationSide::Yaml,
                    program,
                )?,
            ],
        })
    }
}
