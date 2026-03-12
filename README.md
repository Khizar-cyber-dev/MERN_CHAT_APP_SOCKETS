# Full Stack Chat Application 📱💬

A real-time chat application built with **Node.js**, **Express**, and **Socket.io** on the backend and **React** with **Vite** on the frontend. Users can sign up/login, start one-to-one or group conversations, send messages, and receive instant updates using web sockets.

This repository contains two main folders:

- `backend/` – Express API, MongoDB models, authentication, socket logic, and utilities.
- `frontend/` – React SPA bootstrapped with Vite, includes chat UI components, state management, and client-side socket integration.

---

## 🚀 Features

The application is feature-rich and mimics a modern chat platform:

- **User registration & login** (email/password, Google OAuth)
- **JWT-based authentication** with HTTP-only cookies
- **Profile management** (upload avatar via Cloudinary)
- **One‑to‑one chats** with history, seen receipts, and typing indicators
- **Group conversations** (create groups, invite members, chat together)
- **Real-time updates** using Socket.io for messages, presence, and notifications
- **Media sharing** – send text or images; images are stored on Cloudinary
- **Contact management** – search users, list contacts and recent chat partners
- **Message status** – mark messages as seen and notify the sender
- **Responsive UI** built with Tailwind CSS and optimized for mobile/desktop
- **Email notifications** (welcome email, password reset, verification) via Arcjet/SMTP
- **Environment support** – separate configs for development and production
- Extensible **middleware** for security (ARCJet, passport, custom auth)

---

### 🔌 API Endpoints

Below are the primary REST endpoints provided by the backend. All `/api` routes require authentication unless noted.

#### **Auth**
- `POST /api/auth/signup` – register new user
- `POST /api/auth/login` – login with email/password
- `POST /api/auth/logout` – clear auth cookie
- `GET /api/auth/check` – validate current token and fetch user data
- `PUT /api/auth/update-profile` – update avatar (protected)
- `GET /api/auth/google` – start Google OAuth
- `GET /api/auth/google/callback` – Google OAuth callback

#### **Users / Contacts**
- `GET /api/messages/contacts` – list all other users
- `GET /api/messages/partners` – return recent chat partners

#### **Direct Messaging**
- `GET /api/messages/:id` – fetch conversation with another user
- `POST /api/messages/:id` – send text/image message
- `PUT /api/messages/:id/seen` – mark conversation messages as seen

#### **Groups**
- `POST /api/groups` – create a new group (name, members, avatar)
- `GET /api/groups` – list groups the user belongs to
- `GET /api/groups/:groupId/messages` – get messages for a group
- `POST /api/groups/:groupId/messages` – send a group message
- `PUT /api/groups/:groupId/seen` – mark group messages as seen

> See route files under `backend/src/routes` for additional parameters and middleware.


---

### ⚡ Socket Events

The server and client exchange real-time events via Socket.io:

| Event (emit)       | Description                                |
|--------------------|--------------------------------------------|
| `newMessage`       | Notifies recipient of a new direct message |
| `messagesSeen`     | Sender notified that messages were seen   |
| `newGroupMessage`  | Broadcast to group when someone sends msg  |
| `groupMessagesSeen`| Group notified when members see messages   |
| `typing`           | (if implemented) shows typing indicator   |

Clients join rooms named after their user ID or group ID to receive updates.

---


---

## 🧱 Technologies

| Layer     | Technologies                                             |
|-----------|----------------------------------------------------------|
| Backend   | Node.js, Express, MongoDB (Mongoose), Passport, Socket.io |
| Frontend  | React, Vite, Tailwind CSS, Zustand (state management)    |
| DevTools  | ESLint, Prettier, PostCSS, Vite                          |

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js v16+ and npm/yarn
- MongoDB database (local or Atlas)
- Cloudinary account (for uploads)
- Arcjet email service (or configured SMTP)

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   # or yarn
   ```
3. Copy `.env.example` to `.env` and fill in the values:
   ```env
   MONGODB_URI=
   JWT_SECRET=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   SMTP_HOST=
   SMTP_PORT=
   SMTP_USER=
   SMTP_PASS=
   ARCJET_API_KEY=
   EMAIL_FROM=
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

### Frontend

1. Move into the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   # or yarn
   ```
3. Create a `.env` file (based on `.env.example`) with at least:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```
4. Start the frontend dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` (or the printed URL) in your browser.

---

## 🔧 Available Scripts

| Directory  | Script           | Description                               |
|------------|------------------|-------------------------------------------|
| root       | `npm run install-all` | Installs both backend and frontend deps |
| backend    | `npm run dev`    | Starts backend with nodemon              |
| backend    | `npm run start`  | Launches production server               |
| backend    | `npm run lint`   | Runs ESLint                              |
| frontend   | `npm run dev`    | Starts Vite development server           |
| frontend   | `npm run build`  | Builds frontend for production           |
| frontend   | `npm run preview`| Preview production build                 |

---

## 📁 Project Structure

Detailed folders:

- **backend/src/** – controllers, routes, models, middleware, libs
- **frontend/src/** – components, pages, store, hooks, styles

---

## 🛡️ Authentication & Security

- Passwords hashed with bcrypt
- JWT tokens stored in HTTP-only cookies
- Protected routes with middleware (`auth.middleware.js`)

---

## 💡 Usage

1. Register a new user or sign in.
2. Add contacts by searching usernames or sending invites.
3. Start a chat or create a group from the sidebar.
4. Type messages and enjoy real-time updates.

> For API documentation, explore the `backend/src/routes` files or use a tool like Postman.

---

## 🧪 Testing

> (Add testing instructions if tests exist or are added later.)

---

## 📦 Deployment

1. Build frontend: `cd frontend && npm run build`
2. Set environment variables on the server (e.g., Heroku, DigitalOcean).
3. Serve the built frontend with a static file server or integrate into Express.
4. Ensure MongoDB and Cloudinary credentials are configured.

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributions

Contributions are welcome! Please open issues or submit pull requests.

---

Happy coding! 🎉
