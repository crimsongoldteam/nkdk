mod catalog;
mod constraints;
mod contributions;
mod data_path;
mod decimal_text;
mod enumeration;
mod expressions;
mod presence;
mod resources;
mod scalar_choice;
mod sequence_shorthand;
mod shorthands;
mod state_relations;
mod states;
mod text;
mod text_pattern;
mod xml;
mod xml_tree;
use constraints::constraints;
use expressions::{expression, scalar_literal};
use presence::{normalization, presence};
use shorthands::shorthands;

use nkdk_rule_model::ComparisonOperator;
use nkdk_rule_model::{
    BooleanLexeme, Diagnostic, Module, ModuleKind, NamedBinding, NamedType, Representations,
    ScalarType, SourceLocation, TypeDefinition, TypeField, XmlRepresentation, YamlRepresentation,
    YamlSingleton,
};
use nkdk_rule_model::{CanonicalForm, Presence, PresenceTarget, XmlForm};
use nkdk_rule_model::{
    Constraint, DiagnosticDefinition, DiagnosticTarget, Severity, ValidationPhase,
};
use nkdk_rule_model::{EmptyForm, EmptyKind};
use nkdk_rule_model::{
    Expression, ExpressionField, ExpressionKind, Parameter, ScalarLiteral, Shorthand,
};
use nkdk_rule_model::{Iteration, MessageDefinition, MessagePart};
use nkdk_rule_model::{Normalization, TextTable};
use nkdk_rule_model::{StaticArgument, TypeUse};
use nkdk_rule_model::{XmlField, YamlField};
use yaml_rust2::{
    parser::Event,
    scanner::{Marker, TScalarStyle},
};

#[derive(Clone)]
enum Shape {
    Scalar(String, bool),
    Mapping(Vec<(Node, Node)>),
    Sequence(Vec<Node>),
}
#[derive(Clone)]
struct Node {
    shape: Shape,
    mark: Marker,
}

fn error(path: &str, mark: Marker, code: &str, message: impl Into<String>) -> Diagnostic {
    Diagnostic {
        code: code.into(),
        file: path.into(),
        line: mark.line(),
        column: mark.col() + 1,
        message: message.into(),
        related: vec![],
    }
}

fn node(
    path: &str,
    events: &mut std::iter::Peekable<std::vec::IntoIter<(Event, Marker)>>,
) -> Result<Node, Diagnostic> {
    // The event stream has already passed the syntax and key audit.
    let (event, mark) = events.next().expect("audited node event");
    let shape = match event {
        Event::Scalar(value, style, ..) => {
            let is_string = style != TScalarStyle::Plain
                || (!matches!(value.as_str(), "Null" | "NULL")
                    && matches!(
                        yaml_rust2::Yaml::from_str(&value),
                        yaml_rust2::Yaml::String(_)
                    ));
            Shape::Scalar(value, is_string)
        }
        Event::MappingStart(..) => {
            let mut entries = vec![];
            while !matches!(events.peek(), Some((Event::MappingEnd, _))) {
                let key = node(path, events)?;
                let value = node(path, events)?;
                entries.push((key, value));
            }
            events.next();
            Shape::Mapping(entries)
        }
        Event::SequenceStart(..) => {
            let mut items = vec![];
            while !matches!(events.peek(), Some((Event::SequenceEnd, _))) {
                items.push(node(path, events)?);
            }
            events.next();
            Shape::Sequence(items)
        }
        _ => {
            return Err(error(
                path,
                mark,
                "expected_node",
                "Expected a declaration node",
            ));
        }
    };
    Ok(Node { shape, mark })
}

impl Node {
    fn mapping<'a>(
        &'a self,
        path: &str,
        allowed: &[&str],
    ) -> Result<&'a [(Node, Node)], Diagnostic> {
        let Shape::Mapping(entries) = &self.shape else {
            return Err(error(
                path,
                self.mark,
                "expected_mapping",
                "Expected a mapping",
            ));
        };
        for (key, _) in entries {
            let name = key.text(path)?;
            if !allowed.contains(&name) {
                return Err(error(
                    path,
                    key.mark,
                    "unknown_key",
                    format!("Unknown key: {name}"),
                ));
            }
        }
        Ok(entries)
    }
    fn text<'a>(&'a self, path: &str) -> Result<&'a str, Diagnostic> {
        match &self.shape {
            Shape::Scalar(value, true) => Ok(value),
            Shape::Scalar(_, false) => Err(error(
                path,
                self.mark,
                "expected_string",
                "Expected a string without implicit coercion",
            )),
            _ => Err(error(
                path,
                self.mark,
                "expected_scalar",
                "Expected a scalar",
            )),
        }
    }
    fn field<'a>(
        &self,
        path: &str,
        entries: &'a [(Node, Node)],
        name: &str,
    ) -> Result<&'a Node, Diagnostic> {
        entries
            .iter()
            .find_map(|(key, value)| match &key.shape {
                Shape::Scalar(text, _) if text == name => Some(value),
                _ => None,
            })
            .ok_or_else(|| {
                error(
                    path,
                    self.mark,
                    "missing_key",
                    format!("Missing key: {name}"),
                )
            })
    }
    fn literal(&self, path: &str, expected: &str, code: &str) -> Result<(), Diagnostic> {
        if self.text(path)? != expected {
            return Err(error(path, self.mark, code, format!("Expected {expected}")));
        }
        Ok(())
    }
}

pub fn decode(path: &str, events: Vec<(Event, Marker)>) -> Result<Vec<Module>, Diagnostic> {
    let mut events = events.into_iter().peekable();
    while matches!(
        events.peek(),
        Some((Event::StreamStart | Event::DocumentStart, _))
    ) {
        events.next();
    }
    let Some((at_end, mark)) = events
        .peek()
        .map(|(event, mark)| (matches!(event, Event::StreamEnd), *mark))
    else {
        return Err(Diagnostic {
            code: "empty_document".into(),
            file: path.into(),
            line: 1,
            column: 1,
            message: "Expected a declaration".into(),
            related: vec![],
        });
    };
    if at_end {
        return Err(error(
            path,
            mark,
            "empty_document",
            "Expected a declaration",
        ));
    }
    let root = node(path, &mut events)?;
    catalog::decode(path, root)
}

