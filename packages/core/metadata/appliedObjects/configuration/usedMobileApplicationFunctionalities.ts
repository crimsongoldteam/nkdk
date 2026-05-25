import { Static, Type } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  MobileApplicationFunctionalities,
  MobileApplicationFunctionalitiesFromYAML,
  MobileApplicationFunctionalitiesToYAML,
  MobileApplicationFunctionalitiesYAML,
} from "~/metadata/systemEnumerations/types"

export interface UsedMobileApplicationFunctionality {
  functionality: MobileApplicationFunctionalities
  use: boolean
}

export type UsedMobileApplicationFunctionalities = UsedMobileApplicationFunctionality[]

export interface UsedMobileApplicationFunctionalityYAML {
  Функциональность: MobileApplicationFunctionalitiesYAML
  Использовать: boolean
}

interface UsedMobileApplicationFunctionalityXML {
  "app:functionality": MobileApplicationFunctionalities
  "app:use": boolean | "true" | "false"
}

interface UsedMobileApplicationFunctionalitiesXML {
  "app:functionality"?: UsedMobileApplicationFunctionalityXML | UsedMobileApplicationFunctionalityXML[]
}

export const UsedMobileApplicationFunctionalitiesJSONSchema = Type.Array(
  Type.Object({
    Функциональность: Type.Union(
      Object.keys(MobileApplicationFunctionalitiesFromYAML).map((value) => Type.Literal(value)) as [
        ReturnType<typeof Type.Literal>,
        ReturnType<typeof Type.Literal>,
        ...ReturnType<typeof Type.Literal>[],
      ]
    ),
    Использовать: Type.Boolean(),
  })
)

export type UsedMobileApplicationFunctionalitiesYAML = Static<
  typeof UsedMobileApplicationFunctionalitiesJSONSchema
>

const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export const importUsedMobileApplicationFunctionalitiesFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: UsedMobileApplicationFunctionalitiesXML | "" | undefined
): UsedMobileApplicationFunctionalities | undefined => {
  if (xml === undefined) return undefined
  if (xml === "") return []

  return normalizeArray(xml["app:functionality"]).map((item) => ({
    functionality: item["app:functionality"],
    use: item["app:use"] === true || item["app:use"] === "true",
  }))
}

export const exportUsedMobileApplicationFunctionalitiesToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: UsedMobileApplicationFunctionalities | undefined
): UsedMobileApplicationFunctionalitiesXML | "" | undefined => {
  if (data === undefined) return undefined
  if (data.length === 0) return ""

  return {
    "app:functionality": data.map((item) => ({
      "app:functionality": item.functionality,
      "app:use": item.use,
    })),
  }
}

export const importUsedMobileApplicationFunctionalitiesFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: UsedMobileApplicationFunctionalityYAML[] | undefined
): UsedMobileApplicationFunctionalities | undefined => {
  if (yaml === undefined) return undefined

  return yaml.map((item) => ({
    functionality: MobileApplicationFunctionalitiesFromYAML[item.Функциональность],
    use: item.Использовать,
  }))
}

export const exportUsedMobileApplicationFunctionalitiesToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: UsedMobileApplicationFunctionalities | undefined
): UsedMobileApplicationFunctionalityYAML[] | undefined => {
  if (data === undefined) return undefined

  return data.map((item) => ({
    Функциональность: MobileApplicationFunctionalitiesToYAML[item.functionality],
    Использовать: item.use,
  }))
}

export const exportUsedMobileApplicationFunctionalitiesToJSONSchema: ExportToJSONSchemaFn = () =>
  UsedMobileApplicationFunctionalitiesJSONSchema

registerTypeRule(
  "UsedMobileApplicationFunctionalities",
  "importFromXML",
  importUsedMobileApplicationFunctionalitiesFromXML
)
registerTypeRule(
  "UsedMobileApplicationFunctionalities",
  "exportToXML",
  exportUsedMobileApplicationFunctionalitiesToXML
)
registerTypeRule(
  "UsedMobileApplicationFunctionalities",
  "importFromYAML",
  importUsedMobileApplicationFunctionalitiesFromYAML
)
registerTypeRule(
  "UsedMobileApplicationFunctionalities",
  "exportToYAML",
  exportUsedMobileApplicationFunctionalitiesToYAML
)
registerTypeRule(
  "UsedMobileApplicationFunctionalities",
  "exportToJSONSchema",
  exportUsedMobileApplicationFunctionalitiesToJSONSchema
)
