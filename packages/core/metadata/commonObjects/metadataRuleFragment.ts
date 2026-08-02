import type { MetadataItemRule, PropertyRule } from "../orchestration/property/types"

type MetadataItemRuleBase = Omit<MetadataItemRule, "properties" | "xmlOrder">

export interface MetadataRuleFragment<
  Properties extends Readonly<Record<string, PropertyRule>> = Readonly<Record<string, PropertyRule>>,
> {
  readonly xmlOrder: readonly (keyof Properties & string)[]
  readonly properties: Properties
}

interface MetadataRuleFragmentShape {
  readonly xmlOrder: readonly string[]
  readonly properties: Readonly<Record<string, PropertyRule>>
}

type FragmentProperties<Fragment extends MetadataRuleFragmentShape> = Fragment["properties"]

type UnionToIntersection<Union> = (
  Union extends unknown ? (value: Union) => void : never
) extends (value: infer Intersection) => void
  ? Intersection
  : never

type ComposedProperties<Fragments extends readonly MetadataRuleFragmentShape[]> = UnionToIntersection<
  FragmentProperties<Fragments[number]>
>

export type ComposedMetadataItemRule<
  Base extends MetadataItemRuleBase,
  Fragments extends readonly MetadataRuleFragmentShape[],
> = Base & {
  readonly xmlOrder: readonly (keyof ComposedProperties<Fragments> & string)[]
  readonly properties: ComposedProperties<Fragments>
}

function assertExactFragmentKeys(
  xmlOrder: readonly string[],
  properties: Readonly<Record<string, PropertyRule>>
): void {
  const orderedKeys = new Set<string>()
  for (const key of xmlOrder) {
    if (orderedKeys.has(key)) throw new Error(`Повтор ключа фрагмента: ${key}`)
    if (!Object.hasOwn(properties, key)) {
      throw new Error(`Ключ ${key} есть в xmlOrder, но отсутствует в properties`)
    }
    orderedKeys.add(key)
  }

  for (const key of Object.keys(properties)) {
    if (!orderedKeys.has(key)) {
      throw new Error(`Свойство ${key} отсутствует в xmlOrder`)
    }
  }
}

export function metadataRuleFragment<
  const Properties extends Readonly<Record<string, PropertyRule>>,
  const Order extends readonly (keyof Properties & string)[],
>(xmlOrder: Order, properties: Properties): MetadataRuleFragment<Properties> {
  assertExactFragmentKeys(xmlOrder, properties)
  return Object.freeze({
    xmlOrder: Object.freeze([...xmlOrder]),
    properties: Object.freeze({ ...properties }),
  })
}

function asComposedMetadataRule<
  Base extends MetadataItemRuleBase,
  Fragments extends readonly MetadataRuleFragmentShape[],
>(rule: MetadataItemRule): ComposedMetadataItemRule<Base, Fragments> {
  return rule as ComposedMetadataItemRule<Base, Fragments>
}

export function composeMetadataItemRule<
  const Base extends MetadataItemRuleBase,
  const Fragments extends readonly [MetadataRuleFragmentShape, ...MetadataRuleFragmentShape[]],
>(base: Base, ...fragments: Fragments): ComposedMetadataItemRule<Base, Fragments> {
  const xmlOrder: string[] = []
  const properties: Record<string, PropertyRule> = {}

  for (const fragment of fragments) {
    for (const key of fragment.xmlOrder) {
      if (Object.hasOwn(properties, key)) {
        throw new Error(`Повтор свойства ${key} при композиции ${base.itemType}`)
      }
      xmlOrder.push(key)
      properties[key] = fragment.properties[key]
    }
  }

  const rule: MetadataItemRule = Object.freeze({
    ...base,
    xmlOrder: Object.freeze(xmlOrder),
    properties: Object.freeze(properties),
  })
  return asComposedMetadataRule<Base, Fragments>(rule)
}
