function hideUnavailableMedia(media) {
  media.hidden = true;
  const parent = media.parentElement;
  if (parent?.matches(".runing-up, .runing-down")) {
    if ([...parent.querySelectorAll("img")].every(image => image.hidden)) {
      parent.hidden = true;
    }
    return;
  }
  parent?.classList.add("media-fallback");
}

document.querySelectorAll("img").forEach(img => {
  img.addEventListener("error", () => hideUnavailableMedia(img), { once: true });
  if (img.complete && img.naturalWidth === 0) hideUnavailableMedia(img);
});

const videos = [...document.querySelectorAll("video")];
function loadVideo(video) {
  const source = video.querySelector("source[data-src]");
  if (!source) return;
  source.src = source.dataset.src;
  source.removeAttribute("data-src");
  video.load();
}

videos.forEach(video => {
  video.addEventListener("error", () => { video.hidden = true; }, { once: true });
  video.addEventListener("loadeddata", () => video.classList.add("is-ready"), { once: true });
});

if ("IntersectionObserver" in window) {
  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.intersectionRatio === 0) return;
      loadVideo(entry.target);
      videoObserver.unobserve(entry.target);
    });
  }, { rootMargin: "0px" });
  videos.forEach(video => videoObserver.observe(video));
} else {
  videos.forEach(loadVideo);
}

const cursor = document.querySelector(".cursor");
if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const glow = document.querySelector(".cursor-glow");
  const label = cursor.querySelector(".cursor-label");
  let pointerX = 0, pointerY = 0, cursorX = 0, cursorY = 0, glowX = 0, glowY = 0;
  let cursorFrame = 0;
  let hasPointer = false;

  function followPointer() {
    glowX += (pointerX - glowX) * 0.12;
    glowY += (pointerY - glowY) * 0.12;
    glow.style.left = `${glowX}px`;
    glow.style.top = `${glowY}px`;

    if (Math.abs(pointerX - glowX) > 0.5 || Math.abs(pointerY - glowY) > 0.5) {
      cursorFrame = window.requestAnimationFrame(followPointer);
    } else {
      cursorFrame = 0;
    }
  }

  window.addEventListener("pointermove", event => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!hasPointer) {
      glowX = pointerX;
      glowY = pointerY;
      glow.style.left = `${glowX}px`;
      glow.style.top = `${glowY}px`;
      hasPointer = true;
    }
    cursor.style.left = `${pointerX}px`;
    cursor.style.top = `${pointerY}px`;
    cursor.classList.add("on");
    glow.classList.add("on");
    if (!cursorFrame) cursorFrame = window.requestAnimationFrame(followPointer);
  });
  document.addEventListener("pointerover", event => {
    const target = event.target.closest("a, button, img");
    if (!target) return;
    const isImage = target.matches("img");
    cursor.classList.toggle("is-view", isImage);
    cursor.classList.add("is-active");
    glow.classList.add("is-active");
    label.textContent = isImage ? "Lihat" : "";
  });
  document.addEventListener("pointerout", event => {
    const target = event.target.closest("a, button, img");
    const nextTarget = event.relatedTarget?.closest?.("a, button, img");
    if (!target || nextTarget) return;
    cursor.classList.remove("is-active", "is-view");
    glow.classList.remove("is-active");
    label.textContent = "";
  });
}

