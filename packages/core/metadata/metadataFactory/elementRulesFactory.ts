import { MetadataItemRule, PropertyRule, ToYAML } from "."
import { ConfigurationContext } from "../context/types"
import { BaseElement } from "../forms/elements/baseElement/types"
import { exportElementToPartialYAML } from "./element/exportElementToEnterprise"
import { importElementFromPartialYAML } from "./element/importElementFromEnterprise"
import { importSingleElementFromXML } from "./element/importElementFromXML"
import { exportSingleElementToXML } from "./element/toXML"
import { FormElementType } from "./metadataType/types"
import { TypeRulesNames, registerTypeRule } from "./typeRulesFactory"
import { ElementXML } from "./types"

interface RegisterAsTypeRule<T extends BaseElement> {
  toXML: (context: ConfigurationContext, element: T | undefined) => { id: string; name: string }
}

export interface ElementRule<T extends BaseElement, ExtraProperties extends string = never> extends MetadataItemRule<
  T,
  ExtraProperties
> {
  events?: T extends { events?: infer P }
    ? Record<keyof Required<P>, ToYAML<T> extends { События?: infer Pyaml } ? keyof Required<Pyaml> : never>
    : never
  enterpriseField?: "FormField" | "FormDecoration" | "FormTable" | "FormGroup" | "FormButton"
  alwaysExportToXML?: true

  registerAsType?: Partial<Record<TypeRulesNames, RegisterAsTypeRule<T>>>
}

const elementRulesRegistry = new Map<FormElementType, ElementRule<any>>()

export function registerElementRule<T extends BaseElement>(
  itemType: FormElementType,
  elementRule: ElementRule<T>
): void {
  elementRulesRegistry.set(itemType, elementRule)

  registerAsTypeRegistry(itemType, elementRule)
}

export const getElementRule = <T extends BaseElement>(itemType: FormElementType): ElementRule<T> => {
  const rule = elementRulesRegistry.get(itemType)
  if (!rule) {
    throw new Error(`Unknown element type: ${itemType}`)
  }
  return rule
}

export const clearElementRulesRegistry = (): void => {
  elementRulesRegistry.clear()
}

const registerAsTypeRegistry = <T extends BaseElement>(
  itemType: FormElementType,
  elementRule: ElementRule<T>
): void => {
  if (!elementRule.registerAsType) return

  for (const [propertyType, propertyRule] of Object.entries(elementRule.registerAsType) as [
    TypeRulesNames,
    RegisterAsTypeRule<T>,
  ][]) {
    registerImportFromXML<T>(propertyType, itemType, elementRule)
    registerExportToYAML<T>(propertyType)
    registerImportFromYAML<T>(propertyType, itemType)
    registerExportToXML<T>({ propertyType, propertyRule, elementRule, itemType })
  }
}

const registerImportFromXML = <T extends BaseElement>(
  propertyType: TypeRulesNames,
  itemType: FormElementType,
  elementRule: ElementRule<T>
): void => {
  registerTypeRule(
    propertyType,
    "importFromXML",
    (context: ConfigurationContext, _rule: PropertyRule<T>, xml: ElementXML): T | undefined => {
      return importSingleElementFromXML({
        context,
        itemType: itemType,
        rule: elementRule,
        xml,
      })
    }
  )
}

const registerExportToYAML = <T extends BaseElement>(propertyType: TypeRulesNames): void => {
  registerTypeRule(
    propertyType,
    "exportToEnterprise",
    (context: ConfigurationContext, _rule: PropertyRule<T>, data: T | undefined): ToYAML<T> | undefined => {
      return exportElementToPartialYAML({ context, element: data })
    }
  )
}

const registerImportFromYAML = <T extends BaseElement>(
  propertyType: TypeRulesNames,
  itemType: FormElementType
): void => {
  registerTypeRule(
    propertyType,
    "importFromEnterprise",
    (context: ConfigurationContext, _rule: PropertyRule<T>, yaml: ToYAML<T> | undefined, source?: T): T | undefined => {
      return importElementFromPartialYAML({
        context,
        itemType: itemType,
        yaml,
        source,
      })
    }
  )
}

const registerExportToXML = <T extends BaseElement>(params: {
  propertyType: TypeRulesNames
  propertyRule: RegisterAsTypeRule<T>
  elementRule: ElementRule<T>
  itemType: FormElementType
}): void => {
  const { propertyType, propertyRule, elementRule, itemType } = params
  const toXMLFn = propertyRule.toXML

  registerTypeRule(
    propertyType,
    "exportToXML",
    (context: ConfigurationContext, _rule: PropertyRule<T>, value: T | undefined): ElementXML => {
      const extraParams = toXMLFn(context, value)

      return exportSingleElementToXML({
        context,
        element: value,
        rule: elementRule,
        itemType: itemType,
        ...extraParams,
      })
    }
  )
}
