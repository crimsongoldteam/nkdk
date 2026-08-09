# Partial XML Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подготовить для одного компонента `cf` или `cfe/<Имя>` потоковый ZIP только с XML-ресурсами, затронутыми после последней подтверждённой синхронизации, и отдельно предоставить внутреннюю фиксацию успешной передачи.

**Architecture:** Частичная sync переиспользует подтверждение ProjectState, компонентные профили, XML-задания и workers полной sync. Новые чистые слои определяют изменения и их влияние по ресурсной топологии; исполнитель возвращает XML-байты главному процессу, а один `ZipWriter` последовательно пишет их и внешние файлы в архив. Кандидат компонентного снимка публикуется только внутренней операцией после успешной передачи в 1С; MCP предоставляет только подготовку.

**Tech Stack:** TypeScript, Vitest, Node.js streams/Web Streams, `@zip.js/zip.js`, бинарные ProjectState и configuration-index snapshots, MCP SDK/Zod.

## Global Constraints

- Согласованный договор: `docs/superpowers/specs/2026-08-09-partial-xml-sync-design.md`.
- Сравнивать текущие хэши из `.nkdk/cache/project-state.bin` с подтверждёнными `files` из `.nkdk/components/<component>/configuration-index.bin`; не вводить третий файл хэшей.
- Общий код `resourceTopology`, `project`, `orchestration` и `validation` не знает `itemType`, XML-корни и имена каталогов `Формы`/`Макеты`. Частные правила регистрируются рядом с конкретными metadata.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей правил. Договор частичного пакета оформляется отдельным реестром поверх скомпилированной топологии.
- Не добавлять `!xml`, не менять существующие XML-фикстуры и не писать новые fromXML/toXML/fromYAML/toYAML правила.
- Не обновлять `.agents/architecture.md` и `.agents/restrictions.md` в ходе реализации без отдельного согласия разработчика; после реализации сообщить, какие разделы устарели.
- Все пути внутри ZIP нормализовать в POSIX-форму, запретить абсолютные пути, `..`, `.` и повторяющиеся имена.
- Не создавать распакованный XML-каталог и промежуточный `.zip.tmp`: писать сразу в уникальный `<package-id>.zip`, считать его готовым только после `close`, повторного чтения каталога ZIP и проверки состава.
- Ошибка на любом этапе удаляет незавершённый ZIP и ожидающее состояние. Следующая попытка повторяет подготовку от последнего опубликованного снимка.
- После каждого законченного слоя выполнять `pnpm check:duplicates -- --base 9e59fb94e`. Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm test:architecture` и повторную проверку дубликатов.

---

## Planned File Structure

### Core: новый слой частичной sync

- `packages/core/metadata/partialSyncToXml/types.ts` — публичные внутри core типы изменений, плана, результата и ожидающего состояния.
- `packages/core/metadata/partialSyncToXml/changeDetector.ts` — чистое сравнение двух наборов `{path, contentHash}`.
- `packages/core/metadata/partialSyncToXml/packagePolicy.ts` — реестр нейтральных деклараций пакета.
- `packages/core/metadata/partialSyncToXml/impactPlanner.ts` — замыкание `payload` и `loadTargets` по топологии и политикам.
- `packages/core/metadata/partialSyncToXml/archiveWriter.ts` — единственный владелец `ZipWriter`, потоковая запись и проверка ZIP.
- `packages/core/metadata/partialSyncToXml/pendingStore.ts` — хранение кандидата снимка и описания ожидающего пакета.
- `packages/core/metadata/partialSyncToXml/migrationState.ts` — компонентное состояние применённых migration и кандидат обновления.
- `packages/core/metadata/partialSyncToXml/borrowedFormValidation.ts` — запуск проверки заимствованных форм cfe.
- `packages/core/metadata/partialSyncToXml/preparePartialXmlSyncPackage.ts` — координатор подготовки.
- `packages/core/metadata/partialSyncToXml/finalizePartialXmlSyncPackage.ts` — внутренняя идемпотентная фиксация.
- `packages/core/metadata/partialSyncToXml/index.ts` — экспорт подготовки; фиксация остаётся импортом по внутреннему пути и не попадает в `packages/core/index.ts`.

### Общая инфраструктура полной и частичной sync

- `packages/core/metadata/fullSyncToXml/componentRuntime.ts` — выделенное чтение и подтверждение состояния компонента/базы.
- `packages/core/metadata/fullSyncToXml/snapshotBuilder.ts` — выделенная сборка следующего configuration-index snapshot.
- `packages/core/metadata/fullSyncToXml/types.ts` — режим назначения worker и документы результата.
- `packages/core/metadata/fullSyncToXml/binaryResult.ts` — бинарный формат результата с XML-байтами.
- `packages/core/metadata/fullSyncToXml/worker.ts` — `directory` и `memory` назначения одного преобразования.
- `packages/core/metadata/fullSyncToXml/workerPool.ts` — ограниченный обработчик пакетов результатов.
- `packages/core/metadata/projectState/contracts/dependencyValidation.ts` и бинарный read session — чтение уже сохранённых канонических ссылок одного файла.

### Частные декларации и валидатор

- `packages/core/metadata/commonObjects/childFormNames/registerPartialXmlPackage.ts` — документы формы, модуль и структурное влияние коллекции.
- `packages/core/metadata/appliedObjects/configuration/registerPartialXmlPackage.ts` — корень, клиентский интерфейс и ссылка на основной язык.
- `packages/core/metadata/forms/clientApplicationForm/baseFormCompatibility.ts` — чистый валидатор элементов базовой и расширенной форм.

### MCP

- `packages/mcp/src/contracts/preparePartialSync.ts` — вход и структурированный ответ `nkdk.prepare_partial_sync`.
- `packages/mcp/src/services/preparePartialSync.ts` — разрешение компонента, режим подтверждения записи и вызов core.
- `packages/mcp/src/tools/registerTools.ts` — регистрация только подготовки.
- `packages/mcp/src/coreApi.ts` — загрузка `preparePartialXmlSyncPackage`; фиксацию сюда не добавлять.

---

## Task 1: Expose Canonical References of One Project File

**Files:**
- Modify: `packages/core/metadata/projectState/contracts/dependencyValidation.ts`
- Modify: `packages/core/metadata/projectState/binary/readSession.ts`
- Modify: `packages/core/metadata/projectState/readSession.ts`
- Modify: `packages/core/metadata/projectState/contracts.test.ts`
- Test: `packages/core/metadata/projectState/binary/readSession.test.ts`

- [ ] **Step 1: Add a failing binary-session contract test**

Проверить, что запрос исходного файла возвращает именно сохранённые validation канонические ссылки с `yamlPath`, а для отсутствующего файла — `missing`. Тест должен использовать уже существующий построитель снимка, не новую XML-фикстуру.

```ts
const [result] = session.readFileMetadataTargetReferences([{
  requestId: "root",
  componentPath: "cf",
  projectPath: "cf/Конфигурация.yaml",
}])
expect(result).toEqual({
  requestId: "root",
  status: "found",
  references: [{
    yamlPath: ["ОсновнойЯзык"],
    canonical: "Language.Русский",
  }],
})
```

- [ ] **Step 2: Run the narrow test and confirm failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/readSession.test.ts --no-isolate`

