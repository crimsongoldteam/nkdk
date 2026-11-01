#[path = "../../../build-support/declarations.rs"]
mod declarations;
#[path = "../../../build-support/family.rs"]
mod family;
#[path = "support/source_owner_native.rs"]
mod source_owner_native;
#[path = "support/source_record_state.rs"]
mod source_record_state;
mod support;

fn load_sources() -> Vec<(String, Vec<u8>)> {
    let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .unwrap();
    declarations::load(&root, &root.join("declarations")).unwrap()
}

fn select_family(sources: &[(String, Vec<u8>)], roots: &[&str]) -> Vec<(String, Vec<u8>)> {
    std::thread::scope(|scope| {
        std::thread::Builder::new()
            .stack_size(16 * 1024 * 1024)
            .spawn_scoped(scope, || family::select(sources, roots))
            .unwrap()
            .join()
            .unwrap()
    })
}

fn assert_compiles(selected: &[(String, Vec<u8>)]) {
    let selected = selected.to_vec();
    std::thread::Builder::new()
        .stack_size(16 * 1024 * 1024)
        .spawn(move || {
            let files = selected
                .iter()
                .map(|(path, bytes)| nkdk_rule_compiler::SourceFile { path, bytes })
                .collect::<Vec<_>>();
            nkdk_rule_compiler::compile(&files).expect("family remains executable");
        })
        .unwrap()
        .join()
        .unwrap();
}

#[test]
fn source_child_assembly_reaches_the_compiler_with_every_registered_property() {
    let bytes = source_record_state::run(
        r#"
import {readFileSync} from 'node:fs';
import {candidateCatalog,dependencyFiles,yaml} from './tools/rules-migration/src/candidate-catalog.mjs';
import {assembleSourceOwner} from './tools/rules-migration/src/source-owner-assembly.mjs';
const {catalog}=candidateCatalog();
const source=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries.find(row=>row.symbol==='MetadataCatalogAttributeRules');
const assembly=assembleSourceOwner(source,catalog,{id:'test.source-child',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
if(assembly.coverage.pending.length || assembly.coverage.assembled.length!==source.properties.length)
  throw new Error('Incomplete ordinary child assembly');
const modules=[...assembly.modules,...dependencyFiles(assembly.modules,catalog)];
process.stdout.write(yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:modules.map(({format,...module})=>module)},{noRefs:true}));
"#,
    );
    assert_compiles(&[("source-child.yaml".into(), bytes)]);
    std::thread::Builder::new()
        .stack_size(16 * 1024 * 1024)
        .spawn(|| {
            let modules = source_record_state::load(false);
            let program = nkdk_rule_compiler::link(&modules).unwrap();
            nkdk_rule_compiler::generate(&program).unwrap();
            let complete = source_record_state::load(true);
            source_owner_native::verify(complete);
        })
        .unwrap()
        .join()
        .unwrap();
}

#[test]
fn complete_record_collection_preserves_row_bindings_and_index_providers() {
    let setup = r#"
import {readFileSync} from 'node:fs';
import {candidateCatalog,dependencyFiles,yaml} from './tools/rules-migration/src/candidate-catalog.mjs';
import {sourceOwnerCollections} from './tools/rules-migration/src/source-owner-collections.mjs';
import {recordOwnerOperation,recordOwnerCollectionItem} from './tools/rules-migration/src/record-owner-operation.mjs';
import {composedCollection} from './tools/rules-migration/src/composed-collection.mjs';
import {recordOwnerFactCollections} from './tools/rules-migration/src/record-owner-fact-sources.mjs';
const {catalog}=candidateCatalog();
const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
const child=extraction.entries.find(row=>row.symbol==='MetadataCatalogAttributeRules');
const operation=recordOwnerOperation(extraction,catalog,{symbol:child.symbol,id:'metadata.catalog-attribute',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'});
const descriptor=recordOwnerCollectionItem(child,operation);
const graph=JSON.parse(readFileSync('tests/migration/collection-links.json','utf8'));
"#;
    let bytes = source_record_state::run(&format!(
        "{setup}{}",
        r#"
const published=yaml.load(readFileSync('rust/declarations/candidates/catalog-attribute-collections.generated.yaml','utf8')).declarations;
const modules=[...published,...dependencyFiles(published,catalog,{includeIndexes:true})];
process.stdout.write(yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:modules},{noRefs:true}));
"#
    ));
    assert_compiles(&[("complete-record-collection.yaml".into(), bytes)]);
    let native = source_record_state::run(&format!(
        "{setup}{}",
        r#"
const edge=graph.edges.find(row=>row.owner.symbol==='MetadataCatalogRules' && row.property==='attributes');
const collection=composedCollection(edge,operation.owner,catalog,operation.modules,{
 bindings:descriptor.bindings,extraInputs:{},namespaces:{md:'http://v8.1c.ru/8.3/MDClasses'},defaultXmlNamespace:'md',
});
const factCollections=recordOwnerFactCollections(child,operation,{edge,catalog,parent:extraction.entries.find(row=>row.symbol==='MetadataCatalogRules'),id:'test.catalog-attribute-file-facts'});
const roots=[...collection.modules,...factCollections.modules];
const local=new Map([...catalog,...operation.modules.map(row=>[row.id,row])]);
const modules=[...roots,...dependencyFiles(roots,local,{includeIndexes:true})];
process.stdout.write(JSON.stringify({entry:collection.entry.id,bound:Object.keys(descriptor.bindings),
 fileSources:factCollections.entries.map(entry=>({entry:entry.id,inputs:Object.keys(entry.inputs)})),
 yaml:yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:modules},{noRefs:true})}));
"#
    ));
    std::thread::Builder::new()
        .stack_size(16 * 1024 * 1024)
        .spawn(move || {
            let native: serde_json::Value = serde_json::from_slice(&native).unwrap();
            let modules = nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile {
                path: "complete-record-collection-native.yaml",
                bytes: native["yaml"].as_str().unwrap().as_bytes(),
            })
            .unwrap();
            source_owner_native::verify_collection(
                modules,
                native["entry"].as_str().unwrap().into(),
                native["fileSources"].clone(),
                native["bound"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|value| value.as_str().unwrap().into())
                    .collect(),
            );
        })
        .unwrap()
        .join()
        .unwrap();
}

