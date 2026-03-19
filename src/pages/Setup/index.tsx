/**
 * Setup Wizard Page
 * First-time setup experience for JdiCLaw users
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { TitleBar } from '@/components/layout/TitleBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGatewayStore } from '@/stores/gateway';
import { useSettingsStore } from '@/stores/settings';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { toast } from 'sonner';
import { invokeIpc } from '@/lib/api-client';
import { hostApiFetch } from '@/lib/host-api';
import clawxIcon from '@/assets/logo.svg';

interface SetupStep {
  id: string;
  title: string;
  description: string;
}

const STEP = {
  WELCOME: 0,
  IDENTITY: 1,
  RUNTIME: 2,
  COMPLETE: 3,
} as const;

const getSteps = (t: TFunction): SetupStep[] => [
  {
    id: 'welcome',
    title: t('steps.welcome.title'),
    description: t('steps.welcome.description'),
  },
  {
    id: 'identity',
    title: t('steps.identity.title'),
    description: t('steps.identity.description'),
  },
  {
    id: 'runtime',
    title: t('steps.runtime.title'),
    description: t('steps.runtime.description'),
  },
  {
    id: 'complete',
    title: t('steps.complete.title'),
    description: t('steps.complete.description'),
  },
];

export function Setup() {
  const { t } = useTranslation('setup');
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(STEP.WELCOME);
  const [identityReady, setIdentityReady] = useState(false);
  const [runtimeChecksPassed, setRuntimeChecksPassed] = useState(false);

  const steps = getSteps(t);
  const safeStepIndex = Number.isInteger(currentStep)
    ? Math.min(Math.max(currentStep, STEP.WELCOME), steps.length - 1)
    : STEP.WELCOME;
  const step = steps[safeStepIndex] ?? steps[STEP.WELCOME];
  const isFirstStep = safeStepIndex === STEP.WELCOME;
  const isLastStep = safeStepIndex === steps.length - 1;

  const markSetupComplete = useSettingsStore((state) => state.markSetupComplete);

  const canProceed = (() => {
    switch (safeStepIndex) {
      case STEP.WELCOME:
        return true;
      case STEP.IDENTITY:
        return identityReady;
      case STEP.RUNTIME:
        return runtimeChecksPassed;
      case STEP.COMPLETE:
        return true;
      default:
        return true;
    }
  })();

  const handleNext = async () => {
    if (isLastStep) {
      markSetupComplete();
      toast.success(t('complete.toast'));
      navigate('/');
      return;
    }
    setCurrentStep((i) => i + 1);
  };

  const handleBack = () => {
    setCurrentStep((i) => Math.max(i - 1, 0));
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <TitleBar />
      <div className="flex-1 overflow-auto">
        <div className="flex justify-center pt-8">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    i < safeStepIndex
                      ? 'border-primary bg-primary text-primary-foreground'
                      : i === safeStepIndex
                        ? 'border-primary text-primary'
                        : 'border-slate-600 text-slate-600',
                  )}
                >
                  {i < safeStepIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm">{i + 1}</span>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-8 transition-colors',
                      i < safeStepIndex ? 'bg-primary' : 'bg-slate-600',
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mx-auto max-w-2xl p-8"
          >
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold">{t(`steps.${step.id}.title`)}</h1>
              <p className="text-slate-400">{t(`steps.${step.id}.description`)}</p>
            </div>

            <div className="mb-8 rounded-xl border bg-card p-8 text-card-foreground shadow-sm">
              {safeStepIndex === STEP.WELCOME && <WelcomeContent />}
              {safeStepIndex === STEP.IDENTITY && <IdentityContent onStatusChange={setIdentityReady} />}
              {safeStepIndex === STEP.RUNTIME && <RuntimeContent onStatusChange={setRuntimeChecksPassed} />}
              {safeStepIndex === STEP.COMPLETE && <CompleteContent />}
            </div>

            <div className="flex justify-between">
              <div>
                {!isFirstStep && (
                  <Button variant="ghost" onClick={handleBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t('nav.back')}
                  </Button>
                )}
              </div>
              <Button onClick={handleNext} disabled={!canProceed}>
                {isLastStep ? (
                  t('nav.getStarted')
                ) : (
                  <>
                    {t('nav.next')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function WelcomeContent() {
  const { t } = useTranslation('setup');
  const { language, setLanguage } = useSettingsStore();

  return (
    <div className="space-y-4 text-center">
      <div className="mb-4 flex justify-center">
        <img src={clawxIcon} alt="JdiCLaw" className="h-16 w-16" />
      </div>
      <h2 className="text-xl font-semibold">{t('welcome.title')}</h2>
      <p className="text-muted-foreground">{t('welcome.description')}</p>

      <div className="flex justify-center gap-2 py-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <Button
            key={lang.code}
            variant={language === lang.code ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setLanguage(lang.code)}
            className="h-7 text-xs"
          >
            {lang.label}
          </Button>
        ))}
      </div>

      <ul className="space-y-2 pt-2 text-left text-muted-foreground">
        {['workspace', 'skills', 'automation', 'support'].map((key) => (
          <li key={key} className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            {t(`welcome.features.${key}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface IdentityContentProps {
  onStatusChange: (ready: boolean) => void;
}

function IdentityContent({ onStatusChange }: IdentityContentProps) {
  const { t } = useTranslation('setup');

  useEffect(() => {
    onStatusChange(true);
  }, [onStatusChange]);

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t('identity.title')}</h2>
        <p className="text-muted-foreground">{t('identity.subtitle')}</p>
      </div>
      <div className="rounded-lg border bg-muted/40 p-4 text-left">
        <p className="text-sm font-medium text-foreground">{t('identity.statusTitle')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t('identity.statusPass')}</p>
        <p className="mt-3 text-xs text-muted-foreground">{t('identity.todo')}</p>
      </div>
    </div>
  );
}

interface RuntimeContentProps {
  onStatusChange: (ready: boolean) => void;
}

function RuntimeContent({ onStatusChange }: RuntimeContentProps) {
  const { t } = useTranslation('setup');
  const gatewayStatus = useGatewayStore((state) => state.status);
  const startGateway = useGatewayStore((state) => state.start);

  const [checks, setChecks] = useState({
    core: { status: 'checking' as 'checking' | 'success' | 'error', message: '' },
    engine: { status: 'checking' as 'checking' | 'success' | 'error', message: '' },
    workspace: { status: 'checking' as 'checking' | 'success' | 'error', message: '' },
  });
  const [showLogs, setShowLogs] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [workspacePath, setWorkspacePath] = useState('');
  const gatewayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const runChecks = useCallback(async () => {
    setChecks({
      core: { status: 'checking', message: '' },
      engine: { status: 'checking', message: '' },
      workspace: { status: 'checking', message: '' },
    });

    const currentGateway = useGatewayStore.getState().status;
    if (currentGateway.state === 'running') {
      setChecks((prev) => ({
        ...prev,
        core: { status: 'success', message: t('runtime.status.coreReady', { port: currentGateway.port }) },
      }));
    } else if (currentGateway.state === 'error') {
      setChecks((prev) => ({
        ...prev,
        core: { status: 'error', message: currentGateway.error || t('runtime.status.error') },
      }));
    } else {
      setChecks((prev) => ({
        ...prev,
        core: { status: 'checking', message: t('runtime.status.coreChecking') },
      }));
    }

    try {
      const openclawStatus = await invokeIpc('openclaw:status') as {
        packageExists: boolean;
        isBuilt: boolean;
        version?: string;
      };

      if (!openclawStatus.packageExists || !openclawStatus.isBuilt) {
        setChecks((prev) => ({
          ...prev,
          engine: { status: 'error', message: t('runtime.status.engineFailed') },
        }));
      } else {
        const versionLabel = openclawStatus.version ? ` v${openclawStatus.version}` : '';
        setChecks((prev) => ({
          ...prev,
          engine: { status: 'success', message: `${t('runtime.status.engineReady')}${versionLabel}` },
        }));
      }
    } catch (error) {
      setChecks((prev) => ({
        ...prev,
        engine: { status: 'error', message: String(error) },
      }));
    }

    try {
      const configDir = await invokeIpc<string>('openclaw:getConfigDir');
      setWorkspacePath(configDir as string);
      setChecks((prev) => ({
        ...prev,
        workspace: { status: 'success', message: t('runtime.status.workspaceReady') },
      }));
    } catch (error) {
      setChecks((prev) => ({
        ...prev,
        workspace: { status: 'error', message: String(error) },
      }));
    }
  }, [t]);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  useEffect(() => {
    const allPassed = checks.core.status === 'success'
      && checks.engine.status === 'success'
      && checks.workspace.status === 'success';
    onStatusChange(allPassed);
  }, [checks, onStatusChange]);

  useEffect(() => {
    if (gatewayStatus.state === 'running') {
      setChecks((prev) => ({
        ...prev,
        core: { status: 'success', message: t('runtime.status.coreReady', { port: gatewayStatus.port }) },
      }));
    } else if (gatewayStatus.state === 'error') {
      setChecks((prev) => ({
        ...prev,
        core: { status: 'error', message: gatewayStatus.error || t('runtime.status.error') },
      }));
    } else if (gatewayStatus.state === 'starting' || gatewayStatus.state === 'reconnecting') {
      setChecks((prev) => ({
        ...prev,
        core: { status: 'checking', message: t('runtime.status.coreChecking') },
      }));
    }
  }, [gatewayStatus, t]);

  useEffect(() => {
    if (gatewayTimeoutRef.current) {
      clearTimeout(gatewayTimeoutRef.current);
      gatewayTimeoutRef.current = null;
    }

    if (gatewayStatus.state === 'running' || gatewayStatus.state === 'error') {
      return;
    }

    gatewayTimeoutRef.current = setTimeout(() => {
      setChecks((prev) => {
        if (prev.core.status === 'checking') {
          return {
            ...prev,
            core: { status: 'error', message: t('runtime.status.coreTimeout') },
          };
        }
        return prev;
      });
    }, 60_000);

    return () => {
      if (gatewayTimeoutRef.current) {
        clearTimeout(gatewayTimeoutRef.current);
        gatewayTimeoutRef.current = null;
      }
    };
  }, [gatewayStatus.state, t]);

  const handleStartGateway = async () => {
    setChecks((prev) => ({
      ...prev,
      core: { status: 'checking', message: t('runtime.status.coreChecking') },
    }));
    await startGateway();
  };

  const handleShowLogs = async () => {
    try {
      const logs = await hostApiFetch<{ content: string }>('/api/logs?tailLines=100');
      setLogContent(logs.content);
      setShowLogs(true);
    } catch {
      setLogContent('(Failed to load logs)');
      setShowLogs(true);
    }
  };

  const handleOpenLogDir = async () => {
    try {
      const { dir: logDir } = await hostApiFetch<{ dir: string | null }>('/api/logs/dir');
      if (logDir) {
        await invokeIpc('shell:showItemInFolder', logDir);
      }
    } catch {
      // ignore
    }
  };

  const renderStatus = (status: 'checking' | 'success' | 'error', message: string) => {
    if (status === 'checking') {
      return (
        <span className="flex items-center gap-2 whitespace-nowrap text-yellow-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          {message || t('runtime.status.checking')}
        </span>
      );
    }

    if (status === 'success') {
      return (
        <span className="flex items-center gap-2 whitespace-nowrap text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          {message}
        </span>
      );
    }

    return (
      <span className="flex items-center gap-2 whitespace-nowrap text-red-400">
        <XCircle className="h-5 w-5" />
        {message}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('runtime.title')}</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleShowLogs}>
            {t('runtime.viewLogs')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void runChecks()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('runtime.recheck')}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        {t('runtime.subtitle')}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg bg-muted/50 p-3">
          <div className="text-left">
            <span>{t('runtime.core')}</span>
            {checks.core.status === 'error' && (
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={handleStartGateway}>
                  {t('runtime.startCore')}
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            {renderStatus(checks.core.status, checks.core.message)}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg bg-muted/50 p-3">
          <span className="text-left">{t('runtime.engine')}</span>
          <div className="flex justify-end">
            {renderStatus(checks.engine.status, checks.engine.message)}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg bg-muted/50 p-3">
          <div className="min-w-0 text-left">
            <span>{t('runtime.workspace')}</span>
            {workspacePath && (
              <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">{workspacePath}</p>
            )}
          </div>
          <div className="flex justify-end self-start">
            {renderStatus(checks.workspace.status, checks.workspace.message)}
          </div>
        </div>
      </div>

      {(checks.core.status === 'error' || checks.engine.status === 'error' || checks.workspace.status === 'error') && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-900/20 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-400" />
            <div>
              <p className="font-medium text-red-400">{t('runtime.issue.title')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('runtime.issue.desc')}</p>
            </div>
          </div>
        </div>
      )}

      {showLogs && (
        <div className="mt-4 rounded-lg border bg-black/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{t('runtime.logs.title')}</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleOpenLogDir}>
                <ExternalLink className="mr-1 h-3 w-3" />
                {t('runtime.logs.openFolder')}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowLogs(false)}>
                {t('runtime.logs.close')}
              </Button>
            </div>
          </div>
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded bg-black/50 p-3 font-mono text-xs text-slate-300">
            {logContent || t('runtime.logs.noLogs')}
          </pre>
        </div>
      )}
    </div>
  );
}

function CompleteContent() {
  const { t } = useTranslation('setup');
  const gatewayStatus = useGatewayStore((state) => state.status);

  return (
    <div className="space-y-5 text-center">
      <div className="mb-2 text-5xl">🎉</div>
      <h2 className="text-xl font-semibold">{t('complete.title')}</h2>
      <p className="text-muted-foreground">{t('complete.subtitle')}</p>

      <div className="mx-auto max-w-md space-y-3 text-left">
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <span>{t('complete.identity')}</span>
          <span className="text-green-400">✓ {t('complete.ready')}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <span>{t('complete.workspace')}</span>
          <span className="text-green-400">✓ {t('complete.ready')}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <span>{t('complete.core')}</span>
          <span className={gatewayStatus.state === 'running' ? 'text-green-400' : 'text-yellow-400'}>
            {gatewayStatus.state === 'running' ? `✓ ${t('complete.ready')}` : gatewayStatus.state}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Setup;
