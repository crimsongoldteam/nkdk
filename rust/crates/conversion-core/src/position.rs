use crate::RuntimeDiagnostic;

/// XML stores a byte offset until an error needs a line/column; YAML already supplies them.
#[derive(Debug, Clone, Copy, Default)]
pub struct Position {
    line: usize,
    column: usize,
}
impl Position {
    pub fn xml(offset: usize) -> Self {
        Self {
            line: 0,
            column: offset,
        }
    }
    pub fn yaml(line: usize, column: usize) -> Self {
        Self { line, column }
    }
    pub fn apply(self, source: &[u8], error: RuntimeDiagnostic) -> RuntimeDiagnostic {
        if error.line != 0 {
            return error;
        }
        if self.line != 0 {
            return error.at(self.line, self.column);
        }
        let text = std::str::from_utf8(source).unwrap_or("");
        let mut end = self.column.min(text.len());
        while !text.is_char_boundary(end) {
            end -= 1;
        }
        let (mut line, mut column, mut cr) = (1, 1, false);
        for (index, character) in text[..end].chars().enumerate() {
            match character {
                '\u{feff}' if index == 0 => {}
                '\r' => {
                    line += 1;
                    column = 1;
                    cr = true;
                }
                '\n' => {
                    if !cr {
                        line += 1;
                    }
                    column = 1;
                    cr = false;
                }
                _ => {
                    column += 1;
                    cr = false;
                }
            }
        }
        error.at(line, column)
    }
}
