const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8
  },
  phone: {
    type: String,
    trim: true
  },
  userCode: {
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: ''
  },
  documents: {
    aadharFront: String,
    aadharBack: String,
    panCard: String,
    passportPhoto: String,
    fullPhoto: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  permissions: [{
    type: String
  }],
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate user code before saving
userSchema.pre('save', async function (next) {
  // Generate userCode if not exists
  if (!this.userCode && this.role) {
    try {
      await this.populate('role');
      const roleName = this.role.name;

      // Define prefixes based on role
      const prefixMap = {
        'Agent': 'AG',
        'Lawyer': 'ADV',
        'Manager': 'MGR',
        'Admin': 'ADM',
        'Buyer': 'BYR',
        'Colony Manager': 'CM'
      };

      const prefix = prefixMap[roleName] || 'EMP';

      // Find the last user with this prefix
      const lastUser = await this.constructor.findOne({
        userCode: new RegExp(`^${prefix}-`)
      }).sort({ userCode: -1 });

      let nextNumber = 1;
      if (lastUser && lastUser.userCode) {
        const lastNumber = parseInt(lastUser.userCode.split('-')[1]);
        nextNumber = lastNumber + 1;
      }

      this.userCode = `${prefix}-${String(nextNumber).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating user code:', error);
    }
  }

  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
