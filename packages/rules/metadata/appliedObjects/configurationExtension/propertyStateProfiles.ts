import {
  controlled,
  definePropertyStateProfile,
  extended,
  multiState,
} from "./propertyStateCapabilities"

export const configurationExtensionPropertyStateProfiles = [
  definePropertyStateProfile("borrowed-base", {
    name: { availability: "own", modes: [] },
    comment: { availability: "own", modes: [] },
    ...controlled("extendedConfigurationObject"),
  }),
  definePropertyStateProfile("mutable-synonym", extended("synonym")),
  definePropertyStateProfile("typed-field", {
    ...extended("synonym"),
    ...multiState("type"),
    ...extended("format", "editFormat", "toolTip", "choiceForm"),
  }),
  definePropertyStateProfile("tabular-section", extended("synonym", "toolTip")),
  definePropertyStateProfile("command", {
    ...extended("synonym", "toolTip", "picture"),
  }),
  definePropertyStateProfile("register-field", {
    ...extended("synonym", "format", "editFormat", "toolTip", "choiceForm"),
    ...multiState("type"),
  }),
] as const
