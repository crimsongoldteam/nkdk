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

export const eventBindingKey = (eventKey: string, callType?: EventCallTypeXML): string =>
  JSON.stringify([eventKey, callType ?? null])

export function parseEventBindingKey(key: string): { eventKey: string; callType?: EventCallTypeXML } {
  const value: unknown = JSON.parse(key)
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error("Недопустимый ключ привязки события")
  }

  const [eventKey, callType] = value
  if (typeof eventKey !== "string" || eventKey.length === 0) {
    throw new Error("Недопустимое имя события")
  }
  if (callType === null) return { eventKey }
  if (callType === "Before" || callType === "After" || callType === "Override") {
    return { eventKey, callType }
  }
  throw new Error("Недопустимый режим вызова события")
}
