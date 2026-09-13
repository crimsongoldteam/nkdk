use super::{Name, Payload, Result, Tree, failure, read, render};

pub struct Patch(Payload);
impl Patch {
    /// Serialize the patch itself, preserving removals and empty containers.
    /// Applying it to an empty tree would discard those instructions.
    pub fn to_yaml(&self) -> String {
        super::render_payload(&self.0, 0, true)
    }

    pub fn is_null(&self) -> bool {
        matches!(self.0, Payload::Null)
    }
    /// An attribute can retain its lexical text or be absent, but cannot carry
    /// the element structure allowed by a property patch.
    pub fn attribute_text(&self) -> Result<Option<&str>> {
        match &self.0 {
            Payload::Null => Ok(None),
            Payload::Text(text) => Ok(Some(text)),
            _ => Err(failure("An attribute patch requires text or null")),
        }
    }
    pub fn read(
        source: &[u8],
        namespaces: &[(&str, &str)],
        qnames: &[(&str, &str)],
    ) -> Result<Self> {
        let value = read::parse(source)?;
        if matches!(value, Payload::Sequence(_)) {
            return Err(failure("A property patch cannot be a sequence"));
        }
        validate(&value, namespaces, qnames)?;
        Ok(Self(value))
    }
    pub fn apply(
        &self,
        ordinary: Option<Tree>,
        name: Name,
        namespaces: &[(&str, &str)],
        qnames: &[(&str, &str)],
    ) -> Result<Tree> {
        let base = ordinary
            .map(|tree| tree.payload(namespaces, qnames))
            .transpose()?
            .unwrap_or(Payload::Null);
        read::build(name, merge(base, &self.0), namespaces, qnames)
    }
}
impl Tree {
    pub fn patch_yaml(
        &self,
        ordinary: Option<&Self>,
        namespaces: &[(&str, &str)],
        qnames: &[(&str, &str)],
    ) -> Result<String> {
        let expected = self.payload(namespaces, qnames)?;
        let patch = match ordinary {
            Some(ordinary) => difference(&expected, &ordinary.payload(namespaces, qnames)?)
                .unwrap_or(Payload::Mapping(Vec::new())),
            None => insertion(&expected),
        };
        if matches!(&patch,Payload::Mapping(fields) if fields.is_empty()) {
            return Ok("{}".into());
        }
        Ok(render(&patch, 0))
    }
}
fn validate(value: &Payload, namespaces: &[(&str, &str)], qnames: &[(&str, &str)]) -> Result<()> {
    match value {
        Payload::Text(value) => super::super::validate_text(value),
        Payload::Null => Ok(()),
        Payload::Sequence(values) => {
            for value in values {
                validate(value, namespaces, qnames)?;
            }
            Ok(())
        }
        Payload::Mapping(fields) => {
            let mut seen = std::collections::BTreeSet::new();
            for (key, value) in fields {
                if key == "#order" {
                    if let Payload::Sequence(names) = value {
                        for name in names {
                            let Payload::Text(name) = name else {
                                return Err(failure("Order requires text names"));
                            };
                            read::expand(name, namespaces, false)?;
                        }
                    } else if !matches!(value, Payload::Null) {
                        return Err(failure("Order requires a sequence"));
                    }
                } else if key == "#qname" {
                    if !matches!(value, Payload::Null) {
                        read::qname_payload(value)?;
                    }
                } else if key == "#text" {
                    if let Payload::Text(text) = value {
                        super::super::validate_text(text)?;
                    } else if !matches!(value, Payload::Null) {
                        return Err(failure("Text patch requires text"));
                    }
                } else if let Some(key) = key.strip_prefix('_') {
                    let name = read::expand(key, namespaces, true)?;
                    if !seen.insert((true, name.clone())) {
                        return Err(failure("Repeated expanded attribute name"));
                    }
                    match value {
                        Payload::Null => (),
                        Payload::Text(value) => {
                            super::super::validate_text(value)?;
                            if qnames
                                .iter()
                                .any(|(uri, local)| *uri == name.namespace && *local == name.local)
                            {
                                read::expand(value, namespaces, false)?;
                            }
                        }
                        _ => return Err(failure("Attribute patch requires text or null")),
                    }
                } else {
                    let name = read::expand(key, namespaces, false)?;
                    if !seen.insert((false, name)) {
                        return Err(failure("Repeated expanded child name"));
                    }
                    validate(value, namespaces, qnames)?;
                }
            }
            Ok(())
        }
    }
}
fn merge(base: Payload, patch: &Payload) -> Payload {
    let Payload::Mapping(fields) = patch else {
        return patch.clone();
    };
    let mut base = match base {
        Payload::Mapping(fields) => fields,
        Payload::Null => Vec::new(),
        value => vec![("#text".into(), value)],
    };
    for (key, value) in fields {
        let index = base.iter().position(|(name, _)| name == key);
        if matches!(value, Payload::Null) {
            if let Some(index) = index {
                base.remove(index);
            }
        } else if let Some(index) = index {
            let ordinary = std::mem::replace(&mut base[index].1, Payload::Null);
            base[index].1 = merge(ordinary, value);
        } else {
            base.push((key.clone(), value.clone()));
        }
    }
    // When all surviving attributes are explicit, their patch order is the
    // required XML order. A partial patch keeps the ordinary attribute order.
    let order: Vec<_> = fields
        .iter()
        .filter(|(key, value)| key.starts_with('_') && !matches!(value, Payload::Null))
        .map(|(key, _)| key.as_str())
        .collect();
    if !order.is_empty()
        && base
            .iter()
            .filter(|(key, _)| key.starts_with('_'))
            .all(|(key, _)| order.contains(&key.as_str()))
    {
        base.sort_by_key(|(key, _)| {
            order
                .iter()
                .position(|name| *name == key)
                .unwrap_or(order.len())
        });
    }
    Payload::Mapping(base)
}
fn difference(expected: &Payload, actual: &Payload) -> Option<Payload> {
    if expected == actual {
        return None;
    }
    let (Payload::Mapping(expected), Payload::Mapping(actual)) = (expected, actual) else {
        return Some(insertion(expected));
    };
    let mut fields = Vec::new();
    for (key, value) in expected {
        match actual.iter().find(|(name, _)| name == key) {
            Some((_, actual)) => {
                if let Some(value) = difference(value, actual) {
                    // Inside a mapping null means deletion; an existing empty element
                    // is represented by empty text instead of deleting that element.
                    let value = if matches!(value, Payload::Null) && !key.starts_with('_') {
                        Payload::Text(String::new())
                    } else {
                        value
                    };
                    fields.push((key.clone(), value));
                }
            }
            None => fields.push(inserted_field(key, value)),
        }
    }
    for (key, _) in actual {
        if !expected.iter().any(|(name, _)| name == key) {
            fields.push((key.clone(), Payload::Null));
        }
    }
    let attributes = |values: &[(String, Payload)]| {
        values
            .iter()
            .filter(|(key, _)| key.starts_with('_'))
            .cloned()
            .collect::<Vec<_>>()
    };
    let projected = merge(
        Payload::Mapping(attributes(actual)),
        &Payload::Mapping(attributes(&fields)),
    );
    let Payload::Mapping(projected) = projected else {
        unreachable!("attribute mapping");
    };
    let desired = attributes(expected);
    if projected
        .iter()
        .map(|(key, _)| key)
        .ne(desired.iter().map(|(key, _)| key))
    {
        let mut ordered = desired;
        ordered.extend(
            fields
                .into_iter()
                .filter(|(key, value)| !key.starts_with('_') || matches!(value, Payload::Null)),
        );
        fields = ordered;
    }
    let Payload::Mapping(projected) = merge(
        Payload::Mapping(actual.clone()),
        &Payload::Mapping(fields.clone()),
    ) else {
        unreachable!("merged mapping")
    };
    let desired = child_order(expected);
    if desired != child_order(&projected) {
        fields.retain(|(key, _)| key != "#order");
        fields.push(("#order".into(), Payload::Sequence(desired)));
    }
    Some(Payload::Mapping(fields))
}
fn child_order(fields: &[(String, Payload)]) -> Vec<Payload> {
    if let Some((_, Payload::Sequence(order))) = fields.iter().find(|(key, _)| key == "#order") {
        return order.clone();
    }
    fields
        .iter()
        .filter(|(key, _)| !key.starts_with('_') && !key.starts_with('#'))
        .flat_map(|(key, value)| {
            let count = if let Payload::Sequence(values) = value {
                values.len()
            } else {
                1
            };
            std::iter::repeat_n(Payload::Text(key.clone()), count)
        })
        .collect()
}

// In a patch mapping null removes a member. New empty XML children must instead
// be represented as empty text, including when the ordinary property is absent.
fn inserted_field(key: &str, value: &Payload) -> (String, Payload) {
    (
        key.into(),
        if matches!(value, Payload::Null) && !key.starts_with('_') {
            Payload::Text(String::new())
        } else {
            value.clone()
        },
    )
}
fn insertion(value: &Payload) -> Payload {
    match value {
        Payload::Mapping(fields) => Payload::Mapping(
            fields
                .iter()
                .map(|(key, value)| inserted_field(key, value))
                .collect(),
        ),
        value => value.clone(),
    }
}
