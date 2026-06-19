# Child File Item Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать `omitStringChildCollectionReferencesFromXML` и явно представить file-item дочерние объекты в корневом XML как список имён.

**Architecture:** Добавляем общий property-тип `ChildFileItemNames`, аналогичный `ChildFormNames`, но без внешней синхронизации. Корневые правила `ExternalDataSource` и `ExternalDataSourceCube` читают `Table`, `Cube`, `DimensionTable` как `string[]`, а полные правила дочерних объектов остаются только в `childCollections.fileItemRule`.

**Tech Stack:** TypeScript, Vitest, существующий metadata orchestration registry, `pnpm --filter @nakidka/core test`.

---

## File Structure

- Create `packages/core/metadata/commonObjects/childFileItemNames/types.ts`: property-rule интерфейс для списка имён дочерних file-item объектов.
- Create `packages/core/metadata/commonObjects/childFileItemNames/fromXML.ts`: импорт строки или массива строк из `ChildObjects`.
- Create `packages/core/metadata/commonObjects/childFileItemNames/toXML.ts`: экспорт непустого `string[]`.
- Create `packages/core/metadata/commonObjects/childFileItemNames/fromXML.test.ts`: тесты импорта.
- Create `packages/core/metadata/commonObjects/childFileItemNames/toXML.test.ts`: тесты экспорта.
- Modify `packages/core/metadata/commonObjects/index.ts`: зарегистрировать новый тип.
- Modify `packages/core/metadata/orchestration/property/types.ts`: добавить `ChildFileItemNamesPropertyRule`.
- Modify `packages/core/metadata/orchestration/property/registry.ts`: добавить `ChildFileItemNames` в `PropertyTypeRegistry` и `PropertyRuleTypeKeys`.
- Modify `packages/core/metadata/appliedObjects/metadataExternalDataSource/rules.ts`: заменить `tables` и `cubes` на `ChildFileItemNames`.
- Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts`: заменить `dimensionTables` на `ChildFileItemNames`.
- Modify `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`: закрепить fast round-trip для строковых file-item ссылок.
- Modify `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`: убрать импорт и вызов `omitStringChildCollectionReferencesFromXML`.
- Modify `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`: убрать импорт и вызов `omitStringChildCollectionReferencesFromXML`.
- Modify `packages/core/metadata/appliedObjects/configuration/migrations/collectState.ts`: убрать импорт и вызов `omitStringChildCollectionReferencesFromXML`.
- Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromXML.test.ts` and `toXML.test.ts`: убрать ручную фильтрацию строковых ссылок.
- Delete `packages/core/metadata/orchestration/appliedObject/stringChildCollectionReferences.ts`.

---

### Task 1: Add Failing Fast Regression Test

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`

- [ ] **Step 1: Keep or add the failing test**

Add this helper after `enumXml` if it is not already present:

```ts
const externalDataSourceXml = (params: { name: string }): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<ExternalDataSource uuid="aa0a162f-bf96-4951-9c81-f6a8014ab7e8">
		<InternalInfo>
			<xr:GeneratedType name="ExternalDataSourceManager.${params.name}" category="Manager">
				<xr:TypeId>a4ef7100-9959-4442-baf4-787c10c5e21d</xr:TypeId>
				<xr:ValueId>89d407e9-dd88-4734-896d-807c3768ba23</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="ExternalDataSourceTablesManager.${params.name}" category="TablesManager">
				<xr:TypeId>9845972e-4d29-4fda-ab72-c7a6b981c440</xr:TypeId>
				<xr:ValueId>7010ece1-b27d-4e92-a012-b9ba45db751f</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="ExternalDataSourceCubesManager.${params.name}" category="CubesManager">
				<xr:TypeId>0ca57e3a-b717-4edc-be5e-e333ac1cf78c</xr:TypeId>
				<xr:ValueId>74742986-68bc-418c-8396-8dc92ffa6da5</xr:ValueId>
			</xr:GeneratedType>
		</InternalInfo>
		<Properties>
			<Name>${params.name}</Name>
			<Synonym/>
			<Comment/>
			<DataLockControlMode>Automatic</DataLockControlMode>
		</Properties>
		<ChildObjects>
			<Table>ТаблицаВсеСвойства</Table>
			<Cube>КубВсеСвойства</Cube>
		</ChildObjects>
	</ExternalDataSource>
