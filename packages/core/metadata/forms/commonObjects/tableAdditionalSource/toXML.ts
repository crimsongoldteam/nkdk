import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  FormElementType,
  PropertyRule,
  registerTypeRule,
  TableAdditionalSourcePropertyRule,
} from "~/metadata/metadataFactory"
import { TableAdditionalSourceXML } from "./types"

const exportTableAdditionalSourceToXML = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: string | undefined
): TableAdditionalSourceXML => {
  const ruleNarrow = rule as TableAdditionalSourcePropertyRule<any>

  const parent = getParentFromContext(context, FormElementType.Table)

  const name = value ?? parent.name

  return { Item: name, Type: ruleNarrow.additionalSourceType }
}

registerTypeRule("TableAdditionalSource", "exportToXML", exportTableAdditionalSourceToXML)
