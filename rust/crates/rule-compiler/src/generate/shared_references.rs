//! Resolve only symbol paths explicitly registered by the generator.
use super::shared_units::SymbolId;
use proc_macro2::{TokenStream, TokenTree};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Default)]
pub(super) struct ReferenceIndex(BTreeMap<String, SymbolId>);
impl ReferenceIndex {
    pub fn register(&mut self, symbol: SymbolId, path: &str) -> Result<(), String> {
        if let Some(existing) = self.0.get(path) {
            if existing != &symbol {
                return Err(format!("Conflicting generated reference: {path}"));
            }
            return Ok(());
        }
        self.0.insert(path.into(), symbol);
        Ok(())
    }
    pub fn resolve(&self, source: &str) -> Result<BTreeSet<SymbolId>, String> {
        let tokens = source
            .parse::<TokenStream>()
            .map_err(|error| error.to_string())?;
        let mut result = BTreeSet::new();
        self.visit(tokens, &mut result);
        Ok(result)
    }
    fn visit(&self, stream: TokenStream, result: &mut BTreeSet<SymbolId>) {
        let tokens: Vec<_> = stream.into_iter().collect();
        let mut i = 0;
        while i < tokens.len() {
            match &tokens[i] {
                TokenTree::Group(group) => self.visit(group.stream(), result),
                TokenTree::Ident(first) => {
                    let mut path = first.to_string();
                    let mut end = i;
                    let mut found = self.0.get(&path);
                    while let Some(
                        [
                            TokenTree::Punct(a),
                            TokenTree::Punct(b),
                            TokenTree::Ident(next),
                        ],
                    ) = tokens.get(end + 1..end + 4)
                    {
                        if a.as_char() != ':' || b.as_char() != ':' {
                            break;
                        }
                        path.push_str("::");
                        path.push_str(&next.to_string());
                        end += 3;
                        if let Some(symbol) = self.0.get(&path) {
                            found = Some(symbol);
                        }
                    }
                    if let Some(symbol) = found {
                        result.insert(symbol.clone());
                    }
                    i = end;
                }
                _ => {}
            }
            i += 1;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::super::shared_units::SymbolId;
    use super::*;
    #[test]
    fn registered_references_ignore_literals_and_other_targets() {
        let mut index = ReferenceIndex::default();
        index
            .register(SymbolId("first".into()), "crate::store::first")
            .unwrap();
        index
            .register(SymbolId("recursive".into()), "recursive_value_3")
            .unwrap();
        let source = r#"fn x() { crate::store::first::read(); recursive_value_3::read(); other::store::first::read(); let _ = "crate::store::first"; }"#;
        assert_eq!(
            index.resolve(source).unwrap(),
            [SymbolId("first".into()), SymbolId("recursive".into())].into()
        );
        assert!(
            index
                .resolve(r#"const TEXT: &str = "crate::store::first";"#)
                .unwrap()
                .is_empty()
        );
        assert!(
            index
                .register(SymbolId("collision".into()), "crate::store::first")
                .is_err()
        );
        assert!(index.resolve("fn {").is_err());
    }
}
