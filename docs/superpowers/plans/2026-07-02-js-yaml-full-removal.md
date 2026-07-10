# js-yaml Full Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully replace the `yaml` package with `js-yaml` for import, export, syntax diagnostics, and YAML positions, then remove `yaml` from runtime dependencies.

**Architecture:** `parseMetadataYaml` becomes the single bridge over `js-yaml`: it returns plain JS data, syntax diagnostics, source text, and a neutral `YamlLocationIndex`, with no `Document` or `LineCounter`. Position consumers move from AST traversal to `YamlLocationIndex`; export moves to `js-yaml.dump` with a local schema/type for `ExplicitYAMLString`.

**Tech Stack:** TypeScript, Vitest, `js-yaml`, TypeBox, existing metadata rules, project YAML round-trip scripts.

---

## File Map

- `packages/core/yaml/jsYamlParser.ts`: parse YAML through `js-yaml`, normalize syntax diagnostics, preserve explicit double-quoted scalar marks.
- `packages/core/yaml/locationIndex.ts`: neutral position index; no imports from `yaml`.
- `packages/core/yaml/parseMetadataYaml.ts`: final `ParsedYaml` contract with `text`, `data`, `locations`, `syntaxErrors`.
- `packages/core/yaml/import.ts`: public `importFromYAML` and `importFromYAMLFile` backed by `js-yaml`.
- `packages/core/yaml/export.ts`: public `exportToYAML` backed by `js-yaml.dump`.
- `packages/core/yaml/explicitString.ts`: keep existing marker helpers; export uses them through `js-yaml` schema.
- `packages/core/metadata/validation/yamlLocations.ts`: diagnostics only through `YamlLocationIndex`.
- `packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts`: value/key/root positions only through `YamlLocationIndex`.
- `packages/core/metadata/validation/uniqueNameScopes.ts`: duplicate-name diagnostics through `YamlLocationIndex`.
- `packages/core/metadata/validation/dataPath/formIndex.ts`: duplicate form requisite diagnostics through `YamlLocationIndex.keyOccurrences`.
- `packages/core/metadata/orchestration/property/position.ts`: remove or convert to index-based helpers if still needed.
- `packages/core/metadata/operations/*.ts` and configuration migration files: replace direct `yaml` parse/stringify usage with `js-yaml` wrappers or `js-yaml` directly.
- `packages/core/package.json` and `pnpm-lock.yaml`: remove `yaml`, keep `js-yaml` and `@types/js-yaml`.
- `docs/superpowers/plans/2026-07-02-js-yaml-full-removal.md`: this execution plan.

## Current Known Gaps

- `parseMetadataYaml` still returns `doc` and `lineCounter`.
- `importFromYAML` and `exportToYAML` still use `yaml`.
- Several validation helpers still use `parsed.doc` as fallback.
- Focused syntax tests currently fail because `js-yaml` reports `Имя: [` as EOF at `line: 2, col: 1`, while tests expect `line: 1, col: 6`.
- `yaml` is still present in `packages/core/package.json`.

---

### Task 1: Normalize js-yaml Syntax Diagnostics

**Files:**
- Modify: `packages/core/yaml/jsYamlParser.ts`
- Modify: `packages/core/yaml/jsYamlParser.test.ts`
- Modify: `packages/core/metadata/validation/validateFile.test.ts`

- [ ] **Step 1: Write failing tests for EOF flow collection diagnostics**

Add these cases to `packages/core/yaml/jsYamlParser.test.ts`:

```typescript
it("normalizes EOF diagnostics to the unterminated flow collection", () => {
  const parsed = parseWithJsYaml("Имя: [")

  expect(parsed.syntaxErrors).toHaveLength(1)
  expect(parsed.syntaxErrors[0]).toMatchObject({
    line: 1,
    col: 6,
    message: expect.stringContaining("unexpected end"),
  })
})

it("keeps direct mark diagnostics when the parser points into an existing line", () => {
  const parsed = parseWithJsYaml("Имя: Тест\n  ЛишнийОтступ: 1\n")

  expect(parsed.syntaxErrors).toHaveLength(1)
  expect(parsed.syntaxErrors[0].line).toBeGreaterThanOrEqual(1)
  expect(parsed.syntaxErrors[0].col).toBeGreaterThanOrEqual(1)
})
```

