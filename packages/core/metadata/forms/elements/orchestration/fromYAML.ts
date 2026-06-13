import { ConfigurationContext } from "~/metadata/context/types"
import { ToMetadata, ToTypedYAML, ToYAML } from "~/metadata/orchestration/metadataItem/registry"
import { importPropertiesFromYAML } from "~/metadata/orchestration/property/fromYAML"
import { isEmptyMetadataItem } from "./helper"
import { getElementRule } from "./ruleFactory"
import {
  CollectableElementFromYAML,
  CollectableElementToYAML,
  CollectableElementType,
  CollectableElementTypeFromYAML,
  ElementRule,
  ElementType,
  SingleElementType,
  TypedFormElement,
} from "./types"

export const importFormElementTypeFromYAML = <D extends CollectableElementToYAML<CollectableElementType>>(
  _context: ConfigurationContext,
  data: D
): CollectableElementFromYAML<D> => {
  return CollectableElementTypeFromYAML[data] as CollectableElementFromYAML<D>
}

export function importElementFromTypedYAML<T extends TypedFormElement>(params: {
  context: ConfigurationContext
  yaml: ToTypedYAML<T["itemType"]> & { События?: Record<string, string> }
  name: string
}): T {
  const { context, yaml: yaml, name } = params

  const itemType = importFormElementTypeFromYAML(params.context, yaml.Тип)

  const metadataRule = getElementRule(itemType)

  const properties = importPropertiesFromYAML({
    context,
    yaml: yaml as ToYAML<T["itemType"]> & { События?: Record<string, string> },
    metadataRule: metadataRule,
  })

  const result = {
    ...properties,
    itemType: itemType,
    name: name,
  }

  return applyStructuralDiscriminators(result as T) as T
}

export const importSingleElementFromYAML = <Type extends SingleElementType>(params: {
  context: ConfigurationContext
  itemType: Type
  yaml: ToYAML<Type> | undefined
  source?: ToMetadata<Type>
}): ToMetadata<Type> | undefined => {
  const { context, itemType } = params

  const rules = getElementRule(itemType)

  const element = importElementFromPartialYAML(params)

  if (isEmptyMetadataItem({ context, rule: rules, element })) return undefined

  return element
}

export const importElementFromPartialYAML = <Type extends ElementType>(params: {
  context: ConfigurationContext
  itemType: Type
  yaml: ToYAML<Type> | undefined
  source?: ToMetadata<Type>
}): ToMetadata<Type> | undefined => {
  const { context, itemType, yaml, source } = params

  const rules = getElementRule(itemType)

  const element = importElementFromYAML({
    context: context,
    elementRule: rules,
    yaml: yaml,
    source: source,
  })

  return element
}

function importElementFromYAML<Rule extends ElementRule>(params: {
  context: ConfigurationContext
  elementRule: ElementRule
  yaml: ToYAML<Rule["itemType"]> | undefined
  source?: ToMetadata<Rule["itemType"]>
}): ToMetadata<Rule["itemType"]> {
  const { context, elementRule, yaml, source } = params
  const itemType = elementRule.itemType

  const properties = importPropertiesFromYAML({
    context,
    yaml,
    metadataRule: elementRule,
    source,
  })

  const result = {
    ...(source ? source : {}),
    ...properties,
    itemType: itemType,
  } as ToMetadata<Rule["itemType"]>

  return applyStructuralDiscriminators(result)
}

const applyStructuralDiscriminators = <Type extends ElementType>(element: ToMetadata<Type>): ToMetadata<Type> => {
  const result = { ...element } as ToMetadata<Type> & {
    type?: string
    extendedTooltip?: Record<string, unknown>
  }

  if (result.itemType === "Button" && result.type === undefined) {
    result.type = "UsualButton"
  }

  if (result.itemType === "CommandBarButton" && result.type === undefined) {
    result.type = "CommandBarButton"
  }

  if (
    (result.itemType === "SearchControlAddition" || result.itemType === "SingleSearchControlAddition") &&
    result.extendedTooltip !== undefined &&
    result.extendedTooltip.type === undefined
  ) {
    result.extendedTooltip = {
      ...result.extendedTooltip,
      type: "Label",
    }
  }

  return result
}
