import type { NextAuthConfig } from 'next-auth';
import type { User as PrismaUser } from '@prisma/client';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { isAdminRole } from '@/lib/auth/roles';

async function getUser(email: string): Promise<PrismaUser | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: '/login',
        newUser: '/register',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/portfolio') ||
                nextUrl.pathname.startsWith('/asset') ||
                nextUrl.pathname.startsWith('/profile') ||
                nextUrl.pathname.startsWith('/settings') ||
                nextUrl.pathname.startsWith('/watchlist') ||
                nextUrl.pathname.startsWith('/analytics') ||
                nextUrl.pathname.startsWith('/onboarding');

            const isOnAdmin = nextUrl.pathname.startsWith('/admin');

            const isOnAuth = nextUrl.pathname.startsWith('/login') ||
                nextUrl.pathname.startsWith('/register');

            if (isOnAdmin) {
                if (!isLoggedIn) return false;
                const role = (auth as any)?.user?.role;
                if (!isAdminRole(role)) {
                    return Response.redirect(new URL('/', nextUrl));
                }
                return true;
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false;
            } else if (isLoggedIn && isOnAuth) {
                return Response.redirect(new URL('/portfolio', nextUrl));
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.picture = user.image;
                token.role = (user as any).role || 'USER';
            }

            if (trigger === "update" && session) {
                token.name = session.name;
                token.email = session.email;
                token.picture = session.image;
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = (token.role as string) || 'USER';
            }
            return session;
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({
                        email: z.string().email(),
                        password: z.string().min(6),
                        code: z.string().optional()
                    })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    // Block suspended/banned users
                    if ((user as any).status && (user as any).status !== 'ACTIVE') {
                        console.log(`Login blocked: user ${email} is ${(user as any).status}`);
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (!passwordsMatch) return null;

                    // 2FA Verification
                    if (user.twoFactorEnabled) {
                        const { code } = parsedCredentials.data as any; // Type assertion as zod schema needs update
                        if (!code) {
                            console.log('2FA required but code missing');
                            return null; // Or throw error? NextAuth creates generic error.
                        }

                        // Dynamically import otplib to avoid edge runtime issues if any (though bcrypt is here so it's Node)
                        const { verify } = await import('otplib');
                        const result = await verify({
                            token: code,
                            secret: user.twoFactorSecret!,
                            window: [1, 1]
                        } as any);

                        const isValid = result && typeof result === 'object' ? result.valid : result === true;

                        if (!isValid) {
                            console.log('Invalid 2FA code');
                            return null;
                        }
                    }

                    return user;
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
} satisfies NextAuthConfig;
