pub mod annotations;
pub mod decimal;
pub mod inputs;
pub use inputs::{InputType, InputValue, PreparedInputs};
pub mod position;
pub use position::Position;
pub mod presence;
pub mod proof;
pub mod sequence_pattern;
pub use presence::Sequence;
pub mod xml;
pub mod yaml;

#[derive(Debug, Clone, Copy)]
pub enum Direction {
    XmlToYaml,
    YamlToXml,
}
#[derive(Debug, Clone, Copy)]
pub struct EntryId(pub u32);
#[derive(Debug)]
pub struct FileResult {
    pub bytes: Vec<u8>,
    pub diagnostics: Vec<RuntimeDiagnostic>,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Severity {
    Error,
    Warning,
    Info,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RuntimeDiagnostic {
    pub kind: annotations::IssueKind,
    pub code: Option<Box<str>>,
    pub source: Option<Box<str>>,
    pub severity: Severity,
    pub occurrence: Option<std::num::NonZeroU32>,
    pub file: Box<str>,
    pub path: Vec<String>,
    pub line: usize,
    pub column: usize,
    pub message: String,
}
pub type Result<T> = std::result::Result<T, RuntimeDiagnostic>;
impl RuntimeDiagnostic {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        let mut diagnostic = Self::declared(Some(code), None, Severity::Error, message);
        diagnostic.kind = annotations::IssueKind::Structural;
        diagnostic
    }
    pub fn declared(
        code: Option<&str>,
        source: Option<&str>,
        severity: Severity,
        message: impl Into<String>,
    ) -> Self {
        Self {
            kind: annotations::IssueKind::Semantic,
            code: code.map(Into::into),
            source: source.map(Into::into),
            severity,
            occurrence: None,
            file: Box::default(),
            path: vec![],
            line: 0,
            column: 0,
            message: message.into(),
        }
    }
    pub fn field(mut self, name: impl Into<String>) -> Self {
        self.path.push(name.into());
        self
    }
    pub fn with_occurrence(mut self, occurrence: std::num::NonZeroU32) -> Self {
        self.occurrence = Some(occurrence);
        self
    }
    pub fn at(mut self, line: usize, column: usize) -> Self {
        self.line = line;
        self.column = column;
        self
    }
}
