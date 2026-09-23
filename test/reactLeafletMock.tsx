import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";

interface ChildrenProps {
  children?: ReactNode;
  className?: string;
}

interface PolygonProps extends ChildrenProps {
  eventHandlers?: {
    click?: () => void;
    mouseover?: () => void;
    mouseout?: () => void;
  };
}

interface MockPolygonHandle {
  getElement: () => HTMLButtonElement | null;
}

export function MapContainer({ children, className }: ChildrenProps) {
  return <div className={className}>{children}</div>;
}

export function TileLayer() {
  return null;
}

export const Polygon = forwardRef<MockPolygonHandle, PolygonProps>(
  function PolygonMock({ children, eventHandlers }, forwardedRef) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    useImperativeHandle(forwardedRef, () => ({
      getElement: () => buttonRef.current,
    }));

    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={eventHandlers?.click}
        onMouseEnter={eventHandlers?.mouseover}
        onMouseLeave={eventHandlers?.mouseout}
      >
        {children}
      </button>
    );
  },
);

export function Tooltip({ children }: ChildrenProps) {
  return <div>{children}</div>;
}

export function Marker() {
  return null;
}

export function useMap() {
  return {
    invalidateSize: () => undefined,
    fitBounds: () => undefined,
  };
}
