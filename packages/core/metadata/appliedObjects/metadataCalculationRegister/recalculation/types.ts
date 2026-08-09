import { Type } from "typebox"
import { MetadataNameYAML } from "../../../commonObjects/metadataName/types"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { RecalculationRules } from "./rules"

export type Recalculation = MetadataTypeByRule<typeof RecalculationRules>
export type RecalculationYAML = YAMLTypeByRule<typeof RecalculationRules>

export type Recalculations = Recalculation[]
export type RecalculationsXML = string | string[]

export const RecalculationsJSONSchema = Type.Record(Type.String(), Type.Any())
export type RecalculationsYAML = Record<MetadataNameYAML, RecalculationYAML>
