import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { LabelDecoration } from "./types"

export const importLabelDecorationFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.LabelDecoration
}): LabelDecoration => {
  const { context, source } = params
  const result: LabelDecoration = {
    itemType: CollectionFormElementType.LabelDecoration,
    name: source.name,
    title: source.title
      ? { formatted: false, items: { [context.defaultLanguage]: source.title } }
      : undefined,
  }

  return result
}
