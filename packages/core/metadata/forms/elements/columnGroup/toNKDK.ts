import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { HorizontalColumnGroupPrefix, InCellColumnGroupPrefix, VerticalColumnGroupPrefix } from "~/nkdk/terminal"
import { ColumnGroup } from "./types"

export const exportColumnGroupContentToNKDK = (params: {
  context: ConfigurationContext
  element: ColumnGroup
}): ToNKDKResult => {
  const { element } = params
  const resultString = getColumnGroupPrefix(element.group) + formatElementName(element)

  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}

const getColumnGroupPrefix = (group: SE.ColumnsGroup): string => {
  switch (group) {
    case "Horizontal":
      return HorizontalColumnGroupPrefix
    case "Vertical":
      return VerticalColumnGroupPrefix
    case "InCell":
      return InCellColumnGroupPrefix
  }
}
