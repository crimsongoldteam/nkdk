import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/fromXML"
import { I8nText, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"

type UserSettingPresentationXML = { "_xsi:type"?: string; "v8:item"?: unknown } | string | undefined

export const importUserSettingPresentationFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: UserSettingPresentationXML
): I8nText | boolean | undefined => {
  if (xml === undefined) return undefined

  if (context.fromXML.forReference) {
    if (typeof xml === "string") return true
    if (typeof xml === "object" && xml["_xsi:type"] === "xs:string") return true
    return false
  }

  if (typeof xml === "string") {
    return { items: { [context.defaultLanguage]: xml } }
  }
  if (typeof xml === "object" && xml["_xsi:type"] === "xs:string") {
    const text = (xml as { "#text"?: unknown })["#text"]
    return { items: { [context.defaultLanguage]: text !== undefined ? String(text) : "" } }
  }
  return importI8nTextFromXML(context, { type: "I8nText" } as any, xml as I8nTextXML)
}

registerTypeRule("UserSettingPresentation", "importFromXML", importUserSettingPresentationFromXML as any)
