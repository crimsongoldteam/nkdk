# YAML Runtime Metadata Projection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исключить потерю `!xml/*` и остальных служебных метаданных при внутренних перестройках YAML, включая BaseForm основной конфигурации при импорте расширения.

**Architecture:** Runtime предоставляет одну операцию переноса метаданных между соответствующими YAML-поддеревьями и разными таблицами XML-аннотаций. Все подготовленные YAML-значения, включая спутник BaseForm, передаются и сериализуются парой «данные + аннотации»; предметная проекция формы использует общий runtime-механизм и не перечисляет теги.

**Tech Stack:** TypeScript, Vitest, js-yaml, двоичные prepared import records.

**Spec:** `docs/superpowers/specs/2026-08-23-common-types-xml-anomaly-framework-design.md`, раздел «Перестройка YAML в памяти».

## Global Constraints

- Договор действует для всех metadata- и common-объектов без перечня типов.
- Метаданные переносятся только для явно сопоставленного смыслового узла; новое или изменённое значение не наследует их автоматически.
- Предметные модули не перечисляют виды `!xml/*` и не восстанавливают теги вручную.
- Потеря аннотации сопоставленного узла блокирует публикацию результата как внутренняя ошибка.
- Существующие XML-фикстуры не изменяются.
- После каждого слоя выполняется `pnpm duplicates -- --base c66b62a6a`.

---

### Task 1: Общий перенос метаданных YAML-поддерева

**Files:**
- Modify: `packages/runtime/yaml/runtimeMetadata.ts`
- Modify: `packages/runtime/yaml/runtimeMetadata.test.ts`
- Modify: `packages/runtime/yaml/xmlAnomalyAnnotations.ts`
- Modify: `packages/runtime/yaml/xmlAnomalyAnnotations.test.ts`
- Modify: `packages/runtime/index.ts`

**Interfaces:**
- Produces:
  ```ts
  export function copyYAMLRuntimeMetadataDeep(params: {
    readonly source: unknown
    readonly target: unknown
    readonly sourceAnnotations?: XmlAnomalyAnnotations
    readonly targetAnnotations?: XmlAnomalyAnnotationTable
  }): void
  ```
- The function copies container metadata and XML annotations only along structurally corresponding keys that exist in both trees. Callers invoke it on additional explicit source/target pairs when a composite projection changes a parent path.
- Existing `copyXmlAnomalyAnnotationsDeep(annotations, source, target)` remains as a compatibility wrapper using the same table as source and target.

- [ ] **Step 1: Write failing runtime tests**

Add tests that parse this source, build an equivalent fresh nested object/array, and copy into a new annotation table:

```ts
const parsed = parseMetadataYaml([
  "Объект: !xml/raw",
  "  $значение:",
  "    Имя: !xml/name ОсобоеИмя",
  "    Языки: !xml/invalid",
  "      ru: Текст",
  "      en: Text",
  "  $xml: { _name: ОсобоеИмя }",
].join("\n"))
const target = structuredClone(parsed.data)
const targetAnnotations = createXmlAnomalyAnnotations()

copyYAMLRuntimeMetadataDeep({
  source: parsed.data,
  target,
  sourceAnnotations: parsed.annotations,
  targetAnnotations,
})
```

