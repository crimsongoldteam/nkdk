use super::*;

impl std::fmt::Debug for dyn super::RecordInput + '_ {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str("RecordInput")
    }
}

#[derive(Clone, Copy, Debug)]
pub enum InputRef<'a> {
    /// A completed source field has no semantic value.
    MissingValue,
    /// Explicit null admitted by the declaration, distinct from a missing field.
    NullValue,
    /// A generated choice's discriminator, without cloning its payload.
    ChoiceVariant(usize),
    /// Borrowed selected payload; no second semantic tree is constructed.
    Choice {
        variant: usize,
        fields: &'a dyn super::RecordInput,
    },
    /// A selected value carries both its meaning and XML evidence.
    PreservedChoice {
        variant: usize,
        fields: &'a dyn super::RecordInput,
        xml: &'a crate::xml::Patch,
    },
    Record(&'a dyn super::RecordInput),
    /// Preserve an aggregate's XML evidence alongside its borrowed semantic fields.
    PreservedRecord {
        fields: &'a dyn super::RecordInput,
        xml: &'a crate::xml::Patch,
    },
    Records(Records<'a>),
    TextIndex(&'a crate::facts::prepared::TextIndexInput),
    TextUnionIndex(&'a crate::facts::prepared::TextUnionIndexInput),
    Text(&'a str),
    Boolean(bool),
    Decimal(&'a Decimal),
    Calendar(&'a crate::calendar::Value),
    /// A preserved source has no representable semantic value. Borrow its evidence.
    PreservedXml(&'a crate::xml::Patch),
    Sequence(&'a [InputValue]),
}
impl<'a> InputRef<'a> {
    pub fn preserved_xml(self) -> Option<&'a crate::xml::Patch> {
        match self {
            Self::PreservedXml(patch)
            | Self::PreservedRecord { xml: patch, .. }
            | Self::PreservedChoice { xml: patch, .. } => Some(patch),
            _ => None,
        }
    }
    pub fn is_null(self) -> bool {
        matches!(self, Self::NullValue)
    }
    pub fn is_present(self) -> bool {
        !matches!(
            self,
            Self::MissingValue | Self::NullValue | Self::PreservedXml(_)
        )
    }

    /// Project a nested choice while borrowing the original selected payload.
    pub fn choice_variant(self) -> Result<usize> {
        match self {
            Self::ChoiceVariant(variant)
            | Self::Choice { variant, .. }
            | Self::PreservedChoice { variant, .. } => Ok(variant),
            Self::MissingValue | Self::NullValue => Err(RuntimeDiagnostic::new(
                "value.missing",
                "Choice value is absent",
            )),
            _ => Err(RuntimeDiagnostic::new(
                "input.type",
                "Expected a choice value",
            )),
        }
    }
    pub fn choice_record(self, expected: usize) -> Result<&'a dyn super::RecordInput> {
        match self {
            Self::Choice { variant, fields }
            | Self::PreservedChoice {
                variant, fields, ..
            } if variant == expected => Ok(fields),
            Self::MissingValue | Self::NullValue => Err(RuntimeDiagnostic::new(
                "value.missing",
                "Choice value is absent",
            )),
            _ => Err(RuntimeDiagnostic::new(
                "input.type",
                "Wrong choice branch or missing payload",
            )),
        }
    }
}

impl<'a> From<&'a InputValue> for InputRef<'a> {
    fn from(value: &'a InputValue) -> Self {
        match value {
            InputValue::TextIndex(value) => Self::TextIndex(value),
            InputValue::TextUnionIndex(value) => Self::TextUnionIndex(value),
            InputValue::Text(value) => Self::Text(value),
            InputValue::Boolean(value) => Self::Boolean(*value),
            InputValue::Decimal(value) => Self::Decimal(value),
            InputValue::Sequence(value) => Self::Sequence(value),
            InputValue::Records(value) => Self::Records(Records::new(value)),
            InputValue::Record(value) => Self::Record(value),
        }
    }
}

impl super::RecordInput for InputValue {
    fn field(&self, index: usize) -> Option<InputRef<'_>> {
        let Self::Record(value) = self else {
            return None;
        };
        value.field(index)
    }
}

impl super::RecordInput for Vec<(String, InputValue)> {
    fn field(&self, index: usize) -> Option<InputRef<'_>> {
        self.get(index).map(|(_, value)| InputRef::from(value))
    }
}
#[derive(Clone, Copy, Debug)]
enum Slots<'a> {
    Root,
    Bound(&'a [Option<InputRef<'a>>]),
    OverlayRoot(&'a [(usize, InputRef<'a>)]),
    OverlayBound(&'a [Option<InputRef<'a>>], &'a [(usize, InputRef<'a>)]),
}
/// An operation owns inputs and documents; nested scopes borrow only their slots.
#[derive(Clone, Copy, Debug)]
pub struct InputView<'a> {
    root: &'a PreparedInputs,
    document_overlay: Option<&'a DocumentOverlay<'a>>,
    slots: Slots<'a>,
    collection_position: Option<usize>,
    collection_parent: Option<&'a InputView<'a>>,
}
impl<'a> InputView<'a> {
    pub(super) fn root(root: &'a PreparedInputs) -> Self {
        Self {
            root,
            document_overlay: None,
            slots: Slots::Root,
            collection_position: None,
            collection_parent: None,
        }
    }
    /// Shadow the nearest member ordinal without allocating a context or changing its parent.
    #[inline]
    pub fn with_collection_position(&self, position: usize) -> InputView<'_> {
        InputView {
            collection_position: Some(position),
            collection_parent: Some(self),
            ..*self
        }
    }
    #[inline]
    pub fn collection_position(&self) -> Result<usize> {
        self.collection_position_at(0)
    }
    /// Follow lexical collection scopes preserved by compile-time input substitution.
    #[inline]
    pub fn collection_position_at(&self, depth: usize) -> Result<usize> {
        let mut scope = self;
        for _ in 0..depth {
            scope = scope.collection_parent.ok_or_else(|| {
                RuntimeDiagnostic::new(
                    "input.collection-position",
                    "No enclosing collection member",
                )
            })?;
        }
        scope.collection_position.ok_or_else(|| {
            RuntimeDiagnostic::new(
                "input.collection-position",
                "No enclosing collection member",
            )
        })
    }
    pub fn rebind<'b>(&self, slots: &'b [Option<InputRef<'b>>]) -> InputView<'b>
    where
        'a: 'b,
    {
        InputView {
            root: self.root,
            document_overlay: self.document_overlay,
            slots: Slots::Bound(slots),
            collection_position: self.collection_position,
            collection_parent: self.collection_parent,
        }
    }
    /// Override any declared row inputs without allocating another input context.
    pub fn with_overrides<'b>(&self, overrides: &'b [(usize, InputRef<'b>)]) -> InputView<'b>
    where
        'a: 'b,
    {
        let slots = match self.slots {
            Slots::Root | Slots::OverlayRoot(_) => Slots::OverlayRoot(overrides),
            Slots::Bound(slots) | Slots::OverlayBound(slots, _) => {
                Slots::OverlayBound(slots, overrides)
            }
        };
        InputView {
            root: self.root,
            document_overlay: self.document_overlay,
            slots,
            collection_position: self.collection_position,
            collection_parent: self.collection_parent,
        }
    }
    /// Preserve missing data separately from an unprepared slot when rebinding.
    pub fn slot(&self, slot: usize) -> Option<InputRef<'a>> {
        match self.slots {
            Slots::Root => self.root_slot(slot),
            Slots::Bound(values) => values.get(slot).copied().flatten(),
            Slots::OverlayRoot(overrides) => overrides
                .iter()
                .find(|(index, _)| *index == slot)
                .map(|(_, value)| *value)
                .or_else(|| self.root_slot(slot)),
            Slots::OverlayBound(values, overrides) => overrides
                .iter()
                .find(|(index, _)| *index == slot)
                .map(|(_, value)| *value)
                .or_else(|| values.get(slot).copied().flatten()),
        }
    }
    fn root_slot(&self, slot: usize) -> Option<InputRef<'a>> {
        self.root
            .values
            .get(slot)
            .and_then(Option::as_ref)
            .map(InputRef::from)
    }
    pub fn value(&self, slot: usize) -> Result<InputRef<'a>> {
        if matches!(
            self.slot(slot),
            Some(InputRef::MissingValue | InputRef::NullValue)
        ) {
            return Err(RuntimeDiagnostic::new(
                "value.missing",
                format!("Source field for input slot {slot} is absent"),
            ));
        }
        self.slot(slot).ok_or_else(|| {
            let scope = match self.slots {
                Slots::Root | Slots::OverlayRoot(_) => "root".to_owned(),
                Slots::Bound(values) | Slots::OverlayBound(values, _) => {
                    format!("bound ({} slots)", values.len())
                }
            };
            RuntimeDiagnostic::new(
                "input.not-ready",
                format!(
                    "Input slot {slot} is not ready in {scope} of entry {:?} ({} root slots)",
                    self.root.entry,
                    self.root.values.len()
                ),
            )
        })
    }
    /// Absence of source data is observable; an unprepared slot remains an error.
    pub fn is_present(&self, slot: usize) -> Result<bool> {
        if matches!(
            self.slot(slot),
            Some(InputRef::MissingValue | InputRef::NullValue | InputRef::PreservedXml(_))
        ) {
            Ok(false)
        } else {
            self.value(slot).map(|_| true)
        }
    }
    pub fn is_null(&self, slot: usize) -> Result<bool> {
        match self.slot(slot) {
            Some(value) => Ok(value.is_null()),
            None => self.value(slot).map(InputRef::is_null),
        }
    }
    pub fn is_ready(&self, slot: usize) -> bool {
        match self.slot(slot) {
            Some(InputRef::TextIndex(value)) => value.is_ready(),
            Some(InputRef::TextUnionIndex(value)) => value.is_ready(),
            Some(InputRef::MissingValue) => false,
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
    pub fn text_union_index(
        &self,
        slot: usize,
    ) -> Result<&'a crate::facts::prepared::TextUnionIndexInput> {
        match self.value(slot)? {
            InputRef::TextUnionIndex(value) => Ok(value),
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
    pub fn choice_variant(&self, slot: usize) -> Result<usize> {
        self.value(slot)?
            .choice_variant()
            .map_err(|_| Self::wrong_type(slot))
    }
    pub fn choice_record(&self, slot: usize, variant: usize) -> Result<&'a dyn super::RecordInput> {
        self.value(slot)?
            .choice_record(variant)
            .map_err(|_| Self::wrong_type(slot))
    }
    pub fn calendar(&self, slot: usize) -> Result<&'a crate::calendar::Value> {
        match self.value(slot)? {
            InputRef::Calendar(value) => Ok(value),
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
    pub fn records(&self, slot: usize) -> Result<Records<'a>> {
        match self.value(slot)? {
            InputRef::Records(value) => Ok(value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    pub fn record(&self, slot: usize) -> Result<&'a dyn super::RecordInput> {
        match self.value(slot)? {
            InputRef::Record(value) | InputRef::PreservedRecord { fields: value, .. } => Ok(value),
            _ => Err(Self::wrong_type(slot)),
        }
    }
    pub fn document(&self, path: &[&str]) -> &'a [u8] {
        self.document_optional(path).unwrap_or(&[])
    }
    pub fn document_optional(&self, path: &[&str]) -> Option<&'a [u8]> {
        let mut scope = self;
        while let Some(overlay) = scope.document_overlay {
            if let Some(bytes) = super::documents::find(overlay.documents, path) {
                return Some(bytes);
            }
            scope = &overlay.parent;
        }
        scope.root.document_optional(path)
    }
    pub fn document_limits(&self) -> (crate::resources::Limits, usize) {
        self.root.document_limits()
    }
    pub fn document_text_at(
        &self,
        path: &crate::resources::RelativePath,
    ) -> Result<Option<&'a str>> {
        let mut scope = self;
        loop {
            let documents = scope
                .document_overlay
                .map_or(scope.root.documents.as_slice(), |overlay| overlay.documents);
            if let Some((_, bytes)) = documents.iter().find(|(candidate, _)| candidate == path) {
                return super::documents::decode_text(
                    bytes,
                    path.segments().iter().map(String::as_str),
                )
                .map(Some);
            }
            let Some(overlay) = scope.document_overlay else {
                return Ok(None);
            };
            scope = &overlay.parent;
        }
    }
    /// Text destined for XML also obeys XML's intrinsic character alphabet.
    pub fn document_xml_text_at(
        &self,
        path: &crate::resources::RelativePath,
    ) -> Result<Option<&'a str>> {
        let text = self.document_text_at(path)?;
        if let Some(text) = text {
            crate::xml::validate_text(text).map_err(|mut issue| {
                issue.path = path.segments().to_vec();
                issue.file = issue.path.join("/").into_boxed_str();
                issue
            })?;
        }
        Ok(text)
    }
    pub fn document_text(&self, path: &[&str]) -> Result<Option<&'a str>> {
        self.document_optional(path)
            .map(|bytes| super::documents::decode_text(bytes, path.iter().copied()))
            .transpose()
    }
    pub fn overlay_documents<'b>(
        &self,
        documents: &'b [(crate::resources::RelativePath, Vec<u8>)],
        limits: crate::resources::Limits,
        max_bytes: usize,
    ) -> Result<DocumentOverlay<'b>>
    where
        'a: 'b,
    {
        DocumentOverlay::new(*self, documents, limits, max_bytes)
    }
    pub(super) fn with_document_overlay<'b>(
        &self,
        overlay: &'b DocumentOverlay<'b>,
    ) -> InputView<'b>
    where
        'a: 'b,
    {
        InputView {
            document_overlay: Some(overlay),
            ..*self
        }
    }
    pub(super) fn collect_documents(
        &self,
        result: &mut std::collections::BTreeMap<&'a [String], &'a [u8]>,
    ) {
        let mut scope = self;
        while let Some(overlay) = scope.document_overlay {
            for (path, bytes) in overlay.documents {
                result.entry(path.segments()).or_insert(bytes.as_slice());
            }
            scope = &overlay.parent;
        }
        for (path, bytes) in &scope.root.documents {
            result.entry(path.segments()).or_insert(bytes.as_slice());
        }
    }
    fn wrong_type(slot: usize) -> RuntimeDiagnostic {
        RuntimeDiagnostic::new("input.type", format!("Wrong type of input slot {slot}"))
    }
}
