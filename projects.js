/* ============================================================
   PROJECTS  -  yahin se saare project cards banenge.

   NAYA PROJECT ADD KARNE KE LIYE:
   1. Image ko `projects/` folder me daalo (jaise projects/my-project.png)
   2. Neeche `PROJECTS` list me kisi ek { ... }, block ko copy karke
      sabse neeche paste karo aur values badal do.
   3. Save -> git add -> commit -> push. Bas!

   FIELDS:
   image      : image ka path (projects/ folder ke andar)
   alt        : image ka chhota description
   title      : project ka naam
   desc       : 1-2 line ka description
   tags       : upar ke chhote colored badges
                color: blue | purple | green | orange | cyan | pink | gold | red
                icon : Font Awesome icon (optional), jaise "fa-chart-bar"
   tech       : neeche ke chhote pills (tools/technologies)
   github     : GitHub repo ka link   ("" chhodo to button nahi dikhega)
   live       : Live demo ka link     ("" chhodo to button nahi dikhega)
   comingSoon : true karo to "Coming Soon" badge aur disabled button dikhega
   ============================================================ */

var PROJECTS = [
    {
        image: "projects/sales-analysis.png",
        alt: "Sales Analysis Dashboard",
        title: "Sales Analysis Dashboard",
        desc: "Insights into revenue trends, top-selling products and regional performance with interactive charts, KPIs and filters for data-driven decisions.",
        tags: [
            { label: "Power BI", color: "blue", icon: "fa-chart-bar" },
            { label: "Data Viz", color: "purple" }
        ],
        tech: ["Power BI", "DAX"],
        github: "https://github.com/theanshpandeyy/Sales-Analysis-Dashboard",
        live: ""
    },
    {
        image: "projects/bank-loan-analysis.png",
        alt: "Bank Loan Analysis",
        title: "Bank Loan Analysis",
        // TODO: description aur tech apne repo ke hisaab se check kar lo
        desc: "Loan portfolio analysis covering applications, approvals, repayment performance and risk to support better lending decisions.",
        tags: [
            { label: "Banking", color: "green", icon: "fa-university" },
            { label: "Data Viz", color: "orange" }
        ],
        tech: ["Power BI", "SQL"],
        github: "https://github.com/theanshpandeyy/Banking-Loan-Analytics",
        live: ""
    },
    {
        image: "projects/retail-sales-analysis.png",
        alt: "Retail Sales Analysis",
        title: "Retail Sales Analysis",
        // TODO: description aur tech apne repo ke hisaab se check kar lo
        desc: "In-depth retail sales analysis uncovering top products, customer buying patterns and data-driven trend discovery.",
        tags: [
            { label: "Retail", color: "cyan", icon: "fa-shopping-cart" },
            { label: "Analytics", color: "pink" }
        ],
        tech: ["SQL", "Excel"],
        github: "https://github.com/theanshpandeyy/retail-sales-analytics",
        live: ""
    },
    {
        image: "projects/python-project.png",
        alt: "Upcoming Python Project",
        title: "Python Data Project",
        // TODO: project final hone par title aur description badal dena
        desc: "Upcoming end-to-end Python project covering data cleaning, exploratory analysis and visualization.",
        tags: [
            { label: "Python", color: "gold", icon: "fa-code" },
            { label: "EDA", color: "red" }
        ],
        tech: ["Python", "Pandas", "NumPy", "Matplotlib"],
        github: "",
        live: "",
        comingSoon: true
    }

    /* ---- NAYA PROJECT: is block ko copy karke upar wale ke baad ek comma (,) lagao ----
    {
        image: "projects/new-project.png",
        alt: "New Project",
        title: "Project Ka Naam",
        desc: "Project ke baare me 1-2 line.",
        tags: [
            { label: "Python", color: "blue", icon: "fa-code" },
            { label: "EDA", color: "green" }
        ],
        tech: ["Python", "Pandas"],
        github: "https://github.com/theanshpandeyy/repo-name",
        live: ""
    }
    ------------------------------------------------------------------------------ */
];


/* ============================================================
   RENDERER  (isko chhedne ki zarurat nahi)
   ============================================================ */

(function renderProjects() {
    var container = document.getElementById("projectsContainer");
    if (!container) return;

    function esc(text) {
        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function externalLink(url, cls, inner, title) {
        return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" class="' + cls + '"' +
            (title ? ' title="' + esc(title) + '"' : "") + ">" + inner + "</a>";
    }

    var html = PROJECTS.map(function (p, i) {
        var num = (i + 1 < 10 ? "0" : "") + (i + 1);

        var tags = (p.tags || []).map(function (t) {
            var icon = t.icon ? '<i class="fas ' + esc(t.icon) + '"></i> ' : "";
            return '<span class="tag tag-' + esc(t.color || "blue") + '">' + icon + esc(t.label) + "</span>";
        }).join("");

        var tech = (p.tech || []).map(function (t) {
            return '<span class="tech-pill">' + esc(t) + "</span>";
        }).join("");

        // hover pe image ke upar aane wale round icons
        var overlay = "";
        if (!p.comingSoon) {
            if (p.live)   overlay += externalLink(p.live, "overlay-btn", '<i class="fas fa-external-link-alt"></i>', "Live Demo");
            if (p.github) overlay += externalLink(p.github, "overlay-btn", '<i class="fab fa-github"></i>', "GitHub");
        }
        overlay = overlay ? '<div class="overlay-icons">' + overlay + "</div>" : "";

        // neeche ke bade buttons
        var actions = "";
        if (p.comingSoon) {
            actions = '<a href="#" class="action-btn action-demo action-disabled"><i class="fas fa-clock"></i> In Progress</a>';
        } else {
            if (p.live)   actions += externalLink(p.live, "action-btn action-demo", '<i class="fas fa-rocket"></i> Live Demo');
            if (p.github) actions += externalLink(p.github, "action-btn action-github", '<i class="fab fa-github"></i> View on GitHub');
        }

        return '' +
            '<div class="project-card' + (p.comingSoon ? " project-card--coming" : "") + '" data-tilt>' +
              '<div class="card-inner">' +
                '<div class="card-shine"></div>' +
                '<div class="card-glow"></div>' +
                (p.comingSoon ? '<div class="coming-soon-badge">Coming Soon</div>' : "") +
                '<div class="project-img-wrap">' +
                  '<img src="' + esc(p.image) + '" alt="' + esc(p.alt || p.title) + '" loading="lazy" onerror="this.style.display=&quot;none&quot;">' +
                  '<div class="img-overlay">' + overlay + "</div>" +
                  '<div class="card-number">' + num + "</div>" +
                "</div>" +
                '<div class="project-content">' +
                  '<div class="project-tags">' + tags + "</div>" +
                  '<h3 class="project-title">' + esc(p.title) + "</h3>" +
                  '<p class="project-desc">' + esc(p.desc) + "</p>" +
                  '<div class="tech-stack">' + tech + "</div>" +
                  (actions ? '<div class="card-actions">' + actions + "</div>" : "") +
                "</div>" +
              "</div>" +
            "</div>";
    }).join("");

    container.innerHTML = html;
})();
