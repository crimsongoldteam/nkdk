import assert from "node:assert/strict"
import test, { mock } from "node:test"
import {
  isSummaryProfileStep,
  runProfile,
  summarizeControlExport,
  summarizeImportSteps,
  usage,
} from "./import-profile.mjs"

test("справка фиксирует четыре worker по умолчанию", () => {
  assert.match(usage(), /--concurrency N/u)
})

test("сводит этапы импорта и двоичной выдачи в стабильные поля", () => {
  const steps = [
    main("Первый проход worker", 11),
    main("Фиксация рабочего индекса", 12),
    main("Второй проход worker", 13),
    main("Копирование внешних файлов XML-выгрузки", 14),
    main("Построение окончательного состояния", 15),
    main("Полная проверка зависимостей", 16),
    main("Публикация состояния проекта", 17),
    main("Сохранение состояния проекта", 18),
    worker("Двоичное кодирование результата", 19, 1_024),
    main("Передача двоичного результата", 20, 1_024),
    main("Подготовка начала diagnostics", 21),
    main("Запись полного отчёта diagnostics", 22, 2_048),
    main("Формирование structuredContent MCP", 23, 4_096),
  ]

  assert.deepEqual(summarizeImportSteps(steps, 300), {
    firstPassMs: 11,
    workingIndexMs: 12,
    secondPassMs: 13,
    externalFilesMs: 14,
    finalBuildMs: 15,
    dependencyValidationMs: 16,
    publicationMs: 17,
    saveMs: 18,
    workerBinaryEncodeMs: 19,
    workerBinaryTransferMs: 20,
    workerBinaryBytes: 1_024,
    diagnosticPreviewMs: 21,
    diagnosticReportMs: 22,
    diagnosticReportBytes: 2_048,
    mcpStructuredMs: 23,
    mcpStructuredBytes: 4_096,
    measuredMainMs: 182,
    mcpOverheadMs: 118,
    responseMs: 300,
  })
})

test("пропускает профильные записи без строкового имени этапа", () => {
  assert.equal(isSummaryProfileStep({ substep: 42 }), false)
  assert.equal(isSummaryProfileStep({ substep: null }), false)
})

test("сводит режим контрольного XML и распределение второго прохода", () => {
  const steps = [
    { scope: "worker", worker: 0, substep: "Контрольный XML без сериализации", items: 3 },
    { scope: "worker", worker: 1, substep: "Контрольный XML с сериализацией", items: 2 },
    { scope: "worker", worker: 1, substep: "Подробный повторный импорт XML", items: 1 },
    { scope: "worker", worker: 0, substep: "Задания второго прохода", items: 3 },
    { scope: "worker", worker: 1, substep: "Задания второго прохода", items: 2 },
  ]

  assert.deepEqual(summarizeControlExport(steps), {
    direct: 3,
    serialized: 2,
    detailedRereads: 1,
    assignmentsByWorker: [3, 2],
  })
})

test("собирает MCP до замера и переиспользует одну сессию", async () => {
  let clock = 0
  const buildMcp = mock.fn(() => {
    clock += 5_000
  })
  const call = mock.fn(async () => {
    clock += 100
    return {
      result: { isError: false, structuredContent: { ok: true } },
      payload: { ok: true, succeeded: 1, failed: [], warnings: [], summary: { errors: 0, warnings: 0 } },
    }
  })
  const session = {
    call,
    takeStderr: mock.fn(() => profileLine("Первый проход worker", 40)),
    close: mock.fn(async () => undefined),
  }
  const createSession = mock.fn(async () => session)
  const createProject = mock.fn(() => `/project-${createProject.mock.callCount()}`)

  const result = await runProfile(
    { xmlDir: "/xml", yamlDir: "/yaml", runs: 2, concurrency: 4 },
    {
      buildMcp,
      createSession,
      now: () => clock,
      clearOutput: mock.fn(),
      createProject,
    },
  )

  assert.equal(buildMcp.mock.callCount(), 1)
  assert.equal(createSession.mock.callCount(), 1)
  assert.equal(createProject.mock.callCount(), 2)
  assert.equal(call.mock.callCount(), 2)
  assert.deepEqual(call.mock.calls.map(({ arguments: callArguments }) => callArguments[1].projectDir), [
    "/project-0",
    "/project-1",
  ])
  assert.equal(session.close.mock.callCount(), 1)
  assert.equal(result.mode, "compiled-mcp-stdio")
  assert.equal(result.runs.length, 2)
  assert.equal(result.coldMs, 100)
  assert.equal(result.runs[0].elapsedMs, 100)
})

function main(substep, time, bytes) {
  return { scope: "main", substep, time, bytes }
}

function worker(substep, time, bytes) {
  return { scope: "worker", worker: 0, substep, time, bytes }
}

function profileLine(substep, time) {
  return `[nkdk-profile-step] operation="import-from-xml" step="Подготовка импорта конфигурации" substep=${JSON.stringify(substep)} scope=main items=1 time=${time}ms\n`
}
