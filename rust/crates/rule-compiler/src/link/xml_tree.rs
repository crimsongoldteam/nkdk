use super::*;

pub(super) fn resolve(
    module: &Module,
    nodes: &[XmlTreeNode<String, XmlAttribute>],
    modules: &BTreeMap<&str, &Module>,
    ids: &BTreeMap<&str, u32>,
) -> Result<Vec<XmlTreeNode<ExpandedName, LinkedXmlAttribute>>, Diagnostic> {
    nodes
        .iter()
        .map(|node| {
            Ok(XmlTreeNode {
                name: expand_path(module, std::slice::from_ref(&node.name), &node.source)?
                    .remove(0),
                attributes: xml_attributes::resolve(module, &node.attributes, modules, ids)?,
                content: match &node.content {
                    XmlTreeContent::Constant(text) => XmlTreeContent::Constant(text.clone()),
                    XmlTreeContent::Field(name) => XmlTreeContent::Field(name.clone()),
                    XmlTreeContent::SelfValue => XmlTreeContent::SelfValue,
                    XmlTreeContent::Children(children) => {
                        XmlTreeContent::Children(resolve(module, children, modules, ids)?)
                    }
                },
                source: node.source.clone(),
            })
        })
        .collect()
}

pub(super) fn validate(
    value: &LinkedType,
    nodes: &[XmlTreeNode<ExpandedName, LinkedXmlAttribute>],
    source: &SourceLocation,
) -> Result<(), Diagnostic> {
    let mut bound = BTreeSet::new();
    walk(value, nodes, &mut bound)?;
    match value {
        LinkedType::Record(fields) if fields.iter().all(|field| bound.contains(&field.name)) => {
            Ok(())
        }
        LinkedType::Scalar(ScalarType::Text) if bound.contains("") => Ok(()),
        _ => Err(diagnostic(
            "unrepresented_field",
            source,
            "XML tree must bind every semantic field exactly once",
        )),
    }
}

fn walk(
    value: &LinkedType,
    nodes: &[XmlTreeNode<ExpandedName, LinkedXmlAttribute>],
    bound: &mut BTreeSet<String>,
) -> Result<(), Diagnostic> {
    let mut names = BTreeMap::new();
    for node in nodes {
        if let Some(first) = names.insert((&node.name.namespace, &node.name.local), &node.source) {
            let mut error = diagnostic(
                "xml_path_collision",
                &node.source,
                "XML tree siblings have the same expanded name",
            );
            error.related.push(first.clone());
            return Err(error);
        }
        check_attributes(&node.attributes)?;
        let binding = match &node.content {
            XmlTreeContent::Constant(_) => None,
            XmlTreeContent::Children(children) => {
                walk(value, children, bound)?;
                None
            }
            XmlTreeContent::Field(name) => {
                if !matches!(value,LinkedType::Record(fields) if fields.iter().any(|field| field.name == *name))
                {
                    return Err(diagnostic(
                        "unknown_representation_field",
                        &node.source,
                        "XML tree refers to an unknown field",
                    ));
                }
                Some(name.as_str())
            }
            XmlTreeContent::SelfValue => {
                if *value != LinkedType::Scalar(ScalarType::Text) {
                    return Err(diagnostic(
                        "expression_type_mismatch",
                        &node.source,
                        "XML self binding requires text",
                    ));
                }
                Some("")
            }
        };
        if let Some(name) = binding
            && !bound.insert(name.into())
        {
            return Err(diagnostic(
                "duplicate_representation_field",
                &node.source,
                "Semantic value is bound more than once",
            ));
        }
    }
    Ok(())
}

fn check_attributes(attributes: &[LinkedXmlAttribute]) -> Result<(), Diagnostic> {
    let mut seen = BTreeMap::<_, Vec<&LinkedXmlAttribute>>::new();
    for attribute in attributes {
        let same = seen
            .entry((&attribute.name.namespace, &attribute.name.local))
            .or_default();
        if let Some(first) = same.first() {
            let complementary = same.len() == 1
                && first
                    .when
                    .as_ref()
                    .zip(attribute.when.as_ref())
                    .is_some_and(|(a, b)| a.negates(b) || b.negates(a));
            if !complementary {
                let mut error = diagnostic(
                    "xml_path_collision",
                    &attribute.source,
                    "Repeated attributes require complementary conditions",
                );
                error.related.push(first.source.clone());
                return Err(error);
            }
        }
        same.push(attribute);
    }
    Ok(())
}
