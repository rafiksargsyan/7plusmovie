export type Nullable<T> = T | null | undefined;

export function strIsBlank(s: Nullable<string>) {
  return s == null || s.trim() === "";  
}
