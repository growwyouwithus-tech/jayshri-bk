const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Role = require('../models/Role');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Update roles with proper permissions
const updateRoles = async () => {
  try {
    await connectDB();
    
    console.log('\n🔄 Updating roles with proper permissions...\n');

    const rolesData = {
      'Admin': {
        permissions: ['all'],
        description: 'Full system access'
      },
      'Manager': {
        permissions: [
          'user_read', 'user_create', 'user_update', 'users_read',
          'colony_read', 'colony_create', 'colony_update', 'colonies_read', 'colonies_create',
          'plot_read', 'plot_create', 'plot_update', 'plots_read', 'plots_create',
          'booking_read', 'booking_create', 'booking_update', 'bookings_read', 'bookings_create',
          'city_read', 'city_create', 'city_update', 'cities_read',
          'registry_read', 'registry_create', 'registries_read',
          'commission_read', 'commissions_read',
          'calculator_read',
          'property_read', 'properties_read'
        ],
        description: 'Management level access'
      },
      'Agent': {
        permissions: [
          'colony_read', 'colonies_read',
          'plot_read', 'plots_read',
          'booking_read', 'booking_create', 'booking_update', 'bookings_read', 'bookings_create',
          'commission_read', 'commissions_read'
        ],
        description: 'Sales agent access'
      },
      'Buyer': {
        permissions: [
          'colony_read', 'colonies_read',
          'plot_read', 'plots_read',
          'booking_read', 'bookings_read'
        ],
        description: 'Customer access'
      },
      'Lawyer': {
        permissions: [
          'colony_read', 'colonies_read',
          'plot_read', 'plots_read',
          'booking_read', 'bookings_read',
          'registry_read', 'registry_create', 'registry_update', 'registries_read', 'registries_create'
        ],
        description: 'Legal documentation access'
      },
      'Colony Manager': {
        permissions: [
          'plot_read', 'plot_create', 'plot_update', 'plot_delete', 'plots_read', 'plots_create',
          'colony_read', 'colonies_read',
          'booking_read', 'bookings_read'
        ],
        description: 'Colony and plot management access'
      }
    };

    for (const [roleName, roleData] of Object.entries(rolesData)) {
      const result = await Role.findOneAndUpdate(
        { name: roleName },
        { 
          $set: { 
            permissions: roleData.permissions,
            description: roleData.description
          } 
        },
        { new: true }
      );

      if (result) {
        console.log(`✅ Updated role: ${roleName}`);
        console.log(`   Permissions: ${result.permissions.length} permissions`);
      } else {
        console.log(`⚠️  Role not found: ${roleName}`);
      }
    }

    console.log('\n✅ Roles updated successfully!\n');
    console.log('📝 Summary:');
    console.log('- Admin: Full access (all permissions)');
    console.log('- Manager: Management access (colonies, plots, bookings, users, etc.)');
    console.log('- Agent: Sales access (bookings, commissions)');
    console.log('- Buyer: Customer access (view only)');
    console.log('- Lawyer: Legal access (registry documents)');
    console.log('- Colony Manager: Plot management access');
    console.log('\n🔄 Please logout and login again to see updated permissions.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating roles:', error);
    process.exit(1);
  }
};

// Run update
updateRoles();
