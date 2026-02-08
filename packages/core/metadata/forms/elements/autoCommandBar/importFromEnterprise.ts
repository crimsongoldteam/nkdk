import { ConfigurationContext } from "~/metadata/context/types"
import { importElementFromYAMLPartial, ToPartialEnterpriseType } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { AutoCommandBar } from "./types"

export const importAutoCommandBarFromEnterprise = <T extends AutoCommandBar>(
  context: ConfigurationContext,
  _rule: PropertyRule<T>,
  yaml: ToPartialEnterpriseType<T> | undefined,
  source?: T
): T | undefined => {
  if (yaml === undefined) return source

  return importElementFromYAMLPartial<T>(context, "AutoCommandBar", yaml, source)
}
