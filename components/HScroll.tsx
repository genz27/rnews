'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

export function HScroll({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; left: number } | null>(null);
  const moved = useRef(false);

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === event.pointerId) drag.current = null;
  };

  return (
    <div
      ref={ref}
      className={`h-scroll ${className}`}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const el = ref.current;
        if (!el) return;
        drag.current = { id: event.pointerId, x: event.clientX, left: el.scrollLeft };
        moved.current = false;
      }}
      onPointerMove={(event) => {
        const el = ref.current;
        const start = drag.current;
        if (!el || !start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x;
        if (!moved.current && Math.abs(dx) < 8) return;
        if (!moved.current) {
          moved.current = true;
          el.setPointerCapture(event.pointerId);
        }
        el.scrollLeft = start.left - dx;
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(event) => {
        if (!moved.current) return;
        event.preventDefault();
        event.stopPropagation();
        moved.current = false;
      }}
    >
      {children}
    </div>
  );
}
