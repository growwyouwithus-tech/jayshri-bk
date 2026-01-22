const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    aadharNumber: {
        type: String
    },
    panNumber: {
        type: String
    },
    dateOfBirth: {
        type: String
    },
    sonOf: {
        type: String
    },
    daughterOf: {
        type: String
    },
    wifeOf: {
        type: String
    },
    address: {
        type: String
    },
    documents: {
        aadharFront: {
            type: String // Cloudinary URL
        },
        aadharBack: {
            type: String
        },
        panCard: {
            type: String
        },
        passportPhoto: {
            type: String
        },
        fullPhoto: {
            type: String
        }
    }
}, { _id: true });

const witnessSchema = new mongoose.Schema({
    name: {
        type: String
    },
    phone: {
        type: String
    },
    aadharNumber: {
        type: String
    },
    panNumber: {
        type: String
    },
    dateOfBirth: {
        type: String
    },
    sonOf: {
        type: String
    },
    daughterOf: {
        type: String
    },
    wifeOf: {
        type: String
    },
    address: {
        type: String
    },
    documents: {
        aadharFront: {
            type: String // Cloudinary URL
        },
        aadharBack: {
            type: String
        },
        panCard: {
            type: String
        },
        passportPhoto: {
            type: String
        },
        fullPhoto: {
            type: String
        }
    }
}, { _id: true });

const settingsSchema = new mongoose.Schema({
    // Company Information
    companyName: {
        type: String,
        default: 'Jayshree Properties'
    },
    email: {
        type: String,
        default: 'info@jayshreeproperties.com'
    },
    phone: {
        type: String,
        default: '+91 9876543210'
    },
    address: {
        type: String,
        default: 'Sector 12, Gurgaon, Haryana'
    },
    website: {
        type: String,
        default: 'www.jayshreeproperties.com'
    },
    logo: {
        type: String // Cloudinary URL
    },
    gstNumber: {
        type: String
    },
    panNumber: {
        type: String
    },

    // Multiple Owners
    owners: [ownerSchema],

    // Company Witnesses
    companyWitnesses: [witnessSchema],

    // Legacy fields (for migration) - will be removed after migration
    ownerAadharNumber: {
        type: String
    },
    ownerPanNumber: {
        type: String
    },
    ownerDocuments: {
        aadharFront: {
            type: String
        },
        aadharBack: {
            type: String
        },
        panCard: {
            type: String
        },
        passportPhoto: {
            type: String
        },
        fullPhoto: {
            type: String
        }
    },

    // System Settings
    systemSettings: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: true
        },
        autoBackup: {
            type: Boolean,
            default: true
        },
        maintenanceMode: {
            type: Boolean,
            default: false
        },
        allowRegistration: {
            type: Boolean,
            default: true
        },
        requireEmailVerification: {
            type: Boolean,
            default: true
        },
        sessionTimeout: {
            type: Number,
            default: 30 // minutes
        },
        maxFileSize: {
            type: Number,
            default: 10 // MB
        }
    },

    // Payment Settings
    paymentSettings: {
        razorpayEnabled: {
            type: Boolean,
            default: false
        },
        razorpayKeyId: {
            type: String
        },
        paytmEnabled: {
            type: Boolean,
            default: false
        },
        paytmMerchantId: {
            type: String
        },
        bankTransferEnabled: {
            type: Boolean,
            default: true
        },
        cashPaymentEnabled: {
            type: Boolean,
            default: true
        },
        minimumBookingAmount: {
            type: Number,
            default: 50000
        },
        lateFeePercentage: {
            type: Number,
            default: 2
        }
    }
}, {
    timestamps: true
});

// Singleton pattern - only one settings document should exist
settingsSchema.statics.getInstance = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }

    // Migration: Convert old single owner to owners array
    if (settings && (settings.ownerAadharNumber || settings.ownerPanNumber || settings.ownerDocuments)) {
        // Check if migration hasn't been done yet
        if (!settings.owners || settings.owners.length === 0) {
            const legacyOwner = {
                name: 'Owner', // Default name, user should update
                aadharNumber: settings.ownerAadharNumber || '',
                panNumber: settings.ownerPanNumber || '',
                documents: settings.ownerDocuments || {}
            };

            settings.owners = [legacyOwner];

            // Clear legacy fields
            settings.ownerAadharNumber = undefined;
            settings.ownerPanNumber = undefined;
            settings.ownerDocuments = undefined;

            await settings.save();
            console.log('✅ Migrated legacy owner data to owners array');
        }
    }

    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
