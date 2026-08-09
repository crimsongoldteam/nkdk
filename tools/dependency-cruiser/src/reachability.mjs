import { testModulePattern } from "./common-rules.mjs"
import { toDependencyCruiserRule } from "./reachability-rules.mjs"

const testModule = new RegExp(testModulePattern, "u")

function compilePatterns(patterns = []) {
  return patterns.map((pattern) => new RegExp(pattern, "u"))
}

function matches(source, patterns, notPatterns) {
  return (
    patterns.some((pattern) => pattern.test(source)) &&
    !notPatterns.some((pattern) => pattern.test(source))
  )
}

function compileRule(rule) {
  return {
    ...rule,
    fromPatterns: compilePatterns(rule.fromPatterns),
    fromNotPatterns: compilePatterns(rule.fromNotPatterns),
    toPatterns: compilePatterns(rule.toPatterns),
    toNotPatterns: compilePatterns(rule.toNotPatterns),
  }
}

function indexPathsToTargets(result, rule) {
  const reverseDependencies = new Map()
  const nextHop = new Map()
  const finalTarget = new Map()
  const queue = []

  for (const module of result.modules) {
    if (testModule.test(module.source)) continue
    if (
      matches(module.source, rule.toPatterns, rule.toNotPatterns)
    ) {
      finalTarget.set(module.source, module.source)
      queue.push(module.source)
    }
    for (const dependency of module.dependencies) {
      if (testModule.test(dependency.resolved)) continue
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

export function findReachabilityViolations(result, rules) {
  return rules
    .flatMap((sourceRule) => {
      const rule = compileRule(sourceRule)
      const { finalTarget, nextHop } = indexPathsToTargets(result, rule)

      return result.modules
        .filter(
          ({ source }) =>
            !testModule.test(source) &&
            matches(source, rule.fromPatterns, rule.fromNotPatterns)
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
                severity: sourceRule.severity,
                name: sourceRule.name,
                comment: sourceRule.comment,
              },
              via: restorePath(source, nextHop),
            },
          ]
        })
    })
    .sort(
      (left, right) =>
        left.from.localeCompare(right.from) ||
        left.to.localeCompare(right.to) ||
        left.rule.name.localeCompare(right.rule.name)
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

export function addReachabilityViolations(
  result,
  rules,
  knownViolations = []
) {
  const reachableViolations = findReachabilityViolations(
    result,
    rules
  ).map((violation) => ({
    ...violation,
    rule: {
      ...violation.rule,
      severity: isKnownReachabilityViolation(
        violation,
        knownViolations
      )
        ? "ignore"
        : violation.rule.severity,
    },
  }))
  const violations = [...result.summary.violations, ...reachableViolations]
  const count = (severity) =>
    violations.filter(({ rule }) => rule.severity === severity).length
  const forbidden = result.summary.ruleSetUsed?.forbidden ?? []
  const existingRuleNames = new Set(forbidden.map(({ name }) => name))
  const missingRules = rules
    .filter(({ name }) => !existingRuleNames.has(name))
    .map(toDependencyCruiserRule)

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
        forbidden: [...forbidden, ...missingRules],
      },
    },
  }
}
