# Complete XML Order Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вернуть временный анализатор и получить доказанный `xmlOrder` для всех конкретных runtime-правил, встретившихся в семи `cf` и трёх расширениях `cfe` от `cf/all`.

**Architecture:** Отменить коммит удаления без переписывания истории, затем расширить существующий наблюдатель рабочего XML-import. Каталог индексирует прямые, вложенные и локально скомпонованные правила; анализатор обрабатывает конфигурации и расширения с корректным component descriptor и базовым reference. Полученный порядок проверяется повторным анализом и полным YAML round-trip.

**Tech Stack:** TypeScript 6, Node.js 26, Vitest 4, Piscina, pnpm, MCP stdio, Bash.

## Global Constraints

- Работать в `/Users/nikita/git/nkdk/.worktrees/rule-order-analysis` на ветке `codex/rule-order-analysis`.
- Не изменять XML-файлы под `/Users/nikita/git/round-trip` вручную.
- Не записывать `xmlOrder` для property-фрагментов и правил без наблюдений.
- Не заменять специальный `ConfigurationXmlNode.order` коллекций и интерфейсов.
- Не удалять анализатор после проверок без отдельной явной команды пользователя.
- Источники: семь каталогов `cf` и три каталога `cfe`; базой всех `cfe` является `cf/all`.
- Для проверки использовать полный `round-trip-yaml`, не устаревший `round-trip-xml`.
- Любой допустимый остаточный XML-diff обязан воспроизводиться на свежем `develop`.
- Перед итогом выполнить `pnpm test` из корня.

---

### Task 1: Вернуть временный анализатор отдельным revert-коммитом

**Files:**

- Restore: `packages/core/metadata/ruleOrderAnalysis/**`
- Restore: `packages/core/scripts/rule-order-analysis/**`
- Restore integrations under: `packages/core/metadata/importFromXml/**`
- Restore integrations under: `packages/core/metadata/orchestration/**`
- Restore integrations under: `packages/core/metadata/forms/**`
- Modify: `packages/core/package.json`
- Delete by revert: `docs/superpowers/plans/2026-07-29-remove-rule-order-analyzer.md`

**Interfaces:**

- Restores: `RulePropertyOrderCollector`
- Restores: `XmlImportWorkerPool.analyzeRuleOrder(...)`
- Restores: CLI scripts `analyze-rule-order` and `rewrite-rule-order`
- Preserves: `MetadataItemRule.xmlOrder`, `ConfigurationXmlNode.present`, special `ConfigurationXmlNode.order`

- [ ] **Step 1: Verify the revert target and clean worktree**

Run:

```bash
git status --short
git show --summary --oneline 0a0120644
```

Expected: clean worktree; `0a0120644` is the analyzer deletion commit.

- [ ] **Step 2: Restore the deletion without committing**

Run:

```bash
git revert --no-commit 0a0120644
```

Expected: analyzer modules and integrations are restored; the already committed replacement specification remains.

- [ ] **Step 3: Verify the restored baseline**

Run:

```bash
pnpm --dir packages/core type-check
pnpm --dir packages/core exec vitest run \
  metadata/ruleOrderAnalysis \
  scripts/rule-order-analysis \
  metadata/importFromXml/worker.test.ts \
  metadata/importFromXml/workerPool.test.ts
git diff --check
```

Expected: PASS.

- [ ] **Step 4: Commit the revert**

```bash
git add docs/superpowers/plans/2026-07-29-remove-rule-order-analyzer.md \
  packages/core/package.json \
  packages/core/metadata \
  packages/core/scripts/rule-order-analysis
git commit -m "revert: :rewind: вернуть анализатор порядка XML" \
  -m "Анализатор нужен для покрытия конкретных runtime-правил в конфигурациях и расширениях. Удаление будет выполнено только после отдельного разрешения."
```

Expected: отдельный commit поверх спецификации.

---

### Task 2: Индексировать конкретные правила дочерних объектов

**Files:**

- Modify: `packages/core/metadata/ruleOrderAnalysis/catalog.ts`
- Modify: `packages/core/metadata/ruleOrderAnalysis/catalog.test.ts`
- Modify: `packages/core/scripts/rule-order-analysis/sourceModel.test.ts`

**Interfaces:**

- Extends: `buildRuntimeRuleOrderCatalog({ metadataDir })`
- Produces source paths:
  - `["properties", propertyKey, "itemRule"]`
  - `["childCollections", String(index), "itemRule"]`
