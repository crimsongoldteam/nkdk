use super::*;

pub(super) fn generate(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Option<String>, Diagnostic> {
    generate_lifted(entry, program, None)
}

pub(super) fn generate_lifted(
    entry: &LinkedEntry,
    program: &Program,
    key: Option<&str>,
) -> Result<Option<String>, Diagnostic> {
    let Some(usage) = crate::plan::routes::record_usage(entry, program)? else {
        return Ok(None);
    };
    // A projected library value owns this XML boundary. A projected file
    // still owns the entire document, so a nested patch must keep its route.
    let projected_value = usage.projected
        && (!matches!(usage.entry.yaml, YamlRepresentation::Mapping(_))
            || entry.kind != ModuleKind::Object);
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!()
    };
    let (target, bindings, _) = fields[0].value.as_reference().expect("record usage");
    let original = program
        .entries
        .iter()
        .find(|value| value.id == target)
        .expect("linked record");
    let scoped = super::scoped_inputs::rebind(original, bindings, program)?;
    let scoped_plan = super::scoped_inputs::plan(scoped.as_ref())?;
    let program = scoped_plan.as_ref().unwrap_or(program);
    let lifted = key.map(|key| {
        let LinkedType::Record(fields) = &usage.entry.value else {
            unreachable!()
        };
        let index = fields
            .iter()
            .position(|field| field.name == key)
            .expect("validated choice key");
        let YamlRepresentation::Mapping(yaml) = &usage.entry.yaml else {
            unreachable!()
        };
        let yaml_key = yaml
            .iter()
            .find(|field| field.field == key)
            .expect("validated choice YAML key")
            .key
            .clone();
        (index, yaml_key, None)
    });
    // Recursive records reuse their original compiled input frame. Keep the
    // placement bindings for that boundary instead of forwarding caller slots.
    let body = super::value_record::generate_bound(
        &usage.entry,
        program,
        &usage.path,
        lifted,
        Some(bindings),
    )?;
    let compact = matches!(usage.entry.yaml, YamlRepresentation::TextPattern(_));
    let projected_target = match &usage.entry.yaml {
        YamlRepresentation::Projection(projected) => {
            let LinkedType::Record(fields) = &usage.entry.value else {
                unreachable!("projection is validated against a record")
            };
            fields
                .iter()
                .find(|field| &field.name == projected)
                .and_then(|field| field.value.as_reference())
                .and_then(|(target, _, _)| program.entries.iter().find(|entry| entry.id == target))
        }
        _ => None,
    };
    let projected_singleton = projected_target.is_some_and(|target| {
        matches!(
            target.yaml,
            YamlRepresentation::Sequence {
                singleton: Some(_),
                ..
            }
        )
    });
    let projected_structured = matches!(usage.entry.yaml, YamlRepresentation::GroupedSequence(_))
        || projected_target.is_some_and(|target| {
            matches!(
                target.value,
                LinkedType::Record(_) | LinkedType::Choice(_) | LinkedType::Sequence(_)
            )
        });
    let parent = &usage.path[..usage.path.len() - 1];
    let name = usage.path.last().unwrap();
    let declared_attributes = attributes::content(&usage.entry.xml).1;
    let attribute_plan =
        attributes::generate_prepared(&usage.entry, program, &declared_attributes, &usage.path)?;
    let wrapper_attr_read = attribute_plan.read_tokens;
    let wrapper_namespaces = attribute_plan
        .namespaces
        .iter()
        .map(|namespace| {
            format!("if !names.contains(&{namespace:?}){{names.push({namespace:?});}}\n")
        })
        .collect::<String>();
    let mut wrapper_namespaces = if wrapper_namespaces.is_empty() {
        String::new()
    } else {
        format!("if value.body.is_some(){{{wrapper_namespaces}}}\n")
    };
    if usage.canonical.iter().any(|form| form.form == XmlForm::Nil) {
        wrapper_namespaces.push_str("if !names.contains(&\"http://www.w3.org/2001/XMLSchema-instance\"){names.push(\"http://www.w3.org/2001/XMLSchema-instance\");}");
    }
    let wrapper_qnames = attribute_plan.qnames;
    let wrapper_qname_names = attributes::content(&usage.entry.xml)
        .1
        .into_iter()
        .filter(|attribute| matches!(attribute.value, LinkedXmlAttributeValue::QName(_)))
        .map(|attribute| {
            format!(
                "names.push(({:?},{:?}));",
                attribute.name.namespace, attribute.name.local
            )
        })
        .collect::<String>();
    let mut xml_checks = String::new();
    let mut yaml_checks = String::new();
    let yaml_default = yaml_default(
        entry,
        program,
        &usage.entry,
        usage.yaml_default.as_ref(),
        body.constructible,
    )?;
    let (canonical_definition, mut canonical_guard, mut canonical_plain_guard) = canonical(
        entry,
        program,
        &usage.canonical,
        usage.canonical_value_scope.then_some(&usage.entry),
    )?;
    let distinguish_nil_missing =
        usage.xml_missing && usage.yaml_missing && usage.xml_nil && usage.yaml_null;
    // Missing and explicit null are distinct states when both sides admit them.
    // With no overriding canonical rule, retain nil directly rather than
    // manufacturing a preservation patch for an already reversible spelling.
    if distinguish_nil_missing && usage.canonical.is_empty() {
        let path = record::path_code(&usage.path);
        let nil_attribute = "&[core::xml::WriteAttribute{name:(\"http://www.w3.org/2001/XMLSchema-instance\",\"nil\"),value:core::xml::AttributeValue::Text(\"true\")}]";
        canonical_guard = format!(
            "if value.body.is_none() && value.nil{{out.container_with_attributes({path},{nil_attribute});return Ok(())}}"
        );
        canonical_plain_guard = format!(
            "if value.body.is_none() && value.nil{{out.container_with_attributes({path},{nil_attribute});return Ok(out.finish_with_root(({path})[0]))}}"
        );
        wrapper_namespaces.push_str("if value.nil && !names.contains(&\"http://www.w3.org/2001/XMLSchema-instance\"){names.push(\"http://www.w3.org/2001/XMLSchema-instance\");}");
    }
    let mut null_context = expressions::Expressions::new(entry, program, fields, None);
    let null_condition = entry
        .presence
        .iter()
        .find(|rule| rule.target == LinkedPresenceTarget::Field(0))
        .and_then(|rule| rule.yaml_null_when.as_ref())
        .map(|when| null_context.lower(when))
        .transpose()?;
    let null_condition = null_condition.map_or_else(
        || "value.nil".to_owned(),
        |condition| format!("value.nil || ({condition})"),
    );
    let explicit_null = if usage.yaml_null && !usage.projected {
        format!(
            "let _inputs=inputs;{}if {null_condition}{{out.push_str(indent);out.push_str(&core::yaml::mapping_key({:?}));out.push_str(\": null\");return Ok(())}}",
            null_context.constants, usage.key
        )
    } else {
        String::new()
    };
    let skip_missing_plain_xml = if distinguish_nil_missing && usage.canonical.is_empty() {
        format!(
            "if value.body.is_none() && !value.nil{{return Ok(out.finish_with_root(({})[0]))}}",
            record::path_code(&usage.path)
        )
    } else {
        String::new()
    };
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
            .replace("@text_documents@", if super::external_text::has_documents(&usage.entry, program) { "fn write_yaml_documents_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<(core::resources::RelativePath,Vec<u8>)>>{match &value.body{Some(body)=>item_@id@::yaml_documents(body,inputs),None=>Ok(Vec::new())}}\n" } else { "" })
            .replace("@projected_preservation_guard@", if matches!(usage.entry.yaml, YamlRepresentation::Mapping(_) | YamlRepresentation::GroupedSequence(_)) { "" } else { "if @value_projection@{return Err(RuntimeDiagnostic::new(\"xml.preservation-shape\",\"Projected record requires an enclosing XML preservation boundary\"));}" })
            .replace("@preserved_body@", if matches!(usage.entry.yaml, YamlRepresentation::GroupedSequence(_)) {"Some(item_@id@::read_yaml(b\"[]\",inputs)?)"} else {"None"})
            .replace("@xml_issues_mut@", if xml_checks.is_empty() { "" } else { "mut " })
            .replace("@yaml_issues_mut@", if yaml_checks.is_empty() { "" } else { "mut " })
            .replace("@wrapper_attr_read@", &wrapper_attr_read)
            .replace("@wrapper_namespaces@", &wrapper_namespaces)
            .replace("@wrapper_qnames@", &wrapper_qnames)
            .replace("@wrapper_qname_names@", &wrapper_qname_names)
            .replace(
                "@ensure_container@",
                if compact {
                    ""
                } else {
                    "out.ensure_container_written(@path@);"
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
                } else if projected_structured {
                    WRITE_PROJECTED_BODY
                } else if matches!(usage.entry.yaml, YamlRepresentation::Projection(_)) {
                    WRITE_PROJECTED_SCALAR_BODY
                } else {
                    WRITE_MAPPING_BODY
                },
            )
            .replace("@projected_raw_body@", WRITE_PROJECTED_BODY)
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
            .replace("@write_nil@", "out.container_with_attributes(@path@,&[core::xml::WriteAttribute{name:(\"http://www.w3.org/2001/XMLSchema-instance\",\"nil\"),value:core::xml::AttributeValue::Text(\"true\")}])")
            .replace("@preserved_qname@", &super::proof::preserved_qname("&value.raw", "@path@"))
            .replace("@path@", &record::path_code(&usage.path))
            .replace("@parent@", &record::path_code(parent))
            .replace("@projected@", &usage.projected.to_string())
            .replace("@value_projection@", &projected_value.to_string())
            .replace(
                "@yaml_issue_mapping@",
                if usage.projected {
                    ""
                } else {
                    ".map(|mut issue|{issue.path.insert(0,@key@.into());issue})"
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
            .replace("@absent_empty@", match (usage.xml_empty, usage.xml_nil) {
                (false, false) => "false",
                (true, false) => "self.present && !self.content",
                (false, true) => "self.present && self.nil && !self.content",
                (true, true) => "self.present && !self.content",
            })
            .replace("@write_explicit_null@", &explicit_null)
            .replace("@write_null@", if usage.yaml_null && usage.projected {
                "out.push_str(indent);out.push_str(\"null\");"
            } else { "" })
            .replace("@skip_missing_xml@", if distinguish_nil_missing && usage.canonical.is_empty() {
                "if value.body.is_none() && !value.nil{return Ok(())}"
            } else { "" })
            .replace("@skip_missing_plain_xml@", &skip_missing_plain_xml)
            .replace("@xml_nil@", &usage.xml_nil.to_string())
            .replace("@yaml_null@", &usage.yaml_null.to_string())
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
            .replace(
                "@semantic_probe@",
                &usage
                    .entry
                    .constraints
                    .iter()
                    .any(|constraint| constraint.applies_to.contains(&ValidationPhase::XmlImport))
                    .to_string(),
            )
            .replace("@omit_empty@", if usage.yaml_default.as_ref().is_some_and(|value| !matches!(value.kind,LinkedExpressionKind::Absent)) && !usage.projected && matches!(usage.entry.yaml,YamlRepresentation::Mapping(_)) {"if value.raw.is_none() && !item_@id@::has_raw(body){out.truncate(_property_start);return Ok(());}"} else {""})
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
    constructible: bool,
) -> Result<String, Diagnostic> {
    let Some(expression) = expression else {
        return Ok("None".into());
    };
    fn lower(
        owner: &LinkedEntry,
        target: &LinkedEntry,
        expression: &LinkedExpression,
        program: &Program,
        constructible: bool,
        context: &mut expressions::Expressions<'_>,
    ) -> Result<String, Diagnostic> {
        match &expression.kind {
            LinkedExpressionKind::Absent => Ok("None".into()),
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Conditional,
                arguments,
            } => {
                let condition = context.lower(&arguments[0])?;
                let yes = lower(
                    owner,
                    target,
                    &arguments[1],
                    program,
                    constructible,
                    context,
                )?;
                let no = lower(
                    owner,
                    target,
                    &arguments[2],
                    program,
                    constructible,
                    context,
                )?;
                Ok(format!(
                    "{{let condition={condition};if condition {{{yes}}} else {{{no}}}}}"
                ))
            }
            LinkedExpressionKind::Operation {
                operator: LinkedOperator::Record(names),
                arguments,
            } => {
                if names.is_empty()
                    && !matches!(&target.value,LinkedType::Record(fields) if fields.is_empty())
                {
                    if !super::record_construction::defaultable(target, program)? {
                        return Err(unsupported(
                            owner,
                            "An implicit record requires declared defaults for its fields and mapping YAML",
                        ));
                    }
                    return Ok(format!(
                        "Some(item_{}::construct_defaults(inputs)?)",
                        owner.id
                    ));
                }
                if constructible {
                    let value = super::declared_construction::record(
                        expression, owner, target, program, owner.id,
                    )?;
                    return Ok(format!("Some({value})"));
                }
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
    let code = lower(
        owner,
        target,
        expression,
        program,
        constructible,
        &mut context,
    )?
    .replace("_inputs", "inputs");
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
    value_scope: Option<&LinkedEntry>,
) -> Result<(String, String, String), Diagnostic> {
    if forms.is_empty() {
        return Ok((String::new(), String::new(), String::new()));
    }
    let LinkedType::Record(fields) = &entry.value else {
        unreachable!("record usage has a record owner")
    };
    let storage = vec![(String::new(), "_value.body.is_some()".into())];
    let mut context = expressions::Expressions::new(entry, program, fields, Some(&storage));
    if let Some(scope) = value_scope {
        let LinkedType::Record(fields) = &scope.value else {
            unreachable!("record scope")
        };
        context = expressions::Expressions::new(scope, program, fields, None);
        context.borrowed_record_storage = Some(String::from(
            "_value.body.as_ref().ok_or_else(||RuntimeDiagnostic::new(\"value.missing\",\"A condition requires a record meaning\"))? as &dyn core::inputs::RecordInput",
        ));
    }
    let mut body = String::new();
    let mut has_fallback = false;
    for form in forms {
        let mode = match form.form {
            XmlForm::Ordinary => 0,
            XmlForm::Missing => 1,
            XmlForm::EmptyElement => 2,
            XmlForm::Nil => 3,
        };
        if let Some(when) = &form.when {
            let condition = context.lower(when)?;
            fn reads_record(value: &LinkedExpression) -> bool {
                match &value.kind {
                    LinkedExpressionKind::Field(_) | LinkedExpressionKind::SelfValue => true,
                    LinkedExpressionKind::Operation { arguments, .. } => {
                        arguments.iter().any(reads_record)
                    }
                    _ => false,
                }
            }
            let condition = if value_scope.is_some() && reads_record(when) {
                format!("_value.body.is_some() && ({condition})")
            } else {
                condition
            };
            body.push_str(&format!("if {condition}{{return Ok({mode});}}\n"));
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
        "match record_form_{}(value,inputs)?{{1=>return Ok(()),2=>{{out.ensure_container(@path@);return Ok(())}},3=>{{@write_nil@;return Ok(())}},_=>{{}}}}",
        entry.id
    );
    let plain_guard = format!(
        "match record_form_{}(value,inputs)?{{1=>return Ok(out.finish_with_root((@path@)[0])),2=>{{out.ensure_container(@path@);return Ok(out.finish_with_root((@path@)[0]))}},3=>{{@write_nil@;return Ok(out.finish_with_root((@path@)[0]))}},_=>{{}}}}",
        entry.id
    );
    Ok((definition, guard, plain_guard))
}

// A declared empty record denotes semantic absence. Its canonical XML form is
// selected on export; the final round-trip proof preserves any other source form.
const RUNTIME: &str = r#"
@text_documents@@body@
@canonical_definition@
struct V@id@{body:Option<item_@id@::Stored>,raw:Option<core::xml::Patch>,#[allow(dead_code)]nil:bool}
struct RecordXmlRead@id@{body:item_@id@::XmlReader,present:bool,content:bool,nil:bool}
impl RecordXmlRead@id@{
#[allow(dead_code)]
fn new()->Self{Self{body:item_@id@::XmlReader::new(),present:false,content:false,nil:false}}
#[allow(dead_code)]
fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:Option<core::xml::NamespaceScope<'_>>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{
if matches!(token,core::xml::Token::Start(_)) && core::xml::matches(path,@path@){if self.present{return Err(RuntimeDiagnostic::new("xml.duplicate-field","Repeated record"))}self.present=true;}
if path.len()<(@path@).len() || !core::xml::matches(&path[..(@path@).len()],@path@){return Ok(())}
if @xml_nil@ && core::xml::matches(path,@path@) && let core::xml::Token::Attribute(attribute)=token && attribute.name.namespace=="http://www.w3.org/2001/XMLSchema-instance" && attribute.name.local=="nil" {self.nil=match attribute.text.as_str(){"true"|"1"=>true,"false"|"0"=>false,_=>return Err(RuntimeDiagnostic::new("xml.nil-value","Invalid nil value"))};if !self.nil{self.content=true;}return Ok(());}
if (path.len()>(@path@).len() && matches!(token,core::xml::Token::Start(_))) || matches!(token,core::xml::Token::Attribute(_) if path.len()==(@path@).len()) || matches!(token,core::xml::Token::Text(text) if !text.trim().is_empty()){self.content=true;}
@wrapper_attr_read@
self.body.consume_scoped(path,token,scope,source,inputs)}
#[allow(dead_code)]
fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{if !self.present && !@xml_missing@{return Err(RuntimeDiagnostic::new("value.missing","Missing record"))}let absent_empty=@absent_empty@;let body=if self.present && !absent_empty{match self.body.finish(source,inputs){Ok(body)=>Some(body),Err(error) if (error.kind==core::annotations::IssueKind::Semantic && error.severity==Severity::Error) || error.code.as_deref().is_some_and(|code|code.starts_with("xml.")||code.starts_with("value."))=>return preserve_xml_@id@(source,inputs),Err(error)=>return Err(error)}}else{None};if @semantic_probe@ && body.as_ref().is_some_and(|body|item_@id@::check(body,source,inputs,true).iter().any(|issue|issue.kind==core::annotations::IssueKind::Semantic && issue.severity==Severity::Error)){return preserve_xml_@id@(source,inputs)}Ok(V@id@{body,raw:None,nil:self.present && self.nil && absent_empty})}
}
struct RecordYamlRead@id@{property:core::yaml::PropertyReader,body:item_@id@::YamlReader,nil:bool,started:bool}
impl RecordYamlRead@id@{
#[allow(dead_code)]
fn new()->core::Result<Self>{Ok(Self{property:core::yaml::PropertyReader::default(),body:item_@id@::YamlReader::new()?,nil:false,started:false})}
#[allow(dead_code)]
fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{let node=if @projected@{Some(node)}else{self.property.consume(node,@key@,"yaml.record")?};if let Some(node)=node{let first=!self.started;self.started=true;if @yaml_null@ && first && matches!(&node,core::yaml::Node::Scalar(value,_) if value.is_null()){if matches!(&node,core::yaml::Node::Scalar(value,tag) if tag.is_some() || value.annotation().is_some()){return Err(RuntimeDiagnostic::new("yaml.raw-envelope","Preserved null requires the document reader"));}self.nil=true;}else{self.body.consume(node,position,source,inputs)?;}}Ok(())}
#[allow(dead_code)]
fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{let present=if @projected@{self.started}else{self.property.finish("yaml.record")?};if !present && !@yaml_missing@{return Err(RuntimeDiagnostic::new("value.missing","Missing record"))}Ok(V@id@{body:if self.nil{None}else if present{Some(self.body.finish(source,inputs)?)}else{@yaml_default@},raw:None,nil:self.nil})}
}
#[allow(dead_code)]
fn read_xml_events_@id@(source:&[u8],inputs:&InputView<'_>,events:impl core::xml::ScopedSource)->core::Result<V@id@>{let mut state=RecordXmlRead@id@::new();events.visit_scoped(|path,token,scope|state.consume_scoped(path,token,Some(scope),source,inputs))?;state.finish(source,inputs)}
#[allow(dead_code)]
fn read_yaml_events_@id@(source:&[u8],inputs:&InputView<'_>,events:impl core::yaml::Source)->core::Result<V@id@>{let mut state=RecordYamlRead@id@::new()?;events.visit(|node,position|state.consume(node,position,source,inputs))?;state.finish(source,inputs)}
#[allow(dead_code)]
fn preserve_xml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{let _=inputs;
@projected_preservation_guard@
let tree=core::xml::Tree::capture_with_qnames(source,@path@,xml_qname_text_@id@)?;
let payload=match tree{Some(tree)=>tree.patch_yaml(None,&[],&xml_qnames_@id@())?,None=>"null".into()};
Ok(V@id@{body:@preserved_body@,raw:Some(core::xml::Patch::read(payload.as_bytes(),&[],&xml_qnames_@id@())?),nil:false})}
#[allow(dead_code)]
fn read_xml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{match read_xml_events_@id@(source,inputs,core::xml::DocumentSource(source)){
Ok(value)=>Ok(value),Err(error) if error.code.as_deref().is_some_and(|code|code.starts_with("xml.")||code.starts_with("value."))=>{
@debug_error@
let tree=core::xml::Tree::capture_with_qnames(source,@path@,xml_qname_text_@id@)?;
if tree.is_some(){match item_@id@::recover_xml(source,inputs){Ok(body)=>return Ok(V@id@{body:Some(body),raw:None,nil:false}),Err(error) if error.code.as_deref().is_some_and(|code|code.starts_with("xml.")||code.starts_with("value."))=>{},Err(error)=>return Err(error)}}
preserve_xml_@id@(source,inputs)},Err(error)=>Err(error)}}
#[allow(dead_code)]
fn read_yaml_@id@(source:&[u8],inputs:&InputView<'_>)->core::Result<V@id@>{match read_yaml_events_@id@(source,inputs,core::yaml::DocumentSource(if source.is_empty(){b"{}"}else{source})){
Ok(value)=>Ok(value),Err(error)=>{
if @value_projection@ {
if let Some(envelope)=core::raw::Document::decode(source)?{let mut value=match read_yaml_@id@(&envelope.meaning,inputs){Ok(value)=>value,Err(error) if envelope.meaning_is_empty()? && matches!(error.code.as_deref(),Some("yaml.expected-scalar"|"value.missing"|"yaml.choice-form"))=>V@id@{body:None,raw:None,nil:false},Err(error)=>return Err(error)};value.raw=Some(core::xml::Patch::read(&envelope.payload,&[],&xml_qnames_@id@())?);return Ok(value)}
return item_@id@::read_yaml(source,inputs).map(|body|V@id@{body:Some(body),raw:None,nil:false});
}
if let Some(envelope)=core::raw::Property::decode(source,@key@,@physical@)?{
@read_compact_envelope@
let body=if let Some(bytes)=core::raw::record_contents(&envelope.meaning,@key@)?{match item_@id@::read_yaml(&bytes,inputs){Ok(body)=>Some(body),Err(error) if matches!(error.code.as_deref(),Some("yaml.expected-scalar"|"value.missing"|"yaml.choice-form")) && (bytes.is_empty() || core::raw::meaning_is_empty(&bytes)?)=>None,Err(error)=>return Err(error)}}else{@yaml_default@};
return Ok(V@id@{body,raw:Some(core::xml::Patch::read(&envelope.payload,&[],&xml_qnames_@id@())?),nil:false});}
if let Some(bytes)=core::raw::record_contents(source,@key@)?{return item_@id@::read_yaml(&bytes,inputs).map(|body|V@id@{body:Some(body),raw:None,nil:false});}Err(error)}}}
#[allow(dead_code)]
fn write_yaml_plain_@id@(value:&V@id@,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{
let Some(body)=&value.body else{@write_explicit_null@@write_null@return Ok(())};if @projected@{return item_@id@::write_yaml(body,inputs,out,indent)}let _property_start=out.len();out.push_str(indent);out.push_str(&core::yaml::mapping_key(@key@));@write_body@Ok(())}
#[allow(dead_code)]
fn write_yaml_indented_@id@(value:&V@id@,inputs:&InputView<'_>,out:&mut String,indent:&str,_lift:bool)->core::Result<()>{
if let Some(patch)=&value.raw{let mut meaning=String::new();write_yaml_plain_@id@(value,inputs,&mut meaning,"")?;let payload=patch.to_yaml();let bytes=if @value_projection@{core::raw::Document::encode(meaning.as_bytes(),payload.as_bytes())?}else{core::raw::Property::encode(@key@,@physical@,meaning.as_bytes(),payload.as_bytes())?};core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect("generated YAML"));Ok(())}else{write_yaml_plain_@id@(value,inputs,out,indent)}}
#[allow(dead_code)]
fn write_yaml_into_@id@(value:&V@id@,inputs:&InputView<'_>,out:&mut String)->core::Result<()>{core::yaml::append_properties(out,|out|write_yaml_indented_@id@(value,inputs,out,"",false))}
#[allow(dead_code)]
fn write_yaml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let mut out=String::new();write_yaml_into_@id@(value,inputs,&mut out)?;Ok(out.into_bytes())}
struct XmlPrepared@id@{body:Option<item_@id@::Prepared>,tree:Option<core::xml::Tree>}
#[allow(dead_code)]
fn prepare_xml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<XmlPrepared@id@>{
let body=value.body.as_ref().map(|value|item_@id@::prepare(value,inputs)).transpose()?;
let mut prepared=XmlPrepared@id@{body,tree:None};if let Some(patch)=&value.raw{if patch.is_null(){return Ok(prepared)}let bytes=write_plain_xml_@id@(value,&prepared,inputs)?;let base=core::xml::Tree::capture_with_value_qnames(&bytes,@path@,|path,occurrences|xml_qname_text_at_@id@(value,path,occurrences))?;prepared.tree=Some(patch.apply(base,core::xml::Name{namespace:@namespace@.into(),local:@physical@.into()},&[],&xml_qnames_@id@())?);}Ok(prepared)}
#[allow(dead_code)]
fn namespaces_xml_@id@<'a>(value:&'a V@id@,prepared:&'a XmlPrepared@id@,names:&mut Vec<&'a str>){for(namespace,_)in @path@{if !namespace.is_empty() && !names.contains(namespace){names.push(namespace);}}@wrapper_namespaces@if let(Some(value),Some(prepared))=(&value.body,&prepared.body){item_@id@::namespaces(value,prepared,names);}
if let Some(tree)=&prepared.tree{tree.collect_namespaces(names);}}
#[allow(dead_code)]
fn write_xml_into_@id@<'a>(value:&V@id@,prepared:&'a XmlPrepared@id@,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{if value.raw.is_some(){if let Some(tree)=&prepared.tree{tree.write_at(out,@parent@,&xml_qnames_@id@())?;}}else{@skip_missing_xml@@canonical_guard@ if let(Some(value),Some(prepared))=(&value.body,&prepared.body){item_@id@::write_xml(value,prepared,inputs,out)?;@ensure_container@}else if @xml_absent_empty@{out.ensure_container(@path@);}}Ok(())}
#[allow(dead_code)]
fn write_plain_xml_@id@(value:&V@id@,prepared:&XmlPrepared@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let mut names=Vec::new();namespaces_xml_@id@(value,prepared,&mut names);let mut out=core::xml::Writer::new(&names);@skip_missing_plain_xml@@canonical_plain_guard@ if let(Some(value),Some(prepared))=(&value.body,&prepared.body){item_@id@::write_xml(value,prepared,inputs,&mut out)?;@ensure_container@}else if @xml_absent_empty@{out.ensure_container(@path@);}Ok(out.finish_with_root((@path@)[0]))}
#[allow(dead_code)]
fn write_xml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{let prepared=prepare_xml_@id@(value,inputs)?;let mut names=Vec::new();namespaces_xml_@id@(value,&prepared,&mut names);let mut out=core::xml::Writer::new(&names);write_xml_into_@id@(value,&prepared,inputs,&mut out)?;Ok(out.finish_with_root((@path@)[0]))}
#[allow(dead_code)]
fn check_xml_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{let @xml_issues_mut@issues=value.body.as_ref().map_or_else(Vec::new,|value|item_@id@::check(value,source,inputs,true));@xml_checks@ issues.into_iter().filter(|issue|issue.kind==core::annotations::IssueKind::Structural || issue.severity!=Severity::Error)@yaml_issue_mapping@.collect()}
#[allow(dead_code)]
fn check_yaml_@id@(value:&V@id@,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{let @yaml_issues_mut@issues=value.body.as_ref().map_or_else(Vec::new,|value|item_@id@::check(value,source,inputs,false));@yaml_checks@ issues.into_iter()@yaml_issue_mapping@.collect()}
#[allow(dead_code)]
fn xml_scalar_at_@id@(value:&V@id@,path:&[core::xml::Name],occurrences:&[usize])->bool{value.body.as_ref().is_some_and(|value|item_@id@::scalar(value,path,occurrences))}
#[allow(dead_code)]
fn xml_scalar_@id@(value:&V@id@,path:&[core::xml::Name])->bool{xml_scalar_at_@id@(value,path,&[])}
#[allow(dead_code)]
fn xml_qnames_@id@()->Vec<(&'static str,&'static str)>{let mut names=item_@id@::qnames();@wrapper_qname_names@names.sort_unstable();names.dedup();names}
#[allow(dead_code)]
fn xml_qname_attribute_@id@(path:&[core::xml::Name],name:&core::xml::Name)->bool{let(_path,_name)=(path,name);(@wrapper_qnames@)||item_@id@::qname_attribute(path,name)}
#[allow(dead_code)]
fn xml_qname_text_@id@(path:&[core::xml::Name])->bool{item_@id@::qname_text(path)}
#[allow(dead_code)]
fn xml_qname_text_at_@id@(value:&V@id@,path:&[core::xml::Name],occurrences:&[usize])->bool{@preserved_qname@value.body.as_ref().is_some_and(|value|item_@id@::qname_text_at(value,path,occurrences))}
#[allow(dead_code)]
fn prove_xml_@id@(value:&V@id@,original:&[u8],restored:&[u8])->core::Result<()>{core::proof::verify_with_value_qnames(original,restored,&[],|path,occurrences|xml_scalar_at_@id@(value,path,occurrences),xml_qname_attribute_@id@,|path,occurrences|xml_qname_text_at_@id@(value,path,occurrences))}
#[allow(dead_code)]
fn verify_@id@(original:&[u8],candidate:&[u8],inputs:&InputView<'_>)->core::Result<()>{let value=read_yaml_@id@(candidate,inputs)?;if let Some(error)=check_yaml_@id@(&value,candidate,inputs).into_iter().find(|error|error.severity==Severity::Error){return Err(error)}prove_xml_@id@(&value,original,&write_xml_@id@(&value,inputs)?)}
#[allow(dead_code)]
fn needs_enclosing_boundary_@id@(candidate:&[u8],error:&RuntimeDiagnostic)->bool{
    (error.kind==core::annotations::IssueKind::Semantic && error.severity==Severity::Error && !candidate.windows(b"!xml/".len()).any(|bytes|bytes==b"!xml/")) || matches!(error.code.as_deref(),Some("xml.preservation-shape"|"yaml.raw-envelope")) || (matches!(error.code.as_deref(),Some("yaml.unsupported-form"|"yaml.choice-form"|"yaml.expected-scalar"|"value.missing")) && candidate.windows(b"!xml/".len()).any(|bytes|bytes==b"!xml/"))
}
#[allow(dead_code)]
fn finalize_yaml_@id@(original:&[u8],candidate:Vec<u8>,value:&V@id@,inputs:&InputView<'_>)->core::Result<Vec<u8>>{@debug_candidate@ if !(@xml_required@ && value.body.is_none()){match verify_@id@(original,&candidate,inputs){Ok(())=>return Ok(candidate),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch") || (error.kind==core::annotations::IssueKind::Semantic && error.severity==Severity::Error && value.body.is_some() && value.raw.is_none())=>{},Err(error) if needs_enclosing_boundary_@id@(&candidate,&error)=>return write_yaml_@id@(&preserve_xml_@id@(original,inputs)?,inputs),Err(error)=>return Err(error)}}
if value.raw.is_none() && let Some(body)=&value.body{let refined_body=match item_@id@::finalize(original,body,inputs){Ok(body)=>Some(body),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>None,Err(error) if needs_enclosing_boundary_@id@(&candidate,&error)=>return write_yaml_@id@(&preserve_xml_@id@(original,inputs)?,inputs),Err(error)=>return Err(error)};if let Some(body)=refined_body{let mut refined=String::new();@refined_start@ if @projected@{refined.push_str(std::str::from_utf8(&body).expect("generated YAML"));}else{@refined_body@}match verify_@id@(original,refined.as_bytes(),inputs){Ok(())=>return Ok(refined.into_bytes()),Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch")=>{},Err(error)=>return Err(error)}}}
if @value_projection@{verify_@id@(original,&candidate,inputs)?;return Ok(candidate)}
let restored_value=read_yaml_@id@(candidate.as_slice(),inputs)?;let ordinary=write_xml_@id@(&restored_value,inputs)?;let base=core::xml::Tree::capture_with_value_qnames(&ordinary,@path@,|path,occurrences|xml_qname_text_at_@id@(&restored_value,path,occurrences))?;let source=core::xml::Tree::capture_with_value_qnames(original,@path@,|path,occurrences|xml_qname_text_at_@id@(value,path,occurrences))?;let payload=match source{Some(tree)=>tree.patch_yaml(base.as_ref(),&[],&xml_qnames_@id@())?,None=>"null".into()};let annotated=core::raw::Property::encode(@key@,@physical@,&candidate,payload.as_bytes())?;verify_@id@(original,&annotated,inputs)?;Ok(annotated)}
"#;

const WRITE_MAPPING_BODY: &str = r#"let key_end=out.len();out.push_str(":\n");let start=out.len();item_@id@::write_yaml(body,inputs,out,&format!("{indent}  "))?;if out.len()==start{@omit_empty@out.truncate(key_end);out.push_str(": {}");}else{core::yaml::lift_nested_tag(out,key_end,start);}"#;
const WRITE_PROJECTED_SCALAR_BODY: &str = r#"if item_@id@::has_raw(body){@projected_raw_body@}else{out.push_str(": ");item_@id@::write_yaml(body,inputs,out,"")?;}"#;
const WRITE_PROJECTED_BODY: &str = r#"let mut rendered=String::new();item_@id@::write_yaml(body,inputs,&mut rendered,"")?;out.push(':');if rendered.is_empty(){out.push_str(" null");}else if let Some(value)=core::yaml::inline_scalar_rendering(&rendered){out.push(' ');out.push_str(value);}else{core::yaml::append_nested_value(out,&rendered,&format!("{indent}  "));}"#;
const WRITE_PROJECTED_SINGLETON_BODY: &str = r#"let mut rendered=String::new();item_@id@::write_yaml(body,inputs,&mut rendered,"")?;if rendered.contains('\n'){out.push_str(":\n");core::yaml::Indented::new(out,&format!("{indent}  ")).push_str(&rendered);}else{out.push_str(": ");out.push_str(&rendered);}"#;
const WRITE_TEXT_BODY: &str =
    r#"out.push_str(": ");item_@id@::write_yaml_inline(body,inputs,out,indent)?;"#;
const REFINED_MAPPING_BODY: &str = r#"refined.push(':');if body.is_empty(){refined.push_str(" {}");}else{core::yaml::append_nested_value(&mut refined,std::str::from_utf8(&body).expect("generated YAML"),"  ");}"#;
const REFINED_PROJECTED_SINGLETON_BODY: &str = r#"let text=std::str::from_utf8(&body).expect("generated YAML");if text.contains('\n'){refined.push_str(":\n");core::yaml::Indented::new(&mut refined,"  ").push_str(text);}else{refined.push_str(": ");refined.push_str(text);}"#;

const READ_TEXT_ENVELOPE: &str = r#"if let Some(meaning)=core::raw::record_contents(&envelope.meaning,@key@)?{
let document=core::raw::Document::encode(&meaning,&envelope.payload)?;
return item_@id@::read_yaml(&document,inputs).map(|body|V@id@{body:Some(body),raw:None,nil:false});
}"#;
