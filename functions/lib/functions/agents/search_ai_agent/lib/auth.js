"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = getCurrentUser;
const next_auth_1 = __importDefault(require("next-auth"));
const providers_1 = __importDefault(require("next-auth/providers"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = require("bcryptjs");
const prisma = new client_1.PrismaClient();
exports.default = (0, next_auth_1.default)({
    providers: [
        providers_1.default.Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials || !credentials.email || !credentials.password) {
                    throw new Error("Missing fields");
                }
                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email },
                    });
                    if (!user) {
                        throw new Error("No user found");
                    }
                    const isValid = await (0, bcryptjs_1.compare)(credentials.password, user.password);
                    if (!isValid) {
                        throw new Error("Invalid password");
                    }
                    return { id: user.id, name: user.name, email: user.email };
                }
                catch (error) {
                    console.error("Authorization error: ", error);
                    throw new Error("Failed to authorize user");
                }
            },
        }),
    ],
    session: {
        jwt: true,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error", // Error code passed in query string as ?error=...
    },
    callbacks: {
        async jwt(token, user) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session(session, token) {
            session.user.id = token.id;
            return session;
        },
    },
});
// Utility function to get current authenticated user
async function getCurrentUser(req, res) {
    try {
        const session = await unstable_getServerSession(req, res, (0, next_auth_1.default)(options));
        if (!session) {
            res.status(401).json({ error: "Unauthorized" });
            return null;
        }
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return null;
        }
        return user;
    }
    catch (error) {
        console.error("Error fetching current user:", error);
        res.status(500).json({ error: "Server error" });
        return null;
    }
}
//# sourceMappingURL=auth.js.map