# InternalInfo Contained Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove hard-coded `xr:ContainedObject` UUIDs from configuration rules while preserving `ContainedObject` XML through the shared `InternalInfo` import/export path.

**Architecture:** `InternalInfo.items` remains the rule-level declaration for `xr:GeneratedType`. `xr:ContainedObject` is treated as reference/model data already stored in `InternalInfo.containedObjects`, exported from reference first and from model second, with no generated fallback list.

**Tech Stack:** TypeScript, Vitest, pnpm workspace, XML importer/exporter in `packages/core`.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts`: add fixture-backed tests for importing and round-tripping `xr:ContainedObject`.
- Create `packages/core/metadata/commonObjects/internalInfo/__fixtures__/containedObjects.xml`: small XML fixture with two `xr:ContainedObject` entries.
- Modify `packages/core/metadata/commonObjects/internalInfo/toXML.ts`: replace `containedObjectClassIds` generation with reference/model preservation.
- Modify `packages/core/metadata/orchestration/property/types.ts`: remove `containedObjectClassIds` from `InternalInfoPropertyRule`.
- Modify `packages/core/metadata/appliedObjects/configuration/rules.ts`: remove `configurationInternalInfoContainedObjectClassIds` and the `containedObjectClassIds` property.
- Modify `packages/core/metadata/appliedObjects/configuration/rootXML.test.ts`: replace the old generation assertion with assertions that no private UUIDs are generated without reference, and that full XML round-trip still preserves `InternalInfo`.

---

### Task 1: Cover ContainedObject As InternalInfo Data

**Files:**
- Create: `packages/core/metadata/commonObjects/internalInfo/__fixtures__/containedObjects.xml`
- Modify: `packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts`

- [ ] **Step 1: Create XML fixture**

Create `packages/core/metadata/commonObjects/internalInfo/__fixtures__/containedObjects.xml`:

```xml
<InternalInfo>
	<xr:ContainedObject>
		<xr:ClassId>00000000-0000-0000-0000-000000000101</xr:ClassId>
		<xr:ObjectId>00000000-0000-0000-0000-000000000201</xr:ObjectId>
	</xr:ContainedObject>
	<xr:ContainedObject>
		<xr:ClassId>00000000-0000-0000-0000-000000000102</xr:ClassId>
		<xr:ObjectId>00000000-0000-0000-0000-000000000202</xr:ObjectId>
	</xr:ContainedObject>
</InternalInfo>
```

- [ ] **Step 2: Add fixture reader import**

In `packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts`, add these imports near the existing imports:

```ts
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
```

- [ ] **Step 3: Add ContainedObject-only rule**

In `packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts`, after `rule`, add:

```ts
const containedObjectsRule: PropertyRule = {
  type: "InternalInfo",
  forReferenceOnly: true,
}
```

- [ ] **Step 4: Add fixture helper**

In `packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts`, after `importFixture`, add:

```ts
const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__")

const importContainedObjectsFixture = () => {
  const source = readFileSync(join(fixturesDir, "containedObjects.xml"), "utf8")
  const parsed = importContentFromXML<{ InternalInfo: InternalInfoRootXML }>(source)
  return importInternalInfoFromXML(mockContextFromXML({ forReference: true }), containedObjectsRule, parsed.InternalInfo)
}
```

- [ ] **Step 5: Add import test**

In `describe("importInternalInfoFromXML", () => { ... })`, add:

```ts
  it("imports ContainedObject items", () => {
    expect(importContainedObjectsFixture()).toEqual({
      containedObjects: [
        {
          classId: "00000000-0000-0000-0000-000000000101",
          objectId: "00000000-0000-0000-0000-000000000201",
        },
        {
          classId: "00000000-0000-0000-0000-000000000102",
          objectId: "00000000-0000-0000-0000-000000000202",
        },
      ],
    })
  })
```

- [ ] **Step 6: Add round-trip test**

In the same `describe`, add:

```ts
  it("round-trips ContainedObject items from model data", () => {
    const imported = importContainedObjectsFixture()
    const exported = exportInternalInfoToXML({
      context: mockContextToXML(),
      rule: containedObjectsRule,
      value: imported,
      referenceMetadata: undefined,
      metadataItem: { itemType: "MetadataConfiguration" as never },
    })
    const exportedXML = xmlExport({ InternalInfo: exported }, false)
    const reparsed = importContentFromXML<{ InternalInfo: InternalInfoRootXML }>(exportedXML)

    expect(
      importInternalInfoFromXML(mockContextFromXML({ forReference: true }), containedObjectsRule, reparsed.InternalInfo)
    ).toEqual(imported)
  })
