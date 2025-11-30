import { Checkbox } from "antd"
import type React from "react"
import { useState } from "react"
import type { TI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import type { TCheckBoxField } from "~/lib/metadata/forms/elements/checkBoxField/types"
export function CheckBoxFieldComponent(props: Readonly<TCheckBoxField>): React.ReactNode {
  return (
    <Checkbox id={`checkbox_${props.name}`} type="primary" onClick={() => {}}>
      {props.title?.items.ru}
    </Checkbox>
  )
}
