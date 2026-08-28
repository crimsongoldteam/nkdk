import { booleanRule } from "../commonObjects/boolean/types"

export const uniqueAutonumberingRules = (xmlParents: readonly string[]) => ({
  checkUnique: booleanRule({
    yaml: "КонтрольУникальности",
    defaultValueXML: true,
    implicitValueYAML: true,
    xmlParents: [...xmlParents],
  }),
  autonumbering: booleanRule({
    yaml: "Автонумерация",
    defaultValueXML: true,
    implicitValueYAML: true,
    xmlParents: [...xmlParents],
  }),
})
