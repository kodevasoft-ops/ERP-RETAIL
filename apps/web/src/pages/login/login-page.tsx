import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  empresaId: z.string().uuid(),
});

type LoginForm = z.infer<typeof loginSchema>;

type LoginResponse = { accessToken: string } | { requiereMfa: true; mfaToken: string };

export default function LoginPage() {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [codigoMfa, setCodigoMfa] = useState("");
  const [errorMfa, setErrorMfa] = useState<string | null>(null);
  const [verificandoMfa, setVerificandoMfa] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await apiClient.post<LoginResponse>("/auth/login", data);
      if ("requiereMfa" in res.data) {
        // Contraseña correcta, pero falta el segundo factor: se muestra
        // el paso de verificación en vez de dejar entrar al usuario.
        setMfaToken(res.data.mfaToken);
        return;
      }
      setAccessToken(res.data.accessToken);
      navigate("/");
    } catch {
      setError("root", { message: "Credenciales inválidas." });
    }
  };

  const verificarMfa = async () => {
    if (!mfaToken || codigoMfa.length < 6) return;
    setVerificandoMfa(true);
    setErrorMfa(null);
    try {
      const res = await apiClient.post<{ accessToken: string }>("/auth/mfa/verificar", { mfaToken, codigo: codigoMfa });
      setAccessToken(res.data.accessToken);
      navigate("/");
    } catch {
      setErrorMfa("Código incorrecto. Intenta de nuevo.");
    } finally {
      setVerificandoMfa(false);
    }
  };

  if (mfaToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <h1 className="text-lg font-semibold">Verificación en dos pasos</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Ingresa el código de 6 dígitos de tu aplicación autenticadora.
          </p>
          <input
            value={codigoMfa}
            onChange={(e) => setCodigoMfa(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && verificarMfa()}
            placeholder="000000"
            autoFocus
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-center text-lg tracking-[0.3em] outline-none focus:ring-2 focus:ring-primary"
          />
          {errorMfa && <p className="text-xs text-destructive">{errorMfa}</p>}
          <button
            onClick={verificarMfa}
            disabled={verificandoMfa || codigoMfa.length < 6}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {verificandoMfa ? "Verificando..." : "Verificar"}
          </button>
          <button
            onClick={() => setMfaToken(null)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
      >
        <h1 className="text-lg font-semibold">Iniciar sesión</h1>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {errors.root && <p className="text-xs text-destructive">{errors.root.message}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
