use super::*;
use std::fmt::Write;

pub(super) fn cases(
    name: &str,
    variants: &[EnumVariant],
    rows: &[YamlState],
    reading: bool,
) -> Vec<(String, String)> {
    rows.iter()
        .filter_map(|row| {
            let text = if reading {
                row.value.clone()
            } else {
                let literal = match &row.form {
                    YamlStateForm::Absent => return None,
                    YamlStateForm::Empty => String::new(),
                    YamlStateForm::Text(text) => nkdk_conversion_core::yaml::scalar(text),
                };
                match &row.tag {
                    Some(tag) if literal.is_empty() => format!("!{tag}"),
                    Some(tag) => format!("!{tag} {literal}"),
                    None => literal,
                }
            };
            let index = variants
                .iter()
                .position(|variant| variant.value == row.value)
                .expect("linked state value");
            Some((text, format!("{name}::V{index}")))
        })
        .collect()
}

pub(super) fn read(rows: &[YamlState], index: usize, key: &str) -> String {
    if rows.iter().all(|row| row.form == YamlStateForm::Absent) {
        return format!(
            "{key:?}=>Err(RuntimeDiagnostic::new(\"yaml.state\",\"This state is represented by an omitted property\").field({key:?})),"
        );
    }
    let mut out = format!(
        "{key:?}=>{{self.positions[{index}]=value.position();self.raw.read_mark({index},value.annotation(),value.position())?;let text=value.into_nullable_text().map_err(|error|error.field({key:?}))?;let semantic_tag=match tag.as_deref(){{"
    );
    let tags: BTreeSet<_> = rows.iter().filter_map(|row| row.tag.as_ref()).collect();
    for tag in tags {
        write!(out, "Some({:?})=>tag.as_deref(),", format!("!{tag}")).unwrap();
    }
    write!(out, "other=>{{self.raw.read_mark({index},other,self.positions[{index}])?;None}}}};self.r{index}=Some(match (text.as_deref(),semantic_tag){{").unwrap();
    for row in rows {
        let form = match &row.form {
            YamlStateForm::Absent => continue,
            YamlStateForm::Empty => "None".into(),
            YamlStateForm::Text(text) => format!("Some({text:?})"),
        };
        let tag = row.tag.as_ref().map_or("None".into(), |tag| {
            format!("Some({:?})", format!("!{tag}"))
        });
        write!(out, "({form},{tag})=>{:?},", row.value).unwrap();
    }
    write!(out, "_=>return Err(RuntimeDiagnostic::new(\"yaml.state\",\"Value does not match a declared YAML state\").field({key:?})),}}.to_owned());Ok(())}},").unwrap();
    out
}
