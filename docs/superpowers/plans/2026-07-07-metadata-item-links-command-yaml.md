# Metadata Item Links Command YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить XML -> YAML экспорт `MetadataItemLink(s)`, чтобы member-ссылки команд записывались русскими YAML-сегментами.

**Architecture:** `rules.ts` уже задаёт смысл поля через `metadataTarget`, а `metadataTargets` уже умеет форматировать канонические ссылки в русский YAML. Нужно заставить `MetadataItemLink(s)` при наличии `rule.metadataTarget` напрямую использовать `formatMetadataTargetToYAML`, сохранив старый object-fallback только для правил без явного `metadataTarget`.

**Tech Stack:** TypeScript, Vitest, pnpm workspace, validation-profile compiled standalone path.

## Global Constraints

- Ответы и комментарии по задаче вести на русском языке.
- Не изменять XML-фикстуры.
- Не добавлять поддержку модельных корней и сегментов в YAML-импорт.
- Не делать post-process по готовому YAML-тексту.
- Не добавлять в `MetadataItemLinks` частные знания о прикладных объектах.
- Не реализовывать developer skill диагностики английских имён в рамках этой задачи.
- Полная проверка перед завершением: `pnpm test` из корня worktree.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/metadataRef/toYAML.ts`
  - Ответственность: экспорт `MetadataItemLink` и `MetadataItemLinks` в YAML. При наличии `rule.metadataTarget` должен делегировать в `formatMetadataTargetToYAML`.
- Modify: `packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts`
  - Ответственность: регрессионные тесты на `DataProcessor/Catalog/Document/InformationRegister + Command`, строгие ошибки при `metadataTarget`, и сохранение старого fallback без `metadataTarget`.
- Read-only verification: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`
  - Ответственность: уже существующие тесты общего форматтера; прогоняется для защиты от регрессий в `metadataTargets`.

---

### Task 1: Format MetadataItemLinks Through metadataTarget

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRef/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts`

**Interfaces:**
- Consumes:
  - `formatMetadataTargetToYAML(input: { canonical: string; constraint: MetadataTargetConstraint; owner?: MetadataTargetOwner }): string`
  - `PropertyRule["metadataTarget"]`
  - existing `exportMetadataObjectStringToYAML(context, rule, data, owner)`
- Produces:
  - unchanged public exports:
    - `exportMetadataItemLinkToYAML(context, rule, data, owner?): string | undefined`
    - `exportMetadataItemLinksToYAML(context, rule, data, owner?): string[] | undefined`
  - new local helper:
    - `exportMetadataItemLinkValueToYAML(context, rule, data, owner?): string | undefined`

- [ ] **Step 1: Write failing tests for command member formatting**

Add this test inside `describe("exportMetadataItemLinksToYAML", ...)` in `packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts`, after the existing top-level roots test:

```ts
  it("exports command member links through metadataTarget", () => {
    const rule = {
      type: "MetadataItemLinks",
      metadataTarget: {
        kind: "member",
        owner: "explicit",
        allowedMemberPaths: [
          ["DataProcessor", "Command"],
          ["Catalog", "Command"],
          ["Document", "Command"],
          ["InformationRegister", "Command"],
        ],
      },
    } as const

    expect(
      exportMetadataItemLinksToYAML(mockContext, rule, [
        "DataProcessor.ПанельСправочников.Command.ОткрытьПанель",
        "Catalog.Товары.Command.Печать",
        "Document.Заказ.Command.СоздатьНаОсновании",
        "InformationRegister.Настройки.Command.ОткрытьСписок",
      ])
    ).toEqual([
      "Обработка.ПанельСправочников.Команда.ОткрытьПанель",
      "Справочник.Товары.Команда.Печать",
      "Документ.Заказ.Команда.СоздатьНаОсновании",
      "РегистрСведений.Настройки.Команда.ОткрытьСписок",
    ])
  })
