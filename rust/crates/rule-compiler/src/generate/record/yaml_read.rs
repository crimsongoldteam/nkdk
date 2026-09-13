use super::*;

fn members(fields: &[Field<'_>]) -> Vec<String> {
    let mut names = vec!["raw".into(), "positions".into()];
    for (i, field) in fields.iter().enumerate() {
        names.push(format!("r{i}"));
        if matches!(field.codec, Codec::Choice(_)) {
            names.push(format!("number{i}"));
        }
    }
    names
}
pub(super) fn bindings(id: u32, fields: &[Field<'_>]) -> String {
    format!(
        "let YamlFields{id}{{{}}}=state;let _=&positions;\n",
        members(fields).join(",")
    )
}
pub(super) fn generate(id: u32, fields: &[Field<'_>]) -> String {
    let mut out = String::new();
    writeln!(
        out,
        "struct YamlFields{id}{{raw:core::raw::Fields,positions:[core::Position;{}],",
        fields.len()
    )
    .unwrap();
    for (i, field) in fields.iter().enumerate() {
        writeln!(out, "r{i}:Option<String>,").unwrap();
        if matches!(field.codec, Codec::Choice(_)) {
            writeln!(out, "number{i}:bool,").unwrap();
        }
    }
    writeln!(
        out,
        "}}\nimpl YamlFields{id}{{fn new(raw:core::raw::Fields)->core::Result<Self>{{"
    )
    .unwrap();
    for (i, field) in fields
        .iter()
        .enumerate()
        .filter(|(_, field)| field.attribute.is_some())
    {
        writeln!(out,"if raw.get({i}).is_some_and(|patch|patch.attribute_text().is_err()) {{return Err(RuntimeDiagnostic::new(\"xml.attribute-patch\",\"An attribute patch requires text or absence\").field({:?}));}}",field.key).unwrap();
    }
    writeln!(
        out,
        "Ok(Self{{raw,positions:[core::Position::default();{}],",
        fields.len()
    )
    .unwrap();
    for (i, field) in fields.iter().enumerate() {
        writeln!(out, "r{i}:None,").unwrap();
        if matches!(field.codec, Codec::Choice(_)) {
            writeln!(out, "number{i}:false,").unwrap();
        }
    }
    writeln!(out,"}})}}\nfn consume(&mut self,key:String,value:core::yaml::Scalar,tag:Option<String>)->core::Result<()>{{let _=(&value,&tag);").unwrap();
    let has_keys = fields.iter().any(|field| field.yaml_visible);
    if has_keys {
        out.push_str("match key.as_str(){\n");
    }
    for (i, field) in fields
        .iter()
        .enumerate()
        .filter(|(_, field)| field.yaml_visible)
    {
        let read = if matches!(field.codec, Codec::Choice(_)) {
            format!(
                "let (text,number)=value.into_choice_text().map_err(|error|error.field({:?}))?;self.number{i}=number;self.r{i}=Some(text);",
                field.key
            )
        } else {
            format!(
                "self.r{i}=Some(value.{}().map_err(|error|error.field({:?}))?);",
                field.codec.yaml_input(),
                field.key
            )
        };
        writeln!(out,"{:?}=>{{self.positions[{i}]=value.position();self.raw.read_mark({i},tag.as_deref(),self.positions[{i}])?;{read}Ok(())}},",field.key).unwrap();
    }
    if has_keys {
        out.push_str("_=>");
    }
    out.push_str("Err(RuntimeDiagnostic::new(\"yaml.unknown-field\",format!(\"Unknown YAML key: {key}\")).field(key))");
    if has_keys {
        out.push('}');
    }
    out.push_str("}}\n");
    out
}
