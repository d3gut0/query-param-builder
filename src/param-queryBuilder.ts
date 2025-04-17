import "reflect-metadata";
import { QueryParamMetadata } from "./query-param.decorator";


type ReplacementValue = string | number | boolean | Date | string[] | null;

interface AliasData {
  conditions: string[];
  replacements: Record<string, ReplacementValue>;
}

export class ParametroQueryBuilder {
  private aliasMap: Record<string, AliasData> = {};

  constructor(private input: object) {
    const metadata: QueryParamMetadata[] =
      Reflect.getMetadata("queryParams", Object.getPrototypeOf(input)) || [];
       
    for (const meta of metadata) {
      const value = (this.input as any)[meta.propertyKey];

      if (value == null || value == "") {
        continue;
      }

      if (Array.isArray(value) && value.length <= 0) {
        continue;
      }

      if (typeof value === "boolean") {
        if (value === false) {
          continue;
        }
      }

      if (!this.isValidValue(value)) {
        continue;
      }

      if (!this.aliasMap[meta.alias]) {
        this.aliasMap[meta.alias] = {
          conditions: [],
          replacements: {},
        };
      }

      this.aliasMap[meta.alias].conditions.push(meta.condition);

      if (
        meta.paramKey.includes(":") &&
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        const keys = meta.paramKey.split(":");
        for (const key of keys) {
          const val = (value as Record<string, any>)[key];
          if (val !== undefined && this.isSafeString(val.toString())) {
            this.aliasMap[meta.alias].replacements[key] = val;
          }
        }
      } else {
        this.aliasMap[meta.alias].replacements[meta.paramKey] = value;
      }
    }
  }

  getConditions(alias: string): string {
    const data = this.aliasMap[alias];
    if (!data || data.conditions.length === 0) {
      return "WHERE 1=1 ";
    }
    return " WHERE 1=1  AND " + data.conditions.join(" AND ");
  }

  getReplacements(): Record<string, ReplacementValue> {
    const result: Record<string, ReplacementValue> = {};
    for (const [alias, aliasData] of Object.entries(this.aliasMap)) {
      Object.assign(result, aliasData.replacements);
    }
    return result;
  }

  private isValidValue(value: any): value is ReplacementValue {
    if (Array.isArray(value)) {
      return value.every(
        (item) =>
          ["string", "number"].includes(typeof item) &&
          this.isSafeString(item.toString())
      );
    }

    if (["string", "number", "boolean"].includes(typeof value)) {
      return this.isSafeString(value.toString());
    }

    if (value instanceof Date || value === null) return true;

    return false;
  }

  private isSafeString(str: string): boolean {
    const unsafePatterns = [
      /;/,
      /--/,
      /\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE)\b/i,
    ];
    return !unsafePatterns.some((regex) => regex.test(str));
  }
}
