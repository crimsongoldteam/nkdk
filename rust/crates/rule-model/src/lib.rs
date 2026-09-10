pub struct SourceFile<'a> {
    pub path: &'a str,
    pub bytes: &'a [u8],
}

#[derive(Debug, PartialEq, Eq)]
pub struct SourceLocation {
    pub file: String,
    pub line: usize,
    pub column: usize,
}

#[derive(Debug, PartialEq, Eq)]
pub struct Diagnostic {
    pub code: String,
    pub file: String,
    pub line: usize,
    pub column: usize,
    pub message: String,
    pub related: Vec<SourceLocation>,
}

#[derive(Debug)]
pub struct Module {
    pub kind: ModuleKind,
    pub id: String,
    pub description: Option<String>,
    pub imports: Vec<NamedBinding>,
    pub namespaces: Vec<NamedBinding>,
    pub types: Vec<NamedType>,
    pub inputs: Vec<NamedType>,
    pub parameters: Vec<Parameter>,
    pub presence: Vec<Presence>,
    pub normalization: Option<Normalization>,
    pub value: TypeDefinition,
    pub representations: Representations,
}

#[derive(Debug, PartialEq, Eq)]
pub enum ModuleKind {
    Value,
    Fragment,
    Object,
}

#[derive(Debug, PartialEq, Eq)]
pub enum ScalarType {
    Text,
    Boolean,
}

#[derive(Debug, PartialEq, Eq)]
pub struct Representations {
    pub xml: XmlRepresentation,
    pub yaml: YamlRepresentation,
}

#[derive(Debug, PartialEq, Eq)]
pub enum XmlRepresentation {
    ElementSequence {
        path: Vec<String>,
        item: Box<XmlRepresentation>,
    },
    Record(Vec<XmlField>),
    Text,
    BooleanTable(Vec<BooleanLexeme>),
}

#[derive(Debug, PartialEq, Eq)]
pub enum YamlRepresentation {
    KeyedMapping {
        key: String,
        value: String,
        shorthand: Vec<Shorthand>,
    },
    Mapping(Vec<YamlField>),
    Text,
    BooleanTable(Vec<BooleanLexeme>),
}

#[derive(Debug, PartialEq, Eq)]
pub struct BooleanLexeme {
    pub value: bool,
    pub text: String,
}

#[derive(Debug, PartialEq, Eq)]
pub struct NamedBinding {
    pub name: String,
    pub value: String,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub struct NamedType {
    pub name: String,
    pub definition: TypeDefinition,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub enum TypeDefinition {
    Scalar(ScalarType),
    Record(Vec<TypeField>),
    Sequence(Box<TypeDefinition>),
    Local(String),
    Use(TypeUse),
}

#[derive(Debug, PartialEq, Eq)]
pub struct TypeField {
    pub name: String,
    pub definition: TypeDefinition,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub struct TypeUse {
    pub name: String,
    pub arguments: Vec<StaticArgument>,
    pub bindings: Vec<ExpressionField>,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub struct StaticArgument {
    pub name: String,
    pub value: ScalarLiteral,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub struct XmlField {
    pub field: String,
    pub path: Vec<String>,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub struct YamlField {
    pub field: String,
    pub key: String,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub struct Shorthand {
    pub id: String,
    pub capture: String,
    pub denotes: Expression,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub struct Expression {
    pub kind: ExpressionKind,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub enum ExpressionKind {
    Not(Box<Expression>),
    Absent,
    SelfValue,
    Variable(String),
    Get {
        value: Box<Expression>,
        field: String,
    },
    Each {
        input: Box<Expression>,
        binding: String,
        predicate: Box<Expression>,
    },
    And(Vec<Expression>),
    Equal {
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
    Record(Vec<ExpressionField>),
}

#[derive(Debug, PartialEq, Eq)]
pub enum ScalarLiteral {
    Text(String),
    Boolean(bool),
    Null,
    /// Exact source spelling; precision is checked against the target type during linking.
    Number(String),
}

#[derive(Debug, PartialEq, Eq)]
pub struct Parameter {
    pub name: String,
    pub definition: TypeDefinition,
    pub default: Option<ScalarLiteral>,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub struct ExpressionField {
    pub name: String,
    pub value: Expression,
}

#[derive(Debug, PartialEq, Eq)]
pub struct Normalization {
    pub when: Expression,
    pub denotes: Expression,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
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

#[derive(Debug, PartialEq, Eq)]
pub struct EmptyForm {
    pub form: EmptyKind,
    pub denotes: Expression,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub enum EmptyKind {
    Element,
    Text,
    Nil,
    String,
    Mapping,
    Sequence,
    Null,
}

#[derive(Debug, PartialEq, Eq)]
pub enum PresenceTarget {
    SelfValue,
    Field(String),
}

#[derive(Debug, PartialEq, Eq)]
pub struct CanonicalForm {
    pub when: Option<Expression>,
    pub form: XmlForm,
    pub source: SourceLocation,
}

#[derive(Debug, PartialEq, Eq)]
pub enum XmlForm {
    Ordinary,
    EmptyElement,
    Nil,
    Missing,
}
