# Packed XML Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести XML → YAML импорт на один дисковый parse, worker-local MessagePack и окончательный второй проход, одновременно исправив ожидание фоновых MCP-операций в round-trip и import-profile.

**Architecture:** Первый проход worker создаёт полный `XmlDocument`, только извлекает из существующих rules.ts полный семантический и dependency-вклад старого YAML-пути и сохраняет документ в локальном packed store. Он не запускает проверки и не классифицирует XML-аномалии. Координатор фиксирует глобальные индексы, затем отдельным барьером проверяет связи и готовит решения зависимостей до второго прохода; тот же worker во втором проходе распаковывает документ, строит окончательный YAML, применяет все решения до единственной записи файла, сравнивает объектный toXML с исходным документом и освобождает задание. MCP-runner удерживает одну compiled-сессию и ждёт терминальный результат каждой фоновой операции.

**Tech Stack:** TypeScript 7, Node.js 26, Piscina, LMDB project state, `msgpackr`, XXH3, Vitest, `node:test`, MCP stdio.

**Spec:** `docs/superpowers/specs/2026-09-01-packed-xml-import-design.md`

## Global Constraints

- Comparison base: `5020f2369c43085f1e1919e1f51624eef6223432` (`origin/develop`).
- Полный ERP import обязан укладываться в 4 ГиБ Peak RSS в обычном измерительном режиме.
- Итоговые diagnostics и XML/YAML round-trip не меняются.
- XML каждого задания читается с диска только в первом проходе.
- Первый проход не создаёт assignment-level YAML, audit или аннотации; допустимы только краткоживущие значения отдельного свойства, необходимые существующим преобразователям.
- Первый проход не вызывает валидаторы, не ищет цели в неполном индексе и не принимает решений `!xml/*`.
- Полный facts-only вклад буквально совпадает со старым полным YAML-путём по targets, owners, fields, forms, logical addresses и записям dependency-индекса.
- Все межфайловые решения принимаются до второго прохода; локальные решения принимаются в памяти до записи файла.
- Каждый итоговый YAML-файл записывается ровно один раз и после записи не перечитывается для исправления аннотаций.
- Packed XML не передаётся координатору и не копируется между worker.
- Новые применения `!xml`, изменения публичного YAML/XML и увеличение числа worker не допускаются.
- Production-код пишется только после падающей проверки соответствующего договора.
- После каждого слоя выполняется `pnpm duplicates -- --base 5020f2369c43085f1e1919e1f51624eef6223432`.

## Текущее состояние исполнения

Tasks 1–7 уже представлены коммитами `225905866`, `ffbca9209`, `f545cd210`, `cd76a0723`, `2c26faedc`, `f463af215`, `a6de3886f`, `5f288c9dc` и `26b135af0`. Их diff остаётся в области финальной сверки, но повторно выполнять завершённые шаги не требуется. После уточнения спецификации коммитом `227c44b50` обязательным следующим слоем является Task 8; Task 9 выполняется только после его проверок на `cf/doc`.

---

### Task 1: Терминальное ожидание фоновой MCP-операции

**Files:**
- Modify: `.agents/tools/mcp/call.mjs`
- Modify: `.agents/tools/mcp/call.test.mjs`
- Test: `packages/mcp/src/callScript.integration.test.ts`

**Interfaces:**
- Consumes: `createMcpToolSession().call(toolName, args)` и публичные `nkdk.get_operation` / `nkdk.cancel_operation`.
- Produces: `callMcpToolToCompletion(session, toolName, args, options)`; возвращает терминальный MCP response и вложенный operation result.

- [ ] **Step 1: Написать падающие unit-тесты переходов операции**

Добавить табличные снимки полного публичного формата, включая identity, timestamps и messages:

```js
test("ждёт accepted до succeeded и возвращает вложенный result", async () => {
  const session = scriptedSession([
    accepted("op-1"),
    snapshot("queued"),
    snapshot("running"),
    snapshot("succeeded", { result: { ok: true, succeeded: 3, failed: [] } }),
  ])
  const completed = await callMcpToolToCompletion(session, "nkdk.import_from_xml", { projectDir: "/p" }, {
    wait: async () => undefined,
  })
  assert.deepEqual(completed.payload, { ok: true, succeeded: 3, failed: [] })
  assert.deepEqual(session.toolNames(), [
    "nkdk.import_from_xml",
    "nkdk.get_operation",
    "nkdk.get_operation",
    "nkdk.get_operation",
  ])
})
```

Отдельными тестами покрыть `failed`, `cancelled`, `interrupted`, malformed snapshot, вложенный `ok:false`, недопустимый `failed`, разрешённый `project_validation`, abort с единственным `nkdk.cancel_operation` и ошибку закрытого транспорта.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run: `node --test .agents/tools/mcp/call.test.mjs`

Expected: FAIL с отсутствующим export `callMcpToolToCompletion`.

- [ ] **Step 3: Реализовать общий waiter**

Добавить договор без зависимости от process signals:

