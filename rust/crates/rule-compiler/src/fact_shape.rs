use nkdk_rule_model::{LinkedType, ScalarType};

/// Empty columns denote a scalar key; record columns have canonical name order.
pub(crate) fn columns(key: &LinkedType) -> Option<Vec<&str>> {
    match key {
        value if text_cell(value) => Some(Vec::new()),
        LinkedType::Record(fields)
            if !fields.is_empty() && fields.iter().all(|field| text_cell(&field.value)) =>
        {
            let mut names: Vec<_> = fields.iter().map(|field| field.name.as_str()).collect();
            names.sort_unstable();
            Some(names)
        }
        _ => None,
    }
}

pub(crate) fn text_cell(value: &LinkedType) -> bool {
    matches!(
        value,
        LinkedType::Scalar(ScalarType::Text) | LinkedType::Enum(_)
    )
}
