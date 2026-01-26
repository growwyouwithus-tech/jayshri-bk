const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const Colony = require('./models/Colony');

const debugColonies = async () => {
    await connectDB();

    try {
        const colonies = await Colony.find({});
        console.log(`Found ${colonies.length} colonies.`);

        colonies.forEach(colony => {
            console.log(`\nColony: ${colony.name} (${colony._id})`);
            if (colony.khatoniHolders && colony.khatoniHolders.length > 0) {
                console.log(`  Khatoni Holders: ${colony.khatoniHolders.length}`);
                colony.khatoniHolders.forEach((holder, idx) => {
                    console.log(`    Holder ${idx + 1}: ${holder.name}`);
                    console.log(`    Documents:`, holder.documents);
                });
            } else {
                console.log('  No Khatoni Holders');
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
};

debugColonies();
