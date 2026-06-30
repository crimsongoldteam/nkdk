import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const AccumulationRegisterAggregateRules = {
  itemType: "AccumulationRegisterAggregate",
  properties: {
    id: {
      ...uuidPropertyRule,
      xml: "_id",
    },
    use: {
      yaml: "Использование",
      xml: "Use",
      type: "SystemEnumeration",
      typeSE: "AccumulationRegisterAggregateUse",
      required: true,
      noImplicitValueYAML: true,
    },
    periodicity: {
      yaml: "Периодичность",
      xml: "Periodicity",
      type: "SystemEnumeration",
      typeSE: "AccumulationRegisterAggregatePeriodicity",
      required: true,
      noImplicitValueYAML: true,
    },
    dimensions: {
      yaml: "Измерения",
      xml: "Dimensions",
      type: "AccumulationRegisterAggregateDimensions",
      required: true,
    },
  },
} as const satisfies MetadataItemRule

export const AccumulationRegisterAggregatesRules = {
  itemType: "AccumulationRegisterAggregates",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
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
    },
    items: {
      type: "AccumulationRegisterAggregateCollection",
      xml: "Aggregate",
      yaml: "items",
      yamlInline: true,
    },
  },
} as const satisfies MetadataItemRule
