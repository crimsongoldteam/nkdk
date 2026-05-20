# Удаление устаревших `toPartialYAML: false` в формах

## Контекст

После перехода форм на единый `Форма.yaml` partial YAML больше не является
тонкой надстройкой над `Форма.nkdk` или исходной моделью. YAML должен сам
содержать значения, которые нужны для обратного XML-экспорта.

Оставшиеся `toPartialYAML: false` скрывают часть свойств из compact/tree YAML.
Это уже проявилось в round-trip: `AutoCommandBar.autofill=false` импортируется
из XML, не попадает в YAML, а после YAML-цикла XML теряет
`<Autofill>false</Autofill>`.

## Область изменения

Убрать все активные `toPartialYAML: false` из правил элементов форм в
`packages/core/metadata/forms/elements/**/rules.ts`.

Текущие активные места:

- `autoCommandBar.autofill`
- `columnGroup.group`
- `inputField.dataPath`
- `checkBoxField.dataPath`
- `labelField.dataPath`
- `pictureField.dataPath`
- `usualGroup.group`
- `usualGroup.showTitle`

Закомментированные упоминания можно удалить как устаревшие подсказки, если они
находятся рядом с меняемыми правилами.

## Не входит

- Не менять XML-фикстуры.
- Не менять `toYAML: false` и `fromYAML: false`: это отдельная семантика
  полного исключения свойства из YAML.
- Не менять правила `defaultValueYAML`, кроме случаев, когда тест покажет
  прямую несовместимость после удаления `toPartialYAML: false`.
- Не решать здесь отдельную проблему `ChoiceParameters` и
  `FormChoiceListDesTimeValue`.

## Поведение

В partial/tree YAML свойства с недефолтными или явно значимыми значениями должны
экспортироваться так же, как обычные YAML-свойства.

Для `AutoCommandBar.autofill=false` ожидаем:

```yaml
КоманднаяПанель:
  Автозаполнение: Ложь
```

Для полей формы с `dataPath` ожидаем явный `ПутьКДанным`, когда путь был в XML
или модели. Для групп ожидаем явные `Группировка` и `ОтображатьЗаголовок`, когда
значение отличается от YAML-дефолта.

## Архитектура

Механизм `toPartialYAML` остаётся в orchestration как совместимый флаг, но после
этого изменения правила форм больше не должны использовать его для скрытия
значимых свойств. Это локальное изменение в `rules.ts`; новые fromXML/toXML или
fromYAML/toYAML обработчики не нужны.

## Проверка

Добавить или обновить тесты на уровне существующих element/form YAML
преобразований:

- `AutoCommandBar` с `autofill=false` экспортируется в YAML с
  `Автозаполнение: Ложь`.
- Полный YAML формы с такой командной панелью импортируется обратно в модель с
  `autofill=false`.
- Существующие общие тесты элементов подтверждают, что удаление флага не ломает
  partial YAML для `dataPath` и групп.

После реализации запустить точечные Vitest-тесты для форм, затем
`round-trip-yaml --triage --batch-size 5`. Перед закрытием общей задачи нужен
полный `pnpm test`.