#[test]
fn font_family_follows_its_dependencies_without_other_catalog_entries() {
    let sources = load_sources();
    let selected = select_family(
        &sources,
        &[
            "probe.font-owner",
            "probe.font-record-owner",
            "probe.font-reference-owner",
            "probe.style-item-type-facts",
        ],
    );
    let paths = selected
        .iter()
        .map(|(path, _)| path.as_str())
        .collect::<Vec<_>>();
    assert!(paths.contains(&"declarations/common/font-reference.yaml"));
    assert!(paths.contains(&"declarations/common/boolean.yaml"));
    assert!(!paths.contains(&"declarations/probes/metadata-value.yaml"));
    let enumeration_source = std::str::from_utf8(
        &selected
            .iter()
            .find(|(path, _)| path == "declarations/common/system-enumerations.yaml")
            .unwrap()
            .1,
    )
    .unwrap();
    let names = nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile {
        path: "system-enumerations.yaml",
        bytes: enumeration_source.as_bytes(),
    })
    .unwrap()
    .into_iter()
    .map(|module| module.id)
    .collect::<Vec<_>>();
    assert_eq!(
        names,
        [
            "system.FontType",
            "system.FontType.dcs",
            "system.StyleFonts",
            "system.StyleFonts.dcs",
            "system.WindowsFonts",
            "system.WindowsFonts.dcs",
        ]
    );
    assert_compiles(&selected);
}

#[test]
fn collection_family_excludes_font_and_remains_executable() {
    let sources = load_sources();
    let selected = select_family(&sources, &["migration.metadata-fields"]);
    assert!(
        selected
            .iter()
            .any(|(path, _)| path == "declarations/probes/metadata-fields.yaml")
    );
    assert!(
        !selected
            .iter()
            .any(|(path, _)| path == "declarations/common/font-reference.yaml")
    );
    assert_compiles(&selected);
}

#[test]
fn an_unrelated_invalid_declaration_does_not_break_a_family() {
    let sources = vec![
        (
            "declarations/probes/selected.yaml".to_owned(),
            b"format: nkdk-declarations/1\nkind: object\nid: probe.selected\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\n"
                .to_vec(),
        ),
        (
            "declarations/probes/unrelated.yaml".to_owned(),
            b"format: [invalid YAML\nid: probe.unrelated\n".to_vec(),
        ),
    ];
    let selected = select_family(&sources, &["probe.selected"]);
    assert_eq!(selected.len(), 1);
    assert_eq!(selected[0].0, "declarations/probes/selected.yaml");
}

#[test]
fn candidate_family_selects_only_its_import_closure() {
    let sources = load_sources();
    let selected = select_family(&sources, &["metadata.standard-attribute-owner"]);
    assert!(
        selected.iter().any(|(path, _)| {
            path == "declarations/candidates/standard-attributes.generated.yaml"
        })
    );
    assert!(
        !selected.iter().any(|(path, _)| {
            path == "declarations/candidates/document-attributes.generated.yaml"
        })
    );
    assert_compiles(&selected);
}

