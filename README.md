# Fix My Ride - CRM System with Authentication

A complete Customer Relationship Management (CRM) website for a two-wheeler automobile company built with React, Node.js, Express, and MongoDB, featuring secure admin authentication.

## 🚀 Features

### Authentication Features
- **Secure Login System**: JWT-based authentication
- **Role-Based Access Control**: Admin, Manager, and Staff roles
- **Session Management**: Persistent login sessions
- **Password Security**: Bcrypt password hashing
- **Protected Routes**: API endpoints secured with authentication middleware

### Frontend Features
- **Login Page**: Professional login interface with demo credentials
- **Dashboard**: Overview with key metrics and recent activities
- **Customers Management**: Add, view, search, and manage customer information
- **Service Requests**: Track and manage service requests with status updates
- **Reports & Analytics**: Comprehensive reporting (Admin/Manager only)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Role-Based UI**: Different interface elements based on user role

### Backend Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Permissions**: Different access levels for different roles
- **Password Hashing**: Secure password storage using bcrypt
- **Protected API Endpoints**: All routes require authentication
- **User Management**: Admin can manage other users
- **Audit Trail**: Track who created/modified records

## 🔐 Default Login Credentials

### Admin Access (Full Access)
- **Username**: admin
- **Password**: admin123
- **Permissions**: All features, user management, reports

### Manager Access (Limited Admin)
- **Username**: manager
- **Password**: manager123
- **Permissions**: Dashboard, customers, service requests, reports

### Staff Access (Basic Access)
- **Username**: staff
- **Password**: staff123
- **Permissions**: Dashboard, customers, service requests

## 🛠️ Technology Stack

### Frontend
- React (Functional Components + Hooks)
- HTML5 & CSS3
- JavaScript (ES6+)
- Tailwind CSS for styling
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- CORS middleware
- Body-parser middleware

### Authentication
- JSON Web Tokens (JWT)
- Bcrypt password hashing
- Role-based access control
- Session persistence

## 📋 Prerequisites

Before running this application, make sure you have the following installed:
- Node.js (v14.0.0 or higher)
- MongoDB (v4.0 or higher)
- npm or yarn package manager

## 🔧 Backend Setup with Authentication

### 1. Create Backend Directory and Install Dependencies

\`\`\`bash
mkdir crm-backend
cd crm-backend
npm init -y
npm install express mongoose cors body-parser nodemon bcrypt jsonwebtoken
\`\`\`

### 2. Start MongoDB Service

Make sure MongoDB is running on your system:

\`\`\`bash
# On Windows (if installed as service)
net start MongoDB

# On macOS (using Homebrew)
brew services start mongodb-community

# On Linux (using systemctl)
sudo systemctl start mongod
\`\`\`

### 3. Run the Authentication Server

\`\`\`bash
# Development mode with auto-restart
npm run dev-auth

# Production mode
npm run auth-server
\`\`\`

The backend server with authentication will start on `http://localhost:5000`

## 🎨 Frontend Setup

### 1. Create React Application

\`\`\`bash
npx create-react-app crm-frontend
cd crm-frontend
npm install
\`\`\`

### 2. Install Additional Dependencies

\`\`\`bash
# For icons and styling
npm install lucide-react
\`\`\`

### 3. Start the Frontend Development Server

\`\`\`bash
npm start
\`\`\`

The frontend application will start on `http://localhost:3000`

## 🔐 Authentication Flow

### Login Process
1. User enters credentials on login page
2. Frontend sends credentials to `/api/auth/login`
3. Backend validates credentials and returns JWT token
4. Frontend stores token and user info in localStorage
5. All subsequent API calls include the JWT token in headers

### Role-Based Access
- **Admin**: Full access to all features including user management
- **Manager**: Access to dashboard, customers, service requests, and reports
- **Staff**: Basic access to dashboard, customers, and service requests

### Session Management
- JWT tokens expire after 24 hours
- User sessions persist across browser refreshes
- Automatic logout on token expiration

## 📊 Database Schema

