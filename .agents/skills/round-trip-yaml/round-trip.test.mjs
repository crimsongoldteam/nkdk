import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

const skill = await readFile(new URL("./SKILL.md", import.meta.url), "utf8")
const script = await readFile(new URL("./round-trip.sh", import.meta.url), "utf8")
const configDirsHelper = fileURLToPath(new URL("../_shared/round-trip-config-dirs.sh", import.meta.url))
const diffHelper = fileURLToPath(new URL("../_shared/round-trip-git-diff.sh", import.meta.url))

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
