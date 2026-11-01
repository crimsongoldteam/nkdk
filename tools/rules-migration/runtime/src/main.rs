// Generated declarations are checked through their compiler and contract tests.
// Keep Clippy focused on this hand-written runner and its dependencies.
#[cfg(not(feature = "working-catalog"))]
#[allow(warnings)]
mod generated {
    // The generated automata use crate-root paths so the same output can be
    // included by production crates and this focused contract runner.
    include!(concat!(env!("OUT_DIR"), "/generated.rs"));
}
#[cfg(not(feature = "working-catalog"))]
use generated as rules;
#[cfg(feature = "working-catalog")]
use nkdk_compiled_rules as rules;
#[cfg(not(feature = "working-catalog"))]
#[allow(unused_imports)] // The alias is needed only by catalog-level generated helpers.
use nkdk_conversion_core as core;
use nkdk_conversion_core::{Direction, proof};
#[cfg(not(feature = "working-catalog"))]
#[allow(unused_imports)] // Narrow scalar catalogs do not reference crate-root automata.
pub(crate) use rules::automata_store;
#[cfg(not(feature = "working-catalog"))]
#[allow(unused_imports)] // Only some generated catalog shapes use crate-root paths.
pub(crate) use rules::*;
use serde_json::Value;
mod contract_edits;
fn compare_xml(expected: &[u8], actual: &[u8], qname_paths: &[Vec<String>]) {
    compare_xml_with_attributes(expected, actual, qname_paths, &[]);
}
fn matches_xml_path(path: &[nkdk_conversion_core::xml::Name], expected: &[String]) -> bool {
    path.len() == expected.len()
        && path.iter().zip(expected).all(|(name, expected)| {
            if name.namespace.is_empty() {
                &name.local == expected
            } else {
                format!("{{{}}}{}", name.namespace, name.local) == *expected
            }
        })
}
fn compare_xml_with_attributes(
    expected: &[u8],
    actual: &[u8],
    qname_paths: &[Vec<String>],
    attributes: &[(Vec<String>, String)],
) {
    proof::verify_with_qnames(
        expected,
        actual,
        |_| false,
        |path, name| {
            (name.namespace == "http://www.w3.org/2001/XMLSchema-instance" && name.local == "type")
                || attributes.iter().any(|(expected, attribute)| {
                    name.namespace.is_empty()
                        && name.local == *attribute
                        && matches_xml_path(path, expected)
                })
        },
        |path| {
            qname_paths
                .iter()
                .any(|expected| matches_xml_path(path, expected))
        },
    )
    .unwrap_or_else(|error| {
        panic!(
            "{error:?}\nexpected: {}\nactual: {}",
            String::from_utf8_lossy(expected),
            String::from_utf8_lossy(actual)
        )
    });
}
mod equality;
mod facts;
mod measurement;
use equality::compare as compare_yaml;
fn validate_contexts(entry: nkdk_conversion_core::EntryId, case: &Value, manifest: &Value) {
    if let Some(contexts) = case["validationContexts"].as_array() {
        for context in contexts {
            let mut selected = case.clone();
            for (name, value) in context["inputs"].as_object().unwrap() {
                selected["inputs"][name] = value.clone();
            }
            let inputs = facts::prepare(entry, &selected, manifest);
            let yaml = context["yaml"].as_str().unwrap();
            let issues = rules::validate_file(entry, yaml.as_bytes(), &inputs);
            let mut expected: Vec<_> = context["codes"]
                .as_array()
                .unwrap()
                .iter()
                .map(|code| code.as_str().unwrap())
                .collect();
            expected.sort_unstable();
            let codes: Vec<_> = issues
                .iter()
                .map(|issue| issue.code.as_deref().unwrap_or(""))
                .collect();
            assert_eq!(codes, expected, "context validation: {context}; {issues:?}");
            if let Some(expected) = context["severities"].as_array() {
                let actual: Vec<_> = issues
                    .iter()
                    .map(|issue| format!("{:?}", issue.severity))
                    .collect();
                assert_eq!(
                    actual,
                    expected
                        .iter()
                        .map(|value| value.as_str().unwrap())
                        .collect::<Vec<_>>()
                );
            }
            if let Some(expected) = context["paths"].as_array() {
                let actual: Vec<_> = issues
                    .iter()
                    .map(|issue| issue.path.iter().map(String::as_str).collect::<Vec<_>>())
                    .collect();
                let expected: Vec<_> = expected
                    .iter()
                    .map(|path| {
                        path.as_array()
                            .unwrap()
                            .iter()
                            .map(|part| part.as_str().unwrap())
                            .collect::<Vec<_>>()
                    })
                    .collect();
                assert_eq!(actual, expected);
            }
        }
    }
}

