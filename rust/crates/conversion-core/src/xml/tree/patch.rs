use super::{Name, Payload, Result, Tree, failure, read, render};

#[derive(Clone)]
pub struct Patch {
    payload: Payload,
    replace: bool,
}

impl std::fmt::Debug for Patch {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str("XmlPatch")
    }
}

impl crate::xml::attribute_scan::Source for crate::xml::attribute_scan::Preserved<'_> {
    fn visit_attributes(
        self,
        mut consume: impl FnMut(crate::xml::attribute_scan::Event<'_>) -> Result<()>,
    ) -> Result<()> {
        fn walk(
            value: &Payload,
            root: (&str, &str),
            namespaces: &[(&str, &str)],
            consume: &mut impl FnMut(crate::xml::attribute_scan::Event<'_>) -> Result<()>,
        ) -> Result<()> {
            use crate::xml::attribute_scan::Event;
            match value {
                Payload::Null => return Ok(()),
                Payload::Sequence(values) => {
                    for value in values {
                        if matches!(value, Payload::Sequence(_)) {
                            return Err(failure("Nested child sequence"));
                        }
                        walk(value, root, namespaces, consume)?;
                    }
                    return Ok(());
                }
                _ => (),
            }
            consume(Event::Enter(root))?;
            if let Payload::Mapping(fields) = value {
                for (key, value) in fields {
                    if let Some(key) = key.strip_prefix('_')
                        && let Payload::Text(value) = value
                    {
                        let name = read::expand(key, namespaces, true)?;
                        consume(Event::Attribute((&name.namespace, &name.local), value))?;
                    }
                }
                for (key, value) in fields {
                    if !key.starts_with('_') && !key.starts_with('#') {
                        let name = read::expand(key, namespaces, false)?;
                        walk(value, (&name.namespace, &name.local), namespaces, consume)?;
                    }
                }
            }
            consume(Event::Leave)
        }
        super::super::validate_qname(self.root)?;
        walk(
            &self.patch.payload,
            self.root,
            self.namespaces,
            &mut consume,
        )
    }
}
impl Patch {
    /// Serialize the patch itself, preserving removals and empty containers.
    /// Applying it to an empty tree would discard those instructions.
    pub fn to_yaml(&self) -> String {
        if !self.replace {
            return super::render_payload(&self.payload, 0, true);
        }
        let Payload::Mapping(fields) = &self.payload else {
            unreachable!("a full replacement has a mapping payload")
        };
        let mut fields = fields.clone();
        fields.insert(0, ("#replace".into(), Payload::Text("true".into())));
        super::render_payload(&Payload::Mapping(fields), 0, true)
    }

    /// Read preserved text classification at a descendant occurrence.
    /// Paths are relative to the patched element; missing entries inherit
    /// the semantic base unless this patch replaces the whole element.
    pub fn text_is_qname(
        &self,
        path: &[Name],
        occurrences: &[usize],
        namespaces: &[(&str, &str)],
    ) -> Option<bool> {
        if path.len() != occurrences.len() {
            return None;
        }
        let mut value = &self.payload;
        for (name, occurrence) in path.iter().zip(occurrences) {
            let Payload::Mapping(fields) = value else {
                return Some(false);
            };
            let next = fields.iter().find(|(key, _)| {
                !key.starts_with('_')
                    && !key.starts_with('#')
                    && read::expand(key, namespaces, false)
                        .is_ok_and(|candidate| candidate == *name)
            });
            let Some((_, next)) = next else {
                return self.replace.then_some(false);
            };
            value = match next {
                Payload::Sequence(values) => {
                    let Some(value) = occurrence
                        .checked_sub(1)
                        .and_then(|index| values.get(index))
                    else {
                        return Some(false);
                    };
                    value
                }
                value if *occurrence == 1 => value,
                _ => return Some(false),
            };
        }
        match value {
            Payload::Mapping(fields) if fields.iter().any(|(key, _)| key == "#qname") => Some(true),
            Payload::Mapping(fields) if !fields.iter().any(|(key, _)| key == "#text") => {
                self.replace.then_some(false)
            }
            _ => Some(false),
        }
    }

    /// A replacement contains the whole subtree, independent of semantic meaning.
    pub fn is_replacement(&self) -> bool {
        self.replace
    }
    /// Whether a partial patch leaves the canonical root attribute untouched.
    /// Explicit removals and complete replacements own the attribute themselves.
    pub fn inherits_attribute(
        &self,
        name: (&str, &str),
        namespaces: &[(&str, &str)],
    ) -> Result<bool> {
        if self.replace || self.is_null() {
            return Ok(false);
        }
        let Payload::Mapping(fields) = &self.payload else {
            return Ok(false);
        };
        for (key, _) in fields {
            if let Some(key) = key.strip_prefix('_') {
                let candidate = read::expand(key, namespaces, true)?;
                if candidate.namespace == name.0 && candidate.local == name.1 {
                    return Ok(false);
                }
            }
        }
        Ok(true)
    }

    pub fn is_null(&self) -> bool {
        matches!(self.payload, Payload::Null)
    }
    /// An attribute can retain its lexical text or be absent, but cannot carry
    /// the element structure allowed by a property patch.
    pub fn attribute_text(&self) -> Result<Option<&str>> {
        match &self.payload {
            Payload::Null => Ok(None),
            Payload::Text(text) => Ok(Some(text)),
            _ => Err(failure("An attribute patch requires text or null")),
        }
    }
    /// QName attribute patches store expanded names, independent of prefixes.
    pub fn attribute_qname(&self) -> Result<Option<(&str, &str)>> {
        self.attribute_text()?
            .map(|text| {
                if let Some(expanded) = text.strip_prefix('{') {
                    expanded
                        .split_once('}')
                        .filter(|(_, local)| !local.is_empty())
                        .ok_or_else(|| failure("Invalid expanded attribute QName"))
                } else {
                    Ok(("", text))
                }
            })
            .transpose()
    }
    pub fn read(
        source: &[u8],
        namespaces: &[(&str, &str)],
        qnames: &[(&str, &str)],
    ) -> Result<Self> {
        let mut value = read::parse(source)?;
        if matches!(value, Payload::Sequence(_)) {
            return Err(failure("A property patch cannot be a sequence"));
        }
        let replace = if let Payload::Mapping(fields) = &mut value {
            if let Some(index) = fields.iter().position(|(name, _)| name == "#replace") {
                let (_, marker) = fields.remove(index);
                if marker != Payload::Text("true".into()) {
                    return Err(failure("A full replacement marker requires true"));
                }
                true
            } else {
                false
            }
        } else {
            false
        };
        validate(&value, namespaces, qnames)?;
        Ok(Self {
            payload: value,
            replace,
        })
    }
    /// A captured XML element has no semantic base to merge with.
    pub fn read_full(
        source: &[u8],
        namespaces: &[(&str, &str)],
        qnames: &[(&str, &str)],
    ) -> Result<Self> {
        let mut patch = Self::read(source, namespaces, qnames)?;
        patch.payload = match patch.payload {
            Payload::Text(text) => Payload::Mapping(vec![("#text".into(), Payload::Text(text))]),
            Payload::Mapping(fields) => Payload::Mapping(fields),
            Payload::Null | Payload::Sequence(_) => {
                return Err(failure("A full replacement requires an XML element"));
            }
        };
        patch.replace = true;
        Ok(patch)
    }
    pub fn apply(
        &self,
        ordinary: Option<Tree>,
        name: Name,
        namespaces: &[(&str, &str)],
        qnames: &[(&str, &str)],
    ) -> Result<Tree> {
        let base = (!self.replace)
            .then_some(ordinary)
            .flatten()
            .map(|tree| tree.payload(&[], qnames))
            .transpose()?
            .unwrap_or(Payload::Null);
        let mut patch = canonical_names(&self.payload, namespaces)?;
        if !self.replace {
            complete_legacy_null_type_patch(&mut patch, namespaces, qnames)?;
        }
        read::build(name, merge(base, &patch), namespaces, qnames)
    }
}
fn complete_legacy_null_type_patch(
    patch: &mut Payload,
    namespaces: &[(&str, &str)],
    qnames: &[(&str, &str)],
) -> Result<()> {
    const XSI: &str = "http://www.w3.org/2001/XMLSchema-instance";
    const V8: &str = "http://v8.1c.ru/8.1/data/core";
    if !qnames.contains(&(XSI, "type")) {
        return Ok(());
    }
    let Payload::Mapping(fields) = patch else {
        return Ok(());
    };
    let type_key = format!("_{{{XSI}}}type");
    let nil_key = format!("_{{{XSI}}}nil");
    if fields.iter().any(|(key, _)| key == &nil_key) {
        return Ok(());
    }
    let Some((_, Payload::Text(value))) = fields.iter().find(|(key, _)| key == &type_key) else {
        return Ok(());
    };
    let value = read::expand(value, namespaces, false)?;
    if value.namespace == V8 && value.local == "Null" {
        // Older YAML records only xsi:type here. Its intended XML has no
        // xsi:nil, even if a newer ordinary writer supplied one.
        fields.push((nil_key, Payload::Null));
    }
    Ok(())
}
impl Tree {
    /// Preserve a whole captured element when semantic decoding is impossible.
    /// The result must replace, rather than merge with, a canonical element.
    /// Preserve only syntax differences from a decoded scalar's ordinary text.
    pub fn text_patch_yaml(
        &self,
        text: &str,
        namespaces: &[(&str, &str)],
        qnames: &[(&str, &str)],
    ) -> Result<String> {
        let ordinary = Self::from_payload_yaml(
            crate::yaml::scalar(text).as_bytes(),
            self.name.clone(),
            namespaces,
            qnames,
        )?;
        self.patch_yaml(Some(&ordinary), namespaces, qnames)
    }

    /// A repeated scalar boundary is preserved by the enclosing document,
    /// rather than choosing one occurrence and losing its neighbours.
    pub fn patch_at(
        &self,
        ordinary: Option<&Self>,
        path: &[(&str, &str)],
        required: bool,
        namespaces: &[(&str, &str)],
        qnames: &[(&str, &str)],
    ) -> Result<Option<String>> {
        if self.count_at(path) > 1 {
            return Ok(None);
        }
        let base = ordinary.and_then(|tree| tree.first_at(path));
        match self.first_at(path) {
            Some(tree) => tree.patch_yaml(base, namespaces, qnames).map(Some),
            None if base.is_some() || required => Ok(Some("null".into())),
            None => Ok(None),
        }
    }
    fn first_at(&self, path: &[(&str, &str)]) -> Option<&Self> {
        let Some((name, tail)) = path.split_first() else {
            return Some(self);
        };
        self.children
            .iter()
            .filter(|child| child.name.namespace == name.0 && child.name.local == name.1)
            .find_map(|child| child.first_at(tail))
    }

    pub fn full_patch_yaml(
        &self,
        namespaces: &[(&str, &str)],
        qnames: &[(&str, &str)],
    ) -> Result<String> {
        let payload = self.patch_yaml(None, namespaces, qnames)?;
        Ok(Patch::read_full(payload.as_bytes(), namespaces, qnames)?.to_yaml())
    }

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
        // This method always describes an existing element. At a property
        // boundary null means removal, so an empty element must be empty text.
        let patch = if matches!(patch, Payload::Null) {
            Payload::Text(String::new())
        } else {
            patch
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
                            if value.starts_with('{')
                                && qnames.iter().any(|(uri, local)| {
                                    *uri == name.namespace && *local == name.local
                                })
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
fn canonical_names(value: &Payload, namespaces: &[(&str, &str)]) -> Result<Payload> {
    let Payload::Mapping(fields) = value else {
        return Ok(value.clone());
    };
    let mut normalized = Vec::with_capacity(fields.len());
    for (key, value) in fields {
        if key == "#order" {
            let Payload::Sequence(names) = value else {
                normalized.push((key.clone(), value.clone()));
                continue;
            };
            let names = names
                .iter()
                .map(|name| match name {
                    Payload::Text(name) => read::expand(name, namespaces, false)
                        .and_then(|name| super::qualified(&name, &[]))
                        .map(Payload::Text),
                    _ => Err(failure("Order requires text names")),
                })
                .collect::<Result<Vec<_>>>()?;
            normalized.push((key.clone(), Payload::Sequence(names)));
        } else if key == "#text" || key == "#qname" {
            normalized.push((key.clone(), value.clone()));
        } else {
            let (attribute, name) = key
                .strip_prefix('_')
                .map_or((false, key.as_str()), |name| (true, name));
            let name = read::expand(name, namespaces, attribute)?;
            let mut name = super::qualified(&name, &[])?;
            if attribute {
                name.insert(0, '_');
            }
            normalized.push((name, canonical_names(value, namespaces)?));
        }
    }
    Ok(Payload::Mapping(normalized))
}
fn merge(base: Payload, patch: &Payload) -> Payload {
    let Payload::Mapping(fields) = patch else {
        return patch.clone();
    };
    let mut base = match base {
        Payload::Mapping(fields) => fields,
        Payload::Null | Payload::Sequence(_) => Vec::new(),
        value => vec![("#text".into(), value)],
    };
    // An explicit text replacement changes the element's form. Ordinary
    // children belong to the old form and cannot survive beside that text.
    if fields.iter().any(|(key, _)| key == "#text") {
        base.retain(|(key, _)| key.starts_with('_') || key.starts_with('#'));
    }
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
    // Adding/removing attributes does not replace scalar text. Compare both
    // element forms as mappings, so a delta cannot freeze editable text.
    let scalar_mapping = |value: &Payload| match value {
        Payload::Text(_) => Some(Payload::Mapping(vec![("#text".into(), value.clone())])),
        Payload::Null => Some(Payload::Mapping(Vec::new())),
        _ => None,
    };
    if matches!(expected, Payload::Mapping(_)) {
        if let Some(actual) = scalar_mapping(actual) {
            return difference(expected, &actual);
        }
    } else if matches!(actual, Payload::Mapping(_))
        && let Some(expected) = scalar_mapping(expected)
    {
        return difference(&expected, actual);
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
