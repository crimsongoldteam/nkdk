# js-yaml Syntax Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route YAML syntax diagnostics through the new `js-yaml` facade while preserving the old `yaml.Document` compatibility fields.

**Architecture:** `parseMetadataYaml` becomes the bridge: it still returns `doc`, `lineCounter`, and old `data`, but additionally exposes `syntaxErrors` and `locations` from `parseWithJsYaml`. Validation code checks `syntaxErrors` first, so syntax diagnostics stop depending on `parsed.doc.errors`.

**Tech Stack:** TypeScript, Vitest, existing validation modules, `js-yaml` facade.

---

### Task 1: Extend ParsedYaml

**Files:**
- Modify: `packages/core/yaml/parseMetadataYaml.ts`
- Test: `packages/core/metadata/validation/validateFile.test.ts`

- [ ] **Step 1: Write RED test**

Add a test proving `parseMetadataYaml` exposes `syntaxErrors` and `validateParsedFile` can use them even if old `doc.errors` is empty.

- [ ] **Step 2: Implement ParsedYaml bridge**

Call `parseWithJsYaml(text)` in `parseMetadataYaml` and return `syntaxErrors` plus `locations` from that result.

### Task 2: Route Syntax Diagnostics Through syntaxErrors

**Files:**
- Modify: `packages/core/metadata/validation/validateFile.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataStyleItem/register.ts`

- [ ] **Step 1: Use `parsed.syntaxErrors.length` for syntax checks**

Replace `parsed.doc.errors.length > 0` checks where they mean YAML syntax errors.

- [ ] **Step 2: Convert `syntaxErrors` to diagnostics**

Use `line`, `col`, and `message` directly from `parsed.syntaxErrors`.

### Task 3: Verify

**Files:**
- Existing tests.

- [ ] **Step 1: Run focused tests**

```bash
pnpm --dir packages/core exec vitest run metadata/validation/validateFile.test.ts metadata/validation/validateForm.test.ts yaml/jsYamlParser.test.ts yaml/locationIndex.test.ts
```

- [ ] **Step 2: Run diff check**

```bash
git diff --check
```

- [ ] **Step 3: Report type-check status**

Run `pnpm --dir packages/core exec tsc --noEmit --pretty false` and report whether remaining failures are pre-existing metadata test errors.
