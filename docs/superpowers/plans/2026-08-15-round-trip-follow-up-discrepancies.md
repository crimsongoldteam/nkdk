# Round-trip follow-up discrepancies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task without subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать три согласованных договора из спецификации следующих расхождений: перенос `v8:TypeId`, рекурсивное эффективное имя одиночных элементов формы и корректную сериализацию всех скалярных `!xml/*`.

**Architecture:** Каждый договор подключается через существующую общую границу: `TypeDescription`, общий конвейер одиночного вложенного элемента и YAML-сериализатор. Нейтральные слои получают только общие данные или обратные вызовы; условия по конфигурациям и именам элементов остаются в `@nkdk/rules`.

**Tech Stack:** TypeScript, TypeBox, js-yaml, Vitest, pnpm, XML/YAML round-trip через `round-trip-yaml`.

## Global Constraints

- Исходные XML-фикстуры не изменять.
- Не добавлять новые поля в `BasePropertyRule`, `PropertyRule` и параметры построителей `rules.ts`.
- Не добавлять в нейтральные слои условия по `itemType`, русским YAML-ключам, XML-корням или именам конфигураций.
- `!xml/reference` в `TypeDescription` не разрешать через индекс и не включать в поиск или переименование.
- Раздел 4 спецификации про известный вид элемента в запрещённой коллекции отложен и не входит в этот план. Не изменять код, tests или реестр XML-аномалий для `Вид: !xml/type ПолеРисунка`; соответствующие конфигурации не запускать в итоговом round-trip.
- Все изменения production-кода выполнять по TDD: сначала целевой тест и подтверждённый RED, затем минимальный GREEN.
- После каждого слоя запускать `pnpm duplicates -- --base ce05b4f9e`.
- `pnpm --filter @nkdk/rules test:native`, `pnpm test:e2e` и `pnpm test` запускать вне песочницы.
- Исходный `pnpm test` на `ce05b4f9e` прошёл все утверждения, но контроль длительности дважды вернул код 1; завершение требует нового полного прогона без функциональных ошибок и без превышения блокирующего лимита.
- Реализацию выполнять без субагентов.

---

### Task 1: Представить `v8:TypeId` как `!xml/reference` внутри `TypeDescription`

**Files:**
- Modify: `packages/rules/metadata/commonObjects/typeDescription/types.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/toJSONSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/__fixtures__/data.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/parseYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/fromYAML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/toYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataAttribute/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/validation/projectFileSchema.integration.test.ts`
- Modify: `.agents/xml-anomalies.md`

**Interfaces:**
- Consumes: `yamlScalarTagAt`, `markYAMLScalarTag`, `taggedYAMLScalar`, `xmlAnomalyTagPayload`, `xmlAnomalyTagValue` из `@nkdk/runtime`.
- Produces: `TypeDescriptionYAML`, состоящий только из одиночного скаляра или списка скаляров; `typeId` остаётся отдельным внутренним массивом модели и восстанавливается в `v8:TypeId` существующим `toXML.ts`.

- [ ] **Step 1: Записать RED-проверки импорта и экспорта одиночного, множественного и смешанного `TypeId`**

  В `fromYAML.integration.test.ts` добавить проверки настоящего тега и отказов:

  ```ts
  const yaml = { Тип: xmlAnomalyTagValue("xml/reference", uuid) }
  markYAMLScalarTag(yaml, "Тип", "xml/reference")
  expect(importTaggedTypeDescriptionFromYAML({ context, rule, yaml, value: yaml.Тип }))
    .toEqual({ type: [], typeId: [uuid] })

  const mixed = { Тип: ["Строка", xmlAnomalyTagValue("xml/reference", uuid)] }
  markYAMLScalarTag(mixed.Тип, 1, "xml/reference")
  expect(importTaggedTypeDescriptionFromYAML({ context, rule, yaml: mixed, value: mixed.Тип }))
    .toEqual({ type: ["string"], typeId: [uuid] })
  ```

  Отдельно закрепить ошибки для нетегированного UUID, неверного UUID, `!xml/type` с UUID и прежнего объекта `ИдентификаторТипа`.

  В `toYAML.test.ts` добавить литеральные ожидания одиночной и смешанной формы и проверить `yamlScalarTagAt`.

