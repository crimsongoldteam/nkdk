# Оставшиеся расхождения YAML round-trip `cf/doc`: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать все подтверждённые договоры из спецификации оставшихся расхождений `cf/doc` и получить точный XML → YAML → XML для затронутых случаев без общего reference-механизма.

**Architecture:** Канонические XML-defaults и обязательные контейнеры задаются декларативно в `rules.ts`; локальные различия сложных DCS-значений и интерфейса приложения остаются рядом со своими типами. Общий orchestration расширяется только нейтральными договорами вычисления отсутствующего YAML и зарегистрированного `!xml`; знания о конкретных metadata item остаются в их модулях.

**Tech Stack:** TypeScript 7, TypeBox, js-yaml, Vitest, pnpm, jscpd, XML/YAML rules.ts.

**Specification:** `docs/superpowers/specs/2026-08-03-doc-round-trip-remaining-design.md`

## Global Constraints

- Исходные XML-фикстуры являются источником истины; удалить разрешено только две признанные ошибочными фикстуры `dataCompositionSchemaDataSetField/__fixtures__/appearance.xml` и `appearance-direct-fields.xml`.
- Reference XML исключается только для полей и механизмов, прямо перечисленных в спецификации; остальные применения не менять.
- Не добавлять частные условия в `metadata/orchestration`, `metadata/validation` и `metadata/project`; общие изменения должны выражать нейтральный договор.
- Не добавлять новые параметры в `BasePropertyRule`, `PropertyRule` и построители rules.ts, кроме согласованного переименования `exportWithoutReferenceXML` в `evaluateWhenYAMLMissing`.
- `!xml` разрешён только для уже согласованных классов: явный `HeaderHorizontalAlign=Auto`, отсутствие четырёх XML-defaults `CharacteristicsDescription` и пустой дополнительный `panelDef`, отмеченный на UUID панели.
- Configuration index остаётся для идентичности размещений панелей и групп; для описанных в спецификации значений и определений reference XML не используется.
- Следовать TDD: сначала падающий узкий тест, затем минимальная реализация и зелёный целевой тест.
- Stryker и проверки на мутантов в этой задаче не запускать.
- Финальная проверка обязательна: `pnpm type-check`, `pnpm test`, `pnpm test:architecture`, `pnpm duplicates`.
- Проверка `round-trip-compact` не должна изменять пользовательское рабочее дерево: использовать отдельный временный git worktree XML-репозитория.

---

### Task 0: Зафиксировать утверждённые спецификацию и план

**Files:**
- Add: `docs/superpowers/specs/2026-08-03-doc-round-trip-remaining-design.md`
- Add: `docs/superpowers/plans/2026-08-03-doc-round-trip-remaining.md`

**Interfaces:**
- Produces: чистую документированную исходную точку для реализации и последующего round-trip skill.

- [ ] **Step 1: Проверить документы перед коммитом**

```bash
git diff --check -- docs/superpowers/specs/2026-08-03-doc-round-trip-remaining-design.md docs/superpowers/plans/2026-08-03-doc-round-trip-remaining.md
rg -n 'T[B]D|T[O]DO|implement l[a]ter|fill in d[e]tails' docs/superpowers/specs/2026-08-03-doc-round-trip-remaining-design.md docs/superpowers/plans/2026-08-03-doc-round-trip-remaining.md
```

Expected: `git diff --check` завершается с кодом 0; поиск не находит незаполненных требований.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-08-03-doc-round-trip-remaining-design.md docs/superpowers/plans/2026-08-03-doc-round-trip-remaining.md
git commit -m "docs: 📝 описать оставшиеся договоры round-trip"
```

---

### Task 1: Вычислять XML-свойство при отсутствующем YAML и восстанавливать обязательный `filter`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/configurationIndex/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Modify: `packages/core/metadata/commonObjects/clientApplicationInterface/rules.ts`
- Modify: `packages/core/metadata/commonObjects/internalInfo/types.ts`
- Modify: `packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/internalInfo/rulesContract.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/fragments.ts`
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/fromYAMLToXML.test.ts`

**Interfaces:**
- Produces: `PropertyRule.evaluateWhenYAMLMissing?: true`, полностью заменяющий старое имя.
- Produces: отсутствующий `ConditionalAppearanceItem.filter` экспортируется как пустой `dcsset:filter`.

- [ ] **Step 1: Переименовать тестовый договор orchestration и получить падение типов**

Во всех тестовых правилах заменить:

```ts
exportWithoutReferenceXML: true
```

на:

```ts
evaluateWhenYAMLMissing: true
```

и переименовать описания тестов так, чтобы они говорили о вычислении при отсутствующем YAML, а не о reference.

- [ ] **Step 2: Запустить узкие тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromYAMLToXML.test.ts metadata/configurationIndex/fromYAMLToXML.test.ts
```

Expected: FAIL/ошибка TypeScript из-за отсутствующего `evaluateWhenYAMLMissing` или сохранённого старого имени.

- [ ] **Step 3: Выполнить механическое переименование production-договора**

В `PropertyRule` объявить:

```ts
/** Вычислять XML-only свойство при отсутствии значения в YAML. */
evaluateWhenYAMLMissing?: true
```

В `requiresYAMLToXMLEvaluation` использовать только новое имя:

```ts
return (
  rule.evaluateWhenYAMLMissing === true ||
  rule.exportNilValue === true ||
  Object.prototype.hasOwnProperty.call(rule, "implicitValueXML")
)
```

Заменить имя во всех rules.ts и проверках из списка файлов. Совместимый псевдоним не оставлять.

- [ ] **Step 4: Добавить падающую проверку обязательного пустого filter**

Расширить существующий тест `exports minimal.xml`, который уже использует
`minimalConditionalAppearanceItemsYAML = [{}]`:

```ts
expect(result).toEqual(expectedResult)
expect(result).toContain("<dcsset:filter/>")
```

`minimal.xml` не менять: в нём уже зафиксированы три обязательных пустых
контейнера `selection`, `filter` и `appearance`.

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/fromYAMLToXML.test.ts
```

