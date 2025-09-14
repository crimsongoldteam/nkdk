import { container, instanceCachingFactory } from "tsyringe"
import { IInputFieldElement, IInputFieldElementProperties } from "../interfaces"
import { IInputFieldDefaultsProviderToken, IInputFieldDefaultsRuleToken, IInputFieldElementToken } from "./symbols"
import { IDefaultsProvider, IDefaultsRule } from "../helpers/interfaces"
import { DefaultsProvider } from "../helpers/defaults/defaultsProvider"

export class ContainerFactory {
  public static create(): void {
    container.register(IInputFieldDefaultsProviderToken, {
      useFactory: instanceCachingFactory<IDefaultsProvider>((c) => {
        const element = c.resolve<IInputFieldElement>(IInputFieldElementToken)
        const rule =
          c.resolve<IDefaultsRule<IInputFieldElement, IInputFieldElementProperties>>(IInputFieldDefaultsRuleToken)
        return new DefaultsProvider(rule, element)
      }),
    })
  }
}