#[test]
fn owner_family_includes_index_shapes_needed_by_its_consumers() {
    let sources = load_sources();
    let selected = select_family(
        &sources,
        &["metadata.defined-type", "metadata.defined-type-extension"],
    );
    assert_compiles(&selected);
}

#[test]
fn candidate_catalog_does_not_compile_unrelated_entries_in_the_same_file() {
    let sources = vec![(
        "declarations/candidates/two.yaml".to_owned(),
        b"format: nkdk-declarations/1\nkind: catalog\ndeclarations:\n  - format: nkdk-declarations/1\n    kind: object\n    id: candidate.one\n    value: {kind: record, fields: []}\n    representations:\n      xml: {kind: record, fields: []}\n      yaml: {kind: mapping, fields: []}\n  - format: nkdk-declarations/1\n    kind: object\n    id: candidate.two\n    value: {kind: record, fields: []}\n    representations:\n      xml: {kind: record, fields: []}\n      yaml: {kind: mapping, fields: []}\n"
            .to_vec(),
    )];
    let selected = select_family(&sources, &["candidate.one"]);
    let modules = nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile {
        path: &selected[0].0,
        bytes: &selected[0].1,
    })
    .unwrap();
    assert_eq!(
        modules
            .iter()
            .map(|module| module.id.as_str())
            .collect::<Vec<_>>(),
        ["candidate.one"]
    );
}

#[test]
fn family_contents_do_not_depend_on_source_order() {
    let sources = load_sources();
    let mut reversed = sources.clone();
    reversed.reverse();
    let mut first = select_family(&sources, &["metadata.standard-attribute-owner"]);
    let mut second = select_family(&reversed, &["metadata.standard-attribute-owner"]);
    first.sort_by(|left, right| left.0.cmp(&right.0));
    second.sort_by(|left, right| left.0.cmp(&right.0));
    assert_eq!(first, second);
}

#[test]
#[should_panic(expected = "ambiguous family declaration: probe.selected")]
fn duplicate_rule_ids_are_rejected() {
    let source = b"format: nkdk-declarations/1\nkind: object\nid: probe.selected\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\n";
    let sources = vec![
        ("declarations/probes/first.yaml".to_owned(), source.to_vec()),
        (
            "declarations/probes/second.yaml".to_owned(),
            source.to_vec(),
        ),
    ];
    family::select(&sources, &["probe.selected"]);
}

#[test]
fn production_keeps_only_referenced_fragments_without_hiding_broken_imports() {
    let declaration = |kind: &str, id: &str, imports: &str| {
        format!("format: nkdk-declarations/1\nkind: {kind}\nid: {id}\n{imports}value: {{kind: record, fields: []}}\nrepresentations:\n  xml: {{kind: record, fields: []}}\n  yaml: {{kind: mapping, fields: []}}\n").into_bytes()
    };
    let mut sources = vec![
        (
            "owner.yaml".into(),
            declaration(
                "object",
                "test.owner",
                "imports: {part: test.first}\ninputs: {names: {type: {kind: index, key: {kind: scalar, scalar: text}, value: {kind: scalar, scalar: text}}, index: test.names}}\n",
            ),
        ),
        (
            "first.yaml".into(),
            declaration("fragment", "test.first", "imports: {part: test.second}\n"),
        ),
        (
            "second.yaml".into(),
            declaration("fragment", "test.second", ""),
        ),
        (
            "unused.yaml".into(),
            declaration("fragment", "test.unused", "imports: {part: test.absent}\n"),
        ),
    ];
    sources.push((
        "shape.yaml".into(),
        declaration(
            "fragment",
            "test.shape",
            "contributions: [{index: test.names, key: {literal: key}, value: {literal: value}}]\n",
        ),
    ));
    let selected = family::without_unreferenced_fragments(&sources);
    assert_eq!(
        selected
            .iter()
            .map(|(path, _)| path.as_str())
            .collect::<Vec<_>>(),
        ["owner.yaml", "first.yaml", "second.yaml", "shape.yaml"]
    );
    let parsed: Vec<_> = selected
        .iter()
        .flat_map(|(path, bytes)| {
            nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile { path, bytes }).unwrap()
        })
        .collect();
    nkdk_rule_compiler::link(&parsed).unwrap();
    sources[0].1 = declaration("object", "test.owner", "imports: {part: test.unused}\n");
    let selected = family::without_unreferenced_fragments(&sources);
    assert!(selected.iter().any(|(path, _)| path == "unused.yaml"));
    let modules: Vec<_> = selected
        .iter()
        .flat_map(|(path, bytes)| {
            nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile { path, bytes }).unwrap()
        })
        .collect();
    assert!(
        nkdk_rule_compiler::link(&modules)
            .unwrap_err()
            .iter()
            .any(|error| error.code == "missing_import")
    );
}