Expected: FAIL because `readFileMetadataTargetReferences` is absent.

- [ ] **Step 3: Add the read-only query without changing snapshot format**

Add these contracts:

```ts
export interface ProjectFileMetadataTargetReferencesQuery {
  readonly requestId: string
  readonly componentPath: string
  readonly projectPath: string
}
export type ProjectFileMetadataTargetReferencesResult =
  | {
      readonly requestId: string
      readonly status: "found"
      readonly references: readonly {
        readonly yamlPath: ProjectStateYamlPath
        readonly canonical: string
      }[]
    }
  | { readonly requestId: string; readonly status: "missing" }
```

`readSession.ts` exposes the method through `ProjectStateQueryPort`; binary implementation reads `pendingReferences` for the exact file. Visibility rules are not used here: caller must name the exact component/file pair. Keep the stored binary format unchanged: `yamlPath` and канонический адрес уже присутствуют, а transient `rulePath` из validation contribution в снимок не добавляется.

- [ ] **Step 4: Run contract tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/contracts.test.ts metadata/projectState/binary/readSession.test.ts --no-isolate`

Expected: PASS.

- [ ] **Step 5: Check duplication and commit**

Run: `pnpm check:duplicates -- --base 9e59fb94e`

Commit: `feat: :sparkles: открыть канонические ссылки файла ProjectState`

## Task 2: Define Neutral Partial-Package Policies

**Files:**
- Create: `packages/core/metadata/partialSyncToXml/packagePolicy.ts`
- Test: `packages/core/metadata/partialSyncToXml/packagePolicy.test.ts`
- Create: `packages/core/metadata/commonObjects/childFormNames/partialXmlPackage.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/registerPartialXmlPackage.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/resourceTopology.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/register.ts`

- [ ] **Step 1: Write failing registry tests**

Cover duplicate registration rejection, immutable lookup by compiled declaration IDs, and absence of metadata-specific strings in the generic module.

```ts
export interface PartialXmlAssignmentPolicy {
  readonly assignmentPattern: string
  readonly loadDocumentRoles: readonly ("metadata" | "body" | "property")[]
  readonly structural?: {
    readonly includeOwnerAssignment: boolean
    readonly includeCurrentMemberSubtree: boolean
    readonly stopAtOwner: boolean
  }
  readonly companionDocuments?: readonly {
    readonly xmlPattern: string
    readonly loadTarget: boolean
  }[]
  readonly companionReferences?: readonly {
    readonly yamlPath: readonly (string | number)[]
    readonly include: "targetAssignment"
    readonly loadTarget: boolean
  }[]
}
export interface PartialXmlExternalFilePolicy {
  readonly projectPattern: string
  readonly loadTarget: boolean
}
```

Registry input uses stable topology patterns; `resolvePartialXmlPackagePolicy(topology)` compiles them once to assignment/document/external declaration IDs and fails fast when a pattern is absent or ambiguous.

- [ ] **Step 2: Run and confirm failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml/packagePolicy.test.ts --no-isolate`

