#[path = "../../compiled-rules/tests/support/command_identity.rs"]
mod command_identity;

use nkdk_compiled_rules_probes::{
    Direction, convert_file, entry_id, prepare_fact_inputs, verify_candidate,
};

#[test]
fn enumeration_commands_use_the_source_derived_owner_path() {
    let source = include_str!("../../../../e2e/fixtures/xml/cf/Enums/ПеречислениеВсеСвойства.xml");
    let command = source.split_once("<Command uuid=\"").unwrap().1;
    let command = format!(
        "<Command uuid=\"{}</Command>",
        command.split_once("</Command>").unwrap().0
    );
    let command = command.replacen("<Command ", "<Command xmlns=\"http://v8.1c.ru/8.3/MDClasses\" xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" ", 1);
    let identity = command
        .split_once("uuid=\"")
        .unwrap()
        .1
        .split_once('"')
        .unwrap()
        .0;
    let owner = source
        .split_once("<Enum uuid=\"")
        .unwrap()
        .1
        .split_once('"')
        .unwrap()
        .0;
    let generation = nkdk_conversion_core::facts::Generation(1);
    let mut builder = command_identity::command_fact_builder(generation);
    command_identity::seed(&mut builder, "cf", owner, "Команда1", identity);
    command_identity::seed_command_groups(&mut builder);
    let entry = entry_id("migration.enumeration-commands").unwrap();
    let values = command_identity::owner_values("ru", &["ru"], "cf", owner);
    let inputs = prepare_fact_inputs(
        entry,
        std::sync::Arc::new(builder.finish()),
        generation,
        values,
    )
    .unwrap();
    let xml = format!(
        "<md:MetaDataObject xmlns:md=\"http://v8.1c.ru/8.3/MDClasses\"><md:Enum><md:ChildObjects>{command}</md:ChildObjects></md:Enum></md:MetaDataObject>"
    );
    let yaml = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    let rendered = String::from_utf8_lossy(&yaml.bytes);
    assert!(rendered.contains("Команда1:"), "{rendered}");
    assert!(rendered.contains("Синоним команды"), "{rendered}");
    verify_candidate(entry, xml.as_bytes(), &yaml.bytes, &inputs).unwrap();
}
