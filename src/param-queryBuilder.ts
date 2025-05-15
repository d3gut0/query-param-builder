import "reflect-metadata";
import { QueryParamMetadata } from "./query-param.decorator";

type ReplacementValue = string | number | boolean | Date | string[] | null;

interface AliasData {
  conditions: string[];
  replacements: Record<string, ReplacementValue>;
  selects?: string[];
  orderBys?: string[];
  groupBys?: string[];
}

export class ParametroQueryBuilder {
  private aliasMap: Record<string, AliasData> = {};

  constructor(private input: object) {
    const metadata: QueryParamMetadata[] =
      Reflect.getMetadata("queryParams", Object.getPrototypeOf(input)) || [];

    for (const meta of metadata) {
      const value = (this.input as any)[meta.propertyKey];

      const type = meta.type || "where";

      if (value == null || value == "") {
        continue;
      }

      if (Array.isArray(value) && value.length <= 0) {
        continue;
      }

      if (typeof value === "boolean") {
        // Se for 'false', pula
        if (value === false) {
          continue;
        }
        // Se for 'true', segue normal abaixo adicionando a condition
      }

      if (!this.isValidValue(value)) {
        continue;
      }

      // Se não existir no aliasMap, cria
      if (!this.aliasMap[meta.alias]) {
        this.aliasMap[meta.alias] = {
          conditions: [],
          replacements: {},
          selects: [],
          orderBys: [],
          groupBys: [],
        };
      }

      // Pula se não for necessário (ex: SELECT ou ORDER BY geralmente não depende de valor)
      if (type === "select") {
        this.aliasMap[meta.alias].selects!.push(meta.condition);
        continue;
      }

      if (type === "orderBy") {
        this.aliasMap[meta.alias].orderBys!.push(meta.condition);
        continue;
      }

      if (type === "groupBy") {
        this.aliasMap[meta.alias].orderBys!.push(meta.condition);
        continue;
      }

      // Adiciona a condition no array
      this.aliasMap[meta.alias].conditions.push(meta.condition);

      // Adiciona no replacements
      // Exemplo: paramKey = 'empresa', value = ['01', '03']
      // this.aliasMap[meta.alias].replacements[meta.paramKey] = value;
      // Checa se são múltiplos parâmetros (BETWEEN, por exemplo)
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

  /**
   * Retorna as condições para determinado alias em forma de " AND cond1 AND cond2"
   * Se não tiver nada, retorna string vazia.
   */
  getConditions(alias: string): string {
    const data = this.aliasMap[alias];
    if (!data || data.conditions.length === 0) {
      return "WHERE 1=1 ";
    }
    return " WHERE 1=1  AND " + data.conditions.join(" AND ");
  }

  /**
   * Gera o objeto de replacements consolidado de todos os aliases.
   */
  getReplacements(): Record<string, ReplacementValue> {
    const result: Record<string, ReplacementValue> = {};
    for (const [alias, aliasData] of Object.entries(this.aliasMap)) {
      Object.assign(result, aliasData.replacements);
    }
    return result;
  }

  getSelect(alias: string): string {
    const data = this.aliasMap[alias];
    if (!data || !data.selects || data.selects.length === 0) {
      return ""; // ou jogue exceção, dependendo do seu uso
    }
    return data.selects.join(", ");
  }

  getOrderBy(alias: string): string {
    const data = this.aliasMap[alias];
    if (!data || !data.orderBys || data.orderBys.length === 0) {
      return "";
    }
    return " ORDER BY " + data.orderBys.join(", ");
  }

  getGroupBy(alias: string): string {
    const data = this.aliasMap[alias];
    if (!data || !data.groupBys || data.groupBys.length === 0) {
      return "GROUP BY";
    }
    return " GROUP BY " + data.groupBys.join(", ");
  }
  /** Valida se o valor é seguro para ser usado nos replacements */
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

  /** Checagem básica contra valores suspeitos de SQL Injection */
  private isSafeString(str: string): boolean {
    const unsafePatterns = [
      /;/,
      /--/,
      /\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE)\b/i,
    ];
    return !unsafePatterns.some((regex) => regex.test(str));
  }
}
