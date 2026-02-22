import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { AllChildItem } from "~/metadata/forms/commonObjects/childItems/types"
import { importFromNKDKFn } from "./toNKDKFactory/types"

export const importElementFromNKDK = (params: {
  context: ConfigurationContext
  value: NKDK.ChildItem
}): AllChildItem => {
  const { context, value } = params

  const fn = importFromNKDKFn[value.$type]
  if (!fn) {
    throw new Error(`Unknown child item type: ${value.$type}`)
  }

  const result = fn({ context, source: value as never })

  return result as AllChildItem
}
