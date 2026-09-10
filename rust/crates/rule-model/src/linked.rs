use crate::{
    BooleanLexeme, ModuleKind, ScalarLiteral, ScalarType, SourceLocation, YamlRepresentation,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Program {
    pub entries: Vec<LinkedEntry>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedEntry {
    pub id: u32,
    pub name: String,
    pub kind: ModuleKind,
    pub value: LinkedType,
    pub inputs: Vec<LinkedField>,
    pub parameters: Vec<LinkedParameter>,
    pub field_dependencies: Vec<Vec<u32>>,
    pub xml: LinkedXml,
    pub yaml: YamlRepresentation,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkedType {
    Scalar(ScalarType),
    Record(Vec<LinkedField>),
    Sequence(Box<LinkedType>),
    Reference(u32),
    BoundReference {
        entry: u32,
        bindings: Vec<LinkedBinding>,
        arguments: Vec<ScalarLiteral>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedField {
    pub name: String,
    pub value: LinkedType,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExpandedName {
    pub namespace: String,
    pub local: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkedXml {
    Text,
    BooleanTable(Vec<BooleanLexeme>),
    Record(Vec<LinkedXmlField>),
    ElementSequence {
        path: Vec<ExpandedName>,
        item: Box<LinkedXml>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedXmlField {
    pub field: String,
    pub path: Vec<ExpandedName>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedBinding {
    pub slot: u32,
    pub value: LinkedExpression,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedExpression {
    pub kind: LinkedExpressionKind,
    pub value_type: LinkedType,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkedExpressionKind {
    Input(u32),
    Field(u32),
    Literal(ScalarLiteral),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedParameter {
    pub name: String,
    pub value_type: LinkedType,
    pub default: Option<ScalarLiteral>,
    pub source: SourceLocation,
}