Assert that the target preserves the nested `xml/name` scalar tag, the outer raw annotation, the inner invalid annotation, mapping order and quoted-scalar marks. Add a second test where the target omits or replaces one source key and assert that metadata for that key is not copied.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
pnpm --filter @nkdk/runtime exec vitest run yaml/runtimeMetadata.test.ts yaml/xmlAnomalyAnnotations.test.ts
```

Expected: FAIL because `copyYAMLRuntimeMetadataDeep` is not exported.

- [ ] **Step 3: Implement the common runtime operation**

Traverse only object/object and array/array pairs. For every corresponding container call `copyYAMLRuntimeMetadata`; copy value/key annotations from `sourceAnnotations` into `targetAnnotations` only for keys that exist in both containers. A primitive child is corresponding only when `Object.is(sourceChild, targetChild)`; object children are corresponding only inside the explicit source/target pair passed by the caller. Recurse through matching object keys. Detect the invalid combination where only one annotation table is supplied:

```ts
if ((sourceAnnotations === undefined) !== (targetAnnotations === undefined)) {
  throw new Error("Для переноса XML-аннотаций нужны исходная и целевая таблицы")
}
```

Move the structural traversal used by `copyXmlAnomalyAnnotationsDeep` into this operation and leave the old function as a thin wrapper. Do not add metadata-specific conditions for forms, I8nText or XDTO.

- [ ] **Step 4: Run runtime tests and verify GREEN**

Run the command from Step 2. Expected: PASS.

- [ ] **Step 5: Check duplicates and commit**

```bash
pnpm duplicates -- --base c66b62a6a
git add packages/runtime/yaml/runtimeMetadata.ts packages/runtime/yaml/runtimeMetadata.test.ts packages/runtime/yaml/xmlAnomalyAnnotations.ts packages/runtime/yaml/xmlAnomalyAnnotations.test.ts packages/runtime/index.ts
git commit -m "feat: :sparkles: переносить метаданные YAML-поддерева"
```

### Task 2: Prepared YAML всегда содержит аннотации

**Files:**
- Modify: `packages/rules/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/rules/metadata/importFromXml/preparedRecord.ts`
- Modify: `packages/rules/metadata/importFromXml/preparedRecord.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Test: `packages/rules/metadata/importFromXml/worker.integration.test.ts`

**Interfaces:**
- `PreparedBaseFormCandidate` gains `annotations: XmlAnomalyAnnotationTable`.
- `PreparedBaseFormRecordV1` gains `annotations: XmlAnomalyAnnotationsSnapshot`.
- `RestoredPreparedImportRecord.baseFormCandidate` gains `annotations: XmlAnomalyAnnotations`.
- The record remains internal to one import operation; no fallback that silently creates an empty table is allowed.

- [ ] **Step 1: Write failing prepared-record test**

Change the BaseForm fixture in `preparedRecord.test.ts` to contain a nested unregistered language:

```yaml
Элементы:
  Поле:
    Подсказка:
      ru: Текст
      en: !xml/invalid Text
```

Create the candidate annotation table from parsed YAML, encode and restore the record, then assert:

```ts
expect(restored.baseFormCandidate?.annotations.at(languages, "en"))
  .toMatchObject({ kind: "invalid", target: "value" })
```

- [ ] **Step 2: Run the prepared-record test and verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run metadata/importFromXml/preparedRecord.test.ts
```

Expected: FAIL because BaseForm annotations are not part of the record.

- [ ] **Step 3: Carry annotations through preparation, storage and restoration**

Pass `baseForm.annotations` from `importAssignmentBaseFormCandidate`. Serialize BaseForm with its annotation table and store its snapshot next to `yamlText`. On restore merge parser annotations with the recorded snapshot exactly as for the main YAML. Replace `controlBaseFormPreparedYaml` creation of an empty table with the candidate annotations supplied by the prepared value.

- [ ] **Step 4: Add and run the worker regression**

Extend the existing inline-XML worker integration coverage so an extension BaseForm contains one registered `ru` and one unregistered `en`. Assert that second-pass validation does not emit `xml/anomaly-tag-unnecessary` for `en`, and that serialized YAML still contains `!xml/invalid`.

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run metadata/importFromXml/preparedRecord.test.ts metadata/importFromXml/worker.integration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Check duplicates and commit**

```bash
pnpm duplicates -- --base c66b62a6a
git add packages/rules/metadata/importFromXml/prepareYaml.ts packages/rules/metadata/importFromXml/preparedRecord.ts packages/rules/metadata/importFromXml/preparedRecord.test.ts packages/rules/metadata/importFromXml/worker.ts packages/rules/metadata/importFromXml/worker.integration.test.ts
git commit -m "fix: :bug: сохранять аннотации подготовленной BaseForm"
```

### Task 3: BaseForm использует только общий перенос

**Files:**
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseFormProjection.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseFormProjection.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseFormYaml.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseFormYaml.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseForm.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseForm.test.ts`

**Interfaces:**
- `projectClientApplicationBaseForm` accepts optional source annotation tables and returns the projected target annotation table beside `yaml`.
- Every retained subtree is registered through `copyYAMLRuntimeMetadataDeep`; `projectSharedTaggedProperties` and checks for concrete scalar tags are removed.
- A changed or omitted property receives no source annotation.

