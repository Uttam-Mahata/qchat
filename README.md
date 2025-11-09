# QChat - Quantum-Resistant Secure Chat Application

A modern, real-time chat application featuring post-quantum cryptography for secure messaging. Built with React, Express, and WebSocket technology, QChat provides end-to-end encrypted communication that's resistant to both classical and quantum computing attacks.

## Features

### Core Functionality
- **Real-time Messaging**: Instant message delivery using WebSocket connections
- **Direct & Group Chat**: Support for both one-on-one and group conversations
- **File Sharing**: Secure document upload and sharing with encryption
- **Room Management**: Create, join, and manage chat rooms with unique invite codes
- **User Authentication**: Secure registration and login with bcrypt password hashing

### Security Features
- **Post-Quantum Cryptography**: Implements ML-KEM-768 (FIPS 203) for quantum-resistant key exchange
- **End-to-End Encryption**: All messages and files are encrypted before transmission
- **Key Verification**: Visual key fingerprints for verifying user identities
- **Secure Password Storage**: Passwords hashed with bcrypt (10 salt rounds)
- **Encrypted Document Storage**: Files stored with quantum-resistant encryption

### User Experience
- **Modern UI**: Built with React and Radix UI components
- **Dark/Light Theme**: Customizable theme support
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Notifications**: Instant message notifications via WebSocket
- **Message Attachments**: Support for images, PDFs, documents, and more

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching and caching
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **WebSocket (ws)** - Real-time communication
- **Drizzle ORM** - Type-safe database queries
- **TypeScript** - Type safety

### Database
- **SQLite** (Development) - Local file-based database
- **PostgreSQL/Neon** (Production) - Cloud-hosted database

### Cryptography
- **@noble/post-quantum** - ML-KEM-768 implementation
- **@noble/hashes** - Cryptographic hash functions
- **bcrypt** - Password hashing

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Clone the Repository
```bash
git clone <repository-url>
cd qchat
```

### Install Dependencies
```bash
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Optional: PostgreSQL connection string for production
DATABASE_URL=postgresql://user:password@host/database

# Server configuration
PORT=5000
NODE_ENV=development
```

**Note**: If `DATABASE_URL` is not set, the application will use SQLite (`qchat.db`) for local development.

### Database Setup

Push the database schema:
```bash
npm run db:push
```

## Usage

### Development Mode
```bash
npm run dev
```
The application will be available at `http://localhost:5000`

### Production Build
```bash
# Build the application
npm run build

# Start the production server
npm start
```

### Type Checking
```bash
npm run check
```

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response**: Returns user data with public key and secret key (store securely!)

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### Rooms

#### Create Room
```http
POST /api/rooms
Content-Type: application/json

{
  "name": "string",
  "isGroup": boolean,
  "ownerId": "string",
  "members": [{"userId": "string", "publicKey": "string"}]
}
```

#### Join Room with Code
```http
POST /api/rooms/join
Content-Type: application/json

{
  "code": "string",
  "userId": "string",
  "publicKey": "string"
}
```

#### Get User's Rooms
```http
GET /api/users/:userId/rooms
```

#### Get Room Members
```http
GET /api/rooms/:roomId/members
```

#### Update Room
```http
PATCH /api/rooms/:roomId
Content-Type: application/json

{
  "name": "string",
  "requestUserId": "string"
}
```

#### Delete Room
```http
DELETE /api/rooms/:roomId
Content-Type: application/json

{
  "requestUserId": "string"
}
```

### Messages

#### Get Room Messages
```http
GET /api/rooms/:roomId/messages?limit=100&userId=string
```

#### Send Message
```http
POST /api/messages
Content-Type: application/json

{
  "senderId": "string",
  "recipientId": "string",  // For direct messages
  "roomId": "string",        // For group messages
  "content": "string",
  "recipientPublicKey": "string"
}
```

#### Decrypt Message
```http
POST /api/messages/:id/decrypt
Content-Type: application/json

{
  "secretKey": "string"
}
```

#### Delete Message
```http
DELETE /api/messages/:id
Content-Type: application/json

{
  "requestUserId": "string"
}
```

### Documents

#### Upload Document
```http
POST /api/documents
Content-Type: application/json

{
  "name": "string",
  "uploaderId": "string",
  "roomId": "string",
  "content": "base64-encoded-string",
  "recipientPublicKey": "string",
  "mimeType": "string",
  "size": "string"
}
```

**File size limit**: 10MB
**Allowed MIME types**:
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`

#### Get Room Documents
```http
GET /api/rooms/:roomId/documents
```

#### Decrypt Document
```http
POST /api/documents/:id/decrypt
Content-Type: application/json

{
  "secretKey": "string"
}
```

### Cryptography

#### Generate Keypair
```http
POST /api/crypto/generate-keypair
```

Returns a new quantum-resistant keypair with fingerprint.

### WebSocket Events

Connect to WebSocket at `ws://localhost:5000`

**Client → Server Events:**
- `join_room`: Join a chat room
- `leave_room`: Leave a chat room
- `send_message`: Send a message

