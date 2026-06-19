# Round Trip YAML Fast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `round-trip-yaml-fast`, a fast diagnostic path for `XML -> модель -> YAML-текст -> модель -> XML` metadata diffs without writing YAML/XML output trees.

**Architecture:** Add a focused core module that runs one in-memory round-trip per top-level metadata XML file and returns structured diff/error records. Expose it through a small CLI command, then wrap the CLI with a Codex skill script that provides single and triage workflows. Keep existing `syncConfigurationFromXML`, `syncConfigurationToXML`, and full `round-trip-yaml` untouched.

**Tech Stack:** TypeScript, Vitest, Commander, Bash, existing `@nakidka/core` metadata orchestration, `fast-xml-parser`, `yaml`, `pnpm`.

---

## Scope Check

The spec covers one subsystem with three layers that depend on each other:

- core fast round-trip engine;
- CLI command over that engine;
- Codex skill wrapper over the CLI.

This is suitable for one implementation plan. The tasks below keep those layers independently testable.

## File Structure

- Create `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`.
  - Responsibility: discover supported top-level metadata XML files, run in-memory XML/YAML/XML round-trip, format small unified diffs, return structured results.
- Create `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`.
  - Responsibility: prove YAML goes through text, XML is not written, clean/diff/error cases are represented.
- Modify `packages/core/index.ts`.
  - Responsibility: export `roundTripYAMLFast` and related result types for CLI use.
- Create `packages/cli/src/commands/roundTripYAMLFast.ts`.
  - Responsibility: call core, print machine-readable blocks, set exit code only for processing errors.
- Create `packages/cli/src/commands/roundTripYAMLFast.test.ts`.
  - Responsibility: test command output for clean, diff, and error cases through the public command function.
- Modify `packages/cli/src/cli.ts`.
  - Responsibility: register `nkdk round-trip-yaml-fast <xml-dir>`.
- Create `.agents/skills/round-trip-yaml-fast/SKILL.md`.
  - Responsibility: document how Codex should run and interpret fast diagnostics.
- Create `.agents/skills/round-trip-yaml-fast/round-trip.sh`.
  - Responsibility: read `.env`, resolve XML dirs, run CLI, and select single/triage output.

## Task 1: Core Fast Round-Trip Engine

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`
- Modify: `packages/core/index.ts`

- [ ] **Step 1: Read required metadata knowledge**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,220p' .agents/knowledge/metadata/round-trip-cycle.md
sed -n '1,220p' .agents/knowledge/metadata/yaml-contract.md
```

Expected: documents are read before editing `packages/core/metadata/**`.

- [ ] **Step 2: Write failing core tests**

Create `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`:

```ts
import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { roundTripYAMLFast } from "./roundTripYAMLFast"

const enumXml = (params: { name: string; choiceMode?: string }): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Enum uuid="d381585b-33ee-4f3e-9362-ae06f761f29d">
    <Properties>
      <Name>${params.name}</Name>
      <Synonym>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>${params.name}</v8:content>
        </v8:item>
      </Synonym>
      <Comment/>
      <UseStandardCommands>false</UseStandardCommands>
      <QuickChoice>true</QuickChoice>
      ${params.choiceMode === undefined ? "" : `<ChoiceMode>${params.choiceMode}</ChoiceMode>`}
      <DefaultListForm/>
      <DefaultChoiceForm/>
      <AuxiliaryListForm/>
      <AuxiliaryChoiceForm/>
      <ListPresentation/>
      <ExtendedListPresentation/>
      <Explanation/>
      <ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput>
    </Properties>
    <ChildObjects/>
  </Enum>
</MetaDataObject>`

const makeXmlProject = (xml: string): string => {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-round-trip-yaml-fast-"))
  fs.mkdirSync(join(dir, "Enums"), { recursive: true })
  fs.writeFileSync(join(dir, "Enums", "ВидыСервисовЭДО.xml"), xml, "utf-8")
  return dir
}

