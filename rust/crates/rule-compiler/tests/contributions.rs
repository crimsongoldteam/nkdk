mod support;
use nkdk_rule_compiler::{GeneratedSources, SourceFile, compile, link, parse};

const CODE: &str = include_str!("fixtures/fact-code.yaml");
const OWNER: &str = include_str!("fixtures/fact-owner.yaml");

#[test]
fn collection_member_position_reaches_declared_row_bindings_in_both_directions() {
    let source = include_str!("fixtures/collection-position.yaml");
    let generated = compile(&[SourceFile {
        path: "positions.yaml",
        bytes: source.as_bytes(),
    }])
    .unwrap();
    run_generated(
        generated,
        "bound-row-positions",
        r#"include!("generated.rs");
fn main(){
 let entry=entry_id("test.position-owner").unwrap();
 let inputs=PreparedInputs::default();
 let expected="Rows:\n  - Name: !xml/raw\n      $значение: row[0]\n      $xml: null\n  - Name: !xml/raw\n      $значение: row[1]\n      $xml: null".as_bytes();
 let imported=convert_file(entry,Direction::XmlToYaml,b"<Root><Rows><Item/><Item/></Rows></Root>",&inputs).unwrap();
 assert_eq!(imported.bytes,expected);
 verify_candidate(entry,b"<Root><Rows><Item/><Item/></Rows></Root>",expected,&inputs).unwrap();
 let restored=convert_file(entry,Direction::YamlToXml,b"Rows: [{}, {}]",&inputs).unwrap();
 crate::core::proof::verify(b"<Root><Rows><Item name='row[0]'/><Item name='row[1]'/></Rows></Root>",&restored.bytes,|_|false).unwrap();
 let nested=entry_id("test.position-nested-owner").unwrap();
 let xml=b"<Root><Rows><Item><Children><Item/><Item/></Children></Item><Item><Children><Item/></Children></Item></Rows></Root>";
 let snapshot=convert_file(nested,Direction::XmlToYaml,xml,&inputs).unwrap();
 let restored=convert_file(nested,Direction::YamlToXml,b"Rows: [{Children: [{}, {}]}, {Children: [{}]}]",&inputs).unwrap();
 crate::core::proof::verify(b"<Root><Rows><Item name='parent[0]'><Children><Item name='parent[0].child[0]'/><Item name='parent[0].child[1]'/></Children></Item><Item name='parent[1]'><Children><Item name='parent[1].child[0]'/></Children></Item></Rows></Root>",&restored.bytes,|_|false).unwrap();
 let projected=snapshot_fact_source(nested,xml,&inputs).unwrap();
 for address in ["parent[0]", "parent[0].child[0]", "parent[0].child[1]", "parent[1]", "parent[1].child[0]"] {
  let yaml=std::str::from_utf8(&projected).unwrap();
  assert!(yaml.contains(&format!("$значение: {address}\n")) || yaml.contains(&format!("Name: {address}\n")), "{address}: {yaml}");
 }
 verify_candidate(nested,xml,&snapshot.bytes,&inputs).unwrap();

}
"#,
    );
}

#[test]
fn form_file_sources_prepare_current_and_base_rows_without_loading_each_attribute() {
    let source = include_str!("../../../declarations/objects/form-attribute-file-sources.yaml");
    let nested = source
        .replace("source.form-attribute-id-", "source.nested-attribute-id-")
        .replace("file-source", "nested-source")
        .replace(
            "field: id, path: [], attribute: id",
            "field: id, path: [Id], attribute: id",
        );
    let generated = compile(&[
        SourceFile {
            path: "form-file-sources.yaml",
            bytes: source.as_bytes(),
        },
        SourceFile {
            path: "nested-source.yaml",
            bytes: nested.as_bytes(),
        },
    ])
    .unwrap();
    let fixture=std::fs::read(std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../packages/rules/metadata/importFromXml/__fixtures__/configurationExtension/Catalogs/СправочникПолный/Forms/ФормаОтчета/Ext/Form.xml")).unwrap();
    let main = format!(
        r##"include!("generated.rs");
fn main() {{
 use crate::core::facts::{{Generation,FactState}};
 use crate::core::facts::preparation::{{MaterialSourceHeader,SourceHeader,SourceKind,LoadedSource,prepare_streaming_materials}};
 let original: &[u8]=&{fixture:?};
 let synthetic=br#"<Form xmlns="http://v8.1c.ru/8.3/xcf/logform"><Attributes><Attribute name="shared" id="7"/><Attribute name="fresh"/><Attribute name="" id="5"/><Attribute name="D" id="10"/><Attribute name="D" id="11"/></Attributes><BaseForm><Attributes><Attribute name="shared" id="9"/><Attribute name="fresh" id="1"/><Attribute name="base-only"/></Attributes></BaseForm></Form>"#;
 let nested_xml=br#"<Form xmlns="http://v8.1c.ru/8.3/xcf/logform"><Attributes><Attribute name="shared"><Id xmlns="" id="7"/></Attribute></Attributes><BaseForm><Attributes><Attribute name="shared"><Id xmlns="" id="9"/></Attribute><Attribute name="base-only"><Id xmlns="" id="12"/></Attribute></Attributes></BaseForm></Form>"#;
 for (xml,expected,nested) in [(original,vec![("Атрибут.СобственныйРеквизитФормы","4"),("Атрибут.БазовыйОбъект","8"),("Атрибут.БазовыйРеквизитФормы","4")],false),(synthetic.as_slice(),vec![("Атрибут.shared","7"),("Атрибут.fresh","2"),("Атрибут.base-only","1000001"),("Атрибут[2]","5"),("Атрибут[3]","10"),("Атрибут[4]","11")],false),(nested_xml.as_slice(),vec![("Атрибут.shared","7"),("Атрибут.base-only","12")],true)] {{
 for direction in [Direction::XmlToYaml,Direction::YamlToXml] {{
 for reversed in [false,true] {{
  let mut names=["metadata.current-form-attribute-file-source","metadata.base-form-attribute-file-source"];
  if nested {{names=["metadata.current-form-attribute-nested-source","metadata.base-form-attribute-nested-source"];}}
  if reversed {{names.reverse();}}
  let headers=names.iter().map(|name|{{let entry=entry_id(name).unwrap();MaterialSourceHeader{{source:SourceHeader{{entry,direction,inputs:prepare_inputs(entry,vec![("component".into(),InputValue::Text("main".into())),("owner".into(),InputValue::Text("form".into()))]).unwrap()}},kind:SourceKind::Ordinary}}}}).collect();
  let mut loaded=vec![];
  let mut budget=test_fact_budget();budget.text.entries=40;budget.rows=40;
  let prepared=prepare_streaming_materials::<FactCatalog>(headers,&[],Generation(1),budget,100,|slot,header|{{loaded.push(slot);let bytes=match direction {{Direction::XmlToYaml=>xml.to_vec(),Direction::YamlToXml=>snapshot_fact_source(header.entry,xml,&header.inputs).map_err(|error|vec![error])?}};Ok(LoadedSource{{bytes,documents:vec![]}})}}).unwrap();
  assert_eq!(loaded.len(),2,"one projection load per source, not per row");
  let index=fact_id("metadata.form-attribute-identities").unwrap();
  let modes=fact_id("metadata.form-attribute-address-modes").unwrap();
  let name=if nested {{"shared"}}else if xml==original {{"БазовыйОбъект"}}else {{"shared"}};
  assert_eq!(prepared.facts.lookup_parts(Generation(1),modes,&["main",name,"current","form"]),FactState::Ready("named"));
  if xml==synthetic {{
   for name in ["", "D"] {{
    assert_eq!(prepared.facts.lookup_parts(Generation(1),modes,&["main",name,"current","form"]),FactState::Ready("positional"));
   }}
  }}
  for (name,id) in &expected {{
   assert_eq!(prepared.facts.lookup_parts(Generation(1),index,&["main",name,"form"]),FactState::Ready(*id));
  }}
 }}
 }}
 }}
}}
"##
    );
    run_generated(generated, "form-file-attribute-sources", &main);
}

#[test]
fn form_column_file_source_shares_named_and_ordinal_parent_addresses() {
    let generated = compile(&[
        SourceFile {
            path: "attributes.yaml",
            bytes: include_bytes!("../../../declarations/objects/form-attribute-file-sources.yaml"),
        },
        SourceFile {
            path: "columns.yaml",
            bytes: include_bytes!("../../../declarations/objects/form-column-sources.yaml"),
        },
        SourceFile {
            path: "column-file.yaml",
            bytes: include_bytes!("../../../declarations/objects/form-column-file-sources.yaml"),
        },
        SourceFile {
            path: "column-priority.yaml",
            bytes: include_bytes!(
                "../../../declarations/objects/form-column-priority-sources.yaml"
            ),
        },
        SourceFile {
            path: "numbering.yaml",
            bytes: include_bytes!("../../../declarations/objects/form-numbering.yaml"),
        },
        SourceFile {
            path: "element-numbering.yaml",
            bytes: include_bytes!("fixtures/form-element-numbering.yaml"),
        },
        SourceFile {
            path: "group-mode.yaml",
            bytes: include_bytes!(
                "../../../declarations/objects/form-additional-group-mode-sources.yaml"
            ),
        },
        SourceFile {
            path: "attribute-tree.yaml",
            bytes: include_bytes!("../../../declarations/objects/form-attribute-tree-sources.yaml"),
        },
    ])
    .unwrap();
    let fixture = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../packages/rules/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.xml");
    let main = format!(
        r#"include!("generated.rs");
fn main() {{
 use crate::core::facts::{{Generation,FactState}};
 use crate::core::facts::preparation::{{MaterialSourceHeader,SourceHeader,SourceKind,LoadedSource,prepare_streaming_materials}};
 let real=std::fs::read_to_string({fixture:?}).unwrap();
 let synthetic="<Attribute name='A.B' id='20'><Columns><Column name='x' id='21'/></Columns></Attribute><Attribute name='D' id='30'><Columns><Column name='x' id='31'/></Columns></Attribute><Attribute name='D' id='40'><Columns><Column name='x' id='41'/></Columns></Attribute><Attribute name='' id='50'><Columns><Column name='x' id='51'/><AdditionalColumns table='G'><Column name='y' id='52'/></AdditionalColumns></Columns></Attribute>";
 let priority="<Attribute name='P' id='20'><Columns><Column name='shared' id='7'/></Columns></Attribute><Attribute name='Occupied2' id='2'/><Attribute name='Occupied3' id='3'/><Attribute name='Occupied4' id='4'/><Attribute name='Occupied5' id='5'/><Attribute name='Occupied6' id='6'/><Attribute name='Occupied7' id='7'/><Attribute name='Occupied8' id='8'/><Attribute name='fresh'/>";
 let base="<BaseForm><Attributes><Attribute name='P' id='22'><Columns><Column name='shared' id='9'/><Column name='base-only' id='1'/></Columns></Attribute></Attributes></BaseForm>";
 let fresh="<Attribute name='A'><Columns><Column name='x'/><AdditionalColumns table='G'><Column name='y'/></AdditionalColumns></Columns></Attribute><Attribute name='B'><Columns><Column name='x'/></Columns></Attribute>";
 let observe=entry_id("metadata.form-id-reservations").unwrap();
 let history_xml=b"<Form xmlns='http://v8.1c.ru/8.3/xcf/logform' id='1'><Attributes><Attribute name='deleted' id='1'><Columns><Column name='x' id='2'/><Unknown id='3'/><Unknown id='4'/><Unknown id='5'/><Unknown id='6'/><Unknown id='7'/><Unknown id='8'/></Columns></Attribute></Attributes><Commands><Command id='9'/></Commands><Parameters><Parameter id='10'/></Parameters><ChildItems><InputField id='11'/></ChildItems></Form>";
 let snapshot_budget=core::xml::attribute_scan::SnapshotBudget{{values:100,bytes:4096}};
 let history_snapshot=snapshot_attribute_source(observe,core::xml::DocumentSource(history_xml),64,snapshot_budget).unwrap();
 let historical="<Attribute name='H'><Columns><Column name='x'/></Columns></Attribute>";
 let empty_groups="<Attribute name='A' id='10'><Columns><AdditionalColumns table=''><Column name='x' id='11'/></AdditionalColumns><AdditionalColumns table=''><Column name='x' id='12'/></AdditionalColumns></Columns></Attribute>";
 let repeated_groups=empty_groups.replace("table=''","table='D'").replace("</Columns>","<AdditionalColumns table='G'><Column name='x' id='13'/></AdditionalColumns></Columns>")+"<Attribute name='B' id='14'><Columns><AdditionalColumns table='D'><Column name='x' id='15'/></AdditionalColumns></Columns></Attribute>";
 let empty_groups_base="<BaseForm><Attributes><Attribute name='A' id='99'><Columns><AdditionalColumns table=''><Column name='x' id='21'/></AdditionalColumns><AdditionalColumns table=''><Column name='x' id='22'/></AdditionalColumns><AdditionalColumns table=''><Column name='x' id='23'/></AdditionalColumns></Columns></Attribute></Attributes></BaseForm>";
 let repeated_groups_base=empty_groups_base.replace("table=''","table='D'");
 let fresh_base="<BaseForm><Attributes><Attribute name='A' id='9'><Columns><Column name='x' id='11'/><Column name='base-only' id='6'/><Column name='new-base'/></Columns></Attribute><Attribute name='C'><Columns><Column name='x'/></Columns></Attribute></Attributes></BaseForm>";
 for (body,expected) in [(real.as_str(),vec![("Атрибут.График.Колонка.Отступ","1"),("Атрибут.График.ДополнительныеКолонки.ГрафикНачислений.Колонка.Сумма","2")]),(synthetic,vec![("Атрибут.A%2EB.Колонка.x","21"),("Атрибут[1].Колонка.x","31"),("Атрибут[2].Колонка.x","41"),("Атрибут[3].Колонка.x","51"),("Атрибут[3].ДополнительныеКолонки.G.Колонка.y","52")]),(priority,vec![("Атрибут.P.Колонка.shared","7"),("Атрибут.P.Колонка.base-only","1"),("Атрибут.fresh","10")]),(repeated_groups.as_str(),vec![("Атрибут.A.ДополнительныеКолонки[0].Колонка.x","11"),("Атрибут.A.ДополнительныеКолонки[1].Колонка.x","12"),("Атрибут.A.ДополнительныеКолонки[2].Колонка.x","23"),("Атрибут.A.ДополнительныеКолонки.G.Колонка.x","13"),("Атрибут.B.ДополнительныеКолонки.D.Колонка.x","15")]),(empty_groups,vec![("Атрибут.A.ДополнительныеКолонки[0].Колонка.x","11"),("Атрибут.A.ДополнительныеКолонки[1].Колонка.x","12"),("Атрибут.A.ДополнительныеКолонки[2].Колонка.x","23")]),(historical,vec![("Атрибут.H","9"),("Атрибут.H.Колонка.x","10")]),(fresh,vec![("Атрибут.A","1"),("Атрибут.A.Колонка.x","2"),("Атрибут.A.ДополнительныеКолонки.G.Колонка.y","3"),("Атрибут.B","4"),("Атрибут.B.Колонка.x","5"),("Атрибут.A.Колонка.base-only","6"),("Атрибут.A.Колонка.new-base","1000001"),("Атрибут.C","1000002"),("Атрибут.C.Колонка.x","1000003")])] {{
 for history_local in [true,false] {{
 if body!=historical && !history_local {{continue;}}
 for tree in [false,true] {{
 if (body==fresh || body==historical || body==empty_groups || body==repeated_groups) && !tree {{continue;}}
 let extension=if body==priority {{base}}else if body==fresh {{fresh_base}}else if body==empty_groups {{empty_groups_base}}else if body==repeated_groups {{repeated_groups_base.as_str()}}else{{""}};
 let xml=format!("<Form xmlns='http://v8.1c.ru/8.3/xcf/logform' xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:xs='http://www.w3.org/2001/XMLSchema'><Attributes>{{body}}</Attributes>{{extension}}</Form>");
 for direction in [Direction::XmlToYaml,Direction::YamlToXml] {{
 for reversed in [false,true] {{
  let mut names=vec!["metadata.base-form-column-file-source","metadata.current-form-column-file-source","metadata.base-form-attribute-file-source","metadata.current-form-attribute-file-source"];
  if tree {{names=vec!["metadata.base-form-attribute-tree-source","metadata.current-form-attribute-tree-source","metadata.base-form-additional-group-mode-source","metadata.current-form-additional-group-mode-source","metadata.base-form-attribute-mode-source","metadata.current-form-attribute-mode-source"];}}
  if body==historical {{names.push("metadata.form-id-reservations");}}
  if reversed {{names.reverse();}}
  let headers=names.iter().map(|name|{{let entry=entry_id(name).unwrap();MaterialSourceHeader{{source:SourceHeader{{entry,direction,inputs:prepare_inputs(entry,vec![("component".into(),InputValue::Text("main".into())),("owner".into(),InputValue::Text(if entry.0==observe.0 && !history_local {{"other-form"}}else{{"form"}}.into()))]).unwrap()}},kind:if entry.0!=observe.0 {{SourceKind::Ordinary}}else if matches!(direction,Direction::XmlToYaml) {{SourceKind::AttributeReservations{{max_depth:64}}}}else{{SourceKind::AttributeReservationSnapshot{{max_depth:64,budget:snapshot_budget}}}}}}}}).collect();
  let mut budget=test_fact_budget();budget.text.entries=120;budget.rows=120;
  let mut loaded=vec![];
  let prepared=prepare_streaming_materials::<FactCatalog>(headers,&[],Generation(1),budget,200,|slot,header|{{loaded.push(slot);let bytes=if header.entry.0==observe.0 {{match direction {{Direction::XmlToYaml=>history_xml.to_vec(),Direction::YamlToXml=>history_snapshot.clone()}}}}else{{match direction {{Direction::XmlToYaml=>xml.as_bytes().to_vec(),Direction::YamlToXml=>snapshot_fact_source(header.entry,xml.as_bytes(),&header.inputs).map_err(|error|vec![error])?}}}};Ok(LoadedSource{{bytes,documents:vec![]}})}}).unwrap_or_else(|errors|panic!("tree={{tree}}, body={{body}}, direction={{direction:?}}: {{errors:?}}"));
  assert_eq!(loaded.len(),if body==historical {{7}}else if tree {{6}}else{{4}},"one load per declared file projection");
  let index=fact_id("metadata.form-attribute-identities").unwrap();
  if body==historical {{assert_eq!(prepared.facts.lookup_parts(Generation(1),index,&["main","Атрибут.deleted","form"]),FactState::Missing,"history must only reserve occupation");}}
  for (address,id) in &expected {{assert_eq!(prepared.facts.lookup_parts(Generation(1),index,&["main",address,"form"]),FactState::Ready(if body==historical && !history_local {{if *address=="Атрибут.H" {{"1"}}else{{"2"}}}}else{{*id}}),"{{address}}");}}
 }}
 }}
 }}
 }}
 }}
}}
"#
    );
    run_generated(generated, "form-column-file-source", &main);
}

#[test]
fn form_attribute_number_sources_select_current_and_reserve_shadowed_base_ids() {
    let source = include_str!("../../../declarations/objects/form-attribute-number-sources.yaml");
    let files = [
        SourceFile {
            path: "attribute-number-sources.yaml",
            bytes: source.as_bytes(),
        },
        SourceFile {
            path: "form-numbering.yaml",
            bytes: include_bytes!("../../../declarations/objects/form-numbering.yaml"),
        },
        SourceFile {
            path: "form-column-sources.yaml",
            bytes: include_bytes!("../../../declarations/objects/form-column-sources.yaml"),
        },
    ];
    let modules: Vec<_> = files
        .into_iter()
        .flat_map(|file| nkdk_rule_compiler::parse_many(file).unwrap())
        // The all-spaces observer requires unrelated element allocators; this
        // matrix links the attribute/command/parameter sources and real columns.
        .filter(|module| module.id != "metadata.form-id-reservations")
        .collect();
    let generated = nkdk_rule_compiler::generate(&link(&modules).unwrap()).unwrap();
    run_generated(
        generated,
        "form-attribute-number-source-contract",
        r#"include!("generated.rs");
fn main() {
 use crate::core::facts::{FactState,Generation};
 use crate::core::facts::preparation::{MaterialSourceHeader,SourceHeader,SourceKind,LoadedSource,prepare_streaming_materials};
 let number=fact_id("metadata.form-attribute-identities").unwrap();
 let current="metadata.current-form-attribute-number-source";
 let base="metadata.base-form-attribute-number-source";
 let sources=[(current,"shared",Some("7")),(current,"fresh",None),(current,"current-only",None),
              (base,"shared",Some("9")),(base,"fresh",Some("1")),(base,"base-only",None)];
 for direction in [Direction::XmlToYaml,Direction::YamlToXml] {
  for base_first in [false,true] {
   for corrupt_current in [false,true] {
   let ordered:Vec<_>=if base_first {sources[3..].iter().chain(&sources[..3]).copied().collect()}else{sources.to_vec()};
   let headers=ordered.iter().map(|(name,address,_)|{
    let entry=entry_id(name).unwrap();
    MaterialSourceHeader{source:SourceHeader{entry,direction,inputs:prepare_inputs(entry,vec![
      ("component".into(),InputValue::Text("main".into())),("owner".into(),InputValue::Text("form".into())),
      ("address".into(),InputValue::Text((*address).into()))]).unwrap()},kind:SourceKind::Ordinary}
   }).collect();
   let mut budget=test_fact_budget();
   budget.text.entries=30;
   let prepared=prepare_streaming_materials::<FactCatalog>(headers,&[],Generation(1),budget,100,|slot,_|{
    let id=ordered[slot].2;
    let mut source=match direction {
     Direction::XmlToYaml=>format!("<f:Attribute xmlns:f='http://v8.1c.ru/8.3/xcf/logform' {}/>",id.map(|id|format!("id='{id}'")).unwrap_or_default()),
     Direction::YamlToXml=>id.map(|id|format!("Идентификатор: '{id}'")).unwrap_or_else(||"{}".into()),
    };
    if corrupt_current && ordered[slot].0==current && ordered[slot].1=="shared" {
     source=match direction {Direction::XmlToYaml=>"<f:Attribute".into(),Direction::YamlToXml=>"Идентификатор: [7]".into()};
    }
    Ok(LoadedSource{bytes:source.into_bytes(),documents:vec![]})
   });
   if corrupt_current {assert!(prepared.is_err(),"an unread current source must never select a base fallback");continue;}
   let prepared=prepared.unwrap();
   for (name,expected) in [("shared","7"),("fresh","2"),("current-only","3"),("base-only","1000001")] {
    assert_eq!(prepared.facts.lookup_parts(Generation(1),number,&["main",name,"form"]),FactState::Ready(expected),"{name}");
   }
   }
  }
 }
}
"#,
    );
}

#[test]
fn generated_number_sources_allocate_in_declared_phases_in_both_directions() {
    let current = include_str!("fixtures/numbered-facts.yaml");
    let base = current
        .replace("test.numbering", "test.base-numbering")
        .replace("first: 1}", "first: 1000001, phase: 1}");
    let generated = compile(&[
        SourceFile {
            path: "current.yaml",
            bytes: current.as_bytes(),
        },
        SourceFile {
            path: "base.yaml",
            bytes: base.as_bytes(),
        },
    ])
    .unwrap();
    run_generated(
        generated,
        "phased-number-sources",
        r#"include!("generated.rs");
fn main() {
 use crate::core::facts::{FactState,Generation};
 let number=fact_id("test.numbers").unwrap();
 for direction in [Direction::XmlToYaml,Direction::YamlToXml] {
  for reverse in [false,true] {
   let mut builder=fact_builder(Generation(1),test_fact_budget());
   let current=[("test.numbering","current"),("test.numbering","shared")];
   let base=[("test.base-numbering","shared"),("test.base-numbering","base")];
   let sources=if reverse {[base,current]}else{[current,base]};
   for group in sources {for (name,key) in group {
    let entry=entry_id(name).unwrap();
    let inputs=prepare_inputs(entry,vec![("owner".into(),InputValue::Text("form".into()))]).unwrap();
    let source=match direction {Direction::XmlToYaml=>format!("<Item name='{key}'/>"),Direction::YamlToXml=>format!("Имя: {key}")};
    let errors=contribute_file(entry,direction,source.as_bytes(),&inputs,&mut builder);
    assert!(errors.is_empty(),"{errors:?}");
   }}
   builder.reserve_number(number,&["form"],"1000001").unwrap();
   let facts=builder.finish();
   for (name,expected) in [("current","1"),("shared","2"),("base","1000002")] {
    assert_eq!(facts.lookup_parts(Generation(1),number,&[name,"form"]),FactState::Ready(expected));
   }
  }
 }
}
"#,
    );
}

#[test]
fn condition_on_non_collection_contribution_controls_fact_emission() {
    let conditional = OWNER.replace(
        "  value: {field: title}",
        "  value: {field: title}\n  when: {present: {field: title}}",
    );
    let generated = compile(&[
        SourceFile {
            path: "code.yaml",
            bytes: CODE.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: conditional.as_bytes(),
        },
    ])
    .expect("a scalar condition has a declared fact effect");
    run_generated(
        generated,
        "scalar-condition-facts-contract",
        r#"include!("generated.rs");
fn main() {
    let entry=entry_id("test.fact-owner").unwrap();
    let index=fact_id("test.names").unwrap();
    for (direction,source,expected) in [
        (Direction::XmlToYaml,"<Root><Code>a</Code><Title>Keep</Title></Root>",true),
        (Direction::XmlToYaml,"<Root><Code>a</Code></Root>",false),
        (Direction::YamlToXml,"Code: a\nTitle: Keep",true),
        (Direction::YamlToXml,"Code: a",false),
    ] {
        let generation=core::facts::Generation(1);
        let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:10,bytes:1000},rows:10});
        let errors=contribute_file(entry,direction,source.as_bytes(),&PreparedInputs::default(),&mut builder);
        if expected {assert!(errors.is_empty(),"{errors:?}");}
        else {assert!(errors.iter().all(|error| error.code.as_deref()==Some("value.missing")),"{errors:?}");}
        let facts=builder.finish();
        let actual=facts.lookup(generation,index,"a");
        if expected {assert_eq!(actual,core::facts::FactState::Ready("Keep"));}
        else if matches!(direction,Direction::XmlToYaml) {assert_eq!(actual,core::facts::FactState::Missing);}
        else {assert_eq!(actual,core::facts::FactState::Unready);}
    }
}
"#,
    );
}
#[test]
fn logical_addresses_extend_canonical_parents_and_keep_ordinal_names_distinct() {
    let owner = OWNER
        .replace("type: {use: code}", "type: {kind: scalar, scalar: text}")
        .replace("value:\n", "inputs:\n  parent: {type: {kind: scalar, scalar: text}}\n  named: {type: {kind: scalar, scalar: boolean}}\n  position: {type: {kind: scalar, scalar: number, profile: decimal}}\nvalue:\n")
        .replace("key: {field: code}", "key: {if: {input: named}, then: {logicalAddress: {parent: {input: parent}, parts: [{literal: Колонка}, {field: code}]}}, else: {logicalAddress: {parent: {input: parent}, parts: [{literal: Колонка}, {input: position}]}}}");
    let root = OWNER.replace("test.fact-owner", "test.root-fact-owner")
        .replace("type: {use: code}", "type: {kind: scalar, scalar: text}")
        .replace("key: {field: code}", "key: {logicalAddress: {parts: [{literal: Форма}, {field: code}, {literal: Атрибут}, {literal: 2}]}}");
    let automatic = owner
        .replace("test.fact-owner", "test.yaml-fact-owner")
        .replace("key: Code", "key: 'Код.А[0]%'")
        .replace("{literal: Колонка}", "{yamlField: code}");
    for invalid in [
        owner.replace("{input: parent}, parts", "{literal: true}, parts"),
        owner.replace("{literal: Колонка}", "{literal: false}"),
        owner.replace("[{literal: Колонка}, {field: code}]", "[]"),
        automatic.replace("{yamlField: code}", "{yamlField: missing}"),
        automatic.replace("{yamlField: code}", "{yamlField: code, extra: true}"),
    ] {
        assert!(
            compile(&[
                SourceFile {
                    path: "code.yaml",
                    bytes: CODE.as_bytes()
                },
                SourceFile {
                    path: "bad.yaml",
                    bytes: invalid.as_bytes()
                }
            ])
            .is_err()
        );
    }
    let explicit = automatic.replace("{yamlField: code}", "{literal: 'Код.А[0]%'}");
    let emitted = |source: &str| {
        compile(&[
            SourceFile {
                path: "code.yaml",
                bytes: CODE.as_bytes(),
            },
            SourceFile {
                path: "automatic.yaml",
                bytes: source.as_bytes(),
            },
        ])
        .unwrap()
        .files
        .into_iter()
        .map(|file| (file.path, file.contents))
        .collect::<Vec<_>>()
    };
    assert_eq!(
        emitted(&automatic),
        emitted(&explicit),
        "field selectors must disappear before generation; no runtime dispatch"
    );
    let generated = compile(&[
        SourceFile {
            path: "code.yaml",
            bytes: CODE.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: owner.as_bytes(),
        },
        SourceFile {
            path: "root.yaml",
            bytes: root.as_bytes(),
        },
        SourceFile {
            path: "automatic.yaml",
            bytes: automatic.as_bytes(),
        },
    ])
    .expect("canonical address expressions must compile");
    run_generated(
        generated,
        "logical-address-facts-contract",
        r#"include!("generated.rs");
fn main() {
 let entry=entry_id("test.fact-owner").unwrap();
 let index=fact_id("test.names").unwrap();
 let generation=core::facts::Generation(1);
 for direction in [Direction::XmlToYaml, Direction::YamlToXml] {
  let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:10,bytes:4000},rows:10});
  let cases=[
   ("Форма.Атрибут.Таблица", "0", "a.b[2]", true, "Форма.Атрибут.Таблица.Колонка.a%2Eb%5B2%5D"),
   ("Форма.Атрибут.Таблица", "0", "Повтор", false, "Форма.Атрибут.Таблица.Колонка[0]"),
   ("Форма.Атрибут.Таблица", "1", "Повтор", false, "Форма.Атрибут.Таблица.Колонка[1]"),
   ("Форма.Атрибут.Таблица.ДополнительныеКолонки.График", "0.0", "", false, "Форма.Атрибут.Таблица.ДополнительныеКолонки.График.Колонка[0]"),
   ("Форма.Атрибут.Таблица.ДополнительныеКолонки[2]", "0", "", false, "Форма.Атрибут.Таблица.ДополнительныеКолонки[2].Колонка[0]"),
  ];
  for (parent,position,name,named,_) in cases {
   let inputs=prepare_inputs(entry,vec![("parent".into(),InputValue::Text(parent.into())),("named".into(),InputValue::Boolean(named)),("position".into(),InputValue::Decimal(core::decimal::Decimal::parse(position).unwrap()))]).unwrap();
   let source=match direction {Direction::XmlToYaml=>format!("<Root><Code>{name}</Code><Title>Keep</Title></Root>"),Direction::YamlToXml=>format!("Code: '{name}'\nTitle: Keep")};
   let errors=contribute_file(entry,direction,source.as_bytes(),&inputs,&mut builder);
   assert!(errors.is_empty(),"{errors:?}");
  }
  let root=entry_id("test.root-fact-owner").unwrap();
  let source=match direction {Direction::XmlToYaml=>"<Root><Code>a.b[2]</Code><Title>Root</Title></Root>",Direction::YamlToXml=>"Code: a.b[2]\nTitle: Root"};
  assert!(contribute_file(root,direction,source.as_bytes(),&PreparedInputs::default(),&mut builder).is_empty());
  let automatic=entry_id("test.yaml-fact-owner").unwrap();
  let inputs=prepare_inputs(automatic,vec![("parent".into(),InputValue::Text("Форма.Атрибут".into())),("named".into(),InputValue::Boolean(true)),("position".into(),InputValue::Decimal(core::decimal::Decimal::parse("0").unwrap()))]).unwrap();
  let source=match direction {Direction::XmlToYaml=>"<Root><Code>one</Code><Title>Automatic</Title></Root>",Direction::YamlToXml=>"'Код.А[0]%': one\nTitle: Automatic"};
  assert!(contribute_file(automatic,direction,source.as_bytes(),&inputs,&mut builder).is_empty());
  let facts=builder.finish();
  assert_eq!(facts.lookup(generation,index,"Форма.Атрибут.Код%2EА%5B0%5D%25.one"),core::facts::FactState::Ready("Automatic"));
  assert_eq!(facts.lookup(generation,index,"Форма.a%2Eb%5B2%5D.Атрибут[2]"),core::facts::FactState::Ready("Root"));
  for (_,_,_,_,key) in cases {
   assert_eq!(facts.lookup(generation,index,key),core::facts::FactState::Ready("Keep"),"{key}");
  }
  for (parent,position) in [("Форма..Атрибут","0"),("Форма.Атрибут","-1"),("Форма.Атрибут","0.5")] {
   let inputs=prepare_inputs(entry,vec![("parent".into(),InputValue::Text(parent.into())),("named".into(),InputValue::Boolean(false)),("position".into(),InputValue::Decimal(core::decimal::Decimal::parse(position).unwrap()))]).unwrap();
   let source=match direction {Direction::XmlToYaml=>"<Root><Code>a</Code><Title>Keep</Title></Root>",Direction::YamlToXml=>"Code: a\nTitle: Keep"};
   let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:10,bytes:4000},rows:10});
   assert!(!contribute_file(entry,direction,source.as_bytes(),&inputs,&mut builder).is_empty());
   assert_eq!(builder.finish().lookup(generation,index,"anything"),core::facts::FactState::Unready);
  }
 }
}
"#,
    );
}
const NESTED_OWNER: &str = r#"format: nkdk-declarations/1
kind: object
id: test.nested-fact-owner
imports: {nested: test.nested-fact-rows}
value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}, {name: type, type: {use: nested}}]}
representations:
  xml: {kind: record, fields: [{field: name, path: [Root, Name]}, {field: type, path: [Root, Type]}]}
  yaml: {kind: mapping, fields: [{field: name, key: Name}, {field: type, key: Type}]}