Expected: FAIL — `dcsset:filter` отсутствует.

- [ ] **Step 5: Задать обязательную пустую XML-форму в rules.ts**

```ts
filter: filterRule({
  xml: "dcsset:filter",
  yaml: "Отбор",
  defaultValueXMLRaw: {},
  evaluateWhenYAMLMissing: true,
}),
```

- [ ] **Step 6: Запустить целевые тесты и проверить отсутствие старого имени**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromYAMLToXML.test.ts metadata/configurationIndex/fromYAMLToXML.test.ts metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/fromYAMLToXML.test.ts
rg -n "exportWithoutReferenceXML" packages/core
```

Expected: PASS; `rg` не находит совпадений.

- [ ] **Step 7: Commit**

```bash
git add packages/core
git commit -m "fix(core): 🐛 восстанавливать обязательный отбор условного оформления"
```

---

### Task 2: Различать отсутствующее, `nil` и `Undefined` значение параметра СКД

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts`

**Interfaces:**
- Produces: `nil` и `v8:Type/...:Undefined` импортируются как модельный/YAML `null`.
- Produces: отсутствующий `dcssch:value` остаётся отсутствующим и не создаётся обратно.

- [ ] **Step 1: Добавить таблицу падающих XML → YAML случаев параметра**

Проверить три различающиеся формы:

```ts
it.each([
  ["missing", `<Parameter><dcssch:name>P</dcssch:name></Parameter>`, undefined],
  ["nil", `<Parameter><dcssch:name>P</dcssch:name><dcssch:value xsi:nil="true"/></Parameter>`, null],
  ["Undefined", xmlWithUndefinedTypeValue, null],
])("imports %s value", (_case, xmlString, expected) => {
  const result = importParameterYAML(xmlString)
  expect(result.Параметры.P.Значение).toBe(expected)
})
```

Для `missing` проверять также отсутствие собственного ключа через
`Object.hasOwn(result.Параметры.P, "Значение")`.

- [ ] **Step 2: Запустить тест и подтвердить текущую потерю различия**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXMLToYAML.test.ts
```

Expected: FAIL — `nil` и `Undefined` превращаются в отсутствие ключа.

- [ ] **Step 3: Нормализовать только явные пустые XML-значения в `null`**

В `dcsMetadataValue/fromXML.ts` изменить две ветви:

```ts
if (isNilValue(root)) return null

const undefinedTypePrefix = getUndefinedTypePrefix(root)
if (undefinedTypePrefix !== undefined && rule.valueType === "Primitive") {
  return null
}
```

Удалить reference-ветвь, возвращавшую сырой `Undefined`, и ставшие ненужными помощники. Отсутствующий корневой `dcscor:value` не превращать в `null`.

- [ ] **Step 4: Убрать безусловный nil-default у DCSParameter**

```ts
value: metadataDcsMetadataValueRule({
  valueType: "Primitive",
  xml: "dcssch:value",
  yaml: "Значение",
  preserveUnknownReferenceXML: false,
}),
```

`exportNilValue` оставить доступным другим правилам; удалить только из `DCSParameterRules.value`.

- [ ] **Step 5: Переписать YAML → XML ожидания**

Добавить/обновить проверки:

```ts
expect(exportDCSParameters([], { P: {} })).not.toContain("<dcssch:value")
expect(exportDCSParameters([], { P: { Значение: null } })).toContain('<dcssch:value xsi:nil="true"/>')
```

Проверку `Undefined` изменить: импорт даёт `null`, обратный экспорт даёт канонический `xsi:nil`, без reference XML.

- [ ] **Step 6: Запустить узкий набор DCS-тестов**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXMLToYAML.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/fromYAMLToXML.test.ts
```

Expected: PASS для отсутствующего значения, `nil`, `Undefined`, пустой строки и обычного значения.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter
git commit -m "fix(core): 🐛 различать пустое и отсутствующее значение параметра СКД"
```

---

### Task 3: Сохранять пустые группы дополнительных колонок формы

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.test.ts`

**Interfaces:**
- Produces: пустой `<AdditionalColumns table="Путь"/>` ↔ `ДополнительныеКолонки: { Путь: {} }`.

- [ ] **Step 1: Добавить падающий импорт пустой и смешанной группы**

```ts
expect(yaml).toMatchObject({
  Значение: {
    Таблица: {
      ДополнительныеКолонки: {
        "Таблица.Пустая": {},
        "Таблица.Заполненная": { Дополнительная: expect.any(Object) },
      },
    },
  },
})
```

