# Round-trip оставшихся расхождений Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать восемь ещё не выполненных договоров объединённой спецификации: пустой `DataPath`, пустые параметры данных, битые UUID-ключи событий, строковый `FillValue`, локальный namespace типа, обычные формы, пустой состав плана обмена и настройки панелей.

**Architecture:** Изменения остаются в конкретных metadata-модулях и существующих общих механизмах: подготовка формы, реестр явно присутствующего XML, зависимый анализ `FillValue`, `TypeDescription`, описание ресурсов формы и правила интерфейса. Нейтральные слои не получают условий по именам объектов или файлов; новые поля общих правил не вводятся, кроме уже согласованного расширения существующего `declareTypeNamespaceXML`.

**Tech Stack:** TypeScript 7, Vitest 4, TypeBox, js-yaml 5, pnpm.

## Global Constraints

- Источник договора: `docs/superpowers/specs/2026-08-15-round-trip-next-discrepancies-design.md`.
- Уже выполненные `Switcher`, `Registered`, прямые битые ссылки и `UserVisible` повторно не менять.
- Исходные XML-фикстуры не изменять; новые тестовые XML создавать строками либо новыми минимальными фикстурами.
- Реализацию выполнять по TDD: сначала отдельный падающий тест, затем минимальное исправление.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей, кроме согласованного изменения типа `declareTypeNamespaceXML`.
- Не добавлять частные условия по конфигурации, имени прикладного объекта или пути файла в нейтральные слои.
- Reference XML не использовать как источник содержимого; он остаётся только источником UUID и согласованного порядка.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base 8fba09946`.
- Реализацию выполнять без субагентов.

---

### Task 1: Подавить пустой DataPath при экспорте формы

**Files:**
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts`

**Interfaces:**
- Consumes: `materializeImplicitFormDataPaths(yaml, context)`.
- Produces: пустой `ПутьКДанным` собственного элемента всегда удаляется из подготовленной копии YAML и не создаёт `<DataPath/>`.

- [x] **Step 1: Add failing unit tests**

Добавить в `formDataPathContext.test.ts` проверки:

```ts
it("удаляет пустой путь собственного элемента без вычислимого кандидата", () => {
  const yaml = { Элементы: { Поле: { Вид: "ПолеВвода", ПутьКДанным: "" } } }
  const context = prepareFormDataPathContextFromYAML({ yaml, ownerCache: catalogOwnerCache() })

  const prepared = materializeImplicitFormDataPaths(yaml, context)

  expect(prepared.Элементы.Поле).not.toHaveProperty("ПутьКДанным")
  expect(yaml.Элементы.Поле).toHaveProperty("ПутьКДанным", "")
})
```

Добавить случай таблицы и колонки с пустыми путями и сохранить существующие проверки отсутствующего и непустого пути.

- [x] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit --project bundle-contract --project core-metadata --sequence.shuffle
```

Expected: FAIL — пустой путь без вычислимого кандидата остаётся в подготовленном YAML.

- [x] **Step 3: Implement the minimal preparation change**

В `materializeImplicitFormDataPaths` для собственного элемента с явно присутствующим пустым значением всегда добавлять изменение `delete`; проверку `candidateYaml` оставить только для материализации отсутствующего пути.

- [x] **Step 4: Add the XML boundary test and verify GREEN**

В `fromYAMLToXML.integration.test.ts` проверить отсутствие `<DataPath/>` у таблицы и колонки при пустом пути таблицы.

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit --project bundle-contract --project core-metadata --sequence.shuffle
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration --sequence.shuffle
pnpm duplicates -- --base 8fba09946
```

- [x] **Step 5: Commit**

```bash
git add packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.ts packages/rules/metadata/forms/clientApplicationForm/formDataPathContext.test.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts docs/superpowers/plans/2026-08-15-round-trip-remaining-discrepancies.md
git commit -m "fix: :bug: подавить пустой DataPath формы"
```

---

### Task 2: Сохранить явно пустые параметры данных

**Files:**
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toJSONSchema.ts`
- Create: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/index.ts`
- Modify or Create: `packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/explicitEmpty.ts`

**Interfaces:**
- Consumes: `explicitXMLPropertyTypes` и существующий `materializeCollection`.
- Produces: тип `SettingsParameterValueCollection` поддерживает пустой `!xml/present` во всех местах применения.

