import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { importFromEnterprisePartial } from "~/metadata/metadataFactory/element/importElementFromEnterprise"
import { PropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { AutoCommandBarRules } from "./rules"
import { AutoCommandBar, AutoCommandBarEnterprise } from "./types"

export const importAutoCommandBarFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  yaml: AutoCommandBarEnterprise | undefined,
  structure?: AutoCommandBar | undefined
): AutoCommandBar | undefined => {
  if (yaml === undefined) return structure

  const source: AutoCommandBar = structure ?? { autofill: true, childItems: [] }

  return importFromEnterprisePartial(
    context,
    AutoCommandBarRules as any,
    yaml,
    source as unknown as NamedElement
  ) as unknown as AutoCommandBar
}
