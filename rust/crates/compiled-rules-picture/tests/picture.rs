use nkdk_compiled_rules_picture::{
    Direction, PreparedInputs, convert_file, entry_id, verify_candidate,
};
use std::path::{Path, PathBuf};

const OWNER: &str = "probe.picture-owner";
const REF: &str = "probe.picture-reference-owner";
const NS: &str = "http://v8.1c.ru/8.3/xcf/readable";

fn convert(name: &str, direction: Direction, source: &str) -> String {
    let result = convert_file(
        entry_id(name).unwrap(),
        direction,
        source.as_bytes(),
        &PreparedInputs::default(),
    )
    .unwrap_or_else(|errors| panic!("{name} {source}: {errors:?}"));
    String::from_utf8(result.bytes).unwrap()
}

fn picture(body: &str) -> String {
    format!("<Root xmlns:xr=\"{NS}\"><Picture>{body}</Picture></Root>")
}

fn assert_round_trip(name: &str, xml: &str, expected: &str) {
    let yaml = convert(name, Direction::XmlToYaml, xml);
    assert_eq!(yaml, expected);
    verify_xml(name, xml, &yaml);
}

fn verify_xml(name: &str, xml: &str, yaml: &str) {
    verify_candidate(
        entry_id(name).unwrap(),
        xml.as_bytes(),
        yaml.as_bytes(),
        &PreparedInputs::default(),
    )
    .unwrap();
}

#[test]
fn reference_forms() {
    for (reference, yaml) in [
        ("StdPicture.BusinessProcess", "Картинка: БизнесПроцесс"),
        (
            "CommonPicture.ОбщаяКартинка1",
            "Картинка: ОбщаяКартинка.ОбщаяКартинка1",
        ),
        ("0", "Картинка: \"0\""),
    ] {
        assert_round_trip(
            REF,
            &format!("<Root><Reference>{reference}</Reference></Root>"),
            yaml,
        );
    }
}

#[test]
fn simple_picture_forms() {
    for (body, yaml) in [
        (
            "<xr:Ref>StdPicture.BusinessProcess</xr:Ref><xr:LoadTransparent>true</xr:LoadTransparent>",
            "Картинка: БизнесПроцесс",
        ),
        (
            "<xr:Ref>CommonPicture.ОбщаяКартинка1</xr:Ref><xr:LoadTransparent>false</xr:LoadTransparent>",
            "Картинка: ОбщаяКартинка.ОбщаяКартинка1",
        ),
        (
            "<xr:Abs>Picture.png</xr:Abs><xr:LoadTransparent>false</xr:LoadTransparent>",
            "Картинка: Picture.png",
        ),
        ("<xr:Ref>0</xr:Ref>", "Картинка: \"0\""),
        (
            "<xr:Ref>0:12345678-1234-1234-1234-123456789abc</xr:Ref>",
            "Картинка: 0:12345678-1234-1234-1234-123456789abc",
        ),
    ] {
        assert_round_trip(OWNER, &picture(body), yaml);
    }
}

#[test]
fn similar_to_raw_references_are_file_paths() {
    for reference in ["00", "0:", "0:g", "1:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"] {
        let yaml = format!("Картинка: \"{reference}\"");
        let xml = convert(OWNER, Direction::YamlToXml, &yaml);
        assert!(xml.contains(&format!(":Abs>{reference}</")), "{xml}");
        let canonical = if matches!(reference, "00" | "0:") {
            yaml
        } else {
            format!("Картинка: {reference}")
        };
        assert_eq!(convert(OWNER, Direction::XmlToYaml, &xml), canonical);
    }
}

#[test]
fn changed_transparency_and_pixel() {
    for (body, yaml) in [
        (
            "<xr:Abs>Picture.png</xr:Abs><xr:LoadTransparent>true</xr:LoadTransparent>",
            "Картинка:\n  Ссылка: Picture.png\n  ПрозрачныйФон: Истина",
        ),
        (
            "<xr:Abs>Picture.png</xr:Abs><xr:LoadTransparent>true</xr:LoadTransparent><xr:TransparentPixel x=\"10\" y=\"15\"/>",
            "Картинка:\n  Ссылка: Picture.png\n  ПрозрачныйФон: Истина\n  ПрозрачныйПиксель:\n    x: 10\n    y: 15",
        ),
    ] {
        assert_round_trip(OWNER, &picture(body), yaml);
    }
}

