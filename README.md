# Beat in Box Music App

Beat in Box is a modern web application for discovering, playing, and managing music. Built with Next.js and featuring a sleek user interface, it provides a seamless music streaming experience with playlist management capabilities.

## Features

### Core Features

- 🎵 **Music Streaming**
  - YouTube Music integration for vast music library
  - High-quality audio playback
  - Background playback support
  - Queue management and playlist shuffling
  - Continuous playback between tracks

- 👤 **User Experience**
  - User authentication with Google OAuth
  - Personalized playlists and recommendations
  - Cross-device synchronization
  - Dark theme UI
  - Responsive design for all devices

- 📝 **Playlist Management**
  - Create unlimited playlists
  - Add/remove songs from playlists
  - Reorder songs within playlists
  - Share playlists with other users
  - Import/export playlist functionality

- 🔍 **Search & Discovery**
  - Advanced search for songs, artists, and videos
  - Real-time search suggestions
  - Filter results by type
  - Artist page with top songs and albums
  - Related artists recommendations

### Additional Features

- 🎮 **Player Controls**
  - Play/pause/skip controls
  - Volume control and mute option
  - Progress bar with seek functionality
  - Shuffle and repeat modes
  - Mini player mode

- 📱 **Mobile Features**
  - Touch-optimized interface
  - Swipe gestures for navigation
  - Picture-in-picture support
  - Mobile notifications
  - Offline mode support

- 🔄 **Integration & Sync**
  - YouTube Music synchronization
  - Real-time updates across devices
  - Social media sharing
  - Last played position memory
  - Watch history tracking

- 🛠 **Technical Features**
  - Server-side rendering
  - API rate limiting
  - Image proxy for optimization
  - Error tracking and logging
  - Performance monitoring

## Getting Started

### Prerequisites

- Node.js 16.x or later
- PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/beatinbox.git
cd beatinbox
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/beatinbox"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
YOUTUBE_API_KEY="your-youtube-api-key"
```

4. Initialize the database:
```bash
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

### Deployment

For production deployment, you can use:

1. **Vercel** (Recommended):
```bash
npm run build
vercel deploy
```

2. **Docker**:
```bash
docker build -t beatinbox .
docker run -p 3000:3000 beatinbox
```

3. **Manual Deployment**:
```bash
npm run build
npm start
```

### Environment Setup

Additional environment variables for production:

```env
NODE_ENV="production"
VERCEL_URL="your-domain.com"
POSTGRES_PRISMA_URL="your-production-db-url"
POSTGRES_URL_NON_POOLING="your-non-pooling-db-url"
```

## API Documentation

Beat in Box provides a RESTful API for interacting with the application. The API documentation is available at `/api-docs` when running the application.

### Authentication

Most API endpoints require authentication. Use the following authentication methods:

- **Session-based Authentication**: For browser-based access
- **JWT Authentication**: For API access

### API Endpoints

#### Authentication

```http
POST /api/auth/register
```
Register a new user.

**Request Body**
```json
{
  "email": "string",
  "password": "string",
  "name": "string"
}
```

```http
POST /api/auth/reset-password
```
Request a password reset.

**Request Body**
```json
{
  "email": "string"
}
```

#### YouTube Music Integration```http
GET /api/youtubemusic
```
Search YouTube Music.

**Parameters**
- `q` (required): Search query
- `type` (required): Type of search ('song', 'video', 'artist')

```http
GET /api/artist-insights
```
Get detailed artist information.

**Request Body**
```json
{
  "browseId": "string"
}
```

#### Image Proxy

```http
GET /api/proxy-image
```
Proxy for fetching images from external sources.

**Parameters**
- `url` (required): URL of the original image

#### Playlists

```http
GET /api/playlists
```
Get all playlists for the authenticated user.

**Response**
```json
[
  {
    "id": "string",
    "name": "string",
    "userId": "string"
  }
]
```

```http
POST /api/playlists
```
Create a new playlist.

**Request Body**
```json
{
  "name": "string"
}
```

```http
POST /api/playlists/{playlistId}/songs
```
Add a song to a playlist.

**Request Body**
```json
{
  "id": "string",
  "title": "string",
  "artist": "string",
  "thumbnail": "string"
}
```

#### Search

```http
GET /api/search?q={query}
```
Search for music content.

**Parameters**
- `q` (required): Search query string

**Response**
```json
{
  "artists": [],
  "songs": [],
  "videos": []
}
```

#### Videos

```http
GET /api/videos
```
Get a list of videos.

### Testing the API

#### Interactive Swagger Documentation

Beat in Box provides an interactive Swagger UI interface that allows you to explore and test the API. You can access it at:

- **Development**: `http://localhost:3000/api-docs`
- **Production**: `https://beatinbox.com/api-docs`

The Swagger UI interface allows you to:
- Browse all available API endpoints
- View detailed request/response schemas
- Test API endpoints directly in the browser
- Generate code snippets for various languages
- Authenticate and test protected endpoints

To use the Swagger interface:
1. Start the development server
2. Navigate to `http://localhost:3000/api-docs`
3. Click "Authorize" to add your authentication token
4. Expand any endpoint to see details and test it
5. Try out endpoints with the interactive "Try it out" button

#### Alternative Testing Methods

You can also test the API using tools like Postman or cURL:

Example cURL request:
```bash
curl -X GET "http://localhost:3000/api/playlists" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

For local development, the Swagger UI at `localhost:3000/api-docs` provides the most convenient way to test and explore the API functionality. For testing the production API, visit `https://beatinbox.com/api-docs`.

Note: Some API endpoints may have different rate limits or authentication requirements in production. Always refer to the live documentation at `https://beatinbox.com/api-docs` for the most up-to-date API specifications.

## Architecture

### System Requirements

- Node.js 16.x or later
- PostgreSQL 12.x or later
- Modern web browser with JavaScript enabled
- Minimum 1GB RAM for development
- 2GB+ free disk space

### Tech Stack

Beat in Box is built with:

- **Frontend**: Next.js 13+ with App Router
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: Custom store with React Context
- **Styling**: Tailwind CSS
- **API Documentation**: Swagger/OpenAPI

### Project Structure

```
beatinbox/
├── src/
│   ├── app/                 # Next.js 13+ app directory
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── components/     # App-specific components
│   │   └── ...            # Other app routes
│   ├── components/         # Shared React components
│   ├── contexts/          # React contexts
│   ├── lib/               # Utility functions
│   ├── services/          # External service integrations
│   ├── store/             # State management
│   └── types/             # TypeScript type definitions
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── public/                # Static assets
└── scripts/              # Utility scripts
```

### Development Workflow

1. **Local Development**
   ```bash
   npm run dev
   ```
   - Hot reload enabled
   - API documentation at `/api-docs`
   - Swagger UI for testing

2. **Database Updates**
   ```bash
   # Create a migration
   npx prisma migrate dev --name your_migration_name
   
   # Apply migrations
   npx prisma migrate deploy
   
   # Reset database
   npx prisma reset
   ```

3. **Testing**
   ```bash
   # Run tests
   npm test
   
   # Run tests in watch mode
   npm run test:watch
   ```

4. **Code Quality**
   ```bash
   # Lint code
   npm run lint
   
   # Format code
   npm run format
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- YouTube Music API integration
- Next.js team for the amazing framework
- All contributors who have helped shape Beat in Box

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
