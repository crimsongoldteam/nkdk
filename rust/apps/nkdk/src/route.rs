//! Data-driven file routing and input binding for project operations.
use crate::{facts::Source, publication};
use nkdk_compiled_rules::{
    Direction, EntryId, InputValue, RuntimeDiagnostic, entry_id, prepare_inputs,
    snapshot_fact_source,
};
use std::{
    collections::BTreeMap,
    fs,
    path::{Component, Path, PathBuf},
    sync::OnceLock,
};
use yaml_rust2::{Yaml, YamlEmitter, YamlLoader, yaml::Hash};

#[derive(Clone, Copy)]
enum ContextValue {
    Name,
    Component,
    Parent,
    DefaultLanguage,
    RegisteredLanguages,
}

impl ContextValue {
    fn parse(value: &str) -> Result<Self, RuntimeDiagnostic> {
        match value {
            "name" => Ok(Self::Name),
            "component" => Ok(Self::Component),
            "parent" => Ok(Self::Parent),
            "defaultLanguage" => Ok(Self::DefaultLanguage),
            "registeredLanguages" => Ok(Self::RegisteredLanguages),
            _ => Err(invalid("Unknown operation context binding")),
        }
    }

    fn resolve(self, name: &str, context: &Context<'_>) -> InputValue {
        match self {
            Self::Name => InputValue::Text(name.into()),
            Self::Component => InputValue::Text(context.component.into()),
            Self::Parent => InputValue::Text(context.parent.into()),
            Self::DefaultLanguage => InputValue::Text(context.default_language.into()),
            Self::RegisteredLanguages => InputValue::Sequence(
                context
                    .registered_languages
                    .iter()
                    .map(|language| InputValue::Text((*language).into()))
                    .collect(),
            ),
        }
    }
}

type Bindings = Vec<(String, ContextValue)>;

struct FactSource {
    name: String,
    entry: EntryId,
    only: Vec<String>,
    inputs: Bindings,
}

struct Route {
    xml_dir: String,
    yaml_dir: String,
    owners: BTreeMap<String, EntryId>,
    inputs: Bindings,
    sources: Vec<FactSource>,
}

pub struct Catalog {
    routes: Vec<Route>,
}

pub struct Context<'a> {
    pub component: &'a str,
    pub parent: &'a str,
    pub default_language: &'a str,
    pub registered_languages: &'a [&'a str],
}

pub struct Resolved<'a> {
    pub sources: Vec<Source<'a>>,
    pub source_names: Vec<String>,
    pub owner_source_index: usize,
    pub target_path: PathBuf,
}

pub struct Snapshot<'a> {
    pub entry: EntryId,
    pub bytes: &'a [u8],
}

pub struct OwnedSnapshot {
    pub name: String,
    pub entry: EntryId,
    pub bytes: Vec<u8>,
}

impl OwnedSnapshot {
    pub fn borrow(&self) -> Snapshot<'_> {
        Snapshot {
            entry: self.entry,
            bytes: &self.bytes,
        }
    }
}

pub enum Material<'a> {
    Xml(&'a [u8]),
    Yaml {
        owner: &'a [u8],
        snapshots: &'a [Snapshot<'a>],
    },
}

fn invalid(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("operation.route", message)
}

fn path_parts(path: &Path) -> Result<(&std::ffi::OsStr, &std::ffi::OsStr), RuntimeDiagnostic> {
    let mut parts = path.components();
    match (parts.next(), parts.next(), parts.next()) {
        (Some(Component::Normal(directory)), Some(Component::Normal(file)), None) => {
            Ok((directory, file))
        }
        _ => Err(invalid(
            "Operation path must have a directory and file name",
        )),
    }
}

fn single_segment(value: &str) -> bool {
    let mut parts = Path::new(value).components();
    matches!(
        (parts.next(), parts.next()),
        (Some(Component::Normal(_)), None)
    )
}

fn required<'a>(value: &'a Yaml, key: &str) -> Result<&'a str, RuntimeDiagnostic> {
    value[key]
        .as_str()
        .ok_or_else(|| invalid("Missing operation route text"))
}

fn mappings(value: &Yaml) -> Result<Bindings, RuntimeDiagnostic> {
    value
        .as_hash()
        .ok_or_else(|| invalid("Operation inputs must be a mapping"))?
        .iter()
        .map(|(name, binding)| {
            let name = name
                .as_str()
                .ok_or_else(|| invalid("Operation input name must be text"))?;
            let binding = binding
                .as_str()
                .ok_or_else(|| invalid("Operation input binding must be text"))?;
            Ok((name.into(), ContextValue::parse(binding)?))
        })
        .collect()
}