contributions:
- index: test.nested-names
  forEach: {in: {get: {of: {field: type}, field: items}}, as: item}
  key: {field: name}
  value: {get: {of: {var: item}, field: code}}
"#;

const NESTED_ROW: &str = r#"format: nkdk-declarations/1
kind: value
id: test.nested-fact-row
value: {kind: record, fields: [{name: code, type: {kind: scalar, scalar: text}}, {name: title, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: code, path: [Code]}, {field: title, path: [Title]}]}
  yaml: {kind: mapping, fields: [{field: code, key: Code}, {field: title, key: Title}]}
"#;
const NESTED_ROWS: &str = r#"format: nkdk-declarations/1
kind: value
id: common.project-rows
imports: {row: test.nested-fact-row}
value: {kind: sequence, item: {use: row}}
representations:
  xml: {kind: element-sequence, path: [Item], item: {kind: declared}}
  yaml: {kind: sequence, item: {kind: declared}}
"#;
const NESTED_RECORD: &str = r#"format: nkdk-declarations/1
kind: value
id: test.nested-fact-rows
imports: {rows: common.project-rows}
value: {kind: record, fields: [{name: items, type: {use: rows}}]}
representations:
  xml: {kind: record, fields: [{field: items, path: [Items]}]}
  yaml: {kind: mapping, fields: [{field: items, key: Items}]}
"#;

const TYPE_DESCRIPTION_FILES: &[&str] = &[
    "string",
    "i8n-text",
    "type-description-name",
    "type-description-item",
    "type-description-items",
    "type-description-qname-item",
    "type-description-types",
    "type-description-type-sets",
    "type-description-identifier-item",
    "type-description-identifiers",
    "type-description",
];

const FACT_HELPERS: &str = r#"
fn test_fact_budget()->core::facts::prepared::FactBudget {
    core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:10,bytes:1000},rows:10}
}
fn tested_facts(entry:EntryId,direction:Direction,source:&str,generation:core::facts::Generation)->core::facts::prepared::PreparedTextFacts {
    let mut builder=fact_builder(generation,test_fact_budget());
    let diagnostics=contribute_file(entry,direction,source.as_bytes(),&PreparedInputs::default(),&mut builder);
    assert!(diagnostics.is_empty(),"{diagnostics:?}");
    builder.finish()
}
"#;

const FACT_MAIN: &str = r#"include!("generated.rs");
fn main() {
    let entry=entry_id(@ENTRY@).unwrap();
    for (direction,source) in [(Direction::XmlToYaml,@XML@),(Direction::YamlToXml,@YAML@)] {
        let generation=core::facts::Generation(1);
        let facts=tested_facts(entry,direction,source,generation);
        assert_eq!(facts.lookup(generation,fact_id(@INDEX@).unwrap(),"A"),core::facts::FactState::Ready(@EXPECTED@));
    }
    let generation=core::facts::Generation(2);
    let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:10,bytes:1000},rows:10});
    let errors=contribute_file(entry,Direction::XmlToYaml,b"<Root><Name>A</Name></Root>",&PreparedInputs::default(),&mut builder);
    assert!(!errors.is_empty(),"Missing nested value must not become a known empty index");
    assert_eq!(builder.finish().lookup(generation,fact_id(@INDEX@).unwrap(),"A"),core::facts::FactState::Unready);
}
"#;

const UNION_PREPARE_MAIN: &str = r#"include!("generated.rs");
fn prepared_pair(entry: EntryId, direction: Direction, sources: [&str;2]) -> core::facts::prepared::PreparedTextFacts {
    let generation=core::facts::Generation(1);
    let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:30,bytes:1000},rows:20});
    for source in sources {
        let errors=contribute_file(entry,direction,source.as_bytes(),&PreparedInputs::default(),&mut builder);
        assert!(errors.is_empty(),"{errors:?}");
    }
    builder.finish()
}
"#;

fn fact_main(entry: &str, index: &str, xml: &str, yaml: &str, expected: &str) -> String {
    FACT_MAIN
        .replace("@ENTRY@", &format!("{entry:?}"))
        .replace("@INDEX@", &format!("{index:?}"))
        .replace("@XML@", &format!("{xml:?}"))
        .replace("@YAML@", &format!("{yaml:?}"))
        .replace("@EXPECTED@", &format!("{expected:?}"))
}

fn nested_sources<'a>(
    row: &'a str,
    rows: &'a str,
    nested: &'a str,
    owner: &'a str,
    consumer: Option<&'a str>,
) -> Vec<SourceFile<'a>> {
    let mut sources = [
        ("row.yaml", row),
        ("rows.yaml", rows),
        ("nested.yaml", nested),
        ("owner.yaml", owner),
    ]
    .into_iter()
    .map(|(path, bytes)| SourceFile {
        path,
        bytes: bytes.as_bytes(),
    })
    .collect::<Vec<_>>();
    if let Some(consumer) = consumer {
        sources.push(SourceFile {
            path: "consumer.yaml",
            bytes: consumer.as_bytes(),
        });
    }
    sources
}

fn type_sources<'a>(
    names: &'a [&'a str],
    contents: &'a [Vec<u8>],
    owner: &'a str,
) -> Vec<SourceFile<'a>> {
    names
        .iter()
        .zip(contents)
        .map(|(name, bytes)| SourceFile { path: name, bytes })
        .chain(std::iter::once(SourceFile {
            path: "owner.yaml",
            bytes: owner.as_bytes(),
        }))
        .collect()
}

fn direct_collection_main(main: &str) -> String {
    main.replace("<Type><Items>", "<Items>")
        .replace("</Items></Type>", "</Items>")
        .replace("Type:\\n  Items:\\n", "Type:\\n")
        .replace("    - Code:", "  - Code:")
        .replace("      Title:", "    Title:")
}

fn run_generated(generated: GeneratedSources, name: &str, main: &str) {
    let root = std::env::temp_dir().join(format!("nkdk-{name}-{}", std::process::id()));
    let sources = root.join("src");
    std::fs::create_dir_all(&sources).unwrap();
    let core = std::path::PathBuf::from(concat!(env!("CARGO_MANIFEST_DIR"), "/../conversion-core"));
    std::fs::write(root.join("Cargo.toml"), format!("[package]\nname='{name}'\nversion='0.0.0'\nedition='2024'\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n[workspace]\n[profile.dev]\ndebug=0\nincremental=false\n")).unwrap();
    for file in generated.files {
        std::fs::write(sources.join(file.path), file.contents).unwrap();
    }
    let main = if main.contains("tested_facts(") || main.contains("test_fact_budget(") {
        format!("{FACT_HELPERS}\n{main}")
    } else {
        main.to_owned()
    };
    std::fs::write(sources.join("main.rs"), main).unwrap();
    let output = std::process::Command::new(env!("CARGO"))
        .args(["run", "--offline", "--quiet"])
        .current_dir(&root)
        .env(
            "CARGO_TARGET_DIR",
            std::env::var_os("CARGO_TARGET_DIR")
                .map(std::path::PathBuf::from)
                .unwrap_or_else(|| {
                    std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../target")
                }),
        )
        .env("CARGO_BUILD_JOBS", "1")
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    std::fs::remove_dir_all(root).unwrap();
}

#[test]
fn form_column_source_visits_all_groups_with_independent_key_scopes() {
    let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../declarations/objects/form-column-sources.yaml");
    let declaration =
        std::fs::read_to_string(path).expect("declared column source must be present");
    // Mount the original declaration under a namespace envelope, keeping fixture bytes intact.
    let declaration = declaration
        .replace("[f:Attribute]", "[f:Envelope, f:Attribute]")
        .replace("[f:Attribute,", "[f:Envelope, f:Attribute,");
    let generated = compile(&[SourceFile {
        path: "columns.yaml",
        bytes: declaration.as_bytes(),
    }])
    .expect("all groups use shared bound-parent declarations");
    let fixture=std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../packages/rules/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.xml");
    let main = format!(
        r#"include!("generated.rs");
fn main(){{
 let entry=entry_id("metadata.form-column-source").unwrap();let index=fact_id("metadata.form-attribute-identities").unwrap();let generation=core::facts::Generation(1);
 let fixture=std::fs::read_to_string({fixture:?}).unwrap();
 let grouped="<Attribute name='A.B'><Columns><AdditionalColumns table='First'><Column name='same' id='11'/><Column name='same' id='12'/></AdditionalColumns><AdditionalColumns table='Second'><Column name='same' id='13'/><Column name='' id='14'/></AdditionalColumns></Columns></Attribute>";
 for (direction,source,expected) in [
  (Direction::XmlToYaml,"<Attribute name='A.B'/>",vec![]),
  (Direction::XmlToYaml,"<Attribute name='A.B'><Columns/></Attribute>",vec![]),
  (Direction::YamlToXml,"Имя: A.B",vec![]),
  (Direction::XmlToYaml,fixture.as_str(),vec![("График.Колонка.Отступ","1"),("График.ДополнительныеКолонки.ГрафикНачислений.Колонка.Сумма","2")]),
  (Direction::YamlToXml,"Имя: График\nКолонки:\n  Обычные:\n    - Имя: Отступ\n      Идентификатор: '1'\n  Дополнительные:\n    - Таблица: ГрафикНачислений\n      Обычные:\n        - Имя: Сумма\n          Идентификатор: '2'",vec![("График.Колонка.Отступ","1"),("График.ДополнительныеКолонки.ГрафикНачислений.Колонка.Сумма","2")]),
  (Direction::XmlToYaml,grouped,vec![("A%2EB.ДополнительныеКолонки.First.Колонка[0]","11"),("A%2EB.ДополнительныеКолонки.First.Колонка[1]","12"),("A%2EB.ДополнительныеКолонки.Second.Колонка.same","13"),("A%2EB.ДополнительныеКолонки.Second.Колонка[1]","14")]),
  (Direction::YamlToXml,"Имя: A.B\nКолонки:\n  Дополнительные:\n    - Таблица: First\n      Обычные:\n        - Имя: same\n          Идентификатор: '11'\n        - Имя: same\n          Идентификатор: '12'\n    - Таблица: Second\n      Обычные:\n        - Имя: same\n          Идентификатор: '13'\n        - Имя: ''\n          Идентификатор: '14'",vec![("A%2EB.ДополнительныеКолонки.First.Колонка[0]","11"),("A%2EB.ДополнительныеКолонки.First.Колонка[1]","12"),("A%2EB.ДополнительныеКолонки.Second.Колонка.same","13"),("A%2EB.ДополнительныеКолонки.Second.Колонка[1]","14")]),
 ]{{
  let xml=format!("<Envelope xmlns='http://v8.1c.ru/8.3/xcf/logform' xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:xs='http://www.w3.org/2001/XMLSchema'>{{source}}</Envelope>");
  let source=if matches!(direction,Direction::XmlToYaml){{xml.as_str()}}else{{source}};
  let inputs=prepare_inputs(entry,vec![("component".into(),core::inputs::InputValue::Text("main".into())),("owner".into(),core::inputs::InputValue::Text("Form".into()))]).unwrap();
  let mut builder=fact_builder(generation,test_fact_budget());let errors=contribute_file(entry,direction,source.as_bytes(),&inputs,&mut builder);assert!(errors.is_empty(),"{{errors:?}}");let facts=builder.finish();
  for (address,id) in expected{{assert_eq!(facts.lookup_parts(generation,index,&["main",address,"Form"]),core::facts::FactState::Ready(id),"{{address}}");}}
 }}
 let inputs=prepare_inputs(entry,vec![("component".into(),core::inputs::InputValue::Text("main".into())),("owner".into(),core::inputs::InputValue::Text("Form".into()))]).unwrap();
 for broken in [grouped.replace(" id='13'",""),"<Attribute name='A.B'><Columns><Column name='one' id='1'/></Columns><Columns><Column name='two' id='2'/></Columns></Attribute>".into()]{{
  let xml=format!("<Envelope xmlns='http://v8.1c.ru/8.3/xcf/logform'>{{broken}}</Envelope>");let mut builder=fact_builder(generation,test_fact_budget());
  let errors=contribute_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs,&mut builder);assert!(!errors.is_empty(),"invalid source must not prepare a complete index");
  assert_eq!(builder.finish().lookup_parts(generation,index,&["main","A%2EB.ДополнительныеКолонки.First.Колонка[0]","Form"]),core::facts::FactState::Unready);
 }}
}}
"#
    );
    run_generated(generated, "form-column-groups", &main);
}

#[test]
fn collection_unique_keys_are_prepared_before_filtering_and_reused() {
    let input = "{get: {of: {field: type}, field: items}}";
    let current = "{get: {of: {var: item}, field: code}}";
    let unique = format!(
        "{{one: {{in: {input}, as: other, where: {{eq: [{{get: {{of: {{var: other}}, field: code}}}}, {current}]}}}}}}"
    );
    let address = format!(
        "{{if: {{and: [{{not: {{eq: [{current}, {{literal: ''}}]}}}}, {unique}]}}, then: {{logicalAddress: {{parts: [{{field: name}}, {{literal: Колонка}}, {current}]}}}}, else: {{logicalAddress: {{parts: [{{field: name}}, {{literal: Колонка}}, {{var: position}}]}}}}}}"
    );
    let owner = NESTED_OWNER.replace("as: item}", "as: item, index: position}")
        .replace("key: {field: name}", &format!("key: {address}"))
        .replace("  value: {get:", "  when: {not: {eq: [{get: {of: {var: item}, field: title}}, {literal: skip}]}}\n  value: {get:");
    let owner=owner.replace("  value: {get: {of: {var: item}, field: code}}", &format!("  value: {{if: {unique}, then: {current}, else: {{get: {{of: {{var: item}}, field: title}}}}}}"));
    let unique_title = format!(
        "{{one: {{in: {input}, as: other, where: {{eq: [{{get: {{of: {{var: item}}, field: title}}}}, {{get: {{of: {{var: other}}, field: title}}}}]}}}}}}"
    );
    let filter = "{not: {eq: [{get: {of: {var: item}, field: title}}, {literal: skip}]}}";
    let owner = owner.replace(
        &format!("when: {filter}"),
        &format!("when: {{and: [{filter}, {unique_title}]}}"),
    );
    let direct = owner
        .replace(
            "nested: test.nested-fact-rows",
            "nested: common.project-rows",
        )
        .replace(input, "{field: type}")
        .replace("path: [Root, Type]", "path: [Root, Items]");
    let inline = direct
        .replace("{name: name, type: {kind: scalar, scalar: text}}, ", "")
        .replace("{field: name, path: [Root, Name]}, ", "")
        .replace("{field: name, key: Name}, ", "")
        .replace("{field: name}", "{literal: A.B}");
    let common_row = NESTED_ROW
        .replace(
            "value: {kind: record",
            "imports: {text: common.string}\nvalue: {kind: record",
        )
        .replace(
            "name: code, type: {kind: scalar, scalar: text}",
            "name: code, type: {use: text}",
        );
    for (layout, declaration) in [
        ("nested", &owner),
        ("direct", &direct),
        ("inline", &inline),
        ("common-key", &owner),
    ] {
        let row = if layout == "common-key" {
            common_row.as_str()
        } else {
            NESTED_ROW
        };
        let mut sources = nested_sources(row, NESTED_ROWS, NESTED_RECORD, declaration, None);
        sources.push(SourceFile {
            path: "string.yaml",
            bytes: include_bytes!("../../../declarations/common/string.yaml"),
        });
        let generated = compile(&sources).expect(
            "unique key summary must not require passing an entire owner collection per row",
        );
        let code = std::str::from_utf8(
            &generated
                .files
                .iter()
                .find(|file| file.path == "generated.rs")
                .unwrap()
                .contents,
        )
        .unwrap();
        assert_eq!(
            code.matches("let mut _unique_keys0=").count(),
            1,
            "key and value must share the prepared summary"
        );
        assert_eq!(
            code.matches("for candidate in rows.iter(){").count(),
            1,
            "different key fields share a single preparation traversal"
        );
        let main = r#"include!("generated.rs");
fn main(){
 let entry=entry_id("test.nested-fact-owner").unwrap();let index=fact_id("test.nested-names").unwrap();let generation=core::facts::Generation(1);
 for (direction,source) in [
 (Direction::XmlToYaml,"<Root><Name>A.B</Name><Type><Items><Item><Code>dup</Code><Title>skip</Title></Item><Item><Code>dup</Code><Title>Second</Title></Item><Item><Code>solo</Code><Title>Third</Title></Item><Item><Code></Code><Title>Empty</Title></Item></Items></Type></Root>"),
 (Direction::YamlToXml,"Name: A.B\nType:\n  Items:\n    - Code: dup\n      Title: skip\n    - Code: dup\n      Title: Second\n    - Code: solo\n      Title: Third\n    - Code: ''\n      Title: Empty")]{
  let facts=tested_facts(entry,direction,source,generation);
  for (key,value) in [("A%2EB.Колонка[1]","Second"),("A%2EB.Колонка.solo","solo"),("A%2EB.Колонка[3]","")]{assert_eq!(facts.lookup(generation,index,key),core::facts::FactState::Ready(value));}
  for key in ["A%2EB.Колонка.dup","A%2EB.Колонка[0]","A%2EB.Колонка[2]"]{assert_eq!(facts.lookup(generation,index,key),core::facts::FactState::Missing);}
 }
}
"#;
        let main = if matches!(layout, "nested" | "common-key") {
            main.to_owned()
        } else {
            direct_collection_main(main)
        };
        let main = if layout == "inline" {
            main.replace("<Name>A.B</Name>", "")
                .replace("Name: A.B\\n", "")
        } else {
            main
        };
        run_generated(generated, &format!("unique-{layout}"), &main);
    }
}

#[test]
fn iteration_positions_address_rows_before_contribution_filtering() {
    let owner = NESTED_OWNER
        .replace("as: item}", "as: item, index: position}")
        .replace("key: {field: name}", "key: {logicalAddress: {parts: [{field: name}, {literal: Колонка}, {var: position}]}}")
        .replace("  value: {get:", "  when: {not: {eq: [{get: {of: {var: item}, field: code}}, {literal: skip}]}}\n  value: {get:");
    for invalid in [
        owner.replace("index: position", "index: item"),
        owner.replace("{var: position}", "{var: outside}"),
    ] {
        assert!(
            compile(&nested_sources(
                NESTED_ROW,
                NESTED_ROWS,
                NESTED_RECORD,
                &invalid,
                None
            ))
            .is_err()
        );
    }
    let direct = owner
        .replace(
            "nested: test.nested-fact-rows",
            "nested: common.project-rows",
        )
        .replace("{get: {of: {field: type}, field: items}}", "{field: type}")
        .replace("path: [Root, Type]", "path: [Root, Items]");
    let inline = direct
        .replace("{name: name, type: {kind: scalar, scalar: text}}, ", "")
        .replace("{field: name, path: [Root, Name]}, ", "")
        .replace("{field: name, key: Name}, ", "")
        .replace("{field: name}", "{literal: A.B}");
    let condition = "{not: {eq: [{get: {of: {var: item}, field: code}}, {literal: skip}]}}";
    let numeric = inline.replace(
        condition,
        &format!("{{and: [{{lt: [{{literal: 0}}, {{var: position}}]}}, {condition}]}}"),
    );
    let gate = owner
        .replace(
            "fields: [{name: name,",
            "fields: [{name: gate, type: {kind: scalar, scalar: text}}, {name: name,",
        )
        .replace(
            "fields: [{field: name, path",
            "fields: [{field: gate, path: [Root, Gate]}, {field: name, path",
        )
        .replace(
            "fields: [{field: name, key",
            "fields: [{field: gate, key: Gate}, {field: name, key",
        )
        .replace(
            condition,
            &format!("{{and: [{{eq: [{{field: gate}}, {{literal: enabled}}]}}, {condition}]}}"),
        );
    let boolean_gate = gate
        .replace(
            "name: gate, type: {kind: scalar, scalar: text}",
            "name: gate, type: {use: flag}",
        )
        .replace("{eq: [{field: gate}, {literal: enabled}]}", "{field: gate}")
        .replace(
            "imports: {nested:",
            "imports: {flag: common.boolean, nested:",
        );
    let decimal_gate = gate
        .replace(
            "name: gate, type: {kind: scalar, scalar: text}",
            "name: gate, type: {kind: scalar, scalar: number, profile: decimal}",
        )
        .replace(
            "{eq: [{field: gate}, {literal: enabled}]}",
            "{lt: [{literal: 0}, {field: gate}]}",
        );
    for (layout, source) in [
        ("nested", owner.as_str()),
        ("direct", direct.as_str()),
        ("inline", inline.as_str()),
        ("numeric", numeric.as_str()),
        ("gate", gate.as_str()),
        ("boolean-gate", boolean_gate.as_str()),
        ("decimal-gate", decimal_gate.as_str()),
    ] {
        let mut sources = nested_sources(NESTED_ROW, NESTED_ROWS, NESTED_RECORD, source, None);
        sources.push(SourceFile {
            path: "boolean.yaml",
            bytes: include_bytes!("../../../declarations/common/boolean.yaml"),
        });
        let generated = compile(&sources)
            .expect("iteration supplies a source position before when is evaluated");
        let rust = generated
            .files
            .iter()
            .find(|file| file.path == "generated.rs")
            .unwrap();
        let rust = std::str::from_utf8(&rust.contents).unwrap();
        assert!(rust.contains("address.push_index(_position1 as u64)"));
        assert_eq!(
            rust.contains("core::decimal::from_position(_position1)"),
            layout == "numeric"
        );
        let main = r#"include!("generated.rs");
fn main(){
 let entry=entry_id("test.nested-fact-owner").unwrap();let index=fact_id("test.nested-names").unwrap();
 for (direction,source) in [
 (Direction::XmlToYaml,"<Root><Name>A.B</Name><Type><Items><Item><Code>skip</Code><Title>First</Title></Item><Item><Code>one</Code><Title>Second</Title></Item><Item><Code>one</Code><Title>Third</Title></Item></Items></Type></Root>"),
 (Direction::YamlToXml,"Name: A.B\nType:\n  Items:\n    - Code: skip\n      Title: First\n    - Code: one\n      Title: Second\n    - Code: one\n      Title: Third")]{
  let generation=core::facts::Generation(1);
  let facts=tested_facts(entry,direction,source,generation);
  assert_eq!(facts.lookup(generation,index,"A%2EB.Колонка[0]"),core::facts::FactState::Missing);
  for key in ["A%2EB.Колонка[1]","A%2EB.Колонка[2]"]{assert_eq!(facts.lookup(generation,index,key),core::facts::FactState::Ready("one"));}
  let disabled=source.replace("<Gate>enabled</Gate>","<Gate>disabled</Gate>").replace("Gate: enabled","Gate: disabled").replace("<Gate>true</Gate>","<Gate>false</Gate>").replace("Gate: Истина","Gate: Ложь").replace("<Gate>1</Gate>","<Gate>0</Gate>").replace("Gate: 1","Gate: 0");
  if disabled!=source {
   let facts=tested_facts(entry,direction,&disabled,generation);
   assert_eq!(facts.lookup(generation,index,"A%2EB.Колонка[1]"),core::facts::FactState::Missing);
  }
 }
}
"#;
        let main = if matches!(layout, "nested" | "gate" | "boolean-gate" | "decimal-gate") {
            main.to_owned()
        } else {
            direct_collection_main(main)
        };
        let main = match layout {
            "numeric" => main
                .replace("<Code>skip</Code>", "<Code>one</Code>")
                .replace("Code: skip", "Code: one"),
            "boolean-gate" => main
                .replace("<Name>A.B</Name>", "<Name>A.B</Name><Gate>true</Gate>")
                .replace("Name: A.B\\n", "Name: A.B\\nGate: Истина\\n"),
            "decimal-gate" => main
                .replace("<Name>A.B</Name>", "<Name>A.B</Name><Gate>1</Gate>")
                .replace("Name: A.B\\n", "Name: A.B\\nGate: 1\\n"),
            "gate" => main
                .replace("<Name>A.B</Name>", "<Name>A.B</Name><Gate>enabled</Gate>")
                .replace("Name: A.B\\n", "Name: A.B\\nGate: enabled\\n"),
            _ => main,
        };
        run_generated(
            generated,
            &format!("indexed-{layout}-row-facts-contract"),
            &main,
        );
    }
    let column_row = NESTED_ROW
        .replace("path: [Code]", "path: [], attribute: name")
        .replace("path: [Title]", "path: [], attribute: id");
    let column_rows = NESTED_ROWS.replace("path: [Item]", "path: [Column]");
    let ordinary = direct
        .replace(
            "path: [Root, Name]",
            "path: [Envelope, Attribute], attribute: name",
        )
        .replace(
            "path: [Root, Items]",
            "path: [Envelope, Attribute, Columns]",
        );
    let additional_columns = |ordinary: &str| {
        ordinary.replace("fields: [{name: name,", "fields: [{name: table, type: {kind: scalar, scalar: text}}, {name: name,")
        .replace("fields: [{field: name, path", "fields: [{field: table, path: [Envelope, Attribute, Columns, AdditionalColumns], attribute: table}, {field: name, path")
        .replace("fields: [{field: name, key", "fields: [{field: table, key: Table}, {field: name, key")
        .replace("path: [Envelope, Attribute, Columns]}", "path: [Envelope, Attribute, Columns, AdditionalColumns]}")
        .replace("[{field: name}, {literal: Колонка}", "[{field: name}, {literal: ДополнительныеКолонки}, {field: table}, {literal: Колонка}")
    };
    let additional = additional_columns(&ordinary);
    let unique_columns = |source: &str| {
        let positional =
            "{logicalAddress: {parts: [{field: name}, {literal: Колонка}, {var: position}]}}";
        let named = "{logicalAddress: {parts: [{field: name}, {literal: Колонка}, {get: {of: {var: item}, field: code}}]}}";
        let unique = "{one: {in: {field: type}, as: other, where: {eq: [{get: {of: {var: other}, field: code}}, {get: {of: {var: item}, field: code}}]}}}";
        source.replace(
            positional,
            &format!("{{if: {unique}, then: {named}, else: {positional}}}"),
        )
    };
    let ordinary_unique = unique_columns(&ordinary);
    let additional_unique = additional_columns(&ordinary_unique);
    let fixture = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../packages/rules/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.xml");
    for (layout, source, yaml, key, name) in [
        (
            "ordinary",
            ordinary.as_str(),
            "Name: График\nType:\n  - Code: Отступ\n    Title: '1'",
            "График.Колонка[0]",
            "Отступ",
        ),
        (
            "ordinary-unique",
            ordinary_unique.as_str(),
            "Name: График\nType:\n  - Code: Отступ\n    Title: '1'",
            "График.Колонка.Отступ",
            "Отступ",
        ),
        (
            "additional-unique",
            additional_unique.as_str(),
            "Name: График\nTable: ГрафикНачислений\nType:\n  - Code: Сумма\n    Title: '2'",
            "График.ДополнительныеКолонки.ГрафикНачислений.Колонка.Сумма",
            "Сумма",
        ),
        (
            "additional",
            additional.as_str(),
            "Name: График\nTable: ГрафикНачислений\nType:\n  - Code: Сумма\n    Title: '2'",
            "График.ДополнительныеКолонки.ГрафикНачислений.Колонка[0]",
            "Сумма",
        ),
    ] {
        let generated = compile(&nested_sources(
            &column_row,
            &column_rows,
            NESTED_RECORD,
            source,
            None,
        ))
        .unwrap();
        let main = format!(
            r#"include!("generated.rs");
fn main(){{
 let body=std::fs::read_to_string({fixture:?}).unwrap();
 let xml=format!("<Envelope xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:xs='http://www.w3.org/2001/XMLSchema'>{{body}}</Envelope>");
 let entry=entry_id("test.nested-fact-owner").unwrap();let index=fact_id("test.nested-names").unwrap();
 for (direction,source) in [(Direction::XmlToYaml,xml.as_str()),(Direction::YamlToXml,{yaml:?})]{{
  let facts=tested_facts(entry,direction,source,core::facts::Generation(1));
  assert_eq!(facts.lookup(core::facts::Generation(1),index,{key:?}),core::facts::FactState::Ready({name:?}));
 }}
}}
"#
        );
        run_generated(
            generated,
            &format!("indexed-{layout}-fixture-facts-contract"),
            &main,
        );
    }
}