</MetaDataObject>`
```

Add this helper after `makeXmlProject`:

```ts
const makeExternalDataSourceXmlProject = (xml: string): string => {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-round-trip-yaml-fast-"))
  fs.mkdirSync(join(dir, "ExternalDataSources"), { recursive: true })
  fs.writeFileSync(join(dir, "ExternalDataSources", "ВнешнийИсточникДанныхВсеСвойства.xml"), xml, "utf-8")
  return dir
}
```

Add this test inside `describe("roundTripYAMLFast", ...)`:

```ts
it("round-trips external data source file item child references without reading child files", async () => {
  const xmlDir = makeExternalDataSourceXmlProject(externalDataSourceXml({ name: "ВнешнийИсточникДанныхВсеСвойства" }))
  try {
    const result = await roundTripYAMLFast({ inputDir: xmlDir })

    expect(result.errors).toEqual([])
    expect(result.diffs).toEqual([])
    expect(result.checked).toBe(1)
  } finally {
    fs.rmSync(xmlDir, { recursive: true, force: true })
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- roundTripYAMLFast.test.ts
```

Expected: FAIL. The new test records an error containing:

```text
Cannot use 'in' operator to search for 'ManagerModule' in ТаблицаВсеСвойства
```

- [ ] **Step 3: Commit the red test**

```bash
git add packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
git commit -m "test: :white_check_mark: зафиксировать file-item ссылки"
```

---

### Task 2: Add ChildFileItemNames Type

**Files:**
- Create: `packages/core/metadata/commonObjects/childFileItemNames/types.ts`
- Create: `packages/core/metadata/commonObjects/childFileItemNames/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/childFileItemNames/toXML.ts`
- Create: `packages/core/metadata/commonObjects/childFileItemNames/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/childFileItemNames/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Write failing unit tests**

Create `packages/core/metadata/commonObjects/childFileItemNames/fromXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/context"
import { importChildFileItemNamesFromXML } from "./fromXML"

const rule = { type: "ChildFileItemNames" as const, xml: "Table", forReferenceOnly: true as const }

describe("importChildFileItemNamesFromXML", () => {
  it("returns undefined for empty XML value", () => {
    expect(importChildFileItemNamesFromXML(mockContextFromXML(), rule, undefined)).toBeUndefined()
    expect(importChildFileItemNamesFromXML(mockContextFromXML(), rule, null)).toBeUndefined()
  })

  it("imports a single child file item name", () => {
    expect(importChildFileItemNamesFromXML(mockContextFromXML(), rule, "Таблица")).toEqual(["Таблица"])
  })

  it("imports multiple child file item names", () => {
    expect(importChildFileItemNamesFromXML(mockContextFromXML(), rule, ["Таблица", "Куб"])).toEqual([
      "Таблица",
      "Куб",
    ])
  })
})
```

Create `packages/core/metadata/commonObjects/childFileItemNames/toXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/context"
import { exportChildFileItemNamesToXML } from "./toXML"

const rule = { type: "ChildFileItemNames" as const, xml: "Table", forReferenceOnly: true as const }

