import { accumulationRegisterAggregateCollectionRule, accumulationRegisterAggregateDimensionsRule } from "./builders"
import { xmlRootRule } from "../xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { uuidPropertyRule } from "../uuid/rule"
import type { MetadataItemRule } from "../../orchestration/property/types"
export const AccumulationRegisterAggregateRules = {
  itemType: "AccumulationRegisterAggregate",
  properties: {
    id: {
      ...uuidPropertyRule,
      xml: "_id",
    },
    use: systemEnumerationRule({
      yaml: "Использование",
      xml: "Use",
      typeSE: "AccumulationRegisterAggregateUse",
      required: true,
      noImplicitValueYAML: true,
    }),
    periodicity: systemEnumerationRule({
      yaml: "Периодичность",
      xml: "Periodicity",
      typeSE: "AccumulationRegisterAggregatePeriodicity",
      required: true,
      noImplicitValueYAML: true,
    }),
    dimensions: accumulationRegisterAggregateDimensionsRule({
      yaml: "Измерения",
      xml: "Dimensions",
      required: true,
    }),
  },
} as const satisfies MetadataItemRule
export const AccumulationRegisterAggregatesRules = {
  itemType: "AccumulationRegisterAggregates",
  properties: {
    xmlRoot: xmlRootRule({
      container: "AccumulationRegisterAggregates",
      rootAttributes: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
        "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
        "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
        "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
        "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        _version: "2.20",
      },
      forReferenceOnly: true,
      isFileRoot: true,
    }),
    items: accumulationRegisterAggregateCollectionRule({
      xml: "Aggregate",
      yaml: "items",
      yamlInline: true,
    }),
  },
} as const satisfies MetadataItemRule
