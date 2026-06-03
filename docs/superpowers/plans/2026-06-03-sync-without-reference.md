# Sync Without Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make YAML -> XML sync treat missing `referenceDir` as an empty reference for all reference-aware sync paths, so `round-trip-yaml-1c` reaches `ibcmd`.

**Architecture:** Remove implicit `params.referenceDir ?? outputDir` fallbacks from sync boundaries. Propagate `undefined` as an explicit "no reference" value, guard every reference read, and keep existing reference-preserving behavior when `referenceDir` is provided. Tests first cover no-reference behavior for forms, applied objects, configuration, child subsystems, and `ConfigDumpInfo`.

**Tech Stack:** TypeScript, Vitest, pnpm, existing metadata orchestration sync APIs.

---

## File Map

- Modify `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`: make form reference reads optional and stop reading from `outputDir`.
- Modify `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`: cover managed form sync without `referenceDir`.
- Modify `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts`: cover child form sync through applied object without `referenceDir`.
- Modify `packages/core/metadata/commonObjects/childSubsystemNames/toXML.ts`: propagate missing reference to nested subsystem sync.
- Modify `packages/core/metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts`: cover nested subsystem sync without `referenceDir`.
- Modify `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`: make object reference dirs optional and guard reference model, `filePath`, child collection, and preserve-reference reads.
- Modify `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`: cover applied object sync without reading reference from `outputDir`.
- Modify `packages/core/metadata/appliedObjects/configDumpInfo/sync.ts`: allow missing reference dir.
- Modify `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`: stop falling back to `outputDir`; use empty structural state and skip reference preservation when no reference exists.
- Modify `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`: cover configuration sync without reference and no copying from stale `outputDir`.

## Task 1: Form Sync Without Reference

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`

- [ ] **Step 1: Add a failing test for managed form no-reference sync**

Append this test inside `describe("sync ClientApplicationForm to XML", ...)`, after the first export test:

```ts
  it("синхронизирует managed form без referenceDir", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-form-no-reference-"))
    const tmpInputDir = join(tmpRoot, "yaml")

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: tmpInputDir,
        outputDir,
        formName,
      })

      expect(fs.existsSync(join(outputDir, "Forms", `${formName}.xml`))).toBe(true)
      expect(fs.existsSync(join(outputDir, "Forms", formName, "Ext", "Form.xml"))).toBe(true)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
