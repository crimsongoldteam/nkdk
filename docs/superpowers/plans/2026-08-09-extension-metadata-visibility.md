# Строгая видимость метаданных расширения — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Запретить dependency validation расширения разрешать цели и владельцев через `cf`, сохранив отдельную проверку `cf` только для уточнения диагностики.

**Architecture:** ProjectState query возвращает только вклад запрошенного `componentPath`; validation при неуспехе может выполнить второй точный запрос к `cf`, но не передаёт его результат resolver. Политика остаётся нейтральной: чтение ProjectState сравнивает пути компонентов на равенство и не знает предметных типов метаданных.

**Tech Stack:** TypeScript, Vitest, двоичный ProjectState, metadata dependency validation.

## Global Constraints

- Источник требований: `docs/superpowers/specs/2026-08-09-extension-metadata-visibility-design.md`.
- Не изменять XML-фикстуры.
- Не добавлять частные условия по `itemType` в `projectState` и нейтральные validation-модули.
- Не менять правила BSL и не проверять полноту цепочки владельцев.
- После каждого завершённого слоя запускать `pnpm duplicates -- --base 5774cca5fe5ec396cd4753c23fe0d6b2a691bd14`.

---

## Task 1: Зафиксировать строгую видимость на границе ProjectState query

**Files:**

- Modify: `packages/core/metadata/projectState/binary/readSession.test.ts`
- Modify: `packages/core/metadata/projectState/storeContract.ts`
- Modify: `packages/core/metadata/projectState/binary/readSession.ts`

- [ ] В `readSession.test.ts` изменить договор теста `соблюдает видимость cf и собственного расширения`: `Catalog.Base`, существующий только в `cf`, должен возвращать `missing` для запроса `cfe/Цены`; собственная цель остаётся `found`, соседнее расширение — `missing`.
- [ ] В общем `storeContract.ts` заменить ожидания резервного чтения `cf` для `resolveTargets`, `readOwners`, `readDependencyInputs`, `readDependencyOwnerInputs`, `readOwnerRefPage` и `findReferences` на отсутствие результата. Добавить случай, где одноимённая цель есть и в `cf`, и в `cfe/Цены`: должен выбираться только вклад `cfe/Цены`.
- [ ] Запустить тесты и убедиться, что они падают на текущей подстановке `cf`:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/readSession.test.ts metadata/projectState/binary/store.test.ts
```

Ожидается: несовпадение `found`/`missing` и лишние владельцы `cf`.

- [ ] В `readSession.ts` удалить резервный `snapshot.lookupTarget("cf", ...)`, выбирать владельца только из файла с `candidateComponent === componentPath`, обходить в `findReferences` только файлы этого компонента и возвращать в `readOwnerRefPage` только владельцев этого компонента. Удалить локальную функцию `isVisible`, если после изменений она не используется.
- [ ] Повторить команду; ожидается успешное выполнение.
- [ ] Выполнить `pnpm duplicates -- --base 5774cca5fe5ec396cd4753c23fe0d6b2a691bd14`.
- [ ] Создать коммит:

```bash
git add packages/core/metadata/projectState/binary/readSession.ts packages/core/metadata/projectState/binary/readSession.test.ts packages/core/metadata/projectState/storeContract.ts
git commit -m "fix: :bug: ограничить чтение project state компонентом"
```

## Task 2: Удалить слоистую модель из validation-помощников и тестового графа

**Files:**

- Modify: `packages/core/metadata/validation/componentVisibility.ts`
- Modify: `packages/core/metadata/validation/componentVisibility.test.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.test.ts`

- [ ] Изменить тест `validationComponentLayers`: для `cfe/Продажи` результатом должен быть только `['cfe/Продажи']`; проверку недопустимого `cfe` сохранить.
- [ ] В тестовых помощниках `graphDependencyDiagnostics`, `createOwnerCacheFromGraphForTests` и соседних функциях удалить построение слоя `cf` для запроса расширения. Обновить сравнительные тесты так, чтобы граф и ProjectState одинаково отклоняли владельца или поле, существующие только в `cf`.
- [ ] Добавить отдельные случаи: объект представлен в `cfe/X`, пользовательский реквизит только в `cf` недоступен; тот же реквизит в `cfe/X` доступен; стандартный реквизит явно представленного объекта остаётся доступен.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/componentVisibility.test.ts metadata/validation/projectStateDependencyValidation.test.ts
```

