import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

const script = fileURLToPath(new URL("./round-trip-batch.mjs", import.meta.url))

function git(repo, ...args) {
  const result = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8" })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}

function fixture(t, names) {
  const root = mkdtempSync(join(tmpdir(), "nkdk-batch-test-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const repo = join(root, "XML репозиторий")
  mkdirSync(join(repo, "cf"), { recursive: true })
  for (const name of names) {
    const dir = join(repo, "cf", name)
    mkdirSync(dir)
    writeFileSync(join(dir, "Configuration.xml"), "<MetaDataObject/>\n")
    writeFileSync(join(dir, "old.xml"), "old\n")
  }
  writeFileSync(join(repo, "README.md"), "Source\n")
  git(repo, "init", "-q", "-b", "main")
  git(repo, "config", "user.name", "NKDK Test")
  git(repo, "config", "user.email", "test@example.invalid")
  git(repo, "config", "commit.gpgsign", "false")
  git(repo, "config", "core.autocrlf", "false")
  git(repo, "config", "core.hooksPath", ".git/hooks")
  git(repo, "add", ".")
  git(repo, "commit", "-qm", "source")
  const base = git(repo, "rev-parse", "HEAD")
  mkdirSync(join(root, "tmp"))
  const nodeShim = join(root, "mcp-preload.cjs")
  writeFileSync(nodeShim, `
const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const originalSpawn = childProcess.spawnSync;
childProcess.spawnSync = (command, ...args) => {
  if (['bash', 'find', 'ln', 'rm', 'cp', 'mv'].includes(command)) throw new Error('Unix command forbidden: ' + command);
  return originalSpawn(command, ...args);
};
require('node:module').syncBuiltinESMExports();
if (path.basename(process.argv[1] ?? '') === 'mcp-round-trip.mjs') {
const manifest = JSON.parse(fs.readFileSync(process.argv[process.argv.indexOf('--manifest') + 1], 'utf8'));
for (const component of manifest.components) {
  if (component.componentPath !== 'cf') process.exit(42);
  if (!component.yamlDir.startsWith(process.env.NKDK_TEST_ROOT)) process.exit(43);
  if (component.yamlDir !== path.join(component.projectDir, 'cf')) process.exit(44);
  const operations = path.join(component.projectDir, '.nkdk', 'operations');
  fs.mkdirSync(operations, {recursive:true});
  const timing = {createdAt:'2026-09-02T00:00:00.000Z', updatedAt:'2026-09-02T00:00:02.000Z'};
  if (process.env.NKDK_TEST_IMPORT_MS) timing.updatedAt = new Date(Date.parse(timing.createdAt) + Number(process.env.NKDK_TEST_IMPORT_MS)).toISOString();
  fs.writeFileSync(path.join(operations, 'import.json'), JSON.stringify({
    ...timing, ok:true, status:component.xmlDir.endsWith('03-error') ? 'failed' : 'succeeded', operationKind:'import_from_xml',
    ...(component.xmlDir.endsWith('03-error') ? {error:{code:'xml_import_failed', message:'Ошибка чтения XML'}} : {}),
  }));
  if (component.xmlDir.endsWith('03-error')) { console.error('Ошибка чтения XML'); process.exit(7); }
  fs.mkdirSync(path.join(component.yamlDir, 'Справочники'), {recursive:true});
  fs.writeFileSync(path.join(component.yamlDir, 'Справочники', 'Товары.yaml'), 'Поле: !xml/raw {\u0024xml: null}\\nСтрока: !xml/string текст\\n');
  const warnings = [
    {severity:'warning', code:'xml_raw_scope_too_broad', message:'Широкий raw', targetProjectPath:'Справочники/Товары.yaml'},
  ];
  fs.writeFileSync(component.importOutputPath, JSON.stringify({
    ok:true, diagnostics:warnings, warnings, truncated:false,
    summary:{errors:0, warnings:1, shown:1, omitted:0},
  }));
  if (process.env.NKDK_TEST_BAD_STATISTICS && component.xmlDir.endsWith('01-change [a]')) fs.writeFileSync(component.importOutputPath, '{}');
  if (component.xmlDir.endsWith('03-sync-error')) {
    const operations = path.join(component.projectDir, '.nkdk', 'operations');
    fs.mkdirSync(operations, {recursive:true});
    const diagnostic = {severity:'error', code:'full_xml_sync_assignment_failed', message:'Неверный #order: ожидались DataPath и Title', sourceProjectPath:'Формы/Форма.yaml'};
    const reportPath = path.join(operations, 'diagnostics.jsonl');
    fs.writeFileSync(reportPath, [diagnostic, {...diagnostic, sourceProjectPath:'Формы/ДругаяФорма.yaml'}, {...diagnostic, message:'Вторая ошибка из полного отчёта'}].map(item => JSON.stringify(item)).join('\\n'));
    fs.writeFileSync(path.join(operations, 'sync.json'), JSON.stringify({
      ...timing, updatedAt:'2026-09-02T00:00:03.000Z', ok:true, status:'succeeded', operationKind:'sync_to_xml',
      result:{ok:true, succeeded:0, diagnostics:[diagnostic], truncated:true, report:{format:'application/x-ndjson', uri:require('node:url').pathToFileURL(reportPath).href}, summary:{errors:3, warnings:0, shown:1, omitted:2}, failed:[{code:'full_xml_sync_assignment_failed', message:'Неверный #order: ожидались DataPath и Title'}]},
    }));
    console.error('sync returned 1 operation failure(s)');
    process.exit(8);
  }
  fs.writeFileSync(path.join(operations, 'sync.json'), JSON.stringify({
    ...timing, updatedAt:'2026-09-02T00:00:03.000Z', ok:true, status:'succeeded', operationKind:'sync_to_xml',
  }));
  fs.cpSync(component.xmlDir, component.xmlOutputDir, {recursive:true});
  if (component.xmlDir.endsWith('03-empty')) fs.rmSync(path.join(component.xmlOutputDir, 'Configuration.xml'));
  for (const relative of ['.nakidka-migrations.yaml', 'Ext/ParentConfigurations.bin', 'Ext/ParentConfigurations/base.cf']) {
    fs.rmSync(path.join(component.xmlOutputDir, relative), {force:true});
  }
  if (component.xmlDir.endsWith('01-change [a]')) {
    fs.writeFileSync(path.join(component.xmlOutputDir, 'Configuration.xml'), '<Changed/>\\n');
    fs.rmSync(path.join(component.xmlOutputDir, 'old.xml'));
    fs.writeFileSync(path.join(component.xmlOutputDir, 'new.xml'), 'new\\n');
  }
  if (component.xmlDir.endsWith('04-change')) {
    fs.writeFileSync(path.join(component.xmlOutputDir, 'old.xml'), 'changed again\\n');
  }
}
process.exit(0);
}
`)
  const run = (args = ["--repo", repo], extraEnv = {}) => spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_OPTIONS: [process.env.NODE_OPTIONS, '--require', JSON.stringify(nodeShim)].filter(Boolean).join(' '),
      TMPDIR: join(root, "tmp"),
      TEMP: join(root, "tmp"),
      TMP: join(root, "tmp"),
      NKDK_TEST_ROOT: root,
      // Старые настройки одиночного запуска не должны влиять на пакетный.
      NKDK_XML_DIR: "/invalid/old-config",
      NKDK_ROUND_TRIP_YAML_DIR: "/invalid/old-yaml",
      ...extraEnv,
    },
  })
  return { repo, root, base, run }
}

