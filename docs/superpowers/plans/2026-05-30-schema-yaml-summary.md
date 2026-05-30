# Schema YAML Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `nkdk schema <target>` return compact YAML summaries for LLM use, keep exact JSON Schema behind `--json-schema`, and add filtering keys described in the design spec.

**Architecture:** Core owns schema summarization: it receives an already exported JSON Schema, turns top-level `properties` into `fields`, filters them, and recursively removes empty values. CLI stays thin: it resolves the target schema through existing core functions, validates option combinations, then prints YAML, plain key lists, or exact JSON Schema.

**Tech Stack:** TypeScript, TypeBox JSON Schema, Commander, `yaml.stringify`, Vitest, pnpm workspaces.

---

## File Structure

- Create `packages/core/metadata/validation/schemaSummary.ts`
  - Builds YAML summary objects from JSON Schema.
  - Selects fields by required-only, broad search, exact search, and optional key-term filter.
  - Recursively removes empty values from normalized output.

- Create `packages/core/metadata/validation/schemaSummary.test.ts`
  - Unit tests for the full example from the design spec.
  - Unit tests for `anyOf` object branch extraction, search through refs, empty cleanup, and plain key selection.

- Modify `packages/core/index.ts`
  - Export summary helpers for `@nakidka/cli`.

- Modify `packages/cli/src/commands/schema.ts`
  - Rename behavior from “always print JSON Schema” to “print YAML summary unless `--json-schema` is set”.
  - Keep exact JSON Schema behavior in `--json-schema`, with `--inline` only allowed in that mode.
  - Print `--keys` as plain text.

- Modify `packages/cli/src/commands/schema.test.ts`
  - Update existing tests for the new default YAML behavior.
  - Add tests for `--json-schema`, `--keys`, `--required`, `--search`, `--exact`, and invalid option combinations.

- Modify `packages/cli/src/cli.ts`
  - Add Commander options: `--json-schema`, `--keys [terms]`, `--required`, `--search <terms>`, `--exact`.
  - Update command description and option help text.

- Modify `/Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md`
  - Replace old “full JSON Schema first” guidance with YAML summary-first commands.
  - Keep `--json-schema` as the fallback exact source.

## Preconditions

- Work inside `/Users/nikita/git/nakidka-core/.worktrees/schema-yaml-summary`.
- Before changing `packages/core/metadata/**`, read:
  - `.agents/knowledge/metadata/INDEX.md`
  - `.agents/knowledge/metadata/sources-of-truth.md`
- Do not modify XML fixtures.
- Baseline already checked in this worktree:
  - `pnpm install` completed.
  - `pnpm test` passed: graph 89 tests, core 4172 tests with 5 skipped, cli 51 tests.

---

### Task 1: Core Schema Summary Helper

**Files:**
- Create: `packages/core/metadata/validation/schemaSummary.ts`
- Create: `packages/core/metadata/validation/schemaSummary.test.ts`
- Modify: `packages/core/index.ts`

- [ ] **Step 1: Write failing tests for schema summary behavior**