describe("roundTripYAMLFast", () => {
  it("returns no diffs for stable metadata xml", async () => {
    const xmlDir = makeXmlProject(enumXml({ name: "ВидыСервисовЭДО", choiceMode: "BothWays" }))
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.errors).toEqual([])
      expect(result.diffs).toEqual([])
      expect(result.checked).toBe(1)
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("reports a diff produced by yaml text round-trip", async () => {
    const xmlDir = makeXmlProject(enumXml({ name: "ВидыСервисовЭДО" }))
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.errors).toEqual([])
      expect(result.diffs).toHaveLength(1)
      expect(result.diffs[0]?.file).toBe("Enums/ВидыСервисовЭДО.xml")
      expect(result.diffs[0]?.xmlFileAbs).toBe(join(xmlDir, "Enums", "ВидыСервисовЭДО.xml"))
      expect(result.diffs[0]?.diffText).toContain("--- Enums/ВидыСервисовЭДО.xml")
      expect(result.diffs[0]?.diffText).toContain("+++ Enums/ВидыСервисовЭДО.xml.fast")
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("keeps going and records per-file errors", async () => {
    const xmlDir = makeXmlProject("<MetaDataObject><Enum><Properties><Name>Bad</Name>")
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.checked).toBe(1)
      expect(result.diffs).toEqual([])
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.file).toBe("Enums/ВидыСервисовЭДО.xml")
      expect(result.errors[0]?.message.length).toBeGreaterThan(0)
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })
})
```

- [ ] **Step 3: Run core tests and verify they fail**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

Expected: FAIL with an import error for `./roundTripYAMLFast`.

- [ ] **Step 4: Implement core module**

Create `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`:

```ts
import fs from "fs"
import { basename, join } from "path"
import { ConfigurationContext, ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportMetadataItemToXML, exportMetadataItemToYAML, importMetadataItemFromXML, importMetadataItemFromYAML } from "~/metadata/orchestration"
import type { MetadataItemRule } from "~/metadata/orchestration"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"
import { TopLevelMetadataItemRules } from "./topLevelRules"

export interface RoundTripYAMLFastParams {
  inputDir: string
}

export interface RoundTripYAMLFastDiff {
  file: string
  xmlFileAbs: string
  diffText: string
}

export interface RoundTripYAMLFastError {
  file: string
  xmlFileAbs: string
  message: string
}

export interface RoundTripYAMLFastResult {
  checked: number
  diffs: RoundTripYAMLFastDiff[]
  errors: RoundTripYAMLFastError[]
}

const makeContextFromXML = (forReference: boolean): ConfigurationContextFromXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  fromXML: { forReference },
})

const makeContextToYAML = (): ConfigurationContext => ({
  defaultLanguage: "ru",
  version: "2.20",
  exportToYAML: { toTyped: false },
})

const makeContextFromYAML = (): ConfigurationContext => ({
  defaultLanguage: "ru",
  version: "2.20",
})

const makeContextToXML = (parentName: string): ConfigurationContextWithExportToXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  exportToXML: {
    itemsTree: [],
    configDumpInfo: new Map(),
    version: "2.20",
    context: {
      forms: [],
      templates: [],
      parentName,
      metadataForNumbering: [],
    },
  },
})

const normalizeFinalNewline = (text: string): string => text.endsWith("\n") ? text : `${text}\n`

