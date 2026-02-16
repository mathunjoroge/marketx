'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-8">
            <h1 className="text-3xl font-bold text-white">Settings</h1>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Account Settings</h2>
                    <p className="text-gray-400 text-sm mt-1">Manage your account preferences</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-white">Profile Information</h3>
                            <p className="text-sm text-gray-500">Update your personal details</p>
                        </div>
                        <button
                            onClick={() => router.push('/profile')}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
                        >
                            Edit Profile
                        </button>
                    </div>

                    <div className="pt-6 border-t border-gray-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-white">Appearance</h3>
                                <p className="text-sm text-gray-500">Customize the application look</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 rounded-lg border border-gray-700">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-xs text-gray-300">Dark Mode (Default)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Trading Preferences</h2>
                </div>
                <div className="p-6">
                    <p className="text-gray-400 text-sm">Trading settings coming soon...</p>
                </div>
            </div>
        </div>
    );
}