fn has_xml_anomaly(source: &str) -> bool {
    if source.trim().is_empty() {
        return false;
    }
    use nkdk_conversion_core::yaml::{Node, visit_nodes};
    // Mapping frames track whether a scalar is a key. Literal text mentioning
    // a tag or $xml is data, not an annotation boundary.
    let mut frames: Vec<Option<bool>> = Vec::new();
    let mut found = false;
    visit_nodes(source.as_bytes(), |node, _| {
        let tag = match &node {
            Node::Scalar(value, tag) => tag.as_deref().or(value.annotation()),
            Node::MappingStart(tag) | Node::SequenceStart(tag) => tag.as_deref(),
            _ => None,
        };
        found |=
            tag.is_some_and(|tag| matches!(tag, "!xml/raw" | "!xml/invalid" | "!xml/important"));
        match node {
            Node::Scalar(value, _) => {
                if let Some(Some(key)) = frames.last_mut() {
                    found |= *key && value.into_mapping_key().is_ok_and(|key| key == "$xml");
                    *key = !*key;
                }
            }
            Node::MappingStart(_) | Node::SequenceStart(_) => {
                if let Some(Some(key)) = frames.last_mut() {
                    *key = !*key;
                }
                frames.push(matches!(node, Node::MappingStart(_)).then_some(true));
            }
            Node::MappingEnd | Node::SequenceEnd => {
                frames.pop();
            }
        }
        Ok(())
    })
    .expect("generated YAML must be valid");
    found
}

fn main() {
    let path = std::env::args().nth(1).expect("case manifest path");
    let manifest: Value = serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap();
    let arguments: Vec<_> = std::env::args().skip(2).collect();
    if !arguments.is_empty() {
        if let Err(error) = measurement::run(&manifest, &arguments) {
            eprintln!("{error}");
            std::process::exit(1);
        }
        return;
    }
    let cases = manifest["cases"].as_array().unwrap();
    for case in cases {
        println!("checking {}", case["id"]);
        check_case(case, &manifest);
    }
    println!("Passed {} candidate contracts", cases.len());
}

