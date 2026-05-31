import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Real Unsplash food images — direct CDN URLs, no API key needed
const IMAGES: Record<string, string> = {
  // Starters
  'Paneer Tikka':        'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80&fit=crop',
  'Chicken Wings':       'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80&fit=crop',
  'Veg Spring Rolls':    'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400&q=80&fit=crop',
  'Soup of the Day':     'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80&fit=crop',
  // Mains
  'Butter Chicken':      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80&fit=crop',
  'Dal Makhani':         'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80&fit=crop',
  'Grilled Salmon':      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80&fit=crop',
  'Mushroom Risotto':    'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80&fit=crop',
  // Pizza
  'Margherita':          'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80&fit=crop',
  'Pepperoni':           'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80&fit=crop',
  'BBQ Chicken':         'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80&fit=crop',
  'Veggie Supreme':      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80&fit=crop',
  // Burgers
  'Classic Beef Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80&fit=crop',
  'Crispy Chicken Burger':'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80&fit=crop',
  'Veggie Burger':       'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&q=80&fit=crop',
  // Desserts
  'Chocolate Lava Cake': 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&q=80&fit=crop',
  'Gulab Jamun':         'https://images.unsplash.com/photo-1666195786932-4a3e7e7e7e7e?w=400&q=80&fit=crop',
  'Ice Cream (2 scoops)':'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80&fit=crop',
  // Drinks
  'Fresh Lime Soda':     'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80&fit=crop',
  'Mango Lassi':         'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80&fit=crop',
  'Cold Coffee':         'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80&fit=crop',
  'Mineral Water':       'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80&fit=crop',
};