#[test]
fn owner_can_contribute_rows_from_nested_declared_record() {
    let row = NESTED_ROW;
    let rows = NESTED_ROWS;
    let nested = NESTED_RECORD;
    let owner = NESTED_OWNER;
    let required = owner
        .replace("id: test.nested-fact-owner", "id: test.collection-owner")
        .replace(
            "nested: test.nested-fact-rows",
            "nested: common.project-rows",
        )
        .replace("{get: {of: {field: type}, field: items}}", "{field: type}");
    let optional = required.replace(
        "id: test.collection-owner",
        "id: test.optional-collection-owner",
    ) + "presence:\n- target: {field: type}\n  xml: {missing: {denotes: {absent: true}}}\n  yaml: {missing: {denotes: {absent: true}}}\n";
    let mut sources = nested_sources(row, rows, nested, owner, None);
    sources.extend([
        SourceFile {
            path: "required.yaml",
            bytes: required.as_bytes(),
        },
        SourceFile {
            path: "optional.yaml",
            bytes: optional.as_bytes(),
        },
    ]);
    let generated =
        compile(&sources).expect("nested declared rows must be usable as an index contribution");
    let mut main = fact_main(
        "test.nested-fact-owner",
        "test.nested-names",
        "<Root><Name>A</Name><Type><Items><Item><Code>one</Code><Title>First</Title></Item></Items></Type></Root>",
        "Name: A\nType:\n  Items:\n    - Code: one\n      Title: First",
        "one",
    );
    main.truncate(main.trim_end().len() - 1);
    main.push_str(r#"
 let inputs=PreparedInputs::default();
 for name in ["test.collection-owner","test.optional-collection-owner"] {
  let entry=entry_id(name).unwrap();
  for xml in [b"<Root><Name>A</Name></Root>".as_slice(),b"<Root><Name>A</Name><Type/><Type/></Root>".as_slice()] {
   let mut builder=fact_builder(core::facts::Generation(3),test_fact_budget());
   let errors=contribute_file(entry,Direction::XmlToYaml,xml,&inputs,&mut builder);
   let permitted=name=="test.optional-collection-owner" && !std::str::from_utf8(xml).unwrap().contains("<Type");
   assert_eq!(errors.is_empty(),permitted,"{name}: {errors:?}");
   assert_eq!(builder.finish().lookup(core::facts::Generation(3),fact_id("test.nested-names").unwrap(),"A"),if permitted {core::facts::FactState::Missing}else{core::facts::FactState::Unready});
  }
 }
}
"#);
    run_generated(generated, "nested-facts-contract", &main);
    let addressed = owner.replace(
        "key: {field: name}",
        "key: {logicalAddress: {parts: [{field: name}, {get: {of: {var: item}, field: code}}]}}",
    );
    let generated = compile(&nested_sources(row, rows, nested, &addressed, None))
        .expect("the same address operation works inside nested collections");
    run_generated(
        generated,
        "nested-address-facts-contract",
        &fact_main(
            "test.nested-fact-owner",
            "test.nested-names",
            "<Root><Name>A.B</Name><Type><Items><Item><Code>one</Code><Title>First</Title></Item></Items></Type></Root>",
            "Name: A.B\nType:\n  Items:\n    - Code: one\n      Title: First",
            "one",
        ).replace("unwrap(),\"A\")", "unwrap(),\"A%2EB.one\")"),
    );
}

#[test]
fn projected_collection_computes_hidden_siblings_without_a_yaml_mapping() {
    let nested = NESTED_RECORD
        .replace("{name: items, type: {use: rows}}]", "{name: items, type: {use: rows}}, {name: summary, type: {kind: scalar, scalar: text}}]")
        .replace("[{field: items, path: [Items]}]", "[{field: items, path: [Items]}, {field: summary, path: [Summary]}]")
        .replace("{kind: mapping, fields: [{field: items, key: Items}]}", "{kind: projection, field: items}")
        + "presence:\n- target: {field: summary}\n  xml: {missing: {denotes: {literal: computed}}}\n  yaml: {missing: {denotes: {literal: computed}}}\n";
    let projected_source = nested
        .replace("kind: value", "kind: object")
        .replace(
            "id: test.nested-fact-rows",
            "id: test.projected-fact-source",
        )
        .replace("[Items]", "[Root, Items]")
        .replace("[Summary]", "[Root, Summary]")
        + "contributions:\n- index: test.projected-names\n  forEach: {in: {field: items}, as: item}\n  key: {get: {of: {var: item}, field: code}}\n  value: {get: {of: {var: item}, field: title}}\n";
    let mut sources = nested_sources(NESTED_ROW, NESTED_ROWS, &nested, NESTED_OWNER, None);
    sources.push(SourceFile {
        path: "projected-source.yaml",
        bytes: projected_source.as_bytes(),
    });
    let generated = compile(&sources).unwrap();
    run_generated(
        generated,
        "projected-hidden-sibling-contract",
        &(UNION_PREPARE_MAIN.to_owned()
            + r#"
fn main() {
    let generation=core::facts::Generation(1);
    let facts=prepared_pair(entry_id("test.projected-fact-source").unwrap(),Direction::YamlToXml,["- Code: one\n  Title: First","- Code: two\n  Title: Second"]);
    for (key,value) in [("one","First"),("two","Second")]{
        assert_eq!(facts.lookup(generation,fact_id("test.projected-names").unwrap(),key),core::facts::FactState::Ready(value));
    }
    let entry=entry_id("test.nested-fact-owner").unwrap();
    let inputs=PreparedInputs::default();
    let yaml=b"Name: A\nType:\n  - Code: one\n    Title: First";
    let reverse=convert_file(entry,Direction::YamlToXml,yaml,&inputs).unwrap();
    assert!(std::str::from_utf8(&reverse.bytes).unwrap().contains("<Summary>computed</Summary>"));
    assert!(validate_file(entry,yaml,&inputs).is_empty());
}
"#),
    );
}

#[test]
fn declared_collection_contributes_nested_rows_from_each_composed_item() {
    let fragment = NESTED_OWNER
        .replace("kind: object", "kind: fragment")
        .replace("id: test.nested-fact-owner", "id: test.section-fragment")
        .replace("[Root, Name]", "[Name]")
        .replace("[Root, Type]", "[Type]");
    let item = r#"format: nkdk-declarations/1
kind: value
id: test.section-item
imports: {properties: test.section-fragment}
compose: [{use: properties}]
value: {kind: record, fields: []}
representations:
  xml: {kind: record, fields: []}
  yaml: {kind: mapping, fields: []}
"#;
    let rows = r#"format: nkdk-declarations/1
kind: value
id: test.section-items
imports: {item: test.section-item}
value: {kind: sequence, item: {use: item}}
representations:
  xml: {kind: element-sequence, path: [Section], item: {kind: declared}}
  yaml: {kind: sequence, item: {kind: declared}}
"#;
    let owner = r#"format: nkdk-declarations/1
kind: object
id: test.section-owner
imports: {rows: test.section-items}
value: {kind: record, fields: [{name: sections, type: {use: rows}}]}
representations:
  xml: {kind: record, fields: [{field: sections, path: [Root, Sections]}]}
  yaml: {kind: mapping, fields: [{field: sections, key: Sections}]}
"#;
    let sources = [
        ("row.yaml", NESTED_ROW),
        ("rows.yaml", NESTED_ROWS),
        ("nested.yaml", NESTED_RECORD),
        ("fragment.yaml", fragment.as_str()),
        ("item.yaml", item),
        ("section-items.yaml", rows),
        ("owner.yaml", owner),
    ]
    .map(|(path, bytes)| SourceFile {
        path,
        bytes: bytes.as_bytes(),
    });
    let generated =
        compile(&sources).expect("composed collection items must retain fact contributions");
    let main = r#"include!("generated.rs");
fn collect(direction:Direction,source:&str,generation:core::facts::Generation)->(Vec<RuntimeDiagnostic>,core::facts::prepared::PreparedTextFacts) {
    let budget=core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:10,bytes:1000},rows:10};
    let mut builder=fact_builder(generation,budget);
    let errors=contribute_file(entry_id("test.section-owner").unwrap(),direction,source.as_bytes(),&PreparedInputs::default(),&mut builder);
    (errors,builder.finish())
}
fn main() {
    for (direction,source) in [
      (Direction::XmlToYaml,"<Root><Sections><Section><Name>A</Name><Type><Items><Item><Code>one</Code><Title>First</Title></Item></Items></Type></Section><Section><Name>B</Name><Type><Items><Item><Code>two</Code><Title>Second</Title></Item></Items></Type></Section></Sections></Root>"),
      (Direction::YamlToXml,"Sections:\n  - Name: A\n    Type:\n      Items:\n        - Code: one\n          Title: First\n  - Name: B\n    Type:\n      Items:\n        - Code: two\n          Title: Second")
    ] {
      let generation=core::facts::Generation(1);
      let (errors,facts)=collect(direction,source,generation);
      assert!(errors.is_empty(),"{errors:?}");
      let index=fact_id("test.nested-names").unwrap();
      assert_eq!(facts.lookup(generation,index,"A"),core::facts::FactState::Ready("one"));
      assert_eq!(facts.lookup(generation,index,"B"),core::facts::FactState::Ready("two"));
    }
    let generation=core::facts::Generation(2);
    let malformed="<Root><Sections><Section><Name>A</Name><Type><Items><Item><Code>one</Code><Title>First</Title></Item></Items></Type></Section><Section><Name>B</Name></Section></Sections></Root>";
    let (errors,facts)=collect(Direction::XmlToYaml,malformed,generation);
    assert!(!errors.is_empty(),"incomplete nested meaning must not publish a complete index");
    assert_eq!(facts.lookup(generation,fact_id("test.nested-names").unwrap(),"A"),core::facts::FactState::Unready);
}"#;
    run_generated(generated, "composed-item-facts-contract", main);
}

#[test]
fn recursive_collection_contributes_each_path_once_with_bound_parent_context() {
    let declarations = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: fragment
  id: test.tree-fields
  inputs: {parent: {type: {kind: scalar, scalar: text}}}
  value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}, {name: uuid, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: name, path: [Name]}, {field: uuid, path: [], attribute: id}]}
    yaml: {kind: mapping, fields: [{field: name, key: Name}, {field: uuid, key: Id}]}
  contributions:
  - index: test.tree-identities
    key: {concat: [{input: parent}, {literal: '.'}, {field: name}]}
    value: {field: uuid}
- kind: value
  id: test.tree-node
  imports: {base: test.tree-fields, children: test.tree-nodes}
  inputs: {parent: {type: {kind: scalar, scalar: text}}}
  compose: [{use: base, bind: {parent: {input: parent}}}]
  value:
    kind: record
    fields:
    - {name: active, type: {kind: scalar, scalar: text}}
    - name: children
      type: {use: children, bind: {parent: {concat: [{input: parent}, {literal: '.'}, {field: name}]}}}
  representations:
    xml: {kind: record, fields: [{field: active, path: [Active]}, {field: children, path: [Children]}]}
    yaml: {kind: mapping, fields: [{field: active, key: Active}, {field: children, key: Children}]}
  presence:
  - target: {field: active}
    xml: {missing: {denotes: {literal: active}}, canonical: [{when: {eq: [{field: active}, {literal: active}]}, form: missing}, {form: ordinary}]}
    yaml: {missing: {denotes: {literal: active}}}
  constraints:
  - id: active-name
    appliesTo: [xml-import, yaml-validation]
    assert: {eq: [{field: active}, {literal: active}]}
    diagnostic: {code: tree.inactive-name, severity: error, at: {field: name}, message: Name requires an active record}
- kind: value
  id: test.tree-nodes
  imports: {node: test.tree-node}
  inputs: {parent: {type: {kind: scalar, scalar: text}}}
  value: {kind: sequence, item: {use: node, bind: {parent: {input: parent}}}}
  representations:
    xml: {kind: element-sequence, path: [Item], item: {kind: declared}}
    yaml: {kind: sequence, item: {kind: declared}}
  presence:
  - target: self
    xml: {missing: {denotes: {absent: true}}}
    yaml: {missing: {denotes: {absent: true}}}
- kind: value
  id: test.tree-wrapper
  imports: {nodes: test.tree-nodes}
  inputs: {parent: {type: {kind: scalar, scalar: text}}}
  value: {kind: record, fields: [{name: label, type: {kind: scalar, scalar: text}}, {name: nodes, type: {use: nodes, bind: {parent: {input: parent}}}}]}
  representations:
    xml: {kind: record, fields: [{field: label, path: [Label]}, {field: nodes, path: [Children]}]}
    yaml: {kind: mapping, fields: [{field: label, key: Label}, {field: nodes, key: Children}]}
- kind: value
  id: test.tree-wrappers
  imports: {wrapper: test.tree-wrapper}
  value: {kind: sequence, item: {use: wrapper, bind: {parent: {literal: Root}}}}
  representations:
    xml: {kind: element-sequence, path: [Item], item: {kind: declared}}
    yaml: {kind: sequence, item: {kind: declared}}
- kind: object
  id: test.wrapped-tree-owner
  imports: {wrappers: test.tree-wrappers}
  value: {kind: record, fields: [{name: wrappers, type: {use: wrappers}}]}
  representations:
    xml: {kind: record, fields: [{field: wrappers, path: [Root, Nodes]}]}
    yaml: {kind: mapping, fields: [{field: wrappers, key: Nodes}]}
- kind: object
  id: test.tree-owner
  imports: {nodes: test.tree-nodes}
  value: {kind: record, fields: [{name: nodes, type: {use: nodes, bind: {parent: {literal: 'Root'}}}}]}
  representations:
    xml: {kind: record, fields: [{field: nodes, path: [Root, Nodes]}]}
    yaml: {kind: mapping, fields: [{field: nodes, key: Nodes}]}
"#;
    let main = r#"include!("generated.rs");
fn main() {
    for (entry_name,direction,source) in [
      ("test.tree-owner",Direction::XmlToYaml,"<Root><Nodes><Item id=\"1\"><Name>A</Name><Children><Item id=\"2\"><Name>B</Name><Children><Item id=\"3\"><Name>C</Name></Item></Children></Item></Children></Item><Item id=\"4\"><Name>D</Name></Item></Nodes></Root>"),
      ("test.tree-owner",Direction::YamlToXml,"Nodes:\n  - Name: A\n    Id: '1'\n    Children:\n      - Name: B\n        Id: '2'\n        Children:\n          - Name: C\n            Id: '3'\n  - Name: D\n    Id: '4'"),
      ("test.wrapped-tree-owner",Direction::XmlToYaml,"<Root><Nodes><Item><Label>Container</Label><Children><Item id=\"1\"><Name>A</Name><Children><Item id=\"2\"><Name>B</Name><Children><Item id=\"3\"><Name>C</Name></Item></Children></Item></Children></Item><Item id=\"4\"><Name>D</Name></Item></Children></Item></Nodes></Root>"),
      ("test.wrapped-tree-owner",Direction::YamlToXml,"Nodes:\n  - Label: Container\n    Children:\n      - Name: A\n        Id: '1'\n        Children:\n          - Name: B\n            Id: '2'\n            Children:\n              - Name: C\n                Id: '3'\n      - Name: D\n        Id: '4'"),
    ] {
      let generation=core::facts::Generation(1);
      let budget=||core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:8,bytes:1000},rows:4};
      let mut builder=fact_builder(generation,budget());
      let errors=contribute_file(entry_id(entry_name).unwrap(),direction,source.as_bytes(),&PreparedInputs::default(),&mut builder);
      assert!(errors.is_empty(),"{errors:?}");
      let facts=builder.finish();
      let index=fact_id("test.tree-identities").unwrap();
      for (path,uuid) in [("Root.A","1"),("Root.A.B","2"),("Root.A.B.C","3"),("Root.D","4")] {
        assert_eq!(facts.lookup(generation,index,path),core::facts::FactState::Ready(uuid),"{path}");
      }
      // A fact projection reads only its declared data from a larger owner.
      // Unrelated nested properties must not erase a valid named identity.
      let enriched=match direction {
        Direction::XmlToYaml=>source.replacen("<Name>B</Name>","<Name>B</Name><Details><Name>unrelated</Name></Details>",1),
        Direction::YamlToXml=>source.lines().map(|line| {
          if line.trim_start()=="Id: '2'" {
            let indent=&line[..line.len()-line.trim_start().len()];
            format!("{line}\n{indent}Details:\n{indent}  Name: unrelated")
          } else {line.to_owned()}
        }).collect::<Vec<_>>().join("\n"),
      };
      let mut projected=fact_builder(generation,budget());
      let errors=contribute_file(entry_id(entry_name).unwrap(),direction,enriched.as_bytes(),&PreparedInputs::default(),&mut projected);
      assert!(errors.is_empty(),"unrelated owner fields: {entry_name}, {direction:?}: {errors:?}");
      let projected=projected.finish();
      for (path,uuid) in [("Root.A","1"),("Root.A.B","2"),("Root.A.B.C","3"),("Root.D","4")] {
        assert_eq!(projected.lookup(generation,index,path),core::facts::FactState::Ready(uuid),"projected {path}");
      }
      if matches!(direction,Direction::YamlToXml) {
        let snapshot=materialize_fact_source(entry_id(entry_name).unwrap(),enriched.as_bytes(),&PreparedInputs::default()).unwrap();
        assert!(!std::str::from_utf8(&snapshot).unwrap().contains("Details"),"the retained projection excludes unrelated owner data");
        assert!(convert_file(entry_id(entry_name).unwrap(),direction,enriched.as_bytes(),&PreparedInputs::default()).is_err(),"ordinary conversion remains strict");
      }
      let bad=match direction {
        Direction::XmlToYaml=>source.replacen(" id=\"2\"", "", 1),
        Direction::YamlToXml=>source.lines().filter(|line|line.trim_start()!="Id: '2'").collect::<Vec<_>>().join("\n"),
      };
      assert_ne!(bad,source);
      let mut builder=fact_builder(generation,budget());
      let errors=contribute_file(entry_id(entry_name).unwrap(),direction,bad.as_bytes(),&PreparedInputs::default(),&mut builder);
      assert!(!errors.is_empty(),"a broken nested identity must not publish a complete index");
      assert_eq!(builder.finish().lookup(generation,index,"Root.A"),core::facts::FactState::Unready);
      if matches!(direction,Direction::YamlToXml) {
        let duplicate=source.lines().map(|line| {
          if line.trim_start()=="Id: '2'" {format!("{line}\n{line}")} else {line.to_owned()}
        }).collect::<Vec<_>>().join("\n");
        let mut builder=fact_builder(generation,budget());
        let errors=contribute_file(entry_id(entry_name).unwrap(),direction,duplicate.as_bytes(),&PreparedInputs::default(),&mut builder);
        assert!(!errors.is_empty(),"projection must retain duplicate declared keys");
        assert_eq!(builder.finish().lookup(generation,index,"Root.A"),core::facts::FactState::Unready);
      }
      let inactive=match direction {
        Direction::XmlToYaml=>source.replacen("<Name>B</Name>","<Name>B</Name><Active>inactive</Active>",1),
        Direction::YamlToXml=>source.lines().map(|line| {
          if line.trim_start()=="Id: '2'" {
            let indent=&line[..line.len()-line.trim_start().len()];
            format!("{line}\n{indent}Active: inactive")
          } else {line.to_owned()}
        }).collect::<Vec<_>>().join("\n"),
      };
      let mut builder=fact_builder(generation,budget());
      let errors=contribute_file(entry_id(entry_name).unwrap(),direction,inactive.as_bytes(),&PreparedInputs::default(),&mut builder);
      assert!(errors.iter().any(|error|error.code.as_deref()==Some("tree.inactive-name")),"{errors:?}");
      assert_eq!(builder.finish().lookup(generation,index,"Root.A"),core::facts::FactState::Unready);
    }
}"#;
    let named_declarations = declarations.replacen(
        "yaml: {kind: sequence, item: {kind: declared}}",
        "yaml: {kind: record-mapping, key: name}",
        1,
    );
    let named_main = main
        .replace(r#"Nodes:\n  - Name: A\n    Id: '1'\n    Children:\n      - Name: B\n        Id: '2'\n        Children:\n          - Name: C\n            Id: '3'\n  - Name: D\n    Id: '4'"#, r#"Nodes:\n  A:\n    Id: '1'\n    Children:\n      B:\n        Id: '2'\n        Children:\n          C:\n            Id: '3'\n  D:\n    Id: '4'"#)
        .replace(r#"Nodes:\n  - Label: Container\n    Children:\n      - Name: A\n        Id: '1'\n        Children:\n          - Name: B\n            Id: '2'\n            Children:\n              - Name: C\n                Id: '3'\n      - Name: D\n        Id: '4'"#, r#"Nodes:\n  - Label: Container\n    Children:\n      A:\n        Id: '1'\n        Children:\n          B:\n            Id: '2'\n            Children:\n              C:\n                Id: '3'\n      D:\n        Id: '4'"#);
    for (source, label, main) in [
        (declarations, "recursive-tree-facts", main),
        (
            named_declarations.as_str(),
            "recursive-named-tree-facts",
            named_main.as_str(),
        ),
    ] {
        let generated = compile(&[SourceFile {
            path: "tree.yaml",
            bytes: source.as_bytes(),
        }])
        .expect("recursive collection contributions retain the declared parent context");
        run_generated(generated, label, main);
    }
}

#[test]
fn type_description_items_can_be_declared_as_an_owner_fact_source() {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../declarations/common");
    let names = TYPE_DESCRIPTION_FILES;
    let contents: Vec<_> = names
        .iter()
        .map(|name| std::fs::read(root.join(format!("{name}.yaml"))).unwrap())
        .collect();
    let owner = NESTED_OWNER
        .replace("test.nested-fact-owner", "test.real-nested-fact-owner")
        .replace("test.nested-fact-rows", "common.type-description")
        .replace("test.nested-names", "test.real-nested-type-items")
        .replace("field: code", "field: value");
    let sources = type_sources(names, &contents, &owner);
    let generated = compile(&sources)
        .expect("actual TypeDescription item collection must support declared contribution");
    run_generated(
        generated,
        "type-facts-contract",
        &fact_main(
            "test.real-nested-fact-owner",
            "test.real-nested-type-items",
            "<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:xs='http://www.w3.org/2001/XMLSchema'><Name>A</Name><Type><v8:Type>xs:string</v8:Type></Type></Root>",
            "Name: A\nType:\n  - Строка",
            "Строка",
        ),
    );
    let union_owner = owner
        .replace("test.real-nested-type-items", "test.real-type-union")
        .replace("key: {field: name}", "key: {concat: [{literal: 'ОпределяемыйТип.'}, {field: name}]}")
        .replace("  value: {get: {of: {var: item}, field: value}}", "  value: {get: {of: {var: item}, field: value}}\n  union: {referencePrefix: 'ОпределяемыйТип.'}");
    let union_sources = type_sources(names, &contents, &union_owner);
    let generated = compile(&union_sources).expect("real TypeDescription can feed a named union");
    let main = r#"fn main() {
    let entry=entry_id("test.real-nested-fact-owner").unwrap();
    for (direction, sources) in [
        (Direction::XmlToYaml, ["<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:cfg='http://v8.1c.ru/8.1/data/enterprise/current-config'><Name>A</Name><Type><v8:TypeSet>cfg:DefinedType.Б</v8:TypeSet></Type></Root>","<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:xs='http://www.w3.org/2001/XMLSchema'><Name>Б</Name><Type><v8:Type>xs:string</v8:Type></Type></Root>"]),
        (Direction::YamlToXml, ["Name: A\nType: ОпределяемыйТип.Б","Name: Б\nType: Строка"]),
    ] {
        let generation=core::facts::Generation(1);
        let facts=prepared_pair(entry,direction,sources);
        let core::facts::FactState::Ready(values)=facts.lookup_union(generation,fact_id("test.real-type-union").unwrap(),"ОпределяемыйТип.A") else {panic!("defined type expansion unavailable")};
        assert_eq!(values.collect::<Vec<_>>(),vec!["Строка"]);
    }
}
"#;
    run_generated(
        generated,
        "real-type-union-contract",
        &format!("{UNION_PREPARE_MAIN}{main}"),
    );
}

#[test]
fn real_defined_type_fixture_contributes_declared_alternatives() {
    let common = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../declarations/common");
    let contents = TYPE_DESCRIPTION_FILES
        .iter()
        .map(|name| std::fs::read(common.join(format!("{name}.yaml"))).unwrap())
        .collect::<Vec<_>>();
    let owner = include_str!("../../../declarations/probes/defined-type-facts.yaml");
    let sources = type_sources(TYPE_DESCRIPTION_FILES, &contents, owner);
    let generated = compile(&sources).expect("real defined type paths must compile");
    let fixture = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../e2e/fixtures/xml/cf/DefinedTypes/ОпределяемыйТипВсеСвойства.xml");
    let yaml_fixture = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../e2e/fixtures/nkdk/cf/ОпределяемыйТип/ОпределяемыйТипВсеСвойства.yaml");
    let main = format!(
        r#"include!("generated.rs");
fn main() {{
    let entry=entry_id("migration.defined-type-facts").unwrap();
    for (direction,path) in [(Direction::XmlToYaml,{fixture:?}),(Direction::YamlToXml,{yaml_fixture:?})] {{
        let source=std::fs::read(path).unwrap();
        let generation=core::facts::Generation(1);
        let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{{text:core::facts::text::TextBudget{{entries:20,bytes:1000}},rows:10}});
        let inputs=prepare_inputs(entry,vec![
            ("ownerName".into(),InputValue::Text("ОпределяемыйТипВсеСвойства".into())),
            ("defaultLanguage".into(),InputValue::Text("ru".into())),
            ("registeredLanguages".into(),InputValue::Sequence(vec![InputValue::Text("ru".into())])),
        ]).unwrap();
        let issues=contribute_file(entry,direction,&source,&inputs,&mut builder);
        assert!(issues.is_empty(),"{{direction:?}} {{issues:?}}");
        let facts=builder.finish();
        let core::facts::FactState::Ready(values)=facts.lookup_union(generation,fact_id("metadata.defined-type-alternatives").unwrap(),"ОпределяемыйТип.ОпределяемыйТипВсеСвойства") else {{panic!("real defined type unavailable")}};
        assert_eq!(values.collect::<Vec<_>>(),vec!["Строка","Число"]);
    }}
}}
"#
    );
    run_generated(generated, "real-defined-type-facts", &main);
}

