import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { runMcpRoundTrip } from "./mcp-round-trip.mjs"

const skill = await readFile(new URL("./SKILL.md", import.meta.url), "utf8")
const script = await readFile(new URL("./round-trip.sh", import.meta.url), "utf8")
const configDirsHelper = fileURLToPath(new URL("../_shared/round-trip-config-dirs.sh", import.meta.url))
const diffHelper = fileURLToPath(new URL("../_shared/round-trip-git-diff.sh", import.meta.url))

test("не запускает sync до terminal import и переиспользует сессию", async () => {
  const events = []
  const session = {
    close: async () => events.push("close"),
  }
  const result = await runMcpRoundTrip({
    components: [
      { xmlDir: "/xml/cf", xmlOutputDir: "/out/cf", projectDir: "/project", componentPath: "cf" },
      {
        xmlDir: "/xml/cfe/addon",
        xmlOutputDir: "/out/cfe/addon",
        projectDir: "/project",
        componentPath: "cfe/addon",
      },
    ],
  }, {
    buildMcp: () => events.push("build"),
    createSession: async () => {
      events.push("session")
      return session
    },
    callToCompletion: async (_session, toolName, args) => {
      events.push(`${toolName}:${args.componentPath}`)
      return { payload: { ok: true, toolName } }
    },
    writeResult: async () => undefined,
  })

  assert.deepEqual(events, [
    "build",
    "session",
    "nkdk.import_from_xml:cf",
    "nkdk.sync_to_xml:cf",
    "nkdk.import_from_xml:cfe/addon",
    "nkdk.sync_to_xml:cfe/addon",
    "close",
  ])
  assert.equal(result.components.length, 2)
})

test("после terminal import failure не запускает sync и закрывает сессию", async () => {
  const calls = []
  const session = { close: async () => calls.push("close") }

  await assert.rejects(runMcpRoundTrip({
    components: [
      { xmlDir: "/xml", xmlOutputDir: "/out", projectDir: "/project", componentPath: "cf" },
    ],
  }, {
    buildMcp: () => undefined,
    createSession: async () => session,
    callToCompletion: async (_session, toolName) => {
      calls.push(toolName)
      throw new Error("worker failed")
    },
    writeResult: async () => undefined,
  }), /import.*cf.*worker failed/u)

  assert.deepEqual(calls, ["nkdk.import_from_xml", "close"])
})

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}

function collectConfigDirs(root) {
  const result = spawnSync(
    "bash",
    ["-c", '. "$1"\nround_trip_collect_run_dirs "$2"', "round-trip-config-dirs", configDirsHelper, root],
    { encoding: "utf8" },
  )
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim() === "" ? [] : result.stdout.trim().split("\n")
}

function componentPath(configDir, repo) {
  const result = spawnSync(
    "bash",
    ["-c", '. "$1"\nround_trip_component_path "$2" "$3"', "round-trip-config-dirs", configDirsHelper, configDir, repo],
    { encoding: "utf8" },
  )
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}

function sanitizedPathSegment(value) {
  const result = spawnSync(
    "bash",
    ["-c", '. "$1"\nround_trip_sanitize_path_segment "$2"', "round-trip-config-dirs", configDirsHelper, value],
    { encoding: "utf8" },
  )
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}

test("определяет конфигурацию по корневому Configuration.xml", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "nkdk-round-trip-configs-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const configurationOnly = join(root, "configuration-only")
  const legacyDirectoryOnly = join(root, "legacy-directory-only")
  await mkdir(configurationOnly)
  await mkdir(join(legacyDirectoryOnly, "Catalogs"), { recursive: true })
  await writeFile(join(configurationOnly, "Configuration.xml"), "<MetaDataObject/>")

  assert.deepEqual(collectConfigDirs(root), [configurationOnly])
})

test("находит основную конфигурацию и вложенные расширения", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "nkdk-round-trip-configs-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const configuration = join(root, "cf")
  const extension = join(root, "cfe", "Расширение")
  await mkdir(configuration, { recursive: true })
  await mkdir(extension, { recursive: true })
  await writeFile(join(configuration, "Configuration.xml"), "<MetaDataObject/>")
  await writeFile(join(extension, "Configuration.xml"), "<MetaDataObject/>")

  assert.deepEqual(collectConfigDirs(root), [configuration, extension])
})