- [ ] **Step 2: Run the syntax tests and verify RED**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run yaml/jsYamlParser.test.ts metadata/validation/validateFile.test.ts
```

Expected: FAIL on the EOF position normalization.

- [ ] **Step 3: Implement EOF position normalization**

In `packages/core/yaml/jsYamlParser.ts`, update `toSyntaxError` so a mark after the last line can be remapped to the last meaningful token in the previous line:

```typescript
function toSyntaxError(error: unknown, text: string): JsYamlSyntaxError {
  if (error instanceof YAMLException && error.mark !== undefined) {
    const normalized = normalizeYamlMark(error.mark.line, error.mark.column, text)
    return {
      message: error.reason || error.message,
      line: normalized.line,
      col: normalized.col,
    }
  }

  return {
    message: error instanceof Error ? error.message : "Некорректный YAML",
    line: 1,
    col: 1,
  }
}

function normalizeYamlMark(line: number, column: number, text: string): { line: number; col: number } {
  const lines = text.split(/\r?\n/)
  const rawLine = lines[line]
  if (rawLine !== undefined && column < rawLine.length) {
    return { line: line + 1, col: Math.max(1, column + 1) }
  }

  const previousLineIndex = Math.min(line, lines.length - 1)
  for (let index = previousLineIndex; index >= 0; index -= 1) {
    const candidate = lines[index]
    const flowIndex = Math.max(candidate.lastIndexOf("["), candidate.lastIndexOf("{"))
    if (flowIndex >= 0) return { line: index + 1, col: flowIndex + 1 }
    if (candidate.trim() !== "") return { line: index + 1, col: Math.max(1, candidate.length) }
  }

  return { line: 1, col: 1 }
}
```

- [ ] **Step 4: Run focused syntax tests and verify GREEN**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run yaml/jsYamlParser.test.ts metadata/validation/validateFile.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/yaml/jsYamlParser.ts packages/core/yaml/jsYamlParser.test.ts packages/core/metadata/validation/validateFile.test.ts
git commit -m "fix: :bug: нормализовать позиции ошибок js-yaml"
```

---

### Task 2: Make Location Index the Only Position Source

**Files:**
- Modify: `packages/core/yaml/locationIndex.ts`
- Modify: `packages/core/yaml/locationIndex.test.ts`
- Modify: `packages/core/metadata/validation/yamlLocations.ts`
- Modify: `packages/core/metadata/validation/yamlLocations.test.ts`

- [ ] **Step 1: Add tests for scalar sequence items and key-like values**

Add to `packages/core/yaml/locationIndex.test.ts`:

```typescript
it("does not treat scalar sequence values with colon as mapping keys", () => {
  const index = buildYamlLocationIndex(["Ссылки:", "  - http://example.com", "  - urn:value"].join("\n"))

  expect(index.nodePosition(["Ссылки", 0])).toEqual({ line: 2, col: 5 })
  expect(index.nodePosition(["Ссылки", 1])).toEqual({ line: 3, col: 5 })
  expect(index.keyPosition(["Ссылки", 0, "http"])).toBeUndefined()
  expect(index.keyPosition(["Ссылки", 1, "urn"])).toBeUndefined()
})

it("finds duplicate key occurrences without AST fallback", () => {
  const index = buildYamlLocationIndex(["Реквизиты:", "  Имя: Один", "  Имя: Два"].join("\n"))

  expect(index.keyOccurrences(["Реквизиты", "Имя"])).toEqual([
    { line: 2, col: 3 },
    { line: 3, col: 3 },
  ])
})
```

