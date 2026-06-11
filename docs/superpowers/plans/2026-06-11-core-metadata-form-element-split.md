# Core Metadata Form Element Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разделить общий реестр property-операций и формовый слой элементов, чтобы универсальное `orchestration` перестало выглядеть владельцем модели формы.

**Architecture:** Сначала из `orchestration/formElement/factory.ts` выносится нейтральный `property/typeRuleRegistry.ts`; это меняет только источник импорта `registerTypeRule/getTypeRule`. Затем оставшаяся формовая часть `formElement` переносится под `forms/elements/orchestration` с совместимыми переэкспортами из старых путей.

**Tech Stack:** TypeScript, Vitest, pnpm, `rg`, TypeScript path alias `~/metadata`.

---

## Scope

Этот план реализует срез 3 из спеки `docs/superpowers/specs/2026-06-11-core-metadata-boundaries-design.md`.

Не делать в этом плане:

- не менять поведение XML/YAML/Enterprise/JSONSchema преобразований;
- не менять registry-типы `PropertyTypeRegistry` и `MetadataItemTypeRegistry`;
- не менять формат `rules.ts`;
- не менять XML/YAML-фикстуры;
- не удалять совместимые переэкспорты старых `orchestration/formElement/*` путей.

## File Structure

- Create: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
  - Нейтральный реестр `registerTypeRule`, `getTypeRule`, `clearTypeRulesRegistry`.
- Modify: `packages/core/metadata/orchestration/formElement/factory.ts`
  - Совместимый переэкспорт из `property/typeRuleRegistry`.
- Modify: `packages/core/metadata/orchestration/index.ts`
  - Экспортирует новый нейтральный реестр.
- Modify: `packages/core/metadata/**/*.ts`
  - Переводит production-импорты `registerTypeRule/getTypeRule/clearTypeRulesRegistry` на `property/typeRuleRegistry` или общий `~/metadata/orchestration`.
- Create directory: `packages/core/metadata/forms/elements/orchestration/`
  - Новый дом для `ElementRule`, `registerElementRule`, формовых XML/YAML/Enterprise/JSONSchema helper-ов и singleton name.
- Modify directory: `packages/core/metadata/orchestration/formElement/`
  - Оставляет файлы-совместимости, которые переэкспортируют новый формовый путь.
- Modify: `packages/core/metadata/importBoundaries.test.ts`
  - Запрещает новые production-импорты из `orchestration/formElement/factory`.
  - Запрещает production-импорты из `forms/elements/baseElement/types` внутри `metadata/orchestration`.

## Task 0: Подготовить контекст

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `.agents/architecture-orchestration.md`
- Read: `packages/core/metadata/orchestration/formElement/factory.ts`

- [ ] **Step 1: Read metadata knowledge**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
```

Expected: документ открыт.

- [ ] **Step 2: Read orchestration invariants**

Run:

```bash
sed -n '1,220p' .agents/architecture-orchestration.md
```

Expected: видно, что `orchestration` не должен импортировать конкретные формы.

- [ ] **Step 3: Inspect current registry code**

Run:

```bash
sed -n '1,140p' packages/core/metadata/orchestration/formElement/factory.ts
```

Expected: видны `typeRulesRegistry`, `registerTypeRule`, `getTypeRule`, `clearTypeRulesRegistry`.

## Task 1: Extract Neutral Type Rule Registry

**Files:**
- Create: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/orchestration/formElement/factory.ts`
- Modify: `packages/core/metadata/orchestration/index.ts`

- [ ] **Step 1: Create the new registry file**

Create `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`:

```ts
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import {
  BuildGraphFromModelFunction,
  createRegistryKey,
  ExportToEnterpriseFunction,
  ExportToJSONSchemaFn,
  ExportToXMLFunction,
  ExportToXMLFunctionNew,
  ExportToYAMLFunction,
  ExportToYAMLFunctionNew,
  ExtractGraphFromModelFunction,
  GraphChildRule,
  GraphEdgeFromParent,
  importExportFunction,
  ImportFromXMLFunction,
  importFromYAMLFunction as ImportFromYAMLFunction,
  ImportFromYAMLFunctionNew,
  SyncExternalFromXMLFunction,
  SyncExternalToXMLFunction,
  TypeRulesOperations,
} from "./fn"

const typeRulesRegistry = new Map<
  string,
  | ImportFromYAMLFunction
  | ExportToYAMLFunction
  | ImportFromXMLFunction
  | ExportToXMLFunction
  | ExportToEnterpriseFunction
  | ExportToXMLFunctionNew
  | ImportFromYAMLFunctionNew
  | ExportToYAMLFunctionNew
  | BuildGraphFromModelFunction
  | ExtractGraphFromModelFunction
  | GraphEdgeFromParent
  | GraphChildRule
  | SyncExternalFromXMLFunction
  | SyncExternalToXMLFunction
>()

export const registerTypeRule = <O extends TypeRulesOperations>(
  type: PropertyRuleType,
  operation: O,
  ruleFunction: NonNullable<importExportFunction<O>>
) => {
  const key = createRegistryKey(type, operation)
  typeRulesRegistry.set(key, ruleFunction)
}

export const getTypeRule = <O extends TypeRulesOperations>(
  type: PropertyRuleType,
  operation: O
): O extends "importFromYAML"
  ? ImportFromYAMLFunction | ImportFromYAMLFunctionNew | undefined
  : O extends "exportToYAML"
    ? ExportToYAMLFunction | ExportToYAMLFunctionNew | undefined
    : O extends "exportToXML"
      ? ExportToXMLFunction | ExportToXMLFunctionNew | undefined
      : O extends "importFromXML"
        ? ImportFromXMLFunction | undefined
        : O extends "exportToEnterprise"
          ? ExportToEnterpriseFunction | undefined
          : O extends "exportToJSONSchema"
            ? ExportToJSONSchemaFn | undefined
            : O extends "buildGraphFromModel"
              ? BuildGraphFromModelFunction | undefined
              : O extends "extractGraph"
                ? ExtractGraphFromModelFunction | undefined
                : O extends "graphEdgeFromParent"
                  ? GraphEdgeFromParent | undefined
                  : O extends "graphChild"
                    ? GraphChildRule | undefined
                    : O extends "syncExternalFromXML"
                      ? SyncExternalFromXMLFunction | undefined
                      : O extends "syncExternalToXML"
                        ? SyncExternalToXMLFunction | undefined
                        : never => {
  const key = createRegistryKey(type, operation)
  const result = typeRulesRegistry.get(key)
  return result as any
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
}
```

- [ ] **Step 2: Replace the old factory with a compatibility export**

Replace `packages/core/metadata/orchestration/formElement/factory.ts` with:

```ts
export {
  clearTypeRulesRegistry,
  getTypeRule,
  registerTypeRule,
} from "~/metadata/orchestration/property/typeRuleRegistry"
```

- [ ] **Step 3: Export the new registry from orchestration index**

In `packages/core/metadata/orchestration/index.ts`, add near other property exports:

```ts
export * from "./property/typeRuleRegistry"
```

Keep the existing `export * from "./formElement/factory"` during this plan for API compatibility.

- [ ] **Step 4: Run type check before import migration**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS. This confirms the compatibility export works before wider import changes.

## Task 2: Move Internal Imports to the Neutral Registry

**Files:**
- Modify: `packages/core/metadata/**/*.ts`

- [ ] **Step 1: Replace absolute factory imports**

Run:

```bash
rg -l '"~/metadata/orchestration/formElement/factory"' packages/core/metadata -g '*.ts' \
  | xargs perl -0pi -e 's#"~/metadata/orchestration/formElement/factory"#"~/metadata/orchestration/property/typeRuleRegistry"#g'
```

Expected: no command output.

- [ ] **Step 2: Replace relative imports in orchestration**

Run:

```bash
perl -0pi -e 's#from "../formElement/factory"#from "../property/typeRuleRegistry"#g' packages/core/metadata/orchestration/metadataItem/registerImportFromXML.ts packages/core/metadata/orchestration/metadataItem/registerExportToXML.ts packages/core/metadata/orchestration/metadataItem/registerExportToYAML.ts packages/core/metadata/orchestration/metadataItem/registerImportFromYAML.ts
perl -0pi -e 's#from "./formElement/factory"#from "./property/typeRuleRegistry"#g' packages/core/metadata/orchestration/buildGraphFromModel.ts
perl -0pi -e 's#from "./factory"#from "../property/typeRuleRegistry"#g' packages/core/metadata/orchestration/formElement/ruleFactory.ts
```

Expected: no command output.

- [ ] **Step 3: Verify no direct production import remains**

Run:

```bash
rg -n "orchestration/formElement/factory|from \"\\.\\/factory\"|from \"\\.\\/formElement\\/factory\"|from \"\\.\\.\\/formElement\\/factory\"" packages/core/metadata -g '*.ts' -g '!*.test.ts'
```

Expected: only `packages/core/metadata/orchestration/formElement/factory.ts` may appear.

- [ ] **Step 4: Run type check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

## Task 3: Add Boundary Tests for the Split

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Add constants**

Add after existing directory constants:

```ts
const ORCHESTRATION_DIR = join(METADATA_DIR, "orchestration")
```

Add after existing forbidden import lists:

```ts
const FORBIDDEN_FORM_ELEMENT_FACTORY_IMPORTS = [
  "~/metadata/orchestration/formElement/factory",
  "../formElement/factory",
  "./formElement/factory",
  "./factory",
] as const

const FORBIDDEN_ORCHESTRATION_FORM_MODEL_IMPORTS = [
  "~/metadata/forms/elements/baseElement/types",
] as const
```

- [ ] **Step 2: Add tests**

Add inside `describe("metadata import boundaries", () => { ... })`:

```ts
it("production-код не импортирует type-rule registry через formElement/factory", () => {
  const offenders = findImportOffenders(METADATA_DIR, FORBIDDEN_FORM_ELEMENT_FACTORY_IMPORTS)
    .filter(({ filePath }) => filePath !== "metadata/orchestration/formElement/factory.ts")

  expect(offenders).toEqual([])
})

it("orchestration не импортирует модель baseElement из forms", () => {
  const offenders = findImportOffenders(ORCHESTRATION_DIR, FORBIDDEN_ORCHESTRATION_FORM_MODEL_IMPORTS)
    .filter(({ filePath }) => !filePath.includes(".test.ts"))

  expect(offenders).toEqual([])
})
```

