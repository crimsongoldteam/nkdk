# YAML Cypher Completion MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal VS Code YAML completion provider that suggests real form references for `erp_nkdk` from the live FalkorDB graph.

**Architecture:** Keep `yaml-language-server` unchanged and register a separate provider in the extension. The MVP is intentionally narrow: it recognizes top-level `Свойства.yaml`, looks only at form fields that use `allowedValues: cypherSet`, queries the real graph, and maps internal graph ids such as `Справочник.X.Форма.Y` to YAML values such as `Catalog.X.Form.Y`.

**Tech Stack:** VS Code extension API, `yaml` parser, `@nakidka/graph`, `@nakidka/core` rules, FalkorDB.

---

### File Structure

- Create `packages/extension/src/extension/yaml/cypherCompletion/path.ts`: project path parsing, graph name, scope id, and YAML reference conversion for the MVP.
- Create `packages/extension/src/extension/yaml/cypherCompletion/rules.ts`: find a property rule by owner directory and YAML key, and detect `cypherSet`.
- Create `packages/extension/src/extension/yaml/cypherCompletion/yamlKey.ts`: read the current top-level YAML key at the cursor.
- Create `packages/extension/src/extension/yaml/cypherCompletion/items.ts`: convert FalkorDB rows to `CompletionItem` inputs.
- Create `packages/extension/src/extension/yaml/cypherCompletion/provider.ts`: VS Code provider wiring and FalkorDB query.
- Create `packages/extension/src/extension/yaml/cypherCompletion/index.ts`: registration entrypoint.
- Create `packages/extension/src/extension/yaml/cypherCompletion/*.test.ts`: focused unit tests for pure helpers.
- Modify `packages/extension/src/extension/main.ts`: register the provider during activation.
- Modify `packages/core/index.ts`: export `topLevelGraphImportSpecs`, `cypherSet`, and `isCypherSet` if extension imports require public entrypoints.
- Modify `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`: for the MVP, put `allowedValues: cypherSet(...)` on catalog form fields.

### Task 1: Pure Helpers

**Files:**
- Create: `packages/extension/src/extension/yaml/cypherCompletion/path.ts`
- Create: `packages/extension/src/extension/yaml/cypherCompletion/yamlKey.ts`
- Create: `packages/extension/src/extension/yaml/cypherCompletion/items.ts`
- Test: `packages/extension/src/extension/yaml/cypherCompletion/path.test.ts`
- Test: `packages/extension/src/extension/yaml/cypherCompletion/yamlKey.test.ts`
- Test: `packages/extension/src/extension/yaml/cypherCompletion/items.test.ts`

- [ ] **Step 1: Write failing tests for path helpers**

```ts
import { describe, expect, it } from "vitest"
import {
  graphIdToYamlReference,
  parseTopLevelPropertiesPath,
  projectGraphName,
  scopeIdFromOwner,
} from "./path"

describe("yaml cypher completion path helpers", () => {
  it("parses top-level properties path", () => {
    expect(
      parseTopLevelPropertiesPath("/Users/nikita/git/erp_nkdk/Справочник/АктыОтбораПробЗЕРНО/Свойства.yaml")
    ).toEqual({
      projectPath: "/Users/nikita/git/erp_nkdk",
      dir: "Справочник",
      name: "АктыОтбораПробЗЕРНО",
    })
  })

  it("builds scope id from owner", () => {
    expect(scopeIdFromOwner({ dir: "Справочник", name: "АктыОтбораПробЗЕРНО" })).toBe(
      "Справочник.АктыОтбораПробЗЕРНО"
    )
  })

  it("builds the same project graph name as CLI", () => {
    expect(projectGraphName("/Users/nikita/git/erp_nkdk")).toMatch(/^nkdk_[0-9a-f]{12}$/)
  })

  it("converts real graph form id to YAML reference", () => {
    expect(
      graphIdToYamlReference("Справочник.АктыОтбораПробЗЕРНО.Форма.ФормаВыбора")
    ).toBe("Catalog.АктыОтбораПробЗЕРНО.Form.ФормаВыбора")
  })
})
```

- [ ] **Step 2: Write failing tests for YAML key detection**

```ts
import { describe, expect, it } from "vitest"
import { topLevelYamlKeyAtLine } from "./yamlKey"

describe("topLevelYamlKeyAtLine", () => {
  it("returns the top-level scalar key on the current line", () => {
    const text = "Автонумерация: Ложь\nОсновнаяФормаДляВыбора: \n"
    expect(topLevelYamlKeyAtLine(text, 1)).toBe("ОсновнаяФормаДляВыбора")
  })

  it("returns undefined for nested lines", () => {
    const text = "Синоним:\n  en: Test\n"
    expect(topLevelYamlKeyAtLine(text, 1)).toBeUndefined()
  })
})
```

