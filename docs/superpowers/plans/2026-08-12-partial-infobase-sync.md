# Partial Infobase Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить публичный MCP-инструмент `nkdk.sync_to_infobase`, который формирует частичный ZIP из изменённого YAML-компонента, загружает его в Конфигуратор через агент и публикует снимок компонента только после подтверждённого успеха платформы.

**Architecture:** `@nkdk/rules` остаётся владельцем плана XML, потокового ZIP, снимка-кандидата и сохраняемой фазы передачи. `@nkdk/platform` копирует готовый ZIP в служебный каталог агента, выполняет `load-config-from-files` и классифицирует результат команды. `@nkdk/mcp` читает настройки, последовательно вызывает публичные операции `MetadataRuntime`, управляет переходами передачи и формирует безопасный ответ со ссылкой на `platform.log`.

**Tech Stack:** TypeScript 7, Vitest 4, pnpm, MCP SDK, агент Конфигуратора 1С 8.3.27, SSH-протокол агента, ZIP с `load.lst`.

## Global Constraints

- Работать только в `/Users/nikita/git/nkdk/.worktrees/partial-sync-infobase` на ветке `codex/partial-sync-infobase`.
- Согласованный договор находится в `docs/superpowers/specs/2026-08-12-partial-infobase-sync-design.md`; `.agents/architecture.md` уже описывает целевую архитектуру. Если код потребует отступления, остановиться и сообщить пользователю, а не менять эти документы молча.
- Не изменять существующие XML-фикстуры и не добавлять реальную информационную базу, её копию, временный YAML/XML-проект, ZIP или журналы в репозиторий.
- Первый этап использует только `designer-agent`; не добавлять `operations.sync` в `.nkdk/project.yaml`, автономный сервер, обновление конфигурации базы данных или запуск 1С:Предприятия.
- Не распаковывать ZIP и не вводить скрытый запасной путь: первый реальный эксперимент обязан подтвердить чтение `load.lst` из корня архива.
- Считать штатный отрицательный ответ платформы безопасным для новой попытки. После отправки команды считать отмену, тайм-аут, потерю SSH и некорректный/оборванный ответ неизвестным результатом: сохранить `transferring`, не повторять загрузку и не публиковать снимок.
- MCP не импортирует внутренние файлы `partialSyncToXml` напрямую: все операции идут через `MetadataRuntime` и `CoreApi`.
- Сохранять существующий потоковый путь YAML worker → XML-документы → ZIP; не собирать все XML-документы в памяти и не передавать их платформе напрямую из worker.
- Секреты подключения не попадают в команду, MCP-ответ, `platform.log` и `/Out`-фрагмент. Журнал создаётся с существующим договором прав `0600`.
- Реальную проверку выполнять только с переменными окружения `NKDK_TEST_INFOBASE_DIR` и `NKDK_TEST_BACKUP_ROOT`, значения которых задаются вне репозитория. Перед первой записью создать проверенную копию каталога базы; восстановление допускается только при проблеме.
- После каждого законченного слоя запускать `pnpm duplicates -- --base origin/develop`.
- Перед завершением обязательны `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules`, `pnpm test:architecture` и финальная проверка дублей. Если холодный полный прогон снова заденет только временные пороги platform-тестов, выполнить три последовательных прогона по правилу `.agents/testing.md` и оценивать медиану, не ослабляя пороги по одному запуску.

---

### Task 1: Зафиксировать команду загрузки и известность её результата

**Files:**
- Modify: `packages/platform/src/sessions/commands.ts`
- Modify: `packages/platform/src/sessions/commands.test.ts`
- Modify: `packages/platform/src/sessions/runtime.ts`
- Modify: `packages/platform/src/sessions/errors.ts`
- Modify: `packages/platform/src/sessions/sshProtocol.ts`
- Modify: `packages/platform/src/sessions/sshProtocol.test.ts`
- Modify: `packages/platform/src/sessions/ssh2Transport.ts`
- Modify: `packages/platform/src/sessions/ssh2Transport.test.ts`

**Interfaces:**
- Produces: `buildLoadPartialConfigurationCommand({ archivePath, extensionName? })`.
- Produces: внутренний признак ответа команды `"rejected" | "unknown"`; публичный код неизвестного результата остаётся `delivery_outcome_unknown`.
- Extends: `SshShell` уведомлением о закрытии, чтобы ожидающая команда не висела до стороннего тайм-аута.

- [ ] **Step 1: Написать падающие тесты построителя команды**

Добавить случаи основной конфигурации, расширения и управляющих символов:

```ts
expect(buildLoadPartialConfigurationCommand({ archivePath: "staging/package.zip" })).toBe(
  'config load-config-from-files --archive="staging/package.zip" --list-file="load.lst" --format=hierarchical --partial',
)
expect(buildLoadPartialConfigurationCommand({
  archivePath: "staging/package.zip",
  extensionName: "Расширение",
})).toContain('--extension="Расширение"')
```

Проверить, что `archivePath` и `extensionName` используют существующий `interactiveValue` и отклоняют `\0`, `\n`, `\r`.

- [ ] **Step 2: Написать падающие проверки протокола**

Расширить сценарии `sshProtocol.test.ts`:

- JSON-сообщение `type=error` после отправки команды даёт известный отказ;
- закрытие SSH, тайм-аут, отмена или некорректный ответ после отправки команды дают неизвестный результат;
- отменённый заранее `AbortSignal` не отправляет команду и не помечается неизвестным результатом.

Не определять известность по тексту ошибки. Добавить в `PlatformSessionError` структурированное необязательное поле отдельно от сведений о журнале, например:

```ts
type PlatformCommandOutcome = "rejected" | "unknown"

type PlatformSessionErrorOptions = ErrorOptions & {
  details?: PlatformFailureDetails
  commandOutcome?: PlatformCommandOutcome
}
```

`sshProtocol` устанавливает `rejected` только при полном JSON-ответе `error`/`cancel`; закрытие канала, повреждённый ответ и истечение ожидания после записи команды устанавливают `unknown`. `platformFailure` обязан перенести это поле в обёрнутую ошибку вместе с отдельными `stage`, `mode` и `logPath`.

- [ ] **Step 3: Запустить новые тесты и подтвердить RED**

Run:

```bash
pnpm exec vitest run --config packages/platform/vitest.config.ts packages/platform/src/sessions/commands.test.ts packages/platform/src/sessions/sshProtocol.test.ts packages/platform/src/sessions/ssh2Transport.test.ts
```

Expected: новые проверки падают, потому что команды загрузки, уведомления о закрытии и структурированной известности результата ещё нет.

- [ ] **Step 4: Реализовать минимальный договор протокола**

Добавить построитель команды. Расширить `SshShell` методом подписки на закрытие; транспорт обязан вызвать слушателей ровно один раз. В `PlatformCommandProtocol` хранить факт успешной записи команды и завершать ожидающий обмен структурированной ошибкой при закрытии.

Не менять договоры выгрузки и списка расширений: новое поле необязательно и используется загрузкой частичного архива.

- [ ] **Step 5: Подтвердить GREEN и проверить слой**

Run:

```bash
pnpm exec vitest run --config packages/platform/vitest.config.ts packages/platform/src/sessions/commands.test.ts packages/platform/src/sessions/sshProtocol.test.ts packages/platform/src/sessions/ssh2Transport.test.ts
pnpm duplicates -- --base origin/develop
```

Expected: PASS; новых дублей нет.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/platform/src/sessions/commands.ts packages/platform/src/sessions/commands.test.ts packages/platform/src/sessions/runtime.ts packages/platform/src/sessions/errors.ts packages/platform/src/sessions/sshProtocol.ts packages/platform/src/sessions/sshProtocol.test.ts packages/platform/src/sessions/ssh2Transport.ts packages/platform/src/sessions/ssh2Transport.test.ts
git commit -m "feat: :sparkles: описать результат команды агента"
```

---

### Task 2: Загружать готовый ZIP через сессию агента и менеджер платформы

**Files:**
- Modify: `packages/platform/src/sessions/types.ts`
- Modify: `packages/platform/src/sessions/designerAgent.ts`
- Modify: `packages/platform/src/sessions/designerAgent.test.ts`
- Modify: `packages/platform/src/sessions/manager.ts`
- Modify: `packages/platform/src/sessions/manager.test.ts`
- Modify: `packages/platform/src/sessions/runtime.ts`
- Modify: `packages/platform/src/sessions/nodeRuntime.ts`
- Modify: `packages/platform/index.ts`

**Interfaces:**
- Produces: `PlatformSession.loadPartialConfiguration(...)`.
- Produces: `PlatformSessionManager.loadPartialConfiguration(params)`.
- Consumes: готовый ZIP, необязательное имя расширения, настройки подключения, `platform.log`, `AbortSignal`.

- [ ] **Step 1: Написать падающий тест сессии агента**

В существующей поддельной сессии проверить:

- исходный архив канонизируется и должен находиться внутри `projectDir`;
- ZIP копируется, а не перемещается, в уникальный каталог внутри `userServiceDir`;
- команда получает относительный путь архива и `load.lst`;
- `/Out` читается от сохранённой позиции;
- служебная копия удаляется после успеха и известного отказа;
- ошибка очистки после подтверждённого успеха возвращается предупреждением, а не отменяет успех;
- после отправленной отмены, тайм-аута или обрыва возвращается `delivery_outcome_unknown` с этапом `configuration-load`;
- штатный `type=error` остаётся `platform_command_failed` и имеет известный отказ.

Предлагаемый договор:

```ts
type LoadPartialConfigurationParams = NormalizedPlatformConnectionSettings & {
  projectDir: string
  archivePath: string
  logPath: string
  extensionName?: string
  signal?: AbortSignal
}

