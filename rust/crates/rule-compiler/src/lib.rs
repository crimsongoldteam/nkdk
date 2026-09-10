mod link;
pub use link::link;
mod parse;
mod syntax;

pub use nkdk_rule_model::{Diagnostic, Module, SourceFile};
pub use parse::parse;