- [ ] **Step 3: Write failing tests for completion row mapping**

```ts
import { describe, expect, it } from "vitest"
import { rowsToCompletionValues } from "./items"

describe("rowsToCompletionValues", () => {
  it("uses value, label, and detail columns", () => {
    expect(rowsToCompletionValues([{ value: "Catalog.A.Form.F", label: "Форма", detail: "FORM" }])).toEqual([
      { value: "Catalog.A.Form.F", label: "Форма", detail: "FORM" },
    ])
  })

  it("uses first string column when value is absent", () => {
    expect(rowsToCompletionValues([{ id: "Справочник.А.Форма.Ф" }])).toEqual([
      { value: "Справочник.А.Форма.Ф", label: "Справочник.А.Форма.Ф" },
    ])
  })
})
```

- [ ] **Step 4: Run tests and see failures**

Run:

```bash
pnpm exec vitest run packages/extension/src/extension/yaml/cypherCompletion/path.test.ts packages/extension/src/extension/yaml/cypherCompletion/yamlKey.test.ts packages/extension/src/extension/yaml/cypherCompletion/items.test.ts
```

Expected: FAIL because helper files do not exist.

- [ ] **Step 5: Implement helpers**

Implement:

```ts
// path.ts
import { createHash } from "crypto"
import { resolve } from "path"

const yamlRefTypeByDir: Record<string, string> = { "Справочник": "Catalog" }
const graphSegmentByDir: Record<string, string> = { "Справочник": "Справочник" }

export interface TopLevelPropertiesPath {
  projectPath: string
  dir: string
  name: string
}

export function parseTopLevelPropertiesPath(filePath: string): TopLevelPropertiesPath | undefined {
  const normalized = filePath.replaceAll("\\\\", "/")
  const marker = "/Свойства.yaml"
  if (!normalized.endsWith(marker)) return undefined
  const parts = normalized.slice(0, -marker.length).split("/")
  const name = parts.at(-1)
  const dir = parts.at(-2)
  if (!name || !dir) return undefined
  const projectPath = parts.slice(0, -2).join("/") || "/"
  if (!yamlRefTypeByDir[dir]) return undefined
  return { projectPath, dir, name }
}

export function projectGraphName(projectPath: string): string {
  const hash = createHash("sha1").update(resolve(projectPath)).digest("hex").slice(0, 12)
  return `nkdk_${hash}`
}

export function scopeIdFromOwner(owner: Pick<TopLevelPropertiesPath, "dir" | "name">): string {
  return `${graphSegmentByDir[owner.dir] ?? owner.dir}.${owner.name}`
}

export function graphIdToYamlReference(id: string): string {
  const [dir, name, kind, child] = id.split(".")
  if (!dir || !name || kind !== "Форма" || !child) return id
  const yamlType = yamlRefTypeByDir[dir] ?? dir
  return `${yamlType}.${name}.Form.${child}`
}
```

```ts
// yamlKey.ts
export function topLevelYamlKeyAtLine(text: string, line: number): string | undefined {
  const current = text.split(/\r?\n/)[line]
  if (!current || /^\s/.test(current)) return undefined
  const match = /^([^:#][^:]*):/.exec(current)
  return match?.[1]?.trim() || undefined
}
```

```ts
// items.ts
export interface CompletionValue {
  value: string
  label: string
  detail?: string
}

export function rowsToCompletionValues(rows: Array<Record<string, unknown>>): CompletionValue[] {
  return rows.flatMap((row) => {
    const rawValue = typeof row.value === "string"
      ? row.value
      : Object.values(row).find((value): value is string => typeof value === "string")
    if (!rawValue) return []
    const label = typeof row.label === "string" ? row.label : rawValue
    const detail = typeof row.detail === "string" ? row.detail : undefined
    return [{ value: rawValue, label, detail }]
  })
}
```

- [ ] **Step 6: Run helper tests**

