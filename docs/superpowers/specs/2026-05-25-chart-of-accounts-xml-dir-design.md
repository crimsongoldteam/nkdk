# ChartOfAccounts XML Directory Design

## Context

`Configuration.xml` contains child object entries named `ChartOfAccounts`, for example:
`<ChartOfAccounts>Хозрасчетный</ChartOfAccounts>`.

The XML dump stores the corresponding files under `ChartsOfAccounts/`, for example:
`/Users/nikita/git/round-trip-source/acc/ChartsOfAccounts/Хозрасчетный.xml`.

Current `MetadataChartOfAccountsRules` uses `xmlDir: "ChartOfAccounts"`, so configuration import and sync look in a non-existing directory. As a result, no YAML directory `ПланСчетов/Хозрасчетный` is produced, and generated `ChildObjects` drops the `ChartOfAccounts` entry.

## Decision

Change only `MetadataChartOfAccountsRules.xmlDir` from `ChartOfAccounts` to `ChartsOfAccounts`.

Keep these values unchanged:

- XML root container: `ChartOfAccounts`
- Configuration child object tag order: `ChartOfAccounts`
- YAML prefix: `ПланСчетов`

## Rationale

The XML directory name and the XML metadata object tag are different concepts. In the dump, the directory is plural (`ChartsOfAccounts`), while XML object tags and references remain singular (`ChartOfAccounts`).

## Tests

Add or update coverage so configuration top-level rules expect:

- `MetadataChartOfAccounts`
- `xmlDir: "ChartsOfAccounts"`

Run core tests and then repeat `round-trip-yaml` against `/Users/nikita/git/round-trip-source` to confirm `ChartOfAccounts` no longer appears as a removed child object in `Configuration.xml`.
