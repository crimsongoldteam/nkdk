# Metadata Reference Values Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ввести единый механизм строковых ссылок, путей и ссылочных значений метаданных с русским YAML, английской канонической моделью и общей проверкой через `validate`.

**Architecture:** Чистый слой `metadataTargets` разбирает и форматирует строки без чтения проекта. Проектный слой `ProjectMetadataResolver` переиспользует `ProjectYamlCache`, `ValidationProjectSpec`, `OwnerMetadataCache` и индексы полей. `rules.ts` получает поле `metadataTarget`, а `validate` обходит импортированную модель по правилам и вызывает зарегистрированные обработчики типов.

**Tech Stack:** TypeScript, TypeBox, YAML AST, Vitest, pnpm, существующий слой `packages/core/metadata/orchestration`.

---

## Implementation Status

План выполнен по задачам 1-12 в worktree `metadata-value-unification`.

- Tasks 1-10 закоммичены отдельными коммитами.
- Tasks 11-12 реализованы финальным проходом: `referenceScope` помечен устаревшим и оставлен только как временный мост синхронизации форм; оставшиеся прямые потребители получили `metadataTarget`; `TypeDescription` больше не отдаёт `x-nkdk-graph`; схемы и parser учитывают конечный сегмент поля отдельно от промежуточной `ТабличнаяЧасть`.
- Свежие проверки после реализации: `pnpm --filter @nakidka/core type-check`, `pnpm --filter @nakidka/core test`, `pnpm test`.

---

## Scope

План покрывает общий API, проектный резолвер, schema-шаблоны, проверку через `rules.ts`, пилотные потребители (`MetadataItemLink(s)`, `MetadataField(s)`, `MetadataObjectRefCollection`, ссылочные ветки `MetadataValue`) и оформительские ссылки (`Color`, `Font`, `Border`, `Picture`). Оставшиеся потребители переводятся через тот же механизм в конце плана отдельным проходом компиляции и поиска.

Перед любыми изменениями в `packages/core/metadata/**` исполнитель читает:

```bash
sed -n '1,260p' .agents/knowledge/metadata/INDEX.md
sed -n '1,260p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,260p' .agents/knowledge/metadata/yaml-contract.md
sed -n '1,260p' .agents/architecture-orchestration.md
```

XML-фикстуры не изменять. Новые проверки делать через `rules.ts`, общий реестр типов и `validate`, а не через отдельные сборщики по доменам.

## File Structure

- Create: `packages/core/metadata/commonObjects/metadataTargets/types.ts` — типы целей, ограничений, ошибок разбора и русско-английских корней.
- Create: `packages/core/metadata/commonObjects/metadataTargets/roots.ts` — словарь русских YAML-корней, английских модельных корней и ссылочных типов.
- Create: `packages/core/metadata/commonObjects/metadataTargets/parse.ts` — `parseMetadataTargetFromYAML` и `parseMetadataTargetFromModel`.
- Create: `packages/core/metadata/commonObjects/metadataTargets/format.ts` — `formatMetadataTargetToYAML`.
- Create: `packages/core/metadata/commonObjects/metadataTargets/schema.ts` — обычная JSON Schema с `type`, `pattern`, `examples`, `description`.
- Create: `packages/core/metadata/commonObjects/metadataTargets/index.ts` — единый экспорт чистого слоя.
- Create tests: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`, `schema.test.ts`.
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`, `toYAML.ts`, `toJSONSchema.ts` — оставить тонкими переходниками к `metadataTargets`.
- Modify: `packages/core/metadata/commonObjects/metadataRef/*`, `metadataField/*`, `typeLink/*`, `fieldsList/*`, `metadataValue/*`, `picture/*`, `color/*`, `font/*`, `border/*` — использовать новый API для строк и schema.
- Create: `packages/core/metadata/commonObjects/metadataObjectRefCollection/*` — новое имя для `metadataValueCollection`.
- Modify: `packages/core/metadata/commonObjects/index.ts`, `packages/core/metadata/orchestration/property/registry.ts`, `packages/core/metadata/orchestration/property/types.ts` — зарегистрировать новый тип и `metadataTarget`.
- Create: `packages/core/metadata/validation/projectMetadataResolver.ts` — общий резолвер ссылок проекта.
- Create: `packages/core/metadata/validation/projectMetadataResolver.test.ts` — проверки объектов, полей, значений, картинок и элементов стиля.
- Create: `packages/core/metadata/validation/metadataTargetTraversal.ts` — обход импортированной модели по `rules.ts`.
- Create: `packages/core/metadata/validation/metadataTargetTraversal.test.ts` — проверка вызова обработчиков и координат YAML.
- Modify: `packages/core/metadata/validation/validateProject.ts`, `validateItem.ts` — подключить новый резолвер и обход.

### Task 1: Pure `metadataTargets` API

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataTargets/types.ts`
- Create: `packages/core/metadata/commonObjects/metadataTargets/roots.ts`
- Create: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
- Create: `packages/core/metadata/commonObjects/metadataTargets/format.ts`
- Create: `packages/core/metadata/commonObjects/metadataTargets/index.ts`
- Test: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`

- [ ] **Step 1: Write failing parser tests**

Create `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  formatMetadataTargetToYAML,
  parseMetadataTargetFromModel,
  parseMetadataTargetFromYAML,
} from "./index"

describe("metadataTargets parser", () => {
  it("parses object references from Russian YAML to canonical model strings", () => {
    const result = parseMetadataTargetFromYAML({
      value: "Справочник.Контрагенты",
      constraint: { kind: "object", roots: ["Catalog"] },
    })

    expect(result).toEqual({
      ok: true,
      canonical: "Catalog.Контрагенты",
      target: { kind: "object", root: "Catalog", objectName: "Контрагенты" },
    })
  })

  it("parses full field paths with required service segments", () => {
    const result = parseMetadataTargetFromYAML({
      value: "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество",
      constraint: { kind: "field", owner: "explicit", roots: ["Catalog"] },
    })

    expect(result).toEqual({
      ok: true,
      canonical: "Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество",
      target: {
        kind: "field",
        root: "Catalog",
        objectName: "Номенклатура",
        segments: [
          { kind: "TabularSection", name: "Товары" },
          { kind: "Attribute", name: "Количество" },
        ],
      },
    })
  })

  it("parses predefined values and EmptyRef values", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Справочник.СтавкиНДС.БезНДС",
        constraint: { kind: "value", roots: ["Catalog"], valueKinds: ["predefinedValue", "emptyRef"], allowEmptyRef: true },
      })
    ).toMatchObject({
      ok: true,
      canonical: "Catalog.СтавкиНДС.БезНДС",
      target: { kind: "value", root: "Catalog", objectName: "СтавкиНДС", valueKind: "predefinedValue", valueName: "БезНДС" },
    })

    expect(
      parseMetadataTargetFromYAML({
        value: "Справочник.СтавкиНДС.ПустаяСсылка",
        constraint: { kind: "value", roots: ["Catalog"], valueKinds: ["predefinedValue", "emptyRef"], allowEmptyRef: true },
      })
    ).toMatchObject({
      ok: true,
      canonical: "Catalog.СтавкиНДС.EmptyRef",
      target: { kind: "value", root: "Catalog", objectName: "СтавкиНДС", valueKind: "emptyRef" },
    })
  })

  it("parses enum values with EnumValue in the model only", () => {
    const result = parseMetadataTargetFromYAML({
      value: "Перечисление.ВидыДоговоров.СПоставщиком",
      constraint: { kind: "value", roots: ["Enum"], valueKinds: ["enumValue", "emptyRef"], allowEmptyRef: true },
    })

    expect(result).toEqual({
      ok: true,
      canonical: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
      target: { kind: "value", root: "Enum", objectName: "ВидыДоговоров", valueKind: "enumValue", valueName: "СПоставщиком" },
    })
  })

  it("formats canonical model strings back to Russian YAML", () => {
    expect(formatMetadataTargetToYAML({
      canonical: "Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество",
      constraint: { kind: "field", owner: "explicit", roots: ["Catalog"] },
    })).toBe("Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество")

    expect(formatMetadataTargetToYAML({
      canonical: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
      constraint: { kind: "value", roots: ["Enum"], valueKinds: ["enumValue"] },
    })).toBe("Перечисление.ВидыДоговоров.СПоставщиком")
  })

  it("rejects English roots in YAML as unknown roots", () => {
    expect(parseMetadataTargetFromYAML({
      value: "Catalog.Контрагенты",
      constraint: { kind: "object", roots: ["Catalog"] },
    })).toEqual({
      ok: false,
      code: "unknown-root",
      message: 'Неизвестный корень "Catalog"',
    })
  })

  it("rejects old PredefinedData and short field forms without compatibility conversion", () => {
    expect(parseMetadataTargetFromModel({
      canonical: "Catalog.СтавкиНДС.PredefinedData.БезНДС",
      constraint: { kind: "value", roots: ["Catalog"], valueKinds: ["predefinedValue"] },
    })).toMatchObject({ ok: false, code: "unknown-segment" })

    expect(parseMetadataTargetFromYAML({
      value: "Справочник.Номенклатура.Количество",
      constraint: { kind: "field", owner: "explicit", roots: ["Catalog"] },
    })).toMatchObject({ ok: false, code: "unknown-segment" })
  })
})
```

- [ ] **Step 2: Run parser tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: FAIL with module-not-found errors for `./index`.

- [ ] **Step 3: Add target types**

Create `packages/core/metadata/commonObjects/metadataTargets/types.ts`:

```ts
export type MetadataRootName =
  | "Catalog"
  | "Document"
  | "Enum"
  | "InformationRegister"
  | "AccumulationRegister"
  | "AccountingRegister"
  | "CalculationRegister"
  | "ExchangePlan"
  | "ChartOfAccounts"
  | "ChartOfCharacteristicTypes"
  | "ChartOfCalculationTypes"
  | "BusinessProcess"
  | "BusinessProcessRoutePoint"
  | "Task"
  | "DataProcessor"
  | "Report"
  | "CommonPicture"
  | "StyleItem"

export type MetadataFieldKind = "Attribute" | "StandardAttribute" | "TabularSection" | "Dimension" | "Resource"
export type MetadataValueKind = "predefinedValue" | "enumValue" | "emptyRef"
export type MetadataTargetFilterName = "stringIndexedAttribute"
export type StyleItemTargetType = "Color" | "Font" | "Border"

export type MetadataTargetConstraint =
  | { kind: "object"; roots?: readonly MetadataRootName[]; scope?: "project" | "owner" }
  | {
      kind: "field"
      owner: "this" | "explicit"
      roots?: readonly MetadataRootName[]
      fieldKinds?: readonly MetadataFieldKind[]
      filters?: readonly MetadataTargetFilterName[]
    }
  | {
      kind: "value"
      roots?: readonly MetadataRootName[]
      valueKinds?: readonly MetadataValueKind[]
      allowEmptyRef?: boolean
    }
  | {
      kind: "type"
      roots?: readonly MetadataRootName[]
      typeKinds?: readonly ("ref" | "object" | "primitive")[]
      primitives?: readonly ("string" | "decimal" | "dateTime" | "boolean" | "ValueStorage")[]
    }
  | { kind: "dataPath"; context: "form"; allowedKinds?: readonly string[]; allowComposite?: boolean }
  | { kind: "localChild"; owner: "this"; childKind: "Form" | "Template" }
  | { kind: "styleItem"; styleItemTypes: readonly StyleItemTargetType[] }
  | { kind: "commonPicture" }

export type ParsedMetadataTarget =
  | { kind: "object"; root: MetadataRootName; objectName: string }
  | { kind: "field"; root: MetadataRootName; objectName: string; segments: MetadataFieldSegment[] }
  | { kind: "value"; root: MetadataRootName; objectName: string; valueKind: MetadataValueKind; valueName?: string }
  | { kind: "styleItem"; name: string }
  | { kind: "commonPicture"; name: string }

export interface MetadataFieldSegment {
  kind: MetadataFieldKind
  name: string
}

export type MetadataTargetParseErrorCode =
  | "unknown-root"
  | "disallowed-root"
  | "unknown-segment"
  | "disallowed-kind"
  | "invalid-shape"

export type MetadataTargetParseResult =
  | { ok: true; canonical: string; target: ParsedMetadataTarget }
  | { ok: false; code: MetadataTargetParseErrorCode; message: string }
```

- [ ] **Step 4: Add root dictionary**

Create `packages/core/metadata/commonObjects/metadataTargets/roots.ts`:

```ts
import type { MetadataFieldKind, MetadataRootName } from "./types"

export const METADATA_NAME_PATTERN = "[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*"

export const rootToYAML = {
  Catalog: "Справочник",
  Document: "Документ",
  Enum: "Перечисление",
  InformationRegister: "РегистрСведений",
  AccumulationRegister: "РегистрНакопления",
  AccountingRegister: "РегистрБухгалтерии",
  CalculationRegister: "РегистрРасчета",
  ExchangePlan: "ПланОбмена",
  ChartOfAccounts: "ПланСчетов",
  ChartOfCharacteristicTypes: "ПланВидовХарактеристик",
  ChartOfCalculationTypes: "ПланВидовРасчета",
  BusinessProcess: "БизнесПроцесс",
  BusinessProcessRoutePoint: "ТочкаМаршрутаБизнесПроцесса",
  Task: "Задача",
  DataProcessor: "Обработка",
  Report: "Отчет",
  CommonPicture: "ОбщаяКартинка",
  StyleItem: "ЭлементСтиля",
} as const satisfies Record<MetadataRootName, string>

export const rootFromYAML = Object.fromEntries(
  Object.entries(rootToYAML).map(([model, yaml]) => [yaml, model])
) as Record<string, MetadataRootName>

export const fieldKindToYAML = {
  Attribute: "Реквизит",
  StandardAttribute: "СтандартныйРеквизит",
  TabularSection: "ТабличнаяЧасть",
  Dimension: "Измерение",
  Resource: "Ресурс",
} as const satisfies Record<MetadataFieldKind, string>

export const fieldKindFromYAML = Object.fromEntries(
  Object.entries(fieldKindToYAML).map(([model, yaml]) => [yaml, model])
) as Record<string, MetadataFieldKind>

export function isMetadataRootName(value: string): value is MetadataRootName {
  return Object.prototype.hasOwnProperty.call(rootToYAML, value)
}
```

- [ ] **Step 5: Add parser implementation**

Create `packages/core/metadata/commonObjects/metadataTargets/parse.ts`:

```ts
import { fieldKindFromYAML, isMetadataRootName, rootFromYAML } from "./roots"
import type {
  MetadataFieldKind,
  MetadataFieldSegment,
  MetadataRootName,
  MetadataTargetConstraint,
  MetadataTargetParseResult,
  MetadataValueKind,
} from "./types"

export function parseMetadataTargetFromYAML(params: {
  value: string
  constraint: MetadataTargetConstraint
}): MetadataTargetParseResult {
  const parts = params.value.split(".").filter((part) => part.length > 0)
  if (parts.length === 0) return invalid("invalid-shape", "Пустое значение ссылки")

  if (params.constraint.kind === "styleItem") return parsePrefixedName(parts, "ЭлементСтиля", "styleItem")
  if (params.constraint.kind === "commonPicture") return parsePrefixedName(parts, "ОбщаяКартинка", "commonPicture")

  const root = rootFromYAML[parts[0]]
  if (!root) return invalid("unknown-root", `Неизвестный корень "${parts[0]}"`)
  if (!rootAllowed(root, params.constraint.roots)) return invalid("disallowed-root", `Корень "${parts[0]}" недопустим для этого поля`)

  if (params.constraint.kind === "object") {
    if (parts.length !== 2) return invalid("invalid-shape", `Ожидалась ссылка на объект из двух сегментов`)
    return { ok: true, canonical: `${root}.${parts[1]}`, target: { kind: "object", root, objectName: parts[1] } }
  }

  if (params.constraint.kind === "field") {
    return parseYamlField({ root, parts, constraint: params.constraint })
  }

  if (params.constraint.kind === "value") {
    return parseYamlValue({ root, parts, constraint: params.constraint })
  }

  return invalid("invalid-shape", `Тип цели "${params.constraint.kind}" не разбирается как metadata-ссылка`)
}

export function parseMetadataTargetFromModel(params: {
  canonical: string
  constraint?: MetadataTargetConstraint
}): MetadataTargetParseResult {
  const parts = params.canonical.split(".").filter((part) => part.length > 0)
  const rootText = parts[0]
  if (!rootText || !isMetadataRootName(rootText)) return invalid("unknown-root", `Неизвестный корень "${rootText ?? ""}"`)
  const root = rootText as MetadataRootName
  const constraint = params.constraint
  if (constraint?.roots !== undefined && !rootAllowed(root, constraint.roots)) {
    return invalid("disallowed-root", `Корень "${root}" недопустим для этого поля`)
  }

  if (constraint?.kind === "field") return parseModelField({ root, parts, constraint })
  if (constraint?.kind === "value") return parseModelValue({ root, parts, constraint })
  if (constraint?.kind === "object" || constraint === undefined) {
    if (parts.length !== 2) return invalid("invalid-shape", "Ожидалась каноническая ссылка на объект")
    return { ok: true, canonical: params.canonical, target: { kind: "object", root, objectName: parts[1] } }
  }

  return invalid("invalid-shape", `Тип цели "${constraint.kind}" не разбирается как metadata-ссылка`)
}

function parseYamlField(params: {
  root: MetadataRootName
  parts: string[]
  constraint: Extract<MetadataTargetConstraint, { kind: "field" }>
}): MetadataTargetParseResult {
  if (params.parts.length < 4) return invalid("unknown-segment", "Путь поля должен содержать служебные сегменты")
  const objectName = params.parts[1]
  const segments: MetadataFieldSegment[] = []
  let index = 2

  while (index < params.parts.length) {
    const kind = fieldKindFromYAML[params.parts[index]]
    if (!kind) return invalid("unknown-segment", `Неизвестный сегмент "${params.parts[index]}"`)
    if (params.constraint.fieldKinds !== undefined && !params.constraint.fieldKinds.includes(kind)) {
      return invalid("disallowed-kind", `Сегмент "${params.parts[index]}" недопустим для этого поля`)
    }
    const name = params.parts[index + 1]
    if (!name) return invalid("invalid-shape", `После "${params.parts[index]}" ожидается имя`)
    segments.push({ kind, name })
    index += 2
  }

  const canonical = [params.root, objectName, ...segments.flatMap((segment) => [segment.kind, segment.name])].join(".")
  return { ok: true, canonical, target: { kind: "field", root: params.root, objectName, segments } }
}

function parseModelField(params: {
  root: MetadataRootName
  parts: string[]
  constraint: Extract<MetadataTargetConstraint, { kind: "field" }>
}): MetadataTargetParseResult {
  if (params.parts.length < 4) return invalid("unknown-segment", "Путь поля должен содержать служебные сегменты")
  const objectName = params.parts[1]
  const segments: MetadataFieldSegment[] = []
  let index = 2

  while (index < params.parts.length) {
    const kind = params.parts[index] as MetadataFieldKind
    if (!["Attribute", "StandardAttribute", "TabularSection", "Dimension", "Resource"].includes(kind)) {
      return invalid("unknown-segment", `Неизвестный сегмент "${params.parts[index]}"`)
    }
    const name = params.parts[index + 1]
    if (!name) return invalid("invalid-shape", `После "${params.parts[index]}" ожидается имя`)
    segments.push({ kind, name })
    index += 2
  }

  return {
    ok: true,
    canonical: params.parts.join("."),
    target: { kind: "field", root: params.root, objectName, segments },
  }
}

function parseYamlValue(params: {
  root: MetadataRootName
  parts: string[]
  constraint: Extract<MetadataTargetConstraint, { kind: "value" }>
}): MetadataTargetParseResult {
  if (params.parts.length !== 3) return invalid("invalid-shape", "Ожидалось значение ссылки из трех сегментов")
  const objectName = params.parts[1]
  const rawValue = params.parts[2]
  if (rawValue === "ПустаяСсылка") return valueResult(params.root, objectName, "emptyRef", undefined, params.constraint)
  if (params.root === "Enum") return valueResult(params.root, objectName, "enumValue", rawValue, params.constraint)
  return valueResult(params.root, objectName, "predefinedValue", rawValue, params.constraint)
}

function parseModelValue(params: {
  root: MetadataRootName
  parts: string[]
  constraint: Extract<MetadataTargetConstraint, { kind: "value" }>
}): MetadataTargetParseResult {
  if (params.parts.includes("PredefinedData")) return invalid("unknown-segment", 'Сегмент "PredefinedData" не входит в каноническую модель')
  const objectName = params.parts[1]
  if (params.parts[2] === "EmptyRef" && params.parts.length === 3) {
    return valueResult(params.root, objectName, "emptyRef", undefined, params.constraint, params.parts.join("."))
  }
  if (params.root === "Enum" && params.parts[2] === "EnumValue" && params.parts.length === 4) {
    return valueResult(params.root, objectName, "enumValue", params.parts[3], params.constraint, params.parts.join("."))
  }
  if (params.root !== "Enum" && params.parts.length === 3) {
    return valueResult(params.root, objectName, "predefinedValue", params.parts[2], params.constraint, params.parts.join("."))
  }
  return invalid("unknown-segment", "Каноническое значение ссылки имеет недопустимую форму")
}

function valueResult(
  root: MetadataRootName,
  objectName: string,
  valueKind: MetadataValueKind,
  valueName: string | undefined,
  constraint: Extract<MetadataTargetConstraint, { kind: "value" }>,
  canonicalOverride?: string
): MetadataTargetParseResult {
  if (valueKind === "emptyRef" && constraint.allowEmptyRef !== true) {
    return invalid("disallowed-kind", "ПустаяСсылка недопустима для этого поля")
  }
  if (constraint.valueKinds !== undefined && !constraint.valueKinds.includes(valueKind)) {
    return invalid("disallowed-kind", `Вид значения "${valueKind}" недопустим для этого поля`)
  }

  const canonical = canonicalOverride ?? (valueKind === "enumValue"
    ? `${root}.${objectName}.EnumValue.${valueName}`
    : valueKind === "emptyRef"
      ? `${root}.${objectName}.EmptyRef`
      : `${root}.${objectName}.${valueName}`)

  return { ok: true, canonical, target: { kind: "value", root, objectName, valueKind, ...(valueName ? { valueName } : {}) } }
}

function parsePrefixedName(
  parts: string[],
  expectedRoot: string,
  kind: "styleItem" | "commonPicture"
): MetadataTargetParseResult {
  if (parts[0] !== expectedRoot) return invalid("unknown-root", `Неизвестный корень "${parts[0]}"`)
  if (parts.length !== 2) return invalid("invalid-shape", `Ожидалась строка вида ${expectedRoot}.<Имя>`)
  return kind === "styleItem"
    ? { ok: true, canonical: `StyleItem.${parts[1]}`, target: { kind, name: parts[1] } }
    : { ok: true, canonical: `CommonPicture.${parts[1]}`, target: { kind, name: parts[1] } }
}

function rootAllowed(root: MetadataRootName, roots: readonly MetadataRootName[] | undefined): boolean {
  return roots === undefined || roots.includes(root)
}

function invalid(code: MetadataTargetParseResult["code"], message: string): MetadataTargetParseResult {
  return { ok: false, code, message }
}
```