- [ ] **Step 2: Run location tests and verify RED if current scanner misclassifies scalar values**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run yaml/locationIndex.test.ts
```

Expected: FAIL if scalar sequence values with `:` are indexed as keys.

- [ ] **Step 3: Tighten mapping colon detection**

In `packages/core/yaml/locationIndex.ts`, update `findMappingColon` so a colon is a mapping separator only when it is followed by whitespace or end-of-line:

```typescript
function findMappingColon(line: string, start: number): number | undefined {
  let quote: "\"" | "'" | undefined

  for (let index = start; index < line.length; index += 1) {
    const char = line[index]
    if (quote !== undefined) {
      if (char === quote) quote = undefined
      continue
    }

    if (char === "\"" || char === "'") {
      quote = char
      continue
    }

    if (char !== ":") continue

    const next = line[index + 1]
    if (next === undefined || next === " " || next === "\t") return index
  }

  return undefined
}
```

- [ ] **Step 4: Remove AST fallback from yamlLocations**

Replace `packages/core/metadata/validation/yamlLocations.ts` with an index-only implementation:

```typescript
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { Diagnostic, DiagnosticSeverity, DiagnosticSource } from "./types"

export type YamlPath = readonly (string | number)[]

export interface DiagnosticAtYamlPathParams {
  filePath: string
  parsed: ParsedYaml
  path: YamlPath
  severity: DiagnosticSeverity
  source: DiagnosticSource
  message: string
}

export function diagnosticAtYamlPath({
  filePath,
  parsed,
  path,
  severity,
  source,
  message,
}: DiagnosticAtYamlPathParams): Diagnostic {
  const position =
    parsed.locations.keyPosition(path) ??
    parsed.locations.nodePosition(path) ??
    (path.length === 0 ? parsed.locations.rootPosition() : { line: 1, col: 1 })

  return {
    filePath,
    line: position.line,
    col: position.col,
    message,
    severity,
    source,
    path: yamlPathToPointer(path),
  }
}

function yamlPathToPointer(path: YamlPath): string | undefined {
  if (path.length === 0) return undefined
  return `/${path.map((segment) => String(segment).replace(/~/g, "~0").replace(/\//g, "~1")).join("/")}`
}
```

- [ ] **Step 5: Run position tests and verify GREEN**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run yaml/locationIndex.test.ts metadata/validation/yamlLocations.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/yaml/locationIndex.ts packages/core/yaml/locationIndex.test.ts packages/core/metadata/validation/yamlLocations.ts packages/core/metadata/validation/yamlLocations.test.ts
git commit -m "refactor: :recycle: перевести yaml-позиции на индекс"
```

---

### Task 3: Remove ParsedYaml doc and lineCounter Consumers

**Files:**
- Modify: `packages/core/yaml/parseMetadataYaml.ts`
- Modify: `packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts`
- Modify: `packages/core/metadata/validation/uniqueNameScopes.ts`
- Modify: `packages/core/metadata/validation/dataPath/formIndex.ts`
- Modify: `packages/core/metadata/orchestration/property/position.ts`
- Modify tests that construct `ParsedYaml` manually.

- [ ] **Step 1: Add a type-level guard test**

Create or extend `packages/core/yaml/jsYamlParser.test.ts` with:

```typescript
it("parseMetadataYaml does not expose yaml AST compatibility fields", async () => {
  const { parseMetadataYaml } = await import("./parseMetadataYaml")
  const parsed = parseMetadataYaml("Имя: Тест\n")

  expect("doc" in parsed).toBe(false)
  expect("lineCounter" in parsed).toBe(false)
  expect(parsed.data).toEqual({ Имя: "Тест" })
})
```

