import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"

import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { Button } from "./types"

export const importButtonFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Button }): Button => {
  const { context, source } = params
  const result: Button = {
    itemType: "Button",
    name: importNameFromNKDK(source),
    title: importI8nTextFromNKDK(context, source.title),
  }

  return result
}

export const importCommandBarButtonFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CommandBarButton
}): Button =>
  importButtonFromNKDK({
    context: params.context,
    source: {
      elementName: params.source.elementName,
      title: params.source.title,
    } as NKDK.Button,
  })
