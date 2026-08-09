# Mobile Permissions Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранить требуемые мобильные разрешения и сообщения разрешений конфигурации в полном XML → YAML → XML round-trip без потери порядка, повторов и локализованных описаний.

**Architecture:** Два атомарных специализированных типа владеют XML-контейнерами `RequiredMobileApplicationPermissions` и `UsedMobileApplicationFunctionalities`. Они переиспользуют существующие преобразователи boolean и `I8nText`, а общие типы правил и orchestration не меняются; отсутствующий YAML вычисляется специализированными экспортёрами из канонических неявных значений.

**Tech Stack:** TypeScript 7, TypeBox, Vitest, pnpm, существующий metadata orchestration NKDK.

## Global Constraints

- Не изменять существующие XML-фикстуры: они остаются источником истины.
- YAML-контракт `ИспользуемаяФункциональностьМобильногоПриложения` сразу меняется с массива на объект; прежний массив не поддерживается.
- Ключи YAML: `ТребуемыеРазрешенияМобильногоПриложения`, `ИспользуемаяФункциональностьМобильногоПриложения`, `Функциональности`, `СообщенияРазрешений`, `Разрешение`, `Использовать`, `Описание`.
- `PermissionGroupPhone`, `PermissionGroupCallLog`, `PermissionGroupSMS` и `PostNotifications` остаются в YAML без перевода и фиксируются в `.agents/restrictions.md`.
- Обе коллекции разрешений сохраняют исходный порядок и повторы; `Функциональности` остаются компактным списком отклонений от 38 clean-значений.
- `Описание` обязательно, использует существующий `I8nText`; пустая строка и пустой объект разрешены.
- В XML сначала идут все `app:functionality`, затем все `app:permissionMessage`; поля каждого элемента следуют `xs:sequence`.
- `!xml`, новые общие построители коллекций и изменения `BasePropertyRule`/`PropertyRule` запрещены.
- Отсутствующий YAML удаляет отличающиеся данные reference XML и восстанавливает пустые требуемые разрешения либо clean-функциональности без сообщений.
- Базовый коммит проверки дублей: `6822e97f5`.
- Спецификация: `docs/superpowers/specs/2026-08-08-mobile-permissions-round-trip-design.md`.

---

## File Map

- Modify: `packages/core/metadata/systemEnumerations/types.ts` — два независимых XML/YAML-словаря разрешений.
- Create: `packages/core/metadata/appliedObjects/configuration/mobileApplicationPermissionsEnumerations.test.ts` — полнота и обратимость словарей, четыре непереводимых значения.
- Modify: `.agents/restrictions.md` — явно согласованное исключение перевода.
- Create: `packages/core/metadata/appliedObjects/configuration/requiredMobileApplicationPermissions.ts` — модель, XML/YAML/JSON Schema и регистрация требуемых разрешений.
- Create: `packages/core/metadata/appliedObjects/configuration/requiredMobileApplicationPermissions.test.ts` — узкие договоры требуемых разрешений.
- Modify: `packages/core/metadata/appliedObjects/configuration/builders.ts` — builder нового атомарного типа.
- Modify: `packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.ts` — объектный YAML-контракт и сообщения разрешений.
- Create: `packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.test.ts` — узкие договоры функциональностей и сообщений.
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts` — подключение обоих типов и их неявных значений.
- Modify: `packages/core/metadata/appliedObjects/configuration/fromXMLToYAMLToXML.test.ts` — интеграционный договор Configuration, reference XML и семь реальных сообщений.

---

### Task 1: Системные перечисления мобильных разрешений

**Files:**
- Modify: `packages/core/metadata/systemEnumerations/types.ts:2555`
- Create: `packages/core/metadata/appliedObjects/configuration/mobileApplicationPermissionsEnumerations.test.ts`
- Modify: `.agents/restrictions.md`

**Interfaces:**
- Consumes: таблицы «Сообщения разрешений» и «Требуемые разрешения» из согласованной спецификации.
- Produces: `RequiredMobileApplicationPermissionMessagesToYAML`, `RequiredMobileApplicationPermissionMessagesFromYAML`, `RequiredMobileApplicationPermissionMessages`, `RequiredMobileApplicationPermissionMessagesYAML`, `RequiredMobileApplicationPermissionsToYAML`, `RequiredMobileApplicationPermissionsFromYAML`, `RequiredMobileApplicationPermissions`, `RequiredMobileApplicationPermissionsYAML`.

- [ ] **Step 1: Write the failing enumeration contract test**

Создать тест, который проверяет полную обратимость обоих словарей и отдельно четыре непереводимых значения:

```ts
import { describe, expect, it } from "vitest"
import {
  RequiredMobileApplicationPermissionMessagesFromYAML,
  RequiredMobileApplicationPermissionMessagesToYAML,
  RequiredMobileApplicationPermissionsFromYAML,
  RequiredMobileApplicationPermissionsToYAML,
} from "../../systemEnumerations/types"