```

- [ ] **Step 2: Run the test and verify it fails with ENOENT**

Run:

```bash
pnpm vitest packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts -t "managed form без referenceDir"
```

Expected: FAIL with an `ENOENT` reading `Forms/ФормаЭлемента.xml` from the output directory.

- [ ] **Step 3: Make reference form optional**

In `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`, replace the local reference fallback and read block:

```ts
  const { context, inputDir, formName, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir
```

with:

```ts
  const { context, inputDir, formName, outputDir } = params
  const referenceDir = params.referenceDir
```

Replace:

```ts
  const referenceForm = readFormFromXML({
    context: contextFromXML,
    inputDir: referenceDir,
    formName,
  })
```

with:

```ts
  const referenceForm = referenceDir
    ? readFormFromXML({
        context: contextFromXML,
        inputDir: referenceDir,
        formName,
      })
    : undefined
```

Replace:

```ts
  const referenceHasFormXML = hasReferenceFormXML({ referenceDir, formName })
```

with:

```ts
  const referenceHasFormXML = referenceDir ? hasReferenceFormXML({ referenceDir, formName }) : true
```

Keep the ordinary-form branch unchanged:

```ts
  const formXML =
    isOrdinaryForm && !referenceHasFormXML
      ? undefined
      : exportClientApplicationFormToXML({ context: contextWithFormDir, form, referenceForm })
```

- [ ] **Step 4: Run the focused form test**

Run:

```bash
pnpm vitest packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts -t "managed form без referenceDir"
```

Expected: PASS.

- [ ] **Step 5: Run all form sync tests**

Run:

```bash
pnpm vitest packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add packages/core/metadata/forms/clientApplicationForm/syncToXML.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts
git commit -m "fix: :bug: поддержать sync форм без reference"
```

## Task 2: Applied Object and Child Form Sync Without Reference

**Files:**
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`

- [ ] **Step 1: Add failing child form test**

Append this test in `syncChildFormNamesToXML (через syncAppliedObjectToXML)` after the existing form write test:

```ts
  it("записывает формы каталога без referenceDir", async () => {
    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
    })

    const formMetadataPath = join(outputDir, name, "Forms", "ФормаЭлемента.xml")
    const formXmlPath = join(outputDir, name, "Forms", "ФормаЭлемента", "Ext", "Form.xml")

    expect(fs.existsSync(formMetadataPath), `expected ${formMetadataPath}`).toBe(true)
    expect(fs.existsSync(formXmlPath), `expected ${formXmlPath}`).toBe(true)

    fs.rmSync(outputDir, { recursive: true })
  })
```

- [ ] **Step 2: Add failing applied object outputDir test**

Append this test in `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts` near the existing fallback-reference test:

```ts
  it("без referenceDir не читает reference XML из outputDir", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "nakidka-applied-no-reference-"))
    const inputDir = join(tmpDir, "yaml", "Справочник")
    const outputDir = join(tmpDir, "xml", "Catalogs")
    const name = "ТестСправочник"

    try {
      fs.mkdirSync(join(inputDir, name), { recursive: true })
      fs.mkdirSync(outputDir, { recursive: true })
      fs.writeFileSync(join(inputDir, name, "Свойства.yaml"), "Имя: ТестСправочник\n", "utf-8")
      fs.writeFileSync(join(outputDir, `${name}.xml`), "this is not xml", "utf-8")

      await syncAppliedObjectToXML({
        rule: MetadataCatalogRules,
        context: mockContextToXML(),
        inputDir,
        name,
        outputDir,
      })

      const result = fs.readFileSync(join(outputDir, `${name}.xml`), "utf-8")
      expect(result).toContain("<Catalog")
      expect(result).not.toContain("this is not xml")
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
```

Use existing imports if present; otherwise add:

```ts
import fs from "fs"
import os from "os"
import { join } from "path"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { mockContextToXML } from "~/tests/mockContext"
```

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
pnpm vitest packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts -t "без referenceDir"
pnpm vitest packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts -t "без referenceDir не читает"
```

Expected: first test fails with form `ENOENT`; second fails by trying to parse `this is not xml` or by using `outputDir` as reference.

- [ ] **Step 4: Make object reference directories optional**

In `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`, replace:

```ts
  const referenceDir = params.referenceDir ?? outputDir
  const externalOutputDir = params.externalOutputDir ?? outputDir
  const externalReferenceDir = params.externalReferenceDir ?? referenceDir
```

with:

```ts
  const referenceDir = params.referenceDir
  const externalOutputDir = params.externalOutputDir ?? outputDir
  const externalReferenceDir = params.externalReferenceDir ?? referenceDir
```

Replace reference XML path setup:

```ts
  const referenceXmlPath = join(referenceDir, `${referenceName}.xml`)
  const loadedReferenceModel =
    params.referenceModel === undefined
      ? readReferenceModel({ context: contextFromXML, xmlPath: referenceXmlPath, rule })
      : (params.referenceModel ?? undefined)
```

with:

```ts
  const referenceXmlPath = referenceDir ? join(referenceDir, `${referenceName}.xml`) : undefined
  const loadedReferenceModel =
    params.referenceModel === undefined && referenceXmlPath
      ? readReferenceModel({ context: contextFromXML, xmlPath: referenceXmlPath, rule })
      : (params.referenceModel ?? undefined)
```

Replace `filePathReferenceValues` calculation:

```ts
  const filePathReferenceValues =
    params.referenceModel === null
      ? {}
      : readFilePathReferenceValues({
          context: contextFromXML,
          rule,
          externalReferenceDir,
          referenceName,
          hasExplicitExternalReferenceDir,
        })
```

with:

```ts
  const filePathReferenceValues =
    params.referenceModel === null || !externalReferenceDir
      ? {}
      : readFilePathReferenceValues({
          context: contextFromXML,
          rule,
          externalReferenceDir,
          referenceName,
          hasExplicitExternalReferenceDir,
        })
```

- [ ] **Step 5: Guard child collection and preserve-reference paths**

Update `syncChildCollectionExternalFilesToXML` parameter type:

```ts
  referenceDir?: string
```

Inside it, replace child reference dir construction:

```ts
      const childReferenceDir = childCollection.xmlDir
        ? join(referenceDir, resolveChildCollectionDir(childCollection.xmlDir, item.name, referenceName ?? name))
        : referenceDir
```

with:

```ts
      const childReferenceDir =
        referenceDir && childCollection.xmlDir
          ? join(referenceDir, resolveChildCollectionDir(childCollection.xmlDir, item.name, referenceName ?? name))
          : referenceDir
```

Inside the `if (childCollection.fileItemRule && childCollection.xmlDir)` block, replace the old unconditional reference read:

```ts
        const childReferencePath = `${childReferenceDir}.xml`
        const childReferenceModel = readReferenceModel({
          context: {
            fromXML: { forReference: true },
            defaultLanguage: context.defaultLanguage,
            version: "2.20",
          },
          xmlPath: childReferencePath,
          rule: childCollection.fileItemRule,
        })
```

with:

```ts
        const childReferenceModel = childReferenceDir
          ? readReferenceModel({
              context: {
                fromXML: { forReference: true },
                defaultLanguage: context.defaultLanguage,
                version: "2.20",
              },
              xmlPath: `${childReferenceDir}.xml`,
              rule: childCollection.fileItemRule,
            })
          : undefined
```

Update `preserveReferenceChildNameFilesToXML` signature:

```ts
  referenceDir?: string
```

and add the first line:

```ts
  if (!params.referenceDir) return
```

- [ ] **Step 6: Guard `filePath` output path reference check**

In the `filePath` export loop, replace:

```ts
    const rootReferenceExtPath = join(externalReferenceDir, propRule.filePath)
```

with:

```ts
    const rootReferenceExtPath = externalReferenceDir ? join(externalReferenceDir, propRule.filePath) : undefined
```

Replace:

```ts
      fs.existsSync(rootReferenceExtPath) || hasExplicitExternalOutputDir
```

with:

```ts
      (rootReferenceExtPath && fs.existsSync(rootReferenceExtPath)) || hasExplicitExternalOutputDir
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm vitest packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts -t "без referenceDir"
pnpm vitest packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts -t "без referenceDir не читает"
```

Expected: PASS.

- [ ] **Step 8: Run all applied object sync tests**

Run:

```bash
pnpm vitest packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 2**

```bash
git add packages/core/metadata/orchestration/appliedObject/syncToXML.ts packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts
git commit -m "fix: :bug: поддержать sync объектов без reference"
```

## Task 3: Child Subsystems Without Reference

**Files:**
- Modify: `packages/core/metadata/commonObjects/childSubsystemNames/toXML.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts`

- [ ] **Step 1: Add failing no-reference nested subsystem test**

Append this test to `packages/core/metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts`:

```ts
  it("синхронизирует дочерние подсистемы без referenceDir", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-subsystem-no-reference-"))
    const yamlDir = join(tmp, "yaml", "Подсистема")
    const outDir = join(tmp, "xml", "Subsystems")

    try {
      fs.mkdirSync(join(yamlDir, "Администрирование", "Подсистемы", "НастройкиПрограммы"), { recursive: true })
      fs.writeFileSync(
        join(yamlDir, "Администрирование", "Свойства.yaml"),
        ["Имя: Администрирование", "Подсистемы:", "  - НастройкиПрограммы", ""].join("\n"),
        "utf-8"
      )
      fs.writeFileSync(
        join(yamlDir, "Администрирование", "Подсистемы", "НастройкиПрограммы", "Свойства.yaml"),
        "Имя: НастройкиПрограммы\n",
        "utf-8"
      )
      fs.mkdirSync(join(outDir, "Администрирование", "Subsystems"), { recursive: true })
      fs.writeFileSync(join(outDir, "Администрирование", "Subsystems", "НастройкиПрограммы.xml"), "this is not xml", "utf-8")

      await syncAppliedObjectToXML({
        rule: MetadataSubsystemRules,
        context: mockContextToXML(),
        inputDir: yamlDir,
        name: "Администрирование",
        outputDir: outDir,
      })

      expect(fs.existsSync(join(outDir, "Администрирование.xml"))).toBe(true)
      expect(fs.existsSync(join(outDir, "Администрирование", "Subsystems", "НастройкиПрограммы.xml"))).toBe(true)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })
```

Add missing imports if needed:

```ts
import fs from "fs"
import os from "os"
import { join } from "path"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { mockContextToXML } from "~/tests/mockContext"
import { MetadataSubsystemRules } from "./rules"
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm vitest packages/core/metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts -t "дочерние подсистемы без referenceDir"
```

Expected: FAIL from using `xmlDir` as reference and trying to parse `this is not xml`.

- [ ] **Step 3: Propagate missing reference in child subsystem sync**

In `packages/core/metadata/commonObjects/childSubsystemNames/toXML.ts`, replace:

```ts
  const childReferenceDir = childSubsystemDir(params.referenceDir ?? params.xmlDir, parentReferenceName)
```

with:

```ts
  const childReferenceDir = params.referenceDir
    ? childSubsystemDir(params.referenceDir, parentReferenceName)
    : undefined
```

The existing `syncAppliedObjectToXML` call keeps:

```ts
      referenceDir: childReferenceDir,
      externalReferenceDir: join(childReferenceDir, childName),
```

Replace `externalReferenceDir` with a guarded value:

```ts
      externalReferenceDir: childReferenceDir ? join(childReferenceDir, childName) : undefined,
```

- [ ] **Step 4: Run subsystem tests**

Run:

```bash
pnpm vitest packages/core/metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add packages/core/metadata/commonObjects/childSubsystemNames/toXML.ts packages/core/metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts
git commit -m "fix: :bug: поддержать sync подсистем без reference"
```

## Task 4: Configuration and ConfigDumpInfo Without Reference

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/sync.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Add failing configuration no-reference test**

Append this test to `describe("sync configuration to XML", ...)` in `configuration/syncToXML.test.ts`:

```ts
  it("без referenceDir не читает reference из outputDir и создаёт ConfigDumpInfo.xml", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-configuration-no-reference-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "xml")

    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Контрагенты"), { recursive: true })
      fs.mkdirSync(join(outDir, "Catalogs"), { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
      fs.writeFileSync(join(yamlDir, "Справочник", "Контрагенты", "Свойства.yaml"), "Имя: Контрагенты\n", "utf-8")
      fs.writeFileSync(join(outDir, "Catalogs", "Контрагенты.xml"), "this is not xml", "utf-8")
      fs.mkdirSync(join(outDir, "Ext"), { recursive: true })
      fs.writeFileSync(join(outDir, "Ext", "Unsupported.xml"), "<Unsupported/>", "utf-8")

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
      })

      expect(result.failed).toEqual([])
      expect(fs.readFileSync(join(outDir, "Catalogs", "Контрагенты.xml"), "utf-8")).toContain("<Catalog")
      expect(fs.existsSync(join(outDir, "ConfigDumpInfo.xml"))).toBe(true)
      expect(fs.existsSync(join(outDir, "Ext", "Unsupported.xml"))).toBe(false)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })
```

- [ ] **Step 2: Run the focused configuration test and verify failure**

Run:

```bash
pnpm vitest packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts -t "без referenceDir не читает"
```

Expected: FAIL from parsing stale `outDir` XML as reference, copying stale reference files, or passing `referenceDir` as required to `ConfigDumpInfo`.

- [ ] **Step 3: Allow missing referenceDir in ConfigDumpInfo sync**

In `packages/core/metadata/appliedObjects/configDumpInfo/sync.ts`, change the parameter type:

```ts
  referenceDir?: string
```

Update `readReferenceConfigDumpInfo` signature:

```ts
  referenceDir?: string
```

Add the guard at the start of `readReferenceConfigDumpInfo`:

```ts
  if (!params.referenceDir) return new Map()
```

Keep the existing `fs.existsSync(path)` guard.

- [ ] **Step 4: Stop configuration fallback to outputDir**

In `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`, replace:

```ts
  const { context, inputDir, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir
```

with:

```ts
  const { context, inputDir, outputDir } = params
  const referenceDir = params.referenceDir
```

Replace:

```ts
  const referenceState = await collectStructuralStateFromXML({ xmlDir: referenceDir, context: contextFromXML })
```

with:

```ts
  const referenceState = referenceDir
    ? await collectStructuralStateFromXML({ xmlDir: referenceDir, context: contextFromXML })
    : { nodes: new Map() }
```

In the migration conflict error, replace `${referenceDir}` with `${referenceDir ?? outputDir}` so the diagnostic command still has a usable path:

```ts
`Найдены возможные переименования:\n${details}\nЗапустите: nkdk generate-migration ${inputDir} ${referenceDir ?? outputDir}`
```

Guard root reference reads:

```ts
    const hasReferenceConfiguration =
      referenceDir !== undefined && fs.existsSync(join(referenceDir, CONFIGURATION_XML_FILE))
    const referenceConfiguration = hasReferenceConfiguration
      ? readConfigurationFromXML({ context: contextFromXML, inputDir: referenceDir })
      : undefined
    const referenceChildObjects = hasReferenceConfiguration
      ? readConfigurationChildObjectsFromXML(referenceDir)
      : undefined
```

For top-level rule directories, replace:

```ts
    const xmlReferenceDir = join(referenceDir, rule.xmlDir)
```

with:

```ts
    const xmlReferenceDir = referenceDir ? join(referenceDir, rule.xmlDir) : undefined
```

Update calls to `syncAppliedObjectToXML` to pass:

```ts
            referenceDir: xmlReferenceDir,
            externalReferenceDir: xmlReferenceDir ? join(xmlReferenceDir, referenceName) : undefined,
```

Guard post-batch reference preservation:

```ts
      if (referenceDir) {
        await preserveUnsupportedRootExternalFilesToXML({ outputDir, referenceDir, xmlManifest })
      }
```

- [ ] **Step 5: Run focused configuration test**

Run:

```bash
pnpm vitest packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts -t "без referenceDir не читает"
```

Expected: PASS.

- [ ] **Step 6: Run configuration sync tests**

Run:

```bash
pnpm vitest packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

```bash
git add packages/core/metadata/appliedObjects/configDumpInfo/sync.ts packages/core/metadata/appliedObjects/configuration/syncToXML.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "fix: :bug: поддержать sync конфигурации без reference"
```

## Task 5: End-to-End Verification

**Files:**
- No code changes expected.

- [ ] **Step 1: Run targeted regression suite**

Run:

```bash
pnpm vitest packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts packages/core/metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the 1C runner until ibcmd**

The `round-trip-yaml-1c` skill currently lives in the worktree branch that introduced it. From the repository root, inspect it if needed:

```bash
sed -n '1,220p' /home/nikita/git/nkdk/.worktrees/round-trip-yaml-1c/.agents/skills/round-trip-yaml-1c/SKILL.md
sed -n '1,220p' /home/nikita/git/nkdk/.worktrees/round-trip-yaml-1c/.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Use `.env` with:

```bash
NKDK_XML_REPO=/home/nikita/git/round-trip
NKDK_XML_DIR=/home/nikita/git/round-trip/all
NKDK_1C_DATA=/home/nikita/git/temp-base
NKDK_1C_DB_PATH=/home/nikita/git/temp-base
NKDK_ROUND_TRIP_YAML_DIR=/tmp/round-trip-yaml-1c
```

Then run:

```bash
/home/nikita/git/nkdk/.worktrees/round-trip-yaml-1c/.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected: the output no longer contains the 28 sync `ENOENT` failures for missing form XML files. The run reaches the `ibcmd infobase config import` stage. Any `ibcmd` load errors are acceptable for this iteration and must be copied into the final report.

- [ ] **Step 3: Run the full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Final status**

Run:

```bash
git status --short
```

Expected: clean worktree after all task commits.

Report:

- the task commits created;
- targeted test result;
- `pnpm test` result;
- whether runner reached `ibcmd`;
- first `ibcmd` error block, if present.
