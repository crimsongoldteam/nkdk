import type { YamlRuleCursor } from "./importYamlTypes"

export function enterNestedYamlRule<T extends YamlRuleCursor>(traversal: T, itemType: string): T {
  const last = traversal.rulePath.at(-1)
  if (last === undefined) return traversal

  return {
    ...traversal,
    rulePath: [...traversal.rulePath.slice(0, -1), { ...last, nestedItemType: itemType }],
  }
}

export function enterYamlProperty<T extends YamlRuleCursor>(params: {
  cursor: T
  propertyKey: string
  yamlKey: string
}): T {
  return {
    ...params.cursor,
    yamlPath: [...params.cursor.yamlPath, params.yamlKey],
    rulePath: [...params.cursor.rulePath, { propertyKey: params.propertyKey }],
  }
}
