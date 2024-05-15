import { Nullable } from "../../../Nullable";

export class EnumExample {
    public static KEY1 = new EnumExample("Name1");
    public static KEY2 = new EnumExample("Name2");

    private static values = {
      KEY1: EnumExample.KEY1,
      KEY2: EnumExample.KEY2
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