fn module(path: &str, mut root: Node) -> Result<Module, Diagnostic> {
    catalog::expand_enum(path, &mut root)?;
    let fields = root.mapping(
        path,
        &[
            "format",
            "kind",
            "id",
            "description",
            "imports",
            "namespaces",
            "types",
            "inputs",
            "parameters",
            "presence",
            "state-relations",
            "normalization",
            "constraints",
            "contributions",
            "dataPath",
            "resources",
            "compose",
            "xmlOrder",
            "yamlOrder",
            "value",
            "representations",
        ],
    )?;
    root.field(path, fields, "format")?.literal(
        path,
        "nkdk-declarations/1",
        "unsupported_format",
    )?;
    let kind_node = root.field(path, fields, "kind")?;
    let kind = match kind_node.text(path)? {
        "value" => ModuleKind::Value,
        "fragment" => ModuleKind::Fragment,
        "object" => ModuleKind::Object,
        "resources" => ModuleKind::Resources,
        _ => {
            return Err(error(
                path,
                kind_node.mark,
                "unsupported_kind",
                "Expected value, fragment, object or resources",
            ));
        }
    };
    let id_node = root.field(path, fields, "id")?;
    let id = id_node.text(path)?;
    if id.is_empty() {
        return Err(error(
            path,
            id_node.mark,
            "empty_id",
            "Declaration id must not be empty",
        ));
    }
    let value = root.field(path, fields, "value")?;
    let root_pattern = match &value.shape {
        Shape::Mapping(fields) => optional_field(fields, "pattern"),
        _ => None,
    };
    let definition = if root_pattern.is_some() {
        let fields = value.mapping(path, &["kind", "scalar", "pattern"])?;
        value
            .field(path, fields, "kind")?
            .literal(path, "scalar", "pattern_requires_text")?;
        value
            .field(path, fields, "scalar")?
            .literal(path, "text", "pattern_requires_text")?;
        TypeDefinition::Scalar(ScalarType::Text)
    } else {
        type_definition(path, value)?
    };
    if kind != ModuleKind::Value && !matches!(definition, TypeDefinition::Record(_)) {
        return Err(error(
            path,
            value.mark,
            "expected_record",
            "Object and fragment require a record value",
        ));
    }
    let representations = root.field(path, fields, "representations")?;
    let rep_fields = representations.mapping(path, &["xml", "yaml"])?;
    let xml = representations.field(path, rep_fields, "xml")?;
    let (xml, wrappers) = xml::unwrap(path, xml)?;
    let yaml = representations.field(path, rep_fields, "yaml")?;
    let (xml_rep, yaml_rep) = match &definition {
        TypeDefinition::Choice(_) => choice_representations(path, xml, yaml)?,
        TypeDefinition::Use(_) if matches!(&xml.shape, Shape::Mapping(fields) if optional_field(fields, "kind").is_some_and(|kind| kind.text(path).is_ok_and(|kind| kind=="choice"))) => {
            choice_representations(path, xml, yaml)?
        }
        TypeDefinition::ScalarChoice(_) => scalar_choice::representations(path, xml, yaml)?,
        TypeDefinition::Scalar(ScalarType::Text) | TypeDefinition::Use(_) => {
            if matches!(&xml.shape, Shape::Mapping(fields) if optional_field(fields, "kind").is_some_and(|kind| kind.text(path).is_ok_and(|kind| kind == "qname-lexicon")))
            {
                scalar_yaml(path, yaml, "text")?;
                (
                    XmlRepresentation::QNameTextTable(enumeration::qname_text_table(path, xml)?),
                    YamlRepresentation::Text,
                )
            } else {
                let xml_fields = xml.mapping(path, &["kind", "format", "zone"])?;
                if xml.field(path, xml_fields, "kind")?.text(path)? == "calendar" {
                    xml.field(path, xml_fields, "format")?.literal(
                        path,
                        "iso",
                        "unsupported_calendar_format",
                    )?;
                    xml.field(path, xml_fields, "zone")?.literal(
                        path,
                        "written",
                        "unsupported_calendar_zone",
                    )?;
                    let fields =
                        yaml.mapping(path, &["kind", "format", "precision", "zeroTime"])?;
                    yaml.field(path, fields, "kind")?.literal(
                        path,
                        "calendar",
                        "unsupported_representation",
                    )?;
                    yaml.field(path, fields, "format")?.literal(
                        path,
                        "day-month-year",
                        "unsupported_calendar_format",
                    )?;
                    let precision = yaml.field(path, fields, "precision")?;
                    let seconds = match precision.text(path)? {
                        "seconds" => true,
                        "minutes" => false,
                        _ => {
                            return Err(error(
                                path,
                                precision.mark,
                                "unsupported_calendar_precision",
                                "Expected minutes or seconds",
                            ));
                        }
                    };
                    let zero = yaml.field(path, fields, "zeroTime")?;
                    let omit_zero = match zero.text(path)? {
                        "omit" => true,
                        "keep" => false,
                        _ => {
                            return Err(error(
                                path,
                                zero.mark,
                                "unsupported_calendar_zero",
                                "Expected omit or keep",
                            ));
                        }
                    };
                    (
                        XmlRepresentation::Calendar,
                        YamlRepresentation::Calendar { seconds, omit_zero },
                    )
                } else {
                    xml.mapping(path, &["kind"])?;
                    xml.field(path, xml_fields, "kind")?.literal(
                        path,
                        "text",
                        "unsupported_representation",
                    )?;
                    if let Shape::Mapping(fields) = &yaml.shape {
                        match optional_field(fields, "kind").and_then(|node| node.text(path).ok()) {
                            Some("text-table") => {
                                let fields = yaml.mapping(path, &["kind", "use"])?;
                                let usage = yaml.field(path, fields, "use")?;
                                (
                                    XmlRepresentation::Text,
                                    YamlRepresentation::TextTable(TextTable::Import {
                                        name: usage.text(path)?.into(),
                                        source: location(path, usage),
                                    }),
                                )
                            }
                            Some("input-text-table") => {
                                let fields =
                                    yaml.mapping(path, &["kind", "input", "internal", "external"])?;
                                (
                                    XmlRepresentation::Text,
                                    YamlRepresentation::InputTextTable(
                                        nkdk_rule_model::RecordKeyTable {
                                            input: yaml
                                                .field(path, fields, "input")?
                                                .text(path)?
                                                .into(),
                                            internal: yaml
                                                .field(path, fields, "internal")?
                                                .text(path)?
                                                .into(),
                                            external: yaml
                                                .field(path, fields, "external")?
                                                .text(path)?
                                                .into(),
                                            empty: None,
                                        },
                                    ),
                                )
                            }
                            _ => {
                                scalar_yaml(path, yaml, "text")?;
                                (XmlRepresentation::Text, YamlRepresentation::Text)
                            }
                        }
                    } else {
                        scalar_yaml(path, yaml, "text")?;
                        (XmlRepresentation::Text, YamlRepresentation::Text)
                    }
                }
            }
        }
        TypeDefinition::Scalar(ScalarType::Decimal) => {
            let xml_rep = decimal_text::parse(path, xml)?;
            let fields = yaml.mapping(path, &["kind", "scalar"])?;
            yaml.field(path, fields, "kind")?.literal(
                path,
                "scalar",
                "unsupported_representation",
            )?;
            yaml.field(path, fields, "scalar")?
                .literal(path, "number", "unsupported_scalar")?;
            (xml_rep, YamlRepresentation::Decimal)
        }
        TypeDefinition::Enum(_) => {
            let xml_kind = xml
                .mapping(path, &["kind", "values"])
                .ok()
                .and_then(|fields| optional_field(fields, "kind"))
                .and_then(|kind| kind.text(path).ok());
            (
                if xml_kind == Some("qname-table") {
                    XmlRepresentation::QNameTable(enumeration::qname_table(path, xml)?)
                } else {
                    XmlRepresentation::EnumTable(enumeration::table(path, xml, "text", "text")?)
                },
                states::parse(path, yaml)?,
            )
        }
        TypeDefinition::Scalar(ScalarType::Boolean) => (
            XmlRepresentation::BooleanTable(boolean_table(path, xml, "text", "text")?),
            YamlRepresentation::BooleanTable(boolean_table(path, yaml, "scalar", "literal")?),
        ),
        TypeDefinition::Record(_) => (
            xml::record(path, xml)?,
            text_pattern::yaml_record(path, yaml)?,
        ),
        TypeDefinition::Sequence(_) => (
            match text_pattern::sequence_separator(path, xml)? {
                Some(separator) => XmlRepresentation::TextSequence { separator },
                None => xml_collection(path, xml)?,
            },
            match text_pattern::sequence_separator(path, yaml)? {
                Some(separator) => YamlRepresentation::TextSequence { separator },
                None => yaml_collection(path, yaml)?,
            },
        ),
        _ => {
            return Err(error(
                path,
                value.mark,
                "unsupported_type",
                "Main type representation is not implemented yet",
            ));
        }
    };
    let xml_rep = xml::wrap(xml_rep, wrappers);
    let description = fields
        .iter()
        .find_map(|(key, value)| match &key.shape {
            Shape::Scalar(name, _) if name == "description" => Some(value),
            _ => None,
        })
        .map(|value| value.text(path).map(str::to_owned))
        .transpose()?;
    let compose = composition(path, fields)?;
    let mut constraints = constraints(path, fields)?;
    if let Some(pattern) = root_pattern {
        let source = location(path, pattern);
        constraints.push(Constraint {
            id: "value.pattern".into(),
            applies_to: vec![ValidationPhase::XmlImport, ValidationPhase::YamlValidation],
            when: None,
            for_each: None,
            forms: vec![],
            assertion: Expression {
                kind: ExpressionKind::Matches {
                    value: Box::new(Expression {
                        kind: ExpressionKind::SelfValue,
                        source: source.clone(),
                    }),
                    pattern: pattern.text(path)?.into(),
                },
                source: source.clone(),
            },
            diagnostic: DiagnosticDefinition {
                code: Some("value.pattern".into()),
                source: None,
                severity: Severity::Error,
                at: DiagnosticTarget::SelfValue,
                message: MessageDefinition::Text(
                    "Value does not match the declared text pattern".into(),
                ),
            },
            source,
        });
    }
    let (presence, state_relations) =
        state_relations::expand(path, fields, presence(path, fields)?)?;
    let record_shorthand = if matches!(yaml_rep, YamlRepresentation::Mapping(_)) {
        let mapping = yaml.mapping(path, &["kind", "fields", "shorthand"])?;
        optional_field(mapping, "shorthand")
            .map(|items| shorthands::shorthands(path, items))
            .transpose()?
            .unwrap_or_default()
    } else {
        vec![]
    };
    Ok(Module {
        source: location(path, id_node),
        kind,
        id: id.into(),
        description,
        imports: named_bindings(path, fields, "imports")?,
        namespaces: named_bindings(path, fields, "namespaces")?,
        types: named_types(path, fields)?,
        inputs: named_inputs(path, fields)?,
        input_indexes: contributions::inputs(path, fields)?,
        parameters: parameters(path, fields)?,
        presence: states::presence(presence, &yaml_rep)?,
        state_relations,
        normalization: normalization(path, fields)?,
        constraints,
        contributions: contributions::parse(path, fields)?,
        data_path: data_path::parse(path, fields)?,
        resources: resources::parse(path, fields)?,
        compose,
        xml_order: field_order(path, fields, "xmlOrder")?,
        yaml_order: field_order(path, fields, "yamlOrder")?,
        value: definition,
        representations: Representations {
            xml: xml_rep,
            yaml: yaml_rep,
            shorthand: record_shorthand,
        },
    })
}

