use super::*;
use std::fmt::Write;

pub(super) enum Codec<'a> {
    Choice(&'a ScalarChoiceXml<ExpandedName>),
    Calendar { seconds: bool, omit_zero: bool },
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
                optional(target)?;
                let (xml, _) = super::attributes::content(&target.xml);
                match (&target.value, xml, &target.yaml) {
                    (
                        LinkedType::ScalarChoice(_),
                        LinkedXml::ScalarChoice(choice),
                        YamlRepresentation::ScalarChoice,
                    ) => Ok(Self::Choice(choice)),
                    (
                        LinkedType::Scalar(ScalarType::Text),
                        LinkedXml::Calendar,
                        YamlRepresentation::Calendar { seconds, omit_zero },
                    ) => Ok(Self::Calendar {
                        seconds: *seconds,
                        omit_zero: *omit_zero,
                    }),
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
            Self::Choice(_) => "core::scalar::Value".into(),
            Self::Text => "String".into(),
            Self::Calendar { .. } => "core::calendar::Value".into(),
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
            Self::Text | Self::Decimal | Self::Calendar { .. } | Self::Choice(_) => vec![],
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
    pub fn meaning(&self, name: &str, index: usize) -> String {
        match self {
            Self::Text => format!("_value.f{index}.as_str()"),
            Self::Choice(_) => format!("&_value.f{index}"),
            Self::Calendar { .. } => format!("&_value.f{index}.xml()"),
            Self::Decimal => format!("&_value.f{index}"),
            Self::Boolean(..) => format!("_value.f{index}"),
            Self::Enumeration(variants, ..) => format!(
                "match _value.f{index} {{ {} }}",
                variants
                    .iter()
                    .enumerate()
                    .map(|(i, variant)| format!("{name}::V{i} => {:?},", variant.value))
                    .collect::<Vec<_>>()
                    .join("")
            ),
        }
    }
    pub fn optional_meaning(&self, name: &str, index: usize) -> String {
        let reference = format!("_value.f{index}.as_ref().expect(\"guarded scalar\")");
        match self {
            Self::Text => format!("{reference}.as_str()"),
            Self::Choice(_) => reference,
            Self::Calendar { .. } => format!("&{reference}.xml()"),
            Self::Decimal => reference,
            Self::Boolean(..) => format!("*{reference}"),
            Self::Enumeration(variants, ..) => format!(
                "match {reference} {{ {} }}",
                variants
                    .iter()
                    .enumerate()
                    .map(|(i, v)| format!("{name}::V{i}=>{:?},", v.value))
                    .collect::<String>()
            ),
        }
    }
    pub fn plain_yaml(&self) -> bool {
        matches!(
            self,
            Self::Decimal | Self::Calendar { .. } | Self::Choice(_)
        )
    }
    pub fn read(&self, name: &str, index: usize, key: &str, xml_side: bool) -> String {
        if matches!(self, Self::Choice(_)) {
            let empty = if xml_side {
                format!(
                    "if r{index}.is_empty() {{return Err(RuntimeDiagnostic::new(\"value.empty\",\"Empty XML denotes absence\"));}}"
                )
            } else {
                String::new()
            };
            return format!(
                "{empty}let f{index}=core::scalar::Value::read(r{index},number{index}).map_err(|error|positions[{index}].apply(source,error.field({key:?})))?;\n"
            );
        }

        if let Self::Calendar { seconds, omit_zero } = self {
            let call = if xml_side {
                format!("core::calendar::Value::from_xml(&r{index})")
            } else {
                format!("core::calendar::Value::from_yaml(&r{index},{seconds},{omit_zero})")
            };
            return format!(
                "let f{index}={call}.map_err(|error|positions[{index}].apply(source,error.field({key:?})))?;\n"
            );
        }

        if matches!(self, Self::Decimal) {
            return format!(
                "let f{index} = core::decimal::Decimal::parse_owned(r{index}).map_err(|error| positions[{index}].apply(source, RuntimeDiagnostic::new(\"value.decimal\", error.to_string()).field({key:?})))?;\n"
            );
        }
        if matches!(self, Self::Text) {
            return format!(
                "core::xml::validate_text(&r{index}).map_err(|error| positions[{index}].apply(source, error.field({key:?})))?; let f{index} = r{index};\n"
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
        writeln!(out, "_ => return Err(positions[{index}].apply(source, RuntimeDiagnostic::new({code:?}, \"Unknown canonical literal\").field({key:?}))), }};").unwrap();
        out
    }
    pub fn write(&self, name: &str, index: usize, xml_side: bool) -> String {
        if matches!(self, Self::Decimal) {
            return format!("&value.f{index}.to_string()");
        }
        self.write_reference(name, &format!("&value.f{index}"), xml_side)
    }
    pub fn yaml_representable(&self, name: &str, reference: &str) -> String {
        if !matches!(self, Self::Boolean(..) | Self::Enumeration(..)) {
            return "true".into();
        }
        let patterns = self
            .cases(name, false)
            .into_iter()
            .map(|(_, value)| value)
            .collect::<Vec<_>>();
        if patterns.is_empty() {
            return "false".into();
        }
        format!("matches!({reference}, {})", patterns.join(" | "))
    }
    pub fn write_reference(&self, name: &str, reference: &str, xml_side: bool) -> String {
        if matches!(self, Self::Choice(_)) {
            return format!("&({reference}).{}()", if xml_side { "xml" } else { "yaml" });
        }

        if let Self::Calendar { seconds, omit_zero } = self {
            return if xml_side {
                format!("&({reference}).xml()")
            } else {
                format!("&({reference}).yaml({seconds},{omit_zero})")
            };
        }

        if matches!(self, Self::Decimal) {
            return format!("&({reference}).to_string()");
        }
        if matches!(self, Self::Text) {
            return reference.into();
        }
        let cases = self.cases(name, xml_side);
        let count = match self {
            Self::Boolean(..) => 2,
            Self::Enumeration(variants, ..) => variants.len(),
            _ => unreachable!(),
        };
        let fallback = if cases.len() < count {
            "_ => return Err(RuntimeDiagnostic::new(\"value.unrepresented\",\"Scalar has no canonical literal in this representation\")),"
        } else {
            ""
        };
        format!(
            "match {reference} {{ {} {fallback} }}",
            cases
                .iter()
                .map(|(text, value)| format!("{value} => {text:?},"))
                .collect::<Vec<_>>()
                .join("")
        )
    }
}

/// Absence is a declared state, not a default for an unknown scalar token.
/// Other presence forms must be generated explicitly before accepting them.
pub(crate) fn optional(entry: &LinkedEntry) -> Result<bool, Diagnostic> {
    if entry.presence.is_empty() {
        plain(entry)?;
        return Ok(false);
    }
    let missing = |value: &Option<LinkedExpression>| {
        value.as_ref().is_some_and(|v| {
            matches!(
                v.kind,
                LinkedExpressionKind::Absent | LinkedExpressionKind::Literal(_)
            )
        })
    };
    if entry.presence.len() != 1
        || !entry.presence.iter().all(|p| {
            p.target == LinkedPresenceTarget::SelfValue
                && missing(&p.xml_missing)
                && missing(&p.yaml_missing)
                && p.xml_empty.is_empty()
                && p.yaml_empty.is_empty()
                && p.canonical.is_empty()
        })
    {
        return Err(unsupported(
            entry,
            "Scalar presence requires constant missing states and ordinary XML",
        ));
    }
    let mut shape = entry.clone();
    shape.presence.clear();
    plain(&shape)?;
    Ok(true)
}

pub(crate) fn field_optional(value: &LinkedType, program: &Program) -> Result<bool, Diagnostic> {
    if let LinkedType::Reference(id) = value {
        optional(
            program
                .entries
                .iter()
                .find(|entry| entry.id == *id)
                .expect("linked reference"),
        )
    } else {
        Ok(false)
    }
}
