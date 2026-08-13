import { controlled, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataConstantRules } from "./rules"

export const metadataConstantPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataConstantRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...externalProperty("valueManagerModule", "МодульМенеджераЗначения", ["extend"]),
    ...externalProperty("managerModule", "МодульМенеджера", ["extend"]),
    ...controlled("type"),
    extendedPresentation: { availability: "borrowed", modes: [], representation: "plain" },
    format: { availability: "borrowed", modes: [], representation: "plain" },
    editFormat: { availability: "borrowed", modes: [], representation: "plain" },
    toolTip: { availability: "borrowed", modes: [], representation: "plain" },
  },
})