Create `packages/core/metadata/validation/schemaSummary.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  listSchemaSummaryKeys,
  summarizeJSONSchema,
  type SchemaSummary,
} from "./schemaSummary"

const exampleSchema = {
  type: "object",
  required: ["Вид"],
  properties: {
    Вид: {
      type: "string",
      const: "ПолеВвода",
    },
    ПутьКДанным: {
      type: "string",
      description: "Путь к данным формы",
      examples: ["Объект.Код"],
      enum: [],
    },
    Видимость: {
      type: "string",
      const: "Ложь",
      description: "Указывать только когда элемент нужно скрыть",
      examples: [],
    },
    Пустое: {
      type: "object",
      properties: {},
      examples: [],
      description: "",
    },
  },
} as const

const expectedFullSummary: SchemaSummary = {
  fields: [
    {
      key: "Вид",
      required: true,
      type: ["string"],
      const: "ПолеВвода",
    },
    {
      key: "ПутьКДанным",
      required: false,
      type: ["string"],
      description: "Путь к данным формы",
      examples: ["Объект.Код"],
    },
    {
      key: "Видимость",
      required: false,
      type: ["string"],
      const: "Ложь",
      description: "Указывать только когда элемент нужно скрыть",
    },
    {
      key: "Пустое",
      required: false,
      type: ["object"],
    },
  ],
}

describe("schemaSummary", () => {
  it("returns all top-level fields as a cleaned YAML summary", () => {
    expect(summarizeJSONSchema(exampleSchema)).toEqual(expectedFullSummary)
  })

  it("returns plain keys and filters key terms by partial case-insensitive match", () => {
    expect(listSchemaSummaryKeys(exampleSchema)).toEqual(["Вид", "ПутьКДанным", "Видимость", "Пустое"])
    expect(listSchemaSummaryKeys(exampleSchema, { keyTerms: "путь|видим" })).toEqual([
      "ПутьКДанным",
      "Видимость",
    ])
  })

  it("returns required fields in the same field-summary shape", () => {
    expect(summarizeJSONSchema(exampleSchema, { requiredOnly: true })).toEqual({
      fields: [
        {
          key: "Вид",
          required: true,
          type: ["string"],
          const: "ПолеВвода",
        },
      ],
    })
    expect(listSchemaSummaryKeys(exampleSchema, { requiredOnly: true })).toEqual(["Вид"])
  })

  it("searches keys and nested string values, returning the same field-summary shape", () => {
    expect(summarizeJSONSchema(exampleSchema, { search: "путь|скрыт" })).toEqual({
      fields: [
        {
          key: "ПутьКДанным",
          required: false,
          type: ["string"],
          description: "Путь к данным формы",
          examples: ["Объект.Код"],
        },
        {
          key: "Видимость",
          required: false,
          type: ["string"],
          const: "Ложь",
          description: "Указывать только когда элемент нужно скрыть",
        },
      ],
    })
    expect(listSchemaSummaryKeys(exampleSchema, { search: "путь|скрыт" })).toEqual([
      "ПутьКДанным",
      "Видимость",
    ])
  })

  it("returns one exact field when exact search matches a top-level key", () => {
    expect(summarizeJSONSchema(exampleSchema, { search: "ПутьКДанным", exact: true })).toEqual({
      fields: [
        {
          key: "ПутьКДанным",
          required: false,
          type: ["string"],
          description: "Путь к данным формы",
          examples: ["Объект.Код"],
        },
      ],
    })
  })

  it("returns undefined when selection becomes empty after cleanup", () => {
    expect(summarizeJSONSchema(exampleSchema, { search: "нет совпадений" })).toBeUndefined()
    expect(listSchemaSummaryKeys(exampleSchema, { search: "нет совпадений" })).toEqual([])
  })

  it("extracts object fields from anyOf branches and ignores scalar branches", () => {
    const schema = {
      anyOf: [
        { type: "string" },
        {
          type: "object",
          required: ["Имя"],
          properties: {
            Имя: { type: "string" },
          },
        },
      ],
    }

    expect(summarizeJSONSchema(schema)).toEqual({
      fields: [
        {
          key: "Имя",
          required: true,
          type: ["string"],
        },
      ],
    })
  })

  it("searches refs without renaming the ref keyword", () => {
    const schema = {
      type: "object",
      properties: {
        Элементы: {
          type: "object",
          additionalProperties: {
            oneOf: [{ $ref: "nkdk://schema/InputField" }, { $ref: "nkdk://schema/Button" }],
          },
        },
      },
    }

    expect(summarizeJSONSchema(schema, { search: "InputField" })).toEqual({
      fields: [
        {
          key: "Элементы",
          required: false,
          type: ["object"],
          additionalProperties: {
            oneOf: [{ $ref: "nkdk://schema/InputField" }, { $ref: "nkdk://schema/Button" }],
          },
        },
      ],
    })
  })
})
```

