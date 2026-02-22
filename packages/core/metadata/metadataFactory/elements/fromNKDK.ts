import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { AllChildItems } from "~/metadata/forms/commonObjects/childItems/types"
import { importFromNKDKFn } from "./toNKDKFactory/types"

export const importElementFromNKDK = (params: {
  context: ConfigurationContext
  value: NKDK.ChildItem
}): AllChildItems => {
  const { context, value } = params

  const fn = importFromNKDKFn[value.$type]
  if (!fn) {
    throw new Error(`Unknown child item type: ${value.$type}`)
  }

  const result = fn({ context, source: value })

  return result
}
