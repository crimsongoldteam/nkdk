# Regex Sync State Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Speed up sync state discovery by replacing YAML-parsing rule traversal with one project tree walk filtered by rule-derived path matchers.

**Architecture:** Keep `collectSyncStateFilePaths(projectDir)` as the public entrypoint. Add a focused internal matcher compiler in `syncStateFiles.ts` that builds predicates from `rules.ts`, then use one recursive `readdir` walk to collect existing files matching those predicates. The collector must not read or parse YAML during discovery.

**Tech Stack:** TypeScript, Node `fs.promises`, Vitest, existing metadata `rules.ts`, `metadataProjectSpecs`, `describeMetadataRuleResources`.

---

### Task 0: Re-read Metadata Instructions

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `.agents/knowledge/metadata/sources-of-truth.md`
- Read: `.agents/knowledge/metadata/yaml-contract.md`

- [ ] **Step 1: Read metadata knowledge index**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
```

Expected: confirms required documents before touching `packages/core/metadata/**`.

- [ ] **Step 2: Read required metadata knowledge documents**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,240p' .agents/knowledge/metadata/yaml-contract.md
```

Expected: no code changes yet; this only refreshes constraints.

---

### Task 1: Add Failing Coverage For Path-Shape Discovery

**Files:**
- Modify: `packages/core/metadata/project/syncStateFiles.test.ts`

- [ ] **Step 1: Add files whose names are not declared in YAML**

In `it("collects rule-described metadata files and skips unknown files", ...)`, replace the current `Справочник/Товары/Свойства.yaml` write with a YAML file that does not list `Печать`:

```ts
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Имя: Товары\n")
```

Keep this existing command module file:

```ts
    writeProjectFile(projectDir, "Справочник/Товары/Команды/Печать.bsl", "Процедура ОбработкаКоманды()\nКонецПроцедуры\n")
```

Keep `"Справочник/Товары/Команды/Печать.bsl"` in the expected result.

- [ ] **Step 2: Add service file exclusions to the same test**

Add these writes before the assertion:

```ts
    writeProjectFile(projectDir, ".nkdk-sync.yaml", "version: 1\nfiles: {}\n")
    writeProjectFile(projectDir, ".DS_Store", "ignored\n")
    writeProjectFile(projectDir, ".git/config", "ignored\n")
```

Do not add any of these files to the expected result.

- [ ] **Step 3: Add an unknown nearby file that should remain excluded**

Add this write near the existing `unknown.tmp`:

```ts
    writeProjectFile(projectDir, "Справочник/Товары/Команды/readme.txt", "noise\n")
```

Do not add it to the expected result.

- [ ] **Step 4: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/project/syncStateFiles.test.ts
```

Expected: FAIL because the current implementation only discovers child commands by parsing `Команды` from `Свойства.yaml`.

Do not commit the red test separately.

---

### Task 2: Introduce Compiled Path Matchers

**Files:**
- Modify: `packages/core/metadata/project/syncStateFiles.ts`
- Test: `packages/core/metadata/project/syncStateFiles.test.ts`

- [ ] **Step 1: Remove YAML parsing import and unused traversal constants**

In `packages/core/metadata/project/syncStateFiles.ts`, remove:

```ts
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
```

Remove these constants if no longer used after the task:

```ts
const FORMS_DIR = "Формы"
const FORM_YAML = "Форма.yaml"
const FORM_MODULE = "Модуль.bsl"
```

Keep:

```ts
const PROPERTIES_YAML = "Свойства.yaml"
const CHILD_SUBSYSTEMS_DIR = "Подсистемы"
const SUBSYSTEM_DIR = "Подсистема"
```

- [ ] **Step 2: Add matcher types near constants**

Add below the constants:

```ts
interface SyncStatePathMatcherSet {
  exactFiles: Set<string>
  regexes: RegExp[]
}
```

- [ ] **Step 3: Replace collector entrypoint with compiled matchers and one tree walk**

Replace `collectSyncStateFilePaths` with:

```ts
export async function collectSyncStateFilePaths(projectDir: string): Promise<string[]> {
  const matchers = compileSyncStatePathMatchers()
  const result: string[] = []

  await collectProjectFiles(result, projectDir, "", matchers)

  return result.sort((left, right) => left.localeCompare(right, "ru"))
}
```

- [ ] **Step 4: Add one-pass tree walk**

Add below `collectSyncStateFilePaths`:

```ts
async function collectProjectFiles(
  result: string[],
  projectDir: string,
  relativeDir: string,
  matchers: SyncStatePathMatcherSet,
): Promise<void> {
  const absDir = relativeDir === "" ? projectDir : join(projectDir, ...relativeDir.split("/"))
  if (!(await isDirectory(absDir))) return

  for (const entry of await fs.promises.readdir(absDir, { withFileTypes: true })) {
    if (shouldSkipProjectEntry(relativeDir, entry.name)) continue

    const projectPath = joinProjectPath(relativeDir, entry.name)
    if (entry.isDirectory()) {
      await collectProjectFiles(result, projectDir, projectPath, matchers)
    } else if (entry.isFile() && matchesSyncStatePath(projectPath, matchers)) {
      result.push(projectPath)
    }
  }
}

function shouldSkipProjectEntry(relativeDir: string, name: string): boolean {
  if (name === ".DS_Store") return true
  if (relativeDir === "" && (name === ".git" || name === ".nkdk-sync.yaml")) return true
  if (relativeDir === "" && name === "Миграции") return true
  return false
}

function matchesSyncStatePath(projectPath: string, matchers: SyncStatePathMatcherSet): boolean {
  if (matchers.exactFiles.has(projectPath)) return true
  return matchers.regexes.some((regex) => regex.test(projectPath))
}
```

- [ ] **Step 5: Add matcher compiler skeleton**

Add below the tree walk helpers:

```ts
function compileSyncStatePathMatchers(): SyncStatePathMatcherSet {
  const matchers: SyncStatePathMatcherSet = { exactFiles: new Set(), regexes: [] }

  addExactFileMatcher(matchers, CONFIGURATION_YAML_FILE)
  collectRulePathMatchers(matchers, configurationMetadataProjectSpec.rule, "")

  for (const spec of metadataProjectSpecs) {
    collectTopLevelSpecMatchers(matchers, spec)
  }

  return matchers
}

function collectTopLevelSpecMatchers(matchers: SyncStatePathMatcherSet, spec: MetadataProjectSpec): void {
  const rootPattern = escapeRegexSegment(spec.dir) + "/[^/]+"
  addRegexMatcher(matchers, `^${rootPattern}/${escapeRegexSegment(PROPERTIES_YAML)}$`)
  collectRulePathMatchers(matchers, spec.rule, rootPattern)

  if (spec.dir === SUBSYSTEM_DIR) {
    const nestedSubsystemPattern = `${rootPattern}(?:/${escapeRegexSegment(CHILD_SUBSYSTEMS_DIR)}/[^/]+)*`
    addRegexMatcher(matchers, `^${nestedSubsystemPattern}/${escapeRegexSegment(PROPERTIES_YAML)}$`)
    collectRulePathMatchers(matchers, spec.rule, nestedSubsystemPattern)
  }
}
```

- [ ] **Step 6: Add rule matcher collection**

Add below `collectTopLevelSpecMatchers`:

```ts
function collectRulePathMatchers(matchers: SyncStatePathMatcherSet, rule: MetadataItemRule, basePattern: string): void {
  for (const resource of describeMetadataRuleResources(rule)) {
    if (resource.kind === "asset") {
      addDirectoryMatcher(matchers, basePattern, resource.nkdkDir)
    }
  }

  for (const propertyRule of Object.values(rule.properties) as PropertyRule[]) {
    const syncArea = propertyRule.syncArea
    if (syncArea?.kind === "objectModule") addPathValueMatcher(matchers, basePattern, syncArea.yamlFile, { family: false })

    if ("nkdkDir" in propertyRule) addPathValueMatcher(matchers, basePattern, propertyRule.nkdkDir, { directory: true })
    if ("nkdkPath" in propertyRule) addPathValueMatcher(matchers, basePattern, propertyRule.nkdkPath, { family: true })

    const folderName = getReferenceOnlyFolderName(propertyRule)
    if (folderName !== undefined) addDirectoryMatcher(matchers, basePattern, folderName)

    if (propertyRule.type === "Template" && "nkdkPath" in propertyRule) {
      const nkdkPath = resolveStaticProjectPathValue(propertyRule.nkdkPath)
      if (nkdkPath !== undefined && !nkdkPath.includes("/")) addDirectoryMatcher(matchers, basePattern, "")
    }

    if (propertyRule.type === "ClientApplicationForm") {
      addPathValueMatcher(matchers, basePattern, "Form.xml", { family: true })
    }

    for (const resourceDir of getSyncExternalResourceDirs(propertyRule)) {
      addDirectoryMatcher(matchers, basePattern, resourceDir)
    }
  }

  for (const childCollection of rule.childCollections ?? []) {
    const childBasePattern =
      childCollection.nkdkDir === undefined
        ? basePattern
        : joinRegexPath(basePattern, pathValueToRegex(childCollection.nkdkDir))

    if (childCollection.nkdkDir !== undefined) {
      addRegexMatcher(matchers, `^${childBasePattern}/${escapeRegexSegment(PROPERTIES_YAML)}$`)
    }
    collectRulePathMatchers(matchers, childCollection.itemRule, childBasePattern)
  }
}
```

- [ ] **Step 7: Add path matcher helpers**

Add below `collectRulePathMatchers`:

```ts
function addExactFileMatcher(matchers: SyncStatePathMatcherSet, projectPath: string): void {
  if (projectPath !== "") matchers.exactFiles.add(projectPath)
}

function addRegexMatcher(matchers: SyncStatePathMatcherSet, source: string): void {
  matchers.regexes.push(new RegExp(source))
}

function addDirectoryMatcher(matchers: SyncStatePathMatcherSet, basePattern: string, directoryPath: string): void {
  const dirPattern = joinRegexPath(basePattern, staticPathToRegex(directoryPath))
  if (dirPattern !== "") addRegexMatcher(matchers, `^${dirPattern}/.+$`)
}

function addPathValueMatcher(
  matchers: SyncStatePathMatcherSet,
  basePattern: string,
  value: string | ((params: { name: string; parentName?: string }) => string) | undefined,
  options: { directory?: true; family?: boolean },
): void {
  const pathPattern = pathValueToRegex(value)
  if (pathPattern === undefined) return

  if (options.directory === true) {
    addRegexMatcher(matchers, `^${joinRegexPath(basePattern, pathPattern)}/.+$`)
    return
  }

  const fullPattern = joinRegexPath(basePattern, pathPattern)
  addRegexMatcher(matchers, `^${fullPattern}$`)

  if (options.family === true) {
    const familyPattern = pathFamilyRegex(pathPattern)
    if (familyPattern !== undefined) addRegexMatcher(matchers, `^${joinRegexPath(basePattern, familyPattern)}$`)
  }
}
```

- [ ] **Step 8: Add regex conversion helpers**

Add below path matcher helpers:

```ts
function pathValueToRegex(
  value: string | ((params: { name: string; parentName?: string }) => string) | undefined,
): string | undefined {
  if (typeof value === "string") return staticPathToRegex(value)
  if (typeof value !== "function") return undefined

  const sample = value({ name: "__NKDK_NAME__", parentName: "__NKDK_PARENT__" })
  return staticPathToRegex(sample)
    .replaceAll("__NKDK_NAME__", "[^/]+")
    .replaceAll("__NKDK_PARENT__", "[^/]+")
}

function resolveStaticProjectPathValue(
  value: string | ((params: { name: string; parentName?: string }) => string) | undefined,
): string | undefined {
  return typeof value === "string" ? value : undefined
}

function staticPathToRegex(projectPath: string): string {
  if (projectPath === "") return ""
  return projectPath.split("/").map(escapeRegexSegment).join("/")
}

function pathFamilyRegex(pathPattern: string): string | undefined {
  const slashIndex = pathPattern.lastIndexOf("/")
  const dirPattern = slashIndex === -1 ? "" : pathPattern.slice(0, slashIndex)
  const filePattern = slashIndex === -1 ? pathPattern : pathPattern.slice(slashIndex + 1)
  const dotIndex = filePattern.lastIndexOf("\\.")
  if (dotIndex <= 0) return undefined

  const stemPattern = filePattern.slice(0, dotIndex)
  return joinRegexPath(dirPattern, `${stemPattern}\\.[^/]+`)
}

function joinRegexPath(basePattern: string, childPattern: string | undefined): string {
  if (childPattern === undefined || childPattern === "") return basePattern
  if (basePattern === "") return childPattern
  return `${basePattern}/${childPattern}`
}

function escapeRegexSegment(segment: string): string {
  return segment.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
}
```

- [ ] **Step 9: Remove old YAML-parsing traversal helpers**

Remove these functions from `syncStateFiles.ts`:

```ts
collectSpecFiles
collectObjectFiles
collectForms
collectDeclaredRuleResources
collectRuleDeclaredChildFiles
readObjectYaml
readYamlCollectionNames
collectDirectoryFiles
collectNestedSubsystems
addFileIfExists
addFileFamilyIfExists
resolveProjectPathValue
isFile
isRecord
```

Keep these helpers because the new implementation still needs them:

```ts
getReferenceOnlyFolderName
getSyncExternalResourceDirs
collectResourceDirsFromRule
joinProjectPath
isDirectory
isNotFoundError
```

- [ ] **Step 10: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/project/syncStateFiles.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit matcher implementation**

Run:

```bash
git add packages/core/metadata/project/syncStateFiles.ts packages/core/metadata/project/syncStateFiles.test.ts
git commit -m "perf: :zap: ускорить discovery sync state"
```

---

### Task 3: Verify Hashing And No YAML Reads During Discovery

**Files:**
- Modify: `packages/core/metadata/project/syncStateFiles.test.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`

- [ ] **Step 1: Add a test proving discovery does not parse YAML**

Add a new test to `packages/core/metadata/project/syncStateFiles.test.ts`:

```ts
  it("does not read YAML content to discover child resource files", async () => {
    const projectDir = tempDir()

    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Команды: [\n")
    writeProjectFile(projectDir, "Справочник/Товары/Команды/Печать.bsl", "Процедура ОбработкаКоманды()\nКонецПроцедуры\n")

    await expect(collectSyncStateFilePaths(projectDir)).resolves.toEqual([
      "Справочник/Товары/Команды/Печать.bsl",
      "Справочник/Товары/Свойства.yaml",
    ])
  })
```

This test uses invalid YAML. The old parser-based discovery would throw or fail to discover the command; regex discovery should not care about file contents.

- [ ] **Step 2: Run focused collector tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/project/syncStateFiles.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run hash and collector tests together**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/appliedObjects/configuration/syncState.test.ts metadata/project/syncStateFiles.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit no-YAML-read coverage**

Run:

```bash
git add packages/core/metadata/project/syncStateFiles.test.ts
git commit -m "test: :white_check_mark: проверить discovery без YAML parse"
```

Skip this commit if Task 2 already included the same test in its implementation commit.

---

### Task 4: ERP Correctness And Performance Verification

**Files:**
- Generated outside repo: `/Users/nikita/git/round-trip/erp/.nkdk-sync.yaml`

- [ ] **Step 1: Measure focused discovery time**

Run:

```bash
pnpm --filter @nakidka/core exec tsx -e 'import { performance } from "node:perf_hooks"; import { resolve } from "node:path"; import { collectSyncStateFilePaths } from "./metadata/project/syncStateFiles"; (async()=>{ const t0=performance.now(); const paths=await collectSyncStateFilePaths(resolve("/Users/nikita/git/nkdk-yaml")); const t1=performance.now(); console.log(JSON.stringify({files:paths.length, discoverySec:+((t1-t0)/1000).toFixed(3)}, null, 2)); })();'
```

Expected: `files` is `121463`. `discoverySec` should be materially below the previous `81.46s`.

- [ ] **Step 2: Rebuild ERP sync state and measure full time**

Run:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli dev -- init-sync-state /Users/nikita/git/nkdk-yaml /Users/nikita/git/round-trip/erp
```

Expected: command prints `Файл .nkdk-sync.yaml обновлён`. `real` should move closer to the measured hash/read floor of about `32s` plus tree walk overhead.

- [ ] **Step 3: Compare YAML project files against state entries**

Run:

```bash
node -e "const fs=require('fs'), path=require('path'); const root='/Users/nikita/git/nkdk-yaml', state='/Users/nikita/git/round-trip/erp/.nkdk-sync.yaml'; const all=[]; function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name==='.git'||e.name==='.DS_Store')continue; const f=path.join(d,e.name); const rel=path.relative(root,f).split(path.sep).join('/'); if(rel==='.nkdk-sync.yaml'||rel.startsWith('Миграции/'))continue; if(e.isDirectory())walk(f); else all.push(rel);}} walk(root); const indexed=new Set(); for(const line of fs.readFileSync(state,'utf8').split(/\n/)){const m=line.match(/^  (.+): xxh3-64:[0-9a-f]+$/); if(m) indexed.add(m[1]);} const allSet=new Set(all); const missed=all.filter(p=>!indexed.has(p)).sort((a,b)=>a.localeCompare(b,'ru')); const extra=[...indexed].filter(p=>!allSet.has(p)).sort((a,b)=>a.localeCompare(b,'ru')); console.log(JSON.stringify({allFiles:all.length,indexed:indexed.size,missedCount:missed.length,extraCount:extra.length,missed:missed.slice(0,20),extra:extra.slice(0,20)},null,2)); if(missed.length||extra.length) process.exit(1);"
```

Expected:

```json
{
  "missedCount": 0,
  "extraCount": 0
}
```

- [ ] **Step 4: If ERP comparison reports extra files, inspect before changing code**

Run this grouping command:

```bash
node -e "const fs=require('fs'), path=require('path'); const root='/Users/nikita/git/nkdk-yaml', state='/Users/nikita/git/round-trip/erp/.nkdk-sync.yaml'; const all=[]; function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name==='.git'||e.name==='.DS_Store')continue; const f=path.join(d,e.name); const rel=path.relative(root,f).split(path.sep).join('/'); if(rel==='.nkdk-sync.yaml'||rel.startsWith('Миграции/'))continue; if(e.isDirectory())walk(f); else all.push(rel);}} walk(root); const allSet=new Set(all); const indexed=new Set(); for(const line of fs.readFileSync(state,'utf8').split(/\n/)){const m=line.match(/^  (.+): xxh3-64:[0-9a-f]+$/); if(m) indexed.add(m[1]);} const extra=[...indexed].filter(p=>!allSet.has(p)).sort((a,b)=>a.localeCompare(b,'ru')); const groups=new Map(); for(const p of extra){const parts=p.split('/'); const key=parts.length>2 ? parts[0]+'/.../'+parts[parts.length-1] : p; groups.set(key,(groups.get(key)||0)+1);} console.log([...groups.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60).map(([key,count])=>count+'\t'+key).join('\n'));"
```

Expected: no output when `extraCount` is `0`. If output exists, apply `superpowers:systematic-debugging` before changing matcher rules.

---

### Task 5: Full Verification And Final Commit

**Files:**
- Source files from previous tasks only

- [ ] **Step 1: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 2: Check working tree**

Run:

```bash
git status --short
```

Expected: only intentional source/test changes, or clean if all previous commits were made.

- [ ] **Step 3: Commit remaining implementation changes if needed**

If source/test files remain modified, run:

```bash
git add packages/core/metadata/project/syncStateFiles.ts packages/core/metadata/project/syncStateFiles.test.ts packages/core/metadata/appliedObjects/configuration/syncState.test.ts
git commit -m "perf: :zap: ускорить сбор файлов sync state"
```

- [ ] **Step 4: Record final commits**

Run:

```bash
git log --oneline -5
```

Mention the commits created by this plan in the final report.

---

## Self-Review

- Spec coverage: matcher compilation, one-pass tree walk, no YAML parse, ERP `missedCount: 0`/`extraCount: 0`, and performance measurement are covered.
- Placeholder scan: no TBD/TODO/fill-in sections remain.
- Type consistency: the plan consistently uses `SyncStatePathMatcherSet`, `compileSyncStatePathMatchers`, `collectProjectFiles`, `collectRulePathMatchers`, and existing `MetadataItemRule`/`PropertyRule` names.
