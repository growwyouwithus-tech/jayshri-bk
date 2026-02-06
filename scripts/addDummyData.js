require('dotenv').config();
const mongoose = require('mongoose');
const City = require('../models/City');
const Colony = require('../models/Colony');
const Property = require('../models/Property');
const Plot = require('../models/Plot');
const User = require('../models/User');
const Role = require('../models/Role');

async function addDummyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get admin user
    const adminUser = await User.findOne({ email: 'admin@jayshree.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    // Create Cities
    console.log('📍 Creating cities...');
    const cities = await City.insertMany([
      { name: 'Agra', state: 'Uttar Pradesh', country: 'India', createdBy: adminUser._id },
      { name: 'Mathura', state: 'Uttar Pradesh', country: 'India', createdBy: adminUser._id },
      { name: 'Firozabad', state: 'Uttar Pradesh', country: 'India', createdBy: adminUser._id },
    ]);
    console.log(`✅ Created ${cities.length} cities`);

    // Create Colonies
    console.log('\n🏘️ Creating colonies...');
    const colonies = await Colony.insertMany([
      {
        name: 'Green Valley Estate',
        description: 'Premium residential colony with modern amenities',
        city: cities[0]._id,
        address: 'Sikandra Road, Agra',
        totalArea: 50000,
        pricePerSqFt: 2500,
        status: 'ready_to_sell',
        coordinates: { latitude: 27.1767, longitude: 78.0081 },
        createdBy: adminUser._id
      },
      {
        name: 'Sunrise Heights',
        description: 'Affordable housing with excellent connectivity',
        city: cities[0]._id,
        address: 'Fatehabad Road, Agra',
        totalArea: 35000,
        pricePerSqFt: 2000,
        status: 'ready_to_sell',
        coordinates: { latitude: 27.1833, longitude: 78.0167 },
        createdBy: adminUser._id
      },
      {
        name: 'Royal Gardens',
        description: 'Luxury villas with garden view',
        city: cities[1]._id,
        address: 'Vrindavan Road, Mathura',
        totalArea: 60000,
        pricePerSqFt: 3000,
        status: 'under_development',
        coordinates: { latitude: 27.4924, longitude: 77.6737 },
        createdBy: adminUser._id
      }
    ]);
    console.log(`✅ Created ${colonies.length} colonies`);

    // Create Properties
    console.log('\n🏗️ Creating properties...');
    const properties = await Property.insertMany([
      {
        name: 'Green Valley - Phase 1',
        category: 'Residential',
        colony: colonies[0]._id,
        city: cities[0]._id,
        address: 'Sikandra Road, Agra',
        totalLandAreaGaj: 5000,
        basePricePerGaj: 5500,
        tagline: 'Your Dream Home Awaits',
        description: 'Premium plots with all modern facilities',
        facilities: ['24/7 Water Supply', 'Electricity', 'Street Lights', 'Security'],
        amenities: ['Park', 'Community Hall', 'Gym'],
        roads: [
          { name: 'Main Road', lengthFt: 500, widthFt: 40 },
          { name: 'Internal Road 1', lengthFt: 300, widthFt: 30 }
        ],
        parks: [
          { name: 'Central Park', lengthFt: 200, widthFt: 150 }
        ],
        status: 'ready_to_sell',
        createdBy: adminUser._id
      },
      {
        name: 'Green Valley - Phase 2',
        category: 'Residential',
        colony: colonies[0]._id,
        city: cities[0]._id,
        address: 'Sikandra Road, Agra',
        totalLandAreaGaj: 4000,
        basePricePerGaj: 6000,
        tagline: 'Premium Living Spaces',
        description: 'Corner plots with wide roads',
        facilities: ['24/7 Water Supply', 'Electricity', 'CCTV'],
        amenities: ['Jogging Track', 'Children Play Area'],
        roads: [
          { name: 'Main Road', lengthFt: 400, widthFt: 40 }
        ],
        status: 'ready_to_sell',
        createdBy: adminUser._id
      },
      {
        name: 'Sunrise Heights - Block A',
        category: 'Residential',
        colony: colonies[1]._id,
        city: cities[0]._id,
        address: 'Fatehabad Road, Agra',
        totalLandAreaGaj: 3500,
        basePricePerGaj: 4500,
        tagline: 'Affordable Dream Homes',
        description: 'Budget-friendly plots with good connectivity',
        facilities: ['Water Supply', 'Electricity', 'Street Lights'],
        amenities: ['Park', 'Temple'],
        roads: [
          { name: 'Main Road', lengthFt: 350, widthFt: 30 }
        ],
        status: 'ready_to_sell',
        createdBy: adminUser._id
      },
      {
        name: 'Royal Gardens - Villa Plots',
        category: 'Residential',
        colony: colonies[2]._id,
        city: cities[1]._id,
        address: 'Vrindavan Road, Mathura',
        totalLandAreaGaj: 6000,
        basePricePerGaj: 7000,
        tagline: 'Luxury Villa Plots',
        description: 'Spacious plots for luxury villas',
        facilities: ['24/7 Water Supply', 'Electricity', 'Security', 'CCTV'],
        amenities: ['Clubhouse', 'Swimming Pool', 'Gym', 'Park'],
        roads: [
          { name: 'Main Boulevard', lengthFt: 600, widthFt: 50 }
        ],
        parks: [
          { name: 'Garden Area', lengthFt: 300, widthFt: 200 }
        ],
        status: 'under_development',
        createdBy: adminUser._id
      }
    ]);
    console.log(`✅ Created ${properties.length} properties`);

    // Create Plots
    console.log('\n📐 Creating plots...');
    const plotsData = [];

    // Property 1 plots (Green Valley Phase 1)
    for (let i = 1; i <= 20; i++) {
      plotsData.push({
        plotNumber: `${i}`,
        colony: colonies[0]._id,
        propertyId: properties[0]._id,
        area: 900 + (i * 10), // 910-1090 sq ft
        dimensions: {
          length: 30,
          width: 30 + i,
          frontage: 30
        },
        sideMeasurements: {
          front: 30,
          back: 30,
          left: 30 + i,
          right: 30 + i
        },
        pricePerSqFt: 2500,
        totalPrice: (900 + (i * 10)) * 2500,
        status: i <= 5 ? 'sold' : i <= 10 ? 'booked' : 'available',
        ownerType: 'owner',
        facing: ['north', 'south', 'east', 'west'][i % 4],
        corner: i % 5 === 0,
        roadWidth: i % 3 === 0 ? 40 : 30,
        createdBy: adminUser._id
      });
    }

    // Property 2 plots (Green Valley Phase 2)
    for (let i = 1; i <= 15; i++) {
      plotsData.push({
        plotNumber: `${i}`,
        colony: colonies[0]._id,
        propertyId: properties[1]._id,
        area: 1000 + (i * 15),
        dimensions: {
          length: 35,
          width: 30 + i,
          frontage: 35
        },
        sideMeasurements: {
          front: 35,
          back: 35,
          left: 30 + i,
          right: 30 + i
        },
        pricePerSqFt: 2700,
        totalPrice: (1000 + (i * 15)) * 2700,
        status: i <= 3 ? 'sold' : i <= 8 ? 'booked' : 'available',
        ownerType: 'owner',
        facing: ['north', 'south', 'east', 'west', 'northeast'][i % 5],
        corner: i % 4 === 0,
        roadWidth: 40,
        createdBy: adminUser._id
      });
    }

    // Property 3 plots (Sunrise Heights)
    for (let i = 1; i <= 25; i++) {
      plotsData.push({
        plotNumber: `${i}`,
        colony: colonies[1]._id,
        propertyId: properties[2]._id,
        area: 800 + (i * 8),
        dimensions: {
          length: 28,
          width: 28 + i,
          frontage: 28
        },
        sideMeasurements: {
          front: 28,
          back: 28,
          left: 28 + i,
          right: 28 + i
        },
        pricePerSqFt: 2000,
        totalPrice: (800 + (i * 8)) * 2000,
        status: i <= 8 ? 'sold' : i <= 15 ? 'booked' : 'available',
        ownerType: 'owner',
        facing: ['north', 'south', 'east', 'west'][i % 4],
        corner: i % 6 === 0,
        roadWidth: 30,
        createdBy: adminUser._id
      });
    }

    // Property 4 plots (Royal Gardens)
    for (let i = 1; i <= 10; i++) {
      plotsData.push({
        plotNumber: `${i}`,
        colony: colonies[2]._id,
        propertyId: properties[3]._id,
        area: 1500 + (i * 20),
        dimensions: {
          length: 40,
          width: 40 + i,
          frontage: 40
        },
        sideMeasurements: {
          front: 40,
          back: 40,
          left: 40 + i,
          right: 40 + i
        },
        pricePerSqFt: 3000,
        totalPrice: (1500 + (i * 20)) * 3000,
        status: i <= 2 ? 'sold' : i <= 5 ? 'reserved' : 'available',
        ownerType: 'owner',
        facing: ['north', 'east', 'west', 'northeast'][i % 4],
        corner: i % 3 === 0,
        roadWidth: 50,
        createdBy: adminUser._id
      });
    }

    const plots = await Plot.insertMany(plotsData);
    console.log(`✅ Created ${plots.length} plots`);

    // Add complete sale details to sold plots
    console.log('\n👥 Adding complete sale details to sold plots...');
    const soldPlots = plots.filter(p => p.status === 'sold');
    
    const customerNames = [
      'Rajesh Kumar', 'Priya Sharma', 'Amit Verma', 'Neha Gupta', 'Suresh Patel',
      'Anjali Singh', 'Vikram Yadav', 'Pooja Agarwal', 'Rahul Jain', 'Kavita Mehta',
      'Sanjay Mishra', 'Deepa Reddy', 'Manoj Tiwari', 'Sunita Rao', 'Anil Kapoor',
      'Ritu Malhotra', 'Karan Sethi', 'Meera Nair'
    ];

    const addresses = [
      'Sanjay Place', 'Kamla Nagar', 'Dayal Bagh', 'Sikandra', 'Tajganj',
      'Sadar Bazaar', 'Civil Lines', 'Rakabganj', 'Lohamandi', 'Belanganj'
    ];

    const agentNames = ['Rajesh Kumar (Agent)', 'Amit Sharma (Agent)', 'Sunil Verma (Agent)', 'Priya Singh (Agent)'];
    const advocateNames = ['Adv. R.K. Sharma', 'Adv. Priya Gupta', 'Adv. Anil Verma', 'Adv. Sunita Jain'];
    
    for (let i = 0; i < soldPlots.length; i++) {
      const plot = soldPlots[i];
      const finalPrice = plot.totalPrice * (0.92 + (Math.random() * 0.08)); // 92-100% of total
      const paidPercentage = 0.5 + (Math.random() * 0.4); // 50-90% paid
      const paidAmount = finalPrice * paidPercentage;
      
      await Plot.findByIdAndUpdate(plot._id, {
        // Customer Details
        customerName: customerNames[i % customerNames.length],
        customerNumber: `${9800000000 + Math.floor(Math.random() * 99999999)}`,
        customerShortAddress: `${addresses[i % addresses.length]}, Agra`,
        customerFullAddress: `House No. ${Math.floor(Math.random() * 500) + 1}, ${addresses[i % addresses.length]}, Agra, Uttar Pradesh - 282001`,
        
        // Registry & Pricing
        registryDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        finalPrice: Math.round(finalPrice),
        
        // Payment Details
        paidAmount: Math.round(paidAmount),
        modeOfPayment: ['cash', 'bank_transfer', 'upi', 'cheque'][Math.floor(Math.random() * 4)],
        transactionDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        
        // Agent Details
        agentName: agentNames[i % agentNames.length],
        agentCode: `AG-${String(i % 4 + 1).padStart(5, '0')}`,
        
        // Advocate Details
        advocateName: advocateNames[i % advocateNames.length],
        advocateCode: `ADV-${String(i % 4 + 1).padStart(5, '0')}`,
        
        // Tahsil
        tahsil: ['agra', 'fatehabad', 'kiraoli', 'bah'][Math.floor(Math.random() * 4)],
        
        // Additional Info
        moreInformation: [
          'Registry completed successfully',
          'All documents verified',
          'Payment schedule: Monthly installments',
          'Full payment received',
          'Partial payment - balance pending',
          'EMI plan active',
          'Cash transaction completed',
          'Bank loan approved'
        ][i % 8]
      });
    }
    console.log(`✅ Updated ${soldPlots.length} sold plots with complete sale details`);

    // Add booking details to booked plots
    console.log('\n📝 Adding booking details to booked plots...');
    const bookedPlots = plots.filter(p => p.status === 'booked');
    
    for (let i = 0; i < bookedPlots.length; i++) {
      const plot = bookedPlots[i];
      const finalPrice = plot.totalPrice * (0.95 + (Math.random() * 0.05)); // 95-100% of total
      const paidPercentage = 0.1 + (Math.random() * 0.3); // 10-40% paid (booking amount)
      const paidAmount = finalPrice * paidPercentage;
      
      await Plot.findByIdAndUpdate(plot._id, {
        // Customer Details
        customerName: customerNames[i % customerNames.length],
        customerNumber: `${9700000000 + Math.floor(Math.random() * 99999999)}`,
        customerShortAddress: `${addresses[i % addresses.length]}, Agra`,
        
        // Pricing
        finalPrice: Math.round(finalPrice),
        
        // Payment Details (Booking amount)
        paidAmount: Math.round(paidAmount),
        modeOfPayment: ['upi', 'bank_transfer', 'cheque'][Math.floor(Math.random() * 3)],
        transactionDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        
        // Agent Details
        agentName: agentNames[i % agentNames.length],
        agentCode: `AG-${String(i % 4 + 1).padStart(5, '0')}`,
        
        // Additional Info
        moreInformation: [
          'Booking confirmed - Registry pending',
          'Token amount received',
          'Awaiting full payment',
          'Documents under verification',
          'Loan approval pending'
        ][i % 5]
      });
    }
    console.log(`✅ Updated ${bookedPlots.length} booked plots with booking details`);

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Cities: ${cities.length}`);
    console.log(`   Colonies: ${colonies.length}`);
    console.log(`   Properties: ${properties.length}`);
    console.log(`   Plots: ${plots.length}`);
    console.log(`   - Available: ${plots.filter(p => p.status === 'available').length}`);
    console.log(`   - Booked: ${plots.filter(p => p.status === 'booked').length}`);
    console.log(`   - Sold: ${plots.filter(p => p.status === 'sold').length}`);
    console.log(`   - Reserved: ${plots.filter(p => p.status === 'reserved').length}`);

    console.log('\n✅ Dummy data added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addDummyData();
