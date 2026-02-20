import { MetadataItemRule } from "~/metadata/metadataFactory"
import { MetadataCatalog, MetadataCatalogStandardAttributeNames } from "./types"

export const MetadataCatalogRules: MetadataItemRule<MetadataCatalog> = {
  properties: {
    additionalIndexes: {
      yaml: "ДополнительныеИндексы",
      type: "AdditionalIndex",
    },
    attributes: {
      yaml: "Реквизиты",
      type: "MetadataAttributes",
    },
    autonumbering: {
      yaml: "Автонумерация",
      type: "boolean",
      defaultValueXML: true,
    },
    auxiliaryChoiceForm: {
      yaml: "ДополнительнаяФормаДляВыбора",
      type: "string",
    },
    auxiliaryFolderChoiceForm: {
      yaml: "ДополнительнаяФормаДляВыбораГруппы",
      type: "string",
    },
    auxiliaryFolderForm: {
      yaml: "ДополнительнаяФормаГруппы",
      type: "string",
    },
    auxiliaryListForm: {
      yaml: "ДополнительнаяФормаСписка",
      type: "string",
    },
    auxiliaryObjectForm: {
      yaml: "ДополнительнаяФормаОбъекта",
      type: "string",
    },
    basedOn: {
      yaml: "ВводитсяНаОсновании",
      type: "MetadataItemLinks",
    },
    characteristics: {
      yaml: "Характеристики",
      type: "CharacteristicsDescription",
    },
    checkUnique: {
      yaml: "КонтрольУникальности",
      type: "boolean",
      defaultValueXML: true,
    },
    choiceDataGetModeOnInputByString: {
      yaml: "РежимПолученияДанныхВыбораПриВводеПоСтроке",
      type: "SystemEnumeration",
      typeSE: "ChoiceDataGetModeOnInputByString",
      defaultValueXML: "Directly",
    },
    choiceHistoryOnInput: {
      yaml: "ИсторияВыбораПриВводе",
      type: "SystemEnumeration",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
    },
    choiceMode: {
      yaml: "СпособВыбора",
      type: "SystemEnumeration",
      typeSE: "ChoiceMode",
      defaultValueXML: "BothWays",
    },
    codeAllowedLength: {
      yaml: "ДопустимаяДлинаКода",
      type: "SystemEnumeration",
      typeSE: "AllowedLength",
      defaultValueXML: "Variable",
    },
    codeLength: {
      yaml: "ДлинаКода",
      type: "number",
      defaultValueXML: 9,
    },
    codeSeries: {
      yaml: "СерииКодов",
      type: "SystemEnumeration",
      typeSE: "CatalogCodesSeries",
      defaultValueXML: "WholeCatalog",
    },
    codeType: {
      yaml: "ТипКода",
      type: "SystemEnumeration",
      typeSE: "CatalogCodeType",
      defaultValueXML: "String",
    },
    commands: {
      yaml: "Команды",
      type: "MetadataCommands",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
    },
    createOnInput: {
      yaml: "СозданиеПриВводе",
      type: "SystemEnumeration",
      typeSE: "CreateOnInput",
      defaultValueXML: "Use",
    },
    dataHistory: {
      yaml: "ИсторияДанных",
      type: "SystemEnumeration",
      typeSE: "DataHistoryUse",
      defaultValueXML: "DontUse",
    },
    dataLockControlMode: {
      yaml: "РежимУправленияБлокировкойДанных",
      type: "SystemEnumeration",
      typeSE: "DefaultDataLockControlMode",
      defaultValueXML: "Managed",
    },
    dataLockFields: {
      yaml: "ПоляБлокировкиДанных",
      type: "MetadataField",
    },
    defaultChoiceForm: {
      yaml: "ОсновнаяФормаДляВыбора",
      type: "string",
    },
    defaultFolderChoiceForm: {
      yaml: "ОсновнаяФормаДляВыбораГруппы",
      type: "string",
    },
    defaultFolderForm: {
      yaml: "ОсновнаяФормаГруппы",
      type: "string",
    },
    defaultListForm: {
      yaml: "ОсновнаяФормаСписка",
      type: "string",
    },
    defaultObjectForm: {
      yaml: "ОсновнаяФормаОбъекта",
      type: "string",
    },
    defaultPresentation: {
      yaml: "ОсновноеПредставление",
      type: "SystemEnumeration",
      typeSE: "CatalogMainPresentation",
      defaultValueXML: "AsDescription",
    },
    descriptionLength: {
      yaml: "ДлинаНаименования",
      type: "number",
      defaultValueXML: 25,
    },
    editType: {
      yaml: "СпособРедактирования",
      type: "SystemEnumeration",
      typeSE: "EditType",
      defaultValueXML: "InDialog",
    },
    executeAfterWriteDataHistoryVersionProcessing: {
      yaml: "ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных",
      type: "boolean",
      defaultValueXML: false,
    },
    explanation: {
      yaml: "Пояснение",
      type: "I8nText",
    },
    extendedListPresentation: {
      yaml: "РасширенноеПредставлениеСписка",
      type: "I8nText",
    },
    extendedObjectPresentation: {
      yaml: "РасширенноеПредставлениеОбъекта",
      type: "I8nText",
    },
    foldersOnTop: {
      yaml: "ГруппыСверху",
      type: "boolean",
      defaultValueXML: true,
    },
    fullTextSearch: {
      yaml: "ПолнотекстовыйПоиск",
      type: "SystemEnumeration",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "Use",
    },
    fullTextSearchOnInputByString: {
      yaml: "ПолнотекстовыйПоискПриВводеПоСтроке",
      type: "SystemEnumeration",
      typeSE: "FullTextSearchOnInputByString",
      defaultValueXML: "DontUse",
    },
    hierarchical: {
      yaml: "Иерархический",
      type: "boolean",
      defaultValueXML: false,
    },
    hierarchyType: {
      yaml: "ВидИерархии",
      type: "SystemEnumeration",
      typeSE: "HierarchyType",
      defaultValueXML: "HierarchyFoldersAndItems",
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      type: "boolean",
      defaultValueXML: false,
    },
    inputByString: {
      yaml: "ВводПоСтроке",
      type: "MetadataField",
    },
    levelCount: {
      yaml: "КоличествоУровней",
      type: "number",
      defaultValueXML: 2,
    },
    limitLevelCount: {
      yaml: "ОграничиватьКоличествоУровней",
      type: "boolean",
      defaultValueXML: false,
    },
    listPresentation: {
      yaml: "ПредставлениеСписка",
      type: "I8nText",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
    },
    objectPresentation: {
      yaml: "ПредставлениеОбъекта",
      type: "I8nText",
    },
    owners: {
      yaml: "Владельцы",
      type: "MetadataItemLinks",
    },
    predefined: {
      yaml: "Предопределенные",
      type: "Predefined",
    },
    predefinedDataUpdate: {
      yaml: "ОбновлениеПредопределенныхДанных",
      type: "SystemEnumeration",
      typeSE: "PredefinedDataUpdate",
      defaultValueXML: "Auto",
    },
    quickChoice: {
      yaml: "БыстрыйВыбор",
      type: "boolean",
      defaultValueXML: false,
    },
    searchStringModeOnInputByString: {
      yaml: "СпособПоискаСтрокиПриВводеПоСтроке",
      type: "SystemEnumeration",
      typeSE: "SearchStringModeOnInputByString",
      defaultValueXML: "Begin",
    },
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      type: "StandardAttributeDescription",
      standartAttributeNames: MetadataCatalogStandardAttributeNames,
    },
    subordinationUse: {
      yaml: "ИспользованиеПодчинения",
      type: "SystemEnumeration",
      typeSE: "SubordinationUse",
      defaultValueXML: "ToItems",
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
    },
    tabularSections: {
      yaml: "ТабличныеЧасти",
      type: "MetadataTabularSections",
    },
    updateDataHistoryImmediatelyAfterWrite: {
      yaml: "ОбновлятьИсториюДанныхСразуПослеЗаписи",
      type: "boolean",
      defaultValueXML: false,
    },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      defaultValueXML: true,
    },
  },
}
