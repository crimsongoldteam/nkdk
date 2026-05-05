# ExtendedTooltip Form Decoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ExtendedTooltip` use the same form-decoration property surface as `LabelDecoration`, so XML round-trip preserves decoration fields such as `TitleHeight`, `Border`, `Hyperlink`, and `Events`.

**Architecture:** `ExtendedTooltipRules` remains a form element rule registered both as an element and as the `ExtendedTooltip` property type. Its property list should follow the `LabelDecorationRules` shape: local `title` / runtime `type`, shared `formDecorationCommonProperties`, and decoration-specific visual/event fields. The existing `full.xml` fixture becomes the regression source and is connected to the centralized form element XML/YAML tests through `ElementFixtures`.

**Tech Stack:** TypeScript, Vitest, `packages/core` metadata orchestration, form element `rules.ts`, generated model/YAML types from rules.

---

## File Structure

- Modify `packages/core/metadata/forms/elements/extendedTooltip/rules.ts`
  - Import `formDecorationCommonProperties`.
  - Replace the hand-copied property list with the `LabelDecoration`-style form-decoration property list.
  - Keep `registerElementAsType` and derived XML name behavior unchanged.
- Modify `packages/core/metadata/forms/elements/extendedTooltip/types.ts`
  - Replace manual `ExtendedTooltipYAML` interface with `YAMLTypeByRule<typeof ExtendedTooltipRules>`.
  - Keep `ExtendedTooltip` and `ExtendedTooltipEnterprise` derived from the rule.
- Modify `packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/data.ts`
  - Update `fullExtendedTooltip` to match the current `full.xml`.
  - Update `fullExtendedTooltipYAML` to match the same model.
- Modify `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
  - Import `fullExtendedTooltip`, `fullExtendedTooltipYAML`, and `minimalExtendedTooltip`.
  - Add an `ExtendedTooltip` region so centralized `fromXML`, `toXML`, `fromYAML`, and `toYAML` tests cover it.
- Existing user-edited fixture:
  - `packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/full.xml`
  - Do not revert it.

## Task 1: Connect ExtendedTooltip To Centralized Element Tests

**Files:**
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`

- [ ] **Step 1: Add fixture imports**

Add this import near the other element fixture imports:

```typescript
import {
  fullExtendedTooltip,
  fullExtendedTooltipYAML,
  minimalExtendedTooltip,
} from "../extendedTooltip/__fixtures__/data"
```

- [ ] **Step 2: Add ExtendedTooltip entries to ElementFixtures**

Add this region before the final `//#endregion` group section or near other single elements:

```typescript
  //#region ExtendedTooltip
  {
    group: "ExtendedTooltip",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullExtendedTooltip,
    yaml: fullExtendedTooltipYAML,
    enterprise: undefined,
  },
  {
    group: "ExtendedTooltip",
    name: "minimal fields",
    element: undefined,
    xml: "defaults.xml",
    xmlFolder: undefined,
    model: minimalExtendedTooltip,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
```

- [ ] **Step 3: Run the narrow XML tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/__tests__/fromXML.test.ts packages/core/metadata/forms/elements/__tests__/toXML.test.ts -t "ExtendedTooltip"
```

Expected: FAIL. The current model still expects the old `full.xml` values and the current rule still drops fields such as `OnMainServerUnavalableBehavior`, `Hyperlink`, `VerticalAlign`, `TitleHeight`, `BackColor`, `BorderColor`, `Border`, and `Events`.

## Task 2: Update The ExtendedTooltip Expected Model

**Files:**
- Modify: `packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/data.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`

- [ ] **Step 1: Replace `fullExtendedTooltip`**

Replace the existing `fullExtendedTooltip` object with:

```typescript
export const fullExtendedTooltip: ExtendedTooltip = {
  itemType: "ExtendedTooltip",
  width: 5,
  autoMaxWidth: false,
  maxWidth: 15,
  height: 10,
  autoMaxHeight: false,
  maxHeight: 20,
  horizontalStretch: false,
  verticalStretch: false,
  textColor: { type: "WebColor", value: "Violet" },
  font: { kind: "StyleItem", ref: "SmallTextFont" },
  title: {
    items: { ru: "Расширенная подсказка" },
    formatted: false,
  },
  horizontalAlignInGroup: "Right",
  verticalAlignInGroup: "Center",
  onMainServerUnavalableBehavior: "MakeDisable",
  hyperlink: true,
  verticalAlign: "Bottom",
  titleHeight: 3,
  backColor: { type: "WebColor", value: "BlueViolet" },
  borderColor: { type: "WebColor", value: "SkyBlue" },
  border: {
    width: 2,
    controlBorderType: "Overline",
  },
  displayImportance: "VeryHigh",
  events: {
    click: "КнопкаРасширеннаяПодсказкаНажатие",
    uRLProcessing: "КнопкаРасширеннаяПодсказкаОбработкаНавигационнойСсылки",
  },
}
```

- [ ] **Step 2: Replace `fullExtendedTooltipYAML`**

Replace the existing `fullExtendedTooltipYAML` object with:

```typescript
export const fullExtendedTooltipYAML: ExtendedTooltipYAML = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  ВажностьПриОтображении: "ОченьВысокая",
  ВертикальноеПоложение: "Низ",
  ВертикальноеПоложениеВГруппе: "Центр",
  Высота: 10,
  ВысотаЗаголовка: 3,
  Гиперссылка: "Истина",
  ГоризонтальноеПоложениеВГруппе: "Право",
  Заголовок: "Расширенная подсказка",
  МаксимальнаяВысота: 20,
  МаксимальнаяШирина: 15,
  ПоведениеПриНедоступностиОсновногоСервера: "ОтключитьДоступность",
  Рамка: {
    Ширина: 2,
    ТипРамки: "Подчеркивание",
  },
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  События: {
    Нажатие: "КнопкаРасширеннаяПодсказкаНажатие",
    ОбработкаНавигационнойСсылки: "КнопкаРасширеннаяПодсказкаОбработкаНавигационнойСсылки",
  },
  ЦветРамки: "НебесноГолубой",
  ЦветТекста: "Фиолетовый",
  ЦветФона: "СинеФиолетовый",
  Ширина: 5,
  Шрифт: "МелкийШрифтТекста",
}
```

- [ ] **Step 3: Run the narrow tests and verify the remaining failure**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/__tests__/fromXML.test.ts packages/core/metadata/forms/elements/__tests__/toXML.test.ts -t "ExtendedTooltip"
```