```

- [ ] **Step 2: Write failing test for strict metadataTarget errors**

Add this test in the same `describe("exportMetadataItemLinksToYAML", ...)` block:

```ts
  it("does not fall back to object formatting when metadataTarget expects members", () => {
    const rule = {
      type: "MetadataItemLinks",
      metadataTarget: {
        kind: "member",
        owner: "explicit",
        allowedMemberPaths: [["DataProcessor", "Command"]],
      },
    } as const

    expect(() =>
      exportMetadataItemLinksToYAML(mockContext, rule, ["Catalog.Товары"])
    ).toThrow("Некорректный формат цели метаданных")
  })
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRef/toYAML.test.ts
```

Expected: FAIL. The first new test should receive model-style segments such as `DataProcessor.ПанельСправочников.Command.ОткрытьПанель` or throw before producing the expected Russian YAML because `MetadataItemLinks` currently goes through object formatting.

- [ ] **Step 4: Implement metadataTarget-first export**

Modify `packages/core/metadata/commonObjects/metadataRef/toYAML.ts`.

Add this import:

```ts
import { formatMetadataTargetToYAML } from "../metadataTargets"
```

Replace the body of `exportMetadataItemLinkToYAML` with a call to a local helper:

```ts
export const exportMetadataItemLinkToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLink | undefined,
  owner?: MetadataTargetOwner
): MetadataItemLinkYAML | undefined => {
  return exportMetadataItemLinkValueToYAML(context, rule, data, owner)
}
```

Add this helper below `exportMetadataItemLinksToYAML`:

```ts
function exportMetadataItemLinkValueToYAML(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLink | undefined,
  owner?: MetadataTargetOwner
): MetadataItemLinkYAML | undefined {
  if (data === undefined) return undefined
  if (data === "") return ""

  if (rule?.metadataTarget !== undefined) {
    return formatMetadataTargetToYAML({
      canonical: data,
      constraint: rule.metadataTarget,
      owner,
    })
  }

  return exportMetadataObjectStringToYAML(context, rule, data, owner)
}
```

Keep `exportMetadataItemLinksToYAML` unchanged except that it now calls the updated `exportMetadataItemLinkToYAML`.

- [ ] **Step 5: Run focused tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRef/toYAML.test.ts
```

Expected: PASS for `metadataRef/toYAML.test.ts`.

- [ ] **Step 6: Run metadataTargets tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: PASS. This confirms the shared formatter still preserves current parse/format contracts.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataRef/toYAML.ts packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts
git commit -m "fix: :bug: форматировать команды MetadataItemLinks в YAML"
```

Expected: commit succeeds and contains only the exporter plus its tests.

---

### Task 2: Verify Compiled Validation Profile

**Files:**
- No source edits expected.
- Read: `.agents/skills/validation-profile/SKILL.md`
- Read: `.agents/skills/validation-profile/validation-profile.mjs`

**Interfaces:**
- Consumes:
  - compiled standalone path produced by `pnpm --filter @nakidka/core build`
  - YAML project `/Users/nikita/git/nkdk-yaml`
- Produces:
  - verification evidence that the `DataProcessor.Command`, `Catalog.Command`, `Document.Command`, `InformationRegister.Command` block no longer appears in validation diagnostics.

- [ ] **Step 1: Re-read validation-profile skill**

Run:

```bash
sed -n '1,220p' .agents/skills/validation-profile/SKILL.md
```

Expected: output confirms the required sequence is fresh build before running `validation-profile`.

- [ ] **Step 2: Build compiled core**

Run:

```bash
pnpm --filter @nakidka/core build
```

Expected: exit code 0 and bundled files under `packages/core/dist`.

- [ ] **Step 3: Run validation profile**

Run:

```bash
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1 --timing
```

Expected: exit code 0. Record total diagnostics, errors, warnings, worker count, cold time, peak RSS.

- [ ] **Step 4: Group remaining errors and check command block**

Run:

```bash
node --input-type=module -e 'import { createValidationWorkerPoolHandle } from "./packages/core/dist/index.js"; const h=createValidationWorkerPoolHandle(); try { const r=await h.validateProject({projectDir:"/Users/nikita/git/nkdk-yaml"}); const errors=r.diagnostics.filter(x=>x.severity==="error"); const counts=new Map(); for (const d of errors) { const m=String(d.message); counts.set(m,(counts.get(m)??0)+1); } console.log([...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60).map(([m,n])=>`${n}\t${m}`).join("\n")); const commandErrors=errors.filter(d=>/Не найдена ссылка "((DataProcessor|Catalog|Document|InformationRegister)\.[^.]+\.Command\.)/.test(String(d.message))); console.log(`COMMAND_ERRORS=${commandErrors.length}`); for (const d of commandErrors.slice(0,20)) console.log(`${d.filePath ?? ""}: ${d.message}`); } finally { await h.close(); }'
```

Expected: `COMMAND_ERRORS=0`.

- [ ] **Step 5: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all workspace package tests pass.

- [ ] **Step 6: Commit verification-only changes if any**

If no source files changed during Task 2, do not create a commit.

If a generated file changed unexpectedly, inspect it with:

```bash
git status --short
git diff -- <path>
```

Expected: no unexpected generated files are committed.

---

## Self-Review Notes

- Spec coverage: Task 1 implements the `metadataTarget`-first export path and preserves fallback without `metadataTarget`; Task 2 verifies compiled standalone profile and full tests.
- Boundaries: no changes to YAML import, no post-process, no object-specific conditionals inside `MetadataItemLinks`.
- Out of scope: developer skill for English-name diagnostics remains a separate plan.
