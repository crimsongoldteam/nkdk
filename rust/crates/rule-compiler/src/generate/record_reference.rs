use super::*;

pub(super) fn generate(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Option<String>, Diagnostic> {
    let Some(usage) = crate::plan::routes::record_usage(entry, program)? else {
        return Ok(None);
    };
    let body = super::value_record::generate(&usage.entry, program, None)?;
    let parent = &usage.path[..usage.path.len() - 1];
    let name = usage.path.last().unwrap();
    Ok(Some(
        RUNTIME
            .replace("@body@", &body.source)
            .replace("@path@", &record::path_code(&usage.path))
            .replace("@parent@", &record::path_code(parent))
            .replace("@key@", &format!("{:?}", usage.key))
            .replace("@physical@", &format!("{:?}", name.local))
            .replace("@namespace@", &format!("{:?}", name.namespace))
            .replace("@xml_missing@", &usage.xml_missing.to_string())
            .replace("@yaml_missing@", &usage.yaml_missing.to_string())
            .replace("@id@", &entry.id.to_string()),
    ))
}

const RUNTIME: &str = r#"
@body@
struct V@id@{body:Option<item_@id@::Stored>,raw:Option<core::xml::Patch>}
struct RecordXmlRead@id@{body:item_@id@::XmlReader,present:bool}
impl RecordXmlRead@id@{
#[allow(dead_code)]
fn new()->Self{Self{body:item_@id@::XmlReader::new(),present:false}}
#[allow(dead_code)]
fn consume(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{
if matches!(token,core::xml::Token::Start(_)) && core::xml::matches(path,@path@){if self.present{return Err(RuntimeDiagnostic::new("xml.duplicate-field","Repeated record"))}self.present=true;}
self.body.consume(path,token,source,inputs)}
#[allow(dead_code)]
fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{if !self.present && !@xml_missing@{return Err(RuntimeDiagnostic::new("value.missing","Missing record"))}Ok(V@id@{body:if self.present{Some(self.body.finish(source,inputs)?)}else{None},raw:None})}
}
struct RecordYamlRead@id@{property:core::yaml::PropertyReader,body:item_@id@::YamlReader}
impl RecordYamlRead@id@{
#[allow(dead_code)]
fn new()->core::Result<Self>{Ok(Self{property:core::yaml::PropertyReader::default(),body:item_@id@::YamlReader::new()?})}
#[allow(dead_code)]
fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{if let Some(node)=self.property.consume(node,@key@,"yaml.record")?{self.body.consume(node,position,source,inputs)?;}Ok(())}
#[allow(dead_code)]
fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{let present=self.property.finish("yaml.record")?;if !present && !@yaml_missing@{return Err(RuntimeDiagnostic::new("value.missing","Missing record"))}Ok(V@id@{body:if present{Some(self.body.finish(source,inputs)?)}else{None},raw:None})}
}
#[allow(dead_code)]
fn read_xml_events_@id@(source:&[u8],inputs:&InputView<'_>,events:impl core::xml::Source)->core::Result<V@id@>{let mut state=RecordXmlRead@id@::new();events.visit(|path,token|state.consume(path,token,source,inputs))?;state.finish(source,inputs)}
#[allow(dead_code)]
fn read_yaml_events_@id@(source:&[u8],inputs:&InputView<'_>,events:impl core::yaml::Source)->core::Result<V@id@>{let mut state=RecordYamlRead@id@::new()?;events.visit(|node,position|state.consume(node,position,source,inputs))?;state.finish(source,inputs)}
#[allow(dead_code)]
fn read_xml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{match read_xml_events_@id@(source,inputs,core::xml::DocumentSource(source)){
Ok(value)=>Ok(value),Err(error) if error.code.as_deref().is_some_and(|code|code.starts_with("xml.")||code.starts_with("value."))=>{
let tree=core::xml::Tree::capture_with_qnames(source,@path@,xml_qname_text_@id@)?;
let payload=match tree{Some(tree)=>tree.patch_yaml(None,&[],&xml_qnames_@id@())?,None=>"null".into()};
Ok(V@id@{body:None,raw:Some(core::xml::Patch::read(payload.as_bytes(),&[],&xml_qnames_@id@())?)})},Err(error)=>Err(error)}}
#[allow(dead_code)]
fn read_yaml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{match read_yaml_events_@id@(source,inputs,core::yaml::DocumentSource(if source.is_empty(){b"{}"}else{source})){
Ok(value)=>Ok(value),Err(error)=>{
if let Some(envelope)=core::raw::Property::decode(source,@key@,@physical@)?{
let body=core::raw::record_contents(&envelope.meaning,@key@)?.map(|bytes|item_@id@::read_yaml(&bytes,inputs)).transpose()?;
return Ok(V@id@{body,raw:Some(core::xml::Patch::read(&envelope.payload,&[],&xml_qnames_@id@())?)});}
if let Some(bytes)=core::raw::record_contents(source,@key@)?{return item_@id@::read_yaml(&bytes,inputs).map(|body|V@id@{body:Some(body),raw:None});}Err(error)}}}
#[allow(dead_code)]
fn write_yaml_plain_@id@(value:&V@id@,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{
let Some(body)=&value.body else{return Ok(())};out.push_str(indent);out.push_str(&core::yaml::mapping_key(@key@));out.push_str(":\n");let start=out.len();item_@id@::write_yaml(body,inputs,out,&format!("{indent}  "))?;if out.len()==start{out.pop();out.push_str(" {}");}Ok(())}
#[allow(dead_code)]
fn write_yaml_indented_@id@(value:&V@id@,inputs:&InputView<'_>,out:&mut String,indent:&str,_lift:bool)->core::Result<()>{
if let Some(patch)=&value.raw{let mut meaning=String::new();write_yaml_plain_@id@(value,inputs,&mut meaning,"")?;let payload=patch.to_yaml();let bytes=core::raw::Property::encode(@key@,@physical@,meaning.as_bytes(),payload.as_bytes())?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect("generated YAML"));Ok(())}else{write_yaml_plain_@id@(value,inputs,out,indent)}}
#[allow(dead_code)]
fn write_yaml_into_@id@(value:&V@id@,inputs:&InputView<'_>,out:&mut String)->core::Result<()>{core::yaml::append_properties(out,|out|write_yaml_indented_@id@(value,inputs,out,"",false))}
#[allow(dead_code)]
fn write_yaml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let mut out=String::new();write_yaml_into_@id@(value,inputs,&mut out)?;Ok(out.into_bytes())}
struct XmlPrepared@id@{body:Option<item_@id@::Prepared>,tree:Option<core::xml::Tree>}
#[allow(dead_code)]
fn prepare_xml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<XmlPrepared@id@>{
let body=value.body.as_ref().map(|value|item_@id@::prepare(value,inputs)).transpose()?;
let mut prepared=XmlPrepared@id@{body,tree:None};if let Some(patch)=&value.raw{if patch.is_null(){return Ok(prepared)}let bytes=write_plain_xml_@id@(value,&prepared,inputs)?;let base=core::xml::Tree::capture_with_qnames(&bytes,@path@,xml_qname_text_@id@)?;prepared.tree=Some(patch.apply(base,core::xml::Name{namespace:@namespace@.into(),local:@physical@.into()},&[],&xml_qnames_@id@())?);}Ok(prepared)}
#[allow(dead_code)]
fn namespaces_xml_@id@<'a>(value:&'a V@id@,prepared:&'a XmlPrepared@id@,names:&mut Vec<&'a str>){if let(Some(value),Some(prepared))=(&value.body,&prepared.body){item_@id@::namespaces(value,prepared,names);}if let Some(tree)=&prepared.tree{tree.collect_namespaces(names);}}
#[allow(dead_code)]
fn write_xml_into_@id@<'a>(value:&V@id@,prepared:&'a XmlPrepared@id@,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{if value.raw.is_some(){if let Some(tree)=&prepared.tree{tree.write_at(out,@parent@,&xml_qnames_@id@())?;}}else if let(Some(value),Some(prepared))=(&value.body,&prepared.body){item_@id@::write_xml(value,prepared,inputs,out)?;out.ensure_container(@path@);}Ok(())}
#[allow(dead_code)]
fn write_plain_xml_@id@(value:&V@id@,prepared:&XmlPrepared@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let mut names=Vec::new();namespaces_xml_@id@(value,prepared,&mut names);let mut out=core::xml::Writer::new(&names);if let(Some(value),Some(prepared))=(&value.body,&prepared.body){item_@id@::write_xml(value,prepared,inputs,&mut out)?;out.ensure_container(@path@);}Ok(out.finish_with_root((@path@)[0]))}
#[allow(dead_code)]
fn write_xml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let prepared=prepare_xml_@id@(value,inputs)?;let mut names=Vec::new();namespaces_xml_@id@(value,&prepared,&mut names);let mut out=core::xml::Writer::new(&names);write_xml_into_@id@(value,&prepared,inputs,&mut out)?;Ok(out.finish_with_root((@path@)[0]))}
#[allow(dead_code)]
fn check_xml_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{value.body.as_ref().map_or_else(Vec::new,|value|item_@id@::check(value,source,inputs,true)).into_iter().map(|mut issue|{issue.path.insert(0,@key@.into());issue}).collect()}
#[allow(dead_code)]
fn check_yaml_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{value.body.as_ref().map_or_else(Vec::new,|value|item_@id@::check(value,source,inputs,false)).into_iter().map(|mut issue|{issue.path.insert(0,@key@.into());issue}).collect()}
#[allow(dead_code)]
fn xml_scalar_at_@id@(value:&V@id@,path:&[core::xml::Name],occurrences:&[usize])->bool{value.body.as_ref().is_some_and(|value|item_@id@::scalar(value,path,occurrences))}
#[allow(dead_code)]
fn xml_scalar_@id@(value:&V@id@,path:&[core::xml::Name])->bool{xml_scalar_at_@id@(value,path,&[])}
#[allow(dead_code)]
fn xml_qnames_@id@()->Vec<(&'static str,&'static str)>{item_@id@::qnames()}
#[allow(dead_code)]
fn xml_qname_attribute_@id@(path:&[core::xml::Name],name:&core::xml::Name)->bool{item_@id@::qname_attribute(path,name)}
#[allow(dead_code)]
fn xml_qname_text_@id@(path:&[core::xml::Name])->bool{item_@id@::qname_text(path)}
#[allow(dead_code)]
fn prove_xml_@id@(value:&V@id@,original:&[u8],restored:&[u8])->core::Result<()>{core::proof::verify_with_occurrences(original,restored,|path,occurrences|xml_scalar_at_@id@(value,path,occurrences),xml_qname_attribute_@id@,xml_qname_text_@id@)}
#[allow(dead_code)]
fn verify_@id@(original:&[u8],candidate:&[u8],inputs:&InputView<'_>)->core::Result<()>{let value=read_yaml_@id@(candidate,inputs)?;if let Some(error)=check_yaml_@id@(&value,candidate,inputs).into_iter().find(|error|error.severity==Severity::Error){return Err(error)}prove_xml_@id@(&value,original,&write_xml_@id@(&value,inputs)?)}
#[allow(dead_code)]
fn finalize_yaml_@id@(original:&[u8],candidate:Vec<u8>,value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{match verify_@id@(original,&candidate,inputs){Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>{},Err(error)=>return Err(error)}
if value.raw.is_none() && let Some(body)=&value.body{let body=item_@id@::finalize(original,body,inputs)?;let mut refined=String::new();refined.push_str(&core::yaml::mapping_key(@key@));refined.push_str(":\n");if body.is_empty(){refined.pop();refined.push_str(" {}");}else{core::yaml::Indented::new(&mut refined,"  ").push_str(std::str::from_utf8(&body).expect("generated YAML"));}match verify_@id@(original,refined.as_bytes(),inputs){Ok(())=>return Ok(refined.into_bytes()),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>{},Err(error)=>return Err(error)}}
let ordinary=write_xml_@id@(&read_yaml_@id@(candidate.as_slice(),inputs)?,inputs)?;let base=core::xml::Tree::capture_with_qnames(&ordinary,@path@,xml_qname_text_@id@)?;let source=core::xml::Tree::capture_with_qnames(original,@path@,xml_qname_text_@id@)?;let payload=match source{Some(tree)=>tree.patch_yaml(base.as_ref(),&[],&xml_qnames_@id@())?,None=>"null".into()};let annotated=core::raw::Property::encode(@key@,@physical@,&candidate,payload.as_bytes())?;verify_@id@(original,&annotated,inputs)?;Ok(annotated)}
"#;
