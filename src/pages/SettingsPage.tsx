import { useRef, useState } from 'react';
import { Screen } from '@/components/Layout';
import { Icon } from '@/components/icons';
import { Confirm, NumberField, Segmented, Sheet, SwitchRow, useToast } from '@/components/ui';
import { useSessions, useSettings, useTemplates } from '@/store/selectors';
import { STORAGE_KEY, useStore } from '@/store/store';
import {
  backupToJson,
  downloadBackup,
  parseBackup,
  readTextFile,
  shareBackup,
} from '@/lib/transfer';
import { formatNumber, plural } from '@/lib/format';
import type { BackupFile, ImageSource, ThemeSetting } from '@/types';

function storageSizeKb(): number {
  try {
    return Math.round(((localStorage.getItem(STORAGE_KEY)?.length ?? 0) / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}

export function SettingsPage() {
  const toast = useToast();
  const settings = useSettings();
  const templates = useTemplates();
  const sessions = useSessions();
  const customExercises = useStore((s) => s.customExercises);
  const setSettings = useStore((s) => s.setSettings);
  const importBackup = useStore((s) => s.importBackup);
  const resetAll = useStore((s) => s.resetAll);

  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPending(parseBackup(await readTextFile(file)));
    } catch (error) {
      toast((error as Error).message, 'danger');
    }
  };

  const handlePasted = () => {
    try {
      setPending(parseBackup(pasted));
      setPasting(false);
      setPasted('');
    } catch (error) {
      toast((error as Error).message, 'danger');
    }
  };

  const runImport = (mode: 'replace' | 'merge') => {
    if (!pending) return;
    const report = importBackup(pending, mode);
    setPending(null);
    toast(
      `${plural(report.templates, 'modèle')} et ${plural(report.sessions, 'séance')} ${
        mode === 'replace' ? 'restaurés' : 'fusionnés'
      }.`,
    );
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(backupToJson());
      toast('Sauvegarde copiée dans le presse-papier.');
    } catch {
      toast('Copie impossible sur cet appareil.', 'danger');
    }
  };

  return (
    <Screen title="Réglages">
      <div className="card">
        <h2>Séance</h2>

        <div className="field">
          <span className="label">Repos par défaut (secondes)</span>
          <NumberField
            value={settings.defaultRestSec}
            onChange={(defaultRestSec) => setSettings({ defaultRestSec: defaultRestSec ?? 90 })}
            step={15}
            ariaLabel="Repos par défaut"
          />
        </div>

        <div className="field">
          <span className="label">Pas d'incrément de charge (kg)</span>
          <NumberField
            value={settings.weightIncrement}
            onChange={(weightIncrement) =>
              setSettings({ weightIncrement: weightIncrement ?? 2.5 })
            }
            step={0.5}
            ariaLabel="Incrément de charge"
          />
        </div>

        <SwitchRow
          label="Minuteur automatique"
          hint="Démarre le repos dès qu'une série est validée."
          checked={settings.restAutoStart}
          onChange={(restAutoStart) => setSettings({ restAutoStart })}
        />
        <SwitchRow
          label="Bip de fin de repos"
          checked={settings.restSound}
          onChange={(restSound) => setSettings({ restSound })}
        />
        <SwitchRow
          label="Vibration"
          checked={settings.restVibration}
          onChange={(restVibration) => setSettings({ restVibration })}
        />
        <SwitchRow
          label="Garder l'écran allumé"
          hint="Pendant une séance, si le navigateur le permet."
          checked={settings.keepAwake}
          onChange={(keepAwake) => setSettings({ keepAwake })}
        />
      </div>

      <div className="card">
        <h2>Affichage</h2>
        <div className="field">
          <span className="label">Thème</span>
          <Segmented<ThemeSetting>
            value={settings.theme}
            options={[
              { value: 'dark', label: 'Sombre' },
              { value: 'light', label: 'Clair' },
              { value: 'auto', label: 'Système' },
            ]}
            onChange={(theme) => setSettings({ theme })}
          />
        </div>
        <div className="field">
          <span className="label">Images des exercices</span>
          <Segmented<ImageSource>
            value={settings.imageSource}
            options={[
              { value: 'github', label: 'GitHub' },
              { value: 'jsdelivr', label: 'jsDelivr' },
              { value: 'none', label: 'Aucune' },
            ]}
            onChange={(imageSource) => setSettings({ imageSource })}
          />
          <span className="tiny muted">
            Les illustrations sont chargées depuis un dépôt public (free-exercise-db).
            Choisissez « Aucune » pour une application 100 % hors ligne.
          </span>
        </div>
      </div>

      <div className="card">
        <h2>Mes données</h2>
        <p className="small muted" style={{ margin: 0 }}>
          Tout est enregistré dans ce navigateur ({formatNumber(storageSizeKb(), 1)} Ko) :{' '}
          {plural(templates.length, 'modèle')}, {plural(sessions.length, 'séance')},{' '}
          {plural(customExercises.length, 'exercice perso')}. Exportez régulièrement pour ne
          rien perdre.
        </p>

        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={() => {
              downloadBackup();
              toast('Sauvegarde exportée.');
            }}
          >
            <Icon name="download" size={18} /> Exporter
          </button>
          <button className="btn" onClick={() => fileInput.current?.click()}>
            <Icon name="upload" size={18} /> Importer
          </button>
        </div>

        <div className="btn-row">
          <button
            className="btn btn-sm"
            onClick={async () => {
              if (!(await shareBackup())) toast('Partage indisponible ici.', 'danger');
            }}
          >
            <Icon name="share" size={16} /> Partager
          </button>
          <button className="btn btn-sm" onClick={copyJson}>
            <Icon name="copy" size={16} /> Copier le JSON
          </button>
          <button className="btn btn-sm" onClick={() => setPasting(true)}>
            <Icon name="note" size={16} /> Coller un JSON
          </button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        <button className="btn btn-danger btn-block" onClick={() => setConfirmReset(true)}>
          <Icon name="trash" size={18} /> Effacer toutes mes données
        </button>
      </div>

      <div className="card">
        <h2>À propos</h2>
        <p className="small muted" style={{ margin: 0 }}>
          Application 100 % locale : aucune donnée ne quitte votre appareil. Catalogue
          d'exercices et illustrations issus de{' '}
          <a
            href="https://github.com/yuhonas/free-exercise-db"
            target="_blank"
            rel="noopener noreferrer"
          >
            free-exercise-db
          </a>{' '}
          (domaine public).
        </p>
        <p className="tiny muted" style={{ margin: 0 }}>
          Astuce : « Ajouter à l'écran d'accueil » depuis le menu de votre navigateur
          pour l'utiliser comme une application.
        </p>
      </div>

      <Sheet open={pasting} title="Coller une sauvegarde" onClose={() => setPasting(false)}
        footer={
          <>
            <button className="btn" onClick={() => setPasting(false)}>
              Annuler
            </button>
            <button className="btn btn-primary" onClick={handlePasted}>
              Analyser
            </button>
          </>
        }
      >
        <textarea
          className="textarea"
          style={{ minHeight: 160 }}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder='{"app":"fitness-tracker", …}'
        />
      </Sheet>

      <Sheet
        open={Boolean(pending)}
        title="Importer cette sauvegarde ?"
        onClose={() => setPending(null)}
      >
        <div className="stat-grid">
          <div className="stat">
            <span className="value">{pending?.data.templates.length ?? 0}</span>
            <span className="label muted">modèles</span>
          </div>
          <div className="stat">
            <span className="value">{pending?.data.sessions.length ?? 0}</span>
            <span className="label muted">séances</span>
          </div>
          <div className="stat">
            <span className="value">{pending?.data.customExercises.length ?? 0}</span>
            <span className="label muted">exercices</span>
          </div>
        </div>
        <div className="list">
          <button className="btn btn-primary btn-block" onClick={() => runImport('merge')}>
            Fusionner avec mes données
          </button>
          <button className="btn btn-danger btn-block" onClick={() => runImport('replace')}>
            Remplacer tout
          </button>
        </div>
      </Sheet>

      <Confirm
        open={confirmReset}
        title="Tout effacer ?"
        message="Modèles, séances, exercices perso et réglages seront supprimés de ce navigateur. Pensez à exporter avant."
        confirmLabel="Tout effacer"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAll();
          setConfirmReset(false);
          toast('Données effacées.');
        }}
      />
    </Screen>
  );
}
