import * as NKDK from "nkdk-language"
import { importPictureFromYAML } from "~/metadata/commonObjects/picture/fromYAML"
import { ConfigurationContext } from "~/metadata/context/types"

import { importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { PictureDecoration } from "./types"

export const importPictureDecorationFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.PictureDecoration
}): PictureDecoration => {
  const { context, source } = params

  const pictureValue = normalizeBracketedPicture(source.picture)
  const picture = importPictureFromYAML(context, undefined, pictureValue)

  const result: PictureDecoration = {
    itemType: CollectionFormElementType.PictureDecoration,
    name: importNameFromNKDK(source),
    picture: picture,
  }

  return result
}

const normalizeBracketedPicture = (value: string | undefined): string | undefined =>
  value === undefined
    ? undefined
    : value
        .replace(/^\s*\[\s*/, "")
        .replace(/\s*\]\s*$/, "")
        .trim()