Expected: FAIL because the registry does not exist.

- [ ] **Step 3: Implement registry and concrete declarations**

Register form policy next to `ChildFormNames`:

- metadata document is a `loadTarget`; body `Ext/Form.xml` is payload-only;
- exact external files, including module, are load targets;
- addition/deletion includes owner assignment and current member subtree, then stops at that owner.

Register configuration policy next to `Configuration`:

- `Configuration.xml` is payload and load target;
- `Ext/ClientApplicationInterface.xml` is an explicit payload-only companion and is not written to `load.lst`;
- `defaultLanguage` is selected through the saved canonical reference matching the explicitly declared YAML path `["ОсновнойЯзык"]`, never by parsing shortened YAML text; its metadata XML is both payload and load target;
- structural expansion stops at configuration and never selects the whole component.

- [ ] **Step 4: Add registration contract assertions**

Extend `packages/core/metadata/resourceTopology/contracts.test.ts` only with generic assertions that every registered policy resolves against the compiled topology. Put form/configuration expectations in their own registration tests.

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml/packagePolicy.test.ts metadata/resourceTopology/contracts.test.ts --no-isolate`

Expected: PASS.

- [ ] **Step 5: Check duplication and commit**

Run: `pnpm check:duplicates -- --base 9e59fb94e`

Commit: `feat: :sparkles: объявить правила частичного XML-пакета`

## Task 3: Detect Added, Changed, and Deleted Files

**Files:**
- Create: `packages/core/metadata/partialSyncToXml/types.ts`
- Create: `packages/core/metadata/partialSyncToXml/changeDetector.ts`
- Test: `packages/core/metadata/partialSyncToXml/changeDetector.test.ts`

- [ ] **Step 1: Write table-driven failing tests**

Cases: unchanged, added, changed, deleted, unsorted inputs, duplicate path rejection. Use `bigint` hashes and require UTF-8 byte order in every returned collection.

```ts
export interface PartialXmlFileVersion {
  readonly projectPath: string
  readonly contentHash: bigint
}
export interface PartialXmlChanges {
  readonly added: readonly PartialXmlFileVersion[]
  readonly changed: readonly { readonly current: PartialXmlFileVersion; readonly previous: PartialXmlFileVersion }[]
  readonly deleted: readonly PartialXmlFileVersion[]
}
```

- [ ] **Step 2: Run and confirm failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml/changeDetector.test.ts --no-isolate`

Expected: FAIL because `detectPartialXmlChanges` is absent.

- [ ] **Step 3: Implement a pure merge comparison**

No filesystem access and no metadata rules. Validate unique normalized component-relative paths, sort copies with `Buffer.compare(Buffer.from(a), Buffer.from(b))`, and walk both arrays once.

- [ ] **Step 4: Run tests and commit**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml/changeDetector.test.ts --no-isolate`

Expected: PASS.

Commit: `feat: :sparkles: определить изменения после XML-синхронизации`

## Task 4: Build Payload and load.lst Impact Plan

**Files:**
- Create: `packages/core/metadata/partialSyncToXml/impactPlanner.ts`
- Test: `packages/core/metadata/partialSyncToXml/impactPlanner.test.ts`
- Modify: `packages/core/metadata/resourceTopology/changeImpact.test.ts`
- Reuse: `packages/core/metadata/fullSyncToXml/selection.ts`

- [ ] **Step 1: Write failing impact tests from the agreed matrix**

Create synthetic topology tests for:

- changed owner properties → owner metadata XML;
- changed form YAML → form metadata + body payload, metadata load target only;
- changed/cleared module → exact `.bsl` payload and load target;
- added form → owner + current form subtree payload, owner + new form load targets;
- deleted form → owner + remaining current form subtree payload, owner load target only;
- top-level add/delete → changed object when present + root + explicit companions;
- changed path that topology neither classifies nor ignores → blocking diagnostic;
- rename → union of delete and add;
- ordinary canonical metadata reference does not expand the package;
- companion expansion terminates and deduplicates cycles.

- [ ] **Step 2: Run and confirm failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml/impactPlanner.test.ts metadata/resourceTopology/changeImpact.test.ts --no-isolate`

Expected: FAIL because the planner is absent.

- [ ] **Step 3: Implement the fixed-point planner**

