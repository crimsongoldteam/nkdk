import { PropertyRule } from "../metadata/forms/elements/calendarField/rules"
import {
  createConfigurationLanguages,
  type ConfigurationContext,
  type ConfigurationContextFromXML,
  type ConfigurationContextWithExportToXML,
  type XmlImportConfigurationContext,
} from "@nkdk/runtime"
import { resolveDataPathCore } from "../metadata/validation/dataPath/coreResolver"

export const mockLanguages = createConfigurationLanguages({ default: "ru", registered: ["ru", "en"] })

export const mockContext: ConfigurationContext = {
  version: "2.20",
  languages: mockLanguages,
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
    importFromYAML: {
      resolveDataPath: ({ value, index, ownerCache }) =>
        resolveDataPathCore({ value, nameMode: "yaml", index, ownerCache }),
    },
    exportToXML: {
      itemsTree: [],
      version: "2.20",
      context: {
        forms: [],
        templates: [],
        parentName: "",
      },
    },
  }
}

export const mockContextFromXML = (): ConfigurationContextFromXML => {
  return {
    ...mockContext,
    fromXML: {},
  }
}

export const mockXmlImportContext = (): XmlImportConfigurationContext => {
  const context = mockContextFromXML()
  return {
    ...context,
    fromXML: { ...context.fromXML, componentKind: "configuration" },
  }
}

export const mockRule: PropertyRule = {
  yaml: "Шапка",
  type: "string",
}
