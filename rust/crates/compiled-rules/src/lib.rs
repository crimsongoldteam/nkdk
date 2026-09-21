// The declaration compiler emits this entire crate. Lint its source generator;
// these stylistic diagnostics describe expanded templates, not hand-written code.
#![allow(
    unused_mut,
    unused_variables,
    clippy::blocks_in_conditions,
    clippy::collapsible_if,
    clippy::comparison_to_empty,
    clippy::large_enum_variant,
    clippy::map_identity,
    clippy::mixed_attributes_style,
    clippy::module_inception,
    clippy::needless_borrow,
    clippy::needless_question_mark,
    clippy::possible_missing_else,
    clippy::string_extend_chars,
    clippy::useless_asref
)]
include!(concat!(env!("OUT_DIR"), "/generated.rs"));
