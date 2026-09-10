use super::*;
use std::fmt::Write;

struct Expressions<'a> {
    entry: &'a LinkedEntry,
    program: &'a Program,
    fields: &'a [LinkedField],
    constants: String,
    next_constant: usize,
    transforms: BTreeSet<(u32, u32)>,
    fallible: bool,
}
impl Expressions<'_> {
    fn lower(&mut self, value: &LinkedExpression) -> Result<String, Diagnostic> {
        Ok(match &value.kind {
            LinkedExpressionKind::Variable(slot) => match value.value_type {
                LinkedType::Scalar(ScalarType::Text) => format!("v{slot}.as_str()"),
                _ => {
                    return Err(unsupported(
                        self.entry,
                        "This local variable type is not generated",
                    ));
                }
            },
            LinkedExpressionKind::Field(index) => {
                let field = &self.fields[*index as usize];
                scalar::Codec::resolve(&field.value, self.entry, self.program)?
                    .meaning(&format!("E{}F{index}", self.entry.id), *index as usize)
            }
            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)) => value.to_string(),
            LinkedExpressionKind::Literal(ScalarLiteral::Text(value)) => format!("{value:?}"),
            LinkedExpressionKind::Literal(ScalarLiteral::Number(value)) => {
                let number = nkdk_decimal::Decimal::parse(value)
                    .map_err(|_| unsupported(self.entry, "Invalid decimal constant"))?;
                let (negative, digits, exponent) = number.parts();
                let index = self.next_constant;
                self.next_constant += 1;
                writeln!(self.constants, "const D{index}: core::decimal::Decimal = core::decimal::Decimal::constant({negative}, {digits:?}, {exponent});").unwrap();
                format!("&D{index}")
            }
            LinkedExpressionKind::Operation {
                operator,
                arguments,
            } => {
                let values = arguments
                    .iter()
                    .map(|value| self.lower(value))
                    .collect::<Result<Vec<_>, _>>()?;
                match operator {
                    LinkedOperator::Transform { entry, index } => {
                        self.fallible = true;
                        if self.transforms.insert((*entry, *index)) {
                            let target = self
                                .program
                                .entries
                                .iter()
                                .find(|target| target.id == *entry)
                                .expect("linked transform entry");
                            self.constants.push_str(&text::generate(
                                *entry,
                                *index,
                                &target.text_transforms[*index as usize].definition,
                            ));
                        }
                        format!("text_{entry}_{index}({})?", values[0])
                    }
                    LinkedOperator::MatchOptional(slot) => format!(
                        "match {} {{ Some(v{slot}) => {}, None => {} }}",
                        values[0], values[1], values[2]
                    ),
                    LinkedOperator::Equal | LinkedOperator::Less | LinkedOperator::LessEqual => {
                        if arguments[0].value_type == LinkedType::Scalar(ScalarType::Decimal) {
                            let function = match operator {
                                LinkedOperator::Equal => "PartialEq::eq",
                                LinkedOperator::Less => "PartialOrd::lt",
                                _ => "PartialOrd::le",
                            };
                            format!("std::cmp::{function}({}, {})", values[0], values[1])
                        } else {
                            format!("({}) == ({})", values[0], values[1])
                        }
                    }
                    LinkedOperator::Not => format!("!({})", values[0]),
                    LinkedOperator::And | LinkedOperator::Or => {
                        if values.is_empty() {
                            if *operator == LinkedOperator::And {
                                "true".into()
                            } else {
                                "false".into()
                            }
                        } else {
                            values
                                .iter()
                                .map(|value| format!("({value})"))
                                .collect::<Vec<_>>()
                                .join(if *operator == LinkedOperator::And {
                                    " && "
                                } else {
                                    " || "
                                })
                        }
                    }
                    LinkedOperator::Conditional => format!(
                        "if {} {{ {} }} else {{ {} }}",
                        values[0], values[1], values[2]
                    ),
                    _ => {
                        return Err(unsupported(
                            self.entry,
                            "Constraint operation is not generated by the scalar profile",
                        ));
                    }
                }
            }
            _ => {
                return Err(unsupported(
                    self.entry,
                    "Constraint needs an unsupported runtime input or collection expression",
                ));
            }
        })
    }
}
pub(super) fn generate(entry: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
    let LinkedType::Record(fields) = &entry.value else {
        return Err(unsupported(entry, "Constraints require a record"));
    };
    let YamlRepresentation::Mapping(yaml) = &entry.yaml else {
        return Err(unsupported(entry, "Constraints require a YAML mapping"));
    };
    let mut out = String::new();
    for (side, phase, form) in [
        ("xml", ValidationPhase::XmlImport, LinkedForm::XmlRecord),
        (
            "yaml",
            ValidationPhase::YamlValidation,
            LinkedForm::YamlMapping,
        ),
    ] {
        let selected: Vec<_> = entry
            .constraints
            .iter()
            .filter(|constraint| {
                constraint.applies_to.contains(&phase)
                    && (constraint.forms.is_empty() || constraint.forms.contains(&form))
            })
            .collect();
        writeln!(
            out,
            "fn check_{side}_{}(_value: &V{}, _source: &[u8]) -> Vec<RuntimeDiagnostic> {{",
            entry.id, entry.id
        )
        .unwrap();
        if selected.is_empty() {
            out.push_str("Vec::new() }\n");
            continue;
        }
        let mut expressions = Expressions {
            entry,
            program,
            fields,
            constants: String::new(),
            next_constant: 0,
            transforms: BTreeSet::new(),
            fallible: false,
        };
        let mut body = String::new();
        for constraint in selected {
            expressions.fallible = false;
            if constraint.for_each.is_some() || constraint.diagnostic.source.is_some() {
                return Err(unsupported(
                    entry,
                    "Iteration and external diagnostic sources are not generated by this profile",
                ));
            }
            let code = constraint.diagnostic.code.as_ref().ok_or_else(|| {
                unsupported(
                    entry,
                    "A generated scalar constraint requires an explicit diagnostic code",
                )
            })?;
            let message = constraint
                .diagnostic
                .message
                .iter()
                .map(|part| match part {
                    LinkedMessagePart::Text(text) => Ok(text.as_str()),
                    _ => Err(unsupported(
                        entry,
                        "Dynamic diagnostic messages are not generated by this profile",
                    )),
                })
                .collect::<Result<Vec<_>, _>>()?
                .join("");
            let when = constraint
                .when
                .as_ref()
                .map(|value| expressions.lower(value))
                .transpose()?
                .unwrap_or_else(|| "true".into());
            let assertion = expressions.lower(&constraint.assertion)?;
            let address = match constraint.diagnostic.at {
                LinkedDiagnosticTarget::SelfValue => String::new(),
                LinkedDiagnosticTarget::Field(index) => {
                    let field = &fields[index as usize];
                    let key = &yaml
                        .iter()
                        .find(|mapping| mapping.field == field.name)
                        .expect("linked mapping")
                        .key;
                    format!(".field({key:?})")
                }
                _ => {
                    return Err(unsupported(
                        entry,
                        "Occurrence diagnostics require collection generation",
                    ));
                }
            };
            let position = match constraint.diagnostic.at {
                LinkedDiagnosticTarget::Field(index) => format!("_value.positions[{index}]"),
                _ => "core::Position::default()".into(),
            };
            let severity = match constraint.diagnostic.severity {
                Severity::Error => "Error",
                Severity::Warning => "Warning",
                Severity::Info => "Info",
            };
            let condition = if when == "true" {
                format!("!({assertion})")
            } else {
                format!("({when}) && !({assertion})")
            };
            let report = format!(
                "let mut error = RuntimeDiagnostic::new({code:?}, {message:?}){address}; error.severity = core::Severity::{severity}; errors.push({position}.apply(_source, error));"
            );
            if expressions.fallible {
                writeln!(body, "let evaluate = || -> core::Result<bool> {{ Ok({condition}) }}; match evaluate() {{ Ok(true) => {{ {report} }}, Ok(false) => {{}}, Err(error) => errors.push({position}.apply(_source, error{address})), }}").unwrap();
            } else {
                writeln!(body, "if {condition} {{ {report} }}").unwrap();
            }
        }
        out.push_str(&expressions.constants);
        out.push_str("let mut errors = Vec::new();\n");
        out.push_str(&body);
        out.push_str("errors }\n");
    }
    Ok(out)
}
