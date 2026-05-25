# Configuration YAML

## Context

The root `Configuration.xml` is currently outside the regular top-level metadata walker. Existing sync code processes objects from `TopLevelMetadataItemRules`, while the root configuration file contains global properties and the `ChildObjects` index for top-level metadata objects.

Sources checked:

- `/Users/nikita/git/roundTripElements/Configuration.xml` - full reference with many object types.
- `/Users/nikita/git/clean_cf/Configuration.xml` - empty configuration reference.
- `packages/core/tests/fixtures/configuration/full.xml` and `minimal.xml` - local fixtures.
- `/Users/nikita/git/nakidka-help-parser/exampleData/FileStorage/objects/catalog63/catalog272/ConfigurationMetadataObject.html` and `ConfigurationMetadataObject/properties/__categories__` - help-derived property list and order.
- `/Users/nikita/git/nakidka-help-parser/exampleData/FileStorage/objects/Global context/properties/__categories__` - secondary source for platform collection order.

## Decision

Add a root `Конфигурация.yaml` file for editable configuration properties. Do not store `ChildObjects` in YAML. Instead, build `ChildObjects` from the YAML object directories during XML export.

This keeps the project shape consistent: users edit root properties in one file and edit metadata objects in their own folders. The XML index remains derived from the actual project contents, so it cannot drift from the YAML tree.

## XML And YAML Shape

`XML -> YAML`:

- Read root `Configuration.xml`.
- Import supported properties from `<Configuration><Properties>`.
- Write them to `Конфигурация.yaml` at the YAML project root.
- Ignore `<ChildObjects>` for YAML output.

`YAML -> XML`:

- Read `Конфигурация.yaml` when present.
- Use reference `Configuration.xml` to preserve technical root attributes, `InternalInfo`, unknown fields, and values not yet represented in rules.
- Export supported properties through the same property orchestration style used by metadata items.
- Rebuild `<ChildObjects>` from YAML object folders.

## Sources For Rules

The primary source for property names and order is the extracted help file:

`/Users/nikita/git/nakidka-help-parser/exampleData/FileStorage/objects/catalog63/catalog272/ConfigurationMetadataObject/properties/__categories__`

Individual `.html`/`.st` files under the same directory provide Russian names, English names, type hints, and descriptions. For example, `Name6247.html` describes `Имя (Name)`, and `Name6247.st` contains the localized label.

XML fixtures remain the source of truth for XML tags, defaults, and round-trip behavior. When help and XML differ, XML wins for tags and emitted values.

## ChildObjects Ordering

`ChildObjects` is computed, not user-authored.

Ordering rules:

1. Existing objects that are present in reference `Configuration.xml` keep the exact reference order.
2. Objects missing from YAML are omitted.
3. New objects not present in the reference are appended inside their metadata type group and sorted by name.
4. Type group order comes from `ConfigurationMetadataObject/properties/__categories__` for collection properties such as `Languages`, `Subsystems`, `Catalogs`, `Documents`, `Enums`, and so on.
5. If a supported type is absent from the help-derived order, fall back to the current `TopLevelMetadataItemRules` order and mark that in a focused test.

Only supported YAML object types are included. Help lists additional platform collections that the current code may not support yet, such as `CommonModules`, `XDTOPackages`, `ExternalDataSources`, and `WebSocketClients`; those should not appear unless they have a corresponding rule and YAML directory.

## Components

Add a small root configuration module under `packages/core/metadata/appliedObjects/configuration/`:

- `rules.ts` or equivalent rule definition for root configuration properties.
- `types.ts` for root configuration model and YAML shape.
- `readConfigurationFromXML` / `writeConfigurationToYAML` helpers for `XML -> YAML`.
- `readConfigurationFromYAML` / `writeConfigurationToXML` helpers for `YAML -> XML`.
- `childObjectsOrder.ts` for deriving and testing the `ChildObjects` order.

Integrate the helpers into:

- `syncConfigurationFromXML` before walking object directories.
- `syncConfigurationToXML` before pruning XML output.
- `shortRoundTripXML` so root `Configuration.xml` participates in XML round-trip checks.

## Error Handling

If `Configuration.xml` is missing during `XML -> YAML`, skip root configuration output and keep existing object sync behavior.

If `Конфигурация.yaml` is missing during `YAML -> XML`, preserve or copy reference `Configuration.xml` when a reference exists, then rebuild `ChildObjects` if object folders are present.

If `Конфигурация.yaml` contains an unsupported property, use the existing YAML validation path where possible. Unknown XML properties in the reference should be preserved until explicit rules are added.

## Testing

Add focused tests for:

- `Configuration.xml -> Конфигурация.yaml` for minimal and full fixtures.
- `Конфигурация.yaml + YAML object folders -> Configuration.xml`.
- `ChildObjects` preserves reference order for existing objects.
- New objects are appended inside their type group and sorted by name.
- Unsupported platform types from help are not emitted unless they are supported by current rules.
- `shortRoundTripXML` includes root `Configuration.xml`.

Run targeted tests first, then the project test command required by the repository instructions before closing the issue.

## Open Implementation Notes

The implementation should start with XML round-trip. YAML behavioral annotations and YAML-specific defaults should be added only after XML round-trip is green, following the metadata knowledge rules.

Do not add manual converters unless the existing rule system cannot represent a field. If a custom converter is needed for list-like values such as `UsePurposes` or mobile functionality lists, keep it at the property type boundary and cover it with focused tests.
