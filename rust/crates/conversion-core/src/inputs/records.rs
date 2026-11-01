use super::{Decimal, InputRef, Result, RuntimeDiagnostic};

/// Implemented by generated storage; fields are borrowed from the original row.
pub trait RecordInput {
    /// A borrowed choice exposes its discriminator separately from payload fields.
    fn selected_variant(&self) -> Option<usize> {
        None
    }

    fn field(&self, index: usize) -> Option<InputRef<'_>>;

    fn value(&self, index: usize) -> Result<InputRef<'_>> {
        required(self, index, Some)
    }

    fn text(&self, index: usize) -> Result<&str> {
        match self.field(index) {
            Some(InputRef::Text(value)) => Ok(value),
            Some(InputRef::MissingValue) | None => Err(RuntimeDiagnostic::new(
                "value.missing",
                format!("Record field {index} is absent"),
            )),
            _ => Err(RuntimeDiagnostic::new(
                "input.type",
                format!("Record field {index} is not text"),
            )),
        }
    }

    fn boolean(&self, index: usize) -> Result<bool> {
        required(self, index, |value| match value {
            InputRef::Boolean(value) => Some(value),
            _ => None,
        })
    }
    fn calendar(&self, index: usize) -> Result<&crate::calendar::Value> {
        required(self, index, |value| match value {
            InputRef::Calendar(value) => Some(value),
            _ => None,
        })
    }
    fn decimal(&self, index: usize) -> Result<&Decimal> {
        required(self, index, |value| match value {
            InputRef::Decimal(value) => Some(value),
            _ => None,
        })
    }
    fn record(&self, index: usize) -> Result<&dyn RecordInput> {
        required(self, index, |value| match value {
            InputRef::Record(value) | InputRef::PreservedRecord { fields: value, .. } => {
                Some(value)
            }
            _ => None,
        })
    }
    fn records(&self, index: usize) -> Result<Records<'_>> {
        match self.field(index) {
            Some(InputRef::Records(value)) => Ok(value),
            Some(InputRef::MissingValue) | None => Ok(Records::empty()),
            _ => Err(RuntimeDiagnostic::new(
                "input.type",
                format!("Record field {index} is not a record sequence"),
            )),
        }
    }
}