- [x] **Step 1: Add failing XML → YAML and YAML → XML tests**

Проверить три состояния свойства-владельца: отсутствует, `!xml/present`, непустой словарь. Для пустого XML ожидать сериализацию `ПараметрыДанных: !xml/present`; для YAML-маркера — пустой `dcsset:dataParameters`.

- [x] **Step 2: Verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration --sequence.shuffle
```

Expected: FAIL — пустой контейнер сворачивается в отсутствие.

- [x] **Step 3: Register the property type**

Добавить слой `defineMetadataRules`:

```ts
explicitXMLPropertyTypes: {
  SettingsParameterValueCollection: {
    propertyType: "SettingsParameterValueCollection",
    action: "materializeCollection",
    yamlValue: XML_PRESENT_TAG_VALUE,
  },
},
```

Подключить слой через `metadata/composition/metadataRules.ts`. Локальные преобразователи типа сохраняют пустую модель до границы общего реестра и материализуют пустой XML-корень; классификацию и допустимость `!xml/present` определяет общий реестр.

- [x] **Step 4: Cover validation boundaries and verify GREEN**

Проверить JSON Schema: пустой `!xml/present` допустим; `{}`, `!xml/present payload` и другой тег недопустимы.

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration --sequence.shuffle
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit --project bundle-contract --project core-metadata --sequence.shuffle
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 8fba09946
```

- [x] **Step 5: Commit**

```bash
git add packages/rules/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection docs/superpowers/plans/2026-08-15-round-trip-remaining-discrepancies.md
git commit -m "feat: :sparkles: сохранить пустые параметры данных"
```

---

### Task 3: Перенести битые UUID-ключи событий

**Files:**
- Create: `packages/rules/metadata/forms/commonObjects/event/brokenReference.ts`
- Create: `packages/rules/metadata/forms/commonObjects/event/metadataTargetOccurrences.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/event/fromXML.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/event/toXML.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/event/fromXML.test.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/event/toXML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/event/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/event/index.ts`

**Interfaces:**
- Consumes: общий `BrokenXMLReferenceCarrierRegistry`, отметки YAML-ключей и `metadataTargetOccurrences`.
- Produces: `Event.name`, являющийся UUID, переносится как ключ `!xml/reference UUID` и исключается из разрешения/поиска.

- [x] **Step 1: Add failing import tests**

Для XML:

```xml
<Events>
  <Event name="0476b627-2985-4f74-bf59-b91a849ae6ea">ПослеЗаписи</Event>
</Events>
```

ожидать YAML с тем же ключом и `yamlMappingKeyTagAt(events, uuid) === "xml/reference"`. Отдельно проверить обычное известное и неизвестное текстовое событие без тега.

- [x] **Step 2: Verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/forms/commonObjects/event/fromXML.test.ts
```

Expected: FAIL — UUID нормализуется как имя обычного события и не получает отметку ключа.

- [x] **Step 3: Add an Events carrier and metadata-target occurrences**

По образцу `UserVisible`:

- carrier распознаёт только канонический UUID в `Event.name`;
- импорт отмечает соответствующий YAML-ключ `!xml/reference`;
- экспорт временно заменяет тегированный ключ, затем восстанавливает исходный `Event.name` дословно;
- значение обработчика остаётся текстом XML и не участвует в определении типа события;
- occurrence с тегом получает представление `brokenXMLReference`, обычный ключ — `canonical`.

Не добавлять поиск UUID по индексам и не определять событие по имени функции.

- [x] **Step 4: Add negative and structural tests**

Проверить: нетегированный UUID-ключ и произвольный payload `!xml/reference` отклоняются; tagged UUID отсутствует в структурном поиске; обычные события и `callType` не меняются.

- [x] **Step 5: Verify GREEN**

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/forms/commonObjects/event
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/commonObjects/event/toXML.integration.test.ts
pnpm duplicates -- --base 8fba09946
```

- [x] **Step 6: Commit**

```bash
git add packages/rules/metadata/forms/commonObjects/event docs/superpowers/plans/2026-08-15-round-trip-remaining-discrepancies.md
git commit -m "feat: :sparkles: переносить битые ссылки событий"
```

---

### Task 4: Исправить строковый FillValue и проверку длины

