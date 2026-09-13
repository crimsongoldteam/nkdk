//! A prepared schedule shared by all consumers of the same declared facts.
//! Nodes are supplied by generated declarations; no metadata names live here.

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct StepId(pub u32);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlanError {
    UnknownStep(StepId),
    StepBudget,
    EdgeBudget,
    Cycle,
}

pub struct DependencyPlan {
    dependencies: Vec<Vec<StepId>>,
    consumers: Vec<Vec<StepId>>,
    order: Vec<StepId>,
}

impl DependencyPlan {
    pub fn new(mut dependencies: Vec<Vec<StepId>>, edge_budget: usize) -> Result<Self, PlanError> {
        let count = dependencies.len();
        if u32::try_from(count).is_err() {
            return Err(PlanError::StepBudget);
        }
        let mut remaining = Vec::with_capacity(count);
        let mut consumers = vec![Vec::new(); count];
        let mut edges = 0usize;
        for (index, inputs) in dependencies.iter_mut().enumerate() {
            edges = edges
                .checked_add(inputs.len())
                .ok_or(PlanError::EdgeBudget)?;
            if edges > edge_budget {
                return Err(PlanError::EdgeBudget);
            }
            inputs.sort_unstable();
            inputs.dedup();
            remaining.push(inputs.len());
            for input in inputs {
                let targets = consumers
                    .get_mut(input.0 as usize)
                    .ok_or(PlanError::UnknownStep(*input))?;
                targets.push(StepId(index as u32));
            }
        }
        let mut order: Vec<_> = remaining
            .iter()
            .enumerate()
            .filter(|(_, count)| **count == 0)
            .map(|(index, _)| StepId(index as u32))
            .collect();
        let mut cursor = 0;
        while cursor < order.len() {
            for consumer in &consumers[order[cursor].0 as usize] {
                let pending = &mut remaining[consumer.0 as usize];
                *pending -= 1;
                if *pending == 0 {
                    order.push(*consumer);
                }
            }
            cursor += 1;
        }
        if order.len() != count {
            return Err(PlanError::Cycle);
        }
        Ok(Self {
            dependencies,
            consumers,
            order,
        })
    }

    /// Each step occurs exactly once, after every dependency.
    pub fn order(&self) -> &[StepId] {
        &self.order
    }

    pub fn dependencies(&self, step: StepId) -> Option<&[StepId]> {
        self.dependencies.get(step.0 as usize).map(Vec::as_slice)
    }

    /// Includes changed sources themselves; returns dependency order for rebuilding.
    /// Only declared downstream consumers are invalidated.
    pub fn affected(&self, changed: &[StepId]) -> Result<Vec<StepId>, PlanError> {
        let mut marked = vec![false; self.order.len()];
        for step in changed {
            *marked
                .get_mut(step.0 as usize)
                .ok_or(PlanError::UnknownStep(*step))? = true;
        }
        let mut result = Vec::new();
        for step in &self.order {
            if marked[step.0 as usize] {
                result.push(*step);
                for consumer in &self.consumers[step.0 as usize] {
                    marked[consumer.0 as usize] = true;
                }
            }
        }
        Ok(result)
    }
}
