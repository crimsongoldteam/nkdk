# ERP Import Remaining Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить четыре оставшиеся причины ошибок ERP XML-import: отрицательные form XML-ID, таблицу `TasksByExecutive`, XML-значение `TextPicture` у `FormCommand` и известную группу из пяти дополнительных колонок `Реквизит1`.

**Architecture:** Общие механизмы runtime получают только нейтральные договоры: `directId` исключает configuration index, а индексный XML-ID может быть отрицательным. Предметные различия остаются в `@nkdk/rules`: таблица задачи, отдельное системное перечисление команды формы и точечный обработчик известной ERP-аномалии; исходные audit-узлы не клонируются.

**Tech Stack:** TypeScript, Vitest, pnpm, XML audit/runtime, configuration index, rules.ts.

**Spec:** `docs/superpowers/specs/2026-08-30-erp-import-remaining-errors-design.md`

## Global Constraints

- Существующие XML-фикстуры не изменять: они являются источником истины.
- Новые правила `fromXML`/`toXML`/`fromYAML`/`toYAML` не вводить; использовать существующие declarative rules.ts и предметные обработчики коллекций.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры общих построителей правил.
- Не добавлять новое применение `!xml`.
- Формовый `AutoCommandBar` с `directId="-1"` не читает и не пишет `xmlId`; табличный `AutoCommandBar` остаётся индексным.
- Новый элемент без snapshot/reference получает только положительный ID; повтор любого ID в одном контейнере остаётся ошибкой.
- `TextPicture` применяется только к `FormCommand`; `Button`, `Popup` и metadata-команды сохраняют `PictureAndText`.
- Из пяти известных колонок ERP в YAML и configuration index сохраняется только первая; остальные четыре покрываются audit и восстанавливаются существующим экспортным правилом.
- `.agents/architecture.md` и `.agents/restrictions.md` не изменять: согласованный дизайн не меняет границы операций.
- Зафиксированная база сравнения и независимого рецензирования: `2b2c5d926`.
- После каждого законченного слоя запускать `pnpm duplicates -- --base 2b2c5d926`; перед завершением выполнить все проверки из Task 5.

---

### Task 1: Разделить постоянный `directId` и индексный XML-ID

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/ruleFactory.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`

**Interfaces:**
- Consumes: существующий `directId?: string` в `defineElementAsType` и `createSingletonElementYAMLToXMLNestedRule`.
- Produces: `importSingleFormElementFromXMLToYAML(..., directId?: string)`; отсутствие `directId` означает индексную identity, наличие — постоянный ID правила без чтения/записи configuration index.

- [ ] **Step 1: Зафиксировать падающие unit-тесты назначения ID**

Расширить `formXmlIdAssignment.test.ts`: в таблице приоритетов заменить строку «специальный ID» на случай, где snapshot=`11`, reference=`22`, special=`-1`, expected=`-1`; добавить отдельные случаи snapshot=`-4` и reference=`-6`; параметризовать проверку повторов значениями `1` и `-4`; оставить проверку нового свободного ID=`1`.

```ts
it.each([
  ["отрицательный ID снимка", "-4", undefined, "-4"],
  ["отрицательный ID целевого XML", undefined, "-6", "-6"],
] as const)("сохраняет %s", (_case, snapshotId, referenceId, expected) => {
  // зарегистрировать обычный элемент без specialId и проверить node._id
})

it.each(["1", "-4"])("отклоняет повторный ID %s внутри одного XML-контейнера", (id) => {
  // две разные logicalAddress с одинаковым xmlId должны бросить ошибку
})
```

- [ ] **Step 2: Запустить unit-тест и увидеть RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts`

Expected: FAIL на отрицательном индексном ID и на приоритете `directId`.

- [ ] **Step 3: Реализовать происхождение ID вместо проверки знака**

В `assignFormXmlIds` назначать постоянный ID раньше snapshot/reference и проверять единым целочисленным шаблоном как положительные, так и отрицательные значения:

```ts
candidate.id = candidate.reservation.specialId ?? snapshotId ?? referenceId

function isXmlId(value: string): boolean {
  return /^(?:0|[1-9]\d*|-[1-9]\d*)$/.test(value)
}
```

`reserve` должен регистрировать отрицательные ID в `occupied`, поэтому повтор `-4` диагностируется так же, как повтор `1`. Генератор свободных ID не менять: он перебирает `1`, `2`, ... .

- [ ] **Step 4: Зафиксировать RED для configuration index одиночных элементов**

В `fromYAMLToXML.integration.test.ts` изменить существующий тест обязательных одиночных элементов: ожидать отсутствие адреса `ФормаКоманднаяПанель` в собранных identities, сохранив `_id: "-1"`; дополнить/усилить `fromXMLToYAML.integration.test.ts`, чтобы импорт формы с формовым `AutoCommandBar id="-1"` не публиковал его identity, а вложенный табличный `AutoCommandBar id="17"` публиковал `xmlId="17"`.

- [ ] **Step 5: Запустить интеграционные тесты и увидеть RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`

Expected: FAIL, потому что singleton runtime всегда требует/собирает `xmlId`.

- [ ] **Step 6: Провести `directId` через общий singleton-механизм**

В `ruleFactory.ts`:

```ts
const indexedIdentity = params.directId === undefined

return {
  kind: "item",
  ...(indexedIdentity ? { requiredIdentity: "xmlId" as const } : {}),
  // ...
  transformOutput: (...) => {
    const indexedId = indexedIdentity ? resolveFormElementXMLId(context) : undefined
    const result = { _name: ..., _id: params.directId ?? existingId ?? indexedId ?? "", ...properties }
    registerFormXmlIdReservation(transformed, {
      ...(indexedIdentity && runtime !== undefined ? { runtime } : {}),
      space: "elements",
      ...(params.directId === undefined ? {} : { specialId: params.directId }),
    })
  },
}
```

Передать `directId` из `defineElementAsType` в `importSingleFormElementFromXMLToYAML`. В `fromXMLToYAML.ts` добавить `directId?: string` в параметры и вызывать `collectConfigurationIndexIdentityFromXML` только при `directId === undefined`. Имя `AutoCommandBar` в runtime не использовать.

- [ ] **Step 7: Получить GREEN и проверить слой**

Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts`

Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`

Run: `pnpm duplicates -- --base 2b2c5d926`

Expected: PASS; новых дублей нет.

- [ ] **Step 8: Commit**

```bash
git add packages/runtime/metadata/ruleRuntime/formElement/ruleFactory.ts packages/runtime/metadata/ruleRuntime/formElement/fromXMLToYAML.ts packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.ts packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
git commit -m "fix: :bug: сохранить индексные отрицательные ID форм"
```

### Task 2: Добавить виртуальную таблицу задачи по исполнителю

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/metadataTarget/roots.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataTargets/parse.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/dataTableRules.ts`
- Modify: `packages/rules/metadata/appliedObjects/dataTableRules.test.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.integration.test.ts`

**Interfaces:**
- Consumes: `virtualDataTableToYAML`/`virtualDataTableFromYAML`, `collectAppliedObjectDataTables`.
- Produces: симметричное отображение `TasksByExecutive ↔ ЗадачиПоИсполнителю` и декларацию `Task.<name>.TasksByExecutive`.

- [ ] **Step 1: Добавить падающие проверки перевода и декларации**

В `metadataTargets/parse.test.ts` добавить строку:

```ts
["Task.ЗадачаИсполнителя.TasksByExecutive", "Задача.ЗадачаИсполнителя.ЗадачиПоИсполнителю"],
```

В таблице `dataTableRules.test.ts` заменить `['Task', []]` на `['Task', ['TasksByExecutive']]`.

