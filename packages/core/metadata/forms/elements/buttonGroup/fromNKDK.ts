import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { ButtonGroup } from "./types"

export const importCommandGroupFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CommandGroup
}): ButtonGroup => {
  const { context, source } = params
  const result: ButtonGroup = {
    itemType: CollectionFormElementType.ButtonGroup,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
    childItems: [],
  }

  return result
}