#[test]
fn named_union_contribution_expands_real_nested_rows_from_both_directions() {
    let row = NESTED_ROW
        .replace("test.nested-fact-row", "test.union-row")
        .replace(", {name: title, type: {kind: scalar, scalar: text}}", "")
        .replace(", {field: title, path: [Title]}", "")
        .replace(", {field: title, key: Title}", "");
    let rows = NESTED_ROWS
        .replace("common.project-rows", "test.union-rows")
        .replace("test.nested-fact-row", "test.union-row");
    let nested = NESTED_RECORD
        .replace("test.nested-fact-rows", "test.union-nested")
        .replace("common.project-rows", "test.union-rows");
    let owner = NESTED_OWNER
        .replace("test.nested-fact-owner", "test.union-owner")
        .replace("test.nested-fact-rows", "test.union-nested")
        .replace("test.nested-names", "test.union-types")
        .replace("key: {field: name}", "key: {concat: [{literal: 'ОпределяемыйТип.'}, {field: name}]}")
        .replace("  value: {get: {of: {var: item}, field: code}}", "  value: {get: {of: {var: item}, field: code}}\n  union: {referencePrefix: 'ОпределяемыйТип.'}");
    let consumer = r#"format: nkdk-declarations/1
kind: object
id: test.union-consumer
inputs: {types: {index: test.union-types}}
value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}, {name: value, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: name, path: [Root, Name]}, {field: value, path: [Root, Value]}]}
  yaml: {kind: mapping, fields: [{field: name, key: Name}, {field: value, key: Value}]}
constraints:
- id: allowed-type
  appliesTo: [xml-import, yaml-validation]
  assert:
    match:
      value: {lookup: {in: {input: types}, key: {concat: [{literal: 'ОпределяемыйТип.'}, {field: name}]}}}
      present: {as: alternatives, then: {exists: {in: {var: alternatives}, as: item, where: {eq: [{var: item}, {field: value}]}}}}
      absent: {literal: true}
  diagnostic: {code: type.mismatch, severity: warning, at: {field: value}, message: Value is not an effective type}
"#;
    let sources = nested_sources(&row, &rows, &nested, &owner, Some(consumer));
    let check_invalid = |candidate: &str, expected: &str| {
        let modules = [
            row.as_str(),
            rows.as_str(),
            nested.as_str(),
            candidate,
            consumer,
        ]
        .into_iter()
        .map(|source| {
            parse(SourceFile {
                path: "union.yaml",
                bytes: source.as_bytes(),
            })
            .unwrap()
        })
        .collect::<Vec<_>>();
        let issues = link(&modules).unwrap_err();
        assert!(
            issues.iter().any(|issue| issue.code == expected),
            "{issues:?}"
        );
    };
    check_invalid(
        &owner.replace(
            "  forEach: {in: {get: {of: {field: type}, field: items}}, as: item}\n",
            "",
        ),
        "unknown_variable",
    );
    check_invalid(
        &owner.replace(
            "key: {concat: [{literal: 'ОпределяемыйТип.'}, {field: name}]}",
            "key: {var: item}",
        ),
        "union_contribution_type",
    );
    check_invalid(
        &owner.replace(
            "key: {concat: [{literal: 'ОпределяемыйТип.'}, {field: name}]}",
            "key: {literal: true}",
        ),
        "contribution_type",
    );
    let generated = compile(&sources).expect("typed union declaration must compile");
    let main = r#"fn main() {
    let entry=entry_id("test.union-owner").unwrap();
    for (direction, sources) in [
        (Direction::XmlToYaml, ["<Root><Name>A</Name><Type><Items><Item><Code>Строка</Code></Item><Item><Code>ОпределяемыйТип.Б</Code></Item></Items></Type></Root>","<Root><Name>Б</Name><Type><Items><Item><Code>Число</Code></Item></Items></Type></Root>"]),
        (Direction::YamlToXml, ["Name: A\nType:\n  Items:\n    - Code: Строка\n    - Code: ОпределяемыйТип.Б","Name: Б\nType:\n  Items:\n    - Code: Число"]),
    ] {
        let generation=core::facts::Generation(1);
        let facts=std::sync::Arc::new(prepared_pair(entry,direction,sources));
        let core::facts::FactState::Ready(values)=facts.lookup_union(generation,fact_id("test.union-types").unwrap(),"ОпределяемыйТип.A") else {panic!("effective alternatives unavailable")};
        assert_eq!(values.collect::<Vec<_>>(),vec!["Строка","Число"]);
        let consumer=entry_id("test.union-consumer").unwrap();
        let inputs=prepare_fact_inputs(consumer,facts,generation,vec![]).unwrap();
        assert!(validate_file(consumer,"Name: A\nValue: Число".as_bytes(),&inputs).is_empty());
        assert!(validate_file(consumer,"Name: A\nValue: Булево".as_bytes(),&inputs).iter().any(|issue|issue.code.as_deref()==Some("type.mismatch")));
        let unresolved=validate_file(consumer,"Name: Нет\nValue: Булево".as_bytes(),&inputs);
        assert!(unresolved.iter().any(|issue|issue.code.as_deref()==Some("fact.missing")&&issue.severity==core::Severity::Warning));
        assert!(!unresolved.iter().any(|issue|issue.code.as_deref()==Some("type.mismatch")));
    }
}
"#;
    run_generated(
        generated,
        "named-union-contract",
        &format!("{UNION_PREPARE_MAIN}{main}"),
    );
}

#[test]
fn contributions_bind_declared_fields_and_reject_untyped_or_hidden_context() {
    let parse_one = |source: &str| {
        parse(SourceFile {
            path: "owner.yaml",
            bytes: source.as_bytes(),
        })
        .unwrap()
    };
    let module = parse_one(OWNER);
    link(&[module, parse_one(CODE)]).unwrap();
    compile(&[
        SourceFile {
            path: "code.yaml",
            bytes: CODE.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: OWNER.as_bytes(),
        },
    ])
    .unwrap();
    for source in [
        OWNER.replace("{field: code}", "{field: missing}"),
        OWNER.replace("{field: code}", "{literal: true}"),
    ] {
        assert!(link(&[parse_one(&source), parse_one(CODE)]).is_err());
    }
    let coalesced = OWNER.replace(
        "- index: test.names",
        "- index: test.names\n  duplicates: coalesce-equal",
    );
    link(&[parse_one(&coalesced), parse_one(CODE)]).unwrap();
    for policy in ["first", "last", "unknown"] {
        assert!(
            parse(SourceFile {
                path: "owner.yaml",
                bytes: coalesced.replace("coalesce-equal", policy).as_bytes()
            })
            .is_err()
        );
    }
    let conflicting_policy = OWNER.replace("id: test.fact-owner", "id: test.strict-owner");
    let errors = link(&[
        parse_one(&coalesced),
        parse_one(&conflicting_policy),
        parse_one(CODE),
    ])
    .unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "index_shape_mismatch")
    );
    let consumer = include_str!("fixtures/fact-consumer.yaml");
    let inferred = consumer.replace(
        "    type:\n      kind: index\n      key: {kind: scalar, scalar: text}\n      value: {kind: scalar, scalar: text}\n", "",
    );
    let dependent = inferred.replace("id: test.fact-consumer", "id: test.dependent")
        + "\ncontributions:\n- index: test.dependent-names\n  key: {field: target}\n  value:\n    match:\n      value: {lookup: {in: {input: names}, key: {field: target}}}\n      present: {as: found, then: {var: found}}\n      absent: {literal: ''}\n";
    let final_consumer = inferred.replace("test.names", "test.dependent-names");
    let mut chain = vec![
        parse_one(&final_consumer),
        parse_one(&dependent),
        parse_one(OWNER),
        parse_one(CODE),
    ];
    let linked = link(&chain).unwrap();
    chain.reverse();
    assert_eq!(linked, link(&chain).unwrap());
    let cyclic = dependent.replace("index: test.names", "index: test.dependent-names");
    assert!(link(&[parse_one(&cyclic)]).is_err());
    let enum_kind = include_str!("fixtures/text-pattern-kind.yaml");
    let enum_key = consumer
        .replace(
            "id: test.fact-consumer",
            "id: test.fact-consumer\nimports: {kind: common.pattern-kind}",
        )
        .replace("    index: test.names\n", "")
        .replace(
            "key: {kind: scalar, scalar: text}",
            "key: {kind: record, fields: [{name: kind, type: {use: kind}}]}",
        )
        .replace(
            "key: {field: target}",
            "key: {record: {kind: {literal: west}}}",
        );
    link(&[parse_one(enum_kind), parse_one(&enum_key)]).unwrap();
    for (replacement, code) in [
        ("{literal: missing}", "unknown_enum_literal"),
        ("{field: target}", "expression_type_mismatch"),
        ("{literal: true}", "expression_type_mismatch"),
    ] {
        let errors = link(&[
            parse_one(enum_kind),
            parse_one(&enum_key.replace("{literal: west}", replacement)),
        ])
        .unwrap_err();
        assert!(errors.iter().any(|error| error.code == code), "{errors:?}");
    }
    for invalid in [
        consumer.replace("index: test.names", "index: test.missing"),
        consumer.replace("key: {field: target}", "key: {literal: true}"),
        consumer.replace("in: {input: names}", "in: {field: target}"),
    ] {
        assert!(link(&[parse_one(OWNER), parse_one(CODE), parse_one(&invalid)]).is_err());
    }
    let rows = include_str!("fixtures/fact-rows.yaml");
    let row_owner = include_str!("fixtures/fact-rows-owner.yaml");
    let member = include_str!("fixtures/fact-member-consumer.yaml");
    for invalid in [
        member.replace("index: test.member-names", "index: test.missing"),
        member.replace(
            "owner: {literal: a.b}, kind: {literal: element}",
            "owner: {literal: a.b}",
        ),
        member.replace("owner: {literal: a.b}", "owner: {literal: true}"),
    ] {
        assert!(link(&[parse_one(rows), parse_one(row_owner), parse_one(&invalid)]).is_err());
    }
    let conflicting = row_owner
        .replace("id: test.fact-rows", "id: test.other-rows")
        .replace("      owner: {literal: a.b}\n", "");
    let errors = link(&[
        parse_one(rows),
        parse_one(row_owner),
        parse_one(&conflicting),
        parse_one(member),
    ])
    .unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "index_shape_mismatch")
    );
    let opaque_comparison = consumer.split("  assert:").next().unwrap().to_owned()
        + "  assert: {eq: [{input: names}, {input: names}]}\n  diagnostic: {severity: error, at: {field: target}, message: Invalid}\n";
    let errors = link(&[
        parse_one(OWNER),
        parse_one(CODE),
        parse_one(&opaque_comparison),
    ])
    .unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "opaque_index_comparison")
    );
    assert!(
        parse(SourceFile {
            path: "owner.yaml",
            bytes: OWNER
                .replace(
                    "index: test.names",
                    "index: test.names\n  handler: resolveNames"
                )
                .as_bytes()
        })
        .is_err()
    );
}

#[test]
fn collection_conditions_read_boolean_decimal_and_text_fields() {
    let row = r#"format: nkdk-declarations/1
kind: value
id: test.conditional-row
imports: {flag: common.boolean, count: common.exact-decimal}
value: {kind: record, fields: [{name: code, type: {kind: scalar, scalar: text}}, {name: enabled, type: {use: flag}}, {name: amount, type: {use: count}}]}
representations:
  xml: {kind: record, fields: [{field: code, path: [Code]}, {field: enabled, path: [Enabled]}, {field: amount, path: [Amount]}]}
  yaml: {kind: mapping, fields: [{field: code, key: Code}, {field: enabled, key: Enabled}, {field: amount, key: Amount}]}
"#;
    let rows = NESTED_ROWS
        .replace("common.project-rows", "test.conditional-rows")
        .replace("test.nested-fact-row", "test.conditional-row");
    let owner = include_str!("fixtures/fact-rows-owner.yaml")
        .split("- index: test.member-names")
        .next()
        .unwrap()
        .replace("common.project-rows", "test.conditional-rows")
        .replace("field: title", "field: code")
        + "  when:\n    and:\n    - {get: {of: {var: row}, field: enabled}}\n    - {lt: [{literal: 9007199254740992}, {get: {of: {var: row}, field: amount}}]}\n    - {not: {eq: [{get: {of: {var: row}, field: code}}, {literal: blocked}]}}\n";
    let owner = owner
        + "- index: test.amounts\n  forEach: {in: {field: rows}, as: row}\n  key: {get: {of: {var: row}, field: code}}\n  value: {decimalText: {get: {of: {var: row}, field: amount}}}\n";
    let boolean = include_str!("../../../declarations/common/boolean.yaml");
    let decimal = include_str!("../../../declarations/common/number.yaml");
    let scalar = r#"format: nkdk-declarations/1
kind: object
id: test.scalar-amount
imports: {number: common.exact-decimal, kind: test.fact-kind}
value: {kind: record, fields: [{name: amount, type: {use: number}}, {name: kind, type: {use: kind}}]}
representations:
  xml: {kind: record, fields: [{field: amount, path: [Root, Amount]}, {field: kind, path: [Root, Kind]}]}
  yaml: {kind: mapping, fields: [{field: amount, key: Amount}, {field: kind, key: Kind}]}
presence:
- {target: {field: amount}, xml: {missing: {denotes: {absent: true}}}, yaml: {missing: {denotes: {absent: true}}}}
- {target: {field: kind}, xml: {missing: {denotes: {absent: true}}}, yaml: {missing: {denotes: {absent: true}}}}
contributions:
- index: test.scalar-amount
  key: {literal: single}
  value: {decimalText: {field: amount}}
  when: {present: {field: amount}}
- index: test.scalar-kind
  key: {literal: single}
  value: {enumText: {field: kind}}
  when: {present: {field: kind}}
"#;
    let enumeration = "format: nkdk-declarations/1\nkind: value\nid: test.fact-kind\nenum: {Number: Число, String: Строка}\n";
    let sources = [
        ("row.yaml", row),
        ("scalar.yaml", scalar),
        ("rows.yaml", rows.as_str()),
        ("owner.yaml", owner.as_str()),
        ("flag.yaml", boolean),
        ("count.yaml", decimal),
        ("kind.yaml", enumeration),
    ]
    .map(|(path, source)| SourceFile {
        path,
        bytes: source.as_bytes(),
    });
    let generated = compile(&sources).expect("conditions use the common typed expression language");
    let invalid = owner.replace(
        "decimalText: {get: {of: {var: row}, field: amount}}",
        "decimalText: {get: {of: {var: row}, field: code}}",
    );
    let mut invalid_sources = sources
        .iter()
        .map(|source| SourceFile {
            path: source.path,
            bytes: source.bytes,
        })
        .collect::<Vec<_>>();
    invalid_sources[3] = SourceFile {
        path: "owner.yaml",
        bytes: invalid.as_bytes(),
    };
    assert!(
        compile(&invalid_sources)
            .unwrap_err()
            .iter()
            .any(|issue| issue.code == "expression_type_mismatch")
    );
    let invalid_enum = scalar.replace("enumText: {field: kind}", "enumText: {field: amount}");
    invalid_sources[3] = SourceFile {
        path: "owner.yaml",
        bytes: owner.as_bytes(),
    };
    invalid_sources[1] = SourceFile {
        path: "scalar.yaml",
        bytes: invalid_enum.as_bytes(),
    };
    assert!(
        compile(&invalid_sources)
            .unwrap_err()
            .iter()
            .any(|issue| issue.code == "expression_type_mismatch")
    );
    run_generated(
        generated,
        "typed-row-condition-contract",
        r#"include!("generated.rs");
fn main() {
    let entry=entry_id("test.fact-rows").unwrap();
    let generation=core::facts::Generation(1);
    for (lexical,expected) in [("11.0","11"),("1.1e1","11"),("9007199254740993","9007199254740993")] {
        let scalar=entry_id("test.scalar-amount").unwrap();
        let original=format!("<Root><Amount>{lexical}</Amount></Root>");
        let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:10,bytes:1000},rows:10});
        let errors=contribute_file(scalar,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default(),&mut builder);
        assert!(errors.is_empty(),"{errors:?}");
        let facts=builder.finish();
        assert_eq!(facts.lookup(generation,fact_id("test.scalar-amount").unwrap(),"single"),core::facts::FactState::Ready(expected));
    }
    for (direction,source) in [(Direction::XmlToYaml,"<Root><Kind>Number</Kind></Root>"),(Direction::YamlToXml,"Kind: Число")] {
        let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:20,bytes:1000},rows:20});
        let issues=contribute_file(entry_id("test.scalar-amount").unwrap(),direction,source.as_bytes(),&PreparedInputs::default(),&mut builder);
        assert!(issues.is_empty(),"{issues:?}");
        assert_eq!(builder.finish().lookup(generation,fact_id("test.scalar-kind").unwrap(),"single"),core::facts::FactState::Ready("Number"));
    }
    for direction in [Direction::XmlToYaml,Direction::YamlToXml] {
        let rows=[("keep",true,"9007199254740993.0"),("rounded",true,"9007199254740992"),("disabled",false,"9007199254740993"),("blocked",true,"9007199254740993")];
        let source=match direction {
            Direction::XmlToYaml=>format!("<Root><Rows>{}</Rows></Root>",rows.iter().map(|(name,enabled,count)|format!("<Item><Code>{name}</Code><Enabled>{enabled}</Enabled><Amount>{count}</Amount></Item>")).collect::<String>()),
            Direction::YamlToXml=>format!("Rows:\n{}",rows.iter().map(|(name,enabled,count)|format!("  - Code: {name}\n    Enabled: {}\n    Amount: {count}\n",if *enabled{"Истина"}else{"Ложь"})).collect::<String>()),
        };
        let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:20,bytes:1000},rows:20});
        let errors=contribute_file(entry,direction,source.as_bytes(),&PreparedInputs::default(),&mut builder);
        assert!(errors.is_empty(),"{direction:?} {errors:?}");
        let facts=builder.finish();let index=fact_id("test.names").unwrap();
        assert_eq!(facts.lookup(generation,index,"keep"),core::facts::FactState::Ready("keep"));
        let amounts=fact_id("test.amounts").unwrap();
        assert_eq!(facts.lookup(generation,amounts,"keep"),core::facts::FactState::Ready("9007199254740993"));
        assert_eq!(facts.lookup(generation,amounts,"rounded"),core::facts::FactState::Ready("9007199254740992"));
        for absent in ["rounded","disabled","blocked"] {assert_eq!(facts.lookup(generation,index,absent),core::facts::FactState::Missing);}
    }
}"#,
    );
}

#[test]
fn projected_boolean_defaults_use_declared_yaml_spelling() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.truth
  value: {kind: scalar, scalar: boolean}
  representations:
    xml: {kind: text, values: [{value: true, text: 'true'}, {value: false, text: 'false'}]}
    yaml: {kind: scalar, values: [{value: true, literal: Включено}, {value: false, literal: Выключено}]}
- kind: value
  id: test.projected-truth
  imports: {truth: test.truth}
  value: {kind: record, fields: [{name: value, type: {use: truth}}, {name: hidden, type: {use: truth}}]}
  representations:
    xml: {kind: record, fields: [{field: value, path: [Value]}]}
    yaml: {kind: projection, field: value}
  presence:
  - target: {field: hidden}
    xml: {missing: {denotes: {literal: false}}}
    yaml: {missing: {denotes: {literal: false}}}
- kind: value
  id: test.truth-choice
  imports: {truth: test.projected-truth}
  value: {kind: choice, variants: [{name: plain, type: {use: truth}}]}
  representations:
    xml: {kind: choice, fallback: plain}
    yaml: {kind: choice, variants: [{variant: plain, form: scalar, tag: флаг}]}
- kind: object
  id: test.truth-owner
  imports: {truth: test.truth-choice}
  value: {kind: record, fields: [{name: flag, type: {use: truth}}]}
  representations:
    xml: {kind: record, fields: [{field: flag, path: [Root, Flag]}]}
    yaml: {kind: mapping, fields: [{field: flag, key: Флаг}]}
  presence:
  - target: {field: flag}
    yaml: {default: {variant: {name: plain, value: {record: {value: {literal: true}, hidden: {literal: false}}}}}}

"#;
    let sources = [
        source.to_owned(),
        source
            .replace("id: test.truth-owner", "id: test.false-owner")
            .replace("value: {literal: true}", "value: {literal: false}"),
    ];
    // Keep shared value declarations only once; the second owner changes its default.
    let second = sources[1].split("- kind: object").nth(1).unwrap();
    let joined = format!("{}\n- kind: object{}", sources[0], second);
    let generated = nkdk_rule_compiler::compile_exporting(
        &[SourceFile {
            path: "projected-boolean-default.yaml",
            bytes: joined.as_bytes(),
        }],
        |module| module.id.ends_with("-owner"),
    )
    .unwrap();
    run_generated(
        generated,
        "projected-boolean-default-contract",
        r#"include!("generated.rs");
fn main() {
    for (name,value,spelling) in [("test.truth-owner","true","Включено"),("test.false-owner","false","Выключено")] {
        let entry=entry_id(name).unwrap();
        let xml=format!("<Root><Flag><Value>{value}</Value></Flag></Root>");
        let inputs=PreparedInputs::default();
        let forward=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
        assert!(forward.diagnostics.is_empty());
        assert!(!std::str::from_utf8(&forward.bytes).unwrap().contains("Флаг:"));
        for yaml in [String::new(),format!("Флаг: !флаг {spelling}")] {
            let reverse=convert_file(entry,Direction::YamlToXml,yaml.as_bytes(),&inputs).unwrap();
            assert!(reverse.diagnostics.is_empty());
            core::proof::verify(xml.as_bytes(),&reverse.bytes,|_|false).unwrap();
        }
    }
}
"#,
    );
}

#[test]
fn enum_text_from_a_variant_field_validates_inside_an_attribute_wrapper() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.letter
  value: {kind: enum, variants: [{name: A, value: A}, {name: B, value: B}]}
  representations:
    xml: {kind: text, values: [{value: A, text: A}, {value: B, text: B}]}
    yaml: {kind: scalar, values: [{value: A, literal: Альфа}, {value: B, literal: Бета}]}
- kind: value
  id: test.letter-row
  imports: {letter: test.letter}
  value: {kind: record, fields: [{name: payload, type: {use: letter}}]}
  representations:
    xml: {kind: record, fields: [{field: payload, path: []}]}
    yaml: {kind: projection, field: payload}
- kind: value
  id: test.letter-choice
  imports: {row: test.letter-row}
  value: {kind: choice, variants: [{name: plain, type: {use: row}}]}
  representations:
    xml: {kind: choice, fallback: plain}
    yaml: {kind: choice, variants: [{variant: plain, form: scalar, tag: буква}]}
- kind: object
  id: test.wrapped-letter
  imports: {letter: test.letter-choice}
  value: {kind: record, fields: [{name: selected, type: {use: letter}}]}
  representations:
    xml: {kind: with-attributes, attributes: [{name: version, value: {text: '1'}}], content: {kind: record, fields: [{field: selected, path: [Root, Letter]}]}}
    yaml: {kind: mapping, fields: [{field: selected, key: Буква}]}
  constraints:
  - id: letter-check
    appliesTo: [yaml-validation]
    assert: {eq: [{enumText: {get: {of: {variantValue: {value: {field: selected}, variant: plain}}, field: payload}}}, {literal: A}]}
    diagnostic: {code: letter.changed, severity: error, at: {field: selected}, message: Не та буква}
"#;
    let generated = nkdk_rule_compiler::compile_exporting(
        &[SourceFile {
            path: "enum-variant-access.yaml",
            bytes: source.as_bytes(),
        }],
        |module| module.id == "test.wrapped-letter",
    )
    .unwrap();
    run_generated(
        generated,
        "enum-variant-access-contract",
        r#"include!("generated.rs");
fn main() {
    let entry=entry_id("test.wrapped-letter").unwrap();
    let inputs=PreparedInputs::default();
    assert!(validate_file(entry,"Буква: !буква Альфа".as_bytes(),&inputs).is_empty());
    let issues=validate_file(entry,"Буква: !буква Бета".as_bytes(),&inputs);
    assert_eq!(issues.len(),1);
    assert_eq!(issues[0].code.as_deref(),Some("letter.changed"));
    let source=b"<Root version=\"1\"><Letter>B</Letter></Root>";
    let converted=convert_file(entry,Direction::XmlToYaml,source,&inputs).unwrap();
    let restored=convert_file(entry,Direction::YamlToXml,&converted.bytes,&inputs).unwrap();
    core::proof::verify(source,&restored.bytes,|_|false).unwrap();
}
"#,
    );
}

#[test]
fn prepared_enum_index_binds_to_a_fragment_with_the_same_text_key_layout() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.key-kind
  enum: {A: Альфа, B: Бета}
- kind: object
  id: test.key-source
  imports: {kind: test.key-kind}
  value: {kind: record, fields: [{name: kind, type: {use: kind}}, {name: name, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: kind, path: [Root, Kind]}, {field: name, path: [Root, Name]}]}
    yaml: {kind: mapping, fields: [{field: kind, key: Kind}, {field: name, key: Name}]}
  contributions: [{index: test.keys, key: {record: {kind: {field: kind}, name: {field: name}}}, value: {field: name}}]
- kind: fragment
  id: test.key-fragment
  imports: {kind: test.key-kind}
  inputs:
    keys: {type: {kind: index, key: {kind: record, fields: [{name: kind, type: {use: kind}}, {name: name, type: {kind: scalar, scalar: text}}]}, value: {kind: scalar, scalar: text}}}
  value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: name, path: [Root, Name]}]}
    yaml: {kind: mapping, fields: [{field: name, key: Name}]}
  constraints:
  - id: key-exists
    appliesTo: [yaml-validation]
    assert: {present: {lookup: {in: {input: keys}, key: {record: {kind: {literal: A}, name: {field: name}}}}}}
    diagnostic: {code: key.missing, severity: error, at: {field: name}, message: Нет ключа}
- kind: object
  id: test.key-consumer
  imports: {part: test.key-fragment}
  inputs: {keys: {index: test.keys}}
  value: {kind: record, fields: []}
  representations: {xml: {kind: record, fields: []}, yaml: {kind: mapping, fields: []}}
  compose: [{use: part, bind: {keys: {input: keys}}}]
"#;
    let generated = compile(&[SourceFile {
        path: "enum-index-binding.yaml",
        bytes: source.as_bytes(),
    }])
    .unwrap();
    run_generated(
        generated,
        "enum-index-binding-contract",
        r#"include!("generated.rs");
fn main() {
 let generation=core::facts::Generation(1);
 let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:10,bytes:1000},rows:10});
 assert!(contribute_file(entry_id("test.key-source").unwrap(),Direction::XmlToYaml,b"<Root><Kind>A</Kind><Name>keep</Name></Root>",&PreparedInputs::default(),&mut builder).is_empty());
 let entry=entry_id("test.key-consumer").unwrap();
 let inputs=prepare_fact_inputs(entry,std::sync::Arc::new(builder.finish()),generation,vec![]).unwrap();
 assert!(validate_file(entry,b"Name: keep",&inputs).is_empty());
 assert!(validate_file(entry,b"Name: absent",&inputs).iter().any(|issue|issue.code.as_deref()==Some("key.missing")));
}
"#,
    );
}

#[test]
fn scalar_fact_projection_reads_only_declared_yaml_fields() {
    let generated = compile(&[
        SourceFile {
            path: "code.yaml",
            bytes: CODE.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: OWNER.as_bytes(),
        },
    ])
    .unwrap();
    run_generated(
        generated,
        "yaml-scalar-fact-projection",
        r#"include!("generated.rs");
fn main() {
    let entry = entry_id("test.fact-owner").unwrap();
    let inputs = PreparedInputs::default();
    let source = b"Other: {Nested: [1, 2]}\nCode: a\nTitle: Keep\nMore: value";
    let snapshot = materialize_fact_source(entry, source, &inputs).unwrap();
    let text = std::str::from_utf8(&snapshot).unwrap();
    assert!(text.contains("Keep"));
    assert!(!text.contains("Other") && !text.contains("More"));
    let preserved = "Code: !xml/raw\n  $значение: a\n  $xml: {}\nTitle: Keep\nOther: sibling";
    let raw = materialize_fact_source(entry, preserved.as_bytes(), &inputs).unwrap();
    assert!(std::str::from_utf8(&raw).unwrap().contains("!xml/raw"));
    let generation = core::facts::Generation(1);
    let mut builder = fact_builder(generation, core::facts::prepared::FactBudget {
        text: core::facts::text::TextBudget { entries: 10, bytes: 1000 }, rows: 10,
    });
    assert!(contribute_file(entry, Direction::YamlToXml, source, &inputs, &mut builder).is_empty());
    assert_eq!(builder.finish().lookup(generation, fact_id("test.names").unwrap(), "a"), core::facts::FactState::Ready("Keep"));
    assert!(!validate_file(entry, source, &inputs).is_empty());
    assert!(validate_file(entry, b"Code: a\nTitle: Keep\nOther: sibling", &inputs).iter().any(|issue| issue.code.as_deref() == Some("yaml.unknown-field")));
    for invalid in [b"Code: [a]\nTitle: Keep".as_slice(), b"Code: a\nTitle: Keep\nOther: [".as_slice()] {
        assert!(materialize_fact_source(entry, invalid, &inputs).is_err());
    }
}

"#,
    );
}

#[test]
fn text_sequence_snapshots_project_declared_rows_without_an_index() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- format: nkdk-declarations/1
  kind: value
  id: test.list
  value: {kind: sequence, item: {kind: scalar, scalar: text}}
  representations:
    xml: {kind: element-sequence, path: [], item: {kind: text}}
    yaml: {kind: sequence, item: {kind: scalar, scalar: text}}
  presence:
  - target: self
    xml: {missing: {denotes: {sequence: []}}}
    yaml: {missing: {denotes: {sequence: []}}}