- [ ] **Step 6: Add formatter and index**

Create `packages/core/metadata/commonObjects/metadataTargets/format.ts`:

```ts
import { fieldKindToYAML, rootToYAML } from "./roots"
import { parseMetadataTargetFromModel } from "./parse"
import type { MetadataTargetConstraint } from "./types"

export function formatMetadataTargetToYAML(params: {
  canonical: string
  constraint: MetadataTargetConstraint
}): string {
  const parsed = parseMetadataTargetFromModel({ canonical: params.canonical, constraint: params.constraint })
  if (!parsed.ok) throw new Error(parsed.message)

  const target = parsed.target
  if (target.kind === "object") return `${rootToYAML[target.root]}.${target.objectName}`
  if (target.kind === "field") {
    return [
      rootToYAML[target.root],
      target.objectName,
      ...target.segments.flatMap((segment) => [fieldKindToYAML[segment.kind], segment.name]),
    ].join(".")
  }
  if (target.kind === "value") {
    const valueName = target.valueKind === "emptyRef" ? "ПустаяСсылка" : target.valueName
    return `${rootToYAML[target.root]}.${target.objectName}.${valueName}`
  }
  if (target.kind === "styleItem") return `ЭлементСтиля.${target.name}`
  if (target.kind === "commonPicture") return `ОбщаяКартинка.${target.name}`

  throw new Error(`Неподдерживаемая цель ${(target as { kind: string }).kind}`)
}
```

Create `packages/core/metadata/commonObjects/metadataTargets/index.ts`:

```ts
export * from "./format"
export * from "./parse"
export * from "./roots"
export * from "./types"
```

- [ ] **Step 7: Run parser tests and commit**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/commonObjects/metadataTargets
git commit -m "feat: :sparkles: добавить общий разбор целей метаданных"
```

### Task 2: JSON Schema templates and `metadataTarget` rule contract

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/index.ts`
- Create: `packages/core/metadata/commonObjects/metadataTargets/schema.ts`
- Test: `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`

- [ ] **Step 1: Write failing schema tests**

Create `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { buildMetadataTargetSchema } from "./index"

describe("buildMetadataTargetSchema", () => {
  it("returns ordinary JSON Schema for object references", () => {
    const schema = buildMetadataTargetSchema({ kind: "object", roots: ["Catalog", "Document"] })

    expect(schema).toMatchObject({
      type: "string",
      pattern: "^((Справочник|Документ)\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*)$",
      examples: ["Справочник.Контрагенты", "Документ.ЗаказПокупателя"],
    })
    expect(JSON.stringify(schema)).not.toContain("x-nkdk")
  })

  it("describes full field paths with service segments", () => {
    const schema = buildMetadataTargetSchema({ kind: "field", owner: "explicit", roots: ["Catalog"] })

    expect(schema).toMatchObject({
      type: "string",
      examples: [
        "Справочник.Номенклатура.Реквизит.Артикул",
        "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество",
      ],
    })
    expect(String(schema.description)).toContain("служебные сегменты")
  })

  it("describes predefined values and EmptyRef without project names", () => {
    const schema = buildMetadataTargetSchema({
      kind: "value",
      roots: ["Catalog"],
      valueKinds: ["predefinedValue", "emptyRef"],
      allowEmptyRef: true,
    })

    expect(schema).toMatchObject({
      type: "string",
      examples: ["Справочник.СтавкиНДС.БезНДС", "Справочник.СтавкиНДС.ПустаяСсылка"],
    })
    expect(String(schema.description)).toContain("<ИмяСправочника>")
  })
})
```

- [ ] **Step 2: Run schema tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataTargets/schema.test.ts
```

Expected: FAIL with missing `buildMetadataTargetSchema`.

- [ ] **Step 3: Add `metadataTarget` to property rules**

In `packages/core/metadata/orchestration/property/types.ts`, add the import near other type imports:

```ts
import type { MetadataTargetConstraint } from "~/metadata/commonObjects/metadataTargets/types"
```

Add this field to `BasePropertyRule` directly after `referenceScope?: ReferenceScope`:

```ts
  /**
   * Описание допустимой цели metadata-значения. Используется schema и validate.
   * `referenceScope` считается устаревшим и новые правила не должны его расширять.
   */
  metadataTarget?: MetadataTargetConstraint
```

- [ ] **Step 4: Add schema builder**

Create `packages/core/metadata/commonObjects/metadataTargets/schema.ts`:

```ts
import { Type, type TSchema } from "@sinclair/typebox"
import { fieldKindToYAML, METADATA_NAME_PATTERN, rootToYAML } from "./roots"
import type { MetadataRootName, MetadataTargetConstraint } from "./types"

export function buildMetadataTargetSchema(constraint: MetadataTargetConstraint): TSchema {
  if (constraint.kind === "object") return objectSchema(constraint.roots)
  if (constraint.kind === "field") return fieldSchema(constraint.roots)
  if (constraint.kind === "value") return valueSchema(constraint)
  if (constraint.kind === "styleItem") {
    return Type.String({
      pattern: `^ЭлементСтиля\\.${METADATA_NAME_PATTERN}$`,
      examples: ["ЭлементСтиля.ОсновнойШрифт"],
      description: "Ссылка на элемент стиля проекта: ЭлементСтиля.<ИмяЭлементаСтиля>.",
    })
  }
  if (constraint.kind === "commonPicture") {
    return Type.String({
      pattern: `^ОбщаяКартинка\\.${METADATA_NAME_PATTERN}$`,
      examples: ["ОбщаяКартинка.Логотип"],
      description: "Ссылка на общую картинку проекта: ОбщаяКартинка.<ИмяОбщейКартинки>.",
    })
  }

  return Type.String({
    description: "Строковое metadata-значение. Подробная проверка выполняется командой validate.",
  })
}

function objectSchema(roots: readonly MetadataRootName[] | undefined): TSchema {
  const yamlRoots = yamlRootGroup(roots)
  return Type.String({
    pattern: `^((${yamlRoots})\\.${METADATA_NAME_PATTERN})$`,
    examples: ["Справочник.Контрагенты", "Документ.ЗаказПокупателя"],
    description: `Ссылка на объект метаданных: ${yamlRoots}.<ИмяОбъекта>. Реальные имена объектов берутся из YAML-проекта и проверяются validate.`,
  })
}

function fieldSchema(roots: readonly MetadataRootName[] | undefined): TSchema {
  const yamlRoots = yamlRootGroup(roots)
  const serviceSegments = Object.values(fieldKindToYAML).join("|")
  return Type.String({
    pattern: `^(${yamlRoots})\\.${METADATA_NAME_PATTERN}\\.(?:${serviceSegments})\\.${METADATA_NAME_PATTERN}(?:\\.(?:${serviceSegments})\\.${METADATA_NAME_PATTERN})*$`,
    examples: [
      "Справочник.Номенклатура.Реквизит.Артикул",
      "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество",
    ],
    description:
      "Полный путь поля метаданных. Служебные сегменты Реквизит, СтандартныйРеквизит, ТабличнаяЧасть, Измерение и Ресурс обязательны; реальные имена проверяются validate.",
  })
}

function valueSchema(constraint: Extract<MetadataTargetConstraint, { kind: "value" }>): TSchema {
  const yamlRoots = yamlRootGroup(constraint.roots)
  const emptyRef = constraint.allowEmptyRef === true ? "ИлиПустаяСсылка" : ""
  return Type.String({
    pattern: `^(${yamlRoots})\\.${METADATA_NAME_PATTERN}\\.${METADATA_NAME_PATTERN}$`,
    examples: ["Справочник.СтавкиНДС.БезНДС", "Справочник.СтавкиНДС.ПустаяСсылка"],
    description: `Значение ссылки: Справочник.<ИмяСправочника>.<ИмяПредопределенногоЗначения${emptyRef}> или Перечисление.<ИмяПеречисления>.<ИмяЗначения>.`,
  })
}