function createUnifiedDiff(params: {
  file: string
  original: string
  generated: string
}): string {
  const original = normalizeFinalNewline(params.original).split("\n")
  const generated = normalizeFinalNewline(params.generated).split("\n")
  let start = 0
  while (start < original.length && start < generated.length && original[start] === generated[start]) start += 1

  let originalEnd = original.length - 1
  let generatedEnd = generated.length - 1
  while (originalEnd >= start && generatedEnd >= start && original[originalEnd] === generated[generatedEnd]) {
    originalEnd -= 1
    generatedEnd -= 1
  }

  const contextStart = Math.max(0, start - 3)
  const contextOriginalEnd = Math.min(original.length - 1, originalEnd + 3)
  const contextGeneratedEnd = Math.min(generated.length - 1, generatedEnd + 3)
  const originalCount = contextOriginalEnd - contextStart + 1
  const generatedCount = contextGeneratedEnd - contextStart + 1
  const lines = [
    `--- ${params.file}`,
    `+++ ${params.file}.fast`,
    `@@ -${contextStart + 1},${originalCount} +${contextStart + 1},${generatedCount} @@`,
  ]

  for (let index = contextStart; index <= contextOriginalEnd; index += 1) {
    if (index < start || index > originalEnd) lines.push(` ${original[index] ?? ""}`)
    else lines.push(`-${original[index] ?? ""}`)
  }
  for (let index = contextStart; index <= contextGeneratedEnd; index += 1) {
    if (index < start || index > generatedEnd) continue
    lines.push(`+${generated[index] ?? ""}`)
  }

  return lines.join("\n")
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function setName(model: unknown, name: string): void {
  if (isObjectRecord(model)) model.name = name
}

function roundTripOne(params: {
  rule: MetadataItemRule
  itemName: string
  relativeFile: string
  xmlFileAbs: string
  xmlText: string
}): RoundTripYAMLFastDiff | undefined {
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(params.xmlText)
  const model = importMetadataItemFromXML({
    context: makeContextFromXML(false),
    xml: parsed.MetaDataObject,
    rule: params.rule,
  })
  const referenceModel = importMetadataItemFromXML({
    context: makeContextFromXML(true),
    xml: parsed.MetaDataObject,
    rule: params.rule,
  })
  setName(model, params.itemName)
  setName(referenceModel, params.itemName)

  const yamlObject = exportMetadataItemToYAML({
    context: makeContextToYAML(),
    data: model,
    rule: params.rule,
  })
  const yamlText = yamlObject === undefined ? "" : exportToYAML(yamlObject)
  const yamlObjectFromText = yamlText === "" ? undefined : importFromYAML(yamlText)
  const modelFromYAML = importMetadataItemFromYAML({
    context: makeContextFromYAML(),
    yaml: yamlObjectFromText,
    rule: params.rule,
    source: referenceModel,
    name: params.itemName,
  })
  setName(modelFromYAML, params.itemName)

  const xmlObject = exportMetadataItemToXML({
    context: makeContextToXML(params.itemName),
    data: modelFromYAML,
    referenceData: referenceModel,
    rule: params.rule,
  })
  const xmlText = xmlObject === undefined ? "" : xmlExport(xmlObject)

  if (normalizeFinalNewline(params.xmlText) === normalizeFinalNewline(xmlText)) return undefined

  return {
    file: params.relativeFile,
    xmlFileAbs: params.xmlFileAbs,
    diffText: createUnifiedDiff({
      file: params.relativeFile,
      original: params.xmlText,
      generated: xmlText,
    }),
  }
}

export async function roundTripYAMLFast(params: RoundTripYAMLFastParams): Promise<RoundTripYAMLFastResult> {
  const result: RoundTripYAMLFastResult = { checked: 0, diffs: [], errors: [] }

  for (const rule of TopLevelMetadataItemRules) {
    if (rule.xmlDir === undefined || rule.itemTypePrefix === undefined) continue
    const itemDir = join(params.inputDir, rule.xmlDir)
    if (!fs.existsSync(itemDir)) continue

    const entries = await fs.promises.readdir(itemDir, { withFileTypes: true })
    const xmlFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))

    for (const entry of xmlFiles) {
      const itemName = basename(entry.name, ".xml")
      const relativeFile = `${rule.xmlDir}/${entry.name}`
      const xmlFileAbs = join(itemDir, entry.name)
      result.checked += 1

      try {
        const xmlText = await fs.promises.readFile(xmlFileAbs, "utf-8")
        const diff = roundTripOne({ rule, itemName, relativeFile, xmlFileAbs, xmlText })
        if (diff !== undefined) result.diffs.push(diff)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        result.errors.push({ file: relativeFile, xmlFileAbs, message })
      }
    }
  }

  return result
}
```

- [ ] **Step 5: Export core API**

Modify `packages/core/index.ts` and add this export near `shortRoundTripXML`:

```ts
export {
  roundTripYAMLFast,
  type RoundTripYAMLFastDiff,
  type RoundTripYAMLFastError,
  type RoundTripYAMLFastParams,
  type RoundTripYAMLFastResult,
} from "./metadata/appliedObjects/configuration/roundTripYAMLFast"
```

- [ ] **Step 6: Run core tests and fix only compile/runtime issues in this task**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

Expected: PASS. If TypeScript reports `MetadataItemRule` is not exported from `~/metadata/orchestration`, import it from `~/metadata/orchestration/property/types` instead.

- [ ] **Step 7: Commit Task 1**

```bash
git add packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts packages/core/index.ts
git commit -m "feat: :sparkles: добавить быстрый YAML round-trip"
```

## Task 2: CLI Command

**Files:**
- Create: `packages/cli/src/commands/roundTripYAMLFast.ts`
- Test: `packages/cli/src/commands/roundTripYAMLFast.test.ts`
- Modify: `packages/cli/src/cli.ts`

- [ ] **Step 1: Write failing command tests**

Create `packages/cli/src/commands/roundTripYAMLFast.test.ts`:

```ts
import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { roundTripYAMLFastCommand } from "./roundTripYAMLFast"

