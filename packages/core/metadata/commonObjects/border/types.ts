import { Static, Type } from "@sinclair/typebox"
import * as SE from "~/metadata/systemEnumerations/types"
import { buildMetadataTargetSchema, type MetadataTargetConstraint } from "../metadataTargets"

export interface Border {
  ref?: string
  width?: number
  controlBorderType?: SE.ControlBorderType
}

export interface BorderStyleObject {
  "#text"?: string
  "_xsi:type"?: string
}

export interface BorderXML {
  _ref?: string
  _width?: number
  "v8ui:style"?: string | BorderStyleObject
}

export const borderStyleItemTarget = {
  kind: "object",
  roots: ["StyleItem"],
  filters: [{ kind: "styleItemType", values: ["Border"] }],
} as const satisfies MetadataTargetConstraint

export const BorderJSONSchema = Type.Object({
  Имя: Type.Optional(buildMetadataTargetSchema(borderStyleItemTarget)),
  Ширина: Type.Optional(Type.Number()),
  ТипРамки: Type.Optional(Type.String()),
})

export type BorderYAML = Static<typeof BorderJSONSchema>

export interface BorderEnterprise {
  Type: "Border"
  Width?: number
  Value?: `ControlBorderType.${SE.ControlBorderType}`
}
