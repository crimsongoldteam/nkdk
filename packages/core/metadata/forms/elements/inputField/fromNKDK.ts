import { NkdkInputField } from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { InputField } from "./types"

export const importInputFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NkdkInputField
}): InputField | undefined => {
  const { context, source } = params
  const result: InputField = {
    itemType: CollectionFormElementType.InputField,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
  }

  return result
}
