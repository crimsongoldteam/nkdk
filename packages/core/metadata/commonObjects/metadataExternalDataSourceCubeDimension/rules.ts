import { metadataItemLinkRule, metadataItemLinksRule } from "~/metadata/commonObjects/metadataPath/types"
import { typeLinkRule } from "~/metadata/commonObjects/typeLink/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import {
  externalDataSourceFieldBaseProperties,
  externalDataSourceObjectServiceProperties,
} from "~/metadata/commonObjects/metadataExternalDataSourceField/rules"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
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
    choiceFoldersAndItems: systemEnumerationRule({
      yaml: "ВыборГруппИЭлементов",
      xml: "ChoiceFoldersAndItems",
      typeSE: "FoldersAndItemsUse",
      xmlParents: propertiesParents,
      defaultValueXML: "Items",
      implicitValueYAML: "Items",
    }),
    linkByType: typeLinkRule({
      yaml: "СвязьПоТипу",
      xml: "LinkByType",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    }),
    documentMap: metadataItemLinksRule({
      yaml: "СоответствиеРеквизитамДокументов",
      xml: "DocumentMap",
      metadataTarget: { kind: "member", owner: "explicit" },
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("documentMap"),
    }),
    registerRecordsMap: metadataItemLinksRule({
      yaml: "СоответствиеРеквизитамДвижений",
      xml: "RegisterRecordsMap",
      metadataTarget: { kind: "member", owner: "explicit" },
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("registerRecordsMap"),
    }),
    registerDimension: metadataItemLinkRule({
      yaml: "ИзмерениеРегистра",
      xml: "RegisterDimension",
      typedXML: "xr:MDObjectRef",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("registerDimension"),
    }),
    leadingRegisterData: metadataItemLinksRule({
      yaml: "ДанныеВедущихРегистров",
      xml: "LeadingRegisterData",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("leadingRegisterData"),
    }),
    denyIncompleteValues: booleanRule({
      yaml: "ЗапретНезавершенныхЗначений",
      xml: "DenyIncompleteValues",
      xmlParents: propertiesParents,
      defaultValueXML: false,
      implicitValueYAML: false,
      toXML: hasOwnMetadataProperty("denyIncompleteValues"),
    }),
    baseDimension: booleanRule({
      yaml: "БазовоеИзмерение",
      xml: "BaseDimension",
      xmlParents: propertiesParents,
      defaultValueXML: false,
      implicitValueYAML: false,
      toXML: hasOwnMetadataProperty("baseDimension"),
    }),
    scheduleLink: stringRule({
      yaml: "СвязьСГрафиком",
      xml: "ScheduleLink",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      toXML: hasOwnMetadataProperty("scheduleLink"),
    }),
    useInTotals: booleanRule({
      yaml: "ИспользоватьВИтогах",
      xml: "UseInTotals",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: hasOwnMetadataProperty("useInTotals"),
    }),
    master: booleanRule({
      yaml: "Ведущее",
      xml: "Master",
      xmlParents: propertiesParents,
      defaultValueXML: false,
      implicitValueYAML: false,
      toXML: hasOwnMetadataProperty("master"),
    }),
    mainFilter: booleanRule({
      yaml: "ОсновнойОтбор",
      xml: "MainFilter",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: hasOwnMetadataProperty("mainFilter"),
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
    typeReductionMode: systemEnumerationRule({
      yaml: "РежимСокращенияТипа",
      xml: "TypeReductionMode",
      typeSE: "TypeReductionMode",
      xmlParents: propertiesParents,
      defaultValueXML: "TransformValues",
      implicitValueYAML: "TransformValues",
      toXML: hasOwnMetadataProperty("typeReductionMode"),
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
    fullTextSearch: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоиск",
      xml: "FullTextSearch",
      typeSE: "UseFullTextSearch",
      xmlParents: propertiesParents,
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
      toXML: hasOwnMetadataProperty("fullTextSearch"),
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
    ...externalDataSourceObjectServiceProperties,
  },
} as const satisfies MetadataItemRule
