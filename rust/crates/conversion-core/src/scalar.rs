//! Typed alternatives shared by declarative scalar choices.
use crate::{Result, decimal::Decimal};
use std::borrow::Cow;
pub enum Value {
    Text(String),
    Number(Decimal),
}
impl Value {
    pub fn read(text: String, number: bool) -> Result<Self> {
        if number {
            Decimal::parse_owned(text)
                .map(Self::Number)
                .map_err(|error| crate::RuntimeDiagnostic::new("value.decimal", error.to_string()))
        } else {
            Ok(Self::Text(text))
        }
    }
    pub fn xml(&self) -> Cow<'_, str> {
        match self {
            Self::Text(text) => Cow::Borrowed(text),
            Self::Number(value) => Cow::Owned(value.to_string()),
        }
    }
    pub fn yaml(&self) -> String {
        match self {
            Self::Text(text) => crate::yaml::scalar(text),
            Self::Number(value) => value.to_string(),
        }
    }
    pub fn is_number(&self) -> bool {
        matches!(self, Self::Number(_))
    }
}
