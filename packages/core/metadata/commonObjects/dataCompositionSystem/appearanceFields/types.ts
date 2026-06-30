import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import type { ParameterValueDcsValueFragment, ParameterValueXML } from "../parameterValue/types"
import { AppearanceFieldsRules, type DirectAppearanceXMLTag } from "./rules"

export type AppearanceFields = FormTypeByRule<typeof AppearanceFieldsRules>

export type AppearanceFieldsYAML = YAMLTypeByRule<typeof AppearanceFieldsRules>

export type DirectAppearanceFieldXML = {
  "dcsset:value"?: ParameterValueDcsValueFragment | ParameterValueDcsValueFragment[]
}

export type AppearanceFieldsXML = Partial<Record<DirectAppearanceXMLTag, DirectAppearanceFieldXML>> & {
  "dcscor:item"?: ParameterValueXML | ParameterValueXML[]
}
