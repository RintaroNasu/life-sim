"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  return (
    <main className="flex h-screen items-center justify-center bg-[#eef3ff] px-4 py-4 text-slate-900">
      <section className="flex w-full max-w-190 flex-col items-center justify-center gap-8 rounded-[28px] border border-slate-200/80 bg-white px-6 py-10 text-center">
        <div className="space-y-3">
          <p className="font-bold uppercase tracking-[0.18em] text-[#2563eb]">
            LifeSim
          </p>
          <h1 className="text-[2.2rem] font-extrabold text-[#16245d]">
            home
          </h1>
        </div>

        <button
          className="h-14 min-w-40 rounded-[18px] bg-[linear-gradient(180deg,#2c6cff_0%,#2057e3_100%)] px-8 text-lg font-extrabold tracking-[-0.03em] text-white hover:brightness-150"
          type="button"
          onClick={handleLogout}
        >
          ログアウト
        </button>
      </section>
    </main>
  );
}
