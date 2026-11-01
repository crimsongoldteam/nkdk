mod collections;
mod owners;
mod reservations;
mod snapshots;
mod summaries;
mod yaml_projection;
use super::*;
pub(super) use owners::accessors as owner_accessors;
use std::{collections::BTreeMap, fmt::Write};

fn effective_contributions<'a>(
    entry: &'a LinkedEntry,
    program: &'a Program,
) -> Vec<&'a LinkedContribution> {
    fn nested<'a>(
        value: &'a LinkedType,
        program: &'a Program,
        visited: &mut BTreeSet<u32>,
        result: &mut Vec<&'a LinkedContribution>,
    ) {
        match value {
            LinkedType::Record(fields) | LinkedType::Choice(fields) => {
                for field in fields {
                    nested(&field.value, program, visited, result);
                }
            }
            LinkedType::Sequence(item) | LinkedType::Optional(item) => {
                nested(item, program, visited, result);
            }
            LinkedType::Reference(id) | LinkedType::BoundReference { entry: id, .. } => {
                if !visited.insert(*id) {
                    return;
                }
                let Some(target) = program.entries.iter().find(|entry| entry.id == *id) else {
                    return;
                };
                let LinkedType::Sequence(item) = &target.value else {
                    if matches!(target.value, LinkedType::Record(_) | LinkedType::Choice(_)) {
                        result.extend(&target.contributions);
                        nested(&target.value, program, visited, result);
                    }
                    return;
                };
                if !matches!(&target.yaml,
                    YamlRepresentation::Sequence { item, .. } if **item == YamlRepresentation::Declared)
                    && !matches!(target.yaml, YamlRepresentation::RecordMapping { .. })
                {
                    return;
                }
                let Some((row, _, _)) = item.as_reference() else {
                    return;
                };
                if let Some(row) = program.entries.iter().find(|entry| entry.id == row) {
                    result.extend(&row.contributions);
                    nested(&row.value, program, visited, result);
                }
            }
            _ => {}
        }
    }
    let mut result = entry.contributions.iter().collect();
    nested(&entry.value, program, &mut BTreeSet::new(), &mut result);
    result
}

pub(super) fn has_contributions(entry: &LinkedEntry, program: &Program) -> bool {
    !effective_contributions(entry, program).is_empty()
}

/// Select a declared collection by its type, independently of property names.
pub(super) fn collection_has_contributions(entry: &LinkedEntry, program: &Program) -> bool {
    let LinkedType::Record(fields) = &entry.value else {
        return false;
    };
    let [field] = fields.as_slice() else {
        return false;
    };
    let Some((id, _, _)) = field.value.as_reference() else {
        return false;
    };
    program
        .entries
        .iter()
        .find(|value| value.id == id)
        .is_some_and(|target| matches!(target.value, LinkedType::Sequence(_)))
        && !effective_contributions(entry, program).is_empty()
}

/// An explicit row projection already invokes the collection's row contracts.
/// Do not visit the same collection again through the implicit owner walk.
pub(super) fn implicit_value_contributions(
    owner: &LinkedEntry,
    part: &LinkedEntry,
    program: &Program,
) -> bool {
    let LinkedType::Record(fields) = &part.value else {
        return false;
    };
    let [field] = fields.as_slice() else {
        return false;
    };
    let Some((target, _, _)) = field.value.as_reference() else {
        return false;
    };
    if !program
        .entries
        .iter()
        .find(|entry| entry.id == target)
        .is_some_and(|entry| {
            matches!(
                entry.value,
                LinkedType::Sequence(_) | LinkedType::Record(_) | LinkedType::Choice(_)
            )
        })
        || !has_contributions(part, program)
    {
        return false;
    }

    let (LinkedType::Record(owner_fields), LinkedType::Record(part_fields)) =
        (&owner.value, &part.value)
    else {
        return false;
    };
    !owner.contributions.iter().any(|contribution| {
        contribution
            .for_each
            .as_ref()
            .and_then(|iteration| collection_path(&iteration.input))
            .is_some_and(|(slot, _)| {
                part_fields
                    .iter()
                    .any(|field| field.name == owner_fields[slot as usize].name)
            })
    })
}

pub(super) fn scalar_xml_projection(entry: &LinkedEntry, program: &Program) -> bool {
    (entry.kind == ModuleKind::Object || !entry.contributions.is_empty())
        && !super::owner::applies(entry, program)
        && matches!(&entry.value, LinkedType::Record(fields) if fields.iter().all(|field| scalar::Codec::resolve(&field.value, entry, program).is_ok_and(|codec| codec.input_method().is_some())))
        && matches!(entry.yaml, YamlRepresentation::Mapping(_))
}

