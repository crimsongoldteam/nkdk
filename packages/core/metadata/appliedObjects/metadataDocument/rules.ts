import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import type { ReferenceScope } from "../../relations/referenceScope"

const documentProperties = ["Properties"]
const documentChildObjects = ["ChildObjects"]

export const MetadataDocumentStandardAttributeNames: Record<string, string> = {
  Date: "Дата",
  DeletionMark: "ПометкаУдаления",
  Number: "Номер",
  Posted: "Проведен",
  Ref: "Ссылка",
}

export const MetadataDocumentRules = {
  itemType: "MetadataDocument",
  itemTypePrefix: "Документ",
  xmlDir: "Documents",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "Document",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "DocumentObject", category: "Object" },
        { name: "DocumentRef", category: "Ref" },
        { name: "DocumentSelection", category: "Selection" },
        { name: "DocumentList", category: "List" },
        { name: "DocumentManager", category: "Manager" },
      ],
    },
    uuid: {
      type: "string",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: ["Document"],
    },
    actionsWritingOnPost: {
      yaml: "ЗаписьДвиженийПриПроведении",
      type: "SystemEnumeration",
      typeSE: "RegisterRecordsWritingOnPost",
      xml: "RegisterRecordsWritingOnPost",
      defaultValueXML: "RealTime",
      xmlParents: documentProperties,
    },
    additionalIndexes: {
      yaml: "ДополнительныеИндексы",
      type: "AdditionalIndex",
      xmlParents: documentProperties,
    },
    attributes: {
      yaml: "Реквизиты",
      type: "MetadataAttributes",
      xmlParents: documentChildObjects,
      xml: "Attribute",
    },
    autonumbering: {
      yaml: "Автонумерация",
      type: "boolean",
      defaultValueXML: true,
      xmlParents: documentProperties,
    },
    auxiliaryChoiceForm: {
      yaml: "ДополнительнаяФормаДляВыбора",
      type: "string",
      xmlParents: documentProperties,
      referenceScope: { target: "this", kind: "Form" },
    },
    auxiliaryListForm: {
      yaml: "ДополнительнаяФормаСписка",
      type: "string",
      xmlParents: documentProperties,
      referenceScope: { target: "this", kind: "Form" },
    },
    auxiliaryObjectForm: {
      yaml: "ДополнительнаяФормаОбъекта",
      type: "string",
      xmlParents: documentProperties,
      referenceScope: { target: "this", kind: "Form" },
    },
    basedOn: {
      yaml: "ВводитсяНаОсновании",
      type: "MetadataItemLinks",
      xmlParents: documentProperties,
    },
    characteristics: {
      yaml: "Характеристики",
      type: "CharacteristicsDescriptions",
      xmlParents: documentProperties,
    },
    checkUnique: {
      yaml: "КонтрольУникальности",
      type: "boolean",
      defaultValueXML: false,
      xmlParents: documentProperties,
    },
    choiceDataGetModeOnInputByString: {
      yaml: "РежимПолученияДанныхВыбораПриВводеПоСтроке",
      type: "SystemEnumeration",
      typeSE: "ChoiceDataGetModeOnInputByString",
      defaultValueXML: "Directly",
      xmlParents: documentProperties,
    },
    choiceHistoryOnInput: {
      yaml: "ИсторияВыбораПриВводе",
      type: "SystemEnumeration",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      xmlParents: documentProperties,
    },
    commands: {
      yaml: "Команды",
      type: "MetadataCommands",
      xmlParents: documentChildObjects,
      xml: "Command",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: documentProperties,
    },
    createOnInput: {
      yaml: "СозданиеПриВводе",
      type: "SystemEnumeration",
      typeSE: "CreateOnInput",
      defaultValueXML: "Use",
      xmlParents: documentProperties,
    },
    dataHistory: {
      yaml: "ИсторияДанных",
      type: "SystemEnumeration",
      typeSE: "DataHistoryUse",
      defaultValueXML: "DontUse",
      xmlParents: documentProperties,
    },
    dataLockControlMode: {
      yaml: "РежимУправленияБлокировкойДанных",
      type: "SystemEnumeration",
      typeSE: "DefaultDataLockControlMode",
      defaultValueXML: "Managed",
      xmlParents: documentProperties,
    },
    dataLockFields: {
      yaml: "ПоляБлокировкиДанных",
      type: "MetadataFields",
      xmlParents: documentProperties,
    },
    defaultChoiceForm: {
      yaml: "ОсновнаяФормаДляВыбора",
      type: "string",
      xmlParents: documentProperties,
      referenceScope: { target: "this", kind: "Form" },
    },
    defaultListForm: {
      yaml: "ОсновнаяФормаСписка",
      type: "string",
      xmlParents: documentProperties,
      referenceScope: { target: "this", kind: "Form" },
    },
    defaultObjectForm: {
      yaml: "ОсновнаяФормаОбъекта",
      type: "string",
      xmlParents: documentProperties,
      referenceScope: { target: "this", kind: "Form" },
    },
    executeAfterWriteDataHistoryVersionProcessing: {
      yaml: "ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных",
      type: "boolean",
      defaultValueXML: false,
      xmlParents: documentProperties,
    },
    explanation: {
      yaml: "Пояснение",
      type: "I8nText",
      xmlParents: documentProperties,
    },
    extendedListPresentation: {
      yaml: "РасширенноеПредставлениеСписка",
      type: "I8nText",
      xmlParents: documentProperties,
    },
    extendedObjectPresentation: {
      yaml: "РасширенноеПредставлениеОбъекта",
      type: "I8nText",
      xmlParents: documentProperties,
    },
    fullTextSearch: {
      yaml: "ПолнотекстовыйПоиск",
      type: "SystemEnumeration",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "Use",
      xmlParents: documentProperties,
    },
    fullTextSearchOnInputByString: {
      yaml: "ПолнотекстовыйПоискПриВводеПоСтроке",
      type: "SystemEnumeration",
      typeSE: "FullTextSearchOnInputByString",
      defaultValueXML: "DontUse",
      xmlParents: documentProperties,
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      type: "boolean",
      defaultValueXML: false,
      xmlParents: documentProperties,
    },
    inputByString: {
      yaml: "ВводПоСтроке",
      type: "MetadataFields",
      xmlParents: documentProperties,
      referenceScope: { target: "this", kind: "Attribute", filter: "stringIndexedAttribute" },
    },
    listPresentation: {
      yaml: "ПредставлениеСписка",
      type: "I8nText",
      xmlParents: documentProperties,
    },
    name: {
      type: "string",
      xmlParents: documentProperties,
      required: true,
    },
    numberAllowedLength: {
      yaml: "ДопустимаяДлинаНомера",
      type: "SystemEnumeration",
      typeSE: "AllowedLength",
      defaultValueXML: "Variable",
      xmlParents: documentProperties,
      defaultValueYAML: "Variable",
    },
    numberLength: {
      yaml: "ДлинаНомера",
      type: "number",
      defaultValueXML: 11,
      xmlParents: documentProperties,
    },
    numberPeriodicity: {
      yaml: "ПериодичностьНомера",
      type: "SystemEnumeration",
      typeSE: "BusinessProcessNumberPeriodicity",
      defaultValueXML: "Year",
      xmlParents: documentProperties,
    },
    numberType: {
      yaml: "ТипНомера",
      type: "SystemEnumeration",
      typeSE: "DocumentNumberType",
      defaultValueXML: "String",
      xmlParents: documentProperties,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: documentProperties,
    },
    objectPresentation: {
      yaml: "ПредставлениеОбъекта",
      type: "I8nText",
      xmlParents: documentProperties,
    },
    posting: {
      yaml: "Проведение",
      type: "SystemEnumeration",
      typeSE: "Posting",
      defaultValueXML: "Deny",
      xmlParents: documentProperties,
    },
    privilegedPostingMode: {
      yaml: "ПривилегированныйРежимПриПроведении",
      type: "boolean",
      xml: "PostInPrivilegedMode",
      defaultValueXML: false,
      xmlParents: documentProperties,
    },
    privilegedUnpostingMode: {
      yaml: "ПривилегированныйРежимПриОтменеПроведения",
      type: "boolean",
      defaultValueXML: false,
      xmlParents: documentProperties,
    },
    realTimePosting: {
      yaml: "ОперативноеПроведение",
      type: "SystemEnumeration",
      typeSE: "RealTimePosting",
      defaultValueXML: "Deny",
      xmlParents: documentProperties,
    },
    registerRecords: {
      yaml: "Движения",
      type: "MetadataItemLinks",
      xmlParents: documentProperties,
    },
    registerRecordsDeletion: {
      yaml: "УдалениеДвижений",
      type: "SystemEnumeration",
      typeSE: "RegisterRecordsDeletion",
      defaultValueXML: "AutoDelete",
      xmlParents: documentProperties,
    },
    searchStringModeOnInputByString: {
      yaml: "СпособПоискаСтрокиПриВводеПоСтроке",
      type: "SystemEnumeration",
      typeSE: "SearchStringModeOnInputByString",
      defaultValueXML: "Begin",
      xmlParents: documentProperties,
    },
    sequenceFilling: {
      yaml: "ЗаполнениеПоследовательностей",
      type: "SystemEnumeration",
      typeSE: "SequenceFilling",
      defaultValueXML: "AutoFill",
      xmlParents: documentProperties,
    },
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      type: "StandardAttributeDescriptions",
      standartAttributeNames: MetadataDocumentStandardAttributeNames,
      xmlParents: documentProperties,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: documentProperties,
    },
    tabularSections: {
      yaml: "ТабличныеЧасти",
      type: "MetadataTabularSections",
      xmlParents: documentChildObjects,
      xml: "TabularSection",
    },
    updateDataHistoryImmediatelyAfterWrite: {
      yaml: "ОбновлятьИсториюДанныхСразуПослеЗаписи",
      type: "boolean",
      defaultValueXML: false,
      xmlParents: documentProperties,
    },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      defaultValueXML: true,
      xmlParents: documentProperties,
    },
  },
  requiredXMLParents: [["ChildObjects"]],
  graphTerminals: ["ПустаяСсылка"],
} as const satisfies MetadataItemRule

/**
 * Возвращает referenceScope для свойства документа по его YAML-ключу.
 * Используется VSCode-провайдерами для фильтрации автодополнения.
 */
export function getDocumentPropertyReferenceScope(yamlKey: string): ReferenceScope | undefined {
  for (const rule of Object.values(MetadataDocumentRules.properties)) {
    const r = rule as { yaml?: string; referenceScope?: ReferenceScope }
    if (r.yaml === yamlKey && r.referenceScope != null) {
      return r.referenceScope
    }
  }
  return undefined
}
