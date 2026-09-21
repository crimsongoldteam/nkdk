use super::*;

pub(super) fn generate(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Option<String>, Diagnostic> {
    let Some(usage) = crate::plan::routes::record_usage(entry, program)? else {
        return Ok(None);
    };
    let body = super::value_record::generate(&usage.entry, program, &usage.path, None)?;
    let compact = matches!(usage.entry.yaml, YamlRepresentation::TextPattern(_));
    let projected_singleton = match &usage.entry.yaml {
        YamlRepresentation::Projection(projected) => {
            let LinkedType::Record(fields) = &usage.entry.value else {
                unreachable!("projection is validated against a record")
            };
            fields
                .iter()
                .find(|field| &field.name == projected)
                .and_then(|field| field.value.as_reference())
                .and_then(|(target, _, _)| program.entries.iter().find(|entry| entry.id == target))
                .is_some_and(|entry| {
                    matches!(
                        entry.yaml,
                        YamlRepresentation::Sequence {
                            singleton: true,
                            ..
                        }
                    )
                })
        }
        _ => false,
    };
    let parent = &usage.path[..usage.path.len() - 1];
    let name = usage.path.last().unwrap();
    let mut xml_checks = String::new();
    let mut yaml_checks = String::new();
    let yaml_default = yaml_default(entry, program, &usage.entry, usage.yaml_default.as_ref())?;
    let (canonical_definition, canonical_guard, canonical_plain_guard) =
        canonical(entry, program, &usage.canonical)?;
    for constraint in &usage.required_constraints {
        let message = constraint
            .diagnostic
            .message
            .iter()
            .filter_map(|part| match part {
                LinkedMessagePart::Text(text) => Some(text.as_str()),
                _ => None,
            })
            .collect::<String>();
        let code = constraint.diagnostic.code.as_deref();
        let source = constraint.diagnostic.source.as_deref();
        let severity = super::constraints::severity_name(&constraint.diagnostic.severity);
        let diagnostic = format!(
            "RuntimeDiagnostic::declared({code:?},{source:?},Severity::{severity},{message:?})"
        );
        if constraint.applies_to.contains(&ValidationPhase::XmlImport) {
            xml_checks.push_str(&format!(
                "if value.body.is_none(){{issues.push({diagnostic});}}"
            ));
        }
        if constraint
            .applies_to
            .contains(&ValidationPhase::YamlValidation)
        {
            yaml_checks.push_str(&format!(
                "if value.body.is_none(){{issues.push({diagnostic});}}"
            ));
        }
    }
    Ok(Some(
        RUNTIME
            .replace("@body@", &body.source)
            .replace(
                "@ensure_container@",
                if compact {
                    ""
                } else {
                    "out.ensure_container(@path@);"
                },
            )
            .replace(
                "@read_compact_envelope@",
                if compact { READ_TEXT_ENVELOPE } else { "" },
            )
            .replace(
                "@write_body@",
                if compact {
                    WRITE_TEXT_BODY
                } else if projected_singleton {
                    WRITE_PROJECTED_SINGLETON_BODY
                } else {
                    WRITE_MAPPING_BODY
                },
            )
            .replace(
                "@refined_body@",
                if projected_singleton {
                    REFINED_PROJECTED_SINGLETON_BODY
                } else {
                    REFINED_MAPPING_BODY
                },
            )
            .replace("@canonical_definition@", &canonical_definition)
            .replace("@canonical_guard@", &canonical_guard)
            .replace("@canonical_plain_guard@", &canonical_plain_guard)
            .replace("@path@", &record::path_code(&usage.path))
            .replace("@parent@", &record::path_code(parent))
            .replace("@projected@", &usage.projected.to_string())
            .replace(
                "@yaml_issue_prefix@",
                if usage.projected {
                    ""
                } else {
                    "issue.path.insert(0,@key@.into());"
                },
            )
            .replace(
                "@refined_start@",
                if usage.projected {
                    ""
                } else {
                    "refined.push_str(&core::yaml::mapping_key(@key@));"
                },
            )
            .replace("@key@", &format!("{:?}", usage.key))
            .replace("@physical@", &format!("{:?}", name.local))
            .replace("@namespace@", &format!("{:?}", name.namespace))
            .replace("@xml_empty@", &usage.xml_empty.to_string())
            .replace("@xml_absent_empty@", &usage.xml_absent_empty.to_string())
            .replace("@xml_missing@", &usage.xml_missing.to_string())
            .replace("@yaml_missing@", &usage.yaml_missing.to_string())
            .replace("@yaml_default@", &yaml_default)
            .replace(
                "@xml_required@",
                &usage
                    .required_constraints
                    .iter()
                    .any(|constraint| constraint.applies_to.contains(&ValidationPhase::XmlImport))
                    .to_string(),
            )
            .replace("@xml_checks@", &xml_checks)
            .replace("@yaml_checks@", &yaml_checks)
            .replace("@debug_error@", "")
            .replace("@debug_candidate@", "")
            .replace("@id@", &entry.id.to_string()),
    ))
}

fn yaml_default(
    owner: &LinkedEntry,
    program: &Program,
    target: &LinkedEntry,
    expression: Option<&LinkedExpression>,
) -> Result<String, Diagnostic> {
    let Some(expression) = expression else {
        return Ok("None".into());
    };
    fn lower(
        owner: &LinkedEntry,
        target: &LinkedEntry,
        expression: &LinkedExpression,
        context: &mut expressions::Expressions<'_>,
    ) -> Result<String, Diagnostic> {
        match &expression.kind {
            LinkedExpressionKind::Absent => Ok("None".into()),
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Conditional,
                arguments,
            } => {
                let condition = context.lower(&arguments[0])?;
                let yes = lower(owner, target, &arguments[1], context)?;
                let no = lower(owner, target, &arguments[2], context)?;
                Ok(format!("if {condition} {{{yes}}} else {{{no}}}"))
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Record(names),
                arguments,
            } => {
                let YamlRepresentation::Projection(projected) = &target.yaml else {
                    return Err(unsupported(
                        owner,
                        "Missing record construction currently requires a projected YAML value",
                    ));
                };
                let index = names
                    .iter()
                    .position(|name| name == projected)
                    .ok_or_else(|| {
                        unsupported(owner, "Projected missing record field is absent")
                    })?;
                if !matches!(
                    &arguments[index].kind,
                    LinkedExpressionKind::Operation {
                        operator: LinkedOperator::Sequence,
                        arguments
                    } if arguments.is_empty()
                ) {
                    return Err(unsupported(
                        owner,
                        "Projected missing record currently requires an empty sequence",
                    ));
                }
                Ok(format!(
                    "Some(item_{}::read_yaml(b\"[]\",inputs)?)",
                    owner.id
                ))
            }
            _ => Err(unsupported(
                owner,
                "Missing record expression is not generated",
            )),
        }
    }
    let LinkedType::Record(fields) = &owner.value else {
        unreachable!("record usage has a record owner")
    };
    let mut context = expressions::Expressions::new(owner, program, fields, None);
    let code = lower(owner, target, expression, &mut context)?.replace("_inputs", "inputs");
    Ok(if context.constants.is_empty() {
        code
    } else {
        format!("{{{} {code}}}", context.constants)
    })
}

