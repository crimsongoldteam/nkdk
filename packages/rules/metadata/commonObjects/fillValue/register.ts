import type {
  DependentImportItemHandler,
  DependentStructuralItemHandler,
} from "../../ruleRuntime/property/dependentItemRegistry"
import {
  analyzeMetadataAttributeFillValue,
  analyzeStandardAttributeFillValue,
  classifyMetadataAttributeFillValue,
  classifyStandardAttributeFillValue,
  inferFillValueReferenceConstraint,
  metadataAttributeUsesDefinedType,
  parseFillValueItem,
} from "./analyzeItem"
import { materializeMetadataValueReference } from "../metadataTargets/referenceMaterializer"
import { isMetadataRootName } from "../metadataTargets/roots"
import type { MetadataTargetOwner } from "../metadataTargets/types"
import type { ParsedYaml } from "@nkdk/runtime"
import type { ConfigurationContext } from "@nkdk/runtime"
import { exportMetadataValueToYAML } from "../metadataValue/toYAML"
import { markYAMLScalarTag, xmlScalarTagValue } from "@nkdk/runtime"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"

function shouldTagFillValueXML(
  params: DependentImportParams,
  classification: ReturnType<typeof classifyMetadataAttributeFillValue>["kind"],
): boolean {
  if (classification === "invalid") return true
  const canonical = namedDesignTimeRef(params)
  return canonical !== undefined && params.metadataTargetLookup?.(canonical) === "missing"
}

function namedDesignTimeRef(
  params: DependentImportParams,
): string | undefined {
  if (!isDesignTimeRef(params.candidate.xmlValue)) return undefined
  const value = parseFillValueItem(params.item)?.value
  return value?.type === "ref" && value.value.length > 0 ? value.value : undefined
}

type DependentImportParams = Parameters<DependentImportItemHandler["shouldRemove"]>[0]

function isDesignTimeRef(value: unknown): boolean {
  return typeof value === "object" && value !== null &&
    (value as Record<string, unknown>)["_xsi:type"] === "xr:DesignTimeRef"
}

const collectFillValueStructuralReference: DependentStructuralItemHandler = (params) => {
  const parsed = parseFillValueItem(params.item)
  if (parsed === undefined || parsed.value.type !== "ref") return []
  const value = parsed.value
  const constraint = inferFillValueReferenceConstraint(value)
  if (constraint === undefined) return []
  let currentValue = value
  const materialized = materializeMetadataValueReference({
    value,
    constraint,
    owner: fillValueTargetOwner(params.metadataTargetOwner),
    filePath: params.filePath,
    parsed: dependentParsedYaml(params.parsed),
    yamlPath: [...params.itemYamlPath, "ЗначениеЗаполнения"],
  })
  return materialized.references.map((reference) => ({
    ...reference,
    setCanonical(nextCanonical: string) {
      currentValue = { type: "ref", value: nextCanonical }
    },
    commitValue() {
      const yamlValue = exportMetadataValueToYAML(
        dependentContext(params.context),
        undefined,
        currentValue,
      )
      if (parsed.tagged) {
        params.item["ЗначениеЗаполнения"] = xmlScalarTagValue(String(yamlValue))
        markYAMLScalarTag(params.item, "ЗначениеЗаполнения", "xml")
      } else {
        params.item["ЗначениеЗаполнения"] = yamlValue
      }
    },
  }))
}

const metadataAttributeImport: DependentImportItemHandler = {
  propertyKeys: ["fillValue"],
  shouldRemove: (params) => classifyMetadataAttributeFillValue(params).kind === "implicit",
  shouldTagXML: (params) => shouldTagFillValueXML(params, classifyMetadataAttributeFillValue(params).kind),
  shouldDefer: (params) =>
    (params.definedTypeLookup === undefined && metadataAttributeUsesDefinedType(params.item)) ||
    namedDesignTimeRef(params) !== undefined,
}

const standardAttributeImport: DependentImportItemHandler = {
  propertyKeys: ["fillValue"],
  shouldRemove: (params) => classifyStandardAttributeFillValue(params).kind === "implicit",
  shouldTagXML: (params) => shouldTagFillValueXML(params, classifyStandardAttributeFillValue(params).kind),
  shouldDefer: (params) => namedDesignTimeRef(params) !== undefined,
}

export const fillValueRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    metadataAttributeFillValue: {
      action: "transportScalar",
      itemType: "MetadataAttribute",
      propertyKey: "fillValue",
      overrides: {
        Nil: { "_xsi:nil": true },
        DesignTimeRef: { "_xsi:type": "xr:DesignTimeRef" },
      },
    },
    standardAttributeFillValue: {
      action: "transportScalar",
      itemType: "StandardAttributeDescription",
      propertyKey: "fillValue",
      overrides: {
        String: { "_xsi:type": "xs:string" },
        DesignTimeRef: { "_xsi:type": "xr:DesignTimeRef" },
        TypeDescription: { "_xsi:type": "v8:TypeDescription" },
      },
    },
    externalDataSourceFieldFillValue: {
      action: "transportScalar",
      itemType: "MetadataExternalDataSourceField",
      propertyKey: "fillValue",
      overrides: {
        DesignTimeRef: { "_xsi:type": "xr:DesignTimeRef" },
        Null: { "_xsi:type": "v8:Null" },
      },
    },
    characteristicTypesFilterValue: {
      action: "transportScalar",
      itemType: "CharacteristicsDescription",
      propertyKey: "typesFilterValue",
      overrides: { DesignTimeRef: { "_xsi:type": "xr:DesignTimeRef" } },
    },
  },
  dependentItems: {
    MetadataAttribute: {
      yaml: analyzeMetadataAttributeFillValue,
      structural: collectFillValueStructuralReference,
      imported: metadataAttributeImport,
    },
    StandardAttributeDescription: {
      yaml: analyzeStandardAttributeFillValue,
      structural: collectFillValueStructuralReference,
      imported: standardAttributeImport,
    },
    MetadataExternalDataSourceField: {
      yaml: analyzeMetadataAttributeFillValue,
      structural: collectFillValueStructuralReference,
      imported: metadataAttributeImport,
    },
    CharacteristicsDescription: {
      imported: {
        propertyKeys: ["typesFilterValue"],
        shouldRemove: () => false,
      },
    },
  },
})

function fillValueTargetOwner(
  owner: DependentParametersOwner,
): MetadataTargetOwner | undefined {
  if (owner === undefined || !isMetadataRootName(owner.root)) return undefined
  return { root: owner.root, objectName: owner.objectName }
}

type DependentParametersOwner = Parameters<DependentStructuralItemHandler>[0]["metadataTargetOwner"]

function dependentParsedYaml(parsed: unknown): ParsedYaml {
  return parsed as ParsedYaml
}

function dependentContext(context: unknown): ConfigurationContext {
  return context as ConfigurationContext
}