```js
export async function callMcpToolToCompletion(
  session,
  toolName,
  args,
  {
    signal,
    pollIntervalMs = 100,
    wait = (delay, waitSignal) => setTimeout(delay, undefined, { signal: waitSignal }),
  } = {},
) {
  const started = await session.call(toolName, args)
  if (started.payload?.status !== "accepted") return checkedCompletion(toolName, started)

  const identity = {
    projectDir: started.payload.projectDir,
    operationId: started.payload.operationId,
  }
  const cancel = () => session.call("nkdk.cancel_operation", identity)
  const disposeAbort = bindAbort(signal, cancel)
  try {
    for (;;) {
      signal?.throwIfAborted()
      const lookup = await session.call("nkdk.get_operation", identity)
      const snapshot = requireOperationSnapshot(lookup.payload, identity)
      if (snapshot.status === "queued" || snapshot.status === "running") {
        await wait(pollIntervalMs, signal)
        continue
      }
      return terminalOperationResult(toolName, lookup.result, snapshot)
    }
  } finally {
    disposeAbort()
  }
}
```

`terminalOperationResult` обязан проверять terminal status и применять существующий `operationFailed` уже к `snapshot.result`. Ошибки должны содержать operation id, status и server error code.

Abort-ветка отправляет `nkdk.cancel_operation` ровно один раз, затем до 2 секунд ждёт терминальный снимок через тот же `nkdk.get_operation`. Истечение срока или закрытие транспорта не маскирует исходную отмену; listener снимается до закрытия сессии.

- [ ] **Step 4: Обновить CLI `main()`**

Обычный `call.mjs` должен использовать `callMcpToolToCompletion`, записывать в `--output` вложенный итоговый result, а в `--response-log` — последний MCP response. `accepted` больше не считается успехом.

- [ ] **Step 5: Запустить unit и MCP integration tests**

Run: `node --test .agents/tools/mcp/call.test.mjs`

Run: `pnpm --filter @nkdk/mcp exec vitest run --config vitest.config.ts --project integration src/callScript.integration.test.ts`

Expected: PASS; тест с реальным stdio подтверждает, что CLI остаётся подключён до `succeeded`.

- [ ] **Step 6: Проверить дубли и закоммитить**

```bash
pnpm duplicates -- --base 5020f2369c43085f1e1919e1f51624eef6223432
git add .agents/tools/mcp/call.mjs .agents/tools/mcp/call.test.mjs packages/mcp/src/callScript.integration.test.ts
git commit -m "fix: :bug: дождаться завершения MCP-операции"
```

### Task 2: Одна compiled MCP-сессия для round-trip и profile

**Files:**
- Create: `.agents/tools/mcp/build-compiled.mjs`
- Create: `.agents/skills/round-trip-yaml/mcp-round-trip.mjs`
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`
- Modify: `.agents/skills/round-trip-yaml/round-trip.test.mjs`
- Modify: `.agents/skills/import-profile/import-profile.mjs`
- Modify: `.agents/skills/import-profile/import-profile.test.mjs`

**Interfaces:**
- Consumes: `callMcpToolToCompletion` из Task 1.
- Produces: `buildCompiledMcp()` и `runMcpRoundTrip(manifest, dependencies)`; manifest содержит все компоненты одного запуска, а import и sync каждого компонента выполняются строго последовательно в одной сессии.

- [ ] **Step 1: Написать падающий тест последовательности round-trip**

```js
test("не запускает sync до terminal import и переиспользует сессию", async () => {
  const events = []
  const result = await runMcpRoundTrip({ components: [component("cf"), component("cfe/Дополнение")] }, {
    buildMcp: () => events.push("build"),
    createSession: async () => fakeSession(events),
    callToCompletion: async (_session, tool, args) => {
      events.push(`${tool}:${args.componentPath}`)
      return { payload: successPayload(tool) }
    },
  })
  assert.deepEqual(events, [
    "build",
    "session",
    "nkdk.import_from_xml:cf",
    "nkdk.sync_to_xml:cf",
    "nkdk.import_from_xml:cfe/Дополнение",
    "nkdk.sync_to_xml:cfe/Дополнение",
    "close",
  ])
  assert.equal(result.components.length, 2)
})
```

Добавить случай terminal import failure: sync отсутствует, сессия закрыта, ошибка содержит componentPath.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run: `node --test .agents/skills/round-trip-yaml/round-trip.test.mjs`

Expected: FAIL с отсутствующим `mcp-round-trip.mjs`.

- [ ] **Step 3: Вынести compiled build и реализовать manifest runner**

`build-compiled.mjs` выполняет `pnpm --filter @nkdk/mcp build` из repo root и проверяет `packages/mcp/dist/bin/nkdk-mcp` и worker bundle. `mcp-round-trip.mjs` экспортирует `runMcpRoundTrip` и имеет CLI `--manifest path --output path`; одна сессия создаётся с `{serverMode:"compiled"}`.

Manifest entry:

```js
{
  xmlDir,
  yamlDir,
  xmlOutputDir,
  projectDir,
  componentPath,
  importOutputPath,
  syncOutputPath,
}
```

Runner передаёт `allowWrite:true` в import и `allowWrite:true, ignoreValidationErrors:true` в sync. На SIGINT/SIGTERM AbortController отменяет текущую операцию через Task 1.

- [ ] **Step 4: Перевести shell на один manifest**

`round-trip.sh` сначала подготавливает YAML/XML temp-каталоги и symlink всех `RUN_DIRS`, затем один раз запускает `mcp-round-trip.mjs`. Только после успешного terminal результата всех стадий shell заменяет исходные XML-каталоги и собирает diff. Старые отдельные вызовы `call.mjs` удалить.

- [ ] **Step 5: Перевести import-profile на waiter и общий build**

В `runProfile` заменить `session.call` на внедряемый `callToCompletion`, экспортировать `buildCompiledMcp` из общего helper и измерять elapsed вокруг terminal вызова. `takeStderr()` вызывается после terminal result каждого прогона; одна сессия остаётся на все runs.

- [ ] **Step 6: Запустить тесты инструментов**

Run: `node --test .agents/tools/mcp/call.test.mjs .agents/skills/round-trip-yaml/round-trip.test.mjs .agents/skills/import-profile/import-profile.test.mjs`

Expected: PASS; тесты утверждают наблюдаемую последовательность и результаты, а не строки shell-исходника.

- [ ] **Step 7: Проверить дубли и закоммитить**

```bash
pnpm duplicates -- --base 5020f2369c43085f1e1919e1f51624eef6223432
git add .agents/tools/mcp .agents/skills/round-trip-yaml .agents/skills/import-profile
git commit -m "fix: :bug: выполнить round-trip в одной MCP-сессии"
```

### Task 3: MessagePack codec и worker-local packed store

**Files:**
- Modify: `packages/rules/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `packages/rules/metadata/importFromXml/packedXmlAssignment.ts`
- Create: `packages/rules/metadata/importFromXml/packedXmlAssignment.test.ts`