async function main() {
  console.log('🌱 Seeding database...');

  // ── Restaurant ──────────────────────────────────────────
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'the-fork' },
    update: {},
    create: {
      name: 'The Fork',
      slug: 'the-fork',
      description: 'A modern restaurant with a diverse menu',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400001',
      phone: '+91 98765 43210',
      email: 'hello@thefork.com',
      currency: 'INR',
      taxPercentage: 5,
      serviceChargePercentage: 0,
      isOpen: true,
    },
  });
  console.log(`✅ Restaurant: ${restaurant.name}`);

  // ── Admin Staff ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.staff.upsert({
    where: { restaurantId_email: { restaurantId: restaurant.id, email: 'admin@thefork.com' } },
    update: {},
    create: { restaurantId: restaurant.id, name: 'Admin User', email: 'admin@thefork.com', phone: '+91 98765 00000', role: 'owner', passwordHash },
  });
  console.log('✅ Admin: admin@thefork.com / admin123');

  // ── Categories ───────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { restaurantId_name: { restaurantId: restaurant.id, name: 'Starters' } },    update: {}, create: { restaurantId: restaurant.id, name: 'Starters',     icon: '🥗', displayOrder: 1 } }),
    prisma.category.upsert({ where: { restaurantId_name: { restaurantId: restaurant.id, name: 'Main Course' } }, update: {}, create: { restaurantId: restaurant.id, name: 'Main Course',  icon: '🍛', displayOrder: 2 } }),
    prisma.category.upsert({ where: { restaurantId_name: { restaurantId: restaurant.id, name: 'Pizza' } },       update: {}, create: { restaurantId: restaurant.id, name: 'Pizza',        icon: '🍕', displayOrder: 3 } }),
    prisma.category.upsert({ where: { restaurantId_name: { restaurantId: restaurant.id, name: 'Burgers' } },     update: {}, create: { restaurantId: restaurant.id, name: 'Burgers',      icon: '🍔', displayOrder: 4 } }),
    prisma.category.upsert({ where: { restaurantId_name: { restaurantId: restaurant.id, name: 'Desserts' } },    update: {}, create: { restaurantId: restaurant.id, name: 'Desserts',     icon: '🍰', displayOrder: 5 } }),
    prisma.category.upsert({ where: { restaurantId_name: { restaurantId: restaurant.id, name: 'Drinks' } },      update: {}, create: { restaurantId: restaurant.id, name: 'Drinks',       icon: '🥤', displayOrder: 6 } }),
  ]);
  const [starters, mains, pizza, burgers, desserts, drinks] = categories;
  console.log(`✅ ${categories.length} categories`);

  // ── Menu Items with images ────────────────────────────────
  const items = [
    // Starters
    { categoryId: starters.id, name: 'Paneer Tikka',        description: 'Grilled cottage cheese marinated in spiced yogurt, served with mint chutney',  basePrice: 280, isVegetarian: true,  spiceLevel: 2, preparationTime: 15, isFeatured: true,  calories: 320 },
    { categoryId: starters.id, name: 'Chicken Wings',       description: 'Crispy golden wings tossed in tangy buffalo sauce with blue cheese dip',        basePrice: 350, isVegetarian: false, spiceLevel: 2, preparationTime: 20, isFeatured: false, calories: 480 },
    { categoryId: starters.id, name: 'Veg Spring Rolls',    description: 'Crunchy rolls stuffed with seasoned vegetables, served with sweet chili sauce',  basePrice: 220, isVegetarian: true,  spiceLevel: 1, preparationTime: 12, isFeatured: false, calories: 280 },
    { categoryId: starters.id, name: 'Soup of the Day',     description: 'Chef\'s freshly prepared soup — ask your waiter for today\'s special',           basePrice: 180, isVegetarian: true,  spiceLevel: 0, preparationTime: 10, isFeatured: false, calories: 150 },
    // Mains
    { categoryId: mains.id,    name: 'Butter Chicken',      description: 'Tender chicken in velvety tomato-butter gravy, best with naan or rice',          basePrice: 420, isVegetarian: false, spiceLevel: 2, preparationTime: 25, isFeatured: true,  calories: 580 },
    { categoryId: mains.id,    name: 'Dal Makhani',         description: 'Slow-cooked black lentils simmered overnight in a rich, creamy sauce',           basePrice: 320, isVegetarian: true,  spiceLevel: 1, preparationTime: 20, isFeatured: false, calories: 420 },
    { categoryId: mains.id,    name: 'Grilled Salmon',      description: 'Atlantic salmon fillet with herb butter, seasonal vegetables and lemon',         basePrice: 680, isVegetarian: false, spiceLevel: 0, preparationTime: 25, isFeatured: false, calories: 520 },
    { categoryId: mains.id,    name: 'Mushroom Risotto',    description: 'Creamy arborio rice with wild mushrooms, parmesan and fresh thyme',              basePrice: 380, isVegetarian: true,  spiceLevel: 0, preparationTime: 22, isFeatured: false, calories: 460 },
    // Pizza
    { categoryId: pizza.id,    name: 'Margherita',          description: 'Classic San Marzano tomato, fresh mozzarella, basil on hand-tossed crust',       basePrice: 380, isVegetarian: true,  spiceLevel: 0, preparationTime: 18, isFeatured: true,  calories: 720 },
    { categoryId: pizza.id,    name: 'Pepperoni',           description: 'Generous pepperoni, mozzarella and oregano on a crispy thin crust',              basePrice: 450, isVegetarian: false, spiceLevel: 1, preparationTime: 18, isFeatured: false, calories: 860 },
    { categoryId: pizza.id,    name: 'BBQ Chicken',         description: 'Smoky BBQ sauce, grilled chicken, caramelized onions and cheddar',               basePrice: 480, isVegetarian: false, spiceLevel: 1, preparationTime: 20, isFeatured: false, calories: 820 },
    { categoryId: pizza.id,    name: 'Veggie Supreme',      description: 'Colorful bell peppers, olives, mushrooms, onions and fresh herbs',               basePrice: 420, isVegetarian: true,  spiceLevel: 0, preparationTime: 18, isFeatured: false, calories: 680 },
    // Burgers
    { categoryId: burgers.id,  name: 'Classic Beef Burger', description: 'Juicy 150g beef patty, aged cheddar, lettuce, tomato, pickles and special sauce', basePrice: 380, isVegetarian: false, spiceLevel: 1, preparationTime: 15, isFeatured: true,  calories: 720 },
    { categoryId: burgers.id,  name: 'Crispy Chicken Burger',description: 'Buttermilk fried chicken fillet, sriracha mayo and crunchy coleslaw',           basePrice: 340, isVegetarian: false, spiceLevel: 1, preparationTime: 15, isFeatured: false, calories: 680 },
    { categoryId: burgers.id,  name: 'Veggie Burger',       description: 'Spiced black bean patty, smashed avocado, roasted peppers and aioli',            basePrice: 300, isVegetarian: true,  spiceLevel: 0, preparationTime: 12, isFeatured: false, calories: 520 },
    // Desserts
    { categoryId: desserts.id, name: 'Chocolate Lava Cake', description: 'Warm dark chocolate cake with a gooey molten center, served with vanilla ice cream', basePrice: 220, isVegetarian: true, spiceLevel: 0, preparationTime: 15, isFeatured: true,  calories: 480 },
    { categoryId: desserts.id, name: 'Gulab Jamun',         description: 'Soft khoya dumplings soaked in rose-cardamom sugar syrup, served warm',          basePrice: 150, isVegetarian: true,  spiceLevel: 0, preparationTime: 5,  isFeatured: false, calories: 320 },
    { categoryId: desserts.id, name: 'Ice Cream (2 scoops)','description': 'Choose from vanilla bean, dark chocolate or fresh strawberry',                  basePrice: 180, isVegetarian: true,  spiceLevel: 0, preparationTime: 3,  isFeatured: false, calories: 280 },
    // Drinks
    { categoryId: drinks.id,   name: 'Fresh Lime Soda',     description: 'Freshly squeezed lime with soda — sweet, salted or masala',                      basePrice: 120, isVegetarian: true,  spiceLevel: 0, preparationTime: 3,  isFeatured: false, calories: 80  },
    { categoryId: drinks.id,   name: 'Mango Lassi',         description: 'Thick Alphonso mango blended with chilled yogurt and a hint of cardamom',        basePrice: 160, isVegetarian: true,  spiceLevel: 0, preparationTime: 5,  isFeatured: true,  calories: 220 },
    { categoryId: drinks.id,   name: 'Cold Coffee',         description: 'Strong espresso blended with chilled milk and a scoop of ice cream',             basePrice: 180, isVegetarian: true,  spiceLevel: 0, preparationTime: 5,  isFeatured: false, calories: 180 },
    { categoryId: drinks.id,   name: 'Mineral Water',       description: 'Chilled 500ml bottle',                                                           basePrice: 60,  isVegetarian: true,  spiceLevel: 0, preparationTime: 1,  isFeatured: false, calories: 0   },
  ];

  let updated = 0;
  for (const item of items) {
    const id = `seed-${restaurant.id}-${item.name.replace(/\s+/g, '-').toLowerCase()}`;
    const image = IMAGES[item.name] || null;
    await prisma.menuItem.upsert({
      where: { id },
      update: { image, description: item.description },
      create: { id, restaurantId: restaurant.id, isAvailable: true, displayOrder: 0, isVegan: false, isGlutenFree: false, image, ...item },
    });
    updated++;
  }
  console.log(`✅ ${updated} menu items with images`);

  // ── Tables ───────────────────────────────────────────────
  const tableData = [
    { tableNumber: '1', section: 'main',    capacity: 2 },
    { tableNumber: '2', section: 'main',    capacity: 4 },
    { tableNumber: '3', section: 'main',    capacity: 4 },
    { tableNumber: '4', section: 'main',    capacity: 6 },
    { tableNumber: '5', section: 'outdoor', capacity: 2 },
    { tableNumber: '6', section: 'outdoor', capacity: 4 },
    { tableNumber: '7', section: 'bar',     capacity: 2 },
    { tableNumber: '8', section: 'private', capacity: 8 },
  ];

  for (const t of tableData) {
    const existing = await prisma.table.findFirst({ where: { restaurantId: restaurant.id, tableNumber: t.tableNumber } });
    if (!existing) {
      const qrCode = uuidv4();
      const qrCodeUrl = await QRCode.toDataURL(`http://localhost:3000?table=${qrCode}`);
      await prisma.table.create({ data: { restaurantId: restaurant.id, ...t, qrCode, qrCodeUrl } });
    }
  }
  console.log(`✅ ${tableData.length} tables`);

  // ── Coupon ───────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { restaurantId_code: { restaurantId: restaurant.id, code: 'WELCOME20' } },
    update: {},
    create: { restaurantId: restaurant.id, code: 'WELCOME20', description: '20% off on first order', discountType: 'percentage', discountValue: 20, minOrderValue: 200, maxDiscount: 150, isActive: true },
  });
  console.log('✅ Coupon: WELCOME20');

  console.log('\n🎉 Done!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin → http://localhost:3002');
  console.log('  Email    : admin@thefork.com');
  console.log('  Password : admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
