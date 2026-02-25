import React from 'react'

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div
                    className="flex flex-col items-center justify-center h-full gap-4 p-8"
                    style={{ background: 'var(--bg-content)', color: 'var(--text-body)' }}
                >
                    <div className="text-4xl">😵</div>
                    <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text-title)' }}>
                        出了点问题
                    </h2>
                    <p className="text-[13px] text-center max-w-[400px]" style={{ color: 'var(--text-muted)' }}>
                        应用遇到了一个意外错误。你可以尝试刷新页面或重置。
                    </p>
                    {this.state.error && (
                        <pre
                            className="text-[11px] p-3 rounded-lg max-w-[500px] overflow-auto"
                            style={{
                                background: 'var(--color-red-light)',
                                color: 'var(--color-red)',
                                border: '1px solid var(--color-red)'
                            }}
                        >
                            {this.state.error.message}
                        </pre>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={this.handleReset}
                            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
                            style={{
                                background: 'var(--color-blue)',
                                color: 'white'
                            }}
                        >
                            重试
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 rounded-lg text-[13px] border transition-colors"
                            style={{
                                borderColor: 'var(--border-default)',
                                color: 'var(--text-body)'
                            }}
                        >
                            刷新页面
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
