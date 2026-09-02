import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import test from "node:test"
import { collectRoundTripStatistics, countXmlTags } from "./round-trip-statistics.mjs"

test("считает физические YAML-теги, включая форму XML и номерные ключи, но не текст и алиасы", () => {
  assert.deepEqual(countXmlTags(`
# !xml/raw
Текст: "!xml/raw"
Блок: |
  !xml/invalid
Правило: !изменять Тест
Значение: &original !xml/raw
  $xml: null
  $значение: !xml/invalid 1
Алиас: *original
Список: [!xml/string слово, !xml/uuid 3b2a028a-e629-4b57-9ac2-f42b1fd00b01]
!xml/invalid Повтор: 1
!xml/invalid/2 Повтор: 2
Важное: !xml/important {Поле: 1}
Имя: !xml/name Панель
СтандартныеРеквизиты: !xml/standard-attributes
`), { raw: 1, invalid: 3, important: 1, uuid: 1, string: 1, name: 1, "standard-attributes": 1 })
})

async function setup(t) {
  const root = await mkdtemp(join(tmpdir(), "nkdk-statistics-test-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const yamlDir = join(root, "yaml")
  await mkdir(join(yamlDir, "Справочники"), { recursive: true })
  const importOutputPath = join(root, "import.json")
  return { root, yamlDir, importOutputPath }
}

function warning(targetProjectPath) {
  return { severity: "warning", code: "xml_raw_scope_too_broad", message: "Широкий raw", targetProjectPath }
}

test("суммирует YAML-файлы и берёт широкие raw из полного JSONL без повторения preview", async (t) => {
  const { root, yamlDir, importOutputPath } = await setup(t)
  await writeFile(join(yamlDir, "Конфигурация.yaml"), "Версия: !xml/string 1\n")
  await writeFile(join(yamlDir, "Справочники", "Товары.yml"), "Поле: !xml/raw {$xml: null}\n")
  await writeFile(join(yamlDir, "Модуль.bsl"), "!xml/raw")
  const diagnostics = [warning("Справочники/Товары.yml"), warning("Справочники/Товары.yml"), warning("Конфигурация.yaml")]
  const reportPath = join(root, "full report.jsonl")
  await writeFile(reportPath, diagnostics.map((value) => JSON.stringify(value)).join("\n"))
  await writeFile(importOutputPath, JSON.stringify({
    diagnostics: diagnostics.slice(0, 1),
    warnings: diagnostics.slice(0, 1),
    truncated: true,
    summary: { errors: 0, warnings: 3, shown: 1, omitted: 2 },
    report: { uri: pathToFileURL(reportPath).href, format: "application/x-ndjson" },
  }))
  assert.deepEqual(await collectRoundTripStatistics({ yamlDir, importOutputPath }), {
    tags: { raw: 1, invalid: 0, important: 0, uuid: 0, string: 1, name: 0, "standard-attributes": 0 },
    yamlFiles: 2,
    broadRaw: [
      { file: "Конфигурация.yaml", count: 1 },
      { file: "Справочники/Товары.yml", count: 2 },
    ],
  })
})

test("читает полную inline-диагностику и не считает прочие предупреждения широким raw", async (t) => {
  const paths = await setup(t)
  await writeFile(paths.importOutputPath, JSON.stringify({
    truncated: false,
    diagnostics: [warning("Форма.yaml"), { severity: "warning", code: "other" }],
    warnings: [warning("Форма.yaml")],
    summary: { errors: 0, warnings: 2, shown: 2, omitted: 0 },
  }))
  const result = await collectRoundTripStatistics(paths)
  assert.deepEqual(result.broadRaw, [{ file: "Форма.yaml", count: 1 }])
  assert.equal(result.tags.raw, 0)
})

test("не выдаёт неполную статистику за нули при потере отчёта или повреждении YAML", async (t) => {
  const paths = await setup(t)
  await writeFile(paths.importOutputPath, JSON.stringify({ diagnostics: [], truncated: true }))
  await assert.rejects(collectRoundTripStatistics(paths), /полный.*отчёт/u)
  await writeFile(paths.importOutputPath, JSON.stringify({
    truncated: true,
    report: { uri: pathToFileURL(join(paths.root, "missing.jsonl")).href, format: "application/x-ndjson" },
  }))
  await assert.rejects(collectRoundTripStatistics(paths), /missing.jsonl/u)
  await writeFile(paths.importOutputPath, JSON.stringify({ diagnostics: [], truncated: false, summary: { errors: 0, warnings: 1, shown: 1, omitted: 0 } }))
  await assert.rejects(collectRoundTripStatistics(paths), /неполон/u)
  await writeFile(paths.importOutputPath, JSON.stringify({ diagnostics: [], truncated: false, summary: { errors: 0, warnings: 0, shown: 0, omitted: 0 } }))
  await writeFile(join(paths.yamlDir, "bad.yaml"), "Поле: !xml/raw [\n")
  await assert.rejects(collectRoundTripStatistics(paths), /bad.yaml/u)
})