/// A collection contribution may traverse declared record fields before
/// reaching its rows. The indices are linked field slots, not XML/YAML names.
pub(super) fn collection_path(expression: &LinkedExpression) -> Option<(u32, Vec<u32>)> {
    match &expression.kind {
        LinkedExpressionKind::Field(slot) => Some((*slot, Vec::new())),
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Get(slot),
            arguments,
        } if arguments.len() == 1 => {
            let (root, mut path) = collection_path(&arguments[0])?;
            path.push(*slot);
            Some((root, path))
        }
        _ => None,
    }
}

fn scalar_field(
    slot: u32,
    entry: &LinkedEntry,
    program: &Program,
    require_text: bool,
) -> Result<String, Diagnostic> {
    let LinkedType::Record(fields) = &entry.value else {
        return Err(unsupported(entry, "Index field requires a record"));
    };
    let codec = scalar::Codec::resolve(&fields[slot as usize].value, entry, program)?;
    if (require_text && !codec.is_index_text()) || codec.input_method().is_none() {
        return Err(unsupported(
            entry,
            "This index projection requires a text or enumeration field",
        ));
    }
    if super::owner::applies(entry, program) {
        let (part, local) = owners::field(entry, slot, program)?;
        return Ok(format!(
            "part_{}_{part}::fact_{local}(&value.p{part},direction,source,inputs)?",
            entry.id
        ));
    }
    let field = &fields[slot as usize];
    let reference = format!(
        "value.f{slot}.as_ref().ok_or_else(||vec![RuntimeDiagnostic::new(\"fact.unready\",\"Contribution field is unavailable\").field({:?})])?",
        field.name
    );
    Ok(if require_text {
        codec.meaning_reference(&format!("E{}F{slot}", entry.id), &reference)
    } else {
        codec.input_reference(&format!("E{}F{slot}", entry.id), &reference)
    })
}

fn text(
    expression: &LinkedExpression,
    entry: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    match &expression.kind {
        LinkedExpressionKind::Literal(ScalarLiteral::Text(value)) => Ok(format!("{value:?}")),
        LinkedExpressionKind::Input(slot) => {
            Ok(format!("inputs.text({slot}).map_err(|error|vec![error])?"))
        }
        LinkedExpressionKind::Field(slot) => scalar_field(*slot, entry, program, true),
        LinkedExpressionKind::Operation { .. } => computed_text(expression, entry, program),
        _ => Err(unsupported(
            entry,
            "Index projection requires a declared text expression",
        )),
    }
}

fn scalar_condition(
    expression: &LinkedExpression,
    entry: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    match &expression.kind {
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::State(StatePredicate::Present),
            arguments,
        } if matches!(
            arguments.as_slice(),
            [LinkedExpression {
                kind: LinkedExpressionKind::Field(_),
                ..
            }]
        ) =>
        {
            let LinkedExpressionKind::Field(slot) = arguments[0].kind else {
                unreachable!()
            };
            if super::owner::applies(entry, program) {
                let (part, local) = owners::field(entry, slot, program)?;
                Ok(format!(
                    "part_{}_{part}::fact_{local}_present(&value.p{part})",
                    entry.id
                ))
            } else {
                Ok(format!("value.f{slot}.is_some()"))
            }
        }
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::Not,
            arguments,
        } if arguments.len() == 1 => Ok(format!(
            "!({})",
            scalar_condition(&arguments[0], entry, program)?
        )),
        _ => {
            let (constants, lowered) = computed_expression(expression, entry, program)?;
            Ok(format!(
                "{{{constants}let _inputs=inputs;let evaluate=||->std::result::Result<bool,FactErrors>{{Ok({lowered})}};evaluate().map_err(|errors|errors.0)?}}"
            ))
        }
    }
}

fn computed_text(
    expression: &LinkedExpression,
    entry: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    let (constants, lowered) = computed_expression(expression, entry, program)?;
    let lowered = super::expressions::Expressions::text_owned(expression, lowered);
    Ok(format!(
        "&{{{constants}let _inputs=inputs;let evaluate=||->std::result::Result<String,FactErrors>{{Ok({lowered})}};evaluate().map_err(|errors|errors.0)?}}"
    ))
}

