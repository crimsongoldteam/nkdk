//! Data-driven file routing and input binding for project operations.
use crate::{facts::Source, publication};
use nkdk_compiled_rules::{
    Direction, EntryId, InputValue, RuntimeDiagnostic, convert_file, empty_attribute_snapshot,
    entry_id, input_names, materialize_fact_source, prepare_inputs, snapshot_attribute_source,
    snapshot_fact_source,
};
use std::{
    collections::{BTreeMap, BTreeSet},
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
    CompatibilityMode,
}

impl ContextValue {
    fn parse(value: &str) -> Result<Self, RuntimeDiagnostic> {
        match value {
            "name" => Ok(Self::Name),
            "component" => Ok(Self::Component),
            "parent" => Ok(Self::Parent),
            "defaultLanguage" => Ok(Self::DefaultLanguage),
            "registeredLanguages" => Ok(Self::RegisteredLanguages),
            "compatibilityMode" => Ok(Self::CompatibilityMode),
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
            Self::CompatibilityMode => InputValue::Text(context.compatibility_mode.into()),
        }
    }
}

enum Binding {
    Context(ContextValue),
    Snapshot {
        entry: EntryId,
        external: bool,
        field: String,
        each: Option<String>,
        default: Option<InputValue>,
    },
    Literal(InputValue),
    Concat(Vec<Binding>),
    ByComponent(BTreeMap<String, Binding>),
    Select {
        on: Box<Binding>,
        cases: BTreeMap<String, Binding>,
    },
}

type Bindings = Vec<(String, Binding)>;

struct FactSource {
    name: String,
    entry: EntryId,
    only: Vec<String>,
    fact_on_import: bool,
    fact_on_export: bool,
    yaml_primary: bool,
    observe_attributes: bool,
    new_owner: NewOwnerPolicy,
    inputs: Bindings,
    resource_file: Option<PathBuf>,
    missing_resource: Option<Yaml>,
    resource_names: Option<ResourceNames>,
    resource_presence: Option<ResourcePresence>,
}

struct ResourceNames {
    directory: nkdk_conversion_core::resources::RelativePath,
    field: String,
    extensions: Vec<String>,
    mode: crate::resource_files::FileNameMode,
    case_sensitive: bool,
    entry_file: Option<String>,
    preserve_order: bool,
}

struct ResourcePresence {
    field: String,
    fingerprint_bytes: Option<usize>,
    paths: Vec<(
        String,
        nkdk_conversion_core::resources::RelativePath,
        nkdk_conversion_core::resources::RelativePath,
    )>,
}

impl ResourcePresence {
    fn parse(spec: &Yaml) -> Result<Option<Self>, RuntimeDiagnostic> {
        if spec.is_badvalue() {
            return Ok(None);
        }
        let rows = spec["paths"]
            .as_vec()
            .filter(|rows| !rows.is_empty() && rows.len() <= 100_000)
            .ok_or_else(|| invalid("Resource presence requires bounded nonempty paths"))?;
        let mut paths = Vec::with_capacity(rows.len());
        let mut names = BTreeSet::new();
        let mut bytes = 0usize;
        for row in rows {
            let name = required(row, "name")?.to_owned();
            if name.is_empty() || !names.insert(name.clone()) {
                return Err(invalid(
                    "Resource presence names must be nonempty and unique",
                ));
            }
            let mut path = |key: &str| {
                let parts = row[key]
                    .as_vec()
                    .ok_or_else(|| invalid("Resource presence requires paired paths"))?;
                let parts = parts
                    .iter()
                    .map(|part| {
                        part.as_str()
                            .ok_or_else(|| invalid("Resource path segments must be text"))
                    })
                    .collect::<Result<Vec<_>, _>>()?;
                for part in &parts {
                    bytes = bytes
                        .checked_add(part.len())
                        .filter(|bytes| *bytes <= 16 * 1024 * 1024)
                        .ok_or_else(|| invalid("Resource presence paths exceed byte limit"))?;
                }
                nkdk_conversion_core::resources::RelativePath::new(parts, 65536)
            };
            paths.push((name, path("xml")?, path("yaml")?));
        }
        let fingerprint_bytes = if spec["fingerprint"].is_badvalue() {
            None
        } else {
            Some(
                spec["fingerprint"]["maxBytes"]
                    .as_i64()
                    .and_then(|bytes| usize::try_from(bytes).ok())
                    .ok_or_else(|| {
                        invalid("Resource fingerprint requires a nonnegative byte limit")
                    })?,
            )
        };
        Ok(Some(Self {
            field: required(spec, "field")?.to_owned(),
            fingerprint_bytes,
            paths,
        }))
    }

    fn snapshot(&self, root: &Path, direction: Direction) -> Result<Vec<u8>, RuntimeDiagnostic> {
        let mut rows = Vec::with_capacity(self.paths.len());
        let mut remaining = self.fingerprint_bytes;
        for (name, xml, yaml) in &self.paths {
            let path = match direction {
                Direction::XmlToYaml => xml,
                Direction::YamlToXml => yaml,
            };
            let mut row = Hash::new();
            let present = if let Some(budget) = remaining {
                let fingerprint = crate::resource_files::file_fingerprint(root, path, budget)?;
                let present = fingerprint.is_some();
                let digest = if let Some(fingerprint) = fingerprint {
                    remaining = Some(budget - fingerprint.bytes);
                    fingerprint.digest
                } else {
                    String::new()
                };
                row.insert(Yaml::String("fingerprint".into()), Yaml::String(digest));
                present
            } else {
                crate::resource_files::file_present(root, path)?
            };
            row.insert(Yaml::String("name".into()), Yaml::String(name.clone()));
            row.insert(
                Yaml::String("present".into()),
                Yaml::String(present.to_string()),
            );
            rows.push(Yaml::Hash(row));
        }
        let mut document = Hash::new();
        document.insert(Yaml::String(self.field.clone()), Yaml::Array(rows));
        render_yaml(&Yaml::Hash(document))
            .map(String::into_bytes)
            .map_err(|_| invalid("Cannot render resource presence"))
    }
}

impl FactSource {
    fn discovers_resources(&self) -> bool {
        self.resource_names.is_some() || self.resource_presence.is_some()
    }
    fn resource_snapshot(
        &self,
        root: Option<&Path>,
        direction: Direction,
        prior: Option<&[u8]>,
    ) -> Result<Option<Vec<u8>>, RuntimeDiagnostic> {
        if !self.discovers_resources() {
            return Ok(None);
        }
        if matches!(direction, Direction::XmlToYaml)
            && self
                .resource_names
                .as_ref()
                .is_some_and(|spec| spec.preserve_order)
        {
            return Ok(None);
        }
        let root = root.ok_or_else(|| invalid("Resource directory root is missing"))?;
        if let Some(spec) = &self.resource_presence {
            return spec.snapshot(root, direction).map(Some);
        }
        self.resource_names
            .as_ref()
            .expect("discovery is declared")
            .snapshot(root, prior)
            .map(Some)
    }
}

enum NewOwnerPolicy {
    Materialize,
    Omit,
    Template(Yaml),
}

struct Route {
    xml_dir: String,
    yaml_dir: String,
    yaml_file: Option<String>,
    owners: BTreeMap<String, Binding>,
    validators: BTreeMap<String, Binding>,
    validation_inputs: Option<Bindings>,
    inputs: Bindings,
    sources: Vec<FactSource>,
    owner_facts: bool,
}

struct ExternalFactRoute {
    from_base: bool,
    base_source: Option<BaseFactSource>,
    fact_on_import: bool,
    fact_on_export: bool,
    xml_dir: String,
    yaml_dir: Option<String>,
    yaml_file: Option<String>,
    name: String,
    entry: EntryId,
    only: Vec<String>,
    inputs: Bindings,
}

struct BaseFactSource {
    component: String,
    entry: EntryId,
    field: String,
    key: Binding,
}

type SourceIdentityIndexes = BTreeMap<(u32, String, String, String), BTreeMap<String, String>>;

fn external_sidecar_directory(route: &ExternalFactRoute, component: &str) -> PathBuf {
    PathBuf::from(".nkdk/facts")
        .join(component)
        .join("external")
        .join(&route.xml_dir)
        .join(&route.name)
}

pub struct Catalog {
    routes: Vec<Route>,
    external: Vec<ExternalFactRoute>,
}

pub struct ExternalFact {
    pub entry: EntryId,
    pub bytes: Vec<u8>,
    pub inputs: nkdk_compiled_rules::PreparedInputs,
    sidecar: PathBuf,
}

#[derive(Default)]
struct ImportSnapshots {
    ready: BTreeMap<PathBuf, Vec<u8>>,
    active: BTreeSet<PathBuf>,
}

pub struct Context<'a> {
    pub component: &'a str,
    pub parent: &'a str,
    pub default_language: &'a str,
    pub registered_languages: &'a [&'a str],
    pub compatibility_mode: &'a str,
}

pub struct Validation {
    pub entry: EntryId,
    pub inputs: nkdk_compiled_rules::PreparedInputs,
}

pub struct Resolved<'a> {
    pub validation: Option<Validation>,
    pub sources: Vec<Source<'a>>,
    pub source_materials: Vec<SourceMaterial>,
    pub owner_source_index: usize,
    pub owner_facts: bool,
    pub target_path: PathBuf,
    pub source_resources: PathBuf,
    pub target_resources: PathBuf,
}

