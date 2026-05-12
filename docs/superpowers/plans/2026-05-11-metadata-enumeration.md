# Metadata Enumeration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Довести `packages/core/metadata/appliedObjects/metadataEnumeration` до полноценного XML metadataItem для объекта 1С `Enum`, не начиная YAML-цикл до зелёного XML-цикла.

**Architecture:** Перечисление строится по образцу `metadataCatalog`/`metadataDocument`: верхний `MetadataEnumerationRules` описывает `MetaDataObject > Enum`, дочерние значения оформляются отдельным `MetadataEnumerationValueRules` и коллекционным типом `MetadataEnumerationValues`, а команды/формы/макеты используют существующие коллекционные типы. YAML-имена фиксируются в `rules.ts` сразу, но YAML-поведенческие аннотации (`defaultValueYAML`, `toYAML: false`, `fromYAML: false`, `excludeIfEqualNameYAML`, `useAsShortValueYAML`) добавляются только после полного XML-цикла.

**Tech Stack:** TypeScript, Vitest, `fast-xml-parser`, orchestration metadata rules, `pnpm --filter @nakidka/core exec vitest`.

---

## File Structure

- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts` — правила верхнего `Enum` и нового `EnumValue`.
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/types.ts` — типы XML/model/YAML, регистрация верхнего объекта и коллекции значений.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/index.ts` — единая точка регистрации Перечисления.
- Modify: `packages/core/metadata/appliedObjects/index.ts` — импорт `./metadataEnumeration`.
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts` — тип верхнего metadataItem.
- Modify: `packages/core/metadata/orchestration/property/registry.ts` — типы property registry и `PropertyRuleTypeKeys`.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.xml` — копия `/Users/nikita/git/roundTripElements/Enums/ПеречислениеВсеСвойства.xml`.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.xml` — копия `/Users/nikita/git/roundTripElements/Enums/ПеречислениеПоУмолчанию.xml`.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts` — TS-фикстура после зелёного XML round-trip.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts` — TS-фикстура после зелёного XML round-trip.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/fromXML.test.ts` — XML round-trip и проверки импорта.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/toXML.test.ts` — проверки экспорта XML.
- Keep: existing `fromYAML.ts`, `valuesFromYAML.ts`, `fromYAML.test.ts`, `values.yaml`, `toJSONSchema.ts` unless XML changes require type import compatibility. Do not add new YAML fixtures in this plan.

## Guardrails

- Do not edit `/Users/nikita/git/roundTripElements/Enums/*.xml`; copy from them into repo fixtures.
- Ignore `/Users/nikita/git/roundTripElements/Enums/Перечисление1.xml`.
- Do not add `<fixtureName>YAML` exports during this plan.
- Do not add `defaultValueYAML`, `toYAML: false`, `fromYAML: false`, `excludeIfEqualNameYAML`, or `useAsShortValueYAML` except where already present in untouched legacy code. YAML behavior is a later cycle.
- Prefer `rules.ts`; do not write manual `fromXML`/`toXML`.
- If XML round-trip diff belongs to `StandardAttributeDescriptions`, `CharacteristicsDescriptions`, `MetadataCommands`, `ChildFormNames`, or `ChildTemplateNames`, stop and report the fragment instead of changing those other objects.

---

### Task 1: Add XML Fixtures And Failing Round-Trip Test

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.xml`
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.xml`
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/fromXML.test.ts`

- [ ] **Step 1: Copy XML fixtures into the metadataEnumeration fixture folder**

Run:

```bash
cp /Users/nikita/git/roundTripElements/Enums/ПеречислениеВсеСвойства.xml packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.xml
cp /Users/nikita/git/roundTripElements/Enums/ПеречислениеПоУмолчанию.xml packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.xml
```

Expected: two XML files appear in `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/`.

- [ ] **Step 2: Write the initial XML round-trip test**

Create `packages/core/metadata/appliedObjects/metadataEnumeration/fromXML.test.ts` with:

```typescript
import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataEnumerationRules } from "./rules"
import { MetadataEnumeration } from "./types"

