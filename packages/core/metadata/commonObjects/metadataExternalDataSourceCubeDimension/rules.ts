import {
  externalDataSourceFieldBaseProperties,
  externalDataSourceObjectServiceProperties,
} from "~/metadata/commonObjects/metadataExternalDataSourceField/rules"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const propertiesParents = ["Properties"]
const hasOwnMetadataProperty =
  (propertyKey: string) =>
  (metadataItem: unknown): boolean =>
    metadataItem !== null &&
    metadataItem !== undefined &&
    typeof metadataItem === "object" &&
    Object.prototype.hasOwnProperty.call(metadataItem, propertyKey)

export const MetadataExternalDataSourceCubeDimensionRules = {
  itemType: "MetadataExternalDataSourceCubeDimension",
  properties: {
    ...externalDataSourceFieldBaseProperties,
    choiceFoldersAndItems: {
      yaml: "ВыборГруппИЭлементов",
      xml: "ChoiceFoldersAndItems",
      type: "SystemEnumeration",
      typeSE: "FoldersAndItemsUse",
      xmlParents: propertiesParents,
      defaultValueXML: "Items",
      defaultValueYAML: "Items",
    },
    linkByType: {
      yaml: "СвязьПоТипу",
      xml: "LinkByType",
      type: "TypeLink",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
    documentMap: {
      yaml: "СоответствиеРеквизитамДокументов",
      xml: "DocumentMap",
      type: "MetadataItemLinks",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("documentMap"),
    },
    registerRecordsMap: {
      yaml: "СоответствиеРеквизитамДвижений",
      xml: "RegisterRecordsMap",
      type: "MetadataItemLinks",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("registerRecordsMap"),
    },
    registerDimension: {
      yaml: "ИзмерениеРегистра",
      xml: "RegisterDimension",
      type: "MetadataItemLink",
      typedXML: "xr:MDObjectRef",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("registerDimension"),
    },
    leadingRegisterData: {
      yaml: "ДанныеВедущихРегистров",
      xml: "LeadingRegisterData",
      type: "MetadataItemLinks",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("leadingRegisterData"),
    },
    denyIncompleteValues: {
      yaml: "ЗапретНезавершенныхЗначений",
      xml: "DenyIncompleteValues",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: false,
      defaultValueYAML: false,
    },
    baseDimension: {
      yaml: "БазовоеИзмерение",
      xml: "BaseDimension",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: false,
      defaultValueYAML: false,
    },
    scheduleLink: {
      yaml: "СвязьСГрафиком",
      xml: "ScheduleLink",
      type: "string",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("scheduleLink"),
    },
    useInTotals: {
      yaml: "ИспользоватьВИтогах",
      xml: "UseInTotals",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      defaultValueYAML: true,
    },
    master: {
      yaml: "Ведущее",
      xml: "Master",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: false,
      defaultValueYAML: false,
    },
    mainFilter: {
      yaml: "ОсновнойОтбор",
      xml: "MainFilter",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      defaultValueYAML: true,
    },
    balance: {
      yaml: "Балансовый",
      xml: "Balance",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      defaultValueYAML: true,
    },
    accountingFlag: {
      yaml: "ПризнакУчета",
      xml: "AccountingFlag",
      type: "string",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("accountingFlag"),
    },
    typeReductionMode: {
      yaml: "РежимСокращенияТипа",
      xml: "TypeReductionMode",
      type: "SystemEnumeration",
      typeSE: "TypeReductionMode",
      xmlParents: propertiesParents,
      defaultValueXML: "TransformValues",
      defaultValueYAML: "TransformValues",
    },
    indexing: {
      yaml: "Индексирование",
      xml: "Indexing",
      type: "SystemEnumeration",
      typeSE: "Indexing",
      xmlParents: propertiesParents,
      defaultValueXML: "DontIndex",
      defaultValueYAML: "DontIndex",
    },
    fullTextSearch: {
      yaml: "ПолнотекстовыйПоиск",
      xml: "FullTextSearch",
      type: "SystemEnumeration",
      typeSE: "UseFullTextSearch",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      defaultValueYAML: "Use",
    },
    dataHistory: {
      yaml: "ИсторияДанных",
      xml: "DataHistory",
      type: "SystemEnumeration",
      typeSE: "DataHistoryUse",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      defaultValueYAML: "Use",
    },
    ...externalDataSourceObjectServiceProperties,
  },
} as const satisfies MetadataItemRule
