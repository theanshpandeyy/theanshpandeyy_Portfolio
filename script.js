document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    /* ============================================================
       HELPERS
    ============================================================ */

    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

    function resetAndAnimate(el, from, to, delay) {
        delay = delay || 0;
        Object.assign(el.style, from, { transition: "none" });
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                el.style.transition = "opacity 0.7s ease " + delay + "s, transform 0.7s ease " + delay + "s";
                Object.assign(el.style, to);
            });
        });
    }

    // Observe an element; call onEnter / onLeave when visibility changes.
    function watch(el, threshold, onEnter, onLeave) {
        if (!el) return;
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) onEnter(entry);
                else if (onLeave) onLeave(entry);
            });
        }, { threshold: threshold });
        obs.observe(el);
    }

    // Timer bucket so pending staggered timeouts can be cancelled on reset.
    function createTimers() {
        var ids = [];
        return {
            set: function (fn, ms) { ids.push(setTimeout(fn, ms)); },
            clear: function () { ids.forEach(clearTimeout); ids.length = 0; }
        };
    }

    // Generic animated-canvas runner (animates only while host is visible).
    function runCanvas(opts) {
        var canvas = opts.canvas, host = opts.host;
        if (!canvas || !host) return;
        var ctx = canvas.getContext("2d");
        var state = { w: 0, h: 0, items: [] };
        var raf = null;

        function resize() {
            var src = opts.sizeFrom || host;
            state.w = canvas.width = src.offsetWidth;
            state.h = canvas.height = src.offsetHeight || opts.fallbackHeight || 400;
            state.items = opts.init(state.w, state.h);
        }

        function loop(t) {
            ctx.clearRect(0, 0, state.w, state.h);
            opts.frame(ctx, state, t);
            raf = requestAnimationFrame(loop);
        }

        watch(host, 0.01,
            function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); },
            function () { cancelAnimationFrame(raf); }
        );
        window.addEventListener("resize", resize);
        resize();
    }

    // Draw connecting lines between nearby items.
    function drawLinks(ctx, items, maxDist, color, alphaScale) {
        for (var i = 0; i < items.length; i++) {
            for (var j = i + 1; j < items.length; j++) {
                var dx = items[i].x - items[j].x;
                var dy = items[i].y - items[j].y;
                var d = Math.sqrt(dx * dx + dy * dy);
                if (d < maxDist) {
                    ctx.beginPath();
                    ctx.moveTo(items[i].x, items[i].y);
                    ctx.lineTo(items[j].x, items[j].y);
                    ctx.strokeStyle = "rgba(" + color + "," + ((1 - d / maxDist) * alphaScale) + ")";
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    // 3D tilt + shine effect for cards.
    function initTilt(cards, cfg) {
        cards.forEach(function (card) {
            var inner = $(cfg.inner, card);
            var shine = $(cfg.shine, card);
            if (!inner) return;
            var bounds = null, raf = null;

            card.addEventListener("mouseenter", function () {
                bounds = card.getBoundingClientRect();
            });

            card.addEventListener("mousemove", function (e) {
                if (!bounds) bounds = card.getBoundingClientRect();
                cancelAnimationFrame(raf);
                raf = requestAnimationFrame(function () {
                    var dx = (e.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2);
                    var dy = (e.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2);
                    inner.style.transition = "box-shadow 0.4s ease, border-color 0.4s ease";
                    inner.style.transform = "perspective(" + cfg.perspective + "px) rotateX(" + (-dy * cfg.rotate) +
                        "deg) rotateY(" + (dx * cfg.rotate) + "deg) translateZ(" + cfg.z + "px)";
                    if (shine) {
                        var px = ((e.clientX - bounds.left) / bounds.width) * 100;
                        var py = ((e.clientY - bounds.top) / bounds.height) * 100;
                        shine.style.background = "radial-gradient(" + cfg.shineSize + "px circle at " + px + "% " + py +
                            "%, rgba(255,255,255,0.09) 0%, transparent " + cfg.shineStop + "%)";
                    }
                });
            });

            card.addEventListener("mouseleave", function () {
                cancelAnimationFrame(raf);
                bounds = null;
                inner.style.transition = "transform 0.55s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease, border-color 0.4s ease";
                inner.style.transform = "perspective(" + cfg.perspective + "px) rotateX(0) rotateY(0) translateZ(0)";
                if (shine) shine.style.background = "none";
            });
        });
    }


    /* ============================================================
       1. NAVIGATION (hamburger, smooth scroll, active link)
    ============================================================ */

    (function initNavigation() {
        var hamburger = document.getElementById("hamburger");
        var navLinks = document.getElementById("navLinks");

        if (hamburger && navLinks) {
            hamburger.addEventListener("click", function () {
                hamburger.classList.toggle("active");
                navLinks.classList.toggle("active");
            });

            $$("a", navLinks).forEach(function (link) {
                link.addEventListener("click", function () {
                    hamburger.classList.remove("active");
                    navLinks.classList.remove("active");
                });
            });
        }

        // Smooth scrolling for every in-page anchor (nav, footer, back-to-top, buttons)
        $$('a[href^="#"]').forEach(function (link) {
            var href = link.getAttribute("href");
            if (!href || href.length < 2) return;
            link.addEventListener("click", function (e) {
                var target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });

        // Active nav link while scrolling
        var links = navLinks ? $$("a", navLinks) : [];
        var sections = ["home", "about", "skills", "projects", "contact"]
            .map(function (id) { return document.getElementById(id); })
            .filter(Boolean);

        if (links.length && sections.length) {
            var navObs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var id = entry.target.id;
                    links.forEach(function (a) {
                        a.classList.toggle("active", a.getAttribute("href") === "#" + id);
                    });
                });
            }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
            sections.forEach(function (s) { navObs.observe(s); });
        }
    })();


    /* ============================================================
       2. SCROLL-ANIMATE SECTIONS (.scroll-animate -> .active)
    ============================================================ */

    $$(".scroll-animate").forEach(function (section) {
        watch(section, 0.15,
            function () { section.classList.add("active"); },
            function () { section.classList.remove("active"); }
        );
    });


    /* ============================================================
       3. HERO — slide in
    ============================================================ */

    (function initHero() {
        var section = document.getElementById("home");
        var text = $(".hero-text");
        var image = $(".hero-image");
        if (!section) return;

        var hiddenText = { opacity: "0", transform: "translateX(-50px)" };
        var hiddenImage = { opacity: "0", transform: "translateX(50px)" };
        var shown = { opacity: "1", transform: "translateX(0)" };

        if (text) Object.assign(text.style, hiddenText);
        if (image) Object.assign(image.style, hiddenImage);

        watch(section, 0.2,
            function () {
                if (text) resetAndAnimate(text, hiddenText, shown);
                if (image) resetAndAnimate(image, hiddenImage, shown, 0.2);
            },
            function () {
                if (text) Object.assign(text.style, hiddenText, { transition: "none" });
                if (image) Object.assign(image.style, hiddenImage, { transition: "none" });
            }
        );
    })();


    /* ============================================================
       4. ABOUT — slide in, stat cards stagger, counters
    ============================================================ */

    (function initAbout() {
        var section = document.getElementById("about");
        var text = $(".about-text");
        var stats = $(".about-stats");
        var cards = $$(".stat-card");
        if (!section) return;

        var hiddenText = { opacity: "0", transform: "translateX(-60px)" };
        var hiddenStats = { opacity: "0", transform: "translateX(60px)" };
        var hiddenCard = { opacity: "0", transform: "translateY(40px) scale(0.95)" };
        var shown = { opacity: "1", transform: "translateX(0)" };
        var shownCard = { opacity: "1", transform: "translateY(0) scale(1)" };

        var configs = [
            { target: 3, suffix: "+", duration: 2800 },
            { target: 8, suffix: "+", duration: 3200 },
            { target: 100, suffix: "%", duration: 4000 },
            { target: null, text: "Data Analyst" }
        ];

        var timers = createTimers();
        var counterRafs = [];

        if (text) Object.assign(text.style, hiddenText);
        if (stats) Object.assign(stats.style, hiddenStats);
        cards.forEach(function (c) { Object.assign(c.style, hiddenCard); });

        function ease(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function animateCounter(el, index, target, suffix, duration) {
            var start = performance.now();
            function tick(now) {
                var progress = Math.min((now - start) / duration, 1);
                el.textContent = Math.round(ease(progress) * target) + suffix;
                if (progress < 1) counterRafs[index] = requestAnimationFrame(tick);
                else el.textContent = target + suffix;
            }
            counterRafs[index] = requestAnimationFrame(tick);
        }

        function resetCounters() {
            timers.clear();
            counterRafs.forEach(cancelAnimationFrame);
            counterRafs.length = 0;
            cards.forEach(function (card, i) {
                var h3 = $("h3", card);
                var cfg = configs[i];
                if (!h3 || !cfg) return;
                h3.textContent = cfg.target === null ? cfg.text : "0" + cfg.suffix;
            });
        }

        function runCounters() {
            cards.forEach(function (card, i) {
                var h3 = $("h3", card);
                var cfg = configs[i];
                if (!h3 || !cfg || cfg.target === null) return;
                timers.set(function () {
                    animateCounter(h3, i, cfg.target, cfg.suffix, cfg.duration);
                }, i * 250);
            });
        }

        watch(section, 0.2,
            function () {
                resetCounters();
                if (text) resetAndAnimate(text, hiddenText, shown);
                if (stats) resetAndAnimate(stats, hiddenStats, shown, 0.2);
                cards.forEach(function (card, i) {
                    resetAndAnimate(card, hiddenCard, shownCard, i * 0.1);
                });
                timers.set(runCounters, 300);
            },
            function () {
                if (text) Object.assign(text.style, hiddenText, { transition: "none" });
                if (stats) Object.assign(stats.style, hiddenStats, { transition: "none" });
                cards.forEach(function (c) { Object.assign(c.style, hiddenCard, { transition: "none" }); });
                resetCounters();
            }
        );
    })();


    /* ============================================================
       5. SKILLS — background canvas, cards, rings, counters, tilt
    ============================================================ */

    (function initSkills() {
        var section = document.getElementById("skills");
        if (!section) return;

        var bg = document.getElementById("skillsBgCanvas");

        runCanvas({
            canvas: bg,
            host: section,
            sizeFrom: bg,
            init: function (w, h) {
                var items = [];
                var n = Math.floor(w * h / 13000);
                for (var i = 0; i < n; i++) {
                    items.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        vx: (Math.random() - 0.5) * 0.28,
                        vy: (Math.random() - 0.5) * 0.28,
                        r: Math.random() * 1.8 + 0.5,
                        a: Math.random() * 0.3 + 0.08,
                        hue: Math.random() > 0.5 ? 255 : 188
                    });
                }
                return items;
            },
            frame: function (ctx, s, t) {
                s.items.forEach(function (p) {
                    p.x = (p.x + p.vx + s.w) % s.w;
                    p.y = (p.y + p.vy + s.h) % s.h;
                    var pulse = Math.sin(t * 0.0009 + p.x * 0.02) * 0.06;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = "hsla(" + p.hue + ",75%,72%," + (p.a + pulse) + ")";
                    ctx.fill();
                });
                drawLinks(ctx, s.items, 95, "167,139,250", 0.07);
            }
        });

        var CIRCUM = 2 * Math.PI * 52;
        var cards = $$(".skill-card[data-skill-tilt]");
        var rings = $$(".circle-fill");
        var percents = $$(".circle-percent");
        var timers = createTimers();
        var intervals = [];

        rings.forEach(function (ring) { ring.style.strokeDasharray = CIRCUM; });

        function fillCircles() {
            rings.forEach(function (ring, i) {
                var val = parseFloat(ring.getAttribute("data-value")) || 0;
                var offset = CIRCUM - (val / 100) * CIRCUM;
                ring.style.transition = "none";
                ring.style.strokeDashoffset = CIRCUM;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        ring.style.transition = "stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1) " + (i * 0.12) + "s";
                        ring.style.strokeDashoffset = offset;
                    });
                });
            });
        }

        function resetCircles() {
            rings.forEach(function (ring) {
                ring.style.transition = "none";
                ring.style.strokeDashoffset = CIRCUM;
            });
        }

        function runCounters() {
            percents.forEach(function (el, i) {
                var target = parseInt(el.getAttribute("data-target"), 10) || 0;
                var current = 0;
                el.textContent = "0%";
                timers.set(function () {
                    var id = setInterval(function () {
                        current = Math.min(current + 2, target);
                        el.textContent = current + "%";
                        if (current >= target) clearInterval(id);
                    }, 20);
                    intervals.push(id);
                }, i * 130);
            });
        }

        function resetCounters() {
            timers.clear();
            intervals.forEach(clearInterval);
            intervals.length = 0;
            percents.forEach(function (el) { el.textContent = "0%"; });
        }

        function resetCards() {
            cards.forEach(function (card) {
                card.style.transition = "none";
                card.style.opacity = "0";
                card.style.transform = "translateY(45px) scale(0.95)";
            });
        }

        function animateCards() {
            cards.forEach(function (card, i) {
                timers.set(function () {
                    card.style.transition = "opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)";
                    card.style.opacity = "1";
                    card.style.transform = "translateY(0) scale(1)";
                }, i * 100);
            });
        }

        initTilt(cards, {
            inner: ".skill-card-inner",
            shine: ".skill-card-shine",
            perspective: 900,
            rotate: 9,
            z: 10,
            shineSize: 380,
            shineStop: 65
        });

        watch(section, 0.12,
            function () {
                resetCounters();
                animateCards();
                timers.set(function () { fillCircles(); runCounters(); }, 250);
            },
            function () {
                resetCounters();
                resetCards();
                resetCircles();
            }
        );

        resetCards();
        resetCircles();
        resetCounters();
    })();


    /* ============================================================
       6. PROJECTS — background canvas, cards, tilt
    ============================================================ */

    (function initProjects() {
        var section = document.getElementById("projects");
        if (!section) return;

        var COLS = 22, ROWS = 14;
        var bg = document.getElementById("projectsBg");

        runCanvas({
            canvas: bg,
            host: section,
            sizeFrom: bg,
            init: function (w, h) {
                var items = [];
                var colGap = w / COLS, rowGap = h / ROWS;
                for (var r = 0; r <= ROWS; r++) {
                    for (var c = 0; c <= COLS; c++) {
                        items.push({
                            x: c * colGap,
                            y: r * rowGap,
                            ox: c * colGap,
                            oy: r * rowGap,
                            r: Math.random() * 1.4 + 0.5,
                            alpha: Math.random() * 0.4 + 0.1,
                            speed: Math.random() * 0.008 + 0.004,
                            phase: Math.random() * Math.PI * 2
                        });
                    }
                }
                return items;
            },
            frame: function (ctx, s, t) {
                s.items.forEach(function (d) {
                    d.x = d.ox + Math.sin(t * d.speed + d.phase) * 18;
                    d.y = d.oy + Math.cos(t * d.speed * 0.7 + d.phase) * 14;
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(148,163,184," + d.alpha + ")";
                    ctx.fill();
                });
                drawLinks(ctx, s.items, 90, "148,163,184", 0.08);
            }
        });

        var cards = $$(".project-card[data-tilt]");
        var timers = createTimers();

        initTilt(cards, {
            inner: ".card-inner",
            shine: ".card-shine",
            perspective: 1000,
            rotate: 10,
            z: 8,
            shineSize: 400,
            shineStop: 60
        });

        function resetCards() {
            cards.forEach(function (card) {
                card.style.transition = "none";
                card.style.opacity = "0";
                card.style.transform = "translateY(50px) scale(0.96)";
            });
        }

        function animateCards() {
            cards.forEach(function (card, i) {
                timers.set(function () {
                    card.style.transition = "opacity 0.65s ease, transform 0.65s cubic-bezier(0.34, 1.2, 0.64, 1)";
                    card.style.opacity = "1";
                    card.style.transform = "translateY(0) scale(1)";
                }, i * 120);
            });
        }

        // "Coming soon" button should not jump the page
        $$(".action-disabled").forEach(function (btn) {
            btn.addEventListener("click", function (e) { e.preventDefault(); });
        });

        watch(section, 0.1,
            function () { timers.clear(); animateCards(); },
            function () { timers.clear(); resetCards(); }
        );

        resetCards();
    })();


    /* ============================================================
       7. CONTACT — animated background + form behavior
    ============================================================ */

    (function initContact() {
        var section = document.getElementById("contact");
        if (!section) return;

        // Decorative layers (inserted behind content, styled in style.css)
        [1, 2, 3].forEach(function (i) {
            var div = document.createElement("div");
            div.classList.add("contact-aurora", "contact-aurora-" + i);
            section.insertBefore(div, section.firstChild);
        });

        var grid = document.createElement("div");
        grid.classList.add("contact-grid");
        section.insertBefore(grid, section.firstChild);

        var canvas = document.createElement("canvas");
        canvas.id = "contactBgCanvas";
        section.insertBefore(canvas, section.firstChild);

        runCanvas({
            canvas: canvas,
            host: section,
            fallbackHeight: 600,
            init: function (w, h) {
                var items = [];
                for (var i = 0; i < 55; i++) {
                    items.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        vx: (Math.random() - 0.5) * 0.35,
                        vy: (Math.random() - 0.5) * 0.35,
                        r: Math.random() * 1.8 + 0.4,
                        alpha: Math.random() * 0.35 + 0.08,
                        hue: Math.random() > 0.6 ? 200 : (Math.random() > 0.5 ? 240 : 270)
                    });
                }
                return items;
            },
            frame: function (ctx, s, t) {
                s.items.forEach(function (p) {
                    p.x = (p.x + p.vx + s.w) % s.w;
                    p.y = (p.y + p.vy + s.h) % s.h;
                    var pulse = Math.sin(t * 0.0007 + p.x * 0.015) * 0.06;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = "hsla(" + p.hue + ",80%,70%," + (p.alpha + pulse) + ")";
                    ctx.fill();
                });
                drawLinks(ctx, s.items, 110, "56,189,248", 0.06);
            }
        });

        // Form: stop page reload, show feedback, clear fields
        var form = $("form", section);
        var button = form ? $(".contact-btn", form) : null;
        if (form) {
            var originalLabel = button ? button.textContent : "";
            var resetTimer = null;

            form.addEventListener("submit", function (e) {
                e.preventDefault();
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                form.reset();
                if (button) {
                    button.textContent = "Message Sent!";
                    button.disabled = true;
                    clearTimeout(resetTimer);
                    resetTimer = setTimeout(function () {
                        button.textContent = originalLabel;
                        button.disabled = false;
                    }, 2500);
                }
            });
        }
    })();


    /* ============================================================
       8. FOOTER — entrance animation
    ============================================================ */

    (function initFooter() {
        var footer = $(".footer");
        if (!footer) return;

        var parts = [$(".footer-inner"), $(".footer-bottom-bar")].filter(Boolean);
        var timers = createTimers();

        function hide() {
            parts.forEach(function (el) {
                el.style.transition = "none";
                el.style.opacity = "0";
                el.style.transform = "translateY(30px)";
            });
        }

        hide();

        watch(footer, 0.1,
            function () {
                timers.clear();
                parts.forEach(function (el, i) {
                    timers.set(function () {
                        el.style.transition = "opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)";
                        el.style.opacity = "1";
                        el.style.transform = "translateY(0)";
                    }, i * 150);
                });
            },
            function () { timers.clear(); hide(); }
        );
    })();


    /* ============================================================
       9. TYPING ANIMATION (.typing)
    ============================================================ */

    (function initTyping() {
        var el = $(".typing");
        if (!el) return;

        var roles = ["Data Analyst","Power BI Developer", "SQL Developer", "AI/ML Enthusiast"];
        var roleIndex = 0, charIndex = 0, deleting = false;

        function type() {
            var role = roles[roleIndex];

            if (!deleting) {
                charIndex++;
                el.textContent = role.substring(0, charIndex);
                if (charIndex === role.length) {
                    setTimeout(function () { deleting = true; type(); }, 1200);
                    return;
                }
            } else {
                charIndex--;
                el.textContent = role.substring(0, charIndex);
                if (charIndex === 0) {
                    deleting = false;
                    roleIndex = (roleIndex + 1) % roles.length;
                }
            }

            setTimeout(type, deleting ? 60 : 110);
        }

        type();
    })();

});
