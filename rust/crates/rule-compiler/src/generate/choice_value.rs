//! Route a structured choice to the ordinary generated backend of its selected variant.
use super::*;
use std::fmt::Write;

struct Shape<'a> {
    target: &'a LinkedEntry,
    variants: &'a [LinkedField],
    xml: &'a DiscriminatedChoiceXml<ExpandedName>,
    yaml: &'a [YamlChoiceCase],
    property: Option<&'a str>,
    route: &'a [ExpandedName],
}

fn shape<'a>(child: &'a LinkedEntry, program: &'a Program<'a>) -> Option<Shape<'a>> {
    let (LinkedType::Record(fields), LinkedXml::Record(xml)) = (&child.value, &child.xml) else {
        return None;
    };
    let field = fields.first()?;
    let property = match &child.yaml {
        YamlRepresentation::Mapping(yaml) => Some(yaml.first()?.key.as_str()),
        YamlRepresentation::Projection(projected) if projected == &field.name => None,
        _ => return None,
    };
    let (target, _, _) = composite::reference(&field.value)?;
    let target = program.entries.iter().find(|entry| entry.id == target)?;
    let (
        LinkedType::Choice(variants),
        LinkedXml::DiscriminatedChoice(choice),
        YamlRepresentation::Choice(selectors),
    ) = (&target.value, &target.xml, &target.yaml)
    else {
        return None;
    };
    if selectors.is_empty() {
        return None;
    }
    Some(Shape {
        target,
        variants,
        xml: choice,
        yaml: selectors,
        property,
        route: &xml.first()?.path,
    })
}

pub(super) fn applies(child: &LinkedEntry, program: &Program) -> bool {
    shape(child, program).is_some()
}

fn target<'a>(field: &LinkedField, program: &'a Program<'a>) -> &'a LinkedEntry {
    let (id, _, _) = composite::reference(&field.value).expect("linked choice variant");
    program
        .entries
        .iter()
        .find(|entry| entry.id == id)
        .expect("linked choice target")
}

fn accepts_discriminator(
    entry: &LinkedEntry,
    choice: &DiscriminatedChoiceXml<ExpandedName>,
) -> bool {
    attributes::content(&entry.xml).1.into_iter().any(|attribute| {
        attribute.name == choice.attribute
            && choice.variants.iter().any(|case| {
                matches!(&attribute.value, LinkedXmlAttributeValue::QName(value) if case.values.contains(value))
            })
    })
}

fn allows_absence(child: &LinkedEntry, empty: Option<EmptyKind>) -> bool {
    child.presence.iter().any(|presence| {
        presence.target == LinkedPresenceTarget::Field(0)
            && presence
                .yaml_missing
                .as_ref()
                .is_some_and(|value| matches!(value.kind, LinkedExpressionKind::Absent))
            && empty
                .as_ref()
                .is_none_or(|kind| scalar_presence::yaml_empty(Some(presence), kind.clone()))
    })
}

fn matches_default_omission(
    expression: &LinkedExpression,
    variant: u32,
    literal: &LinkedExpression,
) -> bool {
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::And,
        arguments,
    } = &expression.kind
    else {
        return false;
    };
    if arguments.len() != 2 {
        return false;
    }
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::IsVariant(selected),
        arguments: guard,
    } = &arguments[0].kind
    else {
        return false;
    };
    if *selected != variant
        || !matches!(
            guard.as_slice(),
            [LinkedExpression {
                kind: LinkedExpressionKind::Field(0),
                ..
            }]
        )
    {
        return false;
    }
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Equal,
        arguments: pair,
    } = &arguments[1].kind
    else {
        return false;
    };
    let [left, right] = pair.as_slice() else {
        return false;
    };
    matches!(&left.kind, LinkedExpressionKind::Operation { operator: LinkedOperator::VariantValue(selected), arguments } if *selected == variant && matches!(arguments.as_slice(), [LinkedExpression { kind: LinkedExpressionKind::Field(0), .. }]))
        && right.equivalent_to(literal)
}

struct ConstructedMissing {
    code: String,
    omission: Option<String>,
}

fn never_omit(expression: &LinkedExpression) -> bool {
    matches!(
        expression.kind,
        LinkedExpressionKind::Literal(ScalarLiteral::Boolean(false))
    )
}

