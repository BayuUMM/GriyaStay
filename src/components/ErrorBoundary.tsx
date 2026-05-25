import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React rendering error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-sm p-8 shadow-2xl relative overflow-hidden">
            {/* Holographic glowing background */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500/30 mb-6">
                <span className="text-rose-400 font-mono text-xl font-bold">!</span>
              </div>
              
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider mb-2">
                Sistem Sedang Memulihkan Diri
              </h1>
              
              <p className="text-xs text-white/60 tracking-wide leading-relaxed mb-6">
                GriyaStay mendeteksi adanya kendala saat memuat antarmuka. Kami telah mengaktifkan mode isolasi pemulihan otomatis agar website tidak mengalami kendala layar kosong (white screen).
              </p>

              {this.state.error && (
                <div className="w-full text-left p-4 bg-black/50 border border-white/5 rounded-sm font-mono text-[10px] text-rose-300 overflow-x-auto max-h-32 mb-6 select-all">
                  <strong>Penyebab:</strong> {this.state.error.message}
                </div>
              )}

              <button
                onClick={this.handleReset}
                className="w-full bg-white text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-sm hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
              >
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
