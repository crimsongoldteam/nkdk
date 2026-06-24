# DCS Edit Parameter Mask Explicit String Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve numeric-looking `xs:string` values in DCS edit parameter settings, such as `ПараметрыРедактирования.Маска = "123"`, through XML -> YAML -> XML.

**Architecture:** The existing `MetadataValue` string handler already exports string values as explicit YAML strings. This plan verifies whether the DCS parameter/edit-parameter path bypasses that handler; only if the reproducer fails, the fix stays in the narrow DCS value export/import path that loses the marker.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration helpers, YAML explicit string marker.

---

### Task 1: Add A Reproducer For DCS Edit Parameter Mask

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXML.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test near the existing DCSParameter XML tests:

```ts
it("preserves numeric-looking edit parameter mask as xs:string through YAML", () => {
  const xml = `<Settings>
	<Parameter>
		<dcssch:name>Параметр1</dcssch:name>
		<dcssch:inputParameters>
			<dcscor:item>
				<dcscor:parameter>Маска</dcscor:parameter>
				<dcscor:value xsi:type="xs:string">123</dcscor:value>
			</dcscor:item>
		</dcssch:inputParameters>
	</Parameter>
</Settings>`

  const value = testImportPropertyFromXML({
    rule,
    xmlString: xml,
    xmlRootTag: "Settings",
  })

  expect(value).toEqual([
    {
      itemType: "DCSParameter",
      name: "Параметр1",
      editParameters: {
        itemType: "SettingsParameterValueCollection",
        parameters: {
          Маска: {
            parameter: "Маска",
            value: { type: "string", value: "123" },
          },
        },
      },
    },
  ])

  const exported = exportDCSParameters(value)

  expect(exported).toContain('<dcscor:value xsi:type="xs:string">123</dcscor:value>')
  expect(exported).not.toContain('<dcscor:value xsi:type="xs:decimal">123</dcscor:value>')
})
```

- [ ] **Step 2: Run the focused XML test**

Run:

```bash
pnpm --filter @nakidka/core test -- dcsParameter/fromXML.test.ts
```

Expected: pass. If it fails, fix XML-side DCS parameter value preservation before continuing.

### Task 2: Add A YAML Export/Import Reproducer

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXML.test.ts`

- [ ] **Step 1: Add YAML round-trip assertions to the same test**

Import the required helpers at the top:

```ts
import { importPropertyFromYAML } from "~/metadata/orchestration"
import { exportPropertyToYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { exportToYAML } from "~/yaml/export"
```

Then extend the test after the `value` assertion:

```ts
  const yaml = exportPropertyToYAML({
    context: mockContext,
    rule,
    value,
  })

  expect(exportToYAML(yaml)).toContain('Значение: "123"')

  const valueFromYaml = importPropertyFromYAML({
    context: mockContext,
    rule,
    value: yaml,
  })

  const exportedAfterYaml = exportDCSParameters(valueFromYaml)

  expect(exportedAfterYaml).toContain('<dcscor:value xsi:type="xs:string">123</dcscor:value>')
  expect(exportedAfterYaml).not.toContain('<dcscor:value xsi:type="xs:decimal">123</dcscor:value>')
```

- [ ] **Step 2: Run the focused test and verify RED if the bug exists**

Run:

```bash
pnpm --filter @nakidka/core test -- dcsParameter/fromXML.test.ts
```

Expected if the current bug is reproduced: fail on `Значение: "123"` or on the final XML type assertion. If it passes, the code path is already fixed and the remaining diff likely comes from stale external round-trip state.

### Task 3: Minimal Fix If The YAML Reproducer Fails

**Files:**
- Modify only the narrow file identified by the failing assertion, expected candidates:
  - `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toYAML.ts`
- Test: existing focused test from Tasks 1-2

- [ ] **Step 1: Keep the existing explicit string contract**

Do not add a special `Маска` rule. Ensure DCS edit parameters delegate string metadata values to the existing `MetadataValue` YAML exporter so `{ type: "string", value: "123" }` becomes an explicit YAML string marker.

- [ ] **Step 2: Run the focused test**

Run:

```bash
pnpm --filter @nakidka/core test -- dcsParameter/fromXML.test.ts
```

Expected: pass.

### Task 4: Verify The Broader DCS Area

**Files:**
- No edits expected.

- [ ] **Step 1: Run related tests**

Run:

```bash
pnpm --filter @nakidka/core test -- dcsParameter settingsParameterValueCollection parameterValue dcsMetadataValue
```

Expected: all tests pass.

- [ ] **Step 2: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Run round-trip YAML**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the `CommonForms/ДинамическийСписок/Ext/Form.xml` diff for `Маска xs:string -> xs:decimal` disappears.