const enumXml = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Enum uuid="d381585b-33ee-4f3e-9362-ae06f761f29d">
    <Properties>
      <Name>ВидыСервисовЭДО</Name>
      <Synonym>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>ВидыСервисовЭДО</v8:content>
        </v8:item>
      </Synonym>
      <Comment/>
      <UseStandardCommands>false</UseStandardCommands>
      <QuickChoice>true</QuickChoice>
      <DefaultListForm/>
      <DefaultChoiceForm/>
      <AuxiliaryListForm/>
      <AuxiliaryChoiceForm/>
      <ListPresentation/>
      <ExtendedListPresentation/>
      <Explanation/>
      <ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput>
    </Properties>
    <ChildObjects/>
  </Enum>
</MetaDataObject>`

describe("roundTripYAMLFastCommand", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = undefined
  })

  it("prints machine-readable diff blocks", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-cli-round-trip-yaml-fast-"))
    const xmlDir = join(tmp, "xml")
    fs.mkdirSync(join(xmlDir, "Enums"), { recursive: true })
    fs.writeFileSync(join(xmlDir, "Enums", "ВидыСервисовЭДО.xml"), enumXml, "utf-8")
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    try {
      await roundTripYAMLFastCommand(xmlDir)

      const output = stdout.mock.calls.map(([chunk]) => String(chunk)).join("")
      expect(output).toContain("=== DIFF_COUNT ===")
      expect(output).toContain("=== DIFF ===")
      expect(output).toContain("FILE: Enums/ВидыСервисовЭДО.xml")
      expect(output).toContain("XML_FILE_ABS: ")
      expect(output).toContain("--- DIFF ---")
      expect(process.exitCode).toBeUndefined()
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("prints clean marker when there are no supported files", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-cli-round-trip-yaml-fast-empty-"))
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    try {
      await roundTripYAMLFastCommand(tmp)

      const output = stdout.mock.calls.map(([chunk]) => String(chunk)).join("")
      expect(output).toContain("=== DIFF_COUNT ===")
      expect(output).toContain("0")
      expect(output).toContain("=== Round-trip fast чистый: диффов нет ===")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })
})
```

- [ ] **Step 2: Run command tests and verify they fail**

Run:

```bash
pnpm --dir packages/cli exec vitest run src/commands/roundTripYAMLFast.test.ts
```

Expected: FAIL with an import error for `./roundTripYAMLFast`.

- [ ] **Step 3: Implement CLI command function**

Create `packages/cli/src/commands/roundTripYAMLFast.ts`:

```ts
import { roundTripYAMLFast } from "@nakidka/core"

export const roundTripYAMLFastCommand = async (xmlDir: string): Promise<void> => {
  const result = await roundTripYAMLFast({ inputDir: xmlDir })

  process.stdout.write("=== ROUND_TRIP_YAML_FAST ===\n")
  process.stdout.write(`XML_DIR: ${xmlDir}\n`)
  process.stdout.write(`CHECKED: ${result.checked}\n`)
  process.stdout.write("\n=== DIFF_COUNT ===\n")
  process.stdout.write(`${result.diffs.length}\n`)

  for (let i = 0; i < result.diffs.length; i += 1) {
    const diff = result.diffs[i]!
    process.stdout.write("\n=== DIFF ===\n")
    process.stdout.write(`INDEX: ${i + 1}\n`)
    process.stdout.write(`FILE: ${diff.file}\n`)
    process.stdout.write(`XML_FILE_ABS: ${diff.xmlFileAbs}\n`)
    process.stdout.write("--- DIFF ---\n")
    process.stdout.write(`${diff.diffText}\n`)
  }

  if (result.errors.length > 0) {
    process.stdout.write("\n=== ERRORS ===\n")
    for (const error of result.errors) {
      process.stdout.write(`FILE: ${error.file}\n`)
      process.stdout.write(`XML_FILE_ABS: ${error.xmlFileAbs}\n`)
      process.stdout.write(`MESSAGE: ${error.message}\n`)
    }
    process.exitCode = 1
    return
  }

  if (result.diffs.length === 0) {
    process.stdout.write("\n=== Round-trip fast чистый: диффов нет ===\n")
  }
}
```

