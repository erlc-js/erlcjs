import { describe, expect, it } from 'vitest';
import { convertToPascalCase } from './index.js';

describe('convertToPascalCase', () => {
    it('converts nested keys to PascalCase', () => {
        expect(convertToPascalCase({ someKey: 1, nested: { otherKey: true } })).toEqual({
            SomeKey: 1,
            Nested: { OtherKey: true },
        });
    });

    it('does not allow prototype pollution through payload keys', () => {
        const payload = JSON.parse('{"__proto__":{"polluted":"yes"},"safeKey":1}');
        const result = convertToPascalCase(payload);

        expect(({} as any).polluted).toBeUndefined();
        expect(result.SafeKey).toBe(1);

        const nested = JSON.parse('{"outer":{"__proto__":{"polluted":"yes"}}}');
        convertToPascalCase(nested);
        expect(({} as any).polluted).toBeUndefined();
    });
});
