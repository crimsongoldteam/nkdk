//! Adapt the existing compiled choice to the same collection-item interface.
use super::*;

fn records(choice: &LinkedEntry, program: &Program) -> Result<Vec<LinkedEntry>, Diagnostic> {
    let LinkedType::Choice(variants) = &choice.value else {
        unreachable!()
    };
    variants
        .iter()
        .map(|variant| {
            let (id, bindings, arguments) = variant.value.as_reference().ok_or_else(|| {
                unsupported(
                    choice,
                    "Collection choice requires declared record variants",
                )
            })?;
            let mut row = program
                .entries
                .iter()
                .find(|entry| entry.id == id)
                .expect("linked variant")
                .clone();
            crate::link::sequence_item::instantiate(&mut row, bindings, arguments)?;
            if !matches!(row.value, LinkedType::Record(_))
                || !matches!(row.yaml, YamlRepresentation::Mapping(_))
            {
                return Err(unsupported(
                    choice,
                    "Collection choice requires record mapping variants",
                ));
            }
            Ok(row)
        })
        .collect()
}

pub(super) fn prototype(
    choice: &LinkedEntry,
    program: &Program,
) -> Result<LinkedEntry, Diagnostic> {
    records(choice, program)?
        .into_iter()
        .next()
        .ok_or_else(|| unsupported(choice, "Collection choice has no variants"))
}

