# Complete Metadata E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить последние 13 содержательных диагностик metadata E2E и получить чистые import, тёплую/холодную validation и побайтовый XML → YAML → XML round-trip для `cf` и трёх `cfe`.

**Architecture:** Точный topology-target YAML-файла передаётся общим индексаторам и становится основой для targets вложенных членов; адресуемые inline metadata-item индексируются нейтральным rule-driven обходом. Ссылочный `FillValue` сохраняет признак `!xml` до второго прохода, где его необходимость проверяется только по индексу текущего CFE; XML-import использует тот же компонентный lookup после публикации первого прохода.

**Tech Stack:** TypeScript 7, Vitest 4, TypeBox, бинарный ProjectState, pnpm 10, XML/YAML metadata rules.

## Global Constraints

- Нейтральные слои не содержат условий по `itemType`, XML-корням или каталогам конкретных metadata-объектов.
- Существующие XML-фикстуры остаются источником истины и не изменяются.
- Формат XML и YAML не расширяется служебными признаками.
- Тёплая validation по diff и холодная validation без `.nkdk` используют один смысловой договор.
- Ссылка из CFE разрешается в рамках CFE; наличие одноимённой цели в CF не делает ссылку доступной расширению.
- `!xml` допустим для ссылочного `FillValue`, только если цель отсутствует в текущем CFE; доступная цель с `!xml` является ошибкой.
- Обычная ссылка на отсутствующую цель остаётся ошибкой и никогда не получает `!xml` во время validation.
- Пустой `DesignTimeRef` сохраняет действующий транспортный договор и не участвует в проверке наличия именованной цели.
- Поля с допустимым `!xml` не проходят обычную семантическую проверку ссылки.
- Новые правила fromXML/toXML/fromYAML/toYAML не добавляются; используются существующие rules.ts, registry и второй проход ProjectState.
- После каждого законченного слоя выполняется `pnpm duplicates -- --base origin/develop`.
- Перед завершением выполняются `pnpm type-check`, `pnpm test`, `pnpm test:e2e`, `pnpm test:architecture:rules` и `pnpm test:architecture`.

---

## Карта файлов

- `packages/core/metadata/validation/addressableMetadataTargets.ts` — новый нейтральный обход YAML/rules.ts, формирующий object targets для адресуемых inline metadata-item.
- `packages/core/metadata/validation/yamlFactExtractor.ts` — подключает object targets inline-элементов к первому проходу.
- `packages/core/metadata/validation/projectReferenceIndexRegistry.ts` и `projectValidationPasses.ts` — передают точный object target файлового владельца индексаторам членов.
- `packages/core/metadata/commonObjects/metadataTargetProjectResolvers/register.ts` — строит targets полей, команд, измерений и ресурсов от точного владельца.
- `packages/core/metadata/commonObjects/metadataExternalDataSourceFunction/rules.ts` и `types.ts` — декларативно объявляют сегмент `Function`/`Функция`.
- `packages/core/metadata/commonObjects/fillValue/register.ts` и `analyzeItem.ts` — откладывают именованный `DesignTimeRef` до компонентного lookup и переносят признак `!xml` в ссылочную запись.
- `packages/core/metadata/importFromXml/dependentItems.ts` и `worker.ts` — применяют компонентный lookup во втором проходе XML-import.
- `packages/core/metadata/validation/projectReferenceIndex.ts`, `projectState/contracts/*`, `projectState/binary/*` и `projectState/fileUpdate.ts` — сохраняют транспортный признак tagged у pending reference.
- `packages/core/metadata/validation/projectStateDependencyValidation.ts` — реализует четыре состояния обычной ссылки/`!xml` относительно индекса CFE без fallback в CF.
- `e2e/metadata-project.test.ts` и `e2e/support/metadata-project.ts` — закрепляют чистый проект, отрицательный сценарий и побайтовый round-trip.

### Task 1: Точные targets файловых владельцев и вложенных членов