fn canonical(
    entry: &LinkedEntry,
    program: &Program,
    forms: &[LinkedCanonical],
) -> Result<(String, String, String), Diagnostic> {
    if forms.is_empty() {
        return Ok((String::new(), String::new(), String::new()));
    }
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!("record usage has a record owner")
    };
    let storage = vec![(String::new(), "_value.body.is_some()".into())];
    let mut context = expressions::Expressions::new(entry, program, fields, Some(&storage));
    let mut body = String::new();
    let mut has_fallback = false;
    for form in forms {
        let mode = match form.form {
            XmlForm::Ordinary => 0,
            XmlForm::Missing => 1,
            XmlForm::EmptyElement => 2,
            XmlForm::Nil => {
                return Err(unsupported(
                    entry,
                    "Conditional record nil is not generated",
                ));
            }
        };
        if let Some(when) = &form.when {
            let condition = context.lower(when)?;
            body.push_str(&format!("if {condition}{{return Ok({mode});}}"));
        } else {
            body.push_str(&format!("Ok({mode})"));
            has_fallback = true;
        }
    }
    if !has_fallback {
        body.push_str("Ok(0)");
    }
    let definition = format!(
        "{}fn record_form_{}(_value:&V{},_inputs:&InputView<'_>)->core::Result<u8>{{{body}}}\n",
        context.constants, entry.id, entry.id
    );
    let guard = format!(
        "match record_form_{}(value,inputs)?{{1=>return Ok(()),2=>{{out.ensure_container(@path@);return Ok(())}},_=>{{}}}}",
        entry.id
    );
    let plain_guard = format!(
        "match record_form_{}(value,inputs)?{{1=>return Ok(out.finish_with_root((@path@)[0])),2=>{{out.ensure_container(@path@);return Ok(out.finish_with_root((@path@)[0]))}},_=>{{}}}}",
        entry.id
    );
    Ok((definition, guard, plain_guard))
}