```ts
export interface PartialXmlImpactPlan {
  readonly selection: XmlSyncSelection
  readonly assignmentDocumentIds: ReadonlyMap<string, ReadonlySet<string>>
  readonly externalProjectPaths: readonly string[]
  readonly loadTargets: readonly string[]
}
export function buildPartialXmlImpactPlan(params: {
  readonly topology: CompiledMetadataResourceTopology
  readonly currentResources: readonly MetadataProjectResourceMatch[]
  readonly changes: PartialXmlChanges
  readonly policies: ResolvedPartialXmlPackagePolicies
  readonly referencesFor: (sourceProjectPath: string) => readonly {
    readonly yamlPath: ProjectStateYamlPath
    readonly canonical: string
  }[]
  readonly resolveCanonicalTarget: (canonical: string) => string | undefined
}): PartialXmlImpactPlan
```

Classify deleted paths only through `resolveMetadataProjectChangeImpact(topology, path)`. Queue effects by neutral declaration IDs. Structural member operations add current descendants by matching the compiled `fileBackedTarget.itemProjectPattern`; configuration composition adds root but root policy forbids recursive component selection. Reference companions use the exact registered `yamlPath`, then the saved canonical target and ProjectState lookup. Final selection is fed to existing `buildXmlSyncPlan`; `assignmentDocumentIds` narrows generated documents afterward.

- [ ] **Step 4: Stabilize output paths**

Normalize and validate every XML path, deduplicate with sets, then sort using UTF-8 bytes. Reject collisions where two different payload sources target one ZIP name.

- [ ] **Step 5: Run tests, check duplication, commit**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml/impactPlanner.test.ts metadata/resourceTopology/changeImpact.test.ts --no-isolate`

Run: `pnpm check:duplicates -- --base 9e59fb94e`

Expected: PASS.

Commit: `feat: :sparkles: спланировать состав частичного XML-пакета`

## Task 5: Extract Shared Component Runtime and Snapshot Builder

**Files:**
- Create: `packages/core/metadata/fullSyncToXml/componentRuntime.ts`
- Create: `packages/core/metadata/fullSyncToXml/snapshotBuilder.ts`
- Create: `packages/core/metadata/fullSyncToXml/snapshotBuilder.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Test: `packages/core/metadata/fullSyncToXml/syncConfiguration.test.ts`

- [ ] **Step 1: Add characterization tests before extraction**

Cover snapshot merge for changed assignments, deleted project paths, preserved unaffected entities, updated `files`, increment of `indexGeneration` exactly once, and preserved specification/component metadata. Assert existing full sync result stays byte-equivalent for the same inputs.

- [ ] **Step 2: Run characterization tests**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/snapshotBuilder.test.ts metadata/fullSyncToXml/syncConfiguration.test.ts --no-isolate`

Expected: snapshotBuilder test FAIL; existing coordinator tests PASS.

- [ ] **Step 3: Extract without behavior changes**

Move `readProfileComponentStates`/confirmed-state assembly to `componentRuntime.ts`. Move `buildFullXmlSyncConfigurationSnapshot` and its filtering helpers to `snapshotBuilder.ts`, renaming the exported pure function to:

```ts
export function buildXmlSyncConfigurationSnapshot(params: {
  readonly previous: ConfigurationSnapshot
  readonly currentFiles: readonly ConfigurationProjectFile[]
  readonly currentLogicalAddresses: readonly ProjectLogicalAddressEntry[]
  readonly fragmentData: MergedConfigurationSnapshotFragments
}): ConfigurationSnapshot
```

Full sync calls these modules and still publishes immediately. Partial sync will build the same candidate but defer publication.

- [ ] **Step 4: Run full-sync tests and commit**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml --no-isolate`

Expected: PASS.

Commit: `refactor: :recycle: выделить общую подготовку XML-синхронизации`

## Task 6: Return Generated XML Bytes from Workers

**Files:**
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/binaryResult.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/workerPool.ts`
- Test: `packages/core/metadata/fullSyncToXml/binaryResult.test.ts`
- Test: `packages/core/metadata/fullSyncToXml/worker.test.ts`
- Test: `packages/core/metadata/fullSyncToXml/workerPool.test.ts`

- [ ] **Step 1: Write failing serialization and worker tests**

Assert that `memory` mode returns exact UTF-8 bytes and target paths without writing files; `directory` mode remains unchanged. Assert all document buffers are transferred, not cloned.

```ts
export type FullXmlSyncOutputTarget =
  | { readonly kind: "directory"; readonly outputDir: string }
  | { readonly kind: "memory"; readonly documentIdsByAssignment: Readonly<Record<string, readonly string[]>> }

export interface FullXmlSyncGeneratedDocument {
  readonly assignmentId: string
  readonly declarationId: string
  readonly targetXmlPath: string
  readonly content: Uint8Array
}
```

- [ ] **Step 2: Run and confirm failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml/binaryResult.test.ts metadata/fullSyncToXml/worker.test.ts metadata/fullSyncToXml/workerPool.test.ts --no-isolate`

Expected: FAIL because workers only accept `outputDir`.

- [ ] **Step 3: Implement binary result version 2**