describe("import MetadataEnumeration from XML", () => {
  it.each(["full.xml", "minimal.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
      const data = testImportAppliedObjectFromXML<MetadataEnumeration>({
        rule: MetadataEnumerationRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
      const { result, expected } = testExportAppliedObjectToXML({
        rule: MetadataEnumerationRules,
        importMetaUrl: import.meta.url,
        fixture,
        data: data!,
      })
      expect(result).toEqual(expected)
    }
  )
})
```

- [ ] **Step 3: Run the new test and verify it fails for missing/incomplete XML support**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromXML.test.ts
```

Expected: FAIL. Acceptable failures are missing XML root handling, missing property registrations, or round-trip diffs. A pass here means existing rules already covered the path; still continue with Task 2 because the design requires schema cleanup and registration.

- [ ] **Step 4: Commit the failing test and fixtures**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.xml packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.xml packages/core/metadata/appliedObjects/metadataEnumeration/fromXML.test.ts
git commit -m "test: :white_check_mark: добавить xml round-trip перечисления"
```

Expected: commit created with only fixtures and `fromXML.test.ts`.

---

### Task 2: Implement Enumeration XML Rules And Types

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/types.ts`
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/index.ts`
- Modify: `packages/core/metadata/appliedObjects/index.ts`

- [ ] **Step 1: Replace `rules.ts` with XML-first rules**

Rewrite `packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts` so it has these structural parts:

```typescript
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule, type ReferenceScope } from "~/metadata/orchestration/property/types"
import { MetadataCommandRules } from "../metadataCommand/rules"

const enumProperties = ["Properties"]
const enumChildObjects = ["ChildObjects"]

export const MetadataEnumerationStandardAttributeNames: Record<string, string> = {
  Order: "Порядок",
  Ref: "Ссылка",
}

export const MetadataEnumerationValueRules = {
  itemType: "MetadataEnumerationValue",
  properties: {
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
    },
    name: {
      type: "string",
      xml: "Name",
      required: true,
      xmlParents: ["Properties"],
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xml: "Synonym",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xml: "Comment",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: ["Properties"],
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule

export const MetadataEnumerationRules = {
  itemType: "MetadataEnumeration",
  itemTypePrefix: "Перечисление",
  xmlDir: "Enums",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "Enum",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "EnumRef", category: "Ref" },
        { name: "EnumManager", category: "Manager" },
        { name: "EnumList", category: "List" },
      ],
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      type: "string",
      xmlParents: enumProperties,
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: enumProperties,
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      defaultValueXML: false,
      xmlParents: enumProperties,
    },
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      type: "StandardAttributeDescriptions",
      standartAttributeNames: MetadataEnumerationStandardAttributeNames,
      xmlParents: enumProperties,
    },
    characteristics: {
      yaml: "Характеристики",
      type: "CharacteristicsDescriptions",
      xmlParents: enumProperties,
      defaultValueXMLRaw: {},
    },
    quickChoice: {
      yaml: "БыстрыйВыбор",
      type: "boolean",
      defaultValueXML: true,
      xmlParents: enumProperties,
    },
    choiceMode: {
      yaml: "СпособВыбора",
      type: "SystemEnumeration",
      typeSE: "ChoiceMode",
      defaultValueXML: "BothWays",
      xmlParents: enumProperties,
    },
    defaultListForm: {
      yaml: "ОсновнаяФормаСписка",
      type: "string",
      xmlParents: enumProperties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    defaultChoiceForm: {
      yaml: "ОсновнаяФормаДляВыбора",
      type: "string",
      xmlParents: enumProperties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    auxiliaryListForm: {
      yaml: "ДополнительнаяФормаСписка",
      type: "string",
      xmlParents: enumProperties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    auxiliaryChoiceForm: {
      yaml: "ДополнительнаяФормаДляВыбора",
      type: "string",
      xmlParents: enumProperties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    managerModule: {
      type: "Module",
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
      toXML: false,
      fromXML: false,
    },
    listPresentation: {
      yaml: "ПредставлениеСписка",
      type: "I8nText",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    extendedListPresentation: {
      yaml: "РасширенноеПредставлениеСписка",
      type: "I8nText",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    explanation: {
      yaml: "Пояснение",
      type: "I8nText",
      xmlParents: enumProperties,
      defaultValueXMLRaw: "",
    },
    choiceHistoryOnInput: {
      yaml: "ИсторияВыбораПриВводе",
      type: "SystemEnumeration",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      xmlParents: enumProperties,
    },
    enumValues: {
      yaml: "Значения",
      type: "MetadataEnumerationValues",
      xmlParents: enumChildObjects,
      xml: "EnumValue",
    },
    commands: {
      yaml: "Команды",
      type: "MetadataCommands",
      xmlParents: enumChildObjects,
      xml: "Command",
    },
    forms: {
      type: "ChildFormNames",
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      xmlParents: enumChildObjects,
    },
    templates: {
      type: "ChildTemplateNames",
      xml: "Template",
      folderName: "Шаблоны",
      forReferenceOnly: true,
      xmlParents: enumChildObjects,
    },
  },
  requiredXMLParents: [["ChildObjects"]],
  graphTerminals: ["ПустаяСсылка"],
  childCollections: [{ propertyKey: "commands", itemRule: MetadataCommandRules }],
} as const satisfies MetadataItemRule

export function getEnumerationPropertyReferenceScope(yamlKey: string): ReferenceScope | undefined {
  for (const rule of Object.values(MetadataEnumerationRules.properties)) {
    const r = rule as { yaml?: string; referenceScope?: ReferenceScope }
    if (r.yaml === yamlKey && r.referenceScope != null) {
      return r.referenceScope
    }
  }
  return undefined
}
```

If `type: "uuid"` does not compile for the existing `uuid` handling, use the local pattern from `metadataDocumentNumerator` for top-level uuid and `uuidPropertyRule` for `MetadataEnumerationValueRules.uuid`.

- [ ] **Step 2: Rewrite `types.ts` around rule-derived types and XML interfaces**

Keep existing exports used by `fromYAML.ts` and `toJSONSchema.ts`, but derive model/YAML types from rules. The file must include:

```typescript
import { MetadataCommandsXML, MetadataCommandsYAML } from "~/metadata/appliedObjects/metadataCommand/types"
import {
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionsYAML,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { ChildFormNamesXML } from "~/metadata/commonObjects/childFormNames/types"
import { ChildTemplateNamesXML } from "~/metadata/commonObjects/childTemplateNames/types"
import { I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { InternalInfoItemsXML } from "~/metadata/commonObjects/internalInfo/types"
import {
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionsYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataEnumerationRules, MetadataEnumerationValueRules } from "./rules"

export type MetadataEnumeration = MetadataTypeByRule<typeof MetadataEnumerationRules>
export type MetadataEnumerationYAML = YAMLTypeByRule<typeof MetadataEnumerationRules>
export type MetadataEnumerationValue = MetadataTypeByRule<typeof MetadataEnumerationValueRules>
export type MetadataEnumerationValueYAML = YAMLTypeByRule<typeof MetadataEnumerationValueRules>
export type MetadataEnumerationValues = MetadataEnumerationValue[]
export type MetadataEnumerationValuesYAML = Record<string, MetadataEnumerationValueYAML>

export type EnumerationInternalInfoParamsXML = [
  { name: string; category: "Ref" },
  { name: string; category: "Manager" },
  { name: string; category: "List" },
]

export interface MetadataEnumerationValueXML {
  _uuid: string
  Properties: {
    Comment?: string
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    Synonym?: I8nTextXML
  }
}

export type MetadataEnumerationValuesXML = MetadataEnumerationValueXML | MetadataEnumerationValueXML[]

export interface MetadataEnumerationXML {
  _xmlns?: string
  "_xmlns:app"?: string
  "_xmlns:cfg"?: string
  "_xmlns:cmi"?: string
  "_xmlns:ent"?: string
  "_xmlns:lf"?: string
  "_xmlns:style"?: string
  "_xmlns:sys"?: string
  "_xmlns:v8"?: string
  "_xmlns:v8ui"?: string
  "_xmlns:web"?: string
  "_xmlns:win"?: string
  "_xmlns:xen"?: string
  "_xmlns:xpr"?: string
  "_xmlns:xr"?: string
  "_xmlns:xs"?: string
  "_xmlns:xsi"?: string
  _version: string
  Enum: {
    _uuid: string
    InternalInfo: InternalInfoItemsXML<EnumerationInternalInfoParamsXML> | undefined
    Properties: {
      AuxiliaryChoiceForm?: string
      AuxiliaryListForm?: string
      Characteristics?: CharacteristicsDescriptionsXML
      ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
      ChoiceMode?: SE.ChoiceMode
      Comment?: string
      DefaultChoiceForm?: string
      DefaultListForm?: string
      Explanation?: I8nTextXML
      ExtendedListPresentation?: I8nTextXML
      ListPresentation?: I8nTextXML
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      QuickChoice?: boolean
      StandardAttributes?: StandardAttributeDescriptionsXML
      Synonym?: I8nTextXML
      UseStandardCommands?: boolean
    }
    ChildObjects?: {
      Command?: MetadataCommandsXML
      EnumValue?: MetadataEnumerationValuesXML
      Form?: ChildFormNamesXML
      Template?: ChildTemplateNamesXML
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataEnumeration",
  itemRule: MetadataEnumerationRules,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataEnumerationValues",
  itemRule: MetadataEnumerationValueRules,
  xmlElement: "EnumValue",
  keyField: "name",
})

export interface MetadataEnumerationValueFullYAML {
  Комментарий?: string
  Синоним?: I8nTextYAML
}

export interface MetadataEnumerationFullYAML {
  БыстрыйВыбор?: import("~/metadata/commonObjects/boolean/types").StringboolYAML
  ДополнительнаяФормаДляВыбора?: string
  ДополнительнаяФормаСписка?: string
  Значения?: MetadataEnumerationValuesYAML
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputYAML
  ИспользоватьСтандартныеКоманды?: import("~/metadata/commonObjects/boolean/types").StringboolYAML
  Команды?: MetadataCommandsYAML
  Комментарий?: string
  ОсновнаяФормаДляВыбора?: string
  ОсновнаяФормаСписка?: string
  Пояснение?: I8nTextYAML
  ПредставлениеСписка?: I8nTextYAML
  РасширенноеПредставлениеСписка?: I8nTextYAML
  Синоним?: I8nTextYAML
  СпособВыбора?: SE.ChoiceModeYAML
  СтандартныеРеквизиты?: StandardAttributeDescriptionsYAML
  Характеристики?: CharacteristicsDescriptionsYAML
}
```

If TypeScript rejects duplicate generated YAML aliases, keep `MetadataEnumerationYAML = YAMLTypeByRule<typeof MetadataEnumerationRules>` as the canonical export and remove only the redundant manual `MetadataEnumerationFullYAML` compatibility interface. Do not remove `MetadataEnumerationValuesYAML`; `fromYAML.ts` imports it.

- [ ] **Step 3: Add `index.ts` for side-effect registration**

Create `packages/core/metadata/appliedObjects/metadataEnumeration/index.ts`:

```typescript
import "./types"
import "./fromYAML"
```

- [ ] **Step 4: Update applied object side-effect imports**

In `packages/core/metadata/appliedObjects/index.ts`, replace:

```typescript
import "./metadataEnumeration/fromYAML"
```

with:

```typescript
import "./metadataEnumeration"
```

- [ ] **Step 5: Run the enumeration XML test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromXML.test.ts
```

Expected: FAIL with XML diffs or type errors that identify remaining registry gaps. If it fails because `MetadataEnumerationValues` is not in property registry, continue to Task 3 before debugging round-trip.

- [ ] **Step 6: Commit rules and type skeleton**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts packages/core/metadata/appliedObjects/metadataEnumeration/types.ts packages/core/metadata/appliedObjects/metadataEnumeration/index.ts packages/core/metadata/appliedObjects/index.ts
git commit -m "feat: :sparkles: описать xml-правила перечисления"
```

Expected: commit created even if the focused test still fails due to registry entries planned in Task 3.

---

### Task 3: Register Enumeration In Orchestration Registries

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Register the top-level metadata item type**

In `packages/core/metadata/orchestration/metadataItem/registry.ts`, add imports next to the other applied object imports:

```typescript
import {
  MetadataEnumeration,
  MetadataEnumerationYAML,
} from "../../appliedObjects/metadataEnumeration/types"
```

Add this key to `MetadataItemTypeRegistry`:

```typescript
MetadataEnumeration: {
  metadata: MetadataEnumeration
  yaml: MetadataEnumerationYAML
}
```

- [ ] **Step 2: Register the enum value collection as a property type**

In `packages/core/metadata/orchestration/property/registry.ts`, ensure the existing import from `metadataEnumeration/types` includes:

```typescript
MetadataEnumerationValues,
MetadataEnumerationValuesYAML,
```

Add this key to `PropertyTypeRegistry`:

```typescript
MetadataEnumerationValues: {
  item: MetadataEnumerationValues
  yaml: MetadataEnumerationValuesYAML
}
```

Add this key to `PropertyRuleTypeKeys`:

```typescript
MetadataEnumerationValues: "MetadataEnumerationValues",
```

If `MetadataEnumeration` itself is absent from `PropertyTypeRegistry`, add it too:

```typescript
MetadataEnumeration: {
  item: MetadataEnumeration
  yaml: MetadataEnumerationYAML
}
```

and add:

```typescript
MetadataEnumeration: "MetadataEnumeration",
```

- [ ] **Step 3: Run TypeScript through the focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromXML.test.ts
```

Expected: the test runs. It may still FAIL on XML round-trip content; it must not fail with missing registry/type-key errors.

- [ ] **Step 4: Commit registry wiring**

Run:

```bash
git add packages/core/metadata/orchestration/metadataItem/registry.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: :sparkles: зарегистрировать тип перечисления"
```

Expected: commit created with registry-only changes.

---

### Task 4: Complete XML Round-Trip

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/types.ts` only if XML type declarations are incomplete
- Test: `packages/core/metadata/appliedObjects/metadataEnumeration/fromXML.test.ts`

- [ ] **Step 1: Run the round-trip and capture the first diff**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromXML.test.ts
```

Expected: either PASS or FAIL with a concrete XML diff.

- [ ] **Step 2: Fix only MetadataEnumeration-owned XML differences**

Use this decision table:

```text
Missing <Properties>/<KnownProperty> on export:
  add or correct that property in MetadataEnumerationRules.

Unexpected extra default on export:
  remove defaultValueXML or replace it with defaultValueXMLRaw when the fixture uses an empty tag.

Empty tag from source disappears on export:
  add defaultValueXMLRaw: "" for strings/I8nText or defaultValueXMLRaw: {} for empty composite collections.

Bool mismatch true/false:
  keep UseStandardCommands defaultValueXML false and QuickChoice defaultValueXML true.

Diff under <xr:StandardAttribute>:
  stop and report; do not edit standardAttributeDescription rules in this task.

Diff under <xr:Characteristic>:
  stop and report; do not edit characteristicsDescription rules in this task.

Diff under <Command>:
  stop and report; do not edit metadataCommand rules in this task.
```

- [ ] **Step 3: Repeat the focused round-trip until it is green**

Run after every rules change:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromXML.test.ts
```

Expected: PASS for both `full.xml` and `minimal.xml`. Stop after three iterations without reducing the diff and report the current diff.

- [ ] **Step 4: Commit the round-trip fixes**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts packages/core/metadata/appliedObjects/metadataEnumeration/types.ts
git commit -m "fix: :bug: стабилизировать xml round-trip перечисления"
```

Expected: commit created only if files changed. If Task 4 passed without changes, skip the commit and note that no commit was needed.

---

### Task 5: Add TS Fixtures And Import Assertions

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts`
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/fromXML.test.ts`

- [ ] **Step 1: Generate `full.ts` from the imported model**

Run a one-off Node/TS script through the project runtime:

```bash
pnpm --filter @nakidka/core exec tsx -e "import { writeFileSync } from 'node:fs'; import { testImportAppliedObjectFromXML } from './tests/appliedObject/index.ts'; import { MetadataEnumerationRules } from './metadata/appliedObjects/metadataEnumeration/rules.ts'; const data = testImportAppliedObjectFromXML({ rule: MetadataEnumerationRules, importMetaUrl: new URL('./metadata/appliedObjects/metadataEnumeration/fromXML.test.ts', import.meta.url).href, fixture: 'full.xml' }); const body = 'import { MetadataEnumeration } from \"../types\"\\n\\nexport const full = ' + JSON.stringify(data, null, 2) + ' satisfies MetadataEnumeration\\n'; writeFileSync('./metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts', body);"
```

Expected: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts` is written with an object satisfying `MetadataEnumeration`. The generated object must not contain `uuid`, `internalInfo`, `forms`, or `templates` reference-only fields.

- [ ] **Step 2: Format and inspect `full.ts`**

Run:

```bash
pnpm --filter @nakidka/core exec prettier --write metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts
sed -n '1,240p' packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts
```

Expected: the file imports `MetadataEnumeration`, exports `full`, and contains no YAML exports.

- [ ] **Step 3: Generate `minimal.ts` from the imported model**

Run:

```bash
pnpm --filter @nakidka/core exec tsx -e "import { writeFileSync } from 'node:fs'; import { testImportAppliedObjectFromXML } from './tests/appliedObject/index.ts'; import { MetadataEnumerationRules } from './metadata/appliedObjects/metadataEnumeration/rules.ts'; const data = testImportAppliedObjectFromXML({ rule: MetadataEnumerationRules, importMetaUrl: new URL('./metadata/appliedObjects/metadataEnumeration/fromXML.test.ts', import.meta.url).href, fixture: 'minimal.xml' }); const body = 'import { MetadataEnumeration } from \"../types\"\\n\\nexport const minimal = ' + JSON.stringify(data, null, 2) + ' satisfies MetadataEnumeration\\n'; writeFileSync('./metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts', body);"
```

Expected: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts` is written with an object satisfying `MetadataEnumeration`.

- [ ] **Step 4: Format and inspect `minimal.ts`**

Run:

```bash
pnpm --filter @nakidka/core exec prettier --write metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts
sed -n '1,180p' packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts
```

Expected: the file imports `MetadataEnumeration`, exports `minimal`, and contains no YAML exports.

- [ ] **Step 5: Add import assertions while keeping round-trip**

Update `fromXML.test.ts` to:

```typescript
import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataEnumerationRules } from "./rules"
import { MetadataEnumeration } from "./types"

describe("import MetadataEnumeration from XML", () => {
  it("should import full", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataEnumeration>({
        rule: MetadataEnumerationRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(full)
  })

  it("should import minimal", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataEnumeration>({
        rule: MetadataEnumerationRules,
        importMetaUrl: import.meta.url,
        fixture: "minimal.xml",
      })
    ).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
      const data = testImportAppliedObjectFromXML<MetadataEnumeration>({
        rule: MetadataEnumerationRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
      const { result, expected } = testExportAppliedObjectToXML({
        rule: MetadataEnumerationRules,
        importMetaUrl: import.meta.url,
        fixture,
        data: data!,
      })
      expect(result).toEqual(expected)
    }
  )
})
```

- [ ] **Step 6: Run import tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit TS fixtures and import assertions**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts packages/core/metadata/appliedObjects/metadataEnumeration/fromXML.test.ts
git commit -m "test: :white_check_mark: покрыть импорт перечисления"
```

Expected: commit created.

---

### Task 6: Add XML Export Test And Focused Verification

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/toXML.test.ts`

- [ ] **Step 1: Create `toXML.test.ts`**

Create `packages/core/metadata/appliedObjects/metadataEnumeration/toXML.test.ts`:

```typescript
import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataEnumerationRules } from "./rules"

describe("export MetadataEnumeration to XML", () => {
  it.each([
    { fixture: "full.xml", data: full },
    { fixture: "minimal.xml", data: minimal },
  ])("should export $fixture fixture", ({ fixture, data }) => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataEnumerationRules,
      importMetaUrl: import.meta.url,
      fixture,
      data,
    })
    expect(result).toEqual(expected)
  })
})
```

- [ ] **Step 2: Run focused XML tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromXML.test.ts metadata/appliedObjects/metadataEnumeration/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run type-oriented related tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/metadataCollection/ruleFactory.test.ts metadata/orchestration/property/helpers.test.ts metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts
```

Expected: PASS. `fromYAML.test.ts` must keep passing because existing YAML importer remains public API.

- [ ] **Step 4: Commit XML export test**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataEnumeration/toXML.test.ts
git commit -m "test: :white_check_mark: покрыть экспорт перечисления"
```

Expected: commit created.

---

### Task 7: Run Final XML-Cycle Verification And Report Coverage

**Files:**
- No planned code changes.

- [ ] **Step 1: Run package-level focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromXML.test.ts metadata/appliedObjects/metadataEnumeration/toXML.test.ts metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts metadata/appliedObjects/configuration/shortRoundTripXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full project tests if closing the issue**

Run from repo root:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Produce fixture coverage report**

Compare `EnumProperties` from `/Users/nikita/git/1c_res/model.xdtobackend_root.res` with `full.xml` and `minimal.xml`. Report in the final implementation summary:

```text
Покрытие свойств фикстурами: 16/19
Непокрытые: ObjectBelonging, ExtendedConfigurationObject, ManagerModule
```

If implementation rules intentionally omit a schema property, list it separately as:

```text
Не реализованы по решению брифа: <property names>
```

- [ ] **Step 4: Do not start YAML implementation**

Stop after XML-cycle verification. The next phase is YAML barrier discussion: generate a YAML draft from TS fixtures and ask the user to confirm key names, nesting, omitted defaults, and `defaultValueYAML` before adding YAML behavior.
