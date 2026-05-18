# Form User Settings Events Case Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve canonical XML case for the form-level `OnLoadUserSettingsAtServer` and `OnSaveUserSettingsAtServer` events.

**Architecture:** Keep the common `Events` importer/exporter unchanged. Fix the missing metadata by adding the two events to `ClientApplicationFormRules.properties.events.items`, where `Events.toXML` already looks up known event keys before choosing XML case.

**Tech Stack:** TypeScript, Vitest, existing `rules.ts` metadata rule system, `testExportPropertyToXML`.

---

## File Structure

- Modify `packages/core/metadata/forms/commonObjects/event/toXML.test.ts`
  - Add focused export coverage for the two missing form-level events.
  - Add a regression check that unknown reference-backed event names keep existing behavior.
- Modify `packages/core/metadata/forms/clientApplicationForm/rules.ts`
  - Add exactly two known form-level event keys under `ClientApplicationFormRules.properties.events.items`.

No new modules, fixtures, XML files, YAML files, or custom `fromXML/toXML` rules are needed.

### Task 1: Add Failing Event Export Tests

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/event/toXML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/event/toXML.test.ts`

- [ ] **Step 1: Replace the test file with expanded focused coverage**

Update `packages/core/metadata/forms/commonObjects/event/toXML.test.ts` to this content:

```ts
import { describe, expect, it } from "vitest"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

describe("export Events to XML", () => {
  it("exports form user settings update event with canonical XML case", () => {
    const { result } = testExportPropertyToXML({
      rule: ClientApplicationFormRules.properties.events,
      value: {
        onUpdateUserSettingSetAtServer: "ПриОбновленииСоставаПользовательскихНастроекНаСервере",
      },
      referenceMetadata: {
        onUpdateUserSettingSetAtServer: "ПриОбновленииСоставаПользовательскихНастроекНаСервере",
      },
      xmlRootTag: "Events",
    })

    expect(result).toEqual(
      '<Events>\n' +
        '\t<Event name="OnUpdateUserSettingSetAtServer">ПриОбновленииСоставаПользовательскихНастроекНаСервере</Event>\n' +
        "</Events>"
    )
  })

  it("exports form user settings load and save events with canonical XML case", () => {
    const { result } = testExportPropertyToXML({
      rule: ClientApplicationFormRules.properties.events,
      value: {
        onLoadUserSettingsAtServer: "ПриЗагрузкеПользовательскихНастроекНаСервере",
        onSaveUserSettingsAtServer: "ПриСохраненииПользовательскихНастроекНаСервере",
      },
      referenceMetadata: {
        onLoadUserSettingsAtServer: "ПриЗагрузкеПользовательскихНастроекНаСервере",
        onSaveUserSettingsAtServer: "ПриСохраненииПользовательскихНастроекНаСервере",
      },
      xmlRootTag: "Events",
    })

    expect(result).toEqual(
      '<Events>\n' +
        '\t<Event name="OnLoadUserSettingsAtServer">ПриЗагрузкеПользовательскихНастроекНаСервере</Event>\n' +
        '\t<Event name="OnSaveUserSettingsAtServer">ПриСохраненииПользовательскихНастроекНаСервере</Event>\n' +
        "</Events>"
    )
  })

  it("keeps unknown reference event names unchanged", () => {
    const { result } = testExportPropertyToXML({
      rule: ClientApplicationFormRules.properties.events,
      value: {
        vendorSpecificFormEvent: "ВендорскоеСобытие",
      },
      referenceMetadata: {
        vendorSpecificFormEvent: "ВендорскоеСобытие",
      },
      xmlRootTag: "Events",
    })

    expect(result).toEqual(
      '<Events>\n' + '\t<Event name="vendorSpecificFormEvent">ВендорскоеСобытие</Event>\n' + "</Events>"
    )
  })
})
```

- [ ] **Step 2: Run the focused test and verify the new known-event test fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/event/toXML.test.ts
```

Expected:

- The existing `onUpdateUserSettingSetAtServer` test passes.
- `keeps unknown reference event names unchanged` passes.
- `exports form user settings load and save events with canonical XML case` fails because the result contains `name="onLoadUserSettingsAtServer"` and `name="onSaveUserSettingsAtServer"` instead of `OnLoad...` and `OnSave...`.

### Task 2: Add the Two Missing Form Event Keys

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Test: `packages/core/metadata/forms/commonObjects/event/toXML.test.ts`

