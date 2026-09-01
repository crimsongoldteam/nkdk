import assert from "node:assert/strict"
import test, { mock } from "node:test"
import {
  isSummaryProfileStep,
  runProfile,
  summarizeControlExport,
  summarizeFromXmlPropertyTypes,
  summarizeImportSteps,
  summarizeToXmlPropertyTypes,
  usage,
} from "./import-profile.mjs"

test("справка позволяет явно задать число worker", () => {
  assert.match(usage(), /--concurrency N/u)
})

test("без явного параметра оставляет выбор числа worker production import", async () => {
  const call = mock.fn(async () => ({
    result: { isError: false, structuredContent: { ok: true } },
    payload: { ok: true, succeeded: 1, failed: [], warnings: [], summary: { errors: 0, warnings: 0 } },
  }))
  const session = {
    call,
    takeStderr: mock.fn(() => ""),
    close: mock.fn(async () => undefined),
  }

  await runProfile(
    { xmlDir: "/xml", yamlDir: "/yaml", runs: 1 },
    {
      buildMcp: mock.fn(),
      createSession: mock.fn(async () => session),
      now: mock.fn(() => 0),
      clearOutput: mock.fn(),
      createProject: mock.fn(() => "/project"),
    },
  )

  assert.equal(call.mock.calls[0].arguments[1].concurrency, undefined)
  assert.equal(Object.hasOwn(call.mock.calls[0].arguments[1], "concurrency"), false)
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
    worker("Чтение XML первого прохода", 4, 2_048),
    worker("Парсинг XML первого прохода", 6, 2_048),
    worker("Чтение XML второго прохода", 5, 2_048),
    worker("Парсинг XML второго прохода", 7, 2_048),
    worker("Извлечение фактов XML", 11),
    worker("MessagePack pack", 12),
    worker("MessagePack unpack", 13),
    worker("Packed XML store write", 14),
    worker("Packed XML store read", 15),
    worker("Packed XML bytes", 0, 4_096),
    worker("toXML: построение объекта", 14),
    worker("toXML: финализация deferred", 15),
    worker("Контрольный XML: прямой hash", 16),
    worker("Контрольный XML: дерево расхождения", 17),
    worker("Доказательство XML-аномалий", 18),
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
    xmlReadMs: 9,
    xmlParseMs: 13,
    firstPassXmlReadMs: 4,
    firstPassXmlParseMs: 6,
    secondPassXmlReadMs: 5,
    secondPassXmlParseMs: 7,
    factsOnlyMs: 11,
    messagePackMs: 12,
    messageUnpackMs: 13,
    packedStoreWriteMs: 14,
    packedStoreReadMs: 15,
    packedBytes: 4_096,
    toXmlObjectMs: 14,
    toXmlFinalizeMs: 15,
    directHashMs: 16,
    mismatchDocumentMs: 17,
    anomalyProofMs: 18,
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
    { scope: "worker", worker: 0, substep: "Задания второго прохода", items: 3 },
    { scope: "worker", worker: 1, substep: "Задания второго прохода", items: 2 },
  ]

  assert.deepEqual(summarizeControlExport(steps), {
    direct: 3,
    serialized: 2,
    detailedRereads: 0,
    assignmentsByWorker: [3, 2],
  })
})

test("сводит собственное и полное время toXML по типам PropertyRule", () => {
  const steps = [
    { scope: "worker", worker: 0, step: "toXML PropertyRule exclusive", substep: "string", items: 2, time: 5 },
    { scope: "worker", worker: 1, step: "toXML PropertyRule exclusive", substep: "string", items: 3, time: 7 },
    { scope: "worker", worker: 0, step: "toXML PropertyRule inclusive", substep: "string", items: 2, time: 9 },
    { scope: "worker", worker: 1, step: "toXML PropertyRule inclusive", substep: "string", items: 3, time: 11 },
    { scope: "worker", worker: 0, step: "toXML PropertyRule exclusive", substep: "object", items: 1, time: 15 },
    { scope: "worker", worker: 0, step: "toXML PropertyRule inclusive", substep: "object", items: 1, time: 30 },
  ]

  assert.deepEqual(summarizeToXmlPropertyTypes(steps), [
    {
      propertyType: "object",
      propertyCount: 1,
      exclusiveWorkerMs: 15,
      exclusiveCriticalMs: 15,
      inclusiveWorkerMs: 30,
      inclusiveCriticalMs: 30,
      averageExclusiveUs: 15_000,
    },
    {
      propertyType: "string",
      propertyCount: 5,
      exclusiveWorkerMs: 12,
      exclusiveCriticalMs: 7,
      inclusiveWorkerMs: 20,
      inclusiveCriticalMs: 11,
      averageExclusiveUs: 2_400,
    },
  ])
})

