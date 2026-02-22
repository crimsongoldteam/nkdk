import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { Pages } from "./types"

export const importPagesFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.Pages
}): Pages => {
  const { context, source } = params
  const result: Pages = {
    itemType: CollectionFormElementType.Pages,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
    childItems: [],
  }

  return result
}
