import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  CollectionFormElementType,
  PropertyRule,
  registerTypeRule,
  TableAdditionalSourcePropertyRule,
} from "~/metadata/metadataFactory"
import { TableAdditionalSourceXML } from "./types"

const exportTableAdditionalSourceToXML = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: string | undefined
): TableAdditionalSourceXML | undefined => {
  const ruleNarrow = rule as TableAdditionalSourcePropertyRule<any>

  if (!ruleNarrow.forSingleElement) {
    if (!value) {
      return undefined
    }
    return { Item: value, Type: ruleNarrow.additionalSourceType }
  }

  const parent = getParentFromContext(context, CollectionFormElementType.Table)

  const parentName = parent.name

  return { Item: parentName, Type: ruleNarrow.additionalSourceType }
}

registerTypeRule("TableAdditionalSource", "exportToXML", exportTableAdditionalSourceToXML)
