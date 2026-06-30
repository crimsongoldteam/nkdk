# Rules Builder Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Автоматически перенести production `rules.ts` на локальные builders для property-правил и запретить возврат прямых `{ type: "..." }`.

**Architecture:** Добавляем небольшой инструмент на TypeScript compiler API: сначала он строит инвентаризацию прямых property-rule объектов, затем применяет разрешённую карту builders и переписывает только известные rule-позиции. Builders живут рядом с property-типами; для строгих типов используют `ExactRuleParams`, для сложных типов допускается временный `wideRule`, который явно попадает в отчёт долгов.

**Tech Stack:** TypeScript 5.9 compiler API, `tsx`, Vitest, существующие `~/metadata/*` aliases, `pnpm`.

---

## Scope Check

Этот план реализует `docs/superpowers/specs/2026-06-30-rules-builder-migration-design.md`. Он не меняет смысл сериализации и не возвращает центральные registry в orchestration. Миграция должна выполняться в текущем worktree `codex/metadata-layer-violations-spec`.

Перед любым изменением в `packages/core/metadata/**` обязательно выполнить:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,260p' .agents/knowledge/metadata/INDEX.md || echo "metadata knowledge index is missing"
```

Если файл существует, прочитать указанные там документы перед редактированием metadata.

## File Structure

- Create: `packages/core/metadata/rulesBuilderMigration/builderCatalog.ts`
  - Static catalog `propertyType -> builderName/importPath/mode`.
  - Не production runtime; используется тестами и migration scripts.
- Create: `packages/core/metadata/rulesBuilderMigration/inventory.ts`
  - Чистые функции инвентаризации `rules.ts`.
- Create: `packages/core/metadata/rulesBuilderMigration/transform.ts`
  - Чистые функции AST-преобразования одного файла.
- Create: `packages/core/metadata/rulesBuilderMigration/cli.ts`
  - CLI для `inventory` и `apply`.
- Create: `packages/core/metadata/rulesBuilderMigration/__tests__/transform.test.ts`
  - Unit tests на преобразование imports, nested `defaultItemRule`, сохранение функций и игнор business-data `type`.
- Create: `packages/core/metadata/rulesBuilderMigration/__tests__/inventory.test.ts`
  - Unit tests на подсчёт rule-позиций и режимы `strict/wide/missing`.
- Modify: `packages/core/metadata/commonObjects/boolean/types.ts`
  - Добавить `booleanRule`.
- Modify: `packages/core/metadata/commonObjects/number/types.ts`
  - Добавить `numberRule`.
- Modify: `packages/core/metadata/commonObjects/module/types.ts`
  - Добавить `moduleRule`.
- Modify: selected property type files under `packages/core/metadata/**/types.ts` or `register.ts`
  - Добавить builders для всех property-типов из catalog.
- Modify: `packages/core/metadata/**/*.rules.ts`
  - Механически заменить прямые property-rule objects на builder calls.
- Modify: `packages/core/metadata/importBoundaries.test.ts`
  - Добавить guard против новых прямых property-rule `{ type: "..." }` в production `rules.ts`.

## Task 0: Preflight

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `docs/superpowers/specs/2026-06-30-rules-builder-migration-design.md`
- Read: `packages/core/metadata/commonObjects/ruleBuilder.ts`
- Read: `packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts`

- [ ] **Step 1: Check worktree and branch**

Run:

```bash
pwd
git status --short --branch
```

Expected:

```text
/Users/nikita/git/nkdk/.worktrees/metadata-layer-violations-spec
## codex/metadata-layer-violations-spec
```

- [ ] **Step 2: Read metadata knowledge**

Run:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,260p' .agents/knowledge/metadata/INDEX.md || echo "metadata knowledge index is missing"
```

Expected in this worktree today:

```text
metadata knowledge index is missing
```

