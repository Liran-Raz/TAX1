# ChatTAX — עוזר מיסוי לעסקים בישראל

צ'אטבוט מבוסס AI שעונה לבעלי עסקים ישראלים על שאלות מיסוי, מע"מ, מס הכנסה והוצאות מוכרות — עם התחברות משתמשים, שמירת שיחות, ועיגון התשובות במסמכי רשות המסים הרשמיים.

**Live demo:** _(תוסיף אחרי הפריסה)_

---

## מה זה עושה

- 🤖 **צ'אט חכם** — מבוסס Google Gemini 2.5 Flash (חינם)
- 📚 **RAG** — כל תשובה מבוססת על 1,854 קטעים מפקודת מס הכנסה, מדריך רשות המסים 2025, וחוק החברות. חיפוש BM25 מוצא את הקטעים הרלוונטיים לכל שאלה.
- 🔒 **התחברות משתמשים** — Google Sign-In דרך Firebase Auth
- 💬 **שיחות שמורות** — כל משתמש רואה רק את השיחות שלו (Firestore + Security Rules)
- 🇮🇱 **עברית מלאה** — RTL, פונט Rubik, טרמינולוגיה ישראלית

## מסמכים

- **[DEPLOYMENT.md](DEPLOYMENT.md)** — מדריך פריסה שלב-אחר-שלב לגיטהאב + Vercel
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — מבנה טכני של המערכת (למי שרוצה להעמיק)

## הרצה מקומית (Development)

### דרישות מוקדמות
- Node.js 20+ ו-npm
- חשבון Firebase עם פרויקט מוגדר
- מפתח Google Gemini API

### התקנה

```bash
git clone https://github.com/USERNAME/REPO.git
cd REPO
npm install
```

### קונפיגורציה

1. **העתק את `.env.example` ל-`.env.local`** ומלא את כל המפתחות:
   - `GOOGLE_GENERATIVE_AI_API_KEY` — https://aistudio.google.com/apikey
   - `NEXT_PUBLIC_FIREBASE_*` — Firebase Console → Project Settings → General

2. **הורד קובץ Firebase Admin service account** (Firebase Console → Project Settings → Service Accounts → Generate new private key) ושמור בשם `firebase-admin.json` בשורש הפרויקט.

3. **הפעל את השרת:**
   ```bash
   npm run dev
   ```
   ופתח את http://localhost:3000

## מבנה הפרויקט

```
D:\TAX1\
├── app/
│   ├── layout.tsx              # Root layout + AuthProvider
│   ├── login/page.tsx          # דף התחברות עם Google
│   ├── (app)/
│   │   ├── layout.tsx          # Auth guard + Sidebar
│   │   ├── page.tsx            # שיחה חדשה
│   │   └── chat/[chatId]/page.tsx
│   └── api/chat/route.ts       # ה-endpoint שמדבר עם Gemini + RAG + Firestore
├── components/
│   ├── AuthProvider.tsx        # React context לאימות
│   ├── ChatView.tsx            # ה-UI של הצ'אט
│   └── Sidebar.tsx             # רשימת שיחות + התנתקות
├── lib/
│   ├── firebase-client.ts      # Firebase Web SDK (Auth + Firestore)
│   ├── firebase-admin.ts       # Firebase Admin SDK (server-only)
│   ├── system-prompt.ts        # פרומפט המומחה בעברית
│   ├── rag.ts                  # מנוע החיפוש BM25
│   ├── chat-store-client.ts    # קריאה מ-Firestore בזמן אמת
│   ├── chat-store-admin.ts     # כתיבה ל-Firestore (server-only)
│   ├── types.ts                # TypeScript types משותפים
│   └── knowledge/
│       └── chunks.json         # 1,854 קטעים מהמסמכים (2.9MB)
├── booklets/                   # PDFים מקוריים (מקור ל-chunks.json)
├── firestore.rules             # כללי אבטחה של Firestore
├── firebase-admin.json         # ⚠️ סופר-רגיש, לא ב-git
└── .env.local                  # ⚠️ סופר-רגיש, לא ב-git
```

## איך זה עובד — Flow של הודעה

1. **משתמש כותב שאלה** ב-`ChatView` ולוחץ שלח
2. **הלקוח מבקש ID token** מ-Firebase Auth ושולח POST ל-`/api/chat`
3. **השרת מאמת את הטוקן** עם `adminAuth.verifyIdToken()`
4. **RAG** — `retrieveContext(query, 6)` מחפש 6 קטעים רלוונטיים ב-`chunks.json` (בזיכרון)
5. **הפרומפט** מורכב מהכללי + הקטעים ומועבר ל-Gemini
6. **Streaming** — התשובה זורמת בחזרה למשתמש בזמן אמת
7. **במקביל** השרת שומר את השאלה, ובסיום — את התשובה, ב-Firestore תחת `users/{uid}/chats/{chatId}/messages/`
8. **Firebase onSnapshot** בסייד-בר מקבל update ומראה את השיחה החדשה

## עדכון הידע (החוברות)

הידע של הצ'אט נבנה מ-3 קבצי PDF ב-`booklets/`. אם תרצה להוסיף/להחליף:

1. הוסף/החלף PDFים ב-`booklets/`
2. הרץ את סקריפט הבנייה (יופיע ב-`scripts/rebuild-index.mjs` אחרי הפריסה — כרגע ידני)
3. `git commit` את `lib/knowledge/chunks.json` והדחוף

## עלויות

| שירות | מסלול | עלות | מגבלה |
|---|---|---|---|
| Google Gemini API | Free | $0 | 1,500 בקשות/יום, 1M tokens/יום |
| Firebase (Auth + Firestore) | Spark | $0 | 50K MAU, 50K reads/day, 20K writes/day |
| Vercel | Hobby | $0 | 100GB תעבורה/חודש |

**במסלול הזה — 0 שקלים לחודש**, מתאים למאות משתמשים פעילים.

## רישיון

פרטי — לא לשימוש מסחרי ללא רשות.

## הבהרה משפטית

הצ'אט מספק **מידע כללי בלבד**, לא ייעוץ מקצועי. שיעורי המס והתקרות משתנים — הצ'אט מזהיר, אבל האחריות על הבהרה חד-משמעית למשתמשים היא של מפעיל המערכת. **לא לקבל אחריות על ייעוץ מיסוי — הפנה תמיד לרו"ח מוסמך.**
