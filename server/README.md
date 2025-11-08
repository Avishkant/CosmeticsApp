# Server (Express) — CosmeticsApp

This folder contains a minimal Express + Mongoose backend scaffold for the cosmetics e-commerce app.

Quick start

1. Copy or edit `.env` in this folder (there is a `.env` file in repo root of this folder already). Ensure `DATABASE_URL` points to your MongoDB instance.
2. Install dependencies:

```powershell
cd server
npm install
```

3. Run the dev server (uses nodemon):

```powershell
npm run dev
```

4. Health: GET http://localhost:5000/health
   Products: GET http://localhost:5000/api/products

Auth endpoints

- POST http://localhost:5000/api/auth/register (body: {name,email,password})
- POST http://localhost:5000/api/auth/login (body: {email,password})

Image uploads

- POST http://localhost:5000/api/products/:id/images (multipart form, field `images`) — requires admin JWT and Cloudinary env vars configured.

Meilisearch

- If you set `MEILI_HOST` and `MEILI_API_KEY` in `.env` the server will index products to a `products` index automatically on create/update/delete.

Notes

- Add authentication and role-based middleware before using admin routes in production.
- This is a scaffold; production readiness (rate-limiting, helmet, CORS config, validation) must be added.

Seeding sample data

1. Ensure your MongoDB is running and `DATABASE_URL` in `.env` is correct.
2. From the `server` folder run:

```powershell
node seed.js
```

This will insert a couple of sample products to help frontend development.
