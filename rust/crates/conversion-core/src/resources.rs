//! File-independent resource requests. Paths are paired by the declaration;
//! filesystem presence and copying belong to the application adapter.
use crate::{Direction, Result, RuntimeDiagnostic};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RelativePath {
    segments: Vec<String>,
    bytes: usize,
}
impl RelativePath {
    pub fn new<I, S>(segments: I, max_bytes: usize) -> Result<Self>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let mut result = Self {
            segments: Vec::new(),
            bytes: 0,
        };
        for segment in segments {
            let segment = segment.as_ref();
            if segment.is_empty()
                || matches!(segment, "." | "..")
                || segment.contains(['/', '\\', '\0', ':'])
            {
                return Err(error("resource.path", "Invalid relative path segment"));
            }
            let bytes = result
                .bytes
                .checked_add(usize::from(!result.segments.is_empty()))
                .and_then(|bytes| bytes.checked_add(segment.len()))
                .filter(|bytes| *bytes <= max_bytes)
                .ok_or_else(|| error("resource.limit", "Resource path byte limit exceeded"))?;
            result.segments.push(segment.to_owned());
            result.bytes = bytes;
        }
        if result.segments.is_empty() {
            return Err(error("resource.path", "Resource path must not be empty"));
        }
        Ok(result)
    }
    pub fn segments(&self) -> &[String] {
        &self.segments
    }
}

#[derive(Debug, Clone)]
pub struct Route {
    remainder: bool,
    xml: RelativePath,
    yaml: RelativePath,
}
impl Route {
    pub fn new(xml: RelativePath, yaml: RelativePath) -> Self {
        Self {
            xml,
            yaml,
            remainder: false,
        }
    }
    pub fn remainder(mut self) -> Self {
        self.remainder = true;
        self
    }
    pub fn is_remainder(&self) -> bool {
        self.remainder
    }
    pub fn paths(&self, direction: Direction) -> (&RelativePath, &RelativePath) {
        match direction {
            Direction::XmlToYaml => (&self.xml, &self.yaml),
            Direction::YamlToXml => (&self.yaml, &self.xml),
        }
    }
}

/// Limits cover the whole plan, including both sides of every route.
#[derive(Debug, Clone, Copy)]
pub struct Limits {
    pub groups: usize,
    pub routes: usize,
    pub path_bytes: usize,
}
#[derive(Debug)]
pub struct Plan {
    limits: Limits,
    groups: Vec<Vec<Route>>,
    routes: usize,
    bytes: usize,
}
impl Plan {
    pub fn new(limits: Limits) -> Self {
        Self {
            limits,
            groups: Vec::new(),
            routes: 0,
            bytes: 0,
        }
    }
    /// A group denotes zero or one existing alternative. More than one existing
    /// file is an inferred anomaly; all routes remain available for preservation.
    /// Rejection is atomic: no part of the group is retained.
    pub fn push(&mut self, alternatives: Vec<Route>) -> Result<()> {
        if alternatives.is_empty()
            || (alternatives.len() != 1 && alternatives.iter().any(Route::is_remainder))
        {
            return Err(error(
                "resource.group",
                "Resource group must contain alternatives or one directory remainder",
            ));
        }
        let routes = self
            .routes
            .checked_add(alternatives.len())
            .filter(|count| *count <= self.limits.routes);
        let bytes = alternatives
            .iter()
            .try_fold(self.bytes, |sum, route| {
                sum.checked_add(route.xml.bytes)?
                    .checked_add(route.yaml.bytes)
            })
            .filter(|bytes| *bytes <= self.limits.path_bytes);
        let (Some(routes), Some(bytes)) = (routes, bytes) else {
            return Err(error("resource.limit", "Resource plan limit exceeded"));
        };
        if self.groups.len() >= self.limits.groups {
            return Err(error("resource.limit", "Resource group limit exceeded"));
        }
        self.groups.push(alternatives);
        self.routes = routes;
        self.bytes = bytes;
        Ok(())
    }
    pub fn limits(&self) -> Limits {
        self.limits
    }
    pub fn groups(&self) -> &[Vec<Route>] {
        &self.groups
    }
}
fn error(code: &str, message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new(code, message)
}

/// Check the aggregate size before allocating a constructed segment.
pub fn concat(parts: &[&str], max_bytes: usize) -> Result<String> {
    let size = parts
        .iter()
        .try_fold(0usize, |size, part| size.checked_add(part.len()))
        .filter(|size| *size <= max_bytes)
        .ok_or_else(|| error("resource.limit", "Resource segment byte limit exceeded"))?;
    let mut result = String::with_capacity(size);
    for part in parts {
        result.push_str(part);
    }
    Ok(result)
}
