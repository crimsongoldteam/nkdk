import type { XMLItemOutputPreparation } from "../property/fromYAMLToXMLTypes"
import { copyXmlAnomalyExportClaim } from "../xmlAnomaly/exportClaim"

export function prepareXMLItemOwnAttributes(
  own: Readonly<Record<string, unknown>>,
  preparation: XMLItemOutputPreparation | undefined,
): Readonly<Record<string, unknown>> {
  const result = preparation?.attributes(own) ?? own
  for (const key of Object.keys(result)) {
    if (!key.startsWith("_")) throw new Error(`Обработчик собственных XML-атрибутов вернул ${key}`)
  }
  return result
}

/** Обычный экспорт сохраняет детей; предметный обработчик видит только атрибуты. */
export function applyXMLItemOwnOutput(
  body: Record<string, unknown>,
  preparation: XMLItemOutputPreparation | undefined,
): Record<string, unknown> {
  if (preparation === undefined) return body
  const own: Record<string, unknown> = {}
  for (const key of Object.keys(body)) if (key.startsWith("_")) own[key] = body[key]
  const result = { ...prepareXMLItemOwnAttributes(own, preparation) }
  for (const key of Object.keys(body)) if (!key.startsWith("_")) result[key] = body[key]
  copyXmlAnomalyExportClaim(body, result)
  preparation.initialize?.(result)
  return preparation.wrap?.(result) ?? result
}
