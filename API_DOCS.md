#  API Documentation

Base URL: `http://localhost:3000`

All endpoints return JSON responses with the following structure:
```json
{
  "success": true | false,
  "message": "Description message",
  "data": { /* Response data */ }
}
```

##  Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 📋 Table of Contents
- [Authentication Endpoints](#authentication-endpoints)
- [User Profile Endpoints](#user-profile-endpoints)
- [Workspace Endpoints](#workspace-endpoints)
- [Document Endpoints](#document-endpoints)
- [Folder Endpoints](#folder-endpoints)
- [Socket.io Events](#socketio-events)

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Validation:**
- `name`: Min 3 characters
- `email`: Valid email format
- `password`: Min 8 characters

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null,
      "createdAt": "2025-10-17T10:00:00.000Z",
      "updatedAt": "2025-10-17T10:00:00.000Z"
    },
    "token": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": "15m"
    }
  }
}
```

---

### Verify Email
**POST** `/auth/verify-email/:token`

Verify user email with token sent to email.

**URL Parameters:**
- `token`: Email verification token

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### Resend Verification Email
**POST** `/auth/resend-verification`

Resend email verification link.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verification send successfully"
}
```

---

### Login
**POST** `/auth/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "avatar_url"
    }
  },
  "token": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

---

### Refresh Token
**POST** `/auth/refresh-token`

Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": {
      "accessToken": "new_access_token",
      "refreshToken": "new_refresh_token",
      "expiresIn": "15m"
    }
  }
}
```

---

### Forgot Password
**POST** `/auth/forgot-password`

Request password reset link via email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Reset link sent if email exists"
}
```

---

### Reset Password
**POST** `/auth/reset-password/:token`

Reset password using token from email.

**URL Parameters:**
- `token`: Password reset token

**Request Body:**
```json
{
  "newPassword": "newsecurepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful. Please login."
}
```

---

### Change Password
**POST** `/auth/change-password` 

Change password while logged in.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newsecurepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password change successful. Please login."
}
```

---

### Logout
**POST** `/auth/logout` 

Logout from current session.

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Logout All Sessions
**POST** `/auth/logout-all` 

Logout from all devices/sessions.

**Request Body:**
```json
{
  "refreshToken": "current_refresh_token",
  "keepCurrent": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

---

## User Profile Endpoints

### Get Profile
**GET** `/auth/profile` 

Get current user profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "avatar_url",
      "createdAt": "2025-10-17T10:00:00.000Z",
      "updatedAt": "2025-10-17T10:00:00.000Z"
    }
  }
}
```

---

### Update Profile
**PUT** `/auth/profile` 

Update user profile (name, email, avatar).

**Request Body (multipart/form-data):**
```
name: "Jane Doe"
email: "jane@example.com"
avatar: [file]
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user_id",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatar": "cloudinary_url",
    "emailVerified": false,
    "createdAt": "2025-10-17T10:00:00.000Z",
    "updatedAt": "2025-10-17T10:30:00.000Z"
  }
}
```

---

## Workspace Endpoints

### Create Workspace
**POST** `/workspaces` 

Create a new workspace.

**Request Body:**
```json
{
  "name": "My Workspace",
  "description": "Team collaboration space"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "workspace": {
      "_id": "workspace_id",
      "name": "My Workspace",
      "description": "Team collaboration space",
      "owner": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "members": [
        {
          "user": "user_id",
          "role": 4,
          "joinedAt": "2025-10-17T10:00:00.000Z"
        }
      ],
      "createdAt": "2025-10-17T10:00:00.000Z"
    }
  }
}
```

---

### Get All Workspaces
**GET** `/workspaces` 🔒

Get all workspaces user is a member of.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by name

**Response (200):**
```json
{
  "success": true,
  "data": {
    "workspaces": [
      {
        "_id": "workspace_id",
        "name": "My Workspace",
        "description": "Team collaboration space",
        "owner": { /* user object */ },
        "members": [ /* members array */ ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "prevPage": null,
      "nextPage": null
    }
  }
}
```

---

### Get Workspace by ID
**GET** `/workspaces/:id` 

Get specific workspace details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "workspace": {
      "_id": "workspace_id",
      "name": "My Workspace",
      "description": "Team collaboration space",
      "owner": { /* populated user */ },
      "members": [
        {
          "user": { /* populated user */ },
          "role": 4,
          "joinedAt": "2025-10-17T10:00:00.000Z"
        }
      ]
    }
  }
}
```

---

### Update Workspace
**PUT** `/workspaces/:id` 

Update workspace details (Owner/Admin only).

**Request Body:**
```json
{
  "name": "Updated Workspace Name",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workspace updated successfully",
  "data": {
    "workspace": { /* updated workspace object */ }
  }
}
```

---

### Delete Workspace
**DELETE** `/workspaces/:id` 

Delete workspace (Owner only).

**Response (204):**
No content

---

### Add Member to Workspace
**POST** `/workspaces/:id/members` 

Add a member to workspace (Admin+ only).

**Request Body:**
```json
{
  "email": "member@example.com",
  "role": 2
}
```

**Roles:**
- 1: Viewer
- 2: Editor
- 3: Admin
- 4: Owner

**Response (200):**
```json
{
  "success": true,
  "message": "Member added successfully",
  "data": {
    "workspace": { /* updated workspace */ }
  }
}
```

---

### Remove Member from Workspace
**DELETE** `/workspaces/:id/members/:userId` 

Remove a member (Admin+ only).

**Response (200):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

### Update Member Role
**PUT** `/workspaces/:id/members/:userId` 

Update member's role (Admin+ only).

**Request Body:**
```json
{
  "role": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Member role updated successfully"
}
```

---

## Document Endpoints

### Create Document
**POST** `/workspaces/:workspaceId/documents` 🔒

Create a new document in workspace.

**Request Body:**
```json
{
  "title": "Project Proposal",
  "folderId": "folder_id" // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Document created successfully",
  "data": {
    "document": {
      "_id": "document_id",
      "title": "Project Proposal",
      "content": { /* default content structure */ },
      "workspace": { /* populated workspace */ },
      "createdBy": { /* populated user */ },
      "version": 1,
      "status": "draft",
      "permissions": {
        "canEdit": ["user_id"],
        "canComment": ["user_id"],
        "canView": ["user_id"]
      }
    }
  }
}
```

---

### Get All Documents
**GET** `/workspaces/:workspaceId/documents` 🔒

Get all documents in a workspace with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by title
- `status`: Filter by status (draft/published/archived/all)
- `sortBy`: Sort field (createdAt/updatedAt/title)
- `sortOrder`: Sort order (asc/desc)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "_id": "document_id",
        "title": "Project Proposal",
        "workspace": { /* workspace info */ },
        "createdBy": { /* user info */ },
        "version": 1,
        "status": "draft",
        "metaData": {
          "wordCount": 250,
          "characterCount": 1500,
          "readTime": 2
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

---

### Get Document by ID
**GET** `/workspaces/:workspaceId/documents/:id` 🔒

Get specific document with full content.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "document": {
      "_id": "document_id",
      "title": "Project Proposal",
      "content": { /* full document content */ },
      "workspace": { /* populated */ },
      "createdBy": { /* populated */ },
      "lastEditedBy": { /* populated */ },
      "version": 5,
      "status": "draft",
      "permissions": {
        "canEdit": [ /* populated users */ ],
        "canComment": [ /* populated users */ ],
        "canView": [ /* populated users */ ]
      },
      "metaData": {
        "wordCount": 250,
        "characterCount": 1500,
        "readTime": 2
      }
    }
  }
}
```

