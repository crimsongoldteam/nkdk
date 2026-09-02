# Project-Relative Diagnostic Paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Гарантировать, что постоянные снимки и диагностики Core используют только нормализованные пути относительно корня NKDK-проекта.

**Architecture:** Существующий формат `configuration-index.lmdb` остаётся без изменений. Проверка переносимого DTO запрещает абсолютные пути до записи `project-state.bin`, предметные валидаторы возвращают готовый `projectPath`, а общая граница диагностики отклоняет любого нарушителя договора до MCP.

**Tech Stack:** TypeScript, Vitest, LMDB, Node.js path/fs, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-02-project-relative-diagnostic-paths-design.md`

## Global Constraints

- Пути проекта используют `/`, не являются абсолютными и не содержат сегменты `.` или `..`.
- `Diagnostic.filePath` между слоями Core является путём от корня NKDK-проекта и включает путь компонента.
- Абсолютный путь создаётся только непосредственно перед обращением к файловой системе.
- Формат и версия `configuration-index.lmdb` не меняются.
- Существующие XML-фикстуры не изменяются.
- Незакоммиченное изменение `packages/mcp/README.md` не входит в коммиты этой задачи.

---

### Task 1: Запретить абсолютные пути в переносимом project state

**Files:**
- Modify: `packages/rules/metadata/projectState/fileUpdateValidation.ts`
- Test: `packages/rules/metadata/projectState/fileUpdate.test.ts`

**Interfaces:**
- Consumes: `parseProjectPath(input: string, options?: ProjectPathOptions): string` из `projectDefinition/path.ts`.
- Produces: усиленный `assertProjectStateFileUpdateBatch`, который проверяет `projectPath`, `componentPath`, `workingProjectPath`, `itemProjectPath` и `ownerProjectPath` как нормализованные относительные пути.

- [ ] **Step 1: Расширить существующие проверки DTO падающими случаями**

Добавить к существующим табличным проверкам случаи `C:\\temp\\file.yaml`, `/tmp/file.yaml`, `../file.yaml`, `cf/../file.yaml` для `projectPath`; отдельным случаем заменить `structuredDocuments[0].workingProjectPath` на абсолютный путь. Каждый случай должен ожидать сообщение с точным именем поля и требованием нормализованного относительного пути.

```ts
expect(() => assertProjectStateFileUpdateBatch(batchWithProjectPath(value)))
  .toThrow("updates[0].projectPath должен быть нормализованным относительным путём")

expect(() => assertProjectStateFileUpdateBatch(batchWithWorkingProjectPath("C:\\temp\\Форма.yaml")))
  .toThrow("workingProjectPath должен быть нормализованным относительным путём")
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --dir packages/rules exec vitest run metadata/projectState/fileUpdate.test.ts --project core-metadata`

Expected: FAIL, потому что `assertIdentity` и `workingProjectPath` сейчас проверяются только как строки.

- [ ] **Step 3: Применить единый разбор пути ко всем сохраняемым полям**

Переиспользовать одну функцию, которая вызывает `parseProjectPath`, требует неизменности нормализованного результата и при ошибке сохраняет текущее предметное сообщение:

```ts
function assertRelativeProjectPath(value: unknown, path: string): void {
  assertString(value, path)
  try {
    if (parseProjectPath(value) !== value) throw new Error("not normalized")
  } catch {
    throw new Error(`${path} должен быть нормализованным относительным путём`)
  }
}
```

Вызвать её для `projectPath`, `componentPath`, `workingProjectPath`, `itemProjectPath` и `ownerProjectPath`. Поле `dependencies` не проверять этим правилом: оно содержит логические ключи зависимостей, а не пути. Не изменять типы DTO и двоичный формат.

- [ ] **Step 4: Запустить целевой тест**

Run: `pnpm --dir packages/rules exec vitest run metadata/projectState/fileUpdate.test.ts --project core-metadata`

Expected: PASS.

- [ ] **Step 5: Проверить новые дубли слоя**

Run: `pnpm duplicates -- --base 173eaf374e6892f4cb9faea9b6121ac38ee888a6`

Expected: новых дублей нет.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/rules/metadata/projectState/fileUpdateValidation.ts packages/rules/metadata/projectState/fileUpdate.test.ts
git commit -m "fix: :bug: запретить абсолютные пути в project state"
```

