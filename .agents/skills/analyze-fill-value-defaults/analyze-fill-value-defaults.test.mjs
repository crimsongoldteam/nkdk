import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { afterEach, test } from "node:test"

const execFileAsync = promisify(execFile)
const skillDir = path.dirname(fileURLToPath(import.meta.url))
const scriptPath = path.join(skillDir, "analyze-fill-value-defaults.mjs")
const temporaryRoots = []

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

test("оболочка создаёт оба отчёта для выбранной конфигурации", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "fill-value-skill-"))
  temporaryRoots.push(root)
  const catalogRoot = path.join(root, "catalog")
  const outputDir = path.join(root, "output")
  const sourceDir = path.join(catalogRoot, "demo", "CommonAttributes")
  await mkdir(sourceDir, { recursive: true })
  await writeFile(
    path.join(sourceDir, "Дата.xml"),
    `<MetaDataObject xmlns:v8="v8" xmlns:xsi="xsi"><CommonAttribute><Properties><Name>Дата</Name><Type><v8:Type>xs:dateTime</v8:Type></Type><FillValue xsi:type="xs:dateTime">0001-01-01T00:00:00</FillValue></Properties></CommonAttribute></MetaDataObject>`,
  )

  await execFileAsync(process.execPath, [
    scriptPath,
    catalogRoot,
    "--output", outputDir,
    "--configuration", "demo",
  ])

  await Promise.all([
    access(path.join(outputDir, "fill-value-defaults.json")),
    access(path.join(outputDir, "fill-value-defaults.md")),
  ])
})

test("оболочка передаёт справку CLI", async () => {
  const { stdout } = await execFileAsync(process.execPath, [scriptPath, "--help"])
  assert.match(stdout, /--configuration/)
  assert.match(stdout, /--examples/)
})
