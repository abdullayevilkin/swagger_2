const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(express.json());

// ════════════════════════════════════════════════════════════
//  DATABASE  (datas.json)
// ════════════════════════════════════════════════════════════
const DB_PATH = path.join(__dirname, "datas.json");

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
const saveDB = (db) => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");

// ════════════════════════════════════════════════════════════
//  AUTH CONFIG
// ════════════════════════════════════════════════════════════
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-prod";
const JWT_EXPIRES = "8h";
const CREDENTIALS = { login: "admin", password: "admin" };

const authenticate = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer "))
        return res.status(401).json({ message: "Authorization header tapılmadı" });
    const token = authHeader.split(" ")[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ message: "Token etibarsız və ya müddəti bitib" });
    }
};

// ════════════════════════════════════════════════════════════
//  SWAGGER CONFIG
// ════════════════════════════════════════════════════════════
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Banking CRUD API",
            version: "2.0.0",
            description:
                "Node.js / Express ilə yazılmış tam bank API-si. Bütün data **datas.json** faylında saxlanılır.\n\n" +
                "**Kateqoriyalar:**\n" +
                "- 🔑 **Auth** — Token alma (GetToken)\n" +
                "- 👤 **Users** — İstifadəçi idarəetməsi\n" +
                "- 🪪 **User Profiles** — Ətraflı şəxsi məlumatlar\n" +
                "- 💳 **Cards** — Kart hesabları (PAN, balans, limit və s.)\n" +
                "- 🔄 **Transactions** — Əməliyyat tarixçəsi",
        },
        servers: [{ url: "http://localhost:3000", description: "Local server" }],
        security: [{ BearerAuth: [] }],
        tags: [
            { name: "Auth", description: "Token alma — GetToken" },
            { name: "Users", description: "İstifadəçi CRUD əməliyyatları" },
            { name: "User Profiles", description: "İstifadəçinin ətraflı şəxsi məlumatları" },
            { name: "Cards", description: "Kart hesabları — PAN, balans, limit, status" },
            { name: "Transactions", description: "Kart əməliyyat tarixçəsi" },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "**GetToken** endpointindən aldığınız JWT tokeni daxil edin.",
                },
            },
            schemas: {
                // ── Auth ─────────────────────────────────────────
                LoginInput: {
                    type: "object",
                    required: ["login", "password"],
                    properties: {
                        login: { type: "string", example: "admin" },
                        password: { type: "string", example: "admin" },
                    },
                },
                TokenResponse: {
                    type: "object",
                    properties: {
                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                        expiresIn: { type: "string", example: "8h" },
                        tokenType: { type: "string", example: "Bearer" },
                    },
                },
                // ── User ─────────────────────────────────────────
                User: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        name: { type: "string", example: "Anar Məmmədov" },
                        email: { type: "string", example: "anar@example.com" },
                        age: { type: "integer", example: 28 },
                    },
                },
                UserInput: {
                    type: "object",
                    required: ["name", "email"],
                    properties: {
                        name: { type: "string", example: "Nigar Əliyeva" },
                        email: { type: "string", example: "nigar@example.com" },
                        age: { type: "integer", example: 30 },
                    },
                },
                // ── Profile ──────────────────────────────────────
                Profile: {
                    type: "object",
                    properties: {
                        userId: { type: "integer", example: 1 },
                        phone: { type: "string", example: "+994501234567" },
                        address: { type: "string", example: "Bakı, Nərimanov r., Atatürk 12" },
                        birthDate: { type: "string", format: "date", example: "1996-03-15" },
                        nationality: { type: "string", example: "AZ" },
                        gender: { type: "string", enum: ["male", "female", "other"], example: "male" },
                        occupation: { type: "string", example: "Software Engineer" },
                        pinCode: { type: "string", example: "1234" },
                    },
                },
                ProfileInput: {
                    type: "object",
                    properties: {
                        phone: { type: "string", example: "+994501234567" },
                        address: { type: "string", example: "Bakı, Nərimanov r., Atatürk 12" },
                        birthDate: { type: "string", format: "date", example: "1996-03-15" },
                        nationality: { type: "string", example: "AZ" },
                        gender: { type: "string", enum: ["male", "female", "other"] },
                        occupation: { type: "string", example: "Software Engineer" },
                        pinCode: { type: "string", example: "1234" },
                    },
                },
                // ── Card ─────────────────────────────────────────
                Card: {
                    type: "object",
                    properties: {
                        id: { type: "integer", example: 1 },
                        userId: { type: "integer", example: 1 },
                        pan: { type: "string", example: "4169738012345678" },
                        maskedPan: { type: "string", example: "4169 **** **** 5678" },
                        cardHolder: { type: "string", example: "ANAR MAMMADOV" },
                        expiryDate: { type: "string", example: "12/27" },
                        cvv: { type: "string", example: "123" },
                        type: { type: "string", enum: ["VISA", "MasterCard", "Amex"] },
                        cardType: { type: "string", enum: ["debit", "credit"] },
                        currency: { type: "string", example: "AZN" },
                        balance: { type: "number", example: 1250.75 },
                        availableBalance: { type: "number", example: 1100.00 },
                        creditLimit: { type: "number", example: 3000.00 },
                        status: { type: "string", enum: ["active", "blocked", "expired", "closed"] },
                        isDefault: { type: "boolean", example: true },
                        createdAt: { type: "string", format: "date" },
                    },
                },
                CardInput: {
                    type: "object",
                    required: ["cardHolder", "type", "cardType", "currency"],
                    properties: {
                        cardHolder: { type: "string", example: "ANAR MAMMADOV" },
                        type: { type: "string", enum: ["VISA", "MasterCard", "Amex"] },
                        cardType: { type: "string", enum: ["debit", "credit"] },
                        currency: { type: "string", example: "AZN" },
                        creditLimit: { type: "number", example: 5000.00 },
                        isDefault: { type: "boolean", example: false },
                    },
                },
                CardStatusUpdate: {
                    type: "object",
                    required: ["status"],
                    properties: {
                        status: { type: "string", enum: ["active", "blocked", "expired", "closed"] },
                    },
                },
                // ── Transaction ───────────────────────────────────
                Transaction: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "TXN-001" },
                        cardId: { type: "integer", example: 1 },
                        userId: { type: "integer", example: 1 },
                        amount: { type: "number", example: 45.50 },
                        currency: { type: "string", example: "AZN" },
                        type: { type: "string", enum: ["debit", "credit"] },
                        category: { type: "string", example: "shopping" },
                        merchant: { type: "string", example: "Bravo Supermarket" },
                        description: { type: "string", example: "Ərzaq alışı" },
                        status: { type: "string", enum: ["pending", "completed", "failed", "reversed"] },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                TransactionInput: {
                    type: "object",
                    required: ["cardId", "amount", "currency", "type"],
                    properties: {
                        cardId: { type: "integer", example: 1 },
                        amount: { type: "number", example: 50.00 },
                        currency: { type: "string", example: "AZN" },
                        type: { type: "string", enum: ["debit", "credit"] },
                        category: { type: "string", example: "food" },
                        merchant: { type: "string", example: "McDonald's" },
                        description: { type: "string", example: "Nahər" },
                    },
                },
                // ── Generic ──────────────────────────────────────
                Error: {
                    type: "object",
                    properties: { message: { type: "string" } },
                },
            },
        },
    },
    apis: ["./server.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: { docExpansion: "list", defaultModelsExpandDepth: 1 },
}));

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════
const generatePan = (type) => {
    const prefix = type === "MasterCard" ? "5273" : type === "Amex" ? "3714" : "4169";
    const body = Array.from({ length: 3 }, () => String(Math.floor(Math.random() * 9000) + 1000)).join("");
    const last = String(Math.floor(Math.random() * 9000) + 1000);
    return `${prefix}${body}${last}`.slice(0, 16);
};
const maskPan = (pan) => `${pan.slice(0, 4)} **** **** ${pan.slice(-4)}`;
const generateExpiry = () => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 3);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
};
const generateCvv = () => String(Math.floor(Math.random() * 900) + 100);
const generateTxnId = (num) => `TXN-${String(num).padStart(3, "0")}`;

