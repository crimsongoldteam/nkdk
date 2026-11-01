//! Invert structural shorthand constructors using borrowed semantic cells.
//! The ordinary representation remains responsible for preserved XML forms.
use super::*;
use std::fmt::Write;

pub(super) fn needs_construction(entry: &LinkedEntry) -> bool {
    entry.shorthands.iter().any(|short| {
        !matches!(
            short.representation,
            LinkedShorthandRepresentation::ScalarField(_)
                | LinkedShorthandRepresentation::MappingField(_)
        )
    })
}

fn shape<'a>(value: &'a LinkedType, program: &'a Program<'_>) -> &'a LinkedType {
    match value {
        LinkedType::Optional(inner) => shape(inner, program),
        value if value.as_reference().is_some() => {
            let (id, _, _) = value.as_reference().unwrap();
            &program
                .entries
                .iter()
                .find(|entry| entry.id == id)
                .unwrap()
                .value
        }
        value => value,
    }
}

struct Inverse<'a> {
    entry: &'a LinkedEntry,
    program: &'a Program<'a>,
    code: String,
    next: usize,
}
impl Inverse<'_> {
    fn cell(&mut self, expected: &LinkedExpression, cell: &str) -> Result<(), Diagnostic> {
        let index = self.next;
        self.next += 1;
        let actual = format!("cell{index}");
        writeln!(self.code, "let {actual}={cell};").unwrap();
        match &expected.kind {
            LinkedExpressionKind::Absent => {
                writeln!(
                    self.code,
                    "if {actual}.is_some_and(core::inputs::InputRef::is_present){{return Ok(None)}}"
                )
                .unwrap();
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Sequence,
                arguments,
            } if arguments.is_empty() => {
                writeln!(self.code, "if !matches!({actual},Some(core::inputs::InputRef::Records(rows)) if rows.is_empty()) && !matches!({actual},Some(core::inputs::InputRef::Sequence(rows)) if rows.is_empty()){{return Ok(None)}}").unwrap();
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Sequence,
                arguments,
            } => {
                writeln!(self.code,"let Some(core::inputs::InputRef::Records(rows{index}))={actual} else{{return Ok(None)}};let mut rows{index}=rows{index}.iter();").unwrap();
                for argument in arguments {
                    writeln!(
                        self.code,
                        "let Some(row{index})=rows{index}.next() else{{return Ok(None)}};"
                    )
                    .unwrap();
                    self.cell(argument, &format!("Some(row{index}.as_input())"))?;
                }
                writeln!(
                    self.code,
                    "if rows{index}.next().is_some(){{return Ok(None)}}"
                )
                .unwrap();
            }
            LinkedExpressionKind::Input(slot) => {
                // Shortening is optional: an unavailable comparison leaves the
                // complete representation intact, rather than inventing a value.
                let pattern = match shape(&expected.value_type, self.program) {
                    LinkedType::Scalar(ScalarType::Text) | LinkedType::Enum(_) => "Text",
                    LinkedType::Scalar(ScalarType::Boolean) => "Boolean",
                    LinkedType::Scalar(ScalarType::Decimal) => "Decimal",
                    _ => {
                        return Err(unsupported(
                            self.entry,
                            "Shorthand input comparison requires a scalar",
                        ));
                    }
                };
                writeln!(self.code,"if !matches!(({actual},inputs.slot({slot})),(Some(core::inputs::InputRef::{pattern}(a)),Some(core::inputs::InputRef::{pattern}(b))) if a==b){{return Ok(None)}}").unwrap();
            }
            LinkedExpressionKind::Capture(0) => {
                writeln!(self.code,"let Some(core::inputs::InputRef::Text(text))={actual} else{{return Ok(None)}};if let Some(previous)=captured{{if previous!=text{{return Ok(None)}}}}else{{captured=Some(text);}}").unwrap();
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Record(names),
                arguments,
            } => {
                writeln!(self.code,"let Some(core::inputs::InputRef::Record(fields{index}))={actual} else{{return Ok(None)}};").unwrap();
                let LinkedType::Record(fields) = shape(&expected.value_type, self.program) else {
                    return Err(unsupported(
                        self.entry,
                        "Shorthand record has no field shape",
                    ));
                };
                for (name, value) in names.iter().zip(arguments) {
                    let field = fields.iter().position(|field| &field.name == name).unwrap();
                    self.cell(value, &format!("fields{index}.field({field})"))?;
                }
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::ConstructVariant(variant),
                arguments,
            } => {
                writeln!(self.code,"let Some(core::inputs::InputRef::Choice{{variant:{variant},fields:fields{index}}})={actual} else{{return Ok(None)}};").unwrap();
                let payload = if matches!(
                    shape(&arguments[0].value_type, self.program),
                    LinkedType::Record(_)
                ) {
                    format!("Some(core::inputs::InputRef::Record(fields{index}))")
                } else {
                    format!("fields{index}.field(0)")
                };
                self.cell(&arguments[0], &payload)?;
            }
            _ => {
                let (constants, expression) =
                    expressions::expression(self.entry, self.program, expected)?;
                writeln!(
                    self.code,
                    "let expected{index}={{{constants}{expression}}};"
                )
                .unwrap();
                let expression = format!("expected{index}");
                let (pattern, comparison) = match shape(&expected.value_type, self.program) {
                    LinkedType::Scalar(ScalarType::Text) | LinkedType::Enum(_) => (
                        "Text(text)",
                        format!("text==AsRef::<str>::as_ref(&({expression}))"),
                    ),
                    LinkedType::Scalar(ScalarType::Boolean) => {
                        ("Boolean(value)", format!("value==({expression})"))
                    }
                    LinkedType::Scalar(ScalarType::Decimal) => {
                        ("Decimal(value)", format!("value==({expression})"))
                    }
                    _ => {
                        return Err(unsupported(
                            self.entry,
                            "Shorthand inverse requires a scalar or structural constructor",
                        ));
                    }
                };
                writeln!(self.code,"if !matches!({actual},Some(core::inputs::InputRef::{pattern}) if {comparison}){{return Ok(None)}}").unwrap();
            }
        }
        Ok(())
    }
}