test("выводит путь компонента из положения XML-каталога", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "nkdk-round-trip-component-"))
  t.after(() => rm(root, { recursive: true, force: true }))

  assert.equal(componentPath(root, root), "cf")
  assert.equal(componentPath(join(root, "cf"), root), "cf")
  assert.equal(componentPath(join(root, "cfe", "Расширение"), root), "cfe/Расширение")
})

test("даёт корневому временному каталогу безопасное имя", () => {
  assert.equal(sanitizedPathSegment("."), "root")
  assert.equal(sanitizedPathSegment(".."), "root")
})

test("проверяет только активный XML-каталог, а не рабочее дерево nkdk", () => {
  assert.doesNotMatch(script, /git -C "\$\{REPO_DIR\}" status/u)
  assert.match(script, /git -C "\$\{NKDK_XML_REPO\}" status --porcelain -- "\$\{RUN_XML_REL\}"/u)
})

test("собирает tracked и untracked diff, исключая git-ignored файлы", async (t) => {
  const repo = await mkdtemp(join(tmpdir(), "nkdk-round-trip-diff-"))
  t.after(() => rm(repo, { recursive: true, force: true }))
  run("git", ["init", "-q"], repo)
  await writeFile(join(repo, ".gitignore"), "ignored.xml\n")
  await writeFile(join(repo, "z.xml"), "before\n")
  run("git", ["add", ".gitignore", "z.xml"], repo)
  run("git", ["-c", "user.name=NKDK Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "fixture"], repo)

  await writeFile(join(repo, "z.xml"), "after\n")
  await writeFile(join(repo, "a.xml"), "new\n")
  await writeFile(join(repo, "ignored.xml"), "ignored\n")

  const files = spawnSync(
    "bash",
    ["-c", '. "$1"\nround_trip_collect_diff_files "$2"', "round-trip-git-diff", diffHelper, repo],
    { encoding: "utf8" },
  )
  assert.equal(files.status, 0, files.stderr)
  assert.deepEqual(files.stdout.trim().split("\n"), ["a.xml", "z.xml"])

  const diff = spawnSync(
    "bash",
    ["-c", '. "$1"\nround_trip_diff_text "$2" "$3"', "round-trip-git-diff", diffHelper, repo, "a.xml"],
    { encoding: "utf8" },
  )
  assert.equal(diff.status, 0, diff.stderr)
  assert.match(diff.stdout, /new file mode/u)
  assert.match(diff.stdout, /\+\+\+ b\/a\.xml/u)
})

test("не требует отсутствующих справочных файлов metadata", () => {
  assert.doesNotMatch(skill, /\.agents\/knowledge\/metadata/u)
})

test("оставляет выбор числа worker production import", () => {
  assert.doesNotMatch(script, /componentPath:"cf",concurrency:/u)
})

test("передаёт вычисленный путь компонента в import и sync", () => {
  assert.doesNotMatch(script, /componentPath:"cf"/u)
  assert.match(script, /componentPath:process\.argv\[6\]/u)
})

test("сохраняет служебное состояние миграций вне YAML-договора", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "nkdk-round-trip-migrations-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const xmlRepo = join(root, "xml-repo")
  const xmlDir = join(xmlRepo, "cf")
  const fakeBin = join(root, "bin")
  await mkdir(xmlDir, { recursive: true })
  await mkdir(fakeBin)
  await writeFile(join(xmlDir, "Configuration.xml"), "<MetaDataObject/>\n")
  await writeFile(join(xmlDir, ".nakidka-migrations.yaml"), "migrations: []\n")
  run("git", ["init", "-q"], xmlRepo)
  run("git", ["add", "cf/Configuration.xml", "cf/.nakidka-migrations.yaml"], xmlRepo)
  run("git", ["-c", "user.name=NKDK Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "fixture"], xmlRepo)

  const fakeNode = join(fakeBin, "node")
  await writeFile(fakeNode, `#!/usr/bin/env bash
if [[ "\${1:-}" == *"/.agents/skills/round-trip-yaml/mcp-round-trip.mjs" ]]; then
  manifest=""
  output=""
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --manifest) manifest="$2"; shift 2 ;;
      --output) output="$2"; shift 2 ;;
      *) shift ;;
    esac
  done
  "$NKDK_TEST_REAL_NODE" -e '
    const fs = require("node:fs")
    const path = require("node:path")
    const manifest = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
    for (const component of manifest.components) {
      fs.mkdirSync(component.xmlOutputDir, { recursive: true })
      fs.copyFileSync(
        path.join(component.xmlDir, "Configuration.xml"),
        path.join(component.xmlOutputDir, "Configuration.xml"),
      )
    }
    fs.writeFileSync(process.argv[2], JSON.stringify({ components: [] }))
  ' "$manifest" "$output"
  exit $?
fi
exec "$NKDK_TEST_REAL_NODE" "$@"
`)
  await chmod(fakeNode, 0o755)

  const result = spawnSync("bash", [fileURLToPath(new URL("./round-trip.sh", import.meta.url))], {
    encoding: "utf8",
    env: {
      ...process.env,
      NKDK_ROUND_TRIP_YAML_DIR: join(root, "yaml"),
      NKDK_TEST_REAL_NODE: process.execPath,
      NKDK_XML_DIR: xmlDir,
      NKDK_XML_REPO: xmlRepo,
      PATH: `${fakeBin}:${process.env.PATH}`,
      TMPDIR: join(root, "tmp"),
    },
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Round-trip чистый: диффов нет/u)
  assert.equal(await readFile(join(xmlDir, ".nakidka-migrations.yaml"), "utf8"), "migrations: []\n")
  assert.equal(run("git", ["status", "--short", "--", "cf"], xmlRepo), "")
})

test("для выбранного вложенного XML-каталога использует логический путь cf", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "nkdk-round-trip-selected-config-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const xmlRepo = join(root, "xml-repo")
  const xmlDir = join(xmlRepo, "cf", "erp")
  const fakeBin = join(root, "bin")
  const capturedInput = join(root, "import-input.json")
  await mkdir(xmlDir, { recursive: true })
  await mkdir(fakeBin)
  await writeFile(join(xmlDir, "Configuration.xml"), "<MetaDataObject/>\n")
  run("git", ["init", "-q"], xmlRepo)
  run("git", ["add", "cf/erp/Configuration.xml"], xmlRepo)
  run("git", ["-c", "user.name=NKDK Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "fixture"], xmlRepo)

  const fakeNode = join(fakeBin, "node")
  await writeFile(fakeNode, `#!/usr/bin/env bash
if [[ "\${1:-}" == *"/.agents/skills/round-trip-yaml/mcp-round-trip.mjs" ]]; then
  while [ "$#" -gt 0 ]; do
    if [ "$1" = "--manifest" ]; then
      cp "$2" "$NKDK_TEST_CAPTURE"
      exit 1
    fi
    shift
  done
fi
exec "$NKDK_TEST_REAL_NODE" "$@"
`)
  await chmod(fakeNode, 0o755)

  const result = spawnSync("bash", [fileURLToPath(new URL("./round-trip.sh", import.meta.url))], {
    encoding: "utf8",
    env: {
      ...process.env,
      NKDK_ROUND_TRIP_YAML_DIR: join(root, "yaml"),
      NKDK_TEST_CAPTURE: capturedInput,
      NKDK_TEST_REAL_NODE: process.execPath,
      NKDK_XML_DIR: xmlDir,
      NKDK_XML_REPO: xmlRepo,
      PATH: `${fakeBin}:${process.env.PATH}`,
      TMPDIR: join(root, "tmp"),
    },
  })
  assert.notEqual(result.status, 0)
  assert.deepEqual(JSON.parse(await readFile(capturedInput, "utf8")), {
    components: [{
      xmlDir,
      yamlDir: join(root, "yaml"),
      xmlOutputDir: join(root, "tmp", "round-trip-yaml-xml", "cf_erp"),
      projectDir: join(root, "tmp", "round-trip-yaml-mcp-project", "cf_erp"),
      componentPath: "cf",
      importOutputPath: join(root, "tmp", "round-trip-yaml-mcp-project", "cf_erp.cf.import-output.json"),
      syncOutputPath: join(root, "tmp", "round-trip-yaml-mcp-project", "cf_erp.cf.sync-output.json"),
    }],
  })
})

test("вызывает единый MCP runner один раз на весь manifest", () => {
  assert.doesNotMatch(script, /\.agents\/tools\/mcp\/call\.mjs/u)
  assert.match(script, /node "\$\{MCP_ROUND_TRIP\}" --manifest/u)
})

test("переиспользует один MCP-проект для основной конфигурации и расширений", () => {
  assert.match(script, /prepare_mcp_project "\$\{MCP_PROJECT_DIR\}"/u)
  assert.match(script, /link_mcp_component "\$\{MCP_PROJECT_DIR\}" "\$\{RUN_YAML_DIR\}" "\$\{RUN_COMPONENT_PATH\}"/u)
  assert.doesNotMatch(script, /mcp_project_dir_for "\$\{RUN_XML_DIR\}"/u)
})