**Files:**
- Modify: `packages/rules/metadata/commonObjects/fillValue/effectiveType.ts`
- Modify: `packages/rules/metadata/commonObjects/fillValue/standardMember.test.ts`
- Modify: `packages/rules/metadata/commonObjects/fillValue/classify.test.ts`
- Modify: `packages/rules/metadata/commonObjects/fillValue/register.test.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.fillValue.test.ts`
- Modify: `.agents/xml-anomalies.md`

**Interfaces:**
- Consumes: `classifyStandardMemberFillValue`, общий `classifyFillValue`, импортированный dependent-item handler.
- Produces: пробельная строка является обычной строкой; только фактическое нарушение эффективной длины получает `!xml/value`.

- [x] **Step 1: Add failing classifier tests**

Таблично проверить текст и пробелы для:

- длина `0` — любая строка допустима;
- переменная `N` — длина не больше `N`;
- фиксированная `N` — длина ровно `N`.

Отдельно проверить строковые `Код`, `Номер`, `Наименование` и обычный реквизит, а также существующие пустые формы `Nil`/`String`.

- [x] **Step 2: Verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/commonObjects/fillValue/standardMember.test.ts metadata/commonObjects/fillValue/classify.test.ts
```

Expected: FAIL — `classifyCode` считает любую непустую пробельную строку неявной.

- [x] **Step 3: Remove the whitespace shortcut**

Удалить ветвь `/^\s+$/` из `classifyCode`; всегда передавать строку в общий `classifyFillValue` с ограничениями владельца. Убедиться, что общий классификатор трактует длину `0` как отсутствие ограничения; при необходимости исправить только общий расчёт строковой альтернативы.

- [x] **Step 4: Cover import tags and validation**

Проверить:

- допустимая строка импортируется без тега и точно сохраняет пробелы;
- недопустимая строка импортируется как `!xml/value` и экспортируется дословно;
- то же значение без тега даёт ошибку длины;
- лишний `!xml/value` у допустимой строки даёт ошибку ненужного тега.

- [x] **Step 5: Verify GREEN and document the anomaly**

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/commonObjects/fillValue packages/rules/metadata/validation/yamlFactExtractor.fillValue.test.ts
pnpm duplicates -- --base 8fba09946
```

В `.agents/xml-anomalies.md` уточнить: тег означает нарушение эффективного типа/длины, а не наличие пробелов.

- [x] **Step 6: Commit**

```bash
git add packages/rules/metadata/commonObjects/fillValue packages/rules/metadata/validation/yamlFactExtractor.fillValue.test.ts .agents/xml-anomalies.md docs/superpowers/plans/2026-08-15-round-trip-remaining-discrepancies.md
git commit -m "fix: :bug: сохранить строковый FillValue"
```

---

### Task 5: Объявить локальный namespace типа декларативно

**Files:**
- Modify: `packages/rules/metadata/commonObjects/typeDescription/types.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/toXML.ts`
- Modify: `packages/rules/metadata/commonObjects/typeDescription/toXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataAttribute/fragments.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataAttribute/fromYAMLToXML.integration.test.ts`

**Interfaces:**
- Consumes: `declareTypeNamespaceXML`.
- Produces: `boolean | readonly string[]`; список объявляет только перечисленные префиксы.

- [x] **Step 1: Add failing TypeDescription tests**

Добавить правила с `declareTypeNamespaceXML: ["dcsset"]` и проверить:

- `dcsset:SettingsComposer` получает локальный `xmlns:dcsset`;
- `cfg:*` не получает локальный namespace;
- `true` по-прежнему объявляет оба поддерживаемых namespace.

