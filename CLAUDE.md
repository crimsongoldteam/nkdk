# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension (`nkdk`) for editing 1C:Enterprise configurations in YAML format. It parses 1C XML configurations, converts them to YAML (and a custom `.nkdk` DSL for forms), allows editing, then syncs back to XML. The 1C Enterprise runtime renders form previews via a companion 1C processing module (`enterprise/` folder).

## Monorepo Structure

Managed with **pnpm workspaces**. Four packages:

- **`packages/core`** (`@nakidka/core`) — Core library: metadata parsing, XML↔YAML↔NKDK conversion, all business logic. No build step — consumed directly as TypeScript via `"main": "./index.ts"`.
- **`packages/extension`** (`nkdk`) — VS Code extension. Depends on `@nakidka/core` and `nkdk-language`. Built via `esbuild` + `tsc`.
- **`packages/language`** (`nkdk-language`) — Langium grammar for the `.nkdk` DSL. Must be built before `extension` can build.
- **`packages/cli`** (`@nakidka/cli`) — CLI tool for batch XML processing.

## Commands

All commands run from the **repo root** using pnpm:

```bash
# Install dependencies
pnpm install

# Run tests (core package)
cd packages/core && pnpm test
# or from root:
pnpm --filter @nakidka/core test

# Run a single test file
cd packages/core && pnpm vitest run path/to/file.test.ts

# Run tests in watch mode
cd packages/core && pnpm test:ui

# Type-check core
cd packages/core && pnpm type-check

# Build the language package (required before building extension)
pnpm --filter nkdk-language run build

# Build the extension
pnpm --filter nkdk run build

# Package extension as .vsix
pnpm --filter nkdk run package
```

## Core Architecture: The Registry Pattern

The central architectural concept in `packages/core` is a **double registry system** for property types and metadata item types.

### `PropertyTypeRegistry` ([packages/core/metadata/orchestration/property/registry.ts](packages/core/metadata/orchestration/property/registry.ts))

Maps a named type (e.g. `"Color"`, `"TypeDescription"`, `"Filter"`) to its three representations:
- `item` — internal TypeScript type
- `enterprise` — format for export back to 1C Enterprise
- `yaml` — YAML serialization format

Operations (`importFromXML`, `exportToXML`, `importFromYAML`, `exportToYAML`, `exportToEnterprise`, `exportToJSONSchema`) are registered against these type names at module load time via `registerTypeRule()`. Each `commonObjects/` subdirectory typically has `fromXML.ts`, `toXML.ts`, `fromYAML.ts`, `toYAML.ts` files that call `registerTypeRule()` when imported.

### `MetadataItemTypeRegistry` ([packages/core/metadata/orchestration/metadataItem/registry.ts](packages/core/metadata/orchestration/metadataItem/registry.ts))

Maps metadata item types (form elements like `"InputField"`, `"Table"`, `"Button"`, applied objects like `"MetadataCatalog"`) to their `metadata`/`yaml`/`enterprise` types. Helper types `ToYAML<T>`, `ToMetadata<T>`, `ToEnterprise<T>` derive TypeScript types from this registry.

### Element Rule Registry ([packages/core/metadata/orchestration/formElement/ruleFactory.ts](packages/core/metadata/orchestration/formElement/ruleFactory.ts))

Form elements additionally register an `ElementRule` (via `registerElementRule` / `registerElementAsType`) that describes the element's XML tag, properties, and conversion logic. Each element in `packages/core/metadata/forms/elements/` registers itself by importing its `fromNKDK.ts`/`toNKDK.ts` files.

### Registration Trigger

Registries are populated via **side-effect imports**. The index files (`packages/core/metadata/forms/index.ts`, `packages/core/metadata/appliedObjects/index.ts`) import all converter modules, causing registration. Consumers must import these index files before using any conversion functions.

### `forms/commonObjects/`

Shared form types that aren't form elements: `formAttribute`, `formCommand`, `dynamicList`, `commandInterface`, `formParameter`, `event`, `childItems`, etc. Structured the same way as `commonObjects/` (per-type dirs with `types.ts`, `fromXML.ts`, `toXML.ts`, etc.) but scoped to form-specific concepts.

### `systemEnumerations/`

1C system enumeration values used across metadata. Registered into `PropertyTypeRegistry` the same way as `commonObjects/`.

## Key Conventions

### Path alias
Inside `packages/core`, `~` resolves to the package root (`packages/core/`). For example: `import { Foo } from "~/metadata/commonObjects/foo/types"`. The `nkdk-language` package is also aliased directly to `../language/src/index`.

### File naming in `commonObjects/`
Each property type lives in its own directory with consistently named files:
- `types.ts` — TypeScript interfaces for `item`, `yaml`, `enterprise` representations
- `fromXML.ts` / `toXML.ts` — XML conversion (registers type rule)
- `fromYAML.ts` / `toYAML.ts` — YAML conversion (registers type rule)
- `fromDcsXML.ts` / `toDcsXML.ts` — DCS (Data Composition System) XML variant, used for filter/appearance related types
- `__fixtures__/` — test fixture data

### Tests

Tests use **Vitest** with `globals: true`. Test files are colocated with the source (e.g. `toDcsXML.test.ts` next to `toDcsXML.ts`). Fixtures are in `__fixtures__/data.ts` files. Setup file: `packages/core/tests/setupTests.ts`.

