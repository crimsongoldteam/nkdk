# Граф переиспользуемых схем для validation

## Цель

В validation отказаться от отдельных валидаторов свойств. Каждый YAML-файл должен проверяться одним AJV-валидатором, собранным из корневой схемы, inline-свойств и достижимых внешних JSON Schema через `$ref`.

Inline остаются не как историческое исключение, а как осознанный выбор для индивидуальных схем, которые не стоит стабильно именовать и переиспользовать. Целевой принцип validation: все свойства уходят во внешний `$ref`, кроме явно перечисленных inline-исключений.

Изменение касается только схем validation. Публичные режимы `nkdk schema --inline` и MCP `mode=inline` не меняются.

## Архитектура

Для каждого зарегистрированного project spec validation экспортирует JSON Schema graph: корень для YAML-файла и все достижимые зарегистрированные схемы. Корень и набор refs передаются в `compileValidationSchema` с `inlineRefs: false`.

Составное свойство `Форма` общей формы остаётся обычным свойством корневой схемы и ссылается на `nkdk://schema/validation/<версия>/<язык>/ClientApplicationForm`. Отдельная компиляция формы и отдельный проход проверки свойства не требуются.

Внешняя схема получает читаемый ASCII-идентификатор из типа и только тех параметров правила, которые меняют принятие значения JSON Schema. Например, `boolean/without-true` и `SystemEnumeration/DisplayImportance/without-Auto`. Ограничения, проверяемые вторым проходом validation, в идентификатор не входят.

Динамические части ключа должны быть ASCII в штатном случае. Для `SystemEnumeration` используется внутреннее значение `implicitValueYAML` из правила (`Auto`, `Use`, `DontUse`), а не русское YAML-представление; сама схема при этом по-прежнему исключает русское YAML-значение. Общий слой дополнительно URI-кодирует сегменты ключа как защиту от будущих не-ASCII значений.

В validation-режиме `validationPropertyRefs: true` отсутствие специальной регистрации больше не означает inline. Общий слой сначала проверяет специальный `validationSchemaRef`, затем явное inline-исключение, а для остальных типов строит общий ref по типу свойства. Например, `Color/base`, `Font/base`, `Picture/base`, `I8nText/base`, `ChoiceList/base`.

## Таблица решения по типам свойств

| Группа или тип | Решение | Основание и идентификатор |
| --- | --- | --- |
| `boolean` | внешний `$ref` | Два варианта неявного значения: `boolean/base`, `boolean/without-true`, `boolean/without-false`. |
| `SystemEnumeration` | внешний `$ref` | Тип перечисления и исключённое внутреннее значение `implicitValueYAML` меняют JSON Schema: `SystemEnumeration/<typeSE>/[without-Auto]`. |
| Простые и фиксированные типы без влияющих параметров (`dateTime`, `Color`, `Picture`, `Font`, `I8nText`, `FormattedI8nText`, `Border`, `ChoiceList`, `UserVisible` и т. п.) | внешний `$ref` | Один устойчивый вариант на тип: `<type>/base`. Новые такие типы по умолчанию также получают внешний ref. |
| Уже именованные составные схемы (`ClientApplicationForm`, metadata collections, form elements, `GroupChildItems`, `CommandBarChildItems`, `TableChildItems`, `PagesChildItems`) | внешний `$ref` | Реестр уже задаёт их стабильную identity; для деревьев дочерних элементов это discriminated union ссылок на типы элементов. |
| `DataPath` | inline | `allowedKinds` и `allowComposite` проверяются вторым проходом; свойство индивидуально для владельца. В JSON Schema влияет только редкий флаг opaque-значений, ради которого отдельная общая схема не нужна. |
| `Events` | inline | Состав разрешённых YAML-ключей задаётся конкретным набором событий правила. |
| `string` с `metadataTarget`, `MetadataItemLink`, `MetadataItemLinks`, `MetadataField`, `MetadataFields`, `MetadataObjectRefCollection`, `MetadataValue` | inline | Ограничения metadata-target часто уникальны для конкретного свойства; часть проверяется вторым проходом. |
| `TypeDescription` с `allowedTypes` | inline | Допустимый набор типов индивидуален для свойства. |
| `MetadataDcsMetadataValue`, `SettingsParameterValue` | внешний `$ref` | В коде уже есть семантические ключи из `valueType`, `typeSE` и для второго типа YAML-имени; их нужно проверить и при необходимости упростить. |
| `DcsExplicitSystemEnumerationValue` | временно `Any` | Полная схема слишком тяжёлая и требует отдельного дизайна ключей для системных перечислений DCS. До отдельной реализации validation принимает значение без JSON Schema-ограничения; ограничение зафиксировано в `.agents/restrictions.md`. |

