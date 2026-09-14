//! Preserve exceptions at the boundary of a compact record, not invented YAML keys.
use super::*;

pub(in super::super) fn generate(
    entry: &LinkedEntry,
    fields: &[Field<'_>],
    positions: bool,
    boundary: Option<&[ExpandedName]>,
) -> String {
    let root = &fields
        .iter()
        .find(|field| field.xml.is_some())
        .expect("record root")
        .path[0];
    let boundary = boundary.unwrap_or(std::slice::from_ref(root));
    let root = boundary.last().expect("record boundary");
    let empty = (0..fields.len())
        .map(|index| format!("f{index}:None,"))
        .collect::<String>();
    let available = super::selected(entry)
        .into_iter()
        .map(|index| format!("value.f{index}.is_some()"))
        .collect::<Vec<_>>()
        .join("&&");
    RUNTIME
        .replace("@empty@", &empty)
        .replace(
            "@positions@",
            &if positions {
                format!("positions:[core::Position::default();{}],", fields.len())
            } else {
                String::new()
            },
        )
        .replace(
            "@available@",
            if available.is_empty() {
                "true"
            } else {
                &available
            },
        )
        .replace("@root@", &path_code(boundary))
        .replace("@parent@", &path_code(&boundary[..boundary.len() - 1]))
        .replace("@namespace@", &format!("{:?}", root.namespace))
        .replace("@local@", &format!("{:?}", root.local))
        .replace("@slot@", &fields.len().to_string())
        .replace("@id@", &entry.id.to_string())
}

const RUNTIME: &str = r#"
fn empty_text_record_@id@()->V@id@{V@id@{@empty@ @positions@ raw:core::raw::Fields::default()}}
fn text_tree_@id@(source:&[u8])->core::Result<Option<core::xml::Tree>>{
if source.is_empty(){return Ok(None)}
core::xml::Tree::capture_with_qnames(source,@root@,xml_qname_text_@id@)
}
fn text_semantic_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{
if source==b"null"{Ok(empty_text_record_@id@())}else{read_yaml_plain_@id@(source,inputs)}
}
fn read_yaml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{
let error=match read_yaml_plain_@id@(source,inputs){Ok(value)=>return Ok(value),Err(error)=>error};
let Some(envelope)=core::raw::Document::decode(source)? else{return Err(error)};
let mut value=text_semantic_@id@(&envelope.meaning,inputs)?;
value.raw.insert(@slot@,core::xml::Patch::read(&envelope.payload,&[],Q@id@)?);Ok(value)
}
fn read_xml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{
match read_xml_plain_@id@(source,inputs){Ok(value)=>Ok(value),Err(error) if error.code.as_deref().is_some_and(|code|code.starts_with("xml.")||code.starts_with("value."))=>{
let Some(tree)=text_tree_@id@(source)? else{return Err(error)};
let recover=||->core::Result<V@id@>{let mut state=XmlRead@id@::new();core::xml::Source::visit(core::xml::DocumentSource(source),|path,token|match state.consume(path,token){
Err(issue) if matches!(issue.code.as_deref(),Some("xml.unknown-attribute"|"xml.unknown-field"|"xml.unexpected-text"))=>Ok(()),other=>other})?;finish_xml_@id@(state,source,inputs)};
let mut value=match recover(){Ok(value)=>value,Err(issue) if issue.code.as_deref().is_some_and(|code|code.starts_with("xml.")||code.starts_with("value."))=>empty_text_record_@id@(),Err(issue)=>return Err(issue)};
let base=write_xml_plain_@id@(&value,inputs)?;
value.raw.insert(@slot@,core::xml::Patch::read(tree.patch_yaml(text_tree_@id@(&base)?.as_ref(),&[],Q@id@)?.as_bytes(),&[],Q@id@)?);Ok(value)
},Err(error)=>Err(error)}
}
fn write_xml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{
let ordinary=write_xml_plain_@id@(value,inputs)?;
let Some(patch)=value.raw.get(@slot@) else{return Ok(ordinary)};
let tree=patch.apply(text_tree_@id@(&ordinary)?,core::xml::Name{namespace:@namespace@.into(),local:@local@.into()},&[],Q@id@)?;
let mut namespaces=Vec::new();tree.collect_namespaces(&mut namespaces);let mut out=core::xml::Writer::new(&namespaces);tree.write_at(&mut out,@parent@,Q@id@)?;Ok(out.finish())
}
fn preserve_text_record_@id@(meaning:&[u8],expected:&[u8],inputs:&InputView<'_>)->core::Result<Vec<u8>>{
let base=write_xml_plain_@id@(&text_semantic_@id@(meaning,inputs)?,inputs)?;
let tree=text_tree_@id@(expected)?.ok_or_else(||RuntimeDiagnostic::new("xml.owner-root","Expected record root"))?;
let patch=tree.patch_yaml(text_tree_@id@(&base)?.as_ref(),&[],Q@id@)?;
core::raw::Document::encode(meaning,patch.as_bytes())
}
fn write_yaml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{
let mut text=String::new();
let semantic=if @available@ {match write_yaml_except_@id@(value,inputs,&mut text,"",false,None){Ok(())=>text.into_bytes(),Err(error) if error.code.as_deref()==Some("value.text-pattern")=>b"null".to_vec(),Err(error)=>return Err(error)}}else{b"null".to_vec()};
if value.raw.is_empty() && semantic!=b"null"{return Ok(semantic)}
preserve_text_record_@id@(&semantic,&write_xml_@id@(value,inputs)?,inputs)
}
fn finalize_yaml_@id@(original:&[u8],candidate:Vec<u8>,_value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{
match verify_@id@(original,&candidate,inputs){Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>(),Err(error)=>return Err(error)}
let meaning=core::raw::Document::decode(&candidate)?.map_or(candidate,|envelope|envelope.meaning);
let candidate=preserve_text_record_@id@(&meaning,original,inputs)?;verify_@id@(original,&candidate,inputs)?;Ok(candidate)
}
"#;
