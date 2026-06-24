# Root ext Lowercase Design

> Superseded on 2026-06-02: root configuration external XML files use canonical `Ext/...`.
> Lowercase root `ext/...` is legacy and should not be used for new import/export behavior.

## Context

Full YAML round-trip for `/home/nikita/git/round-trip/all` deletes root configuration files under `all/ext/*`.
The current configuration rules point to `Ext/...`, while the XML reference uses lowercase `ext/...`.
On Linux these are different directories, so import does not see the source files and sync later cannot restore them.

## Decision

Use lowercase `ext` as the canonical XML directory for root configuration external files.
Update `MetadataConfigurationRules` paths from `Ext/...` to `ext/...`.

This applies only to root configuration files, for example:

- root modules such as `ext/ManagedApplicationModule.bsl`
- root help files such as `ext/Help.xml` and `ext/Help/ru.html`
- root command interfaces
- client application interface
- home page work area
- root external pictures and binary files configured through the same rule set

## Scope

In scope:

- Import root external files from `ext/...` into YAML or YAML-side files.
- Sync YAML back to XML using `ext/...`.
- Add focused tests for both import and sync paths.

Out of scope:

- `Sequences/ПоследовательностьВсеПоля/Ext/AdditionalIndexes.xml`
- CRLF to LF normalization
- Form XML semantic diffs
- Supporting both `Ext` and `ext` as canonical output paths

## Data Flow

Import:

`all/ext/...` -> `readConfigurationFromXML` and root external sync -> `Конфигурация.yaml` or root YAML-side files.

Sync:

`Конфигурация.yaml` and root YAML-side files -> `syncConfigurationToXML` -> `out/ext/...`.

## Testing

Add or update tests so they use lowercase `ext` in configuration XML fixtures:

- `syncConfigurationFromXML` imports root `ext/*` files.
- `syncConfigurationToXML` writes root external files to `ext/*`.
- The output must not create `Ext/*` for these root files.

## Risks

Older tests or fixtures that still use `Ext` for root configuration files will need to be updated.
This is intentional because the agreed canonical path is lowercase `ext`.
