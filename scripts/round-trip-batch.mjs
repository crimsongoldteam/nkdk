#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { appendFileSync, closeSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, posix, resolve } from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath } from "node:url"
import { collectRoundTripStatistics, readDiagnostics, XML_STATISTIC_KINDS } from "./round-trip-statistics.mjs"

const nkdkRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const runner = join(nkdkRoot, ".agents/skills/round-trip-yaml/round-trip.sh")
const durationKeys = ["importMs", "exportMs", "totalMs"]

function formatDuration(milliseconds) {
  if (milliseconds === undefined) return undefined
  const totalSeconds = Math.round(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function git(repo, ...args) {
  const result = spawnSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, GIT_LITERAL_PATHSPECS: "1" },
  })
  if (result.error || result.status !== 0) {
    const reason = result.error?.message || result.stderr.trim() || result.signal || `код ${result.status}`
    throw new Error(`git ${args[0]}: ${reason}`)
  }
  return result.stdout.trimEnd()
}

function requireDirectory(path) {
  const info = lstatSync(path)
  if (info.isSymbolicLink()) throw new Error(`Недопустимая символическая ссылка: ${path}`)
  if (!info.isDirectory()) throw new Error(`Не каталог: ${path}`)
}

function configurations(repo) {
  const root = join(repo, "cf")
  if (!existsSync(root)) throw new Error("В репозитории нет каталога конфигураций cf")
  requireDirectory(root)
  const paths = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Недопустимая символическая ссылка: ${path}`)
    if (!entry.isDirectory() || !existsSync(join(path, "Configuration.xml"))) continue
    if (realpathSync(git(path, "rev-parse", "--show-toplevel")) !== repo) {
      throw new Error(`Вложенный репозиторий конфигурации не поддерживается: ${path}`)
    }
    paths.push(`cf/${entry.name}`)
  }
  if (paths.length === 0) throw new Error(`В ${root} нет конфигураций с Configuration.xml`)
  return paths.sort()
}

function rejectNestedRepositories(repo, paths) {
  const modes = git(repo, "ls-files", "--format=%(objectmode)", "--", ...paths)
  if (modes.split("\n").includes("160000")) {
    throw new Error("Подмодули внутри конфигураций не поддерживаются")
  }
  // .git внутри обычного tracked-каталога не виден в status и не является gitlink.
  const nested = spawnSync("find", [...paths.map((path) => join(repo, path)),
    "-name", ".git", "-prune", "!", "-path", join(repo, ".git"), "-print0",
    "-o", "-name", "HEAD", "-type", "f", "-print0"], { encoding: "utf8" })
  if (nested.error || nested.status !== 0) throw new Error(nested.error?.message || nested.stderr)
  for (const path of nested.stdout.split("\0").filter(Boolean)) {
    if (path.endsWith("/.git")) throw new Error(`Вложенный Git в репозитории: ${path}`)
    // Bare-репозиторий хранит HEAD/objects/refs без обёртки .git.
    const bare = spawnSync("git", ["--git-dir", dirname(path), "rev-parse", "--is-bare-repository"], { encoding: "utf8" })
    if (bare.error) throw bare.error
    if (bare.status === 0) throw new Error(`Вложенный Git в репозитории: ${dirname(path)}`)
  }
}

function directoryBytes(directory) {
  let bytes = 0
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Недопустимая символическая ссылка: ${path}`)
    if (entry.isDirectory()) bytes += directoryBytes(path)
    else if (entry.isFile()) bytes += lstatSync(path).size
  }
  return bytes
}

function cell(value) {
  return String(value ?? "—").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll("|", "&#124;").replaceAll("\n", " ").replaceAll("\r", " ")
}

