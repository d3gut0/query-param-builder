import 'reflect-metadata';

export interface QueryParamMetadata {
    propertyKey: string;
    condition: string;
    paramKey: string;
    alias: string;
}

export function QueryParam(condition: string, paramKey: string, alias: string) {
    return function (target: any, propertyKey: string) {        
        const existingParams: QueryParamMetadata[] = Reflect.getMetadata('queryParams', target) || [];
        
        existingParams.push({
            propertyKey,
            condition,
            paramKey,
            alias
        });
        
        Reflect.defineMetadata('queryParams', existingParams, target);
    };
}
