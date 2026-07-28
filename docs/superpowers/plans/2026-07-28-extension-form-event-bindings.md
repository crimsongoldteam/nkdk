# Привязки событий формы расширения — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Поддержать компактный YAML для нескольких обработчиков одного события формы расширения с `callType`, не изменив строковое представление обычных событий и сохранив точный порядок XML.

**Architecture:** Поведение остаётся внутри существующего property-типа `Events`. Внутренняя модель различает обычный обработчик и набор режимов вызова, а снимок адресует каждую XML-привязку составным ключом `имя события + callType`. Правила конкретных элементов формы и общие metadata-слои не получают условий по XML-тегам или расширениям.

**Tech Stack:** TypeScript 6, Vitest 4, TypeBox, существующий реестр обработчиков property-типов и снимок конфигурации.

## Global Constraints

- Не изменять существующие XML-фикстуры.
- Сохранить YAML обычного события в виде строки: `ПриИзменении: Обработчик`.
- Объект с `Перед`/`После`/`Вместо` использовать только для XML-событий с `callType`.
- Поддержать только `Before`, `After`, `Override`; режим `Auto` не добавлять.
- Не копировать события основной формы в `BaseForm`; это реализуется во втором плане.
- Не добавлять знания об `Event`, `callType` или `cfe` в `metadata/orchestration`.
- Не изменять пользовательский файл `packages/mcp/README.md`.
- Перед завершением выполнить `pnpm type-check` и `pnpm test` из корня worktree.

---

## File Map

- `packages/core/metadata/forms/commonObjects/event/types.ts` — внутренняя, XML- и YAML-модели события.
- `packages/core/metadata/forms/commonObjects/event/callType.ts` — двустороннее соответствие режимов и составной ключ привязки.
- `packages/core/metadata/forms/commonObjects/event/callType.test.ts` — проверка соответствия и устойчивого ключа.
- `packages/core/metadata/forms/commonObjects/event/fromXML.ts` — группировка XML-привязок и запись составного порядка в снимок.
- `packages/core/metadata/forms/commonObjects/event/fromXML.test.ts` — импорт обычного события и нескольких `callType`.
- `packages/core/metadata/forms/commonObjects/event/toYAML.ts` — компактное русское представление режимов.
- `packages/core/metadata/forms/commonObjects/event/fromYAML.ts` — обратное преобразование YAML.
- `packages/core/metadata/forms/commonObjects/event/yaml.test.ts` — двусторонний договор YAML.
- `packages/core/metadata/forms/commonObjects/event/toJSONSchema.ts` — объединение строки и объекта режимов.
- `packages/core/metadata/forms/commonObjects/event/toJSONSchema.test.ts` — проверка допустимых и запрещённых значений.
- `packages/core/metadata/forms/commonObjects/event/toXML.ts` — разворачивание привязок и восстановление порядка.
- `packages/core/metadata/forms/commonObjects/event/toXML.test.ts` — XML, `callType`, aliases и порядок.
- `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts` — интеграция событий элемента формы со снимком.

---

### Task 1: Ввести явную модель привязки события

**Files:**

- Modify: `packages/core/metadata/forms/commonObjects/event/types.ts`
- Create: `packages/core/metadata/forms/commonObjects/event/callType.ts`
- Create: `packages/core/metadata/forms/commonObjects/event/callType.test.ts`

**Interfaces:**

- Consumes: XML `Event` с `_name`, необязательным `_callType` и `#text`.
- Produces: `Events = Record<string, string | EventCallHandlers>`.
- Produces: устойчивый составной ключ только для снимка и восстановления порядка.

- [ ] **Step 1: Написать тесты отображения режимов**

В `callType.test.ts` зафиксировать:

```ts
describe("event call type", () => {
  it.each([
    ["Before", "Перед"],
    ["After", "После"],
    ["Override", "Вместо"],
  ] as const)("сопоставляет %s и %s", (xml, yaml) => {
    expect(eventCallTypeToYAML(xml)).toBe(yaml)
    expect(eventCallTypeFromYAML(yaml)).toBe(xml)
  })

  it("строит разные ключи для одного события с разными режимами", () => {
    expect(eventBindingKey("onChange")).not.toBe(
      eventBindingKey("onChange", "Before")
    )
    expect(eventBindingKey("onChange", "Before")).not.toBe(
      eventBindingKey("onChange", "After")
    )
  })

  it("восстанавливает событие и режим из ключа", () => {
    expect(parseEventBindingKey(eventBindingKey("onChange", "Override")))
      .toEqual({ eventKey: "onChange", callType: "Override" })
  })
})
```

Ключ кодировать без неоднозначного строкового разделителя, например JSON-массивом:

