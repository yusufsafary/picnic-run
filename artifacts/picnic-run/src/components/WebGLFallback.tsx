import { Component, ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; }

export class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="w-full h-full flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <p className="text-5xl mb-4">🎮</p>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">
              3D preview unavailable
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
