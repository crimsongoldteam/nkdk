import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { canonicalizeMetadataTypeGraphPath } from "~/metadata/commonObjects/metadataPath/graphPath"
import { GraphOps, GraphOpsReference } from "~/metadata/orchestration/property/fn"
import { SourcePosition } from "~/metadata/orchestration/property/position"
import { getTypeDescriptionRule } from "./helper"
import { TypeDescription } from "./types"

export function extractTypeDescriptionGraph(
  model: unknown,
  position?: SourcePosition
): GraphOps | undefined {
  const typeDescription = model as TypeDescription
  const references: GraphOpsReference[] = []

  for (const type of typeDescription.type) {
    const dotIndex = type.indexOf(".")
    if (dotIndex === -1) continue
    const baseType = type.substring(0, dotIndex)
    const detailType = type.substring(dotIndex + 1)
    const rule = getTypeDescriptionRule(baseType)
    if (!rule?.modifier || rule.modifier === "alwaysType") continue

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
  return { references }
}

registerTypeRule("TypeDescription", "extractGraph", extractTypeDescriptionGraph)
// Регистрируем graphEdgeFromParent как маркер (означает «этот тип поддерживает extractGraph»).
// Kind ребра берётся из propRule.graphEdgeKind ?? propRule.yaml (правило #114).
registerTypeRule("TypeDescription", "graphEdgeFromParent", {})
