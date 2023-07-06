import "dotenv/config";
import { Prisma, ItemType } from "@prisma/client";
import cors from "cors";
import express, { Request } from "express";
import WebSocket from "ws";
import {
  createUser,
  getUser,
  // getUserItems,
  createGroup,
  getGroupWithMembers,
  createGroupWithmembers,
  getGroupMembers,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
  addGroupItem,
  getGroup,
  getGroupItems,
  getItem,
  removeGroupItem,
  createItem,
  getUserByEmail,
  getItemsForUser,
  userExists,
} from "./models";
import wsHandler from "./lib/wsHandler";
import auth from "./lib/auth";
import pages from "./pages";
import metadata from "./api/metadata";
import download from "./api/download";
import password from "./api/password";

// TODO: move these to `config.ts`
const PORT = 8080;
const HOST = "0.0.0.0";
const WS_PATH = `/filemgr/ws`;

const ID_REGEX = "([0-9a-fA-F]{10,16})";

const wsServer = new WebSocket.Server({ noServer: true });
const app = express();

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Expose-Headers", "WWW-Authenticate");
  next();
});

// app.get("/api/", async (req, res) => {
//   res.status(200).json({ message: "ok computer" });
// });
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.status(200).send("echo");
});

app.get("/api/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Users ======================================================================
// Create a new user
// TODO: Could also create a group that includes the new user
app.post("/api/users", async (req, res) => {
  const { email }: { email: string } = req.body;
  try {
    const user = await createUser(email.trim().toLowerCase());
    res.status(201).json({
      message: "User created",
      user,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(400).json({
        message: "User already exists",
      });
    } else {
      res.status(500).json({
        message: "Server error.",
        error: error.message,
      });
      // res.status(404); // Not Found - if groupId or userId don't exist
    }
  }
});

app.post("/api/users/exist", async (req, res) => {
  const { email }: { email: string } = req.body;
  const count = await userExists(email);
  const exists = count === 1;
  res.status(exists ? 200 : 404).json({});
});

// "log in"
// TODO: require a bearer token or something like it.
app.post("/api/users/login", async (req, res) => {
  const { email } = req.body;
  console.log(`looking for user ${email}`);
  try {
    const user = await getUserByEmail(email);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).send();
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
});

// Get user info
app.get("/api/users/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await getUser(parseInt(userId));
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
});

// Items for all groups a user is in, excluding the items they sent.
app.get("/api/users/:userId/items", async (req, res) => {
  const { userId } = req.params;
  const type = req.query.type as ItemType;
  if (!(type in ItemType)) {
    return res.status(400).json({
      message: "Invalid Item Type: " + type,
    });
  }
  try {
    const items = await getItemsForUser(parseInt(userId), type);
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
});
// Will we ever need to delete or update a user?

// Groups ======================================================================
// Create a group
// TODO: Could also accept an existing user ID (or multiple IDs)
app.post("/api/groups", async (req, res) => {
  // Modify this so that I can pass in some email addresses in the body
  const { emailAddresses } = req.body;
  if (emailAddresses) {
    // console.log(`Creating group for a set of email addresses`);
    console.log(
      `👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿👿`
    );
    try {
      const existingGroup = await getGroupWithMembers(emailAddresses);
      let newGroup;

      if (!existingGroup) {
        newGroup = await createGroupWithmembers(emailAddresses);

        if (!newGroup) {
          return res.status(400).json({
            message: "Could not create group.",
          });
        }
      }

      return res.status(200).json({
        message: existingGroup ? "Group found." : "Group created.",
        group: existingGroup ? existingGroup : newGroup,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Server error.",
        error: error.message,
      });
    }
  } else {
    try {
      const group = await createGroup();
      res.status(201).json({
        message: "Group created.",
        group,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error.",
        error: error.message,
      });
    }
  }
});

// Get group details (basically member list)
app.get("/api/groups/:groupId", async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await getGroupMembers(parseInt(groupId));
    if (!group) {
      res.status(404).json({
        message: "Group not found.",
      });
      return;
    }
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
});

app.delete("/api/groups/:groupId", async (req, res) => {
  const { groupId } = req.params;
  try {
    const deleteResult = await deleteGroup(parseInt(groupId));

    res.status(204).json({
      message: "Group deleted.",
      deleteResult,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({
        message: "Group not found.",
      });
    } else {
      res.status(500).json({
        message: "Server error.",
        error: error.message,
      });
      // res.status(404); // Not Found
    }
  }
});

// Add a new member to a group
app.post("/api/groups/:groupId/members", async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    const groupUser = await addGroupMember(parseInt(groupId), parseInt(userId));
    res.status(201).json({
      message: "User added to group.",
      groupUser,
    });
  } catch (error) {
    //
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(400).json({
        message: "User is already a member, or provided IDs do not exist",
      });
    } else {
      res.status(500).json({
        message: "Server error.",
        error: error.message,
      });
      // res.status(404); // Not Found - if groupId or userId don't exist
    }
  }
});