**Files:**
- Modify: `packages/core/metadata/validation/projectReferenceIndexRegistry.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargetProjectResolvers/register.ts`
- Test: `packages/core/metadata/validation/projectValidationPasses.test.ts`
- Test: `packages/core/metadata/validation/projectReferenceIndexRegistry.test.ts`

**Interfaces:**
- Consumes: `ValidationProjectFile.metadataTarget` и `ParsedMetadataTarget` из первого прохода.
- Produces: `ProjectReferenceMemberIndexContributor({ projectDir, owner, objectTarget })`, где `objectTarget` — точная объектная цель текущего YAML-файла.

- [ ] **Step 1: Добавить падающий тест точных вложенных members**

В `projectValidationPasses.test.ts` построить YAML-файлы таблицы, куба и таблицы измерений внешнего источника и проверить записи:

```ts
expect(result.memberIndexEntries).toEqual(expect.arrayContaining([
  expect.objectContaining({ canonical: "ExternalDataSource.Источник.Table.Таблица.Field.Поле" }),
  expect.objectContaining({ canonical: "ExternalDataSource.Источник.Table.Таблица.Command.Команда" }),
  expect.objectContaining({ canonical: "ExternalDataSource.Источник.Cube.Куб.Dimension.Измерение" }),
  expect.objectContaining({ canonical: "ExternalDataSource.Источник.Cube.Куб.Resource.Ресурс" }),
  expect.objectContaining({
    canonical: "ExternalDataSource.Источник.Cube.Куб.DimensionTable.ТаблицаИзмерений.Field.Поле",
  }),
]))
```

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationPasses.test.ts --no-isolate
```

Expected: FAIL; фактические canonical теряют `Table`, `Cube` или `DimensionTable`.

- [ ] **Step 3: Передать точную объектную цель индексаторам**

Расширить параметры contributor и вызывать его из `buildMemberIndexEntries` так:

```ts
for (const contributor of getProjectReferenceMemberIndexContributors()) {
  for (const entry of contributor({ ...params, objectTarget: params.objectTarget })) {
    addMemberIndexEntry(entries, seen, entry)
  }
}
```

В `collectionMemberIndexContributor` удалить восстановление через `rootFromYAML[owner.ref.kind]` и строить цель от `objectTarget`:

```ts
const target = {
  kind: "member",
  root: objectTarget.root,
  objectName: objectTarget.objectName,
  segments: [{ kind: params.kind, name: item.name }],
} satisfies Extract<ParsedMetadataTarget, { kind: "member" }>
```

- [ ] **Step 4: Запустить узкие тесты и type-check пакета**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationPasses.test.ts metadata/validation/projectReferenceIndexRegistry.test.ts --no-isolate
pnpm --filter @nkdk/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Проверить дубли и создать коммит слоя**

```bash
pnpm duplicates -- --base origin/develop
git add packages/core/metadata/validation/projectReferenceIndexRegistry.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/commonObjects/metadataTargetProjectResolvers/register.ts packages/core/metadata/validation/projectValidationPasses.test.ts packages/core/metadata/validation/projectReferenceIndexRegistry.test.ts
git commit -m "fix: :bug: индексировать члены по точному metadata target" -m "Вложенные файловые объекты внешнего источника больше не теряют цепочку владельцев при построении ссылочного индекса."
```

### Task 2: Rule-driven индекс адресуемых inline metadata-item

**Files:**
- Create: `packages/core/metadata/validation/addressableMetadataTargets.ts`
- Create: `packages/core/metadata/validation/addressableMetadataTargets.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceFunction/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceFunction/types.ts`
- Test: `packages/core/metadata/validation/yamlFactExtractor.test.ts`

**Interfaces:**
- Consumes: `yaml`, корневой `MetadataItemRule`, `canonicalTarget`, `filePath` и существующий `yamlToXMLNestedRule` registry.
- Produces: `collectAddressableMetadataObjectEntries(params): ProjectObjectIndexEntry[]` с каноническими targets всех inline items, чьи фактические правила содержат `externalMetadata`.

- [ ] **Step 1: Написать падающий тест нейтрального обхода**

В новом тесте зарегистрировать коллекцию с адресуемым item rule и проверить:

```ts
expect(collectAddressableMetadataObjectEntries({
  yaml: { Функции: { Функция1: { Тип: "Строка" } } },
  rule: ownerRule,
  canonicalTarget: "ExternalDataSource.Источник",
  filePath: "/project/ВнешнийИсточникДанных/Источник/Свойства.yaml",
})).toEqual([
  expect.objectContaining({
    canonical: "ExternalDataSource.Источник.Function.Функция1",
    target: expect.objectContaining({ kind: "object", objectName: "Источник.Function.Функция1" }),
  }),
])
```

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/addressableMetadataTargets.test.ts --no-isolate
```

