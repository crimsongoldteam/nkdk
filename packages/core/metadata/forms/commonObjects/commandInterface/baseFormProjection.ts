import {
  createStructuredBaseFormPropertyProjector,
  registerBaseFormPropertyProjector,
} from "../../clientApplicationForm/baseFormProjectionRegistry"

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

registerBaseFormPropertyProjector(
  "CommandInterface",
  createStructuredBaseFormPropertyProjector({
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
  })
)