function saveReport(report) {
  const values = report.entries.map((entry) => statisticValues(entry.statistics))
  const total = report.entries.some((entry) => entry.statistics)
    ? values.reduce((sum, row) => sum.map((value, index) => value + (row[index] ?? 0)), values[0].map(() => 0))
    : values[0]
  const files = report.entries.some((entry) => entry.files !== undefined)
    ? report.entries.reduce((sum, entry) => sum + (entry.files ?? 0), 0) : undefined
  const bytes = report.testMode ? report.entries.reduce((sum, entry) => sum + entry.bytes, 0) : undefined
  const durations = durationKeys.map((key) => {
    const available = report.entries.map((entry) => entry[key]).filter((value) => value !== undefined)
    return available.length ? formatDuration(available.reduce((sum, value) => sum + value, 0)) : undefined
  })
  const rows = report.entries.map((entry, index) =>
    `| ${[entry.path, entry.status, entry.files, entry.commit, entry.bytes, ...values[index], ...durationKeys.map((key) => formatDuration(entry[key]))].map(cell).join(" | ")} | [журнал](${report.logDirectory.split("/").at(-1)}/log-${index + 1}.txt) |`)
  const failures = report.entries.filter((entry) => entry.error || entry.statisticsError || entry.timingError)
    .flatMap((entry) => [
      `### ${cell(entry.path)}`, "",
      ...[entry.error, entry.statisticsError, entry.timingError, ...(entry.errorDetails ?? [])].filter(Boolean)
        .flatMap((message) => [String(message).split("\n").map((line) => `    ${line}`).join("\n"), ""]),
    ])
  const text = [
    "# Результаты round-trip XML → YAML → XML", "",
    `Начало (UTC): ${report.startedAt}`, "", `Состояние: ${report.status}`, "",
    `Ветка: ${report.branch}`, "",
    `| Конфигурация | Результат | Изменённых файлов | Коммит | Размер, байт | YAML-файлов | ${XML_STATISTIC_KINDS.join(" | ")} | Широкие raw | Импорт | Экспорт | Всего | Журнал |`,
    `| --- | --- | ---: | --- | ---: | ${Array(XML_STATISTIC_KINDS.length + 5).fill("---:").join(" | ")} | --- |`,
    ...rows,
    `| ${["Итого", undefined, files, undefined, bytes, ...total, ...durations, undefined].map(cell).join(" | ")} |`, "",
    "## Ошибки", "", ...(failures.length ? failures : ["Ошибок нет.", ""]),
  ].join("\n")
  writeFileSync(join(report.repo, report.file), text)
}

function statisticValues(statistics) {
  return [statistics?.yamlFiles, ...XML_STATISTIC_KINDS.map((kind) => statistics?.tags[kind]),
    statistics?.broadRaw.reduce((sum, item) => sum + item.count, 0)]
}

function runComponent(run) {
  const directory = join(run.tempDir, "round-trip-yaml-mcp-project")
  const manifests = readdirSync(directory).filter((file) => file.endsWith(".manifest.json"))
  if (manifests.length !== 1) throw new Error("Не найден единственный manifest текущего прогона")
  const manifest = JSON.parse(readFileSync(join(directory, manifests[0]), "utf8"))
  if (manifest.components?.length !== 1 || manifest.components[0].yamlDir !== run.yamlDir) {
    throw new Error("Manifest не соответствует текущей конфигурации")
  }
  return manifest.components[0]
}

function* runOperations(run) {
  const directory = join(runComponent(run).projectDir, ".nkdk", "operations")
  if (!existsSync(directory)) return
  for (const file of readdirSync(directory).filter((name) => name.endsWith(".json")).sort()) {
    yield JSON.parse(readFileSync(join(directory, file), "utf8"))
  }
}

