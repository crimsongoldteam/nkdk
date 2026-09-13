//! Scalar fields in a composed record reuse the ordinary record codec.
use super::*;
use std::fmt::Write;

pub(super) fn lower(
    entry: &LinkedEntry,
    common: &LinkedEntry,
    child: &LinkedField,
    bindings: &[LinkedBinding],
    args: &[LinkedExpression],
) -> Result<LinkedEntry, Diagnostic> {
    let (
        LinkedType::Record(fields),
        LinkedXml::Record(xml),
        YamlRepresentation::Mapping(yaml),
        LinkedXml::Record(owner_xml),
    ) = (&common.value, &common.xml, &common.yaml, &entry.xml)
    else {
        unreachable!()
    };
    let mut flat = entry.clone();
    flat.constraints.clear();
    flat.contributions.clear();
    flat.presence.clear();
    flat.value = LinkedType::Record(
        fields
            .iter()
            .filter(|field| field.name != child.name)
            .cloned()
            .collect(),
    );
    flat.xml = LinkedXml::Record(
        xml.iter()
            .filter(|field| field.field != child.name)
            .map(|field| {
                let mut field = field.clone();
                field.path = owner_xml[0]
                    .path
                    .iter()
                    .chain(&field.path)
                    .cloned()
                    .collect();
                field
            })
            .collect(),
    );
    flat.yaml = YamlRepresentation::Mapping(
        yaml.iter()
            .filter(|field| field.field != child.name)
            .cloned()
            .collect(),
    );
    flat.field_dependencies = vec![Vec::new(); fields.len() - 1];
    for rule in &common.presence {
        let LinkedPresenceTarget::Field(index) = rule.target else {
            continue;
        };
        if fields[index as usize].name == child.name {
            continue;
        }
        let mut rule = rule.clone();
        let LinkedType::Record(selected) = &flat.value else {
            unreachable!()
        };
        rule.target = LinkedPresenceTarget::Field(
            selected
                .iter()
                .position(|field| field.name == fields[index as usize].name)
                .unwrap() as u32,
        );
        // Expressions keep semantic field identities when scalar storage is partitioned.
        for expr in rule.expressions_mut() {
            *expr = shorthand::specialize(expr, bindings, args, entry)?;
            owner_contracts::expression(expr, common, &flat)?;
        }
        flat.presence.push(rule);
    }
    Ok(flat)
}