Таблица покрывает все механизмы регистрации. Оставшиеся зарегистрированные типы попадают в следующие группы:

| Механизм | Решение | Охват |
| --- | --- | --- |
| Экспортёр не читает `rule` | внешний `$ref` | Простые и фиксированные типы, включая `dateTime`, `Color`, `Picture`, `Border`, `Font`, `I8nText`, `FormattedI8nText`, `ChoiceList`, `UserVisible`, command-interface и другие. Идентификатор: `<type>/base`, дополненный исключённым неявным значением, если оно меняет допустимые значения. |
| `registerMetadataItemCollectionRule` | внешний `$ref` | Коллекции metadata-элементов: их item rule и форма YAML фиксированы в регистрации property type. |
| Фабрики элементов форм | внешний `$ref` | Типы элемента и его правила фиксированы в registration; уже существуют регистрации схем элементов. |
| Экспортёр зависит от конкретного `rule` | inline, кроме явно перечисленных DCS и enum/boolean | Внешний `$ref` допускается только после добавления читаемого ключа и теста, что он отражает все JSON Schema-ограничения. Это не общий дефолт для всех незарегистрированных типов, а осознанное исключение для rule-зависимых схем. |

## Удаляемые договоры

Из `MetadataItemRule` и `RegisteredProjectSpec` удаляются:

- `externalValidationProperties` и `ExternalValidationProperty`.

Из validation удаляются специальная проверка внешних свойств, `validationSchemaMode`, `externalValidationProperties` и замена свойства `Форма` на `unknown`.

Метод `ValidationSchemaCache.form()` остаётся для реальных файлов `Форма.yaml`: это отдельный корень `ClientApplicationForm`, а не постпроверка свойства внутри `Свойства.yaml`. Он компилируется через тот же validation graph и использует тот же формат refs `nkdk://schema/validation/<версия>/<язык>/<key>`. Standalone-модуль также сохраняет `form`, но его refs собираются тем же graph-механизмом.

## Диагностики и ошибки

Диагностики строятся из стандартных ошибок единого AJV-валидатора. `instancePath` уже указывает полный путь, например `/Форма/Элементы`; существующее преобразование ошибок сопоставляет этот путь с YAML и сохраняет текст сообщения и путь диагностики.

Неразрешимая ссылка `$ref` считается ошибкой компиляции схемы, как для любого другого свойства. Специальных замен схемы на `unknown` и резервных обходов для свойств не остаётся.

## Проверка

Тесты должны подтвердить, что схема `ОбщаяФорма` содержит `$ref` на `ClientApplicationForm`, а один properties-валидатор сообщает для ошибочного значения формы прежний путь `/Форма/Элементы` и стандартное сообщение AJV. Для внешних типов нужны проверки стабильного ASCII-идентификатора и различения параметров, меняющих JSON Schema. Тесты кэша, standalone-генератора и standalone-загрузчика обновляются для единого validation graph.

Перед завершением реализации выполняются точечные тесты validation и полный `pnpm test`.

## Память compiled standalone validation

Изменение должно быть измерено до и после реализации через compiled standalone path, а не source/tsx path. Для сравнения используется одна и та же команда, каталог YAML и число worker:

```text
pnpm --filter @nkdk/core build
node .agents/skills/validation-profile/validation-profile.mjs \
  packages/core/metadata/validation/__fixtures__/project-with-form --runs 5 --timing
```

