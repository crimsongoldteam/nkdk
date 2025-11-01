import React, { useState } from "react"
import { Checkbox } from "antd"
import { TI8nText } from "~/lib/metadata/commonObjects/i8nText/types"

interface ICheckBoxFieldHTMLProps {
  name: string
  title?: TI8nText
}

export function CheckBoxFieldComponent(props: Readonly<ICheckBoxFieldHTMLProps>): React.ReactNode {
  const [title] = useState(props.title?.items.ru || "")
  const [name] = useState(props.name)
  return (
    <Checkbox id={`checkbox_${name}`} type="primary" onClick={() => {}}>
      {title}
    </Checkbox>
  )
}
