//! Strict edits of independent contract fixtures, never production documents.
pub fn apply_replacements(source: &str, edits: &[(&str, &str, usize)]) -> Result<String, String> {
    let mut result = source.to_owned();
    for &(from, to, expected) in edits {
        if from.is_empty() || expected == 0 {
            return Err(
                "Fixture edit requires nonempty source and a positive occurrence count".into(),
            );
        }
        let actual = result.matches(from).count();
        if actual != expected {
            return Err(format!(
                "Fixture edit expected {expected} occurrences of {from:?}, found {actual}"
            ));
        }
        result = result.replace(from, to);
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn replacements_require_exact_occurrences_and_keep_the_source_immutable() {
        let source = "Имя: А\nЭлементы: [повтор, повтор]\n";
        assert_eq!(
            apply_replacements(source, &[("Имя: А", "Имя: Б", 1), ("повтор", "новое", 2)]).unwrap(),
            "Имя: Б\nЭлементы: [новое, новое]\n"
        );
        assert_eq!(source, "Имя: А\nЭлементы: [повтор, повтор]\n");
        for edits in [
            vec![("нет", "значение", 1)],
            vec![("повтор", "значение", 1)],
            vec![("", "значение", 1)],
            vec![("Имя", "Поле", 0)],
        ] {
            assert!(apply_replacements(source, &edits).is_err(), "{edits:?}");
        }
        assert_eq!(apply_replacements(source, &[]).unwrap(), source);
    }
}