- format: nkdk-declarations/1
  kind: object
  id: test.owner
  imports: {list: test.list}
  value: {kind: record, fields: [{name: rows, type: {use: list}}]}
  representations:
    xml: {kind: record, fields: [{field: rows, path: [Root, Children, Item]}]}
    yaml: {kind: mapping, fields: [{field: rows, key: Rows}]}
  presence:
  - target: {field: rows}
    xml: {missing: {denotes: {sequence: []}}}
    yaml: {missing: {denotes: {sequence: []}}}
"#;
    for (label, source, root, child, key) in [
        ("first", source.to_owned(), "Root", "Item", "Rows"),
        (
            "renamed",
            source
                .replace("Root", "Document")
                .replace("Item", "Value")
                .replace("Rows", "Names"),
            "Document",
            "Value",
            "Names",
        ),
    ] {
        let generated = compile(&[SourceFile {
            path: "snapshot.yaml",
            bytes: source.as_bytes(),
        }])
        .unwrap();
        run_generated(
            generated,
            &format!("text-sequence-snapshot-{label}"),
            &format!(
                r#"include!("generated.rs");
fn main() {{
    let entry=entry_id("test.owner").unwrap();
    let inputs=prepare_inputs(entry,Vec::new()).unwrap();
    let xml=b"<{root} version=\"1\"><Sibling>not a row</Sibling><Children><{child}>B</{child}><Other>ignored</Other><{child}>A</{child}><{child}>B</{child}></Children></{root}>";
    let snapshot=snapshot_fact_source(entry,xml,&inputs).unwrap();
    assert_eq!(std::str::from_utf8(&snapshot).unwrap().trim(),"{key}:\n  - B\n  - A\n  - B");
    let empty=materialize_fact_source(entry,b"{key}: []",&inputs).unwrap();
    assert_eq!(std::str::from_utf8(&empty).unwrap().trim(),"{key}: []");
    for missing in [b"<{root}><Children/></{root}>".as_slice(), b"<{root}><Sibling>present</Sibling></{root}>".as_slice()] {{
        let snapshot=snapshot_fact_source(entry,missing,&inputs).unwrap();
        assert_eq!(std::str::from_utf8(&snapshot).unwrap().trim(),"{key}: []");
    }}
}}
"#
            ),
        );
    }
}
#[test]
fn separately_generated_packages_share_fact_ids_and_prepared_rows() {
    let second = OWNER
        .replace("test.fact-owner", "test.second-owner")
        .replace("test.names", "test.other-names");
    let consumer = include_str!("fixtures/fact-consumer.yaml").replace(
        "{not: {eq: [{var: found}, {literal: ''}]}}",
        "{eq: [{var: found}, {literal: First}]}",
    );
    let allocator = include_str!("fixtures/numbered-facts.yaml");
    // The left package owns no observation profile. It still schedules and binds
    // the right package's source without demanding its semantic output defaults.
    let observer = r#"format: nkdk-declarations/1
kind: object
id: test.observer
inputs:
  owner: {type: {kind: scalar, scalar: text}}
  numbers: {index: test.numbers}
value: {kind: record, fields: [{name: id, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: id, path: [Root], attribute: id}]}
  yaml: {kind: mapping, fields: [{field: id, key: Номер}]}
presence:
- target: {field: id}
  xml: {missing: {denotes: {require: {lookup: {in: {input: numbers}, key: {record: {owner: {input: owner}, name: {literal: ignored}}}}}}}}
contributions:
- index: test.numbers
  key: {record: {owner: {input: owner}}}
  reserve: {field: id}
"#;
    let files = [
        SourceFile {
            path: "allocate.yaml",
            bytes: allocator.as_bytes(),
        },
        SourceFile {
            path: "observe.yaml",
            bytes: observer.as_bytes(),
        },
        SourceFile {
            path: "code.yaml",
            bytes: CODE.as_bytes(),
        },
        SourceFile {
            path: "first.yaml",
            bytes: OWNER.as_bytes(),
        },
        SourceFile {
            path: "second.yaml",
            bytes: second.as_bytes(),
        },
        SourceFile {
            path: "consumer.yaml",
            bytes: consumer.as_bytes(),
        },
    ];
    let left =
        nkdk_rule_compiler::compile_partition(&files, |module| module.id == "test.fact-owner")
            .unwrap();
    let right = nkdk_rule_compiler::compile_partition(&files, |module| {
        matches!(
            module.id.as_str(),
            "test.second-owner" | "test.fact-consumer" | "test.numbering" | "test.observer"
        )
    })
    .unwrap();
    let body = |generated: &GeneratedSources, namespace: &str| {
        String::from_utf8(
            generated
                .files
                .iter()
                .find(|file| file.path == "generated.rs")
                .unwrap()
                .contents
                .clone(),
        )
        .unwrap()
        .replace("crate::", &format!("crate::{namespace}::"))
    };
    let reversed: Vec<_> = files
        .iter()
        .rev()
        .map(|file| SourceFile {
            path: file.path,
            bytes: file.bytes,
        })
        .collect();
    let reordered =
        nkdk_rule_compiler::compile_partition(&reversed, |module| module.id == "test.fact-owner")
            .unwrap();
    assert_eq!(body(&left, "left"), body(&reordered, "left"));
    let edited = format!("{second}\n# changed catalog revision\n");
    let changed: Vec<_> = files
        .iter()
        .map(|file| SourceFile {
            path: file.path,
            bytes: if file.path == "second.yaml" {
                edited.as_bytes()
            } else {
                file.bytes
            },
        })
        .collect();
    let changed =
        nkdk_rule_compiler::compile_partition(&changed, |module| module.id == "test.fact-owner")
            .unwrap();
    let signature = |generated: &GeneratedSources| {
        body(generated, "left")
            .lines()
            .find(|line| line.starts_with("pub fn catalog_signature()"))
            .unwrap()
            .to_owned()
    };
    assert_ne!(signature(&left), signature(&changed));
    // Compile the actual working facade against small disjoint catalogs. The
    // other package slots are empty, not repeated owners of the same entries.
    let mut facade = include_str!("../../compiled-rules/src/lib.rs").to_owned();
    for line in include_str!("../../compiled-rules/src/lib.rs").lines() {
        let Some(import) = line.strip_prefix("use nkdk_compiled_rules_") else {
            continue;
        };
        let (package, _) = import.split_once(" as ").unwrap();
        let target = match package {
            "base" => "left",
            "elements" => "right",
            _ => "empty",
        };
        facade = facade.replace(
            &format!("nkdk_compiled_rules_{package} "),
            &format!("crate::{target} "),
        );
    }
    facade = facade.replace(
        "pub use nkdk_compiled_rules_base::*",
        "pub use crate::left::*",
    );
    let source = format!(
        "mod left {{ {} }}\nmod right {{ {} }}\nmod empty {{ pub use crate::right::*; pub fn contains_entry(_:EntryId)->bool{{false}} pub fn exported_entries()-> &'static [(&'static str,EntryId)]{{&[]}} }}\nmod facade {{\n{facade}\n}}",
        body(&left, "left"),
        body(&right, "right")
    );
    let mut combined = left;
    combined
        .files
        .iter_mut()
        .find(|file| file.path == "generated.rs")
        .unwrap()
        .contents = source.into_bytes();
    run_generated(
        combined,
        "shared-partition-facts",
        r#"include!("generated.rs");
fn main() {
    assert_eq!(left::catalog_signature(),right::catalog_signature());
    assert_eq!(left::fact_names(),right::fact_names());
    assert_eq!(left::fact_id("test.names"),right::fact_id("test.names"));
    assert_eq!(left::fact_id("test.other-names"),right::fact_id("test.other-names"));
    assert!(left::entry_id("test.second-owner").is_none());
    assert!(right::entry_id("test.fact-owner").is_none());
    assert!(left::contains_entry(left::entry_id("test.fact-owner").unwrap()));
    assert!(!left::contains_entry(right::entry_id("test.second-owner").unwrap()));
    assert!(!right::contains_entry(nkdk_conversion_core::EntryId(u32::MAX)));
    assert_ne!(left::entry_id("test.fact-owner").unwrap().0,right::entry_id("test.second-owner").unwrap().0);
    let generation=nkdk_conversion_core::facts::Generation(1);
    let mut builder=left::fact_builder(generation,nkdk_conversion_core::facts::prepared::FactBudget {
        rows:10,text:nkdk_conversion_core::facts::text::TextBudget {entries:10,bytes:1000}});
    type Contribute=fn(nkdk_conversion_core::EntryId,nkdk_conversion_core::Direction,
        &[u8],&nkdk_conversion_core::PreparedInputs,
        &mut nkdk_conversion_core::facts::prepared::TextFactsBuilder)
        ->Vec<nkdk_conversion_core::RuntimeDiagnostic>;
    for (entry,contribute,title) in [
        (left::entry_id("test.fact-owner").unwrap(),left::contribute_file as Contribute,"First"),
        (right::entry_id("test.second-owner").unwrap(),right::contribute_file as Contribute,"Second"),
    ] {
        let xml=format!("<Root><Code>a</Code><Title>{title}</Title></Root>");
        let errors=contribute(entry,nkdk_conversion_core::Direction::XmlToYaml,
            xml.as_bytes(),&nkdk_conversion_core::PreparedInputs::default(),&mut builder);
        assert!(errors.is_empty(),"{errors:?}");
    }
    let facts=std::sync::Arc::new(builder.finish());
    let consumer=right::entry_id("test.fact-consumer").unwrap();
    let schedule=left::fact_plan(&[left::entry_id("test.fact-owner").unwrap(),
        right::entry_id("test.second-owner").unwrap()],&[consumer],100).unwrap();
    let consumer_step=nkdk_conversion_core::facts::dependencies::StepId(2 + left::fact_names().len() as u32);
    let order=schedule.order();
    assert!(order.iter().position(|step|step.0==0).unwrap()
        < order.iter().position(|step|*step==consumer_step).unwrap());
    use nkdk_conversion_core::{Direction, facts::preparation::{Catalog, Source, SourceKind}};
    let observe=right::entry_id("test.observer").unwrap();
    let headers=[(observe,Direction::XmlToYaml,SourceKind::AttributeReservations{max_depth:16})];
    let plan=left::fact_plan_materials(&headers,&[],100).expect("a sibling profile has no semantic self-cycle");
    assert_eq!(plan.order(),right::fact_plan_materials(&headers,&[],100).unwrap().order());
    let source=Source{entry:observe,direction:Direction::XmlToYaml,bytes:b"<Root id='1'><Opaque id='2'/></Root>",
        inputs:left::prepare_inputs(observe,vec![("owner".into(),nkdk_conversion_core::InputValue::Text("form".into()))]).unwrap()};
    let bound=<left::FactCatalog as Catalog>::bind_attributes(&source,facts.clone(),generation).unwrap();
    let source=Source{inputs:source.inputs.with_indexes(bound).unwrap(),..source};
    let mut observed=left::fact_builder(generation,nkdk_conversion_core::facts::prepared::FactBudget {
        rows:10,text:nkdk_conversion_core::facts::text::TextBudget {entries:10,bytes:1000}});
    assert!(<right::FactCatalog as Catalog>::reserve_attributes(&source,&mut observed,16).is_empty());
    let number=left::fact_id("test.numbers").unwrap();
    observed.request_number(number,&["new","form"],1).unwrap();
    assert_eq!(observed.finish().lookup_parts(generation,number,&["new","form"]),nkdk_conversion_core::facts::FactState::Ready("3"));
    let facade_inputs=<facade::FactCatalog as Catalog>::bind_attributes(&source,facts.clone(),generation).unwrap();
    let source=Source{inputs:source.inputs.with_indexes(facade_inputs).unwrap(),..source};
    let mut observed=facade::fact_builder(generation,nkdk_conversion_core::facts::prepared::FactBudget {
        rows:10,text:nkdk_conversion_core::facts::text::TextBudget {entries:10,bytes:1000}});
    let errors=<facade::FactCatalog as Catalog>::reserve_attributes(&source,&mut observed,16);
    assert!(errors.is_empty(),"facade must dispatch to the owning package: {errors:?}");
    observed.request_number(number,&["new","form"],1).unwrap();
    assert_eq!(observed.finish().lookup_parts(generation,number,&["new","form"]),nkdk_conversion_core::facts::FactState::Ready("3"));

    let budget=nkdk_conversion_core::xml::attribute_scan::SnapshotBudget::default();
    let snapshot=facade::snapshot_attribute_source(observe,nkdk_conversion_core::xml::attribute_scan::InContext{
        source:nkdk_conversion_core::xml::DocumentSource(b"<Unknown id='1'><Child id='2'/></Unknown>"),ancestors:&[("","Root")]
    },16,budget).unwrap();
    let mut restored=facade::fact_builder(generation,nkdk_conversion_core::facts::prepared::FactBudget{rows:10,text:nkdk_conversion_core::facts::text::TextBudget{entries:10,bytes:1000}});
    let reopened=Source{entry:observe,direction:Direction::YamlToXml,bytes:&snapshot,inputs:right::prepare_inputs(observe,vec![("owner".into(),nkdk_conversion_core::InputValue::Text("form".into()))]).unwrap()};
    let errors=<facade::FactCatalog as Catalog>::reserve_attribute_snapshot(&reopened,&mut restored,16,budget);
    assert!(errors.is_empty(),"{errors:?}");
    restored.request_number(number,&["new","form"],1).unwrap();
    assert_eq!(restored.finish().lookup_parts(generation,number,&["new","form"]),nkdk_conversion_core::facts::FactState::Ready("3"));
    assert_eq!(left::input_names(consumer),right::input_names(consumer));
    let inputs=left::prepare_fact_inputs(consumer,facts.clone(),generation,vec![]).unwrap();
    assert!(left::document_paths(consumer).unwrap().is_empty());
    assert!(right::validate_file(consumer,b"Target: a",&inputs).is_empty());
    assert!(right::validate_file(consumer,b"Target: missing",&inputs).iter()
        .any(|issue|issue.code.as_deref()==Some("target.missing")));
    for (index,expected) in [(left::fact_id("test.names").unwrap(),"First"),
        (right::fact_id("test.other-names").unwrap(),"Second")] {
        assert_eq!(facts.lookup(generation,index,"a"),nkdk_conversion_core::facts::FactState::Ready(expected));
    }
}
"#,
    );
}

#[test]
fn pattern_choice_exposes_semantic_slots_to_a_dependent_field() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.slot-pattern
  value: {kind: record, fields: [{name: label, type: {kind: scalar, scalar: text}}, {name: domain, type: {kind: scalar, scalar: text}}, {name: count, type: {kind: scalar, scalar: number, profile: decimal}}]}
  representations:
    xml: {kind: text-pattern, parts: [{field: domain}, {literal: ':'}, {field: label}, {literal: ':'}, {field: count}]}
    yaml: {kind: text-pattern, parts: [{field: label}, {literal: '@'}, {field: domain}, {literal: '#'}, {field: count}]}
- kind: value
  id: test.slot-choice
  imports: {pattern: test.slot-pattern}
  value: {kind: choice, variants: [{name: plain, type: {use: pattern}}]}
  representations:
    xml: {kind: choice, fallback: plain}
    yaml: {kind: choice, variants: [{variant: plain, form: scalar, tag: запись}]}
- kind: object
  id: test.slot-owner
  imports: {choice: test.slot-choice}
  value: {kind: record, fields: [{name: chosen, type: {use: choice}}, {name: derived, type: {kind: scalar, scalar: text}}, {name: quantity, type: {kind: scalar, scalar: number, profile: decimal}}]}
  representations:
    xml: {kind: record, fields: [{field: chosen, path: [Root, Chosen]}, {field: derived, path: [Root, Derived]}, {field: quantity, path: [Root, Quantity]}]}
    yaml: {kind: mapping, fields: [{field: chosen, key: Chosen}, {field: derived, key: Derived}, {field: quantity, key: Quantity}]}
  presence:
  - target: {field: derived}
    yaml: {missing: {denotes: {get: {of: {variantValue: {value: {field: chosen}, variant: plain}}, field: label}}}}
  - target: {field: quantity}
    yaml: {missing: {denotes: {get: {of: {variantValue: {value: {field: chosen}, variant: plain}}, field: count}}}}
"#;
    let generated = nkdk_rule_compiler::compile_exporting(
        &[SourceFile {
            path: "pattern-choice-slots.yaml",
            bytes: source.as_bytes(),
        }],
        |module| module.id == "test.slot-owner",
    )
    .unwrap();
    run_generated(
        generated,
        "pattern-choice-slots",
        r#"include!("generated.rs");
fn main(){
    let entry=entry_id("test.slot-owner").unwrap();
    let inputs=PreparedInputs::default();
    for (label,domain,count) in [("first","local","7"),("renamed","other","9007199254740993")] {
        let yaml=format!("Chosen: !запись {label}@{domain}#{count}");
        let reverse=convert_file(entry,Direction::YamlToXml,yaml.as_bytes(),&inputs).unwrap();
        let xml=format!("<Root><Chosen>{domain}:{label}:{count}</Chosen><Derived>{label}</Derived><Quantity>{count}</Quantity></Root>");
        core::proof::verify(xml.as_bytes(),&reverse.bytes,|_|false).unwrap();
    }
}
"#,
    );
}

#[test]
fn retained_scalar_object_projects_without_publishing_an_index() {
    let source = OWNER.split("contributions:").next().unwrap().replace(
        "    kind: record\n    fields:",
        "    kind: with-attributes\n    attributes: [{name: version, value: {text: '1'}}]\n    content:\n      kind: record\n      fields:",
    ).replace("    - {field:", "      - {field:");
    let generated = compile(&[
        SourceFile {
            path: "code.yaml",
            bytes: CODE.as_bytes(),
        },
        SourceFile {
            path: "source.yaml",
            bytes: source.as_bytes(),
        },
    ])
    .unwrap();
    run_generated(
        generated,
        "retained-object-without-index",
        r#"include!("generated.rs");
fn main() {
    let entry=entry_id("test.fact-owner").unwrap();
    let inputs=PreparedInputs::default();
    let xml=b"<Root><Unrelated><Nested>keep elsewhere</Nested></Unrelated><Code>a</Code><Title>Keep</Title></Root>";
    let snapshot=snapshot_fact_source(entry,xml,&inputs).unwrap();
    let yaml=std::str::from_utf8(&snapshot).unwrap();
    assert!(yaml.contains("Title: Keep") && !yaml.contains("Unrelated"),"{yaml}");
    let current=materialize_fact_source(entry,b"Code: a\nTitle: Changed\nUnrelated: ignored",&inputs).unwrap();
    assert!(std::str::from_utf8(&current).unwrap().contains("Title: Changed"));
    assert!(convert_file(entry,Direction::XmlToYaml,xml,&inputs).is_err());
    let issues=convert_file(entry,Direction::YamlToXml,b"Code: a\nTitle: Keep\nUnrelated: rejected",&inputs).unwrap_err();
    assert!(issues.iter().any(|issue|issue.code.as_deref()==Some("yaml.unknown-field")));
    for root in ["<Root version=\"2\">", "<Root>", "<Root version=\"1\" extra=\"kept\">"] {
        let xml=format!("{root}<Code>a</Code><Title>Keep</Title></Root>");
        let snapshot=snapshot_fact_source(entry,xml.as_bytes(),&inputs).unwrap();
        assert_eq!(std::str::from_utf8(&snapshot).unwrap(), "Code: a\nTitle: Keep");
        if root.contains("version=\"2\"") {
            let errors=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap_err();
            assert!(errors.iter().any(|error| error.code.as_deref()==Some("xml.attribute-value")));
        }
    }
    let invalid=b"<Root version=\"2\"><Code>!</Code><Title>Keep</Title></Root>";
    let invalid_snapshot=snapshot_fact_source(entry,invalid,&inputs).unwrap();
    assert!(std::str::from_utf8(&invalid_snapshot).unwrap().contains("!xml/invalid"), "{}",String::from_utf8_lossy(&invalid_snapshot));
    assert!(contribution_indexes(entry).is_empty());
}
"#,
    );
}

#[test]
fn retained_source_keeps_values_shortened_by_its_own_index() {
    let source = OWNER.replace(
        "imports: {code: common.project-code}",
        "imports: {code: common.project-code}\ninputs: {names: {index: test.names}}",
    ) + r#"
presence:
- target: {field: title}
  yaml:
    missing: {denotes: {lookup: {in: {input: names}, key: {field: code}}}}
    omitWhen:
      match:
        value: {lookup: {in: {input: names}, key: {field: code}}}
        present: {as: found, then: {eq: [{field: title}, {var: found}]}}
        absent: {literal: false}
"#;
    let foreign = source
        .replace("id: test.fact-owner", "id: test.foreign-owner")
        .replace(
            "contributions:\n- index: test.names",
            "contributions:\n- index: test.foreign",
        );
    let generated = compile(&[
        SourceFile {
            path: "code.yaml",
            bytes: CODE.as_bytes(),
        },
        SourceFile {
            path: "source.yaml",
            bytes: source.as_bytes(),
        },
        SourceFile {
            path: "foreign.yaml",
            bytes: foreign.as_bytes(),
        },
    ])
    .unwrap();
    run_generated(
        generated,
        "retained-source-own-index",
        r#"include!("generated.rs");
fn budget()->core::facts::prepared::FactBudget {core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:10,bytes:1000},rows:10}}
fn main(){
 let entry=entry_id("test.fact-owner").unwrap();
 let xml=b"<Root><Code>a</Code><Title>Keep</Title></Root>";
 let bare=prepare_inputs(entry,vec![]).unwrap();
 let snapshot=snapshot_fact_source(entry,xml,&bare).unwrap();
 assert_eq!(std::str::from_utf8(&snapshot).unwrap(),"Code: a\nTitle: Keep");
 let generation=core::facts::Generation(27);
 let empty=std::sync::Arc::new(fact_builder(generation,budget()).finish());
 let source_inputs=prepare_fact_inputs(entry,empty,generation,vec![]).unwrap();
 let mut builder=fact_builder(generation,budget());
 assert!(contribute_file(entry,Direction::YamlToXml,&snapshot,&source_inputs,&mut builder).is_empty());
 let rebuilt=std::sync::Arc::new(builder.finish());
 let foreign=entry_id("test.foreign-owner").unwrap();
 let foreign_bare=prepare_inputs(foreign,vec![]).unwrap();
 assert_eq!(snapshot_fact_source(foreign,xml,&foreign_bare).unwrap_err().code.as_deref(),Some("input.not-ready"));
 let foreign_inputs=prepare_fact_inputs(foreign,rebuilt.clone(),generation,vec![]).unwrap();
 assert_eq!(std::str::from_utf8(&snapshot_fact_source(foreign,xml,&foreign_inputs).unwrap()).unwrap(),"Code: a","external indexes must retain their meaning");
 let inputs=prepare_fact_inputs(entry,rebuilt,generation,vec![]).unwrap();
 let compact=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
 assert_eq!(std::str::from_utf8(&compact.bytes).unwrap(),"Code: a");
 assert_eq!(snapshot_fact_source(entry,xml,&inputs).unwrap(),snapshot);
 assert_eq!(materialize_fact_source(entry,&snapshot,&inputs).unwrap(),snapshot);
 assert_eq!(materialize_fact_source(entry,&compact.bytes,&inputs).unwrap(),snapshot);
 let headers=||vec![core::facts::preparation::MaterialSourceHeader{source:core::facts::preparation::SourceHeader{entry,direction:Direction::YamlToXml,inputs:prepare_inputs(entry,vec![]).unwrap()},kind:core::facts::preparation::SourceKind::Snapshot}];
 let prepared=core::facts::preparation::prepare_streaming_materials::<FactCatalog>(headers(),&[entry],core::facts::Generation(28),budget(),20,|_,_|Ok(core::facts::preparation::LoadedSource{bytes:snapshot.clone(),documents:vec![]})).unwrap();
 let independent=prepare_fact_inputs(entry,prepared.facts,core::facts::Generation(28),vec![]).unwrap();
 let restored=convert_file(entry,Direction::YamlToXml,&compact.bytes,&independent).unwrap();
 core::proof::verify(xml,&restored.bytes,|_|false).unwrap();
 let mut ordinary=headers();ordinary[0].kind=core::facts::preparation::SourceKind::Ordinary;
 assert!(core::facts::preparation::prepare_streaming_materials::<FactCatalog>(ordinary,&[entry],core::facts::Generation(28),budget(),20,|_,_|panic!("a cycle must fail before loading")).is_err());
 let mut mixed=headers();mixed[0].source.entry=foreign;mixed[0].source.inputs=prepare_inputs(foreign,vec![]).unwrap();
 mixed.push(core::facts::preparation::MaterialSourceHeader{source:core::facts::preparation::SourceHeader{entry,direction:Direction::XmlToYaml,inputs:prepare_inputs(entry,vec![]).unwrap()},kind:core::facts::preparation::SourceKind::Ordinary});
 let mut order=Vec::new();
 let prepared=core::facts::preparation::prepare_streaming_materials::<FactCatalog>(mixed,&[foreign],core::facts::Generation(29),budget(),20,|slot,_|{order.push(slot);Ok(core::facts::preparation::LoadedSource{bytes:if slot==0 {b"Code: a".to_vec()}else{xml.to_vec()},documents:vec![]})}).unwrap();
 assert_eq!(order,[1,0],"snapshot must retain external index dependencies");
 assert_eq!(prepared.facts.lookup(core::facts::Generation(29),fact_id("test.foreign").unwrap(),"a"),core::facts::FactState::Ready("Keep"));
 let mut missing_external=headers();missing_external[0].source.entry=foreign;missing_external[0].source.inputs=prepare_inputs(foreign,vec![]).unwrap();
 assert!(core::facts::preparation::prepare_streaming_materials::<FactCatalog>(missing_external,&[foreign],core::facts::Generation(30),budget(),20,|_,_|Ok(core::facts::preparation::LoadedSource{bytes:b"Code: a".to_vec(),documents:vec![]})).is_err());
 assert!(core::facts::preparation::prepare_streaming_materials::<FactCatalog>(headers(),&[entry],core::facts::Generation(30),budget(),20,|_,_|Ok(core::facts::preparation::LoadedSource{bytes:b"Code: a".to_vec(),documents:vec![]})).is_err(),"a retained source must not invent its missing contribution");
 let mut invalid=headers();invalid[0].source.direction=Direction::XmlToYaml;
 let errors=core::facts::preparation::prepare_streaming_materials::<FactCatalog>(invalid,&[entry],core::facts::Generation(30),budget(),20,|_,_|panic!("reject format before loading")).err().unwrap();
 assert_eq!(errors[0].code.as_deref(),Some("fact.snapshot-direction"));
 let restored=convert_file(entry,Direction::YamlToXml,&compact.bytes,&inputs).unwrap();
 core::proof::verify(xml,&restored.bytes,|_|false).unwrap();
}
"#,
    );
}

#[test]
fn collection_snapshot_materializes_from_a_full_primary_mapping() {
    let owner = include_str!("fixtures/fact-rows-owner.yaml");
    let generated = compile(&[
        SourceFile {
            path: "row.yaml",
            bytes: NESTED_ROW.as_bytes(),
        },
        SourceFile {
            path: "rows.yaml",
            bytes: NESTED_ROWS.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: owner.as_bytes(),
        },
    ])
    .unwrap();
    run_generated(
        generated,
        "collection-current-primary-snapshot",
        r#"include!("generated.rs");
fn main() {
    let entry=entry_id("test.fact-rows").unwrap();
    let inputs=PreparedInputs::default();
    let primary=b"Name: Owner\nRows:\n  - Code: one\n    Title: First\nUnrelated: keep elsewhere";
    let snapshot=materialize_fact_source(entry,primary,&inputs).unwrap();
    let text=std::str::from_utf8(&snapshot).unwrap();
    assert!(text.contains("Title: First")&&!text.contains("Unrelated")&&!text.contains("Name: Owner"),"{text}");
    let mut builder=fact_builder(core::facts::Generation(1),core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:100,bytes:10000},rows:100});
    assert!(contribute_file(entry,Direction::YamlToXml,&snapshot,&inputs,&mut builder).is_empty());
    assert_eq!(builder.finish().lookup(core::facts::Generation(1),fact_id("test.names").unwrap(),"one"),core::facts::FactState::Ready("First"));
    assert!(convert_file(entry,Direction::YamlToXml,primary,&inputs).is_err());
}
"#,
    );
}

