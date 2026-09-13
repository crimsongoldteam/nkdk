use super::*;
use std::fmt::Write;

pub(super) fn generate(
    entry: &LinkedEntry,
    program: &Program,
    codec: &super::text_pattern::Codec<'_>,
    name: &str,
    field_count: usize,
) -> Result<String, Diagnostic> {
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!("text record")
    };
    let fields = &fields[..field_count];
    let storage = fields
        .iter()
        .enumerate()
        .map(|(index, _)| (codec.field_meaning(name, index, "self"), "true".into()))
        .collect::<Vec<_>>();
    let mut expressions = expressions::Expressions::new(entry, program, fields, Some(&storage));
    let mut body = String::new();
    for rule in &entry.constraints {
        if rule.for_each.is_some() || !entry.inputs.is_empty() || !entry.parameters.is_empty() {
            return Err(unsupported(
                entry,
                "Text item checks require specialized inputs and scalar constraints",
            ));
        }
        let xml = rule.applies_to.contains(&ValidationPhase::XmlImport)
            && (rule.forms.is_empty() || rule.forms.contains(&LinkedForm::XmlText));
        let yaml = rule.applies_to.contains(&ValidationPhase::YamlValidation)
            && (rule.forms.is_empty() || rule.forms.contains(&LinkedForm::YamlScalar));
        if !xml && !yaml {
            continue;
        }
        let when = rule
            .when
            .as_ref()
            .map(|value| expressions.lower(value))
            .transpose()?
            .unwrap_or_else(|| "true".into());
        let assertion = expressions.lower(&rule.assertion)?;
        let message = expressions.message(&rule.diagnostic.message)?;
        let code = &rule.diagnostic.code;
        let source = &rule.diagnostic.source;
        let severity = super::constraints::severity_name(&rule.diagnostic.severity);
        let condition = super::constraints::violation(&when, &assertion);
        match (xml, yaml) {
            (true, false) => body.push_str("if xml {"),
            (false, true) => body.push_str("if !xml {"),
            _ => body.push('{'),
        }
        writeln!(body, "let evaluate=||->core::Result<Option<RuntimeDiagnostic>>{{if {condition} {{Ok(Some(RuntimeDiagnostic::declared({code:?},{source:?},core::Severity::{severity},{message})))}}else{{Ok(None)}}}}; match evaluate(){{Ok(Some(issue))|Err(issue)=>errors.push(issue),Ok(None)=>()}} }}").unwrap();
    }
    // Scalar owners currently use lifted constraints; sequences reuse this method.
    if body.is_empty() {
        return Ok(format!(
            "impl {name} {{ fn issues(&self,_xml:bool,_inputs:&PreparedInputs)->Vec<RuntimeDiagnostic>{{Vec::new()}} }}\n"
        ));
    }
    Ok(format!(
        "impl {name} {{ fn issues(&self,xml:bool,_inputs:&PreparedInputs)->Vec<RuntimeDiagnostic>{{ {} let mut errors=Vec::new(); let _=xml; {body} errors }} }}\n",
        expressions.constants
    ))
}
