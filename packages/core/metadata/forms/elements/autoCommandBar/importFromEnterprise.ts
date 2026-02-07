import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { importFromEnterprisePartial } from "~/metadata/metadataFactory/element/importElementFromEnterprise"
import { PropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { AutoCommandBarRules } from "./rules"
import { AutoCommandBar, AutoCommandBarEnterprise } from "./types"

export const importAutoCommandBarFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  structure: AutoCommandBar | undefined,
  yaml: AutoCommandBarEnterprise | undefined
): AutoCommandBar | undefined => {
  if (yaml === undefined) return structure

  const source: AutoCommandBar = structure ?? { autofill: true, childItems: [] }

  return importFromEnterprisePartial(
    context,
    AutoCommandBarRules as any,
    source as unknown as NamedElement,
    enterprise
  ) as unknown as AutoCommandBar
}
