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

export const MetadataExternalDataSourceCubeResourceRules = {
  itemType: "MetadataExternalDataSourceCubeResource",
  properties: {
    ...externalDataSourceFieldBaseProperties,
    fillFromFillingValue: {
      ...externalDataSourceFieldBaseProperties.fillFromFillingValue,
      toXML: hasOwnMetadataProperty("fillFromFillingValue"),
    },
    fillChecking: {
      ...externalDataSourceFieldBaseProperties.fillChecking,
      toXML: hasOwnMetadataProperty("fillChecking"),
    },
    createOnInput: {
      ...externalDataSourceFieldBaseProperties.createOnInput,
      toXML: hasOwnMetadataProperty("createOnInput"),
    },
    choiceHistoryOnInput: {
      ...externalDataSourceFieldBaseProperties.choiceHistoryOnInput,
      toXML: hasOwnMetadataProperty("choiceHistoryOnInput"),
    },
    minValue: {
      ...externalDataSourceFieldBaseProperties.minValue,
      toXML: hasOwnMetadataProperty("minValue"),
    },
    maxValue: {
      ...externalDataSourceFieldBaseProperties.maxValue,
      toXML: hasOwnMetadataProperty("maxValue"),
    },
    fillValue: {
      ...externalDataSourceFieldBaseProperties.fillValue,
      toXML: hasOwnMetadataProperty("fillValue"),
    },
    choiceFoldersAndItems: {
      yaml: "ВыборГруппИЭлементов",
      xml: "ChoiceFoldersAndItems",
      type: "SystemEnumeration",
      typeSE: "FoldersAndItemsUse",
      xmlParents: propertiesParents,
      defaultValueXML: "Items",
      implicitValueYAML: "Items",
      toXML: hasOwnMetadataProperty("choiceFoldersAndItems"),
    },
    linkByType: {
      yaml: "СвязьПоТипу",
      xml: "LinkByType",
      type: "TypeLink",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("linkByType"),
    },
    nameInDataSource: {
      yaml: "ИмяВИсточникеДанных",
      xml: "NameInDataSource",
      type: "string",
      required: true,
      xmlParents: propertiesParents,
    },
    fullTextSearch: {
      yaml: "ПолнотекстовыйПоиск",
      xml: "FullTextSearch",
      type: "SystemEnumeration",
      typeSE: "UseFullTextSearch",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
      toXML: hasOwnMetadataProperty("fullTextSearch"),
    },
    indexing: {
      yaml: "Индексирование",
      xml: "Indexing",
      type: "SystemEnumeration",
      typeSE: "Indexing",
      xmlParents: propertiesParents,
      defaultValueXML: "DontIndex",
      implicitValueYAML: "DontIndex",
      toXML: hasOwnMetadataProperty("indexing"),
    },
    dataHistory: {
      yaml: "ИсторияДанных",
      xml: "DataHistory",
      type: "SystemEnumeration",
      typeSE: "DataHistoryUse",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
      toXML: hasOwnMetadataProperty("dataHistory"),
    },
    binaryDataStorageLocationUse: {
      yaml: "ИспользованиеХраненияВХранилищеДвоичныхДанных",
      xml: "BinaryDataStorageLocationUse",
      type: "SystemEnumeration",
      typeSE: "BinaryDataStorageLocationUse",
      xmlParents: propertiesParents,
      noImplicitValueYAML: true,
    },
    binaryDataStorageLocationUseField: {
      yaml: "ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
      xml: "BinaryDataStorageLocationUseField",
      type: "string",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("binaryDataStorageLocationUseField"),
    },
    balance: {
      yaml: "Балансовый",
      xml: "Balance",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: hasOwnMetadataProperty("balance"),
    },
    accountingFlag: {
      yaml: "ПризнакУчета",
      xml: "AccountingFlag",
      type: "string",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("accountingFlag"),
    },
    extDimensionAccountingFlag: {
      yaml: "ПризнакУчетаСубконто",
      xml: "ExtDimensionAccountingFlag",
      type: "string",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("extDimensionAccountingFlag"),
    },
    ...externalDataSourceObjectServiceProperties,
  },
} as const satisfies MetadataItemRule
