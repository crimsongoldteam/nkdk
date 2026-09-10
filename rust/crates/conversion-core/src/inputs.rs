mod read;
use crate::{EntryId, Result, RuntimeDiagnostic, decimal::Decimal};
pub use read::read;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum InputValue {
    Text(String),
    Boolean(bool),
    Decimal(Decimal),
    Sequence(Vec<InputValue>),
}
#[derive(Debug, Clone, Copy)]
pub enum InputType {
    Text,
    Boolean,
    Decimal,
    Sequence(&'static InputType),
}
impl InputType {
    fn accepts(self, value: &InputValue) -> bool {
        match (self, value) {
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
    entry: Option<EntryId>,
    values: Vec<Option<InputValue>>,
}
impl PreparedInputs {
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
        self.values.get(slot).is_some_and(Option::is_some)
    }
    fn get(&self, slot: usize) -> Result<&InputValue> {
        self.values
            .get(slot)
            .and_then(Option::as_ref)
            .ok_or_else(|| {
                RuntimeDiagnostic::new("input.not-ready", format!("Input slot {slot} is not ready"))
            })
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
