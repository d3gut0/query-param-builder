import 'reflect-metadata';

export interface QueryParamMetadata {
    propertyKey: string;
    condition: string;
    paramKey: string;
    alias: string;
    type?: 'where' | 'select' | 'orderBy' | 'groupBy';
}

export function QueryParam(  condition: string,
    paramKey: string,
    alias: string,
    type?: 'where' | 'select' | 'orderBy' | 'groupBy') {
    return function (target: any, propertyKey: string) {        
        const existingParams: QueryParamMetadata[] = Reflect.getMetadata('queryParams', target) || [];
        
        existingParams.push({
            propertyKey,
            condition,
            paramKey,
            alias,
            type
        });
        
        Reflect.defineMetadata('queryParams', existingParams, target);
    };
}