```ts
export const eventBindingKey = (
  eventKey: string,
  callType?: EventCallTypeXML
): string => JSON.stringify([eventKey, callType ?? null])
```

- [ ] **Step 2: Запустить тест и подтвердить отсутствие реализации**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/event/callType.test.ts
```

Expected: FAIL из-за отсутствующего `callType.ts`.

- [ ] **Step 3: Расширить типы события**

В `types.ts` задать:

```ts
export const EVENT_CALL_TYPES_XML = ["Before", "After", "Override"] as const
export const EVENT_CALL_TYPES_YAML = ["Перед", "После", "Вместо"] as const

export type EventCallTypeXML = (typeof EVENT_CALL_TYPES_XML)[number]
export type EventCallTypeYAML = (typeof EVENT_CALL_TYPES_YAML)[number]

export interface EventXML {
  _name: string
  _callType?: EventCallTypeXML
  "#text": string
}

export type EventCallHandlers = Partial<Record<EventCallTypeXML, string>>
export type EventCallHandlersYAML = Partial<Record<EventCallTypeYAML, string>>
export type Events = Record<string, string | EventCallHandlers>
export type EventsYAML = Record<string, string | EventCallHandlersYAML>
```

`EventedXML.Events` привести к существующей оболочке `EventsXML`, не менять структуру самого XML.

- [ ] **Step 4: Реализовать двустороннее соответствие и составной ключ**

В `callType.ts`:

```ts
const yamlByXML = {
  Before: "Перед",
  After: "После",
  Override: "Вместо",
} as const satisfies Record<EventCallTypeXML, EventCallTypeYAML>

export function eventCallTypeToYAML(value: EventCallTypeXML): EventCallTypeYAML
export function eventCallTypeFromYAML(value: EventCallTypeYAML): EventCallTypeXML
export function eventBindingKey(
  eventKey: string,
  callType?: EventCallTypeXML
): string
export function parseEventBindingKey(key: string): {
  eventKey: string
  callType?: EventCallTypeXML
}
```

`parseEventBindingKey` обязан отклонять массив неверной длины, пустое имя события и неизвестный `callType`.

- [ ] **Step 5: Запустить тесты типов**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/event/callType.test.ts
```

Expected: PASS.

- [ ] **Step 6: Закоммитить модель**

```bash
git add \
  packages/core/metadata/forms/commonObjects/event/types.ts \
  packages/core/metadata/forms/commonObjects/event/callType.ts \
  packages/core/metadata/forms/commonObjects/event/callType.test.ts
git commit -m "feat: :sparkles: описать режимы вызова событий формы"
```

---

### Task 2: Импортировать XML-привязки без потери одноимённых событий

**Files:**

- Modify: `packages/core/metadata/forms/commonObjects/event/fromXML.ts`
- Create: `packages/core/metadata/forms/commonObjects/event/fromXML.test.ts`

**Interfaces:**

- Consumes: `EventsXML`.
- Produces: обычная строка либо объект обработчиков по XML-режимам.
- Produces: aliases и порядок снимка по `eventBindingKey`.

- [ ] **Step 1: Написать тест импорта нескольких обработчиков**

```ts
it("собирает обработчики одного события по callType", () => {
  const result = importEventsFromXML(
    mockContextFromXML(),
    onChangeRule,
    {
      Event: [
        { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
        { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
        { _name: "StartChoice", _callType: "Override", "#text": "ВместоВыбора" },
      ],
    }
  )

  expect(result).toEqual({
    onChange: {
      Before: "ПередИзменением",
      After: "ПослеИзменения",
    },
    startChoice: {
      Override: "ВместоВыбора",
    },
  })
})
```

Добавить соседний тест, что XML без `_callType` по-прежнему даёт:

```ts
{ onChange: "ПриИзменении" }
```

- [ ] **Step 2: Написать тест порядка снимка**

Создать контекст с `ConfigurationIndexCollector`, вызвать зарегистрированный сборщик `Events` и проверить:

```ts
expect(node.order).toEqual([
  eventBindingKey("onChange", "Before"),
  eventBindingKey("onChange", "After"),
  eventBindingKey("startChoice", "Override"),
])
```

Проверить alias необычного XML-имени по тому же составному ключу.

- [ ] **Step 3: Запустить тесты и подтвердить перезапись**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/event/fromXML.test.ts
```

Expected: FAIL — текущий `Record<string, string>` оставляет только последний `OnChange`.

- [ ] **Step 4: Сгруппировать привязки**

В `importEventsFromXML`:

- обычный `Event` сохранять строкой;
- `Event` с `_callType` сохранять в объекте под соответствующим XML-режимом;
- не смешивать строку и объект для одного канонического события: выдавать понятную ошибку о противоречивом XML;
- повтор одной пары `имя + callType` также считать противоречивым XML;
- WeakMap aliases адресовать через `eventBindingKey`, а не только через имя события.

Возвращаемый тип заменить на `Events | undefined`, убрать `any` при чтении `_name`, `_callType`, `#text`.