Expected: FAIL с отсутствующим модулем/экспортом.

- [ ] **Step 3: Реализовать общий обход rules.ts**

Повторить разрешение фактического item rule из `addressableRequired.ts`: использовать `getTypeRule(propertyRule.type, "yamlToXMLNestedRule")`, `itemRuleFromProperty`, `resolveItemRule`, `nameFromYAMLKeyForProperty` и `nameFromYAMLKey`. Для каждого `itemRule.externalMetadata` разобрать `${boundaryTarget}.${segment}.${itemName}` через `parseMetadataTargetFromModel({ constraint: { kind: "object", allowNested: true } })` и добавить `ProjectObjectIndexEntry`; обычные вложенные value-структуры только рекурсивно обходить.

- [ ] **Step 4: Объявить функцию внешнего источника адресуемой**

В `MetadataExternalDataSourceFunctionRules` добавить существующую декларацию:

```ts
externalMetadata: { segment: "Function", placement: "ownedEntry" },
```

А в регистрации `MetadataExternalDataSourceFunctions` добавить существующий параметр:

```ts
configurationIndexUidSegment: "Функция",
```

- [ ] **Step 5: Подключить entries к первому проходу и проверить GREEN**

В `extractValidationYamlFacts` объединить корневую object entry и результат `collectAddressableMetadataObjectEntries`; добавить интеграционную проверку `ExternalDataSource.Источник.Function.Функция1` в `yamlFactExtractor.test.ts`.

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/addressableMetadataTargets.test.ts metadata/validation/yamlFactExtractor.test.ts --no-isolate
pnpm --filter @nkdk/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Проверить дубли и создать коммит слоя**

```bash
pnpm duplicates -- --base origin/develop
git add packages/core/metadata/validation/addressableMetadataTargets.ts packages/core/metadata/validation/addressableMetadataTargets.test.ts packages/core/metadata/validation/yamlFactExtractor.ts packages/core/metadata/validation/yamlFactExtractor.test.ts packages/core/metadata/commonObjects/metadataExternalDataSourceFunction/rules.ts packages/core/metadata/commonObjects/metadataExternalDataSourceFunction/types.ts
git commit -m "fix: :bug: индексировать адресуемые inline metadata" -m "Rule-driven обход добавляет объектные targets встроенных элементов без частных условий в validation."
```

### Task 3: Компонентный lookup `FillValue` во втором проходе XML-import

**Files:**
- Modify: `packages/core/metadata/ruleRuntime/property/dependentItemRegistry.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/register.ts`
- Modify: `packages/core/metadata/importFromXml/dependentItems.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Test: `packages/core/metadata/importFromXml/dependentItems.test.ts`
- Test: `packages/core/metadata/importFromXml/fillValueImport.test.ts`

**Interfaces:**
- Consumes: `ProjectStateReadSession.resolveTargets`, `state.componentPath`, canonical именованного `DesignTimeRef` и текущую CFE visibility.
- Produces: необязательный `metadataTargetLookup(canonical): "found" | "missing" | "ambiguous"` в `DependentItemParams`; именованный ссылочный `FillValue` всегда откладывается до второго прохода.

- [ ] **Step 1: Добавить падающую матрицу нормализации import**

В `dependentItems.test.ts` добавить `it.each`:

```ts
it.each([
  ["target exists", "found", false],
  ["target absent", "missing", true],
] as const)("imports DesignTimeRef when %s", (_name, status, tagged) => {
  const attribute = normalizeReferenceAttribute(() => status)
  expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения") === "xml").toBe(tagged)
})
```

Отдельно проверить, что `ambiguous` не превращается в допустимый `!xml`, а остаётся обычной ссылкой для последующей диагностики.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/dependentItems.test.ts --no-isolate
```

