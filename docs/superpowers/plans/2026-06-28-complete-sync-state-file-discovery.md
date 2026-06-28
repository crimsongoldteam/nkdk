# Complete Sync State File Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `.nkdk-sync.yaml` include every YAML-model file reachable from `rules.ts`, while still excluding service files and migrations.

**Architecture:** Keep `collectSyncStateFilePaths` as the single discovery entrypoint. Extend it to traverse rule-declared child collections and rule-declared reference folders, using `parseMetadataYaml` only to read child names from `Свойства.yaml`. Do not add broad project globs; files are included only when reachable from metadata specs, child collections, or `folderName`/external resource rules.

**Tech Stack:** TypeScript, Node `fs.promises`, Vitest, existing `rules.ts`, `parseMetadataYaml`, current XXH3 hashing path.

---

### Task 1: Add Failing Coverage For Rule-Reachable Child Files

**Files:**
- Modify: `packages/core/metadata/project/syncStateFiles.test.ts`

- [ ] **Step 1: Extend the first collector test with missed ERP shapes**

Replace the body of `it("collects rule-described metadata files and skips unknown files", ...)` with this version:

```ts
  it("collects rule-described metadata files and skips unknown files", async () => {
    const projectDir = tempDir()

    writeProjectFile(projectDir, "Конфигурация.yaml", "Имя: Тест\n")
    writeProjectFile(projectDir, "МодульПриложения.bsl", "Процедура ПриНачалеРаботыСистемы()\nКонецПроцедуры\n")
    writeProjectFile(
      projectDir,
      "Справочник/Товары/Свойства.yaml",
      [
        "Имя: Товары",
        "Команды:",
        "  Печать:",
        "    Синоним: Печать",
        "",
      ].join("\n"),
    )
    writeProjectFile(projectDir, "Справочник/Товары/МодульОбъекта.bsl", "Процедура Проверка()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Команды/Печать.bsl", "Процедура ОбработкаКоманды()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", "Имя: ФормаЭлемента\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl", "Процедура Проверка()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Справка/ru.html", "<html>form help</html>\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/ДинамическийСписок/Список.query", "ВЫБРАТЬ 1\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Картинки/Иконка.png", "png\n")
    writeProjectFile(projectDir, "Справочник/Товары/Шаблоны/ПечатнаяФорма/Template.xml", "<template/>\n")
    writeProjectFile(projectDir, "Справочник/Товары/Справка/ru.html", "<html>help</html>\n")
    writeProjectFile(projectDir, "Справочник/Товары/unknown.tmp", "noise\n")
    writeProjectFile(projectDir, "Миграции/2026-05-05-143000.yaml", "ignored\n")

    await expect(collectSyncStateFilePaths(projectDir)).resolves.toEqual([
      "Конфигурация.yaml",
      "МодульПриложения.bsl",
      "Справочник/Товары/Команды/Печать.bsl",
      "Справочник/Товары/МодульОбъекта.bsl",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Справка/ru.html",
      "Справочник/Товары/Формы/ФормаЭлемента/ДинамическийСписок/Список.query",
      "Справочник/Товары/Формы/ФормаЭлемента/Картинки/Иконка.png",
      "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl",
      "Справочник/Товары/Формы/ФормаЭлемента/Справка/ru.html",
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      "Справочник/Товары/Шаблоны/ПечатнаяФорма/Template.xml",
    ])
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/project/syncStateFiles.test.ts
```

Expected: FAIL because command module, form nested resources, and template files are not all collected yet.

- [ ] **Step 3: Commit the failing test if the project convention allows red commits, otherwise keep it unstaged**

Do not commit a red test unless the user explicitly asks for strict TDD history. If committing, use:

```bash
git add packages/core/metadata/project/syncStateFiles.test.ts
git commit -m "test: :white_check_mark: описать полный сбор sync state"
```

### Task 2: Traverse Rule-Declared Child Collections And Resource Folders

**Files:**
- Modify: `packages/core/metadata/project/syncStateFiles.ts`
- Test: `packages/core/metadata/project/syncStateFiles.test.ts`

- [ ] **Step 1: Add YAML parsing imports**

Update imports at the top of `syncStateFiles.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { CONFIGURATION_YAML_FILE } from "~/metadata/appliedObjects/configuration/rootIO"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { describeMetadataRuleResources } from "./ruleResources"
import { configurationMetadataProjectSpec, metadataProjectSpecs, type MetadataProjectSpec } from "./specs"
```

- [ ] **Step 2: Pass object names through direct resource collection**

Change the call in `collectSyncStateFilePaths` for configuration resources:

```ts
  await collectDeclaredRuleResources(result, projectDir, configurationMetadataProjectSpec.rule, "", "")
```

Change the call in `collectObjectFiles`:

```ts
  await collectDeclaredRuleResources(result, projectDir, spec.rule, objectPath, objectName)
  await collectRuleDeclaredChildFiles(result, projectDir, spec.rule, objectPath, objectName)
```

Change the function signature:

```ts
async function collectDeclaredRuleResources(
  result: Set<string>,
  projectDir: string,
  rule: MetadataItemRule,
  objectPath: string,
  objectName: string,
): Promise<void> {
  for (const resource of describeMetadataRuleResources(rule)) {
    if (resource.kind === "asset") {
      await collectDirectoryFiles(result, projectDir, joinProjectPath(objectPath, resource.nkdkDir))
    }
  }

  for (const propertyRule of Object.values(rule.properties) as PropertyRule[]) {
    const syncArea = propertyRule.syncArea
    if (syncArea?.kind === "objectModule") {
      await addFileIfExists(result, projectDir, joinProjectPath(objectPath, syncArea.yamlFile))
    }

    if ("nkdkDir" in propertyRule) {
      const nkdkDir = resolveProjectPathValue(propertyRule.nkdkDir, objectName)
      if (nkdkDir !== undefined) await collectDirectoryFiles(result, projectDir, joinProjectPath(objectPath, nkdkDir))
    }

    if ("nkdkPath" in propertyRule) {
      const nkdkPath = resolveProjectPathValue(propertyRule.nkdkPath, objectName)
      if (nkdkPath !== undefined) await addFileIfExists(result, projectDir, joinProjectPath(objectPath, nkdkPath))
    }
  }
}
```

- [ ] **Step 3: Add child traversal helpers**

Add these helpers below `collectDeclaredRuleResources`:

```ts
async function collectRuleDeclaredChildFiles(
  result: Set<string>,
  projectDir: string,
  rule: MetadataItemRule,
  objectPath: string,
  objectName: string,
): Promise<void> {
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties) as Array<[string, PropertyRule]>) {
    const folderName = getReferenceOnlyFolderName(propertyRule)
    if (folderName === undefined) continue
    await collectDirectoryFiles(result, projectDir, joinProjectPath(objectPath, folderName))
  }

  const objectYaml = await readObjectYaml(projectDir, objectPath)
  if (objectYaml === undefined) return

  for (const childCollection of rule.childCollections ?? []) {
    const propertyRule = rule.properties[childCollection.propertyKey] as PropertyRule | undefined
    const yamlKey = propertyRule?.yaml
    if (typeof yamlKey !== "string") continue

    const childNames = readYamlCollectionNames(objectYaml, yamlKey)
    for (const childName of childNames) {
      const childBasePath =
        childCollection.nkdkDir === undefined
          ? objectPath
          : joinProjectPath(objectPath, resolveProjectPathValue(childCollection.nkdkDir, childName, objectName) ?? "")
      await collectDeclaredRuleResources(result, projectDir, childCollection.itemRule, childBasePath, childName)
      await collectRuleDeclaredChildFiles(result, projectDir, childCollection.itemRule, childBasePath, childName)
    }
  }
}

async function readObjectYaml(projectDir: string, objectPath: string): Promise<unknown | undefined> {
  const yamlPath = joinProjectPath(objectPath, PROPERTIES_YAML)
  const absPath = join(projectDir, ...yamlPath.split("/"))
  if (!(await isFile(absPath))) return undefined
  const text = await fs.promises.readFile(absPath, "utf-8")
  return parseMetadataYaml(text).data
}

function readYamlCollectionNames(yaml: unknown, yamlKey: string): string[] {
  if (!isRecord(yaml)) return []
  const collection = yaml[yamlKey]
  if (Array.isArray(collection)) {
    return collection.flatMap((item) => (isRecord(item) && typeof item["Имя"] === "string" ? [item["Имя"]] : []))
  }
  if (isRecord(collection)) {
    return Object.keys(collection)
  }
  return []
}

function getReferenceOnlyFolderName(rule: PropertyRule): string | undefined {
  const folderName = (rule as { folderName?: unknown }).folderName
  return rule.forReferenceOnly === true && typeof folderName === "string" ? folderName : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
```

- [ ] **Step 4: Extend dynamic path helper with parentName**

Replace `resolveProjectPathValue` with:

```ts
function resolveProjectPathValue(
  value: string | ((params: { name: string; parentName?: string }) => string) | undefined,
  name: string,
  parentName?: string,
): string | undefined {
  if (typeof value === "string") return value
  if (typeof value === "function") return value({ name, parentName })
  return undefined
}
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/project/syncStateFiles.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit implementation**

Run:

```bash
git add packages/core/metadata/project/syncStateFiles.ts packages/core/metadata/project/syncStateFiles.test.ts
git commit -m "fix: :bug: учитывать дочерние файлы sync state"
```

### Task 3: Verify State Hashing Uses The Expanded Discovery

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`