function report(repo) {
  const files = readdirSync(join(repo, "round-trip-reports")).filter((file) => file.endsWith(".md"))
  assert.equal(files.length, 1)
  return readFileSync(join(repo, "round-trip-reports", files[0]), "utf8")
}

function temporaryRuns(root) {
  // Кэш загрузчика tsx принадлежит инструменту, не пакетному прогону.
  return readdirSync(join(root, "tmp")).filter((name) => name.startsWith("nkdk-round-trip-batch-"))
}

function timingCells(text, name) {
  const rows = text.split("\n").filter((line) => line.startsWith("| ")).map((line) => line.split("|").slice(1, -1).map((value) => value.trim()))
  const row = rows.find((cells) => cells[0] === name)
  return ["Импорт", "Экспорт", "Всего"].map((column) => row[rows[0].indexOf(column)])
}

function durationSeconds(value) {
  assert.match(value, /^\d{2,}:\d{2}$/u)
  const [minutes, seconds] = value.split(":").map(Number)
  assert.ok(seconds < 60)
  return minutes * 60 + seconds
}

test("накапливает отдельные коммиты с diff и сохраняет все результаты в итоговом отчёте", (t) => {
  const { repo, base, run } = fixture(t, ["04-change", "02-clean", "01-change [a]"])
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  assert.match(git(repo, "branch", "--show-current"), /^codex\/round-trip-\d{4}-\d{2}-\d{2}_/u)
  const commits = git(repo, "rev-list", "--reverse", `${base}..HEAD`).split("\n")
  assert.equal(commits.length, 3)
  assert.equal(git(repo, "show", "--format=", "--name-only", commits[0]),
    'cf/01-change [a]/Configuration.xml\ncf/01-change [a]/new.xml\ncf/01-change [a]/old.xml')
  assert.equal(git(repo, "show", "--format=", "--name-only", commits[1]), "cf/04-change/old.xml")
  assert.ok(git(repo, "show", "--format=", "--name-only", commits[2]).split("\n").every((path) => path.startsWith("round-trip-reports/")))
  const text = report(repo)
  assert.deepEqual(timingCells(text, "cf/02-clean").slice(0, 2), ["00:02", "00:03"])
  assert.deepEqual(timingCells(text, "Итого").slice(0, 2), ["00:06", "00:09"])
  const totalSeconds = ["cf/01-change [a]", "cf/02-clean", "cf/04-change"].map((name) => {
    const value = timingCells(text, name)[2]
    return durationSeconds(value)
  })
  assert.ok(Math.abs(durationSeconds(timingCells(text, "Итого")[2]) - totalSeconds.reduce((sum, value) => sum + value, 0)) <= 1.5)
  assert.ok(text.includes(`| cf/01-change [a] | есть расхождения | 3 | ${commits[0]} |`))
  assert.ok(text.includes("| cf/02-clean | без расхождений | 0 | — |"))
  assert.ok(text.includes(`| cf/04-change | есть расхождения | 1 | ${commits[1]} |`))
  const header = text.split("\n").filter((line) => line && !line.startsWith("#")).slice(0, 3)
  assert.match(header[0], /^Начало \(UTC\): \d{4}-/u)
  assert.equal(header[1], "Состояние: завершён")
  assert.equal(header[2], `Ветка: ${git(repo, "branch", "--show-current")}`)
  assert.doesNotMatch(text, /XML-репозиторий:|Исходный коммит|Коммит NKDK|Журналы:|Режим:|Считаются физические|— означает|Каталоги и YAML|Источник широких|Число файлов включает|XML-различия сохраняются/u)
  assert.ok(text.includes('| Итого | — | 4 | — | — | 3 | 3 | 0 | 0 | 0 | 3 | 0 | 0 | 3 |'))
  assert.equal(text.split("\n").filter((line) => line.startsWith("| ---")).length, 1)
  assert.equal(readFileSync(join(repo, "cf/01-change [a]/new.xml"), "utf8"), "new\n")
  assert.equal(git(repo, "rev-parse", "main"), base)
  assert.equal(git(repo, "status", "--porcelain"), "")
})

