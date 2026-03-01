import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { Table } from "~/metadata/forms/elements/table/types"
import { ConfigurationContext } from "../metadata/context/types"

export const mockContext: ConfigurationContext = {
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
  },
}

export const mockRule: PropertyRule<Table> = {
  yaml: "Шапка",
  type: "string",
}