fn scalar_yaml(path: &str, yaml: &Node, scalar: &str) -> Result<(), Diagnostic> {
    let fields = yaml.mapping(path, &["kind", "scalar"])?;
    yaml.field(path, fields, "kind")?
        .literal(path, "scalar", "unsupported_representation")?;
    yaml.field(path, fields, "scalar")?
        .literal(path, scalar, "unsupported_scalar")?;
    Ok(())
}

fn boolean_table(
    path: &str,
    representation: &Node,
    kind: &str,
    spelling: &str,
) -> Result<Vec<BooleanLexeme>, Diagnostic> {
    let fields = representation.mapping(path, &["kind", "values"])?;
    representation.field(path, fields, "kind")?.literal(
        path,
        kind,
        "unsupported_representation",
    )?;
    let values = representation.field(path, fields, "values")?;
    let Shape::Sequence(items) = &values.shape else {
        return Err(error(
            path,
            values.mark,
            "expected_sequence",
            "Expected a values sequence",
        ));
    };
    items
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["value", spelling])?;
            let semantic = item.field(path, fields, "value")?;
            let value = match &semantic.shape {
                Shape::Scalar(text, false) => match yaml_rust2::Yaml::from_str(text) {
                    yaml_rust2::Yaml::Boolean(value) => value,
                    _ => {
                        return Err(error(
                            path,
                            semantic.mark,
                            "expected_boolean",
                            "Expected a boolean literal",
                        ));
                    }
                },
                _ => {
                    return Err(error(
                        path,
                        semantic.mark,
                        "expected_boolean",
                        "Expected a boolean literal",
                    ));
                }
            };
            let text = item.field(path, fields, spelling)?.text(path)?.to_owned();
            Ok(BooleanLexeme { value, text })
        })
        .collect()
}

