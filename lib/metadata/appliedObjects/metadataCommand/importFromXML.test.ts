import { assertEquals } from "typia"
import { describe, expect, it } from "vitest"
import { simpleCommand } from "~/lib/tests/fixtures/metadataCommand/simple"
import { mockcontext } from "~/lib/tests/mockContext"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { exportMetadataCommandToXML } from "./exportToXML"
import { importMetadataCommandFromXML } from "./importFromXML"
import { MetadataCommand, MetadataCommandXML } from "./types"

describe("importMetadataCommandFromXML", () => {
  it("should import metadata command from XML", () => {
    const xmlData = readAndParseXMLFile<{ Command: MetadataCommandXML }>("metadataCommand/simple.xml")

    const expectedResult = simpleCommand

    expect(assertEquals<MetadataCommandXML>(xmlData.Command)).toEqual(xmlData.Command)

    const result = importMetadataCommandFromXML(mockcontext, xmlData.Command)

    expect(result).toEqual(expectedResult)
  })

  it("should export and import simple command correctly (round-trip)", () => {
    const originalCommand: MetadataCommand = simpleCommand

    const exported = exportMetadataCommandToXML(mockcontext, originalCommand)
    const imported = importMetadataCommandFromXML(mockcontext, exported)

    expect(imported).toEqual(originalCommand)
  })

  it("should export and import command with all fields correctly (round-trip)", () => {
    const originalCommand: MetadataCommand = {
      name: "ТестоваяКоманда",
      synonym: { items: { ru: "Тестовая команда", en: "Test command" } },
      toolTip: { items: { ru: "Подсказка для команды" } },
      comment: "Комментарий к команде",
      group: "FormNavigationPanelImportant",
      modifiesData: true,
      parameterUseMode: "Multiple",
      shortcut: "Ctrl+T",
    }

    const exported = exportMetadataCommandToXML(mockcontext, originalCommand)
    const imported = importMetadataCommandFromXML(mockcontext, exported)

    expect(imported).toEqual(originalCommand)
  })

  it("should export and import command with standard group correctly (round-trip)", () => {
    const originalCommand: MetadataCommand = {
      name: "КомандаСоСтандартнойГруппой",
      group: "FormNavigationPanelImportant",
    }

    const exported = exportMetadataCommandToXML(mockcontext, originalCommand)
    const imported = importMetadataCommandFromXML(mockcontext, exported)

    expect(imported).toEqual(originalCommand)
  })
})
