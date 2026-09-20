//! The same record body serves a property and a collection element.
use super::*;
use std::{cell::RefCell, collections::BTreeMap};

thread_local! {
    static RECORD_STACK: RefCell<Vec<String>> = const { RefCell::new(Vec::new()) };
    static RECURSIVE_TARGETS: RefCell<BTreeMap<String, u32>> = const { RefCell::new(BTreeMap::new()) };
}

pub(super) struct RecursiveTargets(BTreeMap<String, u32>);
impl RecursiveTargets {
    pub(super) fn enter(targets: BTreeMap<String, u32>) -> Self {
        Self(
            RECURSIVE_TARGETS
                .with(|current| std::mem::replace(&mut *current.borrow_mut(), targets)),
        )
    }
}
impl Drop for RecursiveTargets {
    fn drop(&mut self) {
        RECURSIVE_TARGETS.with(|current| {
            *current.borrow_mut() = std::mem::take(&mut self.0);
        });
    }
}

fn recursive_target(name: &str) -> Option<u32> {
    RECURSIVE_TARGETS.with(|targets| targets.borrow().get(name).copied())
}

struct RecordFrame(String);
impl RecordFrame {
    fn enter(entry: &LinkedEntry) -> Option<Self> {
        let repeated = RECORD_STACK.with(|stack| stack.borrow().contains(&entry.name));
        if repeated && recursive_target(&entry.name).is_some() {
            return None;
        }
        RECORD_STACK.with(|stack| stack.borrow_mut().push(entry.name.clone()));
        Some(Self(entry.name.clone()))
    }
}
impl Drop for RecordFrame {
    fn drop(&mut self) {
        RECORD_STACK.with(|stack| {
            assert_eq!(stack.borrow_mut().pop().as_deref(), Some(self.0.as_str()));
        });
    }
}

pub(super) struct RecordBody {
    pub source: String,
    pub scalar_routes: String,
    pub constructible: bool,
}

fn projected_mapping_write(body: String, value: Option<&str>) -> String {
    let Some(value) = value else { return body };
    format!(
        "let mut projected=String::new();{{let out=&mut projected;(||->core::Result<()>{{{body}}})()?;}}let bytes=core::yaml::mapping_value(projected.as_bytes(),{value:?})?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));Ok(())"
    )
}

