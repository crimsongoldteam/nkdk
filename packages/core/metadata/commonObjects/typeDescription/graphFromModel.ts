import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { canonicalizeMetadataTypeGraphPath } from "~/metadata/commonObjects/metadataPath/graphPath"
import { GraphOps, GraphOpsReference } from "~/metadata/orchestration/property/fn"
import { SourcePosition } from "~/metadata/orchestration/property/position"
import { getTypeDescriptionRule } from "./helper"
import { TypeDescription } from "./types"

export function isGraphReferenceTypeDescriptionItem(type: string): boolean {
  const dotIndex = type.indexOf(".")
  if (dotIndex === -1) return false
  const baseType = type.substring(0, dotIndex)
  const rule = getTypeDescriptionRule(baseType)
  return Boolean(rule?.modifier && rule.modifier !== "alwaysType")
}

export function filterTypeDescriptionGraphProps(model: unknown): unknown {
  const typeDescription = model as TypeDescription | undefined
  if (!typeDescription || !Array.isArray(typeDescription.type)) return model

  const type = typeDescription.type.filter((item) => !isGraphReferenceTypeDescriptionItem(item))
  return { ...typeDescription, type }
}

export function extractTypeDescriptionGraph(
  model: unknown,
  position?: SourcePosition
): GraphOps | undefined {
  const typeDescription = model as TypeDescription
  const references: GraphOpsReference[] = []

  for (const type of typeDescription.type) {
    if (!isGraphReferenceTypeDescriptionItem(type)) continue
    const dotIndex = type.indexOf(".")
    const baseType = type.substring(0, dotIndex)
    const detailType = type.substring(dotIndex + 1)

    const targetNodeId = canonicalizeMetadataTypeGraphPath(`${baseType}.${detailType}`)
    references.push({
      id: targetNodeId,
      name: detailType,
      positionFrom: position,
      edgeProps: baseType.endsWith("Object")
        ? { typeKind: "object" }
        : baseType.endsWith("Ref")
          ? { typeKind: "ref" }
          : undefined,
    })
  }

  if (references.length === 0) return undefined
  return { references, itemFlattenTransforms: [filterTypeDescriptionGraphProps] }
}

registerTypeRule("TypeDescription", "extractGraph", extractTypeDescriptionGraph)
// Регистрируем graphEdgeFromParent как маркер (означает «этот тип поддерживает extractGraph»).
// Kind ребра берётся из propRule.graphEdgeKind ?? propRule.yaml (правило #114).
registerTypeRule("TypeDescription", "graphEdgeFromParent", {})