const expectInverseMappings = (toYAML: Record<string, string>, fromYAML: Record<string, string>) => {
  expect(Object.keys(fromYAML)).toHaveLength(Object.keys(toYAML).length)
  for (const [xml, yaml] of Object.entries(toYAML)) expect(fromYAML[yaml]).toBe(xml)
}

describe("mobile application permission enumerations", () => {
  it("keeps both XML/YAML tables complete and invertible", () => {
    expectInverseMappings(
      RequiredMobileApplicationPermissionMessagesToYAML,
      RequiredMobileApplicationPermissionMessagesFromYAML
    )
    expectInverseMappings(RequiredMobileApplicationPermissionsToYAML, RequiredMobileApplicationPermissionsFromYAML)
    expect(Object.keys(RequiredMobileApplicationPermissionMessagesToYAML)).toHaveLength(21)
    expect(Object.keys(RequiredMobileApplicationPermissionsToYAML)).toHaveLength(39)
  })

  it.each(["PermissionGroupPhone", "PermissionGroupCallLog", "PermissionGroupSMS", "PostNotifications"])(
    "keeps %s untranslated wherever it is allowed",
    (value) => {
      expect(RequiredMobileApplicationPermissionsToYAML[value]).toBe(value)
      expect(RequiredMobileApplicationPermissionsFromYAML[value]).toBe(value)
      expect(RequiredMobileApplicationPermissionMessagesToYAML[value]).toBe(value)
      expect(RequiredMobileApplicationPermissionMessagesFromYAML[value]).toBe(value)
    }
  )
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configuration/mobileApplicationPermissionsEnumerations.test.ts
```

Expected: FAIL because the eight exported maps/types do not exist.

- [ ] **Step 3: Add the two exact mapping pairs**

В `systemEnumerations/types.ts` рядом с `MobileApplicationFunctionalities` добавить две пары `as const`. Все пары XML/YAML взять дословно и исчерпывающе из двух таблиц спецификации; размеры после добавления обязаны быть 21 и 39, что защищено тестом. После каждой пары определить типы:

```ts
export type RequiredMobileApplicationPermissionMessages =
  keyof typeof RequiredMobileApplicationPermissionMessagesToYAML
export type RequiredMobileApplicationPermissionMessagesYAML =
  keyof typeof RequiredMobileApplicationPermissionMessagesFromYAML

export type RequiredMobileApplicationPermissions = keyof typeof RequiredMobileApplicationPermissionsToYAML
export type RequiredMobileApplicationPermissionsYAML = keyof typeof RequiredMobileApplicationPermissionsFromYAML
```

Добавить оба типа в `SystemEnumerationTypeMap` рядом с `MobileApplicationFunctionalities`:

```ts
RequiredMobileApplicationPermissionMessages: RequiredMobileApplicationPermissionMessages
RequiredMobileApplicationPermissions: RequiredMobileApplicationPermissions
```

- [ ] **Step 4: Record the untranslated-value restriction**

Добавить в конец `.agents/restrictions.md` один пункт:

```markdown
- В YAML мобильных разрешений значения `PermissionGroupPhone`, `PermissionGroupCallLog`, `PermissionGroupSMS` и `PostNotifications` намеренно остаются без перевода: официальные русские имена не найдены в Синтакс-помощнике и методическом тексте. Остальные значения `RequiredMobileApplicationPermissions` и `RequiredMobileApplicationPermissionMessages` переводятся по системным перечислениям.
```

- [ ] **Step 5: Run the test and duplicate check**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configuration/mobileApplicationPermissionsEnumerations.test.ts
pnpm check:duplicates -- --base 6822e97f5
```

Expected: PASS; duplicate check reports no new blocking duplicate.

- [ ] **Step 6: Commit the vocabulary layer**

```bash
git add docs/superpowers/plans/2026-08-08-mobile-permissions-round-trip.md .agents/restrictions.md packages/core/metadata/systemEnumerations/types.ts packages/core/metadata/appliedObjects/configuration/mobileApplicationPermissionsEnumerations.test.ts
git commit -m "feat: :sparkles: добавить перечисления мобильных разрешений"
```

---

### Task 2: Требуемые разрешения мобильного приложения

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/requiredMobileApplicationPermissions.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/requiredMobileApplicationPermissions.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/builders.ts:68`
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts:1-30,341-348`

**Interfaces:**
- Consumes: `RequiredMobileApplicationPermissions` and YAML mappings from Task 1; `importBooleanFromXML`, `importBooleanFromYAML`, `exportBooleanToYAML`; `importI8nTextFromXML`, `exportI8nTextToXML`, `importI8nTextFromYAML`, `exportI8nTextToYAML`.
- Produces: model `RequiredMobileApplicationPermission[]`, YAML `RequiredMobileApplicationPermissionYAML[]`, `EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS`, five registered handlers under type key `RequiredMobileApplicationPermissions`, and `requiredMobileApplicationPermissionsRule()`.

- [ ] **Step 1: Write failing atomic conversion tests**

Создать `requiredMobileApplicationPermissions.test.ts` с одним представительным набором, который одновременно защищает порядок, повтор, boolean, многоязычный и пустой `I8nText`, а также непереводимое значение:

```ts
const xml = {
  "app:permission": [
    {
      "app:permission": "Camera",
      "app:use": "true",
      "app:description": { "v8:item": { "v8:lang": "ru", "v8:content": "Камера" } },
    },
    {
      "app:permission": "PostNotifications",
      "app:use": "false",
      "app:description": "",
    },
    {
      "app:permission": "Camera",
      "app:use": true,
      "app:description": {
        "v8:item": [
          { "v8:lang": "ru", "v8:content": "Повтор" },
          { "v8:lang": "en", "v8:content": "Duplicate" },
        ],
      },
    },
  ],
}

const yaml = [
  { Разрешение: "Камера", Использовать: "Истина", Описание: "Камера" },
  { Разрешение: "PostNotifications", Использовать: "Ложь", Описание: "" },
  { Разрешение: "Камера", Использовать: "Истина", Описание: { ru: "Повтор", en: "Duplicate" } },
]
```

Проверить:

```ts
expect(exportRequiredMobileApplicationPermissionsToYAML(mockContext, undefined, model)).toEqual(yaml)
expect(importRequiredMobileApplicationPermissionsFromYAML(mockContext, undefined, yaml)).toEqual(model)
expect(importRequiredMobileApplicationPermissionsFromXML(mockContext, undefined, xml)).toEqual(model)
expect(importRequiredMobileApplicationPermissionsFromXML(mockContext, undefined, "")).toBe(
  EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS
)
expect(exportRequiredMobileApplicationPermissionsToXML(mockContext, undefined, [])).toBe("")
```

Для обратного XML ожидать ту же структуру и порядок, но каноническое пустое описание `{}` вместо входной parser-формы `""`:

```ts
expect(exportRequiredMobileApplicationPermissionsToXML(mockContext, undefined, model)).toEqual({
  "app:permission": [
    xml["app:permission"][0],
    { ...xml["app:permission"][1], "app:description": {} },
    xml["app:permission"][2],
  ],
})
```

В том же файле проверить регистрацию пяти обработчиков и JSON Schema: массив, обязательные `Разрешение`, `Использовать`, `Описание`, перечисление из 39 YAML-значений.

Проверить схему через `Value.Check` из `typebox/value`:

```ts
expect(Value.Check(schema, yaml)).toBe(true)
expect(Value.Check(schema, [{ Разрешение: "Неизвестно", Использовать: "Истина", Описание: "" }])).toBe(false)
expect(Value.Check(schema, [{ Разрешение: "Камера", Использовать: "Истина" }])).toBe(false)
expect(importRequiredMobileApplicationPermissionsFromYAML(mockContext, undefined, [
  { Разрешение: "Камера", Использовать: "Истина", Описание: {} },
])).toEqual([{ permission: "Camera", use: true, description: { items: {} } }])
```

- [ ] **Step 2: Run the atomic tests to verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configuration/requiredMobileApplicationPermissions.test.ts
```

Expected: FAIL because the module and builder do not exist.

- [ ] **Step 3: Implement the atomic type**

Определить публичные контракты:

```ts
export interface RequiredMobileApplicationPermission {
  permission: RequiredMobileApplicationPermissions
  use: boolean
  description: I8nText
}

export type RequiredMobileApplicationPermissionCollection = RequiredMobileApplicationPermission[]

export interface RequiredMobileApplicationPermissionYAML {
  Разрешение: RequiredMobileApplicationPermissionsYAML
  Использовать: StringboolYAML
  Описание: I8nTextYAML
}

export type RequiredMobileApplicationPermissionCollectionYAML = RequiredMobileApplicationPermissionYAML[]

export const EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS: RequiredMobileApplicationPermissionCollection = []
```

Внутренние XML-типы должны точно отражать схему:

```ts
interface RequiredMobileApplicationPermissionXML {
  "app:permission": RequiredMobileApplicationPermissions
  "app:use": StringboolXML | { "#text"?: StringboolXML }
  "app:description": I8nTextXML | ""
}

interface RequiredMobileApplicationPermissionsXML {
  "app:permission"?: RequiredMobileApplicationPermissionXML | RequiredMobileApplicationPermissionXML[]
}
```

Использовать локальное правило описания, не добавляя новое правило в общую систему:

```ts
const descriptionRule = i8nTextRule({ preserveEmptyXML: true })

const importDescriptionFromYAML = (context: ConfigurationContext, value: I8nTextYAML): I8nText =>
  importI8nTextFromYAML({ context, rule: descriptionRule, value }) ?? { items: {} }

const exportDescriptionToYAML = (context: ConfigurationContext, value: I8nText): I8nTextYAML =>
  exportI8nTextToYAML({ context, rule: descriptionRule, value }) ?? ""
```

XML/YAML-преобразователи должны использовать `map`, не `Map`, чтобы не устранять повторы. Пустой XML возвращает сам `EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS`, а populated XML — новый массив. JSON Schema строится из `BooleanJSONSchema`, `I8nTextJSONSchema` и literals ключей `RequiredMobileApplicationPermissionsFromYAML`.

Зарегистрировать операции:

```ts
registerTypeRule("RequiredMobileApplicationPermissions", "importFromXML", importRequiredMobileApplicationPermissionsFromXML)
registerTypeRule("RequiredMobileApplicationPermissions", "exportToXML", exportRequiredMobileApplicationPermissionsToXML)
registerTypeRule("RequiredMobileApplicationPermissions", "importFromYAML", importRequiredMobileApplicationPermissionsFromYAML)
registerTypeRule("RequiredMobileApplicationPermissions", "exportToYAML", exportRequiredMobileApplicationPermissionsToYAML)
registerTypeRule("RequiredMobileApplicationPermissions", "exportToJSONSchema", exportRequiredMobileApplicationPermissionsToJSONSchema)
```

- [ ] **Step 4: Add the builder and wire the configuration rule**

В `builders.ts` добавить тип и builder без новых полей общих правил:

```ts
export interface RequiredMobileApplicationPermissionsWidePropertyRule extends WidePropertyRuleBase {
  type: "RequiredMobileApplicationPermissions"
}

export type RequiredMobileApplicationPermissionsRuleParams = Omit<
  RequiredMobileApplicationPermissionsWidePropertyRule,
  "type"
>

export function requiredMobileApplicationPermissionsRule<
  const Params extends RequiredMobileApplicationPermissionsRuleParams,
>(params: WideExactRuleParams<RequiredMobileApplicationPermissionsRuleParams, Params>) {
  return defineWidePropertyRule("RequiredMobileApplicationPermissions", params)
}
```

Заменить отключённый `stringRule` в `rules.ts`:

```ts
requiredMobileApplicationPermissions: requiredMobileApplicationPermissionsRule({
  yaml: "ТребуемыеРазрешенияМобильногоПриложения",
  xml: "RequiredMobileApplicationPermissions",
  xmlParents: configurationProperties,
  implicitValueYAML: EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS,
  evaluateWhenYAMLMissing: true,
  preserveUnknownReferenceXML: false,
  defaultValueXML: EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS,
  defaultValueXMLRaw: "",
}),
```

`evaluateWhenYAMLMissing` и `preserveUnknownReferenceXML: false` нужны вместе: атомарный экспортёр получает канонический пустой массив, удаляет отличающиеся данные reference XML и пишет обязательный пустой тег. Не использовать `omitNonImplicitReferenceXMLWhenYAMLMissing`: его общий путь сохраняет только равный reference, но не вызывает специализированный экспортёр для восстановления canonical XML.

- [ ] **Step 5: Run the atomic and direct configuration tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configuration/requiredMobileApplicationPermissions.test.ts metadata/appliedObjects/configuration/fromXMLToYAMLToXML.test.ts
pnpm check:duplicates -- --base 6822e97f5
```

Expected: PASS; clean configuration still exports `<RequiredMobileApplicationPermissions/>`.

- [ ] **Step 6: Commit required permissions**

```bash
git add packages/core/metadata/appliedObjects/configuration/builders.ts packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/appliedObjects/configuration/requiredMobileApplicationPermissions.ts packages/core/metadata/appliedObjects/configuration/requiredMobileApplicationPermissions.test.ts
git commit -m "feat: :sparkles: преобразовать требуемые мобильные разрешения"
```

---

### Task 3: Сообщения разрешений внутри используемых функциональностей

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts:349-353`
- Modify: `packages/core/metadata/appliedObjects/configuration/fromXMLToYAMLToXML.test.ts:96-122`

**Interfaces:**
- Consumes: `RequiredMobileApplicationPermissionMessages` and YAML mappings from Task 1; existing `CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES`; the same boolean and `I8nText` converters as Task 2.
- Produces: object model `UsedMobileApplicationFunctionalities`, object YAML `UsedMobileApplicationFunctionalitiesYAML`, `IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES`, and existing five handlers with the new contract.

- [ ] **Step 1: Write failing tests for the new object contract**

Создать `usedMobileApplicationFunctionalities.test.ts`. Основной случай должен содержать две функциональности и три сообщения, включая повтор и пустое описание:

```ts
const xml = {
  "app:functionality": [
    { "app:functionality": "Biometrics", "app:use": "true" },
    { "app:functionality": "Camera", "app:use": "true" },
  ],
  "app:permissionMessage": [
    {
      "app:permission": "Camera",
      "app:description": { "v8:item": { "v8:lang": "ru", "v8:content": "Камера" } },
    },
    { "app:permission": "PostNotifications", "app:description": "" },
    {
      "app:permission": "Camera",
      "app:description": { "v8:item": { "v8:lang": "en", "v8:content": "Duplicate" } },
    },
  ],
}
```

Проверить следующие отдельные договоры:

```ts
expect(importUsedMobileApplicationFunctionalitiesFromYAML(mockContext, undefined, {})).toEqual({
  functionalities: CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  permissionMessages: [],
})

expect(exportUsedMobileApplicationFunctionalitiesToYAML(mockContext, undefined, {
  functionalities: CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  permissionMessages: [{ permission: "PostNotifications", description: { items: {} } }],
})).toEqual({
  СообщенияРазрешений: [{ Разрешение: "PostNotifications", Описание: "" }],
})
```

Дополнительно проверить:

- populated XML/YAML преобразуется в обе стороны без изменения порядка и повторов;
- пустой XML-контейнер импортируется как `{ functionalities: [], permissionMessages: [] }` и экспортируется обратно в `""`;
- clean model без сообщений экспортируется в `undefined` YAML;
- объект только с отклонением `OSBackup: false` экспортирует только `Функциональности`;
- `IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES` экспортируется в XML как 38 `app:functionality` без `app:permissionMessage`;
- JSON Schema имеет объект с необязательными `Функциональности` и `СообщенияРазрешений`, но требует поля элементов;
- старый массив не соответствует JSON Schema;
- пять обработчиков остаются зарегистрированы под `UsedMobileApplicationFunctionalities`.

Проверку несовместимого старого массива выполнить самой схемой:

```ts
expect(Value.Check(schema, [
  { Функциональность: "Камера", Использовать: "Истина" },
])).toBe(false)
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.test.ts
```

Expected: FAIL because the current type is an array and ignores `app:permissionMessage`.

- [ ] **Step 3: Change the model and YAML interfaces**

Сохранить публичные `UsedMobileApplicationFunctionality` и clean-массив, затем заменить корневые типы:

```ts
export interface RequiredMobileApplicationPermissionMessage {
  permission: RequiredMobileApplicationPermissionMessages
  description: I8nText
}

export interface UsedMobileApplicationFunctionalities {
  functionalities: UsedMobileApplicationFunctionality[]
  permissionMessages: RequiredMobileApplicationPermissionMessage[]
}

export interface RequiredMobileApplicationPermissionMessageYAML {
  Разрешение: RequiredMobileApplicationPermissionMessagesYAML
  Описание: I8nTextYAML
}

export interface UsedMobileApplicationFunctionalitiesYAML {
  Функциональности?: UsedMobileApplicationFunctionalityYAML[]
  СообщенияРазрешений?: RequiredMobileApplicationPermissionMessageYAML[]
}

export const IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES: UsedMobileApplicationFunctionalities = {
  functionalities: CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  permissionMessages: [],
}
```

В XML-интерфейс добавить:

```ts
"app:permissionMessage"?: RequiredMobileApplicationPermissionMessageXML |
  RequiredMobileApplicationPermissionMessageXML[]
```

- [ ] **Step 4: Implement XML/YAML conversion and canonicalization**

Разделить код на небольшие локальные функции `importFunctionalitiesFromXML`, `exportFunctionalitiesToXML`, `importPermissionMessagesFromXML`, `exportPermissionMessagesToXML`, `importPermissionMessagesFromYAML`, `exportPermissionMessagesToYAML`.

Главный XML-export должен добавлять ключи условно и в порядке схемы:

```ts
if (data.functionalities.length === 0 && data.permissionMessages.length === 0) return ""

const result: UsedMobileApplicationFunctionalitiesXML = {}
if (data.functionalities.length > 0) {
  result["app:functionality"] = data.functionalities.map(exportFunctionalityToXML)
}
if (data.permissionMessages.length > 0) {
  result["app:permissionMessage"] = data.permissionMessages.map(exportPermissionMessageToXML)
}
return result
```

При импорте по содержимому распознавать ровно clean-функциональности без сообщений и возвращать сам `IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES`; это даёт общему слою каноническое неявное значение без структурного сравнения объектов.

YAML-import нормализует отсутствующие вложенные поля:

```ts
const functionalities = yaml.Функциональности === undefined
  ? cloneCleanDefaultUsedMobileApplicationFunctionalities()
  : applyFunctionalityOverrides(yaml.Функциональности)
const permissionMessages = importPermissionMessagesFromYAML(context, yaml.СообщенияРазрешений ?? [])
```

YAML-export сначала получает compact overrides, затем добавляет только непустые поля. Если оба поля отсутствуют, возвращает `undefined`. Описания обрабатываются локальным `i8nTextRule({ preserveEmptyXML: true })` так же, как в Task 2.

- [ ] **Step 5: Replace the rule defaults with the canonical implicit object**

В `rules.ts` заменить прежний `defaultValue`:

```ts
usedMobileApplicationFunctionalities: usedMobileApplicationFunctionalitiesRule({
  yaml: "ИспользуемаяФункциональностьМобильногоПриложения",
  xmlParents: configurationProperties,
  implicitValueYAML: IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  evaluateWhenYAMLMissing: true,
  preserveUnknownReferenceXML: false,
}),
```

Экспортёр типа уже восстанавливает 38 clean-элементов при `undefined` или canonical implicit object, поэтому новые общие правила и `!xml` не нужны.

- [ ] **Step 6: Update the existing integration expectation**

Перед запуском заменить старый массив YAML в существующем тесте «преобразует различия мобильной функциональности…» на новый объект:

```ts
ИспользуемаяФункциональностьМобильногоПриложения: {
  Функциональности: [
    { Функциональность: "РезервноеКопированиеСредствамиОС", Использовать: "Ложь" },
  ],
},
```

- [ ] **Step 7: Run tests and duplicate check**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.test.ts metadata/appliedObjects/configuration/fromXMLToYAMLToXML.test.ts
pnpm check:duplicates -- --base 6822e97f5
```

Expected: оба тестовых файла PASS.

- [ ] **Step 8: Commit the breaking object contract**

```bash
git add packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.ts packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.test.ts packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/appliedObjects/configuration/fromXMLToYAMLToXML.test.ts
git commit -m "feat!: :boom: сохранить сообщения мобильных разрешений"
```

---

### Task 4: Интеграционный договор Configuration и reference XML

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/fromXMLToYAMLToXML.test.ts:24-130`

**Interfaces:**
- Consumes: оба атомарных типа и rules wiring из Tasks 2–3; `CLEAN_CONFIGURATION_XML` без его изменения.
- Produces: наблюдаемый полный договор Configuration для object YAML, семи сообщений, требуемых разрешений и удаления reference-данных отсутствующим YAML.

- [ ] **Step 1: Add a failing seven-message round-trip test**

Не менять XML-фикстуру. Внутри теста получить `referenceXML = cleanFixture()` и присвоить `Properties.UsedMobileApplicationFunctionalities["app:permissionMessage"]` семь элементов из `HEAD:cf/Configuration.xml` репозитория `/Users/nikita/git/sed_xml`: `Biometrics`, `Camera`, `Microphone`, `MusicLibrary`, `PictureAndVideoLibraries`, `AudioPlaybackAndVibration`, `PostNotifications` с их русскими `v8:content` из строк 233–295 исходника.

Проверить точный YAML-массив:

```ts
expect(imported.yaml).toMatchObject({
  ИспользуемаяФункциональностьМобильногоПриложения: {
    СообщенияРазрешений: [
      { Разрешение: "Биометрия", Описание: "Это позволит производить авторизацию в приложении с помощью биометрии." },
      { Разрешение: "Камера", Описание: "Это позволит производить съемку фото или видео." },
      { Разрешение: "Микрофон", Описание: "Это позволит производить запись аудиофайлов." },
      { Разрешение: "БиблиотекаМузыки", Описание: "Это позволит во вложениях использовать аудиофайлы (в задачах, обсуждениях, письмах и др.)." },
      { Разрешение: "БиблиотекиКартинокИВидео", Описание: "Это позволит во вложениях использовать изображения и видео (в задачах, обсуждениях, письмах и др.)." },
      { Разрешение: "ВоспроизведениеАудиоИВибрация", Описание: "Это позволит воспроизводить аудиофайлы и вибрацию." },
      { Разрешение: "PostNotifications", Описание: "Это позволит отображать уведомления на главном экране." },
    ],
  },
})
```

После YAML → XML проверить точное равенство исходному массиву `app:permissionMessage` и то, что ключи XML-контейнера равны `['app:functionality', 'app:permissionMessage']`.

- [ ] **Step 2: Add required-permissions and deletion tests**

В одном тесте передать YAML с двумя одинаковыми `Камера` и одним `PostNotifications`, разными boolean/описаниями; проверить порядок XML и обратный YAML. В отдельном тесте создать reference XML с одним требуемым разрешением и одним сообщением, но передать YAML только `{ Имя, ОсновнойЯзык }`.

Ожидание удаления:

```ts
expect(properties.RequiredMobileApplicationPermissions).toBe("")
expect(properties.UsedMobileApplicationFunctionalities).not.toHaveProperty("app:permissionMessage")
expect(
  (properties.UsedMobileApplicationFunctionalities as { "app:functionality": unknown[] })["app:functionality"]
).toHaveLength(38)
```

- [ ] **Step 3: Run all configuration tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configuration
pnpm check:duplicates -- --base 6822e97f5
```

Expected: PASS; no existing configuration fixture changed.

- [ ] **Step 4: Commit the integration coverage**

```bash
git add packages/core/metadata/appliedObjects/configuration/fromXMLToYAMLToXML.test.ts
git commit -m "test: :white_check_mark: покрыть round-trip мобильных разрешений"
```

---

### Task 5: Полная проверка и исходный round-trip

**Files:**
- Verify only: repository tests and `/Users/nikita/git/sed_xml/cf`.

**Interfaces:**
- Consumes: completed implementation and user authorization to restore `/Users/nikita/git/sed_xml`.
- Produces: evidence that all project checks pass and the seven source `app:permissionMessage` survive the real round-trip.

- [ ] **Step 1: Run static and complete project checks**

Run from `/Users/nikita/git/nkdk`:

```bash
pnpm type-check
pnpm test
pnpm test:architecture
pnpm check:duplicates -- --base 6822e97f5
```

Expected: every command exits 0; duplicate check reports no new blocking duplicate.

- [ ] **Step 2: Restore the authorized XML source and run full YAML round-trip**

`/Users/nikita/git/sed_xml/cf` currently contains diagnostic changes from the earlier run. Restore only this active catalog, which the user explicitly authorized, then invoke the project script:

```bash
git -C /Users/nikita/git/sed_xml restore -- cf
git -C /Users/nikita/git/sed_xml clean -fd -- cf
env NKDK_XML_REPO=/Users/nikita/git/sed_xml NKDK_XML_DIR=/Users/nikita/git/sed_xml/cf ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: import and sync complete successfully. Other unrelated dirty paths in `sed_xml` do not block the script because it checks only `cf`.

- [ ] **Step 3: Verify the seven messages survived**

Run:

```bash
git -C /Users/nikita/git/sed_xml show HEAD:cf/Configuration.xml | rg -c '<app:permissionMessage>'
rg -c '<app:permissionMessage>' /Users/nikita/git/sed_xml/cf/Configuration.xml
git -C /Users/nikita/git/sed_xml diff -- cf/Configuration.xml
```

Expected: both counts are `7`; the diff contains no deletion or reordering of any `app:permissionMessage`, `app:permission`, `app:description`, `v8:lang` or `v8:content`. Если в `Configuration.xml` остаётся независимое расхождение, классифицировать его отдельно и не считать частью этой задачи.

- [ ] **Step 4: Verify the implementation branch is clean**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: `/Users/nikita/git/nkdk` has no uncommitted implementation files; history contains the four task commits after design commit `6822e97f5`.
