# Round-trip CommandInterface, ChoiceList, ButtonGroup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать три источника round-trip diff'ов: лишний `<DefaultVisible>true</DefaultVisible>`, нормализацию текстового `2.0` в `2`, и потерю `ButtonGroup@DisplayImportance`.

**Architecture:** `CommandInterface` остается ручным commonObject, но получает false-only модель для `defaultVisible`. XML importer перестает глобально превращать leaf-текст в числа; нужные boolean/number-приведения выполняются в конечных импортерах. `ButtonGroup` остается rule-based form element: добавляется недостающее свойство в `rules.ts`, а пользовательские XML-фикстуры синхронизируются с TS/YAML/enterprise-фикстурами.

**Tech Stack:** TypeScript, Vitest, fast-xml-parser, TypeBox JSON Schema, существующий metadata rule framework.

---

## Source Of Truth

Рабочее дерево:

```text
/Users/nikita/git/nakidka-core/.worktrees/round-trip-command-interface-planning
```

Спецификация:

```text
docs/superpowers/specs/2026-05-08-round-trip-command-interface-choice-list-button-group-design.md
```

Пользователь уже обновил XML-фикстуры. Не перезаписывать их и не откатывать:

```text
packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.xml
packages/core/metadata/forms/elements/buttonGroup/__fixtures__/full.xml
```

Эти XML-файлы входят в реализационные коммиты вместе с соответствующими TS/YAML-ожиданиями.

## File Structure

- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/types.ts` - false-only типы модели/YAML/XML и JSON Schema.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts` - импорт `DefaultVisible` только как явного `false`, импорт `Index` через numeric rule.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts` - экспортирует `DefaultVisible` только когда модель содержит `false`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts` - импортирует `Автовидимость` только из `"Ложь"`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts` - не выводит `Автовидимость` для отсутствующего поля, выводит `ЗапретитьИспользование: {}` для empty deny.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts` - синхронизация с новой XML-фикстурой.
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/toJSONSchema.test.ts` - явная проверка, что YAML допускает только `"Ложь"`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts` and `toXML.test.ts` - регрессия на отсутствие implicit `true`.
- Modify: `packages/core/xml/import/importer.ts` - отключение глобального `parseTagValue`.
- Create: `packages/core/xml/import/importer.test.ts` - регрессия на сохранение `2.0` строкой.
- Modify: `packages/core/metadata/commonObjects/userVisible/types.ts` - XML-тип принимает string boolean после отключения парсинга.
- Modify: `packages/core/metadata/commonObjects/userVisible/fromXML.ts` - явное boolean-приведение через `importBooleanFromXML`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts` - fixture с numeric-looking presentation.
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromXML.test.ts` and `toXML.test.ts` - round-trip `v8:content>2.0`.
- Modify: `packages/core/metadata/forms/elements/buttonGroup/rules.ts` - добавление `displayImportance`.
- Modify: `packages/core/metadata/forms/elements/buttonGroup/__fixtures__/data.ts` - синхронизация модели/YAML/enterprise с новой XML-фикстурой.

---

### Task 1: CommandInterface false-only DefaultVisible

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts`
- Keep and stage: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.xml`
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`

- [ ] **Step 1: Update the fixture model and YAML to match the user-updated XML**

Replace `fullCommandInterface` and `fullCommandInterfaceYAML` in `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts` with values that match `full.xml`:

```ts
import type { CommandInterface, CommandInterfaceYAML } from "../types"

export const fullCommandInterface: CommandInterface = {
  itemType: "CommandInterface",
  NavigationPanel: [
    {
      command: "InformationRegister.РегистрСведенийКомандныйИнтерфейс.StandardCommand.OpenByValue.Измерение1",
      type: "Auto",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormNavigationPanelImportant",
      defaultVisible: false,
      visible: { common: false, values: [] },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormNavigationPanelSeeAlso",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "InformationRegister.РегистрСведенийКомандныйИнтерфейс1.StandardCommand.OpenByValue.Измерение1",
      type: "Auto",
      commandGroup: "FormNavigationPanelGoTo",
      itemType: "CommandInterfaceItem",
    },
  ],
  CommandBar: [
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
      visible: { common: false, values: [] },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormCommandBarCreateBasedOn",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
  ],
}

