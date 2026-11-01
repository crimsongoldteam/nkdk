//! Private value identities do not depend on the number of executable entries.
use nkdk_rule_model::*;
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};

pub(crate) fn stabilize(program: &mut Program) -> Result<(), String> {
    let mut ids = BTreeMap::new();
    let mut reserved: BTreeSet<_> = program
        .entries
        .iter()
        .filter(|entry| matches!(entry.kind, ModuleKind::Object | ModuleKind::Resources))
        .map(|entry| entry.id)
        .collect();
    for entry in &program.entries {
        if matches!(entry.kind, ModuleKind::Object | ModuleKind::Resources) {
            continue;
        }
        let digest = Sha256::digest(entry.name.as_bytes());
        let id = u32::from_le_bytes(digest[..4].try_into().unwrap()) | (1 << 31);
        if !reserved.insert(id) {
            return Err(format!(
                "Private definition identity collision: {}",
                entry.name
            ));
        }
        ids.insert(entry.id, id);
    }
    let remap = Remap(ids);
    for entry in &mut program.entries {
        remap.id(&mut entry.id);
        if let Some(scope) = &mut entry.input_scope {
            remap.id(scope);
        }
        remap.ty(&mut entry.value);
        for input in &mut entry.inputs {
            remap.ty(&mut input.value);
        }
        for parameter in &mut entry.parameters {
            remap.ty(&mut parameter.value_type);
        }
        remap.xml(&mut entry.xml);
        for rule in &mut entry.presence {
            for expression in rule.expressions_mut() {
                remap.expr(expression);
            }
        }
        for short in &mut entry.shorthands {
            for expression in short.expressions_mut() {
                remap.expr(expression);
            }
        }
        for constraint in &mut entry.constraints {
            crate::expressions::map_constraint(constraint, |expression| remap.expr(expression));
            if let Some(iteration) = &mut constraint.for_each {
                remap.expr(&mut iteration.input);
            }
        }
        if let Some(normalization) = &mut entry.normalization {
            remap.expr(&mut normalization.when);
            remap.expr(&mut normalization.denotes);
        }
        for contribution in &mut entry.contributions {
            if let Some(when) = &mut contribution.when {
                remap.expr(when);
            }
            if let Some(iteration) = &mut contribution.for_each {
                remap.expr(&mut iteration.input);
            }
            remap.expr(&mut contribution.key);
            if let Some(value) = contribution.write.value_mut() {
                remap.expr(value);
            }
        }
        for file in &mut entry.yaml_files {
            remap.expr(&mut file.path);
        }
        for group in &mut entry.resources {
            if let Some(iteration) = &mut group.for_each {
                remap.expr(&mut iteration.input);
            }
            for route in &mut group.alternatives {
                remap.expr(&mut route.xml);
                remap.expr(&mut route.yaml);
            }
        }
    }
    Ok(())
}
struct Remap(BTreeMap<u32, u32>);
impl Remap {
    fn id(&self, id: &mut u32) {
        if let Some(replacement) = self.0.get(id) {
            *id = *replacement;
        }
    }
    fn ty(&self, ty: &mut LinkedType) {
        match ty {
            LinkedType::Reference(id) => self.id(id),
            LinkedType::BoundReference {
                entry,
                bindings,
                arguments,
            } => {
                self.id(entry);
                for binding in bindings {
                    self.expr(&mut binding.value);
                }
                for argument in arguments {
                    self.expr(argument);
                }
            }
            LinkedType::Choice(fields) | LinkedType::Record(fields) => {
                for field in fields {
                    self.ty(&mut field.value);
                }
            }
            LinkedType::Optional(inner) | LinkedType::Sequence(inner) => self.ty(inner),
            LinkedType::Index { key, value } => {
                self.ty(key);
                self.ty(value);
            }
            LinkedType::ScalarChoice(_)
            | LinkedType::Enum(_)
            | LinkedType::Absent
            | LinkedType::Scalar(_) => {}
        }
    }
    fn expr(&self, expression: &mut LinkedExpression) {
        self.ty(&mut expression.value_type);
        if let LinkedExpressionKind::Operation {
            operator,
            arguments,
        } = &mut expression.kind
        {
            if let LinkedOperator::Transform { entry, .. } = operator {
                self.id(entry);
            }
            for argument in arguments {
                self.expr(argument);
            }
        }
    }
    fn xml(&self, xml: &mut LinkedXml) {
        match xml {
            LinkedXml::WithAttributes {
                attributes,
                content,
            } => {
                self.attributes(attributes);
                self.xml(content);
            }
            LinkedXml::ElementSequence { item, .. } => self.xml(item),
            LinkedXml::Tree(nodes) => self.nodes(nodes),
            _ => {}
        }
    }
    fn attributes(&self, attributes: &mut [LinkedXmlAttribute]) {
        for attribute in attributes {
            if let Some(when) = &mut attribute.when {
                self.expr(when);
            }
        }
    }
    fn nodes(&self, nodes: &mut [XmlTreeNode<ExpandedName, LinkedXmlAttribute>]) {
        for node in nodes {
            self.attributes(&mut node.attributes);
            if let XmlTreeContent::Children(children) = &mut node.content {
                self.nodes(children);
            }
        }
    }
}