- [ ] **Step 2: Запустить тесты и увидеть RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/commonObjects/metadataTargets/parse.test.ts metadata/appliedObjects/dataTableRules.test.ts`

Expected: FAIL на неизвестном сегменте `TasksByExecutive` и отсутствующей декларации.

- [ ] **Step 3: Реализовать минимальные декларации**

Добавить в `virtualDataTableToYAML`:

```ts
TasksByExecutive: "ЗадачиПоИсполнителю",
```

И добавить в `virtualTables` предметную ветку:

```ts
} else if (physical.root === "Task") {
  names.push("TasksByExecutive")
}
```

- [ ] **Step 4: Защитить договор `MainTable` динамического списка**

В `dynamicList/fromXMLToYAML.integration.test.ts` добавить один round-trip случай с XML `MainTable: "Task.ЗадачаИсполнителя.TasksByExecutive"`; проверить YAML `Задача.ЗадачаИсполнителя.ЗадачиПоИсполнителю` и обратное XML-значение. Это один общий договор для обеих ERP-форм, без фиксации их имён.

- [ ] **Step 5: Получить GREEN и проверить слой**

Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/commonObjects/metadataTargets/parse.test.ts metadata/appliedObjects/dataTableRules.test.ts`

Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/commonObjects/dynamicList/fromXMLToYAML.integration.test.ts`

Run: `pnpm duplicates -- --base 2b2c5d926`

Expected: PASS; новых дублей нет.

- [ ] **Step 6: Commit**

```bash
git add packages/runtime/metadata/ruleRuntime/metadataTarget/roots.ts packages/rules/metadata/commonObjects/metadataTargets/parse.test.ts packages/rules/metadata/appliedObjects/dataTableRules.ts packages/rules/metadata/appliedObjects/dataTableRules.test.ts packages/rules/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.integration.test.ts
git commit -m "feat: :sparkles: добавить таблицу задач по исполнителю"
```

### Task 3: Ввести точное перечисление представления `FormCommand`

**Files:**
- Modify: `packages/rules/metadata/systemEnumerations/types.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formCommand/rules.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formCommand/types.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formCommand/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formCommand/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.integration.test.ts`
- Test existing: `packages/rules/metadata/forms/elements/button/*`
- Test existing: `packages/rules/metadata/forms/elements/popup/*`

**Interfaces:**
- Consumes: `systemEnumerationRule`, исходные `XmlElementNode`, `projectNamedXmlCollectionForImportWithRuntimeKeys` и существующий перенос audit runtime-ключей.
- Produces: `FormCommandButtonRepresentation` с XML `TextPicture` и YAML `КартинкаИТекст`; остальные владельцы продолжают использовать `ButtonRepresentation`/`PictureAndText`.

- [ ] **Step 1: Добавить RED для точного XML-договора команды формы**

В `fromXMLToYAML.integration.test.ts` добавить XML-команду с `<Representation>TextPicture</Representation>`, заголовком `ru`+`tr` и подсказкой `ru`+`tr`. Проверить:

```ts
expect(yaml).toHaveProperty("Значение.Команда.ОтображениеКнопки", "КартинкаИТекст")
expect(serializeYAMLDocument(yaml, annotations).text).toContain("tr:")
expect(audit.rawCandidates()).toEqual([])
expect(restoredXml).toContain("<Representation>TextPicture</Representation>")
```

Существующий случай `controlExport.integration.test.ts`, уже добавленный в рабочем дереве, оставить как проверку привязки двух свёрнутых заголовков к разным исходным командам; дополнить его `TextPicture` и утверждением, что секция `Команды` не превращается в raw.

- [ ] **Step 2: Запустить целевые тесты и увидеть RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/commonObjects/formCommand/fromXMLToYAML.integration.test.ts metadata/importFromXml/controlExport.integration.test.ts`

Expected: FAIL: `TextPicture` требует ручной подмены, а клонированный `XmlElementNode` не принадлежит audit-сеансу.

- [ ] **Step 3: Добавить отдельное системное перечисление**

Рядом с `ButtonRepresentation` объявить:

```ts
export const FormCommandButtonRepresentationToYAML = {
  Auto: "Авто",
  Picture: "Картинка",
  TextPicture: "КартинкаИТекст",
  Text: "Текст",
} as const

export const FormCommandButtonRepresentationFromYAML = {
  Авто: "Auto",
  Картинка: "Picture",
  КартинкаИТекст: "TextPicture",
  Текст: "Text",
} as const
```

Добавить типы и запись `FormCommandButtonRepresentation` в `SystemEnumerationTypeMap`. В `FormCommandRules.representation` заменить только `typeSE` на новый тип. В `FormCommandXML` использовать новый XML-тип.

- [ ] **Step 4: Удалить compatibility-клонирование**

В `formCommand/fromXMLToYAML.ts` сохранить логику исходных `commandNodes`, runtime-ключей, `rekeyYamlPath` и `collector.acceptItem`, но передавать в `importMetadataItemFromXMLToYAML` исходный `itemXmlNode` и `xmlNodes: [itemXmlNode]`. Полностью удалить `normalizeFormCommandXmlNode` и `normalizeFormCommandCompatibility`.

В `formCommand/types.ts` удалить ручное преобразование `PictureAndText → TextPicture` из `mapItemOutput`: новое системное перечисление уже выдаёт точное XML-значение.

- [ ] **Step 5: Получить GREEN и проверить соседние договоры**

Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/commonObjects/formCommand/fromXMLToYAML.integration.test.ts metadata/importFromXml/controlExport.integration.test.ts`

Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/forms/elements/button metadata/forms/elements/popup metadata/appliedObjects/metadataCommand metadata/commonObjects/metadataCommand`

Run: `pnpm duplicates -- --base 2b2c5d926`

Expected: FormCommand восстанавливает `TextPicture`; Button/Popup/metadata-команды по-прежнему восстанавливают `PictureAndText`; новых дублей нет.

- [ ] **Step 6: Commit**

```bash
git add packages/rules/metadata/systemEnumerations/types.ts packages/rules/metadata/forms/commonObjects/formCommand/rules.ts packages/rules/metadata/forms/commonObjects/formCommand/types.ts packages/rules/metadata/forms/commonObjects/formCommand/fromXMLToYAML.ts packages/rules/metadata/forms/commonObjects/formCommand/fromXMLToYAML.integration.test.ts packages/rules/metadata/importFromXml/controlExport.integration.test.ts
git commit -m "fix: :bug: сохранить TextPicture команд формы"
```

### Task 4: Свернуть известные повторные дополнительные колонки ERP

**Files:**
- Modify: `packages/runtime/metadata/context/types.ts`
- Modify: `packages/rules/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/rules/metadata/forms/knownAnomalies.ts`
- Modify: `packages/rules/metadata/forms/knownAnomalies.test.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formAttribute/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formAttribute/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts`

**Interfaces:**
- Consumes: `XmlImportFromXMLConfigurationContext`, `xmlElementChildren`, `XmlImportAuditSession.claim`/`claimStructuralSubtree`, существующий `restoreKnownDuplicateErpAdditionalColumns`.
- Produces: `fromXML.currentXMLPath?: string` и `collapseKnownDuplicateErpAdditionalColumns(...)`, возвращающий первую колонку и четыре audit-узла только при точном совпадении пути/таблицы/имени/количества.

- [ ] **Step 1: Добавить unit-тесты распознавания входной аномалии**

В `knownAnomalies.ts` объявить планируемый интерфейс:

```ts
export function collapseKnownDuplicateErpAdditionalColumns<T>(params: {
  currentXMLPath: string | undefined
  table: string
  columns: readonly T[]
  columnName(column: T): string | undefined
}): { first: T; omitted: readonly T[] } | undefined
```

В `knownAnomalies.test.ts` сначала проверить RED: точный путь, `Список.Способы`, ровно пять `Реквизит1` возвращают первый+четыре; другой путь, таблица, имя, четыре или шесть колонок возвращают `undefined`.

- [ ] **Step 2: Запустить unit-тест и увидеть RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/forms/knownAnomalies.test.ts`

Expected: FAIL, функция ещё не реализована.

- [ ] **Step 3: Реализовать чистое точечное распознавание**

Переиспользовать `isKnownXMLPath`; не проверять ID или содержимое типа, потому что согласованный ключ аномалии — путь+таблица+имя+количество. Функция не меняет XML-узлы и не знает про audit.

- [ ] **Step 4: Провести абсолютный путь Form.xml до предметного импортёра**

Добавить `currentXMLPath?: string` в `XmlImportFromXMLConfigurationContext`. В ветке формы `prepareYaml.ts` создать локальный контекст:

```ts
const formImportContext = {
  ...importContext,
  fromXML: {
    ...importContext.fromXML,
    ...(bodyInput?.input.sourcePath === undefined ? {} : { currentXMLPath: bodyInput.input.sourcePath }),
  },
}
```

Передать его только в `importClientApplicationFormFromXMLToYAML`. Runtime лишь переносит путь источника; ERP-путь проверяется только в `knownAnomalies.ts`.

- [ ] **Step 5: Добавить интеграционный RED для YAML, index и audit**

В `formAttribute/fromXMLToYAML.integration.test.ts` построить исходный XML с `AdditionalColumns table="Список.Способы"` и пятью `Column name="Реквизит1" id="1"..."5"`; использовать контекст с абсолютным `.../Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml`. Проверить:

```ts
expect(yaml).toHaveProperty("Значение.Объект.ДополнительныеКолонки.Список.Способы.Реквизит1")
expect(/* keys колонок */).toEqual(["Реквизит1"])
expect(/* identities этой группы */).toEqual([
  expect.objectContaining({ logicalAddress: expect.stringContaining("Колонка.Реквизит1"), xmlId: "1" }),
])
audit.finalize()
expect(/* outcomes четырёх omitted Column subtree */).not.toContainEqual(expect.objectContaining({ state: "unknown" }))
```

Добавить соседний случай с четырьмя колонками или другим путём и проверить, что действует общий механизм повторных runtime-ключей, то есть исключение не активируется.

- [ ] **Step 6: Реализовать сворачивание до записи identities**

В `importAdditionalColumnsFromXMLToYAML` перед вызовом `importColumnsFromXMLToYAML` сопоставить compatibility columns и `XmlElementNode[]`, вызвать чистый helper и передать в обычный импорт только первую колонку/узел. Для четырёх omitted узлов построить boundary первой канонической колонки:

```ts
const boundary = {
  itemType: FormAttributeColumnRules.itemType,
  yamlPath: [...params.traversal.yamlPath, table, "Реквизит1"],
  rulePath: enterNestedYamlRule(..., FormAttributeColumnRules.itemType).rulePath,
}
for (const node of omittedNodes) {
  params.traversal.audit?.claim(node, boundary)
  params.traversal.audit?.claimStructuralSubtree(node, boundary)
}
```

Так только первая колонка дойдёт до `collector.setIdentity`; остальные не создадут YAML-ключей и index entries. Если helper вернул `undefined`, передать всю исходную коллекцию без изменений.

- [ ] **Step 7: Защитить обратное восстановление пяти ID**

В существующем тесте `fromYAMLToXML.integration.test.ts` для `Список.Способы` передать `currentXMLPath` известной формы и усилить ожидание: экспорт содержит пять `Column name="Реквизит1"` с `_id` `1`–`5`. Экспортный helper не переписывать, кроме общей переиспользуемой проверки пути при необходимости.

- [ ] **Step 8: Получить GREEN и проверить слой**

Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/forms/knownAnomalies.test.ts`

Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/commonObjects/formAttribute/fromXMLToYAML.integration.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts`

Run: `pnpm duplicates -- --base 2b2c5d926`

Expected: точная группа даёт одну колонку/identity и полностью покрытый audit; соседние варианты не сворачиваются; экспорт возвращает ID 1–5; новых дублей нет.

- [ ] **Step 9: Commit**

```bash
git add packages/runtime/metadata/context/types.ts packages/rules/metadata/importFromXml/prepareYaml.ts packages/rules/metadata/forms/knownAnomalies.ts packages/rules/metadata/forms/knownAnomalies.test.ts packages/rules/metadata/forms/commonObjects/formAttribute/fromXMLToYAML.ts packages/rules/metadata/forms/commonObjects/formAttribute/fromXMLToYAML.integration.test.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts
git commit -m "fix: :bug: свернуть повторные колонки ERP при импорте"
```

### Task 5: Полная проверка и независимое рецензирование

**Files:**
- Verify only: весь diff от `2b2c5d926` и незакоммиченные/неотслеживаемые файлы реализации.

**Interfaces:**
- Consumes: завершённые Tasks 1–4 и утверждённую спецификацию.
- Produces: зелёный полный набор проверок, ERP-import без исходных 14 ошибок и verdict независимого рецензента `APPROVED`.

- [ ] **Step 1: Проверить типы и полный набор тестов**

Run: `pnpm type-check`

Run outside sandbox: `pnpm test`

Expected: PASS.

- [ ] **Step 2: Проверить дубли и архитектуру**

Run: `pnpm duplicates -- --base 2b2c5d926`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Expected: PASS; новых дублей и нарушений направленности зависимостей нет.

- [ ] **Step 3: Повторить ERP round-trip-yaml**

Из корня worktree запустить skill-команду с абсолютным XML-каталогом:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/erp \
  ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: отсутствуют 10 ошибок отрицательных ID, 2 ошибки `TasksByExecutive`, orphan-аннотация команды формы и конфликт `logicalAddress` колонок. Если импорт проходит дальше и показывает новые XML-diff, сохранить их как отдельный результат, не расширяя текущую реализацию.

- [ ] **Step 4: Проверить чистоту и состав изменений**

Run: `git status --short`

Run: `git diff 2b2c5d926 --stat`

Run: `git diff 2b2c5d926 --check`

Expected: только файлы Tasks 1–4 и плановые тесты; нет пробельных ошибок и случайных XML-фикстур.

- [ ] **Step 5: Передать полный результат одному независимому рецензенту**

Сообщить рецензенту:

```text
Spec: docs/superpowers/specs/2026-08-30-erp-import-remaining-errors-design.md
Plan: docs/superpowers/plans/2026-08-30-erp-import-remaining-errors.md
Base SHA: 2b2c5d926
Worktree: /Users/nikita/git/nkdk/.worktrees/fix-form-command-raw-anchors
```

Рецензент читает оба документа и весь committed/staged/unstaged/untracked diff от base, ничего не редактирует и возвращает только договор `VERDICT / Findings / Verification gaps` из `executing-plans-with-review`.

- [ ] **Step 6: Закрыть все замечания тем же рецензентом**

При `CHANGES_REQUIRED` исправить каждое замечание как основной исполнитель, повторить затронутые и полные проверки, затем отдать обновлённый полный diff тому же рецензенту. Повторять до `VERDICT: APPROVED`.

- [ ] **Step 7: Финальная проверка неизменённого одобренного дерева**

После `APPROVED` повторить `pnpm type-check`, `pnpm test`, `pnpm duplicates -- --base 2b2c5d926`, `pnpm test:architecture:rules`, `pnpm test:architecture` и `git diff 2b2c5d926 --check`. Если любая команда меняет файлы, одобрение аннулируется и результат снова передаётся рецензенту.

## Self-Review Result

- Все четыре причины из спецификации имеют отдельный TDD-цикл и проверку соседних договоров.
- `directId` остаётся общим признаком без знания `AutoCommandBar`; ERP-путь остаётся в предметном `knownAnomalies.ts`.
- План не вводит новые поля правил, новые `!xml`, новые XML-фикстуры или изменения архитектурной документации.
- Сигнатуры `directId`, `FormCommandButtonRepresentation`, `currentXMLPath` и `collapseKnownDuplicateErpAdditionalColumns` согласованы между задачами.
- Незакоммиченные изменения `formCommand/fromXMLToYAML.ts` и `controlExport.integration.test.ts` явно включены в Task 3 и должны быть исправлены, а не отброшены.