function readRunDurations(run) {
  const durations = {}
  for (const snapshot of runOperations(run)) {
    const key = snapshot.operationKind === "import_from_xml" ? "importMs"
      : snapshot.operationKind === "sync_to_xml" ? "exportMs" : undefined
    if (!key || !["succeeded", "failed", "cancelled", "interrupted"].includes(snapshot.status)) continue
    const milliseconds = Date.parse(snapshot.updatedAt) - Date.parse(snapshot.createdAt)
    if (!Number.isFinite(milliseconds) || milliseconds < 0) {
      throw new Error(`Некорректное время операции ${snapshot.operationKind}`)
    }
    durations[key] = (durations[key] ?? 0) + milliseconds
  }
  return durations
}

async function readRunErrors(run) {
  const errors = new Set()
  for (const snapshot of runOperations(run)) {
    const details = new Map()
    const add = (detail) => {
      const path = detail.sourceProjectPath ?? detail.targetProjectPath ?? detail.sourcePath ?? detail.targetXmlPath
      // failed содержит менее подробные копии diagnostics, часто без пути.
      if (!path && [...details.values()].some((item) => item.code === detail.code && item.message === detail.message)) return
      const key = JSON.stringify([detail.code, detail.message, path])
      if (!details.has(key)) details.set(key, detail)
    }
    if (snapshot.result?.diagnostics || snapshot.result?.report) {
      for await (const detail of readDiagnostics(snapshot.result)) {
        if (detail.severity === "error") add(detail)
      }
    }
    for (const detail of snapshot.result?.failed ?? []) add(detail)
    if (snapshot.error) add(snapshot.error)
    for (const detail of details.values()) {
      errors.add(`${snapshot.operationKind}: ${detail.code ?? "error"}\n${detail.sourceProjectPath ?? detail.targetProjectPath ?? detail.sourcePath ?? detail.targetXmlPath ?? ""}\n${detail.message ?? JSON.stringify(detail)}`)
    }
  }
  return [...errors]
}

function runConfiguration(repo, entry, run) {
  mkdirSync(run.tempDir, { recursive: true })
  const output = openSync(run.log, "w")
  try {
    const result = spawnSync("bash", [runner], {
      cwd: nkdkRoot,
      stdio: ["ignore", output, output],
      env: {
        ...process.env,
        GIT_LITERAL_PATHSPECS: "1",
        NKDK_XML_REPO: repo,
        NKDK_XML_DIR: join(repo, entry.path),
        NKDK_ROUND_TRIP_YAML_DIR: run.yamlDir,
        TMPDIR: run.tempDir,
      },
    })
    if (result.error || result.status !== 0) {
      throw new Error(`round-trip: ${result.error?.message ?? result.signal ?? `код ${result.status}`}; лог: ${run.log}`)
    }
  } finally {
    closeSync(output)
  }
}

