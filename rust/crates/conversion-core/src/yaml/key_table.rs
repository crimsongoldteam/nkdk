//! Reversible key spelling from a prepared table. Unlisted keys are inferred
//! from the table's common suffix relation, without knowing metadata kinds.
use crate::{Result, RuntimeDiagnostic};

pub struct ProjectedKey {
    pub text: String,
    pub annotation: Option<&'static str>,
}

fn failure(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("yaml.key-table", message)
}

fn prefix<'a>(rows: impl Iterator<Item = Result<(&'a str, &'a str)>>) -> Result<Option<String>> {
    let mut common: Option<&str> = None;
    let mut seen = false;
    for pair in rows {
        let (internal, external) = pair?;
        let Some(candidate) = (!external.is_empty())
            .then(|| internal.strip_suffix(external))
            .flatten()
            .filter(|candidate| !candidate.is_empty())
        else {
            return Ok(None);
        };
        if common.is_some_and(|common| common != candidate) {
            return Ok(None);
        }
        common = Some(candidate);
        seen = true;
    }
    Ok(seen.then(|| common.expect("seen pair").to_owned()))
}

fn uuid(text: &str) -> bool {
    let bytes = text.as_bytes();
    bytes.len() == 36
        && (b'1'..=b'5').contains(&bytes[14])
        && matches!(bytes[19].to_ascii_lowercase(), b'8' | b'9' | b'a' | b'b')
        && bytes.iter().enumerate().all(|(index, byte)| {
            if [8, 13, 18, 23].contains(&index) {
                *byte == b'-'
            } else {
                byte.is_ascii_hexdigit()
            }
        })
}

pub fn to_yaml<'a>(
    key: &str,
    rows: impl Clone + Iterator<Item = Result<(&'a str, &'a str)>>,
) -> Result<ProjectedKey> {
    let mut mapped = None;
    for pair in rows.clone() {
        let (internal, external) = pair?;
        if internal == key && mapped.replace(external).is_some() {
            return Err(failure("Repeated internal key spelling"));
        }
    }
    if let Some(mapped) = mapped {
        return Ok(ProjectedKey {
            text: mapped.into(),
            annotation: None,
        });
    }
    if uuid(key) {
        return Ok(ProjectedKey {
            text: key.into(),
            annotation: Some("!xml/uuid"),
        });
    }
    let inferred = prefix(rows)?;
    let shortened = inferred
        .as_deref()
        .and_then(|prefix| key.strip_prefix(prefix))
        .filter(|short| !short.is_empty());
    Ok(ProjectedKey {
        text: shortened.unwrap_or(key).into(),
        annotation: Some("!xml/invalid"),
    })
}

pub fn to_xml<'a>(
    key: &str,
    annotation: Option<&str>,
    rows: impl Clone + Iterator<Item = Result<(&'a str, &'a str)>>,
) -> Result<String> {
    if annotation == Some("!xml/uuid") {
        return uuid(key)
            .then(|| key.into())
            .ok_or_else(|| failure("UUID key annotation requires a UUID"));
    }
    if !matches!(annotation, None | Some("!xml/invalid")) {
        return Err(failure("Unsupported mapping key annotation"));
    }
    let mut mapped = None;
    for pair in rows.clone() {
        let (internal, external) = pair?;
        if external == key && mapped.replace(internal).is_some() {
            return Err(failure("Repeated external key spelling"));
        }
    }
    if let Some(mapped) = mapped {
        if annotation.is_some() {
            return Err(failure("Known key does not need an anomaly annotation"));
        }
        return Ok(mapped.into());
    }
    if let Some(prefix) = prefix(rows)? {
        if key.starts_with(&prefix) {
            return annotation
                .is_some()
                .then(|| key.into())
                .ok_or_else(|| failure("Use the external key spelling"));
        }
        if key.is_empty() && annotation.is_some() {
            return Ok(String::new());
        }
        return Ok(format!("{prefix}{key}"));
    }
    Ok(key.into())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rows() -> impl Clone + Iterator<Item = Result<(&'static str, &'static str)>> {
        [
            ("Role.Администратор", "Администратор"),
            ("Role.Менеджер", "Менеджер"),
        ]
        .into_iter()
        .map(Ok)
    }

    #[test]
    fn known_unknown_and_uuid_keys_use_one_reversible_contract() {
        let known = to_yaml("Role.Менеджер", rows()).unwrap();
        assert_eq!(known.text, "Менеджер");
        assert_eq!(known.annotation, None);
        let unknown = to_yaml("Role.Неизвестная", rows()).unwrap();
        assert_eq!(unknown.text, "Неизвестная");
        assert_eq!(unknown.annotation, Some("!xml/invalid"));
        let id = "a786340b-1ca9-48ee-8517-6bd389390bcc";
        let uuid = to_yaml(id, rows()).unwrap();
        assert_eq!(uuid.annotation, Some("!xml/uuid"));
        assert_eq!(to_xml("Менеджер", None, rows()).unwrap(), "Role.Менеджер");
        assert_eq!(
            to_xml(&unknown.text, unknown.annotation, rows()).unwrap(),
            "Role.Неизвестная"
        );
        assert_eq!(to_xml(id, uuid.annotation, rows()).unwrap(), id);
        assert!(to_xml("Role.Неизвестная", None, rows()).is_err());
        assert_eq!(
            to_yaml("a786340b-1ca9-78ee-8517-6bd389390bcc", rows())
                .unwrap()
                .annotation,
            Some("!xml/invalid")
        );
        for internal in ["", "Role."] {
            let projected = to_yaml(internal, rows()).unwrap();
            assert_eq!(projected.annotation, Some("!xml/invalid"));
            assert_eq!(
                to_xml(&projected.text, projected.annotation, rows()).unwrap(),
                internal
            );
        }
    }
}
