# DCS Available Values Xsi Nil String Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let `DcsAvailableValues` import `dcssch:value xsi:nil="true"` when the preserved XML parser represents `_xsi:nil` as the string `"true"`.

**Architecture:** Keep nil handling local to the owning `DcsAvailableValues` importer. Do not broaden the public `DCS MetadataValue` importer and do not normalize XML parser output globally.

**Tech Stack:** TypeScript, Vitest, `fast-xml-parser` through `importContentFromXML`, metadata common objects.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.test.ts`: add a regression test that parses XML with `preserveXsiNil: true` and verifies nil available values import without `value`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.ts`: accept both `_xsi:nil === true` and `_xsi:nil === "true"` in `isNilValueXML`.

No fixture XML changes are required. The existing `nilAndBoolean.xml` stays as the default parser-path fixture; the new test should use inline XML to exercise the preserved parser shape directly.

---

### Task 1: Preserve String `xsi:nil` In DCS Available Values

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.ts`

- [ ] **Step 1: Import the XML parser helper in the test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.test.ts`, add this import:

```ts
import { importContentFromXML } from "~/xml/import/importer"
```

The import block should still include the existing imports:

```ts
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { importPropertyFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importContentFromXML } from "~/xml/import/importer"
import { nilAndBooleanAvailableValues, stringAvailableValues } from "./__fixtures__/data"
```

- [ ] **Step 2: Write the failing preserved-parser regression test**

Add this test inside `describe("import DcsAvailableValues from XML", () => { ... })` after the existing `imports nil and boolean values without null` test:

```ts
  it("imports preserved xsi:nil string and boolean values without null", () => {
    const xml = importContentFromXML<{ root: { "dcssch:availableValue": unknown } }>(
      `<root>
	<dcssch:availableValue>
		<dcssch:value xsi:nil="true"/>
	</dcssch:availableValue>
	<dcssch:availableValue>
		<dcssch:value xsi:type="xs:boolean">true</dcssch:value>
	</dcssch:availableValue>
</root>`,
      { preserveXsiNil: true }
    )
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xml.root["dcssch:availableValue"],
    })

    expect(result).toEqual(nilAndBooleanAvailableValues)
  })
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/dataCompositionSystem/availableValues -t "preserved xsi:nil string"
```

Expected: FAIL with `DCS MetadataValue: unexpected missing value`.

- [ ] **Step 4: Update nil detection**

In `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.ts`, replace `isNilValueXML` with:

```ts
const isNilValueXML = (value: unknown): boolean =>
  typeof value === "object" &&
  value !== null &&
  ((value as { "_xsi:nil"?: unknown })["_xsi:nil"] === true ||
    (value as { "_xsi:nil"?: unknown })["_xsi:nil"] === "true")
```

Do not change `importDcsMetadataValueFromDcsXML`. Do not change XML parser options.

- [ ] **Step 5: Run the focused available-values tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/dataCompositionSystem/availableValues
```

Expected: PASS. The preserved-parser test and the existing `nilAndBoolean.xml` fixture test should both pass.

- [ ] **Step 6: Run ERP round-trip triage**

This command resets the external XML repo before running, so only run it after explicit permission if the current session does not already have it:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/erp ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 1
```

Expected:

- the run no longer stops with `DCS MetadataValue: unexpected missing value` in `DataProcessors/УправлениеПродажамиНаМаркетплейсах/ВыгрузкаТоварногоКаталога`;
- known invalid duplicate `FormAttribute` diff is printed under `SKIPPED_INVALID_DIFF`;
- any remaining `TRIAGE_DIFF` entries are later actionable discrepancies outside this fix.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.test.ts
git commit -m "fix: :bug: распознать строковый xsi:nil в DCS available values"
```
