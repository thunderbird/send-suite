import { PrismaClient, Prisma, ItemType } from "@prisma/client";
const prisma = new PrismaClient();

export async function createUser(email: string) {
  return prisma.user.create({
    data: {
      email,
    },
  });
}

export async function getUser(userId: number) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      groups: {
        select: {
          groupId: true,
        },
      },
      items: {
        select: {
          id: true,
        },
      },
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

export async function getItemsForUser(userId: number, type: ItemType) {
  const user = await getUser(userId);
  if (!user) {
    return null;
  }

  const { groups } = user;
  const groupIds = groups.map(({ groupId }) => groupId);

  const items = await prisma.item.findMany({
    where: {
      type,
      sharedBy: {
        not: userId,
      },
      groups: {
        some: {
          groupId: {
            in: groupIds,
          },
        },
      },
    },
  });
  return items;
}

// export async function getUserItems(userId: number) {
//   return prisma.item.findMany({
//     where: {
//       sharedBy: userId,
//     },
//   });
// }

export async function createGroup(data = {}) {
  return prisma.group.create({
    data,
  });
}

export async function getGroup(groupId: number) {
  return prisma.group.findUnique({
    where: {
      id: groupId,
    },
    select: {
      id: true,
    },
  });
}

export async function getGroupMembers(groupId: number) {
  return prisma.group.findUnique({
    where: {
      id: groupId,
    },
    include: {
      members: {
        select: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function createGroupWithmembers(emailAddresses = []) {
  if (emailAddresses.length === 0) {
    return null;
  }
  //
  const users = await prisma.user.findMany({
    where: {
      email: {
        mode: "insensitive",
        in: emailAddresses,
      },
    },
  });
  if (users.length < emailAddresses.length) {
    // for now, all users must exist
    console.log(`Not everyone is a user`);
    return null;
  }
  const group = await prisma.group.create({ data: {} });

  const connections = users.map((u) => ({
    groupId: group.id,
    userId: u.id,
  }));

  await prisma.groupUser.createMany({
    data: connections,
  });

  console.log(group);
  return group;
}

export async function getGroupWithMembers(emailAddresses = []) {
  if (emailAddresses.length === 0) {
    return null;
  }
  /*
  what if the users are members together in multiple groups?
  You want to avoid finding a group that has all of these members,
  BUT ALSO has other members.

  So, if you find multiple groups, you'll have to dig through each
  group and make sure the number of members is === emailAddresses.length
  */
  // First, get the ids for those email addresses
  const users = await prisma.user.findMany({
    where: {
      email: {
        mode: "insensitive",
        in: emailAddresses,
      },
    },
    include: {
      groups: true,
    },
  });

  // Not every email has a user.
  if (users.length !== emailAddresses.length) {
    return null;
  }

  // Get groups for each user; if any user has no groups, make note.
  let hasNoGroups = false;
  const groupsForEachUser = users.map(({ groups }) => {
    if (groups.length === 0) {
      hasNoGroups = true;
    }
    return groups.map(({ groupId }) => groupId);
  });

  // At least one user isn't in any groups.
  if (hasNoGroups) {
    return null;
  }

  // Find the groups the users have in common.
  let idsForGroupsInCommon = [];
  for (let i = 1; i < groupsForEachUser.length; i++) {
    let g1 = groupsForEachUser[i - 1];
    let g2 = groupsForEachUser[i];
    const common = g1.filter((g) => {
      // console.log(`🤡 checking if ${g} is in ${g2}`);
      // console.log(`does ${g2} include ${g}? ${g2.includes(g)}`);
      return g2.includes(g);
    });
    idsForGroupsInCommon = [...idsForGroupsInCommon, ...common];
  }

  // No groups in common.
  if (idsForGroupsInCommon.length === 0) {
    return null;
  }

  // Get the groups, and filter out any that have extra members.
  const possibleGroups = await prisma.group.findMany({
    where: {
      id: {
        in: idsForGroupsInCommon,
      },
    },
    include: {
      members: true,
    },
  });
  console.log(possibleGroups);
  const groups = possibleGroups.filter(
    ({ members }) => members.length === emailAddresses.length
  );

  // Bail if there isn't exactly one group.
  if (groups.length !== 1) {
    if (groups.length === 0) {
      return null;
    }
    console.log(`Seat's taken 🪑`);
    throw new Error("Multiple matching groups. Invalid database state.");
  }

  console.log(`⚔️⚔️⚔️ there can be only one ⚔️⚔️⚔️`);
  console.log(groups[0]);
  // console.log(users.map(({ groups }) => groups.map(({ groupId }) => groupId)));
  // const userIds = users.map((u) => u.id);
  return {
    id: groups[0].id,
  };
}

export async function deleteGroup(groupId: number) {
  // Remove group memberships
  await prisma.groupUser.deleteMany({
    where: {
      groupId,
    },
  });

  // Remove group items
  await prisma.groupItem.deleteMany({
    where: {
      groupId,
    },
  });

  // Delete the group
  return prisma.group.delete({
    where: {
      id: groupId,
    },
  });
}

export async function addGroupMember(groupId: number, userId: number) {
  return prisma.groupUser.create({
    data: {
      groupId,
      userId,
    },
  });
}

export async function removeGroupMember(groupId: number, userId: number) {
  return prisma.groupUser.delete({
    where: {
      groupId_userId: { groupId, userId },
    },
  });
}

export async function createItem(
  url: string,
  sharedBy: number,
  type: ItemType
) {
  return prisma.item.create({
    data: {
      url,
      sharedBy,
      type,
    },
  });
}

export async function addGroupItem(groupId: number, itemId: number) {
  return prisma.groupItem.create({
    data: {
      groupId,
      itemId,
    },
  });
}

export async function getGroupItems(groupId: number, type: ItemType) {
  return prisma.item.findMany({
    where: {
      type,
      groups: {
        some: {
          groupId,
        },
      },
    },
  });
}

export async function getItem(itemId: number) {
  return prisma.item.findUnique({
    where: {
      id: itemId,
    },
  });
}

export async function removeGroupItem(groupId: number, itemId: number) {
  return prisma.groupItem.delete({
    where: {
      groupId_itemId: { groupId, itemId },
    },
  });
}

// ===================================================================
// This is data previously stored in Redis
// Note: this Metadata pertains to uploads, not to Items.
// Because:
// - Every upload will have Metadata
// - But not every upload will be an Item shared by a User to a Group
export async function createUpload(
  id: string,
  owner: string,
  metadata: string,
  dlimit: number,
  auth: string,
  nonce: string,
  pwd?: boolean
) {
  return prisma.upload.create({
    data: {
      id,
      owner,
      metadata,
      dlimit,
      auth,
      nonce,
      pwd: !!pwd,
    },
  });
}

export async function getUpload(id: string) {
  return prisma.upload.findUnique({
    where: { id },
  });
}

export async function deleteUpload(id: string) {
  return prisma.upload.delete({
    where: {
      id,
    },
  });
}

export async function updateUpload(id: string, kv: Record<string, any>) {
  const data = {
    ...kv,
  };

  if (Object.keys(data).length === 0) {
    return;
  }
  return prisma.upload.update({
    where: { id },
    data,
  });
}