Keep configuration fragment and diagnostic column buffers. Add one document metadata table and owned buffers `document:0`, `document:1`, ... . Decoder validates count, lengths, unique assignment/declaration/path tuples and releases every view through existing ownership primitives.

- [ ] **Step 4: Split serialization from destination**

`writeAssignment.ts` first serializes every finalized document once. Directory destination writes bytes; memory destination returns only allowed declaration IDs. Missing required requested documents remains an error. Do not add a second YAML→XML path.

- [ ] **Step 5: Add bounded batch consumption**

Extend pool execution:

```ts
execute(assignments, options?: {
  readonly onBatch?: (batch: FullXmlSyncExecutionBatch) => Promise<void>
  readonly maxBufferedBatches?: number
}): Promise<FullXmlSyncExecutionSummary>
```

Each worker waits until the main process has consumed its previous batch. Default directory mode keeps current summary behavior; partial sync uses `maxBufferedBatches = concurrency`.

- [ ] **Step 6: Run tests, check duplication, commit**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/fullSyncToXml --no-isolate`

Run: `pnpm check:duplicates -- --base 9e59fb94e`

Expected: PASS.

Commit: `feat: :sparkles: возвращать XML-байты из workers`

## Task 7: Stream and Verify the ZIP Archive

**Files:**
- Modify: `packages/core/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `packages/core/metadata/partialSyncToXml/archiveWriter.ts`
- Test: `packages/core/metadata/partialSyncToXml/archiveWriter.test.ts`

- [ ] **Step 1: Add zip.js dependency**

Run: `pnpm --filter @nkdk/core add @zip.js/zip.js@^2.8.34`

Expected: `packages/core/package.json` and `pnpm-lock.yaml` change only for this dependency.

- [ ] **Step 2: Write failing archive tests**

Cases: generated XML bytes, streamed external file larger than internal high-water mark, BOM-only cleared module, sorted `load.lst`, duplicate/path traversal rejection, source hash race, close error cleanup, post-close entry mismatch cleanup. Assert there is never a `.zip.tmp` or unpacked tree.

- [ ] **Step 3: Run and confirm failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml/archiveWriter.test.ts --no-isolate`

Expected: FAIL because writer is absent.

- [ ] **Step 4: Implement one-owner streaming writer**

```ts
export interface PartialXmlArchiveWriter {
  addGenerated(document: FullXmlSyncGeneratedDocument): Promise<void>
  addExternal(file: FullXmlSyncExternalFile): Promise<void>
  close(loadTargets: readonly string[]): Promise<{
    readonly archiveHash: bigint
    readonly entries: readonly string[]
  }>
  abort(): Promise<void>
}
```

Open final unique path with exclusive creation. Wrap Node writable/readable streams with `Writable.toWeb`/`Readable.toWeb` adapters accepted by zip.js. Hash external bytes during streaming and compare with current ProjectState expected hash. `load.lst` is UTF-8, one sorted `/` path per line, with terminal newline for non-empty content. After `ZipWriter.close()`, reopen through `ZipReader`, compare exact normalized entry names and compute archive xxh3 by streaming the finished file. Any error destroys handles and deletes that exact archive path.

- [ ] **Step 5: Run tests, check duplication, commit**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml/archiveWriter.test.ts --no-isolate`

Run: `pnpm check:duplicates -- --base 9e59fb94e`

Expected: PASS.

Commit: `feat: :package: записывать частичный XML-пакет потоком`

## Task 8: Persist Pending Package and Finalize Internally

