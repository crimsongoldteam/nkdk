import { container, instanceCachingFactory } from "tsyringe"
import { IInputField, IInputFieldProperties } from "../elements/inputField/interfaces"
import { ICheckBoxField, ICheckBoxFieldProperties } from "../elements/checkBoxField/interfaces"
import { TYPES } from "./symbols"
import { IDefaultsProvider, IDefaultsRule } from "../helpers/interfaces"
import { DefaultsProvider } from "../helpers/defaults/defaultsProvider"

export class ContainerFactory {
  public static create(): void {
    container.register(TYPES.IInputFieldDefaultsProvider, {
      useFactory: instanceCachingFactory<IDefaultsProvider>((c) => {
        const element = c.resolve<IInputField>(TYPES.IInputField)
        const rule = c.resolve<IDefaultsRule<IInputField, IInputFieldProperties>>(
          TYPES.IInputFieldFormatterDefaultsRule
        )
        return new DefaultsProvider(rule, element)
      }),
    })

    container.register(TYPES.ICheckBoxFieldDefaultsProvider, {
      useFactory: instanceCachingFactory<IDefaultsProvider>((c) => {
        const element = c.resolve<ICheckBoxField>(TYPES.ICheckBoxField)
        const rule = c.resolve<IDefaultsRule<ICheckBoxField, ICheckBoxFieldProperties>>(
          TYPES.ICheckBoxFieldFormatterDefaultsRule
        )
        return new DefaultsProvider(rule, element)
      }),
    })
  }
}
