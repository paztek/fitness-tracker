import { useEffect, useState } from 'react';
import type { CustomExercise } from '@/types';
import { CATEGORY_FR, EQUIPMENT_FR, MUSCLE_FR } from '@/data/labels';
import { useStore } from '@/store/store';
import { EQUIPMENT_ORDER } from './ExerciseSearch';
import { FilterChip, Sheet, useToast } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Exercice à modifier ; absent = création. */
  editing?: CustomExercise | null;
  onSaved?: (exercise: CustomExercise) => void;
}

const EMPTY = {
  name: '',
  primaryMuscles: [] as string[],
  equipment: '' as string,
  category: 'strength',
  instructions: '',
  media: '',
};

/** Création / édition d'un exercice personnel (autres sports, machines maison…). */
export function CustomExerciseSheet({ open, onClose, editing, onSaved }: Props) {
  const addCustomExercise = useStore((s) => s.addCustomExercise);
  const updateCustomExercise = useStore((s) => s.updateCustomExercise);
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            name: editing.name,
            primaryMuscles: editing.primaryMuscles,
            equipment: editing.equipment ?? '',
            category: editing.category,
            instructions: editing.instructions.join('\n'),
            media: editing.media.join('\n'),
          }
        : EMPTY,
    );
  }, [open, editing]);

  const lines = (text: string) =>
    text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

  const save = () => {
    const name = form.name.trim();
    if (!name) {
      toast('Donnez un nom à votre exercice.', 'danger');
      return;
    }
    const payload = {
      name,
      primaryMuscles: form.primaryMuscles,
      secondaryMuscles: [],
      equipment: form.equipment || null,
      category: form.category,
      instructions: lines(form.instructions),
      media: lines(form.media),
    };

    if (editing) {
      updateCustomExercise(editing.id, payload);
      onSaved?.({ ...editing, ...payload });
      toast('Exercice modifié.');
    } else {
      const created = addCustomExercise(payload);
      onSaved?.(created);
      toast('Exercice ajouté à votre catalogue.');
    }
    onClose();
  };

  return (
    <Sheet
      open={open}
      title={editing ? "Modifier l'exercice" : 'Nouvel exercice'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={save}>
            Enregistrer
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="custom-name">Nom</label>
        <input
          id="custom-name"
          className="input"
          value={form.name}
          placeholder="Ex. : Rameur Concept2, Gainage latéral…"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="field">
        <span className="label">Muscles travaillés</span>
        <div className="chips">
          {Object.entries(MUSCLE_FR).map(([key, fr]) => (
            <FilterChip
              key={key}
              label={fr}
              selected={form.primaryMuscles.includes(key)}
              onClick={() =>
                setForm({
                  ...form,
                  primaryMuscles: form.primaryMuscles.includes(key)
                    ? form.primaryMuscles.filter((m) => m !== key)
                    : [...form.primaryMuscles, key],
                })
              }
            />
          ))}
        </div>
      </div>

      <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
        <div className="field grow">
          <label htmlFor="custom-equipment">Matériel</label>
          <select
            id="custom-equipment"
            className="select"
            value={form.equipment}
            onChange={(e) => setForm({ ...form, equipment: e.target.value })}
          >
            <option value="">Aucun</option>
            {EQUIPMENT_ORDER.map((key) => (
              <option key={key} value={key}>
                {EQUIPMENT_FR[key] ?? key}
              </option>
            ))}
          </select>
        </div>
        <div className="field grow">
          <label htmlFor="custom-category">Catégorie</label>
          <select
            id="custom-category"
            className="select"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {Object.entries(CATEGORY_FR).map(([key, fr]) => (
              <option key={key} value={key}>
                {fr}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="custom-media">Images / vidéos (une URL par ligne)</label>
        <textarea
          id="custom-media"
          className="textarea"
          value={form.media}
          placeholder="https://www.youtube.com/watch?v=…&#10;https://exemple.com/photo.jpg"
          onChange={(e) => setForm({ ...form, media: e.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="custom-instructions">Consignes (une étape par ligne)</label>
        <textarea
          id="custom-instructions"
          className="textarea"
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
        />
      </div>
    </Sheet>
  );
}
