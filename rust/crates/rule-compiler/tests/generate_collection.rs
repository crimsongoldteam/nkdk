use nkdk_rule_compiler::{SourceFile, compile, generate, link, parse_many};
use std::{fs, process::Command};
#[test]
fn generated_keyed_mapping_preserves_duplicate_occurrences_and_proves_the_candidate() {
    let common = b"format: nkdk-declarations/1\nkind: value\nid: common.dictionary\nvalue:\n  kind: sequence\n  item:\n    kind: record\n    fields:\n      - {name: key, type: {kind: scalar, scalar: text}}\n      - {name: text, type: {kind: scalar, scalar: text}}\nrepresentations:\n  xml:\n    kind: element-sequence\n    path: [item]\n    item:\n      kind: record\n      fields:\n        - {field: key, path: [key]}\n        - {field: text, path: [text]}\n  yaml: {kind: keyed-mapping, key: key, value: text}\n";
    let owner=b"format: nkdk-declarations/1\nkind: object\nid: test.dictionary\nimports: {dictionary: common.dictionary}\nvalue:\n  kind: record\n  fields:\n    - {name: entries, type: {use: dictionary}}\nrepresentations:\n  xml:\n    kind: record\n    fields:\n      - {field: entries, path: [Root, Entries]}\n  yaml:\n    kind: mapping\n    fields:\n      - {field: entries, key: Entries}\n";
    let list_common = std::str::from_utf8(common).unwrap()
        .replace("common.dictionary", "common.record-list")
        .replace("{kind: keyed-mapping, key: key, value: text}", "{kind: sequence, item: {kind: mapping, fields: [{field: key, key: Code}, {field: text, key: Text}]}}");
    let list_owner = std::str::from_utf8(owner)
        .unwrap()
        .replace("common.dictionary", "common.record-list")
        .replace("test.dictionary", "test.record-list");
    let namespace_row = r#"format: nkdk-declarations/1
kind: value
id: common.namespace-row
imports: {qualified: common.qualified}
value: {kind: record, fields: [{name: key, type: {kind: scalar, scalar: text}}, {name: qualified, type: {use: qualified}}]}
representations:
  xml: {kind: record, fields: [{field: key, path: [Name]}, {field: qualified, path: [Value]}]}
  yaml: {kind: mapping, fields: [{field: key, key: Key}, {field: qualified, key: Qualified}]}
"#;
    let namespace_rows = r#"format: nkdk-declarations/1
kind: value
id: common.namespace-rows
imports: {row: common.namespace-row}
value: {kind: sequence, item: {use: row}}
representations:
  xml: {kind: element-sequence, path: [Item]}
  yaml: {kind: sequence}
presence:
- target: self
  xml: {missing: {denotes: {absent: true}}}
  yaml: {missing: {denotes: {absent: true}}}
"#;
    let namespace_owner = list_owner.replace("record-list", "namespace-rows");
    let dependent_owner = r#"format: nkdk-declarations/1
kind: object
id: test.dependent-properties
imports: {rows: common.record-list, number: common.exact-decimal}
value:
  kind: record
  fields:
  - {name: mode, type: {kind: scalar, scalar: text}}
  - {name: count, type: {use: number}}
  - {name: entries, type: {use: rows}}
representations:
  xml: {kind: record, fields: [{field: mode, path: [Root, Mode]}, {field: count, path: [Root, Count]}, {field: entries, path: [Root, Entries]}]}
  yaml: {kind: mapping, fields: [{field: mode, key: Mode}, {field: count, key: Count}, {field: entries, key: Entries}]}
constraints:
- id: limited-count
  appliesTo: [xml-import, yaml-validation]
  when: {eq: [{field: mode}, {literal: limited}]}
  assert: {lte: [{field: count}, {literal: 3}]}
  diagnostic: {code: count.limit, severity: error, at: {field: count}, message: Count exceeds limit}
"#;
    let lower_code = r#"format: nkdk-declarations/1
kind: value
id: common.lower-code
value: {kind: scalar, scalar: text, pattern: '[a-z]+'}
representations:
  xml: {kind: text}
  yaml: {kind: scalar, scalar: text}
"#;
    let patterned_item = r#"format: nkdk-declarations/1
kind: value
id: common.patterned-item
imports: {code: common.lower-code}
value: {kind: record, fields: [{name: code, type: {use: code}}]}
representations:
  xml: {kind: text-pattern, parts: [{literal: 'Entry::'}, {field: code}]}
  yaml: {kind: text-pattern, parts: [{field: code}]}
"#;
    let patterned_list = r#"format: nkdk-declarations/1
kind: value
id: common.patterned-list
imports: {item: common.patterned-item}
value: {kind: sequence, item: {use: item}}
representations:
  xml: {kind: element-sequence, path: [Item], item: {kind: text}}
  yaml: {kind: sequence, item: {kind: scalar, scalar: text}}
constraints:
- id: available
  appliesTo: [xml-import, yaml-validation]
  assert: {each: {in: {self: true}, as: item, where: {not: {eq: [{get: {of: {var: item}, field: code}}, {literal: forbidden}]}}}}
  diagnostic: {code: item.unavailable, severity: error, at: {self: true}, message: Unavailable item}
presence:
- target: self
  xml: {missing: {denotes: {absent: true}}}
  yaml: {missing: {denotes: {absent: true}}}
"#;
    let pattern_list_owner = list_owner.replace("record-list", "patterned-list");
    let singleton_list = patterned_list
        .replace("common.patterned-list", "common.singleton-list")
        .replace(
            "yaml: {kind: sequence,",
            "yaml: {kind: sequence, singleton: scalar,",
        );
    let singleton_owner = pattern_list_owner.replace("patterned-list", "singleton-list");
    let required_patterned_list = patterned_list
        .split("presence:")
        .next()
        .unwrap()
        .replace("common.patterned-list", "common.required-patterned-list");
    let required_patterned_owner =
        pattern_list_owner.replace("patterned-list", "required-patterned-list");
    let second_item = patterned_item
        .replace("common.patterned-item", "common.second-item")
        .replace("Entry::", "Second::")
        .replace(
            "yaml: {kind: text-pattern, parts: [{field: code}]}",
            "yaml: {kind: text-pattern, parts: [{literal: 'second:'}, {field: code}]}",
        );
    let checked_item = format!(
        "{patterned_item}constraints:\n- id: allowed\n  appliesTo: [xml-import, yaml-validation]\n  assert: {{not: {{eq: [{{field: code}}, {{literal: forbidden}}]}}}}\n  diagnostic: {{code: item.unavailable, severity: error, at: {{self: true}}, message: Unavailable item}}\n"
    );
    let choice_first = checked_item
        .replace("common.patterned-item", "common.choice-first")
        .replace(
            "yaml: {kind: text-pattern, parts: [{field: code}]}",
            "yaml: {kind: text-pattern, parts: [{literal: 'first:'}, {field: code}]}",
        );
    let choice_item = r#"format: nkdk-declarations/1
kind: value
id: common.choice-item
imports: {first: common.choice-first, second: common.second-item}
value: {kind: choice, variants: [{name: first, type: {use: first}}, {name: second, type: {use: second}}]}
representations:
  xml: {kind: choice}
  yaml: {kind: choice}
"#;
    let choice_list = patterned_list
        .replace("common.patterned-list", "common.choice-list")
        .replace("common.patterned-item", "common.choice-item");
    let choice_list = format!(
        "{}presence:{}",
        choice_list.split("constraints:").next().unwrap(),
        choice_list.split("presence:").nth(1).unwrap()
    );
    let choice_owner = pattern_list_owner.replace("patterned-list", "choice-list");
    let bound_first = choice_first
        .replace("common.choice-first", "common.bound-first")
        .replace(
            "value: {kind: record",
            "inputs: {allowed: {type: {kind: scalar, scalar: text}}}\nvalue: {kind: record",
        )
        .replace(
            "{not: {eq: [{field: code}, {literal: forbidden}]}}",
            "{eq: [{field: code}, {input: allowed}]}",
        );
    let bound_choice = choice_item
        .replace("common.choice-item", "common.bound-choice-item")
        .replace("common.choice-first", "common.bound-first")
        .replace(
            "value: {kind: choice",
            "inputs: {allowed: {type: {kind: scalar, scalar: text}}}\nvalue: {kind: choice",
        )
        .replace(
            "type: {use: first}",
            "type: {use: first, bind: {allowed: {input: allowed}}}",
        );
    let bound_list = choice_list
        .replace("common.choice-list", "common.bound-choice-list")
        .replace("common.choice-item", "common.bound-choice-item")
        .replace(
            "value: {kind: sequence",
            "inputs: {allowed: {type: {kind: scalar, scalar: text}}}\nvalue: {kind: sequence",
        )
        .replace(
            "item: {use: item}",
            "item: {use: item, bind: {allowed: {input: allowed}}}",
        );
    let bound_owner = choice_owner.replace("choice-list", "bound-choice-list")
        .replace("value:\n", "inputs:\n  unused: {type: {kind: scalar, scalar: boolean}}\n  selected: {type: {kind: scalar, scalar: text}}\nvalue:\n")
        .replace("type: {use: dictionary}", "type: {use: dictionary, bind: {allowed: {input: selected}}}");
    let compact_kind = "format: nkdk-declarations/1\nkind: value\nid: common.compact-first-kind\nenum: {First: one}\n";
    let compact_other_kind = compact_kind
        .replace("first-kind", "second-kind")
        .replace("First: one", "Second: two");
    let compact_first = checked_item
        .replace("common.patterned-item", "common.compact-first")
        .replace(
            "imports: {code: common.lower-code}",
            "imports: {code: common.lower-code, tag: common.compact-first-kind}",
        )
        .replace(
            "fields: [{name: code",
            "fields: [{name: tag, type: {use: tag}}, {name: code",
        )
        .replace(
            "[{literal: 'Entry::'}, {field: code}]",
            "[{field: tag}, {literal: '.'}, {field: code}]",
        )
        .replace(
            "yaml: {kind: text-pattern, parts: [{field: code}]}",
            "yaml: {kind: text-pattern, parts: [{field: tag}, {literal: ':'}, {field: code}]}",
        );
    let compact_second = compact_first
        .split("constraints:")
        .next()
        .unwrap()
        .replace("compact-first", "compact-second");
    let compact_choice = choice_item
        .replace("common.choice-item", "common.compact-choice")
        .replace("common.choice-first", "common.compact-first")
        .replace("common.second-item", "common.compact-second");
    let compact_rows = r#"format: nkdk-declarations/1
kind: value
id: common.compact-rows
imports: {item: common.compact-choice}
value: {kind: sequence, item: {use: item}}
representations:
  xml: {kind: text-sequence, separator: '.'}
  yaml: {kind: text-sequence, separator: ':'}
"#;
    let compact_frame = r#"format: nkdk-declarations/1
kind: value
id: common.compact-frame
imports: {rows: common.compact-rows}
value: {kind: record, fields: [{name: source, type: {kind: scalar, scalar: text}}, {name: tail, type: {use: rows}}]}
representations:
  xml: {kind: text-pattern, parts: [{field: source}, {literal: '.'}, {field: tail}]}
  yaml: {kind: text-pattern, parts: [{field: source}, {literal: ':'}, {field: tail}]}
"#;
    let compact_owner = choice_owner.replace("choice-list", "compact-rows");
    let compact_frame_owner = compact_owner.replace("compact-rows", "compact-frame");
    let contextual_text = r#"format: nkdk-declarations/1
kind: value
id: common.contextual-text
inputs: {prefix: {type: {kind: scalar, scalar: text}}}
value:
  kind: record
  fields:
  - {name: prefix, type: {kind: scalar, scalar: text}}
  - {name: text, type: {kind: scalar, scalar: text}}
representations:
  xml: {kind: text-pattern, parts: [{field: prefix}, {literal: '::'}, {field: text}]}
  yaml: {kind: text-pattern, parts: [{field: text}]}
presence:
- target: {field: prefix}
  yaml: {default: {input: prefix}}
"#;
    let contextual_owner = r#"format: nkdk-declarations/1
kind: object
id: test.contextual-text
imports: {text: common.contextual-text}
inputs:
  unrelated: {type: {kind: scalar, scalar: boolean}}
  owner: {type: {kind: scalar, scalar: text}}
value: {kind: record, fields: [{name: link, type: {use: text, bind: {prefix: {input: owner}}}}]}
representations:
  xml: {kind: record, fields: [{field: link, path: [Root, Link]}]}
  yaml: {kind: mapping, fields: [{field: link, key: Link}]}
"#;
    let contextual_list = choice_list
        .replace("common.choice-list", "common.contextual-list")
        .replace("common.choice-item", "common.contextual-text")
        .replace(
            "value: {kind: sequence",
            "inputs: {prefix: {type: {kind: scalar, scalar: text}}}\nvalue: {kind: sequence",
        )
        .replace(
            "item: {use: item}",
            "item: {use: item, bind: {prefix: {input: prefix}}}",
        );
    let contextual_list_owner = choice_owner.replace("choice-list", "contextual-list")
        .replace("value:\n", "inputs:\n  unused: {type: {kind: scalar, scalar: boolean}}\n  owner: {type: {kind: scalar, scalar: text}}\nvalue:\n")
        .replace("type: {use: dictionary}", "type: {use: dictionary, bind: {prefix: {input: owner}}}");

    let short_first = contextual_text
        .replace("common.contextual-text", "common.short-first")
        .replace(
            "xml: {kind: text-pattern, parts: [",
            "xml: {kind: text-pattern, parts: [{literal: 'First::'}, ",
        )
        .replace(
            "yaml: {kind: text-pattern, parts: [",
            "yaml: {kind: text-pattern, parts: [{literal: 'first:'}, ",
        );
    let short_second = short_first
        .replace("common.short-first", "common.short-second")
        .replace("First::", "Second::")
        .replace("first:", "second:");
    let short_choice = r#"format: nkdk-declarations/1
kind: value
id: common.short-choice
imports: {first: common.short-first, second: common.short-second}
inputs: {prefix: {type: {kind: scalar, scalar: text}}}
value: {kind: choice, variants: [{name: first, type: {use: first, bind: {prefix: {input: prefix}}}}, {name: second, type: {use: second, bind: {prefix: {input: prefix}}}}]}
representations:
  xml: {kind: choice}
  yaml: {kind: choice}
"#;
    let projected_list = contextual_list
        .replace("common.contextual-list", "common.projected-list")
        .replace("common.contextual-text", "common.short-choice");
    let projected_owner = contextual_list_owner.replace("contextual-list", "projected-list");
    let projected_scalar = contextual_owner.replace("contextual-text", "short-choice");
    let cell_forms = r#"format: nkdk-declarations/1
kind: catalog
declarations:
- kind: value
  id: common.cell-short
  imports: {name: common.lower-code}
  inputs: {prefix: {type: {kind: scalar, scalar: text}}}
  value: {kind: record, fields: [{name: owner, type: {kind: scalar, scalar: text}}, {name: name, type: {use: name}}]}
  representations:
    xml: {kind: text-pattern, separator: '.', parts: [{literal: Local}, {field: owner}, {field: name}]}
    yaml: {kind: text-pattern, separator: '/', parts: [{field: name}]}
  presence: [{target: {field: owner}, yaml: {default: {input: prefix}}}]
- kind: value
  id: common.cell-full
  imports: {name: common.lower-code}
  value: {kind: record, fields: [{name: name, type: {use: name}}]}
  representations:
    xml: {kind: text-pattern, separator: '.', parts: [{literal: Full}, {field: name}]}
    yaml: {kind: text-pattern, separator: '/', parts: [{literal: full}, {field: name}]}
- kind: value
  id: common.cell-choice
  imports: {short: common.cell-short, full: common.cell-full}
  inputs: {prefix: {type: {kind: scalar, scalar: text}}}
  value: {kind: choice, variants: [{name: short, type: {use: short, bind: {prefix: {input: prefix}}}}, {name: full, type: {use: full}}]}
  representations:
    xml: {kind: choice}
    yaml: {kind: choice}
"#;
    for (from, to, code) in [
        ("separator: '.'", "separator: ''", "text_pattern_separator"),
        ("literal: Local", "literal: Lo.cal", "text_pattern_literal"),
    ] {
        let invalid = cell_forms.replace(from, to);
        let errors = parse_many(SourceFile {
            path: "invalid-cells.yaml",
            bytes: invalid.as_bytes(),
        })
        .unwrap_err();
        assert!(errors.iter().any(|error| error.code == code), "{errors:?}");
    }
    let cell_owner = contextual_owner.replace("contextual-text", "cell-choice");
    let sibling_common = list_common
        .replace("common.record-list", "common.sibling-list")
        .replace("path: [item]", "path: []")
        + "\npresence:\n- target: self\n  xml: {missing: {denotes: {absent: true}}}\n  yaml: {missing: {denotes: {absent: true}}}\n";
    let sibling_owner = r#"format: nkdk-declarations/1
kind: object
id: test.sibling-lists
imports: {rows: common.sibling-list}
value:
  kind: record
  fields:
  - {name: first, type: {use: rows}}
  - {name: second, type: {use: rows}}
representations:
  xml:
    kind: record
    fields:
    - {field: first, path: [Root, Children, First]}
    - {field: second, path: [Root, Children, Second]}
  yaml:
    kind: mapping
    fields:
    - {field: first, key: First}
    - {field: second, key: Second}
"#;
    let restored_owner = list_owner.replace("test.record-list", "test.restored-list")
        + r#"
inputs:
  name: {type: {kind: scalar, scalar: text}}
  ids: {index: test.restored-identities}
presence:
- target: {field: entries}
  xml: {missing: {denotes: {absent: true}}}
  yaml:
    default:
      sequence:
      - record:
          key: {concat: [{literal: 'Object.'}, {input: name}]}
          text: {require: {lookup: {in: {input: ids}, key: {concat: [{literal: 'Object.'}, {input: name}]}}}}
"#;
    let restored_owner = restored_owner
        .replace("    - {name: entries,", "    - {name: version, type: {kind: scalar, scalar: text}}\n    - {name: entries,")
        .replace("      - {field: entries, path:", "      - {field: version, path: [Root], attribute: version}\n      - {field: entries, path:")
        .replace("      - {field: entries, key:", "      - {field: version, key: Version}\n      - {field: entries, key:")
        .replace("presence:\n", "presence:\n- target: {field: version}\n  xml: {missing: {denotes: {absent: true}}}\n  yaml: {default: {literal: '1'}}\n");
    let tree_common = list_common.replace("common.record-list", "common.tree-list").replace(
        "    item:\n      kind: record\n      fields:\n        - {field: key, path: [key]}\n        - {field: text, path: [text]}",
        "    item:\n      kind: tree\n      children:\n      - {name: Mode, text: ready}\n      - name: Pair\n        attributes: [{name: version, value: {text: '1'}}, {name: mode, value: {text: first}, when: {eq: [{field: key}, {literal: a}]}}, {name: mode, value: {text: other}, when: {not: {eq: [{field: key}, {literal: a}]}}}]\n        children: [{name: Code, field: key}, {name: Text, field: text}]",
    );
    let tree_owner = list_owner.replace("record-list", "tree-list");
    let short_common = r#"format: nkdk-declarations/1
kind: value
id: common.short-list
value: {kind: sequence, item: {kind: scalar, scalar: text}}
representations:
  xml: {kind: element-sequence, path: [Item], item: {kind: with-attributes, attributes: [{name: flag, value: {text: fixed}}], content: {kind: text}}}
  yaml:
    kind: sequence
    item: {kind: scalar, scalar: text}
    shorthand:
    - id: pair
      representation: {kind: literal, value: Pair}
      denotes: {sequence: [{literal: a}, {literal: b}]}
constraints:
- id: known-items
  appliesTo: [xml-import, yaml-validation]
  assert: {each: {in: {self: true}, as: item, where: {or: [{eq: [{var: item}, {literal: a}]}, {eq: [{var: item}, {literal: b}]}]}}}
  diagnostic: {severity: error, at: {self: true}, message: Unknown item}
"#;
    let short_owner = list_owner.replace("record-list", "short-list")
        + "\npresence:\n- target: {field: entries}\n  xml:\n    missing: {denotes: {sequence: [{literal: a}]}}\n  yaml:\n    missing: {denotes: {sequence: [{literal: a}]}}\n    omitWhen: {eq: [{field: entries}, {sequence: [{literal: a}]}]}\n";
    let list_owner = list_owner
        + "\ncontributions:\n- index: test.restored-identities\n  forEach: {in: {field: entries}, as: row}\n  key: {get: {of: {var: row}, field: key}}\n  value: {get: {of: {var: row}, field: text}}\n";
    let common=std::str::from_utf8(common).unwrap().replace("value:\n", "inputs:\n  primary: {type: {kind: scalar, scalar: text}}\nvalue:\n").replace("  yaml: {kind: keyed-mapping, key: key, value: text}", "  yaml:\n    kind: keyed-mapping\n    key: key\n    value: text\n    shorthand:\n      - id: primary\n        representation: {kind: scalar, scalar: text, capture: text}\n        denotes:\n          sequence:\n            - record:\n                key: {input: primary}\n                text: {capture: text}");
    let common = common
        + "constraints:\n  - id: forbidden-text\n    appliesTo: [xml-import, yaml-validation]\n    forEach: {in: {self: true}, as: row}\n    assert: {not: {eq: [{get: {of: {var: row}, field: text}}, {literal: bad}]}}\n    diagnostic:\n      code: text.forbidden\n      severity: error\n      at: {occurrence: row, field: key}\n      message: {parts: [\"Forbidden: \", {get: {of: {var: row}, field: text}}]}\n";
    let common = common
        + "  - id: mapping-only\n    appliesTo: [yaml-validation]\n    forms: [keyed-mapping]\n    assert:\n      each:\n        in: {self: true}\n        as: row\n        where: {not: {eq: [{get: {of: {var: row}, field: text}}, {literal: mapping-only}]}}\n    diagnostic:\n      code: collection.mapping-only\n      severity: error\n      at: {self: true}\n      message: Mapping only\n";
    let common = common
        + "presence:\n  - target: self\n    xml:\n      missing: {denotes: {absent: true}}\n      empty: [{form: empty-element, denotes: {sequence: []}}]\n    yaml:\n      missing: {denotes: {absent: true}}\n      empty: [{form: empty-mapping, denotes: {sequence: []}}]\n";
    let owner = std::str::from_utf8(owner).unwrap().replace(
        "{use: dictionary}",
        "{use: dictionary, bind: {primary: {literal: ru}}}",
    );
    let sorted_rule = "  - id: language-order\n    appliesTo: [yaml-validation]\n    assert:\n      ordered:\n        in: {self: true}\n        as: row\n        key: {get: {of: {var: row}, field: key}}\n        unique: true\n        first: [{input: primary}]\n        comparison: utf16\n    diagnostic:\n      code: collection.order\n      severity: error\n      at: {self: true}\n      message: Invalid order\n";
    let sorted_common = common
        .replace("common.dictionary", "common.sorted-dictionary")
        .replace("presence:\n", &format!("{sorted_rule}presence:\n"));
    let sorted_owner = owner
        .replace("test.dictionary", "test.sorted-dictionary")
        .replace("common.dictionary", "common.sorted-dictionary");
    let derived_common = common
        .split_once("presence:\n")
        .unwrap()
        .0
        .replace("common.dictionary", "common.derived-dictionary")
        + "presence:\n  - target: self\n    xml:\n      missing: {denotes: {absent: true}}\n      empty: [{form: empty-element, denotes: {sequence: []}}]\n    yaml:\n      missing:\n        denotes:\n          sequence:\n            - record: {key: {input: primary}, text: {literal: Default}}\n      empty:\n        - {form: empty-mapping, denotes: {absent: true}}\n        - {form: empty-string, denotes: {sequence: []}}\n      omitWhen:\n        eq:\n          - {self: true}\n          - sequence:\n              - record: {key: {input: primary}, text: {literal: Default}}\n";
    let derived_owner = owner
        .replace("test.dictionary", "test.derived-dictionary")
        .replace("common.dictionary", "common.derived-dictionary");
    let normalized_common = common.replace("common.dictionary", "common.normalized-dictionary")
        + "normalization:\n  when: {literal: true}\n  from: empty-sequence\n  denotes:\n    sequence:\n      - record: {key: {input: primary}, text: {literal: \"\"}}\n";
    let normalized_owner = owner
        .replace("test.dictionary", "test.normalized-dictionary")
        .replace("common.dictionary", "common.normalized-dictionary");
    let canonical_common=common.replace("common.dictionary", "common.canonical-dictionary").replace("    yaml:\n", "      canonical:\n        - when:\n            each:\n              in: {self: true}\n              as: row\n              where: {eq: [{get: {of: {var: row}, field: text}}, {literal: \"\"}]}\n          form: missing\n        - form: ordinary\n    yaml:\n");
    let canonical_owner = owner
        .replace("test.dictionary", "test.canonical-dictionary")
        .replace("common.dictionary", "common.canonical-dictionary");
    let patterned_common=common.replace("common.dictionary", "common.patterned-dictionary").replace("    shorthand:\n", "    shorthand:\n      - id: default-and-rest\n        representation: {kind: keyed-mapping, capture: rest, absentKeys: [{input: primary}]}\n        denotes:\n          sequence-pattern:\n            prefix: [{record: {key: {input: primary}, text: {literal: Default}}}]\n            rest: {capture: rest}\n      - id: absent-primary\n        representation:\n          kind: keyed-mapping\n          capture: rest\n          prefix: [{record: {key: {input: primary}, text: {literal: \"\"}}}]\n          absentKeys: [{input: primary}]\n        denotes: {capture: rest}\n        when: {exists: {in: {capture: rest}, as: row, where: {literal: true}}}\n");
    let patterned_owner = owner
        .replace("test.dictionary", "test.patterned-dictionary")
        .replace("common.dictionary", "common.patterned-dictionary");
    let words = include_str!("../../../../tests/declaration-corpus/valid/name-text-transform.yaml");
    let words = words
        .split_once("types:\n")
        .unwrap()
        .1
        .split_once("\nvalue:\n")
        .unwrap()
        .0;
    let named_common=patterned_common.replace("common.patterned-dictionary", "common.named-dictionary").replace("value:\n  kind: sequence", &format!("  ownerName: {{type: {{kind: scalar, scalar: text}}}}\ntypes:\n{words}\nvalue:\n  kind: sequence")).replace("text: {literal: Default}", "text: {if: {isReady: {input: ownerName}}, then: {transform: {local: name-words, value: {input: ownerName}}}, else: {absent: true}}");
    let named_owner = patterned_owner
        .replace("test.patterned-dictionary", "test.named-dictionary")
        .replace("common.patterned-dictionary", "common.named-dictionary")
        .replace(
            "value:\n",
            "inputs:\n  ownerName: {type: {kind: scalar, scalar: text}}\nvalue:\n",
        )
        .replace(
            "bind: {primary: {literal: ru}}",
            "bind: {primary: {literal: ru}, ownerName: {input: ownerName}}",
        );
    let (head, rest) = common.split_once("  xml:\n").unwrap();
    let (xml, tail) = rest.split_once("  yaml:").unwrap();
    let xml = xml
        .lines()
        .map(|line| format!("  {line}\n"))
        .collect::<String>();
    let typed_common=format!("{head}  xml:\n    kind: with-attributes\n    attributes:\n      - {{name: x:type, value: {{qname: v:Kind}}, when: {{parameter: typed}}}}\n    content:\n{xml}  yaml:{tail}").replace("common.dictionary", "common.typed-dictionary").replace("inputs:\n", "namespaces: {x: 'urn:attr', v: 'urn:value'}\nparameters:\n  typed: {type: {kind: scalar, scalar: boolean}, default: true}\ninputs:\n");
    let typed_owner = owner
        .replace("test.dictionary", "test.typed-dictionary")
        .replace("common.dictionary", "common.typed-dictionary");
    let untyped_owner = typed_owner
        .replace("test.typed-dictionary", "test.untyped-dictionary")
        .replace(
            "{use: dictionary, bind:",
            "{use: dictionary, with: {typed: false}, bind:",
        );
    let nil_common=common.replace("common.dictionary", "common.nil-dictionary").replace("empty: [{form: empty-element, denotes: {sequence: []}}]", "empty:\n        - {form: empty-element, denotes: {sequence: []}}\n        - {form: nil, denotes: {absent: true}}\n      canonical:\n        - {when: {not: {present: {self: true}}}, form: nil}\n        - {form: ordinary}");
    let nil_owner = owner
        .replace("test.dictionary", "test.nil-dictionary")
        .replace("common.dictionary", "common.nil-dictionary");
    let default_container_owner = format!(
        "{}\npresence:\n- target: {{field: entries}}\n  xml:\n    canonical: [{{when: {{not: {{present: {{field: entries}}}}}}, form: empty-element}}]\n",
        owner.replace("test.dictionary", "test.default-container")
    );
    let integrated = include_bytes!("../../../declarations/common/i8n-text.yaml");
    let integrated_owner = owner
        .replace("test.dictionary", "test.integrated-i8n")
        .replace("common.dictionary", "common.i8n-text")
        .replace("bind: {primary: {literal: ru}}", "bind: {defaultLanguage: {literal: ru}, registeredLanguages: {input: languages}, ownerName: {input: name}}")
        .replace("value:\n", "inputs:\n  languages: {type: {kind: sequence, item: {kind: scalar, scalar: text}}}\n  name: {type: {kind: scalar, scalar: text}}\nvalue:\n");
    let profiles: Vec<_> = (0..16).map(|profile| integrated_owner
        .replace("test.integrated-i8n", &format!("test.profile-{profile}"))
        .replace("{use: dictionary, bind:", &format!("{{use: dictionary, with: {{preserveEmptyXML: {}, excludeIfEqualNameYAML: {}, skipEmptyToXML: {}, typedXML: {}}}, bind:", profile & 1 != 0, profile & 2 != 0, profile & 4 != 0, profile & 8 != 0))).collect();
    let corpus_profiles: Vec<_> = profiles
        .iter()
        .map(|source| {
            source
                .replace("test.profile-", "test.corpus-")
                .replace("path: [Root, Entries]", "path: [Root, Title]")
                .replace("key: Entries", "key: Заголовок")
        })
        .collect();
    let composite = include_str!("../../../declarations/common/formatted-i8n-text.yaml");
    let composite_owner = integrated_owner
        .replace("test.integrated-i8n", "test.composite")
        .replace("common.i8n-text", "common.formatted-i8n-text")
        .replace(
            "registeredLanguages: {input: languages}, ownerName: {input: name}",
            "languages: {input: languages}, name: {input: name}",
        );
    let composite_fields = composite
        .replace("common.formatted-i8n-text", "common.composite-fields")
        .replace("  boolean: common.boolean-flag", "  boolean: common.boolean-flag\n  number: common.exact-decimal")
        .replace("    - name: formatted", "    - {name: amount, type: {use: number}}\n    - {name: label, type: {kind: scalar, scalar: text}}\n    - {name: detail, type: {kind: scalar, scalar: text}}\n    - name: formatted")
        .replace("      - field: formatted", "      - {field: amount, path: [], attribute: amount}\n      - {field: label, path: [], attribute: label}\n      - {field: detail, path: [Detail]}\n      - field: formatted")
        .replace("      - {field: formatted, key:", "      - {field: amount, key: Amount}\n      - {field: label, key: Label}\n      - {field: detail, key: Detail}\n      - {field: formatted, key:");
    let composite_fields_owner = composite_owner
        .replace("test.composite", "test.composite-fields")
        .replace("common.formatted-i8n-text", "common.composite-fields");
    let generic_fields = composite_fields.split("\npresence:").next().unwrap()
        .replace("common.composite-fields", "common.generic-fields")
        .replace("  number: common.exact-decimal", "  number: common.exact-decimal\n  mode: common.compact-first-kind")
        .replace("    - {name: amount", "    - {name: mode, type: {use: mode}}\n    - {name: amount")
        .replace("      - {field: amount, path:", "      - {field: mode, path: [], attribute: mode}\n      - {field: amount, path:")
        .replace("      - {field: amount, key:", "      - {field: mode, key: Mode}\n      - {field: amount, key:")
        .replace("    - name: formatted\n      type: {use: boolean}\n", "")
        .replace("      - field: formatted\n        path: []\n        attribute: formatted\n", "")
        .replace("      - {field: formatted, key: Форматированный}\n", "")
        .replace("parameters:\n", "parameters:\n  labelDefault: {type: {kind: scalar, scalar: text}, default: untitled}\n")
        .replace("representations:", "namespaces: {a: 'urn:amount'}\nrepresentations:")
        .replace("attribute: amount", "attribute: a:amount")
        .replace("name: amount", "name: quantity")
        .replace("field: amount", "field: quantity")
        .replace("key: Amount", "key: Quantity")
        + "\npresence:\n- target: {field: label}\n  xml: {missing: {denotes: {parameter: labelDefault}}}\n  yaml:\n    missing: {denotes: {parameter: labelDefault}}\n    omitWhen: {eq: [{field: label}, {parameter: labelDefault}]}\n";
    let generic_fields_owner = composite_fields_owner
        .replace("composite-fields", "generic-fields")
        .replace("Entries", "Bundle");
    let assembled = composite_owner.replace("test.composite", "test.assembled-texts")
        .replace("{dictionary: common.formatted-i8n-text}", "{dictionary: common.formatted-i8n-text, plain: common.i8n-text}")
        .replace("    - {name: entries", "    - {name: description, type: {kind: scalar, scalar: text}}\n    - {name: entries")
        .replace("representations:\n", "    - {name: notes, type: {use: plain, bind: {defaultLanguage: {literal: ru}, registeredLanguages: {input: languages}, ownerName: {input: name}}}}\nrepresentations:\n")
        .replace("      - {field: entries, path: [Root, Entries]}", "      - {field: description, path: [Root, Description]}\n      - {field: entries, path: [Root, Entries]}\n      - {field: notes, path: [Root, Notes]}")
        .replace("      - {field: entries, key: Entries}", "      - {field: description, key: Description}\n      - {field: entries, key: Entries}\n      - {field: notes, key: Notes}");
    let composite_profiles:Vec<_>=(0..32).map(|profile|composite_owner
        .replace("test.composite", &format!("test.composite-{profile}"))
        .replace("{use: dictionary, bind:", &format!("{{use: dictionary, with: {{preserveEmptyXML: {}, excludeIfEqualNameYAML: {}, skipEmptyToXML: {}, typedXML: {}, xmlWithDefaultLanguage: {}}}, bind:",profile&1!=0,profile&2!=0,profile&4!=0,profile&8!=0,profile&16!=0))).collect();
    let external_owner = r#"format: nkdk-declarations/1
kind: object
id: test.external-payload
value: {kind: record, fields: [{name: payload, type: {kind: scalar, scalar: text}}, {name: name, type: {kind: scalar, scalar: text}}]}
representations:
  xml: {kind: record, fields: [{field: payload, path: [Data], file: [Aux, Payload.xml]}, {field: name, path: [Primary, Name]}]}
  yaml: {kind: mapping, fields: [{field: payload, key: Payload}, {field: name, key: Name}]}
"#;
    let mut sources = vec![
        SourceFile {
            path: "qname-common.yaml",
            bytes: include_bytes!("fixtures/qname-common.yaml"),
        },
        SourceFile {
            path: "namespace-row.yaml",
            bytes: namespace_row.as_bytes(),
        },
        SourceFile {
            path: "namespace-rows.yaml",
            bytes: namespace_rows.as_bytes(),
        },
        SourceFile {
            path: "namespace-owner.yaml",
            bytes: namespace_owner.as_bytes(),
        },
        SourceFile {
            path: "external-owner.yaml",
            bytes: external_owner.as_bytes(),
        },
        SourceFile {
            path: "exact-decimal.yaml",
            bytes: include_bytes!("../../../../tests/declaration-corpus/valid/exact-decimal.yaml"),
        },
        SourceFile {
            path: "dependent-owner.yaml",
            bytes: dependent_owner.as_bytes(),
        },
        SourceFile {
            path: "lower-code.yaml",
            bytes: lower_code.as_bytes(),
        },
        SourceFile {
            path: "patterned-item.yaml",
            bytes: checked_item.as_bytes(),
        },
        SourceFile {
            path: "choice-first.yaml",
            bytes: choice_first.as_bytes(),
        },
        SourceFile {
            path: "second-item.yaml",
            bytes: second_item.as_bytes(),
        },
        SourceFile {
            path: "choice-item.yaml",
            bytes: choice_item.as_bytes(),
        },
        SourceFile {
            path: "choice-list.yaml",
            bytes: choice_list.as_bytes(),
        },
        SourceFile {
            path: "choice-owner.yaml",
            bytes: choice_owner.as_bytes(),
        },
        SourceFile {
            path: "bound-first.yaml",
            bytes: bound_first.as_bytes(),
        },
        SourceFile {
            path: "bound-choice-item.yaml",
            bytes: bound_choice.as_bytes(),
        },
        SourceFile {
            path: "bound-choice-list.yaml",
            bytes: bound_list.as_bytes(),
        },
        SourceFile {
            path: "bound-choice-owner.yaml",
            bytes: bound_owner.as_bytes(),
        },
        SourceFile {
            path: "contextual-list.yaml",
            bytes: contextual_list.as_bytes(),
        },
        SourceFile {
            path: "contextual-list-owner.yaml",
            bytes: contextual_list_owner.as_bytes(),
        },
        SourceFile {
            path: "short-first.yaml",
            bytes: short_first.as_bytes(),
        },
        SourceFile {
            path: "short-second.yaml",
            bytes: short_second.as_bytes(),
        },
        SourceFile {
            path: "short-choice.yaml",
            bytes: short_choice.as_bytes(),
        },
        SourceFile {
            path: "projected-list.yaml",
            bytes: projected_list.as_bytes(),
        },
        SourceFile {
            path: "projected-owner.yaml",
            bytes: projected_owner.as_bytes(),
        },
        SourceFile {
            path: "projected-scalar.yaml",
            bytes: projected_scalar.as_bytes(),
        },
        SourceFile {
            path: "compact-kind.yaml",
            bytes: compact_kind.as_bytes(),
        },
        SourceFile {
            path: "compact-other-kind.yaml",
            bytes: compact_other_kind.as_bytes(),
        },
        SourceFile {
            path: "compact-first.yaml",
            bytes: compact_first.as_bytes(),
        },
        SourceFile {
            path: "compact-second.yaml",
            bytes: compact_second.as_bytes(),
        },
        SourceFile {
            path: "compact-choice.yaml",
            bytes: compact_choice.as_bytes(),
        },
        SourceFile {
            path: "compact-rows.yaml",
            bytes: compact_rows.as_bytes(),
        },
        SourceFile {
            path: "compact-frame.yaml",
            bytes: compact_frame.as_bytes(),
        },
        SourceFile {
            path: "compact-owner.yaml",
            bytes: compact_owner.as_bytes(),
        },
        SourceFile {
            path: "compact-frame-owner.yaml",
            bytes: compact_frame_owner.as_bytes(),
        },
        SourceFile {
            path: "patterned-list.yaml",
            bytes: patterned_list.as_bytes(),
        },
        SourceFile {
            path: "patterned-owner.yaml",
            bytes: pattern_list_owner.as_bytes(),
        },
        SourceFile {
            path: "singleton-list.yaml",
            bytes: singleton_list.as_bytes(),
        },
        SourceFile {
            path: "singleton-owner.yaml",
            bytes: singleton_owner.as_bytes(),
        },
        SourceFile {
            path: "required-patterned-list.yaml",
            bytes: required_patterned_list.as_bytes(),
        },
        SourceFile {
            path: "required-patterned-owner.yaml",
            bytes: required_patterned_owner.as_bytes(),
        },
        SourceFile {
            path: "contextual-text.yaml",
            bytes: contextual_text.as_bytes(),
        },
        SourceFile {
            path: "contextual-owner.yaml",
            bytes: contextual_owner.as_bytes(),
        },
        SourceFile {
            path: "cell-forms.yaml",
            bytes: cell_forms.as_bytes(),
        },
        SourceFile {
            path: "cell-owner.yaml",
            bytes: cell_owner.as_bytes(),
        },
        SourceFile {
            path: "sibling-common.yaml",
            bytes: sibling_common.as_bytes(),
        },
        SourceFile {
            path: "sibling-owner.yaml",
            bytes: sibling_owner.as_bytes(),
        },
        SourceFile {
            path: "assembled-texts.yaml",
            bytes: assembled.as_bytes(),
        },
        SourceFile {
            path: "integrated.yaml",
            bytes: integrated,
        },
        SourceFile {
            path: "integrated-owner.yaml",
            bytes: integrated_owner.as_bytes(),
        },
        SourceFile {
            path: "nil-common.yaml",
            bytes: nil_common.as_bytes(),
        },
        SourceFile {
            path: "nil-owner.yaml",
            bytes: nil_owner.as_bytes(),
        },
        SourceFile {
            path: "typed-common.yaml",
            bytes: typed_common.as_bytes(),
        },
        SourceFile {
            path: "typed-owner.yaml",
            bytes: typed_owner.as_bytes(),
        },
        SourceFile {
            path: "untyped-owner.yaml",
            bytes: untyped_owner.as_bytes(),
        },
        SourceFile {
            path: "named-common.yaml",
            bytes: named_common.as_bytes(),
        },
        SourceFile {
            path: "named-owner.yaml",
            bytes: named_owner.as_bytes(),
        },
        SourceFile {
            path: "patterned-common.yaml",
            bytes: patterned_common.as_bytes(),
        },
        SourceFile {
            path: "patterned-owner.yaml",
            bytes: patterned_owner.as_bytes(),
        },
        SourceFile {
            path: "normalized-common.yaml",
            bytes: normalized_common.as_bytes(),
        },
        SourceFile {
            path: "normalized-owner.yaml",
            bytes: normalized_owner.as_bytes(),
        },
        SourceFile {
            path: "canonical-common.yaml",
            bytes: canonical_common.as_bytes(),
        },
        SourceFile {
            path: "canonical-owner.yaml",
            bytes: canonical_owner.as_bytes(),
        },
        SourceFile {
            path: "derived-common.yaml",
            bytes: derived_common.as_bytes(),
        },
        SourceFile {
            path: "derived-owner.yaml",
            bytes: derived_owner.as_bytes(),
        },
        SourceFile {
            path: "sorted-common.yaml",
            bytes: sorted_common.as_bytes(),
        },
        SourceFile {
            path: "sorted-owner.yaml",
            bytes: sorted_owner.as_bytes(),
        },
        SourceFile {
            path: "common.yaml",
            bytes: common.as_bytes(),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: owner.as_bytes(),
        },
    ];
    sources.extend([
        SourceFile {
            path: "composite.yaml",
            bytes: composite.as_bytes(),
        },
        SourceFile {
            path: "composite-owner.yaml",
            bytes: composite_owner.as_bytes(),
        },
        SourceFile {
            path: "flag.yaml",
            bytes: include_bytes!("../../../declarations/common/boolean-flag.yaml"),
        },
    ]);
    sources.push(SourceFile {
        path: "default-container.yaml",
        bytes: default_container_owner.as_bytes(),
    });
    sources.extend(profiles.iter().map(|source| SourceFile {
        path: "profile.yaml",
        bytes: source.as_bytes(),
    }));
    sources.extend(corpus_profiles.iter().map(|source| SourceFile {
        path: "corpus-profile.yaml",
        bytes: source.as_bytes(),
    }));
    sources.extend([
        SourceFile {
            path: "composite-fields.yaml",
            bytes: composite_fields.as_bytes(),
        },
        SourceFile {
            path: "composite-fields-owner.yaml",
            bytes: composite_fields_owner.as_bytes(),
        },
    ]);
    sources.extend([
        SourceFile {
            path: "generic-fields.yaml",
            bytes: generic_fields.as_bytes(),
        },
        SourceFile {
            path: "generic-fields-owner.yaml",
            bytes: generic_fields_owner.as_bytes(),
        },
    ]);
    sources.extend(composite_profiles.iter().map(|source| SourceFile {
        path: "composite-profile.yaml",
        bytes: source.as_bytes(),
    }));
    sources.extend([
        SourceFile {
            path: "record-list.yaml",
            bytes: list_common.as_bytes(),
        },
        SourceFile {
            path: "record-list-owner.yaml",
            bytes: list_owner.as_bytes(),
        },
    ]);
    sources.extend([
        SourceFile {
            path: "tree-list.yaml",
            bytes: tree_common.as_bytes(),
        },
        SourceFile {
            path: "tree-owner.yaml",
            bytes: tree_owner.as_bytes(),
        },
    ]);
    sources.extend([
        SourceFile {
            path: "short.yaml",
            bytes: short_common.as_bytes(),
        },
        SourceFile {
            path: "short-owner.yaml",
            bytes: short_owner.as_bytes(),
        },
    ]);
    sources.push(SourceFile {
        path: "restored-owner.yaml",
        bytes: restored_owner.as_bytes(),
    });
    let modules = sources
        .into_iter()
        .flat_map(|source| parse_many(source).unwrap())
        .collect::<Vec<_>>();
    for (from, to, code) in [
        (
            "{literal: 'Object.'}",
            "{literal: true}",
            "expression_type_mismatch",
        ),
        (
            "    default:",
            "    missing: {denotes: {absent: true}}\n    default:",
            "conflicting_yaml_default",
        ),
        (
            "require: {lookup: {in: {input: ids}, key: {concat: [{literal: 'Object.'}, {input: name}]}}}",
            "require: {literal: text}",
            "expression_type_mismatch",
        ),
    ] {
        let invalid = restored_owner.replace(from, to);
        let error = match parse_many(SourceFile {
            path: "invalid-default.yaml",
            bytes: invalid.as_bytes(),
        }) {
            Err(errors) => errors,
            Ok(mut parsed) => {
                let mut changed = modules.clone();
                let slot = changed
                    .iter()
                    .position(|module| module.id == "test.restored-list")
                    .unwrap();
                changed[slot] = parsed.remove(0);
                link(&changed).unwrap_err()
            }
        };
        assert!(error.iter().any(|error| error.code == code), "{error:?}");
    }
    let program = link(&modules).unwrap();
    let collection_id = program
        .entries
        .iter()
        .find(|entry| entry.name == "test.dictionary")
        .unwrap()
        .id;
    let list_id = program
        .entries
        .iter()
        .find(|entry| entry.name == "test.record-list")
        .unwrap()
        .id;
    let dependent_id = program
        .entries
        .iter()
        .find(|entry| entry.name == "test.dependent-properties")
        .unwrap()
        .id;
    let composite_id = program
        .entries
        .iter()
        .find(|entry| entry.name == "test.composite")
        .unwrap()
        .id;
    let mut overlapping = program.clone();
    let common = overlapping
        .entries
        .iter_mut()
        .find(|entry| entry.name == "common.generic-fields")
        .unwrap();
    let nkdk_rule_model::LinkedXml::Record(xml) = &mut common.xml else {
        panic!("record")
    };
    xml.iter_mut()
        .find(|field| field.field == "detail")
        .unwrap()
        .path = vec![nkdk_rule_model::ExpandedName {
        namespace: "http://v8.1c.ru/8.1/data/core".into(),
        local: "item".into(),
    }];
    assert!(
        generate(&overlapping)
            .unwrap_err()
            .iter()
            .any(|error| error.message.contains("must not overlap"))
    );
    let generated = generate(&program).unwrap();
    let root = std::env::temp_dir().join(format!(
        "nkdk-generated-collection-{}-{}",
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
    fs::write(root.join("Cargo.toml"), format!("[package]\nname=\"generated-collection\"\nversion=\"0.0.0\"\nedition=\"2024\"\n[dependencies]\nnkdk-conversion-core={{path={core:?}}}\n[workspace]\n")).unwrap();
    for file in generated.files {
        fs::write(root.join("src").join(file.path), file.contents).unwrap();
    }
    fs::write(root.join("src/main.rs"), r#"include!("generated.rs");
fn main() {
    {
        let inputs=PreparedInputs::default();
        let mut state=OwnerXmlReadDEPENDENT_ID::new();
        core::xml::visit_scoped(b"<Root><Mode>limited</Mode><Count>2</Count><Entries><item><key>first</key><text>hello</text></item></Entries></Root>",|path,token,scope|state.consume(path,&token,Some(scope),&[],&inputs.view())).unwrap();
        let value=state.finish(&[],&inputs.view()).unwrap();
        assert_eq!(write_yaml_DEPENDENT_ID(&value,&inputs.view()).unwrap(),b"Mode: limited\nCount: 2\nEntries:\n  - Code: first\n    Text: hello");
        let mut state=OwnerYamlReadDEPENDENT_ID::new().unwrap();
        core::yaml::visit_nodes(b"Mode: limited\nCount: 2\nEntries:\n  - Code: first\n    Text: hello",|node,at|state.consume(node,at,&[],&inputs.view())).unwrap();
        let restored=state.finish(&[],&inputs.view()).unwrap();
        core::proof::verify(b"<Root><Mode>limited</Mode><Count>2</Count><Entries><item><key>first</key><text>hello</text></item></Entries></Root>",&write_xml_DEPENDENT_ID(&restored,&inputs.view()).unwrap(),|_|false).unwrap();

    }
    {
        let inputs=PreparedInputs::default();
        let mut state=core::yaml::SequenceReader::<2,RLIST_ID>::new(Some(&["Code","Text"]),&[],false);
        core::yaml::visit_nodes(b"[{Code: first, Text: hello}, {Text: world, Code: second}]",|node,at|state.consume(node,at,|fields,_|Ok(RLIST_ID{fields}))).unwrap();
        let value=finish_yaml_sequence_LIST_ID(Some(state.finish().unwrap()),&[],&inputs.view()).unwrap();
        let xml=write_xml_LIST_ID(&value,&inputs.view()).unwrap();
        core::proof::verify(b"<Root><Entries><item><key>first</key><text>hello</text></item><item><key>second</key><text>world</text></item></Entries></Root>",&xml,|_|false).unwrap();
    }
    {
        let inputs=PreparedInputs::default();
        let first=b"<Root><Entries><item><key>one</key><text>first</text></item></Entries></Root>";
        let second=b"<Root><Entries><item><key>two</key><text>second</text></item><item><key>three</key><text>third</text></item></Entries></Root>";
        let mut dictionary=YamlDictionaryCOLLECTION_ID::new();
        let mut another=YamlDictionaryCOLLECTION_ID::new();
        let mut nodes=Vec::new();let mut other_nodes=Vec::new();
        core::yaml::visit_nodes(b"Entries: {one: first}",|node,at|{nodes.push((node,at));Ok(())}).unwrap();
        core::yaml::visit_nodes(b"Entries: {other: independent}",|node,at|{other_nodes.push((node,at));Ok(())}).unwrap();
        for ((node,at),(other,position)) in nodes.into_iter().zip(other_nodes) {
            dictionary.consume(node,at,&inputs.view()).unwrap();another.consume(other,position,&inputs.view()).unwrap();
        }
        let another=finish_yaml_dictionary_COLLECTION_ID(another,&[],&inputs.view(),true).unwrap();
        let dictionary=finish_yaml_dictionary_COLLECTION_ID(dictionary,&[],&inputs.view(),true).unwrap();
        core::proof::verify(b"<Root><Entries><item><key>other</key><text>independent</text></item></Entries></Root>",&write_xml_COLLECTION_ID(&another,&inputs.view()).unwrap(),|_|false).unwrap();
        core::proof::verify(first,&write_xml_COLLECTION_ID(&dictionary,&inputs.view()).unwrap(),|_|false).unwrap();
        let mut left=XmlCollectionCOLLECTION_ID::new();
        let mut right=XmlCollectionCOLLECTION_ID::new();
        core::xml::visit(first,|path,token| left.consume(path,&token,&[],&inputs.view())).unwrap();
        core::xml::visit(second,|path,token| right.consume(path,&token,&[],&inputs.view())).unwrap();
        let right=finish_xml_COLLECTION_ID(right,&inputs.view()).unwrap();
        let left=finish_xml_COLLECTION_ID(left,&inputs.view()).unwrap();
        assert_eq!(write_yaml_COLLECTION_ID(&right,&inputs.view()).unwrap(),b"Entries:\n  two: second\n  three: third");
        assert_eq!(write_yaml_COLLECTION_ID(&left,&inputs.view()).unwrap(),b"Entries:\n  one: first");
    }
    {
        let entry=entry_id("test.external-payload").unwrap();
        let path=core::resources::RelativePath::new(["Aux","Payload.xml"],128).unwrap();
        let inputs=PreparedInputs::default().with_documents(vec![(path,b"<Data>kept</Data>".to_vec())]).unwrap();
        let original=b"<Primary><Name>sample</Name></Primary>";
        let yaml=convert_file(entry,Direction::XmlToYaml,original,&inputs).unwrap();
        verify_candidate(entry,original,&yaml.bytes,&inputs).unwrap();
        let xml=convert_file(entry,Direction::YamlToXml,&yaml.bytes,&PreparedInputs::default()).unwrap();
        assert_eq!(xml.documents.len(),1);
        assert_eq!(xml.documents[0].0.segments(),["Aux","Payload.xml"]);
        let inputs=PreparedInputs::default().with_documents(xml.documents).unwrap();
        assert_eq!(convert_file(entry,Direction::XmlToYaml,&xml.bytes,&inputs).unwrap().bytes,yaml.bytes);
    }
    {
        let entry=entry_id("test.dependent-properties").unwrap();
        let inputs=PreparedInputs::default();
        for (mode,count,invalid) in [("limited","3",false),("limited","4",true),("free","4",false)] {
            let xml=format!("<Root><Mode>{mode}</Mode><Count>{count}</Count><Entries><item><key>x</key><text>kept</text></item></Entries></Root>");
            let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
            let yaml=std::str::from_utf8(&result.bytes).unwrap();
            assert_eq!(yaml.contains("!xml/invalid"),invalid,"{yaml}");
            assert!(!yaml.contains("!xml/raw"),"{yaml}");
            assert!(validate_file(entry,&result.bytes,&inputs).is_empty());
            verify_candidate(entry,xml.as_bytes(),&result.bytes,&inputs).unwrap();
            let exceptional=xml.replace("<Count>","<Count extra='shape'>");
            let preserved=convert_file(entry,Direction::XmlToYaml,exceptional.as_bytes(),&inputs).unwrap();
            let preserved_yaml=std::str::from_utf8(&preserved.bytes).unwrap();
            assert!(preserved_yaml.contains("!xml/raw"),"{preserved_yaml}");
            assert_eq!(preserved_yaml.matches("kept").count(),1,"{preserved_yaml}");
            verify_candidate(entry,exceptional.as_bytes(),&preserved.bytes,&inputs).unwrap();

        }
    }

    {
        let namespaced=entry_id("test.namespace-rows").unwrap();
        let xml=b"<Root xmlns:p='urn:outer'><Entries><Item><Name>first</Name><Value>p:One</Value></Item><Item><Name>second</Name><Value xmlns:p='urn:inner'>p:Two</Value></Item></Entries></Root>";
        let result=convert_file(namespaced,Direction::XmlToYaml,xml,&PreparedInputs::default()).unwrap();
        let yaml=String::from_utf8_lossy(&result.bytes);
        assert_eq!(yaml, "Entries:\n  -\n    Key: first\n    Qualified:\n      Namespace: urn:outer\n      Name: One\n  -\n    Key: second\n    Qualified:\n      Namespace: urn:inner\n      Name: Two");
        verify_candidate(namespaced,xml,&result.bytes,&PreparedInputs::default()).unwrap();
        let singleton=entry_id("test.singleton-list").unwrap();
        let inputs=PreparedInputs::default();
        for (body, expected) in [("", "Entries: []"), ("<Item>Entry::good</Item>", "Entries: good"), ("<Item>Entry::good</Item><Item>Entry::other</Item>", "Entries:\n  - good\n  - other")] {
            let xml=format!("<Root><Entries>{body}</Entries></Root>");
            let converted=convert_file(singleton,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
            assert_eq!(converted.bytes,expected.as_bytes());
            verify_candidate(singleton,xml.as_bytes(),&converted.bytes,&inputs).unwrap();
        }
        let invalid=b"<Root><Entries><Item>Entry::BAD</Item></Entries></Root>";
        let converted=convert_file(singleton,Direction::XmlToYaml,invalid,&inputs).unwrap();
        assert!(String::from_utf8_lossy(&converted.bytes).contains("!xml/invalid"));
        verify_candidate(singleton,invalid,&converted.bytes,&inputs).unwrap();
        for entry_name in ["test.patterned-list", "test.required-patterned-list"] {
        let entry=entry_id(entry_name).unwrap();
        let inputs=PreparedInputs::default();
        let missing=b"<Root/>";
        let preserved=convert_file(entry,Direction::XmlToYaml,missing,&inputs).unwrap();
        verify_candidate(entry,missing,&preserved.bytes,&inputs).unwrap();

        for (text,tag) in [("Entry::good", ""), ("Entry::BAD", "!xml/invalid"), ("Entry::forbidden", "!xml/invalid"), ("Other::good", "!xml/raw")] {
            let xml=format!("<Root><Entries><Item>{text}</Item><Item>{text}</Item></Entries></Root>");
            let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
            let yaml=std::str::from_utf8(&result.bytes).unwrap();
            if tag.is_empty() { assert_eq!(yaml,"Entries:\n  - good\n  - good"); }
            else { assert!(yaml.contains(tag),"{yaml}"); }
            assert!(validate_file(entry,&result.bytes,&inputs).is_empty());
            verify_candidate(entry,xml.as_bytes(),&result.bytes,&inputs).unwrap();
        }
    }

    }

    {
        let entry=entry_id("test.cell-choice").unwrap();
        let inputs=read_inputs(entry,b"unrelated: true\nowner: Owner").unwrap();
        for (text, expected) in [("Local.Owner.good", "good"), ("Full.good", "full/good")] {
            let xml=format!("<Root><Link>{text}</Link></Root>");
            let yaml=format!("Link: {expected}");
            assert_eq!(convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap().bytes,yaml.as_bytes());
            verify_candidate(entry,xml.as_bytes(),yaml.as_bytes(),&inputs).unwrap();
        }
        for (text,tag) in [("Local.Owner.BAD","!xml/invalid"),("Full.BAD","!xml/invalid"),("Local.Other.good","!xml/raw"),("Full.good.extra","!xml/raw")] {
            let xml=format!("<Root><Link>{text}</Link></Root>");
            let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
            assert!(String::from_utf8_lossy(&result.bytes).contains(tag));
            verify_candidate(entry,xml.as_bytes(),&result.bytes,&inputs).unwrap();
        }
        assert!(!validate_file(entry,b"Link: full/good/extra",&inputs).is_empty());
    }
    let check_anomaly = |entry, xml: &str, tag: &str, inputs: &PreparedInputs| {
        let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),inputs).unwrap();
        assert!(std::str::from_utf8(&result.bytes).unwrap().contains(tag));
        assert!(validate_file(entry,&result.bytes,inputs).is_empty());
        verify_candidate(entry,xml.as_bytes(),&result.bytes,inputs).unwrap();
    };
    {
        let entry=entry_id("test.choice-list").unwrap();
        let inputs=PreparedInputs::default();
        let xml=b"<Root><Entries><Item>Entry::good</Item><Item>Second::forbidden</Item><Item>Entry::good</Item></Entries></Root>";
        let expected=b"Entries:\n  - first:good\n  - second:forbidden\n  - first:good";
        let result=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap();
        assert_eq!(result.bytes,expected);
        verify_candidate(entry,xml,expected,&inputs).unwrap();
        for (text,tag) in [("Entry::forbidden","!xml/invalid"),("Second::BAD","!xml/invalid"),("Unknown::good","!xml/raw")] {
            let xml=format!("<Root><Entries><Item>{text}</Item><Item>Second::kept</Item></Entries></Root>");
            check_anomaly(entry,&xml,tag,&inputs);
        }
        assert!(validate_file(entry,b"Entries:\n  - first:forbidden",&inputs).iter().any(|issue|issue.code.as_deref()==Some("item.unavailable")));
        assert!(validate_file(entry,b"Entries:\n  - second:forbidden",&inputs).is_empty());
    }
    {
        let entry=entry_id("test.bound-choice-list").unwrap();
        for allowed in ["good","other"] {
            let inputs=read_inputs(entry,format!("unused: true\nselected: {allowed}").as_bytes()).unwrap();
            for (text,invalid) in [("Entry::good",allowed!="good"),("Second::good",false)] {
                let xml=format!("<Root><Entries><Item>{text}</Item></Entries></Root>");
                let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
                assert_eq!(std::str::from_utf8(&result.bytes).unwrap().contains("!xml/invalid"),invalid);
                assert!(validate_file(entry,&result.bytes,&inputs).is_empty());
                verify_candidate(entry,xml.as_bytes(),&result.bytes,&inputs).unwrap();
            }
            assert_eq!(!validate_file(entry,b"Entries:\n  - first:good",&inputs).is_empty(),allowed!="good");
        }
    }
    {
        let scalar=entry_id("test.short-choice").unwrap();
        for owner in ["Owner","Renamed"] {
            let scalar_inputs=read_inputs(scalar,format!("unrelated: true\nowner: {owner}").as_bytes()).unwrap();
            verify_candidate(scalar,format!("<Root><Link>First::{owner}::One</Link></Root>").as_bytes(),b"Link: first:One",&scalar_inputs).unwrap();
            for (name,first,second,expected) in [
                ("test.contextual-list",format!("{owner}::One"),format!("{owner}::Two"),"Entries:\n  - One\n  - Two\n  - One"),
                ("test.projected-list",format!("First::{owner}::One"),format!("Second::{owner}::Two"),"Entries:\n  - first:One\n  - second:Two\n  - first:One"),
            ] {
                let entry=entry_id(name).unwrap();
                let inputs=read_inputs(entry,format!("unused: false\nowner: {owner}").as_bytes()).unwrap();
                let xml=format!("<Root><Entries><Item>{first}</Item><Item>{second}</Item><Item>{first}</Item></Entries></Root>");
                assert_eq!(convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap().bytes,expected.as_bytes());
                verify_candidate(entry,xml.as_bytes(),expected.as_bytes(),&inputs).unwrap();
                let other=xml.replace(owner,"Other");
                let preserved=convert_file(entry,Direction::XmlToYaml,other.as_bytes(),&inputs).unwrap();
                assert!(std::str::from_utf8(&preserved.bytes).unwrap().contains("!xml/raw"));
                verify_candidate(entry,other.as_bytes(),&preserved.bytes,&inputs).unwrap();
            }
        }
    }
    {
        for (name,xml_prefix,yaml_prefix) in [("test.compact-rows","",""),("test.compact-frame","owner.","owner:")] {
            let entry=entry_id(name).unwrap();
            let inputs=PreparedInputs::default();
            let xml=format!("<Root><Entries>{xml_prefix}First.good.Second.forbidden.First.good</Entries></Root>");
            let yaml=format!("Entries: {yaml_prefix}one:good:two:forbidden:one:good");
            assert_eq!(convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap().bytes,yaml.as_bytes());
            verify_candidate(entry,xml.as_bytes(),yaml.as_bytes(),&inputs).unwrap();
            for (text,tag) in [("First.forbidden","!xml/invalid"),("Second.BAD","!xml/invalid"),("Unknown.good","!xml/raw"),("First.good.Second","!xml/raw")] {
                let xml=format!("<Root><Entries>{xml_prefix}{text}</Entries></Root>");
                check_anomaly(entry,&xml,tag,&inputs);
            }
            assert!(!validate_file(entry,format!("Entries: {yaml_prefix}one:forbidden").as_bytes(),&inputs).is_empty());
        }
    }
    {
        let entry=entry_id("test.contextual-text").unwrap();
        let inputs=read_inputs(entry,b"unrelated: true\nowner: Owner").unwrap();
        for (xml,short) in [("<Root><Link>Owner::Item</Link></Root>",true),("<Root><Link>Other::Item</Link></Root>",false)] {
            let yaml=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
            assert_eq!(yaml.bytes==b"Link: Item",short);
            verify_candidate(entry,xml.as_bytes(),&yaml.bytes,&inputs).unwrap();
        }
        let renamed=read_inputs(entry,b"unrelated: false\nowner: Renamed").unwrap();
        verify_candidate(entry,b"<Root><Link>Renamed::Item</Link></Root>",b"Link: Item",&renamed).unwrap();
        assert!(convert_file(entry,Direction::YamlToXml,b"Link: Item",&PreparedInputs::default()).is_err());
    }
    {
        let entry=entry_id("test.sibling-lists").unwrap();
        let inputs=PreparedInputs::default();
        let injected="First: !xml/raw\n  $значение: []\n  $xml:\n    Second:\n      key: forged\n      text: injected\nSecond: []";
        assert!(convert_file(entry,Direction::YamlToXml,injected.as_bytes(),&inputs).unwrap_err().iter().any(|error| error.code.as_deref()==Some("xml.preservation-shape")));
        for original in [
            "<Root><Children><First><key>a</key><text>one</text></First><First><key>b</key><text>two</text></First><Second><key>c</key><text>three</text></Second></Children></Root>",
            "<Root><Children><First extra='kept'><key>a</key><text>one</text></First><Second><key>c</key><text>three</text></Second></Children></Root>",
            "<Root><Children><Second><key>c</key><text>three</text></Second><First><key>a</key><text>one</text></First></Children></Root>",
            "<Root><Children/></Root>",
            "<Root/>",
        ] {
            let yaml=convert_file(entry,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
            verify_candidate(entry,original.as_bytes(),&yaml.bytes,&inputs).unwrap();
            if original.contains("three") { assert!(String::from_utf8_lossy(&yaml.bytes).contains("Text: three")); }
        }
    }
    {
        let entry=entry_id("test.restored-list").unwrap();
        let original=b"<Root version='1'><Entries><item><key>Object.Example</key><text>original-id</text></item></Entries></Root>";
        let generation=core::facts::Generation(1);
        let budget=||core::facts::prepared::FactBudget {text:core::facts::text::TextBudget {entries:10,bytes:1000},rows:10};
        let mut facts=fact_builder(generation,budget());
        assert!(contribute_file(entry_id("test.record-list").unwrap(),Direction::XmlToYaml,original,&PreparedInputs::default(),&mut facts).is_empty());
        let inputs=prepare_fact_inputs(entry,std::sync::Arc::new(facts.finish()),generation,vec![("name".into(),InputValue::Text("Example".into()))]).unwrap();
        let missing=prepare_fact_inputs(entry,std::sync::Arc::new(fact_builder(generation,budget()).finish()),generation,vec![("name".into(),InputValue::Text("Example".into()))]).unwrap();
        assert!(convert_file(entry,Direction::YamlToXml,b"",&missing).unwrap_err().iter().any(|error|error.code.as_deref()==Some("input.required")));
        let yaml=convert_file(entry,Direction::XmlToYaml,original,&inputs).unwrap();
        assert!(yaml.bytes.is_empty(),"{}",String::from_utf8_lossy(&yaml.bytes));
        verify_candidate(entry,original,&yaml.bytes,&inputs).unwrap();
        for xml in ["<Root/>","<Root><Entries/></Root>","<Root><Entries><item><key>Object.Example</key><text>different-id</text></item></Entries></Root>"] {
            let yaml=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
            assert!(!yaml.bytes.is_empty());
            verify_candidate(entry,xml.as_bytes(),&yaml.bytes,&inputs).unwrap();
        }
    }

    let assembled=entry_id("test.assembled-texts").unwrap();
    let inputs=read_inputs(assembled,b"languages: [ru, en]\nname: Owner").unwrap();
    let original="<Root xmlns:v8='http://v8.1c.ru/8.1/data/core'><Description>body</Description><Entries formatted='false'><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item></Entries><Notes><v8:item><v8:lang>ru</v8:lang><v8:content>Note</v8:content></v8:item></Notes></Root>";
    for original in [original.to_owned(),original.replace(" formatted='false'",""),original.replace("<v8:lang>ru</v8:lang>","<v8:lang>de</v8:lang>")] {
        let result=convert_file(assembled,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
        let yaml=String::from_utf8_lossy(&result.bytes);
        assert!(yaml.contains("Description: body") && yaml.contains("Hello") && yaml.contains("Note"));
        verify_candidate(assembled,original.as_bytes(),&result.bytes,&inputs).unwrap();
    }
    let entry=entry_id("test.record-list").unwrap();
    let inputs=PreparedInputs::default();
    let xml=b"<Root><Entries><item><key>a</key><text>first</text></item><item><key>a</key><text></text></item></Entries></Root>";
    let yaml=convert_file(entry,Direction::XmlToYaml,xml,&inputs).unwrap().bytes;
    assert_eq!(std::str::from_utf8(&yaml).unwrap(),"Entries:\n  - Code: a\n    Text: first\n  - Code: a\n    Text: \"\"");
    verify_candidate(entry,xml,&yaml,&inputs).unwrap();
    assert!(!validate_file(entry,b"Entries: [{Code: a}]",&inputs).is_empty());
    let entry=entry_id("test.short-list").unwrap();
    for (xml, expected) in [
        ("<Root><Entries><Item flag=\"fixed\">a</Item><Item flag=\"fixed\">b</Item></Entries></Root>", "Entries: Pair"),
        ("<Root><Entries><Item flag=\"fixed\">b</Item><Item flag=\"fixed\">a</Item></Entries></Root>", "Entries:\n  - b\n  - a"),
        ("<Root><Entries><Item flag=\"fixed\">a</Item><Item flag=\"fixed\">b</Item><Item flag=\"fixed\">a</Item></Entries></Root>", "Entries:\n  - a\n  - b\n  - a"),
    ] {
        let yaml=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap().bytes;
        assert_eq!(std::str::from_utf8(&yaml).unwrap(),expected);
        verify_candidate(entry,xml.as_bytes(),&yaml,&inputs).unwrap();
    }
    let unknown=b"<Root><Entries><Item flag=\"fixed\">c</Item></Entries></Root>";
    let annotated=convert_file(entry,Direction::XmlToYaml,unknown,&inputs).unwrap().bytes;
    assert_eq!(std::str::from_utf8(&annotated).unwrap(),"Entries: !xml/invalid\n  - c");
    assert!(validate_file(entry,&annotated,&inputs).is_empty());
    assert!(!validate_file(entry,b"Entries: [c]",&inputs).is_empty());
    assert!(!validate_file(entry,b"Entries: !xml/invalid [a]",&inputs).is_empty());
    verify_candidate(entry,unknown,&annotated,&inputs).unwrap();
    let entry=entry_id("test.tree-list").unwrap();
    let xml="<Root><Entries><item><Mode>ready</Mode><Pair version=\"1\" mode=\"first\"><Code>a</Code><Text>b</Text></Pair></item></Entries></Root>";
    let candidate=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap().bytes;
    assert_eq!(std::str::from_utf8(&candidate).unwrap(),"Entries:\n  - Code: a\n    Text: b");
    for original in [xml.to_owned(),xml.replace("ready","changed"),xml.replace(" version=\"1\"",""),xml.replace("<Code>a</Code>","<Code>z</Code>").replace("mode=\"first\"","mode=\"other\"")] {
        let candidate=convert_file(entry,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap().bytes;
        verify_candidate(entry,original.as_bytes(),&candidate,&inputs).unwrap();
    }
    {
        let entry=entry_id("test.composite-fields").unwrap();
        let inputs=read_inputs(entry,b"languages: [ru]\nname: Hello").unwrap();
        let xml="<Root xmlns:v8='http://v8.1c.ru/8.1/data/core'><Entries amount='9007199254740993' label='kept' formatted='false'><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item><Detail>body</Detail></Entries></Root>";
        let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
        let yaml=String::from_utf8_lossy(&result.bytes);
        for expected in ["Amount: 9007199254740993","Label: kept","Detail: body"] {assert!(yaml.contains(expected),"{yaml}");}
        let independent="Entries:\n  Amount: 9007199254740993\n  Label: kept\n  Detail: body\n  Текст: Hello";
        let reverse=convert_file(entry,Direction::YamlToXml,independent.as_bytes(),&inputs).unwrap();
        let reversed=String::from_utf8_lossy(&reverse.bytes);
        assert!(reversed.contains("amount=\"9007199254740993\""),"{reversed}");
        assert!(!yaml.contains("!xml"),"{yaml}");
        verify_candidate(entry,xml.as_bytes(),&result.bytes,&inputs).unwrap();
        let reordered=xml.replace("amount='9007199254740993' label='kept' formatted='false'","formatted='false' amount='9007199254740993' label='kept'");
        let result=convert_file(entry,Direction::XmlToYaml,reordered.as_bytes(),&inputs).unwrap();
        assert!(String::from_utf8_lossy(&result.bytes).contains("!xml/raw"));
        verify_candidate(entry,reordered.as_bytes(),&result.bytes,&inputs).unwrap();
    }
    {
        let entry=entry_id("test.generic-fields").unwrap();
        let inputs=read_inputs(entry,b"languages: [ru]\nname: Hello").unwrap();
        for (amount,label,anomaly) in [("9007199254740993"," label='kept'",false),("001.20"," label='kept'",true),("wrong"," label='kept'",true),(""," label='kept'",true),("3","",true)] {
            let xml=format!("<Root xmlns:v8='http://v8.1c.ru/8.1/data/core' xmlns:q='urn:amount'><Bundle mode='First' q:amount='{amount}'{label}><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item><Detail>body</Detail></Bundle></Root>");
            let result=convert_file(entry,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
            let yaml=String::from_utf8_lossy(&result.bytes);
            assert_eq!(yaml.contains("!xml"),anomaly,"{yaml}");
            assert!(yaml.contains("Mode: one"),"{yaml}");
            assert!(yaml.contains("Detail: body"),"{yaml}");
            assert!(!yaml.contains("untitled"),"{yaml}");
            verify_candidate(entry,xml.as_bytes(),&result.bytes,&inputs).unwrap();
        }
    }
    composite_matrix();
    let composite=entry_id("test.composite").unwrap();
    let inputs=read_inputs(composite,b"languages: [ru, en]").unwrap();
    let diagnostics=validate_file(composite,"Entries:\n  Текст:\n    de: Hallo".as_bytes(),&inputs);
    assert_eq!(diagnostics[0].path,["Entries","Текст","de"]);
    assert_eq!(diagnostics[0].line,3);
    let empty=b"<Root><Entries formatted=\"true\"/></Root>";
    let result=convert_file(composite,Direction::XmlToYaml,empty,&inputs).unwrap();
    assert_eq!(result.bytes,"Entries:\n  Форматированный: Истина".as_bytes());
    verify_candidate(composite,empty,&result.bytes,&inputs).unwrap();
    for bad in ["Entries: {}","Entries: {Форматированный: Ложь}","Entries: {Other: value}","Entries: {Текст: []}","Entries: {Текст: Hello, Текст: Other}"] {
        assert!(!validate_file(composite,bad.as_bytes(),&inputs).is_empty(),"{bad}");
    }
    let missing_attr=b"<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Entries><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item></Entries></Root>";
    let value=convert_file(composite,Direction::XmlToYaml,missing_attr,&inputs).unwrap();
    assert_eq!(value.bytes,"Entries: !xml/raw\n  $значение:\n    Текст: Hello\n  $xml:\n    _formatted: null".as_bytes());
    verify_candidate(composite,missing_attr,&value.bytes,&inputs).unwrap();
    for original in [
        String::from_utf8(missing_attr.to_vec()).unwrap(),
        String::from_utf8(missing_attr.to_vec()).unwrap().replace("<Entries>","<Entries formatted='false'>"),
        String::from_utf8(missing_attr.to_vec()).unwrap().replace("<Entries>","<Entries xmlns:x='urn:extra' x:flag='kept'>"),
    ] {
        let converted=convert_file(composite,Direction::XmlToYaml,original.as_bytes(),&inputs).unwrap();
        let value=read_yaml_COMPOSITE_ID(&converted.bytes,&inputs.view()).unwrap();
        let mut repeated=String::new();
        write_yaml_into_COMPOSITE_ID(&value,&inputs.view(),&mut repeated).unwrap();
        verify_candidate(composite,original.as_bytes(),repeated.as_bytes(),&inputs).unwrap();
        let prepared=prepare_xml_COMPOSITE_ID(&value,&inputs.view()).unwrap();
        let mut namespaces=Vec::new();namespaces_xml_COMPOSITE_ID(&value,&prepared,&mut namespaces);
        let mut writer=core::xml::Writer::new(&namespaces);
        writer.field(&[("","Root"),("","Before")],"kept");
        write_xml_into_COMPOSITE_ID(&value,&prepared,&inputs.view(),&mut writer).unwrap();
        writer.field(&[("","Root"),("","After")],"kept");
        let expected=original.replacen("<Entries","<Before>kept</Before><Entries",1).replace("</Root>","<After>kept</After></Root>");
        core::proof::verify_with_attributes(expected.as_bytes(),&writer.finish(),|path|path.last().is_some_and(|name|matches!(name.local.as_str(),"Before"|"After"|"lang"|"content")),|_,name|name.namespace=="http://www.w3.org/2001/XMLSchema-instance" && name.local=="type").unwrap();
    }
    {
        let source="Before: kept\nEntries:\n  Текст: Hello\nAfter: kept".as_bytes();
        let mut value=None;let mut siblings=Vec::new();
        core::yaml::visit_scalar_events(core::yaml::Events(|consume:&mut core::yaml::Consumer<'_>| {
            value=Some(read_yaml_events_COMPOSITE_ID(source,&inputs.view(),core::yaml::PartitionSource {
                source:core::yaml::DocumentSource(source),select:|key:&str|key=="Entries",sibling:consume,
            })?);Ok(())
        }),|key,value,tag|{assert!(tag.is_none());siblings.push((key,value.into_text()?));Ok(())}).unwrap();
        assert_eq!(siblings,[("Before".into(),"kept".into()),("After".into(),"kept".into())]);
        let value=value.unwrap();
        assert_eq!(write_yaml_COMPOSITE_ID(&value,&inputs.view()).unwrap(),"Entries:\n  Текст: Hello".as_bytes());
        let mut joined=String::from("Before: kept");
        write_yaml_into_COMPOSITE_ID(&value,&inputs.view(),&mut joined).unwrap();
        core::yaml::append_encoded_properties(&mut joined,b"After: kept").unwrap();
        assert_eq!(joined,"Before: kept\nEntries:\n  Текст: Hello\nAfter: kept");
        let before=joined.clone();
        assert!(write_yaml_into_COMPOSITE_ID(&value,&PreparedInputs::default().view(),&mut joined).is_err());
        assert_eq!(joined,before);
        let bad="Before: kept\nEntries:\n  Текст:\n    de: Hallo".as_bytes();
        let value=read_yaml_events_COMPOSITE_ID(bad,&inputs.view(),core::yaml::PartitionSource {
            source:core::yaml::DocumentSource(bad),select:|key:&str|key=="Entries",sibling:|_,_|Ok(()),
        }).unwrap();
        let diagnostics=check_yaml_COMPOSITE_ID(&value,bad,&inputs.view());
        assert_eq!(diagnostics[0].path,["Entries","Текст","de"]);
        assert_eq!(diagnostics[0].line,4);
        let mut annotated=String::from("Before: kept");
        write_yaml_into_COMPOSITE_ID(&value,&inputs.view(),&mut annotated).unwrap();
        assert_eq!(annotated,"Before: kept\nEntries:\n  Текст:\n    !xml/invalid de: Hallo");
        let source=String::from_utf8(missing_attr.to_vec()).unwrap().replace("<Entries>","<Before>kept</Before><Entries formatted='false'>").replace("</Root>","<After>kept</After></Root>");
        let mut siblings=0;
        let value=read_xml_events_COMPOSITE_ID(source.as_bytes(),&inputs.view(),core::xml::Events(|consume:&mut core::xml::Consumer<'_>| {
            use crate::core::xml::Source;
            core::xml::DocumentSource(source.as_bytes()).visit(|path,token| {
                if path.get(1).is_some_and(|name|matches!(name.local.as_str(),"Before"|"After")) {
                    if matches!(token,core::xml::Token::Text("kept")) {siblings+=1;} Ok(())
                } else {consume(path,token)}
            })
        })).unwrap();
        assert_eq!(siblings,2);
        assert_eq!(write_yaml_COMPOSITE_ID(&value,&inputs.view()).unwrap(),"Entries:\n  Текст: Hello".as_bytes());
    }
    let changed=String::from_utf8(value.bytes).unwrap().replace("Hello","Changed");
    assert!(verify_candidate(composite,missing_attr,changed.as_bytes(),&inputs).is_err());
    for (flag,expected) in [("true","Entries:\n  Форматированный: Истина\n  Текст: Hello"),("false","Entries:\n  Текст: Hello")] {
        let xml=format!("<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Entries formatted=\"{flag}\"><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item></Entries></Root>");
        let value=convert_file(composite,Direction::XmlToYaml,xml.as_bytes(),&inputs).unwrap();
        assert_eq!(value.bytes,expected.as_bytes());
        assert!(validate_file(composite,&value.bytes,&inputs).is_empty());
        verify_candidate(composite,xml.as_bytes(),&value.bytes,&inputs).unwrap();
    }
    let integrated=entry_id("test.integrated-i8n").unwrap();
    let integrated_inputs=read_inputs(integrated, b"languages: [ru, en]\nname: TestTest").unwrap();
    let integrated_xml=b"<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Entries><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item></Entries></Root>";
    assert_eq!(convert_file(integrated, Direction::XmlToYaml, integrated_xml, &integrated_inputs).unwrap().bytes, b"Entries: Hello");
    assert!(validate_file(integrated, b"Entries: {ru: Hello, en: Other}", &integrated_inputs).is_empty());
    assert!(!validate_file(integrated, b"Entries: {en: Other, ru: Hello}", &integrated_inputs).is_empty());
    for profile in 0..16 {
        let entry=entry_id(&format!("test.profile-{profile}")).unwrap();
        let inputs=read_inputs(entry, b"languages: [ru, en]\nname: TestTest").unwrap();
        let normal=convert_file(entry, Direction::YamlToXml, b"Entries: Hello", &inputs).unwrap();
        let normal=String::from_utf8(normal.bytes).unwrap();
        assert_eq!(normal.contains(":type="), profile & 8 != 0, "profile {profile}");
        let empty=convert_file(entry, Direction::YamlToXml, b"Entries: \"\"", &inputs).unwrap();
        let empty=String::from_utf8(empty.bytes).unwrap();
        assert_eq!(empty.contains("<Entries"), profile & 4 == 0, "profile {profile}: {empty}");
        assert_eq!(empty.contains(":type="), profile & 8 != 0 && profile & 7 == 0, "profile {profile}: {empty}");
        assert_eq!(empty.contains(":item>"), profile & 7 == 0, "profile {profile}: {empty}");
        for content in ["", "<Entries/>", "<Entries xsi:nil=\"true\"/>", "<Entries><v8:item><v8:lang>ru</v8:lang><v8:content/></v8:item></Entries>", "<Entries xsi:type=\"v8:LocalStringType\"><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item></Entries>"] {
            let xml=format!("<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">{content}</Root>");
            let yaml=convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap_or_else(|error| panic!("profile {profile}, {content}: {error:?}"));
            verify_candidate(entry, xml.as_bytes(), &yaml.bytes, &inputs).unwrap();
        }

    }
    let foldable=entry_id("test.profile-2").unwrap();
    let foldable_inputs=read_inputs(foldable, b"languages: [ru, en]\nname: TestTest").unwrap();
    let physical_empty=b"<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Entries><v8:item><v8:lang>ru</v8:lang><v8:content/></v8:item></Entries></Root>";
    let preserved=convert_file(foldable, Direction::XmlToYaml, physical_empty, &foldable_inputs).unwrap();
    assert_eq!(preserved.bytes, "Entries: !xml/raw\n  $значение: \"\"\n  $xml:\n    v8:item:\n      v8:lang: ru\n      v8:content:".as_bytes());
    assert!(validate_file(foldable, &preserved.bytes, &foldable_inputs).is_empty());
    verify_candidate(foldable, physical_empty, &preserved.bytes, &foldable_inputs).unwrap();
    let changed=String::from_utf8(preserved.bytes.clone()).unwrap().replace("v8:lang: ru", "v8:lang: en");
    assert!(verify_candidate(foldable, physical_empty, changed.as_bytes(), &foldable_inputs).is_err());
    let broken=String::from_utf8(preserved.bytes).unwrap().replace("$xml:", "$unknown:");
    assert!(!validate_file(foldable, broken.as_bytes(), &foldable_inputs).is_empty());

    let mixed=b"<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Entries><v8:item><v8:lang/><v8:content>Service</v8:content></v8:item><v8:item><v8:lang>de</v8:lang><v8:content>Text</v8:content></v8:item></Entries></Root>";
    let mixed_yaml=convert_file(integrated,Direction::XmlToYaml,mixed,&integrated_inputs).unwrap();
    assert!(String::from_utf8_lossy(&mixed_yaml.bytes).contains("!xml/invalid de"));
    assert!(validate_file(integrated,&mixed_yaml.bytes,&integrated_inputs).is_empty());
    verify_candidate(integrated,mixed,&mixed_yaml.bytes,&integrated_inputs).unwrap();
    assert!(!validate_file(integrated,b"Entries: {\"\": Service, ru: \"\"}",&integrated_inputs).is_empty());
    let folded_tag=b"Entries:\n  !xml/invalid de: Andere";
    assert!(validate_file(foldable, folded_tag, &foldable_inputs).is_empty());
    let restored=convert_file(foldable, Direction::YamlToXml, folded_tag, &foldable_inputs).unwrap();
    let restored=String::from_utf8(restored.bytes).unwrap();
    assert!(restored.contains("Test test") && restored.contains("Andere"));
    for (entry, inputs, body, expected) in [
        (integrated, &integrated_inputs, "<v8:item><v8:lang/><v8:content>Service</v8:content></v8:item><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item>", "Entries:\n  : Service\n  ru: Hello"),
        (integrated, &integrated_inputs, "<v8:item><v8:lang>de</v8:lang><v8:content>Eins</v8:content></v8:item><v8:item><v8:lang>de</v8:lang><v8:content>Zwei</v8:content></v8:item>", "Entries:\n  !xml/invalid de: Eins\n  !xml/invalid/2 de: Zwei"),
        (integrated, &integrated_inputs, "<v8:item><v8:lang>en</v8:lang><v8:content>Other</v8:content></v8:item><v8:item><v8:lang>ru</v8:lang><v8:content>Hello</v8:content></v8:item>", "Entries: !xml/invalid\n  en: Other\n  ru: Hello"),
        (foldable, &foldable_inputs, "<v8:item><v8:lang>ru</v8:lang><v8:content>Test test</v8:content></v8:item><v8:item><v8:lang>en</v8:lang><v8:content>Other</v8:content></v8:item>", "Entries:\n  en: Other"),
    ] {
        let xml=format!("<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\"><Entries>{body}</Entries></Root>");
        let result=convert_file(entry, Direction::XmlToYaml, xml.as_bytes(), inputs).unwrap();
        assert_eq!(result.bytes, expected.as_bytes());
        assert!(validate_file(entry, expected.as_bytes(), inputs).is_empty());
        assert!(verify_candidate(entry, xml.as_bytes(), expected.as_bytes(), inputs).is_ok());
    }
    let entry=entry_id("test.dictionary").unwrap();
    let inputs=PreparedInputs::default();
    let xml=b"<Root><Entries><item><key>ru</key><text>one</text></item><item><key>en</key><text>two</text></item><item><key>ru</key><text>three</text></item></Entries></Root>";
    let expected=b"Entries:\n  ru: one\n  en: two\n  !xml/invalid ru: three";
    let yaml=convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap();
    assert_eq!(yaml.bytes, expected);
    let restored=convert_file(entry, Direction::YamlToXml, expected, &inputs).unwrap();
    assert_eq!(convert_file(entry, Direction::XmlToYaml, &restored.bytes, &inputs).unwrap().bytes, expected);
    assert!(validate_file(entry, expected, &inputs).is_empty());
    assert!(verify_candidate(entry, xml, b"Entries:\n  ru: CHANGED\n  en: two\n  ru: three", &inputs).is_err());
    let duplicate=b"<Root><Entries><item><key>ru</key><text>one</text><text>two</text></item></Entries></Root>";
    let preserved=convert_file(entry,Direction::XmlToYaml,duplicate,&inputs).unwrap();
    assert!(std::str::from_utf8(&preserved.bytes).unwrap().contains("Entries: !xml/raw"));
    verify_candidate(entry,duplicate,&preserved.bytes,&inputs).unwrap();
    assert!(validate_file(entry, b"Entries: {ru: {nested: x}}", &inputs).iter().any(|error| error.severity == Severity::Error));
    let single=convert_file(entry, Direction::XmlToYaml, b"<Root><Entries><item><key>ru</key><text>Hello</text></item></Entries></Root>", &inputs).unwrap();
    assert_eq!(single.bytes, b"Entries: Hello");
    let decoded=convert_file(entry, Direction::YamlToXml, b"Entries: Hello", &inputs).unwrap();
    assert_eq!(convert_file(entry, Direction::XmlToYaml, &decoded.bytes, &inputs).unwrap().bytes, b"Entries: Hello");
    let errors=validate_file(entry, b"Entries:\n  ru: bad", &inputs);
    assert_eq!(errors[0].code.as_deref(), Some("text.forbidden"));
    assert_eq!(errors[0].path, ["Entries", "ru"]);
    assert_eq!(errors[0].message, "Forbidden: bad");
    assert_eq!((errors[0].line, errors[0].column), (2, 3));
    assert_eq!(convert_file(entry, Direction::XmlToYaml, b"<Root><Entries><item><key>ru</key><text>bad</text></item></Entries></Root>", &inputs).unwrap().bytes, b"Entries:\n  !xml/invalid ru: bad");
    assert!(validate_file(entry, b"Entries:\n  !xml/invalid ru: bad", &inputs).is_empty());
    assert!(validate_file(entry, b"Entries:\n  !xml/invalid ru: good", &inputs).iter().any(|error| error.code.as_deref()==Some("xml/anomaly-tag-unnecessary")));
    assert!(validate_file(entry, b"Entries: !xml/invalid\n  ru: bad", &inputs).iter().any(|error| error.code.as_deref()==Some("text.forbidden")));
    let errors=validate_file(entry, b"Entries:\n  ru: good\n  en: good\n  ru: bad\n  ru: bad", &inputs);
    assert_eq!(errors.iter().filter(|error| error.code.as_deref()==Some("text.forbidden")).map(|error| error.occurrence.unwrap().get()).collect::<Vec<_>>(), [2, 3]);
    let sorted=entry_id("test.sorted-dictionary").unwrap();
    for (yaml, valid) in [("Entries: {ru: first, en: second}", true), ("Entries: {en: first, ru: second}", false), ("Entries: {ru: first, !xml/invalid ru: second}", true), ("Entries: {ru: first, en: second, !xml/invalid ru: third}", true), ("Entries: {en: first, ru: second, !xml/invalid en: third}", false), ("Entries: {𐀀: first, : second}", true), ("Entries: {: first, 𐀀: second}", false)] {
        let diagnostics=validate_file(sorted, yaml.as_bytes(), &inputs);
        assert_eq!(diagnostics.is_empty(), valid, "{yaml}: {diagnostics:?}");
        if !valid { assert_eq!(diagnostics[0].path, ["Entries"]); }
    }
    assert!(validate_file(entry, b"Entries: mapping-only", &inputs).is_empty());
    assert_eq!(validate_file(entry, b"Entries: {ru: mapping-only}", &inputs)[0].code.as_deref(), Some("collection.mapping-only"));
    let absent=convert_file(entry, Direction::XmlToYaml, b"<Root/>", &inputs).unwrap();
    assert_eq!(absent.bytes, b"");
    assert!(validate_file(entry, b"", &inputs).is_empty());
    assert!(validate_file(entry, b"{}", &inputs).is_empty());
    assert!(verify_candidate(entry, b"<Root/>", b"Entries: {}", &inputs).is_err());
    let derived=entry_id("test.derived-dictionary").unwrap();
    for (xml, yaml) in [("<Root/>", "Entries: {}"), ("<Root><Entries/></Root>", "Entries: \"\""), ("<Root><Entries><item><key>ru</key><text>Default</text></item></Entries></Root>", "") ] {
        assert_eq!(convert_file(derived, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap().bytes, yaml.as_bytes());
        assert!(verify_candidate(derived, xml.as_bytes(), yaml.as_bytes(), &inputs).is_ok());
    }
    assert_eq!(convert_file(derived, Direction::XmlToYaml, b"<Root><Entries><item><key>ru</key><text/></item></Entries></Root>", &inputs).unwrap().bytes, b"Entries:\n  ru: \"\"");
    let normalized=entry_id("test.normalized-dictionary").unwrap();
    let preserved=convert_file(normalized, Direction::XmlToYaml, b"<Root><Entries/></Root>", &inputs).unwrap();
    verify_candidate(normalized, b"<Root><Entries/></Root>", &preserved.bytes, &inputs).unwrap();
    assert_eq!(convert_file(normalized, Direction::XmlToYaml, b"<Root><Entries><item><key>ru</key><text/></item></Entries></Root>", &inputs).unwrap().bytes, b"Entries: \"\"");
    let canonical=entry_id("test.canonical-dictionary").unwrap();
    assert_eq!(convert_file(canonical, Direction::YamlToXml, b"Entries: \"\"", &inputs).unwrap().bytes, "\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Root></Root>".as_bytes());
    let both=convert_file(canonical, Direction::YamlToXml, b"Entries:\n  ru: \"\"\n  !xml/invalid ru: second", &inputs).unwrap();
    let both=String::from_utf8(both.bytes).unwrap();
    assert_eq!(both.matches("<item>").count(), 2);
    assert!(both.contains("second"));
    let patterned=entry_id("test.patterned-dictionary").unwrap();
    for (xml, expected) in [("<Root><Entries><item><key>ru</key><text>Default</text></item><item><key>en</key><text>Other</text></item></Entries></Root>", "Entries:\n  en: Other"), ("<Root><Entries><item><key>en</key><text>Other</text></item></Entries></Root>", "Entries:\n  ru: \"\"\n  en: Other")] {
        let result=convert_file(patterned, Direction::XmlToYaml, xml.as_bytes(), &inputs).unwrap();
        assert_eq!(result.bytes, expected.as_bytes());
        assert!(verify_candidate(patterned, xml.as_bytes(), expected.as_bytes(), &inputs).is_ok());
    }
    let duplicate=b"Entries:\n  ru: Default\n  en: Other\n  !xml/invalid ru: Second";
    let xml=convert_file(patterned, Direction::YamlToXml, duplicate, &inputs).unwrap();
    assert_eq!(convert_file(patterned, Direction::XmlToYaml, &xml.bytes, &inputs).unwrap().bytes, duplicate);
    let named=entry_id("test.named-dictionary").unwrap();
    let named_inputs=read_inputs(named, b"ownerName: TestTest").unwrap();
    let xml=b"<Root><Entries><item><key>ru</key><text>Test test</text></item><item><key>en</key><text>Other</text></item></Entries></Root>";
    assert_eq!(convert_file(named, Direction::XmlToYaml, xml, &named_inputs).unwrap().bytes, b"Entries:\n  en: Other");
    for source in ["{}", "ownerName: '!!!'"] {
        let inputs=read_inputs(named, source.as_bytes()).unwrap();
        let foreign=b"<Root><Entries><item><key>en</key><text>Other</text></item></Entries></Root>";
        assert_eq!(convert_file(named, Direction::XmlToYaml, foreign, &inputs).unwrap().bytes, b"Entries:\n  ru: \"\"\n  en: Other");
    }
    let typed=entry_id("test.typed-dictionary").unwrap();
    let typed_xml=b"<Root xmlns:a=\"urn:attr\" xmlns:b=\"urn:value\"><Entries a:type=\"b:Kind\"><item><key>ru</key><text>Hello</text></item></Entries></Root>";
    assert_eq!(convert_file(typed, Direction::XmlToYaml, typed_xml, &inputs).unwrap().bytes, b"Entries: Hello");
    assert!(verify_candidate(typed, typed_xml, b"Entries: Hello", &inputs).is_ok());
    let untyped_xml=b"<Root><Entries><item><key>ru</key><text>Hello</text></item></Entries></Root>";
    let preserved=convert_file(typed, Direction::XmlToYaml, untyped_xml, &inputs).unwrap();
    verify_candidate(typed, untyped_xml, &preserved.bytes, &inputs).unwrap();
    let untyped=entry_id("test.untyped-dictionary").unwrap();
    assert_eq!(convert_file(untyped, Direction::XmlToYaml, untyped_xml, &inputs).unwrap().bytes, b"Entries: Hello");
    let nil=entry_id("test.nil-dictionary").unwrap();
    let nil_xml=b"<Root xmlns:s=\"http://www.w3.org/2001/XMLSchema-instance\"><Entries s:nil=\"true\"/></Root>";
    assert_eq!(convert_file(nil, Direction::XmlToYaml, nil_xml, &inputs).unwrap().bytes, b"");
    assert!(verify_candidate(nil, nil_xml, b"{}", &inputs).is_ok());
    let invalid_nil=b"<Root xmlns:s=\"http://www.w3.org/2001/XMLSchema-instance\"><Entries s:nil=\"true\"><item><key>ru</key><text>text</text></item></Entries></Root>";
    assert_eq!(convert_file(nil, Direction::XmlToYaml, invalid_nil, &inputs).unwrap_err()[0].code.as_deref(), Some("xml.nil-content"));
    let empty=convert_file(entry, Direction::XmlToYaml, b"<Root><Entries/></Root>", &inputs).unwrap();
    assert_eq!(empty.bytes, b"Entries: {}");
}"#).unwrap();
    let main = fs::read_to_string(root.join("src/main.rs"))
        .unwrap()
        .replace("COMPOSITE_ID", &composite_id.to_string())
        .replace("COLLECTION_ID", &collection_id.to_string())
        .replace("LIST_ID", &list_id.to_string())
        .replace("DEPENDENT_ID", &dependent_id.to_string());
    let main = main.replacen(
        "fn main() {",
        "fn main() { independent_corpus(); profile_matrix(); { let entry=entry_id(\"test.default-container\").unwrap(); let inputs=read_inputs(entry,b\"{}\").unwrap(); let original=b\"<Root/>\"; let expected=b\"Entries: !xml/raw\\n  $xml: null\"; let result=convert_file(entry,Direction::XmlToYaml,original,&inputs).unwrap(); assert_eq!(result.bytes,expected); verify_candidate(entry,original,expected,&inputs).unwrap(); }",
        1,
    );
    fs::write(
        root.join("src/main.rs"),
        main + &corpus_checks() + &matrix_checks() + &composite_matrix_checks(),
    )
    .unwrap();
    for args in [
        vec!["+1.98.1", "run", "--offline", "--quiet"],
        vec![
            "+1.98.1",
            "clippy",
            "--offline",
            "--quiet",
            "--",
            "-D",
            "warnings",
        ],
    ] {
        let output = Command::new("cargo")
            .args(args)
            .current_dir(&root)
            .output()
            .unwrap();
        if let Ok(path) = std::env::var("NKDK_I8N_MATRIX_OUTPUT")
            && !output.stdout.is_empty()
        {
            fs::write(path, &output.stdout).unwrap();
        }
        assert!(
            output.status.success(),
            "{}: {}",
            root.display(),
            String::from_utf8_lossy(&output.stderr)
        );
    }
    fs::remove_dir_all(root).unwrap();
}

fn corpus_checks() -> String {
    use serde_json::Value;
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let manifest: Value = serde_json::from_slice(
        &fs::read(repository.join("tests/conversion-corpus/manifest.json")).unwrap(),
    )
    .unwrap();
    let mut code = String::from("\nfn independent_corpus() {\n");
    let mut count = 0;
    for case in manifest["cases"].as_array().unwrap() {
        if case["group"] != "i8n-text" {
            continue;
        }
        let context: Value = serde_json::from_slice(
            &fs::read(repository.join(case["context"].as_str().unwrap())).unwrap(),
        )
        .unwrap();
        if context["entry"] != "migration.i8n-text-probe" {
            continue;
        }
        assert_eq!(context["defaultLanguage"], "ru");
        assert_eq!(
            context["registeredLanguages"],
            serde_json::json!(["ru", "en"])
        );
        assert_eq!(
            context["xmlFragmentNamespaces"],
            serde_json::json!({"v8":"http://v8.1c.ru/8.1/data/core"})
        );
        let parameters = [
            "preserveEmptyXML",
            "excludeIfEqualNameYAML",
            "skipEmptyToXML",
            "typedXML",
        ];
        let profile = parameters
            .iter()
            .enumerate()
            .fold(0, |profile, (bit, key)| {
                profile
                    | (usize::from(context["parameters"][key].as_bool().unwrap_or(false)) << bit)
            });
        let mut xml =
            fs::read_to_string(repository.join(case["inputs"]["xml"]["path"].as_str().unwrap()))
                .unwrap();
        if xml.starts_with("<Title") {
            xml = format!("<Root>{xml}</Root>");
        }
        assert!(xml.starts_with("<Root>"));
        xml = xml.replacen(
            "<Root>",
            "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\">",
            1,
        );
        let yaml =
            fs::read_to_string(repository.join(case["expectations"]["yaml"].as_str().unwrap()))
                .unwrap();
        let name = context["name"].as_str().unwrap_or("");
        let input = format!(
            "languages: [ru, en]\nname: {}",
            serde_json::to_string(name).unwrap()
        );
        let id = case["id"].as_str().unwrap();
        code.push_str(&format!(r#"{{
            let entry=entry_id("test.corpus-{profile}").unwrap();
            let inputs=read_inputs(entry, {input:?}.as_bytes()).unwrap();
            let xml={xml:?}.as_bytes(); let expected={yaml:?}.as_bytes();
            let result=convert_file(entry, Direction::XmlToYaml, xml, &inputs).unwrap_or_else(|error| panic!("{{}}: {{error:?}}", {id:?}));
            assert_eq!(String::from_utf8(result.bytes.clone()).unwrap(), std::str::from_utf8(expected).unwrap(), "{{}}", {id:?});
            assert!(validate_file(entry, expected, &inputs).is_empty(), "{{}}", {id:?});
            verify_candidate(entry, xml, expected, &inputs).unwrap();
            verify_candidate(entry, xml, &result.bytes, &inputs).unwrap();
        }}
"#));
        count += 1;
    }
    assert_eq!(
        count, 12,
        "Independent I8nText coverage changed; review the cases"
    );
    code.push_str("}\n");
    code
}

fn matrix_checks() -> String {
    let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let observations: serde_json::Value = serde_json::from_slice(
        &fs::read(repository.join("tests/migration/i8n-full-round-trip-observations.json"))
            .unwrap(),
    )
    .unwrap();
    let mut code = String::from("\nfn profile_matrix() { let mut failed=0;\n");
    for row in observations["rows"].as_array().unwrap() {
        let profile = row["profile"].as_u64().unwrap();
        let case = row["case"].as_str().unwrap();
        let xml=row["sourceXML"].as_str().unwrap().replacen("<Root>", "<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">",1);
        let expected = matrix_expected(row);
        let mut inputs = String::from("languages: [ru, en]");
        if let Some(name) = row["name"].as_str() {
            inputs.push_str(&format!("\nname: {}", serde_json::to_string(name).unwrap()));
        }
        code.push_str(&format!(r#"{{
          let entry=entry_id("test.corpus-{profile}").unwrap();
          let inputs=read_inputs(entry,{inputs:?}.as_bytes()).unwrap();
          let xml={xml:?}.as_bytes();
          match convert_file(entry,Direction::XmlToYaml,xml,&inputs) {{
            Ok(value)=>{{
              assert_eq!(std::str::from_utf8(&value.bytes).unwrap(), {expected:?}, "profile {profile} {case}");
              let issues=validate_file(entry,&value.bytes,&inputs);
              let proof=verify_candidate(entry,xml,&value.bytes,&inputs);
              if !issues.is_empty() || proof.is_err() {{ failed+=1; eprintln!("{profile} {case}: {{issues:?}} {{proof:?}}"); }}
              let encoded=value.bytes.iter().map(|byte| format!("{{byte:02x}}")).collect::<String>();
              println!("MATRIX\t{profile}\t{case}\t{{encoded}}");
            }},
            Err(errors)=>{{failed+=1; eprintln!("{profile} {case}: {{errors:?}}");}},
          }}
        }}
"#));
    }
    code.push_str("assert_eq!(failed,0,\"Full profile matrix has failures\"); }\n");
    code
}

// Independent expectations for the approved corrections to the recorded TS
// behavior. All other rows retain the exact original YAML expectation.
fn matrix_expected(row: &serde_json::Value) -> String {
    // A present empty container is explicit empty text; null removes it.
    if row["case"] == "empty-container"
        && let Some(yaml) = row["yaml"].as_str()
        && yaml.ends_with("$xml:")
    {
        return format!("{yaml} \"\"");
    }
    let profile = row["profile"].as_u64().unwrap();
    let case = row["case"].as_str().unwrap();
    let typed = profile & 8 != 0;
    let foldable = profile & 2 != 0;
    let type_patch = |yaml: &str| {
        if !typed {
            return yaml.to_owned();
        }
        let meaning = if yaml.is_empty() {
            String::new()
        } else {
            format!(
                "\n  $значение:{}",
                yaml.strip_prefix("Заголовок:")
                    .unwrap()
                    .replace('\n', "\n  ")
            )
        };
        format!("Заголовок: !xml/raw{meaning}\n  $xml:\n    _xsi:type: null")
    };
    if case == "noncanonical-order" {
        return type_patch("Заголовок: !xml/invalid\n  en: Text\n  ru: Текст");
    }
    if case == "empty-first-duplicate" {
        return type_patch(if foldable {
            "Заголовок:\n  ru: \"\"\n  !xml/invalid ru: Второй"
        } else {
            "Заголовок:\n  !xml/invalid ru: \"\"\n  !xml/invalid/2 ru: Второй"
        });
    }
    if foldable && case == "equal-name-with-foreign" {
        return type_patch("Заголовок:\n  en: Text");
    }
    if foldable && case == "equal-name" {
        return type_patch("");
    }
    if row["outcome"] != "preserved" {
        let payload = match case {
            "empty-container" => " \"\"",
            "empty-primary" => "\n    v8:item:\n      v8:lang: ru\n      v8:content:",
            "typed-empty" => "\n    _xsi:type: v8:LocalStringType",
            "nil" => "\n    _xsi:nil: \"true\"",
            _ => panic!("Unreviewed TS failure: {case}"),
        };
        return format!("Заголовок: !xml/raw\n  $значение: \"\"\n  $xml:{payload}");
    }
    row["yaml"].as_str().unwrap().to_owned()
}

fn composite_matrix_checks() -> String {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let observations: serde_json::Value = serde_json::from_slice(
        &fs::read(root.join("tests/migration/i8n-full-round-trip-observations.json")).unwrap(),
    )
    .unwrap();
    let mut code =
        String::from("\nfn composite_matrix() { let mut failed=0; let mut verified=0;\n");
    for row in observations["rows"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|row| row["profile"] == 0)
    {
        let case = row["case"].as_str().unwrap();
        for flag in ["true", "false", "missing"] {
            let xml=row["sourceXML"].as_str().unwrap().replacen("<Root>","<Root xmlns:v8=\"http://v8.1c.ru/8.1/data/core\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">",1).replace("Title","Entries");
            let xml = if flag == "missing" {
                xml
            } else {
                xml.replace("<Entries", &format!("<Entries formatted=\"{flag}\""))
            };
            let xml = if case == "typed-text" && flag == "true" {
                xml.replace(
                    "formatted=\"true\" xsi:type=\"v8:LocalStringType\"",
                    "xsi:type=\"v8:LocalStringType\" formatted=\"true\"",
                )
            } else {
                xml
            };
            code.push_str(&format!(r#"for profile in 0..32 {{
let entry=entry_id(&format!("test.composite-{{profile}}")).unwrap();
let inputs=read_inputs(entry,b"languages: [ru, en]\nname: TestName").unwrap();
let xml={xml:?}.as_bytes();
match convert_file(entry,Direction::XmlToYaml,xml,&inputs) {{
Ok(value)=>{{let issues=validate_file(entry,&value.bytes,&inputs);let proof=verify_candidate(entry,xml,&value.bytes,&inputs);if !issues.is_empty() || proof.is_err() {{failed+=1;eprintln!("{{profile}} {case} {flag}: {{issues:?}} {{proof:?}}");}} else {{verified+=1;}}}},
Err(error)=>{{failed+=1;eprintln!("{{profile}} {case} {flag}: {{error:?}}");}}
}}
}}
"#));
        }
    }
    code.push_str("assert_eq!(failed,0,\"Composite profile matrix\"); assert_eq!(verified,1536); println!(\"COMPOSITE\\t{verified}\"); }\n");
    code
}

#[test]
fn composite_requires_explicit_xml_absence_semantics() {
    let flag = include_str!("../../../declarations/common/boolean-flag.yaml");
    let flag = flag.replace("    xml:\n      missing: {denotes: {literal: false}}\n", "");
    let sources = [
        SourceFile {
            path: "flag.yaml",
            bytes: flag.as_bytes(),
        },
        SourceFile {
            path: "text.yaml",
            bytes: include_bytes!("../../../declarations/common/i8n-text.yaml"),
        },
        SourceFile {
            path: "formatted.yaml",
            bytes: include_bytes!("../../../declarations/common/formatted-i8n-text.yaml"),
        },
        SourceFile {
            path: "owner.yaml",
            bytes: include_bytes!("../../../declarations/probes/formatted-i8n-ordinary.yaml"),
        },
    ];
    assert!(
        compile(&sources).is_err(),
        "XML absence must not inherit YAML defaults silently"
    );
}
