import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui";

type Props = {
  children: ReactNode;
  title?: string;
  onRemove?: () => void;
};

type State = { hasError: boolean };

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[DashboardWidget]", error, errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-full min-h-[200px] bg-white rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {this.props.title ?? "This widget"} could not load
          </p>
          <p className="text-xs text-gray-500 mb-4 max-w-[240px]">
            Something went wrong. Try removing the widget and adding it again, or
            refresh the page.
          </p>
          {this.props.onRemove && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={this.props.onRemove}
            >
              Remove widget
            </Button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
