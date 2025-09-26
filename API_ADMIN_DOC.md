# MyManga VN Admin API Documentation

## Overview

**Base URL**: `/api/admin`
**Authentication**: Bearer Token
**Content Type**: `application/json`

All admin endpoints require authentication except the login endpoint. The API uses throttle exemption for admin routes.

## Authentication

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "code": 200
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error message",
  "code": 400
}
```

### POST /api/admin/auth
Login to admin panel

**Request**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "1|abc123...",
    "type": "Bearer"
  }
}
```

### GET /api/admin/auth
Get admin profile

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "name": "Admin User",
    "email": "admin@example.com",
    "roles": ["admin"]
  }
}
```

### DELETE /api/admin/auth
Logout admin

**Headers**: `Authorization: Bearer {token}`

**Response**: `204 No Content`

## Users Management

**Permissions**: Admin only

### GET /api/admin/users
List all users

**Query Parameters**:
- `page` (int): Page number
- `per_page` (int): Items per page
- `sort` (string): Sort field
- `filter` (object): Filter criteria

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid-123",
        "name": "User Name",
        "email": "user@example.com",
        "created_at": "2024-01-01T00:00:00.000000Z"
      }
    ],
    "current_page": 1,
    "total": 100
  }
}
```

### GET /api/admin/users/{id}
Get user details

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "name": "User Name",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000000Z"
  }
}
```

### PUT /api/admin/users/{id}
Update user

**Request**:
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

### DELETE /api/admin/users/{id}/delete-comment
Delete user comment

**Response**: `200 OK`

## Manga Management

**Permissions**:
- `index`, `show`: All authenticated users
- `store`: All authenticated users
- `update`, `destroy`: Admin or owner

### GET /api/admin/mangas
List mangas

**Query Parameters**: Standard pagination and filtering

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid-123",
        "name": "Manga Title",
        "name_alt": "Alternative Title",
        "status": "ongoing",
        "cover": "https://example.com/cover.jpg",
        "is_reviewed": true,
        "created_at": "2024-01-01T00:00:00.000000Z"
      }
    ]
  }
}
```

### GET /api/admin/mangas/{id}
Get manga details

### POST /api/admin/mangas
Create new manga

**Request**:
```json
{
  "name": "Manga Title",
  "name_alt": "Alternative Title",
  "artist_id": "uuid-artist",
  "doujinshi_id": "uuid-doujinshi",
  "group_id": "uuid-group",
  "status": "ongoing",
  "cover": "image_file",
  "genres": [1, 2, 3]
}
```

**Validation Rules**:
- `name`: required, string, max:255
- `artist_id`: exists:artists,id
- `doujinshi_id`: exists:doujinshis,id
- `group_id`: exists:groups,id
- `cover`: file, mimes:jpg,png,webp, max:2048KB
- `genres`: array of numeric IDs

### PUT /api/admin/mangas/{id}
Update manga

### DELETE /api/admin/mangas/{id}
Delete manga

## Chapter Management

**Permissions**:
- `index`, `show`: Public access
- `store`: All authenticated users
- `update`, `destroy`, `addImage`, `clearImage`: Admin or owner
- `updateChapterOrder`, `deleteMany`: Admin only

### GET /api/admin/chapters
List chapters

### GET /api/admin/chapters/{id}
Get chapter details

### POST /api/admin/chapters
Create new chapter

**Request**:
```json
{
  "name": "Chapter 1",
  "order": 1,
  "manga_id": "uuid-manga"
}
```

**Validation Rules**:
- `name`: required, string, max:255
- `order`: numeric
- `manga_id`: required, uuid, exists:mangas,id

### PUT /api/admin/chapters/{id}
Update chapter

### DELETE /api/admin/chapters/{id}
Delete chapter

### DELETE /api/admin/chapters/{id}/clr-img
Clear chapter images

### PUT /api/admin/chapters/{id}/add-img
Add image to chapter

**Request**: `multipart/form-data`
- `image`: image file

