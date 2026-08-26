# Shared XML Reconstruction Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Построить один точный профиль восстановления XML для всего импортируемого компонента и переиспользовать его в импорте, полной и частичной синхронизации, устранив 319 лишних `!xml/raw` в e2e YAML.

**Architecture:** Чистый общий построитель получает уже прочитанные логические адреса и локальные читатели индексов, материализует `full`, `adopted` или `indexed` для каждого адреса и возвращает UUID заимствованных объектов. Операции сами читают LMDB и ProjectState, после чего передают неизменяемый профиль всем воркерам; контрольный экспорт больше не читает исходный XML ради UUID.

**Tech Stack:** TypeScript 7, Vitest 4, LMDB configuration index, ProjectState, Piscina worker protocol, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-26-shared-xml-reconstruction-profile-design.md`

## Global Constraints

- Исходный коммит для проверок дублей: `7b4292075`.
- Не изменять существующие XML-фикстуры: они являются источником истины.
- Проверять только e2e; каталог `cf/doc` не использовать.
- Совместимость со старым корневым профилем импорта не нужна.
- Не добавлять правила `fromXML`, `toXML`, `fromYAML` или `toYAML` и не расширять `PropertyRule`, `BasePropertyRule` или параметры построителей правил.
- Не использовать `!xml` для обхода неполного профиля или resolver.
- Общий построитель не открывает LMDB, не читает XML/YAML и не зависит от `importFromXml`, `fullSyncToXml` или `partialSyncToXml`.
- Профиль строится один раз на компонент за `O(n + m)`; внутри задания повторное построение и линейный поиск по базовому индексу запрещены.
- Реализацию выполнять последовательно без субагентов; после реализации провести отдельное ревью в субагенте и сверить результат со спецификацией и этим планом.
- После тестов удалить созданные временные каталоги и `reports/e2e`.
- После каждого законченного слоя выполнить `pnpm duplicates -- --base 7b4292075`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm test:e2e`, `pnpm test:architecture:rules` и `pnpm test:architecture`.

---

## File Structure

- Create: `packages/rules/metadata/project/xmlReconstructionProfile.ts` — чистые типы и построение точного профиля по двум индексам.
- Create: `packages/rules/metadata/project/xmlReconstructionProfile.test.ts` — быстрые unit-договоры `full`/`adopted`/`indexed`, UUID, канонизации и конфликтов.
- Create: `packages/rules/metadata/project/componentState/logicalAddresses.ts` — общий сбор корневых и вложенных логических адресов из ProjectState.
- Modify: `packages/rules/metadata/project/componentState/indexes.ts` — переиспользование общего сборщика полной синхронизацией.
- Modify: `packages/rules/metadata/project/componentState/indexes.integration.test.ts` — договор сборщика адресов без изменения результата существующего индекса.
- Create: `packages/rules/metadata/importFromXml/reconstructionProfile.ts` — чтение источников профиля для импорта; IO остаётся на границе операции.
- Create: `packages/rules/metadata/importFromXml/reconstructionProfile.test.ts` — подготовка профиля импорта с подменёнными ProjectState/LMDB-портами.
- Modify: `packages/rules/metadata/fullSyncToXml/componentProfile.ts` — композиция полного worker-профиля с общим профилем.
- Modify: `packages/rules/metadata/fullSyncToXml/profiles/configuration.ts` — делегирование общей классификации конфигурации.
- Modify: `packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.ts` — делегирование классификации расширения; `borrowedForms` и `baseForms` остаются локальными.
- Modify: `packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.test.ts` — сохранение экспортных договоров после выделения построителя.
- Modify: `packages/rules/metadata/workerPool/importContracts.ts` — сериализуемый профиль в `beginSecondPass`.
- Modify: `packages/rules/metadata/importFromXml/workerPool.ts` — один профиль для всех активных воркеров второго прохода.
- Modify: `packages/rules/metadata/importFromXml/worker.ts` — хранение профиля второго прохода и передача proof.
- Modify: `packages/rules/metadata/importFromXml/controlExport.ts` — использование переданного профиля и удаление `readAdoptedUuid`.
- Modify: `packages/rules/metadata/importFromXml/controlExport.integration.test.ts` — proof получает UUID/варианты без чтения корневого XML.
- Modify: `packages/rules/metadata/importFromXml/workerPool.integration.test.ts` — профиль передаётся каждому worker один раз в `beginSecondPass`.
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts` — worker применяет один профиль ко всем заданиям.
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.ts` — построение профиля после фиксации рабочего индекса и до второго прохода.
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.integration.test.ts` — построитель вызывается один раз и ошибка подготовки отменяет import.
- Modify: `packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts` — заимствованный вложенный объект импортируется без служебного raw.
- Modify: `e2e/fixtures/nkdk/**/*.yaml` — канонический результат повторного e2e-импорта; XML не меняется.

---

### Task 1: Чистый построитель профиля восстановления XML

**Files:**
- Create: `packages/rules/metadata/project/xmlReconstructionProfile.ts`
- Create: `packages/rules/metadata/project/xmlReconstructionProfile.test.ts`

**Interfaces:**
- Consumes: `LocalConfigurationIndexReader`, `XMLDefaultVariant`, `formatCanonicalMetadataTargetToYAML`.
- Produces:

```ts
export type XmlReconstructionComponentKind = "configuration" | "configurationExtension"

export interface XmlReconstructionProfileIndex {
  readonly logicalAddresses: readonly string[]
  readonly index: Pick<LocalConfigurationIndexReader, "entity" | "entities">
}

