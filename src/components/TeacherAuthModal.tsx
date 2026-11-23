import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, X } from 'lucide-react';
import type { AuthStatus } from '../types.ts';
import { fetchAuthStatus, getBackendMode, submitAuthRequest } from '../utils/apiClient.ts';

interface TeacherLoginFormProps {
  authStatus: AuthStatus;
  onStatusChange?: (next: AuthStatus) => void;
  onAuthenticated: (token: string) => void | Promise<void>;
  onCancel?: () => void;
}

export function TeacherLoginForm({
  authStatus,
  onStatusChange,
  onAuthenticated,
  onCancel,
}: TeacherLoginFormProps) {
  const [liveStatus, setLiveStatus] = useState<AuthStatus>(authStatus);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocalMode, setIsLocalMode] = useState(getBackendMode() === 'local');

  useEffect(() => {
    setLiveStatus(authStatus);
  }, [authStatus]);

  useEffect(() => {
    let active = true;
    async function syncStatus() {
      const st = await fetchAuthStatus();
      if (active) {
        setLiveStatus(st);
        setIsLocalMode(getBackendMode() === 'local');
        onStatusChange?.(st);
      }
    }
    void syncStatus();
    return () => {
      active = false;
    };
  }, [onStatusChange]);

  const isFirstSetup = !liveStatus.configured && !liveStatus.envManaged;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (isFirstSetup) {
      if (password.length < 6) {
        setError('La clave docente debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las dos claves escritas no coinciden.');
        return;
      }
    } else if (!password) {
      setError('Ingresa tu clave docente para continuar.');
      return;
    }

    setLoading(true);
    try {
      const result = await submitAuthRequest(isFirstSetup, password);
      setIsLocalMode(getBackendMode() === 'local');
      onStatusChange?.(result.authStatus);
      setPassword('');
      setConfirmPassword('');
      await onAuthenticated(result.token);
    } catch (err) {
      setIsLocalMode(getBackendMode() === 'local');
      const latest = await fetchAuthStatus();
      setLiveStatus(latest);
      onStatusChange?.(latest);
      setError(err instanceof Error ? err.message : 'No se pudo validar el acceso docente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label htmlFor="teacher-pass" className="block text-sm font-semibold text-[#14241B]">
          {isFirstSetup ? 'Nueva clave docente (mínimo 6 caracteres)' : 'Clave docente'}
        </label>
        <div className="relative mt-1.5">
          <input
            id="teacher-pass"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isFirstSetup ? 'new-password' : 'current-password'}
            placeholder="Ingresa tu clave privada"
            autoFocus
            className="w-full rounded-lg border border-[#C8D6CB] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#14241B] focus:border-[#14532D] focus:outline-none focus:ring-2 focus:ring-[#14532D]/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-[#4B6153] hover:text-[#14241B]"
            aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isFirstSetup && (
        <div>
          <label htmlFor="teacher-pass-confirm" className="block text-sm font-semibold text-[#14241B]">
            Confirmar clave docente
          </label>
          <input
            id="teacher-pass-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Repite tu clave privada"
            className="mt-1.5 w-full rounded-lg border border-[#C8D6CB] bg-white px-3.5 py-2.5 text-sm text-[#14241B] focus:border-[#14532D] focus:outline-none focus:ring-2 focus:ring-[#14532D]/15"
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-medium text-[#991B1B]">
          {error}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-[#DCE5DD] bg-[#F7FAF7] px-3 py-2.5 text-xs text-[#4B6153]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" />
        <div className="space-y-1">
          <div>
            Ninguna clave ni pista se muestra en pantalla.
          </div>
          {liveStatus.envManaged && (
            <div className="font-medium text-[#14532D]">
              Clave administrada desde Secretos del servidor (TEACHER_PASSCODE).
            </div>
          )}
          {isLocalMode && (
            <div className="font-medium text-[#14532D]">
              Modo navegador autónomo: la clave cifrada y tus registros se guardan de forma segura en este navegador.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#DCE5DD] bg-white px-4 py-2 text-sm font-semibold text-[#33473B] hover:bg-[#F3F6F3]"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#14532D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166534] disabled:opacity-60"
        >
          {isFirstSetup ? <KeyRound className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {loading
            ? 'Verificando...'
            : isFirstSetup
              ? 'Guardar clave e iniciar sesión'
              : 'Iniciar sesión'}
        </button>
      </div>
    </form>
  );
}

interface TeacherAuthModalProps {
  open: boolean;
  authStatus: AuthStatus;
  onStatusChange?: (next: AuthStatus) => void;
  onClose: () => void;
  onAuthenticated: (token: string) => void | Promise<void>;
}

export function TeacherAuthModal({
  open,
  authStatus,
  onStatusChange,
  onClose,
  onAuthenticated,
}: TeacherAuthModalProps) {
  if (!open) return null;

  const isFirstSetup = !authStatus.configured && !authStatus.envManaged;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-auth-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[#DCE5DD] bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF3EC] text-[#14532D]">
              {isFirstSetup ? <KeyRound className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <h2 id="teacher-auth-title" className="text-lg font-bold text-[#14241B]">
                {isFirstSetup ? 'Configurar clave docente privada' : 'Iniciar sesión · Docente ECOTRON'}
              </h2>
              <p className="text-xs text-[#4B6153]">
                {isFirstSetup
                  ? 'Primer ingreso: define una clave privada para administrar toda la plataforma.'
                  : 'Ingresa tu clave personal para habilitar edición completa, ventas, inventario y respaldos.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#4B6153] hover:bg-[#F1F5F2] hover:text-[#14241B]"
            aria-label="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <TeacherLoginForm
          authStatus={authStatus}
          onStatusChange={onStatusChange}
          onCancel={onClose}
          onAuthenticated={async (token) => {
            await onAuthenticated(token);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
