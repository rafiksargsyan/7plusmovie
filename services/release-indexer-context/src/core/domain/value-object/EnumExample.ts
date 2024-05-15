import { Nullable } from "../../../Nullable";

export class EnumExample {
    private static values = {
      "KEY1": new EnumExample("Name1"),
      "KEY2": new EnumExample("Name2")
    } as const;

    readonly name: string;
  
    private constructor(name: string) {
      this.name = name;
    }
  
    static from(key: Nullable<string>): EnumExample {
      if (key == null || !(key in this.values)) {
        throw new InvalidEnumExampleKeyError();
      }
      return this.values[key];
    }
}

class InvalidEnumExampleKeyError extends Error {}
