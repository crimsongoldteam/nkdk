//! Bounded occupation snapshots carry QName boundaries, never prepared scope keys.
use super::{Event, Profile, Source, failure};
use crate::{Result, yaml};
use std::collections::BTreeSet;
use std::fmt::Write;

const FORMAT: &str = "nkdk-attribute-reservations/1";
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct SnapshotBudget {
    pub values: usize,
    pub bytes: usize,
}
impl Default for SnapshotBudget {
    fn default() -> Self {
        Self {
            values: 100_000,
            bytes: 4 * 1024 * 1024,
        }
    }
}

type Row = (String, String, String);
struct Snapshot {
    attribute: (String, String),
    rows: Vec<Row>,
}

impl Profile<'_> {
    /// Capture only occupation; the source retains invalid spellings and original XML.
    pub fn capture(&self, source: impl Source, budget: SnapshotBudget) -> Result<Vec<u8>> {
        let mut rows = BTreeSet::new();
        let mut size = 0usize;
        self.walk(source, true, |_, boundary, value| {
            if crate::facts::positive_number(value).is_none() {
                return Ok(());
            }
            let name = boundary.ok_or_else(|| failure("Missing snapshot scope boundary"))?;
            let row = (name.0.to_owned(), name.1.to_owned(), value.to_owned());
            if !rows.contains(&row) {
                size = size
                    .saturating_add(name.0.len())
                    .saturating_add(name.1.len())
                    .saturating_add(value.len());
                if rows.len() >= budget.values || size > budget.bytes {
                    return Err(failure("Attribute snapshot exceeds budget"));
                }
                rows.insert(row);
            }
            Ok(())
        })?;
        Snapshot {
            attribute: (self.attribute.0.to_owned(), self.attribute.1.to_owned()),
            rows: rows.into_iter().collect(),
        }
        .encode(budget)
    }
    pub fn empty_snapshot(&self, budget: SnapshotBudget) -> Result<Vec<u8>> {
        super::super::validate_qname(self.attribute)?;
        Snapshot {
            attribute: (self.attribute.0.to_owned(), self.attribute.1.to_owned()),
            rows: vec![],
        }
        .encode(budget)
    }
    /// Rebind saved boundary names to the current compiled slots and caller's keys.
    pub fn visit_snapshot(
        &self,
        bytes: &[u8],
        budget: SnapshotBudget,
        consume: impl FnMut(usize, &str) -> Result<()>,
    ) -> Result<()> {
        let snapshot = Snapshot::read(bytes, budget)?;
        if (snapshot.attribute.0.as_str(), snapshot.attribute.1.as_str()) != self.attribute {
            return Err(failure(
                "Snapshot attribute does not match compiled profile",
            ));
        }
        self.visit_from_boundary(snapshot, consume)
    }
}

impl Snapshot {
    fn encode(&self, budget: SnapshotBudget) -> Result<Vec<u8>> {
        let mut out = format!(
            "- {FORMAT}\n- [{}, {}]\n",
            yaml::quoted_scalar(&self.attribute.0),
            yaml::quoted_scalar(&self.attribute.1)
        );
        if out.len() > budget.bytes {
            return Err(failure("Attribute snapshot exceeds byte budget"));
        }
        for (namespace, local, value) in &self.rows {
            writeln!(
                out,
                "- [{}, {}, {}]",
                yaml::quoted_scalar(namespace),
                yaml::quoted_scalar(local),
                yaml::quoted_scalar(value)
            )
            .unwrap();
            if out.len() > budget.bytes {
                return Err(failure("Attribute snapshot exceeds byte budget"));
            }
        }
        Ok(out.into_bytes())
    }
    fn read(bytes: &[u8], budget: SnapshotBudget) -> Result<Self> {
        if bytes.len() > budget.bytes {
            return Err(failure("Attribute snapshot exceeds byte budget"));
        }
        let mut depth = 0;
        let mut started = false;
        let mut closed = false;
        let mut version = false;
        let mut attribute = None;
        let mut row = Vec::new();
        let mut rows = BTreeSet::new();
        yaml::visit_nodes(bytes, |node, _| {
            match node {
                yaml::Node::SequenceStart(None) if !closed && depth == 0 && !started => {
                    started = true;
                    depth = 1;
                }
                yaml::Node::SequenceStart(None) if depth == 1 && version => {
                    if attribute.is_some() && rows.len() >= budget.values {
                        return Err(failure("Attribute snapshot exceeds value budget"));
                    }
                    depth = 2;
                    row.clear();
                }
                yaml::Node::Scalar(value, None) if depth == 1 && !version => {
                    if value.into_text()? != FORMAT {
                        return Err(failure("Unknown attribute snapshot version"));
                    }
                    version = true;
                }
                yaml::Node::Scalar(value, None) if depth == 2 && row.len() < 3 => {
                    row.push(value.into_text()?)
                }
                yaml::Node::SequenceEnd if depth == 2 => {
                    depth = 1;
                    if attribute.is_none() {
                        let [namespace, local] = row.as_slice() else {
                            return Err(failure("Invalid snapshot attribute"));
                        };
                        super::super::validate_qname((namespace, local))?;
                        attribute = Some((namespace.clone(), local.clone()));
                    } else {
                        let [namespace, local, value] = row.as_slice() else {
                            return Err(failure("Invalid snapshot occupation row"));
                        };
                        super::super::validate_qname((namespace, local))?;
                        if crate::facts::positive_number(value).is_none() {
                            return Err(failure("Noncanonical snapshot number"));
                        }
                        let saved = (namespace.clone(), local.clone(), value.clone());
                        if !rows.insert(saved) {
                            return Err(failure("Repeated snapshot occupation"));
                        }
                    }
                }
                yaml::Node::SequenceEnd if depth == 1 && attribute.is_some() => {
                    depth = 0;
                    closed = true;
                }
                _ => return Err(failure("Invalid attribute snapshot structure")),
            }
            Ok(())
        })?;
        if !closed || depth != 0 {
            return Err(failure("Incomplete attribute snapshot"));
        }
        Ok(Self {
            attribute: attribute.ok_or_else(|| failure("Missing snapshot attribute"))?,
            rows: rows.into_iter().collect(),
        })
    }
}
impl Source for Snapshot {
    fn visit_attributes(self, mut consume: impl FnMut(Event<'_>) -> Result<()>) -> Result<()> {
        for (namespace, local, value) in &self.rows {
            consume(Event::Enter((namespace, local)))?;
            consume(Event::Attribute(
                (&self.attribute.0, &self.attribute.1),
                value,
            ))?;
            consume(Event::Leave)?;
        }
        Ok(())
    }
}
