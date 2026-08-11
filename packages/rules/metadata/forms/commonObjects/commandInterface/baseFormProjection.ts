import {
  createStructuredBaseFormPropertyProjector,
} from "../../clientApplicationForm/baseFormProjectionRegistry"
import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"

const commandInterfaceItem = {
  kind: "object",
  requiredProperties: ["Команда"],
  properties: {
    Команда: {
      kind: "reference",
      type: "CommandName",
    },
    Реквизит: {
      kind: "reference",
      type: "DataPath",
    },
  },
} as const

export const commandInterfaceBaseFormProjectionRules = defineMetadataRules({
  ...emptyMetadataRules,
  operations: [{
    kind: "baseFormPropertyProjector",
    propertyType: "CommandInterface",
    projector: createStructuredBaseFormPropertyProjector({
    kind: "object",
    omitIfEmpty: true,
    properties: {
      ПанельНавигации: {
        kind: "array",
        item: commandInterfaceItem,
        omitIfEmpty: true,
      },
      КоманднаяПанель: {
        kind: "array",
        item: commandInterfaceItem,
        omitIfEmpty: true,
      },
    },
    }),
  }],
})