test("сводит собственное и полное время XML в YAML по типам PropertyRule", () => {
  const steps = [
    { scope: "worker", worker: 0, step: "XML в YAML PropertyRule exclusive", substep: "boolean", items: 5, time: 3 },
    { scope: "worker", worker: 1, step: "XML в YAML PropertyRule exclusive", substep: "boolean", items: 7, time: 4 },
    { scope: "worker", worker: 0, step: "XML в YAML PropertyRule inclusive", substep: "boolean", items: 5, time: 4 },
    { scope: "worker", worker: 1, step: "XML в YAML PropertyRule inclusive", substep: "boolean", items: 7, time: 6 },
  ]

  assert.deepEqual(summarizeFromXmlPropertyTypes(steps), [
    {
      propertyType: "boolean",
      propertyCount: 12,
      exclusiveWorkerMs: 7,
      exclusiveCriticalMs: 4,
      inclusiveWorkerMs: 10,
      inclusiveCriticalMs: 6,
      averageExclusiveUs: 7_000 / 12,
    },
  ])
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

test("измеряет terminal результат через общий MCP waiter", async () => {
  let clock = 0
  const controller = new AbortController()
  const session = {
    call: mock.fn(() => {
      throw new Error("accepted response must not be measured directly")
    }),
    takeStderr: mock.fn(() => profileLine("Первый проход worker", 40)),
    close: mock.fn(async () => undefined),
  }
  const callToCompletion = mock.fn(async (actualSession, toolName, args, callOptions) => {
    assert.equal(actualSession, session)
    assert.equal(toolName, "nkdk.import_from_xml")
    assert.equal(args.projectDir, "/project")
    assert.equal(callOptions.signal, controller.signal)
    clock += 250
    return {
      result: { isError: false },
      payload: { ok: true, succeeded: 1, failed: [], warnings: [], summary: { errors: 0, warnings: 0 } },
    }
  })

  const result = await runProfile(
    { xmlDir: "/xml", yamlDir: "/yaml", runs: 1, signal: controller.signal },
    {
      buildMcp: mock.fn(),
      createSession: mock.fn(async () => session),
      callToCompletion,
      now: () => clock,
      clearOutput: mock.fn(),
      createProject: mock.fn(() => "/project"),
    },
  )

  assert.equal(session.call.mock.callCount(), 0)
  assert.equal(callToCompletion.mock.callCount(), 1)
  assert.equal(result.coldMs, 250)
})

test("сохраняет упорядоченные checkpoints памяти отдельно от сводной таблицы", async () => {
  const checkpoint = [
    '[nkdk-profile-step] operation="import-from-xml" step="Подготовка импорта конфигурации" substep="Начало задания второго прохода: Документ/Заказ/Свойства.yaml" scope=worker worker=2 items=17 bytes=4096 time=0.00ms rssStart=100.0MiB rssEnd=100.0MiB rssPeak=100.0MiB heapStart=42.5MiB heapEnd=42.5MiB heapPeak=42.5MiB',
    '[nkdk-profile-step] operation="import-from-xml" step="Подготовка импорта конфигурации" substep="Удерживаемый output второго прохода" scope=worker worker=2 items=18 bytes=8192 time=0.00ms rssStart=101.0MiB rssEnd=101.0MiB rssPeak=101.0MiB heapStart=45.0MiB heapEnd=45.0MiB heapPeak=45.0MiB',
  ].join("\n")
  const session = {
    call: mock.fn(async () => ({
      result: { isError: false },
      payload: { ok: true, succeeded: 1, failed: [], warnings: [], summary: { errors: 0, warnings: 0 } },
    })),
    takeStderr: mock.fn(() => checkpoint),
    close: mock.fn(async () => undefined),
  }

  const result = await runProfile(
    { xmlDir: "/xml", yamlDir: "/yaml", runs: 1 },
    {
      buildMcp: mock.fn(),
      createSession: mock.fn(async () => session),
      now: mock.fn(() => 0),
      clearOutput: mock.fn(),
      createProject: mock.fn(() => "/project"),
    },
  )

  assert.deepEqual(result.memoryCheckpoints.map(({ worker, items, bytes, heapEnd, substep }) => ({
    worker,
    items,
    bytes,
    heapEnd,
    substep,
  })), [
    {
      worker: 2,
      items: 17,
      bytes: 4096,
      heapEnd: 42.5,
      substep: "Начало задания второго прохода: Документ/Заказ/Свойства.yaml",
    },
    {
      worker: 2,
      items: 18,
      bytes: 8192,
      heapEnd: 45,
      substep: "Удерживаемый output второго прохода",
    },
  ])
  assert.equal(result.profileRows.some(({ step }) => step.includes("Начало задания второго прохода")), false)
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
