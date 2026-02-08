import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromYAML, registerTypeRule, ToPartialEnterpriseType } from "~/metadata/metadataFactory"
import { ElementRule, PropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { AutoCommandBarRules } from "./rules"
import { AutoCommandBar } from "./types"

export const importAutoCommandBarFromYAML = <T extends AutoCommandBar>(
  context: ConfigurationContext,
  _rule: PropertyRule<T>,
  yaml: ToPartialEnterpriseType<T> | undefined,
  source?: T
): T | undefined => {
  if (yaml === undefined) return source

  return importElementFromYAML<T>({
    context,
    rules: AutoCommandBarRules as ElementRule<T>,
    yaml,
    source,
  })
}
registerTypeRule("AutoCommandBar", "importFromEnterprise", importAutoCommandBarFromYAML)
registerTypeRule("TableAutoCommandBar", "importFromEnterprise", importAutoCommandBarFromYAML)
