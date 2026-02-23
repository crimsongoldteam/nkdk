import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { importNameFromNKDK } from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import { importChildItemsFromNKDK } from "../../commonObjects/childItems/fromNKDK"
import { importAutoCommandBarFromNKDK } from "../autoCommandBar/fromNKDK"
import { Table } from "./types"

export const importTableFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Table }): Table => {
  const { context, source } = params

  const childItems = importChildItemsFromNKDK({ context: params.context, value: source.childItems })

  const autoCommandBar = importAutoCommandBarFromNKDK({ context, source: source.autoCommandBar })

  const result: Table = {
    itemType: CollectionFormElementType.Table,
    name: importNameFromNKDK(source.name),
    childItems: childItems,
  }

  if (autoCommandBar) result.autoCommandBar = autoCommandBar

  return result
}
