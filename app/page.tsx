import type { Metadata } from "next";
import "./landing.css";
import { LandingGlass } from "@/components/LandingGlass";

export const metadata: Metadata = {
  title: "עוזר מיסוי חכם לעסקים בישראל | ChatTAX",
  description:
    "צ'אט חכם שעונה על שאלות מע\"מ, מס הכנסה, הוצאות מוכרות ומבני עסק — בעברית, מבוסס על מסמכי רשות המסים הרשמיים. חינם להתחלה.",
  openGraph: {
    title: "ChatTAX — עוזר מיסוי חכם לעסקים בישראל",
    description:
      "שאל בשפה חופשית וקבל תשובה מדויקת עם מקורות, מבוססת מסמכי רשות המסים.",
    locale: "he_IL",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingGlass />;
}
