//! Compose whole collection projections. Metadata names belong to declarations.
use super::*;

pub(super) struct Group {
    pub slot: usize,
    pub tag: Option<String>,
}
pub(super) fn prepare(
    entry: &LinkedEntry,
    parts: &[LinkedEntry],
    program: &Program,
) -> Result<Option<Vec<Group>>, Diagnostic> {
    let YamlRepresentation::GroupedSequence(groups) = &entry.yaml else {
        return Ok(None);
    };
    let mut result = Vec::new();
    for group in groups {
        let slot=parts.iter().position(|part|matches!(&part.value,LinkedType::Record(fields) if fields.len()==1 && fields[0].name==group.field)).ok_or_else(||unsupported(entry,"A YAML group requires one independently compiled field"))?;
        let LinkedType::Record(fields) = &parts[slot].value else {
            unreachable!()
        };
        let Some((id, _, _)) = fields[0].value.as_reference() else {
            return Err(unsupported(
                entry,
                "A YAML group requires a complete declaration",
            ));
        };
        let common = program
            .entries
            .iter()
            .find(|entry| entry.id == id)
            .expect("linked group");
        if !crate::yaml_shape::declared_sequence_projection(common, program, &mut BTreeSet::new()) {
            return Err(unsupported(
                entry,
                "A YAML group requires a declared record-item sequence projection",
            ));
        }
        let collection = crate::yaml_shape::projected_sequence(common, program)
            .ok_or_else(|| unsupported(entry, "A group requires a projected sequence"))?;
        let (LinkedType::Sequence(item), YamlRepresentation::Sequence { item_tag, .. }) =
            (&collection.value, &collection.yaml)
        else {
            unreachable!("projected sequence");
        };
        let row = item
            .as_reference()
            .and_then(|(id, _, _)| program.entries.iter().find(|entry| entry.id == id))
            .expect("declared record item");
        if item_tag.is_some()
            || crate::yaml_shape::semantic_root_tag(row, program, &mut BTreeSet::new())
        {
            return Err(unsupported(
                entry,
                "A group mark cannot replace an item's semantic root mark",
            ));
        }
        if crate::yaml_shape::sequence_root(row, program, &mut BTreeSet::new()) {
            return Err(unsupported(
                entry,
                "A sequence-shaped item conflicts with the empty group marker",
            ));
        }
        result.push(Group {
            slot,
            tag: group.item_tag.as_ref().map(|tag| format!("!{tag}")),
        });
    }
    Ok(Some(result))
}

pub(super) fn reader(
    id: u32,
    groups: &[Group],
    parts: usize,
    count: usize,
    finish: &str,
) -> String {
    let tags = groups
        .iter()
        .map(|group| match &group.tag {
            Some(tag) => format!("Some({tag:?})"),
            None => "None".into(),
        })
        .collect::<Vec<_>>()
        .join(",");
    let mut out = format!(
        "struct OwnerYamlRead{id}{{routing:core::yaml::GroupRouter<{}>,",
        groups.len()
    );
    for slot in 0..parts {
        write!(out, "p{slot}:part_{id}_{slot}::YamlReader,").unwrap();
    }
    write!(out,"}}impl OwnerYamlRead{id}{{fn new()->core::Result<Self>{{Ok(Self{{routing:core::yaml::GroupRouter::new([{tags}]),").unwrap();
    for slot in 0..parts {
        write!(out, "p{slot}:part_{id}_{slot}::YamlReader::new()?,").unwrap();
    }
    out.push_str("})}fn consume(&mut self,node:core::yaml::Node,position:core::Position,source:&[u8],inputs:&InputView<'_>)->core::Result<()>{let Self{routing,");
    for slot in 0..parts {
        write!(out, "p{slot},").unwrap();
    }
    out.push_str("}=self;routing.consume(node,position,|group,node,position|match group{");
    for (index, group) in groups.iter().enumerate() {
        writeln!(
            out,
            "{index}=>p{}.consume(node,position,source,inputs),",
            group.slot
        )
        .unwrap();
    }
    out.push_str("_=>unreachable!(\"compiled group\")})}");
    write!(out,"fn finish(self,source:&[u8],inputs:&InputView<'_>)->core::Result<V{id}>{{let order=self.routing.finish()?;let group_order=order.into_iter().map(|group|match group{{").unwrap();
    for (index, group) in groups.iter().enumerate() {
        write!(out, "{index}=>{},", group.slot).unwrap();
    }
    write!(out,"_=>unreachable!(\"compiled group\")}}).collect();{finish}Ok(V{id}{{root:None,containers:[1;{count}],group_order,").unwrap();
    for slot in 0..parts {
        write!(out, "p{slot},").unwrap();
    }
    out.push_str("})}}\n");
    out
}

pub(super) fn write_items(id: u32, groups: &[Group]) -> String {
    let mut out = String::from("for &slot in &value.group_order{match slot{");
    for group in groups {
        let slot = group.slot;
        let marked = group.tag.is_some();
        let tag = group.tag.as_deref().unwrap_or("");
        write!(out,"{slot}=>{{if part_{id}_{slot}::sequence_group_present(&value.p{slot}){{let start=out.len();part_{id}_{slot}::write_yaml_sequence_items::<true,{marked}>(&value.p{slot},inputs,&mut out,\"\",{tag:?})?;if out.len()==start{{if !out.is_empty()&&!out.ends_with('\\n'){{out.push('\\n');}}out.push_str({:?});}}}}}},",format!("-{} []",if marked{format!(" {tag}")}else{String::new()})).unwrap();
    }
    out.push_str(
        "_=>unreachable!(\"compiled group slot\")}}if out.is_empty(){out.push_str(\"[]\");}\n",
    );
    out
}
