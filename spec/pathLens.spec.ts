/// <reference path="./jasmine"/>
import * as pathLens from '../src/pathLens';

describe('pathFromExpression', () => {
    it('should create path from untyped expression', () => {
        const path = pathLens.pathFromExpression((s, i) => s.foo.bar[i].baz);
        expect(path.length).toBe(4);
    });

    // TODO
});
