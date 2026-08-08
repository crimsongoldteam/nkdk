import {
  registerDependentStructuralItemHandler,
  registerDependentImportItemHandler,
  registerDependentYamlItemHandler,
  type DependentStructuralItemHandler,
} from "../../orchestration/property/dependentItemRegistry"
import {
  analyzeMetadataAttributeFillValue,
  analyzeStandardAttributeFillValue,
  classifyMetadataAttributeFillValue,
  classifyStandardAttributeFillValue,
  inferFillValueReferenceConstraint,
  parseFillValueYaml,
} from "./analyzeItem"
import { materializeMetadataValueReference } from "../metadataTargets/referenceMaterializer"
import { exportMetadataValueToYAML } from "../metadataValue/toYAML"

let validationRegistered = false
let structuralReferencesRegistered = false
let importRegistered = false

export function registerFillValueValidation(): void {
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
  if (importRegistered) return
  importRegistered = true
  registerDependentImportItemHandler("MetadataAttribute", {
    propertyKeys: ["fillValue"],
    shouldRemove: (params) => classifyMetadataAttributeFillValue(params).kind === "implicit",
  })
  registerDependentImportItemHandler("StandardAttributeDescription", {
    propertyKeys: ["fillValue"],
    shouldRemove: (params) => classifyStandardAttributeFillValue(params).kind === "implicit",
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
    owner: params.metadataTargetOwner,
    filePath: params.filePath,
    parsed: params.parsed,
    yamlPath: [...params.itemYamlPath, "ЗначениеЗаполнения"],
  })
  return materialized.references.map((reference) => ({
    ...reference,
    setCanonical(nextCanonical: string) {
      currentValue = { type: "ref", value: nextCanonical }
    },
    commitValue() {
      params.item["ЗначениеЗаполнения"] = exportMetadataValueToYAML(params.context, undefined, currentValue)
    },
  }))
}