const OBSERVATION_DEPTH: usize = 128;
pub enum SourceMaterial {
    Primary,
    Snapshot(String),
    AttributeSnapshot(String),
}
impl SourceMaterial {
    pub fn kind(&self) -> crate::facts::SourceKind {
        match self {
            Self::Primary => crate::facts::SourceKind::Ordinary,
            Self::Snapshot(_) => crate::facts::SourceKind::Snapshot,
            Self::AttributeSnapshot(_) => crate::facts::SourceKind::AttributeReservationSnapshot {
                max_depth: OBSERVATION_DEPTH,
                budget: Default::default(),
            },
        }
    }
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
        new_owner: bool,
    },
}

fn invalid(message: &str) -> RuntimeDiagnostic {
    RuntimeDiagnostic::new("operation.route", message)
}

fn render_yaml(value: &Yaml) -> Result<String, String> {
    let mut encoded = String::new();
    YamlEmitter::new(&mut encoded)
        .dump(value)
        .map_err(|error| error.to_string())?;
    Ok(encoded)
}

fn entry_bindings(value: &Yaml) -> Result<BTreeMap<String, Binding>, RuntimeDiagnostic> {
    let owner_values = value
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
        let binding = match name.as_str() {
            Some(name) => Binding::Literal(InputValue::Text(name.to_owned())),
            None => parse_binding(name)?,
        };
        check_owner_binding(&binding)?;
        if owners.insert(component.to_owned(), binding).is_some() {
            return Err(invalid("Repeated route component"));
        }
    }
    Ok(owners)
}

fn fact_directions(value: &Yaml, allow_empty: bool) -> Result<(bool, bool), RuntimeDiagnostic> {
    let directions = match value.as_vec() {
        Some(values) => values
            .iter()
            .map(|value| {
                value
                    .as_str()
                    .ok_or_else(|| invalid("Fact direction must be text"))
            })
            .collect::<Result<Vec<_>, _>>()?,
        None if value.is_badvalue() => vec!["xml-to-yaml", "yaml-to-xml"],
        None => return Err(invalid("Fact directions must be a list")),
    };
    if (directions.is_empty() && !allow_empty)
        || directions
            .iter()
            .any(|value| !matches!(*value, "xml-to-yaml" | "yaml-to-xml"))
        || directions.len() != directions.iter().collect::<BTreeSet<_>>().len()
    {
        return Err(invalid("Unknown fact direction"));
    }
    Ok((
        directions.contains(&"xml-to-yaml"),
        directions.contains(&"yaml-to-xml"),
    ))
}

fn single_segment(value: &str) -> bool {
    let mut parts = Path::new(value).components();
    matches!(
        (parts.next(), parts.next()),
        (Some(Component::Normal(_)), None)
    )
}

fn owner_name_for(path: &Path, directory: &str, owner_file: Option<&str>) -> Option<String> {
    let parts = path.components().collect::<Vec<_>>();
    let name = match (owner_file, parts.as_slice()) {
        (None, [Component::Normal(parent), Component::Normal(file)])
            if parent == &std::ffi::OsStr::new(directory) =>
        {
            Path::new(file).file_stem()?.to_str()?
        }
        (
            Some(expected),
            [
                Component::Normal(parent),
                Component::Normal(owner),
                Component::Normal(file),
            ],
        ) if parent == &std::ffi::OsStr::new(directory)
            && file == &std::ffi::OsStr::new(expected) =>
        {
            owner.to_str()?
        }
        _ => return None,
    };
    (!name.is_empty() && single_segment(name)).then(|| name.to_owned())
}

impl ResourceNames {
    fn snapshot(&self, root: &Path, prior: Option<&[u8]>) -> Result<Vec<u8>, RuntimeDiagnostic> {
        let limits = nkdk_conversion_core::resources::Limits {
            groups: 65536,
            routes: 100_000,
            path_bytes: 16 * 1024 * 1024,
        };
        let mut names = if let Some(entry_file) = &self.entry_file {
            crate::resource_files::directory_names(root, &self.directory, entry_file, limits)?
        } else {
            crate::resource_files::file_names(
                root,
                &self.directory,
                &self.extensions,
                self.mode,
                self.case_sensitive,
                limits,
            )?
        };
        if self.preserve_order {
            let text = std::str::from_utf8(
                prior.ok_or_else(|| invalid("Ordered names require a prior snapshot"))?,
            )
            .map_err(|_| invalid("Ordered name snapshot is not UTF-8"))?;
            let documents = YamlLoader::load_from_str(text)
                .map_err(|_| invalid("Ordered name snapshot is not YAML"))?;
            let [document] = documents.as_slice() else {
                return Err(invalid("Ordered names require one snapshot document"));
            };
            let previous = document[&self.field[..]]
                .as_vec()
                .ok_or_else(|| invalid("Ordered name snapshot requires a sequence"))?;
            let current: BTreeSet<_> = names.iter().map(String::as_str).collect();
            let mut retained = BTreeSet::new();
            let mut ordered = Vec::new();
            let mut bytes = 0usize;
            for value in previous {
                let name = value
                    .as_str()
                    .ok_or_else(|| invalid("Ordered names must be text"))?;
                bytes = bytes
                    .checked_add(name.len())
                    .filter(|bytes| *bytes <= limits.path_bytes)
                    .ok_or_else(|| invalid("Ordered names exceed the byte limit"))?;
                if previous.len() > limits.routes {
                    return Err(invalid("Ordered names exceed the route limit"));
                }
                if current.contains(name) {
                    ordered.push(name.to_owned());
                    retained.insert(name);
                }
            }
            ordered.extend(
                names
                    .iter()
                    .filter(|name| !retained.contains(name.as_str()))
                    .cloned(),
            );
            if ordered.len() > limits.routes
                || ordered.iter().map(String::len).sum::<usize>() > limits.path_bytes
            {
                return Err(invalid("Refreshed names exceed the discovery limits"));
            }
            names = ordered;
        }
        let mut document = Hash::new();
        document.insert(
            Yaml::String(self.field.clone()),
            Yaml::Array(names.into_iter().map(Yaml::String).collect()),
        );
        Ok(render_yaml(&Yaml::Hash(document))
            .map_err(|_| invalid("Cannot render resource names"))?
            .into_bytes())
    }
}

impl Route {
    fn name_for(&self, path: &Path, direction: Direction) -> Option<String> {
        match direction {
            Direction::XmlToYaml => owner_name_for(path, &self.xml_dir, None),
            Direction::YamlToXml => owner_name_for(path, &self.yaml_dir, self.yaml_file.as_deref()),
        }
    }

    fn target_path(&self, name: &str, direction: Direction) -> PathBuf {
        match direction {
            Direction::XmlToYaml => self.yaml_file.as_ref().map_or_else(
                || PathBuf::from(&self.yaml_dir).join(format!("{name}.yaml")),
                |file| PathBuf::from(&self.yaml_dir).join(name).join(file),
            ),
            Direction::YamlToXml => PathBuf::from(&self.xml_dir).join(format!("{name}.xml")),
        }
    }
}

fn yaml_owner_file(value: &Yaml) -> Result<Option<String>, RuntimeDiagnostic> {
    match value {
        Yaml::BadValue => Ok(None),
        Yaml::String(file)
            if single_segment(file)
                && Path::new(file).extension().is_some_and(|ext| ext == "yaml") =>
        {
            Ok(Some(file.clone()))
        }
        _ => Err(invalid(
            "Operation YAML owner file must be a YAML file name",
        )),
    }
}

fn required<'a>(value: &'a Yaml, key: &str) -> Result<&'a str, RuntimeDiagnostic> {
    value[key]
        .as_str()
        .ok_or_else(|| invalid("Missing operation route text"))
}

fn literal(value: &Yaml) -> Result<InputValue, RuntimeDiagnostic> {
    match value {
        Yaml::String(text) => Ok(InputValue::Text(text.clone())),
        Yaml::Boolean(value) => Ok(InputValue::Boolean(*value)),
        Yaml::Array(items) => items
            .iter()
            .map(literal)
            .collect::<Result<Vec<_>, _>>()
            .map(InputValue::Sequence),
        Yaml::Hash(fields) => fields
            .iter()
            .map(|(name, value)| {
                Ok((
                    name.as_str()
                        .ok_or_else(|| invalid("Literal record key must be text"))?
                        .to_owned(),
                    literal(value)?,
                ))
            })
            .collect::<Result<Vec<_>, _>>()
            .map(InputValue::Record),
        _ => Err(invalid("Unsupported literal operation input")),
    }
}