export const fullCommandInterfaceYAML: CommandInterfaceYAML = {
  ПанельНавигации: [
    {
      Команда: "InformationRegister.РегистрСведенийКомандныйИнтерфейс.StandardCommand.OpenByValue.Измерение1",
      Тип: "Auto",
      Автовидимость: "Ложь",
    },
    {
      Команда: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      Тип: "Added",
      ГруппаКоманд: "ПанельНавигацииФормыВажное",
      Автовидимость: "Ложь",
      ЗапретитьИспользование: {},
    },
    {
      Команда: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      Тип: "Added",
      ГруппаКоманд: "ПанельНавигацииФормыСмТакже",
      Автовидимость: "Ложь",
    },
    {
      Команда: "InformationRegister.РегистрСведенийКомандныйИнтерфейс1.StandardCommand.OpenByValue.Измерение1",
      Тип: "Auto",
      ГруппаКоманд: "ПанельНавигацииФормыПерейти",
    },
  ],
  КоманднаяПанель: [
    {
      Команда: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      Тип: "Added",
      ГруппаКоманд: "КоманднаяПанельФормыВажное",
      Автовидимость: "Ложь",
      ЗапретитьИспользование: {},
    },
    {
      Команда: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      Тип: "Added",
      ГруппаКоманд: "КоманднаяПанельФормыСоздатьНаОсновании",
      Автовидимость: "Ложь",
    },
  ],
}
```

- [ ] **Step 2: Write failing tests for false-only behavior and schema**

Append these tests to `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`:

```ts
  it("does not create defaultVisible when DefaultVisible is absent", () => {
    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, {
      CommandBar: {
        Item: {
          Command: "Catalog.Справочник.Command.Команда",
          Type: "Auto",
        },
      },
    })

    expect(result?.CommandBar[0]).toEqual({
      command: "Catalog.Справочник.Command.Команда",
      type: "Auto",
      itemType: "CommandInterfaceItem",
    })
  })
```

Append this test to `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`:

```ts
  it("does not export DefaultVisible when defaultVisible is absent", () => {
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, {
      itemType: "CommandInterface",
      NavigationPanel: [],
      CommandBar: [
        {
          command: "Catalog.Справочник.Command.Команда",
          type: "Auto",
          itemType: "CommandInterfaceItem",
        },
      ],
    })

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).not.toContain("<DefaultVisible>")
  })
```

Create `packages/core/metadata/forms/commonObjects/commandInterface/toJSONSchema.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCommandInterfaceToJSONSchema } from "./toJSONSchema"

type ObjectSchema = {
  properties: {
    ПанельНавигации: {
      items: {
        required?: string[]
        properties: {
          Автовидимость: { const?: string; anyOf?: unknown; oneOf?: unknown }
        }
      }
    }
  }
}

describe("exportCommandInterfaceToJSONSchema", () => {
  it("allows only explicit false for Автовидимость", () => {
    const schema = exportCommandInterfaceToJSONSchema({
      context: mockContext,
      rule: mockRule,
      value: undefined,
    }) as ObjectSchema
    const itemSchema = schema.properties.ПанельНавигации.items

    expect(itemSchema.properties.Автовидимость.const).toBe("Ложь")
    expect(itemSchema.properties.Автовидимость.anyOf).toBeUndefined()
    expect(itemSchema.properties.Автовидимость.oneOf).toBeUndefined()
    expect(itemSchema.required ?? []).not.toContain("Автовидимость")
  })
})
```

- [ ] **Step 3: Run the CommandInterface tests and confirm the new tests fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toJSONSchema.test.ts
```

Expected: FAIL. Failures mention `defaultVisible: true`, schema accepting both boolean YAML values, or fixture mismatch against the new XML.