fn constructed_missing_expression(
    expression: &LinkedExpression,
    omission: Option<&LinkedExpression>,
    child: &LinkedEntry,
    shape: &Shape<'_>,
    program: &Program,
    id: u32,
) -> Result<ConstructedMissing, Diagnostic> {
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::Conditional,
        arguments,
    } = &expression.kind
    {
        let [condition, yes, no] = arguments.as_slice() else {
            return Err(unsupported(child, "Invalid conditional choice default"));
        };
        let LinkedType::Record(fields) = &child.value else {
            unreachable!("choice owner")
        };
        let mut context = expressions::Expressions::new(child, program, fields, None);
        let predicate = context.lower(condition)?;
        if !context.transforms.is_empty() {
            return Err(unsupported(
                child,
                "Choice default condition needs a generated transform",
            ));
        }
        let constants = context.constants;
        let branch_omissions = omission.and_then(|expression| {
            let LinkedExpressionKind::Operation {
                operator: LinkedOperator::Conditional,
                arguments,
            } = &expression.kind
            else {
                return None;
            };
            let [guard, yes, no] = arguments.as_slice() else {
                return None;
            };
            guard.equivalent_to(condition).then_some((yes, no))
        });
        if omission.is_some_and(|value| !never_omit(value)) && branch_omissions.is_none() {
            return Err(unsupported(
                child,
                "Choice omission condition cannot be generated",
            ));
        }
        let yes = constructed_missing_expression(
            yes,
            branch_omissions.map(|pair| pair.0),
            child,
            shape,
            program,
            id,
        )?;
        let no = constructed_missing_expression(
            no,
            branch_omissions.map(|pair| pair.1),
            child,
            shape,
            program,
            id,
        )?;
        let omit_code = (branch_omissions.is_some() || yes.omission.is_some() || no.omission.is_some()).then(|| {
            let yes = yes.omission.as_deref().unwrap_or("false");
            let no = no.omission.as_deref().unwrap_or("false");
            format!("{{let _inputs=inputs;{constants}if {predicate} {{{yes}}} else {{{no}}}}}")
        });
        return Ok(ConstructedMissing {
            code: format!(
                "{{let _inputs=inputs;{constants}if {predicate} {{{}}} else {{{}}}}}",
                yes.code, no.code
            ),
            omission: omit_code,
        });
    }
    if matches!(expression.kind, LinkedExpressionKind::Absent) {
        if omission.is_some_and(|value| !never_omit(value)) {
            return Err(unsupported(
                child,
                "Absent choice default cannot satisfy the omission condition",
            ));
        }
        let fallback = shape
            .variants
            .iter()
            .position(|field| field.name == shape.xml.otherwise)
            .ok_or_else(|| unsupported(child, "Absent choice default requires a fallback"))?;
        return Ok(ConstructedMissing {
            code: format!(
                "part_{id}_{fallback}::read_yaml_document(b\"{{}}\",inputs).map(Stored::V{fallback})"
            ),
            omission: None,
        });
    }
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::ParseYaml,
        arguments,
    } = &expression.kind
        && arguments.len() == 1
    {
        if omission.is_some_and(|value| !never_omit(value)) {
            return Err(unsupported(child, "Parsed YAML default uses inferred equality for omission"));
        }
        let LinkedType::Record(fields) = &child.value else { unreachable!("choice owner") };
        let mut context = expressions::Expressions::new(child, program, fields, None);
        let lexical = context.lower(&arguments[0])?;
        if !context.transforms.is_empty() {
            return Err(unsupported(child, "Parsed YAML default requires a generated transform"));
        }
        let constants = context.constants;
        let document = shape.property.map_or_else(
            || format!("core::yaml::scalar(&({lexical}).to_string())"),
            |property| format!("format!(\"{{}}: {{}}\",{property:?},core::yaml::scalar(&({lexical}).to_string()))"),
        );
        let parse = format!("{{let _inputs=inputs;{constants}let document={document};read_yaml_document(document.as_bytes(),inputs)}}");
        let comparisons = (0..shape.variants.len()).map(|variant| format!(
            "(Stored::V{variant}(actual),Stored::V{variant}(default)) if !part_{id}_{variant}::has_raw(actual)=>{{let mut left=String::new();let mut right=String::new();part_{id}_{variant}::write_yaml(actual,inputs,&mut left)?;part_{id}_{variant}::write_yaml(default,inputs,&mut right)?;left==right}},"
        )).collect::<String>();
        return Ok(ConstructedMissing {
            code: parse.clone(),
            omission: Some(format!("{{let expected={parse}?;match(value,&expected){{{comparisons}_=>false,}}}}")),
        });
    }
    let LinkedExpressionKind::Operation {
        operator: LinkedOperator::ConstructVariant(index),
        arguments,
    } = &expression.kind
    else {
        return Err(unsupported(
            child,
            "Choice default requires a typed variant",
        ));
    };
    let selected = &shape.variants[*index as usize];
    let variant = *index as usize;
    let target = target(selected, program);
    let (literal, comparison) = match (&target.yaml, &arguments[0].kind) {
        (
            YamlRepresentation::Decimal,
            LinkedExpressionKind::Literal(ScalarLiteral::Number(value)),
        ) => {
            let number = nkdk_decimal::Decimal::parse(value)
                .map_err(|_| unsupported(child, "Invalid decimal choice default"))?;
            let (negative, digits, exponent) = number.parts();
            (
                value.clone(),
                format!(
                    "matches!(part_{id}_{variant}::input_field(selected,0),Some(core::inputs::InputRef::Decimal(actual)) if actual==&core::decimal::Decimal::constant({negative},{digits:?},{exponent}))"
                ),
            )
        }
        (
            YamlRepresentation::Calendar { seconds, omit_zero },
            LinkedExpressionKind::Literal(ScalarLiteral::Text(value)),
        ) => {
            let date = nkdk_conversion_core::calendar::Value::from_xml(value)
                .map_err(|_| unsupported(child, "Invalid calendar choice default"))?;
            (
                date.yaml(*seconds, *omit_zero),
                format!(
                    "part_{id}_{variant}::calendar_field(selected,0).is_ok_and(|actual|actual==&core::calendar::Value::from_parts({:?}).expect(\"validated calendar default\"))",
                    date.parts()
                ),
            )
        }
        (
            YamlRepresentation::BooleanTable(lexemes),
            LinkedExpressionKind::Literal(ScalarLiteral::Boolean(value)),
        ) => (
            lexemes
                .iter()
                .find(|lexeme| lexeme.value == *value)
                .map(|lexeme| lexeme.text.clone())
                .ok_or_else(|| unsupported(child, "Undeclared boolean choice default"))?,
            format!(
                "matches!(part_{id}_{variant}::input_field(selected,0),Some(core::inputs::InputRef::Boolean({value})))"
            ),
        ),
        (YamlRepresentation::Text, LinkedExpressionKind::Literal(ScalarLiteral::Text(value))) => (
            serde_json::to_string(value).expect("text literal is JSON-compatible"),
            format!(
                "matches!(part_{id}_{variant}::input_field(selected,0),Some(core::inputs::InputRef::Text(actual)) if actual=={value:?})"
            ),
        ),
        _ => {
            return Err(unsupported(
                child,
                "Choice default requires a declared scalar YAML form",
            ));
        }
    };
    let yaml = shape
        .property
        .map_or(literal.clone(), |property| format!("{property}: {literal}"));
    let comparison = match omission {
        Some(omit) if matches_default_omission(omit, *index, &arguments[0]) => Some(format!(
            "match value{{Stored::V{variant}(selected) if !part_{id}_{variant}::has_raw(selected)=>{comparison},_=>false}}"
        )),
        Some(omit) if !never_omit(omit) => {
            return Err(unsupported(
                child,
                "Choice omission rule cannot be generated",
            ));
        }
        _ => None,
    };
    Ok(ConstructedMissing {
        code: format!(
            "part_{id}_{variant}::read_yaml_document({yaml:?}.as_bytes(),inputs).map(Stored::V{variant})"
        ),
        omission: comparison,
    })
}

