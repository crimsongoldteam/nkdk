import { homePageWorkAreaRule, rootCommandInterfaceRule } from "../configuration/builders"
import { booleanRule } from "../../commonObjects/boolean/types"
import { externalPictureRule } from "../../commonObjects/externalPicture/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { metadataItemLinkRule, metadataItemLinksRule } from "../../commonObjects/metadataPath/types"
import { stringRule } from "../../commonObjects/string/types"
import { usePurposesRule } from "../../commonObjects/usePurposes/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import "../../commonObjects/homePageWorkArea/register"
import "../../commonObjects/rootCommandInterface/register"

const properties = ["Properties"]

export const MetadataConfigurationExtensionRules = {
  itemType: "MetadataConfigurationExtension",
  properties: {
    xmlRoot: xmlRootRule({
      container: "Configuration",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      yaml: "Имя",
      xmlParents: properties,
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    configurationExtensionPurpose: systemEnumerationRule({
      yaml: "НазначениеРасширенияКонфигурации",
      typeSE: "ConfigurationExtensionPurpose",
      xmlParents: properties,
      required: true,
    }),
    keepMappingToExtendedConfigurationObjectsByIDs: booleanRule({
      yaml: "ПоддерживатьСоответствиеОбъектамРасширяемойКонфигурацииПоВнутреннимИдентификаторам",
      xmlParents: properties,
    }),
    namePrefix: stringRule({
      yaml: "ПрефиксИмен",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    configurationExtensionCompatibilityMode: systemEnumerationRule({
      yaml: "РежимСовместимостиРасширенияКонфигурации",
      typeSE: "CompatibilityMode",
      defaultValueXML: "Version8_3_27",
      implicitValueYAML: "Version8_3_27",
      preserveExplicitDefaultXML: true,
      xmlParents: properties,
    }),
    defaultRunMode: systemEnumerationRule({
      yaml: "ОсновнойРежимЗапуска",
      typeSE: "ClientRunMode",
      defaultValueXML: "ManagedApplication",
      preserveExplicitDefaultXML: true,
      xmlParents: properties,
    }),
    usePurposes: usePurposesRule({
      yaml: "НазначенияИспользования",
      xml: "UsePurposes",
      xmlParents: properties,
    }),
    scriptVariant: systemEnumerationRule({
      yaml: "ВариантВстроенногоЯзыка",
      typeSE: "ScriptVariant",
      defaultValueXML: "Russian",
      implicitValueYAML: "Russian",
      xmlParents: properties,
    }),
    defaultRoles: metadataItemLinksRule({
      yaml: "ОсновныеРоли",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    vendor: stringRule({
      yaml: "Поставщик",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    version: stringRule({
      yaml: "Версия",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultLanguage: metadataItemLinkRule({
      yaml: "ОсновнойЯзык",
      metadataTarget: { kind: "object", roots: ["Language"] },
      xmlParents: properties,
    }),
    briefInformation: i8nTextRule({
      yaml: "КраткаяИнформация",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    detailedInformation: i8nTextRule({
      yaml: "ПодробнаяИнформация",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    copyright: i8nTextRule({
      yaml: "АвторскиеПрава",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    vendorInformationAddress: i8nTextRule({
      yaml: "АдресИнформацииОПоставщике",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    configurationInformationAddress: i8nTextRule({
      yaml: "АдресИнформацииОКонфигурации",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultReportForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаОтчета",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultReportVariantForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаВариантаОтчета",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultReportSettingsForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаНастроекОтчета",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultDynamicListSettingsForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаНастроекДинамическогоСписка",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultDataHistoryChangeHistoryForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаИсторииИзмененийИсторииДанных",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultDataHistoryVersionDataForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаДанныхВерсииИсторииДанных",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultDataHistoryVersionDifferencesForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаРазличийВерсийИсторииДанных",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultCollaborationSystemUsersChoiceForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаВыбораПользователейСистемыВзаимодействия",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultStyle: metadataItemLinkRule({
      yaml: "ОсновнойСтиль",
      xmlParents: properties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    modalityUseMode: systemEnumerationRule({
      yaml: "РежимИспользованияМодальности",
      typeSE: "ModalityUseMode",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    synchronousPlatformExtensionAndAddInCallUseMode: systemEnumerationRule({
      yaml: "РежимИспользованияСинхронныхВызововРасширенийПлатформыИВнешнихКомпонент",
      typeSE: "SynchronousExtensionAndAddInCallUseMode",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: properties,
    }),
    interfaceCompatibilityMode: systemEnumerationRule({
      yaml: "РежимСовместимостиИнтерфейса",
      typeSE: "InterfaceCompatibilityMode",
      defaultValueXML: "Taxi",
      implicitValueYAML: "Taxi",
      xmlParents: properties,
    }),
    compatibilityMode: systemEnumerationRule({
      yaml: "РежимСовместимости",
      typeSE: "CompatibilityMode",
      defaultValueXML: "Version8_3_27",
      implicitValueYAML: "Version8_3_27",
      preserveExplicitDefaultXML: true,
      xmlParents: properties,
    }),
    commandInterface: rootCommandInterfaceRule({
      yaml: "КомандныйИнтерфейс",
      filePath: "Ext/CommandInterface.xml",
    }),
    homePageWorkArea: homePageWorkAreaRule({
      yaml: "РабочаяОбластьНачальнойСтраницы",
      filePath: "Ext/HomePageWorkArea.xml",
    }),
    mainSectionCommandInterface: rootCommandInterfaceRule({
      yaml: "КомандныйИнтерфейсОсновногоРаздела",
      filePath: "Ext/MainSectionCommandInterface.xml",
    }),
    mainSectionPicture: externalPictureRule({
      nkdkDir: "КартинкаОсновногоРаздела",
      xmlPath: "Ext/MainSectionPicture.xml",
      payloadXmlDir: "Ext/MainSectionPicture",
      syncExternalOnly: true,
    }),
    logo: externalPictureRule({
      nkdkDir: "Логотип",
      xmlPath: "Ext/Logo.xml",
      payloadXmlDir: "Ext/Logo",
      syncExternalOnly: true,
    }),
    splash: externalPictureRule({
      nkdkDir: "Заставка",
      xmlPath: "Ext/Splash.xml",
      payloadXmlDir: "Ext/Splash",
      syncExternalOnly: true,
    }),
  },
} satisfies MetadataItemRule
