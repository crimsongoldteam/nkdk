//! Select an operation before creating its value, so stack use does not grow with the catalog.
use super::*;

pub(super) fn generate(entries: &[&LinkedEntry], program: &Program) -> String {
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
        let write_import = if let (LinkedXml::Record(xml), YamlRepresentation::Mapping(yaml)) =
            (&entry.xml, &entry.yaml)
        {
            if let ([mapping], [property]) = (xml.as_slice(), yaml.as_slice()) {
                if mapping.attribute.is_none() {
                    let path = super::record::path_code(&mapping.path);
                    let physical = mapping
                        .path
                        .last()
                        .map(|name| name.local.as_str())
                        .unwrap_or("");
                    source.push_str(&format!("fn write_import_yaml_{id}(source:&[u8],value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>>{{match write_yaml_{id}(value,inputs){{Ok(yaml)=>Ok(yaml),Err(error) if error.code.as_deref()==Some(\"yaml.record-mapping\")=>{{let tree=core::xml::Tree::capture_with_qnames(source,{path},xml_qname_text_{id})?.ok_or_else(||RuntimeDiagnostic::expected_xml_property())?;let payload=tree.patch_yaml(None,&[],&xml_qnames_{id}())?;core::raw::Property::encode({:?},{physical:?},b\"\",payload.as_bytes())}},Err(error)=>Err(error)}}}}\n",property.key));
                    true
                } else {
                    false
                }
            } else {
                false
            }
        } else {
            false
        };
        for (read, write) in [("xml", "yaml"), ("yaml", "xml")] {
            let writer = if read == "xml" && write_import {
                format!("write_import_yaml_{id}(source,&value,_inputs)")
            } else {
                format!("write_{write}_{id}(&value,_inputs)")
            };
            source.push_str(&format!("#[inline(never)] fn convert_{read}_{id}(source:&[u8],_inputs:&InputView<'_>)->{result} {{ let value=read_{read}_{id}(source,_inputs).map_err(|error|vec![error])?; let diagnostics=check_{read}_{id}(&value,source,_inputs); if diagnostics.iter().any(|error|error.severity==core::Severity::Error) {{return Err(diagnostics);}} let bytes={writer}.map_err(|error|vec![error])?;"));
            if read == "xml" {
                if super::external_text::has_documents(entry, program) {
                    source.push_str(&format!("let documents=write_yaml_documents_{id}(&value,_inputs).map_err(|error|vec![error])?;let (limits,max_bytes)=_inputs.document_limits();let overlay=_inputs.overlay_documents(&documents,limits,max_bytes).map_err(|error|vec![error])?;let proof_inputs=overlay.view();let bytes=finalize_yaml_{id}(source,bytes,&value,&proof_inputs).map_err(|error|vec![error])?;"));
                } else {
                    source.push_str(&format!("let bytes=finalize_yaml_{id}(source,bytes,&value,_inputs).map_err(|error|vec![error])?;"));
                }
            }
            let external = matches!(super::attributes::content(&entry.xml).0, LinkedXml::Record(fields) if fields.iter().any(|field|field.file.is_some()));
            let documents = if read == "yaml" && external {
                format!("write_xml_documents_{id}(&value,_inputs).map_err(|error|vec![error])?")
            } else if read == "xml" && super::external_text::has_documents(entry, program) {
                "documents".into()
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
    source.push_str("pub fn exported_entries()-> &'static [(&'static str,EntryId)] {&[\n");
    for entry in entries {
        writeln!(source, "({:?},EntryId({})),", entry.name, entry.id).unwrap();
    }
    source.push_str("]}\n");
    let mut exported: Vec<_> = entries.iter().map(|entry| entry.id).collect();
    exported.sort_unstable();
    exported.dedup();
    let ids = exported
        .chunk_by(|left, right| left.checked_add(1) == Some(*right))
        .map(|run| match run {
            [single] => single.to_string(),
            _ => format!("{}..={}", run[0], run[run.len() - 1]),
        })
        .collect::<Vec<_>>()
        .join("|");
    writeln!(
        source,
        "pub fn contains_entry(entry:EntryId)->bool{{matches!(entry.0,{ids})}}"
    )
    .unwrap();
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
