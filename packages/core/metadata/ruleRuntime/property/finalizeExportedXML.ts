import type { ConfigurationContext } from "../../context/types"
import { finalizeDeferredObjectValues, type DeferredObjectValue } from "./deferredObjectValues"
import { resolveDeferredPropertyRule } from "./finalizeImportedYAML"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule } from "./types"

export function finalizeExportedXmlValues(params: {
  xml: unknown
  rootRule: MetadataItemRule
  deferred: readonly DeferredObjectValue[]
  context: ConfigurationContext
}): void {
  finalizeDeferredObjectValues({
    root: params.xml,
    deferred: params.deferred,
    finalize: ({ deferred, value }) => {
      const rule = resolveDeferredPropertyRule(params.rootRule, deferred.rulePath)
      const finalize = getTypeRule(rule.type, "finalizeExportedXML")
      if (finalize === undefined) {
        throw new Error(`Для типа ${rule.type} не зарегистрирован finalizeExportedXML`)
      }
      return finalize({ context: params.context, rule, value })
    },
  })
}
