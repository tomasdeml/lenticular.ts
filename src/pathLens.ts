import * as lenses from './lenses';

export interface IPath<TValue> extends Array<IPathSegment> { }
export type IPathSegment = IPropertySegment | IStaticArrayIndexSegment | IVariableArrayIndexSegment;
export interface IPropertySegment { property: string; }
export interface IStaticArrayIndexSegment { staticIndex: number; }
export interface IVariableArrayIndexSegment { variableIndexPosition: number; }

export function pathFromExpression<TValue>(expression: (...any) => TValue): IPath<TValue> {
    const pathExpression = extractPathExpression(expression);
    if (!pathExpression) {
        throw new Error(`Failed to process the expression: "${expression.toString()}"`);
    }

    const rawSegments = pathExpression.split('.');
    return skipPathRoot(rawSegments).reduce(pathSegmentsFromString, []);
}

export function lensFromPath<TValue>(path: IPath<TValue>, variableIndexes?: number[]): lenses.ILens<TValue, TValue> {
    validateVariableIndexesInPathSatisfied(path, variableIndexes);
    const pathSegments = path.map(s => variableArrayIndexSegmentToStatic(s, variableIndexes));
    return lenses.compose(pathSegments.map(lensForPathSegment));
}

export function prettifyPath(path: IPath<any>): string {
    return path.map(s => s.toString()).join('.');
}

function validateVariableIndexesInPathSatisfied(path: IPath<any>, variableIndexes: number[]) {
    const numberOfVariableArrayIndexSegments = path.filter(s => isVariableArrayIndexSegment(s)).length;
    const pathContainsVariableIndexes = numberOfVariableArrayIndexSegments > 0;

    if (pathContainsVariableIndexes && (!variableIndexes || variableIndexes.length === 0)) {
        throw new Error(
            'The path contains variable array indexes however no values for the indexes were passed in the second argument.'
        );
    }

    if (pathContainsVariableIndexes && variableIndexes && variableIndexes.length !== numberOfVariableArrayIndexSegments) {
        throw new Error(
            `The path contains ${numberOfVariableArrayIndexSegments} variable array index(es) ` +
            `however ${variableIndexes.length} value(s) for the indexes were passed in the second argument.`
        );
    }
}

const pathExpressionMatcher = /return\s*([^;}]+);?/mi;
function extractPathExpression(expression: Function): string {
    const pathMatch = pathExpressionMatcher.exec(expression.toString());
    return pathMatch && pathMatch[1];
}

function skipPathRoot(path: string[]): string[] {
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
        const nextVariableIndexPosition = findNextVariableIndexPosition(segments);
        return segments.concat(propertySegment(property), variableArrayIndexSegment(nextVariableIndexPosition));
    }

    return segments.concat(propertySegment(property), staticArrayIndexSegment(Number(index)));
}

function propertySegment(property: string): IPropertySegment {
    return {
        property,
        toString: () => property
    };
}

function variableArrayIndexSegment(indexPosition: number): IVariableArrayIndexSegment {
    return {
        variableIndexPosition: indexPosition,
        toString: () => `[$${indexPosition}]`
    };
}

function findNextVariableIndexPosition(segments: IPathSegment[]): number {
    return segments.filter(isVariableArrayIndexSegment).length;
}

function staticArrayIndexSegment(index: number): IStaticArrayIndexSegment {
    return {
        staticIndex: index,
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

function lensForPathSegment(segment: IPathSegment): lenses.ILens<any, any> {
    if (isPropertySegment(segment)) {
        return lenses.fallbackFor(lenses.attributeLens(segment.property), undefined, {});
    } else if (isStaticArrayIndexSegment(segment)) {
        return lenses.fallbackFor(lenses.arrayIndexLens(segment.staticIndex), undefined, []);
    }

    throw new Error(`Encountered unsupported path segment ${JSON.stringify(segment)}`);
}

function isPropertySegment(segment: IPathSegment): segment is IPropertySegment {
    return 'property' in segment;
}

function isStaticArrayIndexSegment(segment: IPathSegment): segment is IStaticArrayIndexSegment {
    return 'staticIndex' in segment;
}

function isVariableArrayIndexSegment(segment: IPathSegment): segment is IVariableArrayIndexSegment {
    return 'variableIndexPosition' in segment;
}

function variableArrayIndexSegmentToStatic(segment: IPathSegment, variableIndexes: number[]): IPathSegment {
    if (isVariableArrayIndexSegment(segment)) {
        const staticIndex = variableIndexes[segment.variableIndexPosition];
        return staticArrayIndexSegment(staticIndex);
    }

    return segment;
}
