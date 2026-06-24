# Remove --no-validate-metadata-targets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Полностью удалить CLI-ключ `--no-validate-metadata-targets` и внутренний обход проверки `metadataTarget`.

**Architecture:** Изменение оставляет один путь выполнения: CLI не принимает флаг, команды не передают параметр в контекст, а `metadataPath` всегда использует существующие функции разбора и форматирования `metadataTarget`. Скрипты round-trip запускают обычные `nkdk import` и `nkdk sync`, поэтому ошибки больше не скрываются диагностическим выключателем.

**Tech Stack:** TypeScript, Commander, Vitest, Bash, pnpm.

---

## File Structure

- `packages/cli/src/cli.ts`: убрать регистрацию CLI-флага и типы `opts.validateMetadataTargets`.
- `packages/cli/src/commands/import.ts`: упростить `ImportConfigurationOptions` и контекст `exportToYAML`.
- `packages/cli/src/commands/sync.ts`: упростить `SyncConfigurationOptions` и контекст `importFromYAML`.
- `packages/cli/src/commands/sync.test.ts`: удалить тест передачи выключателя и оставить проверку `referenceDir`.
- `packages/core/metadata/context/types.ts`: удалить поле `validateMetadataTargets` из YAML-контекстов.
- `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`: удалить ветку обхода проверки.
- `packages/core/metadata/commonObjects/metadataPath/toYAML.ts`: удалить ветку обхода проверки и вспомогательную проверку канонического пути, если она больше не используется.
- `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`: удалить тест диагностического выключателя.
- `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts`: удалить тест диагностического выключателя и неиспользуемый импорт `it`, если он останется.
- `.agents/skills/round-trip-yaml/round-trip.sh`: убрать текст `metadataTarget validation: disabled` и флаг из команд.
- `.agents/skills/round-trip-yaml-1c/round-trip.sh`: обновить описание, вывод и команды без флага.

### Task 1: Remove CLI Option And Command Plumbing

**Files:**
- Modify: `packages/cli/src/cli.ts`
- Modify: `packages/cli/src/commands/import.ts`
- Modify: `packages/cli/src/commands/sync.ts`
- Modify: `packages/cli/src/commands/sync.test.ts`

- [x] **Step 1: Remove the `import` CLI option**

Edit `packages/cli/src/cli.ts` so the `import` command action has no metadata-target option:

```ts
  program
    .command("import")
    .description("Импорт конфигурации из XML в YAML (XML → YAML)")
    .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
    .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
    .action((xmlDir: string, yamlDir: string) => {
      run(() => importConfiguration(xmlDir, yamlDir), options)
    })
```

- [x] **Step 2: Remove the `sync` CLI option**

In the same file, keep `--reference` and remove `--no-validate-metadata-targets`:

```ts
  program
    .command("sync")
    .description("Синхронизация конфигурации из YAML в XML (YAML → XML)")
    .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
    .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
    .option("--reference <xml-dir>", "путь к XML-каталогу для чтения reference-данных")
    .action((yamlDir: string, xmlDir: string, opts: { reference?: string }) => {
      run(() =>
        syncConfiguration(yamlDir, xmlDir, {
          referenceDir: opts.reference,
        }), options)
    })
```

- [x] **Step 3: Simplify the import command context**

Edit `packages/cli/src/commands/import.ts` to remove the option interface and default options parameter:

```ts
import { syncConfigurationFromXML } from "@nakidka/core"

export const importConfiguration = async (
  xmlDir: string,
  yamlDir: string,
): Promise<void> => {
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    fromXML: { forReference: false },
  }
  const result = await syncConfigurationFromXML({ context, inputDir: xmlDir, outputDir: yamlDir })

  for (const f of result.failed) {
    const label = f.parent ? `${f.parent}/${f.name}` : f.name
    process.stderr.write(`✖ ${f.kind} "${label}": ${f.error.message}\n`)
  }

  process.stdout.write(`Готово: ${result.succeeded} успешно, ${result.failed.length} с ошибкой\n`)

  if (result.failed.length > 0) {
    process.exitCode = 1
  }
}
```

- [x] **Step 4: Simplify the sync command context**

Edit `packages/cli/src/commands/sync.ts` so `SyncConfigurationOptions` contains only `referenceDir`, and `importFromYAML` is removed from the literal unless another field is needed:

```ts
import { syncConfigurationToXML } from "@nakidka/core"

export interface SyncConfigurationOptions {
  referenceDir?: string
}

export const syncConfiguration = async (
  yamlDir: string,
  xmlDir: string,
  options: SyncConfigurationOptions = {},
): Promise<void> => {
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: "2.20",
      context: {
        forms: [],
        templates: [],
        parentName: "",
        metadataForNumbering: [],
      },
    },
  }
  const result = await syncConfigurationToXML({
    context,
    inputDir: yamlDir,
    outputDir: xmlDir,
    ...(options.referenceDir ? { referenceDir: options.referenceDir } : {}),
  })

  for (const f of result.failed) {
    const label = f.parent ? `${f.parent}/${f.name}` : f.name
    process.stderr.write(`✖ ${f.kind} "${label}": ${f.error.message}\n`)
  }

  process.stdout.write(`Готово: ${result.succeeded} успешно, ${result.failed.length} с ошибкой\n`)

  if (result.failed.length > 0) {
    process.exitCode = 1
  }
}
```

- [x] **Step 5: Remove the obsolete sync test**

Edit `packages/cli/src/commands/sync.test.ts` and delete only this test block:

```ts
  it("передает отключение проверки metadataTarget в контекст импорта YAML", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    await syncConfiguration("yaml", "xml", { validateMetadataTargets: false })

    expect(syncConfigurationToXML).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({
        importFromYAML: expect.objectContaining({
          validateMetadataTargets: false,
        }),
      }),
    }))
  })
```

- [x] **Step 6: Run CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- src/commands/sync.test.ts
```

Expected: PASS for `sync command`.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add packages/cli/src/cli.ts packages/cli/src/commands/import.ts packages/cli/src/commands/sync.ts packages/cli/src/commands/sync.test.ts
git commit -m "refactor: :recycle: убрать cli-флаг metadataTarget"
```

### Task 2: Remove Core Metadata Validation Bypass

**Files:**
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts`

- [x] **Step 1: Remove context fields**

Edit `packages/core/metadata/context/types.ts` so these interfaces no longer contain `validateMetadataTargets` comments or properties:

```ts
export interface FormExportToYAMLContext {
  toTyped: boolean
  /** Имя родительского объекта (например, имя реквизита формы) для externalFile. */
  parent?: { name: string }
  /** Сборник внешних файлов, формируемых при экспорте. */
  externalFilesCollector?: ExternalFileEntry[]
  /** Стек текущих metadata item владельцев для owner: "this" metadataTarget. */
  metadataTargetOwners?: MetadataTargetOwnerContext[]
}

export interface FormimportFromYAMLContext {
  allElements?: FormChildItemsPartialYAML
  /** Путь к каталогу формы для чтения внешних файлов (externalFile). */
  formDir?: string
  /** Имя родительского объекта для externalFile (например, имя реквизита формы). */
  parent?: { name: string }
  /** Стек текущих metadata item владельцев для owner: "this" metadataTarget. */
  metadataTargetOwners?: MetadataTargetOwnerContext[]
}
```

- [x] **Step 2: Remove the fromYAML bypass**

Edit `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts` and make `parseMetadataTargetStringFromYAML` always call `parseMetadataTargetFromYAML`:

```ts
function parseMetadataTargetStringFromYAML(
  context: Context,
  name: string,
  constraint: MetadataTargetConstraint,
  owner: MetadataTargetOwner | undefined
): string {
  const parsed = parseMetadataTargetFromYAML(name, {
    constraint,
    owner,
    resolveOwner: (ownerName) => rootFromYAML(ownerName),
  })
  return parsed.join(".")
}
```

- [x] **Step 3: Remove the toYAML bypass**

Edit `packages/core/metadata/commonObjects/metadataPath/toYAML.ts` so `formatMetadataTargetStringToYAML` has no `context` parameter and always formats through `formatMetadataTargetToYAML`:

```ts
function formatMetadataTargetStringToYAML(
  name: string,
  constraint: MetadataTargetConstraint,
  owner?: MetadataTargetOwner,
): string {
  const parts = name.split(".")
  return formatMetadataTargetToYAML(parts, {
    constraint,
    owner,
  })
}
```

Update callers in the same file to drop `context` from the helper call:

```ts
return formatMetadataTargetStringToYAML(name, metadataTargetForRule(rule, metadataFieldTargetFallback), owner)
return formatMetadataTargetStringToYAML(name, metadataTargetForRule(rule, metadataObjectTargetFallback), owner)
return formatMetadataTargetStringToYAML(name, metadataTargetForRule(rule, metadataValueTargetFallback))
```

- [x] **Step 4: Remove unused helper code in toYAML**

If `isMetadataTargetLikeModel` becomes unused, delete the function and remove the unused `isMetadataRootName` import from `packages/core/metadata/commonObjects/metadataPath/toYAML.ts`.

- [x] **Step 5: Remove obsolete metadataPath tests**

Delete the `describe("metadataTarget diagnostics switch", ...)` blocks from:

```text
packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts
packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts
```

In `toYAML.test.ts`, change the first import if needed:

```ts
import { describe, expect, test } from "vitest"
```

- [x] **Step 6: Run metadataPath tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadataPath/fromYAML.test.ts metadataPath/toYAML.test.ts
```

