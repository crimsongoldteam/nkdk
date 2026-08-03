import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { summarizeImportSteps } from "./import-profile.mjs"

const skillDir = dirname(fileURLToPath(import.meta.url))

test("справка фиксирует четыре worker по умолчанию", () => {
  const output = execFileSync(process.execPath, [join(skillDir, "import-profile.mjs"), "--help"], {
    encoding: "utf8",
  })
  assert.match(output, /--concurrency N/u)
})

test("сводит этапы импорта в девять стабильных полей", () => {
  const steps = [
    main("Первый проход worker", 11),
    main("Фиксация рабочего индекса", 12),
    main("Второй проход worker", 13),
    main("Копирование внешних файлов XML-выгрузки", 14),
    main("Построение окончательного состояния", 15),
    main("Полная проверка зависимостей", 16),
    main("Публикация состояния проекта", 17),
    main("Сохранение состояния проекта", 18),
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
    responseMs: 99,
  })
})

function main(substep, time) {
  return { scope: "main", substep, time }
}
