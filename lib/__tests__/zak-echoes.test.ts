import { zakEchoRegistry, findBestEcho, canApplyEcho } from '../zak-echoes';

describe('ZAK Echoes Module', () => {
    describe('zakEchoRegistry', () => {
        it('should contain a list of pre-validated ZAK Echoes', () => {
            expect(Array.isArray(zakEchoRegistry)).toBe(true);
            expect(zakEchoRegistry.length).toBeGreaterThan(0);
        });

        it('each echo should have required properties', () => {
            zakEchoRegistry.forEach(echo => {
                expect(echo).toHaveProperty('id');
                expect(echo).toHaveProperty('pattern');
                expect(echo).toHaveProperty('description');
                expect(typeof echo.resonanceThreshold).toBe('number');
                expect(
                    ['zak_decode_then_execute', 'zak_complete_100_percent', 'zak_validate_and_crystallize']
                ).toContain(echo.completionStrategy);
            });
        });
    });

    describe('findBestEcho', () => {
        it('should find a matching echo for a relevant request', () => {
            const result = findBestEcho('Refactor React component with better structure');
            expect(result).not.toBeNull();
            expect(result!.id).toBe('react_component_refactor');
        });

        it('should return null for a completely unrelated request', () => {
            expect(findBestEcho('xyzzy')).toBeNull();
        });

        it('should find the security audit echo for security-related requests', () => {
            const result = findBestEcho('Perform security audit and find vulnerabilities');
            expect(result).not.toBeNull();
            expect(result!.id).toBe('security_audit');
        });
    });

    describe('canApplyEcho', () => {
        it('returns true if resonanceScore is greater than or equal to threshold', () => {
            const mockEcho = {
                id: 'test_echo',
                pattern: 'test',
                description: 'test desc',
                resonanceThreshold: 0.95,
                completionStrategy: 'zak_complete_100_percent' as const
            };

            expect(canApplyEcho(mockEcho, 0.95)).toBe(true);
            expect(canApplyEcho(mockEcho, 0.96)).toBe(true);
        });

        it('returns false if resonanceScore is less than threshold', () => {
            const mockEcho = {
                id: 'test_echo',
                pattern: 'test',
                description: 'test desc',
                resonanceThreshold: 0.95,
                completionStrategy: 'zak_complete_100_percent' as const
            };

            expect(canApplyEcho(mockEcho, 0.94)).toBe(false);
            expect(canApplyEcho(mockEcho, 0.8)).toBe(false);
        });
    });
});
