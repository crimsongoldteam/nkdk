# AppearanceFields String Values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вернуть `dcscor:Field` и ввести однозначный компактный YAML-договор для всех строковых значений `AppearanceFields.Текст` и `AppearanceFields.Формат`.

**Architecture:** Изменение остаётся на границе `AppearanceFields`: XML-экспорт канонизирует существующую DCS-модель, YAML-импорт переводит публичные формы во внутренний договор `SettingsParameterValue`, а JSON Schema описывает те же закрытые варианты. Общие `dcsMetadataValue`, `parameterValue`, правила orchestration и исходные XML-фикстуры не меняются.

**Tech Stack:** TypeScript 7, Vitest 4, TypeBox 1.3, AJV, существующие преобразования NKDK XML/YAML.

## Global Constraints

- Один договор применяется к `Текст` и `Формат`.
- Короткая форма разрешена только для `xs:string` без служебных полей: `Текст: Строка` или `Текст: ""`.
- Многоязычная строка всегда имеет форму `{ Значение: Record<string, string> }`; `Тип` для неё отсутствует.
- Явный `Тип` допускает только `Поле` и `ФорматированнаяСтрока`.
- `{}`, `{ Значение: {} }`, `{ Значение: null }` и `""` имеют разные смыслы и не должны сливаться.
- Допустимые служебные поля: `Использовать`, `РежимОтображения`, `ИдентификаторПользовательскойНастройки`, `ПредставлениеПользовательскойНастройки`.
- `Тип: Поле` проверяется только структурно: `Значение` обязательно является строкой; семантическая проверка пути не входит в задачу.
- Не изменять общий DCS-договор, `BasePropertyRule`, `PropertyRule`, параметры построителей правил и metadata-слои orchestration/validation/project.
- Не применять `!xml` и не изменять существующие XML-фикстуры.
- Следовать TDD: сначала наблюдаемое падение, затем минимальное production-изменение.
- Базовый коммит для проверки новых дублей: `644df4636`.

---

## Структура изменений

- `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXML.ts` — канонический перевод уже импортированной DCS-модели в публичные формы YAML.
- `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/stringValues.ts` — структурная проверка публичного YAML и перевод в существующие формы общего `SettingsParameterValue`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.ts` — закрытое объединение короткой строки и объектных вариантов договора.
- `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.test.ts` — договор XML → YAML, включая регрессию `dcscor:Field` и различение пустых форм.
- `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts` — договор YAML → модель и ошибки структурного импорта.
- `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAMLToXML.test.ts` — договор YAML → XML без reference.
- `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts` — принимаемые и отклоняемые YAML-формы.

Новые production-файлы и новые общие типы не нужны. Экспортную и импортную канонизацию намеренно оставляем раздельными: первая работает с моделью, вторая — с непроверенным YAML.

### Task 1: Канонический XML → YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXML.ts:23-57`

**Interfaces:**
- Consumes: `SettingsParameterValue.value`, уже импортированный общим DCS-слоем как `undefined | null | { type: "string"; value: string } | { items: Record<string, string> } | { type: "Field"; value: string } | { type: "LocalFormattedStringType"; value: { formatted: true; items: Record<string, string> } }`.
- Produces: канонический YAML-параметр — строковый скаляр либо закрытый объект с `Тип?`, `Значение?` и служебными полями.

- [ ] **Step 1: Заменить старую таблицу канонических строк на девять согласованных форм**

В `fromXMLToYAML.test.ts` добавить локальный помощник и таблицу:

```ts
const exportText = (valueXML: unknown): unknown =>
  testPropertyFromXMLToYAML({
    rule: directRule,
    xml: {
      appearance: {
        "dcscor:item": {
          "_xsi:type": "dcsset:SettingsParameterValue",
          "dcscor:parameter": "Текст",
          ...(valueXML === undefined ? {} : { "dcscor:value": valueXML }),
        },
      },
    },
  }).yaml

it.each([
  ["xs:string", { "_xsi:type": "xs:string", "#text": "Строка" }, "Строка"],
  ["empty xs:string", { "_xsi:type": "xs:string", "#text": "" }, ""],
  [
    "LocalStringType",
    { "_xsi:type": "v8:LocalStringType", "v8:item": { "v8:lang": "ru", "v8:content": "Строка" } },
    { Значение: { ru: "Строка" } },
  ],
  ["empty LocalStringType", { "_xsi:type": "v8:LocalStringType" }, { Значение: {} }],
  [
    "Field",
    { "_xsi:type": "dcscor:Field", "#text": "Таблица.Поле" },
    { Тип: "Поле", Значение: "Таблица.Поле" },
  ],
  [
    "LocalFormattedStringType",
    {
      "_xsi:type": "v8:LocalFormattedStringType",
      "v8:lws": { "v8:item": { "v8:lang": "ru", "v8:content": "Строка" } },
      "v8:formatted": true,
    },
    { Тип: "ФорматированнаяСтрока", Значение: { ru: "Строка" } },
  ],
  [
    "empty LocalFormattedStringType",
    { "_xsi:type": "v8:LocalFormattedStringType", "v8:formatted": true },
    { Тип: "ФорматированнаяСтрока", Значение: {} },
  ],
  ["xsi:nil", { "_xsi:nil": true }, { Значение: null }],
  ["missing dcscor:value", undefined, {}],
])("exports %s canonically", (_name, valueXML, expectedYAML) => {
  expect(exportText(valueXML)).toEqual({ Оформление: { Текст: expectedYAML } })
})
```

Старые ожидания голой карты языков, `null` и `{ Форматированный, Текст }` удалить именно из этой таблицы: новый набор защищает все девять различимых форм.

- [ ] **Step 2: Добавить представителей служебных полей**

Добавить один `it.each`, который проверяет обычную строку, многоязычную строку и поле с `dcscor:use: false`. Для каждого ожидается тот же объект с `Использовать: "Ложь"`; у `Поле` сохраняется `Тип: "Поле"`, а значение не получает дополнительной вложенности.

```ts
it.each([
  [{ "_xsi:type": "xs:string", "#text": "Строка" }, { Значение: "Строка", Использовать: "Ложь" }],
  [
    { "_xsi:type": "v8:LocalStringType", "v8:item": { "v8:lang": "ru", "v8:content": "Строка" } },
    { Значение: { ru: "Строка" }, Использовать: "Ложь" },
  ],
  [
    { "_xsi:type": "dcscor:Field", "#text": "Таблица.Поле" },
    { Тип: "Поле", Значение: "Таблица.Поле", Использовать: "Ложь" },
  ],
])("preserves service fields for string form %#", (valueXML, expectedYAML) => {
  const result = testPropertyFromXMLToYAML({
    rule: directRule,
    xml: {
      appearance: {
        "dcscor:item": {
          "_xsi:type": "dcsset:SettingsParameterValue",
          "dcscor:parameter": "Текст",
          "dcscor:use": false,
          "dcscor:value": valueXML,
        },
      },
    },
  }).yaml
  expect(result).toEqual({ Оформление: { Текст: expectedYAML } })
})
```

- [ ] **Step 3: Запустить узкую проверку и подтвердить регрессию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.test.ts --no-isolate
```

Expected: FAIL; `dcscor:Field` падает с `AppearanceFields XML: неподдерживаемое строковое значение`, а старые формы многоязычной, форматированной, nil и отсутствующего значения не совпадают с новым YAML.

- [ ] **Step 4: Реализовать канонизацию модели в объектный договор**

В `fromXML.ts` заменить `exportAppearanceStringValue` на функцию, возвращающую публичную форму целиком:

```ts
const exportAppearanceStringValue = (value: unknown): Record<string, unknown> | string => {
  if (value === undefined) return {}
  if (value === null) return { Значение: null }

  const record = asRecord(value)
  if (record?.type === "string" && typeof record.value === "string") return record.value
  if (record?.type === "Field" && typeof record.value === "string") {
    return { Тип: "Поле", Значение: record.value }
  }
  if (record?.type === "LocalFormattedStringType") {
    const formatted = asRecord(record.value)
    const items = asRecord(formatted?.items)
    if (formatted?.formatted === true && items !== undefined) {
      return { Тип: "ФорматированнаяСтрока", Значение: { ...items } }
    }
  }
  const items = asRecord(record?.items)
  if (items !== undefined) return { Значение: { ...items } }
  throw new Error("AppearanceFields XML: неподдерживаемое строковое значение")
}
```

В `exportAppearanceStringParameter` оставить скаляр только для строки без служебных полей. Для остальных форм получить служебные поля из общего `exported`, удалить из них общий `Тип` и `Значение`, затем объединить с каноническим объектом:

```ts
if (!hasServiceFields) return canonicalValue

