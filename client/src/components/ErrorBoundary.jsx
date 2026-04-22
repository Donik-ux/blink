import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Что-то сломалось</h1>
          <p className="text-muted mb-6 max-w-sm">
            Произошла ошибка в интерфейсе. Попробуй перезагрузить страницу.
          </p>
          <button
            onClick={this.handleReload}
            className="bg-accent text-black font-semibold px-6 py-3 rounded-xl"
          >
            Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
