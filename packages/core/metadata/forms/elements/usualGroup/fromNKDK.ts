import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { UsualGroup } from "./types"

export const importUsualGroupFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.Group
}): UsualGroup => {
  const { context, source } = params
  const result: UsualGroup = {
    itemType: CollectionFormElementType.UsualGroup,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
    childItems: [],
  }

  return result
}

export const importGroupFromNKDK = importUsualGroupFromNKDK
