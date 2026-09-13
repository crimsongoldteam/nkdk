//! Select an operation before creating its value, so stack use does not grow with the catalog.
use super::*;

pub(super) fn generate(entries: &[&LinkedEntry]) -> String {
    let result = "std::result::Result<FileResult, Vec<RuntimeDiagnostic>>";
    let mut source = String::new();
    if entries
        .iter()
        .any(|entry| entry.kind == ModuleKind::Resources)
    {
        source.push_str("fn resource_document_error()->RuntimeDiagnostic {RuntimeDiagnostic::new(\"entry.resource-only\",\"Resource entries do not convert or validate value documents\")}\n");
        source.push_str(&format!("fn convert_resource_document(_source:&[u8],_inputs:&InputView<'_>)->{result} {{Err(vec![resource_document_error()])}}\n"));
        source.push_str("fn validate_resource_document(_source:&[u8],_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic> {vec![resource_document_error()]}\n");
        source.push_str("fn verify_resource_document(_original:&[u8],_candidate:&[u8],_inputs:&InputView<'_>)->core::Result<()> {Err(resource_document_error())}\n");
    }
    for entry in entries
        .iter()
        .filter(|entry| entry.kind == ModuleKind::Object)
    {
        let id = entry.id;
        for (read, write) in [("xml", "yaml"), ("yaml", "xml")] {
            source.push_str(&format!("#[inline(never)] fn convert_{read}_{id}(source:&[u8],_inputs:&InputView<'_>)->{result} {{ let value=read_{read}_{id}(source,_inputs).map_err(|error|vec![error])?; let diagnostics=check_{read}_{id}(&value,source,_inputs); if diagnostics.iter().any(|error|error.severity==core::Severity::Error) {{return Err(diagnostics);}} let bytes=write_{write}_{id}(&value,_inputs).map_err(|error|vec![error])?;"));
            if read == "xml" {
                source.push_str(&format!("let bytes=finalize_yaml_{id}(source,bytes,&value,_inputs).map_err(|error|vec![error])?;"));
            }
            let external = matches!(super::attributes::content(&entry.xml).0, LinkedXml::Record(fields) if fields.iter().any(|field|field.file.is_some()));
            let documents = if read == "yaml" && external {
                format!("write_xml_documents_{id}(&value,_inputs).map_err(|error|vec![error])?")
            } else {
                "Vec::new()".into()
            };
            source.push_str(&format!(
                "Ok(FileResult {{bytes,diagnostics,documents:{documents}}}) }}\n"
            ));
        }
        source.push_str(&format!("#[inline(never)] fn validate_{id}(source:&[u8],_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic> {{match read_yaml_{id}(source,_inputs) {{Ok(value)=>check_yaml_{id}(&value,source,_inputs),Err(error)=>vec![error]}}}}\n"));
    }
    source.push_str("pub fn entry_id(name:&str)->Option<EntryId> {match name {\n");
    for entry in entries {
        source.push_str(&format!("{:?}=>Some(EntryId({})),\n", entry.name, entry.id));
    }
    source.push_str("_=>None}}\n");
    source.push_str(&format!("pub fn convert_file(entry:EntryId,direction:Direction,source:&[u8],_inputs:&PreparedInputs)->{result} {{_inputs.check_entry(entry).map_err(|error|vec![error])?;let operation:fn(&[u8],&InputView<'_>)->{result}=match(entry.0,direction) {{\n"));
    for entry in entries
        .iter()
        .filter(|entry| entry.kind == ModuleKind::Object)
    {
        for (direction, read) in [("XmlToYaml", "xml"), ("YamlToXml", "yaml")] {
            source.push_str(&format!(
                "({},Direction::{direction})=>convert_{read}_{},\n",
                entry.id, entry.id
            ));
        }
    }
    for entry in entries
        .iter()
        .filter(|entry| entry.kind == ModuleKind::Resources)
    {
        source.push_str(&format!("({},_)=>convert_resource_document,\n", entry.id));
    }
    source.push_str("_=>return Err(vec![RuntimeDiagnostic::new(\"entry.unknown\",\"Unknown generated entry\")])};operation(source,&_inputs.view())}\n");
    source.push_str("pub fn validate_file(entry:EntryId,source:&[u8],_inputs:&PreparedInputs)->Vec<RuntimeDiagnostic> {if let Err(error)=_inputs.check_entry(entry) {return vec![error];} let operation:fn(&[u8],&InputView<'_>)->Vec<RuntimeDiagnostic>=match entry.0 {\n");
    for entry in entries
        .iter()
        .filter(|entry| entry.kind == ModuleKind::Object)
    {
        source.push_str(&format!("{}=>validate_{},\n", entry.id, entry.id));
    }
    for entry in entries
        .iter()
        .filter(|entry| entry.kind == ModuleKind::Resources)
    {
        source.push_str(&format!("{}=>validate_resource_document,\n", entry.id));
    }
    source.push_str("_=>return vec![RuntimeDiagnostic::new(\"entry.unknown\",\"Unknown generated entry\")]};operation(source,&_inputs.view())}\n");
    source.push_str("pub fn verify_candidate(entry:EntryId,original:&[u8],candidate:&[u8],_inputs:&PreparedInputs)->std::result::Result<(),Vec<RuntimeDiagnostic>> {_inputs.check_entry(entry).map_err(|error|vec![error])?;let operation:fn(&[u8],&[u8],&InputView<'_>)->core::Result<()>=match entry.0 {\n");
    for entry in entries
        .iter()
        .filter(|entry| entry.kind == ModuleKind::Object)
    {
        source.push_str(&format!("{}=>verify_{},\n", entry.id, entry.id));
    }
    for entry in entries
        .iter()
        .filter(|entry| entry.kind == ModuleKind::Resources)
    {
        source.push_str(&format!("{}=>verify_resource_document,\n", entry.id));
    }
    source.push_str("_=>return Err(vec![RuntimeDiagnostic::new(\"entry.unknown\",\"Unknown generated entry\")])};operation(original,candidate,&_inputs.view()).map_err(|error|vec![error])}\n");
    source
}