fn parse_binding(value: &Yaml) -> Result<Binding, RuntimeDiagnostic> {
    if let Some(name) = value.as_str() {
        return ContextValue::parse(name).map(Binding::Context);
    }
    let fields = value
        .as_hash()
        .ok_or_else(|| invalid("Operation input binding must be text or mapping"))?;
    if fields.len() != 1 {
        return Err(invalid("Operation input binding needs one operator"));
    }
    if let Some(reference) = value["snapshot"].as_hash() {
        if !(2..=5).contains(&reference.len())
            || reference.keys().any(|key| {
                !matches!(
                    key.as_str(),
                    Some("entry" | "field" | "each" | "default" | "storage")
                )
            })
        {
            return Err(invalid("Snapshot binding must name one entry and field"));
        }
        return Ok(Binding::Snapshot {
            entry: entry(required(&value["snapshot"], "entry")?)?,
            external: match &value["snapshot"]["storage"] {
                Yaml::BadValue => false,
                Yaml::String(value) if value == "owner" => false,
                Yaml::String(value) if value == "external" => true,
                _ => return Err(invalid("Unknown snapshot storage")),
            },
            field: required(&value["snapshot"], "field")?.to_owned(),
            each: (!value["snapshot"]["each"].is_badvalue())
                .then(|| required(&value["snapshot"], "each").map(str::to_owned))
                .transpose()?,
            default: (!value["snapshot"]["default"].is_badvalue())
                .then(|| literal(&value["snapshot"]["default"]))
                .transpose()?,
        });
    }
    if !value["literal"].is_badvalue() {
        return literal(&value["literal"]).map(Binding::Literal);
    }
    if let Some(selection) = value["select"].as_hash() {
        if selection.len() != 2 || value["select"]["on"].is_badvalue() {
            return Err(invalid("Selection needs an input and cases"));
        }
        let rows = value["select"]["cases"]
            .as_hash()
            .filter(|rows| !rows.is_empty())
            .ok_or_else(|| invalid("Selection cases must be a nonempty mapping"))?;
        let cases = rows
            .iter()
            .map(|(key, binding)| {
                Ok((
                    key.as_str()
                        .ok_or_else(|| invalid("Selection case must be text"))?
                        .to_owned(),
                    parse_binding(binding)?,
                ))
            })
            .collect::<Result<BTreeMap<_, _>, RuntimeDiagnostic>>()?;
        return Ok(Binding::Select {
            on: Box::new(parse_binding(&value["select"]["on"])?),
            cases,
        });
    }
    if let Some(parts) = value["concat"].as_vec() {
        if parts.is_empty() {
            return Err(invalid("Text concatenation must contain parts"));
        }
        return parts
            .iter()
            .map(parse_binding)
            .collect::<Result<Vec<_>, _>>()
            .map(Binding::Concat);
    }
    if let Some(rows) = value["byComponent"].as_hash() {
        if rows.is_empty() {
            return Err(invalid("Component binding must contain cases"));
        }
        return rows
            .iter()
            .map(|(component, binding)| {
                let component = component
                    .as_str()
                    .ok_or_else(|| invalid("Component binding key must be text"))?;
                Ok((component.to_owned(), parse_binding(binding)?))
            })
            .collect::<Result<BTreeMap<_, _>, _>>()
            .map(Binding::ByComponent);
    }
    Err(invalid("Unknown operation input binding"))
}

// Owner leaves are checked at catalog loading; selection never invents names.
fn check_owner_binding(binding: &Binding) -> Result<(), RuntimeDiagnostic> {
    match binding {
        Binding::Literal(InputValue::Text(name)) => {
            entry(name)?;
            Ok(())
        }
        Binding::Select { cases, .. } => {
            for binding in cases.values() {
                check_owner_binding(binding)?;
            }
            Ok(())
        }
        _ => Err(invalid(
            "Owner selection must contain registered declaration literals",
        )),
    }
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
            Ok((name.into(), parse_binding(binding)?))
        })
        .collect()
}

fn snapshot_value(bytes: &[u8], field: &str) -> Result<Option<Yaml>, RuntimeDiagnostic> {
    let text = std::str::from_utf8(bytes).map_err(|_| invalid("Fact snapshot is not UTF-8"))?;
    if text.trim().is_empty() {
        return Ok(None);
    }
    let documents =
        YamlLoader::load_from_str(text).map_err(|_| invalid("Fact snapshot is not YAML"))?;
    let [document] = documents.as_slice() else {
        return Err(invalid("Expected one fact snapshot document"));
    };
    Ok((!document[field].is_badvalue()).then(|| document[field].clone()))
}

fn snapshot_text(bytes: &[u8], field: &str) -> Result<String, RuntimeDiagnostic> {
    match snapshot_value(bytes, field)?
        .ok_or_else(|| invalid("Referenced fact snapshot field is missing"))?
    {
        Yaml::String(value) => Ok(value),
        _ => Err(invalid("Referenced fact snapshot field is not text")),
    }
}

fn snapshot_field(snapshot: &OwnedSnapshot, field: &str) -> Result<Yaml, RuntimeDiagnostic> {
    snapshot_text(&snapshot.bytes, field).map(Yaml::String)
}

fn template_reference(value: &Yaml, key: &str) -> Result<(String, String), RuntimeDiagnostic> {
    Ok((
        required(value, "entry")?.to_owned(),
        required(value, key)?.to_owned(),
    ))
}

fn optional_template(value: &Yaml) -> Option<&Yaml> {
    value
        .as_hash()
        .filter(|fields| fields.len() == 1)
        .and_then(|_| (!value["optional"].is_badvalue()).then(|| &value["optional"]))
}

fn validate_creation_template(value: &Yaml) -> Result<(), RuntimeDiagnostic> {
    if let Some(inner) = optional_template(value) {
        return validate_creation_template(inner);
    }
    match value {
        Yaml::Hash(fields) if fields.len() == 1 && !value["snapshot"].is_badvalue() => {
            template_reference(&value["snapshot"], "field")?;
        }
        Yaml::Hash(fields) if fields.len() == 1 && !value["externalSnapshot"].is_badvalue() => {
            let reference = &value["externalSnapshot"];
            template_reference(reference, "field")?;
            required(reference, "component")?;
        }
        Yaml::Hash(fields) => {
            for (key, value) in fields {
                if key.as_str().is_none() {
                    return Err(invalid("Creation template keys must be text"));
                }
                validate_creation_template(value)?;
            }
        }
        Yaml::Array(items) => {
            for item in items {
                validate_creation_template(item)?;
            }
        }
        Yaml::BadValue => return Err(invalid("Creation template contains an invalid value")),
        _ => {}
    }
    Ok(())
}

fn entry(name: &str) -> Result<EntryId, RuntimeDiagnostic> {
    entry_id(name).ok_or_else(|| invalid("Operation route references an unknown declaration"))
}

fn external_conflicts(
    routes: &[ExternalFactRoute],
    xml_dir: &str,
    name: &str,
    only: &[String],
) -> bool {
    routes.iter().any(|route| {
        route.xml_dir == xml_dir
            && route.name == name
            && (only.is_empty()
                || route.only.is_empty()
                || only.iter().any(|kind| route.only.contains(kind)))
    })
}