Run the same `pnpm exec vitest run ...` command. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/extension/src/extension/yaml/cypherCompletion
git commit -m "test: :white_check_mark: покрыть helpers автодополнения YAML"
```

### Task 2: Rules and Catalog Cypher

**Files:**
- Modify: `packages/core/index.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`
- Create: `packages/extension/src/extension/yaml/cypherCompletion/rules.ts`
- Test: `packages/extension/src/extension/yaml/cypherCompletion/rules.test.ts`

- [ ] **Step 1: Export rule helpers from core**

Add exports:

```ts
export { topLevelGraphImportSpecs } from "./metadata/graphImport/registerTopLevelGraphImports"
export { cypherSet, isCypherSet } from "./metadata/orchestration/property/cypherPredicate"
export type { CypherSet } from "./metadata/orchestration/property/cypherPredicate"
```

- [ ] **Step 2: Add catalog form cypherSet**

In `metadataCatalog/rules.ts`, import `cypherSet` and add `allowedValues` to `defaultChoiceForm`,
`defaultFolderChoiceForm`, `defaultFolderForm`, `defaultListForm`, and `defaultObjectForm`:

```ts
allowedValues: cypherSet({
  query: `
    MATCH (scope {id: $scope})-[:FORM]->(form)
    RETURN replace(replace(form.id, "Справочник.", "Catalog."), ".Форма.", ".Form.") AS value,
           form.name AS label,
           "FORM" AS detail
  `,
}),
```

- [ ] **Step 3: Write failing rule lookup test**

```ts
import { describe, expect, it } from "vitest"
import { findCypherSetForYamlProperty } from "./rules"

describe("findCypherSetForYamlProperty", () => {
  it("finds catalog form cypherSet by YAML key", () => {
    const set = findCypherSetForYamlProperty("Справочник", "ОсновнаяФормаДляВыбора")
    expect(set?.query).toContain("MATCH (scope {id: $scope})-[:FORM]->(form)")
  })

  it("returns undefined for fields without cypherSet", () => {
    expect(findCypherSetForYamlProperty("Справочник", "Синоним")).toBeUndefined()
  })
})
```

- [ ] **Step 4: Implement rule lookup**

```ts
import { isCypherSet, topLevelGraphImportSpecs, type CypherSet } from "@nakidka/core"

export function findCypherSetForYamlProperty(dir: string, yamlKey: string): CypherSet | undefined {
  const spec = topLevelGraphImportSpecs.find((candidate) => candidate.dir === dir)
  if (!spec) return undefined
  const property = Object.values(spec.rule.properties).find((rule) => rule.yaml === yamlKey)
  return property && isCypherSet(property.allowedValues) ? property.allowedValues : undefined
}
```

- [ ] **Step 5: Run rule test**

```bash
pnpm exec vitest run packages/extension/src/extension/yaml/cypherCompletion/rules.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/index.ts packages/core/metadata/appliedObjects/metadataCatalog/rules.ts packages/extension/src/extension/yaml/cypherCompletion/rules.ts packages/extension/src/extension/yaml/cypherCompletion/rules.test.ts
git commit -m "feat: :sparkles: описать Cypher для форм справочника"
```

### Task 3: VS Code Provider

**Files:**
- Create: `packages/extension/src/extension/yaml/cypherCompletion/provider.ts`
- Create: `packages/extension/src/extension/yaml/cypherCompletion/index.ts`
- Modify: `packages/extension/src/extension/main.ts`

- [ ] **Step 1: Implement provider**

Use `vscode.languages.registerCompletionItemProvider`, `withGraph`, and helpers from Tasks 1-2.
For every row returned by `cypherSet.query`, create `CompletionItem` with `insertText = value`.

- [ ] **Step 2: Register provider in activation**

Import `registerYamlCypherCompletionProvider` in `main.ts` and push it into `context.subscriptions`.

- [ ] **Step 3: Build extension**

```bash
pnpm --filter nkdk run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/extension/src/extension/main.ts packages/extension/src/extension/yaml/cypherCompletion
git commit -m "feat: :sparkles: добавить YAML completion из Cypher"
```

### Task 4: Real FalkorDB Verification

**Files:**
- No source changes unless verification finds a mismatch.

- [ ] **Step 1: Query real graph**

Run against `/Users/nikita/git/erp_nkdk` graph:

```bash
node -e "/* query FalkorDB and print FORM rows for Справочник.АктыОтбораПробЗЕРНО */"
```

Expected rows include:

```text
Catalog.АктыОтбораПробЗЕРНО.Form.ФормаВыбора
Catalog.АктыОтбораПробЗЕРНО.Form.ФормаСписка
Catalog.АктыОтбораПробЗЕРНО.Form.ФормаЭлемента
```

- [ ] **Step 2: Launch Extension Host and manual check**

Open `/Users/nikita/git/erp_nkdk/Справочник/АктыОтбораПробЗЕРНО/Свойства.yaml`, clear the value on
line `ОсновнаяФормаДляВыбора`, invoke completion, and verify the three form suggestions appear.

- [ ] **Step 3: Final verification**

```bash
pnpm --filter nkdk-language langium:generate
pnpm --filter nkdk run build
pnpm exec vitest run packages/extension/src/extension/yaml/cypherCompletion
```

Expected: PASS.
