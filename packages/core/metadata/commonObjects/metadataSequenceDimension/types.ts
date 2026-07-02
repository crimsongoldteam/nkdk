import { I8nTextXML, I8nTextYAML } from "../i8nText/types"
import { MetadataItemLinksXML, MetadataItemLinksYAML } from "../metadataRef/types"
import { TypeDescriptionXML, TypeDescriptionYAML } from "../typeDescription/types"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { MetadataSequenceDimensionRules } from "./rules"
import { MetadataNameYAML } from "../metadataName/types"

export type MetadataSequenceDimension = MetadataTypeByRule<typeof MetadataSequenceDimensionRules>

export interface MetadataSequenceDimensionXML {
  _uuid: string
  Properties: {
    Comment?: string
    DocumentMap?: MetadataItemLinksXML
    Name: string
    RegisterRecordsMap?: MetadataItemLinksXML
    Synonym?: I8nTextXML
    Type: TypeDescriptionXML
  }
}

export interface MetadataSequenceDimensionYAML {
  Имя?: string
  Синоним?: I8nTextYAML
  Комментарий?: string
  Тип?: TypeDescriptionYAML
  СоответствиеРеквизитамДокументов?: MetadataItemLinksYAML
  СоответствиеРеквизитамДвижений?: MetadataItemLinksYAML
}

export type MetadataSequenceDimensions = MetadataSequenceDimension[]

export type MetadataSequenceDimensionsXML = MetadataSequenceDimensionXML | MetadataSequenceDimensionXML[]

export type MetadataSequenceDimensionsYAML = Record<MetadataNameYAML, MetadataSequenceDimensionYAML>
