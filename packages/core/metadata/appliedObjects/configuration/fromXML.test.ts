import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importConfigurationFromXML } from "./fromXML"
import { ConfigurationXML } from "./types"

describe("importConfigurationFromXML", () => {
  it("should import all nodes from full.xml", () => {
    const xmlData = readAndParseXMLFile<{ MetaDataObject: ConfigurationXML }>("configuration/full.xml")

    const result = importConfigurationFromXML(mockContext, xmlData.MetaDataObject)

    expect(result.itemType).toBe("Configuration")
    expect(result.name).toBe("Конфигурация")
    expect(result.synonym).toEqual({ items: { ru: "СинонимКонфигурации" } })
    expect(result.comment).toBe("Комментарий")
    expect(result.vendor).toBe("Поставщик")
    expect(result.version).toBe("Версия")
    expect(result.defaultRunMode).toBe("ManagedApplication")
    expect(result.scriptVariant).toBe("Russian")
    expect(result.includeHelpInContents).toBe(true)
    expect(result.compatibilityMode).toBe("Version8_3_26")
    if (Array.isArray(result.defaultRoles)) {
      expect(result.defaultRoles).toContain("Role.Администратор")
    }
    expect(result.dataLockControlMode).toBe("AutomaticAndManaged")
    expect(result.defaultStyle).toBe("Style.Стиль1")
    expect(result.defaultLanguage).toBe("Language.Русский")
  })

  it("should import minimal nodes from minimal.xml", () => {
    const xmlData = readAndParseXMLFile<{ MetaDataObject: ConfigurationXML }>("configuration/minimal.xml")

    const result = importConfigurationFromXML(mockContext, xmlData.MetaDataObject)

    expect(result).toEqual(minimal)
  })
})