const wrapper = asRecord(exported)
const canonicalObject =
  typeof canonicalValue === "string" ? { Значение: canonicalValue } : asRecord(canonicalValue)
if (wrapper === undefined || canonicalObject === undefined) {
  throw new Error("AppearanceFields XML: неверная развёрнутая строка")
}
const { Тип: _type, Значение: _value, ...serviceFields } = wrapper
return { ...canonicalObject, ...serviceFields }
```

Для `undefined`, `null`, LocalStringType, Field и LocalFormattedStringType использовать уже готовый объект. Не добавлять частных условий в общий `parameterValue`.

- [ ] **Step 5: Запустить тест XML → YAML**

Run: та же команда из Step 3.

Expected: PASS; все девять форм и три представителя служебных полей зелёные.

- [ ] **Step 6: Проверить новые дубли и закоммитить слой**

```bash
pnpm duplicates -- --base 644df4636
git add packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.test.ts
git commit -m "fix: :bug: вернуть строковые значения оформления в XML-импорте"
```

Expected: проверка дублей завершается без новых блокирующих совпадений; коммит содержит только XML → YAML слой.

### Task 2: Структурный YAML → модель → XML

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/stringValues.ts`

**Interfaces:**
- Consumes: строковый скаляр либо закрытый объект публичного договора.
- Produces: существующий YAML общего `SettingsParameterValue`: строка; `{ Тип: "МногоязычнаяСтрока", Значение: map }`; `{ Тип: "МногоязычнаяФорматированнаяСтрока", Значение: { Форматированный: "Истина", Текст: map } }`; `{ Тип: "Поле", Значение: string }`; `{ Значение: null }`; либо внутренняя `{ Значение: undefined }` для отсутствующего `dcscor:value`.

- [ ] **Step 1: Переписать положительные проверки YAML → модель**

В `fromYAML.test.ts` заменить проверки голой карты и старой форматированной формы на согласованные формы. Добавить `it.each` с ожидаемыми `Текст.value`:

```ts
it.each([
  ["string", "Строка", { type: "string", value: "Строка" }],
  ["LocalStringType", { Значение: { ru: "Строка" } }, { items: { ru: "Строка" } }],
  ["empty LocalStringType", { Значение: {} }, { items: {} }],
  ["Field", { Тип: "Поле", Значение: "Таблица.Поле" }, { type: "Field", value: "Таблица.Поле" }],
  [
    "LocalFormattedStringType",
    { Тип: "ФорматированнаяСтрока", Значение: { ru: "Строка" } },
    { type: "LocalFormattedStringType", value: { formatted: true, items: { ru: "Строка" } } },
  ],
  ["nil", { Значение: null }, null],
])("imports %s", (_name, yaml, expectedValue) => {
  expect(testAtomicFromYAML({ rule, value: { Текст: yaml } })).toEqual({
    itemType: "AppearanceFields",
    Текст: { parameter: "Текст", value: expectedValue },
  })
})
```

Отдельно проверить `{ Текст: {} }` как `{ parameter: "Текст" }` без свойства `value` и карту языков с ключами `Тип`, `Значение`, `Форматированный` как обычный `LocalStringType` внутри `Значение`.

- [ ] **Step 2: Добавить структурные ошибки импорта**

Добавить таблицу, которая вызывает `testAtomicFromYAML` и ждёт `toThrow(/AppearanceFields YAML/)`:

```ts
it.each([
  [{ Тип: "Неизвестный", Значение: "x" }],
  [{ Тип: "Поле" }],
  [{ Тип: "Поле", Значение: { ru: "x" } }],
  [{ Тип: "ФорматированнаяСтрока", Значение: "x" }],
  [{ Тип: "ФорматированнаяСтрока" }],
  [{ Значение: { ru: 1 } }],
  [{ Значение: "x", Лишнее: true }],
])("rejects invalid appearance string %#", (yaml) => {
  expect(() => testAtomicFromYAML({ rule, value: { Текст: yaml } })).toThrow(/AppearanceFields YAML/)
})
```

Эта проверка нужна независимо от JSON Schema: программный импорт может быть вызван напрямую.

- [ ] **Step 3: Переписать таблицу YAML → XML**

В `fromYAMLToXML.test.ts` заменить значения входной таблицы на:

```ts
[
  ["empty xs:string", "", { "_xsi:type": "xs:string", "#text": "" }],
  ["empty LocalStringType", { Значение: {} }, { "_xsi:type": "v8:LocalStringType" }],
  [
    "empty ru item",
    { Значение: { ru: "" } },
    { "_xsi:type": "v8:LocalStringType", "v8:item": [{ "v8:lang": "ru", "v8:content": "" }] },
  ],
  [
    "Field",
    { Тип: "Поле", Значение: "Таблица.Поле" },
    { "_xsi:type": "dcscor:Field", "#text": "Таблица.Поле" },
  ],
  [
    "empty LocalFormattedStringType",
    { Тип: "ФорматированнаяСтрока", Значение: {} },
    { "_xsi:type": "v8:LocalFormattedStringType", "v8:lws": { "v8:item": [] }, "v8:formatted": true },
  ],
  ["xsi:nil", { Значение: null }, { "_xsi:nil": true }],
]
```

Добавить самостоятельный тест `{ Текст: {} }`, который ожидает `dcscor:item` без `dcscor:value`. Сохранить проверку многоязычной строки со служебным `Использовать: "Ложь"`, но оставить карту внутри `Значение`.

- [ ] **Step 4: Запустить обе узкие проверки и увидеть падение старого нормализатора**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAMLToXML.test.ts --no-isolate
```

Expected: FAIL; текущий код запрещает `Тип`, трактует `{}` как LocalStringType и не переводит новую форматированную форму.

- [ ] **Step 5: Реализовать закрытый структурный нормализатор**

В `stringValues.ts` заменить эвристику `expandedKeys`/`normalizeRawStringValue` явным разбором:

```ts
const serviceKeys = new Set([
  "Использовать",
  "РежимОтображения",
  "ИдентификаторПользовательскойНастройки",
  "ПредставлениеПользовательскойНастройки",
])
const publicKeys = new Set(["Тип", "Значение", ...serviceKeys])

const assertLanguageMap = (value: unknown): Record<string, string> => {
  const record = asRecord(value)
  if (record === undefined || Object.values(record).some((item) => typeof item !== "string")) {
    throw new Error("AppearanceFields YAML: Значение многоязычной строки должно быть картой строк")
  }
  return record as Record<string, string>
}
```

`normalizeStringParameter` должен выполнять ветви строго в таком порядке:

```ts
if (typeof yaml === "string") return yaml
const record = asRecord(yaml)
if (record === undefined) throw new Error("AppearanceFields YAML: строковое значение должно быть строкой или объектом")
if (Object.keys(record).some((key) => !publicKeys.has(key))) {
  throw new Error("AppearanceFields YAML: неизвестное поле строкового значения")
}

const { Тип: type, Значение: value, ...serviceFields } = record
const hasValue = Object.prototype.hasOwnProperty.call(record, "Значение")

