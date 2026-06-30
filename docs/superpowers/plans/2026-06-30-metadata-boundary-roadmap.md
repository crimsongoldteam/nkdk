# Metadata Boundary Refactor Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разложить всю спеку `2026-06-28-metadata-layer-boundary-violations-spec.md` на последовательность независимых исполнимых планов.

**Architecture:** Спека затрагивает несколько общих слоёв, поэтому работа идёт серией малых изменений: сначала укрепляется договор регистраций и локальная типизация rules, затем вводятся project/resource descriptors, затем на них переводятся appliedObject sync, metadata-target, project resolver, dataPath и form validation. Финальное удаление центральных TypeScript registry выполняется только после миграции прямых потребителей.

**Tech Stack:** TypeScript 5.9, Vitest, pnpm, TypeBox, существующие `~/metadata/*` aliases, существующие metadata orchestration registries.

---

## Scope Check

Эта дорожная карта не меняет код. Она связывает планы по всей спеке и фиксирует порядок, зависимости и проверки. Каждый план ниже должен выполняться в отдельной ветке или worktree и завершаться зелёным `pnpm test`.

## План Выполнения

1. `docs/superpowers/plans/2026-06-30-metadata-boundary-01-foundation-hardening.md`
   - Исправляет замечания ревью foundation-среза.
   - Делает builders строгими к лишним полям даже при наличии допустимых полей.
   - Нормализует lifecycle `register.ts` и тесты `MetadataLanguage`.

2. `docs/superpowers/plans/2026-06-30-metadata-boundary-02-project-descriptors.md`
   - Вводит регистрации project specs, schema exporters и project resources рядом с объектами.
   - Переводит `specs.ts`, `schemaRegistry.ts`, `resources.ts`, `directoryStructure.ts`, `syncStateFiles.ts` на единый descriptor.
   - Убирает знание `Справочник`/`Документ`/`Перечисление`, `Формы`, `Подсистемы` и schema names из общего `metadata/project`.

3. `docs/superpowers/plans/2026-06-30-metadata-boundary-03-child-files-and-metadata-target.md`
   - Вводит нейтральный `fileChildNamesDescriptor` для `ChildFormNames` и `ChildTemplateNames`.
   - Переводит `syncToXML.ts` и `convertFromXML.ts` на descriptor без проверок `propRule.type`.
   - Вводит `metadataTargetOwner`/resolver договор для owner/root и убирает itemType-specific logic из `metadataTargetString.ts`.

4. `docs/superpowers/plans/2026-06-30-metadata-boundary-04-project-metadata-resolver.md`
   - Разделяет нейтральный `ProjectMetadataResolver` и registered resolvers.
   - Использует project/resource и metadata-target registrations для object paths, member collections, child files, values, style items и common pictures.
   - Убирает из validation hard-coded `Form`, `Template`, `ExternalDataSource`, `StyleItem`, `CommonPicture`, `Enum`, `predefined`.

5. `docs/superpowers/plans/2026-06-30-metadata-boundary-05-datapath-and-form-validation.md`
   - Вводит `DataPathResolverRegistry` по частям: owner kinds, TypeDescription, object fields, standard attributes, virtual fields, table columns, traversal transitions.
   - Делает form traversal нейтральным и переносит form validation/dynamic list warnings/opaque multiple value handling в registered validators.

6. `docs/superpowers/plans/2026-06-30-metadata-boundary-06-final-registry-removal.md`
   - Удаляет центральные `PropertyTypeRegistry` и `MetadataItemTypeRegistry` из `orchestration`.
   - Заменяет оставшиеся потребители на локальный вывод типов из `rules.ts` и runtime-регистрации.
   - Добавляет boundary-tests, запрещающие повторное накопление конкретных imports в общих слоях.

## Зависимости