fn computed_expression(
    expression: &LinkedExpression,
    entry: &LinkedEntry,
    program: &Program,
) -> Result<(String, String), Diagnostic> {
    fn collect(value: &LinkedExpression, requested: &mut BTreeMap<u32, LinkedExpression>) -> bool {
        match &value.kind {
            LinkedExpressionKind::Field(slot) => {
                requested.insert(*slot, value.clone());
            }
            LinkedExpressionKind::Operation { arguments, .. } => {
                return arguments.iter().all(|value| collect(value, requested));
            }
            LinkedExpressionKind::SelfValue | LinkedExpressionKind::Capture(_) => return false,
            _ => {}
        }
        true
    }
    let LinkedType::Record(fields) = &entry.value else {
        return Err(unsupported(
            entry,
            "Computed contribution requires record storage",
        ));
    };
    let mut requested = BTreeMap::new();
    if !collect(expression, &mut requested) {
        return Err(unsupported(
            entry,
            "Computed contribution requires declared fields and prepared inputs",
        ));
    }
    let mut storage = vec![(String::new(), String::new()); fields.len()];
    for (slot, _value) in requested {
        let present = if super::owner::applies(entry, program) {
            let (part, local) = owners::field(entry, slot, program)?;
            format!(
                "part_{}_{part}::fact_{local}_present(&value.p{part})",
                entry.id
            )
        } else {
            format!("value.f{slot}.is_some()")
        };
        storage[slot as usize] = (scalar_field(slot, entry, program, false)?, present);
    }
    let mut expressions =
        super::expressions::Expressions::new(entry, program, fields, Some(&storage));
    let lowered = expressions.lower(expression)?;
    Ok((expressions.constants, lowered))
}

