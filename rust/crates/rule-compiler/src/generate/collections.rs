use super::*;
use std::fmt::Write;

pub(super) fn generate(
    entry: &LinkedEntry,
    program: &Program,
) -> Result<Option<String>, Diagnostic> {
    let LinkedType::Record(fields) = &entry.value else {
        return Ok(None);
    };
    if fields.len() != 1 {
        return Ok(None);
    }
    let (reference, bindings, arguments) = match &fields[0].value {
        LinkedType::Reference(reference) => (*reference, &[][..], &[][..]),
        LinkedType::BoundReference {
            entry,
            bindings,
            arguments,
        } => (*entry, bindings.as_slice(), arguments.as_slice()),
        _ => return Ok(None),
    };
    let common = program
        .entries
        .iter()
        .find(|value| value.id == reference)
        .expect("linked common");
    let LinkedType::Sequence(item) = &common.value else {
        return Ok(None);
    };
    plain_shape(entry)?;
    if !entry.constraints.is_empty() {
        return Err(unsupported(
            entry,
            "Collection constraints or presence are not generated yet",
        ));
    }
    let LinkedType::Record(items) = item.as_ref() else {
        return Err(unsupported(entry, "Keyed sequence requires records"));
    };
    let (common_xml, declared_attributes) = super::attributes::content(&common.xml);
    let (
        LinkedXml::Record(owner_xml),
        YamlRepresentation::Mapping(owner_yaml),
        LinkedXml::ElementSequence {
            path: relative,
            item: xml_item,
        },
        YamlRepresentation::KeyedMapping { key, value, .. },
    ) = (&entry.xml, &entry.yaml, common_xml, &common.yaml)
    else {
        return Err(unsupported(
            entry,
            "Sequence representations are not generated",
        ));
    };
    let LinkedXml::Record(xml_fields) = xml_item.as_ref() else {
        return Err(unsupported(entry, "Sequence XML item requires a record"));
    };
    if items.len() != 2
        || items
            .iter()
            .any(|field| field.value != LinkedType::Scalar(ScalarType::Text))
    {
        return Err(unsupported(entry, "Keyed mapping requires two text fields"));
    }
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
    let form_local = if keep_form {
        "let mut form=core::yaml::Form::Missing;"
    } else {
        ""
    };
    let form_mapping = if keep_form {
        "form=core::yaml::Form::Mapping;"
    } else {
        ""
    };
    let keep_rows = true; // Duplicate-key diagnostics always need the original key position.
    let keep_self = common
        .constraints
        .iter()
        .any(|rule| matches!(rule.diagnostic.at, LinkedDiagnosticTarget::SelfValue));
    let row_member = if keep_rows {
        ", positions: [core::Position; 2]"
    } else {
        ""
    };
    let self_member = if keep_self {
        ", position: core::Position"
    } else {
        ""
    };
    let row_init = if keep_rows { ", positions" } else { "" };
    let self_init = if keep_self { ", position" } else { "" };
    let row_local = if keep_rows {
        "let mut positions=[core::Position::default(); 2];"
    } else {
        ""
    };
    let self_local = if keep_self {
        "let mut position=core::Position::default();"
    } else {
        ""
    };
    let self_xml = if keep_self {
        "position=core::Position::xml(_offset);"
    } else {
        ""
    };
    let self_yaml = if keep_self { "position=_position;" } else { "" };
    let shorthand = super::shorthand::scalar(entry, common, program, bindings, arguments, items)?;
    let key_index = items
        .iter()
        .position(|field| field.name == *key)
        .expect("linked key");
    let text_index = items
        .iter()
        .position(|field| field.name == *value)
        .expect("linked value");
    let parent = &owner_xml[0].path;
    if parent.is_empty() || relative.is_empty() || owner_xml[0].attribute.is_some() {
        return Err(unsupported(entry, "Sequence needs element routes"));
    }
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
    let qname_attributes = &attributes.qnames;
    let presence = super::presence::generate(
        common,
        entry,
        program,
        bindings,
        arguments,
        &owner_yaml[0].key,
        parent,
    )?;
    let xml_missing = presence.xml_missing;
    let yaml_missing = presence.yaml_missing;
    let nil_local = &presence.xml_local;
    let nil_attribute = &presence.xml_attributes;
    let xml_value = &presence.xml_value;
    let yaml_value = &presence.yaml_value;
    let presence_yaml = &presence.yaml_write;
    let presence_xml = &presence.xml_write;
    let empty_read = &presence.yaml_empty_read;
    let empty_local = if empty_read.is_empty() {
        ""
    } else {
        "let mut empty_scalar=false;"
    };
    if xml_missing && parent.len() < 2 {
        return Err(unsupported(
            entry,
            "An optional property must be inside an XML document root",
        ));
    }
    let missing_root = super::record::path_code(&parent[..parent.len() - 1]);
    let write_missing = if xml_missing {
        format!(
            "if !value.rows.is_present() {{ out.container({missing_root}); return Ok(out.finish()); }}"
        )
    } else {
        String::new()
    };
    let item_path: Vec<_> = parent.iter().chain(relative).cloned().collect();
    let mut paths = Vec::new();
    for field in items {
        let mapping = xml_fields
            .iter()
            .find(|mapping| mapping.field == field.name)
            .expect("linked field");
        if mapping.path.is_empty() || mapping.attribute.is_some() {
            return Err(unsupported(
                entry,
                "Sequence scalar requires an element path",
            ));
        }
        paths.push(
            item_path
                .iter()
                .chain(&mapping.path)
                .cloned()
                .collect::<Vec<_>>(),
        );
    }
    let mut namespaces: BTreeSet<_> = paths
        .iter()
        .flatten()
        .map(|name| name.namespace.as_str())
        .filter(|namespace| !namespace.is_empty())
        .collect();
    namespaces.extend(attributes.namespaces.iter().map(String::as_str));
    namespaces.extend(presence.namespaces.iter().map(String::as_str));
    let id = entry.id;
    let key_name = &owner_yaml[0].key;
    let parent_code = super::record::path_code(parent);
    let item_code = super::record::path_code(&item_path);
    let mut out = shorthand.definitions.clone();
    out.push_str(&presence.definitions);
    out.push_str(&attributes.definitions);
    out.push_str(&format!(
        "struct R{id} {{ fields: [String; 2]{row_member} }}\nstruct V{id} {{ rows: core::Sequence<R{id}>{self_member}{form_member}, raw: Option<core::xml::Patch>, annotations: core::annotations::Mapping, yaml_issues: Vec<RuntimeDiagnostic>, declared_issues: Vec<RuntimeDiagnostic> }}\n"
    ));
    writeln!(out, "impl PartialEq for R{id} {{ fn eq(&self, other: &Self) -> bool {{ self.fields == other.fields }} }} impl Eq for R{id} {{}}").unwrap();
    writeln!(out, "fn read_xml_{id}(source: &[u8], _inputs: &PreparedInputs) -> core::Result<V{id}> {{ let mut rows=Vec::new(); let mut fields: [Option<String>; 2]=[None, None]; let mut seen=false; {row_local} {self_local} {nil_local} core::xml::visit(source, |path, token| {{ match token {{ core::xml::Token::Attribute(_attribute) => {{ {attribute_read} {nil_attribute} Err(RuntimeDiagnostic::new(\"xml.unknown-attribute\", \"Undeclared XML attribute\")) }}, core::xml::Token::Start(_offset) => {{").unwrap();
    writeln!(out, "if core::xml::matches(path, {parent_code}) {{ if seen {{ return Err(RuntimeDiagnostic::new(\"xml.duplicate-field\", \"Repeated collection property\")); }} seen=true; {self_xml} return Ok(()); }}\nif core::xml::matches(path, {item_code}) {{ fields=[None, None]; return Ok(()); }}").unwrap();
    for (index, path) in paths.iter().enumerate() {
        let path = super::record::path_code(path);
        let save_position = if keep_rows {
            format!("positions[{index}]=core::Position::xml(_offset);")
        } else {
            String::new()
        };
        writeln!(out, "if core::xml::matches(path, {path}) {{ if fields[{index}].is_some() {{ return Err(RuntimeDiagnostic::new(\"xml.duplicate-field\", \"Repeated record field\")); }} fields[{index}]=Some(String::new()); {save_position} return Ok(()); }}").unwrap();
    }
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
    for (index, path) in paths.iter().enumerate() {
        let path = super::record::path_code(path);
        writeln!(out, "if core::xml::matches(path, {path}) {{ fields[{index}].as_mut().expect(\"started scalar\").push_str(text); return Ok(()); }}").unwrap();
    }
    out.push_str("if core::xml::is_whitespace(text) { Ok(()) } else { Err(RuntimeDiagnostic::new(\"xml.unexpected-text\", \"Text outside a scalar\")) } }, core::xml::Token::End => {\n");
    writeln!(out, "if core::xml::matches(path, {item_code}) {{ rows.push(R{id} {{ fields: [fields[0].take().ok_or_else(|| RuntimeDiagnostic::new(\"value.missing\", \"Missing item field\"))?, fields[1].take().ok_or_else(|| RuntimeDiagnostic::new(\"value.missing\", \"Missing item field\"))?]{row_init} }}); }} Ok(()) }} }} }})?; if !seen && !{xml_missing} {{ return Err(RuntimeDiagnostic::new(\"value.missing\", \"Missing collection property\")); }} Ok(V{id} {{ rows: {xml_value}{self_init}{form_xml}, raw: None, annotations: core::annotations::Mapping::default(), yaml_issues: Vec::new(), declared_issues: Vec::new() }}) }}").unwrap();
    let save_yaml_position = if keep_rows {
        format!(
            "positions[if pending.is_some() {{ {text_index} }} else {{ {key_index} }}]=_position;"
        )
    } else {
        String::new()
    };
    let keyed_local = if shorthand.read_keyed.is_empty() {
        ""
    } else {
        "let mut keyed_input=false;"
    };
    let keyed_mark = if shorthand.read_keyed.is_empty() {
        ""
    } else {
        "keyed_input=true;"
    };
    let keyed_read = &shorthand.read_keyed;
    let expanded_mut = if keyed_read.is_empty() { "" } else { "mut " };
    let shorthand_read = &shorthand.read;
    let shorthand_write = &shorthand.write;
    writeln!(out, r#"fn read_plain_yaml_{id}(source: &[u8], inputs: &PreparedInputs) -> core::Result<V{id}> {{ read_yaml_value_{id}(source,inputs,true) }}
fn read_yaml_value_{id}(source: &[u8], _inputs: &PreparedInputs, expand: bool) -> core::Result<V{id}> {{
let mut annotations=core::annotations::Mapping::default(); let mut rows=Vec::new(); let mut depth=0; let mut seen=false; let mut key=false; let mut pending: Option<String>=None; {row_local} {self_local} {form_local} {empty_local} {keyed_local}
let source=if source.is_empty() {{ b"{{}}".as_slice() }} else {{ source }};
core::yaml::visit_nodes(source, |node, _position| {{ match node {{
core::yaml::Node::MappingStart(None) if depth==0 && !seen => {{ depth=1; Ok(()) }},
core::yaml::Node::Scalar(value, None) if depth==1 && !seen && !key => {{
if value.into_text()? != {key_name:?} {{ return Err(RuntimeDiagnostic::new("yaml.unknown-field", "Unknown collection property")); }} key=true; Ok(()) }},
{empty_read}
{shorthand_read}
core::yaml::Node::MappingStart(tag) if depth==1 && key && !seen => {{ annotations.read(None, tag.as_deref(), _position)?; seen=true; depth=2; {self_yaml} {form_mapping} {keyed_mark} Ok(()) }},
core::yaml::Node::Scalar(value, tag) if depth==2 => {{ if pending.is_none() {{ annotations.read(Some(rows.len()), tag.as_deref(), _position)?; }} else if tag.is_some() {{ return Err(RuntimeDiagnostic::new("yaml.annotation", "Annotation belongs on the mapping key")); }} let text=if pending.is_none() {{ value.into_mapping_key()? }} else {{ value.into_text()? }}; {save_yaml_position} if let Some(key)=pending.take() {{
let mut fields=[String::new(), String::new()]; fields[{key_index}]=key; fields[{text_index}]=text; rows.push(R{id} {{fields{row_init}}});
}} else {{ pending=Some(text); }} Ok(()) }},
core::yaml::Node::MappingEnd if depth==2 && pending.is_none() => {{ depth=1; Ok(()) }},
core::yaml::Node::MappingEnd if depth==1 && (seen || ({yaml_missing} && !key)) => {{ depth=0; Ok(()) }},
_ => Err(RuntimeDiagnostic::new("yaml.collection-form", "Expected a keyed mapping of text values")),
}} }})?;
let physical=V{id} {{ rows:core::Sequence::Present(rows){self_init}{form_yaml}, raw: None, annotations, yaml_issues:Vec::new(), declared_issues:Vec::new() }};
let declared_issues=issues_yaml_{id}(&physical, source, _inputs);
let evidence=if physical.annotations.is_empty() {{ Vec::new() }} else {{ issues_xml_{id}(&physical, source, _inputs) }};
let yaml_issues=physical.annotations.validate_with_evidence({key_name:?}, physical.rows.iter().map(|row| (row.fields[{key_index}].as_str(), row.positions[{key_index}])), declared_issues.clone(), &evidence);
let V{id} {{ rows, annotations, .. }}=physical;
let core::Sequence::Present({expanded_mut}rows)=rows else {{ unreachable!("physical rows are present"); }};
{keyed_read}
if (!seen && !{yaml_missing}) || depth!=0 {{ return Err(RuntimeDiagnostic::new("value.missing", "Missing collection property")); }} Ok(V{id} {{rows: if expand {{ {yaml_value} }} else {{ core::Sequence::Present(rows) }}{self_init}{form_yaml}, raw: None, annotations, yaml_issues, declared_issues}}) }}
fn check_xml_{id}(value: &V{id}, source: &[u8], inputs: &PreparedInputs) -> Vec<RuntimeDiagnostic> {{ issues_xml_{id}(value, source, inputs).into_iter().filter(|error| error.kind==core::annotations::IssueKind::Structural || error.severity!=Severity::Error).collect() }}
fn check_yaml_{id}(value: &V{id}, _source: &[u8], _inputs: &PreparedInputs) -> Vec<RuntimeDiagnostic> {{ value.yaml_issues.clone() }}
fn write_yaml_{id}(value: &V{id}, inputs: &PreparedInputs) -> core::Result<Vec<u8>> {{ prepare_yaml_{id}(value, inputs, true) }}
fn prepare_yaml_{id}(value: &V{id}, inputs: &PreparedInputs, shorten: bool) -> core::Result<Vec<u8>> {{
let candidate=emit_yaml_{id}(value, inputs, shorten)?;
let mut restored=read_yaml_value_{id}(&candidate, inputs, false)?;
let mut issues=restored.declared_issues.clone(); issues.extend(issues_xml_{id}(value, &[], inputs));
restored.annotations=core::annotations::Mapping::infer({key_name:?}, restored.rows.iter().map(|row| (row.fields[{key_index}].as_str(), core::Position::default())), &issues)?;
if restored.annotations.is_empty() {{ Ok(candidate) }} else {{ emit_yaml_{id}(&restored, inputs, false) }} }}
fn emit_yaml_{id}(value: &V{id}, _inputs: &PreparedInputs, shorten: bool) -> core::Result<Vec<u8>> {{
let _value=value;
if !value.annotations.is_empty() {{
let mut out=core::yaml::scalar({key_name:?}); out.push(':');
if let Some(tag)=value.annotations.label(None) {{ out.push(' '); out.push_str(&tag); }}
for (index,row) in value.rows.iter().enumerate() {{ out.push_str("\n  "); if let Some(tag)=value.annotations.label(Some(index)) {{ out.push_str(&tag); out.push(' '); }} out.push_str(&core::yaml::mapping_key(&row.fields[{key_index}])); out.push_str(": "); out.push_str(&core::yaml::scalar(&row.fields[{text_index}])); }}
if value.rows.is_empty() {{ out.push_str(" {{}}"); }} return Ok(out.into_bytes()); }}
if shorten || value.rows.is_empty() {{ {presence_yaml} }}
if !value.rows.is_present() {{ return Err(RuntimeDiagnostic::new("yaml.presence", "No declared YAML form represents absence")); }}
let mut out=core::yaml::scalar({key_name:?}); out.push(':');
{shorthand_write}
append_rows_{id}(&mut out, &value.rows); Ok(out.into_bytes()) }}
fn append_rows_{id}<'a>(out: &mut String, rows: impl IntoIterator<Item=&'a R{id}>) {{ let mut any=false; for row in rows {{ any=true; out.push_str("\n  "); out.push_str(&core::yaml::mapping_key(&row.fields[{key_index}])); out.push_str(": "); out.push_str(&core::yaml::scalar(&row.fields[{text_index}])); }} if !any {{ out.push_str(" {{}}"); }} }}
"#).unwrap();
    // Prefixes belong to the declaration; only the exceptional path materializes a tree.
    let raw_namespaces: Vec<_> = common
        .namespaces
        .iter()
        .chain(&entry.namespaces)
        .map(|binding| (binding.name.as_str(), binding.value.as_str()))
        .collect();
    let raw_qnames: Vec<_> = declared_attributes
        .iter()
        .filter(|attribute| matches!(attribute.value, LinkedXmlAttributeValue::QName(_)))
        .map(|attribute| {
            (
                attribute.name.namespace.as_str(),
                attribute.name.local.as_str(),
            )
        })
        .collect();
    let physical = parent.last().expect("property path");
    let physical_key = &physical.local;
    let physical_namespace = &physical.namespace;
    let raw_key = if key_name == physical_key {
        format!("{key_name:?}")
    } else {
        format!("if value.rows.is_present() {{ {key_name:?} }} else {{ {physical_key:?} }}")
    };
    writeln!(out, r#"fn read_yaml_{id}(source: &[u8], inputs: &PreparedInputs) -> core::Result<V{id}> {{
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
    writeln!(out, "fn write_plain_xml_{id}(value: &V{id}, _inputs: &PreparedInputs) -> core::Result<Vec<u8>> {{ let _value=value; let mut out=core::xml::Writer::new(&{:?}); {attribute_write} {presence_xml} {write_missing} out.container_with_attributes({parent_code}, &attributes); for row in &value.rows {{ out.container({item_code});", namespaces.iter().copied().collect::<Vec<_>>()).unwrap();
    for (index, path) in paths.iter().enumerate() {
        writeln!(
            out,
            "out.field({}, &row.fields[{index}]);",
            super::record::path_code(path)
        )
        .unwrap();
    }
    out.push_str("out.end_container(); } Ok(out.finish()) }\n");
    let writer_namespaces = namespaces.iter().copied().collect::<Vec<_>>();
    writeln!(out, r#"fn write_xml_{id}(value: &V{id}, inputs: &PreparedInputs) -> core::Result<Vec<u8>> {{
        let ordinary=write_plain_xml_{id}(value, inputs)?;
        let Some(patch)=&value.raw else {{return Ok(ordinary);}};
        let tree=core::xml::Tree::capture(&ordinary,{parent_code})?;
        let tree=patch.apply(tree,core::xml::Name {{namespace:{physical_namespace:?}.into(),local:{physical_key:?}.into()}},&{raw_namespaces:?},&{raw_qnames:?})?;
        let mut out=core::xml::Writer::new(&{writer_namespaces:?});
        tree.write_at(&mut out,{missing_root},&{raw_qnames:?})?; Ok(out.finish())
    }}"#).unwrap();
    let scalar = paths
        .iter()
        .map(|path| {
            format!(
                "core::xml::matches(path, {})",
                super::record::path_code(path)
            )
        })
        .collect::<Vec<_>>()
        .join(" || ");
    writeln!(out, "fn verify_{id}(original: &[u8], candidate: &[u8], _inputs: &PreparedInputs) -> core::Result<()> {{ let value=read_yaml_{id}(candidate, _inputs)?; if let Some(error)=check_yaml_{id}(&value, candidate, _inputs).into_iter().find(|error| error.severity==Severity::Error) {{ return Err(error); }} core::proof::verify_with_attributes(original, &write_xml_{id}(&value, _inputs)?, |path| {scalar}, |_path, _name| {qname_attributes}) }}").unwrap();
    writeln!(out, r#"fn finalize_yaml_{id}(original: &[u8], candidate: Vec<u8>, value: &V{id}, inputs: &PreparedInputs) -> core::Result<Vec<u8>> {{
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
        let tree=core::xml::Tree::capture(original, {parent_code})?.ok_or_else(|| RuntimeDiagnostic::new("xml.preservation-shape", "Cannot preserve an absent XML property"))?;
        let restored=read_plain_yaml_{id}(&candidate,inputs)?;
        let ordinary=write_plain_xml_{id}(&restored,inputs)?;
        let ordinary=core::xml::Tree::capture(&ordinary,{parent_code})?;
        let payload=tree.patch_yaml(ordinary.as_ref(), &{raw_namespaces:?}, &{raw_qnames:?})?;
        let annotated=core::raw::Property::encode({key_name:?}, {raw_key}, &candidate, payload.as_bytes())?;
        verify_{id}(original, &annotated, inputs)?;
        Ok(annotated)
    }}"#).unwrap();
    Ok(Some(out))
}
