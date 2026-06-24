# MetadataValue Double-Quoted String YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Печатать строковые `MetadataValue` в YAML как `"..."`, а не как `'"..."'`, сохраняя строковый тип при импорте quoted scalar.

**Architecture:** Добавить внутренний YAML-helper для double-quoted string scalar и side-channel для стиля scalar при парсинге YAML. `MetadataValue` будет производить/потреблять этот helper, а общий YAML-слой будет превращать helper в `yaml.Scalar` с `Scalar.QUOTE_DOUBLE`. Обычные строки вне `MetadataValue` остаются простыми строками.

**Tech Stack:** TypeScript, Vitest, пакет `yaml@2.8.3`, существующие `metadata/orchestration` rules.

---

## File Structure

- Create: `packages/core/yaml/explicitString.ts`
  - Хранит внутреннюю обёртку `ExplicitYAMLString`, фабрику `explicitYAMLString(value)`, проверку `isExplicitYAMLString(value)`, разворачивание `unwrapExplicitYAMLString(value)` и side-channel `markDoubleQuotedScalar(parent, key)` / `asExplicitYAMLStringIfMarked(parent, key, value)`.
  - Обёртка не является публичным YAML-договором и должна потребляться до JSON Schema/валидации.

- Modify: `packages/core/yaml/export.ts`
  - Перед `stringify` рекурсивно заменить `ExplicitYAMLString` на `new Scalar(value)` с `node.type = Scalar.QUOTE_DOUBLE`.
  - Не менять существующую логику удаления финального перевода строки.

- Modify: `packages/core/yaml/import.ts`
  - Заменить простой `parse()` на `parseDocument()` и ручное построение JS-значений из узлов.
  - При обходе map/seq записывать стиль double-quoted scalar в side-channel, но наружу отдавать обычные строки.
  - Сохранить существующую нормализацию `null -> undefined`.

- Modify: `packages/core/yaml/parseMetadataYaml.ts`
  - Использовать тот же helper построения JS-значений из `Document`, чтобы `ParsedYaml.data` тоже несла side-channel для `MetadataValue`.

- Modify: `packages/core/metadata/orchestration/property/fromYAML.ts`
  - Перед вызовом type-rule для свойства оборачивать `yaml[yamlKey]` через `asExplicitYAMLStringIfMarked(yaml, yamlKey, yamlValue)`.
  - Это покрывает прямые свойства типа `MetadataValue`.

- Modify: `packages/core/metadata/commonObjects/metadataValue/handlers.ts`
  - `string.toYAML` должен возвращать `explicitYAMLString(value)`, а не строку с кавычками внутри.
  - `string.fromYAML` должен принимать `ExplicitYAMLString` и возвращать `{ type: "string", value }`.

- Modify: `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`
  - В `heuristicFromYAML` первым делом распознавать `ExplicitYAMLString`.
  - Остальные эвристики оставить в прежнем порядке.

- Modify: `packages/core/metadata/commonObjects/metadataValue/types.ts`
  - Расширить внутренний TypeScript-тип `MetadataSingleValueYAML` на `ExplicitYAMLString`.
  - JSON Schema оставить прежней: публичный YAML остаётся строкой/числом, helper не должен попадать в пользовательскую схему.

- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.ts`
  - Перед `importMetadataValueFromYAML` оборачивать `yamlValue` через `asExplicitYAMLStringIfMarked(data, name, yamlValue)`.
  - Это покрывает `ПараметрыВыбора`, где `valueType` неизвестен.

- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts`
  - Перед импортом каждого элемента оборачивать значение через `asExplicitYAMLStringIfMarked(data, index, value)`.
  - Это сохраняет строки внутри массивов `MetadataValue`.

- Modify tests:
  - `packages/core/yaml/export.test.ts`
  - `packages/core/yaml/import.test.ts`
  - `packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts`
  - `packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts`
  - `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`
  - `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`
  - `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`

- Modify YAML fixtures:
  - All `packages/core/metadata/**/__fixtures__/sync/yaml/**/*.yaml` occurrences of old string-encoded `MetadataValue` form like `'"456"'`, `'"Строка"'`, `'"Текст"'`, `'"Значение"'`, `'"ФЛ"'` that are produced by `MetadataValue`.
  - Do not change XML fixtures.