**Files:**
- Create: `packages/core/metadata/partialSyncToXml/pendingStore.ts`
- Create: `packages/core/metadata/partialSyncToXml/finalizePartialXmlSyncPackage.ts`
- Test: `packages/core/metadata/partialSyncToXml/pendingStore.test.ts`
- Test: `packages/core/metadata/partialSyncToXml/finalizePartialXmlSyncPackage.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Test: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Test: `packages/core/metadata/fullSyncToXml/syncConfiguration.test.ts`

- [ ] **Step 1: Write failing crash-safety tests**

Cover replacement of previous pending package, orphan ZIP cleanup, candidate-before-manifest publication, exact source snapshot verification, archive hash verification, successful publication/deletion, changed YAML after prepare, crash after index publication, repeated finalize, rejection of another package ID, and preservation of pending state after every failed finalize check.

- [ ] **Step 2: Fix the on-disk contract**

Use:

```text
.nkdk/components/<component>/partial-sync/pending.json
.nkdk/components/<component>/partial-sync/candidate-configuration-index.bin
.nkdk/tmp/incremental-sync/<component>/<package-id>.zip
```

```ts
export interface PendingPartialXmlSyncStateV1 {
  readonly version: 1
  readonly packageId: string
  readonly componentPath: string
  readonly archiveProjectPath: string
  readonly archiveHash: string
  readonly sourceSnapshotHash: string
  readonly sourceSnapshotGeneration: string
  readonly candidateSnapshotHash: string
  readonly baseSnapshotHash?: string
  readonly baseSnapshotGeneration?: string
  readonly candidateAppliedMigrations: readonly string[]
}
```

All hashes are lowercase 16-digit xxh3 hex. Paths in JSON are project-relative POSIX paths.

- [ ] **Step 3: Implement publication order**

Preparation cleanup removes only paths named by a validated pending manifest plus orphan `.zip` files in the exact component temporary directory. Write candidate bytes first with existing atomic file helper, then `pending.json` last. Do not modify the published index.

- [ ] **Step 4: Implement internal idempotent finalize**

```ts
export async function finalizePartialXmlSyncPackage(params: {
  readonly projectDir: string
  readonly componentPath: string
  readonly packageId: string
}): Promise<{ readonly status: "published" | "alreadyPublished" }>
```

Before publication verify pending identity, current published source snapshot generation/hash, candidate hash, base snapshot identity when present, and archive hash. Publish candidate with `writeConfigurationIndex`, then migration state, then delete ZIP and pending files. If the candidate is already the published snapshot after a crash, finish cleanup and return `alreadyPublished`. This function is not exported from `packages/core/index.ts` and is not referenced by MCP.

- [ ] **Step 5: Run tests and commit**

Before the run, add a shared read-only `assertNoPendingPartialXmlSync(projectDir, componentPath)` preflight to import and full sync. It fails before creating/changing output when `pending.json` exists for that component. Preparation itself bypasses this guard only through its explicit replacement path; validation and other read-only operations do not call the guard.

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml/pendingStore.test.ts metadata/partialSyncToXml/finalizePartialXmlSyncPackage.test.ts metadata/importFromXml/importConfiguration.test.ts metadata/fullSyncToXml/syncConfiguration.test.ts --no-isolate`

Expected: PASS.

Commit: `feat: :white_check_mark: отложить фиксацию частичной синхронизации`

## Task 9: Carry Verified Migration Identity into the Candidate

**Files:**
- Create: `packages/core/metadata/partialSyncToXml/migrationState.ts`
- Test: `packages/core/metadata/partialSyncToXml/migrationState.test.ts`
- Modify: `packages/core/metadata/operations/migrationChain.ts`
- Test: `packages/core/metadata/operations/migrationChain.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/componentProfile.ts`

- [ ] **Step 1: Write failing migration-state tests**

Cover no state file, already applied migration, valid rename old→new, duplicate/conflicting rename rejection, candidate names without immediate write, and publication only from finalize.

- [ ] **Step 2: Extract migration evaluation from XML directory state**

Refactor `migrationChain.ts` so existing callers can still load their files, while partial sync calls a pure function:

```ts
export function evaluateMigrationChain(params: {
  readonly migrations: readonly MetadataMigration[]
  readonly appliedNames: ReadonlySet<string>
}): {
  readonly pending: readonly MetadataMigration[]
  readonly referencePathByCurrentPath: ReadonlyMap<string, string>
  readonly candidateAppliedNames: readonly string[]
}
```

No rename inference from equal hashes is allowed.

- [ ] **Step 3: Add component-local applied state**

Read `.nkdk/components/<component>/applied-migrations.yaml`; absence means empty. Preparation only places sorted candidate names into pending state. Finalize atomically publishes them after candidate index publication.

- [ ] **Step 4: Feed identity mapping to workers**

Extend the existing component-profile runtime input with `referencePathByCurrentPath`. Use it only when selecting prior configuration-index identity for the new project path; current bytes and current logical address remain authoritative.

- [ ] **Step 5: Run tests, check duplication, commit**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/operations/migrationChain.test.ts metadata/partialSyncToXml/migrationState.test.ts metadata/fullSyncToXml --no-isolate`

Run: `pnpm check:duplicates -- --base 9e59fb94e`

Expected: PASS.

Commit: `feat: :truck: сохранить идентичность переименованных metadata`

## Task 10: Validate Borrowed Extension Forms

**Files:**
- Create: `packages/core/metadata/forms/clientApplicationForm/baseFormCompatibility.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts`
- Create: `packages/core/metadata/partialSyncToXml/borrowedFormValidation.ts`
- Test: `packages/core/metadata/partialSyncToXml/borrowedFormValidation.test.ts`
- Reuse: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts`

- [ ] **Step 1: Write failing pure validator tests**

Cases: equal trees, extension adds element, base adds nested element missing in extension, duplicate/unnamed entries, diagnostic path. Required error points to extension form file and names the missing base element.

```ts
export function validateBaseFormCompatibility(params: {
  readonly base: unknown
  readonly extension: unknown
  readonly extensionFilePath: string
}): readonly Diagnostic[]
```

