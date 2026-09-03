import {
  createFormElementCollectionNestedRule,
  composeMetadataRules,
  defineMetadataRules,
  definePropertyTypeRule,
  propertyTypesFromContributions,
  prepareFormElementOutput,
} from "@nkdk/runtime/rule-kit"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import { childItemsTreePropertyTypes, getChildItemTypesByPropertyType } from "../commonObjects/childItems/treeYAML"
import { formElementTypeToYAML } from "./formElementCatalog"
import { formElementRules } from "./metadataRules"
import { metadataRuleLayer000 as childItemsImportRules } from "../commonObjects/childItems/fromXMLToYAML"

const childItemsYamlRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions(
    childItemsTreePropertyTypes.flatMap((propertyType) => [
      definePropertyTypeRule(
        propertyType,
        "yamlToXMLNestedRule",
        createFormElementCollectionNestedRule({
          elementRules: formElementRules.formElements,
          elementKinds: formElementTypeToYAML,
          allowedTypes: getChildItemTypesByPropertyType(propertyType),
        }),
      ),
      definePropertyTypeRule(propertyType, "prepareXMLItemOutput", prepareFormElementOutput),
    ]),
  ),
})

export const formElementCollectionRules = composeMetadataRules(
  childItemsImportRules,
  childItemsYamlRules,
)
