//! Intern XML routes during code generation; the compiled converter sees constants.
use super::ExpandedName;
use sha2::{Digest, Sha256};
use std::{cell::RefCell, collections::BTreeMap};

#[derive(Default)]
pub(super) struct Store {
    paths: Vec<Vec<(String, String)>>,
    ids: BTreeMap<Vec<(String, String)>, usize>,
}

thread_local! {
    pub(super) static CURRENT: RefCell<Option<Store>> = const { RefCell::new(None) };
}

pub(super) fn finish(assets: super::asset_session::Session<Store>) -> String {
    let store = assets.take();
    let mut out = String::new();
    for (index, path) in store.paths.iter().enumerate() {
        let symbol = symbol(path, index);
        let source = format!(
            "#[allow(dead_code)] pub(crate) const {symbol}:&[(&str,&str)]={};\n",
            raw(path)
        );
        super::shared_capture::unit(|| super::shared_units::GeneratedUnit {
            id: super::shared_units::UnitId(symbol.clone()),
            namespace: vec![],
            definitions: [super::shared_units::SymbolId(symbol)].into(),
            references: Default::default(),
            source: source.clone(),
            source_kinds: Default::default(),
            files: vec![],
        });
        out.push_str(&source);
    }
    out
}

fn symbol(path: &[(String, String)], index: usize) -> String {
    if super::shared_capture::active() {
        format!("XML_PATH_{:x}", Sha256::digest(raw(path).as_bytes()))
    } else {
        format!("XML_PATH_{index}")
    }
}

fn raw(path: &[(String, String)]) -> String {
    format!(
        "&[{}]",
        path.iter()
            .map(|(namespace, local)| format!("({namespace:?}, {local:?})"))
            .collect::<Vec<_>>()
            .join(",")
    )
}

pub(super) fn code(path: &[ExpandedName]) -> String {
    if path.is_empty() {
        return "&[]".into();
    }
    let key = path
        .iter()
        .map(|name| (name.namespace.clone(), name.local.clone()))
        .collect::<Vec<_>>();
    CURRENT.with(|current| {
        let mut current = current.borrow_mut();
        let Some(store) = current.as_mut() else {
            return raw(&key);
        };
        if let Some(index) = store.ids.get(&key) {
            let name = symbol(&key, *index);
            return super::shared_capture::reference(&name, format!("crate::{name}"));
        }
        let index = store.paths.len();
        store.ids.insert(key.clone(), index);
        let name = symbol(&key, index);
        store.paths.push(key);
        super::shared_capture::reference(&name, format!("crate::{name}"))
    })
}
