# Исправление round-trip Storekeeper — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans-with-review`, and inside it `superpowers:executing-plans`, to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Implementation remains in the primary agent; only the final conformance review is delegated.

**Goal:** Сохранить отсутствующий канонический стандартный реквизит точечным
`!xml/raw`, корректно проверять локализацию во вложенной форме и получить чистый
Storekeeper round-trip с принятыми неразрешёнными UUID.

**Architecture:** Фабрика именованной metadata-коллекции передаёт существующее
отображение внутреннего имени в YAML-ключ proof-слою. Структурное сравнение
выравнивает повторяющиеся XML-элементы по уникальному `name`, после чего proof
создаёт единственную границу отсутствующего канонического item. Проверка файлов
свойств обходит все виды `yamlToXMLNestedRule`. Обычный YAML → XML связывает
metadata-ссылку с точной XML-аннотацией по `MetadataTargetOccurrence.location`,
а raw целого item без внешней привязки явно относится к основному документу.

**Tech Stack:** TypeScript, Vitest, rule-kit, структурный XML parser, XML anomaly proof, project validation, MCP, `round-trip-yaml`.

**Spec:** `docs/superpowers/specs/2026-09-02-storekeeper-round-trip-anomalies-design.md`

## Global Constraints

- Comparison base: `0c879181b23384cfa868d63d0765f455d021f3eb` (`origin/develop` после `git fetch origin develop`).
- Worktree: `/Users/nikita/git/nkdk/.worktrees/storekeeper-round-trip-anomalies`, branch `codex/storekeeper-round-trip-anomalies`.
- Не изменять существующие XML-фикстуры; для регрессии копировать fixture во временный каталог и изменять только копию.
- Не возвращать `!xml/absent`; утверждённое новое применение — только точечный `!xml/raw` с `$xml: null` у отсутствующего канонического item.
- Не добавлять проверки по `Storekeeper`, `ExchangeDate`, `ExchangePlan`, `MetadataCommonForm` или путям каталогов в нейтральные слои.
- Не добавлять поля в `BasePropertyRule` и `PropertyRule` и не добавлять параметры построителей rules.ts. Сигнатура существующего `recordYamlKeyFromYAML` получает `propertyRule`, а фабрика передаёт эту же функцию в исполнительный descriptor.
- Не изменять `.agents/architecture.md`: направление зависимостей и операция импорта не меняются.
- Не переносить коммиты из ещё не влитой ветки `codex/tester-round-trip-fixes`; перед будущим PR проверить совместимость веток отдельно.
- Все production-изменения выполнять через RED → GREEN: сначала наблюдаемое падение реального теста, затем минимальная реализация.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb`.

---

### Task 1: Передать отображение внутреннего имени коллекции в proof

**Files:**

- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataCollection/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataCollection/ruleFactory.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`
- Modify: `packages/rules/metadata/ruleRuntime/metadataCollection/ruleFactory.test.ts`

**Interfaces:**

- Consumes: существующий параметр фабрики `recordYamlKeyFromYAML` и `PropertyRule` владельца коллекции.
- Produces: `YAMLToXMLNestedRule` вида `collection` с необязательной функцией
  `recordYamlKeyFromYAML(params: { yaml: Record<string, unknown>; name: string; propertyRule: PropertyRule }): string`.
- Later tasks rely on: proof вызывает эту функцию для отсутствующего канонического имени и получает `ДатаОбмена` из `standartAttributeNames` текущего свойства.