- План 1 обязателен перед всеми остальными: без строгих builders мы потеряем проверку допустимых полей, найденную на ревью.
- План 2 обязателен перед планом 4: `ProjectMetadataResolver` должен переиспользовать project/resource descriptors, а не заводить второй словарь путей.
- План 3 можно выполнять после плана 2 или параллельно с ним только до части metadata-target. Часть `fileChildNamesDescriptor` зависит от type-rule registry, а не от полного project resolver.
- План 4 зависит от планов 2 и 3, потому что child file lookup и metadata-target owner/root должны быть описаны декларативно до разборки resolver-а.
- План 5 зависит от базовых owner/project registrations из планов 2 и 4, но должен вводить `DataPathResolverRegistry` постепенно.
- План 6 выполняется последним: центральные TypeScript unions удаляются только после того, как `rg` не находит рабочих потребителей, кроме совместимых временных alias.

## Сквозные Проверки

- Перед изменениями в `packages/core/metadata/**` выполнить:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,260p' .agents/knowledge/metadata/INDEX.md || echo "metadata knowledge index is missing"
```

- Перед завершением каждого плана выполнить:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
pnpm --filter @nakidka/core test
pnpm test
```

- После каждого плана проверить, что общие слои не получили новые конкретные знания:

```bash
rg -n "ChildFormNames|ChildTemplateNames|MetadataCatalog|MetadataDocument|MetadataEnumeration|ClientApplicationForm|ExternalDataSource|StyleItem|CommonPicture|Формы|Макеты|Подсистемы" packages/core/metadata/orchestration packages/core/metadata/project packages/core/metadata/validation
```

Expected: совпадения остаются только в разрешённых тестах, в нейтральных именах договоров или в переходных местах, явно закрываемых следующим планом.

## Review Findings Incorporated

- P1 из ревью foundation-среза закрывается в плане 1: builders используют exact-param helper и тестируют `stringRule({ xml: "Name", typeSE: "ObjectBelonging" })` как ошибку компиляции.
- P2 закрывается в плане 1: `metadataLanguage/rules.test.ts` проверяет все свойства `MetadataLanguageRules`, включая `comment`, `languageCode`, `objectBelonging`, `extendedConfigurationObject`.
- P3 закрывается в плане 1: `metadataLanguage/types.ts` использует `import type` для `MetadataLanguageRules`, а `uuid/types.ts` импортирует `BasePropertyRule` напрямую из `~/metadata/orchestration/property/types`.

## Execution Order

- [ ] **Step 1: Выполнить план 1**

Run:

```bash
sed -n '1,260p' docs/superpowers/plans/2026-06-30-metadata-boundary-01-foundation-hardening.md
```

Expected: документ начинается с обязательного заголовка и содержит задачи для исправления review findings.

- [ ] **Step 2: Выполнить план 2**

Run:

```bash
sed -n '1,320p' docs/superpowers/plans/2026-06-30-metadata-boundary-02-project-descriptors.md
```

Expected: документ описывает project registrations и миграцию `metadata/project`.

- [ ] **Step 3: Выполнить план 3**

Run:

```bash
sed -n '1,320p' docs/superpowers/plans/2026-06-30-metadata-boundary-03-child-files-and-metadata-target.md
```

Expected: документ описывает `fileChildNamesDescriptor` и `metadataTargetOwner`.

- [ ] **Step 4: Выполнить план 4**

Run:

```bash
sed -n '1,320p' docs/superpowers/plans/2026-06-30-metadata-boundary-04-project-metadata-resolver.md
```

Expected: документ описывает resolver registrations поверх project/resource и metadata-target договоров.

- [ ] **Step 5: Выполнить план 5**

Run:

```bash
sed -n '1,320p' docs/superpowers/plans/2026-06-30-metadata-boundary-05-datapath-and-form-validation.md
```

Expected: документ описывает staged `DataPathResolverRegistry` и form validation registry.

- [ ] **Step 6: Выполнить план 6**

Run:

```bash
sed -n '1,260p' docs/superpowers/plans/2026-06-30-metadata-boundary-06-final-registry-removal.md
```

Expected: документ описывает финальное удаление центральных registry и boundary-tests.
