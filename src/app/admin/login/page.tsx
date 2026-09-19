"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError(
          res.status === 401
            ? "Невірний логін або пароль"
            : "Помилка сервера, спробуйте ще раз"
        );
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Зʼєднання обірвано, спробуйте ще раз");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-stone-950 shadow-xl shadow-orange-600/20">
            <Flame className="size-7" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Харчі · Адмінка
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Керування сайтом та CRM замовлень
          </p>
        </div>

        <form
          onSubmit={submit}
          className="card-glass rounded-3xl p-6 space-y-4 border border-border/60"
          aria-label="Форма входу"
        >
          <div className="space-y-2">
            <Label htmlFor="username">Логін</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="username"
                className="pl-9"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Увійти
          </Button>
        </form>
      </div>
    </div>
  );
}
