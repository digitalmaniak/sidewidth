import { createPost } from '@/app/actions'

export default async function CreatePage(props: { searchParams: Promise<{ message: string }> }) {
    const searchParams = await props.searchParams
    return (
        <div className="max-w-2xl mx-auto pt-[50px]">
            <h1 className="text-3xl font-bold mb-8 text-center">Create New Argument</h1>

            <form action={createPost} className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="side_a" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Side A
                        </label>
                        <input
                            type="text"
                            name="side_a"
                            id="side_a"
                            required
                            placeholder="e.g. Cats"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 px-3"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="side_b" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Side B
                        </label>
                        <input
                            type="text"
                            name="side_b"
                            id="side_b"
                            required
                            placeholder="e.g. Dogs"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 px-3"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category
                    </label>
                    <select
                        name="category"
                        id="category"
                        required
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 px-3"
                    >
                        <option value="">Select a category</option>
                        <option value="Politics">Politics</option>
                        <option value="Sports">Sports</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Technology">Technology</option>
                        <option value="Food">Food</option>
                        <option value="Philosophy">Philosophy</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Create Argument
                    </button>
                    {searchParams?.message && (
                        <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
                            {searchParams.message}
                        </p>
                    )}
                </div>
            </form>
        </div>
    )
}
