# External Data Source Reference Children Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Починить `nkdk import` для `MetadataExternalDataSource`, когда дочерние таблицы, кубы или таблицы измерений в parent XML представлены строковыми ссылками на отдельные XML-файлы.

**Architecture:** Исправление остаётся в общем оркестраторе `childCollections`, потому что правила внешнего источника данных уже описывают `xmlDir` и `fileItemRule`. XML-строка в коллекции нормализуется в объект `{ name }`, после чего существующий код дочитывает полный XML дочернего объекта и подмешивает его в модель.

**Tech Stack:** TypeScript, Vitest, существующий metadata orchestration слой, `pnpm`.

---

## File Structure

- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
  - Ответственность: обход `childCollections` при `XML -> YAML`, нормализация элементов коллекции и чтение внешних XML-файлов дочерних объектов.
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts`
  - Ответственность: регрессионная проверка реального формата `ExternalDataSource`, где parent XML содержит `<Table>Имя</Table>`, а полная таблица лежит в `Tables/Имя.xml`.

## Task 1: Зафиксировать падающий сценарий

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts`

- [ ] **Step 1: Add focused failing test**

Add this `it` block after the existing test inside `describe("convertAppliedObjectFromXML — MetadataExternalDataSource", () => { ... })`:

```ts
  it("читает таблицу внешнего источника из строковой ссылки и отдельного XML-файла", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataExternalDataSourceRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readExternalDataSourceYAML,
    })

    expect(yaml.result).toContain("Таблицы:\n  ТаблицаНоменклатура:")
    expect(yaml.result).toContain("ИмяВИсточникеДанных: Catalog_Items")
    expect(fs.readFileSync(join(outputDir, name, "Таблицы/ТаблицаНоменклатура/МодульМенеджера.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, "Tables/ТаблицаНоменклатура/Ext/ManagerModule.bsl"), "utf-8")
    )
  })
```

This uses the existing sync fixture. Its parent file already stores the table as a reference string:

```xml
<ChildObjects>
  <Table>ТаблицаНоменклатура</Table>
</ChildObjects>
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm --dir packages/core test:isolated metadataExternalDataSource/convertFromXML.test.ts
```

Expected: FAIL before implementation with a TypeError like:

```text
Cannot use 'in' operator to search for 'name' in ТаблицаНоменклатура
```

If the existing first test already fails before the new test runs, that is acceptable and confirms the same blocker.

- [ ] **Step 3: Commit the failing test**

```bash
git add packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts
git commit -m "test: :white_check_mark: зафиксировать reference-дочки внешнего источника"
```

## Task 2: Нормализовать строковые элементы `childCollections`

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`

- [ ] **Step 1: Add local helper types and helper function**

In `convertFromXML.ts`, add these declarations near `syncChildCollectionsFromXML`, before the function:

```ts
type ChildCollectionItem = {
  name: string
  model: Record<string, unknown>
}

function normalizeChildCollectionItems(collectionModel: unknown): ChildCollectionItem[] {
  if (Array.isArray(collectionModel)) {
    return collectionModel
      .map((item): ChildCollectionItem | undefined => {
        if (typeof item === "string") return { name: item, model: { name: item } }
        if (!item || typeof item !== "object") return undefined

        const model = item as Record<string, unknown>
        const name = String(model["name"] ?? "")
        return name ? { name, model } : undefined
      })
      .filter((item): item is ChildCollectionItem => item !== undefined)
  }

  if (!collectionModel || typeof collectionModel !== "object") return []

  return Object.entries(collectionModel as Record<string, Record<string, unknown>>).map(([itemName, itemModel]) => ({
    name: itemName,
    model: { ...itemModel, name: itemName },
  }))
}
```

- [ ] **Step 2: Replace inline item derivation**

In `syncChildCollectionsFromXML`, replace the current block:

```ts
    const collectionModel = model[childCollection.propertyKey]
    if (!collectionModel || typeof collectionModel !== "object") continue
    // После XML-импорта коллекция — массив [{name, ...}, ...], после YAML — Record<name, ...>
    const items = Array.isArray(collectionModel)
      ? (collectionModel as Array<Record<string, unknown>>)
          .map((item) => ({ name: String(item["name"] ?? ""), model: item }))
          .filter((item) => item.name)
      : Object.entries(collectionModel as Record<string, Record<string, unknown>>).map(([itemName, itemModel]) => ({
          name: itemName,
          model: { ...itemModel, name: itemName },
        }))
```

with:

```ts
    const collectionModel = model[childCollection.propertyKey]
    const items = normalizeChildCollectionItems(collectionModel)
    if (items.length === 0) continue
```

- [ ] **Step 3: Run the focused test and confirm it passes**

Run:

```bash
pnpm --dir packages/core test:isolated metadataExternalDataSource/convertFromXML.test.ts
```

Expected: PASS for `convertAppliedObjectFromXML — MetadataExternalDataSource`.

- [ ] **Step 4: Commit the implementation**

```bash
git add packages/core/metadata/orchestration/appliedObject/convertFromXML.ts
git commit -m "fix: :bug: исправить reference-дочки внешнего источника"
```

## Task 3: Verify the original round-trip import blocker is gone

**Files:**
- No code changes.

- [ ] **Step 1: Check working tree**

Run:

```bash
git status --short
```

Expected: clean output.

- [ ] **Step 2: Run the diagnostic script**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the previous error does not appear:

```text
Cannot use 'in' operator to search for 'ManagerModule' in ТаблицаВсеСвойства
```

The script may later stop on a different import error or produce a diff. Do not fix that in this task.

- [ ] **Step 3: Record the outcome**

If the script stops later, copy the new `ROUND_TRIP_ERROR` or selected diff into the final implementation report. Do not modify XML fixtures or code for later findings.

## Task 4: Final verification and report

**Files:**
- No code changes unless Task 3 reveals the same blocker remains.

- [ ] **Step 1: Run focused tests once more**

Run:

```bash
pnpm --dir packages/core test:isolated metadataExternalDataSource/convertFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Check commit history**

Run:

```bash
git log --oneline -3
```

Expected: the two implementation commits are present above the design/spec commits.

- [ ] **Step 3: Prepare final report**

Report:

```text
Исправлено:
- строковые элементы childCollections теперь нормализуются в { name }
- MetadataExternalDataSource import больше не падает на Table reference-форме

Проверка:
- pnpm --dir packages/core test:isolated metadataExternalDataSource/convertFromXML.test.ts
- ./.agents/skills/round-trip-yaml/round-trip.sh дошёл дальше прежней ошибки
```

If `round-trip-yaml` reaches a new blocker, include its stage and message separately and state that it is outside this change.

---

## Self-Review

- Spec coverage: covered string child reference normalization, enrichment from `fileItemRule`, focused `MetadataExternalDataSource` test, and round-trip recheck.
- Placeholder scan: no deferred sections or unresolved placeholders.
- Type consistency: `ChildCollectionItem`, `normalizeChildCollectionItems`, `collectionModel`, `item.name`, and `item.model` are used consistently across tasks.
