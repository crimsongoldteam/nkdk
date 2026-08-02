import { testModulePattern } from "./common-rules.mjs"
import {
  implementationTargetPatterns,
  metadataForbiddenRules,
  neutralProductionPattern,
} from "./metadata-rules.mjs"

const neutralProduction = new RegExp(neutralProductionPattern, "u")
const testModule = new RegExp(testModulePattern, "u")
const implementationTargets = implementationTargetPatterns.map(
  (pattern) => new RegExp(pattern, "u")
)

function isImplementation(source) {
  return implementationTargets.some((pattern) => pattern.test(source))
}

function indexPathsToImplementations(result) {
  const reverseDependencies = new Map()
  const nextHop = new Map()
  const finalTarget = new Map()
  const queue = []

  for (const module of result.modules) {
    if (isImplementation(module.source)) {
      finalTarget.set(module.source, module.source)
      queue.push(module.source)
    }
    for (const dependency of module.dependencies) {
      const incoming = reverseDependencies.get(dependency.resolved) ?? []
      incoming.push({ source: module.source, dependency })
      reverseDependencies.set(dependency.resolved, incoming)
    }
  }

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]
    for (const { source, dependency } of
      reverseDependencies.get(current) ?? []) {
      if (finalTarget.has(source)) continue
      finalTarget.set(source, finalTarget.get(current))
      nextHop.set(source, {
        name: current,
        dependencyTypes: dependency.dependencyTypes,
      })
      queue.push(source)
    }
  }

  return { finalTarget, nextHop }
}

function restorePath(source, nextHop) {
  const via = []
  let current = source
  while (nextHop.has(current)) {
    const hop = nextHop.get(current)
    via.push(hop)
    current = hop.name
  }
  return via
}

export function findImplementationReachabilityViolations(result) {
  const { finalTarget, nextHop } = indexPathsToImplementations(result)

  return result.modules
    .filter(
      ({ source }) =>
        neutralProduction.test(source) && !testModule.test(source)
    )
    .flatMap(({ source }) => {
      const target = finalTarget.get(source)
      if (!target || target === source) return []

      return [
        {
          type: "reachability",
          from: source,
          to: target,
          rule: {
            severity: "error",
            name: "neutral-not-reach-implementations",
          },
          via: restorePath(source, nextHop),
        },
      ]
    })
    .sort((left, right) =>
      left.from.localeCompare(right.from) || left.to.localeCompare(right.to)
    )
}

function isKnownReachabilityViolation(violation, knownViolations) {
  return knownViolations.some(
    (known) =>
      known.type === "reachability" &&
      known.from === violation.from &&
      known.rule?.name === violation.rule.name
  )
}

export function addImplementationReachabilityViolations(
  result,
  knownViolations = []
) {
  const reachableViolations = findImplementationReachabilityViolations(
    result
  ).map((violation) => ({
    ...violation,
    rule: {
      ...violation.rule,
      severity: isKnownReachabilityViolation(violation, knownViolations)
        ? "ignore"
        : violation.rule.severity,
    },
  }))
  const violations = [...result.summary.violations, ...reachableViolations]
  const count = (severity) =>
    violations.filter(({ rule }) => rule.severity === severity).length
  const forbidden = result.summary.ruleSetUsed?.forbidden ?? []
  const hasReachabilityRule = forbidden.some(
    ({ name }) => name === "neutral-not-reach-implementations"
  )

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
        forbidden: hasReachabilityRule
          ? forbidden
          : [...forbidden, ...metadataForbiddenRules],
      },
    },
  }
}
