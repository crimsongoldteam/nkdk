# План реализации служебных метаданных YAML

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранить скрытые служебные метаданные YAML при смысловом клонировании контейнеров и устранить ошибки локализации `!xml/raw` после материализации неявного `ПутьКДанным`.

**Architecture:** Нейтральный YAML-слой `@nkdk/runtime` получает единый поверхностный копировщик `copyYAMLRuntimeMetadata` и фабрику `cloneYAMLContainer`. Они переносят собственные `Symbol`-свойства с дескрипторами и сведения из трёх существующих `WeakMap`, а древовидные `XmlAnomalyAnnotations` по-прежнему копируются отдельно.

**Tech Stack:** TypeScript 7, Vitest 4, pnpm workspace, js-yaml, существующий runtime XML/YAML-аномалий.

**Spec:** `docs/superpowers/specs/2026-08-26-yaml-runtime-metadata-design.md`

## Global Constraints

- Не добавлять публичные YAML-поля и новые YAML-теги.
- Не изменять семантику `!xml/raw`, `!xml/invalid` и `!xml/important`.
- Не выполнять глубокий обход YAML в `copyYAMLRuntimeMetadata` и `cloneYAMLContainer`.
- Переносить все собственные `Symbol`-свойства с исходными дескрипторами, но не переносить неперечислимые строковые свойства.
- Сохранять scalar tags, порядок ключей и отметки двойных кавычек из существующих `WeakMap`.
- Одинаковое значение существующей символьной метки разрешать; несовместимое значение завершать явной ошибкой.
- `XmlAnomalyAnnotations` продолжать переносить отдельно через `copyXmlAnomalyAnnotationsDeep`.
- Не изменять XML-фикстуры; проверки каталога `doc` выполнять только после локальных и e2e-тестов.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base 9cdcb73b9`.

---

### Task 1: Общий договор служебных метаданных YAML

**Files:**
- Create: `packages/runtime/yaml/runtimeMetadata.ts`
- Create: `packages/runtime/yaml/runtimeMetadata.test.ts`
- Modify: `packages/runtime/yaml/explicitString.ts`
- Modify: `packages/runtime/index.ts`

**Interfaces:**
- Consumes: `copyYAMLScalarTags(source, target)`, `copyYAMLMappingKeyOrder(source, target)`, `markDoubleQuotedScalar(parent, key)`.
- Produces: `copyYAMLRuntimeMetadata(source: object, target: object): void`, `cloneYAMLContainer<T extends object>(source: T): T`, внутренняя `copyDoubleQuotedScalarMarks(source: object, target: object): void`.

- [ ] **Step 1: Написать падающие unit-тесты общего договора**

Создать `packages/runtime/yaml/runtimeMetadata.test.ts` со следующими случаями:

```ts
import { describe, expect, it } from "vitest"
import { asExplicitYAMLStringIfMarked, explicitYAMLString, markDoubleQuotedScalar } from "./explicitString"
import { markYAMLMappingKeyOrder, yamlMappingKeys } from "./mappingTags"
import { cloneYAMLContainer, copyYAMLRuntimeMetadata } from "./runtimeMetadata"
import { markYAMLScalarTag, yamlScalarTagAt } from "./scalarTags"

