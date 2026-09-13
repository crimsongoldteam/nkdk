use super::*;
use std::fmt::Write;

#[derive(Default)]
pub(super) struct Tree {
    pub fields: Vec<LinkedXmlField>,
    pub definitions: String,
    next_condition: usize,
    pub starts: String,
    pub text: String,
    pub attributes: String,
    pub write: String,
    pub namespaces: BTreeSet<String>,
    pub qnames: BTreeSet<(String, String)>,
    pub scalar_paths: Vec<Vec<ExpandedName>>,
}

pub(super) fn lower(
    entry: &LinkedEntry,
    nodes: &[XmlTreeNode<ExpandedName, LinkedXmlAttribute>],
    fields: &[LinkedField],
    parent: &[ExpandedName],
    program: &Program,
    bindings: &[LinkedBinding],
    arguments: &[LinkedExpression],
) -> Result<Tree, Diagnostic> {
    let mut result = Tree::default();
    let context = Context {
        entry,
        program,
        fields,
        parent,
        bindings,
        arguments,
    };
    walk(&context, nodes, &[], &mut result)?;
    Ok(result)
}

struct Context<'a> {
    entry: &'a LinkedEntry,
    program: &'a Program,
    fields: &'a [LinkedField],
    parent: &'a [ExpandedName],
    bindings: &'a [LinkedBinding],
    arguments: &'a [LinkedExpression],
}
fn walk(
    context: &Context<'_>,
    nodes: &[XmlTreeNode<ExpandedName, LinkedXmlAttribute>],
    relative: &[ExpandedName],
    result: &mut Tree,
) -> Result<(), Diagnostic> {
    let Context {
        entry,
        fields,
        parent,
        ..
    } = context;
    for node in nodes {
        let relative: Vec<_> = relative
            .iter()
            .chain(std::iter::once(&node.name))
            .cloned()
            .collect();
        let path: Vec<_> = parent.iter().chain(&relative).cloned().collect();
        let code = record::path_code(&path);
        result.namespaces.insert(node.name.namespace.clone());
        writeln!(
            result.starts,
            "if core::xml::matches(path,{code}) {{return Ok(());}}"
        )
        .unwrap();
        let mut attributes = Vec::new();
        let conditional = node
            .attributes
            .iter()
            .any(|attribute| attribute.when.is_some());
        let mut conditions: Vec<(&LinkedExpression, String)> = Vec::new();
        let mut read_attributes = BTreeSet::new();
        for attribute in &node.attributes {
            result.namespaces.insert(attribute.name.namespace.clone());
            let name = (&attribute.name.namespace, &attribute.name.local);
            let value = match &attribute.value {
                LinkedXmlAttributeValue::Text(text) => {
                    format!("core::xml::AttributeValue::Text({text:?})")
                }
                LinkedXmlAttributeValue::QName(value) => {
                    result.namespaces.insert(value.namespace.clone());
                    result.qnames.insert((name.0.clone(), name.1.clone()));
                    format!(
                        "core::xml::AttributeValue::QName(({:?},{:?}))",
                        value.namespace, value.local
                    )
                }
            };
            let attribute_value =
                format!("core::xml::WriteAttribute{{name:{name:?},value:{value}}}");
            if let Some(when) = &attribute.when {
                let cached = conditions.iter().find_map(|(condition, name)| {
                    if when.equivalent_to(condition) {
                        Some(name.clone())
                    } else if when.negates(condition) || condition.negates(when) {
                        Some(format!("!{name}"))
                    } else {
                        None
                    }
                });
                let condition = if let Some(name) = cached {
                    name
                } else {
                    let index = result.next_condition;
                    result.next_condition += 1;
                    let function = format!("tree_condition_{}_{index}", entry.id);
                    let (definitions, expression) = super::row_expression::generate(
                        entry,
                        context.program,
                        fields,
                        when,
                        context.bindings,
                        context.arguments,
                    )?;
                    writeln!(result.definitions,"fn {function}(row:&R{},_inputs:&PreparedInputs)->core::Result<bool>{{{definitions} let result={expression}; Ok(result)}}",entry.id).unwrap();
                    let name = format!("condition_{index}");
                    writeln!(result.write, "let {name}={function}(row,_inputs)?;").unwrap();
                    conditions.push((when, name.clone()));
                    name
                };
                attributes.push(format!("({condition}).then_some({attribute_value})"));
            } else if conditional {
                attributes.push(format!("Some({attribute_value})"));
            } else {
                attributes.push(attribute_value);
            }
            if !read_attributes.insert(name) {
                continue;
            }
            let namespace = if name.0.is_empty() {
                "_attribute.name.namespace.is_empty()".into()
            } else {
                format!("_attribute.name.namespace=={:?}", name.0)
            };
            writeln!(result.attributes,"if core::xml::matches(path,{code}) && {namespace} && _attribute.name.local=={:?} {{return Ok(());}}",name.1).unwrap();
        }
        let attributes = if conditional {
            format!("[{}].iter().flatten()", attributes.join(","))
        } else {
            format!("&[{}]", attributes.join(","))
        };
        let value = match &node.content {
            XmlTreeContent::Constant(text) => {
                writeln!(
                    result.text,
                    "if core::xml::matches(path,{code}) {{return Ok(());}}"
                )
                .unwrap();
                Some(format!("{text:?}"))
            }
            XmlTreeContent::Children(children) => {
                writeln!(
                    result.write,
                    "out.container_with_attributes({code},{attributes});"
                )
                .unwrap();
                walk(context, children, &relative, result)?;
                result.write.push_str("out.end_container();\n");
                None
            }
            content => {
                let index = match content {
                    XmlTreeContent::SelfValue => 0,
                    XmlTreeContent::Field(name) => fields
                        .iter()
                        .position(|field| field.name == *name)
                        .expect("linked tree binding"),
                    _ => unreachable!(),
                };
                result.fields.push(LinkedXmlField {
                    file: None,
                    field: fields[index].name.clone(),
                    path: relative,
                    attribute: None,
                    source: node.source.clone(),
                });
                Some(
                    scalar::Codec::resolve(&fields[index].value, entry, context.program)?
                        .write_reference(
                            &collection_values::name(entry.id),
                            &format!("&row.fields[{index}]"),
                            true,
                        ),
                )
            }
        };
        if let Some(value) = value {
            result.scalar_paths.push(path);
            writeln!(
                result.write,
                "out.field_with_attributes({code},{value},{attributes});"
            )
            .unwrap();
        }
    }
    result.namespaces.remove("");
    Ok(())
}
