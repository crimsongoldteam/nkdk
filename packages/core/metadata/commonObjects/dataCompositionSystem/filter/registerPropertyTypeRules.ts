import type { ConfigurationContext } from "~/metadata/context/types"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import type { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { Filter } from "./types"
import { importFilterFromDcsXML } from "./fromDcsXML"
import { importFilterFromYAML } from "./fromYAML"
import { exportFilterToDcsXML } from "./toDcsXML"
import { exportFilterToYAML } from "./toYAML"

registerTypeRule("Filter", "importFromXML", (context: ConfigurationContextFromXML, _rule: PropertyRule | undefined, xml: unknown) =>
  importFilterFromDcsXML(context, xml as Parameters<typeof importFilterFromDcsXML>[1])
)

registerTypeRule(
  "Filter",
  "exportToXML",
  (
    context: ConfigurationContextWithExportToXML,
    _rule: PropertyRule | undefined,
    value: unknown,
    _reference?: unknown
  ) => exportFilterToDcsXML(context, value as Filter | undefined)
)

registerTypeRule("Filter", "importFromYAML", (context: ConfigurationContext, _rule: PropertyRule | undefined, yaml: unknown) =>
  importFilterFromYAML(context, yaml as Parameters<typeof importFilterFromYAML>[1])
)

registerTypeRule("Filter", "exportToYAML", (context: ConfigurationContext, _rule: PropertyRule | undefined, data: unknown) =>
  exportFilterToYAML(context, data as Filter | undefined)
)
