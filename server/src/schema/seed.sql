INSERT IGNORE INTO categories (id,name) VALUES
('electronics','Electronics'),('fashion','Fashion'),('home-living','Home & Living');

INSERT IGNORE INTO vendors (id,store_name,rating,location,verified,default_share_percent) VALUES
(1,'TechNova Store',4.70,'Accra, Ghana',1,80.00),
(2,'StrideWalk Footwear',4.60,'Kumasi, Ghana',1,80.00),
(3,'Home & Co.',4.50,'Accra, Ghana',1,80.00),
(4,'Urban Pack Gear',4.40,'Tema, Ghana',0,80.00);

INSERT IGNORE INTO products (id,vendor_id,category_id,name,price,old_price,stock_quantity,image_url,description) VALUES
('fd-1',1,'electronics','Bluetooth Speaker',180,240,24,'/products/speaker.svg','A compact Bluetooth speaker with rich bass and up to 10 hours of playtime.'),
('fd-2',2,'fashion','Casual Sneakers',250,320,40,'/products/sneakers.svg','Everyday casual sneakers with a breathable knit upper and cushioned sole.'),
('fd-3',1,'electronics','Smart Watch',320,400,15,'/products/smartwatch.svg','Track workouts, heart rate, and notifications on a bright display.'),
('fd-4',4,'fashion','Backpack',150,200,33,'/products/backpack.svg','A durable everyday backpack with a padded laptop sleeve.'),
('fd-5',3,'home-living','LED Desk Lamp',120,160,50,'/products/lamp.svg','An adjustable LED desk lamp with three brightness levels.'),
('fd-6',1,'electronics','Wireless Earbuds',120,150,60,'/products/earbuds.svg','True wireless earbuds with clear call quality and a compact case.'),
('rp-1',1,'fashion',"Men's Watch",200,NULL,18,'/products/mens-watch.svg','A classic analog watch with a stainless steel case.'),
('rp-2',1,'electronics','LED TV 32"',900,NULL,9,'/products/tv.svg','A 32-inch LED TV with crisp HD picture quality.'),
('rp-3',4,'fashion','Handbag',180,NULL,22,'/products/handbag.svg','A structured handbag with a spacious main compartment.'),
('rp-4',1,'electronics','Wireless Earbuds',120,NULL,45,'/products/earbuds-2.svg','Lightweight wireless earbuds with a secure fit.'),
('rp-5',3,'home-living','Air Fryer',450,NULL,12,'/products/airfryer.svg','A 4.5L air fryer with eight preset cooking programs.'),
('rp-6',3,'home-living','Blender',220,NULL,20,'/products/blender.svg','A powerful countertop blender with multiple speed settings.');
