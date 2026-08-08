import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockXmlImportContext } from "../../tests/mockContext"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { prepareImportYaml } from "./prepareYaml"
import type { ImportAssignment } from "./types"

const fixture = join(import.meta.dirname, "../appliedObjects/metadataCatalog/__fixtures__/full.xml")
const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe("fill value XML import", () => {
  it.each(["type-before", "fill-before"] as const)(
    "нормализует значение после полного дерева при порядке %s",
    async (order) => {
      const sourcePath = copiedFixture(order)
      const collector = createConfigurationIndexCollector()
      const prepared = await prepareImportYaml({
        assignment: assignment(sourcePath),
        context: mockXmlImportContext(),
        collector,
      })

      expect(prepared.yaml).not.toHaveProperty(
        "Реквизиты.СтроковыйРеквизитСИндексом.ЗначениеЗаполнения",
      )
      expect(collector.fragment("Справочник/СправочникПолный/Свойства.yaml").entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ xml: expect.objectContaining({ xsiType: "xs:string" }) }),
        ]),
      )
    },
  )
})

function copiedFixture(order: "type-before" | "fill-before"): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-fill-value-import-"))
  tempDirs.push(dir)
  const sourcePath = join(dir, "СправочникПолный.xml")
  let xml = fs.readFileSync(fixture, "utf8")
  if (order === "fill-before") {
    const start = xml.indexOf("<Name>СтроковыйРеквизитСИндексом</Name>")
    const fill = xml.indexOf('<FillValue xsi:type="xs:string"/>', start)
    const type = xml.indexOf("<Type>", start)
    const fillLineStart = xml.lastIndexOf("\n", fill) + 1
    const fillLineEnd = xml.indexOf("\n", fill) + 1
    const fillLine = xml.slice(fillLineStart, fillLineEnd)
    xml = `${xml.slice(0, fillLineStart)}${xml.slice(fillLineEnd)}`
    const adjustedType = type < fillLineStart ? type : type - fillLine.length
    const typeLineStart = xml.lastIndexOf("\n", adjustedType) + 1
    xml = `${xml.slice(0, typeLineStart)}${fillLine}${xml.slice(typeLineStart)}`
  }
  fs.writeFileSync(sourcePath, xml)
  return sourcePath
}

function assignment(sourcePath: string): ImportAssignment {
  return {
    id: "fill-value",
    role: "properties",
    targetProjectPath: "Справочник/СправочникПолный/Свойства.yaml",
    itemType: "MetadataCatalog",
    itemName: "СправочникПолный",
    logicalAddress: "Справочник.СправочникПолный",
    owner: undefined,
    xmlFiles: [{ role: "metadata", sourcePath }],
    externalFiles: [],
  }
}