- [ ] **Step 5: Перевести сбор порядка на составные ключи**

В `collectConfigurationIndexFromXML`:

```ts
const bindingKey = eventBindingKey(key, event._callType)
```

И `order`, и aliases записывать по `bindingKey`. Не добавлять отдельное поле снимка.

- [ ] **Step 6: Запустить тесты импорта**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/event/fromXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Закоммитить импорт**

```bash
git add \
  packages/core/metadata/forms/commonObjects/event/fromXML.ts \
  packages/core/metadata/forms/commonObjects/event/fromXML.test.ts
git commit -m "feat: :sparkles: импортировать привязки событий расширения"
```

---

### Task 3: Реализовать компактный YAML и его схему

**Files:**

- Modify: `packages/core/metadata/forms/commonObjects/event/toYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/event/fromYAML.ts`
- Create: `packages/core/metadata/forms/commonObjects/event/yaml.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/event/toJSONSchema.ts`
- Create: `packages/core/metadata/forms/commonObjects/event/toJSONSchema.test.ts`

**Interfaces:**

- Consumes: внутренние ключи событий и XML-режимы.
- Produces: русские имена событий и `Перед`/`После`/`Вместо`.
- Produces: JSON Schema `string | callType object`.

- [ ] **Step 1: Написать двусторонний тест YAML**

```ts
const model = {
  onChange: {
    Before: "allext_КодПриИзмененииПеред",
    After: "allext_КодПриИзмененииПосле",
  },
  startChoice: {
    Override: "allext_КодНачалоВыбораВместо",
  },
}

const yaml = {
  ПриИзменении: {
    Перед: "allext_КодПриИзмененииПеред",
    После: "allext_КодПриИзмененииПосле",
  },
  НачалоВыбора: {
    Вместо: "allext_КодНачалоВыбораВместо",
  },
}

expect(exportEventsToYAML(context, rule, model)).toEqual(yaml)
expect(importEventsFromYAML(context, rule, yaml)).toEqual(model)
```

Добавить строковый случай и неизвестное XML/YAML-имя события, сохранив прежнее поведение aliases.

- [ ] **Step 2: Написать тест схемы**

Скомпилировать схему `Events` и проверить:

```ts
expect(Check({ ПриИзменении: "Обработчик" })).toBe(true)
expect(Check({ ПриИзменении: { Перед: "Перед", После: "После" } })).toBe(true)
expect(Check({ ПриИзменении: { Вместо: "Вместо" } })).toBe(true)
expect(Check({ ПриИзменении: { Auto: "Обработчик" } })).toBe(false)
expect(Check({ ПриИзменении: {} })).toBe(false)
expect(Check({ ПриИзменении: { Перед: 1 } })).toBe(false)
```

- [ ] **Step 3: Запустить тесты и подтвердить ошибки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/forms/commonObjects/event/yaml.test.ts \
  metadata/forms/commonObjects/event/toJSONSchema.test.ts
```

Expected: FAIL — текущие обработчики и схема принимают только строки.

- [ ] **Step 4: Реализовать преобразование YAML**

В `toYAML.ts` и `fromYAML.ts` вынести маленькие функции преобразования одного значения:

```ts
function eventValueToYAML(
  value: string | EventCallHandlers
): string | EventCallHandlersYAML

function eventValueFromYAML(
  value: unknown
): string | EventCallHandlers | undefined
```

Пустой объект режимов не возвращать. Неизвестный режим не пропускать как произвольное событие: ошибка должна указывать имя события и режим.

- [ ] **Step 5: Реализовать объединённую схему**

Для каждого известного YAML-события использовать:

```ts
Type.Optional(Type.Union([
  Type.String(),
  Type.Object({
    Перед: Type.Optional(Type.String()),
    После: Type.Optional(Type.String()),
    Вместо: Type.Optional(Type.String()),
  }, {
    additionalProperties: false,
    minProperties: 1,
  }),
]))
```

Сохранить `additionalProperties: false` на уровне списка известных событий.

- [ ] **Step 6: Запустить YAML-тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/forms/commonObjects/event/yaml.test.ts \
  metadata/forms/commonObjects/event/toJSONSchema.test.ts
```

Expected: PASS.

- [ ] **Step 7: Закоммитить YAML-договор**

