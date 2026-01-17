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

const checkColonies = async () => {
    await connectDB();

    try {
        try { require('./models/User'); } catch (e) { }
        try { require('./models/City'); } catch (e) { }

        const Colony = require('./models/Colony');

        const colonies = await Colony.find({});

        console.log(`\n========================================`);
        console.log(`TOTAL COLONIES: ${colonies.length}`);
        console.log(`========================================\n`);

        colonies.forEach((col, index) => {
            console.log(`\n--- Colony ${index + 1} ---`);
            console.log(`ID: ${col._id}`);
            console.log(`Name: ${col.name}`);
            console.log(`Total Area: ${col.totalArea || 'N/A'}`);
            console.log(`Created: ${col.createdAt}`);
            console.log(`Updated: ${col.updatedAt}`);
            console.log(`Full Data:`, JSON.stringify(col, null, 2));
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

checkColonies();
