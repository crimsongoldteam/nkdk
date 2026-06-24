# Core Metadata Registry Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Начать разделение глобальных registry-файлов на расширяемые контракты и локальные расширения рядом с владельцами metadata-типов.

**Architecture:** Центральные `PropertyTypeRegistry` и `MetadataItemTypeRegistry` становятся `interface`, чтобы TypeScript module augmentation работал без изменения helper-типов. Первый перенос делается на маленьком common object `I8nText`; runtime-ключи property-типов выделяются в отдельный реестр, чтобы `property/toEnterprise.ts` не зависел от глобального списка в `registry.ts`.

**Tech Stack:** TypeScript interfaces, module augmentation, Vitest, pnpm, `rg`.

---

## Scope

Этот план реализует первый рабочий шаг среза 4 из спеки `docs/superpowers/specs/2026-06-11-core-metadata-boundaries-design.md`.

Не делать в этом плане:

- не переносить все записи `PropertyTypeRegistry` и `MetadataItemTypeRegistry`;
- не удалять старые импорты из глобальных registry-файлов полностью;
- не менять формат `rules.ts`;
- не менять XML/YAML-фикстуры;
- не менять публичный API CLI и расширения VS Code.

## File Structure

- Modify: `packages/core/metadata/orchestration/property/registry.ts`
  - `PropertyTypeRegistry` становится `interface`.
  - `PropertyRuleTypeKeys` перестаёт быть основным источником runtime-проверки.
  - Запись `I8nText` переносится в локальный файл владельца.
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`
  - `MetadataItemTypeRegistry` становится `interface`.
- Create: `packages/core/metadata/orchestration/property/propertyTypeKeys.ts`
  - Runtime-реестр property-типов: `registerPropertyRuleTypes`, `isRegisteredPropertyRuleType`, `getRegisteredPropertyRuleTypes`.
- Modify: `packages/core/metadata/orchestration/property/toEnterprise.ts`
  - Использует `isRegisteredPropertyRuleType`.
- Create: `packages/core/metadata/commonObjects/i8nText/registry.types.ts`
  - Локальное расширение `PropertyTypeRegistry` для `I8nText`.
- Modify: `packages/core/metadata/commonObjects/i8nText/toXML.ts`
  - Регистрирует runtime-ключ `I8nText` рядом с существующим `registerTypeRule`.
- Modify: `packages/core/metadata/importBoundaries.test.ts`
  - Фиксирует, что новый локальный registry-файл подключён и что глобальный registry больше не содержит запись `I8nText`.

## Task 0: Подготовить контекст

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `packages/core/metadata/orchestration/property/registry.ts`
- Read: `packages/core/metadata/orchestration/metadataItem/registry.ts`

- [ ] **Step 1: Read metadata knowledge**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
```

Expected: документ открыт.

- [ ] **Step 2: Inspect registry declarations**

Run:

```bash
rg -n "export type PropertyTypeRegistry|export type MetadataItemTypeRegistry|PropertyRuleTypeKeys" packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/orchestration/metadataItem/registry.ts
```

Expected: shows `PropertyTypeRegistry`, `MetadataItemTypeRegistry`, and `PropertyRuleTypeKeys`.

## Task 1: Convert Registry Type Aliases to Interfaces