**Interfaces:**
- Consumes: `XmlDocument`, `ImportXmlInput`, `ValidationProfiler`.
- Produces: `PackedXmlAssignmentStore` с `put`, `take`, `release`, `clear`, `stats`; buffer никогда не выходит из worker.

- [ ] **Step 1: Добавить падающие codec/store tests**

```ts
it("сохраняет XmlDocument и общую identity compatibilityValue", () => {
  const source = parseXmlDocumentWithSaxes('<Root id="7"><Child/><Child>текст</Child></Root>', {
    preserveXsiNil: true,
  })
  const store = createPackedXmlAssignmentStore()
  store.put("a", [{ input: { role: "metadata", sourcePath: "/a.xml" }, document: source }])
  const restored = store.take("a")[0]!.document
  expect(restored.roots[0]!.structuralHash).toBe(source.roots[0]!.structuralHash)
  expect(restored.roots[0]!.compatibilityValue).toBe(restored.compatibility.Root)
  expect(store.stats()).toEqual({ assignments: 0, bytes: 0 })
})
```

Отдельно проверить PI, `xsi:nil`, empty element, повторные элементы, `BigInt`, corrupted payload, duplicate id, unknown id и `clear()`.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata metadata/importFromXml/packedXmlAssignment.test.ts`

Expected: FAIL из-за отсутствующего модуля.

- [ ] **Step 3: Добавить прямую зависимость и codec**

Добавить `"msgpackr": "^1.12.1"` в dependencies `@nkdk/rules`, затем `pnpm install`.

До фиксации настроек выполнить одноразовый измерительный тест на документах `/Users/nikita/git/round-trip-compact/cf/doc`: сравнить минимум `pack/unpack`, `Packr({useRecords:true})` и `Packr({structuredClone:true,useRecords:true})` по суммарному размеру, времени pack/unpack и Peak RSS. Проверить identity общего `compatibility` после unpack. Результаты записать в commit body или итоговый отчёт, но не добавлять машинно-зависимый отчёт в git. Выбрать самый компактный вариант, который сохраняет все значения и общие ссылки; следующий код показывает базового кандидата, а не заранее заданный победивший вариант.

Реализовать:

```ts
export interface PackedImportXmlInput {
  readonly input: ImportXmlInput
  readonly document: XmlDocument
}

export interface PackedXmlAssignmentStore {
  put(assignmentId: string, inputs: readonly PackedImportXmlInput[]): void
  take(assignmentId: string): PackedImportXmlInput[]
  release(assignmentId: string): void
  clear(): void
  stats(): { readonly assignments: number; readonly bytes: number }
}