if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
  document.querySelector(".loader")?.remove();
  document.querySelectorAll(".stat b").forEach(stat => { stat.textContent = stat.dataset.n; });
  document.querySelector(".duel")?.classList.add("is-static");
} else {
gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Pecah teks jadi huruf (untuk .split) */
document.querySelectorAll(".split").forEach(el => {
  const text = el.textContent;
  el.setAttribute("aria-label", text);
  el.innerHTML = text.split(" ").map(w =>
    `<span class="w">${[...w].map(c => `<span class="ch" aria-hidden="true">${c}</span>`).join("")}</span>`
  ).join(" ");
});

/* Loader lalu intro hero */
function heroIntro() {
  if (reduce) return;
  const tl = gsap.timeline();
  tl.from(".nav", { y: -60, opacity: 0, duration: 0.8, ease: "power3.out" })
    .fromTo(".title span", { yPercent: 120, rotate: 8, opacity: 0 },
      { yPercent: 0, rotate: 0, opacity: 1, duration: 1.2, stagger: 0.12, ease: "expo.out" }, 0.2)
    .fromTo(".sub", { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8 }, 0.6)
    .fromTo(".scroll-hint", { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1);
  gsap.to(".scroll-hint i", { scaleY: 0.2, repeat: -1, yoyo: true, duration: 1, ease: "sine.inOut" });
}

const counter = { v: 0 };
const countEl = document.getElementById("count");
if (reduce) {
  document.querySelector(".loader")?.remove();
} else {
  gsap.timeline({ onComplete: () => document.querySelector(".loader")?.remove() })
    .to(counter, {
      v: 100, duration: 1.8, ease: "power2.inOut",
      onUpdate: () => { countEl.textContent = Math.round(counter.v); }
    })
    .to(".loader-bar i", { width: "100%", duration: 1.8, ease: "power2.inOut" }, 0)
    .to(".loader", { yPercent: -100, opacity: 0, duration: 0.9, ease: "power4.inOut" })
    .call(heroIntro, null, "-=0.5");
}

if (!reduce) {
  /* Progress bar scroll */
  gsap.to(".progress", {
    scaleX: 1, ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 }
  });

  /* Parallax video */
  document.querySelectorAll(".parallax-video").forEach(v => {
    gsap.to(v, {
      yPercent: -12, ease: "none",
      scrollTrigger: { trigger: v.parentElement, start: "top bottom", end: "bottom top", scrub: true }
    });
  });
  gsap.fromTo(".shinobu-bg", { "--shinobu-parallax": "4%" }, {
    "--shinobu-parallax": "-4%", ease: "none",
    scrollTrigger: { trigger: ".shinobu-bg", start: "top bottom", end: "bottom top", scrub: true }
  });

  /* Judul AKAZA menghilang saat scroll */
  gsap.to(".akaza-content", {
    yPercent: -60, opacity: 0, ease: "none",
    scrollTrigger: { trigger: ".akaza-bg", start: "top top", end: "bottom top", scrub: true }
  });

  /* Teks huruf per huruf */
  document.querySelectorAll(".split").forEach(el => {
    gsap.from(el.querySelectorAll(".ch"), {
      yPercent: 110, opacity: 0, rotate: 6,
      duration: 0.9, stagger: 0.03, ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play reverse play reverse" }
    });
  });

  /* Panel Tanjiro */
  gsap.from(".tanjiro-content", {
    opacity: 0, scale: 0.85, z: -150, duration: 1.2, ease: "power3.out",
    scrollTrigger: { trigger: ".tanjiro-bg", start: "top 60%", toggleActions: "play reverse play reverse" }
  });

  /* Galeri berjalan tanpa putus (gandakan isi lalu geser setengahnya) */
  function marquee(sel, dir) {
    const row = document.querySelector(sel);
    if (row.hidden || !row.children.length) return;
    row.innerHTML += row.innerHTML;
    row.innerHTML += row.innerHTML;
    const half = row.scrollWidth / 2;
    gsap.fromTo(row,
      { x: dir > 0 ? -half : 0 },
      { x: dir > 0 ? 0 : -half, duration: 30, ease: "none", repeat: -1 });
  }
  window.addEventListener("load", () => {
    marquee(".runing-up", 1);
    marquee(".runing-down", -1);
  });

  /* Duel: horizontal di desktop, stacked di layar kecil */
  const duelMedia = gsap.matchMedia();
  function animateDuelCards(containerAnimation) {
    document.querySelectorAll(".card").forEach(card => {
      const inner = card.querySelector(".c-inner");
      const st = {
        trigger: card,
        start: containerAnimation ? "left 85%" : "top 85%",
        toggleActions: "play none none reverse"
      };
      if (containerAnimation) st.containerAnimation = containerAnimation;
      gsap.set(inner, { transformPerspective: 900 });
      gsap.from(inner, { y: 70, opacity: 0, rotationY: -14, duration: 1, ease: "power3.out", scrollTrigger: st });
      gsap.from(card.querySelectorAll(".c-body > *"), { y: 30, opacity: 0, stagger: 0.1, duration: 0.8, delay: 0.2, scrollTrigger: st });
      gsap.from(card.querySelectorAll(".bar i"), { scaleX: 0, transformOrigin: "left", duration: 1.2, stagger: 0.15, delay: 0.6, ease: "power3.out", scrollTrigger: st });

      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const rx = gsap.quickTo(inner, "rotationY", { duration: 0.5, ease: "power3" });
        const ry = gsap.quickTo(inner, "rotationX", { duration: 0.5, ease: "power3" });
        card.addEventListener("mousemove", e => {
          const r = inner.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          rx((px - 0.5) * 10); ry(-(py - 0.5) * 10);
          inner.style.setProperty("--mx", px * 100 + "%");
          inner.style.setProperty("--my", py * 100 + "%");
        });
        card.addEventListener("mouseleave", () => { rx(0); ry(0); });
      }
    });
  }

  duelMedia.add("(min-width: 701px)", () => {
    const track = document.querySelector(".duel-track");
    const indicator = document.querySelector(".duel-progress");
    const fill = document.querySelector(".duel-progress-fill");
    const dots = [...document.querySelectorAll(".duel-dots li")];
    const scrollDist = () => Math.max(track.scrollWidth - window.innerWidth, 1);
    const hScroll = gsap.to(track, {
      x: () => -scrollDist(), ease: "none",
      scrollTrigger: {
        trigger: ".duel", pin: true, scrub: 0.8,
        start: "top top", end: () => "+=" + scrollDist(),
        invalidateOnRefresh: true,
        onUpdate: self => {
          const current = Math.round(self.progress * (dots.length - 1));
          fill.style.transform = `translateY(-50%) scaleX(${self.progress})`;
          indicator.setAttribute("aria-valuenow", current);
          indicator.setAttribute("aria-valuetext", `Panel ${current + 1} dari ${dots.length}`);
          dots.forEach((dot, index) => dot.classList.toggle("is-current", index === current));
        }
      }
    });
    animateDuelCards(hScroll);
  });

  duelMedia.add("(max-width: 700px)", () => {
    document.querySelector(".duel-hint").textContent = "Scroll untuk melihat kartu satu per satu.";
    gsap.from(".panel.intro > *", {
      y: 36, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: ".panel.intro", start: "top 80%", toggleActions: "play none none reverse" }
    });
    animateDuelCards(null);
  });

  /* Hitung angka statistik */
  document.querySelectorAll(".stat b").forEach(b => {
    const target = +b.dataset.n;
    const o = { v: 0 };
    gsap.to(o, {
      v: target, duration: 2, ease: "power2.out",
      onUpdate: () => b.textContent = Math.round(o.v),
      scrollTrigger: { trigger: b, start: "top 85%", once: true }
    });
  });
  gsap.from(".stat", {
    y: 36, opacity: 0, stagger: 0.14, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".stats", start: "top 78%", toggleActions: "play none none reverse" }
  });


  /* Band kanji: jalan terus, makin cepat saat scroll kencang */
  const bandRow = document.querySelector(".band-row");
  bandRow.innerHTML += bandRow.innerHTML;
  const bandTween = gsap.to(bandRow, { xPercent: -50, duration: 25, ease: "none", repeat: -1 });
  ScrollTrigger.create({
    onUpdate: self => {
      bandTween.timeScale(1 + Math.abs(self.getVelocity()) / 200);
      gsap.to(bandTween, { timeScale: 1, duration: 0.6, overwrite: true });
    }
  });

  /* Kutipan: kata menyala mengikuti scroll */
  const q = document.getElementById("quoteText");
  q.innerHTML = q.textContent.split(" ").map(w => `<span class="qw">${w}</span>`).join("");
  gsap.fromTo(".qw", { opacity: 0.12 }, {
    opacity: 1, stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: ".quote", start: "top 65%", end: "bottom 60%", scrub: true }
  });

  /* Timeline: garis tergambar, item masuk dari kanan */
  gsap.from(".tl-line", {
    scaleY: 0, ease: "none",
    scrollTrigger: { trigger: ".tl", start: "top 70%", end: "bottom 70%", scrub: true }
  });
  gsap.utils.toArray(".tl-item").forEach(it => {
    gsap.from(it, {
      y: 60, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: it, start: "top 85%", toggleActions: "play none none reverse" }
    });
  });


  /* Foto timeline: terbuka dari kiri + zoom keluar */
  gsap.utils.toArray(".tl-item figure").forEach(f => {
    const img = f.querySelector("img");
    gsap.fromTo(f, { clipPath: "inset(0 100% 0 0)" }, {
      clipPath: "inset(0 0% 0 0)", duration: 1.2, ease: "power4.out",
      scrollTrigger: { trigger: f, start: "top 85%", toggleActions: "play none none reverse" }
    });
    if (img) {
      gsap.fromTo(img, { scale: 1.35 }, { scale: 1, ease: "none",
        scrollTrigger: { trigger: f, start: "top bottom", end: "bottom 40%", scrub: true } });
    }
  });


  /* Shinobu */
  const shTrig = { trigger: ".shinobu-bg", start: "top 40%", toggleActions: "play reverse play reverse" };
  gsap.fromTo(".title2 span", { yPercent: 120, rotate: 8, opacity: 0 },
    { yPercent: 0, rotate: 0, opacity: 1, duration: 1.2, stagger: 0.12, ease: "expo.out", scrollTrigger: shTrig });
  gsap.fromTo(".shinobu-content .char-eyebrow", { x: -30, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.8, delay: 0.3, scrollTrigger: shTrig });
  gsap.from(".shinobu-content .shinobu-bio, .shinobu-content .shinobu-stat", {
    y: 24, opacity: 0, stagger: 0.1, duration: 0.7, ease: "power3.out", scrollTrigger: shTrig
  });
  gsap.to(".shinobu-content", {
    yPercent: -60, opacity: 0, ease: "none",
    scrollTrigger: { trigger: ".shinobu-bg", start: "center top", end: "bottom top", scrub: true }
  });

  /* Giyu: kolase parallax + grid muncul berurutan */
  gsap.utils.toArray(".gc").forEach(f => {
    gsap.to(f, {
      y: +f.dataset.speed, ease: "none",
      scrollTrigger: { trigger: ".giyu-top", start: "top bottom", end: "bottom top", scrub: true }
    });
  });
  gsap.from(".giyu-copy > *:not(.giyu-name)", {
    y: 40, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".giyu-copy", start: "top 75%", toggleActions: "play none none reverse" }
  });
  gsap.from(".giyu-grid figure", {
    y: 70, opacity: 0, scale: 0.94, stagger: 0.15, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".giyu-grid", start: "top 85%", toggleActions: "play none none reverse" }
  });

  /* Bagian akhir */
  gsap.from(".big span", {
    yPercent: 100, opacity: 0, stagger: 0.2, duration: 1.2, ease: "expo.out",
    scrollTrigger: { trigger: ".end", start: "top 60%", toggleActions: "play reverse play reverse" }
  });

  /* Tombol magnet */
  const btn = document.getElementById("btnTop");
  btn.addEventListener("mousemove", e => {
    const r = btn.getBoundingClientRect();
    gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.35, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.3 });
  });
  btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" }));
} else {
  document.querySelectorAll(".stat b").forEach(stat => { stat.textContent = stat.dataset.n; });
  document.querySelector(".duel").classList.add("is-static");
}

/* Navigasi & tombol atas pakai scroll GSAP-friendly */
document.querySelectorAll(".nav a").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute("href"));
    window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
  });
});
document.getElementById("btnTop").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
}