- [ ] **Step 2: Run and confirm failure**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts --no-isolate`

Expected: FAIL because validator is absent.

- [ ] **Step 3: Implement recursive element comparison**

Use the current form model shape and stable element identity already used by `ClientApplicationForm` rules. Every base element identity must exist in the extension tree; extra extension elements are allowed. Do not add a dependency fingerprint to either snapshot.

- [ ] **Step 4: Integrate with confirmed cfe profile**

`borrowedFormValidation.ts` gets adopted form addresses from `configurationExtensionFullXmlSyncProfile.confirm(...)`, reads both current YAML files using their ProjectState expected hashes, prepares them through the same YAML path as worker, and calls the pure validator. Visibility is exactly selected cfe then cf; sibling cfe is never queried. Run this preflight for all borrowed forms even when the cfe form hash itself did not change.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts metadata/partialSyncToXml/borrowedFormValidation.test.ts --no-isolate`

Expected: PASS.

Commit: `feat: :shield: проверить заимствованные формы расширения`

## Task 11: Coordinate Partial Package Preparation

**Files:**
- Create: `packages/core/metadata/partialSyncToXml/preparePartialXmlSyncPackage.ts`
- Test: `packages/core/metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts`
- Create: `packages/core/metadata/partialSyncToXml/index.ts`
- Modify: `packages/core/index.ts`

- [ ] **Step 1: Write failing coordinator tests with injected boundaries**

Cover:

- missing/incompatible component snapshot → error, no full-sync fallback;
- validation error → no ZIP;
- empty diff and no pending migration → `status: "unchanged"`, no pending state;
- empty file diff with a verified pending migration still builds a package/candidate;
- current-vs-baseline hash selection uses the two specified files;
- changed form/module, form add/delete, top-level add/delete;
- cfe reads own state then cf and ignores cf-only changes for package selection;
- worker source race → cleanup;
- archive close/verification failure → cleanup;
- new prepare replaces pending package and starts from published snapshot;
- success writes candidate/pending but leaves published snapshot untouched.

- [ ] **Step 2: Fix the core API**

```ts
export interface PreparePartialXmlSyncPackageParams {
  readonly context: ConfigurationContext
  readonly projectDir: string
  readonly componentPath: string
  readonly concurrency?: number
  readonly projectState: ProjectStateService
}
export type PreparePartialXmlSyncPackageResult =
  | { readonly ok: true; readonly status: "unchanged"; readonly diagnostics: readonly Diagnostic[] }
  | {
      readonly ok: true
      readonly status: "prepared"
      readonly packageId: string
      readonly archivePath: string
      readonly archiveHash: string
      readonly entries: readonly string[]
      readonly loadTargets: readonly string[]
      readonly diagnostics: readonly Diagnostic[]
    }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[] }
```

- [ ] **Step 3: Implement orchestration in this exact order**

1. Resolve/normalize project and component paths.
2. Remove validated prior pending state and orphan ZIPs for this component.
3. Run existing Project refresh/validation stages Б1–Б6 and obtain a read token.
4. Read and confirm target snapshot; for cfe confirm current cf base snapshot too.
5. Read current component hash projection and baseline snapshot `files`; detect changes.
6. Evaluate pending migration chain and join delete/add impact for verified renames.
7. Run borrowed-form validation for cfe; stop on errors.
8. Read saved file references required by registered companion policies and resolve canonical targets through ProjectState.
9. Build impact plan, then the common XML selection plan.
10. Create exclusive ZIP writer and memory-mode worker pool.
11. Consume generated batches into the one ZipWriter with bounded backpressure; stream external files after generated outputs.
12. Add `load.lst`, close and verify archive.
13. Build candidate configuration snapshot from the worker fragment and complete current file projection.
14. Persist candidate bytes and pending manifest; return the prepared result.

If no changes exist, return before creating workers or ZIP. Use one `try/finally` cleanup owner so a result is never returned with half-written state.

- [ ] **Step 4: Export only preparation publicly**

Export `preparePartialXmlSyncPackage` from core’s public index for MCP loading. Do not export `finalizePartialXmlSyncPackage` there; future full-cycle NKDK code will import it from the internal module when the 1C stage is implemented.

- [ ] **Step 5: Run core partial/full tests and commit**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml metadata/fullSyncToXml --no-isolate`

Run: `pnpm check:duplicates -- --base 9e59fb94e`

Expected: PASS.

Commit: `feat: :package: подготовить частичный XML-пакет`

## Task 12: Add the Public MCP Prepare Operation

**Files:**
- Create: `packages/mcp/src/contracts/preparePartialSync.ts`
- Create: `packages/mcp/src/services/preparePartialSync.ts`
- Test: `packages/mcp/src/services/preparePartialSync.test.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `packages/mcp/src/guides/index.ts`
- Modify: `packages/mcp/src/prompts/index.ts`
- Test: `packages/mcp/src/prompts/index.test.ts`

- [ ] **Step 1: Write failing service and registration tests**

Assert component normalization, `cfe` without name rejection, dry confirmation behavior, write invocation, structured diagnostics, and that no finalize/confirm/discard MCP tool exists.

- [ ] **Step 2: Define the contract**

