# מדריך פריסה — ChatTAX

מדריך מלא צעד-אחר-צעד לפריסת ChatTAX מהמחשב שלך לאינטרנט. **הכל חינם.**

**זמן משוער:** ~30 דקות.

---

## שלב 1: העלאת הקוד ל-GitHub

### 1.1 יצירת ריפוזיטורי בגיטהאב

1. פתח https://github.com
2. אם אין לך חשבון: **Sign up** (דורש email וסיסמה)
3. אחרי התחברות → פינה שמאלית עליונה **+** → **New repository**
4. **Repository name:** `chattax` (או כל שם אחר)
5. **Description:** _"עוזר מיסוי לעסקים בישראל"_
6. **Public** או **Private** — פרטי מומלץ לפרויקט אישי
7. **⚠️ אל תוסיף** README, .gitignore או License — יש לנו כבר
8. **Create repository**

תראה מסך עם הוראות. **שמור אותו פתוח** — נחזור אליו.

### 1.2 push של הקוד

בטרמינל, בתיקיית `D:\TAX1`:

```bash
# הוסף את הריפו של גיטהאב כ-remote
git remote add origin https://github.com/USERNAME/chattax.git

# החלף את שם ה-branch מ-master ל-main (התקן החדש)
git branch -M main

# הודעה ראשונית עם כל הקוד (כבר הכנתי את זה)
git push -u origin main
```

**⚠️ החלף `USERNAME`** בשם המשתמש שלך בגיטהאב!

בפעם הראשונה שתעשה push, גיטהאב יבקש להתחבר. תקבל חלון קופץ של הדפדפן — תתחבר עם החשבון שלך.

**וידוא הצלחה:** רענן את דף הגיטהאב שלך. אמור לראות את כל הקבצים.

**וידוא אבטחה:** בדוק שהקבצים האלה **לא** מופיעים בגיטהאב (הם צריכים להיות מוסתרים):
- ❌ `.env.local` — מכיל מפתחות
- ❌ `firebase-admin.json` — מכיל את מפתח האדמין הפרטי

אם כן מופיעים — תגיד לי מיד, זו בעיית אבטחה שיש לתקן.

---

## שלב 2: הגדרת Vercel

### 2.1 הרשמה

1. פתח https://vercel.com
2. **Sign Up** → בחר **Continue with GitHub** (הכי נוח)
3. אשר לגיטהאב לתת ל-Vercel גישה

### 2.2 Import Project

1. בדשבורד של Vercel → **Add New...** → **Project**
2. תראה את רשימת הריפוזיטוריים שלך. **Import** ליד `chattax`
3. **Configure Project:**
   - **Framework Preset:** Next.js (מזוהה אוטומטית) ✓
   - **Root Directory:** `.` (השאר) ✓
   - **Build Command:** `npm run build` (ברירת מחדל) ✓
   - **Output Directory:** `.next` (ברירת מחדל) ✓

### 2.3 הגדרת משתני סביבה — קריטי!

בחלק **Environment Variables** תוסיף את כל 8 המשתנים:

| שם משתנה | ערך (מאיפה) |
|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | מ-`.env.local` שלך |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | מ-`.env.local` שלך |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | מ-`.env.local` שלך |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | מ-`.env.local` שלך |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | מ-`.env.local` שלך |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | מ-`.env.local` שלך |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | מ-`.env.local` שלך |
| `FIREBASE_ADMIN_JSON` | ⚠️ המיוחד — ראה למטה |

**איך להכניס `FIREBASE_ADMIN_JSON`:**

זה השדה המסובך. הערך שלו הוא **כל התוכן של `firebase-admin.json` כשורה אחת**.

- פתח את `firebase-admin.json` בעורך טקסט
- בחר הכל (Ctrl+A) והעתק (Ctrl+C)
- בשדה **Value** ב-Vercel — הדבק (Ctrl+V)
- Vercel יטפל בשורות באוטומטית

**Deploy** (הכפתור הכחול). לוקח ~1-2 דקות.

### 2.4 קבלת ה-URL

אחרי סיום הפריסה, תראה כתובת כמו:
```
https://chattax-xxxxxx.vercel.app
```