test("сохраняет reference-only файлы после экспорта в каталоге с пробелами и кириллицей", (t) => {
  const { repo, run } = fixture(t, ["Тестовая конфигурация"])
  const directory = join(repo, "cf", "Тестовая конфигурация")
  mkdirSync(join(directory, "Ext/ParentConfigurations"), { recursive: true })
  const files = [".nakidka-migrations.yaml", "Ext/ParentConfigurations.bin", "Ext/ParentConfigurations/base.cf"]
  for (const file of files) writeFileSync(join(directory, file), "reference bytes\n")
  git(repo, "add", "cf")
  git(repo, "commit", "-qm", "reference files")
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  for (const file of files) assert.equal(readFileSync(join(directory, file), "utf8"), "reference bytes\n")
  assert.match(report(repo), /Тестовая конфигурация \| без расхождений/u)
})

test("Windows: принимает корень репозитория с другим регистром и кратким путём TEMP", { skip: process.platform !== "win32" }, (t) => {
  // Windows CI задаёт TEMP через RUNNER~1; Git возвращает полное имя каталога.
  const { repo, base, run } = fixture(t, ["02-clean"])
  const input = repo.toUpperCase()
  t.diagnostic(JSON.stringify({ input, gitRoot: git(repo, "rev-parse", "--show-toplevel") }))
  const result = run(["--repo", input])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(git(repo, "rev-parse", "HEAD^"), base)
  assert.equal(git(repo, "diff", base, "--", "cf"), "")
  assert.match(report(repo), /cf\/02-clean \| без расхождений/u)
})

