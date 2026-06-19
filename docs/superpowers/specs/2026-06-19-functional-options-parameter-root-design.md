# FunctionalOptionsParameter Root Design

## Problem

`round-trip-yaml-fast` showed XML diffs where subsystem content references changed from:

```text
FunctionalOptionsParameter.<name>
```

to:

```text
FunctionalOptionParameter.<name>
```

The singular `FunctionalOptionParameter` root was introduced by mistake. The project metadata item is
`MetadataFunctionalOptionsParameter`, its XML container is `FunctionalOptionsParameter`, and its XML directory is
`FunctionalOptionsParameters`.

## Scope

Fix only the metadata target root typo in project code. Do not change XML fixtures, YAML key names, metadata item rules,
or external file handling.

## Design

Use `FunctionalOptionsParameter` as the only canonical metadata root for functional options parameters.

Remove `FunctionalOptionParameter` from runtime root registries and allowed subsystem content paths:

- `packages/core/metadata/commonObjects/metadataTargets/types.ts`
- `packages/core/metadata/commonObjects/metadataTargets/roots.ts`
- `packages/core/metadata/commonObjects/metadataPath/types.ts`
- `packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts`

Keep the Russian YAML root unchanged:

```text
ПараметрФункциональныхОпций
```

That YAML root must parse to canonical model strings with `FunctionalOptionsParameter`, and formatting
`FunctionalOptionsParameter.<name>` must still produce the same Russian YAML root.

## Tests

Update focused tests so they prove both directions:

- `metadataTargets/parse.test.ts`: `ПараметрФункциональныхОпций.<name>` parses to
  `FunctionalOptionsParameter.<name>`.
- `metadataSubsystem/metadataTarget.test.ts`: subsystem `Состав` imports YAML links as
  `FunctionalOptionsParameter.<name>` and exports the same root back to YAML.

Verification commands:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
NKDK_XML_REPO=/home/nikita/git/round-trip/acc NKDK_XML_DIR=/home/nikita/git/round-trip/acc ./.agents/skills/round-trip-yaml-fast/round-trip.sh
pnpm test
```

The `acc` fast round-trip should no longer report a `FunctionalOptionsParameter` to `FunctionalOptionParameter` diff.

## Out Of Scope

- Preserving `FunctionalOptionParameter` as a compatibility alias.
- Changing YAML Russian names.
- Changing metadata item implementation for `MetadataFunctionalOptionsParameter`.
- Fixing unrelated errors such as external data source table parsing.
