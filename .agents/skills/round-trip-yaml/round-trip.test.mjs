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

test("не требует отсутствующих справочных файлов metadata", () => {
  assert.doesNotMatch(skill, /\.agents\/knowledge\/metadata/u)
})

test("запускает импорт и sync с четырьмя работниками", () => {
  const concurrencyValues = [...script.matchAll(/componentPath:"cf",concurrency:(\d+)/gu)]
    .map((match) => Number(match[1]))

  assert.deepEqual(concurrencyValues, [4, 4])
})