- [ ] **Step 2: Подтвердить падение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts
```

Expected: FAIL — ключ `Таблица.Пустая` отсутствует.

- [ ] **Step 3: Сохранять путь независимо от наличия Column**

В `importAdditionalColumnsFromXMLToYAML` заменить условную запись:

```ts
result[table] = columns ?? {}
```

Не добавлять configuration-index признак присутствия: пустой объект является смысловым YAML.

- [ ] **Step 4: Добавить обратный и schema-тесты**

В тест формы передать:

```yaml
ДополнительныеКолонки:
  Список.Пустая: {}
```

и проверить:

```ts
expect(additionalColumns).toContainEqual({ _table: "Список.Пустая" })
```

Скомпилировать `FormAttributeAdditionalColumns` JSON Schema и проверить, что `{ "Список.Пустая": {} }` принимается, а `{ "Список.Пустая": { Лишнее: true } }` отклоняется.

- [ ] **Step 5: Запустить целевые тесты**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts metadata/forms/commonObjects/formAttribute/toJSONSchema.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/forms
git commit -m "fix(core): 🐛 сохранять пустые группы дополнительных колонок"
```

---

### Task 4: Сохранять отсутствие четырёх XML-defaults характеристики через пустой `!xml`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/tests/property/explicitXMLPropertyRegistry.ts`
- Create: `packages/core/metadata/commonObjects/characteristicsDescription/explicitXMLDefaults.ts`
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/registerCollectionRule.ts`
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/fromYAMLToXML.test.ts`
- Modify: `.agents/architecture.md`
- Modify: `.agents/restrictions.md`

**Interfaces:**
- Produces: discriminated registration action `emit` or `omit` for `!xml`.
- Produces: empty tagged scalar suppresses registered XML-default instead of создавая пустой тег.

- [ ] **Step 1: Добавить падающие общие тесты регистрации отсутствия**

Зарегистрировать тестовое свойство:

```ts
registerExplicitXMLProperty({
  itemType: "ExplicitXMLMissingProbe",
  propertyKey: "value",
  action: "omit",
  yamlValue: "",
})
```

Проверить два направления:

```ts
// XML-тег отсутствует -> Поле: !xml
expect(exportToYAML(imported)).toContain("Поле: !xml")

// Поле: !xml -> defaultValueXML не создаётся
expect(serialized).not.toContain("<Value>")
```

- [ ] **Step 2: Запустить общие тесты и подтвердить падение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts
```

Expected: FAIL — registry знает только явное присутствующее значение.

- [ ] **Step 3: Сделать регистрацию формы XML дискриминированной**

Сохранить прежний API имени регистрации, но различить действия:

```ts
type ExplicitXMLPropertyRegistration =
  | {
      readonly action?: "emit"
      readonly itemType: string
      readonly propertyKey: string
      readonly xmlValue: unknown
      readonly yamlValue: unknown
    }
  | {
      readonly action: "omit"
      readonly itemType: string
      readonly propertyKey: string
      readonly yamlValue: ""
    }
```

`matchExplicitXMLPropertyFromXML` сопоставляет `emit` только при присутствующем равном значении, а `omit` — только при отсутствующем XML-теге. Проверка YAML-тега возвращает действие зарегистрированного свойства; `fromYAMLToXML` прекращает обработку свойства с действием `omit` до чтения reference/default.

- [ ] **Step 4: Зарегистрировать ровно четыре свойства CharacteristicsDescription**

В новом локальном модуле вызвать регистрацию для:

```ts
const omittedCharacteristicDefaultKeys = [
  "dataPathField",
  "multipleValuesUseField",
  "multipleValuesKeyField",
  "multipleValuesOrderField",
] as const
```

Для каждого: `itemType: "CharacteristicsDescription"`, `action: "omit"`, `yamlValue: ""`. Импортировать модуль рядом с регистрацией коллекции, не из общего orchestration.

- [ ] **Step 5: Покрыть три реальные формы и отказ неразрешённого тега**

Через inline XML проверить:

1. отсутствуют все четыре поля;
2. присутствует только `DataPathField`;
3. отсутствует только `DataPathField`.

Для каждого проверить точные строки `Поле...: !xml` и обратное отсутствие соответствующих тегов. Отдельно проверить, что `ПолеКлюча: !xml` отклоняется как незарегистрированное применение.

- [ ] **Step 6: Обновить архитектурный договор и restrictions**

В `.agents/architecture.md` заменить утверждение «только факт явного присутствия» на два зарегистрированных действия: явное присутствие неявного значения и явное отсутствие XML-default. В `.agents/restrictions.md` перечислить четыре новых разрешённых свойства, сохранив требование отдельного согласования каждого будущего применения.

- [ ] **Step 7: Запустить целевые тесты**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts metadata/commonObjects/characteristicsDescription/fromXMLToYAML.test.ts metadata/commonObjects/characteristicsDescription/fromYAMLToXML.test.ts
```

Expected: PASS; реальные значения и канонический `-1` работают без тега.

- [ ] **Step 8: Commit**

```bash
git add packages/core .agents/architecture.md .agents/restrictions.md
git commit -m "fix(core): 🐛 сохранять отсутствие XML-defaults характеристики"
```

---

### Task 5: Сохранять пустое условное оформление динамического списка

**Files:**
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: существующая type-регистрация `xmlImportPropertyBehavior: { presenceAffectsExport: true }`.
- Produces: пустой объект сохраняется в YAML только для типов, где присутствие XML влияет на экспорт.

- [ ] **Step 1: Добавить падающий тест нейтрального договора `presenceAffectsExport`**

