import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "../../orchestration"
import { mockContextFromXML, mockContextToXML } from "../../../tests/mockContext"
import { readXMLFileAsString } from "../../../tests/readAndParseXMLFile"
import { importContentFromXML } from "../../../xml/import/importer"
import { xmlExport } from "../../../xml/export/exporter"
import { MetadataConfigurationRules } from "./rules"
import type { MetadataConfiguration } from "./types"

const normalizeXML = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n$/, "")

const importConfiguration = (source: string, forReference: boolean): MetadataConfiguration | undefined => {
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(source)
  return importMetadataItemFromXML({
    context: mockContextFromXML({ forReference }),
    rule: MetadataConfigurationRules,
    xml: parsed.MetaDataObject,
  }) as MetadataConfiguration | undefined
}

const roundTripConfigurationXML = (source: string): string => {
  const data = importConfiguration(source, false)
  const referenceData = importConfiguration(source, true)

  const exported = exportMetadataItemToXML({
    context: mockContextToXML(),
    data,
    referenceData,
    rule: MetadataConfigurationRules,
  })

  return xmlExport(exported!)
}

describe("root Configuration XML", () => {
  it("генерирует ContainedObject без reference XML", () => {
    const exported = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: {
        itemType: "MetadataConfiguration",
        name: "Конфигурация",
        defaultLanguage: "Language.Русский",
        configurationExtensionCompatibilityMode: "Version8_3_27",
        compatibilityMode: "Version8_3_27",
      },
      rule: MetadataConfigurationRules,
    })

    const xml = xmlExport(exported!)

    expect(xml).toContain("<xr:ContainedObject>")
    expect(xml).toContain("<xr:ClassId>9cd510cd-abfc-11d4-9434-004095e12fc7</xr:ClassId>")
    expect(xml).toContain("<xr:ObjectId>11111111-1111-4111-8111-111111111111</xr:ObjectId>")
  })

  it("сохраняет ContainedObject из reference XML", () => {
    const source = readXMLFileAsString("configuration/full.xml")
    const xml = roundTripConfigurationXML(source)

    expect(xml).toContain("<InternalInfo>")
    expect(xml).toContain("<xr:ContainedObject>")
    expect(xml).toContain("<xr:ClassId>9cd510cd-abfc-11d4-9434-004095e12fc7</xr:ClassId>")
    expect(xml.indexOf("<InternalInfo>")).toBeLessThan(xml.indexOf("<Properties>"))
    expect(normalizeXML(xml)).toBe(normalizeXML(source))
  })

  it("round-trip минимальной fixture через metadataItem", () => {
    const source = readXMLFileAsString("configuration/minimal.xml")
    const data = importConfiguration(source, false)

    expect(data).toMatchObject({
      itemType: "MetadataConfiguration",
      name: "Конфигурация",
    })

    expect(normalizeXML(roundTripConfigurationXML(source))).toBe(normalizeXML(source))
  })

  it("сохраняет неизвестные корневые XML-узлы из reference", () => {
    const source = readXMLFileAsString("configuration/full.xml")
    const data = importConfiguration(source, false)

    expect(data).toMatchObject({
      itemType: "MetadataConfiguration",
      name: "Конфигурация",
      configurationExtensionCompatibilityMode: "Version8_3_27",
      usePurposes: expect.arrayContaining(["PlatformApplication", "MobilePlatformApplication"]),
      defaultRoles: ["Role.Администратор"],
      vendor: "Поставщик",
      version: "Версия",
      includeHelpInContents: true,
      commonSettingsStorage: "SettingsStorage.ХранилищеНастроек1",
      defaultReportForm: "CommonForm.ОбычнаяГруппа",
      usedMobileApplicationFunctionalities: expect.arrayContaining([
        { functionality: "Biometrics", use: true },
        { functionality: "Location", use: true },
      ]),
      defaultStyle: "Style.Стиль1",
      defaultLanguage: "Language.Русский",
      dataLockControlMode: "AutomaticAndManaged",
      objectAutonumerationMode: "AutoFree",
      modalityUseMode: "UseWithWarnings",
      synchronousPlatformExtensionAndAddInCallUseMode: "UseWithWarnings",
      interfaceCompatibilityMode: "TaxiEnableVersion8_2",
      compatibilityMode: "Version8_3_26",
    })

    expect(normalizeXML(roundTripConfigurationXML(source))).toBe(normalizeXML(source))
  })
})
