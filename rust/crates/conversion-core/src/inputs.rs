mod read;
use crate::{EntryId, Result, RuntimeDiagnostic, decimal::Decimal};
pub use read::read;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum InputValue {
    TextIndex(crate::facts::prepared::TextIndexInput),
    Text(String),
    Boolean(bool),
    Decimal(Decimal),
    Sequence(Vec<InputValue>),
}
#[derive(Debug, Clone, Copy)]
pub enum InputType {
    TextIndex,
    TextRecordIndex(&'static [&'static str]),
    Text,
    Boolean,
    Decimal,
    Sequence(&'static InputType),
}
impl InputType {
    fn accepts(self, value: &InputValue) -> bool {
        match (self, value) {
            (Self::TextIndex, InputValue::TextIndex(value)) => value.key_fields() == Some(None),
            (Self::TextRecordIndex(fields), InputValue::TextIndex(value)) => {
                value.key_fields() == Some(Some(fields))
            }
            (Self::Text, InputValue::Text(_))
            | (Self::Boolean, InputValue::Boolean(_))
            | (Self::Decimal, InputValue::Decimal(_)) => true,
            (Self::Sequence(item), InputValue::Sequence(values)) => {
                values.iter().all(|value| item.accepts(value))
            }
            _ => false,
        }
    }
}
/// Names are resolved once at the operation boundary; generated expressions use slots.
#[derive(Debug, Default)]
pub struct PreparedInputs {
    documents: Vec<(crate::resources::RelativePath, Vec<u8>)>,
    entry: Option<EntryId>,
    values: Vec<Option<InputValue>>,
}
impl PreparedInputs {
    pub fn with_documents(
        mut self,
        documents: Vec<(crate::resources::RelativePath, Vec<u8>)>,
    ) -> Result<Self> {
        let mut paths = std::collections::BTreeSet::new();
        for (path, _) in &documents {
            if !paths.insert(path.segments()) {
                return Err(RuntimeDiagnostic::new(
                    "input.document-duplicate",
                    "Repeated XML document source",
                ));
            }
        }
        self.documents = documents;
        Ok(self)
    }
    pub fn document(&self, path: &[&str]) -> &[u8] {
        self.documents
            .iter()
            .find(|(candidate, _)| {
                candidate
                    .segments()
                    .iter()
                    .map(String::as_str)
                    .eq(path.iter().copied())
            })
            .map_or(&[], |(_, bytes)| bytes.as_slice())
    }

    pub fn prepare(
        entry: EntryId,
        declaration: &[(&str, InputType)],
        values: Vec<(String, InputValue)>,
    ) -> Result<Self> {
        let mut slots = vec![None; declaration.len()];
        for (name, value) in values {
            let slot = declaration
                .iter()
                .position(|(key, _)| *key == name)
                .ok_or_else(|| {
                    RuntimeDiagnostic::new("input.unknown", format!("Unknown input: {name}"))
                })?;
            if slots[slot].is_some() {
                return Err(RuntimeDiagnostic::new(
                    "input.duplicate",
                    format!("Repeated input: {name}"),
                ));
            }
            if !declaration[slot].1.accepts(&value) {
                return Err(RuntimeDiagnostic::new(
                    "input.type",
                    format!("Wrong input type: {name}"),
                ));
            }
            slots[slot] = Some(value);
        }
        Ok(Self {
            documents: Vec::new(),
            entry: Some(entry),
            values: slots,
        })
    }
    pub fn check_entry(&self, entry: EntryId) -> Result<()> {
        if self.entry.is_some_and(|prepared| prepared.0 != entry.0) {
            return Err(RuntimeDiagnostic::new(
                "input.entry",
                "Inputs belong to another entry",
            ));
        }
        Ok(())
    }
    pub fn is_ready(&self, slot: usize) -> bool {
        match self.values.get(slot).and_then(Option::as_ref) {
            Some(InputValue::TextIndex(value)) => value.is_ready(),
            Some(_) => true,
            None => false,
        }
    }
    fn get(&self, slot: usize) -> Result<&InputValue> {
        self.values
            .get(slot)
            .and_then(Option::as_ref)
            .ok_or_else(|| {
                RuntimeDiagnostic::new("input.not-ready", format!("Input slot {slot} is not ready"))
            })
    }
    pub fn text_index(&self, slot: usize) -> Result<&crate::facts::prepared::TextIndexInput> {
        match self.get(slot)? {
            InputValue::TextIndex(value) => Ok(value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    pub fn text(&self, slot: usize) -> Result<&str> {
        match self.get(slot)? {
            InputValue::Text(value) => Ok(value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    pub fn boolean(&self, slot: usize) -> Result<bool> {
        match self.get(slot)? {
            InputValue::Boolean(value) => Ok(*value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    pub fn decimal(&self, slot: usize) -> Result<&Decimal> {
        match self.get(slot)? {
            InputValue::Decimal(value) => Ok(value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    pub fn sequence(&self, slot: usize) -> Result<&[InputValue]> {
        match self.get(slot)? {
            InputValue::Sequence(value) => Ok(value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    fn wrong_type(slot: usize) -> RuntimeDiagnostic {
        RuntimeDiagnostic::new("input.type", format!("Wrong type of input slot {slot}"))
    }
}
