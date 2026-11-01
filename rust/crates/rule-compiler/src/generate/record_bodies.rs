//! AOT body reuse. Local generated IDs may differ; routes and bindings may not.
use proc_macro2::{TokenStream, TokenTree};
use sha2::{Digest, Sha256};
use std::{
    cell::RefCell,
    collections::{BTreeMap, BTreeSet},
};

#[derive(Default)]
pub(super) struct Bodies(BTreeMap<String, (usize, u32, String, BTreeSet<String>)>);

thread_local! {
    pub(super) static CURRENT: RefCell<Option<Bodies>> = const { RefCell::new(None) };
}

pub(super) fn finish(
    assets: super::asset_session::Session<Bodies>,
) -> (String, Vec<(String, usize)>) {
    let store = assets.take();
    if store.0.is_empty() {
        return (String::new(), Vec::new());
    }
    let mut bodies = store.0.into_iter().collect::<Vec<_>>();
    bodies.sort_by_key(|(_, (id, _, _, _))| *id);
    let mut out = String::from(
        "#[allow(dead_code,unused_imports)] pub(crate) mod record_body_store {use super::*;\n",
    );
    let mut sizes = Vec::new();
    for (key, (index, _, body, source_kinds)) in bodies {
        let id = body_name(&key, index);
        let record = body
            .split("mod item_")
            .nth(1)
            .and_then(|tail| tail.split_whitespace().next())
            .unwrap_or("unknown");
        sizes.push((format!("body_{id}:item_{record}"), body.len()));
        let code = format!("pub(crate) mod body_{id} {{use super::*;{body}}}\n");
        super::shared_capture::unit(|| super::shared_units::GeneratedUnit {
            id: super::shared_units::UnitId(format!("record_body_store::body_{id}")),
            namespace: vec!["record_body_store".into()],
            definitions: [super::shared_units::SymbolId(format!(
                "record_body_store::body_{id}"
            ))]
            .into(),
            references: BTreeSet::new(),
            source: code.clone(),
            source_kinds,
            files: vec![],
        });
        out.push_str(&code);
    }
    out.push_str("}\n");
    (out, sizes)
}

fn body_name(key: &str, index: usize) -> String {
    if super::shared_capture::active() {
        format!("{:x}", Sha256::digest(key.as_bytes()))
    } else {
        index.to_string()
    }
}

pub(super) fn share_from_entry(source: String, entry: &nkdk_rule_model::LinkedEntry) -> String {
    share_inner(source, entry.id, Some(format!("{:?}", entry.kind)))
}
#[cfg(test)]
pub(super) fn share(source: String, record: u32) -> String {
    share_inner(source, record, None)
}
fn share_inner(source: String, record: u32, kind: Option<String>) -> String {
    CURRENT.with(|current| {
        let mut current = current.borrow_mut();
        let Some(store) = current.as_mut() else {
            return source;
        };
        // Compare the complete contract, with only declared local names
        // normalized. Keep the first body verbatim and export a caller alias.
        let source = promote_visibility(source).replacen(
            &format!("mod item_{record}"),
            &format!("pub(crate) mod item_{record}"),
            1,
        );
        let key = comparison_key(&source, record);
        let next = store.0.len();
        let id = body_name(&key, next);
        let (index, original, _, kinds) =
            store
                .0
                .entry(key.clone())
                .or_insert((next, record, source, BTreeSet::new()));
        if let Some(kind) = kind {
            kinds.insert(kind);
        }
        let id = if super::shared_capture::active() {
            id
        } else {
            index.to_string()
        };
        let target = super::shared_capture::reference(
            &format!("record_body_store::body_{id}"),
            format!("crate::record_body_store::body_{id}"),
        );
        format!("pub(crate) use {target}::item_{original} as item_{record};\n")
    })
}

