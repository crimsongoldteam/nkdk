# Shared Deferred Object Values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести import и full XML sync на общий механизм отложенных значений с прямыми ссылками на окончательные деревья и формировать XML полной синхронизации в первом проходе без удержания разобранного YAML.

**Architecture:** Нейтральный модуль `metadata/orchestration/property/deferredObjectValues.ts` связывает временные пути с `{ object, key }`, проверяет актуальность ссылок и заменяет значения через направленный обработчик. Import привязывает отложенные значения после окончательной сортировки YAML; full sync до первого прохода получает прежний индекс и состав проекта, преобразует каждый YAML в окончательные XML-документы, а во втором проходе только уточняет связанные значения, сериализует XML и завершает фрагмент индекса.

**Tech Stack:** TypeScript 6, Vitest 4, Piscina worker threads, существующие `rules.ts`, `ConfigurationIndexCollector`, `fast-xml-parser` через проектные `xmlExport`/import helpers.

## Global Constraints

- Один YAML читается, хэшируется, разбирается и обходится по `rules.ts` один раз.
- Между проходами full sync хранит готовые XML-деревья, связанные отложенные значения и `ConfigurationIndexCollector`, но не `PreparedYamlFile`, YAML-текст или корневой YAML-объект.
- XML полной синхронизации должен остаться побайтово идентичным; результат импорта YAML — текстово и семантически идентичным.
- Снимок конфигурации должен быть корректным и детерминированным при любом числе worker; побайтовое совпадение с прежним индексом не является обязательным.
- Подготовленные XML остаются в памяти; ранняя запись готовых документов и временные файлы в эту работу не входят.
- Общие metadata-слои не знают конкретных `itemType`, XML-корней и каталогов конкретных объектов.
- Существующие XML-фикстуры не изменять.
- Новые правила конкретных объектов не добавлять без выявленной необходимости; направленные операции регистрировать через общий реестр типов.
- После реализации обязательно выполнить `pnpm test` из корня.

---

## File Map

**Новые файлы**

- `packages/core/metadata/orchestration/property/deferredObjectValues.ts` — нейтральные типы, связывание временных путей, проверка актуальности ссылок и замена значения.
- `packages/core/metadata/orchestration/property/deferredObjectValues.test.ts` — объектные, массивные, вложенные, отсутствующие и устаревшие цели.
- `packages/core/metadata/orchestration/property/finalizeExportedXML.ts` — направленный адаптер XML: разрешение `rulePath`, вызов `finalizeExportedXML`, завершение сборщика индекса.
- `packages/core/metadata/orchestration/property/finalizeExportedXML.test.ts` — проверка направленного адаптера без знания конкретных metadata-типов.
- `packages/core/metadata/fullSyncToXml/prepareAssignment.ts` — подготовка окончательных XML-документов и сборщика индекса без файловой записи.
- `packages/core/metadata/fullSyncToXml/prepareAssignment.test.ts` — подготовка owner/form/configuration, отсутствие записи и один проход правил.

**Изменяемые файлы**

- `packages/core/metadata/orchestration/property/importYamlTypes.ts` — общий `DeferredValuePath`, отдельный сборщик временных путей, сигнатура `FinalizeExportedXMLFunction`.
- `packages/core/metadata/orchestration/property/fromXMLToYAML.ts` — запись import-зависимостей в отдельный сборщик.
- `packages/core/metadata/orchestration/property/finalizeImportedYAML.ts` — уточнение через общие связанные цели.
- `packages/core/metadata/orchestration/property/finalizeImportedYAML.test.ts` — проверка объектной адресации и ошибок направленного адаптера.
- `packages/core/metadata/orchestration/property/fromYAMLToXMLTypes.ts` — накопление временных XML-путей по каждому выходу.
- `packages/core/metadata/orchestration/property/fromYAMLToXML.ts` — регистрация временного XML-пути после фактической записи атомарного значения.
- `packages/core/metadata/orchestration/metadataItem/fromYAMLToXML.ts` — перенос путей через merge и оборачивание XML-корнем, затем привязка к окончательному документу.
- `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts` — перенос временных путей в собранные metadata/body деревья формы после namespaces, UUID и generated ids; окончательная привязка выполняется после внешней обёртки документа.
- `packages/core/metadata/orchestration/property/fn.ts` — тип направленной операции `finalizeExportedXML`.
- `packages/core/metadata/orchestration/property/typeRuleRegistry.ts` — регистрация и типизированное получение новой операции.
- `packages/core/metadata/project/localIndexes.ts` — удаление import-зависимостей из `LocalIndexes`.
- `packages/core/metadata/project/localIndexes.test.ts` — подтверждение, что локальный индекс содержит только факты.
- `packages/core/metadata/importFromXml/prepareYaml.ts` — отдельный сбор временных путей и привязка после окончательной сборки YAML.
- `packages/core/metadata/importFromXml/prepareYaml.test.ts` — `PreparedImportYaml.deferred` с целями итогового YAML.
- `packages/core/metadata/importFromXml/worker.ts` — второй проход по `prepared.deferred`.
- `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts` — отдельный сбор временных путей формы рядом с объединённым сборщиком локальных фактов.
- `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts` — сохранение результата формы и возврат временных путей отдельно от `LocalIndexes`.
- `packages/core/metadata/appliedObjects/configuration/rootIO.ts` — чистая подготовка XML конфигурации отдельно от записи.
- `packages/core/metadata/orchestration/appliedObject/syncToXML.ts` — чистая подготовка owner XML отдельно от записи.
- `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts` — чистая подготовка metadata/body XML формы отдельно от записи.
- `packages/core/metadata/fullSyncToXml/types.ts` — `PreparedXMLDocument`, `PreparedXMLAssignment`, индекс и состав проекта в команде первого прохода.
- `packages/core/metadata/fullSyncToXml/writeAssignment.ts` — только уточнение, сериализация и запись подготовленных документов.
- `packages/core/metadata/fullSyncToXml/writeAssignment.test.ts` — запись из подготовленного XML без YAML.
- `packages/core/metadata/fullSyncToXml/worker.ts` — последовательное чтение одного YAML, подготовка XML в первом проходе, освобождение YAML.
- `packages/core/metadata/fullSyncToXml/worker.test.ts` — состояние содержит XML, а не YAML; ошибки подготовки блокируют второй проход.
- `packages/core/metadata/fullSyncToXml/workerPool.ts` — передача индекса и состава проекта до первого прохода.
- `packages/core/metadata/fullSyncToXml/workerPool.test.ts` — проверка нового протокола команд.
- `packages/core/metadata/fullSyncToXml/sharedMetadata.ts` — отдельное создание состава проекта до появления фактов владельцев.
- `packages/core/metadata/fullSyncToXml/syncConfiguration.ts` — создание и передача состава/индекса перед первым проходом.
- `packages/core/metadata/fullSyncToXml/syncConfiguration.test.ts` — порядок координации и запрет второго прохода при ошибке подготовки.
- `packages/core/metadata/fullSyncToXml/determinism.test.ts` — одинаковые XML и детерминированный индекс при `concurrency: 1` и `2`.
- `.agents/architecture.md` — различие временного пути и связанной цели между проходами.

