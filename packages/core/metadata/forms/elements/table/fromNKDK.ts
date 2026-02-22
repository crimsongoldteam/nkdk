import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { Table } from "./types"

export const importTableFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.Table
}): Table => {
  const { source } = params
  const result: Table = {
    itemType: CollectionFormElementType.Table,
    name: importNameFromNKDK(source.name),
    childItems: [],
  }

  return result
}
