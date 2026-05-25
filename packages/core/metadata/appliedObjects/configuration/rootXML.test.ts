import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { MetadataConfigurationRules } from "./rules"
import type { MetadataConfiguration } from "./types"

const normalizeXML = (value: string) => value.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\n$/, "")

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
      namePrefix: "",
      configurationExtensionCompatibilityMode: "Version8_3_27",
      defaultRunMode: "ManagedApplication",
      usePurposes: expect.arrayContaining(["PlatformApplication", "MobilePlatformApplication"]),
      scriptVariant: "Russian",
      defaultRoles: ["Role.Администратор"],
      vendor: "Поставщик",
      version: "Версия",
      includeHelpInContents: true,
      additionalFullTextSearchDictionaries: [],
      commonSettingsStorage: "SettingsStorage.ХранилищеНастроек1",
      defaultReportForm: "CommonForm.ОбычнаяГруппа",
      usedMobileApplicationFunctionalities: expect.arrayContaining([
        { functionality: "Biometrics", use: true },
        { functionality: "Location", use: true },
      ]),
      standaloneConfigurationRestrictionRoles: [],
      mainClientApplicationWindowMode: "Normal",
      defaultInterface: "",
      defaultStyle: "Style.Стиль1",
      defaultLanguage: "Language.Русский",
      dataLockControlMode: "AutomaticAndManaged",
      objectAutonumerationMode: "AutoFree",
      modalityUseMode: "UseWithWarnings",
      synchronousPlatformExtensionAndAddInCallUseMode: "UseWithWarnings",
      interfaceCompatibilityMode: "TaxiEnableVersion8_2",
      databaseTablespacesUseMode: "DontUse",
      compatibilityMode: "Version8_3_26",
      defaultConstantsForm: "",
    })

    expect(normalizeXML(roundTripConfigurationXML(source))).toBe(normalizeXML(source))
  })
})