fn constructed_missing(
    child: &LinkedEntry,
    shape: &Shape<'_>,
    program: &Program,
    id: u32,
) -> Result<Option<ConstructedMissing>, Diagnostic> {
    let Some(rule) = child
        .presence
        .iter()
        .find(|rule| rule.target == LinkedPresenceTarget::Field(0))
    else {
        return Ok(None);
    };
    let Some(expression) = rule.yaml_missing.as_ref() else {
        return Ok(None);
    };
    if matches!(expression.kind, LinkedExpressionKind::Absent) {
        return Ok(None);
    }
    constructed_missing_expression(
        expression,
        rule.yaml_omit_when.as_ref(),
        child,
        shape,
        program,
        id,
    )
    .map(Some)
}

pub(super) fn emit(
    entry: &LinkedEntry,
    child: &LinkedEntry,
    program: &Program,
    id: u32,
    slot: usize,
    placement: value_adapters::Placement,
    names: &[(&str, &str)],
) -> Result<value_adapters::ValueEmission, Diagnostic> {
    let shape = shape(child, program).expect("structured choice");
    let fallback = shape
        .variants
        .iter()
        .position(|field| field.name == shape.xml.otherwise);
    let missing_default = constructed_missing(child, &shape, program, id)?;
    let mut nested = String::new();
    let mut accepts = Vec::new();
    let mut scalar_variants = Vec::new();
    for (variant, field) in shape.variants.iter().enumerate() {
        let mut selected = child.clone();
        // An absent discriminator selects the fallback, so only that branch
        // retains the choice's outer absence contract. A selected branch owns
        // the meaning of its empty representation (for example ValueList).
        let scalar_variant = matches!(
            target(field, program).value,
            LinkedType::Scalar(_) | LinkedType::Enum(_) | LinkedType::ScalarChoice(_)
        );
        if missing_default.is_some() && Some(variant) == fallback {
            for rule in &mut selected.presence {
                if rule.target == LinkedPresenceTarget::Field(0) {
                    rule.yaml_missing = Some(LinkedExpression {
                        kind: LinkedExpressionKind::Absent,
                        value_type: LinkedType::Absent,
                        source: rule.source.clone(),
                    });
                    rule.yaml_omit_when = None;
                }
            }
        } else if Some(variant) != fallback || missing_default.is_some() {
            selected.presence.clear();
        }
        selected.constraints.clear();
        let LinkedType::Record(fields) = &mut selected.value else {
            unreachable!()
        };
        fields[0].value = field.value.clone();
        let emitted = value_adapters::emit_standard_usage(value_adapters::UsageRequest {
            entry,
            child: &selected,
            program,
            id,
            slot: variant,
            placement,
            names,
        })?;
        nested.push_str(&emitted.source);
        accepts.push(accepts_discriminator(target(field, program), shape.xml));
        scalar_variants.push(scalar_variant);
    }

    let variants = (0..shape.variants.len()).collect::<Vec<_>>();
    let enum_members = |kind: &str| {
        variants
            .iter()
            .map(|variant| format!("V{variant}(part_{id}_{variant}::{kind})"))
            .collect::<Vec<_>>()
            .join(",")
    };
    let selectors = shape
        .yaml
        .iter()
        .map(|case| {
            let variant = shape
                .variants
                .iter()
                .position(|field| field.name == case.variant)
                .expect("linked YAML choice selector");
            match &case.form {
                YamlChoiceForm::Sequence => {
                    format!("core::yaml::ChoiceSelector::Sequence{{variant:{variant}}}")
                }
                YamlChoiceForm::Mapping { key, value } => format!(
                    "core::yaml::ChoiceSelector::Mapping{{variant:{variant},key:{key:?},value:{value:?}}}"
                ),
            }
        })
        .collect::<Vec<_>>()
        .join(",");
    let allows_yaml_missing_absence = allows_absence(child, None);
    let allows_null_absence = allows_absence(child, Some(EmptyKind::Null));
    let null_variant = if allows_null_absence {
        fallback
            .map(|variant| format!("Some({variant})"))
            .unwrap_or_else(|| "None".into())
    } else {
        "None".into()
    };
    let mut xml_cases = String::new();
    for case in &shape.xml.variants {
        let variant = shape
            .variants
            .iter()
            .position(|field| field.name == case.variant)
            .expect("linked XML choice selector");
        for value in &case.values {
            writeln!(
                xml_cases,
                "({:?},{:?})=>Ok(Some({variant})),",
                value.namespace, value.local
            )
            .unwrap();
        }
    }
    let route = record::path_code(shape.route);
    let discriminator_ns = &shape.xml.attribute.namespace;
    let discriminator_local = &shape.xml.attribute.local;
    let mut emitted_attributes = Vec::new();
    for (variant, field) in shape.variants.iter().enumerate() {
        let emit = shape
            .xml
            .variants
            .iter()
            .find(|case| case.variant == field.name)
            .and_then(|case| case.emit.as_ref());
        let code = if !accepts[variant] {
            emit.map_or_else(
                || "&[][..]".to_owned(),
                |name| format!("&[core::xml::WriteAttribute{{name:({discriminator_ns:?},{discriminator_local:?}),value:core::xml::AttributeValue::QName(({:?},{:?}))}}][..]", name.namespace, name.local),
            )
        } else {
            "&[][..]".to_owned()
        };
        emitted_attributes.push(code);
    }

    let mut out = String::new();
    writeln!(
        out,
        "#[allow(dead_code)] mod part_{id}_{slot} {{ #![allow(non_upper_case_globals)] use super::*;"
    )
    .unwrap();
    out.push_str(&nested);
    let structured = shape
        .yaml
        .iter()
        .map(|case| case.variant.as_str())
        .collect::<BTreeSet<_>>();
    out.push_str(&text_choice::scalar_yaml_selector(
        shape.target,
        program,
        &structured,
        "select_yaml_scalar",
    )?);
    writeln!(
        out,
        "#[allow(private_interfaces)] pub(super) enum Stored{{{}}} #[allow(private_interfaces)] pub(super) enum Prepared{{{}}}",
        enum_members("Stored"),
        enum_members("Prepared")
    )
    .unwrap();
    writeln!(
        out,
        "const SELECTORS:&[core::yaml::ChoiceSelector]=&[{selectors}];"
    )
    .unwrap();

    out.push_str("enum XmlSelected{");
    for variant in &variants {
        write!(out, "V{variant}(part_{id}_{variant}::XmlReader),").unwrap();
    }
    out.push_str("}\npub(super) struct XmlReader{selected:Option<XmlSelected>,events:Vec<(Vec<core::xml::Name>,core::xml::BufferedToken)>}\nimpl XmlReader{pub(super) fn new()->Self{Self{selected:None,events:Vec::new()}}\n");
    writeln!(out, "fn select(&mut self,variant:usize,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{let mut selected=match variant{{").unwrap();
    for variant in &variants {
        writeln!(
            out,
            "{variant}=>XmlSelected::V{variant}(part_{id}_{variant}::XmlReader::new()),"
        )
        .unwrap();
    }
    out.push_str("_=>unreachable!(\"linked choice variant\")};for(path,event)in std::mem::take(&mut self.events){event.visit(|token|match &mut selected{");
    for variant in &variants {
        let skip = !accepts[*variant];
        writeln!(out,"XmlSelected::V{variant}(reader)=>{{if {skip} && is_discriminator(&path,token){{Ok(())}}else{{reader.consume_scoped(&path,token,None,source,inputs)}}}},").unwrap();
    }
    out.push_str("})?;}self.selected=Some(selected);Ok(())}\n");
    writeln!(out,"pub(super) fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,_scope:Option<core::xml::NamespaceScope<'_>>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{if let Some(selected)=&mut self.selected{{return match selected{{").unwrap();
    for variant in &variants {
        writeln!(
            out,
            "XmlSelected::V{variant}(reader)=>reader.consume_scoped(path,token,None,source,inputs),"
        )
        .unwrap();
    }
    out.push_str("};}let selected=xml_selection(path,token)?;self.events.push((path.to_vec(),core::xml::BufferedToken::from_token(token)));if let Some(variant)=selected{self.select(variant,source,inputs)?;}Ok(())}\npub(super) fn finish(mut self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{if self.selected.is_none(){");
    if let Some(fallback) = fallback {
        writeln!(out, "self.select({fallback},source,inputs)?;").unwrap();
    } else {
        out.push_str("return Err(RuntimeDiagnostic::new(\"xml.choice\",\"Missing XML choice discriminator\"));");
    }
    out.push_str("}match self.selected.unwrap(){");
    for variant in &variants {
        writeln!(
            out,
            "XmlSelected::V{variant}(reader)=>reader.finish(source,inputs).map(Stored::V{variant}),"
        )
        .unwrap();
    }
    out.push_str("}}}\n");
    writeln!(out,"fn is_discriminator(path:&[core::xml::Name],token:&core::xml::Token<'_>)->bool{{core::xml::matches(path,{route})&&matches!(token,core::xml::Token::Attribute(attribute) if attribute.name.namespace=={discriminator_ns:?}&&attribute.name.local=={discriminator_local:?})}}").unwrap();
    writeln!(out,"fn xml_selection(path:&[core::xml::Name],token:&core::xml::Token<'_>)->core::Result<Option<usize>>{{if !core::xml::matches(path,{route}){{return Ok(None)}}match token{{core::xml::Token::Attribute(attribute) if attribute.name.namespace=={discriminator_ns:?}&&attribute.name.local=={discriminator_local:?}=>{{let Some(name)=attribute.qname.as_ref()else{{return Err(RuntimeDiagnostic::new(\"xml.choice\",\"Choice discriminator requires QName\"))}};match(name.namespace.as_str(),name.local.as_str()){{{xml_cases}_=>Ok({fallback:?}),}}}},core::xml::Token::Text(_)|core::xml::Token::End=>Ok({fallback:?}),_=>Ok(None)}}}}").unwrap();

    out.push_str("enum YamlSelected{");
    for variant in &variants {
        write!(out, "V{variant}(part_{id}_{variant}::YamlReader),").unwrap();
    }
    out.push_str("}\nenum YamlState{Selecting{property:core::yaml::PropertyReader,choice:core::yaml::ChoiceReader,form:Option<bool>,events:Vec<(core::yaml::Node,core::Position)>},Selected(YamlSelected)}\npub(super) struct YamlReader{state:YamlState}\nimpl YamlReader{pub(super) fn new()->core::Result<Self>{Ok(Self{state:YamlState::Selecting{property:core::yaml::PropertyReader::default(),choice:core::yaml::ChoiceReader::new(SELECTORS),form:None,events:Vec::new()}})}\n");
    let consume_payload = shape.property.map_or_else(
        || "let payload=node;{".to_owned(),
        |property| format!("if let Some(payload)=property.consume(node,{property:?},\"yaml.choice-property\")?{{"),
    );
    writeln!(out,"pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{match &mut self.state{{YamlState::Selected(selected)=>match selected{{").unwrap();
    for variant in &variants {
        writeln!(
            out,
            "YamlSelected::V{variant}(reader)=>reader.consume(node,position,source,inputs),"
        )
        .unwrap();
    }
    writeln!(out,"}},YamlState::Selecting{{property,choice,form,events}}=>{{events.push((node.clone(),position));{consume_payload}let first=form.is_none();if first{{*form=Some(!matches!(payload,core::yaml::Node::Scalar(..)));}}let variant=if first&&{allows_null_absence}&&matches!(&payload,core::yaml::Node::Scalar(value,_) if value.is_null()){{{null_variant}}}else if first{{match payload{{core::yaml::Node::Scalar(value,tag)=>Some(select_yaml_scalar(value,tag)?),payload=>match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}}}}else{{match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}};if let Some(variant)=variant{{let mut selected=match variant{{").unwrap();
    for variant in &variants {
        writeln!(
            out,
            "{variant}=>YamlSelected::V{variant}(part_{id}_{variant}::YamlReader::new()?),"
        )
        .unwrap();
    }
    out.push_str("_=>unreachable!(\"linked choice variant\")};for(node,position)in std::mem::take(events){match &mut selected{");
    for variant in &variants {
        writeln!(
            out,
            "YamlSelected::V{variant}(reader)=>reader.consume(node,position,source,inputs)?,"
        )
        .unwrap();
    }
    out.push_str("}}self.state=YamlState::Selected(selected);}}Ok(())}}}\npub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{match self.state{YamlState::Selecting{property,choice,events,..}=>{");
    if let Some(default) = &missing_default {
        let missing = if shape.property.is_some() {
            "!property.finish(\"yaml.choice-property\")?"
        } else {
            "events.is_empty()"
        };
        writeln!(out, "if {missing}{{return {};}}", default.code).unwrap();
    } else if allows_yaml_missing_absence && let Some(fallback) = fallback {
        let missing = if shape.property.is_some() {
            "!property.finish(\"yaml.choice-property\")?"
        } else {
            "events.is_empty()"
        };
        writeln!(out,"if {missing}{{let mut reader=part_{id}_{fallback}::YamlReader::new()?;for(node,position)in events{{reader.consume(node,position,source,inputs)?;}}return reader.finish(source,inputs).map(Stored::V{fallback});}}").unwrap();
    }
    out.push_str("choice.finish()?;unreachable!()},YamlState::Selected(selected)=>match selected{");
    for variant in &variants {
        writeln!(out,"YamlSelected::V{variant}(reader)=>reader.finish(source,inputs).map(Stored::V{variant}),").unwrap();
    }
    out.push_str("}}}}\n");

    let select_payload = shape.property.map_or_else(
        || "let payload=node;{".to_owned(),
        |property| format!("if let Some(payload)=property.consume(node,{property:?},\"yaml.choice-property\")?{{"),
    );
    writeln!(out,"fn yaml_selection(source:&[u8])->core::Result<Option<usize>>{{let mut property=core::yaml::PropertyReader::default();let mut choice=core::yaml::ChoiceReader::new(SELECTORS);let mut form=None;let mut selected=None;core::yaml::visit_nodes(source,|node,position|{{if selected.is_some(){{return Ok(())}}{select_payload}let first=form.is_none();if first{{form=Some(!matches!(payload,core::yaml::Node::Scalar(..)));}}selected=if first&&{allows_null_absence}&&matches!(&payload,core::yaml::Node::Scalar(value,_) if value.is_null()){{{null_variant}}}else if first{{match payload{{core::yaml::Node::Scalar(value,tag)=>Some(select_yaml_scalar(value,tag)?),payload=>match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}}}}else{{match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}};}}Ok(())}})?;Ok(selected)}}").unwrap();

    writeln!(out,"pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>,events:impl core::xml::ScopedSource)->core::Result<Stored>{{let mut reader=XmlReader::new();events.visit_scoped(|path,token,scope|reader.consume_scoped(path,token,Some(scope),source,inputs))?;reader.finish(source,inputs)}}").unwrap();
    writeln!(out,"pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>,events:impl core::yaml::Source)->core::Result<Stored>{{let mut reader=YamlReader::new()?;events.visit(|node,position|reader.consume(node,position,source,inputs))?;reader.finish(source,inputs)}}").unwrap();
    writeln!(out,"pub(super) fn read_xml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{let mut selected=None;core::xml::visit(source,|path,token|{{if selected.is_none(){{match xml_selection(path,&token){{Ok(Some(variant))=>selected=Some(variant),Ok(None)=>{{}},Err(_)=>selected={fallback:?},}}}}Ok(())}})?;match selected.or({fallback:?}){{").unwrap();
    for variant in &variants {
        writeln!(out,"Some({variant})=>part_{id}_{variant}::read_xml_document(source,inputs).map(Stored::V{variant}),").unwrap();
    }
    out.push_str(
        "_=>Err(RuntimeDiagnostic::new(\"xml.choice\",\"Missing XML choice discriminator\")),}}\n",
    );
    let empty_document = if missing_default.is_some() {
        "if source.is_empty(){return YamlReader::new()?.finish(source,inputs);}let document=source;"
            .to_owned()
    } else {
        format!(
            "let document=if source.is_empty()&&{allows_null_absence}{{b\"null\".as_slice()}}else{{source}};"
        )
    };
    writeln!(out,"pub(super) fn read_yaml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{{empty_document}match read_yaml(document,inputs,core::yaml::DocumentSource(document)){{Ok(value)=>Ok(value),Err(error)=>match yaml_selection(document).ok().flatten().or({fallback:?}){{").unwrap();
    for variant in &variants {
        writeln!(out,"Some({variant})=>part_{id}_{variant}::read_yaml_document(document,inputs).map(Stored::V{variant}).or(Err(error)),").unwrap();
    }
    out.push_str("_=>Err(error),}}}\n");

    macro_rules! delegate_value {
        ($name:literal,$args:literal,$result:literal,$call:literal) => {{
            writeln!(
                out,
                "pub(super) fn {}(value:&Stored{}){}{{match value{{",
                $name, $args, $result
            )
            .unwrap();
            for variant in &variants {
                writeln!(
                    out,
                    "Stored::V{variant}(value)=>part_{id}_{variant}::{}(value{}),",
                    $name, $call
                )
                .unwrap();
            }
            out.push_str("}}\n");
        }};
    }
    delegate_value!(
        "input_field",
        ",field:usize",
        "->Option<core::inputs::InputRef<'_>>",
        ",field"
    );
    delegate_value!(
        "text_field",
        ",field:usize",
        "->core::Result<&str>",
        ",field"
    );
    delegate_value!("field_has_annotation", ",field:usize", "->bool", ",field");
    delegate_value!("has_raw", "", "->bool", "");
    if let Some(comparison) = missing_default
        .as_ref()
        .and_then(|default| default.omission.as_ref())
    {
        writeln!(out,"fn omit_default(value:&Stored,inputs:&InputView<'_>)->core::Result<bool>{{Ok({comparison})}}").unwrap();
    } else {
        out.push_str("fn omit_default(_value:&Stored,_inputs:&InputView<'_>)->core::Result<bool>{Ok(false)}\n");
    }
    delegate_value!(
        "document",
        ",inputs:&InputView<'_>",
        "->core::Result<Vec<u8>>",
        ",inputs"
    );
    out.push_str("pub(super) fn write_yaml(value:&Stored,inputs:&InputView<'_>,out:&mut String)->core::Result<()>{if omit_default(value,inputs)?{return Ok(());}match value{");
    for variant in &variants {
        writeln!(
            out,
            "Stored::V{variant}(selected)=>part_{id}_{variant}::write_yaml(selected,inputs,out),"
        )
        .unwrap();
    }
    out.push_str("}}\n");
    delegate_value!(
        "scalar_at",
        ",path:&[core::xml::Name],occurrences:&[usize]",
        "->bool",
        ",path,occurrences"
    );
    delegate_value!("scalar", ",path:&[core::xml::Name]", "->bool", ",path");
    delegate_value!(
        "verify_boundary",
        ",before:&[u8],after:&[u8]",
        "->core::Result<()>",
        ",before,after"
    );
    out.push_str("pub(super) fn write_yaml_indented(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{if omit_default(value,inputs)?{return Ok(());}match value{");
    for variant in &variants {
        writeln!(out,"Stored::V{variant}(selected)=>part_{id}_{variant}::write_yaml_indented(selected,inputs,out,indent),").unwrap();
    }
    out.push_str("}}\n");
    if child.constraints.is_empty() {
        delegate_value!(
            "check_xml",
            ",source:&[u8],inputs:&InputView<'_>",
            "->Vec<RuntimeDiagnostic>",
            ",source,inputs"
        );
        delegate_value!(
            "check_yaml",
            ",source:&[u8],inputs:&InputView<'_>",
            "->Vec<RuntimeDiagnostic>",
            ",source,inputs"
        );
    } else {
        out.push_str(&generate_checks(
            child,
            program,
            id,
            shape.property,
            shape.variants.len(),
        )?);
    }
    out.push_str("pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{match value{");
    for variant in &variants {
        writeln!(
            out,
            "Stored::V{variant}(value)=>part_{id}_{variant}::finalize(source,value,inputs),"
        )
        .unwrap();
    }
    out.push_str("}}\n");

    out.push_str(
        "pub(super) fn prepare(value:&Stored,inputs:&InputView<'_>)->core::Result<Prepared>{match value{",
    );
    for variant in &variants {
        writeln!(out,"Stored::V{variant}(value)=>part_{id}_{variant}::prepare(value,inputs).map(Prepared::V{variant}),").unwrap();
    }
    out.push_str("}}\npub(super) fn namespaces<'a>(value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>){match(value,prepared){");
    for variant in &variants {
        writeln!(out,"(Stored::V{variant}(value),Prepared::V{variant}(prepared))=>part_{id}_{variant}::namespaces(value,prepared,names),").unwrap();
    }
    out.push_str("_=>unreachable!(\"choice preparation variant\")};");
    let mut choice_namespaces = BTreeSet::new();
    choice_namespaces.insert(shape.xml.attribute.namespace.as_str());
    for case in &shape.xml.variants {
        for name in case.values.iter().chain(case.emit.iter()) {
            choice_namespaces.insert(name.namespace.as_str());
        }
    }
    for namespace in choice_namespaces
        .into_iter()
        .filter(|name| !name.is_empty())
    {
        write!(
            out,
            "if !names.contains(&{namespace:?}){{names.push({namespace:?});}}"
        )
        .unwrap();
    }
    out.push_str("}\npub(super) fn write_xml<'a>(value:&Stored,prepared:&'a Prepared,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{match(value,prepared){");
    for variant in &variants {
        let semantic_present = if scalar_variants[*variant] {
            format!("part_{id}_{variant}::semantic_present(value)")
        } else {
            "true".to_owned()
        };
        writeln!(out,"(Stored::V{variant}(value),Prepared::V{variant}(prepared))=>{{let attributes:&[core::xml::WriteAttribute<'_>]={};if !attributes.is_empty()&&!part_{id}_{variant}::has_raw(value)&&{semantic_present}{{out.container_with_attributes({route},attributes);}}part_{id}_{variant}::write_xml(value,prepared,inputs,out)}},",emitted_attributes[*variant]).unwrap();
    }
    out.push_str("_=>unreachable!(\"choice preparation variant\")}}\n");
    writeln!(out,"pub(super) fn project(source:&[u8])->core::Result<Vec<u8>>{{core::xml::project_property(source,{route},core::xml::PropertyProjection::Element,qname_attribute,qname_text)}}").unwrap();
    writeln!(out,"pub(super) fn qname_attribute(path:&[core::xml::Name],name:&core::xml::Name)->bool{{(core::xml::matches(path,{route})&&name.namespace=={discriminator_ns:?}&&name.local=={discriminator_local:?})||false").unwrap();
    for variant in &variants {
        write!(out, "||part_{id}_{variant}::qname_attribute(path,name)").unwrap();
    }
    out.push_str("}\npub(super) fn qname_text(path:&[core::xml::Name])->bool{false");
    for variant in &variants {
        write!(out, "||part_{id}_{variant}::qname_text(path)").unwrap();
    }
    out.push_str("}\npub(super) fn qnames()->Vec<(&'static str,&'static str)>{let mut names=vec![");
    for case in &shape.xml.variants {
        if let Some(name) = &case.emit {
            write!(out, "({:?},{:?}),", name.namespace, name.local).unwrap();
        }
    }
    out.push_str("]; ");
    for variant in &variants {
        write!(out, "names.extend(part_{id}_{variant}::qnames());").unwrap();
    }
    out.push_str("names.sort_unstable();names.dedup();names}\n");
    out.push_str("pub(super) fn infer_xml(value:&mut Stored,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{match value{");
    for variant in &variants {
        writeln!(
            out,
            "Stored::V{variant}(value)=>part_{id}_{variant}::infer_xml(value,source,inputs),"
        )
        .unwrap();
    }
    out.push_str("}}\n}\n");
    Ok(value_adapters::ValueEmission {
        source: out,
        xml_stateful: true,
        yaml_stateful: true,
    })
}