- [ ] **Step 1: Написать падающий тест исполнительного descriptor**

  В `ruleFactory.test.ts` зарегистрировать тестовую record-коллекцию с
  `recordYamlKeyFromYAML`, которое использует поле тестового `propertyRule`, и
  получить реальный `yamlToXMLNestedRule` из `RuleRegistrySet`:

  ```ts
  it("передаёт propertyRule в отображение внутреннего имени на YAML-ключ", () => {
    const propertyType = "TestCanonicalNameCollection" as PropertyRuleType
    const rules = createCollectionRegistry(defineMetadataItemCollectionRule({
      propertyType,
      itemRule,
      xmlElement: "Item",
      keyField: "name",
      completeItemNames: () => ["ExchangeDate"],
      recordYamlKeyFromYAML: ({ name, propertyRule }) =>
        (propertyRule as PropertyRule & { names: Record<string, string> }).names[name] ?? name,
    }))
    const descriptor = rules.property.getTypeRule(propertyType, "yamlToXMLNestedRule")

    expect(descriptor).toMatchObject({
      kind: "collection",
      recordYamlKeyFromYAML: expect.any(Function),
    })
    if (descriptor?.kind !== "collection" || descriptor.recordYamlKeyFromYAML === undefined) {
      throw new Error("Не передано отображение имени коллекции")
    }
    expect(descriptor.recordYamlKeyFromYAML({
      yaml: {},
      name: "ExchangeDate",
      propertyRule: { type: propertyType, names: { ExchangeDate: "ДатаОбмена" } } as never,
    })).toBe("ДатаОбмена")
  })
  ```

  Production mutation caught: удаление функции из descriptor либо потеря
  `propertyRule` возвращает `ExchangeDate`/`undefined` вместо `ДатаОбмена`.

- [ ] **Step 2: Запустить тест и подтвердить RED**

  Run:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/ruleRuntime/metadataCollection/ruleFactory.test.ts
  ```

  Expected: FAIL — `yamlToXMLNestedRule` не содержит `recordYamlKeyFromYAML`.

- [ ] **Step 3: Расширить существующий договор отображения имени**

  В `fromYAMLToXMLTypes.ts` добавить к варианту `kind: "collection"` ту же
  необязательную функцию с обязательным `propertyRule`. В
  `metadataCollection/fromXMLToYAML.ts` расширить параметры существующего
  callback и передавать текущий `params.rule`:

  ```ts
  params.recordYamlKeyFromYAML?.({
    yaml: itemYaml,
    name,
    propertyRule: params.rule,
  })
  ```

  В `ruleFactory.ts` не вводить новый параметр: передать
  `params.recordYamlKeyFromYAML` в создаваемый `yamlToXMLNestedRule`.

- [ ] **Step 4: Сделать отображение стандартных реквизитов зависимым от свойства**

  В `registerCollectionRule.ts` вынести прямое отображение внутреннего имени:

  ```ts
  function buildYamlName(rule: PropertyRule | undefined): (name: string) => string {
    const names = (rule as StandardAttributeDescriptionsPropertyRule | undefined)
      ?.standartAttributeNames
    return (name) => names?.[name]
      ?? StandartAttributeNameToYAML[name as keyof typeof StandartAttributeNameToYAML]
      ?? name
  }
  ```

  Использовать его в существующем параметре:

  ```ts
  recordYamlKeyFromYAML: ({ name, propertyRule }) => buildYamlName(propertyRule)(name),
  ```

  Обратные `nameFromYAMLKey*` и `completeItemNames` не менять.

- [ ] **Step 5: Получить GREEN и проверить типы слоя**

  Run:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/ruleRuntime/metadataCollection/ruleFactory.test.ts
  pnpm --filter @nkdk/rules exec tsc --noEmit
  pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
  ```

  Expected: тест, TypeScript и проверка новых дублей проходят.

- [ ] **Step 6: Зафиксировать слой**

  ```bash
  git add packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts \
    packages/runtime/metadata/ruleRuntime/metadataCollection/fromXMLToYAML.ts \
    packages/runtime/metadata/ruleRuntime/metadataCollection/ruleFactory.ts \
    packages/rules/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts \
    packages/rules/metadata/ruleRuntime/metadataCollection/ruleFactory.test.ts
  git commit -m "refactor: :recycle: передать имя элемента коллекции в proof"
  ```

### Task 2: Сопоставить повторяющиеся XML-элементы по уникальному name

**Files:**

- Modify: `packages/runtime/xml/structure/compare.ts`
- Modify: `packages/runtime/xml/structure/compare.test.ts`

**Interfaces:**

