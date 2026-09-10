//! Preservation envelopes do not decide where raw is allowed. Generated XML
//! ownership and the failed final-candidate proof determine the boundary.
use crate::{
    Result, RuntimeDiagnostic,
    yaml::document::{self, Kind, Value},
};
pub struct Property {
    pub meaning: Vec<u8>,
    pub payload: Vec<u8>,
    pub has_semantic: bool,
    pub uses_semantic_name: bool,
}
fn invalid(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.raw-envelope", message)
}
fn mapping(value: Value) -> Result<Vec<(Value, Value)>> {
    if value.tag.is_some() {
        return Err(invalid(
            "The YAML document root cannot carry a raw annotation",
        ));
    }
    match value.kind {
        Kind::Mapping(entries) => Ok(entries),
        _ => Err(invalid("Expected a property mapping")),
    }
}
impl Property {
    pub fn encode(
        key: &str,
        physical_key: &str,
        meaning: &[u8],
        payload: &[u8],
    ) -> Result<Vec<u8>> {
        let mut entries = mapping(document::parse(meaning)?)?;
        let mut index = None;
        for (position, (name, _)) in entries.iter().enumerate() {
            if name.key()? == key && index.replace(position).is_some() {
                return Err(invalid("Repeated semantic property"));
            }
        }
        let mut fields = Vec::new();
        let (position, name) = if let Some(index) = index {
            let (_, value) = entries.remove(index);
            fields.push((Value::text("$значение"), value));
            (index, key)
        } else {
            (entries.len(), physical_key)
        };
        fields.push((
            Value::text("$xml"),
            if payload.is_empty() {
                Value::null()
            } else {
                document::parse(payload)?
            },
        ));
        entries.insert(
            position,
            (
                Value::text(name),
                Value {
                    kind: Kind::Mapping(fields),
                    tag: Some("!xml/raw".into()),
                },
            ),
        );
        Value::mapping(entries).document()
    }
    pub fn decode(source: &[u8], key: &str, physical_key: &str) -> Result<Option<Self>> {
        let mut entries = mapping(document::parse(source)?)?;
        let mut selected = None;
        for (index, (name, value)) in entries.iter().enumerate() {
            if (name.key()? == key || name.key()? == physical_key)
                && value.tag.as_deref() == Some("!xml/raw")
                && (name.tag.is_some() || selected.replace(index).is_some())
            {
                return Err(invalid("Ambiguous raw property boundary"));
            }
        }
        let Some(index) = selected else {
            return Ok(None);
        };
        let (name, value) = entries.remove(index);
        let Kind::Mapping(fields) = value.kind else {
            return Err(invalid(
                "Raw property must contain $xml and optional $значение",
            ));
        };
        let mut semantic = None;
        let mut payload = None;
        for (name, value) in fields {
            if name.tag.is_some() {
                return Err(invalid("Raw envelope keys cannot be annotated"));
            }
            match name.key()? {
                "$значение" if semantic.is_none() => semantic = Some(value),
                "$xml" if payload.is_none() => payload = Some(value),
                _ => return Err(invalid("Unknown or repeated raw envelope field")),
            }
        }
        let payload = payload
            .ok_or_else(|| invalid("Raw property requires $xml"))?
            .render()?;
        let has_semantic = semantic.is_some();
        let uses_semantic_name = name.key()? == key;
        if let Some(value) = semantic {
            if name.key()? != key {
                return Err(invalid(
                    "A semantic raw property must use its declared YAML name",
                ));
            }
            entries.insert(index, (Value::text(key), value));
        }
        Ok(Some(Self {
            meaning: Value::mapping(entries).document()?,
            payload,
            has_semantic,
            uses_semantic_name,
        }))
    }
}
