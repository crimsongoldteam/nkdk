import React, { useState } from "react"
import { InputText } from "primereact/inputtext"
import { FloatLabel } from "primereact/floatlabel"

interface IInputFieldHTMLProps {
  title?: string
  value?: string
}

export function InputField(props: Readonly<IInputFieldHTMLProps>): React.ReactNode {
  const [value] = useState(props.value)
  const [title] = useState(props.title)

  return (
    <div className="field">
      <FloatLabel>
        <InputText id="input" value={value} className="w-full" />
        <label htmlFor="input">{title}</label>
      </FloatLabel>
    </div>
  )
}