- [ ] **Step 4: Update CommandInterface types and schema**

In `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`:

```ts
import { Static, Type } from "@sinclair/typebox"
import { StringboolXML } from "~/metadata/commonObjects/boolean/types"
import { UserVisible, UserVisibleJSONSchema, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { MetadataItem } from "~/metadata/orchestration"
import * as SE from "~/metadata/systemEnumerations/types"
```

Change `CommandInterfaceItem`:

```ts
export interface CommandInterfaceItem extends MetadataItem {
  itemType: "CommandInterfaceItem"
  command: string
  type?: string
  index?: number
  commandGroup?: SE.StandardCommandsGroup
  defaultVisible?: false
  visible?: UserVisible
}
```

Change XML type:

```ts
export interface CommandInterfaceItemXML {
  Command: string
  Type: string
  CommandGroup?: SE.StandardCommandsGroup
  Index?: number | string
  DefaultVisible?: StringboolXML
  Visible?: UserVisibleXML
}
```

Change `CommandInterfaceItemJSONSchema`:

```ts
export const CommandInterfaceItemJSONSchema = Type.Object({
  Команда: Type.String(),
  Тип: Type.Optional(Type.String()),
  Индекс: Type.Optional(Type.Number()),
  ГруппаКоманд: Type.Optional(Type.Union(standardCommandsGroups)),
  Автовидимость: Type.Optional(Type.Literal("Ложь")),
  РазрешитьИспользование: Type.Optional(UserVisibleJSONSchema),
  ЗапретитьИспользование: Type.Optional(UserVisibleJSONSchema),
})
```

- [ ] **Step 5: Update fromXML**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`, add imports:

```ts
import { importBooleanFromXML } from "~/metadata/commonObjects/boolean/fromXML"
import { importNumberFromXML } from "~/metadata/commonObjects/number/fromXML"
```

Replace the `values` initialization in `importCommandInterfaceItemFromXML`:

```ts
  const values: Partial<CommandInterfaceItem> = {
    command: item.Command,
    type: item.Type,
    index: importNumberFromXML(context, undefined, item.Index),
    commandGroup: item.CommandGroup,
  }

  const defaultVisible = importBooleanFromXML(context, undefined, item.DefaultVisible)
  if (defaultVisible === false) {
    values.defaultVisible = false
  }
```

Keep the ordered keys arrays unchanged; an absent `defaultVisible` is filtered by `value !== undefined`.

- [ ] **Step 6: Update fromYAML**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`, remove the `importBooleanFromYAML` import.

Replace the item construction:

```ts
  const result: CommandInterfaceItem = {
    command: item.Команда,
    type: item.Тип,
    itemType: "CommandInterfaceItem",
  }

  if (item.Автовидимость === "Ложь") {
    result.defaultVisible = false
  }
```

Keep `index`, `commandGroup`, and `visible` handling after this block.

- [ ] **Step 7: Update toYAML**

In `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`, remove the `exportBooleanToYAML` import.

Replace the item export function body:

```ts
  const result: CommandInterfaceItemYAML = {
    Команда: item.command,
    Тип: item.type,
  }

  if (item.defaultVisible === false) {
    result.Автовидимость = "Ложь"
  }
```

Change the visible export condition so empty deny stays visible in YAML:

```ts
  if (item.visible) {
    const visibleYAML = exportUserVisibleToYAMLDeprecated(context, undefined, item.visible, {
      allow: UserVisibleKeysYAML.Allow,
      deny: UserVisibleKeysYAML.Deny,
    })
    if (visibleYAML) {
      Object.assign(result, visibleYAML)
    }
  }
```

- [ ] **Step 8: Check toXML**

In `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`, keep this assignment:

```ts
    DefaultVisible: item.defaultVisible,
```

Because `item.defaultVisible` is now `false | undefined`, `toXML` already emits only `<DefaultVisible>false</DefaultVisible>` or omits the tag.

