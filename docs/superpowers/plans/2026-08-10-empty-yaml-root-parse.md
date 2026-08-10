# Empty YAML Root Parsing Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task by task.

**Goal:** Читать физически пустой или состоящий только из пробельных символов корневой YAML-документ как пустой объект в памяти, не записывая `{}` в файл и не меняя смысл явных `null` и `~`.

**Architecture:** Исправление выполняется на общей границе быстрого чтения YAML — в `parseDataWithJsYaml`. Благодаря этому подготовка файлов и полный YAML → XML sync получают тот же договор, который уже соблюдает `parseWithJsYaml`, без частных условий по роли файла, типу метаданных или имени `Свойства.yaml`. Сериализация не меняется: пустой корневой объект продолжает записываться нулевой длиной.

**Tech Stack:** TypeScript, js-yaml, Vitest, pnpm.

---

### Task 1: Выровнять чтение пустого корневого YAML во всех путях

**Files:**

- Modify: `packages/core/yaml/parseMetadataYaml.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.test.ts`
- Modify: `packages/core/yaml/jsYamlParser.ts`

**Interfaces:**

- Consume: `parseMetadataYamlData(text: string)` from `packages/core/yaml/parseMetadataYaml.ts`
- Consume: `prepareYamlFiles`, `prepareFullXmlSyncAssignment`, `writeFullXmlSyncAssignment`
- Produce: `parseDataWithJsYaml` returns `{}` for whitespace-only root documents while preserving `null` for explicit YAML null scalars

**Step 1: Write the failing parser contract tests**

In `packages/core/yaml/parseMetadataYaml.test.ts`, import `parseMetadataYamlData` and add focused cases:

```ts
describe("parseMetadataYamlData", () => {
  it.each(["", " \n\t"])("читает пустой корневой документ как пустой объект", (text) => {
    expect(parseMetadataYamlData(text)).toEqual({ data: {}, syntaxErrors: [] })
  })

  it.each(["null", "~"])("сохраняет явный null: %s", (text) => {
    expect(parseMetadataYamlData(text)).toEqual({ data: null, syntaxErrors: [] })
  })
})
```

Keep the existing `parsedYamlFromKnownData` test unchanged. The explicit-null cases guard the semantic boundary: only the absence of YAML content becomes `{}`.

**Step 2: Write the failing full-sync regression test**

In `packages/core/metadata/fullSyncToXml/writeAssignment.test.ts`, add a test next to the existing data-processor case. It must:

1. Create `Обработка/ОбработкаВсеСвойства/Свойства.yaml` as a zero-byte file.
2. Pass the file through the real `prepareYamlFiles` fast-parser path.
3. Prepare and write the assignment with `prepareFullXmlSyncAssignment` and `writeFullXmlSyncAssignment`.
4. Assert an empty diagnostics list and the generated owner XML containing `<Name>ОбработкаВсеСвойства</Name>`.

Use the existing `tempDir`, `dataProcessorAssignment`, `mockContextToXML`, configuration-index fixture, and `emptyComposition`. Do not replace the zero-byte file with literal `{}` and do not modify XML fixtures.

**Step 3: Run the focused tests and verify RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run yaml/parseMetadataYaml.test.ts metadata/fullSyncToXml/writeAssignment.test.ts --no-isolate
```

Expected: the empty-document parser cases receive `undefined`, and the full-sync test fails in assignment preparation with `Подготовленные YAML-данные отсутствуют`. The explicit `null` and existing tests remain green.

**Step 4: Implement the minimal parser fix**

In `packages/core/yaml/jsYamlParser.ts`, change only the whitespace-only branch of `parseDataWithJsYaml`:

```ts
if (text.trim() === "") {
  return { data: {}, syntaxErrors: [] }
}
```

Do not change `parseWithJsYaml`, serialization, metadata rules, file roles, or error handling for non-empty YAML.

**Step 5: Run the focused tests and verify GREEN**

Run the same focused command:

```bash
pnpm --filter @nkdk/core exec vitest run yaml/parseMetadataYaml.test.ts metadata/fullSyncToXml/writeAssignment.test.ts --no-isolate
```

Expected: all focused tests pass, including the new zero-byte `Свойства.yaml` full-sync case.

**Step 6: Verify the affected layer**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run yaml metadata/project/prepareYamlFiles.test.ts metadata/fullSyncToXml --no-isolate
pnpm --filter @nkdk/core exec tsc --noEmit
pnpm duplicates -- --base 26f0caedc
```

Expected: YAML, preparation, and full-sync tests pass; TypeScript reports no errors; duplicate-code check reports no new violations.

**Step 7: Verify the whole repository**

Run:

```bash
pnpm test
```

Expected: all project tests pass. If the previously observed shuffle-dependent `metadata/commonObjects/dataCompositionSystem/orderItemFields/toJSONSchema.test.ts` baseline failure recurs, record its exact output, verify it independently with:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/orderItemFields/toJSONSchema.test.ts --no-isolate
```

and report the unrelated baseline failure separately; do not alter that subsystem as part of this task.

**Step 8: Re-run the reported configuration scenario**

From the worktree root, run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/sed_xml NKDK_XML_DIR=/Users/nikita/git/sed_xml/cf ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the XML import still succeeds for all files, and sync proceeds past the 1121 empty `Свойства.yaml` files without `full_xml_sync_assignment_failed` / `Подготовленные YAML-данные отсутствуют`. Any later round-trip differences are a separate diagnostic result, not a regression of this fix.

**Step 9: Review scope and commit**

Before committing, inspect:

```bash
git diff --check
git status --short
git diff -- packages/core/yaml/jsYamlParser.ts packages/core/yaml/parseMetadataYaml.test.ts packages/core/metadata/fullSyncToXml/writeAssignment.test.ts
```

Self-review checklist:

- The implementation matches `docs/superpowers/specs/2026-08-10-empty-yaml-root-parse-design.md`.
- No file is written with literal `{}`; only the in-memory parser result changes.
- Explicit `null` and `~` remain `null`.
- No metadata-specific branch, rule change, XML fixture change, or unrelated cleanup was introduced.
- Parser unit coverage and the real full-sync regression both exist.

Commit the implementation:

```bash
git add packages/core/yaml/jsYamlParser.ts packages/core/yaml/parseMetadataYaml.test.ts packages/core/metadata/fullSyncToXml/writeAssignment.test.ts
git commit -m "fix: :bug: читать пустой корневой YAML как объект"
```
