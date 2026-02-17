import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SecuritySettings from '@/components/settings/SecuritySettings';

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            twoFactorEnabled: true,
            image: true,
        }
    });

    if (!user) redirect('/login');

    return (
        <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
            <h1 className="text-3xl font-bold text-white">Settings</h1>

            {/* Account Section */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Account Settings</h2>
                    <p className="text-gray-400 text-sm mt-1">Manage your personal details</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-white">Profile Information</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <Link
                            href="/profile"
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
                        >
                            Edit Profile
                        </Link>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <SecuritySettings user={user} />

            {/* Preferences Section */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Application Preferences</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-white">Appearance</h3>
                            <p className="text-sm text-gray-500">Customize the application look</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 rounded-lg border border-gray-700">
                            <span className="text-xs text-gray-300">Controlled by Theme Toggle</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
