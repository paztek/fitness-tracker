import { useEffect, useState } from 'react';
import { mediaKind, mediaUrl, youtubeId, type CatalogExercise } from '@/data/catalog';
import { useSettings } from '@/store/selectors';
import { Icon } from './icons';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Vignette carrée d'un exercice, avec repli sur ses initiales. */
export function ExerciseThumb({ exercise }: { exercise: CatalogExercise }) {
  const { imageSource } = useSettings();
  const [failed, setFailed] = useState(false);
  const first = exercise.images[0];
  const url = first ? mediaUrl(first, imageSource) : null;
  const usable = url && mediaKind(url) === 'image' && !failed;

  if (!usable) {
    return (
      <div className="thumb placeholder" aria-hidden="true">
        {initials(exercise.name)}
      </div>
    );
  }
  return (
    <img
      className="thumb"
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Média principal : les fiches du catalogue ont deux images (début / fin de
 * mouvement) que l'on anime pour montrer le geste.
 */
export function ExerciseMediaViewer({ exercise }: { exercise: CatalogExercise }) {
  const { imageSource } = useSettings();
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [failed, setFailed] = useState(false);

  const urls = exercise.images
    .map((image) => mediaUrl(image, imageSource))
    .filter((url): url is string => Boolean(url));

  const images = urls.filter((url) => mediaKind(url) === 'image');
  const videos = urls.filter((url) => mediaKind(url) !== 'image');

  useEffect(() => {
    if (!playing || images.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % images.length), 1200);
    return () => window.clearInterval(id);
  }, [playing, images.length]);

  if (urls.length === 0 || (images.length === 0 && videos.length === 0)) {
    return (
      <div className="media">
        <div
          className="thumb placeholder"
          style={{ width: '100%', height: '100%', borderRadius: 0, fontSize: '2rem' }}
        >
          {imageSource === 'none' ? 'Images désactivées' : initials(exercise.name)}
        </div>
      </div>
    );
  }

  return (
    <div className="list">
      {videos.map((url) => {
        const id = youtubeId(url);
        return (
          <div className="media" key={url}>
            {id ? (
              <iframe
                src={`https://www.youtube.com/embed/${id}`}
                title={exercise.name}
                allow="accelerometer; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={url} controls playsInline preload="metadata" />
            )}
          </div>
        );
      })}

      {images.length > 0 && !failed && (
        <div className="media">
          <img
            src={images[Math.min(frame, images.length - 1)]}
            alt={`${exercise.name} — illustration ${frame + 1}`}
            onError={() => setFailed(true)}
          />
          {images.length > 1 && (
            <button
              className="frame-toggle"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Arrêter l'animation" : "Animer le mouvement"}
            >
              <Icon name={playing ? 'pause' : 'play'} size={12} />{' '}
              {frame + 1}/{images.length}
            </button>
          )}
        </div>
      )}

      {failed && (
        <div className="card tight small muted">
          <span>
            Images indisponibles hors ligne. Vous pouvez changer la source dans
            Réglages → Images.
          </span>
        </div>
      )}
    </div>
  );
}
