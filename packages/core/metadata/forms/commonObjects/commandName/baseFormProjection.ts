import { registerBaseFormPropertyProjector } from "../../clientApplicationForm/baseFormProjectionRegistry"

registerBaseFormPropertyProjector("CommandName", {
  project: ({ baseValue, context }) => {
    if (baseValue === "0") return { kind: "include", value: baseValue }
    return typeof baseValue === "string" && context.commandNames.has(baseValue)
      ? { kind: "include", value: baseValue }
      : { kind: "include", value: "0" }
  },
})
