use nkdk_conversion_core::facts::graph::{
    GraphBudget, GraphLimit, NamedAlternative, NamedUnionGraph, NodeId, UnionGraph, UnionNode,
};
use nkdk_conversion_core::facts::{FactIndexBuilder, FactState, Generation};

#[test]
fn prepared_index_distinguishes_missing_ambiguous_and_stale_facts() {
    let generation = Generation(7);
    let mut builder = FactIndexBuilder::new(generation);
    builder.extend([((2_u32, 1_u32), 20), ((1, 1), 10)]);
    builder.extend([((2, 1), 21), ((3, 1), 30)]);
    let index = builder.finish();
    assert_eq!(index.lookup(generation, &(1, 1)), FactState::Ready(&10));
    assert_eq!(index.lookup(generation, &(2, 1)), FactState::Ambiguous);
    assert_eq!(index.lookup(generation, &(9, 1)), FactState::Missing);
    assert_eq!(index.lookup(Generation(8), &(1, 1)), FactState::Unready);
    assert_eq!(index.lookup(generation, &(3, 1)), FactState::Ready(&30));
    for (rows, expected) in [
        (vec![(1, 10), (1, 10)], FactState::Ready(&10)),
        (vec![(1, 10), (1, 20), (1, 10)], FactState::Ambiguous),
    ] {
        let mut builder = FactIndexBuilder::new(generation);
        builder.extend(rows.clone());
        assert_eq!(
            builder.finish().lookup(generation, &1),
            FactState::Ambiguous
        );
        let mut builder = FactIndexBuilder::new(generation);
        builder.extend(rows);
        let coalesced = builder.finish_coalesced();
        assert_eq!(coalesced.lookup(generation, &1), expected);
        assert_eq!(coalesced.lookup(Generation(8), &1), FactState::Unready);
    }
    let mut incomplete_equal = FactIndexBuilder::new(generation);
    incomplete_equal.extend([(1, 10), (1, 10)]);
    incomplete_equal.mark_unready();
    assert_eq!(
        incomplete_equal.finish_coalesced().lookup(generation, &1),
        FactState::Unready
    );
    let empty = FactIndexBuilder::<u32, u32>::new(generation).finish();
    assert_eq!(empty.lookup(generation, &0), FactState::Missing);
    let mut incomplete = FactIndexBuilder::new(generation);
    incomplete.extend([(1, 10)]);
    incomplete.mark_unready();
    incomplete.extend([(2, 20)]);
    let incomplete = incomplete.finish();
    assert_eq!(incomplete.lookup(generation, &1), FactState::Unready);
    assert_eq!(incomplete.lookup(generation, &3), FactState::Unready);
}

#[test]
fn graph_unions_keep_unresolved_states_and_share_single_child_expansions() {
    use UnionNode::{Ambiguous, Missing, Union, Unready, Value};
    let generation = Generation(3);
    let graph = UnionGraph::prepare(
        generation,
        vec![
            Value("first"),
            Value("second"),
            Union(vec![NodeId(1), NodeId(0), NodeId(1)]),
            Union(vec![NodeId(2)]),
            Missing,
            Ambiguous,
            Unready,
            Union(vec![NodeId(0), NodeId(4)]),
            Union(vec![NodeId(4), NodeId(5)]),
            Union(vec![NodeId(5), NodeId(6)]),
            Union(vec![]),
            Union(vec![NodeId(99)]),
            Union(vec![NodeId(13)]),
            Union(vec![NodeId(12)]),
            Union(vec![NodeId(12), NodeId(0), NodeId(4)]),
        ],
        GraphBudget {
            nodes: 20,
            edges: 30,
            members: 30,
        },
    )
    .unwrap();
    let FactState::Ready(pair) = graph.lookup(generation, NodeId(2)) else {
        panic!("ready union")
    };
    assert_eq!(pair, [NodeId(1), NodeId(0)]);
    let FactState::Ready(alias) = graph.lookup(generation, NodeId(3)) else {
        panic!("ready alias")
    };
    assert!(std::ptr::eq(pair, alias));
    assert_eq!(graph.value(NodeId(0)), Some(&"first"));
    assert_eq!(graph.value(NodeId(2)), None);
    for (id, expected) in [
        (7, FactState::Missing),
        (8, FactState::Ambiguous),
        (9, FactState::Unready),
        (10, FactState::Ready(&[][..])),
        (11, FactState::Missing),
        (12, FactState::Cycle),
        (13, FactState::Cycle),
        (14, FactState::Cycle),
        (99, FactState::Missing),
    ] {
        assert_eq!(graph.lookup(generation, NodeId(id)), expected);
    }
    assert_eq!(graph.lookup(Generation(4), NodeId(2)), FactState::Unready);
}

#[test]
fn graph_preparation_is_bounded_and_does_not_recurse_down_long_chains() {
    let generation = Generation(1);
    let mut nodes = vec![UnionNode::Value(42)];
    nodes.extend((0..20_000).map(|id| UnionNode::Union(vec![NodeId(id)])));
    let graph = UnionGraph::prepare(
        generation,
        nodes,
        GraphBudget {
            nodes: 20_001,
            edges: 20_000,
            members: 1,
        },
    )
    .unwrap();
    assert_eq!(
        graph.lookup(generation, NodeId(20_000)),
        FactState::Ready(&[NodeId(0)][..])
    );
    for (budget, expected) in [
        (
            GraphBudget {
                nodes: 0,
                edges: 2,
                members: 2,
            },
            GraphLimit::Nodes,
        ),
        (
            GraphBudget {
                nodes: 2,
                edges: 0,
                members: 2,
            },
            GraphLimit::Edges,
        ),
        (
            GraphBudget {
                nodes: 2,
                edges: 2,
                members: 0,
            },
            GraphLimit::Members,
        ),
    ] {
        assert!(
            matches!(UnionGraph::prepare(generation, vec![UnionNode::Value(42), UnionNode::Union(vec![NodeId(0)])], budget), Err(limit) if limit == expected)
        );
    }
    assert!(matches!(
        UnionGraph::prepare(
            generation,
            vec![
                UnionNode::Value(1),
                UnionNode::Value(2),
                UnionNode::Union(vec![NodeId(0), NodeId(1)])
            ],
            GraphBudget {
                nodes: 3,
                edges: 2,
                members: 3
            },
        ),
        Err(GraphLimit::Members)
    ));
}

