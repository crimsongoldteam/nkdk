import { findProductionCycleComponents } from "./cycle-analysis.mjs"

export function createCycleBaseline(result) {
  return {
    version: 1,
    components: findProductionCycleComponents(result).map(
      ({ modules, dependencyCount }) => ({ modules, dependencyCount })
    ),
  }
}

export function serializeCycleBaseline(result) {
  return `${JSON.stringify(createCycleBaseline(result), null, 2)}\n`
}

export function assertCyclesNotWorse(result, baseline) {
  const current = createCycleBaseline(result).components
  if (current.length > baseline.components.length) {
    throw new Error(
      `Циклических компонент стало больше: ${current.length} > ${baseline.components.length}`
    )
  }
  for (const component of current) {
    const known = baseline.components.find(({ modules }) =>
      component.modules.every((source) => modules.includes(source))
    )
    if (known === undefined) {
      const knownModules = new Set(
        baseline.components.flatMap(({ modules }) => modules)
      )
      const added = component.modules.filter(
        (source) => !knownModules.has(source)
      )
      throw new Error(
        `Циклическая компонента содержит новый модуль: ${added.join(", ")}`
      )
    }
    if (component.dependencyCount > known.dependencyCount) {
      throw new Error(
        `Число внутренних зависимостей выросло: ${component.dependencyCount} > ${known.dependencyCount}`
      )
    }
  }
}

function metrics(components) {
  return components
    .map(({ modules, dependencyCount }) => ({
      moduleCount: modules.length,
      dependencyCount,
    }))
    .sort(
      (left, right) =>
        right.moduleCount - left.moduleCount ||
        right.dependencyCount - left.dependencyCount
    )
}

export function assertCycleRewriteNotWorse(result, baseline) {
  const current = metrics(createCycleBaseline(result).components)
  const known = metrics(baseline.components)
  const sum = (items, key) =>
    items.reduce((total, item) => total + item[key], 0)
  if (current.length > known.length) {
    throw new Error(
      `Циклических компонент стало больше: ${current.length} > ${known.length}`
    )
  }
  if (sum(current, "moduleCount") > sum(known, "moduleCount")) {
    throw new Error(
      `Модулей в циклах стало больше: ${sum(current, "moduleCount")} > ${sum(known, "moduleCount")}`
    )
  }
  if (sum(current, "dependencyCount") > sum(known, "dependencyCount")) {
    throw new Error(
      `Внутренних зависимостей стало больше: ${sum(current, "dependencyCount")} > ${sum(known, "dependencyCount")}`
    )
  }
  current.forEach((item, index) => {
    if (
      item.moduleCount > known[index].moduleCount ||
      item.dependencyCount > known[index].dependencyCount
    ) {
      throw new Error(`Ухудшилась циклическая компонента ${index + 1}`)
    }
  })
}
