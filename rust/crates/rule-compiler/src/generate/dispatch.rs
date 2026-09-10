//! Select an operation before creating its value, so stack use does not grow with the catalog.
use super::*;

pub(super) fn generate(entries: &[&LinkedEntry]) -> String {
    let result = "std::result::Result<FileResult, Vec<RuntimeDiagnostic>>";
    let mut source = String::new();
    for entry in entries {
        let id = entry.id;
        for (read, write) in [("xml", "yaml"), ("yaml", "xml")] {
            source.push_str(&format!("#[inline(never)] fn convert_{read}_{id}(source:&[u8],_inputs:&PreparedInputs)->{result} {{ let value=read_{read}_{id}(source,_inputs).map_err(|error|vec![error])?; let diagnostics=check_{read}_{id}(&value,source,_inputs); if diagnostics.iter().any(|error|error.severity==core::Severity::Error) {{return Err(diagnostics);}} let bytes=write_{write}_{id}(&value,_inputs).map_err(|error|vec![error])?;"));
            if read == "xml" {
                source.push_str(&format!("let bytes=finalize_yaml_{id}(source,bytes,&value,_inputs).map_err(|error|vec![error])?;"));
            }
            source.push_str("Ok(FileResult {bytes,diagnostics}) }\n");
        }
        source.push_str(&format!("#[inline(never)] fn validate_{id}(source:&[u8],_inputs:&PreparedInputs)->Vec<RuntimeDiagnostic> {{match read_yaml_{id}(source,_inputs) {{Ok(value)=>check_yaml_{id}(&value,source,_inputs),Err(error)=>vec![error]}}}}\n"));
    }
    source.push_str("pub fn entry_id(name:&str)->Option<EntryId> {match name {\n");
    for entry in entries {
        source.push_str(&format!("{:?}=>Some(EntryId({})),\n", entry.name, entry.id));
    }
    source.push_str("_=>None}}\n");
    source.push_str(&format!("pub fn convert_file(entry:EntryId,direction:Direction,source:&[u8],_inputs:&PreparedInputs)->{result} {{_inputs.check_entry(entry).map_err(|error|vec![error])?;let operation:fn(&[u8],&PreparedInputs)->{result}=match(entry.0,direction) {{\n"));
    for entry in entries {
        for (direction, read) in [("XmlToYaml", "xml"), ("YamlToXml", "yaml")] {
            source.push_str(&format!(
                "({},Direction::{direction})=>convert_{read}_{},\n",
                entry.id, entry.id
            ));
        }
    }
    source.push_str("_=>return Err(vec![RuntimeDiagnostic::new(\"entry.unknown\",\"Unknown generated entry\")])};operation(source,_inputs)}\n");
    source.push_str("pub fn validate_file(entry:EntryId,source:&[u8],_inputs:&PreparedInputs)->Vec<RuntimeDiagnostic> {if let Err(error)=_inputs.check_entry(entry) {return vec![error];} let operation:fn(&[u8],&PreparedInputs)->Vec<RuntimeDiagnostic>=match entry.0 {\n");
    for entry in entries {
        source.push_str(&format!("{}=>validate_{},\n", entry.id, entry.id));
    }
    source.push_str("_=>return vec![RuntimeDiagnostic::new(\"entry.unknown\",\"Unknown generated entry\")]};operation(source,_inputs)}\n");
    source.push_str("pub fn verify_candidate(entry:EntryId,original:&[u8],candidate:&[u8],_inputs:&PreparedInputs)->std::result::Result<(),Vec<RuntimeDiagnostic>> {_inputs.check_entry(entry).map_err(|error|vec![error])?;let operation:fn(&[u8],&[u8],&PreparedInputs)->core::Result<()>=match entry.0 {\n");
    for entry in entries {
        source.push_str(&format!("{}=>verify_{},\n", entry.id, entry.id));
    }
    source.push_str("_=>return Err(vec![RuntimeDiagnostic::new(\"entry.unknown\",\"Unknown generated entry\")])};operation(original,candidate,_inputs).map_err(|error|vec![error])}\n");
    source
}
