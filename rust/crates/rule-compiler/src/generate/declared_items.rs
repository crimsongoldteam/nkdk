//! Compose a collection with the complete compiled declaration of each item.
use super::*;

fn singleton_mapping_prefix(root: bool, tag: Option<&str>, empty: bool) -> String {
    let mut code = String::new();
    if !root && (empty || tag.is_some()) {
        code.push_str("out.push(' ');");
    }
    if let Some(tag) = tag {
        code.push_str(&format!("out.push_str({tag:?});"));
        if empty {
            code.push_str("out.push(' ');");
        }
    }
    if !empty && (!root || tag.is_some()) {
        code.push_str("out.push('\\n');");
    }
    code
}

fn mapping_input_slot(
    entry: &LinkedEntry,
    common: &LinkedEntry,
    bindings: &[LinkedBinding],
    input: &str,
) -> Result<usize, Diagnostic> {
    let source = common
        .inputs
        .iter()
        .position(|field| field.name == input)
        .ok_or_else(|| {
            unsupported(
                entry,
                &format!(
                    "Record mapping input {input} is not declared by {}",
                    common.name
                ),
            )
        })?;
    let slot = if let Some(binding) = bindings
        .iter()
        .find(|binding| binding.slot == source as u32)
    {
        let LinkedExpressionKind::Input(slot) = &binding.value.kind else {
            return Err(unsupported(
                entry,
                "Record mapping input requires a direct owner input binding",
            ));
        };
        *slot as usize
    } else if bindings.is_empty() {
        entry
            .inputs
            .iter()
            .position(|field| field.name == input)
            .ok_or_else(|| unsupported(entry, "Record mapping input is not bound by its owner"))?
    } else {
        return Err(unsupported(
            entry,
            "Record mapping input binding is missing",
        ));
    };
    if slot >= entry.inputs.len() {
        return Err(unsupported(
            entry,
            "Record mapping input binding is out of range",
        ));
    }
    Ok(slot)
}

fn text_sequence_slot(
    entry: &LinkedEntry,
    common: &LinkedEntry,
    bindings: &[LinkedBinding],
    input: &str,
) -> Result<usize, Diagnostic> {
    let slot = mapping_input_slot(entry, common, bindings, input)?;
    if !matches!(&entry.inputs[slot].value, LinkedType::Sequence(item) if **item == LinkedType::Scalar(ScalarType::Text))
    {
        return Err(unsupported(
            entry,
            "Record mapping input must be a text sequence",
        ));
    }
    Ok(slot)
}

#[derive(Clone, Copy)]
struct RecordKeyTableSlots {
    input: usize,
    internal: usize,
    external: usize,
    empty: Option<usize>,
}

fn record_key_table(
    entry: &LinkedEntry,
    source: &LinkedEntry,
    bindings: &[LinkedBinding],
    yaml: &YamlRepresentation,
) -> Result<Option<RecordKeyTableSlots>, Diagnostic> {
    let YamlRepresentation::RecordMapping {
        key_table: Some(table),
        ..
    } = yaml
    else {
        return Ok(None);
    };
    let slot = mapping_input_slot(entry, source, bindings, &table.input)?;
    let LinkedType::Sequence(item) = &entry.inputs[slot].value else {
        return Err(unsupported(
            entry,
            "Record mapping key table is not a sequence",
        ));
    };
    let LinkedType::Record(fields) = item.as_ref() else {
        return Err(unsupported(
            entry,
            "Record mapping key table item is not a record",
        ));
    };
    let field = |name: &str| {
        fields
            .iter()
            .position(|field| field.name == name)
            .ok_or_else(|| unsupported(entry, "Record mapping key table field is absent"))
    };
    Ok(Some(RecordKeyTableSlots {
        input: slot,
        internal: field(&table.internal)?,
        external: field(&table.external)?,
        empty: table.empty.as_deref().map(field).transpose()?,
    }))
}

fn literal_key_table(
    entry: &LinkedEntry,
    common: &LinkedEntry,
    bindings: &[LinkedBinding],
) -> Result<Option<Vec<(String, String)>>, Diagnostic> {
    let YamlRepresentation::RecordMapping {
        key_table: Some(table),
        ..
    } = &common.yaml
    else {
        return Ok(None);
    };
    let slot = common
        .inputs
        .iter()
        .position(|input| input.name == table.input)
        .expect("linked table input");
    let Some(binding) = bindings.iter().find(|binding| binding.slot == slot as u32) else {
        return Ok(None);
    };
    if matches!(binding.value.kind, LinkedExpressionKind::Input(_)) {
        return Ok(None);
    }
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Sequence,
        arguments: rows,
    } = &binding.value.kind
    else {
        return Err(unsupported(
            entry,
            "Key table binding must be an owner input or a literal record sequence",
        ));
    };
    if table.empty.is_some() {
        return Err(unsupported(
            entry,
            "Literal key table empty markers are not supported",
        ));
    }
    let mut result = Vec::new();
    let mut internal = BTreeSet::new();
    let mut external = BTreeSet::new();
    for row in rows {
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Record(names),
            arguments,
        } = &row.kind
        else {
            return Err(unsupported(entry, "Key table row must be a literal record"));
        };
        let text = |field: &str| -> Result<String, Diagnostic> {
            let index = names
                .iter()
                .position(|name| name == field)
                .ok_or_else(|| unsupported(entry, "Key table column is missing"))?;
            let LinkedExpressionKind::Literal(ScalarLiteral::Text(text)) = &arguments[index].kind
            else {
                return Err(unsupported(entry, "Key table column must be literal text"));
            };
            Ok(text.clone())
        };
        let pair = (text(&table.internal)?, text(&table.external)?);
        if !internal.insert(pair.0.clone()) || !external.insert(pair.1.clone()) {
            return Err(unsupported(entry, "Ambiguous literal key table"));
        }
        result.push(pair);
    }
    Ok(Some(result))
}

pub(super) fn applies(entry: &LinkedEntry, program: &Program) -> bool {
    let LinkedType::Record(fields) = &entry.value else {
        return false;
    };
    if matches!(&entry.xml, LinkedXml::Record(fields) if fields.iter().any(|field| field.file.is_some()))
    {
        return false;
    }
    fields.len()==1 && fields[0].value.as_reference().and_then(|(id,_,_)|program.entries.iter().find(|item|item.id==id)).is_some_and(|item| {
        let declared = matches!(&item.yaml,YamlRepresentation::Sequence{item,..} if **item==YamlRepresentation::Declared) || matches!(&item.yaml,YamlRepresentation::RecordMapping{..});
        let record_item = matches!(&item.value, LinkedType::Sequence(value) if value.as_reference().and_then(|(id,_,_)|program.entries.iter().find(|entry| entry.id==id)).is_some_and(|entry|(matches!(entry.value,LinkedType::Record(_)) && crate::plan::xml_fields(&entry.xml).is_some() || crate::link::sequence_item::record_choice(entry,program))));
        declared && record_item
    })
}

/// Every declared row can contain an unprojectable data anomaly. Preserve it
/// at its own occurrence without discarding normal siblings.
pub(super) fn needs_row_boundary(entry: &LinkedEntry, program: &Program) -> bool {
    applies(entry, program)
}

