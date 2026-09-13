use crate::SourceLocation;

/// A physical XML element. Bindings refer to semantic fields; constants do not
/// add transport-only fields to the semantic value.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct XmlTreeNode<N, A> {
    pub name: N,
    pub attributes: Vec<A>,
    pub content: XmlTreeContent<N, A>,
    pub source: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum XmlTreeContent<N, A> {
    Constant(String),
    Field(String),
    SelfValue,
    Children(Vec<XmlTreeNode<N, A>>),
}