const codec = new Packr({ structuredClone: true, useRecords: true })
```

Payload содержит `{version:1, inputs}`. `take` сначала удаляет buffer из Map, затем распаковывает и проверяет версию/форму; это гарантирует освобождение и при corrupted data. Профиль записывает `MessagePack pack`, `MessagePack unpack`, `Удерживаемый packed XML` с items/bytes.

- [ ] **Step 4: Запустить тесты и type-check пакета**

Run: `pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata metadata/importFromXml/packedXmlAssignment.test.ts`

Run: `pnpm --filter @nkdk/rules type-check`

Expected: PASS.

- [ ] **Step 5: Проверить дубли и закоммитить**

```bash
pnpm duplicates -- --base 5020f2369c43085f1e1919e1f51624eef6223432
git add packages/rules/package.json pnpm-lock.yaml packages/rules/metadata/importFromXml/packedXmlAssignment.ts packages/rules/metadata/importFromXml/packedXmlAssignment.test.ts
git commit -m "feat: :sparkles: сохранить XML-задания в MessagePack"
```

### Task 4: Полный facts-only обход rules.ts без assignment-level YAML

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/importYamlTypes.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataItem/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Create: `packages/rules/metadata/importFromXml/prepareFacts.ts`
- Create: `packages/rules/metadata/importFromXml/prepareFacts.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/validationContribution.ts`
- Modify: `packages/rules/metadata/importFromXml/validationContribution.test.ts`
- Modify: `packages/rules/metadata/importFromXml/ownerFacts.ts`

**Interfaces:**
- Consumes: уже разобранные `PackedImportXmlInput[]`, существующие rule plans, property converters и общие анализаторы зависимых значений.
- Produces: `PreparedImportFacts`; тот же полный семантический вклад, который импорт из `5020f2369c43085f1e1919e1f51624eef6223432` получает после построения полного YAML, без assignment-level YAML/audit/annotations.

- [ ] **Step 1: Написать падающий equivalence test на реальных фикстурах**

Для configuration, applied object, form, external property и extension fixture выполнить старый полный `prepareImportYaml(...proofDetail:"roots")`, извлечь его окончательный семантический вклад, затем выполнить новый `prepareImportFacts({inputs})`. Сравнить буквально:

```ts
expect(facts.configurationFragment).toEqual(legacyCollector.fragment(assignment.targetProjectPath))
expect(normalizeContribution(facts.validationContribution)).toEqual(
  normalizeContribution(extractImportValidationContribution({ prepared: legacy, projectDir, file })),
)
expect(facts.generatedFiles).toEqual(legacy.generatedFiles)
expect(normalizeSemanticFacts(facts)).toEqual(normalizeSemanticFacts(legacy))
expect(facts).not.toHaveProperty("yaml")
expect(facts).not.toHaveProperty("annotations")
expect(facts).not.toHaveProperty("proofAudit")
```

`normalizeSemanticFacts` обязан включать targets, owners, fields, forms, logical addresses, pending references, pending checks и dependencies. Инструментировать converter output sink и проверить, что root YAML mapping не создаётся в `mode:"facts"`.

- [ ] **Step 2: Запустить test и подтвердить RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/importFromXml/prepareFacts.integration.test.ts`

Expected: FAIL с отсутствующим `prepareImportFacts`.

- [ ] **Step 3: Добавить facts execution mode в runtime traversal**

Расширить только runtime execution contract, не `PropertyRule`:

```ts
export type DirectImportMode = "yaml" | "facts"

export interface DirectImportTraversal<Execution = unknown> {
  readonly mode?: DirectImportMode
  // существующие поля без изменения
}
```

В `importPropertiesFromXMLToYAML` вынести запись результата в внутренний output port. YAML-port выполняет прежний `Object.assign/copyYAMLRuntimeMetadata`; facts-port:

- выполняет XML plan, fromXML, metadata-target translation и collectors семантического/dependency-индексов без вызова валидаторов;
- передаёт `exportedYamlValue` в `LocalIndexesCollector`;
- сохраняет только краткоживущую семантическую проекцию значений, необходимую следующему свойству, member-index contributors и формированию dependency-записей;
- не создаёт root result mapping, audit, annotations, deferred paths и post-import augmenter;
- пропускает YAML-only defaults, если значение не требуется configuration/dependency facts;
- для nested collection разрешает краткоживущий value одного свойства, но не удерживает документ после `acceptProperty/acceptItem`.

Формы используют тот же `mode:"facts"`. Первый проход сохраняет индекс путей и dependency-записи `ClientApplicationForm`, но не выполняет их проверку. Вложенный `MetadataCommonForm` не создаёт вклад самостоятельной `ClientApplicationForm` и сохраняет ровно те же owner/targets, что старый импорт.

- [ ] **Step 4: Реализовать `PreparedImportFacts`**

```ts
export interface PreparedImportFacts {
  readonly assignment: ImportAssignment
  readonly rule: MetadataItemRule
  readonly targetProjectPath: string
  readonly localIndexes: LocalIndexes
  readonly configurationFragment: ConfigurationIndexBlockFragment
  readonly validationContribution: ImportValidationContribution
  readonly generatedFiles: readonly ExternalFileEntry[]
  readonly reconstructionFacts: {
    readonly rootPropertyValues: Readonly<Record<string, unknown>>
  }
  readonly semanticProjection: Readonly<Record<string, unknown>>
  readonly pendingChecks: readonly ValidationPendingCheck[]
}
```

`prepareImportFacts` получает готовые documents, создаёт `ConfigurationIndexCollector` и local fact collector, разрешает rule/owner context и запускает traversal в facts mode. `extractImportValidationContributionFromFacts` строит `ImportValidationContribution` непосредственно из facts. Краткоживущая `semanticProjection` нужна только до завершения first-pass assignment: она не сериализуется, не попадает в binary result координатора и освобождается после построения вклада.