type LoadPartialConfigurationResult = {
  mode: "designer-agent"
  reusedConnection: boolean
  warnings: readonly string[]
}
```

- [ ] **Step 2: Написать падающий тест менеджера**

Расширить `manager.test.ts` одним самостоятельным договором: загрузка использует ту же очередь и сохранённую сессию проекта, всегда создаёт `designer-agent`, пишет начало/конец `configuration-load`, передаёт секреты только очистителю журнала и возвращает `reusedConnection`.

Проверить замену ранее сохранённой `standalone-server`-сессии агентной через существующий отпечаток.

- [ ] **Step 3: Запустить тесты и подтвердить RED**

Run:

```bash
pnpm exec vitest run --config packages/platform/vitest.config.ts packages/platform/src/sessions/designerAgent.test.ts packages/platform/src/sessions/manager.test.ts
```

Expected: FAIL из-за отсутствующих методов и копирования ZIP.

- [ ] **Step 4: Реализовать staging и загрузку**

Добавить `copyFile` в `SessionFileSystem`, узкую зависимость `DesignerAgentDependencies.fileSystem` и `nodeRuntime`. Создавать каталог с уникальным идентификатором, например `.nkdk-load/<attempt-id>`, копировать туда `package.zip`, выполнять построенную команду и удалять только этот каталог.

Фаза `configuration-load` добавляется в `PlatformFailureStage`. `agentFailure` прикладывает новый фрагмент `/Out`, сохраняет `commandOutcome` и скрывает секреты существующим `PlatformOperationLog`.

Менеджер вызывает общий `withSession`, но принудительно задаёт `mode: "designer-agent"`; новая операция не принимает режим снаружи.

- [ ] **Step 5: Подтвердить GREEN и отсутствие регрессий platform**

Run:

```bash
pnpm exec vitest run --config packages/platform/vitest.config.ts packages/platform/src/sessions/designerAgent.test.ts packages/platform/src/sessions/manager.test.ts packages/platform/src/sessions/operationLog.test.ts
pnpm --filter @nkdk/platform test
pnpm duplicates -- --base origin/develop
```

Expected: PASS; существующие выгрузка, список расширений, отмена и повторное использование соединения не изменились.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/platform/src/sessions/types.ts packages/platform/src/sessions/designerAgent.ts packages/platform/src/sessions/designerAgent.test.ts packages/platform/src/sessions/manager.ts packages/platform/src/sessions/manager.test.ts packages/platform/src/sessions/runtime.ts packages/platform/src/sessions/nodeRuntime.ts packages/platform/index.ts
git commit -m "feat: :sparkles: загружать частичный ZIP агентом"
```

---

### Task 3: Подтвердить чтение `load.lst` непосредственно из ZIP

**Files:**
- No repository changes.
- External only: резервная копия информационной базы, временный проект, ZIP, `platform.log` под системным временным каталогом.

**Gate:** Дальнейшая реализация разрешена только после подтверждённого успеха команды с `--archive` и `--list-file="load.lst"` без распаковки.

- [ ] **Step 1: Проверить внешние пути перед копированием**

В отдельной оболочке задать `NKDK_TEST_INFOBASE_DIR` и `NKDK_TEST_BACKUP_ROOT`. Проверить, что оба значения непустые, путь базы существует и не находится внутри worktree. Создать уникальный каталог командой `mktemp -d` под разрешённым корнем резервных копий.

- [ ] **Step 2: Создать проверенную резервную копию**

Скопировать каталог базы средствами macOS без изменения источника. Сравнить перечень файлов и суммарные размеры; сохранить путь копии только в журнале текущей задачи, не в репозитории.

- [ ] **Step 3: Подготовить минимальный внешний проект и пакет**