// Compare local generated names independently of the caller ID. The stored
// Rust source is never rewritten. Literals, input slots and external body
// references remain part of the key, so different bindings cannot be merged.
fn comparison_key(source: &str, record: u32) -> String {
    // Reserve the comparison-only spelling: an existing occurrence could
    // otherwise collide with a normalized local declaration.
    if source.contains("__record") {
        return source.to_owned();
    }
    fn renamed(name: &str, record: &str) -> String {
        // Generated identifiers put the owning record first. Later digits are
        // field positions or ordinals and must not change with that record.
        let Some(start) = name.find(|c: char| c.is_ascii_digit()) else {
            return name.into();
        };
        let rest = &name[start..];
        let end = rest
            .find(|c: char| !c.is_ascii_digit())
            .unwrap_or(rest.len());
        if &rest[..end] != record {
            return name.into();
        }
        format!("{}__record{}", &name[..start], &rest[end..])
    }
    fn declarations(
        tokens: TokenStream,
        record: &str,
        names: &mut BTreeMap<String, String>,
        enums: &mut BTreeSet<String>,
    ) {
        let mut declaration = false;
        let mut enumeration = false;
        let mut importing = false;
        for token in tokens {
            match token {
                TokenTree::Group(group) => declarations(group.stream(), record, names, enums),
                TokenTree::Ident(name) => {
                    let name = name.to_string();
                    if enumeration {
                        enums.insert(name.clone());
                    }
                    if declaration {
                        let target = renamed(&name, record);
                        if target != name {
                            names.insert(name.clone(), target);
                        }
                    }
                    importing |= name == "use";
                    enumeration = name == "enum";
                    declaration = (importing && name == "as")
                        || matches!(
                            name.as_str(),
                            "mod" | "struct" | "enum" | "fn" | "const" | "static" | "type"
                        );
                }
                TokenTree::Punct(punctuation) => {
                    declaration = false;
                    if punctuation.as_char() == ';' {
                        importing = false;
                    }
                }
                _ => declaration = false,
            }
        }
    }
    fn replace(
        tokens: TokenStream,
        names: &BTreeMap<String, String>,
        enums: &BTreeSet<String>,
        enum_body: bool,
    ) -> TokenStream {
        let tokens = tokens.into_iter().collect::<Vec<_>>();
        tokens
            .iter()
            .enumerate()
            .map(|(index, token)| match token {
                TokenTree::Ident(name) => {
                    // Enum ordinals are value names, independent of generated
                    // type IDs. A local V139 type may coexist with E139::V139.
                    let variant_declaration = enum_body && (index == 0
                        || matches!(&tokens[index-1], TokenTree::Punct(p) if p.as_char()==','));
                    let variant_reference = index >= 3
                        && matches!(&tokens[index-1], TokenTree::Punct(p) if p.as_char()==':')
                        && matches!(&tokens[index-2], TokenTree::Punct(p) if p.as_char()==':')
                        && matches!(&tokens[index-3], TokenTree::Ident(parent) if enums.contains(&parent.to_string()) || parent == "Self");
                    if (variant_declaration || variant_reference)
                        && name.to_string().strip_prefix('V').is_some_and(|n| !n.is_empty() && n.bytes().all(|c| c.is_ascii_digit())) {
                        return TokenTree::Ident(name.clone());
                    }
                    // A qualified external symbol is a dependency, even when its
                    // spelling coincides with a locally declared generated name.
                    let external = index >= 3
                        && matches!(&tokens[index-1], TokenTree::Punct(p) if p.as_char()==':')
                        && matches!(&tokens[index-2], TokenTree::Punct(p) if p.as_char()==':')
                        && matches!(&tokens[index-3], TokenTree::Ident(parent)
                        if !names.contains_key(&parent.to_string())
                            && parent != "self" && parent != "super");
                    if external {
                        return TokenTree::Ident(name.clone());
                    }
                    names
                        .get(&name.to_string())
                        .map_or(TokenTree::Ident(name.clone()), |target| {
                            TokenTree::Ident(proc_macro2::Ident::new(target, name.span()))
                        })
                }
                TokenTree::Group(group) => TokenTree::Group(proc_macro2::Group::new(
                    group.delimiter(),
                    replace(group.stream(), names, enums, index >= 2
                        && matches!(&tokens[index-2], TokenTree::Ident(keyword) if keyword == "enum")),
                )),
                other => other.clone(),
            })
            .collect()
    }
    let tokens: TokenStream = source.parse().expect("generated record body");
    let mut names = BTreeMap::new();
    let mut enums = BTreeSet::new();
    declarations(tokens.clone(), &record.to_string(), &mut names, &mut enums);
    replace(tokens, &names, &enums, false).to_string()
}

