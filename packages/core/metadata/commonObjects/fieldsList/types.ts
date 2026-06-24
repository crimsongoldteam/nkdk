import { Static, Type } from "@sinclair/typebox"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export type FieldsList = string[]

export interface FieldsListXML {
  Field?: string | string[]
  "xr:Field"?: string | string[]
}

export type FieldsListXMLItem = "Field" | "xr:Field"

export interface FieldsListPropertyRule extends BasePropertyRule {
  type: "FieldsList"
  fieldsListXMLItem?: FieldsListXMLItem
}

export const FieldsListJSONSchema = Type.Array(Type.String())

export type FieldsListYAML = Static<typeof FieldsListJSONSchema>
