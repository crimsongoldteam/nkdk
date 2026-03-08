import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext, ConfigurationContextWithExportToXML } from "../metadata/context/types"

export const mockContext: ConfigurationContext = {
  version: "2.20",
  defaultLanguage: "ru",
  testMode: true,
  exportToYAML: { toTyped: false },
}

export const mockContextToYAML: ConfigurationContext = {
  ...mockContext,
  exportToYAML: { toTyped: false },
}

export const mockContextToTypedYAML: ConfigurationContext = {
  ...mockContext,
  exportToYAML: { toTyped: true },
}

export const mockContextToEnterprise: ConfigurationContext = {
  ...mockContext,
  enterprise: {
    prefix: "prefix_",
    attributes: {},
    elementsTree: [],
    allElementsNames: [],
  },
}

export const mockContextToXML = (): ConfigurationContextWithExportToXML => {
  return {
    ...mockContext,
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: "2.20",
    },
  }
}

export const mockRule: PropertyRule = {
  yaml: "Шапка",
  type: "string",
}
