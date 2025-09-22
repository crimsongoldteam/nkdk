import { TypeMetadata } from "class-transformer"

function isPlainObject(value: any): boolean {
  if (value === null || typeof value !== "object") {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}

// Применяем патч через require, чтобы получить доступ к внутренним классам
const TransformOperationExecutor =
  require("class-transformer/cjs/TransformOperationExecutor").TransformOperationExecutor

const oldTransformFn = TransformOperationExecutor.prototype.transform

TransformOperationExecutor.prototype.transform = function transform(
  source: Record<string, any> | Record<string, any>[] | any,
  value: Record<string, any> | Record<string, any>[] | any,
  targetType: Function | TypeMetadata,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  arrayType: Function,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isMap: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  level?: number
): any {
  // Если это простой объект и целевой тип - Object, возвращаем как есть
  if (isPlainObject(value)) {
    return value
  }
  // @ts-ignore
  return oldTransformFn.apply(this, arguments)
}