### Task 2: Вернуть относительные пути из структурных валидаторов

**Files:**
- Modify: `packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateValidation.ts`
- Test: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStateValidation.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/structureValidation.ts`
- Test: `packages/rules/metadata/appliedObjects/configurationExtension/structureValidation.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/historyValidation.ts`
- Test: `packages/rules/metadata/appliedObjects/configurationExtension/historyValidation.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/collectionStateValidation.ts`

**Interfaces:**
- Consumes: `ProjectStateStructuredDocumentFact.projectPath`, уже включающий путь компонента.
- Produces: все `ProjectStateStructuredDocumentValidator` возвращают `Diagnostic.filePath` в формате `cfe/Имя/.../Файл.yaml`.

- [ ] **Step 1: Усилить существующие тесты наблюдаемого результата**

В каждом наборе тестов, который уже проверяет предметную ошибку, дополнительно ожидать относительный путь. Для формы:

```ts
expect(diagnostics).toContainEqual(expect.objectContaining({
  filePath: "cfe/Расширение/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
  source: "cross-file",
}))
```

Для обработчиков свойств, структуры, истории и коллекций использовать их существующий `fact.projectPath`; не создавать отдельные тесты, если договор можно усилить в текущем тесте.

- [ ] **Step 2: Запустить целевые тесты и подтвердить падение**

Run: `pnpm --dir packages/rules exec vitest run metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts metadata/appliedObjects/configurationExtension/propertyStateValidation.test.ts metadata/appliedObjects/configurationExtension/structureValidation.test.ts metadata/appliedObjects/configurationExtension/historyValidation.test.ts --project core-metadata`

Expected: FAIL с абсолютными фактическими `filePath`.

- [ ] **Step 3: Удалить построение абсолютных путей из диагностик**

Заменить значения вида:

```ts
filePath: join(params.projectDir, ...fact.projectPath.split("/"))
```

на:

```ts
filePath: fact.projectPath
```

В `borrowedFormValidation.ts` использовать `first.projectPath` и удалить локальный `absolutePath`. `projectDir` оставить только там, где он нужен для чтения файлов или разрешения метаданных.

- [ ] **Step 4: Запустить целевые тесты**

Run: команда из Step 2.

Expected: PASS, тексты, уровни и YAML-пути диагностик не изменились.

- [ ] **Step 5: Проверить новые дубли слоя**

Run: `pnpm duplicates -- --base 173eaf374e6892f4cb9faea9b6121ac38ee888a6`

Expected: новых дублей нет.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.ts packages/rules/metadata/forms/clientApplicationForm/borrowedFormValidation.test.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStateValidation.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStateValidation.test.ts packages/rules/metadata/appliedObjects/configurationExtension/structureValidation.ts packages/rules/metadata/appliedObjects/configurationExtension/structureValidation.test.ts packages/rules/metadata/appliedObjects/configurationExtension/historyValidation.ts packages/rules/metadata/appliedObjects/configurationExtension/historyValidation.test.ts packages/rules/metadata/appliedObjects/configurationExtension/collectionStateValidation.ts
git commit -m "fix: :bug: возвращать относительные пути диагностик"
```

### Task 3: Защитить общую границу диагностики

**Files:**
- Create: `packages/rules/metadata/projectState/diagnosticPaths.ts`
- Test: `packages/rules/metadata/projectState/diagnosticPaths.test.ts`
- Modify: `packages/rules/metadata/validation/projectStateDependencyValidation.ts`
- Test: `packages/rules/metadata/validation/projectStateDependencyValidation.test.ts`
- Modify: `packages/rules/metadata/projectState/binary/diagnosticBatches.ts`
- Test: `packages/rules/metadata/projectState/binary/diagnosticBatches.test.ts`

