import { findProductionCycleComponents as findComponents } from "./cycle-analysis.mjs"

function areaName(source) {
  const metadata = source.match(/^packages\/core\/metadata\/([^/]+)/u)
  if (metadata !== null) return `packages/core/metadata/${metadata[1]}`
  const packageName = source.match(/^packages\/([^/]+)/u)
  return packageName === null ? source.split("/")[0] : `packages/${packageName[1]}`
}

function groupAreas(modules) {
  const counts = new Map()
  for (const source of modules) {
    const name = areaName(source)
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts]
    .map(([name, moduleCount]) => ({ name, moduleCount }))
    .sort(
      (left, right) =>
        right.moduleCount - left.moduleCount ||
        left.name.localeCompare(right.name)
    )
}

export function findProductionCycleComponents(result) {
  return findComponents(result).map((component) => ({
    ...component,
    areas: groupAreas(component.modules),
  }))
}

function moduleWord(count) {
  const lastTwo = count % 100
  if (lastTwo >= 11 && lastTwo <= 14) return "модулей"
  if (count % 10 === 1) return "модуль"
  if (count % 10 >= 2 && count % 10 <= 4) return "модуля"
  return "модулей"
}

export function formatProductionCycleReport(components) {
  const moduleCount = components.reduce(
    (count, component) => count + component.modules.length,
    0
  )
  const lines = [
    `Циклические компоненты: ${components.length}; модулей в циклах: ${moduleCount}.`,
  ]
  components.forEach((component, index) => {
    lines.push(
      `${index + 1}. ${component.modules.length} ${moduleWord(component.modules.length)}, ` +
        `внутренних зависимостей: ${component.dependencyCount}`,
      `   Области: ${component.areas.map(({ name, moduleCount: count }) => `${name} — ${count}`).join(", ")}`,
      `   Ключевые модули: ${component.keyModules.join("; ")}`
    )
  })
  return lines.join("\n")
}
