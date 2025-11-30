import { Checkbox, Form, Switch, Typography } from "antd"
import type React from "react"
import type { TCheckBoxField } from "~/lib/metadata/forms/elements/checkBoxField/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export function CheckBoxFieldComponent(props: Readonly<TCheckBoxField>): React.ReactNode {
  const isRightHeader = props.headerHorizontalAlign === SE.ZItemHorizontalLocation.enum.Right

  const rightHeader = isRightHeader ? props.title?.items.ru : undefined
  const leftHeader = isRightHeader ? undefined : props.title?.items.ru

  if (props.checkBoxType === SE.ZCheckBoxType.enum.Switch) {
    return (
      <Form.Item>
        <Typography.Text>{leftHeader}</Typography.Text>
        <Switch id={`checkbox_${props.name}`}></Switch>
        <Typography.Text>{rightHeader}</Typography.Text>
      </Form.Item>
    )
  }

  return (
    <Form.Item>
      <Typography.Text>{leftHeader}</Typography.Text>
      <Checkbox id={`checkbox_${props.name}`} type="primary">
        {rightHeader}
      </Checkbox>
    </Form.Item>
  )
}
