import {
  defineMetadataItemCollectionRule as defineRuntimeMetadataItemCollectionRule,
  registerMetadataItemCollectionRule as registerRuntimeMetadataItemCollectionRule,
} from "@nkdk/runtime/rule-kit"
import { isMetadataNameYAML } from "../../commonObjects/metadataName/types"

export * from "@nkdk/runtime/rule-kit"

type DefineCollectionRule = typeof defineRuntimeMetadataItemCollectionRule
type RegisterCollectionRule = typeof registerRuntimeMetadataItemCollectionRule

export const defineMetadataItemCollectionRule: DefineCollectionRule = (params) =>
  defineRuntimeMetadataItemCollectionRule(withConcreteNameClassification(params))

export const registerMetadataItemCollectionRule: RegisterCollectionRule = (params) =>
  registerRuntimeMetadataItemCollectionRule(withConcreteNameClassification(params))

function withConcreteNameClassification<T extends {
  keyField?: PropertyKey
  recordYamlKeyFromYAML?: unknown
  classifyYamlKey?: (params: {
    yaml: Record<string, unknown>
    name: string
    yamlKey: string
  }) => "valid" | "invalid"
}>(params: T): T {
  if (
    params.keyField !== "name" ||
    params.recordYamlKeyFromYAML !== undefined ||
    params.classifyYamlKey !== undefined
  ) return params
  return {
    ...params,
    classifyYamlKey: ({ yamlKey }: { yamlKey: string }) =>
      isMetadataNameYAML(yamlKey) ? "valid" : "invalid",
  } as T
}