// ════════════════════════════════════════════════════════════
//  🔑  AUTH
// ════════════════════════════════════════════════════════════

/**
 * @swagger
 * /getToken:
 *   post:
 *     summary: Login edib JWT token al
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginInput' }
 *     responses:
 *       200:
 *         description: Token uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TokenResponse' }
 *       401:
 *         description: Login və ya şifrə yanlışdır
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.post("/getToken", (req, res) => {
    const { login, password } = req.body;
    if (login !== CREDENTIALS.login || password !== CREDENTIALS.password)
        return res.status(401).json({ message: "Login və ya şifrə yanlışdır" });
    const token = jwt.sign({ login, role: "admin" }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, expiresIn: JWT_EXPIRES, tokenType: "Bearer" });
});

// ════════════════════════════════════════════════════════════
//  👤  USERS
// ════════════════════════════════════════════════════════════

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Bütün istifadəçiləri gətir
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Ada görə axtarış
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 */
app.get("/users", authenticate, (req, res) => {
    const { users } = readDB();
    const { name } = req.query;
    const result = name ? users.filter((u) => u.name.toLowerCase().includes(name.toLowerCase())) : users;
    res.json(result);
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: ID ilə istifadəçi gətir
 *     tags: [Users]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.get("/users/:id", authenticate, (req, res) => {
    const { users } = readDB();
    const user = users.find((u) => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    res.json(user);
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Yeni istifadəçi yarat
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserInput' }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       400:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.post("/users", authenticate, (req, res) => {
    const { name, email, age } = req.body;
    if (!name || !email) return res.status(400).json({ message: "name və email tələb olunur" });
    const db = readDB();
    const newUser = { id: db.meta.nextUserId++, name, email, age: age ?? null };
    db.users.push(newUser);
    saveDB(db);
    res.status(201).json(newUser);
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: İstifadəçini tam yenilə
 *     tags: [Users]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserInput' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.put("/users/:id", authenticate, (req, res) => {
    const db = readDB();
    const idx = db.users.findIndex((u) => u.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    const { name, email, age } = req.body;
    if (!name || !email) return res.status(400).json({ message: "name və email tələb olunur" });
    db.users[idx] = { id: db.users[idx].id, name, email, age: age ?? null };
    saveDB(db);
    res.json(db.users[idx]);
});

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: İstifadəçini qismən yenilə
 *     tags: [Users]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserInput' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.patch("/users/:id", authenticate, (req, res) => {
    const db = readDB();
    const user = db.users.find((u) => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    const { name, email, age } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (age !== undefined) user.age = age;
    saveDB(db);
    res.json(user);
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: İstifadəçini sil
 *     tags: [Users]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.delete("/users/:id", authenticate, (req, res) => {
    const db = readDB();
    const idx = db.users.findIndex((u) => u.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    db.users.splice(idx, 1);
    saveDB(db);
    res.json({ message: "İstifadəçi silindi" });
});

// ════════════════════════════════════════════════════════════
//  🪪  USER PROFILES
// ════════════════════════════════════════════════════════════

/**
 * @swagger
 * /users/{userId}/profile:
 *   get:
 *     summary: İstifadəçinin ətraflı profilini gətir
 *     tags: [User Profiles]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Profile' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.get("/users/:userId/profile", authenticate, (req, res) => {
    const { profiles } = readDB();
    const profile = profiles.find((p) => p.userId === parseInt(req.params.userId));
    if (!profile) return res.status(404).json({ message: "Profil tapılmadı" });
    res.json(profile);
});

/**
 * @swagger
 * /users/{userId}/profile:
 *   put:
 *     summary: Profili yarat və ya tam yenilə
 *     tags: [User Profiles]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProfileInput' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Profile' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.put("/users/:userId/profile", authenticate, (req, res) => {
    const db = readDB();
    const uid = parseInt(req.params.userId);
    if (!db.users.find((u) => u.id === uid))
        return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    const idx = db.profiles.findIndex((p) => p.userId === uid);
    const updated = { userId: uid, ...req.body };
    if (idx === -1) db.profiles.push(updated);
    else db.profiles[idx] = updated;
    saveDB(db);
    res.json(updated);
});

/**
 * @swagger
 * /users/{userId}/profile:
 *   patch:
 *     summary: Profili qismən yenilə
 *     tags: [User Profiles]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProfileInput' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Profile' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.patch("/users/:userId/profile", authenticate, (req, res) => {
    const db = readDB();
    const profile = db.profiles.find((p) => p.userId === parseInt(req.params.userId));
    if (!profile) return res.status(404).json({ message: "Profil tapılmadı" });
    Object.assign(profile, req.body);
    saveDB(db);
    res.json(profile);
});

/**
 * @swagger
 * /users/{userId}/profile:
 *   delete:
 *     summary: Profili sil
 *     tags: [User Profiles]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.delete("/users/:userId/profile", authenticate, (req, res) => {
    const db = readDB();
    const idx = db.profiles.findIndex((p) => p.userId === parseInt(req.params.userId));
    if (idx === -1) return res.status(404).json({ message: "Profil tapılmadı" });
    db.profiles.splice(idx, 1);
    saveDB(db);
    res.json({ message: "Profil silindi" });
});

// ════════════════════════════════════════════════════════════
//  💳  CARDS
// ════════════════════════════════════════════════════════════

/**
 * @swagger
 * /users/{userId}/cards:
 *   get:
 *     summary: İstifadəçinin bütün kartlarını gətir
 *     tags: [Cards]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, blocked, expired, closed] }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Card' }
 */
app.get("/users/:userId/cards", authenticate, (req, res) => {
    const { cards } = readDB();
    const uid = parseInt(req.params.userId);
    let result = cards.filter((c) => c.userId === uid);
    if (req.query.status) result = result.filter((c) => c.status === req.query.status);
    res.json(result);
});

/**
 * @swagger
 * /cards/{id}:
 *   get:
 *     summary: ID ilə kart gətir
 *     tags: [Cards]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Card' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.get("/cards/:id", authenticate, (req, res) => {
    const { cards } = readDB();
    const card = cards.find((c) => c.id === parseInt(req.params.id));
    if (!card) return res.status(404).json({ message: "Kart tapılmadı" });
    res.json(card);
});

/**
 * @swagger
 * /cards/{id}/balance:
 *   get:
 *     summary: Kartın balans məlumatlarını gətir
 *     tags: [Cards]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cardId:           { type: integer }
 *                 maskedPan:        { type: string }
 *                 balance:          { type: number }
 *                 availableBalance: { type: number }
 *                 currency:         { type: string }
 *                 creditLimit:      { type: number }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.get("/cards/:id/balance", authenticate, (req, res) => {
    const { cards } = readDB();
    const card = cards.find((c) => c.id === parseInt(req.params.id));
    if (!card) return res.status(404).json({ message: "Kart tapılmadı" });
    res.json({
        cardId: card.id,
        maskedPan: card.maskedPan,
        balance: card.balance,
        availableBalance: card.availableBalance,
        currency: card.currency,
        ...(card.creditLimit !== undefined && { creditLimit: card.creditLimit }),
    });
});

/**
 * @swagger
 * /users/{userId}/cards:
 *   post:
 *     summary: İstifadəçiyə yeni kart əlavə et
 *     tags: [Cards]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CardInput' }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Card' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.post("/users/:userId/cards", authenticate, (req, res) => {
    const db = readDB();
    const uid = parseInt(req.params.userId);
    if (!db.users.find((u) => u.id === uid))
        return res.status(404).json({ message: "İstifadəçi tapılmadı" });

    const { cardHolder, type = "VISA", cardType = "debit", currency = "AZN", creditLimit, isDefault = false } = req.body;
    if (!cardHolder) return res.status(400).json({ message: "cardHolder tələb olunur" });

    const pan = generatePan(type);
    const newCard = {
        id: db.meta.nextCardId++,
        userId: uid,
        pan,
        maskedPan: maskPan(pan),
        cardHolder: cardHolder.toUpperCase(),
        expiryDate: generateExpiry(),
        cvv: generateCvv(),
        type,
        cardType,
        currency,
        balance: 0.00,
        availableBalance: 0.00,
        ...(cardType === "credit" && { creditLimit: creditLimit ?? 1000 }),
        status: "active",
        isDefault,
        createdAt: new Date().toISOString().split("T")[0],
    };
    db.cards.push(newCard);
    saveDB(db);
    res.status(201).json(newCard);
});

/**
 * @swagger
 * /cards/{id}/status:
 *   patch:
 *     summary: Kartın statusunu dəyiş (blokla / aktivləşdir)
 *     tags: [Cards]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CardStatusUpdate' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Card' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.patch("/cards/:id/status", authenticate, (req, res) => {
    const db = readDB();
    const card = db.cards.find((c) => c.id === parseInt(req.params.id));
    if (!card) return res.status(404).json({ message: "Kart tapılmadı" });
    const allowed = ["active", "blocked", "expired", "closed"];
    const { status } = req.body;
    if (!allowed.includes(status))
        return res.status(400).json({ message: `Status: ${allowed.join(" | ")}` });
    card.status = status;
    saveDB(db);
    res.json(card);
});

/**
 * @swagger
 * /cards/{id}:
 *   delete:
 *     summary: Kartı sil
 *     tags: [Cards]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.delete("/cards/:id", authenticate, (req, res) => {
    const db = readDB();
    const idx = db.cards.findIndex((c) => c.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ message: "Kart tapılmadı" });
    db.cards.splice(idx, 1);
    saveDB(db);
    res.json({ message: "Kart silindi" });
});

// ════════════════════════════════════════════════════════════
//  🔄  TRANSACTIONS
// ════════════════════════════════════════════════════════════

/**
 * @swagger
 * /cards/{cardId}/transactions:
 *   get:
 *     summary: Karta aid əməliyyatları gətir
 *     tags: [Transactions]
 *     parameters:
 *       - { in: path, name: cardId, required: true, schema: { type: integer } }
 *       - { in: query, name: type,     schema: { type: string, enum: [debit, credit] } }
 *       - { in: query, name: status,   schema: { type: string, enum: [pending, completed, failed, reversed] } }
 *       - { in: query, name: category, schema: { type: string } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Transaction' }
 */
app.get("/cards/:cardId/transactions", authenticate, (req, res) => {
    const { transactions } = readDB();
    const cid = parseInt(req.params.cardId);
    let result = transactions.filter((t) => t.cardId === cid);
    if (req.query.type) result = result.filter((t) => t.type === req.query.type);
    if (req.query.status) result = result.filter((t) => t.status === req.query.status);
    if (req.query.category) result = result.filter((t) => t.category === req.query.category);
    res.json(result);
});

/**
 * @swagger
 * /users/{userId}/transactions:
 *   get:
 *     summary: İstifadəçinin bütün əməliyyatlarını gətir
 *     tags: [Transactions]
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Transaction' }
 */
app.get("/users/:userId/transactions", authenticate, (req, res) => {
    const { transactions } = readDB();
    res.json(transactions.filter((t) => t.userId === parseInt(req.params.userId)));
});

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Əməliyyat detallarını gətir
 *     tags: [Transactions]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Transaction' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.get("/transactions/:id", authenticate, (req, res) => {
    const { transactions } = readDB();
    const txn = transactions.find((t) => t.id === req.params.id);
    if (!txn) return res.status(404).json({ message: "Əməliyyat tapılmadı" });
    res.json(txn);
});

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Yeni əməliyyat yarat (kart debet/kredit)
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TransactionInput' }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Transaction' }
 *       400:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.post("/transactions", authenticate, (req, res) => {
    const { cardId, amount, currency, type, category, merchant, description } = req.body;
    if (!cardId || !amount || !type)
        return res.status(400).json({ message: "cardId, amount, type tələb olunur" });

    const db = readDB();
    const card = db.cards.find((c) => c.id === cardId);
    if (!card) return res.status(404).json({ message: "Kart tapılmadı" });
    if (card.status !== "active")
        return res.status(400).json({ message: "Kart aktiv deyil" });

    if (type === "debit") {
        if (card.availableBalance < amount)
            return res.status(400).json({ message: "Balans kifayət deyil" });
        card.balance -= amount;
        card.availableBalance -= amount;
    } else {
        card.balance += amount;
        card.availableBalance += amount;
    }

    const newTxn = {
        id: generateTxnId(db.meta.nextTxnNum++),
        cardId,
        userId: card.userId,
        amount,
        currency: currency || card.currency,
        type,
        category: category || "other",
        merchant: merchant || null,
        description: description || "",
        status: "completed",
        createdAt: new Date().toISOString(),
    };
    db.transactions.push(newTxn);
    saveDB(db);
    res.status(201).json(newTxn);
});

/**
 * @swagger
 * /transactions/{id}/reverse:
 *   post:
 *     summary: Əməliyyatı ləğv et (reverse)
 *     tags: [Transactions]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Transaction' }
 *       400:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.post("/transactions/:id/reverse", authenticate, (req, res) => {
    const db = readDB();
    const txn = db.transactions.find((t) => t.id === req.params.id);
    if (!txn) return res.status(404).json({ message: "Əməliyyat tapılmadı" });
    if (txn.status !== "completed")
        return res.status(400).json({ message: "Yalnız 'completed' əməliyyatlar ləğv edilə bilər" });

    const card = db.cards.find((c) => c.id === txn.cardId);
    if (card) {
        if (txn.type === "debit") {
            card.balance += txn.amount;
            card.availableBalance += txn.amount;
        } else {
            card.balance -= txn.amount;
            card.availableBalance -= txn.amount;
        }
    }
    txn.status = "reversed";
    saveDB(db);
    res.json(txn);
});

// ════════════════════════════════════════════════════════════
//  ROOT
// ════════════════════════════════════════════════════════════
app.get("/", (_req, res) => res.redirect("/api-docs"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅  Server işləyir  : http://localhost:${PORT}`);
    console.log(`📄  Swagger UI      : http://localhost:${PORT}/api-docs`);
    console.log(`💾  Database        : ${DB_PATH}`);
});