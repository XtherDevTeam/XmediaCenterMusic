# XmediaCenter 2 (XMS-2) API Documentation

This document provides a detailed overview of the XMS-2 backend API.

## General Information

- **Base URL**: `/xms/v1`
- **Authentication**: Session-based (using Flask-Session). Cookies are used to track `loginState` (which stores the User ID).
- **Response Format**: Most endpoints return a standard JSON object:
  ```json
  {
    "ok": true,
    "data": ...
  }
  ```
  In case of an error:
  ```json
  {
    "ok": false,
    "data": "Error message"
  }
  ```

---

## 1. System Information

### `GET /info`
Get basic information about the XMS instance.

- **Request**: None
- **Response**:
  ```json
  {
    "coreCodeName": "string",
    "coreBuildNumber": integer,
    "xmsProjectAuthor": "string",
    "serverTime": "YYYY-MM-DD HH:MM:SS",
    "instanceName": "string",
    "instanceDescription": "string",
    "allowRegister": 0|1,
    "enableInviteCode": 0|1
  }
  ```

### `GET /config`
Retrieves server configuration (Admin only).

- **Requirement**: Must be logged in and user level >= 1.
- **Response**:
  ```json
  {
    "ok": true,
    "data": {
      "serverId": "string",
      "xmsRootPath": "string",
      "xmsBlobPath": "string",
      "xmsDrivePath": "string",
      "host": "string",
      "port": integer,
      "proxyType": "string",
      "proxyUrl": "string",
      "allowRegister": 0|1,
      "enableInviteCode": 0|1,
      "inviteCode": "string"
    }
  }
  ```

### `POST /config/update`
Updates server configuration (Admin only).

- **Requirement**: Must be logged in and user level >= 1.
- **Body (JSON)**: Same object as in `GET /config` data.
- **Response**: `{"ok": true, "data": "success"}`

### `GET /info/plugins`
Lists all available plugins.

- **Response**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "name": "string",
        "info": {
          "name": "string",
          "description": "string",
          "version": "string",
          "author": "string",
          "avaliablepermissionLevel": integer
        }
      }
    ]
  }
  ```

---

## 2. Authentication

### `POST /signin`
- **Body (JSON)**:
  - `username` (string)
  - `password` (string)
- **Response**: `{"ok": true, "data": "success"}`. Sets session cookie on success.

### `POST /signout`
- **Response**: `{"ok": true, "data": "success"}`. Clears session.

### `POST /signup`
- **Body (JSON)**:
  - `username` (string)
  - `password` (string)
  - `slogan` (string)
  - `inviteCode` (string, optional depending on config)
- **Response**: `{"ok": true, "data": "success"}`

---

## 3. User Management

### `GET /user/status`
Checks if the current user is logged in.

- **Response**: `{"ok": true, "data": {"status": "logged in", "uid": integer}}`

### `GET /user/<uid>/info`
Retrieves public info for a specific user.

- **Response**:
  ```json
  {
    "ok": true,
    "data": {
      "id": integer,
      "name": "string",
      "slogan": "string",
      "level": integer
    }
  }
  ```

### `GET /user/<uid>/avatar`
- **Response**: Binary image data (image/jpeg or captured from DB).

### `GET /user/<uid>/headimg`
- **Response**: Binary image data (image/jpeg or captured from DB).

### `POST /user/password/update`
- **Body (JSON)**: `{"oldPassword": "string", "newPassword": "string"}`
- **Response**: `{"ok": true, "data": "success"}`

### `POST /user/username/update`
- **Body (JSON)**: `{"newUsername": "string"}`
- **Response**: `{"ok": true, "data": "success"}`

---

## 4. Drive & File Management

### `POST /drive/dir`
List contents of a directory.

- **Body (JSON)**: `{"path": "string"}` (Relative to user root)
- **Response**:
  ```json
  {
    "ok": true,
    "data": {
      "list": [
        {
          "filename": "string",
          "type": "file" | "dir",
          "lastModified": "YYYY-MM-DD HH:MM:SS",
          "mime": "string",
          "path": "string"
        }
      ],
      "info": {
        "total": integer,
        "files": integer,
        "dirs": integer
      }
    }
  }
  ```

### `POST /drive/createdir`
- **Body (JSON)**: `{"path": "string", "name": "string"}`
- **Response**: `{"ok": true, "data": "success"}`

### `POST /drive/delete`
- **Body (JSON)**: `{"path": "string"}`
- **Response**: `{"ok": true, "data": "success"}`

### `POST /drive/rename`
- **Body (JSON)**: `{"path": "string", "newName": "string"}`
- **Response**: `{"ok": true, "data": "success"}`

### `POST /drive/move` | `POST /drive/copy`
- **Body (JSON)**: `{"path": "string", "newPath": "string"}`
- **Response**: `{"ok": true, "data": "success"}`

### `GET /drive/file`
Download/Stream a file.

- **Query Param**: [path](file:///Users/chou/Desktop/project/xms-2-backend/api/dataManager.py#333-349) (string)
- **Headers**: Supports [Range](file:///Users/chou/Desktop/project/xms-2-backend/app.py#35-49) for streaming.
- **Response**: Binary file data with appropriate MIME type.

### `POST /drive/upload`
Upload files using `multipart/form-data`.

- **Query Param**: [path](file:///Users/chou/Desktop/project/xms-2-backend/api/dataManager.py#333-349) (target directory)
- **Response**: `{"ok": true, "data": "success"}`

---

## 5. Music API

### `GET /user/playlists`
Lists the current user's playlists.

- **Response**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": integer,
        "name": "string",
        "owner": integer,
        "description": "string",
        "creationDate": "YYYY-MM-DD HH:MM:SS",
        "playCount": integer
      }
    ]
  }
  ```

