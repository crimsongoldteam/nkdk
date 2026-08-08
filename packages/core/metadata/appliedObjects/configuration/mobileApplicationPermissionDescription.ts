import { importI8nTextFromXML } from "../../commonObjects/i8nText/fromXML"
import { importI8nTextFromYAML } from "../../commonObjects/i8nText/fromYAML"
import { exportI8nTextToXML } from "../../commonObjects/i8nText/toXML"
import { exportI8nTextToYAML } from "../../commonObjects/i8nText/toYAML"
import {
  i8nTextRule,
  type I8nText,
  type I8nTextXML,
  type I8nTextYAML,
} from "../../commonObjects/i8nText/types"
import type { ConfigurationContext } from "../../context/types"

const descriptionRule = i8nTextRule({ preserveEmptyXML: true })

export const importMobileApplicationPermissionDescriptionFromXML = (
  context: ConfigurationContext,
  value: I8nTextXML | ""
): I8nText => importI8nTextFromXML(context, descriptionRule, value) ?? { items: {} }

export const exportMobileApplicationPermissionDescriptionToXML = (
  context: ConfigurationContext,
  value: I8nText
): I8nTextXML => exportI8nTextToXML(context, descriptionRule, value) ?? {}

export const importMobileApplicationPermissionDescriptionFromYAML = (
  context: ConfigurationContext,
  value: I8nTextYAML
): I8nText => importI8nTextFromYAML({ context, rule: descriptionRule, value }) ?? { items: {} }

export const exportMobileApplicationPermissionDescriptionToYAML = (
  context: ConfigurationContext,
  value: I8nText
): I8nTextYAML => exportI8nTextToYAML({ context, rule: descriptionRule, value }) ?? ""
