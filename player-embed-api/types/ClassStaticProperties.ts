export type ClassStaticProperties<T> = {
  [Key in keyof T as Key extends "prototype" ? never : T[Key] extends (...args: any[]) => any ? never : Key]: T[Key];
}