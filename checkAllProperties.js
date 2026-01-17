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

const checkAllProperties = async () => {
    await connectDB();

    try {
        try { require('./models/User'); } catch (e) { }
        try { require('./models/City'); } catch (e) { }

        const Colony = require('./models/Colony');
        const Property = require('./models/Property');

        // Get ALL properties with ALL fields
        const allProperties = await Property.find({}).populate('colony', 'name');

        console.log(`\n========================================`);
        console.log(`TOTAL PROPERTIES IN DATABASE: ${allProperties.length}`);
        console.log(`========================================\n`);

        allProperties.forEach((prop, index) => {
            console.log(`\n--- Property ${index + 1} ---`);
            console.log(`ID: ${prop._id}`);
            console.log(`Name: ${prop.name}`);
            console.log(`Status: ${prop.status}`);
            console.log(`Category: ${prop.category}`);
            console.log(`Categories: ${JSON.stringify(prop.categories)}`);
            console.log(`Colony: ${prop.colony?.name || 'N/A'}`);
            console.log(`Created: ${prop.createdAt}`);
            console.log(`Updated: ${prop.updatedAt}`);
        });

        console.log(`\n========================================\n`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

checkAllProperties();