- [ ] **Step 3: Re-read design and existing builder helper**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-06-30-rules-builder-migration-design.md
sed -n '1,120p' packages/core/metadata/commonObjects/ruleBuilder.ts
sed -n '1,220p' packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts
```

Expected: design mentions `wide` builders, and `ruleBuilder.ts` exports `ExactRuleParams` and `definePropertyRule`.

## Task 1: Add Inventory and Transform Tests

**Files:**
- Create: `packages/core/metadata/rulesBuilderMigration/__tests__/inventory.test.ts`
- Create: `packages/core/metadata/rulesBuilderMigration/__tests__/transform.test.ts`

- [ ] **Step 1: Write failing inventory tests**

Create `packages/core/metadata/rulesBuilderMigration/__tests__/inventory.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { inventoryRulesSource } from "../inventory"
import { createBuilderCatalog } from "../builderCatalog"

describe("rules builder migration inventory", () => {
  it("counts direct property rules only in known rule positions", () => {
    const source = `
      export const ExampleRules = {
        properties: {
          name: { type: "string", xmlParents: properties },
          defaults: {
            type: "MetadataValue",
            defaultItemRule: { type: "string", xml: "Value" },
          },
        },
        notAProperty: { type: "BusinessData" },
      } as const
    `

    expect(inventoryRulesSource("example/rules.ts", source, createBuilderCatalog())).toEqual([
      {
        filePath: "example/rules.ts",
        propertyPath: "properties.name",
        propertyType: "string",
        builderName: "stringRule",
        importPath: "~/metadata/commonObjects/string/types",
        mode: "strict",
      },
      {
        filePath: "example/rules.ts",
        propertyPath: "properties.defaults",
        propertyType: "MetadataValue",
        builderName: "metadataValueRule",
        importPath: "~/metadata/commonObjects/metadataValue/types",
        mode: "wide",
      },
      {
        filePath: "example/rules.ts",
        propertyPath: "properties.defaults.defaultItemRule",
        propertyType: "string",
        builderName: "stringRule",
        importPath: "~/metadata/commonObjects/string/types",
        mode: "strict",
      },
    ])
  })
})
```

- [ ] **Step 2: Write failing transform tests**

Create `packages/core/metadata/rulesBuilderMigration/__tests__/transform.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { createBuilderCatalog } from "../builderCatalog"
import { transformRulesSource } from "../transform"

describe("rules builder migration transform", () => {
  it("rewrites direct property rules and adds imports", () => {
    const source = `
      const properties = ["Properties"]
      export const ExampleRules = {
        properties: {
          name: {
            type: "string",
            xmlParents: properties,
            defaultValue: ({ name }: { name?: string }) => name,
          },
          synonym: {
            yaml: "Синоним",
            type: "I8nText",
            xmlParents: properties,
          },
        },
      } as const
    `

    expect(transformRulesSource("example/rules.ts", source, createBuilderCatalog()).code).toContain(
      'import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"\n' +
        'import { stringRule } from "~/metadata/commonObjects/string/types"'
    )
    expect(transformRulesSource("example/rules.ts", source, createBuilderCatalog()).code).toContain(
      "name: stringRule({"
    )
    expect(transformRulesSource("example/rules.ts", source, createBuilderCatalog()).code).toContain(
      "defaultValue: ({ name }: { name?: string }) => name"
    )
    expect(transformRulesSource("example/rules.ts", source, createBuilderCatalog()).code).toContain(
      "synonym: i8nTextRule({"
    )
    expect(transformRulesSource("example/rules.ts", source, createBuilderCatalog()).changed).toBe(true)
  })

  it("rewrites nested defaultItemRule and leaves business data alone", () => {
    const source = `
      export const ExampleRules = {
        properties: {
          values: {
            type: "MetadataValue",
            defaultItemRule: {
              type: "string",
              xml: "Value",
            },
            sampleData: {
              type: "BusinessData",
              value: 1,
            },
          },
        },
      } as const
    `

    const result = transformRulesSource("example/rules.ts", source, createBuilderCatalog())

    expect(result.code).toContain("values: metadataValueRule({")
    expect(result.code).toContain("defaultItemRule: stringRule({")
    expect(result.code).toContain('sampleData: {\n              type: "BusinessData"')
  })
})
```

- [ ] **Step 3: Run tests and confirm they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/rulesBuilderMigration/__tests__ --no-isolate
```

Expected: FAIL because `builderCatalog`, `inventory`, and `transform` modules do not exist.

## Task 2: Implement Builder Catalog and Inventory

