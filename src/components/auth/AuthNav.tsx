"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { name: string; email: string } | null;

const linkClass =
  "rounded-8 text-sm font-bold text-text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple";

export function AuthNav() {
  const [me, setMe] = useState<Me | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((body: { user: Me }) => setMe(body.user))
      .catch(() => setMe(null));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setMe(null);
  };

  if (!me) {
    return (
      <Link href="/login" className={linkClass}>
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-text-muted" data-testid="current-user">
        {me.name}님
      </span>
      <button type="button" onClick={logout} className={linkClass}>
        로그아웃
      </button>
    </div>
  );
}