- [ ] **Step 4: Register CLI command**

Modify `packages/cli/src/cli.ts`.

Add import:

```ts
import { roundTripYAMLFastCommand } from "./commands/roundTripYAMLFast"
```

Add command after `short-round-trip-test`:

```ts
  program
    .command("round-trip-yaml-fast")
    .description("Быстрая диагностика metadata round-trip XML → модель → YAML-текст → модель → XML")
    .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
    .action((xmlDir: string) => {
      run(() => roundTripYAMLFastCommand(xmlDir), options)
    })
```

- [ ] **Step 5: Run CLI command tests**

Run:

```bash
pnpm --dir packages/cli exec vitest run src/commands/roundTripYAMLFast.test.ts
```

Expected: PASS.

- [ ] **Step 6: Add parser smoke test**

Modify `packages/cli/src/cli.test.ts` and add inside `describe("cli", () => { ... })`:

```ts
  it("registers round-trip-yaml-fast command", () => {
    const program = createProgram()
    const commandNames = program.commands.map((command) => command.name())

    expect(commandNames).toContain("round-trip-yaml-fast")
  })
```

- [ ] **Step 7: Run CLI tests**

Run:

```bash
pnpm --dir packages/cli test
```

Expected: PASS.

- [ ] **Step 8: Commit Task 2**

```bash
git add packages/cli/src/commands/roundTripYAMLFast.ts packages/cli/src/commands/roundTripYAMLFast.test.ts packages/cli/src/cli.ts packages/cli/src/cli.test.ts
git commit -m "feat: :sparkles: добавить команду round-trip-yaml-fast"
```

## Task 3: Skill Wrapper

**Files:**
- Create: `.agents/skills/round-trip-yaml-fast/SKILL.md`
- Create: `.agents/skills/round-trip-yaml-fast/round-trip.sh`

- [ ] **Step 1: Write skill documentation**

Create `.agents/skills/round-trip-yaml-fast/SKILL.md`:

```md
---
name: round-trip-yaml-fast
description: Быстро диагностирует metadata round-trip XML -> модель -> YAML-текст -> модель -> XML без записи YAML/XML каталогов.
---

# round-trip-yaml-fast — быстрая диагностика metadata round-trip

Перед диагностикой metadata round-trip обязательно прочитай:

1. `.agents/knowledge/metadata/INDEX.md`
2. `.agents/knowledge/metadata/sources-of-truth.md`
3. `.agents/knowledge/metadata/round-trip-cycle.md`
4. `.agents/knowledge/metadata/yaml-contract.md`

## Что делает скилл

Скилл запускает быстрый цикл:

```text
XML -> модель -> YAML-текст -> модель -> XML
```

Он не пишет временный YAML-проект, не пишет временный XML-каталог, не меняет XML-репо и не проверяет внешние файлы `.bsl`, `.txt`, `.bin`, `.png`.

Полный `.agents/skills/round-trip-yaml/round-trip.sh` остаётся источником истины для проверки внешних файлов, удаления файлов и поведения полного файлового sync.

## Режимы

```bash
./.agents/skills/round-trip-yaml-fast/round-trip.sh
./.agents/skills/round-trip-yaml-fast/round-trip.sh --diff-index 3
./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage --batch-size 5
./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage --batch-size 5 --start-index 6
```

## Правила ответа

Single-режим показывает:

```text
XML-файл: <абсолютный локальный путь из XML_FILE_ABS>
XML-каталог: <значение ACTIVE_XML_DIR>
Diff: <FILE>
Категория: YAML-default / потеря пустого тега / порядок XML-узлов / потеря атрибута / неизвестно
Описание: <что изменилось при fast round-trip>
Diff:
<полный diff или релевантный фрагмент>
Сомнения: <если есть>
```

Triage-режим показывает каждый diff отдельно и не объединяет похожие пункты.

Если скрипт пишет `=== Round-trip fast чистый: диффов нет ===`, остановись: fast-расхождений нет.
```

