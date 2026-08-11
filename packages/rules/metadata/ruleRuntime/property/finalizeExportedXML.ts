import type { ConfigurationContext } from "@nkdk/runtime"
import { finalizeDeferredObjectValues, type DeferredObjectValue } from "./deferredObjectValues"
import { resolveDeferredPropertyRule } from "./finalizeImportedYAML"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule } from "./types"
import type { PropertyRuleExecution } from "./fn"

export function finalizeExportedXmlValues(params: {
  xml: unknown
  rootRule: MetadataItemRule
  deferred: readonly DeferredObjectValue[]
  context: ConfigurationContext
  execution?: PropertyRuleExecution
}): void {
  finalizeDeferredObjectValues({
    root: params.xml,
    deferred: params.deferred,
    finalize: ({ deferred, value }) => {
      const rule = resolveDeferredPropertyRule(
        params.rootRule,
        deferred.rulePath,
        params.execution,
      )
      const finalize = params.execution === undefined
        ? getTypeRule(rule.type, "finalizeExportedXML")
        : params.execution.getTypeRule(rule.type, "finalizeExportedXML")
      if (finalize === undefined) {
        throw new Error(`Для типа ${rule.type} не зарегистрирован finalizeExportedXML`)
      }
      return finalize({ context: params.context, rule, value })
    },
  })
}
