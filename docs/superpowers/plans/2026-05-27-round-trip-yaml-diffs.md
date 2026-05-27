# Round Trip YAML Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the agreed `round-trip-yaml` losses for register-field synonyms and root `CommonCommand` objects.

**Architecture:** First align `commonRegisterFieldProperties.synonym` with the existing `metadataAttribute` / `metadataTabularSection` pattern: compact YAML may omit a synonym equal to the name, but YAML import restores it from `name`. Then add a separate root metadata item for `CommonCommand` instead of changing child `MetadataCommandRules`, so child command collections keep their current behavior.

**Tech Stack:** TypeScript, metadata rules engine, Vitest, `pnpm --filter @nakidka/core exec vitest`, diagnostic `round-trip-yaml`.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`
  - Restores omitted equal-name synonyms on YAML import for register-field-like objects.
- Add: `packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts`
  - Covers the restored synonym behavior on the shared rule.
- Add: `packages/core/metadata/appliedObjects/metadataCommonCommand/rules.ts`
  - Defines root `CommonCommand` metadata item.
- Add: `packages/core/metadata/appliedObjects/metadataCommonCommand/types.ts`
  - Exports model/YAML types and registers the root metadata item rule.
- Add: `packages/core/metadata/appliedObjects/metadataCommonCommand/index.ts`
  - Re-exports the new root item types.
- Add fixtures and tests under `packages/core/metadata/appliedObjects/metadataCommonCommand/`
  - Proves XML/YAML import/export for root common commands.
- Modify: `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`
  - Adds root `CommonCommand` to configuration traversal.
- Modify: `packages/core/metadata/appliedObjects/index.ts`
  - Loads the new metadata item registration.
- Modify: `docs/superpowers/specs/2026-05-27-round-trip-yaml-diffs-design.md`
  - Records implementation results and verification.

## Task 1: Fix shared register-field synonym restoration

**Files:**

- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`
- Add: `packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts`

- [ ] **Step 1: Add import for synonym restoration**

In `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`, replace:

```ts
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
```

with:

```ts
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { ConfigurationContext, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
```

- [ ] **Step 2: Replace `synonym.defaultValue`**

In `commonRegisterFieldProperties.synonym`, replace:

```ts
defaultValue: emptySynonym,
```

with:

```ts
defaultValue: ({
  context,
  name,
  operation,
}: {
  context: ConfigurationContext
  name?: string
  operation?: string
}) => (operation === "importFromYAML" && name ? addDefaultLanguageNameToSynonym(context, undefined, name) : emptySynonym),
```

This mirrors the established pattern in `metadataAttribute/rules.ts` and `metadataTabularSection/rules.ts`.

- [ ] **Step 3: Add focused test**

Create `packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "../accountingFlag/rules"

describe("metadata register field YAML import", () => {
  it.each([
    ["AccountingFlag", AccountingFlagRules],
    ["ExtDimensionAccountingFlag", ExtDimensionAccountingFlagRules],
  ] as const)("restores omitted synonym from name for %s", (_label, rule) => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule,
      name: "УчетПоПодразделениям",
      yaml: {
        Тип: "Булево",
      },
    })

    expect(result).toMatchObject({
      itemType: rule.itemType,
      name: "УчетПоПодразделениям",
      synonym: { items: { ru: "Учет по подразделениям" } },
      type: { type: ["xs:boolean"] },
    })
  })
})
```

- [ ] **Step 4: Run focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts
```

Expected: PASS.

## Task 2: Add root CommonCommand metadata item

**Files:**

- Add: `packages/core/metadata/appliedObjects/metadataCommonCommand/rules.ts`
- Add: `packages/core/metadata/appliedObjects/metadataCommonCommand/types.ts`
- Add: `packages/core/metadata/appliedObjects/metadataCommonCommand/index.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`
- Modify: `packages/core/metadata/appliedObjects/index.ts`

- [ ] **Step 1: Add root rules**

Create `packages/core/metadata/appliedObjects/metadataCommonCommand/rules.ts`:

```ts
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataCommandRules } from "../metadataCommand/rules"