### `POST /music/playlist/create`
- **Body (JSON)**: `{"name": "string", "description": "string"}`
- **Response**: `{"ok": true, "data": integer}` (The new Playlist ID)

### `GET /music/playlist/<id>/info`
- **Response**:
  ```json
  {
    "ok": true,
    "data": {
      "id": integer,
      "name": "string",
      "owner": integer,
      "description": "string",
      "creationDate": "YYYY-MM-DD HH:MM:SS",
      "playCount": integer
    }
  }
  ```

### `GET /music/playlist/<id>/songs`
- **Response**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": integer,
        "path": "string",
        "playlistId": integer,
        "sortId": integer,
        "info": {
          "title": "string",
          "album": "string",
          "artist": "string",
          "composer": "string",
          "length": integer
        }
      }
    ]
  }
  ```

### `POST /music/playlist/<id>/songs/insert`
- **Body (JSON)**: `{"songPath": "string"}`
- **Response**: `{"ok": true, "data": integer}` (The new Song ID in playlist)

### `GET /music/song/<id>/info`
- **Response**:
  ```json
  {
    "ok": true,
    "data": {
      "title": "string",
      "album": "string",
      "artist": "string",
      "composer": "string",
      "length": integer,
      "owner": integer,
      "path": "string"
    }
  }
  ```

### `GET /music/song/<id>/artwork`
- **Response**: Binary image data (artwork).

---

## 6. Sharing

### `POST /sharelink/create`
Creates a public share link for a file or directory.

- **Body (JSON)**: `{"path": "string"}`
- **Response**: `{"ok": true, "data": "string"}` (SHORT_LINK_ID)

### `GET /sharelink/<id>/info`
- **Response**:
  ```json
  {
    "ok": true,
    "data": {
      "id": "string",
      "path": "string",
      "owner": {
        "id": integer,
        "name": "string",
        "slogan": "string",
        "level": integer
      },
      "info": {
        "filename": "string",
        "type": "file" | "dir",
        "lastModified": "YYYY-MM-DD HH:MM:SS",
        "mime": "string"
      }
    }
  }
  ```

### `GET /sharelink/<id>/file`
- **Response**: Streams the shared file (Binary data).

---

## 7. Tasks & Jobs

### `POST /task/create`
Starts a background task (e.g., via a plugin).

- **Body (JSON)**:
  - [name](file:///Users/chou/Desktop/project/xms-2-backend/app.py#385-400) (string)
  - `plugin` (string)
  - `handler` (string)
  - `args` (array)
- **Response**: `{"ok": true, "data": integer}` (Task ID)

### `GET /task/<id>/info`
- **Response**:
  ```json
  {
    "ok": true,
    "data": {
      "id": integer,
      "name": "string",
      "plugin": "string",
      "handler": "string",
      "args": "string" (JSON string of arguments),
      "logText": "string",
      "creationTime": "YYYY-MM-DD HH:MM:SS",
      "endTime": "YYYY-MM-DD HH:MM:SS",
      "owner": integer
    }
  }
  ```

---

## 8. Admin Management

Only accessible by users with `level == 2`.

### `GET /user/manage/list`
Lists all users.

- **Response**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": integer,
        "name": "string",
        "slogan": "string",
        "level": integer
      }
    ]
  }
  ```

### `POST /user/manage/delete`
- **Body (JSON)**: `{"id": integer}`
- **Response**: `{"ok": true, "data": "success"}`

### `POST /user/manage/updateLevel`
- **Body (JSON)**: `{"id": integer, "level": integer}`
- **Response**: `{"ok": true, "data": "success"}`
