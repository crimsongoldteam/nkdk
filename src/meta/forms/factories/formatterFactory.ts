import { IBaseElement } from "@/elements/interfaces"
import { container, injectable, instanceCachingFactory, singleton } from "tsyringe"
import { TYPES } from "../container/symbols"
import { IFormatter } from "../interfaces"

@injectable({ token: TYPES.FormatterFactory })
@singleton()
export class FormatterFactory {
  public register(
    formatterToken: symbol,
    elementToken: symbol,
    filter: (element: IBaseElement) => boolean = () => true
  ): void {}

  public get(element: IBaseElement): IFormatter {
    return container.resolve<IFormatter>(TYPES.IClientApplicationFormFormatter)
  }
}

