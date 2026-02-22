import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { PictureField } from "./types"

export const importPictureFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.PictureField
}): PictureField => {
  const { context, source } = params
  const result: PictureField = {
    itemType: CollectionFormElementType.PictureField,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
  }

  return result
}

export const importTablePictureFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TablePictureField
}): PictureField =>
  importPictureFieldFromNKDK({
    context: params.context,
    source: { name: params.source.name, title: params.source.title } as NKDK.PictureField,
  })
