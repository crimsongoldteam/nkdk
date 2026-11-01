//! Compile record/collection routes to a small recursive field-selection graph.
use super::*;

struct Graph<'a> {
    program: &'a Program<'a>,
    entries: BTreeMap<u32, usize>,
    shapes: Vec<String>,
}

impl Graph<'_> {
    fn value(&mut self, value: &LinkedType) -> usize {
        value.as_reference().map_or(0, |(id, _, _)| {
            let entry = self.program.entries.iter().find(|entry| entry.id == id);
            entry.map_or(0, |entry| self.entry(entry))
        })
    }

    fn entry(&mut self, entry: &LinkedEntry) -> usize {
        if let Some(index) = self.entries.get(&entry.id) {
            return *index;
        }
        let index = self.shapes.len();
        self.entries.insert(entry.id, index);
        self.shapes.push("core::yaml::ProjectionShape::Pass".into());
        let shape = match (&entry.value, &entry.yaml) {
            (LinkedType::Record(fields), YamlRepresentation::Mapping(mapping)) => {
                let fields = mapping
                    .iter()
                    .map(|mapping| {
                        let field = fields
                            .iter()
                            .find(|field| field.name == mapping.field)
                            .expect("linked YAML field");
                        let child = self.value(&field.value);
                        format!("({:?},{child})", mapping.key)
                    })
                    .collect::<Vec<_>>()
                    .join(",");
                format!("core::yaml::ProjectionShape::Record(&[{fields}])")
            }
            (LinkedType::Sequence(item), YamlRepresentation::Sequence { item: yaml, .. })
                if **yaml == YamlRepresentation::Declared =>
            {
                let child = self.value(item);
                format!("core::yaml::ProjectionShape::Sequence({child})")
            }
            (
                LinkedType::Sequence(item),
                YamlRepresentation::RecordMapping {
                    value,
                    group_key: None,
                    ..
                },
            ) => {
                let child = if let Some(name) = value {
                    item.as_reference()
                        .and_then(|(id, _, _)| {
                            self.program.entries.iter().find(|entry| entry.id == id)
                        })
                        .and_then(|row| match &row.value {
                            LinkedType::Record(fields) => {
                                fields.iter().find(|field| field.name == *name)
                            }
                            _ => None,
                        })
                        .map_or(0, |field| self.value(&field.value))
                } else {
                    self.value(item)
                };
                format!("core::yaml::ProjectionShape::Mapping({child})")
            }
            // Other representations keep their strict existing readers. Never
            // infer record ownership for a choice, shorthand or annotation.
            _ => "core::yaml::ProjectionShape::Pass".into(),
        };
        self.shapes[index] = shape;
        index
    }
}

pub(super) fn events(entry: &LinkedEntry, program: &Program) -> String {
    let mut graph = Graph {
        program,
        entries: BTreeMap::new(),
        shapes: vec!["core::yaml::ProjectionShape::Pass".into()],
    };
    let root = graph.entry(entry);
    format!(
        "core::yaml::ShapedProjectionSource{{source:core::yaml::DocumentSource(if source.is_empty(){{b\"{{}}\"}}else{{source}}),shapes:&[{}],root:{root}}}",
        graph.shapes.join(",")
    )
}