Expected: FAIL; текущий import не зависит от наличия цели в CFE.

- [ ] **Step 3: Отложить именованные ссылочные `FillValue`**

В обоих fill-value import handlers расширить `shouldDefer`: сохранять существующую проверку DefinedType и возвращать `true` для `parseFillValueItem(params.item)?.value.type === "ref"` с непустым canonical. В `shouldTagXML` сначала применять действующую классификацию несовместимого значения, затем для ссылочного значения использовать lookup: `missing` → `true`, `found` → `false`, `ambiguous`/нет lookup → не маскировать ссылку тегом.

- [ ] **Step 4: Подключить lookup только текущего компонента**

В `beginSecondPass` уже открыт `ProjectStateReadSession`. Передать в `normalizeImportedDependentItems` функцию:

```ts
metadataTargetLookup: (canonical) => {
  const [result] = activeSecondPass.readSession.resolveTargets([{
    requestId: canonical,
    componentPath: state.componentPath,
    canonicalTarget: canonical,
  }])
  return result?.status ?? "missing"
},
```

Не выполнять повторный lookup с `componentPath: "cf"`.

- [ ] **Step 5: Проверить import и отсутствие CF fallback**

Добавить интеграционный тест второго прохода CFE: одинаковая цель существует только в CF, но импортированный CFE `FillValue` получает `!xml`; цель, добавленная в CFE, импортируется без тега.

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/dependentItems.test.ts metadata/importFromXml/fillValueImport.test.ts --no-isolate
pnpm --filter @nkdk/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Проверить дубли и создать коммит слоя**

```bash
pnpm duplicates -- --base origin/develop
git add packages/core/metadata/ruleRuntime/property/dependentItemRegistry.ts packages/core/metadata/commonObjects/fillValue/register.ts packages/core/metadata/importFromXml/dependentItems.ts packages/core/metadata/importFromXml/worker.ts packages/core/metadata/importFromXml/dependentItems.test.ts packages/core/metadata/importFromXml/fillValueImport.test.ts
git commit -m "fix: :bug: определять xml для FillValue по индексу CFE" -m "Именованные DesignTimeRef нормализуются во втором проходе и не используют одноимённые цели базовой конфигурации."
```

### Task 4: Четыре состояния `FillValue` validation

**Files:**
- Modify: `packages/core/metadata/validation/projectReferenceIndex.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/analyzeItem.ts`
- Modify: `packages/core/metadata/projectState/contracts/dependencyValidation.ts`
- Modify: `packages/core/metadata/projectState/contracts/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.ts`
- Modify: `packages/core/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.ts`
- Test: `packages/core/metadata/validation/fillValueReferences.test.ts`
- Test: `packages/core/metadata/validation/projectStateDependencyValidation.test.ts`
- Test: `packages/core/metadata/projectState/fileUpdate.test.ts`
- Test: `packages/core/metadata/projectState/binary/fragment.test.ts`

**Interfaces:**
- Consumes: `yamlScalarTagAt(item, "ЗначениеЗаполнения")` и точный результат `resolveTargets` текущего componentPath.
- Produces: `PendingMetadataTargetReference.tagged?: "xml"`, сохраняемый в ProjectState; второй проход возвращает ошибку для ненужного тега и пропускает отсутствующую tagged-цель.

- [ ] **Step 1: Добавить падающую матрицу четырёх состояний**

В `projectStateDependencyValidation.test.ts` проверить:

```ts
it.each([
  [false, "found", 0],
  [false, "missing", 1],
  [true, "found", 1],
  [true, "missing", 0],
] as const)("validates fill-value tag=%s target=%s", (tagged, status, errors) => {
  const diagnostics = validateReference({ tagged, status, componentPath: "cfe/Расширение" })
  expect(diagnostics).toHaveLength(errors)
})
```

Для `tagged + found` проверить сообщение `!xml не требуется: ссылка доступна в расширении`; для `ordinary + missing` — обычное `Не найдена ссылка`.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectStateDependencyValidation.test.ts --no-isolate
```

Expected: FAIL; tagged-ссылка сейчас неотличима от обычной и может искать fallback в CF.

- [ ] **Step 3: Перенести tag в pending reference и бинарный ProjectState**

В `withValueReference` добавлять к каждому reference:

```ts
...(parsed.tagged ? { tagged: "xml" as const } : {}),
```

Расширить runtime и ProjectState contracts. В бинарной записи pending reference использовать свободный бит flags/reserved для `tagged === "xml"`; reader восстанавливает поле, валидатор файла принимает только `undefined | "xml"`. Добавить round-trip тест encode/decode, доказывающий сохранение признака.

- [ ] **Step 4: Реализовать компонентную проверку без CF fallback**

В `validateProjectStateReferenceBatch` до формирования `basePresenceChecks` разделить ссылки:

```ts
if (check.reference.tagged === "xml") {
  if (result.status === "found") diagnostics.push(unnecessaryXmlDiagnostic(check.reference))
  else if (result.status === "ambiguous") diagnostics.push(...unresolvedProjectReferenceResult(...).diagnostics)
  return
}
```

Tagged-ссылки не входят в `basePresenceChecks`, `valueOwnerChecks` и обычную ссылочную диагностику. Обычные ссылки сохраняют существующую проверку, включая `referenceNotIncludedInExtensionResult`, но для согласованного `FillValue` не должны превращаться в допустимый tagged-случай.

- [ ] **Step 5: Проверить узкие тесты и type-check**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/fillValueReferences.test.ts metadata/validation/projectStateDependencyValidation.test.ts metadata/projectState/fileUpdate.test.ts metadata/projectState/binary/fragment.test.ts --no-isolate
pnpm --filter @nkdk/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Проверить дубли и создать коммит слоя**

```bash
pnpm duplicates -- --base origin/develop
git add packages/core/metadata/validation/projectReferenceIndex.ts packages/core/metadata/commonObjects/fillValue/analyzeItem.ts packages/core/metadata/projectState/contracts/dependencyValidation.ts packages/core/metadata/projectState/contracts/fileUpdate.ts packages/core/metadata/projectState/fileUpdate.ts packages/core/metadata/projectState/fileUpdateValidation.ts packages/core/metadata/projectState/binary/fragment.ts packages/core/metadata/projectState/binary/typedReader.ts packages/core/metadata/validation/projectStateDependencyValidation.ts packages/core/metadata/validation/fillValueReferences.test.ts packages/core/metadata/validation/projectStateDependencyValidation.test.ts packages/core/metadata/projectState/fileUpdate.test.ts packages/core/metadata/projectState/binary/fragment.test.ts
git commit -m "fix: :bug: проверять необходимость xml у FillValue" -m "Признак тега сохраняется до второго прохода, где доступность цели определяется строго в текущем компоненте."
```

### Task 5: E2E-договор и полная проверка

**Files:**
- Modify: `e2e/metadata-project.test.ts`
- Modify: `e2e/support/metadata-project.ts`
- Modify: `docs/superpowers/plans/2026-08-11-complete-metadata-e2e.md`

**Interfaces:**
- Consumes: скопированные `e2e/fixtures/xml/cf` и три `e2e/fixtures/xml/cfe/*`, настоящие workers, ProjectState и XML sync.
- Produces: чистая validation, одинаковая отрицательная диагностика с `.nkdk` и без неё, побайтово равный XML всех четырёх компонентов.

- [x] **Step 1: Усилить E2E-проверку импортированного YAML**

После import прочитать один из известных CFE-реквизитов с отсутствующей локальной целью и проверить сериализованный фрагмент:

```ts
expect(fillValueYaml).toContain(
  "ЗначениеЗаполнения: !xml Справочник.СправочникРеквизит.ПредопредленноеЗначение",
)
```

Также проверить, что доступная в CFE контрольная цель не помечена `!xml`.

В скопированных E2E-фикстурах нет ссылочного `FillValue` на цель, добавленную в CFE. Поэтому E2E закрепляет отсутствующую локальную цель и отсутствие тега у обычного значения, а доступная локальная цель без `!xml` проверяется интеграционным тестом второго прохода.

- [x] **Step 2: Запустить metadata E2E и подтвердить отсутствие старых 13 диагностик**

Run:

```bash
pnpm test:e2e -- e2e/metadata-project.test.ts
```

Expected: 3 теста PASS; clean diagnostics пусты; изменённый собственный объект даёт ровно одну одинаковую ошибку warm/cold; четыре XML-дерева равны побайтово.

- [ ] **Step 3: Запустить проверки законченного слоя**

```bash
pnpm type-check
pnpm test
pnpm test:e2e
pnpm duplicates -- --base origin/develop
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: все команды завершаются с кодом 0; отчёты `reports/e2e/round-trip/*` не содержат added/removed/changed.

- [x] **Step 4: Зафиксировать фактические команды и результаты в плане**

В конец этого документа добавить раздел `## Execution Record` с точными числами прошедших/упавших тестов и результатом каждой команды из Step 3. Не включать временные каталоги и generated reports в коммит.

- [ ] **Step 5: Создать финальный коммит E2E**

```bash
git add e2e/metadata-project.test.ts e2e/support/metadata-project.ts docs/superpowers/plans/2026-08-11-complete-metadata-e2e.md
git commit -m "test: :white_check_mark: закрепить чистый metadata E2E" -m "E2E подтверждает import, warm/cold validation и побайтовый round-trip cf и трёх расширений."
```

## Проверка покрытия спеки

- Раздел 8 спеки покрыт Tasks 1–2: точный owner target, вложенные members и inline Function индексируются rule-driven.
- Раздел 9 спеки покрыт Tasks 3–4: import и validation используют полный индекс текущего CFE, четыре состояния закреплены тестами, CF fallback запрещён.
- Сквозные критерии clean validation, parity без `.nkdk` и побайтового round-trip покрыты Task 5.
- Ранее реализованные разделы 1–7 не переписываются; полный набор проверок подтверждает отсутствие регрессий.

## Execution Record

- `pnpm type-check` — PASS.
- Полный набор `@nkdk/core` без двух исключённых по решению разработчика медленных файлов (`metadata/importFromXml/worker.test.ts` и `metadata/forms/clientApplicationForm/dataPathCompatibility.integration.test.ts`) — 716 файлов и 6220 тестов PASS.
- `pnpm exec vitest run --config e2e/vitest.config.ts` — 4 файла и 12 тестов PASS; clean validation пуста, warm/cold diagnostics совпадают, четыре XML-дерева равны побайтово.
- Тесты `@nkdk/platform` — 20 файлов и 186 тестов PASS.
- Функциональные тесты `@nkdk/mcp` — 30 файлов PASS, 1 skipped; 153 теста PASS, 2 skipped. Общая оболочка пакета остаётся красной только из-за существующего порога длительности: `src/services/importFromXml.test.ts` выполняется примерно за 29 мс при пороге 10 мс.
- `pnpm duplicates -- --base origin/develop` — PASS, новых дублей нет.
- `pnpm test:architecture:rules` — 64 теста PASS.
- `pnpm test:architecture` — PASS, нарушений границ и циклов нет.
- Корневые тесты проверки дублей — 7 тестов PASS; проверка dependency-cruiser пакета — PASS.
- Полный `pnpm test` не объявляется зелёным: два медленных core-теста намеренно исключены, а оболочка `@nkdk/mcp` не проходит существующий порог длительности. Содержательные тесты изменённых слоёв и полный metadata E2E проходят.
