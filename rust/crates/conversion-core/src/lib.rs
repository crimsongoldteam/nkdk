pub mod decimal;
pub mod position;
pub use position::Position;
pub mod proof;
pub mod xml;
pub mod yaml;

#[derive(Debug, Clone, Copy)]
pub enum Direction {
    XmlToYaml,
    YamlToXml,
}
#[derive(Debug, Clone, Copy)]
pub struct EntryId(pub u32);
#[derive(Debug, Default)]
pub struct PreparedInputs {}
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
    pub code: String,
    pub severity: Severity,
    pub file: String,
    pub path: Vec<String>,
    pub line: usize,
    pub column: usize,
    pub message: String,
}
pub type Result<T> = std::result::Result<T, RuntimeDiagnostic>;
impl RuntimeDiagnostic {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            severity: Severity::Error,
            file: String::new(),
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
    pub fn at(mut self, line: usize, column: usize) -> Self {
        self.line = line;
        self.column = column;
        self
    }
}
