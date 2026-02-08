import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromPartialYAML, registerTypeRule, ToPartialEnterpriseType } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { AutoCommandBar } from "./types"

export const importAutoCommandBarFromYAML = <T extends AutoCommandBar>(
  context: ConfigurationContext,
  _rule: PropertyRule<T>,
  yaml: ToPartialEnterpriseType<T> | undefined,
  source?: T
): T | undefined => {
  if (yaml === undefined) return source

  return importElementFromPartialYAML<T>({
    context,
    elementType: "AutoCommandBar",
    yaml,
    source,
  })
}
registerTypeRule("AutoCommandBar", "importFromEnterprise", importAutoCommandBarFromYAML)
registerTypeRule("TableAutoCommandBar", "importFromEnterprise", importAutoCommandBarFromYAML)