For **property-style** metadata conversion tests, use the helpers in `packages/core/tests/property/` — `testImportPropertyFromXML`, `testExportPropertyToXML`, `testImportPropertyFromYAML`, `testExportPropertyToYAML` — instead of calling `importMetadataItemFromXML`, `exportMetadataItemToXML`, `importMetadataItemFromYAML`, or `exportMetadataItemToYAML` directly in `*.test.ts`. Details: `.claude/skills/core/tests/core-tests-general/SKILL.md`.

Each conversion direction has its own `.test.ts` file and a distinct pattern:

Для быстрой генерации тестов используй скиллы из `.claude/skills/core/tests/`: `core-test-fromXML`, `core-tests-toXML`, `core-test-fromYAML`, `core-tests-toYAML` — каждый читает открытый файл конвертера и `__fixtures__/data.ts` и создаёт готовый тест.

**`fromXML.test.ts` / `fromDcsXML.test.ts`** — читает XML-фикстуру из `__fixtures__/*.xml`, парсит её через `readAndParseXMLFixture`, вызывает функцию импорта и сравнивает результат с эталонным объектом из `__fixtures__/data.ts`. Контекст: `mockContextFromXML()`.

```ts
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { fixtureModel } from "./__fixtures__/data"
import { importFooFromXML } from "./fromXML"
import type { FooXML } from "./types"

describe("importFooFromXML", () => {
  it("imports foo.xml", () => {
    const parsed = readAndParseXMLFixture<{ Foo: FooXML }>(import.meta.url, "foo.xml")
    expect(importFooFromXML(mockContextFromXML(), parsed.Foo)).toEqual(fixtureModel)
  })
})
```

**`toXML.test.ts` / `toDcsXML.test.ts`** — берёт эталонный объект из `__fixtures__/data.ts`, экспортирует в XML через функцию экспорта, оборачивает в корневой тег, сериализует через `xmlExport`, затем сравнивает два разобранных XML (не строки) через `importContentFromXML`. Контекст: `mockContext` (или `mockContextToXML()`).

```ts
import { mockContext } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { fixtureModel } from "./__fixtures__/data"
import { exportFooToXML } from "./toXML"

describe("exportFooToXML", () => {
  it("exports foo.xml", () => {
    const exported = exportFooToXML(mockContext, fixtureModel)
    const xml = xmlExport({ Foo: exported }, false)
    expect(importContentFromXML(xml)).toEqual(
      importContentFromXML(readXMLFixtureAsString(import.meta.url, "foo.xml"))
    )
  })
})
```

**`fromYAML.test.ts`** — берёт YAML-эталон из `__fixtures__/data.ts`, вызывает функцию импорта и сравнивает с объектом-эталоном оттуда же. Контекст: `mockContext`.

```ts
import { mockContext } from "~/tests/mockContext"
import { fixtureModel, fixtureModelYAML } from "./__fixtures__/data"
import { importFooFromYAML } from "./fromYAML"

describe("importFooFromYAML", () => {
  it("imports full fixture", () => {
    expect(importFooFromYAML(mockContext, fixtureModelYAML)).toEqual(fixtureModel)
  })
})
```

**`toYAML.test.ts`** — берёт объект-эталон из `__fixtures__/data.ts`, вызывает функцию экспорта и сравнивает результат с YAML-эталоном оттуда же. Контекст: `mockContext`.

```ts
import { mockContext } from "~/tests/mockContext"
import { fixtureModel, fixtureModelYAML } from "./__fixtures__/data"
import { exportFooToYAML } from "./toYAML"

describe("exportFooToYAML", () => {
  it("exports full model to YAML", () => {
    expect(exportFooToYAML(mockContext, fixtureModel)).toEqual(fixtureModelYAML)
  })
})
```

### Cyrillic file/folder names
Some directories use Cyrillic characters (e.g. `сhoiceParameters/`, `сhoiceParameterLinks/`). This is intentional — note the Cyrillic `с` vs Latin `c`.

## Data Flow

```
1C XML  →  fromXML.ts  →  internal metadata (item)  →  toYAML.ts  →  YAML
YAML    →  fromYAML.ts →  internal metadata (item)  →  toXML.ts   →  1C XML
.nkdk   →  fromNKDK.ts →  internal metadata (item)  →  toNKDK.ts  →  .nkdk
                                                     →  toEnterprise.ts → Enterprise preview format
```

The `ConfigurationContext` object threads through all conversion functions carrying configuration state, the items tree (parent chain), and format-specific sub-contexts (`exportToXML`, `enterprise`).

### `ConfigurationContext` variants

Use the appropriate context variant for each conversion direction (see `packages/core/tests/mockContext.ts`):

| Context | When to use |
|---------|-------------|
| `mockContext` | `toXML`, `fromYAML`, `toYAML`, `toEnterprise` |
| `mockContextFromXML()` | `fromXML`, `fromDcsXML` |
| `mockContextToXML()` | `toXML`, `toDcsXML` when `exportToXML` sub-context is required |

### Orchestration skills

For adding/changing metadataItem types or rules, use the skills in `.claude/skills/orchestration/`:
- `metadataItem-general` — workflow for new/modified metadataItem
- `metadataItem-rules` — how `rules.ts` works for form elements
- `metadataItem-register-property-rule` — adding a property rule to an existing item
- `metadataItem-register-new-item` — registering a brand-new item type
- `metadataCollection-register-rule` — registering a collection rule