**Interfaces:**
- Produces: `assertProjectDiagnosticPaths(diagnostics: readonly Diagnostic[], boundary: string): readonly Diagnostic[]`.
- Consumes: `parseProjectPath` и все результаты `ProjectStateDependencyValidator`.

- [ ] **Step 1: Написать падающий unit-тест общей проверки**

```ts
expect(() => assertProjectDiagnosticPaths([
  { filePath: "C:\\temp\\Форма.yaml", line: 1, col: 1, severity: "error", source: "cross-file", message: "Ошибка" },
], "validateBorrowedClientApplicationForms"))
  .toThrow('validateBorrowedClientApplicationForms вернул недопустимый путь диагностики "C:\\temp\\Форма.yaml"')
```

Также проверить, что `cfe/Расширение/Форма.yaml` возвращается без копирования и изменения.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --dir packages/rules exec vitest run metadata/projectState/diagnosticPaths.test.ts --project core-metadata`

Expected: FAIL, модуль отсутствует.

- [ ] **Step 3: Реализовать строгую проверку пути**

Создать `assertProjectDiagnosticPaths`, которая вызывает `parseProjectPath`, требует равенства нормализованному значению и не преобразует ошибочный путь молча:

```ts
export function assertProjectDiagnosticPaths(
  diagnostics: readonly Diagnostic[],
  boundary: string,
): readonly Diagnostic[] {
  for (const diagnostic of diagnostics) {
    try {
      if (parseProjectPath(diagnostic.filePath) !== diagnostic.filePath) throw new Error("not normalized")
    } catch {
      throw new Error(`${boundary} вернул недопустимый путь диагностики ${JSON.stringify(diagnostic.filePath)}`)
    }
  }
  return diagnostics
}
```

- [ ] **Step 4: Добавить падающие проверки границ**

В `projectStateDependencyValidation.test.ts` передать именованный структурный валидатор, возвращающий абсолютный путь, и ожидать имя валидатора в ошибке. В `diagnosticBatches.test.ts` передать абсолютный путь из другого метода `ProjectStateDependencyValidator` и ожидать ошибку общей границы.

- [ ] **Step 5: Подключить проверку к обеим границам**

В `createProjectStateDependencyValidator` проверять результат каждого структурного валидатора отдельно с `validator.name`. В `validateSnapshotDependencyDiagnostics` собрать итоговый массив в переменную и вернуть его через `assertProjectDiagnosticPaths(diagnostics, "ProjectState dependency validation")`.

- [ ] **Step 6: Запустить целевые тесты**

Run: `pnpm --dir packages/rules exec vitest run metadata/projectState/diagnosticPaths.test.ts metadata/validation/projectStateDependencyValidation.test.ts metadata/projectState/binary/diagnosticBatches.test.ts --project core-metadata`

Expected: PASS.

- [ ] **Step 7: Проверить новые дубли слоя**

Run: `pnpm duplicates -- --base 173eaf374e6892f4cb9faea9b6121ac38ee888a6`

Expected: новых дублей нет.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/rules/metadata/projectState/diagnosticPaths.ts packages/rules/metadata/projectState/diagnosticPaths.test.ts packages/rules/metadata/validation/projectStateDependencyValidation.ts packages/rules/metadata/validation/projectStateDependencyValidation.test.ts packages/rules/metadata/projectState/binary/diagnosticBatches.ts packages/rules/metadata/projectState/binary/diagnosticBatches.test.ts
git commit -m "fix: :bug: проверить пути диагностик project state"
```

### Task 4: Доказать переносимость снимков и закрепить архитектуру

**Files:**
- Modify: `packages/runtime/metadata/configurationIndex/store.integration.test.ts`
- Modify: `packages/rules/metadata/projectState/binary/persistence.integration.test.ts`
- Modify: `.agents/architecture.md`

**Interfaces:**
- Consumes: `openConfigurationIndexStore`, `configurationIndexStoreDescriptor`, двоичный builder/reader project state.
- Produces: регрессионные проверки отсутствия связи снимков с каталогом создания и документированное правило путей.