export interface XmlComponentReconstructionProfile {
  readonly componentKind: XmlReconstructionComponentKind
  readonly adoptedUuids: Readonly<Record<string, string>>
  readonly xmlDefaultVariantByLogicalAddress: Readonly<Record<string, XMLDefaultVariant>>
}

export interface XmlComponentExportProfile extends XmlComponentReconstructionProfile {
  readonly typeDescriptionXMLNameByType?: Readonly<Record<string, string>>
}

export function buildXmlComponentReconstructionProfile(
  params:
    | { readonly componentKind: "configuration"; readonly target: XmlReconstructionProfileIndex }
    | {
        readonly componentKind: "configurationExtension"
        readonly target: XmlReconstructionProfileIndex
        readonly base: XmlReconstructionProfileIndex
      },
): XmlComponentReconstructionProfile
```

- [ ] **Step 1: Write failing unit tests for exact configuration variants**

Add helpers that create `LocalConfigurationIndexReader` from in-memory blocks, then assert that an indexed parent is deliberately materialized for its child while an unrelated object is `full`:

```ts
it("materializes indexed and full variants for every configuration address", () => {
  const profile = buildXmlComponentReconstructionProfile({
    componentKind: "configuration",
    target: source(
      [
        "ПланВидовХарактеристик.ВидыСвойств",
        "ПланВидовХарактеристик.ВидыСвойств.Характеристики[0].ПолеПутиКДанным",
        "Справочник.Товары",
      ],
      [{
        logicalAddress: "ПланВидовХарактеристик.ВидыСвойств",
        uuid: "11111111-1111-4111-8111-111111111111",
      }],
    ),
  })

  expect(profile.xmlDefaultVariantByLogicalAddress).toEqual({
    "ПланВидовХарактеристик.ВидыСвойств": "indexed",
    "ПланВидовХарактеристик.ВидыСвойств.Характеристики[0].ПолеПутиКДанным": "indexed",
    "Справочник.Товары": "full",
  })
})
```

- [ ] **Step 2: Run the configuration test and verify the expected failure**

Run:

```bash
pnpm exec vitest run --no-isolate --project core-metadata metadata/project/xmlReconstructionProfile.test.ts
```

Expected: FAIL because `buildXmlComponentReconstructionProfile` does not exist.

- [ ] **Step 3: Write failing extension tests for borrowed, own and root objects**

Cover one localized nested address and the own-child-under-borrowed-parent regression:

```ts
it("assigns exact adopted and full variants in an extension", () => {
  const borrowed = "Catalog.Товары.Attribute.Артикул"
  const own = "Catalog.Товары.Attribute.Собственный"
  const profile = buildXmlComponentReconstructionProfile({
    componentKind: "configurationExtension",
    target: source(
      ["Конфигурация", "Catalog.Товары", borrowed, own],
      [
        { logicalAddress: "Конфигурация", uuid: EXTENSION_UUID },
        { logicalAddress: borrowed, uuid: EXTENSION_ATTRIBUTE_UUID },
      ],
    ),
    base: source(
      ["Конфигурация", "Catalog.Товары", borrowed],
      [
        { logicalAddress: "Конфигурация", uuid: BASE_CONFIGURATION_UUID },
        { logicalAddress: borrowed, uuid: BASE_ATTRIBUTE_UUID },
      ],
    ),
  })

  expect(profile.xmlDefaultVariantByLogicalAddress).toEqual({
    Конфигурация: "adopted",
    "Справочник.Товары": "adopted",
    "Справочник.Товары.Реквизит.Артикул": "adopted",
    "Справочник.Товары.Реквизит.Собственный": "full",
  })
  expect(profile.adoptedUuids).toMatchObject({
    Конфигурация: BASE_CONFIGURATION_UUID,
    "Справочник.Товары.Реквизит.Артикул": BASE_ATTRIBUTE_UUID,
  })
})
```

Also add exact tests:

```ts
it("rejects a borrowed UUID-bearing object without a base UUID", () => {
  expect(() => buildXmlComponentReconstructionProfile({
    componentKind: "configurationExtension",
    target: source(
      ["Конфигурация", "Catalog.Товары"],
      [
        { logicalAddress: "Конфигурация", uuid: EXTENSION_CONFIGURATION_UUID },
        { logicalAddress: "Catalog.Товары", uuid: EXTENSION_UUID },
      ],
    ),
    base: source(
      ["Конфигурация", "Catalog.Товары"],
      [{ logicalAddress: "Конфигурация", uuid: BASE_CONFIGURATION_UUID }],
    ),
  })).toThrow("Не найден UUID основной конфигурации: Справочник.Товары")
})

