# Root Configuration Ext Uppercase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make root configuration external XML files use canonical `Ext/...` paths in import, YAML-side file collection, XML export, and tests.

**Architecture:** Existing metadata rules already describe the root external files; the fix is a casing correction at the root configuration boundary. Keep object-local `Ext/...` directories unchanged, keep configuration-extension-specific lowercase `ext` behavior only where tests prove it is not the root configuration external directory, and make lowercase root `ext` the legacy case during XML sync cleanup.

**Tech Stack:** TypeScript, Vitest, pnpm, metadata `rules.ts`, `syncConfigurationToXML`, XML/YAML round-trip fixtures.

---

## Scope

This plan covers one issue: root configuration external files currently point to lowercase `ext/...`, while the XML source and accepted decision require uppercase `Ext/...`.

Do not change regular applied-object paths such as `Catalogs/<name>/Ext/...`, form paths, template paths, or nested `Ext` directories. Do not run full round-trip diagnostics as part of implementation unless the user asks; use focused tests plus `pnpm test`.

## Files

- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
  - Change only root configuration external paths from `ext/...` to `Ext/...`.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
  - Change `ROOT_EXTERNAL_XML_DIR` to `Ext`.
  - Make lowercase `ext` the legacy directory removed or renamed during output normalization.
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`
  - Root configuration import fixtures must create/read `Ext/...`.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`
  - Root configuration export expectations must assert `Ext/...`.
  - Keep non-root `Ext/...` fixtures unchanged.
  - Review configuration-extension tests before changing `referenceDir/ext/...`; preserve them if they test extension metadata rather than root external files.
- Modify: `packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/**`
  - Add root configuration sync XML fixture files copied from `/home/nikita/git/round-trip/all/Ext`.
- Modify: `docs/superpowers/specs/2026-05-31-root-ext-lowercase-design.md`
  - Mark the older lowercase decision as superseded.
- Modify: `docs/superpowers/specs/2026-06-02-round-trip-yaml-diff-triage-design.md`
  - Add the implementation decision: root configuration external directory is `Ext`; lowercase root `ext` is legacy.