- [ ] **Step 1: Добавить интеграционный тест переноса LMDB**

Создать два временных корня. В первом записать и закрыть снимок с ключом `Справочник/Товары/Свойства.yaml`, перенести `configuration-index.lmdb` в путь descriptor второго корня и открыть его только для чтения:

```ts
expect(reopened.readHashes()).toEqual([
  { projectPath: "Справочник/Товары/Свойства.yaml", contentHash: 1n },
])
expect(reopened.getBlocks(["Справочник/Товары/Свойства.yaml"]))
  .toEqual(expect.any(Map))
```

Закрывать LMDB в `finally` до удаления временных каталогов.

- [ ] **Step 2: Добавить интеграционный тест переносимости project state**

Собрать снимок с относительным `projectPath`, сохранить и открыть его после переноса в другой временный корень. Проверить, что `filePaths()` и прочитанная диагностика содержат только `cf/Объект.yaml` и не содержат первый временный корень.

- [ ] **Step 3: Запустить интеграционные тесты вне песочницы**

Run: `pnpm --dir packages/runtime exec vitest run metadata/configurationIndex/store.integration.test.ts --project integration`

Run: `pnpm --dir packages/rules exec vitest run metadata/projectState/binary/persistence.integration.test.ts --project integration`

Expected: PASS; после закрытия тестов временные каталоги удаляются без EPERM.

- [ ] **Step 4: Обновить архитектурный договор**

В `.agents/architecture.md` в разделе «Прочитать и изменить снимок компонента» добавить абзац:

```md
Постоянные снимки и межслойные диагностики используют только нормализованные
пути относительно корня NKDK-проекта. Абсолютные пути создаются на границе
файловой системы и не сохраняются в ConfigurationIndex или ProjectState.
```

- [ ] **Step 5: Проверить новые дубли слоя**

Run: `pnpm duplicates -- --base 173eaf374e6892f4cb9faea9b6121ac38ee888a6`

Expected: новых дублей нет.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/runtime/metadata/configurationIndex/store.integration.test.ts packages/rules/metadata/projectState/binary/persistence.integration.test.ts .agents/architecture.md
git commit -m "test: :white_check_mark: проверить переносимость снимков"
```

### Task 5: Полная проверка и практическое подтверждение

**Files:**
- No production files expected.

**Interfaces:**
- Consumes: завершённые Tasks 1–4.
- Produces: проверенное состояние ветки и подтверждение исправленной диагностики `sed_nkdk`.

- [ ] **Step 1: Запустить проверку типов**

Run: `pnpm type-check`

Expected: PASS.

- [ ] **Step 2: Запустить все тесты вне песочницы**

Run: `pnpm test`

Expected: PASS во всех пакетах.

- [ ] **Step 3: Запустить архитектурные проверки**

Run: `pnpm test:architecture:rules`

Expected: PASS.

Run: `pnpm test:architecture`

Expected: PASS.

- [ ] **Step 4: Выполнить итоговую проверку дублей**

Run: `pnpm duplicates -- --base 173eaf374e6892f4cb9faea9b6121ac38ee888a6`

Expected: новых дублей нет.

- [ ] **Step 5: Проверить чистоту реализации**

Run: `git status --short`

Expected: остаётся только прежнее незакоммиченное изменение `packages/mcp/README.md`; файлов реализации вне коммитов нет.

- [ ] **Step 6: Проверить реальную validation без запуска 1С**

После сборки актуального MCP запустить `validate_project` для `C:\git\sed_nkdk`. Операция не должна возвращать `Core вернул путь диагностики вне NKDK-проекта`; предметные диагностики должны содержать относительные пути `cfe/дкз/...`.

- [ ] **Step 7: Передать полный результат независимому ревью**

Ревьюер получает путь спецификации, путь плана, базу `173eaf374e6892f4cb9faea9b6121ac38ee888a6`, worktree и обязан проверить все изменения после базы, включая незакоммиченные файлы, по договору `executing-plans-with-review`.
