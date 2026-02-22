import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDK"
import { AllChildItems } from "./types"

export const importChildItemsFromNKDK = (params: {
  context: ConfigurationContext
  value: NKDK.ChildItem[]
}): AllChildItems => {
  const { context, value } = params

  const result: AllChildItems = []

  for (const item of value) {
    const resultItem = importElementFromNKDK({ context, value: item })
    result.push(resultItem)
  }

  return result
}