fn check_case(case: &Value, manifest: &Value) {
    let entry = rules::entry_id(case["entry"].as_str().unwrap()).expect("candidate entry");
    if case["validationOnly"].as_bool() == Some(true) {
        assert!(
            case["validationContexts"]
                .as_array()
                .is_some_and(|rows| !rows.is_empty()),
            "Empty validation contract"
        );
        validate_contexts(entry, case, manifest);
        return;
    }
    let inputs = with_documents(facts::prepare(entry, case, manifest), case);
    if let Some(expected) = case["resources"].as_array() {
        let plan = rules::resource_requests(
            entry,
            &inputs,
            nkdk_conversion_core::resources::Limits {
                groups: 128,
                routes: 1024,
                path_bytes: 4096,
            },
        )
        .unwrap();
        if let Some(groups) = case["resourceGroups"].as_array() {
            let actual: Vec<_> = plan.groups().iter().map(Vec::len).collect();
            let expected: Vec<_> = groups
                .iter()
                .map(|value| value.as_u64().unwrap() as usize)
                .collect();
            assert_eq!(actual, expected, "Resource alternative groups differ");
        }
        let routes: Vec<_> = plan.groups().iter().flatten().collect();
        assert_eq!(routes.len(), expected.len());
        for (route, expected) in routes.iter().zip(expected) {
            let (xml, yaml) = route.paths(Direction::XmlToYaml);
            let segments = |key: &str| {
                expected[key]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|part| part.as_str().unwrap())
                    .collect::<Vec<_>>()
            };
            assert_eq!(xml.segments(), segments("xml"));
            assert_eq!(yaml.segments(), segments("yaml"));
            assert_eq!(route.paths(Direction::YamlToXml), (yaml, xml));
        }
    }
    let qname_paths: Vec<Vec<String>> = serde_json::from_value(
        case.get("xmlQNamePaths")
            .cloned()
            .unwrap_or_else(|| serde_json::json!([])),
    )
    .unwrap();
    let xml = case["xml"].as_str().unwrap().as_bytes();
    let qname_attributes: Vec<(Vec<String>, String)> = case["xmlQNameAttributes"]
        .as_array()
        .into_iter()
        .flatten()
        .map(|item| {
            (
                serde_json::from_value(item["path"].clone()).unwrap(),
                item["name"].as_str().unwrap().to_owned(),
            )
        })
        .collect();
    let forward = rules::convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    let actual = std::str::from_utf8(&forward.bytes).unwrap().trim_end();
    compare_text_documents(case, &forward.documents);
    let inputs = with_yaml_documents(inputs, case);
    let expected_diagnostics: Vec<_> = case["diagnostics"]
        .as_array()
        .map(|items| {
            items
                .iter()
                .map(|item| item.as_str().unwrap().to_owned())
                .collect()
        })
        .unwrap_or_default();
    let phase_diagnostics = |phase: &str| -> Vec<String> {
        case["diagnosticsByPhase"][phase]
            .as_array()
            .map(|items| {
                items
                    .iter()
                    .map(|item| item.as_str().unwrap().to_owned())
                    .collect()
            })
            .unwrap_or_else(|| expected_diagnostics.clone())
    };
    let expected_forward = phase_diagnostics("xmlToYaml");
    let expected_reverse = phase_diagnostics("yamlToXml");
    let expected_validation = phase_diagnostics("validation");
    let diagnostic_codes = |diagnostics: &[nkdk_conversion_core::RuntimeDiagnostic]| {
        diagnostics
            .iter()
            .map(|issue| issue.code.as_deref().unwrap_or("").to_owned())
            .collect::<Vec<_>>()
    };
    if case["noRaw"].as_bool() == Some(true) {
        assert!(
            !has_xml_anomaly(actual),
            "unexpected XML anomaly: {actual}\ndiagnostics: {:?}",
            forward.diagnostics
        );
    }
    if let Some(expected) = case["yaml"].as_str() {
        compare_yaml(expected, actual);
        assert_eq!(
            diagnostic_codes(&forward.diagnostics),
            expected_forward,
            "forward diagnostics"
        );
    } else if let Some(annotation) = case["annotation"].as_str() {
        assert!(
            actual.lines().any(|line| line == annotation),
            "anomaly location: {actual}"
        );
    }
    if let Some(expected) = case["semanticYAML"].as_str() {
        let envelope = nkdk_conversion_core::raw::Document::decode(&forward.bytes).unwrap();
        let meaning = envelope
            .as_ref()
            .map_or(forward.bytes.as_slice(), |value| value.meaning.as_slice());
        compare_yaml(expected, std::str::from_utf8(meaning).unwrap());
    }
    if let Some(reverse_input) = case
        .get("reverseYAML")
        .or_else(|| case.get("yaml"))
        .and_then(Value::as_str)
    {
        let fresh = with_yaml_documents(facts::prepare(entry, case, manifest), case);
        let reverse = rules::convert_file(
            entry,
            Direction::YamlToXml,
            reverse_input.as_bytes(),
            &fresh,
        )
        .unwrap();
        assert_eq!(
            diagnostic_codes(&reverse.diagnostics),
            expected_reverse,
            "reverse diagnostics"
        );
        compare_xml_with_attributes(xml, &reverse.bytes, &qname_paths, &qname_attributes);
        compare_documents(case, &reverse.documents);
    }
    if let Some(edits) = case["yamlEdits"].as_array() {
        let fresh = with_yaml_documents(facts::prepare(entry, case, manifest), case);
        for edit in edits {
            let yaml = edited_fixture(actual, &edit["yaml"]);
            let expected = edited_fixture(std::str::from_utf8(xml).unwrap(), &edit["xml"]);
            let exported =
                rules::convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &fresh).unwrap();
            assert_eq!(
                diagnostic_codes(&exported.diagnostics),
                expected_reverse,
                "edited YAML diagnostics"
            );
            compare_xml_with_attributes(
                expected.as_bytes(),
                &exported.bytes,
                &qname_paths,
                &qname_attributes,
            );
            compare_documents(case, &exported.documents);
        }
    }
    if let Some(retained) = case["retainedYAML"].as_array() {
        for expected in retained {
            assert!(
                actual
                    .lines()
                    .any(|line| line == expected.as_str().unwrap()),
                "Readable meaning was lost: {actual}"
            );
        }
    }
    validate_contexts(entry, case, manifest);
    if let Some(accepted) = case["acceptedYAML"].as_array() {
        for yaml in accepted {
            let bytes = yaml.as_str().unwrap().as_bytes();
            let issues = rules::validate_file(entry, bytes, &inputs);
            assert!(issues.is_empty(), "valid YAML rejected: {yaml}; {issues:?}");
            let exported =
                rules::convert_file(entry, Direction::YamlToXml, bytes, &inputs).unwrap();
            assert!(
                exported.diagnostics.is_empty(),
                "valid YAML export rejected: {yaml}"
            );
        }
    }
    if let Some(rejected) = case["rejectedYAML"].as_array() {
        for yaml in rejected {
            assert!(
                !rules::validate_file(entry, yaml.as_str().unwrap().as_bytes(), &inputs).is_empty(),
                "invalid YAML accepted: {yaml}"
            );
        }
    }
    assert_eq!(
        diagnostic_codes(&rules::validate_file(entry, &forward.bytes, &inputs)),
        expected_validation,
        "validation diagnostics"
    );
    for input in std::iter::once(forward.bytes.as_slice()).chain(
        case["reverseYAML"]
            .as_str()
            .filter(|_| case["yaml"].is_null())
            .map(str::as_bytes),
    ) {
        let fresh = with_yaml_documents(facts::prepare(entry, case, manifest), case);
        let restored = rules::convert_file(entry, Direction::YamlToXml, input, &fresh).unwrap();
        assert_eq!(
            diagnostic_codes(&restored.diagnostics),
            expected_reverse,
            "restoration diagnostics"
        );
        compare_xml_with_attributes(xml, &restored.bytes, &qname_paths, &qname_attributes);
    }
}

