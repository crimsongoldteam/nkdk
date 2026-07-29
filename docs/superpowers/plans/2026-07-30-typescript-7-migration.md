# TypeScript 7 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Полностью перевести NKDK на TypeScript 7 без TypeScript 6, `ts-patch` и обращений к Compiler API.

**Architecture:** Временные миграционные инструменты удаляются. Fixture wizard получает `xmlDir` из действующего реестра `TopLevelMetadataItemRules`, а штатные команды `tsc` начинают использовать нативный TypeScript 7.

**Tech Stack:** TypeScript 7, Node.js 26, pnpm 10, Vitest 4.

## Global Constraints

- В дереве зависимостей не должно остаться TypeScript 6 или совместимого пакета `@typescript/typescript6`.
- Не добавлять сторонний анализатор TypeScript AST.
- Не изменять существующие XML-фикстуры.
- Не добавлять новые `fromXML`/`toXML`/`fromYAML`/`toYAML`.
- Итоговая проверка обязательно включает `pnpm test`.

---

### Task 1: Отвязать fixture wizard от Compiler API

**Files:**
- Modify: `packages/core/scripts/fixture-wizard/targetResolver.ts`
- Modify: `packages/core/scripts/fixture-wizard/targetResolver.test.ts`

**Interfaces:**
- Consumes: `TopLevelMetadataItemRules: readonly MetadataItemRule[]` из `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`.
- Produces: `resolveXmlDir(metadataItem: string, rules?: readonly XmlDirRule[]): string | undefined`.
- Preserves: `resolveMetadataTarget(projectRoot: string, metadataItem: string): Promise<MetadataTarget>`.

- [ ] **Step 1: Заменить тесты разбора исходного текста тестами реестра правил**

В `targetResolver.test.ts` удалить создание `rules.ts`, импорт `writeFile` и тесты
`readXmlDirFromRules`. Добавить импорт `resolveXmlDir` и проверки:

```ts
it("находит строковый xmlDir по имени каталога metadataItem", () => {
  expect(
    resolveXmlDir("metadataCatalog", [
      { itemType: "MetadataCatalog", xmlDir: "Catalogs" },
    ])
  ).toBe("Catalogs")
})

it("возвращает undefined для неизвестного metadataItem и правила без xmlDir", () => {
  const rules = [{ itemType: "MetadataProbe" }]
  expect(resolveXmlDir("metadataUnknown", rules)).toBeUndefined()
  expect(resolveXmlDir("metadataProbe", rules)).toBeUndefined()
})
```

Существующий тест `resolveMetadataTarget` оставить, но создавать только каталог
`metadataDocument`: ожидаемый `xmlDir` остаётся равен `"Documents"` и приходит из
реального `TopLevelMetadataItemRules`.

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/fixture-wizard/targetResolver.test.ts
```

Expected: FAIL, потому что `resolveXmlDir` ещё не экспортируется.

- [ ] **Step 3: Реализовать разрешение `xmlDir` через реестр**

В `targetResolver.ts` удалить импорты `access`, `readFile` и `typescript`, функции
`readXmlDirFromRules`, `isXmlDirProperty`, `readStringLiteral`. Добавить:

```ts
import { readdir } from "node:fs/promises"
import { TopLevelMetadataItemRules } from "../../metadata/appliedObjects/configuration/topLevelRules"
import type { MetadataItemRule } from "../../metadata/orchestration/property/types"

type XmlDirRule = Pick<MetadataItemRule, "itemType" | "xmlDir">

export function resolveXmlDir(
  metadataItem: string,
  rules: readonly XmlDirRule[] = TopLevelMetadataItemRules
): string | undefined {
  const itemType = `${metadataItem.charAt(0).toUpperCase()}${metadataItem.slice(1)}`
  const xmlDir = rules.find((rule) => rule.itemType === itemType)?.xmlDir
  return typeof xmlDir === "string" ? xmlDir : undefined
}
```

В результате `resolveMetadataTarget` заменить:

```ts
xmlDir: await readXmlDirFromRules(itemDir),
```

на:

```ts
xmlDir: resolveXmlDir(metadataItem),
```

- [ ] **Step 4: Запустить точечный тест**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/fixture-wizard/targetResolver.test.ts
```

Expected: PASS.

- [ ] **Step 5: Зафиксировать изменение**

```bash
git add packages/core/scripts/fixture-wizard/targetResolver.ts packages/core/scripts/fixture-wizard/targetResolver.test.ts
git commit -m "refactor: :recycle: отвязать fixture wizard от Compiler API"
```

### Task 2: Удалить временные миграционные инструменты

