import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import type { ParameterValueXML } from "../parameterValue/types"
import { AppearanceFieldsRules } from "./rules"

export type AppearanceFields = FormTypeByRule<typeof AppearanceFieldsRules>

export type AppearanceFieldsYAML = YAMLTypeByRule<typeof AppearanceFieldsRules>

export type AppearanceFieldsXML = {
  "dcscor:item"?: ParameterValueXML | ParameterValueXML[]
}
