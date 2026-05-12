# ClientApplicationForm GroupList Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить поддержку корневого поля формы `GroupList` в XML, TS-модель, YAML и `ClientApplicationFormRules`.

**Architecture:** Поле реализуется декларативно через `ClientApplicationFormRules`, поэтому существующие механизмы fromXML/toXML/fromYAML/toYAML сами добавят его в модель и обратно в форматы. Фикстуры расширяются в существующих полных сценариях формы, минимальные сценарии остаются без поля и продолжают проверять необязательность.

**Tech Stack:** TypeScript, Vitest, `packages/core/metadata/orchestration`, XML/YAML правила `ClientApplicationForm`.

---

## File Structure

- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
  - Добавляет декларативное поле `groupList`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/full.xml`
  - XML-полная форма получает `<GroupList>Дерево</GroupList>`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/catalogFull.xml`
  - XML-полная форма справочника получает `<GroupList>Дерево</GroupList>`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.xml`
  - XML-полная форма документа получает `<GroupList>2:02023637-7868-4a5f-8576-835a76e0c9ba</GroupList>`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
  - TS/YAML фикстуры `fullClientApplicationForm`, `fullClientApplicationFormYAML`, `catalogFullClientApplicationForm`, `catalogFullClientApplicationFormYAML` получают `groupList` / `СписокГрупп`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts`
  - TS-фикстура документа получает `groupList`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts`
  - YAML-фикстура документа получает `СписокГрупп`.

## Task 1: Add Failing XML Coverage Through Fixtures

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/catalogFull.xml`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.xml`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts`

- [ ] **Step 1: Add `GroupList` to XML fixtures**

In `full.xml`, insert this block immediately after the existing `<Group>Horizontal</Group>` line:

```xml
	<GroupList>Дерево</GroupList>
```

In `catalogFull.xml`, insert this block immediately after `<Group>AlwaysHorizontal</Group>`:

```xml
	<GroupList>Дерево</GroupList>
```

In `documentFull.xml`, insert this block immediately after `<Group>HorizontalIfPossible</Group>`:

```xml
	<GroupList>2:02023637-7868-4a5f-8576-835a76e0c9ba</GroupList>
```

- [ ] **Step 2: Add expected `groupList` to TS model fixtures**

In `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`, add `groupList` after `group` in `fullClientApplicationForm`:

```ts
  group: "Horizontal",
  groupList: "Дерево",
```

In the same file, add `groupList` after `group` in `catalogFullClientApplicationForm`:

```ts
  group: "AlwaysHorizontal",
  groupList: "Дерево",
```

In `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts`, add `groupList` after `group` in `documentFullClientApplicationFormData`:

```ts
  group: "HorizontalIfPossible",
  groupList: "2:02023637-7868-4a5f-8576-835a76e0c9ba",
```

- [ ] **Step 3: Run XML import tests and verify they fail before rules change**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts
```

Expected: FAIL in full-form import assertions because imported models do not yet contain `groupList`.

- [ ] **Step 4: Commit failing XML fixture coverage**

```bash
git add \
  packages/core/metadata/forms/clientApplicationForm/__fixtures__/full.xml \
  packages/core/metadata/forms/clientApplicationForm/__fixtures__/catalogFull.xml \
  packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.xml \
  packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts \
  packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts
git commit -m "test: :white_check_mark: зафиксировать GroupList формы"
```

## Task 2: Add `groupList` Rule

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`

- [ ] **Step 1: Add the declarative rule**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, add `groupList` immediately after the existing `group` rule:

```ts
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsGroup",
      tag: FormRulesTags.Form,
      defaultValueYAML: "Horizontal",
    },
    groupList: {
      yaml: "СписокГрупп",
      xml: "GroupList",
      type: "string",
      tag: FormRulesTags.Form,
    },
```

- [ ] **Step 2: Run XML import tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts
```

Expected: PASS. The new `GroupList` XML nodes import to `groupList`.

- [ ] **Step 3: Run XML export tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/clientApplicationForm/toXML.test.ts
```

Expected: PASS. The existing full XML expected strings now include `GroupList`, and export writes it from `groupList`.

- [ ] **Step 4: Commit the rule**

```bash
git add packages/core/metadata/forms/clientApplicationForm/rules.ts
git commit -m "feat: :sparkles: добавить GroupList формы"
```

## Task 3: Add YAML Fixture Coverage

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`

- [ ] **Step 1: Add `СписокГрупп` to YAML fixture objects**

In `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`, add this line after `Группировка: "Горизонтальная",` in `fullClientApplicationFormYAML`:

```ts
  СписокГрупп: "Дерево",
```

In the same file, add this line after `Группировка: "ГоризонтальнаяВсегда",` in `catalogFullClientApplicationFormYAML`:

```ts
  СписокГрупп: "Дерево",
```

In `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts`, add this line after `Группировка: "ГоризонтальнаяЕслиВозможно",` in `documentFullClientApplicationFormYAMLData`:

```ts
  СписокГрупп: "2:02023637-7868-4a5f-8576-835a76e0c9ba",
```

- [ ] **Step 2: Run YAML import tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts
```

Expected: PASS. `СписокГрупп` imports to `groupList` in full, catalog, and document form fixtures.

- [ ] **Step 3: Run YAML export tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts
```

Expected: PASS. `groupList` exports as `СписокГрупп`.

- [ ] **Step 4: Commit YAML coverage**

```bash
git add \
  packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts \
  packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts
git commit -m "test: :white_check_mark: покрыть СписокГрупп формы"
```

## Task 4: Verify Targeted Module and Round-Trip Cluster

**Files:**
- No source changes expected.
- Test: `packages/core/metadata/forms/clientApplicationForm/*.test.ts`
- Test: `.agents/skills/round-trip-xml/round-trip.sh`

- [ ] **Step 1: Run all clientApplicationForm tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/clientApplicationForm
```

Expected: PASS for the client application form test set.

- [ ] **Step 2: Re-run the round-trip triage batch**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected: the first five diffs are no longer the same `GroupList` losses. The command may still find other diffs in `/Users/nikita/git/round-trip-source/acc`; that is acceptable if they are unrelated to `<GroupList>`.

- [ ] **Step 3: Inspect status**

Run:

```bash
git status --short
```

Expected: only intentional implementation files are modified, or the tree is clean if all task commits were made.

- [ ] **Step 4: Commit any verification-only adjustments if needed**

If Task 4 uncovers a small ordering mismatch in XML output, adjust only the placement of `GroupList` in XML fixture files to match `toXML`, then run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/clientApplicationForm/toXML.test.ts
```

Expected: PASS.

Then commit:

```bash
git add packages/core/metadata/forms/clientApplicationForm/__fixtures__
git commit -m "test: :white_check_mark: согласовать порядок GroupList формы"
```

## Self-Review

- Spec coverage: covered XML `GroupList`, TS `groupList`, YAML `СписокГрупп`, rules field, optional minimal fixtures, and round-trip verification.
- Placeholder scan: no unresolved markers or unspecified implementation steps.
- Type consistency: `groupList` is used consistently as the TS property; `GroupList` is the XML tag; `СписокГрупп` is the YAML key.
