import {
  registerDependentStructuralItemHandler,
  registerDependentImportItemHandler,
  registerDependentYamlItemHandler,
  type DependentStructuralItemHandler,
} from "../../ruleRuntime/property/dependentItemRegistry"
import {
  analyzeMetadataAttributeFillValue,
  analyzeStandardAttributeFillValue,
  classifyMetadataAttributeFillValue,
  classifyStandardAttributeFillValue,
  inferFillValueReferenceConstraint,
  parseFillValueYaml,
} from "./analyzeItem"
import { materializeMetadataValueReference } from "../metadataTargets/referenceMaterializer"
import { isMetadataRootName } from "../metadataTargets/roots"
import type { MetadataTargetOwner } from "../metadataTargets/types"
import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToYAML } from "../metadataValue/toYAML"
import { registerExplicitXMLProperty } from "../../ruleRuntime/property/explicitXMLPropertyRegistry"

let validationRegistered = false
let structuralReferencesRegistered = false
let importRegistered = false
let xmlTransportRegistered = false

export function registerFillValueValidation(): void {
  registerFillValueXMLTransport()
  registerFillValueStructuralReferences()
  if (validationRegistered) return
  validationRegistered = true
  registerDependentYamlItemHandler("MetadataAttribute", analyzeMetadataAttributeFillValue)
  registerDependentYamlItemHandler("StandardAttributeDescription", analyzeStandardAttributeFillValue)
}

export function registerFillValueStructuralReferences(): void {
  if (structuralReferencesRegistered) return
  structuralReferencesRegistered = true
  registerDependentStructuralItemHandler("MetadataAttribute", collectFillValueStructuralReference)
  registerDependentStructuralItemHandler("StandardAttributeDescription", collectFillValueStructuralReference)
}

export function registerFillValueImport(): void {
  registerFillValueXMLTransport()
  if (importRegistered) return
  importRegistered = true
  registerDependentImportItemHandler("MetadataAttribute", {
    propertyKeys: ["fillValue"],
    shouldRemove: (params) => classifyMetadataAttributeFillValue(params).kind === "implicit",
    shouldTagXML: (params) => classifyMetadataAttributeFillValue(params).kind === "invalid",
  })
  registerDependentImportItemHandler("StandardAttributeDescription", {
    propertyKeys: ["fillValue"],
    shouldRemove: (params) => classifyStandardAttributeFillValue(params).kind === "implicit",
    shouldTagXML: (params) => classifyStandardAttributeFillValue(params).kind === "invalid",
  })
}

function registerFillValueXMLTransport(): void {
  if (xmlTransportRegistered) return
  xmlTransportRegistered = true
  registerExplicitXMLProperty({
    action: "transportScalar",
    itemType: "MetadataAttribute",
    propertyKey: "fillValue",
  })
  registerExplicitXMLProperty({
    action: "transportScalar",
    itemType: "StandardAttributeDescription",
    propertyKey: "fillValue",
  })
}

const collectFillValueStructuralReference: DependentStructuralItemHandler = (params) => {
  const value = parseFillValueYaml(params.item["ЗначениеЗаполнения"])
  if (value === undefined || value.type !== "ref") return []
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
      params.item["ЗначениеЗаполнения"] = exportMetadataValueToYAML(
        dependentContext(params.context),
        undefined,
        currentValue,
      )
    },
  }))
}

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
