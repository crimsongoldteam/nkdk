use super::*;

pub(super) fn generate(program: &Program<'_>) -> String {
    let profiles = program
        .entries
        .iter()
        .filter_map(|entry| entry.data_path.as_ref().map(|path| (path, &entry.yaml)))
        .collect::<Vec<_>>();
    let mut members = Vec::new();
    for (path, representation) in &profiles {
        let YamlRepresentation::Mapping(mapping) = representation else {
            unreachable!("linked data path")
        };
        for member in &path.members {
            let yaml = &mapping
                .iter()
                .find(|mapped| mapped.field == member.field)
                .expect("linked data path field")
                .key;
            members.push((*path, member, yaml.as_str()));
        }
    }
    let mut code = String::from(
        "#[derive(Debug,Clone,Copy,PartialEq,Eq)] pub struct DataPathMemberInfo {pub declaring_type:&'static str,pub internal:&'static str,pub yaml:&'static str,pub terminal_types:&'static [&'static str]}\n",
    );
    if profiles.is_empty() {
        code.push_str("pub fn data_path_type(_name:&str)->Option<&'static str>{None}\n");
        code.push_str(
            "pub fn data_path_name_pairs()->&'static [(&'static str,&'static str)]{&[]}\n",
        );
        code.push_str("pub fn data_path_member(_type_name:&str,_segment:&str)->Option<DataPathMemberInfo>{None}\n");
        code.push_str("pub fn data_path_member_available(_type_name:&str,_segment:&str,_purpose:&str)->bool{false}\n");
        return code;
    }
    code.push_str("pub fn data_path_type(name:&str)->Option<&'static str>{match name {");
    for (path, _) in &profiles {
        for name in std::iter::once(&path.type_name).chain(&path.aliases) {
            write!(code, "{name:?}=>Some({:?}),", path.type_name).unwrap();
        }
    }
    code.push_str("_=>None}}\n");

    let mut pairs = BTreeSet::new();
    for (_, member, yaml) in &members {
        pairs.insert((member.internal.as_str(), *yaml));
    }
    code.push_str("pub fn data_path_name_pairs()->&'static [(&'static str,&'static str)]{&[");
    for (internal, yaml) in pairs {
        write!(code, "({internal:?},{yaml:?}),").unwrap();
    }
    code.push_str("]}\n");

    code.push_str("pub fn data_path_member(type_name:&str,segment:&str)->Option<DataPathMemberInfo>{let canonical=data_path_type(type_name)?;");
    if members.is_empty() {
        code.push_str("let _=(canonical,segment);return None;}");
    } else {
        code.push_str("match(canonical,segment){");
        for (path, member, yaml) in &members {
            let terminals = member
                .terminal_types
                .iter()
                .map(|terminal| format!("{terminal:?}"))
                .collect::<Vec<_>>()
                .join(",");
            writeln!(code, "({:?},{:?})|({:?},{:?})=>Some(DataPathMemberInfo{{declaring_type:{:?},internal:{:?},yaml:{:?},terminal_types:&[{terminals}]}}),", path.type_name, member.internal, path.type_name, yaml, path.type_name, member.internal, yaml).unwrap();
        }
        code.push_str("_=>None}}");
    }
    code.push('\n');

    code.push_str("pub fn data_path_member_available(type_name:&str,segment:&str,purpose:&str)->bool{let Some(member)=data_path_member(type_name,segment) else{return false};");
    if profiles.iter().all(|(path, _)| path.views.is_empty()) {
        code.push_str("let _=(member,purpose);return true;}");
    } else {
        code.push_str("match(member.declaring_type,purpose,member.internal){");
        for (path, _) in &profiles {
            for view in &path.views {
                for member in &path.members {
                    let allowed = view.fields.contains(&member.field);
                    writeln!(
                        code,
                        "({:?},{:?},{:?})=>{allowed},",
                        path.type_name, view.purpose, member.internal
                    )
                    .unwrap();
                }
            }
        }
        code.push_str("_=>true}}");
    }
    code.push('\n');
    code
}