Expected: FAIL only because `ExtendedTooltipRules` still does not import/export the new form-decoration fields.

## Task 3: Make ExtendedTooltip Rules Follow LabelDecoration

**Files:**
- Modify: `packages/core/metadata/forms/elements/extendedTooltip/rules.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`

- [ ] **Step 1: Import form-decoration common properties**

Add this import:

```typescript
import { formDecorationCommonProperties } from "../formDecoration/rules"
```

- [ ] **Step 2: Replace `ExtendedTooltipRules.properties`**

Replace the current hand-written `properties` object with:

```typescript
  properties: {
    title: {
      type: "FormattedI8nText",
      yaml: "Заголовок",
      yamlFormatted: "ФорматированныйЗаголовок",
      yamlPartialOthers: true,
    },
    type: {
      type: "SystemEnumeration",
      typeSE: "FormDecorationType",
      runtimeOnly: true,
    },
    ...formDecorationCommonProperties,
    backColor: { yaml: "ЦветФона", type: "Color" },
    border: { yaml: "Рамка", type: "Border" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    horizontalAlign: {
      yaml: "ГоризонтальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    hyperlink: { yaml: "Гиперссылка", type: "boolean" },
    titleHeight: { yaml: "ВысотаЗаголовка", type: "number" },
    verticalAlign: {
      yaml: "ВертикальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        click: "Нажатие",
        uRLProcessing: "ОбработкаНавигационнойСсылки",
      },
    },
  },
```

Do not add `name`: `ExtendedTooltip` is a nested element-as-type and its XML name is still derived in `registerElementAsType`.

- [ ] **Step 3: Run the narrow XML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/__tests__/fromXML.test.ts packages/core/metadata/forms/elements/__tests__/toXML.test.ts -t "ExtendedTooltip"
```

Expected: PASS for `fromXML` and `toXML`.

## Task 4: Derive ExtendedTooltip YAML Type From Rules

**Files:**
- Modify: `packages/core/metadata/forms/elements/extendedTooltip/types.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Replace manual YAML imports and interface**

Replace the current long list of YAML helper imports and the manual `ExtendedTooltipYAML` interface with `YAMLTypeByRule`:

```typescript
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ExtendedTooltipRules } from "./rules"

export type ExtendedTooltip = FormTypeByRule<typeof ExtendedTooltipRules>

export type ExtendedTooltipYAML = YAMLTypeByRule<typeof ExtendedTooltipRules>

export type ExtendedTooltipEnterprise = EnterpriseType<typeof ExtendedTooltipRules>
```

- [ ] **Step 2: Run the narrow YAML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts packages/core/metadata/forms/elements/__tests__/toYAML.test.ts -t "ExtendedTooltip"
```

Expected: PASS for `fromYAML` and `toYAML`.

## Task 5: Run The Focused Element Test Suite

**Files:**
- Verify only; no file edits.

- [ ] **Step 1: Run all centralized element tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/__tests__ -t "ExtendedTooltip|exportElementToPartialYAML|importElementFromPartialYAML|exportElementToXML|importElementFromXML"
```

Expected: PASS. This command covers the new `ExtendedTooltip` fixture through the shared element test harness.

- [ ] **Step 2: Run the helper tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/extendedTooltip/helper.test.ts
```

Expected: PASS. The name derivation behavior remains unchanged.

- [ ] **Step 3: Check changed files**

Run:

```bash
git diff --stat
```

Expected changed files:

```text
packages/core/metadata/forms/elements/__tests__/fixtures.ts
packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/data.ts
packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/full.xml
packages/core/metadata/forms/elements/extendedTooltip/rules.ts
packages/core/metadata/forms/elements/extendedTooltip/types.ts
```

`full.xml` is already user-edited and must stay changed.

## Task 6: Commit

**Files:**
- Commit all changed implementation files after tests pass.

- [ ] **Step 1: Stage files**

Run:

```bash
git add packages/core/metadata/forms/elements/__tests__/fixtures.ts packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/data.ts packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/full.xml packages/core/metadata/forms/elements/extendedTooltip/rules.ts packages/core/metadata/forms/elements/extendedTooltip/types.ts
```

- [ ] **Step 2: Commit**

Run:

```bash
git commit -m "fix: preserve extended tooltip decoration fields"
```

Expected: commit succeeds. Do not run full `pnpm test` unless the issue is being closed; for issue closure, run `pnpm test` from the repository root first.

## Self-Review

- Spec coverage: the plan connects `ExtendedTooltip` to the central tests, updates the expected model/YAML, extends rules to match form decoration behavior, and verifies XML/YAML import/export.
- Placeholder scan: no placeholders remain.
- Type consistency: `fullExtendedTooltipYAML`, `ExtendedTooltipYAML`, and `ExtendedTooltipRules` all derive from the same rule surface after Task 4.