#[test]
fn standard_picture_with_changed_transparency_uses_the_same_mapping_shape() {
    let xml = picture(
        "<xr:Ref>StdPicture.BusinessProcess</xr:Ref><xr:LoadTransparent>false</xr:LoadTransparent>",
    );
    assert_round_trip(
        OWNER,
        &xml,
        "Картинка:\n  Ссылка: БизнесПроцесс\n  ПрозрачныйФон: Ложь",
    );
}

#[test]
fn configured_references_share_one_expanded_declaration() {
    for (body, yaml) in [
        (
            "<xr:Ref>CommonPicture.ОбщаяКартинка1</xr:Ref><xr:LoadTransparent>true</xr:LoadTransparent>",
            "Картинка:\n  Ссылка: ОбщаяКартинка.ОбщаяКартинка1\n  ПрозрачныйФон: Истина",
        ),
        (
            "<xr:Ref>0</xr:Ref><xr:LoadTransparent>false</xr:LoadTransparent><xr:TransparentPixel x=\"12\" y=\"2\"/>",
            "Картинка:\n  Ссылка: \"0\"\n  ПрозрачныйФон: Ложь\n  ПрозрачныйПиксель:\n    x: 12\n    y: 2",
        ),
        (
            "<xr:Ref>0:12345678-1234-1234-1234-123456789abc</xr:Ref><xr:LoadTransparent>true</xr:LoadTransparent>",
            "Картинка:\n  Ссылка: 0:12345678-1234-1234-1234-123456789abc\n  ПрозрачныйФон: Истина",
        ),
    ] {
        assert_round_trip(OWNER, &picture(body), yaml);
    }
}

#[test]
fn expanded_raw_reference_can_have_a_pixel_without_a_transparency_flag() {
    let yaml = "Картинка:\n  Ссылка: \"0\"\n  ПрозрачныйПиксель:\n    x: 12\n    y: 2";
    let xml = convert(OWNER, Direction::YamlToXml, yaml);
    assert!(xml.contains(":Ref>0</"), "{xml}");
    assert!(xml.contains(":TransparentPixel"), "{xml}");
    assert!(!xml.contains("LoadTransparent"), "{xml}");
    assert_eq!(convert(OWNER, Direction::XmlToYaml, &xml), yaml);
}

#[test]
fn expanded_record_without_choice() {
    let xml = picture("<xr:Abs>Picture.png</xr:Abs><xr:LoadTransparent>true</xr:LoadTransparent>");
    assert_eq!(
        convert("probe.picture-expanded-owner", Direction::XmlToYaml, &xml),
        "Картинка:\n  Ссылка: Picture.png\n  ПрозрачныйФон: Истина"
    );
}

#[test]
fn anomalies_and_absence() {
    let invalid = "<Root><Reference>CommonPicture.Bad Name</Reference></Root>";
    let yaml = convert(REF, Direction::XmlToYaml, invalid);
    assert!(yaml.contains("!xml/"), "{yaml}");
    verify_candidate(
        entry_id(REF).unwrap(),
        invalid.as_bytes(),
        yaml.as_bytes(),
        &PreparedInputs::default(),
    )
    .unwrap();
    let invalid_picture = picture(
        "<xr:Ref>CommonPicture.Bad Name</xr:Ref><xr:LoadTransparent>false</xr:LoadTransparent>",
    );
    let yaml = convert(OWNER, Direction::XmlToYaml, &invalid_picture);
    assert!(yaml.contains("!xml/"), "{yaml}");
    verify_candidate(
        entry_id(OWNER).unwrap(),
        invalid_picture.as_bytes(),
        yaml.as_bytes(),
        &PreparedInputs::default(),
    )
    .unwrap();
    assert_eq!(convert(OWNER, Direction::XmlToYaml, "<Root/>"), "");
    let empty = "<Root><Picture/></Root>";
    let yaml = convert(OWNER, Direction::XmlToYaml, empty);
    assert!(yaml.contains("!xml/"), "{yaml}");
    verify_candidate(
        entry_id(OWNER).unwrap(),
        empty.as_bytes(),
        yaml.as_bytes(),
        &PreparedInputs::default(),
    )
    .unwrap();
}

