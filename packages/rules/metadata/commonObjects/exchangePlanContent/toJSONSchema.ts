import { Type, type TProperties, type TSchema } from "typebox"
import type { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRuleExecution } from "../../ruleRuntime/property/fn"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"

import { ExchangePlanContentItemRules } from "./rules"

export function exchangePlanContentItemsToJSONSchema(params: {
  readonly context: ConfigurationContext
  readonly execution?: PropertyRuleExecution
}): TSchema {
  const ordinary = exportMetadataItemToJSONSchema({
    context: params.context,
    rule: ExchangePlanContentItemRules,
    execution: params.execution,
  })
  if (!("properties" in ordinary) || !isProperties(ordinary.properties)) {
    throw new Error("JSON Schema элемента состава должна быть объектом")
  }
  const properties = ordinary.properties
  const metadata = requiredSchema(properties.Метаданные, "Метаданные")
  const autoRecord = properties.Авторегистрация
  return Type.Array(Type.Union([
    Type.Object({
      Метаданные: metadata,
      ...(autoRecord === undefined ? {} : { Авторегистрация: autoRecord }),
    }, { additionalProperties: false }),
    Type.Object({
      Метаданные: metadata,
      Использовать: Type.Literal("Ложь"),
    }, { additionalProperties: false }),
  ]), { minItems: 1 })
}

function isProperties(value: unknown): value is TProperties {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function requiredSchema(value: TSchema | undefined, name: string): TSchema {
  if (value === undefined) throw new Error(`Не построена JSON Schema свойства ${name}`)
  return value
}
