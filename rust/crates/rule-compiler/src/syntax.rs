mod constraints;
mod expressions;
mod presence;
mod shorthands;
mod text;
use constraints::constraints;
use expressions::{expression, scalar_literal};
use presence::{normalization, presence};
use shorthands::shorthands;

use nkdk_rule_model::ComparisonOperator;
use nkdk_rule_model::Normalization;
use nkdk_rule_model::{
    BooleanLexeme, Diagnostic, Module, ModuleKind, NamedBinding, NamedType, Representations,
    ScalarType, SourceLocation, TypeDefinition, TypeField, XmlRepresentation, YamlRepresentation,
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
use nkdk_rule_model::{StaticArgument, TypeUse};
use nkdk_rule_model::{XmlField, YamlField};
use yaml_rust2::{
    parser::Event,
    scanner::{Marker, TScalarStyle},
};

enum Shape {
    Scalar(String, bool),
    Mapping(Vec<(Node, Node)>),
    Sequence(Vec<Node>),
}
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

pub fn decode(path: &str, events: Vec<(Event, Marker)>) -> Result<Module, Diagnostic> {
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
            "normalization",
            "constraints",
            "compose",
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
        _ => {
            return Err(error(
                path,
                kind_node.mark,
                "unsupported_kind",
                "Expected value, fragment or object",
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
    let definition = type_definition(path, value)?;
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
    let yaml = representations.field(path, rep_fields, "yaml")?;
    let (xml_rep, yaml_rep) = match &definition {
        TypeDefinition::Scalar(ScalarType::Text) => {
            let xml_fields = xml.mapping(path, &["kind"])?;
            xml.field(path, xml_fields, "kind")?.literal(
                path,
                "text",
                "unsupported_representation",
            )?;
            let yaml_fields = yaml.mapping(path, &["kind", "scalar"])?;
            yaml.field(path, yaml_fields, "kind")?.literal(
                path,
                "scalar",
                "unsupported_representation",
            )?;
            yaml.field(path, yaml_fields, "scalar")?
                .literal(path, "text", "unsupported_scalar")?;
            (XmlRepresentation::Text, YamlRepresentation::Text)
        }
        TypeDefinition::Scalar(ScalarType::Boolean) => (
            XmlRepresentation::BooleanTable(boolean_table(path, xml, "text", "text")?),
            YamlRepresentation::BooleanTable(boolean_table(path, yaml, "scalar", "literal")?),
        ),
        TypeDefinition::Record(_) => (
            XmlRepresentation::Record(xml_fields(path, xml)?),
            YamlRepresentation::Mapping(yaml_fields(path, yaml)?),
        ),
        TypeDefinition::Sequence(_) => {
            (xml_collection(path, xml)?, yaml_keyed_mapping(path, yaml)?)
        }
        _ => {
            return Err(error(
                path,
                value.mark,
                "unsupported_type",
                "Main type representation is not implemented yet",
            ));
        }
    };
    let description = fields
        .iter()
        .find_map(|(key, value)| match &key.shape {
            Shape::Scalar(name, _) if name == "description" => Some(value),
            _ => None,
        })
        .map(|value| value.text(path).map(str::to_owned))
        .transpose()?;
    let compose = composition(path, fields)?;
    if kind == ModuleKind::Value && optional_field(fields, "compose").is_some() {
        return Err(error(
            path,
            root.mark,
            "invalid_composition_role",
            "Composition requires fragment or object",
        ));
    }
    Ok(Module {
        source: location(path, id_node),
        kind,
        id: id.into(),
        description,
        imports: named_bindings(path, fields, "imports")?,
        namespaces: named_bindings(path, fields, "namespaces")?,
        types: named_types(path, fields)?,
        inputs: named_inputs(path, fields)?,
        parameters: parameters(path, fields)?,
        presence: presence(path, fields)?,
        normalization: normalization(path, fields)?,
        constraints: constraints(path, fields)?,
        compose,
        value: definition,
        representations: Representations {
            xml: xml_rep,
            yaml: yaml_rep,
        },
    })
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

fn named_bindings(
    path: &str,
    fields: &[(Node, Node)],
    section: &str,
) -> Result<Vec<NamedBinding>, Diagnostic> {
    let Some(value) = fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(name, _) if name == section => Some(value),
        _ => None,
    }) else {
        return Ok(vec![]);
    };
    let Shape::Mapping(entries) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_mapping",
            "Expected named bindings",
        ));
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
    let Some(value) = fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(name, _) if name == "types" => Some(value),
        _ => None,
    }) else {
        return Ok(vec![]);
    };
    let Shape::Mapping(entries) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_mapping",
            "Expected local types",
        ));
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
            "kind", "scalar", "fields", "item", "local", "use", "with", "bind",
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
                        value: scalar_literal(path, value)?,
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
        "scalar" => {
            value.mapping(path, &["kind", "scalar"])?;
            let scalar = value.field(path, fields, "scalar")?;
            let scalar = match scalar.text(path)? {
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
            Ok(TypeDefinition::Scalar(scalar))
        }
        "sequence" => {
            value.mapping(path, &["kind", "item"])?;
            Ok(TypeDefinition::Sequence(Box::new(type_definition(
                path,
                value.field(path, fields, "item")?,
            )?)))
        }
        "record" => {
            value.mapping(path, &["kind", "fields"])?;
            let members = value.field(path, fields, "fields")?;
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
            Ok(TypeDefinition::Record(members))
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

fn xml_fields(path: &str, representation: &Node) -> Result<Vec<XmlField>, Diagnostic> {
    representation_fields(path, representation, "record")?
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["field", "path", "attribute"])?;
            let name = item.field(path, fields, "field")?;
            let route = item.field(path, fields, "path")?;
            let Shape::Sequence(segments) = &route.shape else {
                return Err(error(
                    path,
                    route.mark,
                    "expected_sequence",
                    "Expected XML path",
                ));
            };
            let segments = segments
                .iter()
                .map(|segment| segment.text(path).map(str::to_owned))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(XmlField {
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
    representation_fields(path, representation, "mapping")?
        .iter()
        .map(|item| {
            let fields = item.mapping(path, &["field", "key"])?;
            let name = item.field(path, fields, "field")?;
            Ok(YamlField {
                field: name.text(path)?.into(),
                key: item.field(path, fields, "key")?.text(path)?.into(),
                source: location(path, name),
            })
        })
        .collect()
}

fn xml_collection(path: &str, representation: &Node) -> Result<XmlRepresentation, Diagnostic> {
    let fields = representation.mapping(path, &["kind", "path", "item", "fields"])?;
    let kind = representation.field(path, fields, "kind")?;
    if kind.text(path)? == "record" {
        return Ok(XmlRepresentation::Record(xml_fields(path, representation)?));
    }
    representation.mapping(path, &["kind", "path", "item"])?;
    kind.literal(path, "element-sequence", "unsupported_representation")?;
    let route = representation.field(path, fields, "path")?;
    let Shape::Sequence(segments) = &route.shape else {
        return Err(error(
            path,
            route.mark,
            "expected_sequence",
            "Expected XML path",
        ));
    };
    let segments = segments
        .iter()
        .map(|node| node.text(path).map(str::to_owned))
        .collect::<Result<Vec<_>, _>>()?;
    let item = xml_collection(path, representation.field(path, fields, "item")?)?;
    Ok(XmlRepresentation::ElementSequence {
        path: segments,
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

fn named_inputs(path: &str, fields: &[(Node, Node)]) -> Result<Vec<NamedType>, Diagnostic> {
    let Some(value) = fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(name, _) if name == "inputs" => Some(value),
        _ => None,
    }) else {
        return Ok(vec![]);
    };
    let Shape::Mapping(entries) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_mapping",
            "Expected input declarations",
        ));
    };
    entries
        .iter()
        .map(|(key, value)| {
            let fields = value.mapping(path, &["type"])?;
            Ok(NamedType {
                name: key.text(path)?.into(),
                definition: type_definition(path, value.field(path, fields, "type")?)?,
                source: location(path, key),
            })
        })
        .collect()
}

fn parameters(path: &str, fields: &[(Node, Node)]) -> Result<Vec<Parameter>, Diagnostic> {
    let Some(value) = fields.iter().find_map(|(key, value)| match &key.shape {
        Shape::Scalar(name, _) if name == "parameters" => Some(value),
        _ => None,
    }) else {
        return Ok(vec![]);
    };
    let Shape::Mapping(entries) = &value.shape else {
        return Err(error(
            path,
            value.mark,
            "expected_mapping",
            "Expected parameter declarations",
        ));
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