Базовая точка на `develop` от 2026-07-20: 4 worker, cold 0.74 s, peak RSS 707 MiB, RSS прогонов 682, 682, 682, 682 и 683 MiB; 0 diagnostics. В timing worker RSS во время проверки JSON Schema достигал 674.3 MiB.

После реализации замер повторяется без иных изменений окружения. В результат включаются peak RSS, RSS каждого прогона, cold/warm время и диагностики; отдельно указывается абсолютная и относительная разница с базовой точкой. RSS отражает весь процесс validation, поэтому служит сравнительной метрикой результата, а не оценкой памяти только схем.

Контрольный замер на `develop` от 2026-07-20 после повторной сборки: 4 worker, cold 0.74 s, peak RSS 746 MiB, RSS прогонов 680, 680, 680, 680 и 680 MiB; 0 diagnostics. В timing worker RSS во время проверки JSON Schema достигал 680.5 MiB.

Замер после реализации в worktree `validation-ref-identities` с `inlineRefs: false` в standalone-генераторе: 4 worker, cold 1.13 s, peak RSS 1208 MiB, RSS прогонов 1197, 1197, 1197, 1197 и 1197 MiB; 0 diagnostics. Относительно свежего develop-замера: peak RSS +462 MiB (+61.9%), RSS прогонов примерно +517 MiB (+76.0%), cold +0.39 s (+52.7%). В timing worker RSS во время проверки JSON Schema достигал 1159.3 MiB.

Промежуточный замер до исправления standalone-генератора показал peak RSS 2008 MiB и generated standalone JS 199 MiB. После перевода генератора на один общий AJV-контекст для всех root-валидаторов файл стал 101 MiB. Дополнительная проверка `inlineRefs` показала:

| `inlineRefs` | generated JS | Peak RSS | Cold |
| --- | ---: | ---: | ---: |
| default (`true`) | 101 MiB | 1341 MiB | 1.24 s |
| `false` | 83 MiB | 1208 MiB | 1.13 s |
| `10` | 85 MiB | 1217 MiB | 1.20 s |
| `20` | 86 MiB | 1219 MiB | 1.18 s |
| `50` | 86 MiB | 1221 MiB | 1.09 s |
| `100` | 86 MiB | 1227 MiB | 1.09 s |

Выбран `inlineRefs: false`: он даёт минимальный peak RSS и самый маленький standalone-файл. Оставшийся рост связан с тем, что единый validation graph теперь включает `ClientApplicationForm` и достижимые form/DCS refs в compiled standalone validators, а не заменяет тяжёлые свойства на `unknown`.

Проверка `code`-настроек AJV:

| `code` вариант | generated JS | Peak RSS | Cold | Вывод |
| --- | ---: | ---: | ---: | --- |
| `source: true`, `optimize: true` | 83 MiB | 1209 MiB | 1.08 s | Штатный лучший вариант; `optimize: true` эквивалентен одному проходу. |
| `source: false`, `optimize: true` | - | - | - | Невалиден для `standaloneCode`: AJV требует `code.source`. |
| `source: true`, `optimize: false` | 87 MiB | 1235 MiB | 1.15 s | Хуже по размеру, памяти и cold time. |
| `source: true`, `optimize: 0` | 87 MiB | 1233 MiB | 1.16 s | То же, что отключение оптимизации. |
| `source: true`, `optimize: 1` | 83 MiB | 1176 MiB | 1.09 s | Тот же размер; RSS отличается в пределах шума прогонов. |
| `source: true`, `optimize: 2` | 83 MiB | 1193 MiB | 1.10 s | Не улучшает размер; документация AJV ожидает минимальную пользу сверх одного прохода. |
| `source: true`, `optimize: 3` | 83 MiB | 1187 MiB | 1.09 s | Не даёт устойчивого выигрыша. |

Дополнительные `code`-настройки менять не нужно: `source: true` обязателен для standalone, а оптимизация по умолчанию уже даёт нужный размер generated JS.