test("не заменяет исходный XML неполным экспортом и продолжает следующие конфигурации", (t) => {
  const { repo, base, run } = fixture(t, ["03-empty", "04-change"])
  const result = run()
  assert.equal(result.status, 1)
  assert.match(report(repo), /cf\/03-empty \| ошибка/u)
  assert.equal(git(repo, "diff", base, "--", "cf/03-empty"), "")
  assert.equal(readFileSync(join(repo, "cf/04-change/old.xml"), "utf8"), "changed again\n")
})

test("создаёт ветку и выбирает конфигурации из main, не наследуя прошлый прогон", (t) => {
  const { repo, base, run } = fixture(t, ["02-clean"])
  git(repo, "switch", "-qc", "previous-run")
  git(repo, "rm", "-r", "cf/02-clean")
  mkdirSync(join(repo, "cf/03-error"), { recursive: true })
  writeFileSync(join(repo, "cf/03-error/Configuration.xml"), "old result\n")
  writeFileSync(join(repo, "previous-report.md"), "previous result\n")
  git(repo, "add", ".")
  git(repo, "commit", "-qm", "previous run")
  const previous = git(repo, "rev-parse", "HEAD")
  const result = run(["--test", "--repo", repo])
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /\[1\/1\] cf\/02-clean/u)
  assert.doesNotMatch(report(repo), /cf\/03-error/u)
  assert.equal(git(repo, "rev-parse", "HEAD^"), base)
  assert.equal(git(repo, "rev-parse", "main"), base)
  assert.equal(git(repo, "rev-parse", "previous-run"), previous)
  assert.equal(git(repo, "ls-files", "previous-report.md"), "")
})

test("округляет время после суммирования, переносит секунды в минуты и не ограничивает длительность часом", async (t) => {
  for (const [milliseconds, expected, names, expectedTotal] of [
    [0, "00:00", ["02-clean"], "00:00"],
    [59999, "01:00", ["02-clean"], "01:00"],
    [3661234, "61:01", ["02-clean"], "61:01"],
    [1499, "00:01", ["02-clean", "03-clean"], "00:03"],
  ]) {
    await t.test(String(milliseconds), (t) => {
      const { repo, run } = fixture(t, names)
      const result = run(["--repo", repo], { NKDK_TEST_IMPORT_MS: String(milliseconds) })
      assert.equal(result.status, 0, result.stderr)
      assert.equal(timingCells(report(repo), "cf/02-clean")[0], expected)
      assert.equal(timingCells(report(repo), "Итого")[0], expectedTotal)
    })
  }
})

test("отказывает без локальной main, не подставляя master или текущую ветку", (t) => {
  const { repo, base, run } = fixture(t, ["02-clean"])
  git(repo, "branch", "-m", "master")
  const result = run()
  assert.equal(result.status, 1)
  assert.match(result.stderr, /main/u)
  assert.equal(git(repo, "branch", "--show-current"), "master")
  assert.equal(git(repo, "rev-parse", "HEAD"), base)
})

test("очищает конфликтующий ignored-файл, а при ошибке проверки main возвращает исходную ветку", async (t) => {
  for (const collision of [false, true]) await t.test(String(collision), (t) => {
    const { repo, run } = fixture(t, ["02-clean"])
    if (collision) {
      writeFileSync(join(repo, "local.txt"), "main data\n")
      git(repo, "add", "local.txt")
      git(repo, "commit", "-qm", "main tracked file")
    } else {
      writeFileSync(join(repo, ".gitignore"), "round-trip-reports/\n")
      git(repo, "add", ".gitignore")
      git(repo, "commit", "-qm", "main invalid report settings")
    }
    git(repo, "switch", "-qc", "previous-run")
    if (collision) git(repo, "rm", "local.txt")
    writeFileSync(join(repo, ".gitignore"), "local.txt\n")
    git(repo, "add", ".gitignore")
    git(repo, "commit", "-qm", "previous run settings")
    writeFileSync(join(repo, "local.txt"), "precious local data\n")
    const before = git(repo, "rev-parse", "HEAD")
    const result = run()
    assert.equal(git(repo, "rev-parse", "previous-run"), before)
    if (collision) {
      assert.equal(result.status, 0, result.stderr)
      assert.equal(git(repo, "rev-parse", "HEAD^"), git(repo, "rev-parse", "main"))
      assert.equal(readFileSync(join(repo, "local.txt"), "utf8"), "main data\n")
    } else {
      assert.equal(result.status, 1)
      assert.equal(git(repo, "branch", "--show-current"), "previous-run")
      assert.equal(git(repo, "rev-parse", "HEAD"), before)
      assert.equal(existsSync(join(repo, "local.txt")), false)
      assert.equal(git(repo, "branch", "--list", "codex/round-trip-*"), "")
    }
  })
})

