import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useForm } from "react-hook-form";
import type { FieldValues, Path, UseFormRegister } from "react-hook-form";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const signInSchema = z.object({
  correo: z.string().email("Escribe un correo válido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

const signUpSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre."),
  apellido: z.string().trim().min(2, "Escribe tu apellido."),
  correo: z.string().email("Escribe un correo válido."),
  password: z.string().min(8, "Usa al menos 8 caracteres."),
  telefono: z.string().optional(),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

export function AuthPage({ mode }: { mode: "signin" | "signup" }) {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = (location.state as { from?: string } | null)?.from ?? searchParams.get("next") ?? "/cuenta";
  const isSignUp = mode === "signup";
  const signInForm = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });
  const signUpForm = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  const submitSignIn = signInForm.handleSubmit(async (values) => {
    try {
      await signIn(values);
      navigate(from, { replace: true });
    } catch (error) {
      signInForm.setError("root.server", { message: error instanceof Error ? error.message : "No fue posible iniciar sesión." });
    }
  });

  const submitSignUp = signUpForm.handleSubmit(async (values) => {
    try {
      await signUp(values);
      navigate(from, { replace: true });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      signUpForm.setError("root.server", { message: apiError?.message ?? "No fue posible crear tu cuenta." });
    }
  });

  return (
    <section className="mx-auto grid min-h-[620px] max-w-5xl gap-0 px-5 py-8 sm:px-8 lg:grid-cols-[0.9fr_1fr] lg:py-12">
      <div className="flex flex-col items-start justify-center rounded-t-lg bg-dn-azul px-7 py-10 text-white sm:px-10 lg:rounded-l-lg lg:rounded-tr-none lg:px-12">
        <span className="rounded-full bg-dn-azul px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-dn-gris/20">Don Arturo Guatemala</span>
        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Lo bien hecho<br />se nota al vestir.</h1>
        <p className="mt-4 max-w-sm text-sm leading-6 text-dn-gris/60">Entra a tu espacio y descubre piezas elegidas para acompañarte por mucho tiempo.</p>
        <span className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-dn-rojo/70">Hecho para todos los días</span>
      </div>

      <div className="rounded-b-lg border border-dn-gris/20 bg-white px-6 py-8 sm:px-10 lg:rounded-bl-none lg:rounded-r-lg lg:px-12 lg:py-12">
        <Link className="inline-flex items-center gap-2 text-xs font-medium text-dn-gris/80 hover:text-dn-azul" to="/"><ArrowLeft size={15} /> Volver a la tienda</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.15em] text-dn-rojo">{isSignUp ? "Empieza por aquí" : "Qué gusto verte de nuevo"}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-dn-gris-oscuro">{isSignUp ? "Crea tu cuenta." : "Inicia sesión."}</h2>
        <p className="mt-2 text-sm leading-6 text-dn-gris">{isSignUp ? "Guarda tus piezas favoritas y sigue tus pedidos." : "Accede a tus pedidos y a una experiencia más personal."}</p>

        {isSignUp ? (
          <form className="mt-6 space-y-4" onSubmit={submitSignUp} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" name="nombre" register={signUpForm.register} error={signUpForm.formState.errors.nombre?.message} autoComplete="given-name" />
              <Field label="Apellido" name="apellido" register={signUpForm.register} error={signUpForm.formState.errors.apellido?.message} autoComplete="family-name" />
            </div>
            <Field label="Correo electrónico" name="correo" register={signUpForm.register} error={signUpForm.formState.errors.correo?.message} autoComplete="email" type="email" />
            <Field label="Teléfono (opcional)" name="telefono" register={signUpForm.register} error={signUpForm.formState.errors.telefono?.message} autoComplete="tel" />
            <Field label="Contraseña" name="password" register={signUpForm.register} error={signUpForm.formState.errors.password?.message} autoComplete="new-password" type="password" />
            {signUpForm.formState.errors.root?.server && <p className="text-sm text-dn-rojo" role="alert">{signUpForm.formState.errors.root.server.message}</p>}
            <Button className="h-11 w-full justify-between bg-dn-azul px-4 text-white hover:bg-dn-azul" type="submit" disabled={signUpForm.formState.isSubmitting}>{signUpForm.formState.isSubmitting ? "Creando cuenta…" : "Crear cuenta"}<ArrowUpRight size={17} /></Button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submitSignIn} noValidate>
            <Field label="Correo electrónico" name="correo" register={signInForm.register} error={signInForm.formState.errors.correo?.message} autoComplete="email" type="email" />
            <Field label="Contraseña" name="password" register={signInForm.register} error={signInForm.formState.errors.password?.message} autoComplete="current-password" type="password" />
            {signInForm.formState.errors.root?.server && <p className="text-sm text-dn-rojo" role="alert">{signInForm.formState.errors.root.server.message}</p>}
            <Button className="h-11 w-full justify-between bg-dn-azul px-4 text-white hover:bg-dn-azul" type="submit" disabled={signInForm.formState.isSubmitting}>{signInForm.formState.isSubmitting ? "Ingresando…" : "Ingresar"}<ArrowUpRight size={17} /></Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-dn-gris/80">{isSignUp ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}<Link className="ml-1 font-semibold text-dn-azul hover:text-dn-azul" to={isSignUp ? "/acceso" : "/registro"}>{isSignUp ? "Inicia sesión" : "Regístrate"}</Link></p>
      </div>
    </section>
  );
}

function Field<TForm extends FieldValues>({ label, name, register, error, autoComplete, type = "text" }: {
  label: string;
  name: Path<TForm>;
  register: UseFormRegister<TForm>;
  error?: string;
  autoComplete?: string;
  type?: string;
}) {
  const id = String(name);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-dn-gris-oscuro" htmlFor={id}>{label}</Label>
      <Input className="h-10 rounded-md border-dn-gris/60 focus-visible:border-dn-azul focus-visible:ring-dn-azul/15" id={id} {...register(name)} type={type} autoComplete={autoComplete} aria-invalid={Boolean(error)} />
      {error && <p className="text-xs text-dn-rojo" role="alert">{error}</p>}
    </div>
  );
}
