import { Component, type ErrorInfo, type ReactNode } from "react";
import "./ErrorBoundary.css";

interface ErrorBoundaryProps {
    children: ReactNode;
    title?: string;
    message?: string;
}

interface ErrorBoundaryState {
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {error: null};

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {error};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("Unhandled application error", error, errorInfo);
    }

    handleReload = (): void => {
        window.location.reload();
    };

    render() {
        if (this.state.error === null) {
            return this.props.children;
        }

        return (
            <section className="errorBoundary" role="alert">
                <span className="panelEyebrow">Application error</span>
                <h1>{this.props.title ?? "Something went wrong"}</h1>
                <p>{this.props.message ?? "This page could not be displayed. Reload the page and try again."}</p>
                <button type="button" onClick={this.handleReload}>Reload page</button>
            </section>
        );
    }
}

export default ErrorBoundary;
