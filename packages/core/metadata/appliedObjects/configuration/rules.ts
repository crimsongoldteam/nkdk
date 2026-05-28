import "./usedMobileApplicationFunctionalities"
import "~/metadata/commonObjects/clientApplicationInterface/register"
import "~/metadata/commonObjects/homePageWorkArea/register"
import "~/metadata/commonObjects/rootCommandInterface/register"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

const configurationProperties = ["Properties"]

export const MetadataConfigurationRules = {
  itemType: "MetadataConfiguration",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "Configuration",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      yaml: "Имя",
      type: "string",
      xmlParents: configurationProperties,
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: configurationProperties,
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: configurationProperties,
    },
    namePrefix: {
      yaml: "ПрефиксИмен",
      type: "string",
      xmlParents: configurationProperties,
      defaultValueXMLEmpty: "",
    },
    configurationExtensionCompatibilityMode: {
      yaml: "РежимСовместимостиРасширенияКонфигурации",
      type: "string",
      xmlParents: configurationProperties,
    },
    defaultRunMode: {
      yaml: "ОсновнойРежимЗапуска",
      type: "SystemEnumeration",
      typeSE: "ClientRunMode",
      xmlParents: configurationProperties,
    },
    usePurposes: {
      yaml: "НазначенияИспользования",
      xml: "UsePurposes",
      type: "UsePurposes",
      xmlParents: configurationProperties,
    },
    scriptVariant: {
      yaml: "ВариантВстроенногоЯзыка",
      type: "SystemEnumeration",
      typeSE: "ScriptVariant",
      xmlParents: configurationProperties,
    },
    defaultRoles: {
      yaml: "ОсновныеРоли",
      type: "MetadataItemLinks",
      xmlParents: configurationProperties,
    },
    vendor: {
      yaml: "Поставщик",
      type: "string",
      xmlParents: configurationProperties,
    },
    version: {
      yaml: "Версия",
      type: "string",
      xmlParents: configurationProperties,
    },
    updateCatalogAddress: {
      yaml: "АдресКаталогаОбновлений",
      type: "string",
      xmlParents: configurationProperties,
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      type: "boolean",
      xmlParents: configurationProperties,
    },
    useManagedFormInOrdinaryApplication: {
      yaml: "ИспользоватьУправляемыеФормыВОбычномПриложении",
      type: "boolean",
      xmlParents: configurationProperties,
    },
    useOrdinaryFormInManagedApplication: {
      yaml: "ИспользоватьОбычныеФормыВУправляемомПриложении",
      type: "boolean",
      xmlParents: configurationProperties,
    },
    additionalFullTextSearchDictionaries: {
      yaml: "ДополнительныеСловариПолнотекстовогоПоиска",
      type: "MetadataItemLinks",
      xmlParents: configurationProperties,
      defaultValueXMLEmpty: [],
    },
    commonSettingsStorage: {
      yaml: "ХранилищеОбщихНастроек",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    reportsUserSettingsStorage: {
      yaml: "ХранилищеПользовательскихНастроекОтчетов",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    reportsVariantsStorage: {
      yaml: "ХранилищеВариантовОтчетов",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    formDataSettingsStorage: {
      yaml: "ХранилищеНастроекДанныхФорм",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    dynamicListsUserSettingsStorage: {
      yaml: "ХранилищеПользовательскихНастроекДинамическихСписков",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    urlExternalDataStorage: {
      yaml: "ХранилищеВнешнихДанныхНавигационныхСсылок",
      xml: "URLExternalDataStorage",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    defaultReportForm: {
      yaml: "ОсновнаяФормаОтчета",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    defaultReportVariantForm: {
      yaml: "ОсновнаяФормаВариантаОтчета",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    defaultReportSettingsForm: {
      yaml: "ОсновнаяФормаНастроекОтчета",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    defaultReportAppearanceTemplate: {
      yaml: "ОсновнойМакетОформленияОтчета",
      type: "string",
      xmlParents: configurationProperties,
    },
    defaultDynamicListSettingsForm: {
      yaml: "ОсновнаяФормаНастроекДинамическогоСписка",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    defaultSearchForm: {
      yaml: "ОсновнаяФормаПоиска",
      type: "string",
      xmlParents: configurationProperties,
      defaultValueXMLEmpty: "",
    },
    defaultDataHistoryChangeHistoryForm: {
      yaml: "ОсновнаяФормаИсторииИзмененийИсторииДанных",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    defaultDataHistoryVersionDataForm: {
      yaml: "ОсновнаяФормаДанныхВерсииИсторииДанных",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    defaultDataHistoryVersionDifferencesForm: {
      yaml: "ОсновнаяФормаРазличийВерсийИсторииДанных",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    defaultCollaborationSystemUsersChoiceForm: {
      yaml: "ОсновнаяФормаВыбораПользователейСистемыВзаимодействия",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    usedMobileApplicationFunctionalities: {
      yaml: "ИспользуемаяФункциональностьМобильногоПриложения",
      type: "UsedMobileApplicationFunctionalities",
      xmlParents: configurationProperties,
    },
    standaloneConfigurationRestrictionRoles: {
      yaml: "РолиОграниченияАвтономнойКонфигурации",
      type: "MetadataItemLinks",
      xmlParents: configurationProperties,
      defaultValueXMLEmpty: [],
    },
    mainClientApplicationWindowMode: {
      yaml: "РежимОсновногоОкнаКлиентскогоПриложения",
      type: "SystemEnumeration",
      typeSE: "MainClientApplicationWindowMode",
      xmlParents: configurationProperties,
    },
    defaultInterface: {
      yaml: "ОсновнойИнтерфейс",
      type: "string",
      xmlParents: configurationProperties,
      defaultValueXMLEmpty: "",
    },
    defaultStyle: {
      yaml: "ОсновнойСтиль",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    defaultLanguage: {
      yaml: "ОсновнойЯзык",
      type: "MetadataItemLink",
      xmlParents: configurationProperties,
    },
    briefInformation: {
      yaml: "КраткаяИнформация",
      type: "I8nText",
      xmlParents: configurationProperties,
    },
    detailedInformation: {
      yaml: "ПодробнаяИнформация",
      type: "I8nText",
      xmlParents: configurationProperties,
    },
    copyright: {
      yaml: "АвторскиеПрава",
      type: "I8nText",
      xmlParents: configurationProperties,
    },
    vendorInformationAddress: {
      yaml: "АдресИнформацииОПоставщике",
      type: "I8nText",
      xmlParents: configurationProperties,
    },
    configurationInformationAddress: {
      yaml: "АдресИнформацииОКонфигурации",
      type: "I8nText",
      xmlParents: configurationProperties,
    },
    dataLockControlMode: {
      yaml: "РежимУправленияБлокировкойДанных",
      type: "SystemEnumeration",
      typeSE: "DataLockControlMode",
      xmlParents: configurationProperties,
    },
    objectAutonumerationMode: {
      yaml: "РежимАвтонумерацииОбъектов",
      type: "SystemEnumeration",
      typeSE: "ObjectAutonumerationMode",
      xmlParents: configurationProperties,
    },
    modalityUseMode: {
      yaml: "РежимИспользованияМодальности",
      type: "SystemEnumeration",
      typeSE: "ModalityUseMode",
      xmlParents: configurationProperties,
    },
    synchronousPlatformExtensionAndAddInCallUseMode: {
      yaml: "РежимИспользованияСинхронныхВызововРасширенийПлатформыИВнешнихКомпонент",
      type: "SystemEnumeration",
      typeSE: "SynchronousExtensionAndAddInCallUseMode",
      xmlParents: configurationProperties,
    },
    interfaceCompatibilityMode: {
      yaml: "РежимСовместимостиИнтерфейса",
      type: "SystemEnumeration",
      typeSE: "InterfaceCompatibilityMode",
      xmlParents: configurationProperties,
    },
    databaseTablespacesUseMode: {
      yaml: "РежимИспользованияТабличныхПространствБазыДанных",
      type: "SystemEnumeration",
      typeSE: "DatabaseTablespacesUseMode",
      xmlParents: configurationProperties,
    },
    compatibilityMode: {
      yaml: "РежимСовместимости",
      type: "string",
      xmlParents: configurationProperties,
    },
    defaultConstantsForm: {
      yaml: "ОсновнаяФормаКонстант",
      type: "string",
      xmlParents: configurationProperties,
      defaultValueXMLEmpty: "",
    },
    managedApplicationModule: {
      type: "Module",
      nkdkPath: "МодульПриложения.bsl",
      xmlPath: "Ext/ManagedApplicationModule.bsl",
      syncExternalOnly: true,
    },
    sessionModule: {
      type: "Module",
      nkdkPath: "МодульСеанса.bsl",
      xmlPath: "Ext/SessionModule.bsl",
      syncExternalOnly: true,
    },
    externalConnectionModule: {
      type: "Module",
      nkdkPath: "МодульВнешнегоСоединения.bsl",
      xmlPath: "Ext/ExternalConnectionModule.bsl",
      syncExternalOnly: true,
    },
    ordinaryApplicationModule: {
      type: "Module",
      nkdkPath: "МодульОбычногоПриложения.bsl",
      xmlPath: "Ext/OrdinaryApplicationModule.bsl",
      syncExternalOnly: true,
    },
    commandInterface: {
      yaml: "КомандныйИнтерфейс",
      type: "RootCommandInterface",
      filePath: "Ext/CommandInterface.xml",
    },
    mainSectionCommandInterface: {
      yaml: "КомандныйИнтерфейсОсновногоРаздела",
      type: "RootCommandInterface",
      filePath: "Ext/MainSectionCommandInterface.xml",
    },
    clientApplicationInterface: {
      yaml: "ИнтерфейсКлиентскогоПриложения",
      type: "ClientApplicationInterface",
      filePath: "Ext/ClientApplicationInterface.xml",
    },
    homePageWorkArea: {
      yaml: "РабочаяОбластьНачальнойСтраницы",
      type: "HomePageWorkArea",
      filePath: "Ext/HomePageWorkArea.xml",
    },
    help: {
      type: "Help",
      filePath: "Ext/Help.xml",
      nkdkDir: "Справка",
    },
    mobileClientSignature: {
      type: "ExternalFile",
      nkdkPath: "ПодписьМобильногоКлиента.bin",
      xmlPath: "Ext/MobileClientSignature.bin",
      syncExternalOnly: true,
    },
    mainSectionPicture: {
      type: "ExternalPicture",
      nkdkDir: "КартинкаОсновногоРаздела",
      xmlPath: "Ext/MainSectionPicture.xml",
      payloadXmlDir: "Ext/MainSectionPicture",
      syncExternalOnly: true,
    },
    logo: {
      type: "ExternalPicture",
      nkdkDir: "Логотип",
      xmlPath: "Ext/Logo.xml",
      payloadXmlDir: "Ext/Logo",
      syncExternalOnly: true,
    },
    splash: {
      type: "ExternalPicture",
      nkdkDir: "Заставка",
      xmlPath: "Ext/Splash.xml",
      payloadXmlDir: "Ext/Splash",
      syncExternalOnly: true,
    },
    standaloneConfigurationContent: {
      type: "ExternalFile",
      nkdkPath: "СодержимоеАвтономнойКонфигурации.bin",
      xmlPath: "Ext/StandaloneConfigurationContent.bin",
      syncExternalOnly: true,
    },
  },
} satisfies MetadataItemRule
