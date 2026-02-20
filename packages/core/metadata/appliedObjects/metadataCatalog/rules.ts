import { MetadataItemRule } from "~/metadata/metadataFactory"
import { MetadataCatalog } from "./types"

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
      xmlDefaultValue: true,
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
      xmlDefaultValue: true,
    },
    choiceDataGetModeOnInputByString: {
      yaml: "РежимПолученияДанныхВыбораПриВводеПоСтроке",
      type: "SystemEnumeration",
      typeSE: "ChoiceDataGetModeOnInputByString",
      xmlDefaultValue: "Directly",
    },
    choiceHistoryOnInput: {
      yaml: "ИсторияВыбораПриВводе",
      type: "SystemEnumeration",
      typeSE: "ChoiceHistoryOnInput",
      xmlDefaultValue: "Auto",
    },
    choiceMode: {
      yaml: "СпособВыбора",
      type: "SystemEnumeration",
      typeSE: "ChoiceMode",
      xmlDefaultValue: "BothWays",
    },
    codeAllowedLength: {
      yaml: "ДопустимаяДлинаКода",
      type: "SystemEnumeration",
      typeSE: "AllowedLength",
      xmlDefaultValue: "Variable",
    },
    codeLength: {
      yaml: "ДлинаКода",
      type: "number",
      xmlDefaultValue: 9,
    },
    codeSeries: {
      yaml: "СерииКодов",
      type: "SystemEnumeration",
      typeSE: "CatalogCodesSeries",
      xmlDefaultValue: "WholeCatalog",
    },
    codeType: {
      yaml: "ТипКода",
      type: "SystemEnumeration",
      typeSE: "CatalogCodeType",
      xmlDefaultValue: "String",
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
      xmlDefaultValue: "Use",
    },
    dataHistory: {
      yaml: "ИсторияДанных",
      type: "SystemEnumeration",
      typeSE: "DataHistoryUse",
      xmlDefaultValue: "DontUse",
    },
    dataLockControlMode: {
      yaml: "РежимУправленияБлокировкойДанных",
      type: "SystemEnumeration",
      typeSE: "DefaultDataLockControlMode",
      xmlDefaultValue: "Managed",
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
      xmlDefaultValue: "AsDescription",
    },
    descriptionLength: {
      yaml: "ДлинаНаименования",
      type: "number",
      xmlDefaultValue: 25,
    },
    editType: {
      yaml: "СпособРедактирования",
      type: "SystemEnumeration",
      typeSE: "EditType",
      xmlDefaultValue: "InDialog",
    },
    executeAfterWriteDataHistoryVersionProcessing: {
      yaml: "ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных",
      type: "boolean",
      xmlDefaultValue: false,
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
      xmlDefaultValue: true,
    },
    fullTextSearch: {
      yaml: "ПолнотекстовыйПоиск",
      type: "SystemEnumeration",
      typeSE: "UseFullTextSearch",
      xmlDefaultValue: "Use",
    },
    fullTextSearchOnInputByString: {
      yaml: "ПолнотекстовыйПоискПриВводеПоСтроке",
      type: "SystemEnumeration",
      typeSE: "FullTextSearchOnInputByString",
      xmlDefaultValue: "DontUse",
    },
    hierarchical: {
      yaml: "Иерархический",
      type: "boolean",
      xmlDefaultValue: false,
    },
    hierarchyType: {
      yaml: "ВидИерархии",
      type: "SystemEnumeration",
      typeSE: "HierarchyType",
      xmlDefaultValue: "HierarchyFoldersAndItems",
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      type: "boolean",
      xmlDefaultValue: false,
    },
    inputByString: {
      yaml: "ВводПоСтроке",
      type: "MetadataField",
    },
    levelCount: {
      yaml: "КоличествоУровней",
      type: "number",
      xmlDefaultValue: 2,
    },
    limitLevelCount: {
      yaml: "ОграничиватьКоличествоУровней",
      type: "boolean",
      xmlDefaultValue: false,
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
      xmlDefaultValue: "Auto",
    },
    quickChoice: {
      yaml: "БыстрыйВыбор",
      type: "boolean",
      xmlDefaultValue: false,
    },
    searchStringModeOnInputByString: {
      yaml: "СпособПоискаСтрокиПриВводеПоСтроке",
      type: "SystemEnumeration",
      typeSE: "SearchStringModeOnInputByString",
      xmlDefaultValue: "Begin",
    },
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      type: "StandardAttributeDescription",
    },
    subordinationUse: {
      yaml: "ИспользованиеПодчинения",
      type: "SystemEnumeration",
      typeSE: "SubordinationUse",
      xmlDefaultValue: "ToItems",
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
    },
    tabularSections: {
      yaml: "ТабличныеЧасти",
      type: "MetadataTabularSection",
    },
    updateDataHistoryImmediatelyAfterWrite: {
      yaml: "ОбновлятьИсториюДанныхСразуПослеЗаписи",
      type: "boolean",
      xmlDefaultValue: false,
    },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      xmlDefaultValue: true,
    },
  },
}
