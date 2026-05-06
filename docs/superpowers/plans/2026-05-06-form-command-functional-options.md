# Form Command Functional Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `FunctionalOptions` support to form commands through the existing full XML/TS/YAML fixture.

**Architecture:** `FormCommandRules` gets a `functionalOptions` property that uses the existing `FunctionalOptionsProperty` converter. The existing `fullFormCommands`, `fullFormCommandsYAML`, and `full.xml` fixtures become the single source of coverage for XML import/export and YAML import/export.

**Tech Stack:** TypeScript, Vitest, `packages/core` metadata orchestration rules, existing `FunctionalOptionsProperty` type rule.

---

## File Structure

- Modify `packages/core/metadata/forms/commonObjects/formCommand/rules.ts`
  - Add `functionalOptions` to `FormCommandRules.properties`.
  - Do not specify `xml`; orchestration derives `FunctionalOptions` from `functionalOptions`.
- Modify `packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/data.ts`
  - Add `functionalOptions` to `fullFormCommands`.
  - Add `ФункциональныеОпции` to `fullFormCommandsYAML`.
- Modify `packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/full.xml`
  - Use existing `<FunctionalOptions><Item>FunctionalOption.ФункциональнаяОпцияБулево</Item></FunctionalOptions>`.
- Existing tests cover the change:
  - `fromXML.test.ts` imports `full.xml` and compares with `fullFormCommands`.
  - `toXML.test.ts` exports `fullFormCommands` and compares with `full.xml`.
  - `fromYAML.test.ts` imports `fullFormCommandsYAML` and compares with `fullFormCommands`.
  - `toYAML.test.ts` exports `fullFormCommands` and compares with `fullFormCommandsYAML`.

---

### Task 1: Add Failing Fixture Expectations

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/full.xml`
- Test: `packages/core/metadata/forms/commonObjects/formCommand/fromXML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/formCommand/toXML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/formCommand/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/formCommand/toYAML.test.ts`

- [ ] **Step 1: Update TS fixture expectation**

In `packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/data.ts`, add `functionalOptions` to the object in `fullFormCommands` after `action`:

```typescript
    action: "Действие",
    functionalOptions: ["FunctionalOption.ФункциональнаяОпцияБулево"],
```

- [ ] **Step 2: Update YAML fixture expectation**

In the same file, add `ФункциональныеОпции` to `fullFormCommandsYAML` before `Таблица`:

```typescript
    РазрешитьИспользование: { Администратор: "Ложь" },
    ФункциональныеОпции: ["FunctionalOption.ФункциональнаяОпцияБулево"],
    Таблица: "Таблица",
```

- [ ] **Step 3: Update XML fixture expectation**

In `packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/full.xml`, keep this existing block after `<Action>Действие</Action>`:

```xml
		<FunctionalOptions>
			<Item>FunctionalOption.ФункциональнаяОпцияБулево</Item>
		</FunctionalOptions>
```

- [ ] **Step 4: Run XML/YAML tests to verify the missing rule is exposed**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formCommand/fromXML.test.ts packages/core/metadata/forms/commonObjects/formCommand/toXML.test.ts packages/core/metadata/forms/commonObjects/formCommand/fromYAML.test.ts packages/core/metadata/forms/commonObjects/formCommand/toYAML.test.ts
```

Expected: at least one test fails because `FormCommandRules` does not yet define `functionalOptions`.

---

### Task 2: Add FormCommand Rule Support

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/rules.ts`
- Test: `packages/core/metadata/forms/commonObjects/formCommand/fromXML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/formCommand/toXML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/formCommand/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/formCommand/toYAML.test.ts`

- [ ] **Step 1: Add the rule property**

In `packages/core/metadata/forms/commonObjects/formCommand/rules.ts`, add `functionalOptions` after `action`:

```typescript
    functionalOptions: {
      yaml: "ФункциональныеОпции",
      type: "FunctionalOptionsProperty",
    },
```

The surrounding block should become:

```typescript
    action: {
      yaml: "Действие",
      xml: "Action",
      type: "string",
    },
    functionalOptions: {
      yaml: "ФункциональныеОпции",
      type: "FunctionalOptionsProperty",
    },
    representation: {
      yaml: "ОтображениеКнопки",
      xml: "Representation",
      type: "SystemEnumeration",
      typeSE: "ButtonRepresentation",
    },
```

- [ ] **Step 2: Run focused formCommand tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formCommand/fromXML.test.ts packages/core/metadata/forms/commonObjects/formCommand/toXML.test.ts packages/core/metadata/forms/commonObjects/formCommand/fromYAML.test.ts packages/core/metadata/forms/commonObjects/formCommand/toYAML.test.ts
```

Expected: all four `formCommand` test files pass.

- [ ] **Step 3: Run the round-trip script**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh
```

Expected: `Catalogs/БанковскиеСчетаОрганизаций/Forms/ФормаСписка/Ext/Form.xml` is no longer the first diff caused by dropped `<FunctionalOptions>`. The script may still report later unrelated round-trip errors or diffs.

- [ ] **Step 4: Review changed files**

Run:

```bash
git diff -- packages/core/metadata/forms/commonObjects/formCommand/rules.ts packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/data.ts packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/full.xml
```

Expected: the diff only contains the `functionalOptions` rule and the three fixture additions above.

---

## Self-Review

- Spec coverage: the plan covers rule support, XML fixture, TS fixture, YAML fixture, focused tests, and round-trip verification.
- Placeholder scan: no placeholders remain.
- Type consistency: property name is consistently `functionalOptions`; YAML key is `ФункциональныеОпции`; XML element is derived as `FunctionalOptions`; converter type is `FunctionalOptionsProperty`.
