# Explicit DCS Auto Color Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Представлять автоматический цвет DCS явным YAML-маркером `Авто` и запрещать старое пустое значение.

**Architecture:** Изменение остаётся внутри `SettingsParameterValue` с `valueType: "Color"`. Кодек переводит внутреннее отсутствие DCS-значения в явный YAML-маркер и обратно, а JSON Schema закрепляет строгий договор; общие metadata-слои и правила прикладных объектов не получают частных условий.

**Tech Stack:** TypeScript, Vitest, TypeBox/скомпилированная JSON Schema, MCP stdio round-trip.

## Global Constraints

- XML-фикстуры являются источником истины и не изменяются.
- XML `v8ui:Color` со значением `auto` экспортируется как YAML `Авто`.
- YAML `Авто` импортируется как автоматический DCS-цвет.
- Пустые `null`, `undefined` и `""` не поддерживаются как значения DCS-цвета.
- Обычный тип `Color` вне `SettingsParameterValue` не изменяется.
- Частные условия по форме, пути и имени прикладного объекта запрещены.
- Перед завершением обязательно выполнить `pnpm test` из корня.

---

### Task 1: Строгий YAML-кодек автоматического DCS-цвета

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: внутренний `ParameterValue` без `value`, которым DCS-слой представляет XML-цвет `auto`.
- Produces: `DcsAutoColorYAML = "Авто"` в `ParameterValueYAML` и двустороннее преобразование `auto ↔ Авто`.

- [ ] **Step 1: Изменить ожидаемый XML → YAML договор в тестах**

В `fromXMLToYAML.test.ts` заменить ожидание пустого значения:

```ts
it("exports enabled DCS auto color as explicit YAML marker", () => {
  const result = testExportPropertyModelThroughXMLToYAML({
    rule,
    value: {
      itemType: "AppearanceFields",
      ЦветТекста: { parameter: "ЦветТекста" },
    },
    yaml: { ЦветТекста: "Авто" },
  })

  expect(result).toEqual({
    Оформление: {
      ЦветТекста: "Авто",
    },
  })
})
```

Для выключенного параметра ожидать развёрнутую форму:

```ts
ЦветФона: {
  Использовать: "Ложь",
  Значение: "Авто",
}
```

- [ ] **Step 2: Добавить failing-тест явного YAML → XML**

Создать `fromYAMLToXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { testPropertyFromYAMLToXML } from "../../../../tests/directConversion"
import "./rules"

const rule = {
  itemType: "Probe",
  properties: {
    appearance: {
      type: "AppearanceFields",
      yaml: "Оформление",
      xml: "appearance",
    },
  },
} as const

describe("AppearanceFields YAML to XML", () => {
  it("exports explicit DCS auto color marker", () => {
    const result = testPropertyFromYAMLToXML({
      rule,
      yaml: {
        Оформление: {
          ЦветТекста: "Авто",
        },
      },
    })

    expect(result.xml).toEqual({
      appearance: {
        "dcscor:item": [
          {
            "dcscor:parameter": "ЦветТекста",
            "dcscor:value": {
              "_xsi:type": "v8ui:Color",
              "#text": "auto",
            },
            "_xsi:type": "dcsset:SettingsParameterValue",
          },
        ],
      },
    })
  })
})
```

- [ ] **Step 3: Запустить тесты и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.test.ts \
  metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAMLToXML.test.ts
```

Expected: FAIL — XML `auto` пока экспортируется как пустое значение, а `Авто` не распознаётся как специальный DCS-цвет.

- [ ] **Step 4: Добавить тип явного маркера**

В `types.ts` определить:

```ts
export type DcsAutoColorYAML = "Авто"

export type ParameterValueYAML =
  | ParameterValueYAMLObject
  | DcsAutoColorYAML

export type SettingsParameterValueYAML =
  | SettingsParameterValueYAMLObject
  | DcsAutoColorYAML
```

Удалить `null` из обоих YAML-типов.

- [ ] **Step 5: Экспортировать внутренний auto как `Авто`**

В `toYAML.ts` добавить константу:

```ts
const DCS_AUTO_COLOR_YAML = "Авто" as const
```

Если `shouldHideDcsAutoColorValue(...)` вернул `true`, считать `Авто` явным экспортированным значением. Для простого включённого параметра возвращать scalar `Авто`; при наличии `Использовать`, элементов или настроек помещать маркер в `Значение`.

- [ ] **Step 6: Импортировать только явный маркер**

В `fromYAML.ts` распознавать `Авто` только при `rule.valueType === "Color"`:

```ts
const isDcsAutoColorYAML =
  rule.valueType === "Color" && rawValueBase === "Авто"