- Preserves runtime identity matching through `WeakMap<MetadataItemRule, RuleOrderSource>`

- [ ] **Step 1: Write failing catalog tests**

Add imports of `MetadataAccountingRegisterRules` and assert that the local command rule from its
first `childCollections` entry maps to:

```ts
expect(catalog.sourceOf(MetadataAccountingRegisterRules.childCollections?.[0]!.itemRule)).toMatchObject({
  filePath: join(metadataDir, "appliedObjects/metadataAccountingRegister/rules.ts"),
  exportName: "MetadataAccountingRegisterRules",
  propertyPath: ["childCollections", "0", "itemRule"],
})
```

Also assert that pure objects without `itemType + properties` are absent from `catalog.sources()`.

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/ruleOrderAnalysis/catalog.test.ts
```

Expected: FAIL because `staticNestedRules` does not traverse `childCollections`.

- [ ] **Step 3: Extend nested-rule discovery**

Change `staticNestedRules` so it keeps property rules and adds child collections:

```ts
for (const [index, collection] of (rule.childCollections ?? []).entries()) {
  if (isMetadataItemRule(collection.itemRule)) {
    result.push({
      rule: collection.itemRule,
      propertyPath: ["childCollections", String(index), "itemRule"],
    })
  }
}
```

Keep the ancestor guard and direct-export preference unchanged.

- [ ] **Step 4: Add source rewrite coverage for an array path**

In `sourceModel.test.ts`, create an exported owner with:

```ts
const LocalCommandRules = {
  itemType: "MetadataCommand",
  properties: {
    name: { type: "string" },
    group: { type: "string" },
  },
}
export const OwnerRules = {
  itemType: "Owner",
  properties: {},
  childCollections: [{ propertyKey: "commands", itemRule: LocalCommandRules }],
}
```

Use a source with `propertyPath: ["childCollections", "0", "itemRule"]` and assert that
`xmlOrder: ["name", "group"]` is added to `LocalCommandRules`, not to `OwnerRules`.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/ruleOrderAnalysis/catalog.test.ts \
  scripts/rule-order-analysis/sourceModel.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit catalog support**

```bash
git add packages/core/metadata/ruleOrderAnalysis/catalog.ts \
  packages/core/metadata/ruleOrderAnalysis/catalog.test.ts \
  packages/core/scripts/rule-order-analysis/sourceModel.test.ts
git commit -m "fix: :bug: учитывать правила дочерних объектов"
```

---

### Task 3: Анализировать конфигурации и расширения через их descriptor

**Files:**

- Modify: `packages/core/metadata/ruleOrderAnalysis/analyze.ts`
- Create: `packages/core/metadata/ruleOrderAnalysis/analyze.test.ts`
- Modify: `packages/core/metadata/importFromXml/types.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.test.ts`
- Modify: `packages/core/scripts/rule-order-analysis/index.ts`
- Modify: `packages/core/scripts/rule-order-analysis/index.test.ts`
- Modify: `packages/core/scripts/rule-order-analysis/render.ts`
- Modify: `packages/core/scripts/rule-order-analysis/render.test.ts`

**Interfaces:**

- Adds CLI argument: `--extension-root <absolute path>`
- Adds CLI argument: `--extension-base <configuration name>`
- Extends `AnalyzeRuleOrderParams`:

```ts
export interface AnalyzeRuleOrderParams {
  xmlRoot: string
  extensionRoot?: string
  extensionBase?: string
  metadataDir: string
  concurrency?: number
  witnessLimit?: number
  onObservation?(observation: RuleOrderObservation): void | Promise<void>
}
```

- Adds an analysis first-pass result that preserves prepared YAML:

```ts
export interface RuleOrderAnalysisFirstPassResult
  extends Omit<ImportFirstPassResult, "kind"> {
  kind: "ruleOrderAnalysisFirstPassResult"
  observations: RawRuleOrderObservation[]
  unmatchedObservationCount: number
  unmatchedItemTypes: readonly { itemType: string; count: number }[]
}
```

- Adds worker-pool method:

```ts
runRuleOrderAnalysisFirstPass(params: {
  configuration: string
  metadataDir: string
  assignments: readonly ImportAssignment[]
}): Promise<XmlImportRuleOrderFirstPassPoolResult>
```

- Adds source kind to configuration stat:

```ts
export interface RuleOrderConfigurationStat {
  sourceKind: "configuration" | "configurationExtension"
  configuration: string
  assignmentCount: number
  xmlFileCount: number
  observationCount: number
  skippedObservationCount: number
}
```

- [ ] **Step 1: Write failing CLI argument tests**

Cover:

```ts
expect(parseArguments([
  "--xml-root", "/xml/cf",
  "--extension-root", "/xml/cfe",
  "--extension-base", "all",
  "--output", "/out",
])).toMatchObject({
  xmlRoot: "/xml/cf",
  extensionRoot: "/xml/cfe",
  extensionBase: "all",
})
```

Reject `--extension-root` without `--extension-base`, and reject a non-absolute extension root.

- [ ] **Step 2: Run CLI tests to verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run scripts/rule-order-analysis/index.test.ts
```

