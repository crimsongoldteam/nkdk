import fs from "node:fs"
import os from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, describe, expect, it } from "vitest"
import { load } from "js-yaml"
import { mockContextFromXML } from "../../../tests/mockContext"
import { importConfigurationFromXml, createXmlImportWorkerPoolHandle } from "../../importFromXml"
import { appliedObjectSyncCases } from "./yamlFixtures"

const normalizeText = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

describe("applied object XML → YAML import", () => {
  const workerPool = createXmlImportWorkerPoolHandle({ concurrency: 1 })

  afterAll(async () => {
    await workerPool.close()
  })

  it.each(appliedObjectSyncCases)("$label imports XML directly to YAML", async ({ scenario, sync }) => {
    const temporaryRoot = fs.mkdtempSync(join(os.tmpdir(), "applied-import-"))
    try {
      const inputDir = join(temporaryRoot, "xml")
      const projectDir = join(temporaryRoot, "project")
      const outputDir = join(projectDir, "cf")
      const objectXmlDir = join(inputDir, scenario.rule.xmlDir!)
      const fixtureDir = join(dirname(fileURLToPath(scenario.importMetaUrl)), "__fixtures__", "sync", "xml")
      fs.mkdirSync(objectXmlDir, { recursive: true })
      fs.copyFileSync(
        join(import.meta.dirname, "../configuration/__fixtures__/minimal.xml"),
        join(inputDir, "Configuration.xml")
      )
      fs.copyFileSync(join(fixtureDir, `${sync.name}.xml`), join(objectXmlDir, `${sync.name}.xml`))
      copyExternalFixture({
        fixtureDir,
        objectXmlDir,
        name: sync.name,
        externalObjectDir: sync.externalObjectDir === true,
      })

      const result = await importConfigurationFromXml({
        context: mockContextFromXML(),
        inputDir,
        projectDir,
        operationId: `test-${scenario.group}`,
        xmlImportWorkerPoolHandle: workerPool,
      })

      expect(result.failed).toEqual([])
      const yamlPath = join(outputDir, scenario.rule.itemTypePrefix!, sync.name, "Свойства.yaml")
      const actualYAMLText = normalizeText(fs.readFileSync(yamlPath, "utf8"))
      const expectedYAMLText = normalizeText(sync.expectedYAML)
      if (expectedYAMLText === "") expect(actualYAMLText).toBe("")
      else expect(load(actualYAMLText)).toMatchObject(load(expectedYAMLText) as object)
      const expectedObjectDir = join(dirname(fixtureDir), "yaml", sync.name)
      const actualObjectDir = join(outputDir, scenario.rule.itemTypePrefix!, sync.name)
      for (const relativePath of listFiles(expectedObjectDir).filter(isCopiedExternalFile)) {
        const actual = fs.readFileSync(join(actualObjectDir, relativePath))
        const expected = fs.readFileSync(join(expectedObjectDir, relativePath))
        if (isTextExternalFile(relativePath)) {
          expect(normalizeText(actual.toString("utf8")), relativePath).toBe(normalizeText(expected.toString("utf8")))
        } else {
          expect(actual, relativePath).toEqual(expected)
        }
      }
    } finally {
      fs.rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })
})

function copyExternalFixture(params: {
  fixtureDir: string
  objectXmlDir: string
  name: string
  externalObjectDir: boolean
}): void {
  const nestedSource = join(params.fixtureDir, params.name)
  const source = fs.existsSync(nestedSource) ? nestedSource : params.fixtureDir
  if (!fs.existsSync(source)) return
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.name === `${params.name}.xml`) continue
    const target = join(params.objectXmlDir, params.name, entry.name)
    fs.cpSync(join(source, entry.name), target, { recursive: true })
  }
}

const copiedTextExtensions = [".bsl", ".html", ".xsd"]
const copiedBinaryExtensions = [".bin", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".bmp", ".webp", ".zip"]

function isCopiedExternalFile(path: string): boolean {
  const lowerPath = path.toLowerCase()
  return [...copiedTextExtensions, ...copiedBinaryExtensions].some((extension) => lowerPath.endsWith(extension))
}

function isTextExternalFile(path: string): boolean {
  const lowerPath = path.toLowerCase()
  return copiedTextExtensions.some((extension) => lowerPath.endsWith(extension))
}

function listFiles(root: string, current = root): string[] {
  if (!fs.existsSync(current)) return []
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const path = join(current, entry.name)
    return entry.isDirectory() ? listFiles(root, path) : [path.slice(root.length + 1)]
  })
}