// Remove an existing member
app.delete("/api/groups/:groupId/members/:userId", async (req, res) => {
  const { groupId, userId } = req.params;

  try {
    const deleteResult = await removeGroupMember(
      parseInt(groupId),
      parseInt(userId)
    );
    res.status(204).json({
      message: "User removed from group.",
      deleteResult,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({
        message: "Group member not found.",
      });
    } else {
      res.status(500).json({
        message: "Server error.",
        error: error.message,
      });
      // res.status(404); // Not Found - groupId or userId don't exist
    }
  }
});

// Items ======================================================================
// These add/remove items and their group associations to the database.
// Need additional code to remove the files from storage.

app.post("/api/items", async (req, res) => {
  const { url, metadata, sharedBy } = req.body;
  const type = req.query.type as ItemType;

  if (!(type in ItemType)) {
    return res.status(400).json({
      message: "Invalid Item Type: " + type,
    });
  }
  try {
    const item = await createItem(url, parseInt(sharedBy), type);
    res.status(201).json({
      message: "Item created",
      item,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(400).json({
        message: "Item with unique URL already exists.",
      });
    } else {
      console.log(error);
      res.status(500).json({
        message: "Server error.",
        error: error.message,
      });
    }
  }
});

// Associate an item with a group
app.post("/api/groups/:groupId/items/", async (req, res) => {
  const { groupId } = req.params;
  const { itemId } = req.body;

  try {
    const groupWithMembers = await getGroupMembers(parseInt(groupId));
    if (!groupWithMembers) {
      res.status(404).json({
        message: "Group not found.",
      });
      return;
    }

    const item = await getItem(parseInt(itemId));
    if (!item) {
      res.status(404).json({
        message: "Item not found.",
      });
      return;
    }

    const isOwnerMemberOfGroup =
      groupWithMembers.members.filter(({ user }) => user.id === item.sharedBy)
        .length === 1;
    console.log(`isOwnerMemberOfGroup? ${isOwnerMemberOfGroup}`);

    if (isOwnerMemberOfGroup) {
      console.log(`group id`, groupWithMembers.id);
      console.log(`item id`, item.id);
      const groupItem = await addGroupItem(groupWithMembers.id, item.id);
      res.status(201).json({
        message: "Item added to group.",
        groupItem,
      });
    }
  } catch (error) {
    console.log(error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(400).json({
        message: "Item already associated with group.",
      });
    } else {
      res.status(500).json({
        message: "Server error.",
        error: error.message,
      });
      // res.status(404); // Not Found - if groupId or userId don't exist
    }
  }
});

app.get("/api/groups/:groupId/items", async (req, res) => {
  const { groupId } = req.params;
  const type = req.query.type as ItemType;

  if (!(type in ItemType)) {
    return res.status(400).json({
      message: "Invalid Item Type: " + type,
    });
  }
  try {
    const items = await getGroupItems(parseInt(groupId), type);
    res.status(200).json(items);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
});

app.delete("/api/groups/:groupId/items/:itemId", async (req, res) => {
  const { groupId, itemId } = req.params;

  try {
    const group = await getGroup(parseInt(groupId));
    if (!group) {
      res.status(404).json({
        message: "Group not found.",
      });
      return;
    }

    const item = await getItem(parseInt(itemId));
    if (!item) {
      res.status(404).json({
        message: "Item not found.",
      });
      return;
    }
    const deleteResult = await removeGroupItem(group.id, item.id);
    res.status(204).json({
      message: "Item removed from group.",
      deleteResult,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
});

app.get(`/download/:id${ID_REGEX}`, pages.download);
app.get(`/filemgr/metadata/:id${ID_REGEX}`, auth.hmac, metadata);
// app.get(`/api/download/:id${ID_REGEX}`, auth.hmac, download);
// ^^ unsure if I need this one
app.get(`/filemgr/download/blob/:id${ID_REGEX}`, auth.hmac, download);
app.post(`/filemgr/password/:id${ID_REGEX}`, auth.owner, password);

app.get(`*`, (req, res) => {
  res.status(404);
});

const server = app.listen(PORT, HOST, () =>
  console.log(`🚀 Server ready at: http://${HOST}:${PORT}`)
);

// Listen for WebSocket connections
server.on("upgrade", (req, socket, head) => {
  console.log("got the upgrade request");
  if (req.url === WS_PATH) {
    console.log(`upgrading ${WS_PATH}`);
    wsServer.handleUpgrade(req, socket, head, (ws) => {
      console.log("handling upgrade");
      wsServer.emit("connection", ws, req);
      wsHandler(ws, req);
    });
  }
});