Расширить `toYAML.test.ts`: временно зарегистрированный тип с
`presenceAffectsExport: true` должен вернуть `{ Поле: {} }`, обычный тип с
пустым объектом по-прежнему должен вернуть `undefined`.

- [ ] **Step 2: Подтвердить падение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/toYAML.test.ts metadata/commonObjects/dataCompositionSystem/conditionalAppearance/fromXMLToYAML.test.ts
```

Expected: FAIL — пустой объект удаляется безусловно.

- [ ] **Step 3: Переиспользовать существующий type-level договор**

В `getExportToYAMLResult` проверять регистрацию типа:

```ts
const preservesPresence =
  getTypeRule(rule.type, "xmlImportPropertyBehavior")?.presenceAffectsExport === true

if (
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === 0 &&
  !preservesPresence
) return undefined
```

Не добавлять новое поле в `PropertyRule` и не упоминать `ConditionalAppearance` в orchestration.

- [ ] **Step 4: Обновить минимальный сценарий ConditionalAppearance**

Ожидать:

```ts
expect(result).toEqual({ УсловноеОформление: {} })
```

и проверить, что обратный экспорт создаёт:

```xml
<dcsset:conditionalAppearance>
  <dcsset:viewMode>Normal</dcsset:viewMode>
</dcsset:conditionalAppearance>
```

Отдельный тест отсутствующего YAML-ключа должен подтверждать отсутствие контейнера.

- [ ] **Step 5: Запустить целевые тесты**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/toYAML.test.ts metadata/commonObjects/dataCompositionSystem/conditionalAppearance/fromXMLToYAML.test.ts metadata/commonObjects/dataCompositionSystem/conditionalAppearance/fromYAMLToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/property/toYAML.ts packages/core/metadata/orchestration/property/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearance
git commit -m "fix(core): 🐛 сохранять пустое условное оформление"
```

---

### Task 6: Канонизировать строковые значения оформления и строгую validation-схему

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.test.ts`

**Interfaces:**
- Produces: локальный канонический YAML для `AppearanceFields.Текст` и `.Формат` без поля `Тип`.
- Produces: строгая schema принимает компактное значение либо развёрнутое значение с обязательным `Значение`.

- [ ] **Step 1: Переписать матрицу schema-тестов на утверждённый договор**

В `appearanceFields/toJSONSchema.test.ts` использовать `it.each` для принятых значений:

```ts
["", "Строка", {}, { ru: "" }, { ru: "Строка" },
 { Форматированный: "Истина", Текст: {} },
 null,
 { Использовать: "Ложь", Значение: { ru: "Строка" } }]
```

и отклоняемых значений:

```ts
[{ Тип: "МногоязычнаяСтрока", Значение: { ru: "x" } },
 { Использовать: "Ложь" },
 { ru_RU: "x" },
 { ru: 1 },
 { Форматированный: "Истина" },
 { Форматированный: "Ложь", Текст: {} },
 { Использовать: "Ложь", Значение: "x", Лишнее: true }]
```

- [ ] **Step 2: Запустить schema-тест и подтвердить три известных несоответствия**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts
```

Expected: FAIL — старая форма с `Тип` принимается, `{}` отклоняется, развёрнутая форма без `Значение` принимается.

- [ ] **Step 3: Реализовать локальное преобразование строк оформления**

Для свойств `Текст` и `Формат` до вызова общего `SettingsParameterValue`:

- строку и `null` передавать без изменения;
- языковую карту преобразовывать во внутренний `I8nText`;
- `{ Форматированный: Истина, Текст: <карта> }` преобразовывать во внутренний `LocalFormattedStringType`;
- в развёрнутой форме применять ту же нормализацию только к `Значение`;
- объект с ключом `Тип` немедленно отклонять.

Обратное преобразование выполнять в `AppearanceFields` после общего DCS-экспорта: `I8nText` → явная языковая карта, форматированная строка → `{ Форматированный: Истина, Текст: ... }`, без сокращения одноязычной карты. Общий договор `MetadataDcsMetadataValue` и его типизированные формы для других DCS-свойств не менять.

- [ ] **Step 4: Построить строгую локальную schema без нового параметра rules.ts**

В `appearanceFields/toJSONSchema.ts` определить:

```ts
const AppearanceStringValueJSONSchema = Type.Union([
  Type.Null(),
  Type.String(),
  LanguageMapJSONSchema,
  FormattedLanguageMapJSONSchema,
])
```

Для `Текст` и `Формат` использовать union компактной формы и строгой развёрнутой формы, где `Значение` обязательно, `Тип` отсутствует, а служебные поля перечислены явно. Остальные параметры `AppearanceFields` продолжают использовать общий `createSettingsParameterValueJSONSchema`.

- [ ] **Step 5: Проверить настоящий project validator с external refs**

В `projectValidationPasses.test.ts` создать через существующий `writeProjectFile`
две временные `ОбщаяФорма/.../Свойства.yaml` и проверить их через
`validateProjectFileFirstPass` с общим `sharedSchemaCache`:

```yaml
Форма:
  УсловноеОформлениеРеквизитов:
    Элементы:
      - Оформление:
          Текст: {}
          Формат:
            Форматированный: Истина
            Текст: {ru: ""}
```