- [ ] **Step 9: Run CommandInterface tests and confirm they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toJSONSchema.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit Task 1**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface
git commit -m "fix(core): :bug: сохранять DefaultVisible только для false"
```

Expected: commit includes the user-updated `full.xml`, fixture updates, tests, and CommandInterface code.

---

### Task 2: Preserve numeric-looking XML text

**Files:**
- Modify: `packages/core/xml/import/importer.ts`
- Create: `packages/core/xml/import/importer.test.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/types.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.test.ts`

- [ ] **Step 1: Write failing importer test**

Create `packages/core/xml/import/importer.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { importContentFromXML } from "./importer"

describe("importContentFromXML", () => {
  it("preserves numeric-looking text nodes as strings", () => {
    const xml = `<root><Presentation><v8:item><v8:lang>ru</v8:lang><v8:content>2.0</v8:content></v8:item></Presentation></root>`

    const result = importContentFromXML<{
      root: {
        Presentation: {
          "v8:item": {
            "v8:lang": string
            "v8:content": string
          }
        }
      }
    }>(xml)

    expect(result.root.Presentation["v8:item"]["v8:content"]).toBe("2.0")
    expect(typeof result.root.Presentation["v8:item"]["v8:content"]).toBe("string")
  })
})
```

- [ ] **Step 2: Add FormChoiceList numeric-presentation fixture**

Append to `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts`:

```ts
export const withNumericPresentation: MetadataFormChoiceListValue = {
  type: "formChoiceListDesTimeValue",
  presentation: { items: { ru: "2.0" } },
  value: { type: "boolean", value: false },
}

export const withNumericPresentationXML = `<Value xsi:type="FormChoiceListDesTimeValue">
	<Presentation>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>2.0</v8:content>
		</v8:item>
	</Presentation>
	<Value xsi:type="xs:boolean">false</Value>
</Value>`
```

- [ ] **Step 3: Add failing FormChoiceList tests**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromXML.test.ts`, add imports:

```ts
  withNumericPresentation,
  withNumericPresentationXML,
```

Append test:

```ts
  it("preserves numeric-looking presentation content", () => {
    const result = importFormChoiceListFromXML(mockContextFromXML(), parseXML(withNumericPresentationXML))
    expect(result).toEqual(withNumericPresentation)
  })
```

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.test.ts`, add imports:

```ts
import { importContentFromXML } from "~/xml/import/importer"
```

Add these fixture names to the existing `./__fixtures__/data` import:

```ts
  withNumericPresentation,
  withNumericPresentationXML,
```

Append test:

```ts
  it("round-trips numeric-looking presentation content without normalization", () => {
    const xmlNode = exportFormChoiceListToXML(mockContext, withNumericPresentation)
    const xmlString = xmlExport({ Value: xmlNode }, false)
    const parsed = importContentFromXML<{ root: { Value: any } }>(`<root>${xmlString}</root>`)
    const reimported = importFormChoiceListFromXML(mockContextFromXML(), parsed.root.Value)

    expect(xmlString).toEqual(withNumericPresentationXML)
    expect(reimported).toEqual(withNumericPresentation)
  })
```

- [ ] **Step 4: Run new tests and confirm they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/xml/import/importer.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromXML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.test.ts
```

Expected: FAIL. Failures show `2` instead of `"2.0"`.

- [ ] **Step 5: Disable global tag-value parsing in importer**

In `packages/core/xml/import/importer.ts`, add `parseTagValue: false` to the first `XMLParser` options:

```ts
  const parser = new XMLParser({
    preserveOrder: true,
    attributeNamePrefix: "_",
    attributesGroupName: "@attributes",
    ignoreAttributes: ["xsi:nil"],
    parseTagValue: false,
    numberParseOptions: { leadingZeros: false, hex: true, eNotation: true },
    trimValues: false,
  })
```

Change `defaultOptions`:

```ts
  parseTagValue: false,
```

- [ ] **Step 6: Update UserVisible XML types**

In `packages/core/metadata/commonObjects/userVisible/types.ts`, import `StringboolXML`:

```ts
import { BooleanJSONSchema, StringboolXML, StringboolYAML } from "../boolean/types"
```

