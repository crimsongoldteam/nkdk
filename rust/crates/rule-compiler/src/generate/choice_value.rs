//! Route a structured choice to the ordinary generated backend of its selected variant.
use super::*;
use std::fmt::Write;

struct Shape<'a> {
    target: &'a LinkedEntry,
    variants: &'a [LinkedField],
    xml: &'a DiscriminatedChoiceXml<ExpandedName>,
    yaml: &'a [YamlChoiceCase],
    property: &'a str,
    route: &'a [ExpandedName],
}

fn shape<'a>(child: &'a LinkedEntry, program: &'a Program<'a>) -> Option<Shape<'a>> {
    let (LinkedType::Record(fields), LinkedXml::Record(xml), YamlRepresentation::Mapping(yaml)) =
        (&child.value, &child.xml, &child.yaml)
    else {
        return None;
    };
    let field = fields.first()?;
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
        property: &yaml.first()?.key,
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
    let mut nested = String::new();
    let mut accepts = Vec::new();
    for (variant, field) in shape.variants.iter().enumerate() {
        let mut selected = child.clone();
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
    let fallback = shape
        .variants
        .iter()
        .position(|field| field.name == shape.xml.otherwise);
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
    writeln!(out,"pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{match &mut self.state{{YamlState::Selected(selected)=>match selected{{").unwrap();
    for variant in &variants {
        writeln!(
            out,
            "YamlSelected::V{variant}(reader)=>reader.consume(node,position,source,inputs),"
        )
        .unwrap();
    }
    writeln!(out,"}},YamlState::Selecting{{property,choice,form,events}}=>{{events.push((node.clone(),position));if let Some(payload)=property.consume(node,{:?},\"yaml.choice-property\")?{{let first=form.is_none();if first{{*form=Some(!matches!(payload,core::yaml::Node::Scalar(..)));}}let variant=if first{{match payload{{core::yaml::Node::Scalar(value,tag)=>Some(select_yaml_scalar(value,tag)?),payload=>match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}}}}else{{match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}};if let Some(variant)=variant{{let mut selected=match variant{{",shape.property).unwrap();
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
    out.push_str("}}self.state=YamlState::Selected(selected);}}Ok(())}}}\npub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{match self.state{YamlState::Selecting{choice,..}=>{choice.finish()?;unreachable!()},YamlState::Selected(selected)=>match selected{");
    for variant in &variants {
        writeln!(out,"YamlSelected::V{variant}(reader)=>reader.finish(source,inputs).map(Stored::V{variant}),").unwrap();
    }
    out.push_str("}}}}\n");

    writeln!(out,"fn yaml_selection(source:&[u8])->core::Result<Option<usize>>{{let mut property=core::yaml::PropertyReader::default();let mut choice=core::yaml::ChoiceReader::new(SELECTORS);let mut form=None;let mut selected=None;core::yaml::visit_nodes(source,|node,position|{{if selected.is_some(){{return Ok(())}}if let Some(payload)=property.consume(node,{:?},\"yaml.choice-property\")?{{let first=form.is_none();if first{{form=Some(!matches!(payload,core::yaml::Node::Scalar(..)));}}selected=if first{{match payload{{core::yaml::Node::Scalar(value,tag)=>Some(select_yaml_scalar(value,tag)?),payload=>match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}}}}else{{match choice.consume(payload,position)?{{core::yaml::ChoiceSelection::Selected{{variant,..}}=>Some(variant),core::yaml::ChoiceSelection::Pending=>None,}}}};}}Ok(())}})?;Ok(selected)}}",shape.property).unwrap();

    writeln!(out,"pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>,events:impl core::xml::ScopedSource)->core::Result<Stored>{{let mut reader=XmlReader::new();events.visit_scoped(|path,token,scope|reader.consume_scoped(path,token,Some(scope),source,inputs))?;reader.finish(source,inputs)}}").unwrap();
    writeln!(out,"pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>,events:impl core::yaml::Source)->core::Result<Stored>{{let mut reader=YamlReader::new()?;events.visit(|node,position|reader.consume(node,position,source,inputs))?;reader.finish(source,inputs)}}").unwrap();
    writeln!(out,"pub(super) fn read_xml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{let mut selected=None;core::xml::visit(source,|path,token|{{if selected.is_none(){{match xml_selection(path,&token){{Ok(Some(variant))=>selected=Some(variant),Ok(None)=>{{}},Err(_)=>selected={fallback:?},}}}}Ok(())}})?;match selected.or({fallback:?}){{").unwrap();
    for variant in &variants {
        writeln!(out,"Some({variant})=>part_{id}_{variant}::read_xml_document(source,inputs).map(Stored::V{variant}),").unwrap();
    }
    out.push_str(
        "_=>Err(RuntimeDiagnostic::new(\"xml.choice\",\"Missing XML choice discriminator\")),}}\n",
    );
    writeln!(out,"pub(super) fn read_yaml_document(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{match read_yaml(source,inputs,core::yaml::DocumentSource(source)){{Ok(value)=>Ok(value),Err(error)=>match yaml_selection(source).ok().flatten().or({fallback:?}){{").unwrap();
    for variant in &variants {
        writeln!(out,"Some({variant})=>part_{id}_{variant}::read_yaml_document(source,inputs).map(Stored::V{variant}),").unwrap();
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
    delegate_value!(
        "document",
        ",inputs:&InputView<'_>",
        "->core::Result<Vec<u8>>",
        ",inputs"
    );
    delegate_value!(
        "write_yaml",
        ",inputs:&InputView<'_>,out:&mut String",
        "->core::Result<()>",
        ",inputs,out"
    );
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
    delegate_value!(
        "write_yaml_indented",
        ",inputs:&InputView<'_>,out:&mut String,indent:&str",
        "->core::Result<()>",
        ",inputs,out,indent"
    );
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
        writeln!(out,"(Stored::V{variant}(value),Prepared::V{variant}(prepared))=>{{let attributes:&[core::xml::WriteAttribute<'_>]={};if !attributes.is_empty()&&!part_{id}_{variant}::has_raw(value){{out.container_with_attributes({route},attributes);}}part_{id}_{variant}::write_xml(value,prepared,inputs,out)}},",emitted_attributes[*variant]).unwrap();
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