---

### Task 1: YAML Explicit String Helper And Export

**Files:**
- Create: `packages/core/yaml/explicitString.ts`
- Modify: `packages/core/yaml/export.ts`
- Test: `packages/core/yaml/export.test.ts`

- [ ] **Step 1: Write the failing export tests**

Append these tests to `packages/core/yaml/export.test.ts`:

```ts
import { explicitYAMLString } from "./explicitString"
```

```ts
  it("prints explicit YAML strings as double-quoted scalars", () => {
    const yaml = exportToYAML({ "Отбор.Код": explicitYAMLString("456") })

    expect(yaml).toBe('Отбор.Код: "456"')
  })

  it("escapes explicit YAML string content through double-quoted scalar rules", () => {
    const yaml = exportToYAML({ Значение: explicitYAMLString('a"b') })

    expect(yaml).toBe('Значение: "a\\"b"')
  })

  it("does not force ordinary strings into double quotes", () => {
    const yaml = exportToYAML({ Имя: "Тест" })

    expect(yaml).toBe("Имя: Тест")
  })
```

- [ ] **Step 2: Run export tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/yaml/export.test.ts --no-isolate
```

Expected: FAIL because `./explicitString` does not exist.

- [ ] **Step 3: Add `explicitString.ts`**

Create `packages/core/yaml/explicitString.ts`:

```ts
export type YAMLStyleKey = string | number

const explicitYAMLStringKind = Symbol("explicitYAMLString")
const doubleQuotedScalarMarks = new WeakMap<object, Set<YAMLStyleKey>>()

export interface ExplicitYAMLString {
  readonly [explicitYAMLStringKind]: true
  readonly value: string
}

export function explicitYAMLString(value: string): ExplicitYAMLString {
  return {
    [explicitYAMLStringKind]: true,
    value,
  }
}

export function isExplicitYAMLString(value: unknown): value is ExplicitYAMLString {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as { [explicitYAMLStringKind]?: unknown })[explicitYAMLStringKind] === true &&
    typeof (value as { value?: unknown }).value === "string"
  )
}

export function unwrapExplicitYAMLString(value: unknown): unknown {
  return isExplicitYAMLString(value) ? value.value : value
}

export function markDoubleQuotedScalar(parent: object, key: YAMLStyleKey): void {
  const marks = doubleQuotedScalarMarks.get(parent)
  if (marks !== undefined) {
    marks.add(key)
    return
  }
  doubleQuotedScalarMarks.set(parent, new Set([key]))
}

export function asExplicitYAMLStringIfMarked(parent: unknown, key: YAMLStyleKey, value: unknown): unknown {
  if (parent === null || typeof parent !== "object") return value
  if (typeof value !== "string") return value
  return doubleQuotedScalarMarks.get(parent)?.has(key) === true ? explicitYAMLString(value) : value
}
```

- [ ] **Step 4: Convert explicit strings to `Scalar.QUOTE_DOUBLE` in export**

Modify `packages/core/yaml/export.ts`:

```ts
import { Scalar, stringify } from "yaml"
import { isExplicitYAMLString } from "./explicitString"
```

Add this helper before `exportToYAML`:

```ts
const toYAMLNodes = (value: unknown): unknown => {
  if (isExplicitYAMLString(value)) {
    const scalar = new Scalar(value.value)
    scalar.type = Scalar.QUOTE_DOUBLE
    return scalar
  }

  if (Array.isArray(value)) return value.map(toYAMLNodes)

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toYAMLNodes(item)]))
  }

  return value
}
```

Change `exportToYAML` to call `stringify(toYAMLNodes(data), ...)`:

```ts
export const exportToYAML = <T>(data: T): string => {
  const yaml = stringify(toYAMLNodes(data), {
    indent: 2,
    lineWidth: 0,
    keepUndefined: true,
    nullStr: "",
  })
  return removeDocumentFinalLineEnding(yaml)
}
```

- [ ] **Step 5: Run export tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/yaml/export.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit YAML export helper**

Run:

```bash
git add packages/core/yaml/explicitString.ts packages/core/yaml/export.ts packages/core/yaml/export.test.ts
git commit -m "feat: :sparkles: печатать явные YAML-строки"
```

---

### Task 2: YAML Import Side-Channel

**Files:**
- Modify: `packages/core/yaml/import.ts`
- Modify: `packages/core/yaml/parseMetadataYaml.ts`
- Test: `packages/core/yaml/import.test.ts`

- [ ] **Step 1: Write failing import tests**

Append these imports to `packages/core/yaml/import.test.ts`:

```ts
import { asExplicitYAMLStringIfMarked, isExplicitYAMLString } from "./explicitString"
```

Append these tests:

```ts
  it("marks double-quoted scalar strings without changing public value", () => {
    const data = importFromYAML<Record<string, unknown>>('Отбор.Код: "456"')

    expect(data["Отбор.Код"]).toBe("456")
    expect(isExplicitYAMLString(asExplicitYAMLStringIfMarked(data, "Отбор.Код", data["Отбор.Код"]))).toBe(true)
  })

  it("does not mark plain numeric scalar as an explicit string", () => {
    const data = importFromYAML<Record<string, unknown>>("Отбор.Код: 456")

    expect(data["Отбор.Код"]).toBe(456)
    expect(asExplicitYAMLStringIfMarked(data, "Отбор.Код", data["Отбор.Код"])).toBe(456)
  })

  it("marks double-quoted strings inside sequences", () => {
    const data = importFromYAML<{ Значения: unknown[] }>('Значения:\n  - "456"\n  - 789')

    expect(data.Значения).toEqual(["456", 789])
    expect(isExplicitYAMLString(asExplicitYAMLStringIfMarked(data.Значения, 0, data.Значения[0]))).toBe(true)
    expect(asExplicitYAMLStringIfMarked(data.Значения, 1, data.Значения[1])).toBe(789)
  })