**Files:**
- Create: `packages/core/metadata/rulesBuilderMigration/builderCatalog.ts`
- Create: `packages/core/metadata/rulesBuilderMigration/inventory.ts`

- [ ] **Step 1: Create builder catalog**

Create `packages/core/metadata/rulesBuilderMigration/builderCatalog.ts`:

```ts
export type BuilderMode = "strict" | "wide"

export type BuilderCatalogEntry = {
  propertyType: string
  builderName: string
  importPath: string
  mode: BuilderMode
}

export type BuilderCatalog = ReadonlyMap<string, BuilderCatalogEntry>

const entries = [
  ["string", "stringRule", "~/metadata/commonObjects/string/types", "strict"],
  ["boolean", "booleanRule", "~/metadata/commonObjects/boolean/types", "strict"],
  ["number", "numberRule", "~/metadata/commonObjects/number/types", "strict"],
  ["uuid", "uuidRule", "~/metadata/commonObjects/uuid/types", "strict"],
  ["XMLRoot", "xmlRootRule", "~/metadata/commonObjects/xmlRoot/types", "strict"],
  ["I8nText", "i8nTextRule", "~/metadata/commonObjects/i8nText/types", "strict"],
  ["SystemEnumeration", "systemEnumerationRule", "~/metadata/systemEnumerations/types", "strict"],
  ["MetadataValue", "metadataValueRule", "~/metadata/commonObjects/metadataValue/types", "wide"],
] as const satisfies readonly (readonly [string, string, string, BuilderMode])[]

export function createBuilderCatalog(): BuilderCatalog {
  return new Map(
    entries.map(([propertyType, builderName, importPath, mode]) => [
      propertyType,
      { propertyType, builderName, importPath, mode },
    ])
  )
}
```

- [ ] **Step 2: Create inventory implementation**

Create `packages/core/metadata/rulesBuilderMigration/inventory.ts`:

```ts
import ts from "typescript"
import type { BuilderCatalog, BuilderMode } from "./builderCatalog"

export type RuleInventoryItem = {
  filePath: string
  propertyPath: string
  propertyType: string
  builderName: string | undefined
  importPath: string | undefined
  mode: BuilderMode | "missing"
}

export function inventoryRulesSource(
  filePath: string,
  sourceText: string,
  catalog: BuilderCatalog
): RuleInventoryItem[] {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const items: RuleInventoryItem[] = []

  function visitObjectLiteral(node: ts.ObjectLiteralExpression, path: string[], inRulePosition: boolean): void {
    const typeProperty = getStringProperty(node, "type")
    const isRule = inRulePosition && typeProperty !== undefined

    if (isRule) {
      const entry = catalog.get(typeProperty)
      items.push({
        filePath,
        propertyPath: path.join("."),
        propertyType: typeProperty,
        builderName: entry?.builderName,
        importPath: entry?.importPath,
        mode: entry?.mode ?? "missing",
      })
    }

    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue

      const name = getPropertyName(property.name)
      if (!name || !ts.isObjectLiteralExpression(property.initializer)) continue

      const nextPath = [...path, name]
      const nextInRulePosition =
        name === "properties" || name === "defaultItemRule" || isRule || path[path.length - 1] === "properties"

      if (name === "properties") {
        visitPropertiesObject(property.initializer, nextPath)
      } else {
        visitObjectLiteral(property.initializer, nextPath, nextInRulePosition)
      }
    }
  }

  function visitPropertiesObject(node: ts.ObjectLiteralExpression, path: string[]): void {
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue
      const name = getPropertyName(property.name)
      if (!name || !ts.isObjectLiteralExpression(property.initializer)) continue
      visitObjectLiteral(property.initializer, [...path, name], true)
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isPropertyAssignment(node) && getPropertyName(node.name) === "properties" && ts.isObjectLiteralExpression(node.initializer)) {
      visitPropertiesObject(node.initializer, ["properties"])
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return items
}

function getStringProperty(node: ts.ObjectLiteralExpression, name: string): string | undefined {
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    if (getPropertyName(property.name) !== name) continue
    if (!ts.isStringLiteral(property.initializer)) continue
    return property.initializer.text
  }
  return undefined
}

function getPropertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  return undefined
}
```