fn optional_mapping<'a>(
    path: &str,
    fields: &'a [(Node, Node)],
    section: &str,
    message: &'static str,
) -> Result<Option<&'a [(Node, Node)]>, Diagnostic> {
    let Some(value) = optional_field(fields, section) else {
        return Ok(None);
    };
    match &value.shape {
        Shape::Mapping(entries) => Ok(Some(entries)),
        _ => Err(error(path, value.mark, "expected_mapping", message)),
    }
}

fn named_bindings(
    path: &str,
    fields: &[(Node, Node)],
    section: &str,
) -> Result<Vec<NamedBinding>, Diagnostic> {
    let Some(entries) = optional_mapping(path, fields, section, "Expected named bindings")? else {
        return Ok(vec![]);
    };
    entries
        .iter()
        .map(|(key, value)| {
            Ok(NamedBinding {
                name: key.text(path)?.into(),
                value: value.text(path)?.into(),
                source: SourceLocation {
                    file: path.into(),
                    line: key.mark.line(),
                    column: key.mark.col() + 1,
                },
            })
        })
        .collect()
}

fn location(path: &str, node: &Node) -> SourceLocation {
    SourceLocation {
        file: path.into(),
        line: node.mark.line(),
        column: node.mark.col() + 1,
    }
}

fn named_types(path: &str, fields: &[(Node, Node)]) -> Result<Vec<NamedType>, Diagnostic> {
    let Some(entries) = optional_mapping(path, fields, "types", "Expected local types")? else {
        return Ok(vec![]);
    };
    entries
        .iter()
        .map(|(key, value)| {
            Ok(NamedType {
                name: key.text(path)?.into(),
                definition: type_definition(path, value)?,
                source: location(path, key),
            })
        })
        .collect()
}

fn type_definition(path: &str, value: &Node) -> Result<TypeDefinition, Diagnostic> {
    if let Shape::Mapping(fields) = &value.shape
        && optional_field(fields, "kind").is_some_and(
            |kind| matches!(&kind.shape, Shape::Scalar(name, true) if name == "text-transform"),
        )
    {
        return Ok(TypeDefinition::TextTransform(Box::new(text::decode(
            path, value,
        )?)));
    }
    let fields = value.mapping(
        path,
        &[
            "kind", "scalar", "fields", "item", "local", "use", "with", "bind", "variants", "key",
            "value", "profile",
        ],
    )?;
    for (key, _) in fields {
        let name = key.text(path)?;
        if name == "local" || name == "use" {
            if name == "local" {
                value.mapping(path, &["local"])?;
                return Ok(TypeDefinition::Local(
                    value.field(path, fields, "local")?.text(path)?.into(),
                ));
            }
            value.mapping(path, &["use", "with", "bind"])?;
            let target = value.field(path, fields, "use")?;
            let arguments = named_nodes(path, optional_field(fields, "with"))?
                .iter()
                .map(|(key, value)| {
                    Ok(StaticArgument {
                        name: key.text(path)?.into(),
                        value: if matches!(&value.shape, Shape::Mapping(_)) {
                            let fields = value.mapping(path, &["parameter"])?;
                            nkdk_rule_model::StaticValue::Parameter(
                                value.field(path, fields, "parameter")?.text(path)?.into(),
                            )
                        } else {
                            nkdk_rule_model::StaticValue::Literal(scalar_literal(path, value)?)
                        },
                        source: location(path, key),
                    })
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            let bindings = named_nodes(path, optional_field(fields, "bind"))?
                .iter()
                .map(|(key, value)| {
                    Ok(ExpressionField {
                        name: key.text(path)?.into(),
                        value: expression(path, value)?,
                    })
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            return Ok(TypeDefinition::Use(TypeUse {
                name: target.text(path)?.into(),
                arguments,
                bindings,
                source: location(path, target),
            }));
        }
    }
    let kind = value.field(path, fields, "kind")?;
    match kind.text(path)? {
        "enum" => enumeration::variants(path, value),
        "scalar-choice" => scalar_choice::value(path, value),
        "scalar" => {
            value.mapping(path, &["kind", "scalar", "profile"])?;
            let scalar = value.field(path, fields, "scalar")?;
            let scalar = match scalar.text(path)? {
                "number" => {
                    value.field(path, fields, "profile")?.literal(
                        path,
                        "decimal",
                        "unsupported_numeric_profile",
                    )?;
                    ScalarType::Decimal
                }
                "text" => ScalarType::Text,
                "boolean" => ScalarType::Boolean,
                _ => {
                    return Err(error(
                        path,
                        scalar.mark,
                        "unsupported_scalar",
                        "Unsupported scalar type",
                    ));
                }
            };
            if scalar != ScalarType::Decimal && optional_field(fields, "profile").is_some() {
                return Err(error(
                    path,
                    value.mark,
                    "unexpected_profile",
                    "Only number accepts a numeric profile",
                ));
            }
            Ok(TypeDefinition::Scalar(scalar))
        }
        "index" => {
            let fields = value.mapping(path, &["kind", "key", "value"])?;
            Ok(TypeDefinition::Index {
                key: Box::new(type_definition(path, value.field(path, fields, "key")?)?),
                value: Box::new(type_definition(path, value.field(path, fields, "value")?)?),
            })
        }
        "sequence" => {
            value.mapping(path, &["kind", "item"])?;
            Ok(TypeDefinition::Sequence(Box::new(type_definition(
                path,
                value.field(path, fields, "item")?,
            )?)))
        }
        "record" | "choice" => {
            let choice = kind.text(path)? == "choice";
            let list = if choice { "variants" } else { "fields" };
            value.mapping(path, &["kind", list])?;
            let members = value.field(path, fields, list)?;
            let Shape::Sequence(members_list) = &members.shape else {
                return Err(error(
                    path,
                    members.mark,
                    "expected_sequence",
                    "Expected record fields",
                ));
            };
            let members = members_list
                .iter()
                .map(|member| {
                    let fields = member.mapping(path, &["name", "type"])?;
                    let name = member.field(path, fields, "name")?;
                    Ok(TypeField {
                        name: name.text(path)?.into(),
                        definition: type_definition(path, member.field(path, fields, "type")?)?,
                        source: location(path, name),
                    })
                })
                .collect::<Result<Vec<_>, Diagnostic>>()?;
            Ok(if choice {
                TypeDefinition::Choice(members)
            } else {
                TypeDefinition::Record(members)
            })
        }
        _ => Err(error(
            path,
            kind.mark,
            "unsupported_type",
            "Unsupported type kind",
        )),
    }
}

fn representation_fields<'a>(
    path: &str,
    representation: &'a Node,
    kind: &str,
) -> Result<&'a [Node], Diagnostic> {
    let fields = representation.mapping(path, &["kind", "fields"])?;
    representation.field(path, fields, "kind")?.literal(
        path,
        kind,
        "unsupported_representation",
    )?;
    let members = representation.field(path, fields, "fields")?;
    match &members.shape {
        Shape::Sequence(items) => Ok(items),
        _ => Err(error(
            path,
            members.mark,
            "expected_sequence",
            "Expected representation fields",
        )),
    }
}

fn xml_path(path: &str, route: &Node) -> Result<Vec<String>, Diagnostic> {
    let Shape::Sequence(segments) = &route.shape else {
        return Err(error(
            path,
            route.mark,
            "expected_sequence",
            "Expected XML path",
        ));
    };
    segments
        .iter()
        .map(|segment| segment.text(path).map(str::to_owned))
        .collect()
}

fn xml_fields(path: &str, representation: &Node) -> Result<Vec<XmlField>, Diagnostic> {
    representation_fields(path, representation, "record")?
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["field", "path", "attribute", "file"])?;
            let name = item.field(path, fields, "field")?;
            let route = item.field(path, fields, "path")?;
            let segments = xml_path(path, route)?;
            let file = optional_field(fields, "file")
                .map(|node| {
                    let Shape::Sequence(parts) = &node.shape else {
                        return Err(error(
                            path,
                            node.mark,
                            "expected_sequence",
                            "Expected relative file path",
                        ));
                    };
                    let parts = parts
                        .iter()
                        .map(|part| part.text(path).map(str::to_owned))
                        .collect::<Result<Vec<_>, _>>()?;
                    if parts.is_empty()
                        || parts.iter().any(|part| {
                            part.is_empty()
                                || matches!(part.as_str(), "." | "..")
                                || part.contains(['/', '\\', '\0', ':'])
                        })
                    {
                        return Err(error(
                            path,
                            node.mark,
                            "invalid_file_path",
                            "Expected a safe relative file path",
                        ));
                    }
                    Ok(parts)
                })
                .transpose()?;
            Ok(XmlField {
                file,
                field: name.text(path)?.into(),
                path: segments,
                attribute: optional_field(fields, "attribute")
                    .map(|value| value.text(path).map(str::to_owned))
                    .transpose()?,
                source: location(path, name),
            })
        })
        .collect()
}

