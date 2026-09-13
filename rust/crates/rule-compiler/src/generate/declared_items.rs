//! Compose a collection with the complete compiled declaration of each item.
use super::*;

pub(super) fn applies(entry: &LinkedEntry, program: &Program) -> bool {
    let LinkedType::Record(fields) = &entry.value else {
        return false;
    };
    if matches!(&entry.xml, LinkedXml::Record(fields) if fields.iter().any(|field| field.file.is_some()))
    {
        return false;
    }
    fields.len()==1 && fields[0].value.as_reference().and_then(|(id,_,_)|program.entries.iter().find(|item|item.id==id)).is_some_and(|item|matches!(&item.yaml,YamlRepresentation::Sequence{item,..} if **item==YamlRepresentation::Declared))
}

pub(super) fn generate(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Option<String>, Diagnostic> {
    if !applies(entry, program) {
        return Ok(None);
    }
    let mut shape = entry.clone();
    shape.presence.clear();
    plain_shape(&shape)?;
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!()
    };
    let (target, bindings, arguments) = fields[0].value.as_reference().unwrap();
    let mut common = program
        .entries
        .iter()
        .find(|item| item.id == target)
        .unwrap()
        .clone();
    crate::link::sequence_item::instantiate(&mut common, bindings, arguments)?;
    let mut row = crate::link::sequence_item::resolve(&common, program)?.expect("referenced item");
    if [&common, &row]
        .iter()
        .any(|contract| !contract.resources.is_empty() || !contract.contributions.is_empty())
    {
        return Err(unsupported(
            entry,
            "Item-local resources and index contributions require their own lifecycle",
        ));
    }
    let (
        LinkedXml::Record(xml),
        LinkedXml::ElementSequence {
            path: relative,
            item,
        },
        YamlRepresentation::Sequence { shorthand, .. },
    ) = (&entry.xml, attributes::content(&common.xml).0, &common.yaml)
    else {
        return Err(unsupported(
            entry,
            "Declared item collection requires record routes and an element sequence",
        ));
    };
    let (key, root_yaml) = match &entry.yaml {
        YamlRepresentation::Mapping(fields) => (fields[0].key.as_str(), false),
        YamlRepresentation::Projection(field) => (field.as_str(), true),
        _ => {
            return Err(unsupported(
                entry,
                "Expected a YAML property or whole-field projection",
            ));
        }
    };
    if **item != LinkedXml::Declared
        || !shorthand.is_empty()
        || !common.constraints.is_empty()
        || !common.shorthands.is_empty()
        || common.normalization.is_some()
        || !entry.constraints.is_empty()
    {
        return Err(unsupported(
            entry,
            "This collection contract requires an additional sequence expression backend",
        ));
    }
    let parent = &xml[0].path;
    if relative.is_empty() || parent.is_empty() || xml[0].attribute.is_some() {
        return Err(unsupported(
            entry,
            "Declared items require an explicit element boundary",
        ));
    }
    let common_attributes = attributes::content(&common.xml).1;
    if common_attributes
        .iter()
        .any(|attribute| attribute.when.is_some())
    {
        return Err(unsupported(
            entry,
            "Conditional collection attributes require value expression support",
        ));
    }
    if common_attributes
        .iter()
        .any(|attribute| matches!(attribute.value, LinkedXmlAttributeValue::QName(_)))
    {
        return Err(unsupported(
            entry,
            "QName collection attributes require a boundary QName catalog",
        ));
    }
    let attribute_values: Vec<_> = common_attributes
        .iter()
        .map(|value| (*value).clone())
        .collect();
    let headers = attributes::static_attributes(&attribute_values);
    let mut namespaces = BTreeSet::new();
    for attribute in &common_attributes {
        namespaces.insert(attribute.name.namespace.clone());
        if let LinkedXmlAttributeValue::QName(name) = &attribute.value {
            namespaces.insert(name.namespace.clone());
        }
    }
    let namespace_code = namespaces
        .iter()
        .filter(|name| !name.is_empty())
        .map(|name| format!("if !names.contains(&{name:?}){{names.push({name:?});}}"))
        .collect::<String>();
    let mut route = parent.clone();
    route.extend(relative.iter().cloned());
    let LinkedXml::Record(row_xml) = &mut row.xml else {
        return Err(unsupported(
            &row,
            "The item requires a record XML representation",
        ));
    };
    for field in row_xml {
        let mut path = route.clone();
        path.extend(field.path.iter().cloned());
        field.path = path;
    }
    row.id = entry.id;
    let LinkedType::Record(row_fields) = &row.value else {
        return Err(unsupported(&row, "The item requires a record value"));
    };
    let composed = row_fields
        .iter()
        .any(|field| scalar::Codec::resolve(&field.value, &row, program).is_err());
    if composed && !owner::state_supported(&row, program)? {
        return Err(unsupported(
            &row,
            "This item representation does not yet support independent event states",
        ));
    }
    let scalar_routes = if let LinkedXml::Record(fields) = &row.xml {
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
    let row_code = if composed {
        owner::generate(&row, program)?
    } else {
        record::generate(&row, program)?
    };
    let checks = if composed {
        String::new()
    } else {
        constraints::generate(&row, program)?
    };
    let presence = collection_presence::override_for(&common, entry, bindings, arguments)?
        .unwrap_or(common.clone());
    if presence.presence.iter().any(|rule| {
        !rule.xml_empty.is_empty()
            || !rule.yaml_empty.is_empty()
            || rule.yaml_omit_when.is_some()
            || !rule.canonical.is_empty()
    }) {
        return Err(unsupported(
            entry,
            "This collection presence contract requires an additional sequence expression backend",
        ));
    }
    let missing = |xml: bool| -> Result<bool, Diagnostic> {
        let rule = presence
            .presence
            .iter()
            .find(|rule| rule.target == LinkedPresenceTarget::SelfValue);
        let value = rule.and_then(|rule| {
            if xml {
                rule.xml_missing.as_ref()
            } else {
                rule.yaml_missing.as_ref()
            }
        });
        match value.map(|v| &v.kind) {
            None => Ok(false),
            Some(LinkedExpressionKind::Absent) => Ok(true),
            _ => Err(unsupported(
                entry,
                "Collection missing values currently require absence",
            )),
        }
    };
    let mut code = RUNTIME
        .replace("@document@", &(parent.len() == 1).to_string())
        .replace("@headers@", &headers)
        .replace("@extra_namespaces@", &namespace_code)
        .replace("@root_yaml@", &root_yaml.to_string())
        .replace("@row@", &row_code)
        .replace(
            "@scalar@",
            if scalar_routes.is_empty() {
                "false"
            } else {
                &scalar_routes
            },
        )
        .replace("@checks@", &checks)
        .replace("@route@", &record::path_code(&route))
        .replace("@depth@", &(route.len() - 1).to_string())
        .replace("@parent@", &record::path_code(parent))
        .replace(
            "@ancestor@",
            &record::path_code(&parent[..parent.len() - 1]),
        )
        .replace("@key@", &format!("{key:?}"))
        .replace("@physical@", &format!("{:?}", parent.last().unwrap().local))
        .replace(
            "@namespace@",
            &format!("{:?}", parent.last().unwrap().namespace),
        )
        .replace("@xml_missing@", &missing(true)?.to_string())
        .replace("@yaml_missing@", &missing(false)?.to_string());
    code = code
        .replace(
            "@prepared@",
            if composed {
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
                "self.0.consume(path,token,(),source,inputs)"
            } else {
                "self.0.consume(path,token)"
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
            if composed { COMPOSED_YAML } else { SCALAR_YAML },
        )
        .replace(
            "@prepare_row@",
            if composed {
                "prepare_xml_plain_@id@"
            } else {
                "prepare_xml_@id@"
            },
        )
        .replace(
            "@namespaces_row@",
            if composed {
                "namespaces_xml_plain_@id@"
            } else {
                "namespaces_xml_@id@"
            },
        )
        .replace(
            "@write_row@",
            if composed {
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
                SCALAR_WRITE
            },
        );
    code = code.replace(
        "@row_scalar@",
        if composed {
            "xml_scalar_at_@id@(&value.0,path,occurrences)"
        } else {
            "let _=occurrences;xml_scalar_@id@(&value.0,path)"
        },
    );
    code = code.replace("@id@", &entry.id.to_string());
    Ok(Some(code))
}

const RUNTIME: &str = r#"
#[allow(dead_code)] mod item_@id@ {
use super::*;
@row@
@checks@
pub(super) struct Stored(V@id@);
pub(super) struct Prepared(@prepared@);
pub(super) struct XmlReader(@xml_state@);
impl XmlReader {
pub(super) fn new()->Self{Self(@xml_state@::new())}
pub(super) fn consume(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,source:&[u8],inputs:&PreparedInputs)->core::Result<()>{let _=(source,inputs);@xml_consume@}
pub(super) fn finish(self,source:&[u8],inputs:&PreparedInputs)->core::Result<Stored>{@xml_finish@.map(Stored)}
}
@yaml_reader@
pub(super) fn read_yaml(source:&[u8],inputs:&PreparedInputs)->core::Result<Stored>{read_yaml_@id@(source,inputs).map(Stored)}
pub(super) fn text(value:&Stored,field:usize)->core::Result<&str>{text_field_@id@(&value.0,field)}
pub(super) fn prepare(value:&Stored,inputs:&PreparedInputs)->core::Result<Prepared>{@prepare_row@(&value.0,inputs).map(Prepared)}
pub(super) fn namespaces<'a>(value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>){@namespaces_row@(&value.0,&prepared.0,names)}
pub(super) fn write_xml<'a>(value:&Stored,prepared:&'a Prepared,inputs:&PreparedInputs,out:&mut core::xml::Writer<'a>)->core::Result<()>{@write_row@(&value.0,&prepared.0,inputs,out)}
pub(super) fn write_yaml(value:&Stored,inputs:&PreparedInputs,out:&mut String,indent:&str)->core::Result<()>{@yaml_write_row@}

pub(super) fn check(value:&Stored,source:&[u8],inputs:&PreparedInputs,xml:bool)->Vec<RuntimeDiagnostic>{if xml{check_xml_@id@(&value.0,source,inputs)}else{check_yaml_@id@(&value.0,source,inputs)}}
pub(super) fn scalar(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool{@row_scalar@}
pub(super) fn qnames()->Vec<(&'static str,&'static str)>{xml_qnames_@id@()}
pub(super) fn qname_attribute(path:&[core::xml::Name],name:&core::xml::Name)->bool{xml_qname_attribute_@id@(path,name)}
pub(super) fn qname_text(path:&[core::xml::Name])->bool{xml_qname_text_@id@(path)}
}
fn decode_raw_@id@(source:&[u8])->core::Result<Option<core::raw::Document>>{if @root_yaml@{core::raw::Document::decode(source)}else{Ok(core::raw::Property::decode(source,@key@,@physical@)?.map(|v|core::raw::Document{meaning:v.meaning,payload:v.payload}))}}
fn encode_raw_@id@(meaning:&[u8],payload:&[u8])->core::Result<Vec<u8>>{if @root_yaml@{core::raw::Document::encode(meaning,payload)}else{core::raw::Property::encode(@key@,@physical@,meaning,payload)}}
struct V@id@{rows:Vec<item_@id@::Stored>,present:bool,raw:Option<core::xml::Patch>}
struct XmlCollection@id@{rows:Vec<item_@id@::Stored>,active:Option<item_@id@::XmlReader>,present:bool}
impl XmlCollection@id@ {
fn new()->Self{Self{rows:Vec::new(),active:None,present:false}}
fn consume(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,source:&[u8],inputs:&PreparedInputs)->core::Result<()>{
if matches!(token,core::xml::Token::Start(_)) && core::xml::matches(path,@parent@){if self.present{return Err(RuntimeDiagnostic::new("xml.duplicate-field","Repeated collection"));}self.present=true;}
if matches!(token,core::xml::Token::Start(_)) && core::xml::matches(path,@route@){if self.active.is_some(){return Err(RuntimeDiagnostic::new("xml.collection-form","Overlapping items"));}self.active=Some(item_@id@::XmlReader::new());}
if let Some(reader)=&mut self.active{reader.consume(path,token,source,inputs)?;}
if matches!(token,core::xml::Token::End) && core::xml::matches(path,@route@){self.rows.push(self.active.take().expect("started item").finish(source,inputs)?);}
Ok(())
}}
fn finish_xml_@id@(state:XmlCollection@id@,_inputs:&PreparedInputs)->core::Result<V@id@>{if state.active.is_some() || (!state.present && !@xml_missing@){return Err(RuntimeDiagnostic::new("value.missing","Missing collection"));}Ok(V@id@{rows:state.rows,present:state.present,raw:None})}
fn read_xml_events_@id@(source:&[u8],inputs:&PreparedInputs,events:impl core::xml::Source,mut other:impl FnMut(&[core::xml::Name],&core::xml::Token<'_>)->core::Result<bool>)->core::Result<V@id@>{let mut state=XmlCollection@id@::new();events.visit(|path,token|{if !other(path,token)?{state.consume(path,token,source,inputs)?;}Ok(())})?;finish_xml_@id@(state,inputs)}
#[allow(dead_code)] fn read_xml_with_@id@(source:&[u8],inputs:&PreparedInputs,other:impl FnMut(&[core::xml::Name],&core::xml::Token<'_>)->core::Result<bool>)->core::Result<V@id@>{read_xml_events_@id@(source,inputs,core::xml::DocumentSource(source),other)}
fn read_xml_@id@(source:&[u8],inputs:&PreparedInputs)->core::Result<V@id@>{match read_xml_events_@id@(source,inputs,core::xml::DocumentSource(source),|_,_|Ok(false)){Ok(value)=>Ok(value),Err(error) if matches!(error.code.as_deref(),Some("xml.unknown-field"|"xml.unknown-attribute"|"xml.unexpected-text"|"xml.duplicate-field"|"value.missing"))=>Ok(V@id@{rows:Vec::new(),present:true,raw:None}),Err(error)=>Err(error)}}
struct YamlSequence@id@{property:core::yaml::PropertyReader,depth:usize,opened:bool,rows:Vec<item_@id@::Stored>,active:Option<item_@id@::YamlReader>,error:Option<RuntimeDiagnostic>}
impl YamlSequence@id@ {
fn new()->Self{Self{property:core::yaml::PropertyReader::default(),depth:0,opened:false,rows:Vec::new(),active:None,error:None}}
fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&PreparedInputs)->core::Result<()>{
let node=if @root_yaml@{node}else{let Some(node)=self.property.consume(node,@key@,"yaml.collection-form")? else{return Ok(())};node};
if self.depth==0{if self.opened || !matches!(node,core::yaml::Node::SequenceStart(None)){return Err(RuntimeDiagnostic::new("yaml.collection-form","Expected a sequence"));}self.opened=true;self.depth=1;return Ok(())}
if self.depth==1 && matches!(node,core::yaml::Node::SequenceEnd){self.depth=0;return Ok(())}
if self.depth==1{self.active=Some(item_@id@::YamlReader::new()?);}
match &node{core::yaml::Node::MappingStart(_)|core::yaml::Node::SequenceStart(_)=>self.depth+=1,core::yaml::Node::MappingEnd|core::yaml::Node::SequenceEnd=>self.depth-=1,_=>{}}
if self.error.is_none() && let Err(error)=self.active.as_mut().expect("started item").consume(node,position,source,inputs){self.error=Some(error);}
if self.depth==1{let reader=self.active.take().expect("started item");let result=match self.error.take(){Some(error)=>Err(error),None=>reader.finish(source,inputs)};
let row=match result{Ok(row)=>row,Err(error)=>{if source.is_empty(){return Err(error);}let bytes=core::yaml::preserved_sequence_item(source,if @root_yaml@{None}else{Some(@key@)},self.rows.len())?;item_@id@::read_yaml(&bytes,inputs)?}};self.rows.push(row);}
Ok(())}
fn finish(self,_source:&[u8],_inputs:&PreparedInputs)->core::Result<V@id@>{let present=if @root_yaml@{self.opened}else{self.property.finish("yaml.collection-form")?};if self.depth!=0 || self.active.is_some() || (!present && !@yaml_missing@){return Err(RuntimeDiagnostic::new("value.missing","Incomplete collection"));}Ok(V@id@{rows:self.rows,present,raw:None})}
}
fn read_yaml_events_@id@(source:&[u8],inputs:&PreparedInputs,events:impl core::yaml::Source)->core::Result<V@id@>{let mut state=YamlSequence@id@::new();events.visit(|node,position|state.consume(node,position,source,inputs))?;state.finish(source,inputs)}
fn read_plain_yaml_@id@(source:&[u8],inputs:&PreparedInputs)->core::Result<V@id@>{if source.is_empty() && @yaml_missing@{return Ok(V@id@{rows:Vec::new(),present:false,raw:None})}read_yaml_events_@id@(source,inputs,core::yaml::DocumentSource(if source.is_empty(){b"{}"}else{source}))}
fn read_yaml_@id@(source:&[u8],inputs:&PreparedInputs)->core::Result<V@id@>{match read_plain_yaml_@id@(source,inputs){Ok(value)=>Ok(value),Err(error)=>{let Some(envelope)=decode_raw_@id@(source)? else{return Err(error)};let mut value=read_plain_yaml_@id@(&envelope.meaning,inputs)?;value.raw=Some(core::xml::Patch::read(&envelope.payload,&[],&item_@id@::qnames())?);Ok(value)}}}
struct PreparedRows@id@{rows:Vec<item_@id@::Prepared>,raw:Option<core::xml::Tree>}
fn prepare_xml_@id@(value:&V@id@,inputs:&PreparedInputs)->core::Result<PreparedRows@id@>{let rows=value.rows.iter().map(|row|item_@id@::prepare(row,inputs)).collect::<core::Result<Vec<_>>>()?;let mut result=PreparedRows@id@{rows,raw:None};if let Some(patch)=&value.raw{let ordinary=write_plain_xml_@id@(value,&result,inputs)?;if !patch.is_null(){result.raw=Some(patch.apply(core::xml::Tree::capture(&ordinary,@parent@)?,core::xml::Name{namespace:@namespace@.into(),local:@physical@.into()},&[],&item_@id@::qnames())?);}}Ok(result)}
fn namespaces_xml_@id@<'a>(value:&'a V@id@,prepared:&'a PreparedRows@id@,names:&mut Vec<&'a str>){@extra_namespaces@for name in @route@{if !name.0.is_empty() && !names.contains(&name.0){names.push(name.0);}}for (row,prepared) in value.rows.iter().zip(&prepared.rows){item_@id@::namespaces(row,prepared,names);}if let Some(tree)=&prepared.raw{tree.collect_namespaces(names);}}
fn write_plain_fields_@id@<'a>(value:&V@id@,prepared:&'a PreparedRows@id@,inputs:&PreparedInputs,out:&mut core::xml::Writer<'a>)->core::Result<()>{if !value.present{return Ok(())}out.container_with_attributes(@parent@,@headers@);for (row,prepared) in value.rows.iter().zip(&prepared.rows){item_@id@::write_xml(row,prepared,inputs,out)?;out.container(@route@);out.end_container();}Ok(())}
fn write_xml_into_@id@<'a>(value:&V@id@,prepared:&'a PreparedRows@id@,inputs:&PreparedInputs,out:&mut core::xml::Writer<'a>)->core::Result<()>{if value.raw.is_some(){if let Some(tree)=&prepared.raw{tree.write_at(out,@ancestor@,&item_@id@::qnames())?;}Ok(())}else{write_plain_fields_@id@(value,prepared,inputs,out)}}
fn write_plain_xml_@id@(value:&V@id@,prepared:&PreparedRows@id@,inputs:&PreparedInputs)->core::Result<Vec<u8>>{if @document@ && !value.present{return Ok(Vec::new())}let mut names=Vec::new();namespaces_xml_@id@(value,prepared,&mut names);let mut out=core::xml::Writer::new(&names);write_plain_fields_@id@(value,prepared,inputs,&mut out)?;Ok(out.finish_with_root((@parent@)[0]))}
fn write_xml_@id@(value:&V@id@,inputs:&PreparedInputs)->core::Result<Vec<u8>>{if @document@ && (!value.present || value.raw.as_ref().is_some_and(|patch|patch.is_null())){return Ok(Vec::new())}let prepared=prepare_xml_@id@(value,inputs)?;let mut names=Vec::new();namespaces_xml_@id@(value,&prepared,&mut names);let mut out=core::xml::Writer::new(&names);write_xml_into_@id@(value,&prepared,inputs,&mut out)?;Ok(out.finish_with_root((@parent@)[0]))}
fn write_yaml_into_@id@(value:&V@id@,inputs:&PreparedInputs,out:&mut String)->core::Result<()>{core::yaml::append_properties(out,|out|write_yaml_indented_@id@(value,inputs,out,"",false))}
fn write_yaml_indented_@id@(value:&V@id@,inputs:&PreparedInputs,out:&mut String,indent:&str,_lift:bool)->core::Result<()>{if !value.present{return Ok(())}
if !@root_yaml@{out.push_str(indent);out.push_str(&core::yaml::scalar(@key@));out.push(':');}
if value.rows.is_empty(){if !@root_yaml@{out.push(' ');}out.push_str("[]");return Ok(())}let row_indent=format!("{indent}{}",if @root_yaml@{"  "}else{"    "});for (index,row) in value.rows.iter().enumerate(){if !@root_yaml@ || index>0{out.push('\n');}out.push_str(indent);out.push_str(if @root_yaml@{"-\n"}else{"  -\n"});let start=out.len();item_@id@::write_yaml(row,inputs,out,&row_indent)?;if out.len()==start{out.push_str(&row_indent);out.push_str("{}");}}Ok(())}
fn write_yaml_@id@(value:&V@id@,inputs:&PreparedInputs)->core::Result<Vec<u8>>{let mut out=String::new();write_yaml_into_@id@(value,inputs,&mut out)?;let bytes=out.into_bytes();if let Some(patch)=&value.raw{encode_raw_@id@(&bytes,patch.to_yaml().as_bytes())}else{Ok(bytes)}}
fn check_rows_@id@(value:&V@id@,source:&[u8],inputs:&PreparedInputs,xml:bool)->Vec<RuntimeDiagnostic>{let mut issues=Vec::new();for (index,row) in value.rows.iter().enumerate(){issues.extend(item_@id@::check(row,source,inputs,xml).into_iter().map(|mut issue|{if !@root_yaml@{issue.path.insert(0,@key@.into());}issue.occurrence=std::num::NonZeroU32::new(index as u32+1);issue}));}issues}
fn check_xml_@id@(value:&V@id@,source:&[u8],inputs:&PreparedInputs)->Vec<RuntimeDiagnostic>{check_rows_@id@(value,source,inputs,true)}
fn check_yaml_@id@(value:&V@id@,source:&[u8],inputs:&PreparedInputs)->Vec<RuntimeDiagnostic>{check_rows_@id@(value,source,inputs,false)}
#[allow(dead_code)] fn xml_scalar_@id@(value:&V@id@,path:&[core::xml::Name])->bool{let _=value;@scalar@}
#[allow(dead_code)] fn xml_qnames_@id@()->Vec<(&'static str,&'static str)>{item_@id@::qnames()}
fn xml_qname_attribute_@id@(path:&[core::xml::Name],name:&core::xml::Name)->bool{item_@id@::qname_attribute(path,name)}
fn xml_qname_text_@id@(path:&[core::xml::Name])->bool{item_@id@::qname_text(path)}
fn xml_scalar_at_@id@(value:&V@id@,path:&[core::xml::Name],occurrences:&[usize])->bool{occurrences.get(@depth@).and_then(|index|value.rows.get(index-1)).is_some_and(|row|item_@id@::scalar(row,path,occurrences))}
fn prove_xml_@id@(value:&V@id@,original:&[u8],restored:&[u8])->core::Result<()>{core::proof::verify_with_occurrences(original,restored,|path,occurrences|xml_scalar_at_@id@(value,path,occurrences),xml_qname_attribute_@id@,xml_qname_text_@id@)}
fn verify_@id@(original:&[u8],candidate:&[u8],inputs:&PreparedInputs)->core::Result<()>{let value=read_yaml_@id@(candidate,inputs)?;if let Some(error)=check_yaml_@id@(&value,candidate,inputs).into_iter().find(|error|error.severity==Severity::Error){return Err(error)}prove_xml_@id@(&value,original,&write_xml_@id@(&value,inputs)?)}
fn finalize_yaml_@id@(original:&[u8],candidate:Vec<u8>,_value:&V@id@,inputs:&PreparedInputs)->core::Result<Vec<u8>>{match verify_@id@(original,&candidate,inputs){Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>{},Err(error)=>return Err(error)}let ordinary=write_xml_@id@(&read_yaml_@id@(&candidate,inputs)?,inputs)?;let base=core::xml::Tree::capture(&ordinary,@parent@)?;let tree=core::xml::Tree::capture(original,@parent@)?;let payload=match tree{Some(tree)=>tree.patch_yaml(base.as_ref(),&[],&item_@id@::qnames())?,None=>"null".into()};let annotated=encode_raw_@id@(&candidate,payload.as_bytes())?;verify_@id@(original,&annotated,inputs)?;Ok(annotated)}
"#;

const SCALAR_YAML: &str = r#"pub(super) struct YamlReader{mapping:core::yaml::ScalarMapping,fields:YamlFields@id@}
impl YamlReader {
pub(super) fn new()->core::Result<Self>{Ok(Self{mapping:core::yaml::ScalarMapping::default(),fields:YamlFields@id@::new(core::raw::Fields::default())?})}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,_source:&[u8],_inputs:&PreparedInputs)->core::Result<()>{if let Some(entry)=self.mapping.consume(node,position)?{self.fields.consume(entry.key,entry.value,entry.tag)?;}Ok(())}
pub(super) fn finish(self,source:&[u8],inputs:&PreparedInputs)->core::Result<Stored>{self.mapping.finish()?;finish_yaml_@id@(self.fields,source,inputs).map(Stored)}
}
"#;
const SCALAR_WRITE: &str = r#"if value.0.raw.is_empty(){write_yaml_indented_@id@(&value.0,inputs,out,indent,false)}else{let bytes=write_yaml_preserved_@id@(&value.0,inputs)?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect("generated YAML"));Ok(())}"#;
const COMPOSED_YAML: &str = r#"
pub(super) struct YamlReader(OwnerYamlRead@id@);
impl YamlReader{
pub(super) fn new()->core::Result<Self>{OwnerYamlRead@id@::new().map(Self)}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&PreparedInputs)->core::Result<()>{self.0.consume(node,position,source,inputs)}
pub(super) fn finish(self,source:&[u8],inputs:&PreparedInputs)->core::Result<Stored>{self.0.finish(source,inputs).map(Stored)}
}
"#;