fn with_documents(
    inputs: nkdk_conversion_core::PreparedInputs,
    case: &Value,
) -> nkdk_conversion_core::PreparedInputs {
    with_document_set(inputs, case, "documents", "xml")
}
fn with_yaml_documents(
    inputs: nkdk_conversion_core::PreparedInputs,
    case: &Value,
) -> nkdk_conversion_core::PreparedInputs {
    with_document_set(inputs, case, "yamlDocuments", "text")
}
fn with_document_set(
    inputs: nkdk_conversion_core::PreparedInputs,
    case: &Value,
    key: &str,
    content: &str,
) -> nkdk_conversion_core::PreparedInputs {
    let Some(documents) = case[key].as_array() else {
        return inputs;
    };
    inputs
        .with_documents(
            documents
                .iter()
                .map(|document| {
                    let path = document["path"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|part| part.as_str().unwrap());
                    (
                        nkdk_conversion_core::resources::RelativePath::new(path, 4096).unwrap(),
                        document[content].as_str().unwrap().as_bytes().to_vec(),
                    )
                })
                .collect(),
        )
        .unwrap()
}

fn compare_documents(
    case: &Value,
    actual: &[(nkdk_conversion_core::resources::RelativePath, Vec<u8>)],
) {
    let Some(expected) = case["documents"].as_array() else {
        return;
    };
    assert_eq!(expected.len(), actual.len());
    for (expected, actual) in expected.iter().zip(actual) {
        let path = nkdk_conversion_core::resources::RelativePath::new(
            expected["path"]
                .as_array()
                .unwrap()
                .iter()
                .map(|part| part.as_str().unwrap()),
            4096,
        )
        .unwrap();
        assert_eq!(path, actual.0);
        compare_xml(expected["xml"].as_str().unwrap().as_bytes(), &actual.1, &[]);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn declared_qname_attributes_allow_prefix_changes_but_keep_namespaces_and_other_attributes() {
        let source = b"<A xmlns:p=\"urn:one\" link=\"p:X\"/>";
        let equivalent = b"<A xmlns:q=\"urn:one\" link=\"q:X\"/>";
        let attributes = vec![(vec!["A".into()], "link".into())];
        compare_xml_with_attributes(source, equivalent, &[], &attributes);
        assert!(std::panic::catch_unwind(|| compare_xml(source, equivalent, &[])).is_err());
        for other in [
            b"<A xmlns:q=\"urn:other\" link=\"q:X\"/>".as_slice(),
            b"<A xmlns:q=\"urn:one\" link=\"q:Y\"/>".as_slice(),
        ] {
            assert!(
                std::panic::catch_unwind(|| compare_xml_with_attributes(
                    source,
                    other,
                    &[],
                    &attributes
                ))
                .is_err()
            );
        }
    }
    #[test]
    fn anomaly_detection_distinguishes_identity_tags_and_literal_text() {
        for yaml in [
            "",
            " ",
            "Имя: !xml/name Parent",
            "Текст: '!xml/raw $xml'",
            "Текст: '$xml'",
            "Текст: ordinary",
        ] {
            assert!(!has_xml_anomaly(yaml));
        }
        for yaml in [
            "Текст: !xml/invalid bad",
            "Текст: !xml/important bad",
            "Текст: !xml/raw\n  $xml: null",
            "Записи: [!xml/invalid bad]",
            "Запись: {$xml: null}",
        ] {
            assert!(has_xml_anomaly(yaml));
        }
    }
    #[test]
    fn equality_keeps_types_exact_numbers_and_xml_content() {
        let qnames = vec![vec!["Root".into(), "Type".into()]];
        compare_xml(
            b"<Root xmlns:a='urn:type'><Type>a:Name</Type></Root>",
            b"<Root xmlns:b='urn:type'><Type>b:Name</Type></Root>",
            &qnames,
        );
        assert!(
            std::panic::catch_unwind(|| compare_xml(
                b"<Root xmlns:a='urn:type'><Type>a:Name</Type></Root>",
                b"<Root xmlns:a='urn:other'><Type>a:Name</Type></Root>",
                &qnames
            ))
            .is_err()
        );
        compare_yaml("Текст: 'a: b'", "Текст: \"a: b\"");
        for (expected, actual) in [
            ("n: 9007199254740993", "n: 9007199254740992"),
            ("n: 9007199254740993.125", "n: 9007199254740993.126"),
            ("n: 42", "n: '42'"),
        ] {
            assert!(std::panic::catch_unwind(|| compare_yaml(expected, actual)).is_err());
        }
        assert!(
            std::panic::catch_unwind(|| compare_xml(b"<A>one</A>", b"<A>two</A>", &[])).is_err()
        );
    }
}

fn compare_text_documents(
    case: &Value,
    actual: &[(nkdk_conversion_core::resources::RelativePath, Vec<u8>)],
) {
    let Some(expected) = case["yamlDocuments"].as_array() else {
        return;
    };
    assert_eq!(expected.len(), actual.len(), "text file count");
    for (expected, (path, bytes)) in expected.iter().zip(actual) {
        let segments = expected["path"]
            .as_array()
            .unwrap()
            .iter()
            .map(|part| part.as_str().unwrap())
            .collect::<Vec<_>>();
        assert_eq!(path.segments(), segments);
        assert_eq!(
            bytes,
            expected["text"].as_str().unwrap().as_bytes(),
            "text file contents"
        );
    }
}

fn edited_fixture(source: &str, edits: &Value) -> String {
    let rows = edits.as_array().expect("Fixture edits must be an array");
    assert!(
        !rows.is_empty(),
        "An edited contract must change its fixture"
    );
    let replacements = rows
        .iter()
        .map(|row| {
            let count = usize::try_from(
                row["count"]
                    .as_u64()
                    .expect("Fixture edit count must be a nonnegative integer"),
            )
            .expect("Fixture edit count must fit usize");
            (
                row["from"]
                    .as_str()
                    .expect("Fixture edit source must be text"),
                row["to"]
                    .as_str()
                    .expect("Fixture edit replacement must be text"),
                count,
            )
        })
        .collect::<Vec<_>>();
    contract_edits::apply_replacements(source, &replacements)
        .expect("Independent fixture edits must be exact")
}
