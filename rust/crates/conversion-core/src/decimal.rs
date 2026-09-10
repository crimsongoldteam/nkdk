pub use nkdk_decimal::{Decimal, ParseDecimalError};

/// Normalize the declared separator in the owned input buffer before exact parsing.
pub fn parse_formatted(
    mut source: String,
    accept_dot: bool,
    accept_comma: bool,
) -> Result<Decimal, ParseDecimalError> {
    if !accept_dot && source.contains('.') {
        return Err(ParseDecimalError);
    }
    if let Some(index) = source.find(',') {
        if !accept_comma {
            return Err(ParseDecimalError);
        }
        source.replace_range(index..index + 1, ".");
    }
    Decimal::parse_owned(source)
}
pub fn format(value: &Decimal, comma: bool) -> String {
    let mut text = value.to_string();
    if comma && let Some(index) = text.find('.') {
        text.replace_range(index..index + 1, ",");
    }
    text
}
