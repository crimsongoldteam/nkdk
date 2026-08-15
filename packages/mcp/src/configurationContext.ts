import type { ConfigurationLanguages } from "@nkdk/runtime"

export const defaultMcpConfigurationLanguages: ConfigurationLanguages = Object.freeze({
  default: "ru",
  registered: Object.freeze(["ru"]),
  registeredSet: Object.freeze(new Set(["ru"])),
  version: '["ru",["ru"]]',
})