```

Для маркера строить `ParameterValue` с `parameter`, но без `value`; это сохраняет существующее внутреннее представление DCS `auto` и позволяет `toXML.ts` записать `auto`. Ветка `yaml === undefined` продолжает возвращать `undefined`, а `null` не получает специальной семантики.

- [ ] **Step 7: Обновить unit-тест импорта**

В `fromYAML.test.ts` заменить тест пустого цвета тестом:

```ts
it("imports explicit DCS auto color marker", () => {
  const result = testAtomicFromYAML({
    rule,
    value: {
      ЦветТекста: "Авто",
    },
  })

  expect(result).toEqual({
    itemType: "AppearanceFields",
    ЦветТекста: {
      parameter: "ЦветТекста",
    },
  })
})
```

- [ ] **Step 8: Запустить целевые тесты и подтвердить GREEN**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.test.ts \
  metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts \
  metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAMLToXML.test.ts \
  metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 9: Зафиксировать кодек**

```bash
git add \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXMLToYAML.test.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAMLToXML.test.ts
git commit -m "feat!: :sparkles: сделать DCS-автоцвет явным"
```

Body:

```text
Автоматический цвет DCS теперь имеет однозначное YAML-представление Авто.

BREAKING CHANGE: пустое значение DCS-цвета больше не поддерживается.
Миграция: заменить пустое значение на Авто или повторно импортировать XML.
```

### Task 2: Строгая JSON Schema цветового `SettingsParameterValue`

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts`

**Interfaces:**
- Consumes: `DcsAutoColorYAML = "Авто"` из Task 1.
- Produces: схема, принимающая `Авто` и отклоняющая `null`, `undefined`, `""` и английское `auto`.

- [ ] **Step 1: Переписать schema-тест на строгий договор**

В `toJSONSchema.test.ts` заменить тест пропущенного значения:

```ts
it("accepts only explicit marker for DCS auto color", () => {
  const compiled = compiledAppearanceFieldsSchema

  expect(compiled.Check({ ЦветТекста: "Авто" })).toBe(true)
  expect(compiled.Check({ ЦветТекста: null })).toBe(false)
  expect(compiled.Check({ ЦветТекста: "" })).toBe(false)
  expect(compiled.Check({ ЦветТекста: undefined })).toBe(false)
  expect(compiled.Check({ ЦветФона: { Использовать: "Ложь", Значение: "Авто" } })).toBe(true)
})
```

Сохранить отдельную проверку, что `{ ЦветТекста: "auto" }` отклоняется.

- [ ] **Step 2: Запустить schema-тест и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts
```

Expected: FAIL — текущая схема принимает пустые значения и не принимает `Авто`.

- [ ] **Step 3: Изменить только схему DCS-цвета**

В `createSettingsParameterValueJSONSchema` заменить:

```ts
...(settingsRule.valueType === "Color"
  ? [Type.Undefined(), Type.Literal("")]
  : []),
```

на:

```ts
...(settingsRule.valueType === "Color"
  ? [Type.Literal("Авто")]
  : []),
```

Для развёрнутой формы цветового параметра разрешить `Авто` в поле `Значение`, объединив `wrapperValueSchema` с `Type.Literal("Авто")`; для остальных `valueType` оставить прежнюю схему.

- [ ] **Step 4: Запустить schema-тест и подтвердить GREEN**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts
```

Expected: PASS.

- [ ] **Step 5: Запустить все тесты DCS parameterValue/appearanceFields**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/commonObjects/dataCompositionSystem/parameterValue \
  metadata/commonObjects/dataCompositionSystem/appearanceFields
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать строгую схему**

```bash
git add \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts
git commit -m "feat!: :sparkles: запретить пустой DCS-автоцвет" \
  -m "BREAKING CHANGE: автоматический DCS-цвет задаётся только маркером Авто."
```

### Task 3: Интеграционная проверка

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: строгий кодек и JSON Schema из Tasks 1–2.
- Produces: подтверждение полного XML → YAML → XML для каталога `doc`.

- [ ] **Step 1: Проверить типы core**

Run:

```bash
pnpm --filter @nkdk/core exec tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 2: Повторить проблемный round-trip**

Run:

```bash
env \
  NKDK_XML_REPO=/Users/nikita/git/round-trip \
  NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: `sync_to_xml` завершается без `full_xml_sync_assignment_failed`; YAML проблемной формы содержит `ЦветТекста: Авто`.

- [ ] **Step 3: Проверить конкретный YAML**

Run:

```bash
rg -n -C 2 'ЦветТекста: Авто' \
  /Users/nikita/git/round-trip-temp-yaml/Обработка/ПечатьЭтикетокИЦенниковБПО/Формы/Форма/Форма.yaml
```

Expected: найдено явное значение в условном оформлении.

- [ ] **Step 4: Запустить весь проект**

Run:

```bash
pnpm test
```

Expected: все пакеты `packages/*` проходят без ошибок.

- [ ] **Step 5: Проверить итоговое состояние**

Run:

```bash
git status --short
git diff --check
```

Expected: только ожидаемые изменения либо чистое дерево после предусмотренных коммитов; ошибок пробельного оформления нет.
