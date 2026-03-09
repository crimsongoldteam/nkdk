import { Static, Type } from "@sinclair/typebox"
import {
  TypeDescription,
  TypeDescriptionJSONSchema,
  TypeDescriptionXML,
} from "~/metadata/commonObjects/typeDescription/types"

export interface FormParameter {
  name: string
  type: TypeDescription
  keyParameter?: boolean
}

export type FormParameters = FormParameter[]

export interface FormParameterXML {
  _name: string
  Type: TypeDescriptionXML
  KeyParameter?: boolean
}

export type FormParametersXML = FormParameterXML | FormParameterXML[]

export const FormParameterJSONSchema = Type.Object({
  Тип: TypeDescriptionJSONSchema,
  Ключевой: Type.Optional(Type.Boolean()),
})

export type FormParameterYAML = Static<typeof FormParameterJSONSchema>

export const FormParametersJSONSchema = Type.Record(Type.String(), FormParameterJSONSchema)

export type FormParametersYAML = Static<typeof FormParametersJSONSchema>