Во внешнем временном каталоге импортировать текущую конфигурацию штатным `nkdk.import_from_infobase`, изменить YAML тестового реквизита либо подготовить минимальное безопасное изменение, затем вызвать внутренний тестовый вход платформенного менеджера для уже сформированного ZIP.

Не добавлять временную команду в публичный MCP. Допустим одноразовый сценарий через `pnpm --filter @nkdk/platform exec tsx` из stdin/внешнего файла под `/private/tmp`, использующий публичный `createPlatformSessionManager`.

- [ ] **Step 4: Выполнить команду и проверить результат в Конфигураторе**

Подтвердить по `platform.log`, ответу SSH и повторной XML-выгрузке, что агент прочитал `load.lst` из ZIP и применил только перечисленные документы. Внешний временный каталог и журнал сохранить до завершения всей задачи.

- [ ] **Step 5: Применить жёсткую развилку**

- При успехе: записать в заметках задачи версию платформы и точную успешно выполненную команду; продолжить Task 4.
- При штатном отказе из-за расположения `load.lst`: остановить реализацию, не распаковывать ZIP и запросить пересмотр согласованного дизайна.
- При неизвестном результате: не повторять команду; проверить базу через Конфигуратор и при проблеме восстановить проверенную резервную копию.

---

### Task 4: Добавить сохраняемые фазы передачи в `@nkdk/rules`

**Files:**
- Modify: `packages/rules/metadata/partialSyncToXml/pendingStore.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/pendingStore.test.ts`
- Add: `packages/rules/metadata/partialSyncToXml/deliveryState.ts`
- Add: `packages/rules/metadata/partialSyncToXml/deliveryState.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/preparePartialXmlSyncPackage.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/finalizePartialXmlSyncPackage.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/finalizePartialXmlSyncPackage.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/index.ts`

**Interfaces:**
- Produces: нормализованное `PendingPartialXmlSyncStateV2` с `delivery`.
- Produces: чтение состояния, переход `prepared → transferring → applied`, возврат `transferring → prepared` после известного отказа.
- Restricts: `finalizePartialXmlSyncPackage` принимает только `applied` и возвращает путь опубликованного `configuration-index.bin` вместе со статусом.

- [ ] **Step 1: Написать проверки совместимости и переходов**

В `pendingStore.test.ts` добавить:

- версия 1 читается как версия 2 с `{ status: "prepared" }`;
- новые записи всегда имеют `version: 2`;
- неизвестная версия и повреждённая доставка отклоняются без очистки файлов;
- `operationLogProjectPath` обязан оставаться внутри проекта и указывать на `.nkdk/tmp/sync-to-infobase/.../platform.log`;
- переход сохраняет те же package/hash/snapshot/migration поля и атомарно меняет только `delivery`.

В `deliveryState.test.ts` покрыть только разрешённые переходы:

```ts
await markPartialSyncTransferring({ projectDir, componentPath, packageId, attemptId, operationLogProjectPath })
await markPartialSyncPreparedAfterRejection({ projectDir, componentPath, packageId, attemptId })
await markPartialSyncApplied({ projectDir, componentPath, packageId, attemptId })
```

Переход с неверным `packageId`/`attemptId` или из неверной фазы должен падать, не перезаписывая `pending.json`.

- [ ] **Step 2: Написать проверки подготовки и фиксации**

- `preparePartialXmlSyncPackage` создаёт v2 `prepared`.
- `finalizePartialXmlSyncPackage` отклоняет `prepared` и `transferring`.
- `applied` публикуется как прежде; повтор после уже записанного снимка возвращает `alreadyPublished` и очищает ожидающие файлы.
- оба успешных варианта finalize возвращают `configurationIndexPath`, вычисленный владельцем снимка в `@nkdk/rules`.

- [ ] **Step 3: Запустить тесты и подтвердить RED**

Run:

```bash
pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/partialSyncToXml/pendingStore.test.ts packages/rules/metadata/partialSyncToXml/deliveryState.test.ts packages/rules/metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts packages/rules/metadata/partialSyncToXml/finalizePartialXmlSyncPackage.test.ts
```

Expected: FAIL, потому что формат v2 и переходы ещё отсутствуют.

- [ ] **Step 4: Реализовать v2 без дублирования проверки состояния**

Сосредоточить разбор и атомарную запись в `pendingStore.ts`; `deliveryState.ts` использует публичные операции хранилища. Не позволять MCP записывать `pending.json` напрямую.

Предлагаемый тип:

```ts
type PartialSyncDelivery =
  | { readonly status: "prepared" }
  | { readonly status: "transferring"; readonly attemptId: string; readonly operationLogProjectPath: string }
  | { readonly status: "applied"; readonly attemptId: string; readonly operationLogProjectPath: string }
```