```bash
git add \
  packages/core/metadata/forms/commonObjects/event/toYAML.ts \
  packages/core/metadata/forms/commonObjects/event/fromYAML.ts \
  packages/core/metadata/forms/commonObjects/event/yaml.test.ts \
  packages/core/metadata/forms/commonObjects/event/toJSONSchema.ts \
  packages/core/metadata/forms/commonObjects/event/toJSONSchema.test.ts
git commit -m "feat: :sparkles: добавить режимы событий в YAML"
```

---

### Task 4: Выгружать `callType` и восстанавливать точный порядок

**Files:**

- Modify: `packages/core/metadata/forms/commonObjects/event/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/event/toXML.test.ts`

**Interfaces:**

- Consumes: `Events`, aliases и порядок составных ключей из снимка.
- Produces: плоский массив XML `Event` в исходном порядке.

- [ ] **Step 1: Добавить тест XML-выгрузки**

```ts
expect(exportEventsToXML(context, rule, {
  onChange: {
    Before: "ПередИзменением",
    After: "ПослеИзменения",
  },
  startChoice: {
    Override: "ВместоВыбора",
  },
})).toEqual({
  Event: [
    { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
    { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
    { _name: "StartChoice", _callType: "Override", "#text": "ВместоВыбора" },
  ],
})
```

Контекст теста должен содержать порядок составных ключей. Добавить случай без снимка: детерминированный порядок режимов `Before`, `After`, `Override`.

- [ ] **Step 2: Добавить тест смешанного порядка**

Проверить точное восстановление:

```text
OnChange/After
StartChoice/Override
OnChange/Before
```

Обычное событие без `callType` должно участвовать в том же списке и не получать `_callType`.

- [ ] **Step 3: Запустить тест и подтвердить отсутствие `_callType`**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/event/toXML.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Развернуть внутренние события в привязки**

Перед сортировкой сформировать:

```ts
interface EventBinding {
  readonly key: string
  readonly eventKey: string
  readonly callType?: EventCallTypeXML
  readonly handler: string
}
```

Для строки создать одну привязку без `callType`, для объекта — по одной привязке на заполненный режим.

Сортировать привязки:

1. по составному порядку снимка;
2. затем неизвестные снимку события по имени;
3. режимы одного нового события — `Before`, `After`, `Override`.

XML-имя получать по alias составного ключа, затем по известному правилу события, затем через `capitalize`.

- [ ] **Step 5: Записать новый порядок в collector**

В `setOrder` передавать только `bindings.map(({ key }) => key)`. Строковый ключ события без `callType` также должен быть составным, чтобы весь список использовал один договор.

- [ ] **Step 6: Запустить тесты событий**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/event
```

Expected: PASS.

- [ ] **Step 7: Закоммитить XML-выгрузку**

```bash
git add \
  packages/core/metadata/forms/commonObjects/event/toXML.ts \
  packages/core/metadata/forms/commonObjects/event/toXML.test.ts
git commit -m "feat: :sparkles: выгружать режимы событий расширения"
```

---

### Task 5: Проверить интеграцию события элемента формы

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`

**Interfaces:**

- Consumes: форма с двумя `OnChange`, отличающимися `callType`.
- Produces: YAML элемента формы и XML после обратного преобразования.

- [ ] **Step 1: Добавить интеграционный тест без изменения XML-фикстуры**

Собрать XML непосредственно в тесте либо клонировать существующий объект формы в памяти. Для одного `InputField` задать:

```ts
Events: {
  Event: [
    { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
    { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
    { _name: "StartChoice", _callType: "Override", "#text": "ВместоВыбора" },
  ],
}
```

Проверить YAML:

```ts
События: {
  ПриИзменении: {
    Перед: "ПередИзменением",
    После: "ПослеИзменения",
  },
  НачалоВыбора: {
    Вместо: "ВместоВыбора",
  },
}
```

Затем выполнить обратное преобразование с собранным снимком и сравнить `Events` побайтово эквивалентным объектом, включая порядок.

- [ ] **Step 2: Запустить интеграционный тест формы**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
```

Expected: PASS.

- [ ] **Step 3: Запустить проверки пакета core**

Run:

```bash
pnpm --filter @nkdk/core test
pnpm type-check
```

Expected: PASS.

- [ ] **Step 4: Закоммитить интеграционный тест**

```bash
git add packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
git commit -m "test: :white_check_mark: проверить события формы расширения"
```

- [ ] **Step 5: Не выполнять полный round-trip отдельно**

Полный `XML → YAML → XML` выполняется после реализации проекции `BaseForm` по следующему плану. На этом этапе достаточно тестов property-типа и формы: ожидаемые 59 расхождений `BaseForm` ещё не устранены.
