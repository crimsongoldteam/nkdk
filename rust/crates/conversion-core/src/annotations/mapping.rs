use super::{Annotation, IssueKind};
use crate::{Position, Result, RuntimeDiagnostic, Severity};
use std::{collections::HashMap, num::NonZeroU32};

#[derive(Debug)]
struct Mark {
    row: Option<usize>,
    annotation: Annotation,
    ordinal: u32,
    position: Position,
}
#[derive(Debug, Default)]
pub struct Mapping {
    marks: Vec<Mark>,
}
fn error(code: &str, message: &str, position: Position) -> RuntimeDiagnostic {
    position.apply(&[], RuntimeDiagnostic::new(code, message))
}
fn target(property: &str, key: Option<(&str, u32)>, position: Position) -> RuntimeDiagnostic {
    let mut value =
        RuntimeDiagnostic::declared(None, Some("structure"), Severity::Error, "").field(property);
    if let Some((key, occurrence)) = key {
        value = value
            .field(key)
            .with_occurrence(NonZeroU32::new(occurrence).expect("positive occurrence"));
    }
    position.apply(&[], value)
}
fn matches(issue: &RuntimeDiagnostic, target: &RuntimeDiagnostic) -> bool {
    issue.kind == IssueKind::Semantic
        && issue.severity == Severity::Error
        && issue.path == target.path
        && issue.occurrence == target.occurrence
        && issue.file == target.file
}
fn increment<'a>(counts: &mut HashMap<&'a str, u32>, key: &'a str) -> Result<u32> {
    let count = counts.entry(key).or_default();
    *count = count.checked_add(1).ok_or_else(|| {
        RuntimeDiagnostic::new(
            "collection.too-many-occurrences",
            "Occurrence count exceeds supported range",
        )
    })?;
    Ok(*count)
}
impl Mapping {
    pub fn is_empty(&self) -> bool {
        self.marks.is_empty()
    }
    pub fn read(
        &mut self,
        row: Option<usize>,
        tag: Option<&str>,
        position: Position,
    ) -> Result<()> {
        let Some(tag) = tag else {
            return Ok(());
        };
        let suffix = tag
            .strip_prefix("!xml/")
            .ok_or_else(|| error("yaml.annotation", "Unknown annotation", position))?;
        let (name, number) = suffix
            .split_once('/')
            .map_or((suffix, None), |(name, number)| (name, Some(number)));
        let annotation = match name {
            "invalid" => Annotation::Invalid,
            "important" => Annotation::Important,
            _ => {
                return Err(error(
                    "yaml.annotation",
                    "Expected a semantic annotation",
                    position,
                ));
            }
        };
        let ordinal = match number {
            None => 1,
            Some(number)
                if row.is_some()
                    && !number.starts_with('0')
                    && number.bytes().all(|c| c.is_ascii_digit()) =>
            {
                number
                    .parse::<u32>()
                    .ok()
                    .filter(|n| *n > 1)
                    .ok_or_else(|| {
                        error(
                            "yaml.annotation-number",
                            "Invalid annotation number",
                            position,
                        )
                    })?
            }
            _ => {
                return Err(error(
                    "yaml.annotation-number",
                    "Numbered annotations are only valid on keys, starting at /2",
                    position,
                ));
            }
        };
        if self.marks.iter().any(|mark| mark.row == row) {
            return Err(error(
                "yaml.annotation",
                "Repeated annotation boundary",
                position,
            ));
        }
        self.marks.push(Mark {
            row,
            annotation,
            ordinal,
            position,
        });
        Ok(())
    }
    pub fn label(&self, row: Option<usize>) -> Option<String> {
        self.marks.iter().find(|mark| mark.row == row).map(|mark| {
            let name = match mark.annotation {
                Annotation::Invalid => "!xml/invalid",
                Annotation::Important => "!xml/important",
            };
            if mark.ordinal == 1 {
                name.to_owned()
            } else {
                format!("{name}/{}", mark.ordinal)
            }
        })
    }
    pub fn infer<'a>(
        property: &str,
        rows: impl Iterator<Item = (&'a str, Position)>,
        issues: &[RuntimeDiagnostic],
    ) -> Result<Self> {
        if let Some(issue) = issues
            .iter()
            .find(|issue| issue.kind == IssueKind::Structural && issue.severity == Severity::Error)
        {
            return Err(issue.clone());
        }
        let mut result = Self::default();
        let mut used = vec![false; issues.len()];
        let mut mark_target = |target: &RuntimeDiagnostic| {
            let mut found = false;
            for (index, issue) in issues.iter().enumerate() {
                if matches(issue, target) {
                    used[index] = true;
                    found = true;
                }
            }
            found
        };
        if mark_target(&target(property, None, Position::default())) {
            result.marks.push(Mark {
                row: None,
                annotation: Annotation::Invalid,
                ordinal: 1,
                position: Position::default(),
            });
        }
        let mut counts = HashMap::new();
        let mut ordinals = HashMap::new();
        for (row, (key, position)) in rows.enumerate() {
            let occurrence = increment(&mut counts, key)?;
            let invalid = mark_target(&target(property, Some((key, occurrence)), position));
            if invalid || occurrence > 1 {
                result.marks.push(Mark {
                    row: Some(row),
                    annotation: Annotation::Invalid,
                    ordinal: increment(&mut ordinals, key)?,
                    position,
                });
            }
        }
        for (index, issue) in issues.iter().enumerate() {
            if issue.severity == Severity::Error && !used[index] {
                return Err(issue.clone());
            }
        }
        Ok(result)
    }
    pub fn validate<'a>(
        &self,
        property: &str,
        rows: impl Iterator<Item = (&'a str, Position)>,
        mut issues: Vec<RuntimeDiagnostic>,
    ) -> Vec<RuntimeDiagnostic> {
        let mut contracts = Vec::new();
        let mut apply = |mark: &Mark, target: RuntimeDiagnostic, duplicate: bool| {
            let accepted = issues.iter().any(|issue| matches(issue, &target));
            issues.retain(|issue| !matches(issue, &target));
            if mark.annotation == Annotation::Important {
                let mut issue = target;
                issue.code = Some("xml/important-not-registered".into());
                issue.message = "Important annotation is not registered".into();
                contracts.push(issue);
            } else if !accepted && !duplicate {
                let mut issue = target.clone();
                issue.code = Some("xml/anomaly-tag-unnecessary".into());
                issue.message = "Annotation has no matching violation".into();
                contracts.push(issue);
            }
        };
        if let Some(mark) = self.marks.iter().find(|mark| mark.row.is_none()) {
            apply(mark, target(property, None, mark.position), false);
        }
        let mut counts = HashMap::new();
        let mut ordinals = HashMap::new();
        let mut numbering_errors = Vec::new();
        let mut rows_seen = 0;
        for (row, (key, position)) in rows.enumerate() {
            rows_seen += 1;
            let occurrence = match increment(&mut counts, key) {
                Ok(value) => value,
                Err(error) => {
                    numbering_errors.push(error);
                    break;
                }
            };
            if let Some(mark) = self.marks.iter().find(|mark| mark.row == Some(row)) {
                let expected = match increment(&mut ordinals, key) {
                    Ok(value) => value,
                    Err(error) => {
                        numbering_errors.push(error);
                        break;
                    }
                };
                if mark.ordinal != expected {
                    numbering_errors.push(error(
                        "yaml.annotation-number",
                        "Annotation numbers must follow tagged occurrences of the same key",
                        mark.position,
                    ));
                    continue;
                }
                apply(
                    mark,
                    target(property, Some((key, occurrence)), mark.position),
                    occurrence > 1,
                );
            } else if occurrence > 1 {
                let mut issue = target(property, Some((key, occurrence)), position);
                issue.kind = IssueKind::Structural;
                issue.code = Some("yaml.duplicate-key".into());
                issue.message = "duplicated mapping key".into();
                numbering_errors.push(issue);
            }
        }
        if self
            .marks
            .iter()
            .any(|mark| mark.row.is_some_and(|row| row >= rows_seen))
        {
            numbering_errors.push(RuntimeDiagnostic::new(
                "yaml.annotation-address",
                "Annotation points outside the mapping",
            ));
        }
        issues.extend(contracts);
        issues.extend(numbering_errors);
        issues
    }
}
