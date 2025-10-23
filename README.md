# PharmaCarePro

A modern, role-based pharmacy operations platform for lead pharmacists and on-site staff. Manage pharmacies and users, track daily dispensing/incoming, monitor attendance, view stock status and shortages, generate consumption reports, and publish custom pages — all built with React and Firebase.

## Overview
PharmaCarePro streamlines multi-pharmacy management with clear workflows for lead (owner) and regular/senior pharmacists. It centralizes daily operations, inventory tracking, attendance, and reporting in a clean, responsive web interface.

## Key Features
- Role-based access: lead vs. regular/senior pharmacists
- Authentication: Firebase Auth for leads; Firestore-backed login for pharmacists
- Pharmacies management: create, list, delete, and view details
- Pharmacists management: assignment and attendance tracking
- Inventory tracking: daily dispense and incoming per pharmacy
- Stock status & shortages: current stock view and shortage detection
- Reports: monthly consumption, exports (CSV/XLSX)
- Custom pages: lightweight CMS per owner/pharmacy
- Real-time updates: Firestore subscriptions

## Tech Stack
- React (Create React App), React Router, Framer Motion
- Firebase (Auth, Cloud Firestore)
- Tailwind CSS (via PostCSS)
- Chart.js and xlsx for charts/exports

## Getting Started
- Prerequisites: Node.js 18+ and npm
- Install: `npm install`
- Start dev server: `npm start`

### Firebase Configuration
Create `.env.local` in the project root:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```
Environment variables are recommended over editing `src/utils/firebase.js` directly.

### Authentication Model
- Lead users: email/password via Firebase Auth
- Regular/Senior pharmacists: username/password stored in `users` collection (client uses localStorage)

## Available Scripts
- `npm start` — run development server
- `npm run build` — create production build
- `npm test` — run tests

## Deployment (Optional: Firebase Hosting)
- Install CLI: `npm i -g firebase-tools`
- Login: `firebase login`
- Build: `npm run build`
- Deploy: `firebase deploy`
Ensure `.firebaserc` points to your project and `firestore.rules` are hardened.

## Notes
- For production, use hashed passwords for Firestore-backed users
- Review and secure Firestore rules before release

---

## Bilingual Overview / نظرة عامة ثنائية اللغة

### English
PharmaCarePro is a pharmacy operations platform for multi-branch management. Leads manage pharmacies and staff, while pharmacists record daily dispense/incoming, attendance, and view stock status, shortages, and reports.

Quick Start:
- `npm install`
- `npm start`
- Configure Firebase in `.env.local`

### العربية
PharmaCarePro منصة لإدارة عمليات الصيدليات متعددة الفروع. تُمكّن قائد الصيدلة من إدارة الصيدليات والصيادلة، بينما يُسجّل الصيادلة المنصرف والوارد اليومي، والحضور، ويعرضون حالة المخزون والنواقص والتقارير.

البدء السريع:
- تثبيت الحزم: `npm install`
- تشغيل في التطوير: `npm start`
- إعداد مفاتيح Firebase في ملف `.env.local`

الميزات:
- صلاحيات حسب الدور (قائد، صيدلي عادي/كبير)
- تسجيل الدخول للقائد عبر Firebase، وللصيادلة عبر اسم المستخدم/كلمة المرور
- تتبّع المنصرف والوارد اليومي، وحالة المخزون والنواقص، والتقارير الشهرية
- تحديثات مباشرة عبر Firestore
