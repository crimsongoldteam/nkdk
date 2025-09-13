import { injectable, singleton } from "tsyringe"
import { IDefaultsService, IDefaultsProvider } from "./interfaces"
import { InputFieldElementDefaultsProvider } from "./inputFieldElementDefaultsProvider"
import { ManagedFormElementDefaultsProvider } from "./managedFormElementDefaultsProvider"
import { IInputFieldElement, IManagedFormElement } from "../interfaces"

@injectable()
@singleton()
export class DefaultsService implements IDefaultsService {
  private providers: Map<string, IDefaultsProvider<any>> = new Map()

  constructor(
    private inputFieldElementDefaultsProvider: InputFieldElementDefaultsProvider,
    private managedFormElementDefaultsProvider: ManagedFormElementDefaultsProvider
  ) {
    this.registerProviders()
  }

  private registerProviders(): void {
    this.providers.set("InputFieldElement", this.inputFieldElementDefaultsProvider)
    this.providers.set("ManagedFormElement", this.managedFormElementDefaultsProvider)
  }

  public getDefaults<T>(element: T): Partial<T> {
    const elementType = (element as any).constructor.name
    const provider = this.providers.get(elementType)

    if (!provider) {
      throw new Error(`No defaults provider found for type: ${elementType}`)
    }

    return provider.getDefaults(element)
  }

  // Специфичные методы для удобства
  public getInputFieldElementDefaults(element: IInputFieldElement): Partial<IInputFieldElement> {
    return this.inputFieldElementDefaultsProvider.getDefaults(element)
  }

  public getManagedFormElementDefaults(element: IManagedFormElement): Partial<IManagedFormElement> {
    return this.managedFormElementDefaultsProvider.getDefaults(element)
  }
}
