#[path = "compile.rs"]
mod compile;
#[path = "declarations.rs"]
mod declarations;
#[path = "family.rs"]
#[allow(dead_code)]
mod family;
use std::path::PathBuf;

#[allow(dead_code)] // The shared build helper is used by the production catalog, not every probe family.
pub fn manifest_paths(path: &std::path::Path) -> std::collections::BTreeSet<String> {
    declarations::manifest_paths(path).expect("read declaration manifest")
}

#[allow(dead_code)]
pub fn build(include: impl Fn(&str) -> bool) {
    build_exporting(include, |_| true);
}

pub fn build_exporting(
    include: impl Fn(&str) -> bool,
    export: impl Fn(&nkdk_rule_compiler::Module) -> bool,
) {
    build_selected(
        include,
        export,
        32 * 1024 * 1024,
        compile::CatalogMode::Selected,
    );
}

#[allow(dead_code)]
pub fn build_partition(
    include: impl Fn(&str) -> bool,
    export: impl Fn(&nkdk_rule_compiler::Module) -> bool,
    max_rust_bytes: usize,
) {
    build_selected(
        include,
        export,
        max_rust_bytes,
        compile::CatalogMode::Shared,
    );
}

fn build_selected(
    include: impl Fn(&str) -> bool,
    export: impl Fn(&nkdk_rule_compiler::Module) -> bool,
    max_rust_bytes: usize,
    mode: compile::CatalogMode,
) {
    let workspace = workspace();
    let sources = selected_sources(
        &workspace,
        include,
        matches!(mode, compile::CatalogMode::Shared),
    );
    for (path, _) in &sources {
        println!("cargo::rerun-if-changed={}", workspace.join(path).display());
    }
    compile::declarations_selected(&workspace, &sources, max_rust_bytes, export, mode);
}

pub fn watch_directory(path: &str) {
    let workspace = workspace();
    println!(
        "cargo::rerun-if-changed={}",
        workspace.join("declarations").join(path).display()
    );
}

#[allow(dead_code)]
pub fn build_family(roots: &[&str]) {
    build_family_with_budget(roots, 2 * 1024 * 1024);
}

#[allow(dead_code)]
pub fn build_family_with_budget(roots: &[&str], max_rust_bytes: usize) {
    build_family_selected_with_budget(roots, max_rust_bytes, false);
}

#[allow(dead_code)]
pub fn build_family_roots_only_with_budget(roots: &[&str], max_rust_bytes: usize) {
    build_family_selected_with_budget(roots, max_rust_bytes, true);
}

fn build_family_selected_with_budget(roots: &[&str], max_rust_bytes: usize, roots_only: bool) {
    let workspace = workspace();
    let sources = load_sources(&workspace);
    let selected = family::select(&sources, roots);
    for (path, _) in &selected {
        let absolute = workspace.join(path);
        println!("cargo::rerun-if-changed={}", absolute.display());
    }
    let roots = roots
        .iter()
        .copied()
        .collect::<std::collections::BTreeSet<_>>();
    compile::declarations_exporting(&workspace, &selected, max_rust_bytes, |module| {
        roots.contains(module.id.as_str())
            || (!roots_only && !module.source.file.starts_with("declarations/common/"))
    });
}

fn workspace() -> PathBuf {
    PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap())
        .join("../..")
        .canonicalize()
        .unwrap()
}
fn load_sources(workspace: &std::path::Path) -> Vec<(String, Vec<u8>)> {
    declarations::load(workspace, &workspace.join("declarations"))
        .expect("read declaration sources")
}

// Preparation and build.rs must use the same source universe and fragment closure.
pub(crate) fn selected_sources(
    workspace: &std::path::Path,
    include: impl Fn(&str) -> bool,
    shared: bool,
) -> Vec<(String, Vec<u8>)> {
    let sources = load_sources(workspace)
        .into_iter()
        .filter(|(path, _)| include(path))
        .collect::<Vec<_>>();
    if shared {
        family::without_unreferenced_fragments(&sources)
    } else {
        sources
    }
}