---

### Task 1: Нейтральный договор связанного отложенного значения

**Files:**
- Create: `packages/core/metadata/orchestration/property/deferredObjectValues.ts`
- Create: `packages/core/metadata/orchestration/property/deferredObjectValues.test.ts`
- Modify: `packages/core/metadata/orchestration/property/importYamlTypes.ts`

**Interfaces:**
- Produces:
  - `DeferredValuePath { valuePath, rulePath }`
  - `DeferredObjectTarget`
  - `DeferredObjectValue`
  - `bindDeferredObjectValues(root, paths): DeferredObjectValue[]`
  - `finalizeDeferredObjectValues({ root, deferred, finalize }): void`

- [ ] **Step 1: Write failing tests for object, array and nested targets**

```ts
import { describe, expect, it } from "vitest"
import {
  bindDeferredObjectValues,
  finalizeDeferredObjectValues,
  type DeferredValuePath,
} from "./deferredObjectValues"

const path = (valuePath: readonly (string | number)[]): DeferredValuePath => ({
  valuePath,
  rulePath: [{ propertyKey: "value" }],
})

describe("deferred object values", () => {
  it.each([
    [{ Объект: { Значение: "old" } }, ["Объект", "Значение"]],
    [{ Массив: [{ Значение: "old" }] }, ["Массив", 0, "Значение"]],
    [{ Запись: { Ключ: { Значение: "old" } } }, ["Запись", "Ключ", "Значение"]],
  ] as const)("binds and replaces %j", (root, valuePath) => {
    const deferred = bindDeferredObjectValues(root, [path(valuePath)])
    const expectedOwner = valuePath.slice(0, -1).reduce<unknown>(
      (value, segment) => (value as Record<string | number, unknown>)[segment],
      root
    )

    expect(deferred[0]?.target.object).toBe(expectedOwner)
    finalizeDeferredObjectValues({
      root,
      deferred,
      finalize: ({ value }) => (value === "old" ? "new" : value),
    })
    expect(
      valuePath.reduce<unknown>(
        (value, segment) => (value as Record<string | number, unknown>)[segment],
        root
      )
    ).toBe("new")
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/deferredObjectValues.test.ts
```

Expected: FAIL because `./deferredObjectValues` does not exist.

- [ ] **Step 3: Implement binding and finalization**

```ts
import type { DeferredRulePathSegment } from "./importYamlTypes"

export interface DeferredValuePath {
  readonly valuePath: readonly (string | number)[]
  readonly rulePath: readonly DeferredRulePathSegment[]
}

export type DeferredObjectTarget =
  | { readonly object: Record<string, unknown>; readonly key: string }
  | { readonly object: unknown[]; readonly key: number }

export interface DeferredObjectValue extends DeferredValuePath {
  readonly target: DeferredObjectTarget
}

export function bindDeferredObjectValues(
  root: unknown,
  paths: readonly DeferredValuePath[]
): DeferredObjectValue[] {
  return paths.map((path) => {
    if (path.valuePath.length === 0) throw deferredError(path, "Нельзя связать корень дерева")
    const key = path.valuePath.at(-1)!
    const object = readContainer(root, path.valuePath.slice(0, -1), path)
    assertOwnKey(object, key, path)
    if (Array.isArray(object) && typeof key !== "number")
      throw deferredError(path, "Для массива требуется числовой индекс")
    if (!Array.isArray(object) && typeof key !== "string")
      throw deferredError(path, "Для объекта требуется строковый ключ")
    return {
      valuePath: [...path.valuePath],
      rulePath: path.rulePath.map((segment) => ({ ...segment })),
      target: { object, key } as DeferredObjectTarget,
    }
  })
}

export function finalizeDeferredObjectValues(params: {
  root: unknown
  deferred: readonly DeferredObjectValue[]
  finalize(value: { deferred: DeferredObjectValue; value: unknown }): unknown
}): void {
  for (const deferred of params.deferred) {
    const currentOwner = readContainer(params.root, deferred.valuePath.slice(0, -1), deferred)
    if (currentOwner !== deferred.target.object)
      throw deferredError(deferred, "Связанная цель больше не принадлежит итоговому дереву")
    assertOwnKey(currentOwner, deferred.target.key, deferred)
    writeTarget(deferred.target, params.finalize({
      deferred,
      value: readTarget(deferred.target),
    }))
  }
}
```

В этом же файле реализовать `readContainer`, `assertOwnKey`, `readTarget`, `writeTarget` и `deferredError`; `readTarget`/`writeTarget` сужают union по `typeof target.key`, а сообщения ошибок обязаны содержать печатные `valuePath` и `rulePath`.

- [ ] **Step 4: Add failure tests for missing and stale targets**

```ts
it("rejects a missing target key", () => {
  expect(() => bindDeferredObjectValues({}, [path(["Нет", "Пути"])]))
    .toThrow(/valuePath=\/Нет\/Пути.*rulePath=\/value/)
})

it("rejects a stale object reference", () => {
  const root = { Узел: { Значение: "old" } }
  const deferred = bindDeferredObjectValues(root, [path(["Узел", "Значение"])])
  root.Узел = { Значение: "replacement" }

  expect(() =>
    finalizeDeferredObjectValues({ root, deferred, finalize: ({ value }) => value })
  ).toThrow("Связанная цель больше не принадлежит итоговому дереву")
})
```

