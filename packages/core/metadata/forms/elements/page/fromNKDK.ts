import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { Page } from "./types"

export const importPageFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.Page
}): Page => {
  const { context, source } = params
  const result: Page = {
    itemType: CollectionFormElementType.Page,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
    childItems: [],
  }

  return result
}