- [ ] **Step 5: Подтвердить GREEN и проверить весь узел partialSyncToXml**

Run:

```bash
pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/partialSyncToXml
pnpm duplicates -- --base origin/develop
```

Expected: PASS; потоковая запись ZIP и существующая фиксация снимка сохранены.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/rules/metadata/partialSyncToXml
git commit -m "feat: :sparkles: сохранять фазу частичной передачи"
```

---

### Task 5: Провести операции частичной синхронизации через `MetadataRuntime`

**Files:**
- Modify: `packages/rules/metadata/runtime/contracts.ts`
- Modify: `packages/rules/metadata/runtime/createMetadataRuntime.ts`
- Modify: `packages/rules/metadata/runtime/createMetadataRuntime.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/index.ts`
- Modify: `packages/rules/index.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/coreApi.test.ts`

**Interfaces:**
- Extends: `MetadataRuntime.sync.partial` публичными операциями подготовки, чтения доставки, переходов и фиксации.
- Extends: `CoreApi` теми же узкими методами с обязательной проверкой принадлежности `ProjectStateService` для подготовки.

- [ ] **Step 1: Написать падающий runtime-тест**

Проверить, что `runtime.sync.partial.prepare` принимает только состояние, созданное этим runtime, а операции чтения/переходов/finalize вызывают публичные функции `@nkdk/rules` без глубоких импортов из MCP.

Предлагаемая поверхность:

```ts
runtime.sync.partial.prepare(params)
runtime.sync.partial.readPending(projectDir, componentPath)
runtime.sync.partial.markTransferring(params)
runtime.sync.partial.markPreparedAfterRejection(params)
runtime.sync.partial.markApplied(params)
runtime.sync.partial.finalize(params)
```

- [ ] **Step 2: Написать падающий тест `CoreApi`**

Проверить точное сопоставление методов и отказ для чужого `ProjectStateService`; не экспортировать правила, хранилище или файловые пути в MCP.

- [ ] **Step 3: Подтвердить RED**

Run:

```bash
pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/runtime/createMetadataRuntime.test.ts
pnpm exec vitest run --config packages/mcp/vitest.config.ts packages/mcp/src/coreApi.test.ts
```

- [ ] **Step 4: Реализовать узкую границу runtime**

Добавить импорты только в `runtime/createMetadataRuntime.ts` и публичный `partialSyncToXml/index.ts`. Оборачивать подготовку в существующие execution registries; файловые переходы не создают второй набор metadata-регистраций.

- [ ] **Step 5: Подтвердить GREEN, архитектуру и дубли**

Run:

```bash
pnpm exec vitest run --config packages/rules/vitest.config.ts packages/rules/metadata/runtime/createMetadataRuntime.test.ts
pnpm exec vitest run --config packages/mcp/vitest.config.ts packages/mcp/src/coreApi.test.ts
pnpm test:architecture
pnpm duplicates -- --base origin/develop
```

Expected: PASS; `@nkdk/mcp` не получил глубоких импортов из `@nkdk/rules`.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/rules/metadata/runtime/contracts.ts packages/rules/metadata/runtime/createMetadataRuntime.ts packages/rules/metadata/runtime/createMetadataRuntime.test.ts packages/rules/metadata/partialSyncToXml/index.ts packages/rules/index.ts packages/mcp/src/coreApi.ts packages/mcp/src/coreApi.test.ts
git commit -m "feat: :sparkles: открыть частичную синхронизацию в runtime"
```

---

### Task 6: Реализовать MCP-координатор полного цикла

**Files:**
- Add: `packages/mcp/src/contracts/syncToInfobase.ts`
- Add: `packages/mcp/src/services/syncToInfobase.ts`
- Add: `packages/mcp/src/services/syncToInfobase.test.ts`
- Modify: `packages/mcp/src/contracts/common.ts`
- Modify: `packages/mcp/src/services/platformSessionHandle.ts` only if its public manager type requires expansion.

**Interfaces:**
- Consumes: `projectDir`, `componentPath = "cf"`, `allowWrite`, настройки проекта, `CoreApi.sync.partial`, `PlatformSessionManager.loadPartialConfiguration`.
- Produces: `unchanged`, `synchronized`, настройки/validation/platform errors и `delivery_outcome_unknown`.

- [ ] **Step 1: Зафиксировать строгую схему входа и выхода**

`syncToInfobaseInputShape` принимает только согласованные поля. Ограничить `componentPath` значениями `cf` или `cfe/<Имя>` без `..`, абсолютных путей и пустого имени.