it("allows an addressable form element that has no UUID entity", () => {
  expect(buildXmlComponentReconstructionProfile({
    componentKind: "configurationExtension",
    target: source(
      ["Конфигурация", "Catalog.Товары.Form.Форма.Element.Группа"],
      [{ logicalAddress: "Конфигурация", uuid: EXTENSION_CONFIGURATION_UUID }],
    ),
    base: source(
      ["Конфигурация", "Catalog.Товары.Form.Форма.Element.Группа"],
      [{ logicalAddress: "Конфигурация", uuid: BASE_CONFIGURATION_UUID }],
    ),
  }).xmlDefaultVariantByLogicalAddress).toEqual({
    "Справочник.Товары.Форма.Форма.Элемент.Группа": "adopted",
    Конфигурация: "adopted",
  })
})
```

Cover a collision where two source addresses normalize to one worker address
but resolve to different base UUIDs:

```ts
it("rejects conflicting UUIDs after address canonicalization", () => {
  expect(() => buildXmlComponentReconstructionProfile({
    componentKind: "configurationExtension",
    target: source(
      ["Конфигурация", "Catalog.Товары", "Справочник.Товары"],
      [
        { logicalAddress: "Конфигурация", uuid: EXTENSION_CONFIGURATION_UUID },
        { logicalAddress: "Catalog.Товары", uuid: EXTENSION_UUID },
      ],
    ),
    base: source(
      ["Конфигурация", "Catalog.Товары", "Справочник.Товары"],
      [
        { logicalAddress: "Конфигурация", uuid: BASE_CONFIGURATION_UUID },
        { logicalAddress: "Catalog.Товары", uuid: BASE_CATALOG_UUID },
        { logicalAddress: "Справочник.Товары", uuid: OTHER_BASE_CATALOG_UUID },
      ],
    ),
  })).toThrow("Противоречивые UUID: Справочник.Товары")
})
```

- [ ] **Step 4: Implement the minimal pure builder**

Implement these private operations in `project/xmlReconstructionProfile.ts`:

```ts
const workerAddress = (logicalAddress: string): string =>
  formatCanonicalMetadataTargetToYAML(logicalAddress) ?? logicalAddress

const targetAddresses = unique(params.target.logicalAddresses)
const baseAddresses = params.componentKind === "configurationExtension"
  ? new Set(params.base.logicalAddresses)
  : new Set<string>()
```

For `configuration`, canonicalize identifier-bearing entities once, then walk only the dot-separated ancestors of each target address to materialize `indexed`; otherwise write `full`.

For `configurationExtension`, create raw and canonical base-address sets once. Each target address gets `adopted` when either set contains it and otherwise gets `full`. Resolve UUID through `base.index.entity(rawAddress) ?? base.index.entity(workerAddress)`. Require it for `Конфигурация` and for an adopted target whose target index entity contains `uuid`. Add `Конфигурация: adopted` even when the target list omitted the root.

Use one setter for variants and one for UUIDs; allow an identical repeated value and reject a conflicting value:

```ts
function setExact<T extends string>(
  target: Record<string, T>,
  logicalAddress: string,
  value: T,
  label: string,
): void {
  const previous = target[logicalAddress]
  if (previous !== undefined && previous !== value) {
    throw new Error(`${label}: ${logicalAddress}: ${previous} / ${value}`)
  }
  target[logicalAddress] = value
}
```

Freeze the returned top-level object and both records.

- [ ] **Step 5: Run unit tests and type-check the package**

Run:

```bash
pnpm exec vitest run --no-isolate --project core-metadata metadata/project/xmlReconstructionProfile.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 7b4292075
```

Expected: all commands PASS; the unit test remains below the 50 ms test-case limit.

- [ ] **Step 6: Commit the shared builder**

```bash
git add packages/rules/metadata/project/xmlReconstructionProfile.ts packages/rules/metadata/project/xmlReconstructionProfile.test.ts
git commit -m "feat: :sparkles: добавить профиль восстановления XML"
```

---

### Task 2: Перевести полную и частичную синхронизацию на общий построитель

**Files:**
- Modify: `packages/rules/metadata/fullSyncToXml/componentProfile.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/profiles/configuration.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.test.ts`

**Interfaces:**
- Consumes: `buildXmlComponentReconstructionProfile`, `XmlComponentReconstructionProfile`, `XmlComponentExportProfile` from Task 1.
- Produces: `FullXmlSyncWorkerProfileRuntime` remains the worker contract and contains the exact shared profile plus sync-only fields.

- [ ] **Step 1: Strengthen existing profile tests before refactoring**

Extend the existing configuration test so it expects a `full` entry for the non-indexed child/object instead of a sparse map. Keep the current extension test for borrowed and own nested objects and add a target entity with UUID to the missing-base-UUID case:

```ts
expect(runtime.workerProfile.xmlDefaultVariantByLogicalAddress).toEqual({
  [existing]: "indexed",
  [`${existing}.Характеристики[0].ПолеПутиКДанным`]: "indexed",
  "Справочник.Товары": "full",
})
```

Keep all assertions for `borrowedForms`, `baseForms`, `typeDescriptionXMLNameByType` and snapshot consistency unchanged.

- [ ] **Step 2: Run the profile tests and verify the new exact-map assertion fails**

Run:

```bash
pnpm exec vitest run --no-isolate --project core-metadata metadata/fullSyncToXml/profiles/configurationExtension.test.ts metadata/fullSyncToXml/prepareProfileRuntime.test.ts
```

Expected: FAIL because `configuration` still returns a sparse `indexed` map.

- [ ] **Step 3: Compose the full worker profile with the shared profile**

Change `FullXmlSyncWorkerProfileRuntime` to extend the shared contract while preserving sync-only data:

```ts
export interface FullXmlSyncWorkerProfileRuntime extends XmlComponentExportProfile {
  readonly kind: XmlSyncProfileKind
  readonly referencePathByCurrentPath?: ReadonlyMap<string, string>
  readonly baseForms?: {
    readonly componentDir: string
    readonly projectFiles: readonly ConfigurationProjectFile[]
    readonly targetProjectFiles?: readonly ConfigurationProjectFile[]
    readonly snapshot: ConfigurationIndexStoreDescriptor
  }
}
```

Keep `XmlSyncProfileKind` as the synchronization registry discriminator.

- [ ] **Step 4: Delegate configuration classification**

Replace the local `indexedItems` construction in `profiles/configuration.ts` with:

```ts
const reconstruction = buildXmlComponentReconstructionProfile({
  componentKind: "configuration",
  target: {
    logicalAddresses: target.indexes.logicalAddresses.map(({ logicalAddress }) => logicalAddress),
    index: reader,
  },
})

