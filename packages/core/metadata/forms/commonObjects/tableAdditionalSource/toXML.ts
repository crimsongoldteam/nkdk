import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule, TableAdditionalSourcePropertyRule } from "~/metadata/metadataFactory"
import { TableAdditionalSourceXML } from "./types"
import { name } from "assert"

const exportTableAdditionalSourceToXML = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: string | undefined
): TableAdditionalSourceXML | undefined => {
  const ruleNarrow = rule as TableAdditionalSourcePropertyRule<any>

  if (!ruleNarrow.forSingleElement && !value) {
    return undefined
  }

  const parent = getParentFromContext(context, CollectionFormElementType.Table)

  const name = parent.name

  return { Item: name, Type: ruleNarrow.additionalSourceType }
}

registerTypeRule("TableAdditionalSource", "exportToXML", exportTableAdditionalSourceToXML)
