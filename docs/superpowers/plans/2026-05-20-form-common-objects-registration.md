# Form Common Objects Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load all existing form common object side-effect registrations through the public forms entrypoint so YAML export no longer leaks raw XML for form `События`, `Команды`, and table `AdditionSource`.

**Architecture:** Keep form element registration in `packages/core/metadata/forms/index.ts`, but replace the hand-maintained common object import subset with the existing `./commonObjects/index` aggregator. Add a public-entrypoint regression test that fails before the import change and proves form common objects are normalized through existing rules.

**Tech Stack:** TypeScript, Vitest, side-effect registries, existing metadata form XML/YAML conversion.

---

## File Structure

- Modify: `packages/core/metadata/forms/index.ts`
  - Responsibility: public forms entrypoint; must load form elements plus all form common object type registrations.
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
  - Responsibility: public-entrypoint regression coverage for XML -> YAML form conversion.
- No XML fixtures are modified.
- No new fromXML/toXML/fromYAML/toYAML rules are added.

## Required Pre-Read

Before editing `packages/core/metadata/**`, read the metadata knowledge docs required by project policy:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,240p' .agents/knowledge/metadata/yaml-contract.md
sed -n '1,240p' .agents/knowledge/metadata/round-trip-cycle.md
```

Expected: the implementation stays within the YAML cycle constraints, does not alter XML fixtures, and uses existing registrations rather than creating new rules.

## Task 1: Add Regression Test For Form Common Object Registrations

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`

- [ ] **Step 1: Add the failing public-entrypoint test**

Add this test after `public core entrypoint exports child items through element YAML rules` in `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`:

```ts
  it("public core entrypoint exports form common objects through YAML rules", async () => {
    const script = `
      import assert from "node:assert/strict"
      import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
      import { tmpdir } from "node:os"
      import { join } from "node:path"
      import "./index"
      import { convertFormFromXML } from "./metadata/forms/clientApplicationForm/convertFromXML"

      const metadataXML = \`<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="21a1cd6e-30f0-4f8a-9b2a-0e6f30a4f101">
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
  <Events>
    <Event name="NotificationProcessing">ОбработкаОповещения</Event>
    <Event name="OnCreateAtServer">ПриСозданииНаСервере</Event>
  </Events>
  <ChildItems>
    <Table name="Список" id="1">
      <Representation>List</Representation>
      <AutoCommandBar name="СписокКоманднаяПанель" id="2"/>
      <SearchStringAddition name="СписокСтрокаПоиска" id="3">
        <AdditionSource>
          <Item>Список</Item>
          <Type>SearchStringRepresentation</Type>
        </AdditionSource>
        <ContextMenu name="СписокСтрокаПоискаКонтекстноеМеню" id="4"/>
        <ExtendedTooltip name="СписокСтрокаПоискаРасширеннаяПодсказка" id="5"/>
      </SearchStringAddition>
      <Events>
        <Event name="Selection">СписокВыбор</Event>
      </Events>
    </Table>
  </ChildItems>
  <Commands>
    <Command name="ПереключитьАктивностьПроводок" id="10">
      <Title>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Переключить активность проводок</v8:content>
        </v8:item>
      </Title>
      <ToolTip>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Подсказка команды</v8:content>
        </v8:item>
      </ToolTip>
      <Picture>
        <xr:Ref>StdPicture.SwitchActivity</xr:Ref>
        <xr:LoadTransparent>true</xr:LoadTransparent>
      </Picture>
      <Action>ПереключитьАктивностьПроводок</Action>
      <CurrentRowUse>DontUse</CurrentRowUse>
    </Command>
  </Commands>
</Form>\`

      const projectDir = mkdtempSync(join(tmpdir(), "nakidka-form-common-objects-public-"))
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

        assert.match(yaml, /События:\\n  ОбработкаОповещения: ОбработкаОповещения\\n  ПриСозданииНаСервере: ПриСозданииНаСервере/)
        assert.match(yaml, /События:\\n      Выбор: СписокВыбор/)
        assert.match(yaml, /Команды:\\n  ПереключитьАктивностьПроводок:/)
        assert.match(yaml, /Заголовок: Переключить активность проводок/)
        assert.match(yaml, /Подсказка: Подсказка команды/)
        assert.match(yaml, /Картинка: ПереключитьАктивность/)
        assert.match(yaml, /Действие: ПереключитьАктивностьПроводок/)
        assert.match(yaml, /ИспользованиеТекущейСтроки: НеИспользует/)
        assert.match(yaml, /Источник: Список/)
        assert.doesNotMatch(yaml, /"#text"/)
        assert.doesNotMatch(yaml, /Event:/)
        assert.doesNotMatch(yaml, /Command:/)
        assert.doesNotMatch(yaml, /AdditionSource:/)
        assert.doesNotMatch(yaml, /Title:/)
        assert.doesNotMatch(yaml, /ToolTip:/)
        assert.doesNotMatch(yaml, /Picture:/)
      } finally {
        rmSync(projectDir, { recursive: true, force: true })
      }
    `

    expect(() =>
      execFileSync("node", ["--import", "tsx", "-e", script], { cwd: process.cwd(), encoding: "utf-8" })
    ).not.toThrow()
  })