- [ ] **Step 5: Перевести validation contribution на fact model**

Добавить `extractImportValidationContributionFromFacts`. Metadata targets берутся из `localIndexes.metadata.metadataTargets`, owner fields — из `ownerFacts`, form member — из topology file. Addressable objects/logical addresses строятся по `LocalMetadataEvent(kind:"item")`, `rulePath`, `itemType` и `name`, а не обходом YAML. Member-index contributors получают полную вложенную семантическую проекцию; `rootPropertyValues` используется только как совместимый fallback. Кандидаты зависимых значений формируют те же dependency-записи, что старый полный YAML, включая `fillValue` для `DefinedType`, но не запускают их проверку. Metadata targets с режимом `translateOnly` остаются доступны для перевода и поиска ссылок, но не включаются в очередь проверки существования.

Сохранить прежнюю функцию как test oracle до завершения equivalence tests.

- [ ] **Step 6: Получить GREEN на equivalence matrix**

Run: `pnpm --filter @nkdk/runtime test:isolated`

Run: `pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata metadata/importFromXml/validationContribution.test.ts`

Run: `pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/importFromXml/prepareFacts.integration.test.ts`

Expected: PASS, contributions одинаковы.

- [ ] **Step 7: Проверить дубли и закоммитить**

```bash
pnpm duplicates -- --base 5020f2369c43085f1e1919e1f51624eef6223432
git add packages/runtime/metadata/ruleRuntime packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.ts packages/rules/metadata/importFromXml
git commit -m "feat: :sparkles: собрать факты импорта без YAML"
```

### Task 5: Закреплённый двухпроходный worker и окончательный YAML

**Files:**
- Modify: `packages/rules/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/rules/metadata/importFromXml/workerPool.ts`
- Modify: `packages/rules/metadata/workerPool/importContracts.ts`
- Modify: `packages/rules/metadata/importFromXml/binaryResult.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/workerPool.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.integration.test.ts`

**Interfaces:**
- Consumes: `PreparedImportFacts`, `PackedXmlAssignmentStore`, глобальные read tokens и reconstruction profile.
- Produces: два worker passes; второй получает assignment только исходного worker, строит и записывает окончательный YAML один раз, затем освобождает packed XML.

- [ ] **Step 1: Написать падающие worker/pool tests**

Проверить четыре наблюдаемых договора:

```ts
it("второй проход возвращает каждое задание исходному worker", async () => {
  await pool.runFirstPass(assignmentsWithWeights([100, 1, 90, 2]))
  await pool.runSecondPass(readTokens(2), profile, sink, decisions)
  expect(pools.assignmentIds(0, "secondPassBatch")).toEqual(["a", "c"])
  expect(pools.assignmentIds(1, "secondPassBatch")).toEqual(["b", "d"])
})
```

- first-pass binary result не содержит prepared payload;
- после каждого second-pass assignment `packedStore.stats().assignments` уменьшается;
- `dispose`, exception и abort очищают store;
- command union не содержит third-pass commands, а coordinator вызывает только first/second.

- [ ] **Step 2: Запустить tests и подтвердить RED**

Run: `pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/importFromXml/workerPool.integration.test.ts metadata/importFromXml/worker.integration.test.ts metadata/importFromXml/importConfiguration.integration.test.ts`

Expected: FAIL на dynamic second-pass scheduling и third-pass calls.

- [ ] **Step 3: Читать полный XML один раз и удерживать packed buffer**

Экспортировать из `prepareYaml.ts` `readImportXmlDocuments`, принимающий assignment и возвращающий `PackedImportXmlInput[]`. Первый проход worker:

1. читает/разбирает full `XmlDocument` с `preserveXsiNil` и `AdditionalFields`;
2. вызывает `prepareImportFacts` на этих объектах;
3. `packedStore.put(assignment.id, inputs)`;
4. очищает ссылки на unpacked inputs в `finally`;
5. возвращает только diagnostics, files, configuration fragment и project-state fact contribution.

Удалить `PreparedImportBinaryRecord` из import batch transport; `preparedImportStore` больше не открывается coordinator/worker для XML-import.

- [ ] **Step 4: Подготовить глобальные dependency decisions до второго прохода**

First-pass facts должны записать полный, доказанно эквивалентный старому YAML-пути dependency-индекс вместе с object/member/owner indexes, ничего не проверяя. После `commitWorkingIndex()` coordinator фиксирует semantic index, отдельной стадией выполняет dependency validation и классифицирует decisions до `runSecondPass`. Если equivalence matrix не проходит, второй проход не считается готовым к запуску.

Изменить begin command:

```ts
{
  kind: "beginSecondPass"
  readToken: ProjectStateReadToken
  composition: readonly ImportControlCompositionEntry[]
  exportProfile: XmlComponentExportProfile
  issueDecisions: readonly ImportProjectIssueDecision[]
}
```

Root extension reconstruction fact заменяет чтение preliminary root YAML: `configurationExtensionTypeDescriptionXMLNameByType` получает импортированное facts-only значение compatibility mode через отдельную чистую функцию.