fn yaml_fields(path: &str, representation: &Node) -> Result<Vec<YamlField>, Diagnostic> {
    let fields = representation.mapping(path, &["kind", "fields", "shorthand"])?;
    representation.field(path, fields, "kind")?.literal(
        path,
        "mapping",
        "unsupported_representation",
    )?;
    let members = representation.field(path, fields, "fields")?;
    let Shape::Sequence(items) = &members.shape else {
        return Err(error(
            path,
            members.mark,
            "expected_sequence",
            "Expected representation fields",
        ));
    };
    items
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["field", "key", "file"])?;
            let name = item.field(path, fields, "field")?;
            let key = optional_field(fields, "key");
            let file = optional_field(fields, "file");
            if key.is_some() == file.is_some() {
                return Err(error(
                    path,
                    item.mark,
                    "yaml_field_storage",
                    "A YAML field requires exactly one key or file",
                ));
            }
            let key = key.map(|node| node.text(path)).transpose()?.unwrap_or("");
            if file.is_none() && key.is_empty() {
                return Err(error(
                    path,
                    item.mark,
                    "yaml_field_storage",
                    "A YAML key must not be empty",
                ));
            }
            Ok(YamlField {
                field: name.text(path)?.into(),
                key: key.into(),
                file: file.map(|node| expression(path, node)).transpose()?,
                source: location(path, name),
            })
        })
        .collect()
}

fn xml_collection(path: &str, representation: &Node) -> Result<XmlRepresentation, Diagnostic> {
    let (representation, wrappers) = xml::unwrap(path, representation)?;
    Ok(xml::wrap(
        xml_collection_content(path, representation)?,
        wrappers,
    ))
}

fn xml_collection_content(
    path: &str,
    representation: &Node,
) -> Result<XmlRepresentation, Diagnostic> {
    let fields = representation.mapping(
        path,
        &["kind", "path", "next", "item", "fields", "children"],
    )?;
    let kind = representation.field(path, fields, "kind")?;
    if kind.text(path)? == "declared" {
        representation.mapping(path, &["kind"])?;
        return Ok(XmlRepresentation::Declared);
    }
    if kind.text(path)? == "tree" {
        representation.mapping(path, &["kind", "children"])?;
        return Ok(XmlRepresentation::Tree(xml_tree::children(
            path,
            representation.field(path, fields, "children")?,
        )?));
    }
    if kind.text(path)? == "text" {
        representation.mapping(path, &["kind"])?;
        return Ok(XmlRepresentation::Text);
    }
    if kind.text(path)? == "record" {
        return Ok(XmlRepresentation::Record(xml_fields(path, representation)?));
    }
    representation.mapping(path, &["kind", "path", "next", "item"])?;
    kind.literal(path, "element-sequence", "unsupported_representation")?;
    let route = representation.field(path, fields, "path")?;
    let segments = xml_path(path, route)?;
    let item = optional_field(fields, "item")
        .map(|item| xml_collection(path, item))
        .transpose()?
        .unwrap_or(XmlRepresentation::Declared);
    Ok(XmlRepresentation::ElementSequence {
        path: segments,
        next: optional_field(fields, "next")
            .map(|next| xml_path(path, next))
            .transpose()?,
        item: Box::new(item),
    })
}

fn yaml_keyed_mapping(path: &str, representation: &Node) -> Result<YamlRepresentation, Diagnostic> {
    let fields = representation.mapping(path, &["kind", "key", "value", "shorthand"])?;
    representation.field(path, fields, "kind")?.literal(
        path,
        "keyed-mapping",
        "unsupported_representation",
    )?;
    let shorthand = fields
        .iter()
        .find_map(|(key, value)| match &key.shape {
            Shape::Scalar(name, _) if name == "shorthand" => Some(value),
            _ => None,
        })
        .map(|value| shorthands(path, value))
        .transpose()?
        .unwrap_or_default();
    Ok(YamlRepresentation::KeyedMapping {
        shorthand,
        key: representation
            .field(path, fields, "key")?
            .text(path)?
            .into(),
        value: representation
            .field(path, fields, "value")?
            .text(path)?
            .into(),
    })
}

fn require_row_key(path: &str, key: &Node) -> Result<(), Diagnostic> {
    let fields = key.mapping(path, &["rowKey"])?;
    if scalar_literal(path, key.field(path, fields, "rowKey")?)? != ScalarLiteral::Boolean(true) {
        return Err(error(
            path,
            key.mark,
            "invalid_item_input",
            "Expected rowKey: true",
        ));
    }
    Ok(())
}

