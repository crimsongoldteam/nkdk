# NKDK Double Auto Command Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow NKDK forms to parse a form-level `AutoCommandBar` immediately followed by a table with its own `AutoCommandBar`.

**Architecture:** Keep the change inside `packages/language`. Add a focused grammar branch for the sequence `Form AutoCommandBar` followed by `Table AutoCommandBar`, while preserving the existing disambiguation for a single `<<...>>` before a table.

**Tech Stack:** Langium grammar, Chevrotain parser generation, Vitest tests, TypeScript.

---

### Task 1: Add a Failing Parser Test

**Files:**
- Modify: `packages/language/test/parsing.test.ts`

- [ ] **Step 1: Add the failing test**

Insert this test after `parses leading auto command bar before non-table element as form auto command bar`:

```ts
  it("parses form auto command bar followed by table auto command bar", async () => {
    const services = createNkdkServices(EmptyFileSystem)
    const parse = parseHelper<Form>(services.Nkdk)
    const document = await parse("<<ОК>>\n<<Добавить>>\n| Колонка | Список")

    expect(document.parseResult.parserErrors).toHaveLength(0)
    expect(document.parseResult.value?.autoCommandBar).toMatchObject({ $type: "AutoCommandBar" })
    expect(document.parseResult.value?.childItems).toHaveLength(1)
    expect(document.parseResult.value?.childItems[0]?.$type).toBe("Table")
    expect(document.parseResult.value?.childItems[0]).toMatchObject({
      autoCommandBar: { $type: "AutoCommandBar" },
    })
  })
```

- [ ] **Step 2: Run the targeted test and confirm it fails**

Run:

```bash
pnpm --filter nkdk-language test -- test/parsing.test.ts
```

Expected: the new test fails with a parser error near the second `<<...>>`, while existing tests still show the previous behavior.

### Task 2: Update the Grammar

**Files:**
- Modify: `packages/language/src/nkdk.langium`

- [ ] **Step 1: Update `TopLevelChildItemAfterFormAuto`**

Keep the existing `Form` rule unchanged. Update only `TopLevelChildItemAfterFormAuto` so it allows a table when that table starts with its own `AutoCommandBar`:

```langium
TopLevelChildItemAfterFormAuto:
     TableWithAutoCommandBar
    | Group
    | Pages
    | ((PictureField
    | InputField
    | LabelField
    | OtherField
    | CommandAdditionField
    | LabelDecoration
    | PictureDecoration
    | CheckBoxField
    | CheckBoxFieldRightTitled
    | CheckBoxFieldSwitch
    | CheckBoxFieldSwitchRightTitled
    | CheckBoxFieldTumbler
    | CheckBoxFieldTumblerRightTitled
    | CommandBar
    | Button)(NEWLINE | EOF)?);
```

- [ ] **Step 2: Add the specialized table rule**

Insert this immediately before the existing `Table` rule:

```langium
TableWithAutoCommandBar infers Table:
    autoCommandBar = AutoCommandBar (NEWLINE | EOF)
    '|' ( (childItems+=TableField ('|' childItems+=TableField )* '|') | '|'? ) NameAndDataPath (NEWLINE | EOF)?;
```

Do not change the existing `Table` rule in this task. Keeping both rules lets `ChildItem` continue to parse ordinary tables, while `TopLevelChildItemAfterFormAuto` gets a non-ambiguous table shape after a form-level command bar. The rule must `infer Table` so downstream code still receives `$type: "Table"`, and it must consume `(NEWLINE | EOF)?` so following top-level elements remain parseable.

- [ ] **Step 3: Generate Langium files**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: succeeds without `Ambiguous Alternatives` warnings.

### Task 3: Verify Language Tests

**Files:**
- No additional source files.

- [ ] **Step 1: Run the language package tests**

Run:

```bash
pnpm --filter nkdk-language test
```

Expected: all tests pass, including:

- `parses leading auto command bar before table as table auto command bar`
- `parses leading auto command bar before non-table element as form auto command bar`
- `parses form auto command bar followed by table auto command bar`

### Task 4: Scan Real NKDK Files

**Files:**
- Create temporarily: `packages/language/.tmp/check-nkdk-ambiguities.ts`
- Delete before finishing: `packages/language/.tmp/check-nkdk-ambiguities.ts`

- [ ] **Step 1: Create the temporary scanner**

Create `packages/language/.tmp/check-nkdk-ambiguities.ts` with:

```ts
import fs from "node:fs"
import path from "node:path"
import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices, type Form } from "../src/index"

const root = process.argv[2] ?? "/Users/nikita/git/erp_nkdk"

const warnings: string[] = []
const errors: string[] = []
const originalWarn = console.warn
const originalError = console.error

console.warn = (...args: unknown[]) => {
  warnings.push(args.map(String).join(" "))
}
console.error = (...args: unknown[]) => {
  errors.push(args.map(String).join(" "))
}

const walk = (dir: string): string[] => {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && entry.name.endsWith(".nkdk")) out.push(full)
  }
  return out
}

async function main(): Promise<void> {
  const services = createNkdkServices(EmptyFileSystem)
  const parse = parseHelper<Form>(services.Nkdk)
  const files = walk(root)
  const parseFailures: Array<{ file: string; messages: string[]; firstLines: string[] }> = []

  for (const file of files) {
    const text = fs.readFileSync(file, "utf-8")
    const document = await parse(text)
    const parserErrors = document.parseResult.parserErrors
    if (parserErrors.length > 0) {
      parseFailures.push({
        file,
        messages: parserErrors.map((error) => error.message),
        firstLines: text.split(/\r?\n/).filter((line) => line.trim() !== "").slice(0, 5),
      })
    }
  }

  console.warn = originalWarn
  console.error = originalError

  console.log(JSON.stringify({
    root,
    fileCount: files.length,
    warningCount: warnings.length,
    warnings,
    errorCount: errors.length,
    errors,
    parseFailureCount: parseFailures.length,
    parseFailures: parseFailures.slice(0, 20),
  }, null, 2))
}

void main()
```

- [ ] **Step 2: Run the scanner**

Run:

```bash
pnpm --filter nkdk-language exec tsx .tmp/check-nkdk-ambiguities.ts /Users/nikita/git/erp_nkdk
```

Expected:

- `warningCount` is `0`;
- the previous mass failure `Expecting token of type '|' but found <<` no longer appears in the first results;
- the remaining failures are the independent next class with `Name(rawDataPath)` in one-line groups.

- [ ] **Step 3: Delete the temporary scanner**

Remove the temporary scanner:

```bash
rm packages/language/.tmp/check-nkdk-ambiguities.ts
rmdir packages/language/.tmp
```

Expected: no `.tmp` files remain in `git status`.

### Task 5: Commit the Grammar Fix

**Files:**
- Modify: `packages/language/src/nkdk.langium`
- Modify: `packages/language/test/parsing.test.ts`
- Generated files may be modified by `langium:generate`; include them only if `git status` shows tracked changes.

- [ ] **Step 1: Review status and diff**

Run:

```bash
git status --short
git diff --stat
git diff
```

Expected: only the grammar, parser test, and any generated Langium files changed.

- [ ] **Step 2: Commit**

Run:

```bash
git add packages/language/src/nkdk.langium packages/language/test/parsing.test.ts packages/language/src/generated packages/language/syntaxes/nkdk.tmLanguage.json
git commit -m "fix: :bug: разобрать две панели nkdk перед таблицей" -m "Грамматика теперь различает панель формы и следующую панель таблицы, не возвращая неоднозначность одиночного <<...>> перед таблицей. Тест закрепляет оба уровня autoCommandBar."
```

Expected: commit succeeds and `git status --short` is clean.
