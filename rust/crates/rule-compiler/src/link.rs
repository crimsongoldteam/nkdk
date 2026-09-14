use crate::diagnostic;
use crate::plan::{RepresentationSide, check_coverage};
mod bindings;
mod boolean;
mod choice_contracts;
mod collections;
mod composition;
mod constraints;
mod contributions;
mod denotations;
mod dependencies;
mod enumeration;
mod expressions;
mod index_inputs;
mod names;
mod normalization;
mod parameters;
mod patterns;
mod presence;
mod resources;
mod scalar_contracts;
mod scalar_inputs;
mod scalar_parameters;
pub(crate) mod sequence_item;
mod shorthands;
mod state_relations;
mod text;
mod text_pattern;
mod text_projection;
pub(crate) mod text_sequence;
mod text_table;
mod type_graph;
mod xml_attributes;
mod xml_tree;
use bindings::resolve_bindings;
use nkdk_rule_model::*;
use std::collections::{BTreeMap, BTreeSet};

pub fn link(modules: &[Module]) -> Result<Program, Vec<Diagnostic>> {
    let mut indexed = BTreeMap::new();
    let mut errors = vec![];
    for module in modules {
        if let Some(first) = indexed.insert(module.id.as_str(), module) {
            let mut error = diagnostic("duplicate_id", &module.source, "Duplicate declaration id");
            error.related.push(first.source.clone());
            errors.push(error);
        }
    }
    if !errors.is_empty() {
        return Err(errors);
    }
    let ids: BTreeMap<_, _> = indexed
        .keys()
        .enumerate()
        .map(|(index, name)| (*name, index as u32))
        .collect();
    for module in indexed.values() {
        for import in &module.imports {
            if !indexed.contains_key(import.value.as_str()) {
                errors.push(diagnostic(
                    "missing_import",
                    &import.source,
                    "Imported declaration does not exist",
                ));
            }
            if forbidden_dependency(&module.id, &import.value) {
                errors.push(diagnostic(
                    "forbidden_dependency",
                    &import.source,
                    "Import violates declaration layer direction",
                ));
            }
        }
    }
    if !errors.is_empty() {
        return Err(errors);
    }
    type_graph::validate(&indexed)?;
    if let Some(expanded) = index_inputs::infer(&indexed, &ids).map_err(|error| vec![error])? {
        return link(&expanded);
    }
    for module in indexed.values() {
        names::validate(module).map_err(|error| vec![error])?;
        text::validate(module).map_err(|error| vec![error])?;
        for definition in &module.types {
            if !matches!(definition.definition, TypeDefinition::TextTransform(_)) {
                resolve_type(
                    module,
                    &definition.definition,
                    &definition.source,
                    &indexed,
                    &ids,
                    &mut BTreeSet::new(),
                )
                .map_err(|error| vec![error])?;
            }
        }
    }
    let mut cache = BTreeMap::new();
    for module in indexed.values() {
        if let Err(error) = build_entry(module, &indexed, &ids, &mut BTreeSet::new(), &mut cache) {
            errors.push(error);
        }
    }
    if errors.is_empty() {
        text_pattern::types(&cache).map_err(|error| vec![error])?;
        text_sequence::types(&cache).map_err(|error| vec![error])?;
        crate::plan::xml_ownership::validate(&cache).map_err(|error| vec![error])?;
        let mut entries: Vec<_> = cache.into_values().collect();
        scalar_parameters::specialize(&mut entries).map_err(|error| vec![error])?;
        scalar_contracts::lift(&mut entries).map_err(|error| vec![error])?;
        choice_contracts::lift(&mut entries).map_err(|error| vec![error])?;
        contributions::validate_inputs(&entries).map_err(|error| vec![error])?;
        let program = Program { entries };
        state_relations::validate(modules, &program).map_err(|error| vec![error])?;
        for entry in &program.entries {
            for side in [RepresentationSide::Xml, RepresentationSide::Yaml] {
                crate::plan::scopes::read_schedule(&entry.value, &entry.presence, side, &program)
                    .map_err(|error| vec![error])?;
            }
            if matches!(entry.yaml, YamlRepresentation::RecordMapping { .. }) {
                sequence_item::resolve(entry, &program).map_err(|error| vec![error])?;
            }
        }
        Ok(program)
    } else {
        Err(errors)
    }
}

