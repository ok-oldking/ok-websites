# OK websites

Static multilingual project and documentation website for [ok-script](https://github.com/ok-oldking/ok-script) and related projects. The generated output lives in `static/`; the production web server serves only those files.

## Local development

```bash
npm install
npm start
```

Open `http://localhost:4173`. Generation clones or updates every repository in `projects.json`, converts its configured Markdown documentation, copies referenced local assets, fetches public repository metadata, and writes the complete static site. Run `npm test` to verify required routes and internal links.

## Add a project or language

Edit `projects.json`. A project defines its Git repository, domain, output folder, MkDocs configuration, and known locales. `mkdocs.yml` is the source of truth for page inclusion, titles, and navigation order. Additional language folders such as `ko/index.md` are discovered automatically from its navigation and receive their own static locale prefix. Run `npm run generate` afterward.

## Deployment

Copy `deploy.config.example.json` to `deploy.config.local.json` and enter the server details, or set the matching `DEPLOY_*` environment variables. The local configuration file is ignored by Git.

```bash
npm run generate
npm test
npm run deploy
```

Server deployment uploads one immutable release, switches the `current` symlink only after extraction, installs/reloads nginx, and verifies all three hosts. Each project domain serves its own generated folder at `/`: `ok-ww.ok-script.com` serves `static/ok-ww`, while `app.ok-script.com` serves `static/app`. Shared assets remain under `static/assets`.

The GitHub Actions workflow regenerates and validates the site every day and on pushes to `main`, then publishes `static/` as a GitHub Pages artifact. Enable **Settings → Pages → Source → GitHub Actions** once in the repository.

DNS should point both `ok-script.com` and `*.ok-script.com` at the production server. nginx maps the main domain and other wildcard hosts to the framework site, with exact virtual hosts for `ok-ww.ok-script.com` and `app.ok-script.com`. Add a trusted TLS certificate at the server or reverse-proxy layer before enforcing HTTPS.