impl Catalog {
    pub fn parse_sources(sources: &[&str]) -> Result<Self, RuntimeDiagnostic> {
        let mut routes = Vec::new();
        let mut external = Vec::new();
        for source in sources {
            let parsed = Self::parse(source)?;
            for route in parsed.routes {
                if route_conflicts(&routes, &route) {
                    return Err(invalid("Ambiguous operation route directory"));
                }
                routes.push(route);
            }
            for fact in parsed.external {
                if external_conflicts(&external, &fact.xml_dir, &fact.name, &fact.only) {
                    return Err(invalid("Repeated external fact route"));
                }
                external.push(fact);
            }
        }
        Ok(Self { routes, external })
    }

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
            let yaml_file = yaml_owner_file(&row["yamlFile"])?;
            let owners = entry_bindings(&row["owners"])?;
            let validators = if row["validators"].is_badvalue() {
                BTreeMap::new()
            } else {
                entry_bindings(&row["validators"])?
            };
            if validators
                .keys()
                .any(|component| !owners.contains_key(component))
            {
                return Err(invalid("Validator names a component without an owner"));
            }
            let validation_inputs = if row["validationInputs"].is_badvalue() {
                None
            } else {
                Some(mappings(&row["validationInputs"])?)
            };
            if validators.is_empty() && validation_inputs.is_some() {
                return Err(invalid("Validation inputs require validators"));
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
                let (fact_on_import, fact_on_export) = fact_directions(
                    &source["factDirections"],
                    !source["resourceNames"].is_badvalue()
                        || !source["resourcePresence"].is_badvalue(),
                )?;
                if sources
                    .iter()
                    .any(|existing: &FactSource| existing.name == name)
                {
                    return Err(invalid("Repeated fact source in operation route"));
                }
                let discovery_count = ["resourceNames", "resourcePresence", "resourceFile"]
                    .iter()
                    .filter(|key| !source[**key].is_badvalue())
                    .count();
                if discovery_count > 1 {
                    return Err(invalid("Resource source must select one discovery mode"));
                }
                let observe_attributes = match &source["observe"] {
                    Yaml::BadValue => false,
                    Yaml::String(mode) if mode == "attributes" => true,
                    _ => return Err(invalid("Unknown source observation mode")),
                };
                if observe_attributes
                    && (source["yamlSource"]
                        .as_str()
                        .is_some_and(|mode| mode != "snapshot")
                        || !source["resourceNames"].is_badvalue()
                        || !source["resourcePresence"].is_badvalue()
                        || !source["missingResource"].is_badvalue()
                        || !(source["newOwner"].is_badvalue()
                            || source["newOwner"].as_str() == Some("omit")))
                {
                    return Err(invalid(
                        "Attribute observation requires its own retained source, without semantic discovery or creation templates",
                    ));
                }
                sources.push(FactSource {
                    entry: entry(&name)?,
                    name,
                    only,
                    fact_on_import,
                    fact_on_export,
                    observe_attributes,
                    yaml_primary: match &source["yamlSource"] {
                        Yaml::BadValue => false,
                        Yaml::String(value) if value == "snapshot" => false,
                        Yaml::String(value) if value == "primary" => true,
                        _ => return Err(invalid("YAML fact source must be primary or snapshot")),
                    },
                    new_owner: match &source["newOwner"] {
                        Yaml::BadValue => NewOwnerPolicy::Materialize,
                        Yaml::String(value) if value == "omit" => NewOwnerPolicy::Omit,
                        Yaml::Hash(_) if source["newOwner"]["template"].as_hash().is_some() => {
                            let template = source["newOwner"]["template"].clone();
                            validate_creation_template(&template)?;
                            NewOwnerPolicy::Template(template)
                        }
                        _ => return Err(invalid("Unknown new-owner source policy")),
                    },
                    inputs: mappings(&source["inputs"])?,
                    resource_file: match source["resourceFile"].as_vec() {
                        Some(parts) if !parts.is_empty() => {
                            let mut path = PathBuf::new();
                            for part in parts {
                                let part = part
                                    .as_str()
                                    .filter(|part| single_segment(part))
                                    .ok_or_else(|| {
                                        invalid("Resource source path must contain safe segments")
                                    })?;
                                path.push(part);
                            }
                            Some(path)
                        }
                        None if source["resourceFile"].is_badvalue() => None,
                        _ => return Err(invalid("Resource source path must be a nonempty list")),
                    },
                    missing_resource: if source["missingResource"].is_badvalue() {
                        None
                    } else {
                        Some(source["missingResource"].clone())
                    },
                    resource_presence: ResourcePresence::parse(&source["resourcePresence"])?,
                    resource_names: if source["resourceNames"].is_badvalue() {
                        None
                    } else {
                        let spec = &source["resourceNames"];
                        let segments = spec["directory"]
                            .as_vec()
                            .ok_or_else(|| invalid("Resource names require a directory"))?;
                        let mut directory = Vec::new();
                        for segment in segments {
                            let text = segment
                                .as_str()
                                .filter(|text| single_segment(text))
                                .ok_or_else(|| {
                                    invalid("Resource directory has an unsafe segment")
                                })?;
                            directory.push(text.to_owned());
                        }
                        let directory =
                            nkdk_conversion_core::resources::RelativePath::new(directory, 65536)?;
                        let option = |key: &str, default: bool| {
                            if spec[key].is_badvalue() {
                                Ok(default)
                            } else {
                                spec[key]
                                    .as_bool()
                                    .ok_or_else(|| invalid("Resource name option must be boolean"))
                            }
                        };
                        let entry_file = if spec["entryFile"].is_badvalue() {
                            None
                        } else {
                            Some(
                                spec["entryFile"]
                                    .as_str()
                                    .filter(|value| single_segment(value))
                                    .ok_or_else(|| {
                                        invalid("Resource entry file must be a safe segment")
                                    })?
                                    .to_owned(),
                            )
                        };
                        if entry_file.is_some() && !spec["extensions"].is_badvalue() {
                            return Err(invalid("Resource names must select files or directories"));
                        }
                        let extensions = if entry_file.is_some() {
                            Vec::new()
                        } else {
                            spec["extensions"]
                                .as_vec()
                                .ok_or_else(|| invalid("Resource names require extensions"))?
                                .iter()
                                .map(|item| {
                                    item.as_str()
                                        .map(str::to_owned)
                                        .ok_or_else(|| invalid("Resource extension must be text"))
                                })
                                .collect::<Result<Vec<_>, _>>()?
                        };
                        Some(ResourceNames {
                            directory,
                            field: required(spec, "field")?.to_owned(),
                            extensions,
                            mode: if option("fullNames", false)? {
                                crate::resource_files::FileNameMode::FileName
                            } else {
                                crate::resource_files::FileNameMode::Stem
                            },
                            case_sensitive: option("caseSensitive", true)?,
                            entry_file,
                            preserve_order: option("preserveOrder", false)?,
                        })
                    },
                });
            }
            routes.push(Route {
                xml_dir,
                yaml_dir,
                yaml_file,
                owners,
                validators,
                validation_inputs,
                inputs: mappings(&row["inputs"])?,
                sources,
                owner_facts: match &row["ownerFacts"] {
                    Yaml::BadValue => true,
                    Yaml::Boolean(value) => *value,
                    _ => return Err(invalid("Owner facts must be boolean")),
                },
            });
        }
        for (index, route) in routes.iter().enumerate() {
            if route_conflicts(&routes[..index], route) {
                return Err(invalid("Ambiguous operation route directory"));
            }
        }
        let mut external = Vec::new();
        if !root["factRoutes"].is_badvalue() {
            let rows = root["factRoutes"]
                .as_vec()
                .ok_or_else(|| invalid("External fact routes must be a list"))?;
            for row in rows {
                let xml_dir = required(row, "xmlDir")?.to_owned();
                let name = required(row, "entry")?.to_owned();
                if !single_segment(&xml_dir) || !single_segment(&name) {
                    return Err(invalid("External fact route has an invalid segment"));
                }
                let only = match row["only"].as_vec() {
                    Some(values) => values
                        .iter()
                        .map(|value| {
                            value
                                .as_str()
                                .filter(|value| single_segment(value))
                                .map(str::to_owned)
                                .ok_or_else(|| {
                                    invalid("External fact component must be one segment")
                                })
                        })
                        .collect::<Result<Vec<_>, _>>()?,
                    None if row["only"].is_badvalue() => Vec::new(),
                    None => return Err(invalid("External fact components must be a list")),
                };
                if external_conflicts(&external, &xml_dir, &name, &only) {
                    return Err(invalid("Repeated external fact route"));
                }
                let (fact_on_import, fact_on_export) =
                    fact_directions(&row["factDirections"], false)?;
                let yaml_file = yaml_owner_file(&row["yamlFile"])?;
                if yaml_file.is_some() && row["yamlDir"].is_badvalue() {
                    return Err(invalid(
                        "External owner file requires a primary YAML directory",
                    ));
                }
                let base_source = if row["baseSource"].is_badvalue() {
                    None
                } else {
                    let source = &row["baseSource"];
                    let fields = source
                        .as_hash()
                        .ok_or_else(|| invalid("Base source must be a mapping"))?;
                    if fields.len() != 4
                        || fields.keys().any(|key| {
                            !matches!(key.as_str(), Some("component" | "entry" | "field" | "key"))
                        })
                        || fact_on_import
                        || row["yamlDir"].is_badvalue()
                        || !matches!(row["fromBase"], Yaml::BadValue | Yaml::Boolean(false))
                    {
                        return Err(invalid(
                            "Joined base source requires a primary export route",
                        ));
                    }
                    let component = required(source, "component")?.to_owned();
                    if !single_segment(&component) {
                        return Err(invalid("Base source component must be one segment"));
                    }
                    Some(BaseFactSource {
                        component,
                        entry: entry(required(source, "entry")?)?,
                        field: required(source, "field")?.to_owned(),
                        key: parse_binding(&source["key"])?,
                    })
                };
                external.push(ExternalFactRoute {
                    base_source,
                    from_base: match row["fromBase"] {
                        Yaml::BadValue => false,
                        Yaml::Boolean(value) => value,
                        _ => return Err(invalid("External base source flag must be boolean")),
                    },
                    fact_on_import,
                    fact_on_export,
                    xml_dir,
                    yaml_dir: match &row["yamlDir"] {
                        Yaml::BadValue => None,
                        Yaml::String(directory)
                            if single_segment(directory) && directory != ".nkdk" =>
                        {
                            Some(directory.clone())
                        }
                        _ => {
                            return Err(invalid(
                                "External fact YAML directory must be a safe primary segment",
                            ));
                        }
                    },
                    yaml_file,
                    entry: entry(&name)?,
                    name,
                    only,
                    inputs: if row["inputs"].is_badvalue() {
                        Vec::new()
                    } else {
                        mappings(&row["inputs"])?
                    },
                });
            }
        }
        Ok(Self { routes, external })
    }

    fn external_resource_source(
        &self,
        external: &ExternalFactRoute,
        context: &Context<'_>,
    ) -> Result<Option<&FactSource>, RuntimeDiagnostic> {
        let mut matches = self
            .routes
            .iter()
            .filter(|route| {
                route.xml_dir == external.xml_dir
                    && external.yaml_dir.as_ref() == Some(&route.yaml_dir)
                    && route.yaml_file == external.yaml_file
                    && route.owners.contains_key(context.component)
            })
            .flat_map(|route| &route.sources)
            .filter(|source| {
                source.entry.0 == external.entry.0
                    && source.discovers_resources()
                    && (source.only.is_empty()
                        || source
                            .only
                            .iter()
                            .any(|component| component == context.component))
            });
        let source = matches.next();
        if matches.next().is_some() {
            return Err(invalid("External resource source is ambiguous"));
        }
        if source.is_some() && external.base_source.is_some() {
            return Err(invalid(
                "Resource discovery requires an independent base route",
            ));
        }
        Ok(source)
    }

    fn external_import_provider(
        &self,
        entry: EntryId,
        directory: &str,
        component: &str,
    ) -> Result<&ExternalFactRoute, RuntimeDiagnostic> {
        let mut providers = self.external.iter().filter(|provider| {
            provider.entry.0 == entry.0
                && provider.xml_dir == directory
                && provider.fact_on_import
                && (provider.only.is_empty()
                    || provider.only.iter().any(|value| value == component))
        });
        let provider = providers
            .next()
            .ok_or_else(|| invalid("Retained external snapshot has no registered import source"))?;
        if providers.next().is_some() {
            return Err(invalid("Retained external snapshot source is ambiguous"));
        }
        Ok(provider)
    }

    fn base_owner_name<'a>(
        &self,
        root: &Path,
        route: &ExternalFactRoute,
        source: &BaseFactSource,
        key: &str,
        indexes: &'a mut SourceIdentityIndexes,
    ) -> Result<&'a str, RuntimeDiagnostic> {
        let address = (
            source.entry.0,
            route.xml_dir.clone(),
            source.component.clone(),
            source.field.clone(),
        );
        if let std::collections::btree_map::Entry::Vacant(slot) = indexes.entry(address.clone()) {
            let provider =
                self.external_import_provider(source.entry, &route.xml_dir, &source.component)?;
            let directory = root.join(external_sidecar_directory(provider, &source.component));
            let entries = fs::read_dir(directory).map_err(|error| {
                invalid(&format!("Cannot read retained base identities: {error}"))
            })?;
            let mut index = BTreeMap::new();
            for item in entries {
                let item = item.map_err(|error| invalid(&error.to_string()))?;
                if !item
                    .file_type()
                    .map_err(|error| invalid(&error.to_string()))?
                    .is_file()
                    || item
                        .path()
                        .extension()
                        .is_none_or(|extension| extension != "yaml")
                {
                    continue;
                }
                let path = item.path();
                let name = path
                    .file_stem()
                    .and_then(|value| value.to_str())
                    .filter(|name| single_segment(name))
                    .ok_or_else(|| invalid("Retained base filename is invalid"))?;
                let bytes = fs::read(&path).map_err(|error| invalid(&error.to_string()))?;
                let Some(Yaml::String(identity)) = snapshot_value(&bytes, &source.field)? else {
                    return Err(invalid("Retained base identity must be text"));
                };
                if identity.is_empty() || index.insert(identity, name.to_owned()).is_some() {
                    return Err(invalid("Retained base identity is empty or ambiguous"));
                }
            }
            slot.insert(index);
        }
        indexes
            .get(&address)
            .and_then(|index| index.get(key))
            .map(String::as_str)
            .ok_or_else(|| invalid("Referenced base identity is missing"))
    }

    pub fn external_sources(
        &self,
        root: &Path,
        context: &Context<'_>,
        direction: Direction,
    ) -> Result<Vec<ExternalFact>, RuntimeDiagnostic> {
        self.external_sources_with_base(root, None, context, direction)
    }

    pub fn external_sources_with_base(
        &self,
        root: &Path,
        base_root: Option<&Path>,
        context: &Context<'_>,
        direction: Direction,
    ) -> Result<Vec<ExternalFact>, RuntimeDiagnostic> {
        self.external_sources_in_scope(root, base_root, context, direction, false)
    }

    pub fn external_base_sources(
        &self,
        root: &Path,
        context: &Context<'_>,
    ) -> Result<Vec<ExternalFact>, RuntimeDiagnostic> {
        self.external_sources_in_scope(root, None, context, Direction::YamlToXml, true)
    }

    fn import_external_snapshot(
        &self,
        root: &Path,
        route: &ExternalFactRoute,
        name: &str,
        context: &Context<'_>,
        state: &mut ImportSnapshots,
    ) -> Result<Vec<u8>, RuntimeDiagnostic> {
        let key = external_sidecar_directory(route, context.component).join(format!("{name}.yaml"));
        if let Some(bytes) = state.ready.get(&key) {
            return Ok(bytes.clone());
        }
        if !state.active.insert(key.clone()) {
            return Err(invalid("External import snapshot dependency cycle"));
        }
        let mut snapshots = Vec::new();
        let mut loaded = BTreeSet::new();
        let mut load = |entry: EntryId, external: bool| {
            if !external {
                return Err(invalid(
                    "External snapshot inputs require a primary YAML route",
                ));
            }
            let provider =
                self.external_import_provider(entry, &route.xml_dir, context.component)?;
            Ok(vec![OwnedSnapshot {
                name: provider.name.clone(),
                entry: provider.entry,
                bytes: self.import_external_snapshot(root, provider, name, context, state)?,
            }])
        };
        for (_, binding) in &route.inputs {
            binding.prepare_snapshots(name, context, &mut snapshots, &mut loaded, &mut load)?;
        }
        let borrowed: Vec<_> = snapshots.iter().map(OwnedSnapshot::borrow).collect();
        let inputs = bind(route.entry, &route.inputs, name, context, &borrowed)?;
        let path = root.join(&route.xml_dir).join(format!("{name}.xml"));
        if !fs::symlink_metadata(&path)
            .map_err(|error| invalid(&error.to_string()))?
            .is_file()
        {
            return Err(invalid("External import source must be an ordinary file"));
        }
        let xml = fs::read(path).map_err(|error| invalid(&error.to_string()))?;
        let bytes = snapshot_fact_source(route.entry, &xml, &inputs)?;
        state.active.remove(&key);
        state.ready.insert(key, bytes.clone());
        Ok(bytes)
    }

    fn external_sources_in_scope(
        &self,
        root: &Path,
        base_root: Option<&Path>,
        context: &Context<'_>,
        direction: Direction,
        base_only: bool,
    ) -> Result<Vec<ExternalFact>, RuntimeDiagnostic> {
        let mut result: Vec<ExternalFact> = Vec::new();
        let mut identity_indexes = SourceIdentityIndexes::new();
        let mut import_snapshots = ImportSnapshots::default();
        for route in &self.external {
            if base_only && !route.from_base {
                continue;
            }
            if !match direction {
                Direction::XmlToYaml => route.fact_on_import,
                Direction::YamlToXml => route.fact_on_export,
            } {
                continue;
            }
            if !route.only.is_empty() && !route.only.iter().any(|kind| kind == context.component) {
                continue;
            }
            let sidecar_dir = external_sidecar_directory(route, context.component);
            let directory = match direction {
                Direction::XmlToYaml => root.join(&route.xml_dir),
                Direction::YamlToXml => root.join(
                    route
                        .yaml_dir
                        .as_ref()
                        .map_or(sidecar_dir.as_path(), Path::new),
                ),
            };
            let entries = match fs::read_dir(directory) {
                Ok(entries) => entries,
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
                Err(error) => {
                    return Err(invalid(&format!(
                        "Cannot read external fact directory: {error}"
                    )));
                }
            };
            for item in entries {
                let item =
                    item.map_err(|error| invalid(&format!("Cannot read external fact: {error}")))?;
                let file_type = item
                    .file_type()
                    .map_err(|error| invalid(&format!("Cannot inspect external fact: {error}")))?;
                let mut path = item.path();
                let nested = matches!(direction, Direction::YamlToXml)
                    && route.yaml_dir.is_some()
                    && route.yaml_file.is_some();
                let name = if nested {
                    if !file_type.is_dir() {
                        continue;
                    }
                    let name = item
                        .file_name()
                        .into_string()
                        .ok()
                        .filter(|name| single_segment(name))
                        .ok_or_else(|| invalid("External fact owner directory is invalid"))?;
                    path.push(route.yaml_file.as_ref().expect("nested owner file"));
                    match fs::symlink_metadata(&path) {
                        Ok(metadata) if metadata.is_file() => {}
                        Ok(_) => continue,
                        Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
                        Err(error) => {
                            return Err(invalid(&format!(
                                "Cannot inspect external fact file: {error}"
                            )));
                        }
                    }
                    name
                } else {
                    if !file_type.is_file() {
                        continue;
                    }
                    let expected = match direction {
                        Direction::XmlToYaml => "xml",
                        Direction::YamlToXml => "yaml",
                    };
                    if path
                        .extension()
                        .is_none_or(|extension| extension != expected)
                    {
                        continue;
                    }
                    path.file_stem()
                        .and_then(|value| value.to_str())
                        .filter(|value| single_segment(value))
                        .ok_or_else(|| invalid("External fact filename is invalid"))?
                        .to_owned()
                };
                let discovery = if matches!(direction, Direction::YamlToXml) {
                    self.external_resource_source(route, context)?
                } else {
                    None
                };
                let mut snapshots = Vec::new();
                let mut loaded = BTreeSet::new();
                let mut owner_loaded = false;
                let mut load = |entry: EntryId, external: bool| {
                    if external {
                        let provider = self.external_import_provider(
                            entry,
                            &route.xml_dir,
                            context.component,
                        )?;
                        let path = external_sidecar_directory(provider, context.component)
                            .join(format!("{name}.yaml"));
                        let bytes = match direction {
                            Direction::XmlToYaml => {
                                match result.iter().find(|source| source.sidecar == path) {
                                    Some(source) => source.bytes.clone(),
                                    None => self.import_external_snapshot(
                                        root,
                                        provider,
                                        &name,
                                        context,
                                        &mut import_snapshots,
                                    )?,
                                }
                            }
                            Direction::YamlToXml => fs::read(root.join(path)).map_err(|error| {
                                invalid(&format!("Cannot read retained external snapshot: {error}"))
                            })?,
                        };
                        return Ok(vec![OwnedSnapshot {
                            name: provider.name.clone(),
                            entry: provider.entry,
                            bytes,
                        }]);
                    }
                    if owner_loaded {
                        return Ok(Vec::new());
                    }
                    let Some(directory) = route
                        .yaml_dir
                        .as_ref()
                        .filter(|_| matches!(direction, Direction::YamlToXml))
                    else {
                        return Err(invalid(
                            "External snapshot inputs require a primary YAML route",
                        ));
                    };
                    owner_loaded = true;
                    let owner_path = PathBuf::from(directory).join(match &route.yaml_file {
                        Some(file) => PathBuf::from(&name).join(file),
                        None => PathBuf::from(format!("{name}.yaml")),
                    });
                    let mut current = self
                        .load_snapshots(root, &owner_path, context.component)
                        .map_err(|error| invalid(&error))?;
                    // Fact-only registrations retain identity before a complete
                    // owner route exists. They have no owner resource discovery.
                    if self.yaml_owner_route(&owner_path).is_some() {
                        self.refresh_resource_facts(&owner_path, context, root, &mut current)?;
                    }
                    Ok(current)
                };
                for binding in route
                    .inputs
                    .iter()
                    .map(|(_, binding)| binding)
                    .chain(route.base_source.iter().map(|source| &source.key))
                {
                    binding.prepare_snapshots(
                        &name,
                        context,
                        &mut snapshots,
                        &mut loaded,
                        &mut load,
                    )?;
                }
                // Resource facts come from fresh discovery, not ordinary owner YAML.
                // Force loading even when input bindings contain no snapshot reference.
                if discovery.is_some() {
                    snapshots.extend(load(route.entry, false)?);
                }
                let borrowed: Vec<_> = snapshots.iter().map(OwnedSnapshot::borrow).collect();
                let inputs = bind(route.entry, &route.inputs, &name, context, &borrowed)?;
                if let Some(source) = &route.base_source {
                    let InputValue::Text(key) = source.key.resolve(&name, context, &borrowed)?
                    else {
                        return Err(invalid("Base source identity must be text"));
                    };
                    if key.is_empty() {
                        continue;
                    }
                    let base_root = base_root
                        .ok_or_else(|| invalid("Joined source requires a base component"))?;
                    let base_name = self.base_owner_name(
                        base_root,
                        route,
                        source,
                        &key,
                        &mut identity_indexes,
                    )?;
                    let directory = route
                        .yaml_dir
                        .as_ref()
                        .expect("checked primary base source");
                    path = base_root.join(directory).join(match &route.yaml_file {
                        Some(file) => PathBuf::from(base_name).join(file),
                        None => PathBuf::from(format!("{base_name}.yaml")),
                    });
                    if route.yaml_file.is_some() {
                        let owner = base_root.join(directory).join(base_name);
                        if !fs::symlink_metadata(owner)
                            .map_err(|error| invalid(&error.to_string()))?
                            .is_dir()
                        {
                            return Err(invalid("Joined base owner must be an ordinary directory"));
                        }
                    }
                    if !fs::symlink_metadata(&path)
                        .map_err(|error| invalid(&error.to_string()))?
                        .is_file()
                    {
                        return Err(invalid("Joined base source must be an ordinary file"));
                    }
                }
                let prepared = if let Some(source) = discovery {
                    let matches = snapshots
                        .iter()
                        .filter(|snapshot| {
                            snapshot.entry.0 == source.entry.0 && snapshot.name == source.name
                        })
                        .collect::<Vec<_>>();
                    let [snapshot] = matches.as_slice() else {
                        return Err(invalid("External resource snapshot is missing or repeated"));
                    };
                    Some(&snapshot.bytes)
                } else {
                    matches!(direction, Direction::XmlToYaml)
                        .then(|| {
                            import_snapshots
                                .ready
                                .get(&sidecar_dir.join(format!("{name}.yaml")))
                        })
                        .flatten()
                };
                let bytes = match prepared {
                    Some(bytes) => bytes.clone(),
                    None => {
                        let bytes = fs::read(&path).map_err(|error| {
                            invalid(&format!("Cannot read external fact file: {error}"))
                        })?;
                        match direction {
                            Direction::XmlToYaml => {
                                snapshot_fact_source(route.entry, &bytes, &inputs)?
                            }
                            Direction::YamlToXml if route.yaml_dir.is_some() => {
                                materialize_fact_source(route.entry, &bytes, &inputs)?
                            }
                            Direction::YamlToXml => bytes,
                        }
                    }
                };
                result.push(ExternalFact {
                    entry: route.entry,
                    bytes,
                    inputs,
                    sidecar: sidecar_dir.join(format!("{name}.yaml")),
                });
            }
        }
        result.sort_by(|left, right| left.sidecar.cmp(&right.sidecar));
        Ok(result)
    }

    pub fn save_external_sources(
        &self,
        root: &Path,
        context: &Context<'_>,
        sources: &[ExternalFact],
    ) -> Result<(), String> {
        let prefix = PathBuf::from(".nkdk/facts")
            .join(context.component)
            .join("external");
        for source in sources {
            if !source.sidecar.starts_with(&prefix) {
                return Err("External fact sidecar is outside the component".into());
            }
            let output = root.join(&source.sidecar);
            fs::create_dir_all(output.parent().expect("external sidecar directory"))
                .map_err(|error| error.to_string())?;
            publication::publish(&output, &source.bytes)?;
        }
        Ok(())
    }

    pub fn resolve<'a>(
        &self,
        relative_path: &Path,
        direction: Direction,
        material: Material<'a>,
        context: &Context<'_>,
    ) -> Result<Option<Resolved<'a>>, RuntimeDiagnostic> {
        self.resolve_with_snapshots(relative_path, direction, material, context, &[])
    }

    pub fn resolve_with_snapshots<'a>(
        &self,
        relative_path: &Path,
        direction: Direction,
        material: Material<'a>,
        context: &Context<'_>,
        snapshots: &[Snapshot<'_>],
    ) -> Result<Option<Resolved<'a>>, RuntimeDiagnostic> {
        let snapshots = match (&material, snapshots.is_empty()) {
            (Material::Yaml { snapshots, .. }, true) => *snapshots,
            _ => snapshots,
        };
        if !matches!(
            (&material, direction),
            (Material::Xml(_), Direction::XmlToYaml)
                | (Material::Yaml { .. }, Direction::YamlToXml)
        ) {
            return Err(invalid("Operation material does not match direction"));
        }
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
        let Some((route, name)) = self.routes.iter().find_map(|route| {
            route
                .name_for(relative_path, direction)
                .map(|name| (route, name))
        }) else {
            return Ok(None);
        };
        let selected = route
            .owners
            .get(context.component)
            .ok_or_else(|| invalid("No owner profile for component"))?
            .resolve(&name, context, snapshots)?;
        let InputValue::Text(selected) = selected else {
            return Err(invalid("Owner selection must return a declaration name"));
        };
        let owner = entry(&selected)?;
        let validation = route
            .validators
            .get(context.component)
            .map(|binding| {
                let InputValue::Text(selected) = binding.resolve(&name, context, snapshots)? else {
                    return Err(invalid(
                        "Validator selection must return a declaration name",
                    ));
                };
                let entry = entry(&selected)?;
                Ok::<_, RuntimeDiagnostic>(Validation {
                    entry,
                    inputs: bind(
                        entry,
                        route.validation_inputs.as_ref().unwrap_or(&route.inputs),
                        &name,
                        context,
                        snapshots,
                    )?,
                })
            })
            .transpose()?;
        let mut sources = Vec::with_capacity(route.sources.len() + 1);
        let mut source_materials = Vec::with_capacity(route.sources.len());
        for source in &route.sources {
            if !(if matches!(direction, Direction::XmlToYaml) {
                source.fact_on_import
            } else {
                source.fact_on_export
            }) {
                continue;
            }
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
                Material::Yaml { owner, .. } if source.yaml_primary => {
                    (*owner, Direction::YamlToXml)
                }
                Material::Yaml {
                    snapshots,
                    new_owner,
                    ..
                } => {
                    let matches: Vec<_> = snapshots
                        .iter()
                        .filter(|item| item.entry.0 == source.entry.0)
                        .collect();
                    if matches.is_empty()
                        && *new_owner
                        && !matches!(source.new_owner, NewOwnerPolicy::Materialize)
                    {
                        continue;
                    }
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
                inputs: bind(source.entry, &source.inputs, &name, context, snapshots)?,
            });
            source_materials.push(
                if matches!(material, Material::Yaml { .. }) && source.yaml_primary {
                    SourceMaterial::Primary
                } else if source.observe_attributes {
                    SourceMaterial::AttributeSnapshot(source.name.clone())
                } else {
                    SourceMaterial::Snapshot(source.name.clone())
                },
            );
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
            inputs: bind(owner, &route.inputs, &name, context, snapshots)?,
        });
        let xml_resources = PathBuf::from(&route.xml_dir).join(&name);
        let yaml_resources = PathBuf::from(&route.yaml_dir).join(&name);
        let (source_resources, target_resources) = match direction {
            Direction::XmlToYaml => (xml_resources, yaml_resources),
            Direction::YamlToXml => (yaml_resources, xml_resources),
        };
        Ok(Some(Resolved {
            validation,
            sources,
            source_materials,
            owner_source_index,
            owner_facts: route.owner_facts,
            target_path: route.target_path(&name, direction),
            source_resources,
            target_resources,
        }))
    }

    pub fn capture(
        &self,
        relative_path: &Path,
        xml: &[u8],
        context: &Context<'_>,
    ) -> Result<Option<Vec<OwnedSnapshot>>, RuntimeDiagnostic> {
        self.capture_with_resources(relative_path, xml, context, None)
    }

    fn yaml_owner_route(&self, relative_path: &Path) -> Option<(&Route, String)> {
        self.routes.iter().find_map(|route| {
            route
                .name_for(relative_path, Direction::YamlToXml)
                .map(|name| (route, name))
        })
    }

    /// Rebuild filesystem-derived facts from the current YAML resources.
    /// Identity and other retained import facts are left intact.
    pub fn refresh_resource_facts(
        &self,
        relative_path: &Path,
        context: &Context<'_>,
        source_root: &Path,
        snapshots: &mut [OwnedSnapshot],
    ) -> Result<(), RuntimeDiagnostic> {
        let (route, name) = self
            .yaml_owner_route(relative_path)
            .ok_or_else(|| invalid("No route for resource fact refresh"))?;
        if !route.owners.contains_key(context.component) {
            return Err(invalid("No owner profile for component"));
        }
        let root = source_root.join(&route.yaml_dir).join(name);
        let mut updates = Vec::new();
        for source in &route.sources {
            if !source.discovers_resources() {
                continue;
            }
            if !source.only.is_empty() && !source.only.iter().any(|kind| kind == context.component)
            {
                continue;
            }
            let position = snapshots
                .iter()
                .position(|snapshot| {
                    snapshot.name == source.name && snapshot.entry.0 == source.entry.0
                })
                .ok_or_else(|| invalid("Resource fact snapshot is missing"))?;
            updates.push((
                position,
                source
                    .resource_snapshot(
                        Some(&root),
                        Direction::YamlToXml,
                        Some(&snapshots[position].bytes),
                    )?
                    .expect("discovery is declared"),
            ));
        }
        // Publish only once all declared resource discoveries succeed.
        for (position, bytes) in updates {
            snapshots[position].bytes = bytes;
        }
        Ok(())
    }

    pub fn capture_with_resources(
        &self,
        relative_path: &Path,
        xml: &[u8],
        context: &Context<'_>,
        resource_root: Option<&Path>,
    ) -> Result<Option<Vec<OwnedSnapshot>>, RuntimeDiagnostic> {
        let Some((route, name)) = self.routes.iter().find_map(|route| {
            route
                .name_for(relative_path, Direction::XmlToYaml)
                .map(|name| (route, name))
        }) else {
            return Ok(None);
        };
        if !route.owners.contains_key(context.component) {
            return Err(invalid("No owner profile for component"));
        }
        let mut snapshots = Vec::with_capacity(route.sources.len());
        for source in &route.sources {
            if !source.only.is_empty() && !source.only.iter().any(|kind| kind == context.component)
            {
                continue;
            }
            let borrowed = snapshots
                .iter()
                .map(OwnedSnapshot::borrow)
                .collect::<Vec<_>>();
            let resource_bytes = match (source.resource_file.as_ref(), resource_root) {
                (Some(relative), Some(root)) => match fs::read(root.join(relative)) {
                    Ok(bytes) => Some(bytes),
                    Err(error) if error.kind() == std::io::ErrorKind::NotFound => None,
                    Err(error) => {
                        return Err(invalid(&format!("Cannot read resource fact: {error}")));
                    }
                },
                _ => None,
            };
            let bytes = if source.observe_attributes {
                if source.resource_file.is_some() && resource_bytes.is_none() {
                    return Err(invalid(
                        "Declared attribute observation resource is missing",
                    ));
                }
                snapshot_attribute_source(
                    source.entry,
                    nkdk_conversion_core::xml::DocumentSource(
                        resource_bytes.as_deref().unwrap_or(xml),
                    ),
                    OBSERVATION_DEPTH,
                    Default::default(),
                )?
            } else if let Some(bytes) =
                source.resource_snapshot(resource_root, Direction::XmlToYaml, None)?
            {
                bytes
            } else if source.resource_file.is_some() && resource_bytes.is_none() {
                let default = source
                    .missing_resource
                    .as_ref()
                    .ok_or_else(|| invalid("Declared resource fact source is missing"))?;
                render_yaml(default)
                    .map_err(|_| invalid("Cannot render missing resource fact"))?
                    .into_bytes()
            } else {
                let inputs = bind(source.entry, &source.inputs, &name, context, &borrowed)?;
                match snapshot_fact_source(
                    source.entry,
                    resource_bytes.as_deref().unwrap_or(xml),
                    &inputs,
                ) {
                    Ok(bytes) => bytes,
                    Err(error) if error.code.as_deref() == Some("fact.snapshot") => {
                        let converted = convert_file(
                            source.entry,
                            Direction::XmlToYaml,
                            resource_bytes.as_deref().unwrap_or(xml),
                            &inputs,
                        )
                        .map_err(|errors| {
                            errors.into_iter().next().unwrap_or_else(|| {
                                invalid("Fact source conversion produced no diagnostic")
                            })
                        })?;
                        nkdk_conversion_core::raw::Document::decode(&converted.bytes)?
                            .map_or(converted.bytes, |document| document.meaning)
                    }
                    Err(error) => return Err(error),
                }
            };
            snapshots.push(OwnedSnapshot {
                name: source.name.clone(),
                entry: source.entry,
                bytes,
            });
        }
        Ok(Some(snapshots))
    }

    fn render_creation_template(
        &self,
        template: &Yaml,
        prior: &[OwnedSnapshot],
        base_root: Option<&Path>,
        relative_path: &Path,
    ) -> Result<Option<Yaml>, RuntimeDiagnostic> {
        if let Some(inner) = optional_template(template) {
            return self.render_creation_template(inner, prior, base_root, relative_path);
        }
        match template {
            Yaml::Hash(fields) if fields.len() == 1 && !template["snapshot"].is_badvalue() => {
                let (entry, field) = template_reference(&template["snapshot"], "field")?;
                let snapshot = prior
                    .iter()
                    .find(|snapshot| snapshot.name == entry)
                    .ok_or_else(|| invalid("Creation template references an unavailable source"))?;
                snapshot_field(snapshot, &field).map(Some)
            }
            Yaml::Hash(fields)
                if fields.len() == 1 && !template["externalSnapshot"].is_badvalue() =>
            {
                let reference = &template["externalSnapshot"];
                let (entry, field) = template_reference(reference, "field")?;
                let component = required(reference, "component")?;
                let Some(base_root) = base_root else {
                    return Ok(None);
                };
                if !base_root.join(relative_path).is_file() {
                    return Ok(None);
                }
                let snapshots = self
                    .load_snapshots(base_root, relative_path, component)
                    .map_err(|error| invalid(&error))?;
                let snapshot = snapshots
                    .iter()
                    .find(|snapshot| snapshot.name == entry)
                    .ok_or_else(|| invalid("External fact snapshot source is missing"))?;
                snapshot_field(snapshot, &field).map(Some)
            }
            Yaml::Hash(fields) => {
                let mut output = Hash::new();
                for (key, value) in fields {
                    let Some(rendered) =
                        self.render_creation_template(value, prior, base_root, relative_path)?
                    else {
                        if optional_template(value).is_some() {
                            continue;
                        }
                        return Ok(None);
                    };
                    output.insert(key.clone(), rendered);
                }
                Ok(Some(Yaml::Hash(output)))
            }
            Yaml::Array(items) => {
                let mut output = Vec::with_capacity(items.len());
                for item in items {
                    let Some(rendered) =
                        self.render_creation_template(item, prior, base_root, relative_path)?
                    else {
                        return Ok(None);
                    };
                    output.push(rendered);
                }
                Ok(Some(Yaml::Array(output)))
            }
            _ => Ok(Some(template.clone())),
        }
    }

    /// Materialize every declared fact source before publishing a new owner.
    /// UUIDs are emitted by the source declarations, not by this router.
    pub fn materialize_sources(
        &self,
        relative_path: &Path,
        context: &Context<'_>,
        identity_seed: &str,
        base_root: Option<&Path>,
    ) -> Result<Vec<OwnedSnapshot>, RuntimeDiagnostic> {
        let (route, name) = self
            .yaml_owner_route(relative_path)
            .ok_or_else(|| invalid("New owner has no declared route"))?;
        if !route.owners.contains_key(context.component) {
            return Err(invalid("New owner has no profile for component"));
        }
        let mut snapshots = Vec::new();
        for source in route.sources.iter().filter(|source| {
            source.only.is_empty()
                || source
                    .only
                    .iter()
                    .any(|component| component == context.component)
        }) {
            if source.observe_attributes {
                if matches!(source.new_owner, NewOwnerPolicy::Omit) {
                    continue;
                }
                snapshots.push(OwnedSnapshot {
                    name: source.name.clone(),
                    entry: source.entry,
                    bytes: empty_attribute_snapshot(source.entry, Default::default())?,
                });
                continue;
            }
            let source_yaml = match &source.new_owner {
                NewOwnerPolicy::Materialize => Yaml::Hash(Hash::new()),
                NewOwnerPolicy::Omit => continue,
                NewOwnerPolicy::Template(template) => {
                    let Some(rendered) = self.render_creation_template(
                        template,
                        &snapshots,
                        base_root,
                        relative_path,
                    )?
                    else {
                        continue;
                    };
                    rendered
                }
            };
            let source_text = render_yaml(&source_yaml)
                .map_err(|_| invalid("Cannot render creation template"))?;
            let borrowed = snapshots
                .iter()
                .map(OwnedSnapshot::borrow)
                .collect::<Vec<_>>();
            let mut values = source
                .inputs
                .iter()
                .map(|(input, binding)| {
                    binding
                        .resolve(&name, context, &borrowed)
                        .map(|value| (input.clone(), value))
                })
                .collect::<Result<Vec<_>, _>>()?;
            if input_names(source.entry).contains(&"identitySeed") {
                values.push((
                    "identitySeed".into(),
                    InputValue::Text(identity_seed.into()),
                ));
            }
            let inputs = prepare_inputs(source.entry, values)?;
            let bytes = materialize_fact_source(source.entry, source_text.as_bytes(), &inputs)
                .map_err(|mut error| {
                    error.message = format!("Fact source {}: {}", source.name, error.message);
                    error
                })?;
            snapshots.push(OwnedSnapshot {
                name: source.name.clone(),
                entry: source.entry,
                bytes,
            });
        }
        Ok(snapshots)
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
                if matches!(direction, Direction::YamlToXml)
                    && let Some(file) = &route.yaml_file
                {
                    if entry
                        .file_type()
                        .map_err(|error| error.to_string())?
                        .is_dir()
                        && entry.path().join(file).is_file()
                    {
                        paths.push(PathBuf::from(directory).join(entry.file_name()).join(file));
                    }
                    continue;
                }
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
        if yaml_relative_path
            .extension()
            .is_none_or(|extension| extension != "yaml")
        {
            return Err(invalid("Snapshot owner must be a YAML file"));
        }
        if !single_segment(component) {
            return Err(invalid("Invalid snapshot component"));
        }
        let operation = self.routes.iter().find(|route| {
            route
                .name_for(yaml_relative_path, Direction::YamlToXml)
                .is_some()
        });
        if let Some(route) = operation {
            if !route.owners.contains_key(component) {
                return Err(invalid("Invalid snapshot component"));
            }
        } else if !self.external.iter().any(|route| {
            route.fact_on_export
                && (route.only.is_empty() || route.only.iter().any(|value| value == component))
                && route.yaml_dir.as_ref().is_some_and(|directory| {
                    owner_name_for(yaml_relative_path, directory, route.yaml_file.as_deref())
                        .is_some()
                })
        }) {
            return Ok(None);
        }
        Ok(Some(
            PathBuf::from(".nkdk/facts")
                .join(component)
                .join(yaml_relative_path),
        ))
    }

    fn owners_path(&self, component: &str) -> Result<PathBuf, String> {
        if !single_segment(component) {
            return Err("Invalid snapshot component".into());
        }
        Ok(PathBuf::from(".nkdk/facts")
            .join(component)
            .join("owners.yaml"))
    }

    pub fn save_imported_owners(
        &self,
        project_root: &Path,
        component: &str,
        owners: &[PathBuf],
    ) -> Result<(), String> {
        let mut paths = BTreeSet::new();
        for owner in owners {
            if self
                .sidecar_path(owner, component)
                .map_err(|error| format!("{error:?}"))?
                .is_none()
            {
                return Err("No operation route for imported owner".into());
            }
            paths.insert(
                owner
                    .to_str()
                    .ok_or("Imported owner path is not UTF-8")?
                    .to_owned(),
            );
        }
        let mut document = Hash::new();
        document.insert(
            Yaml::String("format".into()),
            Yaml::String("nkdk-fact-owners/1".into()),
        );
        document.insert(
            Yaml::String("owners".into()),
            Yaml::Array(paths.into_iter().map(Yaml::String).collect()),
        );
        let encoded = render_yaml(&Yaml::Hash(document))?;
        let output = project_root.join(self.owners_path(component)?);
        fs::create_dir_all(output.parent().expect("owner manifest has a directory"))
            .map_err(|error| error.to_string())?;
        publication::publish(&output, encoded.as_bytes())
    }

    pub fn load_imported_owners(
        &self,
        project_root: &Path,
        component: &str,
    ) -> Result<Option<BTreeSet<String>>, String> {
        let manifest = project_root.join(self.owners_path(component)?);
        let bytes = match fs::read(manifest) {
            Ok(bytes) => bytes,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(error) => return Err(error.to_string()),
        };
        let text =
            std::str::from_utf8(&bytes).map_err(|_| "Imported owner manifest is not UTF-8")?;
        let documents = YamlLoader::load_from_str(text).map_err(|error| error.to_string())?;
        let [document] = documents.as_slice() else {
            return Err("Expected one imported owner manifest".into());
        };
        if required(document, "format").map_err(|error| format!("{error:?}"))?
            != "nkdk-fact-owners/1"
        {
            return Err("Unsupported imported owner manifest".into());
        }
        let owners = document["owners"]
            .as_vec()
            .ok_or("Imported owner manifest must contain a list")?;
        let mut unique = BTreeSet::new();
        for owner in owners {
            let owner = owner.as_str().ok_or("Imported owner path must be text")?;
            if self
                .sidecar_path(Path::new(owner), component)
                .map_err(|error| format!("{error:?}"))?
                .is_none()
            {
                return Err("Imported owner has no declared route".into());
            }
            if !unique.insert(owner.to_owned()) {
                return Err("Repeated imported owner path".into());
            }
        }
        Ok(Some(unique))
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
            .ok_or("No registered primary route for snapshot owner")?;
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
            .ok_or("No registered primary route for snapshot owner")?;
        let bytes = fs::read(project_root.join(sidecar)).map_err(|error| error.to_string())?;
        decode_snapshots(&bytes).map_err(|error| format!("{error:?}"))
    }
}

