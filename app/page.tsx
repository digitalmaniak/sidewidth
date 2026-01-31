import { FeedList } from "@/components/features/feed-list"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen flex flex-col items-center pt-16 bg-gradient-to-br from-slate-900 to-slate-950 text-white relative overflow-x-hidden">

      {/* Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />

      <h1 className="text-4xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-pink-200 drop-shadow-sm z-10">
        SideWidth
      </h1>
      <p className="text-sm text-gray-500 mb-8 z-10 text-center px-4">
        An anonymous consensus engine to measure local public opinions. Who do you side with?
      </p>

      <FeedList user={user} />

    </main>
  )
}
