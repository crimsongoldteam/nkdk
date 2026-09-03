import { arrangeProperties } from "../../../helpers/arrangeProperties"

interface XMLPropertyPath { readonly xmlPath: readonly string[] }
interface XMLObjectOrder extends Map<string, XMLObjectOrder> {}

const orders = new WeakMap<readonly XMLPropertyPath[], XMLObjectOrder>()

/** План содержит лишь собственные XML-оболочки. В готовые значения детей не спускаемся. */
export function orderXmlPropertyOutput(
  xml: Record<string, unknown>,
  properties: readonly XMLPropertyPath[],
): void {
  let order = orders.get(properties)
  if (order === undefined) {
    order = new Map()
    for (const property of properties) {
      let current = order
      for (const key of property.xmlPath) {
        let child = current.get(key)
        if (child === undefined) {
          child = new Map()
          current.set(key, child)
        }
        current = child
      }
    }
    orders.set(properties, order)
  }
  applyOrder(xml, order)
}

function applyOrder(xml: Record<string, unknown>, order: XMLObjectOrder): void {
  const original = Object.keys(xml)
  const keys: string[] = []
  for (const [key, nestedOrder] of order) {
    if (!Object.prototype.hasOwnProperty.call(xml, key)) continue
    keys.push(key)
    if (nestedOrder.size === 0) continue
    const nested = xml[key]
    if (nested !== null && typeof nested === "object" && !Array.isArray(nested)) {
      applyOrder(nested as Record<string, unknown>, nestedOrder)
    }
  }
  for (const key of original) if (!order.has(key)) keys.push(key)
  arrangeProperties(xml, original, keys)
}
