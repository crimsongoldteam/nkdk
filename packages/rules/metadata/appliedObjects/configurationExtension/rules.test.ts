import { describe, expect, it } from "vitest"
import { importContentFromXML } from "@nkdk/runtime"
import {
  createDirectRoundTripContexts,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../tests/directConversion"
import { MetadataConfigurationExtensionRules } from "./rules"
import { MetadataConfigurationRules } from "../configuration/rules"

const DEFAULT_EXTENSION_XML = `
<MetaDataObject>
  <Configuration uuid="11111111-1111-1111-1111-111111111111">
    <InternalInfo>
      <xr:ContainedObject>
        <xr:ClassId>9cd510cd-abfc-11d4-9434-004095e12fc7</xr:ClassId>
        <xr:ObjectId>22222222-2222-4222-8222-222222222222</xr:ObjectId>
      </xr:ContainedObject>
    </InternalInfo>
    <Properties>
      <ObjectBelonging>Adopted</ObjectBelonging>
      <Name>РасширениеПоУмолчанию</Name>
      <ConfigurationExtensionPurpose>Customization</ConfigurationExtensionPurpose>
      <KeepMappingToExtendedConfigurationObjectsByIDs>true</KeepMappingToExtendedConfigurationObjectsByIDs>
      <NamePrefix>Расш1_</NamePrefix>
      <ConfigurationExtensionCompatibilityMode>Version8_3_27</ConfigurationExtensionCompatibilityMode>
      <DefaultRunMode>ManagedApplication</DefaultRunMode>
      <UsePurposes/>
      <ScriptVariant>Russian</ScriptVariant>
      <DefaultRoles/>
      <Vendor/>
      <Version/>
      <DefaultLanguage>Language.Русский</DefaultLanguage>
      <InterfaceCompatibilityMode>TaxiEnableVersion8_2</InterfaceCompatibilityMode>
      <UnknownExtensionProperty>пропустить</UnknownExtensionProperty>
    </Properties>
  </Configuration>
</MetaDataObject>
`

const CONTROL_EXTENSION_XML = `
<MetaDataObject>
  <Configuration uuid="22222222-2222-2222-2222-222222222222">
    <Properties>
      <ObjectBelonging>Adopted</ObjectBelonging>
      <Name>РасширениеКонтроль</Name>
      <ConfigurationExtensionPurpose>Customization</ConfigurationExtensionPurpose>
      <DefaultRunMode>ManagedApplication</DefaultRunMode>
      <Notify>true</Notify>
    </Properties>
  </Configuration>
</MetaDataObject>
`

const parseRoot = (xml: string) => importContentFromXML<Record<string, unknown>>(xml).MetaDataObject

describe("MetadataConfigurationExtensionRules", () => {
  it("импортирует разрешённые корневые свойства расширения и пропускает служебные", () => {
    const { yaml } = testMetadataItemFromXMLToYAML({
      rule: MetadataConfigurationExtensionRules,
      xml: parseRoot(DEFAULT_EXTENSION_XML),
      name: "РасширениеПоУмолчанию",
    })

    expect(yaml).toMatchObject({
      Имя: "РасширениеПоУмолчанию",
      НазначениеРасширенияКонфигурации: "Адаптация",
      ПоддерживатьСоответствиеОбъектамРасширяемойКонфигурацииПоВнутреннимИдентификаторам: "Истина",
      ПрефиксИмен: "Расш1_",
      ОсновнойЯзык: "Русский",
    })
    expect(yaml).not.toHaveProperty("ObjectBelonging")
    expect(yaml).not.toHaveProperty("ExtendedConfigurationObject")
    expect(yaml).not.toHaveProperty("UnknownExtensionProperty")
  })

  it("не добавляет отсутствующий основной язык и не обрабатывает Notify", () => {
    const { yaml } = testMetadataItemFromXMLToYAML({
      rule: MetadataConfigurationExtensionRules,
      xml: parseRoot(CONTROL_EXTENSION_XML),
      name: "РасширениеКонтроль",
    })

    expect(yaml).toMatchObject({
      Имя: "РасширениеКонтроль",
      ОсновнойРежимЗапуска: "УправляемоеПриложение",
    })
    expect(yaml).not.toHaveProperty("ОсновнойЯзык")
    expect(yaml).not.toHaveProperty("Контроль")
    expect(yaml).not.toHaveProperty("РежимИспользованияМодальности")
    expect(yaml).not.toHaveProperty(
      "РежимИспользованияСинхронныхВызововРасширенийПлатформыИВнешнихКомпонент"
    )
    expect(yaml).not.toHaveProperty("РежимСовместимости")
  })

  it("восстанавливает InternalInfo корня из снимка расширения", () => {
    const contexts = createDirectRoundTripContexts({ logicalAddress: "Конфигурация" })
    const importContext = {
      ...contexts.importContext,
      fromXML: {
        ...contexts.importContext.fromXML,
        metadataItemAugmenter: "configurationExtension",
      },
    }
    const imported = testMetadataItemFromXMLToYAML({
      rule: MetadataConfigurationExtensionRules,
      xml: parseRoot(DEFAULT_EXTENSION_XML),
      context: importContext,
      name: "РасширениеПоУмолчанию",
    })
    const exportContext = contexts.exportContext()

    const exported = testMetadataItemFromYAMLToXML({
      rule: MetadataConfigurationExtensionRules,
      yaml: imported.yaml,
      context: {
        ...exportContext,
        exportToXML: {
          ...exportContext.exportToXML,
          componentKind: "configurationExtension",
          xmlDefaultVariantByLogicalAddress: { Конфигурация: "adopted" },
        },
      },
      name: "РасширениеПоУмолчанию",
    })

    expect(exported.xml).toHaveProperty(
      "MetaDataObject.Configuration.InternalInfo.xr:ContainedObject"
    )
  })

  it("восстанавливает обязательный синоним корня расширения из имени", () => {
    const contexts = createDirectRoundTripContexts({ logicalAddress: "Конфигурация" })
    const imported = testMetadataItemFromXMLToYAML({
      rule: MetadataConfigurationExtensionRules,
      xml: parseRoot(`
        <MetaDataObject>
          <Configuration uuid="11111111-1111-1111-1111-111111111111">
            <Properties>
              <Name>РасширениеПоУмолчанию</Name>
              <Synonym>
                <v8:item>
                  <v8:lang>ru</v8:lang>
                  <v8:content>Расширение по умолчанию</v8:content>
                </v8:item>
              </Synonym>
              <ConfigurationExtensionPurpose>Customization</ConfigurationExtensionPurpose>
            </Properties>
          </Configuration>
        </MetaDataObject>
      `),
      context: contexts.importContext,
      name: "РасширениеПоУмолчанию",
    })

    expect(imported.yaml).not.toHaveProperty("Синоним")

    const exported = testMetadataItemFromYAMLToXML({
      rule: MetadataConfigurationExtensionRules,
      yaml: imported.yaml,
      context: {
        ...contexts.exportContext(),
        exportToXML: {
          ...contexts.exportContext().exportToXML,
          componentKind: "configurationExtension",
          xmlDefaultVariantByLogicalAddress: { Конфигурация: "adopted" },
        },
      },
      name: "РасширениеПоУмолчанию",
    })

    expect(exported.xml).toHaveProperty(
      "MetaDataObject.Configuration.Properties.Synonym.v8:item",
      [{ "v8:lang": "ru", "v8:content": "Расширение по умолчанию" }]
    )
  })

  it("использует общий формат интерфейса клиентского приложения", () => {
    expect((MetadataConfigurationExtensionRules.properties as Record<string, unknown>).clientApplicationInterface)
      .toBe(MetadataConfigurationRules.properties.clientApplicationInterface)
  })

  it("использует общий индекс порядка ChildObjects", () => {
    expect(MetadataConfigurationExtensionRules.properties.childObjects)
      .toBe(MetadataConfigurationRules.properties.childObjects)
  })

  it("разделяет снимки внешних командных интерфейсов по пути YAML", () => {
    expect(MetadataConfigurationExtensionRules.properties.commandInterface.configurationIndexAddressing)
      .toBe("yamlPath")
    expect(MetadataConfigurationExtensionRules.properties.mainSectionCommandInterface.configurationIndexAddressing)
      .toBe("yamlPath")
  })

  it.each([
    ["managedApplicationModule", "МодульПриложения.bsl", "Ext/ManagedApplicationModule.bsl"],
    ["sessionModule", "МодульСеанса.bsl", "Ext/SessionModule.bsl"],
    ["externalConnectionModule", "МодульВнешнегоСоединения.bsl", "Ext/ExternalConnectionModule.bsl"],
    ["ordinaryApplicationModule", "МодульОбычногоПриложения.bsl", "Ext/OrdinaryApplicationModule.bsl"],
    [
      "standaloneConfigurationContent",
      "СодержимоеАвтономнойКонфигурации.bin",
      "Ext/StandaloneConfigurationContent.bin",
    ],
  ])("использует общий корневой внешний ресурс %s", (property, nkdkPath, xmlPath) => {
    const extensionRule = (MetadataConfigurationExtensionRules.properties as Record<string, unknown>)[property]
    const configurationRule = (MetadataConfigurationRules.properties as Record<string, unknown>)[property]

    expect(extensionRule).toBe(configurationRule)
    expect(extensionRule).toMatchObject({ nkdkPath, xmlPath, syncExternalOnly: true })
  })
})
