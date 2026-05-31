# External Data Source All Fixtures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the compact external data source sync fixtures with the real `all` fixture and keep external data source tests passing.

**Architecture:** Treat XML from `/home/nikita/git/round-trip/all/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства*` as the source of truth. Update fixture expectations and only fix conversion code if the new fixture exposes a real failing behavior.

**Tech Stack:** TypeScript, Vitest, pnpm, metadata XML/YAML conversion.

---

### Task 1: Replace Sync Fixtures

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/__fixtures__/sync/xml/**`
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/__fixtures__/sync/yaml/**`
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/__fixtures__/sync/data.ts`

- [ ] **Step 1: Capture the current failing baseline**

Run:

```bash
pnpm --dir packages/core test:isolated metadataExternalDataSource
```

Expected: current tests either pass on the old compact fixture or fail only on expectations tied to old fixture names.

- [ ] **Step 2: Replace XML fixture tree**

Copy the external data source XML tree from:

```text
/home/nikita/git/round-trip/all/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства.xml
/home/nikita/git/round-trip/all/ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/**
```

into:

```text
packages/core/metadata/appliedObjects/metadataExternalDataSource/__fixtures__/sync/xml/ВнешнийИсточникДанныхВсеСвойства.xml
packages/core/metadata/appliedObjects/metadataExternalDataSource/__fixtures__/sync/xml/ВнешнийИсточникДанныхВсеСвойства/**
```

Remove old sync XML files for `ТаблицаНоменклатура`, `Продажи`, and `Номенклатура`.

- [ ] **Step 3: Refresh expected YAML**

Generate or copy the YAML structure produced from the new XML fixture into:

```text
packages/core/metadata/appliedObjects/metadataExternalDataSource/__fixtures__/sync/yaml/ВнешнийИсточникДанныхВсеСвойства/**
```

Update `sync/data.ts` so test expectations match the refreshed `Свойства.yaml`.

### Task 2: Update Tests And Minimal Code

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts`
- Modify only if required: `packages/core/metadata/**`

- [ ] **Step 1: Run the focused tests**

Run:

```bash
pnpm --dir packages/core test:isolated metadataExternalDataSource
```

Expected before test updates: failures reference old names or the current `_uuid` conversion problem.

- [ ] **Step 2: Update old-name expectations**

Replace assertions for:

```text
ТаблицаНоменклатура
Продажи
Номенклатура
```

with assertions for real `all` names:

```text
ТаблицаВсеСвойства
ТаблицаПоУмолчанию
ТаблицаМодульНабора
КубВсеСвойства
КубПоУмолчанию
ТаблицаИзмеренияВсеСвойства
```

- [ ] **Step 3: Fix the smallest real conversion failure**

If the focused test fails with:

```text
Cannot use 'in' operator to search for '_uuid' in ТаблицаВсеСвойства
```

trace where a string reference child is passed to object synchronization and fix the boundary so string references are resolved or skipped according to existing reference-child behavior.

- [ ] **Step 4: Verify focused tests**

Run:

```bash
pnpm --dir packages/core test:isolated metadataExternalDataSource
```

Expected: all external data source tests pass.

### Task 3: Final Verification

**Files:**
- No new files unless diagnostics show a missing focused fixture expectation.

- [ ] **Step 1: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 2: Review git diff**

Run:

```bash
git diff --stat
git diff -- packages/core/metadata/appliedObjects/metadataExternalDataSource
```

Expected: diff is limited to the external data source fixture/test change and any minimal conversion fix required by the new fixture.
