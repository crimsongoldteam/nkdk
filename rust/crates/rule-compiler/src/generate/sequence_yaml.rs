use super::*;
use std::fmt::Write;

pub(super) fn generate(
    owner: &LinkedEntry,
    common: &LinkedEntry,
    fields: &[LinkedField],
    key: &str,
    presence: &super::presence::Presence,
    typed: Option<&scalar::Codec<'_>>,
) -> Result<String, Diagnostic> {
    let YamlRepresentation::Sequence {
        item,
        shorthand,
        singleton,
    } = &common.yaml
    else {
        unreachable!()
    };
    let keys = match item.as_ref() {
        YamlRepresentation::Text => None,
        YamlRepresentation::Declared if typed.is_some() => None,
        YamlRepresentation::Mapping(mapping) => Some(
            fields
                .iter()
                .map(|field| {
                    mapping
                        .iter()
                        .find(|mapping| mapping.field == field.name)
                        .expect("linked field")
                        .key
                        .as_str()
                })
                .collect::<Vec<_>>(),
        ),
        _ => {
            return Err(unsupported(
                common,
                "Sequence item YAML requires text or a mapping",
            ));
        }
    };
    let keys_code = keys
        .as_ref()
        .map_or("None".into(), |keys| format!("Some(&{keys:?})"));
    let table = format!(
        "&[{}]",
        shorthand
            .iter()
            .map(|short| format!("({:?}, &{:?})", short.text, short.values))
            .collect::<Vec<_>>()
            .join(",")
    );
    let annotated = !common.constraints.is_empty() || typed.is_some();
    let annotation_guard = if annotated {
        "value.annotations.is_empty() && "
    } else {
        ""
    };
    let mut shorten = String::new();
    for short in shorthand {
        let matches = if short.values.is_empty() {
            "value.rows.is_empty()".into()
        } else {
            format!(
                "value.rows.iter().map(|row|row.fields[0].as_str()).eq({:?})",
                short.values
            )
        };
        writeln!(shorten, "if {annotation_guard}_shorten && value.rows.is_present() && {matches} {{out.push_str(&core::yaml::scalar({key:?}));out.push_str(\": \");out.push_str(&core::yaml::scalar({:?}));return Ok(());}}", short.text).unwrap();
    }
    let id = owner.id;
    let count = fields.len();
    let yaml_value = &presence.yaml_value;
    let can_read_missing = presence.yaml_missing;
    let yaml_write = &presence.yaml_write;
    let required = !presence.yaml_missing;
    let empty_mapping = presence.yaml_empty_mapping;
    let read_value = if annotated {
        format!(
            r#"let mut value=V{id}{{rows:{yaml_value},raw:None,position,annotations,yaml_issues:Vec::new(),declared_issues:Vec::new()}};
value.declared_issues=issues_yaml_{id}(&value,source,_inputs);
let evidence=if value.annotations.is_empty() {{Vec::new()}} else {{issues_xml_{id}(&value,source,_inputs)}};
value.yaml_issues=value.annotations.validate_with_evidence({key:?},std::iter::empty::<(&str,core::Position)>(),value.declared_issues.clone(),&evidence);
Ok(value)"#
        )
    } else {
        format!(
            r#"let _=position;
if !annotations.is_empty() {{return Err(RuntimeDiagnostic::new("annotation.unnecessary","No declared violation supports this annotation"));}}
Ok(V{id}{{rows:{yaml_value},raw:None}})"#
        )
    };
    let checks = if annotated {
        format!(
            r#"fn check_xml_{id}(value:&V{id},source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{issues_xml_{id}(value,source,inputs).into_iter().filter(|issue|issue.kind==core::annotations::IssueKind::Structural || issue.severity!=Severity::Error).collect()}}
fn check_yaml_{id}(value:&V{id},_source:&[u8],_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{value.yaml_issues.clone()}}
fn prepare_yaml_into_{id}(value:&V{id},inputs:&InputView<'_>,shorten:bool,out:&mut String,indent:&str)->core::Result<()>{{
core::yaml::append_properties(out,|out| {{
let start=out.len();emit_yaml_fields_{id}(value,inputs,shorten,&mut core::yaml::Indented::new(out,indent))?;
let mut restored=read_plain_yaml_{id}(&out.as_bytes()[start..],inputs)?;
let mut issues=restored.declared_issues.clone();issues.extend(issues_xml_{id}(value,&[],inputs));
restored.annotations=core::annotations::Mapping::infer({key:?},std::iter::empty::<(&str,core::Position)>(),&issues)?;
if !restored.annotations.is_empty() {{out.truncate(start);emit_yaml_fields_{id}(&restored,inputs,false,&mut core::yaml::Indented::new(out,indent))?;}} Ok(()) }})
}}"#
        )
    } else {
        format!(
            r#"fn check_xml_{id}(_value:&V{id},_source:&[u8],_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{Vec::new()}}
fn check_yaml_{id}(_value:&V{id},_source:&[u8],_inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{Vec::new()}}
fn prepare_yaml_into_{id}(value:&V{id},inputs:&InputView<'_>,shorten:bool,out:&mut String,indent:&str)->core::Result<()>{{core::yaml::append_properties(out,|out|emit_yaml_fields_{id}(value,inputs,shorten,&mut core::yaml::Indented::new(out,indent)))}}"#
        )
    };
    let shortened = format!("{yaml_write}\n{shorten}");
    let tag = if annotated {
        "if let Some(tag)=value.annotations.label(None) {out.push(' ');out.push_str(&tag);}"
    } else {
        ""
    };
    let read_row = if typed.is_some() {
        format!("read_row_{id}(fields,source,position,false,_inputs)")
    } else {
        format!("Ok(R{id}{{fields}})")
    };
    let mut out = format!(
        r#"
fn read_plain_yaml_{id}(source:&[u8], inputs:&InputView<'_>)->core::Result<V{id}> {{
    read_yaml_events_{id}(source,inputs,core::yaml::DocumentSource(if source.is_empty() {{b"{{}}"}} else {{source}}))
}}
fn read_yaml_events_{id}(source:&[u8], _inputs:&InputView<'_>, events:impl core::yaml::Source)->core::Result<V{id}> {{
    let mut state=YamlSequence{id}::new();
    events.visit(|node,position|state.consume(node,position,source,_inputs))?;
    state.finish(source,_inputs)
}}
const SEQUENCE_SHORTHANDS_{id}: &[(&str,&[&str])] = {table};
struct YamlSequence{id} {{property:core::yaml::PropertyReader,rows:core::yaml::SequenceReader<'static,{count},R{id}>}}
impl YamlSequence{id} {{
fn new()->Self{{Self{{property:core::yaml::PropertyReader::default(),rows:core::yaml::SequenceReader::new({keys_code},SEQUENCE_SHORTHANDS_{id},{empty_mapping}).with_singleton({singleton})}}}}
fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{{
let _=source;
if let Some(node)=self.property.consume(node,{key:?},"yaml.collection-form")? {{self.rows.consume(node,position,|fields,position|{{let _=position;{read_row}}})?;}}Ok(())}}
fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{let present=self.property.finish("yaml.collection-form")?;finish_yaml_sequence_{id}(present.then_some(self.rows.finish()?),source,inputs)}}
}}
fn finish_yaml_sequence_{id}(physical:Option<core::yaml::SequenceValues<R{id}>>,source:&[u8],_inputs:&InputView<'_>)->core::Result<V{id}> {{
    let _=source;
    let seen=physical.is_some();
    if !seen && {required} {{return Err(RuntimeDiagnostic::new("value.missing","Missing sequence property"));}}
    let core::yaml::SequenceValues{{rows,form:_form,annotations,position}}=physical.unwrap_or_default();
    {read_value}
}}
{checks}
fn prepare_yaml_{id}(value:&V{id},inputs:&InputView<'_>,shorten:bool)->core::Result<Vec<u8>>{{let mut out=String::new();prepare_yaml_into_{id}(value,inputs,shorten,&mut out,"")?;Ok(out.into_bytes())}}
fn emit_yaml_fields_{id}(value:&V{id},_inputs:&InputView<'_>,_shorten:bool,out:&mut core::yaml::Indented<'_>)->core::Result<()>{{
    let _value=value;
    {shortened}
    if !value.rows.is_present() {{if {can_read_missing} {{return Ok(());}}return Err(RuntimeDiagnostic::new("yaml.presence","No YAML form for absence"));}}
    out.push_str(&core::yaml::scalar({key:?}));out.push(':');
    {tag}
    if value.rows.is_empty() {{out.push_str(" []");}}
    for row in &value.rows {{
        if {singleton} && value.rows.len()==1 {{out.push(' ');}} else {{out.push_str("\n  - ");}}
"#
    );
    if let Some(keys) = keys {
        for (index, key) in keys.iter().enumerate() {
            if index != 0 {
                out.push_str("out.push_str(\"\\n    \");");
            }
            writeln!(out,"out.push_str(&core::yaml::mapping_key({key:?}));out.push_str(\": \");out.push_str(&core::yaml::scalar(&row.fields[{index}]));").unwrap();
        }
    } else {
        let value = typed.map_or("&row.fields[0]".into(), |codec| {
            codec.write_reference(&collection_values::name(id), "row.fields[0]", false)
        });
        writeln!(out, "out.push_str(&core::yaml::scalar({value}));").unwrap();
    }
    out.push_str("} Ok(()) }\n");
    Ok(out)
}