fn entry(name: &str) -> Result<EntryId, RuntimeDiagnostic> {
    entry_id(name).ok_or_else(|| invalid("Operation route references an unknown declaration"))
}

impl Catalog {
    pub fn parse(source: &str) -> Result<Self, RuntimeDiagnostic> {
        let documents = YamlLoader::load_from_str(source)
            .map_err(|error| invalid(&format!("Invalid operation routes YAML: {error}")))?;
        let [root] = documents.as_slice() else {
            return Err(invalid("Expected one operation routes document"));
        };
        if required(root, "format")? != "nkdk-operation-routes/1" {
            return Err(invalid("Unsupported operation routes format"));
        }
        let rows = root["routes"]
            .as_vec()
            .ok_or_else(|| invalid("Operation routes must be a list"))?;
        let mut routes = Vec::with_capacity(rows.len());
        for row in rows {
            let xml_dir = required(row, "xmlDir")?.to_owned();
            let yaml_dir = required(row, "yamlDir")?.to_owned();
            if !single_segment(&xml_dir) || !single_segment(&yaml_dir) {
                return Err(invalid("Operation route directories must be one segment"));
            }
            let owner_values = row["owners"]
                .as_hash()
                .ok_or_else(|| invalid("Route owners must be a mapping"))?;
            let mut owners = BTreeMap::new();
            for (component, name) in owner_values {
                let component = component
                    .as_str()
                    .ok_or_else(|| invalid("Route component must be text"))?;
                if !single_segment(component) {
                    return Err(invalid("Route component must be one segment"));
                }
                let name = name
                    .as_str()
                    .ok_or_else(|| invalid("Route owner must be text"))?;
                if owners.insert(component.to_owned(), entry(name)?).is_some() {
                    return Err(invalid("Repeated route component"));
                }
            }
            if owners.is_empty() {
                return Err(invalid("Route has no owner profiles"));
            }
            let mut sources = Vec::new();
            for source in row["sources"]
                .as_vec()
                .ok_or_else(|| invalid("Route sources must be a list"))?
            {
                let only = match source["only"].as_vec() {
                    Some(values) => values
                        .iter()
                        .map(|value| {
                            value
                                .as_str()
                                .map(str::to_owned)
                                .ok_or_else(|| invalid("Source component must be text"))
                        })
                        .collect::<Result<Vec<_>, _>>()?,
                    None if source["only"].is_badvalue() => Vec::new(),
                    None => return Err(invalid("Source components must be a list")),
                };
                if only.iter().any(|component| !owners.contains_key(component)) {
                    return Err(invalid("Source names a component without an owner"));
                }
                let name = required(source, "entry")?.to_owned();
                if sources
                    .iter()
                    .any(|existing: &FactSource| existing.name == name)
                {
                    return Err(invalid("Repeated fact source in operation route"));
                }
                sources.push(FactSource {
                    entry: entry(&name)?,
                    name,
                    only,
                    inputs: mappings(&source["inputs"])?,
                });
            }
            routes.push(Route {
                xml_dir,
                yaml_dir,
                owners,
                inputs: mappings(&row["inputs"])?,
                sources,
            });
        }
        for (index, route) in routes.iter().enumerate() {
            if routes[..index]
                .iter()
                .any(|other| other.xml_dir == route.xml_dir || other.yaml_dir == route.yaml_dir)
            {
                return Err(invalid("Ambiguous operation route directory"));
            }
        }
        Ok(Self { routes })
    }

