import { Nullable } from "./Nullable";

export function strIsBlank(s: Nullable<string>) {
  return s == null || s.trim() === "";  
}