fn record_item_inputs(
    path: &str,
    node: Option<&Node>,
) -> Result<Vec<nkdk_rule_model::RecordItemInput>, Diagnostic> {
    let Some(node) = node else {
        return Ok(Vec::new());
    };
    let Shape::Mapping(entries) = &node.shape else {
        return Err(error(
            path,
            node.mark,
            "expected_mapping",
            "Expected itemInputs mapping",
        ));
    };
    entries
        .iter()
        .map(|(target, source)| {
            let fields = source.mapping(path, &["rowKey", "lookup", "table"])?;
            let source = if let Some(row_key) = optional_field(fields, "rowKey") {
                if optional_field(fields, "lookup").is_some()
                    || optional_field(fields, "table").is_some()
                    || scalar_literal(path, row_key)? != ScalarLiteral::Boolean(true)
                {
                    return Err(error(
                        path,
                        source.mark,
                        "invalid_item_input",
                        "Expected rowKey: true",
                    ));
                }
                nkdk_rule_model::RecordItemInputSource::RowKey
            } else if let Some(table) = optional_field(fields, "table") {
                if optional_field(fields, "lookup").is_some() {
                    return Err(error(
                        path,
                        source.mark,
                        "invalid_item_input",
                        "Expected one item input source",
                    ));
                }
                let table_fields = table.mapping(path, &["key", "values", "default"])?;
                let key = table.field(path, table_fields, "key")?;
                require_row_key(path, key)?;
                let values = table.field(path, table_fields, "values")?;
                let Shape::Mapping(entries) = &values.shape else {
                    return Err(error(
                        path,
                        values.mark,
                        "expected_mapping",
                        "Expected table values mapping",
                    ));
                };
                let mut seen = std::collections::BTreeSet::new();
                let mut rows = Vec::with_capacity(entries.len());
                for (key, value) in entries {
                    let name = key.text(path)?.to_owned();
                    if !seen.insert(name.clone()) {
                        return Err(error(
                            path,
                            key.mark,
                            "duplicate_table_key",
                            "Table key is repeated",
                        ));
                    }
                    rows.push((name, value.text(path)?.to_owned()));
                }
                nkdk_rule_model::RecordItemInputSource::Table {
                    values: rows,
                    default: table
                        .field(path, table_fields, "default")?
                        .text(path)?
                        .to_owned(),
                }
            } else {
                let lookup = source.field(path, fields, "lookup")?;
                let lookup_fields = lookup.mapping(path, &["in", "key", "default"])?;
                let input = lookup.field(path, lookup_fields, "in")?;
                let input_fields = input.mapping(path, &["input"])?;
                let key = lookup.field(path, lookup_fields, "key")?;
                require_row_key(path, key)?;
                let default = lookup.field(path, lookup_fields, "default")?;
                let default_fields = default.mapping(path, &["input"])?;
                nkdk_rule_model::RecordItemInputSource::Lookup {
                    input: input.field(path, input_fields, "input")?.text(path)?.into(),
                    default_input: default
                        .field(path, default_fields, "input")?
                        .text(path)?
                        .into(),
                }
            };
            Ok(nkdk_rule_model::RecordItemInput {
                target: target.text(path)?.into(),
                source,
            })
        })
        .collect()
}

fn yaml_collection(path: &str, node: &Node) -> Result<YamlRepresentation, Diagnostic> {
    let fields = node.mapping(
        path,
        &[
            "kind",
            "item",
            "fields",
            "scalar",
            "key",
            "value",
            "maxItems",
            "shorthand",
            "singleton",
            "omitEmptyFor",
            "restoreFrom",
            "emptyTag",
            "emptyRowNull",
            "groupKey",
            "keyTable",
            "itemInputs",
            "itemTag",
        ],
    )?;
    match node.field(path, fields, "kind")?.text(path)? {
        "record-mapping" => {
            node.mapping(
                path,
                &[
                    "kind",
                    "key",
                    "value",
                    "maxItems",
                    "restoreFrom",
                    "omitEmptyFor",
                    "emptyTag",
                    "emptyRowNull",
                    "groupKey",
                    "keyTable",
                    "itemInputs",
                ],
            )?;
            Ok(YamlRepresentation::RecordMapping {
                key: node.field(path, fields, "key")?.text(path)?.into(),
                group_key: optional_field(fields, "groupKey")
                    .map(|value| value.text(path).map(str::to_owned))
                    .transpose()?,
                item_inputs: record_item_inputs(path, optional_field(fields, "itemInputs"))?,
                value: optional_field(fields, "value")
                    .map(|value| value.text(path).map(str::to_owned))
                    .transpose()?,
                max_items: optional_field(fields, "maxItems")
                    .map(|value| {
                        let ScalarLiteral::Number(number) = scalar_literal(path, value)? else {
                            return Err(error(
                                path,
                                value.mark,
                                "invalid_max_items",
                                "Expected nonnegative integer maxItems",
                            ));
                        };
                        number.parse::<usize>().map_err(|_| {
                            error(
                                path,
                                value.mark,
                                "invalid_max_items",
                                "Expected nonnegative integer maxItems",
                            )
                        })
                    })
                    .transpose()?,
                restore_from: optional_field(fields, "restoreFrom")
                    .map(|value| value.text(path).map(str::to_owned))
                    .transpose()?,
                omit_empty_for: optional_field(fields, "omitEmptyFor")
                    .map(|value| value.text(path).map(str::to_owned))
                    .transpose()?,
                empty_tag: optional_field(fields, "emptyTag")
                    .map(|value| value.text(path).map(str::to_owned))
                    .transpose()?,
                empty_row_null: optional_field(fields, "emptyRowNull")
                    .map(|value| scalar_literal(path, value))
                    .transpose()?
                    .map(|value| match value {
                        ScalarLiteral::Boolean(value) => Ok(value),
                        _ => Err(error(
                            path,
                            node.mark,
                            "invalid_empty_row_null",
                            "Expected boolean emptyRowNull",
                        )),
                    })
                    .transpose()?
                    .unwrap_or(false),
                key_table: optional_field(fields, "keyTable")
                    .map(|table| {
                        let fields =
                            table.mapping(path, &["input", "internal", "external", "empty"])?;
                        Ok(nkdk_rule_model::RecordKeyTable {
                            input: table.field(path, fields, "input")?.text(path)?.into(),
                            internal: table.field(path, fields, "internal")?.text(path)?.into(),
                            external: table.field(path, fields, "external")?.text(path)?.into(),
                            empty: optional_field(fields, "empty")
                                .map(|value| value.text(path).map(str::to_owned))
                                .transpose()?,
                        })
                    })
                    .transpose()?,
            })
        }
        "sequence" => {
            node.mapping(path, &["kind", "item", "itemTag", "shorthand", "singleton"])?;
            let item = optional_field(fields, "item")
                .map(|item| yaml_collection(path, item))
                .transpose()?
                .unwrap_or(YamlRepresentation::Declared);
            let item_tag = optional_field(fields, "itemTag")
                .map(|value| {
                    let tag = semantic_item_tag(path, value)?;
                    if item != YamlRepresentation::Declared {
                        return Err(error(
                            path,
                            value.mark,
                            "invalid_sequence_item_tag",
                            "Item tags require declared items",
                        ));
                    }
                    Ok(tag)
                })
                .transpose()?;
            Ok(YamlRepresentation::Sequence {
                item: Box::new(item),
                item_tag,
                shorthand: sequence_shorthand::parse(path, optional_field(fields, "shorthand"))?,
                singleton: optional_field(fields, "singleton")
                    .map(|value| match value.text(path)? {
                        "scalar" => Ok(YamlSingleton::Scalar),
                        "value" => Ok(YamlSingleton::Value),
                        _ => Err(error(
                            path,
                            value.mark,
                            "invalid_singleton",
                            "Expected scalar or value",
                        )),
                    })
                    .transpose()?,
            })
        }
        "mapping" => Ok(YamlRepresentation::Mapping(yaml_fields(path, node)?)),
        "scalar" => {
            node.mapping(path, &["kind", "scalar"])?;
            node.field(path, fields, "scalar")?
                .literal(path, "text", "unsupported_scalar")?;
            Ok(YamlRepresentation::Text)
        }
        "declared" => {
            node.mapping(path, &["kind"])?;
            Ok(YamlRepresentation::Declared)
        }
        _ => yaml_keyed_mapping(path, node),
    }
}

