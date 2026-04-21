import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { GraphOps, GraphOpsReference } from "~/metadata/orchestration/property/fn"
import { getTypeDescriptionRule } from "./helper"
import { TypeDescription } from "./types"

export function extractTypeDescriptionGraph(
  model: TypeDescription,
  position?: { offset: number; length?: number }
): GraphOps | undefined {
  const references: GraphOpsReference[] = []

  for (const type of model.type) {
    const dotIndex = type.indexOf(".")
    if (dotIndex === -1) continue
    const baseType = type.substring(0, dotIndex)
    const detailType = type.substring(dotIndex + 1)
    const rule = getTypeDescriptionRule(baseType)
    if (!rule?.modifier || rule.modifier === "alwaysType") continue

    const targetNodeId = `${rule.enterprise}.${detailType}`
    references.push({
      id: targetNodeId,
      name: detailType,
      positionFrom: position,
    })
  }

  if (references.length === 0) return undefined
  return { references }
}

registerTypeRule("TypeDescription", "extractGraph", extractTypeDescriptionGraph)
registerTypeRule("TypeDescription", "graphEdgeFromParent", { name: "Тип", kind: "reference" })
