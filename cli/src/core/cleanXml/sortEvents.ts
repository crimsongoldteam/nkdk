import type { CleanContext } from "./types.js"

export const sortEvents = (context: CleanContext, parsedData: any): any => {
  if (parsedData == null || typeof parsedData !== "object") {
    return parsedData
  }

  if (Array.isArray(parsedData)) {
    return parsedData.map((item) => sortEvents(context, item))
  }

  const result: Record<string, any> = {}

  // Process all keys
  for (const key of Object.keys(parsedData)) {
    if (key === "Events" && parsedData[key] != null) {
      const events = parsedData[key]

      // If Events contains Event array, sort them by name attribute
      if (events.Event != null) {
        if (Array.isArray(events.Event)) {
          // Sort array of events by @attributes.name
          const sortedEvents = [...events.Event].sort((a, b) => {
            const nameA = a["@attributes"]?.name || ""
            const nameB = b["@attributes"]?.name || ""
            return nameA.localeCompare(nameB, "ru")
          })
          result[key] = {
            ...events,
            Event: sortedEvents,
          }
        } else {
          // Single event, no sorting needed
          result[key] = events
        }
      } else {
        // No Event property, keep as is
        result[key] = sortEvents(context, events)
      }
    } else {
      // Recursively process other keys
      result[key] = sortEvents(context, parsedData[key])
    }
  }

  return result
}
