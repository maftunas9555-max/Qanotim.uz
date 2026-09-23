// A handful of soft, slowly drifting golden shapes behind the screen content —
// a quiet, inspirational ambience rather than a distraction. Pure CSS
// animation (see .qn-mote in styles.css), respects prefers-reduced-motion.
const SHAPES = ['qn-mote-circle', 'qn-mote-square', 'qn-mote-triangle'];

export function AmbientBackground() {
  return (
    <div className="qn-ambient" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={`qn-mote ${SHAPES[i % SHAPES.length]}`} />
      ))}
    </div>
  );
}
