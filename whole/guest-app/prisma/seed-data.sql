-- Seed data for QR Menu Ordering System
-- Run this AFTER running schema.sql
-- Password for admin: admin123 (bcrypt hash)

-- Insert Restaurant
INSERT INTO "Restaurant" ("id", "name", "slug", "description", "address", "city", "state", "country", "zipCode", "phone", "email", "website", "timezone", "currency", "taxPercentage", "serviceChargePercentage", "isOpen")
VALUES ('rest1', 'The Fork Restaurant', 'the-fork', 'Fine dining experience with authentic cuisine', '123 Main Street', 'Mumbai', 'Maharashtra', 'India', '400001', '+91 22 1234 5678', 'contact@thefork.com', 'https://thefork.com', 'Asia/Kolkata', 'INR', 5, 10, true);

-- Insert Admin Staff (password: admin123)
INSERT INTO "Staff" ("id", "restaurantId", "name", "email", "phone", "role", "passwordHash", "isActive")
VALUES ('staff1', 'rest1', 'Admin User', 'admin@thefork.com', '+91 98765 43210', 'admin', '$2a$10$rZ5qH8qF7xGxJ5vZ5qH8qOqH8qF7xGxJ5vZ5qH8qOqH8qF7xGxJ5u', true);

-- Insert Tables
INSERT INTO "Table" ("id", "restaurantId", "tableNumber", "section", "capacity", "qrCode", "status", "isActive") VALUES
('table1', 'rest1', '1', 'Main Hall', 4, '25ex69ed8', 'available', true),
('table2', 'rest1', '2', 'Main Hall', 2, 'pbesg49n6', 'available', true),
('table3', 'rest1', '3', 'Main Hall', 6, 'xyz123abc', 'available', true),
('table4', 'rest1', '4', 'Patio', 4, 'abc456def', 'available', true),
('table5', 'rest1', '5', 'Patio', 2, 'def789ghi', 'available', true),
('table6', 'rest1', '6', 'Private', 8, 'ghi012jkl', 'available', true);

-- Insert Categories
INSERT INTO "Category" ("id", "restaurantId", "name", "description", "icon", "displayOrder", "isActive") VALUES
('cat1', 'rest1', 'Starters', 'Appetizers and starters to begin your meal', '🥗', 1, true),
('cat2', 'rest1', 'Main Course', 'Hearty main dishes', '🍛', 2, true),
('cat3', 'rest1', 'Breads', 'Freshly baked breads', '🍞', 3, true),
('cat4', 'rest1', 'Desserts', 'Sweet treats to end your meal', '🍰', 4, true),
('cat5', 'rest1', 'Beverages', 'Refreshing drinks', '🥤', 5, true);

-- Insert Menu Items - Starters
INSERT INTO "MenuItem" ("id", "restaurantId", "categoryId", "name", "description", "basePrice", "currency", "isVegetarian", "isVegan", "isGlutenFree", "spiceLevel", "preparationTime", "isAvailable", "isFeatured") VALUES
('item1', 'rest1', 'cat1', 'Spring Rolls', 'Crispy vegetable spring rolls served with sweet chili sauce', 150, 'INR', true, false, false, 1, 15, true, true),
('item2', 'rest1', 'cat1', 'Chicken Wings', 'Spicy buffalo wings with ranch dip', 250, 'INR', false, false, true, 3, 20, true, false),
('item3', 'rest1', 'cat1', 'Paneer Tikka', 'Grilled cottage cheese marinated in spices', 200, 'INR', true, false, true, 2, 18, true, true);

-- Insert Menu Items - Main Course
INSERT INTO "MenuItem" ("id", "restaurantId", "categoryId", "name", "description", "basePrice", "currency", "isVegetarian", "isVegan", "isGlutenFree", "spiceLevel", "preparationTime", "isAvailable", "isFeatured") VALUES
('item4', 'rest1', 'cat2', 'Butter Chicken', 'Creamy tomato-based curry with tender chicken', 350, 'INR', false, false, true, 2, 25, true, true),
('item5', 'rest1', 'cat2', 'Paneer Tikka Masala', 'Cottage cheese in rich spicy gravy', 300, 'INR', true, false, true, 2, 25, true, false),
('item6', 'rest1', 'cat2', 'Dal Makhani', 'Black lentils cooked in butter and cream', 250, 'INR', true, false, true, 1, 20, true, false),
('item7', 'rest1', 'cat2', 'Biryani', 'Fragrant rice with spices and your choice of protein', 400, 'INR', false, false, true, 2, 30, true, true);

-- Insert Menu Items - Breads
INSERT INTO "MenuItem" ("id", "restaurantId", "categoryId", "name", "description", "basePrice", "currency", "isVegetarian", "isVegan", "isGlutenFree", "spiceLevel", "preparationTime", "isAvailable", "isFeatured") VALUES
('item8', 'rest1', 'cat3', 'Naan', 'Soft leavened flatbread', 40, 'INR', true, false, false, 0, 10, true, false),
('item9', 'rest1', 'cat3', 'Garlic Naan', 'Naan topped with garlic and butter', 50, 'INR', true, false, false, 0, 10, true, true),
('item10', 'rest1', 'cat3', 'Roti', 'Whole wheat flatbread', 30, 'INR', true, true, false, 0, 8, true, false);

-- Insert Menu Items - Desserts
INSERT INTO "MenuItem" ("id", "restaurantId", "categoryId", "name", "description", "basePrice", "currency", "isVegetarian", "isVegan", "isGlutenFree", "spiceLevel", "preparationTime", "isAvailable", "isFeatured") VALUES
('item11', 'rest1', 'cat4', 'Gulab Jamun', 'Sweet milk dumplings in sugar syrup', 100, 'INR', true, false, false, 0, 5, true, true),
('item12', 'rest1', 'cat4', 'Rasmalai', 'Soft cheese patties in sweetened milk', 120, 'INR', true, false, false, 0, 5, true, false),
('item13', 'rest1', 'cat4', 'Ice Cream', 'Choice of vanilla, chocolate, or mango', 80, 'INR', true, false, true, 0, 2, true, false);

-- Insert Menu Items - Beverages
INSERT INTO "MenuItem" ("id", "restaurantId", "categoryId", "name", "description", "basePrice", "currency", "isVegetarian", "isVegan", "isGlutenFree", "spiceLevel", "preparationTime", "isAvailable", "isFeatured") VALUES
('item14', 'rest1', 'cat5', 'Masala Chai', 'Spiced Indian tea', 40, 'INR', true, false, true, 1, 5, true, true),
('item15', 'rest1', 'cat5', 'Mango Lassi', 'Sweet yogurt drink with mango', 80, 'INR', true, false, true, 0, 5, true, true),
('item16', 'rest1', 'cat5', 'Soft Drinks', 'Coke, Sprite, Fanta', 50, 'INR', true, true, true, 0, 2, true, false);

-- Insert Coupons
INSERT INTO "Coupon" ("id", "restaurantId", "code", "description", "discountType", "discountValue", "minOrderValue", "maxDiscount", "usageLimit", "usedCount", "isActive", "expiresAt") VALUES
('coupon1', 'rest1', 'WELCOME10', '10% off on first order', 'percentage', 10, 500, 100, 100, 0, true, '2026-12-31 23:59:59'),
('coupon2', 'rest1', 'FLAT50', '₹50 off on orders above ₹300', 'fixed', 50, 300, NULL, 50, 0, true, '2026-12-31 23:59:59');
