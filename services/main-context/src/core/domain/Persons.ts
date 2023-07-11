export const Persons = {
  KEIRA_KNIGHTLEY : { EN_US : "Keira Knightley", RU : "Кира Найтли" },
  JAKE_GYLLENHAAL : { EN_US : "Jake Gyllenhaal", RU : "Джейк Джилленхол" },
  GUY_RITCHIE : { EN_US : "Guy Ritchie", RU : "Гай Ричи" },
  CHRISTOPHER_NOLAN : { EN_US : "Christopher Nolan", RU : "Кристофер Нолан" },
  MATTHEW_MCCONAUGHEY : { EN_US : "Matthew McConaughey", RU : "Мэттью МакКонахи" }
} as const;

export class Person {
  readonly code: string;
  
  public constructor(code: string) {
    if (!(code in Persons)) {
      throw new InvalidPersonError();
    }
    this.code = code;
  }
}

class InvalidPersonError extends Error {}