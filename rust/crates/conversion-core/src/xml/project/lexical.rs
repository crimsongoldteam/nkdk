//! Structural projection retains lexical values and their namespace bindings.
use super::{Name, PropertyProjection, Result, RuntimeDiagnostic, matches};
use quick_xml::{
    NsReader,
    events::{BytesStart, Event},
};

fn failure(error: impl std::fmt::Display) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("xml.property-boundary", error.to_string())
}

pub(super) fn visit_documents(
    source: &[u8],
    boundary: &[(&str, &str)],
    target: &[(&str, &str)],
    projection: PropertyProjection<'_>,
    consume: &mut dyn FnMut(&[u8]) -> Result<()>,
) -> Result<()> {
    // Keep the shared XML syntax contract, including entities, root count and
    // namespace errors in excluded branches. Projection must not hide them.
    super::visit(source, |_, _| Ok(()))?;
    let selected = |path: &[Name]| {
        if path.len() <= boundary.len() {
            return matches(path, &boundary[..path.len()]);
        }
        if !matches(&path[..boundary.len()], boundary) {
            return false;
        }
        let tail = &path[boundary.len()..];
        match projection {
            PropertyProjection::Element | PropertyProjection::WithoutAttributes(_) => true,
            PropertyProjection::Members => matches(&tail[..1], &target[target.len() - 1..]),
            PropertyProjection::Fields(names)
            | PropertyProjection::Record { fields: names, .. } => {
                names.iter().any(|name| matches(&tail[..1], &[*name]))
            }
            PropertyProjection::Path(route) => {
                let count = tail.len().min(route.len());
                matches(&tail[..count], &route[..count])
            }
        }
    };
    let container = |depth: usize| {
        depth < boundary.len()
            || match projection {
                PropertyProjection::Members
                | PropertyProjection::Fields(_)
                | PropertyProjection::Record { .. } => depth == boundary.len(),
                PropertyProjection::Path(route) => depth < boundary.len() + route.len(),
                _ => false,
            }
    };
    let mut reader = NsReader::from_reader(source);
    let mut writer = None;
    let mut ancestors: Vec<BytesStart<'static>> = Vec::new();
    let mut path = Vec::new();
    loop {
        let event = reader.read_event().map_err(failure)?;
        match &event {
            Event::Start(start) | Event::Empty(start) => {
                let (namespace, local) = reader.resolver().resolve_element(start.name());
                let namespace = match namespace {
                    quick_xml::name::ResolveResult::Bound(value) => value.into_inner().to_owned(),
                    quick_xml::name::ResolveResult::Unbound => String::new(),
                    quick_xml::name::ResolveResult::Unknown(_) => {
                        return Err(failure("Unbound XML prefix"));
                    }
                };
                path.push(Name {
                    namespace,
                    local: local.as_ref().to_owned(),
                });
                if selected(&path) {
                    let mut filtered = start.to_owned();
                    filtered.clear_attributes();
                    for attribute in start.attributes() {
                        let attribute = attribute.map_err(failure)?;
                        let is_namespace = attribute.key.as_ref() == "xmlns"
                            || attribute.key.as_ref().starts_with("xmlns:");
                        let (namespace, local) = reader.resolver().resolve_attribute(attribute.key);
                        let namespace = match namespace {
                            quick_xml::name::ResolveResult::Bound(value) => value.into_inner(),
                            quick_xml::name::ResolveResult::Unbound => "",
                            quick_xml::name::ResolveResult::Unknown(_) if is_namespace => "",
                            _ => return Err(failure("Unbound XML attribute prefix")),
                        };
                        let name = (namespace, local.as_ref());
                        let keep = if path.len() == boundary.len() {
                            match projection {
                                PropertyProjection::WithoutAttributes(names) => {
                                    !names.contains(&name)
                                }
                                PropertyProjection::Record { attributes, .. } => {
                                    attributes.contains(&name)
                                }
                                _ => !container(path.len()),
                            }
                        } else {
                            !container(path.len())
                        };
                        if is_namespace || keep {
                            filtered.push_attribute(attribute);
                        }
                    }
                    if path.len() < boundary.len() {
                        if matches!(event, Event::Start(_)) {
                            ancestors.push(filtered);
                        }
                    } else {
                        if path.len() == boundary.len() {
                            let mut document = quick_xml::Writer::new(Vec::new());
                            for ancestor in &ancestors {
                                document
                                    .write_event(Event::Start(ancestor.borrow()))
                                    .map_err(failure)?;
                            }
                            writer = Some(document);
                        }
                        if let Some(writer) = &mut writer {
                            writer
                                .write_event(if matches!(event, Event::Empty(_)) {
                                    Event::Empty(filtered)
                                } else {
                                    Event::Start(filtered)
                                })
                                .map_err(failure)?;
                        }
                    }
                }
                if matches!(event, Event::Empty(_)) && matches(&path, boundary) {
                    finish(&mut writer, &ancestors, consume)?;
                }
                if matches!(event, Event::Empty(_)) {
                    path.pop();
                }
            }
            Event::End(_) => {
                if selected(&path) {
                    if path.len() < boundary.len() {
                        ancestors.pop();
                    } else if let Some(writer) = &mut writer {
                        writer.write_event(event).map_err(failure)?;
                    }
                    if matches(&path, boundary) {
                        finish(&mut writer, &ancestors, consume)?;
                    }
                }
                path.pop();
            }
            Event::Eof => break,
            Event::Text(_) | Event::CData(_) | Event::GeneralRef(_)
                if selected(&path) && !container(path.len()) =>
            {
                if let Some(writer) = &mut writer {
                    writer.write_event(event).map_err(failure)?;
                }
            }
            _ => {}
        }
    }
    Ok(())
}

fn finish(
    writer: &mut Option<quick_xml::Writer<Vec<u8>>>,
    ancestors: &[BytesStart<'_>],
    consume: &mut dyn FnMut(&[u8]) -> Result<()>,
) -> Result<()> {
    if let Some(mut writer) = writer.take() {
        for ancestor in ancestors.iter().rev() {
            writer
                .write_event(Event::End(ancestor.to_end()))
                .map_err(failure)?;
        }
        consume(&writer.into_inner())?;
    }
    Ok(())
}
