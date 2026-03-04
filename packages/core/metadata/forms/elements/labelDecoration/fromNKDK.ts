import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"

import {
  importFormattedI8nTextFromNKDK,
  importNameFromNKDK,
} from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { LabelDecoration } from "./types"

export const importLabelDecorationFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.LabelDecoration
}): LabelDecoration => {
  const { context, source } = params
  const result: LabelDecoration = {
    itemType: "LabelDecoration",
    name: importNameFromNKDK(source),
    title: importFormattedI8nTextFromNKDK(context, source.title ?? ""),
  }

  return result
}
