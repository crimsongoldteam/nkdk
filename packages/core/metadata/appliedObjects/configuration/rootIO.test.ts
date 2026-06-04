import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML, mockContextToYAML } from "~/tests/mockContext"
import { getXMLFixturePath, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { importContentFromXML } from "~/xml/import/importer"
import {
  CONFIGURATION_XML_FILE,
  CONFIGURATION_YAML_FILE,
  readConfigurationFromXML,
  readConfigurationFromYAML,
  writeConfigurationToXML,
  writeConfigurationToYAML,
} from "./rootIO"
import { CLEAN_CONFIGURATION_XML, EXPECTED_CLEAN_CONFIGURATION_YAML } from "./cleanConfiguration.fixture"

const normalizeXML = (value: string) => value.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\n$/, "")

const getConfigurationProperties = (xml: string) => {
  const parsed = importContentFromXML<{
    MetaDataObject: { Configuration: { Properties: Record<string, unknown> } }
  }>(xml)

  return parsed.MetaDataObject.Configuration.Properties
}

describe("root Configuration IO", () => {
  let tmpDir: string
  let xmlDir: string
  let yamlDir: string
  let outXmlDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-configuration-root-"))
    xmlDir = join(tmpDir, "xml")
    yamlDir = join(tmpDir, "yaml")
    outXmlDir = join(tmpDir, "out-xml")
    fs.mkdirSync(xmlDir)
    fs.copyFileSync(getXMLFixturePath("configuration/full.xml"), join(xmlDir, CONFIGURATION_XML_FILE))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it("пишет корневой YAML в файл Конфигурация.yaml", () => {
    const configuration = readConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: xmlDir,
    })

    writeConfigurationToYAML({
      context: mockContextToYAML,
      configuration,
      outputDir: yamlDir,
    })

    const yaml = fs.readFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "utf-8")
    expect(yaml).toContain("Имя: Конфигурация")
    expect(yaml).toContain("Поставщик:")
    expect(yaml).not.toContain("ChildObjects")
  })

  it("восстанавливает Configuration.xml из Конфигурация.yaml и reference XML", () => {
    const configuration = readConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: xmlDir,
    })
    const referenceConfiguration = readConfigurationFromXML({
      context: mockContextFromXML({ forReference: true }),
      inputDir: xmlDir,
    })
    writeConfigurationToYAML({
      context: mockContextToYAML,
      configuration,
      outputDir: yamlDir,
    })

    const fromYAML = readConfigurationFromYAML({
      context: mockContextToYAML,
      inputDir: yamlDir,
      source: referenceConfiguration,
    })
    writeConfigurationToXML({
      context: mockContextToXML(),
      configuration: fromYAML,
      referenceConfiguration,
      outputDir: outXmlDir,
    })

    const actual = fs.readFileSync(join(outXmlDir, CONFIGURATION_XML_FILE), "utf-8")
    expect(normalizeXML(actual)).toBe(normalizeXML(readXMLFileAsString("configuration/full.xml")))
  })

  it("сохраняет мобильные ссылки и входящие запросы Поделиться в YAML round-trip", () => {
    const sourceXML = readXMLFileAsString("configuration/full.xml")
      .replace(
        "<MobileApplicationURLs/>",
        `<MobileApplicationURLs>
      <v8:Value xsi:type="app:MobileApplicationURL">
        <app:baseUrl>НавигационнаяСсылкаМобильногоПриложения</app:baseUrl>
        <app:useAndroid>true</app:useAndroid>
        <app:useIOS>true</app:useIOS>
        <app:useWindows>true</app:useWindows>
      </v8:Value>
      <v8:Value xsi:type="app:MobileApplicationURL">
        <app:baseUrl>НавигационнаяСсылкаМобильногоПриложенияПоУмолчанию</app:baseUrl>
        <app:useAndroid>false</app:useAndroid>
        <app:useIOS>false</app:useIOS>
        <app:useWindows>false</app:useWindows>
      </v8:Value>
    </MobileApplicationURLs>`
      )
      .replace(
        "<AllowedIncomingShareRequestTypes/>",
        `<AllowedIncomingShareRequestTypes>
      <v8:Value xsi:type="app:AllowedIncomingShareRequestType">
        <app:mime>ТипСодержимого</app:mime>
        <app:uti>ИдентификаторТипа</app:uti>
        <app:ext>РасшриениеТипа</app:ext>
        <app:processingVariant xsi:type="xs:decimal">0</app:processingVariant>
        <app:isCustom>true</app:isCustom>
      </v8:Value>
    </AllowedIncomingShareRequestTypes>`
      )
    fs.writeFileSync(join(xmlDir, CONFIGURATION_XML_FILE), sourceXML, "utf-8")

    const configuration = readConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: xmlDir,
    })
    const referenceConfiguration = readConfigurationFromXML({
      context: mockContextFromXML({ forReference: true }),
      inputDir: xmlDir,
    })
    writeConfigurationToYAML({
      context: mockContextToYAML,
      configuration,
      outputDir: yamlDir,
    })

    const yaml = fs.readFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "utf-8")
    expect(yaml).toContain("НавигационныеСсылкиМобильногоПриложения:")
    expect(yaml).toContain("ДопустимыеТипыВходящихЗапросовПоделиться:")
    expect(yaml).toContain("baseUrl: НавигационнаяСсылкаМобильногоПриложения")
    expect(yaml).toContain("mime: ТипСодержимого")

    const fromYAML = readConfigurationFromYAML({
      context: mockContextToYAML,
      inputDir: yamlDir,
      source: referenceConfiguration,
    })
    writeConfigurationToXML({
      context: mockContextToXML(),
      configuration: fromYAML,
      referenceConfiguration,
      outputDir: outXmlDir,
    })

    const actual = fs.readFileSync(join(outXmlDir, CONFIGURATION_XML_FILE), "utf-8")
    const properties = getConfigurationProperties(actual)
    const mobileApplicationURLs = (
      properties.MobileApplicationURLs as {
        "v8:Value": Array<{
          "app:baseUrl": string
          "app:useAndroid": boolean | string
          "app:useIOS": boolean | string
          "app:useWindows": boolean | string
        }>
      }
    )["v8:Value"]
    const allowedIncomingShareRequestTypes = (
      properties.AllowedIncomingShareRequestTypes as {
        "v8:Value": {
          "app:mime": string
          "app:uti": string
          "app:ext": string
          "app:processingVariant": { "#text": string; "_xsi:type": string }
          "app:isCustom": boolean | string
        }
      }
    )["v8:Value"]

    expect(mobileApplicationURLs).toEqual([
      expect.objectContaining({
        "app:baseUrl": "НавигационнаяСсылкаМобильногоПриложения",
        "app:useAndroid": "true",
        "app:useIOS": "true",
        "app:useWindows": "true",
      }),
      expect.objectContaining({
        "app:baseUrl": "НавигационнаяСсылкаМобильногоПриложенияПоУмолчанию",
        "app:useAndroid": "false",
        "app:useIOS": "false",
        "app:useWindows": "false",
      }),
    ])
    expect(allowedIncomingShareRequestTypes).toEqual(
      expect.objectContaining({
        "app:mime": "ТипСодержимого",
        "app:uti": "ИдентификаторТипа",
        "app:ext": "РасшриениеТипа",
        "app:processingVariant": { "#text": "0", "_xsi:type": "xs:decimal" },
        "app:isCustom": "true",
      })
    )
  })

  it("импортирует clean Configuration.xml без XML-defaults в модели и YAML", () => {
    fs.writeFileSync(join(xmlDir, CONFIGURATION_XML_FILE), CLEAN_CONFIGURATION_XML, "utf-8")

    const configuration = readConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: xmlDir,
    })

    expect(configuration?.synonym).toBeUndefined()
    expect(configuration?.defaultRoles).toBeUndefined()
    expect(configuration?.additionalFullTextSearchDictionaries).toBeUndefined()
    expect(configuration?.defaultConstantsForm).toBeUndefined()
    expect(configuration?.defaultSearchForm).toBeUndefined()
    expect(configuration?.defaultInterface).toBeUndefined()
    expect(configuration?.standaloneConfigurationRestrictionRoles).toBeUndefined()
    expect(configuration?.usedMobileApplicationFunctionalities).toBeUndefined()

    writeConfigurationToYAML({
      context: mockContextToYAML,
      configuration,
      outputDir: yamlDir,
    })

    const yaml = fs.readFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "utf-8")
    expect(yaml).toBe(EXPECTED_CLEAN_CONFIGURATION_YAML)
  })

  it("восстанавливает clean XML defaults из sparse YAML и reference XML", () => {
    fs.writeFileSync(join(xmlDir, CONFIGURATION_XML_FILE), CLEAN_CONFIGURATION_XML, "utf-8")
    fs.mkdirSync(yamlDir)
    fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), EXPECTED_CLEAN_CONFIGURATION_YAML, "utf-8")

    const referenceConfiguration = readConfigurationFromXML({
      context: mockContextFromXML({ forReference: true }),
      inputDir: xmlDir,
    })
    const fromYAML = readConfigurationFromYAML({
      context: mockContextToYAML,
      inputDir: yamlDir,
      source: referenceConfiguration,
    })

    expect(fromYAML?.configurationExtensionCompatibilityMode).toBe("Version8_3_27")
    expect(fromYAML?.defaultLanguage).toBe("Language.Русский")
    expect(fromYAML?.compatibilityMode).toBe("Version8_3_27")

    writeConfigurationToXML({
      context: mockContextToXML(),
      configuration: fromYAML,
      referenceConfiguration,
      outputDir: outXmlDir,
    })

    const actual = fs.readFileSync(join(outXmlDir, CONFIGURATION_XML_FILE), "utf-8")
    const properties = getConfigurationProperties(actual)
    const mobileFunctionalities = (
      properties.UsedMobileApplicationFunctionalities as {
        "app:functionality": Array<{ "app:functionality": string; "app:use": boolean | string }>
      }
    )["app:functionality"]

    expect(properties.CompatibilityMode).toBe("Version8_3_27")
    expect(properties.ConfigurationExtensionCompatibilityMode).toBe("Version8_3_27")
    expect(properties).toHaveProperty("DefaultConstantsForm")
    expect(properties).toHaveProperty("Content")
    expect(properties).toHaveProperty("RequiredMobileApplicationPermissions")
    expect(properties).toHaveProperty("MobileApplicationURLs")
    expect(properties).toHaveProperty("AllowedIncomingShareRequestTypes")
    expect(mobileFunctionalities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "app:functionality": "Biometrics", "app:use": "true" }),
        expect.objectContaining({ "app:functionality": "OSBackup", "app:use": "true" }),
      ])
    )
  })

  it("восстанавливает мобильную функциональность из sparse YAML без reference XML", () => {
    fs.mkdirSync(yamlDir)
    fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), EXPECTED_CLEAN_CONFIGURATION_YAML, "utf-8")

    const fromYAML = readConfigurationFromYAML({
      context: mockContextToYAML,
      inputDir: yamlDir,
    })

    writeConfigurationToXML({
      context: mockContextToXML(),
      configuration: fromYAML,
      outputDir: outXmlDir,
    })

    const actual = fs.readFileSync(join(outXmlDir, CONFIGURATION_XML_FILE), "utf-8")
    const properties = getConfigurationProperties(actual)

    expect(properties.UsedMobileApplicationFunctionalities).toBeDefined()
  })
})
