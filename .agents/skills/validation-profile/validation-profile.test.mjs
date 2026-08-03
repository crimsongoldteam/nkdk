import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import {
  aggregateRows,
  clearBinaryProjectStateCache,
} from "./validation-profile.mjs"

const skillDir = dirname(fileURLToPath(import.meta.url))

test("справка содержит одиночный холодный подробный прогон", () => {
  const output = execFileSync(process.execPath, [join(skillDir, "validation-profile.mjs"), "--help"], {
    encoding: "utf8",
  })
  assert.match(output, /--timing-only/u)
})

test("сбрасывает только двоичный кэш состояния проекта", async () => {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-profile-test-"))
  const cacheDir = join(projectDir, ".nkdk", "cache")
  const snapshot = join(cacheDir, "project-state.bin")
  const temporary = join(cacheDir, ".project-state.bin.123.tmp")
  const unrelated = join(cacheDir, "keep.bin")
  try {
    mkdirSync(cacheDir, { recursive: true })
    for (const path of [snapshot, temporary, unrelated]) writeFileSync(path, "test")

    await clearBinaryProjectStateCache(projectDir)

    assert.equal(existsSync(snapshot), false)
    assert.equal(existsSync(temporary), false)
    assert.equal(existsSync(unrelated), true)
  } finally {
    rmSync(projectDir, { recursive: true, force: true })
  }
})

test("упорядочивает подробные строки Б1–Б4 по конвейеру", () => {
  const records = [
    profileRecord("Двоичное кодирование результата", 3),
    profileRecord("Чтение файлов", 2),
    profileRecord("Локальная проверка YAML", 5),
  ]

  const rows = aggregateRows(records)
  assert.deepEqual(rows.map(({ step }) => step), [
    "Обработка файлов Б1–Б4",
    "- Чтение файлов",
    "- Локальная проверка YAML",
    "- Двоичное кодирование результата",
  ])
  assert.equal(rows.find(({ step }) => step === "- Чтение файлов").items, 1)
  assert.equal(rows.find(({ step }) => step === "- Двоичное кодирование результата").bytesSum, 12)
})

function profileRecord(substep, time) {
  return {
    operation: "validation",
    step: "Обработка файлов Б1–Б4",
    substep,
    scope: "worker",
    worker: 0,
    items: 1,
    bytes: substep === "Двоичное кодирование результата" ? 12 : undefined,
    time,
    rssPeak: 1,
  }
}
