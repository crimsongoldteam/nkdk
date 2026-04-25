import type { MetadataItemRule, PropertyRule } from "../property/types"

/**
 * Находит инлайн-свойство правила (свойство с `yamlInline: true`, не помеченное `forReferenceOnly`).
 *
 * Используется в YAML- и JSON-схема-ориентированных операциях `metadataItem`, чтобы убрать
 * лишний уровень вложенности, когда у item-rule есть единственное содержательное свойство —
 * например, у `Predefined` это коллекция элементов, и `Свойства.yaml` каталога должен
 * содержать сразу карту элементов, а не `{ items: { ... } }`.
 *
 * Возвращает `undefined`, если инлайн-свойств нет. Кидает `Error`, если их больше одного —
 * это инвариант правила, нарушение нужно ловить громко.
 */
export const findInlineProperty = (
  rule: MetadataItemRule
): { key: string; prop: PropertyRule; yamlKey: string } | undefined => {
  const inline = Object.entries(rule.properties).filter(
    ([, p]) => p.yamlInline === true && p.forReferenceOnly !== true
  )
  if (inline.length > 1) {
    throw new Error(
      `Rule "${rule.itemType}": yamlInline=true должно быть установлено максимум для одного свойства, найдено ${inline.length}`
    )
  }
  if (inline.length === 0) return undefined
  const [key, prop] = inline[0]
  return { key, prop, yamlKey: prop.yaml ?? key }
}
