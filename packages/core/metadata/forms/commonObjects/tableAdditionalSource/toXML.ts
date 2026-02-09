import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule, TableAdditionalSourcePropertyRule } from "~/metadata/metadataFactory"
import { TableAdditionalSourceXML } from "./types"

const exportTableAdditionalSourceToXML = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  value: string | undefined
): TableAdditionalSourceXML => {
  const ruleNarrow = rule as TableAdditionalSourcePropertyRule<any>

  const name = value ?? context.elementContext!.name

  return { Item: name, Type: ruleNarrow.additionalSourceType }
}

registerTypeRule("TableAdditionalSource", "exportToXML", exportTableAdditionalSourceToXML)