- [ ] **Step 2: Подтвердить RED на узких тестах `TypeDescription`**

  Run:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --project unit metadata/commonObjects/typeDescription/parseYAML.test.ts metadata/commonObjects/typeDescription/toYAML.test.ts
  pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/typeDescription/fromYAML.integration.test.ts
  ```

  Expected: FAIL — объектная форма пока принимается, `!xml/reference` пока разбирается как обычный тип, а `toYAML` возвращает `ИдентификаторТипа`.

- [ ] **Step 3: Реализовать единый разбор элементов описания типа**

  В `fromYAML.ts` заменить отдельную объектную ветку обходом скаляра или списка, который различает настоящий служебный тег:

  ```ts
  type ParsedYAMLTypeItem =
    | { kind: "type"; value: string; taggedPrefix: boolean }
    | { kind: "typeId"; value: string }

  function parseYAMLTypeItem(parent: object, key: string | number, value: unknown): ParsedYAMLTypeItem {
    const tag = yamlScalarTagAt(parent, key)
    if (tag === "xml/reference") {
      const uuid = xmlAnomalyTagPayload("xml/reference", requireString(value))
      if (!UUID_PATTERN.test(uuid)) throw new Error("Тип: после !xml/reference ожидается UUID")
      return { kind: "typeId", value: uuid }
    }
    if (tag !== undefined && tag !== "xml/type") throw new Error(`Тип: недопустим тег !${tag}`)
    return { kind: "type", value: requireString(value), taggedPrefix: tag === "xml/type" }
  }
  ```

  Одиночное свойство читать с тегом его владельца, список — с тегом каждого индекса. Нетегированный UUID отклонять до обычного разбора типа. Удалить поддержку `ИдентификаторТипа` из входного YAML, но сохранить `typeId` во внутреннем `TypeDescription`.

- [ ] **Step 4: Сформировать канонический YAML из объединённой последовательности**

  В `toYAML.ts` сначала получить обычные YAML-типы, затем добавить каждый `typeId` как:

  ```ts
  taggedYAMLScalar("xml/reference", xmlAnomalyTagValue("xml/reference", uuid))
  ```

  Для одного результата вернуть скаляр, для нескольких — массив и перенести на него точные теги. Порядок YAML должен быть: обычные типы, затем `typeId`, что совпадает с порядком XML в существующем `toXML.ts`.

- [ ] **Step 5: Удалить объектную форму из типов и добавить внутреннюю схему `!xml/reference`**

  В `types.ts` убрать `TypeDescriptionTypeIdYAML` и объектную ветку `TypeDescriptionJSONSchema`.

  В `toJSONSchema.ts` добавить строгий шаблон:

  ```ts
  const xmlTypeId = Type.String({
    pattern: "^!xml/reference [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
  })
  ```

  Включать его как одиночный вариант и элемент составного списка только во внутренней validation-схеме. Внешняя схема должна продолжать отклонять все `!xml/*`.

- [ ] **Step 6: Обновить интеграционные договоры и реестр аномалий**

  Заменить проверки объектной формы в `metadataAttribute/fromYAMLToXML.integration.test.ts` и `projectFileSchema.integration.test.ts` на `!xml/reference`. В `.agents/xml-anomalies.md` добавить строку для `TypeDescription.Тип` и `v8:TypeId`, явно указав исключение из поиска и переименования.

- [ ] **Step 7: Получить GREEN и проверить слой**

  Run:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --project unit metadata/commonObjects/typeDescription/parseYAML.test.ts metadata/commonObjects/typeDescription/toYAML.test.ts metadata/commonObjects/typeDescription/toJSONSchema.test.ts
  pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/typeDescription/fromYAML.integration.test.ts metadata/commonObjects/metadataAttribute/fromYAMLToXML.integration.test.ts metadata/validation/projectFileSchema.integration.test.ts
  pnpm --filter @nkdk/rules type-check
  pnpm duplicates -- --base ce05b4f9e
  ```

  Expected: PASS; новых дублей нет.

- [ ] **Step 8: Закоммитить слой**

  ```bash
  git add .agents/xml-anomalies.md packages/rules/metadata/commonObjects/typeDescription packages/rules/metadata/commonObjects/metadataAttribute/fromYAMLToXML.integration.test.ts packages/rules/metadata/validation/projectFileSchema.integration.test.ts
  git commit -m "fix: :bug: сохранить TypeId в описании типа"
  ```

---

### Task 2: Вычислять имя одиночного элемента до преобразования его потомков

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/ruleFactory.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`

**Interfaces:**
- Consumes: `readExplicitElementXMLName` и существующий канонический `toXML({ context }).name`.
- Produces: общий `YAMLToXMLNestedRule` вида `item` с `resolveItemName`; одно вычисленное имя передаётся контексту потомков и итоговому XML.

- [ ] **Step 1: Добавить RED-тест общего конвейера на имя родителя, видимое ребёнку**

  В `packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts` зарегистрировать два вложенных правила: родитель получает `!xml/name СтарыйРодитель`, а дочерний обработчик строит имя из последнего элемента `context.exportToXML.itemsTree`. Литеральное ожидание:

  ```ts
  expect(result.outputs.get("owner")).toEqual({
    Parent: {
      Name: "СтарыйРодитель",
      Child: { Name: "СтарыйРодительРебёнок" },
    },
  })
  ```

  Тест должен падать с каноническим именем ребёнка.

- [ ] **Step 2: Добавить RED-регрессию формы Conversion**

  Расширить тест `восстанавливает имена подсказок вложенных дополнений таблицы без reference XML`: заменить имя одного дополнения на `СвязиНеУдаленныхСтрокаПоиска`, выполнить XML → YAML → XML и ожидать у вложенных элементов имена, вычисленные именно от него. Отдельный собственный `!xml/name` ребёнка должен иметь приоритет только для ребёнка.

- [ ] **Step 3: Подтвердить оба RED**

  Run:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --project unit metadata/ruleRuntime/property/fromYAMLToXML.test.ts
  pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
  ```

  Expected: FAIL — контекст ребёнка содержит каноническое имя, вычисленное до чтения `!xml/name`.

- [ ] **Step 4: Расширить общий договор вложенного одиночного элемента**

  В `fromYAMLToXMLTypes.ts` добавить к ветке `kind: "item"`:

  ```ts
  readonly resolveItemName?: (params: {
    context: ConfigurationContextWithExportToXML
    yaml: unknown
    ownerName: string | undefined
    propertyRule: PropertyRule
  }) => string | undefined
  ```

  Параметры `resolveItemContext` и `transformOutput` дополнить уже вычисленным `itemName`, чтобы обработчики не читали YAML повторно.

- [ ] **Step 5: Переставить стадии общего преобразования**

  В `fromYAMLToXML.ts` получить `nestedYAML` до `resolveItemContext`, один раз вызвать `resolveItemName`, затем:

  ```ts
  const itemName = effectiveNestedRule.resolveItemName?.({
    context: nestedContext,
    yaml: nestedYAML,
    ownerName: params.name,
    propertyRule: planned.propertyRule,
  })
  ```

  Передать `itemName` в `resolveItemContext`, использовать его как `sourceItemName` при преобразовании потомков и передать тому же `transformOutput`. `resolveContext` оставить на каноническом адресе singleton, чтобы `xmlId` не зависел от аномального имени.

- [ ] **Step 6: Подключить эффективное имя во всех singleton через фабрику**

  В `createSingletonElementYAMLToXMLNestedRule` определить:

  ```ts
  resolveItemName: ({ context, yaml }) =>
    (params.nameStyle?.explicitXMLName === true ? readExplicitElementXMLName(yaml) : undefined)
    ?? params.toXML({ context }).name
  ```

  `resolveItemContext` должен добавить в `itemsTree` полученное `itemName`, а `transformOutput` использовать то же значение для `_name`. Повторный независимый расчёт имени после обработки детей удалить.

- [ ] **Step 7: Получить GREEN и проверить слой**

  Run:

  ```bash
  pnpm --filter @nkdk/runtime type-check
  pnpm --filter @nkdk/rules exec vitest run --project unit metadata/ruleRuntime/property/fromYAMLToXML.test.ts
  pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
  pnpm --filter @nkdk/rules type-check
  pnpm duplicates -- --base ce05b4f9e
  ```

  Expected: PASS; имена XML и контекста потомков совпадают.

- [ ] **Step 8: Закоммитить слой**

  ```bash
  git add packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts packages/runtime/metadata/ruleRuntime/formElement/ruleFactory.ts packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
  git commit -m "fix: :bug: передать фактическое имя вложенным элементам"
  ```

---

### Task 3: Сериализовать тегированный скаляр до подготовки явных строк

**Files:**
- Modify: `packages/runtime/yaml/export.ts`
- Modify: `packages/runtime/yaml/export.test.ts`

**Interfaces:**
- Consumes: `yamlScalarTagAt`, `isXMLAnomalyTag`, `taggedScalarForDump`.
- Produces: `serializeYAMLDocument`, сохраняющий категорию, содержимое, кавычки и служебный признак любого скалярного `!xml/*` в mapping и sequence.

- [ ] **Step 1: Добавить RED-таблицу содержимого, требующего кавычек**

  В `export.test.ts` добавить один `it.each` для представителей:

  ```ts
  [
    ["xml/language", "!xml/language Products marked for SPMS ", '!xml/language "Products marked for SPMS "'],
    ["xml/value", "!xml/value    ", '!xml/value "   "'],
    ["xml/name", "!xml/name 001", '!xml/name "001"'],
    ["xml/duplicate", "!xml/duplicate @text", '!xml/duplicate "@text"'],
  ]
  ```

  Для каждого проверить свойство mapping и элемент sequence, затем повторный `parseMetadataYaml`: данные и `yamlScalarTagAt` должны совпасть с исходными.

- [ ] **Step 2: Подтвердить RED в runtime**

  Run:

  ```bash
  pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/export.test.ts
  ```

  Expected: FAIL с `Значение не соответствует тегу !xml/language` на содержимом с конечным пробелом.

- [ ] **Step 3: Исправить порядок подготовки скаляра**

  В `prepareChildForDump` прочитать тег до `prepareForDump`:

  ```ts
  const tag = yamlScalarTagAt(parent, key)
  if (isXMLAnomalyTag(tag)) {
    return {
      dumpValue: taggedScalarForDump(parent, key, value),
      data: value,
    }
  }
  ```

  Таким образом, представитель `!xml/*` получает исходную упакованную строку и отдаёт `js-yaml` только содержимое. Обычные явные строки и локальные теги `!проверять`/`!изменять` сохраняют существующий путь через маркеры.

- [ ] **Step 4: Получить GREEN и проверить весь runtime YAML**

  Run:

  ```bash
  pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/export.test.ts yaml/jsYamlParser.test.ts yaml/import.test.ts
  pnpm --filter @nkdk/runtime type-check
  pnpm duplicates -- --base ce05b4f9e
  ```

  Expected: PASS; все категории сохраняют точное содержимое.

- [ ] **Step 5: Закоммитить слой**

  ```bash
  git add packages/runtime/yaml/export.ts packages/runtime/yaml/export.test.ts
  git commit -m "fix: :bug: сохранить кавычки содержимого XML-тега"
  ```

---

### Отложено: известный вид формы в запрещённой коллекции

Этот раздел не является задачей текущего плана и не выполняется. Он сохранён
только как прежняя детализация будущей реализации; актуальный договор и статус
зафиксированы в разделе 4 спецификации и в `.agents/restrictions.md`.

<!-- Начало отложенного плана: не выполнять в текущей задаче.

**Files:**
- Create: `packages/rules/metadata/forms/commonObjects/childItems/kindResolution.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/validateElementKinds.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/childItems/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/childItems/toJSONSchema.ts`
- Modify: `packages/rules/metadata/forms/elements/collectionRules.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataCollection/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/validation/formContracts.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/validationAdapter.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/validationRules.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/validateElementNames.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formDataPathProjection.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseFormProjection.ts`
- Modify: `packages/rules/metadata/validation/dataPath/formYamlTraversal.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.form.test.ts`
- Modify: `.agents/xml-anomalies.md`

**Interfaces:**
- Consumes: `allowedTypes` коллекции, общий реестр `formElementRules`, `formElementTypeToYAML`, настоящий служебный тег `yamlScalarTagAt(node, "Вид")` и цепочку ближайших владельцев.
- Produces: `resolveFormElementKind`, возвращающий `{ itemType, yamlKind, anomalous }`; один результат используют XML → YAML, YAML → XML, проверка имён, пути данных и остальные индексы.

- [ ] **Step 1: Записать RED импорта запрещённого известного XML-вида**

  В `fromXMLToYAML.test.ts` передать `CommandBarChildItems`, XML `PictureField` и `rulePath`, содержащий ближайший `Table`. Проверить:

  ```ts
  expect(yaml).toEqual({
    ЕстьФайлы: {
      Вид: "!xml/type ПолеРисунка",
      ПутьКДанным: "Список.ЕстьФайлы",
    },
  })
  expect(yamlScalarTagAt((yaml as Record<string, object>).ЕстьФайлы, "Вид")).toBe("xml/type")
  ```

  Обычный разрешённый `Button` должен остаться нетегированным.

- [ ] **Step 2: Записать RED проверки однозначности и полной структуры**

  В `toJSONSchema.test.ts` и `validateElementKinds.ts` покрыть пять границ:

  ```yaml
  Вид: Кнопка                         # разрешён, корректен
  Вид: !xml/type Кнопка               # ошибка: избыточный тег
  Вид: ПолеРисунка                    # ошибка: запрещён без тега
  Вид: !xml/type ПолеРисунка          # корректен, свойства проверяются как TablePictureField
  Вид: !xml/type НесуществующийЭлемент # ошибка: правила отсутствуют
  ```

  Дополнительно проверить, что `Вид: "!xml/type ПолеРисунка"` без настоящего тега отклоняется, а неизвестное свойство внутри корректно тегированного элемента даёт обычную структурную ошибку.

- [ ] **Step 3: Записать RED обратного экспорта и индексации**

  В `fromYAMLToXML.integration.test.ts` собрать таблицу с `ContextMenu.ChildItems.ЕстьФайлы`, где `Вид` имеет настоящий `!xml/type`, и ожидать исходный `<PictureField>` с `DataPath`.

  В `yamlFactExtractor.form.test.ts` проверить, что тот же элемент создаёт обычную проверку пути `Список.ЕстьФайлы` с `elementType: "TablePictureField"` и участвует в сборе имени. Это защищает общий путь индексов, а не отдельное исключение для картинки.

- [ ] **Step 4: Подтвердить RED всего слоя**

  Run:

  ```bash
  pnpm --filter @nkdk/rules exec vitest run --project unit metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts
  pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/forms/clientApplicationForm/toJSONSchema.test.ts metadata/validation/yamlFactExtractor.form.test.ts
  pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts
  ```

  Expected: FAIL — импорт не ставит тег, схема и преобразователь считают упакованный вид неизвестным, обход индекса пропускает элемент.

- [ ] **Step 5: Реализовать предметный распознаватель вида**

  В новом `kindResolution.ts` определить общий для форм результат:

  ```ts
  export interface ResolvedFormElementKind {
    readonly itemType: ElementType
    readonly yamlKind: string
    readonly anomalous: boolean
  }

  export function resolveFormElementKind(params: {
    readonly yamlKind: string
    readonly tagged: boolean
    readonly allowedTypes: readonly string[]
    readonly nearestOwnerTypes: readonly string[]
  }): ResolvedFormElementKind
  ```

  Сначала сопоставлять обычный вид только с `allowedTypes`. Для настоящего `xml/type` рассматривать только глобально известные виды вне `allowedTypes`. При совпадающем русском имени выбирать табличный вариант только при ближайшем владельце `Table`; не определять вид по заполненным свойствам. Отсутствие или неоднозначность правила завершать предметной ошибкой.

  Добавить симметричную функцию для XML-тега, которая сначала ищет разрешённый вид, затем глобальный известный вид с тем же контекстом владельца и сообщает `anomalous: true`.

- [ ] **Step 6: Подключить распознаватель к XML → YAML**

  В `fromXMLToYAML.ts` заменить частную таблицу выбора единым распознавателем. Цепочку владельцев брать из `traversal.rulePath`. После обычного импорта свойств ставить тег только для `anomalous`:

  ```ts
  const treeItem = { Вид: resolved.yamlKind, ...treeProperties }
  if (resolved.anomalous) {
    treeItem.Вид = xmlAnomalyTagValue("xml/type", resolved.yamlKind)
    markYAMLScalarTag(treeItem, "Вид", "xml/type")
  }
  ```

- [ ] **Step 7: Подключить распознаватель к YAML → XML без частных правил**

  Расширить параметры `resolveItemRule` коллекции общим контекстом владельцев. `createFormElementCollectionNestedRule` должен получать из `collectionRules.ts` предметный обратный вызов, возвращающий `itemType`; сам runtime только выбирает соответствующий `elementRules[itemType]`.

  В `metadataCollection/fromYAMLToXML.ts` передавать `context.exportToXML.itemsTree.map(item => item.itemType)` при выборе правила. Нормализация удаляет `Вид`, но копирует остальные служебные теги. Выбранные обычные rules создают XML и регистрируют `xmlId` прежним путём.

- [ ] **Step 8: Расширить внутреннюю JSON Schema полной схемой тегированного вида**

  В `childItems/toJSONSchema.ts` оставить обычный `oneOf` только для разрешённых видов. Во внутренней validation-схеме добавить `anyOf` глобально известных запрещённых видов; каждый вариант строить через `exportElementRuleToJSONSchema`, заменяя литерал различителя на точное упакованное значение:

  ```ts
  Вид: Type.Literal(xmlAnomalyTagValue("xml/type", yamlKind))
  ```

  Если одному YAML-виду соответствуют обычный и табличный варианты, `anyOf` содержит обе полные схемы. Внешняя редакторская схема тегированные ветви не содержит. Наличие настоящего служебного тега проверяется следующим шагом, потому что JSON Schema видит только данные.

- [ ] **Step 9: Добавить смысловую проверку тега и единый обход индексов**

  В `validateElementKinds.ts` рекурсивно обходить коллекции по их `PropertyRule`, получать `tagged` только через `yamlScalarTagAt(element, "Вид")` и вызывать общий распознаватель. Ошибки привязывать к пути `[..., имя, "Вид"]`. Зарегистрировать проверку в `validationRules.ts` как `localYamlValue`.

  Для каждого корректно тегированного элемента дополнительно проверить весь
  YAML-объект по схеме именно выбранного `itemType`, а не по объединению
  одноимённых вариантов. Скомпилированную схему кэшировать по `itemType` и
  версии контекста, а пути её ошибок дополнять путём элемента. Благодаря этому
  табличные свойства не будут ошибочно приниматься у обычного варианта с тем же
  русским `Вид`.

  Изменить `FormValidationAdapter.elementTypeFromYAML` так, чтобы он получал сам YAML-элемент и проверенный служебный тег, а не распознавал строку по префиксу. Передать выбранный тип в существующие обходы `yamlFactExtractor`, `formYamlTraversal`, проверки имён, индекс компонентов и проекцию базовой формы. После выбора rules никаких веток «не индексировать» или «не проверять» не добавлять.

- [ ] **Step 10: Обновить реестр XML-аномалий**

  В `.agents/xml-anomalies.md` добавить строку: элемент управляемой формы, известный глобальному реестру, но запрещённый текущей коллекцией; свойство `Вид`; `!xml/type <вид>`; исходный XML-тег элемента. Рядом явно записать, что тег снимает только ограничение коллекции и не исключает элемент из проверки и индексов.

- [ ] **Step 11: Получить GREEN и проверить слой**

  Run:

  ```bash
  pnpm --filter @nkdk/runtime type-check
  pnpm --filter @nkdk/rules exec vitest run --project unit metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts
  pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/forms/clientApplicationForm/toJSONSchema.test.ts metadata/validation/yamlFactExtractor.form.test.ts
  pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts metadata/validation/validateForm.integration.test.ts
  pnpm --filter @nkdk/rules type-check
  pnpm duplicates -- --base ce05b4f9e
  ```

  Expected: PASS; тегированный элемент проверяется и индексируется как `TablePictureField`.

- [ ] **Step 12: Закоммитить слой**

  ```bash
  git add .agents/xml-anomalies.md packages/runtime/metadata packages/rules/metadata/forms packages/rules/metadata/validation
  git commit -m "fix: :bug: сохранить запрещённый вид элемента формы"
  ```

Конец отложенного плана. -->

---

### Task 4: Проверить реальные конфигурации и весь проект

**Files:**
- Modify only if implementation exposed an already specified missing test; do not change XML fixtures or add behavior outside the specification.

**Interfaces:**
- Consumes: commits Tasks 1–3 and source configurations in `/Users/nikita/git/round-trip-compact/cf`.
- Produces: evidence that each fixed discrepancy disappeared; unrelated subsequent round-trip differences remain outside this task.

- [ ] **Step 1: Проверить три класса на реальных конфигурациях**

  Для каждого запуска указывать один каталог, не копировать весь репозиторий:

  ```bash
  env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/Contracts_1_0_7_2_setup1c ./.agents/skills/round-trip-yaml/round-trip.sh
  env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/Conversion_3_1_6_15_setup1c ./.agents/skills/round-trip-yaml/round-trip.sh
  env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/PayDesk_1_0_19_74_setup1c ./.agents/skills/round-trip-yaml/round-trip.sh
  ```

  Между запусками восстанавливать только уже проверенный каталог командой `git -C /Users/nikita/git/round-trip-compact restore -- cf/<имя>`. Подтвердить отсутствие исправленного расхождения; если скрипт остановится на следующем независимом diff, зарегистрировать его как внешний результат и не исправлять в этой задаче.

- [ ] **Step 2: Запустить обязательные проверки архитектуры и типов**

  Run:

  ```bash
  pnpm type-check
  pnpm test:architecture:rules
  pnpm test:architecture
  pnpm duplicates -- --base ce05b4f9e
  ```

  Expected: PASS; архитектурный baseline не изменяется.

- [ ] **Step 3: Запустить полный набор тестов вне песочницы**

  Run:

  ```bash
  pnpm test
  ```

  Expected: PASS. Если утверждения зелёные, но контроль длительности повторяет исходное нестабильное превышение, повторить один раз вне песочницы; повторное блокирующее превышение остановит завершение и будет сообщено пользователю.

- [ ] **Step 4: Проверить чистоту и итоговый diff**

  Run:

  ```bash
  git status --short
  git diff --check ce05b4f9e..HEAD
  git diff --stat ce05b4f9e..HEAD
  ```

  Проверить соответствие первым трём разделам спецификации, сохранение отложенного статуса раздела 4 и отсутствие изменений исходных XML-фикстур.

- [ ] **Step 5: Закоммитить оставшиеся документационные изменения, если они не вошли в предыдущие слои**

  ```bash
  git add docs/superpowers/specs/2026-08-15-round-trip-follow-up-discrepancies-design.md docs/superpowers/plans/2026-08-15-round-trip-follow-up-discrepancies.md .agents/restrictions.md
  git commit -m "docs: :memo: зафиксировать следующие round-trip расхождения"
  ```
