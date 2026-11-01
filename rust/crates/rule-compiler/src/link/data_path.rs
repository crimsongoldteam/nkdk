use super::*;

pub(super) fn validate(program: &Program) -> Result<(), Diagnostic> {
    let mut types = BTreeMap::new();
    for entry in &program.entries {
        let Some(path) = &entry.data_path else {
            continue;
        };
        let (LinkedType::Record(fields), YamlRepresentation::Mapping(mapping)) =
            (&entry.value, &entry.yaml)
        else {
            return Err(diagnostic(
                "data_path_shape",
                &path.source,
                "Data path declaration requires a mapped record",
            ));
        };
        for name in std::iter::once(&path.type_name).chain(&path.aliases) {
            if name.is_empty() {
                return Err(diagnostic(
                    "data_path_name",
                    &path.source,
                    "Data path type name is empty",
                ));
            }
            if let Some(first) = types.insert(name.clone(), &path.source) {
                let mut error = diagnostic(
                    "data_path_type_collision",
                    &path.source,
                    "Data path type or alias is repeated",
                );
                error.related.push(first.clone());
                return Err(error);
            }
        }
        let mut internal = BTreeSet::new();
        let mut yaml = BTreeSet::new();
        let mut declared = BTreeSet::new();
        for member in &path.members {
            if member.internal.is_empty() || member.terminal_types.is_empty() {
                return Err(diagnostic(
                    "data_path_member",
                    &member.source,
                    "Data path member needs an internal name and terminal types",
                ));
            }
            if !internal.insert(member.internal.as_str()) || !declared.insert(member.field.as_str())
            {
                return Err(diagnostic(
                    "data_path_member_collision",
                    &member.source,
                    "Data path member is repeated",
                ));
            }
            if !fields.iter().any(|field| field.name == member.field) {
                return Err(diagnostic(
                    "data_path_unknown_field",
                    &member.source,
                    "Data path member does not name a value field",
                ));
            }
            let Some(mapped) = mapping.iter().find(|mapped| mapped.field == member.field) else {
                return Err(diagnostic(
                    "data_path_unknown_field",
                    &member.source,
                    "Data path member has no YAML field",
                ));
            };
            if !yaml.insert(mapped.key.as_str()) {
                return Err(diagnostic(
                    "data_path_member_collision",
                    &member.source,
                    "Data path YAML name is repeated",
                ));
            }
        }
        let mut purposes = BTreeSet::new();
        for view in &path.views {
            if view.purpose.is_empty() || !purposes.insert(view.purpose.as_str()) {
                return Err(diagnostic(
                    "data_path_view_collision",
                    &view.source,
                    "Data path view purpose is empty or repeated",
                ));
            }
            let mut selected = BTreeSet::new();
            for field in &view.fields {
                if !declared.contains(field.as_str()) || !selected.insert(field) {
                    return Err(diagnostic(
                        "data_path_view_member",
                        &view.source,
                        "Data path view names an unknown or repeated member",
                    ));
                }
            }
        }
    }
    Ok(())
}