- [x] **Step 2: Verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/commonObjects/typeDescription/toXML.test.ts
```

Expected: FAIL на типе правила либо на безусловном булевом поведении.

- [x] **Step 3: Extend the existing policy**

Изменить тип поля на `boolean | readonly string[]`. Передавать в `getTypesXML` предикат по префиксу: `true` разрешает все прежние объявления, список — только `includes(prefix)`, отсутствие — ни одного дополнительного объявления. Не добавлять условий по `SettingsComposer`.

- [x] **Step 4: Configure ordinary applied-object attributes**

В общем `rules.ts` обычного реквизита прикладного объекта добавить `declareTypeNamespaceXML: ["dcsset"]`; формы оставить без параметра.

- [x] **Step 5: Verify GREEN**

```bash
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/commonObjects/typeDescription/toXML.test.ts
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/metadataAttribute/fromYAMLToXML.integration.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 8fba09946
```

- [x] **Step 6: Commit**

```bash
git add packages/rules/metadata/commonObjects/typeDescription packages/rules/metadata/commonObjects/metadataAttribute docs/superpowers/plans/2026-08-15-round-trip-remaining-discrepancies.md
git commit -m "fix: :bug: объявить namespace типа локально"
```

---

### Task 6: Поддержать обычные формы без Form.xml

**Files:**
- Modify: `packages/rules/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/propertyTypeRules.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/childFormNamesPropertyRules.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/rules/metadata/ruleRuntime/appliedObject/syncToXML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/syncToXML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/projectDefinition/resources.integration.test.ts`
- Modify: `packages/rules/metadata/resourceTopology/contracts.test.ts`

**Interfaces:**
- Consumes: существующий `formType`, `ClientApplicationForm` resource topology и внешний `Form.bin`.
- Produces: `ТипФормы: Обычная` сохраняет дескриптор и запрещает создание управляемого тела.

- [x] **Step 1: Add failing descriptor tests**

Для metadata XML с `<FormType>Ordinary</FormType>` без тела ожидать `ТипФормы: Обычная`; для `Managed` поле должно остаться неявным.

- [x] **Step 2: Verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
```

Expected: FAIL — у `ClientApplicationFormRules.properties.formType` нет YAML-имени.

- [x] **Step 3: Expose the existing formType rule**

Добавить `yaml: "ТипФормы"` к существующему `systemEnumerationRule`; сохранить `Managed` как `implicitValueYAML`.

- [x] **Step 4: Add failing resource/export tests**

Проверить:

- `ТипФормы: Обычная` не создаёт `Ext/Form.xml`;
- `Form.bin` остаётся внешним двоичным ресурсом;
- обычная форма без `Form.bin` допустима;
- управляемая форма по-прежнему требует/создаёт `Form.xml`;
- управляемые свойства формы вместе с `ТипФормы: Обычная` дают ошибку проверки.

- [x] **Step 5: Make the body conditional**

Разрешить общему преобразователю внешнего XML-файла вернуть `undefined`, что означает отсутствие цели записи; `syncToXML` в этом случае не создаёт выход. Конкретный `ClientApplicationForm` возвращает `undefined` только для `ТипФормы: Обычная`. Не добавлять знание о форме в `resourceTopology/core` или общий исполнитель.

- [x] **Step 6: Verify GREEN**

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts metadata/forms/clientApplicationForm/syncToXML.integration.test.ts metadata/projectDefinition/resources.integration.test.ts
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/resourceTopology/contracts.test.ts metadata/resourceTopology/adapters/registeredRules.test.ts
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/forms/clientApplicationForm/toJSONSchema.test.ts
pnpm duplicates -- --base 8fba09946
```

- [x] **Step 7: Commit**

```bash
git add packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts packages/rules/metadata/forms/clientApplicationForm packages/rules/metadata/importFromXml/prepareYaml.integration.test.ts packages/rules/metadata/projectDefinition/resources.integration.test.ts packages/rules/metadata/resourceTopology packages/rules/metadata/ruleRuntime/appliedObject/syncToXML.ts docs/superpowers/plans/2026-08-15-round-trip-remaining-discrepancies.md
git commit -m "feat: :sparkles: поддержать обычные формы"
```

---

### Task 7: Различить отсутствующий и пустой состав плана обмена

**Files:**
- Modify: `packages/rules/metadata/commonObjects/exchangePlanContent/register.ts`
- Modify: `packages/rules/metadata/commonObjects/exchangePlanContent/types.ts`
- Modify: `packages/rules/metadata/commonObjects/exchangePlanContent/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/exchangePlanContent/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/exchangePlanContent/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataExchangePlan/rules.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/propertyRuleRegistrySet.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts`
- Modify: `.agents/xml-anomalies.md`

**Interfaces:**
- Consumes: `explicitXMLPropertyTypes` для `ExchangePlanContent`.
- Produces: отсутствие `Состав` удаляет файл; `!xml/present` создаёт пустой `Content.xml`; список создаёт непустой файл.

- [x] **Step 1: Add failing owner-property tests without changing the internal item contract**

Существующий прямой договор `ExchangePlanContentRules` может сохранять внутреннее пустое значение `[]`. Через минимальное правило-владелец проверить внешний YAML-договор: пустой XML-корень импортируется как `Состав: !xml/present`, YAML `Состав: []` отклоняется. Добавить проверку отсутствующего свойства на уровне владельца — файл не создаётся.

- [x] **Step 2: Verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/exchangePlanContent/fromXMLToYAML.integration.test.ts metadata/commonObjects/exchangePlanContent/fromYAMLToXML.integration.test.ts
```

