//! Lower compiler-owned Rust items without rewriting string literals.
use proc_macro2::{TokenStream, TokenTree};

pub(super) fn change(mut source: String, from: &str, to: &str) -> Result<String, String> {
    fn collect(
        tokens: TokenStream,
        from: &str,
        remove: bool,
        ranges: &mut Vec<std::ops::Range<usize>>,
    ) {
        let mut after_pub = false;
        for token in tokens {
            if let TokenTree::Group(group) = &token {
                if after_pub
                    && group.delimiter() == proc_macro2::Delimiter::Parenthesis
                    && group.stream().to_string() == from
                {
                    ranges.push(if remove {
                        group.span().byte_range()
                    } else {
                        group
                            .stream()
                            .into_iter()
                            .next()
                            .unwrap()
                            .span()
                            .byte_range()
                    });
                } else {
                    collect(group.stream(), from, remove, ranges);
                }
            }
            after_pub = matches!(token, TokenTree::Ident(ref name) if name == "pub");
        }
    }
    let tokens = source
        .parse::<TokenStream>()
        .map_err(|error| error.to_string())?;
    let mut ranges = Vec::new();
    collect(tokens, from, to.is_empty(), &mut ranges);
    ranges.sort_by_key(|range| range.start);
    for range in ranges.into_iter().rev() {
        source.replace_range(range, to);
    }
    Ok(source)
}

/// Small generated functions can expose their MIR across a crate boundary.
/// Keep large converters out of that path to bound downstream compilation.
pub(super) fn inline_small_public_functions(
    mut source: String,
    max_body_tokens: usize,
) -> Result<String, String> {
    fn token_count(stream: TokenStream) -> usize {
        stream
            .into_iter()
            .map(|token| match token {
                TokenTree::Group(group) => 1 + token_count(group.stream()),
                _ => 1,
            })
            .sum()
    }
    fn visit(stream: TokenStream, limit: usize, positions: &mut Vec<usize>) {
        let mut public = None;
        let mut function = false;
        let mut annotated = false;
        let mut hash = false;
        for token in stream {
            match &token {
                TokenTree::Ident(name) if name == "pub" => {
                    public = Some(name.span().byte_range().start)
                }
                TokenTree::Ident(name) if name == "fn" => function = true,
                TokenTree::Group(group)
                    if hash && group.delimiter() == proc_macro2::Delimiter::Bracket =>
                {
                    annotated |= matches!(group.stream().into_iter().next(), Some(TokenTree::Ident(name)) if name == "inline");
                }
                TokenTree::Group(group) if group.delimiter() == proc_macro2::Delimiter::Brace => {
                    if function
                        && !annotated
                        && token_count(group.stream()) <= limit
                        && let Some(position) = public
                    {
                        positions.push(position);
                    }
                    visit(group.stream(), limit, positions);
                    public = None;
                    function = false;
                    annotated = false;
                }
                TokenTree::Punct(punct) if punct.as_char() == ';' => {
                    public = None;
                    function = false;
                    annotated = false;
                }
                TokenTree::Group(group) => visit(group.stream(), limit, positions),
                _ => {}
            }
            hash = matches!(token, TokenTree::Punct(punct) if punct.as_char() == '#');
        }
    }
    let tokens = source
        .parse::<TokenStream>()
        .map_err(|error| error.to_string())?;
    let mut positions = Vec::new();
    visit(tokens, max_body_tokens, &mut positions);
    positions.sort_unstable();
    for position in positions.into_iter().rev() {
        source.insert_str(position, "#[inline]\n");
    }
    Ok(source)
}