export const MetadataCommonCommandRules = {
  ...MetadataCommandRules,
  itemType: "MetadataCommonCommand",
  itemTypePrefix: "ОбщаяКоманда",
  xmlDir: "CommonCommands",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "CommonCommand",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: "Ext/CommandModule.bsl",
      nkdkPath: "Модуль.bsl",
      toXML: true,
      fromXML: true,
    },
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 2: Add types and registration**

Create `packages/core/metadata/appliedObjects/metadataCommonCommand/types.ts`:

```ts
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataCommandXML } from "../metadataCommand/types"
import { MetadataCommonCommandRules } from "./rules"

export type MetadataCommonCommand = MetadataTypeByRule<typeof MetadataCommonCommandRules>
export type MetadataCommonCommandYAML = YAMLTypeByRule<typeof MetadataCommonCommandRules>

export interface MetadataCommonCommandXML {
  _version: string
  CommonCommand: MetadataCommandXML
}

registerMetadataItemRule({
  propertyType: "MetadataCommonCommand",
  itemRule: MetadataCommonCommandRules,
})
```

- [ ] **Step 3: Add index export**

Create `packages/core/metadata/appliedObjects/metadataCommonCommand/index.ts`:

```ts
export * from "./types"
```

- [ ] **Step 4: Register root item in top-level rules**

In `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`, add:

```ts
import { MetadataCommonCommandRules } from "../metadataCommonCommand/rules"
```

Then add `MetadataCommonCommandRules` to `TopLevelMetadataItemRules` near other common root objects, before `MetadataCommandGroupRules`.

- [ ] **Step 5: Load registration**

In `packages/core/metadata/appliedObjects/index.ts`, add:

```ts
import "./metadataCommonCommand"
```

Place it near `metadataCommand/register` and `metadataCommandGroup`.

## Task 3: Add root CommonCommand tests and fixtures

**Files:**

- Add: `packages/core/metadata/appliedObjects/metadataCommonCommand/__fixtures__/full.xml`
- Add: `packages/core/metadata/appliedObjects/metadataCommonCommand/__fixtures__/full.ts`
- Add: `packages/core/metadata/appliedObjects/metadataCommonCommand/__fixtures__/fullYAML.ts`
- Add: `packages/core/metadata/appliedObjects/metadataCommonCommand/fromXML.test.ts`
- Add: `packages/core/metadata/appliedObjects/metadataCommonCommand/fromYAML.test.ts`

- [ ] **Step 1: Add XML fixture**

Create `packages/core/metadata/appliedObjects/metadataCommonCommand/__fixtures__/full.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<CommonCommand uuid="75ffd0b9-79be-4600-a310-591fddb6d63e">
		<Properties>
			<Name>АвтономнаяРабота</Name>
			<Synonym>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Автономная работа</v8:content>
				</v8:item>
			</Synonym>
			<Comment/>
			<Group>NavigationPanelOrdinary</Group>
			<Representation>Auto</Representation>
			<ToolTip/>
			<Picture/>
			<Shortcut/>
			<IncludeHelpInContents>false</IncludeHelpInContents>
			<CommandParameterType/>
			<ParameterUseMode>Single</ParameterUseMode>
			<ModifiesData>false</ModifiesData>
			<OnMainServerUnavalableBehavior>Auto</OnMainServerUnavalableBehavior>
		</Properties>
	</CommonCommand>
</MetaDataObject>
```

- [ ] **Step 2: Add model fixture**

Create `packages/core/metadata/appliedObjects/metadataCommonCommand/__fixtures__/full.ts`:

```ts
import { MetadataCommonCommand } from "../types"

export const full: MetadataCommonCommand = {
  itemType: "MetadataCommonCommand",
  name: "АвтономнаяРабота",
  synonym: { items: { ru: "Автономная работа" } },
  group: "NavigationPanelOrdinary",
}
```

- [ ] **Step 3: Add YAML fixture**

Create `packages/core/metadata/appliedObjects/metadataCommonCommand/__fixtures__/fullYAML.ts`:

```ts
import { MetadataCommonCommandYAML } from "../types"

export const fullYAML: MetadataCommonCommandYAML = {
  Группа: "ОбычнаяПанельНавигации",
}
```

