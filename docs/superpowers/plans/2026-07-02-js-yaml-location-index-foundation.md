# js-yaml Location Index Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first `js-yaml` migration layer: dependency, parser facade, and neutral YAML location index covered by tests.

**Architecture:** Keep the existing `yaml`-based import/export path intact while adding a new `js-yaml` facade under `packages/core/yaml`. The new facade exposes JS data plus `YamlLocationIndex`, so validation code can later migrate away from `yaml.Document` without a big-bang rewrite.

**Tech Stack:** TypeScript, Vitest, `js-yaml`, current `yaml` package kept temporarily for old callers.

---

### Task 1: Add js-yaml Dependency

**Files:**
- Modify: `packages/core/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Add dependency**

Run:

```bash
pnpm --dir packages/core add js-yaml
pnpm --dir packages/core add -D @types/js-yaml
```

Expected: `packages/core/package.json` contains `js-yaml` in dependencies and `@types/js-yaml` in devDependencies.

- [ ] **Step 2: Verify dependency resolution**

Run:

```bash
pnpm --dir packages/core exec tsc --noEmit
```

Expected: TypeScript can resolve `js-yaml`.

### Task 2: Location Index RED Tests

**Files:**
- Create: `packages/core/yaml/locationIndex.test.ts`
- Create: `packages/core/yaml/locationIndex.ts`

- [ ] **Step 1: Write failing tests**

Create tests for:

```typescript
import { describe, expect, it } from "vitest"
import { buildYamlLocationIndex } from "./locationIndex"

describe("buildYamlLocationIndex", () => {
  const yaml = [
    "Имя: Тест",
    "Реквизиты:",
    "  - Имя: Первый",
    "    Тип: Строка",
    "  - Имя: Второй",
    "    Тип: Число",
    "Настройки:",
    "  Группа:",
    "    Поле: Значение",
    "Описание: |",
    "  первая строка",
    "  вторая строка",
  ].join("\n")

  it("finds map key positions", () => {
    const index = buildYamlLocationIndex(yaml)

    expect(index.keyPosition(["Реквизиты"])).toEqual({ line: 2, col: 1 })
    expect(index.keyPosition(["Настройки", "Группа", "Поле"])).toEqual({ line: 9, col: 5 })
  })

  it("finds sequence item and nested key positions", () => {
    const index = buildYamlLocationIndex(yaml)

    expect(index.nodePosition(["Реквизиты", 1])).toEqual({ line: 5, col: 5 })
    expect(index.keyPosition(["Реквизиты", 1, "Тип"])).toEqual({ line: 6, col: 5 })
  })

  it("finds scalar value positions", () => {
    const index = buildYamlLocationIndex(yaml)

    expect(index.valuePosition(["Имя"])).toEqual({ line: 1, col: 6 })
    expect(index.valuePosition(["Описание"])).toEqual({ line: 10, col: 11 })
  })

  it("returns undefined for missing paths", () => {
    const index = buildYamlLocationIndex(yaml)

    expect(index.keyPosition(["Реквизиты", 10, "Тип"])).toBeUndefined()
    expect(index.valuePosition(["Нет"])).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run yaml/locationIndex.test.ts
```

Expected: FAIL because `./locationIndex` does not exist or `buildYamlLocationIndex` is not implemented.

### Task 3: Implement Location Index

**Files:**
- Create: `packages/core/yaml/locationIndex.ts`

- [ ] **Step 1: Implement line offset helper and scanner**

Implement a focused scanner for project YAML:

```typescript
export interface YamlPosition {
  line: number
  col: number
}

export type YamlPath = readonly (string | number)[]

export interface YamlLocationIndex {
  rootPosition(): YamlPosition
  keyPosition(path: YamlPath): YamlPosition | undefined
  valuePosition(path: YamlPath): YamlPosition | undefined
  nodePosition(path: YamlPath): YamlPosition | undefined
}

export function buildYamlLocationIndex(text: string): YamlLocationIndex {
  // implemented in this task
}
```

The scanner must support block mappings, block sequences, nested paths, inline scalar values, empty values, quoted keys, and block scalar headers.

- [ ] **Step 2: Run tests to verify GREEN**

Run:

```bash
pnpm --dir packages/core exec vitest run yaml/locationIndex.test.ts
```

Expected: PASS.

### Task 4: Add js-yaml Parser Facade

**Files:**
- Create: `packages/core/yaml/jsYamlParser.test.ts`
- Create: `packages/core/yaml/jsYamlParser.ts`

- [ ] **Step 1: Write failing parser tests**

Cover:

```typescript
import { describe, expect, it } from "vitest"
import { parseWithJsYaml } from "./jsYamlParser"

describe("parseWithJsYaml", () => {
  it("parses data and exposes location index", () => {
    const parsed = parseWithJsYaml("Имя: Тест\nРеквизиты:\n  - Имя: Первый\n")

    expect(parsed.data).toEqual({ Имя: "Тест", Реквизиты: [{ Имя: "Первый" }] })
    expect(parsed.locations.keyPosition(["Реквизиты", 0, "Имя"])).toEqual({ line: 3, col: 5 })
    expect(parsed.syntaxErrors).toEqual([])
  })

  it("returns syntax diagnostics for invalid yaml", () => {
    const parsed = parseWithJsYaml("Имя: [")

    expect(parsed.syntaxErrors).toHaveLength(1)
    expect(parsed.syntaxErrors[0]).toMatchObject({ line: 1, col: 6 })
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run yaml/jsYamlParser.test.ts
```

Expected: FAIL because parser facade is missing.

- [ ] **Step 3: Implement parser facade**

Use `js-yaml.load(text, { schema: JSON_SCHEMA })`, catch `YAMLException`, and always return:

```typescript
export interface JsYamlSyntaxError {
  message: string
  line: number
  col: number
}

export interface JsParsedYaml {
  text: string
  data: unknown
  locations: YamlLocationIndex
  syntaxErrors: JsYamlSyntaxError[]
}
```

- [ ] **Step 4: Run parser tests to verify GREEN**

Run:

```bash
pnpm --dir packages/core exec vitest run yaml/jsYamlParser.test.ts yaml/locationIndex.test.ts
```

Expected: PASS.

### Task 5: Verify No Existing Behavior Changed

**Files:**
- Existing YAML tests only.

- [ ] **Step 1: Run focused YAML tests**

Run:

```bash
pnpm --dir packages/core exec vitest run yaml/import.test.ts yaml/export.test.ts yaml/locationIndex.test.ts yaml/jsYamlParser.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run type-check**

Run:

```bash
pnpm --dir packages/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Report remaining migration steps**

Summarize that old `yaml` code still powers production import/export, while the new `js-yaml` facade is ready for the next migration step: moving diagnostics from `parsed.doc` to `parsed.locations`.
