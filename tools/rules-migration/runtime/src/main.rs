#[allow(dead_code)]
mod rules {
    include!(concat!(env!("OUT_DIR"), "/generated.rs"));
}
use nkdk_conversion_core::{Direction, proof};
use serde_json::Value;
fn compare_xml(expected: &[u8], actual: &[u8], qname_paths: &[Vec<String>]) {
    proof::verify_with_qnames(
        expected,
        actual,
        |_| false,
        |_, name| {
            name.namespace == "http://www.w3.org/2001/XMLSchema-instance" && name.local == "type"
        },
        |path| {
            qname_paths.iter().any(|expected| {
                path.len() == expected.len()
                    && path
                        .iter()
                        .zip(expected)
                        .all(|(name, local)| name.namespace.is_empty() && &name.local == local)
            })
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
    let forward = rules::convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    let actual = std::str::from_utf8(&forward.bytes).unwrap().trim_end();
    if let Some(expected) = case["yaml"].as_str() {
        compare_yaml(expected, actual);
        assert!(
            forward.diagnostics.is_empty(),
            "unexpected diagnostics: {:?}",
            forward.diagnostics
        );
    } else {
        assert!(
            actual
                .lines()
                .any(|line| line == case["annotation"].as_str().unwrap()),
            "anomaly location: {actual}"
        );
    }
    if let Some(reverse_input) = case
        .get("reverseYAML")
        .or_else(|| case.get("yaml"))
        .and_then(Value::as_str)
    {
        let fresh = facts::prepare(entry, case, manifest);
        let reverse = rules::convert_file(
            entry,
            Direction::YamlToXml,
            reverse_input.as_bytes(),
            &fresh,
        )
        .unwrap();
        compare_xml(xml, &reverse.bytes, &qname_paths);
        compare_documents(case, &reverse.documents);
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
    if let Some(rejected) = case["rejectedYAML"].as_array() {
        for yaml in rejected {
            assert!(
                !rules::validate_file(entry, yaml.as_str().unwrap().as_bytes(), &inputs).is_empty(),
                "invalid YAML accepted: {yaml}"
            );
        }
    }
    assert!(rules::validate_file(entry, &forward.bytes, &inputs).is_empty());
    for input in std::iter::once(forward.bytes.as_slice()).chain(
        case["reverseYAML"]
            .as_str()
            .filter(|_| case["yaml"].is_null())
            .map(str::as_bytes),
    ) {
        let fresh = facts::prepare(entry, case, manifest);
        let restored = rules::convert_file(entry, Direction::YamlToXml, input, &fresh).unwrap();
        compare_xml(xml, &restored.bytes, &qname_paths);
    }
}

fn with_documents(
    inputs: nkdk_conversion_core::PreparedInputs,
    case: &Value,
) -> nkdk_conversion_core::PreparedInputs {
    let Some(documents) = case["documents"].as_array() else {
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
                        document["xml"].as_str().unwrap().as_bytes().to_vec(),
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