    pub fn resolve<'a>(
        &self,
        relative_path: &Path,
        direction: Direction,
        material: Material<'a>,
        context: &Context<'_>,
    ) -> Result<Option<Resolved<'a>>, RuntimeDiagnostic> {
        if !matches!(
            (&material, direction),
            (Material::Xml(_), Direction::XmlToYaml)
                | (Material::Yaml { .. }, Direction::YamlToXml)
        ) {
            return Err(invalid("Operation material does not match direction"));
        }
        let (directory, file) = path_parts(relative_path)?;
        let expected_extension = if matches!(direction, Direction::XmlToYaml) {
            "xml"
        } else {
            "yaml"
        };
        if relative_path
            .extension()
            .is_none_or(|extension| extension != expected_extension)
        {
            return Err(invalid(
                "Operation source extension does not match direction",
            ));
        }
        let name = Path::new(file)
            .file_stem()
            .and_then(|value| value.to_str())
            .filter(|value| !value.is_empty())
            .ok_or_else(|| invalid("Operation source file name is invalid"))?;
        let Some(route) = self.routes.iter().find(|route| {
            directory
                == std::ffi::OsStr::new(if matches!(direction, Direction::XmlToYaml) {
                    &route.xml_dir
                } else {
                    &route.yaml_dir
                })
        }) else {
            return Ok(None);
        };
        let owner = *route
            .owners
            .get(context.component)
            .ok_or_else(|| invalid("No owner profile for component"))?;
        let mut sources = Vec::with_capacity(route.sources.len() + 1);
        let mut source_names = Vec::with_capacity(route.sources.len());
        for source in &route.sources {
            if !source.only.is_empty()
                && !source
                    .only
                    .iter()
                    .any(|component| component == context.component)
            {
                continue;
            }
            let (bytes, source_direction) = match &material {
                Material::Xml(bytes) => (*bytes, Direction::XmlToYaml),
                Material::Yaml { snapshots, .. } => {
                    let matches: Vec<_> = snapshots
                        .iter()
                        .filter(|item| item.entry.0 == source.entry.0)
                        .collect();
                    let [snapshot] = matches.as_slice() else {
                        return Err(invalid("Operation fact snapshot is missing or repeated"));
                    };
                    (snapshot.bytes, Direction::YamlToXml)
                }
            };
            sources.push(Source {
                entry: source.entry,
                direction: source_direction,
                bytes,
                inputs: bind(source.entry, &source.inputs, name, context)?,
            });
            source_names.push(source.name.clone());
        }
        let owner_source_index = sources.len();
        let (owner_bytes, owner_direction) = match material {
            Material::Xml(bytes) => (bytes, Direction::XmlToYaml),
            Material::Yaml { owner, .. } => (owner, Direction::YamlToXml),
        };
        sources.push(Source {
            entry: owner,
            direction: owner_direction,
            bytes: owner_bytes,
            inputs: bind(owner, &route.inputs, name, context)?,
        });
        let target = if matches!(direction, Direction::XmlToYaml) {
            &route.yaml_dir
        } else {
            &route.xml_dir
        };
        let extension = if matches!(direction, Direction::XmlToYaml) {
            "yaml"
        } else {
            "xml"
        };
        Ok(Some(Resolved {
            sources,
            source_names,
            owner_source_index,
            target_path: PathBuf::from(target).join(format!("{name}.{extension}")),
        }))
    }

    pub fn capture(
        &self,
        relative_path: &Path,
        xml: &[u8],
        context: &Context<'_>,
    ) -> Result<Option<Vec<OwnedSnapshot>>, RuntimeDiagnostic> {
        let Some(resolved) = self.resolve(
            relative_path,
            Direction::XmlToYaml,
            Material::Xml(xml),
            context,
        )?
        else {
            return Ok(None);
        };
        let mut snapshots = Vec::with_capacity(resolved.owner_source_index);
        for (source, name) in resolved.sources[..resolved.owner_source_index]
            .iter()
            .zip(resolved.source_names)
        {
            snapshots.push(OwnedSnapshot {
                name,
                entry: source.entry,
                bytes: snapshot_fact_source(source.entry, xml, &source.inputs)?,
            });
        }
        Ok(Some(snapshots))
    }

    pub fn paths(
        &self,
        component_root: &Path,
        component: &str,
        direction: Direction,
    ) -> Result<Vec<PathBuf>, String> {
        let mut paths = Vec::new();
        let extension = if matches!(direction, Direction::XmlToYaml) {
            "xml"
        } else {
            "yaml"
        };
        for route in &self.routes {
            if !route.owners.contains_key(component) {
                continue;
            }
            let directory = if matches!(direction, Direction::XmlToYaml) {
                &route.xml_dir
            } else {
                &route.yaml_dir
            };
            let entries = match fs::read_dir(component_root.join(directory)) {
                Ok(entries) => entries,
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
                Err(error) => return Err(error.to_string()),
            };
            for entry in entries {
                let entry = entry.map_err(|error| error.to_string())?;
                if entry
                    .file_type()
                    .map_err(|error| error.to_string())?
                    .is_file()
                    && entry
                        .path()
                        .extension()
                        .is_some_and(|value| value == extension)
                {
                    paths.push(PathBuf::from(directory).join(entry.file_name()));
                }
            }
        }
        paths.sort();
        Ok(paths)
    }

    pub fn sidecar_path(
        &self,
        yaml_relative_path: &Path,
        component: &str,
    ) -> Result<Option<PathBuf>, RuntimeDiagnostic> {
        let (directory, file) = path_parts(yaml_relative_path)?;
        if Path::new(file)
            .extension()
            .is_none_or(|extension| extension != "yaml")
        {
            return Err(invalid("Snapshot owner must be a YAML file"));
        }
        let Some(route) = self
            .routes
            .iter()
            .find(|route| directory == std::ffi::OsStr::new(&route.yaml_dir))
        else {
            return Ok(None);
        };
        if !route.owners.contains_key(component) || !single_segment(component) {
            return Err(invalid("Invalid snapshot component"));
        }
        Ok(Some(
            PathBuf::from(".nkdk/facts")
                .join(component)
                .join(yaml_relative_path),
        ))
    }

    pub fn save_snapshots(
        &self,
        project_root: &Path,
        yaml_relative_path: &Path,
        component: &str,
        snapshots: &[OwnedSnapshot],
    ) -> Result<(), String> {
        let sidecar = self
            .sidecar_path(yaml_relative_path, component)
            .map_err(|error| format!("{error:?}"))?
            .ok_or("No operation route for snapshot owner")?;
        let output = project_root.join(sidecar);
        fs::create_dir_all(output.parent().expect("sidecar has a directory"))
            .map_err(|error| error.to_string())?;
        let bytes = encode_snapshots(snapshots).map_err(|error| format!("{error:?}"))?;
        publication::publish(&output, &bytes)
    }

    pub fn load_snapshots(
        &self,
        project_root: &Path,
        yaml_relative_path: &Path,
        component: &str,
    ) -> Result<Vec<OwnedSnapshot>, String> {
        let sidecar = self
            .sidecar_path(yaml_relative_path, component)
            .map_err(|error| format!("{error:?}"))?
            .ok_or("No operation route for snapshot owner")?;
        let bytes = fs::read(project_root.join(sidecar)).map_err(|error| error.to_string())?;
        decode_snapshots(&bytes).map_err(|error| format!("{error:?}"))
    }
}