Expected: FAIL — текущий договор использует `[]`.

- [x] **Step 3: Register explicit presence and remove reference fallback**

Зарегистрировать `ExchangePlanContent` как `materializeCollection`. В `metadataExchangePlan/rules.ts` удалить `exportReferenceFileOnMissingValue: true` у `content`.

- [x] **Step 4: Cover schema boundaries and verify GREEN**

Проверить `!xml/present`, непустой список, запрет `[]`, payload и чужого тега.

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/exchangePlanContent
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/commonObjects/exchangePlanContent/toJSONSchema.test.ts metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts
pnpm duplicates -- --base 8fba09946
```

Добавить пустой `ExchangePlanContent` в `.agents/xml-anomalies.md`.

- [x] **Step 5: Commit**

```bash
git add packages/runtime/metadata/ruleRuntime/property/propertyRuleRegistrySet.ts packages/rules/metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts packages/rules/metadata/commonObjects/exchangePlanContent packages/rules/metadata/appliedObjects/metadataExchangePlan/rules.ts .agents/xml-anomalies.md docs/superpowers/plans/2026-08-15-round-trip-remaining-discrepancies.md
git commit -m "feat: :sparkles: различить пустой состав плана обмена"
```

---

### Task 8: Исправить модель панелей клиентского приложения

**Files:**
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/types.ts`
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/register.ts`
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/explicitPanelDefinition.ts`
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/toJSONSchema.test.ts`
- Modify: `.agents/xml-anomalies.md`

**Interfaces:**
- Consumes: `SectionsPanelRepresentation`, существующие стандартные UUID и `!xml/present` пустого определения.
- Produces: `ОтображениеПанелиРазделов` — свойство всего интерфейса; UUID панели разделов/истории исправлены; `Представление` размещённой панели удалено.

- [x] **Step 1: Add failing import and mapping tests**

Проверить:

- скрытый `panelDef` UUID `b553...` с `<spr>Text</spr>` импортируется как `ОтображениеПанелиРазделов: Текст`;
- размещённый `b553...` с `PictureOnLeftAndText` даёт то же верхнеуровневое свойство;
- `b553...` называется `ПанельРазделов`, `13322...` — `ПанельИстории`;
- размещённая панель не получает `Представление`.

- [x] **Step 2: Verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.integration.test.ts
```

Expected: FAIL — UUID перепутаны, `spr` привязан к размещённой панели или теряется.

- [x] **Step 3: Move spr to the interface rule**

Добавить в `ClientApplicationInterfaceRules` обычное свойство:

```ts
sectionsPanelRepresentation: systemEnumerationRule({
  yaml: "ОтображениеПанелиРазделов",
  typeSE: "SectionsPanelRepresentation",
  toXML: false,
  fromXML: false,
  toYAML: false,
})
```

Конкретная регистрация интерфейса читает и пишет значение в `panelDef` UUID `b553...` независимо от размещения. Тестовый XML задавать строкой в тесте, не изменяя существующую фикстуру. Удалить `spr`/`Представление` из размещённой панели и проверки пустого нестандартного определения.

- [x] **Step 4: Fix the standard UUID map and preserve empty definitions**

Исправить два имени UUID. Сохранить:

- пять стандартных пустых `panelDef` как неявную каноническую часть файла;
- весь пустой интерфейс как `ИнтерфейсКлиентскогоПриложения: !xml/present`;
- нестандартное пустое определение как `ПустоеОпределение: !xml/present`;
- отсутствие нестандартного определения как отсутствие поля.

- [x] **Step 5: Add export and schema boundaries**

Проверить оба значения перечисления, отсутствие `spr`, отказ для старого `Представление`, правильный XML `panelDef`, Tester-подобный пустой корень и нестандартное пустое определение.