Change XML interfaces:

```ts
export interface UserVisibleItemXML {
  _name: string
  "#text": StringboolXML
}

export type UserVisibleXML = {
  "xr:Common"?: StringboolXML
  "xr:Value"?: UserVisibleItemXML[] | UserVisibleItemXML
}
```

- [ ] **Step 7: Update UserVisible fromXML boolean conversion**

In `packages/core/metadata/commonObjects/userVisible/fromXML.ts`, import boolean converter:

```ts
import { importBooleanFromXML } from "../boolean/fromXML"
```

Change the `xr:Common` block:

```ts
  if (xml["xr:Common"] !== undefined) {
    const common = importBooleanFromXML(_context, undefined, xml["xr:Common"])
    if (common !== undefined) {
      result.common = common
    }
  }
```

Change value push:

```ts
      const value = importBooleanFromXML(_context, undefined, item["#text"])
      result.values.push({
        name: item["_name"].replace(/^Role\./, ""),
        value: value ?? false,
      })
```

- [ ] **Step 8: Run focused XML import tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/xml/import/importer.test.ts packages/core/metadata/commonObjects/i8nText/fromXML.test.ts packages/core/metadata/commonObjects/formattedI8nText/fromXML.test.ts packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromXML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.test.ts packages/core/metadata/commonObjects/metadataValue/fixedArray/fromXML.test.ts packages/core/metadata/commonObjects/number/fromXML.test.ts packages/core/metadata/commonObjects/userVisible/fromXML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts
```

Expected: PASS. Parser-induced failures in `UserVisible` are fixed by Step 7. Parser-induced failures in `CommandInterface.Index` are fixed by Task 1 Step 5. Do not re-enable global `parseTagValue`.

- [ ] **Step 9: Commit Task 2**

Run:

```bash
git add packages/core/xml/import/importer.ts packages/core/xml/import/importer.test.ts packages/core/metadata/commonObjects/userVisible packages/core/metadata/commonObjects/metadataValue/formChoiceList
git commit -m "fix(core): :bug: сохранять текстовые XML-значения без числовой нормализации"
```

Expected: commit includes importer, UserVisible conversion, and FormChoiceList regression coverage.

---

### Task 3: ButtonGroup DisplayImportance and fixture sync

**Files:**
- Modify: `packages/core/metadata/forms/elements/buttonGroup/rules.ts`
- Modify: `packages/core/metadata/forms/elements/buttonGroup/__fixtures__/data.ts`
- Keep and stage: `packages/core/metadata/forms/elements/buttonGroup/__fixtures__/full.xml`

- [ ] **Step 1: Add the missing ButtonGroup rule**

In `packages/core/metadata/forms/elements/buttonGroup/rules.ts`, add `displayImportance` immediately after `name`:

```ts
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    },
```

The start of `properties` should become:

```ts
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    },
    childItems: {
      yaml: "Элементы",
      type: "CommandBarChildItems",
      // toPartialYAML: false,
      defaultValue: [],
      required: true,
    },
