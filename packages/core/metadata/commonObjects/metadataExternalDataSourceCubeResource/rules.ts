import { typeLinkRule } from "~/metadata/commonObjects/typeLink/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
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
    choiceFoldersAndItems: systemEnumerationRule({
      yaml: "ВыборГруппИЭлементов",
      xml: "ChoiceFoldersAndItems",
      typeSE: "FoldersAndItemsUse",
      xmlParents: propertiesParents,
      defaultValueXML: "Items",
      implicitValueYAML: "Items",
      toXML: hasOwnMetadataProperty("choiceFoldersAndItems"),
    }),
    linkByType: typeLinkRule({
      yaml: "СвязьПоТипу",
      xml: "LinkByType",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("linkByType"),
    }),
    nameInDataSource: stringRule({
      yaml: "ИмяВИсточникеДанных",
      xml: "NameInDataSource",
      required: true,
      xmlParents: propertiesParents,
    }),
    fullTextSearch: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоиск",
      xml: "FullTextSearch",
      typeSE: "UseFullTextSearch",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
      toXML: hasOwnMetadataProperty("fullTextSearch"),
    }),
    indexing: systemEnumerationRule({
      yaml: "Индексирование",
      xml: "Indexing",
      typeSE: "Indexing",
      xmlParents: propertiesParents,
      defaultValueXML: "DontIndex",
      implicitValueYAML: "DontIndex",
      toXML: hasOwnMetadataProperty("indexing"),
    }),
    dataHistory: systemEnumerationRule({
      yaml: "ИсторияДанных",
      xml: "DataHistory",
      typeSE: "DataHistoryUse",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
      toXML: hasOwnMetadataProperty("dataHistory"),
    }),
    binaryDataStorageLocationUse: systemEnumerationRule({
      yaml: "ИспользованиеХраненияВХранилищеДвоичныхДанных",
      xml: "BinaryDataStorageLocationUse",
      typeSE: "BinaryDataStorageLocationUse",
      xmlParents: propertiesParents,
      noImplicitValueYAML: true,
    }),
    binaryDataStorageLocationUseField: stringRule({
      yaml: "ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
      xml: "BinaryDataStorageLocationUseField",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("binaryDataStorageLocationUseField"),
    }),
    balance: booleanRule({
      yaml: "Балансовый",
      xml: "Balance",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: hasOwnMetadataProperty("balance"),
    }),
    accountingFlag: stringRule({
      yaml: "ПризнакУчета",
      xml: "AccountingFlag",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("accountingFlag"),
    }),
    extDimensionAccountingFlag: stringRule({
      yaml: "ПризнакУчетаСубконто",
      xml: "ExtDimensionAccountingFlag",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("extDimensionAccountingFlag"),
    }),
    ...externalDataSourceObjectServiceProperties,
  },
} as const satisfies MetadataItemRule