- [ ] **Step 2: Run the guard test and verify RED**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run yaml/jsYamlParser.test.ts
```

Expected: FAIL because `doc` and `lineCounter` still exist.

- [ ] **Step 3: Change ParsedYaml contract**

Replace `packages/core/yaml/parseMetadataYaml.ts` with:

```typescript
import { parseWithJsYaml, type JsYamlSyntaxError } from "./jsYamlParser"
import type { YamlLocationIndex } from "./locationIndex"

export interface ParsedYaml {
  text: string
  data: unknown
  locations: YamlLocationIndex
  syntaxErrors: JsYamlSyntaxError[]
}

export function parseMetadataYaml(text: string): ParsedYaml {
  const parsed = parseWithJsYaml(text)
  return {
    text,
    data: parsed.data,
    locations: parsed.locations,
    syntaxErrors: parsed.syntaxErrors,
  }
}
```

- [ ] **Step 4: Replace TypeBox fallback with index-only lookup**

In `packages/core/metadata/validation/typeboxErrorsToDiagnostics.ts`, replace the block that reads `parsed.doc` and `parsed.lineCounter` with:

```typescript
const indexedPosition = isRequired
  ? parsed.locations.nodePosition(lookupKeys)
  : parsed.locations.valuePosition(lookupKeys) ?? parsed.locations.nodePosition(lookupKeys)
const fallbackPosition = lookupKeys.length === 0 ? parsed.locations.rootPosition() : { line: 1, col: 1 }
const position = indexedPosition ?? fallbackPosition
const line = position.line
const col = position.col
```

- [ ] **Step 5: Replace uniqueNameScopes position lookup**

In `packages/core/metadata/validation/uniqueNameScopes.ts`, remove imports from `yaml` and `metadata/orchestration/property/position`, then replace `findYamlKeyPosition` with:

```typescript
function findYamlKeyPosition(parsed: ParsedYaml, collectionYaml: string, name: string): { line: number; col: number } {
  return parsed.locations.keyPosition([collectionYaml, name]) ?? { line: 1, col: 1 }
}
```

- [ ] **Step 6: Replace form duplicate occurrence lookup**

In `packages/core/metadata/validation/dataPath/formIndex.ts`, remove `yaml` imports and replace `findRequisitesKeyOccurrence` with:

```typescript
function findRequisitesKeyOccurrence(
  parsed: ParsedYaml,
  name: string,
  occurrence: number,
): { line: number; col: number } | undefined {
  return parsed.locations.keyOccurrences(["Реквизиты", name])[occurrence - 1]
}
```

- [ ] **Step 7: Remove obsolete position helpers**

If `packages/core/metadata/orchestration/property/position.ts` is no longer imported by production code, delete it and its test:

```bash
rg 'orchestration/property/position|computeKeyPosition|computeValuePosition|computeSeqItemPosition|findSubmap' packages/core
```

Expected before deletion: only the helper file and its test remain. Then remove both files.

- [ ] **Step 8: Fix manual ParsedYaml test objects**

Search:

```bash
rg 'doc:|lineCounter:' packages/core -g '*.ts'
```

For tests that still inject `doc` or `lineCounter`, remove those properties. Use `parseMetadataYaml(...)` to create the parsed object whenever possible.

- [ ] **Step 9: Run validation tests and type-check**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/typeboxErrorsToDiagnostics.test.ts metadata/validation/yamlLocations.test.ts metadata/validation/validateFile.test.ts metadata/validation/dataPath metadata/validation/uniqueNameScopes.test.ts yaml/jsYamlParser.test.ts
pnpm --filter @nakidka/core exec tsc --noEmit --pretty false
```

Expected: PASS. If a listed test file does not exist, replace it with the nearest owning test discovered by `rg`.

- [ ] **Step 10: Commit**

```bash
git add packages/core/yaml/parseMetadataYaml.ts packages/core/yaml/jsYamlParser.test.ts packages/core/metadata/validation packages/core/metadata/orchestration/property
git commit -m "refactor: :recycle: удалить yaml AST из ParsedYaml"
```

---

### Task 4: Move Public Import to js-yaml