**⚠️ אל תלחץ עליה עדיין** — עדיין צריך להגדיר את Firebase לאשר את הדומיין הזה.

---

## שלב 3: הגדרת Firebase לדומיין החדש

Google Sign-In לא יעבוד עדיין, כי Firebase לא יודע לאשר את דומיין הפרוד.

1. פתח https://console.firebase.google.com/project/tax1-avi1/authentication/settings
2. תראה טאב **Authorized domains**
3. **Add domain** → הדבק את הדומיין של Vercel **בלי `https://`**:
   ```
   chattax-xxxxxx.vercel.app
   ```
4. **Add**

**מוסיף גם:**
- הדומיין הראשי `chattax-xxxxxx.vercel.app`
- אם תרצה בהמשך דומיין custom — תוסיף גם אותו

---

## שלב 4: בדיקה בפרוד

1. פתח את הכתובת של Vercel בדפדפן
2. אמור להיות redirect ל-`/login`
3. לחץ **התחבר עם Google** → בחר חשבון → אמור לחזור מחובר
4. שאל שאלה — אמור להיזרם תשובה
5. פתח כרטיסייה חדשה של אותו URL — אמור להיות מחובר ולראות את השיחה בסייד-בר

**עובד?** 🎉 סיימת. יש לך צ'אטבוט חי באינטרנט.

**לא עובד?** ראה **פתרון תקלות** למטה.

---

## איך לעדכן הקוד בעתיד

**זה הקסם של Vercel + GitHub:**

1. **תעדוב את הקוד מקומית** (או תבקש ממני לעדכן)
2. `git add .`
3. `git commit -m "תיאור של השינוי"`
4. `git push`
5. **Vercel פורס אוטומטית תוך ~90 שניות.** תקבל אימייל כשמוכן.

**זה הכל.** אין צורך להיכנס לשום ממשק, הכל אוטומטי.

---

## הוספת דומיין משלך (אופציונלי)

אם קנית דומיין (למשל `chattax.co.il`):

1. Vercel Dashboard → הפרויקט שלך → **Settings** → **Domains**
2. הדבק את הדומיין → **Add**
3. Vercel יבקש שתגדיר DNS records אצל ספק הדומיין
4. אחרי DNS מתעדכן (~10 דקות) — Vercel מנפיק תעודת SSL אוטומטית
5. **הוסף את הדומיין החדש ל-Firebase Authorized domains** (שלב 3)

---

## פתרון תקלות

### "auth/unauthorized-domain" בהתחברות
- לא הוספת את הדומיין של Vercel ל-Firebase Authorized domains. חזור לשלב 3.

### "500 Internal Server Error" בהודעה
- הכי סביר: `FIREBASE_ADMIN_JSON` לא מוגדר נכון ב-Vercel
- ב-Vercel: **Deployments** → הפריסה האחרונה → **Logs** — תראה את השגיאה המדויקת
- ודא שכל התוכן של `firebase-admin.json` הודבק (מ-`{` ועד `}` כולל)

### הצ'אט לא זוכר שיחות
- כללי האבטחה של Firestore לא פורסמו. חזור לשלב הזה ב-README הישן ופרסם את `firestore.rules`.

### בקשות איטיות מאוד בפרוד
- הפריסה עברה ל-region רחוק. Vercel Settings → **Functions** → **Region** → **Frankfurt (fra1)** — הכי קרוב לישראל

### "Quota exceeded" מ-Gemini
- הגעת למגבלה החינמית (1M tokens/day). או שהאפליקציה הגיעה למשתמשים אמיתיים 🎉 — או שיש לולאה שקוראת יותר מדי.
- שקול לעבור למסלול בתשלום של Gemini (עולה ~$5-20 לחודש לשימוש בינוני)

---

## סיכום

אחרי כל השלבים יש לך:
- ✅ קוד ב-GitHub — היסטוריה מלאה, אפשר לחזור אחורה
- ✅ פריסה חיה ב-Vercel — URL שאתה יכול לשתף
- ✅ עדכונים אוטומטיים — כל push לגיטהאב פורס מחדש
- ✅ 0 עלויות — הכל במסלולים חינמיים
- ✅ SSL אוטומטי — HTTPS מוגדר
- ✅ CDN עולמי — מהיר לכל מבקר