describe("YAML runtime metadata", () => {
  it("клонирует объект со всеми служебными метаданными", () => {
    const marker = Symbol("marker")
    const source = { Первое: "001", Второе: true }
    Object.defineProperty(source, marker, {
      configurable: true,
      enumerable: false,
      writable: false,
      value: "claim-1",
    })
    Object.defineProperty(source, "скрытое", { enumerable: false, value: "не переносить" })
    markYAMLScalarTag(source, "Второе", "проверять")
    markYAMLMappingKeyOrder(source, ["Второе", "Первое"])
    markDoubleQuotedScalar(source, "Первое")

    const clone = cloneYAMLContainer(source)

    expect(clone).not.toBe(source)
    expect(clone).toEqual(source)
    expect(Object.getOwnPropertyDescriptor(clone, marker)).toEqual(
      Object.getOwnPropertyDescriptor(source, marker),
    )
    expect(Object.hasOwn(clone, "скрытое")).toBe(false)
    expect(yamlScalarTagAt(clone, "Второе")).toBe("проверять")
    expect(yamlMappingKeys(clone)).toEqual(["Второе", "Первое"])
    expect(asExplicitYAMLStringIfMarked(clone, "Первое", clone.Первое)).toEqual(
      explicitYAMLString("001"),
    )
  })

  it("клонирует массив и его метаданные", () => {
    const marker = Symbol("array-marker")
    const source = ["001", 2]
    Object.defineProperty(source, marker, { configurable: true, value: "claim-2" })
    markYAMLScalarTag(source, 1, "изменять")
    markDoubleQuotedScalar(source, 0)

    const clone = cloneYAMLContainer(source)

    expect(clone).toEqual(source)
    expect(Object.getOwnPropertyDescriptor(clone, marker)).toEqual(
      Object.getOwnPropertyDescriptor(source, marker),
    )
    expect(yamlScalarTagAt(clone, 1)).toBe("изменять")
    expect(asExplicitYAMLStringIfMarked(clone, 0, clone[0])).toEqual(explicitYAMLString("001"))
  })

  it("разрешает совпадающую символьную метку и восстанавливает её дескриптор", () => {
    const marker = Symbol("marker")
    const source = {}
    const target = { [marker]: "claim-1" }
    Object.defineProperty(source, marker, {
      configurable: true,
      enumerable: false,
      writable: false,
      value: "claim-1",
    })

    copyYAMLRuntimeMetadata(source, target)

    expect(Object.getOwnPropertyDescriptor(target, marker)).toEqual(
      Object.getOwnPropertyDescriptor(source, marker),
    )
  })

  it("отклоняет несовместимую символьную метку", () => {
    const marker = Symbol("marker")
    const source = { [marker]: "claim-1" }
    const target = { [marker]: "claim-2" }

    expect(() => copyYAMLRuntimeMetadata(source, target)).toThrow(
      "Несовместимая служебная Symbol-метка YAML: Symbol(marker)",
    )
  })
})
```

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/runtimeMetadata.test.ts
```

Expected: FAIL, потому что `./runtimeMetadata` и `copyDoubleQuotedScalarMarks` ещё не существуют.

- [ ] **Step 3: Добавить копирование отметок двойных кавычек**

В `packages/runtime/yaml/explicitString.ts` рядом с `markDoubleQuotedScalar` добавить:

```ts
export function copyDoubleQuotedScalarMarks(source: object, target: object): void {
  const marks = doubleQuotedScalarMarks.get(source)
  if (marks === undefined) return
  for (const key of marks) markDoubleQuotedScalar(target, key)
}
```

- [ ] **Step 4: Реализовать общий поверхностный копировщик**

Создать `packages/runtime/yaml/runtimeMetadata.ts`:

```ts
import { copyDoubleQuotedScalarMarks } from "./explicitString"
import { copyYAMLMappingKeyOrder } from "./mappingTags"
import { copyYAMLScalarTags } from "./scalarTags"

export function copyYAMLRuntimeMetadata(source: object, target: object): void {
  copySymbolProperties(source, target)
  copyYAMLScalarTags(source, target)
  copyYAMLMappingKeyOrder(source, target)
  copyDoubleQuotedScalarMarks(source, target)
}

export function cloneYAMLContainer<T extends object>(source: T): T {
  const target = Object.assign(Array.isArray(source) ? [] : {}, source) as T
  copyYAMLRuntimeMetadata(source, target)
  return target
}

function copySymbolProperties(source: object, target: object): void {
  for (const key of Object.getOwnPropertySymbols(source)) {
    const sourceDescriptor = Object.getOwnPropertyDescriptor(source, key)
    if (sourceDescriptor === undefined) continue
    const targetDescriptor = Object.getOwnPropertyDescriptor(target, key)
    if (targetDescriptor !== undefined && !sameSymbolValue(sourceDescriptor, targetDescriptor)) {
      throw new Error(`Несовместимая служебная Symbol-метка YAML: ${String(key)}`)
    }
    if (targetDescriptor !== undefined && targetDescriptor.configurable !== true) {
      if (!sameDescriptor(sourceDescriptor, targetDescriptor)) {
        throw new Error(`Несовместимая служебная Symbol-метка YAML: ${String(key)}`)
      }
      continue
    }
    Object.defineProperty(target, key, sourceDescriptor)
  }
}

function sameSymbolValue(left: PropertyDescriptor, right: PropertyDescriptor): boolean {
  if ("value" in left || "value" in right) {
    return "value" in left && "value" in right && Object.is(left.value, right.value)
  }
  return left.get === right.get && left.set === right.set
}

function sameDescriptor(left: PropertyDescriptor, right: PropertyDescriptor): boolean {
  return sameSymbolValue(left, right)
    && left.configurable === right.configurable
    && left.enumerable === right.enumerable
    && left.writable === right.writable
}
```

Экспортировать обе публичные операции из `packages/runtime/index.ts`:

```ts
export * from "./yaml/runtimeMetadata"
```

- [ ] **Step 5: Запустить unit-тесты runtime и проверку типов**

Run:

```bash
pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/runtimeMetadata.test.ts yaml/export.test.ts yaml/jsYamlParser.test.ts
pnpm --filter @nkdk/runtime type-check
```

Expected: все тесты PASS, TypeScript завершается с кодом 0.

- [ ] **Step 6: Проверить новые дубли и закоммитить слой**

Run:

```bash
pnpm duplicates -- --base 9cdcb73b9
git add packages/runtime/yaml/runtimeMetadata.ts packages/runtime/yaml/runtimeMetadata.test.ts packages/runtime/yaml/explicitString.ts packages/runtime/index.ts
git commit -m "feat: :sparkles: сохранять служебные метаданные YAML"
```

Expected: новые дубли не найдены; создан один коммит слоя runtime.

---

### Task 2: Материализация `ПутьКДанным` без потери export claim

**Files:**
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.ts`

**Interfaces:**
- Consumes: `cloneYAMLContainer<T extends object>(source: T): T`, `markXmlAnomalyExportClaim(value, claimId)`, `readXmlAnomalyExportClaim(value)`.
- Produces: `materializeImplicitFormDataPaths` с прежней сигнатурой, но с сохранением всех runtime-метаданных на каждом клонированном контейнере пути.

- [ ] **Step 1: Добавить регрессионный unit-тест исходной ошибки**

В импорты `formDataPathContext.test.ts` добавить `markXmlAnomalyExportClaim` и `readXmlAnomalyExportClaim` из `@nkdk/runtime`. В блок `describe` добавить:

```ts
it("сохраняет export claim при материализации неявного пути", () => {
  const element = { Вид: "ПолеВвода" }
  markXmlAnomalyExportClaim(element, "item-1")
  const yaml = {
    Реквизиты: {
      Объект: { Тип: "CatalogObject.Товары", ОсновнойРеквизит: "Истина" },
    },
    Элементы: { Наименование: element },
  } satisfies ClientApplicationFormYAML
  const context = prepareFormDataPathContextFromYAML({ yaml, ownerCache: catalogOwnerCache() })

  const prepared = materializeImplicitFormDataPaths(yaml, context)

  expect(prepared.Элементы.Наименование.ПутьКДанным).toBe("Объект.Наименование")
  expect(readXmlAnomalyExportClaim(prepared.Элементы.Наименование)).toBe("item-1")
  expect(prepared.Элементы.Наименование).not.toBe(element)
  expect(readXmlAnomalyExportClaim(element)).toBe("item-1")
  expect(element).not.toHaveProperty("ПутьКДанным")
})
```

- [ ] **Step 2: Запустить тест и подтвердить регрессию**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata
```

Expected: новый тест FAIL — на подготовленном элементе `readXmlAnomalyExportClaim(...)` возвращает `undefined`.

- [ ] **Step 3: Перевести клонирование пути на общий механизм**

В `formDataPathContext.ts` заменить импорт `copyYAMLScalarTags` на `cloneYAMLContainer`. Удалить локальную функцию `cloneContainer` и заменить оба вызова:

```ts
const root = cloneYAMLContainer(yaml)
```

и

```ts
targetChild = cloneYAMLContainer(sourceChild)
```

Оставить существующую карту `clones`: она гарантирует не более одной поверхностной копии каждого изменяемого контейнера. Не добавлять обход неизменённых ветвей.