test("при отсутствии diff создаёт только отчёт и принимает репозиторий из окружения", (t) => {
  const { repo, root, base, run } = fixture(t, ["02-clean"])
  const result = run([], { NKDK_XML_REPO: repo })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(git(repo, "rev-list", "--count", `${base}..HEAD`), "1")
  assert.ok(report(repo).includes("| cf/02-clean | без расхождений | 0 | — |"))
  assert.ok(report(repo).includes("| cf/02-clean | без расхождений | 0 | — | — | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |"))
  const logDir = result.stdout.match(/^Логи: (.+)$/mu)[1]
  const log = readFileSync(join(logDir, 'log-1.txt'), 'utf8')
  assert.match(log, /string=1/u)
  assert.match(log, /Широкий raw: Справочники\/Товары.yaml — 1/u)
  assert.match(log, /Каталог YAML: Справочники/u)
  assert.ok(logDir.startsWith(join(realpathSync.native(repo), "round-trip-reports")))
  assert.deepEqual(temporaryRuns(root), [])
  assert.equal(git(repo, "diff", base, "--", "cf"), "")
})

test("тестовый режим обрабатывает только три наименьших каталога по байтам, включая вложенные файлы", (t) => {
  const { repo, run } = fixture(t, ["01-change [a]", "02-clean", "03-clean", "04-change", "05-clean"])
  for (const [name, padding] of [["01-change [a]", 100], ["02-clean", 2], ["03-clean", 2], ["04-change", 1], ["05-clean", 2]]) {
    const dir = join(repo, "cf", name)
    writeFileSync(join(dir, "Configuration.xml"), "x")
    mkdirSync(join(dir, "nested"))
    writeFileSync(join(dir, "nested", "data.bin"), "x".repeat(padding))
  }
  git(repo, "add", "cf")
  git(repo, "commit", "-qm", "sizes")
  const base = git(repo, "rev-parse", "HEAD")
  const result = run(["--test", "--repo", repo])
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual([...result.stdout.matchAll(/^\[\d+\/3\] (.+)$/gmu)].map((match) => match[1]),
    ["cf/04-change", "cf/02-clean", "cf/03-clean"])
  const text = report(repo)
  const rows = text.split("\n").filter((line) => line.startsWith("| cf/"))
  assert.deepEqual(rows.map((line) => line.split(" | ")[4]), ["6", "7", "7"])
  assert.equal(text.split("\n").filter((line) => line.startsWith("| ---")).length, 1)
  assert.ok(!text.includes("cf/01-change [a]"))
  assert.ok(!text.includes("cf/05-clean"))
  assert.equal(git(repo, "diff", base, "--", "cf/01-change [a]", "cf/05-clean"), "")
  assert.equal(git(repo, "rev-list", "--count", `${base}..HEAD`), "2")
  assert.equal(git(repo, "status", "--porcelain"), "")
})

test("тестовый режим принимает репозиторий из окружения и меньше трёх конфигураций", (t) => {
  const { repo, run } = fixture(t, ["02-clean"])
  const result = run(["--test"], { NKDK_XML_REPO: repo })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /\[1\/1\] cf\/02-clean/u)
  assert.ok(report(repo).includes("| cf/02-clean | без расхождений | 0 | — |"))
})

