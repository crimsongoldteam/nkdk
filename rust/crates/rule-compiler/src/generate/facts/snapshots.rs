use super::*;

#[derive(Clone, Copy)]
enum SnapshotRisk {
    HiddenState,
    NamedKeys,
}

pub(super) fn write(
    id: u32,
    entries: &[&LinkedEntry],
    program: &Program,
    read_yaml: &str,
    yaml: String,
) -> String {
    let entry = entries
        .iter()
        .find(|entry| entry.id == id)
        .expect("snapshot entry");
    if has_risk(entry, program, SnapshotRisk::HiddenState) {
        format!("write_xml_{id}(&value,&view).map(core::facts::retained::encode_xml)")
    } else if has_risk(entry, program, SnapshotRisk::NamedKeys) {
        // Named mappings may collapse repeated keys. Keep the existing compact
        // snapshot when it proves reversible; preserve XML only on actual loss.
        format!(
            "{{let yaml=({yaml})?;let expected=write_xml_{id}(&value,&view)?;let restored=with_fact_snapshot_inputs(entry,&view,|inputs|{{let restored={read_yaml}(&yaml,inputs)?;write_xml_{id}(&restored,inputs)}})?;if core::proof::verify(&expected,&restored,|_|false).is_ok(){{Ok(yaml)}}else{{Ok(core::facts::retained::encode_xml(expected))}}}}"
        )
    } else {
        yaml
    }
}

/// A YAML snapshot cannot carry hidden state or repeated named rows faithfully.
/// Derive this property once during compilation, including referenced rows.
fn has_risk(entry: &LinkedEntry, program: &Program, risk: SnapshotRisk) -> bool {
    fn needs_state(expression: &LinkedExpression) -> bool {
        match &expression.kind {
            LinkedExpressionKind::Operation {
                operator,
                arguments,
            } => {
                matches!(
                    operator,
                    LinkedOperator::Lookup | LinkedOperator::Identity { .. }
                ) || arguments.iter().any(needs_state)
            }
            _ => false,
        }
    }
    fn visit(
        entry: &LinkedEntry,
        program: &Program,
        active: &mut BTreeSet<u32>,
        risk: SnapshotRisk,
    ) -> bool {
        if !active.insert(entry.id) {
            return false;
        }
        let hidden = if matches!(risk, SnapshotRisk::NamedKeys) {
            matches!(entry.yaml, YamlRepresentation::RecordMapping { .. })
        } else {
            match (&entry.value, &entry.yaml) {
                (LinkedType::Record(fields), YamlRepresentation::Mapping(mapping)) => {
                    let (LinkedXml::Record(xml), _) = super::super::attributes::content(&entry.xml)
                    else {
                        active.remove(&entry.id);
                        return false;
                    };
                    fields.iter().enumerate().any(|(slot, field)| {
                        xml.iter().any(|item| item.field == field.name)
                            && !mapping.iter().any(|item| item.field == field.name)
                            && !entry.presence.iter().any(|rule| {
                                rule.target == LinkedPresenceTarget::Field(slot as u32)
                                    && rule
                                        .yaml_missing
                                        .as_ref()
                                        .is_some_and(|value| !needs_state(value))
                            })
                    })
                }
                _ => false,
            }
        };
        fn nested(
            value: &LinkedType,
            program: &Program,
            active: &mut BTreeSet<u32>,
            risk: SnapshotRisk,
        ) -> bool {
            match value {
                LinkedType::Record(fields) | LinkedType::Choice(fields) => fields
                    .iter()
                    .any(|field| nested(&field.value, program, active, risk)),
                LinkedType::Sequence(item) | LinkedType::Optional(item) => {
                    nested(item, program, active, risk)
                }
                LinkedType::Reference(id) | LinkedType::BoundReference { entry: id, .. } => program
                    .entries
                    .iter()
                    .find(|entry| entry.id == *id)
                    .is_some_and(|entry| visit(entry, program, active, risk)),
                _ => false,
            }
        }
        let result = hidden || nested(&entry.value, program, active, risk);
        active.remove(&entry.id);
        result
    }
    visit(entry, program, &mut BTreeSet::new(), risk)
}

/// A retained source must not elide the values that produce its own indexes.
/// Reading still uses the caller's context; only snapshot writing borrows empty
/// self-produced indexes, so external defaults keep their original meaning.
pub(super) fn inputs(entries: &[&LinkedEntry], program: &Program, names: &[&str]) -> String {
    let mut cases = String::new();
    for entry in entries {
        let produced = effective_contributions(entry, program);
        let bindings: Vec<_> = entry
            .input_indexes
            .iter()
            .filter(|binding| produced.iter().any(|item| item.index == binding.value))
            .map(|binding| {
                let slot = entry
                    .inputs
                    .iter()
                    .position(|input| input.name == binding.name)
                    .expect("linked input");
                let index = names
                    .binary_search(&binding.value.as_str())
                    .expect("linked index");
                format!("({slot},core::facts::prepared::FactId({index}))")
            })
            .collect();
        if !bindings.is_empty() {
            writeln!(cases, "{}=>&[{}],", entry.id, bindings.join(",")).unwrap();
        }
    }
    if cases.is_empty() {
        return "fn with_fact_snapshot_inputs<R>(_entry:EntryId,inputs:&InputView<'_>,write:impl FnOnce(&InputView<'_>)->core::Result<R>)->core::Result<R>{write(inputs)}\n".into();
    }
    let mut out = String::from(
        "fn with_fact_snapshot_inputs<R>(entry:EntryId,inputs:&InputView<'_>,write:impl FnOnce(&InputView<'_>)->core::Result<R>)->core::Result<R>{let bindings:&[(usize,core::facts::prepared::FactId)]=match entry.0 {\n",
    );
    out.push_str(&cases);
    out.push_str(r#"_=>&[]};
if bindings.is_empty(){return write(inputs)}
static EMPTY:std::sync::OnceLock<std::sync::Arc<core::facts::prepared::PreparedTextFacts>>=std::sync::OnceLock::new();
let generation=core::facts::Generation(0);
let facts=EMPTY.get_or_init(||std::sync::Arc::new(fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:0,bytes:0},rows:0}).finish()));
let values:Vec<_>=bindings.iter().map(|(slot,index)|(*slot,fact_index_input(facts.clone(),generation,*index))).collect();
let overrides:Vec<_>=values.iter().map(|(slot,value)|(*slot,core::inputs::InputRef::from(value))).collect();
write(&inputs.with_overrides(&overrides))}
"#);
    out
}
