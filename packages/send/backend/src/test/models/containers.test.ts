import { ContainerType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONTAINER_NOT_CREATED,
  CONTAINER_NOT_FOUND,
  CONTAINER_NOT_UPDATED,
  GROUP_NOT_CREATED,
  MEMBERSHIP_NOT_CREATED,
} from '../../errors/models';
import {
  createContainer,
  getAccessLinksForContainer,
  getContainerWithAncestors,
  getItemsInContainer,
  updateContainerName,
} from '../../models/containers';
// Import prisma-helper to mock it
import * as prismaHelper from '../../models/prisma-helper';
import { PermissionType } from '../../types/custom';

// Hoist variables to be available in mocks
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    group: {
      create: vi.fn(),
    },
    membership: {
      create: vi.fn(),
    },
    container: {
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    share: {
      findMany: vi.fn(),
    },
  };
  return { mockPrisma };
});

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => mockPrisma),
    ContainerType: { FOLDER: 'FOLDER', VAULT: 'VAULT' }, // Mock enum
  };
});

// Mock prisma-helper's fromPrismaV2 function
vi.mock('../../models/prisma-helper', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    ...actual,
    // Mock fromPrismaV2 to be controllable per test
    fromPrismaV2: vi.fn(),
  };
});

describe('Container Models', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Reset the implementation of the mock if needed, or set default behavior
    vi.mocked(prismaHelper.fromPrismaV2).mockImplementation(
      async (prismaAction, _query) => {
        // Default mock implementation: call the underlying mocked prisma function
        // This might need adjustment based on specific test needs
        return prismaAction(_query);
      }
    );
  });

  describe('createContainer', () => {
    it('should create a container, group, and membership successfully', async () => {
      const mockGroup = { id: 'group1', name: 'Test Group' };
      const mockMembership = {
        id: 'mem1',
        userId: 'user1',
        groupId: 'group1',
        permission: PermissionType.ADMIN,
      };
      const mockContainer = {
        id: 'container1',
        name: 'Test Container',
        ownerId: 'user1',
        groupId: 'group1',
        type: ContainerType.FOLDER,
        parentId: null,
        shareOnly: false,
        createdAt: expect.any(Date), // Use expect.any(Date) for dynamic values
        updatedAt: expect.any(Date),
      };

      // Mock the sequence of calls to fromPrismaV2
      vi.mocked(prismaHelper.fromPrismaV2)
        .mockResolvedValueOnce(mockGroup) // First call for group.create
        .mockResolvedValueOnce(mockMembership) // Second call for membership.create
        .mockResolvedValueOnce(mockContainer); // Third call for container.create

      const result = await createContainer(
        'Test Container',
        'user1',
        ContainerType.FOLDER,
        null,
        false
      );

      // Check if fromPrismaV2 was called correctly
      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(3);
      expect(prismaHelper.fromPrismaV2).toHaveBeenNthCalledWith(
        1,
        mockPrisma.group.create,
        expect.any(Object), // Check query structure if needed
        GROUP_NOT_CREATED
      );
      expect(prismaHelper.fromPrismaV2).toHaveBeenNthCalledWith(
        2,
        mockPrisma.membership.create,
        expect.objectContaining({
          data: {
            groupId: mockGroup.id,
            userId: 'user1',
            permission: PermissionType.ADMIN,
          },
        }),
        MEMBERSHIP_NOT_CREATED
      );
      expect(prismaHelper.fromPrismaV2).toHaveBeenNthCalledWith(
        3,
        mockPrisma.container.create,
        expect.objectContaining({
          data: {
            name: 'Test Container',
            ownerId: 'user1',
            groupId: mockGroup.id,
            type: ContainerType.FOLDER,
            shareOnly: false,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            // parentId is implicitly excluded when null
          },
        }),
        CONTAINER_NOT_CREATED
      );

      // Check the final result
      expect(result).toEqual(mockContainer);
    });

    it('should create a container with a parentId', async () => {
      const mockGroup = { id: 'group2' };
      const mockMembership = { id: 'mem2' };
      const mockContainer = { id: 'container2', parentId: 'parent1' };

      vi.mocked(prismaHelper.fromPrismaV2)
        .mockResolvedValueOnce(mockGroup)
        .mockResolvedValueOnce(mockMembership)
        .mockResolvedValueOnce(mockContainer);

      await createContainer(
        'Child Container',
        'user2',
        ContainerType.FOLDER,
        'parent1',
        false
      );

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(3);
      // Check the third call specifically for parentId
      expect(prismaHelper.fromPrismaV2).toHaveBeenNthCalledWith(
        3,
        mockPrisma.container.create,
        expect.objectContaining({
          data: expect.objectContaining({
            parentId: 'parent1',
          }),
        }),
        CONTAINER_NOT_CREATED
      );
    });

    it('should throw GROUP_NOT_CREATED if group creation fails', async () => {
      // Mock the first call to fromPrismaV2 to reject
      vi.mocked(prismaHelper.fromPrismaV2).mockRejectedValueOnce(
        GROUP_NOT_CREATED
      );

      await expect(
        createContainer('Test', 'user1', ContainerType.FOLDER, null, false)
      ).rejects.toThrow(GROUP_NOT_CREATED);

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(1);
      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledWith(
        mockPrisma.group.create,
        expect.any(Object),
        GROUP_NOT_CREATED
      );
    });

    it('should throw MEMBERSHIP_NOT_CREATED if membership creation fails', async () => {
      const mockGroup = { id: 'group3' };
      // Mock the first call to resolve, the second to reject
      vi.mocked(prismaHelper.fromPrismaV2)
        .mockResolvedValueOnce(mockGroup)
        .mockRejectedValueOnce(MEMBERSHIP_NOT_CREATED);

      await expect(
        createContainer('Test', 'user1', ContainerType.FOLDER, null, false)
      ).rejects.toThrow(MEMBERSHIP_NOT_CREATED);

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(2);
      expect(prismaHelper.fromPrismaV2).toHaveBeenNthCalledWith(
        2,
        mockPrisma.membership.create,
        expect.any(Object),
        MEMBERSHIP_NOT_CREATED
      );
    });

    it('should throw CONTAINER_NOT_CREATED if container creation fails', async () => {
      const mockGroup = { id: 'group4' };
      const mockMembership = { id: 'mem4' };
      // Mock first two calls to resolve, the third to reject
      vi.mocked(prismaHelper.fromPrismaV2)
        .mockResolvedValueOnce(mockGroup)
        .mockResolvedValueOnce(mockMembership)
        .mockRejectedValueOnce(CONTAINER_NOT_CREATED);

      await expect(
        createContainer('Test', 'user1', ContainerType.FOLDER, null, false)
      ).rejects.toThrow(CONTAINER_NOT_CREATED);

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(3);
      expect(prismaHelper.fromPrismaV2).toHaveBeenNthCalledWith(
        3,
        mockPrisma.container.create,
        expect.any(Object),
        CONTAINER_NOT_CREATED
      );
    });
  });

  describe('getItemsInContainer', () => {
    it('should retrieve container items and children', async () => {
      const mockContainerData = { id: 'c1', children: [], items: [] };
      // Mock fromPrismaV2 for findUniqueOrThrow
      vi.mocked(prismaHelper.fromPrismaV2).mockResolvedValueOnce(
        mockContainerData
      );

      const result = await getItemsInContainer('c1');

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(1);
      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledWith(
        mockPrisma.container.findUniqueOrThrow,
        {
          where: { id: 'c1' },
          include: expect.objectContaining({
            // Check specific includes if necessary
            children: expect.any(Object),
            items: expect.any(Object),
          }),
        },
        CONTAINER_NOT_FOUND
      );
      expect(result).toEqual(mockContainerData);
    });

    it('should throw CONTAINER_NOT_FOUND if container does not exist', async () => {
      // Mock fromPrismaV2 to reject
      vi.mocked(prismaHelper.fromPrismaV2).mockRejectedValueOnce(
        CONTAINER_NOT_FOUND
      );

      await expect(getItemsInContainer('nonexistent')).rejects.toThrow(
        CONTAINER_NOT_FOUND
      );

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(1);
      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledWith(
        mockPrisma.container.findUniqueOrThrow,
        expect.any(Object),
        CONTAINER_NOT_FOUND
      );
    });
  });

  describe('getContainerWithAncestors', () => {
    // Need to reset mocks specifically for recursive calls
    beforeEach(() => {
      vi.mocked(prismaHelper.fromPrismaV2).mockReset(); // Reset call counts and implementations
    });

    it('should return the container without parent if parentId is null', async () => {
      const mockContainer = { id: 'c1', parentId: null, name: 'Root' };
      // Mock the single call needed
      vi.mocked(prismaHelper.fromPrismaV2).mockResolvedValueOnce(mockContainer);

      const result = await getContainerWithAncestors('c1');

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(1);
      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledWith(
        mockPrisma.container.findUniqueOrThrow,
        { where: { id: 'c1' } },
        CONTAINER_NOT_FOUND
      );
      expect(result).toEqual(mockContainer);
      expect(result).not.toHaveProperty('parent');
    });

    it('should recursively fetch ancestors', async () => {
      const mockChild = { id: 'c2', parentId: 'c1', name: 'Child' };
      const mockParent = { id: 'c1', parentId: null, name: 'Parent' };

      // Mock the sequence of calls for recursion
      vi.mocked(prismaHelper.fromPrismaV2)
        .mockResolvedValueOnce(mockChild) // First call for 'c2'
        .mockResolvedValueOnce(mockParent); // Second call for 'c1' (parent)

      const result = await getContainerWithAncestors('c2');

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(2);
      // Check first call (for child 'c2')
      expect(prismaHelper.fromPrismaV2).toHaveBeenNthCalledWith(
        1,
        mockPrisma.container.findUniqueOrThrow,
        { where: { id: 'c2' } },
        CONTAINER_NOT_FOUND
      );
      // Check second call (recursive, for parent 'c1')
      expect(prismaHelper.fromPrismaV2).toHaveBeenNthCalledWith(
        2,
        mockPrisma.container.findUniqueOrThrow,
        { where: { id: 'c1' } },
        CONTAINER_NOT_FOUND
      );
      // Check the final structure
      expect(result).toEqual({ ...mockChild, parent: mockParent });
    });

    it('should throw CONTAINER_NOT_FOUND if initial container is not found', async () => {
      // Mock the first call to reject
      vi.mocked(prismaHelper.fromPrismaV2).mockRejectedValueOnce(
        CONTAINER_NOT_FOUND
      );

      await expect(getContainerWithAncestors('nonexistent')).rejects.toThrow(
        CONTAINER_NOT_FOUND
      );

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(1);
    });

    it('should throw CONTAINER_NOT_FOUND if an ancestor is not found', async () => {
      const mockChild = { id: 'c2', parentId: 'c1', name: 'Child' };
      // Mock the first call to resolve, the second (recursive) to reject
      vi.mocked(prismaHelper.fromPrismaV2)
        .mockResolvedValueOnce(mockChild)
        .mockRejectedValueOnce(CONTAINER_NOT_FOUND);

      await expect(getContainerWithAncestors('c2')).rejects.toThrow(
        CONTAINER_NOT_FOUND
      );

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(2);
      expect(prismaHelper.fromPrismaV2).toHaveBeenNthCalledWith(
        2, // Check the second call (for the parent)
        mockPrisma.container.findUniqueOrThrow,
        { where: { id: 'c1' } },
        CONTAINER_NOT_FOUND
      );
    });
  });

  describe('getAccessLinksForContainer', () => {
    it('should return flattened access links for a container', async () => {
      const mockSharesResult = [
        {
          accessLinks: [
            {
              id: 'link1',
              expiryDate: null,
              passwordHash: null,
              locked: false,
            },
          ],
        },
        {
          accessLinks: [
            {
              id: 'link2',
              expiryDate: new Date(),
              passwordHash: 'hash123',
              locked: true,
            },
          ],
        },
        { accessLinks: [] }, // Share with no links
      ];
      // Mock the call to fromPrismaV2 for share.findMany
      vi.mocked(prismaHelper.fromPrismaV2).mockResolvedValueOnce(
        mockSharesResult
      );

      const result = await getAccessLinksForContainer('c1');

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(1);
      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledWith(
        mockPrisma.share.findMany,
        {
          where: { containerId: 'c1' },
          select: {
            accessLinks: {
              select: {
                id: true,
                expiryDate: true,
                passwordHash: true,
                locked: true,
              },
            },
          },
        }
        // No error specified for findMany in the original code, so no error arg here
      );
      expect(result).toEqual([
        { id: 'link1', expiryDate: null, passwordHash: null, locked: false },
        {
          id: 'link2#hash123', // Check transformation
          expiryDate: expect.any(Date),
          passwordHash: 'hash123',
          locked: true,
        },
      ]);
    });

    it('should return an empty array if no shares are found', async () => {
      vi.mocked(prismaHelper.fromPrismaV2).mockResolvedValueOnce([]); // Mock empty array result
      const result = await getAccessLinksForContainer('c1');
      expect(result).toEqual([]);
      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if shares have no access links', async () => {
      const mockShares = [{ accessLinks: [] }, { accessLinks: [] }];
      vi.mocked(prismaHelper.fromPrismaV2).mockResolvedValueOnce(mockShares);
      const result = await getAccessLinksForContainer('c1');
      expect(result).toEqual([]);
      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during share fetching', async () => {
      const dbError = new Error('DB error');
      // Mock fromPrismaV2 to reject
      vi.mocked(prismaHelper.fromPrismaV2).mockRejectedValueOnce(dbError);

      await expect(getAccessLinksForContainer('c1')).rejects.toThrow(dbError);
      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateContainerName', () => {
    it('should update the container name and updatedAt timestamp', async () => {
      const updatedContainer = {
        id: 'c1',
        name: 'New Name',
        updatedAt: new Date(), // The actual function creates a new Date
      };
      // Mock fromPrismaV2 for container.update
      vi.mocked(prismaHelper.fromPrismaV2).mockResolvedValueOnce(
        updatedContainer
      );

      const result = await updateContainerName('c1', 'New Name');

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(1);
      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledWith(
        mockPrisma.container.update,
        {
          where: { id: 'c1' },
          data: {
            name: 'New Name',
            updatedAt: expect.any(Date), // Check that a date is being set
          },
        },
        CONTAINER_NOT_UPDATED
      );
      expect(result).toEqual(updatedContainer);
      // Optional: Check if the date is recent (adjust tolerance as needed)
      expect(result.updatedAt.getTime()).toBeCloseTo(new Date().getTime(), -2); // within ~100ms
    });

    it('should throw CONTAINER_NOT_UPDATED if update fails', async () => {
      // Mock fromPrismaV2 to reject
      vi.mocked(prismaHelper.fromPrismaV2).mockRejectedValueOnce(
        CONTAINER_NOT_UPDATED
      );

      await expect(updateContainerName('c1', 'New Name')).rejects.toThrow(
        CONTAINER_NOT_UPDATED
      );

      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledTimes(1);
      expect(prismaHelper.fromPrismaV2).toHaveBeenCalledWith(
        mockPrisma.container.update,
        expect.any(Object),
        CONTAINER_NOT_UPDATED
      );
    });
  });
});