- Consumes: два списка `XmlElementNode`, где повторяющиеся элементы одного XML-тега имеют уникальный атрибут `name`.
- Produces: `compareXmlStructureDifferences` сопоставляет такие элементы по паре `тег + name`, даже если длины списков различаются; неназванные и неоднозначные списки сохраняют позиционное сопоставление.
- Later tasks rely on: добавленный первым `ExchangeDate` создаёт одну presence-разницу, а существующие семь стандартных реквизитов не выглядят изменёнными.

- [ ] **Step 1: Написать падающую проверку списка разной длины**

  В `compare.test.ts` разобрать два реальных XML-документа:

  ```ts
  const source = parseXmlDocumentWithSaxes([
    "<Root><Items>",
    '<Item name="A"><Value>one</Value></Item>',
    '<Item name="B"><Value>two</Value></Item>',
    "</Items></Root>",
  ].join(""))
  const exported = parseXmlDocumentWithSaxes([
    "<Root><Items>",
    '<Item name="X"><Value>default</Value></Item>',
    '<Item name="A"><Value>one</Value></Item>',
    '<Item name="B"><Value>two</Value></Item>',
    "</Items></Root>",
  ].join(""))

  expect(compareXmlStructureDifferences(source.roots, exported.roots)).toEqual([{
    path: "/Root[1]/Items[1]/Item[1]",
    ownerPath: "/Root[1]/Items[1]",
    kind: "presence",
  }])
  ```

  Production mutation caught: возврат к `name[occurrence]` создаёт ложные
  value-разницы у `A` и `B`.

- [ ] **Step 2: Подтвердить RED**

  Run:

  ```bash
  pnpm --filter @nkdk/runtime exec vitest run --project unit xml/structure/compare.test.ts
  ```

  Expected: FAIL — текущий позиционный алгоритм сообщает несколько различий.

- [ ] **Step 3: Добавить безопасный выбор ключа сопоставления**

  В `compare.ts` добавить helper, который выбирает `elementOrderKey` только
  когда именованные ключи уникальны отдельно в обоих списках и хотя бы один
  элемент действительно имеет атрибут `name`. При равных множествах по-прежнему
  отдельно фиксировать `#order`; при различной длине сравнивать адресные списки
  по выбранному ключу без ложной order-ошибки.

  Набросок договора helper:

  ```ts
  function elementListKey(
    expected: readonly XmlElementNode[],
    actual: readonly XmlElementNode[],
  ): (node: XmlElementNode) => string {
    const hasNamed = [...expected, ...actual].some(hasNameAttribute)
    const expectedKeys = expected.map(elementOrderKey)
    const actualKeys = actual.map(elementOrderKey)
    return hasNamed
      && new Set(expectedKeys).size === expectedKeys.length
      && new Set(actualKeys).size === actualKeys.length
      ? elementOrderKey
      : elementKey
  }
  ```

  Для `compareContent` добавить `contentListKey`: он применяет
  `elementOrderKey` только к element-узлам, а для текста и processing
  instruction сохраняет действующий `contentKey`. Выбирать этот ключ также
  только при уникальности всего набора; адреса атрибутов и текста не менять.

- [ ] **Step 4: Получить GREEN и проверить соседние XML-тесты**

  Run:

  ```bash
  pnpm --filter @nkdk/runtime exec vitest run --project unit xml/structure/compare.test.ts xml/structure/merge.test.ts xml/structure/hash.test.ts
  pnpm --filter @nkdk/runtime exec tsc --noEmit
  pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
  ```

  Expected: все проверки проходят; существующая проверка изменения порядка
  продолжает возвращать `#order`.

- [ ] **Step 5: Зафиксировать слой**

  ```bash
  git add packages/runtime/xml/structure/compare.ts packages/runtime/xml/structure/compare.test.ts
  git commit -m "fix: :bug: сопоставить именованные XML-элементы без сдвига"
  ```

### Task 3: Создать точечную границу отсутствующего канонического item

**Files:**

