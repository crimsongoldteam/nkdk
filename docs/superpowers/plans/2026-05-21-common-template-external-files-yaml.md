# CommonTemplate External Files YAML Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `CommonTemplate` external files in the YAML directory and restore them byte-for-byte during YAML -> XML sync.

**Architecture:** Use the existing declarative `externalFiles` mechanism on `MetadataCommonTemplateRules.properties.template`. Keep copying in `commonObjects/module/*` and `commonObjects/externalFiles/*`; do not add orchestration special cases or parse external file contents.

**Tech Stack:** TypeScript, Vitest, pnpm, existing metadata rules and external file sync helpers.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/module/syncExternal.test.ts`
  - Extends the existing `CommonTemplate Template.bin` test to cover `Template.txt`, `Template/ru.html`, and `Template/_files/1.png`.
- Modify: `packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts`
  - Adds declarative external file rules for text, HTML, and linked resource files.
- No XML fixtures are modified.
- No orchestration code is modified.

## Required Pre-Reads

- Read `.agents/knowledge/metadata/INDEX.md`.
- Because this changes `packages/core/metadata/**` and YAML round-trip behavior, read:
  - `.agents/knowledge/metadata/sources-of-truth.md`
  - `.agents/knowledge/metadata/round-trip-cycle.md`
  - `.agents/knowledge/metadata/yaml-contract.md`
- Read the accepted design: `docs/superpowers/specs/2026-05-21-common-template-external-files-yaml-design.md`.

### Task 1: Add Failing Coverage For CommonTemplate External Files

**Files:**
- Modify: `packages/core/metadata/commonObjects/module/syncExternal.test.ts`

- [ ] **Step 1: Read the current test file**

Run:

```bash
sed -n '1,220p' packages/core/metadata/commonObjects/module/syncExternal.test.ts
```

Expected: file contains the existing `round-trips CommonTemplate Template.bin through rule externalFiles` test.

- [ ] **Step 2: Replace the existing test with broader coverage**

In `packages/core/metadata/commonObjects/module/syncExternal.test.ts`, replace the current `it("round-trips CommonTemplate Template.bin through rule externalFiles", async () => { ... })` block with:

```ts
  it("round-trips CommonTemplate external files through rule externalFiles", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "module-external-"))
    const xmlDir = join(tmpDir, "xml", "CommonTemplates")
    const nkdkDir = join(tmpDir, "yaml", "Шаблон")
    const outputDir = join(tmpDir, "out", "CommonTemplates")
    const name = "Шаблон"
    const templateBin = Buffer.from([0, 1, 2, 255])
    const templateTxt = "plain text template"
    const templateHtml = "<html><body>Привет</body></html>"
    const templateImage = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

    await fs.promises.mkdir(join(xmlDir, name, "Ext", "Template", "_files"), { recursive: true })
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template.bin"), templateBin)
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template.txt"), templateTxt)
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template", "ru.html"), templateHtml)
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template", "_files", "1.png"), templateImage)

    await syncModuleFromXML({
      rule: MetadataCommonTemplateRules.properties.template,
      xmlDir,
      nkdkDir,
      name,
    })

    expect([...fs.readFileSync(join(nkdkDir, "Template.bin"))]).toEqual([...templateBin])
    expect(fs.readFileSync(join(nkdkDir, "Template.txt"), "utf-8")).toBe(templateTxt)
    expect(fs.readFileSync(join(nkdkDir, "Template", "ru.html"), "utf-8")).toBe(templateHtml)
    expect([...fs.readFileSync(join(nkdkDir, "Template", "_files", "1.png"))]).toEqual([...templateImage])

    const xmlManifest = new XmlSyncManifest(join(tmpDir, "out"))
    await syncModuleToXML({
      rule: MetadataCommonTemplateRules.properties.template,
      nkdkDir,
      xmlDir: outputDir,
      name,
      xmlManifest,
    })

    expect([...fs.readFileSync(join(outputDir, name, "Ext", "Template.bin"))]).toEqual([...templateBin])
    expect(fs.readFileSync(join(outputDir, name, "Ext", "Template.txt"), "utf-8")).toBe(templateTxt)
    expect(fs.readFileSync(join(outputDir, name, "Ext", "Template", "ru.html"), "utf-8")).toBe(templateHtml)
    expect([...fs.readFileSync(join(outputDir, name, "Ext", "Template", "_files", "1.png"))]).toEqual([
      ...templateImage,
    ])

    expect(xmlManifest.expectedFiles()).toEqual(
      expect.arrayContaining([
        "CommonTemplates/Шаблон/Ext/Template.bin",
        "CommonTemplates/Шаблон/Ext/Template.txt",
        "CommonTemplates/Шаблон/Ext/Template/ru.html",
        "CommonTemplates/Шаблон/Ext/Template/_files/1.png",
      ])
    )
  })
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/module/syncExternal.test.ts
```

Expected: FAIL because `Template.txt` or `Template/ru.html` is not copied into `nkdkDir`.

- [ ] **Step 4: Commit the failing test**

Run:

```bash
git add packages/core/metadata/commonObjects/module/syncExternal.test.ts
git commit -m "test: :white_check_mark: закрепить внешние файлы CommonTemplate"
```

Expected: commit succeeds.

### Task 2: Add Declarative External File Rules

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts`

- [ ] **Step 1: Read the common template rules**

Run:

```bash
sed -n '1,140p' packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts
```

Expected: `template.externalFiles` currently contains only `Ext/Template.bin`.

- [ ] **Step 2: Update `externalFiles`**

In `packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts`, replace:

```ts
      externalFiles: [{ kind: "file", xmlPath: "Ext/Template.bin", nkdkPath: "Template.bin" }],
```

with:

```ts
      externalFiles: [
        { kind: "file", xmlPath: "Ext/Template.bin", nkdkPath: "Template.bin" },
        { kind: "file", xmlPath: "Ext/Template.txt", nkdkPath: "Template.txt" },
        { kind: "directory", xmlDir: "Ext/Template", nkdkDir: "Template", include: [/\.html$/i] },
        { kind: "directory", xmlDir: "Ext/Template/_files", nkdkDir: "Template/_files", include: [/.*/] },
      ],
