import { Group } from '../../src/models/Group';
import { Request } from '../../src/models/Request';

describe('Group Model', () => {
  let group: Group;
  let testRequest: Request;

  beforeEach(() => {
    group = new Group('test-group-id', 'Test Group', 'Test description');
    testRequest = new Request('test-request-id', 'Test Request', 'https://api.example.com/test');
  });

  it('should create a group with initial properties', () => {
    expect(group.id).toBe('test-group-id');
    expect(group.name).toBe('Test Group');
    expect(group.description).toBe('Test description');
    expect(group.requests).toEqual([]);
  });

  it('should add a request to the group', () => {
    group.addRequest(testRequest);

    expect(group.requests).toHaveLength(1);
    expect(group.requests[0]).toBe(testRequest);
  });

  it('should remove a request from the group', () => {
    group.addRequest(testRequest);
    expect(group.requests).toHaveLength(1);

    group.removeRequest('test-request-id');
    expect(group.requests).toHaveLength(0);
  });

  it('should not remove request if id does not exist', () => {
    group.addRequest(testRequest);
    expect(group.requests).toHaveLength(1);

    group.removeRequest('non-existent-id');
    expect(group.requests).toHaveLength(1);
  });

  it('should find a request by id', () => {
    group.addRequest(testRequest);

    const foundRequest = group.findRequest('test-request-id');
    expect(foundRequest).toBe(testRequest);
  });

  it('should return undefined for non-existent request id', () => {
    const foundRequest = group.findRequest('non-existent-id');
    expect(foundRequest).toBeUndefined();
  });

  it('should update group name', () => {
    group.name = 'Updated Group Name';
    expect(group.name).toBe('Updated Group Name');
  });
});
