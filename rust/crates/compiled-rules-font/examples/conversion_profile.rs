//! Fixed semantic expectations and repeated measurements of both compiled directions.
use nkdk_compiled_rules_font::{Direction, PreparedInputs, convert_file, entry_id};
use std::{hint::black_box, time::Instant};

fn main() {
    let iterations: usize = std::env::args()
        .nth(1)
        .unwrap_or_else(|| "20000".into())
        .parse()
        .unwrap();
    let cases = [
        (
            "absolute",
            "probe.font-owner",
            "<Root><Font faceName=\"\" height=\"0\" bold=\"false\" italic=\"true\" underline=\"false\" strikeout=\"true\" kind=\"Absolute\" scale=\"100\"/></Root>",
            "Шрифт:\n  ВидXML: Absolute\n  Имя: \"\"\n  Размер: 0\n  Масштаб: 100\n  Полужирный: Ложь\n  Наклонный: Истина\n  Подчеркивание: Ложь\n  Зачеркивание: Истина",
        ),
        (
            "reference",
            "probe.font-reference-owner",
            "<Root><Font>style:LargeTextFont</Font></Root>",
            "Шрифт: КрупныйШрифтТекста",
        ),
    ];
    let inputs = PreparedInputs::default();
    for (label, name, xml, yaml) in cases {
        let entry = entry_id(name).unwrap();
        assert_eq!(
            convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs)
                .unwrap()
                .bytes,
            yaml.as_bytes()
        );
        for (direction, source) in [
            (Direction::XmlToYaml, xml.as_bytes()),
            (Direction::YamlToXml, yaml.as_bytes()),
        ] {
            for _ in 0..50 {
                black_box(convert_file(entry, direction, black_box(source), &inputs).unwrap());
            }
            for repetition in 0..5 {
                let started = Instant::now();
                let mut bytes = 0usize;
                for _ in 0..iterations {
                    bytes += black_box(
                        convert_file(entry, direction, black_box(source), black_box(&inputs))
                            .unwrap(),
                    )
                    .bytes
                    .len();
                }
                println!(
                    "{{\"case\":{label:?},\"direction\":{direction:?},\"repeat\":{repetition},\"iterations\":{iterations},\"wall_ns\":{},\"bytes\":{bytes}}}",
                    started.elapsed().as_nanos(),
                    direction = match direction {
                        Direction::XmlToYaml => "xml-yaml",
                        Direction::YamlToXml => "yaml-xml",
                    }
                );
            }
        }
    }
}