Положительный файл не должен иметь `schemaDiagnostics`. Во втором файле заменить
`Текст: {}` на старую форму
`Текст: {Тип: МногоязычнаяСтрока, Значение: {ru: Строка}}` и ожидать structural
diagnostic по пути с `Текст`. Так проверяется реальный проход validation и тот же
граф внешних `$ref`, который используется проектом, а не отдельная inline-схема.

- [ ] **Step 6: Проверить XML-формы строк**

Добавить round-trip случаи для:

```text
""                     -> xs:string
{}                     -> пустой v8:LocalStringType
{ ru: "" }             -> LocalStringType с пустым ru
Форматированный + {}    -> пустой LocalFormattedStringType
null                   -> xsi:nil
```

и проверить развёрнутую форму `Использовать: Ложь` с обязательным `Значение`.

- [ ] **Step 7: Запустить целевой набор**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/appearanceFields metadata/validation/projectValidationPasses.test.ts
```

Expected: PASS; старый YAML с `Тип` отклоняется импортом и validation.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem packages/core/metadata/validation/projectValidationPasses.test.ts
git commit -m "fix(core): 🐛 различать строковые формы параметров оформления"
```

---

### Task 7: Использовать общий `AppearanceFields` для поля набора данных

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/data.ts`
- Delete: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/appearance.xml`
- Delete: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/appearance-direct-fields.xml`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/appearance-collection.xml`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: канонические строковые формы Task 6.
- Produces: `DataSetField.appearance` всегда использует `dcscor:item` коллекцию `SettingsParameterValue`.

- [ ] **Step 1: Добавить корректную фикстуру из реального `cf/doc`**

Создать `appearance-collection.xml` с формой:

```xml
<dcssch:appearance>
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:parameter>Формат</dcscor:parameter>
    <dcscor:value xsi:type="xs:string">ЧЦ=15; ЧДЦ=3; ЧН=0,000</dcscor:value>
  </dcscor:item>
</dcssch:appearance>
```

Фикстура должна содержать полный `Field xsi:type="dcssch:DataSetFieldField"`, извлечённый из конфигурации, а не синтетическую прямую форму.

- [ ] **Step 2: Перевести тесты на коллекционную форму и получить падение**

Ожидать YAML:

```yaml
Оформление:
  Формат: "ЧЦ=15; ЧДЦ=3; ЧН=0,000"
```

и обратный `dcscor:item`. Удалить тест прямых `dcsset:format`/`dcsset:textColor`.

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField
```

Expected: FAIL до удаления специального режима.

- [ ] **Step 3: Удалить специальный XML-режим**

Удалить:

- `AppearanceFieldsXMLMode`;
- `AppearanceFieldsPropertyRule.appearanceXml`;
- `directAppearanceXmlTags` и `DirectAppearanceXMLTag`;
- `usesDataSetFieldAppearanceXML`;
- `importDataSetFieldAppearanceFromXML`;
- `exportDataSetFieldAppearanceToXML`;
- ветвь `transformOutput` для прямых тегов.

В `dataCompositionSchemaDataSetField/rules.ts` оставить обычное правило:

```ts
const appearanceRule = {
  type: "AppearanceFields",
  xml: "dcssch:appearance",
  yaml: "Оформление",
  toXML: isField,
  configurationIndexAddressing: "yamlPath",
} as const satisfies AppearanceFieldsPropertyRule
```

- [ ] **Step 4: Удалить две ошибочные XML-фикстуры и их данные**

Удалить только две явно согласованные фикстуры и константы, существовавшие исключительно для прямой формы. Общую фикстуру `appearanceFields/__fixtures__/appearance.xml` и тесты `CalculatedField` не менять.

- [ ] **Step 5: Проверить переиспользование общего механизма и validation**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField metadata/commonObjects/dataCompositionSystem/calculatedField metadata/commonObjects/dataCompositionSystem/appearanceFields
```

Expected: PASS; `DataSetField` и `CalculatedField` создают одинаковую структуру `dcscor:item`.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem
git commit -m "fix(core): 🐛 использовать коллекционное оформление поля набора данных"
```

---

### Task 8: Восстанавливать основное назначение управляемой формы

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toJSONSchema.test.ts`

**Interfaces:**
- Produces: отсутствующее YAML `НазначенияИспользования` означает модельное и XML `PlatformApplication`.

- [ ] **Step 1: Добавить падающий тест формы без YAML-поля**

```ts
const result = convertClientApplicationFormFromYAMLToXML({
  context: mockContextToXML(),
  yaml: {},
  name: "Форма",
})

expect(result.formXML.UsePurposes).toEqual({
  "v8:Value": {
    "_xsi:type": "app:ApplicationUsePurpose",
    "#text": "PlatformApplication",
  },
})
```

- [ ] **Step 2: Подтвердить падение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

Expected: FAIL — `UsePurposes` отсутствует.

- [ ] **Step 3: Задать оба default в form rules.ts**

```ts
usePurposes: usePurposesRule({
  yaml: "НазначенияИспользования",
  tag: FormRulesTags.Metadata,
  xmlParents: ["Form", "Properties"],
  defaultValue: () => ["PlatformApplication"],
  defaultValueXML: ["PlatformApplication"],
}),
```

- [ ] **Step 4: Проверить все три варианта и JSON Schema**

Проверить только платформу, только мобильное приложение и совместное назначение. Schema должна принимать отсутствие поля и два явных YAML-варианта, но отклонять произвольную строку.

