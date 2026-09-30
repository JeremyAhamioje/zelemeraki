"""Build the Journal (blog) as static pages.

    python tools/build_journal.py

Posts are HTML fragments in content/journal/<slug>.html; metadata lives in POSTS
below (newest first). Output: blog/index.html, blog/<slug>.html, sitemap.xml, robots.txt.
"""
import html
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://zelemeraki.design"
WHATSAPP = "2348030656011"

POSTS = [
    {
        "slug": "planning-a-build-in-lagos",
        "title": "Planning a build in Lagos: what to sort out before the first block is laid",
        "short": "Planning a build in Lagos",
        "category": "Construction",
        "date": "2026-09-12",
        "read": 6,
        "image": "construction.jpg",
        "alt": "Construction team reviewing a site foundation",
        "standfirst": "Title, soil, approvals and a budget for what you can't see — the groundwork that decides how a project ends.",
    },
    {
        "slug": "minimalism-that-feels-like-home",
        "title": "Minimalism that still feels like home",
        "short": "Minimalism that still feels like home",
        "category": "Interiors",
        "date": "2026-08-28",
        "read": 5,
        "image": "interiors.jpg",
        "alt": "Soft neutral living room with rounded furniture and woven mirrors",
        "standfirst": "Calm doesn't have to mean cold. Light, warm materials and hidden storage make a quiet room you actually want to live in.",
    },
    {
        "slug": "renovate-or-rebuild",
        "title": "Renovate or rebuild? Five questions we ask first",
        "short": "Renovate or rebuild?",
        "category": "Renovation",
        "date": "2026-08-14",
        "read": 5,
        "image": "renovation.jpg",
        "alt": "Bright open-plan space after renovation",
        "standfirst": "Structure, layout, cost, approvals and how long you can live without the space — the questions that settle it.",
    },
    {
        "slug": "building-at-home-from-abroad",
        "title": "Building at home from abroad: how virtual design works",
        "short": "Building at home from abroad",
        "category": "Virtual design",
        "date": "2026-07-30",
        "read": 4,
        "image": "lagos.jpg",
        "alt": "Aerial view of Ikoyi and the Lagos lagoon",
        "standfirst": "For clients in the diaspora: design on screen, one team on the ground, and progress you can see from anywhere.",
    },
]

WA_SVG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.57-.34M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.29A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z"/></svg>')


def esc(s):
    return html.escape(s, quote=True)


def nice_date(iso):
    d = date.fromisoformat(iso)
    return f"{d.day} {d.strftime('%B %Y')}"


def head(title, description, url, image, extra=""):
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="{'article' if extra else 'website'}">
  <meta property="og:site_name" content="Zelemeraki Design">
  <meta property="og:locale" content="en_NG">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:image" content="{image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(description)}">
  <meta name="twitter:image" content="{image}">
  <meta name="theme-color" content="#F3EEE7">
  <link rel="icon" href="/assets/favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="alternate" type="application/rss+xml" title="Zelemeraki Design — Journal" href="/blog/feed.xml">
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css">
{extra}</head>
<body>
"""


NAV = """  <header class="nav is-scrolled" id="nav" data-solid>
    <a href="/" class="brand" aria-label="Zelemeraki Design — home">
      <img class="brand-mark brand-mark-dark" src="/assets/logo.png" alt="" width="571" height="466">
      <img class="brand-mark brand-mark-light" src="/assets/logo-light.png" alt="" width="571" height="466">
      <span class="brand-word">Zelemeraki<small>Design</small></span>
    </a>
    <nav class="nav-links" aria-label="Primary">
      <a href="/#studio">Studio</a>
      <a href="/#services">Services</a>
      <a href="/#projects">Projects</a>
      <a href="/#process">Process</a>
      <a href="/blog/" aria-current="page">Journal</a>
      <a href="/#contact">Contact</a>
    </nav>
    <a href="/#contact" class="btn btn-ghost nav-cta">Book a consultation</a>
    <button class="menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
      <span></span><span></span>
    </button>
  </header>

  <div class="mobile-menu" id="mobile-menu" hidden>
    <a href="/#studio">Studio</a>
    <a href="/#services">Services</a>
    <a href="/#projects">Projects</a>
    <a href="/#process">Process</a>
    <a href="/blog/">Journal</a>
    <a href="/#contact">Contact</a>
    <a href="/#contact" class="btn btn-solid">Book a consultation</a>
  </div>