test("после ошибки продолжает прогон, сохраняет последующие diff и очищает временные каталоги", (t) => {
  const { repo, root, base, run } = fixture(t, ["01-change [a]", "02-clean", "03-error", "04-change"])
  const result = run()
  assert.equal(result.status, 1)
  const text = report(repo)
  assert.ok(text.includes("| cf/02-clean | без расхождений | 0 | — |"))
  assert.ok(text.includes("| cf/03-error | ошибка | — | — |"))
  assert.ok(text.includes("| cf/04-change | есть расхождения | 1 |"))
  assert.ok(text.includes("Состояние: завершён с ошибками"))
  assert.ok(text.includes("## Ошибки"))
  assert.ok(text.includes("Ошибка чтения XML"))
  assert.deepEqual(timingCells(text, "cf/03-error").slice(0, 2), ["00:02", "—"])
  durationSeconds(timingCells(text, "cf/03-error")[2])
  assert.deepEqual(timingCells(text, "Итого").slice(0, 2), ["00:08", "00:09"])
  assert.equal(git(repo, "rev-list", "--count", `${base}..HEAD`), "3")
  assert.equal(git(repo, "diff", base, "--", "cf/03-error"), "")
  assert.equal(readFileSync(join(repo, "cf/04-change/old.xml"), "utf8"), "changed again\n")
  assert.deepEqual(temporaryRuns(root), [])
  assert.equal(git(repo, "status", "--porcelain"), "")
})