- [x] **Step 6: Verify GREEN**

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration --no-isolate metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.integration.test.ts metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.integration.test.ts
pnpm --filter @nkdk/rules exec vitest run --project unit --no-isolate metadata/commonObjects/clientApplicationInterface/toJSONSchema.test.ts
pnpm duplicates -- --base 8fba09946
```

Обновить `.agents/xml-anomalies.md` описанием независимой настройки панели разделов и пустого интерфейса.

- [x] **Step 7: Commit**

```bash
git add packages/rules/metadata/commonObjects/clientApplicationInterface .agents/xml-anomalies.md docs/superpowers/plans/2026-08-15-round-trip-remaining-discrepancies.md
git commit -m "fix: :bug: исправить настройки панелей приложения"
```

---

### Task 9: Интеграционная сверка и обязательные проверки

**Files:**
- Modify: `docs/superpowers/plans/2026-08-15-round-trip-remaining-discrepancies.md`
- Modify only if observations require clarification: `docs/superpowers/specs/2026-08-15-round-trip-next-discrepancies-design.md`

- [x] **Step 1: Run focused round-trip checks in order**

Не сбрасывать весь репозиторий `round-trip-compact`; для каждого запуска использовать отдельную копию проверяемой конфигурации либо диагностический каталог навыка.

```bash
./.agents/skills/round-trip-yaml/round-trip.sh /Users/nikita/git/round-trip-compact/cf/CashdeskDev_3_32_26_0_setup1c
./.agents/skills/round-trip-yaml/round-trip.sh /Users/nikita/git/round-trip-compact/cf/Contracts_1_0_7_2_setup1c
./.agents/skills/round-trip-yaml/round-trip.sh /Users/nikita/git/round-trip-compact/cf/Conversion_3_1_6_15_setup1c
```

Expected: согласованные расхождения исчезли; новое независимое расхождение только фиксируется, но не исправляется в этой ветке.

Результат сверки на чистых временных копиях конфигураций:

- `CashdeskDev_3_32_26_0_setup1c` — round-trip чистый после уточнения общего договора пустого вложенного XML-контейнера: производственный парсер сохраняет существующий пустой элемент как ключ со значением `undefined`, а экспорт должен материализовать последний `xmlParents`, не дочерний `xml`-элемент;
- `Contracts_1_0_7_2_setup1c` — следующее независимое отклонение: теряется `v8:TypeId` составного `TypeDescription` в форме `ПанельДругихОтчетов`;
- `Conversion_3_1_6_15_setup1c` — следующие независимые отклонения: удаляется служебный `.DS_Store`, а имена `ContextMenu` и `ExtendedTooltip` трёх дополнений таблицы заменяются вычисленными именами владельца.

Новые независимые отклонения в этой ветке не исправляются.

- [x] **Step 2: Run package checks**

```bash
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 8fba09946
```

- [x] **Step 3: Run architecture checks**

```bash
pnpm test:architecture:rules
pnpm test:architecture
```

- [x] **Step 4: Run the complete test suite outside the sandbox**

```bash
pnpm test
```

Expected: все пакеты, native-LMDB и интеграционные проверки проходят.

`pnpm test` выполнен вне песочницы дважды. Во всех запущенных наборах тестовые утверждения прошли, но оба запуска остановлены существующим ограничением времени файла `metadata/forms/clientApplicationForm/toJSONSchema.test.ts`: 1726 мс и 1600 мс. После исправления устаревшего ожидания панели отдельно подтверждены оставшиеся наборы: native-LMDB — 41 тест, rules integration — 2745 тестов, MCP — 189 тестов (2 штатно пропущены). Ограничение времени и проверяемый файл не относятся к изменённому производственному пути.

- [x] **Step 5: Audit the implementation against the spec and plan**

Для каждого раздела спецификации проверить: положительные и отрицательные границы, отсутствие reference-зависимости, отсутствие частных условий в нейтральных слоях, отсутствие несогласованных новых `!xml`.

Локальный аудит подтвердил восемь договоров спецификации. Обнаруженное отставание native-теста панели исправлено: проверка теперь требует верхнеуровневое `ОтображениеПанелиРазделов` и запрещает прежнее вложенное `Представление`. Дополнительное исправление пустого `dataParameters` выражено через общие `explicitXMLPropertyTypes` и `xmlParents`; оно не содержит имён конкретных типов, свойств или XML-корней.

- [x] **Step 6: Commit final documentation/status**

```bash
git add docs/superpowers/plans/2026-08-15-round-trip-remaining-discrepancies.md docs/superpowers/specs/2026-08-15-round-trip-next-discrepancies-design.md
git commit -m "docs: :memo: зафиксировать реализацию расхождений round-trip"
```
