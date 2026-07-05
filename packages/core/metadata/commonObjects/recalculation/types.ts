import { Type } from "@sinclairtypebox"
import { MetadataNameYAML } from "../metadataName/types"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { RecalculationRules } from "./rules"

export type Recalculation = MetadataTypeByRule<typeof RecalculationRules>
export type RecalculationYAML = YAMLTypeByRule<typeof RecalculationRules>

export type Recalculations = Recalculation[]
export type RecalculationsXML = string | string[]

export const RecalculationsJSONSchema = Type.Record(Type.String(), Type.Any())
export type RecalculationsYAML = Record<MetadataNameYAML, RecalculationYAML>
