use super::*;
use yaml_rust2::{
    Yaml,
    parser::{Event, MarkedEventReceiver, Parser},
    scanner::{Marker, TScalarStyle},
};

/// JSON is a subset of the accepted YAML input document. Record field order is
/// significant and follows the declaration and the serialized mapping.
pub fn read(source: &[u8]) -> Result<Vec<(String, InputValue)>> {
    let source = std::str::from_utf8(source)
        .map_err(|error| RuntimeDiagnostic::new("input.encoding", error.to_string()))?;
    let mut receiver = Receiver::default();
    Parser::new_from_str(source)
        .load(&mut receiver, true)
        .map_err(|error| {
            RuntimeDiagnostic::new("input.syntax", error.to_string())
                .at(error.marker().line(), error.marker().col() + 1)
        })?;
    if let Some(error) = receiver.error {
        return Err(error);
    }
    if receiver.documents != 1 || !receiver.stack.is_empty() {
        return Err(RuntimeDiagnostic::new(
            "input.mapping",
            "Expected one input mapping",
        ));
    }
    let Some(InputValue::Record(values)) = receiver.root else {
        return Err(RuntimeDiagnostic::new(
            "input.mapping",
            "Expected one input mapping",
        ));
    };
    Ok(values)
}

enum Container {
    Mapping {
        values: Vec<(String, InputValue)>,
        key: Option<String>,
    },
    Sequence(Vec<InputValue>),
}

#[derive(Default)]
struct Receiver {
    root: Option<InputValue>,
    stack: Vec<Container>,
    documents: usize,
    error: Option<RuntimeDiagnostic>,
}
impl Receiver {
    fn value(&mut self, value: InputValue) -> Result<()> {
        match self.stack.last_mut() {
            Some(Container::Sequence(values)) => values.push(value),
            Some(Container::Mapping { values, key }) => {
                let key = key.take().ok_or_else(|| {
                    RuntimeDiagnostic::new("input.key", "Expected a text record field")
                })?;
                values.push((key, value));
            }
            None if self.root.is_none() => self.root = Some(value),
            None => {
                return Err(RuntimeDiagnostic::new(
                    "input.form",
                    "Expected one input value",
                ));
            }
        }
        Ok(())
    }

    fn scalar(&mut self, text: String, style: TScalarStyle) -> Result<()> {
        if let Some(Container::Mapping { key, .. }) = self.stack.last_mut()
            && key.is_none()
        {
            if style == TScalarStyle::Plain && !matches!(Yaml::from_str(&text), Yaml::String(_)) {
                return Err(RuntimeDiagnostic::new(
                    "input.key",
                    "Expected a text record field",
                ));
            }
            *key = Some(text);
            return Ok(());
        }
        let value = if style != TScalarStyle::Plain {
            InputValue::Text(text)
        } else if text == "true" || text == "false" {
            InputValue::Boolean(text == "true")
        } else if let Ok(number) = Decimal::parse(&text) {
            InputValue::Decimal(number)
        } else if matches!(Yaml::from_str(&text), Yaml::String(_)) {
            InputValue::Text(text)
        } else {
            return Err(RuntimeDiagnostic::new(
                "input.scalar",
                "Unsupported input scalar",
            ));
        };
        self.value(value)
    }

    fn event(&mut self, event: Event) -> Result<()> {
        match event {
            Event::StreamStart | Event::StreamEnd | Event::DocumentEnd => Ok(()),
            Event::DocumentStart => {
                self.documents += 1;
                Ok(())
            }
            Event::MappingStart(0, None) => {
                self.stack.push(Container::Mapping {
                    values: Vec::new(),
                    key: None,
                });
                Ok(())
            }
            Event::MappingEnd => {
                let Some(Container::Mapping { values, key: None }) = self.stack.pop() else {
                    return Err(RuntimeDiagnostic::new(
                        "input.form",
                        "Incomplete input mapping",
                    ));
                };
                self.value(InputValue::Record(values))
            }
            Event::SequenceStart(0, None) => {
                self.stack.push(Container::Sequence(Vec::new()));
                Ok(())
            }
            Event::SequenceEnd => {
                let Some(Container::Sequence(values)) = self.stack.pop() else {
                    return Err(RuntimeDiagnostic::new(
                        "input.form",
                        "Incomplete input sequence",
                    ));
                };
                self.value(InputValue::Sequence(values))
            }
            Event::Scalar(text, style, 0, None) => self.scalar(text, style),
            Event::Alias(_)
            | Event::Scalar(_, _, _, _)
            | Event::SequenceStart(_, _)
            | Event::MappingStart(_, _)
            | Event::Nothing => Err(RuntimeDiagnostic::new(
                "input.form",
                "Expected an untagged input mapping of scalars, sequences or records without aliases",
            )),
        }
    }
}
impl MarkedEventReceiver for Receiver {
    fn on_event(&mut self, event: Event, marker: Marker) {
        if self.error.is_none() {
            self.error = self
                .event(event)
                .err()
                .map(|error| error.at(marker.line(), marker.col() + 1));
        }
    }
}
