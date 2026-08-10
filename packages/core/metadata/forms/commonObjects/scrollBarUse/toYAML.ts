import { ConfigurationContext } from "../../../context/types"
import { ExportToYAMLFunction, PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import * as SE from "../../../systemEnumerations/types"
import { ScrollBarUse } from "./types"

const exportScrollBarUseToYAML: ExportToYAMLFunction = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: ScrollBarUse | undefined
): string | undefined => {
  if (!value) return undefined

  const enumeration = SE.ScrollBarUseToYAML

  return enumeration[value]
}

export const metadataPropertyRule000 = definePropertyTypeRule("ScrollBarUseBoolean", "exportToYAML", exportScrollBarUseToYAML)
