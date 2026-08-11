import {
  type BaseFormReferenceProjector,
} from "../../clientApplicationForm/baseFormProjectionRegistry"
import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"

const commandNameReferenceProjector = {
  project: ({ baseValue, extensionValue, context }) => {
    if (baseValue === "0" || extensionValue === "0") {
      return { kind: "include", value: "0" }
    }
    if (typeof baseValue !== "string") {
      return { kind: "include", value: baseValue }
    }
    const localName = localFormCommandName(baseValue)
    return localName === undefined || context.commandNames.has(localName)
      ? { kind: "include", value: baseValue }
      : { kind: "omit" }
  },
} satisfies BaseFormReferenceProjector

const commandNamePropertyProjector: BaseFormReferenceProjector = {
  project: (params) => {
    const result = commandNameReferenceProjector.project(params)
    return result.kind === "include"
      ? result
      : { kind: "include", value: "0" }
  },
}

export const commandNameBaseFormProjectionRules = defineMetadataRules({
  ...emptyMetadataRules,
  operations: [
    { kind: "baseFormReferenceProjector", propertyType: "CommandName", projector: commandNameReferenceProjector },
    { kind: "baseFormPropertyProjector", propertyType: "CommandName", projector: commandNamePropertyProjector },
  ],
})

function localFormCommandName(value: string): string | undefined {
  const prefix = "Form.Command."
  if (value.startsWith(prefix)) return value.slice(prefix.length)
  return value.includes(".") ? undefined : value
}