#[test]
fn computed_file_envelope_converts_real_predefined_data_with_nested_identity_context() {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .unwrap();
    let mut sources = Vec::new();
    for name in [
        "common/boolean",
        "probes/predefined-account-items",
        "probes/predefined-account-file-items",
        "probes/predefined-account-file",
        "common/predefined-code",
        "probes/predefined-catalog-items",
        "probes/predefined-catalog-file-items",
        "probes/predefined-catalog-file",
        "probes/predefined-characteristic-file-items",
        "probes/predefined-characteristic-file",
        "probes/predefined-calculation-item",
        "probes/predefined-calculation-links",
        "common/metadata-value-path",
        "common/metadata-name",
        "common/metadata-path-lexicons",
        "probes/predefined-calculation-file-items",
        "probes/predefined-calculation-file",
        "fragments/predefined-catalog-file.generated",
        "fragments/predefined-characteristic-file.generated",
        "fragments/predefined-account-file.generated",
        "fragments/predefined-calculation-file.generated",
        "probes/predefined-catalog-owner.generated",
        "probes/predefined-characteristic-owner.generated",
        "probes/predefined-account-owner.generated",
        "probes/predefined-calculation-owner.generated",
    ] {
        sources.push((
            name,
            std::fs::read(root.join("declarations").join(format!("{name}.yaml"))).unwrap(),
        ));
    }
    for name in TYPE_DESCRIPTION_FILES {
        sources.push((
            name,
            std::fs::read(
                root.join("declarations/common")
                    .join(format!("{name}.yaml")),
            )
            .unwrap(),
        ));
    }
    let mut modules = sources
        .iter()
        .flat_map(|(path, bytes)| {
            nkdk_rule_compiler::parse_many(SourceFile { path, bytes }).unwrap()
        })
        .collect::<Vec<_>>();
    let enumeration =
        std::fs::read(root.join("declarations/common/system-enumerations.yaml")).unwrap();
    modules.extend(
        nkdk_rule_compiler::parse_many(SourceFile {
            path: "common/system-enumerations.yaml",
            bytes: &enumeration,
        })
        .unwrap()
        .into_iter()
        .filter(|module| module.id == "system.AccountType"),
    );
    let program = link(&modules).expect("the recursive file retains caller context");
    let generated =
        nkdk_rule_compiler::generate(&program).expect("the full file declarations compile");
    let repository = root.parent().unwrap();
    let main = r##"include!("generated.rs");
fn main() {
 let source=include_str!(@CHARACTERISTIC_REFERENCE@);
 let child_start=source.find("<Item id=\"8592e175-aee4-40f9-849c-f808cdc149ce\">").unwrap();
 let child_end=child_start+source[child_start..].find("</Item>").unwrap()+"</Item>".len();
 let child=&source[child_start..child_end];
 let nested=source.replacen(child,"",1).replacen("<IsFolder>true</IsFolder>",&format!("<IsFolder>true</IsFolder><ChildItems>{child}</ChildItems>"),1);
 let account_expected="СчетПоУмолчанию:\n  Код: .\n  Наименование: Счет по умолчанию\n  Забалансовый: Ложь\n  Порядок: \"\"\n  ПризнакиУчета:\n    ChartOfAccounts.ПланСчетовВсеСвойства.AccountingFlag.ПризнакУчетаВсеСвойства:\n      Значение: Ложь\n    ChartOfAccounts.ПланСчетовВсеСвойства.AccountingFlag.ПризнакУчетаПоУмолчанию:\n      Значение: Ложь\nСчетВсеСвойства:\n  Код: \"01.01\"\n  Наименование: Наименование\n  ВидСчета: Активный\n  Забалансовый: Истина\n  Порядок: \"01.02\"\n  ПризнакиУчета:\n    ChartOfAccounts.ПланСчетовВсеСвойства.AccountingFlag.ПризнакУчетаВсеСвойства:\n      Значение: Истина\n    ChartOfAccounts.ПланСчетовВсеСвойства.AccountingFlag.ПризнакУчетаПоУмолчанию:\n      Значение: Истина\n  ВидыСубконто:\n    ChartOfCharacteristicTypes.ВидыСубконто.СубкнтоОдно:\n      Оборотный: Истина\n      ПризнакиУчета:\n        ChartOfAccounts.ПланСчетовВсеСвойства.ExtDimensionAccountingFlag.ПризнакУчетаСубконтоВсеСвойства:\n          Значение: Ложь\n        ChartOfAccounts.ПланСчетовВсеСвойства.ExtDimensionAccountingFlag.ПризнакУчетаСубконтоПоУмолчанию:\n          Значение: Ложь\n    ChartOfCharacteristicTypes.ВидыСубконто.СубконтоДругое:\n      ПризнакиУчета:\n        ChartOfAccounts.ПланСчетовВсеСвойства.ExtDimensionAccountingFlag.ПризнакУчетаСубконтоВсеСвойства:\n          Значение: Истина\n        ChartOfAccounts.ПланСчетовВсеСвойства.ExtDimensionAccountingFlag.ПризнакУчетаСубконтоПоУмолчанию:\n          Значение: Истина";
 let account_source=include_str!(@ACCOUNT@);
 let child_start=account_source.find("<Item id=\"ec6054b4-fe6f-463d-b2d6-085dd7c5d5be\">").unwrap();
 let child_end=child_start+account_source[child_start..].find("</Item>").unwrap()+"</Item>".len();
 let account_child=&account_source[child_start..child_end];
 let nested_account=account_source.replacen(account_child,"",1).replacen("</Item>",&format!("<ChildItems>{account_child}</ChildItems></Item>"),1);
 let (parent_expected,child_expected)=account_expected.split_once("\nСчетВсеСвойства:").unwrap();
 let nested_account_expected=format!("{parent_expected}\n  Элементы:\n    {}",format!("СчетВсеСвойства:{child_expected}").replace('\n',"\n    "));
 for (entry_name,owner,xml,expected) in [
  ("migration.predefined-account-file","ПланСчетов.ПланСчетовВсеСвойства",include_bytes!(@ACCOUNT@).as_slice(),account_expected),
  ("migration.predefined-account-file","ПланСчетов.ПланСчетовВсеСвойства",nested_account.as_bytes(),nested_account_expected.as_str()),

  ("migration.predefined-calculation-file","ПланВидовРасчета.ПланРасчетаВсеСвойства",include_bytes!(@CALCULATION@).as_slice(),"Предопределенное2:\n  Код: 0\n  Наименование: Предопределенное2\n  ПериодДействияБазовый: Ложь\n  Базовые:\n    - ПланВидовРасчета.ПланРасчетаВсеСвойства.ПредопредленноеВсе\n  Ведущие:\n    - ПланВидовРасчета.ПланРасчетаВсеСвойства.ПредопредленноеВсе\n  Вытесняющие:\n    - ПланВидовРасчета.ПланРасчетаВсеСвойства.ПредопредленноеВсе\nПоУмолчанию:\n  Код: 0\n  Наименование: По умолчанию\n  ПериодДействияБазовый: Ложь\nПредопредленноеВсе:\n  Код: 1\n  Наименование: Наименование\n  ПериодДействияБазовый: Истина"),
  ("migration.predefined-characteristic-file","ПланВидовХарактеристик.Вложенные",nested.as_bytes(),"ГруппаПоУмолчанию:\n  Код: КодГруппы\n  Наименование: Группа по умолчанию\n  ЭтоГруппа: Истина\n  Элементы:\n    ПредопределенноеВсеСвойства:\n      Код: Код\n      Наименование: Наименование\n      ТипЗначения: Справочник.ЗначенияХарактеристик\nГруппаВсеСвойства:\n  Код: КодГруппы\n  Наименование: Наименование\n  ЭтоГруппа: Истина\nПредопределенноеПоУмолчанию:\n  Код: КодПУ\n  Наименование: Предопределенное по умолчанию\n  ТипЗначения: Справочник.ЗначенияХарактеристик"),
  ("migration.predefined-characteristic-file","ПланВидовХарактеристик.ВидыСубконто",include_bytes!(@CHARACTERISTIC_STRING@).as_slice(),"СубкнтоОдно:\n  Код: \"000000001\"\n  Наименование: Субкнто1\n  ТипЗначения: Строка(10)\nСубконтоДругое:\n  Код: \"000000002\"\n  Наименование: Субконто другое\n  ТипЗначения: Строка(10)"),
  ("migration.predefined-characteristic-file","ПланВидовХарактеристик.ВсеСвойства",include_bytes!(@CHARACTERISTIC_REFERENCE@).as_slice(),"ГруппаПоУмолчанию:\n  Код: КодГруппы\n  Наименование: Группа по умолчанию\n  ЭтоГруппа: Истина\nПредопределенноеВсеСвойства:\n  Код: Код\n  Наименование: Наименование\n  ТипЗначения: Справочник.ЗначенияХарактеристик\nГруппаВсеСвойства:\n  Код: КодГруппы\n  Наименование: Наименование\n  ЭтоГруппа: Истина\nПредопределенноеПоУмолчанию:\n  Код: КодПУ\n  Наименование: Предопределенное по умолчанию\n  ТипЗначения: Справочник.ЗначенияХарактеристик"),
  ("migration.predefined-catalog-file","Справочник.Реквизит",include_bytes!(@ATTRIBUTE@).as_slice(),"ПредопредленноеЗначение:\n  Код: \"000000001\"\n  Наименование: Предопредленное значение"),
  ("migration.predefined-catalog-file","Справочник.ВсеОбъекты",include_bytes!(@ALL_OBJECTS@).as_slice(),"ПредопределенноеЗначение:\n  Код: \"000000001\"\n  Наименование: Предопределенное значение"),
  ("migration.predefined-catalog-file","Справочник.СПредопределенными",include_bytes!(@GROUPS@).as_slice(),"Группа2:\n  Код: \"000000004\"\n  Наименование: Группа 2\n  ЭтоГруппа: Истина\n  Элементы:\n    Предопределенный3:\n      Код: \"000000005\"\n      Наименование: Предопределенный 3\nГруппа:\n  Код: \"000000003\"\n  Наименование: Наименование\n  ЭтоГруппа: Истина\n  Элементы:\n    Предопределенный1:\n      Код: \"000000001\"\n      Наименование: Предопределенный1\nПредопределенный2:\n  Код: \"000000002\"\n  Наименование: Наименование"),

  ("migration.predefined-catalog-file","Справочник.Владелец",include_bytes!(@SIMPLE@).as_slice(),"ПредопределенноеЗначение:\n  Код: \"000000001\"\n  Наименование: Предопределенное значение"),
  ("migration.predefined-catalog-file","Справочник.Товары",include_bytes!(@NESTED@).as_slice(),"Группа:\n  Код: \"000000003\"\n  Наименование: Наименование\n  ЭтоГруппа: Истина\n  Элементы:\n    Предопределенный1:\n      Код: \"000000001\"\n      Наименование: Предопределенный1\nПредопределенный2:\n  Код: \"000000002\"\n  Наименование: Наименование"),
 ] {
  let entry=entry_id(entry_name).unwrap();
  let inputs={
   let generation=core::facts::Generation(7);
   let source_inputs=prepare_inputs(entry,vec![("owner".into(),InputValue::Text(owner.into()))]).unwrap();
   assert!(fact_source_input_bindings(entry,Direction::XmlToYaml).is_empty(),"XML preparation must not depend on its own produced index");
   assert_eq!(fact_source_input_bindings(entry,Direction::YamlToXml).len(),1,"YAML still needs the identity index to restore omitted UUIDs");
   let mut prepared=core::facts::preparation::prepare::<FactCatalog>(
    vec![core::facts::preparation::Source{entry,direction:Direction::XmlToYaml,bytes:xml,inputs:source_inputs}],
    &[entry],generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:100,bytes:10000},rows:50},100
   ).unwrap_or_else(|errors|panic!("{entry_name}: {errors:?}"));
   let input_bindings=fact_input_bindings(entry);
   assert_eq!(input_bindings.len(),1,"the file owner must bind its prepared identity index");
   assert_eq!(contribution_indexes(entry),&[fact_id("metadata.predefined-identities").unwrap()]);
   prepared.sources.pop().unwrap().inputs
  };
  let imported=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
  assert_eq!(std::str::from_utf8(&imported.bytes).unwrap(),expected);
  verify_candidate(entry,xml,expected.as_bytes(),&inputs).unwrap();
  let restored=convert_file(entry,Direction::YamlToXml,expected.as_bytes(),&inputs).unwrap();
  core::proof::verify_with_qnames(xml,&restored.bytes,|_|false,|_,name|name.namespace=="http://www.w3.org/2001/XMLSchema-instance" && name.local=="type",|path|path.last().is_some_and(|name|name.namespace=="http://v8.1c.ru/8.1/data/core" && matches!(name.local.as_str(),"Type"|"TypeSet"))).unwrap();
  // A separate export obtains UUIDs from retained YAML, never the import index.
  let retained_inputs=prepare_inputs(entry,vec![("owner".into(),InputValue::Text(owner.into()))]).unwrap();
  let retained=snapshot_fact_source(entry,xml,&retained_inputs).unwrap();
  assert!(std::str::from_utf8(&retained).unwrap().contains("Идентификатор:"),"{entry_name}: the source must keep its own UUIDs");
  let mut reads=0;
  let mut reopened=core::facts::preparation::prepare_streaming_materials::<FactCatalog>(
   vec![core::facts::preparation::MaterialSourceHeader{source:core::facts::preparation::SourceHeader{entry,direction:Direction::YamlToXml,inputs:retained_inputs},kind:core::facts::preparation::SourceKind::Snapshot}],
   &[entry],core::facts::Generation(8),core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:100,bytes:10000},rows:50},100,
   |_,_|{reads+=1;Ok(core::facts::preparation::LoadedSource{bytes:retained.clone(),documents:Vec::new()})}
  ).unwrap_or_else(|errors|panic!("{entry_name} retained source: {errors:?}"));
  assert_eq!(reads,1);
  let independent_inputs=reopened.sources.pop().unwrap().inputs;
  let independent=convert_file(entry,Direction::YamlToXml,expected.as_bytes(),&independent_inputs).unwrap();
  core::proof::verify_with_qnames(xml,&independent.bytes,|_|false,|_,name|name.namespace=="http://www.w3.org/2001/XMLSchema-instance" && name.local=="type",|path|path.last().is_some_and(|name|name.namespace=="http://v8.1c.ru/8.1/data/core" && matches!(name.local.as_str(),"Type"|"TypeSet"))).unwrap();
  let source=std::str::from_utf8(xml).unwrap();
  if entry_name=="migration.predefined-account-file" {
   let invalid=source.replacen("name=\"ChartOfCharacteristicTypes.","name=\"Catalog.",1);
   let imported=convert_file(entry,Direction::XmlToYaml,invalid.as_bytes(),&inputs).unwrap();
   let yaml=std::str::from_utf8(&imported.bytes).unwrap();
   assert!(yaml.contains("!xml"),"invalid characteristic target: {yaml}");
   assert!(yaml.contains("СчетПоУмолчанию"),"{yaml}");
   verify_candidate(entry,invalid.as_bytes(),&imported.bytes,&inputs).unwrap();
   for changed in [source.replacen(">false</Flag>",">oops</Flag>",1),source.replacen("<Flag ref=", "<Flag extra=\"retained\" ref=",1),source.replacen("<AccountType>ActivePassive</AccountType>","",1)] {
    let imported=convert_file(entry,Direction::XmlToYaml,changed.as_bytes(),&inputs).unwrap();
    let yaml=std::str::from_utf8(&imported.bytes).unwrap();
    assert!(yaml.contains("!xml"),"{yaml}");
    assert!(yaml.contains("СчетВсеСвойства"),"{yaml}");
    verify_candidate(entry,changed.as_bytes(),&imported.bytes,&inputs).unwrap();
   }
  }
  if entry_name=="migration.predefined-calculation-file" {
   let reference="<CalculationType>ChartOfCalculationTypes.ПланРасчетаВсеСвойства.ПредопредленноеВсе</CalculationType>";
   let repeated=source.replacen(reference,&format!("{reference}{reference}"),1);
   let imported=convert_file(entry,Direction::XmlToYaml,repeated.as_bytes(),&inputs).unwrap();
   let yaml=std::str::from_utf8(&imported.bytes).unwrap();
   assert!(!yaml.contains("!xml"),"repeated ordinary links: {yaml}");
   assert_eq!(yaml.matches("- ПланВидовРасчета.ПланРасчетаВсеСвойства.ПредопредленноеВсе").count(),4);
   verify_candidate(entry,repeated.as_bytes(),&imported.bytes,&inputs).unwrap();
   for changed in [source.replacen(reference,"<CalculationType>oops</CalculationType>",1),source.replacen(reference,"",1),source.replacen("<ActionPeriodIsBase>false</ActionPeriodIsBase>","",1),source.replacen("<ActionPeriodIsBase>true</ActionPeriodIsBase>","<ActionPeriodIsBase>oops</ActionPeriodIsBase>",1)] {
    let imported=convert_file(entry,Direction::XmlToYaml,changed.as_bytes(),&inputs).unwrap();
    let yaml=std::str::from_utf8(&imported.bytes).unwrap();
    assert!(yaml.contains("ПоУмолчанию:"),"{yaml}");
    assert!(yaml.contains("ПериодДействияБазовый: Ложь"),"{yaml}");
    verify_candidate(entry,changed.as_bytes(),&imported.bytes,&inputs).unwrap();
    let restored=convert_file(entry,Direction::YamlToXml,&imported.bytes,&inputs).unwrap();
    core::proof::verify_with_qnames(changed.as_bytes(),&restored.bytes,|_|false,|_,name|name.namespace=="http://www.w3.org/2001/XMLSchema-instance" && name.local=="type",|_|false).unwrap();
   }
   let reduced=expected.replacen("  ПериодДействияБазовый: Ложь\n","",1);
   let restored=convert_file(entry,Direction::YamlToXml,reduced.as_bytes(),&inputs).unwrap();
   core::proof::verify_with_qnames(xml,&restored.bytes,|_|false,|_,name|name.namespace=="http://www.w3.org/2001/XMLSchema-instance" && name.local=="type",|_|false).unwrap();
  }
  let (shell,boolean)=match entry_name {
   "migration.predefined-account-file" => ("ChartOfAccountsPredefinedItems","OffBalance"),
   "migration.predefined-catalog-file" => ("CatalogPredefinedItems","IsFolder"),
   "migration.predefined-calculation-file" => ("CalculationTypePredefinedItems","ActionPeriodIsBase"),
   _ => ("PlanOfCharacteristicKindPredefinedItems","IsFolder"),
  };
  for changed in [source.replace(shell,"OtherItems"),source.replace(&format!(" xsi:type=\"{shell}\""),""),source.replace("version=\"2.20\"","version=\"3.00\""),source.replace("version=\"2.20\"","version=\"2.20\" extra=\"retained\""),source.replacen(&format!("<{boolean}>false</{boolean}>"),&format!("<{boolean}>oops</{boolean}>"),1)] {
   let result=convert_file(entry,Direction::XmlToYaml,changed.as_bytes(),&inputs).unwrap_or_else(|errors|panic!("{changed}: {errors:?}"));
   let yaml=std::str::from_utf8(&result.bytes).unwrap();
   assert!(yaml.contains("!xml"),"{yaml}");
   assert!(yaml.contains("Код:"),"{yaml}");
   verify_candidate(entry,changed.as_bytes(),&result.bytes,&inputs).unwrap();
  }
 }
}
"##.replace("@SIMPLE@", &format!("{:?}",repository.join("e2e/fixtures/xml/cf/Catalogs/СправочникВладелец/Ext/Predefined.xml")))
.replace("@NESTED@", &format!("{:?}",repository.join("packages/rules/metadata/commonObjects/predefined/__fixtures__/full.xml")))
.replace("@ATTRIBUTE@", &format!("{:?}",repository.join("e2e/fixtures/xml/cf/Catalogs/СправочникРеквизит/Ext/Predefined.xml")))
.replace("@ALL_OBJECTS@", &format!("{:?}",repository.join("e2e/fixtures/xml/cf/Catalogs/СправочникCоВсемиОбъектами/Ext/Predefined.xml")))
.replace("@GROUPS@", &format!("{:?}",repository.join("e2e/fixtures/xml/cf/Catalogs/СправочникСПредопределенными/Ext/Predefined.xml")));
    let main = main.replace("@CHARACTERISTIC_STRING@", &format!("{:?}", repository.join("e2e/fixtures/xml/cf/ChartsOfCharacteristicTypes/ВидыСубконто/Ext/Predefined.xml")))
        .replace("@CHARACTERISTIC_REFERENCE@", &format!("{:?}", repository.join("e2e/fixtures/xml/cf/ChartsOfCharacteristicTypes/ПланВидовХарактеристикВсеСвойства/Ext/Predefined.xml")));
    let main = main.replace(
        "@ACCOUNT@",
        &format!(
            "{:?}",
            repository.join(
                "e2e/fixtures/xml/cf/ChartsOfAccounts/ПланСчетовВсеСвойства/Ext/Predefined.xml"
            )
        ),
    );
    let main = main.replace("@CALCULATION@", &format!("{:?}", repository.join("e2e/fixtures/xml/cf/ChartsOfCalculationTypes/ПланРасчетаВсеСвойства/Ext/Predefined.xml")));
    let owner_checks = r#"
 for (entry_name,relative) in [
  ("probe.predefined-catalog-owner","Catalogs/СправочникСПредопределенными"),
  ("probe.predefined-characteristic-owner","ChartsOfCharacteristicTypes/ВидыСубконто"),
  ("probe.predefined-account-owner","ChartsOfAccounts/ПланСчетовВсеСвойства"),
  ("probe.predefined-calculation-owner","ChartsOfCalculationTypes/ПланРасчетаВсеСвойства"),
 ] {
  let directory=std::path::Path::new(@BASE@).join(relative);
  let owner=std::fs::read(directory.with_extension("xml")).unwrap();
  let file=std::fs::read(directory.join("Ext/Predefined.xml")).unwrap();
  let entry=entry_id(entry_name).unwrap();
  let values=||{
   let mut values=vec![("component".into(),InputValue::Text("cf".into()))];
   if entry_name!="probe.predefined-catalog-owner" {
    values.push(("ownerName".into(),InputValue::Text(directory.file_name().unwrap().to_str().unwrap().into())));
   }
   values
  };
  let path=core::resources::RelativePath::new(["Ext","Predefined.xml"],4096).unwrap();
  let bare=prepare_inputs(entry,values()).unwrap().with_documents(vec![(path,file.clone())]).unwrap();
  let retained=snapshot_fact_source(entry,&owner,&bare).unwrap();
  let mut restored=core::facts::preparation::prepare_streaming_materials::<FactCatalog>(
   vec![core::facts::preparation::MaterialSourceHeader{source:core::facts::preparation::SourceHeader{entry,direction:Direction::YamlToXml,inputs:prepare_inputs(entry,values()).unwrap()},kind:core::facts::preparation::SourceKind::Snapshot}],
   &[entry],core::facts::Generation(21),core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:200,bytes:20000},rows:100},200,
   |_,_|Ok(core::facts::preparation::LoadedSource{bytes:retained.clone(),documents:Vec::new()})
  ).unwrap_or_else(|errors|panic!("{entry_name}: {errors:?}"));
  let inputs=restored.sources.pop().unwrap().inputs;
  let inputs=inputs.with_documents(vec![
   (core::resources::RelativePath::new(["Ext","Predefined.xml"],4096).unwrap(),file.clone())
  ]).unwrap();
  let imported=convert_file(entry,Direction::XmlToYaml,&owner,&inputs).unwrap();
  let export_inputs=prepare_fact_inputs(entry,restored.facts,core::facts::Generation(21),values()).unwrap();
  let exported=convert_file(entry,Direction::YamlToXml,&imported.bytes,&export_inputs).unwrap();
  core::proof::verify(&owner,&exported.bytes,|_|false).unwrap();
  assert_eq!(exported.documents.len(),1,"{entry_name}");
  core::proof::verify_with_qnames(&file,&exported.documents[0].1,|_|false,
   |_,name|name.namespace=="http://www.w3.org/2001/XMLSchema-instance" && name.local=="type",
   |path|path.last().is_some_and(|name|name.namespace=="http://v8.1c.ru/8.1/data/core" && matches!(name.local.as_str(),"Type"|"TypeSet"))).unwrap();
 }
"#.replace("@BASE@", &format!("{:?}", repository.join("e2e/fixtures/xml/cf")));
    let mut main = main;
    main.insert_str(main.rfind('}').unwrap(), &owner_checks);
    run_generated(generated, "predefined-catalog-file-contract", &main);
}

#[test]
fn recursive_record_retains_qname_text_at_each_depth() {
    let node = include_str!("fixtures/recursive-node.yaml")
        .replace(
            "imports: {children: common.nodes}",
            "imports: {children: common.nodes, qualified: common.qualified}",
        )
        .replace(
            "  - {name: name,",
            "  - {name: qualified, type: {use: qualified}}\n  - {name: name,",
        )
        .replace(
            "    - {field: name, path:",
            "    - {field: qualified, path: [Type]}\n    - {field: name, path:",
        )
        .replace(
            "    - {field: name, key:",
            "    - {field: qualified, key: Тип}\n    - {field: name, key:",
        );
    let generated = compile(&[
        SourceFile {
            path: "node.yaml",
            bytes: node.as_bytes(),
        },
        SourceFile {
            path: "nodes.yaml",
            bytes: include_bytes!("fixtures/recursive-nodes.yaml"),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: include_bytes!("fixtures/recursive-owner.yaml"),
        },
        SourceFile {
            path: "qualified.yaml",
            bytes: include_bytes!("fixtures/qname-common.yaml"),
        },
    ])
    .unwrap();
    run_generated(
        generated,
        "recursive-qname-context",
        r##"include!("generated.rs");
fn main() {
 let entry=entry_id("applied.tree").unwrap();
 let inputs=PreparedInputs::default();
 let xml=br#"<Root xmlns:t="urn:types"><Type>t:Outer</Type><Name>root</Name><Item><Type>t:Inner</Type><Name>child</Name><Item><Type>t:Leaf</Type><Name>leaf</Name></Item></Item></Root>"#;
 let result=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
 let yaml=std::str::from_utf8(&result.bytes).unwrap();
 assert!(!yaml.contains("!xml"),"{yaml}");
 for name in ["Outer","Inner","Leaf"] {assert!(yaml.contains(name),"{yaml}");}
 assert_eq!(yaml.matches("Namespace: urn:types").count(),3,"{yaml}");
 let restored=convert_file(entry,Direction::YamlToXml,&result.bytes,&inputs).unwrap();
 core::proof::verify_with_qnames(xml,&restored.bytes,|_|false,|_,_|false,|path|path.last().is_some_and(|name|name.local=="Type")).unwrap();
 verify_candidate(entry,xml,&result.bytes,&inputs).unwrap();
}
"##,
    );
}

#[test]
fn collection_record_with_text_and_attribute_reads_each_declared_slot() {
    let boolean = include_str!("../../../declarations/common/boolean.yaml");
    let body = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.text-attribute-row
  imports: {boolean: common.boolean}
  value: {kind: record, fields: [{name: value, type: {use: boolean}}, {name: key, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: value, path: []}, {field: key, path: [], attribute: key}]}
    yaml: {kind: mapping, fields: [{field: value, key: Value}, {field: key, key: Key}]}
- kind: value
  id: test.text-attribute-rows
  imports: {row: test.text-attribute-row}
  value: {kind: sequence, item: {use: row}}
  representations:
    xml: {kind: element-sequence, path: [Item], item: {kind: declared}}
    yaml: {kind: record-mapping, key: key}
- kind: object
  id: test.text-attribute-owner
  imports: {rows: test.text-attribute-rows}
  value: {kind: record, fields: [{name: rows, type: {use: rows}}]}
  representations:
    xml: {kind: record, fields: [{field: rows, path: [Root, Rows]}]}
    yaml: {kind: mapping, fields: [{field: rows, key: Rows}]}
"#;
    let generated = compile(&[
        SourceFile {
            path: "boolean.yaml",
            bytes: boolean.as_bytes(),
        },
        SourceFile {
            path: "text-attribute.yaml",
            bytes: body.as_bytes(),
        },
    ])
    .unwrap();
    run_generated(
        generated,
        "text-attribute-collection-contract",
        r#"include!("generated.rs");
fn main(){
 let entry=entry_id("test.text-attribute-owner").unwrap();
 let xml=b"<Root><Rows><Item key=\"A\">false</Item><Item key=\"B\">true</Item></Rows></Root>";
 let expected="Rows:\n  A:\n    Value: Ложь\n  B:\n    Value: Истина".as_bytes();
 let imported=convert_file(entry,Direction::XmlToYaml,xml,&PreparedInputs::default()).unwrap();
 assert_eq!(&imported.bytes,expected);
 verify_candidate(entry,xml,expected,&PreparedInputs::default()).unwrap();
 let restored=convert_file(entry,Direction::YamlToXml,expected,&PreparedInputs::default()).unwrap();
 core::proof::verify(xml,&restored.bytes,|_|false).unwrap();
}
"#,
    );
}

