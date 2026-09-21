//! Bind facts once, then prepare all selected conversions without copying their context.
use crate::{conversion, facts};
use nkdk_compiled_rules::{Direction, RuntimeDiagnostic};
use nkdk_conversion_core::{
    facts::{Generation, prepared::FactBudget},
    resources::Limits,
};
use std::path::Path;

pub struct Conversion<'a> {
    pub consumer_source_index: usize,
    pub direction: Direction,
    pub primary: &'a [u8],
}

pub struct Request<'a> {
    pub sources: Vec<facts::Source<'a>>,
    pub conversions: Vec<Conversion<'a>>,
    pub generation: Generation,
    pub fact_budget: FactBudget,
    pub edge_budget: usize,
    pub source_root: &'a Path,
    pub temporary_parent: &'a Path,
    pub limits: Limits,
    pub xml_bytes: usize,
}

pub fn prepare(
    request: Request<'_>,
) -> Result<Vec<conversion::PreparedConversion>, Vec<RuntimeDiagnostic>> {
    let Request {
        sources,
        conversions,
        generation,
        fact_budget,
        edge_budget,
        source_root,
        temporary_parent,
        limits,
        xml_bytes,
    } = request;
    if conversions.is_empty() {
        return Ok(Vec::new());
    }
    let mut selected = vec![false; sources.len()];
    let mut consumers = Vec::with_capacity(conversions.len());
    for conversion in &conversions {
        let Some(source) = sources.get(conversion.consumer_source_index) else {
            return Err(vec![RuntimeDiagnostic::new(
                "operation.source",
                "Consumer source is missing",
            )]);
        };
        if selected[conversion.consumer_source_index] {
            return Err(vec![RuntimeDiagnostic::new(
                "operation.source",
                "Consumer source is selected twice",
            )]);
        }
        selected[conversion.consumer_source_index] = true;
        consumers.push(source.entry);
    }
    let mut prepared = facts::prepare(sources, &consumers, generation, fact_budget, edge_budget)?;
    let mut results = Vec::with_capacity(conversions.len());
    for conversion in conversions {
        let source = prepared
            .sources
            .get_mut(conversion.consumer_source_index)
            .expect("checked consumer source");
        let inputs = std::mem::take(&mut source.inputs);
        results.push(conversion::prepare(conversion::Request {
            entry: source.entry,
            direction: conversion.direction,
            primary: conversion.primary,
            inputs,
            source_root,
            temporary_parent,
            limits,
            xml_bytes,
        })?);
    }
    Ok(results)
}
