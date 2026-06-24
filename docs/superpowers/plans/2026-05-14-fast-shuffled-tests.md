# Fast Shuffled Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the default test command fast by disabling Vitest file isolation and shuffling execution order, while keeping an explicit isolated test command.

**Architecture:** This is a package-script change only. The root package delegates to recursive package scripts, and every package that currently has `test` also gets `test:isolated` so `pnpm test:isolated` works from the repository root.

**Tech Stack:** pnpm workspace scripts, Vitest 3/4 command-line options.

---

## File Structure

- Modify `package.json`: add root `test:isolated` that runs package-level isolated tests recursively.
- Modify `packages/core/package.json`: make `test` fast with `--no-isolate --sequence.shuffle`; add `test:isolated`.
- Modify `packages/graph/package.json`: make `test` fast with `--no-isolate --sequence.shuffle`; add `test:isolated`.
- Modify `packages/cli/package.json`: make `test` fast with `--no-isolate --sequence.shuffle` while keeping `--passWithNoTests`; add `test:isolated`.
- Modify `packages/language/package.json`: make `test` fast with `--no-isolate --sequence.shuffle`; add `test:isolated`.

No source files, XML fixtures, or Vitest config files should change in this plan.

### Task 1: Update Workspace Test Scripts

**Files:**
- Modify: `package.json`
- Modify: `packages/core/package.json`
- Modify: `packages/graph/package.json`
- Modify: `packages/cli/package.json`
- Modify: `packages/language/package.json`

- [ ] **Step 1: Inspect current scripts**

Run:

```bash
node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); console.log(process.cwd(), p.scripts)"
```

Expected: the root script object is printed and has `test`.

Run:

```bash
pnpm -r exec node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); console.log(p.name, p.scripts)"
```

Expected: package script objects are printed. Confirm these packages have `test`: `@nakidka/core`, `@nakidka/graph`, `@nakidka/cli`, `nkdk-language`.

- [ ] **Step 2: Edit the root package scripts**

In `package.json`, replace the `scripts` block with this content, preserving the surrounding fields:

```json
"scripts": {
  "build": "tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json",
  "type-check": "pnpm -r exec tsc --noEmit",
  "test": "pnpm -r run test",
  "test:isolated": "pnpm -r run test:isolated",
  "prepare": "ts-patch install",
  "postinstall": "patch-package"
}
```

- [ ] **Step 3: Edit `packages/core/package.json` scripts**

Replace the `scripts` block with this content:

```json
"scripts": {
  "test": "vitest run --no-isolate --sequence.shuffle",
  "test:isolated": "vitest run",
  "test:ui": "vitest --ui",
  "type-check": "tsc --noEmit",
  "prepare": "ts-patch install"
}
```

- [ ] **Step 4: Edit `packages/graph/package.json` scripts**

Replace the `scripts` block with this content:

```json
"scripts": {
  "test": "vitest run --no-isolate --sequence.shuffle",
  "test:isolated": "vitest run",
  "test:integration": "vitest run --config vitest.integration.config.ts",
  "type-check": "tsc --noEmit"
}
```

- [ ] **Step 5: Edit `packages/cli/package.json` scripts**

Keep the file's compact JSON style unless the formatter changes it. Replace the `scripts` object with this content:

```json
"scripts": {
  "build": "tsc",
  "dev": "tsx src/cli.ts",
  "test": "vitest run --no-isolate --sequence.shuffle --passWithNoTests",
  "test:isolated": "vitest run --passWithNoTests"
}
```

- [ ] **Step 6: Edit `packages/language/package.json` scripts**

Replace the `scripts` block with this content:

```json
"scripts": {
  "clean": "shx rm -fr *.tsbuildinfo out",
  "build": "tsc -p tsconfig.build.json",
  "build:clean": "npm run clean && npm run build",
  "langium:generate": "langium generate",
  "langium:watch": "langium generate --watch",
  "test": "vitest run --no-isolate --sequence.shuffle",
  "test:isolated": "vitest run"
}
```

- [ ] **Step 7: Verify JSON parses**

Run:

```bash
node -e "for (const f of ['package.json','packages/core/package.json','packages/graph/package.json','packages/cli/package.json','packages/language/package.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('package json ok')"
```

Expected: prints `package json ok`.

- [ ] **Step 8: Inspect diff**

Run:

```bash
git diff -- package.json packages/core/package.json packages/graph/package.json packages/cli/package.json packages/language/package.json
```

Expected: only script changes described above.

### Task 2: Verify Fast and Isolated Modes

**Files:**
- No file changes.

- [ ] **Step 1: Run fast core tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: Vitest runs with `--no-isolate --sequence.shuffle`, all tests pass. The command should be much closer to the previous 6.9 second measurement than the previous 190 second isolated run.

- [ ] **Step 2: Run isolated core tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated
```

Expected: Vitest runs with default isolation, all tests pass.

- [ ] **Step 3: Generate Langium files if needed**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command succeeds. If it changes generated files that are already tracked, inspect them before staging; do not stage generated churn unless it is required by the test run.

- [ ] **Step 4: Run full fast test suite**

Run:

```bash
pnpm test
```

Expected: recursive package tests run through the new fast scripts, all tests pass.

- [ ] **Step 5: Run full isolated test suite**

Run:

```bash
pnpm test:isolated
```

Expected: recursive package tests run through the isolated scripts, all tests pass.

- [ ] **Step 6: Capture reproduction command in final notes**

If a shuffled test fails and Vitest prints a seed, rerun the failing package with:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle --sequence.seed 123456789
```

Expected: the same order-dependent failure reproduces when `123456789` is replaced by the seed printed by Vitest. Replace `@nakidka/core` with the failing package name when the failure is not in `packages/core`.

### Task 3: Commit Implementation

**Files:**
- Stage: `package.json`
- Stage: `packages/core/package.json`
- Stage: `packages/graph/package.json`
- Stage: `packages/cli/package.json`
- Stage: `packages/language/package.json`

- [ ] **Step 1: Check final status**

Run:

```bash
git status --short
```

Expected: only the five package JSON files are modified, unless Langium generation produced necessary tracked changes.

- [ ] **Step 2: Stage intended files**

Run:

```bash
git add package.json packages/core/package.json packages/graph/package.json packages/cli/package.json packages/language/package.json
```

Expected: the intended files are staged.

- [ ] **Step 3: Commit**

Run:

```bash
git commit -m "perf: :zap: ускорить основной запуск тестов"
```

Expected: commit succeeds with only the intended script changes.
