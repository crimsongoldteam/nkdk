//! Definition identity is independent of the XML/YAML placement of a use.
use nkdk_rule_model::{LinkedBinding, LinkedExpression, LinkedExpressionKind, LinkedType, Program};

fn same_expression(left: &LinkedExpression, right: &LinkedExpression) -> bool {
    if !same_type(&left.value_type, &right.value_type) {
        return false;
    }
    match (&left.kind, &right.kind) {
        // The caller supplies this slot. The prepared body sees the same
        // declared input after the connection rebinds its source slot.
        (LinkedExpressionKind::Input(_), LinkedExpressionKind::Input(_)) => true,
        (
            LinkedExpressionKind::Operation {
                operator: left_operator,
                arguments: left,
                ..
            },
            LinkedExpressionKind::Operation {
                operator: right_operator,
                arguments: right,
                ..
            },
        ) => {
            left_operator == right_operator
                && left.len() == right.len()
                && left
                    .iter()
                    .zip(right)
                    .all(|(left, right)| same_expression(left, right))
        }
        _ => left.equivalent_to(right),
    }
}

fn same_type(left: &LinkedType, right: &LinkedType) -> bool {
    if let (
        Some((left_id, left_bindings, left_arguments)),
        Some((right_id, right_bindings, right_arguments)),
    ) = (left.as_reference(), right.as_reference())
    {
        return left_id == right_id
            && same_bindings(left_bindings, right_bindings)
            && same_arguments(left_arguments, right_arguments);
    }
    match (left, right) {
        (LinkedType::Record(left), LinkedType::Record(right))
        | (LinkedType::Choice(left), LinkedType::Choice(right)) => {
            left.len() == right.len()
                && left.iter().zip(right).all(|(left, right)| {
                    left.name == right.name && same_type(&left.value, &right.value)
                })
        }
        (
            LinkedType::Index {
                key: left_key,
                value: left_value,
            },
            LinkedType::Index {
                key: right_key,
                value: right_value,
            },
        ) => same_type(left_key, right_key) && same_type(left_value, right_value),
        (LinkedType::Optional(left), LinkedType::Optional(right))
        | (LinkedType::Sequence(left), LinkedType::Sequence(right)) => same_type(left, right),
        (LinkedType::Scalar(left), LinkedType::Scalar(right)) => left == right,
        (LinkedType::ScalarChoice(left), LinkedType::ScalarChoice(right)) => left == right,
        (LinkedType::Enum(left), LinkedType::Enum(right)) => left == right,
        (LinkedType::Absent, LinkedType::Absent) => true,
        _ => false,
    }
}

fn same_bindings(left: &[LinkedBinding], right: &[LinkedBinding]) -> bool {
    left.len() == right.len()
        && left.iter().zip(right).all(|(left, right)| {
            left.slot == right.slot && same_expression(&left.value, &right.value)
        })
}

fn same_arguments(left: &[LinkedExpression], right: &[LinkedExpression]) -> bool {
    left.len() == right.len()
        && left
            .iter()
            .zip(right)
            .all(|(left, right)| same_expression(left, right))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) struct DefinitionId(pub(crate) usize);

#[derive(Debug)]
struct Definition {
    target: u32,
    bindings: Vec<LinkedBinding>,
    arguments: Vec<LinkedExpression>,
}

#[derive(Debug, Default)]
pub(crate) struct Definitions {
    entries: Vec<Definition>,
    connections: usize,
}

impl Definitions {
    pub(crate) fn prepare(program: &Program) -> Self {
        let mut definitions = Self::default();
        for entry in &program.entries {
            let LinkedType::Record(fields) = &entry.value else {
                continue;
            };
            for field in fields {
                if let Some((target, bindings, arguments)) = field.value.as_reference() {
                    definitions.connections += 1;
                    definitions.intern(target, bindings, arguments);
                }
            }
        }
        definitions
    }

    pub(crate) fn counts(&self) -> (usize, usize) {
        (self.entries.len(), self.connections)
    }

    pub(crate) fn id(
        &self,
        target: u32,
        bindings: &[LinkedBinding],
        arguments: &[LinkedExpression],
    ) -> Option<DefinitionId> {
        self.entries
            .iter()
            .position(|entry| {
                entry.target == target
                    && same_bindings(&entry.bindings, bindings)
                    && same_arguments(&entry.arguments, arguments)
            })
            .map(DefinitionId)
    }

    fn intern(
        &mut self,
        target: u32,
        bindings: &[LinkedBinding],
        arguments: &[LinkedExpression],
    ) -> DefinitionId {
        if let Some(id) = self.id(target, bindings, arguments) {
            return id;
        }
        let id = DefinitionId(self.entries.len());
        self.entries.push(Definition {
            target,
            bindings: bindings.to_vec(),
            arguments: arguments.to_vec(),
        });
        id
    }
}
