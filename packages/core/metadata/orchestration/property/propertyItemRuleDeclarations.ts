type DeclaredItemRule = object

const declarations = new Map<string, DeclaredItemRule>()

export function declarePropertyItemRule(propertyType: string, itemRule: DeclaredItemRule): void {
  declarations.set(propertyType, itemRule)
  declareNestedPropertyItemRules(itemRule)
}

export function getDeclaredPropertyItemRule<Rule extends object = DeclaredItemRule>(
  propertyType: string
): Rule | undefined {
  return declarations.get(propertyType) as Rule | undefined
}

function declareNestedPropertyItemRules(itemRule: DeclaredItemRule): void {
  const properties = recordValue(recordValue(itemRule).properties)
  for (const property of Object.values(properties)) {
    const propertyRecord = recordValue(property)
    const propertyType = propertyRecord.type
    const nestedItemRule = recordValueOrUndefined(propertyRecord.itemRule)
    if (typeof propertyType !== "string" || nestedItemRule === undefined) continue
    declarations.set(propertyType, nestedItemRule)
    declareNestedPropertyItemRules(nestedItemRule)
  }
}

function recordValue(value: unknown): Readonly<Record<string, unknown>> {
  return recordValueOrUndefined(value) ?? {}
}

function recordValueOrUndefined(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === "object" && value !== null ? (value as Readonly<Record<string, unknown>>) : undefined
}
