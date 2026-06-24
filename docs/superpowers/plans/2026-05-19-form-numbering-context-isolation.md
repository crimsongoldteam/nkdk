# Form Numbering Context Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make form XML numbering state local to each `syncFormToXML` call so `YAML -> XML` no longer repeatedly renumbers elements from previous forms.

**Architecture:** Keep the change inside `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`. `syncFormToXML` will derive a form-scoped `ConfigurationContextWithExportToXML` from the parent context, preserving object-level data and resetting only form-local mutable export state.

**Tech Stack:** TypeScript, Vitest, existing metadata sync helpers, `round-trip-yaml` skill script.

---

## File Structure

- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`
  Adds a regression test that reuses one parent export context across two form sync calls and proves the parent numbering state stays empty.
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
  Adds a small form-scoped context helper and uses it for YAML import plus XML export of one form.
- No XML fixtures are modified. The test duplicates existing fixtures only into a temporary directory under `os.tmpdir()`.

## Preconditions

- Work from `/Users/nikita/git/nakidka-core`.
- Before editing metadata code in a fresh session, read `.agents/knowledge/metadata/INDEX.md`, `sources-of-truth.md`, `round-trip-cycle.md`, and `yaml-contract.md`.
- Before the final `round-trip-yaml` measurement, check that `/Users/nikita/git/round-trip-source` is clean.

### Task 1: Add Regression Test For Form-Scoped Numbering Context

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`

- [ ] **Step 1: Add the failing regression test**

Add this test inside `describe("sync ClientApplicationForm to XML", () => { ... })`, after the existing `"should read form from YAML/nkdk and export to XML files in output dir"` test:

```ts
  it("не накапливает состояние нумерации в родительском контексте между формами", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-form-numbering-"))
    const tmpInputDir = join(tmpRoot, "nkdk")
    const tmpReferenceDir = join(tmpRoot, "reference-forms")
    const tmpOutputDir = join(tmpRoot, "out")
    const secondFormName = "ФормаВторая"

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })
      fs.cpSync(referenceDir, tmpReferenceDir, { recursive: true })
      fs.cpSync(join(inputDir, "Формы", formName), join(tmpInputDir, "Формы", secondFormName), {
        recursive: true,
      })
      fs.cpSync(join(referenceDir, `${formName}.xml`), join(tmpReferenceDir, `${secondFormName}.xml`))
      fs.cpSync(join(referenceDir, formName), join(tmpReferenceDir, secondFormName), { recursive: true })

      const context = mockContextToXML()

      await syncFormToXML({
        context,
        inputDir: tmpInputDir,
        outputDir: tmpOutputDir,
        referenceDir: tmpReferenceDir,
        formName,
      })

      expect(fs.existsSync(join(tmpOutputDir, "Forms", formName, "Ext", "Form.xml"))).toBe(true)
      expect(context.exportToXML.context?.metadataForNumbering).toHaveLength(0)
      expect(context.exportToXML.context?.propertiesItemXmlStack).toBeUndefined()

      await syncFormToXML({
        context,
        inputDir: tmpInputDir,
        outputDir: tmpOutputDir,
        referenceDir: tmpReferenceDir,
        formName: secondFormName,
      })

      expect(fs.existsSync(join(tmpOutputDir, "Forms", secondFormName, "Ext", "Form.xml"))).toBe(true)
      expect(context.exportToXML.context?.metadataForNumbering).toHaveLength(0)
      expect(context.exportToXML.context?.propertiesItemXmlStack).toBeUndefined()
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: FAIL on the new test. The parent `context.exportToXML.context.metadataForNumbering` should contain entries after the first `syncFormToXML` call, proving the current leak.

### Task 2: Isolate Form Export Context In `syncFormToXML`

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`

- [ ] **Step 1: Add a helper for form-scoped XML export context**

Add this helper near `readFormFiles`, before `writeFormToXML`:

```ts
const createFormScopedContext = (params: {
  context: ConfigurationContextWithExportToXML
  formDir: string
}): ConfigurationContextWithExportToXML => {
  const { context, formDir } = params
  const exportContext = context.exportToXML.context

  if (exportContext === undefined) {
    throw new Error("exportToXML.context обязателен для синхронизации формы в XML")
  }

  return {
    ...context,
    importFromYAML: {
      ...(context.importFromYAML ?? {}),
      formDir,
    },
    exportToXML: {
      ...context.exportToXML,
      context: {
        ...exportContext,
        metadataForNumbering: [],
        propertiesItemXmlStack: [],
      },
    },
  }
}
```

- [ ] **Step 2: Use the helper in `syncFormToXML`**

Replace this block:

```ts
  const contextWithFormDir: ConfigurationContextWithExportToXML = {
    ...context,
    importFromYAML: { formDir },
  }
```

with:

```ts
  const contextWithFormDir = createFormScopedContext({ context, formDir })
```

Then replace the XML export calls:

```ts
  const formXML = exportClientApplicationFormToXML({ context, form, referenceForm })
  const metadataXML = exportFormMetadataToXML({
    context,
    form,
    referenceForm: referenceForm,
    name: formName,
  })
```

with:

```ts
  const formXML = exportClientApplicationFormToXML({ context: contextWithFormDir, form, referenceForm })
  const metadataXML = exportFormMetadataToXML({
    context: contextWithFormDir,
    form,
    referenceForm: referenceForm,
    name: formName,
  })
```

Finally, keep the write call on the same scoped context:

```ts
  await writeFormToXML({
    context: contextWithFormDir,
    formXML,
    metadataXML,
    formName,
    outputDir,
    xmlManifest: params.xmlManifest,
  })
```

- [ ] **Step 3: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: PASS for the whole file.

### Task 3: Run Focused Sync Tests

**Files:**
- Test only.

- [ ] **Step 1: Run form sync tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/clientApplicationForm/syncToXML.test.ts metadata/commonObjects/childFormNames/syncExternalToXML.test.ts
```

Expected: PASS. This confirms direct form sync and form sync through `ChildFormNames` both still work.

- [ ] **Step 2: Run configuration sync tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS. This confirms the top-level `YAML -> XML` path still works with the scoped form context.

### Task 4: Verify Project Health

**Files:**
- Test only.

- [ ] **Step 1: Run full tests from the repository root**

Run:

```bash
pnpm test
```

Expected: PASS across all packages. If Langium generated files are stale in the current workspace, first run:

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

- [ ] **Step 2: Check repository status**

Run:

```bash
git status --short
```

Expected: only the intended source and test files are modified:

```text
 M packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts
 M packages/core/metadata/forms/clientApplicationForm/syncToXML.ts
```

### Task 5: Commit The Fix

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`

- [ ] **Step 1: Review the final diff**

Run:

```bash
git diff -- packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.ts
```

Expected: the diff contains only the regression test, the scoped context helper, and replacing form export calls to use that scoped context.

- [ ] **Step 2: Commit**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.ts
git commit -m "perf: :zap: изолировать нумерацию форм"
```

### Task 6: Measure `round-trip-yaml`

**Files:**
- No repository files should remain modified after the command.

- [ ] **Step 1: Check XML repository status**

Run from `/Users/nikita/git/round-trip-source`:

```bash
git status --short
```

Expected: empty output.

- [ ] **Step 2: Run the same `round-trip-yaml` measurement**

Run from `/Users/nikita/git/nakidka-core`:

```bash
/usr/bin/time -p env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the `sync YAML -> XML` stage is much shorter than the previous interrupted run at about 14-15 minutes. Capture:

- total `real`;
- time printed around the `sync` stage;
- success/failure counts;
- first error if the command fails for a functional diff unrelated to this performance fix.

- [ ] **Step 3: Restore XML repository if the measurement leaves changes**

Run from `/Users/nikita/git/round-trip-source` only if `git status --short` is not empty:

```bash
git restore .
git status --short
```

Expected: empty output after restore.

## Self-Review

- Spec coverage: the plan tests and implements form-local `metadataForNumbering`, keeps XML fixtures unchanged, and includes `round-trip-yaml` timing.
- Placeholder scan: no placeholder steps remain; every code change has concrete snippets and commands.
- Type consistency: the helper uses existing `ConfigurationContextWithExportToXML`, existing `importFromYAML`, existing `exportToXML.context`, and does not add new public types.