**Files:**
- Delete: `packages/core/metadata/rulesBuilderMigration/README.md`
- Delete: `packages/core/metadata/rulesBuilderMigration/__tests__/inventory.test.ts`
- Delete: `packages/core/metadata/rulesBuilderMigration/__tests__/transform.test.ts`
- Delete: `packages/core/metadata/rulesBuilderMigration/builderCatalog.ts`
- Delete: `packages/core/metadata/rulesBuilderMigration/cli.ts`
- Delete: `packages/core/metadata/rulesBuilderMigration/inventory.ts`
- Delete: `packages/core/metadata/rulesBuilderMigration/transform.ts`
- Delete: `packages/core/scripts/conversion-test-migration/auditMap.test.ts`
- Delete: `packages/core/scripts/conversion-test-migration/auditMap.ts`
- Delete: `packages/core/scripts/conversion-test-migration/buildMap.test.ts`
- Delete: `packages/core/scripts/conversion-test-migration/buildMap.ts`
- Delete: `packages/core/scripts/conversion-test-migration/extractScenarios.test.ts`
- Delete: `packages/core/scripts/conversion-test-migration/extractScenarios.ts`
- Delete: `packages/core/scripts/conversion-test-migration/migration-map.json`
- Delete: `packages/core/scripts/conversion-test-migration/readDeletedTests.test.ts`
- Delete: `packages/core/scripts/conversion-test-migration/readDeletedTests.ts`
- Delete: `packages/core/scripts/conversion-test-migration/types.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`

**Interfaces:**
- Removes: все импорты `typescript` из исходного дерева NKDK.
- Preserves: остальные 27 проверок архитектурных границ.

- [ ] **Step 1: Удалить зависимую архитектурную проверку**

Из `importBoundaries.test.ts` удалить импорты:

```ts
import { createBuilderCatalog } from "./rulesBuilderMigration/builderCatalog"
import { inventoryRulesSource } from "./rulesBuilderMigration/inventory"
```

Удалить тест `"production rules.ts не объявляют property-rule type вручную"`,
константу `ALLOWED_DIRECT_RULE_TYPE_OFFENDERS` и функцию `listRulesFiles`.

- [ ] **Step 2: Удалить перечисленные временные файлы**

Удалить полностью каталоги:

```text
packages/core/metadata/rulesBuilderMigration
packages/core/scripts/conversion-test-migration
```

- [ ] **Step 3: Проверить отсутствие ссылок и архитектурные тесты**

Run:

```bash
rg -n "rulesBuilderMigration|conversion-test-migration|from [\"']typescript[\"']" packages package.json
pnpm --filter @nkdk/core exec vitest run metadata/importBoundaries.test.ts
```

Expected: `rg` не находит совпадений; Vitest сообщает PASS для 27 тестов.

- [ ] **Step 4: Зафиксировать удаление**

```bash
git add packages/core/metadata/importBoundaries.test.ts packages/core/metadata/rulesBuilderMigration packages/core/scripts/conversion-test-migration
git commit -m "refactor: :fire: удалить временные миграционные инструменты"
```

### Task 3: Обновить компилятор до TypeScript 7

**Files:**
- Modify: `package.json`
- Modify: `packages/core/package.json`
- Modify: `packages/mcp/package.json`
- Modify: `packages/platform/package.json`
- Modify: `packages/core/tsconfig.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces: команда `tsc` версии `7.0.x` во всех workspace-пакетах.
- Removes: `ts-patch` и команды `prepare`, которые его запускают.

- [ ] **Step 1: Обновить манифесты**

Во всех четырёх `package.json` заменить:

```json
"typescript": "~6.0.0"
```

на:

```json
"typescript": "~7.0.0"
```

Из корневого и `packages/core/package.json` удалить `ts-patch` и скрипт
`"prepare": "ts-patch install"`. Из `packages/core/tsconfig.json` удалить:

```json
"plugins": []
```

и убрать ставшую лишней запятую у предыдущего поля.

- [ ] **Step 2: Обновить lock-файл**

Run:

```bash
pnpm install
```

Expected: установка завершается успешно; `pnpm-lock.yaml` содержит TypeScript
`7.0.x` и не содержит `typescript@6` или `ts-patch`.

- [ ] **Step 3: Проверить версию и дерево зависимостей**

Run:

```bash
pnpm exec tsc --version
pnpm why -r typescript
rg -n "typescript@6|@typescript/typescript6|ts-patch" pnpm-lock.yaml package.json packages
```

Expected: первая команда печатает `Version 7.0.x`, `pnpm why` показывает только
TypeScript 7, `rg` не находит совпадений.

- [ ] **Step 4: Проверить типы и сборку**

Run:

```bash
pnpm type-check
pnpm build
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 5: Зафиксировать обновление**

```bash
git add package.json packages/core/package.json packages/mcp/package.json packages/platform/package.json packages/core/tsconfig.json pnpm-lock.yaml
git commit -m "chore: :wrench: обновить TypeScript до версии 7"
```

### Task 4: Полная проверка перехода

**Files:**
- Verify only.

**Interfaces:**
- Confirms: чистый TypeScript 7 и отсутствие регрессий во всём workspace.

- [ ] **Step 1: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: все пакеты и тесты завершаются успешно.

- [ ] **Step 2: Проверить чистоту перехода**

Run:

```bash
pnpm exec tsc --version
rg -n "typescript@6|@typescript/typescript6|ts-patch|from [\"']typescript[\"']" pnpm-lock.yaml package.json packages
git status --short
```

Expected: TypeScript `7.0.x`; `rg` не находит совпадений; рабочее дерево чистое.
