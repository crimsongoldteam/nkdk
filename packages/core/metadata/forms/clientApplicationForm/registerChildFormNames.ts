import { syncChildFormNamesFromXML } from "../../commonObjects/childFormNames/syncExternalFromXML"
import { registerTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"

let registered = false

export function registerChildFormNamesAdapter(): void {
  if (registered) return
  registered = true
  registerTypeRule("ChildFormNames", "syncExternalFromXML", syncChildFormNamesFromXML)
}