fn route_conflicts(routes: &[Route], route: &Route) -> bool {
    routes
        .iter()
        .any(|other| other.xml_dir == route.xml_dir || other.yaml_dir == route.yaml_dir)
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
    let encoded = render_yaml(&Yaml::Hash(document))
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
    snapshots: &[Snapshot<'_>],
) -> Result<nkdk_compiled_rules::PreparedInputs, RuntimeDiagnostic> {
    let values = bindings
        .iter()
        .map(|(input, binding)| {
            binding
                .resolve(name, context, snapshots)
                .map(|value| (input.clone(), value))
        })
        .collect::<Result<Vec<_>, _>>()?;
    prepare_inputs(entry, values)
}

impl Binding {
    fn prepare_snapshots(
        &self,
        name: &str,
        context: &Context<'_>,
        snapshots: &mut Vec<OwnedSnapshot>,
        loaded: &mut BTreeSet<(u32, bool)>,
        load: &mut impl FnMut(EntryId, bool) -> Result<Vec<OwnedSnapshot>, RuntimeDiagnostic>,
    ) -> Result<(), RuntimeDiagnostic> {
        match self {
            Self::Snapshot {
                entry, external, ..
            } => {
                if loaded.insert((entry.0, *external)) {
                    snapshots.extend(load(*entry, *external)?);
                }
            }
            Self::Context(_) | Self::Literal(_) => {}
            Self::Concat(parts) => {
                for part in parts {
                    part.prepare_snapshots(name, context, snapshots, loaded, load)?;
                }
            }
            Self::ByComponent(cases) => cases
                .get(context.component)
                .ok_or_else(|| invalid("No operation input profile for component"))?
                .prepare_snapshots(name, context, snapshots, loaded, load)?,
            Self::Select { on, cases } => {
                on.prepare_snapshots(name, context, snapshots, loaded, load)?;
                let borrowed: Vec<_> = snapshots.iter().map(OwnedSnapshot::borrow).collect();
                let InputValue::Text(value) = on.resolve(name, context, &borrowed)? else {
                    return Err(invalid("Selection input must be text"));
                };
                cases
                    .get(&value)
                    .ok_or_else(|| invalid("Unknown operation input selection"))?
                    .prepare_snapshots(name, context, snapshots, loaded, load)?;
            }
        }
        Ok(())
    }

    fn resolve(
        &self,
        name: &str,
        context: &Context<'_>,
        snapshots: &[Snapshot<'_>],
    ) -> Result<InputValue, RuntimeDiagnostic> {
        match self {
            Self::Context(binding) => Ok(binding.resolve(name, context)),
            Self::Snapshot {
                entry,
                external: _,
                field,
                each,
                default,
            } => {
                let mut matches = snapshots
                    .iter()
                    .filter(|snapshot| snapshot.entry.0 == entry.0);
                let snapshot = matches
                    .next()
                    .ok_or_else(|| invalid("Operation input snapshot is missing"))?;
                if matches.next().is_some() {
                    return Err(invalid("Operation input snapshot is repeated"));
                }
                match snapshot_value(snapshot.bytes, field)? {
                    Some(Yaml::Array(rows)) if let Some(field) = each => rows
                        .iter()
                        .map(|row| match &row[field.as_str()] {
                            Yaml::String(value) => Ok(InputValue::Text(value.clone())),
                            _ => Err(invalid("Projected snapshot row field must be text")),
                        })
                        .collect::<Result<Vec<_>, _>>()
                        .map(InputValue::Sequence),
                    Some(_) if each.is_some() => {
                        Err(invalid("Projected snapshot field must be a sequence"))
                    }
                    Some(value) => literal(&value),
                    None => default
                        .clone()
                        .ok_or_else(|| invalid("Operation input snapshot field is missing")),
                }
            }
            Self::Literal(value) => Ok(value.clone()),
            Self::Concat(parts) => {
                let mut text = String::new();
                for part in parts {
                    let InputValue::Text(value) = part.resolve(name, context, snapshots)? else {
                        return Err(invalid("Concatenated operation input must be text"));
                    };
                    text.push_str(&value);
                }
                Ok(InputValue::Text(text))
            }
            Self::Select { on, cases } => {
                let InputValue::Text(value) = on.resolve(name, context, snapshots)? else {
                    return Err(invalid("Selection input must be text"));
                };
                cases
                    .get(&value)
                    .ok_or_else(|| invalid("Selection has no matching case"))?
                    .resolve(name, context, snapshots)
            }
            Self::ByComponent(cases) => cases
                .get(context.component)
                .ok_or_else(|| invalid("Operation input has no component case"))?
                .resolve(name, context, snapshots),
        }
    }
}

include!(concat!(env!("OUT_DIR"), "/operation_routes.rs"));

pub fn catalog() -> &'static Catalog {
    static CATALOG: OnceLock<Catalog> = OnceLock::new();
    CATALOG.get_or_init(|| {
        Catalog::parse_sources(OPERATION_ROUTES).expect("checked operation route declarations")
    })
}