Успешная схема повторяет спецификацию:

```ts
type SyncToInfobaseSuccess =
  | { ok: true; status: "unchanged"; componentPath: string; diagnostics: Diagnostic[] }
  | {
      ok: true
      status: "synchronized"
      componentPath: string
      packageId: string
      entries: string[]
      loadTargets: string[]
      mode: "designer-agent"
      reusedConnection: boolean
      finalizeStatus: "published" | "alreadyPublished"
      configurationIndexPath: string
      warnings: Diagnostic[]
    }
```

Добавить `delivery_outcome_unknown` в общий перечень ошибок и отдельную схему сведений: `packageId`, `componentPath`, `temporaryDirectory`, `stage`, `mode`, необязательная ссылка на журнал.

- [ ] **Step 2: Написать таблицу падающих сценариев координатора**

В одном `it.each` покрыть уникальные ветви:

1. `allowWrite !== true` — нет чтения/подготовки/платформы;
2. нет настроек или настройки ошибочны — тот же договор, что импорт;
3. нет pending, подготовка `unchanged` — платформа не вызывается;
4. `prepared` либо отсутствующий pending с `prepared`-результатом — новая попытка;
5. `transferring` — `delivery_outcome_unknown`, никаких новых записей и команд;
6. `applied` — только `finalize`, платформа не вызывается;
7. штатный отказ платформы — вернуть состояние в `prepared`, сохранить каталог попытки и ссылку на журнал;
8. неизвестный результат — оставить `transferring`, сохранить каталог и запретить повтор;
9. успех платформы — записать `applied`, затем `finalize`, удалить успешный каталог попытки;
10. ошибка finalize после `applied` — сохранить pending; следующий вызов делает только finalize;
11. ошибка удаления staging после успешной команды — синхронизация успешна с предупреждением.

Отдельно проверить порядок вызовов:

```ts
expect(events).toEqual([
  "markTransferring",
  "platformLoad",
  "markApplied",
  "finalize",
])
```

- [ ] **Step 3: Запустить тесты и подтвердить RED**

Run:

```bash
pnpm exec vitest run --config packages/mcp/vitest.config.ts packages/mcp/src/services/syncToInfobase.test.ts
```

- [ ] **Step 4: Реализовать координатор без прямой записи pending**

Алгоритм:

```ts
const pending = await core.readPendingPartialSync(projectDir, componentPath)
if (pending?.delivery.status === "transferring") return unknownOutcome(...)
if (pending?.delivery.status === "applied") return finalizeOnly(...)

const prepared = await core.preparePartialSync(...)
if (prepared.status === "unchanged") return unchanged(...)

await core.markPartialSyncTransferring(...)
try {
  const loaded = await platform.loadPartialConfiguration(...)
  await core.markPartialSyncApplied(...)
  return await finalizeAndBuildResult(...)
} catch (error) {
  if (isConfirmedRejection(error)) await core.markPartialSyncPreparedAfterRejection(...)
  return mapSafeFailure(error)
}
```

Каталог попытки создаётся под `.nkdk/tmp/sync-to-infobase/<attempt-id>`. На полном успехе удаляется; при любом сбое сохраняется. `configurationIndexPath` берётся из результата finalize, а не вычисляется MCP через знание внутренней структуры снимка.

- [ ] **Step 5: Подтвердить GREEN и проверить пакет MCP**

Run:

```bash
pnpm exec vitest run --config packages/mcp/vitest.config.ts packages/mcp/src/services/syncToInfobase.test.ts packages/mcp/src/services/importFromInfobase.test.ts
pnpm --filter @nkdk/mcp test
pnpm duplicates -- --base origin/develop
```

