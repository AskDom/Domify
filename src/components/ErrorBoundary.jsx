import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Algo salió mal
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