**Files:**
- Modify: `packages/core/yaml/import.ts`
- Modify: `packages/core/yaml/import.test.ts`
- Modify: `packages/core/yaml/jsYamlParser.ts`
- Modify: `packages/core/yaml/explicitString.ts` only if marker API needs a read helper.

- [ ] **Step 1: Add import parity tests**

Add to `packages/core/yaml/import.test.ts`:

```typescript
it("imports null-like empty values as undefined", () => {
  expect(importFromYAML<{ Поле?: string }>("Поле:\n")).toEqual({ Поле: undefined })
})

it("keeps double quoted string markers", () => {
  const result = importFromYAML<{ Значение: string }>('Значение: "001"\n')

  expect(asExplicitYAMLStringIfMarked(result, "Значение", result.Значение)).toEqual(explicitYAMLString("001"))
})

it("uses JSON schema scalar behavior for strings and numbers", () => {
  expect(importFromYAML("Строка: on\nЧисло: 123\n")).toEqual({ Строка: "on", Число: 123 })
})
```

Ensure the test imports marker helpers:

```typescript
import { asExplicitYAMLStringIfMarked, explicitYAMLString } from "./explicitString"
```

- [ ] **Step 2: Run import tests and verify RED**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run yaml/import.test.ts
```

Expected: FAIL if `js-yaml` import does not preserve double-quoted scalar markers yet.

- [ ] **Step 3: Preserve explicit double-quoted scalars in js-yaml import**

In `packages/core/yaml/jsYamlParser.ts`, use a custom schema extending `JSON_SCHEMA` with a string type that can mark double-quoted values. Keep the marker at the adapter boundary.

Implementation shape:

```typescript
import { JSON_SCHEMA, Schema, Type, YAMLException, load } from "js-yaml"
import { markDoubleQuotedScalar } from "./explicitString"

const NKDK_JSON_SCHEMA = JSON_SCHEMA.extend([
  new Type("tag:yaml.org,2002:str", {
    kind: "scalar",
    resolve: () => true,
    construct: (data: string | null) => data ?? "",
  }),
])
```

If `js-yaml` does not expose scalar style in `construct`, keep `parseWithJsYaml` data from `js-yaml.load` and add a lightweight quote scanner that walks the same paths as `YamlLocationIndex`, marking values where the source value begins with `"`. The helper signature should be:

```typescript
function markDoubleQuotedScalarsFromSource(data: unknown, text: string, locations: YamlLocationIndex): unknown
```

It must recursively visit object entries and array items and call `markDoubleQuotedScalar(parent, key)` when `locations.valuePosition(path)` points to a double quote in `text`.

- [ ] **Step 4: Replace importFromYAML implementation**

Replace `packages/core/yaml/import.ts` with:

```typescript
import { readFile } from "fs/promises"
import { parseWithJsYaml } from "./jsYamlParser"

export const importFromYAML = <T>(data: string): T => {
  const parsed = parseWithJsYaml(data)
  if (parsed.syntaxErrors.length > 0) {
    const first = parsed.syntaxErrors[0]
    throw new Error(`${first.message} (${first.line}:${first.col})`)
  }
  return parsed.data as T
}

export const importFromYAMLFile = async <T>(filePath: string): Promise<T> => {
  const data = await readFile(filePath, "utf-8")
  return importFromYAML(data)
}
```

- [ ] **Step 5: Run import tests and focused metadata import tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run yaml/import.test.ts metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts metadata/commonObjects/сhoiceParameters/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/yaml/import.ts packages/core/yaml/import.test.ts packages/core/yaml/jsYamlParser.ts packages/core/yaml/explicitString.ts
git commit -m "feat: :sparkles: перевести импорт YAML на js-yaml"
```

---

### Task 5: Move Public Export to js-yaml

**Files:**
- Modify: `packages/core/yaml/export.ts`
- Modify: `packages/core/yaml/export.test.ts`

- [ ] **Step 1: Add export parity tests**

Add to `packages/core/yaml/export.test.ts`:

```typescript
it("exports explicit YAML strings with double quotes", () => {
  expect(exportToYAML({ Значение: explicitYAMLString("001") })).toBe('Значение: "001"')
})