function yamlRootGroup(roots: readonly MetadataRootName[] | undefined): string {
  const selected = roots ?? (Object.keys(rootToYAML) as MetadataRootName[])
  return selected.map((root) => rootToYAML[root]).join("|")
}
```

Update `packages/core/metadata/commonObjects/metadataTargets/index.ts`:

```ts
export * from "./format"
export * from "./parse"
export * from "./roots"
export * from "./schema"
export * from "./types"
```

- [ ] **Step 5: Run schema tests and commit**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataTargets/schema.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/commonObjects/metadataTargets packages/core/metadata/orchestration/property/types.ts
git commit -m "feat: :sparkles: описать metadataTarget для rules.ts"
```

### Task 3: Replace `metadataPath` conversions with common API

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toJSONSchema.ts`
- Modify tests: `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`, `toYAML.test.ts`, `toJSONSchema.test.ts`

- [ ] **Step 1: Update tests for canonical full fields and no legacy compatibility**

Append to `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`:

```ts
test("imports full field paths with service segments through metadataTargets", () => {
  expect(
    importMetadataFieldStringFromYAML(
      mockContext,
      { type: "MetadataField", metadataTarget: { kind: "field", owner: "explicit", roots: ["Catalog"] } } as any,
      "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество"
    )
  ).toBe("Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество")
})

test("rejects short field paths instead of guessing their collection", () => {
  expect(() =>
    importMetadataFieldStringFromYAML(
      mockContext,
      { type: "MetadataField", metadataTarget: { kind: "field", owner: "explicit", roots: ["Catalog"] } } as any,
      "Справочник.Номенклатура.Количество"
    )
  ).toThrow('Неизвестный сегмент "Количество"')
})

test("rejects English roots in YAML as unknown roots", () => {
  expect(() =>
    importMetadataFieldStringFromYAML(
      mockContext,
      { type: "MetadataItemLink", metadataTarget: { kind: "object", roots: ["Catalog"] } } as any,
      "Catalog.Контрагенты"
    )
  ).toThrow('Неизвестный корень "Catalog"')
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts
```

Expected: FAIL because old `convertPath` accepts short paths and does not throw structured errors.

- [ ] **Step 3: Replace YAML import helpers**

Replace the body of `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts` with:

```ts
import { Context } from "vm"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { parseMetadataTargetFromYAML } from "../metadataTargets"

const defaultObjectConstraint = { kind: "object" as const }
const defaultFieldConstraint = { kind: "field" as const, owner: "explicit" as const }
const defaultValueConstraint = {
  kind: "value" as const,
  valueKinds: ["predefinedValue", "enumValue", "emptyRef"] as const,
  allowEmptyRef: true,
}

function importTarget(name: string, rule: PropertyRule | undefined, fallback: typeof defaultObjectConstraint | typeof defaultFieldConstraint | typeof defaultValueConstraint): string {
  const result = parseMetadataTargetFromYAML({
    value: name,
    constraint: rule?.metadataTarget ?? fallback,
  })

  if (!result.ok) throw new Error(result.message)
  return result.canonical
}

export const importMetadataFieldStringFromYAML = (
  _context: Context,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return importTarget(name, rule, rule?.type === "MetadataItemLink" ? defaultObjectConstraint : defaultFieldConstraint)
}

export const importMetadataValueStringFromYAML = (
  _context: Context,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return importTarget(name, rule, defaultValueConstraint)
}
```

- [ ] **Step 4: Replace YAML export helpers**

Replace the body of `packages/core/metadata/commonObjects/metadataPath/toYAML.ts` with:

```ts
import { Context } from "vm"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { formatMetadataTargetToYAML } from "../metadataTargets"

const defaultObjectConstraint = { kind: "object" as const }
const defaultFieldConstraint = { kind: "field" as const, owner: "explicit" as const }
const defaultValueConstraint = {
  kind: "value" as const,
  valueKinds: ["predefinedValue", "enumValue", "emptyRef"] as const,
  allowEmptyRef: true,
}

function exportTarget(canonical: string, rule: PropertyRule | undefined, fallback: typeof defaultObjectConstraint | typeof defaultFieldConstraint | typeof defaultValueConstraint): string {
  return formatMetadataTargetToYAML({
    canonical,
    constraint: rule?.metadataTarget ?? fallback,
  })
}

export const exportMetadataFieldStringToYAML = (
  _context: Context,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  return exportTarget(name, rule, rule?.type === "MetadataItemLink" ? defaultObjectConstraint : defaultFieldConstraint)
}

export const exportMetadataValueStringToYAML = (
  _context: Context,
  rule: PropertyRule | undefined,
  name: string | undefined
): string | undefined => {
  if (!name) return undefined
  return exportTarget(name, rule, defaultValueConstraint)
}
```

- [ ] **Step 5: Replace metadataPath schema helper**

Replace `packages/core/metadata/commonObjects/metadataPath/toJSONSchema.ts` with:

```ts
import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { buildMetadataTargetSchema } from "../metadataTargets"
import { DataPathJSONSchema } from "./types"

export const exportDataPathToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return DataPathJSONSchema
}

export const exportMetadataTargetToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.metadataTarget) return buildMetadataTargetSchema(rule.metadataTarget)
  return buildMetadataTargetSchema({ kind: "object" })
}

registerTypeRule("DataPath", "exportToJSONSchema", exportDataPathToJSONSchema)
registerTypeRule("MetadataItemLink", "exportToJSONSchema", exportMetadataTargetToJSONSchema)
registerTypeRule("MetadataItemLinks", "exportToJSONSchema", ({ rule }) => ({
  type: "array",
  items: exportMetadataTargetToJSONSchema({ context: {} as never, rule, value: undefined }),
}))
registerTypeRule("MetadataField", "exportToJSONSchema", exportMetadataTargetToJSONSchema)
registerTypeRule("MetadataFields", "exportToJSONSchema", ({ rule }) => ({
  type: "array",
  items: exportMetadataTargetToJSONSchema({ context: {} as never, rule, value: undefined }),
}))
```

Then remove duplicate `exportToJSONSchema` registrations from `metadataRef/toJSONSchema.ts` and `metadataField/toJSONSchema.ts`, or change those files to import `../metadataPath/toJSONSchema` for side effects only. Keep one registration per property type.

- [ ] **Step 6: Run focused tests and commit**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts packages/core/metadata/commonObjects/metadataRef/toJSONSchema.test.ts
```

Expected: PASS after old table fixtures are updated to full field paths where they represent fields. Do not update XML fixtures.

Commit:

```bash
git add packages/core/metadata/commonObjects/metadataPath packages/core/metadata/commonObjects/metadataRef packages/core/metadata/commonObjects/metadataField
git commit -m "refactor: :recycle: перевести metadataPath на общий metadataTargets"
```

### Task 4: Pilot consumers `MetadataItemLink(s)`, `MetadataField(s)`, `TypeLink`

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRef/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRef/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataField/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataField/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/typeLink/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/typeLink/toYAML.ts`
- Tests: existing `fromYAML.test.ts` and `toYAML.test.ts` in those directories.

- [ ] **Step 1: Write failing tests for single field registration**

Append to `packages/core/metadata/commonObjects/metadataField/fromYAML.test.ts`:

```ts
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"

test("registered MetadataField import returns a string, not an array", () => {
  const importRule = getTypeRule("MetadataField", "importFromYAML")
  const result = importRule?.(
    mockContext,
    { type: "MetadataField", metadataTarget: { kind: "field", owner: "explicit", roots: ["Catalog"] } } as any,
    "Справочник.Номенклатура.Реквизит.Артикул"
  )

  expect(result).toBe("Catalog.Номенклатура.Attribute.Артикул")
})
```

Append to `packages/core/metadata/commonObjects/metadataField/toYAML.test.ts`:

```ts
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"