return {
  kind: "configuration",
  target,
  workerProfile: { kind: "configuration", ...reconstruction },
}
```

- [ ] **Step 5: Delegate extension classification without moving sync-only work**

Read both target and base local indexes once in `confirmConfigurationExtensionFullXmlSync`; pass both to `confirmedRuntime`. Replace local construction of `adoptedUuids` and `xmlDefaultVariantByLogicalAddress` with:

```ts
const reconstruction = buildXmlComponentReconstructionProfile({
  componentKind: "configurationExtension",
  target: {
    logicalAddresses: target.indexes.logicalAddresses.map(({ logicalAddress }) => logicalAddress),
    index: targetReader,
  },
  base: {
    logicalAddresses: base.indexes.logicalAddresses.map(({ logicalAddress }) => logicalAddress),
    index: baseReader,
  },
})
```

Keep these responsibilities in `profiles/configurationExtension.ts`:

```ts
assertEqualProjectFiles(
  base.hashes.projectFiles,
  base.snapshot.projectFiles,
  "основная конфигурация не синхронизирована",
)

const baseForms = {
  componentDir: base.structure.componentDir,
  projectFiles: base.hashes.projectFiles,
  targetProjectFiles: target.hashes.projectFiles,
  snapshot: base.snapshot.descriptor,
}
```

Leave the existing `baseProjectPathByLogicalAddress`, `extensionFormPaths`,
`extensionFormResourceByPath`, `borrowedForms` and `savedBaseFormPath`
calculations in this file; they use project paths and snapshots and therefore
do not belong to the shared reconstruction builder.

Construct the worker profile as `{ kind: "configurationExtension", ...reconstruction, baseForms }`; do not reintroduce variant overrides for forms.

- [ ] **Step 6: Run synchronization regressions**

Run:

```bash
pnpm exec vitest run --no-isolate --project core-metadata metadata/fullSyncToXml/profiles/configurationExtension.test.ts metadata/fullSyncToXml/prepareProfileRuntime.test.ts metadata/fullSyncToXml/worker.integration.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 7b4292075
```

Expected: PASS. The existing partial synchronization uses the same `profile.confirm`, so this proves both full and partial call the common builder; no separate partial classifier is added.

- [ ] **Step 7: Commit the synchronization refactor**

```bash
git add packages/rules/metadata/fullSyncToXml/componentProfile.ts packages/rules/metadata/fullSyncToXml/profiles/configuration.ts packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.ts packages/rules/metadata/fullSyncToXml/profiles/configurationExtension.test.ts
git commit -m "refactor: :recycle: переиспользовать профиль XML в синхронизации"
```

---

### Task 3: Общий сбор логических адресов и источников профиля импорта

**Files:**
- Create: `packages/rules/metadata/project/componentState/logicalAddresses.ts`
- Modify: `packages/rules/metadata/project/componentState/indexes.ts`
- Modify: `packages/rules/metadata/project/componentState/indexes.integration.test.ts`
- Create: `packages/rules/metadata/importFromXml/reconstructionProfile.ts`
- Create: `packages/rules/metadata/importFromXml/reconstructionProfile.test.ts`

**Interfaces:**
- Consumes: `buildXmlComponentReconstructionProfile` from Task 1, `ProjectStateReadSession`, `ConfigurationIndexStore`, topology projection.
- Produces:

```ts
export function collectComponentLogicalAddresses(params: {
  readonly componentPath: string
  readonly known: readonly ProjectLogicalAddressEntry[]
  readonly projectStateReadSession: Pick<ProjectStateReadSession, "readComponentTargetPage">
}): ProjectLogicalAddressEntry[]

