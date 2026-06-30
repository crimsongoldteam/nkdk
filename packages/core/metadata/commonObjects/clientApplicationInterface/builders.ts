import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface ClientApplicationInterfaceItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "ClientApplicationInterfaceItems"
}

export type ClientApplicationInterfaceItemsRuleParams = Omit<ClientApplicationInterfaceItemsWidePropertyRule, "type">

export function clientApplicationInterfaceItemsRule<const Params extends ClientApplicationInterfaceItemsRuleParams>(
  params: WideExactRuleParams<ClientApplicationInterfaceItemsRuleParams, Params>
): Readonly<{ type: "ClientApplicationInterfaceItems" } & Params> {
  return defineWidePropertyRule("ClientApplicationInterfaceItems", params)
}
export interface ClientApplicationInterfacePanelDefsWidePropertyRule extends WidePropertyRuleBase {
  type: "ClientApplicationInterfacePanelDefs"
}

export type ClientApplicationInterfacePanelDefsRuleParams = Omit<
  ClientApplicationInterfacePanelDefsWidePropertyRule,
  "type"
>

export function clientApplicationInterfacePanelDefsRule<
  const Params extends ClientApplicationInterfacePanelDefsRuleParams,
>(
  params: WideExactRuleParams<ClientApplicationInterfacePanelDefsRuleParams, Params>
): Readonly<{ type: "ClientApplicationInterfacePanelDefs" } & Params> {
  return defineWidePropertyRule("ClientApplicationInterfacePanelDefs", params)
}
