import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { PictureDecoration } from "./types"

export const importPictureDecorationFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.PictureDecoration
}): PictureDecoration => {
  const { source } = params
  const result: PictureDecoration = {
    itemType: CollectionFormElementType.PictureDecoration,
    name: importNameFromNKDK(source.name),
    ...(source.picture !== undefined && {
      picture: { ref: source.picture, type: "StandardPicture", loadTransparent: false },
    }),
  }

  return result
}
