import type { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/fromXML"
import type { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import type { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { PropertyRule } from "~/metadata/orchestration/property/types"

const exportDcsLocalStringTypeToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: unknown
) => {
  const i8n = exportI8nTextToXML(context, { type: "I8nText" } as any, value as any)
  if (!i8n) return undefined
  return { "_xsi:type": "v8:LocalStringType", ...i8n }
}

const importDcsLocalStringTypeFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
) => {
  if (!xml || typeof xml !== "object") return undefined
  return importI8nTextFromXML(context, { type: "I8nText" } as any, xml as I8nTextXML)
}

const exportDcsLocalStringTypeToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: unknown
) => exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: value as any })

const importDcsLocalStringTypeFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: unknown
) =>
  importI8nTextFromYAML({
    context,
    rule: { type: "I8nText" },
    value: value as I8nTextYAML,
  })

registerTypeRule("DcsLocalStringType", "exportToXML", exportDcsLocalStringTypeToXML as any)
registerTypeRule("DcsLocalStringType", "importFromXML", importDcsLocalStringTypeFromXML as any)
registerTypeRule("DcsLocalStringType", "exportToYAML", exportDcsLocalStringTypeToYAML as any)
registerTypeRule("DcsLocalStringType", "importFromYAML", importDcsLocalStringTypeFromYAML as any)

