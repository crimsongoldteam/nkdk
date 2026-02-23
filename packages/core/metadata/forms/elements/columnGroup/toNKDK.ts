import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { ColumnGroup } from "./types"
import { ColumnGroupPrefix } from "~/nkdk/lexer"

export const exportColumnGroupContentToNKDK = (params: {
  context: ConfigurationContext
  element: ColumnGroup
}): ToNKDKResult => {
  const { element } = params
  const resultString = ColumnGroupPrefix + formatElementName(element)

  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}
