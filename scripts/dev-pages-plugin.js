import { categoriesIndexPage, categoryPage, CATEGORIES, projectPage, projectsBySlug, projectsIndexPage, sitemapXml, } from "./lib/page-templates";
export function devPagesPlugin() {
    return {
        name: "syso-dev-pages",
        apply: "serve",
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const rawUrl = req.url ?? "/";
                // strip query string
                const url = rawUrl.split("?")[0];
                const send = (html) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "text/html; charset=utf-8");
                    res.setHeader("Cache-Control", "no-cache");
                    res.end(html);
                };
                // /projects/<slug>/  (with or without trailing slash)
                const projectMatch = url.match(/^\/projects\/([^/]+)\/?$/);
                if (projectMatch) {
                    const slug = projectMatch[1];
                    // /projects/ → projects index (matched separately below)
                    if (slug === "" || slug === "index.html") {
                        return send(projectsIndexPage());
                    }
                    const project = projectsBySlug.get(slug);
                    if (!project)
                        return next();
                    return send(projectPage(project));
                }
                // /projects (no trailing slash) or /projects/
                if (url === "/projects" || url === "/projects/") {
                    return send(projectsIndexPage());
                }
                // /categories/<cat>/
                const categoryMatch = url.match(/^\/categories\/([^/]+)\/?$/);
                if (categoryMatch) {
                    const cat = categoryMatch[1];
                    if (!CATEGORIES[cat])
                        return next();
                    return send(categoryPage(cat));
                }
                // /categories or /categories/
                if (url === "/categories" || url === "/categories/") {
                    return send(categoriesIndexPage());
                }
                // /sitemap.xml — also serve in dev for testing
                if (url === "/sitemap.xml") {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/xml; charset=utf-8");
                    res.end(sitemapXml());
                    return;
                }
                return next();
            });
        },
    };
}
