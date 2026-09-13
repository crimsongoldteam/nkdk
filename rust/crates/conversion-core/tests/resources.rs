use nkdk_conversion_core::{
    Direction,
    resources::{Limits, Plan, RelativePath, Route},
};

#[test]
fn resource_paths_and_plan_limits_preserve_routes_without_io() {
    for parts in [
        vec![""],
        vec!["."],
        vec![".."],
        vec!["a/b"],
        vec!["a\\b"],
        vec!["C:"],
        vec!["a\0b"],
        vec![],
    ] {
        assert!(RelativePath::new(parts, 64).is_err());
    }
    let xml = RelativePath::new(["Commands", "Команда", "Ext", "Module.bsl"], 128).unwrap();
    let yaml = RelativePath::new(["Команды", "Команда.bsl"], 128).unwrap();
    assert!(RelativePath::new(["я"], 1).is_err());
    assert!(RelativePath::new(["ab", "cd"], 4).is_err());
    assert_eq!(
        RelativePath::new(["ab", "cd"], 5).unwrap().segments().len(),
        2
    );
    let route = Route::new(xml.clone(), yaml.clone());
    assert!(!route.is_remainder());
    assert!(route.clone().remainder().is_remainder());
    assert_eq!(route.paths(Direction::XmlToYaml), (&xml, &yaml));
    assert_eq!(route.paths(Direction::YamlToXml), (&yaml, &xml));
    assert!(nkdk_conversion_core::resources::concat(&["я", "б"], 3).is_err());
    assert_eq!(
        nkdk_conversion_core::resources::concat(&["я", "б"], 4).unwrap(),
        "яб"
    );
    let limits = Limits {
        groups: 1,
        routes: 1,
        path_bytes: 256,
    };
    let mut plan = Plan::new(limits);
    assert!(plan.push(vec![]).is_err());
    assert!(
        plan.push(vec![route.clone(), route.clone().remainder()])
            .is_err()
    );
    assert!(plan.push(vec![route.clone(), route.clone()]).is_err());
    assert!(plan.groups().is_empty());
    plan.push(vec![route.clone()]).unwrap();
    assert!(plan.push(vec![route.clone()]).is_err());
    assert_eq!(plan.groups().len(), 1);
    let mut tiny = Plan::new(Limits {
        path_bytes: 1,
        ..limits
    });
    assert!(tiny.push(vec![route]).is_err());
    assert!(tiny.groups().is_empty());
}
