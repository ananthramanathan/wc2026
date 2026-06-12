import { BottomNav } from "./bottom-nav";

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-zinc-50">
      <header className="sticky top-0 z-20 bg-zinc-50/90 backdrop-blur px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3 border-b border-zinc-200">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      </header>
      <main className="flex-1 px-5 py-4 pb-6">{children}</main>
      <BottomNav />
    </div>
  );
}