- Modify: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.test.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.integration.test.ts`

**Interfaces:**

- Consumes: `YAMLToXMLNestedRule` collection с `yamlShape: "record"`, `xmlElement`, `completeItemNames`, `recordYamlKeyFromYAML`, actual item anchors и `PropertyRule`.
- Produces: по одной `XmlAnomalyProofBoundary` с `presentInSource: false` для каждого отсутствующего канонического имени; `yamlPath` указывает на public item, `xmlPath` — на его каноническую позицию в обычном экспорте.
- Later tasks rely on: control export записывает `ДатаОбмена: !xml/raw` с `$xml: null`, а sync удаляет только `ExchangeDate`.

- [ ] **Step 1: Написать падающий unit-тест границы**

  В `anomalyProof.test.ts` использовать реальный тип
  `StandardAttributeDescriptions` и компактный XML с двумя item `Code` и
  `Description`. Заявить оба item в audit с YAML-якорями `Код` и
  `Наименование`, а в PropertyRule задать литеральную карту:

  ```ts
  standartAttributeNames: {
    ExchangeDate: "ДатаОбмена",
    Description: "Наименование",
    Code: "Код",
  }
  ```

  Проверить единственную новую границу:

  ```ts
  expect(boundaries).toContainEqual(expect.objectContaining({
    xmlPath: "/Owner[1]/StandardAttributes[1]/xr:StandardAttribute[1]",
    yamlPath: ["СтандартныеРеквизиты", "ДатаОбмена"],
    rulePath: ["standardAttributes"],
    presentInSource: false,
  }))
  expect(boundaries).not.toContainEqual(expect.objectContaining({
    yamlPath: ["СтандартныеРеквизиты", "Код"],
    presentInSource: false,
  }))
  ```

  Второй случай тем же тестовым helper добавляет физический `ExchangeDate` и
  ожидает отсутствие границы `ДатаОбмена`.

  Production mutation caught: удаление перечисления `completeItemNames` снова
  оставляет расхождение без точечного YAML-адреса.

- [ ] **Step 2: Подтвердить RED unit-теста**

  Run:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/importFromXml/anomalyProof.test.ts
  ```

  Expected: FAIL — граница `ДатаОбмена` отсутствует.

- [ ] **Step 3: Написать падающий integration-тест control export**

  В `controlExport.integration.test.ts`:

  - взять существующий
    `metadataExchangePlan/__fixtures__/full.xml`;
  - записать во временную копию вариант без полного блока
    `<xr:StandardAttribute name="ExchangeDate">…</xr:StandardAttribute>`;
  - создать реальный assignment topology
    `ПланОбмена/{ownerName}/Свойства.yaml`;
  - выполнить `prepareImportYaml` и `executeImportControlExport` реальной
    композицией;
  - сериализовать итоговый YAML через
    `restoreXmlAnomalyAnnotations`/`serializeYAMLDocument`.

  Проверить литеральные результаты:

  ```ts
  expect(text).toContain([
    "СтандартныеРеквизиты:",
    "  ДатаОбмена: !xml/raw",
    "    $xml: null",
  ].join("\n"))
  expect(text).not.toContain("name: !xml/raw")
  expect(result.warnings).toEqual([])
  ```

  Затем подготовить итоговый assignment через существующий full-sync helper и
  сравнить нормализованные XML-корни с временной исходной копией. Отдельно
  проверить отсутствие `name="ExchangeDate"` и `<_name>`.

  Production mutation caught: positional proof либо широкий raw создают
  `ExchangeDate`, вложенные `_name` или предупреждение.

