import type { TypeDescriptionView } from "../ruleRuntime/property/typeDescriptionView"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { ParsedYaml } from "@nkdk/runtime"
import type { Diagnostic } from "./types"
import type { YamlPath } from "./yamlLocations"
import type { ElementType } from "../ruleRuntime/formElement/types"

export interface FormAttributeColumnView {
  readonly name: string
  readonly type?: TypeDescriptionView
}

export interface FormAttributeView extends FormAttributeColumnView {
  readonly dynamicList?: unknown
  readonly columns?: readonly FormAttributeColumnView[]
  readonly additionalColumns?: readonly {
    table: string
    columns: readonly FormAttributeColumnView[]
  }[]
}

export interface FormValidationView {
  readonly itemType: string
  readonly attributes?: readonly FormAttributeView[]
  readonly childItems?: unknown
}

export interface FormElementNameCollectorView {
  acceptExplicit(params: { name: string; path: YamlPath }): void
  acceptReserved(params: {
    name: string
    path: YamlPath
    ownerName?: string
    propertyName?: string
  }): void
  finish(): Diagnostic[]
}

export interface FormStructuredComponent {
  readonly componentKind: string
  readonly name: string
  readonly yamlPath: YamlPath
  readonly payload?: string
}

export interface FormValidationAdapter {
  readonly formRule: MetadataItemRule
  readonly elementNamesProfileSubstep: string
  elementTypeFromYAML(value: unknown, tableContext: { dataPath: string } | undefined): ElementType | undefined
  createElementNameCollector(params: { filePath: string; parsed: ParsedYaml }): FormElementNameCollectorView
  collectStructuredComponents(
    yaml: unknown,
    owner?: { readonly kind: string; readonly name: string }
  ): readonly FormStructuredComponent[]
}
