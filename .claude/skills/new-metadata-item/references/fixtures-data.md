# Работа с `__fixtures__/data.ts`

Файл `__fixtures__/data.ts` содержит ожидаемое внутреннее представление объекта для XML-фикстур и используется в тестах импорта/экспорта.

## Инструкция

0. Перед заполнением `data.ts` убедись, что `rules.ts` и `types.ts` уже созданы.
1. Построение объекта в `data.ts` выполняй от типов: опирайся на `<ObjectName>` из `types.ts` (`rules.ts` если он используется), а не на произвольную структуру.
2. Заполни поля в `data.ts` значениями, которые соответствуют данным из XML-фикстур.
3. Имена фикстур должны быть в формате `fixture<ObjectName>` (`<ObjectName>YAML` для YAML).

## Пример

Исходная XML-фикстура:

```xml
<Filter>
  <use>true</use>
  <userSettingPresentation>MainSettings</userSettingPresentation>
</Filter>
```

Построенный файл `data.ts`:

```typescript
export const fixtureFilter = {
  use: true,
  userSettingPresentation: "MainSettings",
} as const satisfies Filter

export const fixtureFilterYAML = {
  Использование: "true",
  ПредставлениеПользовательскойНастройки: "ОсновныеНастройки",
} as const satisfies FilterYAML
```