- [ ] **Step 3: Run inventory test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/rulesBuilderMigration/__tests__/inventory.test.ts --no-isolate
```

Expected: PASS.

## Task 3: Implement Transform

**Files:**
- Create: `packages/core/metadata/rulesBuilderMigration/transform.ts`

- [ ] **Step 1: Create transform implementation**

Create `packages/core/metadata/rulesBuilderMigration/transform.ts`:

```ts
import ts from "typescript"
import type { BuilderCatalog, BuilderCatalogEntry } from "./builderCatalog"

export type TransformResult = {
  changed: boolean
  code: string
  convertedCount: number
  missingTypes: string[]
}

export function transformRulesSource(filePath: string, sourceText: string, catalog: BuilderCatalog): TransformResult {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const usedImports = new Map<string, Set<string>>()
  const missingTypes = new Set<string>()
  let convertedCount = 0

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const factory = context.factory

    const visitObjectLiteral = (node: ts.ObjectLiteralExpression, inRulePosition: boolean): ts.Expression => {
      const typeProperty = getStringProperty(node, "type")
      const entry = typeProperty ? catalog.get(typeProperty) : undefined

      const nextProperties = node.properties.map((property) => {
        if (!ts.isPropertyAssignment(property)) return property
        const name = getPropertyName(property.name)
        if (!name || !ts.isObjectLiteralExpression(property.initializer)) return property

        if (name === "properties") {
          return factory.updatePropertyAssignment(property, property.name, visitPropertiesObject(property.initializer))
        }

        const nestedInRulePosition = name === "defaultItemRule" || inRulePosition
        return factory.updatePropertyAssignment(
          property,
          property.name,
          visitObjectLiteral(property.initializer, nestedInRulePosition)
        )
      })

      const rewritten = factory.updateObjectLiteralExpression(node, nextProperties)

      if (!inRulePosition || !typeProperty) return rewritten
      if (!entry) {
        missingTypes.add(typeProperty)
        return rewritten
      }

      convertedCount += 1
      addUsedImport(usedImports, entry)
      return factory.createCallExpression(factory.createIdentifier(entry.builderName), undefined, [
        factory.updateObjectLiteralExpression(
          rewritten,
          rewritten.properties.filter((property) => !isPropertyNamed(property, "type"))
        ),
      ])
    }

    const visitPropertiesObject = (node: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression => {
      return factory.updateObjectLiteralExpression(
        node,
        node.properties.map((property) => {
          if (!ts.isPropertyAssignment(property)) return property
          if (!ts.isObjectLiteralExpression(property.initializer)) return property
          return factory.updatePropertyAssignment(property, property.name, visitObjectLiteral(property.initializer, true))
        })
      )
    }

    const visit: ts.Visitor = (node) => {
      if (ts.isPropertyAssignment(node) && getPropertyName(node.name) === "properties" && ts.isObjectLiteralExpression(node.initializer)) {
        return factory.updatePropertyAssignment(node, node.name, visitPropertiesObject(node.initializer))
      }
      return ts.visitEachChild(node, visit, context)
    }

    return (node) => ts.visitNode(node, visit) as ts.SourceFile
  }

  const transformed = ts.transform(sourceFile, [transformer]).transformed[0]
  const withImports = addImports(transformed, usedImports)
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const code = printer.printFile(withImports)

  return {
    changed: convertedCount > 0,
    code,
    convertedCount,
    missingTypes: [...missingTypes].sort(),
  }
}

function addUsedImport(imports: Map<string, Set<string>>, entry: BuilderCatalogEntry): void {
  const namedImports = imports.get(entry.importPath) ?? new Set<string>()
  namedImports.add(entry.builderName)
  imports.set(entry.importPath, namedImports)
}

