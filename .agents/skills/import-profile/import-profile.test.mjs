import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { isSummaryProfileStep, summarizeImportSteps } from "./import-profile.mjs"

const skillDir = dirname(fileURLToPath(import.meta.url))

test("справка фиксирует четыре worker по умолчанию", () => {
  const output = execFileSync(process.execPath, [join(skillDir, "import-profile.mjs"), "--help"], {
    encoding: "utf8",
  })
  assert.match(output, /--concurrency N/u)
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

  assert.deepEqual(summarizeImportSteps(steps, 99), {
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
    mcpStructuredBytes: 4_096,
    responseMs: 99,
  })
})

test("пропускает профильные записи без строкового имени этапа", () => {
  assert.equal(isSummaryProfileStep({ substep: 42 }), false)
  assert.equal(isSummaryProfileStep({ substep: null }), false)
})

function main(substep, time, bytes) {
  return { scope: "main", substep, time, bytes }
}

function worker(substep, time, bytes) {
  return { scope: "worker", worker: 0, substep, time, bytes }
}
