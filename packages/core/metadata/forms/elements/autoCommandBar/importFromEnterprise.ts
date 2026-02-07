import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { importFromEnterprisePartial } from "~/metadata/metadataFactory/element/importElementFromEnterprise"
import { PropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { AutoCommandBarRules } from "./rules"

export const importAutoCommandBarFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  structure: AutoCommandBar | undefined,
  enterprise: AutoCommandBarEnterprise | undefined
): AutoCommandBar | undefined => {
  if (enterprise === undefined) return structure

  const source: AutoCommandBar = structure ?? { autofill: true, childItems: [] }

  return importFromEnterprisePartial(context, AutoCommandBarRules as any, source as unknown as NamedElement, enterprise) as unknown as AutoCommandBar
}