- [ ] **Step 4: Подтвердить RED integration-теста**

  Run:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/importFromXml/controlExport.integration.test.ts
  ```

  Expected: FAIL — нет `ДатаОбмена: !xml/raw` и/или остаются raw у `name`.

- [ ] **Step 5: Реализовать планирование отсутствующих canonical item**

  В collection-ветви `appendPlannedAbsenceBoundaries` после рекурсивного обхода
  физических anchors:

  1. Выйти без изменений для `yamlShape !== "record"`, отсутствующего
     `completeItemNames`, `recordYamlKeyFromYAML` или `xmlElement`.
  2. Получить текущий YAML-владелец через
     `valueAtYamlPath(params.data, params.yamlPrefix)` и создать
     `YAMLPropertySource` экспортированной функцией
     `createYAMLPropertySource({ yaml: ownerYaml, rule: params.rule })`.
     Передать его в `completeItemNames({ source, propertyRule })`.
  3. Получить внутренние имена физических item из последнего сегмента
     `anchor.yamlPath`, преобразовав YAML-ключ через
     `nameFromYAMLKeyForProperty`/`nameFromYAMLKey`.
  4. Для каждого отсутствующего имени вычислить public key через
     `recordYamlKeyFromYAML({ yaml: {}, name, propertyRule })`.
  5. Проверить непустые и уникальные public key; нарушение завершает import
     сообщением о неоднозначной декларации коллекции.
  6. Построить XML-путь как
     `${containerXmlPath}/${xmlElement}[${canonicalIndex + 1}]` и добавить
     boundary. Для этой ветви дедупликация выполняется по YAML-пути: совпадение
     physical source-позиции допустимо, потому что путь относится к будущему
     обычному экспорту.

  Вынести вычисление отсутствующих элементов в небольшой чистый helper внутри
  `anomalyProof.ts`; не добавлять concrete-типы и не менять `PropertyRule`.

- [ ] **Step 6: Получить GREEN unit- и integration-тестов**

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/importFromXml/anomalyProof.test.ts
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/importFromXml/controlExport.integration.test.ts
  ```

  Expected: оба unit-случая проходят, большие dynamic-коллекции не получают
  дополнительных отсутствий, integration даёт точечный raw, ноль warnings и
  структурно равный XML.

- [ ] **Step 7: Проверить слой и зафиксировать**

  ```bash
  pnpm --filter @nkdk/rules exec tsc --noEmit
  pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
  git add packages/rules/metadata/importFromXml/anomalyProof.ts \
    packages/rules/metadata/importFromXml/anomalyProof.test.ts \
    packages/rules/metadata/importFromXml/controlExport.integration.test.ts
  git commit -m "fix: :bug: сохранить отсутствие канонического XML-элемента"
  ```

### Task 4: Проверить локализацию во всех вложенных YAML-правилах

**Files:**

- Create: `packages/rules/metadata/validation/metadataRuleYamlProperties.ts`
- Create: `packages/rules/metadata/validation/metadataRuleYamlProperties.test.ts`
- Modify: `packages/rules/metadata/validation/metadataRuleYamlTraversal.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.integration.test.ts`

**Interfaces:**

- Consumes: parsed YAML, root `MetadataItemRule`, root name, configuration context and callback счётчика локализованных свойств.
- Produces: `validateMetadataRuleYamlProperties(params): Diagnostic[]`; каждый объект, посещённый `traverseMetadataRuleYaml`, проверяется ровно один раз через `validateRuleYAMLObjectProperties`.
- Later tasks rely on: незарегистрированный `en` во вложенной `ClientApplicationForm` создаёт адресную диагностику до применения `!xml/invalid`.

- [ ] **Step 1: Написать падающий unit-тест helper**

  В новом `metadataRuleYamlProperties.test.ts` разобрать YAML:

  ```yaml
  Форма:
    Заголовок:
      ru: Заголовок
      en: Title
  ```

  Вызвать будущий helper с `MetadataCommonFormRules`, контекстом только `ru` и
  именем `РабочийСтол`. Ожидать одну диагностику:

  ```ts
  expect(diagnostics).toEqual([
    expect.objectContaining({
      path: "/Форма/Заголовок/en",
      message: expect.stringContaining("Незарегистрированный язык en"),
    }),
  ])
  expect(localizedTextProperties).toBe(1)
  ```

  Production mutation caught: возврат к `resolvePropertyItemRule` не входит в
  `ClientApplicationForm`, чей XML-descriptor имеет kind `externalFile`, а
  вложенное YAML-правило зарегистрировано отдельно как `nestedItemRule`.

