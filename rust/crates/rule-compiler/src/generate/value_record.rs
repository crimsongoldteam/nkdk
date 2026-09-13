//! The same record body serves a property and a collection element.
use super::*;

pub(super) struct RecordBody {
    pub source: String,
    pub scalar_routes: String,
}

pub(super) fn generate(
    row: &LinkedEntry,
    program: &Program,
    boundary: &[ExpandedName],
    lifted: Option<(usize, String)>,
) -> Result<RecordBody, Diagnostic> {
    let LinkedType::Record(row_fields) = &row.value else {
        return Err(unsupported(row, "Expected a record value"));
    };
    let composed = !attributes::content(&row.xml).1.is_empty()
        || row_fields
            .iter()
            .any(|field| scalar::Codec::resolve(&field.value, row, program).is_err());
    if composed && !owner::state_supported(row, program)? {
        return Err(unsupported(
            row,
            "This item representation does not yet support independent event states",
        ));
    }
    let scalar_routes = if let LinkedXml::Record(fields) = attributes::content(&row.xml).0 {
        fields
            .iter()
            .filter(|field| field.attribute.is_none())
            .map(|field| {
                format!(
                    "core::xml::matches(path,{})",
                    record::path_code(&field.path)
                )
            })
            .collect::<Vec<_>>()
            .join(" || ")
    } else {
        String::new()
    };
    let captured = crate::plan::scopes::capture_inputs(row)?;
    let parts = if composed && lifted.is_some() {
        crate::plan::records::parts(&captured.entry)?
    } else {
        Vec::new()
    };
    let lifted_scope = if parts.is_empty() {
        String::new()
    } else {
        super::value::InputScope::prepare(row, &parts, &captured.captures, program)?
            .bind(row.id, "value.0.", None)
    };
    let lifted_write = match &lifted {
        None => "unreachable!()".into(),
        Some((index, _)) if !composed => {
            format!("write_yaml_except_@id@(&value.0,inputs,out,indent,false,Some({index}))")
        }
        Some((index, _)) => {
            let mut code = lifted_scope;
            for (slot, part) in parts.iter().enumerate() {
                let LinkedType::Record(fields) = &part.value else {
                    unreachable!()
                };
                if let Some(field) = fields
                    .iter()
                    .position(|field| field.name == row_fields[*index].name)
                {
                    code.push_str(&format!("part_@id@_{slot}::write_yaml_except(&value.0.p{slot},inputs,out,indent,{field})?;"));
                } else {
                    code.push_str(&format!("part_@id@_{slot}::write_yaml_indented(&value.0.p{slot},inputs,out,indent)?;"));
                }
            }
            code.push_str("Ok(())");
            code
        }
    };
    let key_available = match &lifted {
        None => "true".into(),
        Some((index, _)) if !composed => format!("!value.0.raw.has_annotation({index})"),
        Some((index, _)) => {
            let (slot, field) = parts
                .iter()
                .enumerate()
                .find_map(|(slot, part)| {
                    let LinkedType::Record(fields) = &part.value else {
                        return None;
                    };
                    fields
                        .iter()
                        .position(|field| field.name == row_fields[*index].name)
                        .map(|field| (slot, field))
                })
                .expect("linked key part");
            format!("!part_@id@_{slot}::field_has_annotation(&value.0.p{slot},{field})")
        }
    };
    let row_code = if composed {
        owner::generate_at(row, program, Some(boundary))?
    } else {
        record::generate(row, program)?
    };
    let checks = if composed {
        String::new()
    } else {
        constraints::generate(row, program)?
    };
    let mut code = RECORD_BODY
        .replace("@row@", &row_code)
        .replace("@checks@", &checks);
    code = code
        .replace(
            "@prepared@",
            if composed {
                "OwnerPrepared@id@"
            } else {
                "XmlPrepared@id@"
            },
        )
        .replace(
            "@xml_state@",
            if composed {
                "OwnerXmlRead@id@"
            } else {
                "XmlRead@id@"
            },
        )
        .replace(
            "@xml_consume@",
            if composed {
                "self.0.consume(path,token,(),source,inputs)"
            } else {
                "self.0.consume(path,token)"
            },
        )
        .replace(
            "@xml_finish@",
            if composed {
                "self.0.finish(source,inputs)"
            } else {
                "finish_xml_@id@(self.0,source,inputs)"
            },
        )
        .replace(
            "@yaml_reader@",
            if composed { COMPOSED_YAML } else { SCALAR_YAML },
        )
        .replace(
            "@prepare_row@",
            if composed {
                "prepare_xml_plain_@id@"
            } else {
                "prepare_xml_@id@"
            },
        )
        .replace(
            "@namespaces_row@",
            if composed {
                "namespaces_xml_plain_@id@"
            } else {
                "namespaces_xml_@id@"
            },
        )
        .replace(
            "@write_row@",
            if composed {
                "write_xml_plain_into_@id@"
            } else {
                "write_xml_into_@id@"
            },
        )
        .replace(
            "@yaml_write_row@",
            if composed {
                "write_yaml_indented_@id@(&value.0,inputs,out,indent,false)"
            } else {
                SCALAR_WRITE
            },
        );
    code = code
        .replace("@lifted_write@", &lifted_write)
        .replace("@key_available@", &key_available);
    code = code.replace(
        "@row_scalar@",
        if composed {
            "xml_scalar_at_@id@(&value.0,path,occurrences)"
        } else {
            "let _=occurrences;xml_scalar_@id@(&value.0,path)"
        },
    );
    code = code.replace("@id@", &row.id.to_string());
    Ok(RecordBody {
        source: code,
        scalar_routes,
    })
}