## Task 1: Add Root `Ext` To Sync Configuration Fixtures

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/ClientApplicationInterface.xml`
- Create: `packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/ExternalConnectionModule.bsl`
- Create: `packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/Logo.xml`
- Create: `packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/Logo/Picture.png`
- Create: `packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/MainSectionCommandInterface.xml`
- Create: `packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/ManagedApplicationModule.bsl`
- Create: `packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/SessionModule.bsl`
- Create: `packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/Splash.xml`
- Create: `packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/Splash/Picture.png`
- Create: `packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/StandaloneConfigurationContent.bin`
- Source: `/home/nikita/git/round-trip/all/Ext/**`

- [ ] **Step 1: Copy the root Ext fixture directory**

Run from repository root:

```bash
mkdir -p packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext
cp -R /home/nikita/git/round-trip/all/Ext/. packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/
```

- [ ] **Step 2: Verify copied fixture file list**

Run:

```bash
find packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext -maxdepth 2 -type f | sort
```

Expected:

```text
packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/ClientApplicationInterface.xml
packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/ExternalConnectionModule.bsl
packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/Logo.xml
packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/Logo/Picture.png
packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/MainSectionCommandInterface.xml
packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/ManagedApplicationModule.bsl
packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/SessionModule.bsl
packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/Splash.xml
packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/Splash/Picture.png
packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext/StandaloneConfigurationContent.bin
```

- [ ] **Step 3: Commit fixture addition**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/__fixtures__/sync/xml/Ext
git commit -m "test: :test_tube: добавить sync fixture корневого Ext"
```

## Task 2: Turn Import Tests Toward Root `Ext`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts`

- [ ] **Step 1: Change root command-interface fixture directory to `Ext`**

Replace root command-interface setup paths like this:

```ts
fs.mkdirSync(join(rootInput, "Ext"), { recursive: true })
fs.writeFileSync(join(rootInput, "Ext", "CommandInterface.xml"), commandInterfaceXml)
fs.writeFileSync(join(rootInput, "Ext", "MainSectionCommandInterface.xml"), mainSectionCommandInterfaceXml)
```

Expected YAML-side file names stay unchanged; only XML input paths change.

- [ ] **Step 2: Change root client-application-interface fixture directory to `Ext`**

Use this path for XML setup:

```ts
fs.mkdirSync(join(rootInput, "Ext"), { recursive: true })
fs.writeFileSync(join(rootInput, "Ext", "ClientApplicationInterface.xml"), clientApplicationInterfaceXml)
```

- [ ] **Step 3: Change root home-page-work-area fixture directory to `Ext`**

Use this path for XML setup:

```ts
fs.mkdirSync(join(rootInput, "Ext"), { recursive: true })
fs.writeFileSync(join(rootInput, "Ext", "HomePageWorkArea.xml"), homePageWorkAreaXml)
```

- [ ] **Step 4: Rename and update the root external files test**

Change the test name from lowercase wording to uppercase wording:

```ts
it("импортирует корневые внешние файлы конфигурации из Ext", async () => {
```

Inside this test, create all root external XML files under `Ext`:

```ts
const extDir = join(rootInput, "Ext")
fs.mkdirSync(extDir, { recursive: true })
fs.writeFileSync(join(extDir, "ManagedApplicationModule.bsl"), "Процедура ПриНачалеРаботыСистемы()\nКонецПроцедуры")
fs.writeFileSync(join(extDir, "SessionModule.bsl"), "Процедура ПриНачалеСеанса()\nКонецПроцедуры")
fs.writeFileSync(join(extDir, "ExternalConnectionModule.bsl"), "Процедура ПриНачалеРаботы()\nКонецПроцедуры")
fs.writeFileSync(join(extDir, "OrdinaryApplicationModule.bsl"), "Процедура ПриНачалеРаботыСистемы()\nКонецПроцедуры")
fs.writeFileSync(join(extDir, "MobileClientSignature.bin"), "signature")
fs.writeFileSync(join(extDir, "StandaloneConfigurationContent.bin"), "standalone")
fs.writeFileSync(join(extDir, "Help.xml"), "<help/>")
fs.mkdirSync(join(extDir, "Help"), { recursive: true })
fs.writeFileSync(join(extDir, "Help", "ru.html"), "<html>help</html>")
fs.writeFileSync(join(extDir, "MainSectionPicture.xml"), "<picture/>")
fs.mkdirSync(join(extDir, "MainSectionPicture"), { recursive: true })
fs.writeFileSync(join(extDir, "MainSectionPicture", "Picture.png"), "png")
fs.writeFileSync(join(extDir, "Logo.xml"), "<logo/>")
fs.mkdirSync(join(extDir, "Logo"), { recursive: true })
fs.writeFileSync(join(extDir, "Logo", "Picture.png"), "logo")
fs.writeFileSync(join(extDir, "Splash.xml"), "<splash/>")
fs.mkdirSync(join(extDir, "Splash"), { recursive: true })
fs.writeFileSync(join(extDir, "Splash", "Picture.png"), "splash")
```

- [ ] **Step 5: Run import tests and confirm they fail before implementation**

Run:

```bash
pnpm --dir packages/core vitest run metadata/appliedObjects/configuration/convertFromXML.test.ts
```

Expected: fails on the changed root `Ext` fixtures because `rules.ts` still points to lowercase `ext/...`.

- [ ] **Step 6: Commit failing import tests**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts
git commit -m "test: :test_tube: зафиксировать импорт корневого Ext"
```

## Task 3: Turn Export Tests Toward Root `Ext`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Update root external file output expectations**

Replace root expectations like `join(outputDir, "ext", "...")` with `join(outputDir, "Ext", "...")` for these files:

```ts
join(outputDir, "Ext", "ManagedApplicationModule.bsl")
join(outputDir, "Ext", "SessionModule.bsl")
join(outputDir, "Ext", "ExternalConnectionModule.bsl")
join(outputDir, "Ext", "OrdinaryApplicationModule.bsl")
join(outputDir, "Ext", "MobileClientSignature.bin")
join(outputDir, "Ext", "StandaloneConfigurationContent.bin")
join(outputDir, "Ext", "Help.xml")
join(outputDir, "Ext", "Help", "ru.html")
join(outputDir, "Ext", "MainSectionPicture.xml")
join(outputDir, "Ext", "MainSectionPicture", "Picture.png")
join(outputDir, "Ext", "Logo.xml")
join(outputDir, "Ext", "Logo", "Picture.png")
join(outputDir, "Ext", "Splash.xml")
join(outputDir, "Ext", "Splash", "Picture.png")
```

Rename the test:

```ts
it("записывает корневые внешние файлы конфигурации в Ext", async () => {
```

- [ ] **Step 2: Update root command-interface export expectations**

Use uppercase root paths:

```ts
expect(fs.existsSync(join(outputDir, "Ext", "CommandInterface.xml"))).toBe(true)
expect(fs.existsSync(join(outputDir, "Ext", "MainSectionCommandInterface.xml"))).toBe(true)
```

When reading generated XML, use:

```ts
fs.readFileSync(join(outputDir, "Ext", "CommandInterface.xml"), "utf8")
fs.readFileSync(join(outputDir, "Ext", "MainSectionCommandInterface.xml"), "utf8")
```

- [ ] **Step 3: Update root client-application-interface export expectations**

Use uppercase root paths:

```ts
expect(fs.existsSync(join(outputDir, "Ext", "ClientApplicationInterface.xml"))).toBe(true)
const xml = fs.readFileSync(join(outputDir, "Ext", "ClientApplicationInterface.xml"), "utf8")
```

- [ ] **Step 4: Update root home-page-work-area export expectations**

Use uppercase root paths:

```ts
expect(fs.existsSync(join(outputDir, "Ext", "HomePageWorkArea.xml"))).toBe(true)
const xml = fs.readFileSync(join(outputDir, "Ext", "HomePageWorkArea.xml"), "utf8")
```

- [ ] **Step 5: Flip stale-directory cleanup tests**

For root configuration output cleanup, create stale lowercase files and expect uppercase output:

```ts
fs.mkdirSync(join(outputDir, "ext"), { recursive: true })
fs.writeFileSync(join(outputDir, "ext", "OldRootFile.xml"), "<old/>")

expect(fs.existsSync(join(outputDir, "ext", "OldRootFile.xml"))).toBe(false)
expect(fs.existsSync(join(outputDir, "Ext", "ManagedApplicationModule.bsl"))).toBe(true)
```

Do not alter applied-object fixtures like:

```ts
join(outputDir, "Catalogs", "Товары", "Ext", "ObjectModule.bsl")
```

- [ ] **Step 6: Review configuration-extension lowercase `ext` references**

Search the test file:

```bash
rg -n 'referenceDir, "ext"|outputDir, "ext"|lowercase ext|устаревший root Ext' packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
```

Preserve `referenceDir/ext/...` only when the surrounding test is about configuration extension metadata rather than root external configuration files. Change root configuration external paths to `Ext`.

- [ ] **Step 7: Run export tests and confirm they fail before implementation**

Run:

```bash
pnpm --dir packages/core vitest run metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: fails because implementation still writes root files to lowercase `ext`.

- [ ] **Step 8: Commit failing export tests**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "test: :test_tube: зафиксировать экспорт корневого Ext"
```

## Task 4: Change Root Configuration Rules To `Ext`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`

- [ ] **Step 1: Replace root module paths**

Change only these root module entries:

```ts
xmlPath: "Ext/ManagedApplicationModule.bsl"
xmlPath: "Ext/SessionModule.bsl"
xmlPath: "Ext/ExternalConnectionModule.bsl"
xmlPath: "Ext/OrdinaryApplicationModule.bsl"
```

- [ ] **Step 2: Replace root interface XML paths**

Change only these root file entries:

```ts
filePath: "Ext/CommandInterface.xml"
filePath: "Ext/MainSectionCommandInterface.xml"
filePath: "Ext/ClientApplicationInterface.xml"
filePath: "Ext/HomePageWorkArea.xml"
```

- [ ] **Step 3: Replace root help, binary, and picture paths**

Change only these root external file entries:

```ts
filePath: "Ext/Help.xml"
xmlPath: "Ext/MobileClientSignature.bin"
xmlPath: "Ext/MainSectionPicture.xml"
payloadXmlDir: "Ext/MainSectionPicture"
xmlPath: "Ext/Logo.xml"
payloadXmlDir: "Ext/Logo"
xmlPath: "Ext/Splash.xml"
payloadXmlDir: "Ext/Splash"
xmlPath: "Ext/StandaloneConfigurationContent.bin"
```

- [ ] **Step 4: Verify no lowercase root `ext/` remains in configuration rules**

Run:

```bash
rg -n '"ext/|payloadXmlDir: "ext|filePath: "ext|xmlPath: "ext' packages/core/metadata/appliedObjects/configuration/rules.ts
```

Expected: no output.

- [ ] **Step 5: Run import tests**

Run:

```bash
pnpm --dir packages/core vitest run metadata/appliedObjects/configuration/convertFromXML.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit rule path change**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts
git commit -m "fix: :bug: импортировать корневые файлы из Ext"
```

## Task 5: Change XML Sync Root Directory Normalization

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Make uppercase `Ext` canonical**

Change the constant:

```ts
const ROOT_EXTERNAL_XML_DIR = "Ext"
const LEGACY_ROOT_EXTERNAL_XML_DIR = "ext"
```

- [ ] **Step 2: Make normalization remove or case-rename lowercase `ext`**

Replace `normalizeRootExternalDirCasing` with this version:

```ts
async function normalizeRootExternalDirCasing(outputDir: string): Promise<void> {
  const entries = fs.existsSync(outputDir) ? await fs.promises.readdir(outputDir) : []
  const hasVisibleLegacyDir = entries.includes(LEGACY_ROOT_EXTERNAL_XML_DIR)
  if (!hasVisibleLegacyDir) return

  const legacyDir = join(outputDir, LEGACY_ROOT_EXTERNAL_XML_DIR)
  const canonicalDir = join(outputDir, ROOT_EXTERNAL_XML_DIR)
  const hasVisibleCanonicalDir = entries.includes(ROOT_EXTERNAL_XML_DIR)
  if (hasVisibleCanonicalDir) {
    await fs.promises.rm(legacyDir, { recursive: true, force: true })
    return
  }

  if (fs.existsSync(canonicalDir)) {
    const [legacyRealPath, canonicalRealPath] = await Promise.all([
      fs.promises.realpath(legacyDir),
      fs.promises.realpath(canonicalDir),
    ])
    if (legacyRealPath === canonicalRealPath) {
      const tempDir = getAvailableRootExternalCaseRenameTempDir(outputDir)
      await fs.promises.rename(legacyDir, tempDir)
      await fs.promises.rename(tempDir, canonicalDir)
      return
    }
  }

  await fs.promises.rm(legacyDir, { recursive: true, force: true })
}
```

- [ ] **Step 3: Rename the temporary directory base**

Use a lowercase legacy base name so the helper describes the current direction:

```ts
function getAvailableRootExternalCaseRenameTempDir(outputDir: string): string {
  const baseName = "ext.__nkdk_case_rename__"
  let candidate = join(outputDir, baseName)
  let index = 0

  while (fs.existsSync(candidate)) {
    index += 1
    candidate = join(outputDir, `${baseName}.${index}`)
  }

  return candidate
}
```

- [ ] **Step 4: Run export tests**

Run:

```bash
pnpm --dir packages/core vitest run metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: pass.

- [ ] **Step 5: Run external-file focused tests**

Run:

```bash
pnpm --dir packages/core vitest run metadata/commonObjects/externalFile/syncExternal.test.ts metadata/commonObjects/externalPicture/syncExternal.test.ts metadata/commonObjects/module/syncExternal.test.ts metadata/commonObjects/help/syncExternal.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit XML sync casing change**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "fix: :bug: экспортировать корневые файлы в Ext"
```

## Task 6: Update Specs And Documentation

**Files:**
- Modify: `docs/superpowers/specs/2026-05-31-root-ext-lowercase-design.md`
- Modify: `docs/superpowers/specs/2026-06-02-round-trip-yaml-diff-triage-design.md`

- [ ] **Step 1: Mark the old lowercase spec as superseded**

Add this block immediately after the title in `docs/superpowers/specs/2026-05-31-root-ext-lowercase-design.md`:

```md
> Superseded on 2026-06-02: root configuration external XML files use canonical `Ext/...`.
> Lowercase root `ext/...` is legacy and should not be used for new import/export behavior.
```

- [ ] **Step 2: Add the current implementation decision to the triage spec**

In `docs/superpowers/specs/2026-06-02-round-trip-yaml-diff-triage-design.md`, add this note to the root `Ext` section:

```md
Implementation decision: all root configuration external files are read from and written to `Ext/...`.
Existing lowercase root `ext/...` is treated as legacy during XML sync cleanup. Object-local directories named `Ext` remain unchanged.
```

- [ ] **Step 3: Verify docs no longer present lowercase root `ext` as canonical**

Run:

```bash
rg -n 'lowercase ext|root `ext|корнев.*ext|all/ext|out/ext' docs/superpowers/specs/2026-05-31-root-ext-lowercase-design.md docs/superpowers/specs/2026-06-02-round-trip-yaml-diff-triage-design.md
```

Expected: any remaining matches describe previous behavior, legacy behavior, or the superseded decision explicitly.

- [ ] **Step 4: Commit docs**

Run:

```bash
git add docs/superpowers/specs/2026-05-31-root-ext-lowercase-design.md docs/superpowers/specs/2026-06-02-round-trip-yaml-diff-triage-design.md
git commit -m "docs: :memo: зафиксировать канонический Ext"
```

## Task 7: Final Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Search for remaining root lowercase `ext` in configuration code**

Run:

```bash
rg -n '"ext/|ROOT_EXTERNAL_XML_DIR = "ext"|join\([^\\n]*"ext"' packages/core/metadata/appliedObjects/configuration
```

Expected: no root configuration external path remains canonical lowercase. Any remaining lowercase `ext` reference must be explicitly legacy or configuration-extension-specific.

- [ ] **Step 2: Run focused configuration tests**

Run:

```bash
pnpm --dir packages/core vitest run metadata/appliedObjects/configuration/convertFromXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: pass.

- [ ] **Step 3: Run the whole project test suite**

Run from repository root:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 4: Inspect git diff**

Run:

```bash
git diff --stat
git diff -- packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/appliedObjects/configuration/syncToXML.ts
```

Expected: changes are limited to root external path casing and legacy cleanup direction.

- [ ] **Step 5: Final commit if any verification-only adjustments were needed**

Run only if files changed after the previous commits:

```bash
git add packages/core/metadata/appliedObjects/configuration docs/superpowers/specs
git commit -m "fix: :bug: восстановить корневые Ext-файлы конфигурации"
```

## Self-Review

- Spec coverage: root `Ext` decision is implemented in sync fixtures, import rules, export rules, cleanup, tests, and specs.
- Placeholder scan: plan contains no unresolved implementation placeholders.
- Type consistency: `ROOT_EXTERNAL_XML_DIR` and `LEGACY_ROOT_EXTERNAL_XML_DIR` are string constants used only in `syncToXML.ts`; `rules.ts` path fields keep existing rule shapes.
- Risk: configuration-extension tests may still need lowercase `ext`; Task 3 requires reviewing those references before changing them.