- [ ] **Step 2: Подтвердить RED**

  Run:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/validation/metadataRuleYamlProperties.test.ts
  ```

  Expected: FAIL — helper отсутствует.

- [ ] **Step 3: Реализовать единичную объектную проверку поверх общего обхода**

  Экспортировать из нового файла:

  ```ts
  export function validateMetadataRuleYamlProperties(
    params: ValidateExcludedEqualNameYAMLParams,
  ): Diagnostic[]
  ```

  Реализация вызывает `traverseMetadataRuleYaml<{ name: string | undefined }>`:

  ```ts
  const diagnostics: Diagnostic[] = []
  traverseMetadataRuleYaml({
    yaml: params.parsed.data,
    rule: params.rule,
    initialState: { name: params.name },
    onObject: ({ yaml, rule, yamlPath, state }) => {
      diagnostics.push(...validateRuleYAMLObjectProperties({
        ...params,
        rule,
        value: yaml,
        yamlPath,
        name: state.name,
      }))
    },
    enterCollectionItem: ({ itemName }) => ({ name: itemName }),
  })
  return diagnostics
  ```

  `metadataRuleYamlTraversal` должен посещать объект `externalFile`, когда для
  типа есть прямой `nestedItemRule`; `enterNestedObject` не задавать, поэтому
  вложенная форма наследует имя владельца. Внутреннюю рекурсию старого
  `validateExcludedEqualNameYAML` не вызывать, иначе коллекции получат дубли.

- [ ] **Step 4: Получить GREEN unit-теста**

  Повторить команду Task 4 Step 2. Expected: одна диагностика и счётчик `1`.

- [ ] **Step 5: Написать падающую project-validation регрессию**

  В `projectValidationPasses.integration.test.ts` рядом с существующими
  проверками общей формы добавить `it.each` из трёх литеральных случаев:

  1. `en: Title` без тега — одна ошибка
     `/Форма/Заголовок/en`.
  2. `!xml/invalid en: Title` — нет ошибок и нет сообщения
     `Тег XML-аномалии лишний`.
  3. Только `ru: Заголовок` — нет ошибок.

  Использовать реальный `validateProjectFileFirstPass`, контекст
  `createConfigurationLanguages({ default: "ru", registered: ["ru"] })` и
  путь `ОбщаяФорма/РабочийСтол/Свойства.yaml`.

- [ ] **Step 6: Подтвердить RED интеграции**

  Run:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/validation/projectValidationPasses.integration.test.ts
  ```

  Expected: случай без тега не получает языковую ошибку, а случай с
  `!xml/invalid` сообщает о лишнем теге.

- [ ] **Step 7: Переключить properties first pass на новый helper**

  В `projectValidationPasses.ts` заменить единственный вызов
  `validateExcludedEqualNameYAML` внутри `validateProjectPropertiesFirstPass`
  на `validateMetadataRuleYamlProperties`, сохранив `filePath`, `parsed`,
  `rule`, `context`, `name` и `onLocalizedTextProperty`. Другие вызовы, включая
  специализированную проверку самостоятельного `Форма.yaml`, не менять.

