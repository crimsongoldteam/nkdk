# Structural References Explicit XML Omit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разрешить зарегистрированному `ТипЗначения: !xml` пройти локальную проверку импортированного YAML без ослабления TypeDescription.

**Architecture:** Нейтральный сборщик структурных ссылок получает от среды множество ключей свойств с действием explicit XML `omit` и пропускает их до fromYAML. Оба rules-адаптера вычисляют множество через один предметно-нейтральный helper над существующим `PropertyRuleExecution.collectExplicitXMLPropertyActions`.

**Tech Stack:** TypeScript, Vitest, metadata rule runtime, `round-trip-yaml`.

## Global Constraints

- Не добавлять новое применение `!xml` и не менять его YAML-представление.
- Не ослаблять `TypeDescription` fromYAML: незарегистрированный пустой `!xml` остаётся ошибкой.
- Не добавлять условия по `FormAttribute`, `ТипЗначения` или `СписокЗначений` в runtime и validation.
- Не изменять существующие XML-фикстуры.
- После законченного слоя выполнить `pnpm duplicates -- --base 37a608af2`.
- LMDB-зависимые и полные тесты выполнять вне песочницы.

---

## File Structure

- `packages/runtime/metadata/validation/structuralReferences.ts` — договор среды и общий пропуск свойств до fromYAML.
- `packages/rules/metadata/ruleRuntime/property/explicitXMLStructuralReferences.ts` — преобразование действий реестра в множество пропускаемых ключей.
- `packages/rules/metadata/validation/yamlFactExtractor.ts` — адаптер локальной проверки YAML.
- `packages/rules/metadata/operations/references.ts` — адаптер поиска и изменения структурных ссылок.
- `packages/rules/metadata/validation/yamlFactExtractor.form.test.ts` — регрессия настоящего пути локальной проверки формы.

### Task 1: Пропуск зарегистрированного explicit XML omit

**Files:**
- Create: `packages/rules/metadata/ruleRuntime/property/explicitXMLStructuralReferences.ts`
- Modify: `packages/runtime/metadata/validation/structuralReferences.ts:46-86,125-235`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.ts:865-940`
- Modify: `packages/rules/metadata/operations/references.ts:80-125`
- Test: `packages/rules/metadata/validation/yamlFactExtractor.form.test.ts`

**Interfaces:**
- Consumes: `PropertyRuleExecution.collectExplicitXMLPropertyActions({ yaml, itemType, properties }): ReadonlyMap<string, ExplicitXMLPropertyAction>`.
- Produces: `StructuralReferenceRuntime.omittedExplicitXMLPropertyKeys(params): ReadonlySet<string>`.
- Produces: `collectOmittedExplicitXMLPropertyKeys(execution, params): ReadonlySet<string>`.

- [ ] **Step 1: Write the failing regression test**

Добавить в `yamlFactExtractor.form.test.ts` один тест с настоящими
`metadataRules` и формой:

```ts
it("не преобразует зарегистрированный omit при сборе ссылок формы", () => {
  const facts = extractFormFacts([
    "Реквизиты:",
    "  РедактируемыйСписок:",
    "    Тип: СписокЗначений",
    "    ТипЗначения: !xml",
  ].join("\n"))

  expect(facts.diagnostics).toEqual([])
  expect(facts.pendingReferences).toEqual([])
})
```

Этот тест должен падать при удалении пропуска `omit`; это будет ошибкой, потому
что зарегистрированный XML-маркер снова попадёт в TypeDescription fromYAML.

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/validation/yamlFactExtractor.form.test.ts
```

Expected: FAIL с `ТипЗначения: недопустимое значение !xml для типа`.

- [ ] **Step 3: Extend the neutral runtime contract**

В `StructuralReferenceRuntime` добавить:

```ts
readonly omittedExplicitXMLPropertyKeys: (params: {
  readonly yaml: unknown
  readonly itemType: string
  readonly properties: Readonly<Record<string, StructuralReferencePropertyRule>>
}) => ReadonlySet<string>
```

В начале `collectObjectReferences` вычислить множество один раз:

```ts
const omittedExplicitXMLPropertyKeys = params.runtime.omittedExplicitXMLPropertyKeys({
  yaml: record,
  itemType: params.rule.itemType,
  properties: params.rule.properties,
})
```

