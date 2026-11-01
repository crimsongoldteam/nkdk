//! One public boundary for independently compiled declaration packages.
use nkdk_compiled_rules_base as primary;
pub use nkdk_compiled_rules_base::*;
use nkdk_compiled_rules_bodies as bodies;
use nkdk_compiled_rules_bodies_2 as bodies2;
use nkdk_compiled_rules_bodies_3 as bodies3;
use nkdk_compiled_rules_bodies_4 as bodies4;
use nkdk_compiled_rules_bodies_5 as bodies5;
use nkdk_compiled_rules_elements as elements;
use nkdk_compiled_rules_elements_2 as elements2;
use nkdk_compiled_rules_inputs as inputs;
use nkdk_compiled_rules_inputs_2 as inputs2;
use nkdk_compiled_rules_members as members;
use nkdk_compiled_rules_members_2 as members2;
use nkdk_compiled_rules_owners as secondary;
use nkdk_compiled_rules_owners_2 as secondary2;
use nkdk_compiled_rules_owners_3 as secondary3;
use std::sync::OnceLock;

pub fn check_catalog() -> nkdk_conversion_core::Result<()> {
    static CHECK: OnceLock<nkdk_conversion_core::Result<()>> = OnceLock::new();
    CHECK
        .get_or_init(|| {
            for signature in [
                elements::catalog_signature(),
                elements2::catalog_signature(),
                bodies::catalog_signature(),
                bodies2::catalog_signature(),
                bodies3::catalog_signature(),
                bodies4::catalog_signature(),
                bodies5::catalog_signature(),
                secondary::catalog_signature(),
                secondary2::catalog_signature(),
                secondary3::catalog_signature(),
                members::catalog_signature(),
                members2::catalog_signature(),
                inputs::catalog_signature(),
                inputs2::catalog_signature(),
            ] {
                if primary::catalog_signature() != signature {
                    return Err(RuntimeDiagnostic::new(
                        "catalog.revision",
                        "Compiled packages use different declaration revisions",
                    ));
                }
            }
            let mut entries = std::collections::BTreeSet::new();
            for package in [
                elements::exported_entries(),
                elements2::exported_entries(),
                bodies::exported_entries(),
                bodies2::exported_entries(),
                bodies3::exported_entries(),
                bodies4::exported_entries(),
                bodies5::exported_entries(),
                primary::exported_entries(),
                secondary::exported_entries(),
                secondary2::exported_entries(),
                secondary3::exported_entries(),
                members::exported_entries(),
                members2::exported_entries(),
                inputs::exported_entries(),
                inputs2::exported_entries(),
            ] {
                for (_, entry) in package {
                    if !entries.insert(entry.0) {
                        return Err(RuntimeDiagnostic::new(
                            "catalog.ownership",
                            "A conversion belongs to multiple compiled packages",
                        ));
                    }
                }
            }
            Ok(())
        })
        .clone()
}

pub fn entry_id(name: &str) -> Option<EntryId> {
    primary::entry_id(name)
        .or_else(|| elements::entry_id(name))
        .or_else(|| elements2::entry_id(name))
        .or_else(|| bodies::entry_id(name))
        .or_else(|| bodies2::entry_id(name))
        .or_else(|| bodies3::entry_id(name))
        .or_else(|| bodies4::entry_id(name))
        .or_else(|| bodies5::entry_id(name))
        .or_else(|| secondary::entry_id(name))
        .or_else(|| secondary2::entry_id(name))
        .or_else(|| secondary3::entry_id(name))
        .or_else(|| members::entry_id(name))
        .or_else(|| members2::entry_id(name))
        .or_else(|| inputs::entry_id(name))
        .or_else(|| inputs2::entry_id(name))
}