export async function prepareImportXmlReconstructionProfile(params: {
  readonly address: ComponentAddress
  readonly projectDir: string
  readonly assignments: readonly ImportAssignment[]
  readonly projectState: Pick<ProjectStateService, "openReadSession">
  readonly projectStateReadToken: ProjectStateReadToken
  readonly targetIndex: Pick<ConfigurationIndexStore, "getBlocks">
}): Promise<XmlComponentReconstructionProfile>
```

- [ ] **Step 1: Add a failing address-collector regression**

Move the paging/normalization expectation from `readComponentIndexes` into an assertion that calls `collectComponentLogicalAddresses` with one known root and two ProjectState pages:

```ts
expect(collectComponentLogicalAddresses({
  componentPath: "cfe/Дополнение",
  known: [{ logicalAddress: "Catalog.Товары", sourceProjectPath: "Справочник/Товары/Свойства.yaml" }],
  projectStateReadSession,
})).toEqual([
  { logicalAddress: "Catalog.Товары", sourceProjectPath: "Справочник/Товары/Свойства.yaml" },
  {
    logicalAddress: "Catalog.Товары.Attribute.Артикул",
    sourceProjectPath: "Справочник/Товары/Свойства.yaml",
  },
])
```

Assert that duplicates keep the first entry and that a page path outside `cfe/Дополнение/` throws an address-specific error.

- [ ] **Step 2: Run the collector test and verify it fails**

Run:

```bash
pnpm exec vitest run --no-isolate --project integration metadata/project/componentState/indexes.integration.test.ts
```

Expected: FAIL because `collectComponentLogicalAddresses` does not exist.

- [ ] **Step 3: Extract and reuse the collector**

Implement `collectComponentLogicalAddresses` by moving the cursor loop,
component-relative path check and first-entry deduplication from `indexes.ts`.
`readComponentIndexes` computes its known root entries from topology resources,
then delegates:

```ts
const logicalAddresses = collectComponentLogicalAddresses({
  componentPath: params.structure.componentPath,
  known: params.structure.resources
    .filter(({ kind }) => kind === "content")
    .map((resource) => ({
      logicalAddress: projectXmlExportAssignment(params.structure.topology, resource).logicalAddress,
      sourceProjectPath: resource.projectPath,
    })),
  projectStateReadSession: params.projectStateReadSession,
})
```

- [ ] **Step 4: Write failing tests for import profile source preparation**

In `reconstructionProfile.test.ts`, provide in-memory target/base blocks and a fake
read session. Assert that the helper:

```ts
const profile = await prepareImportXmlReconstructionProfile({
  address: { kind: "configurationExtension", name: "Дополнение" },
  projectDir: "/project",
  assignments: [catalogAssignment],
  projectState,
  projectStateReadToken: token,
  targetIndex,
}, {
  readBaseStructure: async () => baseStructure,
  openBaseIndex: () => baseIndex,
})

expect(profile.xmlDefaultVariantByLogicalAddress).toMatchObject({
  "Справочник.Товары": "adopted",
  "Справочник.Товары.Реквизит.Артикул": "adopted",
  "Справочник.Товары.Реквизит.Собственный": "full",
})
expect(baseIndex.close).toHaveBeenCalledOnce()
expect(projectStateSession.close).toHaveBeenCalledOnce()
```

Add a configuration case that never opens a base index and returns exact
`indexed`/`full`. Add a failure case proving both opened resources close in
`finally`.

- [ ] **Step 5: Run the import source tests and verify they fail**

Run:

```bash
pnpm exec vitest run --no-isolate --project core-metadata metadata/importFromXml/reconstructionProfile.test.ts
```

Expected: FAIL because `prepareImportXmlReconstructionProfile` does not exist.

- [ ] **Step 6: Implement import-side IO preparation**

Implement the helper with injectable defaults:

```ts
export interface ImportXmlReconstructionProfileDependencies {
  readonly readBaseStructure: typeof readComponentProjectStructure
  readonly openBaseIndex: typeof openConfigurationIndexStore
  readonly buildProfile: typeof buildXmlComponentReconstructionProfile
}
```

The algorithm is:

```ts
const session = params.projectState.openReadSession(params.projectStateReadToken)
try {
  const targetAddresses = collectComponentLogicalAddresses({
    componentPath: componentPath(params.address),
    known: params.assignments.map(({ logicalAddress, targetProjectPath }) => ({
      logicalAddress,
      sourceProjectPath: targetProjectPath,
    })),
    projectStateReadSession: session,
  })
  const targetReader = createLocalConfigurationIndexReader(
    params.targetIndex.getBlocks(uniqueProjectPaths(targetAddresses)),
  )
  // configuration: build immediately
  // extension: read cf structure, addresses and active cf index once, then build
} finally {
  session.close()
}
```

For the base configuration, derive known root addresses with
`projectXmlExportAssignment(baseStructure.topology, resource)`, collect nested
addresses from the same ProjectState read session, open
`configurationIndexStoreDescriptor(projectDir, { kind: "configuration" })` in
read-only mode, read only the blocks named by those addresses, and always close
the store.

- [ ] **Step 7: Run the layer checks**

Run:

```bash
pnpm exec vitest run --no-isolate --project core-metadata metadata/importFromXml/reconstructionProfile.test.ts
pnpm exec vitest run --no-isolate --project integration metadata/project/componentState/indexes.integration.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 7b4292075
```

Expected: PASS; no test opens a real LMDB in a unit project.

- [ ] **Step 8: Commit the source preparation layer**

```bash
git add packages/rules/metadata/project/componentState/logicalAddresses.ts packages/rules/metadata/project/componentState/indexes.ts packages/rules/metadata/project/componentState/indexes.integration.test.ts packages/rules/metadata/importFromXml/reconstructionProfile.ts packages/rules/metadata/importFromXml/reconstructionProfile.test.ts
git commit -m "refactor: :recycle: собрать источники профиля импорта"
```

---

### Task 4: Передать один профиль всем контрольным экспортам

**Files:**
- Modify: `packages/rules/metadata/workerPool/importContracts.ts`
- Modify: `packages/rules/metadata/importFromXml/workerPool.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/workerPool.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`

**Interfaces:**
- Consumes: `XmlComponentExportProfile` from Task 1.
- Produces: second-pass worker protocol and proof require the same complete profile.

```ts
runSecondPass(
  readTokens: readonly ProjectStateReadToken[],
  exportProfile: XmlComponentExportProfile,
  sink?: XmlImportStateSink,
): Promise<XmlImportSecondPassPoolResult>