fn build_entry(
    module: &Module,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
    visiting: &mut BTreeSet<u32>,
    cache: &mut BTreeMap<u32, LinkedEntry>,
) -> Result<LinkedEntry, Diagnostic> {
    let id = ids[module.id.as_str()];
    if let Some(entry) = cache.get(&id) {
        return Ok(entry.clone());
    }
    if !visiting.insert(id) {
        return Err(diagnostic(
            "composition_cycle",
            &module.source,
            "Fragment composition is cyclic",
        ));
    }
    let mut entry = LinkedEntry {
        id,
        field_dependencies: vec![],
        input_indexes: module.input_indexes.clone(),
        text_transforms: text::transforms(module),
        normalization: normalization::resolve(module, modules, ids)?,
        presence: presence::resolve(module, modules, ids)?,
        shorthands: shorthands::resolve(module, modules, ids)?,
        constraints: constraints::resolve_constraints(module, modules, ids)?,
        contributions: contributions::resolve(module, modules, ids)?,
        resources: resources::resolve(module, modules, ids)?,
        parameters: parameters::resolve_parameters(module, modules, ids)?,
        name: module.id.clone(),
        namespaces: module.namespaces.clone(),
        kind: module.kind.clone(),
        value: resolve_type(
            module,
            &module.value,
            &module.source,
            modules,
            ids,
            &mut BTreeSet::new(),
        )?,
        inputs: module
            .inputs
            .iter()
            .map(|input| {
                Ok(LinkedField {
                    name: input.name.clone(),
                    value: resolve_data_type(
                        module,
                        &input.definition,
                        &input.source,
                        modules,
                        ids,
                        &mut BTreeSet::new(),
                    )?,
                    source: input.source.clone(),
                })
            })
            .collect::<Result<_, Diagnostic>>()?,
        xml: resolve_xml(
            module,
            &module.representations.xml,
            &module.source,
            modules,
            ids,
        )?,
        yaml: text_table::resolve(module, |name| {
            build_entry(modules[name], modules, ids, visiting, cache)
        })?,
        source: module.source.clone(),
    };
    if let TypeDefinition::Use(usage) = &module.value {
        let import = module
            .imports
            .iter()
            .find(|import| import.name == usage.name)
            .expect("resolved value import");
        let source = build_entry(
            modules[import.value.as_str()],
            modules,
            ids,
            visiting,
            cache,
        )?;
        text_projection::apply(&mut entry, &source)?;
    }
    if let YamlRepresentation::KeyedMapping { shorthand, .. } = &mut entry.yaml {
        shorthand.clear();
    }
    if !module.compose.is_empty() {
        if module.kind == ModuleKind::Value {
            return Err(diagnostic(
                "invalid_composition_role",
                &module.source,
                "Value cannot compose fragments",
            ));
        }
        let mut included_fields = vec![];
        let mut included_xml = vec![];
        let mut included_attributes = vec![];
        let mut included_yaml = vec![];
        let mut included_constraints = vec![];
        let mut included_contributions = vec![];
        let mut included_resources = vec![];
        let mut included_presence = vec![];
        for usage in &module.compose {
            let import = module
                .imports
                .iter()
                .find(|import| import.name == usage.name)
                .ok_or_else(|| {
                    diagnostic(
                        "missing_import_alias",
                        &usage.source,
                        "Fragment alias is not declared",
                    )
                })?;
            let target = modules[import.value.as_str()];
            if target.kind != ModuleKind::Fragment {
                return Err(diagnostic(
                    "expected_fragment",
                    &usage.source,
                    "Composition target must be a fragment",
                ));
            }
            if target.normalization.is_some() {
                return Err(diagnostic(
                    "unsupported_link_feature",
                    &usage.source,
                    "Fragment normalization is not linked yet",
                ));
            }
            if target
                .presence
                .iter()
                .any(|rule| matches!(rule.target, PresenceTarget::SelfValue))
            {
                return Err(diagnostic(
                    "unsupported_link_feature",
                    &usage.source,
                    "Fragment presence relocation is not linked yet",
                ));
            }
            let bindings = resolve_bindings(module, target, usage, modules, ids)?;
            let arguments = parameters::resolve_arguments(module, target, usage, modules, ids)?;
            let mut fragment = build_entry(target, modules, ids, visiting, cache)?;
            composition::instantiate(
                &mut fragment,
                included_fields.len() as u32,
                &bindings,
                &arguments,
            )?;
            included_constraints.extend(fragment.constraints);
            included_contributions.extend(fragment.contributions);
            included_resources.extend(fragment.resources);
            included_presence.extend(fragment.presence);
            let (
                LinkedType::Record(fields),
                Some((xml, attributes)),
                YamlRepresentation::Mapping(yaml),
            ) = (
                fragment.value,
                composition::take_record(fragment.xml),
                fragment.yaml,
            )
            else {
                return Err(diagnostic(
                    "unsupported_link_feature",
                    &usage.source,
                    "Fragment requires record representations",
                ));
            };
            included_fields.extend(fields);
            included_xml.extend(xml);
            included_attributes.extend(attributes);
            included_yaml.extend(yaml);
        }
        let (LinkedType::Record(fields), Some(xml), YamlRepresentation::Mapping(yaml)) = (
            &mut entry.value,
            composition::record_fields(&mut entry.xml),
            &mut entry.yaml,
        ) else {
            return Err(diagnostic(
                "unsupported_link_feature",
                &module.source,
                "Composition requires record representations",
            ));
        };
        included_presence.append(&mut entry.presence);
        entry.presence = included_presence;
        let mut presence_targets = BTreeMap::new();
        for rule in &entry.presence {
            let target = match rule.target {
                LinkedPresenceTarget::SelfValue => None,
                LinkedPresenceTarget::Field(index) => Some(index),
            };
            if let Some(first) = presence_targets.insert(target, &rule.source) {
                let mut error = diagnostic(
                    "duplicate_presence",
                    &rule.source,
                    "Composed presence targets collide",
                );
                error.related.push(first.clone());
                return Err(error);
            }
        }
        included_contributions.append(&mut entry.contributions);
        entry.contributions = included_contributions;
        included_resources.append(&mut entry.resources);
        entry.resources = included_resources;
        included_constraints.append(&mut entry.constraints);
        entry.constraints = included_constraints;
        let mut constraint_names = BTreeMap::new();
        for constraint in &entry.constraints {
            if let Some(first) = constraint_names.insert(&constraint.id, &constraint.source) {
                let mut error = diagnostic(
                    "duplicate_constraint",
                    &constraint.source,
                    "Composed constraint ids collide",
                );
                error.related.push(first.clone());
                return Err(error);
            }
        }
        included_fields.append(fields);
        included_xml.append(xml);
        included_yaml.append(yaml);
        *fields = included_fields;
        *xml = included_xml;
        *yaml = included_yaml;
        let mut seen = BTreeMap::new();
        for field in fields.iter() {
            if let Some(first) = seen.insert(&field.name, &field.source) {
                let mut error =
                    diagnostic("duplicate_field", &field.source, "Composed fields collide");
                error.related.push(first.clone());
                return Err(error);
            }
        }
        if !included_attributes.is_empty() {
            let content = std::mem::replace(&mut entry.xml, LinkedXml::Text);
            entry.xml = LinkedXml::WithAttributes {
                attributes: included_attributes,
                content: Box::new(content),
            };
        }
    }
    scalar_contracts::inherit_presence(&mut entry, modules, ids, visiting, cache)?;
    entry.field_dependencies = dependencies::field_dependencies(&entry.value, &entry.presence)?;
    validate_xml(&entry.value, &entry.xml, &entry.presence, &entry.source)?;
    validate_yaml(&entry.value, &entry.yaml, &entry.presence, &entry.source)?;
    sequence_item::validate(&entry)?;
    visiting.remove(&id);
    cache.insert(id, entry.clone());
    Ok(entry)
}

