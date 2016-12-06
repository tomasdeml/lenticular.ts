import * as lenses from './lenses';

export interface IPath<TObj, TValue> extends Array<IPathSegment> { }
export type IPathSegment = IPropertySegment | IArrayIndexSegment | IVariableIndexSegment;
export interface IPropertySegment { property: string; }
export interface IArrayIndexSegment { index: number; }
export interface IVariableIndexSegment { variableIndexPosition: number; }

export function pathFromExpression<TObj, TValue>(expression: (obj: TObj, ...variables: (number | string)[]) => TValue): IPath<TObj, TValue> {
    const pathExpression = extractPathExpression(expression);
    if (!pathExpression) {
        throw new Error(`Failed to process expression "${expression.toString()}"`);
    }

    const rawSegments = pathExpression.split('.');
    return skipPathRoot(rawSegments.reduce(pathSegmentsFromString, []));
}

export function lensFromPath<TObj, TValue>(path: IPath<TObj, TValue>, variableIndexValues?: (number | string)[]): lenses.ILens<TObj, TValue, TValue> {
    validateVariableIndexesInPathSatisfied(path, variableIndexValues);
    const pathSegments = path.map(s => resolveSegment(s, variableIndexValues));
    return lenses.compose(pathSegments.map(lensForPathSegment));
}

export function prettifyPath(path: IPath<any, any>): string {
    return path.map(s => s.toString()).join('.');
}

function validateVariableIndexesInPathSatisfied(path: IPath<any, any>, variableIndexValues: any[]) {
    const numberOfVariableIndexSegments = path.filter(s => isVariableIndexSegment(s)).length;
    const pathContainsVariableIndexes = numberOfVariableIndexSegments > 0;

    if (!pathContainsVariableIndexes) {
        return;
    }

    if (!variableIndexValues || variableIndexValues.length === 0) {
        throw new Error('The path contains variable indexes however no values for the indexes were passed in the second argument.');
    }

    if (variableIndexValues && variableIndexValues.length !== numberOfVariableIndexSegments) {
        throw new Error(
            `The path contains ${numberOfVariableIndexSegments} variable index(es) ` +
            `however ${variableIndexValues.length} value(s) for the indexes were passed in the second argument.`);
    }
}

const pathExpressionMatcher = /return\s*([^;}]+);?/mi;
function extractPathExpression(expression: Function): string {
    const pathMatch = pathExpressionMatcher.exec(expression.toString());
    return pathMatch && pathMatch[1];
}

function skipPathRoot(path: IPathSegment[]): IPathSegment[] {
    return path.splice(1);
}

const indexerMatcher = /(\w+)(?:\[(\w+)\])/m;
function pathSegmentsFromString(segments: IPathSegment[], nextRawSegment: string): IPathSegment[] {
    const indexerMatch = indexerMatcher.exec(nextRawSegment);
    if (!indexerMatch) {
        return segments.concat(propertySegment(extractPropertyName(nextRawSegment)));
    }

    const property = indexerMatch[1];
    const index = indexerMatch[2];

    if (isVariableIndex(index)) {
        // TODO Store last index position in reduced value instead of finding it on each pass
        const nextVariableIndexPosition = findNextVariableIndexPosition(segments);
        return segments.concat(propertySegment(property), variableIndexSegment(nextVariableIndexPosition));
    }

    return segments.concat(propertySegment(property), arrayIndexSegment(Number(index)));
}

function propertySegment(property: string): IPropertySegment {
    return {
        property,
        toString: () => property
    };
}

function variableIndexSegment(indexPosition: number): IVariableIndexSegment {
    return {
        variableIndexPosition: indexPosition,
        toString: () => `[$${indexPosition}]`
    };
}

function findNextVariableIndexPosition(segments: IPathSegment[]): number {
    return segments.filter(isVariableIndexSegment).length;
}

function arrayIndexSegment(index: number): IArrayIndexSegment {
    return {
        index,
        toString: () => `[${index}]`
    };
}

const propertyNameMatcher = /\w+/;
function extractPropertyName(name: string) {
    const nameMatch = propertyNameMatcher.exec(name);
    return nameMatch && nameMatch[0];
}

function isVariableIndex(index: string): boolean {
    return isNaN(parseInt(index));
}

function lensForPathSegment(segment: IPathSegment): lenses.ILens<any, any, any> {
    if (isPropertySegment(segment)) {
        return lenses.fallbackFor(lenses.attributeLens(segment.property), undefined, {});
    } else if (isArrayIndexSegment(segment)) {
        return lenses.fallbackFor(lenses.arrayIndexLens(segment.index), undefined, []);
    }

    throw new Error(`Encountered unsupported path segment ${JSON.stringify(segment)}`);
}

function isPropertySegment(segment: IPathSegment): segment is IPropertySegment {
    return 'property' in segment;
}

function isArrayIndexSegment(segment: IPathSegment): segment is IArrayIndexSegment {
    return 'index' in segment;
}

function isVariableIndexSegment(segment: IPathSegment): segment is IVariableIndexSegment {
    return 'variableIndexPosition' in segment;
}

function resolveSegment(segment: IPathSegment, variableIndexValues: (number | string)[]): IPathSegment {
    if (isVariableIndexSegment(segment)) {
        const variableIndexValue = variableIndexValues[segment.variableIndexPosition];
        if (typeof variableIndexValue === 'number') {
            return arrayIndexSegment(variableIndexValue);
        } else {
            return propertySegment(<string>variableIndexValue);
        }
    }

    return segment;
}