type BeginSecondPassCommand = {
  readonly kind: "beginSecondPass"
  readonly readToken: ProjectStateReadToken
  readonly composition?: readonly ImportControlCompositionEntry[]
  readonly exportProfile: XmlComponentExportProfile
}
```

- [ ] **Step 1: Write a failing worker-pool transport assertion**

Create a shared test profile:

```ts
const exportProfile = {
  componentKind: "configurationExtension" as const,
  adoptedUuids: { "Справочник.Товары": BASE_UUID },
  xmlDefaultVariantByLogicalAddress: {
    Конфигурация: "adopted" as const,
    "Справочник.Товары": "adopted" as const,
  },
  typeDescriptionXMLNameByType: { AnyIBRef: "AnyRef" },
}
```

Pass it to `runSecondPass` and assert every worker receives it in exactly one
`beginSecondPass` command together with the complete composition. Assert no
profile is repeated in `secondPassBatch`.

- [ ] **Step 2: Run the pool test and verify the signature failure**

Run:

```bash
pnpm exec vitest run --no-isolate --project integration metadata/importFromXml/workerPool.integration.test.ts
```

Expected: FAIL because `runSecondPass` and `beginSecondPass` do not carry the profile.

- [ ] **Step 3: Extend the serializable worker protocol**

Add `exportProfile` to `beginSecondPass` in
`workerPool/importContracts.ts`. Update `XmlImportWorkerPool.runSecondPass`,
`runFollowingPass` and its callers so the profile is supplied only for pass
`"second"` and copied into each begin command. `beginThirdPass` remains
unchanged.

Use `structuredClone(exportProfile)` in the protocol test to prove the
contract contains only transferable records and strings.

- [ ] **Step 4: Store the profile for the active second pass**

Extend `ActiveSecondPass`:

```ts
interface ActiveSecondPass {
  // existing readers and composition
  readonly exportProfile?: XmlComponentExportProfile
}
```

Pass the command profile into `beginSecondPass`. Third pass leaves it absent.
Before invoking proof in `prepareYamlForFinalPass`, require it with a helper that
throws `Второй проход XML-import не получил профиль восстановления XML`.

- [ ] **Step 5: Replace the root XML scan in control export**

Change `executeImportControlExport` params to require:

```ts
readonly exportProfile: XmlComponentExportProfile
```

Replace `controlExportContext(context, logicalAddress, adoptedUuid)` with:

```ts
function controlExportContext(
  context: XmlImportConfigurationContext,
  profile: XmlComponentExportProfile,
): ConfigurationContextWithExportToXML {
  return {
    ...context,
    exportToXML: {
      ...(context.exportToXML ?? {}),
      componentKind: profile.componentKind,
      adoptedUuids: profile.adoptedUuids,
      xmlDefaultVariantByLogicalAddress: profile.xmlDefaultVariantByLogicalAddress,
      ...(profile.typeDescriptionXMLNameByType === undefined
        ? {}
        : { typeDescriptionXMLNameByType: profile.typeDescriptionXMLNameByType }),
      version: context.exportToXML?.version ?? context.version,
      itemsTree: context.exportToXML?.itemsTree ?? [],
      context: {
        metadataForNumbering: [], forms: [], templates: [], parentName: "",
        ...context.exportToXML?.context,
      },
    },
  }
}
```

Delete `readAdoptedUuid`, `childElement`, their XML-parser imports and the
per-assignment source read before `controlExportCountValueForTests` increments.
The supplied profile is authoritative; do not merge an old sparse UUID map.

- [ ] **Step 6: Replace the control-export regression**

Replace “передаёт UUID из исходного XML” with:

```ts
it("передаёт полный профиль без чтения XML ради UUID", async () => {
  const readSource = vi.fn(async () => { throw new Error("XML не должен читаться до proof") })
  let captured: XmlComponentExportProfile | undefined

  await expect(executeCatalogControlExport({
    assignment: catalogAssignment(),
    data: {},
    annotations: { version: 1, entries: [] },
    audit: { sources: [], boundaries: [] },
    index: createLocalConfigurationIndexReader(new Map()),
    exportProfile,
    readSource,
    ordinaryExporter(params) {
      captured = {
        componentKind: params.context.exportToXML.componentKind as "configurationExtension",
        adoptedUuids: params.context.exportToXML.adoptedUuids ?? {},
        xmlDefaultVariantByLogicalAddress:
          params.context.exportToXML.xmlDefaultVariantByLogicalAddress ?? {},
        typeDescriptionXMLNameByType:
          params.context.exportToXML.typeDescriptionXMLNameByType,
      }
      throw new Error("projection captured")
    },
  })).rejects.toThrow("projection captured")

  expect(captured).toEqual(exportProfile)
  expect(readSource).not.toHaveBeenCalled()
})
```

Update the test helper `executeCatalogControlExport` to provide an exact
configuration profile by default. Direct extension cases pass their explicit
profile.

- [ ] **Step 7: Update worker tests and run the transport layer**

Use one `exportProfileForTests()` helper in worker tests. Assert two
prepared assignments invoke the fake `controlExport` twice with the same profile
object held by the worker pass.

Run:

```bash
pnpm exec vitest run --no-isolate --project integration metadata/importFromXml/controlExport.integration.test.ts metadata/importFromXml/workerPool.integration.test.ts metadata/importFromXml/worker.integration.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 7b4292075
```

Expected: PASS; `readAdoptedUuid` no longer exists under `importFromXml`.

- [ ] **Step 8: Commit the protocol and proof changes**

```bash
git add packages/rules/metadata/workerPool/importContracts.ts packages/rules/metadata/importFromXml/workerPool.ts packages/rules/metadata/importFromXml/worker.ts packages/rules/metadata/importFromXml/controlExport.ts packages/rules/metadata/importFromXml/controlExport.integration.test.ts packages/rules/metadata/importFromXml/workerPool.integration.test.ts packages/rules/metadata/importFromXml/worker.integration.test.ts
git commit -m "feat: :sparkles: передать профиль контрольному экспорту"
```

---

### Task 5: Построить профиль один раз в координаторе импорта

**Files:**
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts`