**Server → Client Events:**
- `message`: New message received
- `user_joined`: User joined a room
- `user_left`: User left a room

## Project Structure

```
qchat/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── ChatView.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── ...
│   │   ├── pages/           # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── AuthPage.tsx
│   │   │   └── ...
│   │   ├── lib/             # Utility functions
│   │   ├── hooks/           # Custom React hooks
│   │   └── main.tsx         # Application entry point
│   └── index.html
├── server/                   # Backend Express application
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route handlers
│   ├── websocket.ts        # WebSocket manager
│   ├── crypto.ts           # Cryptography functions
│   ├── db.ts               # Database configuration
│   ├── storage.ts          # Database operations
│   └── vite.ts             # Vite development server
├── shared/                  # Shared code between client/server
│   └── schema.ts           # Database schema definitions
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── drizzle.config.ts
```

## Security Architecture

### Quantum-Resistant Encryption

QChat implements the **ML-KEM-768** (Module-Lattice-Based Key-Encapsulation Mechanism) algorithm, standardized as FIPS 203, which provides security against both classical and quantum computer attacks.

**Encryption Flow:**
1. Each user generates an ML-KEM-768 keypair on registration
2. When sending a message:
   - Generate ephemeral shared secret using recipient's public key
   - Derive encryption key from shared secret using SHA-256
   - Encrypt message content with derived key
   - Store encrypted content, encapsulated key, and nonce
3. When receiving a message:
   - Decapsulate shared secret using recipient's private key
   - Derive decryption key
   - Decrypt message content

**Important Note**: The current implementation uses XOR encryption for demonstration purposes. For production use, this **must** be replaced with a proper AEAD cipher like AES-256-GCM or ChaCha20-Poly1305.

### Key Management

- **Private Keys**: Stored locally in browser localStorage (client-side only)
- **Public Keys**: Stored in database and shared with other users
- **Key Fingerprints**: SHA-256 hash of public keys for verification
- **Password Security**: Bcrypt hashing with 10 salt rounds

### Best Practices

1. **Never share your secret key** - It should remain in your browser's localStorage
2. **Verify key fingerprints** - Compare fingerprints when communicating with new users
3. **Use strong passwords** - Your password protects account access
4. **Backup your secret key** - Loss of secret key means permanent loss of message access
5. **HTTPS in production** - Always use HTTPS to prevent man-in-the-middle attacks

## Development

### Code Quality
```bash
# Type checking
npm run check

# Build the project
npm run build
```

### Database Management
```bash
# Push schema changes to database
npm run db:push
```

### Development Server Features
- Hot Module Replacement (HMR)
- TypeScript compilation
- Automatic server restart
- Source maps for debugging

## Production Deployment

### Environment Variables

Set the following environment variables in production:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host/database
```

### Build Process

1. Install dependencies:
   ```bash
   npm ci --production
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Push database schema:
   ```bash
   npm run db:push
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Deployment Platforms

The application can be deployed to:
- **Replit** - Configured with `.replit` file
- **Heroku** - Standard Node.js deployment
- **DigitalOcean App Platform** - Node.js app
- **Railway** - Node.js deployment
- **Render** - Web service deployment

### Database Hosting

For production PostgreSQL hosting, consider:
- **Neon** - Serverless PostgreSQL (recommended)
- **Supabase** - PostgreSQL with additional features
- **Railway** - PostgreSQL instances
- **Heroku Postgres** - Managed PostgreSQL

## Performance Considerations

- **WebSocket Connection Pooling**: Efficient real-time communication
- **Database Indexing**: Optimized queries on user IDs, room IDs, and timestamps
- **Message Pagination**: Limit queries to prevent memory issues
- **Batch Operations**: Bulk message creation for group chats
- **Connection Reuse**: HTTP server and WebSocket share the same port

## Security Warnings

1. **XOR Encryption**: The current symmetric encryption uses XOR for demonstration. **Replace with AES-256-GCM in production**.
2. **HTTPS Required**: Always use HTTPS in production to prevent interception
3. **Secret Key Storage**: Secret keys are stored in localStorage - consider more secure storage options
4. **Input Validation**: Always validate and sanitize user inputs
5. **Rate Limiting**: Implement rate limiting for API endpoints in production
6. **File Upload Validation**: File size and type validation is implemented but should be enhanced

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Modern browsers with WebSocket and ES6+ support required.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Replace XOR cipher with AES-256-GCM
- [ ] Implement message delivery receipts
- [ ] Add typing indicators
- [ ] Voice and video calling
- [ ] Message search functionality
- [ ] User presence status
- [ ] Message reactions
- [ ] Push notifications
- [ ] Mobile applications
- [ ] Rate limiting and DDoS protection
- [ ] Admin panel for user management
- [ ] Message retention policies
- [ ] Two-factor authentication

## License

MIT License - See LICENSE file for details

## Acknowledgments

- **@noble/post-quantum** - For the ML-KEM-768 implementation
- **Radix UI** - For accessible component primitives
- **Tailwind CSS** - For the utility-first CSS framework
- **Drizzle ORM** - For the type-safe database toolkit

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Built with post-quantum security in mind** 🔐
