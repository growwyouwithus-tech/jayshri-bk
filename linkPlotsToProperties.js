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

const linkPlotsToProperties = async () => {
    await connectDB();

    try {
        require('./models/User');
        const Colony = require('./models/Colony');
        const Property = require('./models/Property');
        const Plot = require('./models/Plot');

        console.log(`\n========================================`);
        console.log(`Linking Plots to Properties`);
        console.log(`========================================\n`);

        // Get all properties
        const properties = await Property.find({}).populate('colony');

        for (const property of properties) {
            if (!property.colony) {
                console.log(`⚠️ Property ${property.name} has no colony, skipping`);
                continue;
            }

            console.log(`\n--- Processing Property: ${property.name} ---`);
            console.log(`Colony ID: ${property.colony._id}`);

            // Find all plots for this colony
            const plots = await Plot.find({ colony: property.colony._id });
            console.log(`Found ${plots.length} plots for this colony`);

            // Update each plot to link to the property
            let updated = 0;
            for (const plot of plots) {
                if (!plot.propertyId || plot.propertyId.toString() !== property._id.toString()) {
                    plot.propertyId = property._id;
                    await plot.save();
                    updated++;
                }
            }

            console.log(`✅ Updated ${updated} plots to link to property: ${property.name}`);
        }

        console.log(`\n========================================`);
        console.log(`Migration Complete!`);
        console.log(`========================================\n`);

        // Verify
        const totalPlots = await Plot.countDocuments();
        const plotsWithProperty = await Plot.countDocuments({ propertyId: { $ne: null } });
        console.log(`Total Plots: ${totalPlots}`);
        console.log(`Plots linked to Properties: ${plotsWithProperty}`);

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

linkPlotsToProperties();
