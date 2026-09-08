import type { MetadataItemRule } from "../property/types"

const treeRules = new WeakMap<MetadataItemRule, MetadataItemRule>()

/** В дереве Вид — дискриминатор элемента, а не собственный Type кнопки. */
export function formElementTreeRule<Rule extends MetadataItemRule>(rule: Rule): Rule {
  if (rule.itemType !== "Button" && rule.itemType !== "CommandBarButton") return rule
  if (rule.properties.type?.yaml !== "Вид") return rule
  let tree = treeRules.get(rule)
  if (tree === undefined) {
    tree = { ...rule, properties: { ...rule.properties, type: { ...rule.properties.type, yaml: "ТипКнопки" } } }
    treeRules.set(rule, tree)
  }
  // Меняется только YAML-имя уже существующего свойства; предметные поля Rule сохранены.
  return tree as Rule
}
