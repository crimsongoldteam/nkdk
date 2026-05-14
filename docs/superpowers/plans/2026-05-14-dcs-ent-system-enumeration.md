# DCS ent:* System Enumeration Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Round-trip known `ent:*` system enumeration values in DCS metadata values without changing the public value model.

**Architecture:** Add a narrow import fallback in `dcsMetadataValue/fromXML.ts` after primitive parsing and before the unsupported-type error. For `DCSParameter` export, infer the same known `ent:*` type from the parameter `valueType` and use a temporary `SystemEnumeration` rule for the `value` field only.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration helpers.

---

### Task 1: Add Import Coverage

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/system-enumeration-accumulation-record-type.xml`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts`

- [ ] **Step 1: Add the fixture data entry**

Add a fixture to `dcsMetadataValueXMLFixtures`:

```ts
{
  id: "systemEnumerationAccumulationRecordTypeInferred",
  title: "SystemEnumeration inferred from ent:AccumulationRecordType",
  rule: { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "value" },
  value: "Expense",
  yaml: "Expense",
  xml: "system-enumeration-accumulation-record-type.xml",
}
```

- [ ] **Step 2: Add the XML fixture**

Create `system-enumeration-accumulation-record-type.xml`:

```xml
<dcscor:value xsi:type="ent:AccumulationRecordType">Expense</dcscor:value>
```

- [ ] **Step 3: Run the red test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts -t "SystemEnumeration inferred from ent:AccumulationRecordType"
```

Expected: FAIL with `DCS MetadataValue: unsupported xsi:type ent:AccumulationRecordType`.

### Task 2: Implement Known ent:* Fallback

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts`

- [ ] **Step 1: Import the system enumeration type map as a runtime value**

Change the system enumeration imports so exported `*ToYAML` maps can be checked at runtime:

```ts
import * as SystemEnumerations from "~/metadata/systemEnumerations/types"
import type { SystemEnumerationPropertyRule, SystemEnumerationTypeMap } from "~/metadata/systemEnumerations/types"
```

- [ ] **Step 2: Add a helper for known ent:* type names**

Add near `hasSystemEnumeration`:

```ts
const inferEntSystemEnumerationType = (xsi: string | undefined): keyof SystemEnumerationTypeMap | undefined => {
  if (xsi === undefined || !xsi.startsWith("ent:")) return undefined

  const typeName = xsi.slice("ent:".length)
  const yamlMapName = `${typeName}ToYAML`
  return Object.prototype.hasOwnProperty.call(SystemEnumerations, yamlMapName)
    ? (typeName as keyof SystemEnumerationTypeMap)
    : undefined
}
```

- [ ] **Step 3: Delegate inferred values to the existing importer**

Add after the explicit `hasSystemEnumeration(rule)` branch, before the unsupported error:

```ts
const inferredTypeSE = inferEntSystemEnumerationType(xsi)
if (inferredTypeSE !== undefined) {
  return importSystemEnumerationFromDcsXML(
    context,
    { type: "SystemEnumeration", typeSE: inferredTypeSE } as SystemEnumerationPropertyRule,
    xml as SystemEnumerationDcsValueRootXML
  )
}
```

- [ ] **Step 4: Run the green test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts -t "SystemEnumeration inferred from ent:AccumulationRecordType"
```

Expected: PASS.

### Task 3: Verify Nearby Behavior

**Files:**
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts`

- [ ] **Step 1: Run DCS metadata value XML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts
```

Expected: PASS.

### Task 4: Export DCS Parameter ent:* Values From valueType

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXML.test.ts`

- [ ] **Step 1: Add a red import+export test**

Add a DCS parameter XML fixture inline in `fromXML.test.ts`:

```xml
<Settings>
	<Parameter>
		<dcssch:name>ВидДвижения</dcssch:name>
		<dcssch:valueType>
			<v8:Type>ent:AccumulationRecordType</v8:Type>
		</dcssch:valueType>
		<dcssch:value xsi:type="ent:AccumulationRecordType">Expense</dcssch:value>
		<dcssch:useRestriction>true</dcssch:useRestriction>
	</Parameter>
</Settings>
```

Assert that import returns `valueType: { type: ["AccumulationRecordType"] }` and `value: "Expense"`,
then assert export contains:

```xml
<dcssch:value xsi:type="ent:AccumulationRecordType">Expense</dcssch:value>
```

- [ ] **Step 2: Run the red test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXML.test.ts -t "imports and exports ent system enumeration value"
```

Expected: FAIL with `MetadataValue: неподдерживаемый тип для экспорта в XML: undefined`.

- [ ] **Step 3: Add dynamic export rule selection**

In `dcsParameter/toXML.ts`, infer a known `ent:*` system enumeration from `item.valueType`. When it
matches, pass `exportMetadataItemToXML` a copy of `DCSParameterRules` where only the `value` property
uses:

```ts
{
  ...DCSParameterRules.properties.value,
  valueType: "SystemEnumeration",
  typeSE,
}
```

- [ ] **Step 4: Run the green test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXML.test.ts -t "imports and exports ent system enumeration value"
```

Expected: PASS.

### Task 5: Final Round-Trip Check

**Files:**
- Test: `.agents/skills/round-trip-xml/round-trip.sh`

- [ ] **Step 1: Re-run round-trip triage**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected: the previous `ent:AccumulationRecordType` exception is gone. The command may now either print the next diff batch or reveal the next independent blocker.
