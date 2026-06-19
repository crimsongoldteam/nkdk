# All Schema Validation Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix schema-only validation errors in `/tmp/round-trip-yaml-validation/current/all`.

**Architecture:** Only JSON Schema export rules are changed. Existing XML/YAML import/export behavior remains the source of truth; tests describe YAML already produced by the converter.

**Tech Stack:** TypeScript, TypeBox, Vitest, project metadata property rule registry.

---

### Task 1: WebSocketClientHeaders YAML Schema

**Files:**
- Modify: `packages/core/metadata/commonObjects/webSocketClientHeaders/types.ts`
- Test: `packages/core/metadata/commonObjects/webSocketClientHeaders/toJSONSchema.test.ts`

- [ ] **Step 1: Write failing test**

Add a test that compiles `exportWebSocketClientHeadersToJSONSchema()` and accepts:

```ts
[
  { Ключ: "Заголовок 1", Значение: "Значение 1" },
  { Ключ: "Заголовок 2", Значение: "Значение 2" },
]
```

The same test must reject `{ key: "Header", value: "Value" }`.

- [ ] **Step 2: Run RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/webSocketClientHeaders/toJSONSchema.test.ts
```

Expected: the new YAML-key acceptance assertion fails.

- [ ] **Step 3: Implement schema**

Change `WebSocketClientHeadersJSONSchema` to use YAML keys:

```ts
Type.Array(
  Type.Object(
    {
      Ключ: Type.String(),
      Значение: Type.String(),
    },
    { additionalProperties: false }
  )
)
```

- [ ] **Step 4: Run GREEN**

Run the same test command and expect PASS.

### Task 2: Planner Settings Fragment Schema

**Files:**
- Create or modify: `packages/core/metadata/forms/commonObjects/planner/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/planner/types.ts` or a local `toJSONSchema.ts` following existing settings-fragment registration patterns.

- [ ] **Step 1: Write failing test**

Add a test proving `Planner` schema accepts a string XML fragment:

```ts
const xml = `<pl:item><pl:text>Встреча</pl:text></pl:item>`
expect(schema.Check(xml)).toBe(true)
expect(schema.Check({ item: "Встреча" })).toBe(false)
```

- [ ] **Step 2: Run RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/planner/**/*.test.ts metadata/forms/commonObjects/formAttribute/fromYAML.test.ts
```

Expected: the new string schema assertion fails if no schema is registered.

- [ ] **Step 3: Implement schema**

Register `Planner` `exportToJSONSchema` as `Type.String()` through the same `registerTypeRule` mechanism used by other property types.

- [ ] **Step 4: Run GREEN**

Run the same test command and expect PASS.

### Task 3: ChoiceParameters Numeric Values Schema

**Files:**
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/types.ts` or existing schema exporter.
- Test: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts` or a nearby schema test.

- [ ] **Step 1: Write failing test**

Add schema validation for:

```ts
{ Параметр: 123 }
```

It must pass. An object with unsupported non-empty shape must still fail.

- [ ] **Step 2: Run RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/сhoiceParameters/fromYAML.test.ts
```

Expected: numeric schema assertion fails.

- [ ] **Step 3: Implement schema**

Extend `ChoiceParametersJSONSchema` union to include `Type.Number()` while preserving current support for metadata values, `{}`, `null`, and `undefined`.

- [ ] **Step 4: Run GREEN**

Run the same test command and expect PASS.

### Task 4: Recalculations Empty Item Schema

**Files:**
- Modify: `packages/core/metadata/commonObjects/recalculation/types.ts` or add `toJSONSchema.ts`.
- Test: `packages/core/metadata/commonObjects/recalculation/fromYAML.test.ts` or a new schema test.

- [ ] **Step 1: Write failing test**

Add schema validation for:

```ts
{
  ПерерасчетВсеСвойства: {},
  ПерерасчетПоУмолчанию: {},
}
```

It must pass. A recalculation item with unknown non-empty properties must still fail unless those properties are part of `RecalculationRules`.

- [ ] **Step 2: Run RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/recalculation/**/*.test.ts metadata/appliedObjects/metadataCalculationRegister/**/*.test.ts
```

Expected: new schema assertion fails.

- [ ] **Step 3: Implement schema**

Export `Recalculations` schema as a record of strict recalculation item schemas or strict empty objects, following existing metadata item schema helpers if available.

- [ ] **Step 4: Run GREEN**

Run the same test command and expect PASS.

### Task 5: Validation and Full Test

**Files:**
- No direct file edits.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/commonObjects/webSocketClientHeaders/toJSONSchema.test.ts \
  metadata/forms/commonObjects/planner/**/*.test.ts \
  metadata/commonObjects/сhoiceParameters/fromYAML.test.ts \
  metadata/commonObjects/recalculation/**/*.test.ts \
  metadata/validation/schemaRegistry.test.ts \
  metadata/validation/validateProject.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run all validation**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm --dir packages/cli dev validate /tmp/round-trip-yaml-validation/current/all'
```

Expected: schema-only errors are gone; remaining errors are only non-schema groups already excluded from this plan.

- [ ] **Step 3: Run full tests**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm test'
```

Expected: PASS.