fn named_inputs(path: &str, fields: &[(Node, Node)]) -> Result<Vec<NamedType>, Diagnostic> {
    let Some(entries) = optional_mapping(path, fields, "inputs", "Expected input declarations")?
    else {
        return Ok(vec![]);
    };
    entries
        .iter()
        .map(|(key, value)| {
            let fields = value.mapping(path, &["type", "index"])?;
            Ok(NamedType {
                name: key.text(path)?.into(),
                definition: if let Some(definition) = optional_field(fields, "type") {
                    type_definition(path, definition)?
                } else if let Some(index) = optional_field(fields, "index") {
                    TypeDefinition::IndexFromBinding(index.text(path)?.into())
                } else {
                    type_definition(path, value.field(path, fields, "type")?)?
                },
                source: location(path, key),
            })
        })
        .collect()
}

fn parameters(path: &str, fields: &[(Node, Node)]) -> Result<Vec<Parameter>, Diagnostic> {
    let Some(entries) = optional_mapping(
        path,
        fields,
        "parameters",
        "Expected parameter declarations",
    )?
    else {
        return Ok(vec![]);
    };
    entries
        .iter()
        .map(|(key, value)| {
            let fields = value.mapping(path, &["type", "default"])?;
            let default = fields
                .iter()
                .find_map(|(key, value)| match &key.shape {
                    Shape::Scalar(name, _) if name == "default" => Some(value),
                    _ => None,
                })
                .map(|value| scalar_literal(path, value))
                .transpose()?;
            Ok(Parameter {
                name: key.text(path)?.into(),
                definition: type_definition(path, value.field(path, fields, "type")?)?,
                default,
                source: location(path, key),
            })
        })
        .collect()
}

fn optional_field<'a>(fields: &'a [(Node, Node)], name: &str) -> Option<&'a Node> {
    fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(key, _) if key == name => Some(value),
        _ => None,
    })
}

fn field_order(path: &str, fields: &[(Node, Node)], name: &str) -> Result<Vec<String>, Diagnostic> {
    optional_field(fields, name)
        .map(|node| {
            sequence(path, node)?
                .iter()
                .map(|item| item.text(path).map(str::to_owned))
                .collect::<Result<Vec<_>, _>>()
        })
        .transpose()
        .map(Option::unwrap_or_default)
}

fn named_nodes<'a>(path: &str, node: Option<&'a Node>) -> Result<&'a [(Node, Node)], Diagnostic> {
    match node {
        None => Ok(&[]),
        Some(Node {
            shape: Shape::Mapping(entries),
            ..
        }) => Ok(entries),
        Some(node) => Err(error(
            path,
            node.mark,
            "expected_mapping",
            "Expected named bindings",
        )),
    }
}

fn composition(path: &str, fields: &[(Node, Node)]) -> Result<Vec<TypeUse>, Diagnostic> {
    let Some(node) = optional_field(fields, "compose") else {
        return Ok(vec![]);
    };
    let Shape::Sequence(items) = &node.shape else {
        return Err(error(
            path,
            node.mark,
            "expected_sequence",
            "Expected fragment list",
        ));
    };
    items
        .iter()
        .map(|item| {
            item.mapping(path, &["use", "with", "bind"])?;
            match type_definition(path, item)? {
                TypeDefinition::Use(usage) => Ok(usage),
                _ => Err(error(
                    path,
                    item.mark,
                    "expected_fragment_use",
                    "Expected fragment import",
                )),
            }
        })
        .collect()
}

fn iteration(path: &str, node: &Node) -> Result<Iteration, Diagnostic> {
    let fields = node.mapping(path, &["in", "as", "index"])?;
    Ok(Iteration {
        input: expression(path, node.field(path, fields, "in")?)?,
        binding: node.field(path, fields, "as")?.text(path)?.into(),
        index: optional_field(fields, "index")
            .map(|value| value.text(path).map(str::to_owned))
            .transpose()?,
        source: location(path, node),
    })
}

fn sequence<'a>(path: &str, node: &'a Node) -> Result<&'a [Node], Diagnostic> {
    match &node.shape {
        Shape::Sequence(items) => Ok(items),
        _ => Err(error(
            path,
            node.mark,
            "expected_sequence",
            "Expected sequence",
        )),
    }
}

