# Jaishree Colony Management Backend

Clean backend API for the Jaishree Colony Management System without any hardcoded data.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based permissions
- **User Management**: Complete CRUD operations for users with different roles
- **Colony Management**: Create and manage real estate colonies
- **Plot Management**: Handle individual plots within colonies
- **Booking System**: Complete booking workflow with payment tracking
- **Clean Architecture**: No hardcoded data, ready for production

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and update with your real database connection:

```bash
cp .env.example .env
```

Update the `.env` file with your MongoDB connection string:
```
MONGODB_URI=your_real_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Initialize Database
Run the database initialization script to create roles and admin user:

```bash
npm run init-db
```

This will create:
- Basic roles (Admin, Manager, Agent, Buyer, Lawyer)
- Admin user with credentials from .env file
- Sample cities

### 4. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/profile` - Update profile
- `PUT /api/v1/auth/change-password` - Change password

### Users
- `GET /api/v1/users` - Get all users (Protected)
- `POST /api/v1/users` - Create user (Protected)
- `PUT /api/v1/users/:id` - Update user (Protected)
- `DELETE /api/v1/users/:id` - Delete user (Protected)
- `GET /api/v1/users/roles/all` - Get all roles (Protected)

### Cities
- `GET /api/v1/cities` - Get all cities (Public)
- `POST /api/v1/cities` - Create city (Protected)
- `PUT /api/v1/cities/:id` - Update city (Protected)
- `DELETE /api/v1/cities/:id` - Delete city (Protected)

### Colonies
- `GET /api/v1/colonies` - Get all colonies (Public)
- `GET /api/v1/colonies/:id` - Get colony by ID (Public)
- `POST /api/v1/colonies` - Create colony (Protected)
- `PUT /api/v1/colonies/:id` - Update colony (Protected)
- `DELETE /api/v1/colonies/:id` - Delete colony (Protected)

### Plots
- `GET /api/v1/plots/colony/:colonyId` - Get plots by colony (Public)
- `GET /api/v1/plots/:id` - Get plot by ID (Public)
- `GET /api/v1/plots` - Get all plots (Protected)
- `POST /api/v1/plots` - Create plot (Protected)
- `PUT /api/v1/plots/:id` - Update plot (Protected)
- `DELETE /api/v1/plots/:id` - Delete plot (Protected)

### Bookings
- `GET /api/v1/bookings` - Get all bookings (Protected)
- `GET /api/v1/bookings/:id` - Get booking by ID (Protected)
- `POST /api/v1/bookings` - Create booking (Protected)
- `PUT /api/v1/bookings/:id` - Update booking (Protected)
- `PUT /api/v1/bookings/:id/cancel` - Cancel booking (Protected)

### Health Check
- `GET /api/v1/health` - API health status

## Default Login Credentials

After running the initialization script:
- **Admin**: admin@jayshree.com / admin123

## Database Models

### User
- Authentication and user management
- Role-based permissions
- Profile information

### Role
- Permission-based access control
- Hierarchical role system

### City
- Location management
- State and country information

### Colony
- Real estate project management
- Location and pricing information
- Amenities and features

### Plot
- Individual plot management
- Pricing and availability
- Plot characteristics

### Booking
- Booking workflow management
- Payment tracking
- Status management

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation
- Role-based authorization

## CORS Configuration

The backend is configured to accept requests from:
- http://localhost:5173 (Frontend)
- http://localhost:5174 (User App)
- http://localhost:3000 (Fallback)

Update CORS origins in server.js if needed.

## Production Deployment

1. Set NODE_ENV=production in .env
2. Use a production MongoDB database
3. Set strong JWT_SECRET
4. Configure proper CORS origins
5. Use PM2 or similar for process management

## Support

For any issues or questions, contact the development team.