```ts
export const preparePartialSyncInputShape = {
  projectDir: z.string().min(1),
  componentPath: z.string().min(1).optional(),
  concurrency: z.number().int().positive().optional(),
  allowWrite: z.boolean().optional(),
}
```

When `allowWrite !== true`, return a confirmation-required plan describing component and destination root without mutating state. There is no `ignoreValidationErrors`: partial package creation is blocked by validation errors. With `allowWrite: true`, call core and return `status`, package path/hash, entry/load-target counts and the standard diagnostic report.

- [ ] **Step 3: Implement and register one MCP tool**

Register `nkdk.prepare_partial_sync`. Add its preparation function to dynamic `CoreApi`. Do not add public operations named `finalize`, `confirm`, `discard`, or equivalents. Guides must state that 1C transfer and internal fixation are outside this stage.

- [ ] **Step 4: Run MCP tests and commit**

Run: `pnpm --filter @nkdk/mcp exec vitest run src/services/preparePartialSync.test.ts src/tools/registerTools.test.ts src/prompts/index.test.ts --no-isolate`

Expected: PASS.

Commit: `feat: :sparkles: открыть подготовку частичного пакета в MCP`

## Task 13: Add End-to-End Package Matrix Tests

**Files:**
- Create: `packages/core/metadata/partialSyncToXml/preparePartialXmlSyncPackage.integration.test.ts`
- Create: `packages/core/metadata/partialSyncToXml/__fixtures__/projectFactory.ts`
- Reuse read-only samples: `/Users/nikita/git/nkdk_service/edt_changes`

- [ ] **Step 1: Build generated project fixtures, not copied XML truth fixtures**

`projectFactory.ts` writes minimal YAML projects and baseline binary snapshots inside each test temp directory. Do not modify or copy existing XML fixtures. EDT samples are read-only evidence for expected entry/load matrices.

- [ ] **Step 2: Add cf scenarios**

Table cases: object property, form property, module edit, BOM-only module clear, non-default form add, second analogous form add, form delete, top-level object add/delete, verified rename. Open the resulting ZIP through zip.js and assert exact entry names and exact `load.lst`. For every generated XML entry, run a fresh full sync of the same project state into a separate temporary directory and assert byte-for-byte equality with the corresponding file; for external files compare ZIP bytes with current source bytes.

- [ ] **Step 3: Add cfe scenarios**

Cases: own change package; unchanged cfe with changed cf produces `unchanged`; borrowed form compatible; borrowed form missing new base element blocks package; sibling cfe target is invisible.

- [ ] **Step 4: Add lifecycle scenarios**

Prepare → published snapshot unchanged; simulated successful transfer → internal finalize → snapshot updated and ZIP deleted; failure before finalize → next prepare deletes previous ZIP/state and rebuilds from the same published baseline.

- [ ] **Step 5: Run integration tests, check duplication, commit**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml/preparePartialXmlSyncPackage.integration.test.ts --no-isolate`

Run: `pnpm check:duplicates -- --base 9e59fb94e`

Expected: PASS.

Commit: `test: :white_check_mark: покрыть матрицу частичной XML-синхронизации`

## Task 14: Final Verification and Documentation Audit

**Files:**
- Verify: `docs/superpowers/specs/2026-08-09-partial-xml-sync-design.md`
- Do not modify without approval: `.agents/architecture.md`, `.agents/restrictions.md`

- [ ] **Step 1: Run focused tests once more**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/partialSyncToXml metadata/fullSyncToXml metadata/forms/clientApplicationForm/baseFormCompatibility.test.ts --no-isolate`

Run: `pnpm --filter @nkdk/mcp exec vitest run src/services/preparePartialSync.test.ts src/tools/registerTools.test.ts --no-isolate`

Expected: PASS.

- [ ] **Step 2: Run mandatory project verification**

Run: `pnpm type-check`

Run: `pnpm test`

Run: `pnpm test:architecture`

Run: `pnpm check:duplicates -- --base 9e59fb94e`

Expected: all commands PASS. If a duration budget fails on a cold run while assertions pass, rerun the exact failing test once warm and report both outputs; do not silently raise timing limits.

- [ ] **Step 3: Audit the implementation against every spec section**

Verify explicitly: two hash sources; no dependency fingerprint; canonical shortened-reference handling; separate payload/load targets; form/module/top-level matrix; cfe visibility; mandatory borrowed-form validator; direct streaming ZIP; one pending package; separate non-MCP finalize; restart from published baseline after failure.

- [ ] **Step 4: Report architecture documentation drift**

List the exact paragraphs in `.agents/architecture.md` and `.agents/restrictions.md` that now say partial sync is absent or full-only. Ask for permission before updating them in a separate documentation change.

- [ ] **Step 5: Commit any verification-only adjustments**

If no code changed, do not create an empty commit. If narrow test/performance adjustments were required, commit them as:

`test: :white_check_mark: завершить проверку частичной XML-синхронизации`