Expected: FAIL on unknown arguments.

- [ ] **Step 3: Implement CLI parsing**

Add both arguments to the allow-list and validate them as one pair. Pass them to
`analyzeRuleOrder`.

- [ ] **Step 4: Write failing analyzer input tests**

With injected filesystem/discovery/descriptor dependencies, assert:

- configuration directories are processed as `componentKind: "configuration"`;
- extension directories are processed after configurations;
- extension descriptors provide `componentKind: "configurationExtension"` and
  `metadataItemAugmenter: "configurationExtension"`;
- the requested extension base must exist among configuration directories;
- stats preserve `sourceKind` and labels such as `cf/all` and `cfe/control`.
- extension second pass receives a layered reference whose `base` is the local validation snapshot
  produced while analyzing `cf/all`.

- [ ] **Step 5: Run analyzer tests to verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/ruleOrderAnalysis/analyze.test.ts
```

Expected: FAIL because analyzer only treats direct children of `xmlRoot` as configurations.

- [ ] **Step 6: Add an explicit source descriptor**

Inside `analyze.ts`, introduce:

```ts
interface RuleOrderInput {
  label: string
  xmlDir: string
  sourceKind: "configuration" | "configurationExtension"
  componentKind: string
  metadataItemAugmenter?: string
}
```

Build configuration inputs first, then extension inputs. Resolve each root through
`readXmlImportComponentRoot` and `resolveXmlImportComponent`; reject a descriptor whose kind does
not match its source group.

Initialize every worker operation with the detected `componentKind` and optional
`metadataItemAugmenter`, rather than hardcoding `"configuration"`.

- [ ] **Step 7: Preserve the normal first/second-pass import contract**

Refactor the restored worker analysis command so it uses the same preparation logic as
`runFirstPass`, retains `preparedYaml`, and returns the normal first-pass validation contribution
together with observations.

The pool aggregates both ordinary first-pass data and observations. After each source:

```ts
const local = createImportSharedValidationSnapshot(first.validationContribution)
const references = createLayeredImportReferenceSnapshot({
  local,
  ...(input.sourceKind === "configurationExtension"
    ? { base: requiredBaseSnapshot }
    : {}),
})
await pool.runSecondPass(references)
```

Retain the `local` snapshot produced by `cf/all` and require it before analyzing the first
extension. Use a unique temporary output directory per source.

- [ ] **Step 8: Make extension-base sequencing explicit**

Validate that `join(xmlRoot, extensionBase)` is among analyzed configurations and that it completes
before the first extension. Record `baseConfiguration: "cf/all"` in the report model for extension
stats.

- [ ] **Step 9: Update report rendering**

Render separate tables for `cf` and `cfe`, and show the base configuration for every extension.

- [ ] **Step 10: Run focused tests**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/ruleOrderAnalysis/analyze.test.ts \
  scripts/rule-order-analysis/index.test.ts \
  scripts/rule-order-analysis/render.test.ts \
  metadata/importFromXml/workerPool.test.ts
pnpm --dir packages/core type-check
```

Expected: PASS.

- [ ] **Step 11: Commit multi-component analysis**

```bash
git add packages/core/metadata/ruleOrderAnalysis/analyze.ts \
  packages/core/metadata/ruleOrderAnalysis/analyze.test.ts \
  packages/core/metadata/importFromXml/types.ts \
  packages/core/metadata/importFromXml/worker.ts \
  packages/core/metadata/importFromXml/worker.test.ts \
  packages/core/metadata/importFromXml/workerPool.ts \
  packages/core/metadata/importFromXml/workerPool.test.ts \
  packages/core/scripts/rule-order-analysis
git commit -m "feat: :sparkles: анализировать порядок в расширениях"
```