- [ ] **Step 5: Run tests and type-check**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/deferredObjectValues.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: both commands PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/property/deferredObjectValues.ts packages/core/metadata/orchestration/property/deferredObjectValues.test.ts packages/core/metadata/orchestration/property/importYamlTypes.ts
git commit -m "feat: :sparkles: добавить связанные отложенные значения"
```

---

### Task 2: Перевести import YAML на общий договор

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/finalizeImportedYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/finalizeImportedYAML.test.ts`
- Modify: `packages/core/metadata/project/localIndexes.ts`
- Modify: `packages/core/metadata/project/localIndexes.test.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.test.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`

**Interfaces:**
- Consumes: `bindDeferredObjectValues`, `finalizeDeferredObjectValues`, `DeferredObjectValue`.
- Produces:
  - `DeferredValuePathCollector { accept(path), finish() }`
  - `PreparedImportYaml.deferred: readonly DeferredObjectValue[]`
  - `LocalIndexes { metadata }` without `dependencies`.

- [ ] **Step 1: Change import tests to require separate bound values**

В `prepareYaml.test.ts` добавить проверку:

```ts
expect(prepared.deferred).toEqual(expect.any(Array))
for (const deferred of prepared.deferred) {
  expect(deferred.target.object).toBe(
    deferred.valuePath.slice(0, -1).reduce<unknown>(
      (value, segment) => (value as Record<string | number, unknown>)[segment],
      prepared.yaml
    )
  )
}
expect(prepared.localIndexes).not.toHaveProperty("dependencies")
```

В `localIndexes.test.ts` заменить ожидание результата на:

```ts
expect(collector.finish()).toEqual({
  metadata: {
    events: [
      {
        kind: "property",
        yamlPath: ["Элементы", 0, "Путь"],
        rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }, { propertyKey: "path" }],
        propertyType: "TestDeferredImport",
      },
    ],
  },
})
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/localIndexes.test.ts metadata/importFromXml/prepareYaml.test.ts metadata/orchestration/property/finalizeImportedYAML.test.ts
```

Expected: FAIL because `LocalIndexes.dependencies` still exists and `PreparedImportYaml.deferred` does not.

- [ ] **Step 3: Separate deferred path collection from local indexes**

В `importYamlTypes.ts`:

```ts
export interface DeferredValuePathCollector {
  accept(path: DeferredValuePath): void
  finish(): readonly DeferredValuePath[]
}

export interface DirectImportTraversal {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
  collector: LocalIndexesCollector
  deferred: DeferredValuePathCollector
  profile?: DirectImportProfile
}

export function createDeferredValuePathCollector(): DeferredValuePathCollector {
  const paths: DeferredValuePath[] = []
  return {
    accept(path) {
      paths.push({
        valuePath: [...path.valuePath],
        rulePath: path.rulePath.map((segment) => ({ ...segment })),
      })
    },
    finish: () => paths,
  }
}
```

В `localIndexes.ts` удалить `LocalDependencyIndex`, поле `dependencies` и проверку `finalizeImportedYAML` из `acceptProperty`.

В `fromXMLToYAML.ts` после успешного `collector.acceptProperty(...)` добавить:

```ts
if (getTypeRule(propertyRule.type, "finalizeImportedYAML") !== undefined) {
  params.deferred.accept({ valuePath: propertyYamlPath, rulePath: propertyRulePath })
}
```

Передавать `deferred` во все вложенные `DirectImportTraversal`.

В `forms/clientApplicationForm/fromXMLToYAML.ts` создать `deferred = createDeferredValuePathCollector()`, передать его в `importPropertiesFromXMLToYAML` и вернуть `deferred: deferred.finish()` в `DirectImportResult`. Поле `DirectImportResult.deferred` имеет тип `readonly DeferredValuePath[]`; форма по-прежнему объединяет `LocalIndexesCollector` и `FormDataPathIndexCollector` только для фактов.

- [ ] **Step 4: Bind final YAML and use common finalization**

В `prepareYaml.ts` создать оба сборщика до преобразования:

```ts
const collector = createLocalIndexesCollector()
const deferred = createDeferredValuePathCollector()
const yaml = importMetadataItemFromXMLToYAML({
  context: importContext,
  rule,
  name: params.assignment.itemName,
  xml: metadataXML["MetaDataObject"],
  traversal: { yamlPath: [], rulePath: [], collector, deferred, profile: importProfile },
  propertyXML: mapPropertyXml(rule, xmlInputs ?? []),
})
if (yaml === undefined) throw new Error("XML-import не сформировал YAML")
return {
  yaml,
  localIndexes: collector.finish(),
  deferred: bindDeferredObjectValues(yaml, deferred.finish()),
  generatedFiles,
}
```

Добавить `deferred: readonly DeferredObjectValue[]` в `PreparedImportYaml`.

В `finalizeImportedYAML.ts` сохранить сигнатуру `finalizeImportedYamlValues`, но заменить чтение/запись по пути:

```ts
finalizeDeferredObjectValues({
  root: params.yaml,
  deferred: params.deferred,
  finalize: ({ deferred, value }) => {
    const rule = resolveDeferredPropertyRule(params.rootRule, deferred.rulePath)
    const finalize = getTypeRule(rule.type, "finalizeImportedYAML")
    if (finalize === undefined)
      throw new Error(`Для типа ${rule.type} не зарегистрирован finalizeImportedYAML`)
    return finalize({
      context: params.context,
      rule,
      value,
      ...(params.formDataPathIndex === undefined ? {} : { formDataPathIndex: params.formDataPathIndex }),
    })
  },
})
```

В `worker.ts` заменить `prepared.localIndexes.dependencies` на `prepared.deferred`.

- [ ] **Step 5: Run import and local-index tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/localIndexes.test.ts metadata/orchestration/property/finalizeImportedYAML.test.ts metadata/importFromXml/prepareYaml.test.ts metadata/importFromXml/worker.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
```

Expected: PASS; существующие YAML-ожидания не меняются.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/property/importYamlTypes.ts packages/core/metadata/orchestration/property/fromXMLToYAML.ts packages/core/metadata/orchestration/property/finalizeImportedYAML.ts packages/core/metadata/orchestration/property/finalizeImportedYAML.test.ts packages/core/metadata/project/localIndexes.ts packages/core/metadata/project/localIndexes.test.ts packages/core/metadata/importFromXml/prepareYaml.ts packages/core/metadata/importFromXml/prepareYaml.test.ts packages/core/metadata/importFromXml/worker.ts packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
git commit -m "refactor: :recycle: связать отложенные значения импорта"
```

