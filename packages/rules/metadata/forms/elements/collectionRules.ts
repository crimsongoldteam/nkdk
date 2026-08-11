import {
  createFormElementCollectionNestedRule,
  composeMetadataRules,
  defineMetadataRules,
  definePropertyTypeRule,
  propertyTypesFromContributions,
} from "@nkdk/runtime/rule-kit"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import { childItemsTreePropertyTypes, getChildItemTypesByPropertyType } from "../commonObjects/childItems/treeYAML"
import { formElementTypeToYAML } from "./formElementCatalog"
import { formElementRules } from "./metadataRules"
import { metadataRuleLayer000 as childItemsImportRules } from "../commonObjects/childItems/fromXMLToYAML"

const childItemsYamlRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions(
    childItemsTreePropertyTypes.map((propertyType) =>
      definePropertyTypeRule(
        propertyType,
        "yamlToXMLNestedRule",
        createFormElementCollectionNestedRule({
          elementRules: formElementRules.formElements,
          elementKinds: formElementTypeToYAML,
          allowedTypes: getChildItemTypesByPropertyType(propertyType),
        }),
      )),
  ),
})

export const formElementCollectionRules = composeMetadataRules(
  childItemsImportRules,
  childItemsYamlRules,
)
