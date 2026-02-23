import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { importChildItemsFromNKDK } from "../../commonObjects/childItems/fromNKDK"
import { AutoCommandBar } from "./types"

export const importAutoCommandBarFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.AutoCommandBar | undefined
}): AutoCommandBar | undefined => {
  const { context, source } = params

  if (!source) return undefined

  const childItems = importChildItemsFromNKDK({ context, value: source.childItems })

  const result: AutoCommandBar = {
    itemType: "AutoCommandBar",
    autofill: source.autofill,
    childItems: childItems,
  }

  return result
}