### PUT /api/admin/chapters/chapters-order
Update chapter order

**Request**:
```json
{
  "chapters_order": [
    {"id": "uuid-1", "order": 1},
    {"id": "uuid-2", "order": 2}
  ]
}
```

### PUT /api/admin/chapters/delete-many
Delete multiple chapters

**Request**:
```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

## Genre Management

**Permissions**:
- `index`, `show`: Public access
- `store`, `update`, `destroy`: Admin only

### GET /api/admin/genres
List genres

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Action",
      "slug": "action",
      "created_at": "2024-01-01T00:00:00.000000Z"
    }
  ]
}
```

### GET /api/admin/genres/{id}
Get genre details

### POST /api/admin/genres
Create genre

**Request**:
```json
{
  "name": "New Genre",
  "slug": "new-genre"
}
```

### PUT /api/admin/genres/{id}
Update genre

### DELETE /api/admin/genres/{id}
Delete genre

## Artist Management

**Permissions**: Admin or owner for update/delete

### GET /api/admin/artists
List artists

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "name": "Artist Name",
      "created_at": "2024-01-01T00:00:00.000000Z"
    }
  ]
}
```

### GET /api/admin/artists/{id}
Get artist details

### POST /api/admin/artists
Create artist

**Request**:
```json
{
  "name": "Artist Name"
}
```

### PUT /api/admin/artists/{id}
Update artist

### DELETE /api/admin/artists/{id}
Delete artist

## Group Management

**Permissions**: Admin or owner for update/delete

### GET /api/admin/groups
List groups

### GET /api/admin/groups/{id}
Get group details

### POST /api/admin/groups
Create group

**Request**:
```json
{
  "name": "Scanlation Group"
}
```

### PUT /api/admin/groups/{id}
Update group

### DELETE /api/admin/groups/{id}
Delete group

## Doujinshi Management

**Permissions**: Admin or owner for update/delete

### GET /api/admin/doujinshis
List doujinshis

### GET /api/admin/doujinshis/{id}
Get doujinshi details

### POST /api/admin/doujinshis
Create doujinshi

### PUT /api/admin/doujinshis/{id}
Update doujinshi

### DELETE /api/admin/doujinshis/{id}
Delete doujinshi

## Comment Management

**Permissions**: Admin only for delete

### GET /api/admin/comments
List comments

### GET /api/admin/comments/{id}
Get comment details

### POST /api/admin/comments
Create comment

### PUT /api/admin/comments/{id}
Update comment

### DELETE /api/admin/comments/{id}
Delete comment

## Achievement Management

**Permissions**: Admin or owner for update/delete

### GET /api/admin/achievements
List achievements

### GET /api/admin/achievements/{id}
Get achievement details

### POST /api/admin/achievements
Create achievement

### PUT /api/admin/achievements/{id}
Update achievement

### DELETE /api/admin/achievements/{id}
Delete achievement

## Pet Management

**Permissions**: Admin or owner for update/delete

### GET /api/admin/pets
List pets

### GET /api/admin/pets/{id}
Get pet details

### POST /api/admin/pets
Create pet

### PUT /api/admin/pets/{id}
Update pet

### DELETE /api/admin/pets/{id}
Delete pet

## Static/System Management

### GET /api/admin/statics/basic
Get basic statistics

**Response**:
```json
{
  "success": true,
  "data": {
    "total_users": 1000,
    "total_mangas": 500,
    "total_chapters": 5000
  }
}
```

### GET /api/admin/statics/announcement
Get site announcement

**Response**:
```json
{
  "success": true,
  "data": {
    "html": "<p>Site announcement content</p>"
  }
}
```

### POST /api/admin/statics/announcement
Update site announcement

**Permissions**: Admin only

**Request**:
```json
{
  "html": "<p>Updated announcement</p>"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthenticated",
  "code": 401
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied",
  "code": 403
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "code": 404
}
```

### 422 Validation Error
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."]
  },
  "code": 422
}
```