Expected: PASS; существующий импорт не изменил договор ошибок и журнала.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/mcp/src/contracts/syncToInfobase.ts packages/mcp/src/services/syncToInfobase.ts packages/mcp/src/services/syncToInfobase.test.ts packages/mcp/src/contracts/common.ts packages/mcp/src/services/platformSessionHandle.ts
git commit -m "feat: :sparkles: выполнить частичную синхронизацию базы"
```

Добавлять `platformSessionHandle.ts` в индекс только если он изменён.

---

### Task 7: Зарегистрировать единый публичный MCP-инструмент

**Files:**
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `packages/mcp/README.md` if it contains the current public tool list.

**Interfaces:**
- Produces: `nkdk.sync_to_infobase` с `outputSchema`, передачей `AbortSignal` и `resource_link` на схему настроек либо `platform.log`.

- [ ] **Step 1: Написать падающие проверки регистрации**

Проверить:

- инструмент зарегистрирован ровно один раз;
- описание говорит о частичной загрузке `cf`/`cfe`, запуске 1С, необходимости `allowWrite=true` и отсутствии обновления конфигурации базы данных;
- строгие вход/выход схемы опубликованы;
- обработчик передаёт `extra.signal`;
- `project_settings_required` показывает схему настроек;
- ошибка платформы и неизвестный результат показывают ссылку с именем «Журнал синхронизации с информационной базой»;
- успешный ответ не дублирует журнал и не добавляет ресурс.

- [ ] **Step 2: Подтвердить RED**

Run:

```bash
pnpm exec vitest run --config packages/mcp/vitest.config.ts packages/mcp/src/tools/registerTools.test.ts
```

- [ ] **Step 3: Зарегистрировать инструмент и представление результата**

Использовать отдельные `createSyncToInfobaseHandler` и `syncToInfobaseToolResult` по образцу импорта, не расширяя универсальный `metadataToolResult` специальными условиями.

- [ ] **Step 4: Подтвердить GREEN и проверить документацию**

Run:

```bash
pnpm exec vitest run --config packages/mcp/vitest.config.ts packages/mcp/src/tools/registerTools.test.ts
pnpm --filter @nkdk/mcp test
pnpm duplicates -- --base origin/develop
```

- [ ] **Step 5: Зафиксировать публичную границу**

```bash
git add packages/mcp/src/tools/registerTools.ts packages/mcp/src/tools/registerTools.test.ts packages/mcp/README.md
git commit -m "feat: :sparkles: опубликовать синхронизацию с базой"
```

Добавлять README в индекс только при фактическом изменении.

---

### Task 8: Проверить полный цикл между слоями без реальной платформы

**Files:**
- Add: `packages/mcp/src/services/syncToInfobase.integration.test.ts`
- Modify only if required by the test: existing public test helpers in `packages/mcp/src/services/`.

**Contract:** Реальный `MetadataRuntime` формирует ZIP и снимок-кандидат, поддельный `PlatformSessionManager` подтверждает загрузку, координатор публикует снимок; второй вызов возвращает `unchanged`.

- [ ] **Step 1: Написать один сквозной интеграционный тест**

Создать временный NKDK-проект из минимальных программно построенных YAML-данных либо существующего тестового строителя, не меняя XML-фикстуры. Инициализировать снимок, изменить один реквизит, затем вызвать реальный координатор с поддельной платформой.

Проверить:

- ZIP существует во время вызова платформы и содержит `load.lst` и ожидаемый XML;
- состояние перед вызовом платформы равно `transferring`;
- после успеха опубликовано следующее поколение `configuration-index.bin`;
- ZIP, кандидат и `pending.json` удалены;
- повторный вызов возвращает `unchanged` и не вызывает платформу.

- [ ] **Step 2: Добавить восстановительный сценарий в тот же тестовый модуль**

Оборвать первый вызов после `markApplied`, до finalize. Новый вызов обязан выполнить только finalize и вернуть `alreadyPublished` либо `published` согласно точке сбоя; платформа вызывается один раз за оба вызова.

- [ ] **Step 3: Подтвердить RED, затем GREEN минимальными исправлениями**

Run:

```bash
pnpm exec vitest run --config packages/mcp/vitest.config.ts packages/mcp/src/services/syncToInfobase.integration.test.ts
```

Если тест вскрывает расхождение интерфейсов, менять владельца соответствующего договора (`rules`, `platform` или `mcp`), а не добавлять обход в интеграционный тест.

- [ ] **Step 4: Проверить затронутые пакеты и архитектуру**

Run:

```bash
pnpm --filter @nkdk/rules test
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/mcp test
pnpm test:architecture
pnpm duplicates -- --base origin/develop
```

- [ ] **Step 5: Зафиксировать сквозную защиту**

```bash
git add packages/mcp/src/services/syncToInfobase.integration.test.ts packages/rules packages/platform packages/mcp
git commit -m "test: :white_check_mark: проверить полный цикл частичной синхронизации"
```

Перед `git add` заменить широкие пути точным списком реально изменённых файлов, чтобы не захватить посторонние изменения.

---

### Task 9: Проверить согласованный сценарий на временной информационной базе

**Files:**
- No repository fixtures or database files.
- External only: проверенная резервная копия, два временных NKDK-проекта, `platform.log` и результаты XML-выгрузки.

- [ ] **Step 1: Повторно проверить резервную копию и закрыть лишние процессы 1С**

Убедиться, что копия из Task 3 существует и соответствует исходному каталогу до изменений. Закрыть только процессы/сессии 1С, созданные текущим MCP-процессом, через штатный `close_platform_connection`; не завершать чужие процессы.

- [ ] **Step 2: Импортировать базу во внешний временный проект**

Создать каталог через `mktemp -d` вне репозитория. Записать `.nkdk/project.yaml` с файловым подключением из `NKDK_TEST_INFOBASE_DIR`, без пользователя и пароля, и импортировать основную конфигурацию через `nkdk.import_from_infobase`.

- [ ] **Step 3: Изменить только согласованный реквизит**

В YAML `Справочник1` добавить реквизит `ТестовыйРеквизит` типа `Строка` длиной `50`, используя существующую структуру соседнего строкового реквизита или JSON Schema. Проверить YAML штатной validation до запуска платформы.

- [ ] **Step 4: Выполнить `nkdk.sync_to_infobase`**

Сначала подтвердить, что без `allowWrite` возвращается `confirmation_required`; затем вызвать с `allowWrite: true`. Проверить подробный результат: `packageId`, точные `entries`, `loadTargets`, `mode=designer-agent`, `reusedConnection`, `finalizeStatus`, `configurationIndexPath`, предупреждения.

- [ ] **Step 5: Проверить результат повторным импортом и в Конфигураторе**

Импортировать изменённую конфигурацию базы в новый внешний временный проект и проверить, что у `Справочник1` присутствует `ТестовыйРеквизит` с типом `Строка(50)`. Открывать или проверять Конфигуратор достаточно на уровне сохранённой конфигурации; режим 1С:Предприятия и обновление конфигурации базы данных не запускать.

- [ ] **Step 6: Проверить идемпотентность**

Повторный `nkdk.sync_to_infobase` для исходного проекта должен вернуть `unchanged` и не создавать новую платформенную загрузку.

- [ ] **Step 7: Обработать проблемы безопасно**

Если результат неизвестен, не повторять загрузку автоматически: сначала проверить конфигурацию в Конфигураторе. Если база повреждена или сценарий не завершён, закрыть созданную сессию, переместить проблемный каталог в отдельное временное место и восстановить проверенную копию. Не удалять резервную копию до явного подтверждения завершения задачи.

---

### Task 10: Выполнить финальную проверку и сверить документы с кодом

**Files:**
- Inspect: `.agents/architecture.md`
- Inspect: `docs/superpowers/specs/2026-08-12-partial-infobase-sync-design.md`
- Modify only if explicitly approved after reporting a real mismatch: neither by default.

- [ ] **Step 1: Проверить итоговый diff и отсутствие временных файлов**

Run:

```bash
git status --short
git diff --check origin/develop...HEAD
git diff --name-only origin/develop...HEAD
```

Убедиться, что в diff нет путей базы, абсолютного локального пути к ней, ZIP, `pending.json`, `configuration-index.bin`, `platform.log`, временных XML/YAML-проектов и секретов.

- [ ] **Step 2: Выполнить обязательные проверки**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base origin/develop
```