#[test]
fn malformed_picture_values_preserve_the_original_xml() {
    for body in [
        "<xr:Ref>StdPicture.BusinessProcess</xr:Ref><xr:LoadTransparent>oops</xr:LoadTransparent>",
        "<xr:Abs>Picture.png</xr:Abs><xr:LoadTransparent>true</xr:LoadTransparent><xr:TransparentPixel x=\"oops\" y=\"15\"/>",
        "<xr:Ref>Alien.Foo</xr:Ref><xr:LoadTransparent>false</xr:LoadTransparent>",
        "<xr:Ref>0:g</xr:Ref><xr:LoadTransparent>false</xr:LoadTransparent>",
    ] {
        let xml = picture(body);
        let yaml = convert(OWNER, Direction::XmlToYaml, &xml);
        assert!(yaml.contains("!xml/"), "{yaml}");
        verify_candidate(
            entry_id(OWNER).unwrap(),
            xml.as_bytes(),
            yaml.as_bytes(),
            &PreparedInputs::default(),
        )
        .unwrap();
    }
}

#[test]
fn invalid_reference_preserves_its_neighbor_in_the_owner() {
    let xml = format!(
        "<Root xmlns:xr=\"{NS}\"><Picture><xr:Ref>0:g</xr:Ref><xr:LoadTransparent>false</xr:LoadTransparent></Picture><Label>keep</Label></Root>"
    );
    let yaml = convert(OWNER, Direction::XmlToYaml, &xml);
    assert!(yaml.contains("Картинка: !xml/raw"), "{yaml}");
    assert!(yaml.contains("Метка: keep"), "{yaml}");
    verify_xml(OWNER, &xml, &yaml);
}

#[test]
fn existing_xml_fixtures() {
    for fixture in [
        include_str!(
            "../../../../packages/rules/metadata/commonObjects/picture/__fixtures__/standart.xml"
        ),
        include_str!(
            "../../../../packages/rules/metadata/commonObjects/picture/__fixtures__/common.xml"
        ),
        include_str!(
            "../../../../packages/rules/metadata/commonObjects/picture/__fixtures__/absolute.xml"
        ),
        include_str!(
            "../../../../packages/rules/metadata/commonObjects/picture/__fixtures__/absoluteWithTransparent.xml"
        ),
    ] {
        let xml = format!("<Root xmlns:xr=\"{NS}\">{fixture}</Root>");
        let yaml = convert(OWNER, Direction::XmlToYaml, &xml);
        verify_xml(OWNER, &xml, &yaml);
    }
}

#[test]
fn all_picture_values_in_e2e_xml_round_trip_without_reference() {
    fn collect_xml(path: &Path, files: &mut Vec<PathBuf>) {
        for item in std::fs::read_dir(path).unwrap() {
            let path = item.unwrap().path();
            if path.is_dir() {
                collect_xml(&path, files);
            } else if path.extension().is_some_and(|extension| extension == "xml") {
                files.push(path);
            }
        }
    }
    let mut files = Vec::new();
    for family in ["cf", "cfe"] {
        let root = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../../e2e/fixtures/xml")
            .join(family);
        collect_xml(&root, &mut files);
    }
    let mut checked = 0;
    for path in files {
        let source = std::fs::read_to_string(&path).unwrap();
        let mut remainder = source.as_str();
        while let Some(start) = remainder.find("<Picture") {
            if !matches!(
                remainder[start + "<Picture".len()..].chars().next(),
                Some('>' | '/' | ' ' | '\n' | '\t')
            ) {
                remainder = &remainder[start + "<Picture".len()..];
                continue;
            }
            let open = &remainder[start..];
            let tag_end = open.find('>').unwrap() + 1;
            let end = if open[..tag_end].ends_with("/>") {
                tag_end
            } else {
                open.find("</Picture>").unwrap() + "</Picture>".len()
            };
            let xml = format!("<Root xmlns:xr=\"{NS}\">{}</Root>", &open[..end]);
            let yaml = convert(OWNER, Direction::XmlToYaml, &xml);
            verify_xml(OWNER, &xml, &yaml);
            checked += 1;
            remainder = &open[end..];
        }
    }
    assert_eq!(checked, 154);
}
