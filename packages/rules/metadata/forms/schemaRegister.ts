import type { ConfigurationContext } from "@nkdk/runtime"
import {
  recordOfDiscriminatedOneOfSchemaRefs,
  recordOfSchemaRef,
  schemaRef,
} from "../ruleRuntime/jsonSchemaRefs"
import { defineMetadataRules } from "../ruleRuntime/definition"
import type {
  MetadataSchemaDefinition,
  MetadataSchemaPropertyRefDefinition,
} from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import type { ElementRule } from "../ruleRuntime/formElement/types"
import {
  type CollectableElementType,
  type SingleElementType,
} from "../ruleRuntime/formElement/types"
import {
  exportElementRuleToJSONSchema,
  exportSingleElementRuleToJSONSchema,
} from "../ruleRuntime/formElement/toJSONSchema"
import { exportMetadataItemToJSONSchema } from "../ruleRuntime/metadataItem/toJSONSchema"
import {
  getChildItemTypesByPropertyType,
  getTreeNodeJSONSchemaPropertyAliases,
} from "./commonObjects/childItems/treeYAML"
import { FormAttributeColumnRules } from "./commonObjects/formAttribute/rules"
import { exportFormAttributeToJSONSchema } from "./commonObjects/formAttribute/toJSONSchema"
import { FormCommandRules } from "./commonObjects/formCommand/rules"
import { exportFormParameterToJSONSchema } from "./commonObjects/formParameter/toJSONSchema"
import { ClientApplicationFormRules } from "./clientApplicationForm/rules"

export function defineFormSchemaRules(
  formElements: Readonly<Record<string, ElementRule>>,
  formElementKinds: Readonly<Record<string, string>>,
) {
  const schemas: Record<string, MetadataSchemaDefinition> = {
    ClientApplicationForm: {
      source: ClientApplicationFormRules,
      export: ({ context }) =>
        exportMetadataItemToJSONSchema({
          context,
          rule: ClientApplicationFormRules,
        }),
    },
    FormAttribute: {
      source: "FormAttribute",
      export: ({ context }) => exportFormAttributeToJSONSchema({ context }),
    },
    FormAttributeColumn: {
      source: FormAttributeColumnRules,
      export: ({ context }) =>
        exportMetadataItemToJSONSchema({
          context,
          rule: FormAttributeColumnRules,
        }),
    },
    FormCommand: {
      source: FormCommandRules,
      export: ({ context }) =>
        exportMetadataItemToJSONSchema({ context, rule: FormCommandRules }),
    },
    FormParameter: {
      source: "FormParameter",
      export: () => exportFormParameterToJSONSchema(),
    },
  }

  for (const [itemType, yamlKind] of Object.entries(formElementKinds)) {
    const elementType = itemType as CollectableElementType
    const rule = requireElementRule(formElements, elementType)
    schemas[elementType] = {
      source: rule,
      export: ({ context }) =>
        exportElementRuleToJSONSchema({
          context,
          propertyAliases: getTreeNodeJSONSchemaPropertyAliases(elementType),
          rule,
          yamlKind,
        }),
    }
  }

  for (const type of ["AutoCommandBar", "ContextMenu"] as const) {
    const rule = requireElementRule(formElements, type)
    schemas[type] = {
      source: rule,
      export: ({ context }) =>
        exportSingleElementRuleToJSONSchema({
          context: withNestedChildItems(context),
          rule,
        }),
    }
  }

  for (const type of [
    "ExtendedTooltip",
    "SingleSearchControlAddition",
    "SingleSearchStringAddition",
    "SingleViewStatusAddition",
  ] as const satisfies readonly SingleElementType[]) {
    const rule = requireElementRule(formElements, type)
    schemas[type] = {
      source: rule,
      export: ({ context }) => exportSingleElementRuleToJSONSchema({ context, rule }),
    }
  }

  const schemaPropertyRefs: Record<
    string,
    MetadataSchemaPropertyRefDefinition
  > = {
    ClientApplicationForm: () => schemaRef("ClientApplicationForm"),
    FormAttributes: () => recordOfSchemaRef("FormAttribute"),
    FormAttributeColumns: () => recordOfSchemaRef("FormAttributeColumn"),
    FormCommands: () => recordOfSchemaRef("FormCommand"),
    FormParameters: () => recordOfSchemaRef("FormParameter"),
    TableAutoCommandBar: () => schemaRef("AutoCommandBar"),
  }
  for (const type of [
    "AutoCommandBar",
    "ContextMenu",
    "ExtendedTooltip",
    "SingleSearchControlAddition",
    "SingleSearchStringAddition",
    "SingleViewStatusAddition",
  ] as const satisfies readonly SingleElementType[]) {
    schemaPropertyRefs[type] = () => schemaRef(type)
  }
  for (const type of [
    "GroupChildItems",
    "CommandBarChildItems",
    "TableChildItems",
    "PagesChildItems",
  ] as const) {
    schemaPropertyRefs[type] = () =>
      recordOfDiscriminatedOneOfSchemaRefs(
        getChildItemTypesByPropertyType(type),
        "Вид",
      )
  }

  return defineMetadataRules({
    ...emptyMetadataRules,
    schemas,
    schemaPropertyRefs,
  })
}

function requireElementRule(
  formElements: Readonly<Record<string, ElementRule>>,
  type: string,
): ElementRule {
  const rule = formElements[type]
  if (rule === undefined) throw new Error(`Не найдено правило элемента формы: ${type}`)
  return rule
}

function withNestedChildItems(context: ConfigurationContext): ConfigurationContext {
  if (context.exportToJSONSchema === undefined) return context
  return {
    ...context,
    exportToJSONSchema: {
      ...context.exportToJSONSchema,
      includeNestedChildItems: true,
    },
  }
}
