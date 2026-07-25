import { describe, expect, it } from "vitest"
import { importContentFromXML } from "../../../xml/import/importer"
import { testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { MetadataConfigurationExtensionRules } from "./rules"

const DEFAULT_EXTENSION_XML = `
<MetaDataObject>
  <Configuration uuid="11111111-1111-1111-1111-111111111111">
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
  })
})