- [ ] **Step 8: Получить GREEN и проверить самостоятельную форму**

  Run:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/validation/metadataRuleYamlProperties.test.ts
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/validation/projectValidationPasses.integration.test.ts metadata/validation/validateForm.integration.test.ts
  pnpm --filter @nkdk/rules exec tsc --noEmit
  pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
  ```

  Expected: все проверки проходят, standalone-form поведение не изменено.

- [ ] **Step 9: Зафиксировать слой**

  ```bash
  git add packages/rules/metadata/validation/metadataRuleYamlProperties.ts \
    packages/rules/metadata/validation/metadataRuleYamlProperties.test.ts \
    packages/rules/metadata/validation/metadataRuleYamlTraversal.ts \
    packages/rules/metadata/validation/projectValidationPasses.ts \
    packages/rules/metadata/validation/projectValidationPasses.integration.test.ts
  git commit -m "fix: :bug: проверить локализацию вложенной общей формы"
  ```

### Task 5: Зафиксировать договор и впервые проверить настоящую конфигурацию

**Files:**

- Modify: `.agents/xml-anomalies.md`
- Verify: `/Users/nikita/git/round-trip-compact/cf/StorekeeperDevelopers_2_0_108_1_setup1c`
- Verify: all changes since `0c879181b23384cfa868d63d0765f455d021f3eb`

**Interfaces:**

- Consumes: реализованные collection proof и nested validation.
- Produces: документированный пример canonical item raw-null и реальные
  diagnostics Storekeeper после первых четырёх слоёв.

- [ ] **Step 1: Дополнить реестр XML-аномалий точным примером**

  После таблицы «Присутствие, пустота и default» добавить один абзац и YAML:

  ```yaml
  СтандартныеРеквизиты:
    ДатаОбмена: !xml/raw
      $xml: null
  ```

  Текст должен фиксировать: маркер относится к отсутствующему каноническому
  item существующей именованной коллекции; удаление маркера разрешает Rules
  снова материализовать item. Не вводить новый тег или частное правило.

- [ ] **Step 2: Проверить форматирование и зафиксировать документацию**

  ```bash
  git diff --check
  git add .agents/xml-anomalies.md
  git commit -m "docs: :memo: описать raw отсутствующего элемента коллекции"
  ```

- [ ] **Step 3: Выполнить обязательные проверки репозитория**

  Run из корня worktree:

  ```bash
  pnpm type-check
  pnpm test
  pnpm test:architecture:rules
  pnpm test:architecture
  pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
  git diff --check 0c879181b23384cfa868d63d0765f455d021f3eb
  ```

  Expected: все команды exit 0; новые дубли отсутствуют.

- [ ] **Step 4: Запустить Storekeeper round-trip свежим MCP**

  Использовать навык `round-trip-yaml` из этого worktree. Не сбрасывать
  пользовательский XML-репозиторий. Skill должен работать с абсолютным
  XML-каталогом:

  ```bash
  env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
    NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/StorekeeperDevelopers_2_0_108_1_setup1c \
    ./.agents/skills/round-trip-yaml/round-trip.sh
  ```

  Expected для первого диагностического прогона:

  - import завершается без прежних 24 ошибок локализации;
  - XML `ДатаОбмена: !xml/raw` имеет `$xml: null`, без широкого raw и `<_name>`;
  - любые оставшиеся ошибки sync записаны с `sourceProjectPath` и разобраны на
    общие причины до расширения спецификации.

### Task 6: Перенести точный `!xml/invalid` до resolver metadata-ссылок

**Files:**

- Modify: `packages/runtime/metadata/helpers/mdObjectRefUuid.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/metadataTargetOccurrences.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/fromYAML.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataSubsystem/fromXMLToYAMLToXML.integration.test.ts`
- Verify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`

**Interfaces:**

- Consumes: исходное YAML-дерево, `XmlAnomalyAnnotations` и точный
  `MetadataTargetOccurrence.location`.
- Produces: неразрешённый UUID сохраняется только при `invalid` на том же
  value/key; аннотированный YAML-ключ восстанавливается через `logicalKey`.
- Preserves: обычный UUID и не-UUID строка продолжают проходить resolver и
  выдавать прежнюю ошибку.

- [ ] **Step 1: Написать RED-тест значения состава подсистемы**

  Разобрать реальный YAML `Состав: [!xml/invalid <uuid>]`, передать `data` и
  `annotations` в `testPropertyFromYAMLToXML` с `MetadataSubsystemRules` и
  ожидать тот же UUID в `xr:Item`. Такой же UUID без тега должен завершиться
  ошибкой «Неизвестный корень».

- [ ] **Step 2: Подтвердить RED**

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration \
    metadata/appliedObjects/metadataSubsystem/fromXMLToYAMLToXML.integration.test.ts \
    -t 'сохраняет неразрешённый UUID состава только с !xml/invalid'
  ```

  Expected: tagged-случай ошибочно доходит до resolver.

- [ ] **Step 3: Заменить эвристику режима на точную аннотацию**

  `importMetadataTargetOccurrencesFromYAML` получает YAML и annotations,
  находит аннотацию value/key по `occurrence.location` и разрешает пропуск
  resolver только для UUID с `invalid`. Для ключа использовать
  `annotation.logicalKey` и записать его обратно через `occurrence.setValue`.
  `fromYAMLToXML.ts` передаёт эти данные и в fused, и в обычный путь.
  Существующий `isXmlImportControlExportContext` сохранить только как узкое
  разрешение для внутреннего экспорта UUID, уже прочитанного из XML: этот
  экспорт идёт до окончательной validation и назначения тега. Обычный sync не
  имеет такого контекста и обязан предъявить точный `!xml/invalid`.

- [ ] **Step 4: Покрыть YAML-ключ `UserVisible`**

  Добавить тест роли с ключом `!xml/invalid <uuid>` и проверить точное имя UUID
  в модели. Тот же ключ без тега должен остаться ошибкой.

- [ ] **Step 5: Получить GREEN и проверить слой**

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit \
    metadata/commonObjects/userVisible/fromYAML.test.ts
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration \
    metadata/appliedObjects/metadataSubsystem/fromXMLToYAMLToXML.integration.test.ts \
    metadata/importFromXml/worker.integration.test.ts
  pnpm --filter @nkdk/runtime exec tsc --noEmit
  pnpm --filter @nkdk/rules exec tsc --noEmit
  pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
  ```

