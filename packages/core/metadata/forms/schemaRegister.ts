import {
  recordOfDiscriminatedOneOfSchemaRefs,
  recordOfSchemaRef,
  schemaRef,
} from "../orchestration/jsonSchemaRefs"
import { exportMetadataItemToJSONSchema } from "../orchestration/metadataItem/toJSONSchema"
import {
  getChildItemTypesByPropertyType,
  getTreeNodeJSONSchemaPropertyAliases,
} from "./commonObjects/childItems/treeYAML"
import { FormAttributeColumnRules } from "./commonObjects/formAttribute/rules"
import { exportFormAttributeToJSONSchema } from "./commonObjects/formAttribute/toJSONSchema"
import { FormCommandRules } from "./commonObjects/formCommand/rules"
import { exportFormParameterToJSONSchema } from "./commonObjects/formParameter/toJSONSchema"
import { ClientApplicationFormRules } from "./clientApplicationForm/rules"
import { registerProjectJSONSchema, registerProjectJSONSchemaPropertyRefFactory } from "../project/schemaRegistry"
import { getElementRule } from "../orchestration/formElement/ruleFactory"
import { exportElementRuleToJSONSchema, exportSingleElementRuleToJSONSchema } from "../orchestration/formElement/toJSONSchema"
import {
  CollectableElementTypeToYAML,
  type CollectableElementType,
  type SingleElementType,
} from "../orchestration/formElement/types"

registerProjectJSONSchema("ClientApplicationForm", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: ClientApplicationFormRules })
)
registerProjectJSONSchema("FormAttribute", ({ context }) => exportFormAttributeToJSONSchema({ context }))
registerProjectJSONSchema("FormAttributeColumn", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: FormAttributeColumnRules })
)
registerProjectJSONSchema("FormCommand", ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: FormCommandRules })
)
registerProjectJSONSchema("FormParameter", () => exportFormParameterToJSONSchema())

registerProjectJSONSchemaPropertyRefFactory("ClientApplicationForm", () => schemaRef("ClientApplicationForm"))
registerProjectJSONSchemaPropertyRefFactory("FormAttributes", () => recordOfSchemaRef("FormAttribute"))
registerProjectJSONSchemaPropertyRefFactory("FormAttributeColumns", () => recordOfSchemaRef("FormAttributeColumn"))
registerProjectJSONSchemaPropertyRefFactory("FormCommands", () => recordOfSchemaRef("FormCommand"))
registerProjectJSONSchemaPropertyRefFactory("FormParameters", () => recordOfSchemaRef("FormParameter"))

for (const type of [
  "AutoCommandBar",
  "ContextMenu",
  "ExtendedTooltip",
  "SingleSearchControlAddition",
  "SingleSearchStringAddition",
  "SingleViewStatusAddition",
] as const satisfies readonly SingleElementType[]) {
  registerProjectJSONSchemaPropertyRefFactory(type, () => schemaRef(type))
}
registerProjectJSONSchemaPropertyRefFactory("TableAutoCommandBar", () => schemaRef("AutoCommandBar"))

for (const type of ["GroupChildItems", "CommandBarChildItems", "TableChildItems", "PagesChildItems"] as const) {
  registerProjectJSONSchemaPropertyRefFactory(type, () =>
    recordOfDiscriminatedOneOfSchemaRefs(getChildItemTypesByPropertyType(type), "Вид")
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

for (const type of ["AutoCommandBar", "ContextMenu"] as const satisfies readonly SingleElementType[]) {
  registerProjectJSONSchema(type, ({ context }) =>
    exportSingleElementRuleToJSONSchema({
      context: withNestedChildItems(context),
      rule: getElementRule(type),
    })
  )
}

for (const type of [
  "ExtendedTooltip",
  "SingleSearchControlAddition",
  "SingleSearchStringAddition",
  "SingleViewStatusAddition",
] as const satisfies readonly SingleElementType[]) {
  registerProjectJSONSchema(type, ({ context }) =>
    exportSingleElementRuleToJSONSchema({
      context,
      rule: getElementRule(type),
    })
  )
}

function withNestedChildItems<const Context extends { exportToJSONSchema?: object }>(context: Context): Context {
  if (context.exportToJSONSchema === undefined) return context

  return {
    ...context,
    exportToJSONSchema: {
      ...context.exportToJSONSchema,
      includeNestedChildItems: true,
    },
  }
}
