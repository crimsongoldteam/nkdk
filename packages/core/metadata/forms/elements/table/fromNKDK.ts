import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { importDataPathFromNKDK, importNameFromNKDK } from "~/metadata/orchestration/formElement/fromNKDK/helpers"
import { importChildItemsFromNKDK } from "../../commonObjects/childItems/fromNKDK"
import { importAutoCommandBarFromNKDK } from "../autoCommandBar/fromNKDK"
import { Table } from "./types"

export const importTableFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Table }): Table => {
  const { context, source } = params

  const childItems = importChildItemsFromNKDK({ context: params.context, value: source.childItems })

  const autoCommandBar = importAutoCommandBarFromNKDK({ context, source: source.autoCommandBar })

  const result: Table = {
    itemType: "Table",
    name: importNameFromNKDK(source),
    childItems: childItems,
  }

  if (autoCommandBar) result.autoCommandBar = autoCommandBar

  const dataPath = importDataPathFromNKDK(source)
  if (dataPath) {
    result.dataPath = dataPath
  }

  return result
}