---

### Update Document
**PUT** `/workspaces/:workspaceId/documents/:id` 🔒

Update document (requires edit permission).

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": { /* new content */ },
  "status": "published"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "document": { /* updated document */ },
    "newVersion": {
      "_id": "version_id",
      "document": "document_id",
      "version": 6,
      "createdBy": { /* user */ }
    }
  }
}
```

---

### Delete Document
**DELETE** `/workspaces/:workspaceId/documents/:id` 🔒

Delete document (creator or admin only).

**Response (204):**
No content

---

### Update Document Permissions
**PUT** `/workspaces/:workspaceId/documents/:id/permissions` 🔒

Update document permissions (creator or admin only).

**Request Body:**
```json
{
  "canView": ["user_id_1", "user_id_2"],
  "canEdit": ["user_id_1"],
  "canComment": ["user_id_1", "user_id_2"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Permissions updated successfully"
}
```

---

## Folder Endpoints

### Create Folder
**POST** `/workspaces/:workspaceId/folders` 🔒

Create a new folder in workspace.

**Request Body:**
```json
{
  "name": "Design Files",
  "parentFolder": "parent_folder_id" // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Folder created successfully",
  "data": {
    "folder": {
      "_id": "folder_id",
      "name": "Design Files",
      "workspace": "workspace_id",
      "parentFolder": null,
      "createdBy": { /* user */ }
    }
  }
}
```

---

### Get All Folders
**GET** `/workspaces/:workspaceId/folders` 🔒

Get all folders in workspace.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "_id": "folder_id",
        "name": "Design Files",
        "workspace": { /* workspace */ },
        "createdBy": { /* user */ }
      }
    ]
  }
}
```

---

### Update Folder
**PUT** `/workspaces/:workspaceId/folders/:id` 🔒

Update folder name or parent.

**Request Body:**
```json
{
  "name": "Updated Folder Name"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Folder updated successfully"
}
```

---

### Delete Folder
**DELETE** `/workspaces/:workspaceId/folders/:id` 🔒

Delete folder (creator or admin only).

**Response (204):**
No content

---

## Socket.io Events

### Connection

**Client connects with authentication:**
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_access_token'
  }
});
```

### Client → Server Events

#### Join Document
```javascript
socket.emit('join-document', {
  documentId: 'document_id',
  userName: 'John Doe',
  userAvatar: 'avatar_url'
});
```

**Server Response:**
```javascript
socket.on('document-members', ({ members }) => {
  // Array of current active users
});

