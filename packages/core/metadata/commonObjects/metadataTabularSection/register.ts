import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  MetadataChartOfAccountsTabularSectionRules,
  MetadataBusinessProcessTabularSectionRules,
  MetadataChartOfCalculationTypesTabularSectionRules,
  MetadataChartOfCharacteristicTypesTabularSectionRules,
  MetadataDataProcessorTabularSectionRules,
  MetadataDocumentTabularSectionRules,
  MetadataExchangePlanTabularSectionRules,
  MetadataReportTabularSectionRules,
  MetadataTaskTabularSectionRules,
  MetadataTabularSectionRules,
} from "./rules"
import {
  MetadataTabularSection,
  MetadataTabularSectionYAML,
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionsYAML,
} from "./types"

const importMetadataTabularSectionFromYAML = (
  context: ConfigurationContext,
  yaml: MetadataTabularSectionYAML | undefined,
  name: string
): MetadataTabularSection | undefined => {
  if (!yaml) return undefined

  const properties = importMetadataItemFromYAML({
    context,
    yaml: yaml as MetadataTabularSectionYAML,
    rule: MetadataTabularSectionRules,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return {
    ...properties,
    name,
  }
}

const importMetadataTabularSectionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSectionsYAML | undefined
): MetadataTabularSections | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataTabularSectionFromYAML(context, value, name))
    .filter((item): item is MetadataTabularSection => item !== undefined)
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataTabularSections",
  itemRule: MetadataTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  fromYAML: importMetadataTabularSectionsFromYAML,
  graphChild: { idFrom: "name", edgeKind: "TABULAR_SECTION", edgeYaml: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

const importMetadataDocumentTabularSectionFromYAML = (
  context: ConfigurationContext,
  yaml: MetadataTabularSectionYAML | undefined,
  name: string
): MetadataTabularSection | undefined => {
  if (!yaml) return undefined

  const properties = importMetadataItemFromYAML({
    context,
    yaml: yaml as MetadataTabularSectionYAML,
    rule: MetadataDocumentTabularSectionRules,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return {
    ...properties,
    name,
  }
}

const importMetadataDocumentTabularSectionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSectionsYAML | undefined
): MetadataTabularSections | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataDocumentTabularSectionFromYAML(context, value, name))
    .filter((item): item is MetadataTabularSection => item !== undefined)
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataDocumentTabularSections",
  itemRule: MetadataDocumentTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  fromYAML: importMetadataDocumentTabularSectionsFromYAML,
  graphChild: { idFrom: "name", edgeKind: "TABULAR_SECTION", edgeYaml: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataTaskTabularSections",
  itemRule: MetadataTaskTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  graphChild: { idFrom: "name", edgeKind: "TABULAR_SECTION", edgeYaml: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataBusinessProcessTabularSections",
  itemRule: MetadataBusinessProcessTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  graphChild: { idFrom: "name", edgeKind: "TABULAR_SECTION", edgeYaml: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

const importMetadataDataProcessorTabularSectionFromYAML = (
  context: ConfigurationContext,
  yaml: MetadataTabularSectionYAML | undefined,
  name: string
): MetadataTabularSection | undefined => {
  if (!yaml) return undefined

  const properties = importMetadataItemFromYAML({
    context,
    yaml: yaml as MetadataTabularSectionYAML,
    rule: MetadataDataProcessorTabularSectionRules,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return {
    ...properties,
    name,
  }
}

const importMetadataDataProcessorTabularSectionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSectionsYAML | undefined
): MetadataTabularSections | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataDataProcessorTabularSectionFromYAML(context, value, name))
    .filter((item): item is MetadataTabularSection => item !== undefined)
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataDataProcessorTabularSections",
  itemRule: MetadataDataProcessorTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  fromYAML: importMetadataDataProcessorTabularSectionsFromYAML,
  graphChild: { idFrom: "name", edgeKind: "TABULAR_SECTION", edgeYaml: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

const importMetadataReportTabularSectionFromYAML = (
  context: ConfigurationContext,
  yaml: MetadataTabularSectionYAML | undefined,
  name: string
): MetadataTabularSection | undefined => {
  if (!yaml) return undefined

  const properties = importMetadataItemFromYAML({
    context,
    yaml: yaml as MetadataTabularSectionYAML,
    rule: MetadataReportTabularSectionRules,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return {
    ...properties,
    name,
  }
}

const importMetadataReportTabularSectionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSectionsYAML | undefined
): MetadataTabularSections | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataReportTabularSectionFromYAML(context, value, name))
    .filter((item): item is MetadataTabularSection => item !== undefined)
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataReportTabularSections",
  itemRule: MetadataReportTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  fromYAML: importMetadataReportTabularSectionsFromYAML,
  graphChild: { idFrom: "name", edgeKind: "TABULAR_SECTION", edgeYaml: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

const importMetadataExchangePlanTabularSectionFromYAML = (
  context: ConfigurationContext,
  yaml: MetadataTabularSectionYAML | undefined,
  name: string
): MetadataTabularSection | undefined => {
  if (!yaml) return undefined

  const properties = importMetadataItemFromYAML({
    context,
    yaml: yaml as MetadataTabularSectionYAML,
    rule: MetadataExchangePlanTabularSectionRules,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return {
    ...properties,
    name,
  }
}

const importMetadataExchangePlanTabularSectionsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSectionsYAML | undefined
): MetadataTabularSections | undefined => {
  if (!data) return undefined

  return Object.entries(data)
    .map(([name, value]) => importMetadataExchangePlanTabularSectionFromYAML(context, value, name))
    .filter((item): item is MetadataTabularSection => item !== undefined)
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataExchangePlanTabularSections",
  itemRule: MetadataExchangePlanTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  fromYAML: importMetadataExchangePlanTabularSectionsFromYAML,
  graphChild: { idFrom: "name", edgeKind: "TABULAR_SECTION", edgeYaml: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataChartOfAccountsTabularSections",
  itemRule: MetadataChartOfAccountsTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  graphChild: { idFrom: "name", edgeKind: "TABULAR_SECTION", edgeYaml: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataChartOfCalculationTypesTabularSections",
  itemRule: MetadataChartOfCalculationTypesTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  graphChild: { idFrom: "name", edgeKind: "TABULAR_SECTION", edgeYaml: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataChartOfCharacteristicTypesTabularSections",
  itemRule: MetadataChartOfCharacteristicTypesTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  graphChild: { idFrom: "name", edgeKind: "TABULAR_SECTION", edgeYaml: "ТабличнаяЧасть", nodeSegment: "ТабличнаяЧасть" },
})

// Compat exports for consumers that call these functions directly
export const importMetadataTabularSectionsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataTabularSectionsXML | undefined
): MetadataTabularSections | undefined => {
  return importPropertyFromXML({ context, rule: { type: "MetadataTabularSections" }, value: xml }) as
    | MetadataTabularSections
    | undefined
}

export const exportMetadataTabularSectionsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSections | undefined
): MetadataTabularSectionsYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataTabularSectionRules,
    keyField: "name",
  }) as MetadataTabularSectionsYAML | undefined
}

export const exportMetadataTabularSectionToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataTabularSection | undefined
): MetadataTabularSectionYAML | undefined => {
  if (!data) return undefined
  const result = exportMetadataTabularSectionsToYAML(context, _rule, [data])
  if (!result) return undefined
  return result[data.name] as MetadataTabularSectionYAML | undefined
}