#[test]
fn semantic_tag_selects_a_whole_value_without_changing_its_shape() {
    let mut declarations = Vec::new();
    for (name, body, xml, yaml, plain) in [
        (
            "record",
            "{kind: record, fields: [{name: title, type: {kind: scalar, scalar: text}}]}",
            "{kind: record, fields: [{field: title, path: [Name]}]}",
            "{kind: mapping, fields: [{field: title, key: Name}]}",
            "{variant: plain, form: mapping}",
        ),
        (
            "sequence",
            "{kind: sequence, item: {kind: scalar, scalar: text}}",
            "{kind: element-sequence, path: [Item], item: {kind: text}}",
            "{kind: sequence, item: {kind: scalar, scalar: text}}",
            "{variant: plain, form: sequence}",
        ),
        (
            "scalar",
            "{kind: scalar, scalar: text}",
            "{kind: text}",
            "{kind: scalar, scalar: text}",
            "",
        ),
    ] {
        declarations.push(format!("format: nkdk-declarations/1\nkind: value\nid: test.tag-{name}-body\nvalue: {body}\nrepresentations:\n  xml: {xml}\n  yaml: {yaml}\n"));
        let plain = if plain.is_empty() {
            String::new()
        } else {
            format!("{plain},")
        };
        declarations.push(format!("format: nkdk-declarations/1\nkind: value\nid: test.tag-{name}-choice\nnamespaces: {{xsi: 'http://www.w3.org/2001/XMLSchema-instance'}}\nimports: {{body: test.tag-{name}-body}}\nvalue: {{kind: choice, variants: [{{name: plain, type: {{use: body}}}}, {{name: marked, type: {{use: body}}}}]}}\nrepresentations:\n  xml: {{kind: choice, attribute: xsi:type, variants: [{{variant: plain, in: [Plain], emit: Plain}}, {{variant: marked, in: [Marked], emit: Marked}}], otherwise: plain}}\n  yaml: {{kind: choice, fallback: plain, variants: [{plain}{{variant: marked, form: tagged, tag: проверять}}]}}\n"));
        declarations.push(format!("format: nkdk-declarations/1\nkind: object\nid: test.tag-{name}-owner\nimports: {{choice: test.tag-{name}-choice}}\nvalue: {{kind: record, fields: [{{name: value, type: {{use: choice}}}}]}}\nrepresentations:\n  xml: {{kind: record, fields: [{{field: value, path: [Root, Value]}}]}}\n  yaml: {{kind: mapping, fields: [{{field: value, key: Value}}]}}\n"));
    }
    let originals = declarations
        .iter()
        .filter(|text| text.contains("kind: object\n"))
        .cloned()
        .collect::<Vec<_>>();
    for owner in originals {
        if !owner.contains("id: test.tag-sequence-owner") {
            declarations.push(owner.replace("-owner\n", "-root-owner\n").replace(
                "{kind: mapping, fields: [{field: value, key: Value}]}",
                "{kind: projection, field: value}",
            ));
        }
        declarations.push(
            owner
                .replace("-owner\n", "-renamed-owner\n")
                .replace("key: Value", "key: 'Другое: имя'"),
        );
    }
    let collision = declarations[1].replace(
        "{variant: plain, form: mapping}",
        "{variant: plain, form: tagged, tag: проверять}",
    );
    let empty_tag = declarations[1].replace("tag: проверять", "tag: ''");
    for (bad, expected) in [
        (&collision, "choice_selector_collision"),
        (&empty_tag, "invalid_choice_selector"),
    ] {
        let replaced = declarations
            .iter()
            .enumerate()
            .map(|(i, text)| SourceFile {
                path: "bad-tag.yaml",
                bytes: if i == 1 {
                    bad.as_bytes()
                } else {
                    text.as_bytes()
                },
            })
            .collect::<Vec<_>>();
        assert!(
            compile(&replaced)
                .unwrap_err()
                .iter()
                .any(|error| error.code == expected)
        );
    }
    let sources = declarations
        .iter()
        .map(|text| SourceFile {
            path: text.lines().find(|line| line.starts_with("id:")).unwrap(),
            bytes: text.as_bytes(),
        })
        .collect::<Vec<_>>();
    let generated =
        compile(&sources).expect("a semantic tag is independent of the underlying value shape");
    run_generated(
        generated,
        "semantic-whole-value-tag-contract",
        r#"include!("generated.rs");
fn main() {
    for (name, body, yaml) in [
        ("record", "<Name>x</Name>", "Value: !проверять\n  Name: x\n"),
        ("sequence", "<Item>x</Item><Item>y</Item>", "Value: !проверять\n  - x\n  - y\n"),
        ("scalar", "x", "Value: !проверять x"),
    ] {
        let entry=entry_id(&format!("test.tag-{name}-owner")).unwrap();
        let inputs=PreparedInputs::default();
        for state in ["Plain", "Marked"] {
            let source=format!("<Root xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><Value xsi:type=\"{state}\">{body}</Value></Root>");
            let converted=convert_file(entry,Direction::XmlToYaml,source.as_bytes(),&inputs).unwrap();
            assert!(converted.diagnostics.is_empty(),"{name}: {:?}",converted.diagnostics);
            let candidate=converted.bytes;
            let text=std::str::from_utf8(&candidate).unwrap();
            assert_eq!(text.contains("!проверять"),state=="Marked","{name}: {text}");
            assert!(!text.contains("!xml"),"{name}: {text}");
            verify_candidate(entry,source.as_bytes(),&candidate,&inputs).unwrap();
            let irregular=source.replace("<Value xsi:type=", "<Value extra=\"kept\" xsi:type=");
            let retained=convert_file(entry,Direction::XmlToYaml,irregular.as_bytes(),&inputs).unwrap();
            assert!(std::str::from_utf8(&retained.bytes).unwrap().contains("!xml"),"{name}: anomaly retained");
            verify_candidate(entry,irregular.as_bytes(),&retained.bytes,&inputs).unwrap();

        }
        let exported=convert_file(entry,Direction::YamlToXml,yaml.as_bytes(),&inputs).unwrap();
        assert!(exported.diagnostics.is_empty(),"{name}: {:?}",exported.diagnostics);
        assert!(std::str::from_utf8(&exported.bytes).unwrap().contains("type=\"Marked\""));
        for (suffix, alternate) in [
            ("root-owner", yaml.replacen("Value: ", "", 1)),
            ("renamed-owner", yaml.replacen("Value:", "\"Другое: имя\":", 1)),
        ] {
            if name=="sequence" && suffix=="root-owner" {continue;}
            let alternate_entry=entry_id(&format!("test.tag-{name}-{suffix}")).unwrap();
            let xml=convert_file(alternate_entry,Direction::YamlToXml,alternate.as_bytes(),&inputs).unwrap();
            let back=convert_file(alternate_entry,Direction::XmlToYaml,&xml.bytes,&inputs).unwrap();
            let output=std::str::from_utf8(&back.bytes).unwrap();
            assert!(output.contains("!проверять"),"{name}/{suffix}: {output}");
            assert!(!output.contains("!xml"),"{name}/{suffix}: {output}");
            verify_candidate(alternate_entry,&xml.bytes,&back.bytes,&inputs).unwrap();
        }
        let invalid=yaml.replace("!проверять","!чужой");
        assert!(convert_file(entry,Direction::YamlToXml,invalid.as_bytes(),&inputs).is_err());
    }
}
"#,
    );
}

fn predefined_extension_declarations() -> (std::path::PathBuf, Vec<(String, Vec<u8>)>) {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .unwrap();
    let mut names = vec![
        "common/boolean".to_owned(),
        "common/predefined-code".to_owned(),
        "probes/predefined-catalog-items".to_owned(),
        "probes/predefined-extension-item-view".to_owned(),
        "probes/predefined-extension-file-items".to_owned(),
        "probes/predefined-extension-file".to_owned(),
        "fragments/predefined-extension-file.generated".to_owned(),
        "probes/predefined-extension-owner".to_owned(),
    ];
    names.extend(
        TYPE_DESCRIPTION_FILES
            .iter()
            .map(|name| format!("common/{name}")),
    );
    let files = names
        .iter()
        .map(|name| {
            (
                name.clone(),
                std::fs::read(root.join("declarations").join(format!("{name}.yaml"))).unwrap(),
            )
        })
        .collect::<Vec<_>>();
    (root, files)
}

fn require_predefined_source_index(sources: &[SourceFile<'_>], path: &str) {
    let source = sources.iter().find(|source| source.path == path).unwrap();
    let module = parse(SourceFile {
        path: source.path,
        bytes: source.bytes,
    })
    .unwrap();
    assert!(
        module
            .input_indexes
            .iter()
            .any(|binding| binding.name == "identities"
                && binding.value == "metadata.predefined-identities"),
        "{path} must receive its source-derived identity index"
    );
}

#[test]
fn predefined_extension_state_uses_the_same_record_and_real_leaf_fixtures() {
    let (root, files) = predefined_extension_declarations();
    let sources = support::source_files(&files);
    require_predefined_source_index(&sources, "probes/predefined-extension-file");
    let generated = nkdk_rule_compiler::compile_exporting(&sources, |module| {
        module.id == "probe.predefined-extension-item-view"
            || module.id == "probe.predefined-extension-property-view"
            || module.id == "probe.predefined-extension-file"
    })
    .unwrap();
    let fixture=root.join("../e2e/fixtures/xml/cfe/all-extension/Catalogs/СправочникСПредопределенными/Ext/Predefined.xml").canonicalize().unwrap();
    run_generated(generated,"predefined-extension-leaf-contract",&r#"include!("generated.rs");
fn main() {
 const NS:&str="http://v8.1c.ru/8.3/xcf/predef";
 let document=include_bytes!(@FIXTURE@);
 let file_entry=entry_id("probe.predefined-extension-file").unwrap();
 let source_inputs=prepare_inputs(file_entry,vec![("owner".into(),InputValue::Text("Справочник.СправочникСПредопределенными".into())),("borrowed".into(),InputValue::Boolean(true))]).unwrap();
 assert!(fact_source_input_bindings(file_entry,Direction::XmlToYaml).is_empty());
 assert_eq!(fact_source_input_bindings(file_entry,Direction::YamlToXml).len(),1);
 let mut prepared=core::facts::preparation::prepare::<FactCatalog>(
  vec![core::facts::preparation::Source{entry:file_entry,direction:Direction::XmlToYaml,bytes:document,inputs:source_inputs}],
  &[file_entry],core::facts::Generation(8),core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:40,bytes:4000},rows:20},40
 ).unwrap_or_else(|errors|panic!("{errors:?}"));
 let file_inputs=prepared.sources.pop().unwrap().inputs;
 let expected="Группа2: !проверять\n  Код: \"000000004\"\n  Наименование: Группа 2\n  ЭтоГруппа: Истина\n  Элементы:\n    Предопределенный3:\n      Код: \"000000005\"\n      Наименование: Предопределенный 3\nГруппа: !проверять\n  Код: \"000000003\"\n  Наименование: Наименование\n  ЭтоГруппа: Истина\nПредопределенный2:\n  Код: \"000000002\"\n  Наименование: Наименование";
 let imported=convert_file(file_entry,Direction::XmlToYaml,document,&file_inputs).unwrap();
 assert_eq!(String::from_utf8(imported.bytes.clone()).unwrap(),expected);
 verify_candidate(file_entry,document,expected.as_bytes(),&file_inputs).unwrap();
 let exported=convert_file(file_entry,Direction::YamlToXml,expected.as_bytes(),&file_inputs).unwrap();
 core::proof::verify(document,&exported.bytes,|_|false).unwrap();
 for xml in [
  std::str::from_utf8(document).unwrap().replacen("AdoptedCheck","Unexpected",1),
  std::str::from_utf8(document).unwrap().replace("<Name>Предопределенный3</Name>","<Name extra=\"keep\">Предопределенный3</Name>"),
  std::str::from_utf8(document).unwrap().replace("<Name>Предопределенный2</Name>","<Name>Группа</Name>"),
 ] {
  let imported=convert_file(file_entry,Direction::XmlToYaml,xml.as_bytes(),&file_inputs).unwrap();
  let yaml=std::str::from_utf8(&imported.bytes).unwrap();
  assert!(yaml.contains("!xml/"),"{yaml}");assert!(yaml.contains("Группа2"),"{yaml}");
  verify_candidate(file_entry,xml.as_bytes(),&imported.bytes,&file_inputs).unwrap();
  let restored=convert_file(file_entry,Direction::YamlToXml,&imported.bytes,&file_inputs).unwrap();
  core::proof::verify(xml.as_bytes(),&restored.bytes,|_|false).unwrap();
 }
 let entry=entry_id("probe.predefined-extension-item-view").unwrap();
 let owner="Справочник.СправочникСПредопределенными";
 let rows=[
  ("Группа","49c8c31f-8771-4d34-89c4-ee37d85c4225",owner,false,"!проверять\nИмя: Группа\nКод: \"000000003\"\nНаименование: Наименование\nЭтоГруппа: Истина"),
  ("Предопределенный2","71753bc2-e6a6-44e3-ac4f-3cefe37cc7a0",owner,false,"Имя: Предопределенный2\nКод: \"000000002\"\nНаименование: Наименование"),
  ("Предопределенный3","633dd246-5da2-43a0-a30d-f3a237c2bcae","Справочник.СправочникСПредопределенными.Предопределенный.Группа2",true,"Имя: Предопределенный3\nКод: \"000000005\"\nНаименование: Предопределенный 3"),
 ];
 let entries=rows.iter().map(|(name,id,parent,_,_)|(format!("{parent}.Предопределенный.{name}"),*id)).collect::<Vec<_>>();
 let index=text_index(&entries.iter().map(|(key,id)|(key.as_str(),*id)).collect::<Vec<_>>());
 for(name,id,parent,nested,expected)in rows {
  let offset=std::str::from_utf8(document).unwrap().find(&format!("<Item id=\"{id}\"")).unwrap();
  let mut route=vec![(NS,"PredefinedData"),(NS,"Item")];
  if nested {route.extend([(NS,"ChildItems"),(NS,"Item")]);}
  let tree=core::xml::Tree::capture_at_with_qnames(document,&route,offset,|_|false).unwrap().unwrap();
  let mut spaces=vec![];tree.collect_namespaces(&mut spaces);
  let mut writer=core::xml::Writer::new(&spaces);tree.write_at(&mut writer,&[],&[]).unwrap();
  let xml=writer.finish();
  let inputs=prepare_inputs(entry,vec![("parent".into(),InputValue::Text(parent.into())),("identities".into(),InputValue::TextIndex(index.clone())),("borrowed".into(),InputValue::Boolean(true))]).unwrap();
  let result=convert_file(entry,Direction::XmlToYaml,&xml,&inputs).unwrap();
  let actual=std::str::from_utf8(&result.bytes).unwrap();
  assert_eq!(actual,expected,"{name}");
  verify_candidate(entry,&xml,expected.as_bytes(),&inputs).unwrap();
  let exported=convert_file(entry,Direction::YamlToXml,expected.as_bytes(),&inputs).unwrap();
  core::proof::verify(&xml,&exported.bytes,|_|false).unwrap();
  let property_entry=entry_id("probe.predefined-extension-property-view").unwrap();
  let property_inputs=prepare_inputs(property_entry,vec![("parent".into(),InputValue::Text(parent.into())),("identities".into(),InputValue::TextIndex(index.clone())),("borrowed".into(),InputValue::Boolean(true))]).unwrap();
  let bad=String::from_utf8(xml.clone()).unwrap().replace("AdoptedCheck", "Unexpected").replace("AdoptedNotify", "Unexpected");
  let preserved=convert_file(property_entry,Direction::XmlToYaml,bad.as_bytes(),&property_inputs).unwrap();
  assert!(std::str::from_utf8(&preserved.bytes).unwrap().contains("!xml/"));
  let restored=convert_file(property_entry,Direction::YamlToXml,&preserved.bytes,&property_inputs).unwrap();
  core::proof::verify(bad.as_bytes(),&restored.bytes,|_|false).unwrap();
  if !expected.starts_with('!') {
   let mut own_xml=String::from_utf8(xml.clone()).unwrap();
   let state=own_xml.find("AdoptedCheck").unwrap();
   let start=own_xml[..state].rfind('<').unwrap();
   let end=state+own_xml[state..].find("</").unwrap();
   let end=end+own_xml[end..].find('>').unwrap()+1;
   own_xml.replace_range(start..end, "");
   let own_inputs=prepare_inputs(entry,vec![("parent".into(),InputValue::Text(parent.into())),("identities".into(),InputValue::TextIndex(index.clone())),("borrowed".into(),InputValue::Boolean(false))]).unwrap();
   let own=convert_file(entry,Direction::XmlToYaml,own_xml.as_bytes(),&own_inputs).unwrap();
   assert_eq!(std::str::from_utf8(&own.bytes).unwrap(),expected);
   verify_candidate(entry,own_xml.as_bytes(),expected.as_bytes(),&own_inputs).unwrap();
   let tagged=format!("!проверять\n{expected}");
   assert!(!validate_file(entry,tagged.as_bytes(),&own_inputs).is_empty());
  }
 }
}
"#.replace("@FIXTURE@",&format!("{fixture:?}")).replace("include!(\"generated.rs\");", &format!("include!(\"generated.rs\");\n{}", include_str!("support/text_index.rs"))));
}

#[test]
fn predefined_extension_owner_prepares_its_index_from_attached_file() {
    let (root, files) = predefined_extension_declarations();
    let sources = support::source_files(&files);
    require_predefined_source_index(&sources, "probes/predefined-extension-owner");
    let fixture=root.join("../e2e/fixtures/xml/cfe/all-extension/Catalogs/СправочникСПредопределенными/Ext/Predefined.xml").canonicalize().unwrap();
    let owner_generated = nkdk_rule_compiler::compile_exporting(&sources, |module| {
        matches!(
            module.id.as_str(),
            "probe.predefined-extension-owner" | "probe.predefined-extension-file"
        )
    })
    .unwrap();
    let owner_fixture = fixture
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .with_extension("xml");
    run_generated(owner_generated,"predefined-extension-owner-contract",&r#"include!("generated.rs");
fn main(){
 let owner=include_bytes!(@OWNER@);let file=include_bytes!(@FILE@);
 let entry=entry_id("probe.predefined-extension-owner").unwrap();
 let owner_values=||vec![("component".into(),InputValue::Text("cfe".into()))];
 assert_eq!(document_paths(entry).unwrap(),&[&["Ext","Predefined.xml"][..]]);
 let path=core::resources::RelativePath::new(["Ext","Predefined.xml"],4096).unwrap();
 let source_inputs=prepare_inputs(entry,owner_values()).unwrap();
 assert!(fact_source_input_bindings(entry,Direction::XmlToYaml).is_empty());
 assert_eq!(fact_source_input_bindings(entry,Direction::YamlToXml).len(),1);
 let mut loads=0;
 let mut prepared=core::facts::preparation::prepare_streaming_with_documents::<FactCatalog>(
  vec![core::facts::preparation::SourceHeader{entry,direction:Direction::XmlToYaml,inputs:source_inputs}],
  &[entry],core::facts::Generation(9),core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:40,bytes:4000},rows:20},40,
  |index,header|{assert_eq!(index,0);assert_eq!(header.entry.0,entry.0);loads+=1;Ok(core::facts::preparation::LoadedSource{bytes:owner.to_vec(),documents:vec![(path.clone(),file.to_vec())]})}
 ).unwrap_or_else(|errors|panic!("{errors:?}"));
 assert_eq!(loads,1);
 let loaded=prepared.sources.pop().unwrap().inputs;
 assert!(loaded.document(&["Ext","Predefined.xml"]).is_empty(),"streaming preparation must release XML documents");
 let loaded=loaded.with_documents(vec![(path,file.to_vec())]).unwrap();
 let inputs=||prepare_fact_inputs(entry,prepared.facts.clone(),core::facts::Generation(9),owner_values()).unwrap();
 let yaml=convert_file(entry,Direction::XmlToYaml,owner,&loaded).unwrap();
 let text=std::str::from_utf8(&yaml.bytes).unwrap();
 assert!(text.contains("Имя: СправочникСПредопределенными"),"{text}");
 assert!(text.contains("Группа2: !проверять"),"{text}");
 assert!(text.contains("Предопределенный3:"),"{text}");
 assert!(!text.contains("Идентификатор:"),"the source index must recover UUIDs: {text}");
 let xml=convert_file(entry,Direction::YamlToXml,&yaml.bytes,&inputs()).unwrap();
 core::proof::verify(owner,&xml.bytes,|_|false).unwrap();
 assert_eq!(xml.documents.len(),1);
 assert_eq!(xml.documents[0].0.segments(),["Ext","Predefined.xml"]);
 core::proof::verify(file,&xml.documents[0].1,|_|false).unwrap();
 let own=std::str::from_utf8(owner).unwrap().replace("<ObjectBelonging>Adopted</ObjectBelonging>","<ObjectBelonging>Own</ObjectBelonging>");
 let converted=convert_file(entry,Direction::XmlToYaml,own.as_bytes(),&loaded).unwrap();
 let restored=convert_file(entry,Direction::YamlToXml,&converted.bytes,&inputs()).unwrap();
 core::proof::verify(own.as_bytes(),&restored.bytes,|_|false).unwrap();
 core::proof::verify(file,&restored.documents[0].1,|_|false).unwrap();
 // Retain semantic YAML before the import index exists. A later operation
 // rebuilds all UUID facts from those bytes, without the old Arc or XML files.
 let bare=prepare_inputs(entry,owner_values()).unwrap().with_documents(vec![(core::resources::RelativePath::new(["Ext","Predefined.xml"],4096).unwrap(),file.to_vec())]).unwrap();
 let snapshot=snapshot_fact_source(entry,owner,&bare).unwrap();
 assert!(std::str::from_utf8(&snapshot).unwrap().contains("Идентификатор:"));
 let generation=core::facts::Generation(10);
 let budget=||core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:40,bytes:4000},rows:20};
 let mut loads=0;
 let prepared=core::facts::preparation::prepare_streaming_materials::<FactCatalog>(
  vec![core::facts::preparation::MaterialSourceHeader{source:core::facts::preparation::SourceHeader{entry,direction:Direction::YamlToXml,inputs:prepare_inputs(entry,owner_values()).unwrap()},kind:core::facts::preparation::SourceKind::Snapshot}],
  &[entry],generation,budget(),40,|_,_|{loads+=1;Ok(core::facts::preparation::LoadedSource{bytes:snapshot.clone(),documents:vec![]})}
 ).unwrap_or_else(|errors|panic!("{errors:?}"));
 assert_eq!(loads,1);
 let rebuilt=prepare_fact_inputs(entry,prepared.facts,generation,owner_values()).unwrap();
 let restored=convert_file(entry,Direction::YamlToXml,&yaml.bytes,&rebuilt).unwrap();
 core::proof::verify(owner,&restored.bytes,|_|false).unwrap();
 core::proof::verify(file,&restored.documents[0].1,|_|false).unwrap();
 // The base and extension contain equal paths with different UUIDs. They must
 // remain independent when both sources belong to the same preparation.
 let base_entry=entry_id("probe.predefined-extension-file").unwrap();
 let base=include_bytes!(@BASE_FILE@);
 let base_inputs=prepare_inputs(base_entry,vec![("owner".into(),InputValue::Text("cf/Справочник.СправочникСПредопределенными".into())),("borrowed".into(),InputValue::Boolean(false))]).unwrap();
 let extension_inputs=prepare_inputs(entry,owner_values()).unwrap().with_documents(vec![(core::resources::RelativePath::new(["Ext","Predefined.xml"],4096).unwrap(),file.to_vec())]).unwrap();
 let mut joint=core::facts::preparation::prepare::<FactCatalog>(
  vec![core::facts::preparation::Source{entry:base_entry,direction:Direction::XmlToYaml,bytes:base,inputs:base_inputs},core::facts::preparation::Source{entry,direction:Direction::XmlToYaml,bytes:owner,inputs:extension_inputs}],
  &[entry],core::facts::Generation(11),budget(),80
 ).unwrap_or_else(|errors|panic!("base and extension identity scopes: {errors:?}"));
 let joint_inputs=joint.sources.pop().unwrap().inputs;
 let restored=convert_file(entry,Direction::YamlToXml,&yaml.bytes,&joint_inputs).unwrap();
 core::proof::verify(file,&restored.documents[0].1,|_|false).unwrap();
}
"#.replace("@OWNER@",&format!("{owner_fixture:?}")).replace("@FILE@",&format!("{fixture:?}")).replace("@BASE_FILE@",&format!("{:?}",root.join("../e2e/fixtures/xml/cf/Catalogs/СправочникСПредопределенными/Ext/Predefined.xml"))));
}

#[test]
fn composed_record_exposes_field_presence_and_annotations_to_its_parent() {
    let source = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: test.code
  value: {kind: enum, variants: [{name: A, value: A}]}
  representations:
    xml: {kind: text, values: [{value: A, text: A}]}
    yaml: {kind: scalar, values: [{value: A, literal: Альфа}]}
- kind: value
  id: test.details
  value: {kind: record, fields: [{name: text, type: {kind: scalar, scalar: text}}]}
  representations:
    xml: {kind: record, fields: [{field: text, path: [Text]}]}
    yaml: {kind: mapping, fields: [{field: text, key: Текст}]}
- kind: value
  id: test.row
  imports: {code: test.code, details: test.details}
  value: {kind: record, fields: [{name: code, type: {use: code}}, {name: details, type: {use: details}}]}
  representations:
    xml: {kind: record, fields: [{field: code, path: [], attribute: code}, {field: details, path: [Details]}]}
    yaml: {kind: mapping, fields: [{field: code, key: Код}, {field: details, key: Подробности}]}
  presence:
  - target: {field: code}
    xml: {missing: {denotes: {absent: true}}}
    yaml: {missing: {denotes: {absent: true}}}
- kind: object
  id: test.owner
  imports: {row: test.row}
  value: {kind: record, fields: [{name: row, type: {use: row}}]}
  representations:
    xml: {kind: record, fields: [{field: row, path: [Root]}]}
    yaml: {kind: mapping, fields: [{field: row, key: Запись}]}
"#;
    let (generated, id) = support::compile_catalog("fields.yaml", source, "test.owner");
    let main = r#"include!("generated.rs");
fn main() {
 let inputs=PreparedInputs::default();
 for (code,present,annotated) in [(" code=\"A\"",true,false),("",false,false),(" code=\"unexpected\"",false,true)] {
  let xml=format!("<Root{code}><Details><Text>сосед</Text></Details></Root>");
  let value=read_xml_@ID@(xml.as_bytes(),&inputs.view()).unwrap();
  assert_eq!(item_@ID@::field_present(value.body.as_ref().unwrap(),0),present,"{code}");
  assert_eq!(item_@ID@::field_has_annotation(value.body.as_ref().unwrap(),0),annotated,"{code}");
  assert!(item_@ID@::field_present(value.body.as_ref().unwrap(),1));
  assert!(!item_@ID@::field_has_annotation(value.body.as_ref().unwrap(),1));
  assert!(!item_@ID@::field_present(value.body.as_ref().unwrap(),99));
  if code.contains("unexpected") {
   let yaml=convert_file(EntryId(@ID@),Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap().bytes;
   let restored=read_yaml_@ID@(&yaml,&inputs.view()).unwrap();
   assert!(item_@ID@::field_has_annotation(restored.body.as_ref().unwrap(),0));
   assert!(!item_@ID@::field_has_annotation(restored.body.as_ref().unwrap(),1));
   verify_candidate(EntryId(@ID@),xml.as_bytes(),&yaml,&inputs).unwrap();
   let exported=convert_file(EntryId(@ID@),Direction::YamlToXml,&yaml,&inputs).unwrap();
   core::proof::verify(xml.as_bytes(),&exported.bytes,|_|false).unwrap();
  }
 }
}
"#.replace("@ID@", &id.to_string());
    run_generated(generated, "composed-field-state-contract", &main);
}

#[test]
fn named_collection_lifts_the_shared_key_from_tagged_record_variants() {
    let mut source = "format: nkdk-declarations/1\nkind: catalog\ndeclarations:\n".to_owned();
    for (id, state) in [("plain", "Own"), ("marked", "Marked")] {
        let (kind, declaration_id) = if id == "plain" {
            ("fragment", "plain-fields")
        } else {
            ("value", id)
        };
        source.push_str(&format!(r#"- kind: value
  id: test.{id}-state
  value: {{kind: enum, variants: [{{name: State, value: State}}]}}
  representations:
    xml: {{kind: text, values: [{{value: State, text: {state}}}]}}
    yaml: {{kind: scalar, values: [{{value: State, literal: {state}}}]}}
- kind: {kind}
  id: test.{declaration_id}
  imports: {{state: test.{id}-state}}
  xmlOrder: [name, text, state]
  value: {{kind: record, fields: [{{name: name, type: {{kind: scalar, scalar: text}}}}, {{name: text, type: {{kind: scalar, scalar: text}}}}, {{name: state, type: {{use: state}}}}]}}
  representations:
    xml: {{kind: record, fields: [{{field: name, path: [Name]}}, {{field: text, path: [Text]}}, {{field: state, path: [State]}}]}}
    yaml: {{kind: mapping, fields: [{{field: name, key: Name}}, {{field: text, key: Text}}]}}
  presence:
  - target: {{field: state}}
    yaml: {{missing: {{denotes: {{literal: State}}}}}}
"#));
        if id == "plain" {
            source.push_str("  contributions:\n  - index: test.named-choice-names\n    key: {field: name}\n    value: {field: text}\n");
        }
    }
    source.push_str(&support::composed_record("test.plain", "test.plain-fields"));
    source.push_str(r#"- kind: value
  id: test.item
  imports: {plain: test.plain, marked: test.marked}
  value: {kind: choice, variants: [{name: plain, type: {use: plain}}, {name: marked, type: {use: marked}}]}
  representations:
    xml: {kind: choice, fallback: plain}
    yaml: {kind: choice, variants: [{variant: plain, form: mapping}, {variant: marked, form: tagged, tag: notice}]}
- kind: value
  id: test.rows
  imports: {item: test.item}
  value: {kind: sequence, item: {use: item}}
  representations:
    xml: {kind: element-sequence, path: [Item], item: {kind: declared}}
    yaml: {kind: record-mapping, key: name}
"#);
    source.push_str(&support::named_sequence_owner(
        "[Root]",
        "{kind: projection, field: rows}",
    ));
    source = source.replace("id: test.marked\n  imports: {state: test.marked-state}\n  xmlOrder: [name, text, state]\n  value: {kind: record, fields: [{name: name, type: {kind: scalar, scalar: text}}, {name: text, type: {kind: scalar, scalar: text}}", "id: test.marked\n  imports: {state: test.marked-state}\n  xmlOrder: [name, text, state]\n  value: {kind: record, fields: [{name: text, type: {kind: scalar, scalar: text}}, {name: name, type: {kind: scalar, scalar: text}}");
    let broken_boundary = source.replacen(
        "{field: name, path: [Name]}",
        "{field: name, path: [OtherName]}",
        1,
    );
    let errors = compile(&[SourceFile {
        path: "mismatched-choice-key.yaml",
        bytes: broken_boundary.as_bytes(),
    }])
    .unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "incomplete_item_contract"),
        "{errors:?}"
    );
    let recursive_choice = source
        .replace(
            "{name: marked, type: {use: marked}}",
            "{name: marked, type: {use: selfChoice}}",
        )
        .replace(
            "imports: {plain: test.plain, marked: test.marked}",
            "imports: {plain: test.plain, marked: test.marked, selfChoice: test.item}",
        );
    let errors = compile(&[SourceFile {
        path: "recursive-choice.yaml",
        bytes: recursive_choice.as_bytes(),
    }])
    .unwrap_err();
    assert!(
        errors
            .iter()
            .any(|error| error.code == "recursive_value_type"),
        "{errors:?}"
    );
    let generated = compile(&[SourceFile {
        path: "named-choice.yaml",
        bytes: source.as_bytes(),
    }])
    .unwrap();
    run_generated(
        generated,
        "named-record-choice-contract",
        r#"include!("generated.rs");
fn main() {
 let entry=entry_id("test.owner").unwrap();let inputs=PreparedInputs::default();
 let xml=b"<Root><Item><Name>First</Name><Text>a</Text><State>Own</State></Item><Item><Name>Second</Name><Text>b</Text><State>Marked</State></Item></Root>";
 let yaml=b"First:\n  Text: a\nSecond: !notice\n  Text: b";
 for (direction,source) in [(Direction::XmlToYaml,xml.as_slice()),(Direction::YamlToXml,yaml.as_slice())] {
  let generation=core::facts::Generation(1);
  let mut builder=fact_builder(generation,core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:2,bytes:100},rows:1});
  let errors=contribute_file(entry,direction,source,&inputs,&mut builder);
  assert!(errors.is_empty(),"{errors:?}");
  let facts=builder.finish();let index=fact_id("test.named-choice-names").unwrap();
  assert_eq!(facts.lookup(generation,index,"First"),core::facts::FactState::Ready("a"));
  assert_eq!(facts.lookup(generation,index,"Second"),core::facts::FactState::Missing,"the selected variant without a contribution must not publish a row");
 }
 let imported=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
 let actual=std::str::from_utf8(&imported.bytes).unwrap();
 assert!(!actual.contains("!xml"),"{actual}");assert!(!actual.contains("Name:"),"{actual}");assert!(actual.contains("!notice"),"{actual}");
 verify_candidate(entry,xml,&imported.bytes,&inputs).unwrap();
 let exported=convert_file(entry,Direction::YamlToXml,yaml,&inputs).unwrap();core::proof::verify(xml,&exported.bytes,|_|false).unwrap();
 for source in [
  std::str::from_utf8(xml).unwrap().replace("</Root>","<Item><Name>Second</Name><Text>c</Text><State>Own</State></Item></Root>"),
  std::str::from_utf8(xml).unwrap().replace("<State>Marked</State>","<State>Unexpected</State>"),
  std::str::from_utf8(xml).unwrap().replace("<Name>Second</Name>","<Name extra=\"keep\">Second</Name>"),
 ] {
  let imported=convert_file(entry,Direction::XmlToYaml,source.as_bytes(),&inputs).unwrap();
  verify_candidate(entry,source.as_bytes(),&imported.bytes,&inputs).unwrap();
  let exported=convert_file(entry,Direction::YamlToXml,&imported.bytes,&inputs).unwrap();core::proof::verify(source.as_bytes(),&exported.bytes,|_|false).unwrap();
 }
}
"#,
    );
}

