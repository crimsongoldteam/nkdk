import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule, TableAdditionalSourcePropertyRule } from "~/metadata/orchestration"
import { TableAdditionalSourceXML } from "./types"

const exportTableAdditionalSourceToXML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: string | undefined
): TableAdditionalSourceXML | undefined => {
  const ruleNarrow = rule as TableAdditionalSourcePropertyRule

  if (!ruleNarrow.forSingleElement) {
    if (!value) {
      return undefined
    }
    return { Item: value, Type: ruleNarrow.additionalSourceType }
  }

  const parent = getParentFromContext(context, ["Table"])

  const parentName = parent.name

  return { Item: parentName, Type: ruleNarrow.additionalSourceType }
}

registerTypeRule("TableAdditionalSource", "exportToXML", exportTableAdditionalSourceToXML)
