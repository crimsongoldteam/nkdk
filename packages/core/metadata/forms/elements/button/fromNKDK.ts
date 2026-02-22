import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { Button } from "./types"

export const importButtonFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Button }): Button => {
  const { context, source } = params
  const result: Button = {
    itemType: CollectionFormElementType.Button,
    name: importNameFromNKDK(source.name),
    title: importI8nTextFromString({ context, value: source.title }),
  }

  return result
}

export const importCommandBarButtonFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CommandBarButton
}): Button =>
  importButtonFromNKDK({
    context: params.context,
    source: { name: params.source.name, title: params.source.title } as NKDK.Button,
  })
