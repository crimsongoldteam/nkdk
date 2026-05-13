import { Type } from "@sinclair/typebox"
import { StringboolXML, StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { MetadataNameYAML } from "~/metadata/commonObjects/metadataName/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataRegisterFieldFullYAML, MetadataRegisterFieldYAML, MetadataRegisterFieldXML } from "../metadataRegisterField/types"
import { MetadataRegisterDimensionRules } from "./rules"

export type MetadataRegisterDimension = MetadataTypeByRule<typeof MetadataRegisterDimensionRules>

export interface MetadataRegisterDimensionXML extends MetadataRegisterFieldXML {
  Properties: MetadataRegisterFieldXML["Properties"] & {
    DenyIncompleteValues?: StringboolXML
    MainFilter?: StringboolXML
    Master?: StringboolXML
    TypeReductionMode?: SE.TypeReductionMode
    UseInTotals?: StringboolXML
  }
}

export interface MetadataRegisterDimensionFullYAML extends MetadataRegisterFieldFullYAML {
  Ведущее?: StringboolYAML
  ЗапретНезавершенныхЗначений?: StringboolYAML
  ОсновнойОтбор?: StringboolYAML
  РежимСокращенияТипа?: SE.TypeReductionModeYAML
  ИспользоватьВИтогах?: StringboolYAML
}

export type MetadataRegisterDimensionYAML = MetadataRegisterDimensionFullYAML | MetadataRegisterFieldYAML

export type MetadataRegisterDimensions = MetadataRegisterDimension[]
export type MetadataRegisterDimensionsXML = MetadataRegisterDimensionXML | MetadataRegisterDimensionXML[]

export const MetadataRegisterDimensionsJSONSchema = Type.Record(Type.String(), Type.Any())
export type MetadataRegisterDimensionsYAML = Record<MetadataNameYAML, MetadataRegisterDimensionYAML>