- [ ] **Step 2: Write shell wrapper**

Create `.agents/skills/round-trip-yaml-fast/round-trip.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

MODE="single"
DIFF_INDEX="1"
BATCH_SIZE="5"
START_INDEX="1"

usage() {
  cat <<'USAGE'
Использование:
  ./.agents/skills/round-trip-yaml-fast/round-trip.sh
  ./.agents/skills/round-trip-yaml-fast/round-trip.sh --diff-index N
  ./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage [--batch-size N] [--start-index K]
USAGE
}

die() {
  echo "Ошибка: $*" >&2
  exit 1
}

is_positive_integer() {
  [[ "${1:-}" =~ ^[1-9][0-9]*$ ]]
}

KNOWN_XML_DIRS=("Catalogs" "Documents" "DocumentNumerators" "Sequences" "Enums")

is_config_dir() {
  local candidate="$1"
  local xml_dir
  for xml_dir in "${KNOWN_XML_DIRS[@]}"; do
    if [ -d "${candidate}/${xml_dir}" ]; then
      return 0
    fi
  done
  return 1
}

collect_run_dirs() {
  local root="$1"
  local child
  if is_config_dir "${root}"; then
    printf '%s\n' "${root}"
    return 0
  fi
  while IFS= read -r child; do
    if is_config_dir "${child}"; then
      printf '%s\n' "${child}"
    fi
  done < <(find "${root}" -mindepth 1 -maxdepth 1 -type d | sort)
}

emit_single_diff() {
  local index="$1"
  awk -v target="${index}" '
    /^=== DIFF ===$/ {
      if (in_block == 1 && block_index == target) {
        printf "%s", block
        exit
      }
      block = $0 "\n"
      in_block = 1
      block_index = 0
      next
    }
    in_block == 1 {
      block = block $0 "\n"
      if ($0 ~ /^INDEX: /) {
        block_index = substr($0, 8) + 0
      }
    }
    END {
      if (in_block == 1 && block_index == target) {
        printf "%s", block
      }
    }
  ' <<<"${OUTPUT}"
}

emit_triage_diffs() {
  local start="$1"
  local end="$2"
  awk -v start="${start}" -v end="${end}" '
    /^=== DIFF ===$/ {
      if (in_block == 1 && block_index >= start && block_index <= end) {
        printf "%s", block
      }
      block = $0 "\n"
      in_block = 1
      block_index = 0
      next
    }
    in_block == 1 {
      block = block $0 "\n"
      if ($0 ~ /^INDEX: /) {
        block_index = substr($0, 8) + 0
      }
    }
    END {
      if (in_block == 1 && block_index >= start && block_index <= end) {
        printf "%s", block
      }
    }
  ' <<<"${OUTPUT}"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --diff-index)
      [ "$#" -ge 2 ] || die "--diff-index требует значение"
      is_positive_integer "$2" || die "--diff-index должен быть положительным целым числом"
      DIFF_INDEX="$2"
      shift 2
      ;;
    --triage)
      MODE="triage"
      shift
      ;;
    --batch-size)
      [ "$#" -ge 2 ] || die "--batch-size требует значение"
      is_positive_integer "$2" || die "--batch-size должен быть положительным целым числом"
      BATCH_SIZE="$2"
      shift 2
      ;;
    --start-index)
      [ "$#" -ge 2 ] || die "--start-index требует значение"
      is_positive_integer "$2" || die "--start-index должен быть положительным целым числом"
      START_INDEX="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "неизвестный параметр: $1"
      ;;
  esac
done

if [ -f "${REPO_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "${REPO_DIR}/.env"
  set +a
fi

[ -n "${NKDK_XML_REPO:-}" ] || die "переменная NKDK_XML_REPO не задана"
NKDK_XML_DIR="${NKDK_XML_DIR:-${NKDK_XML_REPO}}"
[ -d "${NKDK_XML_DIR}" ] || die "NKDK_XML_DIR ('${NKDK_XML_DIR}') не существует"
NKDK_XML_DIR="$(cd "${NKDK_XML_DIR}" && pwd)"

if command -v nkdk &>/dev/null; then
  NKDK=(nkdk)
else
  NKDK=(pnpm -s --dir "${REPO_DIR}/packages/cli" exec tsx src/cli.ts)
fi

RUN_DIRS=()
while IFS= read -r run_dir; do
  RUN_DIRS+=("${run_dir}")
done < <(collect_run_dirs "${NKDK_XML_DIR}")

[ "${#RUN_DIRS[@]}" -gt 0 ] || die "в NKDK_XML_DIR не найдено конфигурационных каталогов"

ACTIVE_XML_DIR="${RUN_DIRS[0]}"
OUTPUT="$("${NKDK[@]}" round-trip-yaml-fast "${ACTIVE_XML_DIR}")"
DIFF_COUNT="$(printf '%s\n' "${OUTPUT}" | awk '/=== DIFF_COUNT ===/{getline; print; exit}')"
DIFF_COUNT="${DIFF_COUNT:-0}"

echo "=== ACTIVE_XML_DIR ==="
echo "${ACTIVE_XML_DIR}"
echo ""
echo "=== DIFF_COUNT ==="
echo "${DIFF_COUNT}"

if [ "${DIFF_COUNT}" -eq 0 ]; then
  echo ""
  echo "=== Round-trip fast чистый: диффов нет ==="
  exit 0
fi

if [ "${MODE}" = "single" ] && [ "${DIFF_INDEX}" -gt "${DIFF_COUNT}" ]; then
  die "--diff-index ${DIFF_INDEX} выходит за пределы списка diff'ов (${DIFF_COUNT})"
fi

if [ "${MODE}" = "single" ]; then
  echo ""
  emit_single_diff "${DIFF_INDEX}"
  exit 0
fi

if [ "${MODE}" = "triage" ]; then
  TRIAGE_END="$((START_INDEX + BATCH_SIZE - 1))"
  if [ "${TRIAGE_END}" -gt "${DIFF_COUNT}" ]; then
    TRIAGE_END="${DIFF_COUNT}"
  fi
  echo ""
  echo "=== TRIAGE_RANGE ==="
  echo "${START_INDEX}-${TRIAGE_END}"
  emit_triage_diffs "${START_INDEX}" "${TRIAGE_END}"
fi
```