/// A stack-backed semantic record used by generated constructors. Its fields
/// borrow their source values; constructing a record never renders XML/YAML.
pub struct RecordView<'a>(&'a [Option<InputRef<'a>>]);
impl<'a> RecordView<'a> {
    pub fn new(fields: &'a [Option<InputRef<'a>>]) -> Self {
        Self(fields)
    }
}
impl RecordInput for RecordView<'_> {
    fn field(&self, index: usize) -> Option<InputRef<'_>> {
        self.0.get(index).copied().flatten()
    }
}
/// Stack-backed selected payload used when constructing a sequence of choices.
/// The discriminator and fields are borrowed independently of XML/YAML spelling.
pub struct ChoiceRecordView<'a> {
    variant: usize,
    fields: &'a dyn RecordInput,
}
impl<'a> ChoiceRecordView<'a> {
    pub fn new(variant: usize, fields: &'a dyn RecordInput) -> Self {
        Self { variant, fields }
    }
}
impl RecordInput for ChoiceRecordView<'_> {
    fn selected_variant(&self) -> Option<usize> {
        Some(self.variant)
    }
    fn field(&self, index: usize) -> Option<InputRef<'_>> {
        self.fields.field(index)
    }
}
fn required<'a, R: RecordInput + ?Sized, T>(
    record: &'a R,
    index: usize,
    cast: impl FnOnce(InputRef<'a>) -> Option<T>,
) -> Result<T> {
    let value = record
        .field(index)
        .filter(|value| !matches!(value, InputRef::MissingValue))
        .ok_or_else(|| RuntimeDiagnostic::new("value.missing", "Source record field is absent"))?;
    cast(value).ok_or_else(|| RuntimeDiagnostic::new("input.type", "Wrong record field type"))
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
impl<T: RecordInput, const N: usize> RecordSequence for [T; N] {
    fn len(&self) -> usize {
        N
    }
    fn row(&self, index: usize) -> &dyn RecordInput {
        &self[index]
    }
}
#[derive(Clone, Copy)]
pub struct Records<'a>(Option<&'a dyn RecordSequence>);
impl std::fmt::Debug for Records<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Records").field("len", &self.len()).finish()
    }
}
impl<'a> Records<'a> {
    pub fn new<T: RecordInput>(rows: &'a Vec<T>) -> Self {
        Self(Some(rows))
    }
    /// Borrow a fixed-size collection of semantic rows without allocating.
    pub fn from_array<T: RecordInput, const N: usize>(rows: &'a [T; N]) -> Self {
        Self(Some(rows))
    }
    pub fn empty() -> Self {
        Self(None)
    }
    fn len(&self) -> usize {
        self.0.map_or(0, RecordSequence::len)
    }
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
    pub fn iter(&self) -> Rows<'a> {
        (*self).into_iter()
    }
    pub fn selected(&self, selection: crate::sequence_pattern::Selection) -> Option<Row<'a>> {
        match selection {
            crate::sequence_pattern::Selection::Unique(index) if index < self.len() => {
                Some(Row(self.0?.row(index)))
            }
            _ => None,
        }
    }
}
#[derive(Clone)]
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
        if self.index == self.records.len() {
            return None;
        }
        let row = Row(self.records.0?.row(self.index));
        self.index += 1;
        Some(row)
    }
}
pub struct Row<'a>(&'a dyn RecordInput);
impl<'a> Row<'a> {
    pub fn as_record(&self) -> &'a dyn RecordInput {
        self.0
    }
    pub fn as_input(&self) -> InputRef<'a> {
        match self.0.selected_variant() {
            Some(variant) => InputRef::Choice {
                variant,
                fields: self.0,
            },
            None => InputRef::Record(self.0),
        }
    }
    pub fn value(&self, index: usize) -> Result<InputRef<'a>> {
        self.0.value(index)
    }
    pub fn record(&self, index: usize) -> Result<&'a dyn RecordInput> {
        self.0.record(index)
    }
    pub fn records(&self, index: usize) -> Result<Records<'a>> {
        self.0.records(index)
    }

    pub fn field(&self, index: usize) -> Option<InputRef<'a>> {
        self.0.field(index)
    }
    fn required<T>(&self, index: usize, cast: impl FnOnce(InputRef<'a>) -> Option<T>) -> Result<T> {
        required(self.0, index, cast)
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
        self.0.boolean(index)
    }
    pub fn calendar(&self, index: usize) -> Result<&'a crate::calendar::Value> {
        self.0.calendar(index)
    }
    pub fn decimal(&self, index: usize) -> Result<&'a Decimal> {
        self.0.decimal(index)
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
        assert!(Records::empty().into_iter().next().is_none());
        let rows = Records::new(&stored);
        assert!(!rows.is_empty());
        assert_eq!(rows.iter().count(), 2);
        let mut iter = rows.into_iter();
        for original in &stored {
            let row = iter.next().unwrap();
            assert!(std::ptr::eq(
                row.text(0).unwrap().as_ptr(),
                original.name.as_ptr()
            ));
            assert_eq!(row.boolean(1).unwrap(), original.enabled);
            let borrowed: &dyn RecordInput = original;
            assert_eq!(borrowed.boolean(1).unwrap(), original.enabled);
            assert!(std::ptr::eq(borrowed.decimal(2).unwrap(), &original.amount));
            assert_eq!(
                borrowed.boolean(0).unwrap_err().code.as_deref(),
                Some("input.type")
            );
            assert_eq!(
                borrowed.decimal(3).unwrap_err().code.as_deref(),
                Some("value.missing")
            );
            assert!(std::ptr::eq(row.decimal(2).unwrap(), &original.amount));
            assert!(original.records(3).unwrap().is_empty());
            assert!(original.records(4).unwrap().is_empty());
            assert_eq!(
                original.records(0).unwrap_err().code.as_deref(),
                Some("input.type")
            );
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
        assert!(matches!(selected.as_input(), InputRef::Record(_)));
        let choices = [
            ChoiceRecordView::new(2, &stored[0]),
            ChoiceRecordView::new(2, &stored[1]),
        ];
        for (index, row) in Records::from_array(&choices).iter().enumerate() {
            let InputRef::Choice { variant: 2, fields } = row.as_input() else {
                panic!("lost choice discriminator")
            };
            assert!(std::ptr::eq(
                fields.text(0).unwrap().as_ptr(),
                stored[index].name.as_ptr()
            ));
            assert!(std::ptr::eq(
                row.as_record().decimal(2).unwrap(),
                &stored[index].amount
            ));
        }
        struct Nested<'a>(&'a Stored);
        impl RecordInput for Nested<'_> {
            fn field(&self, index: usize) -> Option<InputRef<'_>> {
                match index {
                    0 => Some(InputRef::Record(self.0)),
                    1 => Some(InputRef::MissingValue),
                    2 => Some(InputRef::Text(&self.0.name)),
                    _ => None,
                }
            }
        }
        let nested = Nested(&stored[0]);
        let payload = nested.record(0).unwrap();
        assert!(std::ptr::eq(
            payload.text(0).unwrap().as_ptr(),
            stored[0].name.as_ptr()
        ));
        assert!(std::ptr::eq(payload.decimal(2).unwrap(), &stored[0].amount));
        for field in [1, 3] {
            assert_eq!(
                nested.record(field).unwrap_err().code.as_deref(),
                Some("value.missing")
            );
        }
        assert_eq!(
            nested.record(2).unwrap_err().code.as_deref(),
            Some("input.type")
        );
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

