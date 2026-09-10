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
    pub constraints: Vec<LinkedConstraint>,
    pub shorthands: Vec<LinkedShorthand>,
    pub presence: Vec<LinkedPresence>,
    pub normalization: Option<LinkedNormalization>,
    pub text_transforms: Vec<LinkedTextTransform>,
    pub xml: LinkedXml,
    pub yaml: YamlRepresentation,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkedType {
    Absent,
    Optional(Box<LinkedType>),
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
    WithAttributes {
        attributes: Vec<LinkedXmlAttribute>,
        content: Box<LinkedXml>,
    },
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
    pub attribute: Option<ExpandedName>,
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
    Absent,
    Input(u32),
    Parameter(u32),
    Variable(u32),
    Capture(u32),
    SelfValue,
    Operation {
        operator: LinkedOperator,
        arguments: Vec<LinkedExpression>,
    },
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkedOperator {
    Transform { entry: u32, index: u32 },
    Take(u64),
    FirstBy(u32),
    Ordered { slot: u32, unique: bool },
    State(crate::StatePredicate),
    Sequence,
    SequencePattern { prefix_len: u32, suffix_len: u32 },
    Record(Vec<String>),
    Each(u32),
    Exists(u32),
    Get(u32),
    Not,
    And,
    Or,
    Equal,
    Conditional,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedConstraint {
    pub id: String,
    pub applies_to: Vec<crate::ValidationPhase>,
    pub forms: Vec<LinkedForm>,
    pub when: Option<LinkedExpression>,
    pub assertion: LinkedExpression,
    pub for_each: Option<LinkedIteration>,
    pub diagnostic: LinkedDiagnostic,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedDiagnostic {
    pub code: Option<String>,
    pub source: Option<String>,
    pub severity: crate::Severity,
    pub at: LinkedDiagnosticTarget,
    pub message: Vec<LinkedMessagePart>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkedDiagnosticTarget {
    Occurrence { slot: u32, field: u32 },
    SelfValue,
    Field(u32),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedIteration {
    pub input: LinkedExpression,
    pub slot: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkedMessagePart {
    Text(String),
    Expression(LinkedExpression),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedShorthand {
    pub id: String,
    pub representation: LinkedShorthandRepresentation,
    pub denotes: LinkedExpression,
    pub when: Option<LinkedExpression>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedPresence {
    pub target: LinkedPresenceTarget,
    pub xml_missing: Option<LinkedExpression>,
    pub yaml_missing: Option<LinkedExpression>,
    pub xml_empty: Vec<LinkedEmpty>,
    pub yaml_empty: Vec<LinkedEmpty>,
    pub yaml_omit_when: Option<LinkedExpression>,
    pub canonical: Vec<LinkedCanonical>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedCanonical {
    pub when: Option<LinkedExpression>,
    pub form: crate::XmlForm,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedEmpty {
    pub form: crate::EmptyKind,
    pub denotes: LinkedExpression,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedNormalization {
    pub when: LinkedExpression,
    pub denotes: LinkedExpression,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedTextTransform {
    pub name: String,
    pub definition: crate::TextTransform,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkedForm {
    XmlText,
    XmlRecord,
    XmlElementSequence,
    YamlScalar,
    YamlMapping,
    YamlKeyedMapping,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkedPresenceTarget {
    SelfValue,
    Field(u32),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkedShorthandRepresentation {
    ScalarText,
    KeyedMapping {
        prefix: Vec<LinkedExpression>,
        suffix: Vec<LinkedExpression>,
        absent_keys: Vec<LinkedExpression>,
        key_field: u32,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedXmlAttribute {
    pub name: ExpandedName,
    pub value: LinkedXmlAttributeValue,
    pub when: Option<LinkedExpression>,
    pub source: SourceLocation,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkedXmlAttributeValue {
    Text(String),
    QName(ExpandedName),
}
