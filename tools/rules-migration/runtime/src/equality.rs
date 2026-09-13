use yaml_rust2::{
    Yaml,
    parser::{Event, MarkedEventReceiver, Parser},
    scanner::{Marker, TScalarStyle},
};

// Event order and tags are part of the contract: loading a mapping would erase duplicates.
#[derive(Default)]
struct Events(Vec<String>);
impl MarkedEventReceiver for Events {
    fn on_event(&mut self, event: Event, _: Marker) {
        match event {
            Event::Scalar(text, style, anchor, tag) => {
                assert_eq!(anchor, 0, "anchors are not portable contract data");
                let value = if style == TScalarStyle::Plain {
                    Yaml::from_str(&text)
                } else {
                    Yaml::String(text)
                };
                self.0.push(format!("scalar:{value:?}:{tag:?}"));
            }
            Event::StreamStart | Event::StreamEnd | Event::DocumentStart | Event::DocumentEnd => (),
            Event::Alias(_) => panic!("aliases are not portable contract data"),
            other => self.0.push(format!("{other:?}")),
        }
    }
}
fn events(source: &str) -> Vec<String> {
    let mut output = Events::default();
    Parser::new_from_str(source)
        .load(&mut output, true)
        .expect("valid YAML contract");
    output.0
}
pub fn compare(expected: &str, actual: &str) {
    assert_eq!(events(expected), events(actual), "independent YAML events");
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn tags_duplicates_order_and_empty_states_are_significant() {
        compare("x: 'a: b'", "x: \"a: b\"");
        for (a, b) in [
            ("x: !xml/invalid a", "x: a"),
            ("x: a\nx: b", "x: b"),
            ("x: a\ny: b", "y: b\nx: a"),
            ("x:", "x: ''"),
        ] {
            assert!(std::panic::catch_unwind(|| compare(a, b)).is_err());
        }
    }
}
