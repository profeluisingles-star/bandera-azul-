import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Home,
  Layers,
  Lock,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  Sprout,
  X,
} from 'lucide-react';
import type {
  AuthStatus,
  CustomReminder,
  FieldLog,
  PlatformData,
  Product,
  PublicPlatformData,
  Sowing,
} from './types.ts';
import { createInitialPlatformData } from './data/defaultCatalog.ts';
import {
  adminApiRequest,
  fetchAuthStatus,
  fetchPublicPlatformData,
  logoutTeacher,
} from './utils/apiClient.ts';
import { LogoStrip } from './components/LogoStrip.tsx';
import { ProductStudioModal } from './components/ProductStudioModal.tsx';
import { TeacherAuthModal, TeacherLoginForm } from './components/TeacherAuthModal.tsx';
import { OverviewView, type AppSection } from './views/OverviewView.tsx';
import { LearnLuisitoView } from './views/LearnLuisitoView.tsx';
import { CropsView } from './views/CropsView.tsx';
import { CatalogView } from './views/CatalogView.tsx';
import { CompostLibraryView } from './views/CompostLibraryView.tsx';
import { SchedulePlanView } from './views/SchedulePlanView.tsx';
import { TeacherWorkspaceView } from './views/TeacherWorkspaceView.tsx';