- [ ] **Step 3: Make wrapper executable and run help**

Run:

```bash
chmod +x .agents/skills/round-trip-yaml-fast/round-trip.sh
./.agents/skills/round-trip-yaml-fast/round-trip.sh --help
```

Expected: output contains `--diff-index`, `--triage`, `--batch-size`, and `--start-index`.

- [ ] **Step 4: Commit Task 3**

```bash
git add .agents/skills/round-trip-yaml-fast/SKILL.md .agents/skills/round-trip-yaml-fast/round-trip.sh
git commit -m "docs: :memo: добавить skill round-trip-yaml-fast"
```

## Task 4: End-to-End Verification and Cleanup

**Files:**
- Modify if needed: `docs/superpowers/specs/2026-06-19-round-trip-yaml-fast-design.md`
- Modify if needed: `docs/superpowers/plans/2026-06-19-round-trip-yaml-fast.md`

- [ ] **Step 1: Run targeted core tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run targeted CLI tests**

Run:

```bash
pnpm --dir packages/cli exec vitest run src/commands/roundTripYAMLFast.test.ts src/cli.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run type check**

Run:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 4: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 5: Try CLI on a small fixture directory**

Run:

```bash
pnpm -s --dir packages/cli exec tsx src/cli.ts round-trip-yaml-fast ../core/metadata/appliedObjects/configuration/__fixtures__/syncConfiguration/xml
```

Expected: command prints `=== ROUND_TRIP_YAML_FAST ===`, `CHECKED:`, and either `=== Round-trip fast чистый: диффов нет ===` or structured `=== DIFF ===` blocks. It must not create YAML or XML output directories.

- [ ] **Step 6: Review git diff for forbidden changes**

Run:

```bash
git diff --stat HEAD
git diff --name-only HEAD
```

Expected: changed files are limited to core fast module/tests, CLI command/tests, skill files, and documentation. Existing XML fixtures are not modified.

- [ ] **Step 7: Commit final documentation fixes if any**

If Task 4 changed only docs, run:

```bash
git add docs/superpowers/specs/2026-06-19-round-trip-yaml-fast-design.md docs/superpowers/plans/2026-06-19-round-trip-yaml-fast.md
git commit -m "docs: :memo: обновить план round-trip-yaml-fast"
```

If Task 4 changed no files, skip this commit.