pub(super) fn generate(
    row: &LinkedEntry,
    program: &Program,
    boundary: &[ExpandedName],
    lifted: Option<(usize, String, Option<String>)>,
) -> Result<RecordBody, Diagnostic> {
    let Some(_frame) = RecordFrame::enter(row) else {
        return recursive(row, boundary, lifted);
    };
    let LinkedType::Record(row_fields) = &row.value else {
        return Err(unsupported(row, "Expected a record value"));
    };
    let compact = matches!(row.yaml, YamlRepresentation::TextPattern(_));
    let composed = row_fields
        .iter()
        .any(|field| scalar::Codec::resolve(&field.value, row, program).is_err());
    if composed && !owner::state_supported(row, program)? {
        return Err(unsupported(
            row,
            "This item representation does not yet support independent event states",
        ));
    }
    let scalar_routes = if let LinkedXml::Record(fields) = attributes::content(&row.xml).0 {
        fields
            .iter()
            .filter(|field| field.attribute.is_none())
            .map(|field| {
                format!(
                    "core::xml::matches(path,{})",
                    record::path_code(&field.path)
                )
            })
            .collect::<Vec<_>>()
            .join(" || ")
    } else {
        String::new()
    };
    let prepared = (composed && lifted.is_some())
        .then(|| program.composition(row))
        .transpose()?;
    let parts = prepared
        .as_ref()
        .map_or(&[][..], |plan| plan.parts.as_slice());
    let lifted_scope = if parts.is_empty() {
        String::new()
    } else {
        super::value::InputScope::prepare(
            row,
            parts,
            &prepared.as_ref().unwrap().captures,
            program,
        )?
        .bind(row.id, "value.0.", None)
    };
    let lifted_write = match &lifted {
        None => "unreachable!()".into(),
        Some((index, _, value)) if !composed => projected_mapping_write(
            SCALAR_WRITE.replace("@excluded@", &format!("Some({index})")),
            value.as_deref(),
        ),
        Some((index, _, value)) => {
            let mut code = lifted_scope;
            for slot in crate::plan::records::yaml_slots(row, parts) {
                let part = &parts[slot];
                let LinkedType::Record(fields) = &part.value else {
                    unreachable!()
                };
                if let Some(field) = fields
                    .iter()
                    .position(|field| field.name == row_fields[*index].name)
                {
                    code.push_str(&format!("part_@id@_{slot}::write_yaml_except(&value.0.p{slot},inputs,out,indent,{field})?;"));
                } else {
                    code.push_str(&format!("part_@id@_{slot}::write_yaml_indented(&value.0.p{slot},inputs,out,indent)?;"));
                }
            }
            code.push_str("Ok(())");
            projected_mapping_write(code, value.as_deref())
        }
    };
    let key_available = match &lifted {
        None => "true".into(),
        Some((index, _, _)) if !composed => format!("!value.0.raw.has_annotation({index})"),
        Some((index, _, _)) => {
            let (slot, field) = parts
                .iter()
                .enumerate()
                .find_map(|(slot, part)| {
                    let LinkedType::Record(fields) = &part.value else {
                        return None;
                    };
                    fields
                        .iter()
                        .position(|field| field.name == row_fields[*index].name)
                        .map(|field| (slot, field))
                })
                .expect("linked key part");
            format!("!part_@id@_{slot}::field_has_annotation(&value.0.p{slot},{field})")
        }
    };
    let row_code = if composed {
        owner::generate_at(row, program, Some(boundary))?
    } else {
        record::generate_value_at(row, program, boundary)?
    };
    let checks = if composed {
        String::new()
    } else {
        constraints::generate(row, program)?
    };
    let constructible = !composed
        && row_fields.iter().all(|field| {
            scalar::Codec::resolve(&field.value, row, program)
                .is_ok_and(|codec| codec.input_method().is_some())
        });
    let constructor = if constructible {
        "pub(super) fn construct(slots:&[Option<core::inputs::InputRef<'_>>],inputs:&InputView<'_>)->core::Result<Stored>{construct_@id@(slots,inputs).map(Stored)}"
    } else {
        ""
    };
    let scalar_write = if compact {
        "let bytes=write_yaml_@id@(&value.0,inputs)?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));Ok(())".into()
    } else {
        SCALAR_WRITE.replace("@excluded@", "None")
    };
    let mut code = RECORD_BODY
        .replace("@row@", &row_code)
        .replace("@checks@", &checks)
        .replace(
            "@compact_prepared@",
            if compact { TEXT_PREPARED } else { "" },
        )
        .replace("@root_slot@", &row_fields.len().to_string())
        .replace("@boundary@", &record::path_code(boundary))
        .replace(
            "@boundary_parent@",
            &record::path_code(&boundary[..boundary.len() - 1]),
        )
        .replace("@constructor@", constructor);
    code = code
        .replace(
            "@prepared@",
            if compact {
                "TextPrepared@id@"
            } else if composed {
                "OwnerPrepared@id@"
            } else {
                "XmlPrepared@id@"
            },
        )
        .replace(
            "@xml_state@",
            if composed {
                "OwnerXmlRead@id@"
            } else {
                "XmlRead@id@"
            },
        )
        .replace(
            "@xml_consume@",
            if composed {
                "self.0.consume(path,token,scope,source,inputs)"
            } else if compact {
                "self.0.consume(path,token)"
            } else {
                "self.0.consume_scoped(path,token,scope)"
            },
        )
        .replace(
            "@xml_finish@",
            if composed {
                "self.0.finish(source,inputs)"
            } else {
                "finish_xml_@id@(self.0,source,inputs)"
            },
        )
        .replace(
            "@yaml_reader@",
            if composed {
                COMPOSED_YAML
            } else if compact {
                TEXT_YAML
            } else {
                SCALAR_YAML
            },
        )
        .replace(
            "@prepare_row@",
            if compact {
                "prepare_text_xml_@id@"
            } else if composed {
                "prepare_xml_plain_@id@"
            } else {
                "prepare_xml_@id@"
            },
        )
        .replace(
            "@namespaces_row@",
            if compact {
                "namespaces_text_xml_@id@"
            } else if composed {
                "namespaces_xml_plain_@id@"
            } else {
                "namespaces_xml_@id@"
            },
        )
        .replace(
            "@write_row@",
            if compact {
                "write_text_xml_@id@"
            } else if composed {
                "write_xml_plain_into_@id@"
            } else {
                "write_xml_into_@id@"
            },
        )
        .replace(
            "@yaml_write_row@",
            if composed {
                "write_yaml_indented_@id@(&value.0,inputs,out,indent,false)"
            } else {
                &scalar_write
            },
        );
    code = code.replace("@debug_field@", "input_field_@id@(&self.0,index)");
    code = code
        .replace("@lifted_write@", &lifted_write)
        .replace("@key_available@", &key_available);
    code = code.replace(
        "@row_scalar@",
        if composed {
            "xml_scalar_at_@id@(&value.0,path,occurrences)"
        } else {
            "let _=occurrences;xml_scalar_@id@(&value.0,path)"
        },
    );
    code = code.replace("@id@", &row.id.to_string());
    Ok(RecordBody {
        source: code,
        scalar_routes,
        constructible,
    })
}