function prepareBatch(repo, testMode, timestamp) {
  let base
  try {
    base = git(repo, "rev-parse", "--verify", "refs/heads/main^{commit}")
  } catch {
    throw new Error("Не найдена локальная ветка main. Запуск от другой ветки запрещён.")
  }
  const previousBranch = git(repo, "branch", "--show-current")
  const previousCommit = git(repo, "rev-parse", "HEAD")
  // Reset может удалить untracked-каталог на месте tracked-файла: сначала
  // исключаем вложенные Git-репозитории во всём целевом репозитории.
  rejectNestedRepositories(repo, ["."])
  console.log(`Очистка XML-репозитория: ${repo}`)
  console.log(git(repo, "reset", "--hard", "HEAD"))
  const removed = git(repo, "clean", "-fdx")
  if (removed) console.log(removed)
  let switched = false
  try {
    if (previousCommit !== base) {
      // Проверяем дерево main, не передвигая её и не затирая ignored-файлы.
      git(repo, "switch", "--no-overwrite-ignore", "--detach", base)
      switched = true
    }
    const paths = configurations(repo)
    rejectNestedRepositories(repo, paths)
    if (git(repo, "ls-files", "--others", "--ignored", "--exclude-standard", "--", ...paths)) {
      throw new Error("В каталогах конфигураций есть игнорируемые файлы: round-trip может удалить их. Перенесите их перед запуском.")
    }
    const entries = testMode
      ? paths.map((path) => ({ path, bytes: directoryBytes(join(repo, path)), status: "не обработана" }))
        .sort((left, right) => left.bytes - right.bytes || (left.path < right.path ? -1 : left.path > right.path ? 1 : 0))
        .slice(0, 3)
      : paths.map((path) => ({ path, status: "не обработана" }))
    const reportsDir = join(repo, "round-trip-reports")
    if (existsSync(reportsDir)) requireDirectory(reportsDir)
    const file = `round-trip-reports/${timestamp}.md`
    const logDirectory = `round-trip-reports/${timestamp}.logs`
    // check-ignore не поддерживает literal pathspec; код 1 означает «не игнорируется».
    for (const path of [file, ...entries.map((_, index) => `${logDirectory}/log-${index + 1}.txt`)]) {
      const ignored = spawnSync("git", ["--no-literal-pathspecs", "-C", repo, "check-ignore", "-q", path], { encoding: "utf8" })
      if (ignored.error || ignored.status !== 1) {
        throw new Error(ignored.error?.message || ignored.stderr || `Отчёт и журналы не должны игнорироваться Git: ${path}`)
      }
    }
    git(repo, "var", "GIT_AUTHOR_IDENT")
    git(repo, "var", "GIT_COMMITTER_IDENT")
    const branch = `codex/round-trip-${timestamp}`
    git(repo, "switch", "--no-overwrite-ignore", "-c", branch, base)
    return { entries, reportsDir, file, logDirectory, branch }
  } catch (error) {
    if (switched) {
      git(repo, "switch", "--no-overwrite-ignore", ...(previousBranch ? [previousBranch] : ["--detach", previousCommit]))
    }
    throw error
  }
}

