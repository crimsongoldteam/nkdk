import { MetadataItemRule } from ".."
import { ConfigurationContext } from "../../context/types"
import { BaseElement } from "../../forms/elements/baseElement/types"
import { TypeRulesNames } from "../types/types"

export interface RegisterAsTypeRule<T extends BaseElement> {
  toXML: (context: ConfigurationContext, element: T | undefined) => { id: string; name: string }
}

export interface ElementRule<T extends BaseElement, ExtraProperties extends string = never> extends MetadataItemRule<
  T,
  ExtraProperties
> {
  enterpriseField?: "FormField" | "FormDecoration" | "FormTable" | "FormGroup" | "FormButton"
  alwaysExportToXML?: true

  registerAsType?: Partial<Record<TypeRulesNames, RegisterAsTypeRule<T>>>
}