test("registered MetadataField export returns a string, not an array", () => {
  const exportRule = getTypeRule("MetadataField", "exportToYAML")
  const result = exportRule?.(
    mockContext,
    { type: "MetadataField", metadataTarget: { kind: "field", owner: "explicit", roots: ["Catalog"] } } as any,
    "Catalog.Номенклатура.Attribute.Артикул"
  )

  expect(result).toBe("Справочник.Номенклатура.Реквизит.Артикул")
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataField/fromYAML.test.ts packages/core/metadata/commonObjects/metadataField/toYAML.test.ts
```

Expected: FAIL because `MetadataField` is currently registered with list handlers.

- [ ] **Step 3: Fix `MetadataField` registration**

In `packages/core/metadata/commonObjects/metadataField/fromYAML.ts`, change the registrations to:

```ts
registerTypeRule("MetadataField", "importFromYAML", importMetadataFieldFromYAML)
registerTypeRule("MetadataFields", "importFromYAML", importMetadataFieldsFromYAML)
```

In `packages/core/metadata/commonObjects/metadataField/toYAML.ts`, change the registrations to:

```ts
registerTypeRule("MetadataField", "exportToYAML", exportMetadataFieldToYAML)
registerTypeRule("MetadataFields", "exportToYAML", exportMetadataFieldsToYAML)
```

- [ ] **Step 4: Pass rule constraints through item links and type links**

In `packages/core/metadata/commonObjects/metadataRef/fromYAML.ts`, pass the current `rule` into `importMetadataFieldStringFromYAML`:

```ts
return importMetadataFieldStringFromYAML(context, rule, fromRoleYAML(rule, data))
```

In `packages/core/metadata/commonObjects/metadataRef/toYAML.ts`, pass the current `rule` into `exportMetadataFieldStringToYAML`:

```ts
return exportMetadataFieldStringToYAML(context, rule, toRoleYAML(rule, data))
```

In `packages/core/metadata/commonObjects/typeLink/fromYAML.ts`, replace the data path import line with:

```ts
  const dataPath = importMetadataFieldFromYAML(
    context,
    { type: "MetadataField", metadataTarget: { kind: "field", owner: "explicit" } } as PropertyRule,
    dataPathYAML
  )
```

In `packages/core/metadata/commonObjects/typeLink/toYAML.ts`, replace the data path export line with:

```ts
  const dataPathYAML = exportMetadataFieldToYAML(
    context,
    { type: "MetadataField", metadataTarget: { kind: "field", owner: "explicit" } } as PropertyRule,
    data.dataPath
  )
```

- [ ] **Step 5: Run focused tests and commit**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataRef packages/core/metadata/commonObjects/metadataField packages/core/metadata/commonObjects/typeLink
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/commonObjects/metadataRef packages/core/metadata/commonObjects/metadataField packages/core/metadata/commonObjects/typeLink
git commit -m "fix: :bug: унифицировать одиночные и списочные metadata-поля"
```

### Task 5: Rename `MetadataValueCollection` to `MetadataObjectRefCollection`

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataObjectRefCollection/types.ts`
- Create: `packages/core/metadata/commonObjects/metadataObjectRefCollection/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/metadataObjectRefCollection/toXML.ts`
- Create: `packages/core/metadata/commonObjects/metadataObjectRefCollection/fromYAML.ts`
- Create: `packages/core/metadata/commonObjects/metadataObjectRefCollection/toYAML.ts`
- Create: `packages/core/metadata/commonObjects/metadataObjectRefCollection/toJSONSchema.ts`
- Move tests from `metadataValueCollection` to `metadataObjectRefCollection` and update names.
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Create failing copied tests under new name**

Copy the existing test files from `packages/core/metadata/commonObjects/metadataValueCollection/` to `packages/core/metadata/commonObjects/metadataObjectRefCollection/` and change suite names to `MetadataObjectRefCollection`. Add this assertion to the YAML import test:

```ts
it("imports Russian object references through metadataTargets", () => {
  expect(importMetadataObjectRefCollectionFromYAML(mockContext, { type: "MetadataObjectRefCollection" } as any, [
    "Справочник.Контрагенты",
    "Документ.ЗаказПокупателя",
  ])).toEqual(["Catalog.Контрагенты", "Document.ЗаказПокупателя"])
})
```

- [ ] **Step 2: Run new tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataObjectRefCollection
```

Expected: FAIL with missing module files.

- [ ] **Step 3: Add new types and handlers**

Create `packages/core/metadata/commonObjects/metadataObjectRefCollection/types.ts`:

```ts
import { Static, Type } from "@sinclair/typebox"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"

export type MetadataObjectRefCollectionItem = string
export type MetadataObjectRefCollection = MetadataObjectRefCollectionItem[]

export type MetadataObjectRefCollectionItemXML = string
export type MetadataObjectRefCollectionXML = {
  "xr:Item": MetadataPrimitiveValueXML | MetadataPrimitiveValueXML[]
}

export type MetadataObjectRefCollectionItemYAML = string
export const MetadataObjectRefCollectionJSONSchema = Type.Array(Type.String())
export type MetadataObjectRefCollectionYAML = Static<typeof MetadataObjectRefCollectionJSONSchema>
```

Use the existing `metadataValueCollection` implementation as the mechanical base, with these exact replacements:

```ts
MetadataValueCollection -> MetadataObjectRefCollection
metadataValueCollection -> metadataObjectRefCollection
registerTypeRule("MetadataValueCollection" -> registerTypeRule("MetadataObjectRefCollection"
```

In YAML import/export, use object constraints:

```ts
const objectRefRule = { type: "MetadataValue", metadataTarget: { kind: "object" } } as const
```

For import, convert each item with:

```ts
const metadataValue = importMetadataValueFromYAML(context, objectRefRule as never, item) as MetadataRefValue
return metadataValue.value
```

For export, convert each item with:

```ts
return data.map((item) => exportMedatataRefToYAML(context, item))
```

- [ ] **Step 4: Register new property type**

In `packages/core/metadata/orchestration/property/registry.ts`, add imports for the new types beside the old collection import:

```ts
import {
  MetadataObjectRefCollection,
  MetadataObjectRefCollectionYAML,
} from "~/metadata/commonObjects/metadataObjectRefCollection/types"
```

Add registry entry near `MetadataValueCollection`:

```ts
  MetadataObjectRefCollection: {
    item: MetadataObjectRefCollection
    yaml: MetadataObjectRefCollectionYAML
  }
```

Add `"MetadataObjectRefCollection"` to `PropertyType`.

In `packages/core/metadata/commonObjects/index.ts`, add:

```ts
import "./metadataObjectRefCollection/fromXML"
import "./metadataObjectRefCollection/fromYAML"
import "./metadataObjectRefCollection/toJSONSchema"
import "./metadataObjectRefCollection/toXML"
import "./metadataObjectRefCollection/toYAML"
```

- [ ] **Step 5: Replace rule usages**

Run:

```bash
rg -n 'MetadataValueCollection' packages/core/metadata
```

For every `rules.ts` occurrence where XML stores `objectRef` items, replace:

```ts
type: "MetadataValueCollection"
```

with:

```ts
type: "MetadataObjectRefCollection",
metadataTarget: { kind: "object" },
```

Keep old `metadataValueCollection` source files until the codebase compiles, then remove them only when `rg -n 'MetadataValueCollection' packages/core/metadata` returns no production usage outside old tests.

- [ ] **Step 6: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataObjectRefCollection
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/commonObjects/metadataObjectRefCollection packages/core/metadata/commonObjects/index.ts packages/core/metadata/orchestration/property/registry.ts packages/core/metadata
git commit -m "refactor: :recycle: переименовать коллекцию objectRef"
```

### Task 6: Reference branches of `MetadataValue`

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/handlers.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/toJSONSchema.ts`
- Modify tests: `packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts`, `toYAML.test.ts`, `toJSONSchema.test.ts`

- [ ] **Step 1: Write failing tests for reference values**

Append to `packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts`:

```ts
it("imports EmptyRef and enum values through metadataTargets", () => {
  expect(importMetadataValueFromYAML(mockContext, { type: "MetadataValue", valueType: ["ref"] } as any, "Справочник.СтавкиНДС.ПустаяСсылка")).toEqual({
    type: "ref",
    value: "Catalog.СтавкиНДС.EmptyRef",
  })

  expect(importMetadataValueFromYAML(mockContext, { type: "MetadataValue", valueType: ["ref"] } as any, "Перечисление.ВидыДоговоров.СПоставщиком")).toEqual({
    type: "ref",
    value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
  })
})

it("rejects old PredefinedData values from YAML import", () => {
  expect(() =>
    importMetadataValueFromYAML(mockContext, { type: "MetadataValue", valueType: ["ref"] } as any, "Catalog.СтавкиНДС.PredefinedData.БезНДС")
  ).toThrow('Неизвестный корень "Catalog"')
})
```

Append to `packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts`:

```ts
it("exports canonical enum and EmptyRef values to Russian YAML", () => {
  expect(exportMetadataValueToYAML(mockContext, { type: "MetadataValue" } as any, {
    type: "ref",
    value: "Enum.ВидыДоговоров.EnumValue.СПоставщиком",
  })).toBe("Перечисление.ВидыДоговоров.СПоставщиком")

  expect(exportMetadataValueToYAML(mockContext, { type: "MetadataValue" } as any, {
    type: "ref",
    value: "Catalog.СтавкиНДС.EmptyRef",
  })).toBe("Справочник.СтавкиНДС.ПустаяСсылка")
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts
```

Expected: FAIL where old conversion accepts or formats noncanonical forms differently.

- [ ] **Step 3: Use `metadataTargets` in ref handler**

In `packages/core/metadata/commonObjects/metadataValue/handlers.ts`, keep primitive handlers for non-reference values and make `ref.fromYAML`/`ref.toYAML` call `importMetadataValueStringFromYAML` and `exportMetadataValueStringToYAML` with a local reference-value rule:

```ts
const referenceValueConstraint = {
  kind: "value" as const,
  valueKinds: ["predefinedValue", "enumValue", "emptyRef"] as const,
  allowEmptyRef: true,
}
```

In `primitiveValueHandlers.ref.fromYAML`, keep:

```ts
const converted = importMetadataValueStringFromYAML(ctx, { type: "MetadataValue", metadataTarget: referenceValueConstraint } as any, data)
if (!converted || !converted.includes(".")) return undefined
return { type: "ref", value: converted } satisfies MetadataRefValue
```

In `primitiveValueHandlers.ref.toYAML`, keep:

```ts
const result = exportMetadataValueStringToYAML(ctx, { type: "MetadataValue", metadataTarget: referenceValueConstraint } as any, (v as MetadataRefValue).value)
if (!result) throw new Error(`MetadataValue: не удалось экспортировать ref: ${(v as MetadataRefValue).value}`)
return result
```

- [ ] **Step 4: Add schema for `MetadataValue` reference-only rules**

In `packages/core/metadata/commonObjects/metadataValue/toJSONSchema.ts`, replace the exporter with:

```ts
import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { buildMetadataTargetSchema } from "../metadataTargets"
import { MetadataValueJSONSchema } from "./types"

export const exportMetadataValueToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.type === "MetadataValue" && rule.metadataTarget !== undefined) {
    return buildMetadataTargetSchema(rule.metadataTarget)
  }

  return MetadataValueJSONSchema
}

registerTypeRule("MetadataValue", "exportToJSONSchema", exportMetadataValueToJSONSchema)
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataValue
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/commonObjects/metadataValue
git commit -m "refactor: :recycle: унифицировать ссылочные MetadataValue"
```

### Task 7: `ProjectMetadataResolver`

**Files:**
- Create: `packages/core/metadata/validation/projectMetadataResolver.ts`
- Create: `packages/core/metadata/validation/projectMetadataResolver.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
- Modify: `packages/core/metadata/validation/dataPath/objectFields.ts`

- [ ] **Step 1: Write failing resolver tests**

Create `packages/core/metadata/validation/projectMetadataResolver.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "~/metadata/commonObjects/metadataTargets"
import { mockContext } from "~/tests/mockContext"
import { createProjectYamlCache } from "./projectYamlCache"
import { createProjectMetadataResolver } from "./projectMetadataResolver"

describe("ProjectMetadataResolver", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("resolves top-level objects from project YAML", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Контрагенты/Свойства.yaml", "Комментарий: ok\n")
    const resolver = createResolver(projectDir)
    const parsed = parseMetadataTargetFromYAML({
      value: "Справочник.Контрагенты",
      constraint: { kind: "object", roots: ["Catalog"] },
    })

    expect(parsed.ok).toBe(true)
    expect(resolver.resolveObject({ target: parsed.ok ? parsed.target : undefined as never })).toMatchObject({
      ok: true,
      filePath: join(projectDir, "Справочник", "Контрагенты", "Свойства.yaml"),
    })
  })

  it("reports unknown object without suggesting Russian replacement for English roots", () => {
    const projectDir = createProject()
    const resolver = createResolver(projectDir)

    expect(resolver.resolveObject({
      target: { kind: "object", root: "Catalog", objectName: "НетТакого" },
    })).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ source: "reference", message: 'Не найден объект "Справочник.НетТакого"' })],
    })
  })

  it("resolves fields including standard attributes and tabular-section attributes", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: Число",
    ].join("\n"))
    const resolver = createResolver(projectDir)

    expect(resolver.resolveField({
      target: {
        kind: "field",
        root: "Catalog",
        objectName: "Номенклатура",
        segments: [{ kind: "StandardAttribute", name: "Наименование" }],
      },
    })).toMatchObject({ ok: true })

    expect(resolver.resolveField({
      target: {
        kind: "field",
        root: "Catalog",
        objectName: "Номенклатура",
        segments: [
          { kind: "TabularSection", name: "Товары" },
          { kind: "Attribute", name: "Количество" },
        ],
      },
    })).toMatchObject({ ok: true })
  })

  it("resolves predefined values and EmptyRef", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/СтавкиНДС/Свойства.yaml", [
      "Предопределенные:",
      "  БезНДС:",
      "    ИмяПредопределенныхДанных: БезНДС",
    ].join("\n"))
    const resolver = createResolver(projectDir)

    expect(resolver.resolveValue({
      target: { kind: "value", root: "Catalog", objectName: "СтавкиНДС", valueKind: "emptyRef" },
    })).toMatchObject({ ok: true })

    expect(resolver.resolveValue({
      target: { kind: "value", root: "Catalog", objectName: "СтавкиНДС", valueKind: "predefinedValue", valueName: "БезНДС" },
    })).toMatchObject({ ok: true })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-project-resolver-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  function writeProjectFile(projectDir: string, projectPath: string, text: string): void {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, `${text.trimEnd()}\n`)
  }

  function createResolver(projectDir: string) {
    return createProjectMetadataResolver({
      projectDir,
      yamlCache: createProjectYamlCache(),
      context: mockContext,
    })
  }
})
```

- [ ] **Step 2: Run resolver tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/validation/projectMetadataResolver.test.ts
```

