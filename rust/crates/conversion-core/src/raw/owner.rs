use super::{Kind, Result, Value, document, invalid};

/// The owner envelope retains a semantic value and a separately proved XML patch.
pub struct Document {
    pub meaning: Vec<u8>,
    pub payload: Vec<u8>,
}
impl Document {
    pub fn encode(meaning: &[u8], payload: &[u8]) -> Result<Vec<u8>> {
        let meaning = document::parse(if meaning.is_empty() { b"{}" } else { meaning })?;
        if meaning
            .tag
            .as_deref()
            .is_some_and(|tag| !matches!(tag, "!xml/invalid" | "!xml/important"))
        {
            return Err(invalid(
                "An owner envelope permits only semantic annotations on its value",
            ));
        }
        Value {
            tag: Some("!xml/raw".into()),
            kind: Kind::Mapping(vec![
                (Value::text("$значение"), meaning),
                (Value::text("$xml"), document::parse(payload)?),
            ]),
        }
        .document()
    }
    pub fn decode(source: &[u8]) -> Result<Option<Self>> {
        let root = document::parse(if source.is_empty() { b"{}" } else { source })?;
        if root.tag.as_deref() != Some("!xml/raw") {
            return Ok(None);
        }
        let Kind::Mapping(entries) = root.kind else {
            return Err(invalid("An owner envelope requires a mapping"));
        };
        let mut meaning = None;
        let mut payload = None;
        for (key, value) in entries {
            if key.tag.is_some() {
                return Err(invalid("Owner envelope keys cannot be annotated"));
            }
            match key.key()? {
                "$значение" if meaning.is_none() => {
                    if value
                        .tag
                        .as_deref()
                        .is_some_and(|tag| !matches!(tag, "!xml/invalid" | "!xml/important"))
                    {
                        return Err(invalid("Unexpected annotation on owner semantic value"));
                    }
                    meaning = Some(value.document()?);
                }
                "$xml" if payload.is_none() => payload = Some(value.render()?),
                _ => return Err(invalid("Unknown or repeated owner envelope field")),
            }
        }
        Ok(Some(Self {
            meaning: meaning.ok_or_else(|| invalid("Missing owner semantic properties"))?,
            payload: payload.ok_or_else(|| invalid("Missing owner XML patch"))?,
        }))
    }
}