fn choice_representations(
    path: &str,
    xml: &Node,
    yaml: &Node,
) -> Result<(XmlRepresentation, YamlRepresentation), Diagnostic> {
    let yaml_fields = yaml.mapping(path, &["kind", "variants", "fallback"])?;
    yaml.field(path, yaml_fields, "kind")?
        .literal(path, "choice", "unsupported_representation")?;
    let xml_fields = xml.mapping(
        path,
        &["kind", "attribute", "variants", "otherwise", "fallback"],
    )?;
    xml.field(path, xml_fields, "kind")?
        .literal(path, "choice", "unsupported_representation")?;
    let yaml_variants = optional_field(yaml_fields, "variants")
        .map(|variants| {
            sequence(path, variants)?
                .iter()
                .map(|item| {
                    let fields = item.mapping(
                        path,
                        &["variant", "form", "key", "value", "tag", "input", "equals"],
                    )?;
                    let form = item.field(path, fields, "form")?.text(path)?;
                    let form = match form {
                        "sequence" => {
                            if optional_field(fields, "key").is_some()
                                || optional_field(fields, "value").is_some()
                            {
                                return Err(error(
                                    path,
                                    item.mark,
                                    "invalid_choice_selector",
                                    "A sequence choice selector cannot declare key or value",
                                ));
                            }
                            nkdk_rule_model::YamlChoiceForm::Sequence
                        }
                        "mapping" => {
                            if let Some(key) = optional_field(fields, "key") {
                                nkdk_rule_model::YamlChoiceForm::Mapping {
                                    key: key.text(path)?.into(),
                                    value: optional_field(fields, "value")
                                        .map(|value| value.text(path).map(str::to_owned))
                                        .transpose()?,
                                }
                            } else if optional_field(fields, "value").is_none() {
                                nkdk_rule_model::YamlChoiceForm::MappingAny
                            } else {
                                return Err(error(
                                    path,
                                    item.mark,
                                    "invalid_choice_selector",
                                    "A mapping choice value requires a key",
                                ));
                            }
                        }
                        "tagged" => {
                            if ["key", "value", "input", "equals"]
                                .iter()
                                .any(|key| optional_field(fields, key).is_some())
                            {
                                return Err(error(
                                    path,
                                    item.mark,
                                    "invalid_choice_selector",
                                    "A tagged value selector declares only its tag",
                                ));
                            }
                            nkdk_rule_model::YamlChoiceForm::Tagged {
                                tag: item.field(path, fields, "tag")?.text(path)?.into(),
                            }
                        }
                        "scalar" => {
                            if optional_field(fields, "key").is_some()
                                || optional_field(fields, "value").is_some()
                            {
                                return Err(error(
                                    path,
                                    item.mark,
                                    "invalid_choice_selector",
                                    "A scalar choice selector cannot declare key or value",
                                ));
                            }
                            nkdk_rule_model::YamlChoiceForm::Scalar {
                                tag: item.field(path, fields, "tag")?.text(path)?.into(),
                            }
                        }
                        "scalar-input" | "mapping-input" | "input-profile" => {
                            if ["key", "value", "tag"]
                                .iter()
                                .any(|key| optional_field(fields, key).is_some())
                            {
                                return Err(error(
                                    path,
                                    item.mark,
                                    "invalid_choice_selector",
                                    "An input profile cannot declare key, value or tag",
                                ));
                            }
                            let input = item.field(path, fields, "input")?.text(path)?.into();
                            let equals = item.field(path, fields, "equals")?.text(path)?.into();
                            if form == "scalar-input" {
                                nkdk_rule_model::YamlChoiceForm::ScalarInput { input, equals }
                            } else if form == "mapping-input" {
                                nkdk_rule_model::YamlChoiceForm::MappingInput { input, equals }
                            } else {
                                nkdk_rule_model::YamlChoiceForm::InputProfile { input, equals }
                            }
                        }
                        _ => {
                            return Err(error(
                                path,
                                item.mark,
                                "invalid_choice_selector",
                                "Choice selector form must be mapping or sequence",
                            ));
                        }
                    };
                    Ok(nkdk_rule_model::YamlChoiceCase {
                        variant: item.field(path, fields, "variant")?.text(path)?.into(),
                        form,
                        source: location(path, item),
                    })
                })
                .collect::<Result<Vec<_>, Diagnostic>>()
        })
        .transpose()?
        .unwrap_or_default();
    let xml_fallback = optional_field(xml_fields, "fallback")
        .map(|value| value.text(path).map(str::to_owned))
        .transpose()?;
    let yaml_fallback = optional_field(yaml_fields, "fallback")
        .map(|value| value.text(path).map(str::to_owned))
        .transpose()?;
    let yaml_representation = YamlRepresentation::Choice {
        variants: yaml_variants,
        fallback: yaml_fallback,
    };
    let Some(attribute) = optional_field(xml_fields, "attribute") else {
        return Ok((
            XmlRepresentation::Choice {
                fallback: xml_fallback,
            },
            yaml_representation,
        ));
    };
    if optional_field(xml_fields, "fallback").is_some() {
        return Err(error(
            path,
            xml.mark,
            "invalid_choice_fallback",
            "XML discriminator and fallback cannot be combined",
        ));
    }
    let mut variants = Vec::new();
    for item in sequence(path, xml.field(path, xml_fields, "variants")?)? {
        let fields = item.mapping(path, &["variant", "in", "from", "emit"])?;
        let from = optional_field(fields, "from")
            .map(|value| value.text(path).map(str::to_owned))
            .transpose()?;
        if from.is_some() && optional_field(fields, "in").is_some() {
            return Err(error(
                path,
                item.mark,
                "invalid_choice_selector",
                "A choice selector cannot combine in and from",
            ));
        }
        if from.is_none() && optional_field(fields, "in").is_none() {
            return Err(error(
                path,
                item.mark,
                "invalid_choice_selector",
                "A choice selector requires in or from",
            ));
        }
        variants.push(nkdk_rule_model::DiscriminatedChoiceCase {
            variant: item.field(path, fields, "variant")?.text(path)?.into(),
            values: optional_field(fields, "in")
                .map(|values| {
                    sequence(path, values)?
                        .iter()
                        .map(|value| value.text(path).map(str::to_owned))
                        .collect::<Result<Vec<_>, _>>()
                })
                .transpose()?
                .unwrap_or_default(),
            from,
            emit: optional_field(fields, "emit")
                .map(|value| value.text(path).map(str::to_owned))
                .transpose()?,
        });
    }
    Ok((
        XmlRepresentation::DiscriminatedChoice(nkdk_rule_model::DiscriminatedChoiceXml {
            attribute: attribute.text(path)?.into(),
            variants,
            otherwise: xml.field(path, xml_fields, "otherwise")?.text(path)?.into(),
        }),
        yaml_representation,
    ))
}

fn semantic_item_tag(path: &str, value: &Node) -> Result<String, Diagnostic> {
    let tag = value.text(path)?;
    if tag.is_empty()
        || tag == "xml"
        || tag.starts_with("xml/")
        || !tag
            .chars()
            .all(|c| c.is_alphanumeric() || matches!(c, '/' | '-' | '_' | '.'))
    {
        return Err(error(
            path,
            value.mark,
            "invalid_sequence_item_tag",
            "Expected a bare semantic tag name",
        ));
    }
    Ok(tag.to_owned())
}
