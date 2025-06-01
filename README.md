# User Sync Application
Vue.js frontend application that implements user synchronization with encrypted data handling, authentication, and offline capabilities. Built as a Progressive Web App (PWA) using Vite.

## Features

- User authentication with encrypted data handling
- Real-time user synchronization with offline support
- Automatic periodic sync every minute
- Infinite pagination with configurable limits
- Modern, responsive UI with sync status indicators
- PWA support for offline functionality
- IndexedDB for local data storage
- TypeScript support for better type safety

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sync-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
VITE_API_BASE_URL=https://calls.trolley.systems
```

## Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Testing

To run the tests:

```bash
npm run test
```

## Project Structure

```
src/
├── components/         # Vue components
│   ├── LoginForm.vue     
│   └── syncProgress.vue
   └── syncStatus.vue    


├── services/          # Core services
│   ├── api.service.ts # API communication
│   ├── encryption.service.ts # Data encryption
│   └── storage.service.ts # IndexedDB storage
├── types/             # TypeScript type definitions
├── router/            # Vue Router configuration
├── App.vue           # Root component
└── main.ts           # Application entry point
```

## Technical Details

- **Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite
- **State Management**: Vue's built-in reactivity system
- **Routing**: Vue Router
- **Storage**: IndexedDB
- **Encryption**: CryptoJS
- **API Communication**: Axios
- **PWA Support**: vite-plugin-pwa

## Security Features

- AES-GCM encryption for data transmission
- Secure token-based authentication
- Password hashing with bcrypt
- Secure storage of sensitive data
- Automatic token refresh

## Offline Capabilities

- Service Worker for offline access
- IndexedDB for local data storage
- Automatic sync when coming back online
- Periodic background sync
- Cache-first strategy for static assets

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
