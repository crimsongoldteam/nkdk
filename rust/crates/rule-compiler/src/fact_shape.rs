use nkdk_rule_model::{LinkedType, ScalarType};

/// Empty columns denote a scalar key; record columns have canonical name order.
pub(crate) fn columns(key: &LinkedType) -> Option<Vec<&str>> {
    match key {
        value if text_cell(value) => Some(Vec::new()),
        LinkedType::Record(fields) if !fields.is_empty() => record_columns(key),
        _ => None,
    }
}

pub(crate) fn record_columns(key: &LinkedType) -> Option<Vec<&str>> {
    let LinkedType::Record(fields) = key else {
        return None;
    };
    if !fields.iter().all(|field| text_cell(&field.value)) {
        return None;
    }
    let mut names: Vec<_> = fields.iter().map(|field| field.name.as_str()).collect();
    names.sort_unstable();
    Some(names)
}

pub(crate) fn text_cell(value: &LinkedType) -> bool {
    matches!(
        value,
        LinkedType::Scalar(ScalarType::Text) | LinkedType::Enum(_)
    )
}

pub(crate) fn text_union_index(value: &LinkedType) -> bool {
    matches!(value, LinkedType::Index { key, value }
        if columns(key) == Some(Vec::new())
        && matches!(value.as_ref(), LinkedType::Sequence(item)
            if **item == LinkedType::Scalar(ScalarType::Text)))
}
