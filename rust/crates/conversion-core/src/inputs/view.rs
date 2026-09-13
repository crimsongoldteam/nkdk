use super::*;

#[derive(Clone, Copy, Debug)]
pub enum InputRef<'a> {
    TextIndex(&'a crate::facts::prepared::TextIndexInput),
    Text(&'a str),
    Boolean(bool),
    Decimal(&'a Decimal),
    Sequence(&'a [InputValue]),
}
impl<'a> From<&'a InputValue> for InputRef<'a> {
    fn from(value: &'a InputValue) -> Self {
        match value {
            InputValue::TextIndex(value) => Self::TextIndex(value),
            InputValue::Text(value) => Self::Text(value),
            InputValue::Boolean(value) => Self::Boolean(*value),
            InputValue::Decimal(value) => Self::Decimal(value),
            InputValue::Sequence(value) => Self::Sequence(value),
        }
    }
}
#[derive(Clone, Copy, Debug)]
enum Slots<'a> {
    Root,
    Bound(&'a [Option<InputRef<'a>>]),
}
/// An operation owns inputs and documents; nested scopes borrow only their slots.
#[derive(Clone, Copy, Debug)]
pub struct InputView<'a> {
    root: &'a PreparedInputs,
    slots: Slots<'a>,
}
impl<'a> InputView<'a> {
    pub(super) fn root(root: &'a PreparedInputs) -> Self {
        Self {
            root,
            slots: Slots::Root,
        }
    }
    pub fn rebind<'b>(&self, slots: &'b [Option<InputRef<'b>>]) -> InputView<'b>
    where
        'a: 'b,
    {
        InputView {
            root: self.root,
            slots: Slots::Bound(slots),
        }
    }
    fn get(&self, slot: usize) -> Option<InputRef<'a>> {
        match self.slots {
            Slots::Root => self
                .root
                .values
                .get(slot)
                .and_then(Option::as_ref)
                .map(InputRef::from),
            Slots::Bound(values) => values.get(slot).copied().flatten(),
        }
    }
    pub fn value(&self, slot: usize) -> Result<InputRef<'a>> {
        self.get(slot).ok_or_else(|| {
            RuntimeDiagnostic::new("input.not-ready", format!("Input slot {slot} is not ready"))
        })
    }
    pub fn is_ready(&self, slot: usize) -> bool {
        match self.get(slot) {
            Some(InputRef::TextIndex(value)) => value.is_ready(),
            Some(_) => true,
            None => false,
        }
    }
    pub fn text_index(&self, slot: usize) -> Result<&'a crate::facts::prepared::TextIndexInput> {
        match self.value(slot)? {
            InputRef::TextIndex(value) => Ok(value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    pub fn text(&self, slot: usize) -> Result<&'a str> {
        match self.value(slot)? {
            InputRef::Text(value) => Ok(value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    pub fn boolean(&self, slot: usize) -> Result<bool> {
        match self.value(slot)? {
            InputRef::Boolean(value) => Ok(value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    pub fn decimal(&self, slot: usize) -> Result<&'a Decimal> {
        match self.value(slot)? {
            InputRef::Decimal(value) => Ok(value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    pub fn sequence(&self, slot: usize) -> Result<&'a [InputValue]> {
        match self.value(slot)? {
            InputRef::Sequence(value) => Ok(value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    pub fn document(&self, path: &[&str]) -> &'a [u8] {
        self.root.document(path)
    }
    fn wrong_type(slot: usize) -> RuntimeDiagnostic {
        RuntimeDiagnostic::new("input.type", format!("Wrong type of input slot {slot}"))
    }
}
