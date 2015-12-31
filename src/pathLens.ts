import * as lenses from './lenses';

export function pathFromExpression(expression: Function): IPath {
    const pathExpression = extractExpression(expression);
    const rawSegments = pathExpression.split('.');
    return skipPathRoot(rawSegments).reduce(pathSegmentsFromString, []);
}

export function lensFromPath(path: IPath, ...variableIndexes: number[]): lenses.ILens {
    const pathSegments = path.map(s => variableArrayIndexSegmentToStatic(s, variableIndexes));
    return lenses.compose(pathSegments.map(lensForPathSegment));
}

export function prettifyPath(path: IPath): string {
    return path.map(s => s.toString()).join('.');
}

type IPathSegment = IPropertySegment | IStaticArrayIndexSegment | IVariableArrayIndexSegment;
type IPath = IPathSegment[];

interface IPropertySegment { property: string; }
interface IStaticArrayIndexSegment { staticIndex: number; }
interface IVariableArrayIndexSegment { variableIndexPosition: number; }

const funcExpressionMatcher = /\{\s*return\s*(.+);?\}/mi;
function extractExpression(func: Function): string {
    const expressionMatch = funcExpressionMatcher.exec(func.toString());
    return expressionMatch && expressionMatch[1];
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

function lensForPathSegment(segment: IPathSegment): lenses.ILens {
    if (isPropertySegment(segment)) {
        return lenses.fallbackFor(lenses.attributeLens(segment.property), undefined, {});
    } else if (isStaticArrayIndexSegment(segment)) {
        return lenses.fallbackFor(lenses.arrayIndexLens(segment.staticIndex), undefined, []);
    }

    throw new Error(`Unsupported path segment ${JSON.stringify(segment)}`);
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
