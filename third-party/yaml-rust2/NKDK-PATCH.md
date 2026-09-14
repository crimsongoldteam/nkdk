# Local compatibility patch

Source: yaml-rust2 0.11.0 from the Cargo registry. Original MIT/Apache-2.0
licenses and package files are retained.

`src/char_traits.rs::is_tag_char` additionally accepts non-ASCII letters and
numbers. NKDK has existing local tags such as `!проверять` and `!изменять`.
Upstream 0.11.0 rejects their unescaped spelling before producing parser events.
This patch does not change scalar parsing, tag boundaries, or tag semantics.
No source rewriting or additional parse is introduced. Unicode punctuation and
combining marks are outside this compatibility extension.

Covered by conversion-core/tests/yaml_nodes.rs and the compiler state matrix.
Re-evaluate this patch when updating the dependency; do not edit registry cache.