fn generate_checks(
    child: &LinkedEntry,
    program: &Program,
    id: u32,
    property: Option<&str>,
    count: usize,
) -> Result<String, Diagnostic> {
    let LinkedType::Record(fields) = &child.value else {
        unreachable!("choice property is a record");
    };
    let mut out = String::new();
    for (side, phase, form) in [
        ("xml", ValidationPhase::XmlImport, LinkedForm::XmlRecord),
        (
            "yaml",
            ValidationPhase::YamlValidation,
            LinkedForm::YamlMapping,
        ),
    ] {
        writeln!(out, "pub(super) fn check_{side}(value:&Stored,source:&[u8],inputs:&InputView<'_>)->Vec<RuntimeDiagnostic>{{let _inputs=inputs;let mut errors=match value{{").unwrap();
        for variant in 0..count {
            writeln!(
                out,
                "Stored::V{variant}(value)=>part_{id}_{variant}::check_{side}(value,source,inputs),"
            )
            .unwrap();
        }
        out.push_str("};match value{");
        for variant in 0..count {
            writeln!(out, "Stored::V{variant}(value)=>{{").unwrap();
            let storage = [(
                format!("part_{id}_{variant}::text_field(value,0).unwrap_or(\"\")"),
                "true".to_owned(),
            )];
            let mut expressions =
                super::expressions::Expressions::new(child, program, fields, Some(&storage));
            expressions.calendar_field_storage =
                Some(format!("part_{id}_{variant}::calendar_field(value,0)"));
            expressions.decimal_field_storage = Some(format!(
                "(match part_{id}_{variant}::input_field(value,0){{Some(core::inputs::InputRef::Decimal(number))=>Ok(number),_=>Err(RuntimeDiagnostic::new(\"fact.field-type\",\"Expected a decimal field\"))}})?"
            ));
            expressions.variant_text_storage =
                Some(format!("part_{id}_{variant}::render_text(value)?"));
            for original in &child.constraints {
                if !original.applies_to.contains(&phase)
                    || (!original.forms.is_empty() && !original.forms.contains(&form))
                {
                    continue;
                }
                if original.for_each.is_some() {
                    return Err(unsupported(
                        child,
                        "Choice property iterations need a declared collection",
                    ));
                }
                let mut rule = original.clone();
                crate::expressions::map_constraint(&mut rule, |expression| {
                    specialize_variant_test(expression, variant as u32)
                });
                if rule.expressions().any(uses_unprojected_owner_field) {
                    return Err(unsupported(
                        child,
                        "Choice property contract must use a variant test or a bound input",
                    ));
                }
                expressions.fallible = false;
                let message = expressions.message(&rule.diagnostic.message)?;
                if expressions.fallible {
                    return Err(unsupported(
                        child,
                        "Choice diagnostic message must be available without a fallible lookup",
                    ));
                }
                let when = if let Some(condition) = &rule.when {
                    expressions.lower(condition)?
                } else {
                    "true".to_owned()
                };
                let assertion = expressions.lower(&rule.assertion)?;
                let mut reads = BTreeSet::new();
                for expression in rule.expressions() {
                    super::constraints::read_inputs(expression, &mut reads);
                }
                let ready = reads.iter().map(|slot| format!("!matches!(_inputs.slot({slot}),Some(core::inputs::InputRef::MissingValue))")).collect::<Vec<_>>().join("&&");
                let guard = if ready.is_empty() {
                    when
                } else {
                    format!("({ready})&&({when})")
                };
                let violation = super::constraints::violation(&guard, &assertion);
                let code = rule.diagnostic.code.as_deref();
                let source_name = rule.diagnostic.source.as_deref();
                let severity = super::constraints::severity_name(&rule.diagnostic.severity);
                let path = match rule.diagnostic.at {
                    LinkedDiagnosticTarget::SelfValue => String::new(),
                    LinkedDiagnosticTarget::Field(0) => property
                        .map(|name| format!(".field({name:?})"))
                        .unwrap_or_default(),
                    _ => {
                        return Err(unsupported(
                            child,
                            "Choice diagnostic must address its value",
                        ));
                    }
                };
                let diagnostic = format!(
                    "RuntimeDiagnostic::declared({code:?},{source_name:?},core::Severity::{severity},{message}){path}"
                );
                if expressions.fallible {
                    writeln!(out, "if part_{id}_{variant}::semantic_present(value){{let evaluate=||->core::Result<bool>{{Ok({violation})}};match evaluate(){{Ok(true)=>errors.push({diagnostic}),Ok(false)=>{{}},Err(error)=>errors.push(error{path}),}}}}").unwrap();
                } else {
                    writeln!(out, "if part_{id}_{variant}::semantic_present(value)&&({violation}){{errors.push({diagnostic});}}").unwrap();
                }
            }
            out.push_str(&expressions.constants);
            out.push_str("},");
        }
        out.push_str("}errors}\n");
    }
    Ok(out)
}