- [ ] **Step 5: Запустить тесты формы**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/forms/clientApplicationForm/toJSONSchema.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/forms/clientApplicationForm
git commit -m "fix(core): 🐛 восстанавливать назначение управляемой формы"
```

---

### Task 9: Восстанавливать стандартные `panelDef` и отмечать пустое дополнительное определение

**Files:**
- Create: `packages/core/metadata/commonObjects/clientApplicationInterface/explicitPanelDefinition.ts`
- Modify: `packages/core/metadata/commonObjects/clientApplicationInterface/register.ts`
- Modify: `packages/core/metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.test.ts`
- Modify: `.agents/architecture.md`
- Modify: `.agents/restrictions.md`

**Interfaces:**
- Produces: стабильный массив пяти обязательных UUID standard panel definitions.
- Produces: локальные функции `markExplicitEmptyPanelDefinition` и `hasExplicitEmptyPanelDefinition` поверх scalar tag `xml` у поля `UUID`.

- [ ] **Step 1: Не менять существующую XML-фикстуру; добавить inline проверки пяти standard panelDef**

Несмотря на список файлов выше, `ClientApplicationInterface.xml` использовать только для чтения и существующего round-trip; не редактировать его. Добавить тест минимального YAML и проверить точный порядок:

```ts
const ids = [
  "b553047f-c9aa-4157-978d-448ecad24248",
  "13322b22-3960-4d68-93a6-fe2dd7f28ca3",
  "c933ac92-92cd-459d-81cc-e0c8a83ced99",
  "cbab57f2-a0f3-4f0a-89ea-4cb19570ab75",
  "b2735bd3-d822-4430-ba59-c9e869693b24",
]
```

Проверить, что нулевой UUID `СтандартнаяПанель` не добавляется как шестое определение.

- [ ] **Step 2: Добавить падающие тесты неоднозначной панели**

Для двух inline XML с одинаковым размещением UUID `8e10648b-...` проверить:

```text
без panelDef  -> UUID: 8e10648b-...
с panelDef    -> UUID: !xml 8e10648b-...
```

Обратный тест должен создавать дополнительный пустой `panelDef` только для tagged UUID. `Имя: !xml ...` и тег на стандартном UUID должны отклоняться.

- [ ] **Step 3: Подтвердить падение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.test.ts metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.test.ts
```

Expected: FAIL — неиспользуемые стандартные определения теряются, nested UUID не получает/не читает тег.

- [ ] **Step 4: Выделить локальный транспортный договор панели**

В `explicitPanelDefinition.ts` использовать только публичные функции scalar tags:

```ts
export function markExplicitEmptyPanelDefinition(panel: object): void {
  markYAMLScalarTag(panel, "UUID", "xml")
}

export function hasExplicitEmptyPanelDefinition(panel: unknown): boolean {
  return isRecord(panel) && yamlScalarTagAt(panel, "UUID") === "xml"
}
```

Добавить локальную проверку: tagged-полем может быть только строковый `UUID` развёрнутой нестандартной панели без `Имя` и `Представление`. Другие nested `!xml` завершать ошибкой импорта. Не добавлять частное знание о панелях в общий registry property orchestration.

- [ ] **Step 5: Всегда формировать каноническую пятёрку**

В `exportPanelDefsToXML` сначала пройти упорядоченный массив пяти standard UUID и создать определение через существующий `mergePanelDefWithReference`, подставляя смысловой `spr`, если он задан. Нулевой UUID исключить. Затем добавить нестандартные определения, требуемые именем, представлением или explicit marker.

- [ ] **Step 6: Перенести nested tag в оба направления без изменения модели**

При XML → YAML `exportPanelToYAML` отмечает объект панели, если её нестандартный UUID имеет пустой `panelDef` без `name`/`spr`. При YAML → XML отдельный обход сырого YAML собирает tagged UUID в `Set<string>` и передаёт его `exportPanelDefsToXML`; служебное поле в модель и JSON Schema не добавляется.

- [ ] **Step 7: Обновить архитектуру и restrictions**

В `.agents/architecture.md` дополнить, что явно зарегистрированный локальный type-handler может хранить scalar tag у вложенного смыслового поля, не меняя JSON Schema. В `.agents/restrictions.md` разрешить `!xml` у `ClientApplicationInterface` → `Панель.UUID` только для пустого дополнительного `panelDef`; остальные поля и standard UUID запрещены.

- [ ] **Step 8: Запустить тесты интерфейса**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/clientApplicationInterface
```

Expected: PASS; неизвестная именованная панель и configuration-index идентичности размещений остаются зелёными.

- [ ] **Step 9: Commit**

```bash
git add packages/core/metadata/commonObjects/clientApplicationInterface .agents/architecture.md .agents/restrictions.md
git commit -m "fix(core): 🐛 сохранять определения панелей интерфейса"
```

---

### Task 10: Интеграционная проверка и отсутствие новых дублей

**Files:**
- No production files are modified in this task.

**Interfaces:**
- Consumes: все Tasks 1–9.
- Produces: полный набор проверок и round-trip отчёт без изменения пользовательского XML-репозитория.

- [ ] **Step 1: Запустить форматные и типовые проверки изменённых пакетов**

```bash
git diff --check
pnpm type-check
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 2: Запустить полный набор тестов без Stryker**

```bash
pnpm test
pnpm test:architecture
```

Expected: PASS. `pnpm test:architecture:rules` не нужен, если не изменялись `.dependency-cruiser.mjs` и `tools/dependency-cruiser`; Stryker не запускать.