fn forbidden_dependency(from: &str, to: &str) -> bool {
    let applied = to.starts_with("applied.");
    let forms = to.starts_with("forms.") || to.starts_with("form.");
    (from.starts_with("common.") && (applied || forms))
        || ((from.starts_with("forms.") || from.starts_with("form.")) && applied)
        || ((from.starts_with("system.") || from.starts_with("system-enumerations."))
            && (applied || forms))
}

fn resolve_type(
    module: &Module,
    value: &TypeDefinition,
    source: &SourceLocation,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
    visiting: &mut BTreeSet<String>,
) -> Result<LinkedType, Diagnostic> {
    Ok(match value {
        TypeDefinition::IndexFromBinding(_) => {
            return Err(diagnostic(
                "unresolved_index_input",
                source,
                "Prepared index input type has not been inferred",
            ));
        }
        TypeDefinition::Index { key, value } => LinkedType::Index {
            key: Box::new(resolve_type(module, key, source, modules, ids, visiting)?),
            value: Box::new(resolve_type(module, value, source, modules, ids, visiting)?),
        },
        TypeDefinition::ScalarChoice(variants) => LinkedType::ScalarChoice(variants.clone()),
        TypeDefinition::Enum(variants) => {
            enumeration::variants(variants, source)?;
            LinkedType::Enum(variants.clone())
        }
        TypeDefinition::Scalar(value) => LinkedType::Scalar(value.clone()),
        TypeDefinition::Sequence(item) => LinkedType::Sequence(Box::new(resolve_type(
            module, item, source, modules, ids, visiting,
        )?)),
        TypeDefinition::Record(fields) | TypeDefinition::Choice(fields) => {
            let mut seen = BTreeMap::new();
            let mut output = vec![];
            for field in fields {
                if let Some(first) = seen.insert(&field.name, &field.source) {
                    let mut error =
                        diagnostic("duplicate_field", &field.source, "Repeated record field");
                    error.related.push(first.clone());
                    return Err(error);
                }
                output.push(LinkedField {
                    name: field.name.clone(),
                    value: resolve_type(
                        module,
                        &field.definition,
                        &field.source,
                        modules,
                        ids,
                        visiting,
                    )?,
                    source: field.source.clone(),
                });
            }
            if matches!(value, TypeDefinition::Choice(_)) {
                if output.is_empty()
                    || output.iter().any(|variant| {
                        variant.name.is_empty()
                            || !matches!(
                                variant.value,
                                LinkedType::Reference(_) | LinkedType::BoundReference { .. }
                            )
                    })
                {
                    return Err(diagnostic(
                        "choice_variants",
                        source,
                        "Choice requires named referenced value variants",
                    ));
                }
                LinkedType::Choice(output)
            } else {
                LinkedType::Record(output)
            }
        }
        TypeDefinition::Local(name) => {
            let definition = module
                .types
                .iter()
                .find(|definition| &definition.name == name)
                .ok_or_else(|| {
                    diagnostic("missing_local_type", source, "Local type does not exist")
                })?;
            if !visiting.insert(name.clone()) {
                return Err(diagnostic(
                    "local_type_cycle",
                    source,
                    "Recursive local type is unsupported in this linking profile",
                ));
            }
            let result = resolve_type(
                module,
                &definition.definition,
                &definition.source,
                modules,
                ids,
                visiting,
            )?;
            visiting.remove(name);
            result
        }
        TypeDefinition::Use(usage) => {
            let import = module
                .imports
                .iter()
                .find(|import| import.name == usage.name)
                .ok_or_else(|| {
                    diagnostic(
                        "missing_import_alias",
                        &usage.source,
                        "Import alias is not declared",
                    )
                })?;
            let target = modules[import.value.as_str()];
            let bindings = resolve_bindings(module, target, usage, modules, ids)?;
            let arguments = parameters::resolve_arguments(module, target, usage, modules, ids)?;
            if bindings.is_empty() && arguments.is_empty() {
                LinkedType::Reference(ids[import.value.as_str()])
            } else {
                LinkedType::BoundReference {
                    entry: ids[import.value.as_str()],
                    bindings,
                    arguments,
                }
            }
        }
        TypeDefinition::TextTransform(_) => {
            return Err(diagnostic(
                "non_serializable_type",
                source,
                "Text transform cannot be a serialized value type",
            ));
        }
    })
}