- [ ] **Step 5: Сделать второй проход окончательным**

Worker вызывает `packedStore.take(assignmentId)`, строит полный `PreparedImportYaml` из уже разобранных documents через новый `prepareImportYamlFromDocuments`, применяет заранее полученные `issueDecisions`, выполняет control export и локальную validation, затем сериализует и записывает окончательный YAML ровно один раз вместе с final state. Локальная проверка может повторно сериализовать ещё не записанный объект в памяти, но не читает и не перезаписывает YAML на диске. `finally` вызывает `packedStore.release(assignmentId)` и удаляет decoded tree references.

Удалить `finalizedYaml`, `processThirdPass`, third-pass commands/phases и повторный read/parse YAML. В pool удалить dynamic weighted queue: использовать `assignmentIdsByWorker` первого прохода и fixed batches.

- [ ] **Step 6: Получить GREEN на worker/coordinator tests**

Run: `pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/importFromXml/workerPool.integration.test.ts metadata/importFromXml/worker.integration.test.ts metadata/importFromXml/importConfiguration.integration.test.ts`

Run: `pnpm --filter @nkdk/rules type-check`

Expected: PASS; профили содержат только первый и второй worker pass.

- [ ] **Step 7: Проверить дубли и закоммитить**

```bash
pnpm duplicates -- --base 5020f2369c43085f1e1919e1f51624eef6223432
git add packages/rules/metadata/importFromXml packages/rules/metadata/workerPool/importContracts.ts
git commit -m "refactor: :recycle: выполнить импорт XML в два прохода"
```

### Task 6: Прямой XmlDocument результата toXML и anomaly proof без reread

**Files:**
- Create: `packages/runtime/xml/export/document.ts`
- Create: `packages/runtime/xml/export/document.test.ts`
- Modify: `packages/runtime/index.ts`
- Modify: `packages/runtime/xml/export/structure.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Modify: `packages/rules/metadata/importFromXml/anomalyProof.test.ts`

**Interfaces:**
- Consumes: finalized object returned by toXML и retained source `XmlDocument` из Task 5.
- Produces: `xmlObjectDocument(value): XmlObjectDocumentResult`; direct structural tree с теми же hashes/paths, без XML string.

- [ ] **Step 1: Написать падающие runtime tests object → document**

Сравнить `xmlObjectDocument(value).document.roots` с `parseXmlDocumentWithSaxes(xmlExport(value), options).roots` для:

- attributes/text/empty elements;
- repeated children и `XML_ORDERED_CHILDREN`;
- mixed content;
- processing instructions;
- multiple roots и `xsi:nil`.

Сравнивать нормализованные `name`, `occurrence`, `path`, attributes, content order и `structuralHash`; spans/id сравнивать только на корректность и уникальность.

- [ ] **Step 2: Запустить test и подтвердить RED**

Run: `pnpm --filter @nkdk/runtime exec vitest run --config vitest.config.ts xml/export/document.test.ts`

Expected: FAIL с отсутствующим `xmlObjectDocument`.

- [ ] **Step 3: Реализовать единый object walker**

`xmlObjectDocument` использует `normalizeXmlObjectForExport` и `getXmlOrderedChildren`, создаёт addressed nodes напрямую, вычисляет hashes через `hashXmlElementStructure`, назначает synthetic spans `{start:0,end:0}` и сохраняет compatibility identity. `xmlObjectRootStructures` становится дешёвой проекцией результата того же walker, чтобы hash и detailed tree не расходились.

- [ ] **Step 4: Перевести control export на object document**

`PreparedAssignmentControlDocument` получает ленивый `document()` рядом с `roots`; direct path не вызывает `materializeXml`. В `executeImportControlExport` при root mismatch использовать `control.document()` и retained source documents из audit/source map. Удалить `parseXmlDocumentWithSaxes(control.materializeXml())`, `readSource`, `loadDetailedImport` и счётчик detailed rereads.

`proveXmlAnomalyBoundaries` принимает исходные documents напрямую и читает raw spans из них; exported synthetic spans для raw не используются.

- [ ] **Step 5: Получить GREEN на runtime и proof tests**

Run: `pnpm --filter @nkdk/runtime test:isolated`

Run: `pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata metadata/importFromXml/anomalyProof.test.ts`

Run: `pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration metadata/importFromXml/controlExport.integration.test.ts`

Expected: PASS; test spy подтверждает ноль serializer/parser/readSource при mismatch.

- [ ] **Step 6: Проверить дубли и закоммитить**

```bash
pnpm duplicates -- --base 5020f2369c43085f1e1919e1f51624eef6223432
git add packages/runtime packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts packages/rules/metadata/importFromXml
git commit -m "perf: :zap: сравнить XML без сериализации"
```

### Task 7: Профиль стадий, `cf/doc` и итоговый ERP-контроль

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `.agents/skills/import-profile/import-profile.mjs`
- Modify: `.agents/skills/import-profile/import-profile.test.mjs`
- Modify: `.agents/skills/import-profile/SKILL.md`
- Modify: `.agents/skills/round-trip-yaml/SKILL.md`

**Interfaces:**
- Consumes: profile events новых stages.
- Produces: стабильные JSON-поля MessagePack/toXML и достоверные terminal timings.

- [ ] **Step 1: Написать падающий profile summary test**

Добавить события и ожидаемые поля:

```js
expect(summarizeImportSteps(steps, 500)).toMatchObject({
  xmlParseMs: 10,
  factsOnlyMs: 11,
  messagePackMs: 12,
  messageUnpackMs: 13,
  packedBytes: 4096,
  toXmlObjectMs: 14,
  toXmlFinalizeMs: 15,
  directHashMs: 16,
  mismatchDocumentMs: 17,
  anomalyProofMs: 18,
})
```

- [ ] **Step 2: Запустить test и подтвердить RED**

Run: `node --test .agents/skills/import-profile/import-profile.test.mjs`

Expected: FAIL из-за отсутствующих summary fields.

- [ ] **Step 3: Добавить профильные события**

Расширить `YAMLToXMLProfile` timing counters без изменения rule contracts: planning, property conversion, deferred finalization, direct fingerprint, addressed mismatch tree. Worker отдельно пишет parse, facts-only, MessagePack pack/unpack, retained packed bytes, anomaly proof и release checkpoints.

- [ ] **Step 4: Запустить целевые и пакетные проверки**

Run: `node --test .agents/skills/import-profile/import-profile.test.mjs`

Run: `pnpm type-check`

Run: `pnpm test:architecture`

Expected: PASS.

- [ ] **Step 5: Выполнить compiled import и round-trip на `cf/doc`**

Run:

```bash
node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/round-trip-compact/cf/doc \
  /private/tmp/nkdk-import-doc \
  --runs 2 --json