it("exports without document final line ending", () => {
  expect(exportToYAML({ Имя: "Тест" })).toBe("Имя: Тест")
})

it("exports undefined as empty value", () => {
  expect(exportToYAML({ Поле: undefined })).toBe("Поле:")
})

it("does not wrap long scalar lines", () => {
  const longValue = "x".repeat(160)
  expect(exportToYAML({ Поле: longValue })).toBe(`Поле: ${longValue}`)
})
```

- [ ] **Step 2: Run export tests and verify RED**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run yaml/export.test.ts
```

Expected: FAIL until `exportToYAML` uses `js-yaml.dump` with explicit-string support.

- [ ] **Step 3: Implement js-yaml dump with explicit string type**

Replace `packages/core/yaml/export.ts` with:

```typescript
import { JSON_SCHEMA, Schema, Type, dump } from "js-yaml"
import { isExplicitYAMLString, unwrapExplicitYAMLString } from "./explicitString"

const explicitStringType = new Type("tag:nakidka.dev,2026:explicit-string", {
  kind: "scalar",
  instanceOf: Object,
  predicate: isExplicitYAMLString,
  represent: (value: unknown) => unwrapExplicitYAMLString(value),
  defaultStyle: "double",
})

const NKDK_DUMP_SCHEMA = JSON_SCHEMA.extend([explicitStringType])

const removeDocumentFinalLineEnding = (yaml: string): string => {
  return yaml.endsWith("\n") ? yaml.slice(0, -1) : yaml
}

export const exportToYAML = <T>(data: T): string => {
  const yaml = dump(data, {
    schema: NKDK_DUMP_SCHEMA,
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    skipInvalid: false,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
    condenseFlow: false,
  })
  return removeDocumentFinalLineEnding(yaml)
}
```

If TypeScript rejects `predicate`, use `represent` with `instanceOf` removed and add one local type assertion at this adapter boundary:

```typescript
const explicitStringType = new Type("tag:nakidka.dev,2026:explicit-string", {
  kind: "scalar",
  predicate: isExplicitYAMLString,
  represent: (value: unknown) => unwrapExplicitYAMLString(value),
  defaultStyle: "double",
} as Parameters<typeof Type>[1])
```

- [ ] **Step 4: Preserve empty-value behavior if js-yaml emits `null`**

If `exportToYAML({ Поле: undefined })` emits `Поле: null`, add a preprocessor:

```typescript
function prepareForDump(value: unknown): unknown {
  if (isExplicitYAMLString(value)) return value
  if (Array.isArray(value)) return value.map(prepareForDump)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item === undefined ? null : prepareForDump(item)]))
  }
  return value
}
```

Then call `dump(prepareForDump(data), ...)` and set `styles: { "!!null": "empty" }` if supported by the installed `js-yaml` version. If not supported, post-process only standalone `: null` values:

```typescript
function normalizeEmptyNullValues(yaml: string): string {
  return yaml.replace(/: null$/gm, ":")
}
```

