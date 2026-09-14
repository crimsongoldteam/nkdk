use super::{Decimal, InputRef, Result, RuntimeDiagnostic};

/// Implemented by generated storage; fields are borrowed from the original row.
pub trait RecordInput {
    fn field(&self, index: usize) -> Option<InputRef<'_>>;
}
trait RecordSequence {
    fn len(&self) -> usize;
    fn row(&self, index: usize) -> &dyn RecordInput;
}
impl<T: RecordInput> RecordSequence for Vec<T> {
    fn len(&self) -> usize {
        self.as_slice().len()
    }
    fn row(&self, index: usize) -> &dyn RecordInput {
        &self[index]
    }
}
#[derive(Clone, Copy)]
pub struct Records<'a>(&'a dyn RecordSequence);
impl std::fmt::Debug for Records<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Records")
            .field("len", &self.0.len())
            .finish()
    }
}
impl<'a> Records<'a> {
    pub fn new<T: RecordInput>(rows: &'a Vec<T>) -> Self {
        Self(rows)
    }
    pub fn is_empty(&self) -> bool {
        self.0.len() == 0
    }
    pub fn selected(&self, selection: crate::sequence_pattern::Selection) -> Option<Row<'a>> {
        match selection {
            crate::sequence_pattern::Selection::Unique(index) if index < self.0.len() => {
                Some(Row(self.0.row(index)))
            }
            _ => None,
        }
    }
}
pub struct Rows<'a> {
    records: Records<'a>,
    index: usize,
}
impl<'a> IntoIterator for Records<'a> {
    type Item = Row<'a>;
    type IntoIter = Rows<'a>;
    fn into_iter(self) -> Self::IntoIter {
        Rows {
            records: self,
            index: 0,
        }
    }
}
impl<'a> Iterator for Rows<'a> {
    type Item = Row<'a>;
    fn next(&mut self) -> Option<Self::Item> {
        if self.index == self.records.0.len() {
            return None;
        }
        let row = Row(self.records.0.row(self.index));
        self.index += 1;
        Some(row)
    }
}
pub struct Row<'a>(&'a dyn RecordInput);
impl<'a> Row<'a> {
    pub fn field(&self, index: usize) -> Option<InputRef<'a>> {
        self.0.field(index)
    }
    fn required<T>(&self, index: usize, cast: impl FnOnce(InputRef<'a>) -> Option<T>) -> Result<T> {
        let value = self
            .field(index)
            .filter(|value| !matches!(value, InputRef::MissingValue))
            .ok_or_else(|| {
                RuntimeDiagnostic::new("value.missing", "Source record field is absent")
            })?;
        cast(value).ok_or_else(|| RuntimeDiagnostic::new("input.type", "Wrong record field type"))
    }
    pub fn text(&self, index: usize) -> Result<&'a str> {
        self.required(index, |value| {
            if let InputRef::Text(value) = value {
                Some(value)
            } else {
                None
            }
        })
    }
    pub fn boolean(&self, index: usize) -> Result<bool> {
        self.required(index, |value| {
            if let InputRef::Boolean(value) = value {
                Some(value)
            } else {
                None
            }
        })
    }
    pub fn decimal(&self, index: usize) -> Result<&'a Decimal> {
        self.required(index, |value| {
            if let InputRef::Decimal(value) = value {
                Some(value)
            } else {
                None
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    struct Stored {
        name: String,
        enabled: bool,
        amount: Decimal,
    }
    impl RecordInput for Stored {
        fn field(&self, index: usize) -> Option<InputRef<'_>> {
            match index {
                0 => Some(InputRef::Text(&self.name)),
                1 => Some(InputRef::Boolean(self.enabled)),
                2 => Some(InputRef::Decimal(&self.amount)),
                3 => Some(InputRef::MissingValue),
                _ => None,
            }
        }
    }
    #[test]
    fn rows_borrow_all_scalar_types_in_order_and_distinguish_absence() {
        let stored = vec![
            Stored {
                name: "first".into(),
                enabled: false,
                amount: Decimal::parse("9007199254740993").unwrap(),
            },
            Stored {
                name: "second".into(),
                enabled: true,
                amount: Decimal::parse("0.125").unwrap(),
            },
        ];
        assert!(Records::new(&Vec::<Stored>::new()).is_empty());
        let rows = Records::new(&stored);
        assert!(!rows.is_empty());
        let mut iter = rows.into_iter();
        for original in &stored {
            let row = iter.next().unwrap();
            assert!(std::ptr::eq(
                row.text(0).unwrap().as_ptr(),
                original.name.as_ptr()
            ));
            assert_eq!(row.boolean(1).unwrap(), original.enabled);
            assert!(std::ptr::eq(row.decimal(2).unwrap(), &original.amount));
            for field in [3, 4] {
                assert_eq!(
                    row.text(field).unwrap_err().code.as_deref(),
                    Some("value.missing")
                );
            }
            assert_eq!(
                row.boolean(0).unwrap_err().code.as_deref(),
                Some("input.type")
            );
        }
        assert!(iter.next().is_none());
        assert!(iter.next().is_none());
        for selection in [
            crate::sequence_pattern::Selection::Missing,
            crate::sequence_pattern::Selection::Ambiguous,
            crate::sequence_pattern::Selection::Unique(2),
        ] {
            assert!(rows.selected(selection).is_none());
        }
        let selected = rows
            .selected(crate::sequence_pattern::Selection::Unique(1))
            .unwrap();
        assert!(std::ptr::eq(
            selected.text(0).unwrap().as_ptr(),
            stored[1].name.as_ptr()
        ));
        let root = crate::inputs::PreparedInputs::default();
        let slots = [Some(InputRef::Records(rows))];
        let view = root.view().rebind(&slots);
        assert_eq!(view.records(0).unwrap().into_iter().count(), 2);
        assert_eq!(
            view.text(0).unwrap_err().code.as_deref(),
            Some("input.type")
        );
        assert_eq!(
            root.view().records(0).unwrap_err().code.as_deref(),
            Some("input.not-ready")
        );
    }
}
