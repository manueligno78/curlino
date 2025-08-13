export interface EnvironmentVariable {
  key: string;
  value: string;
  description?: string;
}

export interface EnvironmentInterface {
  id: string;
  name: string;
  description?: string;
  variables: Record<string, EnvironmentVariable>;
}

export class Environment implements EnvironmentInterface {
  id: string;
  name: string;
  description?: string;
  variables: Record<string, EnvironmentVariable>;

  constructor(
    id: string,
    name: string,
    description: string = '',
    variables: Record<string, EnvironmentVariable> = {}
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.variables = variables;
  }

  getVariable(key: string): EnvironmentVariable | undefined {
    return this.variables[key];
  }

  getVariableValue(key: string): string | undefined {
    return this.variables[key]?.value;
  }

  setVariable(key: string, value: string, description: string = ''): void {
    this.variables[key] = { key, value, description };
  }

  removeVariable(key: string): void {
    delete this.variables[key];
  }

  getAllVariables(): Record<string, EnvironmentVariable> {
    return this.variables;
  }

  toJSON(): EnvironmentInterface {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      variables: this.variables,
    };
  }
}

export default Environment;