const RECORD_BODY: &str = r#"#[allow(dead_code)] mod item_@id@ {
use super::*;
@row@
@checks@
pub(super) struct Stored(V@id@);
pub(super) struct Prepared(@prepared@);
pub(super) struct XmlReader(@xml_state@);
impl XmlReader {
pub(super) fn new()->Self{Self(@xml_state@::new())}
pub(super) fn consume(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{let _=(source,inputs);@xml_consume@}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{@xml_finish@.map(Stored)}
}
@yaml_reader@
pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{read_xml_@id@(source,inputs).map(Stored)}
pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{read_yaml_@id@(source,inputs).map(Stored)}
pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{finalize_yaml_@id@(source,write_yaml_@id@(&value.0,inputs)?,&value.0,inputs)}
pub(super) fn text(value:&Stored,field:usize)->core::Result<&str>{text_field_@id@(&value.0,field)}
pub(super) fn prepare(value:&Stored,inputs:&InputView<'_>)->core::Result<Prepared>{@prepare_row@(&value.0,inputs).map(Prepared)}
pub(super) fn namespaces<'a>(value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>){@namespaces_row@(&value.0,&prepared.0,names)}
pub(super) fn write_xml<'a>(value:&Stored,prepared:&'a Prepared,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{@write_row@(&value.0,&prepared.0,inputs,out)}
pub(super) fn write_yaml(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{@yaml_write_row@}

pub(super) fn key_can_be_lifted(value:&Stored)->bool{let _=value;@key_available@}
pub(super) fn write_mapping_value(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{let _=(value,inputs,&mut *out,indent);@lifted_write@}
pub(super) fn check(value:&Stored,source:&[u8],inputs:&InputView<'_>,xml:bool)->Vec<RuntimeDiagnostic>{if xml{check_xml_@id@(&value.0,source,inputs)}else{check_yaml_@id@(&value.0,source,inputs)}}
pub(super) fn scalar(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool{@row_scalar@}
pub(super) fn qnames()->Vec<(&'static str,&'static str)>{xml_qnames_@id@()}
pub(super) fn qname_attribute(path:&[core::xml::Name],name:&core::xml::Name)->bool{xml_qname_attribute_@id@(path,name)}
pub(super) fn qname_text(path:&[core::xml::Name])->bool{xml_qname_text_@id@(path)}
}
"#;

const SCALAR_YAML: &str = r#"pub(super) struct YamlReader{mapping:core::yaml::ScalarMapping,fields:YamlFields@id@}
impl YamlReader {
pub(super) fn new()->core::Result<Self>{Ok(Self{mapping:core::yaml::ScalarMapping::default(),fields:YamlFields@id@::new(core::raw::Fields::default())?})}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{if let Some(entry)=self.mapping.consume(node,position)?{self.fields.consume(entry.key,entry.value,entry.tag)?;}Ok(())}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{self.mapping.finish()?;finish_yaml_@id@(self.fields,source,inputs).map(Stored)}
}
"#;
const SCALAR_WRITE: &str = r#"if value.0.raw.is_empty(){write_yaml_indented_@id@(&value.0,inputs,out,indent,false)}else{let bytes=write_yaml_preserved_@id@(&value.0,inputs)?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect("generated YAML"));Ok(())}"#;
const COMPOSED_YAML: &str = r#"
pub(super) struct YamlReader(OwnerYamlRead@id@);
impl YamlReader{
pub(super) fn new()->core::Result<Self>{OwnerYamlRead@id@::new().map(Self)}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{self.0.consume(node,position,source,inputs)}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{self.0.finish(source,inputs).map(Stored)}
}
"#;
