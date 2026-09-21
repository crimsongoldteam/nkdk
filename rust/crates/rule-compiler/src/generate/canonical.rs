use super::*;

pub(super) fn mode(form: &LinkedCanonical, index: usize) -> usize {
    if form.xml_type.is_some() {
        return 4 + index;
    }
    match &form.form {
        XmlForm::Ordinary => 0,
        XmlForm::Missing => 1,
        XmlForm::EmptyElement => 2,
        XmlForm::Nil => 3,
    }
}

pub(super) fn type_attribute(name: &ExpandedName) -> String {
    format!(
        "core::xml::WriteAttribute{{name:(\"http://www.w3.org/2001/XMLSchema-instance\",\"type\"),value:core::xml::AttributeValue::QName(({:?},{:?}))}}",
        name.namespace, name.local
    )
}

pub(super) fn selection(
    forms: &[LinkedCanonical],
    mut predicate: impl FnMut(&LinkedExpression) -> Result<String, Diagnostic>,
) -> Result<String, Diagnostic> {
    let mut body = String::new();
    for (index, form) in forms.iter().enumerate() {
        let mode = mode(form, index);
        if let Some(when) = &form.when {
            writeln!(body, "if {} {{ return Ok({mode}); }}", predicate(when)?).unwrap();
        } else {
            writeln!(body, "return Ok({mode});").unwrap();
            return Ok(body);
        }
    }
    body.push_str("Ok(0)\n");
    Ok(body)
}
