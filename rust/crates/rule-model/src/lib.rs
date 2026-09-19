mod linked;
mod xml_tree;
pub use linked::*;
pub use xml_tree::*;
mod text;
pub use text::*;

pub struct SourceFile<'a> {
    pub path: &'a str,
    pub bytes: &'a [u8],
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SourceLocation {
    pub file: String,
    pub line: usize,
    pub column: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub code: String,
    pub file: String,
    pub line: usize,
    pub column: usize,
    pub message: String,
    pub related: Vec<SourceLocation>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Module {
    pub source: SourceLocation,
    pub kind: ModuleKind,
    pub id: String,
    pub description: Option<String>,
    pub imports: Vec<NamedBinding>,
    pub namespaces: Vec<NamedBinding>,
    pub types: Vec<NamedType>,
    pub inputs: Vec<NamedType>,
    pub input_indexes: Vec<NamedBinding>,
    pub parameters: Vec<Parameter>,
    pub presence: Vec<Presence>,
    /// Finite relation domains retained for validation after imports are resolved.
    pub state_relations: Vec<StateRelation>,
    pub normalization: Option<Normalization>,
    pub constraints: Vec<Constraint>,
    pub contributions: Vec<Contribution>,
    pub resources: Vec<ResourceGroup<Expression>>,
    pub compose: Vec<TypeUse>,
    pub value: TypeDefinition,
    pub representations: Representations,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StateRelation {
    pub field: String,
    pub sources: Vec<String>,
    pub computed_sources: Vec<String>,
    pub values: Vec<String>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ModuleKind {
    Value,
    Fragment,
    Object,
    Resources,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ScalarType {
    Decimal,
    Text,
    Boolean,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Representations {
    pub xml: XmlRepresentation,
    pub yaml: YamlRepresentation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum XmlRepresentation {
    /// Use the complete declaration referenced by the sequence item type.
    Declared,
    TextSequence {
        separator: String,
    },
    Choice,
    TextPattern(Vec<TextPatternPart>),
    QName {
        namespace: String,
        local: String,
    },
    Tree(Vec<XmlTreeNode<String, XmlAttribute>>),
    FormattedDecimal(DecimalText),
    ScalarChoice(ScalarChoiceXml<String>),
    Calendar,
    WithAttributes {
        attributes: Vec<XmlAttribute>,
        content: Box<XmlRepresentation>,
    },
    ElementSequence {
        path: Vec<String>,
        item: Box<XmlRepresentation>,
    },
    Record(Vec<XmlField>),
    Text,
    BooleanTable(Vec<BooleanLexeme>),
    EnumTable(Vec<EnumLexeme>),
    QNameTable(Vec<QNameLexeme<String>>),
    QNameTextTable(Vec<QNameTextLexeme<String>>),
    Decimal,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum YamlRepresentation {
    States(Vec<YamlState>),
    /// Expose a single semantic field as the complete YAML document.
    Projection(String),
    /// Use the complete declaration referenced by the sequence item type.
    Declared,
    TextSequence {
        separator: String,
    },
    Choice,
    TextTable(TextTable),
    TextPattern(Vec<TextPatternPart>),
    Sequence {
        item: Box<YamlRepresentation>,
        shorthand: Vec<LiteralSequenceShorthand>,
        singleton: bool,
    },
    ScalarChoice,
    Calendar {
        seconds: bool,
        omit_zero: bool,
    },
    RecordMapping {
        key: String,
        value: Option<String>,
    },
    KeyedMapping {
        key: String,
        value: String,
        shorthand: Vec<Shorthand>,
    },
    Mapping(Vec<YamlField>),
    Text,
    BooleanTable(Vec<BooleanLexeme>),
    EnumTable(Vec<EnumLexeme>),
    Decimal,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TextTable {
    Import {
        name: String,
        source: SourceLocation,
    },
    Resolved(Vec<EnumLexeme>),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TextPatternPart {
    pub value: TextPatternValue,
    pub separator: Option<String>,
    pub source: SourceLocation,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TextPatternValue {
    Literal(String),
    Field(String),
    Optional {
        field: String,
        parts: Vec<TextPatternPart>,
    },
}
/// Semantic slots in a text layout, including slots of optional groups.
pub fn text_pattern_fields(parts: &[TextPatternPart]) -> Vec<&str> {
    let mut names = Vec::new();
    for part in parts {
        match &part.value {
            TextPatternValue::Field(name) => names.push(name.as_str()),
            TextPatternValue::Optional { parts, .. } => names.extend(text_pattern_fields(parts)),
            TextPatternValue::Literal(_) => (),
        }
    }
    names
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LiteralSequenceShorthand {
    pub id: String,
    pub text: String,
    pub values: Vec<String>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BooleanLexeme {
    pub value: bool,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NamedBinding {
    pub name: String,
    pub value: String,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NamedType {
    pub name: String,
    pub definition: TypeDefinition,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TypeDefinition {
    Choice(Vec<TypeField>),
    IndexFromBinding(String),
    Index {
        key: Box<TypeDefinition>,
        value: Box<TypeDefinition>,
    },
    ScalarChoice(Vec<ScalarType>),
    Enum(Vec<EnumVariant>),
    TextTransform(Box<TextTransform>),
    Scalar(ScalarType),
    Record(Vec<TypeField>),
    Sequence(Box<TypeDefinition>),
    Local(String),
    Use(TypeUse),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TypeField {
    pub name: String,
    pub definition: TypeDefinition,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TypeUse {
    pub name: String,
    pub arguments: Vec<StaticArgument>,
    pub bindings: Vec<ExpressionField>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StaticValue {
    Literal(ScalarLiteral),
    Parameter(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StaticArgument {
    pub name: String,
    pub value: StaticValue,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct XmlField {
    pub file: Option<Vec<String>>,
    pub field: String,
    pub path: Vec<String>,
    pub attribute: Option<String>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct YamlField {
    pub field: String,
    pub key: String,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Shorthand {
    pub id: String,
    pub representation: ShorthandRepresentation,
    pub capture: String,
    pub denotes: Expression,
    pub when: Option<Expression>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ShorthandRepresentation {
    ScalarText,
    KeyedMapping {
        prefix: Vec<Expression>,
        suffix: Vec<Expression>,
        absent_keys: Vec<Expression>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Expression {
    pub kind: ExpressionKind,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExpressionKind {
    Lookup {
        input: Box<Expression>,
        key: Box<Expression>,
    },
    Matches {
        value: Box<Expression>,
        pattern: String,
    },
    MatchOptional {
        value: Box<Expression>,
        binding: String,
        present: Box<Expression>,
        absent: Box<Expression>,
    },
    SequencePattern {
        prefix: Vec<Expression>,
        rest: String,
        suffix: Vec<Expression>,
    },
    StateTest {
        predicate: StatePredicate,
        value: Box<Expression>,
    },
    Take {
        input: Box<Expression>,
        count: u64,
    },
    FirstBy {
        input: Box<Expression>,
        binding: String,
        key: Box<Expression>,
    },
    Ordered {
        input: Box<Expression>,
        binding: String,
        key: Box<Expression>,
        unique: bool,
        first: Vec<Expression>,
    },
    Transform {
        local: String,
        value: Box<Expression>,
    },
    Field(String),
    Not(Box<Expression>),
    Absent,
    SelfValue,
    Variable(String),
    Get {
        value: Box<Expression>,
        field: String,
    },
    Fold {
        input: Box<Expression>,
        initial: Box<Expression>,
        binding: String,
        state: String,
        next: Box<Expression>,
    },
    Each {
        input: Box<Expression>,
        binding: String,
        predicate: Box<Expression>,
    },
    And(Vec<Expression>),
    Or(Vec<Expression>),
    Exists {
        input: Box<Expression>,
        binding: String,
        predicate: Box<Expression>,
    },
    One {
        input: Box<Expression>,
        binding: String,
        predicate: Box<Expression>,
    },
    Select {
        input: Box<Expression>,
        binding: String,
        predicate: Box<Expression>,
    },
    Find {
        input: Box<Expression>,
        binding: String,
        predicate: Box<Expression>,
    },
    Filter {
        input: Box<Expression>,
        binding: String,
        predicate: Box<Expression>,
    },
    Map {
        input: Box<Expression>,
        binding: String,
        value: Box<Expression>,
    },
    Compare {
        operator: ComparisonOperator,
        left: Box<Expression>,
        right: Box<Expression>,
    },
    Conditional {
        condition: Box<Expression>,
        then_value: Box<Expression>,
        else_value: Box<Expression>,
    },
    Parameter(String),
    Literal(ScalarLiteral),
    Input(String),
    Capture(String),
    Sequence(Vec<Expression>),
    Concat(Vec<Expression>),
    Require(Box<Expression>),
    Record(Vec<ExpressionField>),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ComparisonOperator {
    Equal,
    LessThan,
    LessOrEqual,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StatePredicate {
    Present,
    IsNull,
    IsReady,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ScalarLiteral {
    Text(String),
    Boolean(bool),
    Null,
    /// Exact source spelling; precision is checked against the target type during linking.
    Number(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Parameter {
    pub name: String,
    pub definition: TypeDefinition,
    pub default: Option<ScalarLiteral>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExpressionField {
    pub name: String,
    pub value: Expression,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Normalization {
    pub when: Expression,
    pub denotes: Expression,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Constraint {
    pub id: String,
    pub applies_to: Vec<ValidationPhase>,
    pub when: Option<Expression>,
    pub for_each: Option<Iteration>,
    pub forms: Vec<String>,
    pub assertion: Expression,
    pub diagnostic: DiagnosticDefinition,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ValidationPhase {
    XmlImport,
    YamlValidation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DiagnosticDefinition {
    pub code: Option<String>,
    pub source: Option<String>,
    pub severity: Severity,
    pub at: DiagnosticTarget,
    pub message: MessageDefinition,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Severity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DiagnosticTarget {
    SelfValue,
    Field(String),
    Occurrence { name: String, field: String },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Iteration {
    pub input: Expression,
    pub binding: String,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MessageDefinition {
    Text(String),
    Parts(Vec<MessagePart>),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MessagePart {
    Text(String),
    Expression(Expression),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Presence {
    pub target: PresenceTarget,
    pub xml_missing: Option<Expression>,
    pub xml_empty: Vec<EmptyForm>,
    pub yaml_missing: Option<Expression>,
    pub yaml_empty: Vec<EmptyForm>,
    pub yaml_omit_when: Option<Expression>,
    pub xml_canonical: Vec<CanonicalForm>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmptyForm {
    pub form: EmptyKind,
    pub denotes: Expression,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmptyKind {
    Element,
    Item,
    Text,
    Nil,
    String,
    Mapping,
    Sequence,
    Null,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PresenceTarget {
    SelfValue,
    Field(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CanonicalForm {
    pub when: Option<Expression>,
    pub form: XmlForm,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum XmlForm {
    Ordinary,
    EmptyElement,
    Nil,
    Missing,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct XmlAttribute {
    pub name: String,
    pub value: XmlAttributeValue,
    pub when: Option<Expression>,
    pub source: SourceLocation,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum XmlAttributeValue {
    Text(String),
    QName(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EnumVariant {
    pub name: String,
    pub value: String,
    pub source: SourceLocation,
}
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum YamlStateForm {
    Absent,
    Empty,
    Text(String),
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct YamlState {
    pub value: String,
    pub form: YamlStateForm,
    pub tag: Option<String>,
    pub source: SourceLocation,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EnumLexeme {
    pub value: String,
    pub text: String,
    pub accepted: Vec<String>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QNameLexeme<N> {
    pub value: String,
    pub name: N,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QNameTextLexeme<N> {
    pub name: N,
    pub accepted: Vec<N>,
    pub literal: String,
    pub separator: Option<String>,
    pub tail_segments: Vec<String>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScalarChoiceXml<N> {
    pub attribute: N,
    pub cases: Vec<ScalarChoiceCase<N>>,
    pub otherwise: ScalarType,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScalarChoiceCase<N> {
    pub scalar: ScalarType,
    pub values: Vec<N>,
    pub emit: Option<N>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DecimalText {
    pub separator: char,
    pub accepted: Vec<char>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Contribution {
    pub for_each: Option<Iteration>,
    pub index: String,
    pub key: Expression,
    pub value: Expression,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResourceGroup<E, I = Iteration> {
    pub remainder: bool,
    pub for_each: Option<I>,
    pub alternatives: Vec<ResourceRoute<E>>,
    pub source: SourceLocation,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResourceRoute<E> {
    pub xml: E,
    pub yaml: E,
}
