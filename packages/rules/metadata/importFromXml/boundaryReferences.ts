import { importedYamlValueAtPath } from "./yamlPathValue"
import type { ConfigurationContext, ValidationIssue, XmlAnomalyAnnotations } from "@nkdk/runtime"
import type { CompiledProperty, CompiledPropertyPlan, CompiledPropertyRuleExecution, MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { isMetadataTargetUuid } from "@nkdk/runtime"
import {
  metadataTargetOwnerFromRule, metadataTargetOwnerForProperty, metadataTargetConstraintForOwner,
  isTypeOwnedMetadataTargetUnavailable, parseMetadataTargetFromModel, parseMetadataTargetFromYAML,
} from "@nkdk/runtime/rule-kit"
import { projectMetadataTargetIndexKey } from "../validation/projectReferenceIndex"
import type { PendingMetadataTargetReference } from "../validation/projectReferenceIndex"
import type { ResolvedPropertyStateItemCapability } from "../ruleRuntime/definition"
import { createPropertyStateReferenceModeReader } from "../validation/configurationExtensionPropertyStateFacts"

export interface ImportBoundaryReference extends PendingMetadataTargetReference {
  readonly annotationKind?: "key"
}

const referenceProperties = new WeakMap<CompiledPropertyPlan, ReadonlyMap<string, readonly CompiledProperty[]>>()

function referencePlan(plan: CompiledPropertyPlan): ReadonlyMap<string, readonly CompiledProperty[]> {
  const cached = referenceProperties.get(plan)
  if (cached !== undefined) return cached
  const selected = new Map<string, CompiledProperty[]>()
  for (const property of plan.properties) {
    if (property.yamlKey === undefined || property.operations.nestedItemRule !== undefined
      || property.operations.metadataTargetOccurrences === undefined) continue
    const group = selected.get(property.yamlKey) ?? []
    group.push(property)
    selected.set(property.yamlKey, group)
  }
  referenceProperties.set(plan, selected)
  return selected
}

export function collectBoundaryReferenceFacts(params: {
  readonly context: ConfigurationContext
  readonly execution: CompiledPropertyRuleExecution
  readonly rule: MetadataItemRule
  readonly name?: string
  readonly yaml: Record<string, unknown>
  readonly yamlPath: readonly (string | number)[]
  readonly filePath: string
  readonly annotations: XmlAnomalyAnnotations
  readonly propertyStateCapability?: ResolvedPropertyStateItemCapability
}): { references: ImportBoundaryReference[]; issues: ValidationIssue[] } {
  const owner = metadataTargetOwnerFromRule({
    itemRule: params.rule, name: params.name, context: params.context, execution: params.execution,
  })
  const references: ImportBoundaryReference[] = []
  const issues: ValidationIssue[] = []
  const propertyStateMode = params.propertyStateCapability === undefined ? undefined
    : createPropertyStateReferenceModeReader({ yaml: params.yaml, rule: params.rule, capability: params.propertyStateCapability })
  const siblingValue = (key: string) => {
    const yamlKey = params.rule.properties[key]?.yaml
    return typeof yamlKey === "string" ? params.yaml[yamlKey] : undefined
  }
  const properties = referencePlan(params.execution.propertyPlan(params.rule))
  for (const yamlKey of Object.keys(params.yaml)) {
    for (const compiled of properties.get(yamlKey) ?? []) {
      const property = compiled.propertyRule
      const collect = compiled.operations.metadataTargetOccurrences
      if (collect === undefined) continue
      const annotation = params.annotations.at(params.yaml, yamlKey)
      if (annotation?.kind === "raw" && annotation.hasSemanticValue !== true) continue
      if (isTypeOwnedMetadataTargetUnavailable({ rule: property, siblingValue })) {
        issues.push({
          code: "diagnostic.reference", kind: "semantic",
          target: { kind: "path", path: [...params.yamlPath, yamlKey] },
          params: { message: `Свойство "${yamlKey}" недоступно для реквизита с составным типом` },
        })
        continue
      }
      const propertyOwner = metadataTargetOwnerForProperty({ rule: property, siblingValue, owner })
      for (const occurrence of collect({
        value: params.yaml[yamlKey], representation: "yaml", propRule: property,
        yamlPath: [...params.yamlPath, yamlKey], owner: propertyOwner,
      })) {
        const location = occurrence.location
        const path = location.kind === "key" ? [...location.path, location.key] : location.path
        const state = referenceAnnotationState(params, path, location.kind)
        if (state === "raw") continue
        const mapping = location.kind === "key"
          ? importedYamlValueAtPath(params.yaml, location.path.slice(params.yamlPath.length)) : undefined
        const keyAnnotation = location.kind === "key" && typeof mapping === "object" && mapping !== null
          ? params.annotations.keyAt(mapping, location.key) : undefined
        const canonical = keyAnnotation?.logicalKey ?? occurrence.representation.canonical
        if (isMetadataTargetUuid(canonical)) continue
        const constraint = metadataTargetConstraintForOwner(occurrence.constraint, propertyOwner)
        if ((constraint.kind === "dataTable" || constraint.kind === "dataTableField") && constraint.validation === "translateOnly") continue
        const yamlTarget = parseMetadataTargetFromYAML({ value: canonical, constraint, owner: propertyOwner })
        const parsed = yamlTarget.ok ? yamlTarget : parseMetadataTargetFromModel({ canonical, constraint, owner: propertyOwner })
        if (!parsed.ok) continue
        const mode = propertyStateMode?.(path.slice(params.yamlPath.length))
        references.push({
          ...(location.kind === "key" ? { annotationKind: "key" as const } : {}),
          filePath: params.filePath,
          yamlPath: [...path],
          canonical: projectMetadataTargetIndexKey(parsed.target), target: parsed.target, constraint,
          ...(state === "pending" ? { xmlAnomaly: "pending" as const } : {}),
          ...(mode === undefined ? {} : { propertyStateMode: mode }),
        })
      }
    }
  }
  return { references, issues }
}

export function referenceAnnotationState(
  params: Pick<Parameters<typeof collectBoundaryReferenceFacts>[0], "yaml" | "yamlPath" | "annotations">,
  path: readonly (string | number)[],
  annotationKind: "key" | "value" = "value",
): "raw" | "pending" | undefined {
  let value: unknown = params.yaml
  let state: "pending" | undefined
  for (let index = params.yamlPath.length; index < path.length; index += 1) {
    const segment = path[index]!
    if (typeof value !== "object" || value === null) return state
    const annotation = index === path.length - 1 && annotationKind === "key" && typeof segment === "string"
      ? params.annotations.keyAt(value, segment) : params.annotations.at(value, segment)
    if (annotation?.kind === "raw" && annotation.hasSemanticValue !== true) return "raw"
    const semantic = annotation?.kind === "raw" ? annotation.semantic : annotation
    if (index === path.length - 1 && (semantic?.kind === "invalid" || semantic?.kind === "important")) state = "pending"
    value = (value as Record<string | number, unknown>)[segment]
  }
  return state
}
