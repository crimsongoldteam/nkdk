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
    /// Caller whose input slots were captured when this profile was specialized.
    pub input_scope: Option<u32>,
    pub name: String,
    pub namespaces: Vec<crate::NamedBinding>,
    pub kind: ModuleKind,
    pub value: LinkedType,
    pub inputs: Vec<LinkedField>,
    pub input_indexes: Vec<crate::NamedBinding>,
    pub parameters: Vec<LinkedParameter>,
    pub field_dependencies: Vec<Vec<u32>>,
    pub constraints: Vec<LinkedConstraint>,
    pub contributions: Vec<LinkedContribution>,
    pub resources: Vec<crate::ResourceGroup<LinkedExpression, LinkedIteration>>,
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
    Choice(Vec<LinkedField>),
    Index {
        key: Box<LinkedType>,
        value: Box<LinkedType>,
    },
    ScalarChoice(Vec<ScalarType>),
    Enum(Vec<crate::EnumVariant>),
    Absent,
    Optional(Box<LinkedType>),
    Scalar(ScalarType),
    Record(Vec<LinkedField>),
    Sequence(Box<LinkedType>),
    Reference(u32),
    BoundReference {
        entry: u32,
        bindings: Vec<LinkedBinding>,
        arguments: Vec<LinkedExpression>,
    },
}

impl LinkedType {
    /// The declaration and checked substitutions carried by a reference.
    pub fn as_reference(&self) -> Option<(u32, &[LinkedBinding], &[LinkedExpression])> {
        match self {
            Self::Reference(id) => Some((*id, &[], &[])),
            Self::BoundReference {
                entry,
                bindings,
                arguments,
            } => Some((*entry, bindings, arguments)),
            _ => None,
        }
    }
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
    Declared,
    TextSequence {
        separator: String,
    },
    Choice {
        fallback: Option<String>,
    },
    DiscriminatedChoice(crate::DiscriminatedChoiceXml<ExpandedName>),
    TextPattern(Vec<crate::TextPatternPart>),
    QName {
        namespace: String,
        local: String,
    },
    Tree(Vec<crate::XmlTreeNode<ExpandedName, LinkedXmlAttribute>>),
    FormattedDecimal(crate::DecimalText),
    ScalarChoice(crate::ScalarChoiceXml<ExpandedName>),
    Calendar,
    WithAttributes {
        attributes: Vec<LinkedXmlAttribute>,
        content: Box<LinkedXml>,
    },
    Text,
    BooleanTable(Vec<BooleanLexeme>),
    EnumTable(Vec<crate::EnumLexeme>),
    QNameTable(Vec<crate::QNameLexeme<ExpandedName>>),
    QNameTextTable(Vec<crate::QNameTextLexeme<ExpandedName>>),
    Decimal,
    Record(Vec<LinkedXmlField>),
    ElementSequence {
        path: Vec<ExpandedName>,
        item: Box<LinkedXml>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedXmlField {
    pub file: Option<Vec<String>>,
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

impl LinkedExpression {
    /// Compare meaning, ignoring the source positions of repeated expressions.
    pub fn equivalent_to(&self, other: &Self) -> bool {
        match (&self.kind, &other.kind) {
            (
                LinkedExpressionKind::Operation {
                    operator: a,
                    arguments: x,
                },
                LinkedExpressionKind::Operation {
                    operator: b,
                    arguments: y,
                },
            ) => a == b && x.len() == y.len() && x.iter().zip(y).all(|(a, b)| a.equivalent_to(b)),
            (a, b) => a == b,
        }
    }
    pub fn negates(&self, other: &Self) -> bool {
        matches!(&self.kind, LinkedExpressionKind::Operation {operator:LinkedOperator::Not,arguments} if arguments.len()==1 && arguments[0].equivalent_to(other))
    }
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
    ConstructVariant(u32),
    IsVariant(u32),
    VariantValue(u32),
    VariantText(u32),
    ParseYaml,
    TextSegmentPrefix(String),
    TextLengthAtMost,
    TextLengthEquals,
    CalendarFits,
    DecimalFits,
    VariantField { variant: u32, field: u32 },
    Lookup,
    Matches(String),
    MatchOptional(u32),
    Transform { entry: u32, index: u32 },
    Take(u64),
    FirstBy(u32),
    Ordered { slot: u32, unique: bool },
    State(crate::StatePredicate),
    Sequence,
    Concat,
    SequenceConcat,
    Require,
    SequencePattern { prefix_len: u32, suffix_len: u32 },
    Record(Vec<String>),
    Fold { item: u32, state: u32 },
    Each(u32),
    Exists(u32),
    One(u32),
    Select(u32),
    Find(u32),
    Filter(u32),
    Map(u32),
    Get(u32),
    Not,
    And,
    Or,
    Equal,
    Less,
    LessEqual,
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

impl LinkedConstraint {
    pub fn expressions(&self) -> impl Iterator<Item = &LinkedExpression> {
        std::iter::once(&self.assertion)
            .chain(&self.when)
            .chain(self.for_each.iter().map(|iteration| &iteration.input))
            .chain(
                self.diagnostic
                    .message
                    .iter()
                    .filter_map(|part| match part {
                        LinkedMessagePart::Expression(value) => Some(value),
                        _ => None,
                    }),
            )
    }
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

impl LinkedPresence {
    pub fn expressions_mut(&mut self) -> impl Iterator<Item = &mut LinkedExpression> {
        self.xml_missing
            .iter_mut()
            .chain(&mut self.yaml_missing)
            .chain(&mut self.yaml_omit_when)
            .chain(
                self.xml_empty
                    .iter_mut()
                    .chain(&mut self.yaml_empty)
                    .map(|form| &mut form.denotes),
            )
            .chain(
                self.canonical
                    .iter_mut()
                    .filter_map(|form| form.when.as_mut()),
            )
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedCanonical {
    pub when: Option<LinkedExpression>,
    pub form: crate::XmlForm,
    pub xml_type: Option<crate::ExpandedName>,
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
    YamlSequence,
    XmlTree,
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LinkedContribution {
    pub for_each: Option<LinkedIteration>,
    pub index: String,
    pub union_reference_prefix: Option<String>,
    pub key: LinkedExpression,
    pub value: LinkedExpression,
    pub source: SourceLocation,
}
