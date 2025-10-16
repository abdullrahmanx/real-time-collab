#  Real-Time Collaborative Document Editor

A powerful real-time collaborative document editing platform built with Node.js, Express, Socket.io, and MongoDB. This application enables multiple users to work on documents simultaneously with live updates, version control, and granular permission management.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-brightgreen)](https://www.mongodb.com/)

##  Features

###  Authentication & Security
- **JWT-based authentication** with access and refresh tokens
- **Email verification** system with expiring verification links
- **Password reset** functionality via email
- **Rate limiting** to prevent abuse
- **Security middleware**: Helmet, XSS protection, MongoDB sanitization, HPP protection
- **Data compression** for optimized performance

###  Document Management
- **Real-time collaborative editing** with Socket.io
- **Live user presence** - see who's editing in real-time
- **Document versioning** - track all changes with version history
- **Rich text content** support (structured JSON format)
- **Auto-save functionality**
- **Document metadata**: word count, character count, read time
- **Status management**: Draft, Published, Archived
- **Search and filtering** capabilities
- **Pagination** for large document sets

###  Workspace & Collaboration
- **Workspace management** with role-based permissions
- **Folder organization** for documents
- **Granular permissions**: View, Comment, Edit access levels
- **Member management**: Owner, Admin, Editor, Viewer roles
- **Team collaboration** features

###  File Management
- **File upload** with Cloudinary integration
- **Avatar support** for user profiles
- **Document attachments** capability

###  Permission System
- **Document-level permissions**: canView, canComment, canEdit
- **Workspace-level roles**: Owner (4), Admin (3), Editor (2), Viewer (1)
- **Creator privileges** for document owners
- **Public/private document** support

##  Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer (Mailtrap for development)
- **File Upload**: Multer + Cloudinary
- **Validation**: Joi + Validator.js

### Security & Middleware
- **helmet**: Security headers
- **express-rate-limit**: API rate limiting
- **express-mongo-sanitize**: NoSQL injection prevention
- **xss-clean**: XSS attack prevention
- **hpp**: HTTP Parameter Pollution prevention
- **cors**: Cross-Origin Resource Sharing
- **compression**: Response compression

##  Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Abdullrahmanx/real-time-collab.git
   cd real-time-collab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory (see `.env.example`):
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_ACCESS=your_jwt_access_secret
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   
   # Email (Mailtrap for dev)
   MAILTRAP_HOST=sandbox.smtp.mailtrap.io
   MAILTRAP_PORT=2525
   MAILTRAP_USER=your_mailtrap_user
   MAILTRAP_PASS=your_mailtrap_password
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Build the project** (optional for TypeScript compilation)
   ```bash
   npm run build
   ```

5. **Run the development server**
   ```bash
   npm start
   ```

   The server will start on `http://localhost:3000`

##  Usage

### Development Mode
```bash
npm start          # Run with nodemon (auto-restart)
npm run dev        # Run with ts-node
```

### Production Mode
```bash
npm run build      # Compile TypeScript
npm run prod       # Run compiled JavaScript
```

##  API Documentation

See [API_DOCS.md](./API_DOCS.md) for detailed API endpoint documentation.

### Quick Overview

#### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/verify-email/:token` - Verify email
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password/:token` - Reset password

#### Workspace Endpoints
- `POST /workspaces` - Create workspace
- `GET /workspaces` - Get all workspaces
- `GET /workspaces/:id` - Get workspace by ID
- `PUT /workspaces/:id` - Update workspace
- `DELETE /workspaces/:id` - Delete workspace
- `POST /workspaces/:id/members` - Add member
- `DELETE /workspaces/:id/members/:userId` - Remove member

#### Document Endpoints
- `POST /workspaces/:workspaceId/documents` - Create document
- `GET /workspaces/:workspaceId/documents` - Get all documents
- `GET /workspaces/:workspaceId/documents/:id` - Get document
- `PUT /workspaces/:workspaceId/documents/:id` - Update document
- `DELETE /workspaces/:workspaceId/documents/:id` - Delete document

#### Folder Endpoints
- `POST /workspaces/:workspaceId/folders` - Create folder
- `GET /workspaces/:workspaceId/folders` - Get all folders
- `PUT /workspaces/:workspaceId/folders/:id` - Update folder
- `DELETE /workspaces/:workspaceId/folders/:id` - Delete folder

### Socket.io Events

#### Client → Server
- `join-document` - Join a document room
- `edit-document` - Send document edits
- `save-document` - Save document changes
- `leave-document` - Leave document room

#### Server → Client
- `document-members` - Current active members
- `user-joined` - User joined notification
- `user-left` - User left notification
- `edit` - Real-time edit updates
- `document-saved` - Save confirmation
- `save-success` - Save success with version
- `error` - Error notifications

##  Project Structure

```
real-time-collab/
├── src/
│   ├── controllers/       # Route controllers
│   │   ├── authController.ts
│   │   ├── documentController.ts
│   │   ├── documentVersionController.ts
│   │   ├── folderController.ts
│   │   └── workspaceController.ts
│   ├── middlewares/       # Express middlewares
│   │   ├── authMiddleware.ts
│   │   ├── documentValidation.ts
│   │   ├── errorHandler.ts
│   │   ├── folderValdiation.ts
│   │   ├── rateLimit.ts
│   │   ├── upload.ts
│   │   ├── userValidation.ts
│   │   └── workspaceValidation.ts
│   ├── models/           # Mongoose schemas
│   │   ├── documentSchema.ts
│   │   ├── documentVersion.ts
│   │   ├── folderSchema.ts
│   │   ├── userSchema.ts
│   │   └── workspaceSchema.ts
│   ├── routes/           # API routes
│   │   ├── authRoutes.ts
│   │   ├── documentRoutes.ts
│   │   ├── folderRoutes.ts
│   │   └── workspaceRoutes.ts
│   ├── socket/           # Socket.io logic
│   │   └── indexSocket.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   └── email.ts
│   └── server.ts         # Entry point
├── .env                  # Environment variables (not in git)
├── .env.example          # Example environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

##  Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Rate Limiting**: Prevents brute force attacks
- **Helmet**: Sets security HTTP headers
- **XSS Protection**: Sanitizes user input
- **NoSQL Injection Prevention**: MongoDB sanitization
- **CORS**: Controlled cross-origin requests
- **HPP Protection**: Prevents HTTP parameter pollution
- **Email Verification**: Ensures valid user emails

##  Testing

```bash
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT refresh token secret | Yes |
| `JWT_ACCESS` | JWT access token secret | Yes |
| `FRONTEND_URL` | Frontend application URL | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `MAILTRAP_HOST` | Email service host | Yes |
| `MAILTRAP_PORT` | Email service port | Yes |
| `MAILTRAP_USER` | Email service username | Yes |
| `MAILTRAP_PASS` | Email service password | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |



##  Acknowledgments

- Socket.io for real-time functionality
- MongoDB for flexible document storage
- Express.js for robust API framework
- The open-source community

## � Author

**Abdullrahmanx**
- GitHub: [@Abdullrahmanx](https://github.com/Abdullrahmanx)
- Project Link: [Real-Time Collab](https://github.com/Abdullrahmanx/real-time-collab)

## �📸 Screenshots

_Screenshots coming soon - project ready for deployment_

##  Future Enhancements

- [ ] Real-time cursor tracking
- [ ] Comment threads on documents
- [ ] Export documents (PDF, DOCX)
- [ ] Document templates
- [ ] Advanced search with filters
- [ ] Activity feed/audit logs
- [ ] Mobile app
- [ ] Offline mode with sync
- [ ] Integration with third-party services (Google Drive, Dropbox)

---

⭐ If you found this project helpful, please give it a star!
