# 🚀 SkinBank Beta | Virtual Case Simulator

SkinBank is a full-stack web application designed to simulate the opening of cases. The project was created with a focus on transaction security, algorithmic fairness, and modern database architecture. 

> ⚠️ **Important:** The project’s economy is based exclusively on virtual points (tokens). There is no real money, deposits, or withdrawals involved. The project was created for educational purposes (Portfolio Project).

## ✨ Key Features

* **Bulletproof Economy (ACID):** The use of `$transaction` in the database ensures that the user’s balance is reliably protected against spam clicks and race conditions.
* **Provably Fair:** The roulette engine uses the SHA-256 cryptographic algorithm to generate random numbers, making rigging impossible.
* **Cloud Database:** Integration with PostgreSQL via Supabase using the latest `@prisma/adapter-pg`.
* **API Protection:** Built-in `express-rate-limit` to protect endpoints from flooding.

## 🛠 Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (Supabase) + Prisma ORM 7
* **Frontend:** HTML5, Vanilla JS, TailwindCSS
* **Authentication:** express-session (currently implements a mock Steam Auth for local testing)

## 🚀 How to run locally

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/username/repo.git
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set environment variables:**
   Create a `.env` file in the project root and add your PostgreSQL database connection string:
   \`\`\`env
   DATABASE_URL=“postgresql://user:password@host:port/db”
   \`\`\`

4. **Synchronize the database and populate it:**
   \`\`\`bash
   npx prisma generate
   npx prisma db push
   node prisma/seed.js
   \`\`\`

5. **Start the server:**
   \`\`\`bash
   node index.js
   \`\`\`
   The application will be available at: `http://localhost:3000`

---
*Developed with 💻 and ☕ in 2026.*
