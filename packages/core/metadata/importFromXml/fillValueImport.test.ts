import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockXmlImportContext } from "../../tests/mockContext"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import { prepareImportYaml } from "./prepareYaml"
import type { ImportAssignment } from "./types"
import { registerCoreMetadata } from "../composition/coreMetadata"
import { yamlScalarTagAt } from "../../yaml/scalarTags"

registerCoreMetadata()

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
      expect(prepared.yaml).not.toHaveProperty(
        "СтандартныеРеквизиты.ПометкаУдаления.ЗначениеЗаполнения",
      )
      expect(collector.fragment("Справочник/СправочникПолный/Свойства.yaml").entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ xml: expect.objectContaining({ xsiType: "xs:string" }) }),
        ]),
      )
    },
  )

  it("удаляет начальную дату после import и сохраняет её XML-состояние", async () => {
    const sourcePath = copiedDateFixture()
    const collector = createConfigurationIndexCollector()
    const prepared = await prepareImportYaml({
      assignment: assignment(sourcePath),
      context: mockXmlImportContext(),
      collector,
    })

    expect(prepared.yaml).not.toHaveProperty(
      "Реквизиты.СтроковыйРеквизитСИндексом.ЗначениеЗаполнения",
    )
    expect(collector.fragment("Справочник/СправочникПолный/Свойства.yaml").entities).toContainEqual({
      logicalAddress: "Справочник.СправочникПолный.Реквизит.СтроковыйРеквизитСИндексом.fillValue",
      sourceProjectPath: "Справочник/СправочникПолный/Свойства.yaml",
      xml: { xsiType: "xs:dateTime", xmlText: "0001-01-01T00:00:00" },
    })
  })

  it("помечает несовместимое значение заполнения тегом !xml", async () => {
    const sourcePath = copiedInvalidFixture()
    const prepared = await prepareImportYaml({
      assignment: assignment(sourcePath),
      context: mockXmlImportContext(),
      collector: createConfigurationIndexCollector(),
    })

    const yaml = prepared.yaml as Record<string, unknown>
    const attributes = yaml.Реквизиты as Record<string, Record<string, unknown>>
    const attribute = attributes.СтроковыйРеквизитСИндексом
    expect(attribute.ЗначениеЗаполнения).toBe("!xml 1")
    expect(yamlScalarTagAt(attribute, "ЗначениеЗаполнения")).toBe("xml")
  })
})

function copiedInvalidFixture(): string {
  return copiedTransformedFixture("invalid", (attribute) => attribute.replace(
    '<FillValue xsi:type="xs:string"/>',
    '<FillValue xsi:type="xs:decimal">1</FillValue>',
  ))
}

function copiedDateFixture(): string {
  return copiedTransformedFixture("date", (attribute) => attribute
    .replace(/<Type>[\s\S]*?<\/Type>/, "<Type><v8:Type>xs:dateTime</v8:Type></Type>")
    .replace(
      '<FillValue xsi:type="xs:string"/>',
      '<FillValue xsi:type="xs:dateTime">0001-01-01T00:00:00</FillValue>',
    ))
}

function copiedTransformedFixture(
  name: string,
  transformAttribute: (attribute: string) => string,
): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), `nkdk-fill-value-${name}-import-`))
  tempDirs.push(dir)
  const sourcePath = join(dir, "СправочникПолный.xml")
  const xml = fs.readFileSync(fixture, "utf8")
  const start = xml.indexOf("<Name>СтроковыйРеквизитСИндексом</Name>")
  const end = xml.indexOf("</Attribute>", start)
  const attribute = transformAttribute(xml.slice(start, end))
  fs.writeFileSync(sourcePath, `${xml.slice(0, start)}${attribute}${xml.slice(end)}`)
  return sourcePath
}

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
