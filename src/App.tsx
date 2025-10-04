import { useState, useEffect } from "react"
import "./App.css"

function App() {
  const [form, setForm] = useState(null)

  useEffect(() => {
    // Обработчик сообщений от VS Code расширения
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.form) {
        console.log("Получена форма:", event.data.form)
        setForm(event.data.form)
      }
    }

    window.addEventListener("message", handleMessage)

    // Отправляем сигнал о готовности VS Code расширению
    if (window.parent !== window) {
      window.parent.postMessage({ ready: true }, "*")
    }

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Nakidka Web App</h1>
        <p>Веб-приложение для расширения VS Code</p>
      </header>

      <main className="app-main">
        <section className="components-section">
          <h2>Компоненты</h2>
          {form ? (
            <div className="form-container">
              <h3>Полученная форма:</h3>
              <pre>{JSON.stringify(form, null, 2)}</pre>
            </div>
          ) : (
            <p>Ожидание получения формы...</p>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
