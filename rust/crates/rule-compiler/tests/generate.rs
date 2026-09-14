use nkdk_rule_compiler::{SourceFile, generate, link, parse, schema};
use std::{fs, process::Command};

#[test]
fn generated_rust_executes_both_directions_and_uses_the_imported_table() {
    let directional = include_str!("fixtures/directional-fields.yaml");
    let computed = directional
        .replace("test.directional-fields", "test.computed-fields")
        .replace("{field: left, path: [Root, Left]}, ", "");
    let computed_row = computed
        .replace("kind: object", "kind: value")
        .replace("test.computed-fields", "test.computed-row")
        .replace("[Root, Right]", "[Right]");
    let computed_rows = "format: nkdk-declarations/1\nkind: value\nid: test.computed-rows\nimports: {row: test.computed-row}\nvalue: {kind: sequence, item: {use: row}}\nrepresentations:\n  xml: {kind: element-sequence, path: [Item]}\n  yaml: {kind: record-mapping, key: right}\n";
    let computed_collection = "format: nkdk-declarations/1\nkind: object\nid: test.computed-collection\nimports: {rows: test.computed-rows}\nvalue: {kind: record, fields: [{name: rows, type: {use: rows}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: rows, path: [Root, Rows]}]}\n  yaml: {kind: mapping, fields: [{field: rows, key: Rows}]}\n";
    let computed_nested = format!("{computed_row}\n- target: self\n  xml: {{missing: {{denotes: {{absent: true}}}}}}\n  yaml: {{missing: {{denotes: {{absent: true}}}}}}\n")
        .replace("test.computed-row", "test.computed-nested");
    let computed_owner = "format: nkdk-declarations/1\nkind: object\nid: test.computed-owner\nimports: {row: test.computed-nested, extra: common.directional-extra}\nvalue: {kind: record, fields: [{name: row, type: {use: row}}, {name: extra, type: {use: extra}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: row, path: [Root, Row]}, {field: extra, path: [Root, Extra]}]}\n  yaml: {kind: mapping, fields: [{field: row, key: Row}, {field: extra, key: Extra}]}\n";
    let computed_checked = format!(
        "{computed}\nconstraints:\n- id: allowed\n  appliesTo: [xml-import, yaml-validation]\n  assert: {{not: {{eq: [{{field: left}}, {{literal: bad}}]}}}}\n  diagnostic: {{code: computed.invalid, severity: error, at: {{field: left}}, message: Unavailable value}}\n"
    );
    let directional_extra = "format: nkdk-declarations/1\nkind: value\nid: common.directional-extra\nvalue: {kind: record, fields: [{name: marker, type: {kind: scalar, scalar: text}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: marker, path: [Marker]}]}\n  yaml: {kind: mapping, fields: [{field: marker, key: Marker}]}\n";
    let directional_composed = directional
        .replace(
            "test.directional-fields",
            "test.directional-composed\nimports: {extra: common.directional-extra}",
        )
        .replace(
            "representations:",
            "  - {name: extra, type: {use: extra}}\nrepresentations:",
        )
        .replace(
            "[{field: left, path:",
            "[{field: extra, path: [Root, Extra]}, {field: left, path:",
        )
        .replace(
            "[{field: left, key:",
            "[{field: extra, key: Extra}, {field: left, key:",
        );
    let computed_composed = directional_composed
        .replace("test.directional-composed", "test.computed-composed")
        .replace("{field: left, path: [Root, Left]}, ", "");
    let computed_composed = format!(
        "{computed_composed}\nconstraints:{}",
        computed_checked.split_once("\nconstraints:").unwrap().1
    );
    let projections = include_str!("fixtures/state-projections.yaml");
    let projections_composed = projections
        .replace("test.state-projections", "test.state-projections-composed")
        .replace(
            "imports: {state: common.finite-states}",
            "imports: {state: common.finite-states, extra: common.directional-extra}",
        )
        .replace(
            "representations:",
            "  - {name: extra, type: {use: extra}}\nrepresentations:",
        )
        .replace(
            "fields: [{field: base,",
            "fields: [{field: extra, path: [Root, Extra]}, {field: base,",
        )
        .replace(
            "fields: [{field: state, key:",
            "fields: [{field: extra, key: Extra}, {field: state, key:",
        );
    let cube_states = format!(
        "format: nkdk-declarations/1\nkind: value\nid: common.cube-states\nvalue:\n  kind: enum\n  variants:\n{}representations:\n  xml:\n    kind: text\n    values:\n{}  yaml:\n    kind: scalar\n    values:\n{}",
        (0..8)
            .map(|index| format!("  - {{name: S{index}, value: s{index}}}\n"))
            .collect::<String>(),
        (0..8)
            .map(|index| format!("    - {{value: s{index}, text: S{index}}}\n"))
            .collect::<String>(),
        (0..8)
            .map(|index| format!("    - {{value: s{index}, literal: s{index}}}\n"))
            .collect::<String>(),
    );
    let cube = r#"format: nkdk-declarations/1
kind: object
id: test.cube
imports: {state: common.cube-states}
value:
  kind: record
  fields:
  - {name: mode, type: {use: state}}
  - {name: first, type: {kind: scalar, scalar: text}}
  - {name: second, type: {kind: scalar, scalar: text}}
  - {name: third, type: {kind: scalar, scalar: text}}
representations:
  xml: {kind: record, fields: [{field: first, path: [Root, A]}, {field: second, path: [Root, B]}, {field: third, path: [Root, C]}]}
  yaml: {kind: mapping, fields: [{field: mode, key: State}]}
state-relations:
- field: mode
  sources:
    first: {equals: {literal: on}}
    second: {equals: {literal: on}}
    third: {equals: {literal: on}}
  states:
    s0: []
    s1: [first]
    s2: [second]
    s3: [first, second]
    s4: [third]
    s5: [first, third]
    s6: [second, third]
    s7: [first, second, third]
"#;
    let state_owner = include_str!("fixtures/finite-state-owner.yaml");
    let absent_state = include_str!("fixtures/finite-states.yaml")
        .lines()
        .filter(|line| {
            !["value: empty", "value: tagged", "value: text"]
                .iter()
                .any(|value| line.contains(value))
        })
        .collect::<Vec<_>>()
        .join("\n")
        .replace("common.finite-states", "common.absent-state");
    let absent_owner = state_owner
        .replace("common.finite-states", "common.absent-state")
        .replace("test.finite-states", "test.absent-state");
    let state_row = state_owner
        .replace("kind: object", "kind: value")
        .replace("test.finite-states", "test.state-row")
        .replace(
            "[{name: mode",
            "[{name: name, type: {kind: scalar, scalar: text}}, {name: mode",
        )
        .replace(
            "[{field: mode, path: [Root, Mode]}",
            "[{field: name, path: [Name]}, {field: mode, path: [Mode]}",
        )
        .replace(
            "[{field: mode, key:",
            "[{field: name, key: Name}, {field: mode, key:",
        );
    let state_rows = "format: nkdk-declarations/1\nkind: value\nid: test.state-rows\nimports: {row: test.state-row}\nvalue: {kind: sequence, item: {use: row}}\nrepresentations:\n  xml: {kind: element-sequence, path: [Item]}\n  yaml: {kind: record-mapping, key: name}\n";
    let state_collection = state_owner
        .replace("test.finite-states", "test.state-collection")
        .replace("common.finite-states", "test.state-rows")
        .split("presence:")
        .next()
        .unwrap()
        .to_owned();
    let identity_source = include_str!("fixtures/fact-identity-source.yaml");
    let inherited_identity = identity_source.replace("id: test.identity-source", "id: test.inherited-identity\nimports: {restore: common.restored-text}")
        .replace("{name: token, type: {kind: scalar, scalar: text}}", "{name: token, type: {use: restore, bind: {saved: {input: saved}, name: {field: name}}}}")
        .replace(&format!("presence:{}", identity_source.split("presence:").nth(1).unwrap().split("contributions:").next().unwrap()), "");
    let identity_row = inherited_identity
        .split("contributions:").next().unwrap()
        .replace("kind: object", "kind: value")
        .replace("test.inherited-identity", "test.identity-row")
        .replace("{index: test.identities}", "{type: {kind: index, key: {kind: scalar, scalar: text}, value: {kind: scalar, scalar: text}}}")
        .replace("[Root, Name]", "[Name]")
        .replace("[Root]", "[]");
    let identity_rows = r#"format: nkdk-declarations/1
kind: value
id: test.identity-rows
imports: {row: test.identity-row}
inputs: {saved: {type: {kind: index, key: {kind: scalar, scalar: text}, value: {kind: scalar, scalar: text}}}}
value: {kind: sequence, item: {use: row, bind: {saved: {input: saved}}}}
representations:
  xml: {kind: element-sequence, path: [Item]}
  yaml: {kind: record-mapping, key: name}
"#;
    let identity_owner = r#"format: nkdk-declarations/1
kind: object
id: test.identity-owner
imports: {rows: test.identity-rows}
inputs: {saved: {index: test.identities}}
value: {kind: record, fields: [{name: rows, type: {use: rows, bind: {saved: {input: saved}}}}]}
representations:
  xml: {kind: record, fields: [{field: rows, path: [Root, Rows]}]}
  yaml: {kind: mapping, fields: [{field: rows, key: Rows}]}
contributions:
- index: test.identities
  forEach: {in: {field: rows}, as: row}
  key: {get: {of: {var: row}, field: name}}
  value: {get: {of: {var: row}, field: token}}
"#;
    let declared_nested = include_str!("fixtures/declared-row.yaml")
        .replace("common.row", "common.nested-row")
        .replace(
            "namespaces:",
            "imports: {codes: common.project-rows}\nnamespaces:",
        )
        .replace(
            "{name: name,",
            "{name: codes, type: {use: codes}}, {name: name,",
        )
        .replace(
            "{field: name, path:",
            "{field: codes, path: [Codes]}, {field: name, path:",
        )
        .replace(
            "{field: name, key:",
            "{field: codes, key: Codes}, {field: name, key:",
        );
    let declared_nested=declared_nested
        .replace("{name: name,", "{name: token, type: {kind: scalar, scalar: text}}, {name: name,")
        .replace("{field: name, path:", "{field: token, path: [], attribute: token}, {field: name, path:")
        .replace("{field: name, key:", "{field: token, key: Token}, {field: name, key:")
        .replace("presence:\n", "presence:\n- target: {field: token}\n  xml: {missing: {denotes: {absent: true}}}\n  yaml: {default: {field: name}}\n");
    let declared_nested_list = include_str!("fixtures/declared-rows.yaml")
        .replace("common.rows", "common.nested-rows")
        .replace("common.row}", "common.nested-row}");
    let declared_nested_owner = "format: nkdk-declarations/1\nkind: object\nid: test.nested-items\nimports: {rows: common.nested-rows}\nvalue: {kind: record, fields: [{name: rows, type: {use: rows}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: rows, path: [Root, Rows]}]}\n  yaml: {kind: mapping, fields: [{field: rows, key: Rows}]}\n";
    let declared_deep = declared_nested
        .replace("common.nested-row", "common.deep-row")
        .replace("common.project-rows", "common.rows");
    let declared_deep_list = declared_nested_list.replace("common.nested-row", "common.deep-row");
    let declared_deep_owner = declared_nested_owner
        .replace("common.nested-rows", "common.deep-rows")
        .replace("test.nested-items", "test.deep-items");
    let projected_owner = declared_deep_owner
        .replace("test.deep-items", "test.projected-items")
        .replace(
            "yaml: {kind: mapping, fields: [{field: rows, key: Rows}]}",
            "yaml: {kind: projection, field: rows}",
        );
    let parameterized_row = include_str!("fixtures/declared-row.yaml")
        .replace("{literal: reserved}", "{parameter: forbidden}")
        .replace("yaml: {missing: {denotes: {literal: normal}}}", "yaml: {default: {field: name}}")
        .replace("{name: name,", "{name: id, type: {kind: scalar, scalar: text}}, {name: name,")
        .replace("{field: name, path:", "{field: id, path: [], attribute: uuid}, {field: name, path:")
        .replace("{field: name, key:", "{field: id, key: Id}, {field: name, key:")
        .replace("presence:\n", "presence:\n- target: {field: id}\n  xml: {missing: {denotes: {absent: true}}}\n  yaml: {missing: {denotes: {absent: true}}}\n")
        + "parameters:\n  forbidden: {type: {kind: scalar, scalar: text}, default: other}\n";
    let parameterized_rows = include_str!("fixtures/declared-rows.yaml")
        .replace("{use: row}", "{use: row, with: {forbidden: reserved}}");
    let common = include_str!("fixtures/common.yaml");
    let owner = "format: nkdk-declarations/1\nkind: object\nid: test.scalar-owner\nimports: {boolean: common.boolean}\nvalue:\n  kind: record\n  fields:\n    - name: server\n      type: {use: boolean}\n    - name: description\n      type: {kind: scalar, scalar: text}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - {field: server, path: [Root, Server]}\n      - {field: description, path: [Root, Description]}\n  yaml:\n    kind: mapping\n    fields:\n      - {field: server, key: Сервер}\n      - {field: description, key: Описание}\n";
    let assembled = owner
        .replace("test.scalar-owner", "test.assembled-owner")
        .replace(
            "{boolean: common.boolean}",
            "{boolean: common.boolean, rows: common.project-rows}",
        )
        .replace(
            "    - name: description",
            "    - {name: rows, type: {use: rows}}\n    - name: description",
        )
        .replace(
            "      - {field: description, path:",
            "      - {field: rows, path: [Root, Rows]}\n      - {field: description, path:",
        )
        .replace(
            "      - {field: description, key:",
            "      - {field: rows, key: Rows}\n      - {field: description, key:",
        );
    let typed_attributes = assembled
        .replace("test.assembled-owner", "test.typed-attributes")
        .replace(
            "{field: server, path: [Root, Server]}",
            "{field: server, path: [Root], attribute: enabled}",
        );
    let nested_stream = typed_attributes
        .replace("test.typed-attributes", "test.nested-stream")
        .replace("common.project-rows", "common.nested-scalars");
    let default_attributes = typed_attributes
        .replace("test.typed-attributes", "test.default-attributes")
        + "presence:\n- target: {field: server}\n  xml: {missing: {denotes: {literal: false}}}\n  yaml: {missing: {denotes: {literal: false}}, omitWhen: {eq: [{field: server}, {literal: false}]}}\n";
    let numeric_attributes=typed_attributes.replace("test.typed-attributes","test.numeric-attributes")
        .replace("imports:","namespaces: {meta: urn:attributes}\nimports:")
        .replace("{boolean: common.boolean,", "{number: common.exact-decimal, boolean: common.boolean,")
        .replace("    - name: description", "    - {name: amount, type: {use: number}}\n    - name: description")
        .replace("      - {field: description, path:", "      - {field: amount, path: [Root], attribute: meta:amount}\n      - {field: description, path:")
        .replace("      - {field: description, key:", "      - {field: amount, key: Amount}\n      - {field: description, key:");
    let assembled = assembled
        .replace("rows: common.project-rows}", "rows: common.project-rows, settings: common.nested-scalars, qualified: common.qualified}")
        .replace("    - name: description", "    - {name: settings, type: {use: settings}}\n    - {name: qualified, type: {use: qualified}}\n    - name: description")
        .replace("      - {field: description, path:", "      - {field: settings, path: [Root, Settings]}\n      - {field: qualified, path: [Root, Type]}\n      - {field: description, path:")
        .replace("      - {field: description, key:", "      - {field: settings, key: Settings}\n      - {field: qualified, key: Qualified}\n      - {field: description, key:");
    let assembled = assembled
        .replace("    - name: server", "    - {name: version, type: {kind: scalar, scalar: text}}\n    - {name: identity, type: {kind: scalar, scalar: text}}\n    - name: server")
        .replace("      - {field: server, path:", "      - {field: version, path: [Root], attribute: version}\n      - {field: identity, path: [Root], attribute: uuid}\n      - {field: server, path:")
        .replace("      - {field: server, key:", "      - {field: version, key: Version}\n      - {field: identity, key: UUID}\n      - {field: server, key:");
    let assembled = assembled
        + "\npresence:\n- target: {field: server}\n  xml: {missing: {denotes: {literal: false}}}\n  yaml:\n    missing: {denotes: {literal: false}}\n    omitWhen: {eq: [{field: server}, {literal: false}]}\nconstraints:\n- id: description-allowed\n  appliesTo: [xml-import, yaml-validation]\n  assert: {not: {eq: [{field: description}, {literal: reserved}]}}\n  diagnostic: {code: owner.description-reserved, severity: error, at: {field: description}, message: Reserved description}\n";
    let assembled = assembled
        + "contributions:\n- index: test.owner-identities\n  key: {field: description}\n  value: {field: identity}\n- index: test.owner-rows\n  forEach: {in: {field: rows}, as: row}\n  key: {get: {of: {var: row}, field: code}}\n  value: {get: {of: {var: row}, field: title}}\n";
    let (assembled_head, assembled_xml) = assembled.split_once("  xml:\n").unwrap();
    let (assembled_xml, assembled_tail) = assembled_xml.split_once("  yaml:").unwrap();
    let assembled = format!(
        "{assembled_head}  xml:\n    kind: with-attributes\n    attributes: [{{name: format, value: {{text: normal}}}}]\n    content:\n{}  yaml:{assembled_tail}",
        assembled_xml
            .lines()
            .map(|line| format!("  {line}\n"))
            .collect::<String>()
    );
    let indexed_assembly=assembled.replace("test.assembled-owner","test.indexed-assembly")
        .replace("value:\n", "inputs:\n  identity: {type: {kind: scalar, scalar: text}}\nvalue:\n")
        .replace("presence:\n", "presence:\n- target: {field: identity}\n  xml: {missing: {denotes: {absent: true}}}\n  yaml:\n    missing: {denotes: {input: identity}}\n    omitWhen: {eq: [{field: identity}, {input: identity}]}\n");
    let attributed_rows=include_str!("fixtures/fact-rows.yaml")
        .replace("common.project-rows","common.attributed-rows")
        .replace("value:\n", "namespaces: {row: urn:row}\nvalue:\n")
        .replace("    - {name: title, type: {kind: scalar, scalar: text}}", "    - {name: title, type: {kind: scalar, scalar: text}}\n    - {name: identity, type: {kind: scalar, scalar: text}}")
        .replace("{field: code, path: [Code]}","{field: code, path: [], attribute: code}")
        .replace("{field: title, path: [Title]}","{field: title, path: [], attribute: row:title}\n      - {field: identity, path: [Identity]}")
        .replace("{field: title, key: Title}","{field: title, key: Title}\n      - {field: identity, key: Identity}");
    let attributed_rows_owner = include_str!("fixtures/fact-rows-owner.yaml")
        .replace("test.fact-rows", "test.attributed-rows")
        .replace("common.project-rows", "common.attributed-rows");
    let attributed_rows_owner = attributed_rows_owner
        .replace("value: {kind: record", "types:\n  short-name:\n    kind: text-transform\n    units: utf16\n    classes: {separator: [[46, 46]]}\n    state: {finished: false}\n    transitions:\n    - when: {class: separator}\n      emit: discard\n      set: {finished: true}\n    - when: {flag: finished}\n      emit: discard\n      set: {}\n    - emit: append\n      set: {}\n    result:\n      separator: ''\n      first: {kind: identity}\n      rest: {kind: identity}\n      lowercase: []\n      emptyInput: absent\n      noTokens: absent\nvalue: {kind: record")
        + "\n- index: test.short-names\n  forEach: {in: {field: rows}, as: row}\n  key:\n    match:\n      value: {transform: {local: short-name, value: {get: {of: {var: row}, field: code}}}}\n      present: {as: name, then: {var: name}}\n      absent: {literal: empty}\n  value: {get: {of: {var: row}, field: identity}}\n";
    let attributed_rows_fragment = attributed_rows_owner
        .replace("kind: object", "kind: fragment")
        .replace(
            "id: test.attributed-rows",
            "id: common.attributed-row-facts",
        );
    let fact_prefix = "format: nkdk-declarations/1\nkind: fragment\nid: common.fact-prefix\nvalue: {kind: record, fields: [{name: marker, type: {kind: scalar, scalar: text}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: marker, path: [Root], attribute: marker}]}\n  yaml: {kind: mapping, fields: [{field: marker, key: Marker}]}\npresence:\n- target: {field: marker}\n  xml: {missing: {denotes: {absent: true}}}\n  yaml: {missing: {denotes: {absent: true}}}\n";
    let attributed_rows_owner = "format: nkdk-declarations/1\nkind: object\nid: test.attributed-rows\nimports: {prefix: common.fact-prefix, body: common.attributed-row-facts}\ncompose: [{use: prefix}, {use: body}]\nvalue: {kind: record, fields: []}\nrepresentations:\n  xml: {kind: record, fields: []}\n  yaml: {kind: mapping, fields: []}\ncontributions:\n- index: test.static-owner\n  key: {literal: static}\n  value: {if: {present: {field: marker}}, then: {concat: [{literal: prefix-}, {field: marker}]}, else: {literal: retained}}\n";
    let attribute_owner = owner.replace("test.scalar-owner", "test.attribute-owner")
        .replace("imports:", "namespaces: {meta: urn:owner}\nimports:")
        .replace("    - name: server", "    - {name: version, type: {kind: scalar, scalar: text}}\n    - {name: identity, type: {kind: scalar, scalar: text}}\n    - name: server")
        .replace("[Root, Server]", "[Root, Item, Server]")
        .replace("[Root, Description]", "[Root, Item, Description]")
        .replace("      - {field: server, path:", "      - {field: version, path: [Root], attribute: version}\n      - {field: identity, path: [Root, Item], attribute: meta:uuid}\n      - {field: server, path:")
        .replace("      - {field: server, key:", "      - {field: version, key: Version}\n      - {field: identity, key: UUID}\n      - {field: server, key:");
    let attribute_owner = attribute_owner
        .replace("    - name: server", "    - {name: revision, type: {kind: scalar, scalar: text}}\n    - name: server")
        .replace("      - {field: server, path:", "      - {field: revision, path: [Root, Item], attribute: revision}\n      - {field: server, path:")
        .replace("      - {field: server, key:", "      - {field: revision, key: Revision}\n      - {field: server, key:");
    let attribute_only = attribute_owner
        .replace("test.attribute-owner", "test.attribute-only")
        .replace("    - name: server\n      type: {use: boolean}\n", "")
        .replace(
            "    - name: description\n      type: {kind: scalar, scalar: text}\n",
            "",
        )
        .replace("      - {field: server, path: [Root, Item, Server]}\n", "")
        .replace(
            "      - {field: description, path: [Root, Item, Description]}\n",
            "",
        )
        .replace("      - {field: server, key: Сервер}\n", "")
        .replace("      - {field: description, key: Описание}\n", "");
    let nested_common = owner
        .replace("kind: object", "kind: value")
        .replace("test.scalar-owner", "common.nested-scalars")
        .replace("[Root, ", "[")
        + "\npresence:\n- target: self\n  xml: {missing: {denotes: {absent: true}}}\n  yaml: {missing: {denotes: {absent: true}}}\n";
    let nested_owner = include_str!("fixtures/qname-owner.yaml")
        .replace("test.qualified", "test.nested-scalars")
        .replace("common.qualified", "common.nested-scalars")
        .replace("Type", "Settings")
        .replace("Qualified", "Settings");
    let nested_defaults = nested_common.replace("common.nested-scalars", "common.nested-defaults")
        + "- target: {field: server}\n  xml: {missing: {denotes: {literal: false}}}\n  yaml:\n    missing: {denotes: {literal: false}}\n    omitWhen: {eq: [{field: server}, {literal: false}]}\n";
    let nested_defaults = nested_defaults
        + "constraints:\n- id: description-value\n  appliesTo: [xml-import, yaml-validation]\n  assert: {eq: [{field: description}, {literal: body}]}\n  diagnostic:\n    code: test.description-value\n    severity: error\n    at: {field: description}\n    message: Expected body\n";
    let nested_defaults_owner = nested_owner.replace("nested-scalars", "nested-defaults");
    let nested_notices = nested_defaults
        .replace("common.nested-defaults", "common.nested-notices")
        .replace(
            "assert: {eq: [{field: description}, {literal: body}]}",
            "assert: {literal: false}",
        )
        .replace("severity: error", "severity: warning");
    let nested_notices_owner = nested_owner.replace("nested-scalars", "nested-notices");
    let header_common = nested_common
        .replace("common.nested-scalars", "common.nested-header")
        .replace("path: [Description]", "path: [], attribute: uuid");
    let (header_start, header_xml) = header_common.split_once("  xml:\n").unwrap();
    let (header_xml, header_yaml) = header_xml.split_once("  yaml:").unwrap();
    let header_common = format!(
        "{header_start}  xml:\n    kind: with-attributes\n    attributes: [{{name: mode, value: {{text: normal}}}}]\n    content:\n{}  yaml:{header_yaml}",
        header_xml
            .lines()
            .map(|line| format!("  {line}\n"))
            .collect::<String>()
    );
    let header_owner = nested_owner.replace("nested-scalars", "nested-header");
    let numeric_bound =
        include_str!("../../../../tests/declaration-corpus/valid/numeric-bound.yaml");
    let warning_bound = numeric_bound
        .replace("id: test.numeric-bound", "id: test.warning-bound")
        .replace("severity: error", "severity: warning");
    let decimal = include_str!("../../../../tests/declaration-corpus/valid/exact-decimal.yaml");
    let decimal_owner = "format: nkdk-declarations/1\nkind: object\nid: test.decimal-owner\nimports: {number: common.exact-decimal}\nvalue:\n  kind: record\n  fields:\n    - {name: amount, type: {use: number}}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - {field: amount, path: [Root, Amount]}\n  yaml:\n    kind: mapping\n    fields:\n      - {field: amount, key: Сумма}\n";
    let typed_decimal = decimal.replace("common.exact-decimal", "common.typed-decimal").replace("representations:", "namespaces:\n  xsi: http://www.w3.org/2001/XMLSchema-instance\n  xs: http://www.w3.org/2001/XMLSchema\nrepresentations:").replace("xml: {kind: text}", "xml:\n    kind: with-attributes\n    attributes:\n      - {name: xsi:type, value: {qname: xs:decimal}}\n    content: {kind: text}");
    let typed_owner = decimal_owner
        .replace("test.decimal-owner", "test.typed-owner")
        .replace("common.exact-decimal", "common.typed-decimal");
    let root_scalar_owner = typed_owner
        .replace("test.typed-owner", "test.root-scalar")
        .replace("[Root, Amount]", "[Root]");
    let enum_attributes = owner
        .replace("test.scalar-owner", "test.enum-attributes")
        .replace("{boolean: common.boolean}", "{boolean: common.code-type}")
        .replace("path: [Root, Server]", "path: [Root], attribute: code")
        .replace("key: Сервер", "key: ТипКода");
    let default_number_owner = decimal_owner.replace("test.decimal-owner", "test.default-number")
        + "\npresence:\n  - target: {field: amount}\n    xml: {missing: {denotes: {literal: 0}}}\n    yaml:\n      missing: {denotes: {literal: 0}}\n      omitWhen: {eq: [{field: amount}, {literal: 0}]}\n";
    let calendar = "format: nkdk-declarations/1\nkind: value\nid: common.date-time\nvalue: {kind: scalar, scalar: text}\nrepresentations:\n  xml: {kind: calendar, format: iso, zone: written}\n  yaml: {kind: calendar, format: day-month-year, precision: minutes, zeroTime: omit}\n";
    let calendar_owner = decimal_owner
        .replace("test.decimal-owner", "test.calendar-owner")
        .replace("common.exact-decimal", "common.date-time");
    let name_common = "format: nkdk-declarations/1\nkind: value\nid: common.metadata-name\nvalue: {kind: scalar, scalar: text}\nrepresentations:\n  xml: {kind: text}\n  yaml: {kind: scalar, scalar: text}\nconstraints:\n  - id: name\n    appliesTo: [xml-import, yaml-validation]\n    assert: {matches: {value: {self: true}, pattern: '[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*'}}\n    diagnostic: {code: metadata-name.invalid, severity: error, at: {self: true}, message: Invalid name}\n";
    let short_name_common = name_common.split("constraints:").next().unwrap().replacen(
        "scalar: text}",
        "scalar: text, pattern: '[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*'}",
        1,
    );
    let name_owner = decimal_owner
        .replace("test.decimal-owner", "test.name-owner")
        .replace("common.exact-decimal", "common.metadata-name");
    let enumeration =
        include_str!("../../../../tests/declaration-corpus/valid/code-type-enum.yaml");
    let enum_owner = "format: nkdk-declarations/1\nkind: object\nid: test.enum-owner\nimports: {code: common.code-type}\nvalue:\n  kind: record\n  fields:\n    - {name: codeType, type: {use: code}}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - {field: codeType, path: [Root, CodeType]}\n  yaml:\n    kind: mapping\n    fields:\n      - {field: codeType, key: ТипКода}\n";
    let root = std::env::temp_dir().join(format!(
        "nkdk-generated-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir_all(root.join("src")).unwrap();
    let core = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("conversion-core");
    fs::write(root.join("Cargo.toml"), format!("[package]\nname = \"generated-contract\"\nversion = \"0.0.0\"\nedition = \"2024\"\n[dependencies]\nnkdk-conversion-core = {{ path = {:?}, features = [\"test-probes\"] }}\n[workspace]\n", core)).unwrap();
    for literal in ["Истина", "Да"] {
        let common = common.replace("Истина", literal);
        let optional = common.replace("common.boolean", "common.optional-boolean")
            + "\npresence:\n  - target: self\n    xml: {missing: {denotes: {absent: true}}}\n    yaml: {missing: {denotes: {absent: true}}}\n";
        let defaulted = common
            .replace("common.boolean", "common.default-boolean")
            .replace("      - {value: false, literal: Ложь}\n", "")
            + "\npresence:\n  - target: self\n    xml: {missing: {denotes: {literal: false}}}\n    yaml:\n      missing: {denotes: {literal: false}}\n      omitWhen: {not: {self: true}}\n";
        let default_owner = owner
            .replace("test.scalar-owner", "test.default-owner")
            .replace("common.boolean", "common.default-boolean");
        let implicit_owner = owner.replace("test.scalar-owner", "test.implicit-owner")
            + "\npresence:\n- target: {field: server}\n  xml:\n    missing: {denotes: {literal: false}}\n    canonical: [{when: {not: {field: server}}, form: missing}]\n  yaml: {default: {literal: true}}\n";
        let optional_owner = owner
            .replace("test.scalar-owner", "test.optional-owner")
            .replace("common.boolean", "common.optional-boolean");
        let required_owner = optional_owner.replace("test.optional-owner", "test.required-owner")
            + "\npresence:\n- target: {field: server}\n";
        let chain_row = include_str!("fixtures/text-pattern-coded.yaml")
            .replace("common.coded-pair", "common.chain-pair")
            .replace("{literal: '['}, ", "")
            .replace("{literal: '] '}", "{literal: '/'}");
        let chain = include_str!("fixtures/text-sequence.yaml")
            .replace("common.text-pair", "common.chain-pair");
        let chain_owner = include_str!("fixtures/text-pattern-owner.yaml")
            .replace("test.text-pattern", "test.text-sequence")
            .replace("common.text-pair", "common.text-sequence");
        let framed = chain_row
            .replace("common.chain-pair", "common.framed-pair")
            .replace("imports: {", "imports: {tail: common.text-sequence, ")
            .replace(
                "representations:",
                "  - {name: tail, type: {use: tail}}\nrepresentations:",
            )
            .replace(
                "{field: name}]}",
                "{field: name}, {literal: '::'}, {field: tail}]}",
            )
            .replace(
                "{field: domain}]}",
                "{field: domain}, {literal: '/'}, {field: tail}]}",
            );
        let framed_owner = chain_owner
            .replace("test.text-sequence", "test.framed-sequence")
            .replace("common.text-sequence", "common.framed-pair");
        let indexed_frame = framed_owner.replace("test.framed-sequence", "test.indexed-frame")
            + "\ninputs:\n  roots: {index: test.path-roots}\nconstraints:\n- id: known-root\n  appliesTo: [xml-import, yaml-validation]\n  assert: {present: {lookup: {in: {input: roots}, key: {record: {kind: {get: {of: {field: pair}, field: domain}}, name: {get: {of: {field: pair}, field: name}}}}}}}\n  diagnostic: {code: path.root-missing, severity: error, at: {field: pair}, message: Root is missing}\n";
        let bound_variant = include_str!("fixtures/text-choice-first.yaml")
            .replace("common.choice-first", "common.bound-first")
            .replace(
                "value:\n",
                "inputs: {allowed: {type: {kind: scalar, scalar: text}}}\nvalue:\n",
            )
            .replace(
                "assert: {matches: {value: {field: name}, pattern: '[a-z]+'}}",
                "assert: {eq: [{field: name}, {input: allowed}]}",
            );
        let bound_choice = include_str!("fixtures/text-choice.yaml")
            .replace("common.text-choice", "common.bound-choice")
            .replace("common.choice-first", "common.bound-first")
            .replace(
                "value:\n",
                "inputs: {allowed: {type: {kind: scalar, scalar: text}}}\nvalue:\n",
            )
            .replace(
                "{use: first}",
                "{use: first, bind: {allowed: {input: allowed}}}",
            );
        let bound_choice = bound_choice
            .replace("inputs: {allowed: {type: {kind: scalar, scalar: text}}}", "inputs: {allowed: {type: {kind: scalar, scalar: text}}, enabled: {type: {kind: scalar, scalar: boolean}}}")
            .replace("xml: {kind: choice}", "xml: {kind: with-attributes, attributes: [{name: marked, value: {text: yes}, when: {and: [{present: {self: true}}, {input: enabled}]}}], content: {kind: choice}}")
            + "\npresence:\n- target: self\n  xml: {missing: {denotes: {absent: true}}}\n  yaml: {missing: {denotes: {absent: true}}}\n";
        let bound_choice_owner = include_str!("fixtures/text-choice-owner.yaml")
            .replace("test.text-choice", "test.bound-choice")
            .replace("common.text-choice", "common.bound-choice")
            .replace("value:", "inputs: {unused: {type: {kind: scalar, scalar: boolean}}, selected: {type: {kind: scalar, scalar: text}}}\nvalue:")
            .replace("{use: pair}", "{use: pair, bind: {allowed: {input: selected}, enabled: {input: unused}}}");
        let borrowed_nested = include_str!("fixtures/borrowed-record-rows.yaml")
            .replace("test.borrowed-record-rows", "test.borrowed-nested-rows")
            .replace("common.rows", "common.nested-rows");
        let constructed_rows = include_str!("fixtures/declared-rows.yaml")
            .replace("common.rows", "common.constructed-rows")
            + "\npresence:\n- target: self\n  yaml:\n    missing:\n      denotes:\n        sequence:\n        - record: {id: {literal: token}, name: {literal: Second}, mode: {literal: Notify}}\n";
        let constructed_owner = declared_nested_owner
            .replace("test.nested-items", "test.constructed-rows")
            .replace("common.nested-rows", "common.constructed-rows");
        let hidden_rows_owner = constructed_owner
            .replace("test.constructed-rows", "test.hidden-rows")
            .replace("fields: [{field: rows, key: Rows}]", "fields: []")
            + "\npresence:\n- target: {field: rows}\n  yaml:\n    missing:\n      denotes:\n        sequence:\n        - record: {id: {literal: token}, name: {literal: Second}, mode: {literal: Notify}}\n";
        let hidden_selected_owner = include_str!("fixtures/selected-record-row.yaml")
            .replace("test.selected-record-row", "test.hidden-selected-row")
            .replace(", {field: rows, key: Rows}", "")
            + "\n- target: {field: rows}\n  yaml:\n    missing:\n      denotes:\n        sequence:\n        - record: {id: {literal: token}, name: {literal: Second}, mode: {field: found}}\n";
        let typed_constructed_row = r#"format: nkdk-declarations/1
kind: value
id: common.typed-constructed-row
imports: {boolean: common.boolean, state: common.finite-states}
value: {kind: record, fields: [{name: state, type: {use: state}}, {name: label, type: {kind: scalar, scalar: text}}, {name: enabled, type: {use: boolean}}, {name: amount, type: {kind: scalar, scalar: number, profile: decimal}}]}
representations:
  xml: {kind: record, fields: [{field: state, path: [State]}, {field: label, path: [Label]}, {field: enabled, path: [Enabled]}, {field: amount, path: [Amount]}]}
  yaml: {kind: mapping, fields: [{field: state, key: State}, {field: label, key: Label}, {field: enabled, key: Enabled}, {field: amount, key: Amount}]}
"#;
        let typed_constructed_rows = r#"format: nkdk-declarations/1
kind: value
id: common.typed-constructed-rows
imports: {row: common.typed-constructed-row}
inputs: {emit: {type: {kind: scalar, scalar: boolean}}}
value: {kind: sequence, item: {use: row}}
representations:
  xml: {kind: element-sequence, path: [Item]}
  yaml: {kind: sequence}
presence:
- target: self
  yaml:
    missing:
      denotes:
        if: {input: emit}
        then: {sequence: [{record: {state: {literal: tagged}, label: {concat: [{literal: pre}, {literal: fix}]}, enabled: {input: emit}, amount: {literal: 9007199254740993}}}]}
        else: {absent: true}
"#;
        let typed_constructed_owner = constructed_owner
            .replace("test.constructed-rows", "test.typed-constructed-rows")
            .replace("common.constructed-rows", "common.typed-constructed-rows")
            .replace(
                "value:",
                "inputs: {emit: {type: {kind: scalar, scalar: boolean}}}\nvalue:",
            )
            .replace("{use: rows}", "{use: rows, bind: {emit: {input: emit}}}");
        let single_rows = include_str!("fixtures/borrowed-record-rows.yaml")
            .replace("test.borrowed-record-rows", "test.single-record-row")
            .replace("exists:", "one:");
        let typed_selected_rows = include_str!("fixtures/declared-rows.yaml")
            .replace("common.rows", "common.typed-selected-rows")
            .replace("common.row}", "common.typed-constructed-row}");
        let typed_selected_owner = include_str!("fixtures/selected-record-row.yaml")
            .replace("test.selected-record-row", "test.typed-selected-row")
            .replace("common.rows", "common.typed-selected-rows")
            .replace("field: name", "field: label")
            .replace("literal: Second", "literal: prefix")
            .replace("present: {as: selected, then: {get: {of: {var: selected}, field: mode}}}",
                "present: {as: selected, then: {if: {and: [{get: {of: {var: selected}, field: enabled}}, {eq: [{get: {of: {var: selected}, field: amount}}, {literal: 9007199254740993}]}, {eq: [{get: {of: {var: selected}, field: state}}, {literal: tagged}]}]}, then: {get: {of: {var: selected}, field: label}}, else: {literal: invalid}}}");
        let mut modules = [
            ("typed-selected-rows.yaml",typed_selected_rows.as_str()),
            ("typed-selected-owner.yaml",typed_selected_owner.as_str()),
            ("hidden-rows-owner.yaml", hidden_rows_owner.as_str()),
            ("hidden-selected-owner.yaml", hidden_selected_owner.as_str()),
            ("selected-record-row.yaml", include_str!("fixtures/selected-record-row.yaml")),
            ("single-record-row.yaml", single_rows.as_str()),
            ("typed-constructed-row.yaml", typed_constructed_row),
            ("typed-constructed-rows.yaml", typed_constructed_rows),
            ("typed-constructed-owner.yaml", typed_constructed_owner.as_str()),
            ("constructed-rows.yaml", constructed_rows.as_str()),
            ("constructed-rows-owner.yaml", constructed_owner.as_str()),
            ("directional-fields.yaml", directional),
            ("borrowed-nested-rows.yaml", borrowed_nested.as_str()),
            ("borrowed-record-rows.yaml", include_str!("fixtures/borrowed-record-rows.yaml")),
            ("directional-bound-common.yaml", include_str!("fixtures/directional-bound-common.yaml")),
            ("directional-bound-reverse.yaml", include_str!("fixtures/directional-bound-reverse.yaml")),
            ("directional-bound-owner.yaml", include_str!("fixtures/directional-bound-owner.yaml")),
            ("cube-states.yaml", cube_states.as_str()),
            ("cube.yaml", cube),
            ("state-projections-composed.yaml", projections_composed.as_str()),
            ("state-projections.yaml", include_str!("fixtures/state-projections.yaml")),
            ("computed-fields.yaml", computed_checked.as_str()),
            ("computed-row.yaml", computed_row.as_str()),
            ("computed-rows.yaml", computed_rows),
            ("computed-collection.yaml", computed_collection),
            ("computed-composed.yaml", computed_composed.as_str()),
            ("computed-nested.yaml", computed_nested.as_str()),
            ("computed-owner.yaml", computed_owner),
            ("directional-extra.yaml", directional_extra),
            ("directional-composed.yaml", directional_composed.as_str()),
            ("absent-state.yaml", absent_state.as_str()),
            ("absent-state-owner.yaml", absent_owner.as_str()),
            ("finite-state-row.yaml", state_row.as_str()),
            ("finite-state-rows.yaml", state_rows),
            ("finite-state-collection.yaml", state_collection.as_str()),
            ("finite-states.yaml", include_str!("fixtures/finite-states.yaml")),
            ("finite-states-owner.yaml", state_owner),
            ("bound-choice.yaml", bound_choice.as_str()),
            ("bound-first.yaml", bound_variant.as_str()),
            ("bound-choice-owner.yaml", bound_choice_owner.as_str()),
            (
                "fact-path-edge.yaml",
                include_str!("fixtures/fact-path-edge.yaml"),
            ),
            (
                "fact-path-consumer.yaml",
                include_str!("fixtures/fact-path-consumer.yaml"),
            ),
            (
                "fact-path-owner.yaml",
                include_str!("fixtures/fact-path-owner.yaml"),
            ),
            ("indexed-frame.yaml", indexed_frame.as_str()),
            ("framed.yaml", framed.as_str()),
            ("framed-owner.yaml", framed_owner.as_str()),
            ("text-sequence-row.yaml", chain_row.as_str()),
            ("text-sequence.yaml", chain.as_str()),
            ("text-sequence-owner.yaml", chain_owner.as_str()),
            ("common.yaml", common.as_str()),
            (
                "text-delimiter.yaml",
                include_str!("fixtures/text-delimiter.yaml"),
            ),
            (
                "text-delimiter-first.yaml",
                include_str!("fixtures/text-delimiter-first.yaml"),
            ),
            (
                "text-delimiter-second.yaml",
                include_str!("fixtures/text-delimiter-second.yaml"),
            ),
            (
                "text-delimiter-owner.yaml",
                include_str!("fixtures/text-delimiter-owner.yaml"),
            ),
            (
                "text-choice.yaml",
                include_str!("fixtures/text-choice.yaml"),
            ),
            (
                "text-choice-first.yaml",
                include_str!("fixtures/text-choice-first.yaml"),
            ),
            (
                "text-choice-second.yaml",
                include_str!("fixtures/text-choice-second.yaml"),
            ),
            (
                "text-choice-owner.yaml",
                include_str!("fixtures/text-choice-owner.yaml"),
            ),
            (
                "fact-bound-consumer.yaml",
                include_str!("fixtures/fact-bound-consumer.yaml"),
            ),
            (
                "fact-target.yaml",
                include_str!("fixtures/fact-target.yaml"),
            ),
            (
                "text-table-owner.yaml",
                include_str!("fixtures/text-table-owner.yaml"),
            ),
            (
                "text-pattern-name.yaml",
                include_str!("fixtures/text-pattern-name.yaml"),
            ),
            (
                "text-pattern-kind.yaml",
                include_str!("fixtures/text-pattern-kind.yaml"),
            ),
            (
                "text-pattern-coded.yaml",
                include_str!("fixtures/text-pattern-coded.yaml"),
            ),
            (
                "text-pattern-coded-owner.yaml",
                include_str!("fixtures/text-pattern-coded-owner.yaml"),
            ),
            (
                "text-pattern.yaml",
                include_str!("fixtures/text-pattern.yaml"),
            ),
            (
                "text-pattern-owner.yaml",
                include_str!("fixtures/text-pattern-owner.yaml"),
            ),
            ("fact-code.yaml", include_str!("fixtures/fact-code.yaml")),
            (
                "fact-consumer.yaml",
                include_str!("fixtures/fact-consumer.yaml"),
            ),
            (
                "fact-member-consumer.yaml",
                include_str!("fixtures/fact-member-consumer.yaml"),
            ),
            ("fact-owner.yaml", include_str!("fixtures/fact-owner.yaml")),
            ("fact-inherited-identity.yaml", inherited_identity.as_str()),
            ("fact-restored-text.yaml", include_str!("fixtures/fact-restored-text.yaml")),
            ("fact-identity-owner.yaml", identity_owner),
            ("fact-identity-row.yaml", identity_row.as_str()),
            ("fact-identity-rows.yaml", identity_rows),
            ("fact-identity-source.yaml", include_str!("fixtures/fact-identity-source.yaml")),
            (
                "fact-rows-owner.yaml",
                include_str!("fixtures/fact-rows-owner.yaml"),
            ),
            ("fact-rows.yaml", include_str!("fixtures/fact-rows.yaml")),
            (
                "name.yaml",
                if literal == "Истина" {
                    name_common
                } else {
                    short_name_common.as_str()
                },
            ),
            ("name-owner.yaml", name_owner.as_str()),
            ("additional-indexes-owner.yaml",include_str!("../../../declarations/probes/additional-indexes-owner.yaml")),
            ("additional-indexes-fragment.yaml",include_str!("../../../declarations/fragments/additional-indexes.yaml")),
            ("additional-index-row.yaml",include_str!("../../../declarations/common/additional-index-row.yaml")),
            ("additional-indexes.yaml",include_str!("../../../declarations/common/additional-indexes.yaml")),
            ("additional-indexes-probe.yaml",include_str!("../../../declarations/probes/additional-indexes.yaml")),
            ("index-field-common.yaml",include_str!("../../../declarations/common/index-field.yaml")),
            ("declared-projected.yaml",projected_owner.as_str()),
            ("declared-deep-row.yaml", declared_deep.as_str()),
            ("declared-deep-rows.yaml", declared_deep_list.as_str()),
            ("declared-deep-owner.yaml", declared_deep_owner.as_str()),
            ("declared-nested-row.yaml", declared_nested.as_str()),
            ("declared-nested-rows.yaml", declared_nested_list.as_str()),
            ("declared-nested-owner.yaml", declared_nested_owner),
            ("declared-row.yaml", parameterized_row.as_str()),
            ("declared-rows.yaml", parameterized_rows.as_str()),
            ("declared-owner.yaml", "format: nkdk-declarations/1\nkind: object\nid: test.declared-rows\nimports: {rows: common.rows}\nvalue: {kind: record, fields: [{name: rows, type: {use: rows}}]}\nrepresentations:\n  xml: {kind: record, fields: [{field: rows, path: [Root, Rows]}]}\n  yaml: {kind: mapping, fields: [{field: rows, key: Rows}]}\n"),
            ("nested-common.yaml", nested_common.as_str()),
            ("nested-defaults.yaml", nested_defaults.as_str()),
            ("nested-defaults-owner.yaml", nested_defaults_owner.as_str()),
            ("nested-notices.yaml", nested_notices.as_str()),
            ("nested-notices-owner.yaml", nested_notices_owner.as_str()),
            ("nested-owner.yaml", nested_owner.as_str()),
            ("nested-stream.yaml", nested_stream.as_str()),
            ("header-common.yaml", header_common.as_str()),
            ("header-owner.yaml", header_owner.as_str()),
            ("assembled-owner.yaml", assembled.as_str()),
            ("attributed-rows.yaml", attributed_rows.as_str()),
            ("attributed-rows-owner.yaml", attributed_rows_owner),
            (
                "attributed-rows-fragment.yaml",
                attributed_rows_fragment.as_str(),
            ),
            ("fact-prefix.yaml", fact_prefix),
            ("indexed-assembly.yaml", indexed_assembly.as_str()),
            ("attribute-owner.yaml", attribute_owner.as_str()),
            ("typed-attributes.yaml", typed_attributes.as_str()),
            ("default-attributes.yaml", default_attributes.as_str()),
            ("numeric-attributes.yaml", numeric_attributes.as_str()),
            ("attribute-only.yaml", attribute_only.as_str()),
            ("calendar.yaml", calendar),
            ("calendar-owner.yaml", calendar_owner.as_str()),
            ("optional.yaml", optional.as_str()),
            ("default.yaml", defaulted.as_str()),
            ("default-owner.yaml", default_owner.as_str()),
            ("implicit-owner.yaml", implicit_owner.as_str()),
            ("optional-owner.yaml", optional_owner.as_str()),
            ("required-owner.yaml", required_owner.as_str()),
            ("owner.yaml", owner),
            (
                "qname-common.yaml",
                include_str!("fixtures/qname-common.yaml"),
            ),
            (
                "qname-owner.yaml",
                include_str!("fixtures/qname-owner.yaml"),
            ),
            ("enum.yaml", enumeration),
            ("enum-owner.yaml", enum_owner),
            ("enum-attributes.yaml", enum_attributes.as_str()),
            ("decimal.yaml", decimal),
            ("default-number.yaml", default_number_owner.as_str()),
            ("typed-decimal.yaml", typed_decimal.as_str()),
            ("typed-owner.yaml", typed_owner.as_str()),
            ("root-scalar.yaml", root_scalar_owner.as_str()),
            ("decimal-owner.yaml", decimal_owner),
            ("numeric-bound.yaml", numeric_bound),
            ("warning-bound.yaml", warning_bound.as_str()),
        ]
        .map(|(path, source)| {
            parse(SourceFile {
                path,
                bytes: source.as_bytes(),
            })
            .unwrap()
        });
        let program = link(&modules).unwrap();
        let state_schema: serde_json::Value =
            serde_json::from_slice(&schema(&program, "test.finite-states").unwrap()).unwrap();
        let state_validator = jsonschema::validator_for(&state_schema).unwrap();
        let absent_schema: serde_json::Value =
            serde_json::from_slice(&schema(&program, "test.absent-state").unwrap()).unwrap();
        assert_eq!(absent_schema["properties"]["Mode"], false);
        let checked = format!(
            "{state_owner}constraints:\n- id: ready\n  appliesTo: [yaml-validation]\n  assert: {{present: {{field: mode}}}}\n  diagnostic: {{code: state.ready, severity: error, at: {{field: mode}}, message: Expected state}}\n"
        );
        let mut checked_modules = modules.clone();
        checked_modules
            .iter_mut()
            .find(|module| module.id == "test.finite-states")
            .unwrap()
            .constraints = parse(SourceFile {
            path: "state-constraint.yaml",
            bytes: checked.as_bytes(),
        })
        .unwrap()
        .constraints;
        let checked_schema: serde_json::Value = serde_json::from_slice(
            &schema(&link(&checked_modules).unwrap(), "test.finite-states").unwrap(),
        )
        .unwrap();
        assert!(
            jsonschema::validator_for(&checked_schema)
                .unwrap()
                .is_valid(&serde_json::json!({})),
            "{checked_schema}"
        );

        for valid in [
            serde_json::json!({}),
            serde_json::json!({"Mode":null}),
            serde_json::json!({"Mode":""}),
        ] {
            assert!(state_validator.is_valid(&valid), "{state_schema}");
        }
        assert!(!state_validator.is_valid(&serde_json::json!({"Mode":true})));

        let choice_schema: serde_json::Value =
            serde_json::from_slice(&schema(&program, "test.text-choice").unwrap()).unwrap();
        assert!(
            jsonschema::validator_for(&choice_schema)
                .unwrap()
                .is_valid(&serde_json::json!({"Pair":"Первое: leaf"}))
        );
        let required_shape: serde_json::Value =
            serde_json::from_slice(&schema(&program, "test.required-owner").unwrap()).unwrap();
        assert!(
            required_shape["required"]
                .as_array()
                .unwrap()
                .contains(&serde_json::json!("Сервер"))
        );
        let nested_shape: serde_json::Value =
            serde_json::from_slice(&schema(&program, "test.deep-items").unwrap()).unwrap();
        let validator = jsonschema::validator_for(&nested_shape).unwrap();
        assert!(
            validator.is_valid(
                &serde_json::json!({"Rows":[{"Codes":[{"Name":"child"}],"Name":"parent"}]})
            )
        );
        assert!(!validator.is_valid(
            &serde_json::json!({"Rows":[{"Codes":[{"Mode":"normal"}],"Name":"parent"}]})
        ));
        let additional_shape: serde_json::Value =
            serde_json::from_slice(&schema(&program, "migration.additional-indexes").unwrap())
                .unwrap();
        let additional_validator = jsonschema::validator_for(&additional_shape).unwrap();
        assert!(
            additional_validator
                .is_valid(&serde_json::json!([{"Имя":"One","ИндексируемыеПоля":["Ref"]}]))
        );
        assert!(!additional_validator.is_valid(&serde_json::json!([{"Таблица":"Document.D"}])));
        let generated = generate(&program).expect("generate supported record");
        let shape: serde_json::Value =
            serde_json::from_slice(&schema(&program, "test.text-pattern-coded").unwrap()).unwrap();
        assert_eq!(shape["properties"]["Pair"]["type"], "string");
        assert_eq!(
            shape["properties"]["Pair"]["x-nkdk-runtime-validation"],
            true
        );
        let table_shape: serde_json::Value =
            serde_json::from_slice(&schema(&program, "test.text-table").unwrap()).unwrap();
        assert!(
            jsonschema::validator_for(&table_shape)
                .unwrap()
                .is_valid(&serde_json::json!({"Pair":"Восток"}))
        );
        modules.reverse();
        assert_eq!(generated, generate(&link(&modules).unwrap()).unwrap());
        assert_eq!(
            generated.dependencies,
            [
                "absent-state-owner.yaml",
                "absent-state.yaml",
                "additional-index-row.yaml",
                "additional-indexes-fragment.yaml",
                "additional-indexes-owner.yaml",
                "additional-indexes-probe.yaml",
                "additional-indexes.yaml",
                "assembled-owner.yaml",
                "attribute-only.yaml",
                "attribute-owner.yaml",
                "attributed-rows-fragment.yaml",
                "attributed-rows-owner.yaml",
                "attributed-rows.yaml",
                "borrowed-nested-rows.yaml",
                "borrowed-record-rows.yaml",
                "bound-choice-owner.yaml",
                "bound-choice.yaml",
                "bound-first.yaml",
                "calendar-owner.yaml",
                "calendar.yaml",
                "common.yaml",
                "computed-collection.yaml",
                "computed-composed.yaml",
                "computed-fields.yaml",
                "computed-nested.yaml",
                "computed-owner.yaml",
                "computed-row.yaml",
                "computed-rows.yaml",
                "constructed-rows-owner.yaml",
                "constructed-rows.yaml",
                "cube-states.yaml",
                "cube.yaml",
                "decimal-owner.yaml",
                "decimal.yaml",
                "declared-deep-owner.yaml",
                "declared-deep-row.yaml",
                "declared-deep-rows.yaml",
                "declared-nested-owner.yaml",
                "declared-nested-row.yaml",
                "declared-nested-rows.yaml",
                "declared-owner.yaml",
                "declared-projected.yaml",
                "declared-row.yaml",
                "declared-rows.yaml",
                "default-attributes.yaml",
                "default-number.yaml",
                "default-owner.yaml",
                "default.yaml",
                "directional-bound-common.yaml",
                "directional-bound-owner.yaml",
                "directional-bound-reverse.yaml",
                "directional-composed.yaml",
                "directional-extra.yaml",
                "directional-fields.yaml",
                "enum-attributes.yaml",
                "enum-owner.yaml",
                "enum.yaml",
                "fact-bound-consumer.yaml",
                "fact-code.yaml",
                "fact-consumer.yaml",
                "fact-identity-owner.yaml",
                "fact-identity-row.yaml",
                "fact-identity-rows.yaml",
                "fact-identity-source.yaml",
                "fact-inherited-identity.yaml",
                "fact-member-consumer.yaml",
                "fact-owner.yaml",
                "fact-path-consumer.yaml",
                "fact-path-edge.yaml",
                "fact-path-owner.yaml",
                "fact-prefix.yaml",
                "fact-restored-text.yaml",
                "fact-rows-owner.yaml",
                "fact-rows.yaml",
                "fact-target.yaml",
                "finite-state-collection.yaml",
                "finite-state-row.yaml",
                "finite-state-rows.yaml",
                "finite-states-owner.yaml",
                "finite-states.yaml",
                "framed-owner.yaml",
                "framed.yaml",
                "header-common.yaml",
                "header-owner.yaml",
                "hidden-rows-owner.yaml",
                "hidden-selected-owner.yaml",
                "implicit-owner.yaml",
                "index-field-common.yaml",
                "indexed-assembly.yaml",
                "indexed-frame.yaml",
                "name-owner.yaml",
                "name.yaml",
                "nested-common.yaml",
                "nested-defaults-owner.yaml",
                "nested-defaults.yaml",
                "nested-notices-owner.yaml",
                "nested-notices.yaml",
                "nested-owner.yaml",
                "nested-stream.yaml",
                "numeric-attributes.yaml",
                "numeric-bound.yaml",
                "optional-owner.yaml",
                "optional.yaml",
                "owner.yaml",
                "qname-common.yaml",
                "qname-owner.yaml",
                "required-owner.yaml",
                "root-scalar.yaml",
                "selected-record-row.yaml",
                "single-record-row.yaml",
                "state-projections-composed.yaml",
                "state-projections.yaml",
                "text-choice-first.yaml",
                "text-choice-owner.yaml",
                "text-choice-second.yaml",
                "text-choice.yaml",
                "text-delimiter-first.yaml",
                "text-delimiter-owner.yaml",
                "text-delimiter-second.yaml",
                "text-delimiter.yaml",
                "text-pattern-coded-owner.yaml",
                "text-pattern-coded.yaml",
                "text-pattern-kind.yaml",
                "text-pattern-name.yaml",
                "text-pattern-owner.yaml",
                "text-pattern.yaml",
                "text-sequence-owner.yaml",
                "text-sequence-row.yaml",
                "text-sequence.yaml",
                "text-table-owner.yaml",
                "typed-attributes.yaml",
                "typed-constructed-owner.yaml",
                "typed-constructed-row.yaml",
                "typed-constructed-rows.yaml",
                "typed-decimal.yaml",
                "typed-owner.yaml",
                "typed-selected-owner.yaml",
                "typed-selected-rows.yaml",
                "warning-bound.yaml"
            ]
        );
        for file in generated.files {
            fs::write(root.join("src").join(file.path), file.contents).unwrap();
        }
        let main = r###"
include!("generated.rs");
fn main() {

    for (name, extra_xml, extra_yaml) in [
        ("test.directional-fields", "", ""),
        ("test.directional-bindings", "", ""),
        ("test.directional-composed", "<Extra><Marker>fixed</Marker></Extra>", "\nExtra:\n  Marker: fixed"),
    ] {
        let entry = entry_id(name).unwrap();
        let xml = format!("<Root><Right>x</Right>{extra_xml}</Root>");
        let imported = convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
        verify_candidate(entry,xml.as_bytes(),&imported.bytes,&PreparedInputs::default()).unwrap();
        let meaning = core::raw::Property::decode_in(&imported.bytes,None,"Left","Left").unwrap().map_or(imported.bytes.clone(),|value|value.meaning);
        let fields = core::yaml::split_properties(&meaning,&[&["Left","Right"],&["Extra"]]).unwrap();
        let mut decoded = std::collections::BTreeMap::new();
        core::yaml::visit(&fields[0],|key,value|{decoded.insert(key,value);Ok(())}).unwrap();
        assert_eq!(decoded, std::collections::BTreeMap::from([("Left".to_owned(),"x".to_owned()),("Right".to_owned(),"x".to_owned())]),"{name}");
        let yaml = format!("Left: x{extra_yaml}");
        let exported = convert_file(entry,Direction::YamlToXml,yaml.as_bytes(),&PreparedInputs::default()).unwrap();
        let exported = String::from_utf8(exported.bytes).unwrap();
        assert!(exported.contains("<Left>x</Left>") && exported.contains("<Right>x</Right>"),"{name}: {exported}");
    }
    let computed = entry_id("test.computed-fields").unwrap();
    let imported = convert_file(computed,Direction::XmlToYaml,b"<Root><Right>x</Right></Root>",&PreparedInputs::default()).unwrap();
    assert_eq!(String::from_utf8(imported.bytes).unwrap(), "Left: x\nRight: x");
    let exported = convert_file(computed,Direction::YamlToXml,b"Left: x",&PreparedInputs::default()).unwrap();
    let xml = String::from_utf8(exported.bytes).unwrap();
    assert!(xml.contains("<Right>x</Right>") && !xml.contains("<Left>"), "{xml}");
    let invalid_xml = b"<Root><Right>bad</Right></Root>";
    let invalid = convert_file(computed,Direction::XmlToYaml,invalid_xml,&PreparedInputs::default()).unwrap();
    assert!(String::from_utf8_lossy(&invalid.bytes).contains("Left: !xml/invalid bad"), "{}", String::from_utf8_lossy(&invalid.bytes));
    assert!(!String::from_utf8_lossy(&invalid.bytes).contains("$xml"));
    verify_candidate(computed,invalid_xml,&invalid.bytes,&PreparedInputs::default()).unwrap();
    let computed_rows = entry_id("test.computed-collection").unwrap();
    let original = b"<Root><Rows><Item><Right>x</Right></Item><Item><Right>y</Right></Item></Rows></Root>";
    let imported = convert_file(computed_rows,Direction::XmlToYaml,original,&PreparedInputs::default()).unwrap();
    assert_eq!(String::from_utf8(imported.bytes.clone()).unwrap(), "Rows:\n  x:\n    Left: x\n  y:\n    Left: y");
    verify_candidate(computed_rows,original,&imported.bytes,&PreparedInputs::default()).unwrap();
    let exported = convert_file(computed_rows,Direction::YamlToXml,b"Rows:\n  x:\n    Left: x\n  y:\n    Left: y",&PreparedInputs::default()).unwrap();
    let xml = String::from_utf8(exported.bytes).unwrap();
    assert!(xml.contains("<Right>x</Right>") && xml.contains("<Right>y</Right>") && !xml.contains("<Left>"), "{xml}");
    let composed = entry_id("test.computed-composed").unwrap();
    let original = b"<Root><Right>x</Right><Extra><Marker>fixed</Marker></Extra></Root>";
    let imported = convert_file(composed,Direction::XmlToYaml,original,&PreparedInputs::default()).unwrap();
    assert_eq!(String::from_utf8(imported.bytes.clone()).unwrap(), "Left: x\nRight: x\nExtra:\n  Marker: fixed");
    verify_candidate(composed,original,&imported.bytes,&PreparedInputs::default()).unwrap();
    let exported = convert_file(composed,Direction::YamlToXml,b"Left: x\nExtra:\n  Marker: fixed",&PreparedInputs::default()).unwrap();
    let xml = String::from_utf8(exported.bytes).unwrap();
    assert!(xml.contains("<Right>x</Right>") && !xml.contains("<Left>"), "{xml}");
    let invalid = b"<Root><Right>bad</Right><Extra><Marker>fixed</Marker></Extra></Root>";
    let imported = convert_file(composed,Direction::XmlToYaml,invalid,&PreparedInputs::default()).unwrap();
    assert!(String::from_utf8_lossy(&imported.bytes).contains("Left: !xml/invalid bad"));
    assert!(!String::from_utf8_lossy(&imported.bytes).contains("$xml"));
    verify_candidate(composed,invalid,&imported.bytes,&PreparedInputs::default()).unwrap();
    let computed_owner = entry_id("test.computed-owner").unwrap();
    let original = b"<Root><Row><Right>x</Right></Row><Extra><Marker>fixed</Marker></Extra></Root>";
    let imported = convert_file(computed_owner,Direction::XmlToYaml,original,&PreparedInputs::default()).unwrap();
    assert_eq!(String::from_utf8(imported.bytes.clone()).unwrap(), "Row:\n  Left: x\n  Right: x\nExtra:\n  Marker: fixed");
    verify_candidate(computed_owner,original,&imported.bytes,&PreparedInputs::default()).unwrap();
    let exported = convert_file(computed_owner,Direction::YamlToXml,b"Row:\n  Left: x\nExtra:\n  Marker: fixed",&PreparedInputs::default()).unwrap();
    let xml = String::from_utf8(exported.bytes).unwrap();
    assert!(xml.contains("<Right>x</Right>") && xml.contains("<Marker>fixed</Marker>") && !xml.contains("<Left>"), "{xml}");
    let borrowed = entry_id("test.borrowed-record-rows").unwrap();
    for (rows, expected) in [
        ("", "missing"),
        ("<Item><r:Name>First</r:Name><r:Mode>one</r:Mode></Item>", "missing"),
        ("<Item><r:Name>First</r:Name><r:Mode>one</r:Mode></Item><Item><r:Name>Second</r:Name><r:Mode>two</r:Mode></Item>", "found"),
        ("<Item><r:Name>Second</r:Name><r:Mode>one</r:Mode></Item><Item><r:Name>Second</r:Name><r:Mode>two</r:Mode></Item>", "found"),
        ("<Item><r:Mode>one</r:Mode></Item><Item><r:Name>Second</r:Name><r:Mode>two</r:Mode></Item>", "found"),
    ] {
        let original = format!(r#"<Root xmlns:r="urn:row"><Rows>{rows}</Rows></Root>"#);
        let imported = convert_file(borrowed, Direction::XmlToYaml, original.as_bytes(), &PreparedInputs::default()).unwrap();
        let yaml = String::from_utf8_lossy(&imported.bytes);
        assert!(yaml.starts_with(&format!("Found: {expected}\n")), "{yaml}");
        verify_candidate(borrowed, original.as_bytes(), &imported.bytes, &PreparedInputs::default()).unwrap();
    }
    let typed_selected = entry_id("test.typed-selected-row").unwrap();
    let original = b"<Root><Rows><Item><State>Tagged</State><Label>prefix</Label><Enabled>true</Enabled><Amount>9007199254740993</Amount></Item></Rows></Root>";
    let result = convert_file(typed_selected,Direction::XmlToYaml,original,&PreparedInputs::default()).unwrap();
    assert!(String::from_utf8_lossy(&result.bytes).starts_with("Found: prefix\n"));
    verify_candidate(typed_selected,original,&result.bytes,&PreparedInputs::default()).unwrap();
    let selected = entry_id("test.selected-record-row").unwrap();
    for (rows, expected) in [
        ("", "missing"),
        ("<Item><r:Name>First</r:Name><r:Mode>other</r:Mode></Item><Item><r:Name>Second</r:Name><r:Mode>Notify</r:Mode></Item>", "Notify"),
        ("<Item><r:Name>Second</r:Name><r:Mode>Notify</r:Mode></Item><Item><r:Name>Second</r:Name><r:Mode>Extended</r:Mode></Item>", "missing"),
    ] {
        let xml = format!("<Root xmlns:r='urn:row'><Rows>{rows}</Rows></Root>");
        let result = convert_file(selected,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).starts_with(&format!("Found: {expected}\n")));
        verify_candidate(selected,xml.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
    }
    let single = entry_id("test.single-record-row").unwrap();
    for (rows, expected) in [
        ("", "missing"),
        ("<Item><r:Name>First</r:Name></Item>", "missing"),
        ("<Item><r:Name>First</r:Name></Item><Item><r:Name>Second</r:Name></Item>", "found"),
        ("<Item><r:Name>Second</r:Name></Item><Item><r:Name>Second</r:Name></Item>", "missing"),
        ("<Item><r:Mode>one</r:Mode></Item><Item><r:Name>Second</r:Name></Item>", "found"),
    ] {
        let xml = format!("<Root xmlns:r='urn:row'><Rows>{rows}</Rows></Root>");
        let result = convert_file(single,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).starts_with(&format!("Found: {expected}\n")));
        verify_candidate(single,xml.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
    }
    let borrowed_nested = entry_id("test.borrowed-nested-rows").unwrap();
    let xml = b"<Root xmlns:r='urn:row'><Rows><Item token='Second'><Codes><Item><Code>a</Code><Title>A</Title></Item></Codes><r:Name>Second</r:Name><r:Mode>normal</r:Mode></Item></Rows></Root>";
    let result = convert_file(borrowed_nested, Direction::XmlToYaml, xml, &PreparedInputs::default()).unwrap();
    assert_eq!(String::from_utf8_lossy(&result.bytes), "Found: found\nRows:\n  -\n    Codes:\n      - Code: a\n        Title: A\n    Name: Second\n    Mode: normal");
    verify_candidate(borrowed_nested, xml, &result.bytes, &PreparedInputs::default()).unwrap();
    let hidden = entry_id("test.hidden-rows").unwrap();
    let original = b"<Root xmlns:r='urn:row'><Rows><Item uuid='token'><r:Name>Second</r:Name><r:Mode>Notify</r:Mode></Item></Rows></Root>";
    let imported = convert_file(hidden, Direction::XmlToYaml, original, &PreparedInputs::default()).unwrap();
    assert!(imported.bytes.is_empty() || imported.bytes == b"{}");
    verify_candidate(hidden,original,&imported.bytes,&PreparedInputs::default()).unwrap();
    let unusual = b"<Root xmlns:r='urn:row'><Rows><Item uuid='token' extra='keep'><r:Name>Second</r:Name><r:Mode>Notify</r:Mode></Item></Rows></Root>";
    let preserved = convert_file(hidden,Direction::XmlToYaml,unusual,&PreparedInputs::default()).unwrap();
    verify_candidate(hidden,unusual,&preserved.bytes,&PreparedInputs::default()).unwrap();
    let hidden_selected = entry_id("test.hidden-selected-row").unwrap();
    for mode in ["Notify", "Extended"] {
        let xml = format!("<Root xmlns:r='urn:row'><Rows><Item uuid='token'><r:Name>Second</r:Name><r:Mode>{mode}</r:Mode></Item></Rows></Root>");
        let result = convert_file(hidden_selected,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
        assert_eq!(result.bytes,format!("Found: {mode}").as_bytes());
        verify_candidate(hidden_selected,xml.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
    }
    let constructed = entry_id("test.constructed-rows").unwrap();
    let exported = convert_file(constructed, Direction::YamlToXml, b"{}", &PreparedInputs::default()).unwrap();
    core::proof::verify(b"<Root xmlns:r='urn:row'><Rows><Item uuid='token'><r:Name>Second</r:Name><r:Mode>Notify</r:Mode></Item></Rows></Root>", &exported.bytes, |_| false).unwrap();
    let typed_constructed = entry_id("test.typed-constructed-rows").unwrap();
    for (enabled, yaml, expected) in [
        (true, "{}", "<Root><Rows><Item><State>Tagged</State><Label>prefix</Label><Enabled>true</Enabled><Amount>9007199254740993</Amount></Item></Rows></Root>"),
        (false, "{}", "<Root/>"),
        (true, "Rows: []", "<Root><Rows/></Root>"),
    ] {
        let inputs = prepare_inputs(typed_constructed, vec![("emit".into(),InputValue::Boolean(enabled))]).unwrap();
        let result = convert_file(typed_constructed,Direction::YamlToXml,yaml.as_bytes(),&inputs).unwrap();
        core::proof::verify(expected.as_bytes(),&result.bytes,|_|false).unwrap();
    }
    let cube = entry_id("test.cube").unwrap();
    for mask in 0..8 {
        let mut xml = String::from("<Root>");
        for (bit, tag) in [(1, "A"), (2, "B"), (4, "C")] {
            if mask & bit != 0 { xml.push_str(&format!("<{tag}>on</{tag}>")); }
        }
        xml.push_str("</Root>");
        let yaml = format!("State: s{mask}");
        let imported = convert_file(cube, Direction::XmlToYaml, xml.as_bytes(), &PreparedInputs::default()).unwrap();
        assert_eq!(String::from_utf8(imported.bytes).unwrap(), yaml);
        let exported = convert_file(cube, Direction::YamlToXml, yaml.as_bytes(), &PreparedInputs::default()).unwrap();
        let exported = String::from_utf8(exported.bytes).unwrap();
        for (bit, tag) in [(1, "A"), (2, "B"), (4, "C")] {
            assert_eq!(exported.contains(&format!("<{tag}>on</{tag}>")), mask & bit != 0, "{exported}");
        }
    }
    for (entry_name, extra_xml, extra_yaml) in [
        ("test.state-projections", "", ""),
        ("test.state-projections-composed", "<Extra><Marker>fixed</Marker></Extra>", "Extra:\n  Marker: fixed"),
    ] {
    let projection = entry_id(entry_name).unwrap();
    let inputs = prepare_inputs(projection, vec![("baseId".into(), InputValue::Text("base-id".into()))]).unwrap();
    for (base, notice, yaml) in [
        (true, false, ""), (false, false, "State: "),
        (true, true, "State: !watch"), (false, true, "State: !watch \"\""),
    ] {
        let original = format!("<Root>{}{}{extra_xml}</Root>", if base {"<Base>base-id</Base>"} else {""}, if notice {"<Notice>Notify</Notice>"} else {""});
        let yaml = [yaml, extra_yaml].into_iter().filter(|part| !part.is_empty()).collect::<Vec<_>>().join("\n");
        let imported = convert_file(projection,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
        assert_eq!(String::from_utf8(imported.bytes.clone()).unwrap(),yaml);
        verify_candidate(projection,original.as_bytes(),&imported.bytes,&inputs).unwrap();
        let exported = convert_file(projection,Direction::YamlToXml,yaml.as_bytes(),&inputs).unwrap();
        let xml = String::from_utf8(exported.bytes).unwrap();
        assert_eq!(xml.contains("<Base>base-id</Base>"),base,"{xml}");
        assert_eq!(xml.contains("<Notice>Notify</Notice>"),notice,"{xml}");
        assert!(!xml.contains("<State>"));
    }
    let original = format!("<Root><Notice>Unrecognized</Notice>{extra_xml}</Root>");
    let imported = convert_file(projection,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
    let yaml = String::from_utf8_lossy(&imported.bytes);
    assert!(yaml.contains("Unrecognized") && yaml.contains("$xml"), "{yaml}");
    verify_candidate(projection,original.as_bytes(),&imported.bytes,&inputs).unwrap();
    }
    let collection = entry_id("test.state-collection").unwrap();
    let collection_xml = "<Root><Mode><Item><Name>One</Name><Mode>Default</Mode></Item><Item><Name>Two</Name><Mode>Empty</Mode></Item><Item><Name>Three</Name><Mode>Tagged</Mode></Item><Item><Name>Four</Name><Mode>Text</Mode></Item></Mode></Root>";
    let collection_yaml = "Mode:\n  One: {}\n  Two:\n    Mode: \n  Three:\n    Mode: !watch\n  Four:\n    Mode: !watch \"\"";
    let imported = convert_file(collection,Direction::XmlToYaml,collection_xml.as_bytes(),&PreparedInputs::default()).unwrap();
    assert_eq!(String::from_utf8(imported.bytes).unwrap(), collection_yaml.replace("One: {}", "One:\n    {}"));
    let exported = convert_file(collection,Direction::YamlToXml,collection_yaml.as_bytes(),&PreparedInputs::default()).unwrap();
    let exported = String::from_utf8(exported.bytes).unwrap();
    for (name,mode) in [("One","Default"),("Two","Empty"),("Three","Tagged"),("Four","Text")] {
        assert!(exported.contains(&format!("<Name>{name}</Name>")) && exported.contains(&format!("<Mode>{mode}</Mode>")));
    }
    let absent_entry = entry_id("test.absent-state").unwrap();
    assert!(convert_file(absent_entry,Direction::XmlToYaml,b"<Root><Mode>Default</Mode></Root>",&PreparedInputs::default()).unwrap().bytes.is_empty());
    assert!(convert_file(absent_entry,Direction::YamlToXml,b"{}",&PreparedInputs::default()).is_ok());
    let state_entry = entry_id("test.finite-states").unwrap();
    let unknown = b"<Root><Mode>Unlisted</Mode></Root>";
    let preserved = convert_file(state_entry,Direction::XmlToYaml,unknown,&PreparedInputs::default()).unwrap();
    assert!(String::from_utf8_lossy(&preserved.bytes).contains("!xml/raw"));
    verify_candidate(state_entry,unknown,&preserved.bytes,&PreparedInputs::default()).unwrap();

    for (xml_value, yaml) in [("Default", ""), ("Empty", "Mode: "), ("Tagged", "Mode: !watch"), ("Text", "Mode: !watch \"\"")] {
        let xml = format!("<Root><Mode>{xml_value}</Mode></Root>");
        let imported = convert_file(state_entry,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
        assert_eq!(String::from_utf8(imported.bytes).unwrap().trim_end(),yaml.trim_end());
        let exported = convert_file(state_entry,Direction::YamlToXml,yaml.as_bytes(),&PreparedInputs::default()).unwrap();
        assert!(String::from_utf8(exported.bytes).unwrap().contains(&format!("<Mode>{xml_value}</Mode>")));
    }
    {
        let inputs=PreparedInputs::default();
        let xml=b"<Root enabled='true'><Description>kept</Description></Root>";
        let yaml="Сервер: LITERAL\nОписание: kept";
        for (yaml, expected) in [
            ("Сервер: LITERAL\nОписание: outer", "<Root enabled='true'><Description>outer</Description></Root>"),
            ("Сервер: LITERAL\nRows: {Сервер: LITERAL, Описание: inner}\nОписание: outer", "<Root enabled='true'><Rows><Server>true</Server><Description>inner</Description></Rows><Description>outer</Description></Root>"),
        ] {
            let mut nested=OwnerYamlReadNESTED_STREAM_ID::new().unwrap();
            core::yaml::visit_nodes(yaml.as_bytes(),|node,position|nested.consume(node,position,b"",&inputs.view())).unwrap();
            let nested=nested.finish(b"",&inputs.view()).unwrap();
            core::proof::verify(expected.as_bytes(),&write_xml_NESTED_STREAM_ID(&nested,&inputs.view()).unwrap(),|_|false).unwrap();
        }
        let mut nested=OwnerYamlReadNESTED_STREAM_ID::new().unwrap();
        core::yaml::visit_nodes("Сервер: LITERAL\nRows: {}\nОписание: outer".as_bytes(),|node,position|nested.consume(node,position,b"",&inputs.view())).unwrap();
        let error=match nested.finish(b"",&inputs.view()){Err(error)=>error,Ok(_)=>panic!("Empty record lost required fields")};
        assert_eq!(error.code.as_deref(),Some("value.missing"));
        {
            {
                let entry=entry_id("test.nested-items").unwrap();let inputs=prepare_inputs(entry,vec![]).unwrap();
                let xml=b"<Root xmlns:r='urn:row'><Rows><Item token='first'><Codes><Item><Code>a</Code><Title>A</Title></Item><Item><Code>b</Code><Title>B</Title></Item></Codes><r:Name>first</r:Name><r:Mode>normal</r:Mode></Item><Item token='second'><Codes/><r:Name>second</r:Name><r:Mode>other</r:Mode></Item></Rows></Root>";
                let yaml=b"Rows:\n  -\n    Codes:\n      - Code: a\n        Title: A\n      - Code: b\n        Title: B\n    Name: first\n    Mode: normal\n  -\n    Codes: []\n    Name: second\n    Mode: other";
                let result=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();assert_eq!(result.bytes,yaml);
                let result=convert_file(entry,Direction::YamlToXml,yaml,&inputs).unwrap();core::proof::verify(xml,&result.bytes,|_|false).unwrap();
            }
            {
                let entry=entry_id("test.deep-items").unwrap();let inputs=prepare_inputs(entry,vec![]).unwrap();
                let xml=b"<Root xmlns:r='urn:row'><Rows><Item token='parent'><Codes><Item><r:Name>child</r:Name><r:Mode>normal</r:Mode></Item></Codes><r:Name>parent</r:Name><r:Mode>normal</r:Mode></Item></Rows></Root>";
                let yaml=b"Rows:\n  -\n    Codes:\n      -\n        Name: child\n        Mode: normal\n    Name: parent\n    Mode: normal";
                let result=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();assert_eq!(result.bytes,yaml);
                let projected=entry_id("test.projected-items").unwrap();let projected_inputs=prepare_inputs(projected,vec![]).unwrap();
                let expected=String::from_utf8_lossy(yaml).lines().skip(1).map(|line|line.strip_prefix("  ").unwrap()).collect::<Vec<_>>().join("\n");
                let result=convert_file(projected,Direction::XmlToYaml,xml,&projected_inputs).unwrap();assert_eq!(result.bytes,expected.as_bytes());
                let result=convert_file(projected,Direction::YamlToXml,&result.bytes,&projected_inputs).unwrap();core::proof::verify(xml,&result.bytes,|_|false).unwrap();
                let mut visits=0;
                let value=read_yaml_events_DEEP_ID(b"",&inputs.view(),core::yaml::Events(|consume:&mut core::yaml::Consumer<'_>|{visits+=1;core::yaml::visit_nodes(yaml,|node,at|consume(node,at))})).unwrap();
                assert_eq!(visits,1);
                let prepared=prepare_xml_DEEP_ID(&value,&inputs.view()).unwrap();let mut names=Vec::new();namespaces_xml_DEEP_ID(&value,&prepared,&mut names);
                let before=core::xml::writer_count();let mut writer=core::xml::Writer::new(&names);
                write_xml_into_DEEP_ID(&value,&prepared,&inputs.view(),&mut writer).unwrap();let restored=writer.finish();
                assert_eq!(core::xml::writer_count(),before+1);core::proof::verify(xml,&restored,|_|false).unwrap();
                for source in [String::from_utf8_lossy(xml).replace("<r:Mode>normal</r:Mode>","<r:Mode extra='x'>other</r:Mode>"),String::from_utf8_lossy(xml).replace("<r:Name>child</r:Name>","<r:Name>reserved</r:Name>")] {
                    let yaml=convert_file(entry,Direction::XmlToYaml,source.as_bytes(),&inputs).unwrap();
                    let result=convert_file(entry,Direction::YamlToXml,&yaml.bytes,&inputs).unwrap();core::proof::verify(source.as_bytes(),&result.bytes,|_|false).unwrap();
                }
            }
            let entry=entry_id("test.declared-rows").unwrap();
            let inputs=prepare_inputs(entry,vec![]).unwrap();
            let xml=b"<Root xmlns:r='urn:row'><Rows><Item><r:Name>first</r:Name><r:Mode>normal</r:Mode></Item><Item><r:Name>second</r:Name><r:Mode>other</r:Mode></Item></Rows></Root>";
            let yaml=b"Rows:\n  -\n    Name: first\n    Mode: normal\n  -\n    Name: second\n    Mode: other";
            let result=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
            assert_eq!(result.bytes,yaml);
            let result=convert_file(entry,Direction::YamlToXml,yaml,&inputs).unwrap();
            core::proof::verify(xml,&result.bytes,|_|false).unwrap();
            let derived=convert_file(entry,Direction::YamlToXml,b"Rows: [{Name: derived}]",&inputs).unwrap();
            core::proof::verify(b"<Root xmlns:r='urn:row'><Rows><Item><r:Name>derived</r:Name><r:Mode>derived</r:Mode></Item></Rows></Root>",&derived.bytes,|_|false).unwrap();
            let identified=String::from_utf8_lossy(xml).replacen("<Item>","<Item uuid='one'>",1);
            let result=convert_file(entry,Direction::XmlToYaml,identified.as_bytes(),&inputs).unwrap();
            assert!(String::from_utf8_lossy(&result.bytes).contains("Id: one"));
            let restored=convert_file(entry,Direction::YamlToXml,&result.bytes,&inputs).unwrap();
            core::proof::verify(identified.as_bytes(),&restored.bytes,|_|false).unwrap();
            assert!(validate_file(entry,b"Rows: [{Name: reserved}]",&inputs).iter().any(|issue|issue.code.as_deref()==Some("row.name")));
            for original in [
                "<Root xmlns:r='urn:row'><Rows><Item><r:Name>first</r:Name></Item><Item><r:Name>second</r:Name><r:Mode>other</r:Mode></Item></Rows></Root>",
                "<Root xmlns:r='urn:row'><Rows><Item><r:Name>reserved</r:Name><r:Mode>normal</r:Mode></Item><Item><r:Name>allowed</r:Name><r:Mode>other</r:Mode></Item></Rows></Root>",
                "<Root xmlns:r='urn:row'><Rows><Item><r:Name>first</r:Name><r:Mode extra='a'>x</r:Mode></Item><Item><r:Name>second</r:Name><r:Mode><N/></r:Mode></Item></Rows></Root>",
                "<Root xmlns:r='urn:row'><Rows><Item extra='a'><r:Name>first</r:Name></Item></Rows></Root>",
                "<Root/>",
                "<Root><Rows/></Root>",
            ] {
                let yaml=convert_file(entry,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap_or_else(|error|panic!("{original}: {error:?}"));
                let restored=convert_file(entry,Direction::YamlToXml,&yaml.bytes,&inputs).unwrap();
                core::proof::verify(original.as_bytes(),&restored.bytes,|_|false).unwrap();
            }

        }
        let mut state=OwnerXmlReadOWNER_STREAM_ID::new();
        let mut other=OwnerXmlReadOWNER_STREAM_ID::new();
        core::xml::visit_scoped(xml,|path,token,scope| {
            if matches!(token,core::xml::Token::Start(_)) && path.last().is_some_and(|name|name.local=="Description") {
                core::xml::visit_scoped(b"<Root enabled='true'><Description>independent</Description></Root>",|path,token,scope|other.consume(path,&token,scope,&[],&inputs.view()))?;
            }
            state.consume(path,&token,scope,&[],&inputs.view())
        }).unwrap();
        let other=other.finish(&[],&inputs.view()).unwrap();
        let stored=state.finish(&[],&inputs.view()).unwrap();
        assert_eq!(write_yaml_OWNER_STREAM_ID(&other,&inputs.view()).unwrap(),"Сервер: LITERAL\nОписание: independent".as_bytes());
        assert_eq!(write_yaml_OWNER_STREAM_ID(&stored,&inputs.view()).unwrap(),yaml.as_bytes());
        let mut visits=0;
        let value=read_xml_shared_events_OWNER_STREAM_ID(b"",&inputs.view(),core::xml::ScopedEvents(|consume:&mut core::xml::ScopedConsumer<'_>| {
            visits+=1;
            core::xml::visit_scoped(xml,|path,token,scope|consume(path,&token,scope))
        })).unwrap();
        assert_eq!(visits,1);
        assert_eq!(write_yaml_OWNER_STREAM_ID(&value,&inputs.view()).unwrap(),yaml.as_bytes());
        let mut state=OwnerYamlReadOWNER_STREAM_ID::new().unwrap();
        let mut other=OwnerYamlReadOWNER_STREAM_ID::new().unwrap();
        let mut nodes=Vec::new();let mut other_nodes=Vec::new();
        core::yaml::visit_nodes(yaml.as_bytes(),|node,at|{nodes.push((node,at));Ok(())}).unwrap();
        core::yaml::visit_nodes("Сервер: LITERAL\nОписание: independent".as_bytes(),|node,at|{other_nodes.push((node,at));Ok(())}).unwrap();
        for ((node,at),(other_node,position)) in nodes.into_iter().zip(other_nodes){
            state.consume(node,at,&[],&inputs.view()).unwrap();other.consume(other_node,position,&[],&inputs.view()).unwrap();
        }
        let other=other.finish(&[],&inputs.view()).unwrap();
        let stored=state.finish(&[],&inputs.view()).unwrap();
        core::proof::verify(b"<Root enabled='true'><Description>independent</Description></Root>",&write_xml_OWNER_STREAM_ID(&other,&inputs.view()).unwrap(),|_|false).unwrap();
        core::proof::verify(xml,&write_xml_OWNER_STREAM_ID(&stored,&inputs.view()).unwrap(),|_|false).unwrap();
        let mut visits=0;
        let value=read_yaml_shared_events_OWNER_STREAM_ID(b"",&inputs.view(),core::yaml::Events(|consume:&mut core::yaml::Consumer<'_>| {
            visits+=1;
            core::yaml::visit_nodes(yaml.as_bytes(),|node,position|consume(node,position))
        })).unwrap();
        assert_eq!(visits,1);
        let prepared=prepare_xml_plain_OWNER_STREAM_ID(&value,&inputs.view()).unwrap();
        let mut namespaces=Vec::new();
        namespaces_xml_plain_OWNER_STREAM_ID(&value,&prepared,&mut namespaces);
        let writers=core::xml::writer_count();
        let mut writer=core::xml::Writer::new(&namespaces);
        write_xml_plain_into_OWNER_STREAM_ID(&value,&prepared,&inputs.view(),&mut writer).unwrap();
        let restored=writer.finish();
        assert_eq!(core::xml::writer_count(),writers+1);
        core::proof::verify(xml,&restored,|_|false).unwrap();
    }
    {
        let entry=entry_id("migration.additional-indexes").unwrap();let generation=core::facts::Generation(1);
        let budget=||core::facts::prepared::FactBudget{text:core::facts::text::TextBudget{entries:100,bytes:10000},rows:100};
        let empty=std::sync::Arc::new(fact_builder(generation,budget()).finish());
        let prepare=|facts|prepare_fact_inputs(entry,facts,generation,vec![("owner".into(),InputValue::Text("owner".into()))]).unwrap();
        let xml=b"<AdditionalIndexes xmlns='http://v8.1c.ru/8.3/xcf/extrnprops' version='2.20'><AdditionalIndex id='123'><Name>One</Name><Table>Document.D</Table><IndexedFields><Field>Ref</Field></IndexedFields><AdditionalFields/></AdditionalIndex></AdditionalIndexes>";
        let mut builder=fact_builder(generation,budget());
        let issues=contribute_file(entry,Direction::XmlToYaml,xml,&prepare(empty),&mut builder);assert!(issues.is_empty(),"{issues:?}");
        let snapshot=std::sync::Arc::new(builder.finish());
        let inputs=prepare(snapshot.clone());
        let mut conflict=fact_builder(generation,budget());
        for source in [xml.to_vec(),String::from_utf8_lossy(xml).replace("id='123'","id='456'").into_bytes()] {assert!(contribute_file(entry,Direction::XmlToYaml,&source,&inputs,&mut conflict).is_empty());}
        let conflict=prepare(std::sync::Arc::new(conflict.finish()));
        let explicit=convert_file(entry,Direction::XmlToYaml,xml,&conflict).unwrap();
        assert!(String::from_utf8_lossy(&explicit.bytes).contains("Идентификатор:"));
        let restored=convert_file(entry,Direction::YamlToXml,&explicit.bytes,&conflict).unwrap();core::proof::verify(xml,&restored.bytes,|_|false).unwrap();
        let owner_entry=entry_id("migration.additional-indexes-owner").unwrap();
        let owner_inputs=||prepare_fact_inputs(owner_entry,snapshot.clone(),generation,vec![("owner".into(),InputValue::Text("owner".into()))]).unwrap();
        for external in [xml.to_vec(),Vec::new(),b"<AdditionalIndexes xmlns='http://v8.1c.ru/8.3/xcf/extrnprops' version='2.20'/>".to_vec()] {
            let path=core::resources::RelativePath::new(["Ext","AdditionalIndexes.xml"],4096).unwrap();
            let prepared=owner_inputs().with_documents(vec![(path,external.clone())]).unwrap();
            let primary=b"<Root><Name>Main</Name></Root>";
            let yaml=convert_file(owner_entry,Direction::XmlToYaml,primary,&prepared).unwrap();
            let result=convert_file(owner_entry,Direction::YamlToXml,&yaml.bytes,&owner_inputs()).unwrap();
            assert_eq!(result.documents.len(),usize::from(!external.is_empty()));
            let prepared=owner_inputs().with_documents(result.documents).unwrap();
            verify_candidate(owner_entry,primary,&yaml.bytes,&prepared).unwrap();
        }

        let result=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
        assert_eq!(String::from_utf8_lossy(&result.bytes),"-\n  Имя: One\n  Таблица: Document.D\n  ИндексируемыеПоля:\n    - Ref");
        let restored=convert_file(entry,Direction::YamlToXml,&result.bytes,&inputs).unwrap();core::proof::verify(xml,&restored.bytes,|_|false).unwrap();
        for original in [String::from_utf8_lossy(xml).replace("version='2.20'","version='9'"),String::from_utf8_lossy(xml).replace(" id='123'",""),String::from_utf8_lossy(xml).replace("id='123'","id='123' extra='x'"),String::from_utf8_lossy(xml).replace("<Field>Ref</Field>","<Field>Ref</Field><Field>Ref</Field>"),String::from_utf8_lossy(xml).replace("<AdditionalFields/>",""),String::from_utf8_lossy(xml).replace("<Name>One</Name>","<Name>One</Name><Unknown/>")] {
            let result=convert_file(entry,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();let restored=convert_file(entry,Direction::YamlToXml,&result.bytes,&inputs).unwrap();core::proof::verify(original.as_bytes(),&restored.bytes,|_|false).unwrap();
        }
    }
    for (name,attributes,expected,omit,raw) in [
        ("typed", "enabled='true'", Some("Сервер: LITERAL"),false,false),
        ("typed", "enabled='false'", Some("Сервер: Ложь"),false,false),
        ("typed", "enabled='wrong'", None,false,true),
        ("typed", "", None,false,true),
        ("default", "enabled='false'", None,true,false),
        ("default", "", None,false,true),
        ("default", "enabled='wrong'", None,false,true),
        ("numeric", "enabled='true' a:amount='9007199254740993'", Some("Amount: 9007199254740993"),false,false),
        ("numeric", "enabled='true' a:amount='001.20'", Some("1.2"),false,true),
        ("numeric", "enabled='true' a:amount='wrong'", None,false,true),
        ("numeric", "enabled='true' a:amount=''", None,false,true),
        ("numeric", "enabled='false'", None,false,true),
        ("enum", "code='Number'", Some("ТипКода: Число"),false,false),
        ("enum", "code='Future'", None,false,true),
    ] {
        let entry=entry_id(&format!("test.{name}-attributes")).unwrap();
        let inputs=PreparedInputs::default();
        let xml=format!("<Root xmlns:a='urn:attributes' {attributes}><Description>kept</Description></Root>");
        let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
        let yaml=String::from_utf8_lossy(&result.bytes);
        if let Some(expected)=expected {assert!(yaml.contains(expected),"{name} {attributes}: {yaml}");}
        if omit {assert!(!yaml.contains("Сервер:"),"{yaml}");}
        assert_eq!(yaml.contains("!xml/raw"),raw,"{name} {attributes}: {yaml}");
        assert!(validate_file(entry,&result.bytes,&inputs).is_empty(),"{yaml}");
        verify_candidate(entry,xml.as_bytes(),&result.bytes,&inputs).unwrap();
    }
    {
        let entry=entry_id("test.root-scalar").unwrap();
        for extra in ["", " extra='retained'"] {
            let xml=format!("<Root xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xs='http://www.w3.org/2001/XMLSchema' xsi:type='xs:decimal'{extra}>42</Root>");
            let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
            assert_eq!(String::from_utf8_lossy(&result.bytes).contains("!xml/raw"), !extra.is_empty());
            verify_candidate(entry,xml.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
        }
    }
    {
        let entry=entry_id("test.implicit-owner").unwrap();
        let inputs=PreparedInputs::default();
        for (xml,yaml) in [("<Root><Description>body</Description></Root>","\u{0421}\u{0435}\u{0440}\u{0432}\u{0435}\u{0440}: \u{041b}\u{043e}\u{0436}\u{044c}\n\u{041e}\u{043f}\u{0438}\u{0441}\u{0430}\u{043d}\u{0438}\u{0435}: body"), ("<Root><Server>true</Server><Description>body</Description></Root>","\u{041e}\u{043f}\u{0438}\u{0441}\u{0430}\u{043d}\u{0438}\u{0435}: body")] {
            let imported=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
            assert_eq!(imported.bytes,yaml.as_bytes());
            let exported=convert_file(entry,Direction::YamlToXml,yaml.as_bytes(),&inputs).unwrap();
            core::proof::verify(xml.as_bytes(), &exported.bytes, |path| path.len()==2).unwrap();
        }
        let explicit=b"<Root><Server>false</Server><Description>body</Description></Root>";
        let imported=convert_file(entry,Direction::XmlToYaml,explicit,&inputs).unwrap();
        assert!(String::from_utf8_lossy(&imported.bytes).contains("!xml/raw"));
        verify_candidate(entry,explicit,&imported.bytes,&inputs).unwrap();
    }
    {
        let entry=entry_id("test.assembled-owner").unwrap();
        let xml=b"<Root xmlns:q='urn:types' format='normal' version='2.0' uuid='owner'><Server>true</Server><Rows><Item><Code>one</Code><Title>First</Title></Item></Rows><Settings><Server>true</Server><Description>nested</Description></Settings><Type>q:Atom</Type><Description>body</Description></Root>";
        let result=convert_file(entry,Direction::XmlToYaml,xml,&PreparedInputs::default()).unwrap();
        assert_eq!(String::from_utf8_lossy(&result.bytes),"Version: \"2.0\"\nUUID: owner\nСервер: LITERAL\nRows:\n  - Code: one\n    Title: First\nSettings:\n  Сервер: LITERAL\n  Описание: nested\nQualified:\n  Namespace: urn:types\n  Name: Atom\nОписание: body");
        verify_candidate(entry,xml,&result.bytes,&PreparedInputs::default()).unwrap();
        for (direction,source) in [(Direction::XmlToYaml,xml.as_slice()),(Direction::YamlToXml,result.bytes.as_slice())] {
            let generation=core::facts::Generation(1);
            let mut builder=fact_builder(generation,core::facts::prepared::FactBudget {text:core::facts::text::TextBudget {entries:20,bytes:1000},rows:20});
            let writes=core::xml::writer_count();
            let errors=contribute_file(entry,direction,source,&PreparedInputs::default(),&mut builder);
            assert!(errors.is_empty(),"{errors:?}");
            assert_eq!(core::xml::writer_count(),writes,"Owner fact preparation must reuse typed values");
            let facts=builder.finish();
            assert_eq!(facts.lookup(generation,fact_id("test.owner-identities").unwrap(),"body"),core::facts::FactState::Ready("owner"));
            assert_eq!(facts.lookup(generation,fact_id("test.owner-rows").unwrap(),"one"),core::facts::FactState::Ready("First"));
        }
        for original in [String::from_utf8_lossy(xml).replace(" uuid='owner'",""),String::from_utf8_lossy(xml).replace("<Description>body</Description>","<Description>reserved</Description>"),String::from_utf8_lossy(xml).replace("<Title>First</Title>","")] {
            let generation=core::facts::Generation(2);
            let mut builder=fact_builder(generation,core::facts::prepared::FactBudget {text:core::facts::text::TextBudget {entries:20,bytes:1000},rows:20});
            assert!(!contribute_file(entry,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default(),&mut builder).is_empty(),"Accepted invalid contribution: {original}");
            let facts=builder.finish();
            assert!(!matches!(facts.lookup(generation,fact_id("test.owner-identities").unwrap(),"body"),core::facts::FactState::Ready(_)));
        }
        let indexed=entry_id("test.indexed-assembly").unwrap();
        let inputs=prepare_inputs(indexed,vec![("identity".into(),core::InputValue::Text("owner".into()))]).unwrap();
        let compact=convert_file(indexed,Direction::XmlToYaml,xml,&inputs).unwrap();
        assert!(!String::from_utf8_lossy(&compact.bytes).contains("UUID:"));
        verify_candidate(indexed,xml,&compact.bytes,&inputs).unwrap();
        let changed=String::from_utf8_lossy(xml).replace("uuid='owner'","uuid='different'");
        let explicit=convert_file(indexed,Direction::XmlToYaml,changed.as_bytes(),&inputs).unwrap();
        assert!(String::from_utf8_lossy(&explicit.bytes).contains("UUID: different"));
        verify_candidate(indexed,changed.as_bytes(),&explicit.bytes,&inputs).unwrap();
        let absent=String::from_utf8_lossy(xml).replace(" uuid='owner'","");
        let preserved=convert_file(indexed,Direction::XmlToYaml,absent.as_bytes(),&inputs).unwrap();
        verify_candidate(indexed,absent.as_bytes(),&preserved.bytes,&inputs).unwrap();
        assert!(String::from_utf8_lossy(&preserved.bytes).contains("!xml/raw"));
        let hostile=core::raw::Document::encode(&result.bytes,b"Server: 'false'").unwrap();
        assert!(!validate_file(entry,&hostile,&PreparedInputs::default()).is_empty());
        assert!(convert_file(entry,Direction::YamlToXml,&hostile,&PreparedInputs::default()).is_err());
        let mut rejected=fact_builder(core::facts::Generation(3),core::facts::prepared::FactBudget {text:core::facts::text::TextBudget {entries:20,bytes:1000},rows:20});
        assert!(!contribute_file(entry,Direction::YamlToXml,&hostile,&PreparedInputs::default(),&mut rejected).is_empty());
        let reordered=String::from_utf8_lossy(xml).replacen("<Server>true</Server><Rows>","<Rows>",1).replacen("</Rows>","</Rows><Server>true</Server>",1);
        let result=convert_file(entry,Direction::XmlToYaml,reordered.as_bytes(),&PreparedInputs::default()).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).starts_with("!xml/raw"));
        verify_candidate(entry,reordered.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
        let omitted=String::from_utf8_lossy(xml).replacen("<Server>true</Server>","<Server>false</Server>",1);
        let result=convert_file(entry,Direction::XmlToYaml,omitted.as_bytes(),&PreparedInputs::default()).unwrap();
        assert!(!String::from_utf8_lossy(&result.bytes).lines().any(|line|line.starts_with("Сервер:")));
        verify_candidate(entry,omitted.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
        let reserved=String::from_utf8_lossy(xml).replace("<Description>body</Description>","<Description>reserved</Description>");
        let result=convert_file(entry,Direction::XmlToYaml,reserved.as_bytes(),&PreparedInputs::default()).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).contains("!xml/invalid"));
        verify_candidate(entry,reserved.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
        for (from,to) in [(" format='normal'",""),("format='normal'","format='different'"),("</Root>","<Extra flag='keep'/></Root>"),(" uuid='owner'",""),("<Server>true</Server>","<Server>unexpected</Server>"),("<Rows>","<Rows extra='keep'>"),("<Settings>","<Settings extra='keep'>"),("<Type>","<Type extra='keep'>")] {
            let original=String::from_utf8_lossy(xml).replacen(from,to,1);
            let result=convert_file(entry,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
            assert!(String::from_utf8_lossy(&result.bytes).contains("!xml/raw"));
            verify_candidate(entry,original.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
        }

    }
    {
        let entry=entry_id("test.attributed-rows").unwrap();
        let xml=b"<Root xmlns:r='urn:row'><Rows><Item code='one' r:title='First'><Identity>id</Identity></Item><Item code='two' r:title='Second'><Identity>id2</Identity></Item></Rows></Root>";
        let result=convert_file(entry,Direction::XmlToYaml,xml,&PreparedInputs::default()).unwrap();
        assert_eq!(String::from_utf8_lossy(&result.bytes),"Rows:\n  - Code: one\n    Title: First\n    Identity: id\n  - Code: two\n    Title: Second\n    Identity: id2");
        verify_candidate(entry,xml,&result.bytes,&PreparedInputs::default()).unwrap();
        for (code,key,marker,expected) in [("one.NewName","one","","retained"),(".suffix","empty","","retained"),("one.NewName","one"," marker='saved'","prefix-saved")] {
            let renamed=String::from_utf8_lossy(xml).replace("code='one'",&format!("code='{code}'")).replace("<Root ",&format!("<Root{marker} "));
            let yaml=convert_file(entry,Direction::XmlToYaml,renamed.as_bytes(),&PreparedInputs::default()).unwrap();
            for (direction,source) in [(Direction::XmlToYaml,renamed.as_bytes()),(Direction::YamlToXml,yaml.bytes.as_slice())] {
                let generation=core::facts::Generation(4);
                let mut builder=fact_builder(generation,core::facts::prepared::FactBudget {text:core::facts::text::TextBudget {entries:30,bytes:1000},rows:30});
                let errors=contribute_file(entry,direction,source,&PreparedInputs::default(),&mut builder);
                assert!(errors.is_empty(),"{errors:?}");
                let facts=builder.finish();
                assert_eq!(facts.lookup(generation,fact_id("test.short-names").unwrap(),key),core::facts::FactState::Ready("id"));
                assert_eq!(facts.lookup(generation,fact_id("test.static-owner").unwrap(),"static"),core::facts::FactState::Ready(expected));
            }
        }
        for original in [String::from_utf8_lossy(xml).replacen(" code='one'","",1),String::from_utf8_lossy(xml).replacen("code='one'","code='one' extra='keep'",1)] {
            let preserved=convert_file(entry,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
            assert!(String::from_utf8_lossy(&preserved.bytes).contains("!xml/raw"));
            verify_candidate(entry,original.as_bytes(),&preserved.bytes,&PreparedInputs::default()).unwrap();
        }
    }
    for boolean in ["true", "unexpected"] {
        let xml=format!("<Root><Server>{boolean}</Server><Rows><Item><Code>one</Code><Title>First</Title></Item></Rows><Description>body</Description></Root>");
        let inputs=PreparedInputs::default();
        let mut collection=None;
        let mut reads=0;
        let scalar=read_xml_events_SCALAR_ID(xml.as_bytes(),&inputs.view(),core::xml::Events(|consume: &mut core::xml::Consumer<'_>| {
            reads+=1;
            collection=Some(read_xml_events_ROWS_ID(xml.as_bytes(),&inputs.view(),core::xml::DocumentSource(xml.as_bytes()),|path,token| {
                if path.get(1).is_some_and(|name|name.local=="Server" || name.local=="Description") {
                    consume(path,token)?;Ok(true)
                } else {Ok(false)}
            })?);
            Ok(())
        })).unwrap();
        assert_eq!(reads,1);
        let yaml=String::from_utf8(write_yaml_SCALAR_ID(&scalar,&inputs.view()).unwrap()).unwrap();
        assert!(yaml.contains("body"));
        assert_eq!(yaml.contains("!xml/raw"),boolean=="unexpected");
        let mut combined_yaml=String::from("Before: preserved");
        write_yaml_into_SCALAR_ID(&scalar,&inputs.view(),&mut combined_yaml).unwrap();
        assert_eq!(combined_yaml,format!("Before: preserved\n{yaml}"));
        let mut collection=collection.unwrap();
        let rows=String::from_utf8(write_yaml_ROWS_ID(&collection,&inputs.view()).unwrap()).unwrap();
        assert!(rows.contains("one") && rows.contains("First"));
        prepare_yaml_into_ROWS_ID(&collection,&inputs.view(),true,&mut combined_yaml,"").unwrap();
        assert_eq!(combined_yaml,format!("Before: preserved\n{yaml}\n{rows}"));
        let mut nested=String::from("Owner:");
        prepare_yaml_into_ROWS_ID(&collection,&inputs.view(),true,&mut nested,"  ").unwrap();
        assert_eq!(nested,"Owner:\n  Rows:\n    - Code: one\n      Title: First");
        if boolean=="unexpected" {
            let source=b"<Root><Rows xmlns:x='urn:extra' x:flag='keep'><Item><Code>one</Code><Title>First</Title></Item></Rows></Root>";
            let converted=convert_file(entry_id("test.fact-rows").unwrap(),Direction::XmlToYaml,source,&inputs).unwrap();
            assert!(String::from_utf8_lossy(&converted.bytes).contains("!xml/raw"));
            collection=read_yaml_ROWS_ID(&converted.bytes,&inputs.view()).unwrap();
            let mut repeated=String::new();
            write_yaml_into_ROWS_ID(&collection,&inputs.view(),&mut repeated).unwrap();
            verify_candidate(entry_id("test.fact-rows").unwrap(),source,repeated.as_bytes(),&inputs).unwrap();
        }
        let writes=core::xml::writer_count();
        let prepared=prepare_xml_SCALAR_ID(&scalar,&inputs.view()).unwrap();
        let prepared_rows=prepare_xml_ROWS_ID(&collection,&inputs.view()).unwrap();
        let mut namespaces=Vec::new();
        namespaces_xml_SCALAR_ID(&scalar,&prepared,&mut namespaces);
        namespaces_xml_ROWS_ID(&collection,&prepared_rows,&mut namespaces);
        let mut writer=core::xml::Writer::new(&namespaces);
        write_xml_field_SCALAR_ID_0(&scalar,&prepared,&inputs.view(),&mut writer).unwrap();
        write_xml_into_ROWS_ID(&collection,&prepared_rows,&inputs.view(),&mut writer).unwrap();
        write_xml_field_SCALAR_ID_1(&scalar,&prepared,&inputs.view(),&mut writer).unwrap();
        let combined=writer.finish();
        assert_eq!(core::xml::writer_count()-writes,if boolean=="unexpected" {2} else {1});
        let attributes=if boolean=="unexpected" {" xmlns:x='urn:extra' x:flag='keep'"} else {""};
        let expected=format!("<Root><Server>{boolean}</Server><Rows{attributes}><Item><Code>one</Code><Title>First</Title></Item></Rows><Description>body</Description></Root>");
        core::proof::verify_with_attributes(expected.as_bytes(),&combined,|path|path.last().is_some_and(|name|matches!(name.local.as_str(),"Server"|"Description"|"Code"|"Title")),|_,_|false).unwrap_or_else(|error|panic!("{error:?}: {}",String::from_utf8_lossy(&combined)));
        assert_eq!(String::from_utf8(combined).unwrap().matches("<?xml").count(),1);
    }
    {
        let source="Сервер: LITERAL\nRows: [{Code: one, Title: First}]\nОписание: body".as_bytes();
        let inputs=PreparedInputs::default();
        let mut rows=None;
        let mut reads=0;
        let scalar=read_yaml_events_SCALAR_ID(source,&inputs.view(),core::raw::Fields::default(),core::yaml::Events(|consume:&mut core::yaml::Consumer<'_>| {
            reads+=1;
            rows=Some(read_yaml_events_ROWS_ID(source,&inputs.view(),core::yaml::PartitionSource {
                source:core::yaml::DocumentSource(source),select:|key:&str|key=="Rows",sibling:consume,
            })?);
            Ok(())
        })).unwrap();
        assert_eq!(reads,1);
        assert!(String::from_utf8(write_yaml_SCALAR_ID(&scalar,&inputs.view()).unwrap()).unwrap().contains("body"));
        assert!(String::from_utf8(write_yaml_ROWS_ID(&rows.unwrap(),&inputs.view()).unwrap()).unwrap().contains("First"));
    }
    let chain = core::text_pattern::Sequence::<2>::new("::").unwrap();
    let rows = chain.rows("west::leaf::east::twig", 10, 1024).unwrap();
    let items = rows.map(|row| SLOT_CODEC::read_slots(row.unwrap(), true)).collect::<core::Result<Vec<_>>>().unwrap();
    let printed = items.iter().map(|item| item.write(false)).collect::<core::Result<Vec<_>>>().unwrap();
    assert_eq!(printed, ["[leaf] Запад", "[twig] Восток"]);
    let sequence = entry_id("test.text-sequence").unwrap();
    for (entry, text, expected, tag) in [
        (sequence, "west::leaf::east::twig", Some("Pair: leaf/Запад/twig/Восток"), None),
        (sequence, "west::leaf::west::leaf", Some("Pair: leaf/Запад/leaf/Запад"), None),
        (sequence, "", Some("Pair: \"\""), None),
        (sequence, "west::1bad", None, Some("!xml/invalid")),
        (sequence, "west::reserved", None, Some("!xml/invalid")),
        (sequence, "west::leaf::extra", None, Some("!xml/raw")),
        (sequence, "unknown::leaf", None, Some("!xml/raw")),
        (sequence, "west::a/b", None, Some("!xml/raw")),
        (entry_id("test.framed-sequence").unwrap(), "west::leaf", Some("Pair: leaf/Запад"), None),
        (entry_id("test.framed-sequence").unwrap(), "west::leaf::east::twig::west::leaf", Some("Pair: leaf/Запад/twig/Восток/leaf/Запад"), None),
        (entry_id("test.framed-sequence").unwrap(), "west::reserved::east::twig", None, Some("!xml/invalid")),
        (entry_id("test.framed-sequence").unwrap(), "west::leaf::east::1bad", None, Some("!xml/invalid")),
        (entry_id("test.framed-sequence").unwrap(), "west::leaf::", None, Some("!xml/raw")),
    ] {
        let xml = format!("<Root><Pair>{text}</Pair></Root>");
        let result = convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
        match (expected,tag) {
            (Some(expected),None) => assert_eq!(result.bytes,expected.as_bytes()),
            (None,Some(tag)) => assert!(String::from_utf8_lossy(&result.bytes).contains(tag),"{}",String::from_utf8_lossy(&result.bytes)),
            _ => panic!("Each case must declare either normal output or anomaly"),
        }
        assert!(validate_file(entry,&result.bytes,&PreparedInputs::default()).is_empty(),"{}",String::from_utf8_lossy(&result.bytes));
        verify_candidate(entry,xml.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
    }
    let issues = validate_file(sequence,"Pair: leaf/Запад/1bad/Восток".as_bytes(),&PreparedInputs::default());
    assert!(issues.iter().any(|issue|issue.message.starts_with("Element 2:")));
    assert!(SLOT_CODEC::read_slots(["unknown", "leaf"], true).is_err());
    let fact_owner = entry_id("test.fact-owner").unwrap();
    let schedule = fact_plan(&[fact_owner,fact_owner],&[],10).unwrap();
    let names_slot = fact_id("test.names").unwrap().0 as usize + 2;
    let index_step = core::facts::dependencies::StepId(names_slot as u32);
    assert_eq!(schedule.dependencies(index_step).unwrap(), &[core::facts::dependencies::StepId(0),core::facts::dependencies::StepId(1)]);
    assert_eq!(schedule.affected(&[core::facts::dependencies::StepId(0)]).unwrap(),vec![core::facts::dependencies::StepId(0),index_step]);
    assert!(fact_plan(&[fact_owner],&[],0).is_err());
    assert!(fact_plan(&[EntryId(u32::MAX)],&[],10).is_err());
    let generation = core::facts::Generation(7);
    let budget = || core::facts::prepared::FactBudget { text: core::facts::text::TextBudget { entries: 30, bytes: 1000 }, rows: 20 };
    for (name,source,yaml) in [
        ("test.identity-source", "<Root token='exact'><Name>First</Name></Root>","Name: First"),
        ("test.inherited-identity", "<Root token='exact'><Name>First</Name></Root>","Name: First"),
        ("test.identity-owner", "<Root><Rows><Item token='first-id'><Name>First</Name></Item><Item token='second-id'><Name>Second</Name></Item></Rows></Root>","Rows:\n  First: {}\n  Second: {}"),
    ] {
    let identity = entry_id(name).unwrap();
    let source_plan = fact_plan_for_sources(&[(identity,Direction::XmlToYaml)],&[identity],20).unwrap();
    assert!(source_plan.dependencies(core::facts::dependencies::StepId(0)).unwrap().is_empty());
    assert!(fact_plan_for_sources(&[(identity,Direction::YamlToXml)],&[],20).is_err());
    assert!(fact_plan(&[identity],&[],20).is_err());
    assert!(fact_plan_for_sources(&[(identity,Direction::XmlToYaml)],&[],0).is_err());
    let mut own = fact_builder(generation,budget());
    let source=source.as_bytes();
    let diagnostics=contribute_file(identity,Direction::XmlToYaml,source,&PreparedInputs::default(),&mut own);
    assert!(diagnostics.is_empty(),"{name}: {diagnostics:?}");
    let restored = prepare_fact_inputs(identity,std::sync::Arc::new(own.finish()),generation,vec![]).unwrap();
    let output = convert_file(identity,Direction::YamlToXml,yaml.as_bytes(),&restored).unwrap();
    core::proof::verify(source,&output.bytes,|_|false).unwrap();
    }
    let mut builder = fact_builder(generation, budget());
    let writes = core::xml::writer_count();
    for (direction, source) in [
        (Direction::XmlToYaml, "<Root><Code>one</Code><Title>First</Title></Root>"),
        (Direction::YamlToXml, "Code: two\nTitle: Second"),
        (Direction::YamlToXml, "Code: two\nTitle: Duplicate"),
    ] {
        assert!(contribute_file(fact_owner,direction,source.as_bytes(),&PreparedInputs::default(),&mut builder).is_empty());
    }
    let rows_owner=entry_id("test.fact-rows").unwrap();
    for (direction,source) in [
        (Direction::XmlToYaml,"<Root><Rows><Item><Code>three</Code><Title>Third</Title></Item></Rows></Root>"),
        (Direction::YamlToXml,"Rows:\n  - Code: four\n    Title: Fourth\n  - Code: five\n    Title: Fifth"),
    ] {
        let errors=contribute_file(rows_owner,direction,source.as_bytes(),&PreparedInputs::default(),&mut builder);
        assert!(errors.is_empty(),"{errors:?}");
    }
    assert_eq!(core::xml::writer_count(),writes,"Preparation must not write XML");
    let facts = std::sync::Arc::new(builder.finish());
    let names = fact_id("test.names").unwrap();
    use nkdk_conversion_core::facts::FactState;
    assert_eq!(facts.lookup(generation,names,"one"),FactState::Ready("First"));
    assert_eq!(facts.lookup(generation,names,"three"),FactState::Ready("Third"));
    assert_eq!(facts.lookup(generation,names,"four"),FactState::Ready("Fourth"));
    assert_eq!(facts.lookup(generation,names,"five"),FactState::Ready("Fifth"));
    assert_eq!(facts.lookup(generation,names,"two"),FactState::Ambiguous);
    assert_eq!(facts.lookup(generation,names,"unknown"),FactState::Missing);
    let indexed_frame=entry_id("test.indexed-frame").unwrap();
    let source_entry=entry_id("test.fact-path-owner").unwrap();
    let mut path_builder=fact_builder(generation,budget());
    for text in ["Kind: Запад\nName: one\nIdentity: first", "Kind: Восток\nName: one\nIdentity: other", "Kind: Запад\nName: two\nIdentity: second", "Kind: Запад\nName: two\nIdentity: duplicate"] {
        assert!(contribute_file(source_entry,Direction::YamlToXml,text.as_bytes(),&PreparedInputs::default(),&mut path_builder).is_empty());
    }
    let edge=entry_id("test.fact-path-edge").unwrap();
    for text in ["Kind: Восток\nName: forbidden\nParent: first\nIdentity: registered", "Kind: Восток\nName: twig\nParent: first\nIdentity: branch","Kind: Запад\nName: leaf\nParent: branch\nIdentity: terminal","Kind: Восток\nName: ambiguous\nParent: first\nIdentity: x","Kind: Восток\nName: ambiguous\nParent: first\nIdentity: y"] {
        assert!(contribute_file(edge,Direction::YamlToXml,text.as_bytes(),&PreparedInputs::default(),&mut path_builder).is_empty());
    }
    let path_facts=std::sync::Arc::new(path_builder.finish());
    let path_inputs=prepare_fact_inputs(indexed_frame,path_facts.clone(),generation,vec![]).unwrap();
    for (text,code) in [("Pair: one/Запад/twig/Восток",None),("Pair: one/Восток",None),("Pair: absent/Запад",Some("path.root-missing")),("Pair: two/Запад",Some("fact.ambiguous"))] {
        let issues=validate_file(indexed_frame,text.as_bytes(),&path_inputs);
        if let Some(code)=code {assert!(issues.iter().any(|issue|issue.code.as_deref()==Some(code)),"{issues:?}");}else{assert!(issues.is_empty(),"{issues:?}");}
    }
    let walked=entry_id("test.walked-path").unwrap();
    let walked_inputs=prepare_fact_inputs(walked,path_facts.clone(),generation,vec![]).unwrap();
    for (path,code) in [("one/Запад",None),("one/Запад/twig/Восток/leaf/Запад",None),("one/Запад/leaf/Запад",Some("path.target-missing")),("one/Запад/twig/Запад",Some("path.target-missing")),("one/Запад/forbidden/Восток",Some("path.segment-not-allowed")),("absent/Запад",Some("path.target-missing")),("one/Запад/ambiguous/Восток",Some("fact.ambiguous"))] {
        let issues=validate_file(walked,format!("Path: {path}").as_bytes(),&walked_inputs);
        if let Some(code)=code {assert!(issues.iter().any(|issue|issue.code.as_deref()==Some(code)),"{issues:?}");}else{assert!(issues.is_empty(),"{issues:?}");}
    }
    let too_deep=validate_file(walked,"Path: one/Запад/twig/Восток/leaf/Запад/leaf/Запад".as_bytes(),&walked_inputs);
    assert!(too_deep.iter().any(|issue|issue.code.as_deref()==Some("path.too-deep")),"{too_deep:?}");
    for missing_child in [b"<Root><Path>west::one::west::leaf</Path></Root>".as_slice(),b"<Root><Path>west::one::east::forbidden</Path></Root>"] {
    let preserved_child=convert_file(walked,Direction::XmlToYaml,missing_child,&walked_inputs).unwrap();
    assert!(String::from_utf8_lossy(&preserved_child.bytes).contains("!xml/invalid"));
    assert!(validate_file(walked,&preserved_child.bytes,&walked_inputs).is_empty());
    verify_candidate(walked,missing_child,&preserved_child.bytes,&walked_inputs).unwrap();
    }
    let mut incomplete=fact_builder(generation,budget());
    assert!(contribute_file(source_entry,Direction::XmlToYaml,b"<Root><Kind>west</Kind><Name>one</Name><Identity>first</Identity></Root>",&PreparedInputs::default(),&mut incomplete).is_empty());
    incomplete.mark_unready(fact_id("test.path-children").unwrap()).unwrap();
    let incomplete=prepare_fact_inputs(walked,std::sync::Arc::new(incomplete.finish()),generation,vec![]).unwrap();
    assert!(validate_file(walked,"Path: one/Запад".as_bytes(),&incomplete).is_empty());
    assert!(validate_file(walked,"Path: one/Запад/twig/Восток".as_bytes(),&incomplete).iter().any(|issue|issue.code.as_deref()==Some("fact.unready")));
    let old=prepare_fact_inputs(indexed_frame,path_facts,core::facts::Generation(99),vec![]).unwrap();
    assert!(validate_file(indexed_frame,"Pair: one/Запад".as_bytes(),&old).iter().any(|issue|issue.code.as_deref()==Some("fact.unready")));
    let source=b"<Root><Pair>west::absent::east::twig</Pair></Root>";
    let preserved=convert_file(indexed_frame,Direction::XmlToYaml,source,&path_inputs).unwrap();
    assert!(String::from_utf8_lossy(&preserved.bytes).contains("!xml/invalid"));
    assert!(validate_file(indexed_frame,&preserved.bytes,&path_inputs).is_empty());
    verify_candidate(indexed_frame,source,&preserved.bytes,&path_inputs).unwrap();
    let consumer = entry_id("test.fact-consumer").unwrap();
    let bind = |generation| prepare_fact_inputs(consumer,facts.clone(),generation,vec![]).unwrap();
    let schedule=fact_plan(&[fact_owner],&[consumer,consumer],10).unwrap();
    let affected=schedule.affected(&[core::facts::dependencies::StepId(0)]).unwrap();
    assert_eq!(affected.len(),4,"One source, one shared index, two consumers");
    assert!(schedule.dependencies(core::facts::dependencies::StepId((1+fact_names().len()) as u32)).unwrap().contains(&core::facts::dependencies::StepId(1+names.0)));
    let consumer_inputs = bind(generation);
    assert!(validate_file(consumer,b"Target: one",&consumer_inputs).is_empty());
    for (source,code) in [(b"Target: absent".as_slice(),"target.missing"),(b"Target: two","fact.ambiguous")] {
        let errors=validate_file(consumer,source,&consumer_inputs);
        assert!(errors.iter().any(|error|error.code.as_deref()==Some(code)),"{errors:?}");
    }
    assert!(validate_file(consumer,b"Target: one",&bind(core::facts::Generation(99))).iter().any(|error|error.code.as_deref()==Some("fact.unready")));
    let member=entry_id("test.fact-member-consumer").unwrap();
    let member_inputs=prepare_fact_inputs(member,facts.clone(),generation,vec![]).unwrap();
    assert!(validate_file(member,b"Target: three",&member_inputs).is_empty());
    assert!(validate_file(member,b"Target: one",&member_inputs).iter().any(|error|error.code.as_deref()==Some("member.missing")));
    let bound=entry_id("test.fact-bound-consumer").unwrap();
    let bound_inputs=prepare_fact_inputs(bound,facts.clone(),generation,vec![("context".into(),core::InputValue::Text("owner".into()))]).unwrap();
    assert!(validate_file(bound,b"Target: one",&bound_inputs).is_empty());
    for (source,code) in [(b"Target: absent".as_slice(),"bound-target.missing"),(b"Target: two","fact.ambiguous")] {
        let errors=validate_file(bound,source,&bound_inputs);
        assert!(errors.iter().any(|error|error.code.as_deref()==Some(code)),"{errors:?}");
    }
    let missing_target=b"<Root><Target>absent</Target></Root>";
    let preserved=convert_file(bound,Direction::XmlToYaml,missing_target,&bound_inputs).unwrap();
    assert!(String::from_utf8_lossy(&preserved.bytes).contains("!xml/invalid"));
    assert!(validate_file(bound,&preserved.bytes,&bound_inputs).is_empty());
    verify_candidate(bound,missing_target,&preserved.bytes,&bound_inputs).unwrap();
    // Independent consumers borrow the same prepared value.
    let FactState::Ready(first) = facts.lookup(generation,names,"one") else { panic!() };
    let FactState::Ready(second) = facts.lookup(generation,names,"one") else { panic!() };
    assert!(std::ptr::eq(first,second));
    let mut broken = fact_builder(generation, core::facts::prepared::FactBudget { text: core::facts::text::TextBudget { entries: 10, bytes: 100 }, rows: 10 });
    for invalid in [b"<Root>".as_slice(), b"<Root><Code>BAD</Code><Title>Invalid code</Title></Root>", b"<Root><Code>one</Code></Root>"] {
        assert!(!contribute_file(fact_owner,Direction::XmlToYaml,invalid,&PreparedInputs::default(),&mut broken).is_empty());
    }
    assert!(contribute_file(fact_owner,Direction::YamlToXml,b"Code: one\nTitle: First",&PreparedInputs::default(),&mut broken).is_empty());
    assert!(!contribute_file(rows_owner,Direction::YamlToXml,b"Rows: !xml/raw\n  $xml: {Unknown: value}",&PreparedInputs::default(),&mut broken).is_empty());
    assert!(!contribute_file(rows_owner,Direction::XmlToYaml,b"<Root><Rows><Item><Code>incomplete</Code></Item></Rows></Root>",&PreparedInputs::default(),&mut broken).is_empty());
    for (direction, source) in [
        (Direction::XmlToYaml, "<Root><Rows><Item><Code/><Title>Invalid</Title></Item></Rows></Root>"),
        (Direction::YamlToXml, "Rows: [{Code: '', Title: Invalid}]"),
        (Direction::YamlToXml, "Rows: !xml/invalid [{Code: '', Title: Invalid}]"),
    ] {
        let errors=contribute_file(rows_owner,direction,source.as_bytes(),&PreparedInputs::default(),&mut broken);
        assert!(errors.iter().any(|error|error.code.as_deref()==Some("fact.row-code")),"{errors:?}");
    }
    assert_eq!(broken.finish().lookup(generation,names,"never-read"),FactState::Unready);
    for (entry,text,expected) in [
        ("test.text-delimiter","leafaawest",Some("Pair: leafaa\u{417}\u{430}\u{43f}\u{430}\u{434}")),
        ("test.text-delimiter","aaaawest",Some("Pair: literal.\u{417}\u{430}\u{43f}\u{430}\u{434}")),
        ("test.text-delimiter","aaawest",None),
        ("test.text-choice","a:leaf",Some("Pair: \"Первое: leaf\"")),
        ("test.text-choice","b:leaf",Some("Pair: \"Второе: leaf\"")),
        ("test.text-choice","c:leaf",None),
        ("test.text-table","leaf",Some("Pair: leaf")),
        ("test.text-table","east",Some("Pair: Восток")),
        ("test.text-table","Восток",None),
        ("test.text-pattern","west::leaf",Some("Pair: \"[leaf] west\"")),
        ("test.text-pattern","missing",None),
        ("test.text-pattern","west::leaf] extra",None),
        ("test.text-pattern-coded","west::leaf",Some("Pair: \"[leaf] Запад\"")),
        ("test.text-pattern-coded","unknown::leaf",None),
        ("test.text-pattern-coded","west::east",Some("Pair: \"[Восток] Запад\"")),
        ("test.text-pattern-coded","west::Восток",None),
    ] {
        let patterned=entry_id(entry).unwrap();
        let original=format!("<Root><Pair>{text}</Pair></Root>");
        let result=convert_file(patterned,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        let rendered=String::from_utf8_lossy(&result.bytes);
        if let Some(expected)=expected { assert_eq!(rendered, expected); }
        else { assert!(rendered.contains("!xml/raw"),"{rendered}"); }
        assert!(validate_file(patterned,&result.bytes,&PreparedInputs::default()).is_empty());
        let restored=convert_file(patterned,Direction::YamlToXml,&result.bytes,&PreparedInputs::default()).unwrap();
        core::proof::verify(original.as_bytes(),&restored.bytes,|path|path.last().is_some_and(|name|name.local=="Pair")).unwrap();
        verify_candidate(patterned,original.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
    }
    let attribute_only = entry_id("test.attribute-only").unwrap();
    for xml in ["<Root version=\"2\"><Item xmlns:m=\"urn:owner\" m:uuid=\"abc\"/></Root>", "<Root><Item/></Root>"] {
        let result=convert_file(attribute_only,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
        verify_candidate(attribute_only,xml.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
    }
    let nested_header = entry_id("test.nested-header").unwrap();
    for xml in [
        "<Root/>",
        "<Root><Settings/></Root>",
        "<Root><Settings mode='normal'><Server>true</Server></Settings></Root>",
        "<Root><Settings uuid='body'><Server>true</Server></Settings></Root>",
        "<Root><Settings uuid='body' mode='normal'><Server>true</Server></Settings></Root>",
        "<Root><Settings mode='different' uuid='body'><Server>true</Server></Settings></Root>",
    ] {
        let result=convert_file(nested_header,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
        verify_candidate(nested_header,xml.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
        let value=read_yaml_HEADER_ID(&result.bytes,&PreparedInputs::default().view()).unwrap();
        let repeated=write_yaml_HEADER_ID(&value,&PreparedInputs::default().view()).unwrap();
        verify_candidate(nested_header,xml.as_bytes(),&repeated,&PreparedInputs::default()).unwrap();
    }
    let attributes = entry_id("test.attribute-owner").unwrap();
    for attribute in [" meta:uuid=\"owner-1\"", " meta:uuid=\"\"", " meta:uuid=\"a&amp;b\"", " meta:uuid=\"a&#10;b&#9;c&#13;d\"", ""] {
        let original=format!("<Root xmlns:meta=\"urn:owner\" version=\"2.0\"><Item{attribute} revision=\"r1\"><Server>true</Server><Description>body</Description></Item></Root>");
        let result=convert_file(attributes,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        assert_eq!(String::from_utf8_lossy(&result.bytes).contains("!xml/raw"),attribute.is_empty());
        verify_candidate(attributes,original.as_bytes(),&result.bytes,&PreparedInputs::default()).unwrap();
    }
    for bad in [
        "Version: '2.0'\nUUID: !xml/raw\n  $xml: {unexpected: x}\nСервер: LITERAL\nОписание: body",
        "Version: '2.0'\nСервер: LITERAL\nОписание: body",
    ] {
        assert!(!validate_file(attributes,bad.as_bytes(),&PreparedInputs::default()).is_empty());
        assert!(convert_file(attributes,Direction::YamlToXml,bad.as_bytes(),&PreparedInputs::default()).is_err());
    }
    let bound = entry_id("test.bound-choice").unwrap();
    for (selected, enabled) in [("leaf",true), ("other",false)] {
        let inputs=read_inputs(bound,format!("unused: {enabled}\nselected: {selected}").as_bytes()).unwrap();
        let normal=convert_file(bound,Direction::YamlToXml,format!("Pair: \"Первое: {selected}\"").as_bytes(),&inputs).unwrap();
        assert_eq!(String::from_utf8_lossy(&normal.bytes).contains("marked=\"yes\""),enabled);
        verify_candidate(bound,b"<Root/>",b"{}",&inputs).unwrap();
        for (text, valid) in [("a:leaf", selected=="leaf"), ("a:other", selected=="other"), ("b:leaf",true)] {
            let original=format!("<Root><Pair>{text}</Pair></Root>");
            let result=convert_file(bound,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
            assert_eq!(String::from_utf8_lossy(&result.bytes).contains("!xml/invalid"),!valid);
            verify_candidate(bound,original.as_bytes(),&result.bytes,&inputs).unwrap();
        }
    }
    let choice = entry_id("test.text-choice").unwrap();
    for (xml, yaml) in [("a:123", "Первое: 123"), ("b:", "Второе: ")] {
        let original = format!("<Root><Pair>{xml}</Pair></Root>");
        let result = convert_file(choice, Direction::XmlToYaml, original.as_bytes(), &PreparedInputs::default()).unwrap();
        let rendered = String::from_utf8_lossy(&result.bytes);
        assert!(rendered.contains("!xml/invalid"), "{rendered}");
        assert!(rendered.contains(yaml), "{rendered}");
        assert!(validate_file(choice, &result.bytes, &PreparedInputs::default()).is_empty());
        assert!(!validate_file(choice, format!("Pair: {yaml:?}").as_bytes(), &PreparedInputs::default()).is_empty());
        verify_candidate(choice, original.as_bytes(), &result.bytes, &PreparedInputs::default()).unwrap();
    }
    let table_entry = entry_id("test.text-table").unwrap();
    let model_alias = b"Pair: east";
    assert!(validate_file(table_entry, model_alias, &PreparedInputs::default()).is_empty());
    let model = convert_file(table_entry, Direction::YamlToXml, model_alias, &PreparedInputs::default()).unwrap();
    let canonical = convert_file(table_entry, Direction::XmlToYaml, &model.bytes, &PreparedInputs::default()).unwrap();
    assert_eq!(canonical.bytes, "Pair: Восток".as_bytes());
    let patterned = entry_id("test.text-pattern-coded").unwrap();
    for name in ["bad-name", "reserved"] {
    let original = format!("<Root><Pair>west::{name}</Pair></Root>");
    let original = original.as_bytes();
    let inputs = PreparedInputs::default();
    let result = convert_file(patterned, Direction::XmlToYaml, original, &inputs).unwrap();
    let rendered = String::from_utf8_lossy(&result.bytes);
    assert!(rendered.contains("!xml/invalid"), "{rendered}");
    assert!(rendered.contains(&format!("[{name}] Запад")), "{rendered}");
    assert!(validate_file(patterned, &result.bytes, &inputs).is_empty());
    assert!(!validate_file(patterned, format!("Pair: \"[{name}] Запад\"").as_bytes(), &inputs).is_empty());
    verify_candidate(patterned, original, &result.bytes, &inputs).unwrap();
    }
    {
        let entry=entry_id("test.nested-defaults").unwrap();
        let inputs=PreparedInputs::default();
        for (xml, expected) in [
            ("<Root/>", ""),
            ("<Root><Settings><Description>body</Description></Settings></Root>", "Settings:\n  Описание: body\n  Server: !xml/raw\n    $xml: null"),
            ("<Root><Settings><Server>false</Server><Description>body</Description></Settings></Root>", "Settings:\n  Описание: body"),
        ] {
            let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
            assert_eq!(String::from_utf8_lossy(&result.bytes),expected);
            verify_candidate(entry,xml.as_bytes(),&result.bytes,&inputs).unwrap();
        }
        let invalid="Settings: {Описание: wrong}";
        let issues=validate_file(entry,invalid.as_bytes(),&inputs);
        assert_eq!(issues.len(),1,"{issues:?}");
        assert_eq!(issues[0].path,vec!["Settings","Описание"]);
        let xml=b"<Root><Settings><Server>false</Server><Description>wrong</Description></Settings></Root>";
        let converted=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
        assert!(String::from_utf8_lossy(&converted.bytes).contains("!xml/invalid"));
        assert!(validate_file(entry,&converted.bytes,&inputs).is_empty());
        verify_candidate(entry,xml,&converted.bytes,&inputs).unwrap();
        let restored=convert_file(entry,Direction::YamlToXml,"Settings: {Описание: body}".as_bytes(),&inputs).unwrap();
        assert!(String::from_utf8_lossy(&restored.bytes).contains("<Server>false</Server>"));
    }
    {
        let entry=entry_id("test.nested-notices").unwrap();
        let inputs=PreparedInputs::default();
        assert!(validate_file(entry,b"",&inputs).is_empty());
        let absent=convert_file(entry,Direction::XmlToYaml,b"<Root/>",&inputs).unwrap();
        assert!(absent.diagnostics.is_empty());
        let yaml="Settings: {Описание: body}";
        let issues=validate_file(entry,yaml.as_bytes(),&inputs);
        assert_eq!(issues.len(),1,"{issues:?}");
        assert_eq!(issues[0].path,vec!["Settings","Описание"]);
        assert_eq!(issues[0].severity,Severity::Warning);
        let xml=b"<Root><Settings><Server>false</Server><Description>body</Description></Settings></Root>";
        let converted=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
        assert_eq!(converted.diagnostics.len(),1);
        assert_eq!(converted.diagnostics[0].path,vec!["Settings","Описание"]);
        verify_candidate(entry,xml,&converted.bytes,&inputs).unwrap();
    }
    macro_rules! shared_nested_xml {
        ($entry:expr,$read:ident,$prepare:ident,$namespaces:ident,$write:ident,$element:literal,$qname:expr,$source:expr) => {{
            let inputs=PreparedInputs::default();
            let original=$source;
            let converted=convert_file(entry_id($entry).unwrap(),Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
            let value=$read(&converted.bytes,&inputs.view()).unwrap();
            let prepared=$prepare(&value,&inputs.view()).unwrap();
            let mut namespaces=Vec::new();$namespaces(&value,&prepared,&mut namespaces);
            let mut writer=core::xml::Writer::new(&namespaces);
            writer.field(&[("","Root"),("","Before")],"kept");
            $write(&value,&prepared,&inputs.view(),&mut writer).unwrap();
            writer.field(&[("","Root"),("","After")],"kept");
            let expected=original.replacen(concat!("<",$element),concat!("<Before>kept</Before><",$element),1).replace("</Root>","<After>kept</After></Root>");
            core::proof::verify_with_qnames(expected.as_bytes(),&writer.finish(),|path|path.last().is_some_and(|name|matches!(name.local.as_str(),"Before"|"After"|"Server"|"Description")),|_,_|false,|path|$qname && path.last().is_some_and(|name|name.local==$element)).unwrap();
        }};
    }
    for extra in ["", " extra='kept'"] {
        shared_nested_xml!("test.qualified",read_yaml_QNAME_ID,prepare_xml_QNAME_ID,namespaces_xml_QNAME_ID,write_xml_into_QNAME_ID,"Type",true,format!("<Root xmlns:q='urn:value'><Type{extra}>q:Atom</Type></Root>"));
        shared_nested_xml!("test.nested-scalars",read_yaml_NESTED_ID,prepare_xml_NESTED_ID,namespaces_xml_NESTED_ID,write_xml_into_NESTED_ID,"Settings",false,format!("<Root><Settings{extra}><Server>true</Server><Description>body</Description></Settings></Root>"));
        shared_nested_xml!("test.nested-header",read_yaml_HEADER_ID,prepare_xml_HEADER_ID,namespaces_xml_HEADER_ID,write_xml_into_HEADER_ID,"Settings",false,format!("<Root><Settings mode='normal' uuid='body'{extra}><Server>true</Server></Settings></Root>"));
    }
    {
        let source=b"<Root xmlns:p='urn:outer'><Type xmlns:p='urn:inner'>p:Atom</Type></Root>";
        let inputs=PreparedInputs::default();let mut reads=0;
        let value=read_xml_events_QNAME_ID(source,&inputs.view(),core::xml::ScopedEvents(|consume:&mut core::xml::ScopedConsumer<'_>| {
            use crate::core::xml::ScopedSource;
            reads+=1;
            core::xml::DocumentSource(source).visit_scoped(|path,token,scope|consume(path,token,scope))
        })).unwrap();
        assert_eq!(reads,1);
        assert_eq!(write_yaml_QNAME_ID(&value,&inputs.view()).unwrap(),b"Qualified:\n  Namespace: urn:inner\n  Name: Atom");
    }
    let qualified = entry_id("test.qualified").unwrap();
    let inputs = PreparedInputs::default();
    let original = br#"<Root xmlns:q="urn:independent"><Type>q:Atom</Type></Root>"#;
    let result = convert_file(qualified, Direction::XmlToYaml, original, &inputs).unwrap();
    assert_eq!(result.bytes, b"Qualified:\n  Namespace: urn:independent\n  Name: Atom");
    verify_candidate(qualified, original, &result.bytes, &inputs).unwrap();
    for (source,valid) in [
        ("Qualified: {Namespace: urn:independent, Name: Atom}",true),
        ("Type: !xml/raw\n  $xml: unknown:Atom",true),
        ("Type: !xml/raw\n  $xml:\n    '#qname': [urn:independent, Atom]\n    '#text': invalid",false),
    ] {
        let writes = core::xml::writer_count();
        assert_eq!(validate_file(qualified,source.as_bytes(),&inputs).is_empty(),valid);
        assert_eq!(core::xml::writer_count(),writes,"QName validation must not write XML");
    }
    let typed = entry_id("test.typed-owner").unwrap();
    let input = br#"<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><Amount xsi:type="xs:decimal">9007199254740993</Amount></Root>"#;
    let converted = convert_file(typed, Direction::XmlToYaml, input, &PreparedInputs::default()).unwrap();
    assert_eq!(converted.bytes, "Сумма: 9007199254740993".as_bytes());
    verify_candidate(typed,input,&converted.bytes,&PreparedInputs::default()).unwrap();
    for original in [
        String::from_utf8(input.to_vec()).unwrap().replace("9007199254740993", "1e3"),
        String::from_utf8(input.to_vec()).unwrap().replace("xsi:type=\"xs:decimal\"", "xsi:type=\"xs:integer\""),
        String::from_utf8(input.to_vec()).unwrap().replace(" xsi:type=\"xs:decimal\"", ""),
    ] {
        let converted=convert_file(typed,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        assert!(String::from_utf8_lossy(&converted.bytes).contains("!xml/raw"));
        verify_candidate(typed,original.as_bytes(),&converted.bytes,&PreparedInputs::default()).unwrap();
    }

    let named=entry_id("test.name-owner").unwrap();
    for (name,invalid) in [("ИмяЁ_123",false),("_A1",false),("1Имя",true),("Имя-с-дефисом",true),("Name\n",true),("",true)] {
        let original=format!("<Root><Amount>{name}</Amount></Root>");
        let converted=convert_file(named,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        assert_eq!(String::from_utf8_lossy(&converted.bytes).contains("!xml/invalid"),invalid);
        assert!(validate_file(named,&converted.bytes,&PreparedInputs::default()).is_empty());
        verify_candidate(named,original.as_bytes(),&converted.bytes,&PreparedInputs::default()).unwrap();
    }
    let calendar=entry_id("test.calendar-owner").unwrap();
    for (text,yaml) in [("2026-09-10T00:00:00","Сумма: 10.09.2026"),("2026-09-10T12:13:00","Сумма: 10.09.2026 12:13")] {
        let original=format!("<Root><Amount>{text}</Amount></Root>");
        let converted=convert_file(calendar,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        assert_eq!(converted.bytes,yaml.as_bytes());
        verify_candidate(calendar,original.as_bytes(),&converted.bytes,&PreparedInputs::default()).unwrap();
    }
    for text in ["2026-09-10T12:13:14+03:00","2026-09-10T12:13:00Z","2026-02-30T00:00:00"] {
        let original=format!("<Root><Amount>{text}</Amount></Root>");
        let converted=convert_file(calendar,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        let yaml=String::from_utf8_lossy(&converted.bytes);
        assert!(yaml.contains("!xml/raw"));
        if text.contains("12:13") {assert!(yaml.contains("10.09.2026 12:13"),"{yaml}");}
        verify_candidate(calendar,original.as_bytes(),&converted.bytes,&PreparedInputs::default()).unwrap();
    }
    let number_default=entry_id("test.default-number").unwrap();
    let zero=b"<Root><Amount>0</Amount></Root>";
    assert!(convert_file(number_default,Direction::XmlToYaml,zero,&PreparedInputs::default()).unwrap().bytes.is_empty());
    verify_candidate(number_default,zero,b"",&PreparedInputs::default()).unwrap();
    assert!(!validate_file(number_default,"Сумма: 0".as_bytes(),&PreparedInputs::default()).is_empty());
    let defaulted=entry_id("test.default-owner").unwrap();
    let normal=b"<Root><Server>false</Server><Description>text</Description></Root>";
    let converted=convert_file(defaulted,Direction::XmlToYaml,normal,&PreparedInputs::default()).unwrap();
    assert_eq!(converted.bytes,"Описание: text".as_bytes());
    verify_candidate(defaulted,normal,&converted.bytes,&PreparedInputs::default()).unwrap();
    for original in ["<Root><Description>text</Description></Root>","<Root><Server/><Description>text</Description></Root>","<Root><Server>wrong</Server><Description>text</Description></Root>"] {
        let converted=convert_file(defaulted,Direction::XmlToYaml,original.as_bytes(),&PreparedInputs::default()).unwrap();
        assert!(String::from_utf8_lossy(&converted.bytes).contains("!xml/raw"));
        verify_candidate(defaulted,original.as_bytes(),&converted.bytes,&PreparedInputs::default()).unwrap();
    }
    let warning = entry_id("test.warning-bound").unwrap();
    let warning_yaml = "ТипКода: Число\nДлинаКода: 51";
    let warnings = validate_file(warning, warning_yaml.as_bytes(), &PreparedInputs::default());
    assert_eq!(warnings.len(), 2);
    assert!(warnings.iter().all(|warning| warning.severity == core::Severity::Warning));
    assert_eq!(convert_file(warning, Direction::YamlToXml, warning_yaml.as_bytes(), &PreparedInputs::default()).unwrap().diagnostics, warnings);
    let bounded = entry_id("test.numeric-bound").unwrap();
    for (kind, xml_kind, length, errors) in [("Число", "Number", "38", 0), ("Число", "Number", "39", 1), ("Строка", "String", "50", 0), ("Строка", "String", "51", 1), ("Строка", "String", "-1", 1), ("Число", "Number", "0", 0), ("Число", "Number", "51", 2), ("Число", "Number", "38.000000000000000000000001", 1)] {
        let yaml = format!("ТипКода: {kind}\nДлинаКода: {length}");
        let xml = format!("\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Root>\n\t<CodeType>{xml_kind}</CodeType>\n\t<CodeLength>{length}</CodeLength>\n</Root>");
        let inputs = PreparedInputs::default();
        let writes = core::xml::writer_count();
        let diagnostics = validate_file(bounded, yaml.as_bytes(), &inputs);
        assert_eq!(core::xml::writer_count(), writes, "validation must not write XML");
        assert_eq!(diagnostics.len(), errors, "{yaml}");
        if errors == 0 {
            assert_eq!(convert_file(bounded, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap().bytes, xml.as_bytes());
            assert_eq!(convert_file(bounded, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap().bytes, yaml.as_bytes());
        } else {
            assert!(diagnostics.iter().all(|error| error.path == ["ДлинаКода"]));
            assert_eq!(convert_file(bounded, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap_err(), diagnostics);
            assert!(diagnostics.iter().all(|error| (error.line, error.column) == (2, 12)));
            let annotated = convert_file(bounded, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
            let expected = format!("ТипКода: {kind}\nДлинаКода: !xml/invalid {length}");
            assert_eq!(annotated.bytes,expected.as_bytes());
            assert!(validate_file(bounded,&annotated.bytes,&inputs).is_empty());
            verify_candidate(bounded,xml.as_bytes(),&annotated.bytes,&inputs).unwrap();
        }
    }
    assert_eq!(validate_file(bounded, "ДлинаКода: 38".as_bytes(), &PreparedInputs::default())[0].code.as_deref(), Some("value.missing"));
    let decimal_entry = entry_id("test.decimal-owner").unwrap();
    for literal in ["9007199254740993", "0.12345678901234567890123456789012345678", "1e+1000000"] {
        let xml = format!("\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Root>\n\t<Amount>{literal}</Amount>\n</Root>");
        let yaml = format!("Сумма: {literal}");
        let inputs = PreparedInputs::default();
        assert_eq!(convert_file(decimal_entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap().bytes, yaml.as_bytes());
        assert_eq!(convert_file(decimal_entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap().bytes, xml.as_bytes());
        assert!(validate_file(decimal_entry, yaml.as_bytes(), &inputs).is_empty());
    }
    for yaml in ["Сумма: \"42\"", "Сумма: .nan", "Сумма: 0x10", "Сумма: null"] {
        assert!(!validate_file(decimal_entry, yaml.as_bytes(), &PreparedInputs::default()).is_empty());
    }
    let enumeration = entry_id("test.enum-owner").unwrap();
    for (xml_value, yaml_value) in [("Number", "Число"), ("String", "Строка"), ("Auto", "Авто")] {
        let xml = format!("\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Root>\n\t<CodeType>{xml_value}</CodeType>\n</Root>");
        let yaml = format!("ТипКода: {yaml_value}");
        let inputs = PreparedInputs::default();
        assert_eq!(convert_file(enumeration, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap().bytes, yaml.as_bytes());
        assert_eq!(convert_file(enumeration, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap().bytes, xml.as_bytes());
        assert!(validate_file(enumeration, yaml.as_bytes(), &inputs).is_empty());
    }
    let errors = validate_file(enumeration, "ТипКода: Неизвестно".as_bytes(), &PreparedInputs::default());
    assert_eq!(errors[0].path, ["ТипКода"]);
    let required = entry_id("test.required-owner").unwrap();
    assert!(!validate_file(required,"Описание: x".as_bytes(),&PreparedInputs::default()).is_empty());
    for xml in ["<Root><Server>false</Server><Description>x</Description></Root>","<Root><Description>x</Description></Root>"] {
        let converted=convert_file(required,Direction::XmlToYaml,xml.as_bytes(),&PreparedInputs::default()).unwrap();
        assert_eq!(String::from_utf8_lossy(&converted.bytes).contains("!xml/raw"),!xml.contains("<Server>"));
        verify_candidate(required,xml.as_bytes(),&converted.bytes,&PreparedInputs::default()).unwrap();
    }
    let optional = entry_id("test.optional-owner").unwrap();
    for (xml, yaml) in [
        ("<Root><Description>x</Description></Root>", "Описание: x"),
        ("<Root><Server>false</Server><Description>x</Description></Root>", "Сервер: Ложь\nОписание: x"),
    ] {
        let result = convert_file(optional, Direction::XmlToYaml, xml.as_bytes(), &PreparedInputs::default()).unwrap();
        assert_eq!(result.bytes, yaml.as_bytes());
        assert!(validate_file(optional, yaml.as_bytes(), &PreparedInputs::default()).is_empty());
        verify_candidate(optional, xml.as_bytes(), yaml.as_bytes(), &PreparedInputs::default()).unwrap();
    }
    let empty = b"<Root><Server/><Description>x</Description></Root>";
    let annotated = convert_file(optional, Direction::XmlToYaml, empty, &PreparedInputs::default()).unwrap();
    verify_candidate(optional, empty, &annotated.bytes, &PreparedInputs::default()).unwrap();
    let entry = entry_id("test.scalar-owner").unwrap();
    let field_source = DECLARATION_FIELDS.iter().find(|field| field.entry == entry.0 && field.name == "server").unwrap();
    assert_eq!((field_source.value.file, field_source.value.line), ("owner.yaml", 8));
    assert_eq!((field_source.xml.file, field_source.xml.line), ("owner.yaml", 16));
    assert_eq!((field_source.yaml.file, field_source.yaml.line), ("owner.yaml", 21));
    let inputs = PreparedInputs::default();
    let xml = "\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Root>\n\t<Server>true</Server>\n\t<Description>  A &amp; B  </Description>\n</Root>";
    let yaml = "Сервер: LITERAL\nОписание: \"  A & B  \"";
    let mut first=XmlReadSCALAR_ID::new();
    let mut second=XmlReadSCALAR_ID::new();
    core::xml::visit(xml.as_bytes(),|path,token|first.consume(path,&token)).unwrap();
    let other=xml.replace("A &amp; B","other");
    core::xml::visit(other.as_bytes(),|path,token|second.consume(path,&token)).unwrap();
    let other_value=finish_xml_SCALAR_ID(second,other.as_bytes(),&inputs.view()).unwrap();
    assert_eq!(write_yaml_SCALAR_ID(&other_value,&inputs.view()).unwrap(),yaml.replace("A & B","other").as_bytes());
    let first_value=finish_xml_SCALAR_ID(first,xml.as_bytes(),&inputs.view()).unwrap();
    assert_eq!(write_yaml_SCALAR_ID(&first_value,&inputs.view()).unwrap(),yaml.as_bytes());
    let repeated=b"<Root><Server>wrong-first</Server><Description>x</Description><Server>wrong-second</Server><Description>y</Description></Root>";
    let mut states=[XmlReadSCALAR_ID::new(),XmlReadSCALAR_ID::new()];
    let (mut current,mut started)=(0,0);
    core::xml::visit(repeated,|path,token| {
        if matches!(token,core::xml::Token::Start(_)) && path.len()==2 && path[1].local=="Server" {current=started;started+=1;}
        states[current].consume(path,&token)
    }).unwrap();
    for (state,expected) in states.into_iter().zip([
        b"<Root><Server>wrong-first</Server><Description>x</Description></Root>".as_slice(),
        b"<Root><Server>wrong-second</Server><Description>y</Description></Root>".as_slice(),
    ]) {
        let value=finish_xml_SCALAR_ID(state,repeated,&inputs.view()).unwrap();
        let restored=write_xml_SCALAR_ID(&value,&inputs.view()).unwrap();
        core::proof::verify(expected,&restored,|_|false).unwrap();
    }
    let encoded = convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
    assert_eq!(encoded.bytes, yaml.as_bytes());
    assert!(encoded.diagnostics.is_empty());
    let mut mapping=core::yaml::ScalarMapping::default();
    let mut yaml_fields=YamlFieldsSCALAR_ID::new(core::raw::Fields::default()).unwrap();
    core::yaml::visit_nodes(yaml.as_bytes(),|node,position| {
        if let Some(entry)=mapping.consume(node,position)? {yaml_fields.consume(entry.key,entry.value,entry.tag)?;}
        Ok(())
    }).unwrap();
    mapping.finish().unwrap();
    let yaml_value=finish_yaml_SCALAR_ID(yaml_fields,yaml.as_bytes(),&inputs.view()).unwrap();
    assert_eq!(write_xml_SCALAR_ID(&yaml_value,&inputs.view()).unwrap(),xml.as_bytes());
    let decoded = convert_file(entry, Direction::YamlToXml, yaml.as_bytes(), &inputs).unwrap();
    assert_eq!(decoded.bytes, xml.as_bytes());
    assert!(validate_file(entry, yaml.as_bytes(), &inputs).is_empty());
    assert!(verify_candidate(entry, xml.as_bytes(), yaml.replace("A & B", "Changed").as_bytes(), &inputs).is_err());
    for text in ["\u{85}", "\u{2028}", "\u{2029}", "a\u{85}b", "a\u{2028}b", "a\u{2029}b", "\r", "true", "42", "a: b", "a # b"] {
        let escaped = text.replace('\r', "&#13;");
        let original = format!("<Root><Server>true</Server><Description>{escaped}</Description></Root>");
        let result = convert_file(entry, Direction::XmlToYaml, original.as_bytes(), &inputs).unwrap();
        assert!(verify_candidate(entry, original.as_bytes(), &result.bytes, &inputs).is_ok(), "{text:?}");
    }
    let invalid = "Сервер: wrong\nОписание: x";
    let errors = validate_file(entry, invalid.as_bytes(), &inputs);
    assert_eq!(errors[0].path, ["Сервер"]);
    assert_eq!((errors[0].line, errors[0].column), (1, 9));
    assert_eq!(errors, convert_file(entry, Direction::YamlToXml, invalid.as_bytes(), &inputs).unwrap_err());
    let duplicate = validate_file(entry, "Сервер: LITERAL\nСервер: Ложь\nОписание: x".as_bytes(), &inputs);
    assert_eq!(duplicate[0].path, ["Сервер"]);
    assert_eq!(duplicate[0].line, 2);
    let reordered = "<Root><Description>  A &amp; B  </Description><Server>true</Server></Root>";
    assert!(convert_file(entry, Direction::XmlToYaml, reordered.as_bytes(), &inputs).is_err());
    let cdata = "<Root>\n <Server>true</Server>\n <Description><![CDATA[  A & B  ]]></Description>\n</Root>";
    assert_eq!(convert_file(entry, Direction::XmlToYaml, cdata.as_bytes(), &inputs).unwrap().bytes, yaml.as_bytes());
    for bad in ["<Root><Server>true</Server><Description>\0</Description></Root>", "<Root>\u{a0}<Server>true</Server><Description>x</Description></Root>", "<?xml version=\"1.1\"?><Root><Server>true</Server><Description>x</Description></Root>"] {
        assert!(convert_file(entry, Direction::XmlToYaml, bad.as_bytes(), &inputs).is_err(), "Invalid XML content was accepted");
    }
    for bad in ["<Root><Server>true</Server><Unknown/></Root>", "<Root><Server>true</Server><Server>false</Server><Description>x</Description></Root>"] {
        assert!(convert_file(entry, Direction::XmlToYaml, bad.as_bytes(), &inputs).is_err(), "{bad}");
    }
    for bad in ["Сервер: LITERAL\nСервер: Ложь\nОписание: x", "Сервер: wrong\nОписание: x", "Сервер: LITERAL\nЛишнее: x", "Сервер: LITERAL\nОписание: !xml/raw x"] {
        assert!(!validate_file(entry, bad.as_bytes(), &inputs).is_empty(), "{bad}");
    }
}
"###.replace("DEEP_ID", &program.entries.iter().find(|entry|entry.name=="test.deep-items").unwrap().id.to_string()).replace("NESTED_STREAM_ID", &program.entries.iter().find(|entry|entry.name=="test.nested-stream").unwrap().id.to_string()).replace("OWNER_STREAM_ID", &program.entries.iter().find(|entry|entry.name=="test.typed-attributes").unwrap().id.to_string()).replace("HEADER_ID", &program.entries.iter().find(|entry|entry.name=="test.nested-header").unwrap().id.to_string()).replace("QNAME_ID", &program.entries.iter().find(|entry|entry.name=="test.qualified").unwrap().id.to_string()).replace("NESTED_ID", &program.entries.iter().find(|entry|entry.name=="test.nested-scalars").unwrap().id.to_string()).replace("SCALAR_ID", &program.entries.iter().find(|entry| entry.name == "test.scalar-owner").unwrap().id.to_string()).replace("ROWS_ID", &program.entries.iter().find(|entry| entry.name == "test.fact-rows").unwrap().id.to_string()).replace("LITERAL", literal).replace("SLOT_CODEC", &format!("E{}F0", program.entries.iter().find(|entry| entry.name == "test.text-pattern-coded").unwrap().id));
        fs::write(root.join("src/main.rs"), main).unwrap();
        let output = Command::new(env!("CARGO"))
            .args(["run", "--offline", "--quiet"])
            .current_dir(&root)
            .env("CARGO_TARGET_DIR", root.join("target"))
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "compiled conversion failed in {}:\n{}",
            root.display(),
            String::from_utf8_lossy(&output.stderr)
        );
    }
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn generation_rejects_records_without_a_single_xml_document_root() {
    let source = include_str!("../../../declarations/probes/scalars.yaml");
    let boolean = include_str!("../../../declarations/common/boolean.yaml");
    let text = include_str!("../../../declarations/common/string.yaml");
    for owner in [
        source.replace("Root, Description", "Other, Description"),
        source.replace("Root, Server", "Server"),
        source.replace(
            "path: [Root, Description]",
            "path: [Root, Header], attribute: uuid",
        ),
    ] {
        let modules = [
            ("owner.yaml", owner.as_str()),
            ("boolean.yaml", boolean),
            ("string.yaml", text),
        ]
        .map(|(path, source)| {
            parse(SourceFile {
                path,
                bytes: source.as_bytes(),
            })
            .unwrap()
        });
        let program = link(&modules).unwrap();
        assert!(
            generate(&program).is_err(),
            "Unsupported record layout must not produce a lossy writer"
        );
    }
}