/// A single YAML sidecar can be published atomically with the project output.
/// Declaration names, rather than generated numeric slots, are persisted.
pub fn encode_snapshots(snapshots: &[OwnedSnapshot]) -> Result<Vec<u8>, RuntimeDiagnostic> {
    let mut entries = Hash::new();
    for snapshot in snapshots {
        if entry_id(&snapshot.name).is_none_or(|id| id.0 != snapshot.entry.0) {
            return Err(invalid("Fact snapshot declaration name and entry differ"));
        }
        let content = std::str::from_utf8(&snapshot.bytes)
            .map_err(|_| invalid("Fact snapshot is not UTF-8 YAML"))?;
        if entries
            .insert(
                Yaml::String(snapshot.name.clone()),
                Yaml::String(content.into()),
            )
            .is_some()
        {
            return Err(invalid("Repeated fact snapshot declaration"));
        }
    }
    let mut document = Hash::new();
    document.insert(
        Yaml::String("format".into()),
        Yaml::String("nkdk-fact-snapshots/1".into()),
    );
    document.insert(Yaml::String("entries".into()), Yaml::Hash(entries));
    let mut encoded = String::new();
    YamlEmitter::new(&mut encoded)
        .dump(&Yaml::Hash(document))
        .map_err(|error| invalid(&format!("Cannot encode fact snapshots: {error}")))?;
    Ok(encoded.into_bytes())
}

pub fn decode_snapshots(source: &[u8]) -> Result<Vec<OwnedSnapshot>, RuntimeDiagnostic> {
    let text = std::str::from_utf8(source)
        .map_err(|_| invalid("Fact snapshot bundle is not UTF-8 YAML"))?;
    let documents = YamlLoader::load_from_str(text)
        .map_err(|error| invalid(&format!("Invalid fact snapshots YAML: {error}")))?;
    let [document] = documents.as_slice() else {
        return Err(invalid("Expected one fact snapshots document"));
    };
    if required(document, "format")? != "nkdk-fact-snapshots/1" {
        return Err(invalid("Unsupported fact snapshots format"));
    }
    document["entries"]
        .as_hash()
        .ok_or_else(|| invalid("Fact snapshots entries must be a mapping"))?
        .iter()
        .map(|(key, value)| {
            let name = key
                .as_str()
                .ok_or_else(|| invalid("Fact snapshot declaration name must be text"))?;
            let content = value
                .as_str()
                .ok_or_else(|| invalid("Fact snapshot content must be text"))?;
            Ok(OwnedSnapshot {
                name: name.into(),
                entry: entry(name)?,
                bytes: content.as_bytes().to_vec(),
            })
        })
        .collect()
}

fn bind(
    entry: EntryId,
    bindings: &Bindings,
    name: &str,
    context: &Context<'_>,
) -> Result<nkdk_compiled_rules::PreparedInputs, RuntimeDiagnostic> {
    prepare_inputs(
        entry,
        bindings
            .iter()
            .map(|(input, value)| (input.clone(), value.resolve(name, context)))
            .collect(),
    )
}

pub fn catalog() -> &'static Catalog {
    static CATALOG: OnceLock<Catalog> = OnceLock::new();
    CATALOG.get_or_init(|| {
        Catalog::parse(include_str!("../../../operations/routes.yaml"))
            .expect("checked operation route declarations")
    })
}
