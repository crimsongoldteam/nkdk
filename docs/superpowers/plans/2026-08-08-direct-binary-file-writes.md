# Direct Binary File Writes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить атомарную публикацию configuration index и project state прямой записью целевых файлов без временных файлов и `fsync`.

**Architecture:** Каждый владелец формата самостоятельно создаёт родительский каталог и записывает целевой файл. Общий слой атомарной публикации удаляется; configuration index получает честное имя `writeConfigurationIndex`, а повреждённый project state по-прежнему отбраковывается при загрузке.

**Tech Stack:** TypeScript 7, Node.js `fs.promises`, Vitest 4, pnpm.

## Global Constraints

- Не добавлять поддержку параллельных писателей одного проекта.
- Не выполнять проверочное чтение, `fsync`, запись временного файла или `rename`.
- Ошибка прямой записи возвращается вызывающей операции.
- Повреждённый `project-state.bin` удаляется и перестраивается существующим холодным проходом.
- Автоматическое восстановление `configuration-index.bin` не добавляется.

---

### Task 1: Прямая запись configuration index

**Files:**
- Modify: `packages/core/metadata/configurationIndex/fileIO.test.ts`
- Modify: `packages/core/metadata/configurationIndex/fileIO.ts`
- Modify: `packages/core/metadata/configurationIndex/index.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/core/metadata/fullSyncToXml/failureIntegration.test.ts`

**Interfaces:**
- Produces: `writeConfigurationIndex(params: { projectDir: string; address: ComponentAddress; data: ConfigurationSnapshot }): Promise<void>`.
- Removes: `writeConfigurationIndexAtomically`.

- [ ] **Step 1: Переименовать API в тесте до изменения production-кода**

В `fileIO.test.ts` импортировать и вызывать `writeConfigurationIndex`. Сохранить основной тест записи/чтения и тест привязки компонента. Удалить проверки сохранения прежнего файла при ошибке `rename`, ошибки синхронизации каталога и коллизии временного имени: эти договоры отменены.

- [ ] **Step 2: Убедиться, что тест падает по ожидаемой причине**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/fileIO.test.ts --no-isolate`

Expected: FAIL, потому что `fileIO.ts` ещё не экспортирует `writeConfigurationIndex`.

- [ ] **Step 3: Реализовать минимальную прямую запись**

В `fileIO.ts` заменить атомарный помощник на прямую запись:

```ts
export async function writeConfigurationIndex(params: {
  projectDir: string
  address: ComponentAddress
  data: ConfigurationSnapshot
}): Promise<void> {
  const expectedComponentPath = componentPath(params.address)
  if (params.data.componentPath !== expectedComponentPath) {
    throw new Error(`Ожидалась привязка ${expectedComponentPath}, получена ${params.data.componentPath}`)
  }
  const target = configurationIndexPath(params.projectDir, params.address)
  await fs.promises.mkdir(dirname(target), { recursive: true })
  await fs.promises.writeFile(target, encodeConfigurationIndex(params.data))
}
```

Переименовать импорты и ссылки во всех перечисленных вызывающих модулях и в публичном экспорте `configurationIndex/index.ts`.

- [ ] **Step 4: Убедиться, что узкий тест проходит**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/configurationIndex/fileIO.test.ts --no-isolate`

Expected: PASS.

### Task 2: Прямая запись project state и удаление общего помощника

**Files:**
- Modify: `packages/core/metadata/projectState/binary/persistence.test.ts`
- Modify: `packages/core/metadata/projectState/binary/persistence.ts`
- Delete: `packages/core/files/atomicPublication.ts`
- Delete: `packages/core/files/atomicPublication.test.ts`

**Interfaces:**
- Preserves: `saveBinaryProjectState(projectDir: string, buffers: ProjectStateSharedBuffers): Promise<void>`.
- Removes: внутренний `publishFileAtomically` и очистку файлов `.project-state.bin.*.tmp`.

- [ ] **Step 1: Добавить падающую проверку прямого открытия цели**

В `persistence.test.ts` через прозрачный `vi.spyOn(fs.promises, "open")`, вызывающий исходную реализацию, проверить, что `saveBinaryProjectState` открывает `projectStateBinaryPath(projectDir)` с флагом `"w"`. Удалить тест очистки оставшегося временного файла, поскольку такой файл больше не создаётся.

- [ ] **Step 2: Убедиться, что тест падает по ожидаемой причине**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/persistence.test.ts --no-isolate`

Expected: FAIL: целевой файл не открывается с флагом `"w"`; текущая реализация пишет во временный путь.

- [ ] **Step 3: Реализовать прямую запись и удалить отменённый слой**

В `saveBinaryProjectState` создать каталог и записать цель непосредственно:

```ts
await fs.promises.mkdir(dirname(target), { recursive: true })
const handle = await fs.promises.open(target, "w")
try {
  const chunks = [
    Buffer.from(header.buffer, header.byteOffset, header.byteLength),
    ...SECTION_NAMES.map((name) => Buffer.from(buffers[name])),
  ]
  await writeVectorExactly(handle, chunks)
} finally {
  await handle.close()
}
```

Удалить `verifyBinaryProjectStateFile`, `removeTemporaryFiles`, `TEMPORARY_PREFIX`, импорт `publishFileAtomically` и файлы `atomicPublication.ts`/`atomicPublication.test.ts`. Сохранить проверку формата и контрольной суммы в обычном пути `loadBinaryProjectState`.

- [ ] **Step 4: Убедиться, что узкий тест проходит**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/binary/persistence.test.ts --no-isolate`

Expected: PASS.

### Task 3: Проверка всего изменения

**Files:**
- Verify: все изменённые файлы задач 1–2.

**Interfaces:**
- Consumes: `writeConfigurationIndex` и прямое сохранение `project-state.bin`.
- Produces: подтверждённое отсутствие ссылок на отменённые API и зелёные проверки проекта.

- [ ] **Step 1: Проверить отсутствие отменённых механизмов**

Run: `rg -n 'publishFileAtomically|writeConfigurationIndexAtomically|\.sync\(\)|fsync|project-state\.bin\..*\.tmp' packages`

Expected: нет совпадений в рабочем коде и тестах.

- [ ] **Step 2: Проверить типы**

Run: `pnpm type-check`

Expected: PASS.

- [ ] **Step 3: Запустить все тесты**

Run: `pnpm test`

Expected: PASS.

- [ ] **Step 4: Проверить архитектуру**

Run: `pnpm test:architecture`

Expected: PASS.

- [ ] **Step 5: Проверить новые дубли**

Run: `pnpm duplicates -- --base 6518e9124`

Expected: PASS, новых дублей относительно коммита спецификации нет.
