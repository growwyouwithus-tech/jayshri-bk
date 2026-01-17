const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb+srv://growwyouwithus_db_user:yvn3QUOSBeZoE2H5@cluster0.racbswp.mongodb.net/test?appName=Cluster0');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const migrateColoniesToProperties = async () => {
    await connectDB();

    try {
        require('./models/User');
        const Colony = require('./models/Colony');
        const Property = require('./models/Property');

        // Get all colonies
        const colonies = await Colony.find({});

        console.log(`\n========================================`);
        console.log(`Found ${colonies.length} colonies`);
        console.log(`========================================\n`);

        for (const colony of colonies) {
            // Check if property already exists for this colony
            const existingProperty = await Property.findOne({ colony: colony._id });

            if (existingProperty) {
                console.log(`✓ Property already exists for colony: ${colony.name}`);
                continue;
            }

            console.log(`\n--- Creating Property for Colony: ${colony.name} ---`);

            // Create new property
            const propertyData = {
                name: colony.name,
                category: 'Residential',
                categories: ['Residential'],
                colony: colony._id,
                city: null, // Will need to be set manually if needed
                area: null,
                address: colony.address || colony.location?.address || '',
                coordinates: {
                    latitude: colony.location?.coordinates?.lat || null,
                    longitude: colony.location?.coordinates?.lng || null
                },
                totalLandAreaGaj: colony.totalArea ? Math.round(colony.totalArea / 9) : null,
                tagline: `${colony.name} - Premium Residential Plots`,
                description: `Property listing for ${colony.name} colony located at ${colony.address || colony.location?.address || 'Agra'}`,
                facilities: colony.features || [],
                roads: [],
                parks: [],
                media: {
                    mainPicture: null,
                    videoUpload: null,
                    mapImage: null,
                    noc: null,
                    registry: null,
                    legalDoc: null,
                    moreImages: colony.images || []
                },
                status: 'active',
                createdBy: colony.createdBy
            };

            const newProperty = await Property.create(propertyData);
            console.log(`✅ Created Property: ${newProperty.name} (ID: ${newProperty._id})`);
        }

        console.log(`\n========================================`);
        console.log(`Migration Complete!`);
        console.log(`========================================\n`);

        // Verify
        const totalProperties = await Property.countDocuments();
        console.log(`Total Properties now: ${totalProperties}`);

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

migrateColoniesToProperties();
