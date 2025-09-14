import { container, instanceCachingFactory } from "tsyringe"
import {
  ICheckBoxFieldElement,
  ICheckBoxFieldElementProperties,
  IInputFieldElement,
  IInputFieldElementProperties,
} from "../interfaces"
import { TYPES } from "./symbols"
import { IDefaultsProvider, IDefaultsRule } from "../helpers/interfaces"
import { DefaultsProvider } from "../helpers/defaults/defaultsProvider"

export class ContainerFactory {
  public static create(): void {
    container.register(TYPES.IInputFieldDefaultsProvider, {
      useFactory: instanceCachingFactory<IDefaultsProvider>((c) => {
        const element = c.resolve<IInputFieldElement>(TYPES.IInputFieldElement)
        const rule = c.resolve<IDefaultsRule<IInputFieldElement, IInputFieldElementProperties>>(
          TYPES.IInputFieldDefaultsRule
        )
        return new DefaultsProvider(rule, element)
      }),
    })

    container.register(TYPES.ICheckBoxFieldDefaultsProvider, {
      useFactory: instanceCachingFactory<IDefaultsProvider>((c) => {
        const element = c.resolve<ICheckBoxFieldElement>(TYPES.ICheckBoxFieldElement)
        const rule = c.resolve<IDefaultsRule<ICheckBoxFieldElement, ICheckBoxFieldElementProperties>>(
          TYPES.ICheckBoxFieldDefaultsRule
        )
        return new DefaultsProvider(rule, element)
      }),
    })
  }
}