pub(super) fn definitions(
    entry: &LinkedEntry,
    program: &Program,
    raw: &str,
) -> Result<String, Diagnostic> {
    if entry.shorthands.is_empty() {
        return Ok(String::new());
    }
    if (needs_construction(entry) && !record_construction::supported(entry, program))
        || !matches!(entry.yaml, YamlRepresentation::Mapping(_))
    {
        return Err(unsupported(
            entry,
            "Structural shorthand requires a constructible mapping record",
        ));
    }
    let id = entry.id;
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!()
    };
    let mut reads = Vec::new();
    let mut writes = String::new();
    let mut mapping_selection = String::new();
    let mut mapping_keys = String::new();
    let mut projection_defaults = String::new();
    for (ordinal, short) in entry.shorthands.iter().enumerate() {
        let (guard_constants, guard) = short
            .when
            .as_ref()
            .map(|when| expressions::expression(entry, program, when))
            .transpose()?
            .unwrap_or_else(|| (String::new(), "true".to_owned()));
        if let LinkedShorthandRepresentation::ScalarField(index)
        | LinkedShorthandRepresentation::MappingField(index) = short.representation
        {
            if short.canonical
                && matches!(
                    short.representation,
                    LinkedShorthandRepresentation::ScalarField(_)
                )
            {
                return Err(unsupported(
                    entry,
                    "Scalar field projection currently requires canonical:false",
                ));
            }
            let YamlRepresentation::Mapping(mapping) = &entry.yaml else {
                unreachable!()
            };
            let key = mapping
                .iter()
                .find(|mapping| mapping.field == fields[index as usize].name)
                .ok_or_else(|| unsupported(entry, "Projection field has no YAML key"))?
                .key
                .as_str();
            if short.canonical {
                let composition = program.composition(entry)?;
                let slot = composition.parts.iter().position(|part| matches!(&part.value,
                    LinkedType::Record(local) if local.len()==1 && local[0].name==fields[index as usize].name))
                    .ok_or_else(|| unsupported(entry, "Canonical projection requires an independent field writer"))?;
                let mut inverse = Inverse {
                    entry,
                    program,
                    code: String::new(),
                    next: 0,
                };
                for other in 0..fields.len() {
                    if other == index as usize {
                        continue;
                    }
                    let default = entry
                        .presence
                        .iter()
                        .find(|rule| rule.target == LinkedPresenceTarget::Field(other as u32))
                        .and_then(|rule| rule.yaml_missing.as_ref())
                        .ok_or_else(|| {
                            unsupported(
                                entry,
                                "Canonical projection requires declared defaults for other fields",
                            )
                        })?;
                    inverse.cell(default, &format!("input_field_{id}(value,{other})"))?;
                }
                writeln!(projection_defaults,"fn projection_defaults_{id}_{ordinal}(value:&V{id},inputs:&InputView<'_>)->core::Result<Option<()>>{{let _inputs=inputs;{}Ok(Some(()))}}",inverse.code).unwrap();
                writeln!(writes,"{{let _inputs=inputs;{guard_constants}if {guard} && input_field_{id}(value,{index}).is_some_and(core::inputs::InputRef::is_present) && projection_defaults_{id}_{ordinal}(value,inputs)?.is_some(){{let mut rendered=String::new();part_{id}_{slot}::write_yaml(&value.p{slot},inputs,&mut rendered)?;if core::yaml::append_generated_field_value(&rendered,{key:?},true,out,indent)?{{return Ok(true)}}}}}}").unwrap();
            }
            let (constants, condition) = (&guard_constants, &guard);
            if matches!(
                short.representation,
                LinkedShorthandRepresentation::MappingField(_)
            ) {
                writeln!(mapping_selection,"{{let _inputs=inputs;{constants}if {condition}{{return Ok(Some({ordinal}));}}}}").unwrap();
                writeln!(mapping_keys, "{ordinal}=>{key:?},").unwrap();
            } else {
                reads.push((false, format!("{{let _inputs=inputs;{constants}if {condition}{{let mut reader=OwnerYamlRead{id}::new()?;@disable_alias@reader.consume(core::yaml::Node::MappingStart(None),position,b\"\",inputs)?;reader.consume(core::yaml::Node::Scalar(core::yaml::Scalar::new_text({key:?},position),None),position,b\"\",inputs)?;reader.consume(core::yaml::Node::Scalar(scalar.clone(),None),position,b\"\",inputs)?;reader.consume(core::yaml::Node::MappingEnd,position,b\"\",inputs)?;return reader.finish(b\"\",inputs);}}}}").replace("@disable_alias@",if entry.shorthands.iter().any(|short|matches!(short.representation,LinkedShorthandRepresentation::MappingField(_))){"reader.projection_scanned=true;"}else{""})));
            }
            continue;
        }
        let (prefix, suffix, literal) = match &short.representation {
            LinkedShorthandRepresentation::ScalarText { prefix, suffix } => {
                (prefix.as_str(), suffix.as_str(), None)
            }
            LinkedShorthandRepresentation::ScalarLiteral(literal) => {
                ("", "", Some(literal.as_str()))
            }
            _ => {
                return Err(unsupported(
                    entry,
                    "Structural record shorthand requires a scalar",
                ));
            }
        };

        let mut constructor = String::new();
        let slots = declared_construction::record_slots(
            &short.denotes,
            entry,
            entry,
            program,
            &mut constructor,
            "short_",
        )?;
        let match_text = literal.map_or_else(
            || {
                format!(
                    "text.strip_prefix({prefix:?}).and_then(|text|text.strip_suffix({suffix:?}))"
                )
            },
            |literal| format!("(text=={literal:?}).then_some(\"\")"),
        );
        reads.push((literal.is_none() && prefix.is_empty() && suffix.is_empty(),format!("{{let _inputs=inputs;{guard_constants}if {guard} && scalar.clone().into_text().is_ok(){{if let Some(captured)={match_text}{{let _=captured;{constructor}return construct_{id}(&[{}],inputs);}}}}}}",slots.join(","))));
        if !short.canonical {
            continue;
        }
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Record(names),
            arguments,
        } = &short.denotes.kind
        else {
            return Err(unsupported(
                entry,
                "Structural shorthand requires a record constructor",
            ));
        };
        let mut inverse = Inverse {
            entry,
            program,
            code: String::new(),
            next: 0,
        };
        for (name, expression) in names.iter().zip(arguments) {
            let index = fields.iter().position(|field| &field.name == name).unwrap();
            inverse.cell(expression, &format!("input_field_{id}(value,{index})"))?;
        }
        let output = if let Some(literal) = literal {
            format!("core::yaml::scalar({literal:?})")
        } else if prefix.is_empty() && suffix.is_empty() {
            "core::yaml::scalar(captured)".to_owned()
        } else {
            format!("core::yaml::scalar(&format!(\"{{}}{{}}{{}}\",{prefix:?},captured,{suffix:?}))")
        };
        let capture_default = if literal.is_some() {
            "Some(\"\")"
        } else {
            "None"
        };
        writeln!(writes,"if let Some(captured)=(||->core::Result<Option<&str>>{{let _inputs=inputs;{guard_constants}if !({guard}){{return Ok(None)}}let mut captured:Option<&str>={capture_default};let _=&mut captured;{}Ok(captured)}})()?{{let _=captured;out.push_str(indent);out.push_str(&{output});return Ok(true);}}",inverse.code).unwrap();
    }
    reads.sort_by_key(|(plain, _)| *plain);
    let reads = reads.into_iter().map(|(_, code)| code).collect::<String>();
    let mapping_definitions = if mapping_keys.is_empty() {
        String::new()
    } else {
        format!(
            "fn mapping_projection_{id}(inputs:&InputView<'_>)->core::Result<Option<usize>>{{{mapping_selection}Ok(None)}}fn read_yaml_projection_{id}(index:usize,events:Vec<(core::yaml::Node,core::Position)>,source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{let key=match index{{{mapping_keys}_=>return Err(RuntimeDiagnostic::new(\"yaml.projection\",\"Unknown projection alias\")),}};let position=events.first().map(|event|event.1).unwrap_or_default();let mut reader=OwnerYamlRead{id}::new()?;reader.projection_scanned=true;reader.consume(core::yaml::Node::MappingStart(None),position,source,inputs)?;reader.consume(core::yaml::Node::Scalar(core::yaml::Scalar::new_text(key,position),None),position,source,inputs)?;for (node,position) in events{{reader.consume(node,position,source,inputs)?;}}reader.consume(core::yaml::Node::MappingEnd,position,source,inputs)?;reader.finish(source,inputs)}}"
        )
    };
    Ok(format!(
        "{projection_defaults}{mapping_definitions}fn read_yaml_shorthand_{id}(scalar:&core::yaml::Scalar,position:core::Position,inputs:&InputView<'_>)->core::Result<V{id}>{{let _=position;let text=scalar.lexical_text();let _=text;{reads}Err(RuntimeDiagnostic::new(\"yaml.shorthand\",\"No declared shorthand matches\"))}}\nfn write_yaml_shorthand_{id}(value:&V{id},inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<bool>{{if {raw}{{return Ok(false)}}{writes}Ok(false)}}\n"
    ))
}