export default function App() {
  const [section, setSection] = useState<AppSection>('inicio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth token kept strictly in JS memory (never localStorage)
  const [authToken, setAuthToken] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    configured: true,
    envManaged: false,
    authenticated: false,
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [publicData, setPublicData] = useState<PublicPlatformData>(() => {
    const initial = createInitialPlatformData();
    return {
      products: initial.products,
      sowings: initial.sowings,
      fieldLogs: initial.fieldLogs,
      customReminders: initial.customReminders,
      settings: initial.settings,
    };
  });
  const [adminData, setAdminData] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(true);
  const [studioProduct, setStudioProduct] = useState<Product | null>(null);
  const [focusAdminProductId, setFocusAdminProductId] = useState<string | null>(null);

  const isTeacher = Boolean(authToken && authStatus.authenticated && adminData);

  const loadInitialState = useCallback(async () => {
    setLoading(true);
    try {
      const [pub, st] = await Promise.all([
        fetchPublicPlatformData(),
        fetchAuthStatus(),
      ]);
      if (pub) {
        setPublicData(pub);
      }
      setAuthStatus(st);
    } catch {
      // Keep fallback seed state if network temporarily unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialState();
  }, [loadInitialState]);

  const handleAuthenticated = useCallback(async (token: string) => {
    setAuthToken(token);
    setAuthStatus((prev) => ({ ...prev, configured: true, authenticated: true }));
    try {
      const full = await adminApiRequest<PlatformData>('/api/admin/data', { method: 'GET' }, token);
      setAdminData(full);
      setPublicData({
        products: full.products,
        sowings: full.sowings,
        fieldLogs: full.fieldLogs,
        customReminders: full.customReminders || [],
        settings: full.settings,
      });
      setSection('docente');
    } catch {
      // Handled gracefully
    }
  }, []);

  async function handleLogout() {
    await logoutTeacher(authToken);
    setAuthToken('');
    setAdminData(null);
    setAuthStatus((prev) => ({ ...prev, authenticated: false }));
    if (section === 'docente') {
      setSection('inicio');
    }
  }

  function handleAdminDataChange(next: PlatformData) {
    setAdminData(next);
    setPublicData({
      products: next.products,
      sowings: next.sowings,
      fieldLogs: next.fieldLogs,
      customReminders: next.customReminders || [],
      settings: next.settings,
    });
  }

  async function refreshAdminAndPublic() {
    if (!authToken) return;
    const full = await adminApiRequest<PlatformData>('/api/admin/data', { method: 'GET' }, authToken);
    handleAdminDataChange(full);
  }

  async function handleAddSowing(sowing: Omit<Sowing, 'id' | 'completedTasks'>) {
    if (!authToken) return;
    await adminApiRequest(
      '/api/admin/sowings',
      { method: 'POST', body: JSON.stringify(sowing) },
      authToken
    );
    await refreshAdminAndPublic();
  }

  async function handleToggleSowingTask(sowingId: string, taskId: string) {
    if (!authToken) return;
    await adminApiRequest(
      `/api/admin/sowings/${sowingId}/tasks`,
      { method: 'PATCH', body: JSON.stringify({ taskId }) },
      authToken
    );
    await refreshAdminAndPublic();
  }

  async function handleDeleteSowing(sowingId: string) {
    if (!authToken) return;
    await adminApiRequest(`/api/admin/sowings/${sowingId}`, { method: 'DELETE' }, authToken);
    await refreshAdminAndPublic();
  }

  async function handleAddFieldLog(entry: Omit<FieldLog, 'id'>) {
    if (!authToken) return;
    await adminApiRequest(
      '/api/admin/field-logs',
      { method: 'POST', body: JSON.stringify(entry) },
      authToken
    );
    await refreshAdminAndPublic();
  }

  async function handleDeleteFieldLog(id: string) {
    if (!authToken) return;
    await adminApiRequest(`/api/admin/field-logs/${id}`, { method: 'DELETE' }, authToken);
    await refreshAdminAndPublic();
  }

  async function handleAddReminder(rem: Omit<CustomReminder, 'id' | 'done'>) {
    if (!authToken) return;
    await adminApiRequest(
      '/api/admin/reminders',
      { method: 'POST', body: JSON.stringify(rem) },
      authToken
    );
    await refreshAdminAndPublic();
  }

  async function handleToggleReminder(id: string, done: boolean) {
    if (!authToken) return;
    await adminApiRequest(
      `/api/admin/reminders/${id}`,
      { method: 'PATCH', body: JSON.stringify({ done }) },
      authToken
    );
    await refreshAdminAndPublic();
  }

  async function handleDeleteReminder(id: string) {
    if (!authToken) return;
    await adminApiRequest(`/api/admin/reminders/${id}`, { method: 'DELETE' }, authToken);
    await refreshAdminAndPublic();
  }

  const activeSettings = adminData?.settings || publicData.settings;
  const activeProducts = adminData?.products || publicData.products;
  const activeSowings = adminData?.sowings || publicData.sowings;
  const activeFieldLogs = adminData?.fieldLogs || publicData.fieldLogs;
  const activeReminders = adminData?.customReminders || publicData.customReminders || [];

  const navItems: Array<{ id: AppSection; label: string; icon: typeof Home }> = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'aprende', label: 'Aprende con Luisito', icon: BookOpen },
    { id: 'cultivos', label: 'Cultivos Tilarán', icon: Sprout },
    { id: 'catalogo', label: 'Catálogo', icon: Package },
    { id: 'compost', label: 'Compost y Biblioteca', icon: Layers },
    { id: 'plan', label: 'Calendario y Alarmas', icon: Calendar },
  ];

  function navigateTo(next: AppSection) {
    setSection(next);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#F5F6F2] text-[#14241B]">
      {/* Single-line 3-Zone Top Bar */}
      <header className="no-print sticky top-0 z-40 border-b border-[#D9E2D7] bg-[#F5F6F2]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          {/* Zone 1: Brand & Institutional Logos */}
          <button
            type="button"
            onClick={() => navigateTo('inicio')}
            className="flex shrink-0 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D] rounded-lg"
          >
            <LogoStrip settings={activeSettings} compact />
            <span className="font-display hidden text-lg font-bold tracking-tight text-[#14532D] whitespace-nowrap xl:inline">
              {activeSettings.enterpriseName}
            </span>
          </button>

          {/* Zone 2: Clean Typographic Navigation (Desktop) */}
          <nav className="hidden items-center gap-5 lg:flex" aria-label="Navegación principal">
            {navItems.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`relative shrink-0 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D] ${
                    active
                      ? 'text-[#14532D] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#14532D]'
                      : 'text-[#4B6153] hover:text-[#14241B]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => navigateTo('docente')}
              className={`relative inline-flex shrink-0 items-center gap-1.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D] ${
                section === 'docente'
                  ? 'text-[#14532D] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#14532D]'
                  : 'text-[#166534] hover:text-[#14532D]'
              }`}
            >
              {isTeacher ? <ShieldCheck className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {isTeacher ? 'Gestión Docente' : 'Docente'}
            </button>
          </nav>

          {/* Zone 3: Primary Session Action */}
          <div className="flex shrink-0 items-center gap-2">
            {isTeacher ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#C8D6CB] bg-white px-4 py-2 text-xs font-semibold whitespace-nowrap text-[#14241B] transition-colors duration-150 hover:bg-[#FEE2E2] hover:text-[#991B1B]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-xs transition-colors duration-150 hover:bg-[#166534]"
              >
                <Lock className="h-3.5 w-3.5" />
                Iniciar sesión
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded-lg border border-[#D9E2D7] bg-white p-2 text-[#14241B] lg:hidden"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-[#DCE5DD] bg-white px-4 py-3 lg:hidden">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                      active
                        ? 'bg-[#14532D] text-white'
                        : 'border border-[#E6EFE7] bg-[#F8FAF8] text-[#14241B]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => navigateTo('docente')}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                  section === 'docente'
                    ? 'bg-[#14532D] text-white'
                    : 'border border-[#BFD8C4] bg-[#EAF3EC] text-[#14532D]'
                }`}
              >
                {isTeacher ? <ShieldCheck className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {isTeacher ? 'Gestión Docente (ECOTRON)' : 'ECOTRON · Iniciar sesión'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Viewport */}
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        {loading ? (
          <div className="rounded-xl border border-[#DCE5DD] bg-white p-10 text-center text-sm text-[#4B6153]">
            Cargando plataforma agroecológica ECOTRON · CTP Tronadora...
          </div>
        ) : (
          <>
            {section === 'inicio' && (
              <OverviewView
                settings={activeSettings}
                products={activeProducts}
                sowings={activeSowings}
                fieldLogs={activeFieldLogs}
                isTeacher={isTeacher}
                onNavigate={navigateTo}
                onOpenAuth={() => setAuthModalOpen(true)}
                onSelectProduct={(p) => setStudioProduct(p)}
              />
            )}

            {section === 'aprende' && (
              <LearnLuisitoView
                settings={activeSettings}
                fieldLogs={activeFieldLogs}
                isTeacher={isTeacher}
                onAddFieldLog={handleAddFieldLog}
                onDeleteFieldLog={handleDeleteFieldLog}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            )}

            {section === 'cultivos' && (
              <CropsView
                isTeacher={isTeacher}
                onAddSowing={handleAddSowing}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            )}

            {section === 'catalogo' && (
              <CatalogView
                products={activeProducts}
                settings={activeSettings}
                isTeacher={isTeacher}
                onSelectProduct={(p) => setStudioProduct(p)}
                onEditInAdmin={(productId) => {
                  setFocusAdminProductId(productId);
                  navigateTo('docente');
                }}
              />
            )}

            {section === 'compost' && <CompostLibraryView />}

            {section === 'plan' && (
              <SchedulePlanView
                sowings={activeSowings}
                customReminders={activeReminders}
                isTeacher={isTeacher}
                onAddSowing={handleAddSowing}
                onToggleTask={handleToggleSowingTask}
                onDeleteSowing={handleDeleteSowing}
                onAddReminder={handleAddReminder}
                onToggleReminder={handleToggleReminder}
                onDeleteReminder={handleDeleteReminder}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            )}

            {section === 'docente' && (
              <>
                {isTeacher && adminData ? (
                  <TeacherWorkspaceView
                    data={adminData}
                    authToken={authToken}
                    authStatus={authStatus}
                    initialFocusProductId={focusAdminProductId}
                    onDataChange={handleAdminDataChange}
                    onClearFocusProduct={() => setFocusAdminProductId(null)}
                  />
                ) : (
                  <div className="mx-auto max-w-md rounded-xl border border-[#DCE5DD] bg-white p-6 sm:p-8">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EC] text-[#14532D]">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#14241B]">
                          Iniciar sesión · Docente ECOTRON
                        </h2>
                        <p className="text-xs text-[#4B6153]">
                          Acceso completo a ventas, inventario en sacos y botellas, recibos, clientes y configuración.
                        </p>
                      </div>
                    </div>
                    <TeacherLoginForm
                      authStatus={authStatus}
                      onStatusChange={setAuthStatus}
                      onAuthenticated={handleAuthenticated}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="no-print border-t border-[#DCE5DD] bg-white py-6 text-center text-xs text-[#4B6153]">
        <div className="mx-auto max-w-7xl px-4">
          {activeSettings.enterpriseName} · {activeSettings.schoolName} · {activeSettings.locationLabel} · Responsable:{' '}
          {activeSettings.teacherName}
        </div>
      </footer>

      <ProductStudioModal
        product={studioProduct}
        settings={activeSettings}
        onClose={() => setStudioProduct(null)}
      />

      <TeacherAuthModal
        open={authModalOpen}
        authStatus={authStatus}
        onStatusChange={setAuthStatus}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
}