- [ ] **Step 6: Зафиксировать слой**

  ```bash
  git add packages/runtime/metadata/helpers/mdObjectRefUuid.ts \
    packages/runtime/metadata/ruleRuntime/property/metadataTargetOccurrences.ts \
    packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts \
    packages/rules/metadata/commonObjects/userVisible/fromYAML.ts \
    packages/rules/metadata/commonObjects/userVisible/fromYAML.test.ts \
    packages/rules/metadata/appliedObjects/metadataSubsystem/fromXMLToYAMLToXML.integration.test.ts
  git commit -m "fix: :bug: сохранить принятые UUID metadata-ссылок"
  ```

### Task 7: Привязать raw целого item к основному XML-документу

**Files:**

- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts`

**Interfaces:**

- Consumes: raw item с export claim без `documentPath` и `tag`.
- Produces: `PreparedXmlAnomalyBoundary` с `path: "$item"` и
  `documentSelector: ""`.
- Preserves: raw внешнего файла использует `documentPath`, tagged-документ —
  `tag`.

- [ ] **Step 1: Написать и подтвердить RED-тест**

  В существующем тесте whole raw item именованной коллекции проверить
  `{ path: "$item", documentSelector: "" }`.

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration \
    metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts \
    -t 'адресует raw item и его поля'
  ```

  Expected: `$item` не содержит document selector.

- [ ] **Step 2: Назначить selector по общему правилу**

  В `rawItemBoundary` при отсутствии `documentPath` и `tag` вернуть
  `documentSelector: ""`. Остальные две ветки не менять.

- [ ] **Step 3: Получить GREEN и проверить слой**

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration \
    metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts
  pnpm --filter @nkdk/rules exec tsc --noEmit
  pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
  ```

- [ ] **Step 4: Зафиксировать слой**

  ```bash
  git add packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts \
    packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts
  git commit -m "fix: :bug: привязать raw элемента к основному XML"
  ```

### Task 8: Повторить real round-trip и провести независимую проверку

- [ ] **Step 1: Запустить Storekeeper на свежем MCP вне песочницы**

  Использовать чистый отдельный XML-worktree, не изменяя пользовательский
  каталог. Expected: import, validation и sync без ошибок; итоговый XML без
  структурных расхождений.

- [ ] **Step 2: Выполнить обязательные проверки**

  ```bash
  pnpm type-check
  pnpm test
  pnpm test:architecture:rules
  pnpm test:architecture
  pnpm duplicates -- --base 0c879181b23384cfa868d63d0765f455d021f3eb
  git diff --check 0c879181b23384cfa868d63d0765f455d021f3eb
  ```

- [ ] **Step 3: Зафиксировать сведения для reviewer**

  Передать spec, plan, base SHA, worktree, `git status --short`, журнал
  коммитов, результаты полного теста и настоящего round-trip. Reviewer не
  изменяет файлы и возвращает только `VERDICT: APPROVED` либо
  `CHANGES_REQUIRED`.

- [ ] **Step 4: После APPROVED повторить финальные проверки без изменения дерева**

  Если реализация исправляется после review, предыдущий APPROVED недействителен:
  тот же reviewer повторно проверяет весь diff. Завершение PR-цикла не входит в
  этот план.
