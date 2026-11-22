import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Shield, Zap } from 'lucide-react';

interface MobileTouchControlsProps {
  visible: boolean;
  isShieldActive: boolean;
  hasShieldUnlocked: boolean;
  netCaught: boolean;
  energy: number;
  dashLabel: string;
  shieldLabel: string;
  shieldLockedLabel: string;
  breakNetLabel: string;
  turboLabel: string;
  onStickChange: (dx: number, dy: number, active: boolean, sprint: boolean) => void;
  onDash: () => void;
  onToggleShield: () => void;
}

export function detectTouchControlsAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  const hasTouchPoints = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
  const compactViewport = window.innerWidth <= 1024;
  return coarsePointer || (hasTouchPoints && compactViewport) || compactViewport;
}

export const MobileTouchControls: React.FC<MobileTouchControlsProps> = ({
  visible,
  isShieldActive,
  hasShieldUnlocked,
  netCaught,
  energy,
  dashLabel,
  shieldLabel,
  shieldLockedLabel,
  breakNetLabel,
  turboLabel,
  onStickChange,
  onDash,
  onToggleShield
}) => {
  const stickRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dashRepeatRef = useRef<number | null>(null);
  const dashPointerIdRef = useRef<number | null>(null);

  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [normOffset, setNormOffset] = useState({ x: 0, y: 0 });
  const [isTurboEdge, setIsTurboEdge] = useState(false);
  const [isStickHeld, setIsStickHeld] = useState(false);

  const clearDashRepeat = useCallback(() => {
    if (dashRepeatRef.current !== null) {
      window.clearInterval(dashRepeatRef.current);
      dashRepeatRef.current = null;
    }
    dashPointerIdRef.current = null;
  }, []);

  const resetStick = useCallback(() => {
    pointerIdRef.current = null;
    setKnobOffset({ x: 0, y: 0 });
    setNormOffset({ x: 0, y: 0 });
    setIsTurboEdge(false);
    setIsStickHeld(false);
    onStickChange(0, 0, false, false);
  }, [onStickChange]);

  useEffect(() => {
    if (!visible) {
      clearDashRepeat();
      resetStick();
    }
  }, [visible, clearDashRepeat, resetStick]);

  useEffect(() => {
    const handleCancelAll = () => {
      clearDashRepeat();
      resetStick();
    };
    window.addEventListener('blur', handleCancelAll);
    return () => {
      window.removeEventListener('blur', handleCancelAll);
      clearDashRepeat();
      onStickChange(0, 0, false, false);
    };
  }, [clearDashRepeat, resetStick, onStickChange]);

  const updateStickFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = stickRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.5;
      const maxRadius = rect.width * 0.49;

      const rawDx = clientX - centerX;
      const rawDy = clientY - centerY;
      const dist = Math.hypot(rawDx, rawDy);
      const clampedDist = Math.min(maxRadius, dist);

      const normX = dist > 0.001 ? (rawDx / dist) * (clampedDist / maxRadius) : 0;
      const normY = dist > 0.001 ? (rawDy / dist) * (clampedDist / maxRadius) : 0;

      const deadzone = 0.035;
      const mag = Math.hypot(normX, normY);
      const active = mag >= deadzone;
      const sprint = mag > 0.86;

      setKnobOffset({
        x: normX * maxRadius,
        y: normY * maxRadius
      });
      setNormOffset({ x: normX, y: normY });
      setIsTurboEdge(sprint);
      setIsStickHeld(true);

      if (!active) {
        onStickChange(0, 0, false, false);
      } else {
        const dirX = normX / mag;
        const dirY = normY / mag;
        const normalizedTilt = Math.min(1, (mag - deadzone) / (1 - deadzone));
        const curvedMag = Math.pow(normalizedTilt, 1.55);
        onStickChange(
          Math.max(-1, Math.min(1, dirX * curvedMag)),
          Math.max(-1, Math.min(1, dirY * curvedMag)),
          true,
          sprint
        );
      }
    },
    [onStickChange]
  );

  if (!visible) return null;

  const dashReady = energy >= 20;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none touch-none">
      {/* Left Hand: Stationary 144px Precision Ring with Pointer Capture + Movable Knob */}
      <div
        className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 flex flex-col items-start gap-1.5"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)'
        }}
      >
        <div
          ref={stickRef}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (pointerIdRef.current === null) {
              pointerIdRef.current = e.pointerId;
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Ignore capture failure on synthetic pointers
              }
              updateStickFromPoint(e.clientX, e.clientY);
            }
          }}
          onPointerMove={(e) => {
            if (pointerIdRef.current === e.pointerId) {
              e.stopPropagation();
              updateStickFromPoint(e.clientX, e.clientY);
            }
          }}
          onPointerUp={(e) => {
            if (pointerIdRef.current === e.pointerId) {
              e.stopPropagation();
              resetStick();
            }
          }}
          onPointerCancel={(e) => {
            if (pointerIdRef.current === e.pointerId) {
              e.stopPropagation();
              resetStick();
            }
          }}
          className={`relative w-36 h-36 [@media(max-height:460px)]:w-28 [@media(max-height:460px)]:h-28 rounded-full pointer-events-auto touch-none flex items-center justify-center border-2 backdrop-blur-[2px] transition-colors duration-150 ${
            isTurboEdge
              ? 'bg-amber-950/50 border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.45)]'
              : isStickHeld
                ? 'bg-slate-900/65 border-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.35)]'
                : 'bg-slate-950/55 border-sky-400/50 shadow-[0_6px_22px_rgba(0,0,0,0.75)]'
          }`}
        >
          {/* Dashed inner steering ring */}
          <div className="absolute inset-2.5 rounded-full border border-dashed border-sky-300/25 pointer-events-none" />

          {/* Subtle radial direction guide line when steering */}
          {isStickHeld && (Math.abs(knobOffset.x) > 2 || Math.abs(knobOffset.y) > 2) && (
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
            >
              <line
                x1="50"
                y1="50"
                x2={50 + normOffset.x * 49}
                y2={50 + normOffset.y * 49}
                stroke={isTurboEdge ? 'rgba(251, 191, 36, 0.7)' : 'rgba(56, 189, 248, 0.65)'}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}

          {/* Directional chevrons */}
          <span className="absolute top-1.5 text-[9px] text-sky-200/55 font-black pointer-events-none">
            ▲
          </span>
          <span className="absolute bottom-1.5 text-[9px] text-sky-200/55 font-black pointer-events-none">
            ▼
          </span>
          <span className="absolute left-2 text-[9px] text-sky-200/55 font-black pointer-events-none">
            ◀
          </span>
          <span className="absolute right-2 text-[9px] text-sky-200/55 font-black pointer-events-none">
            ▶
          </span>

          {isTurboEdge && (
            <span className="absolute -top-5 text-[10px] font-extrabold text-amber-300 tracking-wider pointer-events-none whitespace-nowrap">
              {turboLabel}
            </span>
          )}

          {/* Movable Thumb Knob */}
          <div
            style={{
              transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
              transition: isStickHeld ? 'none' : 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className={`w-11 h-11 sm:w-12 sm:h-12 [@media(max-height:460px)]:w-9 [@media(max-height:460px)]:h-9 rounded-full border-2 flex items-center justify-center shadow-xl pointer-events-none transition-colors duration-150 ${
              isTurboEdge
                ? 'bg-amber-400 border-amber-100'
                : isStickHeld
                  ? 'bg-sky-400 border-sky-100'
                  : 'bg-slate-900/95 border-sky-300'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${
                isTurboEdge || isStickHeld ? 'bg-slate-950/80' : 'bg-sky-300/80'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Right Hand: Ergonomic Circular Action Cluster + Contextual Break Net Button */}
      <div
        className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 flex flex-col items-end gap-2"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)'
        }}
      >
        {netCaught && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onToggleShield();
            }}
            className="pointer-events-auto touch-none min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 border-2 border-amber-100 text-slate-950 font-extrabold text-xs tracking-wide shadow-[0_6px_18px_rgba(0,0,0,0.85)] active:scale-95 transition-transform whitespace-nowrap cursor-pointer"
          >
            🕸️ {breakNetLabel}
          </button>
        )}

        <div
          className="flex items-end gap-2.5 sm:gap-3 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Secondary Orb: Energy Shield [E] */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onToggleShield();
            }}
            className={`w-14 h-14 sm:w-[60px] sm:h-[60px] [@media(max-height:460px)]:w-12 [@media(max-height:460px)]:h-12 rounded-full border-2 flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform touch-none cursor-pointer ${
              isShieldActive
                ? 'bg-sky-400 border-sky-100 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.75)]'
                : hasShieldUnlocked
                  ? 'bg-slate-900/90 border-sky-400/80 text-sky-200'
                  : 'bg-slate-950/80 border-slate-700 text-slate-400'
            }`}
            aria-label={shieldLabel}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[9px] font-extrabold leading-none mt-1 whitespace-nowrap">
              {hasShieldUnlocked ? shieldLabel : shieldLockedLabel}
            </span>
          </button>

          {/* Primary Large Orb: Turbo Dash (supports tap & hold burst) */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              clearDashRepeat();
              dashPointerIdRef.current = e.pointerId;
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Ignore capture failure on synthetic pointers
              }
              onDash();
              dashRepeatRef.current = window.setInterval(() => {
                onDash();
              }, 220);
            }}
            onPointerUp={(e) => {
              if (dashPointerIdRef.current === e.pointerId) {
                e.stopPropagation();
                clearDashRepeat();
              }
            }}
            onPointerCancel={(e) => {
              if (dashPointerIdRef.current === e.pointerId) {
                e.stopPropagation();
                clearDashRepeat();
              }
            }}
            className={`w-16 h-16 sm:w-[72px] sm:h-[72px] [@media(max-height:460px)]:w-14 [@media(max-height:460px)]:h-14 rounded-full border-2 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform touch-none cursor-pointer ${
              dashReady
                ? 'bg-amber-400 border-amber-100 text-slate-950 shadow-[0_0_22px_rgba(251,191,36,0.5)]'
                : 'bg-slate-900/85 border-slate-600 text-slate-400'
            }`}
            aria-label={dashLabel}
          >
            <Zap className={`w-6 h-6 ${dashReady ? 'fill-slate-950' : ''}`} />
            <span className="text-[10px] font-extrabold leading-none mt-0.5 whitespace-nowrap">
              {dashLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
