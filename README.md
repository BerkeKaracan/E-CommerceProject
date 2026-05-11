# 🛍️ Premium Full-Stack E-Commerce Platform

[![Deployed on Vercel](https://img.shields.io/badge/Live_Demo-Vercel-black?logo=vercel&style=for-the-badge)](https://e-commerce-project-market.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&style=for-the-badge)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=for-the-badge)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white&style=for-the-badge)](#)

A feature-rich, high-performance **Full-Stack** modern e-commerce platform built to demonstrate advanced web development, secure backend architecture, and perfect web vitals.

**🔴 Live Demo:** [View the project live on Vercel](https://e-commerce-project-market.vercel.app/)

⚠️ **Disclaimer:** This is a portfolio project. No real transactions occur, and no real credit card data is processed.

## ✨ Key Features

### 🛡️ Secure & Scalable Backend (FastAPI + Python)

- **Advanced Authentication:** Secure JWT-based auth flows with Two-Factor Authentication (2FA) via PyOTP.
- **Automated Mailing:** Integrated SMTP email delivery (via Mailtrap) with HTML rendering for safe password resets.
- **Robust Database Management:** SQLAlchemy ORM implementation strictly handling complex relational data (Products, Orders, Users) with PostgreSQL/SQLite compatibility.
- **Security First:** Strict CORS configurations, protected API endpoints, and SQL injection prevention.

### ⚡ Blazing Fast Frontend (Next.js + Tailwind v4)

- **Perfect Core Web Vitals:** Optimized for absolute performance (LCP < 1.3s, 0.00 CLS, ~32ms INP). Zero layout shifts!
- **Absolute Dark/Light Mode:** Flawless transition across all components, including modals, dropdowns, and loading spinners.
- **Complex UI/UX Interactions:** Mobile-first architecture featuring custom bottom-sheets, smooth modal exits without scroll-locks, and native-feeling inputs.
- **Smart Product Discovery:** Real-time client-side search, category filtering, and smart sorting algorithms (coalesce protected).
- **Dynamic Loyalty Program:** Automated points calculation based on order history. Users can redeem points for functional discount codes.

## 🛠️ Tech Stack

**Frontend:**

- Next.js (App Router)
- React & Context API
- Tailwind CSS v4
- TypeScript

**Backend:**

- FastAPI (Python)
- SQLAlchemy (ORM)
- SQLite / PostgreSQL
- PyOTP (2FA) & JWT (Auth)
- Mailtrap (SMTP Testing)

## 🚀 Getting Started

To run this full-stack project locally, follow these steps:

### 1. Clone the repository

```bash
git clone https://github.com/BerkeKaracan/E-CommerceProject.git
cd E-CommerceProject
```

### 2. Setup the Backend

Navigate to the backend directory, install Python dependencies, and run the FastAPI server:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

_(Backend runs on http://localhost:8000 by default)_

### 3. Setup the Frontend

Open a new terminal, navigate to the project root, install Node dependencies, and start the Next.js server:

```bash
npm install
npm run dev
```

_(Frontend runs on http://localhost:3000)_

## 🎯 Technical Highlights

- **Bulletproof Architecture:** Conquered React hydration issues, strictly managed `useEffect` behaviors, and implemented deep state cleanup mechanisms to prevent ghost-states (e.g., the infamous "gray screen" modal bugs).
- **Production Ready:** Pre-configured Dockerfiles, Jest testing setup, ESLint strict rules, and responsive design tailored for real-world scenarios.

---

_Developed by Berke Karacan_