```

- [ ] **Step 2: Run import tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/yaml/import.test.ts --no-isolate
```

Expected: FAIL because `importFromYAML` uses `parse()` and does not record double-quoted scalar style.

- [ ] **Step 3: Implement node-based import in `import.ts`**

Replace `packages/core/yaml/import.ts` with this shape, preserving `convertNullToUndefined`:

```ts
import { readFile } from "fs/promises"
import { isMap, isScalar, isSeq, parseDocument, Scalar, type Document, type Node } from "yaml"
import { markDoubleQuotedScalar } from "./explicitString"

const convertNullToUndefined = <T>(value: T): T => {
  if (value === null) {
    return undefined as T
  }

  if (Array.isArray(value)) {
    return value.map(convertNullToUndefined) as T
  }

  if (typeof value === "object" && value !== null) {
    const result: any = {}
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = convertNullToUndefined(value[key])
      }
    }
    return result as T
  }

  return value
}

const scalarToJS = (node: Scalar): unknown => node.value

const nodeToJS = (node: Node | null | undefined): unknown => {
  if (node === null || node === undefined) return undefined
  if (isScalar(node)) return scalarToJS(node)

  if (isSeq(node)) {
    const result: unknown[] = []
    node.items.forEach((item, index) => {
      const value = nodeToJS(item as Node)
      result.push(value)
      if (isScalar(item) && item.type === Scalar.QUOTE_DOUBLE) markDoubleQuotedScalar(result, index)
    })
    return result
  }

  if (isMap(node)) {
    const result: Record<string, unknown> = {}
    for (const pair of node.items) {
      const keyNode = pair.key
      const valueNode = pair.value
      const keyValue = isScalar(keyNode) ? keyNode.value : nodeToJS(keyNode as Node)
      const key = String(keyValue)
      result[key] = nodeToJS(valueNode as Node)
      if (isScalar(valueNode) && valueNode.type === Scalar.QUOTE_DOUBLE) markDoubleQuotedScalar(result, key)
    }
    return result
  }

  return undefined
}

export const documentToJSWithScalarStyles = <T>(doc: Document): T => {
  return convertNullToUndefined(nodeToJS(doc.contents as Node) as T)
}

export const importFromYAML = <T>(data: string): T => {
  const doc = parseDocument(data)
  return documentToJSWithScalarStyles<T>(doc)
}

export const importFromYAMLFile = async <T>(filePath: string): Promise<T> => {
  const data = await readFile(filePath, "utf-8")
  return importFromYAML(data)
}
```