/// These zero-input generated functions describe the compiled XML-name graph.
/// Cache only complete root traversals; nested recursion is handled by core.
pub(super) fn cache_static_names(mut source: String) -> Result<String, String> {
    fn needs_cache(stream: TokenStream) -> bool {
        stream.into_iter().any(|token| match token {
            TokenTree::Ident(name) => name == "sort_unstable" || name == "QNamesFrame",
            TokenTree::Group(group) => needs_cache(group.stream()),
            _ => false,
        })
    }
    fn visit(stream: TokenStream, ranges: &mut Vec<std::ops::Range<usize>>) {
        let tokens: Vec<_> = stream.into_iter().collect();
        for (index, token) in tokens.iter().enumerate() {
            let TokenTree::Group(group) = token else {
                continue;
            };
            if group.delimiter() != proc_macro2::Delimiter::Brace {
                continue;
            }
            let start = tokens[..index]
                .iter()
                .rposition(|token| matches!(token, TokenTree::Ident(name) if name == "fn"));
            let candidate = start.and_then(|start| {
                let Some(TokenTree::Ident(name)) = tokens.get(start + 1) else {
                    return None;
                };
                let Some(TokenTree::Group(args)) = tokens.get(start + 2) else {
                    return None;
                };
                (args.delimiter() == proc_macro2::Delimiter::Parenthesis
                    && args.stream().is_empty()
                    && (name == "qnames" || name.to_string().starts_with("xml_qnames_")))
                .then_some(start)
            });
            // Do not associate a function from a previous item with this brace.
            if let Some(start) = candidate && !tokens[start..index].iter().any(|token| {
                matches!(token,TokenTree::Group(g) if g.delimiter()==proc_macro2::Delimiter::Brace)
                    || matches!(token,TokenTree::Punct(p) if p.as_char()==';')
            }) {
                if needs_cache(group.stream()) {
                    ranges.push(group.span().byte_range());
                }
            } else {
                visit(group.stream(), ranges);
            }
        }
    }
    let tokens = source
        .parse::<TokenStream>()
        .map_err(|error| error.to_string())?;
    let mut ranges = Vec::new();
    visit(tokens, &mut ranges);
    ranges.sort_by_key(|range| range.start);
    for range in ranges.into_iter().rev() {
        let body = &source[range.start + 1..range.end - 1];
        let replacement = format!(
            "{{static NAMES: core::xml::StaticNames = core::xml::StaticNames::new(); NAMES.get(||{{{body}}})}}"
        );
        source.replace_range(range, &replacement);
    }
    Ok(source)
}

#[cfg(test)]
mod tests {
    #[test]
    fn inline_budget_does_not_depend_on_content_addressed_symbol_length() {
        let long = format!("target_{}", "a".repeat(1024));
        let source = format!(
            "pub fn short(){{target();}} pub fn hashed(){{{long}();}} pub fn many(){{{} }}",
            "target();".repeat(100)
        );
        let result = super::inline_small_public_functions(source, 8).unwrap();
        assert_eq!(result.matches("#[inline]").count(), 2);
        assert!(result.contains("#[inline]\npub fn hashed"));
        assert!(!result.contains("#[inline]\npub fn many"));
    }

    #[test]
    fn static_name_caches_wrap_only_generated_no_input_catalogues() {
        let input = r#"fn xml_qnames_7()->Vec<(&'static str,&'static str)>{vec![("","name")]}
        pub fn qnames()->Vec<(&'static str,&'static str)>{let _frame=QNamesFrame::enter();xml_qnames_7()}
        fn xml_qnames_8()->Vec<(&'static str,&'static str)>{let mut names=xml_qnames_7();names.sort_unstable();names.dedup();names}
        fn ordinary(){let literal="fn qnames(){fake()}";}
        fn qnames_with_input(value:&str){let _=value;}
        "#;
        let result = super::cache_static_names(input.into()).unwrap();
        assert_eq!(result.matches("core::xml::StaticNames::new()").count(), 2);
        assert!(result.contains("NAMES.get(||"));
        assert!(result.contains("fn xml_qnames_7()->Vec<(&'static str,&'static str)>{vec!"));
        assert!(result.contains("fn qnames(){fake()}"));
        assert!(result.contains("fn qnames_with_input(value:&str){let _=value;}"));
    }

    #[test]
    fn small_public_functions_keep_cross_package_inlining_without_touching_literals() {
        let input = r#"#[inline] pub fn existing(){target();}
pub fn forward(){target();}
fn private(){target();}
pub fn large(){let text="pub fn literal(){fake();}"; target(); target(); target();}
"#;
        let output = super::inline_small_public_functions(input.into(), 8).unwrap();
        assert_eq!(output.matches("#[inline]").count(), 2);
        assert!(output.contains("#[inline]\npub fn forward"));
        assert!(output.contains("fn private(){target();}"));
        assert!(output.contains("pub fn large(){let text=\"pub fn literal(){fake();}\""));
        assert_eq!(
            output,
            super::inline_small_public_functions(output.clone(), 8).unwrap()
        );
    }
}