```

- [ ] **Step 7: Run focused test and confirm failure**

Run:

```bash
cd packages/core
pnpm exec vitest run metadata/commonObjects/internalInfo/fromXML.test.ts
```

Expected before implementation:

```text
FAIL packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts
```

The `round-trips ContainedObject items from model data` test should fail because `exportInternalInfoToXML` currently returns no `xr:ContainedObject` unless `containedObjectClassIds` is present in the rule.

- [ ] **Step 8: Commit failing test**

```bash
git add packages/core/metadata/commonObjects/internalInfo/__fixtures__/containedObjects.xml packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts
git commit -m "test: :white_check_mark: покрыть InternalInfo ContainedObject"
```

---

### Task 2: Preserve ContainedObject From Reference Or Model

**Files:**
- Modify: `packages/core/metadata/commonObjects/internalInfo/toXML.ts`

- [ ] **Step 1: Remove unused imports**

In `packages/core/metadata/commonObjects/internalInfo/toXML.ts`, replace the import block:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToXMLFunctionNew, InternalInfoPropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getUUID } from "../../helpers/uuid"
import {
  InternalInfo,
  InternalInfoContainedObject,
  InternalInfoContainedObjectXML,
  InternalInfoItemsXML,
  InternalInfoParam,
  InternalInfoRootXML,
} from "./types"
```

with:

```ts
import type { ConfigurationContext } from "~/metadata/context/types"
import { ExportToXMLFunctionNew, InternalInfoPropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getUUID } from "../../helpers/uuid"
import { InternalInfo, InternalInfoContainedObjectXML, InternalInfoItemsXML, InternalInfoParam, InternalInfoRootXML } from "./types"
```

- [ ] **Step 2: Replace ContainedObject export helper**

In `packages/core/metadata/commonObjects/internalInfo/toXML.ts`, replace the current `getContainedObjectsXML` and `findContainedObject` functions:

```ts
const getContainedObjectsXML = (params: {
  context: ConfigurationContext
  rule: InternalInfoPropertyRule
  metadata: InternalInfo | undefined
  reference: InternalInfo | undefined
}): InternalInfoContainedObjectXML[] => {
  const classIds = params.rule.containedObjectClassIds ?? []
  if (classIds.length === 0) return []

  const referenceObjects = params.reference?.containedObjects ?? []
  const metadataObjects = params.metadata?.containedObjects ?? []
  const seen = new Set<string>()

  const result = classIds.map((classId) => {
    seen.add(classId)
    const existing = findContainedObject(referenceObjects, classId) ?? findContainedObject(metadataObjects, classId)
    return {
      "xr:ClassId": classId,
      "xr:ObjectId": existing?.objectId ?? getUUID(params.context),
    }
  })

  for (const item of referenceObjects) {
    if (seen.has(item.classId)) continue
    result.push({
      "xr:ClassId": item.classId,
      "xr:ObjectId": item.objectId,
    })
  }

  return result
}

const findContainedObject = (
  containedObjects: InternalInfoContainedObject[],
  classId: string
): InternalInfoContainedObject | undefined => containedObjects.find((item) => item.classId === classId)
```

with:

```ts
const getContainedObjectsXML = (params: {
  metadata: InternalInfo | undefined
  reference: InternalInfo | undefined
}): InternalInfoContainedObjectXML[] => {
  const containedObjects = params.reference?.containedObjects ?? params.metadata?.containedObjects ?? []

  return containedObjects.map((item) => ({
    "xr:ClassId": item.classId,
    "xr:ObjectId": item.objectId,
  }))
}
```

- [ ] **Step 3: Update helper call**

In `exportInternalInfoToXML`, replace:

```ts
  const containedObjects = getContainedObjectsXML({
    context,
    rule: internalInfoRule,
    metadata,
    reference,
  })
```

with:

```ts
  const containedObjects = getContainedObjectsXML({
    metadata,
    reference,
  })
```

- [ ] **Step 4: Run focused test**

Run:

```bash
cd packages/core
pnpm exec vitest run metadata/commonObjects/internalInfo/fromXML.test.ts
```

Expected:

```text
PASS packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts
```

- [ ] **Step 5: Commit implementation**

```bash
git add packages/core/metadata/commonObjects/internalInfo/toXML.ts
git commit -m "fix: :bug: сохранять InternalInfo ContainedObject из данных"
```

---

