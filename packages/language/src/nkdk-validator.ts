// import type { ValidationAcceptor, ValidationChecks } from 'langium';
// import type { NkdkAstType, Person } from './generated/ast.js';
import type { NkdkServices } from "./nkdk-module"

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(_services: NkdkServices) {
  // const registry = services.validation.ValidationRegistry;
  // const validator = services.validation.NkdkValidator;
  // const checks: ValidationChecks<NkdkAstType> = {
  //     Person: validator.checkPersonStartsWithCapital
  // };
  // registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class NkdkValidator {
  // checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
  //     if (person.name) {
  //         const firstChar = person.name.substring(0, 1);
  //         if (firstChar.toUpperCase() !== firstChar) {
  //             accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
  //         }
  //     }
  // }
}
