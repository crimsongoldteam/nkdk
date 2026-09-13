use super::*;
use std::fmt::Write;

fn reader_state(name: &str, members: &[(&str, String, String)]) -> (String, String) {
    let fields = members
        .iter()
        .map(|(name, kind, _)| format!("{name}:{kind}"))
        .collect::<Vec<_>>()
        .join(",");
    let initial = members
        .iter()
        .map(|(name, _, value)| format!("{name}:{value}"))
        .collect::<Vec<_>>()
        .join(",");
    let bindings = members
        .iter()
        .map(|(name, _, _)| *name)
        .collect::<Vec<_>>()
        .join(",");
    (
        format!("struct {name}{{{fields}}} impl {name}{{fn new()->Self{{Self{{{initial}}}}}}}"),
        bindings,
    )
}

pub(super) fn generate(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Option<String>, Diagnostic> {
    generate_embedded(entry, program, "")
}
pub(super) fn generate_embedded(
    entry: &LinkedEntry,
    program: &Program,
    visibility: &str,
) -> Result<Option<String>, Diagnostic> {
    let LinkedType::Record(fields) = &entry.value else {
        return Ok(None);
    };
    if fields.len() != 1 {
        return Ok(None);
    }
    let Some((reference, bindings, arguments)) = fields[0].value.as_reference() else {
        return Ok(None);
    };
    let common = program
        .entries
        .iter()
        .find(|value| value.id == reference)
        .expect("linked common");
    let LinkedType::Sequence(item) = &common.value else {
        return Ok(None);
    };
    // References with no common inputs already address the owner's prepared slots.
    let inherited = super::inputs::identity(entry);
    let bindings = if bindings.is_empty() && common.inputs.is_empty() {
        inherited.as_slice()
    } else {
        bindings
    };
    if matches!(common.yaml, YamlRepresentation::TextSequence { .. }) {
        return Ok(None);
    }
    let mut shape = entry.clone();
    shape.presence.clear();
    plain_shape(&shape)?;
    if !entry.constraints.is_empty() {
        return Err(unsupported(
            entry,
            "Collection constraints or presence are not generated yet",
        ));
    }
    let typed = super::collection_values::codec(common, program)?;
    let scalar_items =
        typed.is_some() || matches!(item.as_ref(), LinkedType::Scalar(ScalarType::Text));
    let scalar_fields = vec![LinkedField {
        name: "value".into(),
        value: *item.clone(),
        source: common.source.clone(),
    }];
    let items = match item.as_ref() {
        LinkedType::Record(items) => items,
        LinkedType::Scalar(ScalarType::Text) | LinkedType::Reference(_) => &scalar_fields,
        _ => {
            return Err(unsupported(
                common,
                "Sequence items require text or text records",
            ));
        }
    };
    let (common_xml, declared_attributes) = super::attributes::content(&common.xml);
    let (
        LinkedXml::Record(owner_xml),
        YamlRepresentation::Mapping(owner_yaml),
        LinkedXml::ElementSequence {
            path: relative,
            item: xml_item,
        },
    ) = (&entry.xml, &entry.yaml, common_xml)
    else {
        return Err(unsupported(
            entry,
            "Sequence representations are not generated",
        ));
    };
    let (xml_item, item_attributes) = super::attributes::content(xml_item);
    let rooted_tree = !item_attributes.is_empty();
    let is_tree = rooted_tree || matches!(xml_item, LinkedXml::Tree(_));
    let direct_item = rooted_tree || (scalar_items && !is_tree);
    let mut item_parent: Vec<_> = owner_xml[0].path.iter().chain(relative).cloned().collect();
    let rooted_nodes;
    let nodes = if rooted_tree {
        if !matches!(xml_item, LinkedXml::Text) || !scalar_items || relative.is_empty() {
            return Err(unsupported(
                entry,
                "Attributed sequence items currently require text",
            ));
        }
        rooted_nodes = vec![XmlTreeNode {
            name: item_parent.pop().expect("item route"),
            attributes: item_attributes
                .iter()
                .map(|attribute| (*attribute).clone())
                .collect(),
            content: XmlTreeContent::SelfValue,
            source: common.source.clone(),
        }];
        Some(rooted_nodes.as_slice())
    } else if let LinkedXml::Tree(nodes) = xml_item {
        Some(nodes.as_slice())
    } else {
        None
    };
    let mut tree = if let Some(nodes) = nodes {
        super::xml_tree::lower(
            entry,
            nodes,
            items,
            &item_parent,
            program,
            bindings,
            arguments,
        )?
    } else {
        super::xml_tree::Tree::default()
    };
    if rooted_tree {
        for field in &mut tree.fields {
            field.path.remove(0);
        }
    }
    let scalar_xml = vec![LinkedXmlField {
        file: None,
        field: "value".into(),
        path: vec![],
        attribute: None,
        source: common.source.clone(),
    }];
    let xml_fields = match xml_item {
        LinkedXml::Record(fields) => fields,
        LinkedXml::Tree(_) => &tree.fields,
        LinkedXml::Text if scalar_items => &scalar_xml,
        _ => {
            return Err(unsupported(
                entry,
                "Sequence XML item requires text or a record",
            ));
        }
    };
    let ordinary = matches!(common.yaml, YamlRepresentation::Sequence { .. });
    if items.is_empty() {
        return Err(unsupported(
            common,
            "Empty sequence records are not generated",
        ));
    }
    let (key, value) = match &common.yaml {
        YamlRepresentation::KeyedMapping { key, value, .. } if items.len() == 2 => {
            (key.as_str(), value.as_str())
        }
        YamlRepresentation::Sequence { .. } => (items[0].name.as_str(), items[0].name.as_str()),
        _ => {
            return Err(unsupported(
                entry,
                "Sequence YAML representation is not generated",
            ));
        }
    };
    if typed.is_none()
        && (items.is_empty()
            || items
                .iter()
                .any(|field| field.value != LinkedType::Scalar(ScalarType::Text)))
    {
        return Err(unsupported(entry, "Sequence requires text fields"));
    }
    if ordinary && (!common.shorthands.is_empty() || common.normalization.is_some()) {
        return Err(unsupported(
            common,
            "Ordinary sequence constraints and shorthands require typed lowering",
        ));
    }
    let count = items.len();
    let keep_form = common.constraints.iter().any(|rule| {
        rule.applies_to.contains(&ValidationPhase::YamlValidation) && !rule.forms.is_empty()
    });
    let form_member = if keep_form {
        ", form: core::yaml::Form"
    } else {
        ""
    };
    let form_xml = if keep_form {
        ", form: core::yaml::Form::Missing"
    } else {
        ""
    };
    let form_yaml = if keep_form { ", form" } else { "" };
    let form_mapping = if keep_form {
        "self.form=core::yaml::Form::Mapping;"
    } else {
        ""
    };
    let keep_rows = !ordinary; // Duplicate-key diagnostics always need the original key position.
    let keep_self = typed.is_some()
        || common
            .constraints
            .iter()
            .any(|rule| matches!(rule.diagnostic.at, LinkedDiagnosticTarget::SelfValue));
    let row_member = if keep_rows {
        &format!(", positions: [core::Position; {count}]")
    } else {
        ""
    };
    let self_member = if keep_self {
        ", position: core::Position"
    } else {
        ""
    };
    let self_init = if keep_self { ", position" } else { "" };
    let self_xml = if keep_self {
        "*position=core::Position::xml(_offset);"
    } else {
        ""
    };
    let self_yaml = if keep_self {
        "self.position=_position;"
    } else {
        ""
    };
    let shorthand = super::shorthand::scalar(entry, common, program, bindings, arguments, items)?;
    let key_index = items
        .iter()
        .position(|field| field.name == key)
        .expect("linked key");
    let text_index = items
        .iter()
        .position(|field| field.name == value)
        .expect("linked value");
    let unwrapped = relative.is_empty();
    let route = &owner_xml[0].path;
    if route.is_empty()
        || (unwrapped && (route.len() < 3 || !declared_attributes.is_empty()))
        || owner_xml[0].attribute.is_some()
    {
        return Err(unsupported(entry, "Sequence needs element routes"));
    }
    let parent = if unwrapped {
        &route[..route.len() - 1]
    } else {
        route.as_slice()
    };
    let attributes = super::attributes::generate(
        entry,
        common,
        program,
        bindings,
        arguments,
        &declared_attributes,
        parent,
    )?;
    let attribute_read = &attributes.read;
    let attribute_write = &attributes.write;
    let qname_attributes =
        std::iter::once(attributes.qnames.clone())
            .chain(tree.qnames.iter().map(|(uri, local)| {
                format!("(_name.namespace=={uri:?} && _name.local=={local:?})")
            }))
            .collect::<Vec<_>>()
            .join(" || ");
    let owner_presence =
        super::collection_presence::override_for(common, entry, bindings, arguments)?;
    let presence_common = owner_presence.as_ref().unwrap_or(common);
    let presence_bindings: Vec<_> = if owner_presence.is_some() {
        super::inputs::identity(entry)
    } else {
        bindings.to_vec()
    };
    let presence = super::presence::generate(
        presence_common,
        entry,
        program,
        &presence_bindings,
        if owner_presence.is_some() {
            &[]
        } else {
            arguments
        },
        &owner_yaml[0].key,
        parent,
    )?;
    let xml_missing = presence.xml_missing;
    let yaml_missing = presence.yaml_missing;

    let nil_attribute = &presence.xml_attributes;
    let xml_value = &presence.xml_value;
    let yaml_value = &presence.yaml_value;
    let presence_yaml = &presence.yaml_write;
    let presence_xml = &presence.xml_write;
    let empty_read = &presence.yaml_empty_read;
    let parent_code = super::record::path_code(parent);
    let missing_root = super::record::path_code(&parent[..parent.len() - 1]);
    let write_missing = if xml_missing {
        format!(
            "if !value.rows.is_present() {{ if _retain_wrapper {{ out.container_with_attributes({parent_code}, &attributes); }} else {{ out.ensure_container({missing_root}); }} return Ok(()); }}"
        )
    } else {
        String::new()
    };
    let item_path: Vec<_> = route.iter().chain(relative).cloned().collect();
    let mut paths = Vec::new();
    let mut field_attributes = Vec::new();
    for field in items {
        let mapping = xml_fields
            .iter()
            .find(|mapping| mapping.field == field.name)
            .expect("linked field");
        if (!scalar_items && mapping.path.is_empty() && mapping.attribute.is_none())
            || (mapping.attribute.is_some()
                && (!mapping.path.is_empty() || typed.is_some() || is_tree))
        {
            return Err(unsupported(
                entry,
                "Sequence field requires an element path or a plain text item attribute",
            ));
        }
        field_attributes.push(mapping.attribute.as_ref());
        paths.push(
            item_path
                .iter()
                .chain(&mapping.path)
                .cloned()
                .collect::<Vec<_>>(),
        );
    }
    let element_paths: Vec<_> = paths
        .iter()
        .enumerate()
        .filter(|(index, _)| field_attributes[*index].is_none())
        .collect();
    let mut namespaces: BTreeSet<_> = paths
        .iter()
        .flatten()
        .map(|name| name.namespace.as_str())
        .filter(|namespace| !namespace.is_empty())
        .collect();
    namespaces.extend(
        field_attributes
            .iter()
            .flatten()
            .map(|name| name.namespace.as_str())
            .filter(|name| !name.is_empty()),
    );
    namespaces.extend(attributes.namespaces.iter().map(String::as_str));
    namespaces.extend(presence.namespaces.iter().map(String::as_str));
    namespaces.extend(tree.namespaces.iter().map(String::as_str));
    let id = entry.id;
    let key_name = &owner_yaml[0].key;
    let parent_code = super::record::path_code(parent);
    let item_code = super::record::path_code(&item_path);
    let mut row_attribute_read = String::new();
    let mut row_attribute_positions = String::new();
    let mut row_attribute_values = Vec::new();
    for (index, name) in field_attributes
        .iter()
        .enumerate()
        .filter_map(|(index, name)| name.map(|name| (index, name)))
    {
        let named = super::attributes::name_matches(name, "_attribute.name");
        writeln!(row_attribute_read,"if core::xml::matches(path,{item_code}) && {named} {{if fields[{index}].is_some() {{return Err(RuntimeDiagnostic::new(\"xml.duplicate-field\",\"Repeated item attribute\"));}}fields[{index}]=Some(_attribute.text.clone());return Ok(());}}").unwrap();
        if keep_rows {
            write!(
                row_attribute_positions,
                "positions[{index}]=core::Position::xml(_offset);"
            )
            .unwrap();
        }
        row_attribute_values.push(format!("core::xml::WriteAttribute{{name:({:?},{:?}),value:core::xml::AttributeValue::Text(&row.fields[{index}])}}",name.namespace,name.local));
    }
    let open_item = if row_attribute_values.is_empty() {
        format!("out.container({item_code});")
    } else {
        format!(
            "out.container_with_attributes({item_code},&[{}]);",
            row_attribute_values.join(",")
        )
    };

    let extra_members = if ordinary && common.constraints.is_empty() && typed.is_none() {
        ""
    } else {
        ", annotations: core::annotations::Mapping, yaml_issues: Vec<RuntimeDiagnostic>, declared_issues: Vec<RuntimeDiagnostic>"
    };
    let extra_init = if ordinary && common.constraints.is_empty() && typed.is_none() {
        ""
    } else {
        ", annotations: core::annotations::Mapping::default(), yaml_issues: Vec::new(), declared_issues: Vec::new()"
    };
    let tree_attributes = &tree.attributes;
    let tree_text = &tree.text;
    let mut out = shorthand.definitions.clone();
    out.push_str(&tree.definitions);
    out.push_str(&presence.definitions);
    out.push_str(&attributes.definitions);
    let row_type = typed.as_ref().map_or("String".into(), |codec| {
        codec.rust_type(&super::collection_values::name(id))
    });
    if let Some(codec) = &typed {
        out.push_str(&super::collection_values::read_definition(id, codec)?);
    }
    out.push_str(&format!(
        "{visibility}struct R{id} {{ {visibility}fields: [{row_type}; {count}]{row_member} }}\n{visibility}struct V{id} {{ {visibility}rows: core::Sequence<R{id}>{self_member}{form_member}, raw: Option<core::xml::Patch>{extra_members} }}\n"
    ));
    writeln!(out, "impl PartialEq for R{id} {{ fn eq(&self, other: &Self) -> bool {{ self.fields == other.fields }} }} impl Eq for R{id} {{}}").unwrap();
    let mut state_members = vec![
        ("rows", format!("Vec<R{id}>"), "Vec::new()".to_owned()),
        (
            "fields",
            format!("[Option<String>;{count}]"),
            "std::array::from_fn(|_|None)".to_owned(),
        ),
        ("seen", "bool".into(), "false".into()),
    ];
    if keep_rows {
        state_members.push((
            "positions",
            format!("[core::Position;{count}]"),
            format!("[core::Position::default();{count}]"),
        ));
    }
    if keep_self {
        state_members.push((
            "position",
            "core::Position".into(),
            "core::Position::default()".into(),
        ));
    }
    if presence.xml_nil {
        state_members.push(("nil", "bool".into(), "false".into()));
    }
    let (state_code, names) = reader_state(&format!("XmlCollection{id}"), &state_members);
    writeln!(out,"{state_code} impl XmlCollection{id}{{fn consume(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{{let _=source;let Self{{{names}}}=self;match token {{core::xml::Token::Attribute(_attribute)=>{{{attribute_read}{row_attribute_read}{tree_attributes}{nil_attribute}Err(RuntimeDiagnostic::new(\"xml.unknown-attribute\",\"Undeclared XML attribute\"))}},core::xml::Token::Start(_offset)=>{{let _offset=*_offset;").unwrap();
    writeln!(out, "if core::xml::matches(path, {parent_code}) {{ if *seen {{ return Err(RuntimeDiagnostic::new(\"xml.duplicate-field\", \"Repeated collection property\")); }} *seen=true; {self_xml} return Ok(()); }}\nif core::xml::matches(path, {item_code}) {{ *fields=std::array::from_fn(|_|None); {row_attribute_positions} if !{direct_item} {{return Ok(());}} }}").unwrap();
    for &(index, path) in &element_paths {
        let path = super::record::path_code(path);
        let save_position = if keep_rows {
            format!("positions[{index}]=core::Position::xml(_offset);")
        } else {
            String::new()
        };
        writeln!(out, "if core::xml::matches(path, {path}) {{ if fields[{index}].is_some() {{ return Err(RuntimeDiagnostic::new(\"xml.duplicate-field\", \"Repeated record field\")); }} fields[{index}]=Some(String::new()); {save_position} return Ok(()); }}").unwrap();
    }
    out.push_str(&tree.starts);
    let mut prefixes = BTreeSet::new();
    for path in &paths {
        for end in 1..path.len() {
            prefixes.insert(super::record::path_code(&path[..end]));
        }
    }
    for prefix in prefixes {
        writeln!(
            out,
            "if core::xml::matches(path, {prefix}) {{ return Ok(()); }}"
        )
        .unwrap();
    }
    out.push_str("Err(RuntimeDiagnostic::new(\"xml.unknown-field\", \"Unknown collection path\")) }, core::xml::Token::Text(text) => {\n");
    for &(index, path) in &element_paths {
        let path = super::record::path_code(path);
        writeln!(out, "if core::xml::matches(path, {path}) {{ fields[{index}].as_mut().expect(\"started scalar\").push_str(text); return Ok(()); }}").unwrap();
    }
    out.push_str(tree_text);
    out.push_str("if core::xml::is_whitespace(text) { Ok(()) } else { Err(RuntimeDiagnostic::new(\"xml.unexpected-text\", \"Text outside a scalar\")) } }, core::xml::Token::End => {\n");
    let take_fields = format!("[{}]", (0..count).map(|i|format!("fields[{i}].take().ok_or_else(|| RuntimeDiagnostic::new(\"value.missing\", \"Missing item field\"))?")).collect::<Vec<_>>().join(","));
    let read_row = if typed.is_some() {
        format!("read_row_{id}({take_fields},source,core::Position::default(),true,_inputs)?")
    } else {
        format!(
            "R{id} {{ fields: {take_fields}{} }}",
            if keep_rows {
                ", positions:*positions"
            } else {
                ""
            }
        )
    };
    writeln!(
        out,
        "if core::xml::matches(path, {item_code}) {{ rows.push({read_row}); }} Ok(()) }} }} }} }}"
    )
    .unwrap();
    writeln!(out,"fn finish_xml_{id}(state:XmlCollection{id},_inputs:&InputView<'_>)->core::Result<V{id}>{{let XmlCollection{id}{{rows,seen{}{},..}}=state;if !seen && !{xml_missing} {{return Err(RuntimeDiagnostic::new(\"value.missing\",\"Missing collection property\"));}} Ok(V{id}{{rows:{xml_value}{self_init}{form_xml},raw:None{extra_init}}})}}",if keep_self{",position"}else{""},if presence.xml_nil{",nil"}else{""}).unwrap();
    writeln!(out, "fn read_xml_{id}(source: &[u8], inputs: &InputView<'_>) -> core::Result<V{id}> {{ read_xml_with_{id}(source,inputs,|_,_| Ok(false)) }}\n{visibility}fn read_xml_with_{id}(source: &[u8], inputs: &InputView<'_>, consume: impl FnMut(&[core::xml::Name], &core::xml::Token<'_>) -> core::Result<bool>) -> core::Result<V{id}> {{ read_xml_events_{id}(source,inputs,core::xml::DocumentSource(source),consume) }}\n{visibility}fn read_xml_events_{id}(source: &[u8], inputs: &InputView<'_>, events: impl core::xml::Source, mut consume: impl FnMut(&[core::xml::Name], &core::xml::Token<'_>) -> core::Result<bool>) -> core::Result<V{id}> {{let mut state=XmlCollection{id}::new();events.visit(|path,token|{{if consume(path,token)?{{Ok(())}}else{{state.consume(path,token,source,inputs)}}}})?;finish_xml_{id}(state,inputs)}}").unwrap();
    if ordinary {
        out.push_str(&super::sequence_yaml::generate(
            entry,
            common,
            items,
            key_name,
            &presence,
            typed.as_ref(),
        )?);
    } else {
        let save_yaml_position = if keep_rows {
            format!(
                "self.positions[if self.pending.is_some() {{ {text_index} }} else {{ {key_index} }}]=_position;"
            )
        } else {
            String::new()
        };
        let keyed_mark = if shorthand.read_keyed.is_empty() {
            ""
        } else {
            "self.keyed_input=true;"
        };
        let keyed_read = &shorthand.read_keyed;
        let expanded_mut = if keyed_read.is_empty() { "" } else { "mut " };
        let shorthand_read = &shorthand.read;
        let shorthand_write = &shorthand.write;
        let mut yaml_members = vec![
            (
                "annotations",
                "core::annotations::Mapping".into(),
                "core::annotations::Mapping::default()".into(),
            ),
            ("rows", format!("Vec<R{id}>"), "Vec::new()".into()),
            ("depth", "usize".into(), "0".into()),
            ("seen", "bool".into(), "false".into()),
            ("key", "bool".into(), "false".into()),
            ("pending", "Option<String>".into(), "None".into()),
        ];
        if keep_rows {
            yaml_members.push((
                "positions",
                format!("[core::Position;{count}]"),
                format!("[core::Position::default();{count}]"),
            ));
        }
        if keep_self {
            yaml_members.push((
                "position",
                "core::Position".into(),
                "core::Position::default()".into(),
            ));
        }
        if keep_form {
            yaml_members.push((
                "form",
                "core::yaml::Form".into(),
                "core::yaml::Form::Missing".into(),
            ));
        }
        if !empty_read.is_empty() {
            yaml_members.push(("empty_scalar", "bool".into(), "false".into()));
        }
        if !keyed_read.is_empty() {
            yaml_members.push(("keyed_input", "bool".into(), "false".into()));
        }
        let (state_code, _) = reader_state(&format!("YamlDictionary{id}"), &yaml_members);
        let bindings = yaml_members
            .iter()
            .map(|(name, _, _)| {
                if ["key", "pending", "positions"].contains(name) {
                    format!("{name}:_")
                } else {
                    (*name).to_owned()
                }
            })
            .collect::<Vec<_>>()
            .join(",");
        let state_row_init = if keep_rows {
            ",positions:self.positions"
        } else {
            ""
        };
        out.push_str(&state_code);
        writeln!(out, r#"fn read_plain_yaml_{id}(source: &[u8], inputs: &InputView<'_>) -> core::Result<V{id}> {{ read_yaml_value_{id}(source,inputs,true) }}
fn read_yaml_value_{id}(source: &[u8], inputs: &InputView<'_>, expand: bool) -> core::Result<V{id}> {{
let source=if source.is_empty() {{ b"{{}}".as_slice() }} else {{ source }};
read_yaml_events_{id}(source,inputs,expand,core::yaml::DocumentSource(source)) }}
{visibility}fn read_yaml_events_{id}(source: &[u8], _inputs: &InputView<'_>, expand: bool, visit: impl core::yaml::Source) -> core::Result<V{id}> {{
let mut state=YamlDictionary{id}::new();
visit.visit(|node,position|state.consume(node,position,_inputs))?;
finish_yaml_dictionary_{id}(state,source,_inputs,expand) }}
impl YamlDictionary{id} {{fn consume(&mut self,node:core::yaml::Node,_position:core::Position,_inputs:&InputView<'_>)->core::Result<()> {{ match node {{
core::yaml::Node::MappingStart(None) if self.depth==0 && !self.seen => {{ self.depth=1; Ok(()) }},
core::yaml::Node::Scalar(value, None) if self.depth==1 && !self.seen && !self.key => {{
if value.into_text()? != {key_name:?} {{ return Err(RuntimeDiagnostic::new("yaml.unknown-field", "Unknown collection property")); }} self.key=true; Ok(()) }},
{empty_read}
{shorthand_read}
core::yaml::Node::MappingStart(tag) if self.depth==1 && self.key && !self.seen => {{ self.annotations.read(None, tag.as_deref(), _position)?; self.seen=true; self.depth=2; {self_yaml} {form_mapping} {keyed_mark} Ok(()) }},
core::yaml::Node::Scalar(value, tag) if self.depth==2 => {{ if self.pending.is_none() {{ self.annotations.read(Some(self.rows.len()), tag.as_deref(), _position)?; }} else if tag.is_some() {{ return Err(RuntimeDiagnostic::new("yaml.annotation", "Annotation belongs on the mapping key")); }} let text=if self.pending.is_none() {{ value.into_mapping_key()? }} else {{ value.into_text()? }}; {save_yaml_position} if let Some(key)=self.pending.take() {{
let mut fields=[String::new(), String::new()]; fields[{key_index}]=key; fields[{text_index}]=text; self.rows.push(R{id} {{fields{state_row_init}}});
}} else {{ self.pending=Some(text); }} Ok(()) }},
core::yaml::Node::MappingEnd if self.depth==2 && self.pending.is_none() => {{ self.depth=1; Ok(()) }},
core::yaml::Node::MappingEnd if self.depth==1 && (self.seen || ({yaml_missing} && !self.key)) => {{ self.depth=0; Ok(()) }},
_ => Err(RuntimeDiagnostic::new("yaml.collection-form", "Expected a keyed mapping of text values")),
}} }} }}
fn finish_yaml_dictionary_{id}(state:YamlDictionary{id},source:&[u8],_inputs:&InputView<'_>,expand:bool)->core::Result<V{id}> {{
let YamlDictionary{id}{{{bindings}}}=state;
let source=if source.is_empty() {{b"{{}}".as_slice()}} else {{source}};
let physical=V{id} {{ rows:core::Sequence::Present(rows){self_init}{form_yaml}, raw: None, annotations, yaml_issues:Vec::new(), declared_issues:Vec::new() }};
let declared_issues=issues_yaml_{id}(&physical, source, _inputs);
let evidence=if physical.annotations.is_empty() {{ Vec::new() }} else {{ issues_xml_{id}(&physical, source, _inputs) }};
let yaml_issues=physical.annotations.validate_with_evidence({key_name:?}, physical.rows.iter().map(|row| (row.fields[{key_index}].as_str(), row.positions[{key_index}])), declared_issues.clone(), &evidence);
let V{id} {{ rows, annotations, .. }}=physical;
let core::Sequence::Present({expanded_mut}rows)=rows else {{ unreachable!("physical rows are present"); }};
{keyed_read}
if (!seen && !{yaml_missing}) || depth!=0 {{ return Err(RuntimeDiagnostic::new("value.missing", "Missing collection property")); }} Ok(V{id} {{rows: if expand {{ {yaml_value} }} else {{ core::Sequence::Present(rows) }}{self_init}{form_yaml}, raw: None, annotations, yaml_issues, declared_issues}}) }}
{visibility}fn check_xml_{id}(value: &V{id}, source: &[u8], inputs: &InputView<'_>) -> Vec<RuntimeDiagnostic> {{ issues_xml_{id}(value, source, inputs).into_iter().filter(|error| error.kind==core::annotations::IssueKind::Structural || error.severity!=Severity::Error).collect() }}
{visibility}fn check_yaml_{id}(value: &V{id}, _source: &[u8], _inputs: &InputView<'_>) -> Vec<RuntimeDiagnostic> {{ value.yaml_issues.clone() }}
{visibility}fn prepare_yaml_{id}(value: &V{id}, inputs: &InputView<'_>, shorten: bool) -> core::Result<Vec<u8>> {{
let mut out=String::new();prepare_yaml_into_{id}(value,inputs,shorten,&mut out,"")?;Ok(out.into_bytes()) }}
{visibility}fn prepare_yaml_into_{id}(value:&V{id},inputs:&InputView<'_>,shorten:bool,out:&mut String,indent:&str)->core::Result<()> {{
core::yaml::append_properties(out,|out| {{
let start=out.len();emit_yaml_fields_{id}(value,inputs,shorten,&mut core::yaml::Indented::new(out,indent))?;
let mut restored=read_yaml_value_{id}(&out.as_bytes()[start..], inputs, false)?;
let mut issues=restored.declared_issues.clone(); issues.extend(issues_xml_{id}(value, &[], inputs));
restored.annotations=core::annotations::Mapping::infer({key_name:?}, restored.rows.iter().map(|row| (row.fields[{key_index}].as_str(), core::Position::default())), &issues)?;
if !restored.annotations.is_empty() {{out.truncate(start);emit_yaml_fields_{id}(&restored,inputs,false,&mut core::yaml::Indented::new(out,indent))?;}} Ok(()) }}) }}
fn emit_yaml_fields_{id}(value: &V{id}, _inputs: &InputView<'_>, shorten: bool, out: &mut core::yaml::Indented<'_>) -> core::Result<()> {{
let _value=value;
if !value.annotations.is_empty() {{
out.push_str(&core::yaml::scalar({key_name:?})); out.push(':');
if let Some(tag)=value.annotations.label(None) {{ out.push(' '); out.push_str(&tag); }}
for (index,row) in value.rows.iter().enumerate() {{ out.push_str("\n  "); if let Some(tag)=value.annotations.label(Some(index)) {{ out.push_str(&tag); out.push(' '); }} out.push_str(&core::yaml::mapping_key(&row.fields[{key_index}])); out.push_str(": "); out.push_str(&core::yaml::scalar(&row.fields[{text_index}])); }}
if value.rows.is_empty() {{ out.push_str(" {{}}"); }} return Ok(()); }}
if shorten || value.rows.is_empty() {{ {presence_yaml} }}
if !value.rows.is_present() {{ if {yaml_missing} {{return Ok(());}} return Err(RuntimeDiagnostic::new("yaml.presence", "No declared YAML form represents absence")); }}
out.push_str(&core::yaml::scalar({key_name:?})); out.push(':');
{shorthand_write}
append_rows_{id}(out, &value.rows); Ok(()) }}
fn append_rows_{id}<'a>(out: &mut core::yaml::Indented<'_>, rows: impl IntoIterator<Item=&'a R{id}>) {{ let mut any=false; for row in rows {{ any=true; out.push_str("\n  "); out.push_str(&core::yaml::mapping_key(&row.fields[{key_index}])); out.push_str(": "); out.push_str(&core::yaml::scalar(&row.fields[{text_index}])); }} if !any {{ out.push_str(" {{}}"); }} }}
"#).unwrap();
    }
    // Prefixes belong to the declaration; only the exceptional path materializes a tree.
    let raw_namespaces: Vec<_> = common
        .namespaces
        .iter()
        .chain(&entry.namespaces)
        .map(|binding| (binding.name.as_str(), binding.value.as_str()))
        .collect();
    let mut raw_qnames: Vec<_> = declared_attributes
        .iter()
        .filter(|attribute| matches!(attribute.value, LinkedXmlAttributeValue::QName(_)))
        .map(|attribute| {
            (
                attribute.name.namespace.as_str(),
                attribute.name.local.as_str(),
            )
        })
        .collect();
    raw_qnames.extend(
        tree.qnames
            .iter()
            .map(|(uri, local)| (uri.as_str(), local.as_str())),
    );
    let physical = parent.last().expect("property path");
    let physical_key = &physical.local;
    let physical_namespace = &physical.namespace;
    let raw_key = if unwrapped || key_name == physical_key {
        format!("{key_name:?}")
    } else {
        format!("if value.rows.is_present() {{ {key_name:?} }} else {{ {physical_key:?} }}")
    };
    writeln!(out,r#"fn write_yaml_{id}(value:&V{id},inputs:&InputView<'_>)->core::Result<Vec<u8>> {{let mut out=String::new();write_yaml_into_{id}(value,inputs,&mut out)?;Ok(out.into_bytes())}}
{visibility}fn write_yaml_into_{id}(value:&V{id},inputs:&InputView<'_>,out:&mut String)->core::Result<()> {{
if let Some(patch)=&value.raw {{
let meaning=prepare_yaml_{id}(value,inputs,true)?;let payload=patch.to_yaml();
let encoded=core::raw::Property::encode({key_name:?},{raw_key},&meaning,payload.as_bytes())?;
core::yaml::append_encoded_properties(out,&encoded)
}} else {{prepare_yaml_into_{id}(value,inputs,true,out,"")}} }}
"#).unwrap();

    writeln!(out, r#"fn read_yaml_{id}(source: &[u8], inputs: &InputView<'_>) -> core::Result<V{id}> {{
        match read_plain_yaml_{id}(source, inputs) {{
            Ok(value) => Ok(value),
            Err(error) => {{
                if !matches!(error.code.as_deref(), Some("yaml.annotation" | "yaml.unknown-field" | "yaml.collection-form")) {{ return Err(error); }}
                let Some(envelope)=core::raw::Property::decode(source, {key_name:?}, {physical_key:?})? else {{ return Err(error); }};
                let mut value=read_plain_yaml_{id}(&envelope.meaning, inputs)?;
                if !envelope.has_semantic && !envelope.uses_semantic_name {{ value.rows=core::Sequence::Absent; }}
                value.raw=Some(core::xml::Patch::read(&envelope.payload, &{raw_namespaces:?}, &{raw_qnames:?})?);
                Ok(value)
            }}
        }}
    }}"#).unwrap();
    let open_parent = if unwrapped {
        format!("out.ensure_container({parent_code});")
    } else {
        format!("out.container_with_attributes({parent_code}, &attributes);")
    };
    writeln!(out, "fn write_plain_xml_{id}(value: &V{id}, inputs: &InputView<'_>) -> core::Result<Vec<u8>> {{ write_xml_attributes_{id}(value,inputs, &[], false) }}\n{visibility}fn write_xml_attributes_{id}(value: &V{id}, _inputs: &InputView<'_>, extra: &[core::xml::WriteAttribute<'_>], _retain_wrapper: bool) -> core::Result<Vec<u8>> {{ let mut out=core::xml::Writer::new(&{:?}); write_xml_fields_{id}(value,_inputs,extra,_retain_wrapper,&mut out)?; Ok(out.finish()) }}\n{visibility}fn write_xml_fields_{id}<'b,'c:'b>(value: &V{id}, _inputs: &InputView<'_>, extra: impl IntoIterator<Item=&'b core::xml::WriteAttribute<'c>>, _retain_wrapper: bool, out: &mut core::xml::Writer<'_>) -> core::Result<()> {{ let _value=value; {attribute_write} attributes.splice(0..0,extra.into_iter().map(|a| core::xml::WriteAttribute {{ name:a.name, value:match a.value {{ core::xml::AttributeValue::Text(t)=>core::xml::AttributeValue::Text(t),core::xml::AttributeValue::QName(q)=>core::xml::AttributeValue::QName(q) }} }})); {presence_xml} {write_missing} {open_parent} for row in &value.rows {{ if !{direct_item} {{{open_item}}}", namespaces.iter().copied().collect::<Vec<_>>()).unwrap();
    if is_tree {
        out.push_str(&tree.write);
    } else {
        for &(index, path) in &element_paths {
            let value = typed
                .as_ref()
                .map_or(format!("&row.fields[{index}]"), |codec| {
                    codec.write_reference(
                        &super::collection_values::name(id),
                        &format!("&row.fields[{index}]"),
                        true,
                    )
                });
            writeln!(
                out,
                "out.field({}, {value});",
                super::record::path_code(path)
            )
            .unwrap();
        }
    }
    writeln!(
        out,
        "if !{direct_item} {{out.end_container();}} }} Ok(()) }}"
    )
    .unwrap();
    let write_preserved = if unwrapped {
        format!(
            "tree.write_children_at(out,{parent_code},({:?},{:?}),&{raw_qnames:?})?;",
            route.last().unwrap().namespace,
            route.last().unwrap().local
        )
    } else {
        format!("tree.write_at(out,{missing_root},&{raw_qnames:?})?;")
    };
    let writer_namespaces = namespaces.iter().copied().collect::<Vec<_>>();
    writeln!(out, r#"{visibility}const XML_NAMESPACES_{id}: &[&str]=&{writer_namespaces:?};
    fn prepare_xml_{id}(value: &V{id}, inputs: &InputView<'_>) -> core::Result<Option<core::xml::Tree>> {{
        let Some(patch)=&value.raw else {{return Ok(None);}};
        let ordinary=write_plain_xml_{id}(value, inputs)?;
        let tree=core::xml::Tree::capture(&ordinary,{parent_code})?;
        if patch.is_null() && ({ordinary} || (!value.rows.is_present() && tree.is_some())) {{return Ok(None);}}
        Ok(Some(patch.apply(tree,core::xml::Name {{namespace:{physical_namespace:?}.into(),local:{physical_key:?}.into()}},&{raw_namespaces:?},&{raw_qnames:?})?))
    }}
    fn namespaces_xml_{id}<'a>(_value: &'a V{id}, prepared: &'a Option<core::xml::Tree>, namespaces: &mut Vec<&'a str>) {{
        for namespace in XML_NAMESPACES_{id} {{if !namespaces.contains(namespace) {{namespaces.push(namespace);}}}}
        if let Some(tree)=prepared {{tree.collect_namespaces(namespaces);}}
    }}
    fn write_xml_into_{id}<'a>(value: &V{id}, prepared: &'a Option<core::xml::Tree>, inputs: &InputView<'_>, out: &mut core::xml::Writer<'a>) -> core::Result<()> {{
        if value.raw.is_none() {{return write_xml_fields_{id}(value,inputs,&[],false,out);}}
        if let Some(tree)=prepared {{{write_preserved}}}
        else {{out.ensure_container({missing_root});}}
        Ok(())
    }}
    fn write_xml_{id}(value: &V{id}, inputs: &InputView<'_>) -> core::Result<Vec<u8>> {{
        let prepared=prepare_xml_{id}(value,inputs)?;
        let mut namespaces=Vec::new();
        if value.raw.is_some() {{namespaces_xml_{id}(value,&prepared,&mut namespaces);}}
        let mut out=core::xml::Writer::new(if namespaces.is_empty() {{XML_NAMESPACES_{id}}} else {{&namespaces}});
        write_xml_into_{id}(value,&prepared,inputs,&mut out)?;
        Ok(out.finish())
    }}"#).unwrap();
    let scalar = paths
        .iter()
        .enumerate()
        .filter_map(|(index, path)| field_attributes[index].is_none().then_some(path))
        .chain(&tree.scalar_paths)
        .map(|path| {
            format!(
                "core::xml::matches(path, {})",
                super::record::path_code(path)
            )
        })
        .collect::<Vec<_>>()
        .join(" || ");
    out.push_str(&super::proof::qnames(id, &format!("vec!{raw_qnames:?}")));
    out.push_str(&super::proof::generate(
        id,
        if scalar.is_empty() { "false" } else { &scalar },
        &qname_attributes
            .replace("_name", "name")
            .replace("_path", "path"),
        "false",
    ));
    writeln!(out, "fn verify_{id}(original: &[u8], candidate: &[u8], _inputs: &InputView<'_>) -> core::Result<()> {{ let value=read_yaml_{id}(candidate, _inputs)?; if let Some(error)=check_yaml_{id}(&value, candidate, _inputs).into_iter().find(|error| error.severity==Severity::Error) {{ return Err(error); }} prove_xml_{id}(&value,original,&write_xml_{id}(&value,_inputs)?) }}").unwrap();
    writeln!(out, r#"fn finalize_yaml_{id}(original: &[u8], candidate: Vec<u8>, value: &V{id}, inputs: &InputView<'_>) -> core::Result<Vec<u8>> {{
        match verify_{id}(original, &candidate, inputs) {{
            Ok(()) => return Ok(candidate),
            Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch") => {{}},
            Err(error) => return Err(error),
        }}
        let full=prepare_yaml_{id}(value, inputs, false)?;
        if full!=candidate {{
            match verify_{id}(original, &full, inputs) {{
                Ok(()) => return Ok(full),
                Err(error) if error.code.as_deref()==Some("xml.round-trip-mismatch") => {{}},
                Err(error) => return Err(error),
            }}
        }}
        let tree=core::xml::Tree::capture(original, {parent_code})?;
        let restored=read_plain_yaml_{id}(&candidate,inputs)?;
        let ordinary=write_plain_xml_{id}(&restored,inputs)?;
        let ordinary=core::xml::Tree::capture(&ordinary,{parent_code})?;
        let payload=match tree {{Some(tree)=>{{let patch=tree.patch_yaml(ordinary.as_ref(), &{raw_namespaces:?}, &{raw_qnames:?})?;if {ordinary} && patch.is_empty() {{"\"\"".into()}} else {{patch}}}},None=>"null".into()}};
        let annotated=core::raw::Property::encode({key_name:?}, {raw_key}, &candidate, payload.as_bytes())?;
        verify_{id}(original, &annotated, inputs)?;
        Ok(annotated)
    }}"#).unwrap();
    {
        let fallback = if presence.yaml_missing {
            String::new()
        } else if ordinary {
            format!("{key_name:?}: []")
        } else {
            format!("{key_name:?}: {{}}")
        };
        let read = format!("read_xml_with_{id}(source,inputs,|_,_| Ok(false))");
        let recover = format!(
            "match {read} {{ Ok(value)=>Ok(value), Err(error) if matches!(error.code.as_deref(),Some(\"value.text-pattern\"|\"value.choice\"|\"value.text-sequence\"|\"value.enum\"|\"xml.unknown-field\"|\"xml.unknown-attribute\"|\"xml.unexpected-text\"|\"xml.attribute-value\"|\"xml.duplicate-field\"|\"value.missing\")) => {{ read_plain_yaml_{id}({fallback:?}.as_bytes(),inputs) }}, Err(error)=>Err(error) }}"
        );
        out = out.replacen(&read, &recover, 1);
    }
    Ok(Some(out))
}
