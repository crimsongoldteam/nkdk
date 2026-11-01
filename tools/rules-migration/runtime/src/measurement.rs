use crate::{facts, rules, with_documents, with_yaml_documents};
use nkdk_conversion_core::Direction;
use serde_json::{Value, json};
use std::time::Instant;

pub(super) struct Options {
    case: String,
    direction: Direction,
    iterations: usize,
}
impl Options {
    pub(super) fn parse(arguments: &[String]) -> Result<Self, String> {
        let mut case = None;
        let mut direction = None;
        let mut iterations = None;
        let (pairs, remainder) = arguments.as_chunks::<2>();
        for pair in pairs {
            match pair[0].as_str() {
                "--measure" if case.is_none() => case = Some(pair[1].clone()),
                "--direction" if direction.is_none() => {
                    direction = Some(match pair[1].as_str() {
                        "xml-to-yaml" => Direction::XmlToYaml,
                        "yaml-to-xml" => Direction::YamlToXml,
                        _ => return Err("Unknown measurement direction".into()),
                    })
                }
                "--iterations" if iterations.is_none() => {
                    iterations = Some(
                        pair[1]
                            .parse::<usize>()
                            .ok()
                            .filter(|n| *n > 0)
                            .ok_or("Iterations must be a positive integer")?,
                    );
                }
                _ => return Err(format!("Unknown or repeated option: {}", pair[0])),
            }
        }
        if !remainder.is_empty() {
            return Err("Missing option value".into());
        }
        Ok(Self {
            case: case
                .filter(|value| !value.is_empty())
                .ok_or("Missing case")?,
            direction: direction.ok_or("Missing direction")?,
            iterations: iterations.ok_or("Missing iterations")?,
        })
    }
}

pub(super) fn run(manifest: &Value, arguments: &[String]) -> Result<(), String> {
    let options = Options::parse(arguments)?;
    let case = manifest["cases"]
        .as_array()
        .ok_or("Missing cases")?
        .iter()
        .find(|case| case["id"].as_str() == Some(options.case.as_str()))
        .ok_or("Unknown case")?;
    // Use the normal independent checks before any timed iteration.
    crate::check_case(case, manifest);
    let entry =
        rules::entry_id(case["entry"].as_str().ok_or("Missing entry")?).ok_or("Unknown entry")?;
    let preparation = Instant::now();
    let fresh = facts::prepare(entry, case, manifest);
    let inputs = if matches!(options.direction, Direction::XmlToYaml) {
        with_documents(fresh, case)
    } else {
        with_yaml_documents(fresh, case)
    };
    let preparation_ns = preparation.elapsed().as_nanos();
    let source = match options.direction {
        Direction::XmlToYaml => case["xml"].as_str(),
        Direction::YamlToXml => case["reverseYAML"]
            .as_str()
            .or_else(|| case["yaml"].as_str()),
    }
    .ok_or("Measurement requires an independent expected source")?
    .as_bytes();
    let convert = || {
        rules::convert_file(entry, options.direction, source, &inputs)
            .map_err(|errors| format!("{errors:?}"))
    };
    std::hint::black_box(convert()?);
    let started = Instant::now();
    for _ in 0..options.iterations {
        std::hint::black_box(convert()?);
    }
    let elapsed_ns = started.elapsed().as_nanos();
    println!(
        "{}",
        json!({"case":options.case,"direction":match options.direction {
        Direction::XmlToYaml => "xml-to-yaml", Direction::YamlToXml => "yaml-to-xml",
    },"iterations":options.iterations,"elapsedNs":elapsed_ns,"preparationNs":preparation_ns,"sourceBytes":source.len()})
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    #[test]
    fn measurement_requires_known_options_and_positive_iterations() {
        let parse = |arguments: &[&str]| {
            super::Options::parse(
                &arguments
                    .iter()
                    .map(|value| value.to_string())
                    .collect::<Vec<_>>(),
            )
        };
        let valid = [
            "--measure",
            "case",
            "--direction",
            "xml-to-yaml",
            "--iterations",
            "3",
        ];
        assert_eq!(parse(&valid).unwrap().iterations, 3);
        for invalid in [
            vec!["--measure", "case"],
            vec![
                "--measure",
                "case",
                "--direction",
                "wrong",
                "--iterations",
                "3",
            ],
            vec![
                "--measure",
                "case",
                "--direction",
                "xml-to-yaml",
                "--iterations",
                "0",
            ],
            vec![
                "--measure",
                "case",
                "--direction",
                "xml-to-yaml",
                "--iterations",
                "3",
                "--unknown",
                "yes",
            ],
        ] {
            assert!(parse(&invalid).is_err());
        }
    }
}
