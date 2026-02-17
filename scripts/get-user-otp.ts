import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Please provide an email');
        process.exit(1);
    }

    const user = await prisma.user.findUnique({
        where: { email },
        select: { twoFactorSecret: true }
    });

    if (!user || !user.twoFactorSecret) {
        console.error('User not found or 2FA not set up');
        process.exit(1);
    }

    const token = authenticator.generate(user.twoFactorSecret);
    console.log(token);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