### Task 3: Remove Configuration UUID List And Update Root XML Tests

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rootXML.test.ts`

- [ ] **Step 1: Remove property from type**

In `packages/core/metadata/orchestration/property/types.ts`, change:

```ts
export interface InternalInfoPropertyRule extends BasePropertyRule {
  type: "InternalInfo"
  items?: Array<{ name: string; category: string }>
  containedObjectClassIds?: string[]
  forReferenceOnly: true
  getName?: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => string
  thisNode?: boolean
}
```

to:

```ts
export interface InternalInfoPropertyRule extends BasePropertyRule {
  type: "InternalInfo"
  items?: Array<{ name: string; category: string }>
  forReferenceOnly: true
  getName?: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => string
  thisNode?: boolean
}
```

- [ ] **Step 2: Remove private UUID list from configuration rules**

In `packages/core/metadata/appliedObjects/configuration/rules.ts`, delete:

```ts
const configurationInternalInfoContainedObjectClassIds = [
  "9cd510cd-abfc-11d4-9434-004095e12fc7",
  "9fcd25a0-4822-11d4-9414-008048da11f9",
  "e3687481-0a87-462c-a166-9f34594f9bba",
  "9de14907-ec23-4a07-96f0-85521cb6b53b",
  "51f2d5d8-ea4d-4064-8892-82951750031e",
  "e68182ea-4237-4383-967f-90c1e3370bc7",
  "fb282519-d103-4dd3-bc12-cb271d631dfc",
]
```

Then change `internalInfo` from:

```ts
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      preserveFromReferenceXML: true,
      exportWithoutReferenceXML: true,
      containedObjectClassIds: configurationInternalInfoContainedObjectClassIds,
    },
```

to:

```ts
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      preserveFromReferenceXML: true,
      exportWithoutReferenceXML: true,
    },
```

- [ ] **Step 3: Replace root no-reference test**

In `packages/core/metadata/appliedObjects/configuration/rootXML.test.ts`, replace the test named `"экспортирует InternalInfo без reference XML"` with:

```ts
  it("не генерирует ContainedObject без reference XML", () => {
    const exported = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: {
        itemType: "MetadataConfiguration",
        name: "Конфигурация",
        defaultLanguage: "Language.Русский",
        configurationExtensionCompatibilityMode: "Version8_3_27",
        compatibilityMode: "Version8_3_27",
      },
      rule: MetadataConfigurationRules,
    })

    const xml = xmlExport(exported!)

    expect(xml).not.toContain("<xr:ContainedObject>")
    expect(xml).not.toContain("9cd510cd-abfc-11d4-9434-004095e12fc7")
  })
```

- [ ] **Step 4: Add root preservation test**

In the same `describe("root Configuration XML", () => { ... })`, after the no-reference test, add:

```ts
  it("сохраняет ContainedObject из reference XML", () => {
    const source = readXMLFileAsString("configuration/full.xml")
    const xml = roundTripConfigurationXML(source)

    expect(xml).toContain("<InternalInfo>")
    expect(xml).toContain("<xr:ContainedObject>")
    expect(xml).toContain("<xr:ClassId>9cd510cd-abfc-11d4-9434-004095e12fc7</xr:ClassId>")
    expect(xml.indexOf("<InternalInfo>")).toBeLessThan(xml.indexOf("<Properties>"))
    expect(normalizeXML(xml)).toBe(normalizeXML(source))
  })
```

- [ ] **Step 5: Verify no private rule remains**

Run:

```bash
rg "containedObjectClassIds|configurationInternalInfoContainedObjectClassIds" packages/core/metadata
```

Expected:

```text
```

No matches.

- [ ] **Step 6: Run configuration tests**

Run:

```bash
cd packages/core
pnpm exec vitest run metadata/appliedObjects/configuration/rootXML.test.ts
```

Expected:

```text
PASS packages/core/metadata/appliedObjects/configuration/rootXML.test.ts
```

- [ ] **Step 7: Commit configuration cleanup**

```bash
git add packages/core/metadata/orchestration/property/types.ts packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/appliedObjects/configuration/rootXML.test.ts
git commit -m "fix: :bug: убрать частные UUID из InternalInfo конфигурации"
```

---

### Task 4: Final Verification

**Files:**
- Read: `docs/superpowers/specs/2026-06-19-internal-info-contained-items-design.md`

- [ ] **Step 1: Run all targeted tests**

Run:

```bash
cd packages/core
pnpm exec vitest run metadata/commonObjects/internalInfo/fromXML.test.ts metadata/appliedObjects/configuration/rootXML.test.ts
```

Expected:

```text
PASS packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts
PASS packages/core/metadata/appliedObjects/configuration/rootXML.test.ts
```

- [ ] **Step 2: Run type check if available**

Run:

```bash
pnpm --filter @nakidka/core run type-check
```

Expected:

```text
Command succeeds.
```

- [ ] **Step 3: Run full project tests**

Run from `/home/nikita/git/nkdk/.worktrees/internal-info-contained-items`:

```bash
pnpm test
```

Expected:

```text
packages/core test: Done
packages/cli test: Done
```

- [ ] **Step 4: Check final diff**

Run:

```bash
git status --short
git log --oneline -4
```

Expected:

```text
git status --short
```

prints no unstaged changes after commits, and the recent commits include the spec plus the three implementation commits.

- [ ] **Step 5: Report completion**

Final report must include:

```text
- Removed hard-coded configuration ContainedObject UUIDs.
- Preserved ContainedObject from reference/model InternalInfo.
- Added fixture-backed InternalInfo coverage.
- Verified with pnpm test.
```