---

### Task 3: Добавить направленное уточнение готового XML

**Files:**
- Create: `packages/core/metadata/orchestration/property/finalizeExportedXML.ts`
- Create: `packages/core/metadata/orchestration/property/finalizeExportedXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: common binding/finalization from Task 1 and `resolveDeferredPropertyRule` from import adapter.
- Produces:
  - registry operation `finalizeExportedXML`
  - `FinalizeExportedXMLFunction`
  - `YAMLToXMLResult.deferredByOutput`
  - `finalizeExportedXmlValues(...)`.

- [ ] **Step 1: Add failing registry and conversion tests**

В `fromYAMLToXML.test.ts` зарегистрировать тестовый атомарный тип:

```ts
registerTypeRule(deferredType, "exportToXML", ({ value }) => value)
registerTypeRule(deferredType, "finalizeExportedXML", ({ value }) => `${value}:final`)
```

Проверить временный путь:

```ts
const converted = convertPropertiesFromYAMLToXML({
  context: mockContextToXML(),
  yaml: { Значение: "draft" },
  rule: {
    itemType: "TestDeferredRoot",
    properties: { value: { type: deferredType, yaml: "Значение", xml: "Value" } },
  },
  outputs: [{ key: "owner" }],
})

expect(converted.deferredByOutput.get("owner")).toEqual([
  { valuePath: ["Value"], rulePath: [{ propertyKey: "value" }] },
])
```

В `metadataItem/fromYAMLToXML.test.ts` проверить, что после merge и XML-root путь уже связан с итоговым объектом:

```ts
const deferred = converted.deferredByOutput.get("owner")![0]!
expect(deferred.valuePath).toEqual(["MetaDataObject", "TestRoot", "Properties", "Value"])
expect(deferred.target.object[deferred.target.key]).toBe("draft")
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromYAMLToXML.test.ts metadata/orchestration/metadataItem/fromYAMLToXML.test.ts
```

Expected: FAIL because the operation and deferred output do not exist.

- [ ] **Step 3: Extend the neutral registry**

В `fn.ts`:

```ts
export type FinalizeExportedXMLFunction = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
}) => unknown
```

Добавить `finalizeExportedXML` в `TypeRule`, `TypeRulesOperations` и `importExportFunction`.
В `typeRuleRegistry.ts` добавить тип функции в union и ветку:

```ts
: O extends "finalizeExportedXML"
  ? FinalizeExportedXMLFunction | undefined
```

- [ ] **Step 4: Collect temporary XML paths during the only rules pass**

В `fromYAMLToXMLTypes.ts`:

```ts
export interface YAMLToXMLResult {
  readonly outputs: ReadonlyMap<string, Record<string, unknown>>
  readonly deferredByOutput: ReadonlyMap<string, readonly DeferredValuePath[]>
  readonly externalWrites: readonly YAMLToXMLExternalWrite[]
}
```

Расширить `MutableOutput` в `fromYAMLToXML.ts` полем `deferred: DeferredValuePath[]`. Изменить `writeXMLValue` так, чтобы он возвращал записанный путь:

```ts
function writeXMLValue(...): readonly (string | number)[] | undefined {
  const valuePath = [...(rule.xmlParents ?? []), xmlKey]
  setAtPath(output.xml, valuePath, value)
  return valuePath
}
```

До вычисления `valuePath` сохранить текущие ветви пустого массива, выбора canonical/alias и записи `ConfigurationIndexCollector` без изменения поведения; каждая ветвь, которая ничего не записала, возвращает `undefined`.

В атомарной ветке после `writeXMLValue`:

```ts
const valuePath = writeXMLValue({ context: outputContext, output, planned, value: exported, reference })
if (valuePath !== undefined && getTypeRule(planned.propertyRule.type, "finalizeExportedXML") !== undefined) {
  output.deferred.push({
    valuePath,
    rulePath: buildDeferredRulePath(params.rulePath, propertyKey),
  })
}
```

Вернуть `deferredByOutput` рядом с `outputs`. Для вложенных результатов добавлять внешний XML-путь к каждому вложенному `valuePath`; не запускать второй обход правил.

- [ ] **Step 5: Rebase paths after merge/root wrapping and bind final documents**

В `metadataItem/fromYAMLToXML.ts` при merge переносить путь из сгенерированного тела в итоговый `merged`; если generated-ветка была заменена, считать это ошибкой контракта. После `wrapXMLRoot` вычислить префикс:

```ts
const prefix =
  root === undefined
    ? []
    : root.isFileRoot
      ? [root.container]
      : ["MetaDataObject", root.container]