---

### Task 4: Доказать покрытие фактически встреченных runtime-правил

**Files:**

- No intended source changes
- Generate only outside repository:
  `/private/tmp/nkdk-complete-xml-order-plan/**`

**Interfaces:**

- Requires report invariants:
  - `skippedObservationCount === 0`
  - `ambiguities.length === 0`
  - no rule conflicts or cycles
- Preserves `RulePropertyOrderCollector.accept(fact)`

- [ ] **Step 1: Run the analyzer without applying**

Run:

```bash
test ! -e /private/tmp/nkdk-complete-xml-order-plan
pnpm --dir packages/core analyze-rule-order \
  --xml-root /Users/nikita/git/round-trip/cf \
  --extension-root /Users/nikita/git/round-trip/cfe \
  --extension-base all \
  --output /private/tmp/nkdk-complete-xml-order-plan \
  --concurrency 6 \
  --witness-limit 3
```

Expected: report for exactly 7 `cf` and 3 `cfe`.

- [ ] **Step 2: Classify every analyzer failure**

For every skipped observation, ambiguity, conflict or cycle, use `observations.jsonl`,
`conflicts.json` and the cited XML file to identify whether:

- traversal failed to forward the collector;
- catalog failed to index the concrete runtime object;
- two truly conflicting XML orders exist;
- the observed key is absent from the exact runtime rule.

Do not add declaration-order fallbacks.

- [ ] **Step 3: Enforce the coverage gate**

Expected report:

- 0 skipped observations;
- 0 ambiguities;
- 0 conflicts;
- 0 cycles;
- every observation is a subsequence of its canonical order.

If any value is nonzero, stop execution and return to plan review with the exact candidate,
itemType and witness XML path. Do not patch an unplanned mechanism inside this task.

---

### Task 5: Применить доказанный `xmlOrder`

**Files:**

- Modify: concrete `packages/core/metadata/**/rules.ts` files selected by analyzer
- Generate only outside repository: `/private/tmp/nkdk-complete-xml-order-apply/**`

**Interfaces:**

- Consumes: canonical orders with observations
- Produces: partial `MetadataItemRule.xmlOrder`
- Must not modify: unobserved reusable rules

- [ ] **Step 1: Verify the worktree is clean**

Run:

```bash
git status --short
```

Expected: no output; `--apply` refuses a dirty tree.

- [ ] **Step 2: Apply canonical orders**

Run:

```bash
test ! -e /private/tmp/nkdk-complete-xml-order-apply
pnpm --dir packages/core rewrite-rule-order \
  --xml-root /Users/nikita/git/round-trip/cf \
  --extension-root /Users/nikita/git/round-trip/cfe \
  --extension-base all \
  --output /private/tmp/nkdk-complete-xml-order-apply \
  --concurrency 6 \
  --witness-limit 3
```

Expected: only concrete observed `rules.ts` files change.

- [ ] **Step 3: Audit the rewrite**

Run:

```bash
git diff --stat
git diff --check
rg -n "order:\\s*[0-9]" packages/core/metadata -g 'rules.ts'
```

Expected: no numeric property order remains; changes contain only justified `xmlOrder`.

- [ ] **Step 4: Verify the resulting canonical order**

Run:

```bash
test ! -e /private/tmp/nkdk-complete-xml-order-after
pnpm --dir packages/core analyze-rule-order \
  --xml-root /Users/nikita/git/round-trip/cf \
  --extension-root /Users/nikita/git/round-trip/cfe \
  --extension-base all \
  --output /private/tmp/nkdk-complete-xml-order-after \
  --concurrency 6 \
  --witness-limit 3
```

Expected: all observations are subsequences of current `xmlOrder`.

- [ ] **Step 5: Run runtime order tests**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/orchestration/property/xmlPropertyOrder.test.ts \
  metadata/orchestration/property/fromYAMLToXML.test.ts \
  metadata/forms/clientApplicationForm
pnpm --dir packages/core type-check
```

Expected: PASS.

- [ ] **Step 6: Commit the generated orders**

```bash
git add packages/core/metadata
git commit -m "feat: :sparkles: дополнить порядок XML в rules.ts"
```

- [ ] **Step 7: Verify applying again is idempotent**

Run:

```bash
test ! -e /private/tmp/nkdk-complete-xml-order-idempotent
pnpm --dir packages/core rewrite-rule-order \
  --xml-root /Users/nikita/git/round-trip/cf \
  --extension-root /Users/nikita/git/round-trip/cfe \
  --extension-base all \
  --output /private/tmp/nkdk-complete-xml-order-idempotent \
  --concurrency 6 \
  --witness-limit 3
