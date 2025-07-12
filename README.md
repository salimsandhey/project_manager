# 🚀 Project Manager

> **A modern task management system built for teams.**  
> Assign tasks, track progress, manage users, and collaborate efficiently — all in one place.

![Project Manager Banner](https://yourdomain.com/banner-image.png) <!-- Optional image -->

---

## 🧠 Overview

**Project Manager** is a lightweight but powerful task management platform designed to help team leaders manage their teams effectively. It simplifies task assignment, progress tracking, team onboarding, and productivity monitoring through a clean and intuitive interface.

---

## ✨ Features

- ✅ **Task Assignment** — Assign categorized tasks to employees with deadlines
- 👥 **Team Management** — Create teams, add members, and monitor their activity
- ✉️ **Invite System** — Send secure token-based invites via email
- 📊 **Live Analytics** — Track how many tasks are `new`, `active`, `completed`, or `failed`
- 🔐 **Role-Based Access** — Admins vs Employees with proper authorization
- 📆 **Due Dates & Status** — Timestamped progress tracking for every task

---

## 🛠 Tech Stack

| Layer      | Tech                                 |
|------------|--------------------------------------|
| **Frontend**  | React + Vite + TailwindCSS + ShadCN UI |
| **Backend**   | Node.js + Express.js              |
| **Database**  | MongoDB + Mongoose                |
| **Authentication** | JWT or Cookies (configurable) |
| **Email**     | Nodemailer / SMTP                 |

---

## 🧩 Data Models (Schemas)

### 🧑‍💻 User
- `username`, `email`, `password`
- `role`: `admin` or `employee`
- `teamId`, `taskCounts`

### 🧑‍🤝‍🧑 Team
- `name`, `createdBy`, `members[]`

### 📬 Invite
- `email`, `token`, `teamId`
- `expiresAt`, `emailSent`, `used`

### ✅ Task
- `title`, `description`, `status`, `category`
- `userId`, `dueDate`, `acceptedAt`, `completedAt`, `failedAt`

---

## 📸 UI Preview

<!-- Replace these with actual screenshots -->
![Dashboard](https://yourdomain.com/dashboard-preview.png)
![Task View](https://yourdomain.com/task-preview.png)

---

## 🚦 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/salimsandhey/project_manager.git
cd project_manager
