import type { LocalXmlChild } from "./localProof"

type PropertyOrder = readonly { readonly propertyKey: string }[]
const positionsByOrder = new WeakMap<PropertyOrder, ReadonlyMap<string, number>>()

/** Хранит только вклад детей, не их значения или результаты контрольного экспорта. */
export function createLocalXmlChildOrder(order: readonly { readonly propertyKey: string }[]) {
  let positions = positionsByOrder.get(order)
  if (positions === undefined) {
    positions = new Map(order.map(({ propertyKey }, position) => [propertyKey, position]))
    positionsByOrder.set(order, positions)
  }
  const slots: (readonly LocalXmlChild[] | undefined)[] = new Array(order.length)
  let completed: readonly LocalXmlChild[] | undefined
  return {
    set(propertyKey: string, contribution: readonly LocalXmlChild[]): void {
      if (completed !== undefined) throw new Error("Порядок XML-детей уже завершён")
      const position = positions.get(propertyKey)
      if (position === undefined) throw new Error(`Свойство ${propertyKey} отсутствует в XML-порядке`)
      if (slots[position] !== undefined) throw new Error(`Повторный вклад XML-свойства ${propertyKey}`)
      slots[position] = contribution
    },
    finish(): readonly LocalXmlChild[] {
      if (completed !== undefined) return completed
      const children: LocalXmlChild[] = []
      for (const slot of slots) {
        if (slot !== undefined) for (const child of slot) children.push(child)
      }
      slots.length = 0
      completed = children
      return completed
    },
  }
}
