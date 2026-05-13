import * as SE from "~/metadata/systemEnumerations/types"

export interface CommonAttributeContentItem {
  metadata: string
  use: SE.CommonAttributeUse
  conditionalSeparation?: string
}

export type CommonAttributeContent = CommonAttributeContentItem[]

export interface CommonAttributeContentItemXML {
  "xr:Metadata": string
  "xr:Use": SE.CommonAttributeUse
  "xr:ConditionalSeparation"?: string
}

export interface CommonAttributeContentXML {
  "xr:Item"?: CommonAttributeContentItemXML | CommonAttributeContentItemXML[]
}

export interface CommonAttributeContentItemYAML {
  Объект: string
  Использование: SE.CommonAttributeUseYAML
  УсловноеРазделение?: string
}

export type CommonAttributeContentYAML = CommonAttributeContentItemYAML[]
