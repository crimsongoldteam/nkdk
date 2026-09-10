use super::*;
use std::fmt::Write;

pub(super) enum Codec<'a> {
    Text,
    Decimal,
    Boolean(&'a [BooleanLexeme], &'a [BooleanLexeme]),
    Enumeration(&'a [EnumVariant], &'a [EnumLexeme], &'a [EnumLexeme]),
}
impl<'a> Codec<'a> {
    pub fn resolve(
        value: &'a LinkedType,
        owner: &LinkedEntry,
        program: &'a Program,
    ) -> Result<Self, Diagnostic> {
        match value {
            LinkedType::Scalar(ScalarType::Text) => Ok(Self::Text),
            LinkedType::Scalar(ScalarType::Decimal) => Ok(Self::Decimal),
            LinkedType::Reference(id) => {
                let target = program
                    .entries
                    .iter()
                    .find(|entry| entry.id == *id)
                    .expect("linked reference");
                plain(target)?;
                match (&target.value, &target.xml, &target.yaml) {
                    (
                        LinkedType::Scalar(ScalarType::Decimal),
                        LinkedXml::Decimal,
                        YamlRepresentation::Decimal,
                    ) => Ok(Self::Decimal),
                    (
                        LinkedType::Scalar(ScalarType::Text),
                        LinkedXml::Text,
                        YamlRepresentation::Text,
                    ) => Ok(Self::Text),
                    (
                        LinkedType::Scalar(ScalarType::Boolean),
                        LinkedXml::BooleanTable(xml),
                        YamlRepresentation::BooleanTable(yaml),
                    ) => Ok(Self::Boolean(xml, yaml)),
                    (
                        LinkedType::Enum(variants),
                        LinkedXml::EnumTable(xml),
                        YamlRepresentation::EnumTable(yaml),
                    ) => Ok(Self::Enumeration(variants, xml, yaml)),
                    _ => Err(unsupported(
                        target,
                        "Referenced value is not a supported scalar codec",
                    )),
                }
            }
            _ => Err(unsupported(
                owner,
                "Only text and referenced scalar codecs are generated at this stage",
            )),
        }
    }
    pub fn rust_type(&self, name: &str) -> String {
        match self {
            Self::Decimal => "core::decimal::Decimal".into(),
            Self::Text => "String".into(),
            Self::Boolean(..) => "bool".into(),
            Self::Enumeration(..) => name.into(),
        }
    }
    pub fn definition(&self, name: &str) -> String {
        match self {
            Self::Enumeration(variants, ..) => format!(
                "#[derive(Clone, Copy)] enum {name} {{ {} }}\n",
                (0..variants.len())
                    .map(|i| format!("V{i}"))
                    .collect::<Vec<_>>()
                    .join(",")
            ),
            _ => String::new(),
        }
    }
    fn cases(&self, name: &str, xml_side: bool) -> Vec<(String, String)> {
        match self {
            Self::Text | Self::Decimal => vec![],
            Self::Boolean(xml, yaml) => (if xml_side { xml } else { yaml })
                .iter()
                .map(|item| (item.text.clone(), item.value.to_string()))
                .collect(),
            Self::Enumeration(variants, xml, yaml) => (if xml_side { xml } else { yaml })
                .iter()
                .map(|item| {
                    let i = variants
                        .iter()
                        .position(|variant| variant.value == item.value)
                        .expect("linked enum table");
                    (item.text.clone(), format!("{name}::V{i}"))
                })
                .collect(),
        }
    }
    pub fn yaml_input(&self) -> &'static str {
        if matches!(self, Self::Decimal) {
            "into_decimal_text"
        } else {
            "into_text"
        }
    }
    pub fn numeric(&self) -> bool {
        matches!(self, Self::Decimal)
    }
    pub fn read(&self, name: &str, index: usize, key: &str, xml_side: bool) -> String {
        if matches!(self, Self::Decimal) {
            return format!(
                "let f{index} = core::decimal::Decimal::parse(&r{index}).map_err(|error| error.field({key:?}))?;\n"
            );
        }
        if matches!(self, Self::Text) {
            return format!(
                "core::xml::validate_text(&r{index}).map_err(|error| error.field({key:?}))?; let f{index} = r{index};\n"
            );
        }
        let mut out = format!("let f{index} = match r{index}.as_str() {{\n");
        for (text, value) in self.cases(name, xml_side) {
            writeln!(out, "{text:?} => {value},").unwrap();
        }
        let code = if matches!(self, Self::Boolean(..)) {
            "value.boolean"
        } else {
            "value.enum"
        };
        writeln!(out, "_ => return Err(RuntimeDiagnostic::new({code:?}, \"Unknown canonical literal\").field({key:?})), }};").unwrap();
        out
    }
    pub fn write(&self, name: &str, index: usize, xml_side: bool) -> String {
        if matches!(self, Self::Decimal) {
            return format!("&value.f{index}.to_string()");
        }
        if matches!(self, Self::Text) {
            return format!("&value.f{index}");
        }
        format!(
            "match value.f{index} {{ {} }}",
            self.cases(name, xml_side)
                .iter()
                .map(|(text, value)| format!("{value} => {text:?},"))
                .collect::<Vec<_>>()
                .join("")
        )
    }
}