**Files:**
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`

- [ ] **Step 1: Convert property registry**

In `packages/core/metadata/orchestration/property/registry.ts`, replace:

```ts
export type PropertyTypeRegistry = {
```

with:

```ts
export interface PropertyTypeRegistry {
```

- [ ] **Step 2: Convert metadata item registry**

In `packages/core/metadata/orchestration/metadataItem/registry.ts`, replace:

```ts
export type MetadataItemTypeRegistry = {
```

with:

```ts
export interface MetadataItemTypeRegistry {
```

- [ ] **Step 3: Run type check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 4: Commit the mechanical conversion**

Run:

```bash
git add packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/orchestration/metadataItem/registry.ts
git commit -m "refactor: :recycle: сделать registry metadata расширяемым"
```

Expected: commit succeeds.

## Task 2: Add Runtime Property Type Key Registry

**Files:**
- Create: `packages/core/metadata/orchestration/property/propertyTypeKeys.ts`
- Modify: `packages/core/metadata/orchestration/property/toEnterprise.ts`

- [ ] **Step 1: Create runtime registry**

Create `packages/core/metadata/orchestration/property/propertyTypeKeys.ts`:

```ts
import type { PropertyRuleType } from "./registry"
import { PropertyRuleTypeKeys } from "./registry"

const registeredPropertyRuleTypes = new Set<PropertyRuleType>(PropertyRuleTypeKeys)

export const registerPropertyRuleTypes = (keys: readonly PropertyRuleType[]): void => {
  for (const key of keys) {
    registeredPropertyRuleTypes.add(key)
  }
}

export const isRegisteredPropertyRuleType = (key: string): key is PropertyRuleType => {
  return registeredPropertyRuleTypes.has(key as PropertyRuleType)
}

export const getRegisteredPropertyRuleTypes = (): PropertyRuleType[] => {
  return [...registeredPropertyRuleTypes]
}
```

- [ ] **Step 2: Use runtime registry in Enterprise export**

In `packages/core/metadata/orchestration/property/toEnterprise.ts`, replace:

```ts
import { PropertyRuleTypeKeys } from "./registry"
```

with:

```ts
import { isRegisteredPropertyRuleType } from "./propertyTypeKeys"
```

Replace:

```ts
if (!PropertyRuleTypeKeys.includes(ruleProp.type)) continue
```

with:

```ts
if (!isRegisteredPropertyRuleType(ruleProp.type)) continue
```

- [ ] **Step 3: Export runtime registry from orchestration index**

In `packages/core/metadata/orchestration/index.ts`, add near property exports:

```ts
export * from "./property/propertyTypeKeys"
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property --no-isolate
```

Expected: PASS. If there is no directory-level test match, run `pnpm --filter @nakidka/core type-check` and continue.

## Task 3: Move I8nText Registry Entry to Owner

**Files:**
- Create: `packages/core/metadata/commonObjects/i8nText/registry.types.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toXML.ts`

- [ ] **Step 1: Create local registry extension**

Create `packages/core/metadata/commonObjects/i8nText/registry.types.ts`:

```ts
import type { I8nText, I8nTextYAML } from "./types"

declare module "~/metadata/orchestration/property/registry" {
  interface PropertyTypeRegistry {
    I8nText: {
      item: I8nText
      enterprise: string
      yaml: I8nTextYAML
    }
  }
}
```

- [ ] **Step 2: Import the local extension through the owner entry**

At the top of `packages/core/metadata/commonObjects/i8nText/toXML.ts`, add:

```ts
import "./registry.types"
```

- [ ] **Step 3: Register the runtime key near the owner**

In `packages/core/metadata/commonObjects/i8nText/toXML.ts`, add:

```ts
import { registerPropertyRuleTypes } from "~/metadata/orchestration/property/propertyTypeKeys"
```

Before existing `registerTypeRule("I8nText", "exportToXML", exportI8nTextToXML)`, add:

```ts
registerPropertyRuleTypes(["I8nText"])
```

- [ ] **Step 4: Remove I8nText entry from global property registry**

In `packages/core/metadata/orchestration/property/registry.ts`, remove this entry from `PropertyTypeRegistry`:

```ts
I8nText: {
  item: I8nText
  enterprise: string
  yaml: I8nTextYAML
}
```

Remove `I8nText: "I8nText",` from `PropertyRuleTypeKeys`.

Keep the `I8nText` imports only if they are still used by other entries in the same file. Verify with:

```bash
rg -n "I8nText" packages/core/metadata/orchestration/property/registry.ts
```

Expected: no `I8nText` registry entry remains; other references may remain only if they belong to different concrete entries.

- [ ] **Step 5: Run type check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

## Task 4: Add Boundary Checks for Local Registry Ownership

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Add a text assertion for the migrated entry**

Add this test inside `describe("metadata import boundaries", () => { ... })`:

```ts
it("I8nText registry entry живёт рядом с владельцем", () => {
  const globalRegistry = readFileSync(join(METADATA_DIR, "orchestration", "property", "registry.ts"), "utf-8")
  const localRegistry = readFileSync(join(METADATA_DIR, "commonObjects", "i8nText", "registry.types.ts"), "utf-8")

  expect(globalRegistry).not.toMatch(/^\s+I8nText: \{/m)
  expect(globalRegistry).not.toMatch(/^\s+I8nText: "I8nText",/m)
  expect(localRegistry).toContain("interface PropertyTypeRegistry")
  expect(localRegistry).toContain("I8nText: {")
})
```

- [ ] **Step 2: Run boundary test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

## Task 5: Verify Behavior

**Files:**
- Test: `packages/core/metadata/commonObjects/i8nText/*.test.ts`
- Test: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Run I8nText tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/i8nText --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run type check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 3: Run package tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 4: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.

## Task 6: Commit

**Files:**
- Stage all files changed in this plan.

- [ ] **Step 1: Inspect diff**

Run:

```bash
git diff -- packages/core/metadata/orchestration/property packages/core/metadata/orchestration/metadataItem packages/core/metadata/commonObjects/i8nText packages/core/metadata/importBoundaries.test.ts
```

Expected: diff shows interface conversion, runtime key registry, and local `I8nText` registry extension.

- [ ] **Step 2: Commit**

Run:

```bash
git add packages/core/metadata/orchestration/property packages/core/metadata/orchestration/metadataItem packages/core/metadata/commonObjects/i8nText packages/core/metadata/importBoundaries.test.ts
git commit -m "refactor: :recycle: вынести registry I8nText к владельцу"
```

Expected: commit succeeds.
