import { ConfigurationContext } from "~/metadata/context/types"
import { importFromEnterprisePartial } from "~/metadata/metadataFactory/element/importElementFromEnterprise"
import { PropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { AutoCommandBarRules } from "./rules"
import { AutoCommandBar, AutoCommandBarEnterprise } from "./types"

export const importAutoCommandBarFromEnterprise = <T extends AutoCommandBar>(
  context: ConfigurationContext,
  _rule: PropertyRule<T>,
  yaml: AutoCommandBarEnterprise | undefined,
  source?: T
): T | undefined => {
  if (yaml === undefined) return source

  return importFromEnterprisePartial(context, AutoCommandBarRules, yaml, source) as T
}
