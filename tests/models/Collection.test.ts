import { Collection } from '../../src/models/Collection';
import { Request } from '../../src/models/Request';

describe('Collection Model', () => {
  let collection: Collection;
  let testRequest: Request;

  beforeEach(() => {
    collection = new Collection('test-collection-id', 'Test Collection', 'Test description');
    testRequest = new Request('test-request-id', 'Test Request', 'https://api.example.com/test');
  });

  it('should create a collection with initial properties', () => {
    expect(collection.id).toBe('test-collection-id');
    expect(collection.name).toBe('Test Collection');
    expect(collection.description).toBe('Test description');
    expect(collection.requests).toEqual([]);
  });

  it('should add a request to the collection', () => {
    collection.addRequest(testRequest);

    expect(collection.requests).toHaveLength(1);
    expect(collection.requests[0]).toBe(testRequest);
  });

  it('should remove a request from the collection', () => {
    collection.addRequest(testRequest);
    expect(collection.requests).toHaveLength(1);

    collection.removeRequest('test-request-id');
    expect(collection.requests).toHaveLength(0);
  });

  it('should not remove request if id does not exist', () => {
    collection.addRequest(testRequest);
    expect(collection.requests).toHaveLength(1);

    collection.removeRequest('non-existent-id');
    expect(collection.requests).toHaveLength(1);
  });

  it('should find a request by id', () => {
    collection.addRequest(testRequest);

    const foundRequest = collection.findRequest('test-request-id');
    expect(foundRequest).toBe(testRequest);
  });

  it('should return undefined for non-existent request id', () => {
    const foundRequest = collection.findRequest('non-existent-id');
    expect(foundRequest).toBeUndefined();
  });

  it('should update collection name', () => {
    collection.name = 'Updated Collection Name';
    expect(collection.name).toBe('Updated Collection Name');
  });
});