async function runBatch(repoPath, testMode) {
  const startedAt = new Date().toISOString()
  const timestamp = startedAt.replace("T", "_").replaceAll(":", "-").replace(".", "-")
  const repo = realpathSync(resolve(repoPath))
  if (realpathSync(git(repo, "rev-parse", "--show-toplevel")) !== repo) {
    throw new Error("--repo должен указывать на корень Git-репозитория")
  }
  const { entries, reportsDir, file, logDirectory, branch } = prepareBatch(repo, testMode, timestamp)
  const report = {
    repo, file, logDirectory, startedAt, testMode, branch,
    tempRoot: mkdtempSync(join(tmpdir(), "nkdk-round-trip-batch-")),
    status: "выполняется",
    entries,
  }
  mkdirSync(reportsDir, { recursive: true })
  mkdirSync(join(repo, logDirectory))
  saveReport(report)
  console.log(`Ветка: ${report.branch}\nОтчёт: ${join(repo, file)}\nЛоги: ${join(repo, logDirectory)}`)
  let failed = false
  for (const [index, entry] of report.entries.entries()) {
    const entryStartedAt = performance.now()
    console.log(`[${index + 1}/${entries.length}] ${entry.path}`)
    const run = {
      tempDir: join(report.tempRoot, `run-${index + 1}`),
      yamlDir: join(report.tempRoot, "yaml", String(index + 1)),
      log: join(repo, logDirectory, `log-${index + 1}.txt`),
    }
    try {
      entry.status = "выполняется"
      saveReport(report)
      try {
        runConfiguration(repo, entry, run)
      } finally {
        try {
          Object.assign(entry, readRunDurations(run))
        } catch (error) {
          entry.timingError = `Замер времени: ${error.message}`
        }
        // После успешного import YAML и его диагностика остаются даже при ошибке sync.
        try {
          entry.statistics = await collectRoundTripStatistics(runComponent(run))
          appendFileSync(run.log, ["", "=== Статистика XML-тегов ===",
            XML_STATISTIC_KINDS.map((kind) => `${kind}=${entry.statistics.tags[kind]}`).join(", "),
            ...entry.statistics.broadRaw.map((item) => `Каталог YAML: ${posix.dirname(item.file)}\nШирокий raw: ${item.file} — ${item.count}`), ""].join("\n"))
        } catch (error) {
          entry.statisticsError = error.message
        }
      }
      git(repo, "add", "-A", "--", entry.path)
      const changes = git(repo, "diff", "--cached", "--name-only", "--no-renames", "-z", "--", entry.path)
      entry.files = changes.split("\0").filter(Boolean).length
      entry.status = entry.files === 0 ? "без расхождений" : "есть расхождения"
      if (entry.files > 0) {
        git(repo, "commit", "--only", "-m", "chore: :wrench: сохранить расхождения round-trip", "-m", entry.path, "--", entry.path)
        entry.commit = git(repo, "rev-parse", "HEAD")
      }
      if (entry.statisticsError) throw new Error(`Статистика: ${entry.statisticsError}`)
      if (entry.timingError) throw new Error(entry.timingError)
    } catch (error) {
      entry.status = "ошибка"
      entry.error = error.message
      failed = true
      console.error(`${entry.path}: ${entry.error}`)
    }
    if (entry.error) {
      try {
        entry.errorDetails = await readRunErrors(run)
      } catch (error) {
        entry.errorDetails = [`Чтение диагностики MCP: ${error.message}`]
      }
      // Сохраняем и stderr runner: ошибка может произойти до создания операции MCP.
      const runnerLog = existsSync(run.log) ? readFileSync(run.log, "utf8") : ""
      appendFileSync(run.log, ["", "=== Ошибки MCP ===", ...entry.errorDetails, ""].join("\n"))
      if (entry.errorDetails.length === 0 && runnerLog) entry.errorDetails.push(runnerLog)
    }
    saveReport(report)
    // Удаляются только каталоги этой конфигурации внутри собственного mkdtemp.
    rmSync(run.tempDir, { recursive: true, force: true })
    rmSync(run.yamlDir, { recursive: true, force: true })
    entry.totalMs = performance.now() - entryStartedAt
    saveReport(report)
  }
  report.status = failed ? "завершён с ошибками" : "завершён"
  saveReport(report)
  git(repo, "add", "--", file, logDirectory)
  // Только отчёт и журналы: остатки ошибочного XML-коммита не захватываются.
  git(repo, "commit", "--only", "-m", "docs: :memo: сохранить отчёт пакетного round-trip", "--", file, logDirectory)
  rmSync(report.tempRoot, { recursive: true, force: true })
  console.log(`Прогон ${report.status}. Отчёт: ${join(repo, file)}`)
  return failed ? 1 : 0
}

try {
  const args = process.argv.slice(2)
  if (args.length === 1 && ["-h", "--help"].includes(args[0])) {
    console.log("Использование: node scripts/round-trip-batch.mjs [--test] --repo /путь/к/XML-репозиторию\nБез --repo используется NKDK_XML_REPO из окружения. Обрабатываются конфигурации cf/*.\n--test: только три наименьшие конфигурации по суммарному размеру файлов в байтах.")
  } else {
    let repoPath
    let testMode = false
    for (let index = 0; index < args.length; index++) {
      if (args[index] === "--test" && !testMode) testMode = true
      else if (args[index] === "--repo" && repoPath === undefined && args[index + 1] && !args[index + 1].startsWith("--")) {
        repoPath = args[++index]
      } else throw new Error("Ожидается [--test] [--repo <каталог>]. Справка: --help")
    }
    repoPath ??= process.env.NKDK_XML_REPO
    if (!repoPath) throw new Error("Укажите --repo или NKDK_XML_REPO")
    process.exitCode = await runBatch(repoPath, testMode)
  }
} catch (error) {
  console.error(`Ошибка: ${error.message}`)
  process.exitCode = 1
}
