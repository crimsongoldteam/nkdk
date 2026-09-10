mod bindings;
mod boolean;
mod collections;
mod composition;
mod constraints;
mod denotations;
mod dependencies;
mod enumeration;
mod expressions;
mod names;
mod normalization;
mod parameters;
mod patterns;
mod presence;
mod scalar_contracts;
mod shorthands;
mod text;
mod type_graph;
mod xml_attributes;
mod xml_ownership;
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
        xml_ownership::validate(&cache).map_err(|error| vec![error])?;
        let mut entries: Vec<_> = cache.into_values().collect();
        scalar_contracts::lift(&mut entries).map_err(|error| vec![error])?;
        Ok(Program { entries })
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
        text_transforms: text::transforms(module),
        normalization: normalization::resolve(module, modules, ids)?,
        presence: presence::resolve(module, modules, ids)?,
        shorthands: shorthands::resolve(module, modules, ids)?,
        constraints: constraints::resolve_constraints(module, modules, ids)?,
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
        yaml: module.representations.yaml.clone(),
        source: module.source.clone(),
    };
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
    entry.field_dependencies = dependencies::field_dependencies(&entry.value, &entry.presence)?;
    validate_xml(&entry.value, &entry.xml, &entry.presence, &entry.source)?;
    validate_yaml(&entry.value, &entry.yaml, &entry.presence, &entry.source)?;
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
        TypeDefinition::Enum(variants) => {
            enumeration::variants(variants, source)?;
            LinkedType::Enum(variants.clone())
        }
        TypeDefinition::Scalar(value) => LinkedType::Scalar(value.clone()),
        TypeDefinition::Sequence(item) => LinkedType::Sequence(Box::new(resolve_type(
            module, item, source, modules, ids, visiting,
        )?)),
        TypeDefinition::Record(fields) => {
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
            LinkedType::Record(output)
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
        XmlRepresentation::WithAttributes {
            attributes,
            content,
        } => LinkedXml::WithAttributes {
            attributes: xml_attributes::resolve(module, attributes, modules, ids)?,
            content: Box::new(resolve_xml(module, content, source, modules, ids)?),
        },
        XmlRepresentation::EnumTable(table) => LinkedXml::EnumTable(table.clone()),
        XmlRepresentation::Decimal => LinkedXml::Decimal,
        XmlRepresentation::Text => LinkedXml::Text,
        XmlRepresentation::Calendar => LinkedXml::Calendar,
        XmlRepresentation::BooleanTable(table) => LinkedXml::BooleanTable(table.clone()),
        XmlRepresentation::ElementSequence { path, item } => LinkedXml::ElementSequence {
            path: expand_path(module, path, source)?,
            item: Box::new(resolve_xml(module, item, source, modules, ids)?),
        },
        XmlRepresentation::Record(fields) => LinkedXml::Record(
            fields
                .iter()
                .map(|field| {
                    Ok(LinkedXmlField {
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

fn diagnostic(code: &str, source: &SourceLocation, message: &str) -> Diagnostic {
    Diagnostic {
        code: code.into(),
        file: source.file.clone(),
        line: source.line,
        column: source.column,
        message: message.into(),
        related: vec![],
    }
}

fn validate_xml(
    value: &LinkedType,
    xml: &LinkedXml,
    presence: &[LinkedPresence],
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    match (value, xml) {
        (_, LinkedXml::WithAttributes { content, .. }) => {
            xml_attributes::check_ownership(xml)?;
            validate_xml(value, content, presence, source)?;
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
        (LinkedType::Sequence(item), LinkedXml::ElementSequence { item: xml, .. }) => {
            validate_xml(item, xml, &[], source)?
        }
        (LinkedType::Scalar(ScalarType::Boolean), LinkedXml::BooleanTable(table)) => {
            validate_boolean_table(table, source)?
        }
        (LinkedType::Enum(variants), LinkedXml::EnumTable(table)) => {
            enumeration::table(variants, table, source)?
        }
        (LinkedType::Scalar(ScalarType::Decimal), LinkedXml::Decimal) => {}
        (LinkedType::Scalar(ScalarType::Text), LinkedXml::Text | LinkedXml::Calendar) => {}
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
        (LinkedType::Enum(variants), YamlRepresentation::EnumTable(table)) => {
            enumeration::table(variants, table, source)?
        }
        (LinkedType::Scalar(ScalarType::Decimal), YamlRepresentation::Decimal) => {}
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

enum RepresentationSide {
    Xml,
    Yaml,
}
fn check_coverage(
    fields: &[LinkedField],
    covered: &BTreeSet<&str>,
    presence: &[LinkedPresence],
    side: RepresentationSide,
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    for (index, field) in fields.iter().enumerate() {
        if covered.contains(field.name.as_str()) {
            continue;
        }
        let restored = presence.iter().any(|rule| {
            rule.target == LinkedPresenceTarget::Field(index as u32)
                && match side {
                    RepresentationSide::Xml => rule.xml_missing.is_some(),
                    RepresentationSide::Yaml => rule.yaml_missing.is_some(),
                }
        });
        if !restored {
            return Err(diagnostic(
                "unrepresented_field",
                source,
                "Record field has neither representation nor explicit restoration",
            ));
        }
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
