# ClientApplicationForm GroupList

## Context

Short round-trip по XML-каталогу `/Users/nikita/git/round-trip-source/acc` показал кластер diff'ов в формах:

```xml
<GroupList>2:02023637-7868-4a5f-8576-835a76e0c9ba</GroupList>
```

и

```xml
<GroupList>Дерево</GroupList>
```

После XML -> model -> XML этот узел пропадает. В `packages/core/metadata/forms/clientApplicationForm/rules.ts` сейчас есть корневое поле `group`, но нет поля для XML-тега `GroupList`, поэтому orchestration не сохраняет его в модели.

## Goal

Добавить поддержку корневого поля формы `GroupList` во все представления `ClientApplicationForm`:

- XML: тег `GroupList`.
- TS-модель: свойство `groupList`.
- YAML: ключ `СписокГрупп`.
- rules: декларативное поле в `ClientApplicationFormRules`.

Минимальные формы без `GroupList` должны продолжать импортироваться и экспортироваться без нового узла.

## Design

В `ClientApplicationFormRules` добавляется необязательное свойство `groupList` рядом с существующим `group`, потому что оба описывают группировку элементов формы на корневом уровне.

Правило:

- `yaml: "СписокГрупп"`.
- `xml: "GroupList"`.
- `type: "string"`.
- `tag: FormRulesTags.Form`.

Поле остается строкой. В реальных XML встречаются разные формы значения: UUID-ссылка с префиксом `2:` и имя группы вроде `Дерево`. Типизированную ссылку не вводим, потому что для текущей задачи важно сохранить значение без потерь и без расширения модели ссылок.

## Fixtures

Обновляются существующие полные фикстуры `clientApplicationForm`, а не создается отдельный новый сценарий:

- XML-фикстуры получают `<GroupList>...</GroupList>` в месте, где платформа размещает его перед `AutoCommandBar`.
- TS-фикстуры получают `groupList: "<значение>"`.
- YAML-фикстуры получают `СписокГрупп: "<значение>"`.

Минимальные фикстуры остаются без `GroupList`, чтобы сохранить проверку необязательности поля.

## Data Flow

Импорт XML читает `GroupList` через общее правило и кладет значение в `groupList`.

Экспорт XML берет `groupList` из модели и пишет тег `GroupList`.

Импорт YAML читает `СписокГрупп` и кладет значение в `groupList`.

Экспорт YAML пишет `СписокГрупп`, когда `groupList` задан.

Специальная обработка ошибок не нужна: поле строковое и необязательное.

## Testing

Покрытие дают существующие тесты модуля:

- `fromXML.test.ts` на полных XML-фикстурах.
- `toXML.test.ts` на тех же XML-фикстурах.
- `fromYAML.test.ts` на YAML-фикстурах.
- `toYAML.test.ts` на YAML-фикстурах.

После реализации нужно точечно прогнать тесты `clientApplicationForm`. Для контроля исходного кластера полезно повторить `round-trip.sh --triage --batch-size 5` и убедиться, что первые diff'ы с потерей `<GroupList>` больше не воспроизводятся.

