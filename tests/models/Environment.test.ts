import { Environment } from '../../src/models/Environment';

describe('Environment Model', () => {
  let environment: Environment;

  beforeEach(() => {
    environment = new Environment('env-id', 'Test Environment');
  });

  it('should create an environment with basic properties', () => {
    expect(environment.id).toBe('env-id');
    expect(environment.name).toBe('Test Environment');
    expect(environment.variables).toEqual({}); // Implementation uses Record, not Array
  });

  it('should have basic properties', () => {
    expect(environment.id).toBe('env-id');
    expect(environment.name).toBe('Test Environment');
    expect(environment.variables).toBeDefined();
  });

  it('should get variable value when exists', () => {
    // Add variable directly to test getVariableValue
    environment.variables = { API_KEY: { key: 'API_KEY', value: 'secret123' } };

    const value = environment.getVariableValue('API_KEY');

    expect(value).toBe('secret123');
  });

  it('should return undefined for non-existent variable', () => {
    const value = environment.getVariableValue('NON_EXISTENT');

    expect(value).toBeUndefined(); // Implementation returns undefined, not empty string
  });
});
