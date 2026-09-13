use super::{Result, RuntimeDiagnostic, is_ncname};
use quick_xml::name::{NamespaceResolver, QName, ResolveResult};

/// Borrowed namespace bindings at the current XML event, including ancestors.
#[derive(Clone, Copy)]
pub struct NamespaceScope<'a>(pub(super) &'a NamespaceResolver);

impl<'a> NamespaceScope<'a> {
    pub fn resolve_qname<'text>(self, value: &'text str) -> Result<(&'a str, &'text str)> {
        let (prefix, local) = value
            .split_once(':')
            .map_or((None, value), |(prefix, local)| (Some(prefix), local));
        if !is_ncname(local) || prefix.is_some_and(|prefix| !is_ncname(prefix)) {
            return Err(RuntimeDiagnostic::new(
                "xml.qname",
                "Expected an XML qualified name",
            ));
        }
        let (namespace, _) = self.0.resolve_element(QName(value));
        let namespace = match namespace {
            ResolveResult::Unbound => "",
            ResolveResult::Bound(namespace) => namespace.into_inner(),
            ResolveResult::Unknown(_) => {
                return Err(RuntimeDiagnostic::new(
                    "xml.qname-prefix",
                    "Unbound qualified-name prefix",
                ));
            }
        };
        Ok((namespace, local))
    }
}
