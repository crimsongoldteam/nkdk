import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { CommandBar } from "./types"

export const importCommandBarFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CommandBar
}): CommandBar => {
  const { source } = params
  const result: CommandBar = {
    itemType: CollectionFormElementType.CommandBar,
    name: source.name,
    autofill: source.autofill,
    childItems: [],
  }

  return result
}
