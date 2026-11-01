//! Paired text patterns may omit a contextual YAML prefix while keeping the
//! full XML value. The existing prepared optional automaton handles both forms.
use super::*;

pub(super) fn applies(codec: &Codec<'_>) -> bool {
    codec
        .yaml
        .iter()
        .any(|part| matches!(part.value, TextPatternValue::Optional { .. }))
}

fn controllers(parts: &[TextPatternPart], names: &[&str], found: &mut Vec<usize>) {
    for part in parts {
        if let TextPatternValue::Optional { field, parts } = &part.value {
            found.push(
                names
                    .iter()
                    .position(|name| *name == field)
                    .expect("linked slot"),
            );
            controllers(parts, names, found);
        }
    }
}

pub(super) fn definition(codec: &Codec<'_>, name: &str) -> Result<String, Diagnostic> {
    let LinkedType::Record(fields) = &codec.entry().value else {
        unreachable!("text pattern record")
    };
    let count = codec.fields.len();
    let mut groups = Vec::new();
    controllers(codec.yaml, &codec.names, &mut groups);
    let mut seen = std::collections::BTreeSet::new();
    let mut active = vec!["false".to_owned(); count];
    let storage = (0..count)
        .map(|index| (codec.field_meaning(name, index, "self"), "true".to_owned()))
        .collect::<Vec<_>>();
    let mut expressions =
        expressions::Expressions::new(codec.entry(), codec.program, fields, Some(&storage));
    for index in groups {
        if !seen.insert(index) {
            return Err(unsupported(
                codec.entry(),
                "Optional group controllers must be unique",
            ));
        }
        let rule = codec
            .entry()
            .presence
            .iter()
            .find(|rule| rule.target == LinkedPresenceTarget::Field(index as u32))
            .and_then(|rule| rule.yaml_omit_when.as_ref())
            .ok_or_else(|| {
                unsupported(
                    codec.entry(),
                    "Optional group requires its controlling field's YAML omitWhen",
                )
            })?;
        active[index] = format!("!({})", expressions.lower(rule)?);
    }
    let (defaults, slots) = restored_slots(codec)?;
    let input = if codec.needs_inputs() {
        ",_inputs:&InputView<'_>"
    } else {
        ""
    };
    let input_arg = if codec.needs_inputs() { ",_inputs" } else { "" };
    let mut out = codec.definition_mode(name, DefinitionMode::Projected)?;
    let optional_parts =
        crate::generate::optional_parts::compile(codec.yaml, fields, codec.entry())?;
    writeln!(out, "thread_local!{{static YAML_OPTIONAL_{name}:std::cell::RefCell<core::text_pattern::OptionalPattern<'static,{count}>>=std::cell::RefCell::new(core::text_pattern::OptionalPattern::new(&[{optional_parts}]).expect(\"linked optional text pattern\"));}}").unwrap();
    writeln!(out, "impl {name} {{").unwrap();
    writeln!(out, "fn xml_pattern()-> &'static core::text_pattern::Pattern<'static,{count}> {{static PLAN:std::sync::LazyLock<core::text_pattern::Pattern<'static,{count}>>=std::sync::LazyLock::new(||core::text_pattern::Pattern::new(&[{}]).expect(\"checked XML text pattern\"));&PLAN}}",codec.parts(codec.xml)).unwrap();
    writeln!(out, "fn read(text:&str,xml:bool,_inputs:&InputView<'_>)->core::Result<Self>{{core::xml::validate_text(text)?;let value=if xml{{let parsed=Self::xml_pattern().parse(text).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Text does not match the declared pattern\"))?;Self::read_slots(parsed,true{input_arg})?}}else{{let parsed=YAML_OPTIONAL_{name}.with(|plan|plan.borrow_mut().parse(text).map(|slots|slots.map(|slot|slot.map(str::to_owned)))).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Text does not match the declared pattern\"))?;{defaults}Self::read_slots([{}],false{input_arg})?}};value.check(true,_inputs)?;value.check(false,_inputs)?;Ok(value)}}",slots.join(",")).unwrap();
    writeln!(out, "fn check(&self,xml:bool,_inputs:&InputView<'_>)->core::Result<()>{{if xml{{let owned=self.pieces(true{input_arg})?;Self::xml_pattern().check_values(&owned.each_ref().map(|piece|&piece[..])).map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Slot conflicts with the declared delimiter\"))}}else{{self.write(false{input_arg}).map(|_|())}}}}").unwrap();
    writeln!(out, "fn write(&self,xml:bool{input})->core::Result<String>{{let owned=self.pieces(xml{input_arg})?;let pieces=owned.each_ref().map(|piece|&piece[..]);let mut out=String::new();if xml{{Self::xml_pattern().write(&pieces,&mut out,usize::MAX)}}else{{{}let values=pieces.map(Some);let active=[{}];YAML_OPTIONAL_{name}.with(|plan|plan.borrow_mut().write(&values,&active,&mut out,usize::MAX))}}.map_err(|_|RuntimeDiagnostic::new(\"value.text-pattern\",\"Text pattern cannot be printed\"))?;Ok(out)}}}}",expressions.constants,active.join(",")).unwrap();
    Ok(out)
}

fn restored_slots(codec: &Codec<'_>) -> Result<(String, Vec<String>), Diagnostic> {
    let mut definitions = String::new();
    let mut slots = Vec::new();
    for (index, name) in codec.names.iter().enumerate() {
        let default = codec
            .entry()
            .presence
            .iter()
            .find(|rule| rule.target == LinkedPresenceTarget::Field(index as u32))
            .and_then(|rule| rule.yaml_missing.as_ref());
        if let Some(value) = default {
            if !defaults::prepared(value)
                || !matches!(
                    value.value_type,
                    LinkedType::Scalar(ScalarType::Text) | LinkedType::Enum(_)
                )
            {
                return Err(unsupported(
                    codec.entry(),
                    "Optional text defaults require prepared text expressions",
                ));
            }
            let (setup, expression) = expressions::expression(codec.entry(), codec.program, value)?;
            writeln!(
                definitions,
                "let default_{index}={{ {setup} {expression} }};"
            )
            .unwrap();
            let spelling = if let scalar::Codec::Enumeration(variants, _, yaml) =
                &codec.fields[index]
            {
                let arms = variants
                    .iter()
                    .map(|variant| {
                        let word = yaml
                            .iter()
                            .find(|word| word.value == variant.value)
                            .ok_or_else(|| {
                                unsupported(
                                    codec.entry(),
                                    "Projected enum default needs a YAML lexeme",
                                )
                            })?;
                        Ok(format!("{:?}=>{:?},", variant.value, word.text))
                    })
                    .collect::<Result<String, Diagnostic>>()?;
                writeln!(definitions, "let default_{index}_yaml=match std::convert::AsRef::<str>::as_ref(&default_{index}){{{arms}_=>return Err(RuntimeDiagnostic::new(\"value.enum\",\"Unknown projected enum default\"))}};").unwrap();
                format!("default_{index}_yaml")
            } else {
                expressions::Expressions::text_reference(value, format!("default_{index}"))
            };
            slots.push(format!("parsed[{index}].as_deref().unwrap_or({spelling})"));
        } else {
            let represented = nkdk_rule_model::text_pattern_fields(codec.yaml).contains(name);
            if !represented {
                return Err(unsupported(
                    codec.entry(),
                    "Omitted text slot requires a YAML default",
                ));
            }
            slots.push(format!("parsed[{index}].as_deref().ok_or_else(||RuntimeDiagnostic::new(\"value.text-pattern\",\"Required text slot is absent\"))?"));
        }
    }
    Ok((definitions, slots))
}
