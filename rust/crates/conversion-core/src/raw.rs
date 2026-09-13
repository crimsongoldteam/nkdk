//! Preservation envelopes do not decide where raw is allowed. Generated XML
//! ownership and the failed final-candidate proof determine the boundary.
mod owner;
use crate::{
    Result, RuntimeDiagnostic,
    yaml::document::{self, Kind, Value},
};
pub use owner::Document;
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
    pub fn encode_in(
        parent: Option<&str>,
        key: &str,
        physical_key: &str,
        meaning: &[u8],
        payload: &[u8],
    ) -> Result<Vec<u8>> {
        let Some(parent) = parent else {
            return Self::encode(key, physical_key, meaning, payload);
        };
        edit_record(meaning, parent, |child| {
            Self::encode(key, physical_key, child, payload)
        })
    }
    pub fn decode_in(
        source: &[u8],
        parent: Option<&str>,
        key: &str,
        physical_key: &str,
    ) -> Result<Option<Self>> {
        let Some(parent) = parent else {
            return Self::decode(source, key, physical_key);
        };
        let mut found = None;
        let meaning = edit_record(source, parent, |child| {
            found = Self::decode(child, key, physical_key)?;
            Ok(found
                .as_ref()
                .map_or_else(|| child.to_vec(), |value| value.meaning.clone()))
        })?;
        if let Some(found) = &mut found {
            found.meaning = meaning;
        }
        Ok(found)
    }
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

fn edit_record(
    source: &[u8],
    parent: &str,
    edit: impl FnOnce(&[u8]) -> Result<Vec<u8>>,
) -> Result<Vec<u8>> {
    let mut entries = mapping(document::parse(source)?)?;
    let index = entries
        .iter()
        .position(|(key, _)| key.key().is_ok_and(|key| key == parent));
    let Some(index) = index else {
        return Ok(source.to_vec());
    };
    let child = entries[index].1.document()?;
    entries[index].1 = document::parse(&edit(&child)?)?;
    Value::mapping(entries).document()
}

/// A normal record carries one empty pointer, regardless of its field count.
/// The exceptional storage is allocated only when the first patch is inserted.
#[derive(Default)]
pub struct Fields(Option<Box<FieldPatches>>);
#[derive(Default)]
struct FieldPatches {
    marks: Vec<(usize, crate::annotations::Mapping)>,
    diagnostics: Vec<RuntimeDiagnostic>,
    values: Vec<(usize, crate::xml::Patch)>,
}
impl Fields {
    pub fn is_empty(&self) -> bool {
        self.0.is_none()
    }
    pub fn read_mark(
        &mut self,
        index: usize,
        tag: Option<&str>,
        position: crate::Position,
    ) -> Result<()> {
        if tag.is_none() {
            return Ok(());
        }
        let mut mark = crate::annotations::Mapping::default();
        mark.read(None, tag, position)?;
        self.0
            .get_or_insert_with(|| Box::new(FieldPatches::default()))
            .marks
            .push((index, mark));
        Ok(())
    }
    pub fn label(&self, index: usize) -> Option<String> {
        self.0
            .as_ref()?
            .marks
            .iter()
            .find(|(i, _)| *i == index)?
            .1
            .label(None)
    }
    pub fn infer(&mut self, keys: &[&str], issues: Vec<RuntimeDiagnostic>) -> Result<()> {
        if issues.is_empty() {
            return Ok(());
        }
        let fields = self
            .0
            .get_or_insert_with(|| Box::new(FieldPatches::default()));
        for issue in &issues {
            if issue.severity == crate::Severity::Error
                && (issue.kind != crate::annotations::IssueKind::Semantic
                    || issue.path.len() != 1
                    || !keys.contains(&issue.path[0].as_str()))
            {
                return Err(issue.clone());
            }
        }
        for (index, key) in keys.iter().enumerate() {
            let selected = issues
                .iter()
                .filter(|issue| issue.path.first().is_some_and(|name| name == key))
                .cloned()
                .collect::<Vec<_>>();
            let mark = crate::annotations::Mapping::infer(key, std::iter::empty(), &selected)?;
            if !mark.is_empty() {
                fields.marks.push((index, mark));
            }
        }
        fields.diagnostics = issues
            .into_iter()
            .filter(|issue| issue.severity != crate::Severity::Error)
            .collect();
        Ok(())
    }
    pub fn diagnostics(&self) -> Vec<RuntimeDiagnostic> {
        self.0
            .as_ref()
            .map(|fields| fields.diagnostics.clone())
            .unwrap_or_default()
    }
    pub fn validate(
        &self,
        keys: &[&str],
        mut issues: Vec<RuntimeDiagnostic>,
        evidence: &[RuntimeDiagnostic],
    ) -> Vec<RuntimeDiagnostic> {
        if let Some(fields) = &self.0 {
            for (index, mark) in &fields.marks {
                issues =
                    mark.validate_with_evidence(keys[*index], std::iter::empty(), issues, evidence);
            }
        }
        issues
    }
    pub fn get(&self, index: usize) -> Option<&crate::xml::Patch> {
        self.0
            .as_ref()?
            .values
            .iter()
            .find(|(key, _)| *key == index)
            .map(|(_, patch)| patch)
    }
    pub fn insert(&mut self, index: usize, patch: crate::xml::Patch) {
        let fields = self
            .0
            .get_or_insert_with(|| Box::new(FieldPatches::default()));
        if let Some((_, existing)) = fields.values.iter_mut().find(|(key, _)| *key == index) {
            *existing = patch;
        } else {
            fields.values.push((index, patch));
        }
    }
}