function addImports(sourceFile: ts.SourceFile, imports: Map<string, Set<string>>): ts.SourceFile {
  if (imports.size === 0) return sourceFile

  const factory = ts.factory
  const existing = new Map<string, Set<string>>()

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
    const clause = statement.importClause
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue
    existing.set(
      statement.moduleSpecifier.text,
      new Set(clause.namedBindings.elements.map((element) => element.name.text))
    )
  }

  const newImports: ts.ImportDeclaration[] = []
  for (const [moduleSpecifier, names] of [...imports.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const existingNames = existing.get(moduleSpecifier) ?? new Set<string>()
    const missingNames = [...names].filter((name) => !existingNames.has(name)).sort()
    if (missingNames.length === 0) continue

    newImports.push(
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports(
            missingNames.map((name) => factory.createImportSpecifier(false, undefined, factory.createIdentifier(name)))
          )
        ),
        factory.createStringLiteral(moduleSpecifier)
      )
    )
  }

  return factory.updateSourceFile(sourceFile, [...newImports, ...sourceFile.statements])
}

function getStringProperty(node: ts.ObjectLiteralExpression, name: string): string | undefined {
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    if (getPropertyName(property.name) !== name) continue
    if (!ts.isStringLiteral(property.initializer)) continue
    return property.initializer.text
  }
  return undefined
}

function isPropertyNamed(property: ts.ObjectLiteralElementLike, name: string): boolean {
  return ts.isPropertyAssignment(property) && getPropertyName(property.name) === name
}

function getPropertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  return undefined
}
```

- [ ] **Step 2: Run transform tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/rulesBuilderMigration/__tests__/transform.test.ts --no-isolate
```

Expected: PASS.

## Task 4: Add CLI and Baseline Inventory Report

**Files:**
- Create: `packages/core/metadata/rulesBuilderMigration/cli.ts`
- Create: `packages/core/metadata/rulesBuilderMigration/README.md`

- [ ] **Step 1: Create CLI**

Create `packages/core/metadata/rulesBuilderMigration/cli.ts`:

```ts
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join, relative } from "path"
import { createBuilderCatalog } from "./builderCatalog"
import { inventoryRulesSource } from "./inventory"
import { transformRulesSource } from "./transform"

const command = process.argv[2]
const root = process.cwd()
const metadataRoot = join(root, "metadata")
const catalog = createBuilderCatalog()

if (command === "inventory") {
  const items = listRulesFiles(metadataRoot).flatMap((filePath) =>
    inventoryRulesSource(relative(root, filePath), readFileSync(filePath, "utf-8"), catalog)
  )

  const byType = new Map<string, { count: number; mode: string; files: Set<string> }>()
  for (const item of items) {
    const row = byType.get(item.propertyType) ?? { count: 0, mode: item.mode, files: new Set<string>() }
    row.count += 1
    row.files.add(item.filePath)
    byType.set(item.propertyType, row)
  }

  console.log("type,count,mode,files")
  for (const [type, row] of [...byType.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))) {
    console.log(`${type},${row.count},${row.mode},${[...row.files].sort().join("|")}`)
  }
} else if (command === "apply") {
  let changedFiles = 0
  let convertedRules = 0
  const missingTypes = new Set<string>()

  for (const filePath of listRulesFiles(metadataRoot)) {
    const source = readFileSync(filePath, "utf-8")
    const result = transformRulesSource(relative(root, filePath), source, catalog)
    for (const missingType of result.missingTypes) missingTypes.add(missingType)
    if (!result.changed) continue
    writeFileSync(filePath, result.code)
    changedFiles += 1
    convertedRules += result.convertedCount
  }

  console.log(`changedFiles=${changedFiles}`)
  console.log(`convertedRules=${convertedRules}`)
  console.log(`missingTypes=${[...missingTypes].sort().join(",")}`)
} else {
  console.error("Usage: tsx metadata/rulesBuilderMigration/cli.ts inventory|apply")
  process.exit(1)
}

function listRulesFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) return listRulesFiles(fullPath)
    if (entry.isFile() && entry.name === "rules.ts") return [fullPath]
    return []
  })
}
```

- [ ] **Step 2: Create README**

Create `packages/core/metadata/rulesBuilderMigration/README.md`:

```md
# Rules Builder Migration

This folder contains temporary migration tooling for converting metadata `rules.ts` files from direct `{ type: "..." }` property-rule objects to local builder calls.

Commands:

```bash
pnpm --filter @nakidka/core exec tsx metadata/rulesBuilderMigration/cli.ts inventory
pnpm --filter @nakidka/core exec tsx metadata/rulesBuilderMigration/cli.ts apply
```

The tooling is intentionally conservative: it rewrites only known rule positions and only property types listed in `builderCatalog.ts`.
```

