import { getParentFromContext } from "../../../context/helpers"
import { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { PropertyRule, TableAdditionalSourcePropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import { TableAdditionalSourceXML } from "./types"

export const exportTableAdditionalSourceToXML = (
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: string | undefined
): TableAdditionalSourceXML | undefined => {
  const ruleNarrow = rule as TableAdditionalSourcePropertyRule

  if (value) {
    return { Item: value, Type: ruleNarrow.additionalSourceType }
  }

  if (!ruleNarrow.forSingleElement) {
    return undefined
  }

  const parent = getParentFromContext(context, ["Table", "PDFDocumentField"])

  const parentName = parent.name

  return { Item: parentName, Type: ruleNarrow.additionalSourceType }
}

export const metadataPropertyRule000 = definePropertyTypeRule("TableAdditionalSource", "exportToXML", exportTableAdditionalSourceToXML)