**Interfaces:**
- Consumes: `prepareImportXmlReconstructionProfile` from Task 3 and the new `runSecondPass` signature from Task 4.
- Produces: every import second pass receives one component-wide export profile built after `commitWorkingIndex`.

- [ ] **Step 1: Add a failing coordinator test for exactly one build**

Extend the dependency interface:

```ts
prepareReconstructionProfile?: typeof prepareImportXmlReconstructionProfile
readPreparedRootYaml?(params: {
  readonly preparedStore: PreparedImportStore
  readonly rootAssignment: ImportAssignment
}): Promise<unknown>
```

In the coordinator integration fake, collect `preparedProfiles` and
`secondPassProfiles`. The injected builder returns a frozen reconstruction
profile; the prepared root record contains the extension compatibility mode.
Assert:

```ts
expect(preparedProfiles).toHaveLength(1)
expect(preparedProfiles[0]).toMatchObject({
  address: { kind: "configurationExtension", name: "Расширение_All" },
  assignments,
})
expect(secondPassProfiles).toEqual([{
  ...reconstructionProfile,
  typeDescriptionXMLNameByType: { AnyIBRef: "AnyRef" },
}])
```

Add a failure case where the builder throws
`Не найден UUID основной конфигурации: Справочник.Товары`; assert the result has
one operation diagnostic, `runSecondPass` was not called, the import session was
aborted and the candidate store was discarded.

- [ ] **Step 2: Run the coordinator test and verify it fails**

Run:

```bash
pnpm exec vitest run --no-isolate --project integration metadata/importFromXml/importConfiguration.integration.test.ts
```

Expected: FAIL because the coordinator never prepares or passes a profile.

- [ ] **Step 3: Build the profile at the architecture barrier**

Immediately after:

```ts
const firstReadToken = await importSession.commitWorkingIndex()
```

measure one preparation:

```ts
const reconstructionProfile = await profiler.measureAsync(
  "Подготовка импорта конфигурации",
  "Подготовка профиля восстановления XML компонента",
  { items: discovered.assignments.length },
  () => (deps.prepareReconstructionProfile ?? prepareImportXmlReconstructionProfile)({
    address,
    projectDir: params.projectDir,
    assignments: discovered.assignments,
    projectState,
    projectStateReadToken: firstReadToken,
    targetIndex: indexCandidate!,
  }),
)
```

Find the single root assignment with `role === "configuration"`, read its bytes
once from `preparedStore`, and restore its YAML with
`restorePreparedImportRecord`. Build the worker export profile without changing
the pure reconstruction result:

```ts
const rootAssignment = discovered.assignments.find(({ role }) => role === "configuration")
if (rootAssignment === undefined) throw new Error("Не найдено корневое задание XML-import")
const rootYaml = await (deps.readPreparedRootYaml ?? readPreparedRootYaml)({
  preparedStore,
  rootAssignment,
})
const exportProfile: XmlComponentExportProfile = {
  ...reconstructionProfile,
  ...(address.kind !== "configurationExtension"
    ? {}
    : {
        typeDescriptionXMLNameByType:
          configurationExtensionTypeDescriptionXMLNameByType(rootYaml),
      }),
}
```

The production adapter is exact and remains in `importConfiguration.ts`:

```ts
async function readPreparedRootYaml(params: {
  readonly preparedStore: PreparedImportStore
  readonly rootAssignment: ImportAssignment
}): Promise<unknown> {
  return restorePreparedImportRecord(
    await params.preparedStore.read(params.rootAssignment.id),
  ).yaml
}
```

Coordinator unit fakes inject `readPreparedRootYaml: async () => ({})`; the
compatibility-mode test returns
`{ РежимСовместимостиРасширенияКонфигурации: "Версия8_3_20" }`.

This is the only coordinator read of the prepared root for profile construction.
Create the remaining worker read tokens only after successful profile
preparation, then call:

```ts
pool!.runSecondPass(readTokens, exportProfile, stateSink)
```

Do not prepare the profile in `discover`, `runFirstPass`, a worker batch or an
individual `executeImportControlExport`.

- [ ] **Step 4: Add the real extension import regression**

In `importConfigurationExtension.integration.test.ts`, use the existing imported
catalog with `РеквизитСправочника` and assert its serialized YAML has no service
raw caused by ownership:

```ts
expect(yamlText).not.toContain("ПринадлежностьОбъекта: !xml/raw")
expect(yamlText).not.toContain("Properties: !xml/raw")
```

Keep the expected genuine raw entries:

```ts
expect(yamlText).toContain("Properties\\UnknownProperty: !xml/raw")
expect(yamlText).toContain("Тип: !xml/raw")
```

Also assert the imported extension result remains successful and its active
configuration index is published.

- [ ] **Step 5: Run coordinator and real extension import tests**

Run outside the sandbox because the integration opens LMDB:

```bash
pnpm exec vitest run --no-isolate --project integration metadata/importFromXml/importConfiguration.integration.test.ts metadata/importFromXml/importConfigurationExtension.integration.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 7b4292075
```

