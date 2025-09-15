import { IFormItemable } from "../interfaces"
import { IFormElement } from "@/elements/interfaces"

type Constructor = new (...args: any[]) => {}

export function FormItemableMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base implements IFormItemable {
    public readonly _items: IFormElement[] = []

    get items(): IFormElement[] {
      return this._items
    }

    addItem(item: IFormElement) {
      this._items.push(item)
    }

    removeItem(item: IFormElement) {
      const index = this._items.indexOf(item)
      if (index === -1) return
      this._items.splice(index, 1)
    }
  }
}