- [ ] **Step 4: Reuse node-based import in `parseMetadataYaml.ts`**

Modify `packages/core/yaml/parseMetadataYaml.ts`:

```ts
import { Document, LineCounter, parseDocument } from "yaml"
import { documentToJSWithScalarStyles } from "./import"
```

Change `parseMetadataYaml` data creation:

```ts
export function parseMetadataYaml(text: string): ParsedYaml {
  const lineCounter = new LineCounter()
  const doc = parseDocument(text, { lineCounter })
  const data = documentToJSWithScalarStyles(doc)
  return { text, doc, data, lineCounter }
}
```

- [ ] **Step 5: Run YAML tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/yaml/import.test.ts packages/core/yaml/export.test.ts packages/core/yaml/parseMetadataYaml.ts --no-isolate
```

Expected: PASS for `import.test.ts` and `export.test.ts`; Vitest will ignore `parseMetadataYaml.ts` if it has no tests, so rerun without it if the command reports no matching tests for that path:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/yaml/import.test.ts packages/core/yaml/export.test.ts --no-isolate
```

- [ ] **Step 6: Commit YAML import side-channel**

Run:

```bash
git add packages/core/yaml/import.ts packages/core/yaml/parseMetadataYaml.ts packages/core/yaml/import.test.ts
git commit -m "feat: :sparkles: сохранять стиль YAML-строк"
```

---

### Task 3: MetadataValue String Export And Import

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/handlers.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`
- Test: `packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts`

- [ ] **Step 1: Write failing `MetadataValue` tests**

In `packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts`, add:

```ts
import { exportToYAML } from "~/yaml/export"
import { isExplicitYAMLString } from "~/yaml/explicitString"
```

Append:

```ts
  it("exports string MetadataValue as an explicit YAML string marker", () => {
    const result = exportMetadataValueToYAML(
      mockContext,
      { type: "MetadataValue" } as any,
      { type: "string", value: "456" } as any
    )

    expect(isExplicitYAMLString(result)).toBe(true)
    expect(exportToYAML({ "Отбор.Код": result })).toBe('Отбор.Код: "456"')
  })
```

In `packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts`, add:

```ts
import { explicitYAMLString } from "~/yaml/explicitString"
```

Append:

```ts
  it("imports explicit YAML string marker as string MetadataValue without valueType", () => {
    const result = importMetadataValueFromYAML(mockContext, { type: "MetadataValue" } as any, explicitYAMLString("456") as any)

    expect(result).toEqual({ type: "string", value: "456" })
  })
```

- [ ] **Step 2: Run `MetadataValue` tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts --no-isolate
```

Expected: FAIL because `string.toYAML` still returns a quoted string literal and import does not recognise `ExplicitYAMLString`.

- [ ] **Step 3: Extend `MetadataValueYAML` internal type**

Modify imports in `packages/core/metadata/commonObjects/metadataValue/types.ts`:

```ts
import type { ExplicitYAMLString } from "~/yaml/explicitString"
```

Change:

```ts
export type MetadataSingleValueYAML = Static<typeof MetadataSingleValueJSONSchema>
```

to:

```ts
export type MetadataSingleValueYAML = Static<typeof MetadataSingleValueJSONSchema> | ExplicitYAMLString
```

Do not add `ExplicitYAMLString` to `MetadataSingleValueJSONSchema`.

- [ ] **Step 4: Change string handler to use explicit YAML strings**

Modify imports in `packages/core/metadata/commonObjects/metadataValue/handlers.ts`:

```ts
import { explicitYAMLString, isExplicitYAMLString } from "~/yaml/explicitString"
```

Change `primitiveValueHandlers.string.fromYAML`:

```ts
    fromYAML: (_ctx, data) => {
      if (isExplicitYAMLString(data)) {
        return { type: "string", value: data.value } satisfies MetadataStringValue
      }
      if (typeof data === "string") {
        return { type: "string", value: data } satisfies MetadataStringValue
      }
      if (typeof data === "number") {
        return { type: "string", value: String(data) } satisfies MetadataStringValue
      }
      return undefined
    },
```

Change `primitiveValueHandlers.string.toYAML`:

```ts
    toYAML: (_ctx, v) => explicitYAMLString((v as MetadataStringValue).value),
```

