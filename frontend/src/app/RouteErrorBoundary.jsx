import { Component } from 'react'

export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unexpected route error', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="grid min-h-screen place-items-center px-6" id="main-content">
        <section className="panel max-w-lg text-center" role="alert">
          <p className="text-sm font-semibold uppercase tracking-wide text-aff-danger">Unexpected error</p>
          <h1 className="mt-2 text-2xl font-bold">This page could not be displayed.</h1>
          <p className="mt-3 text-aff-muted">Try the page again. If the problem continues, return to the home page.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="button-primary" type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
            <a className="button-secondary" href="/">Go home</a>
          </div>
        </section>
      </main>
    )
  }
}
