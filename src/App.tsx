import { TodoList } from './components/TodoList'
import { ThemeToggle } from './components/ThemeToggle'
import { Toaster } from './components/ui/toast'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <ThemeToggle />
        <TodoList />
        <Toaster />
      </div>
    </div>
  )
}

export default App