- [ ] **Step 1: Replace the narrow projection test with a general failing test**

Parse base and extension YAML containing on different retained nodes:

```yaml
Подсказка:
  ru: Текст
  en: !xml/invalid Text
РасширеннаяПодсказка:
  Имя: !xml/name ПолеExtendedTooltip
```

Project the BaseForm with both annotation tables. Assert that the result keeps `xml/name`, the nested invalid annotation and raw payload when present. Add a changed-value case and assert that its annotation is absent from the result.

- [ ] **Step 2: Run BaseForm tests and verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run metadata/forms/clientApplicationForm/baseFormProjection.test.ts metadata/forms/clientApplicationForm/baseFormYaml.test.ts metadata/forms/clientApplicationForm/baseForm.test.ts
```

Expected: FAIL because the current projection copies only selected scalar metadata and does not return annotations.

- [ ] **Step 3: Implement projection through runtime correspondences**

Create one target annotation table for the projection. Whenever a property, element, named component or normalized nested value is retained, invoke `copyYAMLRuntimeMetadataDeep` on that explicit source/result pair. Thread the target table into control export. Remove `yamlScalarTagAt` and `projectSharedTaggedProperties` from BaseForm projection; no tag names remain in the module.

- [ ] **Step 4: Run BaseForm tests and verify GREEN**

Run the command from Step 2. Expected: PASS.

- [ ] **Step 5: Check duplicates and commit**

```bash
pnpm duplicates -- --base c66b62a6a
git add packages/rules/metadata/forms/clientApplicationForm/baseFormProjection.ts packages/rules/metadata/forms/clientApplicationForm/baseFormProjection.test.ts packages/rules/metadata/forms/clientApplicationForm/baseFormYaml.ts packages/rules/metadata/forms/clientApplicationForm/baseFormYaml.test.ts packages/rules/metadata/forms/clientApplicationForm/baseForm.ts packages/rules/metadata/forms/clientApplicationForm/baseForm.test.ts
git commit -m "refactor: :recycle: унифицировать проекцию метаданных BaseForm"
```

### Task 4: Итоговая проверка договора

**Files:**
- Modify only if a regression exposes a missing general case; do not update XML fixtures or add type-specific tag lists.

**Interfaces:**
- Consumes `copyYAMLRuntimeMetadataDeep` and prepared BaseForm annotations from Tasks 1–3.
- Produces a branch where the 37 real unregistered-language anomalies are accepted by `!xml/invalid`, while genuinely unnecessary tags still fail validation.

- [ ] **Step 1: Run focused validation and e2e tests**

```bash
pnpm --filter @nkdk/runtime test
pnpm --filter @nkdk/rules exec vitest run metadata/validation/localizedTextYAML.test.ts metadata/validation/projectValidationPasses.integration.test.ts
pnpm test:e2e
```

Expected: all PASS; no allowlists or ignored diagnostics.

- [ ] **Step 2: Run project-wide verification**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base c66b62a6a
```

Expected: all commands exit 0.

- [ ] **Step 3: Re-run the sed XML import with the branch runtime**

Import `/Users/nikita/git/sed_xml/cf` and `/Users/nikita/git/sed_xml/cfe/дкз` into a temporary project. Assert that the previous 37 `xml/anomaly-tag-unnecessary` diagnostics are absent and inspect the three known paths:

- `Документ/ИсходящееПисьмо/Формы/МК_ФормаДокумента/Форма.yaml`;
- `Обработка/ВводКонтактнойИнформации/Формы/ВводАдреса/Форма.yaml`;
- `ПакетXDTO/EnterpriseData_1_20_2/Свойства.yaml`.

Each unregistered language must remain marked `!xml/invalid`. Delete the temporary project after inspection.

- [ ] **Step 4: Commit any verification-only test adjustment**

If Step 1–3 required a general regression test, stage only that test and its minimal production fix, then commit with:

```bash
git commit -m "test: :white_check_mark: защитить перенос XML-аннотаций"
```

If no files changed, do not create an empty commit.