```

- [ ] **Step 2: Update `fullButtonGroup` model fixture**

In `packages/core/metadata/forms/elements/buttonGroup/__fixtures__/data.ts`, replace `fullButtonGroup` with:

```ts
export const fullButtonGroup: ButtonGroup = {
  itemType: "ButtonGroup",
  name: "ГруппаКнопок",
  ...fullFormGroupCommonFixture,
  displayImportance: "VeryHigh",
  verticalAlignInGroup: "Center",
  childItems: [
    {
      itemType: "CommandBarButton",
      name: "ФормаКоманда1",
      type: "CommandBarButton",
      commandName: "Form.Command.Команда1",
      extendedTooltip: {
        itemType: "ExtendedTooltip",
      },
    },
  ],
  representation: "Compact",
  commandSource: "FormCommandPanelGlobalCommands",
}
```

- [ ] **Step 3: Update enterprise fixture**

Replace `fullButtonGroupEnterprise` with:

```ts
export const fullButtonGroupEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_ГруппаКнопок",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.ButtonGroup" },
  ChildItems: [
    {
      ElementType: "FormButton",
      Type: { Type: "SystemEnumeration", Value: "FormButtonType.CommandBarButton" },
      Name: "prefix_ФормаКоманда1",
      CommandName: "КомандаЗаглушка",
    },
  ],
  DisplayImportance: {
    Type: "SystemEnumeration",
    Value: "DisplayImportance.VeryHigh",
  },
  Representation: {
    Type: "SystemEnumeration",
    Value: "ButtonGroupRepresentation.Compact",
  },
  ...fullFormGroupEnterpriseCommonFixture,
  VerticalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Center",
  },
  Title: "Заголовок элемента",
  CommandSource: "FormCommandPanelGlobalCommands",
} satisfies Required<ButtonGroupEnterprise>
```

- [ ] **Step 4: Update YAML fixtures**

Replace `fullButtonGroupPartialYAML` and keep typed wrapper:

```ts
export const fullButtonGroupPartialYAML: ButtonGroupPartialYAML = {
  ...fullFormGroupPartialYAMLCommonFixture,
  ВажностьПриОтображении: "ОченьВысокая",
  ВертикальноеПоложениеВГруппе: "Центр",
  ИсточникКоманд: "FormCommandPanelGlobalCommands",
  Отображение: "Компактное",
  Элементы: {
    ФормаКоманда1: {
      Тип: "КнопкаКоманднойПанели",
      Вид: "КнопкаКоманднойПанели",
      ИмяКоманды: "Form.Command.Команда1",
    },
  },
}

export const fullButtonGroupTypedYAML: ButtonGroupTypedYAML = {
  Тип: "ГруппаКнопок",
  Заголовок: "Заголовок элемента",
  ...fullButtonGroupPartialYAML,
}
```

Remove old overrides from the previous fixture:

```ts
СочетаниеКлавиш: "S"
РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" }
ШрифтЗаголовка: "ОбычныйШрифтТекста"
ЦветТекстаЗаголовка: "Черный"
ОтображениеПодсказки: "Нет"
РастягиватьПоВертикали: "Истина" as any
Ширина: 300
Высота: 200
```

- [ ] **Step 5: Run ButtonGroup tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/__tests__/fromXML.test.ts packages/core/metadata/forms/elements/__tests__/toXML.test.ts packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts packages/core/metadata/forms/elements/__tests__/toYAML.test.ts packages/core/metadata/forms/elements/__tests__/toEnterprise.test.ts -t ButtonGroup
```

Expected: PASS for ButtonGroup cases. The XML comparison uses the user-updated `buttonGroup/__fixtures__/full.xml`.

- [ ] **Step 6: Run nearby DisplayImportance fixtures**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/__tests__/fromXML.test.ts packages/core/metadata/forms/elements/__tests__/toXML.test.ts packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts packages/core/metadata/forms/elements/__tests__/toYAML.test.ts packages/core/metadata/forms/elements/__tests__/toEnterprise.test.ts -t "ButtonGroup|CommandBar|Pages|ColumnGroup|Table|UsualGroup"
```

Expected: PASS. This verifies the new rule matches the existing `DisplayImportance` pattern and does not change neighboring elements.

- [ ] **Step 7: Commit Task 3**

Run:

```bash
git add packages/core/metadata/forms/elements/buttonGroup
git commit -m "fix(core): :bug: учитывать важность отображения группы кнопок"
```

Expected: commit includes the user-updated `full.xml`, the new rule, and synchronized fixtures.

---

## Post-Implementation Verification

After all tasks are committed, run from `/Users/nikita/git/nakidka-core/.worktrees/round-trip-command-interface-planning`:

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

Expected: PASS.

Then run the short round-trip triage against the same batch:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 6
```

Expected: the previous `DefaultVisible>true`, `v8:content>2.0`, and `ButtonGroup DisplayImportance` diffs are gone from entries 6-10. New unrelated diffs can be reported separately without folding them into this plan.
