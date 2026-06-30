import { recordOfOneOfSchemaRefs, recordOfSchemaRef } from "~/metadata/orchestration/jsonSchemaRefs"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import {
  getChildItemTypesByPropertyType,
  getTreeNodeJSONSchemaPropertyAliases,
} from "./commonObjects/childItems/treeYAML"
import { FormAttributeColumnRules, FormAttributeRules } from "./commonObjects/formAttribute/rules"
import { FormCommandRules } from "./commonObjects/formCommand/rules"
import { FormParameterRules } from "./commonObjects/formParameter/rules"
import { ClientApplicationFormRules } from "./clientApplicationForm/rules"
import {
  registerProjectJSONSchema,
  registerProjectJSONSchemaPropertyRefFactory,
} from "~/metadata/project/schemaRegistry"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { exportElementRuleToJSONSchema } from "~/metadata/orchestration/formElement/toJSONSchema"
import { CollectableElementTypeToYAML, type CollectableElementType } from "~/metadata/orchestration/formElement/types"

registerProjectJSONSchema("ClientApplicationForm", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: ClientApplicationFormRules })
)
registerProjectJSONSchema("FormAttribute", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: FormAttributeRules })
)
registerProjectJSONSchema("FormAttributeColumn", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: FormAttributeColumnRules })
)
registerProjectJSONSchema("FormCommand", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: FormCommandRules })
)
registerProjectJSONSchema("FormParameter", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: FormParameterRules })
)

registerProjectJSONSchemaPropertyRefFactory("FormAttributes", () => recordOfSchemaRef("FormAttribute"))
registerProjectJSONSchemaPropertyRefFactory("FormAttributeColumns", () => recordOfSchemaRef("FormAttributeColumn"))
registerProjectJSONSchemaPropertyRefFactory("FormCommands", () => recordOfSchemaRef("FormCommand"))
registerProjectJSONSchemaPropertyRefFactory("FormParameters", () => recordOfSchemaRef("FormParameter"))

for (const type of ["GroupChildItems", "CommandBarChildItems", "TableChildItems", "PagesChildItems"] as const) {
  registerProjectJSONSchemaPropertyRefFactory(type, () =>
    recordOfOneOfSchemaRefs(getChildItemTypesByPropertyType(type))
  )
}

for (const [itemType, yamlKind] of Object.entries(CollectableElementTypeToYAML)) {
  const elementType = itemType as CollectableElementType
  registerProjectJSONSchema(elementType, ({ context }) =>
    exportElementRuleToJSONSchema({
      context,
      propertyAliases: getTreeNodeJSONSchemaPropertyAliases(elementType),
      rule: getElementRule(elementType),
      yamlKind,
    })
  )
}