Expected: PASS for both metadataPath test files.

- [ ] **Step 7: Run type check for core**

Note: command failed only on pre-existing type errors in `metadata/commonObjects/metadataValue/formChoiceList/*` and `metadata/commonObjects/сhoiceParameters/fromYAML.ts`; changed `metadataPath` files no longer appear in the diagnostics after the local fix.

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 8: Commit Task 2**

Run:

```bash
git add packages/core/metadata/context/types.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.ts packages/core/metadata/commonObjects/metadataPath/toYAML.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts
git commit -m "refactor: :recycle: сделать проверку metadataTarget обязательной"
```

### Task 3: Update Round-Trip Scripts And Final Verification

**Files:**
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`
- Modify: `.agents/skills/round-trip-yaml-1c/round-trip.sh`

- [x] **Step 1: Update round-trip-yaml status output**

Edit `.agents/skills/round-trip-yaml/round-trip.sh` and remove this line:

```bash
echo "metadataTarget validation: disabled"
```

- [x] **Step 2: Update round-trip-yaml commands**

In the same file, remove `--no-validate-metadata-targets` from both calls:

```bash
  if ! run_nkdk "${NKDK[@]}" import "${RUN_XML_DIR}" "${RUN_YAML_DIR}"; then
```

```bash
  if ! run_nkdk "${NKDK[@]}" sync "${RUN_YAML_DIR}" "${RUN_XML_TMP_DIR}" --reference "${RUN_XML_DIR}"; then
```

- [x] **Step 3: Update round-trip-yaml-1c usage text**

Edit `.agents/skills/round-trip-yaml-1c/round-trip.sh` usage text:

```text
Что делает:
  1. nkdk import <xml-dir> <yaml-dir>
  2. nkdk sync <yaml-dir> <tmp-xml-dir> без --reference
  3. очистка и создание свежей файловой базы через ibcmd infobase create
  4. ibcmd infobase config import --data <data> --db-path <db-path> <tmp-xml-dir>
```

- [x] **Step 4: Update round-trip-yaml-1c status output and command strings**

Remove:

```bash
echo "metadataTarget validation: disabled"
```

Change command text and execution:

```bash
IMPORT_COMMAND="${NKDK[*]} import ${ACTIVE_XML_DIR} ${YAML_DIR}"
if ! run_logged "import" "${IMPORT_COMMAND}" "${IMPORT_LOG}" "${NKDK[@]}" import "${ACTIVE_XML_DIR}" "${YAML_DIR}"; then
  exit 1
fi

SYNC_COMMAND="${NKDK[*]} sync ${YAML_DIR} ${TMP_XML_DIR}"
if ! run_logged "sync" "${SYNC_COMMAND}" "${SYNC_LOG}" "${NKDK[@]}" sync "${YAML_DIR}" "${TMP_XML_DIR}"; then
  exit 1
fi
```

- [x] **Step 5: Search for removed key**

Run:

```bash
rg --fixed-strings "--no-validate-metadata-targets"
```

Expected: no matches, exit code 1.

Run:

```bash
rg --fixed-strings "validateMetadataTargets"
```

Expected: no matches, exit code 1.

- [x] **Step 6: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS for `packages/core` and `packages/cli`.

- [ ] **Step 7: Commit Task 3**

Run:

```bash
git add .agents/skills/round-trip-yaml/round-trip.sh .agents/skills/round-trip-yaml-1c/round-trip.sh
git commit -m "chore: :wrench: убрать обход metadataTarget из round-trip"
```

---

## Self-Review

- Spec coverage: CLI-флаг, команды, контекст, обходы, тесты, скрипты и полный `pnpm test` покрыты задачами 1-3.
- Placeholder scan: запрещённых заглушек и ссылок на неопределённые функции нет.
- Type consistency: имя удаляемого поля везде одно и то же: `validateMetadataTargets`; CLI-ключ везде один: `--no-validate-metadata-targets`.
