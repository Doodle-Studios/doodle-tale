export const types = {
  name: "string",
  level: "number",
  xp: "number",
  hp: "number",
  max_hp: "number",
  weapons: "dict",
  stats: "dict",
  filelocation: "string",
};

export const weapon_types = {
  name: "string",
  min_dmg: "number",
  max_dmg: "number",
};

export const stat_types = {
  strength: "number",
  agility: "number",
  defence: "number",
};

export class Data {
  valid: boolean = true;
  constructor(public data: Dict<any>) {
    for (const key in data) {
      const val = data[key];

      if (key === "weapons") {
        for (const weaponId in val) {
          const weapon = val[weaponId];
          for (const prop in weapon_types) {
            const expected = weapon_types[prop as keyof typeof weapon_types];
            if (typeof weapon[prop] !== expected) {
              this.valid = false;
            }
          }
        }
      } 

      else if (key === "stats") {
        for (const statName in stat_types) {
          const expected = stat_types[statName as keyof typeof stat_types];
          if (typeof val[statName] !== expected) {
            this.valid = false;
          }
        }
      } 

      else if (typeof val !== "object") {
        const expected = types[key as keyof typeof types];
        if (typeof val !== expected) {
          this.valid = false;
        }
      }
    }
    Object.assign(this, data);
  }
}

export const new_data = (name: string) => new Data({
  name: name,
  level: 1,
  xp: 0,
  hp: 20,
  max_hp: 20,
  weapons: {
    "fists": {
      name: "fists",
      min_dmg: 1,
      max_dmg: 3,
    }
  },
  stats: {
    strength: 1,
    agility: 1,
    defence: 1,
  },
  filelocation: "",
});