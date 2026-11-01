//! Text documents are a storage choice for declared fields, not a new value codec.
use super::*;
use std::fmt::Write;

/// Follow record references at compilation time; ordinary conversion never
/// searches the declaration graph for external documents.
pub(super) fn has_documents(entry: &LinkedEntry, program: &Program) -> bool {
    fn visit(
        entry: &LinkedEntry,
        program: &Program,
        seen: &mut std::collections::BTreeSet<u32>,
    ) -> bool {
        if !entry.yaml_files.is_empty() {
            return true;
        }
        if !seen.insert(entry.id) {
            return false;
        }
        let LinkedType::Record(fields) = &entry.value else {
            return false;
        };
        fields.iter().any(|field| {
            field
                .value
                .as_reference()
                .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
                .is_some_and(|entry| visit(entry, program, seen))
        })
    }
    visit(entry, program, &mut std::collections::BTreeSet::new())
}

/// File requests use the same lexical bindings as the compiled record body.
pub(super) fn file_paths(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Vec<LinkedExpression>, Diagnostic> {
    fn visit(
        entry: &LinkedEntry,
        program: &Program,
        stack: &mut std::collections::BTreeSet<u32>,
        paths: &mut Vec<LinkedExpression>,
    ) -> Result<(), Diagnostic> {
        if !stack.insert(entry.id) {
            return Ok(());
        }
        paths.extend(entry.yaml_files.iter().map(|file| file.path.clone()));
        if let LinkedType::Record(fields) = &entry.value {
            for field in fields {
                let Some((id, bindings, arguments)) = field.value.as_reference() else {
                    continue;
                };
                let target = program
                    .entries
                    .iter()
                    .find(|entry| entry.id == id)
                    .expect("linked record reference");
                if !has_documents(target, program) {
                    continue;
                }
                let mut target = target.clone();
                crate::link::sequence_item::instantiate(&mut target, bindings, arguments)?;
                visit(&target, program, stack, paths)?;
            }
        }
        stack.remove(&entry.id);
        Ok(())
    }
    let mut paths = Vec::new();
    visit(
        entry,
        program,
        &mut std::collections::BTreeSet::new(),
        &mut paths,
    )?;
    Ok(paths)
}

pub(super) fn record_writer(entry: &LinkedEntry, program: &Program) -> Result<String, Diagnostic> {
    if entry.yaml_files.is_empty() {
        return Ok(String::new());
    }
    let LinkedType::Record(fields) = &entry.value else {
        return Err(unsupported(entry, "Text documents require a record"));
    };
    let id = entry.id;
    let mut out = format!(
        "fn write_yaml_documents_{id}(value:&V{id},_inputs:&InputView<'_>)->core::Result<Vec<(core::resources::RelativePath,Vec<u8>)>>{{let inputs=_inputs;let (limits,mut remaining)=inputs.document_limits();let mut documents=Vec::new();\n"
    );
    for file in &entry.yaml_files {
        let i = file.field as usize;
        let codec = scalar::Codec::resolve(&fields[i].value, entry, program)?;
        let path = resources::path(&file.path, entry)?;
        let text = codec.write_text_reference(&format!("E{id}F{i}"), "field_value", false);
        writeln!(out,"if let Some(field_value)=&value.f{i}{{documents.push(({path},core::resources::copy_document_bytes(({text}).as_bytes(),&mut remaining)?));}}").unwrap();
    }
    out.push_str("let (limits,max_bytes)=inputs.document_limits();let _=inputs.overlay_documents(&documents,limits,max_bytes)?;Ok(documents)}\n");
    Ok(out)
}