- [ ] **Step 3: Run boundary tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts --no-isolate
```

Expected: first new test PASS. Second new test FAIL while form-specific files still live under `orchestration/formElement`.

## Task 4: Move Form-Specific Layer Under Forms

**Files:**
- Move from: `packages/core/metadata/orchestration/formElement/*.ts`
- Move to: `packages/core/metadata/forms/elements/orchestration/*.ts`
- Keep: `packages/core/metadata/orchestration/formElement/*.ts` as re-export files

- [ ] **Step 1: Create destination directory**

Run:

```bash
mkdir -p packages/core/metadata/forms/elements/orchestration
```

Expected: directory exists.

- [ ] **Step 2: Move form-specific files**

Run:

```bash
git mv packages/core/metadata/orchestration/formElement/fn.ts packages/core/metadata/forms/elements/orchestration/fn.ts
git mv packages/core/metadata/orchestration/formElement/fromXML.ts packages/core/metadata/forms/elements/orchestration/fromXML.ts
git mv packages/core/metadata/orchestration/formElement/fromYAML.ts packages/core/metadata/forms/elements/orchestration/fromYAML.ts
git mv packages/core/metadata/orchestration/formElement/helper.ts packages/core/metadata/forms/elements/orchestration/helper.ts
git mv packages/core/metadata/orchestration/formElement/ruleFactory.ts packages/core/metadata/forms/elements/orchestration/ruleFactory.ts
git mv packages/core/metadata/orchestration/formElement/singletonName.ts packages/core/metadata/forms/elements/orchestration/singletonName.ts
git mv packages/core/metadata/orchestration/formElement/toEnterprise.ts packages/core/metadata/forms/elements/orchestration/toEnterprise.ts
git mv packages/core/metadata/orchestration/formElement/toJSONSchema.ts packages/core/metadata/forms/elements/orchestration/toJSONSchema.ts
git mv packages/core/metadata/orchestration/formElement/toXML.ts packages/core/metadata/forms/elements/orchestration/toXML.ts
git mv packages/core/metadata/orchestration/formElement/toYAML.ts packages/core/metadata/forms/elements/orchestration/toYAML.ts
git mv packages/core/metadata/orchestration/formElement/types.ts packages/core/metadata/forms/elements/orchestration/types.ts
git mv packages/core/metadata/orchestration/formElement/singletonName.test.ts packages/core/metadata/forms/elements/orchestration/singletonName.test.ts
git mv packages/core/metadata/orchestration/formElement/toJSONSchema.test.ts packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts
```

Expected: files are moved by git.

- [ ] **Step 3: Normalize imports in moved files**

Run:

```bash
perl -0pi -e 's#from "\\.\\."#from "~/metadata/orchestration"#g; s#from "\\.\\.\\/property\\/([^"]+)"#from "~/metadata/orchestration/property/$1"#g; s#from "\\.\\.\\/metadataItem\\/([^"]+)"#from "~/metadata/orchestration/metadataItem/$1"#g; s#from "\\.\\.\\/\\.\\.\\/orchestration\\/property\\/([^"]+)"#from "~/metadata/orchestration/property/$1"#g; s#~/metadata/orchestration/formElement/#~/metadata/forms/elements/orchestration/#g' packages/core/metadata/forms/elements/orchestration/*.ts
perl -0pi -e 's#from "../property/typeRuleRegistry"#from "~/metadata/orchestration/property/typeRuleRegistry"#g' packages/core/metadata/forms/elements/orchestration/ruleFactory.ts
```

Expected: no command output.

- [ ] **Step 4: Create compatibility re-exports**

Create these files with the matching one-line content:

```ts
// packages/core/metadata/orchestration/formElement/fn.ts
export * from "~/metadata/forms/elements/orchestration/fn"

// packages/core/metadata/orchestration/formElement/fromXML.ts
export * from "~/metadata/forms/elements/orchestration/fromXML"

// packages/core/metadata/orchestration/formElement/fromYAML.ts
export * from "~/metadata/forms/elements/orchestration/fromYAML"

// packages/core/metadata/orchestration/formElement/helper.ts
export * from "~/metadata/forms/elements/orchestration/helper"

// packages/core/metadata/orchestration/formElement/ruleFactory.ts
export * from "~/metadata/forms/elements/orchestration/ruleFactory"

// packages/core/metadata/orchestration/formElement/singletonName.ts
export * from "~/metadata/forms/elements/orchestration/singletonName"

// packages/core/metadata/orchestration/formElement/toEnterprise.ts
export * from "~/metadata/forms/elements/orchestration/toEnterprise"

// packages/core/metadata/orchestration/formElement/toJSONSchema.ts
export * from "~/metadata/forms/elements/orchestration/toJSONSchema"

// packages/core/metadata/orchestration/formElement/toXML.ts
export * from "~/metadata/forms/elements/orchestration/toXML"

// packages/core/metadata/orchestration/formElement/toYAML.ts
export * from "~/metadata/forms/elements/orchestration/toYAML"

// packages/core/metadata/orchestration/formElement/types.ts
export * from "~/metadata/forms/elements/orchestration/types"
```

- [ ] **Step 5: Update orchestration and forms public exports**

In `packages/core/metadata/orchestration/index.ts`, keep old exports for compatibility, and add no new form-specific export from orchestration.

In `packages/core/metadata/forms/index.ts`, add:

```ts
export {
  clearElementRulesRegistry,
  getElementRule,
  registerElementRule,
} from "./elements/orchestration/ruleFactory"
export type { ElementRule } from "./elements/orchestration/types"
```

- [ ] **Step 6: Move test imports**

In moved tests under `packages/core/metadata/forms/elements/orchestration`, replace local imports if needed:

```ts
import { getElementRule } from "./ruleFactory"
import { exportElementRuleToJSONSchema } from "./toJSONSchema"
```

Expected: tests import from the moved local files, not the compatibility path.

## Task 5: Verify Behavior

**Files:**
- Test: `packages/core/metadata/importBoundaries.test.ts`
- Test: `packages/core/metadata/forms/elements/orchestration/*.test.ts`

- [ ] **Step 1: Run boundary tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run moved formElement tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/orchestration/singletonName.test.ts metadata/forms/elements/orchestration/toJSONSchema.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 3: Run type check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 4: Run package tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 5: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.

## Task 6: Commit

**Files:**
- Stage all files changed in this plan.

- [ ] **Step 1: Inspect important searches**

Run:

```bash
rg -n "orchestration/formElement/factory" packages/core/metadata -g '*.ts' -g '!*.test.ts'
rg -n "~/metadata/forms/elements/baseElement/types" packages/core/metadata/orchestration -g '*.ts' -g '!*.test.ts'
```

Expected: first command only shows the compatibility file if it appears at all; second command has no output.

- [ ] **Step 2: Commit**

Run:

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: разделить formElement и registry"
```

Expected: commit succeeds.