git status --short
```

Expected: rewrite succeeds and worktree remains clean.

---

### Task 6: Проверить полный YAML round-trip конфигураций и расширений

**Files:**

- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`

**Interfaces:**

- Uses MCP tools: `nkdk.import_from_xml`, `nkdk.sync_to_xml`
- Configuration project component path: `cf`
- Extension project component paths: detected `cfe/<extension-name>`
- Base component for all extensions: YAML imported from `cf/all`

- [ ] **Step 1: Verify configuration round-trip**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip \
  NKDK_XML_DIR=/Users/nikita/git/round-trip/cf \
  ./.agents/skills/round-trip-yaml/round-trip.sh \
  --triage --all-configs --batch-size 20
```

Expected: no new XML diff for all seven configurations.

- [ ] **Step 2: Prove the helper cannot currently import an extension project**

Run the current helper against `cfe/control` and capture the expected failure caused by its
hardcoded `componentPath: "cf"`:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip \
  NKDK_XML_DIR=/Users/nikita/git/round-trip/cfe/control \
  ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: import rejects the detected `cfe/<name>` component because the request restricts it to
`cf`.

- [ ] **Step 3: Add explicit extension mode**

Add explicit arguments:

```text
--base-xml-dir /absolute/path/to/cf/all
--extension-root /absolute/path/to/cfe
```

For each extension, prepare one temporary project containing:

```text
cf/                  # imported base YAML
cfe/<detected-name>/ # imported extension YAML
```

Import the base first with `componentPath: "cf"`. Import each extension without a component-path
restriction, read `componentPath` from the MCP result, and use that path for `sync_to_xml`.
Preserve the existing behavior when these arguments are absent.

- [ ] **Step 4: Validate helper syntax and existing mode**

Run:

```bash
bash -n .agents/skills/round-trip-yaml/round-trip.sh
./.agents/skills/round-trip-yaml/round-trip.sh --help
```

Expected: PASS and help lists both extension arguments.

- [ ] **Step 5: Verify extension round-trip**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip \
  ./.agents/skills/round-trip-yaml/round-trip.sh \
  --base-xml-dir /Users/nikita/git/round-trip/cf/all \
  --extension-root /Users/nikita/git/round-trip/cfe \
  --triage --all-configs --batch-size 20
```

Expected: no new XML diff for `all-extension`, `control`, and `default`.

- [ ] **Step 6: Compare every remaining diff with fresh develop**

If a diff remains:

1. save its exact XML path and diff;
2. reproduce the same command in a clean worktree at `origin/develop`;
3. classify it as baseline only if the diff is byte-for-byte equivalent.

Order-related or branch-only diffs must be fixed before proceeding.

- [ ] **Step 7: Commit helper support**

```bash
git add .agents/skills/round-trip-yaml/round-trip.sh
git commit -m "feat: :sparkles: проверять расширения в YAML round-trip"
```

---

### Task 7: Выполнить финальную проверку и сохранить анализатор

**Files:**

- No intended source changes

**Interfaces:**

- Analyzer remains callable after completion
- Deletion requires a future explicit user command

- [ ] **Step 1: Verify no analyzer deletion is staged**

Run:

```bash
test -d packages/core/metadata/ruleOrderAnalysis
test -d packages/core/scripts/rule-order-analysis
rg -n '"analyze-rule-order"|"rewrite-rule-order"' packages/core/package.json
```

Expected: all checks succeed.

- [ ] **Step 2: Run final static checks**

Run:

```bash
pnpm --dir packages/core type-check
git diff --check
git status --short
```

Expected: type-check passes; worktree is clean.

- [ ] **Step 3: Run the complete repository test suite**

Run:

```bash
pnpm test
```

Expected: all `packages/core`, `packages/platform`, and `packages/mcp` tests pass.

- [ ] **Step 4: Record final evidence**

Report:

- analyzer report directories;
- counts for `cf` and `cfe`;
- skipped/ambiguity/conflict/cycle counts;
- files receiving new `xmlOrder`;
- YAML round-trip result or proven develop baseline;
- full test counts;
- final commit list.

Do not delete the analyzer and do not create a deletion commit.
