use nkdk_conversion_core::facts::dependencies::{DependencyPlan, PlanError, StepId};

#[test]
fn shared_preparation_runs_once_and_changes_reach_only_declared_consumers() {
    let plan = DependencyPlan::new(
        vec![
            vec![],
            vec![],
            vec![StepId(0)],
            vec![StepId(2)],
            vec![StepId(2), StepId(1)],
            vec![StepId(1)],
        ],
        8,
    )
    .unwrap();
    let mut runs = [0; 6];
    for step in plan.order() {
        runs[step.0 as usize] += 1;
        for dependency in plan.dependencies(*step).unwrap() {
            assert_eq!(runs[dependency.0 as usize], 1);
        }
    }
    assert_eq!(runs, [1; 6]);
    assert_eq!(
        plan.affected(&[StepId(0)]).unwrap(),
        vec![StepId(0), StepId(2), StepId(3), StepId(4)]
    );
    let mut affected = plan.affected(&[StepId(1), StepId(1)]).unwrap();
    assert_eq!(affected.first(), Some(&StepId(1)));
    affected.sort_unstable();
    assert_eq!(affected, vec![StepId(1), StepId(4), StepId(5)]);
    assert!(plan.affected(&[]).unwrap().is_empty());
    assert_eq!(
        plan.affected(&[StepId(6)]),
        Err(PlanError::UnknownStep(StepId(6)))
    );
    assert!(plan.dependencies(StepId(6)).is_none());
}

#[test]
fn invalid_plans_never_publish_a_partial_order() {
    assert!(matches!(
        DependencyPlan::new(vec![vec![StepId(1)], vec![StepId(0)]], 2),
        Err(PlanError::Cycle)
    ));
    assert!(matches!(
        DependencyPlan::new(vec![vec![StepId(2)]], 2),
        Err(PlanError::UnknownStep(StepId(2)))
    ));
    assert!(matches!(
        DependencyPlan::new(vec![vec![], vec![StepId(0)]], 0),
        Err(PlanError::EdgeBudget)
    ));
    let plan = DependencyPlan::new(vec![vec![], vec![StepId(0), StepId(0)]], 2).unwrap();
    assert_eq!(plan.dependencies(StepId(1)).unwrap(), &[StepId(0)]);
    let steps = 20_000u32;
    let chain = (0..steps)
        .map(|i| if i == 0 { vec![] } else { vec![StepId(i - 1)] })
        .collect();
    let plan = DependencyPlan::new(chain, steps as usize).unwrap();
    assert_eq!(plan.order().len(), steps as usize);
    assert_eq!(plan.affected(&[StepId(0)]).unwrap().len(), steps as usize);
}
