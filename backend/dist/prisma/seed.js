"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const superAdminPassword = await bcrypt.hash('admin123', 12);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@kasirpro.com' },
        update: {},
        create: {
            email: 'admin@kasirpro.com',
            password: superAdminPassword,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
        },
    });
    console.log(`✅ Super Admin: ${superAdmin.email}`);
    const tenant1 = await prisma.tenant.upsert({
        where: { slug: 'nusantara-bakery' },
        update: {},
        create: {
            name: 'Nusantara Bakery',
            slug: 'nusantara-bakery',
            logo: 'NB',
            address: 'Jl. Melati 18, Bandung',
            phone: '+62 22 8123 4501',
            email: 'info@nusantarabakery.com',
            businessHours: '07:00 - 21:00',
            currency: 'IDR',
            taxRate: 11,
            receiptTemplate: 'Compact thermal receipt with tax ID and QRIS reference',
            status: 'ACTIVE',
            plan: 'GROWTH',
        },
    });
    const pm1Methods = ['Cash', 'QRIS', 'Bank Transfer', 'E-Wallet', 'Split Payment'];
    for (const name of pm1Methods) {
        await prisma.paymentMethod.upsert({
            where: { tenantId_name: { tenantId: tenant1.id, name } },
            update: {},
            create: { name, tenantId: tenant1.id },
        });
    }
    const owner1Password = await bcrypt.hash('owner123', 12);
    const owner1 = await prisma.user.upsert({
        where: { email: 'ayu@nusantarabakery.com' },
        update: {},
        create: {
            email: 'ayu@nusantarabakery.com',
            password: owner1Password,
            name: 'Ayu Prameswari',
            role: 'OWNER',
            status: 'ACTIVE',
            tenantId: tenant1.id,
        },
    });
    const cashierPassword = await bcrypt.hash('cashier123', 12);
    await prisma.user.upsert({
        where: { email: 'raka@nusantarabakery.com' },
        update: {},
        create: {
            email: 'raka@nusantarabakery.com',
            password: cashierPassword,
            name: 'Raka',
            role: 'CASHIER',
            status: 'ACTIVE',
            tenantId: tenant1.id,
        },
    });
    await prisma.user.upsert({
        where: { email: 'mira@nusantarabakery.com' },
        update: {},
        create: {
            email: 'mira@nusantarabakery.com',
            password: cashierPassword,
            name: 'Mira',
            role: 'CASHIER',
            status: 'INACTIVE',
            tenantId: tenant1.id,
        },
    });
    const bakery = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant1.id, name: 'Bakery' } },
        update: {},
        create: { name: 'Bakery', description: 'Bread and pastries', color: '#D97706', tenantId: tenant1.id },
    });
    const beverage = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant1.id, name: 'Beverage' } },
        update: {},
        create: { name: 'Beverage', description: 'Drinks and coffee', color: '#0F766E', tenantId: tenant1.id },
    });
    const dessert = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant1.id, name: 'Dessert' } },
        update: {},
        create: { name: 'Dessert', description: 'Sweet treats', color: '#65A30D', tenantId: tenant1.id },
    });
    const products1 = [
        { name: 'Sourdough Loaf', sku: 'BRD-SRD-01', barcode: '899100010001', purchasePrice: 18000, sellingPrice: 32000, stock: 36, minStock: 12, categoryId: bakery.id },
        { name: 'Kopi Susu Botol', sku: 'BEV-KSB-02', barcode: '899100010002', purchasePrice: 9000, sellingPrice: 18000, stock: 9, minStock: 18, categoryId: beverage.id },
        { name: 'Croissant Butter', sku: 'BRD-CRS-03', barcode: '899100010003', purchasePrice: 11000, sellingPrice: 24000, stock: 22, minStock: 16, categoryId: bakery.id },
        { name: 'Cheese Cake Slice', sku: 'DST-CCS-04', barcode: '899100010004', purchasePrice: 15000, sellingPrice: 34000, stock: 14, minStock: 10, categoryId: dessert.id },
    ];
    for (const prod of products1) {
        await prisma.product.upsert({
            where: { tenantId_sku: { tenantId: tenant1.id, sku: prod.sku } },
            update: {},
            create: { ...prod, tenantId: tenant1.id },
        });
    }
    await prisma.customer.createMany({
        skipDuplicates: true,
        data: [
            { name: 'Dewi Lestari', phone: '+62 812 4000 1881', email: 'dewi@email.com', tenantId: tenant1.id },
            { name: 'Office Pantry Corp', phone: '+62 811 7000 9910', tenantId: tenant1.id },
        ],
    });
    await prisma.supplier.createMany({
        skipDuplicates: true,
        data: [
            { name: 'Bandung Flour Supply', phone: '+62 22 7990 1001', contactPerson: 'Pak Hadi', tenantId: tenant1.id },
            { name: 'Dairy Fresh ID', phone: '+62 21 5522 8820', contactPerson: 'Ibu Rina', tenantId: tenant1.id },
        ],
    });
    const tenant2 = await prisma.tenant.upsert({
        where: { slug: 'toko-sembako-maju' },
        update: {},
        create: {
            name: 'Toko Sembako Maju',
            slug: 'toko-sembako-maju',
            logo: 'TM',
            address: 'Jl. Pasar Baru 7, Surabaya',
            phone: '+62 31 5531 8020',
            email: 'info@sembako-maju.com',
            businessHours: '06:00 - 22:00',
            currency: 'IDR',
            taxRate: 10,
            receiptTemplate: 'Detailed grocery receipt with cashier code and payment split',
            status: 'ACTIVE',
            plan: 'BASIC',
        },
    });
    const pm2Methods = ['Cash', 'QRIS', 'E-Wallet', 'Bank Transfer'];
    for (const name of pm2Methods) {
        await prisma.paymentMethod.upsert({
            where: { tenantId_name: { tenantId: tenant2.id, name } },
            update: {},
            create: { name, tenantId: tenant2.id },
        });
    }
    const owner2Password = await bcrypt.hash('owner123', 12);
    await prisma.user.upsert({
        where: { email: 'bima@sembako-maju.com' },
        update: {},
        create: {
            email: 'bima@sembako-maju.com',
            password: owner2Password,
            name: 'Bima Santoso',
            role: 'OWNER',
            status: 'ACTIVE',
            tenantId: tenant2.id,
        },
    });
    await prisma.user.upsert({
        where: { email: 'nina@sembako-maju.com' },
        update: {},
        create: {
            email: 'nina@sembako-maju.com',
            password: cashierPassword,
            name: 'Nina',
            role: 'CASHIER',
            status: 'ACTIVE',
            tenantId: tenant2.id,
        },
    });
    const staple = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant2.id, name: 'Staple' } },
        update: {},
        create: { name: 'Staple', description: 'Basic staple foods', color: '#64748B', tenantId: tenant2.id },
    });
    const household = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant2.id, name: 'Household' } },
        update: {},
        create: { name: 'Household', description: 'Household supplies', color: '#2563EB', tenantId: tenant2.id },
    });
    const fresh = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant2.id, name: 'Fresh' } },
        update: {},
        create: { name: 'Fresh', description: 'Fresh produce', color: '#BE123C', tenantId: tenant2.id },
    });
    const products2 = [
        { name: 'Beras Premium 5kg', sku: 'STP-BRS-05', barcode: '899200010101', purchasePrice: 64000, sellingPrice: 78500, stock: 48, minStock: 20, categoryId: staple.id },
        { name: 'Minyak Goreng 2L', sku: 'STP-MYK-02', barcode: '899200010102', purchasePrice: 28500, sellingPrice: 35000, stock: 11, minStock: 24, categoryId: staple.id },
        { name: 'Sabun Cair Refill', sku: 'HHD-SBN-03', barcode: '899200010103', purchasePrice: 13500, sellingPrice: 21000, stock: 29, minStock: 16, categoryId: household.id },
        { name: 'Telur Ayam 1kg', sku: 'FRS-TLR-01', barcode: '899200010104', purchasePrice: 24000, sellingPrice: 31500, stock: 17, minStock: 20, categoryId: fresh.id },
    ];
    for (const prod of products2) {
        await prisma.product.upsert({
            where: { tenantId_sku: { tenantId: tenant2.id, sku: prod.sku } },
            update: {},
            create: { ...prod, tenantId: tenant2.id },
        });
    }
    await prisma.supplier.createMany({
        skipDuplicates: true,
        data: [
            { name: 'Sumber Beras Timur', phone: '+62 31 7721 9008', contactPerson: 'Pak Agus', tenantId: tenant2.id },
            { name: 'Fresh Farm Surabaya', phone: '+62 31 8890 1130', contactPerson: 'Bu Sari', tenantId: tenant2.id },
        ],
    });
    await prisma.customer.createMany({
        skipDuplicates: true,
        data: [
            { name: 'Pak Rudi', phone: '+62 812 6400 2201', tenantId: tenant2.id },
            { name: 'Warung Sri', phone: '+62 813 7770 3131', tenantId: tenant2.id },
        ],
    });
    const feature1 = await prisma.exclusiveFeature.upsert({
        where: { code: 'PAYMENT_SYSTEM' },
        update: {},
        create: {
            code: 'PAYMENT_SYSTEM',
            name: 'Sistem Pembayaran',
            description: 'Menghitung total pembayaran secara otomatis, mendukung pemberian diskon, dan menampilkan total pembayaran akhir setelah diskon diterapkan.',
            category: 'POS',
            isActive: true,
        },
    });
    const feature2 = await prisma.exclusiveFeature.upsert({
        where: { code: 'RECEIPT_OPTIONS' },
        update: {},
        create: {
            code: 'RECEIPT_OPTIONS',
            name: 'Opsi Output Struk',
            description: 'Setelah pembayaran berhasil, kasir dapat memilih metode output struk: cetak menggunakan printer thermal atau kirim struk digital melalui WhatsApp (hanya untuk pelanggan member).',
            category: 'POS',
            isActive: true,
        },
    });
    const feature3 = await prisma.exclusiveFeature.upsert({
        where: { code: 'WHATSAPP_RECEIPT' },
        update: {},
        create: {
            code: 'WHATSAPP_RECEIPT',
            name: 'Struk WhatsApp',
            description: 'Mengirim rincian transaksi ke WhatsApp pelanggan beserta pesan otomatis ucapan terima kasih.',
            category: 'POS',
            isActive: true,
        },
    });
    const featureLandingPage = await prisma.exclusiveFeature.upsert({
        where: { code: 'LANDING_PAGE' },
        update: {},
        create: {
            code: 'LANDING_PAGE',
            name: 'Landing Page',
            description: 'Landing page publik terintegrasi dengan sistem kasir. Menampilkan produk/layanan toko dan memungkinkan pelanggan melakukan pemesanan langsung dari landing page.',
            category: 'INTEGRATION',
            isActive: true,
        },
    });
    for (const feature of [feature1, feature2, feature3]) {
        await prisma.tenantFeature.upsert({
            where: { tenantId_featureId: { tenantId: tenant1.id, featureId: feature.id } },
            update: {},
            create: {
                tenantId: tenant1.id,
                featureId: feature.id,
                enabled: true,
            },
        });
    }
    const tenant3 = await prisma.tenant.upsert({
        where: { slug: 'aderose-glowing-salon' },
        update: {},
        create: {
            name: 'Aderose Glowing Salon',
            slug: 'aderose-glowing-salon',
            logo: 'AG',
            address: 'Jl. Kecantikan No. 21, Bandung',
            phone: '+62 822 1404 5556',
            email: 'info@aderose-salon.com',
            businessHours: '09:00 - 21:00',
            currency: 'IDR',
            taxRate: 0,
            receiptTemplate: 'Elegant salon receipt with beautician name and treatment details',
            status: 'ACTIVE',
            plan: 'GROWTH',
        },
    });
    const pm3Methods = ['Cash', 'QRIS', 'Bank Transfer', 'E-Wallet'];
    for (const name of pm3Methods) {
        await prisma.paymentMethod.upsert({
            where: { tenantId_name: { tenantId: tenant3.id, name } },
            update: {},
            create: { name, tenantId: tenant3.id },
        });
    }
    const owner3Password = await bcrypt.hash('owner123', 12);
    await prisma.user.upsert({
        where: { email: 'adeorseowner@gmail.com' },
        update: {},
        create: {
            email: 'adeorseowner@gmail.com',
            password: owner3Password,
            name: 'Aderose Owner',
            role: 'OWNER',
            status: 'ACTIVE',
            tenantId: tenant3.id,
        },
    });
    const cashier3Password = await bcrypt.hash('cashier123', 12);
    await prisma.user.upsert({
        where: { email: 'aderosechasier@gmail.com' },
        update: {},
        create: {
            email: 'aderosechasier@gmail.com',
            password: cashier3Password,
            name: 'Aderose Cashier',
            role: 'CASHIER',
            status: 'ACTIVE',
            tenantId: tenant3.id,
        },
    });
    const hairCare = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant3.id, name: 'Hair Care' } },
        update: {},
        create: { name: 'Hair Care', description: 'Perawatan rambut profesional', color: '#D4A574', tenantId: tenant3.id },
    });
    const skinCare = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant3.id, name: 'Skin Care' } },
        update: {},
        create: { name: 'Skin Care', description: 'Perawatan kulit wajah dan tubuh', color: '#C9A0DC', tenantId: tenant3.id },
    });
    const bodyCare = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant3.id, name: 'Body Care' } },
        update: {},
        create: { name: 'Body Care', description: 'Perawatan tubuh dan relaksasi', color: '#87CEEB', tenantId: tenant3.id },
    });
    const nailCare = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant3.id, name: 'Nail Care' } },
        update: {},
        create: { name: 'Nail Care', description: 'Perawatan kuku dan nail art', color: '#FFB6C1', tenantId: tenant3.id },
    });
    const makeUpCat = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant3.id, name: 'Make Up' } },
        update: {},
        create: { name: 'Make Up', description: 'Layanan make up profesional', color: '#FFD700', tenantId: tenant3.id },
    });
    const salonServices = [
        { name: 'Hair Spa', sku: 'SLN-HSP-01', description: 'Relaksasi rambut dan kulit kepala dengan aroma therapy premium.', purchasePrice: 45000, sellingPrice: 150000, stock: 99, minStock: 5, categoryId: hairCare.id },
        { name: 'Hair Coloring', sku: 'SLN-HCL-02', description: 'Pewarnaan rambut elegan menggunakan produk profesional.', purchasePrice: 75000, sellingPrice: 250000, stock: 99, minStock: 5, categoryId: hairCare.id },
        { name: 'Hair Cut', sku: 'SLN-HCT-03', description: 'Potongan modern yang disesuaikan dengan bentuk wajah.', purchasePrice: 22500, sellingPrice: 75000, stock: 99, minStock: 5, categoryId: hairCare.id },
        { name: 'Hair Treatment', sku: 'SLN-HTR-04', description: 'Perawatan intensif untuk rambut sehat, lembut, dan berkilau.', purchasePrice: 60000, sellingPrice: 200000, stock: 99, minStock: 5, categoryId: hairCare.id },
        { name: 'Creambath', sku: 'SLN-CRB-05', description: 'Creambath menenangkan dengan pijatan kepala yang nyaman.', purchasePrice: 30000, sellingPrice: 100000, stock: 99, minStock: 5, categoryId: hairCare.id },
        { name: 'Facial', sku: 'SLN-FCL-06', description: 'Facial premium untuk kulit bersih, segar, dan glowing.', purchasePrice: 52500, sellingPrice: 175000, stock: 99, minStock: 5, categoryId: skinCare.id },
        { name: 'Make Up', sku: 'SLN-MKP-07', description: 'Make up flawless untuk pesta, wisuda, prewedding, dan bridal.', purchasePrice: 150000, sellingPrice: 500000, stock: 99, minStock: 5, categoryId: makeUpCat.id },
        { name: 'Nail Art', sku: 'SLN-NAR-08', description: 'Desain kuku feminin, modern, dan tahan lama.', purchasePrice: 37500, sellingPrice: 125000, stock: 99, minStock: 5, categoryId: nailCare.id },
        { name: 'Manicure', sku: 'SLN-MNC-09', description: 'Perawatan tangan dan kuku agar tampak halus serta rapi.', purchasePrice: 25500, sellingPrice: 85000, stock: 99, minStock: 5, categoryId: nailCare.id },
        { name: 'Pedicure', sku: 'SLN-PDC-10', description: 'Perawatan kaki menyeluruh untuk rasa ringan dan bersih.', purchasePrice: 25500, sellingPrice: 85000, stock: 99, minStock: 5, categoryId: nailCare.id },
        { name: 'Eyelash Extension', sku: 'SLN-EXT-11', description: 'Bulu mata lentik natural dengan teknik aman dan presisi.', purchasePrice: 45000, sellingPrice: 150000, stock: 99, minStock: 5, categoryId: skinCare.id },
        { name: 'Body Spa', sku: 'SLN-BSP-12', description: 'Spa tubuh premium untuk melepas lelah dan merawat kulit.', purchasePrice: 90000, sellingPrice: 300000, stock: 99, minStock: 5, categoryId: bodyCare.id },
        { name: 'Body Massage', sku: 'SLN-BMG-13', description: 'Pijat relaksasi dengan tekanan lembut oleh therapist terlatih.', purchasePrice: 60000, sellingPrice: 200000, stock: 99, minStock: 5, categoryId: bodyCare.id },
        { name: 'Waxing', sku: 'SLN-WXG-14', description: 'Waxing higienis untuk kulit terasa lebih halus dan bersih.', purchasePrice: 30000, sellingPrice: 100000, stock: 99, minStock: 5, categoryId: bodyCare.id },
    ];
    for (const service of salonServices) {
        await prisma.product.upsert({
            where: { tenantId_sku: { tenantId: tenant3.id, sku: service.sku } },
            update: {},
            create: { ...service, tenantId: tenant3.id },
        });
    }
    await prisma.customer.createMany({
        skipDuplicates: true,
        data: [
            { name: 'Nadia Putri', phone: '+62 812 3456 7890', email: 'nadia@email.com', tenantId: tenant3.id },
            { name: 'Citra Maharani', phone: '+62 813 9876 5432', email: 'citra@email.com', tenantId: tenant3.id },
        ],
    });
    for (const feature of [feature1, feature2, feature3, featureLandingPage]) {
        await prisma.tenantFeature.upsert({
            where: { tenantId_featureId: { tenantId: tenant3.id, featureId: feature.id } },
            update: {},
            create: {
                tenantId: tenant3.id,
                featureId: feature.id,
                enabled: true,
            },
        });
    }
    console.log(`✅ Tenant 1: ${tenant1.name}`);
    console.log(`✅ Tenant 2: ${tenant2.name}`);
    console.log(`✅ Tenant 3: ${tenant3.name}`);
    console.log(`✅ Exclusive Features: ${feature1.name}, ${feature2.name}, ${feature3.name}, ${featureLandingPage.name}`);
    console.log(`   → POS Features assigned to: ${tenant1.name}, ${tenant3.name}`);
    console.log(`   → Landing Page assigned to: ${tenant3.name}`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Super Admin: admin@kasirpro.com / admin123');
    console.log('   Owner (Bakery): ayu@nusantarabakery.com / owner123');
    console.log('   Cashier (Bakery): raka@nusantarabakery.com / cashier123');
    console.log('   Owner (Grocery): bima@sembako-maju.com / owner123');
    console.log('   Cashier (Grocery): nina@sembako-maju.com / cashier123');
    console.log('   Owner (Salon): adeorseowner@gmail.com / owner123');
    console.log('   Cashier (Salon): aderosechasier@gmail.com / cashier123');
    console.log('');
    console.log('✅ Seeding completed!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map