describe("exportChildFileItemNamesToXML", () => {
  it("exports non-empty child file item names", () => {
    expect(
      exportChildFileItemNamesToXML({
        context: mockContextToXML(),
        rule,
        value: ["Таблица", "Куб"],
        metadata: {},
        referenceMetadata: {},
      })
    ).toEqual(["Таблица", "Куб"])
  })

  it("omits empty child file item names", () => {
    expect(
      exportChildFileItemNamesToXML({
        context: mockContextToXML(),
        rule,
        value: [],
        metadata: {},
        referenceMetadata: {},
      })
    ).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- childFileItemNames
```

Expected: FAIL because `childFileItemNames/fromXML.ts` and `toXML.ts` do not exist.

- [ ] **Step 3: Add type files**

Create `packages/core/metadata/commonObjects/childFileItemNames/types.ts`:

```ts
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

/** Rule for file-item child names stored in ChildObjects XML. */
export interface ChildFileItemNamesPropertyRule extends BasePropertyRule {
  type: "ChildFileItemNames"
  /** XML tag name for the child file item name, for example "Table". */
  xml: string
  forReferenceOnly: true
}
```

Create `packages/core/metadata/commonObjects/childFileItemNames/fromXML.ts`:

```ts
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"

export const importChildFileItemNamesFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): string[] | undefined => {
  if (xml === undefined || xml === null) return undefined
  if (Array.isArray(xml)) return xml.filter((item): item is string => typeof item === "string")
  return typeof xml === "string" ? [xml] : undefined
}

registerTypeRule("ChildFileItemNames", "importFromXML", importChildFileItemNamesFromXML)
```

Create `packages/core/metadata/commonObjects/childFileItemNames/toXML.ts`:

```ts
import { ExportToXMLFunctionNew, registerTypeRule } from "~/metadata/orchestration"

export const exportChildFileItemNamesToXML: ExportToXMLFunctionNew = (params): string[] | undefined => {
  const { value } = params
  if (!Array.isArray(value)) return undefined
  const names = value.filter((item): item is string => typeof item === "string")
  return names.length > 0 ? names : undefined
}

registerTypeRule("ChildFileItemNames", "exportToXML", exportChildFileItemNamesToXML)
```

- [ ] **Step 4: Register the property type**

In `packages/core/metadata/orchestration/property/types.ts`, add the import near the other child-name imports:

```ts
import type { ChildFileItemNamesPropertyRule } from "~/metadata/commonObjects/childFileItemNames/types"
```

Add `"ChildFileItemNames"` to the `CleanPropertyRule` excluded type list near `ChildFormNames`:

```ts
    | "ChildFileItemNames"
```

Add `ChildFileItemNamesPropertyRule` to `PropertyRule` near `ChildFormNamesPropertyRule`:

```ts
  | ChildFileItemNamesPropertyRule
```

In `packages/core/metadata/orchestration/property/registry.ts`, add to `PropertyTypeRegistry` near `ChildFormNames`:

```ts
  ChildFileItemNames: {
    item: string[]
  }
```

Add to `PropertyRuleTypeKeys` near `ChildFormNames`:

```ts
  ChildFileItemNames: "ChildFileItemNames",
```

In `packages/core/metadata/commonObjects/index.ts`, add near `childFormNames`:

```ts
import "./childFileItemNames/fromXML"
import "./childFileItemNames/toXML"
```

- [ ] **Step 5: Run tests to verify type passes**

Run:

```bash
pnpm --filter @nakidka/core test -- childFileItemNames
```

Expected: PASS.

- [ ] **Step 6: Commit ChildFileItemNames**

```bash
git add packages/core/metadata/commonObjects/childFileItemNames packages/core/metadata/commonObjects/index.ts packages/core/metadata/orchestration/property/types.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: :sparkles: добавить ChildFileItemNames"
```

---

### Task 3: Move ExternalDataSource File Items To Name Lists

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`
- Test: existing ExternalDataSource tests

- [ ] **Step 1: Change ExternalDataSource root child properties**

In `packages/core/metadata/appliedObjects/metadataExternalDataSource/rules.ts`, update `tables`:

```ts
    tables: {
      yaml: "Таблицы",
      xml: "Table",
      type: "ChildFileItemNames",
      xmlParents: childObjects,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
```

Update `cubes`:

```ts
    cubes: {
      yaml: "Кубы",
      xml: "Cube",
      type: "ChildFileItemNames",
      xmlParents: childObjects,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
```

Leave `functions` unchanged.

- [ ] **Step 2: Change ExternalDataSourceCube dimensionTables**

In `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts`, update `dimensionTables`:

```ts
  dimensionTables: {
    yaml: "ТаблицыИзмерений",
    xml: "DimensionTable",
    type: "ChildFileItemNames",
    xmlParents: childObjects,
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
  },
```

- [ ] **Step 3: Run fast regression test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- roundTripYAMLFast.test.ts
```

Expected: PASS for the new `round-trips external data source file item child references without reading child files` test.

- [ ] **Step 4: Run ExternalDataSource focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadataExternalDataSource
```

Expected: PASS for external data source tests. If cube tests still fail because they manually call `omitStringChildCollectionReferencesFromXML`, continue to Task 4 before committing.

- [ ] **Step 5: Commit rule migration**

```bash
git add packages/core/metadata/appliedObjects/metadataExternalDataSource/rules.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts
git commit -m "fix: :bug: читать file-item ссылки как имена"
```

---

### Task 4: Remove String Child Collection Omit Helper

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/collectState.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/toXML.test.ts`
- Delete: `packages/core/metadata/orchestration/appliedObject/stringChildCollectionReferences.ts`

- [ ] **Step 1: Remove convertFromXML dependency**

In `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`, delete this import:

```ts
import { omitStringChildCollectionReferencesFromXML } from "./stringChildCollectionReferences"
```

Replace:

```ts
  const modelXML = omitStringChildCollectionReferencesFromXML(parsed.MetaDataObject, rule)
  const model = importMetadataItemFromXML({ context, xml: modelXML, rule })
```

with:

```ts
  const model = importMetadataItemFromXML({ context, xml: parsed.MetaDataObject, rule })
```

- [ ] **Step 2: Remove syncToXML dependency**

In `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`, delete this import:

```ts
import { omitStringChildCollectionReferencesFromXML } from "./stringChildCollectionReferences"
```

Near the reference import helper, replace:

```ts
  const xml = omitStringChildCollectionReferencesFromXML(parsed.MetaDataObject, rule)
  return importMetadataItemFromXML({ context, xml, rule }) ?? undefined
```

with:

```ts
  return importMetadataItemFromXML({ context, xml: parsed.MetaDataObject, rule }) ?? undefined
```

- [ ] **Step 3: Remove collectState dependency**

In `packages/core/metadata/appliedObjects/configuration/migrations/collectState.ts`, delete this import:

```ts
import { omitStringChildCollectionReferencesFromXML } from "~/metadata/orchestration/appliedObject/stringChildCollectionReferences"
```

Replace:

```ts
      const xml = omitStringChildCollectionReferencesFromXML(parsed.MetaDataObject, rule)
      const model = importMetadataItemFromXML({ context: params.context, xml, rule })
```

with:

```ts
      const model = importMetadataItemFromXML({ context: params.context, xml: parsed.MetaDataObject, rule })
```

- [ ] **Step 4: Remove helper use from cube tests**

In `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromXML.test.ts`, delete the `omitStringChildCollectionReferencesFromXML` import and replace:

```ts
value: omitStringChildCollectionReferencesFromXML(parsed.MetaDataObject, MetadataExternalDataSourceCubeRules),
```

with:

```ts
value: parsed.MetaDataObject,
```

Make the same replacement in `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/toXML.test.ts`.

- [ ] **Step 5: Delete helper file**

Delete:

```bash
git rm packages/core/metadata/orchestration/appliedObject/stringChildCollectionReferences.ts
```

- [ ] **Step 6: Verify no references remain**

Run:

```bash
rg -n "omitStringChildCollectionReferencesFromXML|stringChildCollectionReferences" packages/core/metadata
```

Expected: no matches.

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadataExternalDataSource roundTripYAMLFast.test.ts collectState
```

Expected: PASS.

- [ ] **Step 8: Commit helper removal**

```bash
git add packages/core/metadata/orchestration/appliedObject/convertFromXML.ts packages/core/metadata/orchestration/appliedObject/syncToXML.ts packages/core/metadata/appliedObjects/configuration/migrations/collectState.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromXML.test.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCube/toXML.test.ts
git add -u packages/core/metadata/orchestration/appliedObject/stringChildCollectionReferences.ts
git commit -m "refactor: :recycle: убрать фильтр file-item ссылок"
```

---

### Task 5: Verify Round-Trip And Full Test Suite

**Files:**
- No production file edits unless verification exposes a failure.

- [ ] **Step 1: Run fast check on the failing local config**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/.worktrees/external-data-source-file-items/packages/cli exec tsx src/cli.ts round-trip-yaml-fast /home/nikita/git/round-trip/all
```

Expected:

```text
errors: 0
```

`diffs` should remain `0` for the previously failing `all` config.

- [ ] **Step 2: Run core tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Commit any verification-only fixes**

If verification found and fixed a small issue, commit it:

```bash
git add packages/core/metadata
git commit -m "fix: :bug: стабилизировать ChildFileItemNames"
```

If no files changed, skip this step.
