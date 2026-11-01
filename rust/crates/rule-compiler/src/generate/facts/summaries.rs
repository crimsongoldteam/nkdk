use super::*;

/// A closed equality query over the very sequence being traversed. Preparing
/// its multiplicity once preserves `one` semantics without a scan for each row.
#[derive(Default)]
pub(super) struct Summaries {
    queries: Vec<(LinkedExpression, LinkedExpression, u32)>,
    fields: BTreeSet<u32>,
}
impl Summaries {
    pub(super) fn new(contribution: &LinkedContribution) -> Self {
        let mut result = Self::default();
        let Some(iteration) = &contribution.for_each else {
            return result;
        };
        for expression in std::iter::once(&contribution.key)
            .chain(contribution.write.value())
            .chain(contribution.when.as_ref())
        {
            result.collect(expression, &iteration.input);
        }
        result
    }
    fn field(expression: &LinkedExpression, binding: u32) -> Option<u32> {
        let LinkedExpressionKind::Operation {
            operator: LinkedOperator::Get(field),
            arguments,
        } = &expression.kind
        else {
            return None;
        };
        matches!(arguments.as_slice(), [row] if row.kind == LinkedExpressionKind::Variable(binding))
            .then_some(*field)
    }
    fn collect(&mut self, expression: &LinkedExpression, input: &LinkedExpression) {
        if let LinkedExpressionKind::Operation {
            operator: LinkedOperator::One(binding),
            arguments,
        } = &expression.kind
            && let [sequence, predicate] = arguments.as_slice()
            && sequence.equivalent_to(input)
            && let LinkedExpressionKind::Operation {
                operator: LinkedOperator::Equal,
                arguments,
            } = &predicate.kind
            && let [left, right] = arguments.as_slice()
        {
            for (candidate, current) in [(left, right), (right, left)] {
                if let Some(field) = Self::field(candidate, *binding)
                    && Self::field(current, 0) == Some(field)
                    && current.value_type == LinkedType::Scalar(ScalarType::Text)
                {
                    if !self.contains(expression) {
                        self.queries
                            .push((expression.clone(), current.clone(), field));
                        self.fields.insert(field);
                    }
                    return;
                }
            }
        }
        if let LinkedExpressionKind::Operation { arguments, .. } = &expression.kind {
            for argument in arguments {
                self.collect(argument, input);
            }
        }
    }
    pub(super) fn contains(&self, expression: &LinkedExpression) -> bool {
        self.queries
            .iter()
            .any(|(query, _, _)| query.equivalent_to(expression))
    }
    pub(super) fn is_empty(&self) -> bool {
        self.queries.is_empty()
    }
    pub(super) fn bind(
        &self,
        expressions: &mut super::super::expressions::Expressions<'_>,
    ) -> Result<(), Diagnostic> {
        for (query, current, field) in &self.queries {
            let key = expressions.lower(current)?;
            expressions.prepared.push((
                query.clone(),
                format!("_unique_keys{field}.get({key}).copied().unwrap_or(false)"),
            ));
        }
        Ok(())
    }
    pub(super) fn prepare(&self) -> String {
        let mut out = String::new();
        for field in &self.fields {
            writeln!(
                out,
                "let mut _unique_keys{field}=std::collections::HashMap::<&str,bool>::new();"
            )
            .unwrap();
        }
        if !self.fields.is_empty() {
            out.push_str("for candidate in rows.iter(){");
            for field in &self.fields {
                writeln!(out,"let key=candidate.text({field}).map_err(|error|vec![error])?;_unique_keys{field}.entry(key).and_modify(|unique|*unique=false).or_insert(true);").unwrap();
            }
            out.push('}');
        }
        out
    }
}