pub(super) fn recursive_root(id: u32) -> String {
    format!("__nkdk_recursive_{id}")
}

fn recursive(
    row: &LinkedEntry,
    boundary: &[ExpandedName],
    lifted: Option<(usize, String, Option<String>)>,
) -> Result<RecordBody, Diagnostic> {
    if lifted.is_some() || boundary.is_empty() {
        return Err(unsupported(
            row,
            "Recursive keyed records require a separate reusable projection",
        ));
    }
    let id = row.id;
    let target_id = recursive_target(&row.name)
        .ok_or_else(|| unsupported(row, "Recursive record has no reusable declaration target"))?;
    let route = record::path_code(boundary);
    let parent = record::path_code(&boundary[..boundary.len() - 1]);
    let physical = boundary.last().expect("recursive boundary");
    let root = recursive_root(target_id);
    let target = format!("crate::recursive_value_{target_id}::item_{target_id}");
    let source = format!(
        r#"#[allow(dead_code)] mod item_{id} {{
use super::*;
const ROUTE:&[(&str,&str)]={route};
const PARENT:&[(&str,&str)]={parent};
fn virtual_source(source:&[u8],offset:usize)->core::Result<Vec<u8>>{{
let mut tree=core::xml::Tree::capture_at(source,ROUTE,offset)?.ok_or_else(||RuntimeDiagnostic::new("xml.recursive-value","Missing recursive XML value"))?;
tree.rename_root(core::xml::Name{{namespace:String::new(),local:{root:?}.into()}});
tree.document(&qnames())}}
pub(super) struct Stored(Box<{target}::Stored>);
impl core::inputs::RecordInput for Stored{{fn field(&self,index:usize)->Option<core::inputs::InputRef<'_>>{{core::inputs::RecordInput::field(&*self.0,index)}}}}
pub(super) struct Prepared(core::xml::Tree);
pub(super) struct XmlReader{{offset:Option<usize>}}
impl XmlReader{{pub(super) fn new()->Self{{Self{{offset:None}}}}pub(super) fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,_scope:Option<core::xml::NamespaceScope<'_>>,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{{if core::xml::matches(path,ROUTE)&&let core::xml::Token::Start(offset)=token{{if self.offset.replace(*offset).is_some(){{return Err(RuntimeDiagnostic::new("xml.duplicate-field","Repeated recursive value"))}}}}Ok(())}}pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{let offset=self.offset.ok_or_else(||RuntimeDiagnostic::new("value.missing","Missing recursive value"))?;{target}::read_xml(&virtual_source(source,offset)?,inputs).map(|value|Stored(Box::new(value)))}}}}
pub(super) struct YamlReader(Box<{target}::YamlReader>);
impl YamlReader{{pub(super) fn new()->core::Result<Self>{{{target}::YamlReader::new().map(|value|Self(Box::new(value)))}}pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{self.0.consume(node,position,source,inputs)}}pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{self.0.finish(source,inputs).map(|value|Stored(Box::new(value)))}}}}
pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{let mut reader=XmlReader::new();core::xml::visit_scoped(source,|path,token,scope|reader.consume_scoped(path,&token,Some(scope),source,inputs))?;reader.finish(source,inputs)}}
pub(super) fn recover_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{read_xml(source,inputs)}}
pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{{target}::read_yaml(source,inputs).map(|value|Stored(Box::new(value)))}}
pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{{let offset=core::xml::first_offset(source,ROUTE)?.ok_or_else(||RuntimeDiagnostic::new("value.missing","Missing recursive value"))?;{target}::finalize(&virtual_source(source,offset)?,&value.0,inputs)}}
pub(super) fn text(value:&Stored,field:usize)->core::Result<&str>{{{target}::text(&value.0,field)}}
pub(super) fn prepare(value:&Stored,inputs:&InputView<'_>)->core::Result<Prepared>{{let prepared={target}::prepare(&value.0,inputs)?;let mut names=Vec::new();{target}::namespaces(&value.0,&prepared,&mut names);let mut out=core::xml::Writer::new(&names);{target}::write_xml(&value.0,&prepared,inputs,&mut out)?;let bytes=out.finish();let mut tree=core::xml::Tree::capture(&bytes,&[("",{root:?})])?.ok_or_else(||RuntimeDiagnostic::new("xml.recursive-value","Generated recursive value is absent"))?;tree.rename_root(core::xml::Name{{namespace:{:?}.into(),local:{:?}.into()}});Ok(Prepared(tree))}}
pub(super) fn namespaces<'a>(_value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>){{prepared.0.collect_namespaces(names)}}
pub(super) fn write_xml<'a>(_value:&Stored,prepared:&'a Prepared,_inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{{prepared.0.write_at(out,PARENT,&qnames())}}
pub(super) fn write_yaml(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{{{target}::write_yaml(&value.0,inputs,out,indent)}}
pub(super) fn key_can_be_lifted(_value:&Stored)->bool{{false}}
pub(super) fn write_mapping_value(_value:&Stored,_inputs:&InputView<'_>,_out:&mut String,_indent:&str)->core::Result<()>{{Err(RuntimeDiagnostic::new("yaml.recursive-value","Recursive record is not a keyed projection"))}}
pub(super) fn check(value:&Stored,source:&[u8],inputs:&InputView<'_>,xml:bool)->Vec<RuntimeDiagnostic>{{if xml{{Vec::new()}}else{{{target}::check(&value.0,source,inputs,false)}}}}
pub(super) fn scalar(_value:&Stored,_path:&[core::xml::Name],_occurrences:&[usize])->bool{{false}}
thread_local!{{static QNAMES_ACTIVE:std::cell::Cell<bool>=const{{std::cell::Cell::new(false)}};}}
struct QNamesFrame;
impl QNamesFrame{{fn enter()->Option<Self>{{QNAMES_ACTIVE.with(|active|if active.replace(true){{None}}else{{Some(Self)}})}}}}
impl Drop for QNamesFrame{{fn drop(&mut self){{QNAMES_ACTIVE.with(|active|active.set(false));}}}}
pub(super) fn qnames()->Vec<(&'static str,&'static str)>{{let Some(_frame)=QNamesFrame::enter()else{{return Vec::new()}};{target}::qnames()}}
pub(super) fn qname_attribute(_path:&[core::xml::Name],name:&core::xml::Name)->bool{{qnames().contains(&(name.namespace.as_str(),name.local.as_str()))}}
pub(super) fn qname_text(_path:&[core::xml::Name])->bool{{false}}
}}"#,
        physical.namespace, physical.local,
    );
    Ok(RecordBody {
        source,
        scalar_routes: String::new(),
        constructible: false,
    })
}

const RECORD_BODY: &str = r#"#[allow(dead_code)] mod item_@id@ {
use super::*;
@row@
@checks@
@constructor@
@compact_prepared@
pub(super) struct Stored(V@id@);
impl core::inputs::RecordInput for Stored {
fn field(&self,index:usize)->Option<core::inputs::InputRef<'_>>{@debug_field@}
}
pub(super) struct Prepared(@prepared@);
pub(super) struct XmlReader(@xml_state@);
impl XmlReader {
pub(super) fn new()->Self{Self(@xml_state@::new())}
pub(super) fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:Option<core::xml::NamespaceScope<'_>>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{let _=(source,inputs,scope);@xml_consume@}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{@xml_finish@.map(Stored)}
}
@yaml_reader@
pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{read_xml_@id@(source,inputs).map(Stored)}
// Recovery is followed by an XML proof and preservation of every skipped token.
pub(super) fn recover_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{
let mut reader=XmlReader::new();core::xml::visit_scoped(source,|path,token,scope|match reader.consume_scoped(path,&token,Some(scope),source,inputs){
Ok(())=>Ok(()),Err(error) if matches!(error.code.as_deref(),Some("xml.unknown-field"|"xml.unknown-attribute"|"xml.unexpected-text"))=>Ok(()),Err(error)=>Err(error)
})?;reader.finish(source,inputs)
}

pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{read_yaml_@id@(source,inputs).map(Stored)}
pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{finalize_yaml_@id@(source,write_yaml_@id@(&value.0,inputs)?,&value.0,inputs)}
pub(super) fn text(value:&Stored,field:usize)->core::Result<&str>{text_field_@id@(&value.0,field)}
pub(super) fn prepare(value:&Stored,inputs:&InputView<'_>)->core::Result<Prepared>{@prepare_row@(&value.0,inputs).map(Prepared)}
pub(super) fn namespaces<'a>(value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>){@namespaces_row@(&value.0,&prepared.0,names)}
pub(super) fn write_xml<'a>(value:&Stored,prepared:&'a Prepared,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{@write_row@(&value.0,&prepared.0,inputs,out)}
pub(super) fn write_yaml(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{@yaml_write_row@}

pub(super) fn key_can_be_lifted(value:&Stored)->bool{let _=value;@key_available@}
pub(super) fn write_mapping_value(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{let _=(value,inputs,&mut *out,indent);@lifted_write@}
pub(super) fn check(value:&Stored,source:&[u8],inputs:&InputView<'_>,xml:bool)->Vec<RuntimeDiagnostic>{if xml{check_xml_@id@(&value.0,source,inputs)}else{check_yaml_@id@(&value.0,source,inputs)}}
pub(super) fn scalar(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool{@row_scalar@}
pub(super) fn qnames()->Vec<(&'static str,&'static str)>{xml_qnames_@id@()}
pub(super) fn qname_attribute(path:&[core::xml::Name],name:&core::xml::Name)->bool{xml_qname_attribute_@id@(path,name)}
pub(super) fn qname_text(path:&[core::xml::Name])->bool{xml_qname_text_@id@(path)}
}
"#;

const SCALAR_YAML: &str = r#"pub(super) struct YamlReader{mapping:core::yaml::ScalarMapping,fields:YamlFields@id@}
impl YamlReader {
pub(super) fn new()->core::Result<Self>{Ok(Self{mapping:core::yaml::ScalarMapping::default(),fields:YamlFields@id@::new(core::raw::Fields::default())?})}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{if let Some(entry)=self.mapping.consume(node,position)?{self.fields.consume(entry.key,entry.value,entry.tag)?;}Ok(())}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{self.mapping.finish()?;finish_yaml_@id@(self.fields,source,inputs).map(Stored)}
}
"#;
const SCALAR_WRITE: &str = r#"if value.0.raw.is_empty(){write_yaml_except_@id@(&value.0,inputs,out,indent,false,@excluded@)}else{let bytes=write_yaml_preserved_except_@id@(&value.0,inputs,false,@excluded@)?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect("generated YAML"));Ok(())}"#;
const COMPOSED_YAML: &str = r#"
pub(super) struct YamlReader(OwnerYamlRead@id@);
impl YamlReader{
pub(super) fn new()->core::Result<Self>{OwnerYamlRead@id@::new().map(Self)}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{self.0.consume(node,position,source,inputs)}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{self.0.finish(source,inputs).map(Stored)}
}
"#;

const TEXT_YAML: &str = r#"pub(super) struct YamlReader{seen:bool,fields:YamlFields@id@}
impl YamlReader {
pub(super) fn new()->core::Result<Self>{Ok(Self{seen:false,fields:YamlFields@id@::new(core::raw::Fields::default())?})}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{consume_yaml_text_@id@(&mut self.fields,&mut self.seen,node,position)}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{if !self.seen{return Err(RuntimeDiagnostic::new("yaml.expected-text","Missing text record"))}finish_yaml_@id@(self.fields,source,inputs).map(Stored)}
}
"#;

const TEXT_PREPARED: &str = r#"
// Normal compact values write into the parent's buffer. Only anomalies need an envelope.
pub(super) fn write_yaml_inline(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{
let start=out.len();if value.0.raw.is_empty(){match write_yaml_except_@id@(&value.0,inputs,out,"",false,None){Ok(())=>return Ok(()),Err(error) if error.code.as_deref()==Some("value.text-pattern")=>out.truncate(start),Err(error)=>return Err(error)}}
let bytes=write_yaml_@id@(&value.0,inputs)?;let text=std::str::from_utf8(&bytes).expect("generated YAML");
if let Some((first,rest))=text.split_once('\n'){out.push_str(first);out.push('\n');core::yaml::Indented::new(out,&format!("{indent}  ")).push_str(rest);}else{out.push_str(text);}Ok(())}
struct TextPrepared@id@{ordinary:XmlPrepared@id@,tree:Option<core::xml::Tree>}
fn prepare_text_xml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<TextPrepared@id@>{
let ordinary=prepare_xml_@id@(value,inputs)?;
let tree=if value.raw.get(@root_slot@).is_some(){text_tree_@id@(&write_xml_@id@(value,inputs)?)?}else{None};
Ok(TextPrepared@id@{ordinary,tree})}
fn namespaces_text_xml_@id@<'a>(value:&'a V@id@,prepared:&'a TextPrepared@id@,names:&mut Vec<&'a str>){
if let Some(tree)=&prepared.tree{tree.collect_namespaces(names)}else{namespaces_xml_@id@(value,&prepared.ordinary,names)}}
fn write_text_xml_@id@<'a>(value:&V@id@,prepared:&'a TextPrepared@id@,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{
if let Some(tree)=&prepared.tree{tree.write_at(out,@boundary_parent@,Q@id@)}else{write_xml_into_@id@(value,&prepared.ordinary,inputs,out)?;out.ensure_container(@boundary@);Ok(())}}
"#;
