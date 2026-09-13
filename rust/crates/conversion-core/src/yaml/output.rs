use crate::{Result, RuntimeDiagnostic};

/// Append generated properties to one mapping buffer. Empty or failed writes
/// leave the existing properties unchanged, including their final newline.
pub fn append_properties(
    output: &mut String,
    write: impl FnOnce(&mut String) -> Result<()>,
) -> Result<()> {
    let original = output.len();
    if original > 0 && !output.ends_with('\n') {
        output.push('\n');
    }
    let start = output.len();
    if let Err(error) = write(output) {
        output.truncate(original);
        return Err(error);
    }
    if output.len() == start {
        output.truncate(original);
    }
    Ok(())
}

/// Exceptional annotations may already contain an encoded property fragment.
pub fn append_encoded_properties(output: &mut String, bytes: &[u8]) -> Result<()> {
    let text = std::str::from_utf8(bytes)
        .map_err(|error| RuntimeDiagnostic::new("yaml.encoding", error.to_string()))?;
    append_properties(output, |output| {
        output.push_str(text);
        Ok(())
    })
}

/// Write nested YAML directly into its parent's buffer. Indentation is emitted
/// lazily, so empty writes and blank lines do not leave trailing spaces.
pub struct Indented<'a> {
    output: &'a mut String,
    indentation: &'a str,
    line_start: bool,
}

impl<'a> Indented<'a> {
    pub fn new(output: &'a mut String, indentation: &'a str) -> Self {
        Self {
            output,
            indentation,
            line_start: true,
        }
    }

    pub fn push_str(&mut self, text: &str) {
        if self.indentation.is_empty() {
            self.output.push_str(text);
            return;
        }
        for part in text.split_inclusive('\n') {
            if self.line_start && part != "\n" {
                self.output.push_str(self.indentation);
            }
            self.output.push_str(part);
            self.line_start = part.ends_with('\n');
        }
    }

    pub fn push(&mut self, value: char) {
        self.push_str(value.encode_utf8(&mut [0; 4]));
    }
}
