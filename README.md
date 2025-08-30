# RazenNotes

A modern, feature-rich todo and note-taking application built with React, TypeScript, and Convex for seamless real-time collaboration and data management.

## Features

- **Task Management**: Create, edit, and organize todos with priorities and due dates
- **Subtasks**: Break down complex tasks into manageable subtasks with drag-and-drop sorting
- **Real-time Sync**: Powered by Convex for instant updates across devices
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Responsive Design**: Optimized for desktop and mobile devices
- **TypeScript**: Fully typed for better development experience and fewer bugs
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Convex (serverless backend-as-a-service)
- **Build Tool**: Vite
- **Linting**: ESLint with TypeScript support

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Convex account (for backend deployment)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Ameenz7/RazenNotes.git
   cd RazenNotes
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Convex:
   - Install Convex CLI globally: `npm install -g convex`
   - Initialize Convex: `convex dev`
   - Follow the prompts to create a new project or link to an existing one

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

- **Adding Todos**: Click the "Add Todo" button to create new tasks
- **Managing Subtasks**: Expand a todo to add and organize subtasks
- **Theme Toggle**: Use the theme toggle button in the header to switch between light and dark modes
- **Real-time Updates**: Changes are automatically synced across all connected devices

## Project Structure

```
src/
├── components/
│   ├── ui/          # Reusable UI components (shadcn/ui)
│   ├── AddTodo.tsx  # Component for adding new todos
│   ├── TodoItem.tsx # Individual todo item component
│   ├── TodoList.tsx # Main todo list component
│   └── ...
├── lib/
│   ├── convex.ts    # Convex client configuration
│   └── utils.ts     # Utility functions
├── App.tsx          # Main application component
└── main.tsx         # Application entry point

convex/
├── schema.ts        # Database schema
├── todos.ts         # Todo-related queries and mutations
└── _generated/      # Auto-generated Convex files
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Convex](https://www.convex.dev/) for the amazing backend-as-a-service
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
