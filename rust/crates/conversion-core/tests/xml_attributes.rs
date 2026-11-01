use nkdk_conversion_core::{proof, xml};

#[test]
fn attribute_scan_shares_inherited_scopes_across_document_tree_and_patch() {
    use xml::Source;
    use xml::attribute_scan::{AttributePatch, Preserved, Profile, Xml};
    let profile = Profile {
        attribute: ("", "key"),
        default_scope: 0,
        max_depth: 16,
        boundaries: &[(("urn:a", "Group"), 1), (("urn:a", "Reset"), 0)],
    };
    let source = br#"<Root xmlns:a="urn:a" xmlns:b="urn:b" key="1"><a:Group key="2"><Unknown key="3"/><a:Reset key="4"/><b:Group key="5"/></a:Group><Sibling key="6" a:key="99"/></Root>"#;
    let tree = xml::Tree::capture(source, &[("", "Root")])
        .unwrap()
        .unwrap();
    let patch = xml::Patch::read(b"_key: '1'\na:Group:\n  _key: '2'\n  Unknown: {_key: '3'}\n  a:Reset: {_key: '4'}\n  b:Group: {_key: '5'}\nSibling: {_key: '6', '_a:key': '99'}\nRemoved: null\nEmpty: {_key: null}\n", &[("a","urn:a"),("b","urn:b")], &[]).unwrap();
    let mut actual = Vec::new();
    let mut collect = |scope, value: &str| {
        actual.push((scope, value.to_owned()));
        Ok(())
    };
    profile
        .visit(xml::DocumentSource(source), &mut collect)
        .unwrap();
    let mut visits = 0;
    profile
        .visit(
            Xml(xml::Events(|consume: &mut xml::Consumer<'_>| {
                visits += 1;
                xml::DocumentSource(source).visit(consume)
            })),
            &mut collect,
        )
        .unwrap();
    assert_eq!(visits, 1);
    profile.visit(&tree, &mut collect).unwrap();
    profile
        .visit(
            Preserved {
                patch: &patch,
                root: ("", "Root"),
                namespaces: &[("a", "urn:a"), ("b", "urn:b")],
            },
            &mut collect,
        )
        .unwrap();
    let expected = [(0, "1"), (1, "2"), (1, "3"), (0, "4"), (1, "5"), (0, "6")]
        .map(|(scope, value)| (scope, value.to_owned()));
    for view in actual.chunks_exact(expected.len()) {
        assert_eq!(view, expected);
    }
    assert_eq!(actual.len(), expected.len() * 4);
    // Standalone preserved descendants inherit their caller's current scope.
    let inherited = Profile {
        default_scope: 1,
        ..profile
    };
    let subtree =
        xml::Patch::read(b"_key: '7'\nChild: [{_key: '8'}, {_key: '8'}]", &[], &[]).unwrap();
    let mut actual = Vec::new();
    inherited
        .visit(
            Preserved {
                patch: &subtree,
                root: ("", "Unknown"),
                namespaces: &[],
            },
            |scope, value| {
                actual.push((scope, value.to_owned()));
                Ok(())
            },
        )
        .unwrap();
    assert_eq!(
        actual,
        [(1, "7"), (1, "8"), (1, "8")].map(|(s, v)| (s, v.to_owned()))
    );
    // Detached unknown descendants retain their declared ancestor's scope.
    for (ancestor, scope) in [(("urn:a", "Group"), 1), (("urn:a", "Reset"), 0)] {
        let path = [ancestor, ("", "Container")];
        let mut actual = Vec::new();
        profile
            .visit_from_boundary(
                xml::attribute_scan::InContext {
                    source: Preserved {
                        patch: &subtree,
                        root: ("", "Unknown"),
                        namespaces: &[],
                    },
                    ancestors: &path,
                },
                |slot, value| {
                    actual.push((slot, value.to_owned()));
                    Ok(())
                },
            )
            .unwrap();
        assert_eq!(
            actual,
            [(scope, "7"), (scope, "8"), (scope, "8")].map(|(s, v)| (s, v.to_owned()))
        );
        let saved = profile
            .capture(
                xml::attribute_scan::InContext {
                    source: Preserved {
                        patch: &subtree,
                        root: ("", "Unknown"),
                        namespaces: &[],
                    },
                    ancestors: &path,
                },
                Default::default(),
            )
            .unwrap();
        let mut values = Vec::new();
        profile
            .visit_snapshot(&saved, Default::default(), |slot, value| {
                values.push((slot, value.to_owned()));
                Ok(())
            })
            .unwrap();
        assert_eq!(
            values,
            [(scope, "7"), (scope, "8")].map(|(s, v)| (s, v.to_owned()))
        );
    }
    let context = [("urn:a", "Group"), ("", "Container")];
    assert!(
        Profile {
            max_depth: 2,
            ..profile
        }
        .visit_from_boundary(
            xml::attribute_scan::InContext {
                source: Preserved {
                    patch: &subtree,
                    root: ("", "Unknown"),
                    namespaces: &[]
                },
                ancestors: &context
            },
            |_, _| Ok(())
        )
        .is_err()
    );
    assert!(
        profile
            .visit_from_boundary(
                Preserved {
                    patch: &subtree,
                    root: ("", "Unknown"),
                    namespaces: &[]
                },
                |_, _| Ok(())
            )
            .is_err()
    );
    struct Broken(u8);
    impl xml::attribute_scan::Source for Broken {
        fn visit_attributes(
            self,
            mut consume: impl FnMut(xml::attribute_scan::Event<'_>) -> nkdk_conversion_core::Result<()>,
        ) -> nkdk_conversion_core::Result<()> {
            use xml::attribute_scan::Event;
            consume(match self.0 {
                0 => Event::Leave,
                1 => Event::Attribute(("", "key"), "1"),
                _ => Event::Enter(("", "Unknown")),
            })
        }
    }
    for kind in 0..3 {
        assert!(
            profile
                .visit_from_boundary(
                    xml::attribute_scan::InContext {
                        source: Broken(kind),
                        ancestors: &context
                    },
                    |_, _| Ok(())
                )
                .is_err()
        );
    }
    // Existing fragment borrows its v8/xs namespace declarations from the document.
    let fixture = include_bytes!(
        "../../../../packages/rules/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.xml"
    );
    let source = format!(
        "<Envelope xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xs=\"http://www.w3.org/2001/XMLSchema\">{}</Envelope>",
        std::str::from_utf8(fixture).unwrap()
    );
    let target = [
        ("", "Envelope"),
        ("", "Attribute"),
        ("", "Columns"),
        ("", "AdditionalColumns"),
    ];
    let tree = xml::Tree::capture(source.as_bytes(), &target)
        .unwrap()
        .unwrap();
    let attributes = Profile {
        attribute: ("", "id"),
        default_scope: 0,
        max_depth: 16,
        boundaries: &[(("", "Attribute"), 1), (("", "Column"), 1)],
    };
    let mut actual = Vec::new();
    attributes
        .visit_from_boundary(
            xml::attribute_scan::InContext {
                source: &tree,
                ancestors: &target[1..3],
            },
            |slot, value| {
                actual.push((slot, value.to_owned()));
                Ok(())
            },
        )
        .unwrap();
    assert_eq!(actual, [(1, "2".to_owned())]);
    let namespaces = [
        ("v8", "http://v8.1c.ru/8.1/data/core"),
        ("xs", "http://www.w3.org/2001/XMLSchema"),
    ];
    let patch = xml::Patch::read(
        tree.full_patch_yaml(&namespaces, &[]).unwrap().as_bytes(),
        &namespaces,
        &[],
    )
    .unwrap();
    let saved = attributes
        .capture(
            xml::attribute_scan::InContext {
                source: Preserved {
                    patch: &patch,
                    root: target[3],
                    namespaces: &namespaces,
                },
                ancestors: &target[1..3],
            },
            Default::default(),
        )
        .unwrap();
    let mut restored = Vec::new();
    attributes
        .visit_snapshot(&saved, Default::default(), |slot, value| {
            restored.push((slot, value.to_owned()));
            Ok(())
        })
        .unwrap();
    assert_eq!(restored, actual);
    for (payload, expected) in [("'9'", vec![(0, "9".to_owned())]), ("null", vec![])] {
        let patch = xml::Patch::read(payload.as_bytes(), &[], &[]).unwrap();
        let mut actual = Vec::new();
        inherited
            .visit(
                AttributePatch {
                    patch: &patch,
                    owner: ("urn:a", "Reset"),
                    name: ("", "key"),
                },
                |scope, value| {
                    actual.push((scope, value.to_owned()));
                    Ok(())
                },
            )
            .unwrap();
        assert_eq!(actual, expected);
    }
    assert!(
        Profile {
            max_depth: 1,
            ..profile
        }
        .visit(
            Preserved {
                patch: &subtree,
                root: ("", "Unknown"),
                namespaces: &[]
            },
            |_, _| Ok(())
        )
        .is_err()
    );
    for source in [
        b"<Root><Nested/></Root>".as_slice(),
        b"<Root><Nested><Deep/></Nested></Root>",
    ] {
        let limited = Profile {
            max_depth: 1,
            ..profile
        };
        assert!(
            limited
                .visit(xml::DocumentSource(source), |_, _| Ok(()))
                .is_err()
        );
        let tree = xml::Tree::capture(source, &[("", "Root")])
            .unwrap()
            .unwrap();
        assert!(limited.visit(&tree, |_, _| Ok(())).is_err());
    }
    let repeated = Profile {
        boundaries: &[(("", "Node"), 0), (("", "Node"), 1)],
        ..profile
    };
    assert!(
        repeated
            .visit(xml::DocumentSource(b"<Root/>"), |_, _| Ok(()))
            .is_err()
    );
}
#[test]
fn occupied_attribute_snapshots_rebind_boundaries_and_enforce_budgets() {
    use xml::attribute_scan::{Profile, SnapshotBudget};
    let profile = Profile {
        attribute: ("", "id"),
        default_scope: 0,
        max_depth: 16,
        boundaries: &[(("urn:a", "Root"), 0), (("urn:a", "Group"), 1)],
    };
    let budget = SnapshotBudget {
        values: 4,
        bytes: 2048,
    };
    let xml = br#"<a:Root xmlns:a="urn:a" id="1"><Unknown id="1"/><a:Group id="2"><Opaque id="18446744073709551615"/><Wrong id="02"/><Wrong id="0"/><Wrong id="-3"/><Wrong id="18446744073709551616"/><Wrong a:id="3"/></a:Group></a:Root>"#;
    let saved = profile.capture(xml::DocumentSource(xml), budget).unwrap();
    assert!(saved.len() < xml.len());
    // Persisted names survive slot changes; prepared owner keys aren't stored.
    let renamed = Profile {
        default_scope: 9,
        boundaries: &[(("urn:a", "Group"), 4), (("urn:a", "Root"), 9)],
        ..profile
    };
    let mut actual = Vec::new();
    renamed
        .visit_snapshot(&saved, budget, |scope, value| {
            actual.push((scope, value.to_owned()));
            Ok(())
        })
        .unwrap();
    actual.sort();
    assert_eq!(
        actual,
        [(4, "18446744073709551615"), (4, "2"), (9, "1")].map(|(s, v)| (s, v.to_owned()))
    );
    // Two boundaries may currently share a scope but must retain their own names.
    let shared = Profile {
        boundaries: &[(("urn:a", "Root"), 0), (("urn:a", "Group"), 0)],
        ..profile
    };
    let shared_snapshot = shared.capture(xml::DocumentSource(xml), budget).unwrap();
    let mut rebound = Vec::new();
    renamed
        .visit_snapshot(&shared_snapshot, budget, |scope, value| {
            rebound.push((scope, value.to_owned()));
            Ok(())
        })
        .unwrap();
    rebound.sort();
    assert_eq!(rebound, actual);
    // Namespace URIs can contain flow-YAML punctuation; quoted names round-trip.
    let punctuated = Profile {
        boundaries: &[(("urn:a,[b]", "Root"), 0)],
        ..profile
    };
    let saved_uri = punctuated
        .capture(
            xml::DocumentSource(br#"<Root xmlns="urn:a,[b]" id="1"/>"#),
            budget,
        )
        .unwrap();
    let mut visits = 0;
    punctuated
        .visit_snapshot(&saved_uri, budget, |_, value| {
            assert_eq!(value, "1");
            visits += 1;
            Ok(())
        })
        .unwrap();
    assert_eq!(visits, 1);
    let mut empty = 0;
    profile
        .visit_snapshot(&profile.empty_snapshot(budget).unwrap(), budget, |_, _| {
            empty += 1;
            Ok(())
        })
        .unwrap();
    assert_eq!(empty, 0);
    for limited in [
        SnapshotBudget {
            values: 2,
            ..budget
        },
        SnapshotBudget {
            bytes: 20,
            ..budget
        },
    ] {
        assert!(profile.capture(xml::DocumentSource(xml), limited).is_err());
        assert!(
            profile
                .visit_snapshot(&saved, limited, |_, _| Ok(()))
                .is_err()
        );
    }
    let wrong_attribute = Profile {
        attribute: ("", "key"),
        ..profile
    };
    assert!(
        wrong_attribute
            .visit_snapshot(&saved, budget, |_, _| Ok(()))
            .is_err()
    );
    let missing_boundary = Profile {
        boundaries: &[(("urn:a", "Root"), 0)],
        ..profile
    };
    assert!(
        missing_boundary
            .visit_snapshot(&saved, budget, |_, _| Ok(()))
            .is_err()
    );
    for invalid in [
        b"- unknown-version\n- ['', id]".as_slice(),
        b"- nkdk-attribute-reservations/1\n- ['', id]\n- [urn:a, Root, '0']",
        b"- nkdk-attribute-reservations/1\n- ['', id]\n- [urn:a, Root, '1']\n- [urn:a, Root, '1']",
        b"- nkdk-attribute-reservations/1\n- ['', id]\n- [urn:a, Root, '1', extra]",
        b"- nkdk-attribute-reservations/1\n- ['', id]\n- [[[[nested]]]]",
        b"- nkdk-attribute-reservations/1\n- !unknown ['', id]",
    ] {
        assert!(
            profile
                .visit_snapshot(invalid, budget, |_, _| Ok(()))
                .is_err()
        );
    }
}

#[test]
fn writer_rebases_reusable_routes_inside_nested_container() {
    let root = [("", "Root")];
    let nested = [("", "Root"), ("", "Next")];
    let field = [("", "Root"), ("", "Items"), ("", "Item")];
    let mut writer = xml::Writer::new(&[]);
    writer.container(&root);
    writer.with_route_alias(&root, &nested, |writer| {
        writer.field(&field, "second");
        writer.end_container_if_open(&field);
    });
    proof::verify(
        b"<Root><Next><Items><Item>second</Item></Items></Next></Root>",
        &writer.finish(),
        |path| path.last().is_some_and(|name| name.local == "Item"),
    )
    .unwrap();
}

#[test]
fn nested_chain_item_routes_project_to_one_compiled_route() {
    let root = [("", "Root")];
    let next = [("", "Next")];
    let item = [("", "Items")];
    let path = ["Root", "Next", "Next", "Items", "Item", "Name"]
        .into_iter()
        .map(|local| xml::Name {
            namespace: String::new(),
            local: local.into(),
        })
        .collect::<Vec<_>>();
    let mut scratch = Vec::new();
    let projected = xml::linear_chain_route_into(&path, &root, &next, &item, &mut scratch).unwrap();
    assert_eq!(
        projected
            .iter()
            .map(|name| name.local.as_str())
            .collect::<Vec<_>>(),
        ["Root", "Items", "Item", "Name"]
    );
    assert!(xml::linear_chain_route_into(&path[..3], &root, &next, &item, &mut scratch).is_none());
    assert!(xml::linear_chain_route_into(&path[..1], &root, &next, &item, &mut scratch).is_some());
}
#[test]
fn attributes_from_composed_values_share_one_element() {
    let path = [("", "Root"), ("", "Value")];
    let projected = xml::project_property(
        b"<Root><Value kind=\"Font\" faceName=\"Arial\"><Child kind=\"nested\"/></Value></Root>",
        &path,
        xml::PropertyProjection::WithoutAttributes(&[("", "kind")]),
        |_, _| false,
        |_| false,
    )
    .unwrap();
    proof::verify(
        b"<Root><Value faceName=\"Arial\"><Child kind=\"nested\"/></Value></Root>",
        &projected,
        |_| false,
    )
    .unwrap();
    let mut writer = xml::Writer::new(&[]);
    writer.container_with_attributes(
        &path,
        &[xml::WriteAttribute {
            name: ("", "kind"),
            value: xml::AttributeValue::Text("Font"),
        }],
    );
    writer.container_with_attributes(
        &path,
        &[xml::WriteAttribute {
            name: ("", "faceName"),
            value: xml::AttributeValue::Text("Arial"),
        }],
    );
    proof::verify(
        b"<Root><Value kind=\"Font\" faceName=\"Arial\"/></Root>",
        &writer.finish_with_root(("", "Root")),
        |_| false,
    )
    .unwrap();
}
#[test]
fn attribute_proof_uses_expanded_names_and_only_declared_qname_values() {
    let source=br#"<Root xmlns:a="urn:value" xmlns:t="urn:attribute" plain="one&#10;line" t:type="a:Kind"><Text>body</Text></Root>"#;
    let reordered=br#"<Root xmlns:b="urn:value" xmlns:u="urn:attribute" u:type="b:Kind" plain="one&#10;line"><Text>body</Text></Root>"#;
    let equivalent=br#"<Root xmlns:b="urn:value" xmlns:u="urn:attribute" plain="one&#10;line" u:type="b:Kind"><Text>body</Text></Root>"#;
    let scalar = |path: &[xml::Name]| path.last().is_some_and(|name| name.local == "Text");
    let qname = |_: &[xml::Name], name: &xml::Name| {
        name.namespace == "urn:attribute" && name.local == "type"
    };
    proof::verify_with_attributes(source, equivalent, scalar, qname).unwrap();
    assert!(proof::verify_with_attributes(source, reordered, scalar, qname).is_err());
    assert!(proof::verify(source, equivalent, scalar).is_err());
    assert!(
        proof::verify_with_attributes(
            source,
            &String::from_utf8(equivalent.to_vec())
                .unwrap()
                .replace("urn:value", "urn:changed")
                .into_bytes(),
            scalar,
            qname
        )
        .is_err()
    );
    assert!(proof::verify(b"<Root> </Root>", b"<Root/>", |_| false).is_err());
    proof::verify(b"<Root> a</Root>", b"<Root><![CDATA[ ]]>a</Root>", |_| {
        false
    })
    .unwrap();
    use xml::Source;
    let mut document_reads = 0;
    let mut scalar_text = String::new();
    let mut attributes = 0;
    xml::Events(|consume: &mut xml::Consumer<'_>| {
        document_reads += 1;
        xml::DocumentSource(source).visit(|path, token| {
            if matches!(token, xml::Token::Attribute(_)) {
                attributes += 1;
                return Ok(());
            }
            consume(path, token)
        })
    })
    .visit(|path, token| {
        if scalar(path)
            && let xml::Token::Text(text) = token
        {
            scalar_text.push_str(text);
        }
        Ok(())
    })
    .unwrap();
    assert_eq!((document_reads, attributes), (1, 2));
    assert_eq!(scalar_text, "body");
    let attribute_namespace = String::from("urn:attribute");
    let value_namespace = String::from("urn:value");
    let root_name = String::from("Root");
    let text_name = String::from("Text");
    let namespaces = [attribute_namespace.as_str(), value_namespace.as_str()];
    let mut writer = xml::Writer::new(&namespaces);
    writer.container_with_attributes(
        &[("", root_name.as_str())],
        &[
            xml::WriteAttribute {
                name: ("", "plain"),
                value: xml::AttributeValue::Text("one\nline"),
            },
            xml::WriteAttribute {
                name: ("urn:attribute", "type"),
                value: xml::AttributeValue::QName(("urn:value", "Kind")),
            },
        ],
    );
    writer.field(
        &[("", root_name.as_str()), ("", text_name.as_str())],
        "body",
    );
    proof::verify_with_attributes(
        source,
        &writer.finish_with_root(("", root_name.as_str())),
        scalar,
        qname,
    )
    .unwrap();
    proof::verify(
        b"<Root/>",
        &xml::Writer::new(&[]).finish_with_root(("", "Root")),
        |_| false,
    )
    .unwrap();
    let mut writer = xml::Writer::new(&[]);
    writer.field(&[("", "Root"), ("", "Properties"), ("", "First")], "one");
    writer.ensure_container(&[("", "Root")]);
    writer.ensure_container(&[("", "Root"), ("", "Properties")]);
    writer.field(&[("", "Root"), ("", "Properties"), ("", "Second")], "two");
    writer.ensure_container(&[("", "Root"), ("", "Children")]);
    proof::verify(
        b"<Root><Properties><First>one</First><Second>two</Second></Properties><Children/></Root>",
        &writer.finish(),
        |path| {
            path.last()
                .is_some_and(|name| matches!(name.local.as_str(), "First" | "Second"))
        },
    )
    .unwrap();
    for invalid in [
        br#"<Root xmlns:a="urn:x" xmlns:b="urn:x" a:x="1" b:x="2"/>"#.as_slice(),
        br#"<Root a:x="1"/>"#.as_slice(),
    ] {
        assert!(xml::visit(invalid, |_, _| Ok(())).is_err());
    }
}
