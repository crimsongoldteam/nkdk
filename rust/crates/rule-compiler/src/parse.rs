use nkdk_rule_model::{Diagnostic, Module, SourceFile, SourceLocation};
use std::collections::HashMap;
use yaml_rust2::{
    Yaml,
    parser::{Event, MarkedEventReceiver, Parser},
    scanner::{Marker, TScalarStyle},
};

struct Mapping {
    expecting_key: bool,
    keys: HashMap<String, Marker>,
}

struct KeyAudit<'a> {
    path: &'a str,
    frames: Vec<Option<Mapping>>,
    errors: Vec<Diagnostic>,
    documents: usize,
    events: Vec<(Event, Marker)>,
}

impl KeyAudit<'_> {
    fn expecting_key(&self) -> bool {
        self.frames
            .last()
            .is_some_and(|frame| frame.as_ref().is_some_and(|m| m.expecting_key))
    }
    fn reject(&mut self, code: &str, mark: Marker) {
        self.errors.push(Diagnostic {
            code: code.into(),
            file: self.path.into(),
            line: mark.line(),
            column: mark.col() + 1,
            message: format!("Forbidden declaration syntax: {code}"),
            related: vec![],
        });
    }

    fn node(&mut self, key: Option<&str>, mark: Marker) {
        if key.is_none() && self.expecting_key() {
            self.reject("non_string_key", mark);
        }
        if key == Some("<<")
            && self
                .frames
                .last()
                .is_some_and(|frame| frame.as_ref().is_some_and(|m| m.expecting_key))
        {
            self.reject("yaml_merge_key", mark);
        }
        let Some(Some(mapping)) = self.frames.last_mut() else {
            return;
        };
        if mapping.expecting_key
            && let Some(key) = key
        {
            if let Some(first) = mapping.keys.get(key) {
                self.errors.push(Diagnostic {
                    code: "duplicate_key".into(),
                    file: self.path.into(),
                    line: mark.line(),
                    column: mark.col() + 1,
                    message: format!("Duplicate mapping key: {key}"),
                    related: vec![SourceLocation {
                        file: self.path.into(),
                        line: first.line(),
                        column: first.col() + 1,
                    }],
                });
            } else {
                mapping.keys.insert(key.into(), mark);
            }
        }
        mapping.expecting_key = !mapping.expecting_key;
    }
}

impl MarkedEventReceiver for KeyAudit<'_> {
    fn on_event(&mut self, event: Event, mark: Marker) {
        self.events.push((event.clone(), mark));
        match &event {
            Event::Scalar(_, _, anchor, tag)
            | Event::MappingStart(anchor, tag)
            | Event::SequenceStart(anchor, tag) => {
                if *anchor != 0 {
                    self.reject("yaml_anchor", mark);
                }
                if tag.is_some() {
                    self.reject("yaml_tag", mark);
                }
            }
            Event::Alias(_) => self.reject("yaml_alias", mark),
            Event::DocumentStart => {
                self.documents += 1;
                if self.documents > 1 {
                    self.reject("multiple_documents", mark);
                }
            }
            _ => {}
        }
        match event {
            Event::Scalar(value, style, ..) => {
                if self.expecting_key()
                    && style == TScalarStyle::Plain
                    && (matches!(value.as_str(), "Null" | "NULL")
                        || !matches!(Yaml::from_str(&value), Yaml::String(_)))
                {
                    self.reject("non_string_key", mark);
                }
                self.node(Some(&value), mark);
            }
            Event::MappingStart(..) => {
                self.node(None, mark);
                self.frames.push(Some(Mapping {
                    expecting_key: true,
                    keys: HashMap::new(),
                }));
            }
            Event::SequenceStart(..) => {
                self.node(None, mark);
                self.frames.push(None);
            }
            Event::MappingEnd | Event::SequenceEnd => {
                self.frames.pop();
            }
            Event::Alias(..) => self.node(None, mark),
            _ => {}
        }
    }
}

pub fn parse(source: SourceFile<'_>) -> Result<Module, Vec<Diagnostic>> {
    let path = source.path.to_owned();
    let mut modules = parse_many(source)?;
    if modules.len() != 1 {
        return Err(vec![Diagnostic {
            code: "expected_single_declaration".into(),
            file: path,
            line: 1,
            column: 1,
            message: "Use parse_many to read a declaration catalog".into(),
            related: vec![],
        }]);
    }
    Ok(modules.remove(0))
}

pub fn parse_many(source: SourceFile<'_>) -> Result<Vec<Module>, Vec<Diagnostic>> {
    let text = std::str::from_utf8(source.bytes).map_err(|_| {
        vec![Diagnostic {
            code: "invalid_utf8".into(),
            file: source.path.into(),
            line: 1,
            column: 1,
            message: "Declaration must be UTF-8".into(),
            related: vec![],
        }]
    })?;
    let mut audit = KeyAudit {
        path: source.path,
        frames: vec![],
        errors: vec![],
        documents: 0,
        events: vec![],
    };
    if let Err(error) = Parser::new_from_str(text).load(&mut audit, true) {
        audit.errors.push(Diagnostic {
            code: "yaml_syntax".into(),
            file: source.path.into(),
            line: error.marker().line(),
            column: error.marker().col() + 1,
            message: error.info().into(),
            related: vec![],
        });
    }
    if !audit.errors.is_empty() {
        return Err(audit.errors);
    }
    crate::syntax::decode(source.path, audit.events).map_err(|error| vec![error])
}
