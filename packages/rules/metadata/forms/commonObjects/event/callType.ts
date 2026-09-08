import type { EventCallTypeXML, EventCallTypeYAML } from "./types"

const yamlByXML = {
  Before: "Перед",
  After: "После",
  Override: "Вместо",
} as const satisfies Record<EventCallTypeXML, EventCallTypeYAML>

export function eventCallTypeToYAML(value: EventCallTypeXML): EventCallTypeYAML {
  return yamlByXML[value]
}

export function eventCallTypeFromYAML(value: EventCallTypeYAML): EventCallTypeXML {
  switch (value) {
    case "Перед":
      return "Before"
    case "После":
      return "After"
    case "Вместо":
      return "Override"
  }
}
