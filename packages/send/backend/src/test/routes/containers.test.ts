import { describe, expect, it } from 'vitest';
import { flattenDescendants, TreeNode } from '../../../src/routes/containers';

const containerNoChild: TreeNode = {
  id: '1',
  children: [],
};
const containerWithChild: TreeNode = {
  id: '2',
  children: [containerNoChild],
};
const containerWithGrandChild: TreeNode = {
  id: '3',
  children: [containerWithChild],
};

describe('flattenDescendants', () => {
  it('should handle null or undefined inputs gracefully', () => {
    expect(flattenDescendants(null)).toEqual([]);
    expect(flattenDescendants(undefined)).toEqual([]);
  });

  it('should return an empty array for an empty tree', () => {
    const emptyTree = {} as TreeNode;
    expect(flattenDescendants(emptyTree)).toEqual([]);
  });

  it('should return grandchildren, children and root', () => {
    expect(flattenDescendants(containerWithGrandChild)).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('should handle a tree with no children', () => {
    expect(flattenDescendants(containerNoChild)).toEqual(['1']);
  });

  it('should flatten a tree with multiple children', () => {
    const tree: TreeNode = {
      id: '1',
      children: [
        { id: '2', children: [] },
        { id: '3', children: [] },
      ],
    };
    expect(flattenDescendants(tree)).toEqual(['2', '3', '1']);
  });

  it('should flatten a deeply nested tree', () => {
    const tree: TreeNode = {
      id: '1',
      children: [
        {
          id: '2',
          children: [
            { id: '4', children: [] },
            { id: '5', children: [] },
          ],
        },
        { id: '3', children: [] },
      ],
    };
    expect(flattenDescendants(tree)).toEqual(['4', '5', '2', '3', '1']);
  });
});