```

- [ ] **Step 2: Run the focused test and verify it fails for the right reason**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/convertFromXML.test.ts --no-isolate
```

Expected before the fix: FAIL in `public core entrypoint exports form common objects through YAML rules`.

The failure should show raw YAML shape such as one or more of:

```yaml
События:
  Event:
Команды:
  Command:
AdditionSource:
Title:
ToolTip:
Picture:
"#text":
```

If the test fails because the temporary XML cannot be parsed or because a YAML label differs, inspect the generated failure output and adjust only the exact expected label. Do not weaken the negative assertions for `"#text"`, `Event:`, `Command:`, `AdditionSource:`, `Title:`, `ToolTip:`, or `Picture:`.

## Task 2: Load The Existing Common Object Registration Aggregator

**Files:**
- Modify: `packages/core/metadata/forms/index.ts`

- [ ] **Step 1: Replace the manual common object import list**

Change `packages/core/metadata/forms/index.ts` from:

```ts
import "./elements"

import "./commonObjects/childItems/fromXML"
import "./commonObjects/childItems/fromYAML"
import "./commonObjects/childItems/toXML"
import "./commonObjects/childItems/toYAML"

import "./commonObjects/commandInterface/fromXML"
import "./commonObjects/commandInterface/fromYAML"
import "./commonObjects/commandInterface/toXML"
import "./commonObjects/commandInterface/toYAML"

import "./commonObjects/formAttribute/fromXML"
import "./commonObjects/formAttribute/fromYAML"
import "./commonObjects/formAttribute/toXML"
import "./commonObjects/formAttribute/toYAML"
```

to:

```ts
import "./elements"
import "./commonObjects/index"
```

Do not remove the exports at the top of the file.

- [ ] **Step 2: Confirm the aggregator contains the needed registrations**

Run:

```bash
rg -n "childItems|commandInterface|formAttribute|formCommand|tableAdditionalSource|event" packages/core/metadata/forms/commonObjects/index.ts
```

Expected: output includes imports for:

```text
childItems/fromXML
childItems/fromYAML
childItems/toXML
childItems/toYAML
commandInterface/fromXML
commandInterface/fromYAML
commandInterface/toXML
commandInterface/toYAML
formAttribute/fromXML
formAttribute/fromYAML
formAttribute/toXML
formAttribute/toYAML
formCommand/types
tableAdditionalSource/fromXML
tableAdditionalSource/toXML
event/fromXML
event/fromYAML
event/toXML
event/toYAML
```

If one of these is missing, stop and report the missing import before adding new behavior. The expected design is to use existing registrations through the aggregator.

- [ ] **Step 3: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/convertFromXML.test.ts --no-isolate
```

Expected after the fix: PASS for all tests in `convertFromXML.test.ts`.

## Task 3: Commit And Run Round-Trip Diagnostics

**Files:**
- No additional code changes expected.

- [ ] **Step 1: Inspect local status**

Run:

```bash
git status --short
```

Expected: only these files are modified:

```text
 M packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts
 M packages/core/metadata/forms/index.ts
```

- [ ] **Step 2: Commit the implementation**

Run:

```bash
git add packages/core/metadata/forms/index.ts packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts
git commit -m "fix: :bug: подключить commonObjects форм"
```

Expected: a commit is created with only the implementation and regression test.

- [ ] **Step 3: Run round-trip-yaml triage**

Run from the repository root:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected:

```text
Готово: 10780 успешно, 0 с ошибкой
Готово: 10780 успешно, 0 с ошибкой
```

The first triage diffs should no longer be explained by raw form common object YAML for `События`, `Команды`, `AdditionSource`, `Title`, `ToolTip`, or `Picture`.

- [ ] **Step 4: Classify remaining first diffs**

If `DIFF_COUNT` remains non-zero, inspect the first five `TRIAGE_DIFF` blocks in the command output and classify them.

Use this format in the final implementation report:

```text
round-trip-yaml:
- import: 10780 успешно, 0 с ошибкой
- sync: 10780 успешно, 0 с ошибкой
- DIFF_COUNT: <number>
- first diffs: <short classification>
```

Do not implement more fixes in this plan unless the remaining first diffs are the same missing `commonObjects/index` registration problem.

## Self-Review

- Spec coverage: Task 1 covers the public-entrypoint regression for root `Events`, nested element `Events`, `FormCommands`, command `I8nText`/`Picture`, and `TableAdditionalSource`. Task 2 implements the aggregator import. Task 3 verifies focused behavior and full `round-trip-yaml` diagnostics.
- Placeholder scan: No placeholder steps remain. Every code-changing step includes exact code or exact replacement content.
- Type consistency: The plan uses existing property types and labels: `Events`, `FormCommands`, `TableAdditionalSource`, `События`, `Команды`, `Источник`, `Заголовок`, `Подсказка`, and `Картинка`.