```

Собрать итог:

```ts
const finalRoot = wrapXMLRoot({ params, request, root, value: merged })
outputs.set(request.key, finalRoot)
deferredByOutput.set(
  request.key,
  bindDeferredObjectValues(
    finalRoot,
    (converted.deferredByOutput.get(request.key) ?? []).map((entry) => ({
      ...entry,
      valuePath: [...prefix, ...entry.valuePath],
    }))
  )
)
```

Возвращать `{ outputs, deferredByOutput, externalWrites }`.

В `forms/clientApplicationForm/fromYAMLToXML.ts` выполнить завершающий перенос путей отдельно для двух выходов. Сначала собрать `formXML` с namespaces и generated ids и `metadataXML` с namespaces/UUID, затем вернуть временные пути рядом с собранными внутренними деревьями:

```ts
const deferredByDocument = new Map([
  [
    "form",
    (converted.deferredByOutput.get("form") ?? []).map((entry) => ({
      ...entry,
      valuePath: [...entry.valuePath],
    })),
  ],
  [
    "metadata",
    (converted.deferredByOutput.get("metadata") ?? []).map((entry) => ({
      ...entry,
      valuePath: [...entry.valuePath],
    })),
  ],
])
```

Добавить `deferredByDocument: ReadonlyMap<"metadata" | "form", readonly DeferredValuePath[]>` в `DirectClientApplicationFormXMLResult`. Окончательную привязку выполняет подготовщик задания после обёртки `{ MetaDataObject: metadataXML }` / `{ Form: formXML }`; до этого прямых ссылок на промежуточное дерево нет.

- [ ] **Step 6: Implement the XML directional adapter**

```ts
export function finalizeExportedXmlValues(params: {
  xml: unknown
  rootRule: MetadataItemRule
  deferred: readonly DeferredObjectValue[]
  context: ConfigurationContext
}): void {
  finalizeDeferredObjectValues({
    root: params.xml,
    deferred: params.deferred,
    finalize: ({ deferred, value }) => {
      const rule = resolveDeferredPropertyRule(params.rootRule, deferred.rulePath)
      const finalize = getTypeRule(rule.type, "finalizeExportedXML")
      if (finalize === undefined)
        throw new Error(`Для типа ${rule.type} не зарегистрирован finalizeExportedXML`)
      return finalize({ context: params.context, rule, value })
    },
  })
}
```

Тест должен проверять замену значения, неверный `rulePath`, устаревшую ссылку и отсутствие зарегистрированной операции.

- [ ] **Step 7: Run conversion, adapter and type tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromYAMLToXML.test.ts metadata/orchestration/metadataItem/fromYAMLToXML.test.ts metadata/orchestration/property/finalizeExportedXML.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/orchestration/property/finalizeExportedXML.ts packages/core/metadata/orchestration/property/finalizeExportedXML.test.ts packages/core/metadata/orchestration/property/fn.ts packages/core/metadata/orchestration/property/typeRuleRegistry.ts packages/core/metadata/orchestration/property/fromYAMLToXMLTypes.ts packages/core/metadata/orchestration/property/fromYAMLToXML.ts packages/core/metadata/orchestration/metadataItem/fromYAMLToXML.ts packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts packages/core/metadata/orchestration/metadataItem/fromYAMLToXML.test.ts packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
git commit -m "feat: :sparkles: связать отложенные значения XML"
```

---

### Task 4: Отделить подготовку XML-задания от файловой записи

**Files:**
- Create: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`
- Create: `packages/core/metadata/fullSyncToXml/prepareAssignment.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rootIO.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.test.ts`

**Interfaces:**
- Consumes: bound `DeferredObjectValue[]`, `ConfigurationIndexCollector`, current role-specific converters.
- Produces:

```ts
export interface PreparedXMLDocument {
  readonly targetXmlPath: string
  readonly xml: Record<string, unknown>
  readonly deferred: readonly DeferredObjectValue[]
  readonly rootRule: MetadataItemRule
}

export interface PreparedXMLAssignment {
  readonly assignment: FullXmlSyncAssignment
  readonly documents: readonly PreparedXMLDocument[]
  readonly indexCollector: ConfigurationIndexCollector
  readonly profile: YAMLToXMLProfile
}
```

- [ ] **Step 1: Write failing preparation tests**

В `prepareAssignment.test.ts` подготовить существующие малые owner и form YAML так же, как текущий `writeAssignment.test.ts`, затем:

```ts
const writeFile = vi.spyOn(fs.promises, "writeFile")
const prepared = prepareFullXmlSyncAssignment({
  assignment,
  preparedYamlFile,
  context: mockContextToXML(),
  index,
  assignments: [compositionEntry],
})

expect(prepared.documents.map((document) => document.targetXmlPath)).toEqual([
  "DataProcessors/ОбработкаВсеСвойства.xml",
])
expect(prepared.documents[0]?.xml).toHaveProperty("MetaDataObject")
expect(prepared.profile.rulesPassCount).toBe(1)
expect(writeFile).not.toHaveBeenCalled()
```

Отдельный form-тест ожидает два документа: metadata XML и `Ext/Form.xml`.

Для каждого из трёх ролей сначала вызвать сохранённую write-оболочку в `legacyOut`, затем новый `prepareFullXmlSyncAssignment` + `writeFullXmlSyncAssignment` в `preparedOut` и сравнить `Buffer` каждого XML-файла. Это характеристическая проверка побайтовой совместимости на границе рефакторинга:

```ts
expect(readXmlTree(preparedOut)).toEqual(readXmlTree(legacyOut))
```

- [ ] **Step 2: Run preparation test and verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/prepareAssignment.test.ts
```

Expected: FAIL because `prepareAssignment.ts` does not exist.

- [ ] **Step 3: Extract pure role-specific preparation**

В каждом существующем модуле выделить чистую функцию, а старую write-функцию оставить тонкой оболочкой для других вызовов:

```ts
export function prepareConfigurationXML(params: {
  context: ConfigurationContextWithExportToXML
  preparedYamlFile: PreparedYamlFile
  childObjects?: ConfigurationChildObjectsXML
  referenceXML?: Record<string, unknown>
  externalWriteFactory?: YAMLToXMLExternalWriteFactory
  profile?: YAMLToXMLProfile
}): {
  xml: Record<string, unknown>
  deferred: readonly DeferredObjectValue[]
  rootRule: MetadataItemRule
} {
  const yaml = requirePreparedConfigurationYaml(params.preparedYamlFile)
  const converted = convertMetadataItemFromYAMLToXML({
    context: params.context,
    yaml,
    rule: MetadataConfigurationRules,
    name: typeof yaml.Имя === "string" ? yaml.Имя : undefined,
    outputs: [{ key: "configuration", referenceXML: params.referenceXML }],
    externalWriteFactory: params.externalWriteFactory,
    profile: params.profile,
    rulePath: [MetadataConfigurationRules.itemType],
  })
  const xml = converted.outputs.get("configuration")
  if (xml === undefined) throw new Error("Преобразование конфигурации не сформировало XML")
  if (params.childObjects !== undefined) setConfigurationChildObjectsXML(xml, params.childObjects)
  return {
    xml,
    deferred: converted.deferredByOutput.get("configuration") ?? [],
    rootRule: MetadataConfigurationRules,
  }
}
```

