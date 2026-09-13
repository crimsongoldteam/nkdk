use super::{Boundary, PatternError};

/// Repeated fixed-width rows sharing one separator. Cells borrow the input.
pub struct Sequence<'a, const N: usize> {
    boundary: Boundary<'a>,
}

/// One row and its original spelling, both borrowing the same input.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Row<'s, const N: usize> {
    pub cells: [&'s str; N],
    pub text: &'s str,
}

/// Borrowed fixed cells and the remaining row stream.
pub type HeadRows<'s, const H: usize, R> = ([&'s str; H], R);

impl<'a, const N: usize> Sequence<'a, N> {
    pub fn new(separator: &'a str) -> Result<Self, PatternError> {
        if N == 0 || separator.is_empty() {
            return Err(PatternError::Plan("Rows and separator must be nonempty"));
        }
        Ok(Self {
            boundary: Boundary::new(separator),
        })
    }

    pub fn parse<'s>(
        &self,
        source: &'s str,
        row_budget: usize,
        byte_budget: usize,
    ) -> Result<Vec<[&'s str; N]>, PatternError> {
        self.rows(source, row_budget, byte_budget)?
            .try_fold(Vec::new(), |mut rows, row| {
                let row = row?;
                rows.try_reserve(1).map_err(|_| PatternError::Budget)?;
                rows.push(row);
                Ok(rows)
            })
    }

    /// Streams complete rows without allocating an intermediate collection.
    /// Consumers must exhaust the iterator before publishing a successful result.
    pub fn rows<'s>(
        &self,
        source: &'s str,
        row_budget: usize,
        byte_budget: usize,
    ) -> Result<impl Iterator<Item = Result<[&'s str; N], PatternError>>, PatternError> {
        if source.len() > byte_budget {
            return Err(PatternError::Budget);
        }
        Ok(self.stream(source, row_budget, source.is_empty(), source.len()))
    }

    /// Streams original row slices as well as cells, without joining or copying.
    pub fn rows_with_text<'s>(
        &self,
        source: &'s str,
        row_budget: usize,
        byte_budget: usize,
    ) -> Result<impl Iterator<Item = Result<Row<'s, N>, PatternError>>, PatternError> {
        Ok(self.attach_text(source, self.rows(source, row_budget, byte_budget)?, 0))
    }

    /// Reads a fixed head followed by zero or more complete rows, without copying.
    pub fn rows_with_head<'s, const H: usize>(
        &self,
        source: &'s str,
        row_budget: usize,
        byte_budget: usize,
    ) -> Result<
        HeadRows<'s, H, impl Iterator<Item = Result<[&'s str; N], PatternError>>>,
        PatternError,
    > {
        if H == 0 {
            return Err(PatternError::Plan("Head must be nonempty"));
        }
        if source.len() > byte_budget {
            return Err(PatternError::Budget);
        }
        let mut remainder = Some(source);
        let mut head = [""; H];
        for cell in &mut head {
            let text = remainder.ok_or(PatternError::Input {
                offset: source.len(),
            })?;
            (*cell, remainder) = match text.split_once(self.boundary.literal) {
                Some((cell, tail)) => (cell, Some(tail)),
                None => (text, None),
            };
        }
        Ok((
            head,
            self.stream(
                remainder.unwrap_or(""),
                row_budget,
                remainder.is_none(),
                source.len(),
            ),
        ))
    }

    /// Reads a head and retains each tail row's original spelling.
    pub fn rows_with_head_text<'s, const H: usize>(
        &self,
        source: &'s str,
        row_budget: usize,
        byte_budget: usize,
    ) -> Result<HeadRows<'s, H, impl Iterator<Item = Result<Row<'s, N>, PatternError>>>, PatternError>
    {
        let (head, rows) = self.rows_with_head::<H>(source, row_budget, byte_budget)?;
        let offset =
            head.iter().map(|cell| cell.len()).sum::<usize>() + H * self.boundary.literal.len();
        Ok((head, self.attach_text(source, rows, offset)))
    }

    fn attach_text<'s>(
        &self,
        source: &'s str,
        rows: impl Iterator<Item = Result<[&'s str; N], PatternError>>,
        mut offset: usize,
    ) -> impl Iterator<Item = Result<Row<'s, N>, PatternError>> {
        let separator_len = self.boundary.literal.len();
        rows.map(move |row| {
            let cells = row?;
            let length =
                cells.iter().map(|cell| cell.len()).sum::<usize>() + (N - 1) * separator_len;
            let end = offset + length;
            let text = &source[offset..end];
            offset = end.saturating_add(separator_len);
            Ok(Row { cells, text })
        })
    }

    fn stream<'s>(
        &self,
        source: &'s str,
        row_budget: usize,
        mut finished: bool,
        end_offset: usize,
    ) -> impl Iterator<Item = Result<[&'s str; N], PatternError>> {
        let mut cells = source.split(self.boundary.literal);
        let mut count = 0;
        std::iter::from_fn(move || {
            if finished {
                return None;
            }
            let first = cells.next()?;
            if count >= row_budget {
                finished = true;
                return Some(Err(PatternError::Budget));
            }
            count += 1;
            let mut row = [""; N];
            row[0] = first;
            for value in &mut row[1..] {
                let Some(cell) = cells.next() else {
                    finished = true;
                    return Some(Err(PatternError::Input { offset: end_offset }));
                };
                *value = cell;
            }
            Some(Ok(row))
        })
    }

    /// Checks a borrowed cell, including overlap with a following separator.
    pub fn check_cell(&self, value: &str, followed: bool) -> Result<(), PatternError> {
        let accepted = if followed {
            self.boundary.accepts(value)
        } else {
            !value.contains(self.boundary.literal)
        };
        if accepted {
            Ok(())
        } else {
            Err(PatternError::AmbiguousValue)
        }
    }

    /// Preflights the whole sequence before appending any bytes.
    pub fn write(
        &self,
        rows: &[[&str; N]],
        output: &mut String,
        row_budget: usize,
        byte_budget: usize,
    ) -> Result<(), PatternError> {
        if rows.len() > row_budget {
            return Err(PatternError::Budget);
        }
        let cells = rows.len().checked_mul(N).ok_or(PatternError::Budget)?;
        if cells == 1 && rows[0][0].is_empty() {
            return Err(PatternError::AmbiguousValue);
        }
        self.write_cells(rows.iter().flatten().copied(), cells, output, byte_budget)
    }

    /// Includes the head in preflight, so a malformed tail never publishes a prefix.
    pub fn write_with_head<const H: usize>(
        &self,
        head: &[&str; H],
        rows: &[[&str; N]],
        output: &mut String,
        row_budget: usize,
        byte_budget: usize,
    ) -> Result<(), PatternError> {
        if H == 0 {
            return Err(PatternError::Plan("Head must be nonempty"));
        }
        if rows.len() > row_budget {
            return Err(PatternError::Budget);
        }
        let cells = rows
            .len()
            .checked_mul(N)
            .and_then(|count| count.checked_add(H))
            .ok_or(PatternError::Budget)?;
        self.write_cells(
            head.iter().chain(rows.iter().flatten()).copied(),
            cells,
            output,
            byte_budget,
        )
    }

    fn write_cells<'s>(
        &self,
        values: impl Iterator<Item = &'s str> + Clone,
        cells: usize,
        output: &mut String,
        byte_budget: usize,
    ) -> Result<(), PatternError> {
        let mut length = cells
            .saturating_sub(1)
            .checked_mul(self.boundary.literal.len())
            .ok_or(PatternError::Budget)?;
        for (index, value) in values.clone().enumerate() {
            self.check_cell(value, index + 1 != cells)?;
            length = length
                .checked_add(value.len())
                .ok_or(PatternError::Budget)?;
        }
        if length > byte_budget {
            return Err(PatternError::Budget);
        }
        output
            .try_reserve(length)
            .map_err(|_| PatternError::Budget)?;
        for (index, value) in values.enumerate() {
            if index != 0 {
                output.push_str(self.boundary.literal);
            }
            output.push_str(value);
        }
        Ok(())
    }
}