"""

FOOT = f"""
  <footer class="footer">
    <div class="footer-top">
      <div class="footer-brand">
        <img src="/assets/logo-light.png" alt="" width="571" height="466" loading="lazy">
        <p class="footer-big">Zelemeraki<em> Design</em></p>
      </div>
      <a href="/#contact" class="btn btn-light">Book a consultation</a>
    </div>
    <div class="footer-cols">
      <div>
        <h4>Studio</h4>
        <p>Lekki, Lagos, Nigeria<br>Mon – Sat · 9am – 6pm</p>
      </div>
      <div>
        <h4>Services</h4>
        <p>Architecture<br>Construction<br>Renovation<br>Interiors<br>Exterior &amp; Landscaping</p>
      </div>
      <div>
        <h4>Follow</h4>
        <p><a href="https://instagram.com/zelemeraki.design" target="_blank" rel="noopener">Instagram</a><br>
        <a href="https://facebook.com/zelemeraki.studio" target="_blank" rel="noopener">Facebook</a><br>
        <a href="/blog/">The Journal</a></p>
      </div>
      <div>
        <h4>Art</h4>
        <p>Looking for original artwork?<br><a href="https://zelemeraki.studio" target="_blank" rel="noopener">Visit Zelemeraki Studio →</a></p>
      </div>
    </div>
    <div class="footer-base">
      <span>© <span id="year">2026</span> Zelemeraki Design. All rights reserved.</span>
      <a href="#top">Back to top ↑</a>
    </div>
  </footer>

  <a class="wa-float" href="https://wa.me/{WHATSAPP}?text=Hello%20Zelemeraki%20Design%2C%20I%27d%20like%20to%20talk%20about%20a%20project." target="_blank" rel="noopener" aria-label="Chat with Zelemeraki Design on WhatsApp">
    <span class="wa-label">Chat with us</span>
    <span class="wa-icon">{WA_SVG}</span>
  </a>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.3.21/dist/lenis.min.js" defer></script>
  <script src="/assets/js/main.js" defer></script>
  <script src="/assets/js/blog.js" defer></script>
</body>
</html>
"""


def img_attrs(p, sizes="(max-width: 560px) 100vw, (max-width: 860px) 50vw, 33vw"):
    """Responsive WebP for display; the .jpg stays for social previews."""
    stem = p["image"].rsplit(".", 1)[0]
    full = 1600 if stem == "lagos" else 1400
    return (f'src="/assets/img/{stem}.webp" srcset="/assets/img/{stem}-900.webp 900w, '
            f'/assets/img/{stem}.webp {full}w" sizes="{sizes}"')


def card(p, reveal=True):
    return f"""        <a class="post-card{' reveal' if reveal else ''}" href="/blog/{p['slug']}">
          <div class="post-card-img"><img {img_attrs(p)} alt="{esc(p['alt'])}" loading="lazy"></div>
          <span class="post-meta"><b>{esc(p['category'])}</b> · {nice_date(p['date'])}</span>
          <h3>{esc(p['short'])}</h3>
          <p>{esc(p['standfirst'])}</p>
        </a>"""


def build_index():
    first, rest = POSTS[0], POSTS[1:]
    page = head(
        "Journal — Zelemeraki Design",
        "Notes from a Lagos design & build studio: planning a build, renovating well, calm interiors and designing from abroad.",
        f"{SITE}/blog/", f"{SITE}/assets/og.jpg",
    ) + NAV + f"""
  <main id="top">
    <header class="journal-head">
      <p class="eyebrow" data-intro>The Journal</p>
      <h1>Notes on building <em>calm.</em></h1>
      <p data-intro>Practical guidance and quiet ideas from our studio — on planning, building, renovating and living well in the spaces we make.</p>
    </header>

    <a class="post-feature" href="/blog/{first['slug']}">
      <div class="arch" data-clip><img {img_attrs(first, "(max-width: 860px) 100vw, 40vw")} alt="{esc(first['alt'])}"></div>
      <div class="reveal">
        <span class="post-meta"><b>{esc(first['category'])}</b> · {nice_date(first['date'])} · {first['read']} min read</span>
        <h2>{esc(first['title'])}</h2>
        <p>{esc(first['standfirst'])}</p>
        <span class="link-arrow">Read the article <span aria-hidden="true">→</span></span>
      </div>
    </a>

    <section class="post-grid" aria-label="More articles">
{chr(10).join(card(p) for p in rest)}
    </section>
  </main>