pub(super) fn generate(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Option<String>, Diagnostic> {
    generate_at(entry, program, false)
}
pub(super) fn generate_at(
    entry: &LinkedEntry,
    program: &Program,
    shared: bool,
) -> Result<Option<String>, Diagnostic> {
    if !applies(entry, program) {
        return Ok(None);
    }
    let mut shape = entry.clone();
    shape.presence.clear();
    plain_shape(&shape)?;
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!()
    };
    let (target, bindings, arguments) = fields[0].value.as_reference().unwrap();
    let source_common = program
        .entries
        .iter()
        .find(|item| item.id == target)
        .unwrap();
    let mut common = source_common.clone();
    crate::link::sequence_item::instantiate(&mut common, bindings, arguments)?;
    let mut row = crate::link::sequence_item::resolve(&common, program)?.expect("referenced item");
    let choice_row = matches!(row.value, LinkedType::Choice(_)).then(|| row.clone());
    if let Some(choice) = &choice_row {
        row = super::choice_items::prototype(choice, program)?;
    }
    // The row itself is rebound by resolve(), but scalar profiles referenced by
    // its fields were specialized earlier, while the row still had its own
    // input slots. Rebind those profiles in a local plan for this collection.
    let row_bindings = match &common.value {
        LinkedType::Sequence(item) => item.as_reference().map(|(_, bindings, _)| bindings),
        _ => None,
    };
    let mut scoped_program = row_bindings
        .map(|bindings| super::scoped_inputs::rebind(&row, bindings, program))
        .transpose()?
        .flatten();
    let row_input_base = entry.inputs.len() as u32;
    if let Some(scoped) = &mut scoped_program {
        for candidate in &mut scoped.entries {
            if candidate.input_scope == Some(row.id) {
                crate::plan::scopes::materialize_row_inputs(candidate, row_input_base);
            }
        }
    }
    let scoped_plan = super::scoped_inputs::plan(scoped_program.as_ref())?;
    let row_program = scoped_plan.as_ref().unwrap_or(program);
    // Bound expressions now address the caller's slots. Captures of the row's
    // own fields must be appended after them, never overwrite those slots.
    let row_input_fields = match &common.yaml {
        YamlRepresentation::RecordMapping { item_inputs, .. } => {
            let original = program
                .entries
                .iter()
                .find(|candidate| candidate.id == row.id)
                .expect("linked row");
            item_inputs
                .iter()
                .map(|item| {
                    original
                        .inputs
                        .iter()
                        .find(|input| input.name == item.target)
                        .expect("validated row input")
                        .clone()
                })
                .collect::<Vec<_>>()
        }
        _ => Vec::new(),
    };
    row.inputs = entry.inputs.clone();
    row.inputs.extend(row_input_fields);
    crate::plan::scopes::materialize_row_inputs(&mut row, row_input_base);
    if [&common, &row]
        .iter()
        .any(|contract| !contract.resources.is_empty())
        || !common.contributions.is_empty()
    {
        return Err(unsupported(
            entry,
            "Collection-local resources or contributions require their own lifecycle",
        ));
    }
    let (
        LinkedXml::Record(xml),
        LinkedXml::ElementSequence {
            path: relative,
            item,
            next,
        },
        yaml,
    ) = (&entry.xml, attributes::content(&common.xml).0, &common.yaml)
    else {
        return Err(unsupported(
            entry,
            "Declared item collection requires record routes and an element sequence",
        ));
    };
    let singleton = matches!(
        common.yaml,
        YamlRepresentation::Sequence {
            singleton: Some(_),
            ..
        }
    );
    let singleton_value = matches!(
        common.yaml,
        YamlRepresentation::Sequence {
            singleton: Some(nkdk_rule_model::YamlSingleton::Value),
            ..
        }
    );
    let singleton_sequence = if singleton_value {
        super::choice_value::singleton_sequence(&row, row_program)?
    } else {
        "false".into()
    };
    let item_tag = match &common.yaml {
        YamlRepresentation::Sequence {
            item_tag: Some(tag),
            ..
        } => Some(format!("!{tag}")),
        _ => None,
    };
    let max_items = match &common.yaml {
        YamlRepresentation::RecordMapping { max_items, .. } => max_items.unwrap_or(usize::MAX),
        _ => usize::MAX,
    };
    let empty_row_null = matches!(
        &common.yaml,
        YamlRepresentation::RecordMapping {
            empty_row_null: true,
            ..
        }
    );
    let projected_item = matches!(row.yaml, YamlRepresentation::Projection(_));
    let (key, root_yaml, hidden) = match &entry.yaml {
        YamlRepresentation::Mapping(fields) => match fields.first() {
            Some(field) => (field.key.as_str(), false, false),
            None => ("", false, true),
        },
        YamlRepresentation::Projection(field) => (field.as_str(), true, false),
        _ => {
            return Err(unsupported(
                entry,
                "Expected a YAML property or whole-field projection",
            ));
        }
    };
    let flat_mapping_item = matches!(&row.value, LinkedType::Record(fields)
        if fields.iter().all(|field| super::scalar::Codec::resolve(&field.value, &row, row_program).is_ok()));
    let structured_scalar_item = matches!(&row.value, LinkedType::Record(fields)
        if fields.iter().any(|field| matches!(super::scalar::Codec::resolve(&field.value, &row, row_program), Ok(super::scalar::Codec::Forms(_) | super::scalar::Codec::Pattern(_)))));
    let compact_mapping_item = !root_yaml
        && matches!(row.yaml, YamlRepresentation::Mapping(_))
        && !super::value_record::is_recursive(&row.name)
        && flat_mapping_item
        && (row.constraints.is_empty() || structured_scalar_item);
    let compact_item = projected_item || compact_mapping_item;
    if **item != LinkedXml::Declared
        || matches!(yaml, YamlRepresentation::Sequence { shorthand, .. } if !shorthand.is_empty())
        || !common.shorthands.is_empty()
        || common.normalization.is_some()
    {
        return Err(unsupported(
            entry,
            "This collection contract requires an additional sequence expression backend",
        ));
    }
    // A projected collection may exist only in the semantic value and be
    // reconstructed from sibling XML collections. Give its generated item
    // backend an unreachable boundary; the parent adapter suppresses XML
    // emission for a field without an XML route.
    let semantic_only = xml.is_empty()
        || matches!(xml.as_slice(), [field] if field.path.last().is_some_and(|name| name.local == "__declarative_virtual__"));
    let virtual_parent = vec![ExpandedName {
        namespace: String::new(),
        local: "__declarative_semantic__".into(),
    }];
    let virtual_relative = vec![ExpandedName {
        namespace: String::new(),
        local: "__declarative_item__".into(),
    }];
    let parent = if semantic_only {
        virtual_parent.as_slice()
    } else {
        xml[0].path.as_slice()
    };
    let relative = if semantic_only {
        virtual_relative.as_slice()
    } else {
        relative.as_slice()
    };
    // An empty relative route denotes repeated occurrences of the property's
    // own element. Split its placement into container and item boundaries.
    let (parent, relative) = if !semantic_only && relative.is_empty() && !parent.is_empty() {
        (&parent[..parent.len() - 1], &parent[parent.len() - 1..])
    } else {
        (parent, relative)
    };
    if !semantic_only && (relative.is_empty() || parent.is_empty() || xml[0].attribute.is_some()) {
        return Err(unsupported(
            entry,
            "Declared items require an explicit element boundary",
        ));
    }
    if !semantic_only
        && matches!(attributes::content(&common.xml).0,LinkedXml::ElementSequence{path,..} if path.is_empty())
        && !attributes::content(&common.xml).1.is_empty()
    {
        return Err(unsupported(
            entry,
            "Unwrapped collections cannot attach attributes to a container",
        ));
    }
    let common_attributes = attributes::content(&common.xml).1;
    if let Some(next) = next
        && (shared
            || next.len() != 1
            || relative.len() < 2
            || relative.first() == next.first()
            || parent.is_empty())
    {
        return Err(unsupported(
            entry,
            "A linear sequence needs distinct item and next-node routes",
        ));
    }
    if common_attributes
        .iter()
        .any(|attribute| attribute.when.is_some())
    {
        return Err(unsupported(
            entry,
            "Conditional collection attributes require value expression support",
        ));
    }
    let attribute_values: Vec<_> = common_attributes
        .iter()
        .map(|value| (*value).clone())
        .collect();
    let headers = attributes::static_attributes(&attribute_values);
    let mut namespaces = BTreeSet::new();
    for attribute in &common_attributes {
        namespaces.insert(attribute.name.namespace.clone());
        if let LinkedXmlAttributeValue::QName(name) = &attribute.value {
            namespaces.insert(name.namespace.clone());
        }
    }
    let namespace_code = namespaces
        .iter()
        .filter(|name| !name.is_empty())
        .map(|name| format!("if !names.contains(&{name:?}){{names.push({name:?});}}"))
        .collect::<String>();
    let mut route = parent.to_vec();
    route.extend(relative.iter().cloned());
    crate::plan::routes::place_record(&mut row, &route)?;
    row.id = entry.id;
    let LinkedType::Record(row_fields) = &row.value else {
        return Err(unsupported(&row, "The item requires a record value"));
    };
    let lifted = if let YamlRepresentation::RecordMapping { key, value, .. } = &common.yaml {
        let index = row_fields
            .iter()
            .position(|field| &field.name == key)
            .expect("validated key");
        let YamlRepresentation::Mapping(fields) = &row.yaml else {
            return Err(unsupported(
                &row,
                "Record mapping needs a record YAML representation",
            ));
        };
        let value_key = value.as_ref().map(|value| {
            fields
                .iter()
                .find(|field| &field.field == value)
                .expect("validated YAML value")
                .key
                .clone()
        });
        Some((
            index,
            fields
                .iter()
                .find(|field| &field.field == key)
                .expect("validated YAML key")
                .key
                .clone(),
            value_key,
        ))
    } else {
        None
    };
    let grouping = if let YamlRepresentation::RecordMapping {
        group_key: Some(group),
        value: Some(value),
        ..
    } = &common.yaml
    {
        let YamlRepresentation::Mapping(fields) = &row.yaml else {
            return Err(unsupported(&row, "Grouped row requires YAML fields"));
        };
        Some((
            fields
                .iter()
                .find(|field| &field.field == group)
                .expect("linked group key")
                .key
                .clone(),
            fields
                .iter()
                .find(|field| &field.field == value)
                .expect("linked grouped value")
                .key
                .clone(),
        ))
    } else {
        None
    };
    let lifted_physical = if let (
        Some((_, _, Some(_))),
        YamlRepresentation::RecordMapping {
            value: Some(value), ..
        },
        LinkedXml::Record(xml_fields),
    ) = (&lifted, &common.yaml, attributes::content(&row.xml).0)
    {
        xml_fields
            .iter()
            .find(|field| &field.field == value)
            .and_then(|field| {
                field
                    .attribute
                    .as_ref()
                    .or_else(|| field.path.last())
                    .or_else(|| route.last())
            })
            .map(|name| name.local.as_str())
    } else {
        None
    };
    let (omit_empty_slot, empty_tag) = match &common.yaml {
        YamlRepresentation::RecordMapping {
            omit_empty_for: Some(input),
            empty_tag: Some(tag),
            ..
        } => {
            let slot = text_sequence_slot(entry, source_common, bindings, input)?;
            (format!("Some({slot})"), format!("Some({tag:?})"))
        }
        _ => ("None::<usize>".into(), "None::<&str>".into()),
    };
    let static_key_table = literal_key_table(entry, source_common, bindings)?;
    let static_pairs = static_key_table.as_ref().map(|rows| {
        format!(
            "({{const PAIRS:&[(&str,&str)]=&[{}];PAIRS}})",
            rows.iter()
                .map(|(internal, external)| format!("({internal:?},{external:?})"))
                .collect::<Vec<_>>()
                .join(",")
        )
    });
    let dynamic_key_table = if static_pairs.is_some() {
        None
    } else {
        record_key_table(entry, source_common, bindings, &common.yaml)?
    };
    let key_mapper = if let Some(pairs) = &static_pairs {
        format!(
            "let projected=core::yaml::key_table_to_yaml(key,{pairs}.iter().copied().map(Ok))?;let annotation=projected.annotation;let key=projected.text.as_str();"
        )
    } else if let Some(RecordKeyTableSlots {
        input: slot,
        internal,
        external,
        empty,
    }) = dynamic_key_table
    {
        let empty = empty.map_or("false".into(), |empty| {
            format!("row.text({empty})?==\"null\"")
        });
        format!(
            "let mut empty_form=false;for row in inputs.records({slot})?{{if row.text({internal})?==key{{empty_form={empty};}}}}let projected=core::yaml::key_table_to_yaml(key,inputs.records({slot})?.iter().map(|row|Ok((row.text({internal})?,row.text({external})?))))?;let annotation=projected.annotation;let key=projected.text.as_str();"
        )
    } else {
        lifted
            .as_ref()
            .and_then(|(index, _, _)| {
                let LinkedType::Reference(id) = &row_fields[*index].value else {
                    return None;
                };
                program
                    .entries
                    .iter()
                    .find(|entry| entry.id == *id)
                    .and_then(|entry| {
                        let YamlRepresentation::TextTable(TextTable::Resolved(table)) = &entry.yaml
                        else {
                            return None;
                        };
                        Some(
                            table
                                .iter()
                                .map(|item| format!("{:?}=>{:?},", item.value, item.text))
                                .collect::<String>(),
                        )
                    })
            })
            .map_or("let annotation=None::<&str>;".into(), |arms| {
                format!("let key=match key{{{arms}value=>value}};let annotation=None::<&str>;")
            })
    };
    let key_reader = if let Some(pairs) = &static_pairs {
        format!(
            "|key:String,tag:Option<&str>|core::yaml::key_table_to_xml(&key,tag,{pairs}.iter().copied().map(Ok))"
        )
    } else {
        dynamic_key_table.map_or("|key:String,tag:Option<&str>|if tag.is_none(){Ok(key)}else{Err(RuntimeDiagnostic::new(\"yaml.annotation\",\"Unexpected mapping key annotation\"))}".into(), |table| {
        let RecordKeyTableSlots {
            input: slot,
            internal,
            external,
            ..
        } = table;
        format!("|key:String,tag:Option<&str>|core::yaml::key_table_to_xml(&key,tag,inputs.records({slot})?.iter().map(|row|Ok((row.text({internal})?,row.text({external})?))))")
    })
    };
    let absent_null_row = row.presence.iter().any(|rule| {
        matches!(rule.target, LinkedPresenceTarget::SelfValue)
            && rule.yaml_empty.iter().any(|form| {
                form.form == EmptyKind::Null
                    && matches!(form.denotes.kind, LinkedExpressionKind::Absent)
            })
    });
    let null_reader = dynamic_key_table.map_or(
        if empty_row_null { "|_|Ok(true)" } else { "|_|Ok(false)" }.into(),
        |table| {
        let RecordKeyTableSlots {
            input: slot,
            internal,
            empty,
            ..
        } = table;
        empty.map_or("|_|Ok(false)".into(), |empty| format!("|key|{{for row in inputs.records({slot})?{{if row.text({internal})?==key{{return Ok(row.text({empty})?==\"null\");}}}}Ok(false)}}"))
        },
    );
    let body = if let Some(choice) = &choice_row {
        super::choice_items::generate(entry, &row, choice, row_program, &route, lifted.as_ref())?
    } else {
        super::value_record::generate_bound(
            &row,
            row_program,
            &route,
            lifted.as_ref().map(|(index, key, value)| {
                (
                    *index,
                    key.clone(),
                    if grouping.is_some() {
                        None
                    } else {
                        value.clone()
                    },
                )
            }),
            row_bindings,
        )?
    };
    let mut presence = collection_presence::override_for(&common, entry, bindings, arguments)?
        .unwrap_or(common.clone());
    presence.value = LinkedType::Sequence(Box::new(row.value.clone()));
    let omits_empty_yaml = |rule: &LinkedPresence| {
        rule.target == LinkedPresenceTarget::SelfValue
            && rule.yaml_omit_when.as_ref().is_some_and(|condition| {
                matches!(
                    &condition.kind,
                    LinkedExpressionKind::Operation {
                        operator: LinkedOperator::Equal,
                        arguments,
                    } if arguments.len() == 2
                        && matches!(arguments[0].kind, LinkedExpressionKind::SelfValue)
                        && matches!(&arguments[1].kind,
                            LinkedExpressionKind::Operation {
                                operator: LinkedOperator::Sequence,
                                arguments,
                            } if arguments.is_empty())
                ) || matches!(
                    &condition.kind,
                    LinkedExpressionKind::Operation {
                        operator: LinkedOperator::Not,
                        arguments,
                    } if arguments.len() == 1 && matches!(
                        &arguments[0].kind,
                        LinkedExpressionKind::Operation {
                            operator: LinkedOperator::Exists(_),
                            arguments: exists,
                        } if exists.len() == 2
                            && matches!(exists[0].kind, LinkedExpressionKind::SelfValue)
                            && matches!(exists[1].kind, LinkedExpressionKind::Literal(ScalarLiteral::Boolean(true)))
                    )
                )
            })
    };
    let omit_empty_yaml = presence.presence.iter().any(omits_empty_yaml);
    let nil_xml = presence.presence.iter().any(|rule| {
        rule.target == LinkedPresenceTarget::SelfValue
            && rule
                .xml_empty
                .iter()
                .any(|form| form.form == EmptyKind::Nil)
    });
    let null_yaml = presence.presence.iter().any(|rule| {
        rule.target == LinkedPresenceTarget::SelfValue
            && rule
                .yaml_empty
                .iter()
                .any(|form| form.form == EmptyKind::Null)
    });
    if nil_xml != null_yaml {
        return Err(unsupported(
            entry,
            "Nullable collection requires both XML nil and YAML null",
        ));
    }
    let nullable = nil_xml;
    if presence.presence.iter().any(|rule| {
        rule.yaml_omit_when.is_some() && !omits_empty_yaml(rule) && rule.yaml_missing.is_none()
    }) {
        return Err(unsupported(
            entry,
            "Collection omission requires an inverse YAML missing value",
        ));
    }
    let omission = presence
        .presence
        .iter()
        .find_map(|rule| rule.yaml_omit_when.as_ref());
    let mut omission_expressions =
        expressions::Expressions::new(&presence, program, row_fields, None);
    omission_expressions.borrowed_sequence = true;
    let omit_yaml = omission
        .filter(|_| !omit_empty_yaml)
        .map(|condition| {
            omission_expressions
                .lower(condition)
                .map(|code| super::presence::omission_condition(&code))
        })
        .transpose()?;
    let omit_guard = omit_yaml.map(|condition| format!("if mark.is_none(){{let _inputs=inputs;let _value=value;{}if value.raw.is_none() && !value.nil && ({condition}) && value.rows.iter().all(|row|!item_@id@::has_raw(row)){{return Ok(())}}}}", omission_expressions.constants)).unwrap_or_default();
    if presence.presence.iter().any(|rule| {
        rule.yaml_empty.iter().any(|form| {
            form.form != EmptyKind::Null
                && !(form.form == EmptyKind::Sequence
                    && matches!(common.yaml, YamlRepresentation::Sequence { .. }))
        }) || (rule
            .yaml_empty
            .iter()
            .any(|form| form.form == EmptyKind::Null)
            && !nullable)
    }) {
        return Err(unsupported(
            entry,
            "This collection presence contract requires an additional sequence expression backend",
        ));
    }
    let self_presence = presence
        .presence
        .iter()
        .find(|rule| rule.target == LinkedPresenceTarget::SelfValue);
    let empty_form = |kind| {
        self_presence
            .and_then(|rule| rule.xml_empty.iter().find(|form| form.form == kind))
            .map(|form| {
                super::declared_construction::missing(
                    Some(&form.denotes),
                    &presence,
                    &row,
                    program,
                    body.constructible,
                    entry.id,
                )
            })
            .transpose()
    };
    let empty_yaml = self_presence
        .and_then(|rule| {
            rule.yaml_empty
                .iter()
                .find(|form| form.form == EmptyKind::Sequence)
        })
        .map(|form| {
            super::declared_construction::missing(
                Some(&form.denotes),
                &presence,
                &row,
                program,
                body.constructible,
                entry.id,
            )
        })
        .transpose()?;
    let empty_xml = empty_form(EmptyKind::Element)?;
    let empty_item = empty_form(EmptyKind::Item)?;
    if self_presence.is_some_and(|rule| {
        rule.xml_empty.iter().any(|form| {
            !matches!(
                form.form,
                EmptyKind::Element | EmptyKind::Item | EmptyKind::Nil
            )
        })
    }) {
        return Err(unsupported(
            entry,
            "Declared collection supports only empty XML element and item forms",
        ));
    }
    let canonical = collection_canonical(entry, program, self_presence)?;
    let restore_input = match &common.yaml {
        YamlRepresentation::RecordMapping {
            restore_from,
            omit_empty_for,
            ..
        } => restore_from.as_ref().or(omit_empty_for.as_ref()),
        _ => None,
    };
    let sparse_missing = if let Some(input) = restore_input {
        let slot = text_sequence_slot(entry, source_common, bindings, input)?;
        let key = lifted
            .as_ref()
            .expect("sparse record mapping has a key")
            .1
            .as_str();
        Some(format!(
            "{{let mut rows=Vec::new();for (position,name) in inputs.sequence({slot})?.iter().enumerate(){{let inputs=&inputs.with_collection_position(position);let InputValue::Text(name)=name else{{return Err(RuntimeDiagnostic::new(\"input.type\",\"Canonical name must be text\"));}};let mut yaml=core::yaml::scalar({key:?});yaml.push_str(\": \" );yaml.push_str(&core::yaml::scalar(name));rows.push(item_@id@::read_yaml(yaml.as_bytes(),inputs)?);}}V@id@{{rows,present:true,nil:false,raw:None@collection_marks_initial@}}}}"
        ))
    } else {
        None
    };
    let missing = |xml: bool| -> Result<String, Diagnostic> {
        let rule = presence
            .presence
            .iter()
            .find(|rule| rule.target == LinkedPresenceTarget::SelfValue);
        let value = rule.and_then(|rule| {
            if xml {
                rule.xml_missing.as_ref()
            } else {
                rule.yaml_missing.as_ref()
            }
        });
        if !xml
            && value.is_none()
            && let Some(code) = &sparse_missing
        {
            return Ok(code.clone());
        }
        super::declared_construction::missing(
            value,
            &presence,
            &row,
            program,
            body.constructible,
            entry.id,
        )
    };
    if shared && !common_attributes.is_empty() {
        return Err(unsupported(
            entry,
            "Shared collection headers require ownership-aware header assembly",
        ));
    }
    let yaml_missing = missing(false)?;
    let canonical_rows = sparse_missing.as_deref().unwrap_or(&yaml_missing);
    let local_row_boundary = needs_row_boundary(entry, program);
    let row_refs = |source: &str| {
        if local_row_boundary {
            source.replace("item_@id@::", "row_@id@::").replace(
                &format!("item_{}::", entry.id),
                &format!("row_{}::", entry.id),
            )
        } else {
            source.to_owned()
        }
    };
    let item_inputs = match &common.yaml {
        YamlRepresentation::RecordMapping { item_inputs, .. } => item_inputs.as_slice(),
        _ => &[],
    };
    let row_key_path = if item_inputs.is_empty() {
        None
    } else {
        let YamlRepresentation::RecordMapping { key, .. } = &common.yaml else {
            unreachable!()
        };
        let LinkedXml::Record(fields) = attributes::content(&row.xml).0 else {
            unreachable!()
        };
        let field = fields
            .iter()
            .find(|field| &field.field == key)
            .expect("validated key XML path");
        if field.attribute.is_some() {
            return Err(unsupported(
                entry,
                "Per-row XML attribute keys require an attribute capture backend",
            ));
        }
        Some(record::path_code(&field.path))
    };
    let row_input_helper = if item_inputs.is_empty() {
        String::new()
    } else {
        let source_collection = program
            .entries
            .iter()
            .find(|candidate| candidate.id == target)
            .expect("linked collection");
        let binding = |name: &str| -> Result<&LinkedExpression, Diagnostic> {
            let slot = source_collection
                .inputs
                .iter()
                .position(|field| field.name == name)
                .ok_or_else(|| unsupported(entry, "Record mapping lookup input is not declared"))?;
            bindings
                .iter()
                .find(|binding| binding.slot as usize == slot)
                .map(|binding| &binding.value)
                .ok_or_else(|| {
                    unsupported(
                        entry,
                        "Record mapping lookup input is not bound by its owner",
                    )
                })
        };
        let mut prelude = String::new();
        let mut overrides = String::new();
        for (ordinal, item_input) in item_inputs.iter().enumerate() {
            let slot = row_input_base as usize + ordinal;
            let value = match &item_input.source {
                RecordItemInputSource::RowKey => "key".to_owned(),
                RecordItemInputSource::Table { values, default } => {
                    let arms = values
                        .iter()
                        .map(|(key, value)| format!("{key:?}=>{value:?},"))
                        .collect::<String>();
                    writeln!(
                        prelude,
                        "let row_value_{ordinal}=match key {{{arms}_=>{default:?}}};"
                    )
                    .unwrap();
                    format!("row_value_{ordinal}")
                }
                RecordItemInputSource::Lookup {
                    input,
                    default_input,
                } => {
                    let LinkedExpressionKind::Input(index_slot) = &binding(input)?.kind else {
                        return Err(unsupported(
                            entry,
                            "Record mapping lookup index requires a bound input",
                        ));
                    };
                    let default = match &binding(default_input)?.kind {
                        LinkedExpressionKind::Input(slot) => format!("inputs.text({slot})?"),
                        LinkedExpressionKind::Literal(ScalarLiteral::Text(text)) => {
                            format!("{text:?}")
                        }
                        _ => {
                            return Err(unsupported(
                                entry,
                                "Record mapping default profile requires text or a bound input",
                            ));
                        }
                    };
                    writeln!(prelude,"let row_value_{ordinal}=inputs.text_index({index_slot})?.lookup(key)?.unwrap_or({default});").unwrap();
                    format!("row_value_{ordinal}")
                }
            };
            write!(overrides, "({slot},core::inputs::InputRef::Text({value})),").unwrap();
        }
        format!(
            "fn with_row_key_@id@<T>(inputs:&InputView<'_>,key:&str,f:impl FnOnce(&InputView<'_>)->core::Result<T>)->core::Result<T>{{{prelude}let overrides=[{overrides}];let view=inputs.with_overrides(&overrides);f(&view)}}\nfn with_stored_row_@id@<T>(row:&item_@id@::Stored,inputs:&InputView<'_>,f:impl FnOnce(&InputView<'_>)->core::Result<T>)->core::Result<T>{{let key=item_@id@::text(row,@lifted_index@)?;with_row_key_@id@(inputs,key,f)}}"
        )
    };
    let row_input_helper = if local_row_boundary {
        row_input_helper.replace("let key=item_@id@::text(row,@lifted_index@)?;", "if row_@id@::is_opaque(row){return f(inputs)}let key=item_@id@::text(row,@lifted_index@)?;")
    } else {
        row_input_helper
    };
    let row_key_enabled = !item_inputs.is_empty();
    let refine_row = if row_key_enabled {
        format!(
            "let source_row=value.rows.get(rows.len()).ok_or_else(||RuntimeDiagnostic::new(\"xml.preservation-shape\",\"Missing semantic row while refining its XML occurrence\"))?;with_stored_row_@id@(source_row,inputs,|inputs|{{{}Ok(())}})?;",
            if local_row_boundary {
                REFINE_ROW_WITH_BOUNDARY
            } else {
                REFINE_ROW
            },
        )
    } else if local_row_boundary {
        REFINE_ROW_WITH_BOUNDARY.to_owned()
    } else {
        REFINE_ROW.to_owned()
    };
    let refine_row = if row_key_enabled && local_row_boundary {
        refine_row.replace("with_stored_row_@id@(source_row,inputs,", "if row_@id@::is_opaque(source_row){return Err(RuntimeDiagnostic::new(\"xml.preservation-shape\",\"An opaque row has no semantic key for refinement\"));}with_stored_row_@id@(source_row,inputs,")
    } else {
        refine_row
    };
    let runtime = if row_key_enabled {
        RUNTIME.replace(
            "item_@id@::check(row,source,inputs,xml)",
            "with_stored_row_@id@(row,inputs,|inputs|Ok(item_@id@::check(row,source,inputs,xml))).unwrap_or_else(|error|vec![error])",
        )
        .replace("item_@id@::prepare(row,inputs)", "with_stored_row_@id@(row,inputs,|inputs|item_@id@::prepare(row,inputs))")
        .replace("item_@id@::write_xml(row,prepared,inputs,out)?", "with_stored_row_@id@(row,inputs,|inputs|item_@id@::write_xml(row,prepared,inputs,out))?;")
        .replace("item_@id@::write_yaml(row,inputs,&mut rendered,\"\")?", "with_stored_row_@id@(row,inputs,|inputs|item_@id@::write_yaml(row,inputs,&mut rendered,\"\"))?")
        .replace("item_@id@::write_yaml(row,inputs,out,&row_indent)?", "with_stored_row_@id@(row,inputs,|inputs|item_@id@::write_yaml(row,inputs,out,&row_indent))?")
        .replace("item_@id@::write_mapping_value(row,inputs,&mut rendered,\"\")?", "with_stored_row_@id@(row,inputs,|inputs|item_@id@::write_mapping_value(row,inputs,&mut rendered,\"\"))?")
        .replace("item_@id@::write_yaml(&value.rows[0],inputs,&mut rendered,\"\")?", "with_stored_row_@id@(&value.rows[0],inputs,|inputs|item_@id@::write_yaml(&value.rows[0],inputs,&mut rendered,\"\"))?")
    } else {
        RUNTIME.to_owned()
    };
    // A sequence never calls a named-mapping writer. Omit that unused template
    // before inserting nested item modules, rather than asking rustc to parse it.
    let runtime = if lifted.is_none() {
        let (prefix, mapping) = runtime
            .split_once("fn write_mapping_rows_@id@(")
            .expect("mapping template boundary");
        let (_, suffix) = mapping
            .split_once("fn write_yaml_@id@(")
            .expect("following template boundary");
        format!("{prefix}fn write_yaml_@id@({suffix}").replace(
            "if @lifted_key@.is_some(){return write_mapping_rows_@id@(value,inputs,out,indent);}",
            "",
        )
    } else {
        runtime
    };
    let null_reader = if absent_null_row && row_key_enabled {
        let form = row
            .presence
            .iter()
            .find(|rule| matches!(rule.target, LinkedPresenceTarget::SelfValue))
            .and_then(|rule| {
                rule.yaml_empty
                    .iter()
                    .find(|form| form.form == EmptyKind::Null)
            })
            .expect("absent null form");
        let (constants, condition) = form
            .when
            .as_ref()
            .map(|condition| expressions::expression(&row, row_program, condition))
            .transpose()?
            .unwrap_or_else(|| (String::new(), "true".to_owned()));
        let checks = super::constraints::validate_absent_context(&row, row_program)?;
        row_refs(&format!(
            "|key|with_row_key_@id@(inputs,key,|inputs|{{let _inputs=inputs;{constants}if !({condition}){{return Ok(false)}}{checks}Ok(true)}})"
        ))
    } else {
        null_reader
    };
    let runtime = if row_key_enabled
        && row.shorthands.iter().any(|short| {
            matches!(
                short.representation,
                LinkedShorthandRepresentation::MappingField(_)
            )
        }) {
        runtime.replace(
            "core::yaml::RecordMappingFields::new(key,@lifted_value@)",
            "core::yaml::RecordMappingFields::new(key,@lifted_value@).with_key_input(true)",
        )
    } else {
        runtime
    };
    let runtime = if absent_null_row && row_key_enabled {
        runtime.replace(
            "core::yaml::RecordMappingFields::new(key,@lifted_value@)",
            "core::yaml::RecordMappingFields::new(key,@lifted_value@).with_absent_null_row(true)",
        )
    } else {
        runtime
    };
    let runtime = if row_key_enabled && !row.shorthands.is_empty() && grouping.is_none() {
        runtime.replace(
            "core::yaml::RecordMappingFields::new(key,@lifted_value@)",
            "core::yaml::RecordMappingFields::new(key,@lifted_value@).with_scalar_row(true)",
        )
    } else {
        runtime
    };
    let runtime = if let Some((group, value)) = &grouping {
        let grouped_read = format!(
            "mapping.consume(node,position,core::yaml::RecordMappingFields::new(key,@lifted_value@),{group:?},@yaml_mapping_key@,|node,position|self.consume_item(node,position,source,inputs))"
        );
        let grouped_write = format!(
            "let _=(inputs,&mut *out,indent);let mut mapping=core::yaml::GroupedRecordMappingWriter::default();for (position,row) in value.rows.iter().take(@max_items@).enumerate(){{let inputs=&inputs.with_collection_position(position);if !item_@id@::key_can_be_lifted(row){{continue;}}let key=match item_@id@::text(row,@lifted_index@){{Ok(key)=>key,Err(error) if error.code.as_deref()==Some(\"fact.unready\")=>continue,Err(error)=>return Err(error)}};let mut rendered=String::new();item_@id@::write_mapping_value(row,inputs,&mut rendered,\"\")?;@key_mapper@ if annotation.is_none(){{mapping.push_record(key,rendered.as_bytes(),{group:?},{value:?})?;}}}}if !@root_yaml@{{out.push('\\n');}}mapping.write(out,&format!(\"{{indent}}{{}}\",if @root_yaml@{{\"\"}}else{{\"  \"}}))}}"
        );
        let start = runtime
            .find("fn write_mapping_rows_@id@")
            .expect("mapping writer");
        let end = runtime[start..]
            .find("fn write_yaml_@id@")
            .map(|length| start + length)
            .expect("mapping writer end");
        let mut changed = runtime[..start].to_owned();
        changed.push_str("fn write_mapping_rows_@id@(value:&V@id@,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{");
        changed.push_str(&grouped_write);
        changed.push('\n');
        changed.push_str(&runtime[end..]);
        changed.replace("core::yaml::RecordMappingReader","core::yaml::GroupedRecordMappingReader")
            .replace("mapping.consume(node,position,core::yaml::RecordMappingFields::new(key,@lifted_value@),@yaml_mapping_key@,@null_reader@,|node,position|self.consume_item(node,position,source,inputs))",&grouped_read)
    } else {
        runtime
    };
    let runtime = row_refs(&runtime);
    let chain_route = next.as_ref().map_or(String::new(), |next| {
        format!(
            "let Some(path)=core::xml::linear_chain_route_into(path,@parent@,{},{},&mut self.path_buffer) else{{return Ok(())}};",
            record::path_code(next),
            record::path_code(&relative[..1]),
        )
    });
    let write_rows = next.as_ref().map_or(
        "@open_parent@for (position,(row,prepared)) in value.rows.iter().zip(&prepared.rows).enumerate(){let inputs=&inputs.with_collection_position(position);item_@id@::write_xml(row,prepared,inputs,out)?;@close_item@}".to_owned(),
        |next| format!(
            "let mut chain_path=(@parent@).to_vec();for (position,(row,prepared)) in value.rows.iter().zip(&prepared.rows).enumerate(){{let inputs=&inputs.with_collection_position(position);out.container_with_attributes(&chain_path,@headers@);out.with_route_alias(@parent@,&chain_path,|out|{{item_@id@::write_xml(row,prepared,inputs,out)?;out.end_container_if_open(@route@);Ok(())}})?;chain_path.extend_from_slice({});}}",
            record::path_code(next),
        ),
    );
    let write_rows = if row_key_enabled {
        write_rows.replace("item_@id@::write_xml(row,prepared,inputs,out)?", "with_stored_row_@id@(row,inputs,|inputs|item_@id@::write_xml(row,prepared,inputs,out))?")
    } else {
        write_rows
    };
    let mut constraint_entry =
        super::collection_constraints::merge(&common, entry, program, bindings, arguments)?;
    constraint_entry.id = entry.id;
    let collection_checks = super::constraints::declared_sequence(
        &constraint_entry,
        program,
        (!root_yaml).then_some(key),
    )?;
    let annotated = !constraint_entry.constraints.is_empty();
    let mark_function = if annotated {
        r#"fn collection_mark_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<Option<String>>{if let Some(mark)=value.marks.label(0){return Ok(Some(mark))}let mut issues=collection_issues_@id@(value,&[],inputs,true);issues.extend(collection_issues_@id@(value,&[],inputs,false));let mut marks=core::raw::Fields::default();marks.infer_value(0,issues)?;Ok(marks.label(0))}"#
    } else {
        r#"fn collection_mark_@id@(_value:&V@id@,_inputs:&InputView<'_>)->core::Result<Option<String>>{Ok(None)}"#
    };
    let check_xml = if annotated {
        r#"fn check_xml_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{let mut issues=collection_issues_@id@(value,source,inputs,true);issues.retain(|issue|issue.kind!=core::annotations::IssueKind::Semantic || issue.severity!=Severity::Error);issues.extend(check_rows_@id@(value,source,inputs,true));issues.retain(|issue|issue.kind!=core::annotations::IssueKind::Semantic || issue.severity!=Severity::Error);issues}"#
    } else {
        r#"fn check_xml_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{check_rows_@id@(value,source,inputs,true).into_iter().filter(|issue|issue.kind!=core::annotations::IssueKind::Semantic || issue.severity!=Severity::Error).collect()}"#
    };
    let check_yaml = if annotated {
        r#"fn check_yaml_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{let mut issues=value.marks.validate_value(0,collection_issues_@id@(value,source,inputs,false),collection_issues_@id@(value,source,inputs,true));for issue in &mut issues{if issue.kind==core::annotations::IssueKind::Semantic{issue.path=vec![@key@.into()];}}issues.extend(check_rows_@id@(value,source,inputs,false));issues}"#
    } else {
        r#"fn check_yaml_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{check_rows_@id@(value,source,inputs,false)}"#
    };
    let constructor = if body.constructible {
        let slots = (0..row_fields.len())
            .map(|index| format!("source.field({index})"))
            .collect::<Vec<_>>()
            .join(",");
        row_refs(&format!(
            "#[allow(dead_code)] fn construct_@id@(slots:&[Option<core::inputs::InputRef<'_>>],inputs:&InputView<'_>)->core::Result<V@id@>{{let (sources,present)=match slots.first().copied().flatten(){{None|Some(core::inputs::InputRef::MissingValue)=>(core::inputs::Records::empty(),false),Some(core::inputs::InputRef::Records(rows))=>(rows,true),_=>return Err(RuntimeDiagnostic::new(\"input.type\",\"Collection construction requires record rows\"))}};let mut rows=Vec::new();for (position,source) in sources.into_iter().enumerate(){{let inputs=&inputs.with_collection_position(position);rows.push(item_@id@::construct(&[{slots}],inputs)?);}}Ok(V@id@{{rows,present,nil:false,raw:None@collection_marks_initial@}})}}"
        ))
    } else {
        String::new()
    };
    let mut code = runtime
        .replace("@collection_mark_function@", mark_function)
        .replace("@collection_check_xml@", check_xml)
        .replace("@collection_check_yaml@", check_yaml)
        .replace("@collection_checks@", &collection_checks)
        .replace("@whole_collection_issues@", if annotated {"fn collection_issues_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>,xml:bool)->Vec<RuntimeDiagnostic>{if xml {issues_xml_@id@(value,source,inputs)} else {issues_yaml_@id@(value,source,inputs)}}"} else {""})
        .replace("@chain_route@", &chain_route)
        .replace("@chain_buffer_field@", if next.is_some() { ",path_buffer:Vec<core::xml::Name>" } else { "" })
        .replace("@chain_buffer_initial@", if next.is_some() { ",path_buffer:Vec::new()" } else { "" })
        .replace("@row_input_helper@", &row_refs(&row_input_helper))
        .replace("@row_key_fields@", if row_key_enabled { ",active_key:Option<String>,key_buffer:Option<String>,row_keys:Vec<String>,pending:Vec<(Vec<core::xml::Name>,core::xml::BufferedToken)>" } else { "" })
        .replace("@row_key_initial@", if row_key_enabled { ",active_key:None,key_buffer:None,row_keys:Vec::new(),pending:Vec::new()" } else { "" })
        .replace("@row_key_reset@", if row_key_enabled { "self.active_key=None;self.key_buffer=None;self.pending.clear();" } else { "" })
        .replace("@capture_row_key@", &row_key_path.as_ref().map_or(String::new(), |path| format!("if self.active.is_some() && core::xml::matches(path,{path}){{match token{{core::xml::Token::Start(_)=>self.key_buffer=Some(String::new()),core::xml::Token::Text(text)=>self.key_buffer.get_or_insert_with(String::new).push_str(text),core::xml::Token::End=>self.active_key=Some(self.key_buffer.take().unwrap_or_default()),core::xml::Token::Attribute(_)=>{{}}}}}}")))
        .replace("@consume_scoped_row@", &row_refs(if row_key_enabled { "if self.active_key.is_none(){self.pending.push((path.to_vec(),core::xml::BufferedToken::from_token(token)));}else{let key=self.active_key.as_deref().expect(\"captured key\");for (saved_path,saved_token) in self.pending.drain(..){if matches!(saved_token,core::xml::BufferedToken::Text(_)) && item_@id@::qname_text(&saved_path){return Err(RuntimeDiagnostic::new(\"xml.preservation-shape\",\"QName before the row key requires XML preservation\"));}saved_token.visit(|saved|with_row_key_@id@(inputs,key,|inputs|reader.consume_scoped(&saved_path,saved,scope,source,inputs)))?;}with_row_key_@id@(inputs,key,|inputs|reader.consume_scoped(path,token,scope,source,inputs))?;}" } else { "reader.consume_scoped(path,token,scope,source,inputs)?;" }))
        .replace("@finish_row_key@", &row_refs(if row_key_enabled { "if !self.pending.is_empty(){let key=self.active_key.as_deref().unwrap_or(\"\");let reader=self.rows.last_mut().expect(\"started row\");for (saved_path,saved_token) in self.pending.drain(..){if matches!(saved_token,core::xml::BufferedToken::Text(_)) && item_@id@::qname_text(&saved_path){return Err(RuntimeDiagnostic::new(\"xml.preservation-shape\",\"QName before the row key requires XML preservation\"));}saved_token.visit(|saved|with_row_key_@id@(inputs,key,|inputs|reader.consume_scoped(&saved_path,saved,scope,source,inputs)))?;}}self.row_keys.push(self.active_key.take().unwrap_or_default());" } else { "" }))
        .replace("@finish_xml_rows@", if row_key_enabled { "state.rows.into_iter().zip(state.row_keys).enumerate().map(|(position,(reader,key))|with_row_key_@id@(&inputs.with_collection_position(position),&key,|inputs|reader.finish(source,inputs))).collect::<core::Result<Vec<_>>>()?" } else { "state.rows.into_iter().enumerate().map(|(position,reader)|reader.finish(source,&inputs.with_collection_position(position))).collect::<core::Result<Vec<_>>>()?" })
        .replace("@yaml_key_fields@", if row_key_enabled { ",active_key:Option<String>,row_keys:Vec<String>" } else { "" })
        .replace("@yaml_key_initial@", if row_key_enabled { ",active_key:None,row_keys:Vec::new()" } else { "" })
        .replace("@yaml_mapping_key@", if row_key_enabled { "|key:String,tag:Option<&str>|{let key=(@key_reader@)(key,tag)?;mapped_key=Some(key.clone());Ok(key)}" } else { "@key_reader@" })
        .replace("@yaml_mapped_key_start@", if row_key_enabled { "let mut mapped_key=None;" } else { "" })
        .replace("@yaml_mapped_key_end@", if row_key_enabled { "if let Some(key)=mapped_key{self.active_key=Some(key);}" } else { "" })
        .replace("@yaml_consume_row@", if row_key_enabled { "with_row_key_@id@(inputs,self.active_key.as_deref().unwrap_or(\"\"),|inputs|self.active.as_mut().expect(\"started item\").consume(node,position,source,inputs))" } else { "self.active.as_mut().expect(\"started item\").consume(node,position,source,inputs)" })
        .replace("@yaml_consume_singleton@", if row_key_enabled { "with_row_key_@id@(inputs,self.active_key.as_deref().unwrap_or(\"\"),|inputs|reader.consume(node,position,source,inputs))" } else { "reader.consume(node,position,source,inputs)" })
        .replace("@yaml_finish_row_key@", if row_key_enabled { "self.row_keys.push(self.active_key.take().unwrap_or_default());" } else { "" })
        .replace("@yaml_finish_rows@", &row_refs(if row_key_enabled { "self.rows.into_iter().zip(self.row_keys).enumerate().map(|(index,(reader,key))|{let result=with_row_key_@id@(&inputs.with_collection_position(index),&key,|inputs|reader.and_then(|reader|reader.finish(source,inputs)));match result{Ok(row)=>Ok(row),Err(error)=>{if source.is_empty(){return Err(error)}let bytes=recover_yaml_row_@id@(source,self.position,index,inputs)?;with_row_key_@id@(&inputs.with_collection_position(index),&key,|inputs|item_@id@::read_yaml(&bytes,inputs))}}}).collect::<core::Result<Vec<_>>>()?" } else { "self.rows.into_iter().enumerate().map(|(index,reader)|match reader.and_then(|reader|reader.finish(source,&inputs.with_collection_position(index))){Ok(row)=>Ok(row),Err(error)=>{if source.is_empty(){return Err(error)}let bytes=recover_yaml_row_@id@(source,self.position,index,inputs)?;item_@id@::read_yaml(&bytes,&inputs.with_collection_position(index))}}).collect::<core::Result<Vec<_>>>()?" }))
        .replace("core::yaml::@recovery_item@(source,property,index@recovery_tag@)?", &if singleton_value {
            "core::yaml::preserved_singleton_item(source,property,index@recovery_tag@)?".to_owned()
        } else {
            item_tag.as_ref().map(|tag|format!("core::yaml::preserved_marked_sequence_item(source,property,index,Some({tag:?}))?")).unwrap_or_else(||"core::yaml::@recovery_item@(source,property,index@recovery_tag@)?".to_owned())
        })
        .replace("@yaml_position_field@", ",position:core::Position")
        .replace("@yaml_position_initial@", ",position:core::Position::default()")
        .replace("@yaml_position_read@", "if !self.opened && self.position==core::Position::default(){self.position=position;}")
        .replace("@write_rows@", &row_refs(&write_rows))
        .replace("@row_wrapper@", if local_row_boundary { ROW_WRAPPER } else { "" })
        .replace("@contribute_wrapper@", if !super::facts::has_contributions(&common, program) { "" } else {
            "pub(super) fn contribute(value:&Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>>{match value{Stored::Normal(row)=>item_@id@::contribute(row,direction,source,inputs,builder),Stored::Raw(_)=>Err(vec![RuntimeDiagnostic::new(\"fact.unready\",\"Raw collection member has no semantic facts\")])}}"
        })
        .replace("@local_row_boundary@", &local_row_boundary.to_string())
        .replace("@refine_row@", &refine_row)
        .replace(
            "@construct_wrapper@",
            if body.constructible {
                "pub(super) fn construct(slots:&[Option<core::inputs::InputRef<'_>>],inputs:&InputView<'_>)->core::Result<Stored>{item_@id@::construct(slots,inputs).map(Stored::Normal)}"
            } else {
                ""
            },
        )
        .replace(
            "@open_parent@",
            if shared {
                ""
            } else {
                "out.container_with_attributes(@parent@,@headers@);"
            },
        )
        .replace(
            "@raw_write@",
            if shared {
                "tree.write_owned_at(out,@parent@,@relative@,&item_@id@::qnames())?;"
            } else {
                "tree.write_at(out,@ancestor@,&item_@id@::qnames())?;"
            },
        )
        .replace("@close_item@", "out.end_container_if_open(@route@);")
        .replace("@relative@", &record::path_code(relative))
        .replace("@document@", &(parent.len() == 1).to_string())
        .replace("@shared@", &shared.to_string())
        .replace("@headers@", &headers)
        .replace("@extra_namespaces@", &namespace_code)
        .replace("@canonical_function@", &row_refs(&canonical.0))
        .replace(
            "@document_omit@",
            &if canonical.0.is_empty() {
                "!value.present || @chain_empty@".into()
            } else {
                format!("match collection_form_{}(value,inputs)?{{1=>true,2|3=>false,_=>!value.present || @chain_empty@}}", entry.id)
            },
        )
        .replace("@chain_empty@", if next.is_some() { "value.rows.is_empty()" } else { "false" })
        .replace("@canonical_guard@", &row_refs(&canonical.1))
        .replace(
            "@empty_xml@",
            &row_refs(
                empty_xml
                    .as_deref()
                    .unwrap_or("V@id@{rows:Vec::new(),present:true,nil:false,raw:None@collection_marks_initial@}"),
            ),
        )
        .replace(
            "@empty_item@",
            &row_refs(
                empty_item
                    .as_deref()
                    .or(empty_xml.as_deref())
                    .unwrap_or("V@id@{rows:Vec::new(),present:true,nil:false,raw:None@collection_marks_initial@}"),
            ),
        )
        .replace("@allow_empty_item@", &empty_item.is_some().to_string())
        .replace(
            "@yaml_present@",
            if hidden {
                "false"
            } else if root_yaml {
                "self.opened"
            } else {
                "self.property.finish(\"yaml.collection-form\")?"
            },
        )
        .replace("@path_prefix@", &(!root_yaml && !hidden).to_string())
        .replace("@root_yaml@", &root_yaml.to_string())
        .replace("@hidden@", &hidden.to_string())
        .replace("@omit_empty_yaml@", &omit_empty_yaml.to_string())
        .replace("@omit_guard@", &row_refs(&omit_guard))
        .replace("@nullable@", &nullable.to_string())
        .replace("@item_tag_read@", &item_tag.as_ref().map(|tag|format!("let node=node.consume_tag({tag:?})?;")).unwrap_or_default())
        .replace("@item_tag_write@", "let item_mark_start=out.len();if MARKED{out.push(' ');out.push_str(mark);}let item_body_start=out.len();")
        .replace("@item_mark_const@", &item_tag.is_some().to_string())
        .replace("@item_mark_value@", &format!("{:?}",item_tag.as_deref().unwrap_or("")))
        .replace("@item_tag_finish@", "\nif MARKED && out[item_body_start..].trim_start().starts_with(\"!xml/\"){out.replace_range(item_mark_start..item_body_start,\"\");}\n")
        .replace("@item_tag_singleton@", &item_tag.as_ref().map(|tag|format!("\nif !scalar.starts_with(\"!xml/\"){{out.push_str({tag:?});out.push(' ');}}\n")).unwrap_or_default())
        .replace("@singleton_empty_prefix@", &singleton_mapping_prefix(root_yaml, item_tag.as_deref(), true))
        .replace("@singleton_record_prefix@", &singleton_mapping_prefix(root_yaml, item_tag.as_deref(), false))
        .replace("@recovery_item@", if singleton_value { "preserved_singleton_item" } else { "preserved_sequence_item" })
        .replace("@recovery_tag@", if singleton_value { ",@item_mark_value_option@" } else { "" })
        .replace("@item_mark_value_option@", &item_tag.as_ref().map(|tag|format!("Some({tag:?})")).unwrap_or_else(||"None".into()))
        .replace("@singleton_sequence@", &singleton_sequence)
        .replace("@singleton_value@", &singleton_value.to_string())
        .replace("@singleton@", &singleton.to_string())
        .replace("@max_items@", &max_items.to_string())
        .replace("@empty_row_null@", &empty_row_null.to_string())
        .replace("@projected_item@", &projected_item.to_string())
        .replace("@compact_mapping_item@", &compact_mapping_item.to_string())
        .replace("@compact_item@", &(compact_item && !(item_tag.is_some() && compact_mapping_item)).to_string())
        .replace("@semantic_only@", &semantic_only.to_string())
        .replace("@constructor@", &constructor)
        .replace("@item@", &body.source)
        .replace(
            "@scalar@",
            if body.scalar_routes.is_empty() {
                "false"
            } else {
                &body.scalar_routes
            },
        )
        .replace("@route@", &record::path_code(&route))
        .replace("@depth@", &(route.len() - 1).to_string())
        .replace("@preserved_qname@", &super::proof::preserved_qname("&value.raw", "@parent@"))
            .replace("@parent@", &record::path_code(parent))
        .replace(
            "@ancestor@",
            &record::path_code(&parent[..parent.len() - 1]),
        )
        .replace("@key@", &format!("{key:?}"))
        .replace("@key_mapper@", &key_mapper)
        .replace("@key_reader@", &key_reader)
        .replace("@null_reader@", &null_reader)
        .replace("@omit_empty_slot@", &omit_empty_slot)
        .replace("@empty_tag@", &empty_tag)
        .replace("@physical@", &format!("{:?}", parent.last().unwrap().local))
        .replace(
            "@namespace@",
            &format!("{:?}", parent.last().unwrap().namespace),
        )
        .replace("@xml_missing@", &row_refs(&missing(true)?))
        .replace("@canonical_rows@", &row_refs(canonical_rows))
        .replace("@empty_yaml_sequence@", &empty_yaml.as_ref().map(|value| format!("if !self.nil && rows.is_empty(){{return Ok({})}}",row_refs(value))).unwrap_or_default())
        .replace("@yaml_missing@", &row_refs(&yaml_missing));
    code = code
        .replace(
            "@lifted_key@",
            &lifted
                .as_ref()
                .map_or("None::<&str>".into(), |(_, key, _)| {
                    format!("Some({key:?})")
                }),
        )
        .replace(
            "@lifted_value@",
            &lifted
                .as_ref()
                .and_then(|(_, _, value)| value.as_ref())
                .map_or("None::<&str>".into(), |value| format!("Some({value:?})")),
        )
        .replace(
            "@lifted_physical@",
            &lifted_physical.map_or("None::<&str>".into(), |name| format!("Some({name:?})")),
        )
        .replace(
            "@lifted_index@",
            &lifted
                .as_ref()
                .map_or("0".into(), |(index, _, _)| index.to_string()),
        );
    // Unconstrained collections carry no annotation pointer and run no
    // whole-value checks. Storage is added only by their declared constraints.
    code = code
        .replace("@collection_marks_field@", if annotated {",marks:core::raw::Fields"} else {""})
        .replace("@collection_marks_initial@", if annotated {",marks:core::raw::Fields::default()"} else {""})
        .replace("@collection_marks_received@", if annotated {",marks:self.marks"} else {""})
        .replace("@collection_marks_move@", if annotated {"value.marks=self.marks;"} else {""})
        .replace("@collection_mark_read@", if annotated {r#"let node=if let Some(tag)=tag{self.marks.read_mark(0,Some(&tag),position)?;match node{core::yaml::Node::SequenceStart(_)=>core::yaml::Node::SequenceStart(None),core::yaml::Node::MappingStart(_)=>core::yaml::Node::MappingStart(None),_=>unreachable!("collection annotation root")}}else{node};"#} else {r#"if tag.is_some(){return Err(RuntimeDiagnostic::new("annotation.unnecessary","No collection constraint supports this annotation"));}"#})
        .replace("@id@", &entry.id.to_string());
    Ok(Some(code))
}

fn collection_canonical(
    entry: &LinkedEntry,
    program: &Program,
    presence: Option<&LinkedPresence>,
) -> Result<(String, String), Diagnostic> {
    let Some(presence) = presence else {
        return Ok((String::new(), String::new()));
    };
    if presence.canonical.is_empty() {
        return Ok((String::new(), String::new()));
    }
    if presence
        .canonical
        .iter()
        .any(|form| form.xml_type.is_some())
    {
        return Err(unsupported(
            entry,
            "Typed collection boundary is not generated",
        ));
    }
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!()
    };
    let storage = vec![("_value.rows".into(), "_value.present".into())];
    let mut context = expressions::Expressions::new(entry, program, fields, Some(&storage));
    let body = canonical::selection(&presence.canonical, |condition| {
        let mut condition = condition.clone();
        collection_owner_expression(&mut condition);
        context.lower(&condition)
    })?;
    let definition = format!(
        "{}fn collection_form_{}(_value:&V{},_inputs:&InputView<'_>)->core::Result<usize>{{{body}}}\n",
        context.constants, entry.id, entry.id
    );
    let guard = format!(
        "match collection_form_{}(value,inputs)?{{1=>return Ok(()),2=>{{out.ensure_container(@parent@);return Ok(())}},3=>{{out.field_with_attributes(@parent@,\"\",{});return Ok(())}},_=>{{}}}}",
        entry.id,
        super::scalar_presence::absent_attributes(&XmlForm::Nil)
    );
    Ok((definition, guard))
}

fn collection_owner_expression(value: &mut LinkedExpression) {
    match &mut value.kind {
        LinkedExpressionKind::SelfValue => value.kind = LinkedExpressionKind::Field(0),
        LinkedExpressionKind::Operation { arguments, .. } => {
            for argument in arguments {
                collection_owner_expression(argument);
            }
        }
        _ => {}
    }
}

// A malformed row may have no YAML projection, or its nested preservation
// envelope may not be readable in isolation. In either case the collection
// retains an empty semantic shape and proves a patch at its own XML boundary.
const REFINE_ROW: &str = "let row=item_@id@::read_xml(document,inputs)?;let yaml=item_@id@::finalize(document,&row,inputs)?;rows.push(item_@id@::read_yaml(&yaml,inputs)?);";
const REFINE_ROW_WITH_BOUNDARY: &str = r#"let parsed=row_@id@::read_xml(document,inputs).and_then(|row|row_@id@::finalize(document,&row,inputs)).and_then(|yaml|row_@id@::read_yaml(&yaml,inputs));
let row=match parsed{Ok(row)=>row,Err(error) if row_@id@::preservable(&error)=>row_@id@::capture_raw(document,&route[..route.len()-1],route[route.len()-1])?,Err(error)=>return Err(error)};
rows.push(row);"#;

const ROW_WRAPPER: &str = r#"#[allow(dead_code)] mod row_@id@ {
use super::*;
pub(super) enum Stored { Normal(item_@id@::Stored), Raw(Box<core::xml::Tree>) }
impl core::inputs::RecordInput for Stored {fn field(&self,index:usize)->Option<core::inputs::InputRef<'_>>{match self{Self::Normal(row)=>core::inputs::RecordInput::field(row,index),Self::Raw(_)=>None}}}
pub(super) fn is_opaque(value:&Stored)->bool{matches!(value,Stored::Raw(_))}
pub(super) fn has_raw(value:&Stored)->bool{match value{Stored::Normal(row)=>item_@id@::has_raw(row),Stored::Raw(_)=>true}}
// Keep ordinary rows inline; boxing them would allocate once per collection member.
#[allow(clippy::large_enum_variant)]
pub(super) enum Prepared { Normal(item_@id@::Prepared), Raw(Box<core::xml::Tree>) }
pub(super) fn preservable(error:&RuntimeDiagnostic)->bool{error.code.as_deref().is_some_and(|code|code.starts_with("value.")||code.starts_with("yaml.")||code.starts_with("text-pattern.")||matches!(code,"xml.unknown-field"|"xml.unknown-attribute"|"xml.unexpected-text"|"xml.duplicate-field"|"xml.round-trip-mismatch"|"xml.preservation-shape"))}
pub(super) struct XmlReader{reader:item_@id@::XmlReader,offset:Option<usize>,failed:bool}
impl XmlReader {
pub(super) fn new()->Self{Self{reader:item_@id@::XmlReader::new(),offset:None,failed:false}}
pub(super) fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:Option<core::xml::NamespaceScope<'_>>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{if core::xml::matches(path,@route@) && let core::xml::Token::Start(offset)=token{self.offset=Some(*offset);}
if self.failed{return Ok(())}match self.reader.consume_scoped(path,token,scope,source,inputs){Ok(())=>Ok(()),Err(error) if preservable(&error)=>{self.failed=true;Ok(())},Err(error)=>Err(error)}}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{if !self.failed{match self.reader.finish(source,inputs){Ok(row)=>return Ok(Stored::Normal(row)),Err(error) if preservable(&error)=>{},Err(error)=>return Err(error)}}let offset=self.offset.ok_or_else(||RuntimeDiagnostic::new("xml.preservation-shape","Missing collection member offset"))?;let tree=core::xml::Tree::capture_at_with_qnames(source,@route@,offset,qname_text)?.ok_or_else(||RuntimeDiagnostic::new("xml.preservation-shape","Missing collection member"))?;Ok(Stored::Raw(Box::new(tree)))}
}
pub(super) struct YamlReader(item_@id@::YamlReader);
impl YamlReader {pub(super) fn new()->core::Result<Self>{item_@id@::YamlReader::new().map(Self)}pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{self.0.consume(node,position,source,inputs)}pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{self.0.finish(source,inputs).map(Stored::Normal)}}
pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{item_@id@::read_xml(source,inputs).map(Stored::Normal)}
pub(super) fn capture_raw(source:&[u8],parent:&[(&str,&str)],member:(&str,&str))->core::Result<Stored>{let mut route=parent.to_vec();route.push(member);let tree=core::xml::Tree::capture_with_qnames(source,&route,qname_text)?.ok_or_else(||RuntimeDiagnostic::new("xml.preservation-shape","Missing collection member"))?;Ok(Stored::Raw(Box::new(tree)))}
pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{
if source.iter().copied().skip_while(u8::is_ascii_whitespace).take(8).eq(b"!xml/raw".iter().copied()){
let route=@route@;let(namespace,local)=route[route.len()-1];let name=core::xml::Name{namespace:namespace.into(),local:local.into()};let qnames=qnames();
if let Some(raw)=core::raw::Item::decode(source)?{let tree=core::xml::Tree::from_payload_yaml(&raw.payload,name,&[],&qnames)?;return Ok(Stored::Raw(Box::new(tree)))}
if let Some(raw)=core::raw::Document::decode(source)? && raw.meaning_is_empty()?{let patch=core::xml::Patch::read(&raw.payload,&[],&qnames)?;if patch.is_replacement(){return patch.apply(None,name,&[],&qnames).map(|tree|Stored::Raw(Box::new(tree)))}}
}
item_@id@::read_yaml(source,inputs).map(Stored::Normal)}
pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{match value{Stored::Normal(row)=>item_@id@::finalize(source,row,inputs),Stored::Raw(tree)=>core::raw::Item::encode(tree.payload_yaml(&[],&qnames())?.as_bytes())}}
pub(super) fn text(value:&Stored,field:usize)->core::Result<&str>{match value{Stored::Normal(row)=>item_@id@::text(row,field),Stored::Raw(_)=>Err(RuntimeDiagnostic::new("fact.unready","Raw collection member has no semantic field"))}}
pub(super) fn prepare(value:&Stored,inputs:&InputView<'_>)->core::Result<Prepared>{match value{Stored::Normal(row)=>item_@id@::prepare(row,inputs).map(Prepared::Normal),Stored::Raw(tree)=>Ok(Prepared::Raw(tree.clone()))}}
pub(super) fn namespaces<'a>(value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>){match(value,prepared){(Stored::Normal(row),Prepared::Normal(prepared))=>item_@id@::namespaces(row,prepared,names),(Stored::Raw(_),Prepared::Raw(tree))=>tree.collect_namespaces(names),_=>{}}}
pub(super) fn write_xml<'a>(value:&Stored,prepared:&'a Prepared,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{match(value,prepared){(Stored::Normal(row),Prepared::Normal(prepared))=>item_@id@::write_xml(row,prepared,inputs,out),(Stored::Raw(_),Prepared::Raw(tree))=>tree.write_at(out,@parent@,&qnames()),_=>Err(RuntimeDiagnostic::new("xml.preservation-shape","Collection member and preparation disagree"))}}
pub(super) fn write_yaml(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{match value{Stored::Normal(row)=>item_@id@::write_yaml(row,inputs,out,indent),Stored::Raw(tree)=>{let bytes=core::raw::Item::encode(tree.payload_yaml(&[],&qnames())?.as_bytes())?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect("generated YAML"));Ok(())}}}
pub(super) fn key_can_be_lifted(value:&Stored)->bool{match value{Stored::Normal(row)=>item_@id@::key_can_be_lifted(row),Stored::Raw(_)=>false}}
pub(super) fn write_mapping_value(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{match value{Stored::Normal(row)=>item_@id@::write_mapping_value(row,inputs,out,indent),Stored::Raw(_)=>Err(RuntimeDiagnostic::new("yaml.collection-form","Raw member has no mapping key"))}}
pub(super) fn check(value:&Stored,source:&[u8],inputs:&InputView<'_>,xml:bool)->Vec<RuntimeDiagnostic>{match value{Stored::Normal(row)=>item_@id@::check(row,source,inputs,xml),Stored::Raw(_)=>Vec::new()}}
pub(super) fn scalar(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool{match value{Stored::Normal(row)=>item_@id@::scalar(row,path,occurrences),Stored::Raw(_)=>false}}
pub(super) fn qnames()->Vec<(&'static str,&'static str)>{item_@id@::qnames()}
@construct_wrapper@
@contribute_wrapper@
pub(super) fn qname_attribute(path:&[core::xml::Name],name:&core::xml::Name)->bool{item_@id@::qname_attribute(path,name)}
pub(super) fn qname_text(path:&[core::xml::Name])->bool{item_@id@::qname_text(path)}
pub(super) fn qname_text_at(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool{match value{Stored::Normal(row)=>item_@id@::qname_text_at(row,path,occurrences),Stored::Raw(_)=>qname_text(path)}}
}
"#;

const RUNTIME: &str = r#"
@item@
@constructor@
@row_input_helper@
@row_wrapper@
@collection_checks@
@canonical_function@
fn decode_raw_@id@(source:&[u8])->core::Result<Option<core::raw::Document>>{if @root_yaml@{core::raw::Document::decode(source)}else{Ok(core::raw::Property::decode(source,@key@,@physical@)?.map(|v|core::raw::Document{meaning:v.meaning,payload:v.payload}))}}
fn encode_raw_@id@(meaning:&[u8],payload:&[u8])->core::Result<Vec<u8>>{if @root_yaml@{core::raw::Document::encode(meaning,payload)}else{core::raw::Property::encode(@key@,@physical@,meaning,payload)}}
struct V@id@{rows:Vec<item_@id@::Stored>,present:bool,nil:bool,raw:Option<core::xml::Patch>@collection_marks_field@}
struct XmlCollection@id@{rows:Vec<item_@id@::XmlReader>,active:Option<item_@id@::XmlReader>,present:bool,nil:bool,active_empty:bool,sole_empty_item:bool@chain_buffer_field@@row_key_fields@}
impl XmlCollection@id@ {
fn new()->Self{Self{rows:Vec::new(),active:None,present:false,nil:false,active_empty:false,sole_empty_item:false@chain_buffer_initial@@row_key_initial@}}
fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:Option<core::xml::NamespaceScope<'_>>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{
let inputs=&inputs.with_collection_position(self.rows.len());
@chain_route@
if matches!(token,core::xml::Token::Start(_)) && core::xml::matches(path,@parent@){if self.present{return Err(RuntimeDiagnostic::new("xml.duplicate-field","Repeated collection"));}self.present=true;}
if @nullable@ && core::xml::matches(path,@parent@) && let core::xml::Token::Attribute(attribute)=token && attribute.name.namespace=="http://www.w3.org/2001/XMLSchema-instance" && attribute.name.local=="nil" {self.nil=match attribute.text.as_str(){"true"|"1"=>true,"false"|"0"=>false,_=>return Err(RuntimeDiagnostic::new("xml.nil-value","Invalid nil value"))};return Ok(());}
if matches!(token,core::xml::Token::Start(_)) && core::xml::matches(path,@route@){
if @shared@{self.present=true;}
if self.active.is_some(){return Err(RuntimeDiagnostic::new("xml.collection-form","Overlapping items"));}
self.active=Some(item_@id@::XmlReader::new());self.active_empty=true;@row_key_reset@}
@capture_row_key@
if @allow_empty_item@ && self.active.is_some() && ((path.len()>@route@.len() && matches!(token,core::xml::Token::Start(_)|core::xml::Token::Attribute(_)|core::xml::Token::Text(_))) || (core::xml::matches(path,@route@) && matches!(token,core::xml::Token::Attribute(_))) || (core::xml::matches(path,@route@) && matches!(token,core::xml::Token::Text(value) if !value.trim().is_empty()))){self.active_empty=false;}
if let Some(reader)=&mut self.active{@consume_scoped_row@}
if matches!(token,core::xml::Token::End) && core::xml::matches(path,@route@){self.sole_empty_item=self.rows.is_empty() && self.active_empty;self.rows.push(self.active.take().expect("started item"));@finish_row_key@}
Ok(())
}}
fn finish_xml_@id@(state:XmlCollection@id@,source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{if state.active.is_some(){return Err(RuntimeDiagnostic::new("value.missing","Missing collection"));}
if !state.present{return Ok(@xml_missing@)}
if state.rows.is_empty() && !state.nil{return Ok(@empty_xml@)}
if @allow_empty_item@ && state.rows.len()==1 && state.sole_empty_item{return Ok(@empty_item@)}
Ok(V@id@{rows:@finish_xml_rows@,present:state.present,nil:state.nil,raw:None@collection_marks_initial@})}
fn read_xml_events_scoped_@id@(source:&[u8],inputs:&InputView<'_>,events:impl core::xml::ScopedSource,mut other:impl FnMut(&[core::xml::Name],&core::xml::Token<'_>)->core::Result<bool>)->core::Result<V@id@>{let mut state=XmlCollection@id@::new();events.visit_scoped(|path,token,scope|{if !other(path,token)?{state.consume_scoped(path,token,Some(scope),source,inputs)?;}Ok(())})?;finish_xml_@id@(state,source,inputs)}
#[allow(dead_code)] fn read_xml_events_@id@(source:&[u8],inputs:&InputView<'_>,events:impl core::xml::Source,mut other:impl FnMut(&[core::xml::Name],&core::xml::Token<'_>)->core::Result<bool>)->core::Result<V@id@>{let mut state=XmlCollection@id@::new();events.visit(|path,token|{if !other(path,token)?{state.consume_scoped(path,token,None,source,inputs)?;}Ok(())})?;finish_xml_@id@(state,source,inputs)}
#[allow(dead_code)] fn read_xml_with_@id@(source:&[u8],inputs:&InputView<'_>,other:impl FnMut(&[core::xml::Name],&core::xml::Token<'_>)->core::Result<bool>)->core::Result<V@id@>{read_xml_events_scoped_@id@(source,inputs,core::xml::DocumentSource(source),other)}
fn read_xml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{let result=read_xml_events_scoped_@id@(source,inputs,core::xml::DocumentSource(source),|_,_|Ok(false));match result{Ok(value)=>Ok(value),Err(error) if matches!(error.code.as_deref(),Some("xml.unknown-field"|"xml.unknown-attribute"|"xml.unexpected-text"|"xml.duplicate-field"|"xml.preservation-shape"|"xml.nil-value"|"value.missing"))=>Ok(V@id@{rows:Vec::new(),present:true,nil:false,raw:None@collection_marks_initial@}),Err(error)=>Err(error)}}
struct YamlSequence@id@{mapping:core::yaml::RecordMappingReader,property:core::yaml::PropertyReader,depth:usize,single:bool,opened:bool,nil:bool,marker:bool,rows:Vec<core::Result<item_@id@::YamlReader>>,active:Option<item_@id@::YamlReader>,error:Option<RuntimeDiagnostic>@collection_marks_field@@yaml_key_fields@@yaml_position_field@}
impl YamlSequence@id@ {
fn new()->Self{Self{mapping:core::yaml::RecordMappingReader::default(),property:core::yaml::PropertyReader::default(),depth:0,single:false,opened:false,nil:false,marker:false,rows:Vec::new(),active:None,error:None@collection_marks_initial@@yaml_key_initial@@yaml_position_initial@}}
fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{
let inputs=&inputs.with_collection_position(self.rows.len());
if @hidden@{return Ok(())}
let node=if @root_yaml@{node}else{let Some(node)=self.property.consume(node,@key@,"yaml.collection-form")? else{return Ok(())};node};
@yaml_position_read@
let tag=if !self.opened {match &node {core::yaml::Node::SequenceStart(Some(tag))|core::yaml::Node::MappingStart(Some(tag)) if matches!(tag.as_str(),"!xml/invalid"|"!xml/important")=>Some(tag.clone()),_=>None}}else{None};
@collection_mark_read@
if @nullable@ && !self.opened && matches!(&node,core::yaml::Node::Scalar(value,None) if value.is_null()){self.opened=true;self.nil=true;return Ok(());}
if let Some(tag)=@empty_tag@ && let core::yaml::Node::Scalar(value,Some(actual))=&node && actual==&format!("!{tag}") && value.is_null() {if self.opened{return Err(RuntimeDiagnostic::new("yaml.collection-form","Repeated collection"));}self.opened=true;self.marker=true;return Ok(());}
if let Some(key)=@lifted_key@ {let mut mapping=std::mem::take(&mut self.mapping);@yaml_mapped_key_start@let result=mapping.consume(node,position,core::yaml::RecordMappingFields::new(key,@lifted_value@),@yaml_mapping_key@,@null_reader@,|node,position|self.consume_item(node,position,source,inputs));self.mapping=mapping;@yaml_mapped_key_end@return result;}
self.consume_item(node,position,source,inputs)}
fn consume_item(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{
if self.depth==0{
if self.opened{return Err(RuntimeDiagnostic::new("yaml.collection-form","Repeated collection"));}
self.opened=true;
if matches!(node,core::yaml::Node::SequenceStart(None)) && !(@singleton_sequence@){self.depth=1;return Ok(())}
if !@singleton@{return Err(RuntimeDiagnostic::new("yaml.collection-form","Expected a sequence"));}
if @singleton_value@ && (matches!(node,core::yaml::Node::MappingStart(..)) || (matches!(node,core::yaml::Node::SequenceStart(..)) && (@singleton_sequence@))){self.single=true;}
else {
if !matches!(node,core::yaml::Node::Scalar(..)){return Err(RuntimeDiagnostic::new("yaml.collection-form","Expected a sequence or one scalar item"));}
@item_tag_read@let mut reader=item_@id@::YamlReader::new()?;let result=@yaml_consume_singleton@;self.rows.push(match result{Ok(())=>Ok(reader),Err(error)=>Err(error)});@yaml_finish_row_key@return Ok(())}}
let boundary=usize::from(!self.single);
if !self.single && self.depth==1 && matches!(node,core::yaml::Node::SequenceEnd){self.depth=0;return Ok(())}
let node=if self.depth==boundary{@item_tag_read@self.active=Some(item_@id@::YamlReader::new()?);node}else{node};
match &node{core::yaml::Node::MappingStart(_)|core::yaml::Node::SequenceStart(_)=>self.depth+=1,core::yaml::Node::MappingEnd|core::yaml::Node::SequenceEnd=>self.depth-=1,_=>{}}
if self.error.is_none() && let Err(error)=@yaml_consume_row@{self.error=Some(error);}
if self.depth==boundary{let reader=self.active.take().expect("started item");self.rows.push(match self.error.take(){Some(error)=>Err(error),None=>Ok(reader)});@yaml_finish_row_key@}
Ok(())}
fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{let present=@yaml_present@;if self.marker {let mut value=@canonical_rows@;value.present=true;@collection_marks_move@return Ok(value);}
if present && @lifted_key@.is_some() && !self.nil{self.mapping.finish()?;}
if self.depth!=0 || self.active.is_some(){return Err(RuntimeDiagnostic::new("value.missing","Incomplete collection"));}
if !present{return Ok(@yaml_missing@)}let rows=@yaml_finish_rows@;@empty_yaml_sequence@
let rows=if @omit_empty_slot@.is_some() && !rows.is_empty(){let canonical=@canonical_rows@;let mut remaining=rows.into_iter().map(Some).collect::<Vec<_>>();let mut positions=std::collections::HashMap::with_capacity(remaining.len());for (index,row) in remaining.iter().enumerate(){if let Some(row)=row && let Ok(name)=item_@id@::text(row,@lifted_index@){positions.entry(name.to_owned()).or_insert(index);}}let mut merged=Vec::with_capacity(canonical.rows.len()+remaining.len());for default in canonical.rows{let name=item_@id@::text(&default,@lifted_index@)?;if let Some(index)=positions.get(name).copied(){merged.push(remaining[index].take().unwrap_or(default));}else{merged.push(default);}}merged.extend(remaining.into_iter().flatten());merged}else{rows};
Ok(V@id@{rows,present,nil:self.nil,raw:None@collection_marks_received@})}
}
fn recover_yaml_row_@id@(source:&[u8],position:core::Position,index:usize,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let _=inputs;
let located=core::yaml::preserved_value_at(source,position)?;let source=located.as_slice();let property=None;
let bytes=if let Some(key)=@lifted_key@{core::yaml::preserved_record_mapping_item(source,property,index,key,@lifted_value@,@lifted_physical@,@key_reader@)?}else{core::yaml::@recovery_item@(source,property,index@recovery_tag@)?};Ok(bytes)}
fn read_yaml_events_@id@(source:&[u8],inputs:&InputView<'_>,events:impl core::yaml::Source)->core::Result<V@id@>{let mut state=YamlSequence@id@::new();events.visit(|node,position|state.consume(node,position,source,inputs))?;state.finish(source,inputs)}
fn read_plain_yaml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{if source.is_empty(){return Ok(@yaml_missing@)}read_yaml_events_@id@(source,inputs,core::yaml::DocumentSource(if source.is_empty(){b"{}"}else{source}))}
fn read_preserved_yaml_@id@(envelope:core::raw::Document,inputs:&InputView<'_>)->core::Result<V@id@>{let mut value=read_plain_yaml_@id@(&envelope.meaning,inputs)?;value.raw=Some(core::xml::Patch::read(&envelope.payload,&[],&item_@id@::qnames())?);Ok(value)}
fn read_yaml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{if @hidden@ && let Some(envelope)=decode_raw_@id@(source)?{return read_preserved_yaml_@id@(envelope,inputs)}match read_plain_yaml_@id@(source,inputs){Ok(value)=>Ok(value),Err(error)=>{let Some(envelope)=decode_raw_@id@(source)? else{return Err(error)};read_preserved_yaml_@id@(envelope,inputs)}}}
struct PreparedRows@id@{rows:Vec<item_@id@::Prepared>,raw:Option<core::xml::Tree>}
fn prepare_xml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<PreparedRows@id@>{let rows=value.rows.iter().enumerate().map(|(position,row)|item_@id@::prepare(row,&inputs.with_collection_position(position))).collect::<core::Result<Vec<_>>>()?;let mut result=PreparedRows@id@{rows,raw:None};if let Some(patch)=&value.raw{let ordinary=write_plain_xml_@id@(value,&result,inputs)?;if !patch.is_null(){result.raw=Some(patch.apply(core::xml::Tree::capture_with_value_qnames(&ordinary,@parent@,|path,occurrences|xml_qname_text_at_@id@(value,path,occurrences))?,core::xml::Name{namespace:@namespace@.into(),local:@physical@.into()},&[],&item_@id@::qnames())?);}}Ok(result)}
fn namespaces_xml_@id@<'a>(value:&'a V@id@,prepared:&'a PreparedRows@id@,names:&mut Vec<&'a str>){@extra_namespaces@if value.nil && !names.contains(&"http://www.w3.org/2001/XMLSchema-instance"){names.push("http://www.w3.org/2001/XMLSchema-instance");}for name in @route@{if !name.0.is_empty() && !names.contains(&name.0){names.push(name.0);}}for (row,prepared) in value.rows.iter().zip(&prepared.rows){item_@id@::namespaces(row,prepared,names);}if let Some(tree)=&prepared.raw{tree.collect_namespaces(names);}}
fn write_plain_fields_@id@<'a>(value:&V@id@,prepared:&'a PreparedRows@id@,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{if @nullable@ && !value.present{return Ok(())}
if value.nil{out.field_with_attributes(@parent@,"",&[core::xml::WriteAttribute{name:("http://www.w3.org/2001/XMLSchema-instance","nil"),value:core::xml::AttributeValue::Text("true")}]);return Ok(())}
@canonical_guard@
if !value.present{return Ok(())}
@write_rows@Ok(())}
fn write_xml_into_@id@<'a>(value:&V@id@,prepared:&'a PreparedRows@id@,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{if value.raw.is_some(){if let Some(tree)=&prepared.raw{@raw_write@}Ok(())}else{write_plain_fields_@id@(value,prepared,inputs,out)}}
fn write_plain_xml_@id@(value:&V@id@,prepared:&PreparedRows@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{if @document@ && (@document_omit@){return Ok(Vec::new())}let mut names=Vec::new();namespaces_xml_@id@(value,prepared,&mut names);let mut out=core::xml::Writer::new(&names);write_plain_fields_@id@(value,prepared,inputs,&mut out)?;Ok(out.finish_with_root((@parent@)[0]))}
fn write_xml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{if @document@ && (((@document_omit@) && value.raw.is_none()) || value.raw.as_ref().is_some_and(|patch|patch.is_null())){return Ok(Vec::new())}let prepared=prepare_xml_@id@(value,inputs)?;let mut names=Vec::new();namespaces_xml_@id@(value,&prepared,&mut names);let mut out=core::xml::Writer::new(&names);write_xml_into_@id@(value,&prepared,inputs,&mut out)?;Ok(out.finish_with_root((@parent@)[0]))}
fn write_yaml_into_@id@(value:&V@id@,inputs:&InputView<'_>,out:&mut String)->core::Result<()>{core::yaml::append_properties(out,|out|write_yaml_indented_@id@(value,inputs,out,"",false))}
fn write_yaml_indented_@id@(value:&V@id@,inputs:&InputView<'_>,out:&mut String,indent:&str,_lift:bool)->core::Result<()>{if @hidden@ || !value.present{return Ok(())}
let mark=collection_mark_@id@(value,inputs)?;
if mark.is_none() && (@omit_empty_yaml@ && value.rows.is_empty() && value.raw.is_none() && !value.nil){return Ok(())}
@omit_guard@
if !@root_yaml@{out.push_str(indent);out.push_str(&core::yaml::scalar(@key@));out.push(':');}
if let Some(mark)=&mark{if !@root_yaml@{out.push(' ');}out.push_str(mark);}
if value.nil{if !@root_yaml@{out.push(' ');}out.push_str("null");return Ok(())}
if @lifted_key@.is_some(){return write_mapping_rows_@id@(value,inputs,out,indent);}
if value.rows.is_empty(){if !@root_yaml@{out.push(' ');}out.push_str("[]");return Ok(())}
if mark.is_none() && @singleton@ && value.rows.len()==1{let inputs=&inputs.with_collection_position(0);let mut rendered=String::new();item_@id@::write_yaml(&value.rows[0],inputs,&mut rendered,"")?;if let Some(scalar)=core::yaml::inline_scalar_rendering(&rendered){if !@root_yaml@{out.push(' ');}@item_tag_singleton@out.push_str(scalar);return Ok(())}
if @singleton_value@ && (!rendered.starts_with(['-', '[', '!']) || (!rendered.starts_with('!') && (@singleton_sequence@))) {
if rendered=="{}" {@singleton_empty_prefix@out.push_str("{}");}
else {@singleton_record_prefix@let row_indent=if @root_yaml@{indent.to_owned()}else{format!("{indent}  ")};core::yaml::Indented::new(out,&row_indent).push_str(&rendered);}
return Ok(())}}

write_yaml_rows_@id@::<@root_yaml@,@item_mark_const@>(value,inputs,out,indent,@item_mark_value@)}
// Ordinary and grouped output share one row writer; compile-time modes keep
// normal conversion free of runtime dispatch by metadata or representation.
#[allow(dead_code)] fn write_yaml_sequence_items_@id@<const ROOT:bool,const MARKED:bool>(value:&V@id@,inputs:&InputView<'_>,out:&mut String,indent:&str,mark:&str)->core::Result<()>{
if value.raw.is_some() || value.nil || !value.present{return Err(RuntimeDiagnostic::new("yaml.group-envelope","Sequence items require a present ordinary sequence"));}
write_yaml_rows_@id@::<ROOT,MARKED>(value,inputs,out,indent,mark)}
fn write_yaml_rows_@id@<const ROOT:bool,const MARKED:bool>(value:&V@id@,inputs:&InputView<'_>,out:&mut String,indent:&str,mark:&str)->core::Result<()>{
let row_indent=format!("{indent}{}",if ROOT{"  "}else{"    "});for (index,row) in value.rows.iter().enumerate(){let inputs=&inputs.with_collection_position(index);if !ROOT || index>0 || (!out.is_empty() && !out.ends_with('\n')){out.push('\n');}out.push_str(indent);out.push_str(if ROOT{"-"}else{"  -"});@item_tag_write@if @compact_item@ && !(MARKED && @compact_mapping_item@){let mut rendered=String::new();item_@id@::write_yaml(row,inputs,&mut rendered,"")?;if rendered.is_empty()||rendered.trim()=="null"{}else if @compact_mapping_item@{if let Some((first,rest))=rendered.split_once('\n'){out.push(' ');out.push_str(first);out.push('\n');core::yaml::Indented::new(out,&row_indent).push_str(rest);}else{out.push(' ');out.push_str(&rendered);}}else if let Some((tag,rest))=rendered.split_once('\n').filter(|(tag,_)|@local_row_boundary@ && tag.starts_with("!xml/")){out.push(' ');out.push_str(tag);out.push('\n');core::yaml::Indented::new(out,&row_indent).push_str(rest);}else if rendered.contains('\n'){out.push('\n');core::yaml::Indented::new(out,&row_indent).push_str(&rendered);}else{out.push(' ');out.push_str(&rendered);}}else{out.push('\n');let start=out.len();item_@id@::write_yaml(row,inputs,out,&row_indent)?;if out.len()==start{out.push_str(&row_indent);out.push_str("{}");}}@item_tag_finish@}Ok(())}
fn write_mapping_rows_@id@(value:&V@id@,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{
if value.rows.is_empty(){if !@root_yaml@{out.push(' ');}out.push_str("{}");return Ok(())}
let elidable=if let Some(slot)=@omit_empty_slot@ {Some(inputs.sequence(slot)?.iter().filter_map(|value|match value{InputValue::Text(name)=>Some(name.as_str()),_=>None}).collect::<std::collections::HashSet<_>>())}else{None};
let mut seen=std::collections::HashSet::new();let mut omitted=0usize;let row_indent=format!("{indent}{}",if @root_yaml@{"  "}else{"    "});
for (position,row) in value.rows.iter().take(@max_items@).enumerate(){let inputs=&inputs.with_collection_position(position);if !item_@id@::key_can_be_lifted(row){continue;}
let key=match item_@id@::text(row,@lifted_index@){Ok(key)=>key,Err(error) if error.code.as_deref()==Some("fact.unready")=>continue,Err(error)=>return Err(error)};let mut rendered=String::new();item_@id@::write_mapping_value(row,inputs,&mut rendered,"")?;
if rendered.is_empty() && elidable.as_ref().is_some_and(|names|names.contains(key)){omitted+=1;continue;}
let empty_form=false;@key_mapper@ if !seen.insert(key.to_owned()){continue;}
if !@root_yaml@ || seen.len()>1{out.push('\n');}out.push_str(indent);if !@root_yaml@{out.push_str("  ");}
if let Some(annotation)=annotation{out.push_str(annotation);out.push(' ');}out.push_str(&core::yaml::scalar(key));out.push(':');let trimmed=rendered.trim_start();let structured=rendered.contains('\n')||trimmed.starts_with(['{','[','-'])||(!trimmed.starts_with(['\"','\''])&&trimmed.contains(':'));if @empty_row_null@ && (rendered.is_empty() || rendered.trim()=="{}"){}else if rendered.is_empty(){if !empty_form{out.push('\n');out.push_str(&row_indent);out.push_str("{}");}}else if let Some((tag,rest))=core::yaml::tagged_block(&rendered){out.push(' ');out.push_str(tag);out.push('\n');core::yaml::Indented::new(out,&row_indent).push_str(rest);}else if structured{out.push('\n');core::yaml::Indented::new(out,&row_indent).push_str(&rendered);}else{out.push(' ');out.push_str(&rendered);}}
if seen.is_empty(){if !@root_yaml@{out.push(' ');}
if omitted>0 && let Some(tag)=@empty_tag@ {out.push('!');out.push_str(tag);}else{out.push_str("{}");}}
Ok(())}
fn write_yaml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let mut out=String::new();write_yaml_into_@id@(value,inputs,&mut out)?;let bytes=out.into_bytes();if let Some(patch)=&value.raw{encode_raw_@id@(&bytes,patch.to_yaml().as_bytes())}else{Ok(bytes)}}
fn check_rows_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>,xml:bool)->Vec<RuntimeDiagnostic>{let mut issues=Vec::new();for (index,row) in value.rows.iter().enumerate(){let inputs=&inputs.with_collection_position(index);issues.extend(item_@id@::check(row,source,inputs,xml).into_iter().map(|mut issue|{if @path_prefix@{issue.path.insert(0,@key@.into());}issue.occurrence=std::num::NonZeroU32::new(index as u32+1);issue}));}issues}
@whole_collection_issues@
@collection_mark_function@
@collection_check_xml@
@collection_check_yaml@
#[allow(dead_code)] fn xml_scalar_@id@(value:&V@id@,path:&[core::xml::Name])->bool{let _=(value,path);@scalar@}
#[allow(dead_code)] fn xml_qnames_@id@()->Vec<(&'static str,&'static str)>{item_@id@::qnames()}
fn xml_qname_attribute_@id@(path:&[core::xml::Name],name:&core::xml::Name)->bool{item_@id@::qname_attribute(path,name)}
fn xml_qname_text_@id@(path:&[core::xml::Name])->bool{item_@id@::qname_text(path)}
#[allow(dead_code)] fn xml_qname_text_at_@id@(value:&V@id@,path:&[core::xml::Name],occurrences:&[usize])->bool{@preserved_qname@occurrences.get(@depth@).and_then(|index|value.rows.get(index-1)).is_some_and(|row|item_@id@::qname_text_at(row,path,occurrences))}
fn xml_scalar_at_@id@(value:&V@id@,path:&[core::xml::Name],occurrences:&[usize])->bool{occurrences.get(@depth@).and_then(|index|value.rows.get(index-1)).is_some_and(|row|item_@id@::scalar(row,path,occurrences))}
fn prove_xml_@id@(value:&V@id@,original:&[u8],restored:&[u8])->core::Result<()>{core::proof::verify_with_value_qnames(original,restored,&[],|path,occurrences|xml_scalar_at_@id@(value,path,occurrences),xml_qname_attribute_@id@,|path,occurrences|xml_qname_text_at_@id@(value,path,occurrences))}
fn verify_@id@(original:&[u8],candidate:&[u8],inputs:&InputView<'_>)->core::Result<()>{let value=read_yaml_@id@(candidate,inputs)?;if let Some(error)=check_yaml_@id@(&value,candidate,inputs).into_iter().find(|error|error.severity==Severity::Error){return Err(error)}prove_xml_@id@(&value,original,&write_xml_@id@(&value,inputs)?)}
fn refine_rows_@id@(original:&[u8],value:&V@id@,inputs:&InputView<'_>)->core::Result<Option<Vec<u8>>>{
let route=@route@;
let mut rows=Vec::with_capacity(value.rows.len());
core::xml::visit_property_documents(original,route,|document|{
let inputs=&inputs.with_collection_position(rows.len());
@refine_row@ Ok(())
})?;
if rows.is_empty(){return Ok(None)}
write_yaml_@id@(&V@id@{rows,present:value.present,nil:false,raw:None@collection_marks_initial@},inputs).map(Some)
}
fn finalize_yaml_@id@(original:&[u8],mut candidate:Vec<u8>,value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{
let mut unprojectable=false;

match verify_@id@(original,&candidate,inputs){Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>{},Err(error) if (error.kind==core::annotations::IssueKind::Semantic && error.severity==Severity::Error) || error.code.as_deref().is_some_and(|code|code=="yaml.document"||(@local_row_boundary@&&code.starts_with("yaml.")))=>{let mut fallback=String::new();if !@hidden@{if !@root_yaml@{fallback.push_str(&core::yaml::scalar(@key@));fallback.push_str(": ");}fallback.push_str(if @lifted_key@.is_some(){"{}"}else{"[]"});}candidate=fallback.into_bytes();unprojectable=true;},Err(error)=>return Err(error)}
if @semantic_only@{return Ok(candidate)}
if (!unprojectable || @local_row_boundary@) && value.raw.is_none() && value.present{
let refined=refine_rows_@id@(original,value,inputs);
match refined{Ok(Some(bytes))=>{match verify_@id@(original,&bytes,inputs){Ok(())=>return Ok(bytes),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch") || (error.kind==core::annotations::IssueKind::Semantic && error.severity==Severity::Error)=>candidate=bytes,Err(error)=>return Err(error)}},Ok(None)=>{},Err(error) if (error.kind==core::annotations::IssueKind::Semantic && error.severity==Severity::Error) || matches!(error.code.as_deref(),Some("xml.round-trip-mismatch"|"xml.unknown-field"|"xml.unknown-attribute"|"xml.unexpected-text"|"xml.duplicate-field"|"xml.preservation-shape"|"value.missing"|"yaml.raw-envelope"))=>{},Err(error)=>return Err(error)}
}
let restored_value=read_yaml_@id@(&candidate,inputs)?;let ordinary=write_xml_@id@(&restored_value,inputs)?;let base=core::xml::Tree::capture_with_value_qnames(&ordinary,@parent@,|path,occurrences|xml_qname_text_at_@id@(&restored_value,path,occurrences))?;let tree=core::xml::Tree::capture_with_value_qnames(original,@parent@,|path,occurrences|xml_qname_text_at_@id@(value,path,occurrences))?;let payload=match tree{Some(tree)=>tree.patch_yaml(base.as_ref(),&[],&item_@id@::qnames())?,None=>"null".into()};let annotated=encode_raw_@id@(&candidate,payload.as_bytes())?;verify_@id@(original,&annotated,inputs)?;Ok(annotated)}
"#;