Expected: FAIL with missing `projectMetadataResolver`.

- [ ] **Step 3: Expose object field lookup for resolver**

In `packages/core/metadata/validation/dataPath/objectFields.ts`, export a helper:

```ts
export function getObjectField(params: { index: ObjectFieldIndex; name: string }): ObjectField | undefined {
  return params.index.fields.get(params.name)
}
```

Keep `buildObjectFieldIndex` unchanged except for any test-driven additions needed for standard attributes.

- [ ] **Step 4: Add project resolver**

Create `packages/core/metadata/validation/projectMetadataResolver.ts`:

```ts
import { existsSync } from "fs"
import { join, resolve } from "path"
import type { ParsedMetadataTarget, MetadataFieldSegment } from "~/metadata/commonObjects/metadataTargets"
import type { ConfigurationContext } from "~/metadata/context/types"
import { rootToYAML } from "~/metadata/commonObjects/metadataTargets"
import { createOwnerMetadataCache, type OwnerMetadataCache } from "./dataPath/ownerCache"
import { getObjectField, type ObjectField, type ObjectFieldTableSource } from "./dataPath/objectFields"
import type { ProjectYamlCache } from "./projectYamlCache"
import type { Diagnostic } from "./types"

export interface CreateProjectMetadataResolverParams {
  projectDir: string
  yamlCache: ProjectYamlCache
  context: ConfigurationContext
  ownerCache?: OwnerMetadataCache
}

export type MetadataResolveResult =
  | { ok: true; filePath?: string; details?: unknown }
  | { ok: false; diagnostics: Diagnostic[] }

export interface ProjectMetadataResolver {
  resolveObject(params: { target: Extract<ParsedMetadataTarget, { kind: "object" }> }): MetadataResolveResult
  resolveField(params: { target: Extract<ParsedMetadataTarget, { kind: "field" }> }): MetadataResolveResult
  resolveValue(params: { target: Extract<ParsedMetadataTarget, { kind: "value" }> }): MetadataResolveResult
  resolveStyleItem(params: { name: string; expectedTypes: readonly ("Color" | "Font" | "Border")[] }): MetadataResolveResult
  resolveCommonPicture(params: { name: string }): MetadataResolveResult
}

export function createProjectMetadataResolver(params: CreateProjectMetadataResolverParams): ProjectMetadataResolver {
  const projectDir = resolve(params.projectDir)
  const ownerCache = params.ownerCache ?? createOwnerMetadataCache({
    projectDir,
    yamlCache: params.yamlCache,
    context: params.context,
  })

  return {
    resolveObject({ target }) {
      const filePath = objectFilePath(projectDir, target.root, target.objectName)
      if (existsSync(filePath)) return { ok: true, filePath }
      return referenceError(filePath, `Не найден объект "${rootToYAML[target.root]}.${target.objectName}"`)
    },

    resolveField({ target }) {
      const owner = ownerCache.get({ kind: rootToYAML[target.root] as never, name: target.objectName })
      if (owner.status !== "ok") return { ok: false, diagnostics: owner.diagnostics }
      const resolved = resolveFieldSegments(owner.owner.fieldIndex.fields, target.segments)
      if (resolved.ok) return { ok: true, filePath: owner.owner.filePath, details: resolved.field }
      return referenceError(owner.owner.filePath, `Не найдено поле "${formatFieldTarget(target)}": ${resolved.message}`)
    },

    resolveValue({ target }) {
      const object = this.resolveObject({ target: { kind: "object", root: target.root, objectName: target.objectName } })
      if (!object.ok) return object
      if (target.valueKind === "emptyRef") return object

      const owner = ownerCache.get({ kind: rootToYAML[target.root] as never, name: target.objectName })
      if (owner.status !== "ok") return { ok: false, diagnostics: owner.diagnostics }
      const predefined = (owner.owner.model as Record<string, unknown>).predefined
      if (target.valueName && hasNamedItem(predefined, target.valueName)) return { ok: true, filePath: owner.owner.filePath }
      return referenceError(owner.owner.filePath, `Не найдено предопределенное значение "${rootToYAML[target.root]}.${target.objectName}.${target.valueName ?? ""}"`)
    },

    resolveStyleItem({ name }) {
      const filePath = join(projectDir, "ЭлементСтиля", name, "Свойства.yaml")
      return existsSync(filePath) ? { ok: true, filePath } : referenceError(filePath, `Не найден элемент стиля "ЭлементСтиля.${name}"`)
    },

    resolveCommonPicture({ name }) {
      const filePath = join(projectDir, "ОбщаяКартинка", name, "Свойства.yaml")
      return existsSync(filePath) ? { ok: true, filePath } : referenceError(filePath, `Не найдена общая картинка "ОбщаяКартинка.${name}"`)
    },
  }
}

function resolveFieldSegments(
  fields: Map<string, ObjectField>,
  segments: readonly MetadataFieldSegment[]
): { ok: true; field: ObjectField } | { ok: false; message: string } {
  let currentFields = fields
  let currentField: ObjectField | undefined
  for (const segment of segments) {
    currentField = getObjectField({ index: { fields: currentFields, diagnostics: [] }, name: segment.name })
    if (!currentField) return { ok: false, message: `нет сегмента "${segment.name}"` }
    if (segment.kind !== currentField.kind && !(segment.kind === "Attribute" && currentField.kind === "attribute") && !(segment.kind === "StandardAttribute" && currentField.kind === "standardAttribute")) {
      return { ok: false, message: `"${segment.name}" имеет другой вид` }
    }
    const tableSource: ObjectFieldTableSource | undefined = currentField.tableSource
    if (tableSource !== undefined) currentFields = tableSource.columns
  }
  return currentField ? { ok: true, field: currentField } : { ok: false, message: "пустой путь" }
}

function objectFilePath(projectDir: string, root: keyof typeof rootToYAML, name: string): string {
  return join(projectDir, rootToYAML[root], name, "Свойства.yaml")
}

function hasNamedItem(value: unknown, name: string): boolean {
  if (Array.isArray(value)) return value.some((item) => typeof item === "object" && item !== null && (item as { name?: unknown }).name === name)
  if (typeof value === "object" && value !== null) return Object.prototype.hasOwnProperty.call(value, name)
  return false
}

function formatFieldTarget(target: Extract<ParsedMetadataTarget, { kind: "field" }>): string {
  return [rootToYAML[target.root], target.objectName, ...target.segments.flatMap((segment) => [segment.kind, segment.name])].join(".")
}

function referenceError(filePath: string, message: string): MetadataResolveResult {
  return { ok: false, diagnostics: [{ filePath, line: 1, col: 1, source: "reference", severity: "error", message }] }
}
```

- [ ] **Step 5: Run resolver tests and commit**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/validation/projectMetadataResolver.test.ts packages/core/metadata/validation/dataPath/objectFields.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/validation/projectMetadataResolver.ts packages/core/metadata/validation/projectMetadataResolver.test.ts packages/core/metadata/validation/dataPath/objectFields.ts
git commit -m "feat: :sparkles: добавить проектный резолвер метаданных"
```

### Task 8: Rule-driven validation traversal

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Create: `packages/core/metadata/validation/metadataTargetTraversal.ts`
- Create: `packages/core/metadata/validation/metadataTargetTraversal.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`

- [ ] **Step 1: Write failing traversal tests**

Create `packages/core/metadata/validation/metadataTargetTraversal.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { validateMetadataTargetsInModel } from "./metadataTargetTraversal"

describe("validateMetadataTargetsInModel", () => {
  it("calls registered validation handler for properties with metadataTarget", () => {
    const calls: unknown[] = []
    registerTypeRule("MetadataItemLink", "validateMetadataTarget", (params) => {
      calls.push(params.value)
      return []
    })

    const rule: MetadataItemRule = {
      itemType: "MetadataCatalog",
      properties: {
        inputByString: {
          type: "MetadataItemLink",
          yaml: "ВводПоСтроке",
          metadataTarget: { kind: "object", roots: ["Catalog"] },
        },
      },
    } as any

    const diagnostics = validateMetadataTargetsInModel({
      filePath: "/tmp/Свойства.yaml",
      parsed: { doc: { contents: undefined }, lineCounter: { linePos: () => ({ line: 1, col: 1 }) } } as any,
      model: { itemType: "MetadataCatalog", inputByString: "Catalog.Контрагенты" } as any,
      rule,
      resolver: {} as any,
    })

    expect(diagnostics).toEqual([])
    expect(calls).toEqual(["Catalog.Контрагенты"])
  })
})
```

- [ ] **Step 2: Run traversal tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/validation/metadataTargetTraversal.test.ts
```

Expected: FAIL because `validateMetadataTarget` operation does not exist.

- [ ] **Step 3: Add registry operation**

In `packages/core/metadata/orchestration/property/fn.ts`, add:

```ts
import type { ProjectMetadataResolver } from "~/metadata/validation/projectMetadataResolver"
import type { Diagnostic } from "~/metadata/validation/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { YamlPath } from "~/metadata/validation/yamlLocations"
```

Add this type:

```ts
export type ValidateMetadataTargetFunction = (params: {
  filePath: string
  parsed: ParsedYaml
  yamlPath: YamlPath
  propRule: PropertyRule
  propertyName: string
  value: unknown
  resolver: ProjectMetadataResolver
}) => Diagnostic[]
```

Add it to `TypeRule`:

```ts
  validateMetadataTarget?: ValidateMetadataTargetFunction
```

Add operation name:

```ts
  | "validateMetadataTarget"
```

Add the conditional branch in `importExportFunction` and `getTypeRule` typing for `validateMetadataTarget`.

In `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`, add `ValidateMetadataTargetFunction` to imports and the map union.

- [ ] **Step 4: Add traversal implementation**

Create `packages/core/metadata/validation/metadataTargetTraversal.ts`:

```ts
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItem, MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { ProjectMetadataResolver } from "./projectMetadataResolver"
import type { Diagnostic } from "./types"
import type { YamlPath } from "./yamlLocations"

export interface ValidateMetadataTargetsInModelParams {
  filePath: string
  parsed: ParsedYaml
  model: MetadataItem
  rule: MetadataItemRule
  resolver: ProjectMetadataResolver
}

export function validateMetadataTargetsInModel(params: ValidateMetadataTargetsInModelParams): Diagnostic[] {
  return validateObject({
    ...params,
    value: params.model,
    yamlPath: [],
  })
}

function validateObject(params: ValidateMetadataTargetsInModelParams & { value: unknown; yamlPath: YamlPath }): Diagnostic[] {
  const record = asRecord(params.value)
  if (record === undefined) return []

  const diagnostics: Diagnostic[] = []
  for (const [propertyName, propRule] of Object.entries(params.rule.properties)) {
    if (typeof propRule.yaml !== "string") continue
    const value = record[propertyName]
    if (value === undefined) continue

    const handler = getTypeRule(propRule.type, "validateMetadataTarget")
    if (handler && propRule.metadataTarget) {
      diagnostics.push(
        ...handler({
          filePath: params.filePath,
          parsed: params.parsed,
          yamlPath: [...params.yamlPath, propRule.yaml],
          propRule,
          propertyName,
          value,
          resolver: params.resolver,
        })
      )
    }
  }

  return diagnostics
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : undefined
}
```

- [ ] **Step 5: Wire traversal into `validateProject`**

In `packages/core/metadata/validation/validateProject.ts`, import:

```ts
import { createProjectMetadataResolver, type ProjectMetadataResolver } from "./projectMetadataResolver"
import { validateMetadataTargetsInModel } from "./metadataTargetTraversal"
```

Extend `validateProject` setup:

```ts
  const metadataResolver = createProjectMetadataResolver({ projectDir, yamlCache: cache, context, ownerCache })
```

Pass `metadataResolver` into `validateProjectFile` and `validateProjectProperties`.

In `validateProjectProperties`, append:

```ts
    ...validateMetadataTargetsInModel({
      filePath: params.file.absolutePath,
      parsed: entry.parsed,
      model: imported.model,
      rule: params.file.owner.spec.rule,
      resolver: params.metadataResolver,
    }),
```

- [ ] **Step 6: Run traversal and project validation tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/validation/metadataTargetTraversal.test.ts packages/core/metadata/validation/validateProject.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/orchestration/property/fn.ts packages/core/metadata/orchestration/property/typeRuleRegistry.ts packages/core/metadata/validation/metadataTargetTraversal.ts packages/core/metadata/validation/metadataTargetTraversal.test.ts packages/core/metadata/validation/validateProject.ts
git commit -m "feat: :sparkles: проверять metadataTarget через rules.ts"
```

### Task 9: Register validation handlers for pilot types

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRef/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataField/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataObjectRefCollection/fromYAML.ts`
- Create: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify tests: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Write failing `validateProject` reference tests**

Append to `packages/core/metadata/validation/validateProject.test.ts`:

```ts
it("validates MetadataItemLink targets from rules metadataTarget", () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Источник/Свойства.yaml", [
    "ВводНаОсновании:",
    "  - Справочник.НетТакого",
  ])

  const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

  expect(diagnostics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        source: "reference",
        severity: "error",
        message: 'Не найден объект "Справочник.НетТакого"',
      }),
    ])
  )
})

it("reports English YAML roots as ordinary structure errors", () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Источник/Свойства.yaml", [
    "ВводНаОсновании:",
    "  - Catalog.Контрагенты",
  ])

  const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

  expect(diagnostics.map((diagnostic) => diagnostic.message).join("\n")).toContain('Неизвестный корень "Catalog"')
  expect(diagnostics.map((diagnostic) => diagnostic.message).join("\n")).not.toContain("Справочник.Контрагенты")
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/validation/validateProject.test.ts
```

Expected: FAIL because no handlers validate metadata targets yet.

- [ ] **Step 3: Add reusable validation handlers**

Create `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`:

```ts
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { ValidateMetadataTargetFunction } from "~/metadata/orchestration/property/fn"
import { diagnosticAtYamlPath } from "~/metadata/validation/yamlLocations"
import { parseMetadataTargetFromModel } from "./parse"

const validateObjectTarget: ValidateMetadataTargetFunction = (params) => {
  if (typeof params.value !== "string") return []
  const parsed = parseMetadataTargetFromModel({ canonical: params.value, constraint: params.propRule.metadataTarget })
  if (!parsed.ok) return [diagnosticAtYamlPath({ filePath: params.filePath, parsed: params.parsed, path: params.yamlPath, source: "structure", severity: "error", message: parsed.message })]
  if (parsed.target.kind !== "object") return []
  const result = params.resolver.resolveObject({ target: parsed.target })
  return result.ok ? [] : result.diagnostics
}

const validateFieldTarget: ValidateMetadataTargetFunction = (params) => {
  if (typeof params.value !== "string") return []
  const parsed = parseMetadataTargetFromModel({ canonical: params.value, constraint: params.propRule.metadataTarget })
  if (!parsed.ok) return [diagnosticAtYamlPath({ filePath: params.filePath, parsed: params.parsed, path: params.yamlPath, source: "structure", severity: "error", message: parsed.message })]
  if (parsed.target.kind !== "field") return []
  const result = params.resolver.resolveField({ target: parsed.target })
  return result.ok ? [] : result.diagnostics
}

const validateReferenceValueTarget: ValidateMetadataTargetFunction = (params) => {
  if (typeof params.value !== "object" || params.value === null || !("type" in params.value) || !("value" in params.value)) return []
  const value = params.value as { type: string; value: unknown }
  if (value.type !== "ref" || typeof value.value !== "string") return []
  const parsed = parseMetadataTargetFromModel({ canonical: value.value, constraint: params.propRule.metadataTarget })
  if (!parsed.ok) return [diagnosticAtYamlPath({ filePath: params.filePath, parsed: params.parsed, path: params.yamlPath, source: "structure", severity: "error", message: parsed.message })]
  if (parsed.target.kind !== "value") return []
  const result = params.resolver.resolveValue({ target: parsed.target })
  return result.ok ? [] : result.diagnostics
}

const validateObjectTargetList: ValidateMetadataTargetFunction = (params) => {
  if (!Array.isArray(params.value)) return []
  return params.value.flatMap((value, index) => validateObjectTarget({ ...params, value, yamlPath: [...params.yamlPath, index] }))
}

const validateFieldTargetList: ValidateMetadataTargetFunction = (params) => {
  if (!Array.isArray(params.value)) return []
  return params.value.flatMap((value, index) => validateFieldTarget({ ...params, value, yamlPath: [...params.yamlPath, index] }))
}

registerTypeRule("MetadataItemLink", "validateMetadataTarget", validateObjectTarget)
registerTypeRule("MetadataItemLinks", "validateMetadataTarget", validateObjectTargetList)
registerTypeRule("MetadataField", "validateMetadataTarget", validateFieldTarget)
registerTypeRule("MetadataFields", "validateMetadataTarget", validateFieldTargetList)
registerTypeRule("MetadataObjectRefCollection", "validateMetadataTarget", validateObjectTargetList)
registerTypeRule("MetadataValue", "validateMetadataTarget", validateReferenceValueTarget)
```

In `packages/core/metadata/commonObjects/index.ts`, import:

```ts
import "./metadataTargets/validationHandlers"
```

- [ ] **Step 4: Add `metadataTarget` to pilot rules**

Run:

```bash
rg -n 'type: "MetadataItemLink"|type: "MetadataItemLinks"|type: "MetadataField"|type: "MetadataFields"|type: "MetadataObjectRefCollection"|type: "MetadataValue"' packages/core/metadata -g 'rules.ts'
```

For pilot rules only, add constraints:

```ts
metadataTarget: { kind: "object", roots: ["Catalog", "Document"], scope: "project" }
```

for object links like `ВводНаОсновании` and owners, and:

```ts
metadataTarget: { kind: "field", owner: "this", fieldKinds: ["Attribute", "StandardAttribute", "Dimension", "Resource"] }
```

for field lists like data lock fields. For default fill values, use:

```ts
metadataTarget: {
  kind: "value",
  valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
  allowEmptyRef: true,
}
```

- [ ] **Step 5: Run validation tests and commit**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/validation/metadataTargetTraversal.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata packages/core/metadata/validation/validateProject.test.ts
git commit -m "feat: :sparkles: валидировать ссылки метаданных через rules.ts"
```

### Task 10: Style items and common pictures

**Files:**
- Modify: `packages/core/metadata/commonObjects/color/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/color/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/font/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/font/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/border/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/border/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/picture/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/picture/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Tests: corresponding `fromYAML.test.ts`, `toYAML.test.ts`, `toJSONSchema.test.ts`

- [ ] **Step 1: Write failing style-reference tests**

Append to `packages/core/metadata/commonObjects/font/fromYAML.test.ts`:

```ts
it("imports project style item font refs from Russian YAML root", () => {
  expect(importFontFromYAML(mockContext, undefined, { Вид: "ЭлементСтиля.ОсновнойШрифт" } as any)).toMatchObject({
    kind: "StyleItem",
    ref: "ОсновнойШрифт",
  })
})

it("rejects raw style font prefixes in YAML", () => {
  expect(() => importFontFromYAML(mockContext, undefined, { Вид: "style:ОсновнойШрифт" } as any)).toThrow('Неизвестный корень "style:ОсновнойШрифт"')
})
```