test("сохраняет статистику и полный текст ошибки sync перед удалением временного проекта", (t) => {
  const { repo, root, run } = fixture(t, ["03-sync-error", "04-change"])
  const result = run()
  assert.equal(result.status, 1)
  assert.ok(report(repo).includes("| cf/03-sync-error | ошибка | — | — |"))
  assert.ok(report(repo).includes("| cf/03-sync-error | ошибка | — | — | — | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |"))
  assert.ok(report(repo).includes("| cf/04-change | есть расхождения | 1 |"))
  assert.match(report(repo), /## Ошибки[\s\S]*full_xml_sync_assignment_failed[\s\S]*Неверный #order: ожидались DataPath и Title/u)
  assert.match(report(repo), /Формы\/Форма.yaml/u)
  assert.match(report(repo), /Вторая ошибка из полного отчёта/u)
  assert.match(report(repo), /Формы\/ДругаяФорма.yaml/u)
  assert.deepEqual(timingCells(report(repo), "cf/03-sync-error").slice(0, 2), ["00:02", "00:03"])
  durationSeconds(timingCells(report(repo), "cf/03-sync-error")[2])
  assert.equal([...report(repo).matchAll(/Неверный #order: ожидались DataPath и Title/gu)].length, 2)
  assert.deepEqual(temporaryRuns(root), [])
})

test("ошибка статистики не теряет успешный XML-результат и не блокирует следующую конфигурацию", (t) => {
  const { repo, root, base, run } = fixture(t, ["01-change [a]", "04-change"])
  const result = run(["--repo", repo], { NKDK_TEST_BAD_STATISTICS: "1" })
  assert.equal(result.status, 1)
  assert.equal(git(repo, "rev-list", "--count", `${base}..HEAD`), "3")
  assert.match(report(repo), /cf\/01-change \[a\] \| ошибка \| 3 \| [a-f0-9]{40}/u)
  assert.match(report(repo), /cf\/04-change \| есть расхождения/u)
  assert.equal(git(repo, "status", "--porcelain"), "")
  assert.deepEqual(temporaryRuns(root), [])
})

test("при отказе XML-коммита отчёт не захватывает оставшиеся staged-изменения", (t) => {
  const { repo, base, run } = fixture(t, ["01-change [a]", "02-clean"])
  const hook = join(repo, ".git/hooks/pre-commit")
  writeFileSync(hook, "#!/bin/sh\nif git diff --cached --name-only | grep -q '^cf/'; then exit 1; fi\n")
  chmodSync(hook, 0o755)
  const result = run()
  assert.equal(result.status, 1)
  assert.match(result.stderr, /git commit.*код.*1/u)
  assert.equal(git(repo, "rev-list", "--count", `${base}..HEAD`), "1")
  assert.ok(git(repo, "show", "--format=", "--name-only", "HEAD").split("\n").every((path) => path.startsWith("round-trip-reports/")))
  assert.match(git(repo, "diff", "--cached", "--name-only"), /cf\/01-change \[a\]\/new.xml/u)
  assert.equal(git(repo, "diff", base, "HEAD", "--", "cf"), "")
  assert.ok(report(repo).includes("| cf/01-change [a] | ошибка | 3 | — |"))
  assert.ok(report(repo).includes("| cf/02-clean | без расхождений | 0 | — |"))
})

test("перед запуском сбрасывает tracked и staged изменения, удаляет untracked и ignored файлы", (t) => {
  const { repo, run } = fixture(t, ["02-clean"])
  writeFileSync(join(repo, ".gitignore"), "cf/local.txt\ncf/02-clean/local-cache/\n")
  git(repo, "add", ".gitignore")
  git(repo, "commit", "-qm", "ignore unrelated file")
  writeFileSync(join(repo, "cf/local.txt"), "user data\n")
  mkdirSync(join(repo, "cf/02-clean/local-cache"))
  writeFileSync(join(repo, "cf/02-clean/local-cache/data.txt"), "ignored data\n")
  writeFileSync(join(repo, "README.md"), "staged edit\n")
  git(repo, "add", "README.md")
  writeFileSync(join(repo, "cf/02-clean/old.xml"), "unstaged edit\n")
  writeFileSync(join(repo, "untracked.txt"), "untracked data\n")
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  for (const file of ["cf/local.txt", "cf/02-clean/local-cache", "untracked.txt"]) assert.equal(existsSync(join(repo, file)), false)
  assert.equal(readFileSync(join(repo, "README.md"), "utf8"), "Source\n")
  assert.equal(readFileSync(join(repo, "cf/02-clean/old.xml"), "utf8"), "old\n")
  assert.match(result.stdout, /Очистка XML-репозитория/u)
  assert.equal(git(repo, "status", "--porcelain"), "")
})

test("отказывает до создания ветки при небезопасном источнике", async (t) => {
  for (const kind of ["empty", "symlink", "subdirectory", "nested-repo", "nested-git-dir", "nested-over-tracked", "nested-bare-over-tracked", "ignored-report", "ignored-logs"]) {
    await t.test(kind, (t) => {
      const { repo, root, run } = fixture(t, kind === "empty" ? [] : ["02-clean"])
      let args = ["--repo", repo]
      if (kind === "symlink") {
        const external = join(root, "external")
        mkdirSync(external)
        writeFileSync(join(external, "Configuration.xml"), "untouched\n")
        symlinkSync(external, join(repo, "cf", "link"), process.platform === "win32" ? "junction" : "dir")
        if (process.platform !== "win32") {
          git(repo, "add", "cf/link")
          git(repo, "commit", "-qm", "link")
        }
      }
      if (kind === "subdirectory") args = ["--repo", join(repo, "cf")]
      if (kind.startsWith("ignored-")) {
        writeFileSync(join(repo, ".gitignore"), kind === "ignored-logs" ? "*.txt\n" : "round-trip-reports/\n")
        git(repo, "add", ".gitignore")
        git(repo, "commit", "-qm", "ignore")
      }
      if (kind.startsWith("nested-")) {
        const nested = join(repo, kind.endsWith("over-tracked") ? "README.md" : "cf/02-clean/vendor")
        if (kind.endsWith("over-tracked")) rmSync(nested)
        mkdirSync(nested)
        writeFileSync(join(nested, ".gitignore"), "local.txt\n")
        if (kind === "nested-git-dir") {
          git(repo, "add", "cf/02-clean/vendor")
          git(repo, "commit", "-qm", "ordinary directory")
        }
        if (kind === "nested-bare-over-tracked") git(nested, "init", "--bare", "-q")
        else {
          git(nested, "init", "-q")
          git(nested, "add", ".gitignore")
          git(nested, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "nested")
        }
        if (kind === "nested-repo") {
          writeFileSync(join(nested, "local.txt"), "precious local data\n")
          git(repo, "add", "cf/02-clean/vendor")
          git(repo, "commit", "-qm", "gitlink")
        }
      }
      const before = git(repo, "status", "--porcelain")
      const beforeHead = git(repo, "rev-parse", "HEAD")
      const result = run(args)
      assert.equal(result.status, 1)
      assert.match(result.stderr, /изменени|конфигураци|символическ|корень|игнорир|Вложенный Git/u)
      assert.equal(git(repo, "branch", "--show-current"), "main")
      assert.equal(git(repo, "status", "--porcelain"), before)
      assert.equal(git(repo, "rev-parse", "HEAD"), beforeHead)
      if (kind === "nested-over-tracked") assert.ok(existsSync(join(repo, "README.md/.git")))
      if (kind === "nested-bare-over-tracked") assert.ok(existsSync(join(repo, "README.md/HEAD")))
    })
  }
})
