import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'the-fork' },
    update: {},
    create: {
      name: 'The Fork Restaurant',
      slug: 'the-fork',
      description: 'Fine dining experience with authentic cuisine',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400001',
      phone: '+91 22 1234 5678',
      email: 'contact@thefork.com',
      website: 'https://thefork.com',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      taxPercentage: 5,
      serviceChargePercentage: 10,
      isOpen: true,
    },
  });
  console.log('✅ Restaurant created:', restaurant.name);

  // Create Admin Staff
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.staff.upsert({
    where: { 
      restaurantId_email: {
        restaurantId: restaurant.id,
        email: 'admin@thefork.com'
      }
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: 'Admin User',
      email: 'admin@thefork.com',
      phone: '+91 98765 43210',
      role: 'admin',
      passwordHash,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create Tables
  const tables = [
    { tableNumber: '1', section: 'Main Hall', capacity: 4, qrCode: '25ex69ed8' },
    { tableNumber: '2', section: 'Main Hall', capacity: 2, qrCode: 'pbesg49n6' },
    { tableNumber: '3', section: 'Main Hall', capacity: 6, qrCode: 'xyz123abc' },
    { tableNumber: '4', section: 'Patio', capacity: 4, qrCode: 'abc456def' },
    { tableNumber: '5', section: 'Patio', capacity: 2, qrCode: 'def789ghi' },
    { tableNumber: '6', section: 'Private', capacity: 8, qrCode: 'ghi012jkl' },
  ];

  for (const tableData of tables) {
    await prisma.table.upsert({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber: tableData.tableNumber,
        },
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        ...tableData,
        status: 'available',
        isActive: true,
      },
    });
  }
  console.log('✅ Tables created:', tables.length);

  // Create Menu Categories
  const categories = [
    {
      name: 'Starters',
      description: 'Appetizers and starters to begin your meal',
      icon: '🥗',
      displayOrder: 1,
    },
    {
      name: 'Main Course',
      description: 'Hearty main dishes',
      icon: '🍛',
      displayOrder: 2,
    },
    {
      name: 'Breads',
      description: 'Freshly baked breads',
      icon: '🍞',
      displayOrder: 3,
    },
    {
      name: 'Desserts',
      description: 'Sweet treats to end your meal',
      icon: '🍰',
      displayOrder: 4,
    },
    {
      name: 'Beverages',
      description: 'Refreshing drinks',
      icon: '🥤',
      displayOrder: 5,
    },
  ];

  const createdCategories: any[] = [];
  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: {
        restaurantId_name: {
          restaurantId: restaurant.id,
          name: categoryData.name,
        },
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        ...categoryData,
        isActive: true,
      },
    });
    createdCategories.push(category);
  }
  console.log('✅ Categories created:', categories.length);

  // Create Menu Items
  const menuItems = [
    // Starters
    {
      categoryName: 'Starters',
      name: 'Spring Rolls',
      description: 'Crispy vegetable spring rolls served with sweet chili sauce',
      basePrice: 150,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 1,
      preparationTime: 15,
      isAvailable: true,
      isFeatured: true,
    },
    {
      categoryName: 'Starters',
      name: 'Chicken Wings',
      description: 'Spicy buffalo wings with ranch dip',
      basePrice: 250,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: true,
      spiceLevel: 3,
      preparationTime: 20,
      isAvailable: true,
      isFeatured: false,
    },
    {
      categoryName: 'Starters',
      name: 'Paneer Tikka',
      description: 'Grilled cottage cheese marinated in spices',
      basePrice: 200,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
      spiceLevel: 2,
      preparationTime: 18,
      isAvailable: true,
      isFeatured: true,
    },
    // Main Course
    {
      categoryName: 'Main Course',
      name: 'Butter Chicken',
      description: 'Creamy tomato-based curry with tender chicken',
      basePrice: 350,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: true,
      spiceLevel: 2,
      preparationTime: 25,
      isAvailable: true,
      isFeatured: true,
    },
    {
      categoryName: 'Main Course',
      name: 'Paneer Tikka Masala',
      description: 'Cottage cheese in rich spicy gravy',
      basePrice: 300,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
      spiceLevel: 2,
      preparationTime: 25,
      isAvailable: true,
      isFeatured: false,
    },
    {
      categoryName: 'Main Course',
      name: 'Dal Makhani',
      description: 'Black lentils cooked in butter and cream',
      basePrice: 250,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
      spiceLevel: 1,
      preparationTime: 20,
      isAvailable: true,
      isFeatured: false,
    },
    {
      categoryName: 'Main Course',
      name: 'Biryani',
      description: 'Fragrant rice with spices and your choice of protein',
      basePrice: 400,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: true,
      spiceLevel: 2,
      preparationTime: 30,
      isAvailable: true,
      isFeatured: true,
    },
    // Breads
    {
      categoryName: 'Breads',
      name: 'Naan',
      description: 'Soft leavened flatbread',
      basePrice: 40,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 0,
      preparationTime: 10,
      isAvailable: true,
      isFeatured: false,
    },
    {
      categoryName: 'Breads',
      name: 'Garlic Naan',
      description: 'Naan topped with garlic and butter',
      basePrice: 50,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 0,
      preparationTime: 10,
      isAvailable: true,
      isFeatured: true,
    },
    {
      categoryName: 'Breads',
      name: 'Roti',
      description: 'Whole wheat flatbread',
      basePrice: 30,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: false,
      spiceLevel: 0,
      preparationTime: 8,
      isAvailable: true,
      isFeatured: false,
    },
    // Desserts
    {
      categoryName: 'Desserts',
      name: 'Gulab Jamun',
      description: 'Sweet milk dumplings in sugar syrup',
      basePrice: 100,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 0,
      preparationTime: 5,
      isAvailable: true,
      isFeatured: true,
    },
    {
      categoryName: 'Desserts',
      name: 'Rasmalai',
      description: 'Soft cheese patties in sweetened milk',
      basePrice: 120,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      spiceLevel: 0,
      preparationTime: 5,
      isAvailable: true,
      isFeatured: false,
    },
    {
      categoryName: 'Desserts',
      name: 'Ice Cream',
      description: 'Choice of vanilla, chocolate, or mango',
      basePrice: 80,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
      spiceLevel: 0,
      preparationTime: 2,
      isAvailable: true,
      isFeatured: false,
    },
    // Beverages
    {
      categoryName: 'Beverages',
      name: 'Masala Chai',
      description: 'Spiced Indian tea',
      basePrice: 40,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
      spiceLevel: 1,
      preparationTime: 5,
      isAvailable: true,
      isFeatured: true,
    },
    {
      categoryName: 'Beverages',
      name: 'Mango Lassi',
      description: 'Sweet yogurt drink with mango',
      basePrice: 80,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
      spiceLevel: 0,
      preparationTime: 5,
      isAvailable: true,
      isFeatured: true,
    },
    {
      categoryName: 'Beverages',
      name: 'Soft Drinks',
      description: 'Coke, Sprite, Fanta',
      basePrice: 50,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 0,
      preparationTime: 2,
      isAvailable: true,
      isFeatured: false,
    },
  ];

  for (const itemData of menuItems) {
    const category = createdCategories.find((c) => c.name === itemData.categoryName);
    if (!category) continue;

    const { categoryName, ...itemFields } = itemData;
    await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: category.id,
        ...itemFields,
        currency: 'INR',
      },
    });
  }
  console.log('✅ Menu items created:', menuItems.length);

  // Create Sample Coupons
  const coupons = [
    {
      code: 'WELCOME10',
      description: '10% off on first order',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 500,
      maxDiscount: 100,
      usageLimit: 100,
      isActive: true,
      expiresAt: new Date('2026-12-31'),
    },
    {
      code: 'FLAT50',
      description: '₹50 off on orders above ₹300',
      discountType: 'fixed',
      discountValue: 50,
      minOrderValue: 300,
      usageLimit: 50,
      isActive: true,
      expiresAt: new Date('2026-12-31'),
    },
  ];

  for (const couponData of coupons) {
    await prisma.coupon.upsert({
      where: {
        restaurantId_code: {
          restaurantId: restaurant.id,
          code: couponData.code,
        },
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        ...couponData,
      },
    });
  }
  console.log('✅ Coupons created:', coupons.length);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@thefork.com');
  console.log('   Password: admin123');
  console.log('\n🔗 QR Codes for tables:');
  tables.forEach((t) => {
    console.log(`   Table ${t.tableNumber}: ${t.qrCode}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