pub fn exported_entries() -> &'static [(&'static str, EntryId)] {
    static ENTRIES: OnceLock<Vec<(&'static str, EntryId)>> = OnceLock::new();
    ENTRIES.get_or_init(|| {
        primary::exported_entries()
            .iter()
            .chain(elements::exported_entries())
            .chain(elements2::exported_entries())
            .chain(bodies::exported_entries())
            .chain(bodies2::exported_entries())
            .chain(bodies3::exported_entries())
            .chain(bodies4::exported_entries())
            .chain(bodies5::exported_entries())
            .chain(secondary::exported_entries())
            .chain(secondary2::exported_entries())
            .chain(secondary3::exported_entries())
            .chain(members::exported_entries())
            .chain(members2::exported_entries())
            .chain(inputs::exported_entries())
            .chain(inputs2::exported_entries())
            .copied()
            .collect()
    })
}

pub fn contains_entry(entry: EntryId) -> bool {
    primary::contains_entry(entry)
        || elements::contains_entry(entry)
        || elements2::contains_entry(entry)
        || bodies::contains_entry(entry)
        || bodies2::contains_entry(entry)
        || bodies3::contains_entry(entry)
        || bodies4::contains_entry(entry)
        || bodies5::contains_entry(entry)
        || secondary::contains_entry(entry)
        || secondary2::contains_entry(entry)
        || secondary3::contains_entry(entry)
        || members::contains_entry(entry)
        || members2::contains_entry(entry)
        || inputs::contains_entry(entry)
        || inputs2::contains_entry(entry)
}

// Package ownership is shared by byte conversions and fact operations.
macro_rules! in_catalog {
    ($entry:expr, |$catalog:ident| $call:expr) => {
        if elements::contains_entry($entry) {
            use elements as $catalog;
            $call
        } else if elements2::contains_entry($entry) {
            use elements2 as $catalog;
            $call
        } else if bodies::contains_entry($entry) {
            use bodies as $catalog;
            $call
        } else if bodies2::contains_entry($entry) {
            use bodies2 as $catalog;
            $call
        } else if bodies3::contains_entry($entry) {
            use bodies3 as $catalog;
            $call
        } else if bodies4::contains_entry($entry) {
            use bodies4 as $catalog;
            $call
        } else if bodies5::contains_entry($entry) {
            use bodies5 as $catalog;
            $call
        } else if members2::contains_entry($entry) {
            use members2 as $catalog;
            $call
        } else if members::contains_entry($entry) {
            use members as $catalog;
            $call
        } else if secondary::contains_entry($entry) {
            use secondary as $catalog;
            $call
        } else if secondary2::contains_entry($entry) {
            use secondary2 as $catalog;
            $call
        } else if secondary3::contains_entry($entry) {
            use secondary3 as $catalog;
            $call
        } else if inputs::contains_entry($entry) {
            use inputs as $catalog;
            $call
        } else if inputs2::contains_entry($entry) {
            use inputs2 as $catalog;
            $call
        } else {
            use primary as $catalog;
            $call
        }
    };
}

macro_rules! delegate {
    ($name:ident($entry:ident: EntryId $(,$arg:ident:$ty:ty)*) -> $result:ty, $error:expr) => {
        // The same error gate also serves operations returning diagnostics directly.
        #[allow(clippy::question_mark)]
        pub fn $name($entry:EntryId,$($arg:$ty),*) -> $result {
            if let Err(issue)=check_catalog() {return ($error)(issue);}
            in_catalog!($entry, |catalog| catalog::$name($entry,$($arg),*))
        }
    };
}

delegate!(yaml_file_requests(entry:EntryId,inputs:&PreparedInputs,limits:nkdk_conversion_core::resources::Limits)
    -> nkdk_conversion_core::Result<Vec<nkdk_conversion_core::resources::RelativePath>>, Err);
delegate!(convert_file(entry:EntryId,direction:Direction,source:&[u8],inputs:&PreparedInputs)
    -> Result<FileResult,Vec<RuntimeDiagnostic>>, |issue|Err(vec![issue]));
delegate!(validate_file(entry:EntryId,source:&[u8],inputs:&PreparedInputs)
    -> Vec<RuntimeDiagnostic>, |issue|vec![issue]);
delegate!(verify_candidate(entry:EntryId,original:&[u8],candidate:&[u8],inputs:&PreparedInputs)
    -> Result<(),Vec<RuntimeDiagnostic>>, |issue|Err(vec![issue]));
delegate!(snapshot_fact_source(entry:EntryId,source:&[u8],inputs:&PreparedInputs)
    -> nkdk_conversion_core::Result<Vec<u8>>, Err);
delegate!(materialize_fact_source(entry:EntryId,source:&[u8],inputs:&PreparedInputs)
    -> nkdk_conversion_core::Result<Vec<u8>>, Err);
delegate!(contribute_file(entry:EntryId,direction:Direction,source:&[u8],inputs:&PreparedInputs,
    builder:&mut nkdk_conversion_core::facts::prepared::TextFactsBuilder)
    -> Vec<RuntimeDiagnostic>, |issue|vec![issue]);
delegate!(contribute_snapshot_file(entry:EntryId,source:&[u8],inputs:&PreparedInputs,
    builder:&mut nkdk_conversion_core::facts::prepared::TextFactsBuilder)
    -> Vec<RuntimeDiagnostic>, |issue|vec![issue]);

pub fn snapshot_attribute_source(
    entry: EntryId,
    source: impl nkdk_conversion_core::xml::attribute_scan::Source,
    max_depth: usize,
    budget: nkdk_conversion_core::xml::attribute_scan::SnapshotBudget,
) -> nkdk_conversion_core::Result<Vec<u8>> {
    check_catalog()?;
    in_catalog!(entry, |catalog| catalog::snapshot_attribute_source(
        entry, source, max_depth, budget
    ))
}
delegate!(empty_attribute_snapshot(entry:EntryId,budget:nkdk_conversion_core::xml::attribute_scan::SnapshotBudget)
    -> nkdk_conversion_core::Result<Vec<u8>>, Err);
delegate!(contribute_attribute_snapshot_file(entry:EntryId,source:&[u8],inputs:&PreparedInputs,
    builder:&mut nkdk_conversion_core::facts::prepared::TextFactsBuilder,max_depth:usize,
    budget:nkdk_conversion_core::xml::attribute_scan::SnapshotBudget)
    -> Vec<RuntimeDiagnostic>, |issue|vec![issue]);

// Every special source uses the same shared binding metadata, while retaining
// its own declared dependency demand.
macro_rules! forward_fact_bindings {
    ($($name:ident),+ $(,)?) => {$(
    fn $name(
        source: &nkdk_conversion_core::facts::preparation::Source<'_>,
        facts: std::sync::Arc<nkdk_conversion_core::facts::prepared::PreparedTextFacts>,
        generation: nkdk_conversion_core::facts::Generation,
    ) -> nkdk_conversion_core::Result<PreparedInputs> {
        <primary::FactCatalog as nkdk_conversion_core::facts::preparation::Catalog>::$name(
            source, facts, generation,
        )
    }
    )+};
}

pub struct FactCatalog;
impl nkdk_conversion_core::facts::preparation::Catalog for FactCatalog {
    forward_fact_bindings!(bind_attributes, bind_snapshot);
    fn index_count() -> usize {
        <primary::FactCatalog as nkdk_conversion_core::facts::preparation::Catalog>::index_count()
    }
    fn plan(
        sources: &[(EntryId, Direction)],
        consumers: &[EntryId],
        budget: usize,
    ) -> nkdk_conversion_core::Result<nkdk_conversion_core::facts::dependencies::DependencyPlan>
    {
        check_catalog()?;
        fact_plan_for_sources(sources, consumers, budget)
    }
    fn builder(
        generation: nkdk_conversion_core::facts::Generation,
        budget: nkdk_conversion_core::facts::prepared::FactBudget,
    ) -> nkdk_conversion_core::facts::prepared::TextFactsBuilder {
        fact_builder(generation, budget)
    }
    fn plan_materials(
        sources: &[(
            EntryId,
            Direction,
            nkdk_conversion_core::facts::preparation::SourceKind,
        )],
        consumers: &[EntryId],
        budget: usize,
    ) -> nkdk_conversion_core::Result<nkdk_conversion_core::facts::dependencies::DependencyPlan>
    {
        check_catalog()?;
        fact_plan_materials(sources, consumers, budget)
    }
    fn bind(
        source: &nkdk_conversion_core::facts::preparation::Source<'_>,
        direction: Option<Direction>,
        facts: std::sync::Arc<nkdk_conversion_core::facts::prepared::PreparedTextFacts>,
        generation: nkdk_conversion_core::facts::Generation,
    ) -> nkdk_conversion_core::Result<PreparedInputs> {
        <primary::FactCatalog as nkdk_conversion_core::facts::preparation::Catalog>::bind(
            source, direction, facts, generation,
        )
    }
    fn contribute(
        source: &nkdk_conversion_core::facts::preparation::Source<'_>,
        builder: &mut nkdk_conversion_core::facts::prepared::TextFactsBuilder,
    ) -> Vec<RuntimeDiagnostic> {
        contribute_file(
            source.entry,
            source.direction,
            source.bytes,
            &source.inputs,
            builder,
        )
    }
    fn reserve_attributes(
        source: &nkdk_conversion_core::facts::preparation::Source<'_>,
        builder: &mut nkdk_conversion_core::facts::prepared::TextFactsBuilder,
        max_depth: usize,
    ) -> Vec<RuntimeDiagnostic> {
        if let Err(issue) = check_catalog() {
            return vec![issue];
        }
        in_catalog!(source.entry, |catalog| {
            <catalog::FactCatalog as nkdk_conversion_core::facts::preparation::Catalog>::reserve_attributes(source, builder, max_depth)
        })
    }

    fn reserve_attribute_snapshot(
        source: &nkdk_conversion_core::facts::preparation::Source<'_>,
        builder: &mut nkdk_conversion_core::facts::prepared::TextFactsBuilder,
        max_depth: usize,
        budget: nkdk_conversion_core::xml::attribute_scan::SnapshotBudget,
    ) -> Vec<RuntimeDiagnostic> {
        contribute_attribute_snapshot_file(
            source.entry,
            source.bytes,
            &source.inputs,
            builder,
            max_depth,
            budget,
        )
    }

    fn contribute_snapshot(
        source: &nkdk_conversion_core::facts::preparation::Source<'_>,
        builder: &mut nkdk_conversion_core::facts::prepared::TextFactsBuilder,
    ) -> Vec<RuntimeDiagnostic> {
        contribute_snapshot_file(source.entry, source.bytes, &source.inputs, builder)
    }
}