```ts
export function prepareAppliedObjectOwnerXML(params: {
  rule: MetadataItemRule
  context: ConfigurationContextWithExportToXML
  name: string
  preparedYamlFile: PreparedYamlFile
  referenceXML?: Record<string, unknown>
  fileChildNames?: { forms?: readonly string[]; templates?: readonly string[] }
  profile?: YAMLToXMLProfile
}): {
  xml: Record<string, unknown>
  deferred: readonly DeferredObjectValue[]
  rootRule: MetadataItemRule
} {
  const yaml = requirePreparedAppliedObjectYaml(params.preparedYamlFile)
  const context = createPreparedAppliedObjectContext(params)
  const converted = convertMetadataItemFromYAMLToXML({
    context,
    rule: withFileItemCollectionReferenceExportRules(params.rule),
    yaml,
    name: params.name,
    outputs: [{ key: "owner", referenceXML: params.referenceXML }],
    profile: params.profile,
    rulePath: [params.rule.itemType],
  })
  const xml = converted.outputs.get("owner")
  if (xml === undefined) throw new Error("Преобразование объекта не сформировало owner XML")
  return {
    xml,
    deferred: converted.deferredByOutput.get("owner") ?? [],
    rootRule: params.rule,
  }
}
```

```ts
export function prepareFormXML(params: {
  context: ConfigurationContextWithExportToXML
  preparedYamlFile: PreparedYamlFile
  formName: string
  currentXMLPath?: string
  referenceFormXML?: ClientApplicationFormXML
  referenceMetadataXML?: FormMetadataXML
  profile?: YAMLToXMLProfile
}): readonly {
  targetKind: "metadata" | "body"
  xml: Record<string, unknown>
  deferred: readonly DeferredObjectValue[]
  rootRule: MetadataItemRule
}[] {
  const yaml = requirePreparedFormYaml(params.preparedYamlFile)
  const context = createPreparedFormContext(params)
  const converted = convertClientApplicationFormFromYAMLToXML({
    context,
    yaml,
    name: params.formName,
    referenceFormXML: params.referenceFormXML,
    referenceMetadataXML: params.referenceMetadataXML,
    profile: params.profile,
  })
  const metadataDocument = { MetaDataObject: converted.metadataXML }
  const formDocument = { Form: converted.formXML }
  return [
    {
      targetKind: "metadata",
      xml: metadataDocument,
      deferred: bindDeferredObjectValues(
        metadataDocument,
        (converted.deferredByDocument.get("metadata") ?? []).map((entry) => ({
          ...entry,
          valuePath: ["MetaDataObject", ...entry.valuePath],
        }))
      ),
      rootRule: ClientApplicationFormRules,
    },
    {
      targetKind: "body",
      xml: formDocument,
      deferred: bindDeferredObjectValues(
        formDocument,
        (converted.deferredByDocument.get("form") ?? []).map((entry) => ({
          ...entry,
          valuePath: ["Form", ...entry.valuePath],
        }))
      ),
      rootRule: ClientApplicationFormRules,
    },
  ]
}
```

`requirePreparedConfigurationYaml`, `requirePreparedAppliedObjectYaml` и `requirePreparedFormYaml` выполняют текущие проверки отсутствующих `preparedYamlFile.data`. `createPreparedAppliedObjectContext` содержит без изменения существующую последовательность `projectDir` → YAML diagnostics → form dir → file-child context; `createPreparedFormContext` содержит существующие `createFormScopedContext` и `createFormExternalMetadataContext`. В write-оболочках оставить только вызов чистой функции, `mkdir`, `xmlExport` и `writeFile`. Ссылки связывать только после добавления namespaces, UUID, generated form ids, `ChildObjects` и внешнего XML-корня.

- [ ] **Step 4: Implement assignment preparation**

`prepareFullXmlSyncAssignment` создаёт `ConfigurationIndexCollector`, runtime и профиль до выбора роли:

```ts
export function prepareFullXmlSyncAssignment(
  params: PrepareFullXmlSyncAssignmentParams
): PreparedXMLAssignment {
  const indexCollector = createConfigurationIndexCollector()
  const runtime = createConfigurationIndexExportRuntime({
    source: params.index,
    collector: indexCollector,
    targetProjectPath: params.assignment.sourceProjectPath,
    logicalAddress: params.assignment.logicalAddress,
  })
  const context = withIndexRuntime(params.context, runtime)
  const profile = createYAMLToXMLProfile()
  const documents = prepareAssignmentDocuments({ ...params, context, profile })
  return { assignment: params.assignment, documents, indexCollector, profile }
}
```

`prepareAssignmentDocuments` сохраняет существующее разветвление `configuration` / `form` / `properties`, но возвращает документы и ничего не пишет.

- [ ] **Step 5: Reduce writeAssignment to finalization and serialization**

Новая сигнатура:

```ts
export async function writeFullXmlSyncAssignment(params: {
  readonly prepared: PreparedXMLAssignment
  readonly context: ConfigurationContext
  readonly outputDir: string
}): Promise<WriteFullXmlSyncAssignmentResult>
```

Для каждого документа:

```ts
finalizeExportedXmlValues({
  xml: document.xml,
  rootRule: document.rootRule,
  deferred: document.deferred,
  context: params.context,
})
const target = join(params.outputDir, ...document.targetXmlPath.split("/"))
await fs.promises.mkdir(dirname(target), { recursive: true })
await fs.promises.writeFile(target, xmlExport(document.xml), "utf-8")
```

Фрагмент формировать после уточнения всех документов:

```ts
fragment: prepared.indexCollector.fragment(prepared.assignment.sourceProjectPath)
```

При ошибке не писать текущий документ; уже записанные предыдущие задания остаются по текущей семантике операции.

- [ ] **Step 6: Run preparation and writing tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/prepareAssignment.test.ts metadata/fullSyncToXml/writeAssignment.test.ts metadata/fullSyncToXml/writeRootAssignment.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