- [ ] **Step 3: Run inventory**

Run:

```bash
pnpm --filter @nakidka/core exec tsx metadata/rulesBuilderMigration/cli.ts inventory
```

Expected: CSV output starts with:

```text
type,count,mode,files
```

and includes high-count rows for `SystemEnumeration`, `string`, `boolean`, `I8nText`, `number`.

- [ ] **Step 4: Commit tooling skeleton**

Run:

```bash
git add packages/core/metadata/rulesBuilderMigration
git commit -m "chore: :wrench: добавить инструмент переноса rules"
```

Expected: commit succeeds.

## Task 5: Add Strict Builders for Frequent Base Types

**Files:**
- Modify: `packages/core/metadata/commonObjects/boolean/types.ts`
- Modify: `packages/core/metadata/commonObjects/number/types.ts`
- Modify: `packages/core/metadata/commonObjects/module/types.ts`
- Modify: `packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts`
- Modify: `packages/core/metadata/rulesBuilderMigration/builderCatalog.ts`

- [ ] **Step 1: Inspect current type files**

Run:

```bash
sed -n '1,180p' packages/core/metadata/commonObjects/boolean/types.ts
sed -n '1,180p' packages/core/metadata/commonObjects/number/types.ts
sed -n '1,180p' packages/core/metadata/commonObjects/module/types.ts
```

Expected: each file exports its property rule interface or schema and can import `BasePropertyRule`, `definePropertyRule`, and `ExactRuleParams`.

- [ ] **Step 2: Add compile-time checks**

Append checks inside the existing `if (false)` block in `packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts`:

```ts
      booleanRule({ defaultValueXML: true })
      numberRule({ defaultValueXML: 1 })
      moduleRule({ xmlPath: "Ext/Module.bsl", nkdkPath: "Модуль.bsl" })

      // @ts-expect-error boolean rules do not accept system-enumeration fields.
      booleanRule({ typeSE: "ObjectBelonging" })

      // @ts-expect-error number rules do not accept module paths.
      numberRule({ xmlPath: "Ext/Module.bsl" })

      // @ts-expect-error module rules do not accept numeric defaults.
      moduleRule({ defaultValueXML: 1 })
```

Add imports at the top:

```ts
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
```

- [ ] **Step 3: Run TypeScript and confirm failure**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: FAIL because `booleanRule`, `numberRule`, or `moduleRule` are not exported yet.

- [ ] **Step 4: Add builders**

In each type file, follow the existing `stringRule` pattern:

```ts
import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export interface BooleanPropertyRule extends BasePropertyRule {
  type: "boolean"
}

export type BooleanRuleParams = Omit<BooleanPropertyRule, "type">

export function booleanRule(): Readonly<{ type: "boolean" }>
export function booleanRule<const Params extends BooleanRuleParams>(
  params: ExactRuleParams<BooleanRuleParams, Params>
): Readonly<{ type: "boolean" } & Params>
export function booleanRule(params: BooleanRuleParams = {}): Readonly<{ type: "boolean" } & BooleanRuleParams> {
  return definePropertyRule("boolean", params)
}
```

Use the same shape for `numberRule` with `type: "number"`. For `moduleRule`, use the existing module-specific interface as the allowed params; if the file does not have one, create:

```ts
export interface ModulePropertyRule extends BasePropertyRule {
  type: "Module"
  xmlPath?: string
  nkdkPath?: string
}
```

- [ ] **Step 5: Ensure catalog contains the new builders**

In `packages/core/metadata/rulesBuilderMigration/builderCatalog.ts`, verify these rows exist:

```ts
["boolean", "booleanRule", "~/metadata/commonObjects/boolean/types", "strict"],
["number", "numberRule", "~/metadata/commonObjects/number/types", "strict"],
["Module", "moduleRule", "~/metadata/commonObjects/module/types", "strict"],
```

- [ ] **Step 6: Run builder tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/propertyRuleBuilders.test.ts metadata/rulesBuilderMigration/__tests__ --no-isolate
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit base builders**

Run:

```bash
git add packages/core/metadata/commonObjects packages/core/metadata/rulesBuilderMigration packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts
git commit -m "refactor: :recycle: добавить builders базовых rules"
```

