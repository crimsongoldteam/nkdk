//! The same record body serves a property and a collection element.
use super::*;
use std::{cell::RefCell, collections::BTreeMap};

thread_local! {
    static RECORD_STACK: RefCell<Vec<String>> = const { RefCell::new(Vec::new()) };
    static RECURSIVE_TARGETS: RefCell<BTreeMap<String, u32>> = const { RefCell::new(BTreeMap::new()) };
}

pub(super) struct RecursiveTargets(BTreeMap<String, u32>);
impl RecursiveTargets {
    pub(super) fn enter(targets: BTreeMap<String, u32>) -> Self {
        Self(
            RECURSIVE_TARGETS
                .with(|current| std::mem::replace(&mut *current.borrow_mut(), targets)),
        )
    }
}
impl Drop for RecursiveTargets {
    fn drop(&mut self) {
        RECURSIVE_TARGETS.with(|current| {
            *current.borrow_mut() = std::mem::take(&mut self.0);
        });
    }
}

fn recursive_target(name: &str) -> Option<u32> {
    RECURSIVE_TARGETS.with(|targets| targets.borrow().get(name).copied())
}

pub(super) fn is_recursive(name: &str) -> bool {
    recursive_target(name).is_some()
}

struct RecordFrame(String);
impl RecordFrame {
    fn enter(entry: &LinkedEntry) -> Option<Self> {
        let repeated = RECORD_STACK.with(|stack| stack.borrow().contains(&entry.name));
        if repeated && recursive_target(&entry.name).is_some() {
            return None;
        }
        RECORD_STACK.with(|stack| stack.borrow_mut().push(entry.name.clone()));
        Some(Self(entry.name.clone()))
    }
}
impl Drop for RecordFrame {
    fn drop(&mut self) {
        RECORD_STACK.with(|stack| {
            assert_eq!(stack.borrow_mut().pop().as_deref(), Some(self.0.as_str()));
        });
    }
}

pub(super) struct RecordBody {
    pub source: String,
    pub scalar_routes: String,
    pub constructible: bool,
}

fn projected_mapping_write(body: String, value: Option<&str>, physical: Option<&str>) -> String {
    let Some(value) = value else { return body };
    let physical = physical.unwrap_or(value);
    format!(
        "let mut projected=String::new();{{let out=&mut projected;(||->core::Result<()>{{{body}}})()?;}}let bytes=core::yaml::mapping_value(projected.as_bytes(),{value:?},{physical:?})?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));Ok(())"
    )
}

pub(super) fn generate(
    row: &LinkedEntry,
    program: &Program,
    boundary: &[ExpandedName],
    lifted: Option<(usize, String, Option<String>)>,
) -> Result<RecordBody, Diagnostic> {
    generate_bound(row, program, boundary, lifted, None)
}

