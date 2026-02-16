export default function AssetGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-5 h-64">
                    <div className="animate-pulse flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <div className="h-6 w-32 bg-gray-800 rounded mb-2"></div>
                                <div className="h-4 w-16 bg-gray-800 rounded"></div>
                            </div>
                            <div className="h-5 w-16 bg-gray-800 rounded-full"></div>
                        </div>

                        <div className="flex-1 bg-gray-800/50 rounded-lg mb-4"></div>

                        <div className="flex justify-between items-end mt-auto">
                            <div>
                                <div className="h-8 w-24 bg-gray-800 rounded mb-1"></div>
                                <div className="h-4 w-20 bg-gray-800 rounded"></div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="h-5 w-16 bg-gray-800 rounded"></div>
                                <div className="h-3 w-12 bg-gray-800 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
