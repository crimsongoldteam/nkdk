import { Type, type TSchema } from "typebox"

import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { buildMetadataTargetSchema } from "../metadataTargets"

export function commandInterfaceSubsystemsOrderSchema(
  rule: PropertyRule,
  transportedItem?: TSchema,
): TSchema {
  const subsystem = buildMetadataTargetSchema(
    rule.metadataTarget ?? { kind: "object", roots: ["Subsystem"], allowNested: true },
  )
  return transportedItem === undefined
    ? Type.Array(Type.Union([subsystem, Type.Literal("")]))
    : Type.Array(Type.Union([subsystem, Type.Literal(""), transportedItem]))
}