- [ ] **Step 1: Extend the hash-project-files test with child resources**

In the test that verifies rule-guided hashing, add files matching the collector test:

```ts
    writeProjectFile(
      projectDir,
      "Справочник/Товары/Свойства.yaml",
      [
        "Имя: Товары",
        "Команды:",
        "  Печать:",
        "    Синоним: Печать",
        "",
      ].join("\n"),
    )
    writeProjectFile(projectDir, "Справочник/Товары/Команды/Печать.bsl", "Процедура ОбработкаКоманды()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Справка/ru.html", "<html>form help</html>\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/ДинамическийСписок/Список.query", "ВЫБРАТЬ 1\n")
    writeProjectFile(projectDir, "Справочник/Товары/Шаблоны/ПечатнаяФорма/Template.xml", "<template/>\n")
```

Add these expected keys to the assertion:

```ts
      "Справочник/Товары/Команды/Печать.bsl",
      "Справочник/Товары/Формы/ФормаЭлемента/ДинамическийСписок/Список.query",
      "Справочник/Товары/Формы/ФормаЭлемента/Справка/ru.html",
      "Справочник/Товары/Шаблоны/ПечатнаяФорма/Template.xml",
```

- [ ] **Step 2: Run sync state tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/appliedObjects/configuration/syncState.test.ts metadata/project/syncStateFiles.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit test coverage if changed**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/syncState.test.ts
git commit -m "test: :white_check_mark: покрыть дочерние файлы sync state"
```

Skip this commit if Task 2 already included the same test changes.

### Task 4: ERP Verification And Final Test Run

**Files:**
- No source files expected
- Generated outside repo: `/Users/nikita/git/round-trip/erp/.nkdk-sync.yaml`

- [ ] **Step 1: Rebuild ERP sync state**

Run:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli dev -- init-sync-state /Users/nikita/git/nkdk-yaml /Users/nikita/git/round-trip/erp
```

Expected: command prints `Файл .nkdk-sync.yaml обновлён`.

- [ ] **Step 2: Compare YAML project files against state entries**

Run:

```bash
node -e "const fs=require('fs'), path=require('path'); const root='/Users/nikita/git/nkdk-yaml', state='/Users/nikita/git/round-trip/erp/.nkdk-sync.yaml'; const all=[]; function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name==='.git'||e.name==='.DS_Store')continue; const f=path.join(d,e.name); const rel=path.relative(root,f).split(path.sep).join('/'); if(rel==='.nkdk-sync.yaml'||rel.startsWith('Миграции/'))continue; if(e.isDirectory())walk(f); else all.push(rel);}} walk(root); const indexed=new Set(); for(const line of fs.readFileSync(state,'utf8').split(/\n/)){const m=line.match(/^  (.+): xxh3-64:[0-9a-f]+$/); if(m) indexed.add(m[1]);} const missed=all.filter(p=>!indexed.has(p)).sort((a,b)=>a.localeCompare(b,'ru')); const extra=[...indexed].filter(p=>!all.includes(p)).sort((a,b)=>a.localeCompare(b,'ru')); console.log(JSON.stringify({allFiles:all.length,indexed:indexed.size,missedCount:missed.length,extraCount:extra.length,missed:missed.slice(0,20),extra:extra.slice(0,20)},null,2)); if(missed.length||extra.length) process.exit(1);"
```

Expected:

```json
{
  "missedCount": 0,
  "extraCount": 0
}
```

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 4: Commit any remaining source/test changes**

Run:

```bash
git status --short
```

If source/test files remain modified, commit them with:

```bash
git add packages/core/metadata/project/syncStateFiles.ts packages/core/metadata/project/syncStateFiles.test.ts packages/core/metadata/appliedObjects/configuration/syncState.test.ts
git commit -m "fix: :bug: регистрировать все файлы sync state"
```

Do not add `/Users/nikita/git/round-trip/erp/.nkdk-sync.yaml` to this repository.

### Task 5: Final Report

**Files:**
- No file changes

- [ ] **Step 1: Summarize results**

Report:

```text
Готово: discovery теперь включает дочерние ресурсы из rules.ts.
ERP-сверка: missedCount 0, extraCount 0.
Проверка: pnpm test прошёл.
```

- [ ] **Step 2: Include relevant commits**

Run:

```bash
git log --oneline -5
```

Mention the implementation commits created during this plan.

---

## Self-Review

- Spec coverage: child collections, `folderName` resources, service exclusions, ERP `missedCount: 0`, and `pnpm test` are covered.
- Placeholder scan: no TBD/TODO/fill-in sections remain.
- Type consistency: plan uses existing `MetadataItemRule`, `PropertyRule`, `parseMetadataYaml`, `childCollections`, `folderName`, `forReferenceOnly`, `nkdkPath`, and `nkdkDir` names.
