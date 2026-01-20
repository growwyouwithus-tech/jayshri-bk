require('dotenv').config();
const mongoose = require('mongoose');
const Plot = require('./models/Plot');
const Settings = require('./models/Settings');
const Colony = require('./models/Colony');

async function syncOwners() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const settings = await Settings.getInstance();
        if (!settings.owners || settings.owners.length === 0) {
            console.log('No owners found in Settings.');
            process.exit(0);
        }

        const plots = await Plot.find({ ownerType: 'owner' });
        console.log(`Found ${plots.length} plots with owner type 'owner'.`);

        let updatedCount = 0;

        for (const plot of plots) {
            if (!plot.plotOwners || plot.plotOwners.length === 0) continue;

            let isModified = false;
            const updatedPlotOwners = plot.plotOwners.map(plotOwner => {
                const settingOwner = settings.owners.find(o => o._id.toString() === plotOwner.ownerId);

                if (settingOwner) {
                    console.log(`Updating owner ${settingOwner.name} for Plot ${plot.plotNo}`);
                    isModified = true;
                    // Return fresh data structure
                    return {
                        ownerId: settingOwner._id.toString(),
                        ownerName: settingOwner.name,
                        ownerPhone: settingOwner.phone || '',
                        ownerAadharNumber: settingOwner.aadharNumber || '',
                        ownerPanNumber: settingOwner.panNumber || '',
                        ownerDateOfBirth: settingOwner.dateOfBirth || '',
                        ownerSonOf: settingOwner.sonOf || '',
                        ownerDaughterOf: settingOwner.daughterOf || '',
                        ownerWifeOf: settingOwner.wifeOf || '',
                        ownerAddress: settingOwner.address || '',
                        ownerDocuments: {
                            aadharFront: settingOwner.documents?.aadharFront || '',
                            aadharBack: settingOwner.documents?.aadharBack || '',
                            panCard: settingOwner.documents?.panCard || '',
                            passportPhoto: settingOwner.documents?.passportPhoto || '',
                            fullPhoto: settingOwner.documents?.fullPhoto || ''
                        }
                    };
                }
                return plotOwner; // Keep existing if not found in settings (edge case)
            });

            if (isModified) {
                plot.plotOwners = updatedPlotOwners;
                await plot.save();
                updatedCount++;
            }
        }

        console.log(`Successfully synced ${updatedCount} plots with latest owner data.`);
        process.exit(0);
    } catch (error) {
        console.error('Sync error:', error);
        process.exit(1);
    }
}

syncOwners();