- [ ] **Step 2: Run the core summary tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaSummary.test.ts --no-isolate
```

Expected: FAIL with module resolution error for `./schemaSummary`.

- [ ] **Step 3: Implement `schemaSummary.ts`**

Create `packages/core/metadata/validation/schemaSummary.ts`:

```ts
export interface SchemaSummary {
  fields: SchemaFieldSummary[]
}

export interface SchemaFieldSummary {
  key: string
  required: boolean
  [name: string]: unknown
}

export interface SchemaSummaryOptions {
  requiredOnly?: boolean
  search?: string
  exact?: boolean
  keyTerms?: string
}

type JsonObject = Record<string, unknown>

const compositeSchemaKeys = ["anyOf", "oneOf", "allOf"] as const

export function summarizeJSONSchema(schema: unknown, options: SchemaSummaryOptions = {}): SchemaSummary | undefined {
  const fields = selectFieldSummaries(schema, options)
  return cleanEmpty({ fields }) as SchemaSummary | undefined
}

export function listSchemaSummaryKeys(schema: unknown, options: SchemaSummaryOptions = {}): string[] {
  return selectFieldSummaries(schema, options).map((field) => field.key)
}

export function parseSchemaSearchTerms(value: string | undefined): string[] {
  if (value === undefined) return []
  return value
    .split("|")
    .map((term) => term.trim().toLocaleLowerCase("ru"))
    .filter((term) => term.length > 0)
}

function selectFieldSummaries(schema: unknown, options: SchemaSummaryOptions): SchemaFieldSummary[] {
  let fields = collectFieldSummaries(schema)

  if (options.requiredOnly === true) {
    fields = fields.filter((field) => field.required)
  }

  if (options.search !== undefined) {
    fields = options.exact === true
      ? fields.filter((field) => field.key === options.search?.trim())
      : fields.filter((field) => matchesTerms(field, parseSchemaSearchTerms(options.search)))
  }

  const keyTerms = parseSchemaSearchTerms(options.keyTerms)
  if (keyTerms.length > 0) {
    fields = fields.filter((field) => matchesTextTerms(field.key, keyTerms))
  }

  return fields
}

function collectFieldSummaries(schema: unknown): SchemaFieldSummary[] {
  const fields = new Map<string, SchemaFieldSummary>()

  for (const objectSchema of collectObjectSchemas(schema)) {
    const required = readRequiredSet(objectSchema)
    const properties = objectSchema["properties"]
    if (!isRecord(properties)) continue

    for (const [key, propertySchema] of Object.entries(properties)) {
      const normalized = normalizeSchemaValue(propertySchema)
      const base: SchemaFieldSummary = { key, required: required.has(key) }
      const next = isRecord(normalized)
        ? ({ ...base, ...normalized } as SchemaFieldSummary)
        : ({ ...base, schema: normalized } as SchemaFieldSummary)
      const cleaned = cleanEmpty(next) as SchemaFieldSummary | undefined
      if (!cleaned) continue

      const previous = fields.get(key)
      fields.set(key, previous ? mergeFieldSummaries(previous, cleaned) : cleaned)
    }
  }

  return [...fields.values()]
}

function collectObjectSchemas(schema: unknown, seen = new Set<unknown>()): JsonObject[] {
  if (!isRecord(schema) || seen.has(schema)) return []
  seen.add(schema)

  const result: JsonObject[] = []
  if (isRecord(schema["properties"])) result.push(schema)

  for (const key of compositeSchemaKeys) {
    const branches = schema[key]
    if (!Array.isArray(branches)) continue
    for (const branch of branches) {
      result.push(...collectObjectSchemas(branch, seen))
    }
  }

  return result
}

function readRequiredSet(schema: JsonObject): Set<string> {
  const required = schema["required"]
  if (!Array.isArray(required)) return new Set()
  return new Set(required.filter((item): item is string => typeof item === "string"))
}