Append to `packages/core/metadata/commonObjects/picture/fromYAML.test.ts`:

```ts
it("imports common picture refs only with Russian YAML root", () => {
  expect(importPictureFromYAML(mockContext, undefined, "ОбщаяКартинка.Логотип")).toMatchObject({
    type: "CommonPicture",
    ref: "Логотип",
  })
})
```

- [ ] **Step 2: Run style tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/font/fromYAML.test.ts packages/core/metadata/commonObjects/picture/fromYAML.test.ts
```

Expected: FAIL for unsupported Russian project roots and accepted raw prefixes.

- [ ] **Step 3: Parse project style refs through `metadataTargets`**

In `font/fromYAML.ts`, change `importRefFromYAML` first branch to:

```ts
  if (value.startsWith("ЭлементСтиля.")) {
    const parsed = parseMetadataTargetFromYAML({
      value,
      constraint: { kind: "styleItem", styleItemTypes: ["Font"] },
    })
    if (!parsed.ok) throw new Error(parsed.message)
    return { ref: parsed.target.name, kind: "StyleItem" }
  }

  if (isRawPrefixedFontRef(value)) {
    throw new Error(`Неизвестный корень "${value}"`)
  }
```

In `font/toYAML.ts`, change `convertRefToYAML` for non-system style refs:

```ts
  if (kind === "StyleItem") {
    const system = exportSystemEnumerationToYAMLDeprecated(context, { type: "SystemEnumeration", typeSE: "StyleFonts" }, ref)
    return system ?? `ЭлементСтиля.${ref}`
  }
```

In `border/fromYAML.ts`, parse `Имя`:

```ts
  if (data.Имя !== undefined) {
    const parsed = parseMetadataTargetFromYAML({
      value: data.Имя,
      constraint: { kind: "styleItem", styleItemTypes: ["Border"] },
    })
    if (!parsed.ok) throw new Error(parsed.message)
    result.ref = parsed.target.name
  }
```

In `picture/fromYAML.ts`, before absolute-picture detection:

```ts
  if (typeof ref === "string" && ref.startsWith("ОбщаяКартинка.")) {
    const parsed = parseMetadataTargetFromYAML({ value: ref, constraint: { kind: "commonPicture" } })
    if (!parsed.ok) throw new Error(parsed.message)
    return createPicture(parsed.target.name, "CommonPicture", loadTransparent, transparentPixel)
  }
```

- [ ] **Step 4: Add validation handlers**

In `metadataTargets/validationHandlers.ts`, register:

```ts
registerTypeRule("Color", "validateMetadataTarget", (params) => {
  if (typeof params.value !== "object" || params.value === null) return []
  const color = params.value as { type?: string; value?: unknown }
  if (color.type !== "StyleItem" || typeof color.value !== "string") return []
  const result = params.resolver.resolveStyleItem({ name: color.value, expectedTypes: ["Color"] })
  return result.ok ? [] : result.diagnostics
})

registerTypeRule("Font", "validateMetadataTarget", (params) => {
  if (typeof params.value !== "object" || params.value === null) return []
  const font = params.value as { kind?: string; ref?: unknown }
  if (font.kind !== "StyleItem" || typeof font.ref !== "string") return []
  const result = params.resolver.resolveStyleItem({ name: font.ref, expectedTypes: ["Font"] })
  return result.ok ? [] : result.diagnostics
})

registerTypeRule("Border", "validateMetadataTarget", (params) => {
  if (typeof params.value !== "object" || params.value === null) return []
  const border = params.value as { ref?: unknown }
  if (typeof border.ref !== "string") return []
  const result = params.resolver.resolveStyleItem({ name: border.ref, expectedTypes: ["Border"] })
  return result.ok ? [] : result.diagnostics
})

registerTypeRule("Picture", "validateMetadataTarget", (params) => {
  if (typeof params.value !== "object" || params.value === null) return []
  const picture = params.value as { type?: string; ref?: unknown }
  if (picture.type !== "CommonPicture" || typeof picture.ref !== "string") return []
  const result = params.resolver.resolveCommonPicture({ name: picture.ref })
  return result.ok ? [] : result.diagnostics
})
```

- [ ] **Step 5: Add schemas and commit**

For `ColorJSONSchema`, keep built-ins and absolute color, but use `buildMetadataTargetSchema({ kind: "styleItem", styleItemTypes: ["Color"] })` for project refs. For `FontJSONSchema`, set `Вид` to `Type.Optional(Type.String({ description: "Встроенный шрифт или ЭлементСтиля.<ИмяЭлементаСтиля>" }))`. For `BorderJSONSchema`, set `Имя` to `buildMetadataTargetSchema({ kind: "styleItem", styleItemTypes: ["Border"] })`. For `PictureJSONSchema`, include examples with `ОбщаяКартинка.Логотип`.

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/color packages/core/metadata/commonObjects/font packages/core/metadata/commonObjects/border packages/core/metadata/commonObjects/picture
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/commonObjects/color packages/core/metadata/commonObjects/font packages/core/metadata/commonObjects/border packages/core/metadata/commonObjects/picture packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts
git commit -m "feat: :sparkles: унифицировать ссылки оформления"
```

### Task 11: DataPath reuse and `referenceScope` deprecation path

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
- Modify: `packages/core/metadata/validation/validateForm.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Tests: existing `packages/core/metadata/validation/dataPath/*.test.ts`, `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`

- [ ] **Step 1: Add compatibility-free deprecation comments**

In `BasePropertyRule`, replace the `referenceScope` comment with:

```ts
  /**
   * @deprecated Используется только старым sync форм и шаблонов до переноса на metadataTarget.
   * Новые правила должны использовать metadataTarget.
   */
  referenceScope?: ReferenceScope
```

- [ ] **Step 2: Add bridge helper for current form sync**

Create a local helper in `packages/core/metadata/orchestration/appliedObject/syncToXML.ts` near the current `referenceScope` usage:

```ts
function isLocalFormReferenceRule(propRule: PropertyRule): boolean {
  if (propRule.metadataTarget?.kind === "localChild" && propRule.metadataTarget.childKind === "Form") return true
  return propRule.referenceScope?.target === "this" && propRule.referenceScope.kind === "Form"
}
```

Replace the current condition:

```ts
if (propRule.referenceScope?.target !== "this" || propRule.referenceScope.kind !== "Form") continue
```

with:

```ts
if (!isLocalFormReferenceRule(propRule)) continue
```

- [ ] **Step 3: Keep DataPath on existing resolver, but share owner cache**

In `validateProject.ts`, pass the same `ownerCache` to `createProjectMetadataResolver` and `validateForm`. Verify no new YAML reads are introduced by the existing test `uses one YAML cache for repeated owner reads`.

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/validation/dataPath packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/orchestration/property/types.ts packages/core/metadata/orchestration/appliedObject/syncToXML.ts packages/core/metadata/validation
git commit -m "refactor: :recycle: связать DataPath и metadataTarget через общий cache"
```

### Task 12: Final migration sweep and verification

**Files:**
- Modify: remaining `packages/core/metadata/**/rules.ts` with metadata references.
- Modify: `packages/core/index.ts` if old `referenceScope` helpers remain public and are no longer used.
- Modify docs: `docs/superpowers/specs/2026-06-13-metadata-reference-values-unification-design.md` only if implementation uncovered a concrete design correction.

- [ ] **Step 1: Search for old public concepts**

Run:

```bash
rg -n 'MetadataValueCollection|PredefinedData|x-nkdk-graph|referenceScope|Catalog\\.|CommonPicture\\.|style:' packages/core/metadata packages/core/index.ts
```

Expected allowed leftovers:

- `referenceScope` only in deprecated type declaration and temporary sync bridge.
- `Catalog.` only in tests or canonical model examples.
- `PredefinedData` only in tests that assert rejection.
- `x-nkdk-graph` not introduced by `metadataTargets` schema.

- [ ] **Step 2: Add metadataTarget constraints to remaining direct consumers**

For each remaining `rules.ts` property found by:

```bash
rg -n 'type: "MetadataItemLink"|type: "MetadataItemLinks"|type: "MetadataField"|type: "MetadataFields"|type: "FieldsList"|type: "TypeLink"|type: "MetadataValue"|type: "MetadataDcsMetadataValue"|type: "Color"|type: "Font"|type: "Border"|type: "Picture"' packages/core/metadata -g 'rules.ts'
```

Add one of these exact constraints:

```ts
metadataTarget: { kind: "object", scope: "project" }
metadataTarget: { kind: "field", owner: "explicit" }
metadataTarget: { kind: "field", owner: "this" }
metadataTarget: { kind: "value", valueKinds: ["predefinedValue", "enumValue", "emptyRef"], allowEmptyRef: true }
metadataTarget: { kind: "styleItem", styleItemTypes: ["Color"] }
metadataTarget: { kind: "styleItem", styleItemTypes: ["Font"] }
metadataTarget: { kind: "styleItem", styleItemTypes: ["Border"] }
metadataTarget: { kind: "commonPicture" }
```

Use the narrowest `roots` list only when the rule already restricts the target. Do not invent project-specific object names in schema.

- [ ] **Step 3: Run type-check and all tests**

Run:

```bash
pnpm --filter @nakidka/core type-check
pnpm test
```

Expected: both commands PASS.

- [ ] **Step 4: Final commit**

Commit:

```bash
git add packages/core docs/superpowers/specs/2026-06-13-metadata-reference-values-unification-design.md
git commit -m "feat: :sparkles: завершить унификацию metadata-ссылок"
```

## Self-Review Checklist

- Every YAML-facing metadata reference uses Russian roots; `Catalog.*` in YAML fails as an unknown root.
- Canonical model strings use English roots and service segments; real object and field names remain project names.
- Field paths in YAML include `Реквизит`, `СтандартныйРеквизит`, `ТабличнаяЧасть`, `Измерение` or `Ресурс`.
- `PredefinedData` is not accepted as a canonical model segment.
- `ПустаяСсылка` maps only to terminal `EmptyRef`.
- JSON Schema contains ordinary `type`, `pattern`, `examples`, `description`; new schema output does not use `x-nkdk-metadataTarget`.
- `validate` reads project data through `ProjectYamlCache` and shared owner cache.
- New validation logic is registered by property type and discovered through `rules.ts`.
- `referenceScope` is marked deprecated and not extended for new rules.
- Full verification ends with `pnpm test` from the repository root.