Ожидается падение теста слоёв до изменения реализации.

- [ ] Изменить `validationComponentLayers` так, чтобы допустимый путь всегда возвращал только себя. Не переносить распознавание `cfe` в ProjectState.
- [ ] Повторить тесты и проверку дубликатов.
- [ ] Создать коммит:

```bash
git add packages/core/metadata/validation/componentVisibility.ts packages/core/metadata/validation/componentVisibility.test.ts packages/core/metadata/validation/projectStateDependencyValidation.test.ts
git commit -m "refactor: :recycle: убрать базовый слой из validation"
```

## Task 3: Уточнять диагностику точным чтением `cf`

**Files:**

- Modify: `packages/core/metadata/validation/projectReferenceIndex.ts`
- Modify: `packages/core/metadata/validation/projectReferenceIndex.test.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.test.ts`

- [ ] Добавить в `projectReferenceIndex.ts` функцию `referenceNotIncludedInExtensionResult(reference)`, возвращающую `notFound` и диагностику на исходных `filePath`/`yamlPath` с сообщением `Ссылка "<canonical>" не включена в расширение`.
- [ ] Покрыть helper тестом для объектной и подчинённой ссылки; проверить сохранение YAML-пути.
- [ ] В `validateProjectStateReferenceBatch` после первичного строгого `resolveTargets` собрать только `missing`-запросы из `cfe/<Имя>` и выполнить вторую пачку `resolveTargets` с `componentPath: "cf"`. Использовать её только для выбора сообщения: `found` означает `referenceNotIncludedInExtensionResult`, `missing` сохраняет обычный `unresolvedProjectReferenceResult`, `ambiguous` не считается доказательством точного наличия.
- [ ] Добавить интеграционные тесты: цель только в `cf` даёт новое сообщение; цели нигде нет — старое; цель в `cfe/X` проходит; результат уточняющего запроса не используется проверкой фильтра или DataPath.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectReferenceIndex.test.ts metadata/validation/projectStateDependencyValidation.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/validation/projectReferenceIndex.ts packages/core/metadata/validation/projectReferenceIndex.test.ts packages/core/metadata/validation/projectStateDependencyValidation.ts packages/core/metadata/validation/projectStateDependencyValidation.test.ts
git commit -m "feat: :sparkles: уточнить отсутствующее заимствование"
```

## Task 4: Проверить публичную validation расширения

**Files:**

- Modify: `packages/core/metadata/project/validateProject.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`

- [ ] Добавить проектный тест с `cf/Справочник/Номенклатура` и ссылкой из `cfe/X`, но без представления справочника в расширении; `validateProject` должен вернуть ошибку включения в расширение.
- [ ] В том же тесте последовательно добавить минимальный объект в `cfe/X`, затем пользовательский реквизит: объектная ссылка должна стать допустимой раньше ссылки на реквизит.
- [ ] Обновить ожидаемую диагностику XML-import расширения: базовая конфигурация нужна для готовности и уточнения сообщений, но не делает свои metadata targets доступными.
- [ ] Запустить:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/validateProject.test.ts metadata/importFromXml/importConfigurationExtension.test.ts
```

- [ ] Выполнить проверку дубликатов и создать коммит:

```bash
git add packages/core/metadata/project/validateProject.test.ts packages/core/metadata/importFromXml/importConfigurationExtension.test.ts
git commit -m "test: :white_check_mark: проверить заимствования расширения"
```

## Task 5: Завершающая проверка слоя

- [ ] Запустить `pnpm --filter @nkdk/core type-check`.
- [ ] Запустить `pnpm --filter @nkdk/core test`.
- [ ] Запустить `pnpm duplicates -- --base 5774cca5fe5ec396cd4753c23fe0d6b2a691bd14`.
- [ ] Не переходить к плану `2026-08-09-borrowed-form-base-yaml.md`, пока все три команды не завершатся успешно.
