"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { PLAN_INFO } from "@/lib/plan-info";
import type { PlanId } from "@/lib/types";

const PLAN_ORDER: PlanId[] = ["free", "pro", "ultra"];

const EXAMPLES = [
  "אני עוסק פטור — מה תקרת המחזור לשנה?",
  "אילו הוצאות רכב מוכרות לי כעצמאי?",
  "כמה מס משלמת חברה בע\"מ על הרווח?",
  "מה שיעור המע\"מ ואיך מקזזים תשומות?",
];

function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 3v-3a3 3 0 0 1-1-2.3V7z"
        fill="#fff"
      />
      <circle cx="9" cy="10" r="1.1" fill="#2563eb" />
      <circle cx="12" cy="10" r="1.1" fill="#2563eb" />
      <circle cx="15" cy="10" r="1.1" fill="#2563eb" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function LandingGlass() {
  const { user } = useAuth();
  const startHref = user ? "/chat" : "/login";
  const startLabel = user ? "לצ'אט שלי" : "התחל עכשיו — חינם";

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const disposers: Array<() => void> = [];

    /* ---------- Header scroll shadow + progress bar ---------- */
    const header = document.getElementById("siteHeader");
    const progress = document.getElementById("scrollProgress");
    function onScroll() {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (header) header.classList.toggle("scrolled", y > 8);
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight || 1;
      const ratio = Math.min(1, Math.max(0, y / max));
      if (progress) progress.style.transform = "scaleX(" + ratio + ")";
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    disposers.push(() => document.removeEventListener("scroll", onScroll));
    onScroll();

    /* ---------- Mobile nav ---------- */
    const navToggle = document.getElementById("navToggle");
    const mobileNav = document.getElementById("mobileNav");
    function toggleNav() {
      if (!mobileNav || !navToggle) return;
      const open = mobileNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    function closeNav() {
      if (!mobileNav || !navToggle) return;
      mobileNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
    if (navToggle) {
      navToggle.addEventListener("click", toggleNav);
      disposers.push(() => navToggle.removeEventListener("click", toggleNav));
    }
    if (mobileNav) {
      const links = mobileNav.querySelectorAll("a, .btn");
      links.forEach((el) => el.addEventListener("click", closeNav));
      disposers.push(() =>
        links.forEach((el) => el.removeEventListener("click", closeNav)),
      );
    }

    /* ---------- Generic reveal-on-scroll ---------- */
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
      );
      revealEls.forEach((el) => revealObserver.observe(el));
      disposers.push(() => revealObserver.disconnect());
    } else {
      revealEls.forEach((el) => el.classList.add("in"));
    }

    /* ---------- Chat-thread scroll signature ---------- */
    const turns = document.querySelectorAll(".turn");
    const typingDelay = reduceMotion ? 0 : 650;
    function revealTurn(turn: Element) {
      if ((turn as HTMLElement).dataset.role === "assistant") {
        turn.classList.add("typing");
        const t = window.setTimeout(() => {
          turn.classList.remove("typing");
          turn.classList.add("answered");
        }, typingDelay);
        disposers.push(() => window.clearTimeout(t));
      } else {
        turn.classList.add("in");
      }
    }
    if ("IntersectionObserver" in window) {
      const threadObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              revealTurn(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.35, rootMargin: "0px 0px -12% 0px" },
      );
      turns.forEach((t) => threadObserver.observe(t));
      disposers.push(() => threadObserver.disconnect());
    } else {
      turns.forEach((t) => t.classList.add("in", "answered"));
    }

    /* ---------- Hero demo typewriter ---------- */
    const demoBody = document.getElementById("demoBody");
    let demoTimers: number[] = [];
    let demoSeq = 0;

    const DEFAULT_Q =
      "אני עוסק פטור, עברתי את תקרת המחזור באמצע השנה — מה עליי לעשות?";
    const DEFAULT_A =
      "כשעוסק פטור חוצה את התקרה השנתית (122,833 ₪ נכון ל-2026) עליו להירשם כעוסק מורשה. מומלץ לפנות לרשות המסים בהקדם ולהתחיל לגבות מע\"מ ולהגיש דוחות תקופתיים.";
    const DEFAULT_SRC = "מבוסס על עדכון רשות המסים 2026";
    const TEASER_A =
      "שאלה מצוינת. תתחבר כדי לקבל תשובה מלאה ומדויקת, עם ציטוט מהמקור הרשמי.";
    const TEASER_SRC = "מבוסס על מסמכי רשות המסים הרשמיים";

    function clearDemoTimers() {
      demoTimers.forEach((id) => window.clearTimeout(id));
      demoTimers = [];
    }
    disposers.push(clearDemoTimers);

    function runDemo(question: string, answer: string, sourceLabel: string) {
      if (!demoBody) return;
      demoSeq++;
      const mySeq = demoSeq;
      clearDemoTimers();
      demoBody.innerHTML = "";

      if (reduceMotion) {
        const u = document.createElement("div");
        u.className = "demo-bubble user show";
        u.textContent = question;
        const a = document.createElement("div");
        a.className = "demo-bubble bot show";
        a.textContent = answer;
        const s = document.createElement("div");
        s.className = "demo-source-tag show";
        s.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg><span></span>';
        const sSpan = s.querySelector("span");
        if (sSpan) sSpan.textContent = sourceLabel;
        demoBody.appendChild(u);
        demoBody.appendChild(a);
        demoBody.appendChild(s);
        return;
      }

      const userBubble = document.createElement("div");
      userBubble.className = "demo-bubble user";
      userBubble.innerHTML = '<span class="typed"></span><span class="cursor"></span>';
      demoBody.appendChild(userBubble);
      const typedSpan = userBubble.querySelector(".typed");
      const cursorSpan = userBubble.querySelector(".cursor");

      demoTimers.push(
        window.setTimeout(() => {
          if (mySeq !== demoSeq) return;
          userBubble.classList.add("show");
        }, 50),
      );

      let i = 0;
      function typeChar() {
        if (mySeq !== demoSeq) return;
        if (typedSpan && i <= question.length) {
          typedSpan.textContent = question.slice(0, i);
          i++;
          demoTimers.push(window.setTimeout(typeChar, 18));
        } else {
          if (cursorSpan) cursorSpan.remove();
          showTyping();
        }
      }
      demoTimers.push(window.setTimeout(typeChar, 350));

      function showTyping() {
        if (mySeq !== demoSeq || !demoBody) return;
        const typing = document.createElement("div");
        typing.className = "demo-typing";
        typing.innerHTML = "<span></span><span></span><span></span>";
        demoBody.appendChild(typing);
        requestAnimationFrame(() => typing.classList.add("show"));
        demoTimers.push(
          window.setTimeout(() => {
            if (mySeq !== demoSeq) return;
            typing.remove();
            showAnswer();
          }, 900),
        );
      }

      function showAnswer() {
        if (mySeq !== demoSeq || !demoBody) return;
        const botBubble = document.createElement("div");
        botBubble.className = "demo-bubble bot";
        botBubble.textContent = answer;
        demoBody.appendChild(botBubble);
        requestAnimationFrame(() => botBubble.classList.add("show"));
        demoTimers.push(
          window.setTimeout(() => {
            if (mySeq !== demoSeq || !demoBody) return;
            const tag = document.createElement("div");
            tag.className = "demo-source-tag";
            tag.innerHTML =
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg><span></span>';
            const tSpan = tag.querySelector("span");
            if (tSpan) tSpan.textContent = sourceLabel;
            demoBody.appendChild(tag);
            requestAnimationFrame(() => tag.classList.add("show"));
          }, 350),
        );
      }
    }

    let demoStarted = false;
    function startDefaultDemo() {
      if (demoStarted) return;
      demoStarted = true;
      runDemo(DEFAULT_Q, DEFAULT_A, DEFAULT_SRC);
    }
    const heroDemoEl = document.querySelector(".hero-demo-wrap");
    if ("IntersectionObserver" in window && heroDemoEl) {
      const heroObs = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startDefaultDemo();
              obs.disconnect();
            }
          });
        },
        { threshold: 0.2 },
      );
      heroObs.observe(heroDemoEl);
      disposers.push(() => heroObs.disconnect());
    } else {
      startDefaultDemo();
    }

    /* ---------- Chips re-trigger the demo (safe generic teaser) ---------- */
    const chips = document.querySelectorAll("#chipRow .chip");
    const chipHandlers: Array<{ el: Element; fn: () => void }> = [];
    chips.forEach((chip) => {
      const fn = () => {
        chips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const q = chip.getAttribute("data-q") || chip.textContent?.trim() || "";
        runDemo(q, TEASER_A, TEASER_SRC);
        if (heroDemoEl) {
          heroDemoEl.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "center",
          });
        }
      };
      chip.addEventListener("click", fn);
      chipHandlers.push({ el: chip, fn });
    });
    disposers.push(() =>
      chipHandlers.forEach(({ el, fn }) => el.removeEventListener("click", fn)),
    );

    /* ---------- Liquid-glass: specular highlight follows the pointer ---------- */
    const wrap = document.querySelector(".hero-demo-wrap");
    const win = wrap ? wrap.querySelector<HTMLElement>(".demo-window") : null;
    if (
      wrap &&
      win &&
      !reduceMotion &&
      window.matchMedia("(pointer:fine)").matches
    ) {
      const onMove = (e: PointerEvent) => {
        const r = win.getBoundingClientRect();
        win.style.setProperty(
          "--mx",
          (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%",
        );
        win.style.setProperty(
          "--my",
          (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%",
        );
      };
      const onLeave = () => {
        win.style.removeProperty("--mx");
        win.style.removeProperty("--my");
      };
      wrap.addEventListener("pointermove", onMove as EventListener, {
        passive: true,
      });
      wrap.addEventListener("pointerleave", onLeave);
      disposers.push(() => {
        wrap.removeEventListener("pointermove", onMove as EventListener);
        wrap.removeEventListener("pointerleave", onLeave);
      });
    }

    return () => disposers.forEach((d) => d());
  }, []);

  return (
    <div className="landing-root">
      <a className="skip-link" href="#main">
        דלג לתוכן הראשי
      </a>
      <div className="scroll-progress" id="scrollProgress" aria-hidden="true" />

      <div className="aurora" aria-hidden="true">
        <span className="a-blob b1" />
        <span className="a-blob b2" />
        <span className="a-blob b3" />
        <span className="a-blob b4" />
        <span className="grain" />
      </div>

      <header className="site-header" id="siteHeader">
        <div className="wrap header-inner">
          <Link className="logo" href="/" aria-label="ChatTAX — דף הבית">
            <span className="logo-badge">
              <LogoMark />
            </span>
            ChatTAX
          </Link>
          <nav className="main-nav" aria-label="ניווט ראשי">
            <a href="#features">תכונות</a>
            <a href="#how">איך זה עובד</a>
            <a href="#pricing">תוכניות</a>
          </nav>
          <div className="header-cta">
            <Link className="btn btn-ghost" href="/login">
              התחברות
            </Link>
            <Link className="btn btn-primary" href={startHref}>
              {startLabel}
            </Link>
          </div>
          <button
            className="nav-toggle"
            id="navToggle"
            aria-expanded="false"
            aria-controls="mobileNav"
            aria-label="פתח תפריט ניווט"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
        <div className="mobile-nav" id="mobileNav">
          <div className="mobile-nav-inner">
            <a href="#features">תכונות</a>
            <a href="#how">איך זה עובד</a>
            <a href="#pricing">תוכניות</a>
            <Link href="/login">התחברות</Link>
            <Link className="btn btn-primary" href={startHref}>
              {startLabel}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ============ HERO ============ */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="dot" aria-hidden="true" /> עוזר מיסוי חכם
                לעסקים בישראל
              </span>
              <h1 className="hero-title">
                התשובות שלך למיסים,
                <br />
                <span className="accent-line">בעברית תוך שניות</span>
              </h1>
              <p className="hero-sub">
                עוזר מיסוי חכם לבעלי עסקים בישראל. מע&quot;מ, מס הכנסה, הוצאות
                מוכרות ומבני עסק — שאל בשפה חופשית וקבל תשובה מדויקת, מבוססת על
                מסמכי רשות המסים הרשמיים.
              </p>
              <div className="hero-ctas">
                <Link className="btn btn-primary btn-lg" href={startHref}>
                  {startLabel}
                </Link>
                <Link className="btn btn-ghost btn-lg" href="/pricing">
                  צפה בתוכניות
                </Link>
              </div>
              <div
                className="chip-row"
                id="chipRow"
                role="group"
                aria-label="שאלות לדוגמה"
              >
                {EXAMPLES.map((q) => (
                  <button className="chip" type="button" data-q={q} key={q}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="hero-demo-wrap">
              <div
                className="demo-window"
                role="group"
                aria-label="הדגמת שיחה עם ChatTAX"
              >
                <div className="demo-titlebar">
                  <div className="demo-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="demo-titlebar-name">
                    <span className="live-dot" aria-hidden="true" /> ChatTAX ·
                    שיחה פעילה
                  </div>
                </div>
                <div className="demo-body" id="demoBody" aria-hidden="true" />
                <div className="demo-inputbar" aria-hidden="true">
                  <span className="fake-input">כתוב שאלה על מיסים…</span>
                  <span className="send-btn">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="demo-float-card" aria-hidden="true">
                <span className="icon-circ">
                  <CheckCircleIcon />
                </span>
                מבוסס מסמכים רשמיים
              </div>
              <p className="sr-only">
                הדגמה: המשתמש שואל &quot;אני עוסק פטור, עברתי את תקרת המחזור
                באמצע השנה — מה עליי לעשות?&quot; וChatTAX עונה: &quot;כשעוסק
                פטור חוצה את התקרה השנתית (122,833 ₪ נכון ל-2026) עליו להירשם
                כעוסק מורשה. מומלץ לפנות לרשות המסים בהקדם ולהתחיל לגבות מע&quot;מ
                ולהגיש דוחות תקופתיים. מבוסס על עדכון רשות המסים 2026.&quot;
              </p>
            </div>
          </div>
        </section>

        {/* ============ TRUST STRIP ============ */}
        <section className="trust-strip">
          <div className="wrap">
            <p>
              מבוסס על מסמכי רשות המסים הרשמיים · פקודת מס הכנסה · מדריך רשות
              המסים 2025 · חוק החברות
            </p>
          </div>
        </section>

        {/* ============ CHAT-THREAD FEATURES (core scroll signature) ============ */}
        <section className="thread-section" id="features">
          <div className="wrap">
            <div className="thread-head reveal">
              <span className="section-eyebrow">שיחה אחת. כל התשובות.</span>
              <h2 className="section-title">
                גלול, ותראה איך שיחה עם ChatTAX נראית באמת
              </h2>
              <p className="section-sub">
                כל תשובה מגיעה עם מקור, בעברית ברורה — בדיוק כמו שהיית שואל
                רו&quot;ח.
              </p>
            </div>

            <div className="chat-frame-header" aria-hidden="true">
              <span className="live-dot" /> ChatTAX · שיחה פעילה
            </div>

            <div className="chat-thread" id="chatThread">
              <article className="turn" data-role="user">
                <div className="msg user">
                  היי, איך אתה יכול לעזור לי עם המיסים?
                </div>
              </article>

              <article className="turn" data-role="assistant">
                <div className="typing-indicator" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="msg assistant">
                  אני ChatTAX — עוזר המס החכם שלך. תשאל אותי כל דבר על מע&quot;מ,
                  מס הכנסה, הוצאות מוכרות או מבנה העסק, ואני אענה בעברית, תוך
                  שניות.
                </div>
              </article>

              <article className="turn" data-role="user">
                <div className="msg user">יפה. אבל על מה בדיוק אתה מתבסס?</div>
              </article>

              <article className="turn" data-role="assistant">
                <div className="typing-indicator" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="msg assistant">
                  <strong>מבוסס מקורות רשמיים</strong>
                  כל תשובה נשענת על פקודת מס הכנסה, מדריך רשות המסים 2025 וחוק
                  החברות — לא ניחושים.
                  <div className="msg-sources">
                    <span className="source-tag">
                      <CheckCircleIcon />
                      פקודת מס הכנסה
                    </span>
                    <span className="source-tag">
                      <CheckCircleIcon />
                      מדריך רשות המסים 2025
                    </span>
                    <span className="source-tag">
                      <CheckCircleIcon />
                      חוק החברות
                    </span>
                  </div>
                </div>
              </article>

              <article className="turn" data-role="user">
                <div className="msg user">כמה זמן זה בדרך כלל לוקח?</div>
              </article>

              <article className="turn" data-role="assistant">
                <div className="typing-indicator" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="msg assistant">
                  <strong>בעברית, מיד</strong>
                  שאלות בשפה חופשית, תשובות תמציתיות ומעשיות — בלי להמתין לתור או
                  לשלם על שעת ייעוץ.
                </div>
              </article>

              <article className="turn" data-role="user">
                <div className="msg user">
                  ואיך אני יודע שאפשר לסמוך על התשובה?
                </div>
              </article>

              <article className="turn" data-role="assistant">
                <div className="typing-indicator" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="msg assistant">
                  <strong>מצטט את המקור</strong>
                  לכל תשובה מצוין על איזה סעיף או מסמך היא מבוססת, כדי שתוכל
                  לאמת.
                </div>
              </article>

              <article className="turn" data-role="user">
                <div className="msg user">
                  ואם אני רוצה לחזור לשיחה הזו מחר, מנייד?
                </div>
              </article>

              <article className="turn" data-role="assistant">
                <div className="typing-indicator" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="msg assistant">
                  <strong>השיחות נשמרות</strong>
                  כל שיחה נשמרת בחשבון שלך — חזור אליה בכל עת מכל מכשיר.
                </div>
              </article>

              <article className="turn" data-role="user">
                <div className="msg user">
                  בסדר, שאלה אמיתית: אני עוסק פטור, עברתי את תקרת המחזור באמצע
                  השנה — מה עליי לעשות?
                </div>
              </article>

              <article className="turn" data-role="assistant">
                <div className="typing-indicator" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="msg assistant">
                  כשעוסק פטור חוצה את התקרה השנתית (122,833 ₪ נכון ל-2026) עליו
                  להירשם כעוסק מורשה. מומלץ לפנות לרשות המסים בהקדם ולהתחיל לגבות
                  מע&quot;מ ולהגיש דוחות תקופתיים.
                  <div className="msg-sources">
                    <span className="source-tag">
                      <CheckCircleIcon />
                      מבוסס על עדכון רשות המסים 2026
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="how" id="how">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="section-eyebrow">פשוט כמו לשלוח הודעה</span>
              <h2 className="section-title">איך זה עובד</h2>
            </div>
            <ol className="steps">
              <li className="step reveal">
                <div className="step-num">1</div>
                <h3>מתחברים</h3>
                <p>כניסה מהירה עם חשבון Google — בלי סיסמאות.</p>
              </li>
              <li className="step reveal">
                <div className="step-num">2</div>
                <h3>שואלים</h3>
                <p>כותבים שאלה בשפה חופשית, כמו לרו&quot;ח.</p>
              </li>
              <li className="step reveal">
                <div className="step-num">3</div>
                <h3>מקבלים תשובה</h3>
                <p>תשובה מבוססת-מקורות עם הפניה לסעיפים הרלוונטיים.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* ============ PRICING ============ */}
        <section className="pricing" id="pricing">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="section-eyebrow">תוכניות</span>
              <h2 className="section-title">תוכנית שמתאימה לקצב השאלות שלך</h2>
              <p className="section-sub">אפשר להתחיל בחינם, לשדרג בכל שלב.</p>
            </div>

            <div className="price-grid">
              {PLAN_ORDER.map((id) => {
                const p = PLAN_INFO[id];
                return (
                  <article
                    className={`price-card${p.highlight ? " popular" : ""} reveal`}
                    key={id}
                  >
                    {p.highlight && <span className="popular-badge">מומלץ</span>}
                    <div className="price-name">{p.label}</div>
                    <div className="price-amount">
                      {p.price}
                      {p.period && <small> / {p.period}</small>}
                    </div>
                    <div className="price-quota">
                      {p.monthly.toLocaleString("he-IL")} שאלות בחודש
                    </div>
                    <ul className="price-features">
                      {p.features.slice(1).map((f) => (
                        <li key={f}>
                          <CheckIcon />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      className={`btn ${p.highlight ? "btn-primary" : "btn-ghost"}`}
                      href={startHref}
                    >
                      {startLabel}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============ CLOSING CTA ============ */}
        <section className="closing-cta reveal">
          <h2>תפסיק לנחש. תתחיל לשאול.</h2>
          <p>
            הצטרף לבעלי עסקים שכבר חוסכים זמן וכסף על ייעוץ מס בסיסי — עם תשובות
            מדויקות בעברית, מבוססות מקורות רשמיים.
          </p>
          <Link className="btn btn-on-dark btn-lg" href={startHref}>
            {startLabel}
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <Link className="logo" href="/" aria-label="ChatTAX — דף הבית">
              <span className="logo-badge">
                <LogoMark />
              </span>
              ChatTAX
            </Link>
            <p>
              עוזר מיסוי חכם לבעלי עסקים בישראל — בעברית, מבוסס מקורות רשמיים.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>מוצר</h4>
              <ul>
                <li>
                  <Link href="/pricing">תוכניות</Link>
                </li>
                <li>
                  <a href="#how">איך זה עובד</a>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>משפטי</h4>
              <ul>
                <li>
                  <Link href="/terms">תנאי שימוש</Link>
                </li>
                <li>
                  <Link href="/privacy">מדיניות פרטיות</Link>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>חשבון</h4>
              <ul>
                <li>
                  <Link href="/login">התחברות</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="wrap footer-legal">
          <p>
            ChatTAX מספק מידע כללי בלבד ואינו מהווה ייעוץ מקצועי או תחליף
            לרו&quot;ח מוסמך. שיעורי מס ותקרות מתעדכנים — יש לאמת במקורות הרשמיים
            (רשות המסים, ביטוח לאומי). © 2026 ChatTAX.
          </p>
        </div>
      </footer>
    </div>
  );
}