function normalizeSchemaValue(value: unknown, key?: string): unknown {
  if (typeof value === "string" && key === "type") return [value]

  if (Array.isArray(value)) {
    return cleanEmpty(value.map((item) => normalizeSchemaValue(item)))
  }

  if (isRecord(value)) {
    const normalized: JsonObject = {}
    for (const [entryKey, entryValue] of Object.entries(value)) {
      normalized[entryKey] = normalizeSchemaValue(entryValue, entryKey)
    }
    return cleanEmpty(normalized)
  }

  return value
}

function mergeFieldSummaries(left: SchemaFieldSummary, right: SchemaFieldSummary): SchemaFieldSummary {
  const merged: JsonObject = { ...left }

  for (const [key, value] of Object.entries(right)) {
    if (key === "required") {
      merged[key] = left.required || right.required
      continue
    }
    if (!(key in merged)) {
      merged[key] = value
      continue
    }
    merged[key] = mergeSummaryValue(merged[key], value)
  }

  return cleanEmpty(merged) as SchemaFieldSummary
}

function mergeSummaryValue(left: unknown, right: unknown): unknown {
  if (JSON.stringify(left) === JSON.stringify(right)) return left

  if (Array.isArray(left) || Array.isArray(right)) {
    return uniqueByJSON([...(Array.isArray(left) ? left : [left]), ...(Array.isArray(right) ? right : [right])])
  }

  if (isRecord(left) && isRecord(right)) {
    const merged: JsonObject = { ...left }
    for (const [key, value] of Object.entries(right)) {
      merged[key] = key in merged ? mergeSummaryValue(merged[key], value) : value
    }
    return cleanEmpty(merged)
  }

  return uniqueByJSON([left, right])
}

function uniqueByJSON(values: unknown[]): unknown[] {
  const seen = new Set<string>()
  const result: unknown[] = []

  for (const value of values) {
    const key = JSON.stringify(value)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }

  return result
}

function matchesTerms(field: SchemaFieldSummary, terms: string[]): boolean {
  if (terms.length === 0) return false
  return terms.some((term) => collectSearchText(field).some((text) => text.includes(term)))
}

function matchesTextTerms(value: string, terms: string[]): boolean {
  const normalized = value.toLocaleLowerCase("ru")
  return terms.some((term) => normalized.includes(term))
}

function collectSearchText(value: unknown): string[] {
  if (typeof value === "string") return [value.toLocaleLowerCase("ru")]
  if (typeof value === "number" || typeof value === "boolean") return [String(value).toLocaleLowerCase("ru")]
  if (Array.isArray(value)) return value.flatMap((item) => collectSearchText(item))
  if (!isRecord(value)) return []

  const result: string[] = []
  for (const [key, entryValue] of Object.entries(value)) {
    result.push(key.toLocaleLowerCase("ru"))
    result.push(...collectSearchText(entryValue))
  }
  return result
}

