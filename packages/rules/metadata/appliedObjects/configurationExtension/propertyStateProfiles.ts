import {
  controlled,
  definePropertyStateProfile,
  extended,
  multiState,
} from "./propertyStateCapabilities"

export const configurationExtensionPropertyStateProfiles = [
  definePropertyStateProfile("borrowed-base", {
    ...controlled("extendedConfigurationObject"),
  }),
  definePropertyStateProfile("mutable-synonym", extended("synonym")),
  definePropertyStateProfile("typed-field", {
    ...multiState("type"),
    ...extended("format", "editFormat", "toolTip", "choiceForm"),
  }),
  definePropertyStateProfile("tabular-section", extended("toolTip")),
  definePropertyStateProfile("command", {
    ...extended("synonym", "commandModule", "toolTip", "picture"),
  }),
  definePropertyStateProfile("register-field", {
    ...extended("synonym", "format", "editFormat", "toolTip", "choiceForm"),
    ...multiState("type"),
  }),
] as const
