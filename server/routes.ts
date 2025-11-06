import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketManager } from "./websocket";
import { 
  generateKeyPair, 
  encryptData, 
  decryptData, 
  getKeyFingerprint,
  encodeBase64,
  decodeBase64 
} from "./crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wsManager = new WebSocketManager(httpServer);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // User registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Check if user exists
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ error: "Username already taken" });
      }

      // Generate quantum-resistant keypair
      const keypair = generateKeyPair();
      
      // Create user (password should be hashed in production)
      const user = await storage.createUser({ username, password });
      
      // Store public key
      await storage.updateUserPublicKey(user.id, encodeBase64(keypair.publicKey));

      res.json({
        user: {
          id: user.id,
          username: user.username,
          publicKey: encodeBase64(keypair.publicKey),
          fingerprint: getKeyFingerprint(keypair.publicKey),
        },
        secretKey: encodeBase64(keypair.secretKey),
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // User login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          publicKey: user.publicKey,
          fingerprint: user.publicKey ? getKeyFingerprint(decodeBase64(user.publicKey)) : null,
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        publicKey: user.publicKey,
        fingerprint: user.publicKey ? getKeyFingerprint(decodeBase64(user.publicKey)) : null,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Create room
  app.post("/api/rooms", async (req, res) => {
    try {
      const { name, isGroup, members } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Room name required" });
      }

      const room = await storage.createRoom({ name, isGroup: isGroup || false });

      // Add members
      if (members && Array.isArray(members)) {
        for (const member of members) {
          await storage.addRoomMember(room.id, member.userId, member.publicKey);
        }
      }

      res.json(room);
    } catch (error) {
      console.error("Create room error:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  // Get user's rooms
  app.get("/api/users/:userId/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRoomsByUser(req.params.userId);
      res.json(rooms);
    } catch (error) {
      console.error("Get rooms error:", error);
      res.status(500).json({ error: "Failed to get rooms" });
    }
  });

  // Get room messages
  app.get("/api/rooms/:roomId/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const messages = await storage.getMessagesByRoom(req.params.roomId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Get direct messages between two users
  app.get("/api/users/:userId1/messages/:userId2", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const messages = await storage.getMessagesBetweenUsers(
        req.params.userId1,
        req.params.userId2,
        limit
      );
      res.json(messages);
    } catch (error) {
      console.error("Get direct messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Upload document
  app.post("/api/documents", async (req, res) => {
    try {
      const { name, uploaderId, roomId, content, recipientPublicKey, mimeType, size } = req.body;

      if (!name || !uploaderId || !content || !recipientPublicKey) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Encrypt document with quantum-resistant encryption
      const contentBuffer = Buffer.from(content, 'base64');
      const publicKey = decodeBase64(recipientPublicKey);
      const encrypted = encryptData(contentBuffer, publicKey);

      const document = await storage.createDocument({
        name,
        uploaderId,
        roomId: roomId || null,
        encryptedContent: encodeBase64(encrypted.ciphertext),
        encapsulatedKey: encodeBase64(encrypted.encapsulatedKey),
        nonce: encodeBase64(encrypted.nonce),
        mimeType: mimeType || null,
        size: size || null,
      });

      res.json(document);
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Get document
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ error: "Failed to get document" });
    }
  });

  // Get room documents
  app.get("/api/rooms/:roomId/documents", async (req, res) => {
    try {
      const documents = await storage.getDocumentsByRoom(req.params.roomId);
      res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Decrypt document endpoint (requires secret key)
  app.post("/api/documents/:id/decrypt", async (req, res) => {
    try {
      const { secretKey } = req.body;
      
      if (!secretKey) {
        return res.status(400).json({ error: "Secret key required" });
      }

      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const encrypted = {
        ciphertext: decodeBase64(document.encryptedContent),
        encapsulatedKey: decodeBase64(document.encapsulatedKey),
        nonce: decodeBase64(document.nonce),
      };

      const decrypted = decryptData(encrypted, decodeBase64(secretKey));
      
      res.json({
        name: document.name,
        mimeType: document.mimeType,
        content: encodeBase64(decrypted),
      });
    } catch (error) {
      console.error("Decrypt document error:", error);
      res.status(500).json({ error: "Failed to decrypt document" });
    }
  });

  // Generate new keypair
  app.post("/api/crypto/generate-keypair", (_req, res) => {
    try {
      const keypair = generateKeyPair();
      res.json({
        publicKey: encodeBase64(keypair.publicKey),
        secretKey: encodeBase64(keypair.secretKey),
        fingerprint: getKeyFingerprint(keypair.publicKey),
      });
    } catch (error) {
      console.error("Generate keypair error:", error);
      res.status(500).json({ error: "Failed to generate keypair" });
    }
  });

  return httpServer;
}
