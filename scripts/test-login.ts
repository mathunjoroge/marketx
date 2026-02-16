
import { prisma } from '../src/lib/db/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    const email = 'admin@marketx.com';
    const password = 'Admin123!';

    console.log(`Testing login for ${email}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error('User not found!');
            return;
        }

        console.log('User found:', user.email, user.role, user.status);

        const match = await bcrypt.compare(password, user.password);
        console.log('Password match:', match);

    } catch (error) {
        console.error('Error during login test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
