//! Exact-boundary validation. Registration and YAML tag placement belong to
//! generated composition; this module never grants a raw boundary.
mod mapping;
use crate::RuntimeDiagnostic;
pub use mapping::Mapping;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Annotation {
    Invalid,
    Important,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IssueKind {
    Semantic,
    Structural,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum State {
    Pending,
    Accepted,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ContractViolation {
    ImportantNotRegistered,
    ImportantRequired,
    Unnecessary,
}
impl ContractViolation {
    pub fn code(self) -> &'static str {
        match self {
            Self::ImportantNotRegistered => "xml/important-not-registered",
            Self::ImportantRequired => "xml/important-required",
            Self::Unnecessary => "xml/anomaly-tag-unnecessary",
        }
    }
}
#[derive(Debug)]
pub struct Evaluation<'a> {
    pub accepted: Vec<&'a RuntimeDiagnostic>,
    pub visible: Vec<&'a RuntimeDiagnostic>,
    pub contract: Option<ContractViolation>,
    pub state: Option<State>,
}

pub fn evaluate<'a>(
    annotation: Annotation,
    target: &RuntimeDiagnostic,
    issues: &'a [RuntimeDiagnostic],
    important_registered: bool,
    defer_unnecessary: bool,
) -> Evaluation<'a> {
    let mut accepted = Vec::new();
    let mut visible = Vec::new();
    for diagnostic in issues {
        if diagnostic.kind == IssueKind::Semantic
            && diagnostic.file == target.file
            && diagnostic.path == target.path
            && diagnostic.occurrence == target.occurrence
        {
            accepted.push(diagnostic);
        } else {
            visible.push(diagnostic);
        }
    }
    let contract = match (annotation, important_registered) {
        (Annotation::Important, false) => Some(ContractViolation::ImportantNotRegistered),
        (Annotation::Invalid, true) => Some(ContractViolation::ImportantRequired),
        _ if accepted.is_empty() && !defer_unnecessary => Some(ContractViolation::Unnecessary),
        _ => None,
    };
    let state = if !accepted.is_empty() {
        Some(State::Accepted)
    } else if defer_unnecessary {
        Some(State::Pending)
    } else {
        None
    };
    Evaluation {
        accepted,
        visible,
        contract,
        state,
    }
}