Expected: PASS; the profiler contains exactly one component-level preparation
record, not one record per assignment.

- [ ] **Step 6: Commit coordinator integration**

```bash
git add packages/rules/metadata/importFromXml/importConfiguration.ts packages/rules/metadata/importFromXml/importConfiguration.integration.test.ts packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts
git commit -m "fix: :bug: строить полный профиль при импорте расширения"
```

---

### Task 6: Обновить e2e YAML и доказать устранение 319 тегов

**Files:**
- Modify: `e2e/fixtures/nkdk/**/*.yaml`

**Interfaces:**
- Consumes: completed import path from Tasks 1–5.
- Produces: canonical e2e YAML with all 319 profile-classification tags removed. If no other class changes, this leaves 65 `!xml/raw` and 7 `!xml/invalid`; a lower raw count is accepted only after inspecting and explaining every additional removed class.

- [ ] **Step 1: Record the pre-change audit**

Run:

```bash
rg -o '!xml/(raw|invalid|important)' e2e/fixtures/nkdk --glob '*.yaml' | awk -F: '{count[$2]++} END {for (key in count) print key, count[key]}' | sort
rg -n 'ПринадлежностьОбъекта: !xml/raw' e2e/fixtures/nkdk --glob '*.yaml' | wc -l
```

Expected before regeneration:

```text
!xml/invalid 7
!xml/raw 384
157
```

- [ ] **Step 2: Regenerate only the NKDK e2e YAML fixture**

Run outside the sandbox because import uses LMDB:

```bash
pnpm fixtures:e2e:nkdk
```

Do not run against `cf/doc`.

- [ ] **Step 3: Verify the exact audit result**

Run:

```bash
rg -o '!xml/(raw|invalid|important)' e2e/fixtures/nkdk --glob '*.yaml' | awk -F: '{count[$2]++} END {for (key in count) print key, count[key]}' | sort
rg -n 'ПринадлежностьОбъекта: !xml/raw' e2e/fixtures/nkdk --glob '*.yaml'
git diff --name-only -- e2e/fixtures | rg '\.xml$'
```

Expected when only the classified group changes:

```text
!xml/invalid 7
!xml/raw 65
```

The raw count must not exceed 65. If it is lower, identify each additional
removed tag and verify that normal XML export restores it before accepting the
fixture update. The second and third commands produce no output. Inspect the diff for
`IntegrationServiceChannel`: its four local property raws and parent order raw
must be absent, while its semantic YAML remains.

- [ ] **Step 4: Run the e2e suite and remove its report directory**

Run outside the sandbox:

```bash
pnpm test:e2e
rm -rf reports/e2e
```

Expected: 19 test files and 170 tests PASS; `reports/e2e` no longer exists.

- [ ] **Step 5: Check duplicates and commit the canonical YAML**

Run:

```bash
pnpm duplicates -- --base 7b4292075
git status --short
git add e2e/fixtures/nkdk
git commit -m "test: :white_check_mark: обновить e2e после профиля XML"
```

Before committing, confirm that no `.xml` file is staged.

---

### Task 7: Full verification and independent review

**Files:**
- Review: every file changed since `7b4292075`
- Do not modify unless a verified test or review finding requires a focused fix.

**Interfaces:**
- Consumes: all preceding task deliverables.
- Produces: evidence that implementation matches the approved spec and plan.

- [ ] **Step 1: Run the complete required verification**

Run LMDB suites outside the sandbox:

```bash
pnpm duplicates -- --base 7b4292075
pnpm type-check
pnpm test
pnpm test:e2e
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: all commands PASS. Do not update dependency-cruiser baselines.

- [ ] **Step 2: Verify immutable inputs and cleanup**

Run:

```bash
git diff --name-only 7b4292075 -- '*.xml'
rm -rf reports/e2e
git status --short
```

Expected: no XML paths, no generated report directory, and no uncommitted files.
Remove any task-specific temporary directories created outside test-managed
`mkdtemp` cleanup.

- [ ] **Step 3: Request a read-only subagent review**

Ask one fresh reviewer to inspect `git diff 7b4292075...HEAD` and explicitly
answer these questions:

```text
1. Реализация соответствует docs/superpowers/specs/2026-08-26-shared-xml-reconstruction-profile-design.md?
2. Все задачи и интерфейсы из docs/superpowers/plans/2026-08-26-shared-xml-reconstruction-profile.md выполнены?
3. Профиль строится один раз на компонент и не читает XML/LMDB внутри чистого построителя?
4. Собственный вложенный объект не наследует adopted, а заимствованный получает UUID основной конфигурации?
5. Нет ли регрессий протокола worker, утечек LMDB/read session, лишних копий или непокрытых ошибок?
```

Reviewer must report findings with file and line references and must not modify
the worktree.

- [ ] **Step 4: Process review findings rigorously**

If findings exist, use `superpowers:receiving-code-review`, reproduce each issue,
write a failing test, apply the smallest fix, rerun the affected targeted suite,
then repeat all commands from Step 1. Commit verified fixes with a focused
Conventional Commit message from the project `commit` skill.

If the reviewer reports no findings, record that explicitly in the final handoff.

- [ ] **Step 5: Report completion evidence**

Report:

```text
- commits created for Tasks 1–6;
- exact final counts of !xml/raw and !xml/invalid;
- e2e test count and duration;
- full pnpm test/type-check/architecture/duplicates results;
- reviewer verdict and any fixes;
- confirmation that XML fixtures, cf/doc and temporary directories were untouched.
```