pub(super) fn stored_record_contributions(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<String, Diagnostic> {
    if effective_contributions(entry, program).is_empty() {
        return Ok(String::new());
    }
    if !super::owner::applies(entry, program) && !scalar_xml_projection(entry, program) {
        return Err(unsupported(
            entry,
            "Item contributions require a supported record storage",
        ));
    }
    let body = contribution_body(entry, program, &[])?;
    Ok(format!(
        "pub(super) fn contribute(value:&Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{let value=&value.0;{body}Ok(())}}"
    ))
}

fn contribution_body(
    entry: &LinkedEntry,
    program: &Program,
    names: &[&str],
) -> Result<String, Diagnostic> {
    let mut out = String::new();
    let id = entry.id;
    let LinkedType::Record(fields) = &entry.value else {
        return Err(unsupported(entry, "Index extraction requires a record"));
    };
    // Scalar accessors may validate a field against captured siblings. The
    // complete lexical frame is required before publishing this record's own
    // facts, as well as before descending into its children.
    if super::owner::applies(entry, program) {
        let composition = program.composition(entry)?;
        let scope = super::value::InputScope::prepare(
            entry,
            &composition.parts,
            &composition.captures,
            program,
        )?;
        out.push_str(&scope.bind(entry.id, "value.", None));
    }
    for (ordinal, contribution) in entry.contributions.iter().enumerate() {
        if super::owner::applies(entry, program)
            && let Some(iteration) = &contribution.for_each
        {
            let Some((field, path)) = collection_path(&iteration.input) else {
                return Err(unsupported(
                    entry,
                    "Owner contribution must iterate a declared field path",
                ));
            };
            let (part, _) = owners::field(entry, field, program)?;
            let missing_allowed = super::presence::denotes_absent(
                entry,
                LinkedPresenceTarget::Field(field),
                crate::plan::RepresentationSide::Xml,
            );
            let unavailable = if missing_allowed { ">1" } else { "!=1" };
            writeln!(out,"if matches!(direction,Direction::XmlToYaml) && value.containers[{part}]{unavailable} {{return Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Contribution owner container is missing or repeated\")]);}}").unwrap();
            let external = owners::external_context(
                contribution,
                entry,
                &program.composition(entry)?.parts[part],
            );
            if path.is_empty() && !external {
                writeln!(out,"part_{id}_{part}::contribute_{ordinal}(&value.p{part},direction,source,inputs,builder)?;").unwrap();
            } else {
                writeln!(out, "let mut context=[None;{}];", fields.len()).unwrap();
                for slot in owners::context_fields(contribution) {
                    let field = &fields[slot as usize];
                    let variant = scalar::Codec::resolve(&field.value, entry, program)?
                        .input_variant()
                        .ok_or_else(|| {
                            unsupported(entry, "Contribution context requires a borrowed scalar")
                        })?;
                    let projected = scalar_field(slot, entry, program, false)?;
                    writeln!(
                        out,
                        "context[{slot}]=Some(core::inputs::InputRef::{variant}({projected}));"
                    )
                    .unwrap();
                }
                writeln!(out,"part_{id}_{part}::contribute_{ordinal}(&value.p{part},&context,direction,source,inputs,builder)?;").unwrap();
            }
            continue;
        }
        let condition = contribution
            .when
            .as_ref()
            .map(|when| scalar_condition(when, entry, program))
            .transpose()?
            .unwrap_or_else(|| "true".into());
        let index = if names.is_empty() {
            format!(
                "fact_id({:?}).expect(\"declared index\")",
                contribution.index
            )
        } else {
            format!(
                "core::facts::prepared::FactId({})",
                names.binary_search(&contribution.index.as_str()).unwrap()
            )
        };
        let key = super::fact_keys::parts(&contribution.key, entry, |value| {
            text(value, entry, program)
        })?
        .join(",");
        let (method, value) = projection(contribution, |value| text(value, entry, program))?;
        writeln!(out,"if {condition} {{builder.{method}({index},&[{key}],{value}).map_err(|error|vec![RuntimeDiagnostic::new(\"fact.budget\",format!(\"{{error:?}}\"))])?;}}").unwrap();
    }
    if super::owner::applies(entry, program) {
        let composition = program.composition(entry)?;
        let nested: Vec<_> = composition
            .parts
            .iter()
            .enumerate()
            .filter(|(_, part)| implicit_value_contributions(entry, part, program))
            .collect();
        if !nested.is_empty() {
            out.push_str("let mut collect=||->std::result::Result<(),FactErrors>{");
            for (part, entry) in nested {
                let function = if collection_has_contributions(entry, program) {
                    "contribute_nested"
                } else {
                    "contribute"
                };
                writeln!(
                    out,
                    "part_{id}_{part}::{function}(&value.p{part},direction,source,inputs,builder)?;"
                )
                .unwrap();
            }
            out.push_str("Ok(())};collect().map_err(|error|error.0)?;");
        }
    }
    Ok(out)
}

/// One explicit support unit shared by value packages and the facade.
pub(super) fn capture_support(code: &str, offset: usize) {
    if !super::shared_capture::active() {
        return;
    }
    let marker = "// end fact support\n";
    let end = code.find(marker).expect("fact support boundary") + marker.len();
    let symbols = ["fact_names", "fact_id", "fact_is_union", "FactErrors"];
    for symbol in symbols {
        super::shared_capture::reference(symbol, symbol.into());
        super::shared_capture::export(symbol);
    }
    super::shared_capture::unit(|| super::shared_units::GeneratedUnit {
        id: super::shared_units::UnitId("fact-support".into()),
        namespace: vec![],
        definitions: symbols
            .into_iter()
            .map(|symbol| super::shared_units::SymbolId(symbol.into()))
            .collect(),
        references: BTreeSet::new(),
        source: code[..end].into(),
        source_kinds: ["fact-support".into()].into(),
        files: vec![],
    });
    super::shared_capture::exclude(offset, offset + end);
}

pub(super) fn generate(
    entries: &[&LinkedEntry],
    fact_entries: &[&LinkedEntry],
    program: &Program,
) -> Result<String, Diagnostic> {
    let indexed: Vec<_> = entries
        .iter()
        .map(|entry| effective_contributions(entry, program))
        .collect();
    let fact_indexed: Vec<_> = fact_entries
        .iter()
        .map(|entry| effective_contributions(entry, program))
        .collect();
    let names: Vec<_> = fact_entries
        .iter()
        .zip(&fact_indexed)
        .flat_map(|(entry, contributions)| {
            contributions
                .iter()
                .map(|value| value.index.as_str())
                .chain(
                    entry
                        .input_indexes
                        .iter()
                        .map(|binding| binding.value.as_str()),
                )
        })
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();
    let input_index_type = |name: &str| {
        fact_entries.iter().find_map(|entry| {
            entry
                .input_indexes
                .iter()
                .find(|binding| binding.value == name)
                .and_then(|binding| entry.inputs.iter().find(|input| input.name == binding.name))
                .map(|input| &input.value)
        })
    };
    let mut out = format!(
        "pub fn fact_names()-> &'static [&'static str] {{ &{names:?} }}\npub fn fact_id(name:&str)->Option<core::facts::prepared::FactId> {{fact_names().iter().position(|candidate|*candidate==name).map(|slot|core::facts::prepared::FactId(slot as u32))}}\n"
    );
    let union_ids: Vec<_> = names
        .iter()
        .enumerate()
        .filter_map(|(slot, name)| {
            let produced_union = fact_indexed
                .iter()
                .flatten()
                .find(|contribution| {
                    contribution.index == *name && !contribution.write.is_reservation()
                })
                .map(|contribution| contribution.union_reference_prefix.is_some())
                .unwrap_or(false);
            (produced_union
                || input_index_type(name).is_some_and(crate::fact_shape::text_union_index))
            .then_some(slot as u32)
        })
        .collect();
    writeln!(out,"pub fn fact_is_union(index:core::facts::prepared::FactId)->bool{{{:?}.contains(&index.0)}}",union_ids).unwrap();
    out.push_str("#[allow(dead_code)] pub(crate) struct FactErrors(pub(crate) Vec<RuntimeDiagnostic>);impl From<RuntimeDiagnostic> for FactErrors {fn from(error:RuntimeDiagnostic)->Self{Self(vec![error])}}impl From<Vec<RuntimeDiagnostic>> for FactErrors {fn from(errors:Vec<RuntimeDiagnostic>)->Self{Self(errors)}}\n");
    out.push_str("// end fact support\n");
    let mut layouts = Vec::new();
    for name in &names {
        let projection = fact_indexed
            .iter()
            .flatten()
            .find(|value| value.index == *name && !value.write.is_reservation());
        let key = projection
            .map(|value| &value.key.value_type)
            .or_else(|| match input_index_type(name)? {
                LinkedType::Index { key, .. } => Some(key.as_ref()),
                _ => None,
            })
            .expect("linked index shape");
        let columns = crate::fact_shape::columns(key).expect("linked index key shape");
        let union = projection.is_some_and(|value| value.union_reference_prefix.is_some())
            || input_index_type(name).is_some_and(crate::fact_shape::text_union_index);
        let coalesce = projection.is_some_and(|value| value.coalesce_equal);
        let allocation = fact_indexed
            .iter()
            .flatten()
            .filter(|value| value.index == *name)
            .find_map(|value| value.write.allocation());
        layouts.push(if let Some(allocation)=allocation {
            let scope=allocation.scope.iter().map(|name|columns.iter().position(|column|*column==name).expect("linked scope")).collect::<Vec<_>>();
            format!("core::facts::prepared::text_number_index(generation,{columns:?},{scope:?},{coalesce})")
        } else if union {
            let prefix = projection.and_then(|value| value.union_reference_prefix.as_deref()).unwrap_or("");
            format!("core::facts::prepared::text_union_index(generation,{prefix:?},core::facts::graph::GraphBudget{{nodes:budget.rows.saturating_mul(2),edges:budget.rows,members:budget.rows.saturating_mul(16)}})")
        } else if columns.is_empty() {
            format!("core::facts::prepared::text_scalar_index_with_coalescing(generation,{coalesce})")
        } else {
            format!("core::facts::prepared::text_record_index_with_coalescing(generation,{columns:?},{coalesce})")
        });
    }
    writeln!(out,"pub fn fact_builder(generation:core::facts::Generation,budget:core::facts::prepared::FactBudget)->core::facts::prepared::TextFactsBuilder {{core::facts::prepared::TextFactsBuilder::with_indexes(generation,vec![{}],budget)}}",layouts.join(",")).unwrap();
    out.push_str("pub fn contribution_indexes(entry:EntryId)-> &'static [core::facts::prepared::FactId] {match entry.0 {\n");
    for (entry, contributions) in fact_entries.iter().zip(&fact_indexed) {
        let ids: BTreeSet<_> = contributions
            .iter()
            .map(|value| names.binary_search(&value.index.as_str()).unwrap())
            .collect();
        writeln!(
            out,
            "{}=>&[{}],",
            entry.id,
            ids.iter()
                .map(|id| format!("core::facts::prepared::FactId({id})"))
                .collect::<Vec<_>>()
                .join(",")
        )
        .unwrap();
    }
    out.push_str("_=>&[]}}\n");
    let reservations = reservations::generate(entries, fact_entries, program, &names);
    out.push_str(&super::fact_inputs::generate(
        fact_entries,
        &names,
        program,
        !reservations.is_empty(),
    ));
    out.push_str(&reservations);
    let mut source_bindings = "direction.map_or_else(||fact_input_bindings(entry),|direction|fact_source_input_bindings(entry,direction))".to_owned();
    if !reservations.is_empty() {
        source_bindings = format!(
            "if matches!(kind,core::facts::preparation::SourceKind::AttributeReservations{{..}}|core::facts::preparation::SourceKind::AttributeReservationSnapshot{{..}}){{fact_attribute_input_bindings(entry)}}else{{{source_bindings}}}"
        );
    }
    let entry_ids: Vec<_> = fact_entries.iter().map(|entry| entry.id).collect();
    writeln!(out, r#"pub fn fact_plan(sources:&[EntryId],consumers:&[EntryId],edge_budget:usize)->core::Result<core::facts::dependencies::DependencyPlan> {{
        build_fact_plan(sources.iter().map(|entry|(*entry,None,core::facts::preparation::SourceKind::Ordinary)),consumers,edge_budget)
    }}
    pub fn fact_plan_for_sources(sources:&[(EntryId,Direction)],consumers:&[EntryId],edge_budget:usize)->core::Result<core::facts::dependencies::DependencyPlan> {{
        build_fact_plan(sources.iter().map(|(entry,direction)|(*entry,Some(*direction),core::facts::preparation::SourceKind::Ordinary)),consumers,edge_budget)
    }}
    pub fn fact_plan_materials(sources:&[(EntryId,Direction,core::facts::preparation::SourceKind)],consumers:&[EntryId],edge_budget:usize)->core::Result<core::facts::dependencies::DependencyPlan> {{
        build_fact_plan(sources.iter().map(|(entry,direction,kind)|(*entry,Some(*direction),*kind)),consumers,edge_budget)
    }}
    fn build_fact_plan(sources:impl ExactSizeIterator<Item=(EntryId,Option<Direction>,core::facts::preparation::SourceKind)>,consumers:&[EntryId],edge_budget:usize)->core::Result<core::facts::dependencies::DependencyPlan> {{
        let source_count=sources.len();
        let count=source_count.checked_add(fact_names().len()).and_then(|count|count.checked_add(consumers.len())).filter(|count|u32::try_from(*count).is_ok()).ok_or_else(||RuntimeDiagnostic::new("fact.plan-budget","Too many preparation steps"))?;
        let mut dependencies=vec![Vec::new();count];
        let mut edges=0usize;
        for (slot,(entry,direction,kind)) in sources.enumerate() {{
            if !{entry_ids:?}.contains(&entry.0) {{return Err(RuntimeDiagnostic::new("entry.unknown","Unknown fact source entry"));}}
            let bindings={source_bindings};
            for (_,index) in bindings {{
                if kind==core::facts::preparation::SourceKind::Snapshot && contribution_indexes(entry).contains(index) {{continue;}}
                if edges==edge_budget {{return Err(RuntimeDiagnostic::new("fact.plan-budget","Too many preparation dependencies"));}}edges+=1;
                dependencies[slot].push(core::facts::dependencies::StepId((source_count+index.0 as usize) as u32));
            }}
            for index in contribution_indexes(entry) {{if edges==edge_budget {{return Err(RuntimeDiagnostic::new("fact.plan-budget","Too many preparation dependencies"));}}edges+=1;dependencies[source_count+index.0 as usize].push(core::facts::dependencies::StepId(slot as u32));}}
        }}
        for (slot,entry) in consumers.iter().enumerate() {{
            if !{entry_ids:?}.contains(&entry.0) {{return Err(RuntimeDiagnostic::new("entry.unknown","Unknown fact consumer entry"));}}
            for (_,index) in fact_input_bindings(*entry) {{
                if edges==edge_budget {{return Err(RuntimeDiagnostic::new("fact.plan-budget","Too many preparation dependencies"));}}edges+=1;
                dependencies[source_count+fact_names().len()+slot].push(core::facts::dependencies::StepId((source_count+index.0 as usize) as u32));
            }}
        }}
        core::facts::dependencies::DependencyPlan::new(dependencies,edge_budget).map_err(|error|RuntimeDiagnostic::new("fact.plan",format!("{{error:?}}")))
    }}"#).unwrap();
    let mut snapshot_sources = Vec::new();
    for (entry, _) in entries
        .iter()
        .zip(&indexed)
        .filter(|(_, contributions)| !contributions.is_empty())
    {
        if !super::owner::applies(entry, program)
            && let Some(projection) = collections::generate(entry, program, &names)?
        {
            out.push_str(&projection);
            let plain_sequence = if let LinkedType::Record(fields) = &entry.value
                && let [field] = fields.as_slice()
                && let Some((id, _, _)) = field.value.as_reference()
                && let Some(common) = program.entries.iter().find(|candidate| candidate.id == id)
            {
                crate::link::sequence_item::resolve(common, program)?.is_none()
            } else {
                false
            };
            snapshot_sources.push((
                entry.id,
                format!("read_xml_fact_{}", entry.id),
                format!("read_yaml_fact_{}", entry.id),
                plain_sequence,
            ));
            continue;
        }
        // Other generated layouts have distinct storage; never silently project
        // from a flattened record or an unrelated collection representation.
        let LinkedType::Record(fields) = &entry.value else {
            return Err(unsupported(
                entry,
                "Index extraction requires a scalar record",
            ));
        };
        if !super::owner::applies(entry, program) {
            for field in fields {
                scalar::Codec::resolve(&field.value, entry, program)?;
            }
        }
        let id = entry.id;
        // Scalar fact records may be projections of a larger XML document.
        // Ignore unrelated paths only while extracting facts; normal conversion
        // still uses the strict reader and reports them as anomalies.
        let owner_projection = super::owner::applies(entry, program)
            .then(|| owners::xml_projection(entry, program))
            .flatten();
        let read_xml = if let Some(projection) = owner_projection {
            out.push_str(&projection);
            format!("read_xml_fact_{id}")
        } else if scalar_xml_projection(entry, program) {
            format!("read_xml_fact_{id}")
        } else {
            format!("read_xml_{id}")
        };
        let read_yaml = if scalar_xml_projection(entry, program) {
            format!("read_yaml_fact_{id}")
        } else {
            format!("read_yaml_{id}")
        };
        if scalar_xml_projection(entry, program) || super::owner::applies(entry, program) {
            snapshot_sources.push((id, read_xml.clone(), read_yaml.clone(), false));
        }
        let checks = if super::owner::applies(entry, program) {
            format!(
                "if matches!(direction,Direction::YamlToXml) && value.root.is_some() {{let issues=check_yaml_{id}(&value,source,inputs);if issues.iter().any(|issue|issue.severity==Severity::Error) {{return Err(issues);}}}}"
            )
        } else {
            format!(
                "let issues=match direction {{Direction::XmlToYaml=>issues_xml_{id}(&value,source,inputs),Direction::YamlToXml=>issues_yaml_{id}(&value,source,inputs)}};if issues.iter().any(|issue|issue.severity==Severity::Error) {{return Err(issues);}}"
            )
        };
        writeln!(out,"fn contribute_{id}(direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>> {{let value=match direction {{Direction::XmlToYaml=>{read_xml}(source,inputs),Direction::YamlToXml=>{read_yaml}(source,inputs)}}.map_err(|error|vec![error])?;{checks}").unwrap();
        out.push_str(&contribution_body(entry, program, &names)?);
        out.push_str("Ok(())}\n");
    }
    out.push_str("pub fn contribute_file(entry:EntryId,direction:Direction,source:&[u8],inputs:&PreparedInputs,builder:&mut core::facts::prepared::TextFactsBuilder)->Vec<RuntimeDiagnostic> {let _=(direction,source);let result=inputs.check_entry(entry).map_err(|error|vec![error]).and_then(|()|match entry.0 {\n");
    for (entry, contributions) in entries.iter().zip(&indexed) {
        if contributions.is_empty() {
            writeln!(out, "{}=>Ok(()),", entry.id).unwrap();
        } else {
            writeln!(
                out,
                "{}=>contribute_{}(direction,source,&inputs.view(),builder),",
                entry.id, entry.id
            )
            .unwrap();
        }
    }
    out.push_str("_=>Err(vec![RuntimeDiagnostic::new(\"entry.unknown\",\"Unknown generated entry\")])});finish_contribution(entry,result,builder)}\nfn finish_contribution(entry:EntryId,result:std::result::Result<(),Vec<RuntimeDiagnostic>>,builder:&mut core::facts::prepared::TextFactsBuilder)->Vec<RuntimeDiagnostic>{match result {Ok(())=>Vec::new(),Err(errors)=>{for index in contribution_indexes(entry) {let _=builder.mark_unready(*index);}errors}}}\n");
    // A composed object may provide a shortened XML-only snapshot without
    // contributing an index of its own. It still needs the same materialization
    // path when a new owner is created from YAML.
    for entry in entries {
        if entry.kind == ModuleKind::Object
            && matches!(entry.value, LinkedType::Record(_))
            && !snapshot_sources.iter().any(|(id, _, _, _)| *id == entry.id)
        {
            if !super::owner::applies(entry, program)
                && let Some(projection) = collections::snapshot(entry, program)?
            {
                out.push_str(&projection);
                snapshot_sources.push((
                    entry.id,
                    format!("read_xml_fact_{}", entry.id),
                    format!("read_yaml_fact_{}", entry.id),
                    true,
                ));
                continue;
            }
            let reader = if scalar_xml_projection(entry, program) {
                format!("read_xml_fact_{}", entry.id)
            } else {
                format!("read_xml_{}", entry.id)
            };
            let yaml_reader = if scalar_xml_projection(entry, program) {
                format!("read_yaml_fact_{}", entry.id)
            } else {
                format!("read_yaml_{}", entry.id)
            };
            snapshot_sources.push((entry.id, reader, yaml_reader, false));
        }
    }
    if snapshot_sources.is_empty() {
        out.push_str("pub fn contribute_snapshot_file(entry:EntryId,source:&[u8],inputs:&PreparedInputs,builder:&mut core::facts::prepared::TextFactsBuilder)->Vec<RuntimeDiagnostic>{let _=(source,inputs);finish_contribution(entry,Err(vec![RuntimeDiagnostic::new(\"fact.snapshot\",\"Catalog does not support retained sources\")]),builder)}\n");
        out.push_str("pub fn snapshot_fact_source(entry:EntryId,source:&[u8],inputs:&PreparedInputs)->core::Result<Vec<u8>> {let _=source;inputs.check_entry(entry)?;Err(RuntimeDiagnostic::new(\"fact.snapshot\",\"Source does not have a supported fact snapshot\"))}\n");
        out.push_str("pub fn materialize_fact_source(entry:EntryId,source:&[u8],inputs:&PreparedInputs)->core::Result<Vec<u8>> {let _=source;inputs.check_entry(entry)?;Err(RuntimeDiagnostic::new(\"fact.snapshot\",\"Source does not have a supported fact snapshot\"))}\n");
    } else {
        out.push_str(&snapshots::inputs(entries, program, &names));
        out.push_str("pub fn contribute_snapshot_file(entry:EntryId,source:&[u8],inputs:&PreparedInputs,builder:&mut core::facts::prepared::TextFactsBuilder)->Vec<RuntimeDiagnostic>{let (direction,source)=match core::facts::retained::xml_payload(source){Some(xml)=>(Direction::XmlToYaml,xml),None=>(Direction::YamlToXml,source)};let _=(direction,source);let result=inputs.check_entry(entry).and_then(|()|with_fact_snapshot_inputs(entry,&inputs.view(),|_scope|Ok(match entry.0 {\n");
        for (entry, contributions) in entries.iter().zip(&indexed) {
            let action = if contributions.is_empty() {
                "Ok(())".to_owned()
            } else {
                format!("contribute_{}(direction,source,_scope,builder)", entry.id)
            };
            writeln!(out, "{}=>{action},", entry.id).unwrap();
        }
        out.push_str("_=>Err(vec![RuntimeDiagnostic::new(\"entry.unknown\",\"Unknown retained source entry\")])}))).unwrap_or_else(|error|Err(vec![error]));finish_contribution(entry,result,builder)}\n");
        out.push_str("pub fn snapshot_fact_source(entry:EntryId,source:&[u8],inputs:&PreparedInputs)->core::Result<Vec<u8>> {inputs.check_entry(entry)?;let view=inputs.view();match entry.0 {\n");
        for (id, read_xml, read_yaml, _) in &snapshot_sources {
            let write = snapshots::write(
                *id,
                entries,
                program,
                read_yaml,
                format!(
                    "with_fact_snapshot_inputs(entry,&view,|inputs|write_yaml_{id}(&value,inputs))"
                ),
            );
            writeln!(
                out,
                "{id}=>{{let value={read_xml}(source,&view)?;{write}}},"
            )
            .unwrap();
        }
        out.push_str("_=>Err(RuntimeDiagnostic::new(\"fact.snapshot\",\"Source does not have a supported fact snapshot\"))}}\n");
        out.push_str("pub fn materialize_fact_source(entry:EntryId,source:&[u8],inputs:&PreparedInputs)->core::Result<Vec<u8>> {inputs.check_entry(entry)?;let view=inputs.view();match entry.0 {\n");
        for (id, read_xml, read_yaml, sequence) in &snapshot_sources {
            let write = if *sequence {
                format!("prepare_yaml_{id}(&value,&view,false)")
            } else {
                format!("write_yaml_{id}(&value,&view)")
            };
            let write = snapshots::write(
                *id,
                entries,
                program,
                read_yaml,
                format!("with_fact_snapshot_inputs(entry,&view,|view|{{let view=*view;{write}}})"),
            );
            writeln!(
                out,
                "{id}=>{{let value=if let Some(xml)=core::facts::retained::xml_payload(source){{{read_xml}(xml,&view)?}}else{{match {read_yaml}(source,&view){{Ok(value)=>value,Err(error) if error.code.as_deref()==Some(\"yaml.implicit-value\")=>with_fact_snapshot_inputs(entry,&view,|inputs|{read_yaml}(source,inputs))?,Err(error)=>return Err(error)}}}};{write}}},"
            )
            .unwrap();
        }
        out.push_str("_=>Err(RuntimeDiagnostic::new(\"fact.snapshot\",\"Source does not have a supported fact snapshot\"))}}\n");
    }
    Ok(out)
}

/// One write contract shared by scalar, collection and nested-row projections.
pub(super) fn projection(
    contribution: &LinkedContribution,
    lower: impl FnOnce(&LinkedExpression) -> Result<String, Diagnostic>,
) -> Result<(&'static str, String), Diagnostic> {
    match &contribution.write {
        nkdk_rule_model::IndexWrite::Value(value) => Ok(("push_parts", lower(value)?)),
        nkdk_rule_model::IndexWrite::Reserve(value) => Ok(("reserve_number", lower(value)?)),
        nkdk_rule_model::IndexWrite::Allocate(allocation) => {
            if allocation.phase == 0 {
                Ok(("request_number", allocation.first.to_string()))
            } else {
                Ok((
                    "request_number_in_phase",
                    format!("{},{}", allocation.first, allocation.phase),
                ))
            }
        }
    }
}