В цикле свойств после проверки YAML-имени и наличия значения, но до
`valueFromYAML`, добавить:

```ts
if (omittedExplicitXMLPropertyKeys.has(propertyName)) continue
```

- [ ] **Step 4: Add the shared rules adapter helper**

Создать `explicitXMLStructuralReferences.ts`:

```ts
import type { StructuralReferenceRuntime } from "@nkdk/runtime"
import type { PropertyRuleExecution } from "@nkdk/runtime/rule-kit"

type OmittedExplicitXMLPropertyParams = Parameters<
  StructuralReferenceRuntime["omittedExplicitXMLPropertyKeys"]
>[0]

export function collectOmittedExplicitXMLPropertyKeys(
  execution: PropertyRuleExecution | undefined,
  params: OmittedExplicitXMLPropertyParams,
): ReadonlySet<string> {
  if (execution === undefined) return new Set()
  const actions = execution.collectExplicitXMLPropertyActions(params)
  return new Set(
    [...actions].flatMap(([propertyKey, action]) => action.kind === "omit" ? [propertyKey] : []),
  )
}
```

- [ ] **Step 5: Wire both adapters**

В `createPropertyStructuralReferenceRuntime` из `operations/references.ts` и
одноимённом адаптере `validation/yamlFactExtractor.ts` добавить:

```ts
omittedExplicitXMLPropertyKeys: (params) =>
  collectOmittedExplicitXMLPropertyKeys(transportRegistry(), params),
```

Оба адаптера должны использовать тот же helper и свой существующий
`transportRegistry`, чтобы работать и с переданным execution, и с текущим
контекстным реестром.

- [ ] **Step 6: Run the focused tests to verify GREEN**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata \
  metadata/validation/yamlFactExtractor.form.test.ts \
  metadata/validation/structuralReferences.test.ts \
  metadata/commonObjects/typeDescription/fromYAML.test.ts
```

Expected: PASS; тесты TypeDescription подтверждают, что пустой
незарегистрированный `!xml` не стал допустимым типом.

- [ ] **Step 7: Verify types and duplicates**

Run:

```bash
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 37a608af2
```

Expected: все команды завершаются с кодом 0, новых дублей нет.

- [ ] **Step 8: Commit the implementation layer**

```bash
git add \
  packages/runtime/metadata/validation/structuralReferences.ts \
  packages/rules/metadata/ruleRuntime/property/explicitXMLStructuralReferences.ts \
  packages/rules/metadata/validation/yamlFactExtractor.ts \
  packages/rules/metadata/operations/references.ts \
  packages/rules/metadata/validation/yamlFactExtractor.form.test.ts
git commit -m "fix: :bug: пропустить explicit XML omit при сборе ссылок" \
  -m "Зарегистрированные значения omit не являются смысловыми значениями YAML и не должны попадать в fromYAML при локальной проверке или операциях со ссылками."
```

### Task 2: Проверка настоящего round-trip и проекта

**Files:**
- No source changes: это проверка результата Task 1.

**Interfaces:**
- Consumes: исправленный production-путь XML-import из Task 1.
- Produces: подтверждение, что `Tester_1_0_10_34_setup1c` проходит прежний блокер или останавливается на следующем независимом расхождении.

- [ ] **Step 1: Run Tester round-trip outside the sandbox**

Run from the worktree with the XML repository and active directory set to:

```bash
NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/Tester_1_0_10_34_setup1c \
./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: прежняя ошибка `ТипЗначения: недопустимое значение !xml для типа`
не возникает. При следующей ошибке или XML-diff остановиться и исследовать её
отдельно, не расширяя текущее исправление.

- [ ] **Step 2: Run architecture checks**

```bash
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: PASS, новых нарушений границ нет.

- [ ] **Step 3: Run the full project test outside the sandbox**

```bash
pnpm test
```

Expected: PASS. Если Vitest worker завершается с SIGABRT, повторить запуск вне
песочницы; LMDB не пересобирать как первичное исправление.

- [ ] **Step 4: Final repository checks**

```bash
git diff --check
git status --short
git log -5 --oneline
```

Expected: нет незакоммиченных source-изменений; история содержит отдельные
коммиты спецификации, плана и реализации.
