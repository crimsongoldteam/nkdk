# Form ChildItems YAML Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore form child item YAML export so `Элементы` is written through form element rules instead of raw XML objects with whitespace-only `#text`.

**Architecture:** The fix is a side-effect registration repair in the forms entrypoint. `packages/core/metadata/forms/index.ts` should import the existing `childItems` handlers so `GroupChildItems`, `CommandBarChildItems`, `TableChildItems`, and `PagesChildItems` use their registered XML/YAML conversions. A regression test exercises the public core entrypoint, because the bug appears when CLI/API code relies on exported package setup.

**Tech Stack:** TypeScript, Vitest, package side-effect registries, existing metadata form orchestration.

---

## File Structure

- Modify: `packages/core/metadata/forms/index.ts`
  - Responsibility: load all form-level side-effect registrations needed by public form conversion APIs.
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
  - Responsibility: regression coverage that public core imports produce normalized form element YAML and do not leak raw XML whitespace `#text`.
- No existing XML fixtures are modified.

### Task 1: Add Regression Test For Public Form YAML Export

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`

- [ ] **Step 1: Add a failing regression test**

Add this test after `registers commonObjects before reading form title from XML` in `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`:

```ts
  it("public core entrypoint exports child items through element YAML rules", async () => {
    const script = String.raw`
      import assert from "node:assert/strict"
      import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
      import { tmpdir } from "node:os"
      import { join } from "node:path"
      import { convertFormFromXML } from "./index"

      const metadataXML = \`<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="21a1cd6e-30f0-4f8a-9b2a-0e6f30a4f100">
    <Properties>
      <Name>ФормаСписка</Name>
      <Synonym>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Форма списка</v8:content>
        </v8:item>
      </Synonym>
      <Comment/>
      <UsePurposes>PersonalComputer</UsePurposes>
    </Properties>
  </Form>
</MetaDataObject>\`

      const formXML = \`<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <ChildItems>
    <UsualGroup name="ГруппаБыстрыеОтборы" id="62">
      <Title>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Быстрые отборы</v8:content>
        </v8:item>
      </Title>
      <Group>Horizontal</Group>
      <Behavior>Usual</Behavior>
      <Representation>None</Representation>
      <ShowTitle>false</ShowTitle>
      <ExtendedTooltip name="ГруппаБыстрыеОтборыExtendedTooltip" id="87"/>
    </UsualGroup>
  </ChildItems>
</Form>\`

      const projectDir = mkdtempSync(join(tmpdir(), "nakidka-form-yaml-public-"))
      const inputDir = join(projectDir, "input")
      const formExtDir = join(inputDir, "ФормаСписка", "Ext")
      const outputDir = join(projectDir, "output")

      try {
        mkdirSync(formExtDir, { recursive: true })
        writeFileSync(join(inputDir, "ФормаСписка.xml"), metadataXML, "utf-8")
        writeFileSync(join(formExtDir, "Form.xml"), formXML, "utf-8")

        await convertFormFromXML({
          context: {
            defaultLanguage: "ru",
            version: "2.20",
            exportToYAML: { toTyped: false },
            fromXML: { forReference: false },
          },
          inputDir,
          formName: "ФормаСписка",
          outputDir,
        })

        const yaml = readFileSync(join(outputDir, "Формы", "ФормаСписка", "Форма.yaml"), "utf-8")

        assert.match(yaml, /Элементы:\n  ГруппаБыстрыеОтборы:/)
        assert.match(yaml, /Вид: ОбычнаяГруппа/)
        assert.match(yaml, /Заголовок: Быстрые отборы/)
        assert.doesNotMatch(yaml, /"#text"/)
        assert.doesNotMatch(yaml, /- UsualGroup:/)
      } finally {
        rmSync(projectDir, { recursive: true, force: true })
      }
    `

    expect(() =>
      execFileSync("node", ["--import", "tsx", "-e", script], { cwd: process.cwd(), encoding: "utf-8" })
    ).not.toThrow()
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/convertFromXML.test.ts --no-isolate
```

Expected before the fix: FAIL in `public core entrypoint exports child items through element YAML rules`; the YAML still contains `- UsualGroup:` or `"#text"` instead of the tree YAML shape.

### Task 2: Restore ChildItems Registrations

**Files:**
- Modify: `packages/core/metadata/forms/index.ts`

- [ ] **Step 1: Add the missing side-effect imports**

In `packages/core/metadata/forms/index.ts`, after `import "./elements"`, add:

```ts
import "./commonObjects/childItems/fromXML"
import "./commonObjects/childItems/fromYAML"
import "./commonObjects/childItems/toXML"
import "./commonObjects/childItems/toYAML"
```

The file should keep existing imports for `commandInterface` and `formAttribute`.

- [ ] **Step 2: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/convertFromXML.test.ts --no-isolate
```

Expected after the fix: PASS for all tests in `convertFromXML.test.ts`.

- [ ] **Step 3: Inspect the generated YAML shape through the test failure output if needed**

If the test still fails on `Вид: ОбычнаяГруппа`, inspect `packages/core/metadata/orchestration/formElement/types.ts` for the current YAML label of `UsualGroup` and update only that expected string in the test. Do not weaken the assertions for `Заголовок: Быстрые отборы`, absence of `"#text"`, or absence of `- UsualGroup:`.

### Task 3: Verify Round-Trip Behavior

**Files:**
- No code changes expected.

- [ ] **Step 1: Confirm local repo status before diagnostic run**

Run:

```bash
git status --short
```

Expected: only the implementation files from Tasks 1-2 are modified.

- [ ] **Step 2: Commit the implementation**

Run:

```bash
git add packages/core/metadata/forms/index.ts packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts
git commit -m "fix: :bug: восстановить YAML элементов формы"
```

Expected: a commit is created with only the code and test changes.

- [ ] **Step 3: Run round-trip-yaml triage again**

Run from the repository root:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected: `nkdk import` and `nkdk sync` both finish with `0 с ошибкой`. The first triage diffs should no longer be explained by raw whitespace-only `#text` leaked through `Элементы`.

- [ ] **Step 4: Classify remaining first diffs**

If diffs remain, inspect the first five and classify them separately. Do not add more fixes in this task unless the remaining diffs are the same missing-registration issue.

## Self-Review

- Spec coverage: The plan restores `childItems` registrations, adds a regression that proves `I8nText` is reached for element titles, and verifies round-trip behavior.
- Placeholder scan: No placeholder steps remain.
- Type consistency: The plan uses existing exported names: `convertFormFromXML`, `GroupChildItems`, and `Форма.yaml`.