const RUNTIME: &str = r#"
@body@
@canonical_definition@
struct V@id@{body:Option<item_@id@::Stored>,raw:Option<core::xml::Patch>}
struct RecordXmlRead@id@{body:item_@id@::XmlReader,present:bool,content:bool}
impl RecordXmlRead@id@{
#[allow(dead_code)]
fn new()->Self{Self{body:item_@id@::XmlReader::new(),present:false,content:false}}
#[allow(dead_code)]
fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:Option<core::xml::NamespaceScope<'_>>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{
if matches!(token,core::xml::Token::Start(_)) && core::xml::matches(path,@path@){if self.present{return Err(RuntimeDiagnostic::new("xml.duplicate-field","Repeated record"))}self.present=true;}
if path.len()>=(@path@).len() && core::xml::matches(&path[..(@path@).len()],@path@) && ((path.len()>(@path@).len() && matches!(token,core::xml::Token::Start(_))) || matches!(token,core::xml::Token::Text(text) if !text.trim().is_empty())) {self.content=true;}
self.body.consume_scoped(path,token,scope,source,inputs)}
#[allow(dead_code)]
fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{if !self.present && !@xml_missing@{return Err(RuntimeDiagnostic::new("value.missing","Missing record"))}Ok(V@id@{body:if self.present && !( @xml_empty@ && !self.content ){Some(self.body.finish(source,inputs)?)}else{None},raw:None})}
}
struct RecordYamlRead@id@{property:core::yaml::PropertyReader,body:item_@id@::YamlReader}
impl RecordYamlRead@id@{
#[allow(dead_code)]
fn new()->core::Result<Self>{Ok(Self{property:core::yaml::PropertyReader::default(),body:item_@id@::YamlReader::new()?})}
#[allow(dead_code)]
fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{if @projected@{return self.body.consume(node,position,source,inputs)}if let Some(node)=self.property.consume(node,@key@,"yaml.record")?{self.body.consume(node,position,source,inputs)?;}Ok(())}
#[allow(dead_code)]
fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{let present=if @projected@{true}else{self.property.finish("yaml.record")?};if !present && !@yaml_missing@{return Err(RuntimeDiagnostic::new("value.missing","Missing record"))}Ok(V@id@{body:if present{Some(self.body.finish(source,inputs)?)}else{@yaml_default@},raw:None})}
}
#[allow(dead_code)]
fn read_xml_events_@id@(source:&[u8],inputs:&InputView<'_>,events:impl core::xml::ScopedSource)->core::Result<V@id@>{let mut state=RecordXmlRead@id@::new();events.visit_scoped(|path,token,scope|state.consume_scoped(path,token,Some(scope),source,inputs))?;state.finish(source,inputs)}
#[allow(dead_code)]
fn read_yaml_events_@id@(source:&[u8],inputs:&InputView<'_>,events:impl core::yaml::Source)->core::Result<V@id@>{let mut state=RecordYamlRead@id@::new()?;events.visit(|node,position|state.consume(node,position,source,inputs))?;state.finish(source,inputs)}
#[allow(dead_code)]
fn read_xml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{match read_xml_events_@id@(source,inputs,core::xml::DocumentSource(source)){
Ok(value)=>Ok(value),Err(error) if error.code.as_deref().is_some_and(|code|code.starts_with("xml.")||code.starts_with("value."))=>{
@debug_error@
let tree=core::xml::Tree::capture_with_qnames(source,@path@,xml_qname_text_@id@)?;
if tree.is_some(){match item_@id@::recover_xml(source,inputs){Ok(body)=>return Ok(V@id@{body:Some(body),raw:None}),Err(error) if error.code.as_deref().is_some_and(|code|code.starts_with("xml.")||code.starts_with("value."))=>{},Err(error)=>return Err(error)}}
let payload=match tree{Some(tree)=>tree.patch_yaml(None,&[],&xml_qnames_@id@())?,None=>"null".into()};
Ok(V@id@{body:None,raw:Some(core::xml::Patch::read(payload.as_bytes(),&[],&xml_qnames_@id@())?)})},Err(error)=>Err(error)}}
#[allow(dead_code)]
fn read_yaml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{match read_yaml_events_@id@(source,inputs,core::yaml::DocumentSource(if source.is_empty(){b"{}"}else{source})){
Ok(value)=>Ok(value),Err(error)=>{
if let Some(envelope)=core::raw::Property::decode(source,@key@,@physical@)?{
@read_compact_envelope@
let body=core::raw::record_contents(&envelope.meaning,@key@)?.map(|bytes|item_@id@::read_yaml(&bytes,inputs)).transpose()?;
return Ok(V@id@{body,raw:Some(core::xml::Patch::read(&envelope.payload,&[],&xml_qnames_@id@())?)});}
if let Some(bytes)=core::raw::record_contents(source,@key@)?{return item_@id@::read_yaml(&bytes,inputs).map(|body|V@id@{body:Some(body),raw:None});}Err(error)}}}
#[allow(dead_code)]
fn write_yaml_plain_@id@(value:&V@id@,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{
let Some(body)=&value.body else{return Ok(())};if @projected@{return item_@id@::write_yaml(body,inputs,out,indent)}out.push_str(indent);out.push_str(&core::yaml::mapping_key(@key@));@write_body@Ok(())}
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
fn namespaces_xml_@id@<'a>(value:&'a V@id@,prepared:&'a XmlPrepared@id@,names:&mut Vec<&'a str>){if value.body.is_none() && @xml_absent_empty@{for(namespace,_)in @path@{if !namespace.is_empty(){names.push(namespace);}}}if let(Some(value),Some(prepared))=(&value.body,&prepared.body){item_@id@::namespaces(value,prepared,names);}
if let Some(tree)=&prepared.tree{tree.collect_namespaces(names);}}
#[allow(dead_code)]
fn write_xml_into_@id@<'a>(value:&V@id@,prepared:&'a XmlPrepared@id@,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{if value.raw.is_some(){if let Some(tree)=&prepared.tree{tree.write_at(out,@parent@,&xml_qnames_@id@())?;}}else{@canonical_guard@ if let(Some(value),Some(prepared))=(&value.body,&prepared.body){item_@id@::write_xml(value,prepared,inputs,out)?;@ensure_container@}else if @xml_absent_empty@{out.ensure_container(@path@);}}Ok(())}
#[allow(dead_code)]
fn write_plain_xml_@id@(value:&V@id@,prepared:&XmlPrepared@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let mut names=Vec::new();namespaces_xml_@id@(value,prepared,&mut names);let mut out=core::xml::Writer::new(&names);@canonical_plain_guard@ if let(Some(value),Some(prepared))=(&value.body,&prepared.body){item_@id@::write_xml(value,prepared,inputs,&mut out)?;@ensure_container@}else if @xml_absent_empty@{out.ensure_container(@path@);}Ok(out.finish_with_root((@path@)[0]))}
#[allow(dead_code)]
fn write_xml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let prepared=prepare_xml_@id@(value,inputs)?;let mut names=Vec::new();namespaces_xml_@id@(value,&prepared,&mut names);let mut out=core::xml::Writer::new(&names);write_xml_into_@id@(value,&prepared,inputs,&mut out)?;Ok(out.finish_with_root((@path@)[0]))}
#[allow(dead_code)]
fn check_xml_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{let mut issues=value.body.as_ref().map_or_else(Vec::new,|value|item_@id@::check(value,source,inputs,true));@xml_checks@ issues.into_iter().map(|mut issue|{@yaml_issue_prefix@ issue}).collect()}
#[allow(dead_code)]
fn check_yaml_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{let mut issues=value.body.as_ref().map_or_else(Vec::new,|value|item_@id@::check(value,source,inputs,false));@yaml_checks@ issues.into_iter().map(|mut issue|{@yaml_issue_prefix@ issue}).collect()}
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
fn finalize_yaml_@id@(original:&[u8],candidate:Vec<u8>,value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{@debug_candidate@ if !(@xml_required@ && value.body.is_none()){match verify_@id@(original,&candidate,inputs){Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>{},Err(error)=>return Err(error)}}
if value.raw.is_none() && let Some(body)=&value.body{let refined_body=match item_@id@::finalize(original,body,inputs){Ok(body)=>Some(body),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>None,Err(error)=>return Err(error)};if let Some(body)=refined_body{let mut refined=String::new();@refined_start@ if @projected@{refined.extend(std::str::from_utf8(&body).expect("generated YAML").chars());}else{@refined_body@}match verify_@id@(original,refined.as_bytes(),inputs){Ok(())=>return Ok(refined.into_bytes()),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>{},Err(error)=>return Err(error)}}}
let ordinary=write_xml_@id@(&read_yaml_@id@(candidate.as_slice(),inputs)?,inputs)?;let base=core::xml::Tree::capture_with_qnames(&ordinary,@path@,xml_qname_text_@id@)?;let source=core::xml::Tree::capture_with_qnames(original,@path@,xml_qname_text_@id@)?;let payload=match source{Some(tree)=>tree.patch_yaml(base.as_ref(),&[],&xml_qnames_@id@())?,None=>"null".into()};let annotated=core::raw::Property::encode(@key@,@physical@,&candidate,payload.as_bytes())?;verify_@id@(original,&annotated,inputs)?;Ok(annotated)}
"#;

const WRITE_MAPPING_BODY: &str = r#"out.push_str(":\n");let start=out.len();item_@id@::write_yaml(body,inputs,out,&format!("{indent}  "))?;if out.len()==start{out.pop();out.push_str(" {}");}"#;
const WRITE_PROJECTED_SINGLETON_BODY: &str = r#"let mut rendered=String::new();item_@id@::write_yaml(body,inputs,&mut rendered,"")?;if rendered.contains('\n'){out.push_str(":\n");core::yaml::Indented::new(out,&format!("{indent}  ")).push_str(&rendered);}else{out.push_str(": ");out.push_str(&rendered);}"#;
const WRITE_TEXT_BODY: &str =
    r#"out.push_str(": ");item_@id@::write_yaml_inline(body,inputs,out,indent)?;"#;
const REFINED_MAPPING_BODY: &str = r#"refined.push_str(":\n");if body.is_empty(){refined.pop();refined.push_str(" {}");}else{core::yaml::Indented::new(&mut refined,"  ").push_str(std::str::from_utf8(&body).expect("generated YAML"));}"#;
const REFINED_PROJECTED_SINGLETON_BODY: &str = r#"let text=std::str::from_utf8(&body).expect("generated YAML");if text.contains('\n'){refined.push_str(":\n");core::yaml::Indented::new(&mut refined,"  ").push_str(text);}else{refined.push_str(": ");refined.push_str(text);}"#;

const READ_TEXT_ENVELOPE: &str = r#"if let Some(meaning)=core::raw::record_contents(&envelope.meaning,@key@)?{
let document=core::raw::Document::encode(&meaning,&envelope.payload)?;
return item_@id@::read_yaml(&document,inputs).map(|body|V@id@{body:Some(body),raw:None});
}"#;