// Change Rust visibility tokens only. XML names and default strings can contain
// "pub(super)" too; rewriting those literals would change the data contract.
fn promote_visibility(source: String) -> String {
    super::visibility::change(source, "super", "crate").expect("generated record visibility")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reuse_requires_the_entire_emitted_contract_to_match() {
        let assets = super::super::asset_session::Session::enter(&CURRENT);
        let body = "mod item_7 { pub(super) fn path() -> &'static str { \"Root/Value\" } }";
        let literal = r#"mod item_7 { const TEXT: &str = "текст pub(super)"; pub(super) fn text() -> &'static str { TEXT } }"#;
        assert_eq!(
            promote_visibility(literal.into()),
            literal.replace("pub(super) fn", "pub(crate) fn")
        );
        let exported =
            super::super::visibility::change(promote_visibility(literal.into()), "crate", "")
                .unwrap();
        assert!(exported.contains("pub fn text"));
        assert!(exported.contains("текст pub(super)"));
        let first = share(body.into(), 7);
        assert_eq!(first, share(body.into(), 7));
        // Different placement or binding must not alias another contract.
        let changed = share(body.replace("Root/Value", "Other/Value"), 7);
        assert_ne!(first, changed);
        let other_id = share(body.replace("item_7", "item_8"), 8);
        assert_ne!(first, other_id);
        assert!(other_id.contains("::item_7 as item_8"));
        let (generated, sizes) = finish(assets);
        assert_eq!(sizes.len(), 2);
        assert!(sizes.iter().all(|(_, bytes)| *bytes > 0));
        assert_eq!(generated.matches("pub(crate) mod body_").count(), 2);
        assert_eq!(generated.matches("Root/Value").count(), 1);
        let next = super::super::asset_session::Session::enter(&CURRENT);
        assert_eq!(first, share(body.into(), 7));
        assert_eq!(finish(next).0.matches("pub(crate) mod body_").count(), 1);
    }

    #[test]
    fn local_ids_do_not_erase_literals_input_slots_or_external_dependencies() {
        let first = r#"mod item_7 { struct V7; fn read_7() { let value: V7; inputs.slot(7); external::body_7::read(); external::V7::read(); const TEXT: &str = "V7"; } }"#;
        let second = first
            .replace("item_7", "item_8")
            .replace("V7;", "V8;")
            .replace("read_7", "read_8");
        assert_eq!(comparison_key(first, 7), comparison_key(&second, 8));
        for changed in [
            second.replace("slot(7)", "slot(8)"),
            second.replace("body_7", "body_8"),
            second.replace("external::V7", "external::V8"),
            second.replace("\"V7\"", "\"V8\""),
        ] {
            assert_ne!(comparison_key(first, 7), comparison_key(&changed, 8));
        }
    }

    #[test]
    fn imported_aliases_may_differ_but_their_targets_must_match() {
        let first = "mod item_7 { use crate::automata_store::A7 as E7XML; fn read_7() { E7XML.select(); } }";
        let second = first
            .replace("item_7", "item_8")
            .replace("E7XML", "E8XML")
            .replace("read_7", "read_8");
        assert_eq!(comparison_key(first, 7), comparison_key(&second, 8));
        assert_ne!(
            comparison_key(first, 7),
            comparison_key(&second.replace("::A7", "::A8"), 8)
        );
    }

    #[test]
    fn record_ids_that_coincide_with_enum_ordinals_do_not_change_the_key() {
        let first = "mod item_7 { struct V7; enum E7 { V7, V8 } fn read_7() { let _: V7; let _=E7::V7; let _=E7::V8; } }";
        let second = "mod item_8 { struct V8; enum E8 { V7, V8 } fn read_8() { let _: V8; let _=E8::V7; let _=E8::V8; } }";
        assert_eq!(comparison_key(first, 7), comparison_key(second, 8));
        let zero = "mod item_0 { mod part_0_0 {} struct E0F0; fn read_0_0() { let _: E0F0; part_0_0::read_0_0(); } }";
        let one = "mod item_1 { mod part_1_0 {} struct E1F0; fn read_1_0() { let _: E1F0; part_1_0::read_1_0(); } }";
        assert_eq!(comparison_key(zero, 0), comparison_key(one, 1));
        assert_ne!(
            comparison_key(first, 7),
            comparison_key(&second.replace("E8::V7", "E8::V8"), 8)
        );
    }
}
