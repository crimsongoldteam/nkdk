# XML Import Control Export Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сократить импорт `cf/doc` до 120 секунд при пике RSS не более 3,2 ГиБ, сохранив обязательный контекстный контрольный экспорт каждого задания.

**Architecture:** Первый проход сохраняет переносимую подготовленную запись задания в операционном хранилище и больше не закрепляет смысловое YAML-дерево за одним worker. После барьера индекса четыре worker получают задания из динамической очереди, восстанавливают связанные пути и вычисляют структурные хэши непосредственно из окончательного XML-объекта; сериализация и повторный XML-разбор остаются проверенным запасным путём.

**Tech Stack:** TypeScript 7, Vitest, Piscina worker, LMDB/projectState, `saxes`, `fast-xml-parser`, `@node-rs/xxhash`.

**Spec:** [2026-08-23-common-types-xml-anomaly-framework-design.md](../specs/2026-08-23-common-types-xml-anomaly-framework-design.md#производительность-контрольного-экспорта)

## Global Constraints

- Контрольный экспорт выполняется для каждого задания после фиксации рабочего индекса; пропуск по типу или PropertyRule запрещён.
- Прямой структурный хэш и путь `xmlExport → parseXmlRootStructuresWithSaxes` обязаны возвращать одинаковые имена, значения, порядок атрибутов, порядок детей, occurrences, пути и корневые хэши.
- Любая неподдержанная прямая конструкция использует запасной путь; она не считается совпадением автоматически.
- Подготовленная запись не содержит ссылок на объекты, экземпляров rules или функций. Отложенные значения хранятся как `valuePath` и `rulePath` и связываются заново после чтения.
- Результат задания публикуется только после успешного контрольного экспорта; ошибка версии, контрольной суммы или декодирования останавливает импорт.
- После задания освобождаются подготовленное YAML-дерево, подробный proof-аудит и построенное XML-представление.
- Существующие XML-фикстуры не изменять.
- `.agents/architecture.md` не изменять без отдельного согласования разработчика.
- После каждого завершённого слоя запускать `pnpm duplicates -- --base 91aeafb4d`.

---

## Task 1: Вычислять структуру экспортируемого XML без строки

**Files:**

- Create: `packages/runtime/xml/export/structure.ts`
- Create: `packages/runtime/xml/export/structure.test.ts`
- Modify: `packages/runtime/xml/export/exporter.ts`
- Modify: `packages/runtime/index.ts`

**Interfaces:**

- Consumes: объектный договор `xmlExport(value)` и `XmlRootStructure` из `xml/import/document.ts`.
- Produces:

  ```ts
  export type XmlRootFingerprint = Pick<XmlRootStructure, "name" | "path" | "structuralHash">

  export type XmlObjectStructureResult =
    | { readonly kind: "supported"; readonly roots: readonly XmlRootFingerprint[] }
    | { readonly kind: "unsupported"; readonly reason: string }

  export function xmlObjectRootStructures(value: unknown): XmlObjectStructureResult
  ```

- `XML_ORDERED_CHILDREN` и нормализация `ChildItems` становятся общими внутренними функциями exporter/structure, но не новым публичным форматом XML.

- [x] **Step 1: Зафиксировать равенство обычных объектов**

  В `structure.test.ts` добавить таблицу объектов: строковый лист, девять пробелов в `FillValue`, атрибуты `_xsi:type` и `_custom` в заданном порядке, пустой элемент, `xsi:nil`, массив повторных `xr:Item`, вложенные `Properties` и `#text` вместе с дочерним узлом. Для каждого поддержанного значения проверять:

  ```ts
  const direct = xmlObjectRootStructures(value)
  expect(direct.kind).toBe("supported")
  if (direct.kind !== "supported") return
  expect(direct.roots).toEqual(parseXmlRootStructuresWithSaxes(xmlExport(value)).roots)
  ```

- [x] **Step 2: Зафиксировать порядок forms/ChildItems**

  Добавить случай с `markXmlOrderedChildren` и повторными разными элементами `ChildItems`. Проверить точный порядок, occurrences и структурные хэши против `xmlExport`.

- [x] **Step 3: Зафиксировать честный запасной путь**

  Добавить конструкцию, для которой прямой обход пока не определён, и ожидать `{ kind: "unsupported" }`, а не неполный хэш. Начальный неподдержанный случай — XML processing instruction в произвольной позиции mixed content.

- [x] **Step 4: Запустить тесты и подтвердить ожидаемое падение**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit xml/export/structure.test.ts`

  Expected: FAIL, потому что `xmlObjectRootStructures` ещё не существует.

- [x] **Step 5: Реализовать единый нормализованный обход**

  Вынести из `exporter.ts` нормализацию `ChildItems`, чтение ordered children и правила группировки атрибутов в package-private функции. В `structure.ts` обходить тот же нормализованный объект, создавать `XmlStructuralAttribute`/`XmlStructuralContent`, считать occurrence среди одноимённых siblings и вызывать `hashXmlElementStructure`. Не сериализовать текст и атрибуты: хэш использует их исходные декодированные значения.

- [x] **Step 6: Проверить слой runtime**

  Run: `pnpm --filter @nkdk/runtime exec vitest run --project unit xml/export/structure.test.ts xml/export/exporter.test.ts xml/structure/hash.test.ts xml/import/document.test.ts`

  Run: `pnpm --filter @nkdk/runtime type-check`

  Run: `pnpm duplicates -- --base 91aeafb4d`

  Expected: PASS; прямой и строковый пути дают одинаковые структуры для всех поддержанных случаев.

- [x] **Step 7: Зафиксировать слой**

  Commit: `perf: :zap: считать структуру экспортируемого XML без строки`

---

## Task 2: Использовать ленивый контрольный документ

**Files:**

- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.integration.test.ts`

**Interfaces:**

- Consumes: `xmlObjectRootStructures(value)` из Task 1.
- Produces:

  ```ts
  export interface PreparedAssignmentControlDocument {
    readonly roots: readonly XmlRootStructure[]
    readonly mode: "direct" | "serialized"
    materializeXml(): string
  }

  export function buildPreparedAssignmentControlDocument(params: {
    readonly document: PreparedXMLDocument
    readonly context: ConfigurationContext
  }): PreparedAssignmentControlDocument
  ```

- [x] **Step 1: Написать падающий тест прямого пути**

  Подготовить документ без raw, вызвать `buildPreparedAssignmentControlDocument` и проверить `mode === "direct"`, равенство roots строковому пути и то, что счётчик тестового `xmlExport` остаётся нулевым до `materializeXml()`.

- [x] **Step 2: Написать падающий тест запасного пути**

  Подготовить неподдержанную Task 1 структуру и проверить `mode === "serialized"`; roots должны совпасть с `parseXmlRootStructuresWithSaxes(buildPreparedAssignmentXml(...))`.

- [x] **Step 3: Запустить тесты и подтвердить падение**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts metadata/importFromXml/controlExport.integration.test.ts`

  Expected: FAIL из-за отсутствующего построителя контрольного документа.

- [x] **Step 4: Отделить финализацию XML-объекта**

  В `xmlAnomalyAssignment.ts` выделить одну функцию, которая клонирует `document.xml`, заново связывает `document.deferred` и вызывает `finalizeExportedXmlValues`. `buildPreparedAssignmentXml` и новый контрольный построитель обязаны использовать один результат этой функции.

- [x] **Step 5: Перевести предварительное сравнение**

  В `controlExport.ts` заменить обязательные `buildPreparedAssignmentXml` и `parseXmlRootStructuresWithSaxes` на `buildPreparedAssignmentControlDocument`. Вызывать `materializeXml()` только при несовпадении исходных корневых хэшей или при `mode === "serialized"`; подробный raw-путь продолжает разбирать материализованный XML через `parseXmlDocumentWithSaxes`.

- [x] **Step 6: Проверить отсутствие ослабления raw**

  Сохранить существующие тесты неизвестного `<Item>`, обычного `xr:Item`, дополнительных документов, nested `#order` и явного `$xml: null`. Добавить утверждение, что несовпадение direct roots всё равно вызывает `loadDetailedImport` и создаёт прежний минимальный raw.

- [x] **Step 7: Проверить слой rules**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts metadata/importFromXml/controlExport.integration.test.ts`

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base 91aeafb4d`

  Expected: PASS; для обычного совпадающего задания строка XML не создаётся.

- [ ] **Step 8: Зафиксировать слой**

  Commit: `perf: :zap: убрать повторный разбор контрольного XML`

---

## Task 3: Сделать подготовленное задание переносимым

**Files:**

- Create: `packages/rules/metadata/importFromXml/preparedRecord.ts`
- Create: `packages/rules/metadata/importFromXml/preparedRecord.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/rules/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/deferredObjectValues.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/deferredObjectValues.test.ts`

**Interfaces:**

- Consumes: `snapshotXmlAnomalyAnnotations`, `restoreXmlAnomalyAnnotations`, `bindDeferredObjectValues`.
- Produces:

  ```ts
  export interface PreparedImportRecordV1 {
    readonly version: 1
    readonly assignment: ImportAssignment
    readonly yamlText: string
    readonly proofAudit: XmlAnomalyProofAudit
    readonly deferred: readonly DeferredValuePath[]
    readonly dependentDeferred: readonly ImportedDependentPropertyCandidate[]
    readonly ownerContext: readonly MetadataItemOwnerContextEntry[]
    readonly dependentOwner: { readonly dir: string; readonly name: string }
    readonly baseFormCandidate?: PreparedBaseFormRecordV1
    readonly ruleItemType: string
    readonly targetProjectPath: string
    readonly logicalAddress: string
    readonly checksum: bigint
  }

  export function encodePreparedImportRecord(record: Omit<PreparedImportRecordV1, "checksum">): Uint8Array
  export function decodePreparedImportRecord(bytes: Uint8Array): PreparedImportRecordV1

  export interface PreparedBaseFormRecordV1 {
    readonly baseProjectPath: string
    readonly targetProjectPath: string
    readonly owner: { readonly dir: string; readonly name: string }
    readonly yamlText: string
    readonly ruleItemType: string
    readonly deferred: readonly DeferredValuePath[]
    readonly configurationFragment: ConfigurationIndexBlockFragment
  }
  ```

- Derived second-pass values are rebuilt after decoding: `formDataPathIndex`
  через `createImportedFormDataPathIndex`, `validationFile` через
  `resolveValidationProjectFile`, rules через registry. Уже опубликованные в
  первом проходе `configurationFragment` и `indexContribution` основного файла
  в запись не дублируются.

- [ ] **Step 1: Зафиксировать отвязку deferred от объектов**

  Добавить в runtime функцию:

  ```ts
  export function deferredValuePaths(values: readonly DeferredObjectValue[]): DeferredValuePath[]
  ```

  Тест должен сериализовать возвращённые paths, создать новое YAML-дерево и успешно вызвать `bindDeferredObjectValues(newRoot, paths)`.

- [ ] **Step 2: Зафиксировать двоичный round-trip записи**

  В `preparedRecord.test.ts` создать запись со строкой из пробелов, явной двойной кавычкой, raw-аннотацией в `yamlText`, двумя deferred paths и proof roots. Проверить точный decode, версию и checksum.

  В ту же запись включить `ownerContext`, `dependentOwner` и
  `baseFormCandidate` с собственным YAML, deferred path и
  `configurationFragment`; проверить их точное восстановление.

- [ ] **Step 3: Зафиксировать ошибки записи**

  Проверить отдельными тестами неизвестную версию, изменённый байт payload и отсутствие зарегистрированного `ruleItemType`. Ожидаемые коды ошибок: `xml_import_prepared_version`, `xml_import_prepared_checksum`, `xml_import_prepared_rule`.

- [ ] **Step 4: Подтвердить падение**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/importFromXml/preparedRecord.test.ts metadata/ruleRuntime/property/deferredObjectValues.test.ts`

  Expected: FAIL из-за отсутствующего кодека и `deferredValuePaths`.

- [ ] **Step 5: Реализовать запись без объектных ссылок**

  Использовать стабильное двоичное кодирование с UTF-8 payload и xxhash64 по байтам до поля checksum. YAML сериализовать существующим `serializeImportYaml`, чтобы сохранить явные строки, mapping metadata и XML-аннотации; при чтении использовать штатный YAML-парсер и затем `bindDeferredObjectValues`.

- [ ] **Step 6: Проверить точный повторный YAML**

  Для результата decode проверить повторную сериализацию: текст листа из девяти пробелов, `$xml`, `$значение`, `!xml/invalid/N`, двойные кавычки и порядок mapping должны совпасть с исходной внутренней записью.

  Добавить интеграционные сценарии подготовки обычной формы и формы расширения:
  после decode заново получить rule, связать deferred, построить
  `formDataPathIndex` и `validationFile`; результат второго прохода должен
  совпасть с результатом существующего `DeferredImportYaml` до переноса.

- [ ] **Step 7: Проверить слой**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project unit metadata/importFromXml/preparedRecord.test.ts metadata/ruleRuntime/property/deferredObjectValues.test.ts`

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base 91aeafb4d`

  Expected: PASS.

- [ ] **Step 8: Зафиксировать слой**

  Commit: `feat: :sparkles: сделать подготовленный XML-импорт переносимым`

---

## Task 4: Добавить операционное хранилище подготовленных записей

**Files:**

- Create: `packages/rules/metadata/projectState/preparedImportStore.ts`
- Create: `packages/rules/metadata/projectState/preparedImportStore.integration.test.ts`
- Modify: `packages/rules/metadata/projectState/importSession.ts`
- Modify: `packages/rules/metadata/projectState/importSession.integration.test.ts`
- Modify: `packages/rules/metadata/projectState/service.ts`

**Interfaces:**

- Consumes: opaque `Uint8Array` из Task 3; projectState не знает схему записи.
- Produces:

  ```ts
  export interface PreparedImportRecordLocator {
    readonly assignmentId: string
    readonly weight: number
  }

  export interface PreparedImportStore {
    put(locator: PreparedImportRecordLocator, bytes: Uint8Array): Promise<void>
    read(assignmentId: string): Promise<Uint8Array>
    release(assignmentId: string): Promise<void>
    close(): Promise<void>
  }
  ```

- [ ] **Step 1: Написать падающий тест жизненного цикла**

  Создать import session, записать две записи, прочитать их из независимых handles, освободить одну и проверить, что повторное чтение даёт `xml_import_prepared_missing`. После `finalize` временная LMDB и её lock-файлы должны отсутствовать.

- [ ] **Step 2: Написать падающий тест abort**

  После `session.abort(new Error("boom"))` проверить удаление хранилища и возможность начать следующий import в том же проекте.

- [ ] **Step 3: Подтвердить падение**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/projectState/preparedImportStore.integration.test.ts metadata/projectState/importSession.integration.test.ts`

  Expected: FAIL, потому что import session ещё не предоставляет prepared store.

- [ ] **Step 4: Реализовать изолированную LMDB**

  Создавать хранилище внутри временного каталога текущей import operation, использовать один writer и независимые read transactions. Ключ — UTF-8 `assignmentId`; значение — непрозрачные bytes. `release` удаляет запись после успешной публикации второго прохода. `close`, `finalize` и `abort` идемпотентно закрывают LMDB до удаления каталога.

- [ ] **Step 5: Не смешивать запись с постоянным projectState**

  Prepared store не входит в checkpoint, read token, dependency validation или итоговый снимок. `ProjectStateImportSession` только владеет его временем жизни и выдаёт worker путь/дескриптор операции.

- [ ] **Step 6: Проверить слой projectState**

  Run: `pnpm --filter @nkdk/rules test:native`

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base 91aeafb4d`

  Expected: PASS; временное хранилище удаляется и при успехе, и при отказе.

- [ ] **Step 7: Зафиксировать слой**

  Commit: `feat: :sparkles: хранить подготовленный импорт в projectState`

---

## Task 5: Раздавать второй проход через динамическую очередь

**Files:**

- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/workerPool.ts`
- Modify: `packages/rules/metadata/importFromXml/workerPool.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.integration.test.ts`
- Modify: `packages/rules/metadata/workerPool/importContracts.ts`

**Interfaces:**

- Consumes: `PreparedImportStore`, `decodePreparedImportRecord`, четыре projectState read tokens.
- Produces: `runSecondPass` обрабатывает общий список locator по убыванию `weight`; конкретный assignment больше не обязан вернуться в worker первого прохода.

- [ ] **Step 1: Зафиксировать перенос задания между worker**

  В `workerPool.integration.test.ts` worker 0 должен создать prepared record, а второй проход — обработать её worker 1. Проверить успешный результат и отсутствие `preparedYaml` в долговременном состоянии обоих worker.

- [ ] **Step 2: Зафиксировать динамическую балансировку**

  Создать веса `[100, 90, 10, 10]` и два управляемых worker. После завершения задания 100 свободный worker должен получить следующее задание 10, не ожидая worker с заданием 90. Проверить порядок команд `[100, 90, 10, 10]` с выдачей следующего задания первому освободившемуся worker.

- [ ] **Step 3: Зафиксировать атомарность**

  Если worker падает после чтения, но до публикации результата, запись не удаляется, import session abort очищает её вместе со всем временным хранилищем, а YAML на диск не записывается.

- [ ] **Step 4: Подтвердить падение**

  Run: `pnpm --filter @nkdk/rules exec vitest run --project integration metadata/importFromXml/workerPool.integration.test.ts metadata/importFromXml/worker.integration.test.ts metadata/importFromXml/importConfiguration.integration.test.ts`

  Expected: FAIL, потому что assignment закреплён за worker первого прохода.

- [ ] **Step 5: Перевести первый проход на prepared store**

  После подготовки задания кодировать запись Task 3, записывать её через Task 4 и освобождать `yaml`, annotations и proof audit в worker. В памяти оставлять только locator и бинарные фрагменты рабочего индекса.

- [ ] **Step 6: Реализовать диспетчер очереди**

  В `workerPool.ts` отсортировать locator по `weight` убыванию, запустить по одному command на каждый из четырёх worker и после завершения немедленно выдавать этому worker следующий locator. Размер command — один locator; пакет результата сразу передаётся stateQueue и освобождается.

- [ ] **Step 7: Восстанавливать задание в любом worker**

  Worker читает bytes, проверяет checksum, разбирает внутренние YAML основного
  файла и кандидата базовой формы, восстанавливает annotations, находит оба
  rules по `ruleItemType`, связывает deferred paths, восстанавливает
  `formDataPathIndex`, `validationFile`, `ownerContext` и `dependentOwner` и
  только затем вызывает существующий `prepareYamlForFinalPass`. После успешной
  записи второго состояния вызывает `release(assignmentId)`.

- [ ] **Step 8: Установить штатные четыре worker**

  В round-trip skill и профильных командах использовать `concurrency: 4`. Пользовательский параметр MCP продолжает иметь приоритет; значения меньше четырёх разрешены и сохраняют корректность, но не входят в целевой профиль.

- [ ] **Step 9: Проверить функциональность и память worker**

  Run: `pnpm --filter @nkdk/rules test:native`

  Run: `pnpm --filter @nkdk/rules test:integration`

  Run: `pnpm --filter @nkdk/rules type-check`

  Run: `pnpm duplicates -- --base 91aeafb4d`

  Expected: PASS; тест состояния worker подтверждает отсутствие удерживаемых YAML/proof записей после каждого задания.

- [ ] **Step 10: Зафиксировать слой**

  Commit: `perf: :zap: распределять контрольный импорт динамически`

---

## Task 6: Подтвердить целевой профиль и точный round-trip

**Files:**

- Modify: `.agents/skills/import-profile/import-profile.mjs`
- Modify: `.agents/skills/import-profile/import-profile.test.mjs`
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`
- Modify: `.agents/skills/round-trip-yaml/round-trip.test.mjs`
- Modify: `docs/superpowers/plans/2026-08-25-xml-import-control-export-performance.md`

**Interfaces:**

- Consumes: профиль фаз `firstPassMs`, `secondPassMs`, `responseMs`, `peakRssMiB`.
- Produces: профиль отдельно показывает `directControlExports`, `serializedControlExports`, `detailedRereads` и распределение заданий между worker.

- [ ] **Step 1: Добавить профильные счётчики**

  В итоговый JSON добавить:

  ```ts
  controlExport: {
    direct: number
    serialized: number
    detailedRereads: number
    assignmentsByWorker: readonly number[]
  }
  ```

  Счётчики агрегируются в существующем профилировщике и не добавляют подробную строку на каждое из 9937 заданий.

- [ ] **Step 2: Проверить профильный формат**

  Run: `node --test .agents/skills/import-profile/import-profile.test.mjs .agents/skills/round-trip-yaml/round-trip.test.mjs`

  Expected: PASS; по умолчанию обе команды передают четыре worker.

- [ ] **Step 3: Выполнить профиль `cf/doc`**

  Run: `node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip-compact/cf/doc /private/tmp/nkdk-import-profile-doc-fast --runs 1 --concurrency 4 --json`

  Expected: `responseMs <= 120000`, `peakRssMiB <= 3276.8`, `succeeded = 9937`, `errors = 0`; сумма direct и serialized равна числу контрольных экспортов, detailed rereads не превышает serialized/mismatched cases.

- [ ] **Step 4: Если профиль не достиг цели, остановиться на измеренной причине**

  Не ослаблять контроль и не повышать память выше 3,2 ГиБ. По агрегированным строкам назвать один доминирующий этап и добавить отдельную согласованную задачу; не объединять несколько предположительных оптимизаций.

- [ ] **Step 5: Выполнить полный round-trip `cf/doc`**

  Run: `env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc ./.agents/skills/round-trip-yaml/round-trip.sh`

  Expected: `Round-trip чистый: диффов нет`.

- [ ] **Step 6: Выполнить обязательные проверки проекта**

  Run: `pnpm type-check`

  Run: `pnpm duplicates -- --base 91aeafb4d`

  Run: `pnpm test:architecture:rules`

  Run: `pnpm test:architecture`

  Run: `CI=true pnpm test`

  Expected: PASS; XML-фикстуры и dependency-cruiser baseline не изменены.

- [ ] **Step 7: Сверить результат со спецификацией**

  Проверить обязательность контрольного экспорта, точность direct/fallback структур, отсутствие удержания YAML между заданиями, атомарность prepared store, лимиты времени и памяти. Фактические значения профиля записать в этот план и в раздел производительности спецификации.

- [ ] **Step 8: Зафиксировать окончательную проверку**

  Commit: `perf: :zap: ускорить контрольный XML-импорт`