fn uses_unprojected_owner_field(value: &LinkedExpression) -> bool {
    match &value.kind {
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::State(StatePredicate::Present),
            arguments,
        } if matches!(arguments.as_slice(), [LinkedExpression { kind: LinkedExpressionKind::Field(0), .. }]) => false,
        LinkedExpressionKind::Operation {
            operator: LinkedOperator::VariantText(_),
            arguments,
        } if matches!(
            arguments.as_slice(),
            [LinkedExpression {
                kind: LinkedExpressionKind::Field(0),
                ..
            }]
        ) =>
        {
            false
        }
        LinkedExpressionKind::Field(0)
            if matches!(
                value.value_type,
                LinkedType::Scalar(ScalarType::Text | ScalarType::Decimal)
            ) =>
        {
            false
        }
        LinkedExpressionKind::Field(_) | LinkedExpressionKind::SelfValue => true,
        LinkedExpressionKind::Operation { arguments, .. } => {
            arguments.iter().any(uses_unprojected_owner_field)
        }
        _ => false,
    }
}

fn specialize_variant_test(value: &mut LinkedExpression, selected: u32) {
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::VariantText(variant),
        arguments,
    } = &value.kind
        && matches!(
            arguments.as_slice(),
            [LinkedExpression {
                kind: LinkedExpressionKind::Field(0),
                ..
            }]
        )
        && *variant != selected
    {
        value.kind = LinkedExpressionKind::Literal(ScalarLiteral::Text(String::new()));
        return;
    }
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::VariantValue(variant),
        arguments,
    } = &value.kind
        && matches!(
            arguments.as_slice(),
            [LinkedExpression {
                kind: LinkedExpressionKind::Field(0),
                ..
            }]
        )
    {
        value.kind = if *variant == selected {
            LinkedExpressionKind::Field(0)
        } else {
            match value.value_type {
                LinkedType::Scalar(ScalarType::Decimal) => {
                    LinkedExpressionKind::Literal(ScalarLiteral::Number("0".into()))
                }
                _ => LinkedExpressionKind::Literal(ScalarLiteral::Text(String::new())),
            }
        };
        return;
    }
    if let LinkedExpressionKind::Operation {
        operator: LinkedOperator::IsVariant(variant),
        arguments,
    } = &value.kind
        && matches!(
            arguments.as_slice(),
            [LinkedExpression {
                kind: LinkedExpressionKind::Field(0),
                ..
            }]
        )
    {
        value.kind = LinkedExpressionKind::Literal(ScalarLiteral::Boolean(*variant == selected));
    } else if let LinkedExpressionKind::Operation { arguments, .. } = &mut value.kind {
        for argument in arguments {
            specialize_variant_test(argument, selected);
        }
    }
}
