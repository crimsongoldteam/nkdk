# Catalog Length YAML Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить round-trip длин кода и наименования справочника: значения `10` и `30` сохранять явно, а отсутствующие YAML-поля экспортировать как `9` и `25`.

**Architecture:** Изменение выражается существующим декларативным механизмом `implicitValueYAML` в `MetadataCatalogRules`; общие metadata-операции и построитель `numberRule` не меняются. Наблюдаемый договор проверяется прямым XML → YAML → XML тестом на правилах двух свойств, а отдельный контрактный тест фиксирует их YAML-defaults.

**Tech Stack:** TypeScript 7, Vitest 4, pnpm 10, декларативные `rules.ts`, jscpd через `pnpm duplicates`.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять fromXML/toXML/fromYAML/toYAML и не менять общие типы или построители правил.
- Не использовать Configuration index или reference XML для восстановления длин.
- Не менять defaults длин других прикладных объектов.
- Перед завершением выполнить `pnpm type-check`, `pnpm test` и `pnpm duplicates` из корня worktree.
- Не запускать Stryker и другие проверки на мутантов в этой задаче.
- `pnpm duplicates` проверяет только появление новых дублей; jscpd `5.0.12` уже установлен в корневых `devDependencies`.

---

## File Structure

- `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts` — единственный production-файл; задаёт `implicitValueYAML=9` для `codeLength` и `implicitValueYAML=25` для `descriptionLength`.
- `packages/core/metadata/appliedObjects/metadataCatalog/fromXMLToYAML.test.ts` — расширяет существующие прямые проверки справочника наблюдаемым договором импорта явных значений, их обратного экспорта и экспорта отсутствующих YAML-полей.
- `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts` — фиксирует согласованность объявленных YAML-defaults справочника с defaults конфигуратора/XML.

### Task 1: Исправить YAML-defaults длин справочника

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts:117-126`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts:214-220`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts:303-309`

**Interfaces:**
- Consumes: существующие `MetadataCatalogRules`, `testPropertyFromXMLToYAML` и `testPropertyFromYAMLToXML`.
- Produces: декларативный договор `codeLength.implicitValueYAML === 9` и `descriptionLength.implicitValueYAML === 25`; публичные типы и сигнатуры не меняются.

- [ ] **Step 1: Добавить падающую проверку наблюдаемого договора**

В `packages/core/metadata/appliedObjects/metadataCatalog/fromXMLToYAML.test.ts` добавить `testPropertyFromYAMLToXML` в существующий импорт, импортировать `MetadataItemRule` как тип и внутри текущего `describe` добавить тест:

```ts
it("keeps non-default lengths explicit and exports catalog defaults when omitted", () => {
  const rule = {
    itemType: "MetadataCatalogLengthProbe",
    properties: {
      codeLength: MetadataCatalogRules.properties.codeLength,
      descriptionLength: MetadataCatalogRules.properties.descriptionLength,
    },
  } satisfies MetadataItemRule

  const imported = testPropertyFromXMLToYAML({
    rule,
    xml: { Properties: { CodeLength: 10, DescriptionLength: 30 } },
  })

  expect(imported.yaml).toEqual({ ДлинаКода: 10, ДлинаНаименования: 30 })

  const exportedExplicit = testPropertyFromYAMLToXML({
    rule,
    yaml: imported.yaml,
  })
  expect(exportedExplicit.xml).toEqual({
    Properties: { CodeLength: 10, DescriptionLength: 30 },
  })

  const exportedDefaults = testPropertyFromYAMLToXML({ rule, yaml: {} })
  expect(exportedDefaults.xml).toEqual({
    Properties: { CodeLength: 9, DescriptionLength: 25 },
  })
})
```

Это один самостоятельный договор: нестандартные XML-значения не теряются в YAML, а отсутствие YAML-ключей означает defaults справочника.

- [ ] **Step 2: Исправить ожидание существующего контрактного теста**

В `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts` сохранить текущий тест, но заменить значения в `expected`:

```ts
const expected = {
  codeLength: 9,
  descriptionLength: 25,
  levelCount: 2,
} as const
```

Название теста оставить про defaults конфигуратора: после исправления оно будет соответствовать проверяемому договору.

- [ ] **Step 3: Запустить целевые тесты и подтвердить красную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  packages/core/metadata/appliedObjects/metadataCatalog/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: FAIL; прямой импорт исключает `10` и `30` из YAML, а контракт видит текущие `implicitValueYAML` `10` и `30`. Проверка экспорта отсутствующих полей уже ожидаемо получает `9` и `25` благодаря `defaultValueXML`.

- [ ] **Step 4: Исправить декларативные правила**

В `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts` изменить только два литерала:

```ts
codeLength: numberRule({
  yaml: "ДлинаКода",
  defaultValueXML: 9,
  xmlParents: ["Properties"],
  implicitValueYAML: 9,
}),
```

```ts
descriptionLength: numberRule({
  yaml: "ДлинаНаименования",
  defaultValueXML: 25,
  xmlParents: ["Properties"],
  implicitValueYAML: 25,
}),
```

Не менять `defaultValueXML`, `numberRule`, XML-фикстуры или правила других объектов.

- [ ] **Step 5: Повторить целевые тесты и подтвердить зелёную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  packages/core/metadata/appliedObjects/metadataCatalog/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Проверить типы, весь проект и новые дубли**

Run последовательно из `/Users/nikita/git/nkdk/.worktrees/reference-free-form-xml`:

```bash
pnpm type-check
pnpm test
pnpm duplicates
```

Expected: все команды завершаются с кодом `0`; `pnpm duplicates` не сообщает о новых дублирующихся блоках. Stryker не запускать.

- [ ] **Step 7: Проверить границы diff и создать коммит**

Run:

```bash
git diff --check
git diff -- packages/core/metadata/appliedObjects/metadataCatalog/rules.ts \
  packages/core/metadata/appliedObjects/metadataCatalog/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: изменены только два `implicitValueYAML` и связанные ожидания тестов; форматирование корректно.

Затем:

```bash
git add packages/core/metadata/appliedObjects/metadataCatalog/rules.ts \
  packages/core/metadata/appliedObjects/metadataCatalog/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "fix: :bug: исправить defaults длин справочника" \
  -m "Значения 10 и 30 ошибочно считались неявными YAML-defaults и терялись при round-trip. Defaults 9 и 25 теперь совпадают с XML и конфигуратором."
```

Expected: создан один атомарный commit с production-изменением и его тестами.