```

This mirrors child template external files but uses paths relative to the common template object folder.

- [ ] **Step 3: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/module/syncExternal.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit the implementation**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataCommonTemplate/rules.ts
git commit -m "fix: :bug: сохранить внешние файлы CommonTemplate"
```

Expected: commit succeeds.

### Task 3: Verify Metadata Round-Trip Behavior

**Files:**
- No code files modified.
- The round-trip script will leave diagnostic diff files in `/Users/nikita/git/round-trip-source`.

- [ ] **Step 1: Run focused metadata tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/module/syncExternal.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 3: Run full project tests before closing the issue**

If this worktree has not generated Langium files yet, run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code 0.

Then run:

```bash
pnpm test
```

Expected: PASS across packages.

- [ ] **Step 4: Run round-trip YAML triage**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected:

- script exits with code 0;
- `DIFF_COUNT` is lower than 848;
- first triage batch no longer contains deleted files under `CommonTemplates/*/Ext/Template.txt`;
- first triage batch no longer contains deleted files under `CommonTemplates/*/Ext/Template/ru.html`;
- first triage batch no longer contains deleted files under `CommonTemplates/*/Ext/Template/_files/*`.

- [ ] **Step 5: Inspect remaining CommonTemplates deletions if any**

Run:

```bash
git -C /Users/nikita/git/round-trip-source -c core.quotePath=false diff --name-status -- acc/CommonTemplates
```

Expected: no remaining `D` entries for `acc/CommonTemplates/*/Ext/Template.txt`, `acc/CommonTemplates/*/Ext/Template/*.html`, or `acc/CommonTemplates/*/Ext/Template/_files/*`.

If deleted common template external files remain, stop and report their paths. Do not add ad hoc copying logic; decide whether another declarative `externalFiles` rule is needed.

- [ ] **Step 6: Commit verification notes only if files changed**

If no repository files changed during verification, do not create a commit.

If documentation is updated with verification results, run:

```bash
git add docs/superpowers/specs/2026-05-21-common-template-external-files-yaml-design.md docs/superpowers/plans/2026-05-21-common-template-external-files-yaml.md
git commit -m "docs: :memo: уточнить проверку внешних файлов CommonTemplate"
```

Expected: commit succeeds only when documentation actually changed.

## Self-Review

- Spec coverage: the plan covers `Template.txt`, `Template/*.html`, `Template/_files/*`, byte-for-byte copying, manifest registration, no XML fixture edits, and no orchestration changes.
- Placeholder scan: no placeholder markers or unspecified implementation steps remain.
- Type consistency: `ExternalFileRule` uses existing `kind: "file"` and `kind: "directory"` shapes; paths match current `syncExplicitExternalFilesFromXML` and `syncExplicitExternalFilesToXML` behavior.