pub(super) fn generate_bound(
    row: &LinkedEntry,
    program: &Program,
    boundary: &[ExpandedName],
    lifted: Option<(usize, String, Option<String>)>,
    bindings: Option<&[LinkedBinding]>,
) -> Result<RecordBody, Diagnostic> {
    let Some(_frame) = RecordFrame::enter(row) else {
        return recursive(row, program, boundary, lifted, bindings);
    };
    let LinkedType::Record(row_fields) = &row.value else {
        return Err(unsupported(row, "Expected a record value"));
    };
    let compact = matches!(row.yaml, YamlRepresentation::TextPattern(_));
    let projected = matches!(row.yaml, YamlRepresentation::Projection(_));
    let composed = (projected && super::choice_value::applies(row, program))
        || row_fields
            .iter()
            .any(|field| scalar::Codec::resolve(&field.value, row, program).is_err())
        || row.shorthands.iter().any(|short| {
            !short.canonical
                || matches!(
                    short.representation,
                    LinkedShorthandRepresentation::ScalarField(_)
                        | LinkedShorthandRepresentation::MappingField(_)
                        | LinkedShorthandRepresentation::ScalarLiteral(_)
                )
        });
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
    let prepared = (composed && (lifted.is_some() || is_recursive(&row.name)))
        .then(|| program.composition(row))
        .transpose()?;
    let parts = prepared
        .as_ref()
        .map_or(&[][..], |plan| plan.parts.as_slice());
    let lifted_scope = if parts.is_empty() {
        String::new()
    } else {
        super::value::InputScope::prepare(
            row,
            parts,
            &prepared.as_ref().unwrap().captures,
            program,
        )?
        .bind(row.id, "value.0.", None)
    };
    let value_physical = lifted.as_ref().and_then(|(_, _, value)| {
        let value = value.as_ref()?;
        let LinkedXml::Record(xml_fields) = attributes::content(&row.xml).0 else {
            return None;
        };
        let yaml_field = match &row.yaml {
            YamlRepresentation::Mapping(fields) => {
                fields.iter().find(|field| &field.key == value)?
            }
            _ => return None,
        };
        let xml_field = xml_fields
            .iter()
            .find(|field| field.field == yaml_field.field)?;
        xml_field
            .attribute
            .as_ref()
            .or_else(|| xml_field.path.last())
            .or_else(|| boundary.last())
            .map(|name| name.local.as_str())
    });
    let recursive_projection = if is_recursive(&row.name) {
        let mut body = lifted_scope.clone();
        let mut checks = String::new();
        if composed {
            for slot in crate::plan::records::yaml_slots(row, parts) {
                let part = &parts[slot];
                let LinkedType::Record(fields) = &part.value else {
                    unreachable!()
                };
                body.push_str("match excluded{");
                for (field, definition) in fields.iter().enumerate() {
                    let Some(index) = row_fields
                        .iter()
                        .position(|candidate| candidate.name == definition.name)
                    else {
                        continue;
                    };
                    if fields.len() == 1 {
                        body.push_str(&format!("{index}=>{{}},"));
                    } else {
                        body.push_str(&format!("{index}=>part_@id@_{slot}::write_yaml_except(&value.0.p{slot},inputs,out,indent,{field})?,"));
                    }
                    checks.push_str(&format!("{index}=>!part_@id@_{slot}::field_has_annotation(&value.0.p{slot},{field}),"));
                }
                body.push_str(&format!("_=>part_@id@_{slot}::write_yaml_indented(&value.0.p{slot},inputs,out,indent)?}}"));
            }
            body.push_str("Ok(())");
            checks = format!("match excluded{{{checks}_=>false}}");
        } else {
            body = SCALAR_WRITE.replace("@excluded@", "Some(excluded)");
            checks = "!value.0.raw.has_annotation(excluded)".into();
        }
        format!(
            "pub(super) fn write_mapping_except(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str,excluded:usize)->core::Result<()>{{{body}}}\npub(super) fn key_can_be_excluded(value:&Stored,excluded:usize)->bool{{{checks}}}\n"
        )
    } else {
        String::new()
    };
    let lifted_write = match &lifted {
        None => "unreachable!()".into(),
        Some((index, _, value)) if !composed => projected_mapping_write(
            SCALAR_WRITE.replace("@excluded@", &format!("Some({index})")),
            value.as_deref(),
            value_physical,
        ),
        Some((index, _, value)) => {
            let mut code = lifted_scope;
            if value.is_none() && !row.shorthands.is_empty() {
                code.push_str(
                    "if write_yaml_shorthand_@id@(&value.0,inputs,out,indent)?{return Ok(());}",
                );
            }
            for slot in crate::plan::records::yaml_slots(row, parts) {
                let part = &parts[slot];
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
            projected_mapping_write(code, value.as_deref(), value_physical)
        }
    };
    let key_available = match &lifted {
        None => "true".into(),
        Some((index, _, _)) if !composed => format!("!value.0.raw.has_annotation({index})"),
        Some((index, _, _)) => {
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
    let mut row_code = if composed {
        owner::generate_at(row, program, Some(boundary))?
    } else {
        record::generate_value_at(row, program, boundary)?
    };
    let fact_code = super::facts::stored_record_contributions(row, program)?;
    let checks = if composed {
        String::new()
    } else {
        constraints::scalar_record(row, program)?
    };
    let constructible = super::record_construction::supported(row, program);
    if composed && constructible && row.shorthands.is_empty() {
        row_code.push_str(&super::record_construction::composed(row, program)?);
    }
    let default_constructor = if super::record_construction::defaultable(row, program)? {
        "pub(super) fn construct_defaults(inputs:&InputView<'_>)->core::Result<Stored>{let mut reader=YamlReader::new()?;core::yaml::Source::visit(core::yaml::EmptyMappingSource,|node,position|reader.consume(node,position,b\"\",inputs))?;reader.finish(b\"\",inputs)}"
    } else {
        ""
    };
    let constructor = if constructible {
        "pub(super) fn construct(slots:&[Option<core::inputs::InputRef<'_>>],inputs:&InputView<'_>)->core::Result<Stored>{construct_@id@(slots,inputs).map(Stored)}"
    } else {
        ""
    };
    let shorthand = if row.shorthands.is_empty() || composed {
        None
    } else {
        Some(super::record::shorthand::nested_reader(row)?)
    };
    let scalar_write = if compact {
        "let bytes=write_yaml_@id@(&value.0,inputs)?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect(\"generated YAML\"));Ok(())".into()
    } else if composed && !row.shorthands.is_empty() {
        "write_yaml_indented_@id@(&value.0,inputs,out,indent,false)".into()
    } else if shorthand.is_some() {
        format!(
            "if write_yaml_shorthand_@id@(&value.0,inputs,out,indent)? {{Ok(())}} else {{{}}}",
            SCALAR_WRITE.replace("@excluded@", "None")
        )
    } else {
        SCALAR_WRITE.replace("@excluded@", "None")
    };
    let shorthand_yaml = shorthand
        .as_ref()
        .map(|read| SHORTHAND_YAML.replace("@nested_read@", read));
    let boundary_prepared = if compact || composed {
        BOUNDARY_PREPARED
            .replace("@ordinary_type@", if composed { "OwnerPrepared@id@" } else { "XmlPrepared@id@" })
            .replace("@ordinary_prepare@", if composed { "prepare_xml_plain_@id@" } else { "prepare_xml_@id@" })
            .replace("@ordinary_namespaces@", if composed { "namespaces_xml_plain_@id@" } else { "namespaces_xml_@id@" })
            .replace("@ordinary_write@", if composed { "write_xml_plain_into_@id@" } else { "write_xml_into_@id@" })
            .replace("@root_raw@", if composed { "value.root.is_some()" } else { "value.raw.get(@root_slot@).is_some()" })
            .replace("@capture_tree@", if composed { "core::xml::Tree::capture_with_qnames(&write_xml_@id@(value,inputs)?,@boundary@,xml_qname_text_@id@)?" } else { "text_tree_@id@(&write_xml_@id@(value,inputs)?)?" })
            .replace("@boundary_qnames@", if composed { "&xml_qnames_@id@()" } else { "Q@id@" })
    } else {
        String::new()
    };
    let single_yaml = if projected {
        SINGLE_VALUE_YAML
            .replace("seen:bool", "seen:u8")
            .replace("seen:false", "seen:0")
            .replace("if !self.seen", "if self.seen!=1")
    } else {
        SINGLE_VALUE_YAML.to_owned()
    };
    let mut code = RECORD_BODY
        .replace("@boundary_prepared@", &boundary_prepared)
        .replace("@row@", &format!("{row_code}{fact_code}"))
        .replace("@checks@", &checks)
        .replace(
            "@compact_prepared@",
            if compact { TEXT_PREPARED } else { "" },
        )
        .replace("@root_slot@", &row_fields.len().to_string())
        .replace("@boundary@", &record::path_code(boundary))
        .replace(
            "@boundary_parent@",
            &record::path_code(&boundary[..boundary.len() - 1]),
        )
        .replace("@default_constructor@", default_constructor)
        .replace("@constructor@", constructor);
    code = code
        .replace(
            "@prepared@",
            if compact || composed {
                "BoundaryPrepared@id@"
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
                "self.0.consume(path,token,scope,source,inputs)"
            } else if compact {
                "self.0.consume(path,token)"
            } else {
                "self.0.consume_scoped(path,token,scope)"
            },
        )
        .replace(
            "@xml_finish@",
            if matches!(row.yaml, YamlRepresentation::GroupedSequence(_)) {
                "self.0.finish(source,inputs).or_else(|error|if error.code.as_deref().is_some_and(|code|code.starts_with(\"xml.\")||code.starts_with(\"value.\")){preserved_group_@id@(source,inputs)}else{Err(error)})"
            } else if composed {
                "self.0.finish(source,inputs)"
            } else {
                "finish_xml_@id@(self.0,source,inputs)"
            },
        )
        .replace(
            "@yaml_reader@",
            if composed {
                COMPOSED_YAML
            } else if compact || projected {
                &single_yaml
            } else if let Some(shorthand_yaml) = &shorthand_yaml {
                shorthand_yaml
            } else {
                SCALAR_YAML
            },
        )
        .replace(
            "@prepare_row@",
            if compact || composed {
                "prepare_boundary_xml_@id@"
            } else {
                "prepare_xml_@id@"
            },
        )
        .replace(
            "@namespaces_row@",
            if compact || composed {
                "namespaces_boundary_xml_@id@"
            } else {
                "namespaces_xml_@id@"
            },
        )
        .replace(
            "@write_row@",
            if compact || composed {
                "write_boundary_xml_@id@"
            } else {
                "write_xml_into_@id@"
            },
        )
        .replace(
            "@yaml_write_row@",
            if composed {
                "write_yaml_indented_@id@(&value.0,inputs,out,indent,false)"
            } else {
                &scalar_write
            },
        );
    code = code.replace(
        "@single_reader@",
        if compact { "text" } else { "projection" },
    );
    code = code.replace("@debug_field@", "input_field_@id@(&self.0,index)");
    let field_presence = if composed {
        "input_field_@id@(&value.0,field).is_some_and(core::inputs::InputRef::is_present)"
            .to_owned()
    } else {
        let arms = (0..row_fields.len())
            .map(|index| format!("{index}=>value.0.f{index}.is_some(),"))
            .collect::<String>();
        format!("match field{{{arms}_=>false}}")
    };
    code = code.replace("@field_presence@", &field_presence);
    let inspection_plan = composed.then(|| program.composition(row)).transpose()?;
    let field_annotation = if let Some(plan) = &inspection_plan {
        let mut arms = String::new();
        for (slot, part) in plan.parts.iter().enumerate() {
            let LinkedType::Record(fields) = &part.value else {
                continue;
            };
            for (local, field) in fields.iter().enumerate() {
                let Some(index) = row_fields
                    .iter()
                    .position(|candidate| candidate.name == field.name)
                else {
                    continue;
                };
                write!(
                    arms,
                    "{index}=>part_@id@_{slot}::field_has_annotation(&value.0.p{slot},{local}),"
                )
                .unwrap();
            }
        }
        format!("match field{{{arms}_=>false}}")
    } else {
        "value.0.raw.has_annotation(field)".to_owned()
    };
    code = code.replace("@field_annotation@", &field_annotation);
    let raw_present = if let Some(plan) = &inspection_plan {
        let mut checks = vec!["value.0.root.is_some()".to_owned()];
        checks.extend(
            plan.parts
                .iter()
                .enumerate()
                .map(|(slot, _)| format!("part_@id@_{slot}::has_raw(&value.0.p{slot})")),
        );
        checks.join(" || ")
    } else {
        "!value.0.raw.is_empty()".to_owned()
    };
    code = code.replace("@raw_present@", &raw_present);
    code = code
        .replace("@recursive_projection@", &recursive_projection)
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
    let sequence_items = if composed
        && crate::yaml_shape::declared_sequence_projection(
            row,
            program,
            &mut std::collections::BTreeSet::new(),
        ) {
        "pub(super) fn write_yaml_sequence_items<const ROOT:bool,const MARKED:bool>(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str,mark:&str)->core::Result<()>{write_yaml_sequence_items_@id@::<ROOT,MARKED>(&value.0,inputs,out,indent,mark)}"
    } else {
        ""
    };
    code = code.replace("@sequence_items_writer@", sequence_items);
    if super::external_text::has_documents(row, program) {
        code = code.replace("@text_documents@", "\npub(super) fn yaml_documents(value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<(core::resources::RelativePath,Vec<u8>)>>{write_yaml_documents_@id@(&value.0,inputs)}");
    }
    code = code.replace("@text_documents@", "");
    code = code.replace("@id@", &row.id.to_string());
    Ok(RecordBody {
        source: super::record_bodies::share_from_entry(code, row),
        scalar_routes,
        constructible,
    })
}

pub(super) fn recursive_root(id: u32) -> String {
    format!("__nkdk_recursive_{id}")
}

fn recursive(
    row: &LinkedEntry,
    program: &Program,
    boundary: &[ExpandedName],
    lifted: Option<(usize, String, Option<String>)>,
    bindings: Option<&[LinkedBinding]>,
) -> Result<RecordBody, Diagnostic> {
    if boundary.is_empty() {
        return Err(unsupported(
            row,
            "Recursive records need a physical XML boundary",
        ));
    }
    let id = row.id;
    let target_id = recursive_target(&row.name)
        .ok_or_else(|| unsupported(row, "Recursive record has no reusable declaration target"))?;
    let route = record::path_code(boundary);
    let parent = record::path_code(&boundary[..boundary.len() - 1]);
    let physical = boundary.last().expect("recursive boundary");
    let root = recursive_root(target_id);
    let target_root = super::shared_capture::reference(
        &format!("recursive_value_{target_id}"),
        format!("recursive_value_{target_id}"),
    );
    let target = format!("{target_root}::item_{target_id}");
    let LinkedType::Record(fields) = &row.value else {
        unreachable!("recursive value rows are records")
    };
    let allows_absence = fields.len() == 1
        && scalar_presence::rule(row, 0, &fields[0].value, program).is_some_and(|presence| {
            presence
                .yaml_missing
                .as_ref()
                .is_some_and(|value| matches!(value.kind, LinkedExpressionKind::Absent))
                && scalar_presence::yaml_empty(Some(presence), EmptyKind::Null)
                && matches!(scalar_presence::absent_form(Some(presence)), XmlForm::Nil)
        });
    let mut bound_scope = String::new();
    let mut bound_slots = Vec::new();
    for binding in bindings.unwrap_or(&[]) {
        let slot = binding.slot as usize;
        bound_slots.resize(bound_slots.len().max(slot + 1), "None".to_owned());
        if let LinkedExpressionKind::Input(input) = binding.value.kind {
            bound_slots[slot] = format!("inputs.slot({input})");
        } else {
            let (definitions, expression) = expressions::expression(row, program, &binding.value)?;
            bound_scope.push_str(&definitions);
            bound_scope.push_str(&format!("let bound_{slot}={expression};"));
            let reference = match &binding.value.value_type {
                LinkedType::Scalar(ScalarType::Text) => format!(
                    "core::inputs::InputRef::Text(std::convert::AsRef::<str>::as_ref(&bound_{slot}))"
                ),
                LinkedType::Scalar(ScalarType::Boolean) => {
                    format!("core::inputs::InputRef::Boolean(bound_{slot})")
                }
                _ => {
                    return Err(unsupported(
                        row,
                        "A computed recursive input requires a borrowable scalar",
                    ));
                }
            };
            bound_slots[slot] = format!("Some({reference})");
        }
    }
    if !bound_slots.is_empty() {
        bound_scope = format!(
            "let _inputs=inputs;{bound_scope}let bound_slots=[{}];let view=inputs.rebind(&bound_slots);let inputs=&view;",
            bound_slots.join(",")
        );
    }
    let (key_available, mapping_write) = match lifted {
        None => ("false".into(), "Err(RuntimeDiagnostic::new(\"yaml.recursive-value\",\"Recursive record is not a keyed projection\"))".into()),
        Some((index, _, value)) => {
            let physical = value.as_ref().and_then(|key| {
                let YamlRepresentation::Mapping(yaml_fields) = &row.yaml else { return None };
                let field = yaml_fields.iter().find(|field| &field.key == key)?;
                let LinkedXml::Record(xml_fields) = attributes::content(&row.xml).0 else { return None };
                let route = xml_fields.iter().find(|candidate| candidate.field == field.field)?;
                route.attribute.as_ref().or_else(|| route.path.last()).map(|name| name.local.as_str())
            });
            (format!("value.0.as_deref().is_some_and(|value|{target}::key_can_be_excluded(value,{index}))"),
             projected_mapping_write(format!("let value=value.0.as_deref().ok_or_else(||RuntimeDiagnostic::new(\"fact.unready\",\"Absent recursive mapping value\"))?;with_inputs(inputs,|inputs|{target}::write_mapping_except(value,inputs,out,indent,{index}))"),value.as_deref(),physical))
        }
    };
    let contribution = if !super::facts::has_contributions(row, program) {
        String::new()
    } else {
        format!(
            "pub(super) fn contribute(value:&Stored,direction:Direction,source:&[u8],inputs:&InputView<'_>,builder:&mut core::facts::prepared::TextFactsBuilder)->std::result::Result<(),Vec<RuntimeDiagnostic>>{{let value=value.0.as_deref().ok_or_else(||vec![RuntimeDiagnostic::new(\"fact.unready\",\"Absent recursive value has no facts\")])?;let mut collect=||->std::result::Result<(),FactErrors>{{{bound_scope}{target}::contribute(value,direction,source,inputs,builder)?;Ok(())}};collect().map_err(|error|error.0)}}"
        )
    };
    let constructible = super::record_construction::supported(row, program);
    let constructor = if constructible {
        format!(
            "pub(super) fn construct(slots:&[Option<core::inputs::InputRef<'_>>],inputs:&InputView<'_>)->core::Result<Stored>{{with_inputs(inputs,|inputs|{target}::construct(slots,inputs)).map(|value|Stored(Some(Box::new(value))))}}"
        )
    } else {
        String::new()
    };
    let source = format!(
        r#"#[allow(dead_code)] mod item_{id} {{
use super::*;
const ROUTE:&[(&str,&str)]={route};
const PARENT:&[(&str,&str)]={parent};
fn virtual_source(source:&[u8],offset:usize)->core::Result<Vec<u8>>{{
let mut tree=core::xml::Tree::capture_at_with_qnames(source,ROUTE,offset,qname_text)?.ok_or_else(||RuntimeDiagnostic::new("xml.recursive-value","Missing recursive XML value"))?;
tree.rename_root(core::xml::Name{{namespace:String::new(),local:{root:?}.into()}});
tree.document(&qnames())}}
const ALLOWS_ABSENCE:bool={allows_absence};
{contribution}
fn with_inputs<T>(inputs:&InputView<'_>,f:impl FnOnce(&InputView<'_>)->core::Result<T>)->core::Result<T>{{{bound_scope}f(inputs)}}
pub(super) struct Stored(Option<Box<{target}::Stored>>);
{constructor}
pub(super) fn field_present(value:&Stored,field:usize)->bool{{value.0.as_deref().is_some_and(|body|{target}::field_present(body,field))}}
pub(super) fn field_has_annotation(value:&Stored,field:usize)->bool{{value.0.as_deref().is_some_and(|body|{target}::field_has_annotation(body,field))}}
pub(super) fn has_raw(value:&Stored)->bool{{value.0.as_deref().is_some_and({target}::has_raw)}}
impl core::inputs::RecordInput for Stored{{fn field(&self,index:usize)->Option<core::inputs::InputRef<'_>>{{self.0.as_deref().and_then(|value|core::inputs::RecordInput::field(value,index))}}}}
pub(super) struct Prepared(core::xml::Tree);
pub(super) struct XmlReader{{offset:Option<usize>,nil:bool,content:bool}}
impl XmlReader{{pub(super) fn new()->Self{{Self{{offset:None,nil:false,content:false}}}}pub(super) fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,_scope:Option<core::xml::NamespaceScope<'_>>,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{{if core::xml::matches(path,ROUTE){{match token{{core::xml::Token::Start(offset)=>{{if self.offset.replace(*offset).is_some(){{return Err(RuntimeDiagnostic::new("xml.duplicate-field","Repeated recursive value"))}}}},core::xml::Token::Attribute(attribute) if attribute.name.namespace=="http://www.w3.org/2001/XMLSchema-instance"&&attribute.name.local=="nil"&&attribute.text=="true"=>self.nil=true,core::xml::Token::Attribute(_)|core::xml::Token::Text(_)=>self.content=true,core::xml::Token::End=>{{}}}}}}else if self.offset.is_some()&&path.len()>ROUTE.len()&&core::xml::matches(&path[..ROUTE.len()],ROUTE)&&matches!(token,core::xml::Token::Start(_)){{self.content=true;}}Ok(())}}pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{let Some(offset)=self.offset else{{if ALLOWS_ABSENCE{{return Ok(Stored(None))}}return Err(RuntimeDiagnostic::new("value.missing","Missing recursive value"))}};if ALLOWS_ABSENCE&&(self.nil||!self.content){{return Ok(Stored(None))}}with_inputs(inputs,|inputs|{target}::read_xml(&virtual_source(source,offset)?,inputs)).map(|value|Stored(Some(Box::new(value))))}}}}
pub(super) struct YamlReader{{inner:Box<{target}::YamlReader>,absent:bool}}
impl YamlReader{{pub(super) fn new()->core::Result<Self>{{{target}::YamlReader::new().map(|value|Self{{inner:Box::new(value),absent:false}})}}pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{{if ALLOWS_ABSENCE&&matches!(&node,core::yaml::Node::Scalar(value,_) if value.is_null()){{if self.absent{{return Err(RuntimeDiagnostic::new("yaml.document","Expected one recursive value"))}}self.absent=true;return Ok(())}}if self.absent{{return Err(RuntimeDiagnostic::new("yaml.document","Expected one recursive value"))}}with_inputs(inputs,|inputs|self.inner.consume(node,position,source,inputs))}}pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{if self.absent{{Ok(Stored(None))}}else{{with_inputs(inputs,|inputs|self.inner.finish(source,inputs)).map(|value|Stored(Some(Box::new(value))))}}}}}}
pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{let mut reader=XmlReader::new();core::xml::visit_scoped(source,|path,token,scope|reader.consume_scoped(path,&token,Some(scope),source,inputs))?;reader.finish(source,inputs)}}
pub(super) fn recover_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{read_xml(source,inputs)}}
pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{{if ALLOWS_ABSENCE{{let mut reader=YamlReader::new()?;let document=if source.is_empty(){{b"null".as_slice()}}else{{source}};core::yaml::Source::visit(core::yaml::DocumentSource(document),|node,position|reader.consume(node,position,source,inputs))?;return reader.finish(source,inputs)}}with_inputs(inputs,|inputs|{target}::read_yaml(source,inputs)).map(|value|Stored(Some(Box::new(value))))}}
pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{{let Some(value)=value.0.as_deref()else{{return Ok(b"null".to_vec())}};let offset=core::xml::first_offset(source,ROUTE)?.ok_or_else(||RuntimeDiagnostic::new("value.missing","Missing recursive value"))?;with_inputs(inputs,|inputs|{target}::finalize(&virtual_source(source,offset)?,value,inputs))}}
pub(super) fn text(value:&Stored,field:usize)->core::Result<&str>{{let value=value.0.as_deref().ok_or_else(||RuntimeDiagnostic::new("fact.unready","Absent recursive value has no field"))?;{target}::text(value,field)}}
pub(super) fn prepare(value:&Stored,inputs:&InputView<'_>)->core::Result<Prepared>{{let Some(value)=value.0.as_deref()else{{let attribute=core::xml::WriteAttribute{{name:("http://www.w3.org/2001/XMLSchema-instance","nil"),value:core::xml::AttributeValue::Text("true")}};return Ok(Prepared(core::xml::Tree::scalar(core::xml::Name{{namespace:{:?}.into(),local:{:?}.into()}},"",[&attribute])))}};let prepared=with_inputs(inputs,|inputs|{target}::prepare(value,inputs))?;let mut names=Vec::new();{target}::namespaces(value,&prepared,&mut names);let mut out=core::xml::Writer::new(&names);with_inputs(inputs,|inputs|{target}::write_xml(value,&prepared,inputs,&mut out))?;let bytes=out.finish();let mut tree=core::xml::Tree::capture_with_qnames(&bytes,&[("",{root:?})],{target}::qname_text)?.ok_or_else(||RuntimeDiagnostic::new("xml.recursive-value","Generated recursive value is absent"))?;tree.rename_root(core::xml::Name{{namespace:{:?}.into(),local:{:?}.into()}});Ok(Prepared(tree))}}
pub(super) fn namespaces<'a>(_value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>){{prepared.0.collect_namespaces(names)}}
pub(super) fn write_xml<'a>(_value:&Stored,prepared:&'a Prepared,_inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{{prepared.0.write_at(out,PARENT,&qnames())}}
pub(super) fn write_yaml(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{{if let Some(value)=value.0.as_deref(){{with_inputs(inputs,|inputs|{target}::write_yaml(value,inputs,out,indent))}}else{{out.push_str("null");Ok(())}}}}
pub(super) fn key_can_be_lifted(value:&Stored)->bool{{let _=value;{key_available}}}
pub(super) fn write_mapping_value(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{{let _=(value,inputs,&mut *out,indent);{mapping_write}}}
pub(super) fn check(value:&Stored,source:&[u8],inputs:&InputView<'_>,xml:bool)->Vec<RuntimeDiagnostic>{{if xml{{Vec::new()}}else if let Some(value)=value.0.as_deref(){{with_inputs(inputs,|inputs|Ok({target}::check(value,source,inputs,false))).unwrap_or_else(|error|vec![error])}}else{{Vec::new()}}}}
pub(super) fn scalar(_value:&Stored,_path:&[core::xml::Name],_occurrences:&[usize])->bool{{false}}
thread_local!{{static QNAMES_ACTIVE:std::cell::Cell<bool>=const{{std::cell::Cell::new(false)}};}}
struct QNamesFrame;
impl QNamesFrame{{fn enter()->Option<Self>{{QNAMES_ACTIVE.with(|active|if active.replace(true){{None}}else{{Some(Self)}})}}}}
impl Drop for QNamesFrame{{fn drop(&mut self){{QNAMES_ACTIVE.with(|active|active.set(false));}}}}
pub(super) fn qnames()->Vec<(&'static str,&'static str)>{{let Some(_frame)=QNamesFrame::enter()else{{return Vec::new()}};{target}::qnames()}}
fn target_path(path:&[core::xml::Name])->Option<Vec<core::xml::Name>>{{if path.len()<ROUTE.len()||!core::xml::matches(&path[..ROUTE.len()],ROUTE){{return None}}let mut result=Vec::with_capacity(path.len()-ROUTE.len()+1);result.push(core::xml::Name{{namespace:String::new(),local:{root:?}.into()}});result.extend_from_slice(&path[ROUTE.len()..]);Some(result)}}
pub(super) fn qname_attribute(path:&[core::xml::Name],name:&core::xml::Name)->bool{{let Some(path)=target_path(path)else{{return false}};{target}::qname_attribute(&path,name)}}
pub(super) fn qname_text(path:&[core::xml::Name])->bool{{let Some(path)=target_path(path)else{{return false}};{target}::qname_text(&path)}}
pub(super) fn qname_text_at(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool{{let Some(path)=target_path(path)else{{return false}};let mut nested=vec![1];nested.extend_from_slice(occurrences.get(ROUTE.len()..).unwrap_or(&[]));value.0.as_deref().is_some_and(|value|{target}::qname_text_at(value,&path,&nested))}}
}}"#,
        physical.namespace, physical.local, physical.namespace, physical.local,
    );
    Ok(RecordBody {
        source,
        scalar_routes: String::new(),
        constructible,
    })
}

const RECORD_BODY: &str = r#"#[allow(dead_code)] mod item_@id@ {
use super::*;
@row@
@checks@
@constructor@
@default_constructor@
@sequence_items_writer@
@recursive_projection@
@compact_prepared@
@boundary_prepared@
pub(super) struct Stored(V@id@);
pub(super) fn has_raw(value:&Stored)->bool{@raw_present@}
pub(super) fn field_present(value:&Stored,field:usize)->bool{@field_presence@}
pub(super) fn field_has_annotation(value:&Stored,field:usize)->bool{@field_annotation@}
impl core::inputs::RecordInput for Stored {
fn field(&self,index:usize)->Option<core::inputs::InputRef<'_>>{@debug_field@}
}
pub(super) struct Prepared(@prepared@);
pub(super) struct XmlReader(@xml_state@);
impl XmlReader {
pub(super) fn new()->Self{Self(@xml_state@::new())}
pub(super) fn consume_scoped(&mut self,path:&[core::xml::Name],token:&core::xml::Token<'_>,scope:Option<core::xml::NamespaceScope<'_>>,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{let _=(source,inputs,scope);@xml_consume@}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{@xml_finish@.map(Stored)}
}
@yaml_reader@
pub(super) fn read_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{read_xml_@id@(source,inputs).map(Stored)}
// Recovery is followed by an XML proof and preservation of every skipped token.
pub(super) fn recover_xml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{
let mut reader=XmlReader::new();core::xml::visit_scoped(source,|path,token,scope|match reader.consume_scoped(path,&token,Some(scope),source,inputs){
Ok(())=>Ok(()),Err(error) if matches!(error.code.as_deref(),Some("xml.unknown-field"|"xml.unknown-attribute"|"xml.unexpected-text"))=>Ok(()),Err(error)=>Err(error)
})?;reader.finish(source,inputs)
}

pub(super) fn read_yaml(source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{read_yaml_@id@(source,inputs).map(Stored)}
pub(super) fn finalize(source:&[u8],value:&Stored,inputs:&InputView<'_>)->core::Result<Vec<u8>>{finalize_yaml_@id@(source,write_yaml_@id@(&value.0,inputs)?,&value.0,inputs)}
pub(super) fn text(value:&Stored,field:usize)->core::Result<&str>{text_field_@id@(&value.0,field)}
pub(super) fn prepare(value:&Stored,inputs:&InputView<'_>)->core::Result<Prepared>{@prepare_row@(&value.0,inputs).map(Prepared)}
pub(super) fn namespaces<'a>(value:&'a Stored,prepared:&'a Prepared,names:&mut Vec<&'a str>){@namespaces_row@(&value.0,&prepared.0,names)}
pub(super) fn write_xml<'a>(value:&Stored,prepared:&'a Prepared,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{@write_row@(&value.0,&prepared.0,inputs,out)}
pub(super) fn write_yaml(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{@yaml_write_row@}@text_documents@

pub(super) fn key_can_be_lifted(value:&Stored)->bool{let _=value;@key_available@}
pub(super) fn write_mapping_value(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{let _=(value,inputs,&mut *out,indent);@lifted_write@}
pub(super) fn check(value:&Stored,source:&[u8],inputs:&InputView<'_>,xml:bool)->Vec<RuntimeDiagnostic>{if xml{check_xml_@id@(&value.0,source,inputs)}else{check_yaml_@id@(&value.0,source,inputs)}}
pub(super) fn scalar(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool{@row_scalar@}
pub(super) fn qnames()->Vec<(&'static str,&'static str)>{xml_qnames_@id@()}
pub(super) fn qname_attribute(path:&[core::xml::Name],name:&core::xml::Name)->bool{xml_qname_attribute_@id@(path,name)}
pub(super) fn qname_text(path:&[core::xml::Name])->bool{xml_qname_text_@id@(path)}
pub(super) fn qname_text_at(value:&Stored,path:&[core::xml::Name],occurrences:&[usize])->bool{xml_qname_text_at_@id@(&value.0,path,occurrences)}
}
"#;

const SCALAR_YAML: &str = r#"pub(super) struct YamlReader{mapping:core::yaml::ScalarMapping,fields:YamlFields@id@}
impl YamlReader {
pub(super) fn new()->core::Result<Self>{Ok(Self{mapping:core::yaml::ScalarMapping::default(),fields:YamlFields@id@::new(core::raw::Fields::default())?})}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{if let Some(entry)=self.mapping.consume(node,position)?{self.fields.consume(entry.key,entry.value,entry.tag)?;}Ok(())}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{self.mapping.finish()?;finish_yaml_@id@(self.fields,source,inputs).map(Stored)}
}
"#;
const SHORTHAND_YAML: &str = r#"pub(super) struct YamlReader{mapping:core::yaml::ScalarOrMapping,fields:YamlFields@id@}
impl YamlReader {
pub(super) fn new()->core::Result<Self>{Ok(Self{mapping:core::yaml::ScalarOrMapping::default(),fields:YamlFields@id@::new(core::raw::Fields::default())?})}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{@nested_read@}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{self.mapping.finish()?;finish_yaml_@id@(self.fields,source,inputs).map(Stored)}
}
"#;
const SCALAR_WRITE: &str = r#"if value.0.raw.is_empty(){write_yaml_except_@id@(&value.0,inputs,out,indent,false,@excluded@)}else{let bytes=write_yaml_preserved_except_@id@(&value.0,inputs,false,@excluded@)?;core::yaml::Indented::new(out,indent).push_str(std::str::from_utf8(&bytes).expect("generated YAML"));Ok(())}"#;
const COMPOSED_YAML: &str = r#"
pub(super) struct YamlReader(OwnerYamlRead@id@);
impl YamlReader{
pub(super) fn new()->core::Result<Self>{OwnerYamlRead@id@::new().map(Self)}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{self.0.consume(node,position,source,inputs)}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{self.0.finish(source,inputs).map(Stored)}
}
"#;

const SINGLE_VALUE_YAML: &str = r#"pub(super) struct YamlReader{seen:bool,fields:YamlFields@id@}
impl YamlReader {
pub(super) fn new()->core::Result<Self>{Ok(Self{seen:false,fields:YamlFields@id@::new(core::raw::Fields::default())?})}
pub(super) fn consume(&mut self,node:core::yaml::Node,position:core::Position,_source:&[u8],_inputs:&InputView<'_>)->core::Result<()>{consume_yaml_@single_reader@_@id@(&mut self.fields,&mut self.seen,node,position)}
pub(super) fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<Stored>{if !self.seen{return Err(RuntimeDiagnostic::new("yaml.expected-scalar","Missing scalar record"))}finish_yaml_@id@(self.fields,source,inputs).map(Stored)}
}
"#;

const TEXT_PREPARED: &str = r#"
// Normal compact values write into the parent's buffer. Only anomalies need an envelope.
pub(super) fn write_yaml_inline(value:&Stored,inputs:&InputView<'_>,out:&mut String,indent:&str)->core::Result<()>{
let start=out.len();if value.0.raw.is_empty(){match write_yaml_except_@id@(&value.0,inputs,out,"",false,None){Ok(())=>return Ok(()),Err(error) if error.code.as_deref()==Some("value.text-pattern")=>out.truncate(start),Err(error)=>return Err(error)}}
let bytes=write_yaml_@id@(&value.0,inputs)?;let text=std::str::from_utf8(&bytes).expect("generated YAML");
if let Some((first,rest))=text.split_once('\n'){out.push_str(first);out.push('\n');core::yaml::Indented::new(out,&format!("{indent}  ")).push_str(rest);}else{out.push_str(text);}Ok(())}
"#;

// Compact and composed records share the same enclosing-boundary preservation.
const BOUNDARY_PREPARED: &str = r#"
struct BoundaryPrepared@id@{ordinary:@ordinary_type@,tree:Option<Box<core::xml::Tree>>}
fn prepare_boundary_xml_@id@(value:&V@id@,inputs:&InputView<'_>)->core::Result<BoundaryPrepared@id@>{
let ordinary=@ordinary_prepare@(value,inputs)?;
let tree=if @root_raw@{@capture_tree@}else{None};
Ok(BoundaryPrepared@id@{ordinary,tree:tree.map(Box::new)})}
fn namespaces_boundary_xml_@id@<'a>(value:&'a V@id@,prepared:&'a BoundaryPrepared@id@,names:&mut Vec<&'a str>){
if let Some(tree)=&prepared.tree{tree.collect_namespaces(names)}else{@ordinary_namespaces@(value,&prepared.ordinary,names)}}
fn write_boundary_xml_@id@<'a>(value:&V@id@,prepared:&'a BoundaryPrepared@id@,inputs:&InputView<'_>,out:&mut core::xml::Writer<'a>)->core::Result<()>{
if let Some(tree)=&prepared.tree{tree.write_at(out,@boundary_parent@,@boundary_qnames@)}else{@ordinary_write@(value,&prepared.ordinary,inputs,out)?;out.ensure_container_written(@boundary@);Ok(())}}
"#;
