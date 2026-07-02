import {
  allowedIncomingShareRequestTypesRule,
  clientApplicationInterfaceRule,
  homePageWorkAreaRule,
  mobileApplicationURLsRule,
  rootCommandInterfaceRule,
  usedMobileApplicationFunctionalitiesRule,
} from "./builders"
import { externalFileRule } from "../../commonObjects/externalFile/types"
import { externalPictureRule } from "../../commonObjects/externalPicture/types"
import { helpRule } from "../../commonObjects/help/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { metadataItemLinkRule, metadataItemLinksRule } from "../../commonObjects/metadataPath/types"
import { usePurposesRule } from "../../commonObjects/usePurposes/types"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import "./allowedIncomingShareRequestTypes"
import "./mobileApplicationURLs"
import "./usedMobileApplicationFunctionalities"
import "../../commonObjects/clientApplicationInterface/register"
import "../../commonObjects/homePageWorkArea/register"
import "../../commonObjects/rootCommandInterface/register"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
const configurationProperties = ["Properties"]
const configurationInternalInfoContainedObjectClassIds = [
  "9cd510cd-abfc-11d4-9434-004095e12fc7",
  "9fcd25a0-4822-11d4-9414-008048da11f9",
  "e3687481-0a87-462c-a166-9f34594f9bba",
  "9de14907-ec23-4a07-96f0-85521cb6b53b",
  "51f2d5d8-ea4d-4064-8892-82951750031e",
  "e68182ea-4237-4383-967f-90c1e3370bc7",
  "fb282519-d103-4dd3-bc12-cb271d631dfc",
]
export const MetadataConfigurationRules = {
  itemType: "MetadataConfiguration",
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
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      preserveFromReferenceXML: true,
      exportWithoutReferenceXML: true,
      containedObjectClassIds: configurationInternalInfoContainedObjectClassIds,
    }),
    name: stringRule({
      yaml: "Имя",
      xmlParents: configurationProperties,
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    namePrefix: stringRule({
      yaml: "ПрефиксИмен",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    configurationExtensionCompatibilityMode: systemEnumerationRule({
      yaml: "РежимСовместимостиРасширенияКонфигурации",
      typeSE: "CompatibilityMode",
      defaultValueXML: "Version8_3_27",
      implicitValueYAML: "Version8_3_27",
      preserveExplicitDefaultXML: true,
      xmlParents: configurationProperties,
    }),
    defaultRunMode: systemEnumerationRule({
      yaml: "ОсновнойРежимЗапуска",
      typeSE: "ClientRunMode",
      defaultValueXML: "ManagedApplication",
      implicitValueYAML: "ManagedApplication",
      xmlParents: configurationProperties,
    }),
    usePurposes: usePurposesRule({
      yaml: "НазначенияИспользования",
      xml: "UsePurposes",
      xmlParents: configurationProperties,
    }),
    scriptVariant: systemEnumerationRule({
      yaml: "ВариантВстроенногоЯзыка",
      typeSE: "ScriptVariant",
      defaultValueXML: "Russian",
      implicitValueYAML: "Russian",
      xmlParents: configurationProperties,
    }),
    defaultRoles: metadataItemLinksRule({
      yaml: "ОсновныеРоли",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    vendor: stringRule({
      yaml: "Поставщик",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    version: stringRule({
      yaml: "Версия",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    updateCatalogAddress: stringRule({
      yaml: "АдресКаталогаОбновлений",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: configurationProperties,
    }),
    useManagedFormInOrdinaryApplication: booleanRule({
      yaml: "ИспользоватьУправляемыеФормыВОбычномПриложении",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: configurationProperties,
    }),
    useOrdinaryFormInManagedApplication: booleanRule({
      yaml: "ИспользоватьОбычныеФормыВУправляемомПриложении",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents: configurationProperties,
    }),
    additionalFullTextSearchDictionaries: metadataItemLinksRule({
      yaml: "ДополнительныеСловариПолнотекстовогоПоиска",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    commonSettingsStorage: metadataItemLinkRule({
      yaml: "ХранилищеОбщихНастроек",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    reportsUserSettingsStorage: metadataItemLinkRule({
      yaml: "ХранилищеПользовательскихНастроекОтчетов",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    reportsVariantsStorage: metadataItemLinkRule({
      yaml: "ХранилищеВариантовОтчетов",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    formDataSettingsStorage: metadataItemLinkRule({
      yaml: "ХранилищеНастроекДанныхФорм",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    dynamicListsUserSettingsStorage: metadataItemLinkRule({
      yaml: "ХранилищеПользовательскихНастроекДинамическихСписков",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    urlExternalDataStorage: metadataItemLinkRule({
      yaml: "ХранилищеВнешнихДанныхНавигационныхСсылок",
      xml: "URLExternalDataStorage",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    content: stringRule({
      xml: "Content",
      defaultValueXML: "",
      defaultValueXMLRaw: "",
      toYAML: false,
      fromYAML: false,
      xmlParents: configurationProperties,
    }),
    defaultReportForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаОтчета",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultReportVariantForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаВариантаОтчета",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultReportSettingsForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаНастроекОтчета",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultReportAppearanceTemplate: stringRule({
      yaml: "ОсновнойМакетОформленияОтчета",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultDynamicListSettingsForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаНастроекДинамическогоСписка",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultSearchForm: stringRule({
      yaml: "ОсновнаяФормаПоиска",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultDataHistoryChangeHistoryForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаИсторииИзмененийИсторииДанных",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultDataHistoryVersionDataForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаДанныхВерсииИсторииДанных",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultDataHistoryVersionDifferencesForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаРазличийВерсийИсторииДанных",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultCollaborationSystemUsersChoiceForm: metadataItemLinkRule({
      yaml: "ОсновнаяФормаВыбораПользователейСистемыВзаимодействия",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    requiredMobileApplicationPermissions: stringRule({
      xml: "RequiredMobileApplicationPermissions",
      defaultValueXML: "",
      defaultValueXMLRaw: "",
      toYAML: false,
      fromYAML: false,
      xmlParents: configurationProperties,
    }),
    usedMobileApplicationFunctionalities: usedMobileApplicationFunctionalitiesRule({
      yaml: "ИспользуемаяФункциональностьМобильногоПриложения",
      xmlParents: configurationProperties,
    }),
    standaloneConfigurationRestrictionRoles: metadataItemLinksRule({
      yaml: "РолиОграниченияАвтономнойКонфигурации",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    mobileApplicationURLs: mobileApplicationURLsRule({
      yaml: "НавигационныеСсылкиМобильногоПриложения",
      xml: "MobileApplicationURLs",
      defaultValueXML: "",
      defaultValueXMLRaw: "",
      xmlParents: configurationProperties,
    }),
    allowedIncomingShareRequestTypes: allowedIncomingShareRequestTypesRule({
      yaml: "ДопустимыеТипыВходящихЗапросовПоделиться",
      xml: "AllowedIncomingShareRequestTypes",
      defaultValueXML: "",
      defaultValueXMLRaw: "",
      xmlParents: configurationProperties,
    }),
    mainClientApplicationWindowMode: systemEnumerationRule({
      yaml: "РежимОсновногоОкнаКлиентскогоПриложения",
      typeSE: "MainClientApplicationWindowMode",
      defaultValueXML: "Normal",
      implicitValueYAML: "Normal",
      xmlParents: configurationProperties,
    }),
    defaultInterface: stringRule({
      yaml: "ОсновнойИнтерфейс",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultStyle: metadataItemLinkRule({
      yaml: "ОсновнойСтиль",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    defaultLanguage: metadataItemLinkRule({
      yaml: "ОсновнойЯзык",
      metadataTarget: { kind: "object", roots: ["Language"] },
      required: true,
      xmlParents: configurationProperties,
    }),
    briefInformation: i8nTextRule({
      yaml: "КраткаяИнформация",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    detailedInformation: i8nTextRule({
      yaml: "ПодробнаяИнформация",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    copyright: i8nTextRule({
      yaml: "АвторскиеПрава",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    vendorInformationAddress: i8nTextRule({
      yaml: "АдресИнформацииОПоставщике",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    configurationInformationAddress: i8nTextRule({
      yaml: "АдресИнформацииОКонфигурации",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    dataLockControlMode: systemEnumerationRule({
      yaml: "РежимУправленияБлокировкойДанных",
      typeSE: "DataLockControlMode",
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
      xmlParents: configurationProperties,
    }),
    objectAutonumerationMode: systemEnumerationRule({
      yaml: "РежимАвтонумерацииОбъектов",
      typeSE: "ObjectAutonumerationMode",
      defaultValueXML: "NotAutoFree",
      implicitValueYAML: "NotAutoFree",
      xmlParents: configurationProperties,
    }),
    modalityUseMode: systemEnumerationRule({
      yaml: "РежимИспользованияМодальности",
      typeSE: "ModalityUseMode",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: configurationProperties,
    }),
    synchronousPlatformExtensionAndAddInCallUseMode: systemEnumerationRule({
      yaml: "РежимИспользованияСинхронныхВызововРасширенийПлатформыИВнешнихКомпонент",
      typeSE: "SynchronousExtensionAndAddInCallUseMode",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: configurationProperties,
    }),
    interfaceCompatibilityMode: systemEnumerationRule({
      yaml: "РежимСовместимостиИнтерфейса",
      typeSE: "InterfaceCompatibilityMode",
      defaultValueXML: "Taxi",
      implicitValueYAML: "Taxi",
      xmlParents: configurationProperties,
    }),
    databaseTablespacesUseMode: systemEnumerationRule({
      yaml: "РежимИспользованияТабличныхПространствБазыДанных",
      typeSE: "DatabaseTablespacesUseMode",
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
      xmlParents: configurationProperties,
    }),
    compatibilityMode: systemEnumerationRule({
      yaml: "РежимСовместимости",
      typeSE: "CompatibilityMode",
      defaultValueXML: "Version8_3_27",
      implicitValueYAML: "Version8_3_27",
      preserveExplicitDefaultXML: true,
      xmlParents: configurationProperties,
    }),
    defaultConstantsForm: stringRule({
      yaml: "ОсновнаяФормаКонстант",
      xmlParents: configurationProperties,
      defaultValueXML: "",
      defaultValueXMLRaw: "",
    }),
    managedApplicationModule: moduleRule({
      nkdkPath: "МодульПриложения.bsl",
      xmlPath: "Ext/ManagedApplicationModule.bsl",
      syncExternalOnly: true,
    }),
    sessionModule: moduleRule({
      nkdkPath: "МодульСеанса.bsl",
      xmlPath: "Ext/SessionModule.bsl",
      syncExternalOnly: true,
    }),
    externalConnectionModule: moduleRule({
      nkdkPath: "МодульВнешнегоСоединения.bsl",
      xmlPath: "Ext/ExternalConnectionModule.bsl",
      syncExternalOnly: true,
    }),
    ordinaryApplicationModule: moduleRule({
      nkdkPath: "МодульОбычногоПриложения.bsl",
      xmlPath: "Ext/OrdinaryApplicationModule.bsl",
      syncExternalOnly: true,
    }),
    commandInterface: rootCommandInterfaceRule({
      yaml: "КомандныйИнтерфейс",
      filePath: "Ext/CommandInterface.xml",
    }),
    mainSectionCommandInterface: rootCommandInterfaceRule({
      yaml: "КомандныйИнтерфейсОсновногоРаздела",
      filePath: "Ext/MainSectionCommandInterface.xml",
    }),
    clientApplicationInterface: clientApplicationInterfaceRule({
      yaml: "ИнтерфейсКлиентскогоПриложения",
      filePath: "Ext/ClientApplicationInterface.xml",
    }),
    homePageWorkArea: homePageWorkAreaRule({
      yaml: "РабочаяОбластьНачальнойСтраницы",
      filePath: "Ext/HomePageWorkArea.xml",
    }),
    help: helpRule({
      filePath: "Ext/Help.xml",
      nkdkDir: "Справка",
    }),
    mobileClientSignature: externalFileRule({
      nkdkPath: "ПодписьМобильногоКлиента.bin",
      xmlPath: "Ext/MobileClientSignature.bin",
      syncExternalOnly: true,
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
    standaloneConfigurationContent: externalFileRule({
      nkdkPath: "СодержимоеАвтономнойКонфигурации.bin",
      xmlPath: "Ext/StandaloneConfigurationContent.bin",
      syncExternalOnly: true,
    }),
  },
} satisfies MetadataItemRule
