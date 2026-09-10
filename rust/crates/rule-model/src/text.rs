use crate::SourceLocation;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TextTransform {
    pub classes: Vec<CharacterClass>,
    pub state: Vec<TextFlag>,
    pub transitions: Vec<TextTransition>,
    pub result: TextResult,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CharacterClass {
    pub name: String,
    pub ranges: Vec<(u16, u16)>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TextFlag {
    pub name: String,
    pub value: bool,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TextTransition {
    pub when: Option<TextPredicate>,
    pub emit: TextEmit,
    pub set: Vec<TextFlag>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TextEmit {
    Append,
    StartToken,
    Discard,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TextCondition {
    Class(String),
    Flag(String),
    TokenEmpty,
    NextAfterRun { class: String, next: Option<String> },
    And(Vec<TextPredicate>),
    Or(Vec<TextPredicate>),
    Not(Box<TextPredicate>),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TextResult {
    pub separator: String,
    pub first: TextCase,
    pub rest: TextCase,
    pub lowercase: Vec<CaseShift>,
    pub empty_input: EmptyTextResult,
    pub no_tokens: EmptyTextResult,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CaseShift {
    pub from: (u16, u16),
    pub offset: i32,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TextCase {
    Identity,
    LowerFirstUnlessAllInClass(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmptyTextResult {
    Absent,
    EmptyText,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TextPredicate {
    pub kind: TextCondition,
    pub source: SourceLocation,
}
