/** Put this in the `default` of a switch so adding a new union member is a compile error until it is handled. */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