pub(super) fn generate(
    flat: &LinkedEntry,
    program: &Program,
    wrapper: &[ExpandedName],
) -> Result<String, Diagnostic> {
    let id = flat.id;
    let (LinkedType::Record(fields), LinkedXml::Record(xml), YamlRepresentation::Mapping(yaml)) =
        (&flat.value, &flat.xml, &flat.yaml)
    else {
        unreachable!()
    };
    let mut out = record::generate(flat, program)?;
    out.push_str(&constraints::generate(flat, program)?);
    let header = xml.iter().position(|field| field.attribute.is_some());
    let attributes = xml
        .iter()
        .filter_map(|field| {
            field
                .attribute
                .as_ref()
                .map(|name| (name.namespace.as_str(), name.local.as_str()))
        })
        .collect::<Vec<_>>();
    let mut routes = String::new();
    for field in xml.iter().filter(|field| field.attribute.is_none()) {
        write!(
            routes,
            " || (path.len()>={} && core::xml::matches(&path[..{}],{}))",
            field.path.len(),
            field.path.len(),
            record::path_code(&field.path)
        )
        .unwrap();
    }
    if xml.iter().any(|field| {
        if field.attribute.is_some() {
            field.path != wrapper
        } else {
            field.path.len() <= wrapper.len()
        }
    }) {
        return Err(unsupported(
            flat,
            "Composed scalar attributes belong to the shared wrapper and scalar elements to its descendants",
        ));
    }
    let root = &wrapper[..1];
    let root = record::path_code(root);
    let wrapper = record::path_code(wrapper);
    let keys = yaml
        .iter()
        .map(|field| field.key.as_str())
        .chain(xml.iter().map(|field| {
            field
                .attribute
                .as_ref()
                .unwrap_or_else(|| field.path.last().unwrap())
                .local
                .as_str()
        }))
        .collect::<Vec<_>>();
    writeln!(out,r#"
pub(super) struct Stored(V{id});
pub(super) struct Prepared(XmlPrepared{id});
pub(super) const KEYS:&[&str]=&{keys:?};
pub(super) fn read_xml(source:&[u8],inputs:&PreparedInputs,events:impl core::xml::Source)->core::Result<Stored>{{read_xml_events_{id}(source,inputs,events).map(Stored)}}
pub(super) fn empty(inputs:&PreparedInputs)->core::Result<Stored>{{read_xml(&[],inputs,core::xml::Events(|_:&mut core::xml::Consumer<'_>|Ok(())))}}
pub(super) fn read_yaml(source:&[u8],inputs:&PreparedInputs,events:impl core::yaml::Source)->core::Result<Stored>{{read_yaml_events_{id}(source,inputs,core::raw::Fields::default(),events).map(Stored)}}
pub(super) fn read_document(source:&[u8],inputs:&PreparedInputs)->core::Result<Stored>{{read_yaml_{id}(source,inputs).map(Stored)}}
pub(super) fn route(path:&[core::xml::Name],token:&core::xml::Token<'_>)->bool{{
if let core::xml::Token::Attribute(a)=token && core::xml::matches(path,{wrapper}) {{return {attributes:?}.contains(&(a.name.namespace.as_str(),a.name.local.as_str()));}}
false{routes}
}}
pub(super) fn boundary(path:&[core::xml::Name],token:&core::xml::Token<'_>)->bool{{!matches!(token,core::xml::Token::Attribute(_)) && (core::xml::matches(path,{root}) || core::xml::matches(path,{wrapper}))}}
pub(super) fn check_xml(value:&Stored,source:&[u8],inputs:&PreparedInputs)->Vec<RuntimeDiagnostic>{{check_xml_{id}(&value.0,source,inputs)}}
pub(super) fn check_yaml(value:&Stored,source:&[u8],inputs:&PreparedInputs)->Vec<RuntimeDiagnostic>{{check_yaml_{id}(&value.0,source,inputs)}}
pub(super) fn prepare(value:&Stored,inputs:&PreparedInputs)->core::Result<Prepared>{{prepare_xml_{id}(&value.0,inputs).map(Prepared)}}
pub(super) fn namespaces<'a>(value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>){{namespaces_xml_{id}(&value.0,&prepared.0,names)}}
pub(super) fn scalar(value:&Stored,path:&[core::xml::Name])->bool{{xml_scalar_{id}(&value.0,path)}}
pub(super) fn write_yaml(value:&Stored,inputs:&PreparedInputs,out:&mut String,indent:&str)->core::Result<()>{{
core::yaml::append_properties(out,|out|{{if value.0.raw.is_empty() {{write_yaml_indented_{id}(&value.0,inputs,out,indent,true)}} else {{let bytes=write_yaml_preserved_fields_{id}(&value.0,inputs,true)?;let text=std::str::from_utf8(&bytes).map_err(|e|RuntimeDiagnostic::new("yaml.encoding",e.to_string()))?;core::yaml::Indented::new(out,indent).push_str(text);Ok(())}}}})
}}
pub(super) fn write_elements<'a>(value:&Stored,prepared:&'a Prepared,inputs:&PreparedInputs,out:&mut core::xml::Writer<'a>)->core::Result<()>{{let _=(value,prepared,inputs,&out);
"#).unwrap();
    for (index, field) in fields.iter().enumerate() {
        if xml
            .iter()
            .find(|mapping| mapping.field == field.name)
            .unwrap()
            .attribute
            .is_none()
        {
            writeln!(
                out,
                "write_xml_field_{id}_{index}(&value.0,&prepared.0,inputs,out)?;"
            )
            .unwrap();
        }
    }
    out.push_str("Ok(())}\n");
    writeln!(out,"pub(super) fn has_meaning(value:&Stored,inputs:&PreparedInputs)->core::Result<bool>{{let _=(value,inputs);").unwrap();
    for (index, field) in fields.iter().enumerate() {
        let presence = scalar_presence::rule(flat, index, &field.value, program);
        let omitted = if presence.is_some_and(|rule| rule.yaml_omit_when.is_some()) {
            format!(" && !omit_{id}_{index}(&value.0,inputs)?")
        } else {
            String::new()
        };
        writeln!(
            out,
            "if value.0.f{index}.is_some(){omitted} {{return Ok(true);}}"
        )
        .unwrap();
    }
    out.push_str("Ok(false)}\n");
    if let Some(header) = header {
        writeln!(out,"pub(super) fn with_attributes(value:&Stored,consume:impl FnOnce(&[Option<core::xml::WriteAttribute<'_>>])->core::Result<()>)->core::Result<()> {{with_header_xml_{id}_{header}(&value.0,consume)}}").unwrap();
    } else {
        out.push_str("pub(super) fn with_attributes(_value:&Stored,consume:impl FnOnce(&[Option<core::xml::WriteAttribute<'_>>])->core::Result<()>)->core::Result<()> {consume(&[])}\n");
    }
    Ok(out)
}
