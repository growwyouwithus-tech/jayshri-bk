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

const checkProperties = async () => {
    await connectDB();

    try {
        try { require('./models/User'); } catch (e) { }
        try { require('./models/City'); } catch (e) { }
        try { require('./models/Area'); } catch (e) { }

        const Colony = require('./models/Colony');
        const Property = require('./models/Property');

        const count = await Property.countDocuments();
        const colonyCount = await Colony.countDocuments();

        console.log(`\n-----------------------------------`);
        console.log(`Total Properties in Database: ${count}`);
        console.log(`Total Colonies in Database: ${colonyCount}`);
        console.log(`-----------------------------------\n`);

        const properties = await Property.find({}, 'name status colony').populate('colony', 'name');
        console.log('Listing all PROPERTIES (Mansion Properties):');
        properties.forEach((p, index) => {
            console.log(`${index + 1}. Name: ${p.name}, Status: ${p.status}, Colony: ${p.colony?.name || 'N/A'}`);
        });

        const colonies = await Colony.find({}, 'name city');
        console.log(`\n-----------------------------------`);
        console.log('Listing all COLONIES (Land):');
        colonies.forEach((c, index) => {
            console.log(`${index + 1}. Name: ${c.name}`);
        });
        console.log(`-----------------------------------\n`);

    } catch (error) {
        console.error('Error fetching properties:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

checkProperties();
