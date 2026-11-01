pub use nkdk_compiled_rules::{Direction, convert_file};
use nkdk_compiled_rules::{PreparedInputs, entry_id};
use nkdk_compiled_rules_probes as nkdk_compiled_rules;
#[path = "candidate.rs"]
mod candidate;
#[allow(unused_imports)] // Each probe family exercises a different subset.
pub use candidate::{
    assert_plain_round_trip, assert_valid_candidate, dcs_parameter_fragment, preserved_raw_yaml,
};
include!("style_item_inputs.rs");