Expected: commit succeeds.

## Task 6: Migrate First Batch Automatically

**Files:**
- Modify: `packages/core/metadata/**/*.rules.ts`

- [ ] **Step 1: Run apply for catalog-supported types**

Run:

```bash
pnpm --filter @nakidka/core exec tsx metadata/rulesBuilderMigration/cli.ts apply
```

Expected output includes non-zero `changedFiles` and `convertedRules`.

- [ ] **Step 2: Format changed TypeScript files**

Run:

```bash
pnpm exec prettier --write "packages/core/metadata/**/*.ts"
```

Expected: prettier completes without errors.

- [ ] **Step 3: Inspect representative diff**

Run:

```bash
git diff -- packages/core/metadata/appliedObjects/metadataBot/rules.ts packages/core/metadata/appliedObjects/metadataCatalog/rules.ts packages/core/metadata/forms/commonObjects/formCommand/rules.ts
```

Expected:

- property objects for catalog-supported types become builder calls;
- `metadataTarget`, functions, `xmlParents`, `defaultValueXML`, and `implicitValueYAML` remain present;
- no non-rule business data is rewritten.

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/propertyRuleBuilders.test.ts metadata/rulesBuilderMigration/__tests__ --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Commit first migration batch**

Run:

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: перевести базовые rules на builders"
```

Expected: commit succeeds.

## Task 7: Expand Catalog With Wide Builders for Remaining Types

**Files:**
- Modify/Create: property type modules under `packages/core/metadata/**/types.ts` or `register.ts`
- Modify: `packages/core/metadata/rulesBuilderMigration/builderCatalog.ts`
- Modify: `packages/core/metadata/rulesBuilderMigration/__tests__/inventory.test.ts`

- [ ] **Step 1: Generate current missing type list**

Run:

```bash
pnpm --filter @nakidka/core exec tsx metadata/rulesBuilderMigration/cli.ts inventory | awk -F, '$3 == "missing" { print $1 "," $2 }'
```

Expected: prints remaining property types not present in `builderCatalog.ts`.

- [ ] **Step 2: For each remaining type, add a builder next to the type**

For a complex type without exact params yet, add a temporary wide builder in its local module:

```ts
import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule } from "~/metadata/orchestration/property/types"

export interface ExamplePropertyRule extends PropertyRule {
  type: "Example"
}

export type ExampleRuleParams = Omit<ExamplePropertyRule, "type">

export function exampleRule<const Params extends ExampleRuleParams>(
  params: ExactRuleParams<ExampleRuleParams, Params>
): Readonly<{ type: "Example" } & Params> {
  return definePropertyRule("Example", params)
}
```

Use the concrete property type name and local file path. Do not place these builders in orchestration and do not create a central all-builders barrel.

- [ ] **Step 3: Add each builder to catalog**

For each builder, add a row:

```ts
["Example", "exampleRule", "~/metadata/commonObjects/example/types", "wide"],
```

Use `"strict"` only when the builder uses a concrete local params type that rejects foreign fields. Use `"wide"` when it still depends on broad `PropertyRule`.

- [ ] **Step 4: Extend inventory test for wide rows**

In `packages/core/metadata/rulesBuilderMigration/__tests__/inventory.test.ts`, keep `MetadataValue` as the sample wide row and verify `mode: "wide"` is preserved. The expected object already covers this; update only if the sample type changes.

- [ ] **Step 5: Run inventory until missing list is empty**

Run:

```bash
pnpm --filter @nakidka/core exec tsx metadata/rulesBuilderMigration/cli.ts inventory | awk -F, '$3 == "missing" { print $1 "," $2 }'
```

Expected: no output.

- [ ] **Step 6: Run TypeScript**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit expanded builders**

Run:

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: добавить builders для оставшихся rules"
```

Expected: commit succeeds.

## Task 8: Migrate Remaining Rules

**Files:**
- Modify: `packages/core/metadata/**/*.rules.ts`

- [ ] **Step 1: Apply migration again**

Run:

```bash
pnpm --filter @nakidka/core exec tsx metadata/rulesBuilderMigration/cli.ts apply
```

Expected:

```text
missingTypes=
```

and `convertedRules` is non-zero unless Task 7 already converted all supported rules.

- [ ] **Step 2: Format changed files**

Run:

```bash
pnpm exec prettier --write "packages/core/metadata/**/*.ts"
```

Expected: prettier completes without errors.

- [ ] **Step 3: Check inventory is clean**

Run:

```bash
pnpm --filter @nakidka/core exec tsx metadata/rulesBuilderMigration/cli.ts inventory
```

Expected: either only known non-property exceptions remain, or the output has no rows. Any remaining row must be added to the exception list in Task 9 with an exact file and property path.

- [ ] **Step 4: Run TypeScript and focused metadata tests**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/propertyRuleBuilders.test.ts metadata/rulesBuilderMigration/__tests__ metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Commit remaining migration**

Run:

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: перевести оставшиеся rules на builders"
```

Expected: commit succeeds.

## Task 9: Add Boundary Guard Against Direct Rule Types

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Add failing boundary test**

Add this test near the other metadata boundary tests:

```ts
  it("production rules.ts не объявляют property-rule type вручную", () => {
    const offenders = listRulesFiles(METADATA_DIR)
      .flatMap((filePath) => findDirectRuleTypeOffenders(filePath))
      .filter(({ filePath, propertyPath }) => !ALLOWED_DIRECT_RULE_TYPE_OFFENDERS.has(`${filePath}:${propertyPath}`))

    expect(offenders).toEqual([])
  })
```

Add helpers at the bottom of the file:

```ts
const ALLOWED_DIRECT_RULE_TYPE_OFFENDERS = new Set<string>()

function listRulesFiles(dir: string): string[] {
  return listTypeScriptFiles(dir).filter((filePath) => filePath.endsWith("/rules.ts"))
}

function findDirectRuleTypeOffenders(filePath: string): Array<{ filePath: string; propertyPath: string; propertyType: string }> {
  const source = readFileSync(filePath, "utf-8")
  const relativePath = relative(process.cwd(), filePath)
  const offenders: Array<{ filePath: string; propertyPath: string; propertyType: string }> = []
  const propertyRulePattern = /(\w+)\s*:\s*\{\s*(?:[^{}]|\{[^{}]*\})*type:\s*"([^"]+)"/g

  for (const match of source.matchAll(propertyRulePattern)) {
    offenders.push({
      filePath: relativePath,
      propertyPath: match[1],
      propertyType: match[2],
    })
  }

  return offenders
}
```

- [ ] **Step 2: Run boundary test and refine helper if needed**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS. If it flags false positives where `type` is business data, replace the regex helper with a call to `inventoryRulesSource(..., createBuilderCatalog())` and allow only exact exceptions.

- [ ] **Step 3: Commit boundary guard**

Run:

```bash
git add packages/core/metadata/importBoundaries.test.ts
git commit -m "test: :white_check_mark: запретить прямые type в rules"
```

Expected: commit succeeds.

## Task 10: Full Verification and Final Commit Check

**Files:**
- Read: all changed files via `git status` and `git diff --stat`

- [ ] **Step 1: Run final inventory**

Run:

```bash
pnpm --filter @nakidka/core exec tsx metadata/rulesBuilderMigration/cli.ts inventory
```

Expected: no unapproved direct property-rule rows. Wide rows may appear only in builder catalog reporting, not as direct `rules.ts` objects.

- [ ] **Step 2: Run full project checks**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
pnpm --filter @nakidka/core test
pnpm test
```

Expected: all commands PASS.

- [ ] **Step 3: Inspect final status**

Run:

```bash
git status --short --branch
git log --oneline -8
```

Expected: branch is `codex/metadata-layer-violations-spec`; working tree is clean; recent commits correspond to this migration.

## Self-Review Checklist

- Spec coverage: inventory, builders for all types, mechanical migration, boundary guard, tests and wide-builder debt are covered by Tasks 1-10.
- Placeholder scan: no unfinished markers or unspecified implementation steps are allowed in this plan.
- Type consistency: `BuilderCatalogEntry`, `RuleInventoryItem`, `transformRulesSource`, and `inventoryRulesSource` signatures are used consistently across tests, CLI, and implementation.