function cleanEmpty(value: unknown): unknown {
  if (value === null || value === undefined || value === "") return undefined

  if (Array.isArray(value)) {
    const items = value.map((item) => cleanEmpty(item)).filter((item) => item !== undefined)
    return items.length === 0 ? undefined : items
  }

  if (isRecord(value)) {
    const result: JsonObject = {}
    for (const [key, entryValue] of Object.entries(value)) {
      const cleaned = cleanEmpty(entryValue)
      if (cleaned !== undefined) result[key] = cleaned
    }
    return Object.keys(result).length === 0 ? undefined : result
  }

  return value
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
```

- [ ] **Step 4: Export the core helper from the public entrypoint**

Modify `packages/core/index.ts` near the existing validation exports:

```ts
export {
  listSchemaSummaryKeys,
  parseSchemaSearchTerms,
  summarizeJSONSchema,
  type SchemaFieldSummary,
  type SchemaSummary,
  type SchemaSummaryOptions,
} from "./metadata/validation/schemaSummary"
```

- [ ] **Step 5: Run the core summary tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaSummary.test.ts --no-isolate
```

Expected: PASS for `schemaSummary.test.ts`.

- [ ] **Step 6: Commit core summary helper**

```bash
git add packages/core/metadata/validation/schemaSummary.ts packages/core/metadata/validation/schemaSummary.test.ts packages/core/index.ts
git commit -m "feat: :sparkles: добавить YAML-сводку schema"
```

---

### Task 2: CLI Schema Modes

**Files:**
- Modify: `packages/cli/src/commands/schema.ts`
- Modify: `packages/cli/src/commands/schema.test.ts`
- Modify: `packages/cli/src/cli.ts`

- [ ] **Step 1: Replace CLI schema tests with new behavior tests**

Replace `packages/cli/src/commands/schema.test.ts` with:

```ts
import { afterEach, describe, expect, it, vi } from "vitest"
import { printSchema } from "./schema"

describe("schema command", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("prints YAML summary by schema name by default", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("InputField", {})

    const text = String(stdout.mock.calls[0]?.[0])
    expect(text).toContain("fields:")
    expect(text).toContain("key: Вид")
    expect(text).toContain("const: ПолеВвода")
    expect(() => JSON.parse(text)).toThrow()
  })

  it("prints YAML summary for a project file by default", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("Справочник/Товары/Свойства.yaml", {})

    const text = String(stdout.mock.calls[0]?.[0])
    expect(text).toContain("fields:")
    expect(text).toContain("key: Реквизиты")
    expect(text).toContain("nkdk://schema/MetadataCatalogAttribute")
  })

  it("prints exact compact JSON Schema when requested", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("Справочник/Товары/Свойства.yaml", { jsonSchema: true })

    const text = String(stdout.mock.calls[0]?.[0])
    const schema = JSON.parse(text)
    expect(schema.properties.Реквизиты.additionalProperties).toEqual({ $ref: "nkdk://schema/MetadataCatalogAttribute" })
  })

  it("prints inline JSON Schema only in json-schema mode", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("Справочник/Товары/Свойства.yaml", { jsonSchema: true, inline: true })

    const text = String(stdout.mock.calls[0]?.[0])
    expect(text).not.toContain("nkdk://schema/MetadataCatalogAttribute")
    expect(JSON.parse(text).properties).toHaveProperty("Реквизиты")
  })

  it("prints plain keys and filters key terms", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("InputField", { keys: "путь|вид" })

    const text = String(stdout.mock.calls[0]?.[0])
    expect(text).toContain("Вид\n")
    expect(text).toContain("ПутьКДанным\n")
    expect(text).not.toContain("fields:")
  })

  it("prints required YAML summary and required keys", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("InputField", { required: true })
    expect(String(stdout.mock.calls[0]?.[0])).toContain("key: Вид")

    stdout.mockClear()
    await printSchema("InputField", { required: true, keys: true })
    expect(String(stdout.mock.calls[0]?.[0])).toBe("Вид\n")
  })

  it("searches broadly and keeps the YAML summary shape", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("InputField", { search: "путь" })

    const text = String(stdout.mock.calls[0]?.[0])
    expect(text).toContain("fields:")
    expect(text).toContain("key: ПутьКДанным")
    expect(text).not.toContain("matched:")
  })

  it("prints search keys as plain text", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("InputField", { search: "путь", keys: true })

    const text = String(stdout.mock.calls[0]?.[0])
    expect(text).toContain("ПутьКДанным\n")
    expect(text).not.toContain("fields:")
  })

  it("prints exact search summary and exact search keys", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("InputField", { search: "ПутьКДанным", exact: true })
    expect(String(stdout.mock.calls[0]?.[0])).toContain("key: ПутьКДанным")

    stdout.mockClear()
    await printSchema("InputField", { search: "ПутьКДанным", exact: true, keys: true })
    expect(String(stdout.mock.calls[0]?.[0])).toBe("ПутьКДанным\n")
  })

  it("prints nothing when key or search selection is empty", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("InputField", { keys: "нет совпадений" })
    await printSchema("InputField", { search: "нет совпадений" })

    expect(stdout).not.toHaveBeenCalled()
  })

  it("resolves relative file from explicit project", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("Документ/Заказ/Свойства.yaml", { project: process.cwd() })

    const text = String(stdout.mock.calls[0]?.[0])
    expect(text).toContain("key: СтандартныеРеквизиты")
  })

  it("does not write stdout when schema lookup fails", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await expect(printSchema("UnknownSchema", {})).rejects.toThrow(/Неизвестная JSON Schema/)

    expect(stdout).not.toHaveBeenCalled()
  })

  it("rejects incompatible option combinations before writing stdout", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await expect(printSchema("InputField", { inline: true })).rejects.toThrow(/--inline можно использовать только/)
    await expect(printSchema("InputField", { jsonSchema: true, keys: true })).rejects.toThrow(
      /--json-schema нельзя сочетать/
    )
    await expect(printSchema("InputField", { required: true, search: "путь" })).rejects.toThrow(
      /Нельзя одновременно использовать/
    )
    await expect(printSchema("InputField", { exact: true })).rejects.toThrow(/--exact можно использовать только/)
    await expect(printSchema("InputField", { search: " " })).rejects.toThrow(/--search требует непустой запрос/)
    await expect(printSchema("InputField", { search: "НетТакогоПоля", exact: true })).rejects.toThrow(
      /Поле "НетТакогоПоля" не найдено/
    )

    expect(stdout).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run CLI tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: FAIL because `printSchema` is not exported and new options are unsupported.

- [ ] **Step 3: Implement CLI command behavior**

Replace `packages/cli/src/commands/schema.ts` with:

```ts
import {
  exportJSONSchemaForProjectFile,
  exportJSONSchemaForSchemaName,
  listSchemaSummaryKeys,
  parseSchemaSearchTerms,
  summarizeJSONSchema,
} from "@nakidka/core"
import { stringify } from "yaml"

export interface SchemaCommandOptions {
  project?: string
  inline?: boolean
  jsonSchema?: boolean
  keys?: boolean | string
  required?: boolean
  search?: string
  exact?: boolean
}

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

export const printSchema = async (target: string, options: SchemaCommandOptions): Promise<void> => {
  validateSchemaOptions(options)

  const schema = resolveJSONSchema(target, options)

  if (options.jsonSchema === true) {
    process.stdout.write(`${JSON.stringify(schema, null, 2)}\n`)
    return
  }

  if (options.keys !== undefined) {
    const keys = listSchemaSummaryKeys(schema, {
      requiredOnly: options.required === true,
      search: options.search,
      exact: options.exact === true,
      keyTerms: typeof options.keys === "string" ? options.keys : undefined,
    })
    if (keys.length > 0) process.stdout.write(`${keys.join("\n")}\n`)
    return
  }

  const summary = summarizeJSONSchema(schema, {
    requiredOnly: options.required === true,
    search: options.search,
    exact: options.exact === true,
  })

  if (options.exact === true && !summary) {
    throw new Error(`Поле "${options.search?.trim()}" не найдено в схеме "${target}"`)
  }

  if (summary) process.stdout.write(stringify(summary))
}

export const printJSONSchema = async (target: string, options: SchemaCommandOptions): Promise<void> => {
  await printSchema(target, { ...options, jsonSchema: true })
}

function resolveJSONSchema(target: string, options: SchemaCommandOptions): unknown {
  const mode = options.inline === true ? "inline" : "externalRefs"

  return (options.project || target.toLowerCase().endsWith(".yaml"))
    ? exportJSONSchemaForProjectFile({
        context,
        filePath: target,
        projectDir: options.project,
        mode,
      })
    : exportJSONSchemaForSchemaName({
        context,
        name: target,
        mode,
      })
}

function validateSchemaOptions(options: SchemaCommandOptions): void {
  if (options.inline === true && options.jsonSchema !== true) {
    throw new Error("--inline можно использовать только вместе с --json-schema")
  }

  if (options.jsonSchema === true && (options.keys !== undefined || options.required === true || options.search)) {
    throw new Error("--json-schema нельзя сочетать с --keys, --required или --search")
  }

  if (options.required === true && options.search !== undefined) {
    throw new Error("Нельзя одновременно использовать --required и --search")
  }

  if (options.exact === true && options.search === undefined) {
    throw new Error("--exact можно использовать только вместе с --search")
  }

  if (options.search !== undefined && parseSchemaSearchTerms(options.search).length === 0) {
    throw new Error("--search требует непустой запрос")
  }
}
```

- [ ] **Step 4: Update Commander wiring**

Modify the schema command in `packages/cli/src/cli.ts`.

Replace the existing import:

```ts
import { printJSONSchema } from "./commands/schema"
```

with:

```ts
import { printSchema } from "./commands/schema"
```

Replace the `schema` command block with:

```ts
program
  .command("schema")
  .description("Показать YAML-сводку или JSON Schema для YAML-файла проекта или имени схемы")
  .argument("<target>", "путь к YAML-файлу проекта или имя схемы")
  .option("--project <yamlDir>", "путь к корню YAML-проекта")
  .option("--json-schema", "показать точную JSON Schema вместо YAML-сводки")
  .option("--inline", "развернуть составные подсхемы в одном JSON; используется только с --json-schema")
  .option("--keys [terms]", "показать только имена ключей; terms фильтруются через |")
  .option("--required", "показать только обязательные поля")
  .option("--search <terms>", "найти поля по частям строк; terms разделяются через |")
  .option("--exact", "для --search требовать точное имя поля")
  .action((target: string, opts: {
    project?: string
    jsonSchema?: boolean
    inline?: boolean
    keys?: boolean | string
    required?: boolean
    search?: string
    exact?: boolean
  }) => {
    run(() => printSchema(target, opts))
  })
```

- [ ] **Step 5: Run CLI tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: PASS for `schema.test.ts`.

- [ ] **Step 6: Run focused core and CLI schema tests together**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaSummary.test.ts metadata/validation/projectFileSchema.test.ts metadata/validation/schemaRegistry.test.ts --no-isolate
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: all listed tests PASS.

- [ ] **Step 7: Commit CLI schema modes**

```bash
git add packages/cli/src/commands/schema.ts packages/cli/src/commands/schema.test.ts packages/cli/src/cli.ts
git commit -m "feat: :sparkles: обновить вывод schema"
```

---

### Task 3: External Config Skill Update

**Files:**
- Modify: `/Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md`

- [ ] **Step 1: Read the current external skill**

Run:

```bash
sed -n '1,260p' /Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md
```

Expected: output contains the current “Получение схемы” section with old `nkdk schema` JSON Schema guidance.

- [ ] **Step 2: Update the schema guidance in the external skill**

Edit `/Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md`.

Replace the “Получение схемы” section with this text:

```markdown
## Получение схемы

Построй путь будущего файла относительно корня YAML-проекта и сначала получи YAML-сводку схемы:

```bash
pnpm --filter @nakidka/cli dev schema "<relative-yaml-file>" --project "<yaml-project-dir>"
```

Если в окружении доступна установленная команда `nkdk`, можно использовать эквивалент:

```bash
nkdk schema "<relative-yaml-file>" --project "<yaml-project-dir>"
```

Если целевой YAML-каталог не является pnpm workspace и команда выше отвечает `No projects found`,
запускай CLI из каталога workspace, где доступен `@nakidka/cli`, но `--project` всегда указывай на целевой
YAML-проект:

```bash
cd /Users/nikita/git/nakidka-core
pnpm --filter @nakidka/cli dev schema "<relative-yaml-file>" --project "<yaml-project-dir>"
```

Такой запуск использует CLI как инструмент получения схемы; не читай исходный код `nakidka-core`, если пользователь
этого не просил.

Примеры путей, которые понимает команда:

```text
Справочник/Товары/Свойства.yaml
Документ/Заказ/Свойства.yaml
Документ/Заказ/Формы/ФормаДокумента/Форма.yaml
```

`nkdk schema` пока понимает не все верхнеуровневые каталоги из таблицы. Надёжно поддержаны `Справочник`,
`Документ`, `Перечисление`, `Обработка`, `ЖурналДокументов`, `HTTPСервис`, `РегистрСведений`,
`РегистрНакопления`, `ПланОбмена` и формы внутри поддержанных объектов.

Используй быстрые срезы перед созданием YAML:

```bash
nkdk schema "<relative-yaml-file>" --required --keys --project "<yaml-project-dir>"
nkdk schema "<schema-name>" --keys "путь|вид|тип"
nkdk schema "<schema-name>" --search "путь|тип" --keys
nkdk schema "<schema-name>" --search "<field-name>" --exact
```

- `--required --keys` показывает обязательные ключи.
- `--keys "термин|термин"` ищет только по именам ключей.
- `--search "термин|термин" --keys` ищет шире: по ключам и строкам внутри описания поля.
- `--search "<field-name>" --exact` даёт точечную YAML-сводку одного поля.

Если YAML-сводки недостаточно, запроси точную JSON Schema:

```bash
nkdk schema "<relative-yaml-file>" --project "<yaml-project-dir>" --json-schema
nkdk schema "<schema-name>" --json-schema
```

Полный разворот JSON Schema одним ответом используй только для отладки:

```bash
nkdk schema "<relative-yaml-file>" --project "<yaml-project-dir>" --json-schema --inline
```

Если команда отвечает ошибкой `Ожидались пути вида ...`, не правь YAML вслепую: уточни относительный путь по существующей структуре проекта или соседнему объекту.
```

If the sandbox blocks writing to `/Users/nikita/git/new_config_add_item_test`, ask the user to approve editing that external repository path, then repeat this step.

- [ ] **Step 3: Verify the external skill text**

Run:

```bash
rg -n "YAML-сводку|--json-schema|--required --keys|--search" /Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md
```

Expected: output includes the new YAML-summary-first guidance and `--json-schema` fallback.

- [ ] **Step 4: Commit repository changes before reporting the external edit**

The external skill is outside `/Users/nikita/git/nakidka-core`; do not include it in this repository commit.

Run:

```bash
git status --short
```

Expected: no new repository changes from this task.

Report the external skill update in the final implementation summary because it cannot be represented by a commit in `nakidka-core`.

---

### Task 4: Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Run package type checks for touched packages**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
pnpm --filter @nakidka/cli exec tsc --noEmit
```

Expected: both commands exit with code `0`.

- [ ] **Step 2: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass. Baseline before implementation was graph 89 tests, core 4172 tests with 5 skipped, cli 51 tests.

- [ ] **Step 3: Manually smoke-test CLI output shape**

Run:

```bash
pnpm --filter @nakidka/cli dev schema InputField
pnpm --filter @nakidka/cli dev schema InputField --keys "путь|вид"
pnpm --filter @nakidka/cli dev schema InputField --required --keys
pnpm --filter @nakidka/cli dev schema InputField --search ПутьКДанным --exact
pnpm --filter @nakidka/cli dev schema InputField --json-schema
```

Expected:

- first command prints YAML starting with `fields:`;
- second command prints plain key names only;
- third command prints `Вид`;
- fourth command prints YAML with one field `ПутьКДанным`;
- fifth command prints parseable JSON Schema.

- [ ] **Step 4: Confirm git status before handoff**

Run:

```bash
git status --short
```

Expected: clean working tree in `/Users/nikita/git/nakidka-core/.worktrees/schema-yaml-summary`.

- [ ] **Step 5: Final commit if verification changed tracked files**

If formatting or documentation changed during verification, commit those changes:

```bash
git add <changed-files>
git commit -m "chore: :wrench: завершить проверку schema"
```

Expected: commit created only when `git status --short` showed tracked changes.
