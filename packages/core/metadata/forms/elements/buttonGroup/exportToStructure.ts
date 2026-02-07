import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn } from "~/metadata/metadataFactory/types"
import { formatElementTitleAndName } from "../../format/helpers"
import { PropertyRule } from "../calendarField/rules"
import { ButtonGroup } from "./types"

export function exportButtonGroupContentToStructure(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  element: ButtonGroup
): IFormatElementResult {
  const resultString = "#" + formatContent(context, element)
  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

const formatContent = (context: ConfigurationContext, element: ButtonGroup): string => {
  return formatElementTitleAndName(context, element)
}

registerMetadata(
  "ExportToStructureContent",
  "ButtonGroup",
  exportButtonGroupContentToStructure as ExportToStructureContentFn
)