if (type === "Поле") {
  if (!hasValue || typeof value !== "string") throw new Error("AppearanceFields YAML: Поле требует строковое Значение")
  return { ...serviceFields, Тип: "Поле", Значение: value }
}
if (type === "ФорматированнаяСтрока") {
  const items = assertLanguageMap(value)
  return {
    ...serviceFields,
    Тип: "МногоязычнаяФорматированнаяСтрока",
    Значение: { Форматированный: "Истина", Текст: items },
  }
}
if (type !== undefined) throw new Error("AppearanceFields YAML: неизвестный Тип строкового значения")
if (!hasValue) return { ...serviceFields, Значение: undefined }
if (value === null || typeof value === "string") return { ...serviceFields, Значение: value }
return { ...serviceFields, Тип: "МногоязычнаяСтрока", Значение: assertLanguageMap(value) }
```

`{ Значение: undefined }` — только внутренний переходник на границе `AppearanceFields`: он заставляет существующий `parameterValue/fromYAML.ts` распознать полную форму, но не создаёт `value` в модели и не попадает в сериализованный YAML. Не добавлять новый служебный ключ в общие типы.

- [ ] **Step 6: Запустить YAML → модель → XML проверки**

Run: команда из Step 4.

Expected: PASS; особенно различаются `""`, `{}`, `{ Значение: {} }` и `{ Значение: null }`.

- [ ] **Step 7: Запустить совместно оба преобразовательных слоя**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAMLToXML.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 8: Проверить новые дубли и закоммитить слой**

```bash
pnpm duplicates -- --base 644df4636
git add packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/stringValues.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAMLToXML.test.ts
git commit -m "feat: :sparkles: различать формы строк оформления в YAML"
```

### Task 3: JSON Schema нового договора

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.ts:85-103,153-170`

**Interfaces:**
- Consumes: публичные формы YAML из спецификации.
- Produces: закрытая TypeBox schema, одинаковая для `Текст` и `Формат`, без семантической проверки пути поля.

- [ ] **Step 1: Обновить принимаемые формы schema**

В положительной таблице `toJSONSchema.test.ts` оставить строки и заменить объектные варианты:

```ts
it.each([
  "",
  "Строка",
  {},
  { Значение: {} },
  { Значение: { ru: "Строка" } },
  { Значение: { Тип: "язык Тип", Значение: "язык Значение", Форматированный: "язык Форматированный" } },
  { Тип: "Поле", Значение: "Таблица.Поле" },
  { Тип: "ФорматированнаяСтрока", Значение: {} },
  { Значение: null },
  { Использовать: "Ложь", Значение: { ru: "Строка" } },
  { Тип: "Поле", Значение: "Таблица.Поле", Использовать: "Ложь" },
])("accepts canonical appearance string value %#", (value) => {
  expect(compiledAppearanceFieldsSchema.Check({ Текст: value })).toBe(true)
  expect(compiledAppearanceFieldsSchema.Check({ Формат: value })).toBe(true)
})
```

- [ ] **Step 2: Обновить отклоняемые формы schema**

Проверить неизвестный `Тип`, старые голые карты, старую форматированную форму, неправильный тип значения и лишние поля:

```ts
it.each([
  null,
  { ru: "x" },
  { Тип: "МногоязычнаяСтрока", Значение: { ru: "x" } },
  { Тип: "Поле" },
  { Тип: "Поле", Значение: { ru: "x" } },
  { Тип: "ФорматированнаяСтрока", Значение: "x" },
  { Форматированный: "Истина", Текст: {} },
  { Значение: { ru: 1 } },
  { Значение: "x", Лишнее: true },
])("rejects non-canonical appearance string value %#", (value) => {
  expect(compiledAppearanceFieldsSchema.Check({ Текст: value })).toBe(false)
  expect(compiledAppearanceFieldsSchema.Check({ Формат: value })).toBe(false)
})
```

`null` на верхнем уровне отклоняется: nil представлен только как `{ Значение: null }`.

- [ ] **Step 3: Запустить schema-тест и подтвердить падение**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts --no-isolate
```

Expected: FAIL; текущая schema принимает голую карту и верхнеуровневый `null`, но не принимает `Тип: Поле`.

- [ ] **Step 4: Заменить эвристическую schema закрытым объединением**

В `toJSONSchema.ts` определить карту языков без зарезервированных имён и общие служебные свойства:

```ts
const LanguageMapJSONSchema = Type.Record(Type.String(), Type.String(), { additionalProperties: false })

