# Grouping

Visual grouping UI: items as avatar chips, groups as circles, drag-and-drop with [@dnd-kit](https://github.com/clauderic/dnd-kit). **Two root circles** can overlap (intersection adds **both** groups). **Nested groups** render as an inner circle (e.g. Sprint crew inside Core team); overlapping parent+child droppables resolve to the **deepest** group only—ancestors are implied by the tree. State is in-memory; persistence will go behind an API (e.g. AWS RDS) later.

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build   # production build to dist/
npm run preview
```

Copy `.env.example` to `.env` when you add a public API base URL (`VITE_API_BASE_URL`). Never put RDS credentials or raw DB URLs in the frontend.

## GitHub

Remote: [https://github.com/i83992473/grouping.git](https://github.com/i83992473/grouping.git)

After cloning, `origin` should point at that URL. Push from an account that can write to the repo:

```bash
git push -u origin main
```

If you see **403 Permission denied**, your machine is using another GitHub user (for example via cached HTTPS credentials or a different `gh auth` session). Sign in as the repo owner or use a **personal access token** with `repo` scope, or switch to **SSH** (`git@github.com:i83992473/grouping.git`) with a key registered on the correct GitHub account.

## AWS Amplify (hosting)

This repo includes [`amplify.yml`](amplify.yml) so **Amplify Hosting** can run `npm ci` and `npm run build` and publish the `dist/` output.

1. In the [AWS Amplify console](https://console.aws.amazon.com/amplify/), create an app and connect the GitHub repository.
2. Use the default build settings; Amplify will detect `amplify.yml` at the repository root.
3. For **local** AWS CLI work (for example Amplify CLI, or other AWS commands you run on your machine), use the **`aws-admin`** profile so your account and permissions stay explicit:

   **Windows (PowerShell)**

   ```powershell
   $env:AWS_PROFILE = 'aws-admin'
   ```

   **macOS / Linux**

   ```bash
   export AWS_PROFILE=aws-admin
   ```

   CI builds triggered from GitHub use Amplify’s service role in AWS, not your laptop profile.

## RDS persistence (planned)

- The browser should talk to an **API** (REST or GraphQL) only. The API (Lambda, ECS, App Runner, etc.) holds the RDS connection string or secret and runs queries.
- Store secrets in **AWS Secrets Manager** or **SSM Parameter Store**, referenced by the compute layer—not in Amplify frontend env vars for database passwords.
- This app can later replace in-memory React state with `fetch`/`axios` calls to `getApiBaseUrl()` from [`src/lib/env.ts`](src/lib/env.ts).

## License

Private / unpublished unless you add a license file.
