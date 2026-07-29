import type { AnalyzeRuleOrderResult } from "../../metadata/ruleOrderAnalysis/analyze"

export function renderRuleOrderConflictsJson(result: AnalyzeRuleOrderResult): string {
  return `${JSON.stringify(result, null, 2)}\n`
}

export function renderRuleOrderReportMarkdown(result: AnalyzeRuleOrderResult): string {
  const conflictCount = result.rules.reduce((sum, rule) => sum + rule.conflicts.length, 0)
  const cycleCount = result.rules.reduce((sum, rule) => sum + rule.cycles.length, 0)
  const lines = [
    "# Анализ порядка свойств rules.ts",
    "",
    "## Итог",
    "",
    `- Конфигурации: ${result.configurations.length}`,
    `- XML-файлы: ${result.xmlFileCount}`,
    `- Задания: ${result.assignmentCount}`,
    `- Наблюдения: ${result.observationCount}`,
    `- Пропущенные наблюдения вне rules.ts: ${result.skippedObservationCount}`,
    `- Правила: ${result.rules.length}`,
    `- Правила без наблюдений: ${result.unobservedSources.length}`,
    `- Конфликты пар: ${conflictCount}`,
    `- Циклы: ${cycleCount}`,
    `- Неоднозначные правила: ${result.ambiguities.length}`,
    "",
  ]
  if (result.unobservedSources.length > 0) {
    lines.push("## Правила без наблюдений", "")
    for (const source of result.unobservedSources) lines.push(`- \`${source.candidate}\``)
    lines.push("")
  }
  if (conflictCount === 0) {
    lines.push("Конфликты порядка не найдены.", "")
    return lines.join("\n")
  }
  for (const rule of result.rules.filter((item) => item.conflicts.length > 0)) {
    lines.push(`## ${rule.ruleCandidates.join(", ")}`, "")
    for (const conflict of rule.conflicts) {
      const left = conflict.leftBeforeRight
      const right = conflict.rightBeforeLeft
      lines.push(
        `- \`${left.before} → ${left.after}\`: ${left.count}; \`${right.before} → ${right.after}\`: ${right.count}`
      )
      for (const witness of [...left.witnesses, ...right.witnesses]) {
        lines.push(`  - ${witness.configuration}: ${witness.sourceXmlPath} (${witness.xmlNodeLogicalAddress})`)
      }
    }
    lines.push("")
  }
  return lines.join("\n")
}