pub(super) fn generate(
    owner: &LinkedEntry,
    prototype: &LinkedEntry,
    choice: &LinkedEntry,
    program: &Program,
    boundary: &[ExpandedName],
    lifted: Option<&(usize, String, Option<String>)>,
) -> Result<value_record::RecordBody, Diagnostic> {
    if lifted.is_some_and(|(_, _, value)| value.is_some()) {
        return Err(unsupported(
            choice,
            "Projected value of a record-choice mapping is not supported",
        ));
    }
    let LinkedType::Record(fields) = &prototype.value else {
        unreachable!()
    };
    let key = lifted.map(|(index, _, _)| fields[*index].name.as_str());
    let variants = records(choice, program)?;
    let mut placed_choice = choice.clone();
    placed_choice.id = program
        .entries
        .iter()
        .map(|entry| entry.id)
        .max()
        .unwrap_or(0)
        + 1;
    let mut proxy = prototype.clone();
    proxy.value = LinkedType::Record(vec![LinkedField {
        name: "value".into(),
        value: LinkedType::Reference(placed_choice.id),
        source: choice.source.clone(),
    }]);
    proxy.xml = LinkedXml::Record(vec![LinkedXmlField {
        file: None,
        field: "value".into(),
        path: boundary.to_vec(),
        attribute: None,
        source: choice.source.clone(),
    }]);
    proxy.yaml = YamlRepresentation::Projection("value".into());
    proxy.presence.clear();
    proxy.constraints.clear();
    let mut scoped = program.entries.clone();
    scoped.push(placed_choice);
    let linked = nkdk_rule_model::Program { entries: scoped };
    let scoped = crate::plan::build(&linked)
        .map_err(|errors| errors.into_iter().next().expect("choice plan diagnostic"))?;
    let id = prototype.id;
    let emitted = choice_value::emit_lifted(
        owner,
        &proxy,
        &scoped,
        id,
        0,
        value_adapters::Placement {
            external: false,
            shared_container: false,
        },
        &[],
        key,
    )?;
    let scalar_routes = variants
        .iter()
        .filter_map(|row| crate::plan::xml_fields(&row.xml))
        .flat_map(|fields| {
            fields
                .iter()
                .filter(|field| field.attribute.is_none())
                .map(|field| {
                    let mut path = boundary.to_vec();
                    path.extend(field.path.iter().cloned());
                    format!("core::xml::matches(path,{})", record::path_code(&path))
                })
        })
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect::<Vec<_>>()
        .join(" || ");
    let mut field_map = String::new();
    for (variant, row) in variants.iter().enumerate() {
        let LinkedType::Record(variant_fields) = &row.value else {
            unreachable!()
        };
        let cases = fields
            .iter()
            .enumerate()
            .filter_map(|(index, field)| {
                variant_fields
                    .iter()
                    .position(|candidate| candidate.name == field.name)
                    .map(|local| format!("{index}=>Some({local}),"))
            })
            .collect::<String>();
        write!(field_map, "{variant}=>match field{{{cases}_=>None}},").unwrap();
    }
    let mapping_functions = if key.is_some() {
        r#"pub(super) fn key_can_be_lifted(value:&Stored)->bool{part_@id@_0::key_can_be_lifted(&value.0)}
pub(super) fn write_mapping_value(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{part_@id@_0::write_mapping_value(&value.0,inputs,out,indent)}"#
    } else {
        r#"pub(super) fn key_can_be_lifted(_value:&Stored)->bool{true}
pub(super) fn write_mapping_value(_value:&Stored,_inputs:&InputView<'_>,_out:&mut String,_indent:&str)->core::Result<()>{unreachable!()}"#
    };
    let code = BODY
        .replace("@choice@", &emitted.source)
        .replace("@contribute@", if super::facts::has_contributions(choice, program) { r#"pub(super) fn contribute(value:&Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>>{part_@id@_0::contribute(&value.0,direction,source,inputs,builder)}"# } else { "" })
        .replace("@fields@", &field_map)
        .replace("@mapping@", mapping_functions)
        .replace("@id@", &id.to_string());
    Ok(value_record::RecordBody {
        source: code,
        scalar_routes,
        constructible: false,
    })
}

const BODY: &str = r#"#[allow(dead_code)] mod item_@id@ {
use super::*;
@choice@
pub(super) struct Stored(part_@id@_0::Stored);
@contribute@
pub(super) struct Prepared(part_@id@_0::Prepared);
fn field_index(value:&Stored,field:usize)->Option<usize>{match part_@id@_0::variant_index(&value.0){@fields@_=>None}}
impl core::inputs::RecordInput for Stored{fn field(&self,field:usize)->Option<core::inputs::InputRef<'_>>{core::inputs::RecordInput::field(&self.0,field_index(self,field)?)}}
pub(super) fn text(value:&Stored,field:usize)->core::Result<&str>{match core::inputs::RecordInput::field(value,field){Some(core::inputs::InputRef::Text(text))=>Ok(text),_=>Err(RuntimeDiagnostic::new("value.missing","Missing text key"))}}
pub(super) fn field_present(value:&Stored,field:usize)->bool{core::inputs::RecordInput::field(value,field).is_some_and(core::inputs::InputRef::is_present)}
pub(super) fn field_has_annotation(value:&Stored,field:usize)->bool{field_index(value,field).is_some_and(|field|part_@id@_0::field_has_annotation(&value.0,field))}
pub(super) fn has_raw(value:&Stored)->bool{part_@id@_0::has_raw(&value.0)}
pub(super) struct XmlReader(part_@id@_0::XmlReader);
impl XmlReader{
pub(super) fn new()->Self{Self(part_@id@_0::XmlReader::new())}
pub(super) fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:Option<core::xml::NamespaceScope<'_>>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{self.0.consume_scoped(path,token,scope,source,inputs)}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{self.0.finish(source,inputs).map(Stored)}
}
pub(super) struct YamlReader(part_@id@_0::YamlReader);
impl YamlReader{
pub(super) fn new()->core::Result<Self>{part_@id@_0::YamlReader::new().map(Self)}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{self.0.consume(node,position,source,inputs)}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{self.0.finish(source,inputs).map(Stored)}
}
pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{part_@id@_0::read_xml(source,inputs,core::xml::DocumentSource(source)).map(Stored)}
pub(super) fn recover_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{part_@id@_0::read_xml_document(source,inputs).map(Stored)}
pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{part_@id@_0::read_yaml_document(source,inputs).map(Stored)}
pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{part_@id@_0::finalize(source,&value.0,inputs)}
pub(super) fn prepare(value:&Stored,inputs:&InputView<'_>)->core::Result<Prepared>{part_@id@_0::prepare(&value.0,inputs).map(Prepared)}
pub(super) fn namespaces<'a>(value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>){part_@id@_0::namespaces(&value.0,&prepared.0,names)}
pub(super) fn write_xml<'a>(value:&Stored,prepared:&'a Prepared,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{part_@id@_0::write_xml(&value.0,&prepared.0,inputs,out)}
pub(super) fn write_yaml(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{part_@id@_0::write_yaml_indented(&value.0,inputs,out,indent)}
@mapping@
pub(super) fn check(value:&Stored,source:&[u8],inputs:&InputView<'_>,xml:bool)->Vec<RuntimeDiagnostic>{if xml{part_@id@_0::check_xml(&value.0,source,inputs)}else{part_@id@_0::check_yaml(&value.0,source,inputs)}}
pub(super) fn scalar(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool{part_@id@_0::scalar_at(&value.0,path,occurrences)}
pub(super) fn qnames()->Vec<(&'static str,&'static str)>{part_@id@_0::qnames()}
pub(super) fn qname_attribute(path:&[core::xml::Name],name:&core::xml::Name)->bool{part_@id@_0::qname_attribute(path,name)}
pub(super) fn qname_text(path:&[core::xml::Name])->bool{part_@id@_0::qname_text(path)}
pub(super) fn qname_text_at(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool{part_@id@_0::qname_text_at(&value.0,path,occurrences)}
}
"#;