- [ ] **Step 5: Recognise explicit strings before heuristics**

Modify imports in `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`:

```ts
import { isExplicitYAMLString } from "~/yaml/explicitString"
```

Change `type MetadataSingleYAML`:

```ts
type MetadataSingleYAML = string | number | ExplicitYAMLString
```

Add `ExplicitYAMLString` to the import:

```ts
import { ExplicitYAMLString, isExplicitYAMLString } from "~/yaml/explicitString"
```

Add this at the top of `heuristicFromYAML`:

```ts
  if (isExplicitYAMLString(data)) {
    return { type: "string", value: data.value } satisfies MetadataStringValue
  }
```

Remove the old special case:

```ts
  if (data.startsWith('"') && data.endsWith('"')) {
    return { type: "string", value: data.slice(1, -1) } satisfies MetadataStringValue
  }
```

- [ ] **Step 6: Run `MetadataValue` tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Commit `MetadataValue` changes**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataValue/types.ts packages/core/metadata/commonObjects/metadataValue/handlers.ts packages/core/metadata/commonObjects/metadataValue/fromYAML.ts packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts
git commit -m "feat: :sparkles: использовать явные строки MetadataValue"
```

---

### Task 4: Propagate Quoted Scalar Style To MetadataValue Call Sites

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts`

- [ ] **Step 1: Write failing `ChoiceParameters` import test**

In `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`, add:

```ts
import { importFromYAML } from "~/yaml/import"
```

Append:

```ts
  it("imports double-quoted numeric-looking YAML scalar as string value", () => {
    const yaml = importFromYAML<ChoiceParametersYAML>('Отбор.Код: "456"')
    const result = importChoiceParametersFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([
      {
        name: "Отбор.Код",
        value: { type: "string", value: "456" },
      },
    ])
  })
```

- [ ] **Step 2: Write failing fixedArray import test**

If `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts` does not exist, create it with:

```ts
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { importFromYAML } from "~/yaml/import"
import { importFixedArrayFromYAML } from "./fromYAML"

describe("importFixedArrayFromYAML", () => {
  it("imports double-quoted numeric-looking YAML sequence item as string value", () => {
    const yaml = importFromYAML<{ Значения: unknown[] }>("Значения:\n  - \"456\"\n").Значения
    const result = importFixedArrayFromYAML(mockContext, yaml as any)

    expect(result).toEqual({
      type: "fixedArray",
      value: [{ type: "string", value: "456" }],
    })
  })
})
```

If the file exists, append the test body and reuse its imports.

- [ ] **Step 3: Run call-site tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts --no-isolate
```

Expected: FAIL because quoted scalar style is recorded but not passed to `MetadataValue`.

- [ ] **Step 4: Pass explicit string marker from property orchestration**

Modify imports in `packages/core/metadata/orchestration/property/fromYAML.ts`:

```ts
import { asExplicitYAMLStringIfMarked } from "~/yaml/explicitString"
```

After:

```ts
    const yamlValue = yaml && yamlKey ? yaml[yamlKey] : undefined
```

add:

```ts
    const valueForImport = yamlKey ? asExplicitYAMLStringIfMarked(yaml, yamlKey as string, yamlValue) : yamlValue
```

Change the `importPropertyFromYAML` call to pass `value: valueForImport`:

```ts
    const importedValue = importPropertyFromYAML({
      context: itemContext,
      rule: curRule,
      value: valueForImport,
      yaml: yaml,
      sourceValue,
      name,
      owner,
    })