- [ ] **Step 3: Проверить отсутствие новых дублей**

```bash
pnpm duplicates
```

Expected: сообщение подтверждает отсутствие новых дублей относительно
вычисленного `merge-base` между `HEAD` и `develop`. Существующие дубли не
исправлять в рамках этой задачи.

- [ ] **Step 4: Создать отдельный чистый XML-worktree для round-trip**

```bash
VERIFY_XML_ROOT=$(mktemp -d /private/tmp/nkdk-round-trip-compact.XXXXXX)
git -C /Users/nikita/git/round-trip-compact worktree add "$VERIFY_XML_ROOT" HEAD
```

Перед запуском убедиться, что рабочее дерево NKDK чистое после коммитов. Не выполнять `restore`, `reset` или `clean` в `/Users/nikita/git/round-trip-compact`.

- [ ] **Step 5: Проверить `doc` и затем `small` через настоящий round-trip**

```bash
env NKDK_XML_REPO="$VERIFY_XML_ROOT" NKDK_XML_DIR="$VERIFY_XML_ROOT/cf/doc" ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 100
env NKDK_XML_REPO="$VERIFY_XML_ROOT" NKDK_XML_DIR="$VERIFY_XML_ROOT/cf/small" ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 100
```

Expected: расхождения, перечисленные в спецификации, отсутствуют. Если остаются иные ранее не согласованные различия, перечислить их отдельно и не расширять реализацию без нового решения.

- [ ] **Step 6: Удалить временный XML-worktree**

```bash
git -C /Users/nikita/git/round-trip-compact worktree remove "$VERIFY_XML_ROOT"
```

- [ ] **Step 7: Провести итоговую сверку тестов с договорами**

В итоговом отчёте перечислить:

- расширенные тесты обязательного `filter`, DCS nil и `Undefined`;
- добавленные тесты пустых дополнительных колонок и пустого условного оформления;
- добавленные тесты двух новых классов `!xml`;
- переписанную validation-матрицу строк оформления;
- удалённые тесты и две фикстуры прямого оформления с указанием, что договор защищён новой реальной коллекционной фикстурой;
- тесты UsePurposes и пяти standard `panelDef`;
- результат `doc` и `small` round-trip;
- результат `pnpm duplicates`.

---

## Продолжение после диагностического round-trip

Tasks 0–10 уже реализованы и зафиксированы в истории ветки. Текущее
продолжение охватывает только утверждённое исправление порядка XML-свойств
обычного реквизита `ChartOfCharacteristicTypes`. Оба диагностических раздела
про `RowFilter` отложены и не входят в Tasks 11–12. Новые применения `!xml`,
reference XML и configuration index не добавляются; XML-фикстуры не меняются.

### Task 11: Исправить порядок `Indexing` и `Use` у реквизита ПВХ

**Files:**
- Modify: `packages/core/metadata/appliedObjects/__tests__/ownerChildRules.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/childRules.ts`

**Interfaces:**
- Consumes: `metadataRuleFragment`,
  `Attribute.attributeUseFragment.properties` и
  `Attribute.attributeSearchAndHistoryFragment.properties`.
- Produces: локальный фрагмент
  `chartOfCharacteristicTypesAttributeSearchUseAndHistoryFragment` с порядком
  `indexing → use → fullTextSearch → dataHistory`.
- Preserves: общий `attributeUseFragment`, общий
  `attributeSearchAndHistoryFragment`, `composeMetadataItemRule`, порядок
  реквизита каталога и правила реквизитов табличной части ПВХ.

- [ ] **Step 1: Изменить ожидаемый порядок правила и получить падающий тест**

В записи владельца `ChartOfCharacteristicTypes` файла
`ownerChildRules.test.ts` заменить ожидаемый `attributeOrder` на:

```ts
attributeOrder: [
  ...identity,
  ...presentation,
  ...fill,
  ...choice,
  "indexing",
  "use",
  "fullTextSearch",
  "dataHistory",
  "uuid",
],
```

- [ ] **Step 2: Добавить проверку реального порядка сериализации**

В `metadataAttribute/fromYAMLToXML.test.ts` добавить тест рядом с
`exports Use for %s`. Сериализовать минимальный реквизит ПВХ и каталога через
существующие `probeRule`, `testPropertyFromYAMLToXML` и `serializeDirectXML`:

```ts
it("exports owner-specific order for Indexing and Use", () => {
  const serialize = (propertyType: string, itemRule: MetadataItemRule) =>
    serializeDirectXML(
      testPropertyFromYAMLToXML({
        rule: probeRule(propertyType, itemRule),
        yaml: { Значение: { ТестовыйРеквизит: { Тип: "Строка" } } },
      }).xml
    )

  const characteristic = serialize(
    "MetadataChartOfCharacteristicTypesAttributes",
    MetadataChartOfCharacteristicTypesAttributeRules
  )
  const catalog = serialize("MetadataCatalogAttributes", MetadataCatalogAttributeRules)

  expect(characteristic.indexOf("<Indexing>")).toBeLessThan(characteristic.indexOf("<Use>"))
  expect(characteristic.indexOf("<Use>")).toBeLessThan(characteristic.indexOf("<FullTextSearch>"))
  expect(catalog.indexOf("<Use>")).toBeLessThan(catalog.indexOf("<Indexing>"))
})
```

