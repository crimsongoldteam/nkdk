import {
  commonRules,
  productionSourcePattern,
  testModulePattern,
} from "./common-rules.mjs"

const productionSource = new RegExp(productionSourcePattern, "u")
const testModule = new RegExp(testModulePattern, "u")
const cycleRule = commonRules.find(
  ({ name }) => name === "no-circular-production"
)

function stronglyConnectedComponents(modulesBySource) {
  const indexes = new Map()
  const lowLinks = new Map()
  const stack = []
  const onStack = new Set()
  const componentBySource = new Map()
  const componentSizes = new Map()
  let nextIndex = 0
  let nextComponent = 0

  function visit(source) {
    indexes.set(source, nextIndex)
    lowLinks.set(source, nextIndex)
    nextIndex += 1
    stack.push(source)
    onStack.add(source)

    for (const { resolved } of modulesBySource.get(source).dependencies) {
      if (!modulesBySource.has(resolved)) continue
      if (!indexes.has(resolved)) {
        visit(resolved)
        lowLinks.set(
          source,
          Math.min(lowLinks.get(source), lowLinks.get(resolved))
        )
      } else if (onStack.has(resolved)) {
        lowLinks.set(
          source,
          Math.min(lowLinks.get(source), indexes.get(resolved))
        )
      }
    }

    if (lowLinks.get(source) !== indexes.get(source)) return
    const members = []
    let member
    do {
      member = stack.pop()
      onStack.delete(member)
      members.push(member)
      componentBySource.set(member, nextComponent)
    } while (member !== source)
    componentSizes.set(nextComponent, members.length)
    nextComponent += 1
  }

  for (const source of modulesBySource.keys()) {
    if (!indexes.has(source)) visit(source)
  }

  return { componentBySource, componentSizes }
}

export function findProductionCycleViolations(result) {
  const modulesBySource = new Map(
    result.modules.map((module) => [module.source, module])
  )
  const { componentBySource, componentSizes } =
    stronglyConnectedComponents(modulesBySource)

  return result.modules
    .filter(
      ({ source }) => productionSource.test(source) && !testModule.test(source)
    )
    .flatMap(({ source, dependencies }) =>
      dependencies.flatMap(({ resolved }) => {
        if (testModule.test(resolved)) return []
        const component = componentBySource.get(source)
        const sameComponent = component === componentBySource.get(resolved)
        const isCycle =
          sameComponent &&
          (componentSizes.get(component) > 1 || source === resolved)
        if (!isCycle) return []

        return [
          {
            type: "dependency",
            from: source,
            to: resolved,
            rule: { severity: "error", name: cycleRule.name },
          },
        ]
      })
    )
    .sort((left, right) =>
      left.from.localeCompare(right.from) || left.to.localeCompare(right.to)
    )
}

export function addProductionCycleViolations(result, knownViolations = []) {
  const cycleViolations = findProductionCycleViolations(result).map(
    (violation) => ({
      ...violation,
      rule: {
        ...violation.rule,
        severity: knownViolations.some(
          (known) =>
            known.from === violation.from &&
            known.to === violation.to &&
            known.rule?.name === violation.rule.name
        )
          ? "ignore"
          : violation.rule.severity,
      },
    })
  )
  const violations = [...result.summary.violations, ...cycleViolations]
  const count = (severity) =>
    violations.filter(({ rule }) => rule.severity === severity).length
  const forbidden = result.summary.ruleSetUsed?.forbidden ?? []

  return {
    ...result,
    summary: {
      ...result.summary,
      violations,
      error: count("error"),
      warn: count("warn"),
      info: count("info"),
      ignore: count("ignore"),
      ruleSetUsed: {
        ...result.summary.ruleSetUsed,
        forbidden: [...forbidden, cycleRule],
      },
    },
  }
}