- [ ] **Step 4: Запустить тесты формы и проверку типов rules**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata
pnpm --filter @nkdk/rules type-check
```

Expected: тесты PASS; TypeScript завершается с кодом 0.

- [ ] **Step 5: Проверить новые дубли и закоммитить исправление**

Run:

```bash
pnpm duplicates -- --base 9cdcb73b9
git add packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.ts packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts
git commit -m "fix: :bug: сохранять raw-привязку при вычислении пути формы"
```

Expected: новые дубли не найдены; исправление оформлено отдельным коммитом.

---

### Task 3: Перевод существующих смысловых копий на общий договор

**Files:**
- Modify: `packages/runtime/yaml/export.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/metadataTargetOccurrences.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseFormProjection.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/childItems/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/childItems/treeYAML.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/anomalies.ts`

**Interfaces:**
- Consumes: `copyYAMLRuntimeMetadata(source, target)` и `cloneYAMLContainer(source)` из Task 1.
- Produces: все обнаруженные преобразования, которые раньше переносили только scalar tags, теперь сохраняют полный runtime-договор; глубокие аннотации остаются на прежних отдельных вызовах.

- [ ] **Step 1: Перевести runtime-преобразования**

В `packages/runtime/yaml/export.ts` заменить пары `copyYAMLScalarTags` + `copyYAMLMappingKeyOrder` на один вызов `copyYAMLRuntimeMetadata`. Для массива вызвать `copyYAMLRuntimeMetadata(value, data)`, для mapping — отдельно для `dumpValue` и `data`. Существующие вызовы `copyXmlAnomalyAnnotationsForParent` оставить без изменений.

В `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts` после `Object.assign(result, exportedValues)` вызывать:

```ts
copyYAMLRuntimeMetadata(exportedValues, result)
```

В `packages/runtime/metadata/ruleRuntime/property/metadataTargetOccurrences.ts` сохранить рекурсивное клонирование дочерних значений, но заменить ручное копирование `Symbol` и scalar tags единым вызовом для массива и объекта:

```ts
copyYAMLRuntimeMetadata(value, result)
```

В обоих файлах `packages/runtime/metadata/ruleRuntime/formElement/fromYAMLToXML.ts` и `fromXMLToYAML.ts` заменить `copyYAMLScalarTags(source, result)` на `copyYAMLRuntimeMetadata(source, result)`.

- [ ] **Step 2: Перевести предметные преобразования rules**

Заменить `copyYAMLScalarTags` на `copyYAMLRuntimeMetadata` во всех существующих местах:

```text
packages/rules/metadata/forms/clientApplicationForm/baseFormProjection.ts
packages/rules/metadata/forms/commonObjects/childItems/fromXMLToYAML.ts
packages/rules/metadata/forms/commonObjects/childItems/treeYAML.ts
packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/toYAML.ts
packages/rules/metadata/commonObjects/i8nText/anomalies.ts
```

В `normalizeProjectionAliases` и `moveButtonTypeToTreeYAML`, где создаётся прямой поверхностный клон, использовать `cloneYAMLContainer(source)` вместо `{ ...source }` с последующим копированием. В преобразованиях, которые добавляют или переименовывают смысловые поля, оставить построение `result` и после него вызвать `copyYAMLRuntimeMetadata(source, result)`.

- [ ] **Step 3: Упростить глубокий клон для anomaly proof**

В `packages/rules/metadata/importFromXml/anomalyProof.ts` заменить локальный `copyYamlMetadata` на `copyYAMLRuntimeMetadata`. Неперечислимые строковые свойства продолжать восстанавливать существующим циклом `Object.getOwnPropertyNames`; это специальный договор proof-клона и он не входит в общий runtime-копировщик. `XmlAnomalyAnnotationsSnapshot` и восстановление аннотаций не менять.

- [ ] **Step 4: Проверить, что частичные копировщики больше не используются в смысловых преобразованиях**

Run:

```bash
rg -n "copyYAMLScalarTags|copyYAMLMappingKeyOrder" packages/runtime packages/rules
```

Expected: определения функций остаются в `packages/runtime/yaml/scalarTags.ts` и `packages/runtime/yaml/mappingTags.ts`; их импорт и вызовы остаются только внутри `packages/runtime/yaml/runtimeMetadata.ts` и в тестах, которые проверяют сами низкоуровневые операции. В производственных преобразователях совпадений нет.

- [ ] **Step 5: Запустить связанные тестовые проекты**

Run:

```bash
pnpm --filter @nkdk/runtime test:isolated
pnpm --filter @nkdk/rules test:isolated
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
```

Expected: runtime unit и rules unit/core-metadata/bundle-contract PASS; обе проверки типов завершаются с кодом 0.

- [ ] **Step 6: Проверить новые дубли и закоммитить миграцию**

Run:

```bash
pnpm duplicates -- --base 9cdcb73b9
git add packages/runtime/yaml/export.ts packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts packages/runtime/metadata/ruleRuntime/property/metadataTargetOccurrences.ts packages/runtime/metadata/ruleRuntime/formElement/fromYAMLToXML.ts packages/runtime/metadata/ruleRuntime/formElement/fromXMLToYAML.ts packages/rules/metadata/forms/clientApplicationForm/baseFormProjection.ts packages/rules/metadata/forms/commonObjects/childItems/fromXMLToYAML.ts packages/rules/metadata/forms/commonObjects/childItems/treeYAML.ts packages/rules/metadata/importFromXml/anomalyProof.ts packages/rules/metadata/commonObjects/dataCompositionSystem/availableValues/toYAML.ts packages/rules/metadata/commonObjects/i8nText/anomalies.ts
git commit -m "refactor: :recycle: унифицировать копирование метаданных YAML"
```

Expected: новые дубли не найдены; миграция оформлена отдельным коммитом.

---

### Task 4: Полная синхронизация формы и итоговая проверка `doc`

**Files:**
- Create: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.testSupport.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts`

