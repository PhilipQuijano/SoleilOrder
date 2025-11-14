import React, { useEffect, useState } from 'react';
import './HelpOverlay.css';

const defaultSteps = [
  {
    title: 'Step 1 — Choose a Category',
    body: 'Select a charm category from the top row. Use the toggle to show/hide categories.',
  },
  {
    title: 'Step 2 — Pick a Charm',
    body: 'Click a charm to select it. You can also drag a charm to your bracelet slots directly.',
  },
  {
    title: 'Step 3 — Place Charms',
    body: 'Click a bracelet slot to place the selected charm, or drag from one slot to reorder.',
  },
  {
    title: 'Step 4 — Remove or Reset',
    body: "Use the small × on a placed charm to remove it, or use the Reset button to restore starting charms.",
  },
  {
    title: 'Step 5 — Finalize',
    body: 'When ready, use Finalize to preview and Add to Cart. You can edit later from the cart page.',
  }
];

const HelpOverlay = ({ open, onClose, steps = defaultSteps }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, steps.length]);

  if (!open) return null;

  return (
    <div className="help-overlay" role="dialog" aria-modal="true" aria-labelledby="help-overlay-title">
      <div className="help-card">
        <header className="help-header">
          <h2 id="help-overlay-title" className="help-title">{steps[index].title}</h2>
          <button className="help-close" aria-label="Close help" onClick={onClose}>×</button>
        </header>

        <div className="help-body">
          <p>{steps[index].body}</p>
        </div>

        <footer className="help-footer">
          <div className="help-pagination" aria-hidden>
            {steps.map((_, i) => (
              <span key={i} className={`help-dot ${i === index ? 'active' : ''}`} />
            ))}
          </div>

          <div className="help-actions">
            <button
              className="help-prev"
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              disabled={index === 0}
            >
              ← Prev
            </button>
            <button
              className="help-next"
              onClick={() => {
                if (index === steps.length - 1) return onClose && onClose();
                setIndex((i) => Math.min(i + 1, steps.length - 1));
              }}
            >
              {index === steps.length - 1 ? 'Done' : 'Next →'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HelpOverlay;
