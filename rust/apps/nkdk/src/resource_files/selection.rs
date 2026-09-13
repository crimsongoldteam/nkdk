use super::*;
use nkdk_conversion_core::resources::Limits;

pub(super) struct Selection {
    pub files: Vec<(PathBuf, RelativePath)>,
    pub directories: BTreeSet<PathBuf>,
    pub diagnostics: Vec<RuntimeDiagnostic>,
}
struct Collector<'a> {
    root: &'a Path,
    limits: Limits,
    nodes: usize,
    bytes: usize,
    targets: BTreeMap<PathBuf, PathBuf>,
    explicit: BTreeSet<PathBuf>,
    selected: Selection,
}
pub(super) fn select(plan: &Plan, direction: Direction, root: &Path) -> Result<Selection> {
    let mut collector = Collector {
        root,
        limits: plan.limits(),
        nodes: 0,
        bytes: 0,
        targets: BTreeMap::new(),
        explicit: BTreeSet::new(),
        selected: Selection {
            files: Vec::new(),
            directories: BTreeSet::new(),
            diagnostics: Vec::new(),
        },
    };
    for (index, group) in plan.groups().iter().enumerate() {
        let mut sources = BTreeSet::new();
        for route in group.iter().filter(|route| !route.is_remainder()) {
            let (source, target) = route.paths(direction);
            let Some(path) = existing_path(root, source)? else {
                continue;
            };
            if !fs::metadata(&path).map_err(io_error)?.is_file() {
                return Err(failure(
                    "resource.source",
                    "Resource source is not a regular file",
                ));
            }
            collector.reserve(source, target)?;
            sources.insert(path.clone());
            collector.explicit.insert(path.clone());
            collector.file(path, target.clone())?;
        }
        if sources.len() > 1 {
            collector
                .selected
                .diagnostics
                .push(RuntimeDiagnostic::declared(
                    Some("resource.multiple"),
                    None,
                    Severity::Warning,
                    format!(
                        "Resource group {index} has several alternatives; all files are preserved"
                    ),
                ));
        }
    }
    for route in plan
        .groups()
        .iter()
        .flatten()
        .filter(|route| route.is_remainder())
    {
        let (source, target) = route.paths(direction);
        if let Some(path) = existing_path(root, source)? {
            if !fs::metadata(&path).map_err(io_error)?.is_dir() {
                return Err(failure(
                    "resource.source",
                    "Resource remainder requires a directory",
                ));
            }
            collector.reserve(source, target)?;
            collector.tree(path, source.clone(), target.clone())?;
        }
    }
    for (path, skip) in collector
        .targets
        .keys()
        .map(|path| (path, 1))
        .chain(collector.selected.directories.iter().map(|path| (path, 0)))
    {
        if path
            .ancestors()
            .skip(skip)
            .any(|parent| collector.targets.contains_key(parent))
        {
            return Err(failure(
                "resource.collision",
                "Resource file conflicts with a destination directory",
            ));
        }
    }
    Ok(collector.selected)
}
impl Collector<'_> {
    fn reserve(&mut self, source: &RelativePath, target: &RelativePath) -> Result<()> {
        let bytes = [source, target]
            .into_iter()
            .try_fold(self.bytes, |sum, path| {
                let start = sum.checked_add(path.segments().len() - 1)?;
                path.segments()
                    .iter()
                    .try_fold(start, |sum, part| sum.checked_add(part.len()))
            });
        let Some(bytes) = bytes.filter(|bytes| *bytes <= self.limits.path_bytes) else {
            return Err(failure(
                "resource.limit",
                "Expanded resource paths exceed the byte limit",
            ));
        };
        if self.nodes >= self.limits.routes {
            return Err(failure(
                "resource.limit",
                "Expanded resource entries exceed the limit",
            ));
        }
        self.nodes += 1;
        self.bytes = bytes;
        Ok(())
    }
    fn file(&mut self, source: PathBuf, target: RelativePath) -> Result<()> {
        let destination = relative(&target);
        if let Some(previous) = self.targets.get(&destination) {
            if previous != &source {
                return Err(failure(
                    "resource.collision",
                    "Several resources have the same destination",
                ));
            }
            return Ok(());
        }
        self.targets.insert(destination, source.clone());
        self.selected.files.push((source, target));
        Ok(())
    }
    fn tree(&mut self, path: PathBuf, source: RelativePath, target: RelativePath) -> Result<()> {
        let mut pending = vec![(path, source, target)];
        while let Some((path, source, target)) = pending.pop() {
            let mut entries = Vec::new();
            for entry in fs::read_dir(&path).map_err(io_error)? {
                let entry = entry.map_err(io_error)?;
                let name = entry
                    .file_name()
                    .into_string()
                    .map_err(|_| failure("resource.path", "Resource filename is not UTF-8"))?;
                let from = append(&source, &name, self.limits.path_bytes)?;
                let to = append(&target, &name, self.limits.path_bytes)?;
                self.reserve(&from, &to)?;
                entries.push((entry, from, to));
            }
            if entries.is_empty() {
                self.selected.directories.insert(relative(&target));
            }
            entries.sort_by(|a, b| a.1.segments().cmp(b.1.segments()));
            for (entry, source, target) in entries {
                let kind = entry.file_type().map_err(io_error)?;
                if kind.is_dir() {
                    pending.push((entry.path(), source, target));
                    continue;
                }
                let path = if kind.is_symlink() {
                    let path = fs::canonicalize(entry.path()).map_err(io_error)?;
                    if !path.starts_with(self.root) {
                        return Err(failure(
                            "resource.escape",
                            "Resource source leaves its root",
                        ));
                    }
                    if !fs::metadata(&path).map_err(io_error)?.is_file() {
                        return Err(failure(
                            "resource.source",
                            "Resource tree does not follow directory links",
                        ));
                    }
                    path
                } else if kind.is_file() {
                    entry.path()
                } else {
                    return Err(failure(
                        "resource.source",
                        "Resource tree contains a non-regular file",
                    ));
                };
                if !self.explicit.contains(&path) {
                    self.file(path, target)?;
                }
            }
        }
        Ok(())
    }
}
fn append(prefix: &RelativePath, name: &str, limit: usize) -> Result<RelativePath> {
    RelativePath::new(
        prefix
            .segments()
            .iter()
            .map(String::as_str)
            .chain(std::iter::once(name)),
        limit,
    )
}