**Interfaces:**
- Consumes: исправленный `materializeImplicitFormDataPaths`, существующие `prepareTestXmlAnomalyAssignment`, `convertClientApplicationFormFromYAMLToXML`, `buildPreparedAssignmentXml`.
- Produces: интеграционная гарантия, что raw-граница на элементе формы переживает вычисление отсутствующего `ПутьКДанным` и применяется к фактическому XML-узлу.

- [ ] **Step 1: Вынести тестовый индекс владельца формы в общий test support**

Создать `formDataPathContext.testSupport.ts`, переместив без изменения функции `catalogOwnerCache` и `catalogOwner` из конца `formDataPathContext.test.ts` вместе с их текущими импортами `MetadataCatalogRules`, `buildObjectFieldIndex`, `createValidationOwnerFacts` и типами владельца. Экспортировать только:

```ts
export function catalogOwnerCache(): OwnerMetadataCache
```

В unit-тесте заменить локальные функции импортом из `./formDataPathContext.testSupport` и убедиться, что сам unit-тест остаётся зелёным.

- [ ] **Step 2: Добавить интеграционный тест полной синхронизации**

В `xmlAnomalyAssignment.integration.test.ts` импортировать `prepareFormDataPathContextFromYAML` и `catalogOwnerCache`. Рядом с тестом `связывает raw поля form element...` добавить:

```ts
it("сохраняет raw-привязку при материализации неявного пути элемента формы", () => {
  const prepared = prepareAnomalies([
    "Реквизиты:",
    "  Объект:",
    "    Тип: CatalogObject.Товары",
    "    ОсновнойРеквизит: Истина",
    "Элементы:",
    "  Наименование:",
    "    Вид: ПолеВвода",
    "    Future: !xml/raw",
    "      $xml: value",
  ].join("\n"), anomalyRegistries.xmlAnomalies, ClientApplicationFormRules, anomalyRegistries)
  const yaml = prepared.preparedYamlFile.data as ClientApplicationFormYAML
  const context = mockContextToXML()
  const formDataPathContext = prepareFormDataPathContextFromYAML({
    yaml,
    ownerCache: catalogOwnerCache(),
  })
  const ordinary = withPropertyRuleRegistrySet(anomalyRegistries.property, () =>
    withRuleRegistrySet(anomalyRegistries, () => convertClientApplicationFormFromYAMLToXML({
      context,
      yaml,
      annotations: prepared.preparedYamlFile.annotations,
      formDataPathContext,
      name: "Форма",
    }).formXML),
  )

  const xml = buildPreparedAssignmentXml({
    document: {
      targetXmlPath: "Form.xml",
      xml: { Form: ordinary },
      deferred: [],
      rootRule: ClientApplicationFormRules,
      rawBoundaries: prepared.rawBoundaries,
    },
    context,
  })

  expect(xml).toContain('<InputField name="Наименование"')
  expect(xml).toContain("<DataPath>Объект.Description</DataPath>")
  expect(xml).toContain("<Future>value</Future>")
})
```

- [ ] **Step 3: Запустить целевые unit- и integration-тесты**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts
```

Expected: оба набора PASS; новый integration-тест не выбрасывает `full_xml_sync_assignment_failed`.

- [ ] **Step 4: Запустить обязательные проверки проекта**

Команды с LMDB выполнять вне песочницы:

```bash
pnpm type-check
pnpm test
pnpm duplicates -- --base 9cdcb73b9
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: все команды завершаются с кодом 0; baseline dependency-cruiser не изменяется.

- [ ] **Step 5: Повторить round-trip YAML каталога `doc` вне песочницы**

Run из корня worktree:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: этап YAML → XML проходит дальше прежних 324 ошибок `full_xml_sync_assignment_failed`. Если остаются иные различия, сохранить отчёт и сгруппировать их отдельно; не изменять исходный каталог XML.

- [ ] **Step 6: Закоммитить интеграционную гарантию**

Run:

```bash
git add packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.testSupport.ts packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts
git commit -m "test: :white_check_mark: проверить raw после вычисления пути формы"
```

Expected: рабочее дерево чистое; история содержит отдельные коммиты runtime, исправления, миграции и интеграционной проверки.