""" + FOOT
    (ROOT / "blog").mkdir(exist_ok=True)
    (ROOT / "blog" / "index.html").write_text(page, encoding="utf-8")


def build_post(p):
    body = (ROOT / "content" / "journal" / f"{p['slug']}.html").read_text(encoding="utf-8")
    url = f"{SITE}/blog/{p['slug']}"
    image = f"{SITE}/assets/img/{p['image']}"
    ld = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": p["title"], "description": p["standfirst"], "image": image,
        "datePublished": p["date"], "dateModified": p["date"], "mainEntityOfPage": url,
        "author": {"@type": "Organization", "name": "Zelemeraki Design", "url": SITE},
        "publisher": {"@type": "Organization", "name": "Zelemeraki Design",
                      "logo": {"@type": "ImageObject", "url": f"{SITE}/assets/apple-touch-icon.png"}},
    }
    extra = (f'  <meta property="article:published_time" content="{p["date"]}">\n'
             f'  <meta property="article:section" content="{esc(p["category"])}">\n'
             f'  <script type="application/ld+json">{json.dumps(ld)}</script>\n')
    more = [q for q in POSTS if q is not p][:2]
    page = head(f"{p['title']} — Zelemeraki Design", p["standfirst"], url, image, extra) + NAV + f"""
  <main id="top">
    <article>
      <header class="article-head">
        <p class="crumbs" data-intro><a href="/blog/">Journal</a> &nbsp;/&nbsp; {esc(p['category'])}</p>
        <h1>{esc(p['title'])}</h1>
        <p class="standfirst" data-intro>{esc(p['standfirst'])}</p>
        <p class="post-meta" data-intro style="margin-top:22px">{nice_date(p['date'])} · {p['read']} min read · Zelemeraki Design</p>
      </header>
      <figure class="article-cover" style="margin:0 auto">
        <div class="arch" data-clip><img {img_attrs(p, "(max-width: 760px) 100vw, 760px")} alt="{esc(p['alt'])}" fetchpriority="high"></div>
      </figure>
      <div class="prose">
{body}
      </div>
      <aside class="article-cta reveal">
        <p class="eyebrow" style="margin:0">Planning something?</p>
        <h3>Let's talk about <em>your space.</em></h3>
        <p>Book a consultation — in person across Lagos &amp; Nigeria, or virtually wherever you are.</p>
        <a href="/#contact" class="btn btn-solid">Book a consultation</a>
      </aside>
    </article>

    <section class="article-more">
      <p class="eyebrow">Keep reading</p>
      <div class="post-grid">
{chr(10).join(card(q) for q in more)}
      </div>
    </section>
  </main>
""" + FOOT
    (ROOT / "blog" / f"{p['slug']}.html").write_text(page, encoding="utf-8")


def build_feeds():
    urls = [(f"{SITE}/", POSTS[0]["date"]), (f"{SITE}/blog/", POSTS[0]["date"])]
    urls += [(f"{SITE}/blog/{p['slug']}", p["date"]) for p in POSTS]
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sitemap += [f"  <url><loc>{u}</loc><lastmod>{d}</lastmod></url>" for u, d in urls]
    sitemap.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sitemap) + "\n", encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")

    items = "".join(
        f"""
    <item>
      <title>{esc(p['title'])}</title>
      <link>{SITE}/blog/{p['slug']}</link>
      <guid>{SITE}/blog/{p['slug']}</guid>
      <pubDate>{date.fromisoformat(p['date']).strftime('%a, %d %b %Y')} 09:00:00 +0100</pubDate>
      <description>{esc(p['standfirst'])}</description>
    </item>""" for p in POSTS)
    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Zelemeraki Design — Journal</title>
    <link>{SITE}/blog/</link>
    <description>Notes on building calm, from a Lagos design &amp; build studio.</description>
    <language>en-ng</language>{items}
  </channel>
</rss>
"""
    (ROOT / "blog" / "feed.xml").write_text(rss, encoding="utf-8")


if __name__ == "__main__":
    build_index()
    for post in POSTS:
        build_post(post)
    build_feeds()
    print(f"Built journal: {len(POSTS)} posts")
