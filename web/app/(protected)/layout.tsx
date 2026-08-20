"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { me, type MeResponse } from "@/lib/api/auth";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    let isActive = true;

    const loadUser = async () => {
      try {
        const currentUser = await me(token);

        if (!isActive) {
          return;
        }

        setUser(currentUser);
        setIsLoading(false);
      } catch {
        if (!isActive) {
          return;
        }
        localStorage.removeItem("token");
        router.replace("/login");
      }
    };

    void loadUser();

    return () => {
      isActive = false;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  if (isLoading || !user) {
    return null;
  }

  const navItems = [
    { href: "/home", label: "ダッシュボード" },
    { href: "/household", label: "家計入力" },
  ];

  return (
    <div className="flex min-h-screen bg-[#eef3ff] text-slate-900">
      <aside className="flex w-65 flex-col border-r border-slate-200/80 bg-white px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 font-bold uppercase tracking-[0.18em] text-[#2563eb]">
            LifeSim
          </p>
          <p className="text-sm font-semibold text-slate-400">
            未来の生活をシミュレーション
          </p>
        </div>

        <nav className="space-y-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-[18px] px-4 py-3 text-base font-bold transition ${
                  isActive
                    ? "bg-[#edf3ff] text-[#2563eb]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#16245d]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-5">
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-base font-bold text-[#16245d]">
              {user.name}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {user.email}
            </p>
          </div>

          <button
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white text-base font-bold text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={handleLogout}
          >
            ログアウト
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
