import { FormGroup, FormGroupEnterprise, FormGroupXML } from "../formGroup/types"

export interface ContextMenu extends FormGroup {}

export interface ContextMenuXML extends FormGroupXML {}

export interface ContextMenuEnterprise extends FormGroupEnterprise {
  Имя: string
}
