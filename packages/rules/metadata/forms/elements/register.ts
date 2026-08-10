import { exportDataPathToEnterprise } from "../commonObjects/dataPath/toEnterprise"
import { childItemsTreePropertyTypes, getChildItemTypesByPropertyType } from "../commonObjects/childItems/treeYAML"
import {
  registerFormElementAdapter,
  registerFormElementCollection,
  registerFormElementDataPathExporter,
} from "../../ruleRuntime/formElement/registry"
import { formElementTypeToYAML } from "./formElementCatalog"

for (const [type, yamlName] of Object.entries(formElementTypeToYAML)) {
  registerFormElementAdapter({
    type: type as keyof typeof formElementTypeToYAML,
    yamlName,
  })
}

registerFormElementDataPathExporter(exportDataPathToEnterprise)

for (const propertyType of childItemsTreePropertyTypes) {
  registerFormElementCollection(propertyType, getChildItemTypesByPropertyType(propertyType))
}
