pub mod annotations;
pub mod calendar;
pub mod decimal;
pub mod facts;
pub mod inputs;
pub mod pattern;
pub mod text_pattern;
pub use inputs::{InputType, InputValue, PreparedInputs};
pub mod position;
pub use position::Position;
pub mod presence;
pub mod proof;
pub mod raw;
pub mod resources;
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
    pub documents: Vec<(resources::RelativePath, Vec<u8>)>,
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
    pub fn missing_scalar(field: &str) -> Self {
        Self::new("value.missing", "Missing scalar").field(field)
    }
    pub fn unknown_xml_field() -> Self {
        Self::new("xml.unknown-field", "Unknown XML path")
    }
    pub fn unknown_xml_attribute() -> Self {
        Self::new("xml.unknown-attribute", "Undeclared container attribute")
    }

    pub fn unknown_yaml_field(key: String) -> Self {
        Self::new("yaml.unknown-field", format!("Unknown YAML key: {key}")).field(key)
    }
    pub fn expected_xml_property() -> Self {
        Self::new("xml.preservation-shape", "Expected the anomalous property")
    }
    pub fn expected_xml_root() -> Self {
        Self::new("xml.owner-root", "Expected the declared document root")
    }
    pub fn unexpected_xml_text() -> Self {
        Self::new("xml.unexpected-text", "Text outside a declared scalar")
    }
    pub fn repeated_xml_attribute() -> Self {
        Self::new("xml.duplicate-field", "Repeated attribute")
    }
    pub fn repeated_xml_container() -> Self {
        Self::new("xml.duplicate-field", "Repeated attribute container")
    }
    pub fn expected_scalar_projection() -> Self {
        Self::new("yaml.expected-scalar", "Expected a scalar projection")
    }
    pub fn expected_projected_value() -> Self {
        Self::new("yaml.document", "Expected one projected value")
    }
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

pub mod scalar;
