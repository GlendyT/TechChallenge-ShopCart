import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { z } from 'zod'
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../api/client'

const signInSchema = z.object({
  correo: z.string().email('Escribe un correo válido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
})

const signUpSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.'),
  apellido: z.string().trim().min(2, 'Escribe tu apellido.'),
  correo: z.string().email('Escribe un correo válido.'),
  password: z.string().min(8, 'Usa al menos 8 caracteres.'),
  telefono: z.string().optional(),
})

type SignInValues = z.infer<typeof signInSchema>
type SignUpValues = z.infer<typeof signUpSchema>

export function AuthPage({ mode }: { mode: 'signin' | 'signup' }) {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const from = (location.state as { from?: string } | null)?.from ?? searchParams.get('next') ?? '/cuenta'
  const isSignUp = mode === 'signup'
  const signInForm = useForm<SignInValues>({ resolver: zodResolver(signInSchema) })
  const signUpForm = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) })

  const submitSignIn = signInForm.handleSubmit(async (values) => {
    try {
      await signIn(values)
      navigate(from, { replace: true })
    } catch (error) {
      signInForm.setError('root.server', { message: error instanceof Error ? error.message : 'No fue posible iniciar sesión.' })
    }
  })

  const submitSignUp = signUpForm.handleSubmit(async (values) => {
    try {
      await signUp(values)
      navigate(from, { replace: true })
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null
      signUpForm.setError('root.server', { message: apiError?.message ?? 'No fue posible crear tu cuenta.' })
    }
  })

  return (
    <section className="auth-page">
      <div className="auth-editorial"><p className="eyebrow">Una bienvenida a tu medida</p><h1>Lo bien hecho<br />se nota <em>al vestir.</em></h1><p>Entra a tu espacio y descubre piezas elegidas para acompañarte por mucho tiempo.</p><span>DON ARTURO · GUATEMALA</span></div>
      <div className="auth-form-panel">
        <Link className="back-link" to="/">← Volver a la tienda</Link>
        <p className="eyebrow">{isSignUp ? 'Empieza por aquí' : 'Qué gusto verte de nuevo'}</p>
        <h2>{isSignUp ? 'Crea tu cuenta.' : 'Inicia sesión.'}</h2>
        <p className="auth-intro">{isSignUp ? 'Guarda tus piezas favoritas y sigue tus pedidos.' : 'Accede a tus pedidos y a una experiencia más personal.'}</p>
        {isSignUp ? (
          <form className="form-stack" onSubmit={submitSignUp} noValidate>
            <div className="field-row">
              <Field label="Nombre" name="nombre" register={signUpForm.register} error={signUpForm.formState.errors.nombre?.message} autoComplete="given-name" />
              <Field label="Apellido" name="apellido" register={signUpForm.register} error={signUpForm.formState.errors.apellido?.message} autoComplete="family-name" />
            </div>
            <Field label="Correo electrónico" name="correo" register={signUpForm.register} error={signUpForm.formState.errors.correo?.message} autoComplete="email" type="email" />
            <Field label="Teléfono (opcional)" name="telefono" register={signUpForm.register} error={signUpForm.formState.errors.telefono?.message} autoComplete="tel" />
            <Field label="Contraseña" name="password" register={signUpForm.register} error={signUpForm.formState.errors.password?.message} autoComplete="new-password" type="password" />
            {signUpForm.formState.errors.root?.server && <p className="form-alert" role="alert">{signUpForm.formState.errors.root.server.message}</p>}
            <button className="button button--dark button--wide" type="submit" disabled={signUpForm.formState.isSubmitting}>{signUpForm.formState.isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'} <span aria-hidden="true">↗</span></button>
          </form>
        ) : (
          <form className="form-stack" onSubmit={submitSignIn} noValidate>
            <Field label="Correo electrónico" name="correo" register={signInForm.register} error={signInForm.formState.errors.correo?.message} autoComplete="email" type="email" />
            <Field label="Contraseña" name="password" register={signInForm.register} error={signInForm.formState.errors.password?.message} autoComplete="current-password" type="password" />
            {signInForm.formState.errors.root?.server && <p className="form-alert" role="alert">{signInForm.formState.errors.root.server.message}</p>}
            <button className="button button--dark button--wide" type="submit" disabled={signInForm.formState.isSubmitting}>{signInForm.formState.isSubmitting ? 'Ingresando…' : 'Ingresar'} <span aria-hidden="true">↗</span></button>
          </form>
        )}
        <p className="auth-switch">{isSignUp ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'} <Link to={isSignUp ? '/acceso' : '/registro'}>{isSignUp ? 'Inicia sesión' : 'Regístrate'}</Link></p>
      </div>
    </section>
  )
}

function Field<TForm extends FieldValues>({ label, name, register, error, autoComplete, type = 'text' }: {
  label: string
  name: Path<TForm>
  register: UseFormRegister<TForm>
  error?: string
  autoComplete?: string
  type?: string
}) {
  return <label className="form-field"><span>{label}</span><input {...register(name)} type={type} autoComplete={autoComplete} aria-invalid={Boolean(error)} />{error && <small role="alert">{error}</small>}</label>
}