```

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5 --start-index 1
```

Expected: terminal import/sync results; импорт создаёт 9 937 результатов, 0 ошибок и то же единственное предупреждение, что старый импорт из base SHA; отсутствуют 131 лишний тег ссылок, 12 нетегированных несовместимых FillValue и каскад CommonForm; нет новых diagnostics/diff; source read counter equals number of XML inputs, detailed rereads = 0. Записать cold/warm elapsed, Peak RSS, packed bytes и toXML breakdown в implementation commit body или итоговый отчёт; не добавлять machine-specific report в git.

- [ ] **Step 6: Выполнить полный repository gate**

Run: `pnpm type-check`

Run: `pnpm test`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Run: `pnpm duplicates -- --base 5020f2369c43085f1e1919e1f51624eef6223432`

Expected: все команды exit 0.

- [ ] **Step 7: Выполнить ERP acceptance**

Сначала обычный compiled import без event-by-event memory profiling для Peak RSS, затем отдельный stage profile:

```bash
node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/round-trip-compact/cf/erp \
  /private/tmp/nkdk-import-erp \
  --runs 1 --concurrency 4 --json
```

Expected: 38 455 успешных заданий, 0 ошибок, согласованный набор предупреждений, Peak RSS ≤ 4096 МиБ, elapsed < 1 224 062 мс, detailed rereads = 0.

Затем выполнить `round-trip-yaml` на ERP только если import acceptance прошёл; сохранить число diff и сравнить с согласованным baseline.

- [ ] **Step 8: Обновить skill-документацию и закоммитить**

Документация должна явно говорить, что runner собирает текущий MCP, ждёт terminal operation result и не запускает sync после неуспешного import.

```bash
git add packages/runtime/metadata/ruleRuntime/property packages/rules/metadata/importFromXml .agents/skills/import-profile .agents/skills/round-trip-yaml
git commit -m "perf: :zap: измерить двухпроходный импорт XML"
```

### Task 8: Восстановить индексную эквивалентность facts-only

**Files:**
- Modify: `packages/rules/metadata/importFromXml/prepareFacts.ts`
- Modify: `packages/rules/metadata/importFromXml/prepareFacts.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/validationContribution.ts`
- Modify: `packages/rules/metadata/importFromXml/validationContribution.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify as required: общий анализатор зависимых YAML-значений и его тесты без изменения публичных rule contracts

**Interfaces:**
- Consumes: краткоживущие property facts, существующие member-index contributors, dependent candidates и общий анализатор project references/checks.
- Produces: полный first-pass semantic contribution, эквивалентный старому полному YAML-пути, и окончательный второй проход без чтения/перезаписи записанного YAML.

- [ ] **Step 1: Зафиксировать три регрессии падающими тестами**

Добавить проверки на реальных или минимальных неизменяемых XML-фикстурах:

1. `MetadataCommonForm` не создаёт standalone `ClientApplicationForm` form index/data-path pending checks; её owner/targets буквально совпадают со старым путём.
2. Вложенная ссылка вида `ТабличнаяЧасть.…СтандартныйРеквизит.Ссылка` с договором `translateOnly` не становится заданием проверки существования и не получает дополнительный `!xml/invalid`.
3. Для реквизита с `DefinedType` first pass содержит ту же индексную запись `fillValue`, а отдельная проверка после барьера назначает несовместимому значению существующее решение `!xml/invalid` для второго прохода.

Во всех трёх случаях oracle строится старым полным `prepareImportYaml` и существующим извлечением семантического вклада, а не текущим provisional import state.

- [ ] **Step 2: Запустить тесты и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration \
  metadata/importFromXml/prepareFacts.integration.test.ts \
  metadata/importFromXml/worker.integration.test.ts
```

