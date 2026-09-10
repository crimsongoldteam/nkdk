use super::*;
use yaml_rust2::{
    Yaml,
    parser::{Event, MarkedEventReceiver, Parser},
    scanner::{Marker, TScalarStyle},
};

/// JSON is a subset of the accepted YAML input document. No generic JSON number is created.
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
    if receiver.documents != 1 || !receiver.closed {
        return Err(RuntimeDiagnostic::new(
            "input.mapping",
            "Expected one input mapping",
        ));
    }
    Ok(receiver.values)
}
#[derive(Default)]
struct Receiver {
    values: Vec<(String, InputValue)>,
    sequences: Vec<Vec<InputValue>>,
    key: Option<String>,
    opened: bool,
    closed: bool,
    documents: usize,
    error: Option<RuntimeDiagnostic>,
}
impl Receiver {
    fn value(&mut self, value: InputValue) -> Result<()> {
        if let Some(sequence) = self.sequences.last_mut() {
            sequence.push(value);
        } else {
            let key = self
                .key
                .take()
                .ok_or_else(|| RuntimeDiagnostic::new("input.key", "Expected a text input name"))?;
            self.values.push((key, value));
        }
        Ok(())
    }
    fn event(&mut self, event: Event) -> Result<()> {
        match event {
            Event::StreamStart | Event::StreamEnd | Event::DocumentEnd => {}
            Event::DocumentStart if self.documents == 0 => self.documents += 1,
            Event::MappingStart(0, None) if !self.opened => self.opened = true,
            Event::MappingEnd
                if self.opened
                    && !self.closed
                    && self.sequences.is_empty()
                    && self.key.is_none() =>
            {
                self.closed = true
            }
            Event::SequenceStart(0, None) if self.key.is_some() && !self.closed => {
                self.sequences.push(Vec::new())
            }
            Event::SequenceEnd if !self.sequences.is_empty() => {
                let value = self.sequences.pop().expect("nonempty stack");
                self.value(InputValue::Sequence(value))?;
            }
            Event::Scalar(text, style, 0, None) if self.opened && !self.closed => {
                let plain = style == TScalarStyle::Plain;
                if self.key.is_none() && self.sequences.is_empty() {
                    if plain && !matches!(Yaml::from_str(&text), Yaml::String(_)) {
                        return Err(RuntimeDiagnostic::new(
                            "input.key",
                            "Expected a text input name",
                        ));
                    }
                    self.key = Some(text);
                } else {
                    let value = if !plain {
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
                    self.value(value)?;
                }
            }
            _ => {
                return Err(RuntimeDiagnostic::new(
                    "input.form",
                    "Expected an untagged input mapping of scalars or sequences without aliases",
                ));
            }
        }
        Ok(())
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
