import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { exportI8nTextDefaultToYAML, exportI8nTextToYAML } from "../i8nText/toYAML"
import { FormattedI8nText, FormattedI8nTextPropertyRule, FormattedI8nTextValueYAML } from "./types"

export const exportFormattedI8nTextToYAML = <R extends FormattedI8nTextPropertyRule>(params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: FormattedI8nText | undefined
  name?: string
}): { [K in NonNullable<R["yaml"]>]?: FormattedI8nTextValueYAML } => {
  const { context, rule, value: text } = params
  if (!text) return {}

  const formattedRule = rule as FormattedI8nTextPropertyRule

  return exportToYAML(context, formattedRule, text) as { [K in NonNullable<R["yaml"]>]?: FormattedI8nTextValueYAML }
}

const exportToYAML = <R extends FormattedI8nTextPropertyRule>(
  context: ConfigurationContext,
  rule: R,
  text: FormattedI8nText | undefined
): { [K in NonNullable<R["yaml"]>]?: FormattedI8nTextValueYAML } => {
  if (!text) return {}

  if (!rule.yaml) throw Error(`Rule must have yaml property`)

  const exported = exportI8nTextToYAML({ context, rule, value: text })
  if (exported === undefined) return {}

  return {
    [rule.yaml]: {
      ...(text.formatted ? { Форматированный: "Истина" as const } : {}),
      Текст: exported,
    },
  } as { [K in NonNullable<R["yaml"]>]?: FormattedI8nTextValueYAML }
}

export const exportFormattedI8nTextDefaultToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  title: FormattedI8nText | undefined
): string | undefined => {
  return exportI8nTextDefaultToYAML(context, title)
}

// Temporary mismatch: export already writes value-based YAML, but PropertyToYAML
// remains legacy until typed YAML import/forms are migrated in later tasks.
registerTypeRule("FormattedI8nText", "exportToYAML", exportFormattedI8nTextToYAML as any)
