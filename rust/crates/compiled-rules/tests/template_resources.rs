use nkdk_compiled_rules::{Direction, InputValue, entry_id, prepare_inputs, resource_requests};
use nkdk_compiled_rules_probes as nkdk_compiled_rules;

#[test]
fn template_files_follow_one_declarative_route_in_both_directions() {
    let source = include_bytes!(
        "../../../../e2e/fixtures/xml/cf/DocumentJournals/ЖурналДокументовВсеСвойства/Templates/Макет.xml"
    );
    assert!(!source.is_empty());
    let content = include_bytes!(
        "../../../../e2e/fixtures/xml/cf/DocumentJournals/ЖурналДокументовВсеСвойства/Templates/Макет/Ext/Template.txt"
    );
    assert!(!content.is_empty());
    let entry = entry_id("migration.child-template-resources").unwrap();
    let inputs = prepare_inputs(
        entry,
        vec![(
            "names".into(),
            InputValue::Sequence(vec![InputValue::Text("Макет".into())]),
        )],
    )
    .unwrap();
    let plan = resource_requests(
        entry,
        &inputs,
        nkdk_conversion_core::resources::Limits {
            groups: 8,
            routes: 16,
            path_bytes: 4096,
        },
    )
    .unwrap();
    assert_eq!(plan.groups().len(), 4);
    let expected = [
        (
            vec!["Templates", "Макет.xml"],
            vec!["Шаблоны", "Макет", "Template.xml"],
        ),
        (
            vec!["Templates", "Макет", "Ext", "Template.txt"],
            vec!["Шаблоны", "Макет", "Template.txt"],
        ),
        (
            vec!["Templates", "Макет", "Ext", "Template.bin"],
            vec!["Шаблоны", "Макет", "Template.bin"],
        ),
    ];
    for (group, (xml, yaml)) in plan.groups().iter().zip(expected).take(3) {
        assert_eq!(group.len(), 1);
        let route = &group[0];
        assert_eq!(route.paths(Direction::XmlToYaml).0.segments(), xml);
        assert_eq!(route.paths(Direction::XmlToYaml).1.segments(), yaml);
        assert_eq!(route.paths(Direction::YamlToXml).0.segments(), yaml);
        assert_eq!(route.paths(Direction::YamlToXml).1.segments(), xml);
    }
    assert!(plan.groups()[3][0].is_remainder());
    let fallback = &plan.groups()[3][0];
    assert_eq!(
        fallback.paths(Direction::XmlToYaml).0.segments(),
        ["Templates", "Макет"]
    );
    assert_eq!(
        fallback.paths(Direction::XmlToYaml).1.segments(),
        ["Шаблоны", "Макет"]
    );
}