- [ ] **Step 5: Run export tests and common YAML round-trip tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run yaml/export.test.ts yaml/import.test.ts metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/yaml/export.ts packages/core/yaml/export.test.ts
git commit -m "feat: :sparkles: перевести экспорт YAML на js-yaml"
```

---

### Task 6: Replace Direct yaml Usage Outside YAML Facade

**Files:**
- Modify: `packages/core/metadata/operations/renameItem.ts`
- Modify: `packages/core/metadata/operations/migrationChain.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/writeMigration.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/stateFile.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/readMigration.ts`
- Modify corresponding tests.

- [ ] **Step 1: Find all remaining imports from yaml**

Run:

```bash
rg 'from "yaml"|from "yaml/|import YAML from "yaml"' packages/core -g '*.ts'
```

Expected: list all remaining direct uses.

- [ ] **Step 2: Replace simple parse/stringify calls**

For files that parse YAML data without needing positions, replace:

```typescript
import { parse, stringify } from "yaml"
```

with:

```typescript
import { JSON_SCHEMA, dump, load } from "js-yaml"
```

Use:

```typescript
const data = load(text, { schema: JSON_SCHEMA })
const text = dump(data, { schema: JSON_SCHEMA, indent: 2, lineWidth: -1, noRefs: true })
```

For metadata YAML output, prefer the project facade:

```typescript
import { exportToYAML } from "~/yaml/export"
```

- [ ] **Step 3: Replace default YAML namespace usage**

In `configuration/syncState.ts`, replace `YAML.parse(...)` and `YAML.stringify(...)` with `load(...)` and `dump(...)` or the public facade if the file is project YAML.

- [ ] **Step 4: Run owning tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/operations metadata/appliedObjects/configuration
```

Expected: PASS.

- [ ] **Step 5: Verify no production import from yaml remains**

Run:

```bash
rg 'from "yaml"|from "yaml/|import YAML from "yaml"' packages/core -g '*.ts'
```

Expected: no production imports. Test imports are allowed only if a task explicitly still uses old fixtures; otherwise remove them too.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/operations packages/core/metadata/appliedObjects/configuration
git commit -m "refactor: :recycle: убрать прямое использование yaml"
```

---

### Task 7: Remove yaml Dependency

**Files:**
- Modify: `packages/core/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Remove the package dependency**

Run:

```bash
pnpm --filter @nakidka/core remove yaml
```

Expected: `packages/core/package.json` no longer contains `"yaml"`.

- [ ] **Step 2: Verify no imports remain**

Run:

```bash
rg 'from "yaml"|from "yaml/|import YAML from "yaml"|parseDocument|LineCounter|YAMLMap|YAMLSeq|Scalar\\.QUOTE_DOUBLE' packages/core -g '*.ts'
```

Expected: no results. If results remain, remove the usage before continuing.

- [ ] **Step 3: Run type-check**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit --pretty false
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/package.json pnpm-lock.yaml
git commit -m "build: :heavy_minus_sign: удалить зависимость yaml"
```

---

### Task 8: Mass YAML Diff Analysis on User Dump

**Files:**
- Create: `packages/core/scripts/compare-js-yaml-export.ts`
- Do not commit user dump path.

- [ ] **Step 1: Ask the user for the YAML dump path**

Before running this task, ask exactly one question:

```text
Укажи путь к YAML-выгрузке для массового сравнения.
```

Do not proceed until the user gives a path.

- [ ] **Step 2: Add a temporary comparison script**

Create `packages/core/scripts/compare-js-yaml-export.ts`:

```typescript
import { readFile } from "fs/promises"
import { join, relative } from "path"
import { readdir } from "fs/promises"
import { importFromYAML } from "../yaml/import"
import { exportToYAML } from "../yaml/export"

async function listYamlFiles(dir: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...(await listYamlFiles(path)))
      continue
    }
    if (entry.isFile() && entry.name.endsWith(".yaml")) result.push(path)
  }
  return result
}