- [ ] **Step 1: Add the missing keys beside related user settings events**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, find this block:

```ts
        onCreateAtServer: "ПриСозданииНаСервере",
        onSaveDataInSettingsAtServer: "ПриСохраненииДанныхВНастройкахНаСервере",
        onUpdateUserSettingSetAtServer: "ПриОбновленииСоставаПользовательскихНастроекНаСервере",
        onClientApplicationSuspend: "ПриЗасыпанииКлиентскогоПриложения",
```

Change it to:

```ts
        onCreateAtServer: "ПриСозданииНаСервере",
        onLoadUserSettingsAtServer: "ПриЗагрузкеПользовательскихНастроекНаСервере",
        onSaveDataInSettingsAtServer: "ПриСохраненииДанныхВНастройкахНаСервере",
        onSaveUserSettingsAtServer: "ПриСохраненииПользовательскихНастроекНаСервере",
        onUpdateUserSettingSetAtServer: "ПриОбновленииСоставаПользовательскихНастроекНаСервере",
        onClientApplicationSuspend: "ПриЗасыпанииКлиентскогоПриложения",
```

Do not add `beforeLoadUserSettingsAtServer` or any other event in this task.

- [ ] **Step 2: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/event/toXML.test.ts
```

Expected:

- All 3 tests in `toXML.test.ts` pass.
- The generated XML for the two new events contains `OnLoadUserSettingsAtServer` and `OnSaveUserSettingsAtServer`.

- [ ] **Step 3: Commit the behavior change**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/event/toXML.test.ts packages/core/metadata/forms/clientApplicationForm/rules.ts
git commit -m "fix: :bug: исправить регистр событий формы"
```

### Task 3: Verify Wider Safety

**Files:**
- Test: `packages/core/metadata/forms/commonObjects/event/toXML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/*.test.ts`
- Test: project root test suite

- [ ] **Step 1: Run form event tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/event/toXML.test.ts
```

Expected:

- `Test Files  1 passed`
- `Tests  3 passed`

- [ ] **Step 2: Run client application form tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/clientApplicationForm
```

Expected:

- All tests in `packages/core/metadata/forms/clientApplicationForm` pass.
- No snapshot or XML fixture changes are produced.

- [ ] **Step 3: Run the full project test suite**

Run from the worktree root:

```bash
pnpm test
```

Expected:

- All workspace package tests pass.
- No files are modified by the test run.

- [ ] **Step 4: Check git status**

Run:

```bash
git status --short
```

Expected:

- Empty output.

### Task 4: Optional Round-trip Confirmation

**Files:**
- No source files.
- External XML source: `/Users/nikita/git/round-trip-source/acc/Reports/АнализДвиженийДенежныхСредств/Forms/ФормаОтчета/Ext/Form.xml`

- [ ] **Step 1: Run the round-trip triage script after preceding diffs are fixed**

Run this only after the earlier `ExchangePlans/*/Attribute/Synonym` diffs are fixed, because the script stops at the first active diff batch.

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected:

- The triage output no longer contains this diff:

```diff
- <Event name="OnLoadUserSettingsAtServer">ПриЗагрузкеПользовательскихНастроекНаСервере</Event>
- <Event name="OnSaveUserSettingsAtServer">ПриСохраненииПользовательскихНастроекНаСервере</Event>
+ <Event name="onLoadUserSettingsAtServer">ПриЗагрузкеПользовательскихНастроекНаСервере</Event>
+ <Event name="onSaveUserSettingsAtServer">ПриСохраненииПользовательскихНастроекНаСервере</Event>
```

- [ ] **Step 2: If the event-case diff still appears, stop and inspect the exported XML**

Run:

```bash
rg -n "onLoadUserSettingsAtServer|onSaveUserSettingsAtServer|OnLoadUserSettingsAtServer|OnSaveUserSettingsAtServer" /Users/nikita/git/round-trip-source/acc/Reports/АнализДвиженийДенежныхСредств/Forms/ФормаОтчета/Ext/Form.xml
```

Expected:

- If the fix is correct, only canonical `OnLoadUserSettingsAtServer` and `OnSaveUserSettingsAtServer` should remain in the XML after round-trip.
- If lowercase `onLoad...` or `onSave...` remains, do not broaden the event list. First inspect whether the form export is using `ClientApplicationFormRules.properties.events` or another rule.