### Admin Schema
\`\`\`javascript
{
  username: String (required, unique),
  password: String (required, hashed),
  name: String (required),
  role: String (enum: ['admin', 'manager', 'staff']),
  email: String (required, unique),
  isActive: Boolean (default: true),
  lastLogin: Date
}
\`\`\`

### Customer Schema
\`\`\`javascript
{
  name: String (required),
  phone: String (required),
  email: String (required),
  vehicleModel: String (required),
  lastServiceDate: Date (default: current date),
  totalSpend: Number (default: 0),
  createdBy: ObjectId (reference to Admin)
}
\`\`\`

### Service Request Schema
\`\`\`javascript
{
  customerId: ObjectId (reference to Customer),
  vehicle: String (required),
  issue: String (required),
  status: String (enum: ['Pending', 'In Progress', 'Completed']),
  cost: Number (required, minimum: 0),
  assignedTo: ObjectId (reference to Admin),
  createdBy: ObjectId (reference to Admin)
}
\`\`\`

## 🔌 API Endpoints

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout

### Protected Customer Endpoints
- `GET /api/customers` - Get all customers (requires auth)
- `POST /api/customers` - Create new customer (requires auth)
- `GET /api/customers/:id` - Get customer by ID (requires auth)
- `PUT /api/customers/:id` - Update customer (requires auth)
- `DELETE /api/customers/:id` - Delete customer (admin/manager only)

### Protected Service Request Endpoints
- `GET /api/requests` - Get all service requests (requires auth)
- `POST /api/requests` - Create new service request (requires auth)
- `GET /api/requests/:id` - Get service request by ID (requires auth)
- `PUT /api/requests/:id` - Update service request (requires auth)
- `DELETE /api/requests/:id` - Delete service request (admin/manager only)

### Protected Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics (requires auth)

### Admin Management Endpoints
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Create new user (admin only)

## 🔒 Security Features

### Authentication Security
- JWT tokens with expiration
- Bcrypt password hashing with salt rounds
- Role-based access control middleware
- Protected API routes
- Input validation and sanitization

### Frontend Security
- Secure token storage
- Automatic logout on token expiration
- Role-based UI rendering
- Protected route components

### Backend Security
- Password hashing before storage
- JWT secret key configuration
- CORS configuration
- Request validation middleware
- Error handling without sensitive data exposure

## 🎯 Usage Instructions

### First Time Setup
1. Start the backend server with authentication
2. Default admin users are automatically created
3. Access the frontend application
4. Login with any of the provided credentials

### Adding New Users (Admin Only)
1. Login as admin
2. Navigate to user management (if implemented)
3. Create new users with appropriate roles

### Managing Customers and Service Requests
1. Login with appropriate credentials
2. Navigate to respective sections
3. Add, edit, or view records based on your role permissions

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or use local MongoDB
2. Configure JWT_SECRET environment variable
3. Deploy to platforms like Heroku, DigitalOcean, or AWS
4. Update CORS settings for production domain

### Frontend Deployment
1. Update API endpoints for production
2. Build the React application: `npm run build`
3. Deploy to platforms like Netlify, Vercel, or AWS S3

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

\`\`\`env
PORT=5000
MONGODB_URI=mongodb+srv://khandelwalakarshak:mJpMfI2SiodRF2HT@cluster0.a4xel.mongodb.net/two-wheeler-crm?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
\`\`\`

### MongoDB Atlas Setup

Your CRM system is now configured to use MongoDB Atlas cloud database:

- **Database**: `two-wheeler-crm`
- **Cluster**: `Cluster0`
- **Connection**: Secure connection with authentication
- **Features**: Auto-scaling, backup, and monitoring included

### Connection Benefits
- **Cloud-based**: No local MongoDB installation required
- **Scalable**: Automatic scaling based on usage
- **Secure**: Built-in security and encryption
- **Reliable**: High availability with automatic failover
- **Monitoring**: Built-in performance monitoring and alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test authentication and authorization
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Note**: This CRM system includes comprehensive authentication and authorization features designed specifically for two-wheeler automobile businesses. Make sure to change default passwords and JWT secrets in production environments.
