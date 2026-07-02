import { Type } from "@sinclair/typebox"
import { StringboolXML, StringboolYAML } from "../boolean/types"
import { MetadataNameYAML } from "../metadataName/types"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import * as SE from "../../systemEnumerations/types"
import {
  MetadataRegisterFieldFullYAML,
  MetadataRegisterFieldYAML,
  MetadataRegisterFieldXML,
} from "../metadataRegisterField/types"
import { MetadataRegisterDimensionRules } from "./rules"

export type MetadataRegisterDimension = MetadataTypeByRule<typeof MetadataRegisterDimensionRules>

export interface MetadataRegisterDimensionXML extends MetadataRegisterFieldXML {
  Properties: MetadataRegisterFieldXML["Properties"] & {
    AccountingFlag?: string
    Balance?: StringboolXML
    BaseDimension?: StringboolXML
    DenyIncompleteValues?: StringboolXML
    MainFilter?: StringboolXML
    Master?: StringboolXML
    ScheduleLink?: string
    TypeReductionMode?: SE.TypeReductionMode
    UseInTotals?: StringboolXML
  }
}

export interface MetadataRegisterDimensionFullYAML extends MetadataRegisterFieldFullYAML {
  Балансовый?: StringboolYAML
  БазовоеИзмерение?: StringboolYAML
  Ведущее?: StringboolYAML
  ЗапретНезавершенныхЗначений?: StringboolYAML
  ОсновнойОтбор?: StringboolYAML
  ПризнакУчета?: string
  РежимСокращенияТипа?: SE.TypeReductionModeYAML
  СвязьСГрафиком?: string
  ИспользоватьВИтогах?: StringboolYAML
}

export type MetadataRegisterDimensionYAML = MetadataRegisterDimensionFullYAML | MetadataRegisterFieldYAML

export type MetadataRegisterDimensions = MetadataRegisterDimension[]
export type MetadataRegisterDimensionsXML = MetadataRegisterDimensionXML | MetadataRegisterDimensionXML[]

export const MetadataRegisterDimensionsJSONSchema = Type.Record(Type.String(), Type.Any())
export type MetadataRegisterDimensionsYAML = Record<MetadataNameYAML, MetadataRegisterDimensionYAML>