#[test]
fn external_document_uses_owner_fields_in_shared_reader_and_proof() {
    let source = r#"format: nkdk-declarations/1
kind: value
id: test.payload
inputs: {prefix: {type: {kind: scalar, scalar: text}}}
value: {kind: record, fields: [{name: label, type: {kind: scalar, scalar: text}}, {name: hidden, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: label, path: [Label]}, {field: hidden, path: [Hidden]}]}
  yaml: {kind: mapping, fields: [{field: label, key: Label}]}
presence:
- target: {field: label}
  yaml: {default: {input: prefix}}
- target: {field: hidden}
  yaml: {missing: {denotes: {input: prefix}}}
constraints:
- id: owner-label
  appliesTo: [xml-import, yaml-validation]
  assert: {eq: [{field: hidden}, {input: prefix}]}
  diagnostic: {code: test.owner-label, severity: error, at: {field: hidden}, message: Wrong owner}
"#;
    let owner = include_str!("support/external-document-owner.yaml.in")
        .replace("@IMPORTS@", "imports: {payload: test.payload}")
        .replace(
            "@PAYLOAD_TYPE@",
            "{use: payload, bind: {prefix: {field: name}}}",
        )
        .replace(
            "{name: name, type: {kind: scalar, scalar: text}}]",
            "{name: name, type: {kind: scalar, scalar: text}}, {name: copy, type: {kind: scalar, scalar: text}}]",
        )
        .replace(
            "{field: name, path: [Primary, Name]}]",
            "{field: name, path: [Primary, Name]}, {field: copy, path: [Primary, Copy]}]",
        )
        + "\npresence:\n- target: {field: copy}\n  yaml: {missing: {denotes: {field: name}}}\n";
    let generated = compile(&[
        SourceFile {
            path: "external-context.yaml",
            bytes: source.as_bytes(),
        },
        SourceFile {
            path: "external-owner.yaml",
            bytes: owner.as_bytes(),
        },
    ])
    .unwrap();
    run_generated(
        generated,
        "external-context-contract",
        r#"include!("generated.rs");
fn main(){
 let entry=entry_id("test.external-payload").unwrap();
 let primary=b"<Primary><Name>Main</Name><Copy>Main</Copy></Primary>";
 let external=b"<Data><Label>Main</Label><Hidden>Main</Hidden></Data>";
 let path=core::resources::RelativePath::new(["Aux","Payload.xml"],4096).unwrap();
 let loaded=PreparedInputs::default().with_documents(vec![(path,external.to_vec())]).unwrap();
 let result=convert_file(entry,Direction::XmlToYaml,primary,&loaded).unwrap();
 let expected=b"Payload: {}\nName: Main";
 assert_eq!(result.bytes,expected);
 verify_candidate(entry,primary,expected,&loaded).unwrap();
 let result=convert_file(entry,Direction::YamlToXml,expected,&PreparedInputs::default()).unwrap();
 core::proof::verify(primary,&result.bytes,|_|false).unwrap();
 core::proof::verify(external,&result.documents[0].1,|_|false).unwrap();
 let bad=b"<Data><Label>Main</Label><Hidden>Other</Hidden></Data>";
 let path=core::resources::RelativePath::new(["Aux","Payload.xml"],4096).unwrap();
 let loaded=PreparedInputs::default().with_documents(vec![(path,bad.to_vec())]).unwrap();
 let result=convert_file(entry,Direction::XmlToYaml,primary,&loaded).unwrap();
 let restored=convert_file(entry,Direction::YamlToXml,&result.bytes,&PreparedInputs::default()).unwrap();
 core::proof::verify(primary,&restored.bytes,|_|false).unwrap();
 core::proof::verify(bad,&restored.documents[0].1,|_|false).unwrap();
}
"#,
    );
}

#[test]
fn reservation_profiles_are_compiled_from_attributes_and_scope_bindings() {
    let allocator = include_str!("fixtures/numbered-facts.yaml")
        .replace("test.numbers", "test.occupied-numbers")
        .replace(
            "owner: {input: owner}, name:",
            "owner: {input: owner}, kind: {literal: outer}, name:",
        )
        .replace("scope: [owner]", "scope: [owner, kind]");
    let other = include_str!("fixtures/numbered-facts.yaml")
        .replace("test.numbering", "test.other-numbering")
        .replace("test.numbers", "test.other-numbers");
    let profile = include_str!("fixtures/attribute-reservations.yaml").replace(
        "reserve: {field: outer}",
        "reserve: {field: outer}\n    when: {present: {field: outer}}",
    );
    let ambiguous = profile
        .replace("test.occupied\n", "test.ambiguous\n")
        .replace("[a:Root, a:Group, b:Reset]", "[a:Root, a:Group, a:Group]");
    let conditional = profile
        .replace("test.occupied\n", "test.conditional\n")
        .replace(
            "when: {present: {field: outer}}",
            "when: {present: {field: inner}}",
        );
    let mixed = profile.replace("test.occupied\n", "test.mixed\n")
        + "  - index: test.labels\n    key: {field: outer}\n    value: {field: inner}\n";
    let output_only = profile
        .replace("test.occupied\n", "test.output-only\n")
        .replace(
            "inputs:\n",
            "inputs:\n  numbers: {index: test.occupied-numbers}\n",
        )
        + "presence:\n  - target: {field: outer}\n    xml:\n      missing:\n        denotes: {require: {lookup: {in: {input: numbers}, key: {record: {owner: {input: owner}, kind: {literal: outer}, name: {literal: ignored}}}}}}\n";
    let cyclic_scope = output_only.replace("test.output-only\n", "test.cyclic-scope\n")
        .replacen("owner: {input: owner}, kind: {literal: outer}", "owner: {require: {lookup: {in: {input: numbers}, key: {record: {owner: {input: owner}, kind: {literal: outer}, name: {literal: existing}}}}}}, kind: {literal: outer}", 1);
    let generated = compile(&[
        SourceFile {
            path: "allocate.yaml",
            bytes: allocator.as_bytes(),
        },
        SourceFile {
            path: "other.yaml",
            bytes: other.as_bytes(),
        },
        SourceFile {
            path: "observe.yaml",
            bytes: profile.as_bytes(),
        },
        SourceFile {
            path: "ambiguous.yaml",
            bytes: ambiguous.as_bytes(),
        },
        SourceFile {
            path: "conditional.yaml",
            bytes: conditional.as_bytes(),
        },
        SourceFile {
            path: "mixed.yaml",
            bytes: mixed.as_bytes(),
        },
        SourceFile {
            path: "output-only.yaml",
            bytes: output_only.as_bytes(),
        },
        SourceFile {
            path: "cyclic-scope.yaml",
            bytes: cyclic_scope.as_bytes(),
        },
    ])
    .unwrap();
    run_generated(
        generated,
        "attribute-reservation-profile",
        r##"include!("generated.rs");
fn main() {
 use crate::core::xml::attribute_scan::{Preserved,AttributePatch};
 use crate::core::facts::{Generation, FactState};
 let entry=entry_id("test.occupied").unwrap();
 let inputs=prepare_inputs(entry,vec![("owner".into(),InputValue::Text("one".into()))]).unwrap();
 let xml=br#"<a:Root xmlns:a="urn:a" xmlns:b="urn:b" key="1"><Unknown key="2"/><a:Group key="1"><Unknown key="2"/><b:Reset key="1"><Unknown key="2"/></b:Reset><Unknown key="3"/></a:Group><b:Group key="3"/></a:Root>"#;
 let path=[("urn:a","Root")];
 let namespaces=[("a","urn:a"),("b","urn:b")];
 let tree=core::xml::Tree::capture(xml,&path).unwrap().unwrap();
 let patch=core::xml::Patch::read(tree.full_patch_yaml(&namespaces,&[]).unwrap().as_bytes(),&namespaces,&[]).unwrap();
 let number=fact_id("test.occupied-numbers").unwrap();
 let other=fact_id("test.other-numbers").unwrap();
 let build=||fact_builder(Generation(1),core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:100,bytes:1000},rows:100});
 for mode in 0..3 {
  let mut builder=build();
  // Requests precede the late occupied source, as in project preparation.
  for kind in ["outer","inner"] {builder.request_number(number,&[kind,"new","one"],1).unwrap();}
  builder.request_number(other,&["new","one"],1).unwrap();
  let errors=match mode {
   0=>reserve_attribute_source(entry,core::xml::DocumentSource(xml),&inputs,&mut builder,64),
   1=>reserve_attribute_source(entry,&tree,&inputs,&mut builder,64),
   _=>reserve_attribute_source(entry,Preserved{patch:&patch,root:path[0],namespaces:&namespaces},&inputs,&mut builder,64),
  };
  assert!(errors.is_empty(),"{errors:?}");
  let facts=builder.finish();
  for kind in ["outer","inner"] {assert_eq!(facts.lookup_parts(Generation(1),number,&[kind,"new","one"]),FactState::Ready("4"));}
  assert_eq!(facts.lookup_parts(Generation(1),other,&["new","one"]),FactState::Ready("3"));
 }
 // Capture is independent of prepared index inputs; replay binds current owner keys.
 let budget=core::xml::attribute_scan::SnapshotBudget{values:100,bytes:4096};
 let saved=snapshot_attribute_source(entry,core::xml::DocumentSource(xml),64,budget).unwrap();
 let renamed=prepare_inputs(entry,vec![("owner".into(),InputValue::Text("renamed".into()))]).unwrap();
 let mut restored=build();
 restored.request_number(number,&["outer","new","renamed"],1).unwrap();
 let errors=contribute_attribute_snapshot_file(entry,&saved,&renamed,&mut restored,64,budget);
 assert!(errors.is_empty(),"{errors:?}");
 restored.request_number(number,&["outer","new","one"],1).unwrap();
 let restored=restored.finish();
 assert_eq!(restored.lookup_parts(Generation(1),number,&["outer","new","renamed"]),FactState::Ready("4"));
 assert_eq!(restored.lookup_parts(Generation(1),number,&["outer","new","one"]),FactState::Ready("1"));
 let mut bad=build();
 assert!(!contribute_attribute_snapshot_file(entry,b"invalid",&inputs,&mut bad,64,budget).is_empty());
 assert_eq!(bad.finish().lookup_parts(Generation(1),other,&["new","one"]),FactState::Unready);
 // The same compiled profile participates in the real dependency schedule.
 use crate::core::facts::preparation::{MaterialSourceHeader,SourceHeader,SourceKind,LoadedSource,prepare_streaming_materials};
 let headers=[("test.numbering",SourceKind::Ordinary),("test.other-numbering",SourceKind::Ordinary),("test.output-only",SourceKind::AttributeReservations{max_depth:64})].into_iter().map(|(name,kind)|{
  let entry=entry_id(name).unwrap();
  MaterialSourceHeader{source:SourceHeader{entry,direction:Direction::XmlToYaml,inputs:prepare_inputs(entry,vec![("owner".into(),InputValue::Text("one".into()))]).unwrap()},kind}
 }).collect();
 let sources=[b"<Item name='new'/>".as_slice(),b"<Item name='new'/>".as_slice(),xml.as_slice()];
 let mut loaded=vec![];
 let prepared=prepare_streaming_materials::<FactCatalog>(headers,&[],Generation(1),core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:100,bytes:1000},rows:100},100,|slot,_|{
  loaded.push(slot);Ok(LoadedSource{bytes:sources[slot].to_vec(),documents:vec![]})
 }).unwrap();
 loaded.sort();assert_eq!(loaded,[0,1,2]);
 assert_eq!(prepared.facts.lookup_parts(Generation(1),number,&["outer","new","one"]),FactState::Ready("4"));
 assert_eq!(prepared.facts.lookup_parts(Generation(1),other,&["new","one"]),FactState::Ready("3"));
 let retained=SourceKind::AttributeReservationSnapshot{max_depth:64,budget};
 let headers=[("test.numbering",SourceKind::Ordinary),("test.other-numbering",SourceKind::Ordinary),("test.output-only",retained)].into_iter().map(|(name,kind)|{
  let entry=entry_id(name).unwrap();
  MaterialSourceHeader{source:SourceHeader{entry,direction:Direction::YamlToXml,inputs:prepare_inputs(entry,vec![("owner".into(),InputValue::Text("renamed".into()))]).unwrap()},kind}
 }).collect();
 let sources=["Имя: new\n".as_bytes(),"Имя: new\n".as_bytes(),saved.as_slice()];
 let reopened=prepare_streaming_materials::<FactCatalog>(headers,&[],Generation(2),core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:100,bytes:1000},rows:100},100,|slot,_|Ok(LoadedSource{bytes:sources[slot].to_vec(),documents:vec![]})).unwrap();
 assert_eq!(reopened.facts.lookup_parts(Generation(2),number,&["outer","new","renamed"]),FactState::Ready("4"));
 assert_eq!(reopened.facts.lookup_parts(Generation(2),other,&["new","renamed"]),FactState::Ready("3"));
 // Actual scope dependencies still participate in cycle detection.
 let cyclic=entry_id("test.cyclic-scope").unwrap();
 assert!(fact_plan_materials(&[(cyclic,Direction::XmlToYaml,SourceKind::AttributeReservations{max_depth:64})],&[],100).is_err());
 assert!(fact_plan_materials(&[(cyclic,Direction::YamlToXml,retained)],&[],100).is_err());
 let invalid=vec![MaterialSourceHeader{source:SourceHeader{entry,direction:Direction::YamlToXml,inputs:PreparedInputs::default()},kind:SourceKind::AttributeReservations{max_depth:64}}];
 let errors=prepare_streaming_materials::<FactCatalog>(invalid,&[],Generation(1),core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:100,bytes:1000},rows:100},100,|_,_|panic!("invalid direction must not load a source")).err().unwrap();
 assert_eq!(errors[0].code.as_deref(),Some("fact.attribute-direction"));
 // A retained scalar patch carries its owner QName; no XML serialization.
 let scalar=core::xml::Patch::read(b"'1'",&[],&[]).unwrap();
 let mut builder=build();
 let errors=reserve_attribute_source(entry,AttributePatch{patch:&scalar,owner:("urn:b","Reset"),name:("","key")},&inputs,&mut builder,64);
 assert!(errors.is_empty(),"{errors:?}");
 builder.request_number(other,&["new","one"],1).unwrap();
 assert_eq!(builder.finish().lookup_parts(Generation(1),other,&["new","one"]),FactState::Ready("2"));
 // Mounted opaque patches inherit the actual ancestor path without guessed slots.
 let detached=core::xml::Patch::read(b"_key: '1'\nChild: {_key: '2'}\nb:Reset: {_key: '1'}",&namespaces,&[]).unwrap();
 let ancestors=[("urn:a","Root"),("urn:a","Group"),("","Container")];
 let capture=||core::xml::attribute_scan::InContext {
  source:Preserved{patch:&detached,root:("","Unknown"),namespaces:&namespaces},ancestors:&ancestors,
 };
 let saved=snapshot_attribute_source(entry,capture(),64,budget).unwrap();
 for retained in [false,true] {
  let mut builder=build();
  let errors=if retained {contribute_attribute_snapshot_file(entry,&saved,&inputs,&mut builder,64,budget)}
    else {reserve_attribute_source(entry,capture(),&inputs,&mut builder,64)};
  assert!(errors.is_empty(),"{errors:?}");
  for kind in ["outer","inner"] {builder.request_number(number,&[kind,"new","one"],1).unwrap();}
  builder.request_number(other,&["new","one"],1).unwrap();
  let facts=builder.finish();
  assert_eq!(facts.lookup_parts(Generation(1),number,&["outer","new","one"]),FactState::Ready("1"));
  assert_eq!(facts.lookup_parts(Generation(1),number,&["inner","new","one"]),FactState::Ready("3"));
  assert_eq!(facts.lookup_parts(Generation(1),other,&["new","one"]),FactState::Ready("2"));
 }
 let mut builder=build();
 assert!(!reserve_attribute_source(entry,capture(),&inputs,&mut builder,3).is_empty());
 assert_eq!(builder.finish().lookup_parts(Generation(1),number,&["inner","new","one"]),FactState::Unready);
 // Partial input must invalidate every affected index, including the later one.
 for (name,depth,bytes) in [("test.occupied",64,b"<a:Root xmlns:a='urn:a' key='1'><".as_slice()),("test.occupied",64,b"<Unknown key='1'/>".as_slice()),("test.occupied",1,xml.as_slice()),("test.ambiguous",64,xml.as_slice()),("test.conditional",64,xml.as_slice()),("test.mixed",64,xml.as_slice())] {
  let entry=entry_id(name).unwrap();
  let inputs=prepare_inputs(entry,vec![("owner".into(),InputValue::Text("one".into()))]).unwrap();
  let mut builder=build();
  assert!(!reserve_attribute_source(entry,core::xml::DocumentSource(bytes),&inputs,&mut builder,depth).is_empty());
  let facts=builder.finish();
  assert_eq!(facts.lookup_parts(Generation(1),number,&["outer","new","one"]),FactState::Unready);
  assert_eq!(facts.lookup_parts(Generation(1),other,&["new","one"]),FactState::Unready);
 }
}
"##,
    );
}

#[test]
fn nested_yaml_addresses_restore_separate_state_from_a_snapshot() {
    let hidden = include_str!("fixtures/nested-address-snapshot.yaml");
    let shortened = hidden.replace(
        "yaml: {kind: mapping, fields: [{field: name, key: Имя}]}",
        "yaml: {kind: mapping, fields: [{field: name, key: Имя}, {field: token, key: Код}]}",
    ).replacen(
        "  contributions:\n  - index: test.address-identities",
        r#"      omitWhen:
        match:
          value: {lookup: {in: {input: saved}, key: {if: {input: named}, then: {logicalAddress: {parent: {input: parent}, parts: [{field: name}]}}, else: {logicalAddress: {parent: {input: parent}, parts: [{input: position}]}}}}}
          present: {as: found, then: {eq: [{field: token}, {var: found}]}}
          absent: {literal: false}
  contributions:
  - index: test.address-identities"#,
        1,
    );
    for (name, source) in [("hidden", hidden), ("shortened", shortened.as_str())] {
        let generated = compile(&[SourceFile {
            path: "nested-address-snapshot.yaml",
            bytes: source.as_bytes(),
        }])
        .unwrap();
        let main = r##"include!("generated.rs");
fn main(){
 use crate::core::facts::{Generation,FactState};
 let entry=entry_id("test.address-owner").unwrap();
 let index=fact_id("test.address-identities").unwrap();
 let generation=Generation(1);
 fn budget()->core::facts::prepared::FactBudget{core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:20,bytes:4000},rows:20}}
 let empty=std::sync::Arc::new(fact_builder(generation,budget()).finish());
 let initial=prepare_fact_inputs(entry,empty,generation,vec![("parent".into(),InputValue::Text("Владелец.А%2EБ".into()))]).unwrap();
 let xml=b"<Root><List><Item name='same' token='first'/><Item name='same' token='second'/></List><Named><Item name='0' token='numeric-key'/><Item name='a.b[0]%' token='escaped-key'/></Named><Spare>neighbour</Spare></Root>";
 let expected=[("Владелец.А%2EБ.Список%2EА%5B0%5D%25[0]","first"),("Владелец.А%2EБ.Список%2EА%5B0%5D%25[1]","second"),("Владелец.А%2EБ.Имена.0","numeric-key"),("Владелец.А%2EБ.Имена.a%2Eb%5B0%5D%25","escaped-key")];
 let mut builder=fact_builder(generation,budget());
 let errors=contribute_file(entry,Direction::XmlToYaml,xml,&initial,&mut builder);
 assert!(errors.is_empty(),"{errors:?}");
 let projection=entry_id("test.address-projection").unwrap();
 let projected_inputs=prepare_inputs(projection,vec![("parent".into(),InputValue::Text("Владелец.А%2EБ".into()))]).unwrap();
 for (direction,bytes) in [(Direction::XmlToYaml,b"<Projected><Word>projected</Word></Projected>".as_slice()),(Direction::YamlToXml,b"projected".as_slice())] {
  let mut probe=fact_builder(generation,budget());
  assert!(contribute_file(projection,direction,bytes,&projected_inputs,&mut probe).is_empty());
  assert_eq!(probe.finish().lookup(generation,fact_id("test.address-boundaries").unwrap(),"Владелец.А%2EБ"),FactState::Ready("projected"));
 }
 let facts=std::sync::Arc::new(builder.finish());
 assert_eq!(facts.lookup(generation,fact_id("test.address-boundaries").unwrap(),"Владелец.А%2EБ.Список%2EА%5B0%5D%25"),FactState::Ready("list"));
 for (key,value) in expected {assert_eq!(facts.lookup(generation,index,key),FactState::Ready(value),"{key}");}
 let inputs=prepare_fact_inputs(entry,facts,generation,vec![("parent".into(),InputValue::Text("Владелец.А%2EБ".into()))]).unwrap();
 let imported=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
 let snapshot=snapshot_fact_source(entry,xml,&inputs).unwrap();
 assert!(core::facts::retained::xml_payload(&snapshot).is_some(),"hidden state must not be discarded by normal YAML");
 assert_eq!(materialize_fact_source(entry,&snapshot,&initial).unwrap(),snapshot);
 assert_eq!(materialize_fact_source(entry,&imported.bytes,&inputs).unwrap(),snapshot);
 let mut restored=fact_builder(generation,budget());
 let errors=contribute_snapshot_file(entry,&snapshot,&initial,&mut restored);
 assert!(errors.is_empty(),"{errors:?}: {}",String::from_utf8_lossy(&snapshot));
 let restored=std::sync::Arc::new(restored.finish());
 for (key,value) in expected {assert_eq!(restored.lookup(generation,index,key),FactState::Ready(value),"snapshot {key}");}
 let identities=core::facts::identity::OperationIdentity::new([1;32]);
 let format=core::facts::identity::IdentityFormat::Uuid;
 for (key,uuid) in [("Владелец.А%2EБ.Имена.new","15365fe1-c19f-4d7f-aa3f-3daa2a320046"),("Владелец.А%2EБ.Список%2EА%5B0%5D%25[2]","55a9ba24-36c0-41bb-ada9-3a8ab3557365")] {
  let address=core::facts::identity::LogicalAddress::from_encoded(key).unwrap();
  for _ in 0..2 {assert_eq!(identities.resolve(restored.lookup(generation,index,key),"uuid",format,&address),FactState::Ready(std::borrow::Cow::Owned(uuid.to_owned())),"new row {key}");}
 }
 for (key,token) in expected {
  let address=core::facts::identity::LogicalAddress::from_encoded(key).unwrap();
  assert!(matches!(identities.resolve(restored.lookup(generation,index,key),"uuid",format,&address),FactState::Ready(std::borrow::Cow::Borrowed(value)) if value==token),"existing row must preserve its original identity");
 }
 let inputs=prepare_fact_inputs(entry,restored,generation,vec![("parent".into(),InputValue::Text("Владелец.А%2EБ".into()))]).unwrap();
 let exported=convert_file(entry,Direction::YamlToXml,&imported.bytes,&inputs).unwrap();
 core::proof::verify(xml,&exported.bytes, |_|false).unwrap();
 let edited=std::str::from_utf8(&imported.bytes).unwrap().replace("neighbour","changed");
 let expected_xml=std::str::from_utf8(xml).unwrap().replace("neighbour","changed");
 let exported=convert_file(entry,Direction::YamlToXml,edited.as_bytes(),&inputs).unwrap();
 core::proof::verify(expected_xml.as_bytes(),&exported.bytes,|_|false).unwrap();
 let duplicate=b"<Root><List/><Named><Item name='0' token='one'/><Item name='0' token='two'/></Named><Spare>neighbour</Spare></Root>";
 let snapshot=snapshot_fact_source(entry,duplicate,&initial).unwrap();
 assert_eq!(materialize_fact_source(entry,&snapshot,&initial).unwrap(),snapshot,"reopening must preserve duplicate rows again");
 let mut probe=fact_builder(generation,budget());
 assert!(contribute_snapshot_file(entry,&snapshot,&initial,&mut probe).is_empty());
 let facts=probe.finish();
 assert_eq!(facts.lookup(generation,index,"Владелец.А%2EБ.Имена.0"),FactState::Ambiguous,"duplicate names must not choose a row");
 let address=core::facts::identity::LogicalAddress::from_encoded("Владелец.А%2EБ.Имена.0").unwrap();
 assert_eq!(identities.resolve(facts.lookup(generation,index,address.as_str()),"uuid",format,&address),FactState::Ambiguous,"duplicate rows must not receive a new identity");
 assert_eq!(facts.lookup(generation,index,expected[0].0),FactState::Missing,"absent list rows have no identity");
 for bad in [core::facts::retained::encode_xml(b"<Root><".to_vec()),core::facts::retained::encode_xml(b"<Root><List><Item name='same'/></List><Named/><Spare>neighbour</Spare></Root>".to_vec())] {
  let mut probe=fact_builder(generation,budget());
  assert!(!contribute_snapshot_file(entry,&bad,&initial,&mut probe).is_empty());
  assert_eq!(probe.finish().lookup(generation,index,expected[0].0),FactState::Unready);
 }
}
"##;
        let main = if name == "shortened" {
            main.replace("assert!(core::facts::retained::xml_payload(&snapshot).is_some(),\"hidden state must not be discarded by normal YAML\");", "assert!(core::facts::retained::xml_payload(&snapshot).is_none(),\"reversible named rows keep the ordinary YAML snapshot\");")
        } else {
            main.to_owned()
        };
        run_generated(
            generated,
            &format!("nested-yaml-address-snapshot-{name}"),
            &main,
        );
        let shared = nkdk_rule_compiler::compile_shared_catalog(
            &[SourceFile {
                path: "nested-address-snapshot.yaml",
                bytes: source.as_bytes(),
            }],
            |module| module.kind == nkdk_rule_model::ModuleKind::Object,
            nkdk_rule_compiler::SharedCatalogOptions {
                max_rust_bytes: 16 * 1024 * 1024,
            },
        )
        .unwrap();
        let body = main
            .split("fn main(){")
            .nth(1)
            .unwrap()
            .trim_end()
            .strip_suffix('}')
            .unwrap();
        support::shared_catalog::run(
            &format!("shared-nested-yaml-address-snapshot-{name}"),
            shared,
            body,
        );
    }
}
