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
      defaultValueYAML: "Items",
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
      defaultValueYAML: "Use",
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
    dataHistory: {
      yaml: "ИсторияДанных",
      xml: "DataHistory",
      type: "SystemEnumeration",
      typeSE: "DataHistoryUse",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      defaultValueYAML: "Use",
    },
    binaryDataStorageLocationUse: {
      yaml: "ИспользованиеХраненияВХранилищеДвоичныхДанных",
      xml: "BinaryDataStorageLocationUse",
      type: "SystemEnumeration",
      typeSE: "BinaryDataStorageLocationUse",
      xmlParents: propertiesParents,
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
