/** Jeu d'icônes minimal, tracé en `currentColor` (style Feather). */

export type IconName =
  | 'home'
  | 'templates'
  | 'catalog'
  | 'progress'
  | 'settings'
  | 'search'
  | 'plus'
  | 'minus'
  | 'check'
  | 'x'
  | 'back'
  | 'chevron'
  | 'play'
  | 'pause'
  | 'stop'
  | 'trash'
  | 'copy'
  | 'edit'
  | 'timer'
  | 'download'
  | 'upload'
  | 'share'
  | 'up'
  | 'down'
  | 'dumbbell'
  | 'flame'
  | 'calendar'
  | 'info'
  | 'note'
  | 'image'
  | 'link'
  | 'trophy'
  | 'more';

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5',
  templates: 'M4 6h16M4 12h16M4 18h10',
  catalog: 'M6.5 9v6M17.5 9v6M3.5 10.5v3M20.5 10.5v3M6.5 12h11',
  progress: 'M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-6',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4.4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  back: 'M15 19l-7-7 7-7',
  chevron: 'M9 5l7 7-7 7',
  play: 'M7 4.5v15l13-7.5-13-7.5Z',
  pause: 'M9 5v14M15 5v14',
  stop: 'M6.5 6.5h11v11h-11z',
  trash: 'M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  edit: 'M4 20h4L19 9l-4-4L4 16v4ZM14.5 5.5l4 4',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 9v4l2.5 2M9 2.5h6',
  download: 'M12 4v11M7.5 11l4.5 4 4.5-4M5 19h14',
  upload: 'M12 20V9M7.5 13l4.5-4 4.5 4M5 5h14',
  share: 'M12 3v13M8 7l4-4 4 4M5 14v6h14v-6',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  dumbbell: 'M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4M6.5 12h11',
  flame: 'M12 21c3.5 0 6-2.3 6-5.5 0-4-4-5.5-3-9.5-3 1-5 4-5 6.5 0 1 .3 1.8.8 2.5-1.2-.3-2-1.3-2.3-2.5-1 1.2-1.5 2.6-1.5 4 0 3.2 2.5 4.5 5 4.5Z',
  calendar: 'M4.5 6.5h15v13h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01',
  note: 'M6 3.5h9l4 4V20.5H6zM15 3.5v4.5h4',
  image: 'M4.5 5.5h15v13h-15zM4.5 15l4-4 4 4 3-3 3.5 3.5M9 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  link: 'M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5',
  more: 'M6 12h.01M12 12h.01M18 12h.01',
  trophy:
    'M7 4.5h10v4a5 5 0 0 1-10 0v-4ZM7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11M10 13.5V17M14 13.5V17M8 20h8',
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, size = 22, className, filled }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
