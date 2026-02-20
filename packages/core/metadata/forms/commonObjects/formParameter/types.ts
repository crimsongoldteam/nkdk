import {
  TypeDescription,
  TypeDescriptionXML,
  TypeDescriptionYAML,
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

export interface FormParameterYAML {
  Тип: TypeDescriptionYAML
  Ключевой?: boolean
}

export type FormParametersYAML = Record<string, FormParameterYAML>