const appearanceStringServiceProperties = (context: ConfigurationContext) => ({
  Использовать: Type.Optional(Type.Literal("Ложь")),
  РежимОтображения: Type.Optional(
    requiredSystemEnumerationJSONSchema(context, "DataCompositionSettingsItemViewMode")
  ),
  ИдентификаторПользовательскойНастройки: Type.Optional(Type.String()),
  ПредставлениеПользовательскойНастройки: Type.Optional(I8nTextJSONSchema),
})
```

После объявления `requiredSystemEnumerationJSONSchema` собрать три закрытых объектных варианта:

```ts
const appearanceStringPropertySchema = (context: ConfigurationContext): TSchema => {
  const service = appearanceStringServiceProperties(context)
  return Type.Optional(
    Type.Union([
      Type.String(),
      Type.Object(
        {
          ...service,
          Значение: Type.Optional(Type.Union([Type.String(), LanguageMapJSONSchema, Type.Null()])),
        },
        { additionalProperties: false }
      ),
      Type.Object(
        { ...service, Тип: Type.Literal("Поле"), Значение: Type.String() },
        { additionalProperties: false }
      ),
      Type.Object(
        { ...service, Тип: Type.Literal("ФорматированнаяСтрока"), Значение: LanguageMapJSONSchema },
        { additionalProperties: false }
      ),
    ])
  )
}
```

Удалить `FormattedLanguageMapJSONSchema` и старый `AppearanceStringValueJSONSchema`. Не добавлять resolver поля: schema поля проверяет только строковую структуру.

- [ ] **Step 5: Запустить schema-тест и все тесты AppearanceFields**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/appearanceFields --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Проверить новые дубли и закоммитить schema**

```bash
pnpm duplicates -- --base 644df4636
git add packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts
git commit -m "feat: :sparkles: описать формы строк оформления в JSON Schema"
```

### Task 4: Полная проверка и ERP round-trip

**Files:**
- Verify only: production-код и тесты из Tasks 1–3
- Reference data: `/Users/nikita/git/round-trip-compact/cf/erp`

**Interfaces:**
- Consumes: завершённые три слоя и базовый коммит `644df4636`.
- Produces: подтверждение локальных, проектных и реальных ERP-договоров; новых файлов кода не создаёт.

- [ ] **Step 1: Проверить типы**

```bash
pnpm type-check
```

Expected: exit 0 без ошибок TypeScript.

- [ ] **Step 2: Запустить полный набор тестов**

```bash
pnpm test
```

Expected: exit 0 во всех `packages/*`.

- [ ] **Step 3: Запустить архитектурную проверку**

```bash
pnpm test:architecture
```

Expected: exit 0; общие metadata-слои не получили зависимостей от `AppearanceFields`.

- [ ] **Step 4: Выполнить итоговую проверку новых дублей**

```bash
pnpm duplicates -- --base 644df4636
```

Expected: exit 0 без новых блокирующих дублей.

- [ ] **Step 5: Повторить `round-trip-yaml` для ERP**

Сначала прочитать актуальный `.agents/skills/round-trip-yaml/SKILL.md`, затем выполнить triage на `/Users/nikita/git/round-trip-compact/cf/erp` по инструкции навыка. Ожидаемый результат для этого изменения: импорт больше не выдаёт `AppearanceFields XML: неподдерживаемое строковое значение`; исходный `dcscor:Field` сохраняется как `Тип: Поле` и возвращается в `dcscor:Field` без зависимости от reference.

Если triage покажет следующие, не связанные с этой спецификацией расхождения, зафиксировать их отдельно и не расширять реализацию без нового согласования.

- [ ] **Step 6: Проверить состав изменений и итоговые коммиты**

```bash
git status --short
git diff --check 644df4636..HEAD
git log --oneline 644df4636..HEAD
```

Expected: рабочее дерево чистое; `git diff --check` не сообщает ошибок; история содержит три узких implementation-коммита. В итоговом отчёте перечислить изменённые тесты и уникальный договор каждого, как требует `.agents/testing.md`.