function classifyDiff(original: string, next: string): string {
  if (original.trimEnd() === next.trimEnd()) return "trailing-newline"
  if (original.replace(/"/g, "'") === next.replace(/"/g, "'")) return "quotes"
  if (original.replace(/: null/g, ":") === next.replace(/: null/g, ":")) return "empty-values"
  if (original.replace(/\r\n/g, "\n") === next.replace(/\r\n/g, "\n")) return "line-endings"
  if (original.includes("|") || original.includes(">") || next.includes("|") || next.includes(">")) return "block-scalars"
  return "unknown"
}

async function main(): Promise<void> {
  const root = process.argv[2]
  if (!root) throw new Error("Usage: tsx compare-js-yaml-export.ts <yaml-dump-dir>")

  const files = await listYamlFiles(root)
  const classes = new Map<string, string[]>()
  let roundTripFailures = 0

  for (const file of files) {
    const original = await readFile(file, "utf-8")
    const data = importFromYAML(original)
    const next = exportToYAML(data)
    importFromYAML(next)

    if (original === next) continue
    const diffClass = classifyDiff(original, next)
    const items = classes.get(diffClass) ?? []
    if (items.length < 20) items.push(relative(root, file))
    classes.set(diffClass, items)

    try {
      const reparsed = importFromYAML(next)
      if (JSON.stringify(data) !== JSON.stringify(reparsed)) roundTripFailures += 1
    } catch {
      roundTripFailures += 1
    }
  }

  console.log(`files=${files.length}`)
  console.log(`roundTripFailures=${roundTripFailures}`)
  for (const [diffClass, examples] of [...classes.entries()].sort()) {
    console.log(`class=${diffClass} count>=${examples.length}`)
    for (const example of examples) console.log(`  ${example}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
```

- [ ] **Step 3: Run the comparison**

Run with the user-provided path:

```bash
pnpm --filter @nakidka/core exec tsx packages/core/scripts/compare-js-yaml-export.ts /path/from/user
```

Expected:
- `roundTripFailures=0`;
- no `class=unknown`, or each unknown class is inspected and converted into an accepted class or fixed in code.

- [ ] **Step 4: Remove the temporary script unless the team wants to keep it**

If the script is not needed as a permanent developer tool:

```bash
git restore -- packages/core/scripts/compare-js-yaml-export.ts
```

If keeping it, add a short package script and commit it with docs. Do not store the user path.

- [ ] **Step 5: Commit any fixes from the diff analysis**

```bash
git add packages/core
git commit -m "fix: :bug: стабилизировать формат YAML после сравнения"
```

Only commit if code or tests changed.

---

### Task 9: Final Verification

**Files:**
- All touched files.

- [ ] **Step 1: Run focused YAML tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run yaml metadata/validation metadata/operations metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run dependency and source checks**

Run:

```bash
rg 'from "yaml"|from "yaml/|import YAML from "yaml"|parseDocument|LineCounter|YAMLMap|YAMLSeq|Scalar\\.QUOTE_DOUBLE' packages/core -g '*.ts'
rg '"yaml"' packages/core/package.json pnpm-lock.yaml
```

Expected:
- first command: no results;
- second command: no `yaml` package dependency remains. `js-yaml` and `@types/js-yaml` are expected.

- [ ] **Step 3: Run the full project test suite**

Run from repository root:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git diff --stat HEAD~9..HEAD
git status --short
```

Expected: only intended YAML migration files changed; working tree clean after final commit.

- [ ] **Step 5: Final commit if verification required small fixes**

```bash
git add packages/core docs/superpowers/plans/2026-07-02-js-yaml-full-removal.md
git commit -m "test: :white_check_mark: закрепить полную замену yaml"
```

Only commit if there are actual changes.

---

## Self-Review Against Spec

- Full replacement of `importFromYAML`, `importFromYAMLFile`, `parseMetadataYaml`, `exportToYAML`: Tasks 3, 4, 5.
- Remove `yaml` dependency and imports: Tasks 6, 7, 9.
- Neutral `ParsedYaml` without `Document` or `LineCounter`: Task 3.
- `YamlLocationIndex` contract for root, key, value, node, duplicates: Tasks 2, 3.
- Syntax errors from `YAMLException.mark`: Task 1.
- Position consumers moved to index: Tasks 2, 3.
- Export through `js-yaml.dump(JSON_SCHEMA)` and explicit double quotes: Task 5.
- Mass diff analysis after requesting user path: Task 8.
- Existing and full tests, including `pnpm test`: Task 9.

