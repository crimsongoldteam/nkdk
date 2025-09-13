# Nakidka Core

TypeScript библиотека для управления формами с классом FormGroup.

## Установка

```bash
npm install nakidka-core
```

## Использование

### Базовое использование

```typescript
import { FormGroup, required, email, minLength } from 'nakidka-core';

// Создание формы с начальными значениями
const form = new FormGroup({
  name: '',
  email: '',
  age: 0
});

// Добавление валидаторов
form.addValidator('name', required('Имя обязательно'));
form.addValidator('name', minLength(2, 'Минимум 2 символа'));
form.addValidator('email', email('Неверный формат email'));

// Установка значений
form.setValue('name', 'Иван');
form.setValue('email', 'ivan@example.com');

// Получение значений
console.log(form.getValue('name')); // 'Иван'
console.log(form.getValues()); // { name: 'Иван', email: 'ivan@example.com', age: 0 }

// Валидация
const isValid = form.validate();
console.log(isValid); // true/false

// Получение ошибок
console.log(form.getErrors('name')); // []
console.log(form.getAllErrors()); // {}
```

### Доступные валидаторы

```typescript
import {
  required,
  minLength,
  maxLength,
  email,
  min,
  max,
  pattern,
  isNumber,
  isInteger,
  positive,
  url,
  oneOf
} from 'nakidka-core';

// Обязательное поле
form.addValidator('field', required('Поле обязательно'));

// Минимальная длина
form.addValidator('field', minLength(3, 'Минимум 3 символа'));

// Максимальная длина
form.addValidator('field', maxLength(50, 'Максимум 50 символов'));

// Email
form.addValidator('field', email('Неверный email'));

// Минимальное число
form.addValidator('field', min(18, 'Минимум 18 лет'));

// Максимальное число
form.addValidator('field', max(100, 'Максимум 100 лет'));

// Паттерн (регулярное выражение)
form.addValidator('field', pattern(/^[A-Z]/, 'Должно начинаться с заглавной буквы'));

// Число
form.addValidator('field', isNumber('Должно быть числом'));

// Целое число
form.addValidator('field', isInteger('Должно быть целым числом'));

// Положительное число
form.addValidator('field', positive('Должно быть положительным'));

// URL
form.addValidator('field', url('Неверный URL'));

// Одно из значений
form.addValidator('field', oneOf(['option1', 'option2'], 'Выберите один из вариантов'));
```

### Методы FormGroup

#### Управление значениями
- `getValue(controlName: string)` - получить значение контрола
- `setValue(controlName: string, value: any)` - установить значение контрола
- `getValues()` - получить все значения формы
- `setValues(values: Record<string, any>)` - установить все значения формы

#### Валидация
- `addValidator(controlName: string, validator: Validator)` - добавить валидатор
- `removeValidator(controlName: string, validator: Validator)` - удалить валидатор
- `validate()` - валидировать всю форму
- `getErrors(controlName: string)` - получить ошибки контрола
- `getAllErrors()` - получить все ошибки формы
- `hasErrors()` - проверить наличие ошибок в форме
- `hasError(controlName: string)` - проверить наличие ошибок у контрола

#### Состояние формы
- `markAsTouched(controlName: string)` - отметить как "touched"
- `markAsDirty(controlName: string)` - отметить как "dirty"
- `isTouched(controlName: string)` - проверить, был ли "touched"
- `isDirty(controlName: string)` - проверить, был ли "dirty"

#### Управление контролами
- `addControl(controlName: string, initialValue?: any)` - добавить контрол
- `removeControl(controlName: string)` - удалить контрол
- `hasControl(controlName: string)` - проверить существование контрола
- `getControlNames()` - получить список всех контролов

#### Утилиты
- `reset(initialValues?: Record<string, any>)` - сбросить форму
- `clearErrors()` - очистить все ошибки

### Пример полной формы

```typescript
import { FormGroup, required, email, minLength, min, max } from 'nakidka-core';

// Создание формы регистрации
const registrationForm = new FormGroup({
  firstName: '',
  lastName: '',
  email: '',
  age: 0,
  password: ''
});

// Добавление валидаторов
registrationForm.addValidator('firstName', required('Имя обязательно'));
registrationForm.addValidator('firstName', minLength(2, 'Минимум 2 символа'));

registrationForm.addValidator('lastName', required('Фамилия обязательна'));
registrationForm.addValidator('lastName', minLength(2, 'Минимум 2 символа'));

registrationForm.addValidator('email', required('Email обязателен'));
registrationForm.addValidator('email', email('Неверный формат email'));

registrationForm.addValidator('age', required('Возраст обязателен'));
registrationForm.addValidator('age', min(18, 'Минимум 18 лет'));
registrationForm.addValidator('age', max(120, 'Максимум 120 лет'));

registrationForm.addValidator('password', required('Пароль обязателен'));
registrationForm.addValidator('password', minLength(8, 'Минимум 8 символов'));

// Заполнение формы
registrationForm.setValues({
  firstName: 'Иван',
  lastName: 'Петров',
  email: 'ivan.petrov@example.com',
  age: 25,
  password: 'securepassword123'
});

// Валидация
if (registrationForm.validate()) {
  console.log('Форма валидна:', registrationForm.getValues());
} else {
  console.log('Ошибки формы:', registrationForm.getAllErrors());
}
```

## Лицензия

MIT

## Разработка

```bash
# Установка зависимостей
npm install

# Сборка
npm run build

# Режим разработки
npm run dev

# Очистка
npm run clean
```