`Синоним` is intentionally omitted because it equals the name by the existing `excludeIfEqualNameYAML` rule and must be restored on YAML import.

- [ ] **Step 4: Add XML round-trip test**

Create `packages/core/metadata/appliedObjects/metadataCommonCommand/fromXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { MetadataCommonCommandRules } from "./rules"
import { MetadataCommonCommand } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataCommonCommand from XML", () => {
  it("imports full fixture", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataCommonCommand>({
        rule: MetadataCommonCommandRules,
        importMetaUrl: import.meta.url,
        fixture: "full.xml",
      })
    ).toEqual(full)
  })

  it("round-trips full XML", () => {
    const data = testImportAppliedObjectFromXML<MetadataCommonCommand>({
      rule: MetadataCommonCommandRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataCommonCommandRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      data: data!,
    })
    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
```

- [ ] **Step 5: Add YAML import/export test**

Create `packages/core/metadata/appliedObjects/metadataCommonCommand/fromYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromYAML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { fullYAML } from "./__fixtures__/fullYAML"
import { MetadataCommonCommandRules } from "./rules"
import { MetadataCommonCommand } from "./types"

describe("import MetadataCommonCommand from YAML", () => {
  it("restores omitted synonym from name", () => {
    const result = testImportAppliedObjectFromYAML<MetadataCommonCommand>({
      rule: MetadataCommonCommandRules,
      name: "АвтономнаяРабота",
      yaml: fullYAML,
    })

    expect(result).toEqual(full)
  })

  it("round-trips compact YAML", () => {
    const imported = testImportAppliedObjectFromYAML<MetadataCommonCommand>({
      rule: MetadataCommonCommandRules,
      name: "АвтономнаяРабота",
      yaml: fullYAML,
    })

    expect(testExportAppliedObjectToYAML({ rule: MetadataCommonCommandRules, data: imported })).toEqual(fullYAML)
  })
})
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts packages/core/metadata/appliedObjects/metadataCommonCommand/fromXML.test.ts packages/core/metadata/appliedObjects/metadataCommonCommand/fromYAML.test.ts packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts packages/core/metadata/appliedObjects/configuration/childObjects.test.ts
```

Expected: PASS.

## Task 4: Update spec and verify diagnostic command

**Files:**

- Modify: `docs/superpowers/specs/2026-05-27-round-trip-yaml-diffs-design.md`

- [ ] **Step 1: Update statuses**

In `docs/superpowers/specs/2026-05-27-round-trip-yaml-diffs-design.md`, replace both `Статус: решение согласовано, реализация не начата.` lines with implementation summaries:

```md
Статус: реализовано. Проверено точечными Vitest-тестами.
```

If the diagnostic round-trip is run in this task, extend each status with:

```md
Диагностический `round-trip-yaml` после реализации не показывает исходный diff этой группы.
```

- [ ] **Step 2: Run diagnostic triage**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 10 --start-index 1
```

Expected:

- The original `ChartsOfAccounts/Хозрасчетный.xml` synonym loss is gone.
- The original root `CommonCommands/*.xml` and `CommonCommands/*/Ext/CommandModule.bsl` deletion group is gone from the first ten diff entries.
- If new unrelated diff entries become visible, do not fix them in this plan; record them for the next brainstorming batch.

## Task 5: Final project verification and commit

**Files:**

- All files changed by Tasks 1-4.

- [ ] **Step 1: Run full tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 2: Inspect git status**

Run:

```bash
git status --short
```

Expected: only intended files in `nakidka-core` are modified or added. External XML repo diff'ы are diagnostic state and must not be staged in this repo.

- [ ] **Step 3: Commit implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataRegisterField/rules.ts packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts packages/core/metadata/appliedObjects/metadataCommonCommand packages/core/metadata/appliedObjects/configuration/topLevelRules.ts packages/core/metadata/appliedObjects/index.ts docs/superpowers/specs/2026-05-27-round-trip-yaml-diffs-design.md docs/superpowers/plans/2026-05-27-round-trip-yaml-diffs.md
git commit -m "fix: :bug: восстановить round-trip общих команд"
```

Expected: commit succeeds and worktree is clean.
