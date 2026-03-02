import { Static, Type } from "@sinclair/typebox"
import * as SE from "~/metadata/systemEnumerations/types"

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

export const BorderJSONSchema = Type.Object({
  Имя: Type.Optional(Type.String()),
  Ширина: Type.Optional(Type.Number()),
  ТипРамки: Type.Optional(Type.String()),
})

export type BorderYAML = Static<typeof BorderJSONSchema>

export interface BorderEnterprise {
  Type: "Border"
  Width?: number
  Value?: string
}
