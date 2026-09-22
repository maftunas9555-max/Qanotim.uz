// A handful of soft, slowly drifting golden motes behind the screen content —
// a quiet, inspirational ambience rather than a distraction. Pure CSS
// animation (see .qn-mote in styles.css), respects prefers-reduced-motion.
export function AmbientBackground() {
  return (
    <div className="qn-ambient" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="qn-mote" />
      ))}
    </div>
  );
}