```

- [ ] **Step 5: Pass explicit string marker inside `ChoiceParameters`**

Modify imports in `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.ts`:

```ts
import { asExplicitYAMLStringIfMarked } from "~/yaml/explicitString"
```

Change the map body:

```ts
  return Object.entries(data).map(([name, yamlValue]) => {
    const value = importMetadataValueFromYAML(context, undefined, asExplicitYAMLStringIfMarked(data, name, yamlValue) as any)
    const result: ChoiceParameter = { name }
```

- [ ] **Step 6: Pass explicit string marker inside fixed arrays**

Modify `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts` to import:

```ts
import { asExplicitYAMLStringIfMarked } from "~/yaml/explicitString"
```

Change element import so every item uses its sequence index:

```ts
    return importMetadataValueFromYAML(context, undefined, asExplicitYAMLStringIfMarked(data, index, v) as any)!
```

If the current code uses `data.map((v) => ...)`, change it to `data.map((v, index) => ...)`.

- [ ] **Step 7: Run call-site tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 8: Commit call-site propagation**

Run:

```bash
git add packages/core/metadata/orchestration/property/fromYAML.ts packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.test.ts
git commit -m "feat: :sparkles: импортировать quoted MetadataValue строки"
```

---

### Task 5: Update Fixtures And Export Expectations

**Files:**
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/__fixtures__/data.ts`
- Modify: affected `packages/core/metadata/**/__fixtures__/sync/yaml/**/*.yaml`
- Modify: affected `packages/core/metadata/**/__fixtures__/sync/data.ts`

- [ ] **Step 1: Find old encoded string values**

Run:

```bash
rg -n "'\\\"[^']*\\\"'|: '\"\"'" packages/core/metadata -g '*.yaml' -g '*.ts'
```

Expected: a list of old explicit string encodings, including examples like:

```text
ПараметрыВыбора:
  Отбор.Код: '"456"'
ЗначениеЗаполнения: '"Строка"'
```

- [ ] **Step 2: Update TypeScript fixture expectations**

Replace `MetadataValue` string YAML expectations from string-with-inner-quotes to `explicitYAMLString(...)`.

Example change in `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`:

```ts
import { explicitYAMLString } from "~/yaml/explicitString"
```

```ts
export const stringChoiceParametersYAML: ChoiceParametersYAML = {
  "Дополнительно.ТипВладельца": explicitYAMLString("ЗаказПокупателя") as any,
}
```

Use `as any` only at fixture boundaries where `ChoiceParametersYAML` is still public JSON-like YAML and the test is intentionally checking the internal export marker.

- [ ] **Step 3: Update YAML sync fixtures**

For every old YAML fixture occurrence that is a `MetadataValue` string, replace:

```yaml
Отбор.Код: '"456"'
```

with:

```yaml
Отбор.Код: "456"
```

Replace:

```yaml
ЗначениеЗаполнения: '"Строка"'
```

with:

```yaml
ЗначениеЗаполнения: "Строка"
```

For empty string `MetadataValue`, replace:

```yaml
ЗначениеЗаполнения: '""'
```

with:

```yaml
ЗначениеЗаполнения: ""
```

- [ ] **Step 4: Run focused common object tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataValue packages/core/metadata/commonObjects/сhoiceParameters --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Run affected applied-object sync tests**

Run these after identifying changed fixture directories:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataBusinessProcess --no-isolate
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes --no-isolate
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataDataProcessor --no-isolate
```

Expected: PASS. If `rg` in Step 1 shows other applied-object fixture directories, add each directory to this focused run.

- [ ] **Step 6: Commit fixture updates**

Run:

```bash
git add packages/core/metadata
git commit -m "test: :white_check_mark: обновить YAML-строки MetadataValue"
```

---

### Task 6: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run formatting check through tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 2: Run full project test**

Run:

```bash
pnpm test
```

Expected: PASS for all workspace packages.

- [ ] **Step 3: Inspect final diff**

Run:

```bash
git status --short
git log --oneline -n 6
```

Expected:

```text
git status --short
```

prints nothing.

`git log --oneline -n 6` includes the docs commit plus implementation/test commits from this plan.

- [ ] **Step 4: Report completion**

Report:

```text
Готово: строковые MetadataValue экспортируются как "..." в YAML, импорт quoted scalar сохраняет тип строки для MetadataValue, XML-фикстуры не изменялись, pnpm test зелёный.
```

---

## Self-Review

- Spec coverage: export `"..."`, import quoted scalar, no old `'"456"'` compatibility, all `MetadataValue` call sites, fixture updates, no XML fixture edits, and `pnpm test` are covered by Tasks 1-6.
- Placeholder scan: no deferred implementation steps; every code-changing step names files, code shape, command, and expected result.
- Type consistency: the plan uses one helper name family: `ExplicitYAMLString`, `explicitYAMLString`, `isExplicitYAMLString`, `asExplicitYAMLStringIfMarked`, and `markDoubleQuotedScalar`.