- [ ] **Step 3: Запустить узкие тесты и подтвердить правильное падение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/__tests__/ownerChildRules.test.ts metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts
```

Expected: FAIL — правило и сериализация ПВХ всё ещё ставят `use` перед
`indexing`; проверка неизменившегося порядка каталога проходит.

- [ ] **Step 4: Создать минимальный локальный фрагмент**

В `metadataChartOfCharacteristicTypes/childRules.ts` импортировать
`metadataRuleFragment` и объявить перед экспортируемыми правилами:

```ts
import { metadataRuleFragment } from "../../commonObjects/metadataRuleFragment"

const chartOfCharacteristicTypesAttributeSearchUseAndHistoryFragment = metadataRuleFragment(
  ["indexing", "use", "fullTextSearch", "dataHistory"],
  {
    indexing: Attribute.attributeSearchAndHistoryFragment.properties.indexing,
    use: Attribute.attributeUseFragment.properties.use,
    fullTextSearch: Attribute.attributeSearchAndHistoryFragment.properties.fullTextSearch,
    dataHistory: Attribute.attributeSearchAndHistoryFragment.properties.dataHistory,
  }
)
```

В `MetadataChartOfCharacteristicTypesAttributeRules` заменить
`Attribute.attributeUseFragment` и
`Attribute.attributeSearchAndHistoryFragment` одним локальным фрагментом:

```ts
export const MetadataChartOfCharacteristicTypesAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase,
  Attribute.attributeIdentityFragment,
  Attribute.attributePresentationFragment({
    allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES,
  }),
  Attribute.attributeFillFragment,
  Attribute.attributeChoiceFragment,
  chartOfCharacteristicTypesAttributeSearchUseAndHistoryFragment,
  Attribute.attributeUuidFragment
)
```

Не изменять `MetadataChartOfCharacteristicTypesTabularSectionAttributeRules`
и общие фрагменты.

- [ ] **Step 5: Запустить целевые тесты**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/__tests__/ownerChildRules.test.ts metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts
```

Expected: PASS; точный порядок правила совпадает с XML, сериализация ПВХ
ставит `Indexing` перед `Use`, а каталог сохраняет `Use` перед `Indexing`.

- [ ] **Step 6: Выполнить контроль блока**

```bash
git diff --check
pnpm --filter @nkdk/core type-check
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/childRules.ts packages/core/metadata/appliedObjects/__tests__/ownerChildRules.test.ts packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts
git commit -m "fix: :bug: исправить порядок реквизитов плана видов характеристик"
```

### Task 12: Проверить реализацию без исправления `RowFilter`

**Files:**
- No production files are modified in this task.

**Interfaces:**
- Consumes: результат Task 11.
- Produces: подтверждение отсутствия расхождения ПВХ, новых дублей и регрессий;
  три ранее найденных `RowFilter`-расхождения остаются диагностическим
  остатком.

- [ ] **Step 1: Запустить полные проверки без Stryker**

```bash
git diff --check
pnpm type-check
pnpm test
pnpm test:architecture
```

Expected: все команды завершаются с кодом 0. Stryker и мутационные тесты не
запускать.

- [ ] **Step 2: Проверить отсутствие новых дублей**

```bash
pnpm duplicates
```

Expected: сообщение подтверждает отсутствие новых дублей относительно
вычисленного `merge-base` между `HEAD` и `develop`. Существующие дубли не
исправлять.

- [ ] **Step 3: Создать отдельный чистый XML-worktree**

```bash
VERIFY_CCT_XML_ROOT=$(mktemp -d /private/tmp/nkdk-cct-round-trip.XXXXXX)
git -C /Users/nikita/git/round-trip-compact worktree add "$VERIFY_CCT_XML_ROOT" HEAD
```

Не выполнять `restore`, `reset` или `clean` в активном
`/Users/nikita/git/round-trip-compact`.

- [ ] **Step 4: Запустить полный YAML round-trip только для `cf/doc`**

```bash
env NKDK_XML_REPO="$VERIFY_CCT_XML_ROOT" NKDK_XML_DIR="$VERIFY_CCT_XML_ROOT/cf/doc" ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 100
```

Expected: файл
`ChartsOfCharacteristicTypes/ДополнительныеРеквизитыИСведения.xml` отсутствует
в diff. Остаются только три отложенных файла форм с расхождениями `RowFilter`:

```text
CommonForms/ФормаВариантаОтчета/Ext/Form.xml
DataProcessors/ВыгрузкаЗагрузкаEnterpriseData/Forms/Форма/Ext/Form.xml
DataProcessors/УниверсальныйОбменДаннымиXML/Forms/УправляемаяФорма/Ext/Form.xml
```

Не исправлять и не добавлять в план эти три расхождения.

- [ ] **Step 5: Удалить временный XML-worktree**

```bash
git -C /Users/nikita/git/round-trip-compact worktree remove --force "$VERIFY_CCT_XML_ROOT"
```

Удаляется только созданный на Step 3 временный worktree вместе с
диагностическими diff; исходный `HEAD` XML-репозитория остаётся неизменным.

- [ ] **Step 6: Зафиксировать результат проверки**

В итоговом отчёте перечислить:

- зелёные целевые и полные тесты;
- результат `pnpm duplicates`;
- отсутствие расхождения порядка ПВХ в `cf/doc`;
- три неизменённых и намеренно отложенных расхождения `RowFilter`.