Expected: PASS; XML-строки в существующих ожиданиях не меняются.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/fullSyncToXml/prepareAssignment.ts packages/core/metadata/fullSyncToXml/prepareAssignment.test.ts packages/core/metadata/appliedObjects/configuration/rootIO.ts packages/core/metadata/orchestration/appliedObject/syncToXML.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.ts packages/core/metadata/fullSyncToXml/types.ts packages/core/metadata/fullSyncToXml/writeAssignment.ts packages/core/metadata/fullSyncToXml/writeAssignment.test.ts
git commit -m "refactor: :recycle: отделить подготовку XML от записи"
```

---

### Task 5: Перенести подготовку XML в первый проход worker

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/sharedMetadata.ts`
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.test.ts`

**Interfaces:**
- Consumes: `prepareFullXmlSyncAssignment`, `PreparedXMLAssignment`.
- Produces:
  - `initialize` command containing previous index and composition snapshot;
  - worker state `Map<string, PreparedXMLAssignment>`;
  - first pass that reads and releases one YAML at a time.

- [ ] **Step 1: Change worker tests to assert prepared XML, not YAML**

Переименовать основной тест и расширить test-only snapshot:

```ts
expect(fullXmlSyncWorkerStateForTests()).toMatchObject({
  preparedIds: [sourceProjectPath],
  prepared: [
    {
      id: sourceProjectPath,
      documents: ["Catalogs/Товары.xml"],
      holdsPreparedYamlFile: false,
    },
  ],
})
```

Добавить счётчик чтений через внедряемую зависимость или `vi.spyOn(fs, "readFileSync")` и ожидать один вызов для YAML. После первого прохода удалить исходный YAML и убедиться, что второй проход всё равно записывает XML.

- [ ] **Step 2: Run worker and pool tests and verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/workerPool.test.ts metadata/fullSyncToXml/syncConfiguration.test.ts
```

Expected: FAIL because worker state still stores `PreparedYamlFile`, and index/composition are sent only later.

- [ ] **Step 3: Make composition available before first pass**

Экспортировать из `sharedMetadata.ts`:

```ts
export function createFullXmlSyncCompositionSnapshot(
  assignments: readonly FullXmlSyncAssignment[]
): FullXmlSyncSharedCompositionSnapshot

export function createFullXmlSyncCompositionReader(
  snapshot: FullXmlSyncSharedCompositionSnapshot
): FullXmlSyncCompositionReader
```

Расширить `initialize`:

```ts
{
  readonly kind: "initialize"
  readonly workerIndex: number
  readonly projectDir: string
  readonly outputDir: string
  readonly context: ConfigurationContext
  readonly composition: FullXmlSyncSharedCompositionSnapshot
  readonly index: SharedConfigurationIndexSnapshot
}
```

`FullXmlSyncWorkerPool.initialize` принимает те же два новых поля и передаёт их каждому активному worker до `firstPass`.

- [ ] **Step 4: Process one YAML assignment at a time**

Заменить пакетный `prepareYamlFiles` в `worker.ts` циклом:

```ts
for (const assignment of assignments) {
  let yamlFile: PreparedYamlFile | undefined
  try {
    const prepared = prepareYamlFiles({
      files: [assignmentDescriptor(assignment)],
      itemTypeByYamlDir: itemTypeByYamlDir(assignments),
      includeProjectFiles: true,
      hashFileBytes,
    })
    diagnostics.push(...prepared.diagnostics.map(...))
    yamlFile = prepared.yamlFiles[0]
    if (yamlFile === undefined || hasSyntaxErrors(...)) continue

    const facts = extractAssignmentFacts(yamlFile, assignment, rulesSnapshot, state.projectDir)
    ownerFacts.push(...facts)
    preparedAssignments.set(
      assignment.id,
      prepareFullXmlSyncAssignment({
        assignment,
        preparedYamlFile: yamlFile,
        context: exportContextForFirstPass(state),
        index: state.index,
        assignments: state.composition.assignments(),
      })
    )
    projectFiles.push(...prepared.projectFiles)
  } catch (caught) {
    preparedAssignments.delete(assignment.id)
    diagnostics.push(assignmentDiagnostic(assignment, "full_xml_sync_first_pass_failed", errorMessage(caught)))
  } finally {
    yamlFile = undefined
  }
}
```

Не сохранять `yamlFile`, его `data` или замыкания на YAML внутри `PreparedXMLAssignment`.

- [ ] **Step 5: Make second pass write only prepared XML**

Удалить создание `ConfigurationIndexReader` из второго прохода и вызов старого преобразования. Вызов:

```ts
const result = await writeFullXmlSyncAssignment({
  prepared,
  context: secondPassContext(state, sharedMetadata),
  outputDir: state.outputDir,
})
```

После каждого задания сохранять текущее `preparedAssignments.delete(id)` в `finally`.

- [ ] **Step 6: Move coordinator inputs before the first pass**

В `syncConfiguration.ts` после чтения индекса и построения плана:

```ts
const composition = createFullXmlSyncCompositionSnapshot(plan.assignments)
await pool.initialize({
  projectDir: yamlDir,
  outputDir: xmlDir,
  context: params.context,
  composition,
  index: indexSnapshot,
})
```

После первого прохода по-прежнему создать общий owner snapshot и передать его во второй проход. При любой ошибке первого прохода второй проход не вызывать.

- [ ] **Step 7: Run worker protocol tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/workerPool.test.ts metadata/fullSyncToXml/syncConfiguration.test.ts metadata/fullSyncToXml/failureIntegration.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS; тест с удалением исходного YAML между проходами записывает XML, `prepared.holdsPreparedYamlFile` равен `false`.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/fullSyncToXml/sharedMetadata.ts packages/core/metadata/fullSyncToXml/types.ts packages/core/metadata/fullSyncToXml/worker.ts packages/core/metadata/fullSyncToXml/worker.test.ts packages/core/metadata/fullSyncToXml/workerPool.ts packages/core/metadata/fullSyncToXml/workerPool.test.ts packages/core/metadata/fullSyncToXml/syncConfiguration.ts packages/core/metadata/fullSyncToXml/syncConfiguration.test.ts
git commit -m "perf: :zap: подготовить XML в первом проходе"
```

---

### Task 6: Проверить совместимость и детерминизм на малом проекте

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/integration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/determinism.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/failureIntegration.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`

**Interfaces:**
- Consumes: complete import and full-sync flows.
- Produces: regression coverage for output, concurrency, failure boundary and unchanged import.

- [ ] **Step 1: Preserve a baseline XML tree in the integration test**

В одном малом тесте сначала получить результат текущего прямого преобразователя или сохранить XML первого запуска в памяти, затем повторить sync с другим `concurrency`:

```ts
const oneWorker = await runSync({ concurrency: 1, outputDir: outOne })
const twoWorkers = await runSync({ concurrency: 2, outputDir: outTwo })

expect(oneWorker.failed).toEqual([])
expect(twoWorkers.failed).toEqual([])
expect(readTree(outTwo)).toEqual(readTree(outOne))
```

Не добавлять большую проектную фикстуру и не изменять существующие XML-фикстуры.

- [ ] **Step 2: Assert deterministic index semantically**

Декодировать оба индекса и сравнить нормализованные массивы:

```ts
expect(normalizeIndex(await readConfigurationIndex({ projectDir: projectTwo })))
  .toEqual(normalizeIndex(await readConfigurationIndex({ projectDir: projectOne })))
```

`normalizeIndex` сортирует `projectFiles`, `identities`, `xmlNodes`, `xmlValues` по тем же UTF-8 ключам, что `buildFullXmlSyncConfigurationIndex`; тест не требует одинакового бинарного представления.

- [ ] **Step 3: Assert first-pass binding failure prevents writes**

В `failureIntegration.test.ts` подменить подготовку так, чтобы временный путь не существовал, и проверить:

```ts
expect(result.failed).toEqual([
  expect.objectContaining({ code: "full_xml_sync_first_pass_failed" }),
])
expect(fs.readdirSync(outDir)).toEqual([])
expect(writeIndex).not.toHaveBeenCalled()
```

Сохранить отдельную проверку второго прохода: ошибка finalizer не пишет текущий документ и не обновляет `.nkdk`, но ранее записанные задания не удаляются.

- [ ] **Step 4: Assert import text remains unchanged**

В `importConfiguration.test.ts` сравнить записанный YAML с существующим ожидаемым текстом/фикстурой и проверить, что общий механизм не меняет порядок ключей.

- [ ] **Step 5: Run the bounded regression suite**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/integration.test.ts metadata/fullSyncToXml/determinism.test.ts metadata/fullSyncToXml/failureIntegration.test.ts metadata/importFromXml/importConfiguration.test.ts
```

Expected: PASS. Этот набор использует только малый проект и не должен заметно увеличивать обычный тестовый контур.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/fullSyncToXml/integration.test.ts packages/core/metadata/fullSyncToXml/determinism.test.ts packages/core/metadata/fullSyncToXml/failureIntegration.test.ts packages/core/metadata/importFromXml/importConfiguration.test.ts
git commit -m "test: :white_check_mark: проверить подготовленный XML"
```

---

### Task 7: Синхронизировать архитектурный документ и выполнить полную проверку

**Files:**
- Modify: `.agents/architecture.md`

**Interfaces:**
- Consumes: final implemented contracts.
- Produces: architecture terminology matching runtime behavior.

- [ ] **Step 1: Clarify temporary paths and bound targets**

В таблицах import/full sync разделить два состояния: действие сбора во время обхода описывает сохранение `valuePath` и `rulePath` до окончательной сборки дерева; следующее действие связывания описывает замену этих координат прямыми ссылками на контейнер и ключ итогового дерева. Во входах и выходах строк использовать существующие именованные артефакты таблицы, переименовав межпроходный артефакт в «Связанные отложенные значения».

В разделе артефактов определить:

```md
| Связанные отложенные значения | Прямые ссылки `{ object, key }` на поля окончательного XML/YAML-дерева вместе с `valuePath` и `rulePath`; исходное разобранное представление не удерживают. |
```

Уточнить, что между проходами full sync находятся связанные значения, а сохранённый путь используется для диагностики и проверки актуальности ссылки.

- [ ] **Step 2: Run architecture and placeholder scans**

Run:

```bash
rg -n "Частичные отложенные пути|Связанные отложенные значения|PreparedYamlFile" .agents/architecture.md packages/core/metadata/fullSyncToXml
rg -n -e "T[B]D" -e "T[O]DO" -e "implement lat[e]r" -e "add appropriat[e]" -e "similar t[o]" docs/superpowers/plans/2026-07-23-shared-deferred-object-values.md
```

Expected:
- architecture uses the new distinction consistently;
- production full-sync state has no `PreparedYamlFile`;
- placeholder scan returns no matches.

- [ ] **Step 3: Run the complete project test suite**

Run:

```bash
pnpm test
```

Expected: all package test suites PASS.

- [ ] **Step 4: Run the complete type check/build checks used by the repository**

Run:

```bash
pnpm --filter @nkdk/core type-check
pnpm --filter @nkdk/core build
```

Expected: both commands PASS.

- [ ] **Step 5: Manually observe memory on a large project without making it a gate**

Запустить существующий project-level full sync/profile на доступном большом проекте с `NKDK_FULL_SYNC_PROFILE=1`. Зафиксировать в итоговом отчёте:

- число заданий;
- `concurrency`;
- максимальные наблюдавшиеся `rss` и `heap`;
- подтверждение, что worker state между проходами содержит XML, а не YAML.

Снижение памяти относительно прежнего запуска не считать условием завершения.

- [ ] **Step 6: Commit**

```bash
git add .agents/architecture.md
git commit -m "docs: :memo: уточнить договор отложенных значений"
```

---

## Final Verification Checklist

- [ ] `DeferredObjectValue.target` ссылается на контейнер окончательного дерева.
- [ ] Замена дерева после binding выявляется как ошибка stale reference.
- [ ] `LocalIndexes` не владеет отложенными import-значениями.
- [ ] `PreparedImportYaml` хранит связанные YAML-цели.
- [ ] `PreparedXMLAssignment` не содержит `PreparedYamlFile` или корневой YAML.
- [ ] Прежний индекс и состав проекта доступны worker до первого YAML.
- [ ] XML строится в первом проходе, уточняется и пишется во втором.
- [ ] Один YAML читается и преобразуется один раз.
- [ ] Ошибка первого прохода не начинает запись XML.
- [ ] Ошибка второго прохода не обновляет `.nkdk`.
- [ ] XML побайтово одинаков при `concurrency: 1` и `2`.
- [ ] Индекс семантически одинаков и детерминирован при `concurrency: 1` и `2`.
- [ ] Импортированный YAML не меняется.
- [ ] `pnpm test`, core type-check и build проходят.