fn resolve_xml(
    module: &Module,
    xml: &XmlRepresentation,
    source: &SourceLocation,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<LinkedXml, Diagnostic> {
    Ok(match xml {
        XmlRepresentation::ScalarChoice(choice) => {
            let expand = |name: &String| -> Result<ExpandedName, Diagnostic> {
                Ok(expand_path(module, std::slice::from_ref(name), source)?.remove(0))
            };
            let attribute = expand(&choice.attribute)?;
            if attribute.namespace != "http://www.w3.org/2001/XMLSchema-instance"
                || attribute.local != "type"
            {
                return Err(diagnostic(
                    "unsupported_choice_selector",
                    source,
                    "The scalar choice selector currently requires xsi:type",
                ));
            }
            if choice.otherwise != ScalarType::Text
                || choice.cases.len() != 1
                || choice.cases[0].scalar != ScalarType::Decimal
                || choice.cases[0].values.is_empty()
            {
                return Err(diagnostic(
                    "invalid_choice_coverage",
                    source,
                    "Expected a numeric selector and a text fallback",
                ));
            }
            let mut seen = BTreeSet::new();
            let cases = choice
                .cases
                .iter()
                .map(|case| {
                    let values = case
                        .values
                        .iter()
                        .map(expand)
                        .collect::<Result<Vec<_>, _>>()?;
                    for value in &values {
                        if !seen.insert((value.namespace.clone(), value.local.clone())) {
                            return Err(diagnostic(
                                "ambiguous_choice_selector",
                                source,
                                "A QName selects more than one alternative",
                            ));
                        }
                    }
                    let emit = case.emit.as_ref().map(expand).transpose()?;
                    if emit.as_ref().is_some_and(|emit| !values.contains(emit)) {
                        return Err(diagnostic(
                            "invalid_choice_emit",
                            source,
                            "Canonical QName must select the emitted alternative",
                        ));
                    }
                    Ok(ScalarChoiceCase {
                        scalar: case.scalar.clone(),
                        values,
                        emit,
                    })
                })
                .collect::<Result<_, Diagnostic>>()?;
            LinkedXml::ScalarChoice(ScalarChoiceXml {
                attribute,
                cases,
                otherwise: choice.otherwise.clone(),
            })
        }
        XmlRepresentation::WithAttributes {
            attributes,
            content,
        } => LinkedXml::WithAttributes {
            attributes: xml_attributes::resolve(module, attributes, modules, ids)?,
            content: Box::new(resolve_xml(module, content, source, modules, ids)?),
        },
        XmlRepresentation::EnumTable(table) => LinkedXml::EnumTable(table.clone()),
        XmlRepresentation::Decimal => LinkedXml::Decimal,
        XmlRepresentation::FormattedDecimal(format) => LinkedXml::FormattedDecimal(format.clone()),
        XmlRepresentation::Text => LinkedXml::Text,
        XmlRepresentation::Choice => LinkedXml::Choice,
        XmlRepresentation::TextPattern(parts) => LinkedXml::TextPattern(parts.clone()),
        XmlRepresentation::TextSequence { separator } => LinkedXml::TextSequence {
            separator: separator.clone(),
        },
        XmlRepresentation::Calendar => LinkedXml::Calendar,
        XmlRepresentation::BooleanTable(table) => LinkedXml::BooleanTable(table.clone()),
        XmlRepresentation::Tree(nodes) => {
            LinkedXml::Tree(xml_tree::resolve(module, nodes, modules, ids)?)
        }
        XmlRepresentation::Declared => LinkedXml::Declared,
        XmlRepresentation::ElementSequence { path, item } => {
            let mut context = module.clone();
            if let TypeDefinition::Sequence(value) = &module.value {
                context.value = *value.clone();
            }
            LinkedXml::ElementSequence {
                path: expand_path(module, path, source)?,
                item: Box::new(resolve_xml(&context, item, source, modules, ids)?),
            }
        }
        XmlRepresentation::QName { namespace, local } => LinkedXml::QName {
            namespace: namespace.clone(),
            local: local.clone(),
        },
        XmlRepresentation::Record(fields) => LinkedXml::Record(
            fields
                .iter()
                .map(|field| {
                    if field.file.is_some() && (module.kind == ModuleKind::Value || field.path.len() != 1 || field.attribute.is_some()) {
                        return Err(diagnostic("invalid_file_boundary", &field.source, "An external document must belong to an object or fragment and own its root element"));
                    }
                    Ok(LinkedXmlField {
                        file: field.file.clone(),
                        field: field.field.clone(),
                        path: expand_path(module, &field.path, &field.source)?,
                        attribute: field
                            .attribute
                            .as_ref()
                            .map(|name| {
                                if name == "xmlns" || name.starts_with("xmlns:") {
                                    return Err(diagnostic(
                                        "invalid_attribute_name",
                                        &field.source,
                                        "Namespace declarations are not value attributes",
                                    ));
                                }
                                expand_path(module, std::slice::from_ref(name), &field.source).map(
                                    |mut names| {
                                        let mut expanded = names.remove(0);
                                        if !name.contains(':') {
                                            expanded.namespace.clear();
                                        }
                                        expanded
                                    },
                                )
                            })
                            .transpose()?,
                        source: field.source.clone(),
                    })
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?,
        ),
    })
}

fn expand_path(
    module: &Module,
    path: &[String],
    source: &SourceLocation,
) -> Result<Vec<ExpandedName>, Diagnostic> {
    path.iter()
        .map(|name| {
            let (prefix, local) = name.split_once(':').unwrap_or(("", name));
            if !names::ncname(local)
                || (!prefix.is_empty() && !names::ncname(prefix))
                || name.starts_with(':')
            {
                return Err(diagnostic(
                    "invalid_qname",
                    source,
                    "Invalid XML qualified name",
                ));
            }
            let namespace = if prefix == "xml" {
                "http://www.w3.org/XML/1998/namespace".into()
            } else if let Some(binding) = module
                .namespaces
                .iter()
                .find(|binding| binding.name == prefix)
            {
                binding.value.clone()
            } else if prefix.is_empty() {
                String::new()
            } else {
                return Err(diagnostic(
                    "missing_namespace",
                    source,
                    "XML prefix is not declared",
                ));
            };
            Ok(ExpandedName {
                namespace,
                local: local.into(),
            })
        })
        .collect()
}

fn validate_xml(
    value: &LinkedType,
    xml: &LinkedXml,
    presence: &[LinkedPresence],
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    match (value, xml) {
        (LinkedType::Choice(_), LinkedXml::Choice) => {}
        (LinkedType::Sequence(_), LinkedXml::TextSequence { .. }) => {}
        (LinkedType::ScalarChoice(_), LinkedXml::ScalarChoice(_)) => {}
        (LinkedType::Record(fields), LinkedXml::TextPattern(parts)) => {
            text_pattern::fields(fields, parts, source)?
        }
        (_, LinkedXml::WithAttributes { content, .. }) => {
            xml_attributes::check_ownership(xml)?;
            validate_xml(value, content, presence, source)?;
        }
        (LinkedType::Record(fields), LinkedXml::QName { namespace, local }) => {
            if namespace == local
                || fields.len() != 2
                || [namespace, local].iter().any(|name| {
                    !fields.iter().any(|field| {
                        &field.name == *name && field.value == LinkedType::Scalar(ScalarType::Text)
                    })
                })
            {
                return Err(diagnostic(
                    "qname_fields",
                    source,
                    "QName requires two distinct text fields for namespace and local name",
                ));
            }
        }
        (LinkedType::Record(fields), LinkedXml::Record(mappings)) => {
            let names: BTreeSet<_> = fields.iter().map(|field| field.name.as_str()).collect();
            let mut covered = BTreeSet::new();
            for mapping in mappings {
                if !names.contains(mapping.field.as_str()) {
                    return Err(diagnostic(
                        "unknown_representation_field",
                        &mapping.source,
                        "XML mapping refers to unknown field",
                    ));
                }
                if !covered.insert(mapping.field.as_str()) {
                    return Err(diagnostic(
                        "duplicate_representation_field",
                        &mapping.source,
                        "Field has multiple XML mappings",
                    ));
                }
            }
            check_coverage(fields, &covered, presence, RepresentationSide::Xml, source)?;
        }
        (_, LinkedXml::Tree(nodes)) => xml_tree::validate(value, nodes, source)?,
        (LinkedType::Sequence(item), LinkedXml::ElementSequence { item: xml, .. }) => {
            validate_xml(item, xml, &[], source)?
        }
        (LinkedType::Scalar(ScalarType::Boolean), LinkedXml::BooleanTable(table)) => {
            validate_boolean_table(table, source)?
        }
        (LinkedType::Enum(variants), LinkedXml::EnumTable(table)) => {
            enumeration::table(variants, table, source)?
        }
        (
            LinkedType::Scalar(ScalarType::Decimal),
            LinkedXml::Decimal | LinkedXml::FormattedDecimal(_),
        ) => {}
        (LinkedType::Scalar(ScalarType::Text), LinkedXml::Text | LinkedXml::Calendar) => {}
        (
            LinkedType::Reference(_) | LinkedType::BoundReference { .. },
            LinkedXml::Text | LinkedXml::Declared,
        ) => {}
        _ => {
            return Err(diagnostic(
                "unsupported_link_feature",
                source,
                "XML representation requires unsupported type resolution",
            ));
        }
    }
    Ok(())
}

fn validate_yaml(
    value: &LinkedType,
    yaml: &YamlRepresentation,
    presence: &[LinkedPresence],
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    match (value, yaml) {
        (
            LinkedType::Reference(_) | LinkedType::BoundReference { .. },
            YamlRepresentation::Declared,
        ) => {}
        (LinkedType::Choice(_), YamlRepresentation::Choice) => {}
        (LinkedType::Sequence(_), YamlRepresentation::TextSequence { .. }) => {}
        (LinkedType::ScalarChoice(_), YamlRepresentation::ScalarChoice) => {}
        (LinkedType::Record(fields), YamlRepresentation::TextPattern(parts)) => {
            let represented: Vec<_> = fields.iter().filter(|field| parts.iter().any(|part| matches!(&part.value, TextPatternValue::Field(name) if name == &field.name))).cloned().collect();
            text_pattern::fields(&represented, parts, source)?;
            let covered = represented
                .iter()
                .map(|field| field.name.as_str())
                .collect();
            check_coverage(fields, &covered, presence, RepresentationSide::Yaml, source)?
        }
        (LinkedType::Record(fields), YamlRepresentation::Projection(name)) => {
            if fields.len() != 1 || fields[0].name != *name {
                return Err(diagnostic(
                    "invalid_yaml_projection",
                    source,
                    "A YAML projection must select the only record field",
                ));
            }
        }
        (LinkedType::Record(fields), YamlRepresentation::Mapping(mappings)) => {
            let names: BTreeSet<_> = fields.iter().map(|field| field.name.as_str()).collect();
            let mut covered = BTreeSet::new();
            let mut keys = BTreeMap::new();
            for mapping in mappings {
                if !names.contains(mapping.field.as_str()) {
                    return Err(diagnostic(
                        "unknown_representation_field",
                        &mapping.source,
                        "YAML mapping refers to unknown field",
                    ));
                }
                if !covered.insert(mapping.field.as_str()) {
                    return Err(diagnostic(
                        "duplicate_representation_field",
                        &mapping.source,
                        "Field has multiple YAML mappings",
                    ));
                }
                if let Some(first) = keys.insert(&mapping.key, &mapping.source) {
                    let mut error = diagnostic(
                        "yaml_key_collision",
                        &mapping.source,
                        "YAML key has multiple owners",
                    );
                    error.related.push(first.clone());
                    return Err(error);
                }
            }
            check_coverage(fields, &covered, presence, RepresentationSide::Yaml, source)?;
        }
        (
            LinkedType::Sequence(item),
            YamlRepresentation::Sequence {
                item: yaml,
                shorthand,
            },
        ) => {
            if !shorthand.is_empty() && **item != LinkedType::Scalar(ScalarType::Text) {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    source,
                    "Literal sequence shorthand requires text items",
                ));
            }
            validate_yaml(item, yaml, &[], source)?;
        }
        (LinkedType::Sequence(item), YamlRepresentation::RecordMapping { .. }) => {
            validate_yaml(item, &YamlRepresentation::Declared, &[], source)?;
        }
        (LinkedType::Sequence(item), YamlRepresentation::KeyedMapping { key, value, .. }) => {
            let LinkedType::Record(fields) = item.as_ref() else {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    source,
                    "Keyed mapping requires record items",
                ));
            };
            let key_field = fields
                .iter()
                .find(|field| &field.name == key)
                .ok_or_else(|| {
                    diagnostic(
                        "unknown_representation_field",
                        source,
                        "Mapping key field is absent",
                    )
                })?;
            if !fields.iter().any(|field| &field.name == value) {
                return Err(diagnostic(
                    "unknown_representation_field",
                    source,
                    "Mapping value field is absent",
                ));
            }
            if key == value || fields.len() != 2 {
                return Err(diagnostic(
                    "unrepresented_field",
                    source,
                    "Keyed mapping must represent each item field exactly once",
                ));
            }
            if key_field.value != LinkedType::Scalar(ScalarType::Text) {
                return Err(diagnostic(
                    "expression_type_mismatch",
                    &key_field.source,
                    "Mapping key must be text",
                ));
            }
        }
        (LinkedType::Scalar(ScalarType::Boolean), YamlRepresentation::BooleanTable(table)) => {
            boolean::yaml_table(table, presence, source)?
        }
        (LinkedType::Enum(variants), YamlRepresentation::States(table)) => {
            enumeration::states(variants, table, source)?
        }
        (LinkedType::Enum(variants), YamlRepresentation::EnumTable(table)) => {
            enumeration::table(variants, table, source)?
        }
        (
            LinkedType::Scalar(ScalarType::Text),
            YamlRepresentation::TextTable(TextTable::Resolved(_)),
        ) => {}
        (LinkedType::Scalar(ScalarType::Decimal), YamlRepresentation::Decimal) => {}
        (
            LinkedType::Reference(_) | LinkedType::BoundReference { .. },
            YamlRepresentation::Text,
        ) => {}
        (
            LinkedType::Scalar(ScalarType::Text),
            YamlRepresentation::Text | YamlRepresentation::Calendar { .. },
        ) => {}
        _ => {
            return Err(diagnostic(
                "unsupported_link_feature",
                source,
                "YAML representation requires unsupported type resolution",
            ));
        }
    }
    Ok(())
}

fn validate_boolean_table(
    table: &[BooleanLexeme],
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    let meanings: BTreeSet<_> = table.iter().map(|value| value.value).collect();
    let spellings: BTreeSet<_> = table.iter().map(|value| &value.text).collect();
    if table.len() != 2 || meanings.len() != 2 || spellings.len() != 2 {
        return Err(diagnostic(
            "ambiguous_boolean_table",
            source,
            "Canonical boolean table must map two values to distinct spellings",
        ));
    }
    Ok(())
}

fn resolve_data_type(
    module: &Module,
    value: &TypeDefinition,
    source: &SourceLocation,
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
    visiting: &mut BTreeSet<String>,
) -> Result<LinkedType, Diagnostic> {
    resolve_type(module, value, source, modules, ids, visiting)?;
    expressions::field_shape(module, value, source, modules, ids, visiting)
}