socket.on('user-joined', ({ message, members }) => {
  // Notification when new user joins
});
```

---

#### Edit Document
```javascript
socket.emit('edit-document', {
  documentId: 'document_id',
  changes: { /* delta changes */ },
  position: { line: 5, column: 10 },
  content: { /* new content */ }
});
```

**Server Broadcast:**
```javascript
socket.on('edit', ({ userId, userName, position, changes, content }) => {
  // Real-time edit updates from other users
});
```

---

#### Save Document
```javascript
socket.emit('save-document', {
  documentId: 'document_id',
  content: { /* full content */ },
  title: 'Document Title' // optional
});
```

**Server Response:**
```javascript
socket.on('save-success', ({ message, version, timestamp }) => {
  // Confirmation of save
});

socket.on('document-saved', ({ savedBy, version }) => {
  // Notification to other users
});
```

---

#### Leave Document
```javascript
socket.emit('leave-document');
```

**Server Broadcast:**
```javascript
socket.on('user-left', ({ message, userId, members }) => {
  // User left notification
});
```

---

### Server → Client Events

#### Error
```javascript
socket.on('error', ({ message }) => {
  console.error(message);
});
```

#### Disconnect
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authorization header is required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You dont have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Auth endpoints**: 5 requests per 15 minutes per IP
- **Other endpoints**: 100 requests per 15 minutes per IP

When rate limit is exceeded:
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

---

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Get Workspaces (with auth)
```bash
curl -X GET http://localhost:3000/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Postman Collection

Import this collection structure into Postman for easy testing:

1. Create environment variables:
   - `base_url`: `http://localhost:3000`
   - `access_token`: (set after login)
   - `refresh_token`: (set after login)

2. Set authorization header automatically in collection settings

---

🔒 = Protected endpoint (requires authentication)