#[test]
fn nested_graph_keeps_first_occurrence_order_across_shared_branches() {
    let generation = Generation(5);
    let graph = UnionGraph::prepare(
        generation,
        vec![
            UnionNode::Value("first"),
            UnionNode::Value("second"),
            UnionNode::Value("third"),
            UnionNode::Union(vec![NodeId(2), NodeId(0)]),
            UnionNode::Union(vec![NodeId(1), NodeId(3), NodeId(2), NodeId(0)]),
        ],
        GraphBudget {
            nodes: 5,
            edges: 6,
            members: 9,
        },
    )
    .unwrap();
    assert_eq!(
        graph.lookup(generation, NodeId(4)),
        FactState::Ready(&[NodeId(1), NodeId(2), NodeId(0)][..])
    );
}

#[test]
fn named_union_exposes_borrowed_effective_values_in_declaration_order() {
    let generation = Generation(8);
    let graph = NamedUnionGraph::prepare(
        generation,
        vec![
            (
                "Основной".to_owned(),
                vec![
                    NamedAlternative::Value("Строка"),
                    NamedAlternative::Reference("Дополнительный".to_owned()),
                    NamedAlternative::Value("Строка"),
                ],
            ),
            (
                "Дополнительный".to_owned(),
                vec![
                    NamedAlternative::Value("Число"),
                    NamedAlternative::Value("Булево"),
                ],
            ),
            (
                "Цикл".to_owned(),
                vec![NamedAlternative::Reference("Цикл".to_owned())],
            ),
        ],
        GraphBudget {
            nodes: 16,
            edges: 16,
            members: 16,
        },
    )
    .unwrap();
    let FactState::Ready(values) = graph.lookup_values(generation, "Основной") else {
        panic!("effective type must be ready")
    };
    assert_eq!(
        values.collect::<Vec<_>>(),
        vec![&"Строка", &"Число", &"Булево"]
    );
    assert!(matches!(
        graph.lookup_values(generation, "Цикл"),
        FactState::Cycle
    ));
    assert!(matches!(
        graph.lookup_values(generation, "Нет"),
        FactState::Missing
    ));
    assert!(matches!(
        graph.lookup_values(Generation(9), "Основной"),
        FactState::Unready
    ));
}

#[test]
fn graph_deduplicates_equal_values_from_distinct_sources() {
    let generation = Generation(6);
    let graph = UnionGraph::prepare(
        generation,
        vec![
            UnionNode::Value("CatalogRef.Goods"),
            UnionNode::Value("CatalogRef.Goods"),
            UnionNode::Value("EnumRef.Status"),
            UnionNode::Union(vec![NodeId(2), NodeId(1), NodeId(0)]),
        ],
        GraphBudget {
            nodes: 4,
            edges: 3,
            members: 5,
        },
    )
    .unwrap();
    assert_eq!(
        graph.lookup(generation, NodeId(3)),
        FactState::Ready(&[NodeId(2), NodeId(0)][..])
    );
}

#[test]
fn named_graph_resolves_chains_and_preserves_distinct_failure_states() {
    use NamedAlternative::{Reference, Value};
    let generation = Generation(7);
    let graph = NamedUnionGraph::prepare(
        generation,
        vec![
            (
                "Owner".into(),
                vec![
                    Value("string"),
                    Reference("A".into()),
                    Reference("B".into()),
                ],
            ),
            ("A".into(), vec![Reference("B".into())]),
            ("B".into(), vec![Value("CatalogRef.Goods")]),
            ("Missing".into(), vec![Reference("NoSuchType".into())]),
            ("Empty".into(), vec![]),
            ("CycleA".into(), vec![Reference("CycleB".into())]),
            ("CycleB".into(), vec![Reference("CycleA".into())]),
            ("Duplicate".into(), vec![Value("one")]),
            ("Duplicate".into(), vec![Value("two")]),
        ],
        GraphBudget {
            nodes: 20,
            edges: 20,
            members: 20,
        },
    )
    .unwrap();
    let FactState::Ready(members) = graph.lookup(generation, "Owner") else {
        panic!("resolved owner")
    };
    assert_eq!(
        members
            .iter()
            .map(|id| graph.value(*id).unwrap())
            .copied()
            .collect::<Vec<_>>(),
        ["string", "CatalogRef.Goods"]
    );
    for (name, state) in [
        ("Missing", FactState::Missing),
        ("NoSuchType", FactState::Missing),
        ("Empty", FactState::Unready),
        ("CycleA", FactState::Cycle),
        ("CycleB", FactState::Cycle),
        ("Duplicate", FactState::Ambiguous),
    ] {
        assert_eq!(graph.lookup(generation, name), state);
    }
    assert_eq!(
        graph.lookup(Generation(8), "NoSuchType"),
        FactState::Unready
    );
}
