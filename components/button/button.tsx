import React, { useState } from "react"
import { Button } from "antd"
import { TI8nText } from "~/lib/metadata/commonObjects/i8nText/types"

interface IButtonHTMLProps {
  name: string
  title?: TI8nText
}

export function ButtonComponent(props: Readonly<IButtonHTMLProps>): React.ReactNode {
  const [title] = useState(props.title?.ru || "")
  const [name] = useState(props.name)
  return (
    <Button id={`button_${name}`} onClick={() => {}}>
      {title}
    </Button>
  )
}