Expected: FAIL отдельно демонстрирует каскад CommonForm, лишнее задание проверки `translateOnly` и отсутствие индексной записи `fillValue`/решения.

- [ ] **Step 3: Ограничить form facts фактическим типом правила**

Запускать сбор form index и data-path checks только для `ClientApplicationFormRules.itemType`. `MetadataCommonForm` использует обычный metadata-вклад собственного правила и не наследует standalone-проверки вложенной формы. Не добавлять проверок по XML-root name в нейтральные слои.

- [ ] **Step 4: Не превращать `translateOnly` в задание проверки**

Сформировать из property facts краткоживущую nested-проекцию текущего задания для существующих contributors и переводчиков. Как в старом полном YAML-пути, metadata targets с `validation:"translateOnly"` не добавлять в pending references/dependency validation. Они остаются доступны структурному поиску и переводу ссылок. Проекция освобождается сразу после построения `ImportValidationContribution`.

- [ ] **Step 5: Собрать записи dependency-индекса общим анализатором**

Не дублировать семантику `FillValue` и других dependent properties в import worker. Сохранить candidates существующего dependent collector и общим построителем сформировать из них те же записи dependency-индекса, что полный YAML-путь. Включить записи в `PreparedImportFacts` и first-pass final contribution до `commitWorkingIndex()`, но не вызывать проверку до фиксации полного индекса.

- [ ] **Step 6: Применить все межфайловые решения во втором проходе до единственной записи**

`provisionalImportFinalContribution` использует объединённые facts-only pending checks, а coordinator классифицирует решения до `runSecondPass`. Worker применяет их к полному объекту YAML в памяти. Локальные решения принимаются до сериализации; после записи файла нет повторного чтения или исправляющей записи.

- [ ] **Step 7: Получить GREEN на эквивалентности и doc acceptance**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project core-metadata \
  metadata/importFromXml/validationContribution.test.ts
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts --project integration \
  metadata/importFromXml/prepareFacts.integration.test.ts \
  metadata/importFromXml/worker.integration.test.ts \
  metadata/importFromXml/importConfiguration.integration.test.ts
pnpm --filter @nkdk/rules type-check
```

Затем повторить compiled import и round-trip на `/Users/nikita/git/round-trip-compact/cf/doc`. Expected: 9 937 результатов, 0 ошибок, одно прежнее предупреждение, без трёх известных групп регрессий и без новых semantic/triage diff.

- [ ] **Step 8: Проверить дубли и закоммитить**

```bash
pnpm duplicates -- --base 5020f2369c43085f1e1919e1f51624eef6223432
git add packages/rules/metadata/importFromXml packages/rules/metadata/validation
git commit -m "fix: :bug: восстановить семантику первого прохода"
```

### Task 9: Полная сверка со спецификацией перед review

**Files:**
- Verify only: весь diff от base SHA, staged/unstaged/untracked status.

**Interfaces:**
- Consumes: все результаты Tasks 1–8.
- Produces: неизменяемое дерево для независимого reviewer.

- [ ] **Step 1: Повторно прочитать spec и plan полностью**

Составить локальную таблицу `requirement → file/test/evidence` для каждого раздела spec. Не добавлять её в git, если она не выявила документируемый пробел.

- [ ] **Step 2: Проверить отсутствие запрещённых остатков**

Run:

```bash
rg -n "beginThirdPass|thirdPassBatch|finishThirdPass|loadDetailedImport|Подробный повторный импорт XML" \
  packages/rules/metadata/importFromXml packages/rules/metadata/workerPool/importContracts.ts
```

Expected: 0 production matches; допустимы только явно обновлённые migration/test descriptions, если они проверяют отсутствие старого поведения.

Run: `git status --short --untracked-files=all`

Expected: нет implementation-related untracked files; рабочее дерево чистое после коммитов.

- [ ] **Step 3: Повторить final gate на точном review tree**

Run: `pnpm type-check && pnpm test`

Run: `pnpm test:architecture:rules && pnpm test:architecture`

Run: `pnpm duplicates -- --base 5020f2369c43085f1e1919e1f51624eef6223432`

Expected: exit 0 без изменения файлов.

- [ ] **Step 4: Передать полный результат независимому reviewer**

Передать reviewer:

- spec: `docs/superpowers/specs/2026-09-01-packed-xml-import-design.md`;
- plan: `docs/superpowers/plans/2026-09-01-packed-xml-import.md`;
- base: `5020f2369c43085f1e1919e1f51624eef6223432`;
- worktree: `/Users/nikita/git/nkdk/.worktrees/import-messagepack-design`;
- требование читать committed, staged, unstaged и implementation-related untracked changes.

Reviewer отвечает только `VERDICT`, `Findings`, `Verification gaps` по договору `executing-plans-with-review` и не изменяет файлы.
