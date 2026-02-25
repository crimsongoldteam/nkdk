import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/toEnterprise"
import { FormElementType } from "../metadataType/types"
import { exportPropertiesToEnterprise } from "../properties/toEnterprise"
import { ToEnterprise } from "../rules"
import { getElementRule } from "./ruleFactory"

export const exportElementToEnterprise = <T extends NamedElement>(params: {
  context: ConfigurationContext
  itemType: FormElementType
  value: T
}): ToEnterprise<T> => {
  const { context, itemType, value: element } = params

  const rules = getElementRule<T>(itemType)

  const properties = exportPropertiesToEnterprise({
    context,
    metadataItem: element,
    rule: rules,
  })

  const result = {
    ElementType: rules.enterpriseField,
    Type: exportSystemEnumerationToEnterprise({
      context,
      rule: { type: "SystemEnumeration", typeSE: "FormFieldType" },
      value: itemType,
    }),
    ...properties,
    Name: element.name,
  } satisfies ToEnterprise<T>

  return result
}
