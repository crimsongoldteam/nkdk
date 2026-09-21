use super::*;

fn read_value(field: &Field<'_>, index: usize, receiver: &str) -> String {
    let read = if matches!(field.codec, Codec::Choice(_)) {
        format!(
            "let (text,number)=value.into_choice_text().map_err(|error|error.field({:?}))?;{receiver}.number{index}=number;{receiver}.r{index}=Some(text);",
            field.key
        )
    } else if let Codec::Forms(choice) = &field.codec
        && choice.discriminated()
    {
        let number = choice
            .decimal_variant()
            .map(|variant| format!("Some({variant})"))
            .unwrap_or_else(|| "return Err(RuntimeDiagnostic::new(\"yaml.expected-text\",\"Numeric YAML has no declared choice variant\"))".into());
        let quoted = choice
            .text_variant()
            .map(|variant| format!("Some({variant})"))
            .unwrap_or_else(|| "return Err(RuntimeDiagnostic::new(\"yaml.expected-text\",\"Quoted YAML has no declared text variant\"))".into());
        format!(
            "let (text,form)=value.into_discriminated_choice_text().map_err(|error|error.field({:?}))?;{receiver}.variant{index}=match form{{core::yaml::ChoiceScalarForm::Number=>{number},core::yaml::ChoiceScalarForm::QuotedText=>{quoted},core::yaml::ChoiceScalarForm::PlainText=>None}};{receiver}.r{index}=Some(text);",
            field.key,
        )
    } else {
        format!(
            "{receiver}.r{index}=Some(value.{}().map_err(|error|error.field({:?}))?);",
            field.codec.yaml_input(),
            field.key
        )
    };
    if super::super::scalar_presence::yaml_empty(field.presence, EmptyKind::Null) {
        format!("if value.is_null(){{{receiver}.r{index}=None;}}else{{{read}}}")
    } else {
        read
    }
}

fn members(fields: &[Field<'_>]) -> Vec<String> {
    let mut names = vec!["raw".into(), "positions".into()];
    for (i, field) in fields.iter().enumerate() {
        names.push(format!("r{i}"));
        if matches!(field.codec, Codec::Choice(_)) {
            names.push(format!("number{i}"));
        }
        if matches!(&field.codec, Codec::Forms(choice) if choice.discriminated()) {
            names.push(format!("variant{i}"));
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
        if matches!(&field.codec, Codec::Forms(choice) if choice.discriminated()) {
            writeln!(out, "variant{i}:Option<usize>,").unwrap();
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
        if matches!(&field.codec, Codec::Forms(choice) if choice.discriminated()) {
            writeln!(out, "variant{i}:None,").unwrap();
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
        if let Codec::States(_, _, rows) = &field.codec {
            out.push_str(&super::super::states::read(rows, i, field.key));
            continue;
        }
        let read = read_value(field, i, "self");
        writeln!(out,"{:?}=>{{self.positions[{i}]=value.position();self.raw.read_mark({i},value.annotation(),value.position())?;self.raw.read_mark({i},tag.as_deref(),self.positions[{i}])?;{read}Ok(())}},",field.key).unwrap();
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

pub(super) fn projection_reader(id: u32, index: usize, field: &Field<'_>) -> String {
    let read = read_value(field, index, "state");
    format!(
        "fn consume_yaml_projection_{id}(state:&mut YamlFields{id},seen:&mut bool,node:core::yaml::Node,position:core::Position)->core::Result<()>{{let core::yaml::Node::Scalar(value,tag)=node else{{return Err(RuntimeDiagnostic::new(\"yaml.expected-scalar\",\"Expected a scalar projection\"))}};if *seen{{return Err(RuntimeDiagnostic::new(\"yaml.document\",\"Expected one projected value\"))}}*seen=true;state.positions[{index}]=position;state.raw.read_mark({index},value.annotation(),position)?;state.raw.read_mark({index},tag.as_deref(),position)?;{read}Ok(())}}\n"
    )
}

pub(super) fn projection_read(id: u32) -> String {
    format!(
        "let mut seen=false;events.visit(|node,position|consume_yaml_projection_{id}(&mut state,&mut seen,node,position))?;if !seen{{return Err(RuntimeDiagnostic::new(\"yaml.expected-scalar\",\"Missing projected value\"))}}finish_yaml_{id}(state,source,_inputs)"
    )
}