Expected: все команды завершаются успешно. При нестабильном временном пороге выполнить `pnpm test:profile -- --output /private/tmp/nkdk-partial-sync-test-profile.json` три раза и исследовать медиану; не ослаблять тест без установленной причины.

- [ ] **Step 3: Сверить реализацию с согласованной архитектурой**

Проверить таблицу ответственности и схему частичной синхронизации:

- `rules` владеет ZIP, кандидатом и фазами;
- `platform` владеет staging, агентом и журналом;
- `mcp` владеет только последовательностью и ответом;
- успешные ветви в схеме соответствуют фактическому порядку;
- в коде нет автоматического повтора неизвестного результата.

Если всё совпадает, документы не менять. Если есть расхождение, остановиться и представить пользователю точное отличие и рекомендуемое решение.

- [ ] **Step 4: Зафиксировать только необходимые итоговые правки**

Если после проверок потребовались кодовые или документальные исправления:

```bash
git add <точный список файлов>
git commit -m "fix: :bug: завершить частичную синхронизацию базы"
```

- [ ] **Step 5: Подготовить итоговый отчёт**

Перечислить:

- добавленные публичные договоры;
- проверки известного отказа и неизвестного результата;
- новые/расширенные/объединённые тесты и уникальный договор каждого нового теста;
- результат реальной загрузки и повторного импорта;
- местоположение внешней резервной копии и возможность восстановления;
- все выполненные команды проверки и их фактический результат.