#[cfg(test)]
mod nested_choices {
    use super::*;

    #[test]
    fn nested_choice_payload_borrows_repeated_rows_and_reports_wrong_branches() {
        let date = crate::calendar::Value::from_parts([2024, 2, 29, 12, 34, 56]).unwrap();
        let date_slots = [Some(InputRef::Calendar(&date)), Some(InputRef::NullValue)];
        let date_record = RecordView::new(&date_slots);
        assert!(std::ptr::eq(date_record.calendar(0).unwrap(), &date));
        let inputs = crate::inputs::PreparedInputs::default();
        let date_view = inputs.view().rebind(&date_slots);
        assert!(std::ptr::eq(date_view.calendar(0).unwrap(), &date));
        assert_eq!(
            date_view.calendar(1).unwrap_err().code.as_deref(),
            Some("value.missing")
        );
        assert_eq!(
            date_record.calendar(1).unwrap_err().code.as_deref(),
            Some("input.type")
        );
        let patch = crate::xml::Patch::read(b"'oops'", &[], &[]).unwrap();
        let preserved = InputRef::PreservedXml(&patch);
        assert!(!preserved.is_present());
        assert!(!preserved.is_null());
        assert!(std::ptr::eq(preserved.preserved_xml().unwrap(), &patch));
        let slots = [Some(preserved)];
        let view = inputs.view().rebind(&slots);
        assert!(!view.is_present(0).unwrap());
        assert!(std::ptr::eq(
            view.value(0).unwrap().preserved_xml().unwrap(),
            &patch
        ));
        let text = String::from("shared");
        let row_slots = [Some(InputRef::Text(&text))];
        let row = RecordView::new(&row_slots);
        let annotated = InputRef::PreservedRecord {
            fields: &row,
            xml: &patch,
        };
        assert!(annotated.is_present());
        assert!(!annotated.is_null());
        assert!(std::ptr::eq(annotated.preserved_xml().unwrap(), &patch));
        let annotated_slots = [Some(annotated)];
        let annotated_view = inputs.view().rebind(&annotated_slots);
        let borrowed_record = annotated_view.record(0).unwrap();
        assert!(std::ptr::eq(
            borrowed_record.text(0).unwrap().as_ptr(),
            text.as_ptr()
        ));
        let wrapper = RecordView::new(&annotated_slots);
        assert_eq!(wrapper.record(0).unwrap().text(0).unwrap(), "shared");
        assert_eq!(
            annotated_view.boolean(0).unwrap_err().code.as_deref(),
            Some("input.type")
        );
        let rows = [row, RecordView::new(&row_slots)];
        let payload_slots = [Some(InputRef::Records(Records::from_array(&rows)))];
        let payload = RecordView::new(&payload_slots);
        let inner_slots = [Some(InputRef::Choice {
            variant: 2,
            fields: &payload,
        })];
        let inner = RecordView::new(&inner_slots);
        let outer = InputRef::Choice {
            variant: 1,
            fields: &inner,
        };
        let preserved_choice = InputRef::PreservedChoice {
            variant: 2,
            fields: &payload,
            xml: &patch,
        };
        assert!(preserved_choice.is_present());
        assert!(!preserved_choice.is_null());
        assert_eq!(preserved_choice.choice_variant().unwrap(), 2);
        assert!(std::ptr::eq(
            preserved_choice.preserved_xml().unwrap(),
            &patch
        ));
        assert_eq!(
            preserved_choice
                .choice_record(2)
                .unwrap()
                .records(0)
                .unwrap()
                .len(),
            2
        );
        assert_eq!(
            preserved_choice
                .choice_record(1)
                .unwrap_err()
                .code
                .as_deref(),
            Some("input.type")
        );
        let selected = outer.choice_record(1).unwrap().value(0).unwrap();
        assert_eq!(selected.choice_variant().unwrap(), 2);
        let borrowed = selected.choice_record(2).unwrap().records(0).unwrap();
        assert_eq!(borrowed.len(), 2);
        for row in borrowed {
            assert!(std::ptr::eq(row.text(0).unwrap().as_ptr(), text.as_ptr()));
        }
        assert_eq!(
            selected.choice_record(0).unwrap_err().code.as_deref(),
            Some("input.type")
        );
        assert_eq!(
            InputRef::MissingValue
                .choice_record(2)
                .unwrap_err()
                .code
                .as_deref(),
            Some("value.missing")
        );
        assert_eq!(
            inner.value(3).unwrap_err().code.as_deref(),
            Some("value.missing")
        );
    }
}
