# API, Docker, CI/CD, and Azure Design

Date: 2026-10-08
Status: Proposed for user review

## Goal

Follow the deployment sequence in the supplied Part 4 slides while making the existing user API runnable and testable with Postman. Keep MongoDB Atlas as the database. Keep the existing public page as-is; this task focuses on API and deployment plumbing.

## Current findings

- `src/index.ts` currently starts a Hello World server. The MongoDB connection, API routes, health endpoint, and static serving code below it are commented out.
- User CRUD routes and a Mongoose User model already exist in `src/UserRoute.ts`, `src/UserController.ts`, and `src/User.ts`. The model hashes passwords and omits them from JSON responses.
- `npm test` is a placeholder that always exits unsuccessfully. `src/Test1.ts` has a small addition check.
- The current Dockerfile runs `npm install` and copies the full working directory. The Docker ignore list does not exclude `.env`.
- The repository's `.gitignore` ignores files by default, including Docker and lock files, so the required deliverables need explicit allowlist entries.
- Existing uncommitted work from the prior user requests must be preserved.

## Proposed behavior

### API and local use

- Enable JSON parsing, the existing `/api/users` routes, a health route, and the existing static public directory.
- Connect to Atlas using `MONGODB_URI`; read `PORT` with a default of 3000.
- Fail startup clearly if the Mongo connection string is missing or invalid, and only listen after Atlas connects.
- Keep the existing validation, duplicate-email handling, and password hashing behavior.
- Document Postman requests to create and inspect a user, including expected status codes and sample request JSON. Never include a real database URI or password in examples.

### Tests and CI

- Replace the placeholder `npm test` with a deterministic test command that does not require live Atlas credentials.
- Keep the existing basic utility check and add useful unit checks for API input validation if the validation logic can be isolated cleanly.
- Run install, tests, and TypeScript build in GitHub Actions for pushes and pull requests.
- Use the same supported Node major version for CI and the container build.

### Docker and Compose

- Use a production-oriented multi-stage image built from the lockfile with `npm ci`.
- Ensure `.env`, `.env.*`, local dependencies, and Git metadata cannot enter the image.
- Allowlist the Dockerfile, Docker ignore file, Compose file, and lockfile in `.gitignore`.
- Provide a Compose service for this API only. It connects to the existing Atlas database through local `.env`; do not add a local MongoDB or MySQL container.

### Docker Hub publishing

- Add a GitHub Actions workflow that builds and pushes the image when a GitHub Release is published, and on manual dispatch with a required reason input as shown in the slides.
- Use Docker's official login, metadata, and build-push actions at supported stable versions.
- Read the Docker Hub username and access token from GitHub Actions repository secrets. Read the image name from a repository variable or an equally clear, documented setting.
- Never commit credentials or copy the token-like string visible in the PDF screenshot.

### Azure Container Instances

- Document the portal steps for creating a Linux container group from the published image, exposing port 3000, setting the app's environment, verifying its public endpoint, and cleaning up afterward.
- Pass `MONGODB_URI` through ACI's secure environment-variable field.
- Explain that Atlas accepts clients only from entries in its IP access list. ACI's default outbound IP is different from the public inbound IP and is not exposed programmatically; a stable restricted egress address requires additional network setup such as a VNet and Azure Firewall. Do not recommend opening Atlas to all IP addresses as the default.
- Do not create cloud resources or incur cloud charges from this repository task. The user will create the Docker Hub credentials, GitHub secrets/variables, and ACI resource in their own accounts following the guide.

## Acceptance criteria

1. The API starts after Atlas connection succeeds and responds on the configured port.
2. Postman can create a user at `POST /api/users`; duplicate email and invalid input return useful errors; the response never contains the password or password hash.
3. Automated tests and the TypeScript build can run without a production database secret.
4. Docker image builds from a clean checkout and excludes `.env` and local-only files.
5. Compose starts the API with the Atlas URI supplied through local environment configuration.
6. GitHub Actions validates pull requests and publishes an image on a published Release or manual dispatch.
7. The guide explains all account and cloud steps the user must perform, including secret setup, Atlas network access, Postman checks, and stopping/deleting ACI to control costs.

## Out of scope

- Creating or managing Docker Hub, GitHub, Azure, or MongoDB Atlas account settings through external services.
- Automatically deploying Azure resources from GitHub Actions.
- Adding authentication/authorization to the user CRUD API.
- Changing the existing public page design.
